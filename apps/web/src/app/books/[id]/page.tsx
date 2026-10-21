import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { fetchBook, fetchBooks } from '@/entities/book';
import { BookDetail } from '@/widgets/book-detail';
import { FreshStock } from '@/features/fresh-stock';
import { Spinner } from '@/shared/ui/Spinner';


export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<{ title: string; description?: string }> {
  const { id } = await params;
  try {
    const book = await fetchBook(id);
    return { title: `${book.title} · Niko Bookshop`, description: book.description.slice(0, 160) };
  } catch {
    return { title: 'Book · Niko Bookshop' };
  }
}

export async function generateStaticParams() {
  const { data: books } = await fetchBooks({ limit: 100 });
  return books.map((b) => ({ id: b.id }));
}

/** Cached static shell for book metadata (cover, title, price, description). */
async function CachedBookMeta({ id }: { id: string }) {
  'use cache';
  cacheLife('hours');
  try {
    const book = await fetchBook(id);
    return <BookDetail book={book} stockSlot={null} />;
  } catch {
    return null;
  }
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await CachedBookMeta({ id });
  if (!meta) notFound();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-indigo-700 hover:underline">
        ← Catalog
      </Link>
      {meta}
      {/* Dynamic PPR hole — outside use cache */}
      <Suspense fallback={<Spinner label="Checking stock…" />}>
        <FreshStock bookId={id} />
      </Suspense>
    </div>
  );
}
