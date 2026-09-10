# End-to-end tests

- The public `/` route renders the landing page. Authentication flows must navigate directly to
  `/login`; do not wait for `/` to redirect there.
- Lazy route navigation leaves the outgoing chat mounted while its destination loads. Preserve
  pending user navigation during chat initialization, and avoid URL cleanup that navigates to an
  unchanged URL. `mock/help.spec.ts` holds model and Help requests to cover this race.
