import { M3UEntry, CategoryType, GroupedRow } from '../types';

// Hash determinístico curto (djb2) — mesmo texto de entrada sempre gera a
// mesma saída, em qualquer navegador/carregamento, sem depender da posição
// da linha no arquivo. Usado pra gerar IDs de item estáveis entre reloads.
function stableHash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

export function categorizeEntry(group: string, name: string, url: string): CategoryType {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const gUpper = normalize(group || '');
  const nUpper = normalize(name || '');
  const uUpper = (url || '').toUpperCase();

  // 1. Verificação inequívoca pela URL do stream (padrão Xtream Codes / IPTV)
  if (uUpper.includes('/SERIES/')) return 'series';
  if (uUpper.includes('/MOVIE/') || uUpper.includes('/MOVIES/') || uUpper.includes('/VOD/')) return 'movie';
  if (uUpper.includes('/LIVE/') || uUpper.includes('/CHANNELS/') || uUpper.includes('/LINEAR/')) return 'live';

  // 2. Marcadores inequívocos de episódio no nome -> SEMPRE é série
  // Suporta S01E01, S1E1, T01E01, S01EP01, Temp 1 Ep 2, Episodio 01, etc.
  const hasEpisodePattern = 
    /\b[ST]\d{1,2}\s*[EX]\d{1,4}\b/i.test(name) ||
    /\b[ST]\d{1,2}\s*EP\s*\d{1,4}\b/i.test(name) ||
    /\b(?:TEMPORADA|SEASON|TEMP)\s*\d{1,2}\b.*\b(?:EP|EPIS[OÓ]DIO|EPISODIO|CAP[IÍ]TULO|CAPITULO)\s*\d{1,4}\b/i.test(name) ||
    /\b(?:EP|EPISÓDIO|EPISODIO|CAPÍTULO|CAPITULO)\s*\.?\s*\d{1,4}\b/i.test(name);

  if (hasEpisodePattern) {
    return 'series';
  }

  // 3. Marcadores de Série pelo Grupo
  const isSeriesGroup = 
    /\b(?:SERIES?|S[EÉ]RIES?|TEMPORADAS?|SEASONS?|NOVELAS?|DORAMAS?|ANIMES?)\b/i.test(gUpper);

  if (isSeriesGroup) {
    // Se o grupo é de animes/séries/novelas e o arquivo é de vídeo sob demanda (.mp4, .mkv), é série
    if (uUpper.endsWith('.MP4') || uUpper.endsWith('.MKV') || uUpper.endsWith('.AVI') || uUpper.endsWith('.MOV')) {
      return 'series';
    }
    // Se o grupo é explicitamente de séries/temporadas
    if (gUpper.includes('SERIE') || gUpper.includes('SERIES') || gUpper.includes('TEMPORADA') || gUpper.includes('SEASON') || gUpper.includes('NOVELA') || gUpper.includes('DORAMA')) {
      return 'series';
    }
  }

  // 4. Marcadores de Filmes / VOD pelo Grupo ou Extensão
  const isVodGroup = 
    /\b(?:FILMES?|MOVIES?|VOD|LAN[CÇ]AMENTOS?|CINEMA|4K\s*FILMES|FILMES\s*4K)\b/i.test(gUpper);

  // Canais de cinema ao vivo (ex: TELECINE PREMIUM) não devem virar filme só por causa do nome TELECINE,
  // exceto se a URL for arquivo sob demanda (.mp4, .mkv)
  const isLiveCinemaChannel = /\b(?:TELECINE|HBO|MAX|CINE|PARAMOUNT)\b/i.test(nUpper) && 
    (uUpper.endsWith('.M3U8') || uUpper.endsWith('.TS') || !/\.(mp4|mkv|avi)$/i.test(uUpper));

  if (isVodGroup && !isLiveCinemaChannel) {
    return 'movie';
  }

  // 5. Extensões diretas de vídeo sob demanda (MP4, MKV, AVI, MOV)
  if (uUpper.endsWith('.MP4') || uUpper.endsWith('.MKV') || uUpper.endsWith('.AVI') || uUpper.endsWith('.MOV')) {
    return 'movie';
  }

  // 6. Marcadores fortes de Canal Ao Vivo (Live TV)
  const liveGroup = 
    /\b(?:CANAL|CANAIS|TV|AO\s*VIVO|LIVE|ABERTOS|NOTICIAS|NEWS|ESPORTES|SPORTS|VARIEDADES|INFANTIL|DOCUMENTARIOS|RELIGIOSOS|24\s*(?:H|HORAS?)|PPV|PREMIERE|DAZN)\b/i.test(gUpper);
  const liveName = 
    /^(?:CANAL|TV|AO\s*VIVO|LIVE)\b/i.test(name) ||
    /\b(?:PPV|DAZN|PREMIERE|ESPN|SPORTV|GLOBO|SBT|RECORD|BAND|CNN|TELECINE|24\s*(?:H|HORAS?))\b/i.test(nUpper);

  if (liveGroup || liveName) {
    return 'live';
  }

  // 7. Streaming VOD de plataformas (Netflix, Prime, etc.) quando não for canal
  if (
    gUpper.includes('NETFLIX') || 
    gUpper.includes('AMAZON') || 
    gUpper.includes('PRIME') || 
    gUpper.includes('PARALELO')
  ) {
    return 'movie';
  }

  // 8. Se contém ano no nome (ex: "Nome do Filme (2024)") e não tem cara de canal ao vivo
  if (/\b(19|20)\d{2}\b/.test(name) && !liveName && !liveGroup) {
    return 'movie';
  }

  return 'live';
}

