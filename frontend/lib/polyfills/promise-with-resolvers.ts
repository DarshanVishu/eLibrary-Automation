// Polyfill for runtimes where Promise.withResolvers is unavailable
// (e.g., older Node versions used in some CI/deploy build environments).
if (typeof Promise.withResolvers !== 'function') {
  (Promise as any).withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Suppress transient Firefox dev-mode stream reset error ("TypeError: Error in input stream").
// This error only occurs in dev mode when Next.js Turbopack re-compiles a page on-demand
// and resets the internal dev log-forwarding web stream (forward-logs-shared.ts).
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (msg.includes('input stream')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener(
    'error',
    (event) => {
      const msg = event.message || event.error?.message || '';
      if (msg.includes('input stream')) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );
}
