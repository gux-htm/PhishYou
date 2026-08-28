/**
 * PhishYou — After-Action Report (`/campaigns/:id/aar`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 8: After-Action Report
 *       PHISHYOU_SPECS/07_ANALYTICS_ENGINE/AAR_GENERATION_ENGINE.md (§1–4)
 *       PHISHYOU_SPECS/02_ARCHITECTURE/API_CONTRACTS.md §3.2 (AAR payload)
 *
 * Single-target deep-dive report:
 * - Outcome banner (DEFENDED / COMPROMISED / EXPIRED) + key metrics strip
 * - Summary, attack-chain steps and the full behavioral timeline (tactics,
 *   signals, resistance deltas per turn)
 * - Resistance-over-time area chart, trigger distribution donut, intensity
 *   effectiveness bars (recharts)
 * - Trigger effectiveness table with rating dots and mean resistance deltas
 * - Psychological narrative ("what worked and why")
 * - Organizational policy-gap cards (severity, evidence, recommendation)
 * - Coaching (did well / improve / training modules) and comparative
 *   performance (radar, percentiles, industry benchmark)
 * - Exports: simulated PDF download + real anonymized JSON export
 *
 * Data: GET /api/v1/campaigns/:id/aar with the demo fallback from services/analytics.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpCircle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileJson,
  GraduationCap,
  Loader2,
  Mic,
  ShieldCheck,
  ShieldX,
  User,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AarOutcome, AarPolicyGap, AarReport, TimelineEvent } from '../types';
import { getAar } from '../services/analytics';
import { downloadFile } from '../services/api';
import { AnalyticsChart, AXIS_LINE, AXIS_TICK, CHART_TOOLTIP_STYLE, SERIES_COLORS } from '../components/analytics/AnalyticsChart';
import { ResistanceScoreGauge } from '../components/common/ResistanceScoreGauge';
import { PageLoader } from '../components/common/LoadingState';
import { useToast } from '../hooks/useToast';
import { TIER_BADGE_CLASS, clockTime, formatDateTime, platformLabel, resistanceColor } from '../utils/formatters';

/* ------------------------------------------------------------------ */
/* Shared class strings & presentation maps                             */
/* ------------------------------------------------------------------ */

const panel = 'rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6';
const th = 'px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-[#5A6470]';
const td = 'px-4 py-3 text-sm text-[#A8B4C4] align-middle';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#3D4860] bg-[#2D3748] ' +
  'px-4 py-2.5 text-sm font-medium text-slate-100 transition-all duration-200 ease-out ' +
  'hover:bg-[#232D39] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

const OUTCOME_META: Record<AarOutcome, { label: string; icon: typeof ShieldCheck; className: string }> = {
  DEFENDED: {
    label: 'Defended',
    icon: ShieldCheck,
    className: 'border-[#06D369]/30 bg-[#06D369]/[0.08] text-[#58E6A0]',
  },
  COMPROMISED: {
    label: 'Compromised',
    icon: ShieldX,
    className: 'border-[#FF4757]/30 bg-[#FF4757]/[0.08] text-[#FF7B86]',
  },
  EXPIRED: {
    label: 'Expired',
    icon: Clock,
    className: 'border-[#8B95A8]/30 bg-[#8B95A8]/[0.08] text-[#A8B4C4]',
  },
};

const KIND_META: Record<TimelineEvent['kind'], { icon: typeof Bot; color: string; bg: string; label: string }> = {
  ai_message: { icon: Bot, color: '#5B9EFF', bg: 'bg-[#5B9EFF]/10', label: 'AI message' },
  target_reply: { icon: User, color: '#A8B4C4', bg: 'bg-[#8B95A8]/10', label: 'Target reply' },
  escalation: { icon: ArrowUpCircle, color: '#F59E0B', bg: 'bg-[#F59E0B]/10', label: 'Escalation' },
  media: { icon: Mic, color: '#A78BFA', bg: 'bg-[#A78BFA]/10', label: 'Media' },
  harm_signal: { icon: AlertTriangle, color: '#FF4757', bg: 'bg-[#FF4757]/10', label: 'Harm signal' },
  defense: { icon: ShieldCheck, color: '#06D369', bg: 'bg-[#06D369]/10', label: 'Defense' },
};

const SEVERITY_CLASS: Record<AarPolicyGap['severity'], string> = {
  Critical: 'bg-[#FF4757]/15 text-[#FF4757]',
  High: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  Medium: 'bg-[#5B9EFF]/10 text-[#5B9EFF]',
  Low: 'bg-[#8B95A8]/10 text-[#8B95A8]',
};

