export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'completed',
  'cancelled',
  'failed',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

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

/** `fake` is the old demo gateway (kept for existing orders); `manual` is staff recording a payment. */
export const PAYMENT_METHODS = ['fake', 'stripe', 'manual'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Payment {
  method: PaymentMethod;
  status: 'pending' | 'paid' | 'failed';
  paidAt?: Date;
  transactionId?: string;
  /** The open Stripe Checkout Session, reused while the customer retries. */
  checkoutSessionId?: string;
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export const CARRIERS = ['UPS', 'USPS', 'FedEx', 'DHL', 'Other'] as const;
export type Carrier = (typeof CARRIERS)[number];

export interface Shipment {
  carrier: Carrier;
  trackingNumber: string;
  shippedAt: Date;
}

export interface StatusHistory {
  status: OrderStatus;
  at: Date;
  note?: string;
}

export interface Order {
  id: string;
  user: string;
  items: OrderItem[];
  /** Subtotal before discount */
  subtotalAmount: number;
  discountCode?: string;
  discountAmount: number;
  /** Final amount after discount */
  totalAmount: number;
  status: OrderStatus;
  payment: Payment;
  shippingAddress: ShippingAddress;
  statusHistory: StatusHistory[];
  shipment?: Shipment;
  /** Set when a cancelled paid order was refunded through the provider. */
  refundId?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  userId: string;
  items: OrderItem[];
  subtotalAmount: number;
  discountCode?: string;
  discountAmount?: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
}
