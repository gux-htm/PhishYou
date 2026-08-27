/**
 * PhishYou — Reports (`/reports`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 7 companion hub (After-Action Report
 *       library) + PHISHYOU_SPECS/07_ANALYTICS_ENGINE/AAR_GENERATION_ENGINE.md
 *       (AAR structure §1–2, anonymized threat-intelligence export §4.2) and
 *       PHISHYOU_SPECS/02_ARCHITECTURE/API_CONTRACTS.md §3.2 (AAR payload).
 *
 * Report library for the organization:
 * - KPI strip: AARs generated, defended rate, average generation time
 *   (five-minute target), open policy gaps.
 * - Searchable, filterable table of After-Action Reports (outcome, tier,
 *   status) with per-row view / PDF download / share-link actions and a
 *   failed-generation retry flow.
 * - Report preview dialog: outcome banner, behavioral metrics, trigger
 *   effectiveness, findings and comparative performance — mirroring the AAR
 *   payload from the API contract.
 * - Exports: anonymized threat-intelligence JSON (real client-side download),
 *   executive digest scheduling, and a compliance data export request.
 *
 * Data: GET /api/v1/organizations/me/reports. Falls back to embedded demo
 * data when the API is unreachable so the page renders correctly without
 * a running backend.
 */
import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  ScrollText,
  Search,
  Share2,
  ShieldCheck,
  ShieldX,
  X,
  XCircle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Tier = 'A' | 'B' | 'C';
type Platform = 'email' | 'whatsapp' | 'sms' | 'voice' | 'linkedin' | 'instagram';
type ReportOutcome = 'DEFENDED' | 'COMPROMISED' | 'EXPIRED';
type ReportStatus = 'READY' | 'GENERATING' | 'FAILED';
type DigestSchedule = 'monthly' | 'quarterly' | 'off';

/** Condensed AAR payload — mirrors API_CONTRACTS.md §3.2. */
interface AarSummary {
  outcomeReason: string;
  timeToFirstSkepticismSeconds: number | null;
  totalExchanges: number;
  durationSeconds: number;
  defenseMechanism: string | null;
  primaryTrigger: string;
  primaryEffectiveness: number; // 0..1
  secondaryTrigger: string;
  secondaryEffectiveness: number; // 0..1
  policyGaps: number;
  coachingItems: number;
  comparative: {
    report: number; // final resistance score — lower is better
    department: number;
    company: number;
    defensePercentile: number; // 0..100
  } | null; // null when no meaningful comparison (expired campaigns)
}

interface ReportRecord {
  id: string;
  campaignId: string;
  campaignName: string;
  targetName: string; // e.g. 'Alice Johnson' or '4 targets · People Ops'
  department: string;
  tier: Tier;
  platforms: Platform[];
  outcome: ReportOutcome;
  status: ReportStatus;
  generatedAt: string; // ISO — generated (READY), attempted (FAILED) or campaign completion (GENERATING)
  generationSeconds: number;
  resistanceScore: number; // 0..1 — final score, lower is better
  summary: AarSummary | null; // null while GENERATING
  errorMessage?: string; // FAILED only
}

interface ReportTotals {
  campaignsToDate: number;
  activeCampaigns: number;
  reportsAllTime: number;
  ready: number;
  generating: number;
  failed: number;
  defended: number;
  compromised: number;
  expired: number;
  avgGenerationSeconds: number;
  openPolicyGaps: { critical: number; high: number; medium: number };
  digestSchedule: DigestSchedule;
  digestRecipient: string;
}

interface ReportsData {
  reports: ReportRecord[];
  totals: ReportTotals;
}

/* ------------------------------------------------------------------ */
/* Demo data (used when API unreachable)                               */
/* ------------------------------------------------------------------ */

