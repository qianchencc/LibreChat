# Auth

- Import the product logo from `~/assets/logo.svg` so Vite emits a versioned build asset. Do not
  reference `assets/logo.svg` relative to an auth route; `/login/` and proxy rewrites can resolve it
  below the route, and production may not expose the public asset at that fixed path.
- Read the visible product name from startup config and fall back to `DEFAULT_APP_TITLE`.
- Verify branding on both login and registration because they share `AuthLayout`.
