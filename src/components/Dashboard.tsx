import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { TrackerPublic } from '@/lib/types';
import Header from './Header';
import TrackerStatsPanel from './TrackerStatsPanel';
import AggregatedFeed from './AggregatedFeed';
import AddTrackerDialog from './AddTrackerDialog';
import ManageTrackersModal from './ManageTrackersModal';

export default function Dashboard() {
  const { t } = useTranslation();
  const [trackers, setTrackers] = useState<TrackerPublic[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState<TrackerPublic | null>(null);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const trRes = await fetch('/api/trackers');
      if (trRes.ok) setTrackers(await trRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const hasSources = trackers.length > 0;

  const feedSources = useMemo(() => [...trackers], [trackers]);

  function openAddDialog() {
    setEditingTracker(null);
    setDialogOpen(true);
  }

  function handleSaved() {
    setDialogOpen(false);
    setEditingTracker(null);
    void loadAll();
    setFeedRefreshKey((k) => k + 1);
  }

  function handleDeletedTracker() {
    setDialogOpen(false);
    setEditingTracker(null);
    void loadAll();
    setFeedRefreshKey((k) => k + 1);
  }

  function handleEditTracker(tracker: TrackerPublic) {
    setEditingTracker(tracker);
    setDialogOpen(true);
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <Header
        onAddTracker={openAddDialog}
        onManageTrackers={hasSources ? () => setManageOpen(true) : undefined}
        trackerCount={trackers.length}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-500 border-t-accent-400" />
          </div>
        ) : !hasSources ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-700 bg-surface-800">
              <svg className="h-8 w-8 text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-white">{t('dashboard.welcomeTitle')}</h2>
            <p className="mb-6 max-w-sm text-sm text-gray-400">{t('dashboard.welcomeBody')}</p>
            <button
              onClick={openAddDialog}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {t('dashboard.addFirstTracker')}
            </button>
          </div>
        ) : (
          <>
            <TrackerStatsPanel trackers={trackers} onEditTracker={handleEditTracker} />
            <AggregatedFeed refreshKey={feedRefreshKey} feedSources={feedSources} />
          </>
        )}
      </main>

      <ManageTrackersModal
        open={manageOpen}
        trackers={trackers}
        onClose={() => setManageOpen(false)}
        onEdit={(tracker) => {
          setEditingTracker(tracker);
          setDialogOpen(true);
        }}
      />

      <AddTrackerDialog
        open={dialogOpen}
        editingTracker={editingTracker}
        onClose={() => {
          setDialogOpen(false);
          setEditingTracker(null);
        }}
        onSaved={handleSaved}
        onDeleted={handleDeletedTracker}
      />
    </div>
  );
}
