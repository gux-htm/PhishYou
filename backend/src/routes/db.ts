import { Router } from 'express';

interface NodeError extends Error {
  code?: string;
}

function isNodeError(e: unknown): e is NodeError {
  return e instanceof Error && 'code' in e;
}

function extractDbErrorMessage(err: unknown): string {
  if (err instanceof AggregateError) {
    const codes = err.errors
      .map((e) => (isNodeError(e) ? e.code ?? e.message : e instanceof Error ? e.message : ''))
      .filter(Boolean);
    return codes.length > 0
      ? `Could not connect to database: ${codes.join(', ')}`
      : 'Could not connect to database.';
  }
  if (isNodeError(err)) {
    if (err.code) return `Database error: ${err.code}`;
    return err.message || 'Database connection failed.';
  }
  return 'Database connection failed.';
}
import { Client } from 'pg';
import { access } from 'fs/promises';
import { mergeDBConfig, isDBConfigured, type DBConfig } from '../config.js';
import { db } from '../store.js';

export const dbRouter = Router();

function getConfig(): DBConfig {
  const stored = db.data?.db ?? {
    type: '',
    host: '',
    port: null,
    database: '',
    username: '',
    password: '',
    ssl: false,
  };
  return mergeDBConfig(stored);
}

function buildConnectionString(config: DBConfig): string {
  if (config.type !== 'postgresql') return '';
  const parts = ['postgresql://'];
  if (config.username) parts.push(encodeURIComponent(config.username));
  if (config.password) parts.push(':', encodeURIComponent(config.password));
  if (config.username) parts.push('@');
  parts.push(config.host);
  if (config.port) parts.push(':', String(config.port));
  parts.push('/', encodeURIComponent(config.database));
  if (config.ssl) parts.push('?sslmode=require');
  return parts.join('');
}

async function testPostgres(config: DBConfig): Promise<void> {
  const client = new Client({ connectionString: buildConnectionString(config) });
  try {
    await client.connect();
    await client.query('SELECT 1');
  } finally {
    await client.end();
  }
}

async function testSQLite(config: DBConfig): Promise<void> {
  if (!config.database) throw new Error('SQLite database path is required.');
  try {
    await access(config.database);
  } catch {
    // It's acceptable if the file doesn't exist yet; SQLite will create it.
  }
}

dbRouter.get('/config', (_req, res) => {
  const config = getConfig();
  res.json({
    status: isDBConfigured(config) ? 'configured' : 'not_configured',
    type: config.type || null,
    host: config.host || null,
    port: config.port,
    database: config.database || null,
    username: config.username || null,
    ssl: config.ssl,
  });
});

dbRouter.post('/config', async (req, res) => {
  const body = req.body as Partial<DBConfig>;

  const next: DBConfig = {
    type: (body.type ?? '').toString().trim() as DBConfig['type'],
    host: (body.host ?? '').toString().trim(),
    port: typeof body.port === 'number' ? body.port : body.port ? Number(body.port) : null,
    database: (body.database ?? '').toString().trim(),
    username: (body.username ?? '').toString().trim(),
    password: (body.password ?? '').toString().trim(),
    ssl: Boolean(body.ssl),
  };

  db.data!.db = next;
  await db.write();

  res.json({
    status: isDBConfigured(next) ? 'configured' : 'not_configured',
    type: next.type || null,
    host: next.host || null,
    port: next.port,
    database: next.database || null,
    username: next.username || null,
    ssl: next.ssl,
  });
});

dbRouter.post('/test-connection', async (_req, res) => {
  const config = getConfig();

  if (!isDBConfigured(config)) {
    res.status(400).json({ success: false, status: 'not_configured', message: 'Database is not configured.' });
    return;
  }

  try {
    if (config.type === 'postgresql') {
      await testPostgres(config);
    } else if (config.type === 'sqlite') {
      await testSQLite(config);
    } else {
      res.status(400).json({ success: false, status: 'error', message: 'Unsupported database type.' });
      return;
    }
    res.json({ success: true, status: 'connected' });
  } catch (err) {
    const message = extractDbErrorMessage(err);
    res.status(502).json({ success: false, status: 'error', message });
  }
});
