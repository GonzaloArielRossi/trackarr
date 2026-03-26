import type { APIRoute } from 'astro';
import { getTrackers, addTracker } from '@/lib/storage';
import type { TrackerConfig } from '@/lib/types';
import { parseIconPaletteIndex } from '@/lib/icon-colors';
import { toTrackerPublic } from '@/lib/tracker-public';
import { normalizeIconAlias } from '@/lib/tracker-alias';

export const GET: APIRoute = async () => {
  const trackers = await getTrackers();
  return Response.json(trackers.map(toTrackerPublic));
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { name, baseUrl, apiKey, rssKey, icon, iconAlias, iconPaletteIndex: rawPi } = body as {
    name: string;
    baseUrl: string;
    apiKey?: string;
    rssKey?: string;
    icon: string;
    iconAlias?: string;
    iconPaletteIndex?: unknown;
  };

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedBase = typeof baseUrl === 'string' ? baseUrl.trim() : '';
  const trimmedApi = typeof apiKey === 'string' ? apiKey.trim() : '';
  const trimmedRss = typeof rssKey === 'string' ? rssKey.trim() : '';

  if (!trimmedName || !trimmedBase) {
    return Response.json({ error: 'name and baseUrl are required' }, { status: 400 });
  }

  if (!trimmedApi && !trimmedRss) {
    return Response.json({ error: 'Provide at least one of apiKey or rssKey' }, { status: 400 });
  }

  const normalizedUrl = trimmedBase.replace(/\/+$/, '');
  const normalizedAlias = normalizeIconAlias(iconAlias);
  const iconId = icon || 'generic';

  let paletteIndex: number | undefined;
  if (rawPi !== undefined && rawPi !== null) {
    const p = parseIconPaletteIndex(rawPi);
    if (p === null) {
      return Response.json({ error: 'iconPaletteIndex must be an integer from 0 to 19' }, { status: 400 });
    }
    paletteIndex = p;
  }

  if (iconId === 'generic' && normalizedAlias && normalizedAlias.length < 2) {
    return Response.json(
      { error: 'Icon alias must be 2–3 letters or numbers when using a custom badge' },
      { status: 400 },
    );
  }

  if (trimmedApi) {
    try {
      const res = await fetch(`${normalizedUrl}/api/user?api_token=${trimmedApi}`);
      if (!res.ok) {
        return Response.json(
          { error: `Tracker returned ${res.status}. Check your API key and URL.` },
          { status: 422 },
        );
      }
      const userData = await res.json();
      if (!userData.username) {
        return Response.json({ error: 'Invalid response from tracker' }, { status: 422 });
      }
    } catch (err) {
      return Response.json(
        { error: `Could not reach tracker: ${(err as Error).message}` },
        { status: 422 },
      );
    }
  }

  const tracker: TrackerConfig = {
    id: `${trimmedName.toLowerCase().replace(/\W+/g, '-')}-${Date.now().toString(36)}`,
    name: trimmedName,
    baseUrl: normalizedUrl,
    apiKey: trimmedApi,
    rssKey: trimmedRss,
    icon: iconId,
    ...(normalizedAlias ? { iconAlias: normalizedAlias } : {}),
    ...(paletteIndex !== undefined ? { iconPaletteIndex: paletteIndex } : {}),
  };

  await addTracker(tracker);
  return Response.json(toTrackerPublic(tracker), { status: 201 });
};
