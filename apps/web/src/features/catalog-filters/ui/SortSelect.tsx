'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { SORTS } from '../model/params';

/** Sort dropdown; writes `?sort=` and keeps the other filters. */
export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-[13px] text-ink">
      <span className="font-semibold uppercase tracking-[1px]">Sort</span>
      <select
        aria-busy={pending}
        className="h-9 cursor-pointer border border-line bg-white pl-2 pr-7 text-[13.5px] outline-none hover:border-ink"
        value={params.get('sort') ?? 'featured'}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === 'featured') next.delete('sort');
          else next.set('sort', e.target.value);
          next.delete('page');
          const qs = next.toString();
          startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
        }}
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </label>
  );
}
