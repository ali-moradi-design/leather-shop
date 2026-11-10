import { Router } from 'express';
import { Schema, model, Types } from 'mongoose';
import { z } from 'zod';
import { authenticate, requirePermission } from '@modules/identity/http/middleware';
import { validate } from '@shared/http/middleware/validate';
import { asyncHandler } from '@shared/http/asyncHandler';
import { DomainError } from '@shared/domain/DomainError';
import { paginate } from '@shared/pagination';
import { domainEvents } from '@shared/domain/events';
import { orderRepo, orderService, payments } from './infra/wiring';

/*
 * Returns and size exchanges. A customer asks within RETURN_WINDOW_DAYS of
 * shipping; staff approve, mark the parcel received, then refund or send the
 * new size. Refunds go back through the payment provider.
 */

export const RETURN_WINDOW_DAYS = 30;
export const RETURN_STATUSES = ['requested', 'approved', 'rejected', 'received', 'refunded', 'exchanged'] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];
export const RETURN_REASONS = ['too-small', 'too-large', 'not-as-described', 'damaged', 'changed-mind', 'other'] as const;

const NEXT: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ['approved', 'rejected'],
  approved: ['received', 'rejected'],
  received: ['refunded', 'exchanged'],
  rejected: [],
  refunded: [],
  exchanged: [],
};

interface ReturnItem {
  sku: string;
  title: string;
  size: string;
  quantity: number;
  price: number;
  type: 'refund' | 'exchange';
  exchangeSize?: string;
}

interface IReturnDoc {
  order: Types.ObjectId;
  user: Types.ObjectId;
  items: ReturnItem[];
  reason: (typeof RETURN_REASONS)[number];
  comment?: string;
  status: ReturnStatus;
  refundAmount: number;
  refundId?: string;
  history: { status: ReturnStatus; at: Date; note?: string }[];
  createdAt: Date;
}

const returnSchema = new Schema<IReturnDoc>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      new Schema<ReturnItem>(
        {
          sku: { type: String, required: true },
          title: { type: String, required: true },
          size: { type: String, required: true },
          quantity: { type: Number, required: true, min: 1 },
          price: { type: Number, required: true },
          type: { type: String, enum: ['refund', 'exchange'], required: true },
          exchangeSize: String,
        },
        { _id: false },
      ),
    ],
    reason: { type: String, enum: RETURN_REASONS, required: true },
    comment: { type: String, maxlength: 1000 },
    status: { type: String, enum: RETURN_STATUSES, default: 'requested', index: true },
    refundAmount: { type: Number, default: 0 },
    refundId: String,
    history: [{ status: String, at: Date, note: String, _id: false }],
  },
  { timestamps: true },
);
returnSchema.index({ status: 1, createdAt: -1 });

export const ReturnModel = model<IReturnDoc>('Return', returnSchema);

type ReturnLean = IReturnDoc & { _id: Types.ObjectId };

function present(r: ReturnLean) {
  return {
    id: String(r._id),
    order: String(r.order),
    user: String(r.user),
    items: r.items,
    reason: r.reason,
    comment: r.comment,
    status: r.status,
    refundAmount: r.refundAmount,
    refunded: Boolean(r.refundId),
    history: r.history,
    createdAt: r.createdAt,
  };
}

export type ReturnEventPayload = { returnId: string; orderId: string; userId: string; status: ReturnStatus; note?: string };

const createSchema = z.object({
  orderId: z.string().regex(/^[a-f0-9]{24}$/),
  reason: z.enum(RETURN_REASONS),
  comment: z.string().trim().max(1000).optional(),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        quantity: z.number().int().min(1),
        type: z.enum(['refund', 'exchange']),
        exchangeSize: z.string().trim().max(10).optional(),
      }),
    )
    .min(1),
});

