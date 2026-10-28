import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CATEGORY_CIRCLES, MEGA_MENU, SECONDARY_NAV, SUB_NAV } from '@/shared/config';
import { Logo } from '@/shared/ui';
import { MegaNav } from './MegaNav';
import { MobileMenu } from './MobileMenu';
import { PendingHint } from './PendingHint';
import { SearchToggle } from './SearchToggle';

/**
 * Announcement bar, sticky main header (mega menu on desktop, drawer on phones)
 * and the category row. Only the main header sticks, like the reference: the
 * announcement and category rows scroll away. `cart` and `account` are slots
 * for the per-visitor parts.
 */
export function SiteHeader({ cart, account }: { cart: ReactNode; account: ReactNode }) {
  return (
    <>
      <div className="flex h-[var(--announce-h)] items-center justify-center bg-brand px-4 text-center text-[11px] font-medium uppercase tracking-[1.5px] text-white">
        <p className="truncate">
          <span className="sm:hidden">Free shipping &amp; returns</span>
          <span className="hidden sm:inline">Free shipping and returns on every order</span>
          <Link href="/help#shipping" className="ml-1.5 underline underline-offset-[3px]">
            Details
          </Link>
        </p>
      </div>

      <header className="sticky top-0 z-40 h-[var(--header-h)] border-b border-line bg-white">
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-stretch px-4 sm:px-[30px]">
          <div className="flex items-center gap-3">
            <MobileMenu menus={MEGA_MENU} links={SECONDARY_NAV} />
            <SearchToggle className="hidden p-1 sm:block lg:hidden" />
            <MegaNav menus={MEGA_MENU} links={[{ label: 'About', href: '/about' }]} />
          </div>
          <Link href="/" aria-label="Welt & Grain home" className="flex items-center">
            <Logo className="scale-[0.8] lg:scale-100" />
          </Link>
          <div className="flex items-center justify-end gap-[22px] text-[13px] font-medium uppercase tracking-[1.04px] text-black">
            <Link href="/collections/leather-care" className="relative hidden hover:text-mute lg:block">
              Leather Care
              <PendingHint />
            </Link>
            <Link href="/help" className="relative hidden hover:text-mute lg:block">
              Help
              <PendingHint />
            </Link>
            <span className="hidden lg:contents">{account}</span>
            <SearchToggle className="hidden lg:block" />
            {cart}
          </div>
        </div>
      </header>

      <nav aria-label="Categories" className="h-[var(--subnav-h)] bg-soft">
        {/* desktop: one line of text links */}
        <ul className="no-scrollbar hidden h-full items-center gap-6 overflow-x-auto px-6 lg:flex xl:justify-center xl:gap-8">
          {SUB_NAV.map((l) => (
            <li key={l.href} className="shrink-0 first:ml-auto last:mr-auto xl:first:ml-0 xl:last:mr-0">
              <Link href={l.href} className="relative text-[13px] text-black hover:underline">
                {l.label}
                <PendingHint />
              </Link>
            </li>
          ))}
        </ul>
        {/* phones and tablets: round product thumbnails that scroll sideways */}
        <ul className="no-scrollbar flex h-full snap-x items-center gap-1 overflow-x-auto bg-white px-2 lg:hidden">
          {CATEGORY_CIRCLES.map((c) => (
            <li key={c.href} className="snap-start">
              <Link href={c.href} className="flex w-[66px] flex-col items-center text-center">
                <span className="relative h-[50px] w-[50px] overflow-hidden rounded-full border border-line bg-soft">
                  <Image src={c.image} alt="" fill sizes="50px" className="scale-125 object-contain" />
                </span>
                <span className="mt-1.5 text-[12px] leading-[14px] text-ink">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
