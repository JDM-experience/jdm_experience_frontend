# docx

**Package:** [`docx`](https://www.npmjs.com/package/docx) (npm)
**Status:** candidate — **not installed**, not in `package.json`

## What it is

A client-side library for generating `.docx` (Word) files in the browser, no server round-trip
needed.

## Why this project might use it

The app already renders receipts as HTML (`pages/Receipt`, `pages/admin/OrderReceipt`). If a
"download as Word document" export is ever requested for receipts/orders, `docx` would let that
happen entirely client-side, consistent with the current mock-only, no-backend architecture (see
[ARCHITECTURE.md](../ARCHITECTURE.md)).

## Notes for when/if it's added

- Install: `npm install docx`, plus `npm install --save-dev file-saver` (or use
  `URL.createObjectURL`) to trigger the browser download of the generated `Blob`.
- Would live behind a small helper (e.g. `src/utils/exportReceiptDocx.ts`), called from a button on
  the Receipt page — matches the existing pattern of business logic living in `src/utils/`, not
  inline in components.
- No backend involvement required; this is a pure client-side generation step.
