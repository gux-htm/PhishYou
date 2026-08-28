/**
 * PhishYou — Campaign creation wizard
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 3 (wizard) + IMPLEMENTATION_CHECKLIST.md
 *       PHISHYOU_SPECS/03_AI_AGENT_CORE/PERSONA_LIBRARY.md (persona metadata)
 *       PHISHYOU_SPECS/08_ETHICAL_FRAMEWORKS/CONSENT_FRAMEWORK.md (attestation)
 *
 * Four steps, validated before advancing:
 *   1. Campaign Basics — name, type, tier, duration, objective, notes
 *   2. Targets & Consent — target roster (consent mandatory) + CISO attestation
 *   3. AI Configuration — persona, triggers, intensity, attack chain, OSINT
 *   4. Delivery & Execution — platforms, sender identity, media, schedule
 * "Review & Launch" opens a ConfirmationDialog summarizing the draft; confirming
 * calls createCampaign (live API, demo fallback) and routes to the new campaign.
 */
import { ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Rocket,
  Smartphone,
  Trash2,
  UserCheck,
} from 'lucide-react';
import type {
  CampaignDraft,
  CampaignLanguage,
  CampaignObjective,
  CampaignType,
  Platform,
  Tier,
  TriggerType,
  WizardTarget,
} from '../../types';
import { ATTACK_CHAINS, DEPARTMENTS, PERSONAS, TARGET_ROLES, createCampaign } from '../../services/campaigns';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { useToast } from '../../hooks/useToast';
import { TIER_LABEL, platformLabel } from '../../utils/formatters';

/* ------------------------------------------------------------------ */
/* Options & labels                                                     */
/* ------------------------------------------------------------------ */

const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  email_credential_harvest: 'Email Credential Harvest',
  whatsapp_payment: 'WhatsApp Payment Diversion',
  multi_channel_authority: 'Multi-Channel Authority',
  social_recruiter_harvest: 'Social Recruiter Harvest',
  regional_fintech: 'Regional Fintech Verification',
  cognitive_load: 'Cognitive Load Stress Test',
};

const OBJECTIVES: CampaignObjective[] = ['Credential Harvest', 'Payment Diversion', 'Data Disclosure Test', 'Policy Stress Test'];

const TRIGGERS: TriggerType[] = ['Authority', 'Urgency', 'Fear', 'Social Proof', 'Reciprocity'];

const LANGUAGES: { value: CampaignLanguage; label: string }[] = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'ur-PK', label: 'Urdu (Pakistan)' },
  { value: 'ur-RM', label: 'Roman Urdu' },
  { value: 'fr-FR', label: 'French' },
];

const TIMEZONES = ['Asia/Karachi', 'UTC', 'Europe/London', 'America/New_York', 'Asia/Dubai', 'Asia/Singapore'];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PLATFORMS: { value: Platform; icon: typeof Mail; hint: string }[] = [
  { value: 'email', icon: Mail, hint: 'Spoofed corporate email' },
  { value: 'whatsapp', icon: MessageCircle, hint: 'WhatsApp Business sender' },
  { value: 'sms', icon: Smartphone, hint: 'Short-code SMS' },
  { value: 'voice', icon: Phone, hint: 'Synthesized voice call' },
  { value: 'linkedin', icon: MessageCircle, hint: 'Recruiter DM' },
  { value: 'instagram', icon: MessageCircle, hint: 'Verified-style DM' },
];

const TIER_CARDS: { value: Tier; title: string; description: string; badge: string }[] = [
  {
    value: 'A',
    title: 'Aggressive',
    description: 'High-pressure multi-channel chains. Harm detection off — organization assumes responsibility. Requires CISO attestation.',
    badge: 'border-[#FF4757]/40 bg-[#FF4757]/[0.06] text-[#FF7B86]',
  },
  {
    value: 'B',
    title: 'Balanced',
    description: 'Moderate pressure with optional harm detection and measured persistence. Recommended default.',
    badge: 'border-[#F59E0B]/40 bg-[#F59E0B]/[0.06] text-[#F6BF5C]',
  },
  {
    value: 'C',
    title: 'Cautious',
    description: 'Low pressure, single-channel, mandatory harm detection with auto-pause. Best for first runs.',
    badge: 'border-[#06D369]/40 bg-[#06D369]/[0.06] text-[#58E6A0]',
  },
];

const INTENSITY_LABELS = ['Very subtle', 'Subtle', 'Moderate', 'Strong', 'Extreme'];

