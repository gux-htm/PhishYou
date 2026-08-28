/**
 * PhishYou — Shared domain types
 * Sources: PHISHYOU_SPECS/02_ARCHITECTURE/API_CONTRACTS.md, DATABASE_SCHEMA.md
 *          FRONTEND_SPEC_ENHANCED.md — Design System / Status Color Conventions
 */

/* ------------------------------------------------------------------ */
/* Core enums                                                          */
/* ------------------------------------------------------------------ */

export type Tier = 'A' | 'B' | 'C';

export type Platform = 'email' | 'whatsapp' | 'sms' | 'voice' | 'linkedin' | 'instagram';

export type CampaignStatus =
  | 'CREATED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'HALTED';

export type DefenseStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPROMISED'
  | 'DEFENDED'
  | 'BLOCKED';

export type TriggerType = 'Authority' | 'Urgency' | 'Fear' | 'Social Proof' | 'Reciprocity';

export type TriggerIntensity = 1 | 2 | 3 | 4 | 5;

export type CampaignType =
  | 'email_credential_harvest'
  | 'whatsapp_payment'
  | 'multi_channel_authority'
  | 'social_recruiter_harvest'
  | 'regional_fintech'
  | 'cognitive_load';

export type CampaignObjective =
  | 'Credential Harvest'
  | 'Payment Diversion'
  | 'Data Disclosure Test'
  | 'Policy Stress Test';

export type CampaignLanguage = 'en-US' | 'en-GB' | 'ur-RM' | 'ur-PK' | 'fr-FR';

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */

export interface CampaignSummary {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  tier: Tier;
  platforms: Platform[];
  targetsTotal: number;
  targetsActive: number;
  targetsResolved: number;
  compromised: number;
  defended: number;
  avgResistanceScore: number; // 0..1 across all targets
  createdAt: string; // ISO
  startedAt: string | null; // ISO
  endsAt: string | null; // ISO
}

export interface ThreadMessage {
  id: string;
  from: 'ai' | 'target';
  content: string;
  tactic?: string; // AI messages only, e.g. ESCALATE_AUTHORITY
  platform: Platform;
  timestamp: string; // ISO
  resistanceScore?: number; // target messages only
}

export interface CampaignTarget {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: DefenseStatus;
  resistanceScore: number; // 0..1
  exchangesCount: number;
  platform: Platform | null;
  lastActivityAt: string | null; // ISO
  defenseMechanism: string | null; // e.g. "Out-of-band verification"
  thread: ThreadMessage[];
}

export interface CampaignMilestone {
  label: 'Created' | 'Consent Verified' | 'Active' | 'Completed' | 'Halted';
  reachedAt: string | null; // ISO
  current: boolean;
}

export interface PlatformStatusCard {
  platform: Platform;
  status: 'Active' | 'Blocked' | 'Not Deployed' | 'Failed';
  messagesSent: number;
  deliveryRate: number; // 0..1
}

export interface CampaignDetailData {
  campaign: CampaignSummary;
  milestones: CampaignMilestone[];
  targets: CampaignTarget[];
  platforms: PlatformStatusCard[];
  config: {
    personaId: string;
    personaName: string;
    primaryTrigger: TriggerType;
    secondaryTrigger: TriggerType | null;
    triggerIntensity: TriggerIntensity;
    attackChainId: string;
    attackChainName: string;
    durationDays: number;
    contactWindow: { from: string; to: string; timezone: string };
    language: CampaignLanguage;
    harmDetection: 'tier_c_mandatory' | 'tier_b_enabled' | 'tier_b_disabled' | 'tier_a_disabled';
  };
  auditPreview: AuditEvent[];
}

export interface CampaignFilters {
  search?: string;
  status?: CampaignStatus | 'ALL';
  tier?: Tier | 'ALL';
  platform?: Platform | 'ALL';
  from?: string; // yyyy-mm-dd
  to?: string; // yyyy-mm-dd
}

