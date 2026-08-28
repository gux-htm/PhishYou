/**
 * PhishYou — Analytics chart panel
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 9: Analytics Hub (chart presentation)
 *
 * A titled panel that frames a recharts visualization. The chart itself is
 * passed as children (a <ResponsiveContainer> tree), so the wrapper stays
 * chart-type agnostic. Also exports the shared chart constants (tooltip style,
 * series palette, axis tick style) used across analytics views.
 */
import { ReactNode } from 'react';

export interface AnalyticsChartProps {
  title: string;
  subtitle?: string;
  /** Chart area height in px — default 260. */
  height?: number;
  /** Optional header action (legend toggle, export, …). */
  action?: ReactNode;
  /** Small muted footer note (sample counts, methodology). */
  footer?: string;
  children: ReactNode;
}

/** Shared recharts tooltip contentStyle — matches the design system surfaces. */
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#15191F',
  border: '1px solid #2D3748',
  borderRadius: 8,
  fontSize: 12,
  color: '#F5F7FB',
} as const;

/** Data-visualization series palette (spec: --color-data-series-1..5 + insight). */
export const SERIES_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#2FD9C7', '#A78BFA'] as const;

/** Platform accent colors for per-platform series. */
export const PLATFORM_COLORS: Record<string, string> = {
  email: '#60A5FA',
  whatsapp: '#34D399',
  sms: '#FBBF24',
  voice: '#F87171',
  linkedin: '#2FD9C7',
  instagram: '#A78BFA',
};

/** Shared axis props for consistent, low-noise axes. */
export const AXIS_TICK = { fill: '#7A8595', fontSize: 11 } as const;
export const AXIS_LINE = { stroke: '#2D3748' } as const;

export function AnalyticsChart({ title, subtitle, height = 260, action, footer, children }: AnalyticsChartProps) {
  return (
    <section className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#F5F7FB]">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-[#7A8595]">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5" style={{ height }}>
        {children}
      </div>
      {footer && <p className="mt-4 text-center text-[10px] text-[#5A6470]">{footer}</p>}
    </section>
  );
}

export default AnalyticsChart;
