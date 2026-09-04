import 'dotenv/config';
import type { StoredAIConfig, StoredDBConfig, StoredEmailConfig } from './store.js';

export interface AIConfig extends StoredAIConfig {}

function env(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value === undefined && fallback === undefined) return '';
  return value ?? fallback ?? '';
}

export const PORT = Number(env('PORT', '4000')) || 4000;

export function getEnvAIConfig(): AIConfig {
  return {
    provider: env('LLM_PROVIDER'),
    apiKey: env('LLM_API_KEY'),
    model: env('LLM_MODEL'),
    endpoint: env('LLM_ENDPOINT'),
  };
}

/**
 * User-selected protocol/model/endpoint can come from the integration UI.
 * When Vercel or another host provides LLM_API_KEY, that secret always wins
 * and is never returned to the browser.
 */
export function mergeAIConfig(stored: Partial<AIConfig>): AIConfig {
  const envConfig = getEnvAIConfig();
  return {
    provider: stored.provider || envConfig.provider || 'auto',
    apiKey: envConfig.apiKey || stored.apiKey || '',
    model: stored.model || envConfig.model || '',
    endpoint: stored.endpoint || envConfig.endpoint || '',
  };
}

export function isAIConfigured(config: AIConfig): boolean {
  return Boolean(config.apiKey && config.model && config.endpoint);
}

export interface DBConfig extends StoredDBConfig {}

export function getEnvDBConfig(): DBConfig {
  const connectionString = env('DATABASE_URL');
  if (connectionString) {
    try {
      const url = new URL(connectionString);
      return {
        type: 'postgresql',
        host: url.hostname,
        port: url.port ? Number(url.port) : 5432,
        database: url.pathname.replace(/^\//, ''),
        username: url.username,
        password: url.password,
        ssl: url.searchParams.get('sslmode') === 'require' || url.searchParams.get('ssl') === 'true',
      };
    } catch {
      /* fall through to empty defaults */
    }
  }
  return {
    type: '', host: '', port: null, database: '', username: '', password: '', ssl: false,
  };
}

export function mergeDBConfig(stored: Partial<DBConfig>): DBConfig {
  const envConfig = getEnvDBConfig();
  return {
    type: stored.type || envConfig.type,
    host: stored.host ?? envConfig.host,
    port: stored.port ?? envConfig.port,
    database: stored.database ?? envConfig.database,
    username: stored.username ?? envConfig.username,
    password: stored.password ?? envConfig.password,
    ssl: stored.ssl ?? envConfig.ssl,
  };
}

export function isDBConfigured(config: DBConfig): boolean {
  return Boolean(config.type && ((config.type === 'sqlite' && config.database) || (config.host && config.port && config.database)));
}

export interface EmailConfig extends StoredEmailConfig {}

export function getEnvEmailConfig(): EmailConfig {
  return {
    host: env('SMTP_HOST'),
    port: Number(env('SMTP_PORT', '0')) || null,
    secure: env('SMTP_SECURE', 'false') === 'true',
    username: env('SMTP_USER'),
    password: env('SMTP_PASS'),
    fromEmail: env('SMTP_FROM') || env('EMAIL_FROM'),
    fromName: env('SMTP_FROM_NAME'),
    replyTo: env('REPLY_TO') || env('SMTP_REPLY_TO'),
    imapHost: env('IMAP_HOST'),
    imapPort: Number(env('IMAP_PORT', '0')) || null,
  };
}

/** UI-entered credentials win; environment variables fill any gaps. */
export function mergeEmailConfig(stored: Partial<EmailConfig>): EmailConfig {
  const e = getEnvEmailConfig();
  return {
    host: stored.host || e.host,
    port: stored.port ?? e.port,
    secure: stored.secure ?? e.secure,
    username: stored.username || e.username,
    password: stored.password || e.password,
    fromEmail: stored.fromEmail || e.fromEmail,
    fromName: stored.fromName || e.fromName,
    replyTo: stored.replyTo || e.replyTo,
    imapHost: stored.imapHost || e.imapHost,
    imapPort: stored.imapPort ?? e.imapPort,
  };
}

export function isEmailConfigured(config: EmailConfig): boolean {
  return Boolean(config.host && (config.fromEmail || config.username));
}
