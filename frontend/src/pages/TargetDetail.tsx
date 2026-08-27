/**
 * PhishYou — Target Detail (`/targets/:id`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 9: Target Profile (resilience
 *       overview, campaign history with per-campaign scores, vulnerability
 *       profile with trajectory + trigger charts, consent & compliance,
 *       behavioral intelligence) + PHISHYOU_SPECS/04_BEHAVIORAL_ANALYSIS/
 *       PSYCHOLOGICAL_TRIGGER_MODEL.md (trigger taxonomy) and
 *       08_ETHICAL_FRAMEWORKS/CONSENT_FRAMEWORK.md §4–§5 (12-month consent
 *       forms, CISO-approved exemptions).
 *
 * Single-target profile page:
 * - Header: gradient avatar, identity, consent + exemption badges, and the
 *   Edit / Upload Consent / Add Exemption actions (Remove from System is
 *   hidden while the target is in an active campaign).
 * - Resilience overview: large score gauge, campaign count, defense rate.
 * - Campaign history table with per-campaign scores, defense mechanisms and
 *   AAR links — per-campaign scores mirror the Reports.tsx AAR records.
 * - Vulnerability profile: most effective trigger badge, recharts
 *   vulnerability-trajectory line and trigger-susceptibility bars.
 * - Consent & compliance: signed form history with status + PDF download,
 *   and the active exemption list.
 * - Behavioral intelligence panel (purple, access-restricted note).
 *
 * Data: GET /api/v1/organizations/me/targets/:id. Falls back to embedded
 * demo profiles (mirroring the Targets.tsx directory) when the API is
 * unreachable so the page renders correctly without a backend.
 */
import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Edit3,
  FileText,
  Loader2,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  UserX,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ConsentStatus = 'on_file' | 'missing' | 'exempted' | 'expired';
type ExemptionType = 'medical' | 'occupational' | 'legal' | 'temporary';
type CampaignOutcome =
  | 'ACTIVE'
  | 'DEFENDED'
  | 'COMPROMISED'
  | 'PAUSED'
  | 'BLOCKED'
  | 'HALTED'
  | 'EXPIRED';
type Tier = 'A' | 'B' | 'C';

/** One signed consent form version — CONSENT_FRAMEWORK §4 (12-month validity). */
interface ConsentForm {
  version: string;
  signedAt: string; // ISO
  expiresAt: string; // ISO
  fileName: string;
}

/** Exemption record — CONSENT_FRAMEWORK §5 (approved by the CISO). */
interface Exemption {
  type: ExemptionType;
  reason: string;
  approvedBy: string;
  approvedAt: string; // ISO
  expiresAt: string | null; // ISO — set for temporary exemptions
}

/** A campaign the target went through, with per-campaign detail. */
interface CampaignHistoryEntry {
  id: string;
  name: string;
  date: string; // ISO
  tier: Tier;
  outcome: CampaignOutcome;
  score: number; // resistance score recorded for this campaign
  exchanges: number; // messages exchanged (0 = never engaged)
  defenseMechanism: string | null; // set when the target defended
  aarId: string | null; // After-Action Report reference
}

/** Effectiveness of one psychological trigger against this target. */
interface TriggerScore {
  trigger: string;
  effectiveness: number; // 0..1 — higher = more susceptible
}

/** Auto-generated behavioral profile — shown to authorized staff only. */
interface PsychProfile {
  dominantVulnerability: string;
  decisionSpeed: string;
  verificationBehavior: string;
  platformTrust: string;
  summary: string;
}

interface TargetProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  role: string;
  consent: ConsentStatus;
  consentExpiresAt: string | null; // ISO
  resilience: number | null; // cumulative score — null when never targeted
  inActiveCampaign: boolean; // removal is blocked while true
  campaigns: CampaignHistoryEntry[]; // chronological order
  triggers: TriggerScore[]; // sorted by effectiveness desc
  consentForms: ConsentForm[];
  exemptions: Exemption[];
  psych: PsychProfile | null; // null until the first engagement
}

/* ------------------------------------------------------------------ */
/* Meta constants                                                      */
/* ------------------------------------------------------------------ */

const consentMeta: Record<ConsentStatus, { label: string; className: string }> = {
  on_file: { label: 'Consent On File', className: 'bg-[#06D369]/10 text-[#06D369]' },
  missing: { label: 'Consent Missing', className: 'bg-red-500/10 text-[#FF4757]' },
  exempted: { label: 'Exempted', className: 'bg-purple-400/10 text-[#A78BFA]' },
  expired: { label: 'Consent Expired', className: 'bg-amber-400/10 text-[#F59E0B]' },
};

const exemptionMeta: Record<ExemptionType, { label: string; className: string; hint: string }> = {
  medical: {
    label: 'Medical',
    className: 'bg-purple-400/10 text-[#A78BFA]',
    hint: 'Documented conditions — diagnosed anxiety, recent trauma, ongoing medical care.',
  },
  occupational: {
    label: 'Occupational',
    className: 'bg-blue-500/10 text-[#5B9EFF]',
    hint: 'C-suite (CISO discretion), crisis responders, new employees (first 30 days), medical leave.',
  },
  legal: {
    label: 'Legal',
    className: 'bg-red-500/10 text-[#FF4757]',
    hint: 'Active legal proceedings, protected reporters, known manipulation vulnerabilities.',
  },
  temporary: {
    label: 'Temporary',
    className: 'bg-amber-400/10 text-[#F59E0B]',
    hint: 'High-stress periods — EOY close-out, major projects, significant life events.',
  },
};

const outcomeMeta: Record<CampaignOutcome, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-[#2FD9C7]/10 text-[#2FD9C7]' },
  DEFENDED: { label: 'Defended', className: 'bg-[#06D369]/10 text-[#06D369]' },
  COMPROMISED: { label: 'Compromised', className: 'bg-red-500/10 text-[#FF4757]' },
  PAUSED: { label: 'Paused', className: 'bg-amber-400/10 text-[#F59E0B]' },
  BLOCKED: { label: 'Blocked', className: 'bg-purple-400/10 text-[#A78BFA]' },
  HALTED: { label: 'Halted', className: 'bg-slate-400/10 text-slate-400' },
  EXPIRED: { label: 'Expired', className: 'bg-slate-400/10 text-slate-400' },
};

const tierMeta: Record<Tier, { label: string; className: string }> = {
  A: { label: 'Tier A', className: 'bg-red-500/15 text-[#FF4757]' },
  B: { label: 'Tier B', className: 'bg-amber-400/10 text-[#F59E0B]' },
  C: { label: 'Tier C', className: 'bg-green-400/10 text-[#06D369]' },
};

/** Trigger colors — PSYCHOLOGICAL_TRIGGER_MODEL taxonomy. */
const triggerColors: Record<string, string> = {
  Authority: '#FF4757',
  Urgency: '#F59E0B',
  'Social Proof': '#60A5FA',
  Curiosity: '#A78BFA',
  Fear: '#F472B6',
  Reciprocity: '#34D399',
};

function triggerColor(trigger: string): string {
  return triggerColors[trigger] ?? '#2FD9C7';
}

const DEPARTMENTS = [
  'Engineering',
  'Finance',
  'IT',
  'Leadership',
  'Legal',
  'Marketing',
  'Operations',
  'People Ops',
  'Sales',
  'Other',
];

const chartTooltip = {
  backgroundColor: '#15191F',
  border: '1px solid #2D3748',
  borderRadius: 8,
  fontSize: 12,
  color: '#F5F7FB',
};

/* ------------------------------------------------------------------ */
/* Demo data (used when API unreachable)                               */
/* ------------------------------------------------------------------ */

