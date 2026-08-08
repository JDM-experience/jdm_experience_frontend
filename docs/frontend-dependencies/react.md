# React

**Package:** `react`, `react-dom` — v19.2.8
**Status:** in use

## What it is

The UI library the entire app is built on — every page and component in `src/` is a React
function component.

## Why this project uses it

It's the base of the stack: the app is a React rebuild of the original PHP "Japan JDM Experience"
site (see [README.md](../../README.md)). Function components + hooks (`useState`, `useEffect`,
`useContext`) are used throughout; no class components.

## Where it shows up

- `src/pages/**` — one folder per route.
- `src/components/**` — shared UI (`common/`) and layout chrome (`layout/`).
- `src/contexts/**` — `AuthContext`, `AdminAuthContext`, `CartContext`, each exposing a hook.
- Routing is `react-router-dom` v7 (`src/App.tsx`), a separate package built on top of React.
