import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import Stripe from 'stripe';
import {
  authHeader,
  registerCustomer,
  setupTestApp,
  shippingAddress,
  teardownTestApp,
  type TestContext,
} from '../helpers/testApp';

function newProduct(slug: string, stock: number) {
  return {
    slug: `${slug}-${Date.now()}`,
    title: 'Test Boot | Black',
    name: 'Test Boot',
    style: `test-${slug}`,
    color: 'Black',
    colorFamily: 'Black',
    category: 'boots',
    gender: 'men',
    description: 'Created in integration test',
    price: 1999,
    variants: [{ sku: 'TEST-10', size: '10', stock }],
  };
}

function inStockSku(product: { variants: { sku: string; stock: number }[] }, qty: number): string {
  const variant = product.variants.find((v) => v.stock >= qty);
  if (!variant) throw new Error('No variant with enough stock in seed data');
  return variant.sku;
}

function sessionIdOf(url: string): string {
  const id = new URL(url).pathname.split('/').pop()!;
  expect(id).toMatch(/^cs_test_mock_/);
  return id;
}

describe('Welt & Grain API (integration)', () => {
  let ctx: TestContext;
  let server: Server;

  beforeAll(async () => {
    ctx = await setupTestApp();
    // the simulator delivers webhooks over HTTP, like Stripe, so the app must listen
    server = ctx.app.listen(0);
    const { port } = server.address() as AddressInfo;
    const { payments } = await import('../../src/modules/ordering/infra/wiring');
    payments.mock!.gateway.webhookUrl = `http://127.0.0.1:${port}/api/v1/payments/stripe/webhook`;
  }, 120_000);

  afterAll(async () => {
    await new Promise((r) => server.close(r));
    await teardownTestApp();
  }, 60_000);

  describe('Health', () => {
    it('GET /api/health returns ok', async () => {
      const res = await ctx.request.get('/api/health').expect(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeTruthy();
    });
  });

  describe('API docs', () => {
    it('describes the leather catalog, not the old bookshop', async () => {
      const res = await ctx.request.get('/api/docs.json').expect(200);
      expect(Object.keys(res.body.paths)).toEqual(
        expect.arrayContaining(['/api/v1/products/facets', '/api/v1/cart/items/{productId}/{sku}', '/api/v1/cart/quote']),
      );
      expect(res.body.components.schemas.ProductInput.properties).toHaveProperty('variants');
      expect(JSON.stringify(res.body)).not.toMatch(/\bisbn\b|"author"|coverImageUrl/i);
    });
  });

  describe('Auth', () => {
    it('register → login → refresh → logout', async () => {
      const email = `flow_${Date.now()}@test.local`;

      const registered = await ctx.request
        .post('/api/v1/auth/register')
        .send({ name: 'Flow User', email, password: 'Password123!' })
        .expect(201);

      expect(registered.body.accessToken).toBeTruthy();
      expect(registered.body.refreshToken).toBeTruthy();
      expect(registered.body.user.email).toBe(email);

      const login = await ctx.request
        .post('/api/v1/auth/login')
        .send({ email, password: 'Password123!' })
        .expect(200);

      const refreshToken = login.body.refreshToken as string;

      const refreshed = await ctx.request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshed.body.accessToken).toBeTruthy();
      expect(refreshed.body.refreshToken).not.toBe(refreshToken);

      await ctx.request
        .post('/api/v1/auth/logout')
        .send({ refreshToken: refreshed.body.refreshToken })
        .expect(200);

      await ctx.request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refreshed.body.refreshToken })
        .expect(401);
    });

    it('rejects bad login', async () => {
      const res = await ctx.request
        .post('/api/v1/auth/login')
        .send({ email: 'admin@weltandgrain.local', password: 'wrong-password' })
        .expect(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it('login sets httpOnly cookies and a protected route works with the cookie jar', async () => {
      const email = `cookie_${Date.now()}@test.local`;
      await ctx.request
        .post('/api/v1/auth/register')
        .send({ name: 'Cookie User', email, password: 'Password123!' })
        .expect(201);

      const agent = request.agent(ctx.app);
      const login = await agent
        .post('/api/v1/auth/login')
        .send({ email, password: 'Password123!' })
        .expect(200);

      expect(login.body.accessToken).toBeTruthy();
      expect(login.body.refreshToken).toBeTruthy();

      const setCookie = login.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieHeaders = Array.isArray(setCookie) ? setCookie : [setCookie];
      const joined = cookieHeaders.join('\n');
      expect(joined).toMatch(/accessToken=/);
      expect(joined).toMatch(/refreshToken=/);
      expect(joined).toMatch(/HttpOnly/i);

      const me = await agent.get('/api/v1/users/me').expect(200);
      expect(me.body.data.email).toBe(email);

      const refreshed = await agent.post('/api/v1/auth/refresh').send({}).expect(200);
      expect(refreshed.body.accessToken).toBeTruthy();
      expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);

      await agent.get('/api/v1/users/me').expect(200);

      await agent.post('/api/v1/auth/logout').send({}).expect(200);

      await agent.get('/api/v1/users/me').expect(401);
    });
  });

  describe('RBAC', () => {
    it('customer cannot hit admin-only routes; admin can', async () => {
      const customer = await registerCustomer(ctx.request, `rbac_${Date.now()}`);

      await ctx.request
        .get('/api/v1/admin/dashboard/summary')
        .set(authHeader(customer.accessToken))
        .expect(403);

      await ctx.request
        .post('/api/v1/products')
        .set(authHeader(customer.accessToken))
        .send({
          title: 'Denied',
          author: 'X',
          description: 'Nope',
          price: 10,
          stock: 1,
        })
        .expect(403);

      const adminSummary = await ctx.request
        .get('/api/v1/admin/dashboard/summary')
        .set(authHeader(ctx.adminToken))
        .expect(200);

      expect(adminSummary.body.data).toBeTruthy();
    });
  });

  describe('Products', () => {
    it('lists, searches, and returns featured products', async () => {
      const list = await ctx.request.get('/api/v1/products').expect(200);
      expect(list.body.data.length).toBeGreaterThan(0);

      const first = list.body.data[0] as { name: string; slug: string; style: string };
      const search = await ctx.request.get(`/api/v1/products?q=${encodeURIComponent(first.name)}`).expect(200);
      expect(search.body.data.some((b: { name: string }) => b.name === first.name)).toBe(true);

      const bySlug = await ctx.request.get(`/api/v1/products/slug/${first.slug}`).expect(200);
      expect(bySlug.body.data.slug).toBe(first.slug);
      const colors = await ctx.request.get(`/api/v1/products/slug/${first.slug}/colors`).expect(200);
      expect(colors.body.data.every((b: { style: string }) => b.style === first.style)).toBe(true);

      const facets = await ctx.request.get('/api/v1/products/facets?category=boots').expect(200);
      expect(facets.body.data.sizes.length).toBeGreaterThan(0);
      expect(facets.body.data.price.max).toBeGreaterThan(0);

      const size = facets.body.data.sizes[0].value as string;
      const bySize = await ctx.request.get(`/api/v1/products?category=boots&size=${size}`).expect(200);
      expect(
        bySize.body.data.every((b: { variants: { size: string; stock: number }[] }) =>
          b.variants.some((v) => v.size === size && v.stock > 0),
        ),
      ).toBe(true);

      const featured = await ctx.request.get('/api/v1/products/featured').expect(200);
      expect(featured.body.data.length).toBeGreaterThan(0);
      expect(featured.body.data.every((b: { featured: boolean }) => b.featured === true)).toBe(true);
    });

    it('admin can create and update a product', async () => {
      const created = await ctx.request
        .post('/api/v1/products')
        .set(authHeader(ctx.adminToken))
        .send(newProduct('test-create', 5))
        .expect(201);

      const id = created.body.data.id as string;

      const updated = await ctx.request
        .patch(`/api/v1/products/${id}`)
        .set(authHeader(ctx.adminToken))
        .send({ price: 2150, variants: [{ sku: 'TEST-10', size: '10', stock: 8 }] })
        .expect(200);

      expect(updated.body.data.price).toBe(2150);
      expect(updated.body.data.stock).toBe(8);
    });

    it('admin can clear a sale price, delete a product and restore it from the trash', async () => {
      const created = await ctx.request
        .post('/api/v1/products')
        .set(authHeader(ctx.adminToken))
        .send({ ...newProduct('test-trash', 3), compareAtPrice: 2999 })
        .expect(201);
      const { id, slug } = created.body.data as { id: string; slug: string };

      const cleared = await ctx.request
        .patch(`/api/v1/products/${id}`)
        .set(authHeader(ctx.adminToken))
        .send({ compareAtPrice: null })
        .expect(200);
      expect(cleared.body.data.compareAtPrice).toBeUndefined();

      await ctx.request.get('/api/v1/products/trash').expect(401);
      await ctx.request.delete(`/api/v1/products/${id}`).set(authHeader(ctx.adminToken)).expect(200);
      await ctx.request.get(`/api/v1/products/slug/${slug}`).expect(404);

      const trash = await ctx.request.get('/api/v1/products/trash').set(authHeader(ctx.adminToken)).expect(200);
      expect(trash.body.data.some((p: { id: string }) => p.id === id)).toBe(true);
      expect(trash.body.meta.total).toBeGreaterThan(0);

      await ctx.request.post(`/api/v1/products/${id}/restore`).set(authHeader(ctx.adminToken)).expect(200);
      await ctx.request.get(`/api/v1/products/slug/${slug}`).expect(200);
      // restoring a live product is a 404
      await ctx.request.post(`/api/v1/products/${id}/restore`).set(authHeader(ctx.adminToken)).expect(404);
    });

    it('sorts by stock and filters to low stock', async () => {
      const res = await ctx.request.get('/api/v1/products?sort=stock&order=asc&maxStock=5&limit=50').expect(200);
      const stocks = (res.body.data as { stock: number }[]).map((p) => p.stock);
      expect(stocks.every((n) => n <= 5)).toBe(true);
      expect([...stocks].sort((a, b) => a - b)).toEqual(stocks);
    });
  });

  describe('Cart & orders', () => {
    it('add → update → checkout → pending_payment; pay decrements stock', async () => {
      const products = await ctx.request.get('/api/v1/products?limit=1&inStock=true').expect(200);
      const productId = products.body.data[0].id as string;
      const productPrice = products.body.data[0].price as number;
      const sku = inStockSku(products.body.data[0], 2);

      const customer = await registerCustomer(ctx.request, `cart_${Date.now()}`);
      const token = customer.accessToken;

      const beforeProduct = await ctx.request.get(`/api/v1/products/${productId}`).expect(200);
      const stockBefore = beforeProduct.body.data.stock as number;

      await ctx.request
        .post('/api/v1/cart/items')
        .set(authHeader(token))
        .send({ productId, sku, quantity: 1 })
        .expect(201);

      await ctx.request
        .patch(`/api/v1/cart/items/${productId}/${sku}`)
        .set(authHeader(token))
        .send({ quantity: 2 })
        .expect(200);

      const checkout = await ctx.request
        .post('/api/v1/cart/checkout')
        .set(authHeader(token))
        .send({ shippingAddress })
        .expect(201);

      const order = checkout.body.data;
      expect(order.status).toBe('pending_payment');
      expect(order.totalAmount).toBe(productPrice * 2);
      expect(order.items[0]).toMatchObject({ sku, quantity: 2 });

      // pay through the Stripe Checkout simulator, which confirms by signed webhook
      const start = await ctx.request.post(`/api/v1/orders/${order.id}/checkout`).set(authHeader(token)).expect(200);
      const sessionId = sessionIdOf(start.body.data.url);
      await ctx.request
        .post(`/api/v1/payments/simulator/sessions/${sessionId}/pay`)
        .set(authHeader(token))
        .send({ card: '4242 4242 4242 4242' })
        .expect(200);
      const paid = await ctx.request.get(`/api/v1/orders/${order.id}`).set(authHeader(token)).expect(200);
      expect(paid.body.data.status).toBe('paid');
      expect(paid.body.data.payment).toMatchObject({ method: 'stripe', status: 'paid' });
      expect(paid.body.data.payment.transactionId).toMatch(/^pi_mock_/);

      const afterProduct = await ctx.request.get(`/api/v1/products/${productId}`).expect(200);
      expect(afterProduct.body.data.stock).toBe(stockBefore - 2);
    });

    it('out-of-stock pay fails when concurrent orders oversell', async () => {
      const created = await ctx.request
        .post('/api/v1/products')
        .set(authHeader(ctx.adminToken))
        .send(newProduct('scarce', 1))
        .expect(201);

      const scarceId = created.body.data.id as string;
      const c1 = await registerCustomer(ctx.request, `oos1_${Date.now()}`);
      const c2 = await registerCustomer(ctx.request, `oos2_${Date.now()}`);

      for (const c of [c1, c2]) {
        await ctx.request
          .post('/api/v1/cart/items')
          .set(authHeader(c.accessToken))
          .send({ productId: scarceId, sku: 'TEST-10', quantity: 1 })
          .expect(201);

        await ctx.request
          .post('/api/v1/cart/checkout')
          .set(authHeader(c.accessToken))
          .send({ shippingAddress })
          .expect(201);
      }

      const orders1 = await ctx.request.get('/api/v1/orders').set(authHeader(c1.accessToken)).expect(200);
      const orders2 = await ctx.request.get('/api/v1/orders').set(authHeader(c2.accessToken)).expect(200);
      const order1Id = orders1.body.data[0].id as string;
      const order2Id = orders2.body.data[0].id as string;

      // staff record both payments by hand
      await ctx.request
        .post(`/api/v1/orders/${order1Id}/pay`)
        .set(authHeader(ctx.adminToken))
        .expect(200);

      const fail = await ctx.request
        .post(`/api/v1/orders/${order2Id}/pay`)
        .set(authHeader(ctx.adminToken))
        .expect(409);

      expect(fail.body.message).toMatch(/insufficient stock/i);

      const failedOrder = await ctx.request
        .get(`/api/v1/orders/${order2Id}`)
        .set(authHeader(c2.accessToken))
        .expect(200);
      expect(failedOrder.body.data.status).toBe('failed');
    });
  });

  describe('Payments (Stripe Checkout simulator)', () => {
    const stripe = new Stripe('sk_test_unused');

    async function pendingOrder(stock = 5) {
      const created = await ctx.request
        .post('/api/v1/products')
        .set(authHeader(ctx.adminToken))
        .send(newProduct('pay', stock))
        .expect(201);
      const productId = created.body.data.id as string;
      const customer = await registerCustomer(ctx.request);
      await ctx.request
        .post('/api/v1/cart/items')
        .set(authHeader(customer.accessToken))
        .send({ productId, sku: 'TEST-10', quantity: 1 })
        .expect(201);
      const checkout = await ctx.request
        .post('/api/v1/cart/checkout')
        .set(authHeader(customer.accessToken))
        .send({ shippingAddress })
        .expect(201);
      return { order: checkout.body.data as { id: string; totalAmount: number }, customer, productId };
    }

    function signedEvent(body: object) {
      const payload = JSON.stringify(body);
      const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test_secret' });
      return ctx.request
        .post('/api/v1/payments/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', signature)
        .send(payload);
    }

    function completed(sessionId: string, orderId: string, amount: number, pi = 'pi_test_1') {
      return {
        id: `evt_${Math.random().toString(36).slice(2)}`,
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: sessionId,
            object: 'checkout.session',
            payment_status: 'paid',
            amount_total: amount,
            currency: 'usd',
            client_reference_id: orderId,
            metadata: { orderId },
            payment_intent: pi,
          },
        },
      };
    }

    it('customers cannot mark their own order paid', async () => {
      const { order, customer } = await pendingOrder();
      await ctx.request.post(`/api/v1/orders/${order.id}/pay`).set(authHeader(customer.accessToken)).expect(403);
    });

    it('reuses the open session, declines test cards, then pays by webhook', async () => {
      const { order, customer, productId } = await pendingOrder(3);
      const auth = authHeader(customer.accessToken);
      const first = await ctx.request.post(`/api/v1/orders/${order.id}/checkout`).set(auth).expect(200);
      expect(first.body.data).toMatchObject({ mode: 'mock' });
      expect(first.body.data.url).toMatch(/^http:\/\/shop\.test\/pay\/cs_test_mock_/);
      const again = await ctx.request.post(`/api/v1/orders/${order.id}/checkout`).set(auth).expect(200);
      expect(again.body.data.url).toBe(first.body.data.url);

      const sessionId = sessionIdOf(first.body.data.url);
      const page = await ctx.request.get(`/api/v1/payments/simulator/sessions/${sessionId}`).set(auth).expect(200);
      expect(page.body.data).toMatchObject({ orderId: order.id, amount: order.totalAmount, currency: 'usd' });

      // another customer cannot see or pay it
      const other = await registerCustomer(ctx.request);
      await ctx.request.get(`/api/v1/payments/simulator/sessions/${sessionId}`).set(authHeader(other.accessToken)).expect(404);

      const declined = await ctx.request
        .post(`/api/v1/payments/simulator/sessions/${sessionId}/pay`)
        .set(auth)
        .send({ card: '4000 0000 0000 0002' })
        .expect(402);
      expect(declined.body.message).toMatch(/declined/i);
      const stillPending = await ctx.request.get(`/api/v1/orders/${order.id}`).set(auth).expect(200);
      expect(stillPending.body.data.status).toBe('pending_payment');

      const paid = await ctx.request
        .post(`/api/v1/payments/simulator/sessions/${sessionId}/pay`)
        .set(auth)
        .send({ card: '4242424242424242' })
        .expect(200);
      expect(paid.body.data.redirectUrl).toBe(`http://shop.test/account/orders/${order.id}?checkout=success`);
      const after = await ctx.request.get(`/api/v1/orders/${order.id}`).set(auth).expect(200);
      expect(after.body.data.status).toBe('paid');
      expect(after.body.data.payment).not.toHaveProperty('checkoutSessionId');
      const product = await ctx.request.get(`/api/v1/products/${productId}`).expect(200);
      expect(product.body.data.stock).toBe(2);

      // paid orders no longer start a checkout
      await ctx.request.post(`/api/v1/orders/${order.id}/checkout`).set(auth).expect(400);
    });

    it('rejects unsigned or tampered webhooks', async () => {
      const { order } = await pendingOrder();
      const payload = JSON.stringify(completed('cs_x', order.id, order.totalAmount));
      await ctx.request
        .post('/api/v1/payments/stripe/webhook')
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(400);
      const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_wrong' });
      await ctx.request
        .post('/api/v1/payments/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', signature)
        .send(payload)
        .expect(400);
      const check = await ctx.request.get(`/api/v1/orders/${order.id}`).set(authHeader(ctx.adminToken)).expect(200);
      expect(check.body.data.status).toBe('pending_payment');
    });

    it('confirms once when Stripe retries, and ignores a wrong amount', async () => {
      const { order, customer, productId } = await pendingOrder(4);
      const start = await ctx.request
        .post(`/api/v1/orders/${order.id}/checkout`)
        .set(authHeader(customer.accessToken))
        .expect(200);
      const sessionId = sessionIdOf(start.body.data.url);

      await signedEvent(completed(sessionId, order.id, order.totalAmount - 1)).expect(200);
      let check = await ctx.request.get(`/api/v1/orders/${order.id}`).set(authHeader(ctx.adminToken)).expect(200);
      expect(check.body.data.status).toBe('pending_payment');

      await signedEvent(completed(sessionId, order.id, order.totalAmount, 'pi_retry')).expect(200);
      await signedEvent(completed(sessionId, order.id, order.totalAmount, 'pi_retry')).expect(200);
      check = await ctx.request.get(`/api/v1/orders/${order.id}`).set(authHeader(ctx.adminToken)).expect(200);
      expect(check.body.data.status).toBe('paid');
      expect(check.body.data.payment.transactionId).toBe('pi_retry');
      const product = await ctx.request.get(`/api/v1/products/${productId}`).expect(200);
      expect(product.body.data.stock).toBe(3);
    });
  });

  describe('Guest cart', () => {
    it('visitor adds to cart, signs in, and the cart is merged', async () => {
      const products = await ctx.request.get('/api/v1/products?limit=20&inStock=true').expect(200);
      const product = products.body.data.find((p: { variants: { stock: number }[] }) =>
        p.variants.some((v) => v.stock >= 1),
      );
      const sku = inStockSku(product, 1);

      const visitor = request.agent(ctx.app);
      const added = await visitor
        .post('/api/v1/cart/items')
        .send({ productId: product.id, sku, quantity: 1 })
        .expect(201);
      expect(added.headers['set-cookie']?.toString()).toMatch(/guestCart=/);
      expect(added.body.data).toMatchObject({ count: 1, subtotal: product.price });
      expect(added.body.data.items[0]).toMatchObject({ sku, slug: product.slug });

      // the cookie keeps the same cart
      const again = await visitor.get('/api/v1/cart').expect(200);
      expect(again.body.data.count).toBe(1);

      // checkout needs an account
      await visitor.post('/api/v1/cart/checkout').send({ shippingAddress }).expect(401);

      const email = `guest_${Date.now()}@test.local`;
      await visitor
        .post('/api/v1/auth/register')
        .send({ name: 'Guest Buyer', email, password: 'Password123!' })
        .expect(201);
      await visitor.post('/api/v1/auth/login').send({ email, password: 'Password123!' }).expect(200);

      const merged = await visitor.post('/api/v1/cart/merge').expect(200);
      expect(merged.body.data.count).toBe(1);
      expect(merged.headers['set-cookie']?.toString()).toMatch(/guestCart=;/);

      const mine = await visitor.get('/api/v1/cart').expect(200);
      expect(mine.body.data.items[0].sku).toBe(sku);

      const quote = await visitor.post('/api/v1/cart/quote').send({}).expect(200);
      expect(quote.body.data).toMatchObject({ discountAmount: 0, total: quote.body.data.subtotal });
      await visitor.post('/api/v1/cart/quote').send({ discountCode: 'NOPE' }).expect(400);
    });
  });

  describe('Favorites', () => {
    it('visitors get an empty list, not a 401', async () => {
      const res = await ctx.request.get('/api/v1/favorites').expect(200);
      expect(res.body.data).toEqual([]);
      await ctx.request.post('/api/v1/favorites').send({ productId: 'x' }).expect(401);
    });

    it('add → list → remove', async () => {
      const customer = await registerCustomer(ctx.request, `fav_${Date.now()}`);
      const products = await ctx.request.get('/api/v1/products?limit=1').expect(200);
      const productId = products.body.data[0].id as string;

      await ctx.request
        .post('/api/v1/favorites')
        .set(authHeader(customer.accessToken))
        .send({ productId })
        .expect(201);

      const list = await ctx.request
        .get('/api/v1/favorites')
        .set(authHeader(customer.accessToken))
        .expect(200);

      expect(list.body.data.some((f: { productId: string }) => f.productId === productId)).toBe(true);

      await ctx.request
        .delete(`/api/v1/favorites/${productId}`)
        .set(authHeader(customer.accessToken))
        .expect(200);

      const after = await ctx.request
        .get('/api/v1/favorites')
        .set(authHeader(customer.accessToken))
        .expect(200);

      expect(after.body.data.length).toBe(0);
    });
  });

  describe('Discounts', () => {
    it('applies WELCOME10 on checkout and rejects invalid codes', async () => {
      const customer = await registerCustomer(ctx.request, `disc_${Date.now()}`);
      const products = await ctx.request.get('/api/v1/products?limit=20&inStock=true').expect(200);
      // WELCOME10 needs a $50 subtotal
      const product = products.body.data.find((b: { price: number }) => b.price >= 5000);
      const sku = inStockSku(product, 1);
      const qty = 1;

      await ctx.request
        .post('/api/v1/cart/items')
        .set(authHeader(customer.accessToken))
        .send({ productId: product.id, sku, quantity: qty })
        .expect(201);

      const checkout = await ctx.request
        .post('/api/v1/cart/checkout')
        .set(authHeader(customer.accessToken))
        .send({ shippingAddress, discountCode: 'WELCOME10' })
        .expect(201);

      expect(checkout.body.data.discountCode).toBe('WELCOME10');
      expect(checkout.body.data.discountAmount).toBeGreaterThan(0);
      expect(checkout.body.data.totalAmount).toBeLessThan(checkout.body.data.subtotalAmount);

      const customer2 = await registerCustomer(ctx.request, `disc_bad_${Date.now()}`);
      await ctx.request
        .post('/api/v1/cart/items')
        .set(authHeader(customer2.accessToken))
        .send({ productId: product.id, sku, quantity: 1 })
        .expect(201);

      const bad = await ctx.request
        .post('/api/v1/cart/checkout')
        .set(authHeader(customer2.accessToken))
        .send({ shippingAddress, discountCode: 'NOTAREALCODE' })
        .expect(400);

      expect(bad.body.message).toMatch(/invalid discount/i);
    });
  });

  describe('Reviews', () => {
    it('allows multiple reviews from the same user for the same product', async () => {
      const customer = await registerCustomer(ctx.request, `rev_${Date.now()}`);
      const products = await ctx.request.get('/api/v1/products?limit=1').expect(200);
      const productId = products.body.data[0].id as string;

      const r1 = await ctx.request
        .post('/api/v1/reviews')
        .set(authHeader(customer.accessToken))
        .send({ product: productId, rating: 5, comment: 'First review' })
        .expect(201);

      const r2 = await ctx.request
        .post('/api/v1/reviews')
        .set(authHeader(customer.accessToken))
        .send({ product: productId, rating: 4, comment: 'Second review same product' })
        .expect(201);

      const id1 = (r1.body.id ?? r1.body.data?.id) as string;
      const id2 = (r2.body.id ?? r2.body.data?.id) as string;
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);

      // the product's rating follows its reviews
      const product = await ctx.request.get(`/api/v1/products/${productId}`).expect(200);
      expect(product.body.data.ratingCount).toBe(2);
      expect(product.body.data.ratingAvg).toBe(4.5);

      const summary = await ctx.request.get(`/api/v1/reviews/summary?product=${productId}`).expect(200);
      expect(summary.body.data.count).toBe(2);
      expect(summary.body.data.stars).toEqual([0, 0, 0, 1, 1]);
      await ctx.request.get('/api/v1/reviews/summary?product=nope').expect(400);

      // the public list shows the reviewer's name, not the email
      const list = await ctx.request.get(`/api/v1/reviews?product=${productId}`).expect(200);
      expect(list.body.data[0].user.name).toBeTruthy();
      expect(list.body.data[0].user.email).toBeUndefined();
    });
  });

  describe('Admin orders and users', () => {
    it('pages and filters the order list', async () => {
      const page = await ctx.request.get('/api/v1/orders?limit=2').set(authHeader(ctx.adminToken)).expect(200);
      expect(page.body.meta).toMatchObject({ page: 1, limit: 2 });
      expect(page.body.data.length).toBeLessThanOrEqual(2);

      const paid = await ctx.request.get('/api/v1/orders?status=paid').set(authHeader(ctx.adminToken)).expect(200);
      expect(paid.body.data.every((o: { status: string }) => o.status === 'paid')).toBe(true);

      const all = await ctx.request.get('/api/v1/orders').set(authHeader(ctx.adminToken)).expect(200);
      const first = all.body.data[0] as { id: string } | undefined;
      if (first) {
        const byId = await ctx.request
          .get(`/api/v1/orders?q=${first.id.slice(-6)}`)
          .set(authHeader(ctx.adminToken))
          .expect(200);
        expect(byId.body.data.map((o: { id: string }) => o.id)).toContain(first.id);
      }
      await ctx.request.get('/api/v1/orders?status=bogus').set(authHeader(ctx.adminToken)).expect(400);
    });

    it('an admin cannot deactivate their own account', async () => {
      const me = await ctx.request.get('/api/v1/users/me').set(authHeader(ctx.adminToken)).expect(200);
      await ctx.request
        .patch(`/api/v1/users/${me.body.data.id}`)
        .set(authHeader(ctx.adminToken))
        .send({ isActive: false })
        .expect(400);
    });
  });

  describe('Admin dashboard', () => {
    it('summary is reachable by admin', async () => {
      const res = await ctx.request
        .get('/api/v1/admin/dashboard/summary')
        .set(authHeader(ctx.adminToken))
        .expect(200);

      expect(res.body.data).toBeTruthy();
    });
  });

  describe('Uploads', () => {
    it('rejects unauthenticated and unauthorized upload attempts', async () => {
      await ctx.request.post('/api/v1/uploads/product-cover').expect(401);

      const customer = await registerCustomer(ctx.request, `upl_${Date.now()}`);
      await ctx.request
        .post('/api/v1/uploads/product-cover')
        .set(authHeader(customer.accessToken))
        .expect(403);
    });

    it('stores real images under a safe name and rejects disguised files', async () => {
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64',
      );
      const ok = await ctx.request
        .post('/api/v1/uploads/product-cover')
        .set(authHeader(ctx.adminToken))
        .attach('file', png, { filename: 'evil.html', contentType: 'image/png' })
        .expect(201);
      expect(ok.body.url).toMatch(/\/[0-9]+-[0-9a-f]{12}\.png$/);

      const served = await ctx.request.get(new URL(ok.body.url, 'http://x').pathname).expect(200);
      expect(served.headers['x-content-type-options']).toBe('nosniff');
      expect(served.headers['content-security-policy']).toContain('sandbox');

      await ctx.request
        .post('/api/v1/uploads/product-cover')
        .set(authHeader(ctx.adminToken))
        .attach('file', Buffer.from('<script>alert(1)</script>'), { filename: 'x.png', contentType: 'image/png' })
        .expect(400);
    });
  });
});
