# Deployment (Vercel)

Vercel project: https://vercel.com/acme-3452/jdm-experience-frontend

This app has no separate CI/CD pipeline (no GitHub Actions) — Vercel's Git integration *is* the
CI/CD: every push builds, and every PR gets its own preview deployment.

## Build settings

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Install command | `npm install` |
| Build command | `npm run build` (`tsc -b && vite build` — a type error fails the build) |
| Output directory | `dist` |

These match `package.json`'s scripts (see [DEVELOPER_GUIDE.md §1](DEVELOPER_GUIDE.md#1-language--tooling));
nothing Vercel-specific is needed there.

## Environments vs. branches

Vercel's own model is Production (one branch, set in Project Settings → Git → Production Branch)
vs. Preview (every other branch/PR gets a unique preview URL). Mapped onto this repo's branches
(see [WORKFLOW.md](WORKFLOW.md)):

| Branch | Vercel deployment |
|---|---|
| `main` | Production — the Production Branch setting must be `main` |
| `dev` | Preview — pushes to `dev` get a stable preview URL, used as the "development" environment |
| any `TICKETNUMBER-TICKETTITLE` branch / PR | Preview — its own throwaway URL per push |

## Environment variables

Set in the Vercel dashboard under Project Settings → Environment Variables, per the two variables
documented in the README:

| Variable | Production (`main`) | Preview (`dev` / feature branches) |
|---|---|---|
| `VITE_API_URL` | the real deployed backend URL (see [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md)) | staging/dev backend URL, or omit while still mock-only |
| `VITE_USE_MOCKS` | `false` once the real backend is live | `true` until then |

These aren't committed anywhere (`.env` is gitignored) — `.env.example` in the repo root documents
the shape, Vercel's dashboard is the source of truth for actual values per environment.

## SPA routing

This app is a client-side-routed SPA (`react-router-dom`'s `BrowserRouter`, see
[ROUTES.md](ROUTES.md)) — without extra config, a direct hit or refresh on a non-root path like
`/tours/3` or `/admin/dashboard` 404s on Vercel, because there's no `tours/3/index.html` on disk
for it to serve. `vercel.json` at the repo root fixes this by rewriting every path to `index.html`
so `react-router-dom` can take over client-side:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Deploy flow

1. Push to a feature branch / open a PR → Vercel builds a preview deployment automatically, linked
   in the PR checks.
2. Merge into `dev` → preview deployment for `dev` updates.
3. `dev` merged into `main` (per [WORKFLOW.md](WORKFLOW.md)) → Vercel builds and promotes to
   Production.

There's no manual deploy step and no separate CI step to keep in sync — if `npm run build` passes
locally, the same command is what Vercel runs.
