import { apiFetch, ApiError } from './api';

export interface ConversationSummary { id: string; name: string; status: string; updatedAt: string; }
export interface CampaignConversation {
  campaign: { id: string; name: string; status: string; objective?: string; campaignConfig?: Record<string, unknown> };
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; timestamp?: string }>;
  events: Array<{ id: string; type: string; targetId?: string | null; meta?: Record<string, unknown>; createdAt: string }>;
}
export function createConversation(message: string) { return apiFetch('/api/v1/campaign/conversations', { method: 'POST', body: { message } }); }
export function listConversations() { return apiFetch<{ conversations: ConversationSummary[] }>('/api/v1/campaign/conversations'); }
export function getCampaignConversation(id: string) { return apiFetch<CampaignConversation>(`/api/v1/campaign/${id}/chat`); }
export function sendCampaignChat(id: string, messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>, message: string) { return apiFetch<{ content: string; action?: string; execution?: { successful: number; failed: number } }>(`/api/v1/campaign/${id}/chat`, { method: 'POST', body: { messages, message } }); }
export function importCampaignContext(id: string, text: string, targets?: Array<{ id: string; name: string; email: string; department?: string; role?: string; personalContext?: string }>) { return apiFetch<{ success: boolean }>(`/api/v1/campaign/${id}/context`, { method: 'POST', body: { text, targets } }); }
export function campaignChatError(error: unknown): string { return error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Campaign agent request failed.'; }
