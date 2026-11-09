'use client';

import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import Image from 'next/image';
import { restoreProduct } from '../api/actions';
import { ActionMessage } from './ActionMessage';
import { DataTable } from './DataTable';
import { useAction } from './useAction';

export interface TrashRow {
  id: string;
  title: string;
  image?: string;
  stock: number;
}

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, TrashRow>();
const columns = helper.columns([
  helper.accessor('title', {
    header: 'Product',
    cell: ({ row }) => (
      <span className="flex items-center gap-3">
        <span className="relative h-12 w-12 shrink-0 bg-soft">
          {row.original.image && <Image src={row.original.image} alt="" fill sizes="48px" className="object-contain" />}
        </span>
        {row.original.title}
      </span>
    ),
  }),
  helper.accessor('stock', { header: 'Stock' }),
  helper.display({ id: 'restore', header: () => <span className="sr-only">Actions</span>, cell: ({ row }) => <Restore id={row.original.id} /> }),
]);

export function TrashTable({ rows }: { rows: TrashRow[] }) {
  const table = useTable({ features, columns, data: rows, getRowId: (r) => r.id });
  return <DataTable table={table} label="Deleted products" empty="The trash is empty." />;
}

function Restore({ id }: { id: string }) {
  const { pending, result, run } = useAction();
  return (
    <span className="flex items-center justify-end gap-3">
      <ActionMessage result={result} />
      <button type="button" disabled={pending} onClick={() => run(() => restoreProduct(id))} className="link-underline text-[13px]">
        {pending ? 'Restoring…' : 'Restore'}
      </button>
    </span>
  );
}
