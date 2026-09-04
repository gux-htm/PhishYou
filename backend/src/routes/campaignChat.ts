import { Router } from 'express';
import { createCampaignConversation, continueCampaignConversation, setCampaignContext, startApprovedCampaign } from '../services/campaignAgent.js';
import { databaseService } from '../services/database.js';

export const campaignChatRouter = Router();

campaignChatRouter.get('/conversations', async (_req, res) => {
  try {
    const conversations = (await databaseService.listCampaigns()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    res.json({ conversations: conversations.map(({ id, name, status, updatedAt }) => ({ id, name, status, updatedAt })) });
  } catch (error) { res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load campaign conversations.' }); }
});

campaignChatRouter.post('/conversations', async (req, res) => {
  try {
    const message = String((req.body as { message?: string }).message ?? '').trim();
    if (!message) return res.status(400).json({ error: 'An initial message is required.' });
    return res.status(201).json(await createCampaignConversation(message));
  } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create campaign conversation.' }); }
});

campaignChatRouter.get('/:id/chat', async (req, res) => {
  const campaign = await databaseService.getCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign conversation not found.' });
  const messages = Array.isArray(campaign.campaignConfig?.conversation) ? campaign.campaignConfig.conversation : [];
  const events = await databaseService.getEvents(campaign.id);
  return res.json({ campaign, messages, events });
});

campaignChatRouter.post('/:id/context', async (req, res) => {
  try {
    const body = req.body as { text?: string; targets?: Array<{ id: string; name: string; email: string; department?: string; role?: string; personalContext?: string }> };
    if (!body.text?.trim()) return res.status(400).json({ error: 'Context text is required.' });
    await setCampaignContext(req.params.id, { text: body.text.trim(), targets: body.targets });
    return res.json({ success: true });
  } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to save campaign context.' }); }
});

campaignChatRouter.post('/:id/chat', async (req, res) => {
  try {
    const body = req.body as { messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>; message?: string };
    const message = String(body.message ?? '').trim();
    if (!message) return res.status(400).json({ error: 'A chat message is required.' });
    if (/\b(start|launch|begin|send)\b.*\b(campaign|simulation|emails?)\b/i.test(message)) {
      const result = await startApprovedCampaign(req.params.id);
      const summary = result.results.map((item) => item.success ? `Sent initial email to ${item.target.email}.` : `Failed to send initial email to ${item.target.email}.`).join('\n');
      return res.json({ content: `Campaign execution started.\n\n${summary}`, action: 'campaign_started', execution: result.summary });
    }
    return res.json(await continueCampaignConversation(req.params.id, body.messages?.slice(-20) ?? [], message));
  } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Campaign agent failed to process the request.' }); }
});
