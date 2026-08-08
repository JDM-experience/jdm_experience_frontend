# Architecture

This document is the deeper technical reference for `jdm-experience-frontend`. The top-level
[README.md](../README.md) covers install/run and the basics; this file covers how the pieces fit
together, the full routing/migration map, the service contracts, and the business rules ported
from the original PHP app.

## 1. Layered architecture

```
Pages (src/pages/**)
  - own local UI state (form values, modals, etc.)
  - read/write shared state via Context hooks
  - fetch/mutate data via service facades — never via mock/* directly
       |                                   |
       v                                   v
Contexts (src/contexts/**)          Service facades (src/services/*.ts)
  AuthContext                         productService.ts, authService.ts,
  AdminAuthContext                    adminAuthService.ts, cartService.ts,
  CartContext                         orderService.ts, customerService.ts,
  (wrap facades in React state          messageService.ts
   + localStorage/sessionStorage)     today: each is `export * from './mock/...'`
       |                                   |
       |                                   v
       |                             Mock services (src/services/mock/*.ts)
       |                               - simulate latency (delay())
       +---------------------------->  - throw ApiError on failure
                                        - read/write the mock "database"
                                                   |
                                                   v
                                        Mock DB (src/services/mock/db.ts)
                                        in-memory object, mirrored to
                                        localStorage under jdm_mock_db_v1
```

Two things never happen in this app, by design:
- A page importing anything from `src/services/mock/*` directly.
- A component containing business rules (availability, pricing, cutoff times) inline — those all
  live in `src/utils/bookingUtils.ts`.

## 2. Data flow walkthrough: reserving a tour

This traces one real interaction end-to-end so the layering above isn't abstract.

1. **`pages/TourDetail/index.tsx`** loads the tour with `getProductById(id)` (facade →
   `mock/productService.ts` → reads `db.products`).
2. User picks a date. A `useEffect` calls `checkAvailability(productId, date)`.
   `mock/productService.ts` combines the tour's manual `stock` flag with a scan of `db.orders` for
   an existing non-cancelled booking on that date, then delegates the actual verdict to the pure
   function `getAvailabilityForDate()` in `utils/bookingUtils.ts`.
3. User submits the reservation form. The page calls `addItem(...)` from `useCart()`
   (`CartContext`), which calls `cartService.addToCart(...)`. The mock implementation re-validates
   availability (never trust the client-side check alone — mirrors the original PHP's server-side
   re-check in `add_to_cart.php`), then appends a line to the raw cart array persisted in
   `sessionStorage` under `jdm_mock_cart_v1`.
4. `CartContext` re-fetches (`getCart()`, which normalizes raw lines against current product
   price/discount — same idea as `cart_helpers.php::normalize_cart_items()`) and re-renders
   anything reading `useCart()`, including the navbar badge count.
5. At checkout, `orderService.createOrder()` re-validates every cart line's availability again,
   creates an `Order` in `db.orders`, and clears the cart — matching `checkout.php`'s
   re-validate-then-insert-then-clear-session-cart flow.

## 3. Routing map

All customer routes are nested under `MainLayout` (Navbar + `<Outlet/>` + Footer); admin routes
under `AdminLayout` (`AdminNavbar` + `<Outlet/>` + Footer), guarded by `AdminProtectedRoute`.

