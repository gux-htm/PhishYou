/**
 * PhishYou — Dashboard / Command Center (`/dashboard`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 2: Dashboard
 * Checklist: IMPLEMENTATION_CHECKLIST.md — Page 2: Dashboard
 *
 * Data: GET /api/v1/organizations/me/dashboard (aggregated: campaigns, targets,
 * risk score, policy gaps, activity, trigger effectiveness, compliance).
 * Falls back to embedded demo data when the API is unreachable so the page
 * renders correctly without a running backend.
 */
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  PlayCircle,
  ShieldCheck,
  ShieldX,
  StopCircle,
  Target,
  UserCog,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Tier = 'A' | 'B' | 'C';
type Platform = 'email' | 'whatsapp' | 'sms' | 'voice' | 'linkedin' | 'instagram';

interface LiveCampaign {
  id: string;
  name: string;
  targetName: string;
  platforms: Platform[];
  resistanceScore: number; // 0..1
  tier: Tier;
}

interface ActivityEvent {
  id: string;
  type:
    | 'campaign_started'
    | 'campaign_halted'
    | 'target_defended'
    | 'target_compromised'
    | 'harm_detected'
    | 'admin_action'
    | 'debrief_delivered';
  title: string;
  description: string;
  timestamp: string; // ISO
}

interface TriggerStat {
  trigger: string;
  effectiveness: number; // 0..100
  samples: number;
}

interface ComplianceItem {
  framework: string;
  status: 'compliant' | 'pending' | 'non_compliant';
  note: string;
}

interface DashboardData {
  activeCampaigns: number;
  tierBreakdown: { A: number; B: number; C: number };
  targetsEngaged: { total: number; defended: number; compromised: number; active: number };
  humanRiskScore: { score: number; delta: number }; // score 0..100, delta in points
  policyGaps: { critical: number; high: number; medium: number };
  liveCampaigns: LiveCampaign[];
  recentActivity: ActivityEvent[];
  triggerStats: { triggers: TriggerStat[]; engagements: number; campaigns: number };
  compliance: { items: ComplianceItem[]; lastReview: string };
}

/* ------------------------------------------------------------------ */
/* Demo data (used when API unreachable)                               */
/* ------------------------------------------------------------------ */

const DEMO_DATA: DashboardData = {
  activeCampaigns: 3,
  tierBreakdown: { A: 1, B: 1, C: 1 },
  targetsEngaged: { total: 23, defended: 14, compromised: 6, active: 3 },
  humanRiskScore: { score: 42, delta: -12 },
  policyGaps: { critical: 2, high: 3, medium: 4 },
  liveCampaigns: [
    {
      id: 'camp_2026_08_27_001',
      name: 'Finance Team Payment Verification Q3',
      targetName: '6 targets · Finance',
      platforms: ['email', 'whatsapp'],
      resistanceScore: 0.68,
      tier: 'A',
    },
    {
      id: 'camp_2026_08_27_002',
      name: 'HR Onboarding Reset Wave 2',
      targetName: '4 targets · People Ops',
      platforms: ['email'],
      resistanceScore: 0.31,
      tier: 'B',
    },
    {
      id: 'camp_2026_08_27_003',
      name: 'Executive Whaling Simulation',
      targetName: '2 targets · Leadership',
      platforms: ['voice', 'sms'],
      resistanceScore: 0.82,
      tier: 'A',
    },
  ],
  recentActivity: [
    { id: 'ev1', type: 'target_compromised', title: 'Target compromised', description: 'Finance · credential entered on simulated portal', timestamp: minutesAgo(3) },
    { id: 'ev2', type: 'campaign_started', title: 'Campaign started', description: 'Executive Whaling Simulation — Tier A', timestamp: minutesAgo(18) },
    { id: 'ev3', type: 'harm_detected', title: 'Harm signal detected', description: 'Score 0.41 — auto-pause triggered for 1 target', timestamp: minutesAgo(34) },
    { id: 'ev4', type: 'target_defended', title: 'Target defended', description: 'Out-of-band verification used before acting', timestamp: minutesAgo(52) },
    { id: 'ev5', type: 'admin_action', title: 'Admin action', description: 'Tier escalation approved by security manager', timestamp: minutesAgo(76) },
    { id: 'ev6', type: 'debrief_delivered', title: 'Debrief delivered', description: 'Q2 recruitment phish — 4 employees debriefed', timestamp: minutesAgo(140) },
    { id: 'ev7', type: 'campaign_halted', title: 'Campaign halted', description: 'Vendor invoice fraud sim stopped by admin', timestamp: minutesAgo(210) },
    { id: 'ev8', type: 'target_defended', title: 'Target defended', description: 'Suspicious sender reported to security team', timestamp: minutesAgo(300) },
  ],
  triggerStats: {
    triggers: [
      { trigger: 'Authority', effectiveness: 72, samples: 148 },
      { trigger: 'Urgency', effectiveness: 64, samples: 132 },
      { trigger: 'Fear', effectiveness: 51, samples: 87 },
      { trigger: 'Social Proof', effectiveness: 47, samples: 74 },
      { trigger: 'Reciprocity', effectiveness: 38, samples: 61 },
    ],
    engagements: 502,
    campaigns: 23,
  },
  compliance: {
    items: [
      { framework: 'GDPR', status: 'compliant', note: 'DPA on file' },
      { framework: 'SOC 2', status: 'compliant', note: 'Type II — current' },
      { framework: 'HIPAA', status: 'pending', note: 'Review scheduled' },
      { framework: 'CCPA', status: 'non_compliant', note: 'Retention policy overdue' },
    ],
    lastReview: '2026-08-12T00:00:00Z',
  },
};

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function fetchDashboard(): Promise<DashboardData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/v1/organizations/me/dashboard', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as DashboardData;
  } finally {
    clearTimeout(timer);
  }
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const platformIcon: Record<Platform, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: MessageCircle,
  voice: Phone,
  linkedin: MessageCircle,
  instagram: MessageCircle,
};