/* ------------------------------------------------------------------ */
/* Personas & attack chains (wizard)                                   */
/* ------------------------------------------------------------------ */

export interface Persona {
  id: string;
  name: string;
  role: string;
  authorityLevel: 1 | 2 | 3 | 4 | 5;
  bestTriggerPairing: string;
  platforms: Platform[];
  tierALocked?: boolean; // Tier A only persona (e.g. Government / Regulator)
}

export interface AttackChain {
  id: string;
  name: string;
  steps: { platform: Platform; trigger: TriggerType }[];
  tierALocked?: boolean;
}

export interface WizardTarget {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  consentOnFile: boolean;
}

export interface CampaignDraft {
  /* Step 1 */
  name: string;
  type: CampaignType | '';
  tier: Tier | '';
  durationValue: number;
  durationUnit: 'Days' | 'Hours';
  objective: CampaignObjective | '';
  notes: string;
  /* Step 2 */
  targets: WizardTarget[];
  attestation: {
    checked: string[];
    cisoName: string;
    cisoEmail: string;
    signedAt: string | null; // ISO once signed
  };
  /* Step 3 */
  personaId: string;
  primaryTrigger: TriggerType | '';
  secondaryTrigger: TriggerType | '';
  intensity: TriggerIntensity;
  attackChainId: string;
  osintContext: string;
  /* Step 4 */
  platforms: Platform[];
  sender: {
    fromName: string;
    fromEmail: string;
    replyTo: string;
    displayName: string;
    fromNumber: string;
    voiceProfile: string;
  };
  voiceMessages: boolean;
  voiceLanguage: string;
  voiceTone: string;
  documentGeneration: boolean;
  documentType: string;
  windowFrom: string;
  windowTo: string;
  timezone: string;
  sendDays: number[]; // 0=Mon .. 6=Sun
  language: CampaignLanguage;
}

/* ------------------------------------------------------------------ */
/* Analytics                                                           */
/* ------------------------------------------------------------------ */

export interface TriggerStat {
  trigger: TriggerType | string;
  effectiveness: number; // 0..100
  samples: number;
}

export interface DepartmentRisk {
  department: string;
  avgResilience: number; // 0..100
  compromiseRate: number; // 0..100
  targets: number;
}

export interface HeatmapCell {
  department: string;
  trigger: string;
  effectiveness: number; // 0..100
}

export interface TimeToCompromiseBucket {
  minutes: number;
  count: number;
}

export interface PlatformTrendPoint {
  period: string;
  compromiseRate: number; // 0..100
}

export interface VulnerabilityTrajectoryPoint {
  date: string;
  riskScore: number; // 0..100
  industryAverage?: number;
}

export interface AnalyticsOverview {
  humanRiskScore: { score: number; delta: number };
  totalEngagements: number;
  compromiseRate: { value: number; delta: number };
  policyGapsResolved: number;
  departmentRisks: DepartmentRisk[];
  triggerHeatmap: HeatmapCell[];
  triggerStats: TriggerStat[];
  timeToCompromise: TimeToCompromiseBucket[];
  medianMinutesToCompromise: number;
  platformTrends: { platform: Platform; points: PlatformTrendPoint[] }[];
  trajectory: VulnerabilityTrajectoryPoint[];
  lastUpdated: string; // ISO
}

/* ------------------------------------------------------------------ */
/* After-Action Report                                                 */
/* ------------------------------------------------------------------ */

export type AarOutcome = 'DEFENDED' | 'COMPROMISED' | 'EXPIRED';

export interface AarKeyMetrics {
  timeToFirstSkepticism: string;
  totalExchanges: number;
  campaignDuration: string;
  resilienceScore: number; // 0..1
}

export interface TimelineEvent {
  id: string;
  kind: 'ai_message' | 'target_reply' | 'escalation' | 'media' | 'harm_signal' | 'defense';
  timestamp: string; // ISO
  content: string;
  tactic?: string;
  resistanceScore?: number;
  signals?: string[]; // behavioral badges, e.g. "Emoji downshift detected"
  detail?: string;
}

