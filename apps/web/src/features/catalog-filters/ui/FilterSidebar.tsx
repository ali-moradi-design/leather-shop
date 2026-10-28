'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition, type ReactNode } from 'react';
import type { ProductFacets } from '@/entities/product/model/types';
import { cn } from '@/shared/lib/cn';
import { Drawer, Icon } from '@/shared/ui';
import type { FilterKey } from '../model/params';

export interface SidebarCollection {
  title: string;
  href: string;
  current: boolean;
  /** Style shortcuts (`?q=`) shown under the current collection. */
  styles?: string[];
}

interface Props {
  facets: ProductFacets;
  collections: SidebarCollection[];
  breadcrumb: { label: string; href?: string }[];
}

const FILTERS: FilterKey[] = ['size', 'width', 'leather', 'color'];

/**
 * Left column of a collection page: breadcrumb, the collection tree and the
 * filter groups. On phones the same panel opens from a "Filter" button.
 * Returns two grid children (button + aside) so the page grid can place them.
 * All state lives in the URL.
 */
export function FilterSidebar({ facets, collections, breadcrumb }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [drawer, setDrawer] = useState(false);
  const closeDrawer = useCallback(() => setDrawer(false), []);

  const set = (key: FilterKey, value?: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const clearAll = () => {
    const next = new URLSearchParams();
    const keep = params.get('sort');
    if (keep) next.set('sort', keep);
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const active = (key: FilterKey) => params.get(key) ?? undefined;
  const activeCount = FILTERS.filter((k) => params.has(k)).length;
  const q = active('q');

  const panel = (
    <div aria-busy={pending} className={cn('transition-opacity', pending && 'opacity-60')}>
      <nav aria-label="Breadcrumb" className="pb-[14px] text-[13px] text-mute">
        {breadcrumb.map((b, i) => (
          <span key={b.label}>
            {i > 0 && <span className="mx-1">›</span>}
            {b.href ? (
              <Link href={b.href} className="underline underline-offset-2 hover:text-ink">{b.label}</Link>
            ) : (
              <span aria-current="page">{b.label}</span>
            )}
          </span>
        ))}
      </nav>

      <Section title="Collection">
        <ul className="text-[13.5px]">
          {collections.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                aria-current={c.current && !q ? 'page' : undefined}
                className={cn('flex items-center justify-between py-[7px] text-ink hover:underline', c.current && 'font-semibold')}
              >
                {c.title}
                <Icon name={c.current ? 'minus' : 'plus'} width={13} height={13} className="text-mute" />
              </Link>
              {c.current && (
                <ul className="mb-2">
                  <SubLink href={c.href} on={!q}>All Styles</SubLink>
                  {c.styles?.map((s) => (
                    <SubLink key={s} href={`${c.href}?q=${encodeURIComponent(s)}`} on={q === s}>{s}</SubLink>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Filters"
        action={
          activeCount > 0 || q ? (
            <button type="button" onClick={clearAll} className="text-[12px] normal-case tracking-normal text-mute underline">
              Clear all
            </button>
          ) : null
        }
      >
        <FilterGroup label="Size" value={active('size')}>
          <div className="grid grid-cols-5 gap-1 pb-3">
            {facets.sizes.map(({ value }) => (
              <button
                key={value}
                type="button"
                aria-pressed={active('size') === value}
                onClick={() => set('size', active('size') === value ? undefined : value)}
                className={cn(
                  'h-9 border text-[12.5px] text-ink',
                  active('size') === value ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink',
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </FilterGroup>
        {facets.widths.length > 1 && (
          <FilterGroup label="Width" value={active('width')}>
            <OptionList options={facets.widths} value={active('width')} onSelect={(v) => set('width', v)} />
          </FilterGroup>
        )}
        <FilterGroup label="Leather" value={active('leather')}>
          <OptionList options={facets.leathers} value={active('leather')} onSelect={(v) => set('leather', v)} />
        </FilterGroup>
        <FilterGroup label="Color" value={active('color')}>
          <OptionList options={facets.colors} value={active('color')} onSelect={(v) => set('color', v)} />
        </FilterGroup>
      </Section>
    </div>
  );

  return (
    <>
      <div className="sticky top-[var(--header-h)] z-30 order-2 -mx-4 flex items-center justify-between border-b border-line bg-white px-4 py-2.5 sm:-mx-6 sm:px-6 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[1.5px] text-ink"
        >
          <Icon name="filter" width={18} height={18} />
          Filter{activeCount > 0 && ` (${activeCount})`}
        </button>
        {pending && <span className="text-[12px] text-mute">Updating…</span>}
      </div>
      <Drawer open={drawer} onClose={closeDrawer} label="Filters">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="text-[13px] font-semibold uppercase tracking-[1.5px] text-ink">Filter</p>
          <button type="button" aria-label="Close filters" onClick={closeDrawer}>
            <Icon name="close" width={22} height={22} />
          </button>
        </div>
        <div className="flex-1 px-5 py-4">{panel}</div>
        <div className="sticky bottom-0 border-t border-line bg-white p-4">
          <button type="button" onClick={closeDrawer} className="btn w-full">View results</button>
        </div>
      </Drawer>

      <aside
        aria-label="Collection and filters"
        className="hidden lg:sticky lg:top-[calc(var(--header-h)+18px)] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:block lg:max-h-[calc(100svh-var(--header-h)-36px)] lg:self-start lg:overflow-y-auto lg:pr-1 no-scrollbar"
      >
        {panel}
      </aside>
    </>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-t border-line py-[14px]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center justify-between py-1 text-[13px] font-semibold uppercase tracking-[1px] text-ink"
        >
          {title}
          <Icon name="chevron" width={14} height={14} className={cn('mr-1 transition-transform', open && 'rotate-180')} />
        </button>
        {action && <span className="ml-3">{action}</span>}
      </div>
      {open && <div className="mt-2">{children}</div>}
    </section>
  );
}

function FilterGroup({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <details className="group border-b border-line last:border-b-0" open={Boolean(value)}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-[10px] text-[13.5px] text-ink">
        <span>
          {label}
          {value && <span className="ml-1.5 text-mute">· {value}</span>}
        </span>
        <Icon name="plus" width={13} height={13} className="text-mute group-open:hidden" />
        <Icon name="minus" width={13} height={13} className="hidden text-mute group-open:block" />
      </summary>
      {children}
    </details>
  );
}

function OptionList({
  options,
  value,
  onSelect,
}: {
  options: { value: string; count: number }[];
  value?: string;
  onSelect: (value?: string) => void;
}) {
  return (
    <ul className="max-h-64 overflow-y-auto pb-3">
      {options.map((o) => (
        <li key={o.value}>
          <button
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onSelect(o.value === value ? undefined : o.value)}
            className={cn(
              'flex w-full items-center justify-between py-[5px] pl-2 pr-1 text-left text-[13.5px] hover:bg-soft',
              o.value === value ? 'bg-soft font-semibold text-ink' : 'text-body',
            )}
          >
            <span>{o.value}</span>
            <span className="text-[12px] text-mute">{o.count}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SubLink({ href, on, children }: { href: string; on: boolean; children: ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={on ? 'page' : undefined}
        className={cn('block px-2 py-[6px] text-[13.5px] text-body hover:text-ink', on && 'bg-soft text-ink')}
      >
        {children}
      </Link>
    </li>
  );
}
