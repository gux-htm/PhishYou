import { apiFetch, ApiError } from './api';

export interface EmailConfig {
  smtp: { host: string; port: number; secure: boolean; user: string; pass: string; from: string; replyTo: string };
  imap: { host: string; port: number; secure: boolean; user: string; pass: string; mailbox: string };
}
export interface EmailStatus {
  smtp: { configured: boolean; host: string | null; port: number; secure: boolean; user: string | null; from: string | null; replyTo: string | null };
  imap: { configured: boolean; host: string | null; port: number; secure: boolean; user: string | null; mailbox: string };
}
export function fetchEmailConfig(): Promise<EmailStatus> { return apiFetch<EmailStatus>('/api/v1/email/config'); }
export function saveEmailConfig(config: EmailConfig): Promise<{ success: boolean }> { return apiFetch<{ success: boolean }>('/api/v1/email/config', { method: 'POST', body: config }); }
export function testEmailConnection(): Promise<{ success: boolean; smtp: { ok: boolean; error?: string }; imap: { ok: boolean; error?: string } }> { return apiFetch('/api/v1/email/test-connection', { method: 'POST' }); }
export function getEmailErrorMessage(error: unknown): string { return error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Email connector request failed.'; }
