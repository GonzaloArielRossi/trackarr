import type { TorrentItem } from './types';

const PLACEHOLDER = 'https://via.placeholder.com/90x135';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const posterCache = new Map<string, string | null>();

function getTmdbApiKey(): string | undefined {
  return (
    import.meta.env.TMDB_API_KEY ??
    import.meta.env.PUBLIC_TMDB_API_KEY ??
    process.env.TMDB_API_KEY
  );
}

function needsPoster(poster: string | undefined): boolean {
  return !poster || poster === PLACEHOLDER || poster.includes('placeholder');
}

async function fetchPosterPath(
  tmdbId: number,
  type: 'movie' | 'tv',
  apiKey: string,
): Promise<string | null> {
  const cacheKey = `${type}-${tmdbId}`;
  if (posterCache.has(cacheKey)) return posterCache.get(cacheKey)!;

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${apiKey}`,
    );
    if (!res.ok) {
      posterCache.set(cacheKey, null);
      return null;
    }
    const data = await res.json();
    const path: string | null = data.poster_path ?? null;
    posterCache.set(cacheKey, path);
    return path;
  } catch {
    posterCache.set(cacheKey, null);
    return null;
  }
}

/**
 * For torrents missing poster images, attempt to resolve them via TMDB API.
 * Mutates the torrent items in place for efficiency.
 */
export async function resolveMissingPosters(torrents: TorrentItem[]): Promise<void> {
  const apiKey = getTmdbApiKey();
  if (!apiKey) return;

  const toResolve = torrents.filter(
    (t) => needsPoster(t.attributes.meta?.poster) && t.attributes.tmdb_id,
  );

  if (toResolve.length === 0) return;

  const seen = new Set<string>();
  const fetches: Promise<void>[] = [];

  for (const t of toResolve) {
    const tmdbId = t.attributes.tmdb_id!;
    const category = t.attributes.category?.toLowerCase() ?? '';
    const type: 'movie' | 'tv' =
      category.includes('tv') || category.includes('serie') || category.includes('show')
        ? 'tv'
        : 'movie';
    const key = `${type}-${tmdbId}`;

    if (seen.has(key)) continue;
    seen.add(key);

    fetches.push(
      fetchPosterPath(tmdbId, type, apiKey).then((path) => {
        if (!path) return;
        const url = `${TMDB_IMG_BASE}${path}`;
        for (const item of toResolve) {
          if (item.attributes.tmdb_id === tmdbId) {
            item.attributes.meta = {
              ...item.attributes.meta,
              poster: url,
            };
          }
        }
      }),
    );
  }

  await Promise.allSettled(fetches);
}
