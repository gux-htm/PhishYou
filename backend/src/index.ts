import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import { aiRouter } from './routes/ai.js';
import { dbRouter } from './routes/db.js';
import { initStore } from './store.js';

async function main() {
  await initStore();

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/db', dbRouter);

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`PhishYou backend listening on http://localhost:${PORT}`);
  });
}

main();
