# Topic: AudioKit and the graph engines

Research for R4, R7, R8, R15, R17, R18 and R20 to R22, sources fetched
2026-10-07. What the models do, what they are licensed under, and which
mechanisms the new engine borrows.

## The AudioKit family (Apple platforms only, all MIT)

- AudioKit core 5.7.2 (2026-03): Swift-only on `AVAudioEngine`. A
  `Node` has `connections`, an `avAudioNode`, start/stop/bypass; the
  engine attaches and connects nodes recursively; `NodeParameter`
  wraps `AUParameter` with range clamping, ramps and automation; taps
  (`AmplitudeTap`, `FFTTap`, raw buffer taps) run their handlers on a
  dispatch queue, never on the audio thread; offline rendering for tests.
- AudioKitEX 5.7.0: the C++ layer. `DSPBase` holds input and output
  buffer lists, 128 `ParameterRamper` slots (linear ramps), `process
  (FrameRange)`; `processWithEvents` walks the render event list and
  splits the block into sub-ranges at event sample times; nodes
  register by four-character code. `AtomicDataPtr<T>` publishes large
  data to the audio thread: set on the main thread, adopt once per
  render cycle, collect finished holders on the main thread.
- AudioKitEX sequencer: `Sequencer` owns `SequencerTrack`s; each track
  wraps a C++ `SequencerEngine` that runs inside the render path as a
  pre-render observer of the target unit: beat to sample conversion
  (beat / tempo * 60 * sampleRate), loop by modulo with a buffer that
  spans the loop point, a 128-bit set of running notes for note-offs,
  MIDI scheduled with sample offsets, sequences swapped through
  `AtomicDataPtr`, control events (seek, tempo, note-off) through a
  lock-free ring buffer. `ParameterAutomation` points carry target,
  start, ramp duration, taper and skew.
- SoundpipeAudioKit 5.7.4: 14 generators (oscillators incl. FM,
  morphing, phase distortion, PWM, plucked string, metal bar, drip,
  vocal tract, noise) and about 40 effects and filters (Butterworth
  set, Moog ladder, Korg 35, TB-303, formant, modal, string resonator,
  comb/Chowning/Costello/Zita/flat reverbs, convolution, compressor,
  bit crusher, clipper, tanh distortion, phaser, tremolo, auto wah,
  pitch shifter, variable delay, equalizers, vocoder, talkbox) plus
  `PitchTap`. It vendors Soundpipe (about 125 C modules). Provenance
  risk: Soundpipe is MIT on paper, but modules such as `revsc.c`,
  `moogladder.c` and `zitarev.c` are ports from Csound (LGPL-2.1) or
  Faust-generated from GPL Zita code and carry no license headers, and
  no relicensing permission was found.
- DunneAudioKit 5.6.2: `Sampler` (64 voices, SFZ import, WavPack
  decoder under BSD), `Synth`, `StereoDelay`, `Chorus`, `Flanger`,
  `TransientShaper`; `DunneCore` has ADSR and AHDSHR envelopes, function
  tables, linear rampers, multi-stage and resonant filters, sustain
  pedal logic, wave stacks and drawbar oscillators.
- STKAudioKit 5.5.4 wraps STK (MIT-style, 5.0.1): Clarinet, Flute,
  Mandolin, Rhodes piano, shakers, tubular bells.
- DevoloopAudioKit 5.5.1: `RhinoGuitarProcessor` (amp head and
  cabinet) and `DynaRageCompressor` by Mike Gazzaruso; several helper
  files (`pluginobjects.cpp`, `CombFilter`, `DelayAPF`, `OnePoleLPF`)
  carry no author or license header — origin to be verified before
  copying; `FFTReal` is WTFPL.
- Flow 1.0.4 (2024): generic node editor in SwiftUI. Model: `Patch
  {nodes, wires}`, `Node {name, position, inputs, outputs}`, `Port
  {name, type: control | signal | midi | custom}`, `Wire {output:
  (node, port), input: (node, port)}`; callbacks for moved nodes and
  added or removed wires; the app converts its own model to a `Patch`.
- PianoRoll 1.0.7 (2026-07): `PianoRollModel {notes, length, height}`,
  `PianoRollNote {id, start, length, pitch, text, color}`; drag to move,
  resize, tap to add or remove.
