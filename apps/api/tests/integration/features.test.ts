import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  authHeader,
  registerCustomer,
  setupTestApp,
  shippingAddress,
  teardownTestApp,
  type TestContext,
} from '../helpers/testApp';

/** Email, account, returns, stock alerts, admin tools and A/B events. */
describe('Shop features (integration)', () => {
  let ctx: TestContext;
  const admin = () => authHeader(ctx.adminToken);

  beforeAll(async () => {
    ctx = await setupTestApp();
  }, 120_000);

  afterAll(async () => {
    await teardownTestApp();
  }, 60_000);

  async function lastEmail(to: string, template?: string) {
    const res = await ctx.request.get(`/api/v1/emails?to=${encodeURIComponent(to)}`).set(admin()).expect(200);
    const list = res.body.data as { template: string; text: string; subject: string }[];
    return template ? list.find((e) => e.template === template) : list[0];
  }

  async function product(stock: number, slug = 'feat') {
    const res = await ctx.request
      .post('/api/v1/products')
      .set(admin())
      .send({
        slug: `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: 'Feature Boot | Brown',
        name: 'Feature Boot',
        style: `feature-${slug}`,
        color: 'Brown',
        colorFamily: 'Brown',
        category: 'boots',
        gender: 'men',
        price: 10000,
        variants: [
          { sku: `F-${slug}-9`, size: '9', stock },
          { sku: `F-${slug}-10`, size: '10', stock: 0 },
        ],
      })
      .expect(201);
    return res.body.data as { id: string; slug: string; variants: { sku: string }[] };
  }

  async function paidOrder(token: string, productId: string, sku: string) {
    await ctx.request.post('/api/v1/cart/items').set(authHeader(token)).send({ productId, sku, quantity: 1 }).expect(201);
    const order = (await ctx.request.post('/api/v1/cart/checkout').set(authHeader(token)).send({ shippingAddress }).expect(201)).body.data;
    // paid through the signed webhook, like Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe('sk_test_unused');
    const payload = JSON.stringify({
      id: `evt_${Math.random().toString(36).slice(2)}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: { id: `cs_${order.id}`, payment_status: 'paid', amount_total: order.totalAmount, currency: 'usd', client_reference_id: order.id, payment_intent: `pi_${order.id}` } },
    });
    await ctx.request
      .post('/api/v1/payments/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test_secret' }))
      .send(payload)
      .expect(200);
    return order as { id: string; totalAmount: number };
  }

  describe('Email and password reset', () => {
    it('sends a welcome email and resets a password through the emailed link', async () => {
      const c = await registerCustomer(ctx.request);
      expect(await lastEmail(c.email, 'welcome')).toBeTruthy();

      await ctx.request.post('/api/v1/auth/forgot-password').send({ email: c.email }).expect(202);
      // unknown addresses get the same answer
      await ctx.request.post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' }).expect(202);
      const mail = await lastEmail(c.email, 'password-reset');
      const token = mail!.text.match(/token=([a-f0-9]+)/)![1];

      await ctx.request.post('/api/v1/auth/reset-password').send({ token, password: 'NewPass123!' }).expect(200);
      await ctx.request.post('/api/v1/auth/reset-password').send({ token, password: 'Other123!!' }).expect(400);
      // the old session is signed out, the new password works
      await ctx.request.post('/api/v1/auth/refresh').send({ refreshToken: c.refreshToken }).expect(401);
      await ctx.request.post('/api/v1/auth/login').send({ email: c.email, password: 'NewPass123!' }).expect(200);
      expect(await lastEmail(c.email, 'password-changed')).toBeTruthy();
    });

    it('keeps the newsletter list without revealing who is on it', async () => {
      const email = `news_${Date.now()}@test.local`;
      await ctx.request.post('/api/v1/newsletter').send({ email }).expect(202);
      await ctx.request.post('/api/v1/newsletter').send({ email }).expect(202);
      const mail = await lastEmail(email, 'newsletter-welcome');
      const token = mail!.text.match(/token=([a-f0-9]+)/)![1];
      const list = await ctx.request.get('/api/v1/newsletter').set(admin()).expect(200);
      expect(list.body.data.some((s: { email: string }) => s.email === email)).toBe(true);
      await ctx.request.post('/api/v1/newsletter/unsubscribe').send({ token }).expect(200);
      const after = await ctx.request.get('/api/v1/newsletter').set(admin()).expect(200);
      expect(after.body.data.some((s: { email: string }) => s.email === email)).toBe(false);
      const csv = await ctx.request.get('/api/v1/newsletter/export.csv').set(admin()).expect(200);
      expect(csv.headers['content-type']).toMatch(/text\/csv/);
    });
  });

  describe('Account', () => {
    it('guest checkout signs in once, and never again by email alone', async () => {
      const email = `guest_${Date.now()}@test.local`;
      const guest = await ctx.request.post('/api/v1/auth/guest').send({ name: 'Guest Buyer', email }).expect(201);
      expect(guest.body.user).toMatchObject({ email, guest: true });
      expect(await lastEmail(email, 'guest-welcome')).toBeTruthy();
      await ctx.request.get('/api/v1/account').set(authHeader(guest.body.accessToken)).expect(200);
      // a second guest checkout with the same email is not signed in
      await ctx.request.post('/api/v1/auth/guest').send({ name: 'Someone', email }).expect(409);
      // nor can a registered customer's email be used as a guest
      const c = await registerCustomer(ctx.request);
      await ctx.request.post('/api/v1/auth/guest').send({ name: 'Someone', email: c.email }).expect(409);
      // guests have no password to sign in with
      await ctx.request.post('/api/v1/auth/login').send({ email, password: 'anything123' }).expect(401);
    });

    it('updates the profile, password and address book', async () => {
      const c = await registerCustomer(ctx.request);
      const auth = authHeader(c.accessToken);
      await ctx.request.patch('/api/v1/account').set(auth).send({ name: 'New Name' }).expect(200);
      await ctx.request.patch('/api/v1/account').set(auth).send({ email: `x_${Date.now()}@test.local` }).expect(400);
      const newEmail = `moved_${Date.now()}@test.local`;
      const moved = await ctx.request.patch('/api/v1/account').set(auth).send({ email: newEmail, currentPassword: 'Customer123!' }).expect(200);
      expect(moved.body.data).toMatchObject({ name: 'New Name', email: newEmail });

      await ctx.request.post('/api/v1/account/password').set(auth).send({ currentPassword: 'wrong', newPassword: 'Another123!' }).expect(400);
      await ctx.request.post('/api/v1/account/password').set(auth).send({ currentPassword: 'Customer123!', newPassword: 'Another123!' }).expect(200);

      const first = await ctx.request.post('/api/v1/account/addresses').set(auth).send({ ...shippingAddress, label: 'Home' }).expect(201);
      expect(first.body.data).toHaveLength(1);
      expect(first.body.data[0].isDefault).toBe(true);
      // saving the same address again changes nothing
      const same = await ctx.request.post('/api/v1/account/addresses').set(auth).send(shippingAddress).expect(201);
      expect(same.body.data).toHaveLength(1);
      const second = await ctx.request
        .post('/api/v1/account/addresses')
        .set(auth)
        .send({ ...shippingAddress, line1: '2 Work Rd', label: 'Work', isDefault: true })
        .expect(201);
      expect(second.body.data.map((a: { isDefault: boolean }) => a.isDefault)).toEqual([false, true]);
      const removed = await ctx.request.delete(`/api/v1/account/addresses/${second.body.data[1].id}`).set(auth).expect(200);
      expect(removed.body.data).toHaveLength(1);
      expect(removed.body.data[0].isDefault).toBe(true);
    });
  });

  describe('Orders after payment', () => {
    it('customer cancels before shipping and is refunded; restock emails waiting shoppers', async () => {
      const p = await product(1, 'cancel');
      const waiting = `wait_${Date.now()}@test.local`;
      const c = await registerCustomer(ctx.request);
      const order = await paidOrder(c.accessToken, p.id, p.variants[0].sku);
      expect(await lastEmail(c.email, 'order-confirmed')).toBeTruthy();

      // the size is now sold out: someone asks to be told when it is back
      await ctx.request.post(`/api/v1/products/${p.id}/stock-alerts`).send({ sku: p.variants[0].sku, email: waiting }).expect(201);
      await ctx.request.post(`/api/v1/products/${p.id}/stock-alerts`).send({ sku: p.variants[0].sku, email: waiting }).expect(201);

      const cancelled = await ctx.request.post(`/api/v1/orders/${order.id}/cancel`).set(authHeader(c.accessToken)).send({ reason: 'Ordered twice' }).expect(200);
      expect(cancelled.body.data).toMatchObject({ status: 'cancelled', refunded: true });
      expect(await lastEmail(c.email, 'order-cancelled')).toBeTruthy();
      const alerts = (await ctx.request.get(`/api/v1/emails?to=${waiting}`).set(admin()).expect(200)).body.data;
      expect(alerts.filter((e: { template: string }) => e.template === 'back-in-stock')).toHaveLength(1);
    });

    it('ships with tracking, then takes a return and refunds it', async () => {
      const p = await product(5, 'ret');
      const c = await registerCustomer(ctx.request);
      const order = await paidOrder(c.accessToken, p.id, p.variants[0].sku);
      await ctx.request.post(`/api/v1/returns`).set(authHeader(c.accessToken)).send({ orderId: order.id, reason: 'too-small', items: [{ sku: p.variants[0].sku, quantity: 1, type: 'refund' }] }).expect(400);

      await ctx.request.patch(`/api/v1/orders/${order.id}/status`).set(admin()).send({ status: 'processing' }).expect(200);
      const shipped = await ctx.request
        .patch(`/api/v1/orders/${order.id}/status`)
        .set(admin())
        .send({ status: 'shipped', shipment: { carrier: 'UPS', trackingNumber: '1Z999AA10123456784' } })
        .expect(200);
      expect(shipped.body.data.shipment).toMatchObject({ carrier: 'UPS', trackingNumber: '1Z999AA10123456784' });
      expect(shipped.body.data.shipment.url).toMatch(/ups\.com/);
      expect((await lastEmail(c.email, 'order-shipped'))!.text).toMatch(/1Z999AA10123456784/);
      await ctx.request.post(`/api/v1/orders/${order.id}/cancel`).set(authHeader(c.accessToken)).send({}).expect(400);

      const auth = authHeader(c.accessToken);
      await ctx.request.post('/api/v1/returns').set(auth).send({ orderId: order.id, reason: 'too-small', items: [{ sku: p.variants[0].sku, quantity: 2, type: 'refund' }] }).expect(400);
      const ret = await ctx.request
        .post('/api/v1/returns')
        .set(auth)
        .send({ orderId: order.id, reason: 'too-small', items: [{ sku: p.variants[0].sku, quantity: 1, type: 'refund' }] })
        .expect(201);
      expect(ret.body.data).toMatchObject({ status: 'requested', refundAmount: order.totalAmount });
      // the same pair cannot be returned twice
      await ctx.request.post('/api/v1/returns').set(auth).send({ orderId: order.id, reason: 'other', items: [{ sku: p.variants[0].sku, quantity: 1, type: 'refund' }] }).expect(400);

      const id = ret.body.data.id;
      await ctx.request.patch(`/api/v1/returns/${id}`).set(auth).send({ status: 'approved' }).expect(403);
      await ctx.request.patch(`/api/v1/returns/${id}`).set(admin()).send({ status: 'refunded' }).expect(400);
      for (const status of ['approved', 'received', 'refunded']) {
        await ctx.request.patch(`/api/v1/returns/${id}`).set(admin()).send({ status }).expect(200);
      }
      const mine = await ctx.request.get(`/api/v1/returns/mine?order=${order.id}`).set(auth).expect(200);
      expect(mine.body.data[0]).toMatchObject({ status: 'refunded', refunded: true });
      expect(await lastEmail(c.email, 'return-update')).toBeTruthy();
    });
  });

  describe('Catalog extras', () => {
    it('suggests products from the start of a word', async () => {
      const p = await product(3, 'suggest');
      const res = await ctx.request.get('/api/v1/products/suggest?q=feat').expect(200);
      expect(res.body.data.some((s: { slug: string }) => s.slug === p.slug)).toBe(true);
      const none = await ctx.request.get('/api/v1/products/suggest?q=eature').expect(200);
      expect(none.body.data.some((s: { slug: string }) => s.slug === p.slug)).toBe(false);
    });

    it('refuses alerts for sizes that are in stock', async () => {
      const p = await product(3, 'alert');
      await ctx.request.post(`/api/v1/products/${p.id}/stock-alerts`).send({ sku: p.variants[0].sku, email: 'a@test.local' }).expect(409);
    });
  });

  describe('Admin tools', () => {
    it('exports CSV and imports products back, dry run first', async () => {
      const exported = await ctx.request.get('/api/v1/admin/export/products.csv').set(admin()).expect(200);
      expect(exported.text).toMatch(/^﻿slug,title/);
      await ctx.request.get('/api/v1/admin/export/orders.csv').set(admin()).expect(200);
      await ctx.request.get('/api/v1/admin/export/customers.csv').set(admin()).expect(200);

      const slug = `csv-boot-${Date.now()}`;
      const csv = [
        'slug,title,name,style,color,color_family,category,gender,price,compare_at_price,sizes,features',
        `${slug},"CSV Boot | Tan, Waxed",CSV Boot,csv-boot,Tan,Brown,boots,men,249.00,,9=2 | 10=0,"Goodyear welt | Leather sole"`,
        'bad-row,Bad,Bad,bad,Red,Red,hats,men,abc,,9=1,',
      ].join('\n');
      const dry = await ctx.request.post('/api/v1/admin/import/products').set(admin()).send({ csv }).expect(200);
      expect(dry.body.data).toMatchObject({ created: 1, updated: 0, dryRun: true });
      expect(dry.body.data.errors).toHaveLength(1);
      expect(dry.body.data.errors[0].row).toBe(3);
      await ctx.request.get(`/api/v1/products/slug/${slug}`).expect(404);

      const run = await ctx.request.post('/api/v1/admin/import/products').set(admin()).send({ csv, dryRun: false }).expect(200);
      expect(run.body.data).toMatchObject({ created: 1, dryRun: false });
      const created = await ctx.request.get(`/api/v1/products/slug/${slug}`).expect(200);
      expect(created.body.data).toMatchObject({ title: 'CSV Boot | Tan, Waxed', price: 24900, stock: 2 });
      expect(created.body.data.features).toEqual(['Goodyear welt', 'Leather sole']);

      // the second import updates in place and keeps the SKUs
      const again = await ctx.request.post('/api/v1/admin/import/products').set(admin()).send({ csv: csv.replace('9=2', '9=7'), dryRun: false }).expect(200);
      expect(again.body.data).toMatchObject({ updated: 1 });
      const updated = await ctx.request.get(`/api/v1/products/slug/${slug}`).expect(200);
      expect(updated.body.data.stock).toBe(7);
      expect(updated.body.data.variants.map((v: { sku: string }) => v.sku)).toEqual(created.body.data.variants.map((v: { sku: string }) => v.sku));
    });

    it('reports insights and logs staff changes, not customers', async () => {
      const insights = await ctx.request.get('/api/v1/admin/insights?days=30').set(admin()).expect(200);
      expect(insights.body.data).toHaveProperty('averageOrderValue');
      expect(insights.body.data).toHaveProperty('returningRate');
      expect(Array.isArray(insights.body.data.byCategory)).toBe(true);

      const p = await product(2, 'audit');
      await ctx.request.patch(`/api/v1/products/${p.id}`).set(admin()).send({ featured: true }).expect(200);
      await new Promise((r) => setTimeout(r, 100));
      const audit = await ctx.request.get('/api/v1/admin/audit').set(admin()).expect(200);
      const actions = audit.body.data.map((a: { action: string }) => a.action);
      expect(actions.some((a: string) => a.startsWith('Edited product'))).toBe(true);
      expect(actions.some((a: string) => a.startsWith('Created product'))).toBe(true);

      const c = await registerCustomer(ctx.request);
      await ctx.request.get('/api/v1/admin/audit').set(authHeader(c.accessToken)).expect(403);
    });
  });

  describe('A/B tests', () => {
    it('counts unique visitors per variant and reports conversion', async () => {
      const send = (visitor: string, variant: string, types: string[]) =>
        ctx.request
          .post('/api/v1/experiments/events')
          .send({ visitor, events: types.map((type) => ({ experiment: 'test-exp', variant, type })) })
          .expect(204);
      await send('visitor-aaaaaaaaaaaa1', 'control', ['exposure', 'add_to_cart']);
      await send('visitor-aaaaaaaaaaaa1', 'control', ['exposure']);
      await send('visitor-aaaaaaaaaaaa2', 'control', ['exposure']);
      await send('visitor-bbbbbbbbbbbb1', 'urgency', ['exposure', 'add_to_cart', 'purchase']);
      // a visitor who later shows up in another variant still counts once, in the first
      await send('visitor-bbbbbbbbbbbb1', 'control', ['exposure']);

      const res = await ctx.request.get('/api/v1/experiments/results').set(admin()).expect(200);
      const exp = res.body.data.find((e: { key: string }) => e.key === 'test-exp');
      expect(exp.variants[0]).toMatchObject({ name: 'control', visitors: 2, addToCart: 1, addToCartRate: 0.5 });
      expect(exp.variants[1]).toMatchObject({ name: 'urgency', visitors: 1, purchases: 1 });
      expect(exp.variants[1].addToCartVsControl.uplift).toBeCloseTo(1);
      await ctx.request.get('/api/v1/experiments/results').expect(401);
    });
  });
});
