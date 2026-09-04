/**
 * PhishYou — Auth service
 * Spec: PHISHYOU_SPECS/02_ARCHITECTURE/API_CONTRACTS.md (OAuth2 + REST, /api/v1)
 *
 * Thin wrappers over the backend auth routes. Uses `apiFetch` with the anonymous
 * flag so registration/login never attach a stale token.
 */
import { apiFetch } from './api';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUserPayload;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  organization: string;
  role?: string;
  consent: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: input,
    anonymous: true,
  });
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: input,
    anonymous: true,
  });
}

export function fetchCurrentUser(): Promise<{ user: AuthUserPayload }> {
  return apiFetch<{ user: AuthUserPayload }>('/api/v1/auth/me');
}
