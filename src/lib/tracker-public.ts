import type { TrackerConfig, TrackerPublic } from './types';
import { defaultPaletteIndex, parseIconPaletteIndex } from './icon-colors';

/** Resolved palette index: stored value if valid, else deterministic default from name (same as Add Tracker dialog). */
export function resolveTrackerPaletteIndex(tracker: TrackerConfig): number {
  const p = parseIconPaletteIndex(tracker.iconPaletteIndex);
  if (p !== null) return p;
  return defaultPaletteIndex(tracker.name);
}

/** Public tracker row for API/UI — always includes resolved `iconPaletteIndex` so badges match the dialog. */
export function toTrackerPublic(tracker: TrackerConfig): TrackerPublic {
  return {
    id: tracker.id,
    name: tracker.name,
    baseUrl: tracker.baseUrl,
    icon: tracker.icon ?? 'generic',
    ...(tracker.iconAlias ? { iconAlias: tracker.iconAlias } : {}),
    iconPaletteIndex: resolveTrackerPaletteIndex(tracker),
  };
}
