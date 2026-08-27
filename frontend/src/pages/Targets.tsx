/**
 * PhishYou — Targets (`/targets`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 8: Target Management
 *       (filter bar, targets table, Add Targets dialog with manual entry
 *       and CSV import) + PHISHYOU_SPECS/08_ETHICAL_FRAMEWORKS/
 *       CONSENT_FRAMEWORK.md §5 (exemption categories & approval process)
 *       and 02_ARCHITECTURE/DATABASE_SCHEMA.md (campaign_targets statuses).
 *
 * Target pool management:
 * - KPI strip: directory size, consent coverage (split by status), active
 *   exemptions, average resistance.
 * - Searchable, filterable table (department, consent status) with per-row
 *   consent badges, exemption badges, resilience mini-bars, a campaign
 *   history popover, and view / edit / consent / exemption / remove actions.
 * - Add Targets dialog: manual entry with a staging list, or CSV import with
 *   client-side parsing, column mapping and a preview table.
 * - Upload Consent, Add Exemption and Remove Target dialogs — all with
 *   demo-mode fallbacks so the page works without a backend.
 *
 * Data: GET /api/v1/organizations/me/targets. Falls back to embedded demo
 * data when the API is unreachable so the page renders correctly without
 * a running backend.
 */
import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  ChevronDown,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ConsentStatus = 'on_file' | 'missing' | 'exempted' | 'expired';
type ExemptionType = 'medical' | 'occupational' | 'legal' | 'temporary';
type CampaignStatus =
  | 'ACTIVE'
  | 'DEFENDED'
  | 'COMPROMISED'
  | 'PAUSED'
  | 'BLOCKED'
  | 'HALTED'
  | 'EXPIRED';
type Tier = 'A' | 'B' | 'C';
type CsvField = 'name' | 'email' | 'phone' | 'department' | 'role' | 'ignore';

/** Exemption record — CONSENT_FRAMEWORK.md §5 (approved by the CISO). */
interface Exemption {
  type: ExemptionType;
  reason: string;
  approvedBy: string;
  approvedAt: string; // ISO
  expiresAt: string | null; // ISO — set for temporary exemptions
}

/** A campaign the target has been part of (popover listing). */
interface CampaignRef {
  id: string;
  name: string;
  status: CampaignStatus;
  tier: Tier;
  date: string; // ISO
}

interface TargetRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  role: string;
  consent: ConsentStatus;
  consentSignedAt: string | null; // ISO
  consentExpiresAt: string | null; // ISO
  resilience: number | null; // cumulative resistance score — null when never targeted
  campaigns: CampaignRef[];
  exemptions: Exemption[];
  lastTargetedAt: string | null; // ISO
  inActiveCampaign: boolean; // removal is blocked while true
}

/** Row shape produced by the Add Targets dialog (manual + CSV). */
interface NewTargetRow {
  name: string;
  email: string;
  phone: string | null;
  department: string;
  role: string;
}

interface TargetsData {
  totals: {
    employees: number;
    consentCoverage: number; // on file or exempted / employees
    exemptionsActive: number;
    avgResistance: number;
    consentBreakdown: { onFile: number; exempted: number; missing: number; expired: number };
  };
  targets: TargetRecord[];
}

/* ------------------------------------------------------------------ */
/* Meta constants                                                      */
/* ------------------------------------------------------------------ */

