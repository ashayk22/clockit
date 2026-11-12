import React from 'react';

/**
 * Built-in SVG cover illustrations for workspaces.
 *
 * Each scene is drawn in the cream / forest-green identity and uses only
 * `currentColor`-friendly fills where possible so a dark theme can tint them.
 * Covers are decorative (aria-hidden) and are sized to a 16:5 banner viewBox.
 */

export interface WorkspaceCoverProps {
  /** Illustration key, e.g. "college". Unknown keys render the fallback. */
  cover?: string;
  className?: string;
}

/** Resolve a cover key to its component; unknown keys return the fallback. */
export function getWorkspaceCover(cover?: string): React.FC<{ className?: string }> {
  switch (cover) {
    case 'personal':
      return PersonalCover;
    case 'college':
      return CollegeCover;
    case 'club':
      return ClubCover;
    case 'freelance':
      return FreelanceCover;
    case 'development':
      return DevelopmentCover;
    default:
      return GenericCover;
  }
}

export const WorkspaceCover: React.FC<WorkspaceCoverProps> = ({ cover, className }) => {
  const Cover = getWorkspaceCover(cover);
  return <Cover className={className} />;
};

/* ---------------------------------------------------------------- Personal */

const PersonalCover: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 640 200"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="pc-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f6efe4" />
        <stop offset="100%" stopColor="#e8ddcc" />
      </linearGradient>
      <linearGradient id="pc-desk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d9c9b4" />
        <stop offset="100%" stopColor="#bfa98e" />
      </linearGradient>
    </defs>
    <rect width="640" height="200" fill="url(#pc-sky)" />
    {/* Window light */}
    <rect x="40" y="20" width="180" height="130" rx="8" fill="#fbf7f0" opacity="0.7" />
    <line x1="130" y1="20" x2="130" y2="150" stroke="#e2d6c3" strokeWidth="3" />
    <line x1="40" y1="85" x2="220" y2="85" stroke="#e2d6c3" strokeWidth="3" />
    {/* Plant */}
    <path d="M260,150 q-22,-36 0,-64 q22,28 0,64 Z" fill="#6b8f5e" />
    <path d="M250,142 q-16,-26 0,-46" fill="none" stroke="#557a4a" strokeWidth="3" />
    <path d="M270,142 q16,-26 0,-46" fill="none" stroke="#557a4a" strokeWidth="3" />
    <rect x="252" y="148" width="16" height="14" rx="3" fill="#8a6b52" />
    {/* Mug */}
    <rect x="330" y="130" width="28" height="32" rx="4" fill="#f3ede3" stroke="#c9b9a3" strokeWidth="2" />
    <path d="M358,138 q14,0 14,12 q0,12 -14,12" fill="none" stroke="#c9b9a3" strokeWidth="3" />
    <path d="M338,124 q4,-10 8,0 q4,10 8,0" fill="#d8c8bb" opacity="0.7" />
    {/* Books */}
    <rect x="410" y="140" width="50" height="22" rx="2" fill="#244b36" />
    <rect x="410" y="128" width="42" height="14" rx="2" fill="#15803d" />
    {/* Desk */}
    <rect x="0" y="162" width="640" height="38" fill="url(#pc-desk)" />
    <line x1="0" y1="162" x2="640" y2="162" stroke="#a89376" strokeWidth="2" />
  </svg>
);

/* ------------------------------------------------------------------ College */

