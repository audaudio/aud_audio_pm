# release-004: The reference devices are a Galaxy Tab S4, an iPad Pro (M5) and an iPhone 16 Pro Max

- Status: accepted
- Date: 2026-10-13
- Canonical source: Gabriel Gatzsche's answer on 2026-10-13 ("The android
  device. The iPad and my iPhone"), at the planning of tickets 29 and 30
- Refines: [release-002](release-002.md) — answers its open work on the
  reference devices (open question 6 of the plan of ticket 17); the Pixel
  that io-002, sampler-001, midi-002 and midi-003 name as the Android
  reference is replaced by the Galaxy Tab S4
- Open work: confirm the iPhone model at the first measurement on it

## Decision

The budgets of the plan of ticket 17 — the callback at most 50 % of the
block budget, zero xruns over ten minutes, the load and recovery times —
are measured and must hold on three devices, which the tickets have
already used:

- Samsung Galaxy Tab S4 (SM-T830, Snapdragon 835, Android 10), the lower
  bound on Android and of the family;
- iPad Pro (M5);
- iPhone 16 Pro Max, the user's iPhone.

The iOS simulator and the Android emulator stay the devices of every
ticket's measurements; a release is measured on the reference devices.
Claude asks the user to unlock them before long unattended runs
(process-005).

## Why

- The Galaxy Tab S4 is the slowest device at hand and showed the late
  callbacks of ticket 25 and the overloads of ticket 28; what holds there
  holds on newer Android devices.
- The iPad and the iPhone are the user's devices for playing and were
  measured in tickets 21, 24, 26 and 27; no Pixel is at hand.
