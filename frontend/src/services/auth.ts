/**
 * PhishYou — Auth service
 * Auth endpoints stay thin so pages can own the user experience while all
 * credential and verification handling remains server-side.
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

export interface RegisterResponse {
  success: boolean;
  verificationRequired: boolean;
  email: string;
  verificationUrl?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  email: string;
}

export function register(input: RegisterInput): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: input,
    anonymous: true,
  });
}

export function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return apiFetch<VerifyEmailResponse>('/api/v1/auth/verify-email', {
    method: 'POST',
    body: { token },
    anonymous: true,
  });
}

export function resendVerificationEmail(email: string): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/v1/auth/resend-verification', {
    method: 'POST',
    body: { email },
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
