import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { BADGE_PALETTES, defaultPaletteIndex } from '@/lib/icon-colors';
import type { TrackerRegistryEntry, TrackerPublic } from '@/lib/types';
import { defaultBadgeLetters, normalizeIconAlias } from '@/lib/tracker-alias';
import { defaultNameFromUrl } from '@/lib/tracker-url';
import ConfirmModal from './ConfirmModal';
import TrackerSelector from './TrackerSelector';
import { GeneratedIcon } from './TrackerIcon';

interface AddTrackerDialogProps {
  open: boolean;
  editingTracker: TrackerPublic | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}

export default function AddTrackerDialog({ open, editingTracker, onClose, onSaved, onDeleted }: AddTrackerDialogProps) {
  const { t } = useTranslation();
  const isEdit = editingTracker != null;

  const [registry, setRegistry] = useState<TrackerRegistryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<TrackerRegistryEntry | null>(null);

  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [badgeLetters, setBadgeLetters] = useState('');
  const [badgeTouched, setBadgeTouched] = useState(false);

  const [paletteIndex, setPaletteIndex] = useState(0);
  const [paletteTouched, setPaletteTouched] = useState(false);

  const [apiKey, setApiKey] = useState('');
  const [rssKey, setRssKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      fetch('/api/registry')
        .then((r) => r.json())
        .then(setRegistry)
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isEdit && editingTracker) {
      setSelectedEntry(null);
      setName(editingTracker.name);
      setBaseUrl(editingTracker.baseUrl);
      setBadgeTouched(!!editingTracker.iconAlias);
      setBadgeLetters(editingTracker.iconAlias ?? defaultBadgeLetters(editingTracker.name));
      setPaletteIndex(editingTracker.iconPaletteIndex ?? defaultPaletteIndex(editingTracker.name));
      setPaletteTouched(editingTracker.iconPaletteIndex != null);
      setApiKey('');
      setRssKey('');
      setError(null);
      setSubmitting(false);
    } else if (!isEdit) {
      setSelectedEntry(null);
      setName('');
      setBaseUrl('');
      setBadgeLetters('');
      setBadgeTouched(false);
      setPaletteIndex(defaultPaletteIndex(''));
      setPaletteTouched(false);
      setApiKey('');
      setRssKey('');
      setError(null);
      setSubmitting(false);
    }
  }, [open, isEdit, editingTracker]);

  useEffect(() => {
    if (!open) setDeleteConfirmOpen(false);
  }, [open]);

  /** Keep badge letters in sync with the name until the user edits the badge field. */
  useEffect(() => {
    if (!open) return;
    if (!badgeTouched && name.trim()) {
      setBadgeLetters(defaultBadgeLetters(name));
    }
  }, [name, open, badgeTouched]);

  /** Keep palette suggestion in sync with the name until the user picks a swatch. */
  useEffect(() => {
    if (!open) return;
    if (!paletteTouched && name.trim()) {
      setPaletteIndex(defaultPaletteIndex(name));
    }
  }, [name, open, paletteTouched]);

  function handleClose() {
    onClose();
  }

  function handleRegistrySelect(entry: TrackerRegistryEntry | null) {
    setSelectedEntry(entry);
    if (entry) {
      setName(entry.name);
      setBaseUrl(entry.baseUrl);
      setBadgeTouched(false);
      setBadgeLetters(defaultBadgeLetters(entry.name));
      setPaletteIndex(defaultPaletteIndex(entry.name));
      setPaletteTouched(false);
    }
  }

  function handleUseUrl(url: string) {
    setSelectedEntry(null);
    const n = defaultNameFromUrl(url);
    setName(n);
    setBaseUrl(url);
    setBadgeTouched(false);
    setBadgeLetters(defaultBadgeLetters(n));
    setPaletteIndex(defaultPaletteIndex(n));
    setPaletteTouched(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedBase = baseUrl.trim();
    const normalizedBadge = normalizeIconAlias(badgeLetters);

    if (isEdit && editingTracker) {
      setSubmitting(true);
      try {
        const body: Record<string, unknown> = {
          name: trimmedName,
          baseUrl: trimmedBase,
          icon: 'generic',
          iconAlias: normalizedBadge.length >= 2 ? normalizedBadge : null,
          iconPaletteIndex: paletteIndex,
        };
        if (apiKey.trim()) body.apiKey = apiKey.trim();
        if (rssKey !== '') body.rssKey = rssKey;

        const res = await fetch(`/api/trackers/${editingTracker.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: t('dialog.errors.unknown') }));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }
        onSaved();
      } catch (err) {
        setError((err as Error).message);
        setSubmitting(false);
      }
      return;
    }

    const trimmedApi = apiKey.trim();
    const trimmedRss = rssKey.trim();

    if (!trimmedName || !trimmedBase) {
      setError(t('dialog.errors.nameAndUrl'));
      return;
    }
    if (!trimmedApi && !trimmedRss) {
      setError(t('dialog.errors.atLeastOneKey'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        name: trimmedName,
        baseUrl: trimmedBase,
        apiKey: trimmedApi,
        rssKey: trimmedRss,
        icon: 'generic',
        iconPaletteIndex: paletteIndex,
      };
      if (normalizedBadge.length >= 2) {
        body.iconAlias = normalizedBadge;
      }

      const res = await fetch('/api/trackers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: t('dialog.errors.unknown') }));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!editingTracker || !onDeleted) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/trackers/${editingTracker.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: t('dialog.errors.unknown') }));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      setDeleteConfirmOpen(false);
      onDeleted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-surface-600 bg-surface-800 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{isEdit ? t('dialog.editTracker') : t('dialog.addTracker')}</h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-gray-400 hover:bg-surface-700 hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <TrackerSelector
              registry={registry}
              selected={selectedEntry}
              onSelect={handleRegistrySelect}
              onUseUrl={handleUseUrl}
              dialogOpen={open}
            />
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">{t('dialog.trackerName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">{t('dialog.baseUrl')}</label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              required
              className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-100 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">{t('dialog.iconLetters')}</label>
            <div className="flex items-center gap-3">
              <GeneratedIcon
                name={name || '?'}
                iconAlias={badgeLetters || undefined}
                paletteIndex={paletteIndex}
                size={40}
              />
              <input
                type="text"
                value={badgeLetters}
                onFocus={() => setBadgeTouched(true)}
                onChange={(e) => {
                  setBadgeTouched(true);
                  setBadgeLetters(e.target.value.replace(/[^a-zA-Z0-9]/gi, '').toUpperCase().slice(0, 3));
                }}
                placeholder={name.trim() ? defaultBadgeLetters(name) : ''}
                maxLength={3}
                className="min-w-0 flex-1 rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm uppercase tracking-wider text-gray-100 placeholder-gray-500 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500">{t('dialog.iconLettersHintShort')}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">{t('dialog.badgePalette')}</label>
            <div className="grid grid-cols-5 gap-2">
              {BADGE_PALETTES.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPaletteTouched(true);
                    setPaletteIndex(i);
                  }}
                  title={`${i + 1}`}
                  className={`flex h-10 items-center justify-center rounded-md border-2 text-xs font-bold transition-colors ${
                    paletteIndex === i ? 'border-accent-400 ring-1 ring-accent-400/50' : 'border-surface-600 hover:border-surface-500'
                  }`}
                  style={{ backgroundColor: p.bg, color: p.fg }}
                >
                  A
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-gray-500">{t('dialog.badgePaletteHint')}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">{t('dialog.apiKey')}</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isEdit ? t('dialog.apiKeyPlaceholderEdit') : t('dialog.apiKeyPlaceholder')}
              className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
            />
            <p className="mt-1 text-[11px] text-gray-500">{t('dialog.apiKeyHint')}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-300">{t('dialog.rssKey')}</label>
            <input
              type="password"
              value={rssKey}
              onChange={(e) => setRssKey(e.target.value)}
              placeholder={isEdit ? t('dialog.rssKeyPlaceholderEdit') : t('dialog.rssKeyPlaceholder')}
              className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/50"
            />
            <p className="mt-1 text-[11px] text-gray-500">{t('dialog.rssKeyHint')}</p>
            <p className="mt-2 rounded-lg border border-surface-600/80 bg-surface-800/80 px-3 py-2 text-[11px] leading-relaxed text-gray-400">
              {t('dialog.rssKeyUnit3dOnly')}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2">
              <p className="text-xs text-danger-400">{error}</p>
            </div>
          )}

          <div
            className={`flex items-center justify-between gap-3 pt-2 ${isEdit ? 'border-t border-surface-700' : ''}`}
          >
            <div className="min-w-0 flex-1">
              {isEdit && editingTracker && onDeleted && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-2 text-sm font-medium text-danger-400 transition-colors hover:bg-danger-500/20"
                >
                  {t('dialog.deleteTracker')}
                </button>
              )}
            </div>
            <div className="flex shrink-0 justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-surface-700 hover:text-white"
              >
                {t('dialog.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {submitting ? t('dialog.saving') : isEdit ? t('dialog.save') : t('dialog.addSubmit')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <ConfirmModal
      open={deleteConfirmOpen && isEdit && !!editingTracker}
      title={t('dialog.deleteConfirmTitle')}
      message={t('dashboard.removeConfirm', { name: editingTracker?.name ?? '' })}
      cancelLabel={t('dialog.cancel')}
      confirmLabel={t('dialog.deleteConfirm')}
      loading={deleting}
      onCancel={() => !deleting && setDeleteConfirmOpen(false)}
      onConfirm={handleConfirmDelete}
    />
    </>
  );
}
