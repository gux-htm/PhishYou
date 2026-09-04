export interface StoredAIConfig { provider: string; model: string; endpoint: string; apiKey: string; }
export interface StoredDBConfig { type: 'postgresql' | 'sqlite' | ''; host: string; port: number | null; database: string; username: string; password: string; ssl: boolean; }
export interface StoredEmailConfig { host: string; port: number; secure: boolean; user: string; pass: string; from: string; replyTo: string; imapHost: string; imapPort: number; imapSecure: boolean; imapUser: string; imapPass: string; imapMailbox: string; }

interface Data { ai: StoredAIConfig; db: StoredDBConfig; email: StoredEmailConfig; }

import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';

const databaseFile = join(dirname(import.meta.filename), '..', 'data', 'phishyou.sqlite');
const defaultData: Data = {
  ai: { provider: '', model: '', endpoint: '', apiKey: '' },
  db: { type: 'sqlite', host: '', port: null, database: databaseFile, username: '', password: '', ssl: false },
  email: { host: '', port: 587, secure: false, user: '', pass: '', from: '', replyTo: '', imapHost: '', imapPort: 993, imapSecure: true, imapUser: '', imapPass: '', imapMailbox: 'INBOX' },
};

let sqlite: Database.Database | null = null;

async function open(): Promise<Database.Database> {
  if (sqlite) return sqlite;
  await mkdir(dirname(databaseFile), { recursive: true });
  sqlite = new Database(databaseFile);
  sqlite.exec('CREATE TABLE IF NOT EXISTS connector_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  return sqlite;
}

export const db = {
  data: { ai: { ...defaultData.ai }, db: { ...defaultData.db }, email: { ...defaultData.email } } as Data,
  async write(): Promise<void> {
    const store = await open();
    const statement = store.prepare('INSERT INTO connector_settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    const transaction = store.transaction(() => {
      statement.run('ai', JSON.stringify(this.data.ai));
      statement.run('db', JSON.stringify(this.data.db));
      statement.run('email', JSON.stringify(this.data.email));
    });
    transaction();
  },
};

export async function initStore(): Promise<void> {
  const store = await open();
  const read = <T>(key: string, fallback: T): T => {
    const row = store.prepare('SELECT value FROM connector_settings WHERE key = ?').get(key) as { value?: string } | undefined;
    if (!row?.value) return fallback;
    try { return JSON.parse(row.value) as T; } catch { return fallback; }
  };
  db.data.ai = read('ai', { ...defaultData.ai });
  db.data.db = read('db', { ...defaultData.db });
  db.data.email = read('email', { ...defaultData.email });
  await db.write();
}
