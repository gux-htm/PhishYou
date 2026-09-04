import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';

export interface StoredAIConfig {
  provider: string;
  model: string;
  endpoint: string;
  apiKey: string;
}

export interface StoredDBConfig {
  type: 'postgresql' | 'sqlite' | '';
  host: string;
  port: number | null;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface StoredEmailConfig {
  host: string;
  port: number | null;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  imapHost: string;
  imapPort: number | null;
}

interface Data {
  ai: StoredAIConfig;
  db: StoredDBConfig;
  email: StoredEmailConfig;
}

const defaultData: Data = {
  ai: {
    provider: '',
    model: '',
    endpoint: '',
    apiKey: '',
  },
  db: {
    type: '',
    host: '',
    port: null,
    database: '',
    username: '',
    password: '',
    ssl: false,
  },
  email: {
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
    replyTo: '',
    imapHost: '',
    imapPort: 993,
  },
};

const file = join(dirname(import.meta.filename), '..', 'data', 'config.json');

async function ensureDir() {
  await mkdir(dirname(file), { recursive: true });
}

export const db = new Low<Data>(new JSONFile(file), defaultData);

export async function initStore(): Promise<void> {
  await ensureDir();
  await db.read();
  db.data = db.data ?? { ...defaultData };
  await db.write();
}
