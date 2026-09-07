# Upstream low-risk maintenance handoff

## Scope

Selectively import small upstream fixes that are valuable to the current deployment, apply without
touching the active email-template/Auth work, and avoid feature chains or configuration changes.

## Imported commits

- `f384e71f7` → `d5077bb18`: prevent the quote popup update loop.
- `bf1e13b80` → `65d3160d0`: compare TOTP codes in constant time.
- `6988ff5d7` → `e6b7ceb15`: keep the public sharing role menu from being clipped.
- `7b0b14515` → `0622c3b30`: keep Artifact and MCP flyouts inside the viewport.
- `458c473d9` → `9d90c1503`: normalize Token email values on write.
- `1c2796b97` → `f3d11f8e6`: require an email claim when resolving an invite.

Each local commit includes `-x` provenance back to the upstream commit.

## Deliberately skipped

- `3200f0133`: modifies `packages/api/src/files/mime.*`, which does not exist in this branch. The
  patch depends on the earlier media-type recording chain beginning at `a21c7944e`; restoring only
  these deleted files would add an unused module rather than fix current behavior.
- JWT boot rejection, OpenID/SAML changes, Skill/Artifact feature chains, theme changes, and flat
  thread rendering remain separate integration work because they require configuration checks or
  preceding commits.

## Ablation evidence

- TOTP previously used short-circuit string equality; the imported test observes
  `crypto.timingSafeEqual`.
- Invite lookup previously allowed a token-only query when email was absent; the imported test
  proves the missing-email path is rejected.
- Token reads normalized email but writes did not; the imported tests cover case and whitespace
  mismatches across create, find, and delete.
- Shared-role content was always inside an overflow clip; the imported test distinguishes closed
  clipping from open overflow visibility.
- Tool flyouts previously relied on fixed margins; the imported code delegates flip and shift to
  Ariakit and caps width to the viewport.
- Quote popup positioning previously wrote render-derived coordinates back into state; the
  imported tests cover selection, resize, and scroll updates without that loop.

## Acceptance

- API TOTP tests: 3 passed.
- Package API invite tests: 3 passed.
- Data-schema Token tests: 55 passed.
- Client targeted tests: 16 passed across four suites.
- Client TypeScript: passed.
- `packages/api`, `packages/data-schemas`, and production-shaped frontend builds: passed.
- Prettier, ESLint, and diff whitespace checks: passed.

The frontend build still emits pre-existing warnings for ambiguous Tailwind easing classes,
`vm-browserify` direct eval, large chunks, and unmatched PWA icon globs. None are introduced by
this batch.
