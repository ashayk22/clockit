/**
 * ClockIt shared motion system.
 *
 * One place for every duration, easing curve and stagger used across the
 * product, so transitions stay consistent and purposeful instead of being
 * reinvented (and drifting) inside each component.
 *
 * Built on GSAP, which the project already depends on — no new animation
 * library was introduced for the dashboard.
 */

/** Named durations in seconds. Kept short: the app must never feel slow. */
export const DUR = {
  instant: 0.12,
  fast: 0.2,
  base: 0.32,
  slow: 0.5,
} as const;

/** Shared easing curves. */
export const EASE = {
  out: 'power2.out',
  inOut: 'power2.inOut',
  soft: 'power3.out',
  spring: 'back.out(1.5)',
} as const;

/** Stagger step sizes for lists and grids. */
export const STAGGER = {
  tight: 0.035,
  base: 0.06,
  loose: 0.09,
} as const;

/** Reusable GSAP "from" states. */
export const FROM = {
  fadeUp: { opacity: 0, y: 12 },
  fadeUpSoft: { opacity: 0, y: 8 },
  fadeIn: { opacity: 0 },
  scaleIn: { opacity: 0, scale: 0.97, transformOrigin: 'center center' },
  slideRight: { opacity: 0, x: 28 },
  slideLeft: { opacity: 0, x: -28 },
} as const;

/** Reusable GSAP "to" states. */
export const TO = {
  settle: { opacity: 1, y: 0, x: 0, scale: 1 },
} as const;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function reducedMotionMediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  return window.matchMedia(REDUCED_MOTION_QUERY);
}