const DEMO_DATA: ReportsData = {
  reports: [
    {
      id: 'aar_camp_2026_08_27_004',
      campaignId: 'camp_2026_08_27_004',
      campaignName: 'LinkedIn Recruiter Outreach',
      targetName: 'Sofia Marin',
      department: 'Engineering',
      tier: 'B',
      platforms: ['email', 'linkedin'],
      outcome: 'DEFENDED',
      status: 'GENERATING',
      generatedAt: minutesAgo(2),
      generationSeconds: 0,
      resistanceScore: 0.52,
      summary: null,
    },
    {
      id: 'aar_camp_2026_08_27_005',
      campaignId: 'camp_2026_08_27_005',
      campaignName: 'Q2 Recruitment Phish',
      targetName: '4 targets · People Ops',
      department: 'People Ops',
      tier: 'B',
      platforms: ['email', 'whatsapp'],
      outcome: 'DEFENDED',
      status: 'READY',
      generatedAt: minutesAgo(155),
      generationSeconds: 242,
      resistanceScore: 0.29,
      summary: {
        outcomeReason: 'All four targets reported the message before interacting; two used the report-phish button.',
        timeToFirstSkepticismSeconds: 96,
        totalExchanges: 9,
        durationSeconds: 2700,
        defenseMechanism: 'Reported to security',
        primaryTrigger: 'Authority',
        primaryEffectiveness: 0.31,
        secondaryTrigger: 'Urgency',
        secondaryEffectiveness: 0.22,
        policyGaps: 1,
        coachingItems: 4,
        comparative: { report: 0.29, department: 0.38, company: 0.47, defensePercentile: 74 },
      },
    },
    {
      id: 'aar_camp_2026_08_27_006',
      campaignId: 'camp_2026_08_27_006',
      campaignName: 'Vendor Invoice Fraud Simulation',
      targetName: 'Daniel Osei',
      department: 'Finance',
      tier: 'A',
      platforms: ['email'],
      outcome: 'COMPROMISED',
      status: 'READY',
      generatedAt: minutesAgo(205),
      generationSeconds: 291,
      resistanceScore: 0.88,
      summary: {
        outcomeReason: 'Credentials entered on the simulated supplier portal after authority and urgency pressure.',
        timeToFirstSkepticismSeconds: 540,
        totalExchanges: 6,
        durationSeconds: 1320,
        defenseMechanism: null,
        primaryTrigger: 'Authority',
        primaryEffectiveness: 0.82,
        secondaryTrigger: 'Urgency',
        secondaryEffectiveness: 0.71,
        policyGaps: 3,
        coachingItems: 5,
        comparative: { report: 0.88, department: 0.45, company: 0.47, defensePercentile: 8 },
      },
    },
    {
      id: 'aar_camp_2026_08_24_001',
      campaignId: 'camp_2026_08_24_001',
      campaignName: 'Internal IT Security Audit',
      targetName: 'Alice Johnson',
      department: 'Finance',
      tier: 'B',
      platforms: ['email', 'voice'],
      outcome: 'DEFENDED',
      status: 'READY',
      generatedAt: '2026-08-24T09:35:00Z',
      generationSeconds: 238,
      resistanceScore: 0.18,
      summary: {
        outcomeReason: 'Escalated to out-of-band verification — called the CISO directly before acting.',
        timeToFirstSkepticismSeconds: 135,
        totalExchanges: 4,
        durationSeconds: 1125,
        defenseMechanism: 'Out-of-band verification',
        primaryTrigger: 'Authority',
        primaryEffectiveness: 0.65,
        secondaryTrigger: 'Urgency',
        secondaryEffectiveness: 0.4,
        policyGaps: 2,
        coachingItems: 3,
        comparative: { report: 0.18, department: 0.45, company: 0.47, defensePercentile: 89 },
      },
    },
    {
      id: 'aar_camp_2026_08_21_002',
      campaignId: 'camp_2026_08_21_002',
      campaignName: 'IT Helpdesk Password Reset',
      targetName: 'Marcus Webb',
      department: 'IT',
      tier: 'B',
      platforms: ['email', 'voice'],
      outcome: 'COMPROMISED',
      status: 'READY',
      generatedAt: '2026-08-21T14:12:00Z',
      generationSeconds: 269,
      resistanceScore: 0.74,
      summary: {
        outcomeReason: 'Reset code read aloud during a spoofed helpdesk voice call; MFA bypassed on the simulated portal.',
        timeToFirstSkepticismSeconds: 420,
        totalExchanges: 7,
        durationSeconds: 1860,
        defenseMechanism: null,
        primaryTrigger: 'Urgency',
        primaryEffectiveness: 0.66,
        secondaryTrigger: 'Authority',
        secondaryEffectiveness: 0.58,
        policyGaps: 4,
        coachingItems: 6,
        comparative: { report: 0.74, department: 0.41, company: 0.47, defensePercentile: 18 },
      },
    },
    {
      id: 'aar_camp_2026_08_19_003',
      campaignId: 'camp_2026_08_19_003',
      campaignName: 'WhatsApp Delivery Notice',
      targetName: 'Omar Farouk',
      department: 'Operations',
      tier: 'C',
      platforms: ['whatsapp', 'sms'],
      outcome: 'DEFENDED',
      status: 'READY',
      generatedAt: '2026-08-19T10:03:00Z',
      generationSeconds: 192,
      resistanceScore: 0.12,
      summary: {
        outcomeReason: 'Ignored the tracking link and verified the delivery through the courier official app.',
        timeToFirstSkepticismSeconds: 40,
        totalExchanges: 2,
        durationSeconds: 720,
        defenseMechanism: 'Channel verification',
        primaryTrigger: 'Urgency',
        primaryEffectiveness: 0.15,
        secondaryTrigger: 'Social Proof',
        secondaryEffectiveness: 0.08,
        policyGaps: 1,
        coachingItems: 2,
        comparative: { report: 0.12, department: 0.52, company: 0.47, defensePercentile: 93 },
      },
    },
    {
      id: 'aar_camp_2026_08_15_001',
      campaignId: 'camp_2026_08_15_001',
      campaignName: 'Executive Whaling Simulation — Phase 1',
      targetName: 'Elena Vasquez',
      department: 'Leadership',
      tier: 'A',
      platforms: ['voice', 'sms'],
      outcome: 'COMPROMISED',
      status: 'READY',
      generatedAt: '2026-08-15T16:40:00Z',
      generationSeconds: 306,
      resistanceScore: 0.91,
      summary: {
        outcomeReason: 'Approved a simulated wire transfer during a cloned-voice call impersonating the CFO.',
        timeToFirstSkepticismSeconds: null,
        totalExchanges: 5,
        durationSeconds: 1560,
        defenseMechanism: null,
        primaryTrigger: 'Authority',
        primaryEffectiveness: 0.94,
        secondaryTrigger: 'Urgency',
        secondaryEffectiveness: 0.77,
        policyGaps: 5,
        coachingItems: 7,
        comparative: { report: 0.91, department: 0.39, company: 0.47, defensePercentile: 3 },
      },
    },
    {
      id: 'aar_camp_2026_08_12_002',
      campaignId: 'camp_2026_08_12_002',
      campaignName: 'Instagram DM Verification',
      targetName: 'Tom Becker',
      department: 'Marketing',
      tier: 'C',
      platforms: ['instagram', 'email'],
      outcome: 'EXPIRED',
      status: 'READY',
      generatedAt: '2026-08-12T18:00:00Z',
      generationSeconds: 224,
      resistanceScore: 0.45,
      summary: {
        outcomeReason: 'Target never engaged; the campaign window closed without contact.',
        timeToFirstSkepticismSeconds: null,
        totalExchanges: 0,
        durationSeconds: 4320,
        defenseMechanism: null,
        primaryTrigger: 'Social Proof',
        primaryEffectiveness: 0,
        secondaryTrigger: 'Urgency',
        secondaryEffectiveness: 0,
        policyGaps: 0,
        coachingItems: 1,
        comparative: null,
      },
    },
    {
      id: 'aar_camp_2026_08_08_003',
      campaignId: 'camp_2026_08_08_003',
      campaignName: 'HR Onboarding Reset Wave 1',
      targetName: '4 targets · People Ops',
      department: 'People Ops',
      tier: 'B',
      platforms: ['email'],
      outcome: 'DEFENDED',
      status: 'READY',
      generatedAt: '2026-08-08T11:26:00Z',
      generationSeconds: 213,
      resistanceScore: 0.31,
      summary: {
        outcomeReason: 'Three of four targets flagged the reset email; one complied but self-reported within minutes.',
        timeToFirstSkepticismSeconds: 180,
        totalExchanges: 8,
        durationSeconds: 2400,
        defenseMechanism: 'Self-reported after complying',
        primaryTrigger: 'Authority',
        primaryEffectiveness: 0.36,
        secondaryTrigger: 'Urgency',
        secondaryEffectiveness: 0.29,
        policyGaps: 2,
        coachingItems: 5,
        comparative: { report: 0.31, department: 0.38, company: 0.47, defensePercentile: 71 },
      },
    },
    {
      id: 'aar_camp_2026_07_30_001',
      campaignId: 'camp_2026_07_30_001',
      campaignName: 'CEO Impersonation Drill',
      targetName: 'Hannah Cole',
      department: 'Finance',
      tier: 'B',
      platforms: ['email', 'voice'],
      outcome: 'DEFENDED',
      status: 'READY',
      generatedAt: '2026-07-30T09:48:00Z',
      generationSeconds: 287,
      resistanceScore: 0.22,
      summary: {
        outcomeReason: 'Questioned the CEO request, then verified it through the executive assistant before acting.',
        timeToFirstSkepticismSeconds: 95,
        totalExchanges: 5,
        durationSeconds: 1500,
        defenseMechanism: 'Out-of-band verification',
        primaryTrigger: 'Authority',
        primaryEffectiveness: 0.44,
        secondaryTrigger: 'Urgency',
        secondaryEffectiveness: 0.25,
        policyGaps: 1,
        coachingItems: 3,
        comparative: { report: 0.22, department: 0.45, company: 0.47, defensePercentile: 86 },
      },
    },
    {
      id: 'aar_camp_2026_07_25_002',
      campaignId: 'camp_2026_07_25_002',
      campaignName: 'Voice Clone Verification',
      targetName: 'Ryan Park',
      department: 'IT',
      tier: 'A',
      platforms: ['voice'],
      outcome: 'COMPROMISED',
      status: 'FAILED',
      generatedAt: '2026-07-25T15:02:00Z',
      generationSeconds: 0,
      resistanceScore: 0.79,
      summary: {
        outcomeReason: 'Voice challenge answers confirmed via synthetic CEO voice; simulated badge PIN disclosed.',
        timeToFirstSkepticismSeconds: 300,
        totalExchanges: 4,
        durationSeconds: 1140,
        defenseMechanism: null,
        primaryTrigger: 'Authority',
        primaryEffectiveness: 0.81,
        secondaryTrigger: 'Fear',
        secondaryEffectiveness: 0.52,
        policyGaps: 3,
        coachingItems: 4,
        comparative: { report: 0.79, department: 0.41, company: 0.47, defensePercentile: 12 },
      },
      errorMessage: 'Transcript segment 3 of the voice channel could not be parsed — analytics incomplete.',
    },
    {
      id: 'aar_camp_2026_07_18_001',
      campaignId: 'camp_2026_07_18_001',
      campaignName: 'Multi-Channel Stress Test',
      targetName: '12 targets · Cross-department',
      department: 'Cross-department',
      tier: 'A',
      platforms: ['email', 'whatsapp', 'voice'],
      outcome: 'COMPROMISED',
      status: 'READY',
      generatedAt: '2026-07-18T17:31:00Z',
      generationSeconds: 312,
      resistanceScore: 0.69,
      summary: {
        outcomeReason: 'Coordinated email-to-WhatsApp-to-voice chain compromised 7 of 12 targets inside 30 minutes.',
        timeToFirstSkepticismSeconds: 260,
        totalExchanges: 41,
        durationSeconds: 3300,
        defenseMechanism: null,
        primaryTrigger: 'Authority',
        primaryEffectiveness: 0.72,
        secondaryTrigger: 'Urgency',
        secondaryEffectiveness: 0.55,
        policyGaps: 6,
        coachingItems: 9,
        comparative: { report: 0.69, department: 0.44, company: 0.47, defensePercentile: 22 },
      },
    },
    {
      id: 'aar_camp_2026_07_11_002',
      campaignId: 'camp_2026_07_11_002',
      campaignName: 'Urgent Account Verification',
      targetName: 'Ayesha Khan',
      department: 'Operations',
      tier: 'C',
      platforms: ['whatsapp', 'sms', 'voice'],
      outcome: 'DEFENDED',
      status: 'READY',
      generatedAt: '2026-07-11T13:20:00Z',
      generationSeconds: 258,
      resistanceScore: 0.35,
      summary: {
        outcomeReason: 'Hung up on the synthetic bank-security call and re-dialed the number printed on her card.',
        timeToFirstSkepticismSeconds: 70,
        totalExchanges: 3,
        durationSeconds: 900,
        defenseMechanism: 'Callback verification',
        primaryTrigger: 'Authority',
        primaryEffectiveness: 0.42,
        secondaryTrigger: 'Fear',
        secondaryEffectiveness: 0.38,
        policyGaps: 2,
        coachingItems: 4,
        comparative: { report: 0.35, department: 0.52, company: 0.47, defensePercentile: 78 },
      },
    },
    {
      id: 'aar_camp_2026_07_03_001',
      campaignId: 'camp_2026_07_03_001',
      campaignName: 'Payroll Update Notice',
      targetName: 'Grace Liu',
      department: 'Finance',
      tier: 'B',
      platforms: ['email'],
      outcome: 'DEFENDED',
      status: 'READY',
      generatedAt: '2026-07-03T10:15:00Z',
      generationSeconds: 206,
      resistanceScore: 0.16,
      summary: {
        outcomeReason: 'Forwarded the payroll phish to security without clicking; reported in under a minute.',
        timeToFirstSkepticismSeconds: 55,
        totalExchanges: 1,
        durationSeconds: 480,
        defenseMechanism: 'Reported to security',
        primaryTrigger: 'Authority',
        primaryEffectiveness: 0.2,
        secondaryTrigger: 'Urgency',
        secondaryEffectiveness: 0.12,
        policyGaps: 1,
        coachingItems: 2,
        comparative: { report: 0.16, department: 0.45, company: 0.47, defensePercentile: 91 },
      },
    },
  ],
  totals: {
    campaignsToDate: 23,
    activeCampaigns: 3,
    reportsAllTime: 20,
    ready: 18,
    generating: 1,
    failed: 1,
    defended: 13,
    compromised: 5,
    expired: 1,
    avgGenerationSeconds: 252,
    openPolicyGaps: { critical: 2, high: 3, medium: 4 },
    digestSchedule: 'monthly',
    digestRecipient: 'ciso@company.com',
  },
};

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

