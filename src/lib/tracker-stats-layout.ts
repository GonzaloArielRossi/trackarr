export type TrackerStatsLayout = 'strip' | 'grid' | 'list';

const STORAGE_KEY = 'trackarr_tracker_stats_layout';

export function readStoredTrackerStatsLayout(): TrackerStatsLayout {
  if (typeof window === 'undefined') return 'strip';
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === 'grid' || v === 'list' || v === 'strip') return v;
  return 'strip';
}

export function persistTrackerStatsLayout(layout: TrackerStatsLayout): void {
  localStorage.setItem(STORAGE_KEY, layout);
}
