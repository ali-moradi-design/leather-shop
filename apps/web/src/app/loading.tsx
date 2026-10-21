import { CatalogSkeleton } from '@/shared/ui/CatalogSkeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
      <CatalogSkeleton />
    </div>
  );
}
