/**
 * PhishYou — Campaign agent
 * Spec: PHISHYOU_SPECS/03_AI_AGENT_CORE/AGENT_ORCHESTRATION.md
 *       PHISHYOU_SPECS/03_AI_AGENT_CORE/STATE_MACHINE_LOGIC.md
 *       PHISHYOU_SPECS/06_PERSISTENCE_LOGIC/PERSISTENCE_TIERS.md
 *
 * The conversational brain behind the /campaigns/:id chat page. The operator
 * talks to it in natural language; it plans the campaign, generates and sends
 * personalized simulation emails through the email connector, watches for
 * inbound replies (via the mailWatcher hook), scores resistance, escalates
 * through persistence tiers and replies autonomously — narrating every step
 * back into the operator chat thread.
 */
import { databaseService, type StoredChatMessage } from './database.js';
import { campaignPersistenceService } from './campaignPersistence.js';
import { campaignEmailService, type CampaignContext, type CampaignTarget } from './campaignEmail.js';
import { emailService } from './email.js';
import { mergeAIConfig, isAIConfigured } from '../config.js';
import { createProvider } from '../providers/factory.js';
import type { ChatMessage } from '../providers/types.js';
import { db } from '../store.js';

export interface ParsedTarget {
  name: string;
  email: string;
  role?: string;
  department?: string;
  personalContext?: string;
}

export interface ParsedContext {
  objective?: string;
  organizationContext?: string;
  targets: ParsedTarget[];
  senderName?: string;
  senderEmail?: string;
  tier?: 'A' | 'B' | 'C';
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

async function post(campaignId: string, content: string, kind?: string): Promise<void> {
  await databaseService.addChatMessage(campaignId, 'assistant', content, kind);
}

function toHtml(body: string): string {
  return body
    .split('\n')
    .map((line) => (line.trim() ? `<p>${line}</p>` : '<br />'))
    .join('');
}

function extractJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    // Try to salvage the largest balanced object
    const start = text.indexOf(match[0][0]);
    for (let end = text.length; end > start; end--) {
      try {
        return JSON.parse(text.slice(start, end)) as T;
      } catch {
        /* keep shrinking */
      }
    }
    return null;
  }
}

function getAI() {
  const config = mergeAIConfig(db.data?.ai ?? {});
  return isAIConfigured(config) ? createProvider(config) : null;
}

