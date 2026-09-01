# Backend requirements

Source material for creating the backend Jira EPIC(s) and stories. This is a gap analysis of what
`jdm-experience-frontend` currently fakes with a mock layer (`src/services/mock/**`, see
[ARCHITECTURE.md](ARCHITECTURE.md)) versus what a real Node.js API needs to provide so the mock
layer can be deleted per [ARCHITECTURE.md §10](ARCHITECTURE.md#10-backend-integration-checklist).

The real backend lives in its own repo:
[jdm_experience_backend](https://github.com/achilleslucas79-bot/jdm_experience_backend). This doc
is the spec for what that repo needs to implement — it doesn't live there itself because the epics
are best scoped from the frontend's existing contract (`src/types/*.ts` + the mock services).

**How to use this doc:** each `## Epic` below is one Jira Epic; each `### Story` under it is one
Jira Story. Endpoint paths/verbs are suggestions (there is no existing backend contract to match —
`src/services/httpClient.ts` is a generic REST wrapper, not yet wired to anything), adjust freely.
Field names come directly from `src/types/*.ts`, which is the contract every facade already
promises the UI, so keep response shapes matching those types wherever possible — it avoids
touching frontend code a second time (see [ARCHITECTURE.md §5](ARCHITECTURE.md#5-service-layer-contract)).

## Open decisions (resolve before estimating)

These aren't in the mock layer because there's nothing to fake them against — pick an approach
before writing stories in Jira:

1. **Auth mechanism.** `httpClient.ts` already sends `credentials: 'include'`, i.e. the frontend
   expects cookie-based sessions (mirrors the original PHP `$_SESSION`), not a bearer/JWT header.
   Confirm that's still the plan.
2. **Cart ownership.** Today the cart is 100% client-side (`sessionStorage`, see
   `src/services/mock/cartService.ts`) — there's no `cart` table. Decide whether the real backend
   owns cart state server-side (a `carts`/`cart_items` table, tied to session or user) or the
   frontend keeps managing it client-side and only hits the backend at checkout.
3. **Payment handling.** The mock only ever stores a payment method name, a GCash proof filename,
   and a card's last-4 digits — it never processes a real payment (see README's "Known mock-only
   limitations"). A real backend should almost certainly integrate a payment gateway
   (Stripe/PayMongo/etc.) rather than accepting raw card numbers at all; decide the provider before
   scoping the checkout story.
4. **File storage.** Tour images and GCash payment proofs need real storage (S3-compatible bucket,
   local disk, etc.) — today tour images are static files in `public/images/`, and uploads are
   never persisted.
5. **Outbound email.** Admin "reply to message" needs to actually send an email — decide a provider
   (SES, SendGrid, Postmark, ...).

## Epic 1 — Auth & accounts

Ports `authService`/`adminAuthService` (`src/services/mock/{auth,adminAuth}Service.ts`,
`src/types/user.ts`, `src/types/admin.ts`).

### Story: Customer registration
- `POST /auth/register` — body `{ fullName, email, password, confirmPassword }`, returns `User`
  (`{ id, fullName, email, createdAt }`, no password field).
- Rules: reject if `email` already registered (409); reject if passwords don't match (400).
- **Real backend must add, beyond the mock:** password hashing (bcrypt/argon2) — the mock stores
  plaintext passwords, which is only acceptable because it's a mock.

### Story: Customer login
- `POST /auth/login` — body `{ email, password }`, returns `User`, sets the session cookie.
- Rules: 404 if no account with that email, 401 if password wrong.

### Story: Update profile
- `PUT /auth/profile` — body `{ fullName, email }`, returns updated `User`. Requires an
  authenticated session.

### Story: Change password
- `PUT /auth/password` — body `{ currentPassword, newPassword, confirmPassword }`.
- Rules: 401 if `currentPassword` wrong, 400 if `newPassword` < 6 chars or doesn't match
  `confirmPassword`.

### Story: Admin login
- `POST /admin/auth/login` — body `{ username, password }`, returns `{ username }`, sets a
  separate admin session/cookie from the customer one (original PHP kept these as distinct
  sessions — `admin_logged_in` vs `user_id`).

### Story: Google Sign-In verification
- Frontend scaffolding exists (`AuthContext.loginWithGoogle`, "Continue with Google" button on
  `pages/Login`, gated behind `VITE_GOOGLE_CLIENT_ID`) but only forwards the raw Google ID token —
  `src/services/mock/authService.ts::loginWithGoogle` decodes it client-side *without verification*
  purely to demo the UI, and has a `TODO(backend)` comment marking this.
- `POST /auth/google` — body `{ idToken }`. Must verify the token's signature, audience (matches
  the configured client ID), and expiry server-side (e.g. `google-auth-library`'s
  `verifyIdToken`), then find-or-create a `User` by the verified email and set the session cookie
  like a normal login. **Never trust a client-decoded JWT's claims.**

### Story: reCAPTCHA verification on login
- Frontend scaffolding exists (Google reCAPTCHA v2 checkbox on `pages/Login`, gated behind
  `VITE_RECAPTCHA_SITE_KEY`) but only obtains a client token — nothing verifies it today.
- `POST /auth/login` (and any other CAPTCHA-protected endpoint) should accept an optional
  `recaptchaToken` and verify it against Google's `siteverify` endpoint using a **secret** key that
  lives only on the backend (never in a `VITE_*` frontend env var) before proceeding with
  authentication.

## Epic 2 — Tours (products)

Ports `productService` (`src/services/mock/productService.ts`, `src/types/product.ts`,
`src/types/availability.ts`, `src/utils/bookingUtils.ts`).

### Story: List / filter / sort tours
- `GET /tours?search=&category=&sort=az|za|low|high` → `Product[]`.
- `search` matches name or category (case-insensitive substring). Default sort `az`.

### Story: Featured tours
- `GET /tours/featured` → `Product[]`, newest-first (currently: sorted by id desc — replace with a
  real "featured" flag or `createdAt desc` if one exists).

### Story: Tour detail
- `GET /tours/:id` → `Product | 404`.

### Story: Categories
- `GET /tours/categories` → `string[]`, distinct categories, alphabetical.

### Story: Search suggestions (navbar live search)
- `GET /tours/search?q=` → up to 20 `{ id, name, price, image }`, name-alphabetical. Empty query →
  `[]`.

### Story: Check availability — **must be server-authoritative**
- `GET /tours/:id/availability?date=YYYY-MM-DD` → `{ status, bookable, message }`.
- Business rules to port exactly from `src/utils/bookingUtils.ts` (currently duplicated
  client-side for instant UI feedback, but the server check is the one that must actually gate
  bookings):
  - `stock` is a 3-state manual flag, not inventory: `0` = Under Maintenance, `2` = Unavailable,
    else Available.
  - Same-day bookings close after **17:00 Japan Standard Time** — compute "today" and "now" in
    `Asia/Tokyo`, not server-local time or UTC. Reference implementation:
    `src/utils/dateTime.ts::isBookingAllowed` (frontend-only today — this is exactly the check
    that must be re-implemented server-side, since the frontend's `disabledDate` calendar guard
    can be bypassed by a direct API call).
  - A date already booked for that tour (existing non-cancelled order containing that
    `productId`+`date`) is unavailable.
- **This is the most important story to get exactly right** — it's the one rule everything else
  (add-to-cart, checkout) re-validates against.

### Story: Admin create / update / delete tour
- `POST /tours`, `PUT /tours/:id`, `DELETE /tours/:id` — admin-only.
- `Product` fields: `name, category, description, price, discount, stock, image1, image2, image3,
  seatCapacity`, plus optional `latitude, longitude` (powers the weather forecast — see Epic 7's
  schema story; the tour itinerary map is a fixed route shared by all tours, not per-tour data).
- `seatCapacity` is `1 | 4`, admin-set, and caps the customer's seat selector on `TourDetail`/`Cart`.
  **The tour price is flat per booking and must not be multiplied by seat count** — see the pricing
  note under Epic 3's cart story.
- Image fields today are filenames resolved against `IMAGE_BASE_PATH` — see Epic 6 for real upload
  handling.

## Epic 3 — Reservations: cart & checkout

Ports `cartService`/`orderService` (`src/services/mock/{cart,order}Service.ts`,
`src/types/cart.ts`, `src/types/order.ts`). Depends on the Epic 2 availability rule and the
cart-ownership decision above.

### Story: Cart read / add / update / remove
- Mirrors `getCart()`, `addToCart()`, `updateCartItem()`, `removeCartItem()`, `clearCart()`.
- `addToCart`/`updateCartItem` must re-run the availability check server-side (409 with the
  availability's `message` if not bookable), reject `quantity > product.seatCapacity` (400), and
  reject a duplicate line for the same tour+date+time (409).
- **Pricing: `CartItem.subtotal` = `price` (the tour's effective price), never `price * quantity`.**
  `quantity`/`seatCapacity` are headcount only — the tour is priced per booking, not per seat.
  Order totals (`Order.totalAmount`, every receipt/order-history view) sum `item.price` per line,
  not `item.price * item.quantity`.

### Story: Checkout / create order
- `POST /orders` — re-validates **every** cart line's availability again immediately before
  booking (race condition between add-to-cart and checkout is expected and must be handled, not
  assumed away) — mirrors `checkout.php`'s re-validate-then-insert-then-clear-cart flow.
- Applies `PROMO_CODE` (`DRIP10`, 10% off — `src/constants/index.ts`) if provided and valid.
- Payment-method-specific validation: `GCash` requires a payment proof reference; `Credit/Debit
  Card` requires cardholder name + number + expiry + CVV going into whatever payment gateway is
  chosen (see Open decision #3) — **never persist a full card number or CVV**, only what the
  gateway response allows (e.g. last 4 digits, matching `Order.cardNumberLast4`).
- On success: create the `Order`, clear the cart.
- Returns `Order` (`id, userId, customerName, email, address, paymentMethod, totalAmount,
  orderDate, status, items[]`).

### Story: Customer order history & detail
- `GET /orders?userId=` (own orders only, newest first), `GET /orders/:id` (with an ownership
  check — a customer can only fetch their own order, matching the `/receipt/:orderId` route guard).

### Story: Admin order management
- `GET /admin/orders` (all orders, newest first), `PATCH /admin/orders/:id/status` (status ∈
  `Pending | Shipped | Delivered | Cancelled`), `DELETE /admin/orders/:id`.

## Epic 4 — Customers (admin)

Ports `customerService` (`src/services/mock/customerService.ts`).

### Story: Admin list / view / delete customers
- `GET /admin/customers` (newest first), `GET /admin/customers/:id`, `DELETE /admin/customers/:id`
  (404 if not found).
- Response is the public `User` shape — never include the password hash.

## Epic 5 — Contact messages

Ports `messageService` (`src/services/mock/messageService.ts`, `src/types/contactMessage.ts`).

### Story: Submit contact message
- `POST /contact` — body `{ name, email, message }` (public, no auth) → `ContactMessage`.

### Story: Admin list / delete messages
- `GET /admin/messages` (newest first), `DELETE /admin/messages/:id`.

### Story: Admin reply to message (real email send)
- `POST /admin/messages/:id/reply` — body `{ subject, body }`. Must actually send an email to the
  original sender via whatever provider is picked (Open decision #5) — the mock only validates and
  fakes success today, no email is ever sent.

## Epic 6 — File storage & uploads

Nothing in the mock persists an upload — both of these need real storage (Open decision #4):

### Story: Tour image upload
- Admin tour create/update currently only does `URL.createObjectURL()` client-side, which doesn't
  survive a reload. Needs a real upload endpoint (e.g. `POST /tours/:id/images`) storing to
  persistent storage and returning a stable URL/filename to save on the `Product`.

### Story: GCash payment proof upload
- Needs an upload endpoint returning a reference to store on the `Order`
  (`paymentProofName`/equivalent), so admins can view the proof against a `Pending` order.

## Epic 7 — Cross-cutting / infrastructure

### Story: Database schema & migrations
Minimum tables implied by `src/types/*.ts` + `src/services/mock/db.ts`'s seed shape:
- `users` (customers): id, full_name, email (unique), password_hash, created_at.
- `admin_users`: username (unique), password_hash.
- `products` (tours): id, name, category, description, price, discount, stock (0/1/2 flag),
  image1, image2, image3, seat_capacity (1 or 4), latitude (nullable), longitude (nullable).
- `orders`: id, user_id (nullable — guest checkout?), customer_name, email, address,
  payment_method, total_amount, order_date, status, payment_proof_name, card_name,
  card_number_last4.
- `order_items`: order_id, product_id, product_name (snapshot), product_image (snapshot), date,
  time, quantity, price (snapshot) — items are denormalized/snapshotted at order time, matching the
  mock (`ARCHITECTURE.md §6`), so a later product price change doesn't alter historical orders.
- `contact_messages`: id, name, email, message, created_at.
- Decide here whether `carts`/`cart_items` tables are needed per Open decision #2.

### Story: Session/auth security hardening
Password hashing, session cookie flags (`httpOnly`, `secure`, `sameSite`), rate-limiting login
attempts — none of this exists in the mock since it has nothing real to protect.

### Story: CORS & environment wiring
Configure the API to accept the frontend's origin with credentials, matching `VITE_API_URL` /
`VITE_USE_MOCKS` in `src/services/config.ts`. Coordinate the deployed API URL with whoever manages
`.env` for each environment (see [WORKFLOW.md](WORKFLOW.md) for `dev`/`main` environments).

## Cutover checklist (once the API above exists)

This is already documented in [ARCHITECTURE.md §10](ARCHITECTURE.md#10-backend-integration-checklist)
— repeated here so it's visible from this doc too:

1. Implement each facade's functions against the real endpoints, using `src/services/httpClient.ts`.
2. Keep the same return shapes the mock functions already produce (`src/types/` describes them).
3. Delete `src/services/mock/**` and the `USE_MOCKS` flag once the mock path is no longer needed.
4. Nothing in `src/pages`, `src/components`, or `src/contexts` should need to change.
