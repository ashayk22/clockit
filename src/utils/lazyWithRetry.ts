import React from 'react';

/**
 * Resilient dynamic import wrapper that retries failed chunk fetches
 * (e.g. temporary network dropouts or stale chunk revalidation).
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 800
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      function attempt(remaining: number) {
        factory()
          .then(resolve)
          .catch((error) => {
            if (remaining <= 0) {
              reject(error);
            } else {
              setTimeout(() => attempt(remaining - 1), interval);
            }
          });
      }
      attempt(retries);
    })
  );
}

export default lazyWithRetry;
