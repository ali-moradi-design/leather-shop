import { Skeleton } from '@/shared/ui';

/** Same footprint as the filter sidebar while it waits for the URL filters. */
export function SidebarSkeleton() {
  return (
    <>
      <div className="order-2 -mx-4 h-[45px] border-b border-line sm:-mx-6 lg:hidden" />
      <div aria-hidden className="hidden space-y-3 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:block">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-3 border-t border-line pt-4">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-40" />
          ))}
        </div>
        <div className="space-y-3 border-t border-line pt-4">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
