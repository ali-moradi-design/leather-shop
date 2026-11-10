import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireUser } from '@/features/auth/server';
import type { Account } from '@/features/account';
import { CheckoutForm } from '@/features/checkout';
import { serverApi } from '@/shared/api/server';
import { Skeleton } from '@/shared/ui';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

async function Checkout() {
  await requireUser('/checkout');
  const { data: account } = await serverApi<{ data: Account }>('/account');
  return <CheckoutForm name={account.name} addresses={account.addresses} />;
}

export default function CheckoutPage() {
  return (
    <div className="container-content py-14">
      <h1 className="heading mb-8 text-[32px]">Checkout</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Checkout />
      </Suspense>
    </div>
  );
}
