import { randomBytes } from 'node:crypto';
import { env } from '@shared/config/env';
import { paginate } from '@shared/pagination';
import { SubscriberModel } from './infra/SubscriberModel';
import { mailer } from './infra/mailer';
import { templates } from './templates';

export const newsletterService = {
  /**
   * Adds (or re-adds) an address. The answer is the same whether or not it was
   * already on the list, so the form cannot be used to test who subscribed.
   */
  async subscribe(email: string, source = 'footer'): Promise<void> {
    const address = email.trim().toLowerCase();
    const existing = await SubscriberModel.findOne({ email: address });
    if (existing && !existing.unsubscribedAt) return;
    const token = existing?.token ?? randomBytes(24).toString('hex');
    await SubscriberModel.updateOne(
      { email: address },
      { $set: { unsubscribedAt: null, source }, $setOnInsert: { token } },
      { upsert: true },
    );
    const url = `${env.STOREFRONT_URL.replace(/\/$/, '')}/newsletter/unsubscribe?token=${token}`;
    await mailer.send({ to: address, template: 'newsletter-welcome', ...templates.newsletterWelcome(url) });
  },

  async unsubscribe(token: string): Promise<boolean> {
    const res = await SubscriberModel.updateOne({ token, unsubscribedAt: null }, { $set: { unsubscribedAt: new Date() } });
    // an already used link still counts as done for the visitor
    return res.matchedCount > 0 || (await SubscriberModel.exists({ token })) !== null;
  },

  async list(query: { page?: number; limit?: number; active?: boolean }) {
    const { page, limit, skip } = paginate(query.page, query.limit ?? 50);
    const filter = query.active === false ? {} : { unsubscribedAt: null };
    const [rows, total] = await Promise.all([
      SubscriberModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SubscriberModel.countDocuments(filter),
    ]);
    return {
      data: rows.map((r) => ({ id: String(r._id), email: r.email, source: r.source, createdAt: r.createdAt, unsubscribedAt: r.unsubscribedAt })),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  /** Every active address, for the CSV export. */
  async allActive() {
    return SubscriberModel.find({ unsubscribedAt: null }).sort({ createdAt: 1 }).select('email source createdAt').lean();
  },
};
