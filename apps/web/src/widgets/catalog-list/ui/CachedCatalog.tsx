import { cacheLife } from 'next/cache';
import { fetchBooks } from '@/entities/book';
import { CatalogList } from './CatalogList';

/** Cached catalog included in the static PPR shell. */
export async function CachedCatalog() {
  'use cache';
  cacheLife('hours');
  const { data: books } = await fetchBooks({ limit: 40 });
  return (
    <>
      <p className="text-xs text-slate-400">{books.length} titles</p>
      <CatalogList books={books} labelledBy="catalog-heading" />
    </>
  );
}
