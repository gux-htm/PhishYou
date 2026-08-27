/**
 * PhishYou — Settings (`/settings`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 16: Organization Settings
 *       (General / Compliance & Legal / Team & Roles / Notification
 *       Preferences / Billing & Usage) + PHISHYOU_SPECS/12_COMPLIANCE/
 *       DATA_PROTECTION.md §3 (retention), §6 (access control) and
 *       COMPLIANCE_CHECKLIST.md §7 (Pakistan considerations).
 *
 * Settings hub with an in-page section nav — Platform Integrations lives at
 * /settings/integrations and is linked from the nav:
 * - General: tenant defaults — name, locked domain, default tier/language,
 *   debrief reminder window.
 * - Compliance & Legal: per-data-type retention policy (DATA_PROTECTION §3),
 *   jurisdiction toggles, DPA and legal-review document uploads, compliance
 *   package export, and the Pakistan operations note.
 * - Team & Roles: role capability matrix (API scopes + data classes) with a
 *   link to team management.
 * - Notifications: in-app/email switches and thresholds for the nine
 *   platform event types.
 * - Billing & Usage: plan, consumption meters and invoice history.
 *
 * Data: GET/PUT /api/v1/organizations/me/settings. Falls back to embedded
 * demo data when the API is unreachable so the page renders correctly
 * without a running backend.
 */
import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Lock,
  Plug,
  Scale,
  Save,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldOff,
  ShieldX,
  Upload,
  Users,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Tier = 'A' | 'B' | 'C';
type Language = 'en' | 'ur';
type SectionKey = 'general' | 'compliance' | 'team' | 'notifications' | 'billing';
type DocId = 'dpa' | 'legalReview';

interface GeneralSettings {
  organizationName: string;
  domain: string; // read-only — locked at domain verification
  defaultTier: Tier;
  defaultLanguage: Language;
  debriefWindowHours: number;
}

interface RetentionRow {
  id: string;
  dataType: string;
  classification: 'C2' | 'C3' | 'C4';
  retention: string;
  options: string[];
  locked: boolean; // audit chain is immutable
  then: string; // what happens after retention
}

interface Jurisdiction {
  id: string;
  name: string;
  region: string;
  enabled: boolean;
  note: string;
}

interface LegalDocument {
  id: DocId;
  title: string;
  description: string;
  fileName: string | null;
  uploadedAt: string | null; // ISO
}

interface NotificationPref {
  id: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
  threshold?: {
    kind: 'harmScore' | 'daysBefore';
    value: number;
  };
}

interface UsageMetric {
  id: string;
  label: string;
  note: string;
  used: number;
  limit: number;
  format: 'count' | 'tokens';
}

interface Invoice {
  id: string;
  period: string;
  date: string; // ISO
  amount: string;
  status: 'paid' | 'due';
}

interface SettingsData {
  general: GeneralSettings;
  retention: RetentionRow[];
  jurisdictions: Jurisdiction[];
  legal: Record<DocId, LegalDocument>;
  notifications: NotificationPref[];
  billing: {
    plan: string;
    billingEmail: string;
    renewalDate: string; // ISO
    metrics: UsageMetric[];
    invoices: Invoice[];
  };
}

/* ------------------------------------------------------------------ */
/* Roles & permissions (API_CONTRACTS §6.2 + DATA_PROTECTION §6)        */
/* ------------------------------------------------------------------ */

const ROLES = [
  { id: 'ciso', name: 'CISO' },
  { id: 'manager', name: 'Security Manager' },
  { id: 'analyst', name: 'Security Analyst' },
  { id: 'hr', name: 'HR / Debrief' },
  { id: 'auditor', name: 'Auditor' },
] as const;

type RoleId = (typeof ROLES)[number]['id'];

const PERMISSIONS: { label: string; scope: string; allowed: RoleId[] }[] = [
  { label: 'View dashboards & analytics', scope: 'analytics:read', allowed: ['ciso', 'manager', 'analyst', 'hr', 'auditor'] },
  { label: 'Create & configure campaigns', scope: 'campaigns:create', allowed: ['ciso', 'manager'] },
  { label: 'Halt or pause campaigns', scope: 'campaigns:stop', allowed: ['ciso', 'manager', 'analyst'] },
  { label: 'Download After-Action Reports', scope: 'analytics:aar', allowed: ['ciso', 'manager', 'analyst', 'auditor'] },
  { label: 'Export threat intelligence', scope: 'analytics:export', allowed: ['ciso', 'manager'] },
  { label: 'Access target PII & transcripts', scope: 'C3 — confidential', allowed: ['ciso', 'manager'] },
  { label: 'Access audit logs', scope: 'audit:read', allowed: ['ciso', 'manager', 'auditor'] },
  { label: 'Conduct debriefs & manage consent', scope: 'C4 — restricted', allowed: ['ciso', 'manager', 'hr'] },
  { label: 'Manage organization settings', scope: 'org:admin', allowed: ['ciso'] },
  { label: 'Manage team members & billing', scope: 'org:admin', allowed: ['ciso'] },
];

