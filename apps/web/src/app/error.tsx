'use client';

import Link from 'next/link';

/** Route error boundary. `retry()` re-fetches and re-renders the failed segment. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="container-page py-28 text-center">
      <p className="eyebrow text-mute">Error</p>
      <h1 className="heading mt-3 text-[32px]">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-mute">
        We couldn’t load this page. Please try again in a moment.
        {error.digest && <span className="mt-2 block text-[12px]">Reference: {error.digest}</span>}
      </p>
      <div className="mt-8 flex justify-center gap-2">
        <button type="button" onClick={() => retry()} className="btn">
          Try again
        </button>
        <Link href="/" className="btn btn-outline">Back to the shop</Link>
      </div>
    </div>
  );
}
