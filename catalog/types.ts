export interface Playlist {
  id: string;
  nome: string;
  url: string;
  isCustom?: boolean;
  tier?: 'free' | 'vip' | 'custom';
  content?: string;
}

export type CategoryType = 'live' | 'movie' | 'series';

export interface M3UEntry {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  type: CategoryType;
  seriesNameClean?: string;
  episodes?: M3UEntry[];
  isFavorite?: boolean;
}

export interface GroupedRow {
  id: string;
  title: string;
  logo: string;
  group: string;
  seasons: Record<string, M3UEntry[]>;
  isFavorite?: boolean;
}
