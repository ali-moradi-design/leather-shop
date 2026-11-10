import type { Order } from '@modules/ordering/domain/order.entity';

export interface OrderDto {
  id: string;
  user: string;
  items: Order['items'];
  subtotalAmount: number;
  discountCode?: string;
  discountAmount: number;
  totalAmount: number;
  status: Order['status'];
  /** The checkout session id stays on the server. */
  payment: Omit<Order['payment'], 'checkoutSessionId'>;
  shippingAddress: Order['shippingAddress'];
  statusHistory: Order['statusHistory'];
  createdAt: Date;
  updatedAt: Date;
}

export function toOrderDto(order: Order): OrderDto {
  return {
    id: order.id,
    user: order.user,
    items: order.items,
    subtotalAmount: order.subtotalAmount,
    discountCode: order.discountCode,
    discountAmount: order.discountAmount,
    totalAmount: order.totalAmount,
    status: order.status,
    payment: {
      method: order.payment.method,
      status: order.payment.status,
      paidAt: order.payment.paidAt,
      transactionId: order.payment.transactionId,
    },
    shippingAddress: order.shippingAddress,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
