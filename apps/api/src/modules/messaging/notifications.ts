import { domainEvents, type OrderChangedPayload, type StockLowPayload, type StockRestoredPayload } from '@shared/domain/events';
import { env } from '@shared/config/env';
import { logger } from '@shared/logging/logger';
import { orderRepo } from '@modules/ordering';
import { userRepo, roleRepo } from '@modules/identity';
import { notifyBackInStock } from '@modules/catalog/extras';
import type { ReturnEventPayload } from '@modules/ordering/returns';
import { trackingUrl } from '@modules/ordering/domain/rules/tracking';
import { mailer, templates } from './mail';

const log = logger.child({ module: 'notifications' });

/** Runs a handler without letting an email problem fail the request that raised the event. */
function safely<T>(name: string, fn: (payload: T) => Promise<void>) {
  domainEvents.on(name as never, async (event) => {
    try {
      await fn(event.payload as T);
    } catch (err) {
      log.error('notification failed', { event: name, error: err instanceof Error ? err.message : String(err) });
    }
  });
}

async function customerEmail(userId: string): Promise<string | null> {
  return (await userRepo.findById(userId))?.email ?? null;
}

/** Customer and staff emails for order, return and stock events. Call once at startup. */
export function registerNotifications(): void {
  safely<{ orderId: string; userId: string }>('OrderPaid', async ({ orderId, userId }) => {
    const [order, to] = await Promise.all([orderRepo.findById(orderId), customerEmail(userId)]);
    if (order && to) await mailer.send({ to, template: 'order-confirmed', ...templates.orderConfirmed(order) });
  });

  safely<OrderChangedPayload>('OrderShipped', async ({ orderId, userId }) => {
    const [order, to] = await Promise.all([orderRepo.findById(orderId), customerEmail(userId)]);
    if (!order || !to) return;
    const tracking = order.shipment ? { ...order.shipment, url: trackingUrl(order.shipment) } : undefined;
    await mailer.send({ to, template: 'order-shipped', ...templates.orderShipped(order, tracking) });
  });

  safely<OrderChangedPayload>('OrderCancelled', async ({ orderId, userId, refunded }) => {
    const to = await customerEmail(userId);
    if (to) await mailer.send({ to, template: 'order-cancelled', ...templates.orderCancelled({ id: orderId }, Boolean(refunded)) });
  });

  safely<ReturnEventPayload>('ReturnUpdated', async ({ orderId, userId, status, note }) => {
    const to = await customerEmail(userId);
    if (to) await mailer.send({ to, template: 'return-update', ...templates.returnUpdate({ order: orderId, status, note }) });
  });

  safely<StockRestoredPayload>('StockRestored', async ({ productId, skus }) => {
    await notifyBackInStock(productId, skus);
  });

  safely<StockLowPayload>('StockLow', async ({ productId, title, stock }) => {
    const recipients = env.ADMIN_ALERT_EMAIL ? [env.ADMIN_ALERT_EMAIL] : await adminEmails();
    for (const to of recipients) {
      await mailer.send({ to, template: 'low-stock', ...templates.lowStock({ id: productId, title, stock }) });
    }
  });
}

async function adminEmails(): Promise<string[]> {
  const admin = await roleRepo.findByName('admin');
  if (!admin) return [];
  const users = await userRepo.list();
  return users.filter((u) => u.isActive && u.roles.includes(admin.id)).map((u) => u.email);
}
