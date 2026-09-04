import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import { aiRouter } from './routes/ai.js';
import { dbRouter } from './routes/db.js';
import { emailRouter } from './routes/email.js';
import { authRouter } from './routes/auth.js';
import { campaignChatRouter } from './routes/campaignChat.js';
import { campaignRouter } from './routes/campaign.js';
import { monitoringRouter } from './routes/monitoring.js';
import { initStore, db } from './store.js';
import { databaseService } from './services/database.js';
import { mailWatcher } from './services/mailWatcher.js';
import { processUnansweredReplies } from './services/replyAutomation.js';

function hydrateEmailEnvironment() {
  const email = db.data?.email;
  if (!email) return;
  const values: Record<string, string> = {
    SMTP_HOST: email.host,
    SMTP_PORT: String(email.port),
    SMTP_SECURE: String(email.secure),
    SMTP_USER: email.user,
    SMTP_PASS: email.pass,
    SMTP_FROM: email.from,
    REPLY_TO: email.replyTo,
    IMAP_HOST: email.imapHost,
    IMAP_PORT: String(email.imapPort),
    IMAP_SECURE: String(email.imapSecure),
    IMAP_USER: email.imapUser,
    IMAP_PASS: email.imapPass,
    IMAP_MAILBOX: email.imapMailbox,
  };
  for (const [key, value] of Object.entries(values)) if (value) process.env[key] = value;
}

async function main() {
  await initStore();
  hydrateEmailEnvironment();
  await databaseService.initialize();
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/db', dbRouter);
  app.use('/api/v1/email', emailRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/campaign', campaignChatRouter);
  app.use('/api/v1/campaign', campaignRouter);
  app.use('/api/v1/monitor', monitoringRouter);
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.listen(PORT, () => {
    console.log(`PhishYou backend listening on http://localhost:${PORT}`);
    console.log(`Database ready at ${databaseService.location}`);
    if (mailWatcher.isConfigured()) void mailWatcher.start();
    setInterval(() => { void processUnansweredReplies().catch((error) => console.error('[replyAutomation]', error)); }, 15000);
  });
}

main();
