import { ORDER_STATUSES } from '../../domain/order.entity';
import { data, errors, json, paged, path, query, ref, signedIn } from '@shared/http/docs/helpers';

export const ordersPaths = {
  '/api/v1/orders': {
    get: {
      tags: ['Orders'],
      summary: 'My orders (all orders for staff)',
      description: '`q` matches the end of the order id or the name on the shipping address.',
      security: signedIn,
      parameters: [
        query('status', { type: 'string', enum: ORDER_STATUSES }),
        query('q', { type: 'string', maxLength: 100 }),
        query('page', { type: 'integer', minimum: 1, default: 1 }),
        query('limit', { type: 'integer', minimum: 1, maximum: 100, default: 50 }),
      ],
      responses: { 200: { description: 'Orders', ...paged('Order') }, 400: errors[400], 401: errors[401] },
    },
    post: {
      tags: ['Orders'],
      summary: 'Create an order from explicit items',
      security: signedIn,
      requestBody: { required: true, ...json(ref('CreateOrder')) },
      responses: { 201: { description: 'Order', ...data(ref('Order')) }, 400: errors[400], 401: errors[401] },
    },
  },
  '/api/v1/orders/{id}': {
    get: {
      tags: ['Orders'],
      summary: 'One order (own, or any for staff)',
      security: signedIn,
      parameters: [path('id')],
      responses: { 200: { description: 'Order', ...data(ref('Order')) }, 403: errors[403], 404: errors[404] },
    },
  },
  '/api/v1/orders/{id}/checkout': {
    post: {
      tags: ['Payments'],
      summary: 'Start Stripe Checkout for an order',
      description:
        'Returns the Checkout Session URL to send the customer to. An open session is reused, so two tabs cannot pay twice. ' +
        'With no `STRIPE_SECRET_KEY` the URL opens the local simulator (`mode: mock`). The order is marked paid only by the webhook.',
      security: signedIn,
      parameters: [path('id')],
      responses: {
        200: { description: 'Session URL', ...data({ type: 'object', properties: { url: { type: 'string' }, mode: { type: 'string', enum: ['stripe', 'mock'] } } }) },
        400: { description: 'Order is not awaiting payment' },
        403: errors[403],
        404: errors[404],
      },
    },
  },
  '/api/v1/orders/{id}/pay': {
    post: {
      tags: ['Orders'],
      summary: 'Record a payment by hand (staff)',
      description: 'For payments taken outside the shop. Takes the stock of each size atomically; if a size ran out the order becomes `failed` (409).',
      security: signedIn,
      parameters: [path('id')],
      responses: {
        200: { description: 'Paid order', ...data(ref('Order')) },
        403: errors[403],
        404: errors[404],
        409: { description: 'Insufficient stock' },
      },
    },
  },
  '/api/v1/payments/stripe/webhook': {
    post: {
      tags: ['Payments'],
      summary: 'Stripe webhook',
      description:
        'Verified with the `Stripe-Signature` header. Handles `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.expired`. Retries are safe.',
      responses: { 200: { description: 'Received' }, 400: { description: 'Bad signature' } },
    },
  },
  '/api/v1/payments/simulator/sessions/{id}': {
    get: {
      tags: ['Payments'],
      summary: 'Simulated Checkout Session (no Stripe key only)',
      security: signedIn,
      parameters: [path('id')],
      responses: { 200: { description: 'Session' }, 404: errors[404] },
    },
  },
  '/api/v1/payments/simulator/sessions/{id}/pay': {
    post: {
      tags: ['Payments'],
      summary: 'Pay a simulated session with a Stripe test card',
      description: '4242 4242 4242 4242 pays and sends a signed `checkout.session.completed` webhook. 4000 0000 0000 0002 and other decline cards answer 402.',
      security: signedIn,
      parameters: [path('id')],
      requestBody: json({ type: 'object', required: ['card'], properties: { card: { type: 'string' }, expiry: { type: 'string' }, cvc: { type: 'string' } } }),
      responses: { 200: { description: 'Where to send the customer' }, 402: { description: 'Card declined' }, 404: errors[404] },
    },
  },
  '/api/v1/orders/{id}/status': {
    patch: {
      tags: ['Orders'],
      summary: 'Change the status (staff)',
      description: 'Allowed: paid → processing → shipped → completed; cancel from pending, paid or processing (restocks paid orders).',
      security: signedIn,
      parameters: [path('id')],
      requestBody: {
        required: true,
        ...json({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ORDER_STATUSES }, note: { type: 'string' } } }),
      },
      responses: { 200: { description: 'Order', ...data(ref('Order')) }, 400: errors[400], 403: errors[403] },
    },
  },
} as const;
