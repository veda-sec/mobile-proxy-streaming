// Guarda a lista M3U JÁ BAIXADA POR COMPLETO na memória do aparelho (IndexedDB),
// pra reabrir o app/trocar de lista sem baixar tudo de novo. Só salva listas
// completas; nunca guarda download cortado.
const DB = 'peak_playlist_cache';
const STORE = 'lists';
const MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3h: depois disso baixa de novo

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function playlistCacheGet(url: string): Promise<string | null> {
  try {
    const db = await open();
    return await new Promise((resolve) => {
      const r = db.transaction(STORE).objectStore(STORE).get(url);
      r.onsuccess = () => {
        const v = r.result as { text: string; at: number } | undefined;
        resolve(v && Date.now() - v.at < MAX_AGE_MS && v.text ? v.text : null);
      };
      r.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function playlistCachePut(url: string, text: string): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      st.clear(); // mantém só a lista atual (economiza espaço)
      st.put({ text, at: Date.now() }, url);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch { /* sem cache, segue normal */ }
}
