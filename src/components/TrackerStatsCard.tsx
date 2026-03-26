import {
  ArrowUp,
  ArrowDown,
  Stack,
  Coins,
  Warning,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import type { TrackerPublic, UserStats } from '@/lib/types';
import { PencilSimple } from '@phosphor-icons/react';
import TrackerIcon from './TrackerIcon';

interface TrackerStatsCardProps {
  tracker: TrackerPublic;
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  onEdit: (tracker: TrackerPublic) => void;
  /** Overrides default min-width (e.g. strip vs grid). */
  className?: string;
}

function StatRow({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">{icon}</span>
      <span className="flex-1 text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-medium tabular-nums ${valueClass ?? 'text-gray-100'}`}>{value}</span>
    </div>
  );
}

export default function TrackerStatsCard({ tracker, stats, loading, error, onEdit, className }: TrackerStatsCardProps) {
  const { t } = useTranslation();
  const ratioValue = stats ? parseFloat(stats.ratio) : 0;
  const ratioColor = stats
    ? ratioValue >= 1 ? 'text-success-400' : 'text-danger-400'
    : 'text-gray-400';

  return (
    <div
      className={`group relative flex flex-col rounded-xl border border-surface-600 bg-surface-800 p-4 transition-colors hover:border-surface-500 ${className ?? 'min-w-[280px]'}`}
    >
      <button
        onClick={() => onEdit(tracker)}
        className="absolute right-2 top-2 rounded-md p-1 text-gray-500 opacity-0 transition-opacity hover:bg-surface-600 hover:text-accent-400 group-hover:opacity-100"
        title={t('stats.editTracker')}
      >
        <PencilSimple className="h-4 w-4" weight="bold" />
      </button>

      <div className="mb-3 flex items-center gap-3">
        <TrackerIcon
          name={tracker.name}
          iconId={tracker.icon}
          iconAlias={tracker.iconAlias}
          iconPaletteIndex={tracker.iconPaletteIndex}
          size={32}
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{tracker.name}</h3>
          {stats && <p className="truncate text-xs text-gray-400">{stats.username} &middot; {stats.group}</p>}
        </div>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-surface-500 border-t-accent-400" />
        </div>
      )}

      {error && (
        <div className="flex flex-1 items-center justify-center py-4">
          <p className="text-xs text-danger-400">{error}</p>
        </div>
      )}

      {stats && !loading && (
        <div className="flex flex-col divide-y divide-surface-700">
          <div className="grid grid-cols-3 gap-2 pb-3">
            <div className="flex flex-col items-center rounded-lg bg-surface-700/50 p-2">
              <p className={`text-lg font-bold ${ratioColor}`}>{stats.ratio}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">{t('stats.ratio')}</p>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-surface-700/50 p-2">
              <p className="text-lg font-bold text-success-400">{stats.seeding}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">{t('stats.seeding')}</p>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-surface-700/50 p-2">
              <p className="text-lg font-bold text-warning-500">{stats.leeching}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">{t('stats.leeching')}</p>
            </div>
          </div>
          <div className="pt-2">
            <StatRow icon={<ArrowUp size={16} weight="bold" className="text-success-400" />} label={t('stats.uploaded')} value={stats.uploaded} valueClass="text-success-400" />
            <StatRow icon={<ArrowDown size={16} weight="bold" className="text-danger-400" />} label={t('stats.downloaded')} value={stats.downloaded} valueClass="text-danger-400" />
            <StatRow icon={<Stack size={16} weight="bold" className="text-accent-400" />} label={t('stats.buffer')} value={stats.buffer} valueClass="text-accent-400" />
            <StatRow icon={<Coins size={16} weight="bold" className="text-warning-500" />} label={t('stats.seedBonus')} value={parseFloat(stats.seedbonus).toLocaleString()} valueClass="text-warning-500" />
            <StatRow icon={<Warning size={16} weight="bold" className="text-danger-400" />} label={t('stats.hitAndRuns')} value={stats.hit_and_runs} valueClass={stats.hit_and_runs > 0 ? 'text-danger-400' : 'text-gray-100'} />
          </div>
        </div>
      )}
    </div>
  );
}
