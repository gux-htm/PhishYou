/**
 * PhishYou — Dashboard / Command Center (`/dashboard`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 2: Dashboard
 * Checklist: IMPLEMENTATION_CHECKLIST.md — Page 2: Dashboard
 */
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  BarChart3,
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
  Users,
  XCircle,
} from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Tier = 'A' | 'B' | 'C';
type Platform = 'email' | 'whatsapp' | 'sms' | 'voice' | 'linkedin' | 'instagram';

interface LiveCampaign { id: string; name: string; targetName: string; platforms: Platform[]; resistanceScore: number; tier: Tier; }
interface ActivityEvent {
  id: string;
  type: 'campaign_started' | 'campaign_halted' | 'target_defended' | 'target_compromised' | 'harm_detected' | 'admin_action' | 'debrief_delivered';
  title: string;
  description: string;
  timestamp: string;
}
interface TriggerStat { trigger: string; effectiveness: number; samples: number; }
interface ComplianceItem { framework: string; status: 'compliant' | 'pending' | 'non_compliant'; note: string; }
interface DashboardData {
  activeCampaigns: number;
  tierBreakdown: { A: number; B: number; C: number };
  targetsEngaged: { total: number; defended: number; compromised: number; active: number };
  humanRiskScore: { score: number; delta: number };
  policyGaps: { critical: number; high: number; medium: number };
  liveCampaigns: LiveCampaign[];
  recentActivity: ActivityEvent[];
  triggerStats: { triggers: TriggerStat[]; engagements: number; campaigns: number };
  compliance: { items: ComplianceItem[]; lastReview: string };
}