const ROLE_DESCRIPTIONS: { id: RoleId; name: string; description: string }[] = [
  { id: 'ciso', name: 'CISO', description: 'Accountable owner — full access, attestation signer, Tier A approvals.' },
  { id: 'manager', name: 'Security Manager', description: 'Runs the simulation program — creates, halts and reviews campaigns.' },
  { id: 'analyst', name: 'Security Analyst', description: 'Monitors live campaigns and analyzes After-Action Reports.' },
  { id: 'hr', name: 'HR / Debrief Officer', description: 'Owns debriefs, wellbeing follow-up and consent records.' },
  { id: 'auditor', name: 'Auditor', description: 'Read-only — verifies the audit chain and exports evidence.' },
];

/* ------------------------------------------------------------------ */
/* Notification meta (icons match the AppShell notification types)      */
/* ------------------------------------------------------------------ */

const notifMeta: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  harm_detected: { icon: AlertTriangle, color: '#FF4757', bg: 'bg-red-500/10' },
  target_compromised: { icon: ShieldX, color: '#FF4757', bg: 'bg-red-500/15' },
  target_blocked: { icon: ShieldOff, color: '#A78BFA', bg: 'bg-purple-400/10' },
  campaign_completed: { icon: CheckCircle2, color: '#06D369', bg: 'bg-green-400/10' },
  debrief_overdue: { icon: Clock, color: '#F59E0B', bg: 'bg-amber-400/10' },
  consent_expiring: { icon: CalendarClock, color: '#5B9EFF', bg: 'bg-blue-500/10' },
  audit_failure: { icon: ShieldAlert, color: '#FF4757', bg: 'bg-red-500/10' },
  tier_a_activity: { icon: Zap, color: '#F59E0B', bg: 'bg-amber-400/10' },
  policy_gap: { icon: AlertCircle, color: '#5B9EFF', bg: 'bg-blue-500/10' },
};

/* ------------------------------------------------------------------ */
/* Demo data (used when API unreachable)                               */
/* ------------------------------------------------------------------ */

