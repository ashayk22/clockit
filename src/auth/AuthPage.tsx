import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Moon, Sun, User } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { DEMO_CREDENTIALS } from './authStore';
import '../styles/auth.css';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  mode: AuthMode;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COPY: Record<AuthMode, { eyebrow: string; title: string; subtitle: string; cta: string; altText: string; altLink: string; altTo: string }> = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Sign in to ClockIt',
    subtitle: 'Pick up your focus sessions, tasks and notes exactly where you left them.',
    cta: 'Sign in',
    altText: 'New to ClockIt?',
    altLink: 'Create an account',
    altTo: '/signup',
  },
  signup: {
    eyebrow: 'Get started',
    title: 'Create your account',
    subtitle: 'One workspace for your focus timer, tasks, notes, habits and calendar.',
    cta: 'Create account',
    altText: 'Already have an account?',
    altLink: 'Sign in',
    altTo: '/login',
  },
};

/**
 * Shared sign-in / sign-up screen. Both routes render the same layout so the
 * experience stays consistent; only the copy and the extra "name" field differ.
 *
 * There is no backend: accounts are stored locally (see authStore) which keeps
 * the flow fully functional — real validation, real loading, real errors.
 */
export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const { isAuthenticated, signIn, signUp } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const copy = COPY[mode];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from && state.from.startsWith('/') ? state.from : '/app';
  }, [location.state]);

  // Already signed in? Don't show the form again.
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (mode === 'signup' && !name.trim()) next.name = 'Please tell us your name.';
    if (!email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 6) next.password = 'Use at least 6 characters.';
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const found = validate();
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setErrors({});
    setFormError(null);
  };

  return (
    <div className="clockit-auth-shell">
      {/* Left: brand / product panel */}
      <aside className="clockit-auth-panel">
        <Link to="/" className="clockit-auth-brand" aria-label="Back to ClockIt home">
          <span className="clockit-auth-brand-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </span>
          <span>ClockIt</span>
        </Link>

        <div className="clockit-auth-panel-copy">
          <h2>Time, tasks and attention — finally in one place.</h2>
          <p>
            ClockIt pairs a deep-work timer with task prioritisation, a notes knowledge graph,
            habit streaks and an analytics dashboard, so your day stays coherent from first
            focus block to final checklist.
          </p>
          <ul className="clockit-auth-points">
            <li><span className="clockit-auth-dot" /> Focus sessions that write straight into your analytics</li>
            <li><span className="clockit-auth-dot" /> Tasks, habits and calendar that share one timeline</li>
            <li><span className="clockit-auth-dot" /> Everything persists locally — no account setup friction</li>
          </ul>
        </div>

        <div className="clockit-auth-panel-foot">(C) 2026 ClockIt. Built for focused teams and solo makers.</div>
      </aside>

      {/* Right: the form */}
      <main className="clockit-auth-main">
        <div className="clockit-auth-topbar">
          <Link to="/" className="clockit-auth-back">
            <ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} />
            <span>Back to home</span>
          </Link>
          <button
            type="button"
            className="clockit-icon-action-btn"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="clockit-auth-card motion-rise-in">
          <span className="clockit-auth-eyebrow">{copy.eyebrow}</span>
          <h1 className="clockit-auth-title">{copy.title}</h1>
          <p className="clockit-auth-subtitle">{copy.subtitle}</p>

          {formError && (
            <div className="clockit-auth-alert" role="alert">
              {formError}
            </div>
          )}

          <form className="clockit-auth-form" onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && (
              <label className="clockit-field">
                <span className="clockit-field-label">Full name</span>
                <span className={`clockit-input-wrap${errors.name ? ' has-error' : ''}`}>
                  <User size={15} className="clockit-input-icon" />
                  <input
                    type="text"
                    className="clockit-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Chen"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                  />
                </span>
                {errors.name && <span className="clockit-field-error">{errors.name}</span>}
              </label>
            )}

            <label className="clockit-field">
              <span className="clockit-field-label">Email</span>
              <span className={`clockit-input-wrap${errors.email ? ' has-error' : ''}`}>
                <Mail size={15} className="clockit-input-icon" />
                <input
                  type="email"
                  className="clockit-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
              </span>
              {errors.email && <span className="clockit-field-error">{errors.email}</span>}
            </label>

            <label className="clockit-field">
              <span className="clockit-field-label">Password</span>
              <span className={`clockit-input-wrap${errors.password ? ' has-error' : ''}`}>
                <Lock size={15} className="clockit-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="clockit-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="clockit-input-suffix-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
              {errors.password && <span className="clockit-field-error">{errors.password}</span>}
            </label>

            <button type="submit" className="clockit-auth-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="clockit-auth-spinner" />
                  <span>{mode === 'login' ? 'Signing in…' : 'Creating account…'}</span>
                </>
              ) : (
                <>
                  <span>{copy.cta}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <button type="button" className="clockit-auth-demo" onClick={fillDemo} disabled={isSubmitting}>
              Use demo credentials
              <code>{DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}</code>
            </button>
          )}

          <p className="clockit-auth-alt">
            {copy.altText}{' '}
            <Link to={copy.altTo} className="clockit-auth-link">
              {copy.altLink}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
