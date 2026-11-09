import type { Metadata } from 'next';
import Form from 'next/form';
import Link from 'next/link';
import { Suspense } from 'react';
import { ORDER_STATUSES, STATUS_LABEL, type Order, type OrderStatus } from '@/entities/order';
import { OrdersTable, PageHeader, Pagination, type OrderRow } from '@/features/admin';
import { requireAdmin } from '@/features/auth/server';
import type { ApiPaginated } from '@/shared/api';
import { serverApi } from '@/shared/api/server';
import { early } from '@/shared/lib/early';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui';

export const metadata: Metadata = { title: 'Orders' };

type Props = { searchParams: Promise<{ status?: string; q?: string; page?: string }> };

const TABS: (OrderStatus | undefined)[] = [undefined, 'paid', 'processing', 'shipped', 'pending_payment', 'completed', 'cancelled'];

const toRow = (o: Order): OrderRow => ({
  id: o.id,
  createdAt: o.createdAt,
  customer: o.shippingAddress.fullName,
  items: o.items.reduce((n, i) => n + i.quantity, 0),
  total: o.totalAmount,
  status: o.status,
});

async function Orders({ searchParams }: Props) {
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const q = sp.q?.trim() || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const qs = new URLSearchParams({ page: String(page), limit: '25', ...(status && { status }), ...(q && { q }) });
  const list = early(serverApi<ApiPaginated<Order>>(`/orders?${qs}`));
  await requireAdmin('/admin/orders');
  const { data, meta } = await list;
  const tabHref = (s?: OrderStatus) => {
    const p = new URLSearchParams({ ...(s && { status: s }), ...(q && { q }) }).toString();
    return p ? `/admin/orders?${p}` : '/admin/orders';
  };
  return (
    <>
      <nav aria-label="Order status" className="no-scrollbar -mx-5 mb-4 overflow-x-auto px-5 lg:mx-0 lg:px-0">
        <ul className="flex gap-2 text-[13px]">
          {TABS.map((s) => (
            <li key={s ?? 'all'}>
              <Link
                href={tabHref(s)}
                aria-current={s === status ? 'page' : undefined}
                className={cn('block whitespace-nowrap border px-3 py-1.5', s === status ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink')}
              >
                {s ? STATUS_LABEL[s] : 'All'}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Form action="/admin/orders" className="mb-5 flex max-w-md border-b border-ink" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="order-q" className="sr-only">Search orders</label>
        <input id="order-q" name="q" defaultValue={q} placeholder="Order number or customer name" className="min-w-0 flex-1 bg-transparent py-2 outline-none" />
        <button type="submit" className="eyebrow">Search</button>
      </Form>
      <OrdersTable rows={data.map(toRow)} />
      <Pagination path="/admin/orders" params={{ status, q }} page={meta.page} pages={meta.pages} total={meta.total} noun="orders" />
    </>
  );
}

export default function AdminOrdersPage(props: Props) {
  return (
    <div>
      <PageHeader title="Orders" />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Orders {...props} />
      </Suspense>
    </div>
  );
}
