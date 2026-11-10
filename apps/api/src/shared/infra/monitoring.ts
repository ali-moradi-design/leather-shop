import { env } from '../config/env';

type Capture = (err: unknown, context?: Record<string, unknown>) => void;

let capture: Capture = () => {};

/**
 * Sentry error tracking, only when SENTRY_DSN is set. Loaded lazily so the API
 * starts as before without it.
 */
export async function initMonitoring(): Promise<void> {
  if (!env.SENTRY_DSN) return;
  const Sentry = await import('@sentry/node');
  Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV, tracesSampleRate: 0 });
  capture = (err, context) => Sentry.captureException(err, context ? { extra: context } : undefined);
}

/** Reports an unexpected error (no-op without Sentry). */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  capture(err, context);
}
