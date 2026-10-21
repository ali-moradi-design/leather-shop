import type { ICartRepository } from '@modules/ordering/domain/cart.repository';
import type { IProductRepository } from '@modules/catalog';
import type { Cart } from '@modules/ordering/domain/cart.entity';
import { DomainError } from '@shared/domain/DomainError';
import { assertPositiveQuantity, assertSufficientStock } from '@modules/catalog';
import { mergeCartItem } from '@modules/ordering/domain/rules/cart.totals';

export class AddToCartUseCase {
  constructor(
    private readonly carts: ICartRepository,
    private readonly products: IProductRepository,
  ) {}

  async execute(userId: string, productId: string, quantity: number): Promise<Cart> {
    assertPositiveQuantity(quantity);
    const product = await this.products.findById(productId);
    if (!product) throw new DomainError('Product not found', 'NOT_FOUND');

    const cart = await this.carts.getOrCreate(userId);
    const existing = cart.items.find((i) => i.productId === productId);
    const newQty = (existing?.quantity ?? 0) + quantity;
    assertSufficientStock(product.stock, newQty, product.title);

    cart.items = mergeCartItem(cart.items, productId, quantity);
    return this.carts.save(cart);
  }
}
