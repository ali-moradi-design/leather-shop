'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { MegaMenu, NavLink } from '@/shared/config';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui';
import { PendingHint } from './PendingHint';

const OPEN_DELAY = 90;
const CLOSE_DELAY = 160;

/**
 * Desktop navigation: MEN / WOMEN open a full-width mega panel under the header
 * on hover, click or keyboard; ABOUT is a plain link. Every link is in the HTML
 * (good for crawlers) and the closed panels are `invisible`, so they are not
 * focusable.
 */
export function MegaNav({ menus, links }: { menus: MegaMenu[]; links: NavLink[] }) {
  // Which panel is open. Panels close on link click, Escape or mouse leave
  // (no usePathname: the header is part of the prerendered shell).
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  const schedule = (next: string | null, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), delay);
  };
  // set right away and drop any hover change still waiting
  const setNow = (next: string | null) => {
    clearTimeout(timer.current);
    setOpen(next);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      buttons.current[open]?.focus();
      clearTimeout(timer.current);
      setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <nav aria-label="Main" className="hidden h-full items-stretch lg:flex" onMouseLeave={() => schedule(null, CLOSE_DELAY)}>
      <ul className="flex h-full items-stretch">
        {menus.map((menu) => {
          const isOpen = open === menu.label;
          const panelId = `mega-${menu.label.toLowerCase()}`;
          return (
            <li key={menu.label} className="flex" onMouseEnter={() => schedule(menu.label, open ? 0 : OPEN_DELAY)}>
              <button
                ref={(el) => { buttons.current[menu.label] = el; }}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setNow(isOpen ? null : menu.label)}
                className={cn(
                  'relative flex items-center gap-1 px-2.5 text-[13px] font-medium uppercase tracking-[1.04px] text-black',
                  'after:absolute after:inset-x-2.5 after:bottom-0 after:h-px after:bg-black after:transition-opacity',
                  isOpen ? 'text-mute after:opacity-100' : 'after:opacity-0',
                )}
              >
                {menu.label}
                <Icon name="chevron" width={11} height={11} className={cn('transition-transform', isOpen && 'rotate-180')} />
              </button>
              <MegaPanel id={panelId} menu={menu} open={isOpen} onEnter={() => schedule(menu.label, 0)} onNavigate={() => setNow(null)} />
            </li>
          );
        })}
        {links.map((l) => (
          <li key={l.href} className="flex" onMouseEnter={() => schedule(null, CLOSE_DELAY)}>
            <Link href={l.href} className="relative flex items-center px-2.5 text-[13px] font-medium uppercase tracking-[1.04px] text-black hover:text-mute">
              {l.label}
              <PendingHint />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MegaPanel({ id, menu, open, onEnter, onNavigate }: { id: string; menu: MegaMenu; open: boolean; onEnter: () => void; onNavigate: () => void }) {
  return (
    <div
      id={id}
      onMouseEnter={onEnter}
      onClick={(e) => (e.target as HTMLElement).closest('a') && onNavigate()}
      className={cn(
        'absolute inset-x-0 top-full z-40 bg-white/[0.98] shadow-[0_2px_3px_-3px_#949496] transition-[opacity,visibility] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
        open ? 'visible opacity-100' : 'invisible opacity-0',
      )}
    >
      <div className="mx-auto flex max-w-[1440px] gap-0 px-[61px] pb-11 pt-9">
        {menu.columns.map((groups, i) => (
          <div key={i} className="w-[200px] shrink-0 space-y-[30px]">
            {groups.map((g) => (
              <div key={g.title.label}>
                <Link href={g.title.href} className="text-[13px] font-medium tracking-[1px] text-black hover:underline">
                  {g.title.label}
                </Link>
                <ul className="mt-4 space-y-[13px]">
                  {g.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="relative text-[13px] font-medium tracking-[1px] text-mute transition-colors hover:text-black">
                        {l.label}
                        <PendingHint />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
        <Link href={menu.feature.href} className="group ml-[50px] block w-[240px] shrink-0">
          <span className="relative block h-[180px] overflow-hidden bg-soft">
            <Image
              src={menu.feature.image}
              alt={menu.feature.alt}
              fill
              sizes="240px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </span>
          <span className="mt-[10px] block text-[12px] leading-6 tracking-[1px] text-body">{menu.feature.title}</span>
          <span className="block text-[12px] leading-6 tracking-[1px] text-mute">{menu.feature.text}</span>
        </Link>
        <Link
          href={menu.href}
          className="ml-auto self-start text-[12px] font-semibold uppercase tracking-[2px] text-black underline underline-offset-[5px] hover:text-mute"
        >
          Shop all {menu.label === 'Women' ? "women's" : "men's"}
        </Link>
      </div>
    </div>
  );
}
