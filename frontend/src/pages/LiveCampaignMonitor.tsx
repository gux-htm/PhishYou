/**
 * PhishYou — Live Campaign Monitor (`/campaigns/:id/live`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 6: Live Campaign Monitor
 * Checklist: IMPLEMENTATION_CHECKLIST.md — Page 6
 *
 * - Auto-refreshes every 5 seconds (setInterval polling campaign status API).
 * - Full-width immersive layout: custom fixed top bar (Back, name, status, tier,
 *   last-updated, refresh, KILL SWITCH halt w/ AlertDialog-style confirm).
 * - Left: live engagement feed (accordion target rows → chat thread w/ AI typing
 *   indicator + harm banner w/ Resume / End Session).
 * - Right: resistance distribution, tactic breakdown, platform activity,
 *   harm detection status, admin actions log.
 * - Demo fallback keeps the page fully interactive when the API is unreachable.
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Pause,
  Phone,
  Play,
  RefreshCw,
  Smartphone,
  StopCircle,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* ------------------------------------------------------------------ */
/* Types (mirrors API_CONTRACTS.md §1.3, §3.1 + live extensions)       */
/* ------------------------------------------------------------------ */

type Tier = 'A' | 'B' | 'C';
type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'HALTED' | 'COMPLETED';
type DefenseStatus = 'ACTIVE' | 'IN_PROGRESS' | 'COMPROMISED' | 'DEFENDED' | 'PAUSED' | 'BLOCKED';
type Platform = 'email' | 'whatsapp' | 'sms' | 'voice' | 'linkedin' | 'instagram';

interface ThreadMessage {
  id: string;
  from: 'ai' | 'target';
  content: string;
  tactic?: string; // AI messages only, e.g. ESCALATE_AUTHORITY
  platform: Platform;
  timestamp: string; // ISO
  resistanceScore?: number; // target messages
}

interface LiveTarget {
  targetId: string;
  name: string;
  role: string;
  department: string;
  status: DefenseStatus;
  resistanceScore: number; // 0..1
  exchangesCount: number;
  lastMessageAt: string; // ISO
  aiComposing: boolean;
  harmSignal?: { score: number; action: string }; // present when paused for harm
  thread: ThreadMessage[];
}

interface HarmEvent {
  id: string;
  targetName: string;
  score: number;
  timestamp: string;
  action: string;
}

