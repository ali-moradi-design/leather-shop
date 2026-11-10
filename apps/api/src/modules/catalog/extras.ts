import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Schema, model, Types } from 'mongoose';
import { z } from 'zod';
import { optionalAuthenticate } from '@modules/identity/http/middleware';
import { validate } from '@shared/http/middleware/validate';
import { asyncHandler } from '@shared/http/asyncHandler';
import { AppError } from '@shared/errors/AppError';
import { env } from '@shared/config/env';
import { mailer, templates } from '@modules/messaging/mail';
import { ProductModel } from './infra/models/ProductModel';

/* Back-in-stock alerts and search suggestions. */

interface IStockAlertDoc {
  product: Types.ObjectId;
  sku: string;
  email: string;
  notifiedAt?: Date | null;
  createdAt: Date;
}

const stockAlertSchema = new Schema<IStockAlertDoc>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
// one open alert per address and size
stockAlertSchema.index({ product: 1, sku: 1, email: 1 }, { unique: true, partialFilterExpression: { notifiedAt: null } });
stockAlertSchema.index({ product: 1, sku: 1, notifiedAt: 1 });

export const StockAlertModel = model<IStockAlertDoc>('StockAlert', stockAlertSchema);

/** Emails everyone waiting for these sizes, once. */
export async function notifyBackInStock(productId: string, skus: string[]): Promise<number> {
  const product = await ProductModel.findById(productId).select('title slug variants deletedAt').lean();
  if (!product || product.deletedAt) return 0;
  const alerts = await StockAlertModel.find({ product: productId, sku: { $in: skus }, notifiedAt: null }).lean();
  for (const a of alerts) {
    const variant = product.variants.find((v) => v.sku === a.sku);
    if (!variant || variant.stock <= 0) continue;
    await mailer.send({
      to: a.email,
      template: 'back-in-stock',
      ...templates.backInStock({ title: product.title, slug: product.slug, size: [variant.size, variant.width].filter(Boolean).join(' ') }),
    });
    await StockAlertModel.updateOne({ _id: a._id }, { notifiedAt: new Date() });
  }
  return alerts.length;
}

const alertLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10_000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
});

export const catalogExtrasRouter = Router();

/** GET /products/suggest?q= — a few matches for the search box, cheap enough to call per keystroke. */
catalogExtrasRouter.get(
  '/suggest',
  validate({ query: z.object({ q: z.string().trim().min(2).max(60) }) }),
  asyncHandler(async (req, res) => {
    const q = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // match from the start of any word, so "chel" finds "Chelsea" but "els" does not
    const re = new RegExp(`(^|\\s)${q}`, 'i');
    const rows = await ProductModel.find({ deletedAt: null, $or: [{ title: re }, { name: re }, { color: re }, { category: re }] })
      .sort({ featured: -1, ratingCount: -1 })
      .limit(6)
      .select('title slug images price compareAtPrice stock')
      .lean();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      data: rows.map((p) => ({
        id: String(p._id),
        title: p.title,
        slug: p.slug,
        image: p.images?.[0],
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        inStock: p.stock > 0,
      })),
    });
  }),
);

/** POST /products/:id/stock-alerts — "email me when my size is back". */
catalogExtrasRouter.post(
  '/:id/stock-alerts',
  alertLimiter,
  optionalAuthenticate,
  validate({
    params: z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) }),
    body: z.object({ sku: z.string().min(1).max(60), email: z.string().trim().email().max(200).optional() }),
  }),
  asyncHandler(async (req, res) => {
    const email = req.body.email ?? req.user?.email;
    if (!email) throw new AppError('Enter your email', 400);
    const product = await ProductModel.findOne({ _id: req.params.id, deletedAt: null }).select('variants').lean();
    const variant = product?.variants.find((v) => v.sku === req.body.sku);
    if (!variant) throw new AppError('Size not found', 404);
    if (variant.stock > 0) throw new AppError('This size is in stock now', 409);
    await StockAlertModel.updateOne(
      { product: req.params.id, sku: req.body.sku, email: email.toLowerCase(), notifiedAt: null },
      { $setOnInsert: { product: req.params.id, sku: req.body.sku, email: email.toLowerCase() } },
      { upsert: true },
    );
    res.status(201).json({ message: 'We will email you when this size is back.' });
  }),
);
