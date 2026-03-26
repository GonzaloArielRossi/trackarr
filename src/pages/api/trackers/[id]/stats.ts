import type { APIRoute } from 'astro';
import { getTrackerById } from '@/lib/storage';
import type { UserStats } from '@/lib/types';

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return Response.json({ error: 'Missing tracker id' }, { status: 400 });

  const tracker = await getTrackerById(id);
  if (!tracker) return Response.json({ error: 'Tracker not found' }, { status: 404 });

  try {
    const res = await fetch(`${tracker.baseUrl}/api/user?api_token=${tracker.apiKey}`);
    if (!res.ok) {
      return Response.json(
        { error: `Tracker returned ${res.status}` },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }
    const stats: UserStats = await res.json();
    return Response.json(stats);
  } catch (err) {
    return Response.json(
      { error: `Failed to reach tracker: ${(err as Error).message}` },
      { status: 502 },
    );
  }
};
