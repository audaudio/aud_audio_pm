# plugin-006: The VST3 shell plays an app's graph document with the app's presets and the DAW's MIDI and transport

- Status: accepted
- Date: 2026-10-20
- Canonical source: tickets/2026-10-20-37-ship-audanika-as-a-mac-app-with-its-vst3-plugin.md
  (steps 6 to 8), `aud_audio_vst3/doc/plugin-bundle.md`
- Refines: [plugin-001](plugin-001.md), [plugin-002](plugin-002.md) — what
  S18 builds on macOS; [plugin-004](plugin-004.md) — applied to the node
  packages linked in
- Related: [plugin-005](plugin-005.md) — how the plugin reaches the DAWs;
  [app-009](app-009.md) — Audanika's document and presets
- Open work: sample-accurate automation (block-granular now, a 5 ms ramp);
  note expressions and MPE; Windows and Linux; a preset change sets the
  effect values without the app's 50 ms glide; the voice governor
  (ticket 34)

## Decision

`aud_audio_vst3` is a generic shell an app configures with three files
next to its binary - `plugin.json` (identity, node packages, content
locations, the parameters and controls the DAW sees), a graph document and
its presets - and builds with `scripts/build-plugin.js` from the app's
package config: the SDK, the graph and the named node packages are compiled
from their sources (recipes after their build hooks, the manifests of
build-001) into one binary that exports only the three VST3 entry points.
The presets are the DAW's program list and a stepped parameter; a preset
applies its node presets on the engine's control thread. The DAW's notes
and poly pressure, and through IMidiMapping its control changes, channel
pressure and pitch bend on 16 channels, reach the graph's event input at
their sample offsets; the reference node `aud.graph.channel_split` sends
each MIDI channel to its node. The DAW's tempo, time signature and position
drive the graph's transport; while the DAW stands, the transport runs on at
its tempo, so that tempo-synced modulation keeps moving under a live player.
A control sends its control change only once it moves. The state is JSON
with the preset id, the parameter values and the moved controls - never a
path or the document. Offline rendering waits for the instrument of a
preset. The content is found inside the .app that holds the plugin's
resolved bundle, or through the app's bundle id.

## Why

- req-mac-003 and req-mac-005: the plugin plays the app's presets from the
  DAW's MIDI and is built on the shell; nothing of VST3 lives in the app.
- One shell for every app of the family: the configuration and the
  document carry what makes the plugin an instrument.
- A free-running transport keeps the combis' scripted LFOs alive while the
  DAW is stopped, as they run in the app.
- A state without paths survives a moved app and another machine.
- Measured on the development Mac (ticket 37): the test host plays all 28
  presets offline, the VST3 validator passes 47 of 47 tests, REAPER finds
  the plugin through a link, renders, plays it live and restores its
  preset; a realtime block of 128 frames takes at most 0.03 ms.
