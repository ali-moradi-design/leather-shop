import type { Router } from 'express';
import productsRoutes from './routes/products.routes';
import uploadsRoutes from './routes/uploads.routes';
import { catalogExtrasRouter } from '../extras';

export function registerCatalogRoutes(api: Router): void {
  // before productsRoutes, whose /:id would swallow /suggest
  api.use('/products', catalogExtrasRouter);
  api.use('/products', productsRoutes);
  api.use('/uploads', uploadsRoutes);
}
