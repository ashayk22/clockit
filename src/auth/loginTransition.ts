/**
 * One-shot flag for the ClockIt login-to-dashboard transition.
 *
 * The flag is requested the moment an authentication call succeeds and is
 * consumed exactly once by the dashboard shell when it mounts. Because it
 * lives in memory (not storage) it is:
 *   - only ever set by a real sign-in / sign-up (never by a failed attempt),
 *   - never replayed during in-app navigation (the shell stays mounted),
 *   - never shown on a plain page reload of an existing session.
 */
let pending = false;

/** Called by AuthContext right after a successful sign-in / sign-up. */
export function requestLoginTransition(): void {
  pending = true;
}

/**
 * Read without clearing — safe against React StrictMode's double render, which
 * would otherwise consume the flag on the first pass and drop the animation.
 */
export function isLoginTransitionPending(): boolean {
  return pending;
}

/** Called by the shell once the animation has finished. */
export function clearLoginTransition(): void {
  pending = false;
}
