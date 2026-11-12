import React from 'react';
import { ClockItLogo } from '../brand/ClockItLogo';

interface RouteLoadingFallbackProps {
  fullScreen?: boolean;
  message?: string;
}

/**
 * Accessible, flicker-free loading fallback for lazy-loaded route chunks.
 * Uses ClockIt's existing CSS variables and respects prefers-reduced-motion.
 */
export const RouteLoadingFallback: React.FC<RouteLoadingFallbackProps> = ({
  fullScreen = false,
  message = 'Loading view...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: fullScreen ? '100vh' : '420px',
        padding: '32px 16px',
        color: 'var(--text-muted, #94a3b8)',
      }}
    >
      <div
        className="clockit-spin"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
        aria-hidden="true"
      >
        <ClockItLogo variant="icon" size={32} />
      </div>
      <span
        style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          letterSpacing: '0.01em',
          color: 'var(--text-secondary, #64748b)',
        }}
      >
        {message}
      </span>
      {/* Visually hidden text for screen readers */}
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Content is currently loading, please wait.
      </span>
    </div>
  );
};

export default RouteLoadingFallback;
