import { Router } from 'express';
import { mergeAIConfig, isAIConfigured, type AIConfig } from '../config.js';
import { createProvider } from '../providers/factory.js';
import { db } from '../store.js';
import type { ChatMessage } from '../providers/types.js';

export const aiRouter = Router();

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
    const msg = err.message.toLowerCase();

    if (status === 401 || msg.includes('unauthorized') || msg.includes('invalid api-key')) {
      return { message: 'Authentication failed: check your API key.', status: 401 };
    }
    if (status === 429 || msg.includes('rate limit')) {
      return { message: 'Rate limited by the provider. Please wait a moment and retry.', status: 429 };
    }
    if (status === 404 || msg.includes('not found') || msg.includes('model')) {
      return { message: 'Invalid model or endpoint configuration.', status: 400 };
    }
    if (status === 408 || status === 504 || msg.includes('fetch') || msg.includes('network') || msg.includes('abort')) {
      return { message: 'Network error: could not reach the LLM provider.', status: 503 };
    }
    if (status && status >= 500) {
      return { message: 'Provider error. Please retry in a moment.', status: 502 };
    }
    return { message: err.message.replace(STATUS_PATTERN, '').trim(), status: status || 502 };
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

aiRouter.post('/config', async (req, res) => {
  const { provider, model, endpoint, apiKey } = req.body as Partial<AIConfig>;

  const next: AIConfig = {
    provider: (provider ?? '').toString().trim(),
    model: (model ?? '').toString().trim(),
    endpoint: (endpoint ?? '').toString().trim(),
    apiKey: (apiKey ?? '').toString().trim(),
  };

  db.data!.ai = next;
  await db.write();

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