const DEMO_DATA: DashboardData = {
  activeCampaigns: 3,
  tierBreakdown: { A: 1, B: 1, C: 1 },
  targetsEngaged: { total: 23, defended: 14, compromised: 6, active: 3 },
  humanRiskScore: { score: 42, delta: -12 },
  policyGaps: { critical: 2, high: 3, medium: 4 },
  liveCampaigns: [
    { id: 'camp_2026_08_27_001', name: 'Finance Team Payment Verification Q3', targetName: '6 targets · Finance', platforms: ['email', 'whatsapp'], resistanceScore: 0.68, tier: 'A' },
    { id: 'camp_2026_08_27_002', name: 'HR Onboarding Reset Wave 2', targetName: '4 targets · People Ops', platforms: ['email'], resistanceScore: 0.31, tier: 'B' },
    { id: 'camp_2026_08_27_003', name: 'Executive Whaling Simulation', targetName: '2 targets · Leadership', platforms: ['voice', 'sms'], resistanceScore: 0.82, tier: 'A' },
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

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

async function fetchDashboard(): Promise<DashboardData> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch('/api/v1/organizations/me/dashboard', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as DashboardData;
  } finally {
    window.clearTimeout(timer);
  }
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
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

function resistanceColor(score: number): string {
  if (score < 0.33) return '#06D369';
  if (score <= 0.67) return '#F59E0B';
  return '#FF4757';
}

const tierStyles: Record<Tier, string> = {
  A: 'bg-[#FF4757]/10 text-[#FF7B86] border-[#FF4757]/20',
  B: 'bg-[#F59E0B]/10 text-[#F6BF5C] border-[#F59E0B]/20',
  C: 'bg-[#06D369]/10 text-[#58E6A0] border-[#06D369]/20',
};

function Gauge({ value, size = 56 }: { value: number; size?: number }) {
  const clamped = Math.min(1, Math.max(0, value));
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = resistanceColor(clamped);

  return (
    <div
      className={`relative shrink-0 ${clamped > 0.7 ? 'py-pulse-live' : clamped >= 0.3 ? 'py-pulse-soft' : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Resistance score ${Math.round(clamped * 100)}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#3D4860" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className="transition-[stroke-dashoffset,stroke] duration-1000 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold" style={{ color }}>
        {Math.round(clamped * 100)}
      </span>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  children,
  tone = 'text-white',
}: {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
  children?: ReactNode;
  tone?: string;
}) {
  return (
    <article className="py-sheen rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#3D4860] hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#232D39] text-[#A8B4C4]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5A6470]">Live</span>
      </div>
      <div className={`mt-5 text-3xl font-black tracking-[-0.03em] ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-[#A8B4C4]">{label}</div>
      {children}
    </article>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingError, setLoadingError] = useState(false);
  const navigate = useNavigate();
  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()),
    [],
  );

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => {
        setData(DEMO_DATA);
        setLoadingError(true);
      });
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#0F1219]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2FD9C7]" aria-label="Loading dashboard" />
      </div>
    );
  }

  const tierTotal = Math.max(1, data.tierBreakdown.A + data.tierBreakdown.B + data.tierBreakdown.C);
  const riskTone = data.humanRiskScore.score > 60 ? 'text-[#FF4757]' : data.humanRiskScore.score >= 30 ? 'text-[#F59E0B]' : 'text-[#06D369]';
  const riskImproving = data.humanRiskScore.delta <= 0;
  const gapTotal = data.policyGaps.critical + data.policyGaps.high + data.policyGaps.medium;

  const activityMeta: Record<ActivityEvent['type'], { icon: typeof PlayCircle; color: string; bg: string }> = {
    campaign_started: { icon: PlayCircle, color: '#2FD9C7', bg: 'bg-[#2FD9C7]/10' },
    campaign_halted: { icon: StopCircle, color: '#FF4757', bg: 'bg-[#FF4757]/10' },
    target_defended: { icon: ShieldCheck, color: '#06D369', bg: 'bg-[#06D369]/10' },
    target_compromised: { icon: ShieldX, color: '#FF4757', bg: 'bg-[#FF4757]/12' },
    harm_detected: { icon: AlertTriangle, color: '#F59E0B', bg: 'bg-[#F59E0B]/10' },
    admin_action: { icon: UserCog, color: '#5B9EFF', bg: 'bg-[#5B9EFF]/10' },
    debrief_delivered: { icon: BookOpen, color: '#A78BFA', bg: 'bg-[#A78BFA]/10' },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F1219] px-4 py-8 text-[#F5F7FB] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#2FD9C7]/[0.035] to-transparent" />
      <div className="relative mx-auto max-w-7xl">
        {loadingError && (
          <div className="mb-5 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] px-4 py-3 text-xs text-[#F6BF5C]">
            Showing demo data because the dashboard API is unavailable.
          </div>
        )}

        <header className="mb-7 flex flex-wrap items-end justify-between gap-4 py-fade-up">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2FD9C7]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2FD9C7]" /> Security operations
            </div>
            <h1 className="text-4xl font-black tracking-[-0.04em]">Command Center</h1>
            <p className="mt-1 text-sm text-[#7A8595]">{dateLabel} · A calm view of what needs attention.</p>
          </div>
          <button
            onClick={() => navigate('/campaigns/new')}
            className="min-h-11 rounded-xl bg-[#2FD9C7] px-4 py-2.5 text-sm font-bold text-[#0F1219] shadow-[0_10px_28px_rgba(47,217,199,0.10)] hover:-translate-y-0.5 hover:bg-[#4FE5D3] active:translate-y-0"
          >
            Create campaign <span className="ml-1">→</span>
          </button>
        </header>

        <section aria-label="Key metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4 py-fade-up py-fade-up-delay-1">
          <KpiCard icon={Target} label="Campaigns live" value={data.activeCampaigns} tone="text-[#2FD9C7]">
            <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-[#232D39]" aria-hidden="true">
              <div className="bg-[#FF4757]" style={{ width: `${(data.tierBreakdown.A / tierTotal) * 100}%` }} />
              <div className="bg-[#F59E0B]" style={{ width: `${(data.tierBreakdown.B / tierTotal) * 100}%` }} />
              <div className="bg-[#06D369]" style={{ width: `${(data.tierBreakdown.C / tierTotal) * 100}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[#5A6470]
">
              <span>A {data.tierBreakdown.A}</span><span>B {data.tierBreakdown.B}</span><span>C {data.tierBreakdown.C}</span>
            </div>
          </KpiCard>

          <KpiCard icon={Users} label="Employees targeted this month" value={data.targetsEngaged.total}>
            <div className="mt-4 text-xs text-[#7A8595]"><span className="text-[#06D369]">{data.targetsEngaged.defended} defended</span> · <span className="text-[#FF4757]">{data.targetsEngaged.compromised} compromised</span> · {data.targetsEngaged.active} active</div>
          </KpiCard>

          <KpiCard icon={ShieldCheck} label="Human risk score" value={data.humanRiskScore.score} tone={riskTone}>
            <div className={`mt-4 flex items-center gap-1 text-xs ${riskImproving ? 'text-[#06D369]' : 'text-[#FF4757]'}`}>
              <ArrowDown className={`h-3.5 w-3.5 ${riskImproving ? '' : 'rotate-180'}`} />
              {Math.abs(data.humanRiskScore.delta)}pts vs last month
            </div>
          </KpiCard>

          <KpiCard icon={AlertTriangle} label="Policy gaps detected" value={gapTotal} tone="text-[#F59E0B]">
            <div className="mt-4 text-xs text-[#7A8595]"><span className="text-[#FF4757]">{data.policyGaps.critical} critical</span> · <span className="text-[#F59E0B]">{data.policyGaps.high} high</span> · {data.policyGaps.medium} medium</div>
          </KpiCard>
        </section>

        <section aria-label="Live campaigns" className="mt-6 rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 py-fade-up py-fade-up-delay-2 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><h2 className="text-lg font-bold">Live campaigns</h2><span className="py-pulse-live h-2 w-2 rounded-full bg-[#2FD9C7]" /></div>
              <p className="mt-1 text-xs text-[#7A8595]">Real-time operational overview</p>
            </div>
            <span className="rounded-full border border-[#2FD9C7]/20 bg-[#2FD9C7]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8FEFE3]">{data.activeCampaigns} active</span>
          </div>
          <div className="mt-4 divide-y divide-[#2D3748]">
            {data.liveCampaigns.map((campaign) => (
              <div key={campaign.id} className="group flex flex-wrap items-center gap-4 py-4 last:pb-1">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold">{campaign.name}</h3>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tierStyles[campaign.tier]}`}>Tier {campaign.tier}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[#7A8595]">{campaign.targetName}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[#5A6470]">{campaign.platforms.map((platform) => { const Icon = platformIcon[platform]; return <Icon key={platform} className="h-3.5 w-3.5" aria-label={platform} />; })}</div>
                </div>
                <Gauge value={campaign.resistanceScore} />
                <button onClick={() => navigate(`/campaigns/${campaign.id}/live`)} className="min-h-10 rounded-lg border border-[#3D4860] px-3.5 py-2 text-xs font-semibold text-[#A8B4C4] hover:border-[#2FD9C7]/45 hover:bg-[#2FD9C7]/[0.05] hover:text-[#2FD9C7]">
                  View live <ChevronRight className="ml-1 inline h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 py-fade-up py-fade-up-delay-3">
          <section className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-bold">Recent activity</h2><p className="mt-1 text-xs text-[#7A8595]">Latest actions across the organization</p></div>
              <Link to="/audit" className="text-xs font-semibold text-[#2FD9C7] hover:text-[#4FE5D3]">View all →</Link>
            </div>
            <div className="mt-4">
              {data.recentActivity.slice(0, 6).map((event) => {
                const meta = activityMeta[event.type];
                const Icon = meta.icon;
                return <div key={event.id} className="flex items-start gap-3 border-b border-[#2D3748] py-3 last:border-0"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.bg}`}><Icon className="h-4 w-4" style={{ color: meta.color }} /></span><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{event.title}</div><div className="mt-0.5 text-xs leading-5 text-[#7A8595]">{event.description}</div></div><time className="shrink-0 text-[10px] text-[#5A6470]">{relativeTime(event.timestamp)}</time></div>;
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6">
            <div><h2 className="text-lg font-bold">Trigger effectiveness</h2><p className="mt-1 text-xs text-[#7A8595]">Last 30 days</p></div>
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.triggerStats.triggers} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#7A8595', fontSize: 11 }} axisLine={{ stroke: '#2D3748' }} tickLine={false} />
                  <YAxis type="category" dataKey="trigger" width={90} tick={{ fill: '#A8B4C4', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1D232D', border: '1px solid #3D4860', borderRadius: 12, fontSize: 12, color: '#F5F7FB' }} formatter={(value: number | string) => [`${value}%`, 'Effectiveness']} />
                  <Bar dataKey="effectiveness" radius={[0, 6, 6, 0]} isAnimationActive>
                    <Cell fill="#A78BFA" /><Cell fill="#60A5FA" /><Cell fill="#34D399" /><Cell fill="#FBBF24" /><Cell fill="#2FD9C7" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[10px] text-[#5A6470]">{data.triggerStats.engagements} engagements · {data.triggerStats.campaigns} campaigns</p>
          </section>
        </div>

        <section aria-label="Compliance health" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 py-fade-up py-fade-up-delay-4">
          {data.compliance.items.map((item) => {
            const Icon = item.status === 'compliant' ? CheckCircle2 : item.status === 'pending' ? Clock : XCircle;
            const color = item.status === 'compliant' ? '#06D369' : item.status === 'pending' ? '#F59E0B' : '#FF4757';
            const statusLabel = item.status === 'compliant' ? 'Healthy' : item.status === 'pending' ? 'Review' : 'Action';
            return <div key={item.framework} className="py-sheen rounded-xl border border-[#2D3748] bg-[#15191F] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#3D4860]"><div className="flex items-center justify-between"><Icon className="h-5 w-5" style={{ color }} /><span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{statusLabel}</span></div><div className="mt-3 text-sm font-bold">{item.framework}</div><div className="mt-1 text-xs text-[#7A8595]">{item.note}</div></div>;
          })}
        </section>
        <p className="mt-3 text-xs text-[#5A6470]">Last compliance review: {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(data.compliance.lastReview))}</p>
      </div>
    </div>
  );
}