function buildCampaignContext(campaign: {
  id: string;
  name: string;
  objective?: string;
  organizationContext?: string;
  scenarioContext?: string;
  senderConfig?: { fromName?: string; fromEmail?: string; replyTo?: string };
  campaignConfig?: { urgencyLevel?: string };
}): CampaignContext {
  const emailCfg = db.data?.email;
  return {
    id: campaign.id,
    name: campaign.name,
    organizationContext: campaign.organizationContext,
    campaignObjective: campaign.objective,
    scenarioContext: campaign.scenarioContext,
    urgencyLevel: campaign.campaignConfig?.urgencyLevel ?? 'normal',
    sender: {
      fromName: campaign.senderConfig?.fromName || emailCfg?.fromName || 'PhishYou Simulation',
      fromEmail: campaign.senderConfig?.fromEmail || emailCfg?.fromEmail || emailCfg?.username || '',
      replyTo: campaign.senderConfig?.replyTo || emailCfg?.replyTo || undefined,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Local (no-LLM) parsers — keep the agent functional when AI is off   */
/* ------------------------------------------------------------------ */

function parseTargetsLocally(context: string): ParsedTarget[] {
  const targets: ParsedTarget[] = [];
  const seen = new Set<string>();
  for (const rawLine of context.split(/\n+/)) {
    const line = rawLine.trim().replace(/^[-*•\d.)\s]+/, '');
    const emailMatch = line.match(EMAIL_RE);
    if (!emailMatch) continue;
    const email = emailMatch[0].toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const rest = line.replace(emailMatch[0], '').replace(/[<>()[\]]/g, ' ');
    const parts = rest.split(/[,\-|–—;:]+/).map((p) => p.trim()).filter(Boolean);
    const name = parts[0] && /[A-Za-z]{2,}/.test(parts[0]) ? parts[0] : email.split('@')[0];
    targets.push({ name, email, role: parts[1], department: parts[2] });
  }
  return targets;
}

function parseContextLocally(context: string): ParsedContext {
  const objectiveMatch = context.match(/objective\s*[:\-]\s*(.+)/i);
  const orgMatch = context.match(/organization\s*[:\-]\s*(.+)/i);
  const senderMatch = context.match(/sender\s*[:\-]\s*(.+)/i);
  const tierMatch = context.match(/tier\s*[:\-]?\s*([ABC])\b/i);
  return {
    objective: objectiveMatch?.[1]?.trim(),
    organizationContext: orgMatch?.[1]?.trim(),
    senderName: senderMatch?.[1]?.trim(),
    targets: parseTargetsLocally(context),
    tier: tierMatch ? (tierMatch[1].toUpperCase() as 'A' | 'B' | 'C') : undefined,
  };
}

function heuristicScore(replyText: string): number {
  const text = replyText.toLowerCase();
  let score = 0.35;
  const resistant = ['report', 'phish', 'scam', 'suspicious', 'verify', 'it security', 'not clicking', 'delete', 'spam', 'confirm with', 'call you'];
  const compliant = ['here is', 'password', 'login', 'credentials', 'approved', 'done', 'clicked', 'sent the', 'sure', 'okay', 'ok,', 'attached'];
  for (const w of resistant) if (text.includes(w)) score += 0.12;
  for (const w of compliant) if (text.includes(w)) score -= 0.1;
  return Math.min(0.95, Math.max(0.05, Number(score.toFixed(2))));
}

const TIER_TACTICS: Record<string, string[]> = {
  A: ['authority escalation', 'urgency deadline', 'fear of consequence', 'direct request'],
  B: ['polite reminder', 'soft urgency', 'authority reference', 'deadline'],
  C: ['single gentle nudge', 'final courteous follow-up'],
};

const MAX_FOLLOWUPS: Record<string, number> = { A: 4, B: 3, C: 2 };

function pickTactic(tier: string, followUps: number): string {
  const tactics = TIER_TACTICS[tier] ?? TIER_TACTICS.B;
  return tactics[Math.min(followUps, tactics.length - 1)];
}

/* ------------------------------------------------------------------ */
/* Agent                                                               */
/* ------------------------------------------------------------------ */

class CampaignAgentService {
  private static instance: CampaignAgentService | null = null;
  private executing = new Set<string>();

  static get(): CampaignAgentService {
    if (!this.instance) this.instance = new CampaignAgentService();
    return this.instance;
  }

  /* ---------------------------------------------------- conversation */

  /** Create a campaign conversation from the first operator message. */
  async createConversation(firstMessage: string, createdBy?: string): Promise<{ id: string; name: string }> {
    const fallbackName = firstMessage.trim().replace(/\s+/g, ' ').split(' ').slice(0, 6).join(' ');
    let name = fallbackName.length > 4 ? fallbackName : 'New campaign';

    const provider = getAI();
    if (provider) {
      try {
        const reply = await provider.chat([
          {
            role: 'system',
            content:
              'You name chat conversations for a security-simulation platform. Reply with ONLY a short title (2-6 words, no quotes, no punctuation at the end) summarizing the user request.',
          },
          { role: 'user', content: firstMessage },
        ]);
        const candidate = reply.content.trim().replace(/^["']|["'.]+$/g, '').split('\n')[0];
        if (candidate && candidate.length >= 3 && candidate.length <= 80) name = candidate;
      } catch {
        /* naming falls back to the request text */
      }
    }

    const campaign = await campaignPersistenceService.createCampaign({
      name,
      objective: firstMessage,
      organizationContext: '',
      scenarioContext: '',
      timingContext: '',
      senderConfig: { fromName: db.data?.email?.fromName ?? '', fromEmail: db.data?.email?.fromEmail ?? '' },
      campaignConfig: { urgencyLevel: 'normal', conversation: true },
      createdBy,
    });

    await databaseService.logEvent(campaign.id, null, 'CAMPAIGN_CREATED', { via: 'agent-chat', createdBy });
    await databaseService.addChatMessage(campaign.id, 'user', firstMessage);
    return { id: campaign.id, name };
  }

  /** Handle one operator message inside a campaign conversation. */
  async handleUserMessage(campaignId: string, text: string, contextFiles?: { name: string; content: string }[]): Promise<void> {
    const campaign = await campaignPersistenceService.getCampaign(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    // Merge any imported context into the campaign record.
    if (contextFiles && contextFiles.length > 0) {
      const imported = contextFiles.map((f) => `--- ${f.name} ---\n${f.content}`).join('\n\n');
      await campaignPersistenceService.updateCampaignContext(campaignId, {
        scenarioContext: [campaign.scenarioContext, imported].filter(Boolean).join('\n\n'),
      });
      await post(campaignId, `Imported ${contextFiles.length} context file${contextFiles.length > 1 ? 's' : ''} (${contextFiles.map((f) => f.name).join(', ')}). I will use this for the campaign.`, 'status');
    }

    const fresh = await campaignPersistenceService.getCampaign(campaignId);
    const lower = text.toLowerCase();
    const wantsLaunch = /\b(start|launch|run|execute|begin|send|go ahead|kick off)\b/.test(lower);

    if (wantsLaunch) {
      const launched = await this.tryLaunch(campaignId, text, fresh);
      if (launched) return;
    }

    await this.conversationalReply(campaignId, text, fresh);
  }

  /* --------------------------------------------------------- launch */

  private async tryLaunch(campaignId: string, text: string, campaign: Awaited<ReturnType<typeof campaignPersistenceService.getCampaign>>): Promise<boolean> {
    if (!campaign) return false;

    const existingTargets = await campaignPersistenceService.getCampaignTargets(campaignId);
    if (existingTargets.length > 0) {
      await this.executeCampaign(campaignId);
      return true;
    }

    // No targets yet — try to parse a full brief out of the conversation.
    const history = await databaseService.getChatMessages(campaignId);
    const corpus = [
      campaign.objective,
      campaign.organizationContext,
      campaign.scenarioContext,
      ...history.filter((m) => m.role === 'user').map((m) => m.content),
      text,
    ].filter(Boolean).join('\n\n');

    const parsed = await this.parseContext(corpus);
    if (parsed.targets.length === 0) {
      return false; // conversational reply will ask for targets
    }

    const emailCfg = db.data?.email;
    await campaignPersistenceService.updateCampaignContext(campaignId, {
      objective: parsed.objective || campaign.objective || text,
      organizationContext: parsed.organizationContext || campaign.organizationContext || '',
      senderConfig: {
        fromName: parsed.senderName || emailCfg?.fromName || 'PhishYou Simulation',
        fromEmail: parsed.senderEmail || emailCfg?.fromEmail || emailCfg?.username || '',
      },
      ...(parsed.tier ? { tier: parsed.tier } : {}),
    });
    await campaignPersistenceService.addTargetsToCampaign(
      campaignId,
      parsed.targets.map((t, i) => ({
        id: `t-${campaignId.slice(0, 8)}-${i + 1}`,
        name: t.name,
        email: t.email,
        role: t.role ?? 'Employee',
        department: t.department,
        personalContext: t.personalContext,
      })),
    );

    await post(
      campaignId,
      `Understood. Campaign brief locked in:\n• Objective: ${parsed.objective || campaign.objective || text}\n• Targets: ${parsed.targets.map((t) => `${t.name} <${t.email}>`).join(', ')}\n• Persistence tier: ${parsed.tier ?? 'B (balanced)'}\n\nStarting execution now.`,
      'status',
    );
    await this.executeCampaign(campaignId);
    return true;
  }

  /** Parse a campaign brief with the LLM, falling back to the local parser. */
  private async parseContext(corpus: string): Promise<ParsedContext> {
    const provider = getAI();
    if (!provider) return parseContextLocally(corpus);

    try {
      const reply = await provider.chat([
        {
          role: 'system',
          content: [
            'You extract structured campaign parameters from a phishing-simulation brief.',
            'Respond strictly as JSON: { "objective": string, "organizationContext": string, "senderName": string, "senderEmail": string, "tier": "A"|"B"|"C", "targets": [{ "name": string, "email": string, "role": string, "department": string, "personalContext": string }] }.',
            'tier: A = aggressive, B = balanced (default), C = cautious. Only include fields you can infer.',
          ].join('\n'),
        },
        { role: 'user', content: corpus },
      ]);
      const parsed = extractJson<ParsedContext>(reply.content);
      if (parsed && Array.isArray(parsed.targets) && parsed.targets.length > 0) {
        parsed.targets = parsed.targets.filter((t) => t && EMAIL_RE.test(t.email ?? ''));
        if (parsed.targets.length > 0) return parsed;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[agent] LLM context parsing failed, using local parser:', error instanceof Error ? error.message : error);
    }
    return parseContextLocally(corpus);
  }

  /* ------------------------------------------------------ execution */

  /** Generate + send the initial wave, then narrate the result. */
  async executeCampaign(campaignId: string): Promise<void> {
    if (this.executing.has(campaignId)) return;
    this.executing.add(campaignId);
    try {
      const campaign = await campaignPersistenceService.getCampaign(campaignId);
      if (!campaign) return;
      const targets = await campaignPersistenceService.getCampaignTargets(campaignId);
      const pending = targets.filter((t) => t.status === 'pending');
      if (pending.length === 0) {
        await post(campaignId, 'All targets have already been contacted. I will keep monitoring for replies.', 'status');
        return;
      }

      const smtpLive = emailService.isConfigured();
      if (!smtpLive) {
        await post(campaignId, 'Email connector is not configured — running in simulation mode. Configure the Email connector in Tool Settings to send real messages.', 'status');
      }

      await campaignPersistenceService.updateCampaignStatus(campaignId, 'ACTIVE');
      const ctx = buildCampaignContext(campaign);
      const campaignTargets: CampaignTarget[] = pending.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        department: t.department,
        role: t.role,
        personalContext: t.personalContext,
      }));

      const result = await campaignEmailService.generateAndSendCampaign(campaignTargets, ctx);
      for (let i = 0; i < result.personalizedEmails.length; i++) {
        const email = result.personalizedEmails[i];
        const sendResult = result.results[i];
        if (sendResult) await campaignPersistenceService.recordEmailSent(campaignId, email.target.id, email, sendResult);
      }

      for (let i = 0; i < result.results.length; i++) {
        const r = result.results[i];
        if (r.success) {
          await post(campaignId, `Sent initial email to ${r.target.name} <${r.target.email}> — "${result.personalizedEmails[i]?.subject ?? ''}"${r.simulated ? ' (simulated)' : ''}`, 'activity');
        } else {
          await post(campaignId, `Failed to reach ${r.target.name} <${r.target.email}>: ${r.error ?? 'unknown error'}`, 'activity');
        }
      }

      await post(
        campaignId,
        `Initial wave complete: ${result.summary.successful}/${result.summary.total} delivered. I am monitoring the reply mailbox and will engage targets autonomously as responses arrive.`,
        'status',
      );
    } catch (error) {
      await post(campaignId, `Campaign execution hit an error: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      this.executing.delete(campaignId);
    }
  }

  /* --------------------------------------------------------- replies */

  /** Entry point wired to mailWatcher.onReply — handle one inbound reply. */
  async handleReply(campaignId: string, targetId: string): Promise<void> {
    const campaign = await campaignPersistenceService.getCampaign(campaignId);
    const target = await databaseService.getTarget(targetId);
    if (!campaign || !target) return;
    if (campaign.status !== 'ACTIVE') return;

    const interactions = await databaseService.getInteractions(campaignId);
    const replies = interactions.filter((i) => i.targetId === targetId && i.type === 'reply');
    const latest = replies[replies.length - 1];
    const body = (latest?.meta?.body as string) ?? '';
    const subject = (latest?.meta?.subject as string) ?? '';

    const resistanceScore = await this.scoreResistance(target, subject, body);
    const followUps = replies.length - 1;
    const tier = (campaign.tier as 'A' | 'B' | 'C') || 'B';

    await post(
      campaignId,
      `${target.name} <${target.email}> replied${subject ? ` — "${subject}"` : ''}. Resistance score: ${resistanceScore.toFixed(2)}.`,
      'activity',
    );
    await databaseService.logEvent(campaignId, targetId, 'RESISTANCE_SCORED', { score: resistanceScore, followUps, tier });

    if (followUps >= (MAX_FOLLOWUPS[tier] ?? 3)) {
      await databaseService.updateTarget(targetId, { status: 'completed' });
      await post(campaignId, `Persistence cap reached for ${target.name} (tier ${tier}). Closing the thread and logging the outcome for the after-action report.`, 'status');
      return;
    }

    const tactic = pickTactic(tier, followUps);
    const sent = interactions.filter((i) => i.targetId === targetId && i.type === 'sent');
    const lastSent = sent[sent.length - 1];

    await post(campaignId, `Escalating to ${tactic} (tier ${tier}, follow-up ${followUps + 1}). Drafting response to ${target.name}…`, 'status');

    const replyDraft = await this.draftReply(campaign, target, { subject, body }, tactic, {
      subject: (lastSent?.meta?.subject as string) ?? '',
      messageId: (lastSent?.meta?.messageId as string) ?? undefined,
    });

    const sendResult = await emailService.sendEmail({
      to: target.email,
      subject: replyDraft.subject,
      text: replyDraft.body,
      html: toHtml(replyDraft.body),
      from: buildCampaignContext(campaign).sender.fromEmail,
      inReplyTo: (latest?.meta?.messageId as string) ?? undefined,
    });

    await campaignPersistenceService.recordEmailSent(
      campaignId,
      targetId,
      {
        target: { id: target.id, name: target.name ?? '', email: target.email, role: target.role ?? '', department: target.department, personalContext: target.personalContext },
        subject: replyDraft.subject,
        body: replyDraft.body,
        html: toHtml(replyDraft.body),
        generatedAt: new Date().toISOString(),
      },
      { success: sendResult.success, target: { id: target.id, name: target.name ?? '', email: target.email, role: target.role ?? '' }, messageId: sendResult.messageId, simulated: sendResult.simulated, error: sendResult.error },
    );

    await databaseService.logEvent(campaignId, targetId, 'AGENT_AUTO_REPLY', { tactic, score: resistanceScore, simulated: sendResult.simulated ?? false });
    await post(
      campaignId,
      sendResult.success
        ? `Replied to ${target.name} using ${tactic}${sendResult.simulated ? ' (simulated)' : ''}. Watching for their next response.`
        : `Could not send the ${tactic} reply to ${target.name}: ${sendResult.error ?? 'unknown error'}`,
      'activity',
    );
  }

  /* --------------------------------------------------------- scoring */

  private async scoreResistance(target: { name?: string; role?: string }, subject: string, body: string): Promise<number> {
    const provider = getAI();
    if (provider && body) {
      try {
        const reply = await provider.chat([
          {
            role: 'system',
            content:
              'You score phishing-simulation targets. Given a target reply, return ONLY JSON: { "score": number } where score is resistance from 0.0 (fully compliant/compromised) to 1.0 (strongly resistant — reported, refused, verified out-of-band).',
          },
          { role: 'user', content: `Target: ${target.name ?? ''} (${target.role ?? ''})\nSubject: ${subject}\nReply:\n${body}` },
        ]);
        const parsed = extractJson<{ score?: number }>(reply.content);
        if (parsed && typeof parsed.score === 'number') {
          return Math.min(1, Math.max(0, parsed.score));
        }
      } catch {
        /* fall through to heuristic */
      }
    }
    return heuristicScore(`${subject}\n${body}`);
  }

  private async draftReply(
    campaign: { name: string; objective?: string; scenarioContext?: string },
    target: { name?: string; role?: string; department?: string },
    inbound: { subject: string; body: string },
    tactic: string,
    thread: { subject: string; messageId?: string },
  ): Promise<{ subject: string; body: string }> {
    const provider = getAI();
    const subject = thread.subject ? (thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`) : `Re: ${inbound.subject || campaign.name}`;

    if (provider) {
      try {
        const reply = await provider.chat([
          {
            role: 'system',
            content: [
              'You are the PhishYou simulation agent continuing an authorized phishing-awareness email conversation.',
              `Current tactic: ${tactic}. Keep the persona consistent, stay professional, and never request real credentials — direct the target toward the simulated action only.`,
              'Respond strictly as JSON: { "body": string } — the plain-text email body only.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: `Campaign: ${campaign.name}\nObjective: ${campaign.objective ?? ''}\nScenario: ${campaign.scenarioContext ?? ''}\nTarget: ${target.name ?? ''} (${target.role ?? ''}, ${target.department ?? ''})\nTheir reply:\n${inbound.body}`,
          },
        ]);
        const parsed = extractJson<{ body?: string }>(reply.content);
        if (parsed?.body) return { subject, body: parsed.body };
        if (reply.content.trim()) return { subject, body: reply.content.trim() };
      } catch {
        /* fall through to template */
      }
    }

    const firstName = (target.name ?? 'there').split(' ')[0];
    const body = [
      `Hi ${firstName},`,
      '',
      `Thanks for getting back to me. This is time-sensitive — could you complete the verification steps today so we can close this out?`,
      '',
      'Appreciate your help,',
      'PhishYou Simulation',
    ].join('\n');
    return { subject, body };
  }

  /* --------------------------------------------------- conversation */

  private async conversationalReply(campaignId: string, text: string, campaign: Awaited<ReturnType<typeof campaignPersistenceService.getCampaign>>): Promise<void> {
    if (!campaign) return;
    const provider = getAI();
    const targets = await campaignPersistenceService.getCampaignTargets(campaignId);
    const history: StoredChatMessage[] = await databaseService.getChatMessages(campaignId);

    if (!provider) {
      await post(
        campaignId,
        targets.length === 0
          ? 'Noted. To start this campaign I still need a target list (names + emails) and a campaign objective — paste them here or use the import button. The LLM connector is not configured, so configure it in Tool Settings for full agent reasoning.'
          : 'Understood — logged into the campaign context. Say "start the campaign" when you want me to begin sending.',
      );
      return;
    }

    const system: ChatMessage = {
      role: 'system',
      content: [
        'You are the PhishYou campaign agent inside a security-awareness simulation platform.',
        'You help the operator plan and run an authorized phishing-simulation campaign over email.',
        'Capabilities: parse campaign briefs and target lists, send simulation emails via the email connector, monitor target replies, score resistance, and reply autonomously using persistence tiers (A aggressive, B balanced, C cautious).',
        'Keep answers short, concrete and action-oriented. When the operator has not yet provided targets or an objective, ask for exactly what is missing.',
        'Never ask for or handle real credentials. This is an authorized simulation.',
      ].join('\n'),
    };

    const stateNote: ChatMessage = {
      role: 'system',
      content: `Campaign state: name="${campaign.name}", status=${campaign.status}, targets=${targets.length}, objective="${campaign.objective ?? '(unset)'}". Imported context: ${(campaign.scenarioContext ?? '').slice(0, 2000) || '(none)'}`,
    };

    const messages: ChatMessage[] = [
      system,
      stateNote,
      ...history.slice(-12).map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
      { role: 'user', content: text },
    ];

    try {
      const reply = await provider.chat(messages);
      await post(campaignId, reply.content.trim() || 'Understood.');
    } catch (error) {
      await post(campaignId, `I could not reach the LLM provider (${error instanceof Error ? error.message : 'error'}). Check the LLM connector in Tool Settings.`, 'error');
    }
  }
}

export const campaignAgent = CampaignAgentService.get();
