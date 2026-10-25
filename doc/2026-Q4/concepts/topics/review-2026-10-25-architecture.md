# Topic: review of the architecture of audaudio and audmidi (2026-10-25)

Ticket 40. Gabriel Gatzsche asked on 2026-10-25 for a comprehensive review
of the architecture of the audaudio and the audmidi framework ("Bitte
schaue in .ocean und erstelle einen umfassenden Review über die
Architektur für das audaudio und das audmidi Framework") and for an
implementation ticket plan built on its results. This file holds the
review; the plan is in
[ticket 40](../../tickets/2026-10-25-40-review-the-architecture-of-audaudio-and-audmidi.md).

Scope: the 32 repos of the organization `audaudio` and the 11 repos of
`audmidi` as checked out in `.ocean` on 2026-10-25 (every repo on `main`,
clean, last commit 2026-10-24), the live site audaudio.github.io, pub.dev
and the two GitHub organizations. Method: a metrics pass over every repo
(lines of own Dart, generated Dart, own and vendored native code, tests,
dependencies), five read-only reviews by area — engine core, integration
packages and plugin shells, DSP and UI packages, the audmidi family, the
documentation — run as agents of Claude Code, and spot checks of their key
claims in the sources. A statement with a file reference was read in that
file; a judgement is marked as opinion. The boilerplate the `dna` layers
generate (`dna/`, `doc/guides`, the layer scripts, `check.yaml`,
`analysis_options.yaml`, the quick-check workflow) was not reviewed.

Both families are reviewed in this one file of `aud_audio_pm` on the
user's request. The audmidi findings would normally live in `aud_midi_pm`;
the tickets that act on them record their decisions there, as ticket 26
did.

## Summary

1. **What exists is solid; what is announced is not there.** Ten of the 31
   audaudio packages hold real code: core, graph, io, the umbrella, midi,
   script, vst3, sampler, effects and ui_controls. Eighteen are untouched
   templates, tagged and referenced as 0.0.3, with a `sum()` API and
   READMEs that promise sequencers, decoders and Ableton Link. The AUv3
   shell is the spike of ticket 24, the bench app the Flutter template. All
   ten audmidi packages are implemented, but two of them — Windows and
   Linux — have never run on their platform.
2. **The biggest gap is CI, not code.** Every one of the 43 repos runs one
   identical ubuntu job, `npx @tssuite/ggwsm one did commit`. No macOS,
   Windows, Android, iOS or browser job exists. The platform code, the
   sanitizer runs (ASan, UBSan, TSan, RTSan), the VST3 validator and the
   `@TestOn` tests of the MIDI backends run only on developer machines.
   The architecture promises "RealtimeSanitizer in CI" and a CI matrix
   (S22).
3. **Documentation.** The READMEs of the implemented packages name their
   exported API and every public symbol carries dartdoc, but the READMEs of
   core, graph, vst3 and auv3 read as ticket logs, install snippets are
   stale, and 21 changelog sections in 13 repos are empty. The site
   documents three of the ten implemented packages. The promises of
   docs-001 — tested Dart snippets, package pages synced from the repos,
   an API reference under `/api/` — are not implemented. audmidi has no
   site, while the organization profile links to one.
4. **The node-package pattern is not yet a pattern.** Each DSP package
   copies the registration prologue, the descriptor assembly and the Dart
   FFI boilerplate; the parameter table of a node exists three to four
   times; sampler and effects use two node-implementation styles; the
   generator that architecture.md promises ("a descriptor generates the
   Dart node class") does not exist. Seven more DSP packages are planned
   on this basis.
5. **Code one package away from where the architecture puts it:** DSP
   nodes in the graph, the OSC router in the core next to an empty OSC
   package, device heuristics and the load governor in the umbrella, a
   format-neutral editor protocol and control-thread engine inside the VST3
   shell (copied once more into the AUv3 spike).
6. **Packages to introduce:** a plugin shell core, the UI binding package
   of ui-003, the voice allocator of ticket 34, a node kit and a generator
   inside the core, a `testing.dart` library per package instead of a test
   package, a docs site for audmidi. **Packages to merge: none** — the cut
   is right; the stubs have to say what they are.
7. **Interfaces.** Process-global state behind instance members of
   `AudGraph`; parameters addressed by index in the public Dart layer and
   in JSON; `Object` parameters that mean "index or id"; test-only members
   on production interfaces; four unrelated exception types and no log
   sink; raw native addresses in `AudMidiAdapter` and `MidiNativeTap`; an
   editor protocol with macOS key codes and AppKit coordinates;
   `StateError` as the lifecycle error of aud_midi; one real bug in the
   capability merge of `MidiCompositeBackend`.
8. **Publication.** audmidi is on pub.dev with 160 of 160 points but
   tagged "web" only, for lack of a `platforms:` entry in the umbrella.
   audaudio is wired by git references over SSH URLs — against the https
   rule of repos-001 — with exact pins in the umbrella against family-002
   and with empty releases that family-002 forbids.
9. **Licenses.** Notices are complete where code was vendored, but the
   check script is missing in io, vst3 and sampler, the `LICENSE` files say
   "All Rights Reserved" under the MIT heading, the Link package claims a
   license flow it does not have, and the ALSA bindings of aud_midi_linux
   carry LGPL declarations without a notice.
10. **The plan:** 23 tickets in seven phases — hygiene and CI first, then
    the node pattern, the engine interfaces, the shells, the docs and the
    bench, and the audmidi platform runs — in
    [ticket 40](../../tickets/2026-10-25-40-review-the-architecture-of-audaudio-and-audmidi.md).

## 1. State of the families

Own code counts lines of Dart under `lib` without generated bindings and
of C, C++, Objective-C, Java and Kotlin under `src` without
`src/third_party`; tests count Dart under `test` plus native tests where
they exist.

### audaudio

| Repo | State | Own Dart | Native | Vendored | Tests | README |
| --- | --- | --- | --- | --- | --- | --- |
| aud_audio_core 0.5.4 | implemented: ABI 0.4, contracts, OSC model, gain node | 5.3k (+2.3k generated) | 2.5k | – | 3.3k Dart, no native tests | 105 lines, ticket log |
| aud_audio_graph 0.5.5 | implemented: compiler, programs, scheduler, host, offline renderer | 6.2k (+2.3k) | 11.9k | – | 5.4k Dart, 6.2k native, sanitizers | 334 lines, by ticket |
| aud_audio_io 0.4.0 | Android, iOS, macOS, Windows; Linux is the null device | 2.9k (+2.6k) | 6.7k | 115k (miniaudio, Oboe) | 2.4k Dart, native, 2 integration | good, install stale |
| aud_audio 0.4.5 | implemented, output only; governor, device class | 2.3k | – | – | 2.4k Dart, 6 integration | good, install stale |
| aud_audio_midi 0.1.6 | implemented | 1.4k (+0.3k) | 1.1k | – | 1.6k Dart, 2.0k native, sanitizers | good, no example |
| aud_audio_script 0.2.0 | implemented, iOS/Android/macOS/Windows | 1.4k (+0.7k) | 4.0k | QuickJS-ng via gg_quickjs | 1.2k Dart, 2.3k native | good |
| aud_audio_vst3 0.3.0 | implemented, macOS and Windows | 1.1k | 7.4k | 53.6k (VST3 SDK 3.8.1) | 0.8k Dart, 2.3k native, test host | good, ticket-centric |
| aud_audio_auv3 0.1.1 | spike of ticket 24 | 0.1k | 0.5k (+0.6k ObjC++ in example) | – | 0.1k Dart | spike notes |
| aud_dsp_sampler 0.4.0 | implemented, `aud.sampler.sfz` | 0.7k (+0.2k) | 2.3k | 202k (sfizz fork, abseil, simde, …) | 1.4k Dart, 8.5k native, goldens | 577 lines, no parameter table |
| aud_dsp_effects 0.2.4 | implemented, six nodes | 0.8k (+0.2k) | 2.3k | 1.1k (Freeverb, Dunne) | 1.5k Dart, 0.9k native, goldens | good, parameter table |
| aud_audio_ui_controls 0.1.1 | partial: 1 of 8 widgets (ArcKnob) plus bindings | 0.9k | – | – | 0.8k, 2 goldens | good, honest |
| 11 ffi stubs 0.0.3: sequencer, link, file, clap, dsp_analysis, dsp_stk, dsp_guitar_amp, dsp_synth, dsp_spatial, dsp_mi, dsp_stretch | untouched `package_ffi` template: `sum`, `sumAsync`, a 5 s test, ~130 template files each | 0.14k | 62 | – | template | 5 lines |
| 7 Dart and Flutter stubs: osc, web 0.0.10, backing, ui_graph_edit, ui_keyboard, ui_piano_roll, ui_waveform | untouched template: version file or `Calculator` | ≤22 | – | – | template | 5 lines |
| aud_audio_bench 0.0.3 | untouched Flutter app template | 33 | – | – | 2 widget tests | 5 lines |
| audaudio.github.io 0.4.1 | 6 pages live and in sync with the source | – | – | – | vitest over string literals | 506-line mirror of the site |
| aud_audio_pm 0.13.3 | 25 ticket plans, 73 decisions, architecture, 15 topics | – | – | – | – | current |

### audmidi

| Repo | State | Own Dart | Native | Tests | README |
| --- | --- | --- | --- | --- | --- |
| aud_midi 0.1.4 | implemented; verified on macOS, the iOS simulator, the Android emulator and Chrome | 3.7k | – | 4.9k | good; install snippet is a git URL |
| aud_midi_standard 0.1.1 | implemented, zero dependencies | 12.3k | – | 14.7k, VM, dart2js, Wasm | good; git-URL install |
| aud_midi_core 0.1.3 | implemented | 5.2k | – | 6.8k, fake backend only | thin, 37 lines |
| aud_midi_rtp 0.1.1 | implemented, no Apple captures | 8.9k | – | 8.7k, property tests | thin |
| aud_midi_network 0.1.2 | implemented, localhost only; interop test never run | 6.1k | – | 6.5k | good |
| aud_midi_apple 0.1.2 | implemented; macOS loopback, iOS simulator, one GO:KEYS session | 3.1k (+7.3k ffigen) | 2.3k C, ObjC | 4.1k, 8 files on real CoreMIDI, sanitizers | 278-line verification log |
| aud_midi_android 0.2.1 | implemented; emulator only | 3.4k (+27.5k jnigen) | 0.5k C, 1.1k Java | 3.4k Dart, no Java tests | 264-line verification log |
| aud_midi_windows 0.1.3 | written, never compiled against the Windows SDK | 4.5k (+0.3k) | 3.1k C++/WinRT | 5.4k VM; `@TestOn('windows')` never run | honest |
| aud_midi_linux 0.1.2 | written, never run on Linux | 4.1k (+4.2k ffigen) | – (dlopen) | 5.4k VM; `@TestOn('linux')` never run | good |
| aud_midi_web 0.1.2 | implemented, Chrome | 1.2k | – | 1.9k plus headless Chrome | good |
| aud_midi_pm 0.1.1 | 2 tickets, 11 decisions, architecture, references | – | – | – | OK; no documentation plan |

## 2. Where documentation and READMEs are missing

### READMEs

- The READMEs of the implemented audaudio packages name their exported
  API, and a heuristic scan found no undocumented public declaration in
  any of them. But `aud_audio_core`, `aud_audio_graph`, `aud_audio_vst3`
  and `aud_audio_auv3` are written as ticket logs — "What the package holds
  (ABI 0.4, tickets 18, 19, 25 and 37)" — ordered by ticket and decision
  ids, without an installation or a platform section. History, not
  documentation (opinion).
- Install snippets are stale: `aud_audio_io/README.md:34-40` and
  `aud_audio/README.md:31-38` show `^0.2.0` for packages at 0.4.0 and
  0.4.5. The READMEs of `aud_midi` (line 49) and `aud_midi_standard` (line
  41) show a git dependency although both families' consumers resolve them
  from pub.dev; the other eight audmidi READMEs say `dart pub add`, none
  names pub.dev.
- The 18 stub READMEs of audaudio promise what does not exist:
  `aud_audio_sequencer` "tracks, clips, loops and transport",
  `aud_audio_file` "decoders, disk-streaming player, recorder, offline
  bounce", `aud_audio_link` "fetches Link and LinkKit at build time". None
  says "planned, no code yet".
- `aud_dsp_sampler/README.md` (577 lines) has no parameter table; the
  effects README has one (`aud_dsp_effects/README.md:182-189`).
  `aud_dsp_effects/README.md:5` still says "on iOS and Android" although
  0.2.4 runs its native tests on Windows.
- `aud_audio_vst3/README.md` has no installation section and does not say
  how an app wires `scripts/build-plugin.js` into its build;
  `example/aud_audio_vst3_example.dart:10` refers to the `editor/` folder
  that 0.2.0 removed.
- The audmidi READMEs of apple (278 lines), android (264) and windows
  (229) double as verification logs; `aud_midi_core` (37 lines),
  `aud_midi_rtp` (37) and `aud_midi_network` have no code example although
  each has an `example/`. The umbrella README has no per-platform feature
  matrix and no getting-started beyond a benchmark table. Four READMEs
  (apple, android, windows, linux) list a BLE peripheral under "Goals" that
  no package offers an API for.
- Missing guides: "write a node" around `aud_node_base.hpp` and the
  registration pattern — the only example is the gain node in
  `aud_audio_core/src/aud_audio_core.cpp:352-456`; "where may an
  instrument live" for the sampler's three path schemes (file, `asset:`,
  `apk:/`), today documented in the C header, the Dart doc and the README;
  installation per platform (iOS microphone purpose string, Android
  manifest and 16 KB pages, the Flutter and `jni` requirement, macOS,
  Windows) — scattered over the io, midi and sampler READMEs.

### German copies, changelogs, examples, metadata

- `README.de.md`: stale in `aud_audio_pm` (three bullets missing, 10-08
  against 10-22) and `audaudio.github.io` (the 6-line boilerplate stub);
  partial in `aud_audio_core` (omits the Dart block). The 18 stubs leave
  their description untranslated. The audmidi copies are in sync. No repo
  has `doc/guides/translate-guide.md`, so the German copy is optional by
  the PM guide; a stale copy is worse than none (opinion).
- `CHANGELOG.md`: every latest section matches the pubspec version, but 21
  sections in 13 repos are empty (`aud_audio_web` 0.0.5 to 0.0.10,
  `aud_audio_midi` 0.1.1 to 0.1.4, graph 0.5.3, io 0.3.1, sampler 0.3.5,
  effects 0.2.2 and 0.2.3, bench 0.0.3, …) and the filled ones are commit
  dumps with duplicates ("Add review fixes of ticket 26" twice,
  `aud_audio/CHANGELOG.md:429-433`). `aud_midi/CHANGELOG.md` 0.1.1 claims
  pins of `^0.2.0` the pubspec does not have. The site repo records only
  "Unreleased" for versions 0.1 to 0.4.1.
- `example/`: `aud_audio_midi`, a real 0.1.6 package, has none; 16
  `example/README.md` files are the Flutter template text; the io example
  depends on `aud_audio_core ^0.3.0` (`example/pubspec.yaml`) against the
  package's `^0.5.4` and overrides sibling checkouts
  (`../../aud_audio_core`), so `pub get` fails outside a ticket workspace;
  the auv3 example does the same for `aud_audio_ui_controls`.
- `index.jsonc`: all 43 parse, but 29 `uses`/`usedBy` pairs are not
  mirrored — `aud_audio_core.usedBy` lacks auv3, midi, script and vst3,
  `aud_audio_graph.usedBy` lacks io, script, effects and sampler,
  `aud_midi.usedBy` and `aud_midi_standard.usedBy` lack the cross-family
  users `aud_audio_midi`, `aud_audio_core` and `aud_dsp_sampler`; six
  `uses` entries are dev dependencies only; `aud_midi_core` and
  `aud_midi_standard` put five repos into one comma-separated key;
  `aud_audio_ui_controls.uses` is empty while `aud_audio.usedBy` lists it
  and the entry claims `aud_audio_vst3` uses it, which only the auv3
  example does. The `domain` of the site repo names only the graph and
  host pages.
- `pubspec.yaml`: no package of either family has `documentation:` or
  `issue_tracker:`; audaudio has no `topics:`; `platforms:` exists only in
  `aud_audio` (android, ios, macos — Windows works since 0.4.5) and in the
  five audmidi backends, so pub.dev tags `aud_midi` as web-only because
  pana follows the imports into `aud_midi_windows` and `aud_midi_linux`.
  `aud_audio`'s description says "iOS, Android and macOS" where the site
  says six platforms. `pana: execute: false` in every `check.yaml`.
- Lint: `public_member_api_docs` is enabled in all audmidi repos,
  `aud_audio_vst3` and the PM repos, nowhere else in audaudio; the
  coverage is discipline, not enforcement.
- The `LICENSE` of every repo reads "MIT License / Copyright (c)
  Audanika. All Rights Reserved." (`aud_audio_core/LICENSE:1-3`); "All
  Rights Reserved" contradicts the MIT grant of license-002.
  `audaudio.github.io` has no `LICENSE` at all although every header points
  to one.

## 3. What audaudio.github.io and audmidi.github.io still need

### audaudio.github.io

Facts: the repo `audaudio/audaudio.github.io` (local folder
`audaudiohub.io`; the tickets 20 to 22 use that name, `index.jsonc` and
`packages.jsonc` the real one) runs the stack docs-001 prescribes — Astro
7.4, Starlight 0.42.7, pnpm, vitest, `Snippet.astro` with `#region`
extraction, `deploy.yml` on push to `main`. It has six pages — splash,
overview, the graph, the headless host, audio IO, the engine — and the
live site serves exactly these six URLs with the source's headings and
code blocks; no drift. Documented packages: `aud_audio_graph`,
`aud_audio_io`, `aud_audio`. Not documented: `aud_audio_core`,
`aud_dsp_sampler`, `aud_dsp_effects`, `aud_audio_midi`,
`aud_audio_script`, `aud_audio_vst3`, `aud_audio_ui_controls`, the AUv3
spike. `/api/` is a 404; there is no `/de/`.

The promises of docs-001 against reality:

| Promise | State |
| --- | --- |
| Tested Dart snippets in `test/content/docs/<page>_test.dart`, run by `dart test` before `astro build`, goldens through the offline renderer | Not done. `test/content/docs/*.spec.ts` are vitest files that hold the Dart and JSON as string literals and regex-check or `JSON.parse` them. No `pubspec.yaml`, no Dart, no goldens. `engine.spec.ts` is a hand copy of the umbrella README example and has already drifted (the README has `AudEngineConfig(cacheBudget …)` and the `AudDspSampler` lines the site lacks). |
| `scripts/sync-packages.js` copies package pages into `guides/packages/` | Missing; no package has a `doc/` page to sync except `aud_audio_vst3/doc/plugin-bundle.md`. |
| One `dart doc` run into `public/api/`, linked from the sidebar | Missing; `deploy.yml` has no Dart step. |
| `documentation:` in every pubspec | No pubspec of either family has it. |
| Audanika theme and logo | `src/styles/audanika.css` is "the look and feel of https://angular.dev"; no logo. |
| Benchmark numbers per device from `aud_audio_bench` | The bench app is the template; the engine page shows one iPad Pro table, the reference devices of release-004 are open. |

What must still be added, in the order it serves a reader (opinion):

1. Getting started and installation per platform: the per-OS setup now
   scattered over the io, midi and sampler READMEs; the git dependency with
   `tag_pattern` until the packages are on pub.dev.
2. One page per implemented package — core (ABI, event and timing
   formats, preset schema), sampler, effects, midi, script, ui_controls,
   vst3 with `plugin-bundle.md`, auv3 and clap as planned — synced from
   the repos as docs-001 wants, so the repos stay the source of truth.
3. An ecosystem page: the table of all 31 packages with their state
   (released, planned), generated from `packages.jsonc`.
4. The API reference under `/api/` and the `documentation:` fields.
5. Real Dart snippet tests with goldens, replacing the string specs.
6. A cookbook fed by `aud_audio/example` (13 Dart files, three pages) and
   `aud_dsp_effects/example`.
7. The benchmark page (reference devices, JSON from the bench app).
8. Licensing (license-001 to 003, the notices convention, the terms of
   Link, ASIO and the sfizz fork), a contribution guide (the gg workflow,
   the review), release notes with the ABI version per release.
9. Repo hygiene: `LICENSE`, `README.de.md`, `CHANGELOG.md`, `index.jsonc`,
   the theme, optionally the German locale.

### audmidi.github.io

Facts: `https://audmidi.github.io` and
`https://github.com/audmidi/audmidi.github.io` are 404; the organization
profile's website field points at the dead link. All ten packages are on
pub.dev under the verified publisher audanika.com (`aud_midi` 0.1.4 with
160 of 160 pub points and an API reference at
`pub.dev/documentation/aud_midi/latest/`). `aud_midi_pm` has an
architecture with a package table, a runtime diagram, the composition per
platform and a verification matrix, eleven decisions and the references,
but no documentation decision and no site ticket; its `index.jsonc`
promises blog posts that no repo has.

What must still be created (proposal): the repo `audmidi/audmidi.github.io`
from `audaudio.github.io` — the same stack, deploy workflow and
`check-pages-source.js` — with a decision `docs-001` in `aud_midi_pm`, and
these pages: start and overview; getting started (`Midi.open()`, the pub.dev
install, the entitlements and permissions per platform that the umbrella
README already lists); concepts — the MIDI isolate and proxies
(isolate-001), ports, hot-plug and fingerprints (ports-001), timing and
scheduling (scheduling-001, the `midi_bench` numbers), MIDI 1.0, 2.0 and
UMP with the translation rules (translation-001, standard-001), network
MIDI (network-001), Bluetooth LE, native taps and the bridge into the
audio engine (native-001); one page per package synced from the READMEs
with the verification matrix; the API as links to pub.dev; references and
licensing from `doc/references/README.md`; contributing; release notes.
Until then the organization's website field should point at pub.dev.

## 4. Where code is not split sensibly into packages

Each case names where the code is, where the architecture puts it, and
what follows (opinion in the last part).

- **DSP in the graph.** `aud.graph.oscillator` and `aud.graph.filter` (a
  state-variable filter) are implemented in
  `aud_audio_graph/src/aud_graph_nodes.cpp` and registered into every
  graph by `aud_graph_create` ("with the reference nodes registered",
  `aud_audio_graph/src/aud_audio_graph.h:313-315`); `aud_audio_core`
  ships `aud.core.gain` (`src/aud_audio_core.cpp:352-412`). The
  architecture says signal processing happens only in DSP packages, and
  S10b puts oscillators and filters into `aud_dsp_effects`. The effects
  example (`example/lib/effects_chain.dart:48`) and the controls example
  already use the graph's oscillator as a production node. Mixer,
  feedback, tap and channel split are structural and belong in the graph.
  Follows: move oscillator and filter into `aud_dsp_effects`, keep
  `aud.test.*` nodes for the contract tests, or declare `aud.graph.*`
  stable — today both apps and docs are ambiguous.
- **The OSC router in the core next to an empty OSC package.**
  `aud_audio_core/lib/src/aud_osc_adapter.dart` (595 lines, with
  `AudOscTarget` resolution, lines 18-60) implements the address router
  the stub `aud_audio_osc` promises, and `AudReply`, `AudDone`, `AudFail`,
  `AudMeter`, `AudNodeCreated` and `AudOscVocabulary`
  (`lib/src/aud_command.dart:312-500`) are produced and consumed by
  nothing outside core's tests. Two notification hierarchies coexist:
  `AudNotification` (core, `aud_command.dart:402`) and
  `AudGraphNotification` (graph, `lib/src/aud_graph_notification.dart:18`)
  bridged by `toOsc()`, with pairs like `AudDiagnostic` and
  `AudDiagnosticNotification` duplicating fields. Follows: a decision
  (osc-003) on what stays in the core — the model and the typed commands —
  and what `aud_audio_osc` adds — the router, replies, servers —, and one
  engine notification type with an OSC encoder in the OSC package.
- **Device heuristics and the load governor in the umbrella.**
  `AudDeviceProbeNative` reads `/sys`, `__system_property_get` and
  `sysctlbyname` through libc FFI
  (`aud_audio/lib/src/aud_device_class_native.dart:17-21`); with
  `AudLoadGovernor` and `AudLoadPolicy` about 750 lines of device
  heuristics and policy sit in the package the architecture calls
  "umbrella: Engine = graph + io + node registry". Ticket 34 moves the
  governor into `aud_audio_voice_allocator`; the device probing belongs to
  `aud_audio_io`, which already measures core placement (io-003).
- **The plugin shell core inside the VST3 shell.** The Dart library of
  `aud_audio_vst3` is a shell-neutral editor protocol — "between a plugin
  shell and its editor process", `lib/src/aud_shell_message.dart:14-19`,
  every class `AudShell*`, nothing VST3-specific — and the C++ is mostly
  format-neutral too: the control thread with its parameter ring
  (`aud_vst3_engine.hpp`), `plugin.json`, presets and state
  (`aud_vst3_settings.hpp`), the content locations (`aud_vst3_bundle.hpp`),
  the host transport (`aud_vst3_transport.hpp`), MIDI to `AudEvent`
  (`aud_vst3_midi.hpp`), the socket, the semaphore (a copy of
  `aud_audio_script`'s, `aud_vst3_sync.hpp:7-11`) and the UI thread.
  VST3-specific are `aud_vst3_plugin.cpp`, `aud_vst3_param.cpp`,
  `aud_vst3_factory.cpp` and the editor views. The AUv3 spike copies the
  control-thread engine a second time ("as the VST3 plugin of
  aud_audio_vst3 has them", `aud_audio_auv3/src/aud_auv3_engine.h:7-17`)
  and the FNV-1a parameter id a third time (`audParamId`,
  `lib/src/aud_auv3_component.dart:52-59`, next to `AudHost.paramIdOf`
  and `aud_host_param_id`). A CLAP or AUv3 editor would depend on
  `aud_audio_vst3`. Follows: a shell core package, see section 5.
- **The shell knows the build internals of three node packages.**
  `aud_audio_vst3/scripts/build-plugin.js:159-230` hard-codes the build
  recipes of `aud_dsp_sampler` (the sfizz `SOURCES.txt`), `aud_dsp_effects`
  and `aud_audio_script` (the QuickJS file list), and line 454 throws "no
  recipe for package" for any other. The "generic" shell breaks when a
  node package changes its hook. Follows: every node package publishes its
  sources, includes, defines and notices as a manifest (sfizz already has
  `SOURCES.txt` and `INCLUDES.txt`; build-001, web-001 wants the same
  manifest for the web), and the shell reads it.
- **The node boilerplate per DSP package.** The registration prologue is
  identical in `aud_dsp_sampler/src/aud_dsp_sampler.cpp:74-79` and
  `aud_dsp_effects/src/aud_dsp_effects.cpp:11-16`; the Dart FFI
  boilerplate — `AudDsp<X>.register`/`registerWith`, an exception class,
  the `@RecordUse` member list mirrored in `hook/link.dart` and checked by
  `test/hook/link_test.dart`, `web_compile_test` — is a 1:1 copy between
  the two; the effects carry a package-local node kit (`AudEffectNode`,
  `effectVTable<T>`, `effectDescriptor()`, `flush`, `tailFrames`,
  `AudQuadratureOscillator`, `AudSmoother`,
  `aud_dsp_effects/src/aud_effects_node.hpp:68-356`) that the sampler does
  not use: it is a hand-written C vtable in C++14 (`src/aud_sfz_node.hpp:
  210-217`, because the hook compiles it together with sfizz's C sources
  without a `-std` flag, `hook/build.dart:50`). The parameter table of a
  node exists three to four times — C header comments, the C++ table, the
  Dart class, the preset builder, the README (`aud_dsp_sampler/src/
  aud_dsp_sampler.h:76-99`, `src/aud_sfz_node.hpp:38-57`, `lib/src/
  aud_sfz_sampler.dart:35-64`, `lib/src/aud_sfz_preset.dart:26-42`;
  `aud_dsp_effects/src/aud_tremolo_node.hpp:23-28`, `src/aud_dsp_effects.h:
  148-155`, `lib/src/aud_tremolo.dart:29-47`). Follows: a node kit and a
  descriptor-driven generator in the core (section 5).
- **Shared utilities copied instead of shared.** `aud_semaphore.hpp` was
  copied from graph to io (`aud_audio_io/src/aud_semaphore.hpp:10` says
  so) and again into vst3 although `aud_audio_core` is the header-only home
  of `aud_spsc_queue.hpp`; `test/native/aud_test.hpp` exists in graph, io,
  midi and script with drift (graph has `AUD_CHECK_MSG`, io not; midi and
  script differ in 21 of 110 lines); `scripts/test-native.js` exists in
  four variants (289, 278, 234 and ~450 lines); `scripts/
  generate-abi-constants.js` is byte-identical in three repos; vst3 has a
  harness of its own (`aud_vst3_harness.hpp`). `AudWavFile` and a
  hand-written JSON reader and writer (`aud_audio_graph/src/aud_json.cpp`,
  620 lines) live in the graph; WAV belongs to `aud_audio_file` or a test
  utility, JSON will be needed by the shells and fits the core.
- **The Flutter dependency below the umbrella.** `aud_audio_io` depends on
  `flutter`, `jni` and `jni_flutter` for its Android device, focus and
  permission handling (`lib/src/android/`, 1.6k generated lines);
  `aud_audio_midi` depends on `flutter` as well. The architecture says the
  packages below the umbrella are "usable on their own (tests, servers,
  plugin shells)"; a Dart server or CLI cannot take them. The audmidi
  family accepted the same for `jni` (packaging-001). Follows: document
  it, and keep the platform-neutral parts (the MIDI nodes and parser of
  `aud_audio_midi`, the IO contracts) importable without Flutter.
- **The UI stubs depend on the engine.** `aud_audio_ui_graph_edit`,
  `_keyboard` and `_waveform` depend on `aud_audio ^0.4.5`, `_piano_roll`
  on `aud_audio_sequencer`, `_waveform` also on `aud_audio_file`, and
  `packages.jsonc` lists these dependencies — against the accepted ui-003
  ("the UI packages do not depend on the engine"), which
  `aud_audio_ui_controls` honours (Flutter only). But `AudParamSpec`
  re-declares the fields of the core's `AudParamDescriptor`
  (`aud_audio_ui_controls/lib/src/aud_param_spec.dart:44-80` against
  `aud_audio_core/lib/src/aud_node_descriptor.dart:168-245`) without a
  converter, and `AudParamAddress.path` is `/<node>/<param>`
  (`aud_param_spec.dart:27`) where the engine's scheme is
  `/graph/<g>/node/<n>/param/<p>` (`aud_osc_address.dart:41`). ui-003
  forbids the engine, not the platform-neutral `aud_audio_core.dart`
  (no `dart:ffi`, `lib/aud_audio_core.dart:7-10`). The binding package
  `aud_audio_ui_bindings` that ui-003 names does not exist.
- **The MIDI parser twice.** `aud_audio_midi/src/aud_midi_parser.cpp`
  re-implements the MIDI 1.0 byte-stream parser `aud_midi_standard` has in
  Dart. Justified — the native tap path cannot call Dart (midi-002) — but
  the two have different drop policies (64 KiB cap and a half-full rule
  against 1 MiB and a duration) and no shared conformance vectors.
- **The audmidi side.** The layers standard → core → rtp, network and the
  backends → umbrella are cut as the PM table says, and the pubspecs match
  it. What is duplicated: the 10 s resync timer around the shared
  `MidiClockMapper` in every backend (`aud_midi_apple/lib/src/
  apple_midi_backend.dart:65,82`, `aud_midi_android/lib/src/
  android_midi_backend.dart:65,500-506`, `aud_midi_windows/lib/src/
  backend/windows_midi_backend.dart:56,83`, `aud_midi_linux/lib/src/alsa/
  alsa_time_base.dart:29-46`); the C signature of the native tap, which
  core carries only as a doc comment (`aud_midi_core/lib/src/backend/
  midi_native_tap.dart:9-26`) and which is typedef'd again in
  `aud_midi_apple/src/aud_midi_apple_tap.h:52`, `aud_midi_android/src/
  aud_midi_android.h:61` and `aud_audio_midi/src/aud_audio_midi.h:100-118`;
  the BLE composition, which the umbrella does (`aud_midi/lib/src/backend/
  midi_platform_backend_io.dart:71-75`) while `LinuxMidiBackend` still
  takes a `bluetooth:` parameter. The backends export their internals:
  `aud_midi_apple` 15 files including `*_native.dart` and
  `midi_core_midi_setup.dart` (`lib/aud_midi_apple.dart:14-26`),
  `aud_midi_android` 24 including the JNI platform and port tables,
  `aud_midi_windows` 13. The Android jnigen bindings are 26.9k lines, 89 %
  of the package's Dart, binding Wi-Fi, Bluetooth and NSD classes
  wholesale; `jnigen.yaml` should be restricted to the used members.

## 5. Which packages should be introduced

- **`aud_audio_plugin`, the plugin shell core** (new): the editor protocol
  (`aud_shell_*.dart`, with `Aud` prefixes also in C++ — `class Plugin`,
  `class Engine`, `SocketServer` and `struct Settings` of the VST3 shell
  carry none, `aud_vst3_plugin.hpp:82`, `aud_vst3_engine.hpp:96`), the
  settings, state, bundle, transport, MIDI, socket, semaphore and UI-thread
  C++, JSON schemas for `plugin.json`, `presets.json` and the state (the
  graph document has `aud_graph_document.schema.json`; the shell parses
  all three only in C++, `aud_vst3_settings.hpp:88-121`), a
  platform-neutral input contract, and the native harness. `aud_audio_vst3`
  keeps plugin, parameters, factory and editor views; `aud_audio_clap`
  (S19) and `aud_audio_auv3` (S20) build on it instead of copying.
- **`aud_audio_ui_bindings`** (ui-003, S17a): the adapters from the
  widgets' sinks and models to `AudEngine`; apps depend on it, plugin
  editors do not. Decided, not built.
- **`aud_audio_voice_allocator`** (ticket 34): decided and planned; the
  device probing of the umbrella goes to `aud_audio_io` in the same move
  (opinion).
- **A node kit and a generator inside `aud_audio_core`** — no new
  package: `src/aud_node_kit.hpp` from the effects' node kit, a Dart
  `AudNodePackageFfi` helper with one exception type and the link-hook and
  link-test helpers, and a Node.js generator in `scripts/` that takes one
  JSON descriptor per node type (`AudNodeDescriptor.fromJson` exists,
  `lib/src/aud_node_descriptor.dart:506`) and writes the C header enum and
  tables, the Dart mirror class with dartdoc (ranges, units, defaults),
  the preset builder and the README table. This is what architecture.md
  promises; with it the seven planned DSP packages (S10b to S13, S25,
  S26) start from a pattern instead of a copy.
- **`testing.dart` libraries instead of a test package.** The fakes the
  tests need exist: `FakeMidiBackend` in `aud_midi_core`,
  `AudIoBackend.nullDevice` and the test-only members of `AudIoSession`
  (`inject`, `setBlockSizes`, `aud_audio_io/lib/src/aud_io_session.dart:
  172-177`; `debugProcess`, `lib/src/aud_io_stream.dart:78-85`;
  `manualClock`) in `aud_audio_io`, `waitLoads` and `waitTasks` in
  `aud_audio_graph`. Each belongs in a `testing.dart` library of its
  package; a contract suite for the five MIDI backends belongs in
  `aud_midi_core/lib/testing.dart` — today the contract tests run against
  the fake only (`aud_midi_core/test/backend/midi_backend_test.dart:68-69`)
  and prove the abstraction, not the backends.
- **A canonical `aud_midi_tap.h`** in `aud_midi_core` (versioned, included
  by apple, android and `aud_audio_midi`) in place of three typedefs.
- **`audmidi.github.io`** (new repo), see section 3.
- **Not to introduce** (opinion): a BLE package for audmidi — the generic
  BLE backend is 440 lines in core and only Linux uses it; a split of
  `aud_midi_network` into AppleMIDI and Network MIDI 2.0 — session,
  discovery and backend code (12 of 25 files) are shared, and the real
  limit is that the umbrella selects one protocol process-wide
  (`MidiOptions.networkProtocol`, `midi_platform_backend_io.dart:96-101`),
  which two composed backends fix; `aud_dsp_basic` for the oscillator and
  filter — S10b already names `aud_dsp_effects`; a separate test package
  for audaudio — testing libraries per package carry less coupling.

## 6. Which packages should be merged

None (opinion, with reasons):

- The three plugin shells have different SDK licenses, platforms and host
  APIs; the shell core takes what they share.
- `aud_audio_link` stays apart from `aud_audio_sequencer`: it is a
  provider of the transport, the sequencer a consumer, and link-002
  isolates Link's license.
- The seven DSP repos stay: per-package provenance and notices (dsp-001),
  the link hook that drops an unused library (interop-001), independent
  versions (family-002), and the instrument packages (stk, synth, mi) all
  consume the planned voice allocator. A merge into `aud_dsp_instruments`
  would save boilerplate the kit and the generator save anyway.
- The five UI repos make sense only if ui-003 is enforced — plugin editors
  need the controls alone, which the AUv3 example proves. Four of five
  violate it today.
- `aud_midi_rtp` could live inside `aud_midi_network`, but its standalone
  value for servers and bridges justifies the repo.

What should go instead of a merge: the 18 audaudio stubs lose their
template API now — an empty library, a README and an `index.jsonc` that say
"planned, step Sx", no template example with six runner folders, no 5 s
`sum_long_running` test on every `dart test`, no unused dependencies —
before anybody depends on `sum()`; the umbrella drops its pin of
`aud_audio_web` 0.0.10, which it never imports; the empty releases stop
(family-002).

## 7. Where functions and interfaces are implemented awkwardly

### aud_audio_core

- The contract names five thread tags — `[control] [realtime] [offline]
  [worker] [any thread]` (`src/aud_abi.h:21-27`) — but the enum carries
  three (`src/aud_abi.h:156-160`) and `AudAbi.threadName` maps three
  (`lib/src/aud_abi.dart:77-82`); worker and any are not representable in
  code.
- Result codes: the ABI "owns the codes down to -99"
  (`aud_audio_graph/src/aud_audio_graph.h:59-60`), yet the graph takes
  -100 and -101 (`aud_audio_graph.h:64-66`) and io takes -100 to -103
  (`aud_audio_io/src/aud_audio_io.h:70-76`); in the umbrella -100 is
  ambiguous, and `AudIoException.resultName` and `AudAbi.resultName`
  disagree. Allocate ranges per package in `aud_abi.h` and keep one name
  registry.
- `AudEvent.fromWords` throws "Unknown event" for `AUD_EVENT_MESSAGE`
  (`lib/src/aud_event.dart:42-65`) although the ABI defines the type
  (`aud_abi.h:344-349`).
- Parameters are addressed by descriptor index in the public command and
  event layer (`AudSetParamCommand.paramIndex`, `aud_command.dart:88`;
  `AudParamEvent.paramIndex`, `aud_event.dart:329`) and in JSON; a
  reordered descriptor silently breaks saved commands. The headless host
  already has stable ids; the Dart and JSON layer should use ids and keep
  indices inside the engine.
- `AudTimeFilter`, `AudParamRamp`, `AudFixedBlockAdapter` and
  `AudNativeTransportSnapshot` have `dispose()` but no `NativeFinalizer`
  (`lib/src/aud_time_filter.dart:113-120`): a forgotten dispose leaks.
- `aud_clock.h` pulls `<windows.h>` into every translation unit of every
  package (`src/aud_clock.h:16-20`) and uses `#if _WIN32` instead of
  `#ifdef` (`aud_clock.h:16,33`, `aud_abi.h:53`).
- The ABI policy "minors must match exactly in major 0" (`aud_abi.h:16-20`)
  rebuilds every DSP package in lockstep on each ABI change; expected
  before 1.0, but the 1.0 date and the "shared or static engine" question
  of abi-001 are undecided.

### aud_audio_graph

- `AudGraph` is one interface of more than 60 members
  (`lib/src/aud_graph.dart:103-470`) spanning lifecycle, topology, loads,
  messages, process caches, transport, OSC, taps, statistics and
  documents. Process-global state hides behind instance members: the
  `cacheBudget` setter and `waitTasks` (`aud_graph.dart:354-366`) call
  `aud_cache_set_budget` and `aud_tasks_wait_idle`
  (`src/aud_audio_graph.h:967-980`); the worker pool is a leaked singleton
  (`static Resources* resources = new Resources()`,
  `src/aud_graph_resources.cpp:16`); watchdog counters are statics on
  `AudGraphFfi` (`lib/src/aud_graph_ffi.dart:1152-1160`) and
  `g_watchdogTotal` (`src/aud_graph_watchdog.cpp:26`); the C names
  `aud_cache_*` and `aud_tasks_*` lack the `aud_graph_` prefix of their
  library. Follows: an explicit runtime handle (`AudRuntime`,
  `aud_runtime_*`) owned by the umbrella, and facets of the graph
  interface (`graph.loads`, `graph.transport`, `graph.osc`).
- `setParam(AudNode, Object param, …)` and `setString(AudNode, Object key,
  …)` take `Object` meaning "index or id" (`aud_graph.dart:232-234, 289`;
  the dispatch in `aud_graph_ffi.dart:539`); node type ids are bare
  strings. Typed ids emitted by the generator make misuse a compile
  error.
- `waitLoads` and `waitTasks` block the calling isolate from the main
  interface (`aud_graph.dart:313-318, 363-366`): test and offline concerns.
- The header says `aud_graph_start` works "from the prepared or stopped
  state" (`src/aud_audio_graph.h:329-330`), the code also accepts
  `AUD_GRAPH_CREATED` (`src/aud_graph.cpp:1232-1238`), and the README
  example starts without `prepare` (`README.md:262-270`).
- Node logs go to stderr or logcat with a numeric level
  (`src/aud_graph.cpp:186-193`); no Dart sink exists in any of the four
  core packages, so an app cannot capture `AudHostApi.log`.
- `AudGraphOptions.==` compares `toString()`
  (`lib/src/aud_graph_options.dart:110-114`); `AudNode.==` compares
  handles only, so nodes of two graphs compare equal
  (`lib/src/aud_graph_node.dart:768`).
- One golden file (`test/goldens/oscillator_filter.wav`); the "goldens
  that must match for any thread count" have no thread-count dimension
  yet because the scheduler is serial (sched-001).

### aud_audio_io and the umbrella

- Streams are capped at two channels per direction ("at most 2",
  `src/aud_audio_io.h:199-200`; `lib/src/aud_io_stream_config.dart:57-61`)
  while the architecture promises multi-channel streams and the header
  defines `AUD_IO_MAX_CHANNELS 32` (`aud_audio_io.h:65`).
- On Linux `AUD_IO_BACKEND_PLATFORM` silently becomes the null device
  (`src/aud_io_null.cpp:599-605`, `aud_audio_io.h:80-84`): an app plays
  silence without an error, the only hint being `backendName == 'null'`.
- Platform-specific knobs sit in the generic API: `mixWithOthers`,
  `bluetoothHfp`, `measurement` ("iOS:") in the `AudIoSession` factory
  (`lib/src/aud_io_session.dart:94-96`), `exclusive` and `latencyTuner`
  ("Android:") in `AudIoStreamConfig` (`aud_io_stream_config.dart:75-79`).
- The platform-neutral `AudIoSession` has no `open`; only
  `AudIoSessionFfi.open(config, render:, user: Pointer<Void>?)`
  (`lib/src/aud_io_session_ffi.dart:193-197`) exists, and the README tells
  apps to pass `graph.pointer.cast()` (`README.md:84-88`). An
  `AudIoRenderer` abstraction would keep raw pointers out of app code.
- `AudEngine` is output-only: `AudEngineConfig` has no input direction or
  channels (`aud_audio/lib/src/aud_engine_config.dart:30-46, 88-94`) and
  the graph is created without input buses
  (`lib/src/aud_engine_ffi.dart:44-49`); an app that records or monitors
  assembles io and graph itself. Packages register only at construction
  (`AudEngine({packages})`, `lib/src/aud_engine.dart:41-49`), there is no
  `addPackage` before `prepare`. `aud_audio.dart` re-exports all of core,
  graph and io including the null-device test API (`lib/aud_audio.dart:
  15-17`).
- Four unrelated exception types — `AudCoreException`,
  `AudOscException`, `AudGraphException`, `AudIoException` — without a
  base; native errors reach Dart as "Could not <what>: CODE"; the only
  native message channel is `aud_host_last_error`
  (`aud_audio_graph.h:1077-1079`).

### DSP packages

- `AudSfzSampler.setString` maps every `std::exception` to
  `AUD_ERROR_OUT_OF_MEMORY` (`aud_dsp_sampler/src/aud_sfz_node.cpp:
  1337-1346`) and loses the cause; `max_voices` uses 256 as a "no limit"
  sentinel (`src/aud_sfz_node.hpp:54-56`); `AudSfzPreset.file` and
  `.text` repeat ten named parameters and their docs
  (`lib/src/aud_sfz_preset.dart:43-121`); Dart naming mixes `AudSfz*` with
  `AudDspSampler`, and the C++ types `Node`, `Shared`, `Config`, `Source`
  carry no `Aud` prefix (naming-001). The loader threading is well
  specified and no dispose gap was found.
- `AudTempoDelay.division` is a stepped index whose labels and beat
  lengths exist only in Dart (`aud_dsp_effects/lib/src/aud_tempo_delay.
  dart:22-78`); `AudParamDescriptor` has no value labels
  (`aud_abi.h:468-479`), so the UI and the shells cannot show them. The
  effects hook has no Windows branch: `-fvisibility=hidden` and
  `-ffp-contract=off` are passed unconditionally (`hook/build.dart:28-50`)
  where the sampler branches for MSVC.
- `AudScriptModulator.stats()` is static and process-wide
  (`aud_audio_script/src/aud_audio_script.h:150-152`, `lib/src/
  aud_script_modulator.dart:188-191`): with the 23 combis of the app, a
  late tick cannot be attributed to a node. `mode0` to `mode15` are
  hard-coded next to `mode(int)` (`aud_script_modulator.dart:112-133`).
- `ffigen.yaml` of midi, sampler and effects use
  `-I../aud_audio_core/src`, the sibling layout of a ticket workspace,
  not the resolved package.

### Plugin shells and the MIDI bridge

- The editor protocol leaks macOS into a cross-platform contract that
  Windows now uses too: `AudShellInput.keyCode` is "the macOS key code"
  (`aud_audio_vst3/lib/src/aud_shell_message.dart:603`), `AudShellPlace` is
  in "AppKit's global coordinates" (`:636-641`), `AudShellCursor.kind` is a
  free string (`:713`), `AudShellSettings.settings` an opaque text
  (`:349-366`); `audShellProtocolVersion = 3` (`:12`) is never checked in
  `AudShellWelcome.fromJson`.
- `AudMidiAdapter({required int source, required int push, required int
  release, …})` takes raw native addresses
  (`aud_audio_midi/lib/src/aud_midi_adapter.dart:42-50`), fed from
  `AudEventSourceFfi.pushFunctionAddress` (`aud_midi_bridge.dart:665-673`);
  a wrong integer is undefined behaviour on the receive thread. The
  `AudMidiBridge` constructor registers itself as an engine extension,
  subscribes two streams and may start a timer (`aud_midi_bridge.dart:
  91-101`); `AudMidiOutput.close()` has no closed guard (`:839-845`) where
  `AudMidiInput.close()` has one (`:532-535`).

### audmidi

- **Bug:** `MidiCompositeBackend.capabilities` reports `scheduling:
  hardware` only if every active backend does (`aud_midi_core/lib/src/
  backend/midi_composite_backend.dart:188-191`); the network session
  backend (`aud_midi_network/lib/src/backend/midi_network_session_backend.
  dart:280-287`) and the BLE backend omit `scheduling`, so the merged value
  reads `software` on every platform where a network or BLE backend is
  active although the OS backend schedules in hardware. The `virtualPorts`
  merge (`:181-183`) depends on the enum order.
- `MidiNativeTap` holds raw `int` addresses (`backend/midi_native_tap.
  dart:35-38`) because core bans `dart:ffi`, with the C signature as a doc
  comment; `Midi.now()` returns `MidiSystemClock` time (`aud_midi/lib/src/
  api/midi.dart:98`) and no API converts `MidiTime` to the host clock the
  tap uses, so `aud_audio_midi` re-implements the core's mapper
  (`lib/src/aud_midi_clock.dart`, the same 5-sample, 10 s algorithm as
  `MidiClockMapper`). Three time domains, two of them undocumented as
  identical on the VM.
- Lifecycle errors are `StateError` (`api/midi.dart:321,336,509`), not
  `MidiException`; the bridge catches `StateError`
  (`aud_audio_midi/lib/src/aud_midi_bridge.dart:704-706`).
  `MidiInput.supportsNativeTap` is decided per backend name
  (`api/midi_input.dart:90`) while the contract is per port
  (`midi_native_tap_backend.dart:34`). `withBackend` sends a closure across
  isolates (`api/midi.dart:112-126`), documented, not enforced. The
  optional backend interfaces are discovered with `is`
  (`midi_composite_backend.dart:129,140`), undocumented in the contract.
- The proxy layer mirrors the engine one to one — `Midi`, `MidiInput`,
  `MidiOutput`, `MidiVirtualPorts`, `MidiBluetooth`, `MidiNetwork` against
  the sessions of core — plus 24 command and 11 notice classes
  (`lib/src/isolate/midi_host_command.dart`); inherent to the isolate
  design, but every addition costs four edits.
- Transport is guessed from the driver-owner string
  (`aud_midi_apple/lib/src/core_midi/midi_core_midi_setup.dart:93-100`:
  `contains('usb')`, `contains('bluetooth')`, `contains('iac')`); no serial
  number is read, so Apple fingerprints lack it. Backend names route
  everything as strings (`midi_composite_backend.dart:224-233`:
  `'coremidi'`, `'android'`, `'winrt'`, `'alsa'`, `'webmidi'`,
  `'netmidi'`).
- Naming: three conventions coexist — `Midi*` per naming-001 of
  aud_midi_pm, platform-first `AppleMidiBackend`, `WindowsMidi*`,
  `WebMidi*`, `Alsa*`, and `AudMidi*` for C and Java symbols — against
  the `Aud*` of the audio family. naming-001 ("all public types carry the
  Midi prefix") is violated by the five backend packages.

## 8. Further points for a good framework

- **CI.** All 43 repos: one `quick_check.yaml`, one ubuntu job. Never
  compiled in CI: `aud_io_ios.mm`, `aud_io_macos.mm`, `aud_io_windows.cpp`,
  `aud_io_android.cpp`, the VST3 bundle, the AUv3 spike, the C++/WinRT
  shim of `aud_midi_windows`, the ALSA path of `aud_midi_linux` (the
  ubuntu job installs neither `libasound2` nor `snd-seq`). Never run in
  CI: the sanitizer builds (RTSan needs Homebrew LLVM), the VST3 validator
  and test host, the 8 `@TestOn('mac-os')`, 2 `windows`, 3 `linux` and 1
  browser test files of audmidi. The 100 % coverage per file is reached
  with fakes and hides that the Windows and Linux MIDI code has never
  executed. The realtime discipline itself is the strongest part of the
  family — a watchdog that replaces global `new` and `delete`, RTSan and
  TSan runs, stress tests, preallocated render structures, `std::sort`
  without allocation (`aud_graph_render.cpp:1459-1466`), notification
  threads waking Dart through `NativeCallable.listener` — the gap is CI,
  not code.
- **Versioning and publication.** audaudio: git references with
  `tag_pattern` over SSH URLs (`git@github.com:…`, e.g.
  `aud_audio_graph/pubspec.yaml`) although repos-001 says "public repos
  use https URLs so that CI and users without SSH keys can resolve them"
  — all 43 repos are public; `publish_to: none` everywhere; the umbrella
  pins core, graph and io exactly (family-001) where family-002 wants
  caret ranges, so every patch of a member forces an umbrella release;
  midi and web carry commits "Add nothing: no change of its own in ticket
  27/30" and web went from 0.0.2 to 0.0.10 without code, which family-002
  forbids. audmidi: hosted caret pins on pub.dev, released per ticket,
  `aud_midi_android` drifted to 0.2.1 with no lockstep check. The switch
  of audaudio to pub.dev (S22, repos-001) has no date.
- **Licenses.** Vendored code is in order where it exists — miniaudio
  0.11.25 and Oboe 1.11.0 (io), the VST3 SDK 3.8.1 (vst3), Freeverb and
  Dunne (effects), the sfizz fork with four audits (sampler), QuickJS-ng
  through gg_quickjs (script), each with `src/third_party/NOTICES.md`.
  Gaps: `scripts/check-notices.js` exists in core, midi, script and effects
  but not in io, vst3 and sampler, the three largest vendor trees;
  license-001 names `THIRD_PARTY_NOTICES.md` and is still "proposed" while
  the guide and the repos use `src/third_party/NOTICES.md`; no package
  registers its notices with Flutter's `LicenseRegistry`; `aud_audio_link`
  lacks `LICENSE-ABLETON-LINK.md`, the README notice and the build-time
  message link-002 requires while its description already claims the
  fetch; `aud_midi_linux/lib/src/alsa/alsa_bindings.g.dart:7-8` carries
  alsa-lib's LGPL-2.1+ declarations with its doxygen text and the repo has
  no `NOTICES.md` (apple and android have one); every `LICENSE` says "All
  Rights Reserved".
- **Naming.** `Aud` and `aud_` are applied consistently in the Dart, C++
  and C of the audio family (exceptions: the VST3 C++ classes and the
  sampler's internal types above); audmidi mixes three conventions.
- **Errors and logging.** No base exception in audaudio, `StateError` in
  aud_midi, no log sink in either family (`aud_midi_windows` alone depends
  on `logging`, `lib/src/shim/windows_midi_ffi_shim.dart:17`); losses in
  aud_midi become diagnostics, which is right.
- **Scripts.** `aud_midi_windows/tool/test_native_core.sh` is a bash
  script against the rule that all scripts are Node.js;
  `aud_audio_pm/scripts` holds two `.sh` files as well.
- **Platform coverage of audaudio:** Android, iOS, macOS and Windows are
  real for core, graph, io, sampler, script and the umbrella; Linux is the
  null device; the web is a stub (the factories throw
  `UnsupportedError('… web: S5')`, `aud_audio_graph/lib/src/
  aud_graph_factory_stub.dart:10-11`); the VST3 shell runs on macOS and
  Windows; `packages.jsonc` still lists linux for script and vst3.
- **Platform coverage of audmidi** (done: implemented and verified
  somewhere; partial: implemented, unverified or limited):

  | Feature | iOS | macOS | Android | Windows | Linux | Web |
  | --- | --- | --- | --- | --- | --- | --- |
  | OS ports and hot-plug | done | done | done (emulator) | partial (uncompiled) | partial (never run) | done |
  | Virtual ports | done | done | done (static) | partial (WMS only) | partial | missing |
  | BLE central | done (picker) | partial (no hardware) | partial | partial | partial (mocks) | missing |
  | BLE peripheral | missing | missing | missing | missing | missing | missing |
  | AppleMIDI session | done | done (localhost) | done (emulator) | partial (UDP loss, ticket 39) | partial | missing |
  | Network MIDI 2.0 | partial (no interop) | partial | partial | partial | partial | missing |
  | UMP native | done | done | done (API 33+) | partial (WMS) | partial | translation |
  | Endpoint and function-block info | missing | missing | partial | partial | partial | n/a |
  | Input timestamps | done | done | done | partial | partial | done |
  | OS-scheduled send | done | done | done | partial | partial | done |
  | Native tap | done | done | done | missing | missing | n/a |

- **Open decisions the review found:** the render-stage provider the
  sequencer needs (seq-001 wants it "on the callback thread before the
  graph", the graph has no such stage, `grep -i sequenc` over its sources
  finds only sequence numbers; an ABI extension next to
  `register_transport_provider`, `aud_abi.h:652-654`); the split between
  core and `aud_audio_osc` (osc-003); the fate of the graph's reference
  nodes; the 1.0 of the ABI and the shared or static engine (abi-001);
  license-001 and ui-003 still "proposed"; standard-001 of aud_midi_pm
  still "proposed"; the two network protocols at once (network-001); the
  naming of the audmidi backends.

## 9. The implementation plan

The 23 tickets derived from this review, their phases, sizes and
dependencies are in
[ticket 40](../../tickets/2026-10-25-40-review-the-architecture-of-audaudio-and-audmidi.md);
every ticket has a plan file in `tickets/` and a row in
[issues.md](../../../issues.md).

## Sources

- The five review reports of 2026-10-25 (agents of Claude Code over the
  checkouts in `.ocean`), spot-checked in the sources named above
- [architecture.md](../../architecture/architecture.md),
  [packages.jsonc](../../architecture/packages.jsonc), the decisions in
  [000-index.md](../decisions/000-index.md), the plan of
  [ticket 17](../../tickets/2026-10-07-17-audanika-audio-engine.md)
- `aud_midi_pm`: architecture.md, the decisions and the ticket plans
- https://audaudio.github.io, https://audmidi.github.io (404),
  https://pub.dev/packages/aud_midi, https://github.com/audaudio,
  https://github.com/audmidi
