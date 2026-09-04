import { databaseService } from './database.js';
import { emailService } from './email.js';
import { createProvider } from '../providers/factory.js';
import { isAIConfigured, mergeAIConfig } from '../config.js';
import { db } from '../store.js';

export interface AgentChatMessage { role: 'user' | 'assistant' | 'system'; content: string; timestamp?: string; }

function configuredProvider() {
  const config = mergeAIConfig(db.data?.ai ?? {});
  if (!isAIConfigured(config)) throw new Error('LLM connector is not configured.');
  return createProvider(config);
}

function titleFallback(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 48 ? `${cleaned.slice(0, 45)}…` : cleaned || 'New campaign';
}

function chooseTactic(reply: string, tier: string): string {
  const text = reply.toLowerCase();
  if (/(verify|proof|legit|suspicious|scam|trust)/.test(text)) return 'trust_rebuild';
  if (/(why|question|how do i|who are you)/.test(text)) return 'authority_clarification';
  if (/(urgent|asap|deadline|today)/.test(text)) return 'urgency';
  return tier === 'A' ? 'authority_escalation' : 'social_proof';
}

function estimateResistance(reply: string): number {
  const indicators = ['suspicious', 'verify', 'scam', 'not sure', 'who are you', 'stop', 'no', 'security'];
  const hits = indicators.filter((indicator) => reply.toLowerCase().includes(indicator)).length;
  return Math.max(0.05, Math.min(0.95, 0.2 + hits * 0.12));
}

async function appendAgentMessage(campaignId: string, content: string) {
  const campaign = await databaseService.getCampaign(campaignId);
  if (!campaign) return;
  const existing = Array.isArray(campaign.campaignConfig?.conversation) ? campaign.campaignConfig.conversation as AgentChatMessage[] : [];
  await databaseService.updateCampaign(campaignId, {
    campaignConfig: {
      ...(campaign.campaignConfig ?? {}),
      conversation: [...existing, { role: 'assistant', content, timestamp: new Date().toISOString() }],
    },
  });
}

export async function createCampaignConversation(initialMessage: string, createdBy?: string) {
  const provider = configuredProvider();
  let title = titleFallback(initialMessage);
  let reply = 'I’m ready to help plan the authorized campaign. Import the campaign briefing and target context, then tell me what you want to do next.';
  let objective = '';
  const response = await provider.chat([
    { role: 'system', content: 'You are the PhishYou campaign agent. Return JSON only with keys title, objective, and reply. title must be a concise 3-7 word campaign name. objective should summarize the intended simulation action. Do not perform external actions in this turn.' },
    { role: 'user', content: initialMessage },
  ]);
  const match = response.content.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]) as { title?: string; objective?: string; reply?: string };
      title = parsed.title?.trim() || title;
      objective = parsed.objective?.trim() || '';
      reply = parsed.reply?.trim() || reply;
    } catch {
      reply = response.content;
    }
  } else {
    reply = response.content;
  }

  const now = new Date().toISOString();
  const campaign = await databaseService.createCampaign({
    name: title,
    status: 'DRAFT',
    objective,
    campaignConfig: {
      conversation: [{ role: 'user', content: initialMessage, timestamp: now }, { role: 'assistant', content: reply, timestamp: now }],
      importedContext: '',
      persistenceTier: 'B',
    },
    createdBy,
  });
  return { campaign, message: { role: 'assistant' as const, content: reply, timestamp: now } };
}

export async function continueCampaignConversation(campaignId: string, messages: AgentChatMessage[], userMessage: string) {
  const campaign = await databaseService.getCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  const provider = configuredProvider();
  const existing = Array.isArray(campaign.campaignConfig?.conversation) ? campaign.campaignConfig.conversation as AgentChatMessage[] : [];
  const importedContext = typeof campaign.campaignConfig?.importedContext === 'string' ? campaign.campaignConfig.importedContext : '';
  const system = [
    'You are the PhishYou campaign agent operating an authorized security-awareness simulation.',
    'Use the conversation and imported context to understand the campaign objective and target roster.',
    'When asked to start, the application executes the approved email workflow; never claim an external action happened unless a tool result confirms it.',
    'Use concise operational updates in chat.',
    `Campaign: ${campaign.name}`,
    `Objective: ${campaign.objective ?? ''}`,
    `Persistence tier: ${String(campaign.campaignConfig?.persistenceTier ?? 'B')}`,
    importedContext ? `Imported context:\n${importedContext.slice(0, 12000)}` : 'No imported context yet.',
  ].join('\n\n');
  const response = await provider.chat([
    { role: 'system', content: system },
    ...messages.slice(-20).map((message) => ({ role: message.role, content: message.content })),
    { role: 'user', content: userMessage },
  ]);
  const nextConversation = [...existing, { role: 'user' as const, content: userMessage, timestamp: new Date().toISOString() }, { role: 'assistant' as const, content: response.content, timestamp: new Date().toISOString() }];
  await databaseService.updateCampaign(campaignId, { campaignConfig: { ...(campaign.campaignConfig ?? {}), conversation: nextConversation } });
  return { content: response.content };
}

export async function setCampaignContext(campaignId: string, context: { text: string; targets?: Array<{ id: string; name: string; email: string; department?: string; role?: string; personalContext?: string }> }) {
  const campaign = await databaseService.getCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  if (context.targets?.length) {
    for (const target of context.targets) {
      const existing = await databaseService.getTarget(target.id);
      if (!existing) await databaseService.createTarget({ campaignId, id: target.id, name: target.name, email: target.email, department: target.department, role: target.role ?? 'Employee', personalContext: target.personalContext, status: 'pending' });
    }
  }
  await databaseService.updateCampaign(campaignId, { organizationContext: context.text, campaignConfig: { ...(campaign.campaignConfig ?? {}), importedContext: context.text } });
}

