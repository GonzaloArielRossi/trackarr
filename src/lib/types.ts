export interface TrackerConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  rssKey: string;
  icon: string;
  /** 2–3 letters shown on generated icons when `icon` is `generic` */
  iconAlias?: string;
  /** Index into BADGE_PALETTES (0–19); if omitted, badge colors derive from name. */
  iconPaletteIndex?: number;
}

export interface TrackerPublic {
  id: string;
  name: string;
  baseUrl: string;
  icon: string;
  iconAlias?: string;
  iconPaletteIndex?: number;
}

export interface UserStats {
  username: string;
  group: string;
  uploaded: string;
  downloaded: string;
  ratio: string;
  buffer: string;
  seeding: number;
  leeching: number;
  seedbonus: string;
  hit_and_runs: number;
}

export interface TorrentMeta {
  poster: string;
  genres: string;
}

export interface TorrentAttributes {
  meta: TorrentMeta;
  name: string;
  release_year: string | null;
  category: string;
  type: string;
  resolution: string;
  size: number;
  freeleech: string;
  double_upload: boolean;
  internal: number;
  personal_release: boolean;
  uploader: string;
  seeders: number;
  leechers: number;
  times_completed: number;
  tmdb_id: number | null;
  imdb_id: number;
  created_at: string;
  download_link: string;
  details_link: string;
}

export interface TorrentItem {
  type: 'torrent';
  id: string;
  attributes: TorrentAttributes;
}

export interface FeedTorrent extends TorrentItem {
  tracker: TrackerPublic;
}

export interface TrackerRegistryEntry {
  name: string;
  baseUrl: string;
  icon: string;
}
