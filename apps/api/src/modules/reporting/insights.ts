import { Router, type NextFunction, type Request, type Response } from 'express';
import { Schema, model } from 'mongoose';
import { z } from 'zod';
import { authenticate, requireAnyPermission, requirePermission } from '@modules/identity/http/middleware';
import { validate } from '@shared/http/middleware/validate';
import { asyncHandler } from '@shared/http/asyncHandler';
import { paginate } from '@shared/pagination';
import { parseCsvObjects, toCsv } from '@shared/csv';
import { logger } from '@shared/logging/logger';
import { createProductSchema, ProductModel, productService } from '@modules/catalog';
import { OrderModel } from '@modules/ordering';
import { UserModel } from '@modules/identity';

/*
 * Admin tools that read across modules: sales insights, CSV export and import,
 * and the activity log of staff changes.
 */

const PAID = ['paid', 'processing', 'shipped', 'completed'];
const dollars = (cents?: number | null) => (cents == null ? '' : (cents / 100).toFixed(2));
const toCents = (v: string) => Math.round(Number(v.replace(/[$,\s]/g, '')) * 100);

// ---------- insights ----------

export async function insights(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const match = { deletedAt: null, status: { $in: PAID }, createdAt: { $gte: since } };
  const [totals, byCategory, customers, refunds] = await Promise.all([
    OrderModel.aggregate([{ $match: match }, { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } }]),
    OrderModel.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p', pipeline: [{ $project: { category: 1 } }] } },
      { $group: { _id: { $ifNull: [{ $first: '$p.category' }, 'other'] }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, units: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } },
    ]),
    // customers who bought in the period, and how many of them had bought before it
    OrderModel.aggregate([
      { $match: { deletedAt: null, status: { $in: PAID } } },
      { $group: { _id: '$user', first: { $min: '$createdAt' }, inPeriod: { $sum: { $cond: [{ $gte: ['$createdAt', since] }, 1, 0] } } } },
      { $match: { inPeriod: { $gt: 0 } } },
      { $group: { _id: null, customers: { $sum: 1 }, returning: { $sum: { $cond: [{ $or: [{ $lt: ['$first', since] }, { $gt: ['$inPeriod', 1] }] }, 1, 0] } } } },
    ]),
    OrderModel.countDocuments({ refundId: { $exists: true }, updatedAt: { $gte: since } }),
  ]);
  const t = totals[0] ?? { revenue: 0, orders: 0 };
  const c = customers[0] ?? { customers: 0, returning: 0 };
  return {
    days,
    revenue: t.revenue,
    orders: t.orders,
    averageOrderValue: t.orders ? Math.round(t.revenue / t.orders) : 0,
    customers: c.customers,
    returningCustomers: c.returning,
    returningRate: c.customers ? c.returning / c.customers : 0,
    refunds,
    byCategory: byCategory.map((r) => ({ category: String(r._id), revenue: r.revenue, units: r.units })),
  };
}

// ---------- CSV ----------

const PRODUCT_COLUMNS = [
  'slug', 'title', 'name', 'style', 'color', 'color_family', 'category', 'gender', 'price', 'compare_at_price',
  'description', 'features', 'leather', 'construction', 'sole', 'images', 'sizes', 'tags', 'featured',
];

async function productsCsv(): Promise<string> {
  const rows = await ProductModel.find({ deletedAt: null }).sort({ slug: 1 }).lean();
  return toCsv(
    PRODUCT_COLUMNS,
    rows.map((p) => [
      p.slug, p.title, p.name, p.style, p.color, p.colorFamily, p.category, p.gender, dollars(p.price), dollars(p.compareAtPrice),
      p.description, (p.features ?? []).join(' | '), p.leather, p.construction, p.sole, (p.images ?? []).join(' | '),
      // size[/width]=stock, so the file can be edited and imported back
      p.variants.map((v) => `${v.size}${v.width ? `/${v.width}` : ''}=${v.stock}`).join(' | '),
      (p.tags ?? []).join(' | '), p.featured ? 'yes' : '',
    ]),
  );
}

async function ordersCsv(from?: Date, to?: Date): Promise<string> {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (from || to) filter.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  const rows = await OrderModel.find(filter).sort({ createdAt: -1 }).limit(10_000).populate('user', 'email').lean();
  return toCsv(
    ['order', 'date', 'status', 'customer_email', 'ship_to', 'city', 'country', 'items', 'subtotal', 'discount_code', 'discount', 'total', 'payment', 'transaction', 'carrier', 'tracking'],
    rows.map((o) => [
      `#${String(o._id).slice(-6).toUpperCase()}`, o.createdAt, o.status, (o.user as unknown as { email?: string })?.email,
      o.shippingAddress?.fullName, o.shippingAddress?.city, o.shippingAddress?.country,
      o.items.map((i) => `${i.quantity}× ${i.title} (${i.size})`).join(' | '),
      dollars(o.subtotalAmount), o.discountCode, dollars(o.discountAmount), dollars(o.totalAmount),
      o.payment?.method, o.payment?.transactionId, o.shipment?.carrier, o.shipment?.trackingNumber,
    ]),
  );
}

