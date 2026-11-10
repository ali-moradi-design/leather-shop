import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';

const PRIVATE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|::ffff:(127|10|192\.168|172\.(1[6-9]|2\d|3[01]))\.)/i;

/**
 * The storefront server rendering pages: it calls from the private network and,
 * unlike its /api proxy, adds no X-Forwarded-For. The API is not published to the
 * internet (only the storefront reaches it), so these requests are not visitors;
 * counting them would put every visitor's page views into one bucket.
 */
export function isStorefrontServer(req: Request): boolean {
  if (req.headers['x-forwarded-for']) return false;
  return PRIVATE.test(req.socket.remoteAddress ?? '');
}

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // per visitor, for calls the browser makes itself (cart, search, events); page
  // renders by the storefront are not counted (see isStorefrontServer)
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isStorefrontServer,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10_000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later' },
});

export const securityMiddleware = {
  globalRateLimiter,
  authRateLimiter,
};
