import { useTranslation } from 'react-i18next';

import type { TrackerPublic } from '@/lib/types';

export interface FeedFilterState {
  search: string;
  tracker: string;
  category: string;
  resolution: string;
  freeleech: boolean;
  internal: boolean;
  doubleUpload: boolean;
}

interface FeedFiltersProps {
  filters: FeedFilterState;
  onChange: (filters: FeedFilterState) => void;
  trackers: TrackerPublic[];
  categories: string[];
  resolutions: string[];
  totalCount: number;
  filteredCount: number;
}

function ChipToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-accent-500 bg-accent-500/15 text-accent-400'
          : 'border-surface-600 bg-surface-700/50 text-gray-400 hover:border-surface-500 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export default function FeedFilters({ filters, onChange, trackers, categories, resolutions, totalCount, filteredCount }: FeedFiltersProps) {
  const { t } = useTranslation();
  const set = (patch: Partial<FeedFilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder={t('feed.searchPlaceholder')}
          className="w-full rounded-lg border border-surface-600 bg-surface-700/50 py-2 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
        />
        {filters.search && (
          <button
            onClick={() => set({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-500 hover:text-gray-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter chips row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tracker filter */}
        <select
          value={filters.tracker}
          onChange={(e) => set({ tracker: e.target.value })}
          className="rounded-lg border border-surface-600 bg-surface-700/50 px-3 py-1.5 text-xs text-gray-300 outline-none focus:border-accent-500"
        >
          <option value="">{t('feed.allTrackers')}</option>
          {trackers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* Category filter */}
        {categories.length > 1 && (
          <select
            value={filters.category}
            onChange={(e) => set({ category: e.target.value })}
            className="rounded-lg border border-surface-600 bg-surface-700/50 px-3 py-1.5 text-xs text-gray-300 outline-none focus:border-accent-500"
          >
            <option value="">{t('feed.allCategories')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Resolution filter */}
        {resolutions.length > 1 && (
          <select
            value={filters.resolution}
            onChange={(e) => set({ resolution: e.target.value })}
            className="rounded-lg border border-surface-600 bg-surface-700/50 px-3 py-1.5 text-xs text-gray-300 outline-none focus:border-accent-500"
          >
            <option value="">{t('feed.allResolutions')}</option>
            {resolutions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        )}

        <div className="h-4 w-px bg-surface-600" />

        <ChipToggle active={filters.freeleech} onClick={() => set({ freeleech: !filters.freeleech })}>
          {t('feed.freeleech')}
        </ChipToggle>
        <ChipToggle active={filters.internal} onClick={() => set({ internal: !filters.internal })}>
          {t('feed.internal')}
        </ChipToggle>
        <ChipToggle active={filters.doubleUpload} onClick={() => set({ doubleUpload: !filters.doubleUpload })}>
          {t('feed.doubleUpload')}
        </ChipToggle>

        {/* Count */}
        <span className="ml-auto text-xs text-gray-500">
          {filteredCount === totalCount
            ? t('feed.releasesCount', { count: totalCount })
            : t('feed.releasesFiltered', { filtered: filteredCount, total: totalCount })}
        </span>
      </div>
    </div>
  );
}
