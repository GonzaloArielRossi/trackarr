import { useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TrackerPublic, UserStats } from '@/lib/types';
import {
  persistTrackerStatsLayout,
  readStoredTrackerStatsLayout,
  type TrackerStatsLayout,
} from '@/lib/tracker-stats-layout';
import TrackerStatsCard from './TrackerStatsCard';
import TrackerStatsLayoutPicker from './TrackerStatsLayoutPicker';

interface TrackerStatsPanelProps {
  trackers: TrackerPublic[];
  onEditTracker: (tracker: TrackerPublic) => void;
}

export default function TrackerStatsPanel({ trackers, onEditTracker }: TrackerStatsPanelProps) {
  const { t } = useTranslation();
  const [statsMap, setStatsMap] = useState<Record<string, { stats: UserStats | null; loading: boolean; error: string | null }>>({});
  const [layout, setLayout] = useState<TrackerStatsLayout>('strip');

  useLayoutEffect(() => {
    setLayout(readStoredTrackerStatsLayout());
  }, []);

  function handleLayoutChange(next: TrackerStatsLayout) {
    setLayout(next);
    persistTrackerStatsLayout(next);
  }

  useEffect(() => {
    for (const tracker of trackers) {
      if (statsMap[tracker.id]) continue;

      setStatsMap((prev) => ({
        ...prev,
        [tracker.id]: { stats: null, loading: true, error: null },
      }));

      fetch(`/api/trackers/${tracker.id}/stats`)
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(body.error || `HTTP ${res.status}`);
          }
          return res.json() as Promise<UserStats>;
        })
        .then((stats) => {
          setStatsMap((prev) => ({
            ...prev,
            [tracker.id]: { stats, loading: false, error: null },
          }));
        })
        .catch((err) => {
          setStatsMap((prev) => ({
            ...prev,
            [tracker.id]: { stats: null, loading: false, error: (err as Error).message },
          }));
        });
    }
  }, [trackers]);

  if (trackers.length === 0) return null;

  const cardLayoutClass =
    layout === 'strip' ? 'min-w-[280px] shrink-0 snap-start' : 'min-w-0 w-full';

  const containerClass =
    layout === 'strip'
      ? 'flex flex-nowrap gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-gutter:stable] snap-x snap-mandatory [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-surface-600 [&::-webkit-scrollbar-track]:bg-transparent'
      : layout === 'grid'
        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3'
        : 'flex flex-col gap-4';

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('stats.sectionTitle')}</h2>
        <TrackerStatsLayoutPicker value={layout} onChange={handleLayoutChange} />
      </div>
      <div className={containerClass}>
        {trackers.map((tracker) => {
          const entry = statsMap[tracker.id] ?? { stats: null, loading: true, error: null };
          return (
            <TrackerStatsCard
              key={tracker.id}
              className={cardLayoutClass}
              tracker={tracker}
              stats={entry.stats}
              loading={entry.loading}
              error={entry.error}
              onEdit={onEditTracker}
            />
          );
        })}
      </div>
    </section>
  );
}
