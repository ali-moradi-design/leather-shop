'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ProductVariant } from '@/entities/product/model/types';
import { clientApi } from '@/shared/api/client';

const schema = z.object({
  sku: z.string().min(1, 'Choose a size'),
  email: z.string().trim().email('Enter a valid email address'),
});
type Values = z.infer<typeof schema>;

/** "Email me when my size is back", for the sold-out sizes of the shown width. */
export function NotifyMe({ productId, soldOut }: { productId: string; soldOut: ProductVariant[] }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { sku: soldOut.length === 1 ? soldOut[0].sku : '', email: '' },
  });
  if (soldOut.length === 0) return null;
  if (done) return <p role="status" className="mt-3 text-[13px]">{done}</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 text-[13px] text-ink underline underline-offset-4">
        Size sold out? Get an email when it is back
      </button>
    );
  }
  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await clientApi<{ message: string }>(`/products/${productId}/stock-alerts`, { method: 'POST', body: JSON.stringify(values) });
      setDone(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    }
  });
  const { errors } = formState;
  return (
    <form onSubmit={submit} noValidate className="mt-3 space-y-2 border border-line p-3 text-[13px]" aria-label="Back in stock alert">
      <div className="flex gap-2">
        <label htmlFor={`${id}-size`} className="sr-only">Size</label>
        <select id={`${id}-size`} {...register('sku')} aria-invalid={errors.sku ? true : undefined} className="border border-line bg-white px-2 py-2">
          <option value="">Size</option>
          {soldOut.map((v) => (
            <option key={v.sku} value={v.sku}>{v.size}{v.width ? ` ${v.width}` : ''}</option>
          ))}
        </select>
        <label htmlFor={`${id}-email`} className="sr-only">Email</label>
        <input id={`${id}-email`} type="email" autoComplete="email" placeholder="Email address" {...register('email')} aria-invalid={errors.email ? true : undefined} className="min-w-0 flex-1 border border-line px-2 py-2" />
        <button type="submit" disabled={formState.isSubmitting} className="btn h-auto px-3 py-2 text-[12px]">Notify me</button>
      </div>
      {(errors.sku || errors.email || error) && (
        <p role="alert" className="text-danger">{errors.sku?.message ?? errors.email?.message ?? error}</p>
      )}
    </form>
  );
}
