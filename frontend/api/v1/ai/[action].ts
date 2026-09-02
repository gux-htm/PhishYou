import type { IncomingMessage, ServerResponse } from 'node:http';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

type RuntimeConfig = {
  provider: string;
  apiKey: string;
  model: string;
  endpoint: string;
};

function config(): RuntimeConfig {
  return {
    provider: process.env.LLM_PROVIDER?.trim() || 'auto',
    apiKey: process.env.LLM_API_KEY?.trim() || '',
    model: process.env.LLM_MODEL?.trim() || '',
    endpoint: process.env.LLM_ENDPOINT?.trim() || '',
  };
}

function configured(value: RuntimeConfig): boolean {
  return Boolean(value.apiKey && value.model && value.endpoint);
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function body(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('Invalid JSON request body.');
  }
}

function isGemini(value: RuntimeConfig): boolean {
  const provider = value.provider.toLowerCase();
  return provider === 'gemini' || provider === 'google' || value.endpoint.includes('generativelanguage.googleapis.com');
}

async function callProvider(value: RuntimeConfig, messages: Message[]): Promise<string> {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content;
  if (!lastUserMessage) throw new Error('A user message is required.');

  if (isGemini(value)) {
    const response = await fetch(value.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': value.apiKey,
      },
      body: JSON.stringify({ model: value.model.replace(/^models\//, ''), input: lastUserMessage }),
    });

    const payload = await response.json().catch(() => ({})) as {
      steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw Object.assign(new Error(payload.error?.message || 'Gemini request failed.'), { status: response.status });
    }

    for (let index = (payload.steps?.length ?? 0) - 1; index >= 0; index -= 1) {
      const step = payload.steps?.[index];
      if (step?.type !== 'model_output') continue;
      const text = step.content
        ?.filter((item) => item.type === 'text' && item.text)
        .map((item) => item.text!.trim())
        .filter(Boolean)
        .join('\n');
      if (text) return text;
    }
    throw new Error('Gemini returned no text output.');
  }

  const response = await fetch(value.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${value.apiKey}`,
    },
    body: JSON.stringify({ model: value.model, messages }),
  });
  const payload = await response.json().catch(() => ({})) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!response.ok) throw Object.assign(new Error(payload.error?.message || 'LLM request failed.'), { status: response.status });
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error('The provider returned no text output.');
  return text;
}

export default async function handler(req: IncomingMessage & { query?: Record<string, string | string[]> }, res: ServerResponse): Promise<void> {
  const action = Array.isArray(req.query?.action) ? req.query?.action[0] : req.query?.action;
  const value = config();

  if (action === 'config' && req.method === 'GET') {
    json(res, 200, {
      status: configured(value) ? 'configured' : 'not_configured',
      provider: value.provider === 'auto' ? null : value.provider,
      model: value.model || null,
      endpoint: value.endpoint || null,
    });
    return;
  }

  if (action === 'config' && req.method === 'POST') {
    json(res, 409, {
      error: 'Hosted AI configuration is managed through secure server environment variables. Set LLM_PROVIDER, LLM_API_KEY, LLM_MODEL, and LLM_ENDPOINT in the deployment environment.',
    });
    return;
  }

  if (!configured(value)) {
    json(res, 400, { success: false, status: 'not_configured', message: 'AI is not configured on this deployment.' });
    return;
  }

  try {
    if (action === 'test-connection' && req.method === 'POST') {
      await callProvider(value, [{ role: 'user', content: 'Reply with only the word OK.' }]);
      json(res, 200, { success: true, status: 'connected' });
      return;
    }

    if (action === 'chat' && req.method === 'POST') {
      const payload = await body(req) as { messages?: Message[] };
      if (!Array.isArray(payload.messages) || !payload.messages.length) {
        json(res, 400, { error: 'Messages array is required.' });
        return;
      }
      const reply = await callProvider(value, payload.messages);
      json(res, 200, { content: reply });
      return;
    }

    json(res, 405, { error: 'Method or AI endpoint not supported.' });
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error && typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : 502;
    const message = error instanceof Error ? error.message : 'Unexpected AI provider error.';
    json(res, status, { success: false, status: 'error', error: message, message });
  }
}