async function customersCsv(): Promise<string> {
  const [users, spend] = await Promise.all([
    UserModel.find().sort({ createdAt: -1 }).select('name email guest isActive createdAt').lean(),
    OrderModel.aggregate([{ $match: { deletedAt: null, status: { $in: PAID } } }, { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$totalAmount' } } }]),
  ]);
  const byUser = new Map(spend.map((s) => [String(s._id), s]));
  return toCsv(
    ['name', 'email', 'guest', 'active', 'joined', 'orders', 'spent'],
    users.map((u) => {
      const s = byUser.get(String(u._id));
      return [u.name, u.email, u.guest ? 'yes' : '', u.isActive ? 'yes' : 'no', u.createdAt, s?.orders ?? 0, dollars(s?.spent ?? 0)];
    }),
  );
}

const split = (v?: string) => (v ? v.split('|').map((s) => s.trim()).filter(Boolean) : []);

/** One CSV row to a product body; SKUs are kept for known sizes and made up for new ones. */
function rowToProduct(r: Record<string, string>, existingSkus: Map<string, string>) {
  const variants = split(r.sizes).map((entry) => {
    const [label, stock = '0'] = entry.split('=');
    const [size, width] = label.split('/').map((s) => s.trim());
    const key = `${size}/${width ?? ''}`;
    return {
      sku: existingSkus.get(key) ?? `${r.slug}-${size}${width ? `-${width}` : ''}`.toUpperCase().replace(/[^A-Z0-9.-]/g, ''),
      size,
      ...(width ? { width } : {}),
      stock: Number(stock.trim()),
    };
  });
  return {
    slug: r.slug,
    title: r.title,
    name: r.name,
    style: r.style,
    color: r.color,
    colorFamily: r.color_family,
    category: r.category,
    gender: r.gender,
    price: toCents(r.price ?? ''),
    ...(r.compare_at_price ? { compareAtPrice: toCents(r.compare_at_price) } : {}),
    description: r.description ?? '',
    features: split(r.features),
    ...(r.leather ? { leather: r.leather } : {}),
    ...(r.construction ? { construction: r.construction } : {}),
    ...(r.sole ? { sole: r.sole } : {}),
    images: split(r.images),
    variants,
    tags: split(r.tags),
    featured: /^(yes|true|1)$/i.test(r.featured ?? ''),
  };
}

export async function importProducts(csv: string, dryRun: boolean) {
  const { header, records } = parseCsvObjects(csv);
  const missing = ['slug', 'title', 'name', 'style', 'color', 'color_family', 'category', 'gender', 'price', 'sizes'].filter((c) => !header.includes(c));
  if (missing.length) return { created: 0, updated: 0, errors: [{ row: 1, message: `Missing columns: ${missing.join(', ')}` }], dryRun };
  if (records.length > 1000) return { created: 0, updated: 0, errors: [{ row: 1, message: 'Import at most 1000 rows at a time' }], dryRun };

  const existing = await ProductModel.find({ slug: { $in: records.map((r) => r.slug) } }).select('slug variants').lean();
  const bySlug = new Map(existing.map((p) => [p.slug, p]));
  let created = 0;
  let updated = 0;
  const errors: { row: number; slug?: string; message: string }[] = [];

  for (const [i, record] of records.entries()) {
    const row = i + 2; // header is row 1
    const current = bySlug.get(record.slug);
    const skus = new Map((current?.variants ?? []).map((v) => [`${v.size}/${v.width ?? ''}`, v.sku]));
    const parsed = createProductSchema.safeParse(rowToProduct(record, skus));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      errors.push({ row, slug: record.slug, message: `${issue.path.join('.') || 'row'}: ${issue.message}` });
      continue;
    }
    if (dryRun) {
      if (current) updated++;
      else created++;
      continue;
    }
    try {
      if (current) {
        // through the service, so restocked sizes send back-in-stock emails
        await productService.update(String(current._id), parsed.data);
        updated++;
      } else {
        await productService.create(parsed.data);
        created++;
      }
    } catch (err) {
      errors.push({ row, slug: record.slug, message: err instanceof Error ? err.message : 'Could not save' });
    }
  }
  return { created, updated, errors, dryRun };
}

// ---------- activity log ----------

interface IAuditDoc {
  actor: string;
  actorEmail: string;
  method: string;
  path: string;
  action: string;
  status: number;
  at: Date;
}

const auditSchema = new Schema<IAuditDoc>({
  actor: { type: String, required: true, index: true },
  actorEmail: { type: String, required: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  action: { type: String, required: true },
  status: { type: Number, required: true },
  at: { type: Date, default: Date.now },
});
auditSchema.index({ at: -1 });
auditSchema.index({ at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });
export const AuditModel = model<IAuditDoc>('AuditEntry', auditSchema);

const STAFF_PERMISSIONS = ['products:update', 'orders:update-status', 'users:update', 'discounts:update', 'roles:update', 'reviews:delete'];
const WRITE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** What a request did, in words staff can scan. */
function describe(method: string, path: string, body: Record<string, unknown> | undefined): string {
  const p = path.replace(/^\/api\/v1/, '');
  const id = (p.match(/[a-f0-9]{24}/) ?? [''])[0].slice(-6).toUpperCase();
  const rules: [RegExp, string][] = [
    [/^\/products\/[a-f0-9]{24}\/restore$/, `Restored product ${id}`],
    [/^\/products$/, `Created product ${body?.slug ?? ''}`],
    [/^\/products\/[a-f0-9]{24}$/, method === 'DELETE' ? `Moved product ${id} to trash` : `Edited product ${id}`],
    [/^\/orders\/[a-f0-9]{24}\/status$/, `Set order #${id} to ${body?.status ?? ''}`],
    [/^\/orders\/[a-f0-9]{24}\/pay$/, `Recorded payment for order #${id}`],
    [/^\/returns\/[a-f0-9]{24}$/, `Set return ${id} to ${body?.status ?? ''}`],
    [/^\/discounts/, `${method === 'POST' ? 'Created' : method === 'DELETE' ? 'Deleted' : 'Changed'} discount ${body?.code ?? id}`],
    [/^\/users/, `${method === 'DELETE' ? 'Deleted' : 'Changed'} user ${id}${body?.isActive === false ? ' (blocked)' : body?.roles ? ' (roles)' : ''}`],
    [/^\/roles/, `${method === 'POST' ? 'Created' : method === 'DELETE' ? 'Deleted' : 'Changed'} role ${body?.name ?? id}`],
    [/^\/reviews/, `Removed review ${id}`],
    [/^\/uploads/, 'Uploaded an image'],
    [/^\/admin\/import/, 'Imported products from CSV'],
  ];
  return rules.find(([re]) => re.test(p))?.[1].trim() ?? `${method} ${p}`;
}

/**
 * Records successful writes by staff. Runs after the response, so it never slows
 * or fails the request; customers' own actions are not logged.
 */
export function auditTrail(req: Request, res: Response, next: NextFunction): void {
  if (!WRITE.has(req.method)) return next();
  res.on('finish', () => {
    const user = req.user;
    if (!user || res.statusCode >= 400) return;
    if (!user.permissions.some((p) => STAFF_PERMISSIONS.includes(p))) return;
    const path = req.originalUrl.split('?')[0];
    if (path.startsWith('/api/v1/auth') || path.startsWith('/api/v1/account') || path.startsWith('/api/v1/cart')) return;
    AuditModel.create({
      actor: user.id,
      actorEmail: user.email,
      method: req.method,
      path,
      action: describe(req.method, path, req.body),
      status: res.statusCode,
    }).catch((err) => logger.error('audit write failed', { error: String(err) }));
  });
  next();
}

// ---------- routes ----------

export const insightsRouter = Router();
insightsRouter.use(authenticate);

const sendCsv = (res: Response, name: string, csv: string) =>
  res.type('text/csv').attachment(`${name}-${new Date().toISOString().slice(0, 10)}.csv`).send(csv);

insightsRouter.get(
  '/insights',
  requireAnyPermission('admin:dashboard', 'reports:analytics'),
  validate({ query: z.object({ days: z.coerce.number().int().min(1).max(365).optional() }) }),
  asyncHandler(async (req, res) => {
    res.json({ data: await insights(Number(req.query.days ?? 30)) });
  }),
);

insightsRouter.get('/export/products.csv', requirePermission('products:update'), asyncHandler(async (_req, res) => sendCsv(res, 'products', await productsCsv())));
insightsRouter.get(
  '/export/orders.csv',
  requirePermission('orders:read'),
  validate({ query: z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional() }) }),
  asyncHandler(async (req, res) => sendCsv(res, 'orders', await ordersCsv(req.query.from as Date | undefined, req.query.to as Date | undefined))),
);
insightsRouter.get('/export/customers.csv', requirePermission('users:read'), asyncHandler(async (_req, res) => sendCsv(res, 'customers', await customersCsv())));

insightsRouter.post(
  '/import/products',
  requirePermission('products:create', 'products:update'),
  validate({ body: z.object({ csv: z.string().min(1).max(2_000_000), dryRun: z.boolean().default(true) }) }),
  asyncHandler(async (req, res) => {
    res.json({ data: await importProducts(req.body.csv, req.body.dryRun) });
  }),
);

insightsRouter.get(
  '/audit',
  requirePermission('users:read'),
  validate({
    query: z.object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      actor: z.string().regex(/^[a-f0-9]{24}$/).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = paginate(Number(req.query.page ?? 1), Number(req.query.limit ?? 50));
    const filter = req.query.actor ? { actor: String(req.query.actor) } : {};
    const [rows, total] = await Promise.all([
      AuditModel.find(filter).sort({ at: -1 }).skip(skip).limit(limit).lean(),
      AuditModel.countDocuments(filter),
    ]);
    res.json({
      data: rows.map((r) => ({ id: String(r._id), actor: r.actor, actorEmail: r.actorEmail, action: r.action, method: r.method, path: r.path, at: r.at })),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }),
);
