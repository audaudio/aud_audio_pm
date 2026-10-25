# plugin-010: The format-agnostic core of the plugin shells lives in aud_audio_plugin

- Status: accepted
- Date: 2026-10-25
- Canonical source: Gabriel Gatzsche's choice at the planning of ticket 41
  on 2026-10-25 ("Shared core now"),
  tickets/2026-10-25-41-ship-audanika-as-auv3.md
- Refines: [family-001](family-001.md) — one repo per package; a new
  package of the family; [plugin-006](plugin-006.md) — the shell an app
  configures, now shared by the formats
- Related: [plugin-011](plugin-011.md) — the AUv3 built on it
- Open work: the move itself (ticket 41, steps 2 and 3); CLAP (S19) on it

## Decision

The code of `aud_audio_vst3` that knows nothing of VST3 moves into the new
package `aud_audio_plugin` (repo `audaudio/aud_audio_plugin`): the engine
over the headless host with node packages, presets and offline waits;
`plugin.json`, presets and the shell state; the package recipes and the
generator of the build tool (build-001); the host transport; the MIDI
event builders; the content lookup; the messages of the shell protocol in
C++ and Dart. `aud_audio_vst3`, `aud_audio_auv3` and later
`aud_audio_clap` build on it and keep only their format: the component,
its parameters and factory, the editor's transport and the format's tests.

## Why

- The AUv3 needs all of that code (req-auv3-004); a copy would drift, and
  a dependency of `aud_audio_auv3` on `aud_audio_vst3` would blur the scope
  of both.
- The configuration, the document and the presets make an app's plugin;
  one parser and one engine keep the formats sounding alike.
