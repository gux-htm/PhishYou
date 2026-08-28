/**
 * PhishYou — Analytics Hub (`/analytics`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 9: Analytics Hub
 *       PHISHYOU_SPECS/07_ANALYTICS_ENGINE/BEHAVIORAL_METRICS.md + THREAT_PATTERN_MINING.md
 *
 * Organization-wide behavioral analytics:
 * - Top metric strip (human risk score, engagements, compromise rate, gaps)
 * - Department risk vs. resilience bar chart
 * - Department × trigger effectiveness heatmap (custom grid, three-stage color)
 * - Time-to-compromise distribution and per-platform compromise trends
 * - Organizational vulnerability trajectory vs. industry benchmark
 *
 * Data: GET /api/v1/organizations/me/analytics with the demo fallback from
 * services/analytics.
 */
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldCheck, Target, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsOverview } from '../types';
import { getAnalyticsOverview } from '../services/analytics';
import { AnalyticsChart, AXIS_LINE, AXIS_TICK, CHART_TOOLTIP_STYLE, PLATFORM_COLORS } from '../components/analytics/AnalyticsChart';
import { MetricsGrid } from '../components/analytics/MetricsGrid';
import type { MetricDefinition } from '../components/analytics/MetricsGrid';
import { PageLoader } from '../components/common/LoadingState';
import { useToast } from '../hooks/useToast';
import { formatCompact, formatPercent, relativeTime, resistanceColor } from '../utils/formatters';

