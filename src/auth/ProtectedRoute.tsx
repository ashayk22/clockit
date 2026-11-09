import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Guards every /app route. Unauthenticated visitors are sent to /login and the
 * destination is remembered so sign-in returns them exactly where they wanted
 * to go. The redirect uses `replace` so the browser Back button never bounces
 * the user straight back into the guarded route.
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
