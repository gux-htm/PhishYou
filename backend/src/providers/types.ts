export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatResponse {
  content: string;
}

export interface AIProvider {
  /** Human-readable provider name. */
  readonly name: string;

  /**
   * Perform a lightweight real call to verify the provider is reachable and
   * credentials are valid. Must return a rejected promise on failure.
   */
  testConnection(): Promise<void>;

  /**
   * Send a conversation to the LLM and return the assistant's reply.
   */
  chat(messages: ChatMessage[]): Promise<ChatResponse>;
}
