/**
 * PhishYou — Campaign persistence service
 * Spec: PHISHYOU_SPECS/02_ARCHITECTURE/DATABASE_SCHEMA.md
 *       PHISHYOU_SPECS/06_PERSISTENCE_LOGIC/PERSISTENCE_STATE_MACHINE.md
 *
 * Maps the campaign router's domain shapes onto the lowdb-backed
 * `databaseService`. This is the layer that wires campaigns, targets, email
 * interactions and audit events into the database.
 */
import { databaseService, type StoredCampaignRecord, type StoredTargetRecord } from './database.js';
import type { CampaignTarget, PersonalizedEmail, SendResult, SenderConfig } from './campaignEmail.js';

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface BatchSettings {
  batchSize?: number;
  delayBetweenBatches?: number;
  delayBetweenEmails?: number;
}

export interface CampaignConfig {
  urgencyLevel?: string;
  batchSettings?: BatchSettings;
  [key: string]: unknown;
}

export interface StoredCampaign {
  id: string;
  name: string;
  type?: string;
  tier?: string;
  status: string;
  objective?: string;
  organizationContext?: string;
  scenarioContext?: string;
  timingContext?: string;
  senderConfig: SenderConfig;
  campaignConfig: CampaignConfig;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  scheduledAt?: string | null;
}

export interface StoredTarget {
  id: string;
  campaignId: string;
  name: string;
  email: string;
  department?: string;
  role: string;
  personalContext?: string;
  status: string;
  sentAt?: string | null;
  createdAt: string;
}

export interface CreateCampaignInput {
  name: string;
  type?: string;
  tier?: string;
  objective?: string;
  organizationContext?: string;
  scenarioContext?: string;
  timingContext?: string;
  senderConfig?: SenderConfig;
  campaignConfig?: CampaignConfig;
  createdBy?: string;
}

export interface CampaignAnalytics {
  totalTargets: number;
  byStatus: Record<string, number>;
  sent: number;
  failed: number;
  pending: number;
  replied: number;
  interactions: number;
  events: number;
}

function toStoredCampaign(record: StoredCampaignRecord): StoredCampaign {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    tier: record.tier,
    status: record.status,
    objective: record.objective,
    organizationContext: record.organizationContext,
    scenarioContext: record.scenarioContext,
    timingContext: record.timingContext,
    senderConfig: (record.senderConfig as unknown as SenderConfig) ?? { fromName: '', fromEmail: '' },
    campaignConfig: (record.campaignConfig as CampaignConfig) ?? {},
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    startedAt: record.startedAt ?? null,
    completedAt: record.completedAt ?? null,
    scheduledAt: record.scheduledAt ?? null,
  };
}

function toStoredTarget(record: StoredTargetRecord): StoredTarget {
  return {
    id: record.id,
    campaignId: record.campaignId,
    name: record.name ?? [record.firstName, record.lastName].filter(Boolean).join(' '),
    email: record.email,
    department: record.department,
    role: record.role ?? '',
    personalContext: record.personalContext,
    status: record.status,
    sentAt: record.sentAt ?? null,
    createdAt: record.createdAt,
  };
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = (name ?? '').trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}

class CampaignPersistenceService {
  /** The local JSON database is always available once initialized. */
  isConfigured(): boolean {
    return true;
  }

  async initialize(): Promise<void> {
    await databaseService.initialize();
  }

  async createCampaign(input: CreateCampaignInput): Promise<StoredCampaign> {
    const record = await databaseService.createCampaign({
      name: input.name,
      type: input.type,
      tier: input.tier,
      status: 'DRAFT',
      objective: input.objective,
      organizationContext: input.organizationContext,
      scenarioContext: input.scenarioContext,
      timingContext: input.timingContext,
      senderConfig: (input.senderConfig ?? { fromName: '', fromEmail: '' }) as unknown as Record<string, unknown>,
      campaignConfig: (input.campaignConfig ?? {}) as Record<string, unknown>,
      createdBy: input.createdBy,
    });
    return toStoredCampaign(record);
  }

