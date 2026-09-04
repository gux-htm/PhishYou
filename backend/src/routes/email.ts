/**
 * PhishYou — Email connector API (mounted at /api/v1/email)
 *
 * Lets the operator configure the SMTP/IMAP credentials the campaign agent
 * uses to send simulation emails and watch for target replies. Values are
 * stored in the local config store; environment variables still act as
 * fallbacks (see mergeEmailConfig).
 */
import { Router } from 'express';
import { mergeEmailConfig, isEmailConfigured, type EmailConfig } from '../config.js';
import { emailService } from '../services/email.js';
import { mailWatcher } from '../services/mailWatcher.js';
import { db } from '../store.js';

export const emailRouter = Router();

function publicConfig() {
  const stored = db.data?.email ?? ({} as Partial<EmailConfig>);
  const merged = mergeEmailConfig(stored);
  return {
    status: isEmailConfigured(merged) ? 'configured' : 'not_configured',
    host: merged.host || null,
    port: merged.port,
    secure: merged.secure,
    username: merged.username || null,
    fromEmail: merged.fromEmail || null,
    fromName: merged.fromName || null,
    replyTo: merged.replyTo || null,
    imapHost: merged.imapHost || null,
    imapPort: merged.imapPort,
    passwordSet: Boolean(merged.password),
  };
}

emailRouter.get('/config', (_req, res) => {
  res.json(publicConfig());
});

emailRouter.post('/config', async (req, res) => {
  try {
    const body = req.body as Partial<EmailConfig>;
    const existing = db.data?.email ?? ({} as EmailConfig);

    db.data!.email = {
      host: (body.host ?? existing.host ?? '').toString().trim(),
      port: body.port === undefined || body.port === null ? existing.port ?? null : Number(body.port) || null,
      secure: body.secure === undefined ? Boolean(existing.secure) : Boolean(body.secure),
      username: (body.username ?? existing.username ?? '').toString().trim(),
      // Keep the stored password when the field is left blank in the UI.
      password: (body.password ?? '').toString().trim() || existing.password || '',
      fromEmail: (body.fromEmail ?? existing.fromEmail ?? '').toString().trim(),
      fromName: (body.fromName ?? existing.fromName ?? '').toString().trim(),
      replyTo: (body.replyTo ?? existing.replyTo ?? '').toString().trim(),
      imapHost: (body.imapHost ?? existing.imapHost ?? '').toString().trim(),
      imapPort: body.imapPort === undefined || body.imapPort === null ? existing.imapPort ?? null : Number(body.imapPort) || null,
    };
    await db.write();

    // Pick up new credentials immediately.
    emailService.resetTransporter();
    if (mailWatcher.isConfigured()) {
      void mailWatcher.stop().then(() => mailWatcher.start());
    }

    res.json(publicConfig());
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save email configuration' });
  }
});

emailRouter.post('/test-connection', async (_req, res) => {
  try {
    if (!emailService.isConfigured()) {
      return res.status(400).json({ success: false, status: 'not_configured', message: 'Email connector is not configured.' });
    }
    const result = await emailService.verify();
    if (!result.ok) {
      return res.status(502).json({ success: false, status: 'error', message: result.error ?? 'SMTP handshake failed.' });
    }
    return res.json({ success: true, status: 'connected' });
  } catch (error) {
    return res.status(500).json({ success: false, status: 'error', message: error instanceof Error ? error.message : 'Test failed' });
  }
});