- Controls 1.1.4 (MIT, pushed 2024-09; macOS 12, iOS 15, visionOS 1;
  no dependencies): two generic primitives — `Control` binds one value
  in a range and maps a drag through a `ControlGeometry` (horizontal or
  vertical point, horizontal, vertical or two-dimensional relative drag
  with sensitivities, absolute angle in an angular range, angular drag),
  `TwoParameterControl` binds two values through a `PlanarGeometry`
  (rectilinear, relative rectilinear, polar, relative polar); both call
  `onStarted` and `onEnded` and sit on a `SingleTouchView` that averages
  all touches into one point (mouse on macOS). Implementations:
  `ArcKnob` (arc 45° to 315°, origin for bipolar values, value shown
  while dragging), `IndexedSlider`, `PitchWheel` and `ModWheel`,
  `Ribbon`, `SmallKnob`, `Joystick`, `XYPad`; colors through
  copy-on-write modifiers; a demo app and DocC.
- Keyboard 1.4.1 (MIT, pushed 2026-01; macOS 12, iOS 16, visionOS 1;
  depends on Tonic): `Keyboard(layout, latching, noteOn(pitch, point),
  noteOff(pitch), content)`; layouts piano (spacer ratios per letter,
  relative black-key width and height), isomorphic (pitch range, root,
  scale — only pitches of the key are shown), guitar (open pitches, fret
  count), vertical isomorphic, vertical piano. `KeyboardModel` collects
  key rectangles through preference keys, maps every touch to the
  topmost key, diffs the set of touched pitches into note-on and
  note-off, stores the normalized point inside the key, and exposes
  `externallyActivatedPitches` for incoming MIDI and latching;
  `MultitouchView` reports all touch points; `KeyboardKey` is the default
  key (colors, labels, flat top, alignment); `MIDIMonitorKeyboard`
  paints active pitches read-only on a canvas.
- Waveform (Metal), Tonic (music theory: pitch, note, chord, scale,
  key), AudioKitUI.
- Documentation: DocC per package on audiokit.io, a Cookbook app;
  versions are not lock-step (5.7.2 / 5.7.0 / 5.7.4 / 5.6.2 / 5.5.x).
- AudioKit v6 (branch, never merged, 2023): "After years of fighting
  with AVAudioEngine" the graph becomes a compiled, sorted render
  program that calls the units in sequence; parallel rendering by work
  stealing: workers woken by the audio thread process one job per node,
  atomic input counters release successors, per-worker lock-free
  deques, threads joined to an `os_workgroup`; about 4x faster than the
  AVAudioEngine graph. No Android, no Flutter story anywhere in the
  organization.

## The Amazing Audio Engine 2 (zlib-style license, retired 2016)

- `AERenderer` runs a render loop block; modules mutate an
  `AEBufferStack` of preallocated buffer lists (push, pop, mix,
  duplicate — a push after a pop reuses the memory, so chains are
  zero-copy); `AEManagedValue` hands pointers to the audio thread
  atomically and releases old values on the main thread;
  `AEMessageQueue` is a two-way lock-free queue; `AERealtimeWatchdog`
  flags unsafe calls on the realtime thread in debug builds. The sample
  app may not be reused.

## Pure Data and libpd (BSD-3-Clause)

- Audio runs in 64-sample blocks; messages fire between blocks with
  timing quantized to the block; every DSP restart topologically sorts
  the signal objects into a flat chain of perform functions and rebuilds
  it whole; fan-in is summed; direct loops are errors, feedback takes one
  block of delay through `send~`/`receive~` or `delwrite~`/`delread~`;
  parallelism only through the `pd~` sub-process with a FIFO of blocks.
- libpd 0.16.1 embeds Pd: init, audio format, `process_float(ticks)`,
  message and MIDI hooks, bindings, multi-instance builds, queued hooks
  that ring-buffer messages for another thread. Bindings for C++, Java
  and Android, Objective-C and iOS.