| Route | Page component | Guard | Original PHP file |
|---|---|---|---|
| `/` | `pages/Home` | — | `index.php` |
| `/tours` | `pages/Tours` | — | `shop.php` |
| `/tours/:id` | `pages/TourDetail` | — | `product.php` + `check_availability.php` + `add_to_cart.php` |
| `/cart` | `pages/Cart` | — | `cart.php` + `update_cart.php` |
| `/checkout` | `pages/Checkout` | customer | `checkout.php` |
| `/thank-you/:orderId` | `pages/ThankYou` | — | `thankyou.php` |
| `/login` | `pages/Login` | — | `login.php` |
| `/register` | `pages/Register` | — | `register.php` |
| `/profile` | `pages/Profile` | customer | `profile.php` + `change_password.php` |
| `/my-orders` | `pages/MyOrders` | customer | `my_orders.php` |
| `/receipt/:orderId` | `pages/Receipt` | customer (+ ownership check) | `receipt.php` |
| `/about` | `pages/About` | — | `about.php` |
| `/contact` | `pages/Contact` | — | `contact.php` |
| `/policy` | `pages/Policy` | — | `policy.php` |
| `/admin/login` | `pages/admin/AdminLogin` | — | `admin/admin_login.php` |
| `/admin/dashboard` | `pages/admin/Dashboard` | admin | `admin/admin_dashboard.php` |
| `/admin/tours` | `pages/admin/Tours` | admin | `admin/admin_products.php` + add/update/delete_product.php |
| `/admin/orders` | `pages/admin/Orders` | admin | `admin/admin_orders.php` + update_order_status.php + delete_order.php |
| `/admin/receipt/:orderId` | `pages/admin/OrderReceipt` | admin | `admin/admin_receipt.php` |
| `/admin/customers` | `pages/admin/Customers` | admin | `admin/admin_customers.php` |
| `/admin/customers/:customerId` | `pages/admin/CustomerDetail` | admin | `admin/admin_view_customer.php` |
| `/admin/messages` | `pages/admin/Messages` | admin | `admin/admin_messages.php` + send_reply.php + delete_message.php |
| `*` | `pages/NotFound` | — | *(no PHP equivalent)* |

"Guard" = customer means wrapped in `<ProtectedRoute>` (redirects to `/login?redirect=<path>` if
not logged in). "Guard" = admin means wrapped in `<AdminProtectedRoute>` (redirects to
`/admin/login`).

`navbar.php`'s live search AJAX (`search_suggestions.php`) is `productService.searchSuggestions()`,
wired into the `AutoComplete` in `components/layout/Navbar.tsx`.

## 4. State management

Three React Contexts, each exposing a hook. All three read their persisted state once in a
`useEffect` on mount (`isInitializing` flag covers that first tick so route guards don't flash a
redirect before hydration finishes).

| Context | Hook | Persists to | Mirrors |
|---|---|---|---|
| `AuthContext` | `useAuth()` | `localStorage: jdm_auth_user_v1` | `$_SESSION['user_id']`/`user_name`/`user_email` |
| `AdminAuthContext` | `useAdminAuth()` | `localStorage: jdm_admin_auth_v1` | `$_SESSION['admin_logged_in']`/`admin_username` |
| `CartContext` | `useCart()` | *(delegates to `cartService`, which uses `sessionStorage: jdm_mock_cart_v1`)* | `$_SESSION['cart']` |

`CartContext` is intentionally a thin wrapper: it doesn't own the storage key itself, it just
re-fetches from `cartService.getCart()` after every mutation so the displayed `items`/`total`/
`count` are always the server-normalized (mock) truth, not client-computed guesses.

## 5. Service layer contract

Every facade in `src/services/*.ts` is currently a one-line re-export:

```ts
export * from './mock/productService';
```

Function reference (all async, all can throw `ApiError` from `src/types/api.ts`):

**`productService`** — `getProducts(filters?)`, `getFeaturedProducts()`, `getProductById(id)`,
`getCategories()`, `searchSuggestions(term)`, `checkAvailability(productId, date)`,
`createProduct(input)`, `updateProduct(input)`, `deleteProduct(id)`

**`authService`** — `login(input)`, `register(input)`, `updateProfile(userId, input)`,
`changePassword(userId, input)`

**`adminAuthService`** — `adminLogin(input)`

**`cartService`** — `getCart()`, `getCartCount()`, `addToCart(input)`, `updateCartItem(input)`,
`removeCartItem(index)`, `clearCart()`

**`orderService`** — `createOrder(userId, input)`, `getOrdersByUser(userId)`, `getOrderById(id)`,
`getAllOrders()`, `updateOrderStatus(id, status)`, `deleteOrder(id)`

**`customerService`** — `getCustomers()`, `getCustomerById(id)`, `deleteCustomer(id)`

**`messageService`** — `getMessages()`, `createMessage(input)`, `deleteMessage(id)`,
`replyToMessage(input)`

