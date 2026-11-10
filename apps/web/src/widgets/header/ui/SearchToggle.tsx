'use client';

import Form from 'next/form';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { clientApi } from '@/shared/api/client';
import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/money';
import { Icon } from '@/shared/ui';

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  image?: string;
  price: number;
  inStock: boolean;
}

/**
 * Matches for what is typed so far: waits for a pause in typing, cancels the
 * request for older text, and keeps answers for text it has already asked about.
 */
function useSuggestions(q: string) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const cache = useRef(new Map<string, Suggestion[]>());
  const term = q.trim().toLowerCase();
  useEffect(() => {
    if (term.length < 2) return;
    const hit = cache.current.get(term);
    if (hit) {
      setItems(hit);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      clientApi<{ data: Suggestion[] }>(`/products/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then(({ data }) => {
          cache.current.set(term, data);
          setItems(data);
        })
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term]);
  return term.length < 2 ? [] : items;
}

/** Search icon that drops a search bar down from the header. */
export function SearchToggle({ className }: { className?: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(-1);
  const listId = useId();
  const suggestions = useSuggestions(q);
  const showList = open && suggestions.length > 0;
  const close = () => {
    setOpen(false);
    setActive(-1);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      // -1 is the text box itself; past either end wraps around
      setActive((i) => {
        const next = i + step;
        return next >= suggestions.length ? -1 : next < -1 ? suggestions.length - 1 : next;
      });
    } else if (e.key === 'Enter' && active >= 0 && active < suggestions.length) {
      e.preventDefault();
      router.push(`/products/${suggestions[active].slug}`);
      close();
    }
  };
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close search' : 'Search'}
        aria-expanded={open}
        aria-controls="header-search"
        onClick={() => setOpen(!open)}
        className={className}
      >
        <Icon name={open ? 'close' : 'search'} width={22} height={22} />
      </button>
      <div
        id="header-search"
        className={cn(
          'absolute inset-x-0 top-full z-40 border-b border-line bg-white shadow-[0_2px_3px_-3px_#949496]',
          open ? 'block animate-slide-down' : 'hidden',
        )}
      >
        <Form action="/search" role="search" onSubmit={close} className="relative mx-auto flex max-w-[760px] items-center gap-3 px-4 py-5">
          <Icon name="search" width={20} height={20} className="text-mute" />
          <label htmlFor="header-q" className="sr-only">Search products</label>
          <input
            ref={input}
            id="header-q"
            name="q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(-1);
            }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 && active < suggestions.length ? `${listId}-${active}` : undefined}
            autoComplete="off"
            placeholder="Search boots, shoes, bags…"
            className="min-w-0 flex-1 bg-transparent py-1 text-[17px] text-ink outline-none placeholder:text-mute"
          />
          <button type="submit" className="eyebrow text-ink">Search</button>
          <ul
            id={listId}
            role="listbox"
            aria-label="Suggestions"
            className={cn('absolute inset-x-4 top-full z-50 border border-line bg-white shadow-md', !showList && 'hidden')}
          >
            {suggestions.map((s, i) => (
              <li key={s.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <Link
                  href={`/products/${s.slug}`}
                  onClick={close}
                  className={cn('flex items-center gap-3 px-3 py-2 text-[14px] hover:bg-soft', i === active && 'bg-soft')}
                >
                  <span className="relative h-11 w-11 shrink-0 bg-soft">
                    {s.image && <Image src={s.image} alt="" fill sizes="44px" className="object-contain" />}
                  </span>
                  <span className="flex-1 text-ink">{s.title}</span>
                  <span className="text-mute">{s.inStock ? formatMoney(s.price) : 'Sold out'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Form>
      </div>
    </>
  );
}
