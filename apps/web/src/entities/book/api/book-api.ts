import { apiGetJson } from '@/shared/api';
import type { ApiData, ApiPaginated } from '@/shared/api';
import type { Book, BookListParams, BookStockSnapshot } from '../model/types';

const defaultInit = { cache: 'force-cache' as RequestCache };

function toQuery(params: BookListParams = {}): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/** Public catalog list — layered API GET /api/v1/books */
export async function fetchBooks(params: BookListParams = {}): Promise<ApiPaginated<Book>> {
  return apiGetJson<ApiPaginated<Book>>(`/books${toQuery({ limit: 40, ...params })}`, defaultInit);
}

/** Public book detail — layered API GET /api/v1/books/:id */
export async function fetchBook(id: string): Promise<Book> {
  const res = await apiGetJson<ApiData<Book>>(`/books/${id}`, defaultInit);
  return res.data;
}

/** Fresh stock (always no-store) — used by PPR dynamic hole / SSR demos */
export async function fetchBookStock(
  id: string,
): Promise<BookStockSnapshot> {
  const book = await apiGetJson<ApiData<Book>>(`/books/${id}`, { cache: 'no-store' });
  return { id: book.data.id, stock: book.data.stock, updatedAt: book.data.updatedAt };
}
