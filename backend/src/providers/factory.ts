import type { AIProvider } from './types.js';
import { GeminiProvider } from './gemini.js';
import { QwenProvider } from './qwen.js';

export interface ProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  endpoint: string;
}

function usesGeminiProtocol(config: ProviderConfig): boolean {
  const provider = config.provider.toLowerCase().trim();
  const endpoint = config.endpoint.toLowerCase();
  return provider === 'gemini' || provider === 'google' || endpoint.includes('generativelanguage.googleapis.com');
}

/**
 * Creates a provider from the configured protocol rather than from a fixed UI
 * dropdown. Unknown providers can still use the OpenAI-compatible protocol.
 */
export function createProvider(config: ProviderConfig): AIProvider {
  if (usesGeminiProtocol(config)) {
    return new GeminiProvider(config.apiKey, config.model, config.endpoint);
  }

  return new QwenProvider(config.apiKey, config.model, config.endpoint);
}
