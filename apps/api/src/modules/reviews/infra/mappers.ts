import type { Review } from '../domain/review.entity';

function idOf(doc: { id?: string; _id?: { toString(): string } }): string {
  return doc.id ?? doc._id!.toString();
}

export function mapReview(doc: {
  id?: string;
  _id?: { toString(): string };
  book: unknown;
  user: unknown;
  rating: number;
  comment?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Review {
  const bookObj = doc.book as { _id?: { toString(): string }; id?: string; title?: string; author?: string; toString?: () => string };
  const userObj = doc.user as { _id?: { toString(): string }; id?: string; name?: string; email?: string; toString?: () => string };

  const bookId =
    bookObj && typeof bookObj === 'object' && (bookObj._id || bookObj.id)
      ? (bookObj.id ?? bookObj._id!.toString())
      : String(doc.book);
  const userId =
    userObj && typeof userObj === 'object' && (userObj._id || userObj.id)
      ? (userObj.id ?? userObj._id!.toString())
      : String(doc.user);

  const review: Review = {
    id: idOf(doc),
    book: bookId,
    user: userId,
    rating: doc.rating,
    comment: doc.comment,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (bookObj?.title || userObj?.name) {
    review.populated = {};
    if (userObj?.name) {
      review.populated.user = { name: userObj.name, email: userObj.email ?? '' };
    }
    if (bookObj?.title) {
      review.populated.book = { title: bookObj.title, author: bookObj.author ?? '' };
    }
  }
  return review;
}
