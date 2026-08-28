/**
 * PhishYou — Toast notifications
 * Spec: IMPLEMENTATION_CHECKLIST.md — Toasts (bg #1C2333 w/ border, variant icons,
 *       auto-dismiss 5s except errors, slide-in-right 300ms, 4px left accent)
 *
 * ToastViewport is mounted once by AppProvider; useToast() pushes onto its queue.
 */
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ToastItem, ToastVariant } from '../../types';

const VARIANT_META: Record<ToastVariant, { icon: typeof CheckCircle2; accent: string; iconColor: string }> = {
  success: { icon: CheckCircle2, accent: '#06D369', iconColor: '#06D369' },
  error: { icon: XCircle, accent: '#FF4757', iconColor: '#FF4757' },
  warning: { icon: AlertTriangle, accent: '#F59E0B', iconColor: '#F59E0B' },
  info: { icon: Info, accent: '#5B9EFF', iconColor: '#5B9EFF' },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const meta = VARIANT_META[toast.variant];
  const Icon = meta.icon;

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      className="py-toast-in pointer-events-auto flex w-full items-start gap-3 overflow-hidden rounded-xl border border-[#3D4860] bg-[#1C2333] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
      style={{ borderLeft: `4px solid ${meta.accent}` }}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: meta.iconColor }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#F5F7FB]">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs leading-5 text-[#A8B4C4]">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 text-[#7A8595] transition-colors hover:bg-white/5 hover:text-[#F5F7FB]"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      <style>{`
        @keyframes pyToastIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        .py-toast-in { animation: pyToastIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) { .py-toast-in { animation: none; } }
      `}</style>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
