import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

/**
 * Guards a route by checking:
 * 1. isAuthenticated — token present and auth state loaded
 * 2. requiredRole — user must have the specified role (e.g. 'ADMIN' or 'ROLE_ADMIN')
 *
 * Unauthenticated users are redirected to /login.
 * Authenticated users without the required role are redirected to /unauthorized.
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const hasRole = user?.roles?.some(
      (r) =>
        r === requiredRole ||
        r === `ROLE_${requiredRole}` ||
        r.replace(/^ROLE_/, '') === requiredRole,
    );

    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
