import { Router } from 'express';
import { db } from '../store.js';
import { emailService } from '../services/email.js';
import { mailWatcher } from '../services/mailWatcher.js';

export const emailRouter = Router();

function getStoredEmail() {
  return db.data!.email;
}

function hydrateEnvironment() {
  const config = getStoredEmail();
  const values: Record<string, string> = {
    SMTP_HOST: config.host,
    SMTP_PORT: String(config.port),
    SMTP_SECURE: String(config.secure),
    SMTP_USER: config.user,
    SMTP_PASS: config.pass,
    SMTP_FROM: config.from,
    REPLY_TO: config.replyTo,
    IMAP_HOST: config.imapHost,
    IMAP_PORT: String(config.imapPort),
    IMAP_SECURE: String(config.imapSecure),
    IMAP_USER: config.imapUser,
    IMAP_PASS: config.imapPass,
    IMAP_MAILBOX: config.imapMailbox,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) process.env[key] = value;
  }
}

emailRouter.get('/config', (_req, res) => {
  const config = getStoredEmail();
  res.json({
    smtp: {
      configured: Boolean(config.host && config.from),
      host: config.host || null,
      port: config.port,
      secure: config.secure,
      user: config.user || null,
      from: config.from || null,
      replyTo: config.replyTo || null,
    },
    imap: {
      configured: Boolean(config.imapHost && config.imapUser && config.imapPass),
      host: config.imapHost || null,
      port: config.imapPort,
      secure: config.imapSecure,
      user: config.imapUser || null,
      mailbox: config.imapMailbox,
    },
  });
});

emailRouter.post('/config', async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const current = getStoredEmail();
  const smtp = (body.smtp ?? {}) as Record<string, unknown>;
  const imap = (body.imap ?? {}) as Record<string, unknown>;

  db.data!.email = {
    host: String(smtp.host ?? current.host).trim(),
    port: Number(smtp.port ?? current.port) || 587,
    secure: Boolean(smtp.secure ?? current.secure),
    user: String(smtp.user ?? current.user).trim(),
    pass: String(smtp.pass ?? '').trim() || current.pass,
    from: String(smtp.from ?? current.from).trim(),
    replyTo: String(smtp.replyTo ?? current.replyTo).trim(),
    imapHost: String(imap.host ?? current.imapHost).trim(),
    imapPort: Number(imap.port ?? current.imapPort) || 993,
    imapSecure: Boolean(imap.secure ?? current.imapSecure),
    imapUser: String(imap.user ?? current.imapUser).trim(),
    imapPass: String(imap.pass ?? '').trim() || current.imapPass,
    imapMailbox: String(imap.mailbox ?? current.imapMailbox || 'INBOX').trim() || 'INBOX',
  };
  await db.write();
  hydrateEnvironment();
  res.json({ success: true });
});

emailRouter.post('/test-connection', async (_req, res) => {
  hydrateEnvironment();
  const smtp = await emailService.verify();
  const imap = mailWatcher.isConfigured() ? await mailWatcher.pollNow() : { ok: true, newMessages: 0, matched: 0 };
  const success = smtp.ok && imap.ok;
  res.status(success ? 200 : 502).json({ success, smtp, imap });
});
