import fs from 'node:fs/promises';
import path from 'node:path';
import { findPaletteIndexForLegacyColors } from './icon-colors';
import type { TrackerConfig } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TRACKERS_FILE = path.join(DATA_DIR, 'trackers.json');

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

type StoredTracker = TrackerConfig & { mode?: string; iconBadgeColors?: { bg: string; fg: string } };

function migrateLegacyTracker(t: StoredTracker): TrackerConfig {
  const { mode: _m, iconBadgeColors: legacy, ...rest } = t;
  let iconPaletteIndex = rest.iconPaletteIndex;
  if (iconPaletteIndex == null && legacy) {
    const idx = findPaletteIndexForLegacyColors(legacy);
    if (idx != null) iconPaletteIndex = idx;
  }
  const out: TrackerConfig = { ...rest };
  if (iconPaletteIndex != null) out.iconPaletteIndex = iconPaletteIndex;
  return out;
}

export async function getTrackers(): Promise<TrackerConfig[]> {
  try {
    const raw = await fs.readFile(TRACKERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as StoredTracker[];
    return parsed.map(migrateLegacyTracker);
  } catch {
    return [];
  }
}

export async function saveTrackers(trackers: TrackerConfig[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TRACKERS_FILE, JSON.stringify(trackers, null, 2), 'utf-8');
}

export async function addTracker(tracker: TrackerConfig): Promise<void> {
  const trackers = await getTrackers();
  trackers.push(tracker);
  await saveTrackers(trackers);
}

export async function removeTracker(id: string): Promise<boolean> {
  const trackers = await getTrackers();
  const idx = trackers.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  trackers.splice(idx, 1);
  await saveTrackers(trackers);
  return true;
}

export async function getTrackerById(id: string): Promise<TrackerConfig | undefined> {
  const trackers = await getTrackers();
  return trackers.find((t) => t.id === id);
}

export async function updateTracker(id: string, patch: Partial<TrackerConfig>): Promise<boolean> {
  const trackers = await getTrackers();
  const idx = trackers.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  const next: TrackerConfig = { ...trackers[idx], ...patch };
  if ('iconAlias' in patch && patch.iconAlias === undefined) {
    delete next.iconAlias;
  }
  if ('iconPaletteIndex' in patch && patch.iconPaletteIndex === undefined) {
    delete next.iconPaletteIndex;
  }
  trackers[idx] = next;
  await saveTrackers(trackers);
  return true;
}
