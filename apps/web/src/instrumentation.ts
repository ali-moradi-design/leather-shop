import type { Instrumentation } from 'next';

/**
 * Server error tracking with Sentry, only when SENTRY_DSN is set; without it the
 * SDK is never loaded. @sentry/node, not @sentry/nextjs: the latter, bundled
 * here, broke prerendering of /_global-error about half the time.
 */
export async function register() {
  if (!process.env.SENTRY_DSN || process.env.NEXT_RUNTIME !== 'nodejs') return;
  const Sentry = await import('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!process.env.SENTRY_DSN || process.env.NEXT_RUNTIME !== 'nodejs') return;
  const Sentry = await import('@sentry/node');
  Sentry.captureException(error, {
    extra: { path: request.path, method: request.method, routePath: context.routePath, routeType: context.routeType },
  });
};
