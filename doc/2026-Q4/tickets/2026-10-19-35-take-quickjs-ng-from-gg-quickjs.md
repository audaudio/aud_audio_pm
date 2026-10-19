# 35: Take QuickJS-ng from the pub.dev package gg_quickjs

Status: planned 2026-10-19 on the user's request ("Can we integrate
quickjs-ng as a Dart dependency?", "make the package generic so that it
could be published as gg_quickjs"); the package lives in the ggsuite and
carries a Dart binding too (the user, 2026-10-19). `gg_quickjs` 0.1.0 was
built in ticket 144 of the ggsuite and published on pub.dev the same day;
since `aud_audio_script` 0.1.0 was not published yet, the user had it take
QuickJS-ng from `gg_quickjs` as part of ticket 31.

## Goal

QuickJS-ng exists once, in a generic package `gg_quickjs` of the ggsuite,
published on pub.dev under MIT: the C sources and headers of QuickJS-ng
with its notice, a helper that the build hooks of other packages call to
compile QuickJS-ng into their own native library, and a Dart binding that
runs JavaScript from Dart. `aud_audio_script` takes QuickJS-ng from it and
drops its own copy; the node `aud.script.modulator` behaves, times and
sizes as before. Keeps third-party code out of the aud_audio family's
packages (build-001) and lets other apps of the user run JavaScript. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md).

## What the code base gives

- `aud_audio_script` 0.1.0 (ticket 31, script-001) vendors the library
  subset of QuickJS-ng 0.17.0 — 4 C files, 14 headers and the MIT `LICENSE`,
  2.7 MB — in `src/third_party/quickjs-ng`. Its build hook compiles them as C
  into a static library and links it into the package's own library with
  hidden symbols; a counting allocator wraps `JS_NewRuntime2`, an internal
  engine interface keeps QuickJS-ng behind it.
- Hooks of the family read files of a dependency through
  `Isolate.resolvePackageUri`, as the node packages do with the core of
  `aud_audio_core`; a hook may import the Dart libraries of its
  dependencies.
- Link hooks with `@RecordUse` drop a package's library from an app that
  never calls it (`aud_dsp_effects`, `aud_audio_script`).
- pub.dev's QuickJS packages (compared on 2026-10-19, "The API") are Dart
  bindings: `quickjs` (Bellard 2024, `make` on the host), `fjs` (QuickJS-ng
  through rquickjs in Rust, prebuilt binaries), `quickjs_engine` (QuickJS-NG
  0.14, a Flutter plugin forked from `flutter_js`), `flutter_js`
  (JavaScriptCore on Apple platforms), `flutter_qjs`, `flutter_qjs_next`,
  `jsf`, `quickjs_runtime`, `dart_qjs`, `lemon_js`. The closest is `qjs`
  (QuickJS-ng 0.17.0 built by a `hooks` build hook with `CBuilder`, MIT),
  which may download prebuilt binaries and offers no helper to the hooks of
  other packages. None exports the C API for linking.
- The ggsuite: `gg_*` packages are MIT, created with `gg_create_package`
  and the `dna_ggsuite` layer, published on pub.dev; the gg workspace
  `~/dev/ggsuite` has tickets of its own, numbered there.

## Concept

- **`gg_quickjs`** (ggsuite, pub.dev, MIT, versions of its own; the README
  names the QuickJS-ng version it carries):
  - `src/quickjs-ng`: the library subset of QuickJS-ng, unchanged, with its
    `LICENSE`; a `NOTICE`/third-party section; a script that fetches a tag
    of QuickJS-ng and copies the subset (`tool/update-quickjs-ng.js`).
  - `package:gg_quickjs/hook.dart`, for the build hooks of other packages:
    the sources, the include directory, the defines and flags per OS and
    architecture, and one call that builds QuickJS-ng as a static library
    into the caller's hook output, for the caller to link into its own
    library with hidden symbols — so several copies in one app never clash.
    It builds the core only, without `quickjs-libc`: an embedded engine has
    no file system, no network and no process access.
  - `package:gg_quickjs/gg_quickjs.dart`, the Dart binding, its API after
    the QuickJS packages of pub.dev (`quickjs`, `fjs` and others; see
    "The API"): a runtime with a memory limit and an interrupt by time
    budget, contexts that evaluate scripts, call functions and exchange
    typed values (numbers, strings, booleans, null, lists, maps, functions,
    errors), host functions from Dart, console output to Dart, and the same
    runtime on a background isolate with asynchronous calls. Its library is
    built by `gg_quickjs`'s own hook (QuickJS-ng and a small C bridge) and
    dropped by its link hook from an app that never uses the binding
    (`@RecordUse`), so an app that embeds QuickJS-ng only through another
    package carries it once.
  - **A sandbox by default** (the user, 2026-10-19): the core of QuickJS-ng
    reaches neither files nor the network; only `quickjs-libc` (the `std`
    and `os` modules) or host functions such as `fetch` would. A runtime of
    the binding gets file system and network access only when Dart grants
    it in the runtime's options, both off by default, each narrowable — the
    file system to allowed root folders, read or read-write; the network to
    allowed hosts. Without a grant the objects are absent in JavaScript, not
    merely failing, and `import` resolves only modules that Dart registered
    as text. Tests check that a default runtime finds no `std`, `os`,
    `fetch` or file import.
  - Tests: the hook helper builds and evaluates in a test package or the
    example; the binding's Dart tests on macOS and Linux; the notices.
