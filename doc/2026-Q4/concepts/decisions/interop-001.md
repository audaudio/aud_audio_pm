# interop-001: Dart never runs on the audio thread

- Status: proposed
- Date: 2026-10-07
- Canonical source: topics/dart-interop-and-web.md
- Open work: measure command-queue and event latency in the spike
  ticket

## Decision

The C++ engine owns the real-time thread and every worker thread. Dart
configures and controls it through `dart:ffi`: commands (graph edits,
parameter changes, events) go into a lock-free single-producer queue in native
memory and are applied by the engine at block boundaries; data back to Dart
(events, meters, analysis frames) travels through `Pointer`-backed ring
buffers viewed with `asTypedList`, polled per frame or signalled by a
notification thread that the audio thread wakes through a semaphore and that
invokes `NativeCallable.listener` (interop-002). No `NativeCallable` is ever
invoked from the audio thread, no Dart object is touched there, no allocation
or lock happens there. Every DSP package ships its C++ through a build hook
(`package_ffi` template, `hooks`, `native_toolchain_c`) and registers its node
types through the C ABI of `aud_audio_core`; link hooks with `@RecordUse`
strip unused nodes.

## Why

- The Dart VM's scavenger is stop-the-world; `isolateLocal` callables
  abort off the mutator thread; `listener` callables are asynchronous.
- Build hooks are stable since Dart 3.10 / Flutter 3.38 and need no
  CMake, podspec or Gradle in the packages.

## Consequences

- Signal processing happens exclusively in C or C++ (owner's decision
  at plan review, 2026-10-07). A "Dart DSP package" (R11) is a Dart
  package that bundles C or C++ node code with a Dart API: descriptor,
  parameters, presets, documentation. There is no Dart processing path,
  not even off-line.
- The stable C ABI is the contract between engine and packages, so
  packages compiled separately plug in at run time (native) or link
  time (web).
