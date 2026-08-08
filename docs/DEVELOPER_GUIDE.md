# Developer Guide

Coding standards and conventions for `jdm-experience-frontend`. This is the "how we write code"
reference; for "how the pieces fit together" see [ARCHITECTURE.md](ARCHITECTURE.md), and for
per-dependency notes see [frontend-dependencies/](frontend-dependencies/). Everything below is
descriptive of what the codebase already does — follow the existing pattern in a neighboring file
before inventing a new one.

## 1. Language & tooling

- **TypeScript everywhere.** No `.js`/`.jsx` source files. `npm run build` runs `tsc -b` before
  `vite build`, so type errors fail the build — don't work around them with `any` or `@ts-ignore`.
- **Path alias `@/`** maps to `src/` (`tsconfig.app.json` + `vite.config.ts`). Use it for anything
  outside the current folder; use relative imports (`./`) only for siblings in the same folder.
- **`import type`** for type-only imports (`verbatimModuleSyntax` is on in `tsconfig.app.json`,
  so mixing value and type imports from the same module will fail the build). Example:
  ```ts
  import { getDb, saveDb } from './db';
  import type { Product } from '@/types/product';
  ```
- **Lint:** `npm run lint` runs `oxlint` (config in `.oxlintrc.json`). `react/rules-of-hooks` is an
  error — hooks must be called unconditionally at the top of components/hooks, never inside `if`,
  loops, or after an early `return`.
- No test runner is configured yet. Business logic is kept in pure functions
  (`src/utils/bookingUtils.ts`) specifically so it *can* be unit tested later without a DOM.

## 2. Naming & file layout

| What | Convention | Example |
|---|---|---|
| Page | `src/pages/<PageName>/index.tsx`, PascalCase folder | `src/pages/TourDetail/index.tsx` |
| Component | PascalCase file = export name | `src/components/common/TourCard.tsx` |
| Service facade | camelCase, `<noun>Service.ts` | `src/services/productService.ts` |
| Mock implementation | same name under `mock/` | `src/services/mock/productService.ts` |
| Types | camelCase file, singular domain noun | `src/types/product.ts` |
| Hook | `use<Thing>`, exported from its context file | `useAuth()` in `AuthContext.tsx` |
| Functions/variables | camelCase | `getAvailabilityForDate` |
| React components | PascalCase | `TourCard`, `PageSpinner` |
| Constants | UPPER_SNAKE_CASE for fixed values | `STORAGE_KEY`, JST cutoff hour in `constants/index.ts` |

**Exports:** page components (`src/pages/**/index.tsx`) use `export default function PageName()`.
Everything reusable — components, hooks, service functions, utils — uses **named exports**. Don't
mix default exports into `src/components`, `src/services`, or `src/utils`.

## 3. Types: `interface` vs `type`

- **`interface`** for object shapes that represent a "thing" (an entity, a props object, a context
  value): `Product`, `AuthContextValue`, component props.
- **`type`** for unions, derived/mapped types, and anything built from `Omit`/`Partial`/`Pick`:
  ```ts
  export type AvailabilityStatus = 'Available' | 'Unavailable' | 'Under Maintenance';
  export type CreateProductInput = Omit<Product, 'id'>;
  export type UpdateProductInput = Partial<Omit<Product, 'id'>> & { id: number };
  ```
- Small, single-use component props can be typed inline instead of a named interface:
  ```ts
  export function TourCard({ product }: { product: Product }) { ... }
  ```
  Reach for a named `interface` once there are 3+ props, or the props type is reused.
- Only add a doc comment on a type when it encodes a non-obvious domain rule (see `Product.stock`
  in `src/types/product.ts` for the pattern) — not to restate the field name.

## 4. Components

- Function components only, no classes.
- Hooks in this order when a component needs several: `useState` → `useEffect` →
  derived/`useCallback`/`useMemo` → early returns → JSX. Mirror `AuthContext.tsx` for a context +
  provider + consumer hook.
- Loading/empty/data three-way branches are ternary chains in JSX, not separate early returns —
  see `pages/Home/index.tsx`:
  ```tsx
  {loading ? <PageSpinner /> : tours.length === 0 ? <EmptyState title="No tours found." /> : (
    <Row gutter={[24, 24]}>...</Row>
  )}
  ```
- **Styling is inline `style={{}}` objects on AntD/DOM elements** — there are no CSS
  modules/styled-components/Tailwind in this project. Keep using that pattern rather than
  introducing a second styling system. Pull a value into a named constant only if it's reused
  across files (see layout constants like `maxWidth: 1140`, used as a page-container width).
