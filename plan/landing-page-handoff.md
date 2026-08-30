# Public Landing Page Handoff

## Scope

Added one public introduction and shortest-tutorial workflow at `/` inside the existing LibreChat
SPA. The authenticated, searchable guide remains at `/help`; no separate site or service was
introduced. Lenis is the only added frontend dependency and is mounted only by the Landing route.

## Behavior

- Anonymous visitors can open `/` without an auth redirect.
- Authenticated visitors at `/` redirect to `/c/new` after auth state resolves.
- The primary CTA opens `/login`; anonymous `/help` requests preserve `/help` in `redirect_to`.
- Landing and Help share workflow metadata and the four original product recordings.
- One shared activation band gives playback to exactly one story video. Re-entering a story starts
  its recording from the beginning; reduced-motion visitors receive no autoplay or smooth scroll.
- The Hero uses the user-provided static chat screenshot and never enters video playback ownership.
- Desktop story panels use reversible sticky stacking. Mobile renders the same content in normal
  document flow.
- Desktop cards have one height and media ratio. An opaque semantic-surface handoff hides the prior
  card as the next card reaches the sticky anchor, preventing text and video remnants.
- Landing wheel input uses route-scoped Lenis damping. The instance shares Framer Motion's frame
  loop and is destroyed when the route unmounts.
- Navigation, controls, media surfaces, light mode, and dark mode use existing theme primitives and
  semantic roles.

## Assets

Prepared H.264 MP4 recordings and WebP posters live in `client/public/assets/landing/`:

- `agent-marketplace`
- `web-research`
- `artifact-report`
- `temporary-api-key`
- `hero-chat.png` (static Hero screenshot)

Landing and Help both use the complete recordings at their original speed and duration.

## Verification

- Frontend TypeScript passed.
- The Landing and Help focused Jest suites passed, including observable video playback handoff.
- The production frontend build passed.
- Browser acceptance passed at 1440x900, 1280x720, and 390x844 with no horizontal overflow.
- The next workflow heading is visible in the initial viewport at all three tested sizes.
- Mobile menu, dark theme, CTA routing, protected Help routing, video controls, reverse scrolling,
  desktop sticky panels, and reduced-motion behavior were exercised in Chromium.
- Browser measurements confirmed equal `1280x520` desktop cards, equal media viewports, one active
  story video, natural `1.0` playback speed, and original durations of `25.433`, `28.300`,
  `74.300`, and `67.133` seconds.
- Local browser console errors were limited to expected API 502 responses because the standalone
  Vite preview had no LibreChat backend.

## Local Preview

The development server used for acceptance listens on `0.0.0.0:3090` and is reachable through the
router at `http://10.15.11.185:3090/`.
