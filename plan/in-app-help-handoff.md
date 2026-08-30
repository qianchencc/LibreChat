# In-App Help Handoff

## Scope

Added one authenticated `/help` workflow inside the existing LibreChat SPA. No separate docs
service, domain, build system, or backend API was introduced.

## Behavior

- The unified sidebar always exposes Help and marks it active on `/help`.
- Account menu Help and FAQ navigates internally to `/help`.
- The page provides searchable guide topics, responsive topic selection, and procedural steps.
- Each step reserves a 16:9 image/video surface. Video entries require captions.
- Mobile includes the existing sidebar opener; desktop keeps only the icon rail on this route.

## Content

Initial topics cover conversations, attachments, tools and Skills, and Artifacts. Replace the
placeholder media by adding `media` entries in `client/src/components/Help/content.ts`.

## Verification

- 13 focused Jest tests passed.
- Frontend TypeScript, targeted ESLint, Prettier, and the full workspace frontend build passed.
- Authenticated browser acceptance passed with an isolated in-memory MongoDB environment.
- Desktop, 390x844 mobile, and dark-mode screenshots were visually inspected.
- The standard mock E2E global setup intermittently missed the visible Sign up link locally; an
  equivalent isolated registration/login flow passed. The committed help E2E remains on the
  standard mock harness for CI.
