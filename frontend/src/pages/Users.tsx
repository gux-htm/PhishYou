/**
 * PhishYou — Users (`/users`)
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 16: Organization Settings →
 *       "Settings: Team & Roles" (member table with Edit Role / Remove
 *       actions and the Invite Team Member dialog; the capability matrix
 *       itself lives on the Settings page) + PHISHYOU_SPECS/
 *       08_ETHICAL_FRAMEWORKS/ORGANIZATIONAL_RESPONSIBILITY_MODEL.md
 *       (role/accountability model) and 12_COMPLIANCE/DATA_PROTECTION.md
 *       §6 (role → data-classification access).
 *
 * Console access management:
 * - KPI strip: team size, seat usage against the plan quota, MFA
 *   coverage and privileged-role count.
 * - Team members table: role badges, MFA status, relative last-login,
 *   Edit Role and Remove actions (the account owner is locked).
 * - Pending invites: resend / revoke actions, 7-day single-use
 *   invitations that hold a seat until accepted or revoked.
 * - Roles overview: the five console roles with live member counts —
 *   the full API-scope matrix is linked from Settings.
 * - Invite / Edit Role / Remove dialogs — all with demo-mode fallbacks
 *   so the page works without a backend.
 *
 * Data: GET /api/v1/organizations/me/users. Falls back to embedded demo
 * data when the API is unreachable so the page renders correctly without
 * a running backend.
 */
import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  Edit3,
  Loader2,
  Mail,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Console roles — ids match the Settings capability matrix. */
const ROLES = [
  { id: 'ciso', name: 'CISO' },
  { id: 'manager', name: 'Security Manager' },
  { id: 'analyst', name: 'Security Analyst' },
  { id: 'hr', name: 'HR / Debrief' },
  { id: 'auditor', name: 'Auditor' },
] as const;

type RoleId = (typeof ROLES)[number]['id'];

type InviteStatus = 'pending' | 'expired';

/** A person with console access. */
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  mfaEnabled: boolean;
  lastLoginAt: string | null; // ISO — null = never signed in
  isOwner: boolean; // account owner — role locked, removal blocked
}

/** An outstanding (or lapsed) invitation. */
interface TeamInvite {
  id: string;
  email: string;
  role: RoleId;
  invitedBy: string;
  invitedAt: string; // ISO
  status: InviteStatus;
}

interface UsersData {
  seatLimit: number; // plan quota — mirrors Settings → Billing (6 of 10 in use)
  members: TeamMember[];
  invites: TeamInvite[];
}

/* ------------------------------------------------------------------ */
/* Meta constants                                                      */
/* ------------------------------------------------------------------ */

const roleMeta: Record<RoleId, { label: string; className: string }> = {
  ciso: { label: 'CISO', className: 'bg-[#2FD9C7]/10 text-[#2FD9C7]' },
  manager: { label: 'Security Manager', className: 'bg-blue-500/10 text-[#5B9EFF]' },
  analyst: { label: 'Security Analyst', className: 'bg-purple-400/10 text-[#A78BFA]' },
  hr: { label: 'HR / Debrief', className: 'bg-pink-400/10 text-[#F472B6]' },
  auditor: { label: 'Auditor', className: 'bg-slate-400/10 text-slate-400' },
};

/** Same copy as the Settings → Team & Roles cards. */
const ROLE_DESCRIPTIONS: { id: RoleId; name: string; description: string }[] = [
  { id: 'ciso', name: 'CISO', description: 'Accountable owner — full access, attestation signer, Tier A approvals.' },
  { id: 'manager', name: 'Security Manager', description: 'Runs the simulation program — creates, halts and reviews campaigns.' },
  { id: 'analyst', name: 'Security Analyst', description: 'Monitors live campaigns and analyzes After-Action Reports.' },
  { id: 'hr', name: 'HR / Debrief Officer', description: 'Owns debriefs, wellbeing follow-up and consent records.' },
  { id: 'auditor', name: 'Auditor', description: 'Read-only — verifies the audit chain and exports evidence.' },
];

