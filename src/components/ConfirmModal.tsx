import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading = false,
  danger = true,
}: ConfirmModalProps) {
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 overflow-y-auto overscroll-contain"
      role="presentation"
    >
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden
        onClick={() => !loading && onCancel()}
      />
      <div className="relative z-10 flex min-h-full justify-center p-4 sm:items-center sm:py-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="relative my-4 w-full max-w-sm rounded-2xl border border-surface-600 bg-surface-800 p-5 shadow-2xl sm:my-0"
        >
        <h2 id="confirm-modal-title" className="mb-2 text-lg font-semibold text-white">
          {title}
        </h2>
        <p className="mb-6 text-sm text-gray-400">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-surface-700 hover:text-white disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onConfirm()}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              danger ? 'bg-danger-500 hover:bg-danger-400' : 'bg-accent-500 hover:bg-accent-600'
            }`}
          >
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {confirmLabel}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
