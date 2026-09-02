import type { AIProvider, ChatMessage, ChatResponse } from './types.js';

interface GeminiInteractionContent {
  type?: string;
  text?: string;
}

interface GeminiInteractionStep {
  type?: string;
  content?: GeminiInteractionContent[];
}

interface GeminiInteractionResponse {
  steps?: GeminiInteractionStep[];
  error?: { message?: string };
}

function normalizeModel(model: string): string {
  return model.trim().replace(/^models\//, '');
}

function extractText(payload: GeminiInteractionResponse): string | null {
  const steps = payload.steps ?? [];
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (step.type !== 'model_output') continue;
    const text = step.content
      ?.filter((item) => item.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text!.trim())
      .filter(Boolean)
      .join('\n');
    if (text) return text;
  }
  return null;
}

function providerError(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Unknown Gemini API error';
  const record = payload as { error?: { message?: string }; message?: string };
  return record.error?.message ?? record.message ?? 'Unknown Gemini API error';
}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly endpoint: string,
  ) {}

  private async call(input: string, previousInteractionId?: string): Promise<{ content: string; interactionId?: string }> {
    if (!this.apiKey || this.apiKey.trim().length < 8) {
      throw new Error('Missing or invalid Gemini API key');
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        model: normalizeModel(this.model),
        input,
        ...(previousInteractionId ? { previous_interaction_id: previousInteractionId } : {}),
      }),
    });

    let payload: GeminiInteractionResponse & { id?: string };
    try {
      payload = (await response.json()) as GeminiInteractionResponse & { id?: string };
    } catch {
      throw new Error(response.ok ? 'Gemini returned an invalid response' : `[${response.status}] Gemini API request failed`);
    }

    if (!response.ok) {
      throw new Error(`[${response.status}] ${providerError(payload)}`);
    }

    const content = extractText(payload);
    if (!content) {
      throw new Error('Gemini returned no text output');
    }

    return { content, interactionId: payload.id };
  }

  async testConnection(): Promise<void> {
    await this.call('Reply with only the word OK.');
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const systemMessages = messages.filter((message) => message.role === 'system');
    const conversation = messages
      .filter((message) => message.role !== 'system')
      .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
      .join('\n\n');
    const systemPrefix = systemMessages.length
      ? `${systemMessages.map((message) => message.content).join('\n\n')}\n\n`
      : '';
    const result = await this.call(`${systemPrefix}${conversation}`);
    return { content: result.content };
  }
}
