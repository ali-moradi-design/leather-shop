import { GridSkeleton } from '@/widgets/catalog';
import { Skeleton } from '@/shared/ui';

/**
 * Loading placeholders shaped like the real pages, used by the `loading.tsx`
 * route files and by in-page Suspense fallbacks. Each has a screen-reader
 * status so the wait is announced.
 */

function Status({ label }: { label: string }) {
  return (
    <p role="status" className="sr-only">
      {label}
    </p>
  );
}

export function HomeSkeleton() {
  return (
    <div>
      <Status label="Loading the shop…" />
      <Skeleton className="h-[calc(100svh-var(--announce-h)-var(--header-h)-var(--subnav-h))] min-h-[460px] w-full" />
      <div className="mt-[5px] grid gap-1.5 sm:grid-cols-2 sm:gap-0">
        <Skeleton className="h-[440px] sm:h-[520px] lg:h-[655px]" />
        <Skeleton className="hidden h-[520px] sm:block lg:h-[655px]" />
      </div>
      <div className="px-4 pt-[60px] sm:px-[25px]">
        <Skeleton className="h-8 w-64" />
        <div className="mt-5 flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[291px] w-[62vw] shrink-0 sm:w-[245px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CollectionSkeleton() {
  return (
    <div className="container-shop flex flex-col pb-24 pt-[18px] lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-x-[22px]">
      <Status label="Loading products…" />
      <div aria-hidden className="hidden space-y-3 lg:block">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-3 border-t border-line pt-4">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className={i === 0 ? 'h-4 w-24' : 'h-4 w-40'} />
          ))}
        </div>
        <div className="space-y-3 border-t border-line pt-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className={i === 0 ? 'h-4 w-20' : 'h-4 w-full'} />
          ))}
        </div>
      </div>
      <div className="min-w-0">
        <Skeleton className="-mx-4 h-[200px] sm:mx-0 sm:h-[280px] lg:h-[340px]" />
        <div className="-mx-4 h-[45px] border-b border-line sm:-mx-6 lg:hidden" />
        <GridSkeleton count={8} />
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="container-shop pb-24">
      <Status label="Loading product…" />
      <div className="grid gap-6 pt-4 lg:grid-cols-[minmax(0,730px)_minmax(0,1fr)] lg:gap-[50px] lg:pt-[18px]">
        <div>
          <Skeleton className="mb-4 h-4 w-52 lg:mb-6" />
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
        <div className="space-y-3 lg:pt-1">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-1 pt-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[67px] w-[67px]" />
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1 pt-4 sm:grid-cols-10">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-[50px]" />
            ))}
          </div>
          <Skeleton className="mt-2 h-[46px] w-full" />
        </div>
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="container-shop pb-24">
      <Status label="Searching…" />
      <div className="flex flex-col items-center pt-14">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-6 h-[52px] w-full max-w-xl" />
      </div>
      <GridSkeleton count={8} />
    </div>
  );
}

/** Account, order and admin pages: a heading and a few rows. */
export function ListSkeleton({ wide = false, rows = 5 }: { wide?: boolean; rows?: number }) {
  return (
    <div className={`container-page py-14 ${wide ? '' : 'max-w-4xl'}`}>
      <Status label="Loading…" />
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-40" />
      <div className="mt-10 space-y-0 border-t border-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-6 border-b border-line py-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Sign-in, register, checkout and payment forms. */
export function FormSkeleton({ fields = 3, wide = false }: { fields?: number; wide?: boolean }) {
  return (
    <div className={`mx-auto px-4 py-14 ${wide ? 'max-w-6xl' : 'max-w-md'}`}>
      <Status label="Loading…" />
      <Skeleton className="mx-auto h-9 w-48" />
      <div className="mt-8 space-y-5">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-11 w-full" />
          </div>
        ))}
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}

/** Text pages (about, help). */
export function ArticleSkeleton({ banner = false }: { banner?: boolean }) {
  return (
    <div>
      <Status label="Loading…" />
      {banner && <Skeleton className="h-[360px] w-full" />}
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16">
        <Skeleton className="h-10 w-2/3" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className={i % 3 === 2 ? 'h-4 w-3/4' : 'h-4 w-full'} />
        ))}
      </div>
    </div>
  );
}
