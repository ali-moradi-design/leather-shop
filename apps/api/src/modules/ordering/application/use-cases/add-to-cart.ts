import type { ICartRepository } from '@modules/ordering/domain/cart.repository';
import type { IProductRepository } from '@modules/catalog';
import type { Cart } from '@modules/ordering/domain/cart.entity';
import { DomainError } from '@shared/domain/DomainError';
import { assertPositiveQuantity, assertSufficientStock, findVariant } from '@modules/catalog';
import { mergeCartItem } from '@modules/ordering/domain/rules/cart.totals';

export class AddToCartUseCase {
  constructor(
    private readonly carts: ICartRepository,
    private readonly products: IProductRepository,
  ) {}

  async execute(owner: string, productId: string, sku: string, quantity: number): Promise<Cart> {
    assertPositiveQuantity(quantity);
    const product = await this.products.findById(productId);
    if (!product) throw new DomainError('Product not found', 'NOT_FOUND');

    const cart = await this.carts.getOrCreate(owner);
    const variant = findVariant(product, sku);
    const existing = cart.items.find((i) => i.productId === productId && i.sku === sku);
    const newQty = (existing?.quantity ?? 0) + quantity;
    assertSufficientStock(variant.stock, newQty, product.title);

    cart.items = mergeCartItem(cart.items, productId, sku, quantity);
    return this.carts.save(cart);
  }
}