const CollegeCover: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 640 200"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="cc-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f6efe4" />
        <stop offset="100%" stopColor="#e8ddcc" />
      </linearGradient>
      <linearGradient id="cc-roof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#b25c3a" />
        <stop offset="100%" stopColor="#8f4527" />
      </linearGradient>
      <linearGradient id="cc-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e8ddcc" />
        <stop offset="100%" stopColor="#d6c7b0" />
      </linearGradient>
    </defs>
    <rect width="640" height="200" fill="url(#cc-sky)" />
    {/* Sun */}
    <circle cx="540" cy="55" r="26" fill="#f4b98a" opacity="0.85" />
    {/* Trees */}
    <g fill="#6b8f5e">
      <circle cx="70" cy="150" r="22" />
      <circle cx="95" cy="142" r="18" />
    </g>
    <g fill="#557a4a">
      <circle cx="560" cy="152" r="24" />
      <circle cx="585" cy="144" r="18" />
    </g>
    {/* Main building */}
    <rect x="200" y="90" width="240" height="90" rx="4" fill="url(#cc-wall)" />
    <path d="M190,90 L320,40 L450,90 Z" fill="url(#cc-roof)" />
    {/* Clock tower */}
    <rect x="295" y="30" width="50" height="70" fill="url(#cc-wall)" />
    <path d="M290,32 L320,8 L350,32 Z" fill="url(#cc-roof)" />
    <circle cx="320" cy="58" r="14" fill="#fbf7f0" stroke="#8a6b52" strokeWidth="2" />
    <line x1="320" y1="58" x2="320" y2="48" stroke="#244b36" strokeWidth="2" />
    <line x1="320" y1="58" x2="328" y2="60" stroke="#244b36" strokeWidth="2" />
    {/* Windows */}
    <g fill="#fbf7f0" stroke="#c9b9a3" strokeWidth="1.5">
      <rect x="225" y="112" width="22" height="30" rx="2" />
      <rect x="265" y="112" width="22" height="30" rx="2" />
      <rect x="360" y="112" width="22" height="30" rx="2" />
      <rect x="400" y="112" width="22" height="30" rx="2" />
    </g>
    {/* Door */}
    <rect x="305" y="140" width="30" height="40" rx="3" fill="#8a6b52" />
    {/* Ground */}
    <rect x="0" y="180" width="640" height="20" fill="#c9b99c" />
  </svg>
);

/* --------------------------------------------------------------------- Club */

const ClubCover: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 640 200"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="lc-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f6efe4" />
        <stop offset="100%" stopColor="#e8ddcc" />
      </linearGradient>
    </defs>
    <rect width="640" height="200" fill="url(#lc-bg)" />
    {/* Banner / stage */}
    <rect x="120" y="60" width="400" height="90" rx="8" fill="#244b36" />
    <rect x="120" y="60" width="400" height="12" rx="6" fill="#15803d" />
    {/* Spotlight cones */}
    <path d="M220,60 L180,150 L260,150 Z" fill="#fbf7f0" opacity="0.18" />
    <path d="M420,60 L380,150 L460,150 Z" fill="#fbf7f0" opacity="0.18" />
    {/* People silhouettes */}
    <g fill="#1b3d2b">
      <circle cx="200" cy="120" r="9" />
      <path d="M186,150 q14,-22 28,0 Z" />
      <circle cx="250" cy="122" r="9" />
      <path d="M236,152 q14,-22 28,0 Z" />
      <circle cx="390" cy="122" r="9" />
      <path d="M376,152 q14,-22 28,0 Z" />
      <circle cx="440" cy="120" r="9" />
      <path d="M426,150 q14,-22 28,0 Z" />
    </g>
    {/* Confetti dots */}
    <g>
      <circle cx="160" cy="40" r="4" fill="#a855f7" />
      <circle cx="300" cy="30" r="3" fill="#f97316" />
      <circle cx="480" cy="36" r="4" fill="#34d399" />
      <circle cx="540" cy="60" r="3" fill="#3b82f6" />
    </g>
    {/* Floor */}
    <rect x="0" y="150" width="640" height="50" fill="#d9c9b4" />
    <line x1="0" y1="150" x2="640" y2="150" stroke="#bfa98e" strokeWidth="2" />
  </svg>
);

/* ---------------------------------------------------------------- Freelance */

