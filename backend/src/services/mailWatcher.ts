/**
 * PhishYou — Inbound reply monitoring (IMAP watcher)
 * Spec: PHISHYOU_SPECS/06_PERSISTENCE_LOGIC/PERSISTENCE_STATE_MACHINE.md
 *
 * Polls a mailbox over IMAP for unseen messages and correlates each inbound
 * reply back to the campaign + target that received the original simulated
 * email. Correlation is primarily by threading (the reply's In-Reply-To /
 * References header matches the outbound Message-ID stored on the `sent`
 * interaction); it falls back to matching the sender address to a known target.
 *
 * A matched reply is persisted as an `email_interactions` row (type `reply`),
 * a `REPLY_RECEIVED` campaign event, and flips the target status to `replied`.
 *
 * The correlation + persistence logic lives in `ingestReply()` so it can be
 * driven either by live IMAP polling or by the monitoring API's simulate-reply
 * endpoint (used to verify the loop locally without a mail server).
 *
 * Env: IMAP_HOST/IMAP_PORT/IMAP_SECURE/IMAP_USER/IMAP_PASS/IMAP_MAILBOX,
 *      MAIL_POLL_INTERVAL_MS. IMAP_HOST/USER/PASS fall back to the SMTP_* values.
 */
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { databaseService, normalizeMessageId } from './database.js';
import { mergeEmailConfig } from '../config.js';
import { db } from '../store.js';

export interface InboundReply {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string | string[];
  messageId?: string;
  date?: Date;
}

export interface ReplyIngestResult {
  matched: boolean;
  duplicate?: boolean;
  campaignId?: string;
  targetId?: string;
  via?: 'thread' | 'sender';
  reason?: string;
}

export interface PollResult {
  ok: boolean;
  newMessages: number;
  matched: number;
  error?: string;
}

interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  mailbox: string;
  pollIntervalMs: number;
}

function env(key: string, fallback = ''): string {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
}

function readImapConfig(): ImapConfig {
  const merged = mergeEmailConfig(db.data?.email ?? {});
  const secure = env('IMAP_SECURE', 'true') === 'true';
  const defaultPort = secure ? 993 : 143;
  return {
    host: merged.imapHost || merged.host,
    port: merged.imapPort ?? defaultPort,
    secure,
    user: merged.username,
    pass: merged.password,
    mailbox: env('IMAP_MAILBOX', 'INBOX'),
    pollIntervalMs: Number(env('MAIL_POLL_INTERVAL_MS', '15000')) || 15000,
  };
}

/** Flatten In-Reply-To + References into a de-duplicated list of bare message ids. */
function normalizeRefs(inReplyTo?: string, references?: string | string[]): string[] {
  const out: string[] = [];
  const push = (value?: string) => {
    if (!value) return;
    for (const part of value.split(/\s+/)) {
      const id = normalizeMessageId(part);
      if (id) out.push(id);
    }
  };
  push(inReplyTo);
  if (Array.isArray(references)) references.forEach((r) => push(r));
  else push(references);
  return [...new Set(out)];
}

class MailWatcher {
  private client: ImapFlow | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private polling = false;
  private repliesDetected = 0;
  private lastPollAt: string | null = null;
  private lastError: string | null = null;
  /** Invoked after a reply is persisted — lets the campaign agent respond. */
  private replyListener: ((campaignId: string, targetId: string) => void) | null = null;

  /** Register a callback fired for every matched, non-duplicate inbound reply. */
  onReply(listener: (campaignId: string, targetId: string) => void): void {
    this.replyListener = listener;
  }

  isConfigured(): boolean {
    const cfg = readImapConfig();
    return Boolean(cfg.host && cfg.user && cfg.pass);
  }

  getStatus(): {
    configured: boolean;
    host: string | null;
    port: number;
    secure: boolean;
    mailbox: string;
    running: boolean;
    lastPollAt: string | null;
    lastError: string | null;
    repliesDetected: number;
  } {
    const cfg = readImapConfig();
    return {
      configured: this.isConfigured(),
      host: cfg.host || null,
      port: cfg.port,
      secure: cfg.secure,
      mailbox: cfg.mailbox,
      running: this.running,
      lastPollAt: this.lastPollAt,
      lastError: this.lastError,
      repliesDetected: this.repliesDetected,
    };
  }

