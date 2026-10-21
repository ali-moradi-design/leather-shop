import type { Book } from '../model/types';
import { formatPrice } from '@/shared/lib/format';

export function BookMeta({ book }: { book: Book }) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{book.title}</h1>
      <p className="text-lg text-slate-600">by {book.author}</p>
      <p className="text-2xl font-semibold text-indigo-700">
        {formatPrice(book.price, book.currency)}
      </p>
      {book.categories?.length ? (
        <ul className="flex flex-wrap gap-2 pt-1">
          {book.categories.map((c) => (
            <li key={c} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {c}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="pt-4 text-slate-700 leading-relaxed">{book.description}</p>
      {book.isbn ? <p className="text-xs text-slate-400">ISBN {book.isbn}</p> : null}
    </div>
  );
}
