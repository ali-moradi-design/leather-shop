import type { NextConfig } from 'next';

const API_URL = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');

/**
 * Partial Prerendering via Cache Components (Next.js 16+): a static shell with
 * Suspense holes for per-visitor parts (cart, account, live stock).
 */
const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/s/files/**' }],
  },
  // The browser talks to the API through the same origin, so the API's
  // httpOnly cookies (auth, guest cart) are first-party.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
