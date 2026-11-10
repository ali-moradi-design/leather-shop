import { MongooseCartRepository } from './CartRepository';
import { MongooseOrderRepository } from './OrderRepository';
import { CartService } from '../application/cart.service';
import { OrderService } from '../application/order.service';
import { CheckoutService } from '../application/checkout.service';
import { createPayments } from './payments';
import { env } from '../../../shared/config/env';
import { productRepo } from '../../catalog';
import { discountService } from '../../promotions';
import { unitOfWork, notifier } from '../../../shared/infra';

export const cartRepo = new MongooseCartRepository();
export const orderRepo = new MongooseOrderRepository();

export const orderService = new OrderService(
  orderRepo,
  productRepo,
  discountService,
  unitOfWork,
  notifier,
);
export const cartService = new CartService(cartRepo, productRepo, orderRepo, discountService);

export const payments = createPayments(orderRepo);
export const checkoutService = new CheckoutService(orderRepo, orderService, payments.gateway, payments.verifier, {
  storefrontUrl: env.STOREFRONT_URL.replace(/\/$/, ''),
  currency: env.PAYMENT_CURRENCY,
});
