import type { Product, CreateProductInput, UpdateProductInput, ProductListFilter } from './product.entity';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  list(filter: ProductListFilter): Promise<{ data: Product[]; total: number }>;
  listFeatured(limit?: number): Promise<Product[]>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: UpdateProductInput): Promise<Product | null>;
  softDelete(id: string): Promise<Product | null>;
  decrementStock(productId: string, quantity: number): Promise<boolean>;
  incrementStock(productId: string, quantity: number): Promise<void>;
  upsertByIsbn(
    isbn: string,
    data: CreateProductInput & { coverImageUrl: string },
  ): Promise<Product>;
  count(): Promise<number>;
  countLowStock(threshold: number): Promise<number>;
  findLowStock(threshold: number, limit?: number): Promise<Product[]>;
}
