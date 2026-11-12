import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { ClockItLogo } from '../components/brand/ClockItLogo';
import { PasswordStrengthMeter, validatePasswordInput } from './passwordSecurity';
import { toast } from '../components/ui/NotificationToast';
import { supabase } from '../lib/supabaseClient';
import '../styles/auth.css';

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);

  // Check URL hash for error or expired recovery link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const errorDesc = params.get('error_description') || 'This password reset link is invalid or has expired.';
      setErrorMessage(errorDesc.replace(/\+/g, ' '));
      setIsInvalidToken(true);
      return;
    }

    // Verify recovery session availability
    if (supabase) {
      void supabase.auth.getSession().then(({ data }) => {
        if (!data.session && !hash.includes('access_token')) {
          // If no active session and no access token in hash, link might be expired/direct visit
          setIsInvalidToken(true);
          setErrorMessage('No active password reset request found. Please request a new recovery link.');
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validation = validatePasswordInput(password, confirmPassword);
    if (!validation.isValid) {
      setErrorMessage(validation.passwordError || validation.confirmError || 'Please provide a valid password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updatePassword(password);
      setIsSuccess(true);
      toast('Your password has been reset successfully. Please sign in.', {
        kind: 'success',
        duration: 5000,
      });

      // Sign out temporary recovery session and redirect to login
      await signOut();
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not reset password. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="clockit-auth-shell">
      {/* Brand Panel */}
      <aside className="clockit-auth-panel">
        <Link to="/" className="clockit-auth-brand" aria-label="Back to ClockIt home">
          <ClockItLogo variant="full" size={26} />
        </Link>
        <div className="clockit-auth-quote">
          <p className="clockit-auth-quote-text">
            &ldquo;Security and privacy are foundational. You own your time, your data, and your identity.&rdquo;
          </p>
          <span className="clockit-auth-quote-author">ClockIt Security Architecture</span>
        </div>
      </aside>

      {/* Main Container */}
      <main className="clockit-auth-main">
        <header className="clockit-auth-topbar">
          <button
            type="button"
            className="clockit-auth-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        <div className="clockit-auth-body">
          <div className="clockit-auth-header">
            <h1 className="clockit-auth-title">Set new password</h1>
            <p className="clockit-auth-sub">
              {isSuccess
                ? 'Your password was successfully updated.'
                : 'Create a new, strong password to protect your ClockIt workspace.'}
            </p>
          </div>

          {errorMessage && (
            <div className="clockit-auth-error-banner" role="alert">
              <AlertCircle size={16} className="clockit-auth-error-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={30} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Password Updated!</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, margin: 0 }}>
                Your account password has been changed. Redirecting you to the sign-in screen...
              </p>
              <Link to="/login" className="clockit-auth-submit" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Sign In Now
              </Link>
            </div>
          ) : isInvalidToken ? (
            <div
              style={{
                padding: '24px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Recovery links expire after a short period or become invalid after single use. You can request a fresh recovery link below.
              </p>
              <Link
                to="/login"
                className="clockit-auth-submit"
                style={{
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <ArrowLeft size={16} />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="clockit-auth-form" noValidate>
              <label className="clockit-field">
                <span className="clockit-field-label">New password</span>
                <span className="clockit-input-wrap">
                  <Lock size={15} className="clockit-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="clockit-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    className="clockit-input-suffix-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </span>
                <PasswordStrengthMeter password={password} />
              </label>

              <label className="clockit-field">
                <span className="clockit-field-label">Confirm new password</span>
                <span className="clockit-input-wrap">
                  <Lock size={15} className="clockit-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="clockit-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="clockit-input-suffix-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </span>
              </label>

              <button type="submit" className="clockit-auth-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="clockit-auth-submit-loading">
                    <span className="clockit-auth-spinner" />
                    <span>Updating password...</span>
                  </span>
                ) : (
                  <span>Update Password</span>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Link
                  to="/login"
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
