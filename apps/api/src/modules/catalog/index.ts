export { registerCatalogRoutes } from './http/registerRoutes';
export { bookRepo, bookService } from './infra/wiring';
export type { Book, CreateBookInput, UpdateBookInput, BookListFilter } from './domain/book.entity';
export type { IBookRepository } from './domain/book.repository';
export {
  assertPositiveQuantity,
  assertSufficientStock,
  isStockLow,
  DEFAULT_LOW_STOCK_THRESHOLD,
} from './domain/rules/stock';
export { booksPaths } from './http/docs/books.paths';
export { uploadsPaths } from './http/docs/uploads.paths';
