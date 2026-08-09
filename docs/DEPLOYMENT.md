# Deployment (Vercel)

Vercel project: https://vercel.com/acme-3452/jdm-experience-frontend

Production deploys to Vercel are driven by the GitHub Actions workflow at
[.github/workflows/deploy-production.yml](../.github/workflows/deploy-production.yml) (see
§ [CI/CD](#cicd-github-actions) below), not Vercel's own Git integration.

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

Vercel has **three** built-in environments — don't confuse Vercel's own "Development" environment
with this repo's `development` git branch; despite the shared name they're unrelated (the branch
gets a *Preview* deployment, not Vercel's "Development" environment):

| Vercel environment | What it's for | Maps to (this repo) |
|---|---|---|
| Production | The live site. One branch, set in Project Settings → Git → Production Branch | `main` → https://jdm-experience-frontend.vercel.app/ |
| Preview | Every branch/PR that isn't the Production Branch gets its own throwaway URL | `development` → https://jdm-experience-frontend-git-development-acme-3452.vercel.app/, plus every `TICKETNUMBER-TICKETTITLE` branch at its own URL |
| Development | Not a deployment at all — only feeds `vercel dev` / `vercel env pull` for local work | n/a (local machine, not CI) |

## Environment variables

Set per-environment in the Vercel dashboard under Project Settings → Environment Variables (Project
tab, the screen has a dropdown for Development/Preview/Production). Values, matching
`.env.example`:

| Variable | Development | Preview (`development` / feature branches) | Production (`main`) |
|---|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api` | staging backend URL once one exists, else leave unset | the real deployed backend URL (see [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md)), once it exists |
| `VITE_USE_MOCKS` | `true` | `true` | `true` for now — flip to `false` once the real backend from `BACKEND_REQUIREMENTS.md` is live |

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

## CI/CD (GitHub Actions)

[.github/workflows/deploy-production.yml](../.github/workflows/deploy-production.yml) runs on
every push to `main`:

1. Checkout, install Node (`24`, matching `@types/node` in `package.json`), `npm ci`.
2. `npm run build` — the app's own production build (`tsc -b && vite build`); a type error or
   build failure stops the workflow here.
3. Install the Vercel CLI, `vercel pull` / `vercel build --prod` / `vercel deploy --prebuilt --prod`
   — builds and deploys using Vercel's own toolchain against the linked project, promoting straight
   to Production.

Any failed step (build or deploy) fails the job — GitHub Actions stops a job at the first non-zero
exit by default, nothing in the workflow suppresses that.

**Required repo secrets** (Settings → Secrets and variables → Actions), all scoped to the
`production` environment the job runs under:

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after running `vercel link` locally, or Vercel project Settings → General |
| `VERCEL_PROJECT_ID` | same as above |

**Avoid double deploys:** if this repo is also connected to Vercel's own GitHub integration with
`main` as the Production Branch, *both* that integration and this workflow will try to deploy on
every push to `main`. Turn off Vercel's automatic deployments for Production (Project Settings →
Git → “Ignored Build Step” or disconnect the GitHub integration's auto-deploy) so this workflow is
the only thing promoting to Production — Preview deployments for other branches/PRs can stay on
Vercel's native integration.

## Deploy flow

1. Push to a feature branch / open a PR → Vercel's native integration builds a preview deployment,
   linked in the PR checks.
2. Merge into `development` → preview deployment for `development` updates.
3. `development` merged into `main` (per [WORKFLOW.md](WORKFLOW.md)) → the GitHub Actions workflow above
   builds and deploys to Production.
