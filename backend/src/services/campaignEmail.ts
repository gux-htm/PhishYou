/**
 * PhishYou — Contextual campaign email generation + delivery
 * Spec: PHISHYOU_SPECS/03_AI_AGENT_CORE/LLM_SYSTEM_PROMPTS.md
 *       PHISHYOU_SPECS/05_ATTACK_VECTORS/ATTACK_PLAYBOOK.md
 *
 * Generates role/context-aware simulation emails through the configured AI
 * provider and hands them to the email transport. AI failures degrade to a
 * deterministic template so a campaign never crashes mid-run.
 */
import { createProvider } from '../providers/factory.js';
import type { AIProvider } from '../providers/types.js';
import { mergeAIConfig, isAIConfigured } from '../config.js';
import { db } from '../store.js';
import { emailService } from './email.js';

export interface SenderConfig {
  fromName: string;
  fromEmail: string;
  replyTo?: string;
}

export interface CampaignTarget {
  id: string;
  name: string;
  email: string;
  department?: string;
  role: string;
  personalContext?: string;
}

export interface CampaignContext {
  id: string;
  name: string;
  organizationContext?: string;
  campaignObjective?: string;
  scenarioContext?: string;
  urgencyLevel?: string;
  sender: SenderConfig;
}

export interface PersonalizedEmail {
  target: CampaignTarget;
  subject: string;
  body: string;
  html: string;
  reasoning?: string;
  generatedAt: string;
}

export interface SendCampaignOptions {
  generateAll?: boolean;
  batchSize?: number;
  delayBetweenBatches?: number;
  delayBetweenEmails?: number;
}

export interface SendResult {
  success: boolean;
  target: CampaignTarget;
  messageId?: string | null;
  simulated?: boolean;
  error?: string;
}

export interface CampaignExecutionResult {
  summary: { total: number; successful: number; failed: number };
  personalizedEmails: PersonalizedEmail[];
  results: SendResult[];
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

function toHtml(body: string): string {
  return body
    .split('\n')
    .map((line) => (line.trim() ? `<p>${line}</p>` : '<br />'))
    .join('');
}

function fallbackEmail(target: CampaignTarget, ctx: CampaignContext): PersonalizedEmail {
  const firstName = target.name.split(' ')[0] || 'there';
  const subject = `${ctx.urgencyLevel === 'high' ? 'Action required' : 'Quick update'} — ${ctx.name}`;
  const body = [
    `Hi ${firstName},`,
    '',
    ctx.scenarioContext || ctx.organizationContext || `${ctx.name} requires your attention.`,
    '',
    `As part of the ${target.department || 'team'} awareness program, please review the attached guidance relevant to your role (${target.role}).`,
    '',
    'Thank you,',
    ctx.sender.fromName,
  ].join('\n');
  return { target, subject, body, html: toHtml(body), reasoning: 'deterministic-template', generatedAt: new Date().toISOString() };
}

class CampaignEmailService {
  private provider: AIProvider | null = null;

  private getProvider(): AIProvider | null {
    const config = mergeAIConfig(db.data?.ai ?? {});
    if (!isAIConfigured(config)) return null;
    if (!this.provider) this.provider = createProvider(config);
    return this.provider;
  }

  private buildPrompt(target: CampaignTarget, ctx: CampaignContext): string {
    return [
      'Generate a personalized phishing-awareness simulation email.',
      '',
      `Campaign: ${ctx.name}`,
      `Objective: ${ctx.campaignObjective ?? ''}`,
      `Organization context: ${ctx.organizationContext ?? ''}`,
      `Scenario context: ${ctx.scenarioContext ?? ''}`,
      `Urgency level: ${ctx.urgencyLevel ?? 'normal'}`,
      '',
      'Target:',
      `- Name: ${target.name}`,
      `- Email: ${target.email}`,
      `- Department: ${target.department ?? 'Unknown'}`,
      `- Role: ${target.role}`,
      `- Personal context: ${target.personalContext ?? ''}`,
      '',
      'Requirements: realistic subject line, professional body personalized to the role/department, training-appropriate tone.',
      'Respond strictly as JSON: { "subject": string, "body": string, "reasoning": string }',
    ].join('\n');
  }

  async generatePersonalizedEmail(target: CampaignTarget, ctx: CampaignContext): Promise<PersonalizedEmail> {
    const provider = this.getProvider();
    if (!provider) return fallbackEmail(target, ctx);

    try {
      const response = await provider.chat([{ role: 'user', content: this.buildPrompt(target, ctx) }]);
      const text = response.content ?? '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { subject?: string; body?: string; reasoning?: string };
        const body = parsed.body || text;
        return {
          target,
          subject: parsed.subject || `${ctx.name} — action required`,
          body,
          html: toHtml(body),
          reasoning: parsed.reasoning,
          generatedAt: new Date().toISOString(),
        };
      }
      return { target, subject: `${ctx.name} — action required`, body: text, html: toHtml(text), generatedAt: new Date().toISOString() };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[campaignEmail] AI generation failed, using template:', error instanceof Error ? error.message : error);
      return fallbackEmail(target, ctx);
    }
  }

  async generateBulkPersonalizedEmails(targets: CampaignTarget[], ctx: CampaignContext): Promise<PersonalizedEmail[]> {
    const emails: PersonalizedEmail[] = [];
    for (const target of targets) {
      emails.push(await this.generatePersonalizedEmail(target, ctx));
    }
    return emails;
  }

  async sendCampaignEmail(email: PersonalizedEmail, ctx: CampaignContext): Promise<SendResult> {
    const result = await emailService.sendEmail({
      to: email.target.email,
      subject: email.subject,
      text: email.body,
      html: email.html,
      from: ctx.sender.fromEmail,
      // Route replies to the monitored mailbox so the IMAP watcher can catch them.
      replyTo: ctx.sender.replyTo,
      // Correlation markers (best-effort; threading via Message-ID is the primary key).
      headers: {
        'X-PhishYou-Campaign': ctx.id,
        'X-PhishYou-Target': email.target.id,
      },
    });
    return { success: result.success, target: email.target, messageId: result.messageId, simulated: result.simulated, error: result.error };
  }

  async sendCampaignEmails(emails: PersonalizedEmail[], ctx: CampaignContext, options: SendCampaignOptions = {}): Promise<SendResult[]> {
    const results: SendResult[] = [];
    const batchSize = options.batchSize && options.batchSize > 0 ? options.batchSize : emails.length;
    const delayBetweenEmails = options.delayBetweenEmails ?? 0;
    const delayBetweenBatches = options.delayBetweenBatches ?? 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      for (const email of batch) {
        results.push(await this.sendCampaignEmail(email, ctx));
        if (delayBetweenEmails) await delay(delayBetweenEmails);
      }
      if (i + batchSize < emails.length && delayBetweenBatches) await delay(delayBetweenBatches);
    }
    return results;
  }

  async generateAndSendCampaign(targets: CampaignTarget[], ctx: CampaignContext, options: SendCampaignOptions = {}): Promise<CampaignExecutionResult> {
    const personalizedEmails = await this.generateBulkPersonalizedEmails(targets, ctx);
    const results = await this.sendCampaignEmails(personalizedEmails, ctx, options);
    const successful = results.filter((r) => r.success).length;
    return {
      summary: { total: results.length, successful, failed: results.length - successful },
      personalizedEmails,
      results,
    };
  }
}

export const campaignEmailService = new CampaignEmailService();
