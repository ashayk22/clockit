import React, { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../auth/AuthContext';
import { initLanding } from './initLanding';
import landingHtml from './landing.html?raw';
import '../styles/landing.css';

/**
 * The public marketing page.
 *
 * The markup is the original, pre-React landing page rendered verbatim, and the
 * scroll-driven hero animation is booted by `initLanding` — the animation is
 * preserved rather than re-created. Every listener, tween and ScrollTrigger it
 * creates is torn down on unmount so the page keeps working after visiting the
 * dashboard and coming back.
 */
export const LandingPage: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();

  // Keep the latest callbacks in refs so the (heavy) landing init only ever
  // runs once per mount instead of re-running on every context change.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const toggleThemeRef = useRef(toggleTheme);
  toggleThemeRef.current = toggleTheme;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // The landing owns a pinned hero, so it must start from the very top.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    return initLanding(root, {
      navigate: (path) => navigateRef.current(path),
      toggleTheme: () => toggleThemeRef.current(),
      isDark: () => document.documentElement.classList.contains('dark'),
    });
  }, []);

  // Reflect the signed-in state in the landing navigation.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctaBtn = root.querySelector<HTMLElement>('#nav-cta-btn');
    const pill = root.querySelector<HTMLElement>('#nav-user-pill');
    const nameTag = root.querySelector<HTMLElement>('#nav-user-pill .user-name-tag');
    const avatar = root.querySelector<HTMLElement>('#nav-user-pill .user-avatar-badge');
    const signOutBtn = root.querySelector<HTMLElement>('#nav-signout-btn');

    if (ctaBtn) ctaBtn.hidden = isAuthenticated;
    if (pill) pill.hidden = !isAuthenticated;

    let onPillClick: (() => void) | null = null;
    let onSignOutClick: ((event: Event) => void) | null = null;

    if (isAuthenticated && user) {
      if (nameTag) nameTag.textContent = user.name;
      if (avatar) {
        avatar.textContent = user.name
          .split(/\s+/)
          .filter(Boolean)
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
      }
      if (pill) {
        onPillClick = () => navigateRef.current('/app');
        pill.classList.add('is-authenticated');
        pill.addEventListener('click', onPillClick);
      }
      if (signOutBtn) {
        onSignOutClick = (event: Event) => {
          event.stopPropagation();
          signOut();
        };
        signOutBtn.addEventListener('click', onSignOutClick);
      }
    }

    return () => {
      if (pill && onPillClick) pill.removeEventListener('click', onPillClick);
      if (signOutBtn && onSignOutClick) signOutBtn.removeEventListener('click', onSignOutClick);
    };
  }, [isAuthenticated, user, signOut]);

  return (
    <div
      className="clockit-landing"
      ref={rootRef}
      dangerouslySetInnerHTML={{ __html: landingHtml }}
    />
  );
};

export default LandingPage;
