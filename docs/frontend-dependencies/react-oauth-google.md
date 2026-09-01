# @react-oauth/google

**Package:** `@react-oauth/google` — v0.13.5
**Status:** in use (frontend scaffolding only — see below)

## What it is

React bindings for Google Identity Services, providing `GoogleOAuthProvider` and a `GoogleLogin`
button that returns a Google ID token on success.

## Why this project uses it

Implements the "Continue with Google" button on the login page per the frontend spec, without
hand-rolling the Google Identity Services script loading/rendering.

## Where it shows up

- `src/App.tsx` — `GoogleOAuthProvider` wraps the app, `clientId` from `VITE_GOOGLE_CLIENT_ID`.
- `src/pages/Login/index.tsx` — renders `<GoogleLogin>` only when `VITE_GOOGLE_CLIENT_ID` is set;
  otherwise the button/divider simply don't render (no crash, no dead UI).
- `src/contexts/AuthContext.tsx` — `loginWithGoogle(idToken)` forwards the token to
  `src/services/mock/authService.ts::loginWithGoogle`.

## Important: backend work still required

This package only gets a raw Google ID token to the frontend. The mock `loginWithGoogle` decodes
that token **client-side, without verifying it**, purely to demo the UI end-to-end — see the
`TODO(backend)` comment in `src/services/mock/authService.ts`. The real Node.js backend must verify
the token's signature, audience, and expiry server-side (e.g. `google-auth-library`) before
trusting any claims from it. See
[BACKEND_REQUIREMENTS.md](../BACKEND_REQUIREMENTS.md#epic-1--auth--accounts).
