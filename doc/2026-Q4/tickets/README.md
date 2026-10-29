# Tickets

One plan file per ticket, e.g. 2026-10-07-17-audanika-audio-engine.md.

- [2026-10-07-17-audanika-audio-engine.md](2026-10-07-17-audanika-audio-engine.md)
  — ticket 17: concept, decisions and ticket split of the Audanika Audio
  Engine
- [2026-10-08-2-create-the-repos.md](2026-10-08-2-create-the-repos.md)
  — ticket 2: create the repos of the family (step S00)
- [2026-10-08-5-spike-the-mobile-foundation.md](2026-10-08-5-spike-the-mobile-foundation.md)
  — ticket 5: the mobile spike gate S0-mobile
- [2026-10-08-18-define-the-core-contracts.md](2026-10-08-18-define-the-core-contracts.md)
  — ticket 18: the core contracts of `aud_audio_core` (step S1) and the
  repair of the docs site
- [2026-10-08-19-build-the-audio-graph.md](2026-10-08-19-build-the-audio-graph.md)
  — ticket 19: the audio graph engine of `aud_audio_graph` (step S2)
- [2026-10-08-20-add-the-headless-host.md](2026-10-08-20-add-the-headless-host.md)
  — ticket 20: the headless host, the stress tests and the watchdog of
  `aud_audio_graph` (step S2b)
- [2026-10-09-21-build-the-audio-io-for-ios-and-android.md](2026-10-09-21-build-the-audio-io-for-ios-and-android.md)
  — ticket 21: the audio IO of `aud_audio_io` for iOS and Android (step
  S3)
- [2026-10-09-22-build-the-aud-audio-engine.md](2026-10-09-22-build-the-aud-audio-engine.md)
  — ticket 22: the engine `AudEngine` of the umbrella `aud_audio` for iOS
  and Android (step S4)
- [2026-10-09-23-plan-the-spike-for-a-flutter-ui-in-plugin-shells.md](2026-10-09-23-plan-the-spike-for-a-flutter-ui-in-plugin-shells.md)
  — ticket 23: the plan of the spike S0-plugin-ui, a Flutter editor in the
  plugin shells
- [2026-10-09-24-spike-a-flutter-editor-for-the-plugin-shells.md](2026-10-09-24-spike-a-flutter-editor-for-the-plugin-shells.md)
  — ticket 24: the spike S0-plugin-ui, a Flutter editor in the plugin
  shells on macOS and iOS
- [2026-10-11-25-build-the-sfz-sampler-on-sfizz-for-ios-and-android.md](2026-10-11-25-build-the-sfz-sampler-on-sfizz-for-ios-and-android.md)
  — ticket 25: the SFZ sampler on sfizz for iOS and Android (step S9)
- [2026-10-12-26-bridge-aud-midi-ports-into-the-engine-on-ios-and-android.md](2026-10-12-26-bridge-aud-midi-ports-into-the-engine-on-ios-and-android.md)
  — ticket 26: the aud_midi ports as event inlets and outlets of the engine
  on iOS and Android (step S8)
- [2026-10-12-27-play-an-sfz-instrument-from-audanika-app-on-the-new-engine.md](2026-10-12-27-play-an-sfz-instrument-from-audanika-app-on-the-new-engine.md)
  — ticket 27: audanika_app plays its sounds as SFZ on the new engine on
  iOS and Android (step S29a)
- [2026-10-13-28-build-reverb-delay-and-a-master-limiter.md](2026-10-13-28-build-reverb-delay-and-a-master-limiter.md)
  — ticket 28: reverbs, delays and a master limiter in `aud_dsp_effects`,
  and the master chain of the Audanika app on iOS and Android (step S10a)
- [2026-10-13-29-limit-the-voices-by-the-cpu-power-of-the-device.md](2026-10-13-29-limit-the-voices-by-the-cpu-power-of-the-device.md)
  — ticket 29 (planned): a voice budget per device that follows the load,
  so that playing hard never drops out (step S9b)
- [2026-10-13-30-render-the-sampler-voices-faster-on-the-big-cores.md](2026-10-13-30-render-the-sampler-voices-faster-on-the-big-cores.md)
  — ticket 30: a faster voice loop that renders bit for bit, and the
  audio thread on the big cores of Android (step S9c)
- [2026-10-14-31-port-soundprism-js-lfo-presets.md](2026-10-14-31-port-soundprism-js-lfo-presets.md)
  — ticket 31 (planned): the combis of SoundPrism Link Edition in the
  Audanika app, their JavaScript LFOs in an optional script package (step
  S29c)
- [2026-10-14-32-share-sample-sets-between-sfz-presets.md](2026-10-14-32-share-sample-sets-between-sfz-presets.md)
  — ticket 32 (planned): presets include the regions and loop points of
  their sample set instead of copying them (step S29d)
- [2026-10-14-33-add-a-tempo-control-to-the-app.md](2026-10-14-33-add-a-tempo-control-to-the-app.md)
  — ticket 33 (planned): a tempo control that the scripted combis and the
  master delay follow (step S29e)
