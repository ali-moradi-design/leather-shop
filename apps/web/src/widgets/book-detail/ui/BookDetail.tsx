import type { Book } from '@/entities/book';
import { BookMeta } from '@/entities/book';
import type { ReactNode } from 'react';

export function BookDetail({
  book,
  stockSlot,
}: {
  book: Book;
  /** Pass `null` to hide stock; omit for default stock line. */
  stockSlot?: ReactNode | null;
}) {
  return (
    <article className="grid gap-8 md:grid-cols-[240px_1fr]">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverImageUrl} alt={book.title} className="w-full object-cover" />
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center text-slate-400">No cover</div>
        )}
      </div>
      <div className="space-y-4">
        <BookMeta book={book} />
        {stockSlot !== undefined ? (
          stockSlot
        ) : (
          <p className="text-sm text-slate-600">
            In stock: <strong>{book.stock}</strong>
          </p>
        )}
      </div>
    </article>
  );
}