- **`aud_audio_script`**: depends on `gg_quickjs` from pub.dev; its hook
  builds QuickJS-ng with the helper; `src/third_party/quickjs-ng` and its
  row in `NOTICES.md` leave. The counting allocator, the engine interface,
  the node and its tests stay; the native tests, the library's size and a
  bench run prove that nothing changed. Version: a patch (family-002).
- **`aud_audio_pm`**: build-001 refined — third-party C code that several
  packages need may come from a published source package with a hook
  helper; script-001 names where QuickJS-ng comes from; `packages.jsonc`
  lists `gg_quickjs` as an external dependency.

## The API

After the QuickJS packages of pub.dev (`quickjs`, `fjs`, `quickjs_engine`
and the others above):

- `JsRuntime(options: JsRuntimeOptions(...))`, synchronous on the calling
  isolate: `evaluate(code, {sourceUrl})` returns a converted Dart value,
  `evaluateModule(code, {sourceUrl})`; `evaluateHandle` returns a `JsValue`
  handle (`JsObject`, `JsFunction`, `JsPromise`, `JsArrayBuffer`) with
  `dispose`, and `withJsValues` releases a scope of them (as `jsf`);
  `call(name, args)`, `getGlobal`/`setGlobal`; `registerFunction(name, fn)`
  — a Future returned to JavaScript becomes a Promise — returns a
  revocable registration; `registerModules` and a `moduleLoader`;
  `compile(code, {module})` to `JsBytecode` and `evaluateBytecode`; pending
  jobs run after every entry point and on `executePendingJobs()`;
  `interrupt()`, `memoryUsage`, `runGc`, `dispose()` (final: a disposed
  runtime throws a `StateError`).
- `JsRuntimeOptions(memoryLimit, maxStackSize, gcThreshold, timeout,
  onConsole, onUnhandledRejection, network, fileSystem, moduleLoader)` with
  `int` and `Duration`; `network` (`JsNetworkAccess(allowedHosts, allowUrl)`,
  checked on every redirect) and `fileSystem` (`JsFileSystemAccess(readRoots,
  writeRoots)`, paths canonical, links resolved) are null — off — by
  default; `console` and timers are opt-in as well.
- Values: numbers, strings, booleans, null and undefined, `BigInt`, lists,
  maps, `Uint8List` and typed arrays, dates, functions (`JsFunction`, Dart
  functions as host functions), promises (`Future`), errors.
- Errors are thrown as a sealed `JsException(name, message, stack, line,
  column)` with `JsSyntaxError`, `JsTypeError`, `JsReferenceError`,
  `JsRangeError`, `JsInterruptedError`, `JsOutOfMemoryError` and
  `JsStackOverflowError` (the classification of `fjs`, as exceptions).
- `JsRuntime.spawn(options)` returns a `JsIsolateRuntime` with the same
  methods as Futures: one worker isolate owns the native runtime and keeps
  its event loop for jobs and timers; requests carry ids; values cross as
  copied data (`TransferableTypedData` for bytes), handles never;
  registered functions run in the owner isolate behind a `SendPort`, so
  JavaScript gets a Promise; `interrupt()` sets a native flag that the
  interrupt handler reads, so it works while the worker is busy;
  `dispose()` cancels the work in flight, `dispose(graceful: true)` lets it
  end.
- Inside: `JS_UpdateStackTop` on every entry (as `quickjs`), the interrupt
  handler for the time budget (which `quickjs_engine` lacks), hidden
  symbols, Android's 16 KB pages, `NDEBUG` in release builds (as
  `quickjs_engine`); the library ships as a native asset, not as plugin
  glue, so no symbol is stripped on iOS.
