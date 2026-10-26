# plugin-012: The AUv3 editor is the app's Flutter UI inside the extension, on macOS as on iOS

- Status: accepted (the gate of ticket 64, step 4, 2026-10-25)
- Date: 2026-10-25
- Canonical source: tickets/2026-10-25-64-ship-audanika-as-auv3.md
  (concept "Editor")
- Refines: [plugin-003](plugin-003.md) — its iOS way, now also for the
  macOS AUv3; [app-010](app-010.md) — the editor's sound engine
- Related: [plugin-011](plugin-011.md) — the extension;
  [plugin-007](plugin-007.md) — the VST3's editor out of process
- Superseded in part by [plugin-013](plugin-013.md): the editor talks to
  its unit through dart:ffi, not a platform channel
- Open work: the Flutter plugins an extension may register; the memory of
  the editors on the iPhone

## Decision

An AUv3 already runs in a process of its own: always on iOS, and on macOS
as no `AudioComponentBundle` is shipped (plugin-011). So its editor runs
Flutter inside the extension on both platforms: the extension's
`AUViewController` shows a view of the app's own Dart code, started from
an entry point in the app's `App.framework`, in the profile
`pluginEditor` (app-010). On iOS one Flutter engine group per extension
process, each instance's editor a view of it; on macOS one engine per
view. The editor speaks the shell
protocol of the VST3 editor, carried in process over a platform channel
instead of an inherited socket, so `ShellSoundEngine` gains a second
transport. The extension registers only the Flutter plugins the editor
needs, none that touches `UIApplication`. The bought albums come from the
app group's defaults, which the iOS app writes too.

The App Sandbox lets the extension load the Flutter engine from the
containing app's `Frameworks`, but not read the app's resources: the Dart
bundle (`App.framework`) travels inside the extension, and so does the
content the unit plays. On macOS a Flutter engine runs only once its view
controller exists.

## Why

- req-auv3-003: Audanika's play surface as the editor on both platforms.
- The VST3's helper process exists to keep Dart out of the DAW's process
  (plugin-003); the extension is that process already.
- One protocol and one editor code base for VST3 and AUv3.
- The spike measured Flutter in an iOS extension at 69 to 93 MB for one to
  four editors (plugin-003).
- The gate of ticket 64: on macOS a test host loading the unit out of
  process as Logic Pro does opened the editor, which drew 62 frames in its
  first second and reached the unit 60 ms after the view appeared; on the
  iPad Pro M5 one, two and four instances with the app's sampler, presets
  and editors ran at 122, 130 and 220 MB, each editor drawing 121 frames
  in its first second, none terminated.