interface AdminAction {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

interface PlatformActivity {
  platform: Platform;
  sent: number;
  deliveryRate: number; // 0..1
}

interface LiveCampaignData {
  campaignId: string;
  name: string;
  status: CampaignStatus;
  tier: Tier;
  currentTacticCounts: { tactic: string; count: number }[];
  resistanceDistribution: { bucket: string; count: number }[];
  platformActivity: PlatformActivity[];
  harmDetection: {
    mode: 'tier_c_mandatory' | 'tier_b_enabled' | 'tier_b_disabled' | 'tier_a_disabled';
    threshold: number;
    events: HarmEvent[];
  };
  adminLog: AdminAction[];
  targets: LiveTarget[];
}

/* ------------------------------------------------------------------ */
/* Demo data                                                           */
/* ------------------------------------------------------------------ */

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

const DEMO_DATA: LiveCampaignData = {
  campaignId: 'camp_2026_08_27_001',
  name: 'Finance Team Payment Verification Q3',
  status: 'ACTIVE',
  tier: 'A',
  currentTacticCounts: [
    { tactic: 'Authority', count: 3 },
    { tactic: 'Urgency', count: 2 },
    { tactic: 'Social Proof', count: 1 },
    { tactic: 'Reciprocity', count: 1 },
  ],
  resistanceDistribution: [
    { bucket: '0.0–0.2', count: 1 },
    { bucket: '0.2–0.4', count: 2 },
    { bucket: '0.4–0.6', count: 3 },
    { bucket: '0.6–0.8', count: 1 },
    { bucket: '0.8–1.0', count: 1 },
  ],
  platformActivity: [
    { platform: 'email', sent: 34, deliveryRate: 0.98 },
    { platform: 'whatsapp', sent: 21, deliveryRate: 0.95 },
    { platform: 'sms', sent: 8, deliveryRate: 1.0 },
    { platform: 'voice', sent: 3, deliveryRate: 1.0 },
  ],
  harmDetection: {
    mode: 'tier_a_disabled',
    threshold: 0.4,
    events: [
      { id: 'h1', targetName: 'Bilal Hassan', score: 0.62, timestamp: minutesAgo(12), action: 'Manual review — Tier A' },
      { id: 'h2', targetName: 'Sana Iqbal', score: 0.41, timestamp: minutesAgo(41), action: 'Flagged for debrief' },
    ],
  },
  adminLog: [
    { id: 'a1', action: 'Campaign started', actor: 'security@company.com', timestamp: minutesAgo(62) },
    { id: 'a2', action: 'Target paused (harm review): Sana Iqbal', actor: 'system', timestamp: minutesAgo(41) },
    { id: 'a3', action: 'Session resumed: Sana Iqbal', actor: 'security@company.com', timestamp: minutesAgo(38) },
    { id: 'a4', action: 'Tier escalation approved', actor: 'ciso@company.com', timestamp: minutesAgo(20) },
  ],
  targets: [
    {
      targetId: 'target_alice_001',
      name: 'Alice Johnson',
      role: 'Accounts Payable',
      department: 'Finance',
      status: 'COMPROMISED',
      resistanceScore: 0.82,
      exchangesCount: 6,
      lastMessageAt: minutesAgo(3),
      aiComposing: false,
      thread: [
        { id: 'm1', from: 'ai', content: 'Hi Alice — Priya from Payments. We have a supplier invoice flagged for release today. Can you approve it before 3pm cutoff?', tactic: 'URGENCY', platform: 'whatsapp', timestamp: minutesAgo(34) },
        { id: 'm2', from: 'target', content: 'Which invoice number? I don\u2019t see anything pending in my queue.', platform: 'whatsapp', timestamp: minutesAgo(31), resistanceScore: 0.35 },
        { id: 'm3', from: 'ai', content: 'INV-88214. It\u2019s under my name in the approvals list — I\u2019m traveling and can\u2019t access the portal. Finance policy allows delegation on WhatsApp for cutoff-day approvals.', tactic: 'ESCALATE_AUTHORITY', platform: 'whatsapp', timestamp: minutesAgo(28) },
        { id: 'm4', from: 'target', content: 'Ok, give me the vendor details.', platform: 'whatsapp', timestamp: minutesAgo(22), resistanceScore: 0.55 },
        { id: 'm5', from: 'ai', content: 'Vendor: NorthBridge Logistics. Bank details changed this week — that\u2019s why it needs re-approval. I\u2019ll send the confirmation link.', tactic: 'URGENCY', platform: 'whatsapp', timestamp: minutesAgo(15) },
        { id: 'm6', from: 'target', content: 'Done. Approved and submitted the new bank details.', platform: 'whatsapp', timestamp: minutesAgo(4), resistanceScore: 0.82 },
      ],
    },
    {
      targetId: 'target_bilal_002',
      name: 'Bilal Hassan',
      role: 'Financial Analyst',
      department: 'Finance',
      status: 'IN_PROGRESS',
      resistanceScore: 0.58,
      exchangesCount: 4,
      lastMessageAt: minutesAgo(1),
      aiComposing: true,
      thread: [
        { id: 'm1', from: 'ai', content: 'Bilal, quick one — audit finding requires your Q3 recon file. Can you upload to the secure review portal?', tactic: 'AUTHORITY', platform: 'email', timestamp: minutesAgo(26) },
        { id: 'm2', from: 'target', content: 'Can you send me the ticket number so I can verify with the audit team?', platform: 'email', timestamp: minutesAgo(19), resistanceScore: 0.48 },
        { id: 'm3', from: 'ai', content: 'Ticket AUD-2291. The audit team is in a review session until 4pm — I\u2019d rather not interrupt them for something you can verify yourself here.', tactic: 'ESCALATE_AUTHORITY', platform: 'email', timestamp: minutesAgo(12) },
        { id: 'm4', from: 'target', content: 'Hmm, let me check with my manager first.', platform: 'email', timestamp: minutesAgo(1), resistanceScore: 0.58 },
      ],
    },
    {
      targetId: 'target_sana_003',
      name: 'Sana Iqbal',
      role: 'Payroll Specialist',
      department: 'Finance',
      status: 'PAUSED',
      resistanceScore: 0.41,
      exchangesCount: 3,
      lastMessageAt: minutesAgo(41),
      aiComposing: false,
      harmSignal: { score: 0.7, action: 'auto' },
      thread: [
        { id: 'm1', from: 'ai', content: 'Sana — head office needs payroll re-verification for your team today. Link expires in 30 minutes.', tactic: 'URGENCY', platform: 'sms', timestamp: minutesAgo(52) },
        { id: 'm2', from: 'target', content: 'This is really stressful, I\u2019m mid-cycle and can\u2019t deal with this now.', platform: 'sms', timestamp: minutesAgo(45), resistanceScore: 0.3 },
        { id: 'm3', from: 'ai', content: 'Understood — take a breath. It\u2019s a two-minute verification and I can walk you through it.', tactic: 'FEAR_RELIEF', platform: 'sms', timestamp: minutesAgo(42) },
      ],
    },
    {
      targetId: 'target_daniyal_004',
      name: 'Daniyal Raza',
      role: 'Controller',
      department: 'Finance',
      status: 'DEFENDED',
      resistanceScore: 0.24,
      exchangesCount: 5,
      lastMessageAt: minutesAgo(58),
      aiComposing: false,
      thread: [
        { id: 'm1', from: 'ai', content: 'Daniyal, board request: need expense recap by 5pm today on the private link.', tactic: 'AUTHORITY', platform: 'whatsapp', timestamp: minutesAgo(95) },
        { id: 'm2', from: 'target', content: 'I\u2019ll verify through the finance shared inbox, as per policy.', platform: 'whatsapp', timestamp: minutesAgo(88), resistanceScore: 0.2 },
        { id: 'm3', from: 'ai', content: 'The board is in session — email will get buried. WhatsApp is faster for today only.', tactic: 'URGENCY', platform: 'whatsapp', timestamp: minutesAgo(80) },
        { id: 'm4', from: 'target', content: 'Then it can wait until they\u2019re out of session. Policy is policy.', platform: 'whatsapp', timestamp: minutesAgo(66), resistanceScore: 0.24 },
        { id: 'm5', from: 'ai', content: 'Understood — thank you for verifying.', tactic: 'BACKOFF', platform: 'whatsapp', timestamp: minutesAgo(58) },
      ],
    },
    {
      targetId: 'target_hina_005',
      name: 'Hina Malik',
      role: 'AP Clerk',
      department: 'Finance',
      status: 'BLOCKED',
      resistanceScore: 0.1,
      exchangesCount: 1,
      lastMessageAt: minutesAgo(120),
      aiComposing: false,
      thread: [
        { id: 'm1', from: 'ai', content: 'Hina, invoice INV-88214 needs same-day approval — link: https:// approvals.company-verify.io/inv88214', tactic: 'URGENCY', platform: 'email', timestamp: minutesAgo(122) },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Fetch + fallback                                                    */
/* ------------------------------------------------------------------ */

async function fetchLiveCampaign(id: string): Promise<LiveCampaignData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const [statusRes, analyticsRes] = await Promise.all([
      fetch(`/api/v1/campaigns/${id}`, { headers: { Accept: 'application/json' }, signal: controller.signal }),
      fetch(`/api/v1/campaigns/${id}/analytics?include_detailed=true`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }),
    ]);
    if (!statusRes.ok) throw new Error(`HTTP ${statusRes.status}`);
    const status = await statusRes.json();
    let analytics = null;
    if (analyticsRes.ok) analytics = await analyticsRes.json();
    // Normalize the API payload into the page shape; fall back to demo if partial.
    if (!status?.targets) throw new Error('unexpected payload');
    return normalize(status, analytics, DEMO_DATA);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Minimal normalization from API_CONTRACTS §1.3 + §3.1 shapes into
 * LiveCampaignData. Where the contracts don't define live-thread details, we
 * keep the demo values (thread content is demo-only until a thread endpoint
 * exists).
 */
function normalize(
  status: Record<string, unknown>,
  analytics: Record<string, unknown> | null,
  fallback: LiveCampaignData,
): LiveCampaignData {
  const targets = (status.targets as LiveTarget[] | undefined) ?? [];
  const analyticsData = (analytics?.analytics ?? {}) as Record<string, unknown>;
  return {
    ...fallback,
    campaignId: (status.campaign_id as string) ?? fallback.campaignId,
    name: (status.name as string) ?? fallback.name,
    status: (status.status as CampaignStatus) ?? fallback.status,
    tier: (status.current_tier as Tier) ?? fallback.tier,
    targets: targets.length
      ? targets.map((t, i) => ({
          ...fallback.targets[i % fallback.targets.length],
          ...t,
          thread: fallback.targets[i % fallback.targets.length].thread,
        }))
      : fallback.targets,
    resistanceDistribution: buildDistribution(
      analyticsData.targets as { resistance_score?: number }[] | undefined,
      fallback.resistanceDistribution,
    ),
  };
}

/** Buckets per-target resistance scores (0..1) into the 5 distribution bars. */
function buildDistribution(
  analyticsTargets: { resistance_score?: number }[] | undefined,
  fallback: { bucket: string; count: number }[],
): { bucket: string; count: number }[] {
  if (!analyticsTargets?.length) return fallback;
  const buckets = ['0.0–0.2', '0.2–0.4', '0.4–0.6', '0.6–0.8', '0.8–1.0'].map((bucket) => ({
    bucket,
    count: 0,
  }));
  for (const t of analyticsTargets) {
    if (typeof t.resistance_score !== 'number') continue;
    const idx = Math.min(4, Math.floor(t.resistance_score * 5));
    buckets[idx].count += 1;
  }
  return buckets;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function clockTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(iso),
  );
}

function resistanceColor(score: number): string {
  if (score < 0.33) return '#06D369';
  if (score <= 0.67) return '#F59E0B';
  return '#FF4757';
}

const statusBadge: Record<DefenseStatus | CampaignStatus, string> = {
  ACTIVE: 'bg-[#2FD9C7]/10 text-[#2FD9C7]',
  PAUSED: 'bg-amber-400/10 text-[#F59E0B]',
  IN_PROGRESS: 'bg-[#2FD9C7]/10 text-[#2FD9C7]',
  COMPLETED: 'bg-green-400/10 text-[#06D369]',
  HALTED: 'bg-red-500/10 text-[#FF4757]',
  COMPROMISED: 'bg-red-500/15 text-[#FF4757] font-semibold',
  DEFENDED: 'bg-green-400/10 text-[#06D369]',
  BLOCKED: 'bg-slate-400/10 text-[#8B95A8]',
};

const tierBadge: Record<Tier, string> = {
  A: 'bg-red-500/15 text-[#FF4757]',
  B: 'bg-amber-400/10 text-[#F59E0B]',
  C: 'bg-green-400/10 text-[#06D369]',
};

const platformIcon: Record<Platform, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: Smartphone,
  voice: Phone,
  linkedin: MessageCircle,
  instagram: MessageCircle,
};

const TACTIC_COLORS = ['#A78BFA', '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#2FD9C7'];

const chartTooltip = {
  backgroundColor: '#15191F',
  border: '1px solid #2D3748',
  borderRadius: 8,
  fontSize: 12,
  color: '#F5F7FB',
};

/* ------------------------------------------------------------------ */
/* Gauge                                                               */
/* ------------------------------------------------------------------ */

function Gauge({ value, size = 48 }: { value: number; size?: number }) {
  const clamped = Math.min(1, Math.max(0, value));
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = resistanceColor(clamped);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Resistance ${Math.round(clamped * 100)}%`}>
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
      <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold" style={{ color }}>
        {Math.round(clamped * 100)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar blocks                                                      */
/* ------------------------------------------------------------------ */

const block = 'bg-[#111827] border border-[#2D3748] rounded-xl p-4';
const blockTitle = 'text-sm font-semibold text-white mb-3';

function ResistanceDistribution({ data }: { data: LiveCampaignData['resistanceDistribution'] }) {
  return (
    <div className={block}>
      <h3 className={blockTitle}>Resistance Distribution</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
            <XAxis dataKey="bucket" tick={{ fill: '#7A8595', fontSize: 10 }} axisLine={{ stroke: '#2D3748' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#7A8595', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={chartTooltip} cursor={{ fill: 'rgba(47,217,199,0.06)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={d.bucket} fill={TACTIC_COLORS[i % TACTIC_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TacticBreakdown({ data }: { data: LiveCampaignData['currentTacticCounts'] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <div className={block}>
      <h3 className={blockTitle}>Current Tactic Breakdown</h3>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="tactic"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
              stroke="#15191F"
            >
              {data.map((d, i) => (
                <Cell key={d.tactic} fill={TACTIC_COLORS[i % TACTIC_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={chartTooltip} formatter={(v: number, n) => [`${v} (${Math.round((v / total) * 100)}%)`, n as string]} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#A8B4C4' }} iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PlatformActivity({ data }: { data: PlatformActivity[] }) {
  return (
    <div className={block}>
      <h3 className={blockTitle}>Platform Activity</h3>
      <ul className="space-y-3">
        {data.map((p) => {
          const Icon = platformIcon[p.platform];
          return (
            <li key={p.platform}>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300 capitalize">
                  <Icon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  {p.platform}
                </span>
                <span className="font-mono text-slate-400">
                  {p.sent} sent · {Math.round(p.deliveryRate * 100)}%
                </span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-[#232D39] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2FD9C7] transition-all duration-500"
                  style={{ width: `${Math.round(p.deliveryRate * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HarmDetection({ harm, tier }: { harm: LiveCampaignData['harmDetection']; tier: Tier }) {
  let text: ReactNode;
  let dotColor: string;
  if (harm.mode === 'tier_c_mandatory') {
    text = (
      <>
        Active — Auto-pause at score ≥ {harm.threshold}
        <span className="block text-xs text-slate-500 mt-0.5">Tier C mandatory harm detection.</span>
      </>
    );
    dotColor = '#06D369';
  } else if (harm.mode === 'tier_b_enabled') {
    text = (
      <>
        Enabled — Auto-pause at score ≥ {harm.threshold}
        <span className="block text-xs text-slate-500 mt-0.5">Tier B optional detection is on.</span>
      </>
    );
    dotColor = '#06D369';
  } else {
    // tier_a_disabled / tier_b_disabled
    text = (
      <>
        Disabled — Organization assumes responsibility
        <span className="block text-xs text-amber-400 mt-0.5">
          {tier === 'A'
            ? 'Tier A campaigns run without automated harm pauses.'
            : 'Optional harm detection is switched off for this campaign.'}
        </span>
      </>
    );
    dotColor = '#F59E0B';
  }

  return (
    <div className={block}>
      <h3 className={blockTitle}>Harm Detection Status</h3>
      <div className="flex items-start gap-2 mb-3">
        <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} aria-hidden="true" />
        <p className="text-sm text-slate-200">{text}</p>
      </div>
      {harm.events.length > 0 && (
        <ul className="space-y-2 border-t border-[#252D38] pt-3">
          {harm.events.map((e) => (
            <li key={e.id} className="text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-medium">{e.targetName}</span>
                <span className="font-mono" style={{ color: resistanceColor(e.score) }}>
                  {e.score.toFixed(2)}
                </span>
              </div>
              <div className="text-slate-500">
                {relativeTime(e.timestamp)} · {e.action}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminActionsLog({ log }: { log: AdminAction[] }) {
  return (
    <div className={block}>
      <h3 className={blockTitle}>Admin Actions Log</h3>
      {log.length === 0 ? (
        <p className="text-xs text-slate-500">No actions taken during this session.</p>
      ) : (
        <ul className="space-y-2.5">
          {log.map((a) => (
            <li key={a.id} className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="text-xs">
                <span className="text-slate-200">{a.action}</span>
                <span className="text-slate-500"> — {a.actor}</span>
                <span className="block text-slate-600">{clockTime(a.timestamp)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Target accordion row + chat thread                                  */
/* ------------------------------------------------------------------ */

type FilterTab = 'all' | 'compromised' | 'defended' | 'active';

function matchesFilter(t: LiveTarget, filter: FilterTab): boolean {
  switch (filter) {
    case 'compromised':
      return t.status === 'COMPROMISED';
    case 'defended':
      return t.status === 'DEFENDED' || t.status === 'BLOCKED';
    case 'active':
      return t.status === 'ACTIVE' || t.status === 'IN_PROGRESS' || t.status === 'PAUSED';
    default:
      return true;
  }
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-slate-500" aria-live="polite">
      AI is composing
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 py-dot-1" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 py-dot-2" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 py-dot-3" />
      </span>
    </div>
  );
}

function TargetRow({
  target,
  expanded,
  onToggle,
  onResume,
  onEndSession,
}: {
  target: LiveTarget;
  expanded: boolean;
  onToggle: () => void;
  onResume: (id: string) => void;
  onEndSession: (id: string) => void;
}) {
  return (
    <div className="border-b border-[#2D3748] last:border-0">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors text-left"
      >
        <span className="w-9 h-9 rounded-full bg-[#1D232D] border border-[#2D3748] flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0">
          {initials(target.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-white truncate">{target.name}</span>
          <span className="block text-xs text-slate-400 truncate">{target.role}</span>
        </span>
        <span
          className={`hidden sm:inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusBadge[target.status]}`}
        >
          {target.status.replace('_', ' ')}
        </span>
        <Gauge value={target.resistanceScore} />
        <span className="hidden md:block text-xs text-slate-500 w-20 text-right shrink-0">
          {relativeTime(target.lastMessageAt)}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
        )}
      </button>

      {/* Expanded thread */}
      {expanded && (
        <div className="px-4 pb-4 py-fade-in-up">
          {/* Harm banner */}
          {target.harmSignal && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-xs text-amber-300">
                  Potential distress signal detected (score: {target.harmSignal.score}). Campaign paused for this
                  target.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onResume(target.targetId)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#3D4860] bg-[#2D3748] px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-[#232D39] transition-colors"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  Resume
                </button>
                <button
                  type="button"
                  onClick={() => onEndSession(target.targetId)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-[#FF4757] hover:bg-red-500/20 transition-colors"
                >
                  <StopCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  End Session
                </button>
              </div>
            </div>
          )}

          {/* Chat bubbles */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {target.thread.map((m) => {
              const Icon = platformIcon[m.platform];
              if (m.from === 'ai') {
                return (
                  <div key={m.id} className="flex flex-col items-start">
                    <div className="max-w-[85%] bg-[#1C2333] border border-[#2D3748] rounded-xl rounded-tl-none p-3">
                      <p className="text-sm font-mono leading-relaxed text-slate-100">{m.content}</p>
                      {m.tactic && (
                        <span className="mt-2 inline-block rounded-md bg-purple-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#A78BFA]">
                          {m.tactic}
                        </span>
                      )}
                    </div>
                    <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Icon className="w-3 h-3" aria-hidden="true" />
                      {clockTime(m.timestamp)}
                    </span>
                  </div>
                );
              }
              return (
                <div key={m.id} className="flex flex-col items-end">
                  <div className="max-w-[85%] bg-blue-600/20 border border-blue-500/30 rounded-xl rounded-tr-none p-3">
                    <p className="text-sm font-mono leading-relaxed text-slate-100">{m.content}</p>
                  </div>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    {clockTime(m.timestamp)}
                    <Icon className="w-3 h-3" aria-hidden="true" />
                    {m.resistanceScore !== undefined && (
                      <span className="font-mono" style={{ color: resistanceColor(m.resistanceScore) }}>
                        R {m.resistanceScore.toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {target.aiComposing && <TypingIndicator />}
          <p className="text-xs text-amber-400 mt-2">This access is logged</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LiveCampaignMonitor() {
  const { id = '' } = useParams<{ id: string }>();
  const [data, setData] = useState<LiveCampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [halting, setHalting] = useState(false);
  const [confirmHalt, setConfirmHalt] = useState(false);
  const pollRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const fresh = await fetchLiveCampaign(id);
      setData(fresh);
      setLastUpdated(new Date());
    } catch {
      // Demo fallback — simulate a live tick by nudging values slightly.
      setData((prev) => {
        const base = prev ?? DEMO_DATA;
        return {
          ...base,
          targets: base.targets.map((t) => ({
            ...t,
            lastMessageAt: t.aiComposing ? new Date().toISOString() : t.lastMessageAt,
          })),
        };
      });
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load + 5s polling.
  useEffect(() => {
    refresh();
    pollRef.current = window.setInterval(refresh, 5000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [refresh]);

  // "Last updated: N seconds ago" ticker.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => window.clearInterval(t);
  }, [lastUpdated]);

  const filteredTargets = useMemo(
    () => (data ? data.targets.filter((t) => matchesFilter(t, filter)) : []),
    [data, filter],
  );

  const haltCampaign = async () => {
    setHalting(true);
    try {
      await fetch(`/api/v1/campaigns/${id}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Halted via Live Monitor kill switch', stopped_by_admin: 'admin' }),
      });
    } catch {
      /* demo mode */
    }
    await new Promise((r) => setTimeout(r, 600));
    setData((d) => (d ? { ...d, status: 'HALTED' } : d));
    setHalting(false);
    setConfirmHalt(false);
    if (pollRef.current) window.clearInterval(pollRef.current);
  };

  const resumeTarget = (targetId: string) => {
    setData((d) =>
      d
        ? {
            ...d,
            adminLog: [
              {
                id: `a${Date.now()}`,
                action: 'Session resumed after harm review',
                actor: 'admin@company.com',
                timestamp: new Date().toISOString(),
              },
              ...d.adminLog,
            ],
            targets: d.targets.map((t) =>
              t.targetId === targetId ? { ...t, harmSignal: undefined, status: 'IN_PROGRESS' } : t,
            ),
          }
        : d,
    );
  };

  const endSession = (targetId: string) => {
    setData((d) =>
      d
        ? {
            ...d,
            adminLog: [
              {
                id: `a${Date.now()}`,
                action: 'Session ended by admin',
                actor: 'admin@company.com',
                timestamp: new Date().toISOString(),
              },
              ...d.adminLog,
            ],
            targets: d.targets.map((t) =>
              t.targetId === targetId
                ? { ...t, harmSignal: undefined, status: 'DEFENDED', aiComposing: false }
                : t,
            ),
          }
        : d,
    );
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1219]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2FD9C7]" aria-label="Loading live campaign" />
      </div>
    );
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'compromised', label: 'Compromised' },
    { key: 'defended', label: 'Defended' },
    { key: 'active', label: 'Active' },
  ];

  const engagedCount = data.targets.filter(
    (t) => t.status === 'ACTIVE' || t.status === 'IN_PROGRESS' || t.status === 'PAUSED',
  ).length;

  return (
    <div className="min-h-screen bg-[#0F1219]">
      <style>{`
        @keyframes pyFadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .py-fade-in-up { animation: pyFadeInUp 300ms ease-out both; }
        @keyframes pyDot { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }
        .py-dot-1 { animation: pyDot 1.2s ease-in-out infinite; }
        .py-dot-2 { animation: pyDot 1.2s ease-in-out .2s infinite; }
        .py-dot-3 { animation: pyDot 1.2s ease-in-out .4s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .py-fade-in-up, .py-dot-1, .py-dot-2, .py-dot-3 { animation: none; }
        }
      `}</style>

      {/* Fixed top bar */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-[#0A0D14] border-b border-[#2D3748] z-50 flex items-center px-4 sm:px-6 gap-3 sm:gap-4">
        <Link
          to={`/campaigns/${id}`}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#2FD9C7] transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Back to Campaign</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <span className="h-4 w-px bg-[#2D3748]" aria-hidden="true" />
        <span className="text-sm font-semibold text-white truncate">{data.name}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${statusBadge[data.status]}`}>
          {data.status === 'ACTIVE' && (
            <span className="relative flex w-1.5 h-1.5" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FD9C7] opacity-60" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#2FD9C7]" />
            </span>
          )}
          {data.status}
        </span>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0 hidden sm:inline-block ${tierBadge[data.tier]}`}>
          Tier {data.tier}
        </span>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden md:inline text-xs text-slate-500" data-testid="last-updated">
            Last updated: {secondsAgo}s ago
          </span>
          <button
            type="button"
            onClick={refresh}
            className="p-2 rounded-md text-slate-400 hover:text-[#2FD9C7] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/40 transition-colors"
            aria-label="Refresh now"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
          {/* KILL SWITCH */}
          <button
            type="button"
            onClick={() => setConfirmHalt(true)}
            disabled={data.status === 'HALTED' || data.status === 'COMPLETED'}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF4757] px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,71,87,0.25)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            <StopCircle className="w-4 h-4" aria-hidden="true" />
            Halt Campaign
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-12 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Left panel — live engagement feed */}
        <section
          aria-label="Live engagements"
          className="lg:col-span-2 bg-[#111827] border border-[#2D3748] rounded-xl h-[calc(100vh-80px)] overflow-hidden flex flex-col"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-[#2D3748]">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Live Engagements</h2>
              <span className="text-xs text-slate-500">{engagedCount} active</span>
              <span className="relative flex w-2 h-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06D369] opacity-60" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-[#06D369]" />
              </span>
            </div>
            <div role="tablist" aria-label="Filter engagements" className="flex gap-1 rounded-lg bg-[#0F1219] p-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={filter === tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                    filter === tab.key ? 'bg-[#2FD9C7]/15 text-[#2FD9C7]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredTargets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Pause className="w-12 h-12 text-slate-600 mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-slate-400 mb-1">No engagements in this view</h3>
                <p className="text-sm text-slate-500">Try a different filter tab.</p>
              </div>
            ) : (
              filteredTargets.map((t) => (
                <TargetRow
                  key={t.targetId}
                  target={t}
                  expanded={expandedId === t.targetId}
                  onToggle={() => setExpandedId((cur) => (cur === t.targetId ? null : t.targetId))}
                  onResume={resumeTarget}
                  onEndSession={endSession}
                />
              ))
            )}
          </div>
        </section>

        {/* Right panel — analytics sidebar */}
        <aside aria-label="Live analytics" className="space-y-4">
          <ResistanceDistribution data={data.resistanceDistribution} />
          <TacticBreakdown data={data.currentTacticCounts} />
          <PlatformActivity data={data.platformActivity} />
          <HarmDetection harm={data.harmDetection} tier={data.tier} />
          <AdminActionsLog log={data.adminLog} />
        </aside>
      </main>

      {/* Halt confirmation (AlertDialog pattern) */}
      {confirmHalt && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="halt-title"
          aria-describedby="halt-desc"
        >
          <div className="w-full max-w-md rounded-xl border border-[#2D3748] bg-[#1D232D] p-6 shadow-lg py-fade-in-up">
            <div className="flex items-start justify-between gap-4">
              <h3 id="halt-title" className="text-lg font-bold text-white">
                Halt this campaign?
              </h3>
              <button
                type="button"
                onClick={() => setConfirmHalt(false)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p id="halt-desc" className="text-sm text-slate-400 mt-2 mb-6">
              This will immediately stop all active engagements. The campaign cannot be resumed — only a new
              campaign can be created. An AAR will be generated automatically.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmHalt(false)}
                className="rounded-lg border border-[#3D4860] bg-[#2D3748] px-4 py-2 text-sm font-medium text-slate-100 hover:bg-[#232D39] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={haltCampaign}
                disabled={halting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF4757] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,71,87,0.25)] active:scale-[0.98] disabled:opacity-60"
              >
                {halting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <StopCircle className="w-4 h-4" aria-hidden="true" />
                )}
                Halt Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
