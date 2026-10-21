import { Request, Response } from 'express';
import { productService } from '../../infra/wiring';
import { asyncHandler } from '@shared/http/asyncHandler';
import { presentProduct, presentProducts } from '../presenters/product.presenter';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.list({
    q: req.query.q as string | undefined,
    category: req.query.category as string | undefined,
    minPrice: req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined,
    inStock: req.query.inStock as boolean | undefined,
    featured: req.query.featured as boolean | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    sort: (req.query.sort as 'price' | 'title' | 'createdAt') || 'createdAt',
    order: (req.query.order as 'asc' | 'desc') || 'desc',
  });
  res.json({ ...result, data: presentProducts(result.data) });
});

export const listFeatured = asyncHandler(async (_req: Request, res: Response) => {
  const data = await productService.listFeatured(20);
  res.json({ data: presentProducts(data) });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getById(String(req.params.id));
  res.json({ data: presentProduct(product) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.create(req.body);
  res.status(201).json({ data: presentProduct(product) });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.update(String(req.params.id), req.body);
  res.json({ data: presentProduct(product) });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await productService.remove(String(req.params.id));
  res.json({ message: 'Product soft-deleted' });
});
