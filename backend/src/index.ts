import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import { aiRouter } from './routes/ai.js';
import { dbRouter } from './routes/db.js';
import { emailRouter } from './routes/email.js';
import { authRouter } from './routes/auth.js';
import { campaignRouter } from './routes/campaign.js';
import { monitoringRouter } from './routes/monitoring.js';
import { initStore } from './store.js';
import { databaseService } from './services/database.js';
import { mailWatcher } from './services/mailWatcher.js';

async function main() {
  await initStore();
  await databaseService.initialize();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/db', dbRouter);
  app.use('/api/v1/email', emailRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/campaign', campaignRouter);
  app.use('/api/v1/monitor', monitoringRouter);
  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.listen(PORT, () => {
    console.log(`PhishYou backend listening on http://localhost:${PORT}`);
    console.log(`Database ready at ${databaseService.location}`);
    if (mailWatcher.isConfigured()) void mailWatcher.start();
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received, shutting down...`);
    void mailWatcher.stop().finally(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
