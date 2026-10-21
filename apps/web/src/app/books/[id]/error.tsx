'use client';

import Link from 'next/link';
import { ErrorPanel } from '@/shared/ui';

export default function BookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <ErrorPanel title="Could not load this book" message={error.message} />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Catalog
        </Link>
      </div>
    </div>
  );
}