- [2026-10-15-34-move-voice-stealing-and-the-governor-into-aud-audio-voice-allocator.md](2026-10-15-34-move-voice-stealing-and-the-governor-into-aud-audio-voice-allocator.md)
  — ticket 34 (planned): the voice stealing and the load governor in
  `aud_audio_voice_allocator`, which hooks into the instrument nodes
  (step S9d)
- [2026-10-20-37-ship-audanika-as-a-mac-app-with-its-vst3-plugin.md](2026-10-20-37-ship-audanika-as-a-mac-app-with-its-vst3-plugin.md)
  — ticket 37 (planned): the Audanika app on the Mac through TestFlight and
  the Mac App Store, with its VST3 plugin inside (the macOS parts of S18
  and S3b)
- [2026-10-22-38-make-all-repos-run-on-windows.md](2026-10-22-38-make-all-repos-run-on-windows.md)
  — ticket 38: the repos build and test on Windows, and the Audanika app
  plays through the Windows audio device of `aud_audio_io` (the Windows
  part of S3b)
- [2026-10-22-39-stop-udp-loss-of-dart-processes-on-windows.md](2026-10-22-39-stop-udp-loss-of-dart-processes-on-windows.md)
  — ticket 39 (planned): every UDP datagram of `aud_midi_network` arrives
  on Windows, where a Dart process lost most of them (follow-up of ticket
  38)
- [2026-10-25-40-review-the-architecture-of-audaudio-and-audmidi.md](2026-10-25-40-review-the-architecture-of-audaudio-and-audmidi.md)
  — ticket 40: the review of the architecture of both families and the
  plan of the 23 tickets derived from it
- [2026-10-25-41-retire-the-template-api-of-the-stub-packages.md](2026-10-25-41-retire-the-template-api-of-the-stub-packages.md)
  — ticket 41 (proposed): the 18 stubs and the bench app lose their
  template API and say "planned"
- [2026-10-25-42-documentation-hygiene-of-the-audaudio-repos.md](2026-10-25-42-documentation-hygiene-of-the-audaudio-repos.md)
  — ticket 42 (proposed): READMEs by concept, changelogs, index mirror,
  pubspec fields, the dartdoc lint
- [2026-10-25-43-notices-and-licenses-in-every-repo.md](2026-10-25-43-notices-and-licenses-in-every-repo.md)
  — ticket 43 (proposed): the notices check in the DNA layer, the Link
  license files, the LICENSE wording
- [2026-10-25-44-ci-platform-matrix-for-both-families.md](2026-10-25-44-ci-platform-matrix-for-both-families.md)
  — ticket 44 (proposed): macOS, Windows, Linux, Android and web jobs
  with the sanitizers and the validator (step S22)
- [2026-10-25-45-node-kit-and-ffi-helper-in-the-core.md](2026-10-25-45-node-kit-and-ffi-helper-in-the-core.md)
  — ticket 45 (proposed): the effects' node kit and the Dart FFI
  boilerplate move into the core
- [2026-10-25-46-generate-the-nodes-from-their-descriptors.md](2026-10-25-46-generate-the-nodes-from-their-descriptors.md)
  — ticket 46 (proposed): one JSON descriptor per node generates the C,
  the Dart and the README; typed parameter ids; ABI 0.5
- [2026-10-25-47-graph-housekeeping-dsp-out-runtime-handle-facets.md](2026-10-25-47-graph-housekeeping-dsp-out-runtime-handle-facets.md)
  — ticket 47 (proposed): oscillator and filter into the effects, a
  runtime handle for the process state, facets of `AudGraph` (step S10b)
- [2026-10-25-48-shared-native-and-test-utilities.md](2026-10-25-48-shared-native-and-test-utilities.md)
  — ticket 48 (proposed): the semaphore, the harness, the scripts and the
  hook helper exist once; testing libraries
- [2026-10-25-49-engine-input-multi-channel-streams-and-a-curated-umbrella.md](2026-10-25-49-engine-input-multi-channel-streams-and-a-curated-umbrella.md)
  — ticket 49 (proposed): input and duplex in `AudEngine`, more than two
  channels, `addPackage`, curated exports, the Linux error
- [2026-10-25-50-error-model-logging-and-the-small-api-fixes.md](2026-10-25-50-error-model-logging-and-the-small-api-fixes.md)
  — ticket 50 (proposed): one exception base and code ranges, a log sink,
  finalizers, the small findings of the review
- [2026-10-25-51-midi-bridge-and-the-aud-midi-tap-and-time-interface.md](2026-10-25-51-midi-bridge-and-the-aud-midi-tap-and-time-interface.md)
  — ticket 51 (proposed): one tap header, the host-time conversion in
  `aud_midi`, the typed adapter of the bridge (step S8)
