export type InteractionStage = 'delivered' | 'opened' | 'clicked' | 'submitted';

export interface AnalyticsEvent {
  id: string;
  campaignId: string;
  targetId: string;
  stage: InteractionStage;
  timestamp: string;
  detail: string;
}

export const INITIAL_ANALYTICS_EVENTS: AnalyticsEvent[] = [
  { id: 'evt-001', campaignId: 'mock-phase1-active', targetId: 'target-alice', stage: 'delivered', timestamp: '2026-09-01T08:17:00+05:00', detail: 'Email delivered to recipient mailbox.' },
  { id: 'evt-002', campaignId: 'mock-phase1-active', targetId: 'target-alice', stage: 'opened', timestamp: '2026-09-01T08:21:00+05:00', detail: 'Tracking pixel reported an open.' },
  { id: 'evt-003', campaignId: 'mock-phase1-active', targetId: 'target-alice', stage: 'clicked', timestamp: '2026-09-01T08:23:00+05:00', detail: 'Simulation link clicked.' },
  { id: 'evt-004', campaignId: 'mock-phase1-active', targetId: 'target-bilal', stage: 'delivered', timestamp: '2026-09-01T08:19:00+05:00', detail: 'Email delivered to recipient mailbox.' },
  { id: 'evt-005', campaignId: 'mock-phase1-active', targetId: 'target-bilal', stage: 'opened', timestamp: '2026-09-01T08:28:00+05:00', detail: 'Tracking pixel reported an open.' },
  { id: 'evt-006', campaignId: 'mock-phase1-active', targetId: 'target-sana', stage: 'delivered', timestamp: '2026-09-01T08:20:00+05:00', detail: 'Email delivered to recipient mailbox.' },
];

export const MOCK_STAGE_ORDER: InteractionStage[] = ['delivered', 'opened', 'clicked', 'submitted'];
