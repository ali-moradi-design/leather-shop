'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ActionResult } from '../model/product-form';
import { NEXT_STATUS, STATUS_LABEL, type OrderStatus } from '@/entities/order';
import { updateOrderStatus } from '../api/actions';
import { ActionMessage } from './ActionMessage';
import { useAction } from './useAction';

/** Moves an order to one of its allowed next statuses. */
export function OrderStatusSelect({ orderId, status, withNote = false }: { orderId: string; status: OrderStatus; withNote?: boolean }) {
  const { pending, result, run } = useAction();
  const options = NEXT_STATUS[status];
  if (options.length === 0) return <span>{STATUS_LABEL[status]}</span>;

  const change = (next: OrderStatus, note?: string) => {
    if (next === 'cancelled' && !window.confirm('Cancel this order? Its items go back into stock.')) return;
    run(() => updateOrderStatus(orderId, next, note));
  };

  if (withNote) return <StatusForm options={options} pending={pending} result={result} onChange={change} />;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <select
        aria-label="Order status"
        value=""
        disabled={pending}
        className="border border-line bg-white px-2 py-1"
        onChange={(e) => change(e.target.value as OrderStatus)}
      >
        <option value="" disabled>{STATUS_LABEL[status]}</option>
        {options.map((s) => <option key={s} value={s}>→ {STATUS_LABEL[s]}</option>)}
      </select>
      {result?.status === 'error' && <ActionMessage result={result} />}
    </span>
  );
}

const statusFormSchema = z.object({
  status: z.string().min(1),
  note: z.string().trim().max(500, 'Up to 500 characters'),
});

/** Order page: next status plus an optional note for the history (tracking number…). */
function StatusForm({
  options,
  pending,
  result,
  onChange,
}: {
  options: OrderStatus[];
  pending: boolean;
  result: ActionResult | null;
  onChange: (status: OrderStatus, note?: string) => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(statusFormSchema),
    defaultValues: { status: options[0], note: '' },
  });
  return (
    <form
      noValidate
      className="flex flex-wrap items-end gap-2 text-[14px]"
      onSubmit={handleSubmit((v) => {
        onChange(v.status as OrderStatus, v.note || undefined);
        reset({ status: options[0], note: '' });
      })}
    >
      <label className="flex flex-col gap-1">
        <span className="text-mute">Move to</span>
        <select {...register('status')} className="border border-line bg-white px-2 py-2">
          {options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>
      <label className="flex min-w-[200px] flex-1 flex-col gap-1">
        <span className="text-mute">Note (optional)</span>
        <input {...register('note')} aria-invalid={errors.note ? true : undefined} placeholder="Tracking number, reason…" className="border border-line px-3 py-2" />
        {errors.note && <span className="text-[12px] text-danger">{errors.note.message}</span>}
      </label>
      <button type="submit" disabled={pending} className="btn h-[42px] px-6">{pending ? 'Saving…' : 'Update'}</button>
      <ActionMessage result={result} className="w-full" />
    </form>
  );
}
