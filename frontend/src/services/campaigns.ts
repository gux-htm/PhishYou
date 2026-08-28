/**
 * PhishYou — Campaign service
 * Spec: PHISHYOU_SPECS/02_ARCHITECTURE/API_CONTRACTS.md §1 (Campaign management)
 *
 * Every call attempts the live API first and falls back to demo data so the
 * frontend stays fully explorable without a backend (hackathon demo mode).
 */
import { apiFetch } from './api';
import { daysAgoIso, minutesAgoIso } from '../utils/formatters';
import type {
  AttackChain,
  CampaignDetailData,
  CampaignDraft,
  CampaignFilters,
  CampaignSummary,
  Persona,
  Platform,
} from '../types';

const BASE = '/api/v1/campaigns';

/* ------------------------------------------------------------------ */
/* Personas & attack chains (shared with the wizard)                   */
/* ------------------------------------------------------------------ */

export const PERSONAS: Persona[] = [
  { id: 'P-01', name: 'John Smith', role: 'IT Support Technician', authorityLevel: 2, bestTriggerPairing: 'Authority + Urgency', platforms: ['email', 'whatsapp'] },
  { id: 'P-02', name: 'Bank Security Team', role: 'Fraud Prevention Unit', authorityLevel: 4, bestTriggerPairing: 'Fear + Authority', platforms: ['email', 'sms', 'whatsapp'] },
  { id: 'P-03', name: 'CEO / Executive', role: 'Office of the CEO', authorityLevel: 5, bestTriggerPairing: 'Authority', platforms: ['email', 'voice'] },
  { id: 'P-04', name: 'Trusted Colleague', role: 'Peer — Same Department', authorityLevel: 2, bestTriggerPairing: 'Reciprocity + Social Proof', platforms: ['whatsapp', 'instagram'] },
  { id: 'P-05', name: 'Recruiter', role: 'Executive Search', authorityLevel: 2, bestTriggerPairing: 'Reciprocity + Urgency', platforms: ['linkedin', 'email'] },
  { id: 'P-06', name: 'Vendor Rep', role: 'Strategic Supplier', authorityLevel: 2, bestTriggerPairing: 'Urgency + Reciprocity', platforms: ['email', 'whatsapp'] },
  { id: 'P-07', name: 'Government / Regulator', role: 'Compliance Authority', authorityLevel: 5, bestTriggerPairing: 'Authority + Fear', platforms: ['email', 'voice'], tierALocked: true },
  { id: 'P-08', name: 'Delivery / Courier', role: 'Logistics Dispatcher', authorityLevel: 1, bestTriggerPairing: 'Urgency', platforms: ['sms', 'whatsapp'] },
  { id: 'P-09', name: 'Telecom / Fintech Officer', role: 'Account Services', authorityLevel: 4, bestTriggerPairing: 'Authority + Urgency', platforms: ['sms', 'whatsapp', 'voice'] },
  { id: 'P-10', name: 'IT Security Lead', role: 'Security Operations', authorityLevel: 4, bestTriggerPairing: 'Authority + Fear', platforms: ['email', 'voice'] },
];

export const ATTACK_CHAINS: AttackChain[] = [
  { id: 'CHAIN-1', name: 'Credential Harvest — "The Mandatory Audit"', steps: [{ platform: 'email', trigger: 'Authority' }, { platform: 'email', trigger: 'Urgency' }] },
  { id: 'CHAIN-2', name: 'Payment Diversion — "The CFO\'s Wire"', steps: [{ platform: 'email', trigger: 'Authority' }, { platform: 'whatsapp', trigger: 'Urgency' }, { platform: 'voice', trigger: 'Authority' }] },
  { id: 'CHAIN-3', name: 'Recruiter Harvest — "The Dream Offer"', steps: [{ platform: 'linkedin', trigger: 'Reciprocity' }, { platform: 'email', trigger: 'Urgency' }] },
  { id: 'CHAIN-4', name: 'Colleague Lateral — "The Favor"', steps: [{ platform: 'whatsapp', trigger: 'Social Proof' }, { platform: 'whatsapp', trigger: 'Reciprocity' }] },
  { id: 'CHAIN-5', name: 'Regional Fintech — "Account Verification" (Roman Urdu)', steps: [{ platform: 'sms', trigger: 'Urgency' }, { platform: 'whatsapp', trigger: 'Authority' }, { platform: 'voice', trigger: 'Fear' }] },
  { id: 'CHAIN-6', name: 'Cognitive Overload — "Everything At Once"', steps: [{ platform: 'email', trigger: 'Urgency' }, { platform: 'sms', trigger: 'Fear' }, { platform: 'voice', trigger: 'Authority' }], tierALocked: true },
];