  /** Connect (best-effort) and begin interval polling. */
  async start(): Promise<void> {
    if (!this.isConfigured() || this.running) return;
    this.running = true;
    try {
      await this.connect();
      // eslint-disable-next-line no-console
      console.log(`[mailWatcher] connected to IMAP ${readImapConfig().host}:${readImapConfig().port} (${readImapConfig().mailbox})`);
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.error('[mailWatcher] initial connection failed:', this.lastError);
    }
    this.timer = setInterval(() => void this.poll(), readImapConfig().pollIntervalMs);
    void this.poll();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.client) {
      try {
        await this.client.logout();
      } catch {
        /* ignore */
      }
      this.client = null;
    }
  }

  /** Manually trigger a poll (used by the monitoring API + tests). */
  async pollNow(): Promise<PollResult> {
    if (!this.isConfigured()) return { ok: false, newMessages: 0, matched: 0, error: 'IMAP is not configured.' };
    return this.poll();
  }

  private async connect(): Promise<void> {
    if (this.client) return;
    const cfg = readImapConfig();
    const client = new ImapFlow({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
      logger: false,
    });
    await client.connect();
    this.client = client;
  }

  private async poll(): Promise<PollResult> {
    if (this.polling) return { ok: true, newMessages: 0, matched: 0 };
    this.polling = true;
    let newMessages = 0;
    let matched = 0;
    try {
      await this.connect();
      const client = this.client as ImapFlow;
      const cfg = readImapConfig();
      const lock = await client.getMailboxLock(cfg.mailbox);
      try {
        for await (const message of client.fetch({ seen: false }, { uid: true, flags: true, source: true }, { uid: true })) {
          if (!message.source) continue;
          newMessages += 1;
          const parsed = await simpleParser(message.source);
          const result = await this.ingestReply({
            from: parsed.from?.value?.[0]?.address,
            subject: parsed.subject ?? undefined,
            text: parsed.text ?? undefined,
            html: typeof parsed.html === 'string' ? parsed.html : undefined,
            inReplyTo: parsed.inReplyTo,
            references: parsed.references,
            messageId: parsed.messageId,
            date: parsed.date,
          });
          if (result.matched && !result.duplicate) matched += 1;
          if (typeof message.uid === 'number') {
            await client.messageFlagsAdd([message.uid], ['\\Seen'], { uid: true });
          }
        }
      } finally {
        lock.release();
      }
      this.lastPollAt = new Date().toISOString();
      this.lastError = null;
      return { ok: true, newMessages, matched };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.error('[mailWatcher] poll failed:', this.lastError);
      this.client = null; // force reconnect on next poll
      return { ok: false, newMessages, matched, error: this.lastError };
    } finally {
      this.polling = false;
    }
  }

  /**
   * Correlate an inbound reply to a campaign + target and persist it. Shared by
   * live IMAP polling and the simulate-reply endpoint.
   */
  async ingestReply(reply: InboundReply): Promise<ReplyIngestResult> {
    const inboundId = reply.messageId || `<reply.${Date.now()}@phishyou.local>`;
    const refs = normalizeRefs(reply.inReplyTo, reply.references);
    const fromAddress = reply.from?.trim().toLowerCase();

    let campaignId: string | undefined;
    let targetId: string | undefined;
    let via: 'thread' | 'sender' | undefined;

    // 1) Thread correlation: match In-Reply-To / References to a stored outbound Message-ID.
    for (const ref of refs) {
      const interaction = await databaseService.findInteractionByMessageId(ref);
      if (interaction) {
        campaignId = interaction.campaignId;
        targetId = interaction.targetId;
        via = 'thread';
        break;
      }
    }

    // 2) Sender correlation fallback: match the reply's From address to a known target.
    if (!campaignId && fromAddress) {
      const targets = await databaseService.findTargetsByEmail(fromAddress);
      const engaged = targets.filter((t) => ['sent', 'opened', 'clicked'].includes(t.status));
      const pool = engaged.length ? engaged : targets;
      const pick = pool.sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))[0];
      if (pick) {
        campaignId = pick.campaignId;
        targetId = pick.id;
        via = 'sender';
      }
    }

    if (!campaignId || !targetId) {
      return { matched: false, reason: refs.length || fromAddress ? 'no-correlation' : 'no-identifiers' };
    }

    // De-duplicate a reply we have already recorded.
    if (await databaseService.hasReplyWithMessageId(campaignId, inboundId)) {
      return { matched: true, duplicate: true, campaignId, targetId, via };
    }

    const receivedAt = (reply.date ?? new Date()).toISOString();
    const body = (reply.text || reply.html || '').slice(0, 4000);

    await databaseService.recordInteraction({
      campaignId,
      targetId,
      type: 'reply',
      success: true,
      meta: {
        from: fromAddress ?? null,
        subject: reply.subject ?? null,
        body,
        messageId: inboundId,
        inReplyTo: reply.inReplyTo ?? null,
        receivedAt,
      },
    });
    await databaseService.logEvent(campaignId, targetId, 'REPLY_RECEIVED', {
      from: fromAddress ?? null,
      subject: reply.subject ?? null,
      preview: body.slice(0, 200),
      receivedAt,
    });
    await databaseService.updateTarget(targetId, { status: 'replied' });

    this.repliesDetected += 1;
    // eslint-disable-next-line no-console
    console.log(`[mailWatcher] reply matched campaign=${campaignId} target=${targetId} via=${via}`);
    try {
      this.replyListener?.(campaignId, targetId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[mailWatcher] reply listener failed:', error instanceof Error ? error.message : error);
    }
    return { matched: true, campaignId, targetId, via };
  }
}

export const mailWatcher = new MailWatcher();
