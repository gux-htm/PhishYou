/**
 * PhishYou — Error state
 * Spec: IMPLEMENTATION_CHECKLIST.md — Error states (red bg/border, XCircle icon,
 *       heading + message, "Try again" button, "Contact support" ghost link)
 */
import { RefreshCw, XCircle } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\u2019t load this view. The service may be temporarily unavailable.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-[#FF4757]/30 bg-[#FF4757]/10 px-6 py-14 text-center"
    >
      <XCircle className="mb-4 h-12 w-12 text-[#FF4757]" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-[#F5F7FB]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#A8B4C4]">{message}</p>
      <div className="mt-6 flex items-center gap-4">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#3D4860] bg-[#1D232D] px-4 py-2.5 text-sm font-semibold text-[#F5F7FB] transition-colors hover:border-[#2FD9C7]/45 hover:text-[#2FD9C7]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        )}
        <a
          href="mailto:support@phishyou.example"
          className="text-xs font-medium text-[#7A8595] underline-offset-4 transition-colors hover:text-[#A8B4C4] hover:underline"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}

export default ErrorState;
