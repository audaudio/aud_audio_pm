# release-003: Sampler, reverb and delay, AUv3, then the backing player

- Status: accepted
- Date: 2026-10-08 (AUv3 inserted as M3 the same day)
- Canonical source: Gabriel Gatzsche's priorities at the plan review on
  2026-10-08
- Open work: none

## Decision

Audanika's needs set the delivery order, and all three milestones target iOS
and Android only (release-001): M1, the sampler — `aud_dsp_sampler` plays the
app's instruments through the new engine (release-002); M2, reverb and delay —
the first effects ticket S10a and the app migration S29b; M3, AUv3 on iOS —
`aud_audio_auv3` over the headless host (plugin-002), so the instruments run
inside AUv3 hosts; M4, the backing player with time stretching —
`aud_audio_file`, `aud_dsp_stretch` and `aud_audio_backing` (backing-001).
Desktop and web IO, the parallel scheduler, OSC, the full MIDI integration,
the remaining DSP packages, sequencer and Link, the UI packages, the remaining
plugin shells, the docs site and the extensions follow M4. Step numbers stay
stable; the plan's phases are regrouped by milestone.

## Why

- The owner's priorities of 2026-10-08.
- Nothing in M1 to M4 depends on a step that follows them, so the order
  needs no rework: the sampler needs core, graph, IO and umbrella; the
  effects need the umbrella; the AUv3 shell needs the headless host of
  the graph and the sampler; the backing player needs the file package,
  the stretch node and the transport that the graph already has.