const consentMeta: Record<ConsentStatus, { label: string; className: string }> = {
  on_file: { label: 'On File', className: 'bg-[#06D369]/10 text-[#06D369]' },
  missing: { label: 'Missing', className: 'bg-red-500/10 text-[#FF4757]' },
  exempted: { label: 'Exempted', className: 'bg-purple-400/10 text-[#A78BFA]' },
  expired: { label: 'Expired', className: 'bg-amber-400/10 text-[#F59E0B]' },
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

const campaignStatusMeta: Record<CampaignStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-[#2FD9C7]/10 text-[#2FD9C7]' },
  DEFENDED: { label: 'Defended', className: 'bg-[#06D369]/10 text-[#06D369]' },
  COMPROMISED: { label: 'Compromised', className: 'bg-red-500/10 text-[#FF4757]' },
  PAUSED: { label: 'Paused', className: 'bg-amber-400/10 text-[#F59E0B]' },
  BLOCKED: { label: 'Blocked', className: 'bg-purple-400/10 text-[#A78BFA]' },
  HALTED: { label: 'Halted', className: 'bg-slate-400/10 text-slate-400' },
  EXPIRED: { label: 'Expired', className: 'bg-slate-400/10 text-slate-400' },
};

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

const ROLES = [
  'Analyst',
  'Coordinator',
  'Engineer',
  'Manager',
  'Specialist',
  'Technician',
  'Other',
];

/* ------------------------------------------------------------------ */
/* Demo data (used when API unreachable)                               */
/* ------------------------------------------------------------------ */

const DEMO_DATA: TargetsData = {
  totals: {
    employees: 234,
    consentCoverage: 0.92,
    exemptionsActive: 7,
    avgResistance: 0.44,
    consentBreakdown: { onFile: 203, exempted: 12, missing: 11, expired: 8 },
  },
  targets: [
    {
      id: 'target_alice_001',
      name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
      phone: '+1-555-0123',
      department: 'Finance',
      role: 'Accounts Payable Manager',
      consent: 'on_file',
      consentSignedAt: '2026-02-10T00:00:00Z',
      consentExpiresAt: '2027-02-10T00:00:00Z',
      resilience: 0.54,
      campaigns: [
        {
          id: 'camp_2026_08_24_001',
          name: 'Internal IT Security Audit',
          status: 'DEFENDED',
          tier: 'B',
          date: '2026-08-24T09:00:00Z',
        },
        {
          id: 'camp_2026_08_27_001',
          name: 'Finance Team Payment Verification Q3',
          status: 'ACTIVE',
          tier: 'A',
          date: '2026-08-27T09:05:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-27T09:05:00Z',
      inActiveCampaign: true,
    },
    {
      id: 'target_bilal_002',
      name: 'Bilal Hassan',
      email: 'bilal.hassan@company.com',
      phone: '+1-555-0114',
      department: 'Finance',
      role: 'Financial Analyst',
      consent: 'on_file',
      consentSignedAt: '2026-03-02T00:00:00Z',
      consentExpiresAt: '2027-03-02T00:00:00Z',
      resilience: 0.58,
      campaigns: [
        {
          id: 'camp_2026_08_27_001',
          name: 'Finance Team Payment Verification Q3',
          status: 'ACTIVE',
          tier: 'A',
          date: '2026-08-27T09:05:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-27T09:05:00Z',
      inActiveCampaign: true,
    },
    {
      id: 'target_sana_003',
      name: 'Sana Iqbal',
      email: 'sana.iqbal@company.com',
      phone: '+1-555-0132',
      department: 'Finance',
      role: 'Payroll Specialist',
      consent: 'on_file',
      consentSignedAt: '2026-01-19T00:00:00Z',
      consentExpiresAt: '2027-01-19T00:00:00Z',
      resilience: 0.41,
      campaigns: [
        {
          id: 'camp_2026_08_27_001',
          name: 'Finance Team Payment Verification Q3',
          status: 'PAUSED',
          tier: 'A',
          date: '2026-08-27T09:05:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-27T09:05:00Z',
      inActiveCampaign: true,
    },
    {
      id: 'target_daniyal_004',
      name: 'Daniyal Raza',
      email: 'daniyal.raza@company.com',
      phone: '+1-555-0108',
      department: 'Finance',
      role: 'Controller',
      consent: 'on_file',
      consentSignedAt: '2025-12-04T00:00:00Z',
      consentExpiresAt: '2026-12-04T00:00:00Z',
      resilience: 0.24,
      campaigns: [
        {
          id: 'camp_2026_08_27_001',
          name: 'Finance Team Payment Verification Q3',
          status: 'DEFENDED',
          tier: 'A',
          date: '2026-08-27T09:05:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-27T09:05:00Z',
      inActiveCampaign: true,
    },
    {
      id: 'target_hina_005',
      name: 'Hina Malik',
      email: 'hina.malik@company.com',
      phone: '+1-555-0145',
      department: 'Finance',
      role: 'AP Clerk',
      consent: 'on_file',
      consentSignedAt: '2026-04-22T00:00:00Z',
      consentExpiresAt: '2027-04-22T00:00:00Z',
      resilience: 0.1,
      campaigns: [
        {
          id: 'camp_2026_08_27_001',
          name: 'Finance Team Payment Verification Q3',
          status: 'BLOCKED',
          tier: 'A',
          date: '2026-08-27T09:05:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-27T09:05:00Z',
      inActiveCampaign: true,
    },
    {
      id: 'target_daniel_006',
      name: 'Daniel Osei',
      email: 'daniel.osei@company.com',
      phone: '+1-555-0139',
      department: 'Finance',
      role: 'Procurement Specialist',
      consent: 'on_file',
      consentSignedAt: '2025-11-18T00:00:00Z',
      consentExpiresAt: '2026-11-18T00:00:00Z',
      resilience: 0.88,
      campaigns: [
        {
          id: 'camp_2026_08_27_006',
          name: 'Vendor Invoice Fraud Simulation',
          status: 'COMPROMISED',
          tier: 'A',
          date: '2026-08-27T14:30:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-27T14:30:00Z',
      inActiveCampaign: false,
    },
    {
      id: 'target_sofia_007',
      name: 'Sofia Marin',
      email: 'sofia.marin@company.com',
      phone: '+1-555-0171',
      department: 'Engineering',
      role: 'Senior Software Engineer',
      consent: 'on_file',
      consentSignedAt: '2026-05-06T00:00:00Z',
      consentExpiresAt: '2027-05-06T00:00:00Z',
      resilience: 0.22,
      campaigns: [
        {
          id: 'camp_2026_08_27_004',
          name: 'LinkedIn Recruiter Outreach',
          status: 'DEFENDED',
          tier: 'B',
          date: '2026-08-27T11:00:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-27T11:00:00Z',
      inActiveCampaign: false,
    },
    {
      id: 'target_marcus_008',
      name: 'Marcus Webb',
      email: 'marcus.webb@company.com',
      phone: '+1-555-0166',
      department: 'IT',
      role: 'Helpdesk Technician',
      consent: 'on_file',
      consentSignedAt: '2026-06-11T00:00:00Z',
      consentExpiresAt: '2027-06-11T00:00:00Z',
      resilience: 0.74,
      campaigns: [
        {
          id: 'camp_2026_08_21_002',
          name: 'IT Helpdesk Password Reset',
          status: 'COMPROMISED',
          tier: 'B',
          date: '2026-08-21T10:00:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-21T10:00:00Z',
      inActiveCampaign: false,
    },
    {
      id: 'target_omar_009',
      name: 'Omar Farouk',
      email: 'omar.farouk@company.com',
      phone: '+1-555-0152',
      department: 'Operations',
      role: 'Logistics Coordinator',
      consent: 'on_file',
      consentSignedAt: '2026-02-28T00:00:00Z',
      consentExpiresAt: '2027-02-28T00:00:00Z',
      resilience: 0.19,
      campaigns: [
        {
          id: 'camp_2026_08_19_003',
          name: 'WhatsApp Delivery Notice',
          status: 'DEFENDED',
          tier: 'C',
          date: '2026-08-19T09:00:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-19T09:00:00Z',
      inActiveCampaign: false,
    },
    {
      id: 'target_elena_010',
      name: 'Elena Vasquez',
      email: 'elena.vasquez@company.com',
      phone: '+1-555-0101',
      department: 'Leadership',
      role: 'Chief of Staff',
      consent: 'on_file',
      consentSignedAt: '2025-10-15T00:00:00Z',
      consentExpiresAt: '2026-10-15T00:00:00Z',
      resilience: 0.91,
      campaigns: [
        {
          id: 'camp_2026_08_15_001',
          name: 'Executive Whaling Simulation — Phase 1',
          status: 'COMPROMISED',
          tier: 'A',
          date: '2026-08-15T13:00:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-15T13:00:00Z',
      inActiveCampaign: false,
    },
    {
      id: 'target_tom_011',
      name: 'Tom Becker',
      email: 'tom.becker@company.com',
      phone: '+1-555-0188',
      department: 'Marketing',
      role: 'Social Media Manager',
      consent: 'on_file',
      consentSignedAt: '2026-07-09T00:00:00Z',
      consentExpiresAt: '2027-07-09T00:00:00Z',
      resilience: 0.45,
      campaigns: [
        {
          id: 'camp_2026_08_12_002',
          name: 'Instagram DM Verification',
          status: 'EXPIRED',
          tier: 'C',
          date: '2026-08-12T09:00:00Z',
        },
      ],
      exemptions: [],
      lastTargetedAt: '2026-08-12T09:00:00Z',
      inActiveCampaign: false,
    },
    {
      id: 'target_grace_012',
      name: 'Grace Liu',
      email: 'grace.liu@company.com',
      phone: '+1-555-0127',
      department: 'Finance',
      role: 'Senior Accountant',
      consent: 'on_file',
      consentSignedAt: '2026-01-15T00:00:00Z',
      consentExpiresAt: '2027-01-15T00:00:00Z',
      resilience: 0.62,
      campaigns: [
        {
          id: 'camp_2026_04_02_001',
          name: 'Q1 Payroll Update Phish',
          status: 'DEFENDED',
          tier: 'C',
          date: '2026-04-02T09:00:00Z',
        },
        {
          id: 'camp_2026_05_14_002',
          name: 'Wire Transfer Authorization Drill',
          status: 'COMPROMISED',
          tier: 'B',
          date: '2026-05-14T10:00:00Z',
        },
      ],
      exemptions: [
        {
          type: 'temporary',
          reason: 'Q3 close-out — high-stress period',
          approvedBy: 'Laura Mitchell (CISO)',
          approvedAt: '2026-08-20T00:00:00Z',
          expiresAt: '2026-09-15T00:00:00Z',
        },
      ],
      lastTargetedAt: '2026-05-14T10:00:00Z',
      inActiveCampaign: false,
    },
    {
      id: 'target_ruth_013',
      name: 'Ruth Nakamura',
      email: 'ruth.nakamura@company.com',
      phone: '+1-555-0147',
      department: 'Legal',
      role: 'Paralegal',
      consent: 'expired',
      consentSignedAt: '2025-05-30T00:00:00Z',
      consentExpiresAt: '2026-05-30T00:00:00Z',
      resilience: 0.45,
      campaigns: [
        {
          id: 'camp_2026_02_11_001',
          name: 'Vendor Portal Credential Refresh',
          status: 'DEFENDED',
          tier: 'B',
          date: '2026-02-11T09:00:00Z',
        },
        {
          id: 'camp_2026_03_25_003',
          name: 'Q1 Compliance Training Reminder',
          status: 'COMPROMISED',
          tier: 'C',
          date: '2026-03-25T09:00:00Z',
        },
        {
          id: 'camp_2026_06_30_001',
          name: 'Invoice Approval Follow-Up',
          status: 'DEFENDED',
          tier: 'B',
          date: '2026-06-30T09:00:00Z',
        },
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
      lastTargetedAt: '2026-06-30T09:00:00Z',
      inActiveCampaign: false,
    },
    {
      id: 'target_priya_014',
      name: 'Priya Sharma',
      email: 'priya.sharma@company.com',
      phone: '+1-555-0176',
      department: 'People Ops',
      role: 'Benefits Administrator',
      consent: 'exempted',
      consentSignedAt: null,
      consentExpiresAt: null,
      resilience: null,
      campaigns: [],
      exemptions: [
        {
          type: 'medical',
          reason: 'Documented anxiety disorder — HR verified',
          approvedBy: 'Laura Mitchell (CISO)',
          approvedAt: '2026-01-08T00:00:00Z',
          expiresAt: null,
        },
      ],
      lastTargetedAt: null,
      inActiveCampaign: false,
    },
    {
      id: 'target_noah_015',
      name: 'Noah Fischer',
      email: 'noah.fischer@company.com',
      phone: '+1-555-0194',
      department: 'Sales',
      role: 'Account Executive',
      consent: 'missing',
      consentSignedAt: null,
      consentExpiresAt: null,
      resilience: null,
      campaigns: [],
      exemptions: [
        {
          type: 'occupational',
          reason: 'New employee — first 30 days',
          approvedBy: 'Laura Mitchell (CISO)',
          approvedAt: '2026-08-25T00:00:00Z',
          expiresAt: '2026-09-24T00:00:00Z',
        },
      ],
      lastTargetedAt: null,
      inActiveCampaign: false,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Fetch + helpers                                                     */
/* ------------------------------------------------------------------ */

async function fetchTargets(): Promise<TargetsData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/v1/organizations/me/targets', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as TargetsData;
  } finally {
    clearTimeout(timer);
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
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

const dangerIconButton =
  'inline-flex items-center justify-center rounded-lg border border-[#3D4860] p-2 text-slate-300 ' +
  'hover:bg-red-500/10 hover:border-red-500/50 hover:text-[#FF4757] transition-colors ' +
  'duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ' +
  'disabled:hover:border-[#3D4860] disabled:hover:text-slate-300';

const th = 'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 bg-[#232D39]';
const td = 'px-4 py-3 text-sm text-slate-200 border-t border-[#252D38]';

/* ------------------------------------------------------------------ */
/* Shared components                                                   */
/* ------------------------------------------------------------------ */

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

/** Mini bar for the cumulative resistance score — gray when never targeted. */
function ResilienceBar({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex items-center gap-2" title="No campaigns yet">
        <div className="w-16 h-1.5 rounded-full bg-[#232D39]" aria-hidden="true" />
        <span className="text-xs text-slate-600">—</span>
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-2"
      title={`Cumulative resistance score ${score.toFixed(2)} — lower is safer`}
    >
      <div
        className="w-16 h-1.5 rounded-full bg-[#232D39] overflow-hidden"
        role="img"
        aria-label={`Resistance score ${score.toFixed(2)} of 1`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.round(score * 100)}%`, backgroundColor: resistanceColor(score) }}
        />
      </div>
      <span className="text-xs font-mono text-slate-300">{score.toFixed(2)}</span>
    </div>
  );
}

/** Shared dialog chrome — same pattern as the Reports preview dialog. */
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
/* CSV import                                                          */
/* ------------------------------------------------------------------ */

const CSV_FIELD_OPTIONS: { value: CsvField; label: string }[] = [
  { value: 'name', label: 'Full name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'department', label: 'Department' },
  { value: 'role', label: 'Role' },
  { value: 'ignore', label: 'Ignore this column' },
];

const SAMPLE_CSV =
  'name,email,phone,department,role\n' +
  'Ayesha Khan,ayesha.khan@company.com,+1-555-0182,Operations,Coordinator\n' +
  'Viktor Petrov,viktor.petrov@company.com,,Engineering,Engineer\n' +
  'Lena Fischer,lena.fischer@company.com,+1-555-0193,Finance,Analyst\n';

/** Minimal CSV parser — handles quoted fields with embedded commas/quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

interface CsvState {
  fileName: string;
  headers: string[];
  rows: string[][];
  mapping: Record<number, CsvField>;
}

function csvRowsToTargets(csv: CsvState): NewTargetRow[] {
  const indexOf = (field: CsvField) => csv.headers.findIndex((_, i) => csv.mapping[i] === field);
  const nameI = indexOf('name');
  const emailI = indexOf('email');
  const phoneI = indexOf('phone');
  const deptI = indexOf('department');
  const roleI = indexOf('role');
  if (nameI === -1 || emailI === -1) return [];
  return csv.rows
    .map((r) => ({
      name: (r[nameI] ?? '').trim(),
      email: (r[emailI] ?? '').trim().toLowerCase(),
      phone: phoneI >= 0 ? (r[phoneI] ?? '').trim() || null : null,
      department: deptI >= 0 ? (r[deptI] ?? '').trim() || 'Other' : 'Other',
      role: roleI >= 0 ? (r[roleI] ?? '').trim() || 'Other' : 'Other',
    }))
    .filter((r) => r.name !== '' && r.email.includes('@'));
}

/** Add Targets dialog — manual entry with staging list, or CSV import. */
function AddTargetsDialog({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (rows: NewTargetRow[]) => void;
  submitting: boolean;
}) {
  const [tab, setTab] = useState<'manual' | 'csv'>('manual');
  const [formError, setFormError] = useState<string | null>(null);

  // Manual entry state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [role, setRole] = useState(ROLES[0]);
  const [staging, setStaging] = useState<NewTargetRow[]>([]);

  // CSV state
  const [csv, setCsv] = useState<CsvState | null>(null);
  const [dragActive, setDragActive] = useState(false);

  function stageRow(): void {
    if (!name.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setFormError('A valid email address is required.');
      return;
    }
    setStaging((prev) => [
      ...prev,
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        department,
        role,
      },
    ]);
    setName('');
    setEmail('');
    setPhone('');
    setFormError(null);
  }

  function applyCsvText(fileName: string, text: string): void {
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      setFormError('The CSV file has no data rows.');
      return;
    }
    const headers = parsed[0].map((h) => h.trim());
    const mapping: Record<number, CsvField> = {};
    headers.forEach((h, i) => {
      const key = h.toLowerCase();
      if (key.includes('name')) mapping[i] = 'name';
      else if (key.includes('mail')) mapping[i] = 'email';
      else if (key.includes('phone') || key.includes('mobile')) mapping[i] = 'phone';
      else if (key.includes('depart')) mapping[i] = 'department';
      else if (key.includes('role') || key.includes('title')) mapping[i] = 'role';
      else mapping[i] = 'ignore';
    });
    setCsv({ fileName, headers, rows: parsed.slice(1), mapping });
    setFormError(null);
  }

  const csvTargets = csv ? csvRowsToTargets(csv) : [];
  const submitLabel =
    tab === 'manual'
      ? staging.length === 1
        ? 'Add 1 Target'
        : `Add ${staging.length} Targets`
      : csvTargets.length === 1
        ? 'Import 1 Target'
        : `Import ${csvTargets.length} Targets`;
  const submitCount = tab === 'manual' ? staging.length : csvTargets.length;

  const footer = (
    <>
      <button type="button" className={secondaryButton} onClick={onClose} disabled={submitting}>
        Cancel
      </button>
      <button
        type="button"
        className={primaryButton}
        disabled={submitCount === 0 || submitting}
        onClick={() => onSubmit(tab === 'manual' ? staging : csvTargets)}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Adding…
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            {submitLabel}
          </>
        )}
      </button>
    </>
  );

  return (
    <DialogShell
      titleId="add-targets-title"
      title="Add Targets"
      subtitle="New targets start with consent status Missing — upload consent forms before campaigns launch."
      onClose={onClose}
      footer={footer}
      wide
    >
      {/* Tabs */}
      <div
        className="flex gap-1.5 p-1 rounded-lg bg-[#15191F] border border-[#2D3748] mb-5"
        role="tablist"
        aria-label="Add targets method"
      >
        {(
          [
            { key: 'manual', label: 'Manual Entry', icon: UserPlus },
            { key: 'csv', label: 'CSV Import', icon: FileSpreadsheet },
          ] as const
        ).map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                active ? 'bg-[#2FD9C7]/10 text-[#2FD9C7]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'manual' && (
        <div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-target-name" className={label}>
                Full name
              </label>
              <input
                id="add-target-name"
                className={input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label htmlFor="add-target-email" className={label}>
                Email
              </label>
              <input
                id="add-target-email"
                type="email"
                className={input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@company.com"
              />
            </div>
            <div>
              <label htmlFor="add-target-phone" className={label}>
                Phone (optional)
              </label>
              <input
                id="add-target-phone"
                className={input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-0123"
              />
            </div>
            <div>
              <label htmlFor="add-target-department" className={label}>
                Department
              </label>
              <select
                id="add-target-department"
                className={input}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="add-target-role" className={label}>
                Role
              </label>
              <select
                id="add-target-role"
                className={input}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between gap-3">
              <p className={formError ? 'text-xs text-[#FF4757]' : 'text-xs text-slate-500'}>
                {formError ??
                  'Every target must have a signed consent form on file before campaigns launch.'}
              </p>
              <button type="button" className={secondaryButton} onClick={stageRow}>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add to List
              </button>
            </div>
          </div>

          {staging.length > 0 ? (
            <div className="mt-5 border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr>
                    <th className={th}>Name</th>
                    <th className={th}>Email</th>
                    <th className={th}>Department</th>
                    <th className={th}>Role</th>
                    <th className={`${th} w-12`}>
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staging.map((row, i) => (
                    <tr key={`${row.email}-${i}`}>
                      <td className={`${td} font-medium text-white`}>{row.name}</td>
                      <td className={`${td} font-mono text-xs`}>{row.email}</td>
                      <td className={td}>{row.department}</td>
                      <td className={td}>{row.role}</td>
                      <td className={td}>
                        <button
                          type="button"
                          onClick={() => setStaging((prev) => prev.filter((_, j) => j !== i))}
                          className="text-slate-500 hover:text-[#FF4757] transition-colors"
                          aria-label={`Remove ${row.name} from list`}
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-xs text-slate-500 text-center border border-dashed border-[#2D3748] rounded-xl py-4">
              No targets staged yet — fill the form above and press Add to List.
            </p>
          )}
        </div>
      )}

      {tab === 'csv' && (
        <div>
          {!csv ? (
            <>
              <label
                htmlFor="add-targets-csv"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) file.text().then((text) => applyCsvText(file.name, text));
                }}
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-10 px-4 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-[#2FD9C7] bg-[#2FD9C7]/5'
                    : 'border-[#2D3748] hover:border-[#2FD9C7]/50'
                }`}
              >
                <Upload className="w-8 h-8 text-slate-500" aria-hidden="true" />
                <span className="text-sm text-slate-400">Drop CSV here or click to browse</span>
                <span className="text-xs text-slate-500 mt-1">
                  Required columns: name, email, phone, department, role
                </span>
                <input
                  id="add-targets-csv"
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) file.text().then((text) => applyCsvText(file.name, text));
                  }}
                />
              </label>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-[#FF4757]">{formError}</p>
                <button
                  type="button"
                  className="text-xs text-[#2FD9C7] hover:underline"
                  onClick={() => applyCsvText('sample-targets.csv', SAMPLE_CSV)}
                >
                  Load sample data
                </button>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{csv.fileName}</div>
                  <div className="text-xs text-slate-500">
                    {csv.rows.length} rows · {csvTargets.length} valid targets
                  </div>
                </div>
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => setCsv(null)}
                  disabled={submitting}
                >
                  Replace File
                </button>
              </div>

              {/* Column mapping */}
              <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto mb-4">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr>
                      <th className={th}>CSV column</th>
                      <th className={th}>Maps to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csv.headers.map((header, i) => (
                      <tr key={`${header}-${i}`}>
                        <td className={`${td} font-mono text-xs`}>{header || `Column ${i + 1}`}</td>
                        <td className={td}>
                          <select
                            className={select}
                            value={csv.mapping[i]}
                            onChange={(e) =>
                              setCsv((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      mapping: { ...prev.mapping, [i]: e.target.value as CsvField },
                                    }
                                  : prev,
                              )
                            }
                            aria-label={`Map column ${header || i + 1}`}
                          >
                            {CSV_FIELD_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Preview */}
              <p className="text-xs text-slate-500 mb-2">Preview — first 5 rows</p>
              <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr>
                      {csv.headers.map((header, i) => (
                        <th key={`${header}-${i}`} className={th}>
                          {header || `Column ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csv.rows.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className={`${td} text-xs text-slate-300 max-w-[160px] truncate`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(csvTargets.length === 0 ||
                !csv.headers.some((_, i) => csv.mapping[i] === 'name') ||
                !csv.headers.some((_, i) => csv.mapping[i] === 'email')) && (
                <p className="text-xs text-[#FF4757] mt-3">
                  Map a column to Full name and one to Email — rows without both are skipped.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </DialogShell>
  );
}

/* ------------------------------------------------------------------ */
/* Action dialogs                                                      */
/* ------------------------------------------------------------------ */

/** Edit a target's directory details. */
function EditTargetDialog({
  target,
  onClose,
  onSave,
  saving,
}: {
  target: TargetRecord;
  onClose: () => void;
  onSave: (patch: { name: string; email: string; phone: string | null; department: string; role: string }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(target.name);
  const [email, setEmail] = useState(target.email);
  const [phone, setPhone] = useState(target.phone ?? '');
  const [department, setDepartment] = useState(target.department);
  const [role, setRole] = useState(target.role);
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
      titleId="edit-target-title"
      title="Edit Target"
      subtitle={`${target.email} · ${target.campaigns.length} campaign${target.campaigns.length === 1 ? '' : 's'} on record`}
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
          <label htmlFor="edit-target-name" className={label}>
            Full name
          </label>
          <input
            id="edit-target-name"
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="edit-target-email" className={label}>
            Email
          </label>
          <input
            id="edit-target-email"
            type="email"
            className={input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="edit-target-phone" className={label}>
            Phone
          </label>
          <input
            id="edit-target-phone"
            className={input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="—"
          />
        </div>
        <div>
          <label htmlFor="edit-target-department" className={label}>
            Department
          </label>
          <select
            id="edit-target-department"
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
          <label htmlFor="edit-target-role" className={label}>
            Job title
          </label>
          <input
            id="edit-target-role"
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
  target,
  onClose,
  onUpload,
  uploading,
}: {
  target: TargetRecord;
  onClose: () => void;
  onUpload: (signedAt: string, expiresAt: string, file: File | null) => void;
  uploading: boolean;
}) {
  const [signedOn, setSignedOn] = useState(new Date().toISOString().slice(0, 10));
  const [expiresOn, setExpiresOn] = useState(
    new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10),
  );
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function upload(): void {
    if (!signedOn) {
      setError('Pick the date the consent form was signed.');
      return;
    }
    if (!expiresOn || new Date(expiresOn) <= new Date(signedOn)) {
      setError('The expiry date must come after the signed date.');
      return;
    }
    setError(null);
    onUpload(
      new Date(`${signedOn}T00:00:00Z`).toISOString(),
      new Date(`${expiresOn}T00:00:00Z`).toISOString(),
      file,
    );
  }

  return (
    <DialogShell
      titleId="upload-consent-title"
      title="Upload Consent"
      subtitle={`${target.name} · ${target.email}`}
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
        <ConsentBadge status={target.consent} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
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
        <div>
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
function ExemptionDialog({
  target,
  onClose,
  onAdd,
  adding,
}: {
  target: TargetRecord;
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
      subtitle={`${target.name} · ${target.email}`}
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
      {target.exemptions.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Current exemptions
          </p>
          <div className="space-y-2">
            {target.exemptions.map((ex, i) => (
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
  target,
  onClose,
  onConfirm,
  submitting,
}: {
  target: TargetRecord;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  return (
    <DialogShell
      titleId="remove-target-title"
      title="Remove Target"
      subtitle={`${target.name} · ${target.email}`}
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
            disabled={submitting || target.inActiveCampaign}
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
      {target.inActiveCampaign ? (
        <div className="flex gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
          <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" aria-hidden="true" />
          <p className="text-xs text-slate-300">
            {target.name} is currently in an active campaign and cannot be removed. Halt or complete
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
              {initials(target.name)}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{target.name}</div>
              <div className="text-xs text-slate-400">
                {target.role} · {target.department}
              </div>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-4">
            <AlertTriangle className="w-5 h-5 text-[#FF4757] shrink-0" aria-hidden="true" />
            <p className="text-xs text-slate-300">
              This permanently removes {target.name} from the target pool. The removal is written to
              the immutable audit chain.
            </p>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
            <li>Consent record (C4) is archived for Employment + 5 years.</li>
            <li>Transcripts and media (C3) are purged at the end of the retention window.</li>
            <li>Campaign history is anonymized into aggregate AAR metrics.</li>
          </ul>
        </>
      )}
    </DialogShell>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const CONSENT_FILTERS: { value: ConsentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'on_file', label: 'On File' },
  { value: 'missing', label: 'Missing' },
  { value: 'exempted', label: 'Exempted' },
  { value: 'expired', label: 'Expired' },
];

/** Maps a consent status to its key in the totals breakdown. */
const consentBreakdownKey: Record<ConsentStatus, 'onFile' | 'exempted' | 'missing' | 'expired'> = {
  on_file: 'onFile',
  missing: 'missing',
  exempted: 'exempted',
  expired: 'expired',
};

export default function Targets() {
  const [data, setData] = useState<TargetsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [consentFilter, setConsentFilter] = useState<ConsentStatus | 'all'>('all');

  // Dialog state — only one dialog is open at a time
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TargetRecord | null>(null);
  const [consentTarget, setConsentTarget] = useState<TargetRecord | null>(null);
  const [exemptionTarget, setExemptionTarget] = useState<TargetRecord | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TargetRecord | null>(null);
  const [busy, setBusy] = useState(false);

  // Campaign-history popover — rendered at the page root with fixed
  // coordinates so the table's overflow-x-auto wrapper cannot clip it.
  const [popoverTarget, setPopoverTarget] = useState<TargetRecord | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    let cancelled = false;
    fetchTargets()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(DEMO_DATA);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The popover uses viewport coordinates — close it on scroll or resize so
  // it never detaches from its row.
  useEffect(() => {
    if (!popoverTarget) return;
    const close = () => setPopoverTarget(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [popoverTarget]);

  /** Send a write request; when the API is unreachable (demo mode) the local
   *  state below remains the source of truth. */
  async function mutate(path: string, init: { method: string; body?: BodyInit | null }): Promise<void> {
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

  /** Apply a consent-status transition to the totals (breakdown + coverage). */
  function shiftConsent(
    totals: TargetsData['totals'],
    from: ConsentStatus,
    to: ConsentStatus,
  ): TargetsData['totals'] {
    const breakdown = { ...totals.consentBreakdown };
    const fromKey = consentBreakdownKey[from];
    const toKey = consentBreakdownKey[to];
    breakdown[fromKey] = Math.max(0, breakdown[fromKey] - 1);
    breakdown[toKey] += 1;
    return {
      ...totals,
      consentBreakdown: breakdown,
      consentCoverage: (breakdown.onFile + breakdown.exempted) / Math.max(1, totals.employees),
    };
  }

  async function handleAddTargets(rows: NewTargetRow[]): Promise<void> {
    await mutate('/api/v1/organizations/me/targets', {
      method: 'POST',
      body: JSON.stringify({ targets: rows }),
    });
    setData((prev) => {
      if (!prev) return prev;
      const stamp = Date.now();
      const added: TargetRecord[] = rows.map((row, i) => ({
        id: `target_new_${stamp}_${i}`,
        ...row,
        consent: 'missing',
        consentSignedAt: null,
        consentExpiresAt: null,
        resilience: null,
        campaigns: [],
        exemptions: [],
        lastTargetedAt: null,
        inActiveCampaign: false,
      }));
      const employees = prev.totals.employees + rows.length;
      const breakdown = {
        ...prev.totals.consentBreakdown,
        missing: prev.totals.consentBreakdown.missing + rows.length,
      };
      return {
        totals: {
          ...prev.totals,
          employees,
          consentBreakdown: breakdown,
          consentCoverage: (breakdown.onFile + breakdown.exempted) / employees,
        },
        targets: [...prev.targets, ...added],
      };
    });
    setAddOpen(false);
  }

  async function handleSaveTarget(
    target: TargetRecord,
    patch: { name: string; email: string; phone: string | null; department: string; role: string },
  ): Promise<void> {
    await mutate(`/api/v1/organizations/me/targets/${target.id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    setData((prev) =>
      prev
        ? {
            ...prev,
            targets: prev.targets.map((t) => (t.id === target.id ? { ...t, ...patch } : t)),
          }
        : prev,
    );
    setEditTarget(null);
  }

  async function handleConsentUpload(
    target: TargetRecord,
    signedAt: string,
    expiresAt: string,
    file: File | null,
  ): Promise<void> {
    const path = `/api/v1/organizations/me/targets/${target.id}/consent`;
    if (file) {
      const form = new FormData();
      form.append('file', file);
      form.append('signedAt', signedAt);
      form.append('expiresAt', expiresAt);
      await mutate(path, { method: 'POST', body: form });
    } else {
      await mutate(path, { method: 'POST', body: JSON.stringify({ signedAt, expiresAt }) });
    }
    setData((prev) => {
      if (!prev) return prev;
      return {
        totals: shiftConsent(prev.totals, target.consent, 'on_file'),
        targets: prev.targets.map((t) =>
          t.id === target.id
            ? { ...t, consent: 'on_file' as ConsentStatus, consentSignedAt: signedAt, consentExpiresAt: expiresAt }
            : t,
        ),
      };
    });
    setConsentTarget(null);
  }

  async function handleAddExemption(target: TargetRecord, exemption: Exemption): Promise<void> {
    await mutate(`/api/v1/organizations/me/targets/${target.id}/exemptions`, {
      method: 'POST',
      body: JSON.stringify(exemption),
    });
    setData((prev) => {
      if (!prev) return prev;
      return {
        totals: { ...prev.totals, exemptionsActive: prev.totals.exemptionsActive + 1 },
        targets: prev.targets.map((t) =>
          t.id === target.id ? { ...t, exemptions: [...t.exemptions, exemption] } : t,
        ),
      };
    });
    setExemptionTarget(null);
  }

  async function handleRemoveTarget(target: TargetRecord): Promise<void> {
    await mutate(`/api/v1/organizations/me/targets/${target.id}`, { method: 'DELETE' });
    setData((prev) => {
      if (!prev) return prev;
      const breakdown = { ...prev.totals.consentBreakdown };
      const key = consentBreakdownKey[target.consent];
      breakdown[key] = Math.max(0, breakdown[key] - 1);
      const employees = Math.max(1, prev.totals.employees - 1);
      return {
        totals: {
          ...prev.totals,
          employees,
          exemptionsActive: Math.max(0, prev.totals.exemptionsActive - target.exemptions.length),
          consentBreakdown: breakdown,
          consentCoverage: (breakdown.onFile + breakdown.exempted) / employees,
        },
        targets: prev.targets.filter((t) => t.id !== target.id),
      };
    });
    setRemoveTarget(null);
    setPopoverTarget(null);
  }

  function openPopover(target: TargetRecord, button: HTMLButtonElement): void {
    const rect = button.getBoundingClientRect();
    setPopoverPos({ top: rect.bottom + 8, left: rect.left });
    setPopoverTarget(target);
  }

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2FD9C7]" aria-hidden="true" />
          <p className="text-sm text-slate-400">Loading targets…</p>
        </div>
      </div>
    );
  }

  const totals = data.totals;
  const breakdown = totals.consentBreakdown;
  const covered = breakdown.onFile + breakdown.exempted;
  const filtered = data.targets.filter((t) => {
    const q = query.trim().toLowerCase();
    if (q && !t.name.toLowerCase().includes(q) && !t.email.toLowerCase().includes(q)) return false;
    if (departmentFilter !== 'all' && t.department !== departmentFilter) return false;
    if (consentFilter !== 'all' && t.consent !== consentFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Targets</h1>
          <p className="text-sm text-slate-400 mt-1">
            Employee directory used for simulation targeting — consent and exemptions govern eligibility.
          </p>
        </div>
        <button type="button" className={primaryButton} onClick={() => setAddOpen(true)}>
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Add Targets
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard>
          <div className="text-4xl font-black text-white">{totals.employees}</div>
          <div className="text-sm text-slate-400 mt-1">Target Pool</div>
          <div className="text-xs text-slate-500 mt-1.5">Synced from the HR directory</div>
        </KpiCard>
        <KpiCard>
          <div className="text-4xl font-black text-white">{Math.round(totals.consentCoverage * 100)}%</div>
          <div className="text-sm text-slate-400 mt-1">Consent Coverage</div>
          <SplitBar
            segments={[
              { value: breakdown.onFile, color: '#06D369' },
              { value: breakdown.exempted, color: '#A78BFA' },
              { value: breakdown.expired, color: '#F59E0B' },
              { value: breakdown.missing, color: '#FF4757' },
            ]}
          />
          <div className="text-xs text-slate-500 mt-1.5">
            {covered} of {totals.employees} employees covered
          </div>
        </KpiCard>
        <KpiCard>
          <div className="text-4xl font-black text-white">{totals.exemptionsActive}</div>
          <div className="text-sm text-slate-400 mt-1">Active Exemptions</div>
          <div className="text-xs text-slate-500 mt-1.5">CISO-approved exclusions from campaigns</div>
        </KpiCard>
        <KpiCard>
          <div className="text-4xl font-black text-white">{totals.avgResistance.toFixed(2)}</div>
          <div className="text-sm text-slate-400 mt-1">Avg Resistance</div>
          <div className="text-xs text-slate-500 mt-1.5">Org-wide cumulative score — lower is safer</div>
        </KpiCard>
      </div>

      {/* Targets table */}
      <section className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              aria-hidden="true"
            />
            <input
              className={`${select} w-full pl-9`}
              placeholder="Search by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search targets by name or email"
            />
          </div>
          <select
            className={select}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label="Filter by department"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by consent status">
            {CONSENT_FILTERS.map((f) => {
              const active = consentFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setConsentFilter(f.value)}
                  aria-pressed={active}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                    active ? 'bg-[#2FD9C7] text-[#0F1219]' : 'bg-[#232D39] text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3" aria-live="polite">
          Showing {filtered.length} of {data.targets.length} targets
        </p>

        <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead>
              <tr>
                <th className={th}>Employee</th>
                <th className={th}>Department</th>
                <th className={th}>Role</th>
                <th className={th}>Consent</th>
                <th className={th}>Campaigns</th>
                <th className={th}>Resilience</th>
                <th className={th}>Exemptions</th>
                <th className={th}>Last Targeted</th>
                <th className={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-full bg-[#232D39] border border-[#2D3748] flex items-center justify-center text-[11px] font-bold text-slate-300 shrink-0"
                        aria-hidden="true"
                      >
                        {initials(t.name)}
                      </span>
                      <div className="min-w-0">
                        <Link
                          to={`/targets/${t.id}`}
                          className="text-sm font-medium text-white hover:text-[#2FD9C7] transition-colors"
                        >
                          {t.name}
                        </Link>
                        <div className="text-xs text-slate-500 truncate">{t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={td}>{t.department}</td>
                  <td className={td}>{t.role}</td>
                  <td className={td}>
                    <ConsentBadge status={t.consent} />
                  </td>
                  <td className={td}>
                    {t.campaigns.length === 0 ? (
                      <span className="text-xs text-slate-600">—</span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => openPopover(t, e.currentTarget)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#3D4860] px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-[#2FD9C7]/50 hover:text-[#2FD9C7] transition-colors"
                        aria-label={`Show campaign history for ${t.name}`}
                        aria-expanded={popoverTarget?.id === t.id}
                      >
                        {t.campaigns.length}
                        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                  <td className={td}>
                    <ResilienceBar score={t.resilience} />
                  </td>
                  <td className={td}>
                    {t.exemptions.length === 0 ? (
                      <span className="text-xs text-slate-600">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {t.exemptions.map((ex, i) => (
                          <ExemptionBadge key={`${ex.type}-${i}`} exemption={ex} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className={td}>
                    {t.lastTargetedAt ? (
                      <span className="text-xs text-slate-300">{formatDate(t.lastTargetedAt)}</span>
                    ) : (
                      <span className="text-xs text-slate-600">Never</span>
                    )}
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/targets/${t.id}`}
                        className={iconButton}
                        aria-label={`View ${t.name}'s profile`}
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => setEditTarget(t)}
                        aria-label={`Edit ${t.name}`}
                      >
                        <Edit3 className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => setConsentTarget(t)}
                        aria-label={`Upload consent for ${t.name}`}
                      >
                        <FileText className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => setExemptionTarget(t)}
                        aria-label={`Add exemption for ${t.name}`}
                      >
                        <Ban className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={dangerIconButton}
                        onClick={() => setRemoveTarget(t)}
                        disabled={t.inActiveCampaign}
                        title={t.inActiveCampaign ? 'Blocked — target is in an active campaign' : undefined}
                        aria-label={`Remove ${t.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className={td} colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Search className="w-8 h-8 text-slate-600 mb-3" aria-hidden="true" />
                      <p className="text-sm font-medium text-white">No targets match your filters</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try a different search term, or clear the department and consent filters.
                      </p>
                      <button
                        type="button"
                        className={`${secondaryButton} mt-4`}
                        onClick={() => {
                          setQuery('');
                          setDepartmentFilter('all');
                          setConsentFilter('all');
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Targets sync from the HR directory · removal is blocked while a target is in an active
          campaign · every consent change is recorded in the audit chain.
        </p>
      </section>

      {/* Campaign history popover — fixed so the table wrapper cannot clip it */}
      {popoverTarget && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setPopoverTarget(null)}
            aria-hidden="true"
          />
          <div
            className="fixed z-[70] w-80 rounded-xl border border-[#2D3748] bg-[#1D232D] shadow-lg"
            style={{
              top: Math.min(popoverPos.top, window.innerHeight - 280),
              left: Math.max(12, Math.min(popoverPos.left, window.innerWidth - 336)),
            }}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#252D38]">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{popoverTarget.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Campaign history</div>
              </div>
              <button
                type="button"
                onClick={() => setPopoverTarget(null)}
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Close campaign history"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {popoverTarget.campaigns.length === 0 ? (
                <p className="text-xs text-slate-500 px-1 py-2">
                  No campaigns yet — this target has never been selected.
                </p>
              ) : (
                popoverTarget.campaigns.map((c) => {
                  const meta = campaignStatusMeta[c.status];
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#2D3748] bg-[#15191F] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/campaigns/${c.id}`}
                          className="block text-xs font-medium text-white hover:text-[#2FD9C7] transition-colors truncate"
                        >
                          {c.name}
                        </Link>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Tier {c.tier} · {formatDate(c.date)}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Dialogs */}
      {addOpen && (
        <AddTargetsDialog
          onClose={() => setAddOpen(false)}
          onSubmit={handleAddTargets}
          submitting={busy}
        />
      )}
      {editTarget && (
        <EditTargetDialog
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(patch) => handleSaveTarget(editTarget, patch)}
          saving={busy}
        />
      )}
      {consentTarget && (
        <UploadConsentDialog
          target={consentTarget}
          onClose={() => setConsentTarget(null)}
          onUpload={(signedAt, expiresAt, file) =>
            handleConsentUpload(consentTarget, signedAt, expiresAt, file)
          }
          uploading={busy}
        />
      )}
      {exemptionTarget && (
        <ExemptionDialog
          target={exemptionTarget}
          onClose={() => setExemptionTarget(null)}
          onAdd={(exemption) => handleAddExemption(exemptionTarget, exemption)}
          adding={busy}
        />
      )}
      {removeTarget && (
        <RemoveTargetDialog
          target={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={() => handleRemoveTarget(removeTarget)}
          submitting={busy}
        />
      )}
    </div>
  );
}
