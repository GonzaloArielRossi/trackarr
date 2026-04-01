import { PencilSimple } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
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
  const [paletteEditorOpen, setPaletteEditorOpen] = useState(false);

  useBodyScrollLock(open);

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
    setPaletteEditorOpen(false);
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
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
      role="presentation"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={handleClose}
      />
      <div className="relative z-10 flex min-h-full justify-center p-4 sm:items-center sm:py-8">
        <div
          role="dialog"
          aria-modal="true"
          className="relative my-4 w-full max-w-md max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto overscroll-y-contain touch-pan-y rounded-2xl border border-surface-600 bg-surface-800 p-6 shadow-2xl sm:my-0"
        >
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
              <button
                type="button"
                onClick={() => setPaletteEditorOpen((v) => !v)}
                aria-expanded={paletteEditorOpen}
                aria-controls="badge-palette-editor"
                title={paletteEditorOpen ? t('dialog.closeBadgePalette') : t('dialog.openBadgePalette')}
                aria-label={paletteEditorOpen ? t('dialog.closeBadgePalette') : t('dialog.openBadgePalette')}
                className="group relative shrink-0 rounded-xl ring-2 ring-transparent transition-[box-shadow,ring-color] hover:ring-surface-500 focus-visible:outline-none focus-visible:ring-accent-400"
              >
                <GeneratedIcon
                  name={name || '?'}
                  iconAlias={badgeLetters || undefined}
                  paletteIndex={paletteIndex}
                  size={40}
                />
                <span
                  className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-surface-500 bg-surface-700 text-gray-200 shadow-md ring-2 ring-surface-800"
                  aria-hidden
                >
                  <PencilSimple size={11} weight="bold" className="text-accent-400" />
                </span>
              </button>
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

            {paletteEditorOpen && (
              <div id="badge-palette-editor" className="mt-4 rounded-xl border border-surface-600/80 bg-surface-800/50 p-3">
                <p className="mb-2 text-xs font-medium text-gray-300">{t('dialog.badgePalette')}</p>
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
                <p className="mt-2 text-[11px] text-gray-500">{t('dialog.badgePaletteHint')}</p>
              </div>
            )}
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
          </div>

          {error && (
            <div className="rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2">
              <p className="text-xs text-danger-400">{error}</p>
            </div>
          )}

          <div
            className={`flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${isEdit ? 'border-t border-surface-700' : ''}`}
          >
            <div className="order-1 flex w-full gap-2 sm:order-2 sm:ml-auto sm:w-auto sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-11 min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-surface-700 hover:text-white sm:min-h-0 sm:flex-none sm:px-4 sm:py-2"
              >
                {t('dialog.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-accent-500 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:flex-none sm:px-4 sm:py-2"
              >
                {submitting && (
                  <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                <span className="truncate">
                  {submitting ? t('dialog.saving') : isEdit ? t('dialog.save') : t('dialog.addSubmit')}
                </span>
              </button>
            </div>
            {isEdit && editingTracker && onDeleted && (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="order-2 w-full rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-2.5 text-sm font-medium text-danger-400 transition-colors hover:bg-danger-500/20 sm:order-1 sm:w-auto sm:shrink-0 sm:py-2"
              >
                {t('dialog.deleteTracker')}
              </button>
            )}
          </div>
        </form>
        </div>
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