const inviteStatusMeta: Record<InviteStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-400/10 text-[#F59E0B]' },
  expired: { label: 'Expired', className: 'bg-slate-400/10 text-slate-400' },
};

const INVITE_EXPIRY_DAYS = 7;

/* ------------------------------------------------------------------ */
/* Demo data (used when API unreachable)                               */
/* ------------------------------------------------------------------ */

function minutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

const DEMO_DATA: UsersData = {
  seatLimit: 10,
  members: [
    {
      id: 'user_laura',
      name: 'Laura Mitchell',
      email: 'ciso@company.com',
      role: 'ciso',
      mfaEnabled: true,
      lastLoginAt: minutesAgo(12),
      isOwner: true,
    },
    {
      id: 'user_imran',
      name: 'Imran Qureshi',
      email: 'security@company.com',
      role: 'manager',
      mfaEnabled: true,
      lastLoginAt: minutesAgo(140),
      isOwner: false,
    },
    {
      id: 'user_maya',
      name: 'Maya Chen',
      email: 'maya.chen@company.com',
      role: 'analyst',
      mfaEnabled: true,
      lastLoginAt: minutesAgo(45),
      isOwner: false,
    },
    {
      id: 'user_ahmed',
      name: 'Ahmed Siddiqui',
      email: 'ahmed.siddiqui@company.com',
      role: 'analyst',
      mfaEnabled: false,
      lastLoginAt: minutesAgo(2900),
      isOwner: false,
    },
    {
      id: 'user_amna',
      name: 'Amna Raza',
      email: 'hr@company.com',
      role: 'hr',
      mfaEnabled: true,
      lastLoginAt: minutesAgo(1560),
      isOwner: false,
    },
    {
      id: 'user_sarah',
      name: 'Sarah Kim',
      email: 'sarah.kim@company.com',
      role: 'auditor',
      mfaEnabled: true,
      lastLoginAt: minutesAgo(9800),
      isOwner: false,
    },
  ],
  invites: [
    {
      id: 'invite_zara',
      email: 'zara.sheikh@company.com',
      role: 'analyst',
      invitedBy: 'Imran Qureshi',
      invitedAt: minutesAgo(860),
      status: 'pending',
    },
    {
      id: 'invite_legal',
      email: 'legal@company.com',
      role: 'auditor',
      invitedBy: 'Laura Mitchell (CISO)',
      invitedAt: minutesAgo(4320),
      status: 'pending',
    },
    {
      id: 'invite_elena',
      email: 'elena.petrova@company.com',
      role: 'manager',
      invitedBy: 'Laura Mitchell (CISO)',
      invitedAt: minutesAgo(21600),
      status: 'expired',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Fetch + helpers                                                     */
/* ------------------------------------------------------------------ */

async function fetchUsers(): Promise<UsersData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('/api/v1/organizations/me/users', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as UsersData;
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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Compact relative time for last-login / invite columns. */
function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 8) return `${days} d ago`;
  return formatDate(iso);
}

/** Pending invites older than the expiry window count as expired. */
function inviteEffectiveStatus(invite: TeamInvite): InviteStatus {
  if (invite.status === 'expired') return 'expired';
  const ageMs = Date.now() - new Date(invite.invitedAt).getTime();
  return ageMs > INVITE_EXPIRY_DAYS * 86_400_000 ? 'expired' : 'pending';
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

function RoleBadge({ role }: { role: RoleId }) {
  const meta = roleMeta[role];
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function InviteStatusBadge({ status }: { status: InviteStatus }) {
  const meta = inviteStatusMeta[status];
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

/** MFA enrollment indicator for the members table. */
function MfaBadge({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#06D369]">
      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
      Enabled
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#FF4757]">
      <ShieldOff className="w-4 h-4" aria-hidden="true" />
      Off
    </span>
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
}: {
  titleId: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-[#2D3748] bg-[#1D232D] p-6 shadow-lg max-h-[85vh] overflow-y-auto"
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

/** Invite a teammate — single-use, expires after 7 days, holds a seat. */
function InviteDialog({
  usedSeats,
  seatLimit,
  existingEmails,
  busy,
  onClose,
  onInvite,
}: {
  usedSeats: number;
  seatLimit: number;
  existingEmails: string[];
  busy: boolean;
  onClose: () => void;
  onInvite: (email: string, role: RoleId) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleId>('analyst');
  const [error, setError] = useState<string | null>(null);

  const seatsFull = usedSeats >= seatLimit;
  const roleHint = ROLE_DESCRIPTIONS.find((r) => r.id === role)?.description ?? '';

  function invite(): void {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError('Enter a valid work email address.');
      return;
    }
    if (existingEmails.includes(trimmed)) {
      setError('That address already has access or a pending invite.');
      return;
    }
    if (seatsFull) {
      setError(`All ${seatLimit} seats are in use — free a seat or upgrade the plan.`);
      return;
    }
    onInvite(trimmed, role);
  }

  return (
    <DialogShell
      titleId="invite-title"
      title="Invite Team Member"
      subtitle="Sends a single-use invitation valid for 7 days."
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryButton} onClick={invite} disabled={busy || seatsFull}>
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Mail className="w-4 h-4" aria-hidden="true" />
            )}
            Send Invite
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="invite-email" className={label}>
            Work Email
          </label>
          <input
            id="invite-email"
            type="email"
            className={input}
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
          />
        </div>
        <div>
          <label htmlFor="invite-role" className={label}>
            Console Role
          </label>
          <select
            id="invite-role"
            className={input}
            value={role}
            onChange={(e) => setRole(e.target.value as RoleId)}
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1.5">{roleHint}</p>
        </div>
        <div className="rounded-lg border border-[#2D3748] bg-[#15191F] p-3 text-xs text-slate-400">
          {usedSeats} of {seatLimit} seats in use — an invitation holds a seat until it is
          accepted or revoked.
        </div>
        {error && (
          <p className="text-sm text-[#FF4757]" role="alert">
            {error}
          </p>
        )}
      </div>
    </DialogShell>
  );
}

/** Change a member's console role — changes are audited. */
function EditRoleDialog({
  member,
  busy,
  onClose,
  onSave,
}: {
  member: TeamMember;
  busy: boolean;
  onClose: () => void;
  onSave: (role: RoleId) => void;
}) {
  const [role, setRole] = useState<RoleId>(member.role);
  const changed = role !== member.role;

  return (
    <DialogShell
      titleId="edit-role-title"
      title="Edit Role"
      subtitle={`${member.name} — ${member.email}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButton}
            onClick={() => onSave(role)}
            disabled={busy || !changed}
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Edit3 className="w-4 h-4" aria-hidden="true" />
            )}
            Save Changes
          </button>
        </>
      }
    >
      <fieldset className="space-y-2">
        <legend className="sr-only">Console role</legend>
        {ROLE_DESCRIPTIONS.map((r) => {
          const active = role === r.id;
          return (
            <label
              key={r.id}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors duration-200 ${
                active
                  ? 'border-[#2FD9C7] bg-[#2FD9C7]/5'
                  : 'border-[#2D3748] bg-[#15191F] hover:border-[#3D4860]'
              }`}
            >
              <input
                type="radio"
                name={`role-${member.id}`}
                value={r.id}
                checked={active}
                onChange={() => setRole(r.id)}
                className="mt-0.5 accent-[#2FD9C7]"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{r.name}</span>
                  {member.role === r.id && (
                    <span className="rounded-full bg-[#232D39] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Current
                    </span>
                  )}
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">{r.description}</span>
              </span>
            </label>
          );
        })}
      </fieldset>
      <p className="text-xs text-slate-500 mt-4">
        Role changes apply immediately and are written to the audit chain with the actor, the
        previous role and the new one.
      </p>
    </DialogShell>
  );
}

/** Remove console access — audit history stays immutable (retention policy). */
function RemoveMemberDialog({
  member,
  busy,
  onClose,
  onRemove,
}: {
  member: TeamMember;
  busy: boolean;
  onClose: () => void;
  onRemove: () => void;
}) {
  return (
    <DialogShell
      titleId="remove-member-title"
      title="Remove Team Member"
      subtitle={`${member.name} — ${member.email}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={destructiveButton} onClick={onRemove} disabled={busy}>
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            )}
            Remove Access
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-lg border border-[#FF4757]/30 bg-[#FF4757]/5 p-4">
        <AlertTriangle className="w-5 h-5 text-[#FF4757] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-slate-300">
          Remove console access for <span className="font-semibold text-white">{member.name}</span>?
          This cannot be undone from the console.
        </p>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-400 list-disc pl-5">
        <li>Sessions are terminated and API keys are revoked immediately.</li>
        <li>Their seat is released for reassignment or a new invitation.</li>
        <li>
          Historical audit records are retained per the retention policy — attribution of past
          actions is preserved.
        </li>
      </ul>
    </DialogShell>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Users() {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog state — only one dialog is open at a time
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchUsers()
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

  async function handleInvite(email: string, role: RoleId): Promise<void> {
    await mutate('/api/v1/organizations/me/users/invites', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        invites: [
          {
            id: `invite_${Date.now()}`,
            email,
            role,
            invitedBy: 'Laura Mitchell (CISO)',
            invitedAt: new Date().toISOString(),
            status: 'pending',
          },
          ...prev.invites,
        ],
      };
    });
    setInviteOpen(false);
  }

  async function handleSaveRole(member: TeamMember, role: RoleId): Promise<void> {
    await mutate(`/api/v1/organizations/me/users/${member.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    setData((prev) =>
      prev
        ? { ...prev, members: prev.members.map((m) => (m.id === member.id ? { ...m, role } : m)) }
        : prev,
    );
    setEditing(null);
  }

  async function handleRemoveMember(member: TeamMember): Promise<void> {
    await mutate(`/api/v1/organizations/me/users/${member.id}`, { method: 'DELETE' });
    setData((prev) => (prev ? { ...prev, members: prev.members.filter((m) => m.id !== member.id) } : prev));
    setRemoving(null);
  }

  async function handleResendInvite(invite: TeamInvite): Promise<void> {
    await mutate(`/api/v1/organizations/me/users/invites/${invite.id}/resend`, { method: 'POST' });
    setData((prev) =>
      prev
        ? {
            ...prev,
            invites: prev.invites.map((i) =>
              i.id === invite.id
                ? { ...i, invitedAt: new Date().toISOString(), status: 'pending' as InviteStatus }
                : i,
            ),
          }
        : prev,
    );
  }

  async function handleRevokeInvite(invite: TeamInvite): Promise<void> {
    await mutate(`/api/v1/organizations/me/users/invites/${invite.id}`, { method: 'DELETE' });
    setData((prev) => (prev ? { ...prev, invites: prev.invites.filter((i) => i.id !== invite.id) } : prev));
  }

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#2FD9C7]" aria-hidden="true" />
          <p className="text-sm text-slate-400">Loading team…</p>
        </div>
      </div>
    );
  }

  // Expired invitations no longer hold a seat — recompute on every render.
  const invites = data.invites.map((i) => ({ ...i, status: inviteEffectiveStatus(i) }));
  const pendingInvites = invites.filter((i) => i.status === 'pending');
  const usedSeats = data.members.length + pendingInvites.length;
  const mfaEnabled = data.members.filter((m) => m.mfaEnabled).length;
  const privileged = data.members.filter((m) => m.role === 'ciso' || m.role === 'manager').length;
  const seatsFull = usedSeats >= data.seatLimit;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-slate-400 mt-1">
            Console access and role assignment — every action is attributed and audited.
          </p>
        </div>
        <button
          type="button"
          className={primaryButton}
          onClick={() => setInviteOpen(true)}
          disabled={seatsFull}
          title={seatsFull ? `All ${data.seatLimit} seats are in use` : undefined}
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Invite Team Member
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard>
          <div className="text-4xl font-black text-white">{data.members.length}</div>
          <div className="text-sm text-slate-400 mt-1">Team Members</div>
          <div className="text-xs text-slate-500 mt-1.5">People with console access</div>
        </KpiCard>
        <KpiCard>
          <div className="text-4xl font-black text-white">
            {usedSeats}
            <span className="text-xl text-slate-400"> / {data.seatLimit}</span>
          </div>
          <div className="text-sm text-slate-400 mt-1">Seats In Use</div>
          <SplitBar
            segments={[
              { value: usedSeats, color: '#2FD9C7' },
              { value: Math.max(0, data.seatLimit - usedSeats), color: '#3D4860' },
            ]}
          />
          <div className="text-xs text-slate-500 mt-1.5">
            {pendingInvites.length} pending invitation{pendingInvites.length === 1 ? '' : 's'} holding a
            seat
          </div>
        </KpiCard>
        <KpiCard>
          <div className="text-4xl font-black text-white">
            {Math.round((mfaEnabled / data.members.length) * 100)}%
          </div>
          <div className="text-sm text-slate-400 mt-1">MFA Coverage</div>
          <SplitBar
            segments={[
              { value: mfaEnabled, color: '#06D369' },
              { value: data.members.length - mfaEnabled, color: '#FF4757' },
            ]}
          />
          <div className="text-xs text-slate-500 mt-1.5">
            {mfaEnabled} of {data.members.length} enrolled — required for console access
          </div>
        </KpiCard>
        <KpiCard>
          <div className="text-4xl font-black text-white">{privileged}</div>
          <div className="text-sm text-slate-400 mt-1">Privileged Roles</div>
          <div className="text-xs text-slate-500 mt-1.5">
            CISO + Security Manager — Tier A approvals and campaign control
          </div>
        </KpiCard>
      </div>

      {/* Team members table */}
      <section className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6" aria-label="Team members">
        <h2 className="text-base font-bold text-white mb-1">Team Members</h2>
        <p className="text-sm text-slate-400 mb-4">Console users — the account owner's role is locked.</p>
        <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead>
              <tr>
                <th className={th}>Member</th>
                <th className={th}>Role</th>
                <th className={th}>MFA</th>
                <th className={th}>Last Login</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr key={m.id} className="transition-colors duration-150 hover:bg-white/5">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {initials(m.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{m.name}</span>
                          {m.isOwner && (
                            <span className="rounded-full bg-[#2FD9C7]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#2FD9C7]">
                              Owner
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={td}>
                    <RoleBadge role={m.role} />
                  </td>
                  <td className={td}>
                    <MfaBadge enabled={m.mfaEnabled} />
                  </td>
                  <td className={td}>
                    <span className="text-xs text-slate-400">
                      {m.lastLoginAt ? timeAgo(m.lastLoginAt) : 'Never'}
                    </span>
                  </td>
                  <td className={`${td} text-right`}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => setEditing(m)}
                        disabled={m.isOwner}
                        title={m.isOwner ? 'Owner — role locked' : 'Edit role'}
                        aria-label={`Edit role for ${m.name}`}
                      >
                        <Edit3 className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={dangerIconButton}
                        onClick={() => setRemoving(m)}
                        disabled={m.isOwner}
                        title={m.isOwner ? 'Owner cannot be removed' : 'Remove from team'}
                        aria-label={`Remove ${m.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invitations */}
      <section
        className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6"
        aria-label="Invitations"
      >
        <h2 className="text-base font-bold text-white mb-1">Invitations</h2>
        <p className="text-sm text-slate-400 mb-4">
          Single-use invitations expire after {INVITE_EXPIRY_DAYS} days and hold a seat until
          accepted or revoked.
        </p>
        {invites.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center border border-dashed border-[#2D3748] rounded-xl">
            No open invitations — use Invite Team Member to add someone.
          </p>
        ) : (
          <div className="border border-[#2D3748] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr>
                  <th className={th}>Email</th>
                  <th className={th}>Role</th>
                  <th className={th}>Invited By</th>
                  <th className={th}>Sent</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.id} className="transition-colors duration-150 hover:bg-white/5">
                    <td className={td}>
                      <span className="text-sm font-medium text-white">{i.email}</span>
                    </td>
                    <td className={td}>
                      <RoleBadge role={i.role} />
                    </td>
                    <td className={td}>
                      <span className="text-xs text-slate-400">{i.invitedBy}</span>
                    </td>
                    <td className={td}>
                      <span className="text-xs text-slate-400">{timeAgo(i.invitedAt)}</span>
                    </td>
                    <td className={td}>
                      <InviteStatusBadge status={i.status} />
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className={iconButton}
                          onClick={() => handleResendInvite(i)}
                          disabled={busy}
                          title={i.status === 'expired' ? 'Resend — renews the invitation' : 'Resend invitation'}
                          aria-label={`Resend invitation to ${i.email}`}
                        >
                          <Mail className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={dangerIconButton}
                          onClick={() => handleRevokeInvite(i)}
                          disabled={busy || i.status !== 'pending'}
                          title={i.status !== 'pending' ? 'Already expired — seat released' : 'Revoke invitation'}
                          aria-label={`Revoke invitation for ${i.email}`}
                        >
                          <Ban className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Console roles overview */}
      <section className="bg-[#111827] border border-[#2D3748] rounded-xl p-5 sm:p-6" aria-label="Console roles">
        <h2 className="text-base font-bold text-white mb-1">Console Roles</h2>
        <p className="text-sm text-slate-400 mb-4">
          Five roles with distinct accountability — assignments show live member counts.
        </p>
        <div className="space-y-2">
          {ROLE_DESCRIPTIONS.map((r) => {
            const count = data.members.filter((m) => m.role === r.id).length;
            const pending = pendingInvites.filter((i) => i.role === r.id).length;
            return (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-[#2D3748] bg-[#15191F] p-4"
              >
                <RoleBadge role={r.id} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{r.name}</div>
                  <p className="text-xs text-slate-400 mt-0.5">{r.description}</p>
                </div>
                <div className="text-xs text-slate-400 shrink-0">
                  {count === 0 && pending === 0
                    ? 'No members'
                    : `${count} member${count === 1 ? '' : 's'}${pending > 0 ? ` · ${pending} pending` : ''}`}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Full API scopes and data classifications per role:{' '}
          <Link to="/settings" className="text-[#2FD9C7] hover:underline">
            Settings — Team &amp; Roles
          </Link>
        </p>
      </section>

      {/* Dialogs */}
      {inviteOpen && (
        <InviteDialog
          usedSeats={usedSeats}
          seatLimit={data.seatLimit}
          existingEmails={[
            ...data.members.map((m) => m.email),
            ...pendingInvites.map((i) => i.email),
          ]}
          busy={busy}
          onClose={() => setInviteOpen(false)}
          onInvite={handleInvite}
        />
      )}
      {editing && (
        <EditRoleDialog
          member={editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={(role) => handleSaveRole(editing, role)}
        />
      )}
      {removing && (
        <RemoveMemberDialog
          member={removing}
          busy={busy}
          onClose={() => setRemoving(null)}
          onRemove={() => handleRemoveMember(removing)}
        />
      )}
    </div>
  );
}
