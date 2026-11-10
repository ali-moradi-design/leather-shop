import { domainEvents, stockRestoredEvent } from '@shared/domain/events';
import type { IProductRepository } from '@modules/catalog/domain/product.repository';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductListFilter,
  ProductFacets,
} from '@modules/catalog/domain/product.entity';
import { AppError } from '@shared/errors/AppError';
import { paginate } from '@shared/pagination';

export class ProductService {
  constructor(private readonly products: IProductRepository) {}

  async list(filter: ProductListFilter) {
    const { page, limit } = paginate(filter.page, filter.limit);
    const { data, total } = await this.products.list({ ...filter, page, limit });
    return { data, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  facets(filter: Pick<ProductListFilter, 'category' | 'gender'>): Promise<ProductFacets> {
    return this.products.facets(filter);
  }

  async listFeatured(limit = 20): Promise<Product[]> {
    return this.products.listFeatured(limit);
  }

  async getById(id: string): Promise<Product> {
    const product = await this.products.findById(id);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async getBySlug(slug: string): Promise<Product> {
    const product = await this.products.findBySlug(slug);
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  /** The other colors of the same style, in display order. */
  async colors(slug: string): Promise<Product[]> {
    const product = await this.getBySlug(slug);
    return this.products.listByStyle(product.style);
  }

  async create(input: CreateProductInput): Promise<Product> {
    return this.products.create(input);
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const before = input.variants ? await this.products.findById(id) : null;
    const product = await this.products.update(id, input);
    if (!product) throw new AppError('Product not found', 404);
    // sizes that were sold out and now have stock: tell whoever asked to be notified
    if (before) {
      const wasOut = new Set(before.variants.filter((v) => v.stock === 0).map((v) => v.sku));
      const skus = product.variants.filter((v) => v.stock > 0 && wasOut.has(v.sku)).map((v) => v.sku);
      if (skus.length) await domainEvents.publish(stockRestoredEvent({ productId: product.id, skus }));
    }
    return product;
  }

  async listDeleted(page?: number, limit?: number) {
    const p = paginate(page, limit);
    const { data, total } = await this.products.listDeleted(p.page, p.limit);
    return { data, meta: { page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) } };
  }

  async restore(id: string): Promise<Product> {
    const product = await this.products.restore(id);
    if (!product) throw new AppError('Deleted product not found', 404);
    return product;
  }

  async remove(id: string): Promise<void> {
    const product = await this.products.softDelete(id);
    if (!product) throw new AppError('Product not found', 404);
  }
}
