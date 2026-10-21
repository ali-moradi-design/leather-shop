import type { Book } from '../domain/book.entity';

function idOf(doc: { id?: string; _id?: { toString(): string } }): string {
  return doc.id ?? doc._id!.toString();
}

export function mapBook(doc: {
  id?: string;
  _id?: { toString(): string };
  title: string;
  author: string;
  description: string;
  isbn?: string;
  price: number;
  currency: string;
  stock: number;
  coverImageUrl?: string;
  categories?: string[];
  featured?: boolean;
  featuredOrder?: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Book {
  return {
    id: idOf(doc),
    title: doc.title,
    author: doc.author,
    description: doc.description,
    isbn: doc.isbn,
    price: doc.price,
    currency: doc.currency,
    stock: doc.stock,
    coverImageUrl: doc.coverImageUrl,
    categories: doc.categories,
    featured: Boolean(doc.featured),
    featuredOrder: doc.featuredOrder,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
