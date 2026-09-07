# Auth

- Render the shared `BrandWordmark` so Vite emits versioned light/dark assets. Do not reference a
  public asset relative to an auth route; `/login/` and proxy rewrites can resolve it below the
  route, and production may not expose the public asset at that fixed path.
- Read the visible product name from startup config and fall back to `DEFAULT_APP_TITLE`.
- Verify branding on both login and registration because they share `AuthLayout`.
- Floating labels must be transparent and unpadded while centered in an empty, unfocused input.
  Restore `bg-surface-primary` and horizontal padding when focused or floated over the border.
