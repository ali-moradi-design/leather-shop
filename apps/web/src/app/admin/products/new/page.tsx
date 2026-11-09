import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageHeader, ProductForm } from '@/features/admin';
import { requireAdmin } from '@/features/auth/server';
import { Skeleton } from '@/shared/ui';
import { productFormOptions } from '../form-options';

export const metadata: Metadata = { title: 'New product' };

async function NewProduct() {
  const [, options] = await Promise.all([requireAdmin('/admin/products/new'), productFormOptions()]);
  return <ProductForm options={options} />;
}

export default function NewProductPage() {
  return (
    <div>
      <Link href="/admin/products" className="text-[13px] text-mute underline">← All products</Link>
      <div className="mt-3">
        <PageHeader title="New product" />
      </div>
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <NewProduct />
      </Suspense>
    </div>
  );
}
