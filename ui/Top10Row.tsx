import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { CatalogCard } from './CatalogCard';
import { Top10Entry } from '../lib/featured';

interface Top10RowProps {
  entries: Top10Entry[];
  loading: boolean;
  isSeries: boolean;
  favorites: Set<string>;
  onOpen: (item: any) => void;
  onToggleFavorite: (item: { id: string; name: string; type: string }, e: React.MouseEvent) => void;
}

/** Quantos cartazes cabem por tela (igual ao CSS .top10-track): 2 celular, 3 tablet, 5 PC/TV. */
const PAGE_SIZE = typeof window === 'undefined' ? 5 : window.innerWidth >= 1024 ? 5 : window.innerWidth >= 640 ? 3 : 2;

/** Top 10 com três cartazes visíveis, rolagem por gesto e setas de navegação. */
export const Top10Row: React.FC<Top10RowProps> = ({
  entries,
  loading,
  isSeries,
  favorites,
  onOpen,
  onToggleFavorite,
}) => {
  const [pageStart, setPageStart] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageStart(0);
    trackRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [entries]);

  if (entries.length === 0 && !loading) return null;

  const heading = isSeries ? 'Top 10 Séries da Semana' : 'Top 10 Filmes da Semana';
  const subheading = isSeries ? 'As séries mais assistidas' : 'Os filmes mais assistidos';
  const canPage = entries.length > PAGE_SIZE;

  const movePage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
    setPageStart((current) => direction < 0
      ? Math.max(0, current - PAGE_SIZE)
      : Math.min(Math.max(0, entries.length - PAGE_SIZE), current + PAGE_SIZE));
  };

  return (
    <section className="popular-poster-row space-y-3 relative" aria-label={heading}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
          <h3 className="text-sm font-black tracking-wide text-white uppercase truncate">{heading}</h3>
          <span className="hidden sm:inline text-[10px] text-zinc-500 font-bold shrink-0">{subheading}</span>
        </div>
        {canPage && (
          <div className="top10-row-controls" aria-label={`Navegar por ${heading}`}>
            <button
              type="button"
              onClick={() => movePage(-1)}
              disabled={pageStart === 0}
              aria-label="Rolar Top 10 para a esquerda"
              title="Anteriores"
              data-tv-focusable="true"
            ><ChevronLeft className="w-5 h-5" /></button>
            <button
              type="button"
              onClick={() => movePage(1)}
              disabled={pageStart + PAGE_SIZE >= entries.length}
              aria-label="Rolar Top 10 para a direita"
              title="Próximos"
              data-tv-focusable="true"
            ><ChevronRight className="w-5 h-5" /></button>
          </div>
        )}
      </div>

      <div
        className="top10-track"
        ref={trackRef}
        onScroll={() => {
          const track = trackRef.current;
          if (!track || track.clientWidth === 0) return;
          const lastStart = Math.max(0, entries.length - PAGE_SIZE);
          const visibleStart = Math.min(lastStart, Math.round((track.scrollLeft / track.clientWidth) * PAGE_SIZE));
          setPageStart((current) => current === visibleStart ? current : visibleStart);
        }}
      >
        {entries.length === 0 ? (
          [0, 1, 2].map((i) => <div key={i} className="top10-skeleton" aria-hidden="true" />)
        ) : entries.map((entry, index) => {
          const item: any = entry.item;
          const rank = index + 1;
          const titleText: string = isSeries ? (item.title || item.name) : (item.name || item.title);
          const itemId: string = item.id || titleText;
          const isFav = favorites.has(itemId) || favorites.has(titleText) || favorites.has(item.name);

          return (
            <div key={entry.key} className="top10-slide">
              <span aria-hidden="true" className="top10-rank">{rank}</span>
              <span className="top10-badge">TOP {rank}</span>
              <div className="top10-card-wrap">
                <CatalogCard
                  hideTypeBadge
                  item={item}
                  isSeriesType={isSeries}
                  isLive={false}
                  titleText={titleText}
                  posterUrl={entry.posterUrl}
                  isFavorite={isFav}
                  onToggleFavorite={(id, e) =>
                    onToggleFavorite({ id, name: titleText, type: isSeries ? 'series' : 'movie' }, e)
                  }
                  onClick={() => onOpen(item)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
