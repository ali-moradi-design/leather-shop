'use server';

import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Product } from '@/entities/product';
import type { OrderStatus } from '@/entities/order';
import { ApiError } from '@/shared/api';
import { serverMutate, serverApi } from '@/shared/api/server';
import {
  discountFormSchema,
  issuesToFieldErrors,
  productFormSchema,
  toCents,
  toProductPayload,
  type ActionResult,
  type DiscountFormValues,
  type ProductFormValues,
} from '../model/product-form';

/*
 * Admin writes. Each action calls the API with the visitor's own cookies, and the
 * API checks the admin permission, so these are safe to expose: a customer (or a
 * forged POST) gets a 403 and nothing is cached or changed. On success the action
 * drops the cached catalog (updateTag) so shoppers see the change on their next
 * request, and the admin page re-renders in the same round trip.
 */

/** API errors become a message for the form; an expired session goes to sign-in. */
function failure(err: unknown, from: string): ActionResult {
  if (err instanceof ApiError && err.status === 401) redirect(`/account/login?next=${encodeURIComponent(from)}`);
  const message = err instanceof Error ? err.message : 'Something went wrong';
  return { status: 'error', message };
}

function catalogChanged(...slugs: (string | undefined)[]) {
  updateTag('products');
  for (const slug of new Set(slugs)) if (slug) updateTag(`product:${slug}`);
}

/**
 * Creates (no id) or updates a product. The form already validated with the same
 * zod schema; it runs again here because a Server Action can be called directly.
 */
export async function saveProduct(
  id: string | undefined,
  values: ProductFormValues,
  previousSlug?: string,
): Promise<ActionResult> {
  const parsed = productFormSchema.safeParse(values);
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: issuesToFieldErrors(parsed.error) };
  }
  const data = toProductPayload(values);
  let saved: Product;
  try {
    if (id) {
      saved = (await serverMutate<{ data: Product }>(`/products/${encodeURIComponent(id)}`, 'PATCH', data)).data;
    } else {
      const { compareAtPrice, ...rest } = data;
      const body = compareAtPrice === null ? rest : { ...rest, compareAtPrice };
      saved = (await serverMutate<{ data: Product }>('/products', 'POST', body)).data;
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { status: 'error', message: 'Another product already uses this URL name.', fieldErrors: { slug: 'Already in use' } };
    }
    return failure(err, id ? `/admin/products/${id}` : '/admin/products/new');
  }
  catalogChanged(saved.slug, previousSlug);
  if (!id) redirect(`/admin/products/${saved.id}?created=1`);
  return { status: 'ok', message: 'Saved. The shop shows the change now.' };
}

export async function deleteProduct(id: string, slug: string): Promise<ActionResult> {
  try {
    await serverMutate(`/products/${encodeURIComponent(id)}`, 'DELETE');
  } catch (err) {
    return failure(err, '/admin/products');
  }
  catalogChanged(slug);
  return { status: 'ok', message: 'Moved to the trash.' };
}

export async function restoreProduct(id: string): Promise<ActionResult> {
  let product: Product;
  try {
    product = (await serverMutate<{ data: Product }>(`/products/${encodeURIComponent(id)}/restore`, 'POST')).data;
  } catch (err) {
    return failure(err, '/admin/products/trash');
  }
  catalogChanged(product.slug);
  return { status: 'ok', message: `${product.title} is back in the shop.` };
}

export type BulkAction =
  | { kind: 'delete' }
  | { kind: 'feature'; on: boolean }
  | { kind: 'discount'; percent: number }
  | { kind: 'end-sale' };

