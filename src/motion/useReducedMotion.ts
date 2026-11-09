import { useEffect, useState } from 'react';
import { prefersReducedMotion, reducedMotionMediaQuery } from './presets';

/**
 * Reactive `prefers-reduced-motion` hook. Every animated surface consults this
 * so motion is opt-out for users who ask for it.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    const mql = reducedMotionMediaQuery();
    if (!mql) return;
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    setReduced(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