const ATTESTATION_CHECKS = [
  'Signed consent is on file for every target listed in this campaign.',
  'I accept oversight responsibility for this campaign, including live monitoring and halt authority.',
  'I understand all campaign activity is recorded in the immutable, hash-chained audit log.',
];

const SAMPLE_TARGETS: Omit<WizardTarget, 'id'>[] = [
  { name: 'Alice Johnson', email: 'alice.johnson@company.com', department: 'Finance', role: 'Manager', consentOnFile: true },
  { name: 'Bilal Hassan', email: 'bilal.hassan@company.com', department: 'Finance', role: 'Analyst', consentOnFile: true },
  { name: 'Sana Iqbal', email: 'sana.iqbal@company.com', department: 'Human Resources', role: 'Coordinator', consentOnFile: true },
];

/* ------------------------------------------------------------------ */
/* Shared class strings                                                 */
/* ------------------------------------------------------------------ */

const input =
  'w-full rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2.5 text-sm text-white ' +
  'placeholder:text-[#5A6470] transition-all duration-200 ease-out ' +
  'focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30';

const selectCls =
  'rounded-lg border border-[#2D3748] bg-[#1D232D] px-3 py-2.5 text-sm text-white ' +
  'transition-all duration-200 ease-out focus:border-[#2FD9C7] focus:outline-none focus:ring-2 focus:ring-[#2FD9C7]/30';

const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#3D4860] bg-[#2D3748] ' +
  'px-4 py-2.5 text-sm font-medium text-slate-100 transition-all duration-200 ease-out ' +
  'hover:bg-[#232D39] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#2FD9C7] px-4 py-2.5 text-sm ' +
  'font-semibold text-[#0F1219] transition-all duration-200 ease-out hover:bg-[#4FE5D3] ' +
  'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

const labelCls = 'mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#7A8595]';

const panel = 'rounded-2xl border border-[#2D3748] bg-[#15191F] p-5 sm:p-6';

/* ------------------------------------------------------------------ */
/* Small building blocks                                                */
/* ------------------------------------------------------------------ */

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-[#5A6470]">{hint}</p>}
    </div>
  );
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mt-1 text-sm text-[#7A8595]">{description}</p>
    </div>
  );
}

