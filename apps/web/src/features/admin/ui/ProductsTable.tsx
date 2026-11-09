'use client';

import {
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { formatMoney } from '@/shared/lib/money';
import { cn } from '@/shared/lib/cn';
import { bulkUpdateProducts, deleteProduct, type BulkAction } from '../api/actions';
import { ActionMessage } from './ActionMessage';
import { DataTable } from './DataTable';
import { SortHeader } from './SortHeader';
import { useAction } from './useAction';

/** The fields the list needs; the page sends only these to the browser. */
export interface ProductRow {
  id: string;
  slug: string;
  title: string;
  image?: string;
  category: string;
  gender: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  featured: boolean;
}

const features = tableFeatures({ rowSelectionFeature });
const helper = createColumnHelper<typeof features, ProductRow>();

const columns = helper.columns([
  helper.display({
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Select all on this page"
        checked={table.getIsAllRowsSelected()}
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
        }}
        onChange={table.getToggleAllRowsSelectedHandler()}
        className="h-4 w-4"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label={`Select ${row.original.title}`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        className="h-4 w-4"
      />
    ),
  }),
  helper.accessor('title', {
    header: () => <SortHeader field="title" label="Product" isDefault />,
    cell: ({ row }) => (
      <span className="flex items-center gap-3">
        <span className="relative h-12 w-12 shrink-0 bg-soft">
          {row.original.image && <Image src={row.original.image} alt="" fill sizes="48px" className="object-contain" />}
        </span>
        <span>
          <Link href={`/admin/products/${row.original.id}`} className="text-ink hover:underline">{row.original.title}</Link>
          {row.original.featured && <span className="ml-2 bg-soft px-1.5 py-0.5 text-[11px] text-mute">Featured</span>}
        </span>
      </span>
    ),
  }),
  helper.accessor('category', {
    header: 'Category',
    cell: ({ row }) => <span className="capitalize">{row.original.gender} · {row.original.category}</span>,
  }),
  helper.accessor('price', {
    header: () => <SortHeader field="price" label="Price" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {row.original.compareAtPrice && <s className="mr-1.5 text-mute">{formatMoney(row.original.compareAtPrice)}</s>}
        {formatMoney(row.original.price)}
      </span>
    ),
  }),
  helper.accessor('stock', {
    header: () => <SortHeader field="stock" label="Stock" />,
    cell: ({ getValue }) => {
      const stock = getValue();
      return (
        <span className={cn(stock === 0 ? 'font-semibold text-danger' : stock <= 5 && 'text-danger')}>
          {stock === 0 ? 'Sold out' : stock}
        </span>
      );
    },
  }),
  helper.display({
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <RowActions row={row.original} />,
  }),
]);

/** Product list with selection and bulk actions; sorting and pages come from the URL. */
export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const table = useTable({
    features,
    columns,
    data: rows,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });
  const selected = Object.keys(rowSelection);
  return (
    <>
      <BulkBar ids={selected} onDone={() => setRowSelection({})} />
      <DataTable table={table} label="Products" empty="No products match these filters." rowTestId="admin-product" />
    </>
  );
}

function BulkBar({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const { pending, result, run } = useAction();
  const [percent, setPercent] = useState('20');
  const apply = (action: BulkAction, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    run(() => bulkUpdateProducts(ids, action), (r) => r.status === 'ok' && onDone());
  };
  if (ids.length === 0) return <ActionMessage result={result} className="mb-3" />;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 border border-ink bg-soft px-4 py-3 text-[13px]" role="region" aria-label="Bulk actions">
      <strong className="text-ink">{ids.length} selected</strong>
      <button type="button" disabled={pending} onClick={() => apply({ kind: 'feature', on: true })} className="underline underline-offset-4">Feature</button>
      <button type="button" disabled={pending} onClick={() => apply({ kind: 'feature', on: false })} className="underline underline-offset-4">Unfeature</button>
      <span className="flex items-center gap-1">
        <label htmlFor="bulk-percent">Sale</label>
        <input id="bulk-percent" value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="numeric" className="w-12 border border-line bg-white px-1.5 py-0.5" />%
        <button type="button" disabled={pending} onClick={() => apply({ kind: 'discount', percent: Number(percent) })} className="underline underline-offset-4">Apply</button>
      </span>
      <button type="button" disabled={pending} onClick={() => apply({ kind: 'end-sale' })} className="underline underline-offset-4">End sale</button>
      <button
        type="button"
        disabled={pending}
        onClick={() => apply({ kind: 'delete' }, `Move ${ids.length} products to the trash?`)}
        className="text-danger underline underline-offset-4"
      >
        Move to trash
      </button>
      {pending && <span className="text-mute">Working…</span>}
      <ActionMessage result={result} />
    </div>
  );
}

function RowActions({ row }: { row: ProductRow }) {
  const { pending, result, run } = useAction();
  return (
    <span className="flex items-center justify-end gap-3 whitespace-nowrap text-[13px]">
      <Link href={`/admin/products/${row.id}`} className="link-underline">Edit</Link>
      <Link href={`/products/${row.slug}`} className="text-mute hover:text-ink" target="_blank">View</Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => window.confirm(`Move “${row.title}” to the trash?`) && run(() => deleteProduct(row.id, row.slug))}
        className="text-danger hover:underline"
      >
        {pending ? 'Deleting…' : 'Delete'}
      </button>
      {result?.status === 'error' && <ActionMessage result={result} />}
    </span>
  );
}