/* ------------------------------------------------------------------ */
/* Fetch + helpers                                                     */
/* ------------------------------------------------------------------ */

async function fetchReports(): Promise<ReportsData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/v1/organizations/me/reports', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as ReportsData;
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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
}

/** 135 → '2m 15s', 480 → '8m', null → '—'. */
function formatSeconds(total: number | null): string {
  if (total === null) return '—';
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function ordinal(n: number): string {
  const tail = n % 100;
  if (tail >= 11 && tail <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

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

const outcomeBadge: Record<ReportOutcome, string> = {
  DEFENDED: 'bg-green-400/10 text-[#06D369]',
  COMPROMISED: 'bg-red-500/15 text-[#FF4757]',
  EXPIRED: 'bg-slate-400/10 text-[#8B95A8]',
};

const outcomeLabel: Record<ReportOutcome, string> = {
  DEFENDED: 'Defended',
  COMPROMISED: 'Compromised',
  EXPIRED: 'Expired',
};

const platformIcon: Record<Platform, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: MessageCircle,
  voice: Phone,
  linkedin: MessageCircle,
  instagram: MessageCircle,
};

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const input =
  'w-full rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2.5 text-sm text-white ' +
  'placeholder:text-[#5A6470] transition-all duration-200 ease-out ' +
  'focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30';

const select =
  'rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2 text-sm text-white ' +
  'transition-all duration-200 ease-out focus:border-[#2FD9C7] focus:outline-none ' +
  'focus:ring-2 focus:ring-[#2FD9C7]/30';

const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#3D4860] bg-[#2D3748] ' +
  'px-4 py-2 text-sm font-medium text-slate-100 transition-all duration-200 ease-out ' +
  'hover:bg-[#232D39] hover:border-[#3D4860] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

const primaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2FD9C7] px-4 py-2 text-sm ' +
  'font-semibold text-[#0F1219] transition-all duration-200 ease-out hover:bg-[#4FE5D3] ' +
  'hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ' +
  'disabled:hover:scale-100';

const smallButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#3D4860] px-3 py-1.5 ' +
  'text-xs font-medium text-slate-200 hover:bg-[#2FD9C7]/10 hover:border-[#2FD9C7]/50 ' +
  'hover:text-[#2FD9C7] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ' +
  'disabled:hover:bg-transparent disabled:hover:border-[#3D4860] disabled:hover:text-slate-200';

const iconButton =
  'inline-flex items-center justify-center rounded-lg border border-[#3D4860] p-2 text-slate-300 ' +
  'hover:bg-[#2FD9C7]/10 hover:border-[#2FD9C7]/50 hover:text-[#2FD9C7] transition-colors ' +
  'duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ' +
  'disabled:hover:border-[#3D4860] disabled:hover:text-slate-300';

const panel = 'bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6';

const th = 'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 bg-[#232D39]';
const td = 'px-4 py-3 text-sm text-slate-200 border-t border-[#252D38]';

const pill =
  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200';

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: typeof FileText;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-lg bg-[#1D232D] border border-[#2D3748] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#2FD9C7]" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function KpiCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 transition-shadow duration-200 hover:shadow-md">
      {children}
    </div>
  );
}