function AuthorityBars({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Authority level ${level} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`h-1 w-3 rounded-full ${i < level ? 'bg-[#5B9EFF]' : 'bg-[#232D39]'}`} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Wizard                                                               */
/* ------------------------------------------------------------------ */

const INITIAL_DRAFT: CampaignDraft = {
  name: '',
  type: '',
  tier: '',
  durationValue: 7,
  durationUnit: 'Days',
  objective: '',
  notes: '',
  targets: [],
  attestation: { checked: [], cisoName: '', cisoEmail: '', signedAt: null },
  personaId: '',
  primaryTrigger: '',
  secondaryTrigger: '',
  intensity: 3,
  attackChainId: '',
  osintContext: '',
  platforms: [],
  sender: { fromName: '', fromEmail: '', replyTo: '', displayName: '', fromNumber: '', voiceProfile: '' },
  voiceMessages: false,
  voiceLanguage: 'en-US',
  voiceTone: 'Professional',
  documentGeneration: false,
  documentType: '',
  windowFrom: '09:00',
  windowTo: '18:00',
  timezone: 'Asia/Karachi',
  sendDays: [1, 2, 3, 4, 5],
  language: 'en-US',
};

const STEPS = [
  { label: 'Basics', hint: 'Name, type, tier & duration' },
  { label: 'Targets & Consent', hint: 'Roster and CISO attestation' },
  { label: 'AI Configuration', hint: 'Persona, triggers, attack chain' },
  { label: 'Delivery', hint: 'Channels, identity & schedule' },
];

export interface CampaignWizardProps {
  /** Called after a successful launch (default: navigate to the new campaign). */
  onLaunched?: (campaignId: string, demo: boolean) => void;
}

export function CampaignWizard({ onLaunched }: CampaignWizardProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CampaignDraft>(INITIAL_DRAFT);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [targetForm, setTargetForm] = useState({ name: '', email: '', phone: '', department: 'Finance', role: 'Individual Contributor', consent: false });
  const [targetError, setTargetError] = useState<string | null>(null);

  const patch = (changes: Partial<CampaignDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const tierA = draft.tier === 'A';

  /* ---------------------------- validation ---------------------------- */

  const stepValid = useMemo((): boolean[] => {
    const basics =
      draft.name.trim().length >= 3 &&
      draft.type !== '' &&
      draft.tier !== '' &&
      draft.durationValue > 0 &&
      draft.objective !== '';
    const targetsOk =
      draft.targets.length > 0 &&
      draft.targets.every((t) => t.consentOnFile && t.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)) &&
      draft.attestation.signedAt !== null &&
      draft.attestation.checked.length === ATTESTATION_CHECKS.length;
    const ai =
      draft.personaId !== '' &&
      draft.attackChainId !== '' &&
      draft.primaryTrigger !== '' &&
      (draft.secondaryTrigger === '' || draft.secondaryTrigger !== draft.primaryTrigger);
    const needsEmailSender = draft.platforms.includes('email');
    const needsNumber = draft.platforms.includes('whatsapp') || draft.platforms.includes('sms');
    const needsVoice = draft.platforms.includes('voice');
    const delivery =
      draft.platforms.length > 0 &&
      draft.windowFrom < draft.windowTo &&
      draft.sendDays.length > 0 &&
      (!needsEmailSender || (draft.sender.fromName.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.sender.fromEmail))) &&
      (!needsNumber || draft.sender.fromNumber.trim() !== '') &&
      (!needsVoice || draft.sender.voiceProfile.trim() !== '');
    return [basics, targetsOk, ai, delivery];
  }, [draft]);

  const dirty = draft.name.trim() !== '' || draft.targets.length > 0;
  const allValid = stepValid.every(Boolean);

  /* ------------------------------ actions ----------------------------- */

  const changeTier = (tier: Tier) => {
    setDraft((current) => {
      const next = { ...current, tier };
      // Release locked persona/chain selections when leaving Tier A.
      if (tier !== 'A') {
        const persona = PERSONAS.find((p) => p.id === current.personaId);
        if (persona?.tierALocked) next.personaId = '';
        const chain = ATTACK_CHAINS.find((c) => c.id === current.attackChainId);
        if (chain?.tierALocked) next.attackChainId = '';
      }
      return next;
    });
  };

  const togglePlatform = (platform: Platform) => {
    setDraft((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((p) => p !== platform)
        : [...current.platforms, platform],
    }));
  };

  const toggleSendDay = (day: number) => {
    setDraft((current) => ({
      ...current,
      sendDays: current.sendDays.includes(day)
        ? current.sendDays.filter((d) => d !== day)
        : [...current.sendDays, day].sort((a, b) => a - b),
    }));
  };

  const addTarget = () => {
    setTargetError(null);
    const { name, email, phone, department, role, consent } = targetForm;
    if (name.trim().length < 2) return setTargetError('Enter the target\u2019s full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setTargetError('Enter a valid work email address.');
    if (draft.targets.some((t) => t.email.toLowerCase() === email.toLowerCase())) {
      return setTargetError('This email is already on the roster.');
    }
    if (!consent) return setTargetError('Consent must be on file before a target can be added.');
    const target: WizardTarget = {
      id: `target_${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      department,
      role,
      consentOnFile: true,
    };
    patch({ targets: [...draft.targets, target] });
    setTargetForm({ name: '', email: '', phone: '', department: 'Finance', role: 'Individual Contributor', consent: false });
  };

  const removeTarget = (id: string) => patch({ targets: draft.targets.filter((t) => t.id !== id) });

  const addSampleTargets = () => {
    const existing = new Set(draft.targets.map((t) => t.email.toLowerCase()));
    const additions = SAMPLE_TARGETS.filter((t) => !existing.has(t.email.toLowerCase())).map((t, i) => ({
      ...t,
      id: `target_sample_${Date.now().toString(36)}_${i}`,
    }));
    if (additions.length === 0) return;
    patch({ targets: [...draft.targets, ...additions] });
  };

  const signAttestation = () => {
    if (draft.attestation.cisoName.trim().length < 2) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.attestation.cisoEmail)) return;
    patch({ attestation: { ...draft.attestation, signedAt: new Date().toISOString() } });
    toast.success('Attestation signed', 'The consent record is now part of the audit trail.');
  };

  const launch = async () => {
    setLaunching(true);
    try {
      const { id, demo } = await createCampaign(draft);
      toast.success(
        'Campaign launched',
        demo ? 'Demo mode — the campaign was created locally.' : 'The orchestrator is spinning up the AI agent.',
      );
      if (onLaunched) onLaunched(id, demo);
      else navigate(`/campaigns/${id}`);
    } catch {
      toast.error('Launch failed', 'The campaign could not be created. Please try again.');
    } finally {
      setLaunching(false);
      setReviewOpen(false);
    }
  };

  const goto = (next: number) => {
    if (next > step && !stepValid[step]) return; // cannot advance past an invalid step
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  };

  /* ------------------------------ render ------------------------------ */

  const persona = PERSONAS.find((p) => p.id === draft.personaId);
  const chain = ATTACK_CHAINS.find((c) => c.id === draft.attackChainId);

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <nav aria-label="Wizard progress" className={panel}>
        <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-2">
          {STEPS.map((s, i) => {
            const state = i === step ? 'current' : i < step ? 'done' : 'todo';
            const reachable = i <= step || stepValid.slice(0, i).every(Boolean) || stepValid[step];
            return (
              <li key={s.label} className="flex flex-1 items-start gap-3">
                <button
                  type="button"
                  onClick={() => reachable && goto(i)}
                  disabled={!reachable}
                  className="flex items-center gap-3 text-left disabled:cursor-not-allowed"
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                      state === 'done'
                        ? 'border-[#06D369]/40 bg-[#06D369]/10 text-[#06D369]'
                        : state === 'current'
                          ? 'border-[#2FD9C7] bg-[#2FD9C7] text-[#0F1219]'
                          : 'border-[#2D3748] bg-[#1D232D] text-[#5A6470]'
                    }`}
                  >
                    {state === 'done' ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                  </span>
                  <span>
                    <span className={`block text-sm font-semibold ${state === 'todo' ? 'text-[#5A6470]' : 'text-[#F5F7FB]'}`}>
                      {s.label}
                    </span>
                    <span className="block text-xs text-[#7A8595]">{s.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step body */}
      <div className={panel} key={step}>
        {step === 0 && (
          <>
            <StepHeader title="Campaign basics" description="Identity, tier and ground rules for the simulation." />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Campaign name" htmlFor="wizard-name" hint="Visible in the campaign list and audit log.">
                  <input
                    id="wizard-name"
                    className={input}
                    value={draft.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder="e.g. Finance Team Payment Verification Q4"
                    maxLength={80}
                  />
                </Field>
              </div>
              <Field label="Campaign type" htmlFor="wizard-type">
                <select id="wizard-type" className={selectCls} value={draft.type} onChange={(e) => patch({ type: e.target.value as CampaignType })}>
                  <option value="">Select a type…</option>
                  {(Object.keys(CAMPAIGN_TYPE_LABELS) as CampaignType[]).map((type) => (
                    <option key={type} value={type}>
                      {CAMPAIGN_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Primary objective" htmlFor="wizard-objective">
                <select id="wizard-objective" className={selectCls} value={draft.objective} onChange={(e) => patch({ objective: e.target.value as CampaignObjective })}>
                  <option value="">Select an objective…</option>
                  {OBJECTIVES.map((objective) => (
                    <option key={objective} value={objective}>
                      {objective}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Duration" htmlFor="wizard-duration" hint="Total engagement window from first contact.">
                <div className="flex items-center gap-2">
                  <input
                    id="wizard-duration"
                    type="number"
                    min={1}
                    max={90}
                    className={input}
                    value={draft.durationValue}
                    onChange={(e) => patch({ durationValue: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  <select
                    className={selectCls}
                    value={draft.durationUnit}
                    onChange={(e) => patch({ durationUnit: e.target.value as CampaignDraft['durationUnit'] })}
                    aria-label="Duration unit"
                  >
                    <option value="Days">Days</option>
                    <option value="Hours">Hours</option>
                  </select>
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes (internal)" htmlFor="wizard-notes" hint="Context for your team — never shown to targets.">
                  <textarea
                    id="wizard-notes"
                    className={`${input} min-h-24 resize-y`}
                    value={draft.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                    placeholder="Context, scope boundaries, stakeholders to notify…"
                    maxLength={500}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6">
              <p className={labelCls}>Aggression tier</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {TIER_CARDS.map((card) => {
                  const selected = draft.tier === card.value;
                  return (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() => changeTier(card.value)}
                      aria-pressed={selected}
                      className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                        selected
                          ? 'border-[#2FD9C7] bg-[#2FD9C7]/[0.06] shadow-[0_0_20px_rgba(47,217,199,0.12)]'
                          : 'border-[#2D3748] bg-[#1D232D] hover:border-[#3D4860]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Tier {card.value}</span>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${card.badge}`}>
                          {card.title}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#7A8595]">{card.description}</p>
                    </button>
                  );
                })}
              </div>
              {draft.tier === 'A' && (
                <p className="mt-3 flex items-start gap-2 rounded-lg border border-[#FF4757]/20 bg-[#FF4757]/[0.06] px-3 py-2 text-xs text-[#FF9AA4]">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Tier A runs without automated harm pauses. A CISO attestation is required in step 2.
                </p>
              )}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <StepHeader title="Targets & consent" description="Every target must have signed consent on file before launch." />

            {/* Add-target form */}
            <div className="rounded-xl border border-[#2D3748] bg-[#1D232D] p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <input className={input} placeholder="Full name" aria-label="Target full name" value={targetForm.name} onChange={(e) => setTargetForm({ ...targetForm, name: e.target.value })} />
                <input className={input} placeholder="Work email" type="email" aria-label="Target work email" value={targetForm.email} onChange={(e) => setTargetForm({ ...targetForm, email: e.target.value })} />
                <input className={input} placeholder="Phone (optional)" aria-label="Target phone" value={targetForm.phone} onChange={(e) => setTargetForm({ ...targetForm, phone: e.target.value })} />
                <select className={selectCls} aria-label="Department" value={targetForm.department} onChange={(e) => setTargetForm({ ...targetForm, department: e.target.value })}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <select className={selectCls} aria-label="Role" value={targetForm.role} onChange={(e) => setTargetForm({ ...targetForm, role: e.target.value })}>
                  {TARGET_ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2.5 rounded-lg border border-[#2D3748] bg-[#15191F] px-3 py-2.5 text-sm text-[#A8B4C4]">
                  <input
                    type="checkbox"
                    checked={targetForm.consent}
                    onChange={(e) => setTargetForm({ ...targetForm, consent: e.target.checked })}
                    className="h-4 w-4 rounded border-[#3D4860] bg-[#1D232D] accent-[#2FD9C7]"
                  />
                  Signed consent on file
                </label>
              </div>
              {targetError && (
                <p role="alert" className="mt-3 flex items-center gap-2 text-xs text-[#FF9AA4]">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  {targetError}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" className={primaryButton} onClick={addTarget}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add target
                </button>
                <button type="button" className={secondaryButton} onClick={addSampleTargets}>
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                  Add sample team
                </button>
              </div>
            </div>

            {/* Roster */}
            <div className="mt-5">
              <p className={labelCls}>
                Roster — {draft.targets.length} target{draft.targets.length === 1 ? '' : 's'}
              </p>
              {draft.targets.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#2D3748] px-4 py-8 text-center text-sm text-[#7A8595]">
                  No targets yet. Add at least one consented target to continue.
                </p>
              ) : (
                <ul className="divide-y divide-[#2D3748] rounded-xl border border-[#2D3748]">
                  {draft.targets.map((target) => (
                    <li key={target.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#232D39] text-xs font-bold text-[#A8B4C4]">
                        {target.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{target.name}</p>
                        <p className="truncate text-xs text-[#7A8595]">
                          {target.email} · {target.department} · {target.role}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 rounded-md bg-[#06D369]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#06D369]">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Consent
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTarget(target.id)}
                        className="rounded-lg border border-[#3D4860] p-1.5 text-[#7A8595] transition-colors hover:border-[#FF4757]/50 hover:text-[#FF4757]"
                        aria-label={`Remove ${target.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Attestation */}
            <div className="mt-6 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/[0.04] p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                <FileText className="h-4 w-4 text-[#F6BF5C]" aria-hidden="true" />
                CISO attestation
              </p>
              <p className="mt-1 text-xs text-[#7A8595]">
                Required for every campaign regardless of tier ({TIER_LABEL[draft.tier as Tier] ?? 'tier pending'}).
              </p>
              <ul className="mt-3 space-y-2">
                {ATTESTATION_CHECKS.map((check, i) => {
                  const checked = draft.attestation.checked.includes(i);
                  return (
                    <li key={check}>
                      <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-[#A8B4C4]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            patch({
                              attestation: {
                                ...draft.attestation,
                                checked: e.target.checked
                                  ? [...draft.attestation.checked, i]
                                  : draft.attestation.checked.filter((c) => c !== i),
                              },
                            })
                          }
                          className="mt-0.5 h-4 w-4 rounded border-[#3D4860] bg-[#1D232D] accent-[#2FD9C7]"
                        />
                        {check}
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  className={input}
                  placeholder="CISO full name"
                  aria-label="CISO full name"
                  value={draft.attestation.cisoName}
                  onChange={(e) => patch({ attestation: { ...draft.attestation, cisoName: e.target.value } })}
                  disabled={draft.attestation.signedAt !== null}
                />
                <input
                  className={input}
                  placeholder="CISO email"
                  type="email"
                  aria-label="CISO email"
                  value={draft.attestation.cisoEmail}
                  onChange={(e) => patch({ attestation: { ...draft.attestation, cisoEmail: e.target.value } })}
                  disabled={draft.attestation.signedAt !== null}
                />
              </div>
              {draft.attestation.signedAt ? (
                <p className="mt-3 flex items-center gap-2 text-xs text-[#06D369]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Signed by {draft.attestation.cisoName} · {new Date(draft.attestation.signedAt).toLocaleString('en-US')}
                </p>
              ) : (
                <button
                  type="button"
                  className={`${primaryButton} mt-4`}
                  onClick={signAttestation}
                  disabled={
                    draft.attestation.checked.length !== ATTESTATION_CHECKS.length ||
                    draft.attestation.cisoName.trim().length < 2 ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.attestation.cisoEmail)
                  }
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Sign attestation
                </button>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <StepHeader title="AI configuration" description="Choose the persona and attack chain the agent will execute." />

            <p className={labelCls}>Persona</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PERSONAS.map((p) => {
                const locked = p.tierALocked && !tierA;
                const selected = draft.personaId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={locked}
                    onClick={() => patch({ personaId: p.id })}
                    aria-pressed={selected}
                    className={`rounded-xl border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
                      selected
                        ? 'border-[#2FD9C7] bg-[#2FD9C7]/[0.06] shadow-[0_0_20px_rgba(47,217,199,0.12)]'
                        : 'border-[#2D3748] bg-[#1D232D] hover:border-[#3D4860]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-white">{p.name}</span>
                      <span className="font-mono text-[10px] text-[#5A6470]">{p.id}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#7A8595]">{p.role}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <AuthorityBars level={p.authorityLevel} />
                      {locked && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#5A6470]">
                          <Lock className="h-3 w-3" aria-hidden="true" />
                          Tier A only
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] text-[#5A6470]">Best pairing: {p.bestTriggerPairing}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Primary trigger" htmlFor="wizard-primary">
                <select id="wizard-primary" className={selectCls} value={draft.primaryTrigger} onChange={(e) => patch({ primaryTrigger: e.target.value as TriggerType })}>
                  <option value="">Select…</option>
                  {TRIGGERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Secondary trigger (optional)" htmlFor="wizard-secondary">
                <select
                  id="wizard-secondary"
                  className={selectCls}
                  value={draft.secondaryTrigger}
                  onChange={(e) => patch({ secondaryTrigger: e.target.value as TriggerType | '' })}
                >
                  <option value="">None</option>
                  {TRIGGERS.filter((t) => t !== draft.primaryTrigger).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Trigger intensity" htmlFor="wizard-intensity" hint="Intensity 5 is typically reserved for Tier A campaigns.">
                <div className="flex flex-wrap gap-2" id="wizard-intensity" role="group" aria-label="Trigger intensity">
                  {INTENSITY_LABELS.map((label, i) => {
                    const value = (i + 1) as CampaignDraft['intensity'];
                    const selected = draft.intensity === value;
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => patch({ intensity: value })}
                        className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                          selected
                            ? 'border-[#2FD9C7] bg-[#2FD9C7]/[0.08] text-[#2FD9C7]'
                            : 'border-[#2D3748] bg-[#1D232D] text-[#7A8595] hover:border-[#3D4860] hover:text-[#A8B4C4]'
                        }`}
                      >
                        {value} · {label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <div className="mt-6">
              <p className={labelCls}>Attack chain</p>
              <div className="space-y-2">
                {ATTACK_CHAINS.map((c) => {
                  const locked = c.tierALocked && !tierA;
                  const selected = draft.attackChainId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={locked}
                      onClick={() => patch({ attackChainId: c.id })}
                      aria-pressed={selected}
                      className={`flex w-full flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${
                        selected ? 'border-[#2FD9C7] bg-[#2FD9C7]/[0.06]' : 'border-[#2D3748] bg-[#1D232D] hover:border-[#3D4860]'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-[#5A6470]">{c.id}</span>
                      <span className="min-w-0 flex-1 text-sm font-semibold text-white">{c.name}</span>
                      {locked ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#5A6470]">
                          <Lock className="h-3 w-3" aria-hidden="true" />
                          Tier A only
                        </span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-1.5">
                          {c.steps.map((stepInfo, i) => (
                            <span key={i} className="rounded-md bg-[#232D39] px-2 py-0.5 text-[10px] text-[#A8B4C4]">
                              {platformLabel(stepInfo.platform)} · {stepInfo.trigger}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <Field
                label="OSINT context (optional)"
                htmlFor="wizard-osint"
                hint="Publicly available context the agent may weave into messages — never private data."
              >
                <textarea
                  id="wizard-osint"
                  className={`${input} min-h-24 resize-y`}
                  value={draft.osintContext}
                  onChange={(e) => patch({ osintContext: e.target.value })}
                  placeholder="e.g. Company announced a supplier-portal migration this quarter; targets expect change-management emails."
                  maxLength={600}
                />
              </Field>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <StepHeader title="Delivery & execution" description="Channels, sender identity, generated media and the contact schedule." />

            <p className={labelCls}>Channels</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PLATFORMS.map(({ value, icon: Icon, hint }) => {
                const selected = draft.platforms.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => togglePlatform(value)}
                    aria-pressed={selected}
                    className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                      selected
                        ? 'border-[#2FD9C7] bg-[#2FD9C7]/[0.06] shadow-[0_0_20px_rgba(47,217,199,0.12)]'
                        : 'border-[#2D3748] bg-[#1D232D] hover:border-[#3D4860]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="h-4 w-4 text-[#A8B4C4]" aria-hidden="true" />
                      {selected && <Check className="h-4 w-4 text-[#2FD9C7]" aria-hidden="true" />}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">{platformLabel(value)}</p>
                    <p className="mt-0.5 text-[10px] text-[#5A6470]">{hint}</p>
                  </button>
                );
              })}
            </div>

            {(draft.platforms.includes('email') || draft.platforms.includes('linkedin') || draft.platforms.includes('instagram')) && (
              <div className="mt-6">
                <p className={labelCls}>Sender identity</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={input} placeholder="From name (e.g. Priya Sharma)" aria-label="From name" value={draft.sender.fromName} onChange={(e) => patch({ sender: { ...draft.sender, fromName: e.target.value } })} />
                  <input className={input} placeholder="From email (e.g. payments@company-verify.io)" type="email" aria-label="From email" value={draft.sender.fromEmail} onChange={(e) => patch({ sender: { ...draft.sender, fromEmail: e.target.value } })} />
                  <input className={input} placeholder="Reply-to (optional)" type="email" aria-label="Reply-to email" value={draft.sender.replyTo} onChange={(e) => patch({ sender: { ...draft.sender, replyTo: e.target.value } })} />
                  <input className={input} placeholder="Display name (e.g. Payments Dept)" aria-label="Display name" value={draft.sender.displayName} onChange={(e) => patch({ sender: { ...draft.sender, displayName: e.target.value } })} />
                </div>
              </div>
            )}

            {(draft.platforms.includes('whatsapp') || draft.platforms.includes('sms')) && (
              <div className="mt-5">
                <Field label="Sender number" htmlFor="wizard-number" hint="Virtual number used for WhatsApp / SMS delivery.">
                  <input id="wizard-number" className={input} placeholder="+92 300 0000000" value={draft.sender.fromNumber} onChange={(e) => patch({ sender: { ...draft.sender, fromNumber: e.target.value } })} />
                </Field>
              </div>
            )}

            {draft.platforms.includes('voice') && (
              <div className="mt-5 space-y-3 rounded-xl border border-[#2D3748] bg-[#1D232D] p-4">
                <label className="flex items-center justify-between text-sm text-[#A8B4C4]">
                  <span>Synthesized voice messages</span>
                  <input
                    type="checkbox"
                    checked={draft.voiceMessages}
                    onChange={(e) => patch({ voiceMessages: e.target.checked })}
                    className="h-4 w-4 rounded border-[#3D4860] bg-[#15191F] accent-[#2FD9C7]"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={input} placeholder="Voice profile (e.g. CFO-male-40s)" aria-label="Voice profile" value={draft.sender.voiceProfile} onChange={(e) => patch({ sender: { ...draft.sender, voiceProfile: e.target.value } })} />
                  {draft.voiceMessages && (
                    <>
                      <select className={selectCls} aria-label="Voice language" value={draft.voiceLanguage} onChange={(e) => patch({ voiceLanguage: e.target.value })}>
                        {LANGUAGES.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                      <select className={selectCls} aria-label="Voice tone" value={draft.voiceTone} onChange={(e) => patch({ voiceTone: e.target.value })}>
                        {['Professional', 'Friendly', 'Authoritative', 'Calm'].map((tone) => (
                          <option key={tone}>{tone}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-xl border border-[#2D3748] bg-[#1D232D] p-4">
              <label className="flex items-center justify-between text-sm text-[#A8B4C4]">
                <span>Generate supporting documents (PDF attachments)</span>
                <input
                  type="checkbox"
                  checked={draft.documentGeneration}
                  onChange={(e) => patch({ documentGeneration: e.target.checked })}
                  className="h-4 w-4 rounded border-[#3D4860] bg-[#15191F] accent-[#2FD9C7]"
                />
              </label>
              {draft.documentGeneration && (
                <select className={`${selectCls} mt-3`} aria-label="Document type" value={draft.documentType} onChange={(e) => patch({ documentType: e.target.value })}>
                  <option value="">Select a document type…</option>
                  {['Invoice', 'Audit Report', 'Policy Notice', 'Offer Letter'].map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <Field label="Contact window — from" htmlFor="wizard-window-from">
                <input id="wizard-window-from" type="time" className={input} value={draft.windowFrom} onChange={(e) => patch({ windowFrom: e.target.value })} />
              </Field>
              <Field label="Contact window — to" htmlFor="wizard-window-to">
                <input id="wizard-window-to" type="time" className={input} value={draft.windowTo} onChange={(e) => patch({ windowTo: e.target.value })} />
              </Field>
              <Field label="Timezone" htmlFor="wizard-timezone">
                <select id="wizard-timezone" className={selectCls} value={draft.timezone} onChange={(e) => patch({ timezone: e.target.value })}>
                  {TIMEZONES.map((tz) => (
                    <option key={tz}>{tz}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-5">
              <p className={labelCls}>Send days</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Send days">
                {WEEKDAYS.map((day, i) => {
                  const selected = draft.sendDays.includes(i);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleSendDay(i)}
                      className={`min-h-11 w-14 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                        selected
                          ? 'border-[#2FD9C7] bg-[#2FD9C7]/[0.08] text-[#2FD9C7]'
                          : 'border-[#2D3748] bg-[#1D232D] text-[#7A8595] hover:border-[#3D4860]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 sm:max-w-xs">
              <Field label="Message language" htmlFor="wizard-language">
                <select id="wizard-language" className={selectCls} value={draft.language} onChange={(e) => patch({ language: e.target.value as CampaignLanguage })}>
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </>
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className={secondaryButton}
          onClick={() => (step === 0 ? (dirty ? setDiscardOpen(true) : navigate('/campaigns')) : setStep(step - 1))}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        <div className="flex items-center gap-3">
          {!stepValid[step] && (
            <span className="text-xs text-[#7A8595]">Complete the required fields to continue.</span>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className={primaryButton} onClick={() => goto(step + 1)} disabled={!stepValid[step]}>
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className={primaryButton} onClick={() => setReviewOpen(true)} disabled={!allValid}>
              <Rocket className="h-4 w-4" aria-hidden="true" />
              Review & launch
            </button>
          )}
        </div>
      </div>

      {/* Review & launch dialog */}
      <ConfirmationDialog
        open={reviewOpen}
        title="Launch campaign"
        confirmLabel={launching ? 'Launching…' : 'Launch campaign'}
        busy={launching}
        onConfirm={launch}
        onCancel={() => setReviewOpen(false)}
        description={
          <div className="space-y-2 text-sm">
            <p>You are about to launch:</p>
            <dl className="rounded-lg border border-[#2D3748] bg-[#15191F] p-3 text-xs leading-6">
              <div className="flex justify-between gap-4">
                <dt className="text-[#7A8595]">Campaign</dt>
                <dd className="text-right font-semibold text-white">{draft.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#7A8595]">Tier / type</dt>
                <dd className="text-right text-white">
                  Tier {draft.tier} · {draft.type ? CAMPAIGN_TYPE_LABELS[draft.type] : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#7A8595]">Targets</dt>
                <dd className="text-right text-white">{draft.targets.length} consented</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#7A8595]">Persona / chain</dt>
                <dd className="text-right text-white">
                  {persona?.name ?? '—'} · {chain?.id ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#7A8595]">Channels</dt>
                <dd className="text-right text-white">{draft.platforms.map(platformLabel).join(', ')}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#7A8595]">Window</dt>
                <dd className="text-right text-white">
                  {draft.windowFrom}–{draft.windowTo} {draft.timezone}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#7A8595]">Attestation</dt>
                <dd className="text-right text-white">
                  {draft.attestation.signedAt ? `Signed — ${draft.attestation.cisoName}` : 'Missing'}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-[#7A8595]">
              All engagement is recorded in the immutable audit log. You can pause or halt at any time from the campaign page or live monitor.
            </p>
          </div>
        }
      />

      {/* Discard dialog */}
      <ConfirmationDialog
        open={discardOpen}
        title="Discard draft?"
        confirmLabel="Discard draft"
        destructive
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          navigate('/campaigns');
        }}
        description="The draft you started will be lost. This does not affect any existing campaigns."
      />
    </div>
  );
}

export default CampaignWizard;
