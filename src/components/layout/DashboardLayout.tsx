import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, NavView } from './Sidebar';
import { Header } from './Header';
import { MobileNavBar } from './MobileNavBar';
import { PageTransition } from '../../motion/PageTransition';
import { LoginTransition } from '../../motion/LoginTransition';
import { dataService } from '../../services/dataService';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../auth/AuthContext';
import { isLoginTransitionPending, clearLoginTransition } from '../../auth/loginTransition';
import type { HabitItem } from '../../data/mockData';

/** Canonical URL for each dashboard view. */
export const VIEW_PATHS: Record<NavView, string> = {
  home: '/app',
  focus: '/app/focus',
  tasks: '/app/tasks',
  notes: '/app/notes',
  analytics: '/app/analytics',
  habits: '/app/habits',
  calendar: '/app/calendar',
};

/** Anything the routed pages need from the layout. */
export interface DashboardOutletContext {
  habits: HabitItem[];
  onToggleHabit: (id: string) => void;
}

const SIDEBAR_COLLAPSE_KEY = 'clockit-sidebar-collapsed';
const MOBILE_QUERY = '(max-width: 768px)';

function viewFromPathname(pathname: string): NavView {
  const match = (Object.keys(VIEW_PATHS) as NavView[])
    .filter((view) => view !== 'home')
    .find((view) => pathname === VIEW_PATHS[view] || pathname.startsWith(`${VIEW_PATHS[view]}/`));
  return match ?? 'home';
}

/** Tracks a CSS media query so the shell can adapt its layout mode. */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/**
 * The authenticated shell.
 *
 * The sidebar and header live *outside* the page transition, so navigating
 * between pages never rebuilds or re-animates the chrome — only the page body
 * moves. The active view is derived from the URL, which is what makes browser
 * Back/Forward work correctly.
 */
export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const [workspaces, setWorkspaces] = useState(() => dataService.getWorkspaces());
  const [habits, setHabits] = useState(() => dataService.getHabits());
  const [activeWorkspace, setActiveWorkspace] = useState('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1',
  );
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // True only for the very first mount that directly follows a successful
  // sign-in / sign-up, so the branded transition plays exactly once.
  const [showLoginTransition, setShowLoginTransition] = useState<boolean>(() =>
    isLoginTransitionPending(),
  );

  useEffect(() => {
    return dataService.subscribe(() => {
      setWorkspaces(dataService.getWorkspaces());
      setHabits(dataService.getHabits());
    });
  }, []);

  // Collapse is a desktop affordance; the drawer takes over on small screens.
  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);

  // Leaving mobile width, or navigating, always closes the drawer.
  useEffect(() => {
    if (!isMobile) setIsMobileNavOpen(false);
  }, [isMobile]);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileNavOpen]);

  const activeView = useMemo(() => viewFromPathname(pathname), [pathname]);

  const handleViewChange = useCallback(
    (view: NavView) => {
      navigate(VIEW_PATHS[view]);
    },
    [navigate],
  );

  const handleToggleHabit = useCallback((id: string) => {
    setHabits(dataService.toggleHabit(id));
  }, []);

  const outletContext = useMemo<DashboardOutletContext>(
    () => ({ habits, onToggleHabit: handleToggleHabit }),
    [habits, handleToggleHabit],
  );

  const openSettings = useCallback(() => navigate('/app/settings'), [navigate]);
  const openTasks = useCallback(() => navigate(VIEW_PATHS.tasks), [navigate]);

  const finishLoginTransition = useCallback(() => {
    clearLoginTransition();
    setShowLoginTransition(false);
  }, []);

  return (
    <div className="clockit-layout-container">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onWorkspaceSelect={setActiveWorkspace}
        userName={user?.name}
        onOpenSettings={openSettings}
        isCollapsed={isMobile ? false : isCollapsed}
        onToggleCollapse={toggleCollapse}
        isMobileOpen={isMobileNavOpen}
      />

      {/* Off-canvas scrim (only rendered while the drawer is open on phones). */}
      {isMobile && isMobileNavOpen ? (
        <div
          className="clockit-sidebar-backdrop"
          onClick={closeMobileNav}
          aria-hidden="true"
        />
      ) : null}

      <div className="clockit-main-viewport">
        <Header
          isDarkMode={isDark}
          onToggleTheme={toggleTheme}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onOpenSettings={openSettings}
          onSignOut={signOut}
          onOpenTasks={openTasks}
        />

        <main style={{ flex: 1 }}>
          <PageTransition>
            <Outlet context={outletContext} />
          </PageTransition>
        </main>
      </div>

      {isMobile ? (
        <MobileNavBar
          activeView={activeView}
          onViewChange={handleViewChange}
          onOpenMenu={() => setIsMobileNavOpen(true)}
        />
      ) : null}

      {showLoginTransition ? <LoginTransition onComplete={finishLoginTransition} /> : null}
    </div>
  );
};

export default DashboardLayout;
