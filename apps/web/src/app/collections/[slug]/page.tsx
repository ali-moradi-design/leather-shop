import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { fetchFacets } from '@/entities/product';
import { FilterSidebar, readFilters, toProductQuery, type SidebarCollection } from '@/features/catalog-filters';
import { ProductGrid, GridSkeleton } from '@/widgets/catalog';
import { COLLECTIONS, findCollection, type Collection } from '@/shared/config';
import { SidebarSkeleton } from './SidebarSkeleton';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = findCollection((await params).slug);
  if (!c) return {};
  return {
    title: c.title,
    description: `${c.title} — ${c.tagline} Free shipping and returns.`,
    alternates: { canonical: `/collections/${c.slug}` },
    openGraph: { images: [c.hero] },
  };
}

/** Collections for the sidebar tree: same gender first, then the unisex ones. */
function sidebarCollections(current: Collection): SidebarCollection[] {
  const fits = (c: Collection) =>
    !current.gender ? true : c.gender === current.gender || (!c.gender && c.slug !== 'bags');
  return COLLECTIONS.filter(fits).map((c) => ({
    title: c.title,
    href: `/collections/${c.slug}`,
    current: c.slug === current.slug,
    styles: c.chips,
  }));
}

function breadcrumb(c: Collection) {
  const parent = c.gender === 'men' ? 'Men' : c.gender === 'women' ? 'Women' : 'Shop';
  const parentHref = c.gender === 'women' ? '/collections/womens-boots' : '/collections/mens-boots';
  return [{ label: parent, href: parentHref }, { label: c.title.replace(/^(Men|Women)'s /, '') }];
}

/** Reads the URL filters, so it is a dynamic hole inside the static page shell. */
async function Results({ collection, searchParams }: { collection: Collection; searchParams: Props['searchParams'] }) {
  const filters = readFilters(await searchParams);
  return (
    <ProductGrid
      basePath={`/collections/${collection.slug}`}
      params={filters as Record<string, string>}
      query={{ ...toProductQuery(filters), category: collection.category, gender: collection.gender }}
    />
  );
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const collection = findCollection((await params).slug);
  if (!collection) notFound();
  const facets = await fetchFacets({ category: collection.category, gender: collection.gender });

  return (
    <div className="container-shop flex flex-col pb-24 pt-[18px] lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-[22px]">
      <Suspense fallback={<SidebarSkeleton />}>
        <FilterSidebar facets={facets} collections={sidebarCollections(collection)} breadcrumb={breadcrumb(collection)} />
      </Suspense>

      <section className="relative order-1 -mx-4 flex h-[200px] items-center justify-center overflow-hidden text-white sm:mx-0 sm:h-[280px] lg:col-start-2 lg:row-start-1 lg:h-[340px]">
        <Image src={collection.hero} alt="" fill priority sizes="(min-width: 1024px) 1070px, 100vw" className="object-cover object-[center_65%]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative px-6 text-center lg:mr-[38%]">
          <h1 className="font-serif text-[30px] font-bold text-white sm:text-[38px]">{collection.title}</h1>
          <p className="mt-3 text-[15px] font-medium tracking-[2px] sm:text-[17px]">{collection.tagline}</p>
        </div>
      </section>

      <div className="order-3 min-w-0 lg:col-start-2 lg:row-start-2">
        <Suspense fallback={<GridSkeleton />}>
          <Results collection={collection} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
