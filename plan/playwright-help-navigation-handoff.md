# Playwright help navigation — 2026-09-10

## Scope and evidence

- Failed workflow: https://github.com/qianchencc/LibreChat/actions/runs/34460563338
  (`redis`, shard `1/2`). `help.spec.ts` clicked Help but remained at `/c/new` on all retries.
- The trace requested the Help chunk successfully. Lazy navigation keeps ChatRoute mounted;
  initialization and redundant query cleanup can supersede the pending destination.
- The September 7 failure was different: `isolation.spec.ts` expected `/` to redirect to login.
  Existing commit `47dee1ea4` fixed it; September 8 and 9 scheduled runs passed.
- Checked upstream through `b356c3d87`; no corresponding navigation fix found.

## Change

See `client/src/routes/ChatRoute.tsx` and `client/src/hooks/Input/useQueryParams.ts`:
defer chat initialization during pending navigation and preserve already-clean URLs.
The workflow, retry counts, timeouts and test coverage remain enabled.

## Verification

- `npm run build:client` and targeted ESLint passed.
- URL parameter hook: 7 tests passed, including unchanged empty/project URLs and prompt submission.
- Redis mock E2E: 11 passed across Help, auth, user isolation and model-spec starters.
- Ablation: remove the two guards, rebuild, and the controlled Help E2E fails at the original
  URL assertion; both unchanged-URL unit cases also fail. Guards restored afterward.
- Memory mock E2E: Help suite repeated three times, 9 passed.
- GitHub full matrix: result to be recorded after completion.

## Release boundary

Use a dedicated `codex/` repair branch for CI verification. Pushing `main` triggers
`.github/workflows/local-deploy.yml` and production deployment.

## Suggested skills

Use `diagnosing-bugs` if CI finds another failure, and `handoff` to update the final validation.
