import type { Cart } from '@modules/ordering/domain/cart.entity';
import { toCartDto } from '@modules/ordering/application/dto/cart.mapper';

export function presentCart(cart: Cart) {
  return toCartDto(cart);
}