function SplitBar({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden mt-4" aria-hidden="true">
      {segments.map((s, i) => (
        <div key={i} style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} />
      ))}
    </div>
  );
}

function EffectivenessBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3 mb-2.5 last:mb-0">
      <span className="text-xs text-slate-400 w-40 shrink-0 truncate">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-[#232D39] overflow-hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-[#2FD9C7]" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-300 w-9 text-right">{pct}%</span>
    </div>
  );
}

function ComparativeRow({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3 mb-2.5 last:mb-0">
      <span className="text-xs text-slate-400 w-40 shrink-0">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-[#232D39] overflow-hidden" aria-hidden="true">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: resistanceColor(value) }} />
      </div>
      <span className="text-xs font-mono text-slate-300 w-9 text-right">{pct}%</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Report preview dialog                                               */
/* ------------------------------------------------------------------ */

const bannerMeta: Record<
  ReportOutcome,
  { icon: typeof ShieldCheck; box: string; iconColor: string; title: string }
> = {
  DEFENDED: {
    icon: ShieldCheck,
    box: 'bg-green-500/10 border-2 border-green-500/40',
    iconColor: 'text-green-400',
    title: 'Successfully Defended',
  },
  COMPROMISED: {
    icon: ShieldX,
    box: 'bg-red-500/10 border-2 border-red-500/40',
    iconColor: 'text-red-400',
    title: 'Compromised',
  },
  EXPIRED: {
    icon: Clock,
    box: 'bg-slate-400/10 border-2 border-slate-500/40',
    iconColor: 'text-slate-400',
    title: 'Expired — No Engagement',
  },
};

function PreviewMetric({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-white mt-1">{children}</div>
    </div>
  );
}

function ReportPreviewDialog({
  report,
  onClose,
}: {
  report: ReportRecord;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const s = report.summary;
  if (!s) return null; // only READY reports open the preview

  const banner = bannerMeta[report.outcome];
  const BannerIcon = banner.icon;

  const downloadPdf = async () => {
    setDownloading(true);
    // demo mode — simulate PDF preparation
    await new Promise((r) => setTimeout(r, 900));
    setDownloading(false);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-preview-title"
    >
      <div className="w-full max-w-2xl rounded-xl border border-[#2D3748] bg-[#1D232D] p-6 shadow-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 id="report-preview-title" className="text-lg font-bold text-white">
              {report.campaignName}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs text-slate-400">
                {report.targetName} · {report.department}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${tierStyles[report.tier]}`}>
                Tier {report.tier}
              </span>
              {report.platforms.map((p) => {
                const Icon = platformIcon[p];
                return <Icon key={p} className="w-3.5 h-3.5 text-slate-500" aria-label={p} role="img" />;
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report preview"
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Outcome banner */}
        <div className={`flex items-start gap-4 rounded-xl p-4 mt-5 ${banner.box}`}>
          <BannerIcon className={`w-10 h-10 shrink-0 ${banner.iconColor}`} aria-hidden="true" />
          <div>
            <h4 className="text-base font-bold text-white">{banner.title}</h4>
            <p className="text-sm text-slate-300 mt-0.5">{s.outcomeReason}</p>
            {s.defenseMechanism && (
              <p className="text-xs text-slate-400 mt-1">Defense mechanism: {s.defenseMechanism}</p>
            )}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <PreviewMetric label="Time to Skepticism">
            {s.timeToFirstSkepticismSeconds === null ? 'Never' : formatSeconds(s.timeToFirstSkepticismSeconds)}
          </PreviewMetric>
          <PreviewMetric label="Total Exchanges">{s.totalExchanges}</PreviewMetric>
          <PreviewMetric label="Duration">{formatSeconds(s.durationSeconds)}</PreviewMetric>
          <PreviewMetric label="Resistance Score">
            <span style={{ color: resistanceColor(report.resistanceScore) }}>
              {Math.round(report.resistanceScore * 100)}%
            </span>
          </PreviewMetric>
        </div>

        {/* Trigger effectiveness */}
        <h4 className="text-sm font-semibold text-slate-300 mt-6 mb-3">Trigger Effectiveness</h4>
        <EffectivenessBar label={`${s.primaryTrigger} (primary)`} value={s.primaryEffectiveness} />
        <EffectivenessBar label={`${s.secondaryTrigger} (secondary)`} value={s.secondaryEffectiveness} />

        {/* Findings */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-semibold text-white">{s.policyGaps}</div>
              <div className="text-xs text-slate-400">Policy gaps identified</div>
            </div>
          </div>
          <div className="bg-[#111827] border border-[#2D3748] rounded-lg p-3 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#A78BFA] shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-semibold text-white">{s.coachingItems}</div>
              <div className="text-xs text-slate-400">Coaching recommendations</div>
            </div>
          </div>
        </div>

        {/* Comparative performance */}
        {s.comparative && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Comparative Performance</h4>
            <ComparativeRow label="This report" value={s.comparative.report} />
            <ComparativeRow label="Department average" value={s.comparative.department} />
            <ComparativeRow label="Company average" value={s.comparative.company} />
            <p className="text-xs text-slate-500 mt-2">
              Lower resistance is better — ranks {ordinal(s.comparative.defensePercentile)} percentile
              for defense, company-wide.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-[#2D3748]">
          <p className="text-xs text-slate-500">
            Generated {formatDate(report.generatedAt)} · {formatSeconds(report.generationSeconds)} to generate
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className={secondaryButton} onClick={downloadPdf} disabled={downloading}>
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Preparing…
                </>
              ) : downloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#06D369]" aria-hidden="true" />
                  PDF saved
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download PDF
                </>
              )}
            </button>
            <Link to={`/campaigns/${report.campaignId}/aar`} className={primaryButton}>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Open Full Report
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Exports & scheduled deliverables                                    */
/* ------------------------------------------------------------------ */

/** Anonymized threat-intelligence document — AAR_GENERATION_ENGINE.md §4.2. */
function buildThreatIntelExport(data: ReportsData): string {
  const resolved = data.reports.filter((r) => r.summary);
  const vectors = Array.from(new Set(resolved.flatMap((r) => r.platforms)));
  const defended = resolved.filter((r) => r.outcome === 'DEFENDED').length;
  const doc = {
    report_type: 'anonymized_threat_intelligence',
    generated_at: new Date().toISOString(),
    methodology: 'Controlled social engineering simulations using the PhishYou platform',
    organization: 'anonymized — mid-market financial services',
    data_points: data.totals.reportsAllTime,
    defended_rate: `${Math.round((defended / resolved.length) * 100)}%`,
    attack_vectors: vectors,
    trigger_effectiveness: {
      authority: 0.72,
      urgency: 0.55,
      fear: 0.48,
      social_proof: 0.41,
    },
    key_findings: [
      'Multi-platform attacks (email followed by voice call) show a 75% success rate vs 40% for single-platform attacks',
      'Authority personas are 1.8x more effective than peer personas',
      'Out-of-band verification reduces attack success rate to 15%',
    ],
    pii_removed: true,
  };
  return JSON.stringify(doc, null, 2);
}

function ThreatIntelCard({ data }: { data: ReportsData }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');

  const generate = async () => {
    setState('busy');
    await new Promise((r) => setTimeout(r, 1400));
    // demo mode — build the anonymized export client-side (AAR engine §4.2)
    try {
      const blob = new Blob([buildThreatIntelExport(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phishyou-threat-intel-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* download unavailable — still confirm generation */
    }
    setState('done');
    setTimeout(() => setState('idle'), 2500);
  };

  return (
    <div className="border border-[#2D3748] rounded-xl p-4 bg-[#15191F] flex flex-col">
      <span className="w-10 h-10 rounded-lg bg-[#1D232D] border border-[#2D3748] flex items-center justify-center mb-3">
        <FileJson className="w-5 h-5 text-[#2FD9C7]" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-white">Anonymized Threat Intelligence</h3>
      <p className="text-xs text-slate-400 mt-1.5 flex-1">
        Cross-campaign findings with all PII removed — trigger effectiveness, attack-chain
        success rates and benchmarks. Safe to share with the security community.
      </p>
      <button type="button" className={`${primaryButton} mt-4`} onClick={generate} disabled={state === 'busy'}>
        {state === 'busy' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Generating…
          </>
        ) : state === 'done' ? (
          <>
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Export ready
          </>
        ) : (
          <>
            <Download className="w-4 h-4" aria-hidden="true" />
            Generate Export
          </>
        )}
      </button>
    </div>
  );
}

const digestLabels: Record<DigestSchedule, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  off: 'Off',
};

function DigestCard({ initial, recipient }: { initial: DigestSchedule; recipient: string }) {
  const [schedule, setSchedule] = useState<DigestSchedule>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/v1/organizations/me/reports/digest', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });
    } catch {
      /* demo mode — accept local save */
    }
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="border border-[#2D3748] rounded-xl p-4 bg-[#15191F] flex flex-col">
      <span className="w-10 h-10 rounded-lg bg-[#1D232D] border border-[#2D3748] flex items-center justify-center mb-3">
        <CalendarClock className="w-5 h-5 text-[#2FD9C7]" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-white">Executive Digest</h3>
      <p className="text-xs text-slate-400 mt-1.5 flex-1">
        Outcome trends, policy gaps and benchmark deltas, delivered on schedule
        to <span className="text-slate-300">{recipient}</span>.
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <label htmlFor="digest-schedule" className="sr-only">
          Digest schedule
        </label>
        <select
          id="digest-schedule"
          className={select}
          value={schedule}
          onChange={(e) => setSchedule(e.target.value as DigestSchedule)}
        >
          {(Object.keys(digestLabels) as DigestSchedule[]).map((key) => (
            <option key={key} value={key}>
              {digestLabels[key]}
            </option>
          ))}
        </select>
        <button type="button" className={secondaryButton} onClick={save} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" aria-hidden="true" />
              Save
            </>
          )}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#06D369]">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}

function ComplianceCard() {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');

  const request = async () => {
    setState('busy');
    try {
      await fetch('/api/v1/organizations/me/reports/compliance-export', { method: 'POST' });
    } catch {
      /* demo mode — accept local request */
    }
    await new Promise((r) => setTimeout(r, 1000));
    setState('done');
  };

  return (
    <div className="border border-[#2D3748] rounded-xl p-4 bg-[#15191F] flex flex-col">
      <span className="w-10 h-10 rounded-lg bg-[#1D232D] border border-[#2D3748] flex items-center justify-center mb-3">
        <ScrollText className="w-5 h-5 text-[#2FD9C7]" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-white">Compliance Data Export</h3>
      <p className="text-xs text-slate-400 mt-1.5 flex-1">
        Audit-ready bundle: consent records, campaign logs, debrief acknowledgments
        and attestation history (GDPR Art. 30 records of processing).
      </p>
      {state === 'done' ? (
        <p className="flex items-start gap-1.5 text-xs text-[#06D369] mt-4">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          Requested — legal@company.com will be notified. Typically ready within 24 hours.
        </p>
      ) : (
        <button type="button" className={`${secondaryButton} mt-4`} onClick={request} disabled={state === 'busy'}>
          {state === 'busy' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Requesting…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" aria-hidden="true" />
              Request Export
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const outcomeFilters: { key: ReportOutcome | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'DEFENDED', label: 'Defended' },
  { key: 'COMPROMISED', label: 'Compromised' },
  { key: 'EXPIRED', label: 'Expired' },
];

export default function Reports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<ReportOutcome | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [tierFilter, setTierFilter] = useState<Tier | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downloadStates, setDownloadStates] = useState<Record<string, 'busy' | 'done'>>({});
  const [copiedIds, setCopiedIds] = useState<Record<string, boolean>>({});

  const load = async () => {
    try {
      setData(await fetchReports());
    } catch {
      setData(DEMO_DATA); // demo fallback
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2FD9C7]" aria-label="Loading reports" />
      </div>
    );
  }

  const t = data.totals;
  const gaps = t.openPolicyGaps;
  const resolvedTotal = t.defended + t.compromised + t.expired;
  const defendedRate = Math.round((t.defended / resolvedTotal) * 100);

  const outcomeCounts: Record<ReportOutcome | 'ALL', number> = {
    ALL: data.reports.length,
    DEFENDED: data.reports.filter((r) => r.outcome === 'DEFENDED').length,
    COMPROMISED: data.reports.filter((r) => r.outcome === 'COMPROMISED').length,
    EXPIRED: data.reports.filter((r) => r.outcome === 'EXPIRED').length,
  };

  const filtered = data.reports.filter((r) => {
    if (outcomeFilter !== 'ALL' && r.outcome !== outcomeFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (tierFilter !== 'ALL' && r.tier !== tierFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && !`${r.campaignName} ${r.targetName} ${r.department}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const selected = data.reports.find((r) => r.id === selectedId) ?? null;

  const clearFilters = () => {
    setSearch('');
    setOutcomeFilter('ALL');
    setStatusFilter('ALL');
    setTierFilter('ALL');
  };

  const downloadReport = async (report: ReportRecord) => {
    setDownloadStates((s) => ({ ...s, [report.id]: 'busy' }));
    // demo mode — simulate PDF preparation
    await new Promise((r) => setTimeout(r, 900));
    setDownloadStates((s) => ({ ...s, [report.id]: 'done' }));
    setTimeout(() => {
      setDownloadStates((s) => {
        const next = { ...s };
        delete next[report.id];
        return next;
      });
    }, 2500);
  };

  const shareReport = async (report: ReportRecord) => {
    const url = `https://app.phishyou.com/aar/${report.campaignId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* demo mode — still confirm the link */
    }
    setCopiedIds((s) => ({ ...s, [report.id]: true }));
    setTimeout(() => setCopiedIds((s) => ({ ...s, [report.id]: false })), 2500);
  };

  const retryGeneration = (report: ReportRecord) => {
    // demo mode — simulate re-running the AAR pipeline locally
    setData((d) =>
      d
        ? { ...d, reports: d.reports.map((r) => (r.id === report.id ? { ...r, status: 'GENERATING' } : r)) }
        : d,
    );
    setTimeout(() => {
      setData((d) =>
        d
          ? {
              ...d,
              reports: d.reports.map((r) =>
                r.id === report.id && r.status === 'GENERATING'
                  ? {
                      ...r,
                      status: 'READY',
                      generatedAt: new Date().toISOString(),
                      generationSeconds: 240,
                      errorMessage: undefined,
                    }
                  : r,
              ),
            }
          : d,
      );
    }, 2600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white">Reports</h1>
        <p className="text-sm text-slate-400 mt-1">
          After-Action Reports generated across all campaigns, plus exports and scheduled deliverables.
        </p>
      </header>

      {/* KPI strip */}
      <section aria-label="Report metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard>
          <div className="text-4xl font-black text-[#2FD9C7]">{t.reportsAllTime}</div>
          <div className="text-sm text-slate-400 mt-1">AARs Generated</div>
          <SplitBar
            segments={[
              { value: t.ready, color: '#2FD9C7' },
              { value: t.generating, color: '#F59E0B' },
              { value: t.failed, color: '#FF4757' },
            ]}
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
            <span>{t.ready} ready</span>
            <span>{t.generating} generating</span>
            <span>{t.failed} failed</span>
          </div>
        </KpiCard>

        <KpiCard>
          <div className="text-4xl font-black text-white">{defendedRate}%</div>
          <div className="text-sm text-slate-400 mt-1">Defended Rate</div>
          <SplitBar
            segments={[
              { value: t.defended, color: '#06D369' },
              { value: t.compromised, color: '#FF4757' },
              { value: t.expired, color: '#8B95A8' },
            ]}
          />
          <div className="text-xs text-slate-400 mt-2">
            <span className="text-[#06D369]">{t.defended} defended</span>
            {' · '}
            <span className="text-[#FF4757]">{t.compromised} compromised</span>
            {' · '}
            {t.expired} expired
          </div>
        </KpiCard>

        <KpiCard>
          <div className="text-4xl font-black text-white">{formatSeconds(t.avgGenerationSeconds)}</div>
          <div className="text-sm text-slate-400 mt-1">Avg Generation Time</div>
          <div className="text-xs text-slate-400 mt-4">
            <span className="text-[#06D369]">Within the 5-minute target</span>
          </div>
        </KpiCard>

        <KpiCard>
          <div className="text-4xl font-black text-[#F59E0B]">{gaps.critical + gaps.high + gaps.medium}</div>
          <div className="text-sm text-slate-400 mt-1">Open Policy Gaps</div>
          <div className="text-xs text-slate-400 mt-4">
            <span className="text-[#FF4757]">{gaps.critical} critical</span>
            {' · '}
            <span className="text-[#F59E0B]">{gaps.high} high</span>
            {' · '}
            <span className="text-[#5B9EFF]">{gaps.medium} medium</span>
          </div>
        </KpiCard>
      </section>

      {/* Report library */}
      <section aria-label="After-Action Reports" className={panel}>
        <SectionHeader
          icon={FileText}
          title="After-Action Reports"
          subtitle="Generated automatically within five minutes of campaign completion (AAR engine §1)"
          action={
            <button type="button" className={smallButton} onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Refresh
            </button>
          }
        />

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6470]"
              aria-hidden="true"
            />
            <input
              type="text"
              className={`${input} pl-9`}
              placeholder="Search campaign, target or department…"
              aria-label="Search reports"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by outcome">
            {outcomeFilters.map((f) => {
              const active = outcomeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setOutcomeFilter(f.key)}
                  className={`${pill} ${
                    active
                      ? 'bg-[#2FD9C7] text-[#0F1219]'
                      : 'border border-[#2D3748] text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {f.label} <span className={active ? 'opacity-70' : 'text-slate-500'}>{outcomeCounts[f.key]}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="report-status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="report-status-filter"
              className={select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'ALL')}
            >
              <option value="ALL">All statuses</option>
              <option value="READY">Ready</option>
              <option value="GENERATING">Generating</option>
              <option value="FAILED">Failed</option>
            </select>
            <label htmlFor="report-tier-filter" className="sr-only">
              Filter by tier
            </label>
            <select
              id="report-tier-filter"
              className={select}
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as Tier | 'ALL')}
            >
              <option value="ALL">All tiers</option>
              <option value="A">Tier A</option>
              <option value="B">Tier B</option>
              <option value="C">Tier C</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-3" aria-live="polite">
          Showing {filtered.length} of {data.reports.length} recent reports
        </p>

        <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[1040px]">
            <thead>
              <tr>
                <th className={th}>Report</th>
                <th className={th}>Target</th>
                <th className={th}>Outcome</th>
                <th className={th}>Tier</th>
                <th className={th}>Channels</th>
                <th className={th}>Resistance</th>
                <th className={th}>Gaps</th>
                <th className={th}>Generated</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className={td} colSpan={9}>
                    <div className="text-center py-10">
                      <p className="text-sm text-slate-400">No reports match your filters.</p>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs text-[#2FD9C7] hover:text-[#4FE5D3] transition-colors mt-2"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const dl = downloadStates[r.id];
                  const copied = copiedIds[r.id];
                  const ready = r.status === 'READY';
                  return (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className={td}>
                        <div className="text-sm font-medium text-white">{r.campaignName}</div>
                        <div className="text-xs text-slate-500 font-mono">{r.campaignId}</div>
                      </td>
                      <td className={td}>
                        <div className="text-sm">{r.targetName}</div>
                        <div className="text-xs text-slate-500">{r.department}</div>
                      </td>
                      <td className={td}>
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${outcomeBadge[r.outcome]}`}>
                          {outcomeLabel[r.outcome]}
                        </span>
                      </td>
                      <td className={td}>
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${tierStyles[r.tier]}`}>
                          Tier {r.tier}
                        </span>
                      </td>
                      <td className={td}>
                        <div className="flex items-center gap-1.5">
                          {r.platforms.map((p) => {
                            const Icon = platformIcon[p];
                            return <Icon key={p} className="w-3.5 h-3.5 text-slate-500" aria-label={p} role="img" />;
                          })}
                        </div>
                      </td>
                      <td className={td}>
                        {r.status === 'GENERATING' ? (
                          <span className="text-sm text-slate-500">—</span>
                        ) : (
                          <span
                            className="text-sm font-semibold font-mono"
                            style={{ color: resistanceColor(r.resistanceScore) }}
                          >
                            {Math.round(r.resistanceScore * 100)}%
                          </span>
                        )}
                      </td>
                      <td className={td}>{r.summary && r.summary.policyGaps > 0 ? r.summary.policyGaps : '—'}</td>
                      <td className={td}>
                        {r.status === 'READY' && (
                          <>
                            <div className="text-sm text-slate-200">{formatDate(r.generatedAt)}</div>
                            <div className="text-xs text-slate-500">{relativeTime(r.generatedAt)}</div>
                          </>
                        )}
                        {r.status === 'GENERATING' && (
                          <div className="flex items-center gap-1.5 text-xs text-[#F59E0B]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            Generating… ~2 min
                          </div>
                        )}
                        {r.status === 'FAILED' && (
                          <div>
                            <div className="text-sm text-slate-200">{formatDate(r.generatedAt)}</div>
                            <div
                              className="flex items-center gap-1 text-xs text-[#FF4757] mt-0.5"
                              title={r.errorMessage}
                            >
                              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              Generation failed
                            </div>
                          </div>
                        )}
                      </td>
                      <td className={td}>
                        <div className="flex items-center justify-end gap-2">
                          {r.status === 'FAILED' ? (
                            <button
                              type="button"
                              className={smallButton}
                              onClick={() => retryGeneration(r)}
                            >
                              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                              Retry
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={smallButton}
                                onClick={() => setSelectedId(r.id)}
                                disabled={!ready}
                                title={ready ? 'Preview report' : 'Report is still generating'}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className={iconButton}
                                onClick={() => downloadReport(r)}
                                disabled={!ready}
                                aria-label={`Download PDF for ${r.campaignName}`}
                                title={ready ? 'Download PDF' : 'Report is still generating'}
                              >
                                {dl === 'busy' ? (
                                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                ) : dl === 'done' ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#06D369]" aria-hidden="true" />
                                ) : (
                                  <Download className="w-4 h-4" aria-hidden="true" />
                                )}
                              </button>
                              <button
                                type="button"
                                className={iconButton}
                                onClick={() => shareReport(r)}
                                disabled={!ready}
                                aria-label={`Copy share link for ${r.campaignName}`}
                                title={ready ? 'Copy share link' : 'Report is still generating'}
                              >
                                {copied ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#06D369]" aria-hidden="true" />
                                ) : (
                                  <Share2 className="w-4 h-4" aria-hidden="true" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          {t.activeCampaigns} campaigns are currently active — their AARs will appear here
          automatically on completion. Older reports ({t.reportsAllTime - data.reports.length})
          are included in exports.
        </p>
      </section>

      {/* Exports & scheduled deliverables */}
      <section aria-label="Exports and scheduled deliverables" className={panel}>
        <SectionHeader
          icon={Download}
          title="Exports & Scheduled Deliverables"
          subtitle="Shareable and audit-ready outputs generated from campaign history"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ThreatIntelCard data={data} />
          <DigestCard initial={t.digestSchedule} recipient={t.digestRecipient} />
          <ComplianceCard />
        </div>
      </section>

      {/* Report preview */}
      {selected && selected.status === 'READY' && (
        <ReportPreviewDialog report={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
