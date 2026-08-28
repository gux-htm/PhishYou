/**
 * PhishYou — Confirmation dialog (AlertDialog pattern)
 * Spec: IMPLEMENTATION_CHECKLIST.md — Confirmation dialogs (title describes the
 *       action, description explains consequences, cancel default focus,
 *       destructive red confirm) + Modal animations (fade/slide 300ms).
 */
import { ReactNode, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Shows a spinner on the confirm button and disables both buttons. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  // Escape closes; focus starts on the cancel button (safest default action).
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmClass = destructive
    ? 'bg-[#FF4757] text-white hover:shadow-[0_0_20px_rgba(255,71,87,0.25)]'
    : 'bg-[#2FD9C7] text-[#0F1219] hover:bg-[#4FE5D3]';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="py-dialog-title"
      aria-describedby="py-dialog-desc"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <style>{`
        @keyframes pyDialogIn { from { opacity: 0; transform: translateY(-12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .py-dialog-in { animation: pyDialogIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) { .py-dialog-in { animation: none; } }
      `}</style>
      <div className="py-dialog-in w-full max-w-md rounded-xl border border-[#2D3748] bg-[#1D232D] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-start justify-between gap-4">
          <h3 id="py-dialog-title" className="text-lg font-bold text-[#F5F7FB]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md p-1 text-[#7A8595] transition-colors hover:bg-white/5 hover:text-[#F5F7FB] disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div id="py-dialog-desc" className="mt-2 text-sm leading-6 text-[#A8B4C4]">
          {description}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-lg border border-[#3D4860] bg-[#2D3748] px-4 py-2 text-sm font-medium text-[#F5F7FB] transition-colors hover:bg-[#232D39] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 ${confirmClass}`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
