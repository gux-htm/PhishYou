/**
 * PhishYou — Application database service
 * Spec: PHISHYOU_SPECS/02_ARCHITECTURE/DATABASE_SCHEMA.md
 *
 * A dependency-free persistence layer backed by lowdb (JSON file), matching the
 * existing `store.ts` config pattern. It holds the operational collections the
 * campaign + auth features need and is the single source of truth wired into the
 * campaign services (`campaignPersistence`, `campaignExecution`) and auth routes.
 *
 * Data file: backend/data/phishyou.db
 */
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface StoredCampaignRecord {
  id: string;
  name: string;
  type?: string;
  tier?: string;
  status: string;
  objective?: string;
  description?: string;
  organizationContext?: string;
  scenarioContext?: string;
  timingContext?: string;
  senderConfig?: Record<string, unknown>;
  campaignConfig?: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  scheduledAt?: string | null;
}

export interface StoredTargetRecord {
  id: string;
  campaignId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  department?: string;
  role?: string;
  position?: string;
  personalContext?: string;
  status: string;
  emailSubject?: string;
  emailBody?: string;
  sentAt?: string | null;
  createdAt: string;
}

export interface StoredInteraction {
  id: string;
  campaignId: string;
  targetId: string;
  type: string;
  success?: boolean;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface StoredEvent {
  id: string;
  campaignId: string;
  targetId?: string | null;
  type: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

interface AppData {
  users: StoredUser[];
  campaigns: StoredCampaignRecord[];
  targets: StoredTargetRecord[];
  email_interactions: StoredInteraction[];
  campaign_events: StoredEvent[];
}

const filePath = join(dirname(import.meta.filename), '..', '..', 'data', 'phishyou.db');

function defaultData(): AppData {
  return {
    users: [],
    campaigns: [],
    targets: [],
    email_interactions: [],
    campaign_events: [],
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Derive a salted scrypt hash for a plaintext password. */
export function hashPassword(password: string): { passwordSalt: string; passwordHash: string } {
  const passwordSalt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, passwordSalt, 64).toString('hex');
  return { passwordSalt, passwordHash };
}

/** Constant-time password verification against a stored salt/hash pair. */
export function verifyPassword(password: string, passwordSalt: string, passwordHash: string): boolean {
  try {
    const derived = scryptSync(password, passwordSalt, 64);
    const stored = Buffer.from(passwordHash, 'hex');
    return derived.length === stored.length && timingSafeEqual(derived, stored);
  } catch {
    return false;
  }
}

class DatabaseService {
  private store: Low<AppData>;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.store = new Low<AppData>(new JSONFile(filePath), defaultData());
  }

  /** Absolute path of the backing database file (for logging/diagnostics). */
  get location(): string {
    return filePath;
  }

  /** Idempotently create the data dir + file and normalize collections. */
  async initialize(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.runInit();
    return this.initPromise;
  }

  private async runInit(): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await this.store.read();
    const data = this.store.data ?? defaultData();
    data.users ??= [];
    data.campaigns ??= [];
    data.targets ??= [];
    data.email_interactions ??= [];
    data.campaign_events ??= [];
    this.store.data = data;
    await this.store.write();
  }

  private async ready(): Promise<AppData> {
    await this.initialize();
    return this.store.data as AppData;
  }

  private async commit(): Promise<void> {
    await this.store.write();
  }

  // ---------------------------------------------------------------- users

  async createUser(input: {
    email: string;
    password: string;
    name: string;
    organization: string;
    role?: string;
  }): Promise<StoredUser> {
    const data = await this.ready();
    const email = normalizeEmail(input.email);
    if (data.users.some((u) => u.email === email)) {
      throw new Error('An account with this email already exists.');
    }
    const { passwordSalt, passwordHash } = hashPassword(input.password);
    const user: StoredUser = {
      id: randomUUID(),
      email,
      name: input.name.trim(),
      organization: input.organization.trim(),
      role: input.role?.trim() || 'Security Analyst',
      passwordSalt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    await this.commit();
    return user;
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const data = await this.ready();
    const normalized = normalizeEmail(email);
    return data.users.find((u) => u.email === normalized) ?? null;
  }

  async findUserById(id: string): Promise<StoredUser | null> {
    const data = await this.ready();
    return data.users.find((u) => u.id === id) ?? null;
  }

  async updateUser(id: string, patch: Partial<StoredUser>): Promise<StoredUser | null> {
    const data = await this.ready();
    const user = data.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, patch);
    await this.commit();
    return user;
  }

  async listUsers(): Promise<StoredUser[]> {
    const data = await this.ready();
    return [...data.users];
  }

  async countUsers(): Promise<number> {
    const data = await this.ready();
    return data.users.length;
  }

  // ------------------------------------------------------------ campaigns

  async createCampaign(input: Partial<StoredCampaignRecord> & { name: string }): Promise<StoredCampaignRecord> {
    const data = await this.ready();
    const now = new Date().toISOString();
    const campaign: StoredCampaignRecord = {
      id: input.id ?? randomUUID(),
      name: input.name,
      type: input.type,
      tier: input.tier,
      status: input.status ?? 'DRAFT',
      objective: input.objective,
      description: input.description,
      organizationContext: input.organizationContext,
      scenarioContext: input.scenarioContext,
      timingContext: input.timingContext,
      senderConfig: input.senderConfig ?? {},
      campaignConfig: input.campaignConfig ?? {},
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      startedAt: input.startedAt ?? null,
      completedAt: input.completedAt ?? null,
      scheduledAt: input.scheduledAt ?? null,
    };
    data.campaigns.push(campaign);
    await this.commit();
    return campaign;
  }

  async getCampaign(id: string): Promise<StoredCampaignRecord | null> {
    const data = await this.ready();
    return data.campaigns.find((c) => c.id === id) ?? null;
  }

  async updateCampaign(id: string, patch: Partial<StoredCampaignRecord>): Promise<StoredCampaignRecord | null> {
    const data = await this.ready();
    const campaign = data.campaigns.find((c) => c.id === id);
    if (!campaign) return null;
    Object.assign(campaign, patch, { updatedAt: new Date().toISOString() });
    await this.commit();
    return campaign;
  }

  async listCampaigns(filter: { status?: string; createdBy?: string } = {}): Promise<StoredCampaignRecord[]> {
    const data = await this.ready();
    return data.campaigns.filter((c) => {
      if (filter.status && c.status !== filter.status) return false;
      if (filter.createdBy && c.createdBy !== filter.createdBy) return false;
      return true;
    });
  }

  // -------------------------------------------------------------- targets

  async createTarget(input: Partial<StoredTargetRecord> & { campaignId: string; email: string }): Promise<StoredTargetRecord> {
    const data = await this.ready();
    const target: StoredTargetRecord = {
      id: input.id ?? randomUUID(),
      campaignId: input.campaignId,
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      department: input.department,
      role: input.role,
      position: input.position,
      personalContext: input.personalContext,
      status: input.status ?? 'pending',
      emailSubject: input.emailSubject,
      emailBody: input.emailBody,
      sentAt: input.sentAt ?? null,
      createdAt: new Date().toISOString(),
    };
    data.targets.push(target);
    await this.commit();
    return target;
  }

  async getTarget(id: string): Promise<StoredTargetRecord | null> {
    const data = await this.ready();
    return data.targets.find((t) => t.id === id) ?? null;
  }

  async getTargetsByCampaign(campaignId: string): Promise<StoredTargetRecord[]> {
    const data = await this.ready();
    return data.targets.filter((t) => t.campaignId === campaignId);
  }

  async updateTarget(id: string, patch: Partial<StoredTargetRecord>): Promise<StoredTargetRecord | null> {
    const data = await this.ready();
    const target = data.targets.find((t) => t.id === id);
    if (!target) return null;
    Object.assign(target, patch);
    await this.commit();
    return target;
  }

  // --------------------------------------------- events + interactions

  async logEvent(campaignId: string, targetId: string | null | undefined, type: string, meta: Record<string, unknown> = {}): Promise<StoredEvent> {
    const data = await this.ready();
    const event: StoredEvent = {
      id: randomUUID(),
      campaignId,
      targetId: targetId ?? null,
      type,
      meta,
      createdAt: new Date().toISOString(),
    };
    data.campaign_events.push(event);
    await this.commit();
    return event;
  }

  async getEvents(campaignId: string): Promise<StoredEvent[]> {
    const data = await this.ready();
    return data.campaign_events.filter((e) => e.campaignId === campaignId);
  }

  async recordInteraction(input: {
    campaignId: string;
    targetId: string;
    type: string;
    success?: boolean;
    meta?: Record<string, unknown>;
  }): Promise<StoredInteraction> {
    const data = await this.ready();
    const interaction: StoredInteraction = {
      id: randomUUID(),
      campaignId: input.campaignId,
      targetId: input.targetId,
      type: input.type,
      success: input.success,
      meta: input.meta ?? {},
      createdAt: new Date().toISOString(),
    };
    data.email_interactions.push(interaction);
    await this.commit();
    return interaction;
  }

  async getInteractions(campaignId: string): Promise<StoredInteraction[]> {
    const data = await this.ready();
    return data.email_interactions.filter((i) => i.campaignId === campaignId);
  }

  /**
   * Locate a recorded interaction by the outbound Message-ID stored in its meta.
   * Used to correlate an inbound reply (In-Reply-To / References) back to the
   * campaign + target that received the original simulated email.
   */
  async findInteractionByMessageId(messageId: string): Promise<StoredInteraction | null> {
    const needle = normalizeMessageId(messageId);
    if (!needle) return null;
    const data = await this.ready();
    return (
      data.email_interactions.find((i) => {
        const stored = typeof i.meta?.messageId === 'string' ? normalizeMessageId(i.meta.messageId) : '';
        return stored !== '' && stored === needle;
      }) ?? null
    );
  }

  /** All targets across every campaign matching an email address (reply-correlation fallback). */
  async findTargetsByEmail(email: string): Promise<StoredTargetRecord[]> {
    const data = await this.ready();
    const normalized = normalizeEmail(email);
    return data.targets.filter((t) => normalizeEmail(t.email) === normalized);
  }

  /** True when a reply interaction with this inbound Message-ID was already recorded (dedup across restarts). */
  async hasReplyWithMessageId(campaignId: string, messageId: string): Promise<boolean> {
    const needle = normalizeMessageId(messageId);
    if (!needle) return false;
    const data = await this.ready();
    return data.email_interactions.some(
      (i) => i.campaignId === campaignId && i.type === 'reply' && typeof i.meta?.messageId === 'string' && normalizeMessageId(i.meta.messageId) === needle,
    );
  }
}

/** Strip angle brackets + surrounding whitespace and lowercase a Message-ID for stable comparison. */
export function normalizeMessageId(messageId: string): string {
  return (messageId ?? '').trim().replace(/^<|>$/g, '').toLowerCase();
}

export const databaseService = new DatabaseService();