/** Resistance score color: green < 0.33, amber 0.33–0.67, red > 0.67. */
function resistanceColor(score: number): string {
  if (score < 0.33) return '#06D369';
  if (score <= 0.67) return '#F59E0B';
  return '#FF4757';
}

const tierStyles: Record<Tier, string> = {
  A: 'bg-red-500/15 text-[#FF4757]',
  B: 'bg-amber-400/10 text-[#F59E0B]',
  C: 'bg-green-400/10 text-[#06D369]',
};

/* ------------------------------------------------------------------ */
/* Resistance gauge (signature element — 48px inline variant)          */
/* ------------------------------------------------------------------ */

function Gauge({ value, size = 48 }: { value: number; size?: number }) {
  const clamped = Math.min(1, Math.max(0, value));
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = resistanceColor(clamped);
  const pulse =
    clamped > 0.7 ? 'py-pulse-urgent' : clamped >= 0.3 ? 'py-pulse-gentle' : '';
  return (
    <div
      className={`relative shrink-0 ${pulse}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Resistance score ${Math.round(clamped * 100)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3D4860" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 1000ms ease-in-out, stroke 300ms' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold"
        style={{ color }}
      >
        {Math.round(clamped * 100)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KPI strip cards                                                     */
/* ------------------------------------------------------------------ */

function KpiCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 transition-shadow duration-200 hover:shadow-md">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live campaign pill                                                  */
/* ------------------------------------------------------------------ */

function CampaignLivePill({ campaign }: { campaign: LiveCampaign }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#2D3748] py-4 last:border-0 border-l-2 border-l-[#2FD9C7] pl-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white truncate">{campaign.name}</div>
        <div className="text-xs text-slate-400 truncate">{campaign.targetName}</div>
        <div className="flex items-center gap-1.5 mt-1.5">
          {campaign.platforms.map((p) => {
            const Icon = platformIcon[p];
            return (
              <Icon
                key={p}
                className="w-3.5 h-3.5 text-slate-500"
                aria-label={p}
                role="img"
              />
            );
          })}
        </div>
      </div>

      <Gauge value={campaign.resistanceScore} />

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span
          className={`px-2 py-1 rounded-md text-xs font-semibold ${tierStyles[campaign.tier]}`}
        >
          Tier {campaign.tier}
        </span>
        <button
          type="button"
          onClick={() => navigate(`/campaigns/${campaign.id}/live`)}
          className="rounded-lg border border-[#3D4860] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#2FD9C7]/10 hover:border-[#2FD9C7]/50 hover:text-[#2FD9C7] transition-colors duration-200"
        >
          View Live
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity feed                                                       */
/* ------------------------------------------------------------------ */

const activityMeta: Record<ActivityEvent['type'], { icon: typeof PlayCircle; color: string; bg: string }> = {
  campaign_started: { icon: PlayCircle, color: '#2FD9C7', bg: 'bg-[#2FD9C7]/10' },
  campaign_halted: { icon: StopCircle, color: '#FF4757', bg: 'bg-red-500/10' },
  target_defended: { icon: ShieldCheck, color: '#06D369', bg: 'bg-green-400/10' },
  target_compromised: { icon: ShieldX, color: '#FF4757', bg: 'bg-red-500/15' },
  harm_detected: { icon: AlertTriangle, color: '#F59E0B', bg: 'bg-amber-400/10' },
  admin_action: { icon: UserCog, color: '#5B9EFF', bg: 'bg-blue-500/10' },
  debrief_delivered: { icon: BookOpen, color: '#A78BFA', bg: 'bg-purple-400/10' },
};

function ActivityRow({ event }: { event: ActivityEvent }) {
  const meta = activityMeta[event.type] ?? activityMeta.admin_action;
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#2D3748] last:border-0">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}
        aria-hidden="true"
      >
        <Icon className="w-4 h-4" style={{ color: meta.color }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-white">{event.title}</div>
        <div className="text-xs text-slate-400">{event.description}</div>
      </div>
      <span className="text-xs text-slate-500 ml-auto shrink-0">{relativeTime(event.timestamp)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const panel = 'bg-[#111827] border border-[#2D3748] rounded-xl p-5';
const chartTooltipStyle = {
  backgroundColor: '#15191F',
  border: '1px solid #2D3748',
  borderRadius: 8,
  fontSize: 12,
  color: '#F5F7FB',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setError(null);
    try {
      setData(await fetchDashboard());
    } catch {
      setData(DEMO_DATA); // demo fallback
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center max-w-md">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-white mb-1">Something went wrong</h2>
            <p className="text-sm text-slate-300 mb-4">{error}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-lg bg-[#2FD9C7] px-4 py-2 text-sm font-semibold text-[#0F1219] hover:bg-[#4FE5D3] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <Loader2 className="w-8 h-8 animate-spin text-[#2FD9C7]" aria-label="Loading dashboard" />
        )}
      </div>
    );
  }

  const tierTotal =
    data.tierBreakdown.A + data.tierBreakdown.B + data.tierBreakdown.C || 1;
  const risk = data.humanRiskScore;
  const riskColor =
    risk.score > 60 ? 'text-[#FF4757]' : risk.score >= 30 ? 'text-[#F59E0B]' : 'text-[#06D369]';
  const gaps = data.policyGaps;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <style>{`
        @keyframes pyPulse { 0%,100% { opacity: 1; } 50% { opacity: .8; } }
        .py-pulse-gentle { animation: pyPulse 2s ease-in-out infinite; }
        .py-pulse-urgent { animation: pyPulse 1.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .py-pulse-gentle, .py-pulse-urgent { animation: none; }
        }
      `}</style>

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-white">Command Center</h1>
        <p className="text-sm text-slate-400 mt-1">{today}</p>
      </header>

      {/* Section 2.1 — KPI strip */}
      <section aria-label="Key metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard>
          <div className="text-4xl font-black text-[#2FD9C7]">{data.activeCampaigns}</div>
          <div className="text-sm text-slate-400 mt-1">Campaigns Live</div>
          <div className="flex h-1.5 rounded-full overflow-hidden mt-4" aria-hidden="true">
            <div className="bg-[#FF4757]" style={{ width: `${(data.tierBreakdown.A / tierTotal) * 100}%` }} />
            <div className="bg-[#F59E0B]" style={{ width: `${(data.tierBreakdown.B / tierTotal) * 100}%` }} />
            <div className="bg-[#06D369]" style={{ width: `${(data.tierBreakdown.C / tierTotal) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
            <span>A: {data.tierBreakdown.A}</span>
            <span>B: {data.tierBreakdown.B}</span>
            <span>C: {data.tierBreakdown.C}</span>
          </div>
        </KpiCard>

        <KpiCard>
          <div className="text-4xl font-black text-white">{data.targetsEngaged.total}</div>
          <div className="text-sm text-slate-400 mt-1">Employees Targeted This Month</div>
          <div className="text-xs text-slate-400 mt-4">
            <span className="text-[#06D369]">{data.targetsEngaged.defended} defended</span>
            {' · '}
            <span className="text-[#FF4757]">{data.targetsEngaged.compromised} compromised</span>
            {' · '}
            {data.targetsEngaged.active} active
          </div>
        </KpiCard>

        <KpiCard>
          <div className={`text-4xl font-black ${riskColor}`}>{risk.score}</div>
          <div className="text-sm text-slate-400 mt-1">Human Risk Score</div>
          <div className="flex items-center gap-1 mt-4 text-xs">
            {risk.delta <= 0 ? (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-[#06D369]" aria-hidden="true" />
                <span className="text-[#06D369]">{Math.abs(risk.delta)}pts from last month</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-[#FF4757]" aria-hidden="true" />
                <span className="text-[#FF4757]">{risk.delta}pts from last month</span>
              </>
            )}
          </div>
        </KpiCard>

        <KpiCard>
          <div className="text-4xl font-black text-[#F59E0B]">
            {gaps.critical + gaps.high + gaps.medium}
          </div>
          <div className="text-sm text-slate-400 mt-1">Policy Gaps Detected</div>
          <div className="text-xs text-slate-400 mt-4">
            <span className="text-[#FF4757]">{gaps.critical} critical</span>
            {' · '}
            <span className="text-[#F59E0B]">{gaps.high} high</span>
            {' · '}
            <span className="text-[#5B9EFF]">{gaps.medium} medium</span>
          </div>
        </KpiCard>
      </section>

      {/* Section 2.2 — Live campaign feed */}
      <section aria-label="Live campaigns" className={`${panel} mt-6`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Live Campaigns</h2>
            <span className="relative flex w-2 h-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FD9C7] opacity-60" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-[#2FD9C7]" />
            </span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#2FD9C7] bg-[#2FD9C7]/10 rounded-full px-3 py-1">
            Real-time
          </span>
        </div>

        {data.liveCampaigns.length === 0 ? (
          <div className="text-center py-10">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No campaigns running</h3>
            <p className="text-sm text-slate-500 mb-6">Start a campaign to see live activity here.</p>
            <button
              type="button"
              onClick={() => navigate('/campaigns/new')}
              className="rounded-lg bg-[#2FD9C7] px-4 py-2.5 text-sm font-semibold text-[#0F1219] hover:bg-[#4FE5D3] transition-colors"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div>
            {data.liveCampaigns.map((c) => (
              <CampaignLivePill key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2.3 — Two-column lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <section aria-label="Recent activity" className={panel}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Recent Activity</h2>
            <Link
              to="/audit"
              className="text-xs text-[#2FD9C7] hover:text-[#1FA89D] transition-colors inline-flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
          {data.recentActivity.slice(0, 8).map((ev) => (
            <ActivityRow key={ev.id} event={ev} />
          ))}
        </section>

        <section aria-label="Trigger effectiveness" className={panel}>
          <h2 className="text-lg font-bold text-white mb-4">Trigger Effectiveness (Last 30 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.triggerStats.triggers}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: '#7A8595', fontSize: 12 }}
                  axisLine={{ stroke: '#2D3748' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="trigger"
                  width={100}
                  tick={{ fill: '#A8B4C4', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number | string, name) =>
                    name === 'effectiveness'
                      ? [`${value}%`, 'Effectiveness']
                      : [value, name]
                  }
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="effectiveness" radius={[0, 4, 4, 0]} isAnimationActive>
                  {data.triggerStats.triggers.map((t) => (
                    <Cell key={t.trigger} fill="#A78BFA" />
                  ))}
                </Bar>
                {/* sample count surfaced in tooltip */}
                <Bar dataKey="samples" hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">
            Based on {data.triggerStats.engagements} engagements across {data.triggerStats.campaigns} campaigns
          </p>
        </section>
      </div>

      {/* Section 2.4 — Compliance health strip */}
      <section aria-label="Compliance health" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {data.compliance.items.map((item) => {
          const Icon =
            item.status === 'compliant'
              ? CheckCircle2
              : item.status === 'pending'
                ? Clock
                : XCircle;
          const color =
            item.status === 'compliant'
              ? '#06D369'
              : item.status === 'pending'
                ? '#F59E0B'
                : '#FF4757';
          const label =
            item.status === 'compliant' ? 'Compliant' : item.status === 'pending' ? 'Pending' : 'Action needed';
          return (
            <div key={item.framework} className="bg-[#111827] border border-[#2D3748] rounded-xl p-4">
              <Icon className="w-5 h-5 mb-2" style={{ color }} aria-hidden="true" />
              <div className="text-sm font-semibold text-white">{item.framework}</div>
              <div className="text-xs mt-0.5" style={{ color }}>
                {label}
              </div>
              <div className="text-xs text-slate-500 mt-1">{item.note}</div>
            </div>
          );
        })}
      </section>
      <p className="text-xs text-slate-500 mt-3">
        Last compliance review:{' '}
        {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
          new Date(data.compliance.lastReview),
        )}
      </p>
    </div>
  );
}
