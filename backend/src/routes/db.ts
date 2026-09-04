import { Router } from 'express';
import { access } from 'fs/promises';
import Database from 'better-sqlite3';
import { mergeDBConfig, isDBConfigured, type DBConfig } from '../config.js';
import { db } from '../store.js';

interface NodeError extends Error { code?: string; }
function isNodeError(error: unknown): error is NodeError { return error instanceof Error && 'code' in error; }
function extractDbErrorMessage(error: unknown): string {
  if (error instanceof AggregateError) return error.errors.map((item) => isNodeError(item) ? item.code ?? item.message : item instanceof Error ? item.message : '').filter(Boolean).join(', ') || 'Could not connect to database.';
  if (isNodeError(error)) return error.code ? `Database error: ${error.code}` : error.message || 'Database connection failed.';
  return error instanceof Error ? error.message : 'Database connection failed.';
}

export const dbRouter = Router();

function getConfig(): DBConfig {
  return mergeDBConfig(db.data?.db ?? { type: 'sqlite', host: '', port: null, database: '', username: '', password: '', ssl: false });
}

function buildConnectionString(config: DBConfig): string {
  if (config.type !== 'postgresql') return '';
  const auth = config.username ? `${encodeURIComponent(config.username)}${config.password ? `:${encodeURIComponent(config.password)}` : ''}@` : '';
  return `postgresql://${auth}${config.host}:${config.port ?? 5432}/${encodeURIComponent(config.database)}${config.ssl ? '?sslmode=require' : ''}`;
}

async function testPostgres(config: DBConfig): Promise<void> {
  const { Client } = await import('pg');
  const client = new Client({ connectionString: buildConnectionString(config) });
  try { await client.connect(); await client.query('SELECT 1'); } finally { await client.end(); }
}

async function testSQLite(config: DBConfig): Promise<void> {
  if (!config.database) throw new Error('SQLite database path is required.');
  await access(config.database).catch(() => undefined);
  const sqlite = new Database(config.database);
  try {
    const result = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' LIMIT 1").get();
    if (!result) throw new Error('SQLite database opened, but no application tables exist yet. Run initialization first.');
  } finally { sqlite.close(); }
}

dbRouter.get('/config', (_req, res) => {
  const config = getConfig();
  res.json({ status: isDBConfigured(config) ? 'configured' : 'not_configured', type: config.type || null, host: config.host || null, port: config.port, database: config.database || null, username: config.username || null, ssl: config.ssl });
});

dbRouter.post('/config', async (req, res) => {
  const body = req.body as Partial<DBConfig>;
  const current = getConfig();
  const next: DBConfig = {
    type: (body.type ?? current.type) as DBConfig['type'], host: String(body.host ?? current.host).trim(), port: typeof body.port === 'number' ? body.port : body.port ? Number(body.port) : current.port,
    database: String(body.database ?? current.database).trim(), username: String(body.username ?? current.username).trim(), password: String(body.password ?? '').trim() || current.password, ssl: body.ssl === undefined ? current.ssl : Boolean(body.ssl),
  };
  db.data!.db = next;
  await db.write();
  res.json({ status: isDBConfigured(next) ? 'configured' : 'not_configured', type: next.type || null, host: next.host || null, port: next.port, database: next.database || null, username: next.username || null, ssl: next.ssl });
});

dbRouter.post('/test-connection', async (_req, res) => {
  const config = getConfig();
  if (!isDBConfigured(config)) return res.status(400).json({ success: false, status: 'not_configured', message: 'Database is not configured.' });
  try {
    if (config.type === 'sqlite') await testSQLite(config); else if (config.type === 'postgresql') await testPostgres(config); else return res.status(400).json({ success: false, status: 'error', message: 'Unsupported database type.' });
    return res.json({ success: true, status: 'connected' });
  } catch (error) {
    return res.status(502).json({ success: false, status: 'error', message: extractDbErrorMessage(error) });
  }
});
