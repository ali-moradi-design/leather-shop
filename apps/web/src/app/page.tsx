import { Suspense } from 'react';
import { CachedCatalog } from '@/widgets/catalog-list/ui/CachedCatalog';
import { Spinner } from '@/shared/ui/Spinner';

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 id="catalog-heading" className="text-2xl font-bold tracking-tight">Catalog</h1>
        <p className="text-sm text-slate-500">
          PPR — static shell + Suspense holes (header cart/greeting). Catalog uses `use cache`.
        </p>
      </div>
      <Suspense fallback={<Spinner label="Loading catalog…" />}>
        <CachedCatalog />
      </Suspense>
    </div>
  );
}