/** Effectiveness (0–100) → hex color with scaled alpha for heatmap cells. */
function heatColor(effectiveness: number): string {
  const hex = resistanceColor(effectiveness / 100);
  const alpha = Math.round((0.18 + (effectiveness / 100) * 0.52) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alpha}`;
}

export default function Analytics() {
  const toast = useToast();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [demo, setDemo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data: payload, demo: isDemo } = await getAnalyticsOverview();
    setData(payload);
    setDemo(isDemo);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    toast.info('Analytics refreshed', 'Metrics recalculated from the latest campaign data.');
  };

  const departments = useMemo(() => data?.departmentRisks.map((d) => d.department) ?? [], [data]);
  const triggers = useMemo(() => data?.triggerStats.map((t) => String(t.trigger)) ?? [], [data]);
  const heatmapCells = useMemo(() => {
    const cells = new Map<string, number>();
    data?.triggerHeatmap.forEach((cell) => cells.set(`${cell.department}|${cell.trigger}`, cell.effectiveness));
    return cells;
  }, [data]);

  const trendData = useMemo(() => {
    if (!data) return [];
    const first = data.platformTrends[0]?.points ?? [];
    return first.map((point, index) => {
      const row: Record<string, string | number> = { period: point.period };
      data.platformTrends.forEach(({ platform, points }) => {
        row[platform] = points[index]?.compromiseRate ?? 0;
      });
      return row;
    });
  }, [data]);

  const trajectoryData = useMemo(
    () =>
      data?.trajectory.map((point) => ({
        label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(point.date)),
        riskScore: point.riskScore,
      })) ?? [],
    [data],
  );

  if (!data) return <PageLoader label="Loading analytics" />;

  const riskTone =
    data.humanRiskScore.score > 60 ? 'text-[#FF4757]' : data.humanRiskScore.score >= 30 ? 'text-[#F59E0B]' : 'text-[#06D369]';
  const industryAverage = data.trajectory.find((point) => point.industryAverage !== undefined)?.industryAverage ?? null;

  const metrics: MetricDefinition[] = [
    {
      icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
      label: 'Human risk score',
      value: data.humanRiskScore.score,
      tone: riskTone,
      delta: data.humanRiskScore.delta,
      lowerIsBetter: true,
      deltaNote: 'pts vs last month',
    },
    {
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
      label: 'Total engagements',
      value: formatCompact(data.totalEngagements),
      tag: 'All time',
    },
    {
      icon: <Target className="h-4 w-4" aria-hidden="true" />,
      label: 'Compromise rate',
      value: formatPercent(data.compromiseRate.value),
      delta: Math.round(data.compromiseRate.delta * 100),
      lowerIsBetter: true,
      deltaNote: 'pts vs last month',
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
      label: 'Policy gaps resolved',
      value: data.policyGapsResolved,
      tone: 'text-[#06D369]',
      tag: 'Since program start',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 py-fade-up">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Analytics</h1>
          <p className="mt-1 text-sm text-[#7A8595]">
            Behavioral risk across every department, channel and pressure tactic. Updated {relativeTime(data.lastUpdated)}.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#3D4860] bg-[#2D3748] px-4 py-2.5 text-sm font-medium text-slate-100 transition-all duration-200 hover:bg-[#232D39] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </header>

      {demo && (
        <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] px-4 py-3 text-xs text-[#F6BF5C]">
          Showing demo analytics because the analytics API is unavailable.
        </div>
      )}

      <MetricsGrid metrics={metrics} />

      {/* Department risk + heatmap */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsChart
          title="Department risk profile"
          subtitle="Average resilience vs. compromise rate — higher resilience, lower compromise is better"
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.departmentRisks} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
              <XAxis dataKey="department" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} interval={0} angle={-18} dy={10} height={48} />
              <YAxis domain={[0, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(47, 217, 199, 0.06)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#7A8595' }} />
              <Bar dataKey="avgResilience" name="Avg resilience" fill="#2FD9C7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="compromiseRate" name="Compromise rate" fill="#FF4757" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AnalyticsChart>

        <section aria-label="Trigger effectiveness heatmap" className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6">
          <div>
            <h3 className="text-lg font-bold text-[#F5F7FB]">Trigger effectiveness heatmap</h3>
            <p className="mt-1 text-xs text-[#7A8595]">How well each pressure tactic worked, by department</p>
          </div>
          <div
            className="mt-5 grid gap-1.5"
            style={{ gridTemplateColumns: `minmax(88px, 130px) repeat(${triggers.length}, minmax(0, 1fr))` }}
            role="table"
            aria-label="Trigger effectiveness by department"
          >
            <div />
            {triggers.map((trigger) => (
              <div key={trigger} className="pb-1 text-center text-[10px] font-bold uppercase tracking-wider text-[#5A6470]">
                {trigger}
              </div>
            ))}
            {departments.map((department) => (
              <div key={department} className="contents">
                <div className="flex items-center pr-2 text-xs font-semibold text-[#A8B4C4]">{department}</div>
                {triggers.map((trigger) => {
                  const effectiveness = heatmapCells.get(`${department}|${trigger}`);
                  return (
                    <div
                      key={`${department}-${trigger}`}
                      role="cell"
                      aria-label={`${department} — ${trigger}: ${effectiveness ?? 'no data'} effectiveness`}
                      className="flex h-11 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: effectiveness === undefined ? '#1D232D' : heatColor(effectiveness) }}
                      title={`${department} · ${trigger}: ${effectiveness ?? 'no data'}% effective`}
                    >
                      {effectiveness ?? '—'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-[#5A6470]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: '#06D36966' }} /> Low effectiveness
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: '#F59E0B88' }} /> Moderate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: '#FF475799' }} /> High — train here first
            </span>
          </div>
        </section>
      </div>

      {/* Time-to-compromise + platform trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsChart
          title="Time to compromise"
          subtitle={`Distribution of minutes until targets capitulated — median ${data.medianMinutesToCompromise} min`}
          height={240}
          footer="Minutes from first contact to compromise event, banded across all campaigns."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.timeToCompromise} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
              <XAxis
                dataKey="minutes"
                tick={AXIS_TICK}
                axisLine={AXIS_LINE}
                tickLine={false}
                tickFormatter={(minutes: number) => `${minutes}m`}
              />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelFormatter={(minutes) => `Within ${minutes} minutes`}
                formatter={(value: number) => [value, 'Targets compromised']}
                cursor={{ fill: 'rgba(251, 191, 36, 0.06)' }}
              />
              <Bar dataKey="count" name="Targets" fill="#FBBF24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AnalyticsChart>

        <AnalyticsChart
          title="Compromise rate by channel"
          subtitle="Weekly compromise rate trend per attack platform"
          height={240}
          footer="Lower is better — indicates growing channel skepticism."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
              <XAxis dataKey="period" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
              <YAxis
                domain={[0, 60]}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${value}%`}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number) => [`${value}%`, 'Compromise rate']}
                cursor={{ stroke: '#3D4860' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#7A8595' }} />
              {data.platformTrends.map(({ platform }) => (
                <Line
                  key={platform}
                  type="monotone"
                  dataKey={platform}
                  stroke={PLATFORM_COLORS[platform] ?? '#A8B4C4'}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </AnalyticsChart>
      </div>

      {/* Trajectory */}
      <AnalyticsChart
        title="Organizational vulnerability trajectory"
        subtitle="Company-wide risk score over the last six months"
        height={280}
        footer={industryAverage !== null ? `Dashed line: industry average (${industryAverage}) from k-anonymized benchmark data.` : undefined}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trajectoryData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="pyTrajectoryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
            <YAxis
              domain={[0, 100]}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `${value}`}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [value, 'Risk score']} />
            {industryAverage !== null && (
              <ReferenceLine
                y={industryAverage}
                stroke="#8B95A8"
                strokeDasharray="6 4"
                label={{ value: `Industry ${industryAverage}`, position: 'insideTopRight', fill: '#8B95A8', fontSize: 10 }}
              />
            )}
            <Area type="monotone" dataKey="riskScore" stroke="#60A5FA" strokeWidth={2} fill="url(#pyTrajectoryFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </AnalyticsChart>
    </div>
  );
}
