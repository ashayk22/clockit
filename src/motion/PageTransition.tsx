import React, { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { DUR, EASE, STAGGER } from './presets';
import { useReducedMotion } from './useReducedMotion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Route-aware page transition.
 *
 * Animates once per navigation (keyed on pathname) — never on unrelated state
 * updates — and staggers the page's top-level sections so widgets feel like
 * they settle in rather than snap into place.
 *
 * Only transform/opacity are animated and all inline styles are cleared
 * afterwards, so the shared layout (sidebar / header) never shifts.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  const { pathname } = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (reducedMotion) {
      gsap.set(root, { clearProps: 'opacity,transform' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: DUR.base, ease: EASE.out, clearProps: 'opacity,transform' },
      );

      const container = root.querySelector('.clockit-page-container, .clockit-home-container');
      if (container) {
        const sections = Array.from(container.children).slice(0, 8);
        if (sections.length) {
          gsap.fromTo(
            sections,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: DUR.base,
              ease: EASE.soft,
              stagger: STAGGER.base,
              delay: 0.04,
              clearProps: 'opacity,transform',
            },
          );
        }
      }
    }, root);

    return () => ctx.revert();
  }, [pathname, reducedMotion]);

  return (
    <div ref={rootRef} className={className} data-page-transition>
      {children}
    </div>
  );
};
