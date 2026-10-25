# 55: Plugin shell core and node build manifests

Status: proposed 2026-10-25 by the review of ticket 40
([review](../concepts/topics/review-2026-10-25-architecture.md), sections
4 and 5); awaits the user's confirmation. Phase 5 of the plan; size L;
steps S18 to S20 of ticket 17; depends on tickets 46 and 48.

## Goal

The three plugin shells share one core instead of copying the VST3
shell. A new package `aud_audio_plugin` takes what is format-neutral in
`aud_audio_vst3`: the editor protocol (`aud_shell_*.dart`), the control
thread with its parameter ring, the settings, state and bundle code, the
host transport, the MIDI translation, the socket, the semaphore (now from
the core, ticket 48), the UI thread and the native harness — with `Aud`
prefixes on the C++ classes that lack them (`Plugin`, `Engine`,
`SocketServer`, `Settings`), JSON schemas for `plugin.json`,
`presets.json` and the state that the app's export test (app-009) can
check against, a platform-neutral input contract (key ids, top-left
coordinates, a cursor enum, typed settings) in place of macOS key codes
and AppKit coordinates, and a protocol version the welcome message
checks. `aud_audio_vst3` keeps the plugin, the parameters, the factory and
the editor views. Every node package publishes a build manifest — sources,
includes, defines, notices, as sfizz's `SOURCES.txt` and `INCLUDES.txt`
already do and web-001 wants for the web — and `build-plugin.js` reads
it instead of hard-coding three packages' recipes. The AUv3 spike then
becomes the shell of S20 on the core, with the extension in `src/`
instead of the example, without its copies of the engine and the
parameter id; S19 builds CLAP on it. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) (R23).

## Requirements

No accepted requirement covers it yet; the area
[framework](../../requirements/framework.md) of 2026-10-25 does not.
Engineer its requirements before the ticket is planned.

## Affected repos

- `aud_audio_plugin` (new repo): the shell core; `packages.jsonc` and the
  graph gain it.
- `aud_audio_vst3`: the format-neutral code out, the manifests in,
  `build-plugin.js` generic; the Audanika plugin rebuilt and validated on
  macOS and Windows; minor version.
- `aud_dsp_sampler`, `aud_dsp_effects`, `aud_audio_script`: the build
  manifest next to the hook, checked by a test against the hook's
  sources; patch versions.
- `aud_audio_auv3`: on the core, S20 planned in its own ticket;
  `aud_audio_clap`: S19 likewise.
- `aud_audio_pm`: decisions `plugin-010` (the shell core) and `build-003`
  (the manifests); the architecture section "Plugin shells".

## Steps

1. The decisions and the manifest format.
2. The manifests in the three node packages; `build-plugin.js` reads them
   while still inside vst3.
3. The shell core repo; the code moved with its tests; vst3 on it; the
   validator and the test host green on macOS and Windows.
4. The protocol made platform-neutral; the editor of the app follows in
   its own ticket.
5. The schemas; the app's export test uses them.

## Open questions

- Does the editor runner of plugin-007 (one editor process per DAW
  process) belong to the core or stay per format? Proposal: the core.
- Name: `aud_audio_plugin` or `aud_audio_shell`?