/** Compact campaign-history constructor. AARs exist for finished campaigns. */
function camp(
  id: string,
  name: string,
  date: string,
  tier: Tier,
  outcome: CampaignOutcome,
  score: number,
  exchanges: number,
  defenseMechanism: string | null = null,
  aarId: string | null = null,
): CampaignHistoryEntry {
  return {
    id,
    name,
    date,
    tier,
    outcome,
    score,
    exchanges,
    defenseMechanism,
    aarId: aarId ?? (outcome === 'ACTIVE' || outcome === 'PAUSED' ? null : `aar_${id}`),
  };
}

/** Compact trigger-score list constructor (order = effectiveness desc). */
function trg(...pairs: [string, number][]): TriggerScore[] {
  return pairs.map(([trigger, effectiveness]) => ({ trigger, effectiveness }));
}

/** Compact consent-form constructor. */
function form(version: string, signedAt: string, expiresAt: string, lastName: string): ConsentForm {
  return { version, signedAt, expiresAt, fileName: `Consent-${lastName}-${version}.pdf` };
}

const DEMO_PROFILES: Record<string, TargetProfile> = {
  target_alice_001: {
    id: 'target_alice_001',
    name: 'Alice Johnson',
    email: 'alice.johnson@company.com',
    phone: '+1-555-0123',
    department: 'Finance',
    role: 'Accounts Payable Manager',
    consent: 'on_file',
    consentExpiresAt: '2027-02-10T00:00:00Z',
    resilience: 0.54,
    inActiveCampaign: true,
    campaigns: [
      camp('camp_2026_08_24_001', 'Internal IT Security Audit', '2026-08-24T09:00:00Z', 'B', 'DEFENDED', 0.18, 4, 'Out-of-band verification'),
      camp('camp_2026_08_27_001', 'Finance Team Payment Verification Q3', '2026-08-27T09:05:00Z', 'A', 'ACTIVE', 0.54, 6),
    ],
    triggers: trg(['Authority', 0.72], ['Urgency', 0.55], ['Social Proof', 0.42], ['Curiosity', 0.3], ['Fear', 0.25], ['Reciprocity', 0.15]),
    consentForms: [
      form('v1.0', '2024-02-15T00:00:00Z', '2025-02-14T00:00:00Z', 'Johnson'),
      form('v2.0', '2025-02-20T00:00:00Z', '2026-02-09T00:00:00Z', 'Johnson'),
      form('v2.1', '2026-02-10T00:00:00Z', '2027-02-10T00:00:00Z', 'Johnson'),
    ],
    exemptions: [],
    psych: {
      dominantVulnerability: 'Authority Deference',
      decisionSpeed: 'Fast responder (avg 45s)',
      verificationBehavior: 'Occasionally verifies out-of-band',
      platformTrust: 'High WhatsApp trust, low email skepticism',
      summary:
        'Alice replies quickly and defers to perceived authority, but the August audit shows she can escalate to out-of-band verification when a message feels wrong. The live payment-verification campaign is exploiting that authority gap — her score is climbing mid-engagement.',
    },
  },
  target_bilal_002: {
    id: 'target_bilal_002',
    name: 'Bilal Hassan',
    email: 'bilal.hassan@company.com',
    phone: '+1-555-0114',
    department: 'Finance',
    role: 'Financial Analyst',
    consent: 'on_file',
    consentExpiresAt: '2027-03-02T00:00:00Z',
    resilience: 0.58,
    inActiveCampaign: true,
    campaigns: [
      camp('camp_2026_08_27_001', 'Finance Team Payment Verification Q3', '2026-08-27T09:05:00Z', 'A', 'ACTIVE', 0.58, 4),
    ],
    triggers: trg(['Authority', 0.7], ['Urgency', 0.52], ['Social Proof', 0.46], ['Curiosity', 0.31], ['Fear', 0.24], ['Reciprocity', 0.16]),
    consentForms: [form('v2.1', '2026-03-02T00:00:00Z', '2027-03-02T00:00:00Z', 'Hassan')],
    exemptions: [],
    psych: {
      dominantVulnerability: 'Authority Deference',
      decisionSpeed: 'Measured responder (avg 2m 05s)',
      verificationBehavior: 'Occasionally verifies out-of-band',
      platformTrust: 'High WhatsApp trust, moderate email skepticism',
      summary:
        'Bilal works through requests methodically but accepts senior-sender framing at face value. Four exchanges into the live Tier A campaign he has not yet shown a skepticism signal.',
    },
  },
  target_sana_003: {
    id: 'target_sana_003',
    name: 'Sana Iqbal',
    email: 'sana.iqbal@company.com',
    phone: '+1-555-0132',
    department: 'Finance',
    role: 'Payroll Specialist',
    consent: 'on_file',
    consentExpiresAt: '2027-01-19T00:00:00Z',
    resilience: 0.41,
    inActiveCampaign: true,
    campaigns: [
      camp('camp_2026_08_27_001', 'Finance Team Payment Verification Q3', '2026-08-27T09:05:00Z', 'A', 'PAUSED', 0.41, 3),
    ],
    triggers: trg(['Social Proof', 0.6], ['Authority', 0.55], ['Urgency', 0.48], ['Curiosity', 0.35], ['Fear', 0.28], ['Reciprocity', 0.18]),
    consentForms: [form('v2.1', '2026-01-19T00:00:00Z', '2027-01-19T00:00:00Z', 'Iqbal')],
    exemptions: [],
    psych: {
      dominantVulnerability: 'Social Proof Reliance',
      decisionSpeed: 'Deliberate responder (avg 3m 40s)',
      verificationBehavior: 'Rarely verifies out-of-band',
      platformTrust: 'High WhatsApp trust, low email skepticism',
      summary:
        'Sana leans on peer cues — group references move her more than direct pressure. The live campaign was paused by the harm detector after a distress signal in her third exchange; a wellbeing check-in is pending before it resumes.',
    },
  },
  target_daniyal_004: {
    id: 'target_daniyal_004',
    name: 'Daniyal Raza',
    email: 'daniyal.raza@company.com',
    phone: '+1-555-0108',
    department: 'Finance',
    role: 'Controller',
    consent: 'on_file',
    consentExpiresAt: '2026-12-04T00:00:00Z',
    resilience: 0.24,
    inActiveCampaign: true,
    campaigns: [
      camp('camp_2026_08_27_001', 'Finance Team Payment Verification Q3', '2026-08-27T09:05:00Z', 'A', 'DEFENDED', 0.24, 2, 'Cross-checked vendor bank details with AP'),
    ],
    triggers: trg(['Social Proof', 0.42], ['Authority', 0.35], ['Urgency', 0.28], ['Curiosity', 0.22], ['Fear', 0.15], ['Reciprocity', 0.12]),
    consentForms: [form('v2.1', '2025-12-04T00:00:00Z', '2026-12-04T00:00:00Z', 'Raza')],
    exemptions: [],
    psych: {
      dominantVulnerability: 'Mild Social Proof Susceptibility',
      decisionSpeed: 'Deliberate responder (avg 5m 20s)',
      verificationBehavior: 'Consistently verifies out-of-band',
      platformTrust: 'Balanced trust across email and WhatsApp',
      summary:
        'Daniyal is the strongest defender in the live cohort — two exchanges in, he questioned the vendor master-data change and confirmed it through the AP system before replying.',
    },
  },
  target_hina_005: {
    id: 'target_hina_005',
    name: 'Hina Malik',
    email: 'hina.malik@company.com',
    phone: '+1-555-0145',
    department: 'Finance',
    role: 'AP Clerk',
    consent: 'on_file',
    consentExpiresAt: '2027-04-22T00:00:00Z',
    resilience: 0.1,
    inActiveCampaign: true,
    campaigns: [
      camp('camp_2026_08_27_001', 'Finance Team Payment Verification Q3', '2026-08-27T09:05:00Z', 'A', 'BLOCKED', 0.1, 1, 'Blocked the sender and reported to IT'),
    ],
    triggers: trg(['Social Proof', 0.15], ['Authority', 0.12], ['Urgency', 0.1], ['Curiosity', 0.08], ['Fear', 0.05], ['Reciprocity', 0.06]),
    consentForms: [form('v2.1', '2026-04-22T00:00:00Z', '2027-04-22T00:00:00Z', 'Malik')],
    exemptions: [],
    psych: {
      dominantVulnerability: 'Low susceptibility across all triggers',
      decisionSpeed: 'Fast responder (avg 30s)',
      verificationBehavior: 'Blocks unknown senders immediately',
      platformTrust: 'Low trust in unsolicited contact',
      summary:
        'Hina blocked the persona after a single message and filed an abuse report through the mail gateway — model behavior for the AP team and a candidate for the quarterly recognition debrief.',
    },
  },
  target_daniel_006: {
    id: 'target_daniel_006',
    name: 'Daniel Osei',
    email: 'daniel.osei@company.com',
    phone: '+1-555-0139',
    department: 'Finance',
    role: 'Procurement Specialist',
    consent: 'on_file',
    consentExpiresAt: '2026-11-18T00:00:00Z',
    resilience: 0.88,
    inActiveCampaign: false,
    campaigns: [
      camp('camp_2026_08_27_006', 'Vendor Invoice Fraud Simulation', '2026-08-27T14:30:00Z', 'A', 'COMPROMISED', 0.88, 6),
    ],
    triggers: trg(['Authority', 0.82], ['Urgency', 0.71], ['Social Proof', 0.55], ['Fear', 0.41], ['Curiosity', 0.28], ['Reciprocity', 0.19]),
    consentForms: [form('v2.0', '2025-11-18T00:00:00Z', '2026-11-18T00:00:00Z', 'Osei')],
    exemptions: [],
    psych: {
      dominantVulnerability: 'Authority Deference',
      decisionSpeed: 'Fast responder (avg 38s)',
      verificationBehavior: 'Rarely verifies out-of-band',
      platformTrust: 'High email trust, low phone skepticism',
      summary:
        'Daniel entered credentials on the simulated supplier portal after six exchanges of authority and urgency pressure, with no skepticism signal before the compromise. Highest-priority coaching candidate this quarter.',
    },
  },
  target_sofia_007: {
    id: 'target_sofia_007',
    name: 'Sofia Marin',
    email: 'sofia.marin@company.com',
    phone: '+1-555-0171',
    department: 'Engineering',
    role: 'Senior Software Engineer',
    consent: 'on_file',
    consentExpiresAt: '2027-05-06T00:00:00Z',
    resilience: 0.22,
    inActiveCampaign: false,
    campaigns: [
      camp('camp_2026_08_27_004', 'LinkedIn Recruiter Outreach', '2026-08-27T11:00:00Z', 'B', 'DEFENDED', 0.52, 3, 'Verified the recruiter on LinkedIn before replying'),
    ],
    triggers: trg(['Social Proof', 0.5], ['Curiosity', 0.45], ['Authority', 0.4], ['Urgency', 0.3], ['Reciprocity', 0.2], ['Fear', 0.18]),
    consentForms: [form('v2.1', '2026-05-06T00:00:00Z', '2027-05-06T00:00:00Z', 'Marin')],
    exemptions: [],
    psych: {
      dominantVulnerability: 'Curiosity with Verification',
      decisionSpeed: 'Measured responder (avg 1m 50s)',
      verificationBehavior: 'Verifies new contacts on-platform',
      platformTrust: 'Low LinkedIn trust, moderate email skepticism',
      summary:
        'Sofia engaged with the recruiter persona out of curiosity but verified the profile before sharing anything — a healthy pattern that kept the three-exchange thread contained.',
    },
  },
  target_marcus_008: {
    id: 'target_marcus_008',
    name: 'Marcus Webb',
    email: 'marcus.webb@company.com',
    phone: '+1-555-0166',
    department: 'IT',
    role: 'Helpdesk Technician',
    consent: 'on_file',
    consentExpiresAt: '2027-06-11T00:00:00Z',
    resilience: 0.74,
    inActiveCampaign: false,
    campaigns: [
      camp('camp_2026_08_21_002', 'IT Helpdesk Password Reset', '2026-08-21T10:00:00Z', 'B', 'COMPROMISED', 0.74, 7),
    ],
    triggers: trg(['Urgency', 0.66], ['Authority', 0.58], ['Social Proof', 0.44], ['Fear', 0.3], ['Curiosity', 0.26], ['Reciprocity', 0.15]),
    consentForms: [form('v2.1', '2026-06-11T00:00:00Z', '2027-06-11T00:00:00Z', 'Webb')],
    exemptions: [],
    psych: {
      dominantVulnerability: 'Urgency Compliance',
      decisionSpeed: 'Fast responder (avg 41s)',
      verificationBehavior: 'Rarely verifies out-of-band',
      platformTrust: 'High voice trust, low email skepticism',
      summary:
        'Marcus read a reset code aloud during a spoofed helpdesk voice call — urgency overrode procedure. His debrief coaching focuses on verification protocols for voice-initiated requests.',
    },
  },
  target_omar_009: {
    id: 'target_omar_009',
    name: 'Omar Farouk',
    email: 'omar.farouk@company.com',
    phone: '+1-555-0152',
    department: 'Operations',
    role: 'Logistics Coordinator',
    consent: 'on_file',
    consentExpiresAt: '2027-02-28T00:00:00Z',
    resilience: 0.19,
    inActiveCampaign: false,
    campaigns: [
      camp('camp_2026_08_19_003', 'WhatsApp Delivery Notice', '2026-08-19T09:00:00Z', 'C', 'DEFENDED', 0.12, 2, 'Channel verification'),
    ],
    triggers: trg(['Urgency', 0.15], ['Authority', 0.12], ['Curiosity', 0.1], ['Social Proof', 0.08], ['Reciprocity', 0.07], ['Fear', 0.05]),
    consentForms: [form('v2.1', '2026-02-28T00:00:00Z', '2027-02-28T00:00:00Z', 'Farouk')],
    exemptions: [],
    psych: {
      dominantVulnerability: 'Low susceptibility across all triggers',
      decisionSpeed: 'Deliberate responder (avg 4m 05s)',
      verificationBehavior: 'Consistently verifies out-of-band',
      platformTrust: 'Moderate WhatsApp trust, verifies via official apps',
      summary:
        'Omar ignored the tracking link and confirmed the delivery through the courier’s official app — fast skepticism, minimal engagement, and a clean two-exchange defense.',
    },
  },
  target_elena_010: {
    id: 'target_elena_010',
    name: 'Elena Vasquez',
    email: 'elena.vasquez@company.com',
    phone: '+1-555-0101',
    department: 'Leadership',
    role: 'Chief of Staff',
    consent: 'on_file',
    consentExpiresAt: '2026-10-15T00:00:00Z',
    resilience: 0.91,
    inActiveCampaign: false,
    campaigns: [
      camp('camp_2026_08_15_001', 'Executive Whaling Simulation — Phase 1', '2026-08-15T13:00:00Z', 'A', 'COMPROMISED', 0.91, 5),
    ],
    triggers: trg(['Authority', 0.94], ['Urgency', 0.77], ['Social Proof', 0.6], ['Fear', 0.48], ['Curiosity', 0.33], ['Reciprocity', 0.22]),
    consentForms: [form('v2.0', '2025-10-15T00:00:00Z', '2026-10-15T00:00:00Z', 'Vasquez')],
    exemptions: [],
    psych: {
      dominantVulnerability: 'Authority Deference',
      decisionSpeed: 'Fast responder (avg 26s)',
      verificationBehavior: 'Rarely verifies out-of-band',
      platformTrust: 'High voice trust, low SMS skepticism',
      summary:
        'Elena approved a simulated wire transfer during a cloned-voice CFO call with no skepticism signal recorded. The executive protection protocol was updated; her consent renews October 15.',
    },
  },
  target_tom_011: {
    id: 'target_tom_011',
    name: 'Tom Becker',
    email: 'tom.becker@company.com',
    phone: '+1-555-0188',
    department: 'Marketing',
    role: 'Social Media Manager',
    consent: 'on_file',
    consentExpiresAt: '2027-07-09T00:00:00Z',
    resilience: 0.45,
    inActiveCampaign: false,
    campaigns: [
      camp('camp_2026_08_12_002', 'Instagram DM Verification', '2026-08-12T09:00:00Z', 'C', 'EXPIRED', 0.45, 0),
    ],
    triggers: [],
    consentForms: [form('v2.1', '2026-07-09T00:00:00Z', '2027-07-09T00:00:00Z', 'Becker')],
    exemptions: [],
    psych: null,
  },
  target_grace_012: {
    id: 'target_grace_012',
    name: 'Grace Liu',
    email: 'grace.liu@company.com',
    phone: '+1-555-0127',
    department: 'Finance',
    role: 'Senior Accountant',
    consent: 'on_file',
    consentExpiresAt: '2027-01-15T00:00:00Z',
    resilience: 0.62,
    inActiveCampaign: false,
    campaigns: [
      camp('camp_2026_04_02_001', 'Q1 Payroll Update Phish', '2026-04-02T09:00:00Z', 'C', 'DEFENDED', 0.38, 3, 'Reported the payroll link to IT'),
      camp('camp_2026_05_14_002', 'Wire Transfer Authorization Drill', '2026-05-14T10:00:00Z', 'B', 'COMPROMISED', 0.62, 5),
    ],
    triggers: trg(['Urgency', 0.68], ['Authority', 0.61], ['Social Proof', 0.5], ['Fear', 0.36], ['Curiosity', 0.3], ['Reciprocity', 0.2]),
    consentForms: [form('v2.1', '2026-01-15T00:00:00Z', '2027-01-15T00:00:00Z', 'Liu')],
    exemptions: [
      {
        type: 'temporary',
        reason: 'Q3 close-out — high-stress period',
        approvedBy: 'Laura Mitchell (CISO)',
        approvedAt: '2026-08-20T00:00:00Z',
        expiresAt: '2026-09-15T00:00:00Z',
      },
    ],
    psych: {
      dominantVulnerability: 'Urgency Compliance',
      decisionSpeed: 'Fast responder (avg 52s)',
      verificationBehavior: 'Verifies when amounts look unusual',
      platformTrust: 'High email trust, low SMS skepticism',
      summary:
        'Grace defends routine phishing cleanly but the wire drill exposed her under deadline pressure. She is exempted through the Q3 close-out, with a re-test scheduled for late September.',
    },
  },
  target_ruth_013: {
    id: 'target_ruth_013',
    name: 'Ruth Nakamura',
    email: 'ruth.nakamura@company.com',
    phone: '+1-555-0147',
    department: 'Legal',
    role: 'Paralegal',
    consent: 'expired',
    consentExpiresAt: '2026-05-30T00:00:00Z',
    resilience: 0.45,
    inActiveCampaign: false,
    campaigns: [
      camp('camp_2026_02_11_001', 'Vendor Portal Credential Refresh', '2026-02-11T09:00:00Z', 'B', 'DEFENDED', 0.52, 5, 'Hovered links and checked the portal URL directly'),
      camp('camp_2026_03_25_003', 'Q1 Compliance Training Reminder', '2026-03-25T09:00:00Z', 'C', 'COMPROMISED', 0.61, 4),
      camp('camp_2026_06_30_001', 'Invoice Approval Follow-Up', '2026-06-30T09:00:00Z', 'B', 'DEFENDED', 0.45, 6, 'Routed the request through legal intake'),
    ],
    triggers: trg(['Curiosity', 0.71], ['Social Proof', 0.58], ['Urgency', 0.44], ['Authority', 0.38], ['Reciprocity', 0.25], ['Fear', 0.2]),
    consentForms: [
      form('v0.9', '2024-06-02T00:00:00Z', '2025-05-29T00:00:00Z', 'Nakamura'),
      form('v1.0', '2025-05-30T00:00:00Z', '2026-05-30T00:00:00Z', 'Nakamura'),
    ],
    exemptions: [
      {
        type: 'legal',
        reason: 'Active legal proceedings — counsel advised exclusion',
        approvedBy: 'Laura Mitchell (CISO)',
        approvedAt: '2026-06-05T00:00:00Z',
        expiresAt: null,
      },
    ],
    psych: {
      dominantVulnerability: 'Curiosity Gap',
      decisionSpeed: 'Deliberate responder (avg 4m 12s)',
      verificationBehavior: 'Checks URLs when already suspicious',
      platformTrust: 'High email trust, low portal skepticism',
      summary:
        'Ruth compromised on a curiosity-driven training reminder in March, then defended strongly in June after coaching — her trajectory is improving. Consent lapsed May 30 and must be renewed before any future campaign once the legal exemption is lifted.',
    },
  },
  target_priya_014: {
    id: 'target_priya_014',
    name: 'Priya Sharma',
    email: 'priya.sharma@company.com',
    phone: '+1-555-0176',
    department: 'People Ops',
    role: 'Benefits Administrator',
    consent: 'exempted',
    consentExpiresAt: null,
    resilience: null,
    inActiveCampaign: false,
    campaigns: [],
    triggers: [],
    consentForms: [],
    exemptions: [
      {
        type: 'medical',
        reason: 'Documented anxiety disorder — HR verified',
        approvedBy: 'Laura Mitchell (CISO)',
        approvedAt: '2026-01-08T00:00:00Z',
        expiresAt: null,
      },
    ],
    psych: null,
  },
  target_noah_015: {
    id: 'target_noah_015',
    name: 'Noah Fischer',
    email: 'noah.fischer@company.com',
    phone: '+1-555-0194',
    department: 'Sales',
    role: 'Account Executive',
    consent: 'missing',
    consentExpiresAt: null,
    resilience: null,
    inActiveCampaign: false,
    campaigns: [],
    triggers: [],
    consentForms: [],
    exemptions: [
      {
        type: 'occupational',
        reason: 'New employee — first 30 days',
        approvedBy: 'Laura Mitchell (CISO)',
        approvedAt: '2026-08-25T00:00:00Z',
        expiresAt: '2026-09-24T00:00:00Z',
      },
    ],
    psych: null,
  },
};

