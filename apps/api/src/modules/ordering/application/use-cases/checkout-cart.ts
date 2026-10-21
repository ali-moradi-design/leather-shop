import type { ICartRepository } from '@modules/ordering/domain/cart.repository';
import type { IBookRepository } from '@modules/catalog';
import type { IOrderRepository } from '@modules/ordering/domain/order.repository';
import type { Order, ShippingAddress } from '@modules/ordering/domain/order.entity';
import type { DiscountService } from '@modules/promotions';
import { DomainError } from '@shared/domain/DomainError';
import { assertSufficientStock } from '@modules/catalog';
import {
  assertCartNotEmpty,
  computeSubtotal,
  computeOrderTotal,
} from '@modules/ordering/domain/rules/cart.totals';

export class CheckoutCartUseCase {
  constructor(
    private readonly carts: ICartRepository,
    private readonly books: IBookRepository,
    private readonly orders: IOrderRepository,
    private readonly discounts: DiscountService,
  ) {}

  async execute(
    userId: string,
    shippingAddress: ShippingAddress,
    discountCode?: string,
  ): Promise<Order> {
    const cart = await this.carts.getOrCreate(userId);
    assertCartNotEmpty(cart.items);

    const bookIds = cart.items.map((i) => i.bookId);
    const books = await this.books.findByIds(bookIds);
    if (books.length !== new Set(bookIds).size) {
      throw new DomainError('One or more books in cart not found', 'NOT_FOUND');
    }

    const bookMap = new Map(books.map((b) => [b.id, b]));
    const orderItems = cart.items.map((item) => {
      const book = bookMap.get(item.bookId)!;
      assertSufficientStock(book.stock, item.quantity, book.title);
      return {
        book: book.id,
        title: book.title,
        price: book.price,
        quantity: item.quantity,
      };
    });

    const subtotalAmount = computeSubtotal(
      orderItems.map((i) => ({
        bookId: i.book,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
      })),
    );

    const { discount, discountAmount } = await this.discounts.computeDiscount(
      discountCode,
      subtotalAmount,
    );

    const totalAmount = computeOrderTotal(subtotalAmount, discountAmount);

    const order = await this.orders.create({
      userId,
      items: orderItems,
      subtotalAmount,
      discountCode: discount?.code,
      discountAmount,
      totalAmount,
      shippingAddress,
    });

    if (discount) {
      await this.discounts.recordUse(discount.id);
    }

    await this.carts.clear(userId);
    return order;
  }
}
