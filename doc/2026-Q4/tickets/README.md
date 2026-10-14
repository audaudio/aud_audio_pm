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
  — ticket 30 (planned): a faster voice loop with SIMD on ARM, and the
  audio thread on the big cores (step S9c)
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
