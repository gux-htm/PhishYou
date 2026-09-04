import type { AIProvider, ChatMessage, ChatResponse } from './types.js';

/** Hard cap on a single LLM request so a blocked/slow network can't hang a campaign launch. */
const REQUEST_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? '') || 30000;

interface OpenAICompatibleChoice {
  message?: {
    content?: string | null;
  };
}

interface OpenAICompatibleResponse {
  choices?: OpenAICompatibleChoice[];
  error?: { message?: string };
}

function safeErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Unknown provider error';
  const p = payload as Record<string, unknown>;
  if (p.error && typeof p.error === 'object') {
    const e = p.error as { message?: string };
    return e.message ?? 'Provider error';
  }
  if (typeof p.message === 'string') return p.message;
  return 'Unknown provider error';
}

export class QwenProvider implements AIProvider {
  readonly name = 'qwen';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly endpoint: string,
  ) {}

  private async call(messages: ChatMessage[], maxTokens: number): Promise<string> {
    if (!this.apiKey || this.apiKey.trim().length < 8) {
      throw new Error('Missing or invalid LLM API key');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      let payload: OpenAICompatibleResponse;
      try {
        payload = (await response.json()) as OpenAICompatibleResponse;
      } catch {
        throw new Error(response.ok ? 'Empty or invalid provider response' : `Provider HTTP ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`[${response.status}] ${safeErrorMessage(payload) || `Provider HTTP ${response.status}`}`);
      }

      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.length === 0) {
        throw new Error('Provider returned an empty response');
      }
      return content;
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection(): Promise<void> {
    await this.call(
      [
        { role: 'system', content: 'You are a helpful assistant. Reply with only the word OK.' },
        { role: 'user', content: 'Ping' },
      ],
      5,
    );
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const content = await this.call(messages, 512);
    return { content };
  }
}
