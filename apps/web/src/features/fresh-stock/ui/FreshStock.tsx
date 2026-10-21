import { fetchBookStock } from '@/entities/book';
import { connection } from 'next/server';

/** Dynamic hole: always-fresh stock via no-store fetch. */
export async function FreshStock({ bookId }: { bookId: string }) {
  await connection();
  const { stock, updatedAt } = await fetchBookStock(bookId);
  return (
    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
      Live stock: <strong>{stock}</strong>
      <span className="ml-2 text-xs opacity-70">as of {new Date(updatedAt).toLocaleString()}</span>
    </p>
  );
}
