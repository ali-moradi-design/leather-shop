'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { clientApi } from '@/shared/api/client';
import { formatMoney } from '@/shared/lib/money';

/** Cancels an order that has not shipped; paid orders are refunded by the shop. */
export function CancelOrderButton({ orderId, paid }: { orderId: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        className="text-[14px] text-danger underline underline-offset-4"
        onClick={async () => {
          if (!window.confirm(paid ? 'Cancel this order? We will refund your payment.' : 'Cancel this order?')) return;
          setBusy(true);
          setError(null);
          try {
            await clientApi(`/orders/${orderId}/cancel`, { method: 'POST', body: '{}' });
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not cancel');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Cancelling…' : 'Cancel order'}
      </button>
      {error && <p role="alert" className="mt-2 text-[14px] text-danger">{error}</p>}
    </div>
  );
}

const REASONS = [
  ['too-small', 'Too small'],
  ['too-large', 'Too large'],
  ['not-as-described', 'Not as described'],
  ['damaged', 'Arrived damaged'],
  ['changed-mind', 'Changed my mind'],
  ['other', 'Other'],
] as const;

export interface ReturnableLine {
  sku: string;
  title: string;
  size: string;
  /** Pairs not already in a return */
  available: number;
  price: number;
  /** Sizes this style comes in, for an exchange */
  sizes: string[];
}

interface ReturnValues {
  reason: (typeof REASONS)[number][0];
  comment: string;
  lines: Record<string, { quantity: string; type: 'refund' | 'exchange'; exchangeSize: string }>;
}

/** Return or exchange request, one row per size in the order. */
export function ReturnRequestForm({ orderId, lines }: { orderId: string; lines: ReturnableLine[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, control, formState } = useForm<ReturnValues>({
    defaultValues: {
      reason: 'too-small',
      comment: '',
      // keyed by row, not SKU: SKUs can hold dots (size 10.5), which form paths read as nesting
      lines: Object.fromEntries(lines.map((_, i) => [`r${i}`, { quantity: '0', type: 'exchange', exchangeSize: '' }])),
    },
  });
  const chosen = useWatch({ control, name: 'lines' });
  const submit = handleSubmit(async (v) => {
    setError(null);
    const items = lines
      .map((l, i) => ({ l, row: v.lines[`r${i}`] }))
      .filter(({ row }) => Number(row.quantity) > 0)
      .map(({ l, row }) => ({ sku: l.sku, quantity: Number(row.quantity), type: row.type, ...(row.type === 'exchange' ? { exchangeSize: row.exchangeSize } : {}) }));
    if (items.length === 0) return setError('Choose at least one pair to send back.');
    if (items.some((i) => i.type === 'exchange' && !i.exchangeSize)) return setError('Choose the size you want instead.');
    try {
      await clientApi('/returns', { method: 'POST', body: JSON.stringify({ orderId, reason: v.reason, ...(v.comment.trim() ? { comment: v.comment.trim() } : {}), items }) });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the request');
    }
  });

  if (lines.every((l) => l.available === 0)) return null;
  if (!open) {
    return (
      <button type="button" className="btn btn-outline mt-8" onClick={() => setOpen(true)}>
        Return or exchange
      </button>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="mt-8 space-y-5 border border-line p-5 text-[14px]" aria-labelledby="return-heading">
      <h2 id="return-heading" className="heading text-[22px]">Return or exchange</h2>
      <p className="text-mute">Free within 30 days of shipping. Send the pairs unworn, in their box; we email you a label once we approve the request.</p>
      <ul className="space-y-4">
        {lines.map((l, i) => {
          const row = chosen?.[`r${i}`];
          return (
            <li key={l.sku} className="grid gap-3 border-b border-line pb-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
              <div>
                <p>{l.title}</p>
                <p className="text-mute">Size {l.size} · {formatMoney(l.price)}</p>
              </div>
              <label className="block">
                Pairs
                <select {...register(`lines.r${i}.quantity`)} disabled={l.available === 0} className="mt-1 block border border-line px-2 py-2">
                  {Array.from({ length: l.available + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="block">
                I want
                <select {...register(`lines.r${i}.type`)} className="mt-1 block border border-line px-2 py-2">
                  <option value="exchange">Another size</option>
                  <option value="refund">A refund</option>
                </select>
              </label>
              {row?.type === 'exchange' && Number(row.quantity) > 0 && (
                <label className="block">
                  New size
                  <select {...register(`lines.r${i}.exchangeSize`)} className="mt-1 block border border-line px-2 py-2">
                    <option value="">Choose</option>
                    {l.sizes.filter((s) => s !== l.size).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              )}
            </li>
          );
        })}
      </ul>
      <label className="block">
        Reason
        <select {...register('reason')} className="mt-1 block w-full border border-line px-2 py-2.5">
          {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="block">
        Anything we should know? (optional)
        <textarea {...register('comment')} rows={3} maxLength={1000} className="mt-1 block w-full border border-line p-3" />
      </label>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={formState.isSubmitting} className="btn">Send request</button>
        <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
