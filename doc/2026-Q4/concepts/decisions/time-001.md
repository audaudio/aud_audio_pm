# time-001: Host time is the reference clock; streams deliver timestamps

- Status: proposed
- Date: 2026-10-08
- Canonical source: topics/ableton-link.md ("What the engine must
  provide for Link"), topics/audio-io-platforms.md
- Open work: measure timestamp quality per backend on the reference
  devices. The segment struct, the capability flags, the conversions and
  the filter are defined (ticket 18: `aud_abi.h`, `aud_transport.h`,
  `aud_time_filter.h`)

## Decision

The engine measures time in the platform's monotonic host clock in
microseconds, the clock Ableton Link and the plugin hosts use. Every
`aud_audio_io` stream delivers with each callback the sample position of the
block, the host time at which its first frame reaches the output (input: was
captured) and the current output and input latency; a least-squares filter
in `aud_audio_core` — our own implementation, not Link's `HostTimeFilter` —
turns the jittering callback times into a stable sample-to-host-time
mapping. The callback thread computes the block's output time once before
the render program runs. `Transport` is a provider behind the C ABI: the
callback thread captures a plain snapshot per block (tempo, beat origin,
time origin, quantum, start/stop state), the engine converts beat, phase,
host time and sample position over the snapshot, and commits happen only on
the callback thread or the control thread. Event timetags in host time or
beat time are resolved against the snapshot. The offline renderer drives
host time from the sample clock, so tests stay deterministic.

Three time domains stay distinct: sample time (the stream's sample
position, always available and authoritative for scheduling), musical
time (beats through the transport) and host time (the monotonic clock,
present only with a validity flag and an accuracy estimate). Every
timestamp a backend delivers carries its source — hardware, estimated,
or synthesized by the engine — because Oboe and the web report
best-effort estimates and plugin hosts provide host time only
optionally (VST3 `systemTime`, CLAP `steady_time`). Inside a plugin the
sample clock leads and host time is synthesized when the host gives
none. The sample-to-host-time filter resets on device and route
changes, interruptions, sample-rate changes, stream restarts and
discontinuities of the sample position. The offline renderer runs a
virtual timeline derived from sample time.

The per-block snapshot is a list of transport segments, each with a
sample offset, musical position, tempo and tempo increment per sample,
time signature and flags for playing, looping, seek and discontinuity —
so hosts that change tempo or transport inside a block (CLAP) and
providers that change once per block (Link, VST3) both fit. Providers
declare capabilities: tempo changes, seeks, start/stop, time
signatures, host time. For Link, all commits run on one thread — the
audio thread owns the session state, app-side requests travel as
commands into it and are committed there — because Ableton advises
against modifying the session state from both threads; and the beat
slope of a segment comes from Link's `beatAtTime` at the segment's
start and end, not from the displayed tempo, so Link's drift
compensation is kept.

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
