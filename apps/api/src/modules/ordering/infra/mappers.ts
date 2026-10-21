import type { Order, OrderItem } from '../domain/order.entity';
import type { Cart } from '../domain/cart.entity';

function idOf(doc: { id?: string; _id?: { toString(): string } }): string {
  return doc.id ?? doc._id!.toString();
}

export function mapOrder(doc: {
  id?: string;
  _id?: { toString(): string };
  user: { toString(): string };
  items: {
    book: { toString(): string };
    title: string;
    price: number;
    quantity: number;
  }[];
  subtotalAmount?: number;
  discountCode?: string;
  discountAmount?: number;
  totalAmount: number;
  status: Order['status'];
  payment: Order['payment'];
  shippingAddress: Order['shippingAddress'];
  statusHistory: Order['statusHistory'];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Order {
  const items: OrderItem[] = doc.items.map((i) => ({
    book: i.book.toString(),
    title: i.title,
    price: i.price,
    quantity: i.quantity,
  }));
  const discountAmount = doc.discountAmount ?? 0;
  const subtotalAmount = doc.subtotalAmount ?? doc.totalAmount + discountAmount;
  return {
    id: idOf(doc),
    user: doc.user.toString(),
    items,
    subtotalAmount,
    discountCode: doc.discountCode,
    discountAmount,
    totalAmount: doc.totalAmount,
    status: doc.status,
    payment: doc.payment,
    shippingAddress: doc.shippingAddress,
    statusHistory: doc.statusHistory,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapCart(doc: {
  id?: string;
  _id?: { toString(): string };
  userId: { toString(): string };
  items: { bookId: { toString(): string }; quantity: number }[];
  createdAt: Date;
  updatedAt: Date;
}): Cart {
  return {
    id: idOf(doc),
    userId: doc.userId.toString(),
    items: doc.items.map((i) => ({
      bookId: i.bookId.toString(),
      quantity: i.quantity,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
