# graph-001: Typed ports, compiled render programs, explicit feedback

- Status: proposed
- Date: 2026-10-07
- Canonical source: topics/graph-engines-and-audiokit.md (R6, R7, R9)
- Open work: fix the port and buffer formats in the core ticket

## Decision

A graph is a directed acyclic graph of nodes with typed ports: audio ports
carry a bus of N non-interleaved float channels, event ports carry
time-stamped events (MIDI 1.0 and UMP messages, OSC-typed control messages)
with sample offsets inside the block, and parameters are addressable values
with ramps. Dart edits the graph model; every edit compiles the graph on the
control thread into a render program — a topologically sorted list of jobs
with preallocated, reused buffers, summed fan-in and delay lines that align
inputs of different latency — and publishes it atomically. The audio thread
adopts the newest program at block start and the old one is freed on the
control thread. Direct cycles are rejected at compile time; feedback runs only
through an explicit feedback node pair whose delay is defined in samples (at
least the prepared maximum block, so the compiler can order the reader before
the writer) and therefore does not change with the device buffer or with
event-driven sub-ranges. Latency compensation follows two policies: scheduled
events (sequencer, automation) are pre-scheduled by the path latency the
compiler reports; live events (MIDI input, UI) are delivered as early as
possible and their path latency is reported, never hidden; where one node
feeds paths of different latency the compiler delays the shorter paths so
mixes align, and a path may be marked low-latency to opt out of that
alignment. Taps and meters publish into ring buffers read off the audio
thread.

## Block model: variable blocks, sample-accurate events (graph-002)

The engine renders exactly the frames the device callback or the plugin
host delivers, up to a maximum fixed at prepare time (the device buffer
size, or the host's maximum block inside a plugin). Each node receives
its block plus the events that fall into it; the node base class in
`aud_audio_core` splits the block into sub-ranges at the event offsets
(as AudioKitEX's `processWithEvents` and VST3 hosts do), with a
configurable minimum sub-range (default 16 frames) that bounds the
overhead when many events arrive at once. Parameter ramps advance per
sub-range. Nodes that need a constant frame count internally (FFT,
partitioned convolution) use a `FixedBlockAdapter` from the core that
re-blocks inside the node and reports its latency to the compiler.
Sub-ranges are a node-internal matter, so the parallel scheduler still
works on whole blocks.

Advantages:

- No latency is added between device and graph. A FIFO to a fixed
  quantum costs up to one quantum (64 frames = 1.3 ms at 48 kHz) and
  adds jitter on devices whose bursts are not multiples of 64, which
  Android devices with device-specific `framesPerBurst` are.
- Event timing is exact without a second splitting mechanism.
- Plugin shells receive variable blocks from the host anyway, so one
  model serves apps and plugins; the web's 128-frame quantum and
  `renderSizeHint` fit without re-blocking.
- sfizz, the AudioKit, STK and Dunne code already process arbitrary
  frame counts.
- Fewer, larger jobs for the work-stealing scheduler.

Disadvantages:

- DSP code must accept any frame count up to the maximum (most does;
  the adapter covers the rest).
- The cost of a block varies with the number of events in it.
- Golden-file tests must fix the block sequence to stay reproducible.
- A control rate is not free: a node that wants one update per 64
  frames schedules it itself through the adapter.

## Rejected alternative: a fixed 64-sample quantum (Pd, SuperCollider)

Advantages: the simplest DSP code (constant loop counts, SIMD-friendly
layouts), constant overhead per tick, a natural control rate, a feedback
delay of exactly one quantum everywhere, the same tick size on every
platform. Disadvantages: a FIFO between device and graph (latency and
jitter as above, worse inside plugin hosts that deliver odd block sizes,
and latency the plugin has to report), event timing quantized to 1.3 ms
unless sub-block splitting is added anyway, and thousands of small
ticks per second whose per-tick cost dominates with large device
buffers and many nodes — poor for the parallel scheduler. Pd and
SuperCollider accept these costs for a live-coding environment; a
plugin-grade engine does not have to.

## Why

- AudioKit v6, TAAE2, JUCE and Pd all converged on a sorted render
  sequence swapped at block boundaries; AVAudioEngine-style dynamic
  graphs proved fragile.
- Sample-accurate events as in AudioKitEX and VST3 make the sequencer
  and MIDI timing exact.
- Explicit feedback nodes keep the schedule a DAG, which the parallel
  scheduler needs.
