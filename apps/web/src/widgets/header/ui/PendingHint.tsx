'use client';

import { useLinkStatus } from 'next/link';

/**
 * Thin bar under a nav link while its route loads (Next.js `useLinkStatus`).
 * Always rendered and only its opacity changes, so it never shifts layout.
 * Must sit inside a `<Link>` with `position: relative`.
 */
export function PendingHint() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 -bottom-1 h-px origin-left bg-current transition-opacity duration-200 ${
        pending ? 'animate-pulse opacity-100' : 'opacity-0'
      }`}
    />
  );
}
