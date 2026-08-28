import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowDown, BarChart3, BookOpen, CheckCircle2, ChevronRight,
  Clock3, Loader2, Mail, MessageCircle, Phone, PlayCircle, ShieldCheck,
  ShieldX, StopCircle, Target, UserCog, Users, XCircle,
} from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Tier = 'A' | 'B' | 'C';
type Platform = 'email' | 'whatsapp' | 'sms' | 'voice' | 'linkedin' | 'instagram';
interface LiveCampaign { id: string; name: string; targetName: string; platforms: Platform[]; resistanceScore: number; tier: Tier; }
interface ActivityEvent { id: string; type: 'campaign_started' | 'campaign_halted' | 'target_defended' | 'target_compromised' | 'harm_detected' | 'admin_action' | 'debrief_delivered'; title: string; description: string; timestamp: string; }
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

function minutesAgo(minutes: number) { return new Date(Date.now() - minutes * 60_000).toISOString(); }
const DEMO_DATA: DashboardData = {
  activeCampaigns: 3, tierBreakdown: { A: 1, B: 1, C: 1 },
  targetsEngaged: { total: 23, defended: 14, compromised: 6, active: 3 },
  humanRiskScore: { score: 42, delta: -12 }, policyGaps: { critical: 2, high: 3, medium: 4 },
  liveCampaigns: [
    { id: 'camp_2026_08_27_001', name: 'Finance Team Payment Verification Q3', targetName: '6 targets · Finance', platforms: ['email', 'whatsapp'], resistanceScore: .68, tier: 'A' },
    { id: 'camp_2026_08_27_002', name: 'HR Onboarding Reset Wave 2', targetName: '4 targets · People Ops', platforms: ['email'], resistanceScore: .31, tier: 'B' },
    { id: 'camp_2026_08_27_003', name: 'Executive Whaling Simulation', targetName: '2 targets · Leadership', platforms: ['voice', 'sms'], resistanceScore: .82, tier: 'A' },
  ],
  recentActivity: [
    { id: 'ev1', type: 'target_compromised', title: 'Target compromised', description: 'Finance · credential entered on simulated portal', timestamp: minutesAgo(3) },
    { id: 'ev2', type: 'campaign_started', title: 'Campaign started', description: 'Executive Whaling Simulation — Tier A', timestamp: minutesAgo(18) },
    { id: 'ev3', type: 'harm_detected', title: 'Harm signal detected', description: 'Score 0.41 — auto-pause triggered for 1 target', timestamp: minutesAgo(34) },
    { id: 'ev4', type: 'target_defended', title: 'Target defended', description: 'Out-of-band verification used before acting', timestamp: minutesAgo(52) },
    { id: 'ev5', type: 'admin_action', title: 'Admin action', description: 'Tier escalation approved by security manager', timestamp: minutesAgo(76) },
    { id: 'ev6', type: 'debrief_delivered', title: 'Debrief delivered', description: 'Q2 recruitment phish — 4 employees debriefed', timestamp: minutesAgo(140) },
  ],
  triggerStats: { triggers: [
    { trigger: 'Authority', effectiveness: 72, samples: 148 }, { trigger: 'Urgency', effectiveness: 64, samples: 132 },
    { trigger: 'Fear', effectiveness: 51, samples: 87 }, { trigger: 'Social Proof', effectiveness: 47, samples: 74 }, { trigger: 'Reciprocity', effectiveness: 38, samples: 61 },
  ], engagements: 502, campaigns: 23 },
  compliance: { items: [
    { framework: 'GDPR', status: 'compliant', note: 'DPA on file' }, { framework: 'SOC 2', status: 'compliant', note: 'Type II — current' },
    { framework: 'HIPAA', status: 'pending', note: 'Review scheduled' }, { framework: 'CCPA', status: 'non_compliant', note: 'Retention policy overdue' },
  ], lastReview: '2026-08-12T00:00:00Z' },
};