- Compose AntD primitives into small wrapper components instead of repeating the same AntD props
  everywhere (`AvailabilityBadge` wraps `Tag`, `PageSpinner` wraps `Spin`, `EmptyState` wraps
  `Empty`) — see `ARCHITECTURE.md §9`. If you find yourself configuring the same AntD component
  the same way in 2+ places, that's the signal to extract a wrapper into
  `src/components/common/`.

## 5. Data flow: pages → facades → mock services

This is the one rule the codebase enforces structurally — **never import from
`src/services/mock/*` in a page or component.** Always go through the facade in `src/services/*.ts`:

```ts
// ✅ src/pages/Home/index.tsx
import { getFeaturedProducts } from '@/services/productService';

// ❌ never
import { getFeaturedProducts } from '@/services/mock/productService';
```

Why: every facade is currently a one-line re-export (`export * from './mock/productService'`).
When the real Node.js API exists, only the facade body changes — pages don't. Importing the mock
directly breaks that seam. See `ARCHITECTURE.md §5` and `README.md § Where to plug in the real
Node.js API`.

Rules for writing a mock service function (`src/services/mock/*.ts`):
- `async function`, returns a typed `Promise<T>`.
- Start with `await delay()` (or `delay(ms)` for a faster/slower simulated call) from `mock/helpers.ts`.
- Read/write the in-memory DB via `getDb()` / `saveDb()` from `mock/db.ts` — never hold your own
  module-level state.
- On a failure case, `throw new ApiError('Message.', statusCode)` (see `src/types/api.ts`) — not a
  plain `Error` or a generic rejected promise.

## 6. Business rules stay in `src/utils`

Anything that's a decision (pricing, availability, date cutoffs) is a **pure function** with no
I/O in `src/utils/bookingUtils.ts`, called from mock services — never written inline in a
component or duplicated across files. See `ARCHITECTURE.md §7`. Before adding an `if` that decides
availability/pricing/status in a component, check whether it already exists there, and if it's new
domain logic, add it there rather than in the component.

## 7. Context pattern

Every context (`AuthContext`, `AdminAuthContext`, `CartContext`) follows the same shape — copy this
structure for a new one rather than improvising:

1. `const XContext = createContext<XContextValue | undefined>(undefined)`.
2. `XProvider({ children })` owns the state, exposes actions via `useCallback`, and returns a
   `useMemo`-wrapped value object (list every action in the dependency array).
3. `useX()` reads the context and throws if `undefined`:
   ```ts
   export function useAuth(): AuthContextValue {
     const context = useContext(AuthContext);
     if (!context) throw new Error('useAuth must be used within an AuthProvider.');
     return context;
   }
   ```
4. If the context persists to storage, keep the read/write helpers (`readStoredUser` /
   `writeStoredUser` in `AuthContext.tsx`) as module-level functions wrapped in `try/catch` — never
   let a storage failure crash the app; degrade to "doesn't persist" instead.

## 8. Error handling

- Expected failures (not-found, validation, auth) → `throw new ApiError(message, status)` from the
  service layer; catch it where the UI needs to show something, don't let it bubble to a generic
  boundary.
- Storage access (`localStorage`/`sessionStorage`) is always wrapped in `try/catch` with a silent
  fallback — see `writeStoredUser` in `AuthContext.tsx`. A user with storage disabled should
  degrade gracefully, not crash.
- Don't add error handling for cases that can't occur given the mock DB's guarantees (e.g. no need
  to guard against a malformed `Product` coming back from `getDb()` — the seed data and the types
  guarantee its shape).

## 9. Adding things (quick links)

These workflows are already documented — don't duplicate them here, follow them:

- **New page / route:** `README.md § Adding a new page`, and [ROUTES.md](ROUTES.md) for the
  `publicRoutes` / `clientRoutes` / `adminRoutes` structure and guard pattern.
- **New mock service:** `README.md § Adding a new mock service`.
- **New frontend dependency:** add `docs/frontend-dependencies/<name>.md` (see that folder's
  `README.md`) explaining what it is and why it's there, in addition to the `package.json` change.

## 10. What not to do

- Don't import `src/services/mock/*` from a page/component (§5).
- Don't put business rules (availability, pricing, cutoff times) inline in a component (§6).
- Don't introduce a second styling approach (CSS modules, styled-components, Tailwind) alongside
  the existing inline-`style` convention without discussing it first — it's a project-wide
  decision, not a per-component one.
- Don't reach for `any` to silence a type error — model the type, or narrow with a type guard.
- Don't add abstractions (generic hooks, config-driven components) for a single call site. Three
  near-identical lines beat a premature abstraction — this mirrors how `bookingUtils.ts` stays flat
  functions instead of a class/strategy hierarchy.
