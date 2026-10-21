export interface Book {
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
  createdAt: string;
  updatedAt: string;
}

export interface BookListParams {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
  sort?: 'price' | 'title' | 'createdAt';
  order?: 'asc' | 'desc';
  inStock?: boolean;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

/** Narrow public stock snapshot for dynamic holes. */
export interface BookStockSnapshot {
  id: string;
  stock: number;
  updatedAt: string;
}