export const parseM3U = (text: string): M3UEntry[] => {
  const lines = text.split(/\r?\n/);
  const entries: M3UEntry[] = [];
  let currentEntry: Partial<M3UEntry> | null = null;
  let counter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentEntry = {};
      counter++;
      
      // Parse attributes (e.g. key="value")
      let match;
      const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
      while ((match = attrRegex.exec(line)) !== null) {
        const key = match[1].toLowerCase();
        const value = match[2].trim();
        
        if (key === 'tvg-id') {
          currentEntry.id = value;
        } else if (key === 'tvg-logo' || key === 'logo') {
          currentEntry.logo = value;
        } else if (key === 'group-title' || key === 'group') {
          currentEntry.group = value;
        }
      }

      // If tvg-name tag is present but we haven't read name yet
      const tvgNameMatch = /tvg-name="([^"]*)"/i.exec(line);
      const tvgName = tvgNameMatch ? tvgNameMatch[1].trim() : '';

      // The real display name is after the final comma
      const lastCommaIndex = line.lastIndexOf(',');
      let displayName = '';
      if (lastCommaIndex !== -1) {
        displayName = line.substring(lastCommaIndex + 1).trim();
      } else {
        displayName = tvgName || 'Conteúdo sem Nome';
      }

      currentEntry.name = displayName;
      if (!currentEntry.group) {
        currentEntry.group = 'Geral';
      }
    } else if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentEntry) {
        currentEntry.url = line;
        
        // 🔧 CORRIGIDO: o ID de cada item era baseado em "counter" (a
        // posição em que a linha aparece no arquivo) — inclusive quando
        // já existia um tvg-id estável, o código ainda colava um
        // "_contador" em cima dele! Isso quebrava os favoritos toda vez
        // que a playlist era recarregada (o mesmo canal/filme ganhava um
        // ID diferente se qualquer linha fosse adicionada/removida antes
        // dele no arquivo, ou ao trocar de servidor) — o favorito salvo
        // com o ID antigo nunca mais batia com o novo, parecendo "sumido"
        // ou impossível de desfavoritar. Agora o ID é sempre determinado
        // pelo CONTEÚDO (tvg-id, ou grupo+nome+url), nunca pela posição —
        // o mesmo item sempre gera o mesmo ID, em qualquer carregamento.
        const groupNameForId = currentEntry.group || 'Geral';
        const nameForId = currentEntry.name || 'Conteúdo sem Nome';
        const contentHash = stableHash(`${groupNameForId}|${nameForId}|${line}`);
        if (currentEntry.id) {
          // Já tinha tvg-id: mantém ele (é a chave mais estável possível),
          // só acrescenta o hash de conteúdo pra evitar colisão quando o
          // mesmo tvg-id se repete em vários itens distintos da lista.
          currentEntry.id = `${currentEntry.id}_${contentHash}`;
        } else {
          currentEntry.id = `item_${contentHash}`;
        }
        
        const groupName = currentEntry.group || 'Geral';
        const name = currentEntry.name || 'Conteúdo sem Nome';
        
        currentEntry.type = categorizeEntry(groupName, name, line);
        
        entries.push(currentEntry as M3UEntry);
        currentEntry = null;
      }
    }
  }

  return entries;
};