async function fetchDashboard(): Promise<DashboardData> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch('/api/v1/organizations/me/dashboard', { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as DashboardData;
  } finally { window.clearTimeout(timer); }
}
function relativeTime(iso: string) { const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`; }
const platformIcon: Record<Platform, typeof Mail> = { email: Mail, whatsapp: MessageCircle, sms: MessageCircle, voice: Phone, linkedin: MessageCircle, instagram: MessageCircle };
const tierStyles: Record<Tier, string> = { A: 'border-[#ff4757]/30 bg-[#ff4757]/10 text-[#ff8892]', B: 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f6bf5c]', C: 'border-[#06d369]/30 bg-[#06d369]/10 text-[#58e6a0]' };

function Metric({ icon: Icon, value, label, detail, tone = 'text-[#f5f7fb]' }: { icon: typeof Target; value: string | number; label: string; detail: React.ReactNode; tone?: string }) {
  return <article className="py-command-card group relative overflow-hidden rounded-[1.35rem] p-5">
    <div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.035] text-[#a8b4c4]"><Icon className="h-[18px] w-[18px]" /></span><span className="font-mono text-[9px] uppercase tracking-[.2em] text-[#5a6470]">Live feed</span></div>
    <div className={`mt-6 text-4xl font-black tracking-[-.055em] ${tone}`}>{value}</div><p className="mt-1 text-sm text-[#a8b4c4]">{label}</p>
    <div className="mt-4 border-t border-white/[.055] pt-3 text-xs text-[#7a8595]">{detail}</div>
  </article>;
}
function Radar({ active }: { active: number }) {
  return <div className="relative aspect-square w-full max-w-[260px] py-radar" aria-hidden="true"><div className="absolute inset-0 rounded-full border border-[#ff4757]/15" /><div className="absolute inset-[16%] rounded-full border border-[#ff4757]/10" /><div className="absolute inset-[32%] rounded-full border border-[#ff4757]/15" /><div className="absolute inset-x-1/2 top-0 bottom-0 w-px bg-white/[.055]" /><div className="absolute inset-y-1/2 left-0 right-0 h-px bg-white/[.055]" /><div className="py-radar-sweep absolute inset-0 rounded-full" /><span className="absolute left-[23%] top-[28%] h-2 w-2 rounded-full bg-[#2fd9c7] shadow-[0_0_20px_rgba(47,217,199,.9)]" /><span className="absolute right-[20%] top-[42%] h-2 w-2 rounded-full bg-[#ff4757] shadow-[0_0_18px_rgba(255,71,87,.8)]" /><span className="absolute bottom-[22%] left-[42%] h-2 w-2 rounded-full bg-[#f59e0b]" /><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="font-mono text-4xl font-black text-white">{active}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[.22em] text-[#7a8595]">Active</div></div></div></div>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null); const [loadingError, setLoadingError] = useState(false); const navigate = useNavigate();
  const dateLabel = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()), []);
  useEffect(() => { fetchDashboard().then(setData).catch(() => { setData(DEMO_DATA); setLoadingError(true); }); }, []);
  if (!data) return <div className="flex min-h-[60vh] items-center justify-center bg-[#0f1219]"><Loader2 className="h-8 w-8 animate-spin text-[#2fd9c7]" /></div>;
  const tierTotal = Math.max(1, data.tierBreakdown.A + data.tierBreakdown.B + data.tierBreakdown.C);
  const gapTotal = data.policyGaps.critical + data.policyGaps.high + data.policyGaps.medium;
  const riskTone = data.humanRiskScore.score > 60 ? 'text-[#ff4757]' : data.humanRiskScore.score >= 30 ? 'text-[#f59e0b]' : 'text-[#06d369]';
  const activityMeta: Record<ActivityEvent['type'], { icon: typeof PlayCircle; color: string; label: string }> = {
    campaign_started: { icon: PlayCircle, color: '#2fd9c7', label: 'Started' }, campaign_halted: { icon: StopCircle, color: '#ff4757', label: 'Halted' },
    target_defended: { icon: ShieldCheck, color: '#06d369', label: 'Defended' }, target_compromised: { icon: ShieldX, color: '#ff4757', label: 'Compromised' },
    harm_detected: { icon: AlertTriangle, color: '#f59e0b', label: 'Safety' }, admin_action: { icon: UserCog, color: '#5b9eff', label: 'Admin' }, debrief_delivered: { icon: BookOpen, color: '#a78bfa', label: 'Debrief' },
  };

  return <main className="relative min-h-screen overflow-hidden bg-[#0b0e14] px-4 py-5 text-[#f5f7fb] sm:px-6 lg:px-8">
    <div className="pointer-events-none absolute inset-0 py-grid-signal opacity-50" /><div className="pointer-events-none absolute left-[18%] top-[-20rem] h-[45rem] w-[45rem] rounded-full bg-[#ff4757]/[.045] blur-[130px]" /><div className="pointer-events-none absolute right-[-15rem] top-40 h-[36rem] w-[36rem] rounded-full bg-[#2fd9c7]/[.035] blur-[130px]" />
    <div className="relative mx-auto max-w-[1500px]">
      {loadingError && <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/[.06] px-4 py-3 text-xs text-[#f6bf5c]"><AlertTriangle className="h-4 w-4" />Demo telemetry is shown while the API is unavailable.</div>}
      <section className="py-command-hero relative overflow-hidden rounded-[1.75rem] px-6 py-7 sm:px-8 lg:px-10 lg:py-9">
        <div className="absolute right-6 top-5 font-mono text-[9px] uppercase tracking-[.22em] text-[#7a8595]">{dateLabel} · system nominal</div>
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_290px]"><div className="py-fade-up"><div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#ff6a76]"><span className="py-status-dot h-2 w-2 rounded-full bg-[#ff4757]" /> Threat intelligence / command layer</div><h1 className="max-w-2xl text-4xl font-black leading-[.95] tracking-[-.065em] sm:text-6xl">See the human attack surface <span className="text-[#2fd9c7]">while it moves.</span></h1><p className="mt-5 max-w-xl text-sm leading-6 text-[#a8b4c4]">A live operational view of authorized simulations, resistance signals, safety controls, and the patterns worth acting on.</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={() => navigate('/campaigns/new')} className="rounded-xl bg-[#f5f7fb] px-4 py-3 text-sm font-bold text-[#0b0e14] shadow-[0_10px_30px_rgba(255,255,255,.08)] hover:-translate-y-0.5">Launch campaign <span className="ml-1 text-[#ff4757]">↗</span></button><Link to="/campaigns" className="rounded-xl border border-white/[.11] bg-white/[.025] px-4 py-3 text-sm font-semibold text-[#dbe1eb] hover:border-[#2fd9c7]/40 hover:text-[#2fd9c7]">View all simulations</Link></div></div><div className="mx-auto w-full max-w-[260px] py-fade-up py-fade-up-delay-2"><Radar active={data.activeCampaigns} /></div></div>
      </section>

      <section aria-label="Key metrics" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 py-fade-up py-fade-up-delay-1">
        <Metric icon={Target} value={data.activeCampaigns} label="Campaigns live" tone="text-[#2fd9c7]" detail={<><div className="flex h-1.5 overflow-hidden rounded-full bg-white/[.06]"><i className="bg-[#ff4757]" style={{ width: `${data.tierBreakdown.A / tierTotal * 100}%` }} /><i className="bg-[#f59e0b]" style={{ width: `${data.tierBreakdown.B / tierTotal * 100}%` }} /><i className="bg-[#06d369]" style={{ width: `${data.tierBreakdown.C / tierTotal * 100}%` }} /></div><div className="mt-2 flex justify-between font-mono text-[9px]"><span>A/{data.tierBreakdown.A}</span><span>B/{data.tierBreakdown.B}</span><span>C/{data.tierBreakdown.C}</span></div></>} />
        <Metric icon={Users} value={data.targetsEngaged.total} label="People engaged" detail={<><span className="text-[#06d369]">{data.targetsEngaged.defended} defended</span> · <span className="text-[#ff7b86]">{data.targetsEngaged.compromised} compromised</span> · {data.targetsEngaged.active} active</>} />
        <Metric icon={ShieldCheck} value={data.humanRiskScore.score} label="Human risk score" tone={riskTone} detail={<span className={data.humanRiskScore.delta <= 0 ? 'text-[#06d369]' : 'text-[#ff7b86]'}><ArrowDown className={`mr-1 inline h-3 w-3 ${data.humanRiskScore.delta > 0 ? 'rotate-180' : ''}`} />{Math.abs(data.humanRiskScore.delta)} pts vs last month</span>} />
        <Metric icon={AlertTriangle} value={gapTotal} label="Policy gaps detected" tone="text-[#f6bf5c]" detail={<><span className="text-[#ff7b86]">{data.policyGaps.critical} critical</span> · <span className="text-[#f6bf5c]">{data.policyGaps.high} high</span> · {data.policyGaps.medium} medium</>} />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        <section className="py-command-card rounded-[1.5rem] p-5 sm:p-6 py-fade-up py-fade-up-delay-2"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><span className="py-pulse-live h-2 w-2 rounded-full bg-[#ff4757]" /><h2 className="text-lg font-bold tracking-tight">Simulation feed</h2></div><p className="mt-1 text-xs text-[#7a8595]">Live operational state across active campaigns</p></div><span className="rounded-full border border-[#ff4757]/20 bg-[#ff4757]/[.06] px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-[#ff8892]">{data.activeCampaigns} running</span></div><div className="mt-5 space-y-2">
          {data.liveCampaigns.map(c => { const Icons = c.platforms.map(p => platformIcon[p]); return <article key={c.id} className="group flex flex-wrap items-center gap-4 rounded-xl border border-white/[.055] bg-black/[.12] p-4 transition hover:border-white/[.12] hover:bg-white/[.025]"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-bold">{c.name}</h3><span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${tierStyles[c.tier]}`}>TIER {c.tier}</span></div><p className="mt-1 text-xs text-[#7a8595]">{c.targetName}</p><div className="mt-2 flex gap-2 text-[#5a6470]">{Icons.map((Icon, i) => <Icon key={`${c.id}-${i}`} className="h-3.5 w-3.5" />)}</div></div><div className="w-24"><div className="flex justify-between font-mono text-[9px] text-[#7a8595]"><span>RESIST</span><span>{Math.round(c.resistanceScore * 100)}%</span></div><div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[.06]"><div className={c.resistanceScore > .67 ? 'h-full bg-[#ff4757]' : c.resistanceScore > .33 ? 'h-full bg-[#f59e0b]' : 'h-full bg-[#06d369]'} style={{ width: `${c.resistanceScore * 100}%` }} /></div></div><button onClick={() => navigate(`/campaigns/${c.id}/live`)} className="rounded-lg border border-white/[.09] px-3 py-2 text-xs font-semibold text-[#a8b4c4] hover:border-[#2fd9c7]/40 hover:text-[#2fd9c7]">Monitor <ChevronRight className="ml-1 inline h-3.5 w-3.5" /></button></article>; })}
        </div></section>
        <section className="py-command-card rounded-[1.5rem] p-5 sm:p-6 py-fade-up py-fade-up-delay-3"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold tracking-tight">Signal log</h2><p className="mt-1 text-xs text-[#7a8595]">Most recent events</p></div><Link to="/audit" className="font-mono text-[10px] uppercase tracking-wider text-[#2fd9c7]">Open audit ↗</Link></div><div className="mt-4 space-y-1">
          {data.recentActivity.slice(0, 6).map(e => { const meta = activityMeta[e.type]; const Icon = meta.icon; return <div key={e.id} className="flex gap-3 rounded-xl px-2 py-3 hover:bg-white/[.025]"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[.035]"><Icon className="h-4 w-4" style={{ color: meta.color }} /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><span className="text-sm font-semibold">{e.title}</span><time className="font-mono text-[9px] text-[#5a6470]">{relativeTime(e.timestamp)}</time></div><p className="mt-0.5 text-xs leading-5 text-[#7a8595]">{e.description}</p></div></div>; })}
        </div></section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 py-fade-up py-fade-up-delay-4">
        <section className="py-command-card rounded-[1.5rem] p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold tracking-tight">Trigger effectiveness</h2><p className="mt-1 text-xs text-[#7a8595]">Which psychological levers are producing engagement</p></div><BarChart3 className="h-5 w-5 text-[#a78bfa]" /></div><div className="mt-5 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.triggerStats.triggers} layout="vertical" margin={{ left: 8, right: 8 }}><XAxis type="number" domain={[0,100]} tick={{ fill:'#7a8595', fontSize:10 }} axisLine={{ stroke:'#2d3748' }} tickLine={false}/><YAxis type="category" dataKey="trigger" width={86} tick={{ fill:'#a8b4c4', fontSize:10 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background:'#15191f', border:'1px solid #3d4860', borderRadius:12, color:'#f5f7fb', fontSize:12 }} formatter={(v:number|string)=>[`${v}%`,'Effectiveness']}/><Bar dataKey="effectiveness" radius={[0,6,6,0]}>{['#ff4757','#f59e0b','#a78bfa','#5b9eff','#2fd9c7'].map((fill,i)=><Cell key={i} fill={fill}/>)}</Bar></BarChart></ResponsiveContainer></div></section>
        <section className="py-command-card rounded-[1.5rem] p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold tracking-tight">Control posture</h2><p className="mt-1 text-xs text-[#7a8595]">Governance and framework signals</p></div><ShieldCheck className="h-5 w-5 text-[#2fd9c7]" /></div><div className="mt-5 divide-y divide-white/[.055]">{data.compliance.items.map(item => { const ok = item.status === 'compliant'; const pending = item.status === 'pending'; const Icon = ok ? CheckCircle2 : pending ? Clock3 : XCircle; const color = ok ? '#06d369' : pending ? '#f59e0b' : '#ff4757'; return <div key={item.framework} className="flex items-center gap-3 py-3.5"><Icon className="h-4 w-4" style={{ color }}/><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{item.framework}</div><div className="mt-0.5 text-xs text-[#7a8595]">{item.note}</div></div><span className="font-mono text-[9px] uppercase tracking-wider" style={{ color }}>{item.status.replace('_',' ')}</span></div>; })}</div><div className="mt-5 rounded-xl border border-[#2fd9c7]/12 bg-[#2fd9c7]/[.035] p-3 text-xs text-[#a8b4c4]">Last control review: {new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', year:'numeric' }).format(new Date(data.compliance.lastReview))}</div></section>
      </div>
    </div>
  </main>;
}
