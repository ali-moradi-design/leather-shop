import type { Favorite } from '../domain/favorite.entity';

function idOf(doc: { id?: string; _id?: { toString(): string } }): string {
  return doc.id ?? doc._id!.toString();
}

export function mapFavorite(doc: {
  id?: string;
  _id?: { toString(): string };
  userId: { toString(): string };
  bookId: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Favorite {
  const bookObj = doc.bookId as {
    _id?: { toString(): string };
    id?: string;
    title?: string;
    author?: string;
    price?: number;
    coverImageUrl?: string;
    toString?: () => string;
  };
  const bookId =
    bookObj && typeof bookObj === 'object' && (bookObj._id || bookObj.id)
      ? (bookObj.id ?? bookObj._id!.toString())
      : String(doc.bookId);

  const fav: Favorite = {
    id: idOf(doc),
    userId: doc.userId.toString(),
    bookId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (bookObj?.title) {
    fav.populated = {
      book: {
        id: bookId,
        title: bookObj.title,
        author: bookObj.author ?? '',
        price: bookObj.price ?? 0,
        coverImageUrl: bookObj.coverImageUrl,
      },
    };
  }
  return fav;
}
