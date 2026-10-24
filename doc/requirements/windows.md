# Requirements: the Audanika app on Windows

Area `windows`. Source: the user's choice for ticket 38 on 2026-10-24, the
Windows audio device inside the ticket that makes all repos run on Windows.
The plan:
[ticket 38](../2026-Q4/tickets/2026-10-22-38-make-all-repos-run-on-windows.md).

## req-windows-001: The app plays its sounds through the default output

- Status: done (ticket 38, 2026-10-24)
- Priority: must
- Statement: The Audanika app plays its sounds on Windows through the
  default output device and follows it when it changes
- Why: [flutter-audio-kit](../2026-Q4/goals/flutter-audio-kit.md) (R5,
  Windows; R14, `aud_audio_io`), the choice of 2026-10-24
- Acceptance:
  - every preset sounds on the development PC at the device's rate with
    the smallest period the device grants in shared mode (480 frames there)
    — changed on 2026-10-24 from "a buffer of 256 frames", which the
    drivers of the development PC do not grant in shared mode; shorter
    periods come with exclusive mode (S3d)
  - changing the default output in the Windows settings, or unplugging
    the device in use, moves the sound to the new default within 1 s
  - 100 notes play without an xrun
