# Landing workflow artwork handoff

## Scope

- Reuse `/assets/email/auth-hero.jpg` as a blurred decorative underlay for all four Landing
  workflow cards.
- Keep videos crisp and preserve the existing stacked-card recession behavior.
- Do not include the email-template worktree changes that currently own the artwork asset.

## Implementation

- Each workflow card renders one empty-alt, `aria-hidden` artwork image.
- The image is blurred, slightly enlarged, and composited under a semantic surface overlay.
- Video and copy layers use `z-10`; the existing receded-card overlay remains at `z-20`.
- Mobile reduces artwork opacity while retaining normal document flow.

## Acceptance

- Landing Jest suite: 4 tests passed.
- Client TypeScript, Landing source ESLint, Prettier, and `git diff --check` passed.
- Browser checked at `1440x900` and `390x844` in light and dark themes.
- All four artwork images loaded; videos remained at opacity 1, no filter, and playback rate 1.
- No horizontal overflow was introduced.
- Scrolling to story 3 set stories 1 and 2 receded overlays to full opacity.

## Dependency

The email-template work must commit `client/public/assets/email/auth-hero.jpg` before this change is
deployed. This handoff intentionally does not stage or take ownership of that directory.