See [README.md § Where to plug in the real Node.js API](../README.md#where-to-plug-in-the-real-nodejs-api)
for how these become real HTTP calls later — the signatures above are the contract the Node API
needs to satisfy.

## 6. Data model

| Type (`src/types/`) | Origin | Notes |
|---|---|---|
| `Product` | `products` table | `stock` is a manual flag, not inventory: `0` = Under Maintenance, `2` = Unavailable, else Available |
| `User` | `users` table | mock password lives only in `mock/db.ts`'s `MockUserRecord`, never on the public `User` type |
| `AdminUser` | `admin_users` table | single seeded admin, mock-only auth |
| `CartItem` | `$_SESSION['cart']`, normalized | `index` = position in the raw session-cart array |
| `Order` / `OrderItem` | `orders` + `order_items` tables, joined | denormalized in the mock DB (items embedded) for simplicity |
| `ContactMessage` | `contact_messages` table | |
| `AvailabilityResult` | derived, not a table | `{ status, bookable, message }`, the return of `getAvailabilityForDate()` |

## 7. Business rules (`src/utils/bookingUtils.ts`)

Ported 1:1 from `car_helpers.php` and `cart_helpers.php`, kept as pure functions (no I/O) so they
stay trivially testable:

- `manualStatusFromStock(stock)` — the 0/1/2 → status mapping above.
- `effectivePrice(price, discount)` — `discount > 0 ? price - price*discount/100 : price`.
- `isBookingClosedForDate(date)` — true if `date` is *today in Asia/Tokyo* and the current JST
  time is past 17:00. Computed via `Intl.DateTimeFormat(..., { timeZone: 'Asia/Tokyo' })` rather
  than a timezone library.
- `getAvailabilityForDate(stock, date, alreadyBookedForDate)` — the full decision tree: manual
  status wins first, then "no date chosen yet", then the JST cutoff, then the booked-date check.
  Callers (`mock/productService.ts`, `mock/cartService.ts`) compute `alreadyBookedForDate` by
  scanning `db.orders` (mirrors `car_has_booking_for_date()`'s SQL join) and pass it in.
- `formatTourDate` / `formatTourTime` — display formatting via `dayjs`.

## 8. Mock database (`src/services/mock/db.ts`)

A single in-memory object seeded on first load (`buildSeedDatabase()`) and mirrored to
`localStorage` (key `jdm_mock_db_v1`) after every mutation via `saveDb()`. Contains:

- 8 seeded tours across 6 categories (one each in "Under Maintenance" and "Unavailable" states so
  those UI paths are exercisable without admin edits)
- 2 seeded customers + 1 seeded admin
- 2 seeded orders (one `Delivered`, one `Pending`) tied to the first seeded customer
- 2 seeded contact messages
- `nextIds` counters for each entity

`getDb()` / `saveDb()` / `resetDb()` are exported for use from mock services (and from the browser
console during manual testing — `resetDb()` wipes back to the seed state).

## 9. Component catalog (`src/components/common`)

| Component | Purpose |
|---|---|
| `TourCard` | The fleet-card grid tile used by Home and Tours (image, sale/status badges, price, "View Details") |
| `PriceDisplay` | Strike-through original + discounted price + "X% OFF", or plain price |
| `AvailabilityBadge` | Colored tag for `Available` / `Unavailable` / `Under Maintenance` |
| `OrderStatusTag` | Colored tag for `Pending` / `Shipped` / `Delivered` / `Cancelled` |
| `ProductImage` | `<img>` that prefixes `IMAGE_BASE_PATH` onto a stored filename |
| `EmptyState` | AntD `Empty` + optional call-to-action button/link |
| `PageSpinner` | Centered `Spin` for full-page loading states |

`components/layout` holds `Navbar` (search AutoComplete, cart badge, auth dropdown, responsive
Drawer), `Footer`, and `AdminNavbar` (persistent admin nav — a deliberate improvement over the PHP
admin panel, where every subpage only linked back to the dashboard).

## 10. Backend integration checklist

When the Node.js API is ready:

1. Implement each facade's functions (§5) against real endpoints, using `src/services/httpClient.ts`.
2. Keep the same return shapes as the current mock functions (the `types/` already describe them).
3. Move password verification, order-availability re-validation, and admin auth server-side for
   real — the mock versions intentionally trust the browser since there's nothing else to trust.
4. Delete `src/services/mock/**` and `src/services/config.ts`'s `USE_MOCKS` flag once the mock path
   is no longer needed.
5. Nothing in `src/pages`, `src/components`, or `src/contexts` should need to change.
