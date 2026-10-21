import { BookCard, type Book } from '@/entities/book';
import { EmptyState } from '@/shared/ui';

export function CatalogList({
  books,
  labelledBy,
}: {
  books: Book[];
  labelledBy?: string;
}) {
  if (!books.length) {
    return <EmptyState title="No books yet" hint="Seed the layered API and rebuild." />;
  }
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      role="list"
      aria-labelledby={labelledBy}
    >
      {books.map((book) => (
        <div key={book.id} role="listitem">
          <BookCard book={book} />
        </div>
      ))}
    </div>
  );
}
