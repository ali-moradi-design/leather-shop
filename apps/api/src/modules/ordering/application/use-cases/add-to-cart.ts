import type { ICartRepository } from '@modules/ordering/domain/cart.repository';
import type { IBookRepository } from '@modules/catalog';
import type { Cart } from '@modules/ordering/domain/cart.entity';
import { DomainError } from '@shared/domain/DomainError';
import { assertPositiveQuantity, assertSufficientStock } from '@modules/catalog';
import { mergeCartItem } from '@modules/ordering/domain/rules/cart.totals';

export class AddToCartUseCase {
  constructor(
    private readonly carts: ICartRepository,
    private readonly books: IBookRepository,
  ) {}

  async execute(userId: string, bookId: string, quantity: number): Promise<Cart> {
    assertPositiveQuantity(quantity);
    const book = await this.books.findById(bookId);
    if (!book) throw new DomainError('Book not found', 'NOT_FOUND');

    const cart = await this.carts.getOrCreate(userId);
    const existing = cart.items.find((i) => i.bookId === bookId);
    const newQty = (existing?.quantity ?? 0) + quantity;
    assertSufficientStock(book.stock, newQty, book.title);

    cart.items = mergeCartItem(cart.items, bookId, quantity);
    return this.carts.save(cart);
  }
}
