import type { Router } from 'express';
import booksRoutes from './routes/books.routes';
import uploadsRoutes from './routes/uploads.routes';

export function registerCatalogRoutes(api: Router): void {
  api.use('/books', booksRoutes);
  api.use('/uploads', uploadsRoutes);
}
