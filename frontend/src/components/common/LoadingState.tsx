/**
 * PhishYou — Loading states
 * Spec: IMPLEMENTATION_CHECKLIST.md — Loading states
 *   - Page-level: centered Loader2 spinner (teal, w-8 h-8)
 *   - Table loading: 5 skeleton rows (shimmer)
 *   - Card loading: pulsing placeholder shapes
 */
import { Loader2 } from 'lucide-react';

/** Full-page / full-panel centered spinner. */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#2FD9C7]" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#5A6470]">{label}</span>
      </div>
    </div>
  );
}

const SHIMMER_STYLE = `
  @keyframes pyShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  .py-shimmer {
    background: linear-gradient(90deg, #232D39 0%, #2D3748 50%, #232D39 100%);
    background-size: 400px 100%;
    animation: pyShimmer 2s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) { .py-shimmer { animation: none; } }
`;

/** Skeleton rows for tables — `rows` defaults to 5 per the checklist. */
export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div role="status" aria-label="Loading rows" className="overflow-hidden rounded-xl border border-[#2D3748] bg-[#15191F]">
      <style>{SHIMMER_STYLE}</style>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid items-center gap-4 border-b border-[#2D3748] px-5 py-4 last:border-0"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="py-shimmer h-4 rounded"
              style={{ width: `${55 + ((rowIndex + colIndex) % 4) * 12}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Pulsing placeholder cards for dashboard-style grids. */
export function CardSkeletonGrid({ cards = 4 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Loading cards" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <style>{SHIMMER_STYLE}</style>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="rounded-xl border border-[#2D3748] bg-[#15191F] p-5">
          <div className="py-shimmer h-9 w-9 rounded-xl" />
          <div className="py-shimmer mt-5 h-8 w-16 rounded" />
          <div className="py-shimmer mt-3 h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Inline spinner for buttons and small regions. */
export function InlineLoader({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}
