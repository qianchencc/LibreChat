# Chat home navigation handoff

## Scope

Give authenticated users a visible way to return from the workspace to the public landing page.

## Implementation

- Desktop: a home icon sits above the account avatar in the persistent sidebar rail.
- Mobile: the same action sits beside the account control in the drawer header.
- Both actions are native links to `/`, reuse the shared button variants, and use the existing
  localized back label.

## Acceptance

- Unified sidebar Jest suites: 2 passed, 17 tests.
- Desktop browser QA: the link is visible at 36 by 36 pixels in the collapsed rail.
- Mobile browser QA: the link fits the 390 by 844 drawer header without clipping or crowding.
- Browser navigation from `/c/new` reached `/`.
- Prettier, ESLint, TypeScript, and `git diff --check`: passed.
