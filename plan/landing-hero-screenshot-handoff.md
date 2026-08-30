# Landing Hero screenshot handoff

## Scope

- Replace the Landing Hero product screenshot with the supplied 2560x1604 尘Chat workspace image.
- Preserve product controls near the screenshot corners instead of clipping the image directly.

## Implementation

- The new asset is `/assets/landing/hero-workspace.png`; the old single-use `hero-chat.png` was
  removed.
- The screenshot uses the small control-level radius and the shared semantic shadow without a
  separate decorative frame.
- Intrinsic image dimensions reserve layout space before the asset loads.

## Acceptance

- Landing Jest suite covers the new path and intrinsic dimensions.
- Browser acceptance covers 1440x900 and 390x844 in light and dark themes.
- The screenshot loads at 2560x1604, retains its corner controls, and introduces no horizontal
  overflow.
