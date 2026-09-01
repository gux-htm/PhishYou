import { buildEmailPreview, type EmailPreview } from './emailPreviews';
import { INITIAL_ANALYTICS_EVENTS, type AnalyticsEvent, type InteractionStage, MOCK_STAGE_ORDER } from './analyticsEvents';
import { INITIAL_INTERACTIONS, type TargetInteraction } from './interactions';
import { MOCK_TARGETS, type MockTarget } from './targets';

export interface SpoofingConfig {
  aiRecommended: boolean;
  recommendation: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
  overridden: boolean;
}

export interface MockCampaign {
  id: string;
  name: string;
  campaignGoal: string;
  organizationContext: string;
  scenarioContext: string;
  timingContext: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DRAFT';
  createdAt: string;
  launchedAt: string | null;
  targets: MockTarget[];
  emailPreviews: EmailPreview[];
  spoofing: SpoofingConfig;
  interactions: TargetInteraction[];
  events: AnalyticsEvent[];
}

const DEMO_CAMPAIGN: MockCampaign = {
  id: 'mock-phase1-active',
  name: 'Q3 Payment Verification Awareness',
  campaignGoal: 'click the simulation link',
  organizationContext: 'Meridian Financial Group is running an authorized email security-awareness exercise for finance staff.',
  scenarioContext: 'A time-sensitive payment verification request sent during the monthly close period.',
  timingContext: 'Weekday morning, before the finance approval window closes.',
  status: 'ACTIVE',
  createdAt: '2026-09-01T08:10:00+05:00',
  launchedAt: '2026-09-01T08:15:00+05:00',
  targets: MOCK_TARGETS,
  emailPreviews: MOCK_TARGETS.map((target) =>
    buildEmailPreview(
      target,
      'click the simulation link',
      'Meridian Financial Group',
    ),
  ),
  spoofing: {
    aiRecommended: true,
    recommendation: 'Use an internal Security Operations display name with a simulation-only subdomain to create a recognizable training context without impersonating a real external sender.',
    senderName: 'Meridian Security Operations',
    senderEmail: 'security-awareness@sim.meridian.example',
    replyTo: 'awareness-team@meridian.example',
    overridden: false,
  },
  interactions: INITIAL_INTERACTIONS,
  events: INITIAL_ANALYTICS_EVENTS,
};

const campaigns = new Map<string, MockCampaign>([[DEMO_CAMPAIGN.id, DEMO_CAMPAIGN]]);
let sequence = 1;

export function getMockCampaign(id: string): MockCampaign | null {
  return campaigns.get(id) ?? null;
}

export function listMockCampaigns(): MockCampaign[] {
  return Array.from(campaigns.values());
}

export interface NewMockCampaignInput {
  name: string;
  campaignGoal: string;
  organizationContext: string;
  scenarioContext: string;
  timingContext: string;
  targets: MockTarget[];
  emailPreviews: EmailPreview[];
  spoofing: SpoofingConfig;
}

export function createMockCampaign(input: NewMockCampaignInput): MockCampaign {
  const id = `mock-phase1-${Date.now()}-${sequence}`;
  sequence += 1;
  const createdAt = new Date().toISOString();
  const interactions: TargetInteraction[] = input.targets.map((target, index) => ({
    targetId: target.id,
    deliveryStatus: index === 0 ? 'Delivered' : 'Pending',
    deliveredAt: index === 0 ? createdAt : null,
    opened: false,
    openedAt: null,
    clicked: false,
    clickedAt: null,
    submitted: false,
    submittedAt: null,
  }));
  const events: AnalyticsEvent[] = input.targets.slice(0, 1).map((target) => ({
    id: `evt-${id}-delivery`,
    campaignId: id,
    targetId: target.id,
    stage: 'delivered',
    timestamp: createdAt,
    detail: 'Email delivered to recipient mailbox.',
  }));

  const campaign: MockCampaign = {
    id,
    name: input.name,
    campaignGoal: input.campaignGoal,
    organizationContext: input.organizationContext,
    scenarioContext: input.scenarioContext,
    timingContext: input.timingContext,
    status: 'ACTIVE',
    createdAt,
    launchedAt: createdAt,
    targets: input.targets,
    emailPreviews: input.emailPreviews,
    spoofing: input.spoofing,
    interactions,
    events,
  };
  campaigns.set(id, campaign);
  return campaign;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function advanceMockCampaign(id: string): MockCampaign | null {
  const campaign = campaigns.get(id);
  if (!campaign || campaign.status !== 'ACTIVE') return campaign ?? null;

  const nextTarget = campaign.interactions.find((item) => {
    const currentStage: InteractionStage = item.submitted
      ? 'submitted'
      : item.clicked
        ? 'clicked'
        : item.opened
          ? 'opened'
          : item.deliveryStatus === 'Delivered'
            ? 'delivered'
            : 'delivered';
    return MOCK_STAGE_ORDER.indexOf(currentStage) < MOCK_STAGE_ORDER.length - 1;
  });

  if (!nextTarget) return campaign;

  const next: TargetInteraction = { ...nextTarget };
  const timestamp = nowIso();
  let stage: InteractionStage;

  if (next.deliveryStatus === 'Pending') {
    next.deliveryStatus = 'Delivered';
    next.deliveredAt = timestamp;
    stage = 'delivered';
  } else if (!next.opened) {
    next.opened = true;
    next.openedAt = timestamp;
    stage = 'opened';
  } else if (!next.clicked) {
    next.clicked = true;
    next.clickedAt = timestamp;
    stage = 'clicked';
  } else {
    next.submitted = true;
    next.submittedAt = timestamp;
    stage = 'submitted';
  }

  const event: AnalyticsEvent = {
    id: `evt-${id}-${stage}-${timestamp.replace(/\D/g, '').slice(-8)}`,
    campaignId: id,
    targetId: next.targetId,
    stage,
    timestamp,
    detail:
      stage === 'delivered'
        ? 'Email delivered to recipient mailbox.'
        : stage === 'opened'
          ? 'Tracking pixel reported an open.'
          : stage === 'clicked'
            ? 'Simulation link clicked.'
            : 'Simulation form interaction recorded as a conversion.',
  };

  campaign.interactions = campaign.interactions.map((item) => (item.targetId === next.targetId ? next : item));
  campaign.events = [...campaign.events, event].slice(-40);
  campaigns.set(id, campaign);
  return campaign;
}

export function buildFunnel(campaign: MockCampaign): { stage: string; value: number }[] {
  const total = campaign.targets.length;
  const delivered = campaign.interactions.filter((item) => item.deliveryStatus === 'Delivered').length;
  const opened = campaign.interactions.filter((item) => item.opened).length;
  const clicked = campaign.interactions.filter((item) => item.clicked).length;
  const converted = campaign.interactions.filter((item) => item.submitted).length;
  return [
    { stage: 'Delivered', value: delivered },
    { stage: 'Opened', value: opened },
    { stage: 'Clicked', value: clicked },
    { stage: 'Converted', value: converted },
    { stage: 'Eligible', value: total },
  ].filter((item) => item.stage !== 'Eligible');
}
