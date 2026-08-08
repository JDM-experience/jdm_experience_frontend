# Ant Design

**Package:** `antd` — v6.5.4, `@ant-design/icons` — v6.3.2
**Status:** in use

## What it is

The component library used for all non-trivial UI: forms, tables, modals, tags, spinners, etc.

## Why this project uses it

The original PHP app's admin panel and customer-facing forms needed a component set with tables,
form validation, and modals out of the box, without hand-rolling them. AntD's `Empty`, `Spin`,
`Tag`, `AutoComplete`, etc. are wrapped into project-specific components rather than used raw
everywhere (see [ARCHITECTURE.md §9](../ARCHITECTURE.md#9-component-catalog-srccomponentscommon)).

## Where it shows up

- `src/components/common/` — `EmptyState` (wraps AntD `Empty`), `PageSpinner` (wraps `Spin`),
  `AvailabilityBadge` / `OrderStatusTag` (wrap `Tag`).
- `src/components/layout/Navbar.tsx` — `AutoComplete` for live search.
- Admin CRUD pages (`src/pages/admin/**`) — tables, forms, modals.
