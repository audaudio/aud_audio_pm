# Topic: Dart native interop and the web

Research for R11, R13 and R25, sources fetched 2026-10-07. How Dart
reaches C++ on the native platforms, why Dart must stay off the audio
thread, and what the web allows instead of FFI.

## Versions

- Flutter stable 3.47.6 (2026-10-01) with Dart 3.13.5 (2026-09-29).
  Flutter releases: 3.38 (2025-11, Dart 3.10), 3.41 (2026-02), 3.44
  (2026-05, Dart 3.12), 3.47 (2026-08).

## Native platforms: build hooks and FFI

- Build hooks (formerly native assets) are stable since Dart 3.10 /
  Flutter 3.38; Dart 3.13 adds link hooks and `@RecordUse` so unused
  native code can be tree-shaken. Packages: `hooks` 2.2.0, `code_assets`
  2.1.0 (Android, iOS, Linux, macOS, Windows — no web),
  `native_toolchain_c` 0.19.5 (still labelled experimental). Hooks run
  in dependency order; cyclic dependencies are unsupported.
- `flutter create --template=package_ffi` is the recommended template
  since Flutter 3.38: `hook/build.dart` with `native_toolchain_c`,
  `@Native() external` bindings, no CMake, podspec or Gradle files. The
  old `plugin_ffi` template was deprecated in 2026-01.
- Binding generators: ffigen 23.0.0 (C, Objective-C, Swift; Dart
  generator API replaces YAML), objective_c 9.6.2, jnigen 1.0.1
  (Android, Linux and Windows desktop; macOS not yet).
- Callbacks into Dart: `NativeCallable.isolateLocal` may only be called
  on the isolate's own mutator thread and aborts the process otherwise;
  `NativeCallable.listener` can be called from any thread but delivers
  asynchronously over a `SendPort`, returns void, and must be closed.
  Neither can serve a synchronous audio callback.
- Shared memory: `Pointer<Float>.asTypedList(n)` views native memory
  without copying — the basis for lock-free ring buffers between the
  Dart isolate and the C++ audio thread.
- The Dart VM garbage collector is a stop-the-world semispace scavenger
  for new space with safepoints that halt all mutators; shared-memory
  multithreading for Dart exists only as a language proposal. Any Dart
  code on the audio thread would inherit these pauses.

## Web: no FFI, no isolates

- `dart:ffi` does not exist on the web and build hooks do not run for
  web targets; the web uses `dart:js_interop` and `package:web` 1.1.1
  (`AudioContext`, `AudioWorklet.addModule`, `AudioWorkletNode`,
  `Worker`, `MessagePort`; `SharedArrayBuffer` is an ECMAScript builtin
  declared with `@JS` by hand).
- Dart web has no isolates; web workers need a separately compiled entry
  point and copy data.
- Wasm compilation is stable since Flutter 3.22 but still opt-in
  (`flutter build web --wasm`); Flutter plans to make it the default.
  Only the new JS interop works under Wasm. Multithreaded rendering
  needs the same cross-origin isolation headers as `SharedArrayBuffer`.
- Typed-array conversions between Dart and JS may return a reference, a
  proxy or a copy depending on the compiler; `ByteBuffer.toJS` throws
  for a `SharedArrayBuffer`-backed buffer. Views into shared memory are
  therefore created on the JS side and read through interop.
- Emscripten emits an async module factory with `-sMODULARIZE`
  (`-sEXPORT_ES6` for an ES module); flutter_soloud loads it with script
  tags from `index.html` and runs the engine in a worker plus worklet
  when the page is cross-origin isolated, else in a single-threaded
  fallback build.

## What holds for aud_audio

- Native: every DSP package ships its C++ through a build hook; the
  umbrella links the code assets; Dart never runs on the audio thread.
- Web: one Emscripten module per `AudioContext` holds the engine and
  every DSP node (static linking at build time), lives in the
  AudioWorklet, and talks to Dart on the main thread over `MessagePort`
  commands and `SharedArrayBuffer` ring buffers, with a fallback when
  the page is not cross-origin isolated.
- The Dart API is identical on both sides; only the transport below it
  differs (FFI vs. JS interop) — a conditional import in the umbrella.

## Sources

- https://storage.googleapis.com/flutter_infra_release/releases/releases_macos.json
- https://dart.dev/blog/announcing-dart-3-10
- https://dart.dev/blog/announcing-dart-3-13
- https://dart.dev/tools/hooks
- https://docs.flutter.dev/platform-integration/bind-native-code
- https://docs.flutter.dev/packages-and-plugins/developing-packages
- https://github.com/flutter/flutter/pull/181588
- https://pub.dev/packages/hooks, https://pub.dev/packages/code_assets, https://pub.dev/packages/native_toolchain_c
- https://pub.dev/packages/ffigen, https://pub.dev/packages/objective_c, https://pub.dev/packages/jnigen
- https://api.dart.dev/dart-ffi/NativeCallable/NativeCallable.isolateLocal.html
- https://api.dart.dev/dart-ffi/NativeCallable/NativeCallable.listener.html
- https://api.dart.dev/dart-ffi/FloatPointer/asTypedList.html
- https://github.com/dart-lang/sdk/blob/main/runtime/docs/gc.md
- https://github.com/dart-lang/language/blob/main/working/333%20-%20shared%20memory%20multithreading/proposal.md
- https://docs.flutter.dev/platform-integration/web/wasm
- https://dart.dev/web/wasm, https://dart.dev/language/concurrency, https://dart.dev/libraries
- https://dart.dev/interop/js-interop/js-types
- https://pub.dev/packages/web
- https://emscripten.org/docs/compiling/Modularized-Output.html
- https://docs.page/alnitak/flutter_soloud_docs/get_started/web_notes