export const DEPARTMENTS = [
  'Finance', 'Engineering', 'Human Resources', 'Operations', 'Sales', 'Marketing', 'Legal', 'Executive', 'Other',
];

export const TARGET_ROLES = ['Manager', 'Individual Contributor', 'Analyst', 'Coordinator', 'Director', 'Clerk'];

/* ------------------------------------------------------------------ */
/* Demo data                                                           */
/* ------------------------------------------------------------------ */

export const DEMO_CAMPAIGNS: CampaignSummary[] = [
  {
    id: 'camp_2026_08_27_001', name: 'Finance Team Payment Verification Q3', type: 'whatsapp_payment',
    status: 'ACTIVE', tier: 'A', platforms: ['email', 'whatsapp'],
    targetsTotal: 6, targetsActive: 3, targetsResolved: 3, compromised: 2, defended: 1,
    avgResistanceScore: 0.58, createdAt: daysAgoIso(1), startedAt: daysAgoIso(1), endsAt: daysAgoIso(-6),
  },
  {
    id: 'camp_2026_08_27_002', name: 'HR Onboarding Reset Wave 2', type: 'email_credential_harvest',
    status: 'PAUSED', tier: 'B', platforms: ['email'],
    targetsTotal: 4, targetsActive: 2, targetsResolved: 2, compromised: 1, defended: 1,
    avgResistanceScore: 0.41, createdAt: daysAgoIso(2), startedAt: daysAgoIso(2), endsAt: daysAgoIso(-5),
  },
  {
    id: 'camp_2026_08_27_003', name: 'Executive Whaling Simulation', type: 'multi_channel_authority',
    status: 'ACTIVE', tier: 'A', platforms: ['voice', 'sms'],
    targetsTotal: 2, targetsActive: 1, targetsResolved: 1, compromised: 1, defended: 0,
    avgResistanceScore: 0.72, createdAt: daysAgoIso(0), startedAt: minutesAgoIso(18), endsAt: daysAgoIso(-9),
  },
  {
    id: 'camp_2026_08_20_004', name: 'Recruiter Dream Offer — Engineering', type: 'social_recruiter_harvest',
    status: 'COMPLETED', tier: 'B', platforms: ['linkedin', 'email'],
    targetsTotal: 9, targetsActive: 0, targetsResolved: 9, compromised: 4, defended: 5,
    avgResistanceScore: 0.46, createdAt: daysAgoIso(8), startedAt: daysAgoIso(8), endsAt: daysAgoIso(1),
  },
  {
    id: 'camp_2026_08_18_005', name: 'JazzCash Urgent Verification (Roman Urdu)', type: 'regional_fintech',
    status: 'COMPLETED', tier: 'C', platforms: ['sms', 'whatsapp', 'voice'],
    targetsTotal: 12, targetsActive: 0, targetsResolved: 12, compromised: 5, defended: 7,
    avgResistanceScore: 0.35, createdAt: daysAgoIso(10), startedAt: daysAgoIso(10), endsAt: daysAgoIso(3),
  },
  {
    id: 'camp_2026_08_11_006', name: 'Vendor Invoice Fraud Simulation', type: 'multi_channel_authority',
    status: 'HALTED', tier: 'B', platforms: ['email', 'whatsapp'],
    targetsTotal: 8, targetsActive: 0, targetsResolved: 5, compromised: 2, defended: 3,
    avgResistanceScore: 0.52, createdAt: daysAgoIso(17), startedAt: daysAgoIso(17), endsAt: daysAgoIso(15),
  },
  {
    id: 'camp_2026_08_05_007', name: 'Quarterly Access Recertification Phish', type: 'email_credential_harvest',
    status: 'COMPLETED', tier: 'C', platforms: ['email'],
    targetsTotal: 22, targetsActive: 0, targetsResolved: 22, compromised: 6, defended: 16,
    avgResistanceScore: 0.29, createdAt: daysAgoIso(23), startedAt: daysAgoIso(23), endsAt: daysAgoIso(16),
  },
];