- Not taken: results as strings only, members that do nothing or ignore
  parameters, promises polled by timers, requests matched in order, static
  registries, a runtime that recreates itself after `dispose`, manual
  `free()` of every handle, `make`, a git clone or downloads in the build,
  prebuilt binaries in the package, a web or Node polyfill layer. The
  README says that the sandbox is a capability policy, not a defense
  against hostile code, and notes Apple's App Review rule 4.7 on
  interpreters.

Approaches not taken:

- `aud_quickjs_ng` in the audaudio organization: the same package, but
  bound to the family and its git dependencies.
- An existing pub.dev binding: no C sources for other hooks, older
  QuickJS versions, a second engine in the app; `qjs`, the closest, may
  download binaries and has no helper for other hooks.
- Fetching QuickJS-ng in the hook at build time: network at every clean
  build, against build-001.

## Affected repos

- `gg_quickjs` (new, ggsuite): the package; 0.1.0 on pub.dev, in a ticket
  of the ggsuite (its number from the ggsuite's own count).
- `aud_audio_script`: QuickJS-ng from `gg_quickjs`, done in ticket 31
  before its first release (0.1.0).
- `aud_audio_pm`: this plan, the decisions.

## Steps

1. Plan review: the open questions (done 2026-10-19).
2. The ggsuite ticket 144: create `gg_quickjs`, move QuickJS-ng 0.17.0
   and the update script, the hook helper, the binding, tests, notices;
   publish 0.1.0 (done 2026-10-19, the user published it).
3. `aud_audio_script` on `gg_quickjs`, in ticket 31; native tests, size,
   bench; decisions; code review, review, publish.

## Answers of the plan review (2026-10-19)

1. The name is `gg_quickjs`; README and a constant name the QuickJS-ng
   version.
2. `gg_quickjs` counts its own semantic versions.
3. The Dart binding has typed values and a runtime on a background isolate
   from 0.1.0 on; its API follows `quickjs`, `fjs` and the other
   QuickJS-based packages of pub.dev.
4. iOS, Android, macOS, Linux and Windows; the web is left out.
5. JavaScript reaches the network and the file system only when Dart allows
   it; both are disabled by default.

6. Order: `gg_quickjs` was published first; `aud_audio_script` takes the
   published version, in ticket 31 (the user, 2026-10-19).
7. The types keep the names `Js…` of the QuickJS packages on pub.dev,
   without the `Gg` prefix of the ggsuite's code guide (the user,
   2026-10-19).

## Findings

- `gg_quickjs` 0.1.0 (ggsuite ticket 144): the hook helper
  `QuickjsNgBuild`, the binding (`JsRuntime`, `JsRuntime.spawn`, sealed
  `JsException`), the sandbox closed by default; 173 tests at full
  coverage; about 1 MB per architecture (Android arm64 1.01 MB, iOS arm64
  0.95 MB), dropped from an app that never creates a runtime.
- Upstream bugs of QuickJS-ng 0.17.0 found under ASAN: a use-after-free in
  `JS_NewContextRaw` and an overflow in the parser's `has_with_scope` when
  memory runs out. `gg_quickjs` sets the memory limit only after the
  context exists; a script that exhausts its memory and then calls `eval`
  or `new Function` can still crash the process (documented).
- `aud_audio_script` on `gg_quickjs` (in ticket 31): its hook builds
  QuickJS-ng with `QuickjsNgBuild`; `src/third_party/quickjs-ng` is gone,
  `NOTICES.md` keeps QuickJS-ng's MIT notice, since the code is compiled into
  the package's library. QuickJS-ng is now built with `-funsigned-char`, as
  upstream builds it; the memory limit is set after the context exists, as
  `gg_quickjs` does. Its library is as large as before (Android arm64
  1,258,496 against 1,258,624 bytes, iOS arm64 968,944 against 971,296), the
  native tests pass in all three sanitizer builds, and the 23 combis still
  match the Node reference within 2e-15.
- A debug build of an app carries QuickJS-ng twice — in `aud_audio_script`
  and in `gg_quickjs`'s own library —; a release build drops the second
  through `gg_quickjs`'s link hook when the app never creates a runtime.

## Open questions

None.

## Decisions this plan proposes

- build-002 (refines build-001): third-party C code that several packages
  need comes from a published source package that offers its sources and a
  build helper to their hooks; each package links its own copy with hidden
  symbols.
- script-001 is refined: QuickJS-ng comes from `gg_quickjs`; the node's
  scripts stay without file system and network.

## Model and rules

Claude Opus 5.5 at extra high effort (process-004); the standing rules of
process-005; in the ggsuite the rules of its workspace.

## Rests on

build-001, script-001, family-002, license-001, license-002, process-003,
process-004, process-005; ticket 31.
