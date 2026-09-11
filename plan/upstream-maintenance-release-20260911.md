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

The release branch and `origin/main` were advanced to `a00cb5d94f9a7578b67353b7f91031652abb9d17`.
GitHub Actions run [34573262596](https://github.com/qianchencc/LibreChat/actions/runs/34573262596)
successfully built the production image, transferred it over the LAN, replaced the application
container, and completed its HTTP health check in 8 minutes 2 seconds.

Production acceptance confirmed:

- The `LibreChat` container reports `BUILD_COMMIT=a00cb5d94f9a7578b67353b7f91031652abb9d17`,
  `BUILD_BRANCH=main`, and healthy status.
- The container-local root route returns HTTP 200.
- The Cloudflare-fronted `https://libre.qianc.ltd/` route returns HTTP 200 with dynamic/no-store
  caching headers.
- A clean Chromium session rendered the public 尘Chat landing page, followed its login link, and
  rendered the email/password login form without a client error.
- Production Mongo connection options omit `autoIndex` and `autoCreate` when their environment
  values are blank, confirming the new unset semantics.

Social login is disabled in the current production configuration, so the missing-avatar behavior
remains covered by its 19-test targeted suite. Authenticated nested Agent Dialog flows remain
covered by the component regression suite because no disposable production account was used.

The startup log still contains the previously recorded Mongo partial-index incompatibility for
`meili_excluded_legacy_cleanup_v3`; see `plan/memory-enablement-handoff.md`. It also reports that
scheduled-chat writes are disabled until production either enables a shared Redis stream store or
sets `SCHEDULES_SINGLE_PROCESS=true`. Both findings predate and are outside this maintenance batch;
no database indexes or scheduling configuration were changed.
