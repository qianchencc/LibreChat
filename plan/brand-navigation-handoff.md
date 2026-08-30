# Brand And Gateway Navigation Handoff

## Scope

- Changed the deployment's user-visible default brand from `LibreChat` to `尘Chat` while retaining
  `APP_TITLE` as the runtime override.
- Fixed the login and registration Logo by importing the existing SVG as a Vite source asset.
- Added a `中转站` / `Gateway` link to desktop and mobile Landing navigation. It opens
  `https://proxy.qianc.ltd` in a new tab.

Internal compatibility identifiers such as package names, database names, `X-LibreChat-*` protocol
headers, and cookie names remain unchanged.

## Production Finding

Before this change, `https://libre.qianc.ltd/api/config` returned `appTitle: LibreChat`, and
`/assets/logo.svg` returned a dynamic 404 even with a cache-busting query. The Auth component now
imports `client/src/assets/logo.svg`; the production build emits a hashed asset instead of relying
on that fixed URL.

When deploying, set `APP_TITLE=尘Chat` in the production `.env` if the variable is explicitly set
there. The new code and `.env.example` already use `尘Chat` when the variable is absent.

## Verification

- Client: 31 focused tests passed across login, registration, Landing, document titles, Footer,
  and About.
- API config: 48 tests passed.
- Shared-link config: 7 tests passed.
- Client TypeScript, `@librechat/api` build, and production frontend build passed.
- The frontend build emitted `dist/assets/logo.DN-YJLP0.svg`.
- Chromium confirmed the login Logo loaded at `512x512` with no broken images and the document
  title was `尘Chat`.
- Chromium confirmed desktop and mobile Landing navigation expose `中转站`, target `_blank`, with
  no mobile horizontal overflow.

## Local Preview

The development server remains available at `http://10.15.11.185:3090/`.
