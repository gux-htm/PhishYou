import { Router } from 'express';
import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mergeAIConfig, isAIConfigured, type AIConfig } from '../config.js';
import { createProvider } from '../providers/factory.js';
import { db } from '../store.js';
import type { ChatMessage } from '../providers/types.js';

export const aiRouter = Router();

// Resolve path to backend/.env relative to this file (src/routes/ai.ts → ../../.env)
const ENV_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');

/**
 * Write the four LLM keys into the .env file.
 * Preserves all other lines; adds keys that don't exist yet.
 */
async function writeEnvConfig(config: AIConfig): Promise<void> {
  let content = '';
  try {
    content = await readFile(ENV_PATH, 'utf-8');
  } catch {
    // .env doesn't exist yet — start empty
  }

  const updates: Record<string, string> = {
    LLM_PROVIDER: config.provider,
    LLM_API_KEY: config.apiKey,
    LLM_MODEL: config.model,
    LLM_ENDPOINT: config.endpoint,
  };

  const lines = content.split('\n');
  const seen = new Set<string>();

  const updated = lines.map((line) => {
    const match = /^([A-Z_]+)=/.exec(line);
    if (match && updates[match[1]] !== undefined) {
      seen.add(match[1]);
      return `${match[1]}=${updates[match[1]]}`;
    }
    return line;
  });

  // Append any keys that weren't already present
  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) {
      updated.push(`${key}=${value}`);
    }
  }

  await writeFile(ENV_PATH, updated.join('\n'), 'utf-8');
}

function getConfig(): AIConfig {
  const stored = db.data?.ai ?? { provider: '', model: '', endpoint: '', apiKey: '' };
  return mergeAIConfig(stored);
}

const STATUS_PATTERN = /\[(\d{3})\]/;

function extractStatus(err: Error): number | null {
  const match = STATUS_PATTERN.exec(err.message);
  return match ? Number(match[1]) : null;
}

function safeError(err: unknown): { message: string; status: number } {
  if (err instanceof Error) {
    const status = extractStatus(err);
    const rawMessage = err.message.replace(STATUS_PATTERN, '').trim();

    if (status === 429 || rawMessage.toLowerCase().includes('rate limit')) {
      return { message: 'Rate limited by the provider. Please wait a moment and retry.', status: 429 };
    }
    if (status === 408 || status === 504 || rawMessage.toLowerCase().includes('econnrefused') || rawMessage.toLowerCase().includes('fetch failed')) {
      return { message: 'Network error: could not reach the LLM provider.', status: 503 };
    }
    // Pass the raw provider message through for all other errors (401, 402, 404, 5xx, etc.)
    // so the UI shows exactly what the provider said.
    return { message: rawMessage || `Provider HTTP ${status ?? 'error'}`, status: status ?? 502 };
  }
  return { message: 'An unexpected error occurred.', status: 500 };
}

aiRouter.get('/config', (_req, res) => {
  const config = getConfig();
  res.json({
    status: isAIConfigured(config) ? 'configured' : 'not_configured',
    provider: config.provider || null,
    model: config.model || null,
    endpoint: config.endpoint || null,
  });
});

// Debug endpoint — shows runtime config without exposing the full key.
aiRouter.get('/debug', (_req, res) => {
  const config = getConfig();
  res.json({
    provider: config.provider || null,
    model: config.model || null,
    endpoint: config.endpoint || null,
    apiKeySet: Boolean(config.apiKey),
    apiKeyPrefix: config.apiKey ? config.apiKey.slice(0, 12) + '...' : null,
    configured: isAIConfigured(config),
  });
});

aiRouter.post('/config', async (req, res) => {
  const { provider, model, endpoint, apiKey } = req.body as Partial<AIConfig>;

  // Read existing stored config so we can preserve the API key if none is submitted.
  const existing = db.data?.ai ?? { provider: '', model: '', endpoint: '', apiKey: '' };

  const next: AIConfig = {
    provider: (provider ?? '').toString().trim(),
    model: (model ?? '').toString().trim(),
    endpoint: (endpoint ?? '').toString().trim(),
    // Only update the key if the user actually typed one; otherwise keep the stored key.
    apiKey: (apiKey ?? '').toString().trim() || existing.apiKey,
  };

  db.data!.ai = next;
  await db.write();

  // Mirror the config to .env so it persists across server restarts
  // and is available as environment variables.
  try {
    await writeEnvConfig(next);
  } catch (err) {
    // Non-fatal — the JSON store is the source of truth at runtime.
    console.warn('[config] Could not write .env:', (err as Error).message);
  }

  res.json({
    status: isAIConfigured(next) ? 'configured' : 'not_configured',
    provider: next.provider || null,
    model: next.model || null,
    endpoint: next.endpoint || null,
  });
});

aiRouter.post('/test-connection', async (_req, res) => {
  const config = getConfig();

  if (!isAIConfigured(config)) {
    res.status(400).json({ success: false, status: 'not_configured', message: 'AI is not configured.' });
    return;
  }

  try {
    const provider = createProvider(config);
    await provider.testConnection();
    res.json({ success: true, status: 'connected' });
  } catch (err) {
    const { message, status } = safeError(err);
    res.status(status).json({ success: false, status: 'error', message });
  }
});

aiRouter.post('/chat', async (req, res) => {
  const config = getConfig();

  if (!isAIConfigured(config)) {
    res.status(400).json({ error: 'AI is not configured.' });
    return;
  }

  const { messages } = req.body as { messages?: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  const validRoles = new Set(['system', 'user', 'assistant']);
  const isValid = messages.every(
    (m) => m && validRoles.has(m.role) && typeof m.content === 'string',
  );
  if (!isValid) {
    res.status(400).json({ error: 'Invalid message format.' });
    return;
  }

  try {
    const provider = createProvider(config);
    const reply = await provider.chat(messages);
    res.json(reply);
  } catch (err) {
    const { message, status } = safeError(err);
    res.status(status).json({ error: message });
  }
});
