/**
 * PhishYou — Metric card
 * Spec: FRONTEND_SPEC_ENHANCED.md — shared KPI tile (Dashboard / Analytics Hub)
 *
 * Elevated card with icon chip, big value, label and an optional slot for
 * deltas, split bars or captions (children). Mirrors the KpiCard pattern used
 * across the implemented pages so new pages can reuse it.
 */
import { ReactNode } from 'react';

export interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  /** Tailwind text color class for the value, e.g. "text-[#2FD9C7]". */
  tone?: string;
  /** Small uppercase tag rendered top-right (e.g. "Live", "30d"). */
  tag?: string;
  children?: ReactNode;
}

export function MetricCard({ icon, label, value, tone = 'text-[#F5F7FB]', tag, children }: MetricCardProps) {
  return (
    <article className="py-sheen rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#3D4860] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#232D39] text-[#A8B4C4]">
          {icon}
        </span>
        {tag && (
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5A6470]">{tag}</span>
        )}
      </div>
      <div className={`mt-5 text-3xl font-black tracking-[-0.03em] ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-[#A8B4C4]">{label}</div>
      {children}
    </article>
  );
}

export default MetricCard;
