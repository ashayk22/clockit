import React from 'react';

export type ClockItLogoVariant = 'icon' | 'full';

interface ClockItLogoProps {
  /** `icon` = mark only (favicon, collapsed sidebar). `full` = mark + wordmark. */
  variant?: ClockItLogoVariant;
  /** Pixel size of the mark. The wordmark scales with it. */
  size?: number;
  /** Foreground color for the wordmark. Defaults to currentColor. */
  color?: string;
  className?: string;
}

/**
 * The ClockIt identity mark.
 *
 * A rounded clock bezel in forest green with a single hand pair arranged into a
 * soft check — the "clock that ticks forward" idea. The mark is built from
 * strokes only (no bitmap), so it stays crisp at any size and recolours cleanly
 * against light or dark surfaces.
 *
 * The accent is the app's forest green; the body uses `currentColor` so the
 * wordmark inherits whatever text colour the surrounding element sets.
 */
export const ClockItLogo: React.FC<ClockItLogoProps> = ({
  variant = 'full',
  size = 28,
  color,
  className,
}) => {
  const accent = '#15803d'; // forest green — matches --accent-green

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Clock bezel */}
      <circle cx="16" cy="16" r="13" stroke={accent} strokeWidth="2.25" />
      {/* Four subtle tick marks */}
      <g stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
        <line x1="16" y1="4.5" x2="16" y2="6.5" />
        <line x1="16" y1="25.5" x2="16" y2="27.5" />
        <line x1="4.5" y1="16" x2="6.5" y2="16" />
        <line x1="25.5" y1="16" x2="27.5" y2="16" />
      </g>
      {/* Hour hand — short, neutral */}
      <line
        x1="16"
        y1="16"
        x2="16"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Minute hand — long, forest green, angled to form a checkmark */}
      <line
        x1="16"
        y1="16"
        x2="22.5"
        y2="12"
        stroke={accent}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Center hub */}
      <circle cx="16" cy="16" r="1.6" fill={accent} />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <span className={className} style={{ display: 'inline-flex', color }}>
        {mark}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.28,
        color,
        lineHeight: 1,
      }}
    >
      {mark}
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: size * 0.78,
          letterSpacing: '-0.02em',
          color: 'currentColor',
        }}
      >
        ClockIt
      </span>
    </span>
  );
};

export default ClockItLogo;