/* ------------------------------------------------------------------ */
/* Filtering (client-side, applied to demo fallback too)               */
/* ------------------------------------------------------------------ */

export function applyCampaignFilters(campaigns: CampaignSummary[], filters: CampaignFilters): CampaignSummary[] {
  const search = filters.search?.trim().toLowerCase() ?? '';
  return campaigns.filter((campaign) => {
    if (search && !campaign.name.toLowerCase().includes(search) && !campaign.id.toLowerCase().includes(search)) return false;
    if (filters.status && filters.status !== 'ALL' && campaign.status !== filters.status) return false;
    if (filters.tier && filters.tier !== 'ALL' && campaign.tier !== filters.tier) return false;
    if (filters.platform && filters.platform !== 'ALL' && !campaign.platforms.includes(filters.platform)) return false;
    if (filters.from && new Date(campaign.createdAt) < new Date(`${filters.from}T00:00:00`)) return false;
    if (filters.to && new Date(campaign.createdAt) > new Date(`${filters.to}T23:59:59`)) return false;
    return true;
  });
}

/* ------------------------------------------------------------------ */
/* API calls (with demo fallbacks)                                     */
/* ------------------------------------------------------------------ */

/** GET /api/v1/campaigns — list with client-side filters. */
export async function listCampaigns(filters: CampaignFilters = {}): Promise<{ campaigns: CampaignSummary[]; demo: boolean }> {
  try {
    const campaigns = await apiFetch<CampaignSummary[]>(BASE);
    return { campaigns: applyCampaignFilters(campaigns, filters), demo: false };
  } catch {
    return { campaigns: applyCampaignFilters(DEMO_CAMPAIGNS, filters), demo: true };
  }
}

/** GET /api/v1/campaigns/:id — detail payload, demo fallback keeps id semantics. */
export async function getCampaignDetail(id: string): Promise<{ data: CampaignDetailData; demo: boolean }> {
  try {
    const data = await apiFetch<CampaignDetailData>(`${BASE}/${id}?include=config,targets,audit`);
    return { data, demo: false };
  } catch {
    return { data: buildDemoDetail(id), demo: true };
  }
}

/** POST /api/v1/campaigns — create; resolves to a synthetic CREATED campaign in demo mode. */
export async function createCampaign(draft: CampaignDraft): Promise<{ id: string; demo: boolean }> {
  try {
    const response = await apiFetch<{ campaign_id: string }>(BASE, {
      method: 'POST',
      body: normalizeDraftForApi(draft),
    });
    return { id: response.campaign_id, demo: false };
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 700)); // simulate launch latency
    return { id: `camp_${Date.now().toString(36)}`, demo: true };
  }
}

/** POST /api/v1/campaigns/:id/stop — halt (kill switch). */
export async function haltCampaign(id: string, reason: string): Promise<{ demo: boolean }> {
  try {
    await apiFetch(`${BASE}/${id}/stop`, { method: 'POST', body: { reason, stopped_by_admin: 'admin' } });
    return { demo: false };
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { demo: true };
  }
}

/** POST /api/v1/campaigns/:id/pause | /resume. */
export async function setCampaignPaused(id: string, paused: boolean): Promise<{ demo: boolean }> {
  const action = paused ? 'pause' : 'resume';
  try {
    await apiFetch(`${BASE}/${id}/${action}`, { method: 'POST' });
    return { demo: false };
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { demo: true };
  }
}

