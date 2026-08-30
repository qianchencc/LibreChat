# Landing

- Keep `/` usable as the public product page for both anonymous and authenticated visitors.
- Render the startup-config `appTitle` as the brand and fall back to `DEFAULT_APP_TITLE`.
- Keep the Gateway link in both desktop and mobile navigation. It opens
  `https://proxy.qianc.ltd` in a new tab.
- Reuse story metadata from `~/components/Help/content` so Landing and Help do not drift.
- Use semantic theme roles and shared `@librechat/client` controls. Pass `returnThemeOnly` when
  placing `ThemeSelector` in the Landing navigation because its default layout is absolute.
- Product recordings must include a poster and a user-visible play/pause control. Reduced-motion
  visitors must not receive autoplay.
- Keep the Hero product image static. It must not add another autoplay owner above the story stack.
- Keep exactly one Landing story active. The shared activation observer owns playback handoff;
  individual story videos must not add their own visibility observers.
- Landing and Help share the original, full-length recordings from `~/components/Help/content`.
  Do not trim or accelerate separate Landing clips.
- Lenis is scoped to the Landing route and shares Framer Motion's frame loop. Destroy it on unmount
  and do not enable it for visitors who request reduced motion.
- Sticky story panels are desktop-only. Preserve normal document flow below the `md` breakpoint.
- Workflow artwork is decorative and must stay below the opaque video/text layers. Keep the
  receded-card pseudo-element above all card content so playback handoff still fully hides earlier
  cards.
- Use only the control-level radius on the Hero product screenshot. The large surface radius clips
  product controls near its corners, and a separate decorative frame adds unnecessary bulk.
