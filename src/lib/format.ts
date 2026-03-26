import type { TFunction } from 'i18next';

const TMDB_SIZE_RE = /\/t\/p\/(?:w\d+|original)\//;

const PLACEHOLDER_POSTER = 'https://via.placeholder.com/90x135';

/**
 * UNIT3D returns TMDB poster URLs at poster_small (w92).
 * Rewrite to w500 for crisp display in poster grids.
 */
export function upgradePosterUrl(url: string): string {
  if (!url) return url;
  return url.replace(TMDB_SIZE_RE, '/t/p/w500/');
}

/**
 * Poster URL for feed cards: TMDB upgraded; other hosts proxied (hotlink / mixed-content).
 */
export function feedPosterSrc(url: string): string {
  if (!url || url === PLACEHOLDER_POSTER) return url;
  if (url.includes('image.tmdb.org')) return upgradePosterUrl(url);
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export function timeAgo(dateStr: string, t: TFunction): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return t('time.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('time.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('time.daysAgo', { count: days });
  const months = Math.floor(days / 30);
  return t('time.monthsAgo', { count: months });
}
