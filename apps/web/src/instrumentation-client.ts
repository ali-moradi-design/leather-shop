/**
 * Browser error tracking, only when NEXT_PUBLIC_SENTRY_DSN is set at build time.
 * The SDK is loaded after the page is interactive, so it never delays it.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  const start = () =>
    import('@sentry/browser').then((Sentry) =>
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0,
      }),
    );
  if ('requestIdleCallback' in window) requestIdleCallback(() => void start());
  else setTimeout(() => void start(), 2000);
}
