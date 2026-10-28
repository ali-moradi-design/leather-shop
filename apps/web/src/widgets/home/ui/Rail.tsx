import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function SectionHead({ title, href, linkLabel, flush }: { title: string; href?: string; linkLabel?: string; flush?: boolean }) {
  return (
    <div className={`flex items-end justify-between gap-4 pb-[18px] pt-[60px] sm:pt-[66px] ${flush ? '' : 'px-4 sm:px-[25px]'}`}>
      <h2 className="heading text-[24px] leading-[1.3] sm:text-[30px] sm:leading-[42px]">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 pb-2 text-[11px] font-semibold uppercase tracking-[1.68px] text-ink underline underline-offset-[5px] hover:no-underline sm:text-[12px]">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/**
 * Tile width of the home rails. Like the reference it grows with the screen
 * (245px at 1440, 333px at 1920, 347px at 2000), so about five and a half tiles
 * always fill the row instead of leaving empty space on wide screens.
 */
const TILE_W = 'w-[62vw] sm:w-[max(245px,calc(18.21vw-17px))]';
const TILE_SIZES = '(min-width: 640px) max(245px, 18vw), 62vw';

/** Horizontally scrolling row of lifestyle category tiles. */
export function CategoryRail({ items }: { items: { image: string; label: string; href: string }[] }) {
  return (
    <div className="no-scrollbar flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-2 sm:scroll-px-[25px] sm:px-[25px]">
      {items.map((it) => (
        <Link key={it.label} href={it.href} className={`group shrink-0 snap-start text-center ${TILE_W}`}>
          <div className="relative aspect-[245/290] overflow-hidden bg-soft">
            <Image src={it.image} alt="" fill sizes={TILE_SIZES} className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <span className="mt-[15px] block text-[12px] font-semibold uppercase tracking-[1.68px] text-ink">{it.label}</span>
        </Link>
      ))}
    </div>
  );
}

/** Product cards in the same fluid row as the category tiles. */
export function ProductRail({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-2 sm:scroll-px-[25px] sm:px-[25px] [&>*]:w-[62vw] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[max(245px,calc(18.21vw-17px))]">
      {children}
    </div>
  );
}
