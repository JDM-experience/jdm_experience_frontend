# TypeScript

**Package:** `typescript` — v6.0.2
**Status:** in use

## What it is

Static typing on top of JavaScript. The project is 100% `.ts`/`.tsx` — there are no `.js` source
files.

## Why this project uses it

Type safety across the service layer contract in particular: `src/types/*.ts` defines `Product`,
`User`, `Order`, `CartItem`, `ContactMessage`, `AdminUser`, `ApiError`, etc., and every mock
service / facade function is typed against them. This is what lets the mock layer be swapped for a
real Node.js API later without changing call sites (see
[ARCHITECTURE.md §5](../ARCHITECTURE.md#5-service-layer-contract)) — the compiler enforces the
same function signatures on both sides.

## Where it shows up

- `tsconfig.json` (project references) → `tsconfig.app.json` / `tsconfig.node.json`.
- `src/types/` — shared domain types.
- `npm run build` runs `tsc -b` before `vite build`, so type errors fail the build.
