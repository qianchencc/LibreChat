# 尘Chat Email Templates Handoff

## Scope

Replaced the four existing transactional email templates without changing registration, email
verification, password-reset, or invitation protocols:

- Email verification
- Password reset request
- Password reset completion notice
- User invitation

## Design

The templates adapt the mature 尘Proxy email system's warm editorial direction to the approved
尘Chat palette. They use a shared paper background and authentication scene, table layout,
inline CSS, and a fixed light color scheme for predictable email-client rendering.

The high-resolution `1088 x 336` wordmark already used by Landing is copied byte-for-byte to the
email asset directory and displayed at `136 x 42`. Email assets live under
`client/public/assets/email/` and are expected at `${DOMAIN_CLIENT}/assets/email/` in production.
`EMAIL_ASSET_BASE_URL` can override that public base when static assets use another origin.

## Behavior

- `sendEmail` injects one normalized `emailAssetBaseUrl` into every template.
- A trailing slash in `EMAIL_ASSET_BASE_URL` or `DOMAIN_CLIENT` cannot create doubled URL slashes.
- Invitation mail falls back to the recipient email when no display name is supplied.
- User-visible subjects now use the 尘Chat name and Chinese transactional wording.
- Existing Handlebars link variables and 15-minute authentication token lifetime remain unchanged.

## Verification

- New final-HTML contract tests passed for all four templates and asset-base fallback.
- Existing SMTP assembly tests passed.
- The full `AuthService.spec.js` suite passed: 60 tests.
- Browser previews passed for all four templates with loaded images and no horizontal overflow.
- Email verification was checked at `1440 x 1000` and `390 x 844`; the other templates were
  checked at `900 x 900`.

Screenshots were kept outside the repository under `/tmp/chenchat-email-*.png`.

## Deployment

The frontend build must publish `client/public/assets/email/`. If that path is not served from
`DOMAIN_CLIENT`, set `EMAIL_ASSET_BASE_URL` to an HTTPS URL that exposes the same three files.
