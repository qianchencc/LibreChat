# 尘Chat Theme v1

## Objective

Replace the bundled LibreChat visual defaults with one native, versioned 尘Chat theme while
preserving light/dark switching, deployment color overrides, stored appearance mode, semantic
Tailwind roles, and accessibility.

This is a theme-definition change, not a compatibility layer for `codex-theme-v1`.

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

1. Add a version-1 native theme definition with complete light and dark semantic color maps.
2. Use the existing `appearance.fontFamily` field for the UI serif stack.
3. Make the client `font-sans` family consume the canonical theme font variable so inherited UI
   and existing explicit `font-sans` usages switch together.
4. Install the 尘Chat definition as the default application theme when no
   `REACT_APP_THEME_*` deployment override is present.
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

- `packages/client/src/theme/themes/`: add the 尘Chat light/dark theme data.
- `packages/client/src/theme/registry.ts`: expose it as the application-ready definition without
  changing schema version unless the existing interface proves insufficient.
- `client/src/App.jsx`: choose deployment color overrides first, otherwise the 尘Chat definition.
- `client/tailwind.config.cjs`: route `font-sans` through `--theme-font-family`.
- Theme registry/provider and semantic-token tests: prove mode resolution, override precedence,
  reset behavior, and contrast.

The implementation should not require feature-owned color changes. A component that still looks
wrong should first be checked for a raw color or the wrong semantic role; unrelated component
redesign is outside this slice.

## Observable Acceptance

1. With no theme environment variables, a fresh session renders the 尘Chat light palette and UI
   serif stack.
2. Switching to dark renders the dark inputs above, persists across reload, and introduces no
   unreadable or unchanged light surfaces.
3. `REACT_APP_THEME_*` continues to override deployment colors without disabling appearance-mode
   switching.
4. Login, Landing, Help, chat, composer, menus, dialogs, settings, code blocks, and Artifact tabs
   have no missing text, invisible focus rings, raw LibreChat purple accents, or horizontal layout
   regressions at 1440x900 and 390x844.
5. Normal text reaches WCAG AA contrast; controls and graphical boundaries reach 3:1 where
   required. The supplied bright added/removed colors are not exempt.
6. Existing theme provider, semantic token, client typecheck, focused frontend tests, and
   production frontend build pass.

## Delivery Order

1. Add failing theme-resolution and contrast assertions for deliberately different light/dark
   values.
2. Add the native theme data and application wiring until those assertions pass.
3. Route the UI sans family through the existing theme font variable and verify inherited and
   explicit `font-sans` content.
4. Run browser acceptance in light and dark; correct only semantic-token or shared-font gaps found
   by those screens.
5. Record final screenshots, test commands, and deployment behavior in a handoff before release.

## Release Boundary

Theme implementation is complete only after browser acceptance and a production frontend build.
It should be committed and reviewed independently from the Landing/Help release commits
`546305a05` and `929efbafa`.
