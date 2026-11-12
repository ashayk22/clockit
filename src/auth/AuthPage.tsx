import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { DEMO_CREDENTIALS } from './authStore';
import { PasswordStrengthMeter, validatePasswordInput } from './passwordSecurity';
import { ClockItLogo } from '../components/brand/ClockItLogo';
import '../styles/auth.css';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  mode: AuthMode;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COPY: Record<
  AuthMode,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
    altText: string;
    altLink: string;
    altTo: string;
  }
> = {
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
    subtitle: 'Your personal time-mastery operating system. Fast, local-first and private.',
    cta: 'Create account',
    altText: 'Already have an account?',
    altLink: 'Sign in instead',
    altTo: '/login',
  },
};

export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const { isAuthenticated, signIn, signUp, enterDemo, requestPasswordReset } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const copy = COPY[mode];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Recovery state
  const [isForgot, setIsForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

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
    if (mode === 'signup') {
      if (!name.trim()) next.name = 'Please tell us your full name.';
      else if (name.trim().length < 2) next.name = 'Name must be at least 2 characters.';
    }
    if (!email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';

    if (mode === 'signup') {
      const pwCheck = validatePasswordInput(password, confirmPassword);
      if (pwCheck.passwordError) next.password = pwCheck.passwordError;
      if (pwCheck.confirmError) next.confirmPassword = pwCheck.confirmError;
    } else {
      if (!password) next.password = 'Password is required.';
    }
    return next;
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotLoading) return;
    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }
    setForgotLoading(true);
    setFormError(null);
    try {
      await requestPasswordReset(email.trim());
      setForgotSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not send recovery link.');
    } finally {
      setForgotLoading(false);
    }
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
        await signIn(email.trim(), password);
      } else {
        await signUp(name.trim(), email.trim(), password);
      }
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await enterDemo();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError('Could not launch demo mode. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="clockit-auth-shell">
      {/* Left: brand / product panel */}
      <aside className="clockit-auth-panel">
        <Link to="/" className="clockit-auth-brand" aria-label="Back to ClockIt home">
          <ClockItLogo variant="full" size={26} />
        </Link>

        <div className="clockit-auth-quote">
          <p className="clockit-auth-quote-text">
            &ldquo;One timeline. Every task, block of deep work and habit in a single view.&rdquo;
          </p>
          <span className="clockit-auth-quote-author">Designed for modern daily workflows</span>
        </div>

        <div className="clockit-auth-bullets">
          <span className="clockit-auth-bullets-title">What you get</span>
          <ul>
            <li>
              <span className="clockit-auth-dot" /> Focus dial with audio-free interval tracking
            </li>
            <li>
              <span className="clockit-auth-dot" /> Tasks, habits and calendar that share one timeline
            </li>
            <li>
              <span className="clockit-auth-dot" /> Everything persists locally and syncs to cloud
            </li>
          </ul>
        </div>

        <div className="clockit-auth-panel-foot">© 2026 ClockIt. Built for focused teams and solo makers.</div>
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

        <div key={isForgot ? 'forgot' : mode}>
          <div className="clockit-auth-card motion-rise-in">
            {isForgot ? (
              <>
                <span className="clockit-auth-eyebrow" style={{ animationDelay: '40ms' }}>
                  Account Recovery
                </span>
                <h1 className="clockit-auth-title" style={{ animationDelay: '90ms' }}>
                  Reset your password
                </h1>
                <p className="clockit-auth-subtitle" style={{ animationDelay: '140ms' }}>
                  Enter your email address and we will send you a secure link to reset your password.
                </p>

                {formError && (
                  <div className="clockit-auth-alert" role="alert" style={{ animationDelay: '180ms' }}>
                    {formError}
                  </div>
                )}

                {forgotSent ? (
                  <div
                    style={{
                      padding: '24px 16px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle2 size={26} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      Recovery link sent
                    </h3>
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      Check your inbox at <strong>{email}</strong> for instructions to reset your password.
                    </p>
                    <button
                      type="button"
                      className="clockit-auth-submit"
                      onClick={() => {
                        setIsForgot(false);
                        setForgotSent(false);
                      }}
                      style={{ marginTop: 8 }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form className="clockit-auth-form" onSubmit={handleForgotSubmit} noValidate>
                    <label className="clockit-field clockit-auth-stagger" style={{ animationDelay: '210ms' }}>
                      <span className="clockit-field-label">Email address</span>
                      <span className={`clockit-input-wrap${errors.email ? ' has-error' : ''}`}>
                        <Mail size={15} className="clockit-input-icon" />
                        <input
                          type="email"
                          className="clockit-input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          autoComplete="email"
                          autoFocus
                          required
                          aria-invalid={Boolean(errors.email)}
                        />
                      </span>
                      {errors.email && <span className="clockit-field-error">{errors.email}</span>}
                    </label>

                    <button
                      type="submit"
                      className="clockit-auth-submit clockit-auth-stagger"
                      style={{ animationDelay: '280ms' }}
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 size={16} className="clockit-auth-spinner" />
                          <span>Sending recovery link…</span>
                        </>
                      ) : (
                        <>
                          <span>Send Recovery Link</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <p
                      className="clockit-auth-alt clockit-auth-stagger"
                      style={{ animationDelay: '340ms', textAlign: 'center' }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgot(false);
                          setFormError(null);
                        }}
                        className="clockit-auth-link"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontFamily: 'inherit',
                        }}
                      >
                        <ArrowLeft size={14} />
                        <span>Back to Sign In</span>
                      </button>
                    </p>
                  </form>
                )}
              </>
            ) : (
              <>
                <span className="clockit-auth-eyebrow" style={{ animationDelay: '40ms' }}>
                  {copy.eyebrow}
                </span>
                <h1 className="clockit-auth-title" style={{ animationDelay: '90ms' }}>
                  {copy.title}
                </h1>
                <p className="clockit-auth-subtitle" style={{ animationDelay: '140ms' }}>
                  {copy.subtitle}
                </p>

                {formError && (
                  <div className="clockit-auth-alert" role="alert" style={{ animationDelay: '180ms' }}>
                    {formError}
                  </div>
                )}

                <form className="clockit-auth-form" onSubmit={handleSubmit} noValidate>
                  {mode === 'signup' && (
                    <label className="clockit-field clockit-auth-stagger" style={{ animationDelay: '210ms' }}>
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

                  <label
                    className="clockit-field clockit-auth-stagger"
                    style={{ animationDelay: mode === 'signup' ? '290ms' : '210ms' }}
                  >
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

                  <label
                    className="clockit-field clockit-auth-stagger"
                    style={{ animationDelay: mode === 'signup' ? '370ms' : '290ms' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="clockit-field-label">Password</span>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgot(true);
                            setFormError(null);
                            setForgotSent(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-mint, #10b981)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <span className={`clockit-input-wrap${errors.password ? ' has-error' : ''}`}>
                      <Lock size={15} className="clockit-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="clockit-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
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
                    {mode === 'signup' && <PasswordStrengthMeter password={password} />}
                    {errors.password && <span className="clockit-field-error">{errors.password}</span>}
                  </label>

                  {mode === 'signup' && (
                    <label className="clockit-field clockit-auth-stagger" style={{ animationDelay: '420ms' }}>
                      <span className="clockit-field-label">Confirm password</span>
                      <span className={`clockit-input-wrap${errors.confirmPassword ? ' has-error' : ''}`}>
                        <Lock size={15} className="clockit-input-icon" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="clockit-input"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat your password"
                          autoComplete="new-password"
                          aria-invalid={Boolean(errors.confirmPassword)}
                        />
                        <button
                          type="button"
                          className="clockit-input-suffix-btn"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </span>
                      {errors.confirmPassword && (
                        <span className="clockit-field-error">{errors.confirmPassword}</span>
                      )}
                    </label>
                  )}

                  <button
                    type="submit"
                    className="clockit-auth-submit clockit-auth-stagger"
                    style={{ animationDelay: mode === 'signup' ? '490ms' : '370ms' }}
                    disabled={isSubmitting}
                  >
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

                {mode === 'login' ? (
                  <button
                    type="button"
                    className="clockit-auth-demo clockit-auth-stagger"
                    style={{ animationDelay: '470ms' }}
                    onClick={handleDemoAccess}
                    disabled={isSubmitting}
                  >
                    Explore Demo Mode (No account required)
                    <code>
                      {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
                    </code>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="clockit-auth-demo clockit-auth-stagger"
                    style={{ animationDelay: '490ms' }}
                    onClick={handleDemoAccess}
                    disabled={isSubmitting}
                  >
                    Want to test first? Explore Read-Only Demo Mode
                  </button>
                )}

                <p
                  className="clockit-auth-alt clockit-auth-stagger"
                  style={{ animationDelay: mode === 'login' ? '530ms' : '530ms' }}
                >
                  {copy.altText}{' '}
                  <Link to={copy.altTo} className="clockit-auth-link">
                    {copy.altLink}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
