# lifecycle-003: A governor sets the voice budget from the measured load

- Status: accepted
- Date: 2026-10-14
- Canonical source: tickets/2026-10-13-29-limit-the-voices-by-the-cpu-power-of-the-device.md
  (decisions 1, 3 and 4 of the plan review, Gabriel Gatzsche's answers on
  2026-10-14; decision 3 revised by his answers after the sweeps on the
  Galaxy Tab S4 the same day: "p99 over the device buffer", then "mean
  share", then the band 75 / 72 / 85 %; Findings)
- Refines: [lifecycle-001](lifecycle-001.md) — resources have budgets and
  policies; [interop-001](interop-001.md) — no Dart on the audio thread
- Refined by: [lifecycle-004](lifecycle-004.md) — the start budgets after
  ticket 30
- Open work: the cut after an xrun takes the units of that moment, which a
  pattern of bursts can make low (the Galaxy Tab S4 fell from 51 to 13 and
  rose back in 20 s; after ticket 30 the stress test made no xrun to cut
  on); the governor lets a denser play than the stress test rise to a
  mean of 75 %, above the 50 % of release-004. Done in ticket 30: the start
  budgets (lifecycle-004); the iPad Pro (M5) measured; the Galaxy Tab S4
  plays the stress test at a mean of 0.19 to 0.46 instead of 0.60 to 0.83
  (0.67 to 0.82 in ticket 29)

## Decision

`aud_audio` has a general load governor: `AudLoadGovernor`, an engine
extension that looks at the load every 100 ms on the control thread from
the start of the engine to its stop and sets an `AudLoadBudget` — the app
binds it to the voice budget of the sampler nodes (sampler-008); `aud_audio`
and `aud_dsp_sampler` stay independent. Its `AudLoadPolicy`, which runs
without timers so that recorded samples replay through it, steers the
**mean share** of the block the renders took over the last second (the
load gauge of graph-004) and the xruns of the stream. From the periods in
which units sound it fits a line through the mean shares over the units in
use, with a memory of about five seconds: the share without units and the
share each unit adds; from them it computes the units that keep the mean at
75 % of the block, the fit. It lowers the budget at once on an xrun — by a
step and to three quarters of the units in use — and on a mean above 85 % —
by a step and to the fit, but no deeper than the units in use scaled to the
target, since on a flat load the noise of the line can put the fit far too
low; after a lowering the mean counts again once the window holds only
renders after it. It raises the budget by a unit per period only while the
mean stays below 72 %, the budget limits the units and no lowering happened
for 2 s. The p99 — per render and over the runs of renders that fill the
device buffer — goes along for the record but steers nothing; late
callbacks and renders longer than their block do not count. The floor is
8 units, the ceiling 256. It starts from the budget the app learned on the
device or from `AudDeviceClass.startUnits`: the performance cores on iOS,
the media performance class and the clock of the fastest cores on Android,
64 on a simulator or emulator, read from the system through the C library.
It has settled when the
budget has not fallen for 10 s. Players see and set nothing (decision 4).

## Why

- The cost of a voice differs tenfold between the devices of release-004
  and with the instrument; a fixed polyphony either drops out on the
  Galaxy Tab S4 or wastes a fast iPad.
- Down at once and up slowly keeps the drop-outs short and the budget near
  what the device renders.
- The mean, not the p99, tells when the stream drops out. On the Galaxy
  Tab S4 the p99 of a render stayed at 0.9 to 1.3 of the block from 4 to
  47 voices, over the runs that fill the device buffer at 0.7 to 1.05,
  since every burst of note-ons of the stress test makes a few renders
  long whatever the voices, and the buffer of two renders absorbs them;
  47 voices played without an xrun at a mean of 0.76, 69 voices dropped
  out 14 times in 20 s at 0.89. The band of decision 3 of the plan review
  (p99 between 40 and 70 %, aimed at 50 %) held the budget at the floor
  of 8 there.
- The mean of the tablet rises little between 12 and 47 voices (0.67 to
  0.76) and steeply after (0.89 at 69): aimed at 70 %, the governor held 25
  voices; aimed at 75 % and raised only below 72 %, it holds 32 and more.
- The share without voices is no constant: 8 % at rest, 37 % while the
  stress test plays (the master chain, four nodes, the note-ons). A line
  through the shares of the playing periods gives the cost of a voice;
  the share at rest made each voice look ten times as dear.
