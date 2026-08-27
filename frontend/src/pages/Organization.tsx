/**
 * PhishYou — Organization (`/organization`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 13 (Organizational Attestation) +
 *       PAGE 16 (Organization Settings: General / Compliance & Legal) +
 *       PHISHYOU_SPECS/08_ETHICAL_FRAMEWORKS/ORGANIZATIONAL_RESPONSIBILITY_MODEL.md
 *       and CONSENT_FRAMEWORK.md.
 *
 * Accountability hub for the deploying organization:
 * - Identity card, plan and rollout snapshot (employees, consent coverage).
 * - Editable profile: name, industry, HQ, default tier/language, oversight emails.
 * - Organizational attestation: validity banner, responsibility checklist,
 *   versioned history, and the re-attestation flow (clause-by-clause
 *   affirmation + typed signature, mirroring the CONSENT_FRAMEWORK form).
 * - Compliance posture and legal & governance readiness.
 * - Oversight contacts (reachable during active campaigns) and the tier
 *   responsibility model (who owns harm monitoring / intensity decisions).
 * - Department rollout: headcount, campaigns, resistance, consent coverage.
 *
 * Data: GET/PATCH /api/v1/organizations/me. Falls back to embedded demo data
 * when the API is unreachable so the page renders correctly without a backend.
 */
import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Globe,
  Layers,
  Loader2,
  MapPin,
  PenLine,
  Phone,
  Save,
  Scale,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Tier = 'A' | 'B' | 'C';
type ComplianceStatus = 'compliant' | 'pending' | 'action_needed';

interface OrgProfile {
  name: string;
  domain: string; // read-only — locked at domain verification
  industry: string;
  headquarters: string;
  plan: string;
  memberSince: string; // ISO
  defaultTier: Tier;
  defaultLanguage: 'en' | 'ur';
  cisoName: string;
  cisoEmail: string;
  legalContactEmail: string;
}

interface OrgStats {
  employees: number;
  departments: number;
  campaignsToDate: number;
  consentCoverage: number; // 0..1
}

interface Attestation {
  version: string; // e.g. '3.2'
  attestedBy: string;
  attestedAt: string; // ISO
  expiresAt: string; // ISO
}

interface AttestationRequirement {
  id: string;
  title: string;
  description: string;
  status: 'verified' | 'pending';
  evidence: string;
}

interface AttestationHistoryEntry {
  version: string;
  date: string; // ISO
  attestedBy: string;
  status: 'current' | 'superseded' | 'expired';
}

interface ComplianceFramework {
  framework: string;
  status: ComplianceStatus;
  note: string;
}

interface GovernanceItem {
  id: string;
  label: string;
  detail: string;
  done: boolean;
}

interface OversightContact {
  id: string;
  role: string;
  name: string;
  email: string;
  reachable: boolean; // reachable during active campaigns
}

interface Department {
  id: string;
  name: string;
  employees: number;
  campaigns: number;
  avgResistance: number; // 0..1 — same semantics as the Dashboard gauge
  compromiseRate: number; // 0..1
  consentCoverage: number; // 0..1
}

interface OrganizationData {
  profile: OrgProfile;
  stats: OrgStats;
  attestation: Attestation;
  requirements: AttestationRequirement[];
  history: AttestationHistoryEntry[];
  compliance: ComplianceFramework[];
  governance: GovernanceItem[];
  contacts: OversightContact[];
  departments: Department[];
}

/* ------------------------------------------------------------------ */
/* Demo data (used when API unreachable)                               */
/* ------------------------------------------------------------------ */

