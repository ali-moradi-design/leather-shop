'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Cart } from '@/features/cart';
import { useCartActions } from '@/features/cart';
import { clientApi } from '@/shared/api/client';
import { formatMoney } from '@/shared/lib/money';
import { startPayment } from '../api/startPayment';
import { addressSchema, toShippingAddress, type AddressValues } from '../model/schema';

type Quote = Cart & { discountCode?: string; discountAmount: number; total: number };

const field = 'mt-1 block w-full border border-line px-3 py-2.5 outline-none focus:border-ink aria-[invalid=true]:border-danger';

type Saved = AddressValues & { id: string; label?: string; isDefault: boolean };

const blank = (name: string): AddressValues => ({ fullName: name, line1: '', line2: '', city: '', state: '', postalCode: '', country: 'United States' });
const fromSaved = (a: Omit<Saved, 'line2' | 'state'> & { line2?: string; state?: string }): AddressValues => ({
  fullName: a.fullName,
  line1: a.line1,
  line2: a.line2 ?? '',
  city: a.city,
  state: a.state ?? '',
  postalCode: a.postalCode,
  country: a.country,
});

export function CheckoutForm({
  name,
  addresses = [],
}: {
  name: string;
  addresses?: (Omit<Saved, 'line2' | 'state'> & { line2?: string; state?: string })[];
}) {
  const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [savedId, setSavedId] = useState<string>(preferred?.id ?? 'new');
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
  const router = useRouter();
  const { refresh } = useCartActions();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: preferred ? fromSaved(preferred) : blank(name),
    mode: 'onTouched',
  });
  const pickAddress = (id: string) => {
    setSavedId(id);
    const a = addresses.find((x) => x.id === id);
    reset(a ? fromSaved(a) : blank(name));
  };

  useEffect(() => {
    clientApi<{ data: Quote }>('/cart/quote', { method: 'POST', body: '{}' })
      .then((r) => setQuote(r.data))
      .catch((e: Error) => setError(e.message));
  }, []);

  const applyCode = async () => {
    setCodeError(null);
    try {
      const body = JSON.stringify(code ? { discountCode: code } : {});
      setQuote((await clientApi<{ data: Quote }>('/cart/quote', { method: 'POST', body })).data);
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : 'Invalid code');
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setBusy(true);
    setError(null);
    try {
      if (saveAddress && savedId === 'new') {
        // a convenience: the order goes ahead even if saving the address fails
        await clientApi('/account/addresses', { method: 'POST', body: JSON.stringify(toShippingAddress(values)) }).catch(() => {});
      }
      const { data } = await clientApi<{ data: { id: string } }>('/cart/checkout', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: toShippingAddress(values),
          ...(quote?.discountCode ? { discountCode: quote.discountCode } : {}),
        }),
      });
      await refresh();
      try {
        await startPayment(data.id);
      } catch {
        // the order exists; its page has a Pay now button to try again
        router.push(`/account/orders/${data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(false);
    }
  });

  const input = (key: keyof AddressValues, label: string, autoComplete: string, wide = false) => (
    <div className={wide ? 'col-span-2' : undefined}>
      <label htmlFor={`ship-${key}`}>{label}</label>
      <input
        id={`ship-${key}`}
        {...register(key)}
        autoComplete={autoComplete}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `ship-${key}-error` : undefined}
        className={field}
      />
      {errors[key] && <p id={`ship-${key}-error`} className="mt-1 text-[12px] text-danger">{errors[key]?.message}</p>}
    </div>
  );

  if (quote && quote.items.length === 0) {
    return <p className="py-10 text-center text-mute">Your cart is empty.</p>;
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
      <form id="checkout" onSubmit={onSubmit} noValidate className="grid grid-cols-2 gap-4 text-[14px]">
        <h2 className="heading col-span-2 text-[22px]">Shipping address</h2>
        <p className="col-span-2 border border-line bg-soft px-3 py-2 text-[13px]">
          Demo shop: please don’t enter real personal data. The demo account is shared and all orders are deleted every night.
        </p>
        {addresses.length > 0 && (
          <fieldset className="col-span-2">
            <legend className="mb-2">Ship to</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {addresses.map((a) => (
                <label key={a.id} className="flex cursor-pointer gap-3 border border-line p-3 has-[:checked]:border-ink">
                  <input type="radio" name="saved-address" checked={savedId === a.id} onChange={() => pickAddress(a.id)} className="mt-1" />
                  <span>
                    <span className="block font-medium">{a.label || a.fullName}</span>
                    <span className="block text-mute">{[a.line1, a.city, a.postalCode].join(', ')}</span>
                  </span>
                </label>
              ))}
              <label className="flex cursor-pointer gap-3 border border-line p-3 has-[:checked]:border-ink">
                <input type="radio" name="saved-address" checked={savedId === 'new'} onChange={() => pickAddress('new')} className="mt-1" />
                <span className="font-medium">A new address</span>
              </label>
            </div>
          </fieldset>
        )}
        {input('fullName', 'Full name', 'name', true)}
        {input('line1', 'Address', 'address-line1', true)}
        {input('line2', 'Apartment, suite (optional)', 'address-line2', true)}
        {input('city', 'City', 'address-level2')}
        {input('state', 'State / region', 'address-level1')}
        {input('postalCode', 'Postal code', 'postal-code')}
        {input('country', 'Country', 'country-name')}
        {savedId === 'new' && (
          <label className="col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-4 w-4" />
            Save this address for next time
          </label>
        )}
      </form>
      <aside className="self-start border border-line bg-soft p-6" aria-label="Order summary">
        <h2 className="heading text-[22px]">Order summary</h2>
        {!quote ? (
          <p className="mt-4 text-mute">Loading…</p>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {quote.items.map((i) => (
                <li key={i.productId + i.sku} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 text-[14px]">
                  <div className="relative h-14 bg-white">{i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-contain" />}</div>
                  <div>{i.title}<div className="text-mute">Size {i.size} · Qty {i.quantity}</div></div>
                  <div>{formatMoney(i.price * i.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex border border-line bg-white">
              <label htmlFor="code" className="sr-only">Discount code</label>
              <input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Discount code (try WELCOME10)" className="min-w-0 flex-1 px-3 py-2.5 text-[14px] outline-none" />
              <button type="button" onClick={applyCode} className="border-l border-line px-4 text-[11px] font-medium tracking-[0.16em]">APPLY</button>
            </div>
            {codeError && <p role="alert" className="mt-2 text-[13px] text-danger">{codeError}</p>}
            <dl className="mt-5 space-y-1 text-[14.5px]">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(quote.subtotal)}</dd></div>
              {quote.discountAmount > 0 && (
                <div className="flex justify-between"><dt>Discount ({quote.discountCode})</dt><dd>−{formatMoney(quote.discountAmount)}</dd></div>
              )}
              <div className="flex justify-between"><dt>Shipping</dt><dd>Free</dd></div>
              <div className="flex justify-between border-t border-line pt-3 font-serif text-[22px] font-bold"><dt>Total</dt><dd data-testid="checkout-total">{formatMoney(quote.total)}</dd></div>
            </dl>
          </>
        )}
        {error && <p role="alert" className="mt-3 text-[14px] text-danger">{error}</p>}
        <button type="submit" form="checkout" disabled={busy || !quote} className="btn mt-6 w-full">
          Continue to payment
        </button>
      </aside>
    </div>
  );
}
