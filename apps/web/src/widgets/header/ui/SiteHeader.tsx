import Link from 'next/link';
import type { ReactNode } from 'react';

export function SiteHeader({
  modeLabel,
  trailing,
}: {
  modeLabel: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-slate-900">
            Niko Bookshop
          </Link>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            {modeLabel}
          </span>
        </div>
        <nav aria-label="Primary" className="flex items-center gap-4 text-sm text-slate-600">
          <Link href="/" className="hover:text-indigo-700">
            Catalog
          </Link>
          {trailing}
        </nav>
      </div>
    </header>
  );
}
