/**
 * PhishYou — Empty state
 * Spec: IMPLEMENTATION_CHECKLIST.md — Empty states (centered icon w-12 h-12
 *       text-slate-600, heading text-lg, description, optional CTA)
 */
import { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 text-[#5A6470]" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#A8B4C4]">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-6 text-[#7A8595]">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 min-h-11 rounded-xl bg-[#2FD9C7] px-5 py-2.5 text-sm font-bold text-[#0F1219] shadow-[0_10px_28px_rgba(47,217,199,0.10)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4FE5D3] active:translate-y-0"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
