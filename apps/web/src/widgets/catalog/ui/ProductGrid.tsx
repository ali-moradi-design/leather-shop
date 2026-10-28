import Link from 'next/link';
import type { ReactNode } from 'react';
import { fetchProducts, ProductCard, type ProductQuery } from '@/entities/product';
import { SortSelect } from '@/features/catalog-filters';
import { Skeleton } from '@/shared/ui';

/** The product grid columns used everywhere products are listed. */
export function ProductGridLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-[10px] gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-[18px] lg:gap-y-[34px]">
      {children}
    </div>
  );
}

/** Product grid for a query, with a count + sort bar and page links. Runs inside a Suspense hole. */
export async function ProductGrid({
  query,
  basePath,
  params,
}: {
  query: ProductQuery;
  basePath: string;
  params: Record<string, string>;
}) {
  const { data, meta } = await fetchProducts({ ...query, limit: 24 });

  if (data.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="heading text-[24px]">No styles match these filters.</p>
        <Link href={basePath} className="btn mt-6">Clear filters</Link>
      </div>
    );
  }

  const pageHref = (page: number) => {
    const sp = new URLSearchParams(params);
    if (page > 1) sp.set('page', String(page));
    else sp.delete('page');
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 pb-4 pt-6 lg:pt-[30px]">
        <p className="text-[13px] font-medium uppercase tracking-[2px] text-mute" aria-live="polite">
          {meta.total} {meta.total === 1 ? 'style' : 'styles'}
        </p>
        <SortSelect />
      </div>
      <ProductGridLayout>
        {data.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </ProductGridLayout>
      {meta.pages > 1 && (
        <nav aria-label="Pages" className="mt-14 flex items-center justify-center gap-6 text-[14px] text-ink">
          {meta.page > 1 ? <Link className="link-underline" href={pageHref(meta.page - 1)}>Previous</Link> : <span />}
          <span className="text-mute">Page {meta.page} of {meta.pages}</span>
          {meta.page < meta.pages ? <Link className="link-underline" href={pageHref(meta.page + 1)}>Next</Link> : <span />}
        </nav>
      )}
    </>
  );
}

/** Placeholder with the same layout as the grid, used by Suspense and loading.tsx. */
export function GridSkeleton({ count = 12, toolbar = true }: { count?: number; toolbar?: boolean }) {
  return (
    <div aria-hidden>
      {toolbar && (
        <div className="flex items-center justify-between pb-4 pt-6 lg:pt-[30px]">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-40" />
        </div>
      )}
      <ProductGridLayout>
        {Array.from({ length: count }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square w-full" />
            <div className="mt-3 flex justify-between gap-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
        ))}
      </ProductGridLayout>
    </div>
  );
}
