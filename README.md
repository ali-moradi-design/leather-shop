# Welt & Grain

A demo leather-goods shop for a portfolio: a Next.js storefront with Partial
Prerendering and an Express + MongoDB API, in one pnpm workspace.

| Part | Stack |
| --- | --- |
| `apps/web` | Next.js 16 (App Router, Cache Components / PPR), Tailwind CSS 4, Feature-Sliced Design |
| `apps/api` | Express 5, Mongoose, modular monolith (catalog, ordering, identity, promotions, reviews, engagement, reporting) |
| Database | MongoDB 8.2 |
| Tests | Vitest (API unit + integration on an in-memory MongoDB, web units), Playwright E2E with axe |

Scope and decisions: [docs/brief.md](docs/brief.md). Approved design: [docs/mockups](docs/mockups).
What was built, PR by PR, and a code walkthrough plan: [docs/build-log.md](docs/build-log.md).

## Features

- Editorial storefront: full-viewport hero on every screen
  size, desktop mega menu (hover, click and keyboard), phone menu drawer and
  round category thumbnails, sticky header, products inside a centered container
  with a collection/filter sidebar (a drawer on phones)
- A `loading.tsx` skeleton for every route, `useLinkStatus` hints on nav links,
  `next/form` search, web manifest, generated icons, `global-error.tsx`
- Catalog of 480 leather products: collections with style chips and size / width /
  leather / color filters, search, product pages with color groups, per-size live
  stock, features and leather facts
- Cart as a side drawer for visitors (guest cookie) and customers (merged at sign-in)
- Checkout with discount codes (`WELCOME10`, `FLAT20`) and a simulated payment
  gateway (approve `4242 4242 4242 4242`, decline `4000 0000 0000 0002`)
- Accounts with order history, favorites, reviews with product ratings
- Small admin: dashboard, order status, price and per-size stock
- SEO: metadata, JSON-LD (Product, BreadcrumbList), sitemap, robots, Open Graph image
- Nightly demo reset (`pnpm --filter @wg/api reset-demo`)

## Run locally

### Everything in Docker

Needs only Docker.

```bash
docker compose up -d --build              # MongoDB, API and storefront
```

The demo data loads on every start. The storefront builds when its container
starts, so http://localhost:3000 answers a minute or two after `up`; follow it
with `docker compose logs -f web`. The API docs are at http://localhost:4000/api/docs.
`docker compose down` stops everything (add `-v` to also delete the data).

### With pnpm (hot reload)

Needs Node 24, pnpm 12 and Docker.

```bash
pnpm install
pnpm db:up                                # MongoDB in Docker on 127.0.0.1:27100 (stop: pnpm db:down)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm seed                                 # 480 products, demo accounts, reviews
pnpm dev                                  # API on :4000 (docs: /api/docs) + web on :3000
```

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Customer | `demo@weltandgrain.local` | `Demo123!` |
| Admin | `admin@weltandgrain.local` | `Admin123!` (development only; production reads `ADMIN_PASSWORD`) |

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test   # all workspaces
pnpm --filter @wg/web build                # prerendering reads the API, so run the API first
pnpm --filter @wg/web e2e                  # against the running API + web build
```

API tests start a throwaway MongoDB (`mongodb-memory-server`) and download its
binary once, on the first run. To skip that download, point them at the Docker
MongoDB instead:

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27100/weltandgrain-test pnpm --filter @wg/api test
```

CI (`.github/workflows/ci.yml`) runs the API checks, the web checks and the E2E
suite against a real MongoDB; the `ci` job is the single required check.

## Production notes

- The browser reaches the API through the storefront's `/api/*` proxy route, which
  passes the visitor's IP on; set `TRUST_PROXY=1` on the API so rate limits count
  visitors, and keep the API port private.
- Production refuses weak JWT secrets and a wildcard CORS origin, and the seed
  needs `ADMIN_PASSWORD`. See [deploy/](deploy) and [docs/security.md](docs/security.md).
- Nightly reset: run `reset-demo:prod` from cron with `WEB_REVALIDATE_URL` and
  `REVALIDATE_SECRET` set, so the storefront drops its cached catalog afterwards.

Product names, photos and prices come from a public online store catalog and
are used only as sample content for this non-commercial demo.
