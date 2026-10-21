import type { Cart } from '@modules/ordering/domain/cart.entity';

export interface CartDto {
  id: string;
  userId: string;
  items: { productId: string; quantity: number }[];
  updatedAt: Date;
  createdAt: Date;
}

export function toCartDto(cart: Cart): CartDto {
  return {
    id: cart.id,
    userId: cart.userId,
    items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    updatedAt: cart.updatedAt,
    createdAt: cart.createdAt,
  };
}
