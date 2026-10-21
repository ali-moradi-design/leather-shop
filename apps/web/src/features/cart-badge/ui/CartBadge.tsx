import { cookies } from 'next/headers';
import { connection } from 'next/server';

/** Dynamic hole: cart count from cookie (request-time). */
export async function CartBadge() {
  await connection();
  const jar = await cookies();
  const raw = jar.get('niko_cart_count')?.value;
  const count = Number(raw || '0') || 0;
  return (
    <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
      Cart {count}
    </span>
  );
}
