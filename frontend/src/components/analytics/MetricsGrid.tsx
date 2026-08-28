/**
 * PhishYou — Metrics grid
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 9: Analytics Hub (top metric strip)
 *
 * Responsive grid of MetricCards with optional deltas. Delta semantics:
 * `lowerIsBetter` flips the color logic (e.g. compromise rate falling is good).
 */
import { ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { MetricCard } from '../dashboard/MetricCard';
import { formatDelta } from '../../utils/formatters';

export interface MetricDefinition {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone?: string;
  tag?: string;
  /** Signed change vs. previous period. */
  delta?: number;
  /** When true a negative delta renders green (default: positive is green). */
  lowerIsBetter?: boolean;
  /** Custom suffix for the delta line, e.g. "pts vs last month". */
  deltaNote?: string;
}

export interface MetricsGridProps {
  metrics: MetricDefinition[];
}

function Delta({ delta, lowerIsBetter, deltaNote }: { delta: number; lowerIsBetter?: boolean; deltaNote?: string }) {
  const good = lowerIsBetter ? delta < 0 : delta > 0;
  const Improving = good ? ArrowDown : ArrowUp;
  return (
    <div className={`mt-4 flex items-center gap-1 text-xs ${good ? 'text-[#06D369]' : 'text-[#FF4757]'}`}>
      <Improving className={`h-3.5 w-3.5 ${good ? '' : 'rotate-180'}`} aria-hidden="true" />
      {formatDelta(delta)}
      {deltaNote ? <span className="text-[#7A8595]"> {deltaNote}</span> : null}
    </div>
  );
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <section
      aria-label="Key metrics"
      className="grid grid-cols-2 gap-4 py-fade-up lg:grid-cols-4"
    >
      {metrics.map((metric) => (
        <MetricCard
          key={metric.label}
          icon={metric.icon}
          label={metric.label}
          value={metric.value}
          tone={metric.tone}
          tag={metric.tag}
        >
          {typeof metric.delta === 'number' && (
            <Delta delta={metric.delta} lowerIsBetter={metric.lowerIsBetter} deltaNote={metric.deltaNote} />
          )}
        </MetricCard>
      ))}
    </section>
  );
}

export default MetricsGrid;
