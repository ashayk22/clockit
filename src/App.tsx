import React from 'react';
import { Navigate, Route, Routes, useNavigate, useOutletContext } from 'react-router-dom';
import LandingPage from './landing/LandingPage';
import AuthPage from './auth/AuthPage';
import ProtectedRoute from './auth/ProtectedRoute';
import { ScrollToTop } from './motion/ScrollToTop';
import { DashboardLayout, DashboardOutletContext } from './components/layout/DashboardLayout';
import { HomePage } from './components/pages/HomePage';
import { FocusPage } from './components/pages/FocusPage';
import { TasksPage } from './components/pages/TasksPage';
import { NotesPage } from './components/pages/NotesPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { HabitsPage } from './components/pages/HabitsPage';
import { CalendarPage } from './components/pages/CalendarPage';
import { SettingsPage } from './components/pages/SettingsPage';

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
 *   2. Authentication        →  /login, /signup
 *   3. Authenticated app     →  /app/* (guarded)
 *
 * The dashboard is nested under a single layout element so its sidebar and
 * header are mounted once and stay stable while pages change underneath.
 */
export const App: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* 1. Public */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. Auth */}
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />

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
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        {/* Unknown URLs land on the public page. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
