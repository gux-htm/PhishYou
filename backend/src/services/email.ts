import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
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

export interface SendEmailInput {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
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

function env(key: string, fallback = ''): string {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
}

function readConfig(): SmtpConfig {
  const stored = db.data?.email;
  const from = stored?.from || env('SMTP_FROM') || env('EMAIL_FROM');
  return {
    host: stored?.host || env('SMTP_HOST'),
    port: stored?.port || Number(env('SMTP_PORT', '587')) || 587,
    secure: stored?.host ? stored.secure : env('SMTP_SECURE', 'false') === 'true',
    user: stored?.user || env('SMTP_USER'),
    pass: stored?.pass || env('SMTP_PASS'),
    from,
    replyTo: stored?.replyTo || env('REPLY_TO') || env('SMTP_REPLY_TO') || from,
  };
}

class EmailService {
  private transporter: Transporter | null = null;
  private transporterSignature = '';

  isConfigured(): boolean {
    const config = readConfig();
    return Boolean(config.host && config.from);
  }

  monitorMailbox(): string {
    return readConfig().replyTo;
  }

  getStatus() {
    const config = readConfig();
    return {
      configured: this.isConfigured(),
      transport: this.isConfigured() ? 'smtp' as const : 'simulated' as const,
      host: config.host || null,
      port: config.port,
      from: config.from || null,
      replyTo: config.replyTo || null,
      secure: config.secure,
    };
  }

  private getTransporter(): Transporter {
    const config = readConfig();
    const signature = `${config.host}|${config.port}|${config.secure}|${config.user}|${config.from}`;
    if (this.transporter && this.transporterSignature === signature) return this.transporter;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    });
    this.transporterSignature = signature;
    return this.transporter;
  }

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
    if (!input.to || !input.subject) return { ...base, success: false, simulated: false, error: 'Recipient and subject are required.' };
    if (!this.isConfigured()) return this.simulate(input, base);
    return this.deliver(input, base);
  }

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
      return { ...base, success: true, simulated: false, messageId: info.messageId ?? null };
    } catch (error) {
      return { ...base, success: false, simulated: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private simulate(input: SendEmailInput, base: { to: string; subject: string; messageId: string | null }): Promise<SendEmailResult> {
    const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2, 8)}@phishyou.local>`;
    return Promise.resolve({ ...base, success: true, simulated: true, messageId });
  }
}

export const emailService = new EmailService();
