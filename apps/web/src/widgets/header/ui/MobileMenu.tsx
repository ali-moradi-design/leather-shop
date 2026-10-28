'use client';

import Form from 'next/form';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { NewsletterForm } from '@/features/newsletter';
import type { MegaMenu, NavLink } from '@/shared/config';
import { Drawer, Icon } from '@/shared/ui';

/** Phone/tablet menu: a left sheet with search, MEN / WOMEN accordions, links and sign-up. */
export function MobileMenu({ menus, links }: { menus: MegaMenu[]; links: NavLink[] }) {
  // closes on any link click or search submit inside it (no usePathname: the
  // header is part of the prerendered shell)
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="-ml-1 p-1 lg:hidden">
        <Icon name="menu" width={24} height={24} />
      </button>
      <Drawer open={open} onClose={close} label="Site menu">
        <div className="flex items-center justify-between gap-3 px-[18px] pb-2 pt-4">
          <Form action="/search" role="search" onSubmit={close} className="flex min-w-0 flex-1 items-center gap-2">
            <button type="submit" aria-label="Search">
              <Icon name="search" width={22} height={22} />
            </button>
            <label htmlFor="mobile-search" className="sr-only">Search products</label>
            <input id="mobile-search" name="q" placeholder="Search" className="min-w-0 flex-1 py-1.5 text-[15px] text-ink outline-none placeholder:text-mute" />
          </Form>
          <button type="button" aria-label="Close menu" onClick={close}>
            <Icon name="close" width={24} height={24} />
          </button>
        </div>

        <nav aria-label="Mobile" className="px-[18px]" onClick={(e) => (e.target as HTMLElement).closest('a') && close()}>
          {menus.map((menu) => (
            <details key={menu.label} className="group border-b border-transparent">
              <summary className="flex cursor-pointer list-none items-center justify-between py-[15px] text-[13px] font-medium uppercase tracking-[1.5px] text-ink">
                {menu.label}
                <Icon name="plus" width={18} height={18} className="group-open:hidden" />
                <Icon name="minus" width={18} height={18} className="hidden group-open:block" />
              </summary>
              <div className="pb-3 pl-1">
                {menu.columns.flat().map((g) => (
                  <div key={g.title.label} className="mb-4">
                    <Link href={g.title.href} className="block py-1 text-[12px] font-semibold uppercase tracking-[1.5px] text-ink">
                      {g.title.label}
                    </Link>
                    <ul>
                      {g.links.map((l) => (
                        <li key={l.href + l.label}>
                          <Link href={l.href} className="block py-[5px] pl-3 text-[14px] text-body">
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ))}
          <span aria-hidden className="my-5 block w-5 border-t border-line" />
          <ul className="space-y-[18px] pb-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-[13px] font-medium uppercase tracking-[1.5px] text-mute hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto px-[18px] pb-8 pt-12">
          <p className="mb-3 text-[13px] font-medium uppercase tracking-[1.5px] text-ink">Subscribe for updates &amp; early access</p>
          <NewsletterForm withGender />
        </div>
      </Drawer>
    </>
  );
}