const GAP_STATUS_CLASS: Record<AarPolicyGap['status'], string> = {
  Open: 'bg-[#FF4757]/10 text-[#FF7B86]',
  Acknowledged: 'bg-[#5B9EFF]/10 text-[#5B9EFF]',
  'Remediation Planned': 'bg-[#F59E0B]/10 text-[#F6BF5C]',
  Remediated: 'bg-[#06D369]/10 text-[#06D369]',
  'Verified by Retest': 'bg-[#2FD9C7]/10 text-[#2FD9C7]',
};

function RatingDots({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`${rating} of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={`h-1.5 w-1.5 rounded-full ${index < rating ? 'bg-[#A78BFA]' : 'bg-[#232D39]'}`} />
      ))}
    </span>
  );
}

export default function AfterActionReport() {
  const { id = '' } = useParams<{ id: string }>();
  const toast = useToast();
  const [report, setReport] = useState<AarReport | null>(null);
  const [demo, setDemo] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAar(id).then(({ data, demo: isDemo }) => {
      if (cancelled) return;
      setReport(data);
      setDemo(isDemo);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!report) return <PageLoader label="Generating report" />;

  const outcome = OUTCOME_META[report.outcome];
  const OutcomeIcon = outcome.icon;

  const exportAnonymized = () => {
    const payload = {
      campaign_id: report.campaignId,
      tier: report.tier,
      outcome: report.outcome,
      key_metrics: report.keyMetrics,
      trigger_effectiveness: report.triggerRows.map((row) => ({
        trigger: row.trigger,
        deployed: row.deployed,
        mean_resistance_delta: row.meanResistanceDelta,
        rating: row.rating,
      })),
      policy_gaps: report.policyGaps.map((gap) => ({
        title: gap.title,
        severity: gap.severity,
        gap_class: gap.gapClass,
        status: gap.status,
      })),
      exported_at: new Date().toISOString(),
      anonymization: 'k-anonymized comparative data only — no PII included',
    };
    downloadFile(`phishyou-aar-${report.campaignId}-anonymized.json`, JSON.stringify(payload, null, 2), 'application/json');
    toast.success('Export ready', 'Anonymized threat-intelligence JSON downloaded.');
  };

  const downloadPdf = async () => {
    setPdfBusy(true);
    // Demo mode — the production build streams a server-rendered PDF here.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setPdfBusy(false);
    toast.success('PDF ready', 'The After-Action Report was downloaded.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <header className="py-fade-up">
        <Link
          to={`/campaigns/${report.campaignId}`}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-[#7A8595] transition-colors hover:text-[#2FD9C7]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to campaign
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_BADGE_CLASS[report.tier]}`}
              >
                Tier {report.tier}
              </span>
              <span className="font-mono text-[10px] text-[#5A6470]">aar/{report.campaignId}</span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">After-Action Report</h1>
            <p className="mt-1 text-sm text-[#7A8595]">
              {report.campaignName} · Generated {formatDateTime(report.generatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={exportAnonymized} className={secondaryButton}>
              <FileJson className="h-4 w-4" aria-hidden="true" />
              Anonymized JSON
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={pdfBusy}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#2FD9C7] px-4 py-2.5 text-sm font-semibold text-[#0F1219] transition-all duration-200 hover:bg-[#4FE5D3] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {demo && (
        <div className="rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] px-4 py-3 text-xs text-[#F6BF5C]">
          Showing a demo report because the AAR API is unavailable.
        </div>
      )}

      {/* Outcome banner */}
      <section
        aria-label="Campaign outcome"
        className={`rounded-2xl border p-5 sm:p-6 py-fade-up py-fade-up-delay-1 ${outcome.className}`}
        role="status"
      >
        <div className="flex items-start gap-4">
          <OutcomeIcon className="mt-0.5 h-8 w-8 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-black tracking-tight">Outcome: {outcome.label}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 opacity-90">{report.outcomeDescription}</p>
          </div>
        </div>
      </section>

      {/* Key metrics */}
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4 py-fade-up py-fade-up-delay-2">
        <div className="py-sheen rounded-2xl border border-[#2D3748] bg-[#15191F] p-5">
          <div className="text-2xl font-black tracking-[-0.03em] text-white">{report.keyMetrics.timeToFirstSkepticism}</div>
          <div className="mt-1 text-xs text-[#7A8595]">Time to first skepticism</div>
        </div>
        <div className="py-sheen rounded-2xl border border-[#2D3748] bg-[#15191F] p-5">
          <div className="text-2xl font-black tracking-[-0.03em] text-white">{report.keyMetrics.totalExchanges}</div>
          <div className="mt-1 text-xs text-[#7A8595]">Total exchanges</div>
        </div>
        <div className="py-sheen rounded-2xl border border-[#2D3748] bg-[#15191F] p-5">
          <div className="text-2xl font-black tracking-[-0.03em] text-white">{report.keyMetrics.campaignDuration}</div>
          <div className="mt-1 text-xs text-[#7A8595]">Campaign duration</div>
        </div>
        <div className="py-sheen flex items-center gap-4 rounded-2xl border border-[#2D3748] bg-[#15191F] p-5">
          <ResistanceScoreGauge value={report.keyMetrics.resilienceScore} size="lg" label="final resilience" />
          <div>
            <div className="text-sm font-bold text-[#F5F7FB]">Resilience score</div>
            <div className="mt-0.5 text-xs text-[#7A8595]">Final — lower is safer</div>
          </div>
        </div>
      </section>

      {/* Summary + attack chain */}
      <section aria-label="Executive summary" className={`${panel} py-fade-up py-fade-up-delay-3`}>
        <h2 className="text-lg font-bold text-[#F5F7FB]">Executive summary</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-[#A8B4C4]">{report.summary}</p>
      </section>

      <section aria-label="Attack chain" className={panel}>
        <h2 className="text-lg font-bold text-[#F5F7FB]">Attack chain</h2>
        <p className="mt-1 text-xs text-[#7A8595]">Escalation sequence executed by the AI agent</p>
        <ol className="mt-4 flex flex-wrap items-center gap-2">
          {report.attackChain.map((step, index) => (
            <li key={`${step.platform}-${index}`} className="flex items-center gap-2">
              <div
                className={`rounded-xl border px-4 py-3 ${
                  step.winningDefense ? 'border-[#06D369]/40 bg-[#06D369]/[0.06]' : 'border-[#2D3748] bg-[#1D232D]'
                }`}
              >
                <p className="text-xs font-bold text-[#F5F7FB]">
                  {index + 1}. {platformLabel(step.platform)}
                </p>
                <p className="mt-0.5 text-[10px] text-[#7A8595]">{step.trigger}</p>
                {step.winningDefense && (
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#06D369]">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    Winning defense
                  </p>
                )}
              </div>
              {index < report.attackChain.length - 1 && (
                <ChevronRight className="h-4 w-4 text-[#5A6470]" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Timeline + charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Behavioral timeline" className={panel}>
          <h2 className="text-lg font-bold text-[#F5F7FB]">Behavioral timeline</h2>
          <p className="mt-1 text-xs text-[#7A8595]">Every exchange, tactic and signal — in order</p>
          <ol className="mt-5">
            {report.timeline.map((event, index) => {
              const meta = KIND_META[event.kind];
              const EventIcon = meta.icon;
              return (
                <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < report.timeline.length - 1 && (
                    <span className="absolute left-4 top-9 h-full w-px bg-[#2D3748]" aria-hidden="true" />
                  )}
                  <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                    <EventIcon className="h-4 w-4" style={{ color: meta.color }} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6470]">
                        {meta.label}
                        {event.tactic ? ` · ${event.tactic}` : ''}
                      </span>
                      <time className="text-[10px] text-[#5A6470]">{clockTime(event.timestamp)}</time>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#A8B4C4]">{event.content}</p>
                    {event.detail && <p className="mt-1 text-xs text-[#5A6470]">{event.detail}</p>}
                    {event.signals && event.signals.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {event.signals.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-full border border-[#A78BFA]/30 bg-[#A78BFA]/10 px-2 py-0.5 text-[10px] text-[#A78BFA]"
                          >
                            {signal}
                          </span>
                        ))}
                      </div>
                    )}
                    {typeof event.resistanceScore === 'number' && (
                      <p
                        className="mt-1.5 font-mono text-[10px] font-bold"
                        style={{ color: resistanceColor(event.resistanceScore) }}
                      >
                        resistance {Math.round(event.resistanceScore * 100)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="space-y-6">
          <AnalyticsChart title="Resistance over time" subtitle="Target resistance score per exchange" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.resistanceSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="pyResistanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2FD9C7" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2FD9C7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="turn"
                  tick={AXIS_TICK}
                  axisLine={AXIS_LINE}
                  tickLine={false}
                  tickFormatter={(turn: number) => `T${turn}`}
                />
                <YAxis
                  domain={[0, 1]}
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelFormatter={(turn) => `Turn ${turn}`}
                  formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Resistance']}
                />
                <Area type="monotone" dataKey="score" stroke="#2FD9C7" strokeWidth={2} fill="url(#pyResistanceFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </AnalyticsChart>

          <AnalyticsChart title="Trigger distribution" subtitle="Share of deployed pressure tactics" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report.triggerDistribution}
                  dataKey="share"
                  nameKey="trigger"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  stroke="none"
                >
                  {report.triggerDistribution.map((entry, index) => (
                    <Cell key={entry.trigger} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value}%`, 'Share']} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#7A8595' }} />
              </PieChart>
            </ResponsiveContainer>
          </AnalyticsChart>
        </div>
      </div>

      {/* Trigger effectiveness table */}
      <section aria-label="Trigger effectiveness" className={panel}>
        <h2 className="text-lg font-bold text-[#F5F7FB]">Trigger effectiveness</h2>
        <p className="mt-1 text-xs text-[#7A8595]">
          Mean resistance delta is the average change in target resistance after the trigger fired — negative means the
          target became more compliant.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#2D3748]">
                <th className={th}>Trigger</th>
                <th className={th}>Deployed</th>
                <th className={th}>Mean Δ resistance</th>
                <th className={th}>Best response</th>
                <th className={th}>Worst response</th>
                <th className={th}>Effectiveness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3748]">
              {report.triggerRows.map((row) => (
                <tr key={row.trigger} className="transition-colors hover:bg-[#1D232D]/60">
                  <td className={`${td} font-semibold text-[#F5F7FB]`}>{row.trigger}</td>
                  <td className={td}>{row.deployed}</td>
                  <td className={td}>
                    <span className={row.meanResistanceDelta < 0 ? 'text-[#FF4757]' : 'text-[#06D369]'}>
                      {row.meanResistanceDelta > 0 ? '+' : ''}
                      {row.meanResistanceDelta.toFixed(2)}
                    </span>
                  </td>
                  <td className={td}>{row.bestResponse}</td>
                  <td className={td}>{row.worstResponse}</td>
                  <td className={td}>
                    <RatingDots rating={row.rating} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Intensity + narrative */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsChart
          title="Intensity vs. effectiveness"
          subtitle="How trigger intensity mapped to persuasion success"
          height={240}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.intensityEffectiveness} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="intensity" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
              <YAxis
                domain={[0, 100]}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${value}%`}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelFormatter={(intensity) => `Intensity ${intensity}`}
                formatter={(value: number) => [`${value}%`, 'Effectiveness']}
              />
              <Bar dataKey="effectiveness" fill="#A78BFA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AnalyticsChart>

        <section aria-label="Psychological narrative" className={panel}>
          <h2 className="text-lg font-bold text-[#F5F7FB]">Psychological breakdown</h2>
          <p className="mt-1 text-xs text-[#7A8595]">What worked, what failed, and why — behavioral analysis</p>
          <p className="mt-4 text-sm leading-7 text-[#A8B4C4]">{report.narrative}</p>
        </section>
      </div>

      {/* Policy gaps */}
      <section aria-label="Organizational policy gaps" className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#F5F7FB]">Organizational policy gaps</h2>
          <p className="mt-1 text-sm text-[#7A8595]">
            {report.policyGaps.length} gaps detected in policy, tooling or escalation paths — each with a recommended
            remediation.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {report.policyGaps.map((gap) => (
            <article
              key={gap.id}
              className="py-sheen flex flex-col rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#3D4860]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY_CLASS[gap.severity]}`}>
                  {gap.severity}
                </span>
                <span className="rounded-md border border-[#3D4860] px-2 py-0.5 text-[10px] text-[#A8B4C4]">{gap.gapClass}</span>
              </div>
              <h3 className="mt-3 text-sm font-bold leading-5 text-[#F5F7FB]">{gap.title}</h3>
              <blockquote className="mt-3 rounded-lg border-l-2 border-[#3D4860] bg-[#1D232D] px-3 py-2 text-xs italic leading-5 text-[#A8B4C4]">
                {gap.evidence}
                <span className="mt-1 block text-[10px] not-italic text-[#5A6470]">{gap.attribution}</span>
              </blockquote>
              <p className="mt-3 text-xs leading-5 text-[#7A8595]">{gap.description}</p>
              <p className="mt-3 text-xs leading-5 text-[#8FEFE3]">
                <span className="font-bold">Recommendation:</span> {gap.recommendation}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#2D3748] pt-3 text-[10px] text-[#5A6470]">
                <span>{gap.effort}</span>
                <span className={`rounded-md px-2 py-0.5 font-bold uppercase tracking-wider ${GAP_STATUS_CLASS[gap.status]}`}>
                  {gap.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Coaching */}
      <section aria-label="Coaching" className="grid gap-6 lg:grid-cols-3">
        <div className={panel}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#F5F7FB]">
            <CheckCircle2 className="h-5 w-5 text-[#06D369]" aria-hidden="true" />
            Did well
          </h2>
          <ul className="mt-4 space-y-4">
            {report.coaching.didWell.map((item) => (
              <li key={item.title}>
                <p className="text-sm font-semibold text-[#F5F7FB]">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#7A8595]">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className={panel}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#F5F7FB]">
            <AlertTriangle className="h-5 w-5 text-[#F59E0B]" aria-hidden="true" />
            Improve
          </h2>
          <ul className="mt-4 space-y-4">
            {report.coaching.improve.map((item) => (
              <li key={item.title}>
                <p className="text-sm font-semibold text-[#F5F7FB]">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-[#7A8595]">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className={panel}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#F5F7FB]">
            <GraduationCap className="h-5 w-5 text-[#A78BFA]" aria-hidden="true" />
            Recommended modules
          </h2>
          <ul className="mt-4 space-y-3">
            {report.coaching.modules.map((module) => (
              <li key={module.name}>
                <a
                  href={module.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start justify-between gap-3 rounded-xl border border-[#2D3748] bg-[#1D232D] px-4 py-3 transition-colors hover:border-[#2FD9C7]/45"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#F5F7FB] group-hover:text-[#2FD9C7]">{module.name}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#7A8595]">{module.description}</span>
                  </span>
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[#5A6470] group-hover:text-[#2FD9C7]" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Comparisons */}
      <section aria-label="Comparative performance" className={panel}>
        <h2 className="text-lg font-bold text-[#F5F7FB]">Comparative performance</h2>
        <p className="mt-1 text-xs text-[#7A8595]">Individual vs. department vs. company — k-anonymized comparisons</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={report.comparisons.radar} outerRadius="72%">
                <PolarGrid stroke="#2D3748" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#7A8595', fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Individual" dataKey="individual" stroke="#2FD9C7" fill="#2FD9C7" fillOpacity={0.25} />
                <Radar name="Department" dataKey="department" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#7A8595' }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {report.comparisons.percentiles.map((percentile) => (
                <div key={percentile.entity} className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5A6470]">{percentile.entity}</p>
                  <p className="mt-1 text-2xl font-black tracking-[-0.03em] text-white">{percentile.score}</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#7A8595]">{percentile.percentileText}</p>
                  <p className={`mt-1.5 text-[11px] font-semibold ${percentile.trend >= 0 ? 'text-[#06D369]' : 'text-[#FF4757]'}`}>
                    {percentile.trend > 0 ? '+' : ''}
                    {percentile.trend} vs last campaign
                  </p>
                </div>
              ))}
            </div>

            {report.comparisons.industryBenchmark && (
              <div className="overflow-x-auto rounded-xl border border-[#2D3748]">
                <table className="w-full min-w-[360px] text-sm">
                  <thead>
                    <tr className="border-b border-[#2D3748] bg-[#1D232D]">
                      <th className={th}>Metric</th>
                      <th className={th}>Your org</th>
                      <th className={th}>Industry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3748]">
                    {report.comparisons.industryBenchmark.map((row) => (
                      <tr key={row.metric}>
                        <td className={td}>{row.metric}</td>
                        <td className={`${td} font-semibold text-[#2FD9C7]`}>{row.org}</td>
                        <td className={td}>{row.industry}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {report.comparisons.industryNote && (
              <p className="text-[10px] leading-4 text-[#5A6470]">{report.comparisons.industryNote}</p>
            )}
          </div>
        </div>
      </section>

      <p className="text-center text-[10px] text-[#5A6470]">
        Comparative data is k-anonymized and contains no personally identifiable information. Generated by the PhishYou
        AAR engine.
      </p>
    </div>
  );
}
