# lifecycle-004: The governor starts from higher budgets after ticket 30

- Status: accepted
- Date: 2026-10-15
- Canonical source: tickets/2026-10-13-30-render-the-sampler-voices-faster-on-the-big-cores.md
  (Gabriel Gatzsche's goal "raise the start budgets of AudDeviceClass to
  what the devices reach"; Measurements)
- Refines: [lifecycle-003](lifecycle-003.md) — answers its open work "the
  start budgets of the device classes after ticket 30"
- Open work: the classes above the Galaxy Tab S4 on Android (a media
  performance class, faster cores) are scaled from it, not measured

## Decision

`AudDeviceClass.startUnits`, the voices the governor of lifecycle-003
starts with on a device that has not learned its budget yet, rises with
the faster voice loop (sampler-009) and the fast cores (io-003):

| Class | Before | After |
| --- | --- | --- |
| iOS, three or more performance cores (iPad Pro M5) | 96 (128 from four) | 192 |
| iOS, two performance cores (iPhone 16 Pro Max) | 96 | 128 |
| iOS, fewer | 48 | 64 |
| Android, media performance class 34 and later | 96 | 192 |
| Android, media performance class 33 | 80 | 160 |
| Android, media performance class 31 or 32 | 64 | 128 |
| Android, fastest cores from 3.0 GHz | 64 | 128 |
| Android, from 2.6 GHz | 48 | 112 |
| Android, from 2.3 GHz (Galaxy Tab S4, 2.36 GHz) | 32 | 96 |
| Android, slower | 32 | 48 |
| Simulator or emulator | 64 | 128 |
| Other platforms | 64 | 64 |

The governor itself is unchanged: it still lowers the budget at once on
an xrun or a mean above 85 % and raises it below 72 %.

## Why

- After ticket 30 the stress test of tickets 28 and 29 asks for at most about
  90 voices, and every reference device renders them well within its block:
  the Galaxy Tab S4 at a mean of 0.19 to 0.46 from a start of 96, without an
  xrun and without a stolen voice (before, from 32: budgets of 32 to 66, up to
  1582 stolen voices per minute); its voice sweep puts 174 voices at a mean of
  75 % (46 before). The iPad Pro (M5) plays it at a mean of 0.01 to 0.04 from
  192, the iPhone 16 Pro Max at 0.07 to 0.13 from 128 (0.13 to 0.22 before).
  The iOS simulator and the Android emulator play it at a mean of 0.04 to 0.07
  from 128 without the stealing of their first chords (before 43 to 71 per
  minute from 64).
- A start below what the device renders makes the governor steal voices
  until it has risen; a start above it costs a cut at the first xrun. The
  learned budget replaces the start on the second launch.
