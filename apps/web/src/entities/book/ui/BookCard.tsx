import Link from 'next/link';
import type { Book } from '../model/types';
import { formatPrice } from '@/shared/lib/format';
import { FeaturedBadge } from './FeaturedBadge';

export function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-[3/4] bg-slate-100">
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">No cover</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
            {book.title}
          </h2>
          {book.featured ? <FeaturedBadge /> : null}
        </div>
        <p className="text-xs text-slate-500">{book.author}</p>
        <p className="mt-auto pt-2 text-sm font-medium text-indigo-700">
          {formatPrice(book.price, book.currency)}
        </p>
      </div>
    </Link>
  );
}
