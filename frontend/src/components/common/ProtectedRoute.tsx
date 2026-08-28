/**
 * PhishYou — Protected route wrapper
 * Spec: IMPLEMENTATION_CHECKLIST.md — React Router Setup ("Create ProtectedRoute
 *       wrapper component")
 *
 * Unauthenticated visitors are redirected to /login and returned to the
 * attempted route after sign-in (via location.state).
 */
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
