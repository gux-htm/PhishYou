/**
 * PhishYou — Reply-monitoring + mail status API
 *
 * Surfaces the health of the outbound (SMTP) and inbound (IMAP) mail pipeline
 * and exposes the per-campaign monitoring view: targets, sent/reply
 * interactions, REPLY_RECEIVED events and reply threads.
 *
 * Endpoints (mounted at /api/v1/monitor):
 *   GET  /status                 — SMTP + IMAP configuration/runtime state
 *   POST /verify-smtp            — live SMTP handshake self-test
 *   POST /poll-now               — force an IMAP poll cycle
 *   POST /simulate-reply         — inject a reply through the same correlation
 *                                  path (verify the loop without a mail server)
 *   GET  /campaign/:id           — full monitoring view for one campaign
 *   GET  /campaign/:id/replies   — just the reply threads for one campaign
 */
import { Router } from 'express';
import { emailService } from '../services/email.js';
import { mailWatcher } from '../services/mailWatcher.js';
import { campaignPersistenceService } from '../services/campaignPersistence.js';
import { databaseService } from '../services/database.js';

export const monitoringRouter = Router();

monitoringRouter.get('/status', (_req, res) => {
  res.json({
    smtp: emailService.getStatus(),
    imap: mailWatcher.getStatus(),
    monitorMailbox: emailService.monitorMailbox() || null,
  });
});

monitoringRouter.post('/verify-smtp', async (_req, res) => {
  try {
    const result = await emailService.verify();
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'SMTP verification failed' });
  }
});

monitoringRouter.post('/poll-now', async (_req, res) => {
  try {
    if (!mailWatcher.isConfigured()) {
      return res.status(400).json({ ok: false, error: 'IMAP is not configured. Set IMAP_HOST/IMAP_USER/IMAP_PASS (or SMTP_* equivalents).' });
    }
    const result = await mailWatcher.pollNow();
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Poll failed' });
  }
});

monitoringRouter.post('/simulate-reply', async (req, res) => {
  try {
    const { from, subject, text, html, inReplyTo, references, messageId } = req.body as {
      from?: string;
      subject?: string;
      text?: string;
      html?: string;
      inReplyTo?: string;
      references?: string | string[];
      messageId?: string;
    };
    if (!from && !inReplyTo && !(Array.isArray(references) && references.length) && !references) {
      return res.status(400).json({ matched: false, error: 'Provide `from` and/or `inReplyTo`/`references` so the reply can be correlated.' });
    }
    const result = await mailWatcher.ingestReply({
      from,
      subject,
      text,
      html,
      inReplyTo,
      references,
      messageId: messageId || `<sim.${Date.now()}@phishyou.local>`,
      date: new Date(),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ matched: false, error: error instanceof Error ? error.message : 'Failed to ingest reply' });
  }
});

monitoringRouter.get('/campaign/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await campaignPersistenceService.getCampaign(id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const targets = await campaignPersistenceService.getCampaignTargets(id);
    const analytics = await campaignPersistenceService.getCampaignAnalytics(id);
    const interactions = await databaseService.getInteractions(id);
    const events = await databaseService.getEvents(id);
    const replies = interactions
      .filter((i) => i.type === 'reply')
      .map((i) => ({
        targetId: i.targetId,
        from: (i.meta?.from as string) ?? null,
        subject: (i.meta?.subject as string) ?? null,
        body: (i.meta?.body as string) ?? '',
        inReplyTo: (i.meta?.inReplyTo as string) ?? null,
        receivedAt: (i.meta?.receivedAt as string) ?? i.createdAt,
      }));

    res.json({ campaign, targets, analytics, replies, replyCount: replies.length, events, interactions });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load monitoring view' });
  }
});

monitoringRouter.get('/campaign/:id/replies', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await campaignPersistenceService.getCampaign(id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const interactions = await databaseService.getInteractions(id);
    const replies = interactions.filter((i) => i.type === 'reply');
    res.json({ campaignId: id, replyCount: replies.length, replies });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load replies' });
  }
});
