import Script from 'next/script';

/**
 * Privacy-friendly visit statistics (Plausible, or a self-hosted Plausible-compatible
 * server such as Umami's tracker), only when NEXT_PUBLIC_ANALYTICS_DOMAIN is set.
 * No cookies, so no consent banner is needed.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
  if (!domain) return null;
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT ?? 'https://plausible.io/js/script.js';
  return <Script src={src} data-domain={domain} strategy="afterInteractive" />;
}
