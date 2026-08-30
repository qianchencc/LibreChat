# Landing public scroll performance handoff

## Symptom

The public Landing page felt much slower than the same production container accessed over LAN.

## Evidence

- A 400px production wheel input reached 90% after about 520ms and settled after about 1500ms.
- The same input with native scrolling reached 90% in one frame, showing that stable rAF pacing had
  hidden Lenis input lag.
- A 256KB video Range request took about 30ms over LAN and 1.5-2.4s through the public Cloudflare
  route. The page initiated metadata requests for all four story videos before any story was active.
- Chrome Performance Trace did not show sustained main-thread or compositor frames above 16ms.

## Fix

- Raise Landing Lenis `lerp` from `0.075` to `0.2`.
- Keep every story video at `preload="none"`; activation starts only the current recording.

## Acceptance

- The same local production wheel probe reaches 90% in about 214ms and settles in about 581ms.
- At 4x CPU throttle, full-page continuous scrolling keeps a 16.7ms moving-frame p95 with no frames
  above 32ms.
- A cold Landing load makes no MP4 requests. Activating the first story requests only its video.
- The focused Landing suite covers the no-preload contract and existing playback handoff behavior.
