import React from 'react';

export type PlaceholderKind = 'movie' | 'series' | 'channel';

/** Ilustração (sem texto e sem logo) para quando a imagem não existe ou não carregou. */
export const MediaPlaceholder: React.FC<{ kind: PlaceholderKind; className?: string }> = ({ kind, className = '' }) => {
  const id = `mp-${kind}`;
  return (
    <div className={`media-placeholder ${className}`} role="img" aria-label="">
      <svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1d1236" />
            <stop offset="1" stopColor="#0b0716" />
          </linearGradient>
          <linearGradient id={`${id}-fg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a855f7" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <rect width="200" height="300" fill={`url(#${id}-bg)`} />
        <circle cx="160" cy="50" r="70" fill="#7c3aed" opacity=".12" />
        <circle cx="30" cy="270" r="80" fill="#db2777" opacity=".10" />
        {kind === 'movie' && (
          <g fill="none" stroke={`url(#${id}-fg)`} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 6)">
            <rect x="48" y="118" width="104" height="82" rx="10" />
            <path d="M48 142h104" />
            <path d="M52 118l-6-26 100-20 6 26" />
            <path d="M72 95l10 22M98 90l10 22M124 85l10 22" strokeWidth="6" />
            <path d="M92 158l24 14-24 14z" fill={`url(#${id}-fg)`} stroke="none" />
          </g>
        )}
        {kind === 'series' && (
          <g fill="none" stroke={`url(#${id}-fg)`} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="44" y="104" width="112" height="78" rx="12" />
            <path d="M70 84l30 20 30-20" />
            <path d="M82 202h36M100 182v20" />
            <path d="M92 128l24 15-24 15z" fill={`url(#${id}-fg)`} stroke="none" />
            <path d="M60 222h80" strokeWidth="5" opacity=".5" />
            <path d="M72 236h56" strokeWidth="5" opacity=".3" />
          </g>
        )}
        {kind === 'channel' && (
          <g fill="none" stroke={`url(#${id}-fg)`} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M62 190c-22-26-22-62 0-88M138 190c22-26 22-62 0-88" opacity=".6" />
            <path d="M80 172c-11-15-11-37 0-52M120 172c11-15 11-37 0-52" />
            <circle cx="100" cy="146" r="9" fill={`url(#${id}-fg)`} stroke="none" />
            <path d="M100 160v52M78 212h44" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default MediaPlaceholder;
