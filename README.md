# Japan JDM Experience — React Frontend

A React + TypeScript + Ant Design rebuild of the original PHP/MySQL "Japan JDM Experience"
tour-booking site (`../JDM_EXPERIENCE_php`). All backend/database access has been replaced with an
in-memory **mock service layer** so the app runs completely standalone — no PHP, no MySQL, no
server beyond `vite dev` itself.

> For a deeper technical reference — layered architecture diagram, full route-to-PHP-file mapping,
> the service contract every facade implements, and the ported business rules — see
> [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). For coding standards and conventions, see
> [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md). For the routing setup, see
> [docs/ROUTES.md](docs/ROUTES.md). For the Jira/branching workflow, see
> [docs/WORKFLOW.md](docs/WORKFLOW.md). For the backend work still needed (Jira epic/story
> source), see [docs/BACKEND_REQUIREMENTS.md](docs/BACKEND_REQUIREMENTS.md). For hosting/CI-CD, see
> [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Project info

| | |
|---|---|
| Main contact | achilleslucas79+development@gmail.com |
| Issue tracker | [Jira — JEA board](https://achilleslucas79.atlassian.net/jira/software/projects/JEA/list?jql=project+%3D+JEA+ORDER+BY+cf%5B10019%5D+ASC) |
| Frontend repo | [JDM-experience/jdm_experience_frontend](https://github.com/JDM-experience/jdm_experience_frontend) |
| Backend repo | [jdm_experience_backend](https://github.com/achilleslucas79-bot/jdm_experience_backend) |
| Hosting | [Vercel](https://vercel.com/acme-3452/jdm-experience-frontend) |

## What this is (and isn't)

The original PHP app repurposes a streetwear e-commerce database (`products`, `orders`,
`order_items`, `users`) as a JDM tour-booking system without changing the schema: `stock` becomes
a manual availability flag, "cart" becomes "reservations", tour availability is computed live from
existing bookings plus a 5:00 PM JST same-day cutoff. This project reproduces that user-facing
behavior in React, plus the full admin panel (tours/orders/customers/messages CRUD).

It intentionally does **not** implement a real backend. Six pre-conversion clothing-category pages
(`tops`, `bottoms`, `outerwear`, `accessories`, `sale_items`, `funda`) and two dead early-iteration
checkout files (`place_order.php`, `order_success.php`) were left out of the migration — they have
zero references anywhere in the live PHP app.

## Getting started

```bash
npm install
cp .env.example .env   # defaults are already correct for mock mode
npm run dev
```

Open http://localhost:5173.

- **Customer login (seeded):** `taro@example.com` / `password123`
- **Admin login (seeded):** `admin` / `admin123` at `/admin/login`

Mock data (tours, users, orders, messages) persists to `localStorage` so it survives page
refreshes. Reservations-in-progress persist to `sessionStorage`, mirroring the PHP session cart.
To reset everything to the seeded state, clear site data for `localhost:5173` in devtools, or call
`resetDb()` from `src/services/mock/db.ts` in the browser console.

## Project structure

```
src/
├── components/
│   ├── common/       # PriceDisplay, TourCard, AvailabilityBadge, OrderStatusTag, EmptyState, ...
│   └── layout/        # Navbar, Footer, AdminNavbar
├── layouts/            # MainLayout, AdminLayout (Navbar/Footer + <Outlet/>)
├── routes/             # RouteMain (route tree), public/client/admin route arrays, auth guards
├── pages/              # One folder per route (Home, Tours, TourDetail, Cart, Checkout, ...)
│   └── admin/          # Admin panel pages
├── contexts/           # AuthContext, AdminAuthContext, CartContext (+ their hooks)
├── services/
│   ├── config.ts        # VITE_API_URL / VITE_USE_MOCKS
│   ├── httpClient.ts     # fetch wrapper for the future Node API (unused today)
│   ├── *Service.ts        # facades — pages import ONLY from here
│   └── mock/               # actual mock implementation + in-memory "database"
├── types/              # Product, User, Order, CartItem, ContactMessage, AdminUser, ApiError
├── utils/               # bookingUtils (ported from car_helpers.php/cart_helpers.php), formatters
└── constants/           # promo code, JST cutoff hour, image base path
```

## How the mock layer works

Every page/component calls a **facade** in `src/services/*.ts`, e.g.:

```ts
import { getProducts } from '@/services/productService';
```

Today, every facade is a one-line re-export of its `src/services/mock/*` counterpart:

```ts
// src/services/productService.ts
export * from './mock/productService';
```

The mock implementations simulate a real API: artificial network delay, an `ApiError` class for
failure cases, and a small seeded in-memory "database" (`src/services/mock/db.ts`) mirrored to
`localStorage`. Business rules that lived in PHP helper files were ported to plain, testable
TypeScript in `src/utils/bookingUtils.ts` (manual availability status, discount math, the JST
same-day booking cutoff, and the "already booked on this date" check).

## Where to plug in the real Node.js API

When the backend exists, **only the facade files change** — no page or component needs to be
touched:

1. Implement the same exported function signatures against `src/services/httpClient.ts` (a thin
   `fetch` wrapper already pointed at `VITE_API_URL`).
2. Replace each facade's body, e.g.:

   ```ts
   // src/services/productService.ts
   import { httpClient } from './httpClient';
   import type { Product, ProductFilters } from '@/types/product';

   export function getProducts(filters: ProductFilters = {}) {
     return httpClient.get<Product[]>(`/products?${new URLSearchParams(filters as never)}`);
   }
   // ...
   ```

3. Set `VITE_USE_MOCKS=false` (currently just a documented flag — wire it up if you want to keep
   both implementations side by side during the transition).

The `AuthContext`/`AdminAuthContext`/`CartContext` providers only call facade functions too, so
swapping mocks for a real API is invisible above the service layer.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api` | Base URL for the future Node.js backend |
| `VITE_USE_MOCKS` | `true` | Documents mock-vs-real intent; flip when wiring real facades |

## Adding a new page

1. Create `src/pages/YourPage/index.tsx`.
2. Add a `{ path, element }` entry to `publicRoutes`, `clientRoutes`, or `adminRoutes` in
   `src/routes/{public,client,admin}/index.tsx` — see [docs/ROUTES.md](docs/ROUTES.md).
3. If it needs data, add functions to the relevant `src/services/mock/*Service.ts` + re-export
   from the facade — never import `services/mock/*` directly from a page.

## Adding a new mock service

1. Add types to `src/types/`.
2. Add seed data / storage to `src/services/mock/db.ts` if it's persistent data.
3. Add the service functions to a new `src/services/mock/yourService.ts` (use `delay()` from
   `src/services/mock/helpers.ts` to simulate latency, throw `ApiError` for failure cases).
4. Create the one-line facade at `src/services/yourService.ts`.

## Known mock-only limitations

- **Admin tour image upload** uses `URL.createObjectURL()` for instant preview — this works for the
  current browser tab/session but the blob URL won't survive a page reload (there's no real file
  storage without a backend). Existing seeded tour images are static files in `public/images/`.
- **GCash payment proof upload** and **admin "reply to message"** are captured/validated but not
  actually persisted as files or sent as email — there's nowhere to send them without a backend.
- **Card payment details**: only the cardholder name and last 4 digits of the card number are ever
  retained in the mock order record; the full card number/expiry/CVV are validated as
  present-and-non-empty (matching the original PHP form's behavior) but discarded rather than
  stored, since persisting full card data — even in a mock — isn't something to reproduce.

## Build

```bash
npm run build   # tsc -b && vite build
```
