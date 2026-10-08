# time-001: Host time is the reference clock; streams deliver timestamps

- Status: proposed
- Date: 2026-10-08
- Canonical source: topics/ableton-link.md ("What the engine must
  provide for Link"), topics/audio-io-platforms.md
- Open work: define the snapshot struct and the conversion functions in
  the core ticket; measure timestamp quality per backend in the spike

## Decision

The engine measures time in the platform's monotonic host clock in
microseconds, the clock Ableton Link and the plugin hosts use. Every
`aud_audio_io` stream delivers with each callback the sample position
of the block, the host time at which its first frame reaches the output
(input: was captured) and the current output and input latency; a
least-squares filter in `aud_audio_core` — our own implementation, not
Link's `HostTimeFilter` — turns the jittering callback times into a
stable sample-to-host-time mapping. The callback thread computes the
block's output time once before the render program runs. `Transport`
is a provider behind the C ABI: the callback thread captures a plain
snapshot per block (tempo, beat origin, time origin, quantum,
start/stop state), the engine converts beat, phase, host time and
sample position over the snapshot, and commits happen only on the
callback thread or the control thread. Event timetags in host time or
beat time are resolved against the snapshot. The offline renderer
drives host time from the sample clock, so tests stay deterministic.

## Why

- Link's accuracy rests on the output time of the buffer, not on the
  callback time: Link's example app adds the device latency to a
  filtered host time; without this contract the alignment drifts by the
  buffer size.
- miniaudio's callback carries no timestamps; the contract forces every
  backend to supply them, natively or through a shim.
- One snapshot per block keeps the realtime path free of locks and lets
  all workers see the same timeline.

## Consequences

- `aud_audio_io` gains timestamp and latency fields in its stream
  callback and per-backend code to fill them.
- The internal clock, Link and host transports share the conversion
  code; the sequencer and OSC timetags need no provider-specific paths.
- Link's `captureAudioSessionState` is called exactly once per block,
  on the callback thread, never from a worker.
