# 尘Chat Theme v1

## Objective

Replace the bundled LibreChat visual defaults with the native 尘Chat palette while preserving
light/dark switching, deployment color overrides, stored appearance mode, semantic Tailwind roles,
and accessibility.

尘Chat is the default product identity of this fork, so this changes the bundled light/dark
defaults instead of injecting a controlled deployment theme from `App.jsx`. It is not a
compatibility layer for `codex-theme-v1`.

## Frozen Inputs

| Role           | Light                                                                          | Dark          |
| -------------- | ------------------------------------------------------------------------------ | ------------- |
| Base surface   | `#f5f4ee`                                                                      | `#2d2d2b`     |
| Base ink       | `#141413`                                                                      | `#f9f9f7`     |
| Accent         | `#da7756`                                                                      | `#cc7d5e`     |
| Added intent   | `#00c853`                                                                      | `#00c853`     |
| Removed intent | `#ff5f38`                                                                      | `#ff5f38`     |
| UI font stack  | `ui-serif, Georgia, Cambria, "Times New Roman", Times, "Noto Serif SC", serif` | Same as light |

The three base colors are design inputs, not values to copy into every component. Hover,
secondary, border, overlay, focus, inverted, and status roles must be explicit accessible
derivatives.

## Scope

1. Replace the bundled default light and dark semantic color maps.
2. Change the existing default `appearance.fontFamily` value to the UI serif stack.
3. Make the client `font-sans` family consume the canonical theme font variable so inherited UI
   and existing explicit `font-sans` usages switch together.
4. Keep `App.jsx` and the existing `REACT_APP_THEME_*` adapter unchanged.
5. Keep the current light/dark/system selector and local-storage behavior.
6. Validate semantic contrast and visually accept the main public, auth, chat, settings, Help,
   and Artifact surfaces in both modes.

## Explicit Non-Goals

- Do not parse or store the supplied `codex-theme-v1` JSON.
- Do not add `contrast`, `opaqueWindows`, or `codeThemeId` fields to LibreChat's theme schema.
- Do not add an independent Skill color until a real cross-screen component requires that role.
- Do not change Highlight.js or Monaco themes in this slice. Monaco remains `vs-dark`, and code
  keeps the existing mono family.
- Do not bundle a new font in v1. The browser uses the declared serif stack; exact cross-platform
  Chinese typography can become a separate self-hosted-font slice after visual acceptance.
- Do not replace protocol names, package names, storage keys, or other LibreChat compatibility
  identifiers.
- Do not import the unmerged upstream high-contrast appearance branch. It is a separate
  accessibility mode and can coexist with these defaults if it lands later.

## Upstream Decision

`upstream/main` contains `f9c051f8e` (`Support Non-Persistent Controlled Themes`). That change is
valuable when an application injects a controlled `themeDefinition`, but this implementation does
not do that. Updating the bundled defaults avoids the storage problem entirely, so this batch does
not port or cherry-pick the upstream commit.

The unmerged `upstream/berry-13/accesibility-theme` branch demonstrates useful contrast tests, but
also adds new appearance modes and a much larger UI surface. Reuse its test principles only; do
not couple the 尘Chat brand theme to that branch.

## Native Mapping

- `surface` anchors `surface-primary` and `surface-chat`; related surfaces must remain visibly
  distinct without turning the product into a one-hue palette.
- `ink` anchors `text-primary`; secondary and tertiary text use accessible softened values rather
  than opacity applied ad hoc in components.
- `accent` anchors links, focus, and selected emphasis. Strong action surfaces may use a darker or
  lighter derivative when the exact accent cannot support their foreground contrast.
- Added/removed inputs express intent. Exact bright values may be retained for strong decoration,
  while status text and borders use accessible derivatives.
- Existing categorical series keep distinct hues and their tested order; they are adjusted only
  if either new base surface breaks their contrast guarantees.

## Expected Code Boundary

- `packages/client/src/theme/themes/default.ts`: replace the bundled light semantic values.
- `packages/client/src/theme/themes/dark.ts`: replace the bundled dark semantic values.
- `packages/client/src/theme/registry.ts`: change only the default UI font stack; do not change the
  schema or provider behavior.
- `client/src/style.css`: keep the no-JavaScript CSS fallbacks aligned with the same values.
- `client/tailwind.config.cjs`: route `font-sans` through `--theme-font-family`.
- Existing theme and semantic-token tests: prove default alignment and contrast. ThemeProvider
  behavior does not need a new abstraction or controlled-theme path.

The implementation should not require feature-owned color changes. A component that still looks
wrong should first be checked for a raw color or the wrong semantic role; unrelated component
redesign is outside this slice.

## Observable Acceptance

1. With no theme environment variables, a fresh session renders the 尘Chat light palette and UI
   serif stack.
2. Switching to dark renders the dark inputs above, persists across reload, and introduces no
   unreadable or unchanged light surfaces.
3. Existing `REACT_APP_THEME_*` behavior is unchanged and continues to override bundled colors.
4. Login, Landing, Help, chat, composer, menus, dialogs, settings, code blocks, and Artifact tabs
   have no missing text, invisible focus rings, raw LibreChat purple accents, or horizontal layout
   regressions at 1440x900 and 390x844.
5. Normal text reaches WCAG AA contrast; controls and graphical boundaries reach 3:1 where
   required. The supplied bright added/removed colors are not exempt.
6. Existing theme provider, semantic token, client typecheck, focused frontend tests, and
   production frontend build pass.

## Delivery Order

1. Add failing default-alignment and contrast assertions for deliberately different light/dark
   values.
2. Replace the bundled semantic defaults until those assertions pass.
3. Route the UI sans family through the existing theme font variable and verify inherited and
   explicit `font-sans` content.
4. Run browser acceptance in light and dark; correct only semantic-token or shared-font gaps found
   by those screens.
5. Record final screenshots, test commands, and deployment behavior in a handoff before release.

## Release Boundary

Theme implementation is complete only after browser acceptance and a production frontend build.
It should be committed and reviewed independently from the Landing/Help release commits
`546305a05` and `929efbafa`.
