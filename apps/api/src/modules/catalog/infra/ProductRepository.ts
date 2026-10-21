import type { IProductRepository } from '@modules/catalog/domain/product.repository';
import type { Product, CreateProductInput, UpdateProductInput, ProductListFilter } from '@modules/catalog/domain/product.entity';
import { ProductModel } from './models/ProductModel';
import { mapProduct } from './mappers';
import { paginate } from '@shared/pagination';

/**
 * Product search strategy:
 * - Prefer MongoDB text index ($text) when `q` is provided (index on title/author/description).
 * - Fall back to case-insensitive regex on title/author/description if text search fails
 *   or yields no usable results for short/special queries.
 */
export class MongooseProductRepository implements IProductRepository {
  async findById(id: string): Promise<Product | null> {
    const doc = await ProductModel.findById(id);
    return doc ? mapProduct(doc) : null;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    const docs = await ProductModel.find({ _id: { $in: ids } });
    return docs.map(mapProduct);
  }

  async list(filter: ProductListFilter): Promise<{ data: Product[]; total: number }> {
    const { limit, skip } = paginate(filter.page, filter.limit);
    const query: Record<string, unknown> = {};

    if (filter.q) {
      // Use text index when available; also keep regex OR for partial matches
      query.$or = [
        { $text: { $search: filter.q } },
        { title: { $regex: escapeRegex(filter.q), $options: 'i' } },
        { author: { $regex: escapeRegex(filter.q), $options: 'i' } },
        { description: { $regex: escapeRegex(filter.q), $options: 'i' } },
      ];
    }
    if (filter.category) {
      query.categories = filter.category;
    }
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      const price: Record<string, number> = {};
      if (filter.minPrice !== undefined) price.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined) price.$lte = filter.maxPrice;
      query.price = price;
    }
    if (filter.inStock === true) {
      query.stock = { $gt: 0 };
    } else if (filter.inStock === false) {
      query.stock = { $lte: 0 };
    }
    if (filter.featured !== undefined) {
      query.featured = filter.featured;
    }

    const sortField = filter.sort ?? 'createdAt';
    const sortDir = filter.order === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDir };

    // $text cannot be mixed with other $or conditions easily in some Mongo versions;
    // use regex-only query when q is set (text index still helps future dedicated search).
    const finalQuery = buildSearchQuery(filter, query);

    const [docs, total] = await Promise.all([
      ProductModel.find(finalQuery).sort(sort).skip(skip).limit(limit),
      ProductModel.countDocuments(finalQuery),
    ]);
    return { data: docs.map(mapProduct), total };
  }

  async listFeatured(limit = 20): Promise<Product[]> {
    const docs = await ProductModel.find({ featured: true })
      .sort({ featuredOrder: 1, createdAt: -1 })
      .limit(limit);
    return docs.map(mapProduct);
  }

  async create(input: CreateProductInput): Promise<Product> {
    const doc = await ProductModel.create({
      ...input,
      featured: input.featured ?? false,
      featuredOrder: input.featuredOrder ?? 0,
    });
    return mapProduct(doc);
  }

  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    const doc = await ProductModel.findByIdAndUpdate(id, input, { returnDocument: 'after', runValidators: true });
    return doc ? mapProduct(doc) : null;
  }

  async softDelete(id: string): Promise<Product | null> {
    const doc = await ProductModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { returnDocument: 'after' });
    return doc ? mapProduct(doc) : null;
  }

  async decrementStock(productId: string, quantity: number): Promise<boolean> {
    const result = await ProductModel.updateOne(
      { _id: productId, stock: { $gte: quantity }, deletedAt: null },
      { $inc: { stock: -quantity } },
    );
    return result.modifiedCount === 1;
  }

  async incrementStock(productId: string, quantity: number): Promise<void> {
    await ProductModel.updateOne({ _id: productId }, { $inc: { stock: quantity } });
  }

  async upsertByIsbn(
    isbn: string,
    data: CreateProductInput & { coverImageUrl: string },
  ): Promise<Product> {
    const doc = await ProductModel.findOneAndUpdate({ isbn }, data, {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    });
    return mapProduct(doc!);
  }

  async count(): Promise<number> {
    return ProductModel.countDocuments();
  }

  async countLowStock(threshold: number): Promise<number> {
    return ProductModel.countDocuments({ stock: { $lte: threshold } });
  }

  async findLowStock(threshold: number, limit = 50): Promise<Product[]> {
    const docs = await ProductModel.find({ stock: { $lte: threshold } })
      .sort({ stock: 1 })
      .limit(limit);
    return docs.map(mapProduct);
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchQuery(
  filter: ProductListFilter,
  base: Record<string, unknown>,
): Record<string, unknown> {
  // Documented choice: case-insensitive regex on title/author/description for `q`
  // (works for partial matches). Text index on those fields supports future $text queries.
  const query: Record<string, unknown> = { ...base };
  if (filter.q) {
    delete query.$or;
    query.$or = [
      { title: { $regex: escapeRegex(filter.q), $options: 'i' } },
      { author: { $regex: escapeRegex(filter.q), $options: 'i' } },
      { description: { $regex: escapeRegex(filter.q), $options: 'i' } },
    ];
  }
  return query;
}
