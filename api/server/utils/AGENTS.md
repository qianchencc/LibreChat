# Email Utility Notes

- Transactional email templates live in `emails/*.handlebars` and are compiled by `sendEmail.js`.
- Preserve the existing authentication payload contract: `verificationLink`, `link`, and
  `inviteLink` are server-generated URLs, not verification codes.
- Shared artwork is served from `EMAIL_ASSET_BASE_URL`; when omitted, it resolves to
  `${DOMAIN_CLIENT}/assets/email`.
- Keep production email HTML table-based with inline styles, no JavaScript, external CSS, or
  webfont dependency. The current design intentionally requests a light color scheme.
- The email wordmark must remain an exact copy of the high-resolution Landing wordmark and display
  at `136 x 42`; do not reconstruct it from text.
- Run `npx jest server/utils/__tests__/emailTemplates.spec.js
server/utils/__tests__/sendEmail.spec.js --runInBand` from `api` after changing templates or the
  sender.
