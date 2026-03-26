import type { APIRoute } from 'astro';
import { fetchLegacyRssAsTorrents } from '@/lib/rss-parse';
import { getTrackers } from '@/lib/storage';
import type { FeedTorrent, TorrentItem, TrackerConfig } from '@/lib/types';
import { toTrackerPublic } from '@/lib/tracker-public';
import { unit3dRssFeedUrl } from '@/lib/unit3d-rss';
import { resolveMissingPosters } from '@/lib/tmdb';

async function trackerTorrentsFromApi(tracker: TrackerConfig): Promise<FeedTorrent[]> {
  const token = tracker.apiKey?.trim();
  if (!token) return [];

  const apiUrl = new URL(`${tracker.baseUrl}/api/torrents/filter`);
  apiUrl.searchParams.set('api_token', token);
  apiUrl.searchParams.set('perPage', '25');
  apiUrl.searchParams.set('sortField', 'bumped_at');
  apiUrl.searchParams.set('sortDirection', 'desc');

  const res = await fetch(apiUrl.toString());
  if (!res.ok) return [];

  const json = await res.json();
  const torrents: TorrentItem[] = json.data ?? json;
  const tp = toTrackerPublic(tracker);

  return torrents.map((t): FeedTorrent => ({ ...t, tracker: tp }));
}

async function trackerTorrentsFromUnit3dRss(tracker: TrackerConfig): Promise<FeedTorrent[]> {
  const url = unit3dRssFeedUrl(tracker);
  if (!url) return [];
  try {
    const items = await fetchLegacyRssAsTorrents(url, tracker.id);
    const tp = toTrackerPublic(tracker);
    return items.map((t): FeedTorrent => ({ ...t, tracker: tp }));
  } catch {
    return [];
  }
}

/** Prefer API when an API key is set; otherwise use UNIT3D RSS if an RSS key is set. */
async function torrentsForTracker(tracker: TrackerConfig): Promise<FeedTorrent[]> {
  if (tracker.apiKey?.trim()) {
    return trackerTorrentsFromApi(tracker);
  }
  if (tracker.rssKey?.trim()) {
    return trackerTorrentsFromUnit3dRss(tracker);
  }
  return [];
}

export const GET: APIRoute = async () => {
  const trackers = await getTrackers();

  const trackerResults = await Promise.allSettled(trackers.map((tracker) => torrentsForTracker(tracker)));

  const allTorrents: FeedTorrent[] = trackerResults
    .filter((r): r is PromiseFulfilledResult<FeedTorrent[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  await resolveMissingPosters(allTorrents);

  allTorrents.sort((a, b) => {
    const dateA = new Date(a.attributes.created_at).getTime();
    const dateB = new Date(b.attributes.created_at).getTime();
    return dateB - dateA;
  });

  return Response.json(allTorrents);
};
