import type { AIProvider } from './types.js';
import { QwenProvider } from './qwen.js';

export interface ProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  endpoint: string;
}

export function createProvider(config: ProviderConfig): AIProvider {
  const provider = config.provider.toLowerCase().trim();

  switch (provider) {
    case 'qwen':
    case 'openai':
    case 'openai-compatible':
      // All use the same OpenAI-compatible chat-completions protocol.
      return new QwenProvider(config.apiKey, config.model, config.endpoint);
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}
