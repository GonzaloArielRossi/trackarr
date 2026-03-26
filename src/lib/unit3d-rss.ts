import type { TrackerConfig } from './types';

/**
 * UNIT3D exposes authenticated RSS at `/rss/{feedId}.{rsskey}` (see `routes/rss.php`).
 * We use the default preset id; sites may use a different first feed — API key is preferred.
 */
export const UNIT3D_DEFAULT_RSS_FEED_ID = 1;

/** Build a UNIT3D RSS URL from the tracker base URL and RSS key. Returns null if no key. */
export function unit3dRssFeedUrl(tracker: TrackerConfig, rssFeedId = UNIT3D_DEFAULT_RSS_FEED_ID): string | null {
  const key = tracker.rssKey?.trim();
  if (!key) return null;
  const base = tracker.baseUrl.replace(/\/$/, '');
  return `${base}/rss/${rssFeedId}.${key}`;
}