/** One change applied to several products; reports how many succeeded. */
export async function bulkUpdateProducts(ids: string[], action: BulkAction): Promise<ActionResult> {
  if (ids.length === 0 || ids.length > 100) return { status: 'error', message: 'Select between 1 and 100 products.' };
  if (action.kind === 'discount' && !(action.percent > 0 && action.percent < 100)) {
    return { status: 'error', message: 'Enter a discount between 1 and 99 percent.' };
  }
  const slugs: string[] = [];
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const path = `/products/${encodeURIComponent(id)}`;
      if (action.kind === 'delete') return serverMutate(path, 'DELETE');
      if (action.kind === 'feature') return serverMutate(path, 'PATCH', { featured: action.on });
      const { data: p } = await serverApi<{ data: Product }>(path);
      slugs.push(p.slug);
      if (action.kind === 'end-sale') {
        if (!p.compareAtPrice) return;
        return serverMutate(path, 'PATCH', { price: p.compareAtPrice, compareAtPrice: null });
      }
      const original = p.compareAtPrice ?? p.price;
      return serverMutate(path, 'PATCH', {
        price: Math.round((original * (100 - action.percent)) / 100),
        compareAtPrice: original,
      });
    }),
  );
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.some((r) => r.reason instanceof ApiError && r.reason.status === 401)) {
    redirect('/account/login?next=/admin/products');
  }
  catalogChanged(...slugs);
  const done = results.length - failed.length;
  if (failed.length) return { status: 'error', message: `${done} updated, ${failed.length} failed.` };
  return { status: 'ok', message: `${done} product${done === 1 ? '' : 's'} updated.` };
}

export async function updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<ActionResult> {
  try {
    await serverMutate(`/orders/${encodeURIComponent(id)}/status`, 'PATCH', { status, ...(note ? { note } : {}) });
  } catch (err) {
    return failure(err, `/admin/orders/${id}`);
  }
  // Cancelling returns stock, so product pages may change too.
  if (status === 'cancelled') catalogChanged();
  else refresh();
  return { status: 'ok', message: 'Status updated.' };
}

/** Creates a discount code. Fixed amounts and the minimum order come in dollars. */
export async function createDiscount(values: DiscountFormValues): Promise<ActionResult> {
  const parsed = discountFormSchema.safeParse(values);
  if (!parsed.success) {
    return { status: 'error', message: 'Please fix the highlighted fields.', fieldErrors: issuesToFieldErrors(parsed.error) };
  }
  const v = parsed.data;
  try {
    await serverMutate('/discounts', 'POST', {
      code: v.code,
      type: v.type,
      value: v.type === 'fixed' ? toCents(v.value) : Number(v.value),
      ...(v.minOrderAmount ? { minOrderAmount: toCents(v.minOrderAmount) } : {}),
      ...(v.maxUses ? { maxUses: Number(v.maxUses) } : {}),
      ...(v.endsAt ? { endsAt: new Date(`${v.endsAt}T23:59:59Z`).toISOString() } : {}),
      isActive: true,
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { status: 'error', message: 'This code already exists.', fieldErrors: { code: 'Already exists' } };
    }
    return failure(err, '/admin/discounts');
  }
  refresh();
  return { status: 'ok', message: `${v.code} is live.` };
}

export async function setDiscountActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await serverMutate(`/discounts/${encodeURIComponent(id)}`, 'PATCH', { isActive });
  } catch (err) {
    return failure(err, '/admin/discounts');
  }
  refresh();
  return { status: 'ok', message: isActive ? 'Activated.' : 'Paused.' };
}

export async function deleteDiscount(id: string): Promise<ActionResult> {
  try {
    await serverMutate(`/discounts/${encodeURIComponent(id)}`, 'DELETE');
  } catch (err) {
    return failure(err, '/admin/discounts');
  }
  refresh();
  return { status: 'ok', message: 'Deleted.' };
}

/** Activates or blocks a customer account. */
export async function setUserActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await serverMutate(`/users/${encodeURIComponent(id)}`, 'PATCH', { isActive });
  } catch (err) {
    return failure(err, '/admin/customers');
  }
  refresh();
  return { status: 'ok', message: isActive ? 'Account active.' : 'Account blocked.' };
}

/** Replaces the user's roles with the given role ids. */
export async function setUserRoles(id: string, roles: string[]): Promise<ActionResult> {
  try {
    await serverMutate(`/users/${encodeURIComponent(id)}`, 'PATCH', { roles });
  } catch (err) {
    return failure(err, '/admin/customers');
  }
  refresh();
  return { status: 'ok', message: 'Roles updated.' };
}

export async function deleteReview(id: string, productSlug?: string): Promise<ActionResult> {
  try {
    await serverMutate(`/reviews/${encodeURIComponent(id)}`, 'DELETE');
  } catch (err) {
    return failure(err, '/admin/reviews');
  }
  // The product's average rating changed.
  catalogChanged(productSlug);
  return { status: 'ok', message: 'Review removed.' };
}
