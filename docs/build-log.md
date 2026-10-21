# Build log and code walkthrough

What was built in the first build session (2026-10-20 / 21), in order, and the
plan for explaining the code step by step in the next session.

## 1. Decisions

| Topic | Decision |
| --- | --- |
| Shop | Leather goods: boots, shoes, bags, belts, wallets, accessories, leather care |
| Name / logo | **Welt & Grain** (Leather Co.); serif wordmark, italic `&`, dashed "welt stitch" line; `W&G` monogram |
| Look | Very close to thursdayboots.com; light and monochrome (white, light grey, black); Source Serif 4 + Jost |
| Language | English only (the shared brief's five languages were dropped for this shop) |
| Stack | MongoDB + Next.js PPR; backend from `nodejs-bookshop-modular-monolith`, storefront from `nodejs-bookshop-web-next-ppr` (plain copies, no history) |
| Data | 480 products (≤ 500) from the public thursdayboots.com catalog, demo use only; stock generated |
| Money | Minor units (cents) everywhere, formatted with `Intl` |
| Workflow | One small PR per step, checked locally (lint, types, tests, build, browser) before a squash merge; CI added at the end |

Mockups (approved): `docs/mockups/`. Brief: `docs/brief.md`. Security review: `docs/security.md`.

## 2. Pull requests

| PR | What |
| --- | --- |
| #1 | Copy the two old repos into a pnpm workspace (`apps/api`, `apps/web`); pin mongoose 9.10.1; local MongoDB compose |
| #2 | Rename Book → Product across the API (mechanical) |
| #3 | Leather product model: style/color, variants (sku, size, width) with their own stock, cents, filters, facets, slug + colors endpoints; cart/order lines carry the sku; 480-product seed |
| #4 | Guest carts (httpOnly `guestCart` cookie), merge on sign-in; cart responses carry product data |
| #5 | Storefront foundation: theme, fonts, logo, header, footer, home page |
| #6 | Collection pages with the pill filter bar; search |
| #7 | Product page (gallery, color groups, size grid with live stock) and the cart side drawer |
| #8 | Sign-in / register, checkout with discount codes, "Welt Pay" test gateway, account and order pages; demo customer; `/cart/quote` |
| #9 | Favorites and reviews; product rating follows reviews; reviewer emails no longer public |
| #10 | Small admin: dashboard, order status, price / per-size stock editor (clears the catalog cache) |
| #11 | SEO (sitemap, robots, OG image), About and Help pages, nightly `reset-demo`, revalidate hook |
| #12 | Vitest units + Playwright E2E (full purchase path) + axe checks |
| #13 | GitHub Actions CI (api, web, e2e, single `ci` check); README |
| #14 | Security review and fixes (see `docs/security.md`); Dockerfiles; `deploy/` |
| #15 | Swagger / OpenAPI rewritten for the leather shop |
| #16 | Pin MongoDB 8.2.6 (8.3 refuses Linux 6.19+ on GitHub runners); reviews read by slug |

## 3. Architecture map

```
apps/api/src
  app.ts                      Express app: helmet, CORS, cookies, originCheck (CSRF), rate limit, routes, /uploads
  shared/config/env.ts        zod-validated environment; production refuses weak secrets
  shared/domain/Money.ts      integer cents
  shared/http/docs/           OpenAPI spec (openapi.ts, shop.schemas.ts, helpers.ts)
  modules/catalog             Product entity, variants, stock rules, Mongoose repo (filters, facets), routes
  modules/ordering            Cart (owner = user:<id> | guest:<uuid>), order lines, checkout, fake payment, status rules
  modules/identity            Users, roles, permissions, JWT access/refresh tokens in httpOnly cookies
  modules/promotions          Discount codes (percent / fixed, in cents)
  modules/reviews             Reviews + rating sync to the product
  modules/engagement          Favorites
  modules/reporting           Admin dashboard (summary, low stock)
  scripts/seed*.ts            Seed: identity, 480 products, discounts, demo reviews
  scripts/reset-demo.ts       Nightly reset + storefront cache revalidation

apps/web/src  (Feature-Sliced Design: app → widgets → features → entities → shared)
  app/                        Routes. PPR: static shell + Suspense holes for per-visitor data
  app/api/[...path]/route.ts  Same-origin proxy to the API (cookies first-party, visitor IP forwarded)
  entities/product            Types, cached API reads ('use cache', tag "products"), ProductCard
  features/cart               CartProvider (client state over the API cart), CartButton, CartDrawer
  features/add-to-cart        BuyBox: width toggle, size grid, add button
  features/catalog-filters    URL params ↔ API query, FilterBar
  features/auth               AuthForm (safe `next`), requireUser / requireAdmin (server)
  features/checkout           CheckoutForm, FakeGateway
  features/reviews, favorite  Review list/form, heart button
  features/admin              Admin nav, order status select, product editor, cache server action
  widgets/                    Header, footer, home sections, product gallery/details, product grid
  shared/                     API clients (server/client), config (site, collections), money, UI (Logo, Icon, Stars)
```

## 4. Walkthrough plan for the next session

Explain one step at a time, in this order; each step names the files to open.

1. **Workspace and tooling** — root `package.json`, `pnpm-workspace.yaml`, `compose.yaml`, how to run.
2. **API bootstrap** — `apps/api/src/server.ts`, `app.ts`, `shared/config/env.ts`, error handler, `validate` middleware.
3. **Modular monolith** — `modules/index.ts`, one module's layers: `domain` → `application` → `infra` → `http`.
4. **Product model** — `catalog/domain/product.entity.ts`, `rules/stock.ts`, `infra/models/ProductModel.ts`,
   `ProductRepository.ts` (filters, facets aggregation, atomic `decrementStock`).
5. **Money and orders** — `Money.ts`, `ordering/domain/rules/cart.totals.ts`, `order.lines.ts`, `order.transitions.ts`.
6. **Cart and guest cookie** — `cart.entity.ts` (owner key), `http/middleware/cartOwner.ts`, `cart.service.ts` (view, merge, quote).
7. **Checkout and payment** — `use-cases/checkout-cart.ts`, `use-cases/pay-order.ts` (transaction, rollback, events).
8. **Auth and RBAC** — `identity` tokens, cookies, `authenticate` / `optionalAuthenticate`, permissions, seed roles.
9. **Security layer** — `originCheck.ts`, upload checks, rate limits + `TRUST_PROXY`, production env checks (`docs/security.md`).
10. **API tests** — `tests/helpers/testApp.ts` (in-memory MongoDB), unit vs integration tests.
11. **Next.js setup** — `next.config.ts` (cacheComponents, headers, standalone), `app/layout.tsx`, `globals.css` tokens.
12. **PPR in practice** — `entities/product/api/product-api.ts` (`'use cache'`, `cacheLife`, `cacheTag`),
    `app/collections/[slug]/page.tsx` and `app/products/[slug]/page.tsx` (static shell vs Suspense holes), `generateStaticParams`.
13. **FSD in practice** — why each folder is where it is; public `index.ts` APIs; server-only modules.
14. **Client state** — `CartProvider`, `CartDrawer` (dialog, focus, Esc), `BuyBox`.
15. **Same-origin API** — `app/api/[...path]/route.ts`, `shared/api/client.ts` vs `server.ts`.
16. **Auth pages and protected pages** — `AuthForm`, `requireUser`, `requireAdmin`, `safeNext`.
17. **Checkout flow** — `CheckoutForm`, `FakeGateway`, account/order pages.
18. **Admin and cache invalidation** — `ProductEditor`, `refreshCatalog` server action (`updateTag`), `/hooks/revalidate`.
19. **SEO** — metadata, JSON-LD on the product page, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`.
20. **Tests and CI** — Vitest, Playwright E2E + axe, `.github/workflows/ci.yml`.
21. **Docker and deploy** — both Dockerfiles, `deploy/compose.yaml`, `deploy/nginx.conf`, cron reset (roadmap phase 8).

## 5. Open items

- Set `main` as the default branch on GitHub, and `ci` as a required check (Settings → Rules).
- Deploy (roadmap phase 8): images to ghcr.io, subdomain, certbot, `.env` on the server, cron reset.
- The rating next to the price on the product page comes from the cached product (refreshes within hours);
  the reviews section is always fresh.
- Accepted risks are listed at the end of `docs/security.md`.