const FreelanceCover: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 640 200"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="fc-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f6efe4" />
        <stop offset="100%" stopColor="#e8ddcc" />
      </linearGradient>
    </defs>
    <rect width="640" height="200" fill="url(#fc-bg)" />
    {/* Laptop */}
    <rect x="200" y="70" width="240" height="150" rx="10" fill="#244b36" />
    <rect x="214" y="84" width="212" height="122" rx="4" fill="#fbf7f0" />
    {/* Screen content: chart bars */}
    <g fill="#34d399">
      <rect x="232" y="160" width="18" height="36" rx="2" />
      <rect x="262" y="140" width="18" height="56" rx="2" />
      <rect x="292" y="152" width="18" height="44" rx="2" />
      <rect x="322" y="128" width="18" height="68" rx="2" />
    </g>
    {/* Trend line */}
    <path d="M360,170 L380,150 L400,156 L420,120" fill="none" stroke="#15803d" strokeWidth="3" />
    {/* Camera */}
    <rect x="60" y="110" width="70" height="44" rx="6" fill="#3a3a3a" />
    <circle cx="95" cy="132" r="16" fill="#1b1b1b" />
    <circle cx="95" cy="132" r="9" fill="#34d399" opacity="0.4" />
    <rect x="120" y="116" width="10" height="8" rx="1" fill="#3a3a3a" />
    {/* Plant */}
    <path d="M540,150 q-18,-30 0,-56 q18,26 0,56 Z" fill="#6b8f5e" />
    <rect x="532" y="148" width="16" height="14" rx="3" fill="#8a6b52" />
    {/* Desk */}
    <rect x="0" y="162" width="640" height="38" fill="#d9c9b4" />
    <line x1="0" y1="162" x2="640" y2="162" stroke="#bfa98e" strokeWidth="2" />
  </svg>
);

/* ------------------------------------------------------------- Development */

const DevelopmentCover: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 640 200"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="dc-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1b2a22" />
        <stop offset="100%" stopColor="#0f1a14" />
      </linearGradient>
    </defs>
    <rect width="640" height="200" fill="url(#dc-bg)" />
    {/* Code window */}
    <rect x="80" y="30" width="480" height="150" rx="10" fill="#244b36" />
    <rect x="80" y="30" width="480" height="22" rx="10" fill="#1b3d2b" />
    <circle cx="100" cy="41" r="5" fill="#ef4444" />
    <circle cx="116" cy="41" r="5" fill="#f59e0b" />
    <circle cx="132" cy="41" r="5" fill="#22c55e" />
    {/* Code lines */}
    <g fontFamily="monospace" fontSize="12">
      <text x="100" y="72" fill="#a7f3d0">const workspace = {'{'}</text>
      <text x="118" y="90" fill="#fde7d3">name:</text>
      <text x="170" y="90" fill="#34d399">'Development'</text>
      <text x="270" y="90" fill="#e8ddcc">,</text>
      <text x="118" y="108" fill="#fde7d3">focus:</text>
      <text x="170" y="108" fill="#34d399">true</text>
      <text x="118" y="126" fill="#fde7d3">tasks:</text>
      <text x="170" y="126" fill="#e8ddcc">[...]</text>
      <text x="100" y="144" fill="#a7f3d0">{'}'};</text>
      <text x="260" y="126" fill="#6b8f5e">// build momentum</text>
    </g>
    {/* Glow */}
    <circle cx="560" cy="60" r="40" fill="#34d399" opacity="0.12" />
  </svg>
);

/* --------------------------------------------------------------- Fallback */

const GenericCover: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 640 200"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="gc-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f6efe4" />
        <stop offset="100%" stopColor="#e8ddcc" />
      </linearGradient>
    </defs>
    <rect width="640" height="200" fill="url(#gc-bg)" />
    {/* Rolling hills */}
    <path d="M0,200 L0,140 Q160,100 320,130 Q480,160 640,120 L640,200 Z" fill="#c9d6bd" />
    <path d="M0,200 L0,160 Q160,130 320,150 Q480,170 640,145 L640,200 Z" fill="#a8bd9a" />
    {/* Trees */}
    <g fill="#557a4a">
      <circle cx="120" cy="150" r="18" />
      <circle cx="500" cy="148" r="20" />
    </g>
  </svg>
);

export default WorkspaceCover;