const DEMO_DATA: OrganizationData = {
  profile: {
    name: 'Meridian Financial Group',
    domain: 'company.com',
    industry: 'Financial Services',
    headquarters: 'London, United Kingdom',
    plan: 'Enterprise',
    memberSince: '2025-09-01T00:00:00Z',
    defaultTier: 'B',
    defaultLanguage: 'en',
    cisoName: 'Laura Mitchell',
    cisoEmail: 'ciso@company.com',
    legalContactEmail: 'legal@company.com',
  },
  stats: {
    employees: 234,
    departments: 6,
    campaignsToDate: 23,
    consentCoverage: 0.92,
  },
  attestation: {
    version: '3.2',
    attestedBy: 'Laura Mitchell (CISO)',
    attestedAt: '2026-06-15T09:30:00Z',
    expiresAt: '2027-06-15T09:30:00Z',
  },
  requirements: [
    {
      id: 'req-legal',
      title: 'Legal review attestation',
      description: 'Signed confirmation that the simulation program complies with local labor and privacy law.',
      status: 'verified',
      evidence: 'External counsel review · Aug 12, 2026',
    },
    {
      id: 'req-consent',
      title: 'Consent infrastructure',
      description: 'Employee consent on file before any targeting; withdrawal honored within 60 seconds.',
      status: 'verified',
      evidence: '216 of 234 employees consented',
    },
    {
      id: 'req-contacts',
      title: 'Named oversight contacts',
      description: 'HR owner and security owner per campaign, reachable during active campaigns.',
      status: 'verified',
      evidence: '4 of 5 contacts confirmed reachable',
    },
    {
      id: 'req-eap',
      title: 'Support readiness (EAP)',
      description: 'EAP or equivalent psychological support contact configured and staffed.',
      status: 'pending',
      evidence: 'EAP coverage unconfirmed for night-shift staff',
    },
    {
      id: 'req-debrief',
      title: 'Debrief commitment',
      description: 'Debrief delivered within 24h of campaign end; escalated human debrief on distress.',
      status: 'verified',
      evidence: 'Average delivery: 6h after campaign end',
    },
    {
      id: 'req-misuse',
      title: 'No-misuse pledge',
      description: 'Simulation results feed training programs — never disciplinary action.',
      status: 'verified',
      evidence: 'Clause affirmed in attestation v3.2 §5',
    },
  ],
  history: [
    { version: '3.2', date: '2026-06-15T09:30:00Z', attestedBy: 'Laura Mitchell (CISO)', status: 'current' },
    { version: '3.1', date: '2026-02-18T14:05:00Z', attestedBy: 'Laura Mitchell (CISO)', status: 'superseded' },
    { version: '3.0', date: '2025-09-01T11:00:00Z', attestedBy: 'J. Whitfield (CISO, former)', status: 'expired' },
  ],
  compliance: [
    { framework: 'GDPR', status: 'compliant', note: 'DPA on file' },
    { framework: 'SOC 2', status: 'compliant', note: 'Type II — current' },
    { framework: 'HIPAA', status: 'pending', note: 'Review scheduled' },
    { framework: 'CCPA', status: 'action_needed', note: 'Retention policy overdue' },
  ],
  governance: [
    { id: 'gov-legal', label: 'Legal review', detail: 'External counsel sign-off · Aug 12, 2026', done: true },
    { id: 'gov-dpa', label: 'Data Processing Agreement (DPA)', detail: 'Executed · renews Jan 31, 2027', done: true },
    { id: 'gov-transparency', label: 'Transparency statement', detail: 'Published to employee intranet · Jul 1, 2026', done: true },
    { id: 'gov-retention', label: 'Data retention policy', detail: 'CCPA retention schedule overdue — action required', done: false },
    { id: 'gov-consent-records', label: 'Consent records', detail: '216 active consents on file', done: true },
    { id: 'gov-incident', label: 'Incident response protocol', detail: 'HR follow-up within 4h business time documented', done: true },
  ],
  contacts: [
    { id: 'ct-ciso', role: 'CISO', name: 'Laura Mitchell', email: 'ciso@company.com', reachable: true },
    { id: 'ct-sec', role: 'Security Manager', name: 'Imran Qureshi', email: 'security@company.com', reachable: true },
    { id: 'ct-hr', role: 'HR / Debrief Officer', name: 'Amna Raza', email: 'hr@company.com', reachable: true },
    { id: 'ct-legal', role: 'Legal Counsel', name: 'David Ellis', email: 'legal@company.com', reachable: true },
    { id: 'ct-eap', role: 'EAP Support', name: 'LifeWorks (partner)', email: 'eap@company.com', reachable: false },
  ],
  departments: [
    { id: 'dept-fin', name: 'Finance', employees: 42, campaigns: 9, avgResistance: 0.58, compromiseRate: 0.21, consentCoverage: 0.95 },
    { id: 'dept-hr', name: 'People Ops', employees: 18, campaigns: 4, avgResistance: 0.38, compromiseRate: 0.12, consentCoverage: 1.0 },
    { id: 'dept-it', name: 'IT & Engineering', employees: 61, campaigns: 5, avgResistance: 0.31, compromiseRate: 0.08, consentCoverage: 0.9 },
    { id: 'dept-ops', name: 'Operations', employees: 57, campaigns: 2, avgResistance: 0.44, compromiseRate: 0.15, consentCoverage: 0.89 },
    { id: 'dept-sales', name: 'Sales & Marketing', employees: 48, campaigns: 0, avgResistance: 0.47, compromiseRate: 0, consentCoverage: 0.92 },
    { id: 'dept-lead', name: 'Leadership', employees: 8, campaigns: 3, avgResistance: 0.66, compromiseRate: 0.33, consentCoverage: 1.0 },
  ],
};

