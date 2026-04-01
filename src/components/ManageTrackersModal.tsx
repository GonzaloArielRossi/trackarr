import { useTranslation } from 'react-i18next';

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import type { TrackerPublic } from '@/lib/types';
import TrackerIcon from './TrackerIcon';

interface ManageTrackersModalProps {
  open: boolean;
  trackers: TrackerPublic[];
  onClose: () => void;
  onEdit: (tracker: TrackerPublic) => void;
}

export default function ManageTrackersModal({ open, trackers, onClose, onEdit }: ManageTrackersModalProps) {
  const { t } = useTranslation();
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
      role="presentation"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div className="relative z-10 flex min-h-full justify-center p-4 sm:items-center sm:py-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-trackers-title"
          className="relative my-4 w-full max-w-sm rounded-2xl border border-surface-600 bg-surface-800 p-5 shadow-2xl sm:my-0"
        >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="manage-trackers-title" className="text-lg font-semibold text-white">
            {t('manage.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-surface-700 hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ul className="max-h-[min(18rem,50dvh)] space-y-2 overflow-y-auto overscroll-y-contain touch-pan-y">
          {trackers.map((tracker) => (
            <li key={tracker.id}>
              <button
                type="button"
                onClick={() => {
                  onEdit(tracker);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-surface-700 bg-surface-700/50 px-3 py-2 text-left transition-colors hover:border-surface-500 hover:bg-surface-700"
              >
                <TrackerIcon
                  name={tracker.name}
                  iconId={tracker.icon}
                  iconAlias={tracker.iconAlias}
                  iconPaletteIndex={tracker.iconPaletteIndex}
                  size={28}
                />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{tracker.name}</span>
                  <span className="block truncate text-xs text-gray-500">{tracker.baseUrl}</span>
                </div>
                <span className="text-xs text-accent-400">{t('manage.edit')}</span>
              </button>
            </li>
          ))}
        </ul>
        </div>
      </div>
    </div>
  );
}
