# 尘Chat Theme v1 Tickets

## Batch Contract

This batch delivers one business outcome: a fresh 尘Chat deployment presents the approved light
and dark visual identity across the real application without weakening theme compatibility or
accessibility.

Work the tickets in order. T1 and T2 both touch the canonical theme module and must not be assigned
to parallel agents. T3 starts only after their commits are available.

Expected production-code change: about 160-260 changed lines, primarily data. Test changes are
expected to add about 80-160 lines. Browser findings may justify small semantic-role corrections,
but they may not expand into component redesign.

## T1: Replace Semantic Defaults

**Status:** Complete

**Blocks:** T2, T3

**Outcome:** Every bundled light/dark semantic role resolves to a deliberate 尘Chat value and the
base surface, ink, and accent inputs are visible in the resolved theme.

**Expected files:**

- `packages/client/src/theme/themes/default.ts`
- `packages/client/src/theme/themes/dark.ts`
- `client/src/style.css`
- `packages/client/src/theme/semanticTokens.spec.ts`
- A focused default/CSS-alignment test only if the existing suite cannot observe the fallback

**Implementation constraints:**

- Keep complete RGB channel-triplet maps; do not add hex values to runtime theme variables.
- Preserve every existing token and categorical series ordering.
- Use exact base surface, ink, and accent inputs only where their semantic role fits.
- Derive secondary surfaces, borders, hover states, overlays, and status families explicitly.
- Use accessible added/removed derivatives for text and borders when the supplied bright colors
  fail contrast; exact bright values may be used only where their foreground/background contract
  passes.
- Keep `default.ts`, `dark.ts`, and the no-JavaScript CSS fallback values synchronized.
- Do not edit feature components in this ticket.

**Observable tests:**

- The resolved light theme exposes `#f5f4ee`, `#141413`, and `#da7756` at their intended roles.
- The resolved dark theme exposes `#2d2d2b`, `#f9f9f7`, and `#cc7d5e` at their intended roles.
- Normal text/surface pairs meet 4.5:1; large text and non-text boundaries follow their existing
  tested thresholds.
- Strong status surfaces remain readable with `text-on-status` in both modes.
- Categorical series retain the existing order and required contrast against the new surfaces.

**Verification:**

```bash
cd packages/client
npx jest src/theme/registry.spec.ts src/theme/semanticTokens.spec.ts --runInBand
```

## T2: Apply the Existing UI Font Role Globally

**Status:** Complete

**Blocked by:** T1

**Blocks:** T3

**Outcome:** Inherited UI text and existing `font-sans` elements use the approved serif stack in
both modes, while code remains on the existing monospace stack.

**Expected files:**

- `packages/client/src/theme/registry.ts`
- `packages/client/src/theme/tailwind.spec.js`
- `client/tailwind.config.cjs`
- A narrow client style/config test if needed to observe the compiled family

**Implementation constraints:**

- Use the existing `--theme-font-family` and `appearance.fontFamily` interface.
- Point the client `fontFamily.sans` value at that CSS variable with a safe fallback.
- Do not add `codeFontFamily`, new font files, font-loading dependencies, or component-level font
  classes.
- Do not change spacing or font size to compensate before browser acceptance identifies a real
  overflow.

**Observable tests:**

- `font-theme-ui`, inherited UI text, and `font-sans` resolve through the same theme variable.
- `font-mono`, `code`, `pre`, and Monaco behavior remain unchanged.
- Switching light/dark does not change the font family.

**Verification:**

```bash
cd packages/client
npx jest src/theme/registry.spec.ts src/theme/tailwind.spec.js --runInBand
cd ../../client
npm run typecheck
```

## T3: Browser Acceptance And Release Candidate

**Status:** Complete

**Blocked by:** T1, T2

**Outcome:** The theme works across the actual product surfaces and is ready for deployment as one
reviewed release candidate.

**Required surfaces:**

- Public Landing
- Login and registration
- Authenticated chat, composer, model menu, and unified sidebar
- Help
- Settings dialogs and destructive actions
- Code block and Artifact tabs/preview

**Required states:**

- Light and dark at 1440x900
- Light and dark at 390x844
- Keyboard focus on links, controls, menus, and dialog actions
- Hover/active states on pointer-capable desktop
- Empty, success, warning, and error/status presentations reachable in the existing harness

**Allowed fixes:**

- Replace a raw color with an existing semantic role.
- Correct a component that uses the wrong existing semantic role.
- Fix text overflow caused specifically by the new font stack.
- Deepen a shared token only if two or more required surfaces demonstrate the same missing role.

**Not allowed:**

- Page redesign, new theme settings, new fonts, code-theme work, unrelated cleanup, or importing the
  upstream high-contrast branch.

**Verification:**

```bash
cd packages/client
npx jest src/theme --runInBand
cd ../../client
npm run typecheck
npm run build
```

Use the real browser against the local development server. Save acceptance screenshots outside the
tracked source tree unless the release process explicitly needs them. Check for console errors,
missing assets, horizontal overflow, invisible focus, and unreadable state transitions.

Finish with a diff review against the theme spec, commit the implementation independently from the
Landing/Help commits, and update `plan/chenchat-theme-v1-handoff.md` with exact commands, findings,
and deployment notes. Do not push or deploy until explicitly authorized.

## Dependency Graph

```text
T1 Semantic defaults
        |
        v
T2 Global UI font role
        |
        v
T3 Browser acceptance + release candidate
```
