#!/usr/bin/env bash
# Vercel "Ignored Build Step" — pasted as the command in Project Settings → Git.
#
# Production (main) is deployed exclusively by .github/workflows/deploy-production.yml, which
# runs `vercel deploy --prebuilt --prod` itself. Without this, Vercel's own Git integration would
# ALSO build+deploy main on every push, producing two production deployments per push. Every other
# branch (development, ticket branches) still gets Vercel's normal automatic Preview build.
#
# Exit 0 = skip Vercel's build. Exit 1 = proceed with Vercel's build.
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "Skipping Vercel auto-build on main — deployed via GitHub Actions instead."
  exit 0
else
  exit 1
fi
