# Brand Wordmark And Root Route Handoff

## Scope

- Replaced the visible legacy Auth logo and Landing product-name text with the supplied 尘Chat
  light/dark PNG wordmarks.
- Kept runtime `APP_TITLE` compatibility: a non-default deployment title renders as text instead
  of showing a mismatched 尘Chat asset.
- Removed the authenticated redirect from `/` to `/c/new`; the product Landing page now remains
  available to both anonymous and authenticated visitors.
- Increased Landing-only Lenis damping by changing `lerp` from `0.1` to `0.075`.

## Assets

Both source images are `1088x336` RGBA PNGs. Vite emitted distinct versioned production assets:

- `chenchat.BXk12EkN.png` for light mode
- `chenchat-dark.Dq6u8y9O.png` for dark mode

The shared `BrandWordmark` uses existing `dark` utilities to switch assets without new theme
state. Landing renders it in the header, Hero, and footer; Auth renders it above login and
registration.

## Verification

- Focused Landing, Auth, and root-route suites passed: 3 suites, 8 tests.
- Frontend TypeScript, targeted ESLint, Prettier, and `git diff --check` passed.
- The production frontend build passed and emitted both PNG files at their full source size.
- Chromium confirmed light/dark switching, correct natural dimensions, no stretching, and no
  horizontal overflow at desktop and `390x844`.
- An authenticated browser remained at `/` and rendered Landing instead of navigating to
  `/c/new`.
- A synthetic 800px wheel input followed a gradual Lenis trajectory over roughly 800ms, confirming
  the increased damping is active.

## Release

This is a local release candidate. No push or deployment was performed.
