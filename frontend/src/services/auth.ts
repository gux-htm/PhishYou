/**
 * PhishYou — Auth service
 * Spec: PHISHYOU_SPECS/02_ARCHITECTURE/API_CONTRACTS.md (OAuth2 + REST, /api/v1)
 *
 * Thin wrappers over the backend auth routes. Uses `apiFetch` with the anonymous
 * flag so registration/login never attach a stale token.
 */
import { apiFetch, ApiError } from './api';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUserPayload;
}

export interface RegisterResponse {
  success: boolean;
  requiresVerification: boolean;
  email: string;
  user: AuthUserPayload;
  /** Present only in simulated email mode (no SMTP configured). */
  devCode?: string;
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

/** ApiError raised by login when the account exists but email is unverified. */
export class UnverifiedEmailError extends Error {
  readonly email: string;
  readonly devCode?: string;
  constructor(email: string, devCode?: string) {
    super('Email is not verified.');
    this.name = 'UnverifiedEmailError';
    this.email = email;
    this.devCode = devCode;
  }
}

export function register(input: RegisterInput): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: input,
    anonymous: true,
  });
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  try {
    return await apiFetch<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: input,
      anonymous: true,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403 && err.payload?.requiresVerification) {
      // Surface the verification gate as a typed error so the UI can switch steps.
      throw new UnverifiedEmailError((err.payload.email as string) ?? input.email, err.payload.devCode as string | undefined);
    }
    throw err;
  }
}

export function verifyEmail(email: string, code: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/v1/auth/verify-email', {
    method: 'POST',
    body: { email, code },
    anonymous: true,
  });
}

export function resendVerification(email: string): Promise<{ success: boolean; delivered?: boolean; alreadyVerified?: boolean; devCode?: string }> {
  return apiFetch('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: { email },
    anonymous: true,
  });
}

export function fetchCurrentUser(): Promise<{ user: AuthUserPayload }> {
  return apiFetch<{ user: AuthUserPayload }>('/api/v1/auth/me');
}
