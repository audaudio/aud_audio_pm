# scope-001: The further suggestions become planned packages and steps

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's request at the plan review on
  2026-10-08 (R28, R32); the plan of ticket 17, phase 7
- Open work: the Faust compiler as a development-time tool (open
  question 3 of the plan); verify the license of the HRTF data sets
  that ship with Resonance Audio

## Decision

Every suggestion of R28 is planned. Six become packages of their own:

- `aud_dsp_analysis`: amplitude, FFT and pitch taps, meters, scope and
  spectrum ring buffers for the UI; pitch tracking implemented from the
  literature (YIN, McLeod pitch method), not from Soundpipe's
  Csound-derived tracker.
- `aud_audio_file`: decoders dr_libs (WAV, FLAC, MP3), WavPack,
  stb_vorbis or libvorbis (Ogg Vorbis), libopus (Opus), libFLAC for FLAC
  encoding (the library is BSD; the GPL command-line tools stay out),
  platform decoders for AAC and ALAC later; a disk-streaming player node
  with a read-ahead worker, a recorder node, offline bounce of a graph to
  a file.
- `aud_dsp_spatial`: ambisonics encoding and decoding up to third order,
  binaural decoding with the HRTF sets and renderers of Google's
  Resonance Audio (Apache-2.0, NOTICE propagated), panners from the
  literature.
- `aud_dsp_mi`: the Mutable Instruments STM32 code under MIT — a macro
  oscillator after Plaits, a modal resonator after Rings, a granular
  processor after Clouds — under neutral node names, because "Mutable
  Instruments" is a registered trademark.
- `aud_audio_ui_waveform`: a waveform view after AudioKit Waveform (MIT),
  with peaks computed off the UI thread and a multi-resolution cache.
- `aud_audio_bench`: a benchmark app that measures loopback latency, CPU
  per node type and xruns per device and publishes the numbers on the
  docs site.

The cross-cutting suggestions fold into existing steps: MIDI 2.0 and MPE
as per-note controllers in the UMP event model of the core and as note
expressions in the VST3 and CLAP shells; presets as JSON for nodes and
whole graphs — one graph document shared by the editor, the presets and
the plugin shells —, SFZ for the sampler; real-time safety tooling (a
debug watchdog for locks and allocations on the audio thread, Clang's
RealtimeSanitizer in CI, xrun and diagnostics counters as events);
remote control of a running engine through the OSC server with service
discovery, and a remote mode of the graph editor. The Faust pipeline is
planned as a development-time generator with a license gate, pending
the decision on the LGPL compiler as a tool. The migration of the
Audanika app onto the engine is the last step of the plan.

## Why

- The owner asked for the suggestions to be planned.
- Every new package has a permissive source — dr_libs, stb_vorbis,
  libvorbis, libopus, libFLAC, WavPack, Resonance Audio, the Mutable
  Instruments STM32 code, AudioKit Waveform — and none of them is LGPL
  (license-002).
