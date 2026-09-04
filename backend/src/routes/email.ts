import { Router } from 'express';
import { db } from '../store.js';
import { emailService } from '../services/email.js';
import { mailWatcher } from '../services/mailWatcher.js';

export const emailRouter = Router();

function getStoredEmail() {
  return db.data?.email ?? {
    host: '', port: 587, secure: false, user: '', pass: '', from: '', replyTo: '',
    imapHost: '', imapPort: 993, imapSecure: true, imapUser: '', imapPass: '', imapMailbox: 'INBOX',
  };
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
  res.json({ success: true });
});

emailRouter.post('/test-connection', async (_req, res) => {
  const smtp = await emailService.verify();
  const imap = await mailWatcher.verify();
  const success = smtp.ok && (imap.ok || !mailWatcher.isConfigured());
  res.status(success ? 200 : 502).json({ success, smtp, imap });
});
