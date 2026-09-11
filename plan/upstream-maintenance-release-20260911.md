# Upstream maintenance release handoff

## Scope

Import the five isolated fixes selected in
[`plan/upstream-maintenance-review-20260911.md`](./upstream-maintenance-review-20260911.md).
Do not include the larger attachment, BYOM, MCP, CodeAPI, theme, or dependency-upgrade trains.

## Imported commits

- `5020dbd23` → `345bc8f60`: guard missing social-login avatar URLs.
- `b356c3d87` → `c7b7044b5`: treat blank Mongo index settings as unset.
- `c9b964416` → `eb59150fa`: give Toasts independent Radix lifecycles and support persistent Toasts.
- `5cd70ad61` → `26569813b`: raise body-portaled Popovers above Dialog layers.
- `3cab71c48` → `76bd20920`: wait for durable message finalization in conversation-management Mock E2E.

Each local commit retains upstream provenance through `git cherry-pick -x`.

## Acceptance

- `api/strategies/process.test.js`: 19 passed.
- `packages/api/src/utils/common.spec.ts`: 21 passed.
- Toast and nested-Popover component suites: 9 passed.
- `e2e/specs/mock/conversation-management.spec.ts`: 3 Chromium scenarios passed.
- Targeted Prettier and ESLint checks: passed.
- `npm run frontend`: passed, including data-provider, data-schemas, API, shared client, and
  production Vite builds.
- `git diff --check`: passed.

The production build emitted the existing ambiguous Tailwind easing, `vm-browserify` direct-eval,
large-chunk, and PWA icon-glob warnings. The Mock E2E teardown also logged interrupted index builds
after closing its temporary Mongo client; all three scenarios and cleanup completed successfully.
Neither warning set was introduced or expanded by this batch.

## Release and rollback

Push the release branch and fast-forward `origin/main` to `76bd20920`. The existing
`.github/workflows/local-deploy.yml` workflow builds the production image, transfers it over the LAN,
replaces the application container, and rolls back automatically if its HTTP health check fails.

Production acceptance must confirm the deployed build commit and the public landing/login routes.
Authenticated social-login-without-avatar and nested Agent Dialog flows remain covered by their
targeted tests unless suitable production provider credentials and a disposable account are
available.