- [2026-10-25-52-osc-the-split-decision-one-notification-type-the-server.md](2026-10-25-52-osc-the-split-decision-one-notification-type-the-server.md)
  — ticket 52 (proposed): what the core holds of OSC and what
  `aud_audio_osc` adds; one notification type; the server (step S7)
- [2026-10-25-53-sequencer-render-stage-in-the-abi.md](2026-10-25-53-sequencer-render-stage-in-the-abi.md)
  — ticket 53 (proposed): the render-stage provider the sequencer needs,
  in the ABI bump of ticket 46 (before S14)
- [2026-10-25-54-controls-on-the-core-model-and-aud-audio-ui-bindings.md](2026-10-25-54-controls-on-the-core-model-and-aud-audio-ui-bindings.md)
  — ticket 54 (proposed): the controls on the core's descriptors and
  addresses, the binding package of ui-003 (step S17a)
- [2026-10-25-55-plugin-shell-core-and-node-build-manifests.md](2026-10-25-55-plugin-shell-core-and-node-build-manifests.md)
  — ticket 55 (proposed): the node packages publish build manifests and
  the rest of the shell core joins `aud_audio_plugin`, which ticket 64
  created (steps S18 to S20)
- [2026-10-25-56-bench-app-with-json-export.md](2026-10-25-56-bench-app-with-json-export.md)
  — ticket 56 (proposed): the bench app from the umbrella's measurement
  pages, JSON per device for the site (step S24)
- [2026-10-25-57-docs-site-foundation.md](2026-10-25-57-docs-site-foundation.md)
  — ticket 57 (proposed): the site repo repaired, getting started, the
  ecosystem page, `/api/` (step S21)
- [2026-10-25-58-docs-site-content-from-the-repos.md](2026-10-25-58-docs-site-content-from-the-repos.md)
  — ticket 58 (proposed): package pages synced from the repos, real Dart
  snippet tests, cookbook, benchmark and licensing pages (step S21)
- [2026-10-25-59-aud-midi-windows-and-aud-midi-linux-the-first-real-runs.md](2026-10-25-59-aud-midi-windows-and-aud-midi-linux-the-first-real-runs.md)
  — ticket 59 (proposed): the two MIDI backends that never ran do run;
  ticket 39 on the way
- [2026-10-25-60-aud-midi-core-contract-suite-capability-fix-one-clock.md](2026-10-25-60-aud-midi-core-contract-suite-capability-fix-one-clock.md)
  — ticket 60 (proposed): a contract suite every backend runs, the
  capability merge bug, one native clock
- [2026-10-25-61-aud-midi-api-consistency.md](2026-10-25-61-aud-midi-api-consistency.md)
  — ticket 61 (proposed): the naming decision, trimmed exports, both
  network protocols at once, typed backend keys
- [2026-10-25-62-audmidi-publication-and-readme-consistency.md](2026-10-25-62-audmidi-publication-and-readme-consistency.md)
  — ticket 62 (proposed): `platforms:` and `documentation:` on pub.dev,
  READMEs that install from pub.dev, the feature matrix
- [2026-10-25-63-audmidi-github-io.md](2026-10-25-63-audmidi-github-io.md)
  — ticket 63 (proposed): the docs site of the audmidi family from the
  audio site's template
- [2026-10-25-64-ship-audanika-as-auv3.md](2026-10-25-64-ship-audanika-as-auv3.md)
  — ticket 64 (implemented): the Audanika app carries an AUv3 on macOS and
  iOS, built on `aud_audio_auv3` and the shared shell core
  `aud_audio_plugin` (S20)
- [2026-10-25-65-finish-the-auv3-for-the-stores.md](2026-10-25-65-finish-the-auv3-for-the-stores.md)
  — ticket 65 (planned): the AUv3's bought albums, the iPhone's
  footprint, the hosts by hand and the release lanes (S20b)
- [2026-10-29-decouple_aud_audio_with_midi-move-the-midi-demo-to-aud-audio-midi.md](2026-10-29-decouple_aud_audio_with_midi-move-the-midi-demo-to-aud-audio-midi.md)
  — ticket decouple_aud_audio_with_midi (implemented): the MIDI demo moves from
  the example of `aud_audio` to a new example of `aud_audio_with_midi`, both
  examples join the pub workspace of their package
- [2026-10-29-rename-aud-audio-midi-to-aud-audio-with-midi.md](2026-10-29-rename-aud-audio-midi-to-aud-audio-with-midi.md)
  — follow-up (proposed): rename `aud_audio_with_midi` to `aud_audio_with_midi`
- [2026-10-29-placeholder-app-ids-in-every-example.md](2026-10-29-placeholder-app-ids-in-every-example.md)
  — follow-up (proposed): `com.example.<app>` instead of the organization's
  IDs in every example app
- [2026-10-29-move-the-example-keyboard-to-aud-audio-ui-keyboard.md](2026-10-29-move-the-example-keyboard-to-aud-audio-ui-keyboard.md)
  — follow-up (proposed): the on-screen keyboard of the examples becomes
  the first widget of `aud_audio_ui_keyboard`, a first part of S17b
