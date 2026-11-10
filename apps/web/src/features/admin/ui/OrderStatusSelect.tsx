'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { ActionResult } from '../model/product-form';
import { NEXT_STATUS, STATUS_LABEL, type OrderStatus } from '@/entities/order';
import { updateOrderStatus, type Shipment } from '../api/actions';
import { ActionMessage } from './ActionMessage';
import { useAction } from './useAction';

/** Moves an order to one of its allowed next statuses. */
export function OrderStatusSelect({ orderId, status, withNote = false }: { orderId: string; status: OrderStatus; withNote?: boolean }) {
  const { pending, result, run } = useAction();
  const options = NEXT_STATUS[status];
  if (options.length === 0) return <span>{STATUS_LABEL[status]}</span>;

  const change = (next: OrderStatus, note?: string, shipment?: Shipment) => {
    if (next === 'cancelled' && !window.confirm('Cancel this order? Its items go back into stock, and a Stripe payment is refunded.')) return;
    run(() => updateOrderStatus(orderId, next, note, shipment));
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

const CARRIERS = ['UPS', 'USPS', 'FedEx', 'DHL', 'Other'] as const;

const statusFormSchema = z
  .object({
    status: z.string().min(1),
    note: z.string().trim().max(500, 'Up to 500 characters'),
    carrier: z.enum(CARRIERS),
    trackingNumber: z.string().trim().max(40),
  })
  .refine((v) => v.status !== 'shipped' || v.trackingNumber.length >= 4, {
    path: ['trackingNumber'],
    message: 'Enter the tracking number',
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
  onChange: (status: OrderStatus, note?: string, shipment?: Shipment) => void;
}) {
  const defaults = { status: options[0], note: '', carrier: 'UPS' as const, trackingNumber: '' };
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(statusFormSchema),
    defaultValues: defaults,
  });
  const shipping = useWatch({ control, name: 'status' }) === 'shipped';
  return (
    <form
      noValidate
      className="flex flex-wrap items-end gap-2 text-[14px]"
      onSubmit={handleSubmit((v) => {
        onChange(v.status as OrderStatus, v.note || undefined, v.status === 'shipped' ? { carrier: v.carrier, trackingNumber: v.trackingNumber } : undefined);
        reset(defaults);
      })}
    >
      <label className="flex flex-col gap-1">
        <span className="text-mute">Move to</span>
        <select {...register('status')} className="border border-line bg-white px-2 py-2">
          {options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>
      {shipping && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-mute">Carrier</span>
            <select {...register('carrier')} className="border border-line bg-white px-2 py-2">
              {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex min-w-[180px] flex-col gap-1">
            <span className="text-mute">Tracking number</span>
            <input {...register('trackingNumber')} aria-invalid={errors.trackingNumber ? true : undefined} className="border border-line px-3 py-2 font-mono" />
            {errors.trackingNumber && <span className="text-[12px] text-danger">{errors.trackingNumber.message}</span>}
          </label>
        </>
      )}
      <label className="flex min-w-[200px] flex-1 flex-col gap-1">
        <span className="text-mute">Note (optional)</span>
        <input {...register('note')} aria-invalid={errors.note ? true : undefined} placeholder="Reason, message for the history…" className="border border-line px-3 py-2" />
        {errors.note && <span className="text-[12px] text-danger">{errors.note.message}</span>}
      </label>
      <button type="submit" disabled={pending} className="btn h-[42px] px-6">{pending ? 'Saving…' : 'Update'}</button>
      <ActionMessage result={result} className="w-full" />
    </form>
  );
}
