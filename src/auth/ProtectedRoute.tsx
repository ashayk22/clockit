import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { preferencesRepository, taskRepository, focusRepository } from '../services/repositories';

/**
 * Guards every authenticated route (/app/* and /onboarding).
 * Unauthenticated visitors are sent to /login with return destination remembered.
 *
 * New users are guided to /onboarding for first-time personalization.
 * Existing accounts and demo sessions bypass onboarding directly to /app.
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isDemo } = useAuth();
  const location = useLocation();

  // Only reachable while a backend session is being restored: deciding before
  // it resolves would bounce a signed-in user to /login for a frame.
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        Restoring your session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  // Personalization onboarding guard
  const isOnboardingRoute = location.pathname === '/onboarding';
  const isEditingOnboarding = location.search.includes('edit=true');

  if (!isDemo) {
    let completed = preferencesRepository.get('onboardingCompleted');

    // Existing user compatibility:
    // If the account has existing tasks or focus sessions, preserve their workflow
    // and never force them through the new onboarding questionnaire.
    if (!completed) {
      const hasExistingTasks = taskRepository.getAll().length > 0;
      const hasExistingFocus = focusRepository.getAll().length > 0;
      if (hasExistingTasks || hasExistingFocus) {
        preferencesRepository.set('onboardingCompleted', true);
        completed = true;
      }
    }

    if (!completed && !isOnboardingRoute) {
      return <Navigate to="/onboarding" replace />;
    }

    if (completed && isOnboardingRoute && !isEditingOnboarding) {
      return <Navigate to="/app" replace />;
    }
  } else if (isOnboardingRoute && !isEditingOnboarding) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