export function cleanSeriesName(name: string): string {
  let cleaned = name;

  // Remove S00E00 patterns (like S01E01, s01e01, S1E1, S01E001, T01E01, T1E1, etc.)
  cleaned = cleaned.replace(/\s*\b[SSTt]\d{1,2}\s*[EeXx]\d{1,4}\b.*/i, '');
  
  // Remove "Temporada X" or "Season X" patterns
  cleaned = cleaned.replace(/\s*\b(TEMPORADA|SEASON|TEMP|SEAS)\s*\d{1,2}\b.*/i, '');

  // Remove standalone S01, S1, T1 patterns (like "One Piece S01", "One Piece T1")
  cleaned = cleaned.replace(/\s*\b[SSTt]\d{1,2}\b.*/i, '');
  
  // Remove EP, EP01, Ep. 01, Episodio 01
  cleaned = cleaned.replace(/\s*\b(EPISÓDIO|EPISODIO|EP|EP\.)\s*\d{1,4}\b.*/i, '');
  
  // Remove trailing E01 or E1 patterns at the end
  cleaned = cleaned.replace(/\s*\b[EeXx]\d{1,4}\b.*/i, '');

  // Remove common format/quality tags: [DUBLADO], (dublado), [legendado], 1080p, 4k etc.
  cleaned = cleaned.replace(/\s*[\[\(\]\}](DUBLADO|DUBL|LEGENDADO|LEG|4K|1080P|720P|FHD|HD|SD)[\]\)\}\s]*/i, '');

  // Also remove standalone tags at the end of the line
  cleaned = cleaned.replace(/\s+\b(DUBLADO|DUBL|LEGENDADO|LEG|4K|1080P|720P|FHD|HD|SD)\b/i, '');

  // Remove standalone years at the end (ex: "Dr. Stone 2019" -> "Dr. Stone", "Clevatess 2025" -> "Clevatess")
  cleaned = cleaned.replace(/\s*\((?:19|20)\d{2}\)\s*$/i, '');
  cleaned = cleaned.replace(/\s+\b(?:19|20)\d{2}\b\s*$/i, '');

  // Remove trailing dashes, slashes, or spaces
  cleaned = cleaned.trim().replace(/[\s\-–—/|:]+$/, '');

  return cleaned || name;
}

/**
 * Extracts a human-readable season label from an episode's raw name.
 * Supports S01E01, S1E1, T01E01, "Temporada 1", "Season 1", etc.
 * Falls back to "Temporada 1" when no season marker is found (e.g. mini-series
 * where every episode is listed without a season tag).
 */
export function extractSeasonLabel(name: string): string {
  const seMatch = /\b[ST](\d{1,2})\s*[EX]\d{1,4}\b/i.exec(name);
  if (seMatch) {
    return `Temporada ${parseInt(seMatch[1], 10)}`;
  }

  const wordMatch = /\b(?:TEMPORADA|SEASON|TEMP|SEAS)\s*(\d{1,2})\b/i.exec(name);
  if (wordMatch) {
    return `Temporada ${parseInt(wordMatch[1], 10)}`;
  }

  const standaloneMatch = /\b[ST](\d{1,2})\b/i.exec(name);
  if (standaloneMatch) {
    return `Temporada ${parseInt(standaloneMatch[1], 10)}`;
  }

  return 'Temporada 1';
}

/**
 * Retorna os nomes das temporadas de uma série (as chaves de `seasons`) já
 * ordenados numericamente: "Temporada 1", "Temporada 2", ... "Temporada 10".
 * Sem isso, a ordem seguia a ordem de inserção (a ordem em que os episódios
 * apareceram na playlist M3U), o que fazia a Temporada 2 aparecer antes da
 * Temporada 1, ou a 4 antes da 2, etc.
 */
export function getSortedSeasonNames(seasons: Record<string, unknown>): string[] {
  return Object.keys(seasons).sort((a, b) => {
    const numA = parseInt(/(\d+)/.exec(a)?.[1] || '0', 10);
    const numB = parseInt(/(\d+)/.exec(b)?.[1] || '0', 10);
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Groups flat series episode entries into GroupedRow objects (one per series),
 * each containing a map of season label -> sorted episode list, ready to be
 * rendered as a card and expanded into the season/episode picker modal.
 */
const episodeCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function groupSeriesEntries(entries: M3UEntry[]): GroupedRow[] {
  // normKey -> GroupedRow (unifica todas as temporadas e episódios da mesma série sob o mesmo card)
  const seriesMap: Record<string, GroupedRow> = {};

  for (const entry of entries) {
    if (entry.type !== 'series') continue;

    const cleanName = cleanSeriesName(entry.name);
    const normKey = cleanName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const groupName = entry.group || 'Geral';
    const seasonLabel = extractSeasonLabel(entry.name);

    if (!seriesMap[normKey]) {
      seriesMap[normKey] = {
        id: `series_${normKey}`,
        title: cleanName,
        logo: entry.logo,
        group: groupName,
        seasons: {}
      };
    } else {
      if (!seriesMap[normKey].logo && entry.logo) {
        seriesMap[normKey].logo = entry.logo;
      }
    }

    const row = seriesMap[normKey];
    if (!row.seasons[seasonLabel]) {
      row.seasons[seasonLabel] = [];
    }

    // Evita duplicatas idênticas de episódio
    if (!row.seasons[seasonLabel].some(e => e.url === entry.url)) {
      row.seasons[seasonLabel].push(entry);
    }
  }

  const result: GroupedRow[] = [];
  for (const key in seriesMap) {
    const row = seriesMap[key];
    for (const seasonLabel in row.seasons) {
      row.seasons[seasonLabel].sort((a, b) => episodeCollator.compare(a.name, b.name));
    }
    result.push(row);
  }

  return result;
}
