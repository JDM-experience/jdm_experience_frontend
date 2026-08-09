# Deployment (Vercel)

Vercel project: https://vercel.com/acme-3452/jdm-experience-frontend

**Current state:** Vercel's own Git integration deploys every push (Production from `main`,
Preview from everything else) — this is what's actually live today. A GitHub Actions workflow to
take over Production deploys has been written but isn't wired up yet; see
[§ TODO](#todo--switch-production-deploys-to-github-actions).

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

## TODO — switch production deploys to GitHub Actions

- [x] Workflow written: [.github/workflows/deploy-production.yml](../.github/workflows/deploy-production.yml)
- [x] Ignored Build Step script written: [scripts/vercel-ignore-build.sh](../scripts/vercel-ignore-build.sh)
- [x] GitHub repo secrets added (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)
- [ ] Merge the branch carrying the workflow + script through `development` → `main` (per
      [WORKFLOW.md](WORKFLOW.md)) — until then, neither file exists on `main`, so the workflow's
      `push: branches: [main]` trigger can't fire yet
- [ ] Only *after* that merge, set Vercel's Ignored Build Step (Project Settings → Git → Ignored
      Build Step → Custom → `bash scripts/vercel-ignore-build.sh`) — doing this before the merge
      would make Vercel skip `main` while the Action still can't run there, stopping Production
      deploys entirely
- [ ] Verify: push to `main`, confirm the Action's run succeeds and Vercel's dashboard shows the
      build skipped rather than a duplicate deployment

Until this is done, **do not** touch the Ignored Build Step — leave Vercel deploying `main`
natively, as it does today.

## CI/CD (GitHub Actions) — not yet active, see TODO above

[.github/workflows/deploy-production.yml](../.github/workflows/deploy-production.yml) is designed
to run on every push to `main`, once the TODO above is complete:

1. Checkout, install Node (`24`, matching `@types/node` in `package.json`), `npm ci`.
2. `npm run build` — the app's own production build (`tsc -b && vite build`); a type error or
   build failure stops the workflow here.
3. Install the Vercel CLI, `vercel pull` / `vercel build --prod` / `vercel deploy --prebuilt --prod`
   — builds and deploys using Vercel's own toolchain against the linked project, promoting straight
   to Production.

Any failed step (build or deploy) fails the job — GitHub Actions stops a job at the first non-zero
exit by default, nothing in the workflow suppresses that.

**Required repo secrets** — GitHub repo → Settings → Secrets and variables → Actions → **New
repository secret**, add all three (repository-level, not environment-scoped — simpler, and the
job's `environment: production` will read them either way):

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → click your avatar → Account Settings → Tokens → Create Token. Copy it immediately, it's shown once. |
| `VERCEL_ORG_ID` | The team's ID: Vercel → `acme-3452` team → Settings → General → "Team ID" |
| `VERCEL_PROJECT_ID` | The project's ID: Vercel project → Settings → General → "Project ID" |

Before secrets exist, this workflow fails at the `vercel pull` step with an auth error — that's
expected, not a bug, until all three are added.

**Avoid double deploys:** Vercel's own GitHub integration deploys automatically with zero repo
secrets (it authenticates separately) — that's what's been deploying every push so far, entirely
independent of this workflow. Once the workflow above is live, *both* it and Vercel's integration
will try to deploy `main` on every push unless one is turned off. Rather than deploying Production
twice, add [scripts/vercel-ignore-build.sh](../scripts/vercel-ignore-build.sh) as Vercel's
**Ignored Build Step** (Project Settings → Git → Ignored Build Step → Custom → enter
`bash scripts/vercel-ignore-build.sh`). It skips Vercel's own build only on `main`, so:
- `main` → only the GitHub Actions workflow deploys Production.
- `development` / ticket branches → Vercel's native integration still auto-builds Preview, unchanged.

## Deploy flow (current — until the TODO above is done)

1. Push to a feature branch / open a PR → Vercel's native integration builds a preview deployment,
   linked in the PR checks.
2. Merge into `development` → preview deployment for `development` updates.
3. `development` merged into `main` (per [WORKFLOW.md](WORKFLOW.md)) → Vercel's native integration
   builds and deploys straight to Production. (Once the TODO above ships, this step becomes the
   GitHub Actions workflow instead.)
