import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';
import { scopedStorageKey } from '../../services/repositories/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
  level?: 'root' | 'route' | 'widget';
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Sanitizes error messages to prevent accidental exposure of tokens,
 * passwords, email addresses, or API keys in error dialogs.
 */
function sanitizeErrorMessage(rawMessage: string): string {
  if (!rawMessage) return 'An unexpected error occurred.';
  return rawMessage
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_TOKEN]')
    .replace(/(?:key|secret|password|token|bearer|apikey)=['"]?[^'"\s]+['"]?/gi, '[REDACTED_CREDENTIAL]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // In production, safe logging without secrets
    console.error('[ClockIt/ErrorBoundary]', error.name, sanitizeErrorMessage(error.message));
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoDashboard = (): void => {
    window.location.href = '/app';
  };

  handleClearCacheAndReload = (): void => {
    try {
      sessionStorage.clear();
      // Remove potentially corrupt transient state but preserve user credentials
      localStorage.removeItem(scopedStorageKey('clockit_active_timer_state'));
      localStorage.removeItem(scopedStorageKey('clockit-tour-active-step'));
    } catch {
      /* ignore */
    }
    window.location.href = '/app';
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { level = 'route', fallbackTitle } = this.props;
    const { error, errorInfo } = this.state;
    const safeMessage = sanitizeErrorMessage(error?.message || '');
    const isDev = Boolean(import.meta.env.DEV);

    if (level === 'root') {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-canvas, #090d16)',
            color: 'var(--text-primary, #f1f5f9)',
            padding: '24px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: 'var(--bg-surface, #131b2e)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h1
              style={{
                fontSize: '22px',
                fontWeight: 600,
                margin: '0 0 10px 0',
                color: 'var(--text-primary, #f1f5f9)',
              }}
            >
              {fallbackTitle || 'ClockIt encountered a problem'}
            </h1>

            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'var(--text-secondary, #94a3b8)',
                margin: '0 0 24px 0',
              }}
            >
              An unexpected application error occurred. Your account and stored data remain safe.
            </p>

            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: 'var(--text-muted, #64748b)',
                textAlign: 'left',
                marginBottom: '24px',
                wordBreak: 'break-word',
              }}
            >
              <strong style={{ color: 'var(--text-secondary, #cbd5e1)' }}>Details: </strong>
              {safeMessage}
            </div>

            {isDev && errorInfo && (
              <details
                style={{
                  textAlign: 'left',
                  fontSize: '11px',
                  color: '#94a3b8',
                  marginBottom: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '10px',
                  borderRadius: '6px',
                  overflowX: 'auto',
                }}
              >
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Development Stack Trace</summary>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {error?.stack}
                  {'\n'}
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-mint, #10b981)',
                  color: '#041d14',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                <RefreshCw size={16} />
                Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary, #f1f5f9)',
                  fontWeight: 500,
                  fontSize: '14px',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={16} />
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Route-level fallback (rendered inside layout without destroying sidebar/header)
    return (
      <div
        role="alert"
        style={{
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '400px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <AlertTriangle size={24} />
        </div>

        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            margin: '0 0 8px 0',
            color: 'var(--text-primary, #f1f5f9)',
          }}
        >
          {fallbackTitle || 'Unable to load this section'}
        </h2>

        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary, #94a3b8)',
            maxWidth: '440px',
            margin: '0 0 20px 0',
            lineHeight: '1.5',
          }}
        >
          A problem occurred while rendering this page. You can try reloading the view or navigate back to your dashboard.
        </p>

        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '12px',
            color: 'var(--text-muted, #64748b)',
            marginBottom: '20px',
            maxWidth: '480px',
            wordBreak: 'break-word',
          }}
        >
          {safeMessage}
        </div>

        {isDev && errorInfo && (
          <details
            style={{
              textAlign: 'left',
              fontSize: '11px',
              color: '#94a3b8',
              marginBottom: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '10px',
              borderRadius: '6px',
              maxWidth: '560px',
              width: '100%',
              overflowX: 'auto',
            }}
          >
            <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Development Stack Trace</summary>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {error?.stack}
              {'\n'}
              {errorInfo.componentStack}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-mint, #10b981)',
              color: '#041d14',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            Try Again
          </button>

          <button
            type="button"
            onClick={this.handleGoDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary, #f1f5f9)',
              fontWeight: 500,
              fontSize: '13px',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
              cursor: 'pointer',
            }}
          >
            <Home size={14} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
}

export const RootErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="root">{children}</ErrorBoundary>
);

export const RouteErrorBoundary: React.FC<{ children: ReactNode; title?: string }> = ({
  children,
  title,
}) => <ErrorBoundary level="route" fallbackTitle={title}>{children}</ErrorBoundary>;