- Max/MSP (proprietary, concepts only): I/O vector versus signal vector
  size; "Scheduler in Audio Interrupt" aligns control to vector
  boundaries; `gen~` compiles per-sample patches; MC cords carry many
  channels in one patch cord. Exported gen~/RNBO code is dual-licensed
  (GPLv3 or Cycling '74 terms with a revenue cap) — not a source for us.

## Multithreaded graph processing (concepts only where GPL)

- Ardour (GPL-2.0-or-later): `GraphChain` with per-node activation sets
  and init refcounts; workers pop nodes from a lock-free MPMC queue,
  process, decrement the fed nodes' counters and push those reaching
  zero; the main thread works as a worker; threads default to cores
  minus one; the chain is an RCU snapshot per cycle; semaphores only at
  cycle start and end.
- JUCE (AGPL or commercial): the render sequence orders nodes so sources
  precede consumers, allocates and reuses buffers, inserts delays so
  inputs of different latency align, and is swapped in by the audio
  thread at block start through a try-lock; cycles are not rejected but
  read silence.
- SuperCollider (GPL-3.0): node tree of groups and synths defines the
  order; `ParGroup` runs order-independent children concurrently on
  supernova; `InFeedback` costs one block.
- REAPER: anticipative FX processing renders non-armed tracks ahead of
  time (about 200 ms) on worker threads — throughput for latency.
- Real-time rules shared by all: no allocation, locks, I/O, Objective-C
  or blocking on the audio thread; publish data with atomic swaps, adopt
  at block start, free on the control thread; control through lock-free
  ring buffers; Oboe and TAAE document the same rules.

## What holds for aud_audio

- Dart API modeled on AudioKit v5 (nodes with connections, ramped
  parameters, mixer add/remove, taps off the audio thread), the C++
  core modeled on AudioKit v6 plus TAAE2 (compiled render program,
  buffer reuse, atomic publish, work-stealing workers) — decisions
  graph-001 and sched-001.
- Events split blocks at sample offsets as `processWithEvents` does;
  feedback only through an explicit one-block delay node as in Pd;
  latency alignment as in JUCE.
- The sequencer runs on the render thread as in AudioKitEX — decision
  seq-001.
- Flow's and PianoRoll's models become Dart data classes — ui-001;
  Controls' two primitives and Keyboard's model and layouts become the
  packages `aud_audio_ui_controls` and `aud_audio_ui_keyboard` — ui-002.
- Soundpipe and Devoloop code only after provenance audit — dsp-001.

## Sources

- https://github.com/AudioKit/AudioKit (LICENSE, Package.swift, Sources/AudioKit/Nodes/Node.swift, NodeParameter.swift, Taps/BaseTap.swift, AudioKit.docc)
- https://github.com/AudioKit/AudioKitEX (DSPBase.h, DSPBase.mm, ParameterRamper.h, AtomicDataPtr.h, Sequencing/SequencerEngine.mm, Sequencer.swift, SequencerTrack.swift)
- https://github.com/AudioKit/SoundpipeAudioKit (README.md, Sources/Soundpipe/modules/revsc.c, moogladder.c, zitarev.c)
- https://github.com/PaulBatchelor/Soundpipe, https://csound.com/site/news/2015/07/02/soundpipe
- https://github.com/AudioKit/DunneAudioKit, https://github.com/AudioKit/STKAudioKit, https://github.com/thestk/stk
- https://github.com/AudioKit/DevoloopAudioKit (README.md, Sources/CDevoloopAudioKit)
- https://github.com/AudioKit/Flow (Sources/Flow/Model), https://github.com/AudioKit/PianoRoll (Sources/PianoRoll)
- https://github.com/AudioKit/Keyboard, https://github.com/AudioKit/Controls, https://github.com/AudioKit/Waveform, https://github.com/AudioKit/Tonic, https://github.com/AudioKit/AudioKitUI
- https://www.audiokit.io/, https://swiftpackageindex.com/AudioKit/collection.json
- https://github.com/AudioKit/AudioKit/tree/v6 (Sources/Audio/Internals/Engine/README.md, Sources/CAudio/AudioProgram.h, WorkStealingQueue.hpp, WorkerThread.h)
- https://github.com/TheAmazingAudioEngine/TAAE2 (License.txt, README.markdown, Core/AEBufferStack.h, Core/AEManagedValue.h, Utilities/AEMessageQueue.h, Utilities/AERealtimeWatchdog.h)
- https://theamazingaudioengine.com/retirement/
- https://msp.ucsd.edu/Pd_documentation/2.theory.of.operation.htm
- https://github.com/pure-data/pure-data (LICENSE.txt, src/d_ugen.c, src/m_sched.c, extra/pd~/pd~.c)
- https://github.com/libpd/libpd (LICENSE.txt, libpd_wrapper/z_libpd.h, util/z_queued.h)
- https://docs.cycling74.com/learn/articles/04_mspaudioio, https://docs.cycling74.com/legacy/max8/vignettes/gen_overview, https://docs.cycling74.com/legacy/max8/vignettes/mc_topic
- https://github.com/Ardour/ardour (COPYING, libs/ardour/graph.cc, graph.h, graphnode.cc, session_process.cc)
- https://docs.juce.com/master/classAudioProcessorGraph.html, https://github.com/juce-framework/JUCE (LICENSE.md, juce_AudioProcessorGraph.cpp)
- https://doc.sccode.org/Reference/Server-Architecture.html, https://doc.sccode.org/Classes/ParGroup.html
- https://raw.githubusercontent.com/google/oboe/main/docs/FullGuide.md
