<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# All graph timing tests run on the test clock

## Motivation

- The previous ticket gave `aud_audio_graph` a render clock that native
  tests replace, and moved the one flaky timing test onto it.
- Three more tests of the period histogram still slept real time and held
  wide bounds. They had not failed yet, but they carried the same risk
  under the thread sanitizer on a loaded machine, for example while
  `gg do publish` builds many repos.

## Strategy

- Follow the decision of the previous ticket: a deterministic clock, not
  wider bounds and not skipping tests under the thread sanitizer.
- Move every test that checks periods, the histogram or render times to
  the clock and check exact bins.
- Keep real time where real concurrency is the point of the test.

## Implementation

- `aud_audio_graph`: `graph_timing_reports_the_last_block`,
  `graph_timing_histogram_drops_the_gap_that_reset_the_filter` and
  `graph_timing_histogram_takes_the_gap_of_split_callbacks` advance the
  `ManualClock` and check exact bins. The sleeping helper `renderPaced`
  is gone.
- The first 20 runs under load were green 19 times. The red run was the
  stress test of the event sources: a note hung although every event
  arrived. Asked the user whether to split it off or investigate here;
  the user chose to investigate here.
- Cause: when late packets of a sounding pitch land at one offset as
  `off on off`, the engine ranked both note offs first and played
  `off off on`. Now only the first note off of a sounding pitch per block
  ranks first. A unit test in `aud_audio_graph` reproduces the sequence
  and fails without the fix.

## Result

- With the fix, `node scripts/test-native.js` of `aud_audio_graph`
  passed 20 times in a row while 16 busy loops loaded the machine;
  `dart test` passed.

## Open Points

- The load gauge tests still read the real clock; they only check lower
  bounds and counts, which load cannot break.
