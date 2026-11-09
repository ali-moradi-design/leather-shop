import type { Metadata } from 'next';
import Form from 'next/form';
import Link from 'next/link';
import { Suspense } from 'react';
import type { Product, ProductQuery } from '@/entities/product';
import { PageHeader, Pagination, ProductsTable, type ProductRow } from '@/features/admin';
import { requireAdmin } from '@/features/auth/server';
import type { ApiPaginated } from '@/shared/api';
import { serverApi } from '@/shared/api/server';
import { early } from '@/shared/lib/early';
import { PRODUCT_CATEGORIES, PRODUCT_GENDERS } from '@/shared/config';
import { Skeleton } from '@/shared/ui';

export const metadata: Metadata = { title: 'Products' };

type Search = { q?: string; page?: string; category?: string; gender?: string; stock?: string; sort?: string; order?: string };
type Props = { searchParams: Promise<Search> };

const SORTS = ['title', 'price', 'stock', 'createdAt'] as const;
const pick = <T extends string>(list: readonly T[], v?: string) => (list.includes(v as T) ? (v as T) : undefined);

/** Only what the table shows goes to the browser, not whole products. */
const toRow = (p: Product): ProductRow => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  image: p.images[0],
  category: p.category,
  gender: p.gender,
  price: p.price,
  compareAtPrice: p.compareAtPrice,
  stock: p.stock,
  featured: p.featured,
});

async function Products({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = {
    q: sp.q?.trim() || undefined,
    category: pick(PRODUCT_CATEGORIES, sp.category),
    gender: pick(PRODUCT_GENDERS, sp.gender),
    stock: pick(['low', 'out'] as const, sp.stock),
    sort: pick(SORTS, sp.sort) ?? 'title',
    order: sp.order === 'desc' ? 'desc' : 'asc',
  } as const;
  const page = Math.max(1, Number(sp.page) || 1);
  const query: Record<string, string> = { limit: '30', page: String(page), sort: filters.sort, order: filters.order };
  if (filters.q) query.q = filters.q;
  if (filters.category) query.category = filters.category;
  if (filters.gender) query.gender = filters.gender;
  if (filters.stock === 'low') query.maxStock = '5';
  if (filters.stock === 'out') query.inStock = 'false';
  const qs = new URLSearchParams(query satisfies Partial<Record<keyof ProductQuery | 'maxStock', string>>);
  const list = early(serverApi<ApiPaginated<Product>>(`/products?${qs}`));
  await requireAdmin('/admin/products');
  const { data, meta } = await list;

  const select = 'border border-line bg-white px-2 py-2 text-[14px]';
  return (
    <>
      <Form action="/admin/products" className="mb-5 flex flex-wrap items-end gap-3 text-[14px]" role="search">
        <input type="hidden" name="sort" value={filters.sort} />
        <input type="hidden" name="order" value={filters.order} />
        <label className="flex min-w-[220px] flex-1 flex-col gap-1">
          <span className="text-mute">Search</span>
          <input name="q" defaultValue={filters.q} placeholder="Name or color" className="border border-line px-3 py-2 outline-none focus:border-ink" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-mute">Category</span>
          <select name="category" defaultValue={filters.category ?? ''} className={select}>
            <option value="">All</option>
            {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-mute">For</span>
          <select name="gender" defaultValue={filters.gender ?? ''} className={select}>
            <option value="">Everyone</option>
            {PRODUCT_GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-mute">Stock</span>
          <select name="stock" defaultValue={filters.stock ?? ''} className={select}>
            <option value="">Any</option>
            <option value="low">5 or fewer</option>
            <option value="out">Sold out</option>
          </select>
        </label>
        <button type="submit" className="btn h-[42px] px-6">Filter</button>
        {(filters.q || filters.category || filters.gender || filters.stock) && (
          <Link href="/admin/products" className="pb-2.5 text-mute underline underline-offset-4">Clear</Link>
        )}
      </Form>
      {/* a new key on every page or filter change clears the selection */}
      <ProductsTable key={qs.toString()} rows={data.map(toRow)} />
      <Pagination
        path="/admin/products"
        params={{ q: filters.q, category: filters.category, gender: filters.gender, stock: filters.stock, sort: filters.sort, order: filters.order }}
        page={meta.page}
        pages={meta.pages}
        total={meta.total}
        noun="products"
      />
    </>
  );
}

export default function AdminProductsPage(props: Props) {
  return (
    <div>
      <PageHeader title="Products">
        <Link href="/admin/products/trash" className="text-[14px] text-mute underline underline-offset-4">Trash</Link>
        <Link href="/admin/products/new" className="btn">+ New product</Link>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Products {...props} />
      </Suspense>
    </div>
  );
}