/* ------------------------------------------------------------------ */
/* Fetch + helpers                                                     */
/* ------------------------------------------------------------------ */

async function fetchTarget(id: string): Promise<TargetProfile | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`/api/v1/organizations/me/targets/${encodeURIComponent(id)}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as TargetProfile;
  } finally {
    clearTimeout(timer);
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
}

/** Compact date label for chart axes. */
function shortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/** Cumulative resistance score 0..1 — higher means more susceptible. */
function resistanceColor(score: number): string {
  if (score < 0.33) return '#06D369';
  if (score <= 0.67) return '#F59E0B';
  return '#FF4757';
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isoIsPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/** Next consent-form version — bumps the minor segment past the latest. */
function nextConsentVersion(forms: ConsentForm[]): string {
  let major = 2;
  let minor = 0;
  for (const f of forms) {
    const match = /^v(\d+)\.(\d+)$/.exec(f.version);
    if (!match) continue;
    const maj = Number(match[1]);
    const min = Number(match[2]);
    if (maj > major || (maj === major && min > minor)) {
      major = maj;
      minor = min;
    }
  }
  return forms.length === 0 ? 'v2.1' : `v${major}.${minor + 1}`;
}

/** Download a plain-text stand-in for the archived consent form PDF. */
function downloadConsentForm(form: ConsentForm, targetName: string): void {
  const lines = [
    'PhishYou — Consent to Participate in Security Simulations',
    '',
    `Employee:     ${targetName}`,
    `Form version: ${form.version}`,
    `Signed:       ${formatDate(form.signedAt)}`,
    `Expires:      ${formatDate(form.expiresAt)}`,
    '',
    'Informed consent for inclusion in authorized social-engineering',
    'simulation campaigns (CONSENT_FRAMEWORK §4). Consent is valid for',
    '12 months from signature. The signed form is archived with HR and',
    'its hash is written to the audit chain.',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = form.fileName.replace(/\.pdf$/i, '.txt');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const input =
  'w-full rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2.5 text-sm text-white ' +
  'placeholder:text-[#5A6470] transition-all duration-200 ease-out ' +
  'focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30';

const label = 'block text-sm font-semibold text-slate-300 mb-1.5';

const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#3D4860] bg-[#2D3748] ' +
  'px-4 py-2 text-sm font-medium text-slate-100 transition-all duration-200 ease-out ' +
  'hover:bg-[#232D39] hover:border-[#3D4860] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

const primaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2FD9C7] px-4 py-2 text-sm ' +
  'font-semibold text-[#0F1219] transition-all duration-200 ease-out hover:bg-[#4FE5D3] ' +
  'hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ' +
  'disabled:hover:scale-100';

const destructiveButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF4757] px-4 py-2 text-sm ' +
  'font-semibold text-white transition-all duration-200 ease-out hover:bg-[#FF5E6B] ' +
  'hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ' +
  'disabled:hover:scale-100';

const iconButton =
  'inline-flex items-center justify-center rounded-lg border border-[#3D4860] p-2 text-slate-300 ' +
  'hover:bg-[#2FD9C7]/10 hover:border-[#2FD9C7]/50 hover:text-[#2FD9C7] transition-colors ' +
  'duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ' +
  'disabled:hover:border-[#3D4860] disabled:hover:text-slate-300';

const th = 'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 bg-[#232D39]';
const td = 'px-4 py-3 text-sm text-slate-200 border-t border-[#252D38]';

/* ------------------------------------------------------------------ */
/* Shared components                                                   */
/* ------------------------------------------------------------------ */

function ConsentBadge({ status }: { status: ConsentStatus }) {
  const meta = consentMeta[status];
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function ExemptionBadge({ exemption }: { exemption: Exemption }) {
  const meta = exemptionMeta[exemption.type];
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${meta.className}`}
      title={`${meta.label} exemption — ${exemption.reason}`}
    >
      {meta.label}
    </span>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const meta = tierMeta[tier];
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: CampaignOutcome }) {
  const meta = outcomeMeta[outcome];
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

/** Large cumulative-resilience gauge — gray ring when never targeted. */
function Gauge({ score, size = 128 }: { score: number | null; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = score === null ? 0 : Math.min(1, Math.max(0, score));
  const color = score === null ? '#3D4860' : resistanceColor(score);
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        score === null
          ? 'No resilience score — the target has never been in a campaign'
          : `Cumulative resilience score ${score.toFixed(2)} of 1 — higher is more susceptible`
      }
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#232D39" strokeWidth={stroke} />
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-black font-mono"
          style={{ color: score === null ? '#7A8595' : color }}
        >
          {score === null ? '—' : score.toFixed(2)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
          {score === null ? 'never targeted' : 'of 1.00'}
        </span>
      </div>
    </div>
  );
}

/** Shared dialog chrome — same pattern as the Targets action dialogs. */
function DialogShell({
  titleId,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: {
  titleId: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-xl border border-[#2D3748] bg-[#1D232D] p-6 shadow-lg max-h-[85vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h3 id={titleId} className="text-lg font-bold text-white">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className={iconButton} aria-label="Close dialog">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {children}
        {footer && (
          <div className="mt-6 pt-4 border-t border-[#252D38] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Action dialogs                                                      */
/* ------------------------------------------------------------------ */

/** Edit the target's directory details. */
function EditProfileDialog({
  profile,
  onClose,
  onSave,
  saving,
}: {
  profile: TargetProfile;
  onClose: () => void;
  onSave: (patch: { name: string; email: string; phone: string | null; department: string; role: string }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [department, setDepartment] = useState(profile.department);
  const [role, setRole] = useState(profile.role);
  const [error, setError] = useState<string | null>(null);

  const departmentOptions = DEPARTMENTS.includes(department) ? DEPARTMENTS : [department, ...DEPARTMENTS];

  function save(): void {
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('A valid email address is required.');
      return;
    }
    setError(null);
    onSave({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      department,
      role: role.trim() || 'Other',
    });
  }

  return (
    <DialogShell
      titleId="edit-profile-title"
      title="Edit Profile"
      subtitle={`${profile.email} · ${profile.campaigns.length} campaign${profile.campaigns.length === 1 ? '' : 's'} on record`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className={primaryButton} onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" aria-hidden="true" />
                Save Changes
              </>
            )}
          </button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-profile-name" className={label}>
            Full name
          </label>
          <input
            id="edit-profile-name"
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="edit-profile-email" className={label}>
            Email
          </label>
          <input
            id="edit-profile-email"
            type="email"
            className={input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="edit-profile-phone" className={label}>
            Phone
          </label>
          <input
            id="edit-profile-phone"
            className={input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="—"
          />
        </div>
        <div>
          <label htmlFor="edit-profile-department" className={label}>
            Department
          </label>
          <select
            id="edit-profile-department"
            className={input}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="edit-profile-role" className={label}>
            Job title
          </label>
          <input
            id="edit-profile-role"
            className={input}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-xs text-[#FF4757] mt-3">{error}</p>}
    </DialogShell>
  );
}

/** Record a signed consent form — CONSENT_FRAMEWORK §4 (12-month validity). */
function UploadConsentDialog({
  profile,
  onClose,
  onUpload,
  uploading,
}: {
  profile: TargetProfile;
  onClose: () => void;
  onUpload: (form: ConsentForm) => void;
  uploading: boolean;
}) {
  const [version, setVersion] = useState(nextConsentVersion(profile.consentForms));
  const [signedOn, setSignedOn] = useState(new Date().toISOString().slice(0, 10));
  const [expiresOn, setExpiresOn] = useState(
    new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10),
  );
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestOnFile =
    profile.consentForms.length > 0
      ? profile.consentForms[profile.consentForms.length - 1].version
      : 'none';

  function upload(): void {
    if (!version.trim()) {
      setError('A form version label is required.');
      return;
    }
    if (!signedOn) {
      setError('Pick the date the consent form was signed.');
      return;
    }
    if (!expiresOn || new Date(expiresOn) <= new Date(signedOn)) {
      setError('The expiry date must come after the signed date.');
      return;
    }
    setError(null);
    const lastName = profile.name.split(/\s+/).pop() ?? 'Consent';
    onUpload({
      version: version.trim(),
      signedAt: new Date(`${signedOn}T00:00:00Z`).toISOString(),
      expiresAt: new Date(`${expiresOn}T00:00:00Z`).toISOString(),
      fileName: file ? file.name : `Consent-${lastName}-${version.trim()}.pdf`,
    });
  }

  return (
    <DialogShell
      titleId="upload-consent-title"
      title="Upload Consent"
      subtitle={`${profile.name} · ${profile.email}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button type="button" className={primaryButton} onClick={upload} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" aria-hidden="true" />
                Upload Consent
              </>
            )}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-400">Current status:</span>
        <ConsentBadge status={profile.consent} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="consent-form-version" className={label}>
            Form version
          </label>
          <input
            id="consent-form-version"
            className={input}
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 mt-1.5">Latest on file: {latestOnFile}</p>
        </div>
        <div>
          <label htmlFor="consent-signed-on" className={label}>
            Signed on
          </label>
          <input
            id="consent-signed-on"
            type="date"
            className={input}
            value={signedOn}
            onChange={(e) => setSignedOn(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="consent-expires-on" className={label}>
            Expires on
          </label>
          <input
            id="consent-expires-on"
            type="date"
            className={input}
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 mt-1.5">Consent is valid for 12 months.</p>
        </div>
      </div>
      <label
        htmlFor="consent-form-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          setFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`mt-4 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg py-5 px-4 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-[#2FD9C7] bg-[#2FD9C7]/5' : 'border-[#2D3748] hover:border-[#2FD9C7]/50'
        }`}
      >
        {file ? (
          <>
            <FileText className="w-4 h-4 text-[#2FD9C7]" aria-hidden="true" />
            <span className="text-xs text-slate-300 font-mono">{file.name}</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span className="text-xs text-slate-400">Attach the signed consent form (PDF) — optional</span>
          </>
        )}
        <input
          id="consent-form-file"
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={uploading}
        />
      </label>
      {error && <p className="text-xs text-[#FF4757] mt-3">{error}</p>}
      <p className="text-xs text-slate-500 mt-4">
        The signed form is filed with HR and its hash is written to the audit chain.
      </p>
    </DialogShell>
  );
}

/** Add an exemption — CONSENT_FRAMEWORK §5 (CISO-approved, audit-logged). */
function AddExemptionDialog({
  profile,
  onClose,
  onAdd,
  adding,
}: {
  profile: TargetProfile;
  onClose: () => void;
  onAdd: (exemption: Exemption) => void;
  adding: boolean;
}) {
  const [type, setType] = useState<ExemptionType>('temporary');
  const [reason, setReason] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [error, setError] = useState<string | null>(null);

  function add(): void {
    if (!reason.trim()) {
      setError('A reason is required — it is included in the audit trail.');
      return;
    }
    if (type === 'temporary' && !expiresOn) {
      setError('Temporary exemptions need an expiry date.');
      return;
    }
    setError(null);
    onAdd({
      type,
      reason: reason.trim(),
      approvedBy: 'Laura Mitchell (CISO)',
      approvedAt: new Date().toISOString(),
      expiresAt: expiresOn ? new Date(`${expiresOn}T00:00:00Z`).toISOString() : null,
    });
  }

  return (
    <DialogShell
      titleId="exemption-title"
      title="Add Exemption"
      subtitle={`${profile.name} · ${profile.email}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose} disabled={adding}>
            Cancel
          </button>
          <button type="button" className={primaryButton} onClick={add} disabled={adding}>
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Adding…
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" aria-hidden="true" />
                Add Exemption
              </>
            )}
          </button>
        </>
      }
    >
      {profile.exemptions.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Current exemptions
          </p>
          <div className="space-y-2">
            {profile.exemptions.map((ex, i) => (
              <div
                key={`${ex.type}-${i}`}
                className="flex items-start gap-2.5 rounded-lg border border-[#2D3748] bg-[#15191F] px-3 py-2"
              >
                <ExemptionBadge exemption={ex} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-300">{ex.reason}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Approved by {ex.approvedBy} · {formatDate(ex.approvedAt)}
                    {ex.expiresAt ? ` · expires ${formatDate(ex.expiresAt)}` : ' · open-ended'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="exemption-type" className={label}>
            Exemption type
          </label>
          <select
            id="exemption-type"
            className={input}
            value={type}
            onChange={(e) => setType(e.target.value as ExemptionType)}
          >
            {(Object.keys(exemptionMeta) as ExemptionType[]).map((t) => (
              <option key={t} value={t}>
                {exemptionMeta[t].label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1.5">{exemptionMeta[type].hint}</p>
        </div>
        <div>
          <label htmlFor="exemption-expires" className={label}>
            Expiry date {type === 'temporary' ? '(required)' : '(optional)'}
          </label>
          <input
            id="exemption-expires"
            type="date"
            className={input}
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 mt-1.5">
            Leave empty for an open-ended exclusion reviewed annually.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="exemption-reason" className={label}>
          Reason
        </label>
        <textarea
          id="exemption-reason"
          className={`${input} min-h-[80px] resize-y`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Documented condition verified with HR — reference the HR case number"
        />
      </div>
      {error && <p className="text-xs text-[#FF4757] mt-3">{error}</p>}
      <p className="text-xs text-slate-500 mt-4">
        Exempted employees are excluded from campaign targeting. The exemption, your approval and the
        reason are recorded in the audit trail.
      </p>
    </DialogShell>
  );
}

/** Confirm target removal — blocked while the target is in an active campaign. */
function RemoveTargetDialog({
  profile,
  onClose,
  onConfirm,
  submitting,
}: {
  profile: TargetProfile;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  return (
    <DialogShell
      titleId="remove-target-title"
      title="Remove from System"
      subtitle={`${profile.name} · ${profile.email}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className={destructiveButton}
            onClick={onConfirm}
            disabled={submitting || profile.inActiveCampaign}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Removing…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Remove Target
              </>
            )}
          </button>
        </>
      }
    >
      {profile.inActiveCampaign ? (
        <div className="flex gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
          <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" aria-hidden="true" />
          <p className="text-xs text-slate-300">
            {profile.name} is currently in an active campaign and cannot be removed. Halt or complete
            the campaign first.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span
              className="w-10 h-10 rounded-full bg-[#232D39] border border-[#2D3748] flex items-center justify-center text-sm font-bold text-slate-300 shrink-0"
              aria-hidden="true"
            >
              {initials(profile.name)}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{profile.name}</div>
              <div className="text-xs text-slate-400">
                {profile.role} · {profile.department}
              </div>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-4">
            <AlertTriangle className="w-5 h-5 text-[#FF4757] shrink-0" aria-hidden="true" />
            <p className="text-xs text-slate-300">
              This permanently removes {profile.name} from the target pool and deletes their
              behavioral profile. The removal is written to the immutable audit chain.
            </p>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
            <li>Consent record (C4) is archived for Employment + 5 years.</li>
            <li>Transcripts and media (C3) are purged at the end of the retention window.</li>
            <li>Campaign history is anonymized into aggregate AAR metrics.</li>
            <li>The behavioral intelligence profile is deleted immediately.</li>
          </ul>
        </>
      )}
    </DialogShell>
  );
}

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

/** Per-campaign resilience scores over time — one point per campaign. */
function TrajectoryChart({ campaigns }: { campaigns: CampaignHistoryEntry[] }) {
  const data = [...campaigns]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => ({ date: shortDate(c.date), score: c.score }));
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#7A8595', fontSize: 10 }}
            axisLine={{ stroke: '#2D3748' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={(v: number) => v.toFixed(2)}
            tick={{ fill: '#7A8595', fontSize: 10 }}
            axisLine={{ stroke: '#2D3748' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={chartTooltip}
            formatter={(v: number) => [v.toFixed(2), 'Resilience score']}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#2FD9C7"
            strokeWidth={2}
            dot={{ r: 3, fill: '#2FD9C7', strokeWidth: 0 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Trigger susceptibility — horizontal bars colored per trigger taxonomy. */
function TriggerChart({ triggers }: { triggers: TriggerScore[] }) {
  const data = triggers.map((t) => ({ trigger: t.trigger, effectiveness: t.effectiveness }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
          <XAxis
            type="number"
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={(v: number) => v.toFixed(2)}
            tick={{ fill: '#7A8595', fontSize: 10 }}
            axisLine={{ stroke: '#2D3748' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="trigger"
            width={88}
            tick={{ fill: '#AEB8C4', fontSize: 10 }}
            axisLine={{ stroke: '#2D3748' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={chartTooltip}
            cursor={{ fill: 'rgba(47,217,199,0.06)' }}
            formatter={(v: number) => [v.toFixed(2), 'Effectiveness']}
          />
          <Bar dataKey="effectiveness" radius={[0, 4, 4, 0]} barSize={12}>
            {data.map((d) => (
              <Cell key={d.trigger} fill={triggerColor(d.trigger)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TargetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const targetId = id ?? '';

  const [profile, setProfile] = useState<TargetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Dialog state — only one dialog is open at a time
  const [editOpen, setEditOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [exemptionOpen, setExemptionOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setProfile(null);
    fetchTarget(targetId)
      .then((p) => {
        if (cancelled) return;
        if (p) {
          setProfile(p);
        } else if (DEMO_PROFILES[targetId]) {
          setProfile(DEMO_PROFILES[targetId]);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (DEMO_PROFILES[targetId]) {
          setProfile(DEMO_PROFILES[targetId]);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  /** Send a write request; when the API is unreachable (demo mode) the local
   *  state below remains the source of truth. */
  async function mutate(
    path: string,
    init: { method: string; body?: BodyInit | null },
  ): Promise<void> {
    setBusy(true);
    try {
      await fetch(path, {
        ...init,
        headers: typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : undefined,
      });
    } catch {
      // Demo mode — API unreachable, keep the local update.
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveProfile(
    patch: { name: string; email: string; phone: string | null; department: string; role: string },
  ): Promise<void> {
    await mutate(`/api/v1/organizations/me/targets/${targetId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    setEditOpen(false);
  }

  async function handleConsentUpload(form: ConsentForm): Promise<void> {
    await mutate(`/api/v1/organizations/me/targets/${targetId}/consent`, {
      method: 'POST',
      body: JSON.stringify({ version: form.version, signedAt: form.signedAt, expiresAt: form.expiresAt }),
    });
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            consent: 'on_file',
            consentExpiresAt: form.expiresAt,
            consentForms: [...prev.consentForms, form],
          }
        : prev,
    );
    setConsentOpen(false);
  }

  async function handleAddExemption(exemption: Exemption): Promise<void> {
    await mutate(`/api/v1/organizations/me/targets/${targetId}/exemptions`, {
      method: 'POST',
      body: JSON.stringify(exemption),
    });
    setProfile((prev) => (prev ? { ...prev, exemptions: [...prev.exemptions, exemption] } : prev));
    setExemptionOpen(false);
  }

  async function handleRemoveTarget(): Promise<void> {
    await mutate(`/api/v1/organizations/me/targets/${targetId}`, { method: 'DELETE' });
    navigate('/targets');
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2FD9C7]" aria-hidden="true" />
          <p className="text-sm text-slate-400">Loading target profile…</p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/targets"
          className="inline-flex items-center gap-2 text-sm text-[#2FD9C7] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Targets
        </Link>
        <div className="mt-6 bg-[#111827] border border-[#2D3748] rounded-xl p-10 text-center">
          <UserX className="w-10 h-10 text-slate-600 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-lg font-bold text-white">Target not found</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            No target exists with ID “{id}”. It may have been removed from the pool — removals are
            recorded in the audit chain.
          </p>
          <button
            type="button"
            className={`${secondaryButton} mt-6`}
            onClick={() => navigate('/targets')}
          >
            Return to Targets
          </button>
        </div>
      </div>
    );
  }

  // Derived metrics — finished = not live/paused; blocked counts as defended.
  const campaigns = profile.campaigns;
  const finished = campaigns.filter((c) => c.outcome !== 'ACTIVE' && c.outcome !== 'PAUSED');
  const defended = finished.filter((c) => c.outcome === 'DEFENDED' || c.outcome === 'BLOCKED').length;
  const defenseRate = finished.length > 0 ? defended / finished.length : null;
  const trajectory = [...campaigns].sort((a, b) => a.date.localeCompare(b.date));
  const lastScore = trajectory.length > 0 ? trajectory[trajectory.length - 1].score : null;
  const prevScore = trajectory.length > 1 ? trajectory[trajectory.length - 2].score : null;
  const delta = lastScore !== null && prevScore !== null ? lastScore - prevScore : null;
  const topTrigger = profile.triggers[0] ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back link */}
      <Link
        to="/targets"
        className="inline-flex items-center gap-2 text-sm text-[#2FD9C7] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Targets
      </Link>

      {/* Header — identity, consent badges, actions */}
      <div className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-black text-white shrink-0"
              aria-hidden="true"
            >
              {initials(profile.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-black text-white">{profile.name}</h1>
                {profile.inActiveCampaign && (
                  <span className="rounded-full bg-[#2FD9C7]/10 text-[#2FD9C7] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                    In Live Campaign
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {profile.role} · {profile.department} · {profile.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <ConsentBadge status={profile.consent} />
                {profile.consentExpiresAt && (
                  <span className="text-[11px] text-slate-500">
                    {profile.consent === 'expired' ? 'expired' : 'valid through'}{' '}
                    {formatDate(profile.consentExpiresAt)}
                  </span>
                )}
                {profile.exemptions.map((ex, i) => (
                  <ExemptionBadge key={`${ex.type}-${i}`} exemption={ex} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={secondaryButton} onClick={() => setEditOpen(true)}>
              <Edit3 className="w-4 h-4" aria-hidden="true" />
              Edit Profile
            </button>
            <button type="button" className={secondaryButton} onClick={() => setConsentOpen(true)}>
              <Upload className="w-4 h-4" aria-hidden="true" />
              Upload Consent
            </button>
            <button type="button" className={secondaryButton} onClick={() => setExemptionOpen(true)}>
              <Ban className="w-4 h-4" aria-hidden="true" />
              Add Exemption
            </button>
            {!profile.inActiveCampaign && (
              <button type="button" className={destructiveButton} onClick={() => setRemoveOpen(true)}>
                <UserX className="w-4 h-4" aria-hidden="true" />
                Remove from System
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 1 — Resilience overview */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6 flex items-center gap-5">
          <Gauge score={profile.resilience} />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">Cumulative Resilience</h2>
            <p className="text-xs text-slate-400 mt-1">
              Score across {campaigns.length} campaign{campaigns.length === 1 ? '' : 's'} and baseline
              assessment — lower is safer.
            </p>
          </div>
        </div>
        <div className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6">
          <div className="text-4xl font-black text-white">{campaigns.length}</div>
          <div className="text-sm text-slate-400 mt-1">Total Campaigns</div>
          <div className="text-xs text-slate-500 mt-1.5">
            {finished.length} finished · {campaigns.length - finished.length} live or paused
          </div>
        </div>
        <div className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6">
          <div className="text-4xl font-black text-white">
            {defenseRate === null ? '—' : `${Math.round(defenseRate * 100)}%`}
          </div>
          <div className="text-sm text-slate-400 mt-1">Defense Rate</div>
          <div className="text-xs text-slate-500 mt-1.5">
            {defenseRate === null
              ? 'No finished campaigns yet'
              : `${defended} of ${finished.length} finished campaigns defended`}
          </div>
        </div>
      </section>

      {/* Section 2 — Campaign history */}
      <section className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6">
        <h2 className="text-lg font-bold text-white mb-4">Campaign History</h2>
        {campaigns.length === 0 ? (
          <p className="text-xs text-slate-500 border border-dashed border-[#2D3748] rounded-xl py-6 text-center">
            No campaigns yet — this target has never been selected for a simulation.
          </p>
        ) : (
          <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr>
                  <th className={th}>Campaign</th>
                  <th className={th}>Date</th>
                  <th className={th}>Tier</th>
                  <th className={th}>Outcome</th>
                  <th className={th}>Score</th>
                  <th className={th}>Defense Mechanism</th>
                  <th className={th}>AAR</th>
                </tr>
              </thead>
              <tbody>
                {[...campaigns].reverse().map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className={`${td} font-medium text-white`}>
                      <Link
                        to={`/campaigns/${c.id}`}
                        className="hover:text-[#2FD9C7] transition-colors"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className={td}>
                      <span className="text-xs text-slate-300">{formatDate(c.date)}</span>
                    </td>
                    <td className={td}>
                      <TierBadge tier={c.tier} />
                    </td>
                    <td className={td}>
                      <OutcomeBadge outcome={c.outcome} />
                    </td>
                    <td className={td}>
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className="font-mono text-sm font-semibold"
                          style={{ color: resistanceColor(c.score) }}
                        >
                          {c.score.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500">{c.exchanges} exch.</span>
                      </div>
                    </td>
                    <td className={td}>
                      {c.defenseMechanism ? (
                        <span className="text-xs text-slate-300">{c.defenseMechanism}</span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className={td}>
                      {c.aarId ? (
                        <Link to="/reports" className="text-xs text-[#2FD9C7] hover:underline">
                          View AAR
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-600">
                          {c.outcome === 'ACTIVE' ? 'Live' : 'Pending'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500 mt-4">
          Per-campaign scores mirror the After-Action Reports · lower is safer · AARs open in Reports.
        </p>
      </section>

      {/* Section 3 — Vulnerability profile */}
      <section className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-white">Vulnerability Profile</h2>
          <div className="flex flex-wrap items-center gap-3">
            {topTrigger && (
              <span
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold"
                style={{
                  borderColor: `${triggerColor(topTrigger.trigger)}66`,
                  backgroundColor: `${triggerColor(topTrigger.trigger)}1A`,
                  color: triggerColor(topTrigger.trigger),
                }}
              >
                Most effective: {topTrigger.trigger} ({topTrigger.effectiveness.toFixed(2)})
              </span>
            )}
            {delta !== null && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  delta > 0.05
                    ? 'bg-red-500/10 text-[#FF4757]'
                    : delta < -0.05
                      ? 'bg-[#06D369]/10 text-[#06D369]'
                      : 'bg-[#232D39] text-slate-400'
                }`}
              >
                {delta > 0.05 ? (
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : delta < -0.05 ? (
                  <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                ) : null}
                {delta > 0.05 ? 'Vulnerability rising' : delta < -0.05 ? 'Vulnerability falling' : 'Stable'}
                ({delta > 0 ? '+' : ''}
                {delta.toFixed(2)})
              </span>
            )}
          </div>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-xs text-slate-500 border border-dashed border-[#2D3748] rounded-xl py-6 text-center">
            No engagement data yet — the vulnerability profile is built from campaign exchanges.
          </p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Vulnerability trajectory
              </p>
              <TrajectoryChart campaigns={campaigns} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Trigger susceptibility
              </p>
              {profile.triggers.length > 0 ? (
                <TriggerChart triggers={profile.triggers} />
              ) : (
                <p className="text-xs text-slate-500 border border-dashed border-[#2D3748] rounded-xl py-6 text-center">
                  No engagement data — the campaign expired without a response.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Section 4 — Consent & compliance */}
      <section className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6">
        <h2 className="text-lg font-bold text-white mb-4">Consent & Compliance</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Consent form history
            </p>
            {profile.consentForms.length === 0 ? (
              <p className="text-xs text-slate-500 border border-dashed border-[#2D3748] rounded-xl py-6 text-center">
                No consent forms on file
                {profile.consent === 'exempted' ? ' — the target is exempted from targeting.' : '.'}
              </p>
            ) : (
              <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[460px]">
                  <thead>
                    <tr>
                      <th className={th}>Version</th>
                      <th className={th}>Signed</th>
                      <th className={th}>Expiry</th>
                      <th className={th}>Status</th>
                      <th className={th}>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.consentForms.map((f) => {
                      const expired = isoIsPast(f.expiresAt);
                      return (
                        <tr key={`${f.version}-${f.signedAt}`} className="hover:bg-white/5 transition-colors">
                          <td className={`${td} font-mono text-xs`}>{f.version}</td>
                          <td className={td}>
                            <span className="text-xs text-slate-300">{formatDate(f.signedAt)}</span>
                          </td>
                          <td className={td}>
                            <span className="text-xs text-slate-300">{formatDate(f.expiresAt)}</span>
                          </td>
                          <td className={td}>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                expired ? 'bg-amber-400/10 text-[#F59E0B]' : 'bg-[#06D369]/10 text-[#06D369]'
                              }`}
                            >
                              {expired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td className={td}>
                            <button
                              type="button"
                              onClick={() => downloadConsentForm(f, profile.name)}
                              className="inline-flex items-center gap-1.5 text-xs text-[#2FD9C7] hover:underline"
                              aria-label={`Download consent form ${f.version}`}
                            >
                              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Exemptions
            </p>
            {profile.exemptions.length === 0 ? (
              <p className="text-xs text-slate-500 border border-dashed border-[#2D3748] rounded-xl py-6 text-center">
                No exemptions — the target is eligible for selection while consent is valid.
              </p>
            ) : (
              <div className="space-y-2.5">
                {profile.exemptions.map((ex, i) => {
                  const meta = exemptionMeta[ex.type];
                  return (
                    <div
                      key={`${ex.type}-${i}`}
                      className="rounded-lg border border-[#2D3748] bg-[#15191F] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${meta.className}`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {ex.expiresAt ? `expires ${formatDate(ex.expiresAt)}` : 'open-ended'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">{ex.reason}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Approved by {ex.approvedBy} · {formatDate(ex.approvedAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-3">
              Exemptions are CISO-approved and reviewed annually — CONSENT_FRAMEWORK §5.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 — Behavioral intelligence (access-restricted) */}
      <section className="bg-[#111827] border border-purple-500/20 rounded-xl p-5 sm:p-6">
        <h2 className="text-xs text-purple-400 uppercase tracking-wider mb-4">Behavioral Intelligence</h2>
        {profile.psych ? (
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500">Dominant Vulnerability</p>
                <p className="text-sm text-slate-200 font-medium mt-1">
                  {profile.psych.dominantVulnerability}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Decision Speed</p>
                <p className="text-sm text-slate-200 font-medium mt-1">{profile.psych.decisionSpeed}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Verification Behavior</p>
                <p className="text-sm text-slate-200 font-medium mt-1">
                  {profile.psych.verificationBehavior}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Platform Trust</p>
                <p className="text-sm text-slate-200 font-medium mt-1">{profile.psych.platformTrust}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{profile.psych.summary}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 border border-dashed border-purple-500/20 rounded-xl py-6 text-center">
            Behavioral profile unavailable — it is generated after the first completed engagement.
          </p>
        )}
        <p className="text-xs text-slate-500 mt-4">
          Profile derived from {campaigns.length} campaign engagement{campaigns.length === 1 ? '' : 's'}.
          Access restricted to authorized security staff.
        </p>
      </section>

      {/* Dialogs */}
      {editOpen && (
        <EditProfileDialog
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveProfile}
          saving={busy}
        />
      )}
      {consentOpen && (
        <UploadConsentDialog
          profile={profile}
          onClose={() => setConsentOpen(false)}
          onUpload={handleConsentUpload}
          uploading={busy}
        />
      )}
      {exemptionOpen && (
        <AddExemptionDialog
          profile={profile}
          onClose={() => setExemptionOpen(false)}
          onAdd={handleAddExemption}
          adding={busy}
        />
      )}
      {removeOpen && (
        <RemoveTargetDialog
          profile={profile}
          onClose={() => setRemoveOpen(false)}
          onConfirm={handleRemoveTarget}
          submitting={busy}
        />
      )}
    </div>
  );
}
