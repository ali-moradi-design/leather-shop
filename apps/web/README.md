# Niko Bookshop — Next.js PPR (Partial Prerendering / Cache Components)

Feature-Sliced Design (FSD) demo storefront against the layered Bookshop API:

https://github.com/ali-moradi-design/nodejs-bookshop-layered

## Rendering mode: Partial Prerendering (PPR)

Next.js 16 **Cache Components** enables PPR: a **static shell** ships instantly; **Suspense** boundaries stream dynamic holes (cart badge, user greeting, fresh stock).

### How it is configured

| Concern | Location |
|--------|----------|
| Enable PPR | `next.config.ts` — `cacheComponents: true` |
| Cached catalog shell | `src/widgets/catalog-list/ui/CachedCatalog.tsx` — `'use cache'` |
| Dynamic holes | `src/features/fresh-stock`, `cart-badge`, `user-greeting` in `<Suspense>` |

### Tradeoffs

**Pros**
- CDN-speed shell + request-time personalization/freshness
- Best of static + dynamic on one route

**Cons**
- Requires careful Suspense boundaries and Cache Components mental model
- Bot/crawler behavior differs (full render)

### Run

```bash
cp .env.example .env.local
npm install && npm run build && npm start
```

## FSD layout

```
src/
  app/ shared/ entities/ features/ widgets/
```

## Env

See `.env.example` — `API_URL` / `NEXT_PUBLIC_API_URL`.


## Review notes

- Pass 1: tighten FSD public barrels (`shared/ui`, `features/browse-catalog`), catalog skeleton loading, and book `generateMetadata`.
- Pass 2: book-route error UI, richer ApiError messages, featured badge, FSD segment map.
- Pass 3: a11y list semantics on catalog, title counts, env docs polish.

## Known debt

- No auth/cart mutations (catalog-only demo).
- Cover images use `<img>` (not `next/image`) to avoid remote domain churn.
- Relies on local layered API at build/runtime for SSG/ISR/PPR shells.
- PPR dynamic holes use demo cookies (`niko_guest`, `niko_cart_count`), not real auth.