/* ------------------------------------------------------------------ */
/* Draft → API payload mapping (API_CONTRACTS.md §1.1)                 */
/* ------------------------------------------------------------------ */

export function normalizeDraftForApi(draft: CampaignDraft): Record<string, unknown> {
  return {
    name: draft.name,
    campaign_type: draft.type,
    tier: draft.tier,
    duration: draft.durationUnit === 'Days' ? `${draft.durationValue}d` : `${draft.durationValue}h`,
    objective: draft.objective,
    notes: draft.notes || undefined,
    targets: draft.targets.map((t) => ({
      name: t.name, email: t.email, phone: t.phone || undefined,
      department: t.department, role: t.role, consent_on_file: t.consentOnFile,
    })),
    attack_config: {
      persona_id: draft.personaId,
      primary_trigger: draft.primaryTrigger || undefined,
      secondary_trigger: draft.secondaryTrigger || undefined,
      trigger_intensity: draft.intensity,
      attack_chain_id: draft.attackChainId,
      osint_context: draft.osintContext || undefined,
    },
    platforms: draft.platforms,
    sender_identity: draft.sender,
    media: {
      voice_messages: draft.voiceMessages,
      voice_language: draft.voiceLanguage || undefined,
      voice_tone: draft.voiceTone || undefined,
      document_generation: draft.documentGeneration,
      document_type: draft.documentType || undefined,
    },
    schedule: {
      contact_window: { from: draft.windowFrom, to: draft.windowTo, timezone: draft.timezone },
      send_days: draft.sendDays,
      language: draft.language,
    },
    attestation: draft.attestation.signedAt
      ? { signed_by: draft.attestation.cisoName, email: draft.attestation.cisoEmail, signed_at: draft.attestation.signedAt }
      : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Demo detail builder                                                 */
/* ------------------------------------------------------------------ */

const DEMO_TARGET_NAMES = [
  ['Alice Johnson', 'Finance', 'Accounts Payable', 'COMPROMISED', 0.82],
  ['Bilal Hassan', 'Finance', 'Financial Analyst', 'IN_PROGRESS', 0.58],
  ['Sana Iqbal', 'Finance', 'Payroll Specialist', 'PAUSED', 0.41],
  ['Daniyal Raza', 'Finance', 'Controller', 'DEFENDED', 0.24],
  ['Hina Malik', 'Finance', 'AP Clerk', 'BLOCKED', 0.1],
  ['Omar Farooq', 'Finance', 'Treasury Analyst', 'ACTIVE', 0.66],
] as const;

function buildDemoDetail(id: string): CampaignDetailData {
  const summary =
    DEMO_CAMPAIGNS.find((c) => c.id === id) ??
    DEMO_CAMPAIGNS.find((c) => c.status === 'ACTIVE') ??
    DEMO_CAMPAIGNS[0];

  const targets: CampaignDetailData['targets'] = DEMO_TARGET_NAMES.map(([name, department, role, status, score], index) => ({
    id: `target_${index + 1}`,
    name: name as string,
    email: `${(name as string).split(' ')[0].toLowerCase()}.${(name as string).split(' ')[1].toLowerCase()}@company.com`,
    department: department as string,
    role: role as string,
    status: status as CampaignDetailData['targets'][number]['status'],
    resistanceScore: score as number,
    exchangesCount: status === 'ACTIVE' || status === 'IN_PROGRESS' ? index + 2 : 6 - index,
    platform: (summary.platforms[index % summary.platforms.length] ?? null) as Platform | null,
    lastActivityAt: minutesAgoIso(3 + index * 14),
    defenseMechanism:
      status === 'DEFENDED' ? 'Out-of-band verification' : status === 'BLOCKED' ? 'Blocked sender' : null,
    thread: [
      {
        id: `t${index}-m1`, from: 'ai' as const,
        content: 'Hi — Payments here. A supplier invoice is flagged for release today. Can you approve it before the 3pm cutoff?',
        tactic: 'URGENCY', platform: (summary.platforms[0] ?? 'email') as Platform, timestamp: minutesAgoIso(40 + index * 5),
      },
      {
        id: `t${index}-m2`, from: 'target' as const,
        content: 'Which invoice number? I don\u2019t see anything pending in my queue.',
        platform: (summary.platforms[0] ?? 'email') as Platform, timestamp: minutesAgoIso(36 + index * 5), resistanceScore: 0.35,
      },
      {
        id: `t${index}-m3`, from: 'ai' as const,
        content: 'INV-88214 — under my name in the approvals list. Finance policy allows delegation on cutoff-day approvals.',
        tactic: 'ESCALATE_AUTHORITY', platform: (summary.platforms[0] ?? 'email') as Platform, timestamp: minutesAgoIso(30 + index * 5),
      },
    ],
  }));

  return {
    campaign: summary,
    milestones: [
      { label: 'Created', reachedAt: summary.createdAt, current: false },
      { label: 'Consent Verified', reachedAt: summary.createdAt, current: false },
      { label: 'Active', reachedAt: summary.startedAt, current: summary.status === 'ACTIVE' || summary.status === 'PAUSED' },
      { label: summary.status === 'HALTED' ? 'Halted' : 'Completed', reachedAt: summary.endsAt, current: summary.status === 'COMPLETED' || summary.status === 'HALTED' },
    ],
    targets,
    platforms: summary.platforms.map((platform, index) => ({
      platform,
      status: (index === 2 && summary.status !== 'COMPLETED' ? 'Blocked' : 'Active') as 'Active' | 'Blocked',
      messagesSent: 12 + index * 9,
      deliveryRate: 0.94 + index * 0.02,
    })),
    config: {
      personaId: 'P-02',
      personaName: 'Bank Security Team',
      primaryTrigger: 'Authority',
      secondaryTrigger: 'Urgency',
      triggerIntensity: 4,
      attackChainId: 'CHAIN-2',
      attackChainName: 'Payment Diversion — "The CFO\'s Wire"',
      durationDays: 7,
      contactWindow: { from: '09:00', to: '18:00', timezone: 'Asia/Karachi' },
      language: 'en-US',
      harmDetection: summary.tier === 'C' ? 'tier_c_mandatory' : summary.tier === 'B' ? 'tier_b_enabled' : 'tier_a_disabled',
    },
    auditPreview: [
      { id: 'a1', timestamp: minutesAgoIso(3), eventType: 'TARGET_COMPROMISED', actor: 'system:orchestrator', campaignId: summary.id, campaignName: summary.name, targetName: 'Alice Johnson', summary: 'Credential entered on simulated portal', hash: '9f2c1ab4d0e7', payload: {} },
      { id: 'a2', timestamp: minutesAgoIso(18), eventType: 'CAMPAIGN_STARTED', actor: 'admin:security@company.com', campaignId: summary.id, campaignName: summary.name, targetName: null, summary: 'Campaign started — Tier A authorization confirmed', hash: '1c77e0aa93f5', payload: {} },
      { id: 'a3', timestamp: minutesAgoIso(41), eventType: 'HARM_DETECTED', actor: 'system:harm-detector', campaignId: summary.id, campaignName: summary.name, targetName: 'Sana Iqbal', summary: 'Distress score 0.70 — target session auto-paused', hash: '77b0c2fe10a9', payload: {} },
      { id: 'a4', timestamp: minutesAgoIso(120), eventType: 'CONSENT_RECORDED', actor: 'admin:security@company.com', campaignId: summary.id, campaignName: summary.name, targetName: 'Omar Farooq', summary: 'Signed consent form uploaded (PDF)', hash: '3e91d4b8c2f0', payload: {} },
      { id: 'a5', timestamp: daysAgoIso(1), eventType: 'CAMPAIGN_CREATED', actor: 'admin:security@company.com', campaignId: summary.id, campaignName: summary.name, targetName: null, summary: 'Campaign created via wizard', hash: 'b42a9d7e6c11', payload: {} },
    ],
  };
}
