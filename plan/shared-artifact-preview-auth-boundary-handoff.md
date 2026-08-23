# Shared Artifact Preview Auth Boundary Handoff

## Outcome

Shared Artifact previews no longer require `AuthProvider`. Shared `attachment://` references resolve to absolute, same-origin share snapshot URLs, while authenticated private Artifacts retain signed user-file URL resolution.

The implementation and regression coverage are in the current working-tree diff. No production deployment has been performed.

## Verification

- `client`: Artifact component and hook suites, 11 suites / 127 tests passed.
- `client`: `npm run typecheck` passed.
- Targeted ESLint and import-sort checks passed.
- `npm run build:data-provider` passed.
- `client`: production `npm run build` passed and emitted `SandboxArtifactTabs.DgBotTie.js`.
- Final Standards and Spec reviews reported no remaining findings.

## Release Follow-up

This release also includes the root `AGENTS.md` update and `skill/eli5/` at the user's request. Rebuild and deploy the frontend, then verify a real shared conversation containing an Artifact with both an image and a downloadable attachment.

## Suggested Skills

- `github:yeet` for an explicitly authorized publish flow.
- `agent-browser` for logged-in production verification after deployment.
