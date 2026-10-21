export { registerCatalogRoutes } from './http/registerRoutes';
export { productRepo, productService } from './infra/wiring';
export type { Product, CreateProductInput, UpdateProductInput, ProductListFilter } from './domain/product.entity';
export type { IProductRepository } from './domain/product.repository';
export {
  assertPositiveQuantity,
  assertSufficientStock,
  isStockLow,
  DEFAULT_LOW_STOCK_THRESHOLD,
} from './domain/rules/stock';
export { productsPaths } from './http/docs/products.paths';
export { uploadsPaths } from './http/docs/uploads.paths';