  async getCampaign(id: string): Promise<StoredCampaign | null> {
    const record = await databaseService.getCampaign(id);
    return record ? toStoredCampaign(record) : null;
  }

  async getCampaigns(filter: { status?: string; createdBy?: string } = {}): Promise<StoredCampaign[]> {
    const records = await databaseService.listCampaigns(filter);
    return records.map(toStoredCampaign);
  }

  async updateCampaignStatus(id: string, status: CampaignStatus | string): Promise<StoredCampaign | null> {
    const patch: Partial<StoredCampaignRecord> = { status };
    if (status === 'ACTIVE') patch.startedAt = new Date().toISOString();
    if (status === 'COMPLETED' || status === 'CANCELLED') patch.completedAt = new Date().toISOString();
    const record = await databaseService.updateCampaign(id, patch);
    return record ? toStoredCampaign(record) : null;
  }

  /** Merge partial context fields (used by the agent as it learns from chat). */
  async updateCampaignContext(
    id: string,
    patch: Partial<Pick<StoredCampaignRecord, 'name' | 'objective' | 'organizationContext' | 'scenarioContext' | 'timingContext' | 'tier' | 'senderConfig' | 'campaignConfig'>>,
  ): Promise<StoredCampaign | null> {
    const record = await databaseService.updateCampaign(id, patch as Partial<StoredCampaignRecord>);
    return record ? toStoredCampaign(record) : null;
  }

  async addTargetsToCampaign(campaignId: string, targets: CampaignTarget[]): Promise<StoredTarget[]> {
    const created: StoredTarget[] = [];
    for (const target of targets) {
      const { firstName, lastName } = splitName(target.name);
      const record = await databaseService.createTarget({
        id: target.id,
        campaignId,
        name: target.name,
        firstName,
        lastName,
        email: target.email,
        department: target.department,
        role: target.role,
        personalContext: target.personalContext,
        status: 'pending',
      });
      created.push(toStoredTarget(record));
    }
    return created;
  }

  async getCampaignTargets(id: string): Promise<StoredTarget[]> {
    const records = await databaseService.getTargetsByCampaign(id);
    return records.map(toStoredTarget);
  }

  async logCampaignEvent(
    campaignId: string,
    targetId: string | undefined,
    type: string,
    meta: Record<string, unknown> = {},
  ): Promise<void> {
    await databaseService.logEvent(campaignId, targetId ?? null, type, meta);
  }

  async recordEmailSent(
    campaignId: string,
    targetId: string,
    email: PersonalizedEmail,
    emailResult: SendResult,
  ): Promise<void> {
    await databaseService.recordInteraction({
      campaignId,
      targetId,
      type: emailResult.success ? 'sent' : 'failed',
      success: emailResult.success,
      meta: { subject: email.subject, messageId: emailResult.messageId ?? null, simulated: emailResult.simulated ?? false, error: emailResult.error },
    });
    await databaseService.updateTarget(targetId, {
      status: emailResult.success ? 'sent' : 'failed',
      emailSubject: email.subject,
      emailBody: email.body,
      sentAt: emailResult.success ? new Date().toISOString() : null,
    });
  }

  async getCampaignAnalytics(id: string): Promise<CampaignAnalytics> {
    const targets = await databaseService.getTargetsByCampaign(id);
    const interactions = await databaseService.getInteractions(id);
    const events = await databaseService.getEvents(id);
    const byStatus: Record<string, number> = {};
    let sent = 0;
    let failed = 0;
    let pending = 0;
    let replied = 0;
    for (const target of targets) {
      byStatus[target.status] = (byStatus[target.status] ?? 0) + 1;
      if (target.status === 'failed') failed += 1;
      else if (target.status === 'pending') pending += 1;
      else {
        // sent / opened / clicked / replied all imply the email was delivered.
        sent += 1;
        if (target.status === 'replied') replied += 1;
      }
    }
    const replyInteractions = interactions.filter((i) => i.type === 'reply').length;
    return { totalTargets: targets.length, byStatus, sent, failed, pending, replied: replied || replyInteractions, interactions: interactions.length, events: events.length };
  }
}

export const campaignPersistenceService = new CampaignPersistenceService();
