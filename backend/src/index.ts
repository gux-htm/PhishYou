import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import { aiRouter } from './routes/ai.js';
import { dbRouter } from './routes/db.js';
import { authRouter } from './routes/auth.js';
import { campaignRouter } from './routes/campaign.js';
import { monitoringRouter } from './routes/monitoring.js';
import { agentRouter } from './routes/agent.js';
import { emailRouter } from './routes/email.js';
import { initStore } from './store.js';
import { databaseService } from './services/database.js';
import { mailWatcher } from './services/mailWatcher.js';
import { campaignAgent } from './services/campaignAgent.js';

async function main() {
  await initStore();
  await databaseService.initialize();

  // The campaign agent responds autonomously whenever a target reply lands.
  mailWatcher.onReply((campaignId, targetId) => {
    void campaignAgent.handleReply(campaignId, targetId).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('[agent] reply handling failed:', error instanceof Error ? error.message : error);
    });
  });

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/db', dbRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/campaign', campaignRouter);
  app.use('/api/v1/monitor', monitoringRouter);
  app.use('/api/v1/agent', agentRouter);
  app.use('/api/v1/email', emailRouter);

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`PhishYou backend listening on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Database ready at ${databaseService.location}`);

    // Start inbound reply monitoring when IMAP credentials are present.
    if (mailWatcher.isConfigured()) {
      void mailWatcher.start();
      // eslint-disable-next-line no-console
      console.log(`Reply monitoring active (IMAP ${mailWatcher.getStatus().host}:${mailWatcher.getStatus().port})`);
    } else {
      // eslint-disable-next-line no-console
      console.log('Reply monitoring idle (configure the Email connector or set IMAP_HOST/IMAP_USER/IMAP_PASS)');
    }
  });

  const shutdown = (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received, shutting down...`);
    void mailWatcher.stop().finally(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
