# Routing

How `src/routes/**` and `src/App.tsx` fit together, and how to add a new route. For the
route → original-PHP-file mapping, see [ARCHITECTURE.md §3](ARCHITECTURE.md#3-routing-map); this
doc covers the code structure that implements it.

## 1. File layout

```
src/routes/
├── types.ts               # AppRoute — the shape every route array entry follows
├── public/index.tsx        # publicRoutes  — MainLayout, no auth required
├── client/index.tsx        # clientRoutes  — MainLayout + ProtectedRoute (customer login required)
├── admin/index.tsx         # adminRoutes   — AdminLayout + AdminProtectedRoute
├── ProtectedRoute.tsx       # customer auth guard (redirects to /login?redirect=...)
├── AdminProtectedRoute.tsx  # admin auth guard (redirects to /admin/login)
└── RouteMain.tsx            # composes the three arrays + guards + layouts into <Routes>
```

`App.tsx` only renders `<RouteMain />` inside its providers — it doesn't know about individual
pages or paths. That split is deliberate: `App.tsx` owns app-wide setup (theme, router, context
providers), `RouteMain.tsx` owns the route tree, one responsibility each.

## 2. `AppRoute`

```ts
// src/routes/types.ts
export interface AppRoute {
  path?: string;   // omit only for the layout's index route
  index?: boolean;  // true for the index route (e.g. Home)
  element: ReactNode;
}
```

Each of `publicRoutes` / `clientRoutes` / `adminRoutes` is an `AppRoute[]`. `RouteMain` turns an
array into `<Route>` elements with a single `.map(...)`:

```tsx
{publicRoutes.map(({ path, index, element }) => (
  <Route key={path ?? 'index'} index={index} path={path} element={element} />
))}
```

## 3. The three buckets — how to choose

| Array | Layout | Guard | Use for |
|---|---|---|---|
| `publicRoutes` | `MainLayout` | none | Customer-facing pages anyone can view (Home, Tours, Login, ...) |
| `clientRoutes` | `MainLayout` | `ProtectedRoute` | Customer-facing pages that require login (Checkout, Profile, ...) |
| `adminRoutes` | `AdminLayout` | `AdminProtectedRoute` | Admin panel pages (Dashboard, Tours, Orders, ...) |

Two routes don't fit any bucket and stay as direct `<Route>` lines in `RouteMain.tsx` instead:
- `admin/login` — renders without `AdminLayout` or a guard (you're not admin-authenticated yet).
- `admin` → `<Navigate to="/admin/dashboard" replace />` — a redirect, not a page component.

If a future route is similarly layout-less/guard-less, follow that same pattern rather than
forcing it into `AppRoute[]`.

## 4. Adding a new route

1. Create the page: `src/pages/YourPage/index.tsx` (see
   [DEVELOPER_GUIDE.md §2](DEVELOPER_GUIDE.md#2-naming--file-layout)).
2. Add one `{ path: '...', element: <YourPage /> }` entry to the right array
   (`src/routes/public/index.tsx`, `client/index.tsx`, or `admin/index.tsx`) — import the page at
   the top of that same file.
3. Nothing else changes. `RouteMain.tsx` picks it up automatically via the array's `.map(...)`.
4. If it needs data, add functions to `src/services/mock/*Service.ts` + re-export from the facade
   — never import `services/mock/*` directly from a page (see
   [DEVELOPER_GUIDE.md §5](DEVELOPER_GUIDE.md#5-data-flow-pages--facades--mock-services)).

## 5. Guards

`ProtectedRoute` and `AdminProtectedRoute` (`src/routes/*.tsx`) both follow the same shape: read
`isInitializing`/`isAuthenticated` from the relevant context hook, show a centered `Spin` while
initializing, `<Navigate>` away if not authenticated, otherwise render `<Outlet />` for the nested
routes. Copy this shape if a third guard is ever needed (e.g. a driver/staff role) rather than
branching inside an existing guard.
