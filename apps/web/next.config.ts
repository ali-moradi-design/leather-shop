import type { NextConfig } from 'next';

/**
 * Partial Prerendering via Cache Components (Next.js 16+).
 * Static shell + Suspense holes for dynamic parts.
 * See: https://nextjs.org/docs/app/getting-started/partial-prerendering
 */
const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
