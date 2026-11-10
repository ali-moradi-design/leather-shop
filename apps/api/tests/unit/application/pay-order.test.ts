import { describe, expect, it, vi } from 'vitest';
import { PayOrderUseCase } from '../../../src/modules/ordering/application/use-cases/pay-order';
import { DomainError } from '../../../src/shared/domain/DomainError';
import type { Order } from '../../../src/modules/ordering/domain/order.entity';

function pendingOrder(): Order {
  return {
    id: 'o1',
    user: 'u1',
    items: [{ product: 'b1', sku: 'B1-10', size: '10', title: 'T', price: 1000, quantity: 1 }],
    subtotalAmount: 1000,
    discountAmount: 0,
    totalAmount: 1000,
    status: 'pending_payment',
    payment: { method: 'stripe', status: 'pending' },
    shippingAddress: {
      fullName: 'A',
      line1: '1',
      city: 'C',
      postalCode: '1',
      country: 'IR',
    },
    statusHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const receipt = { method: 'stripe' as const, transactionId: 'pi_123', note: 'Paid with Stripe' };

describe('PayOrderUseCase', () => {
  it('marks order paid and decrements stock', async () => {
    const order = pendingOrder();
    const orders = {
      findById: vi.fn().mockResolvedValue(order),
      save: vi.fn(async (o: Order) => o),
    };
    const products = {
      decrementStock: vi.fn().mockResolvedValue(true),
      incrementStock: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: 'b1',
        title: 'T',
        stock: 10,
      }),
    };
    const uc = new PayOrderUseCase(orders as never, products as never);
    const paid = await uc.execute('o1', receipt);
    expect(paid.status).toBe('paid');
    expect(products.decrementStock).toHaveBeenCalledWith('b1', 'B1-10', 1);
  });

  it('ignores a repeat of the same payment (webhooks are retried)', async () => {
    const order = { ...pendingOrder(), status: 'paid' as const };
    order.payment = { method: 'stripe', status: 'paid', transactionId: receipt.transactionId };
    const orders = { findById: vi.fn().mockResolvedValue(order), save: vi.fn() };
    const products = { decrementStock: vi.fn(), incrementStock: vi.fn(), findById: vi.fn() };
    const uc = new PayOrderUseCase(orders as never, products as never);
    await expect(uc.execute('o1', receipt)).resolves.toBe(order);
    expect(products.decrementStock).not.toHaveBeenCalled();
    expect(orders.save).not.toHaveBeenCalled();
  });

  it('refuses a second, different payment', async () => {
    const order = { ...pendingOrder(), status: 'paid' as const };
    order.payment = { method: 'stripe', status: 'paid', transactionId: 'pi_other' };
    const orders = { findById: vi.fn().mockResolvedValue(order), save: vi.fn() };
    const products = { decrementStock: vi.fn(), incrementStock: vi.fn(), findById: vi.fn() };
    const uc = new PayOrderUseCase(orders as never, products as never);
    await expect(uc.execute('o1', receipt)).rejects.toBeInstanceOf(DomainError);
  });
});
