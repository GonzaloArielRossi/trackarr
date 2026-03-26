import type { APIRoute } from 'astro';
import { getTrackerById, removeTracker, updateTracker } from '@/lib/storage';
import type { TrackerConfig } from '@/lib/types';
import { parseIconPaletteIndex } from '@/lib/icon-colors';
import { toTrackerPublic } from '@/lib/tracker-public';
import { normalizeIconAlias } from '@/lib/tracker-alias';

export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return Response.json({ error: 'Missing tracker id' }, { status: 400 });

  const removed = await removeTracker(id);
  if (!removed) return Response.json({ error: 'Tracker not found' }, { status: 404 });

  return Response.json({ ok: true });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) return Response.json({ error: 'Missing tracker id' }, { status: 400 });

  const existing = await getTrackerById(id);
  if (!existing) return Response.json({ error: 'Tracker not found' }, { status: 404 });

  const body = await request.json();
  const { name, baseUrl, apiKey, rssKey, icon, iconAlias, iconPaletteIndex: rawPi } = body as {
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    rssKey?: string;
    icon?: string;
    iconAlias?: string | null;
    iconPaletteIndex?: unknown | null;
  };

  const nextName = name?.trim() ?? existing.name;
  const nextBase = (baseUrl ?? existing.baseUrl).replace(/\/+$/, '');
  const nextApiKey = apiKey !== undefined && apiKey !== '' ? apiKey : existing.apiKey;
  const nextRssKey =
    rssKey !== undefined ? (typeof rssKey === 'string' ? rssKey.trim() : '') : existing.rssKey;
  const nextIcon = icon !== undefined ? icon : existing.icon;

  let nextIconAlias: string | undefined;
  let clearIconAlias = false;
  if (iconAlias !== undefined) {
    if (iconAlias === null || iconAlias === '') {
      clearIconAlias = true;
      nextIconAlias = undefined;
    } else {
      const n = normalizeIconAlias(iconAlias);
      nextIconAlias = n || undefined;
    }
  } else {
    nextIconAlias = existing.iconAlias;
  }

  const finalIcon = nextIcon || 'generic';
  if (finalIcon === 'generic' && nextIconAlias && nextIconAlias.length < 2) {
    return Response.json(
      { error: 'Icon alias must be 2–3 characters when set for a custom badge' },
      { status: 400 },
    );
  }

  if (!nextApiKey.trim() && !nextRssKey.trim()) {
    return Response.json(
      { error: 'At least one of apiKey or rssKey must be set' },
      { status: 400 },
    );
  }

  const baseOrKeyChanged = nextBase !== existing.baseUrl || nextApiKey !== existing.apiKey;

  if (baseOrKeyChanged && nextApiKey) {
    try {
      const res = await fetch(`${nextBase}/api/user?api_token=${nextApiKey}`);
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

  const patch: Partial<TrackerConfig> = {
    name: nextName,
    baseUrl: nextBase,
    apiKey: nextApiKey,
    rssKey: nextRssKey ?? '',
    icon: finalIcon,
  };

  if (finalIcon !== 'generic') {
    patch.iconAlias = undefined;
    patch.iconPaletteIndex = undefined;
  } else {
    if (clearIconAlias) {
      patch.iconAlias = undefined;
    } else if (iconAlias !== undefined && !clearIconAlias) {
      patch.iconAlias = nextIconAlias;
    }

    if (rawPi !== undefined) {
      if (rawPi === null) {
        patch.iconPaletteIndex = undefined;
      } else {
        const p = parseIconPaletteIndex(rawPi);
        if (p === null) {
          return Response.json(
            { error: 'iconPaletteIndex must be an integer from 0 to 19' },
            { status: 400 },
          );
        }
        patch.iconPaletteIndex = p;
      }
    }
  }

  await updateTracker(id, patch);

  const updated = await getTrackerById(id);
  if (!updated) return Response.json({ error: 'Update failed' }, { status: 500 });

  return Response.json(toTrackerPublic(updated));
};
