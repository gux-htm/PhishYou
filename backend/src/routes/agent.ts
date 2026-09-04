/**
 * PhishYou — Agent conversation API (mounted at /api/v1/agent)
 *
 * Powers the dashboard composer and the /campaigns/:id chat page:
 *   POST /conversations           — create a campaign conversation (agent names it)
 *   GET  /conversations           — list conversations (campaigns) for the sidebar
 *   GET  /conversations/:id       — campaign + full chat thread
 *   POST /conversations/:id/messages — operator message; agent replies asynchronously
 */
import { Router } from 'express';
import { campaignAgent } from '../services/campaignAgent.js';
import { campaignPersistenceService } from '../services/campaignPersistence.js';
import { databaseService } from '../services/database.js';

export const agentRouter = Router();

agentRouter.post('/conversations', async (req, res) => {
  try {
    const { message, createdBy } = req.body as { message?: string; createdBy?: string };
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    const conversation = await campaignAgent.createConversation(message.trim(), createdBy);
    return res.status(201).json(conversation);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create conversation' });
  }
});

agentRouter.get('/conversations', async (_req, res) => {
  try {
    const campaigns = await campaignPersistenceService.getCampaigns();
    const conversations = await Promise.all(
      campaigns.map(async (c) => {
        const messages = await databaseService.getChatMessages(c.id);
        const last = messages[messages.length - 1];
        return {
          id: c.id,
          name: c.name,
          status: c.status,
          createdAt: c.createdAt,
          lastMessageAt: last?.createdAt ?? c.createdAt,
          preview: last?.content.slice(0, 140) ?? '',
        };
      }),
    );
    conversations.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    return res.json({ conversations });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list conversations' });
  }
});

agentRouter.get('/conversations/:id', async (req, res) => {
  try {
    const campaign = await campaignPersistenceService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Conversation not found' });
    const messages = await databaseService.getChatMessages(campaign.id);
    const targets = await campaignPersistenceService.getCampaignTargets(campaign.id);
    return res.json({ campaign, targets, messages });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load conversation' });
  }
});

agentRouter.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { text, contextFiles } = req.body as {
      text?: string;
      contextFiles?: { name: string; content: string }[];
    };
    if (!text?.trim() && !(contextFiles && contextFiles.length > 0)) {
      return res.status(400).json({ error: 'text or contextFiles is required' });
    }

    const campaign = await campaignPersistenceService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Conversation not found' });

    const cleanFiles = (contextFiles ?? [])
      .filter((f) => f && typeof f.name === 'string' && typeof f.content === 'string')
      .map((f) => ({ name: f.name.slice(0, 120), content: f.content.slice(0, 20000) }))
      .slice(0, 5);

    if (text?.trim()) {
      await databaseService.addChatMessage(campaign.id, 'user', text.trim());
    }

    // The agent works (LLM calls + sending) asynchronously; the client polls.
    void campaignAgent.handleUserMessage(campaign.id, text?.trim() ?? '', cleanFiles).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[agent] handleUserMessage failed:', error instanceof Error ? error.message : error);
    });

    return res.status(202).json({ accepted: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to process message' });
  }
});
