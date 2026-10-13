# sampler-005: The state that all synths of a process share is thread-safe

- Status: accepted
- Date: 2026-10-13
- Canonical source: tickets/2026-10-13-28-build-reverb-delay-and-a-master-limiter.md
  (Findings: the crash in the measurement); `src/third_party/NOTICES.md`
  of `aud_dsp_sampler` ("The audit of the state the process shares")
- Refines: [lifecycle-002](lifecycle-002.md) — loads run on several
  workers at once; [sampler-002](sampler-002.md) — changed in place with
  "Modified by Audanika" notes
- Refined by: [sampler-006](sampler-006.md) — optimizations keep the
  output bit for bit and the shared state thread-safe; its output rule is
  superseded by [sampler-007](sampler-007.md)
- Open work: repeat the audit when sfizz code or a decoder is added

## Decision

Every piece of state that the sfizz fork keeps for the whole process and
that a load or a new synth writes is guarded or built once in a
thread-safe way, because the engine loads several sampler nodes on its
workers at the same time: the curves of the flex envelopes (a mutex
around the shared map, which is never destroyed), the silence wavetable,
the Faust table of the distortion, the CRC table of stb_vorbis and the CPU
detection of dr_flac and dr_mp3 (each built once). The audio thread takes
none of these locks; a voice reads only the immutable curve its envelope
point holds. Native tests load in parallel threads and on the engine's
workers and fail under ThreadSanitizer, or crash, without the fixes.

## Why

- The Audanika app crashed on the iOS simulator in ticket 28: its four
  sampler nodes load in parallel on every preset change, and two loads
  rehashed the unguarded curve map at once (`pointer being freed was not
  allocated`). The race came with the flex envelopes of ticket 27.
- Upstream sfizz loads one synth at a time per host, so its shared state
  never needed a lock; the engine of the family does not.
