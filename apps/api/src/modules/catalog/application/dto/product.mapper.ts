import type { Product } from '@modules/catalog/domain/product.entity';

/** HTTP-safe product shape (no deletedAt internals required). */
export interface ProductDto {
  id: string;
  title: string;
  author: string;
  description: string;
  isbn?: string;
  price: number;
  currency: string;
  stock: number;
  coverImageUrl?: string;
  categories?: string[];
  featured: boolean;
  featuredOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    title: product.title,
    author: product.author,
    description: product.description,
    isbn: product.isbn,
    price: product.price,
    currency: product.currency,
    stock: product.stock,
    coverImageUrl: product.coverImageUrl,
    categories: product.categories,
    featured: product.featured,
    featuredOrder: product.featuredOrder,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
