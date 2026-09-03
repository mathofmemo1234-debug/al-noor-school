import { lazy } from 'react';

/**
 * Enhanced lazy import that automatically retries and reloads the page
 * when a dynamic import fails due to a new deployment or network hiccup.
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const isAlreadyForceRefreshed = sessionStorage.getItem('chunk_force_refreshed') === 'true';

    try {
      const module = await componentImport();
      sessionStorage.removeItem('chunk_force_refreshed');
      return module;
    } catch (error) {
      console.warn('Dynamic chunk load failed, attempting retry/refresh...', error);

      // Try once more after a brief delay
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const module = await componentImport();
        sessionStorage.removeItem('chunk_force_refreshed');
        return module;
      } catch (retryError) {
        // If retrying dynamic import fails, force reload the page once
        if (!isAlreadyForceRefreshed) {
          sessionStorage.setItem('chunk_force_refreshed', 'true');
          window.location.reload();
          return new Promise(() => {});
        }

        // If we already reloaded and still failed, clear flag and throw
        sessionStorage.removeItem('chunk_force_refreshed');
        throw retryError;
      }
    }
  });
}
