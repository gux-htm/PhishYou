/**
 * PhishYou — Email (SMTP) service
 * Spec: PHISHYOU_SPECS/05_ATTACK_VECTORS/EMAIL_SPOOFING.md
 *
 * Real delivery via nodemailer. Configuration is read from environment
 * variables so no secrets live in the repo:
 *   SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS / SMTP_FROM
 *   REPLY_TO (optional) — mailbox that receives target replies; defaults to SMTP_FROM.
 *
 * When SMTP is not configured the service degrades to an explicit *simulated*
 * transport (logged, `simulated: true`) so the campaign pipeline still runs and
 * the reply-monitoring loop can be exercised locally. Outbound messages carry a
 * Reply-To pointing at the monitored mailbox plus correlation headers, and the
 * real RFC Message-ID is returned so inbound replies can be matched back to the
 * originating campaign + target.
 */
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { mergeEmailConfig, isEmailConfigured } from '../config.js';
import { db } from '../store.js';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo: string;
}

/** Format the From header as `"Name" <addr>` when a display name is set. */
function formatFrom(fromEmail: string, fromName: string): string {
  if (!fromName) return fromEmail;
  if (fromEmail.includes('<')) return fromEmail; // already formatted
  return `"${fromName}" <${fromEmail}>`;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  /** Mailbox that should receive replies (defaults to the monitored mailbox). */
  replyTo?: string;
  /** Extra RFC headers, e.g. correlation markers. */
  headers?: Record<string, string>;
  /** Threading hints (used when relaying/simulating a reply). */
  inReplyTo?: string;
  references?: string | string[];
}

export interface SendEmailResult {
  success: boolean;
  simulated: boolean;
  messageId: string | null;
  to: string;
  subject: string;
  error?: string;
}

function readConfig(): SmtpConfig {
  const merged = mergeEmailConfig(db.data?.email ?? {});
  return {
    host: merged.host,
    port: merged.port ?? (merged.secure ? 465 : 587),
    secure: merged.secure,
    user: merged.username,
    pass: merged.password,
    from: formatFrom(merged.fromEmail || merged.username, merged.fromName),
    // Replies must land in the mailbox the IMAP watcher polls.
    replyTo: merged.replyTo || merged.fromEmail || merged.username,
  };
}

class EmailService {
  private transporter: Transporter | null = null;

  /** SMTP is considered configured when a host and a sender address exist. */
  isConfigured(): boolean {
    return isEmailConfigured(mergeEmailConfig(db.data?.email ?? {}));
  }

  /** Drop the cached transporter so the next send picks up new credentials. */
  resetTransporter(): void {
    this.transporter = null;
  }

  /** The mailbox replies are routed to (and that the IMAP watcher should poll). */
  monitorMailbox(): string {
    return readConfig().replyTo;
  }

  /** Non-secret view of the current SMTP configuration (for the UI). */
  getStatus(): {
    configured: boolean;
    transport: 'smtp' | 'simulated';
    host: string | null;
    port: number;
    from: string | null;
    replyTo: string | null;
    secure: boolean;
  } {
    const config = readConfig();
    return {
      configured: this.isConfigured(),
      transport: this.isConfigured() ? 'smtp' : 'simulated',
      host: config.host || null,
      port: config.port,
      from: config.from || null,
      replyTo: config.replyTo || null,
      secure: config.secure,
    };
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;
    const config = readConfig();
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    });
    return this.transporter;
  }

  /** Live handshake against the SMTP server (for the monitoring self-test). */
  async verify(): Promise<{ ok: boolean; transport: 'smtp' | 'simulated'; host: string | null; error?: string }> {
    if (!this.isConfigured()) {
      return { ok: false, transport: 'simulated', host: null, error: 'SMTP is not configured.' };
    }
    try {
      await this.getTransporter().verify();
      return { ok: true, transport: 'smtp', host: readConfig().host };
    } catch (error) {
      return { ok: false, transport: 'smtp', host: readConfig().host, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const base = { to: input.to, subject: input.subject, messageId: null as string | null };

    if (!input.to || !input.subject) {
      return { ...base, success: false, simulated: false, error: 'Recipient and subject are required.' };
    }

    if (!this.isConfigured()) {
      return this.simulate(input, base);
    }

    return this.deliver(input, base);
  }

  /** Real SMTP delivery via nodemailer. */
  private async deliver(input: SendEmailInput, base: { to: string; subject: string; messageId: string | null }): Promise<SendEmailResult> {
    const config = readConfig();
    try {
      const info = await this.getTransporter().sendMail({
        from: input.from || config.from,
        to: input.to,
        replyTo: input.replyTo || config.replyTo || config.from,
        subject: input.subject,
        text: input.text,
        html: input.html,
        inReplyTo: input.inReplyTo,
        references: input.references,
        headers: input.headers,
      });
      // eslint-disable-next-line no-console
      console.log(`[email:smtp] to=${input.to} subject="${input.subject}" messageId=${info.messageId}`);
      return { ...base, success: true, simulated: false, messageId: info.messageId ?? null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.error(`[email:smtp] send failed to=${input.to}:`, message);
      return { ...base, success: false, simulated: false, error: message };
    }
  }

  /**
   * Simulated transport used when SMTP is not configured. Logs the intent and
   * returns a stable Message-ID so the campaign pipeline can record an
   * interaction and the reply-monitoring loop can still be exercised locally.
   */
  private simulate(input: SendEmailInput, base: { to: string; subject: string; messageId: string | null }): Promise<SendEmailResult> {
    const config = readConfig();
    const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2, 8)}@phishyou.local>`;
    // eslint-disable-next-line no-console
    console.log(`[email:simulated] from=${input.from || config.from || '(unset)'} to=${input.to} subject="${input.subject}"`);
    return Promise.resolve({ ...base, success: true, simulated: true, messageId });
  }
}

export const emailService = new EmailService();
