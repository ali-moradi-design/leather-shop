# Module map

| Module | Owns | HTTP (`/api/v1/...`) | Public API (examples) |
|--------|------|----------------------|------------------------|
| **identity** | Auth, users, roles, permissions, JWT/password | `/auth`, `/users`, `/roles`, `/permissions` | `authService`, `authenticate`, `userRepo`, `roleRepo` |
| **catalog** | Books, featured, stock rules, cover uploads | `/books`, `/uploads` | `bookService`, `bookRepo`, `IBookRepository`, stock helpers |
| **ordering** | Cart, orders, checkout, pay, status | `/cart`, `/orders` | `cartService`, `orderService`, `orderRepo` |
| **promotions** | Discount CRUD + calculate/recordUse | `/discounts` | `discountService`, `DiscountService` |
| **reviews** | Book reviews | `/reviews` | `reviewService` |
| **engagement** | Favorites | `/favorites` | `favoriteService` |
| **reporting** | Issue reports, analytics, admin dashboard | `/reports`, `/admin` | `reportService`, `dashboardService` |
| **shared** | Errors, pagination, config, logger, middleware primitives, VOs, UoW, storage/notifier | `/api/health`, `/api/docs`, static `/uploads` | `@shared/*` |

## Cross-module dependencies (allowed)

```
ordering   → catalog (stock/books), promotions (discount apply)
reviews    → catalog (book exists)
engagement → catalog (book exists)
reporting  → identity, catalog, ordering (aggregates / dashboard)
```

Modules must not import another module's `infra/` models or private HTTP controllers.
