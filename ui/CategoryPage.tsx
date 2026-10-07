import React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/** 5 linhas × 6 colunas no PC/TV = 30 itens por página (no celular são 3 colunas × 10 linhas). */
export const CATEGORY_PAGE_SIZE = 30;

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Números das páginas: 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(total - 1, page + 1);
  if (from > 2) out.push('…');
  for (let p = from; p <= to; p++) out.push(p);
  if (to < total - 1) out.push('…');
  out.push(total);
  return out;
}

/** Barra "‹ 1 2 3 … N ›" no rodapé da lista (estilo AnimeFire). */
export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const btn =
    'min-w-[38px] h-[38px] sm:min-w-[44px] sm:h-[44px] px-2 flex items-center justify-center rounded-full text-sm font-bold transition cursor-pointer';
  const idle = 'bg-white/10 hover:bg-purple-600 text-zinc-100 hover:text-white';
  const disabled = 'bg-white/5 text-zinc-600 cursor-default';

  return (
    <nav aria-label="Páginas" className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-8">
      <button
        type="button"
        onClick={() => onChange(1)}
        disabled={page <= 1}
        aria-label="Primeira página"
        data-tv-focusable="true"
        className={`${btn} hidden sm:flex ${page <= 1 ? disabled : idle}`}
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        data-tv-focusable="true"
        className={`${btn} ${page <= 1 ? disabled : idle}`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {pageWindow(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-zinc-500 font-bold select-none">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            data-tv-focusable="true"
            className={`${btn} ${p === page ? 'bg-white text-black shadow-lg' : idle}`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima página"
        data-tv-focusable="true"
        className={`${btn} ${page >= totalPages ? disabled : idle}`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => onChange(totalPages)}
        disabled={page >= totalPages}
        aria-label="Última página"
        data-tv-focusable="true"
        className={`${btn} hidden sm:flex ${page >= totalPages ? disabled : idle}`}
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </nav>
  );
};

interface CategoryGridProps {
  items: any[];
  page: number;
  onPageChange: (page: number) => void;
  /** 'channel' usa blocos largos (logo do canal); 'poster' usa cartazes em pé */
  variant: 'poster' | 'channel';
  renderItem: (item: any) => React.ReactNode;
  getKey: (item: any) => string;
}

/** Grade paginada (30 por página) + barra de páginas embaixo. */
export const CategoryGrid: React.FC<CategoryGridProps> = ({ items, page, onPageChange, variant, renderItem, getKey }) => {
  const totalPages = Math.max(1, Math.ceil(items.length / CATEGORY_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const slice = items.slice((safePage - 1) * CATEGORY_PAGE_SIZE, safePage * CATEGORY_PAGE_SIZE);

  return (
    <>
      <div className={variant === 'channel' ? 'peak-grid peak-grid-channel' : 'peak-grid'}>
        {slice.map((item) => (
          <div key={getKey(item)} className="min-w-0">
            {renderItem(item)}
          </div>
        ))}
      </div>
      <Pagination page={safePage} totalPages={totalPages} onChange={onPageChange} />
      <p className="text-center text-[11px] font-semibold text-zinc-600 pt-3">
        Página {safePage} de {totalPages} • {items.length} {items.length === 1 ? 'item' : 'itens'}
      </p>
    </>
  );
};

interface CategoryPageProps extends Omit<CategoryGridProps, 'page' | 'onPageChange'> {
  title: string;
  page: number;
  onPageChange: (page: number) => void;
  onBack: () => void;
}

/** Tela "Ver mais" de uma categoria: título, botão voltar, grade 5×6 e páginas. */
export const CategoryPage: React.FC<CategoryPageProps> = ({ title, onBack, ...grid }) => (
  <div className="px-4 sm:px-8 xl:px-12 2xl:px-16 pt-4 pb-16">
    <div className="flex items-center gap-3 mb-5 sm:mb-7">
      <button
        type="button"
        onClick={onBack}
        aria-label="Voltar"
        data-tv-focusable="true"
        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-purple-600 text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="min-w-0">
        <h2 className="text-xl sm:text-3xl font-black text-white leading-tight truncate">{title}</h2>
        <p className="text-[11px] sm:text-xs font-semibold text-zinc-500">
          {grid.items.length} {grid.items.length === 1 ? 'item' : 'itens'}
        </p>
      </div>
    </div>
    <CategoryGrid {...grid} />
  </div>
);