const DEMO_DATA: SettingsData = {
  general: {
    organizationName: 'Meridian Financial Group',
    domain: 'company.com',
    defaultTier: 'B',
    defaultLanguage: 'en',
    debriefWindowHours: 24,
  },
  retention: [
    {
      id: 'transcripts',
      dataType: 'Message transcripts & media',
      classification: 'C3',
      retention: '90 days',
      options: ['30 days', '90 days', '180 days'],
      locked: false,
      then: 'Irrecoverably purged',
    },
    {
      id: 'voice',
      dataType: 'Voice recordings',
      classification: 'C3',
      retention: '90 days',
      options: ['30 days', '90 days', '180 days'],
      locked: false,
      then: 'Irrecoverably purged',
    },
    {
      id: 'metrics',
      dataType: 'Behavioral metrics & scores',
      classification: 'C3',
      retention: '2 years',
      options: ['1 year', '2 years', '3 years'],
      locked: false,
      then: 'Anonymized into aggregates',
    },
    {
      id: 'aar',
      dataType: 'AAR documents',
      classification: 'C2',
      retention: '3 years',
      options: ['2 years', '3 years', '5 years'],
      locked: false,
      then: 'Archived, then purged',
    },
    {
      id: 'consent',
      dataType: 'Consent records',
      classification: 'C4',
      retention: 'Employment + 5 years',
      options: ['Employment + 3 years', 'Employment + 5 years', 'Employment + 7 years'],
      locked: false,
      then: 'Legal archive',
    },
    {
      id: 'audit',
      dataType: 'Audit log chain',
      classification: 'C4',
      retention: '7 years',
      options: ['7 years'],
      locked: true,
      then: 'Immutable — redacted payloads beyond retention',
    },
  ],
  jurisdictions: [
    { id: 'gdpr', name: 'GDPR', region: 'EU / EEA', enabled: true, note: 'DPA on file · Art. 30 records current' },
    { id: 'ccpa', name: 'CCPA', region: 'California', enabled: true, note: 'Retention policy overdue — action needed' },
    { id: 'hipaa', name: 'HIPAA', region: 'US healthcare', enabled: true, note: 'Review scheduled with legal' },
    { id: 'pipeda', name: 'PIPEDA', region: 'Canada', enabled: false, note: 'Not in operating scope' },
    { id: 'pdpa', name: 'PDPA-SG', region: 'Singapore', enabled: false, note: 'Not in operating scope' },
  ],
  legal: {
    dpa: {
      id: 'dpa',
      title: 'Data Processing Agreement',
      description: 'Signed DPA governing processor obligations (GDPR Art. 28).',
      fileName: 'Meridian-DPA-2026-signed.pdf',
      uploadedAt: '2026-03-14T00:00:00Z',
    },
    legalReview: {
      id: 'legalReview',
      title: 'Legal Review Document',
      description: 'Counsel review authorizing simulations on employees.',
      fileName: 'LegalReview-v3.2-2026.pdf',
      uploadedAt: '2026-06-15T00:00:00Z',
    },
  },
  notifications: [
    {
      id: 'harm_detected',
      label: 'Harm signal detected',
      description: 'Harm detector pauses or flags a target mid-campaign.',
      inApp: true,
      email: true,
      threshold: { kind: 'harmScore', value: 0.5 },
    },
    {
      id: 'target_compromised',
      label: 'Campaign compromised a target',
      description: 'A target yielded credentials or approved a simulated action.',
      inApp: true,
      email: true,
    },
    {
      id: 'target_blocked',
      label: 'Target blocked sender',
      description: 'Target blocked the persona across channels (persistence state change).',
      inApp: true,
      email: false,
    },
    {
      id: 'campaign_completed',
      label: 'Campaign completed',
      description: 'Campaign finished or was halted — AAR generated.',
      inApp: true,
      email: true,
    },
    {
      id: 'debrief_overdue',
      label: 'Debrief overdue',
      description: 'Mandatory debrief not delivered within the reminder window.',
      inApp: true,
      email: true,
    },
    {
      id: 'consent_expiring',
      label: 'Consent expiring',
      description: 'Employee consent approaching its expiry date.',
      inApp: true,
      email: true,
      threshold: { kind: 'daysBefore', value: 14 },
    },
    {
      id: 'audit_failure',
      label: 'Audit chain integrity failure',
      description: 'Hash-chain verification failed for an audit segment.',
      inApp: true,
      email: true,
    },
    {
      id: 'tier_a_activity',
      label: 'Tier A campaign activity',
      description: 'Any Tier A event — launch, escalation or harm signal.',
      inApp: true,
      email: false,
    },
    {
      id: 'policy_gap',
      label: 'Policy gap opened or closed',
      description: 'AAR engine opens or resolves an organizational policy gap.',
      inApp: true,
      email: false,
    },
  ],
  billing: {
    plan: 'Enterprise',
    billingEmail: 'finance@company.com',
    renewalDate: '2026-09-01T00:00:00Z',
    metrics: [
      { id: 'seats', label: 'Team seats', note: 'Members with console access', used: 6, limit: 10, format: 'count' },
      { id: 'campaigns', label: 'Concurrent campaigns', note: 'Running at the same time', used: 3, limit: 5, format: 'count' },
      { id: 'aars', label: 'AAR generations', note: 'This billing cycle', used: 20, limit: 25, format: 'count' },
      {
        id: 'tokens',
        label: 'Qwen tokens',
        note: 'Agent turns, voice synthesis and analysis',
        used: 1.42,
        limit: 2,
        format: 'tokens',
      },
    ],
    invoices: [
      { id: 'INV-2026-09', period: 'Sep 2026', date: '2026-09-01T00:00:00Z', amount: '$4,900.00', status: 'due' },
      { id: 'INV-2026-08', period: 'Aug 2026', date: '2026-08-01T00:00:00Z', amount: '$4,900.00', status: 'paid' },
      { id: 'INV-2026-07', period: 'Jul 2026', date: '2026-07-01T00:00:00Z', amount: '$4,900.00', status: 'paid' },
      { id: 'INV-2026-06', period: 'Jun 2026', date: '2026-06-01T00:00:00Z', amount: '$4,900.00', status: 'paid' },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Fetch + helpers                                                     */
/* ------------------------------------------------------------------ */

async function fetchSettings(): Promise<SettingsData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/v1/organizations/me/settings', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SettingsData;
  } finally {
    clearTimeout(timer);
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso));
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

const tierLabels: Record<Tier, string> = {
  A: 'Tier A — Aggressive',
  B: 'Tier B — Balanced',
  C: 'Tier C — Cautious',
};

const languageLabels: Record<Language, string> = {
  en: 'English',
  ur: 'Roman Urdu',
};

const classBadge: Record<RetentionRow['classification'], string> = {
  C2: 'bg-blue-500/10 text-[#5B9EFF]',
  C3: 'bg-amber-400/10 text-[#F59E0B]',
  C4: 'bg-purple-400/10 text-[#A78BFA]',
};

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const input =
  'w-full rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2.5 text-sm text-white ' +
  'placeholder:text-[#5A6470] transition-all duration-200 ease-out ' +
  'focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30';

/** Input/select styling without the w-full — for toolbar selects and narrow inputs. */
const fixedInput =
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

const iconButton =
  'inline-flex items-center justify-center rounded-lg border border-[#3D4860] p-2 text-slate-300 ' +
  'hover:bg-[#2FD9C7]/10 hover:border-[#2FD9C7]/50 hover:text-[#2FD9C7] transition-colors ' +
  'duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ' +
  'disabled:hover:border-[#3D4860] disabled:hover:text-slate-300';

const panel = 'bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6';

const th = 'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 bg-[#232D39]';
const td = 'px-4 py-3 text-sm text-slate-200 border-t border-[#252D38]';

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: typeof SettingsIcon;
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

function SaveButton({
  labelText,
  saving,
  saved,
  onClick,
}: {
  labelText: string;
  saving: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" className={primaryButton} onClick={onClick} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          <>
            <Save className="w-4 h-4" aria-hidden="true" />
            {labelText}
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
  );
}

function Switch({
  checked,
  onChange,
  labelText,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  labelText: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelText}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 ${
        checked ? 'bg-[#2FD9C7]' : 'bg-[#232D39]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-4' : ''
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

function UsageBar({ metric }: { metric: UsageMetric }) {
  const pct = Math.min(100, Math.round((metric.used / metric.limit) * 100));
  const color = pct >= 95 ? '#FF4757' : pct >= 85 ? '#F59E0B' : '#2FD9C7';
  const fmt = (v: number) => (metric.format === 'tokens' ? `${v.toFixed(2)}M` : `${v}`);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white">{metric.label}</div>
          <div className="text-xs text-slate-500">{metric.note}</div>
        </div>
        <span className="text-xs font-mono text-slate-300 shrink-0">
          {fmt(metric.used)} / {fmt(metric.limit)}
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-[#232D39] overflow-hidden mt-2"
        role="img"
        aria-label={`${metric.label}: ${pct}% of plan limit used`}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function LegalDocCard({
  doc,
  uploading,
  dragActive,
  onFile,
  onDragStateChange,
}: {
  doc: LegalDocument;
  uploading: boolean;
  dragActive: boolean;
  onFile: (file: File | null) => void;
  onDragStateChange: (active: boolean) => void;
}) {
  return (
    <div className="border border-[#2D3748] rounded-xl p-4 bg-[#15191F]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-10 h-10 rounded-lg bg-[#1D232D] border border-[#2D3748] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#2FD9C7]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">{doc.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            doc.fileName ? 'bg-[#06D369]/10 text-[#06D369]' : 'bg-amber-400/10 text-[#F59E0B]'
          }`}
        >
          {doc.fileName ? 'On file' : 'Missing'}
        </span>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        {doc.fileName ? (
          <>
            <span className="text-slate-300 font-mono">{doc.fileName}</span>
            {doc.uploadedAt && <> · Uploaded {formatDate(doc.uploadedAt)}</>}
          </>
        ) : (
          'No document on file — upload is required before campaigns launch.'
        )}
      </p>

      <label
        htmlFor={`upload-${doc.id}`}
        onDragOver={(e) => {
          e.preventDefault();
          onDragStateChange(true);
        }}
        onDragLeave={() => onDragStateChange(false)}
        onDrop={(e) => {
          e.preventDefault();
          onDragStateChange(false);
          onFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`mt-3 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg py-5 px-4 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-[#2FD9C7] bg-[#2FD9C7]/5' : 'border-[#2D3748] hover:border-[#2FD9C7]/50'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#2FD9C7]" aria-hidden="true" />
        ) : (
          <Upload className="w-4 h-4 text-slate-500" aria-hidden="true" />
        )}
        <span className="text-xs text-slate-400">
          {uploading ? 'Uploading…' : 'Drag & drop a PDF here, or click to browse'}
        </span>
        <input
          id={`upload-${doc.id}`}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

function NotificationRow({
  pref,
  onToggle,
  onThreshold,
}: {
  pref: NotificationPref;
  onToggle: (field: 'inApp' | 'email', value: boolean) => void;
  onThreshold: (value: number) => void;
}) {
  const meta = notifMeta[pref.id] ?? notifMeta.policy_gap;
  const Icon = meta.icon;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border border-[#2D3748] rounded-xl p-4 bg-[#15191F]">
      <span
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}
        aria-hidden="true"
      >
        <Icon className="w-4 h-4" style={{ color: meta.color }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-white">{pref.label}</div>
        <p className="text-xs text-slate-400 mt-0.5">{pref.description}</p>
      </div>
      <div className="flex items-center gap-5 shrink-0">
        <div className="flex flex-col items-center gap-1">
          <Switch
            checked={pref.inApp}
            onChange={(v) => onToggle('inApp', v)}
            labelText={`In-app notification for ${pref.label}`}
          />
          <span className="text-[10px] uppercase tracking-wider text-slate-500">In-app</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Switch
            checked={pref.email}
            onChange={(v) => onToggle('email', v)}
            labelText={`Email notification for ${pref.label}`}
          />
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Email</span>
        </div>
        {pref.threshold && (
          <div className="flex flex-col items-center gap-1">
            <input
              type="number"
              className={`${fixedInput} w-16 px-2 py-1.5 text-center font-mono`}
              value={pref.threshold.value}
              min={pref.threshold.kind === 'harmScore' ? 0 : 1}
              max={pref.threshold.kind === 'harmScore' ? 1 : 90}
              step={pref.threshold.kind === 'harmScore' ? 0.05 : 1}
              aria-label={`Threshold for ${pref.label}`}
              onChange={(e) => onThreshold(Number(e.target.value))}
            />
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              {pref.threshold.kind === 'harmScore' ? 'Score >' : 'Days'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section nav + export helpers                                        */
/* ------------------------------------------------------------------ */

const NAV_ITEMS: { key: SectionKey | 'integrations'; label: string; icon: typeof SettingsIcon }[] = [
  { key: 'general', label: 'General', icon: SettingsIcon },
  { key: 'compliance', label: 'Compliance & Legal', icon: Scale },
  { key: 'team', label: 'Team & Roles', icon: Users },
  { key: 'integrations', label: 'Platform Integrations', icon: Plug },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'billing', label: 'Billing & Usage', icon: CreditCard },
];

type SaveKey = 'general' | 'compliance' | 'notifications' | 'billing';

/** Compliance package manifest — PAGE 16 "Download Compliance Package". */
function buildCompliancePackage(input: {
  organizationName: string;
  jurisdictions: Jurisdiction[];
  retention: RetentionRow[];
  legal: Record<DocId, LegalDocument>;
}): string {
  return JSON.stringify(
    {
      document: 'phishyou_compliance_package',
      generated_at: new Date().toISOString(),
      organization: input.organizationName,
      jurisdictions: input.jurisdictions.map((j) => ({
        name: j.name,
        region: j.region,
        in_scope: j.enabled,
        note: j.note,
      })),
      retention_policy: input.retention.map((r) => ({
        data_type: r.dataType,
        classification: r.classification,
        retention: r.retention,
        after_retention: r.then,
        locked: r.locked,
      })),
      legal_documents: Object.values(input.legal).map((d) => ({
        title: d.title,
        file_name: d.fileName,
        uploaded_at: d.uploadedAt,
      })),
    },
    null,
    2,
  );
}

/** Client-side file download — same approach as the Reports page exports. */
function downloadFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Settings() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [section, setSection] = useState<SectionKey>('general');

  const [general, setGeneral] = useState<GeneralSettings>(DEMO_DATA.general);
  const [retention, setRetention] = useState<RetentionRow[]>(DEMO_DATA.retention);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>(DEMO_DATA.jurisdictions);
  const [legal, setLegal] = useState<Record<DocId, LegalDocument>>(DEMO_DATA.legal);
  const [notifications, setNotifications] = useState<NotificationPref[]>(DEMO_DATA.notifications);
  const [billingEmail, setBillingEmail] = useState(DEMO_DATA.billing.billingEmail);

  const [savingKey, setSavingKey] = useState<SaveKey | null>(null);
  const [savedKey, setSavedKey] = useState<SaveKey | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<DocId | null>(null);
  const [dragDoc, setDragDoc] = useState<DocId | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((d) => setData(d))
      .catch(() => setData(DEMO_DATA));
  }, []);

  // Sync editable drafts whenever fresh data lands.
  useEffect(() => {
    if (!data) return;
    setGeneral(data.general);
    setRetention(data.retention);
    setJurisdictions(data.jurisdictions);
    setLegal(data.legal);
    setNotifications(data.notifications);
    setBillingEmail(data.billing.billingEmail);
  }, [data]);

  const billing = data?.billing ?? DEMO_DATA.billing;

  async function persist(patch: Partial<SettingsData>): Promise<void> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/v1/organizations/me/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      clearTimeout(timer);
    } catch {
      // Demo mode — accept the local save so the UI stays consistent.
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  async function save(key: SaveKey, patch: Partial<SettingsData>): Promise<void> {
    setSavingKey(key);
    await persist(patch);
    setData((prev) => (prev ? { ...prev, ...patch } : prev));
    setSavingKey(null);
    setSavedKey(key);
    setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2500);
  }

  function toggleJurisdiction(id: string): void {
    setJurisdictions((prev) => prev.map((j) => (j.id === id ? { ...j, enabled: !j.enabled } : j)));
  }

  function toggleNotification(id: string, field: 'inApp' | 'email', value: boolean): void {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
  }

  function setNotificationThreshold(id: string, value: number): void {
    if (!Number.isFinite(value)) return;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id !== id || !n.threshold) return n;
        const clamped =
          n.threshold.kind === 'harmScore'
            ? Math.min(1, Math.max(0, value))
            : Math.min(90, Math.max(1, value));
        return { ...n, threshold: { ...n.threshold, value: clamped } };
      }),
    );
  }

  async function handleUpload(id: DocId, file: File | null): Promise<void> {
    if (!file) return;
    setUploadingDoc(id);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`/api/v1/organizations/me/settings/legal/${id}`, {
        method: 'POST',
        body,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      clearTimeout(timer);
    } catch {
      // Demo mode — accept the local upload so the UI stays consistent.
      await new Promise((r) => setTimeout(r, 800));
    }
    setLegal((prev) => ({
      ...prev,
      [id]: { ...prev[id], fileName: file.name, uploadedAt: new Date().toISOString() },
    }));
    setUploadingDoc(null);
  }

  function handleExportPackage(): void {
    const manifest = buildCompliancePackage({
      organizationName: data?.general.organizationName ?? general.organizationName,
      jurisdictions,
      retention,
      legal,
    });
    downloadFile(
      `phishyou-compliance-package-${new Date().toISOString().slice(0, 10)}.json`,
      manifest,
    );
  }

  function downloadInvoice(inv: Invoice): void {
    const receipt = JSON.stringify(
      {
        invoice: inv.id,
        period: inv.period,
        issued: inv.date,
        amount: inv.amount,
        status: inv.status,
        plan: billing.plan,
        organization: data?.general.organizationName ?? general.organizationName,
      },
      null,
      2,
    );
    downloadFile(`${inv.id}.json`, receipt);
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#2FD9C7]" aria-hidden="true" />
          <span className="ml-3 text-sm text-slate-400">Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Tenant defaults, compliance posture, team access and delivery preferences for{' '}
          <span className="text-slate-300 font-medium">{data.general.organizationName}</span>.
        </p>
      </div>

      {/* Section nav + active section */}
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6 items-start">
        <nav aria-label="Settings sections" className="bg-[#111827] border border-[#2D3748] rounded-xl p-3">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const active = section === item.key;
              const Icon = item.icon;
              const base =
                `w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-left ` +
                `whitespace-nowrap transition-colors duration-200 ${
                  active
                    ? 'bg-[#2FD9C7]/10 text-[#2FD9C7]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`;
              return (
                <li key={item.key} className="shrink-0 lg:shrink">
                  {item.key === 'integrations' ? (
                    <Link to="/settings/integrations" className={base}>
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      {item.label}
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-600" aria-hidden="true" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSection(item.key)}
                      aria-current={active ? 'true' : undefined}
                      className={base}
                    >
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          {/* General */}
          {section === 'general' && (
            <section aria-label="General">
              <SectionHeader
                icon={SettingsIcon}
                title="General"
                subtitle="Tenant defaults applied to new campaigns and the console experience."
              />
              <div className={panel}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label htmlFor="settings-org-name" className={label}>
                      Organization name
                    </label>
                    <input
                      id="settings-org-name"
                      className={input}
                      value={general.organizationName}
                      onChange={(e) =>
                        setGeneral({ ...general, organizationName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-domain" className={label}>
                      Organization domain
                    </label>
                    <div className="relative">
                      <input
                        id="settings-domain"
                        className={`${input} pr-10 font-mono`}
                        value={general.domain}
                        readOnly
                      />
                      <Lock
                        className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Locked at domain verification — contact support to change.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="settings-debrief-window" className={label}>
                      Debrief reminder window
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        id="settings-debrief-window"
                        type="number"
                        min={1}
                        max={24}
                        className={`${fixedInput} w-20 text-center font-mono`}
                        value={general.debriefWindowHours}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setGeneral({
                            ...general,
                            debriefWindowHours: Number.isFinite(n)
                              ? Math.min(24, Math.max(1, n))
                              : general.debriefWindowHours,
                          });
                        }}
                      />
                      <span className="text-xs text-slate-400">hours after campaign end</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Debriefs are mandatory within 24 hours of campaign end — reminders fire as
                      the window closes.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="settings-default-tier" className={label}>
                      Default tier
                    </label>
                    <select
                      id="settings-default-tier"
                      className={input}
                      value={general.defaultTier}
                      onChange={(e) =>
                        setGeneral({ ...general, defaultTier: e.target.value as Tier })
                      }
                    >
                      {(['A', 'B', 'C'] as Tier[]).map((t) => (
                        <option key={t} value={t}>
                          {tierLabels[t]}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Applied to new campaigns — Tier A additionally requires CISO approval.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="settings-default-language" className={label}>
                      Default language
                    </label>
                    <select
                      id="settings-default-language"
                      className={input}
                      value={general.defaultLanguage}
                      onChange={(e) =>
                        setGeneral({ ...general, defaultLanguage: e.target.value as Language })
                      }
                    >
                      {(['en', 'ur'] as Language[]).map((l) => (
                        <option key={l} value={l}>
                          {languageLabels[l]}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Roman Urdu enables Pakistani-market personas and Pakistan-specific compliance
                      guidance.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-[#252D38] flex justify-end">
                  <SaveButton
                    labelText="Save Changes"
                    saving={savingKey === 'general'}
                    saved={savedKey === 'general'}
                    onClick={() => void save('general', { general })}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Compliance & Legal */}
          {section === 'compliance' && (
            <section aria-label="Compliance and legal">
              <SectionHeader
                icon={Scale}
                title="Compliance & Legal"
                subtitle="Retention policy, jurisdictions and signed legal documents."
                action={
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={handleExportPackage}
                    title="Exports jurisdictions, retention policies and legal documents as a JSON manifest"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Download Compliance Package
                  </button>
                }
              />
              <div className="space-y-6">
                {/* Retention policy */}
                <div className={panel}>
                  <h3 className="text-sm font-bold text-white">Data retention policy</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Per data type — the audit chain is immutable. After retention, data is purged
                    or archived as noted.
                  </p>
                  <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr>
                          <th className={th}>Data type</th>
                          <th className={th}>Class</th>
                          <th className={th}>Retention period</th>
                          <th className={th}>After retention</th>
                        </tr>
                      </thead>
                      <tbody>
                        {retention.map((row) => (
                          <tr key={row.id} className="hover:bg-white/5 transition-colors">
                            <td className={`${td} font-medium text-white`}>{row.dataType}</td>
                            <td className={td}>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  classBadge[row.classification]
                                }`}
                              >
                                {row.classification}
                              </span>
                            </td>
                            <td className={td}>
                              {row.locked ? (
                                <span
                                  className="inline-flex items-center gap-1.5 text-slate-400"
                                  title="Retention for the audit chain is immutable"
                                >
                                  <Lock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                                  {row.retention}
                                </span>
                              ) : (
                                <select
                                  className={`${fixedInput} w-36`}
                                  value={row.retention}
                                  onChange={(e) =>
                                    setRetention((prev) =>
                                      prev.map((r) =>
                                        r.id === row.id ? { ...r, retention: e.target.value } : r,
                                      ),
                                    )
                                  }
                                  aria-label={`Retention period for ${row.dataType}`}
                                >
                                  {row.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td className={`${td} text-slate-400`}>{row.then}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Classification per DATA_PROTECTION.md — C2 internal, C3 confidential, C4
                    restricted.
                  </p>
                </div>

                {/* Jurisdictions */}
                <div className={panel}>
                  <h3 className="text-sm font-bold text-white">Jurisdictions</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Regulations the organization declares in scope — drives the compliance strip on
                    the Dashboard.
                  </p>
                  <ul className="space-y-2">
                    {jurisdictions.map((j) => (
                      <li key={j.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={j.enabled}
                          onClick={() => toggleJurisdiction(j.id)}
                          className="w-full flex items-center gap-3 border border-[#2D3748] rounded-lg px-3.5 py-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span
                            className={`w-[18px] h-[18px] rounded border flex items-center justify-center shrink-0 transition-colors ${
                              j.enabled
                                ? 'bg-[#2FD9C7] border-[#2FD9C7]'
                                : 'border-[#3D4860] bg-[#1D232D]'
                            }`}
                            aria-hidden="true"
                          >
                            {j.enabled && <Check className="w-3 h-3 text-[#0F1219]" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-white">
                              {j.name}
                              <span className="text-slate-500 font-normal"> · {j.region}</span>
                            </span>
                            <span className="block text-xs text-slate-400 mt-0.5">{j.note}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Legal documents */}
                <div className={panel}>
                  <h3 className="text-sm font-bold text-white">Legal documents</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Signed documents required before campaigns can launch.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(['dpa', 'legalReview'] as DocId[]).map((id) => (
                      <LegalDocCard
                        key={id}
                        doc={legal[id]}
                        uploading={uploadingDoc === id}
                        dragActive={dragDoc === id}
                        onFile={(file) => void handleUpload(id, file)}
                        onDragStateChange={(active) => setDragDoc(active ? id : null)}
                      />
                    ))}
                  </div>
                </div>

                {/* Pakistan operations — shown when Roman Urdu is used (PAGE 16) */}
                {general.defaultLanguage === 'ur' && (
                  <div className="border border-amber-400/30 bg-amber-400/5 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <span className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-[#F59E0B]" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Pakistan operations — additional safeguards
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Shown because Roman Urdu is enabled. Pakistan has no comprehensive
                          privacy law (as of 2026), so extra transparency measures apply.
                        </p>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {[
                        'Obtain employee consent in writing — no comprehensive privacy statute applies.',
                        'Provide the privacy notice in Urdu / Roman Urdu.',
                        'Apply encryption, access controls and audit logging as best-practice safeguards.',
                        'Confirm with local labor-law counsel that simulation testing is authorized under employment contracts.',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-slate-300">
                          <AlertTriangle
                            className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 mt-px"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <SaveButton
                    labelText="Save Compliance Settings"
                    saving={savingKey === 'compliance'}
                    saved={savedKey === 'compliance'}
                    onClick={() => void save('compliance', { retention, jurisdictions })}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Team & Roles */}
          {section === 'team' && (
            <section aria-label="Team and roles">
              <SectionHeader
                icon={Users}
                title="Team & Roles"
                subtitle="What each console role can do — API scopes and data classifications."
                action={
                  <Link to="/users" className={secondaryButton}>
                    Manage Team
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                }
              />
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {ROLE_DESCRIPTIONS.map((role) => (
                    <div key={role.id} className="border border-[#2D3748] rounded-xl p-4 bg-[#15191F]">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white">{role.name}</h3>
                        {role.id === 'auditor' && (
                          <span className="rounded-full bg-[#232D39] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Read-only
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">{role.description}</p>
                    </div>
                  ))}
                </div>

                <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr>
                        <th className={th}>Capability</th>
                        {ROLES.map((r) => (
                          <th key={r.id} className={`${th} text-center`}>
                            {r.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISSIONS.map((p) => (
                        <tr
                          key={`${p.scope}-${p.label}`}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className={td}>
                            <span className="block text-sm text-white">{p.label}</span>
                            <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                              {p.scope}
                            </span>
                          </td>
                          {ROLES.map((r) => (
                            <td key={r.id} className={`${td} text-center`}>
                              {p.allowed.includes(r.id) ? (
                                <span
                                  className="inline-flex text-[#06D369]"
                                  role="img"
                                  aria-label="Allowed"
                                >
                                  <Check className="w-4 h-4" aria-hidden="true" />
                                </span>
                              ) : (
                                <span className="text-slate-600" role="img" aria-label="Not allowed">
                                  —
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500">
                  Matrix mirrors API scopes and data-classification access (DATA_PROTECTION.md §6).
                  The Auditor role is read-only by design. Team members and invites are managed on
                  the Users page.
                </p>
              </div>
            </section>
          )}

          {/* Notifications */}
          {section === 'notifications' && (
            <section aria-label="Notification preferences">
              <SectionHeader
                icon={Bell}
                title="Notification Preferences"
                subtitle="Per-event delivery — in-app alerts, email and thresholds."
              />
              <div className="space-y-3">
                {notifications.map((pref) => (
                  <NotificationRow
                    key={pref.id}
                    pref={pref}
                    onToggle={(field, value) => toggleNotification(pref.id, field, value)}
                    onThreshold={(value) => setNotificationThreshold(pref.id, value)}
                  />
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <SaveButton
                  labelText="Save Preferences"
                  saving={savingKey === 'notifications'}
                  saved={savedKey === 'notifications'}
                  onClick={() => void save('notifications', { notifications })}
                />
              </div>
            </section>
          )}

          {/* Billing & Usage */}
          {section === 'billing' && (
            <section aria-label="Billing and usage">
              <SectionHeader
                icon={CreditCard}
                title="Billing & Usage"
                subtitle="Plan, consumption this cycle and invoice history."
              />
              <div className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className={panel}>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-white">Plan</h3>
                      <span className="rounded-full bg-[#2FD9C7]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#2FD9C7]">
                        {billing.plan}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-slate-500">Current cycle ends</div>
                      <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-white">
                        <CalendarClock className="w-4 h-4 text-[#2FD9C7]" aria-hidden="true" />
                        {formatDate(billing.renewalDate)}
                        <span className="text-xs font-normal text-slate-400">
                          · in {daysUntil(billing.renewalDate)} days
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-[#252D38]">
                      <label htmlFor="settings-billing-email" className={label}>
                        Billing email
                      </label>
                      <input
                        id="settings-billing-email"
                        type="email"
                        className={input}
                        value={billingEmail}
                        onChange={(e) => setBillingEmail(e.target.value)}
                      />
                      <div className="mt-3 flex justify-end">
                        <SaveButton
                          labelText="Save"
                          saving={savingKey === 'billing'}
                          saved={savedKey === 'billing'}
                          onClick={() =>
                            void save('billing', {
                              billing: { ...billing, billingEmail },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`${panel} lg:col-span-2`}>
                    <h3 className="text-sm font-bold text-white">Usage this cycle</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      Consumption meters — reset at the start of each billing period.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-5">
                      {billing.metrics.map((m) => (
                        <UsageBar key={m.id} metric={m} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className={panel}>
                  <h3 className="text-sm font-bold text-white mb-4">Invoice history</h3>
                  <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr>
                          <th className={th}>Period</th>
                          <th className={th}>Invoice</th>
                          <th className={th}>Date</th>
                          <th className={th}>Amount</th>
                          <th className={th}>Status</th>
                          <th className={`${th} text-right`}>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billing.invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                            <td className={`${td} font-medium text-white`}>{inv.period}</td>
                            <td className={`${td} font-mono text-xs`}>{inv.id}</td>
                            <td className={td}>{formatDate(inv.date)}</td>
                            <td className={td}>{inv.amount}</td>
                            <td className={td}>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  inv.status === 'paid'
                                    ? 'bg-[#06D369]/10 text-[#06D369]'
                                    : 'bg-amber-400/10 text-[#F59E0B]'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className={`${td} text-right`}>
                              <button
                                type="button"
                                className={iconButton}
                                onClick={() => downloadInvoice(inv)}
                                title="Download receipt (JSON)"
                                aria-label={`Download receipt for ${inv.id}`}
                              >
                                <Download className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