/** Condensed from the attestation form in CONSENT_FRAMEWORK.md §1. */
const ATTESTATION_CLAUSES: string[] = [
  'We are authorized to conduct security testing on our employees.',
  'We have reviewed PhishYou\u2019s methodology and accept the approach, including AI-driven multi-turn attacks, voice synthesis and credential-harvesting attempts.',
  'We will obtain explicit informed consent from every participating employee before campaigns launch.',
  'We will not use PhishYou results for disciplinary action or employee termination.',
  'We will conduct mandatory post-campaign debriefs with all targets.',
  'We understand the organization — not PhishYou — owns responsibility for employee reactions and psychological impact.',
  'We will maintain immutable audit logs and comply with applicable law (GDPR, CCPA, HIPAA where relevant).',
];

/** Tier-specific responsibility shifts — ORGANIZATIONAL_RESPONSIBILITY_MODEL.md §4. */
const TIER_RESPONSIBILITY: { area: string; c: string; b: string; a: string }[] = [
  { area: 'Harm monitoring', c: 'Platform — mandatory', b: 'Platform (optional) + org attention', a: 'Organization fully' },
  { area: 'Intensity decisions', c: 'Platform caps', b: 'Platform caps', a: 'Organization fully' },
  { area: 'Wellbeing follow-up', c: 'Standard debrief', b: 'Standard + support message', a: 'HR proactive check-ins required' },
  { area: 'Legal attestation depth', c: 'Standard', b: 'Standard', a: 'Enhanced — counsel-signed' },
];

/* ------------------------------------------------------------------ */
/* Fetch + helpers                                                     */
/* ------------------------------------------------------------------ */

async function fetchOrganization(): Promise<OrganizationData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/v1/organizations/me', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as OrganizationData;
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

function bumpVersion(v: string): string {
  const [major, minor] = v.split('.');
  return `${major}.${Number(minor) + 1}`;
}

/** Resistance score color: green < 0.33, amber 0.33–0.67, red > 0.67. */
function resistanceColor(score: number): string {
  if (score < 0.33) return '#06D369';
  if (score <= 0.67) return '#F59E0B';
  return '#FF4757';
}

function compromiseColor(rate: number): string {
  if (rate >= 0.25) return '#FF4757';
  if (rate >= 0.12) return '#F59E0B';
  return '#06D369';
}

const tierStyles: Record<Tier, string> = {
  A: 'bg-red-500/15 text-[#FF4757]',
  B: 'bg-amber-400/10 text-[#F59E0B]',
  C: 'bg-green-400/10 text-[#06D369]',
};

const languageLabels: Record<OrgProfile['defaultLanguage'], string> = {
  en: 'English',
  ur: 'Roman Urdu',
};

const complianceMeta: Record<ComplianceStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  compliant: { icon: CheckCircle2, color: '#06D369', label: 'Compliant' },
  pending: { icon: Clock, color: '#F59E0B', label: 'Pending' },
  action_needed: { icon: XCircle, color: '#FF4757', label: 'Action needed' },
};

const historyBadge: Record<AttestationHistoryEntry['status'], string> = {
  current: 'bg-[#06D369]/10 text-[#06D369]',
  superseded: 'bg-slate-400/10 text-[#8B95A8]',
  expired: 'bg-amber-400/10 text-[#F59E0B]',
};

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