export const returnsService = {
  async create(userId: string, input: z.infer<typeof createSchema>) {
    const order = await orderService.getById(input.orderId, userId, false);
    if (!['shipped', 'completed'].includes(order.status)) {
      throw new DomainError('Returns open once your order has shipped', 'VALIDATION');
    }
    const shippedAt = order.shipment?.shippedAt ?? order.statusHistory.find((h) => h.status === 'shipped')?.at;
    if (shippedAt && Date.now() - new Date(shippedAt).getTime() > RETURN_WINDOW_DAYS * 86_400_000) {
      throw new DomainError(`Returns are accepted for ${RETURN_WINDOW_DAYS} days after shipping`, 'VALIDATION');
    }
    // quantities already in an open or finished return cannot be returned twice
    const earlier = await ReturnModel.find({ order: order.id, status: { $ne: 'rejected' } }).lean();
    const taken = new Map<string, number>();
    for (const r of earlier) for (const i of r.items) taken.set(i.sku, (taken.get(i.sku) ?? 0) + i.quantity);

    const items: ReturnItem[] = input.items.map((want) => {
      const line = order.items.find((i) => i.sku === want.sku);
      if (!line) throw new DomainError(`Size ${want.sku} is not in this order`, 'VALIDATION');
      if (want.quantity + (taken.get(want.sku) ?? 0) > line.quantity) {
        throw new DomainError(`You can return at most ${line.quantity - (taken.get(want.sku) ?? 0)} of ${line.title} (size ${line.size})`, 'VALIDATION');
      }
      if (want.type === 'exchange' && !want.exchangeSize) throw new DomainError('Choose the size you want instead', 'VALIDATION');
      return { sku: line.sku, title: line.title, size: line.size, quantity: want.quantity, price: line.price, type: want.type, exchangeSize: want.exchangeSize };
    });
    // a discount is shared out across the lines, so refunds never exceed what was paid
    const share = order.subtotalAmount > 0 ? order.totalAmount / order.subtotalAmount : 1;
    const refundAmount = Math.round(items.filter((i) => i.type === 'refund').reduce((s, i) => s + i.price * i.quantity, 0) * share);

    const doc = await ReturnModel.create({
      order: order.id,
      user: userId,
      items,
      reason: input.reason,
      comment: input.comment,
      refundAmount,
      history: [{ status: 'requested', at: new Date() }],
    });
    const r = present(doc.toObject() as ReturnLean);
    await domainEvents.publish({ name: 'ReturnUpdated', occurredAt: new Date(), payload: { returnId: r.id, orderId: r.order, userId, status: 'requested' } });
    return r;
  },

  async listMine(userId: string, orderId?: string) {
    const rows = await ReturnModel.find({ user: userId, ...(orderId ? { order: orderId } : {}) }).sort({ createdAt: -1 }).lean();
    return rows.map((r) => present(r as ReturnLean));
  },

  async list(query: { status?: ReturnStatus; page?: number; limit?: number }) {
    const { page, limit, skip } = paginate(query.page, query.limit ?? 50);
    const filter = query.status ? { status: query.status } : {};
    const [rows, total] = await Promise.all([
      ReturnModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ReturnModel.countDocuments(filter),
    ]);
    return { data: rows.map((r) => present(r as ReturnLean)), meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  },

  async update(id: string, status: ReturnStatus, note?: string) {
    const doc = await ReturnModel.findById(id);
    if (!doc) throw new DomainError('Return not found', 'NOT_FOUND');
    if (!NEXT[doc.status].includes(status)) {
      throw new DomainError(`A ${doc.status} return cannot become ${status}`, 'ILLEGAL_TRANSITION');
    }
    if (status === 'refunded') {
      const order = await orderRepo.findById(String(doc.order));
      if (doc.refundAmount > 0 && order?.payment.method === 'stripe' && order.payment.transactionId && !doc.refundId) {
        doc.refundId = await payments.gateway.refund(order.payment.transactionId, doc.refundAmount);
      }
    }
    doc.status = status;
    doc.history.push({ status, at: new Date(), note });
    await doc.save();
    const r = present(doc.toObject() as ReturnLean);
    await domainEvents.publish({ name: 'ReturnUpdated', occurredAt: new Date(), payload: { returnId: r.id, orderId: r.order, userId: r.user, status, note } });
    return r;
  },
};

export const returnsRouter = Router();
returnsRouter.use(authenticate);

returnsRouter.post(
  '/',
  requirePermission('orders:read-own'),
  validate({ body: createSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ data: await returnsService.create(req.user!.id, req.body) });
  }),
);

returnsRouter.get(
  '/mine',
  validate({ query: z.object({ order: z.string().regex(/^[a-f0-9]{24}$/).optional() }) }),
  asyncHandler(async (req, res) => {
    res.json({ data: await returnsService.listMine(req.user!.id, req.query.order as string | undefined) });
  }),
);

returnsRouter.get(
  '/',
  requirePermission('orders:update-status'),
  validate({
    query: z.object({
      status: z.enum(RETURN_STATUSES).optional(),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    res.json(await returnsService.list(req.query as { status?: ReturnStatus; page?: number; limit?: number }));
  }),
);

returnsRouter.patch(
  '/:id',
  requirePermission('orders:update-status'),
  validate({
    params: z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) }),
    body: z.object({ status: z.enum(RETURN_STATUSES), note: z.string().trim().max(500).optional() }),
  }),
  asyncHandler(async (req, res) => {
    res.json({ data: await returnsService.update(String(req.params.id), req.body.status, req.body.note) });
  }),
);
