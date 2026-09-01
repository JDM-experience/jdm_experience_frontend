# @google-recaptcha/react

**Package:** `@google-recaptcha/react` — v2.5.3
**Status:** in use (frontend scaffolding only — see below)

## What it is

TypeScript-first React bindings for Google reCAPTCHA (`GoogleReCaptchaProvider`,
`GoogleReCaptchaCheckbox`, and a `useGoogleReCaptcha` hook).

## Why this project uses it

Chosen over `react-google-recaptcha` (which has reported React 19 breakage) — this package
explicitly supports React 19 and is TypeScript-first. Used for the v2 checkbox widget on login, per
the frontend spec's "official `@google-recaptcha` widget" option.

## Where it shows up

- `src/pages/Login/index.tsx` — `GoogleReCaptchaProvider` (`type="v2-checkbox"`,
  `siteKey={VITE_RECAPTCHA_SITE_KEY}`) wraps a `GoogleReCaptchaCheckbox`, rendered only when
  `VITE_RECAPTCHA_SITE_KEY` is set. Login submission is blocked with an inline error until the
  checkbox is completed; the widget remounts (fresh, unchecked) after a failed login attempt since
  v2 tokens are single-use.

## Important: backend work still required

This package only obtains a client-side reCAPTCHA token — nothing here verifies it. The real
Node.js backend must verify the token against Google's `siteverify` endpoint using a **secret** key
that lives only on the backend, before treating a login attempt as CAPTCHA-protected. See
[BACKEND_REQUIREMENTS.md](../BACKEND_REQUIREMENTS.md#epic-1--auth--accounts).