const panel = 'bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6';

const th = 'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 bg-[#232D39]';
const td = 'px-4 py-3 text-sm text-slate-200 border-t border-[#252D38]';

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: typeof Building2;
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

function Field({
  id,
  labelText,
  value,
  onChange,
  type = 'text',
  placeholder,
  readOnly = false,
  hint,
}: {
  id: string;
  labelText: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {labelText}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        autoComplete="off"
        className={`${input}${readOnly ? ' font-mono opacity-80 cursor-not-allowed' : ''}`}
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function SaveRow({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex items-center gap-3 mt-5">
      <button type="button" className={primaryButton} onClick={onSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          <>
            <Save className="w-4 h-4" aria-hidden="true" />
            Save Changes
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

function CoverageBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Consent coverage ${pct}%`}>
      <div className="h-1.5 w-14 rounded-full bg-[#232D39] overflow-hidden shrink-0" aria-hidden="true">
        <div className="h-full rounded-full bg-[#2FD9C7]" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-300">{pct}%</span>
    </div>
  );
}

function RequirementRow({ requirement }: { requirement: AttestationRequirement }) {
  const verified = requirement.status === 'verified';
  return (
    <div className="flex items-start gap-3 border border-[#2D3748] rounded-xl p-4 bg-[#15191F]">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          verified ? 'bg-[#06D369]/10' : 'bg-amber-400/10'
        }`}
        aria-hidden="true"
      >
        {verified ? (
          <CheckCircle2 className="w-4 h-4 text-[#06D369]" />
        ) : (
          <Clock className="w-4 h-4 text-[#F59E0B]" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">{requirement.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              verified ? 'bg-[#06D369]/10 text-[#06D369]' : 'bg-amber-400/10 text-[#F59E0B]'
            }`}
          >
            {verified ? 'Verified' : 'Pending'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">{requirement.description}</p>
        <p className="text-xs text-slate-500 mt-2">{requirement.evidence}</p>
      </div>
    </div>
  );
}

function ComplianceCard({ item }: { item: ComplianceFramework }) {
  const meta = complianceMeta[item.status];
  const Icon = meta.icon;
  return (
    <div className="border border-[#2D3748] rounded-xl p-4 bg-[#15191F]">
      <Icon className="w-5 h-5 mb-2" style={{ color: meta.color }} aria-hidden="true" />
      <div className="text-sm font-semibold text-white">{item.framework}</div>
      <div className="text-xs mt-0.5" style={{ color: meta.color }}>
        {meta.label}
      </div>
      <div className="text-xs text-slate-500 mt-1">{item.note}</div>
    </div>
  );
}

function GovernanceRow({ item }: { item: GovernanceItem }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#252D38] last:border-0">
      {item.done ? (
        <CheckCircle2 className="w-4 h-4 text-[#06D369] mt-0.5 shrink-0" aria-hidden="true" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-[#F59E0B] mt-0.5 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-white">{item.label}</div>
        <div className="text-xs text-slate-400 mt-0.5">{item.detail}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Re-attestation dialog (CONSENT_FRAMEWORK.md §1)                      */
/* ------------------------------------------------------------------ */

function ReAttestDialog({
  nextVersion,
  signerDefault,
  submitting,
  onClose,
  onSubmit,
}: {
  nextVersion: string;
  signerDefault: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (signer: string) => void;
}) {
  const [checked, setChecked] = useState<boolean[]>(() => ATTESTATION_CLAUSES.map(() => false));
  const [signer, setSigner] = useState(signerDefault);
  const affirmed = checked.filter(Boolean).length;
  const allChecked = affirmed === ATTESTATION_CLAUSES.length;
  const canSubmit = allChecked && signer.trim().length >= 3;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reattest-title"
      aria-describedby="reattest-desc"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#2D3748] bg-[#1D232D] p-6 shadow-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <h3 id="reattest-title" className="text-lg font-bold text-white">
            Re-attest organizational authorization
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <p id="reattest-desc" className="text-sm text-slate-400 mt-2">
          Renewal creates attestation <span className="font-mono text-slate-300">v{nextVersion}</span>, valid for 12
          months. Read and affirm every clause, then sign below.
        </p>

        <div className="mt-5 border border-[#2D3748] rounded-xl bg-[#15191F] px-4 py-2">
          {ATTESTATION_CLAUSES.map((clause, i) => (
            <label key={i} className="flex items-start gap-3 py-2.5 border-b border-[#252D38] last:border-0 cursor-pointer">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)))}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#3D4860] bg-[#1D232D] accent-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/40"
              />
              <span className="text-sm text-slate-300">{clause}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2" aria-live="polite">
          {affirmed} of {ATTESTATION_CLAUSES.length} clauses affirmed
        </p>

        <div className="mt-4">
          <label htmlFor="reattest-signer" className={label}>
            Signature — type your full name
          </label>
          <input
            id="reattest-signer"
            type="text"
            value={signer}
            onChange={(e) => setSigner(e.target.value)}
            placeholder="Laura Mitchell"
            autoComplete="off"
            className={input}
          />
          <p className="text-xs text-amber-400 mt-1">Signed attestations are recorded in the immutable audit log.</p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" autoFocus onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button type="button" onClick={() => onSubmit(signer.trim())} disabled={!canSubmit || submitting} className={primaryButton}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <>
                <PenLine className="w-4 h-4" aria-hidden="true" />
                Sign &amp; Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Organization() {
  const [data, setData] = useState<OrganizationData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showReattest, setShowReattest] = useState(false);
  const [submittingAttestation, setSubmittingAttestation] = useState(false);
  const [renewed, setRenewed] = useState(false);

  useEffect(() => {
    fetchOrganization()
      .then(setData)
      .catch(() => setData(DEMO_DATA)); // demo fallback
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2FD9C7]" aria-label="Loading organization profile" />
      </div>
    );
  }

  const updateProfile = (patch: Partial<OrgProfile>) =>
    setData((d) => (d ? { ...d, profile: { ...d.profile, ...patch } } : d));

  const saveProfile = async () => {
    setSaving(true);
    try {
      await fetch('/api/v1/organizations/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.profile),
      });
    } catch {
      /* demo mode — accept local save */
    }
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const downloadPdf = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 900));
    setDownloading(false);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const submitAttestation = async (signer: string) => {
    setSubmittingAttestation(true);
    try {
      await fetch('/api/v1/organizations/me/attestation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedBy: signer, clausesAffirmed: ATTESTATION_CLAUSES.length }),
      });
    } catch {
      /* demo mode — accept local submission */
    }
    await new Promise((r) => setTimeout(r, 700));
    const now = new Date().toISOString();
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    setData((d) => {
      if (!d) return d;
      const next = bumpVersion(d.attestation.version);
      return {
        ...d,
        attestation: { version: next, attestedBy: signer, attestedAt: now, expiresAt: expires.toISOString() },
        history: [
          { version: next, date: now, attestedBy: signer, status: 'current' as const },
          ...d.history.map((h) => (h.status === 'current' ? { ...h, status: 'superseded' as const } : h)),
        ],
      };
    });
    setSubmittingAttestation(false);
    setShowReattest(false);
    setRenewed(true);
    setTimeout(() => setRenewed(false), 4000);
  };

  const daysLeft = daysUntil(data.attestation.expiresAt);
  const expiringSoon = daysLeft <= 60;
  const consentPct = Math.round(data.stats.consentCoverage * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white">Organization</h1>
        <p className="text-sm text-slate-400 mt-1">
          Profile, attestation and compliance posture for your PhishYou tenant.
        </p>
      </header>

      {/* Identity + snapshot */}
      <section aria-label="Organization identity" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${panel} lg:col-span-2`}>
          <div className="flex flex-wrap items-start gap-5">
            <div
              className="w-14 h-14 rounded-xl bg-[#2FD9C7]/10 border border-[#2FD9C7]/30 flex items-center justify-center text-xl font-black text-[#2FD9C7] shrink-0"
              aria-hidden="true"
            >
              {data.profile.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-white">{data.profile.name}</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5B9EFF]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#5B9EFF]">
                  <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  {data.profile.plan}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Globe className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span className="text-sm font-mono text-slate-300">{data.profile.domain}</span>
                <CheckCircle2 className="w-4 h-4 text-[#06D369]" aria-label="Domain verified" role="img" />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                  {data.profile.industry}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {data.profile.headquarters}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  Member since {formatDate(data.profile.memberSince)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${tierStyles[data.profile.defaultTier]}`}>
                  Default: Tier {data.profile.defaultTier}
                </span>
                <span className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-400/10 text-[#8B95A8]">
                  {languageLabels[data.profile.defaultLanguage]}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link to="/users" className={`${secondaryButton} !px-3 !py-1.5 !text-xs`}>
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                Manage Team
              </Link>
              <Link to="/settings/integrations" className={`${secondaryButton} !px-3 !py-1.5 !text-xs`}>
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                Integrations
              </Link>
            </div>
          </div>
        </div>

        <div className={panel} aria-label="Organization snapshot">
          <div className="divide-y divide-[#252D38]">
            <div className="pb-3">
              <div className="text-2xl font-black text-white">{data.stats.employees}</div>
              <div className="text-xs text-slate-400 mt-0.5">Employees in scope</div>
            </div>
            <div className="py-3">
              <div className="text-2xl font-black text-white">{data.stats.departments}</div>
              <div className="text-xs text-slate-400 mt-0.5">Departments</div>
            </div>
            <div className="py-3">
              <div className="text-2xl font-black text-white">{data.stats.campaignsToDate}</div>
              <div className="text-xs text-slate-400 mt-0.5">Campaigns to date</div>
            </div>
            <div className="pt-3">
              <div className="text-2xl font-black text-[#2FD9C7]">{consentPct}%</div>
              <div className="text-xs text-slate-400 mt-0.5 mb-2">Employee consent coverage</div>
              <div className="h-1.5 rounded-full bg-[#232D39] overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-[#2FD9C7]" style={{ width: `${consentPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile */}
      <section aria-label="Organization profile" className={panel}>
        <SectionHeader
          icon={Building2}
          title="Organization Profile"
          subtitle="Identity and defaults applied to new campaigns"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            id="org-name"
            labelText="Organization Name"
            value={data.profile.name}
            onChange={(v) => updateProfile({ name: v })}
            placeholder="Meridian Financial Group"
          />
          <Field
            id="org-domain"
            labelText="Organization Domain"
            value={data.profile.domain}
            onChange={() => undefined}
            readOnly
            hint="Locked at domain verification — contact PhishYou support to change."
          />
          <Field
            id="org-industry"
            labelText="Industry"
            value={data.profile.industry}
            onChange={(v) => updateProfile({ industry: v })}
            placeholder="Financial Services"
          />
          <Field
            id="org-hq"
            labelText="Headquarters"
            value={data.profile.headquarters}
            onChange={(v) => updateProfile({ headquarters: v })}
            placeholder="London, United Kingdom"
          />
          <div>
            <label htmlFor="org-tier" className={label}>
              Default Tier
            </label>
            <select
              id="org-tier"
              value={data.profile.defaultTier}
              onChange={(e) => updateProfile({ defaultTier: e.target.value as Tier })}
              className={input}
            >
              <option value="A">Tier A — Aggressive</option>
              <option value="B">Tier B — Balanced</option>
              <option value="C">Tier C — Cautious</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Applied to new campaigns. Tier A shifts harm monitoring and intensity responsibility to the organization.
            </p>
          </div>
          <div>
            <label htmlFor="org-language" className={label}>
              Default Language
            </label>
            <select
              id="org-language"
              value={data.profile.defaultLanguage}
              onChange={(e) => updateProfile({ defaultLanguage: e.target.value as OrgProfile['defaultLanguage'] })}
              className={input}
            >
              <option value="en">English</option>
              <option value="ur">Roman Urdu</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Used for simulation scripts, personas and debriefs.</p>
          </div>
          <Field
            id="org-ciso-name"
            labelText="CISO Name"
            value={data.profile.cisoName}
            onChange={(v) => updateProfile({ cisoName: v })}
            placeholder="Laura Mitchell"
          />
          <Field
            id="org-ciso-email"
            labelText="CISO Email"
            type="email"
            value={data.profile.cisoEmail}
            onChange={(v) => updateProfile({ cisoEmail: v })}
            placeholder="ciso@company.com"
          />
          <Field
            id="org-legal-email"
            labelText="Legal Contact Email"
            type="email"
            value={data.profile.legalContactEmail}
            onChange={(v) => updateProfile({ legalContactEmail: v })}
            placeholder="legal@company.com"
            hint="Receives compliance notices and DPA updates."
          />
        </div>
        <SaveRow onSave={saveProfile} saving={saving} saved={saved} />
      </section>

      {/* Organizational attestation */}
      <section aria-label="Organizational attestation" className={panel}>
        <SectionHeader
          icon={ShieldCheck}
          title="Organizational Attestation"
          subtitle="Versioned authorization required before any simulation can run"
        />

        {/* Status banner */}
        <div
          className={`rounded-xl border p-5 ${
            expiringSoon ? 'bg-amber-400/10 border-amber-400/30' : 'bg-[#06D369]/10 border-[#06D369]/30'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {expiringSoon ? (
                <AlertTriangle className="w-6 h-6 text-[#F59E0B] shrink-0" aria-hidden="true" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-[#06D369] shrink-0" aria-hidden="true" />
              )}
              <div>
                <h3 className={`text-base font-bold ${expiringSoon ? 'text-[#F59E0B]' : 'text-[#06D369]'}`}>
                  {expiringSoon ? `Attestation expires in ${daysLeft} days` : 'Current attestation is valid'}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  v{data.attestation.version} · Attested by {data.attestation.attestedBy} ·{' '}
                  {formatDate(data.attestation.attestedAt)} · Expires {formatDate(data.attestation.expiresAt)}
                  {!expiringSoon && ` (${daysLeft} days)`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {renewed && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#06D369]">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Attestation renewed
                </span>
              )}
              <button type="button" onClick={downloadPdf} disabled={downloading} className={secondaryButton}>
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : downloaded ? (
                  <Check className="w-4 h-4 text-[#06D369]" aria-hidden="true" />
                ) : (
                  <Download className="w-4 h-4" aria-hidden="true" />
                )}
                {downloading ? 'Preparing…' : downloaded ? 'Downloaded' : 'Download PDF'}
              </button>
              <button type="button" onClick={() => setShowReattest(true)} className={primaryButton}>
                <PenLine className="w-4 h-4" aria-hidden="true" />
                Re-attest
              </button>
            </div>
          </div>
        </div>

        {/* Responsibilities checklist */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Organization Responsibilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.requirements.map((r) => (
              <RequirementRow key={r.id} requirement={r} />
            ))}
          </div>
        </div>

        {/* History */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Attestation History</h3>
          <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr>
                  <th className={th}>Version</th>
                  <th className={th}>Attested By</th>
                  <th className={th}>Date</th>
                  <th className={`${th} text-right`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((h) => (
                  <tr key={h.version} className="hover:bg-white/5 transition-colors">
                    <td className={`${td} font-mono`}>v{h.version}</td>
                    <td className={td}>{h.attestedBy}</td>
                    <td className={`${td} text-xs text-slate-400`}>{formatDate(h.date)}</td>
                    <td className={`${td} text-right`}>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${historyBadge[h.status]}`}
                      >
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Compliance posture + legal & governance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section aria-label="Compliance posture" className={panel}>
          <SectionHeader
            icon={BadgeCheck}
            title="Compliance Posture"
            subtitle="Regulatory frameworks applicable to this organization"
          />
          <div className="grid grid-cols-2 gap-3">
            {data.compliance.map((item) => (
              <ComplianceCard key={item.framework} item={item} />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Jurisdictions are configured under Compliance &amp; Legal settings; retention schedules follow the
            organization's data protection policy.
          </p>
        </section>

        <section aria-label="Legal and governance" className={panel}>
          <SectionHeader
            icon={Scale}
            title="Legal &amp; Governance"
            subtitle="Documents and protocols the organization must maintain"
          />
          <div>
            {data.governance.map((item) => (
              <GovernanceRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>

      {/* Oversight contacts + tier responsibility model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section aria-label="Oversight contacts" className={panel}>
          <SectionHeader
            icon={Phone}
            title="Oversight Contacts"
            subtitle="Named owners reachable during active campaigns"
          />
          <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className={th}>Role</th>
                  <th className={th}>Name</th>
                  <th className={th}>Email</th>
                  <th className={`${th} text-right`}>Reachable</th>
                </tr>
              </thead>
              <tbody>
                {data.contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className={`${td} text-xs text-slate-400`}>{c.role}</td>
                    <td className={`${td} text-sm text-white`}>{c.name}</td>
                    <td className={`${td} font-mono text-xs`}>{c.email}</td>
                    <td className={`${td} text-right`}>
                      {c.reachable ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#06D369]">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Reachable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[#F59E0B]">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Unconfirmed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Contact roles are assigned under Team &amp; Roles. HR and security owners must be reachable for the full
            duration of any active campaign.
          </p>
        </section>

        <section aria-label="Tier responsibility model" className={panel}>
          <SectionHeader
            icon={Layers}
            title="Tier Responsibility Model"
            subtitle="How accountability shifts as campaign intensity increases"
          />
          <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className={th}>Area</th>
                  <th className={`${th} !text-[#06D369]`}>Tier C</th>
                  <th className={`${th} !text-[#F59E0B]`}>Tier B</th>
                  <th className={`${th} !text-[#FF4757]`}>Tier A</th>
                </tr>
              </thead>
              <tbody>
                {TIER_RESPONSIBILITY.map((row) => (
                  <tr key={row.area} className="hover:bg-white/5 transition-colors">
                    <td className={`${td} text-sm text-white`}>{row.area}</td>
                    <td className={`${td} text-xs text-slate-400`}>{row.c}</td>
                    <td className={`${td} text-xs text-slate-400`}>{row.b}</td>
                    <td className={`${td} text-xs text-slate-300`}>{row.a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            PhishYou is a tool; the deploying organization is the actor. Tier A provides transparency — the
            organization provides judgment.
          </p>
        </section>
      </div>

      {/* Departments */}
      <section aria-label="Departments" className={panel}>
        <SectionHeader
          icon={Users}
          title="Departments"
          subtitle="Rollout, consent coverage and risk by department"
        />
        <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr>
                <th className={th}>Department</th>
                <th className={th}>Employees</th>
                <th className={th}>Campaigns</th>
                <th className={th}>Avg Resistance Score</th>
                <th className={th}>Compromise Rate</th>
                <th className={th}>Consent Coverage</th>
              </tr>
            </thead>
            <tbody>
              {data.departments.map((d) => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors">
                  <td className={`${td} text-sm text-white`}>{d.name}</td>
                  <td className={`${td} font-mono text-sm`}>{d.employees}</td>
                  <td className={`${td} font-mono text-sm`}>
                    {d.campaigns > 0 ? d.campaigns : <span className="text-slate-500">—</span>}
                  </td>
                  <td className={td}>
                    <span className="font-mono text-sm" style={{ color: resistanceColor(d.avgResistance) }}>
                      {d.avgResistance.toFixed(2)}
                    </span>
                  </td>
                  <td className={td}>
                    <span className="font-mono text-sm" style={{ color: compromiseColor(d.compromiseRate) }}>
                      {d.campaigns > 0 ? `${Math.round(d.compromiseRate * 100)}%` : '—'}
                    </span>
                  </td>
                  <td className={td}>
                    <CoverageBar value={d.consentCoverage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Resistance uses the 0–1 engagement score — green indicates resilient departments, red indicates compromise
          progression.
        </p>
      </section>

      <p className="text-xs text-slate-500 flex items-start gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        Attestations are versioned — material program changes require re-attestation. PhishYou may suspend an account
        for guardrail circumvention attempts.
      </p>

      {/* Re-attestation dialog */}
      {showReattest && (
        <ReAttestDialog
          nextVersion={bumpVersion(data.attestation.version)}
          signerDefault={data.profile.cisoName}
          submitting={submittingAttestation}
          onClose={() => setShowReattest(false)}
          onSubmit={submitAttestation}
        />
      )}
    </div>
  );
}