export async function startApprovedCampaign(campaignId: string) {
  const campaign = await databaseService.getCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found.');
  const targets = await databaseService.getTargetsByCampaign(campaignId);
  if (!targets.length) throw new Error('No targets are attached to this campaign. Import a target list before starting the campaign.');
  if (!emailService.isConfigured()) throw new Error('Email connector is not configured.');
  const provider = configuredProvider();
  await provider.testConnection();
  const { campaignEmailService } = await import('./campaignEmail.js');
  const result = await campaignEmailService.generateAndSendCampaign(
    targets.map((target) => ({ id: target.id, name: target.name ?? `${target.firstName ?? ''} ${target.lastName ?? ''}`.trim(), email: target.email, department: target.department, role: target.role ?? 'Employee', personalContext: target.personalContext })),
    { id: campaign.id, name: campaign.name, organizationContext: campaign.organizationContext, campaignObjective: campaign.objective, scenarioContext: campaign.scenarioContext, sender: (campaign.senderConfig as { fromName: string; fromEmail: string; replyTo?: string }) ?? { fromName: '', fromEmail: '' } },
  );

  const updates: string[] = [];
  for (let i = 0; i < result.personalizedEmails.length; i += 1) {
    const generated = result.personalizedEmails[i];
    const delivery = result.results[i];
    if (!delivery) continue;
    await databaseService.recordInteraction({ campaignId, targetId: generated.target.id, type: delivery.success ? 'sent' : 'failed', success: delivery.success, meta: { messageId: delivery.messageId, subject: generated.subject, simulated: delivery.simulated ?? false } });
    await databaseService.updateTarget(generated.target.id, { status: delivery.success ? 'sent' : 'failed', emailSubject: generated.subject, emailBody: generated.body, sentAt: delivery.success ? new Date().toISOString() : null });
    await databaseService.logEvent(campaignId, generated.target.id, delivery.success ? 'EMAIL_SENT' : 'EMAIL_FAILED', { to: generated.target.email, subject: generated.subject, messageId: delivery.messageId, simulated: delivery.simulated ?? false });
    updates.push(delivery.success ? `Sent initial email to ${generated.target.email}.` : `Failed to send initial email to ${generated.target.email}.`);
  }
  await databaseService.updateCampaign(campaignId, { status: result.summary.successful ? 'ACTIVE' : 'CANCELLED', startedAt: result.summary.successful ? new Date().toISOString() : null });
  await appendAgentMessage(campaignId, `Campaign execution started.\n\n${updates.join('\n')}`);
  return result;
}

export async function handleInboundReply(campaignId: string, targetId: string, reply: { text: string; subject?: string; messageId: string }) {
  const campaign = await databaseService.getCampaign(campaignId);
  const target = await databaseService.getTarget(targetId);
  if (!campaign || !target || campaign.status !== 'ACTIVE') return null;
  const provider = configuredProvider();
  const tactic = chooseTactic(reply.text, String(campaign.campaignConfig?.persistenceTier ?? 'B'));
  const resistance = estimateResistance(reply.text);
  const response = await provider.chat([
    { role: 'system', content: `You are the autonomous PhishYou campaign agent. Maintain the approved campaign persona and persistence tier (${String(campaign.campaignConfig?.persistenceTier ?? 'B')}). Current tactic selection: ${tactic}. Estimated resistance: ${resistance.toFixed(2)}. Reply only with the next authorized simulation email body. Do not request real passwords, OTPs, payment execution, or real secrets.` },
    { role: 'user', content: `Campaign objective: ${campaign.objective ?? ''}\nTarget: ${target.name ?? target.email}\nDepartment: ${target.department ?? ''}\nRole: ${target.role ?? ''}\nPersonal context: ${target.personalContext ?? ''}\nTarget reply subject: ${reply.subject ?? ''}\nTarget reply:\n${reply.text.slice(0, 4000)}` },
  ]);
  const subject = reply.subject?.startsWith('Re:') ? reply.subject : `Re: ${reply.subject ?? campaign.name}`;
  const sent = await emailService.sendEmail({ to: target.email, subject, text: response.content, replyTo: campaign.senderConfig?.replyTo as string | undefined, inReplyTo: reply.messageId, references: reply.messageId, headers: { 'X-PhishYou-Campaign': campaign.id, 'X-PhishYou-Target': target.id, 'X-PhishYou-Tactic': tactic } });
  await databaseService.recordInteraction({ campaignId, targetId, type: 'agent_reply', success: sent.success, meta: { subject, body: response.content, messageId: sent.messageId, inReplyTo: reply.messageId, simulated: sent.simulated, tactic, resistance } });
  await databaseService.logEvent(campaignId, targetId, 'AGENT_REPLY_SENT', { subject, messageId: sent.messageId, simulated: sent.simulated, tactic, resistance });
  await appendAgentMessage(campaignId, `Target ${target.email} replied — ${tactic} selected at resistance ${resistance.toFixed(2)}. ${sent.success ? `Agent follow-up sent to ${target.email}.` : `Agent follow-up failed to send.`}`);
  return { ...sent, body: response.content, subject, tactic, resistance };
}
