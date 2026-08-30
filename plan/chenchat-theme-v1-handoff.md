# 尘Chat Theme v1 Handoff

## Scope

Replaced the bundled LibreChat light and dark defaults with the approved native 尘Chat palette.
The implementation stays inside the existing semantic theme registry, CSS fallbacks, and
Tailwind font role. It does not add a theme schema, parser, component override, dependency, or
controlled `themeDefinition`.

The existing light/dark/system selector, stored appearance mode, `REACT_APP_THEME_*` deployment
overrides, code fonts, Highlight.js themes, and Monaco configuration remain unchanged.

## Theme Contract

- Light anchors: surface `#f5f4ee`, ink `#141413`, action surface `#da7756`.
- Dark anchors: surface `#2d2d2b`, ink `#f9f9f7`, action surface `#cc7d5e`.
- UI text uses `ui-serif, Georgia, Cambria, "Times New Roman", Times, "Noto Serif SC", serif`
  through the existing `--theme-font-family` role.
- Code continues to use the existing monospace stacks.
- The exact supplied accents remain on strong action surfaces. Text links and accents use
  accessible mode-specific derivatives because the exact inputs measured only 2.82:1 in light
  mode and 4.38:1 in dark mode on their base surfaces.
- Exact added and removed intent colors remain available on strong status surfaces; readable
  derivatives are used for text and borders.

## Acceptance

- Theme package: `npx jest src/theme --runInBand` passed 6 suites and 74 tests.
- Frontend TypeScript: `npm run typecheck` passed.
- Focused Landing, Help, Auth, Footer, Artifact, and Settings component tests passed.
- Mock Help E2E: `npx playwright test --config=e2e/playwright.config.mock.ts help.spec.ts`
  passed 2 tests.
- Production preparation/build: `npm run e2e:prepare` passed.
- Prettier and `git diff --check` passed for the complete change.
- Chromium acceptance covered Landing, Login, Help, Settings, and the authenticated chat shell in
  light and dark modes at desktop and mobile widths. Checked pages had no horizontal overflow,
  and keyboard focus remained visible.
- Computed styles matched the approved surface, ink, accent, and serif font values.

Acceptance screenshots were kept outside the repository at `/tmp/chen-theme-*.png`.

## E2E Harness Note

The public Landing route means registration setup can no longer start at `/`. The mock E2E auth
setup now opens `/login` explicitly and fixes its locale to English, matching the harness's
English locators. This is test infrastructure only and does not alter production locale behavior.

## Release

This handoff covers a local release candidate only. No push or deployment was performed. A normal
frontend image rebuild is required for production to receive the new bundled defaults.
