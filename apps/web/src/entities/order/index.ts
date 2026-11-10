export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface OrderItem {
  product: string;
  sku: string;
  size: string;
  width?: string;
  title: string;
  image?: string;
  price: number;
  quantity: number;
}

export interface OrderStatusChange {
  status: OrderStatus;
  at: string;
  note?: string;
}

export type PaymentMethod = 'fake' | 'stripe' | 'manual';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  stripe: 'Stripe',
  manual: 'Recorded by staff',
  fake: 'Demo gateway',
};

export interface Order {
  id: string;
  /** The customer's user id. */
  user: string;
  items: OrderItem[];
  subtotalAmount: number;
  discountCode?: string;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  payment: { method: PaymentMethod; status: 'pending' | 'paid' | 'failed'; paidAt?: string; transactionId?: string };
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  statusHistory?: OrderStatusChange[];
  createdAt: string;
}

export const ORDER_STATUSES = Object.keys({
  pending_payment: 1,
  paid: 1,
  processing: 1,
  shipped: 1,
  completed: 1,
  cancelled: 1,
  failed: 1,
} satisfies Record<OrderStatus, 1>) as OrderStatus[];

/** Short order number shown to people: the end of the id. */
export const orderNumber = (id: string) => `#${id.slice(-6).toUpperCase()}`;

/** Status changes an admin may make; mirrors the API's order.transitions.ts. */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
  failed: [],
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Delivered',
  cancelled: 'Cancelled',
  failed: 'Payment failed',
};
