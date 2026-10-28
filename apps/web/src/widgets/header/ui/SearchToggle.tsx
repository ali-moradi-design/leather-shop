'use client';

import Form from 'next/form';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui';

/** Search icon that drops a search bar down from the header. */
export function SearchToggle({ className }: { className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
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
        <Form action="/search" role="search" onSubmit={() => setOpen(false)} className="mx-auto flex max-w-[760px] items-center gap-3 px-4 py-5">
          <Icon name="search" width={20} height={20} className="text-mute" />
          <label htmlFor="header-q" className="sr-only">Search products</label>
          <input
            ref={input}
            id="header-q"
            name="q"
            placeholder="Search boots, shoes, bags…"
            className="min-w-0 flex-1 bg-transparent py-1 text-[17px] text-ink outline-none placeholder:text-mute"
          />
          <button type="submit" className="eyebrow text-ink">Search</button>
        </Form>
      </div>
    </>
  );
}
