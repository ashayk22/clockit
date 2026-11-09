import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from './useReducedMotion';

interface LoginTransitionProps {
  /** Fired once the animation has fully finished (or immediately if reduced). */
  onComplete: () => void;
}

/**
 * The ClockIt signature "identity opens the app" transition.
 *
 * Sequence (all driven by one GSAP timeline on the existing dependency):
 *   1. the ClockIt clock mark fades + scales in, centred
 *   2. the dial resolves — bezel ticks stagger in, hands settle into place
 *   3. the hands sweep and the face expands outward
 *   4. the clock zooms through and dissolves, revealing the live dashboard
 *
 * The overlay is opaque from the very first paint, so the dashboard can mount
 * underneath without ever flashing. Reduced-motion users get a single short
 * cross-fade instead.
 */
export const LoginTransition: React.FC<LoginTransitionProps> = ({ onComplete }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.setTimeout(onComplete, 0);
    };

    const ctx = gsap.context(() => {
      const clock = root.querySelector('.clockit-lt-clock');
      const wordmark = root.querySelector('.clockit-lt-wordmark');
      const ticks = root.querySelectorAll('.clockit-lt-tick');
      const hands = root.querySelectorAll('.clockit-lt-hand');

      if (reducedMotion) {
        gsap.set([clock, wordmark], { opacity: 1 });
        gsap
          .timeline({ onComplete: finish })
          .to(root, { opacity: 0, duration: 0.3, delay: 0.4, ease: 'power1.out' });
        return;
      }

      const tl = gsap.timeline({ onComplete: finish });
      tl.set(root, { opacity: 1 })
        // 1 — the mark arrives
        .fromTo(
          clock,
          { opacity: 0, scale: 0.72, transformOrigin: '50% 50%' },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' },
        )
        .fromTo(wordmark, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.24')
        // 2 — the clock motif resolves
        .fromTo(ticks, { opacity: 0 }, { opacity: 1, duration: 0.36, stagger: 0.012, ease: 'power1.out' }, '-=0.28')
        // 3 — hands sweep into place, then the face expands through the screen
        .fromTo(
          hands,
          { rotation: -110, transformOrigin: '50% 50%' },
          { rotation: 0, duration: 0.95, ease: 'power3.inOut' },
          '-=0.2',
        )
        .to(wordmark, { opacity: 0, duration: 0.28, ease: 'power1.in' }, '+=0.12')
        .to(clock, { scale: 8, opacity: 0, duration: 0.8, ease: 'power2.in' }, '-=0.05')
        // 4 — reveal the real dashboard
        .to(root, { opacity: 0, duration: 0.45, ease: 'power1.out' }, '-=0.42');
    }, root);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion, onComplete]);

  return (
    <div ref={rootRef} className="clockit-login-transition" role="presentation" aria-hidden="true">
      <div className="clockit-login-transition-inner">
        <svg className="clockit-lt-clock" width="200" height="200" viewBox="0 0 200 200">
          <circle className="clockit-lt-bezel" cx="100" cy="100" r="84" fill="none" stroke="var(--border-strong)" strokeWidth="2" opacity="0.6" />
          <circle cx="100" cy="100" r="72" fill="var(--bg-surface)" />
          <g className="clockit-lt-ticks" fill="none">
            {Array.from({ length: 12 }).map((_, index) => {
              const angle = (index * 30 - 90) * (Math.PI / 180);
              const isQuarter = index % 3 === 0;
              const inner = isQuarter ? 60 : 65;
              return (
                <line
                  key={index}
                  className="clockit-lt-tick"
                  x1={100 + inner * Math.cos(angle)}
                  y1={100 + inner * Math.sin(angle)}
                  x2={100 + 74 * Math.cos(angle)}
                  y2={100 + 74 * Math.sin(angle)}
                  stroke="var(--text-muted)"
                  strokeWidth={isQuarter ? 3 : 1.5}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
          <g className="clockit-lt-hand" style={{ transformBox: 'view-box', transformOrigin: '100px 100px' }}>
            <line x1="100" y1="100" x2="100" y2="58" stroke="var(--text-primary)" strokeWidth="5.5" strokeLinecap="round" />
          </g>
          <g className="clockit-lt-hand" style={{ transformBox: 'view-box', transformOrigin: '100px 100px' }}>
            <line x1="100" y1="100" x2="100" y2="40" stroke="var(--accent-mint)" strokeWidth="3.5" strokeLinecap="round" />
          </g>
          <circle className="clockit-lt-hub" cx="100" cy="100" r="5" fill="var(--accent-mint)" />
        </svg>
        <div className="clockit-lt-wordmark">ClockIt</div>
      </div>
    </div>
  );
};

export default LoginTransition;
