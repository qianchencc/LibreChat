# Landing scroll playback handoff

## Symptom

Scrolling from the final sticky workflow card into the next section could become severely choppy
on constrained devices.

## Root cause

Lenis smooth scrolling and a 30fps H.264 story video were active on the same animation path. Under
4x Chrome CPU throttling, the production build kept video playback active for all 58 moving frames;
moving-frame p95 rose to 33.3ms and four frames exceeded 32ms. Disabling decorative background blur
did not improve the result.

## Fix

- Observe Lenis `isScrolling` changes without updating React state on every frame.
- Suspend the active story video while smooth scrolling is in progress.
- Resume the same active video from its existing timestamp after Lenis settles.
- Preserve the existing behavior where a newly activated story starts from the beginning.

## Acceptance

- The focused Landing suite covers pause, timestamp preservation, resume, and story handoff.
- With the same 4x throttle and real CDP wheel input, the fixed build paused video for 61 of 62
  moving frames, reduced moving-frame p95 to 16.8ms, and produced no frames above 32ms.
- The active video resumed automatically after scroll settle.