export interface AarTriggerRow {
  trigger: string;
  deployed: number;
  meanResistanceDelta: number; // negative = made target more compliant
  bestResponse: string;
  worstResponse: string;
  rating: number; // 0..5 (effectiveness dots)
}

export interface AarPolicyGap {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  gapClass: 'Missing Policy' | 'Unknown Policy' | 'Unenforced Policy' | 'Tooling Gap' | 'Escalation Gap';
  evidence: string;
  attribution: string; // "— Alice Johnson, Turn 3"
  description: string;
  recommendation: string;
  effort: string; // e.g. "Implementation effort: Low · Est. 7 days"
  status: 'Open' | 'Acknowledged' | 'Remediation Planned' | 'Remediated' | 'Verified by Retest';
}

export interface AarCoachingItem {
  title: string;
  detail: string;
}

export interface AarTrainingModule {
  name: string;
  description: string;
  url: string;
}

export interface AarComparison {
  radar: { dimension: string; individual: number; department: number }[]; // 0..100
  percentiles: {
    entity: 'Individual' | 'Department' | 'Company';
    score: number; // 0..100
    percentileText: string;
    trend: number; // +/- vs last campaign
  }[];
  industryBenchmark: { metric: string; org: number; industry: number }[] | null;
  industryNote: string | null;
}

export interface AarReport {
  campaignId: string;
  campaignName: string;
  tier: Tier;
  outcome: AarOutcome;
  outcomeDescription: string;
  generatedAt: string; // ISO
  keyMetrics: AarKeyMetrics;
  summary: string;
  attackChain: { platform: Platform; trigger: string; winningDefense?: boolean }[];
  timeline: TimelineEvent[];
  resistanceSeries: { turn: number; score: number; preview: string }[];
  triggerRows: AarTriggerRow[];
  triggerJourney: { turn: number; resistance: number; trigger: string }[];
  intensityEffectiveness: { intensity: number; effectiveness: number }[];
  triggerDistribution: { trigger: string; share: number }[]; // share 0..100
  narrative: string;
  policyGaps: AarPolicyGap[];
  coaching: { didWell: AarCoachingItem[]; improve: AarCoachingItem[]; modules: AarTrainingModule[] };
  comparisons: AarComparison;
}

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

export type AuditEventType =
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_STARTED'
  | 'CAMPAIGN_PAUSED'
  | 'CAMPAIGN_RESUMED'
  | 'CAMPAIGN_HALTED'
  | 'CAMPAIGN_COMPLETED'
  | 'TARGET_COMPROMISED'
  | 'TARGET_DEFENDED'
  | 'TARGET_BLOCKED'
  | 'HARM_DETECTED'
  | 'CONSENT_RECORDED'
  | 'DEBRIEF_DELIVERED'
  | 'ADMIN_ACTION'
  | 'DATA_EXPORTED'
  | 'INTEGRITY_VERIFIED';

export interface AuditEvent {
  id: string;
  timestamp: string; // ISO
  eventType: AuditEventType;
  actor: string; // "admin:email@company.com" or "system:orchestrator"
  campaignId: string | null;
  campaignName: string | null;
  targetName: string | null;
  summary: string;
  hash: string; // full entry hash — display first 8 chars
  payload: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* Notifications & toasts                                              */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | 'HARM_DETECTED'
  | 'CAMPAIGN_COMPLETED'
  | 'TARGET_BLOCKED'
  | 'DEBRIEF_OVERDUE'
  | 'ADMIN_ACTION';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO
  read: boolean;
}

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export interface AuthUser {
  email: string;
  token: string;
  name: string;
  organization: string;
}

export type UserRole = 'CISO' | 'Security Manager' | 'Security Analyst' | 'HR/Debrief Officer' | 'Auditor';
