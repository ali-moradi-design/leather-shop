import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { fetchProducts, ProductCard } from '@/entities/product';
import type { Collection, Landing, LandingSection } from '@/shared/config';
import { Icon, Skeleton } from '@/shared/ui';

/**
 * /collections/mens and /collections/womens: sidebar of collections, banner,
 * a row of square collection tiles, then sections that pair a big promo image
 * with nine products. Phones get a tab row instead of the sidebar, and the
 * tiles and sections scroll sideways.
 */
export function CollectionLanding({
  collection,
  landing,
  links,
}: {
  collection: Collection;
  landing: Landing;
  links: { title: string; href: string }[];
}) {
  const allLabel = landing.gender === 'women' ? "All Women's" : "All Men's";
  return (
    <div className="container-shop flex flex-col pb-24 pt-[18px] lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-x-[22px]">
      <aside aria-label="Collections" className="hidden lg:sticky lg:top-[calc(var(--header-h)+18px)] lg:block lg:self-start">
        <ul className="text-[13.5px]">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex items-center justify-between py-[7px] text-ink hover:underline">
                {l.title.replace(/^(Men|Women)'s /, '')}
                <Icon name="plus" width={13} height={13} className="text-mute" />
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0">
        <section className="relative -mx-4 flex h-[200px] items-center justify-center overflow-hidden text-white sm:mx-0 sm:h-[280px] lg:h-[340px]">
          <Image src={collection.hero} alt="" fill priority sizes="(min-width: 1024px) 1070px, 100vw" className="object-cover object-[center_65%]" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative px-6 text-center lg:mr-[38%]">
            <h1 className="font-serif text-[30px] font-bold text-white sm:text-[38px]">{collection.title}</h1>
            <p className="mt-3 text-[15px] font-medium tracking-[2px] sm:text-[17px]">{collection.tagline}</p>
          </div>
        </section>

        {/* phones: the sidebar becomes a row of tabs */}
        <nav aria-label="Collections" className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto border-b border-line px-4 text-[15px] text-ink sm:-mx-6 sm:px-6 lg:hidden">
          <span aria-current="page" className="shrink-0 border-b-2 border-ink py-3 font-semibold">{allLabel}</span>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="shrink-0 border-b-2 border-transparent py-3">
              {l.title.replace(/^(Men|Women)'s /, '')}
            </Link>
          ))}
        </nav>

        <Eyebrow>{landing.tilesTitle}</Eyebrow>
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-[18px] lg:overflow-visible lg:px-[13px]">
          {landing.tiles.map((t) => (
            <Link key={t.href} href={t.href} className="group relative block aspect-square w-[40vw] shrink-0 overflow-hidden lg:w-auto">
              <Image src={t.image} alt="" fill sizes="(min-width: 1024px) 250px, 40vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
              <span className="absolute inset-x-3 top-[9%] text-center text-white">
                <span className="block font-serif text-[18px] font-bold leading-[1.25] sm:text-[24px] xl:text-[32px]">{t.title}</span>
                <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-[1px] underline underline-offset-4 sm:text-[12px]">Shop now</span>
              </span>
            </Link>
          ))}
        </div>

        {landing.sections.map((s) => (
          <Suspense key={s.eyebrow} fallback={<SectionSkeleton section={s} />}>
            <PromoSection section={s} />
          </Suspense>
        ))}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="pb-[13px] pt-[30px] text-[13px] font-semibold uppercase tracking-[2px] text-mute lg:px-[8px] lg:text-[14px]">
      {children}
    </h2>
  );
}

/** Columns: phones scroll sideways in two rows; desktop is a 6-column grid, promo over 3 of them. */
const GRID =
  'no-scrollbar -mx-4 grid auto-cols-[40vw] grid-flow-col grid-rows-[auto_auto] gap-x-2.5 gap-y-6 overflow-x-auto px-4 sm:-mx-6 sm:auto-cols-[30vw] sm:px-6 lg:mx-0 lg:grid-flow-row lg:grid-cols-6 lg:grid-rows-none lg:gap-x-[18px] lg:gap-y-[30px] lg:overflow-visible lg:px-[17px]';

async function PromoSection({ section }: { section: LandingSection }) {
  const { data } = await fetchProducts({ ...section.query, limit: 9 });
  if (data.length === 0) return null;
  return (
    <section aria-label={section.eyebrow} className="mt-[30px] border-t border-line">
      <Eyebrow>{section.eyebrow}</Eyebrow>
      <div className={GRID}>
        <Promo section={section} />
        {data.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <div className="mt-6 flex justify-end lg:px-[8px]">
        <Link
          href={section.shopAll.href}
          className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[2px] text-mute underline underline-offset-[5px] hover:text-ink"
        >
          {section.shopAll.label}
          <Icon name="chevron" width={13} height={13} className="-rotate-90" />
        </Link>
      </div>
    </section>
  );
}

function Promo({ section }: { section: LandingSection }) {
  const { promo } = section;
  return (
    <Link href={promo.href} className="group relative block aspect-square overflow-hidden bg-soft lg:col-span-3 lg:row-span-3 lg:aspect-[513/613] lg:self-start">
      <Image src={promo.image} alt="" fill sizes="(min-width: 1024px) 520px, 40vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      <span className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-transparent" />
      <span className="absolute inset-x-3 top-[5%] text-center text-white lg:inset-x-8">
        <span className="block font-serif text-[16px] font-bold leading-tight sm:text-[22px] lg:text-[32px]">{promo.title}</span>
        <span className="mt-1.5 block text-[10px] leading-snug sm:text-[13px] lg:mt-4 lg:text-[18px] lg:leading-8">{promo.text}</span>
      </span>
    </Link>
  );
}

function SectionSkeleton({ section }: { section: LandingSection }) {
  return (
    <section aria-hidden className="mt-[30px] border-t border-line">
      <Eyebrow>{section.eyebrow}</Eyebrow>
      <div className={GRID}>
        <Skeleton className="aspect-square lg:col-span-3 lg:row-span-3 lg:aspect-[513/613]" />
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="mt-3 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  );
}
