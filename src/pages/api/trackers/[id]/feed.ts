import type { APIRoute } from 'astro';
import { getTrackerById } from '@/lib/storage';
import type { TorrentItem } from '@/lib/types';
import { resolveMissingPosters } from '@/lib/tmdb';

export const GET: APIRoute = async ({ params, url }) => {
  const { id } = params;
  if (!id) return Response.json({ error: 'Missing tracker id' }, { status: 400 });

  const tracker = await getTrackerById(id);
  if (!tracker) return Response.json({ error: 'Tracker not found' }, { status: 404 });

  const perPage = url.searchParams.get('perPage') || '25';

  try {
    const apiUrl = new URL(`${tracker.baseUrl}/api/torrents/filter`);
    apiUrl.searchParams.set('api_token', tracker.apiKey);
    apiUrl.searchParams.set('perPage', perPage);
    apiUrl.searchParams.set('sortField', 'bumped_at');
    apiUrl.searchParams.set('sortDirection', 'desc');

    const res = await fetch(apiUrl.toString());
    if (!res.ok) {
      return Response.json(
        { error: `Tracker returned ${res.status}` },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }
    const data = await res.json();
    const torrents: TorrentItem[] = data.data ?? data;

    await resolveMissingPosters(torrents);

    return Response.json(Array.isArray(data.data) ? { ...data, data: torrents } : torrents);
  } catch (err) {
    return Response.json(
      { error: `Failed to reach tracker: ${(err as Error).message}` },
      { status: 502 },
    );
  }
};
