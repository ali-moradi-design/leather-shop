# Welt & Grain — leather shop brief

Adapted from the shared three-shops brief (roadmap repo, `notes/shops-brief.md`).
Decisions specific to this shop are marked **(leather)**.

## Stack

| Part | Choice |
| --- | --- |
| Backend start | `nodejs-bookshop-modular-monolith` (Express 5, Mongoose, modular monolith) |
| Database | MongoDB |
| Storefront start | `nodejs-bookshop-web-next-ppr` (Next.js, Partial Prerendering / Cache Components) |
| Repo layout | pnpm workspace: `apps/api`, `apps/web` |

- Old code is copied without history; the old repos stay unchanged.
- "Book" is generalized to "product" only as far as this shop needs.

## Features

- Catalog with categories and filters, search, product page, cart (side drawer),
  checkout with a fake payment gateway (a simulated gateway page), customer account
  and order history, favorites, reviews, discount codes, a small admin (products,
  orders, stock), demo accounts, nightly demo-data reset.
- Payments: one payment interface; the fake gateway is the only implementation.
- SEO: metadata, JSON-LD (Product, BreadcrumbList), sitemap, OG images.
- Money in minor units with a currency code; formatting with `Intl`.
- **(leather)** Product variants: color (each color is its own product page, grouped
  into collections like the reference) and size/width, each size with its own stock.
- **(leather)** Leather details per product: leather type, construction (Goodyear
  welt, Blake stitch), sole, lining; filters by leather, color, size, width.

## Language **(leather)**

English only. The shared brief asked for five languages; this shop drops that.

## Look **(leather)**

- Name: **Welt & Grain** (Leather Co.). Logo: serif wordmark with an italic
  ampersand, a dashed "welt stitch" line and `LEATHER CO.` between rules.
  Monogram `W&G` in a stitched ring for favicon and stamps.
- Close to the layout of thursdayboots.com: full-bleed lifestyle hero, bold serif
  headings (Source Serif 4), clean sans text (Jost), light grey product tiles,
  pill filter bar, grouped color thumbnails, 10-column size grid, cart as a right
  side drawer with "Customers also bought".
- Light and monochrome: white, light grey, black. No accent color.
- Mockups (approved): `docs/mockups/` — home, product listing, product page, cart drawer.

## Demo data **(leather)**

At most 500 products, leather goods only (boots, shoes, bags, belts, wallets,
keychains, leather care). Product names, prices, sizes and images come from the
thursdayboots.com public catalog, used only as demo content for this
non-commercial portfolio project.

## Quality

TypeScript strict, ESLint + Prettier, FSD in the web app, Vitest, Playwright E2E for
the full purchase path (browse → cart → fake payment → order visible in admin), axe
checks; CI on GitHub Actions with a required check.

## Deploy (roadmap phase 8)

Three containers (web, api, mongo) with memory limits; MongoDB
`--wiredTigerCacheSizeGB 0.25`. Subdomain on ali-moradi-develop.com.

## Workflow

Small PRs: branch → PR → local checks → squash merge. Explanations in Persian;
repo files in English.
