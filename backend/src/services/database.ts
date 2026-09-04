import Database from 'better-sqlite3';
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
  emailVerifiedAt?: string;
  emailVerificationHash?: string;
  emailVerificationExpiresAt?: string;
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

export interface StoredSettings {
  ai: Record<string, unknown>;
  db: Record<string, unknown>;
  email: Record<string, unknown>;
}

const filePath = join(dirname(import.meta.filename), '..', '..', 'data', 'phishyou.sqlite');

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function json(value: unknown): string {
  return JSON.stringify(value ?? {});
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string): { passwordSalt: string; passwordHash: string } {
  const passwordSalt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, passwordSalt, 64).toString('hex');
  return { passwordSalt, passwordHash };
}

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
  private store: Database.Database | null = null;
  private initPromise: Promise<void> | null = null;

  get location(): string {
    return filePath;
  }

  async initialize(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.runInit();
    return this.initPromise;
  }

  private async runInit(): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    this.store = new Database(filePath);
    this.store.pragma('journal_mode = WAL');
    this.store.pragma('foreign_keys = ON');
    this.store.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        organization TEXT NOT NULL,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        email_verified_at TEXT,
        email_verification_hash TEXT,
        email_verification_expires_at TEXT,
        created_at TEXT NOT NULL,
        last_login_at TEXT
      );
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        tier TEXT,
        status TEXT NOT NULL,
        objective TEXT,
        description TEXT,
        organization_context TEXT,
        scenario_context TEXT,
        timing_context TEXT,
        sender_config TEXT NOT NULL DEFAULT '{}',
        campaign_config TEXT NOT NULL DEFAULT '{}',
        created_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        scheduled_at TEXT
      );
      CREATE TABLE IF NOT EXISTS targets (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        name TEXT,
        first_name TEXT,
        last_name TEXT,
        email TEXT NOT NULL,
        department TEXT,
        role TEXT,
        position TEXT,
        personal_context TEXT,
        status TEXT NOT NULL,
        email_subject TEXT,
        email_body TEXT,
        sent_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS email_interactions (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        type TEXT NOT NULL,
        success INTEGER,
        meta TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS campaign_events (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        target_id TEXT,
        type TEXT NOT NULL,
        meta TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE SET NULL
      );
      CREATE TABLE IF NOT EXISTS connector_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
      CREATE INDEX IF NOT EXISTS idx_targets_campaign_id ON targets(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_interactions_campaign_id ON email_interactions(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_events_campaign_id ON campaign_events(campaign_id);
    `);

    const legacyUsers = this.store.prepare(`SELECT id, created_at FROM users WHERE email_verified_at IS NULL AND email_verification_hash IS NULL`).all() as Array<{ id: string; created_at: string }>;
    if (legacyUsers.length) {
      const statement = this.store.prepare(`UPDATE users SET email_verified_at = ? WHERE id = ?`);
      const transaction = this.store.transaction(() => {
        for (const user of legacyUsers) statement.run(user.created_at || new Date().toISOString(), user.id);
      });
      transaction();
    }
  }

  private ready(): Database.Database {
    if (!this.store) throw new Error('Database has not been initialized.');
    return this.store;
  }

  async getSetting<T>(key: string, fallback: T): Promise<T> {
    await this.initialize();
    const row = this.ready().prepare('SELECT value FROM connector_settings WHERE key = ?').get(key) as { value?: string } | undefined;
    return parseJson<T>(row?.value, fallback);
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    await this.initialize();
    this.ready().prepare(`INSERT INTO connector_settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, json(value));
  }

  async createUser(input: { email: string; password: string; name: string; organization: string; role?: string }): Promise<StoredUser> {
    await this.initialize();
    const db = this.ready();
    const email = normalizeEmail(input.email);
    if (this.findUserByEmailSync(email)) throw new Error('An account with this email already exists.');
    const { passwordSalt, passwordHash } = hashPassword(input.password);
    const user: StoredUser = {
      id: randomUUID(), email, name: input.name.trim(), organization: input.organization.trim(),
      role: input.role?.trim() || 'Security Analyst', passwordSalt, passwordHash, createdAt: new Date().toISOString(),
    };
    db.prepare(`INSERT INTO users(id,email,name,organization,role,password_hash,password_salt,created_at) VALUES(?,?,?,?,?,?,?,?)`).run(
      user.id, user.email, user.name, user.organization, user.role, user.passwordHash, user.passwordSalt, user.createdAt,
    );
    return user;
  }

  private mapUser(row: Record<string, unknown> | undefined): StoredUser | null {
    if (!row) return null;
    return {
      id: String(row.id), email: String(row.email), name: String(row.name), organization: String(row.organization), role: String(row.role),
      passwordHash: String(row.password_hash), passwordSalt: String(row.password_salt),
      emailVerifiedAt: row.email_verified_at ? String(row.email_verified_at) : undefined,
      emailVerificationHash: row.email_verification_hash ? String(row.email_verification_hash) : undefined,
      emailVerificationExpiresAt: row.email_verification_expires_at ? String(row.email_verification_expires_at) : undefined,
      createdAt: String(row.created_at), lastLoginAt: row.last_login_at ? String(row.last_login_at) : undefined,
    };
  }

  private findUserByEmailSync(email: string): StoredUser | null {
    return this.mapUser(this.ready().prepare('SELECT * FROM users WHERE email = ?').get(email) as Record<string, unknown> | undefined);
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    await this.initialize(); return this.findUserByEmailSync(email);
  }

  async findUserById(id: string): Promise<StoredUser | null> {
    await this.initialize(); return this.mapUser(this.ready().prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined);
  }

  async updateUser(id: string, patch: Partial<StoredUser>): Promise<StoredUser | null> {
    await this.initialize();
    const current = await this.findUserById(id);
    if (!current) return null;
    const next = { ...current, ...patch };
    this.ready().prepare(`UPDATE users SET email=?,name=?,organization=?,role=?,password_hash=?,password_salt=?,email_verified_at=?,email_verification_hash=?,email_verification_expires_at=?,created_at=?,last_login_at=? WHERE id=?`).run(
      next.email, next.name, next.organization, next.role, next.passwordHash, next.passwordSalt, next.emailVerifiedAt ?? null,
      next.emailVerificationHash ?? null, next.emailVerificationExpiresAt ?? null, next.createdAt, next.lastLoginAt ?? null, id,
    );
    return next;
  }

  async listUsers(): Promise<StoredUser[]> {
    await this.initialize(); return (this.ready().prepare('SELECT * FROM users ORDER BY created_at DESC').all() as Array<Record<string, unknown>>).map((row) => this.mapUser(row)!).filter(Boolean);
  }

  async countUsers(): Promise<number> {
    await this.initialize(); return Number((this.ready().prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }).count);
  }

  private mapCampaign(row: Record<string, unknown>): StoredCampaignRecord {
    return {
      id: String(row.id), name: String(row.name), type: row.type ? String(row.type) : undefined, tier: row.tier ? String(row.tier) : undefined,
      status: String(row.status), objective: row.objective ? String(row.objective) : undefined, description: row.description ? String(row.description) : undefined,
      organizationContext: row.organization_context ? String(row.organization_context) : undefined,
      scenarioContext: row.scenario_context ? String(row.scenario_context) : undefined,
      timingContext: row.timing_context ? String(row.timing_context) : undefined,
      senderConfig: parseJson<Record<string, unknown>>(String(row.sender_config ?? '{}'), {}),
      campaignConfig: parseJson<Record<string, unknown>>(String(row.campaign_config ?? '{}'), {}),
      createdBy: row.created_by ? String(row.created_by) : undefined, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
      startedAt: row.started_at ? String(row.started_at) : null, completedAt: row.completed_at ? String(row.completed_at) : null,
      scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    };
  }

  async createCampaign(input: Partial<StoredCampaignRecord> & { name: string }): Promise<StoredCampaignRecord> {
    await this.initialize();
    const now = new Date().toISOString();
    const campaign: StoredCampaignRecord = {
      id: input.id ?? randomUUID(), name: input.name, type: input.type, tier: input.tier, status: input.status ?? 'DRAFT', objective: input.objective,
      description: input.description, organizationContext: input.organizationContext, scenarioContext: input.scenarioContext, timingContext: input.timingContext,
      senderConfig: input.senderConfig ?? {}, campaignConfig: input.campaignConfig ?? {}, createdBy: input.createdBy, createdAt: now, updatedAt: now,
      startedAt: input.startedAt ?? null, completedAt: input.completedAt ?? null, scheduledAt: input.scheduledAt ?? null,
    };
    this.ready().prepare(`INSERT INTO campaigns(id,name,type,tier,status,objective,description,organization_context,scenario_context,timing_context,sender_config,campaign_config,created_by,created_at,updated_at,started_at,completed_at,scheduled_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      campaign.id, campaign.name, campaign.type ?? null, campaign.tier ?? null, campaign.status, campaign.objective ?? null, campaign.description ?? null,
      campaign.organizationContext ?? null, campaign.scenarioContext ?? null, campaign.timingContext ?? null, json(campaign.senderConfig), json(campaign.campaignConfig),
      campaign.createdBy ?? null, campaign.createdAt, campaign.updatedAt, campaign.startedAt ?? null, campaign.completedAt ?? null, campaign.scheduledAt ?? null,
    );
    return campaign;
  }

  async getCampaign(id: string): Promise<StoredCampaignRecord | null> {
    await this.initialize(); const row = this.ready().prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Record<string, unknown> | undefined; return row ? this.mapCampaign(row) : null;
  }

  async updateCampaign(id: string, patch: Partial<StoredCampaignRecord>): Promise<StoredCampaignRecord | null> {
    await this.initialize();
    const current = await this.getCampaign(id); if (!current) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.ready().prepare(`UPDATE campaigns SET name=?,type=?,tier=?,status=?,objective=?,description=?,organization_context=?,scenario_context=?,timing_context=?,sender_config=?,campaign_config=?,created_by=?,updated_at=?,started_at=?,completed_at=?,scheduled_at=? WHERE id=?`).run(
      next.name, next.type ?? null, next.tier ?? null, next.status, next.objective ?? null, next.description ?? null, next.organizationContext ?? null,
      next.scenarioContext ?? null, next.timingContext ?? null, json(next.senderConfig), json(next.campaignConfig), next.createdBy ?? null, next.updatedAt,
      next.startedAt ?? null, next.completedAt ?? null, next.scheduledAt ?? null, id,
    );
    return next;
  }

  async listCampaigns(filter: { status?: string; createdBy?: string } = {}): Promise<StoredCampaignRecord[]> {
    await this.initialize();
    let sql = 'SELECT * FROM campaigns'; const params: string[] = []; const clauses: string[] = [];
    if (filter.status) { clauses.push('status = ?'); params.push(filter.status); }
    if (filter.createdBy) { clauses.push('created_by = ?'); params.push(filter.createdBy); }
    if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
    sql += ' ORDER BY updated_at DESC';
    return (this.ready().prepare(sql).all(...params) as Array<Record<string, unknown>>).map((row) => this.mapCampaign(row));
  }

  private mapTarget(row: Record<string, unknown>): StoredTargetRecord {
    return {
      id: String(row.id), campaignId: String(row.campaign_id), name: row.name ? String(row.name) : undefined, firstName: row.first_name ? String(row.first_name) : undefined,
      lastName: row.last_name ? String(row.last_name) : undefined, email: String(row.email), department: row.department ? String(row.department) : undefined,
      role: row.role ? String(row.role) : undefined, position: row.position ? String(row.position) : undefined,
      personalContext: row.personal_context ? String(row.personal_context) : undefined, status: String(row.status),
      emailSubject: row.email_subject ? String(row.email_subject) : undefined, emailBody: row.email_body ? String(row.email_body) : undefined,
      sentAt: row.sent_at ? String(row.sent_at) : null, createdAt: String(row.created_at),
    };
  }

  async createTarget(input: Partial<StoredTargetRecord> & { campaignId: string; email: string }): Promise<StoredTargetRecord> {
    await this.initialize();
    const target: StoredTargetRecord = {
      id: input.id ?? randomUUID(), campaignId: input.campaignId, name: input.name, firstName: input.firstName, lastName: input.lastName, email: input.email,
      department: input.department, role: input.role, position: input.position, personalContext: input.personalContext, status: input.status ?? 'pending',
      emailSubject: input.emailSubject, emailBody: input.emailBody, sentAt: input.sentAt ?? null, createdAt: new Date().toISOString(),
    };
    this.ready().prepare(`INSERT INTO targets(id,campaign_id,name,first_name,last_name,email,department,role,position,personal_context,status,email_subject,email_body,sent_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      target.id, target.campaignId, target.name ?? null, target.firstName ?? null, target.lastName ?? null, target.email, target.department ?? null, target.role ?? null,
      target.position ?? null, target.personalContext ?? null, target.status, target.emailSubject ?? null, target.emailBody ?? null, target.sentAt ?? null, target.createdAt,
    );
    return target;
  }

  async getTarget(id: string): Promise<StoredTargetRecord | null> {
    await this.initialize(); const row = this.ready().prepare('SELECT * FROM targets WHERE id = ?').get(id) as Record<string, unknown> | undefined; return row ? this.mapTarget(row) : null;
  }

  async getTargetsByCampaign(campaignId: string): Promise<StoredTargetRecord[]> {
    await this.initialize(); return (this.ready().prepare('SELECT * FROM targets WHERE campaign_id = ? ORDER BY created_at ASC').all(campaignId) as Array<Record<string, unknown>>).map((row) => this.mapTarget(row));
  }

  async updateTarget(id: string, patch: Partial<StoredTargetRecord>): Promise<StoredTargetRecord | null> {
    await this.initialize(); const current = await this.getTarget(id); if (!current) return null; const next = { ...current, ...patch };
    this.ready().prepare(`UPDATE targets SET campaign_id=?,name=?,first_name=?,last_name=?,email=?,department=?,role=?,position=?,personal_context=?,status=?,email_subject=?,email_body=?,sent_at=? WHERE id=?`).run(
      next.campaignId, next.name ?? null, next.firstName ?? null, next.lastName ?? null, next.email, next.department ?? null, next.role ?? null, next.position ?? null,
      next.personalContext ?? null, next.status, next.emailSubject ?? null, next.emailBody ?? null, next.sentAt ?? null, id,
    );
    return next;
  }

  async logEvent(campaignId: string, targetId: string | null | undefined, type: string, meta: Record<string, unknown> = {}) {
    await this.initialize(); const event: StoredEvent = { id: randomUUID(), campaignId, targetId: targetId ?? null, type, meta, createdAt: new Date().toISOString() };
    this.ready().prepare(`INSERT INTO campaign_events(id,campaign_id,target_id,type,meta,created_at) VALUES(?,?,?,?,?,?)`).run(event.id, event.campaignId, event.targetId, event.type, json(event.meta), event.createdAt); return event;
  }

  async getEvents(campaignId: string): Promise<StoredEvent[]> {
    await this.initialize(); return (this.ready().prepare('SELECT * FROM campaign_events WHERE campaign_id = ? ORDER BY created_at ASC').all(campaignId) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id), campaignId: String(row.campaign_id), targetId: row.target_id ? String(row.target_id) : null, type: String(row.type), meta: parseJson<Record<string, unknown>>(String(row.meta ?? '{}'), {}), createdAt: String(row.created_at),
    }));
  }

  async recordInteraction(input: { campaignId: string; targetId: string; type: string; success?: boolean; meta?: Record<string, unknown> }) {
    await this.initialize(); const interaction: StoredInteraction = { id: randomUUID(), campaignId: input.campaignId, targetId: input.targetId, type: input.type, success: input.success, meta: input.meta ?? {}, createdAt: new Date().toISOString() };
    this.ready().prepare(`INSERT INTO email_interactions(id,campaign_id,target_id,type,success,meta,created_at) VALUES(?,?,?,?,?,?,?)`).run(interaction.id, interaction.campaignId, interaction.targetId, interaction.type, interaction.success == null ? null : interaction.success ? 1 : 0, json(interaction.meta), interaction.createdAt); return interaction;
  }

  async getInteractions(campaignId: string): Promise<StoredInteraction[]> {
    await this.initialize(); return (this.ready().prepare('SELECT * FROM email_interactions WHERE campaign_id = ? ORDER BY created_at ASC').all(campaignId) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id), campaignId: String(row.campaign_id), targetId: String(row.target_id), type: String(row.type), success: row.success == null ? undefined : Boolean(row.success), meta: parseJson<Record<string, unknown>>(String(row.meta ?? '{}'), {}), createdAt: String(row.created_at),
    }));
  }

  async findInteractionByMessageId(messageId: string): Promise<StoredInteraction | null> {
    const needle = normalizeMessageId(messageId); if (!needle) return null; const data = await this.getInteractionsForSearch();
    return data.find((interaction) => typeof interaction.meta?.messageId === 'string' && normalizeMessageId(String(interaction.meta.messageId)) === needle) ?? null;
  }

  private async getInteractionsForSearch(): Promise<StoredInteraction[]> { return this.getAllInteractions(); }

  private async getAllInteractions(): Promise<StoredInteraction[]> {
    await this.initialize(); return (this.ready().prepare('SELECT * FROM email_interactions ORDER BY created_at ASC').all() as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id), campaignId: String(row.campaign_id), targetId: String(row.target_id), type: String(row.type), success: row.success == null ? undefined : Boolean(row.success), meta: parseJson<Record<string, unknown>>(String(row.meta ?? '{}'), {}), createdAt: String(row.created_at),
    }));
  }

  async findTargetsByEmail(email: string): Promise<StoredTargetRecord[]> {
    await this.initialize(); return (this.ready().prepare('SELECT * FROM targets WHERE lower(email) = lower(?) ORDER BY created_at ASC').all(normalizeEmail(email)) as Array<Record<string, unknown>>).map((row) => this.mapTarget(row));
  }

  async hasReplyWithMessageId(campaignId: string, messageId: string): Promise<boolean> {
    const needle = normalizeMessageId(messageId); if (!needle) return false; const rows = await this.getInteractions(campaignId);
    return rows.some((interaction) => interaction.type === 'reply' && typeof interaction.meta?.messageId === 'string' && normalizeMessageId(String(interaction.meta.messageId)) === needle);
  }
}

export function normalizeMessageId(messageId: string): string {
  return (messageId ?? '').trim().replace(/^<|>$/g, '').toLowerCase();
}

export const databaseService = new DatabaseService();
