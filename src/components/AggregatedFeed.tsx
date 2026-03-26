import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { FeedTorrent, TrackerPublic } from '@/lib/types';
import FeedItem from './FeedItem';
import FeedFilters, { type FeedFilterState } from './FeedFilters';

interface AggregatedFeedProps {
  refreshKey: number;
  /** Trackers for filter dropdown and badges. */
  feedSources: TrackerPublic[];
}

const DEFAULT_FILTERS: FeedFilterState = {
  search: '',
  tracker: '',
  category: '',
  resolution: '',
  freeleech: false,
  internal: false,
  doubleUpload: false,
};

export default function AggregatedFeed({ refreshKey, feedSources }: AggregatedFeedProps) {
  const { t } = useTranslation();
  const [torrents, setTorrents] = useState<FeedTorrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedFilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/feed')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<FeedTorrent[]>;
      })
      .then((data) => {
        setTorrents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, [refreshKey]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of torrents) if (t.attributes.category) set.add(t.attributes.category);
    return Array.from(set).sort();
  }, [torrents]);

  const resolutions = useMemo(() => {
    const set = new Set<string>();
    for (const t of torrents) if (t.attributes.resolution) set.add(t.attributes.resolution);
    return Array.from(set).sort();
  }, [torrents]);

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return torrents.filter((t) => {
      const a = t.attributes;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      if (filters.tracker && t.tracker.id !== filters.tracker) return false;
      if (filters.category && a.category !== filters.category) return false;
      if (filters.resolution && a.resolution !== filters.resolution) return false;
      if (filters.freeleech && parseInt(a.freeleech) <= 0) return false;
      if (filters.internal && a.internal !== 1) return false;
      if (filters.doubleUpload && !a.double_upload) return false;
      return true;
    });
  }, [torrents, filters]);

  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">{t('feed.sectionTitle')}</h2>
        {torrents.length > 0 && (
          <FeedFilters
            filters={filters}
            onChange={setFilters}
            trackers={feedSources}
            categories={categories}
            resolutions={resolutions}
            totalCount={torrents.length}
            filteredCount={filtered.length}
          />
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-surface-700 bg-surface-800">
              <div className="aspect-[2/3] bg-surface-700" />
              <div className="p-3">
                <div className="mb-2 h-3 w-full rounded bg-surface-700" />
                <div className="mb-2 h-3 w-2/3 rounded bg-surface-700" />
                <div className="flex gap-1">
                  <div className="h-4 w-10 rounded bg-surface-700" />
                  <div className="h-4 w-8 rounded bg-surface-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 text-center">
          <p className="text-sm text-danger-400">{error}</p>
        </div>
      )}

      {!loading && !error && torrents.length === 0 && (
        <div className="rounded-xl border border-dashed border-surface-600 bg-surface-800/50 py-12 text-center">
          <svg className="mx-auto mb-3 h-10 w-10 text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-gray-400">{t('feed.noReleases')}</p>
          <p className="mt-1 text-xs text-gray-500">{t('feed.noReleasesHint')}</p>
        </div>
      )}

      {!loading && !error && torrents.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-surface-600 bg-surface-800/50 py-12 text-center">
          <p className="text-sm text-gray-400">{t('feed.noFilterMatch')}</p>
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="mt-2 text-xs font-medium text-accent-400 hover:text-accent-300"
          >
            {t('feed.clearFilters')}
          </button>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((torrent) => (
            <FeedItem key={`${torrent.tracker.id}-${torrent.id}`} torrent={torrent} />
          ))}
        </div>
      )}
    </section>
  );
}
