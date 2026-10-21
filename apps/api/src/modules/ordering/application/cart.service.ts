import type { ICartRepository } from '@modules/ordering/domain/cart.repository';
import type { IProductRepository } from '@modules/catalog';
import type { IOrderRepository } from '@modules/ordering/domain/order.repository';
import type { Cart } from '@modules/ordering/domain/cart.entity';
import type { Order, ShippingAddress } from '@modules/ordering/domain/order.entity';
import type { DiscountService } from '@modules/promotions';
import { DomainError } from '@shared/domain/DomainError';
import { assertPositiveQuantity, assertSufficientStock, findVariant } from '@modules/catalog';
import { setCartItemQuantity, removeCartItem } from '@modules/ordering/domain/rules/cart.totals';
import { AddToCartUseCase } from './use-cases/add-to-cart';
import { CheckoutCartUseCase } from './use-cases/checkout-cart';

export class CartService {
  private readonly addToCart: AddToCartUseCase;
  private readonly checkoutCart: CheckoutCartUseCase;

  constructor(
    private readonly carts: ICartRepository,
    private readonly products: IProductRepository,
    orders: IOrderRepository,
    discounts: DiscountService,
  ) {
    this.addToCart = new AddToCartUseCase(carts, products);
    this.checkoutCart = new CheckoutCartUseCase(carts, products, orders, discounts);
  }

  async get(userId: string): Promise<Cart> {
    return this.carts.getOrCreate(userId);
  }

  addItem(userId: string, productId: string, sku: string, quantity: number): Promise<Cart> {
    return this.addToCart.execute(userId, productId, sku, quantity);
  }

  async updateItem(userId: string, productId: string, sku: string, quantity: number): Promise<Cart> {
    assertPositiveQuantity(quantity);
    const product = await this.products.findById(productId);
    if (!product) throw new DomainError('Product not found', 'NOT_FOUND');
    assertSufficientStock(findVariant(product, sku).stock, quantity, product.title);

    const cart = await this.carts.getOrCreate(userId);
    cart.items = setCartItemQuantity(cart.items, productId, sku, quantity);
    return this.carts.save(cart);
  }

  async removeItem(userId: string, productId: string, sku: string): Promise<Cart> {
    const cart = await this.carts.getOrCreate(userId);
    cart.items = removeCartItem(cart.items, productId, sku);
    return this.carts.save(cart);
  }

  async clear(userId: string): Promise<Cart> {
    const cart = await this.carts.clear(userId);
    if (!cart) return this.carts.getOrCreate(userId);
    return cart;
  }

  checkout(
    userId: string,
    shippingAddress: ShippingAddress,
    discountCode?: string,
  ): Promise<Order> {
    return this.checkoutCart.execute(userId, shippingAddress, discountCode);
  }
}
