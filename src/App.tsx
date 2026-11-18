import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useNavigate, useOutletContext } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import { ScrollToTop } from './motion/ScrollToTop';
import { DashboardLayout, DashboardOutletContext } from './components/layout/DashboardLayout';
import { HomePage } from './components/pages/HomePage';
import { TasksPage } from './components/pages/TasksPage';
import { HabitsPage } from './components/pages/HabitsPage';
import { OnboardingProvider } from './components/onboarding/OnboardingContext';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { RouteLoadingFallback } from './components/common/RouteLoadingFallback';

// Top-level entrypoints lazy-loaded with resilient retry
const LandingPage = lazyWithRetry(() => import('./landing/LandingPage'));
const CaseStudiesPage = lazyWithRetry(() => import('./pages/CaseStudiesPage'));
const AuthPage = lazyWithRetry(() => import('./auth/AuthPage'));
const ResetPasswordPage = lazyWithRetry(() => import('./auth/ResetPasswordPage'));
const OnboardingWizard = lazyWithRetry(() =>
  import('./components/onboarding/OnboardingWizard').then((m) => ({ default: m.OnboardingWizard }))
);

// Secondary authenticated views lazy-loaded on demand
const FocusPage = lazyWithRetry(() =>
  import('./components/pages/FocusPage').then((m) => ({ default: m.FocusPage }))
);
const NotesPage = lazyWithRetry(() =>
  import('./components/pages/NotesPage').then((m) => ({ default: m.NotesPage }))
);
const AnalyticsPage = lazyWithRetry(() =>
  import('./components/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const CalendarPage = lazyWithRetry(() =>
  import('./components/pages/CalendarPage').then((m) => ({ default: m.CalendarPage }))
);
const SettingsPage = lazyWithRetry(() =>
  import('./components/pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const WorkspaceOverviewPage = lazyWithRetry(() =>
  import('./components/pages/WorkspacePages').then((m) => ({ default: m.WorkspaceOverviewPage }))
);
const WorkspaceDashboardPage = lazyWithRetry(() =>
  import('./components/pages/WorkspacePages').then((m) => ({ default: m.WorkspaceDashboardPage }))
);

/** The home view links out to the other views through the router. */
const HomeRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <HomePage
      onNavigateToFocus={() => navigate('/app/focus')}
      onNavigateToTasks={() => navigate('/app/tasks')}
      onNavigateToCalendar={() => navigate('/app/calendar')}
    />
  );
};

const TasksRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <TasksPage
      onNavigateToCalendar={() => navigate('/app/calendar')}
      onNavigateToFocus={() => navigate('/app/focus')}
    />
  );
};

/** Habits receive their data from the persistent layout via outlet context. */
const HabitsRoute: React.FC = () => {
  const { habits, onToggleHabit } = useOutletContext<DashboardOutletContext>();
  return <HabitsPage habits={habits} onToggleHabit={onToggleHabit} />;
};

/**
 * Three distinct experiences, three sets of routes:
 *
 *   1. Public landing page   →  /
 *   2. Authentication        →  /login, /signup, /reset-password
 *   3. Authenticated app     →  /app/* (guarded)
 *
 * The dashboard is nested under a single layout element so its sidebar and
 * header are mounted once and stay stable while pages change underneath.
 */
export const App: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteLoadingFallback fullScreen message="Loading ClockIt..." />}>
        <Routes>
          {/* 1. Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/case-studies" element={<CaseStudiesPage />} />

          {/* 2. Auth */}
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* 2b. Personalized Onboarding (Guarded) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingProvider>
                  <OnboardingWizard />
                </OnboardingProvider>
              </ProtectedRoute>
            }
          />

          {/* 3. Authenticated dashboard */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRoute />} />
            <Route path="focus" element={<FocusPage />} />
            <Route path="tasks" element={<TasksRoute />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="habits" element={<HabitsRoute />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="workspaces" element={<WorkspaceOverviewPage />} />
            <Route path="workspaces/:workspaceId/:tab?" element={<WorkspaceDashboardPage />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>

          {/* Unknown URLs land on the public page. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
