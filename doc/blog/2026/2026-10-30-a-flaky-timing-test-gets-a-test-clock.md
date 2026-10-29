<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# A flaky timing test gets a test clock

## Motivation

- The native tests of `aud_audio_graph` failed now and then under the
  thread sanitizer, mostly on a loaded machine while `gg do publish` built
  many repos. The address and undefined behaviour sanitizer build passed.
- A red run without a bug stops a release and teaches everyone to rerun
  instead of read.

## Strategy

- Reproduce first: the test
  `graph_timing_histogram_ignores_a_single_gap_at_start_up` failed 1 run
  in 15 under the thread sanitizer with 16 busy loops on 8 cores.
- Cause: it slept real time and checked p99.9 of 1001 gaps, which is the
  second longest gap; one late wake-up above 40 ms broke the bound.
- Options put to the user: a deterministic clock instead of sleeps, wider
  bounds under the thread sanitizer only, or skipping the test there.
- Decision: the deterministic clock, so the test keeps its meaning and
  gets exact.

## Implementation

- `aud_audio_graph`: a render clock that native tests replace, compiled in
  only with `AUD_GRAPH_TEST_CLOCK`; the test advances it by hand and checks
  exact bins. The public API does not change.
- `aud_audio_with_midi` uses the same test runner and was red once. Its
  native tests hold no wall clock bound that load could break: a 20 ms
  sleep only proves that a close waits, and the stress test counts calls.

## Result

- `node scripts/test-native.js` of `aud_audio_graph` passed 20 times in a
  row, and the test passed 15 of 15 runs under load.

## Open Points

- The red run of `aud_audio_with_midi` is not explained; its log was not
  at hand. A timeout of the runner under heavy load is possible.
- Other sleeping timing tests of `aud_audio_graph` keep wide bounds and can
  move to the test clock when they turn flaky.
