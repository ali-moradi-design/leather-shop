import { describe, expect, it, vi } from 'vitest';
import { AddToCartUseCase } from '../../../src/modules/ordering/application/use-cases/add-to-cart';
import { DomainError } from '../../../src/shared/domain/DomainError';
import type { Cart } from '../../../src/modules/ordering/domain/cart.entity';
import type { Product } from '../../../src/modules/catalog/domain/product.entity';

describe('AddToCartUseCase', () => {
  const product: Product = {
    id: 'b1',
    title: 'Clean Code',
    author: 'Uncle Bob',
    description: 'x',
    price: 30,
    currency: 'USD',
    stock: 5,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('adds a new line when stock allows', async () => {
    const cart: Cart = {
      id: 'c1',
      userId: 'u1',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const carts = {
      getOrCreate: vi.fn().mockResolvedValue(cart),
      save: vi.fn(async (c: Cart) => c),
    };
    const products = { findById: vi.fn().mockResolvedValue(product) };
    const uc = new AddToCartUseCase(carts as never, products as never);
    const result = await uc.execute('u1', 'b1', 2);
    expect(result.items).toEqual([{ productId: 'b1', quantity: 2 }]);
  });

  it('fails when stock insufficient', async () => {
    const carts = {
      getOrCreate: vi.fn().mockResolvedValue({
        id: 'c1',
        userId: 'u1',
        items: [{ productId: 'b1', quantity: 4 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      save: vi.fn(),
    };
    const products = { findById: vi.fn().mockResolvedValue(product) };
    const uc = new AddToCartUseCase(carts as never, products as never);
    await expect(uc.execute('u1', 'b1', 2)).rejects.toBeInstanceOf(DomainError);
  });
});
