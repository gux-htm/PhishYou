/**
 * PhishYou — Authentication context
 * Spec: FRONTEND_SPEC_ENHANCED.md — PAGE 1 (JWT held in memory, never localStorage)
 *       PHISHYOU_SPECS/12_COMPLIANCE/DATA_PROTECTION.md
 *
 * Wraps the app below the router. Login pages call `signIn` after the OAuth
 * token exchange; ProtectedRoute consumes `isAuthenticated`.
 */
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { AuthUser } from '../types';
import { getSessionUser, setSessionUser } from '../services/api';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Derive a display name from the email local part ("a.khan@x.com" → "A. Khan"). */
function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'Admin';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seed from the module-level session so a same-tab navigation (no reload)
  // keeps the user logged in.
  const [user, setUser] = useState<AuthUser | null>(() => getSessionUser());

  const signIn = useCallback((next: AuthUser) => {
    const normalized: AuthUser = {
      ...next,
      name: next.name || nameFromEmail(next.email),
      organization: next.organization || 'Company',
    };
    setSessionUser(normalized);
    setUser(normalized);
  }, []);

  const signOut = useCallback(() => {
    setSessionUser(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user?.token), signIn, signOut }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>');
  return context;
}
