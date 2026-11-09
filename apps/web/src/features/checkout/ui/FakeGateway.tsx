'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { orderNumber } from '@/entities/order';
import { clientApi } from '@/shared/api/client';
import { formatMoney } from '@/shared/lib/money';
import { cardSchema, sameCard, type CardValues } from '../model/schema';

const DECLINE_CARD = '4000 0000 0000 0002';

/**
 * Simulated payment gateway (demo). The approve card confirms the payment through
 * the API's fake payment method; the decline card fails without charging.
 */
export function FakeGateway({ orderId, amount }: { orderId: string; amount: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { card: '4242 4242 4242 4242', expiry: '12 / 30', cvc: '123' },
  });

  const pay = handleSubmit(async ({ card }) => {
    setError(null);
    await new Promise((r) => setTimeout(r, 600));
    if (sameCard(card, DECLINE_CARD)) {
      setError('Your card was declined. Try another card.');
      return;
    }
    try {
      await clientApi(`/orders/${orderId}/pay`, { method: 'POST' });
      // the order page is dynamic, so it renders the paid order; a refresh() here would race it
      router.replace(`/account/orders/${orderId}?paid=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  });

  const field = 'mt-1 block w-full rounded-md border border-[#d0d5dd] px-3 py-2.5 outline-none focus:border-[#444] aria-[invalid=true]:border-danger';
  const fieldError = (name: keyof CardValues) =>
    errors[name] && <span className="mt-1 block text-[12px] text-danger">{errors[name]?.message}</span>;
  return (
    <div className="mx-auto my-14 max-w-md rounded-xl border border-[#d0d5dd] p-8 font-sans shadow-sm">
      <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-mute">Welt Pay · test gateway</p>
      <p className="mt-2 text-[30px] font-medium" data-testid="pay-amount">{formatMoney(amount)}</p>
      <p className="text-[13px] text-mute">Order {orderNumber(orderId)} — no real money is charged.</p>
      <form className="mt-6 space-y-4 text-[14px]" onSubmit={pay} noValidate>
        <label className="block">
          Card number
          <input {...register('card')} aria-invalid={errors.card ? true : undefined} inputMode="numeric" autoComplete="cc-number" className={field} />
          {fieldError('card')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            Expiry
            <input {...register('expiry')} aria-invalid={errors.expiry ? true : undefined} autoComplete="cc-exp" className={field} />
            {fieldError('expiry')}
          </label>
          <label className="block">
            CVC
            <input {...register('cvc')} aria-invalid={errors.cvc ? true : undefined} inputMode="numeric" autoComplete="cc-csc" className={field} />
            {fieldError('cvc')}
          </label>
        </div>
        <p className="text-[12px] text-mute">Approve: 4242 4242 4242 4242 · Decline: {DECLINE_CARD}</p>
        {error && <p role="alert" className="text-danger">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="btn w-full rounded-md normal-case tracking-normal">
          {isSubmitting ? 'Processing…' : `Pay ${formatMoney(amount)}`}
        </button>
        <button type="button" onClick={() => router.push(`/account/orders/${orderId}`)} className="block w-full text-center text-[13px] text-mute underline">
          Cancel and return to the shop
        </button>
      </form>
    </div>
  );
}
