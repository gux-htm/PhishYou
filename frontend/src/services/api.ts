/**
 * PhishYou — API client core
 * Spec: PHISHYOU_SPECS/02_ARCHITECTURE/API_CONTRACTS.md (OAuth2 + REST, /api/v1)
 *
 * Thin fetch wrapper shared by all services:
 * - JSON headers, timeout via AbortController (never hang the UI)
 * - Normalized ApiError so pages can show consistent error states
 * - Token attachment from the in-memory session
 */
import type { AuthUser } from '../types';

const DEFAULT_TIMEOUT_MS = 8000;

/** Module-level session — the ONLY place the JWT lives (memory, never localStorage). */
const session: { user: AuthUser | null } = { user: null };

export function setSessionUser(user: AuthUser | null): void {
  session.user = user;
}

export function getSessionUser(): AuthUser | null {
  return session.user;
}

export class ApiError extends Error {
  readonly status: number;
  readonly path: string;
  /** Full parsed error payload (e.g. requiresVerification, devCode). */
  readonly payload?: Record<string, unknown>;
  constructor(message: string, status: number, path: string, payload?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.path = path;
    this.payload = payload;
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Skip attaching the auth token (login endpoints). */
  anonymous?: boolean;
}

function buildHeaders(options: ApiOptions): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (!options.anonymous && session.user?.token) headers.Authorization = `Bearer ${session.user.token}`;
  return headers;
}

/**
 * Perform a JSON request against the PhishYou API. Always resolves the parsed
 * body on 2xx and throws ApiError otherwise — callers decide their own
 * fallbacks (demo data, error states).
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(path, {
      method: options.method ?? 'GET',
      headers: buildHeaders(options),
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal ?? controller.signal,
    });

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      let payload: Record<string, unknown> | undefined;
      try {
        payload = (await response.json()) as Record<string, unknown>;
        detail = (payload.message as string) ?? (payload.error as string) ?? detail;
      } catch {
        /* non-JSON error body — keep HTTP status text */
      }
      throw new ApiError(detail, response.status, path, payload);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Trigger a browser download for an export payload (CSV/JSON). */
export function downloadFile(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
