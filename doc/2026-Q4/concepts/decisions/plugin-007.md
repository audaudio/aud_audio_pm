# plugin-007: The plugin hands its sandboxed editor a socket at start and shares frames under the app group's Mach names

- Status: accepted
- Date: 2026-10-20
- Canonical source: tickets/2026-10-20-37-ship-audanika-as-a-mac-app-with-its-vst3-plugin.md
  (gate and steps 9 to 11), `aud_audio_vst3/src/aud_vst3_editor.mm`
- Refines: [plugin-003](plugin-003.md) — variant S in a sandboxed app;
  [plugin-006](plugin-006.md) — the shell's editor
- Related: [plugin-005](plugin-005.md) — the plugin inside the Mac App
  Store app; [app-010](app-010.md) — what the Audanika editor sends
- Open work: App Review with the editor nested in the plugin (App Store
  Connect validated build 168 on 2026-10-20 and TestFlight took it without
  a warning, the editor without a provisioning profile); the fixes of the
  Cubase findings in a TestFlight build;
  the embedding checklist of plugin-003 in REAPER and Cubase (step 11); a
  reusable package for the editor runner, the input injector and the
  IOSurface bridge, now in the app

## Decision

The editor is a Flutter app the plugin's configuration names
(`plugin.json` `editor`), built by the app as a flavor of its own Mac
target and copied into the plugin's `Contents/Helpers`: background only,
signed with the App Sandbox and the app group of the app
(`SAZSC68S46.com.audanika`). One editor process serves every instance of a
plugin build in the DAW process, one Flutter view per instance; it stays
warm 10 s after its last view closed and is restarted, at most every 2 s
and five times in a row, while a view is open.

The plugin starts it with `posix_spawn` and one end of a socket pair as
file descriptor 3 (`--fd 3 --token <hex> --instance <n> --mach <name>`);
the shell protocol (version 2, a 4-byte length and JSON) runs over it. The
editor's frames reach the plugin as IOSurfaces sent over Mach to a name the
plugin checks in with the app group as prefix,
`<appGroup>.vst3.<pid>.<random>` (plugin.json `appGroup`). No file, no
socket path and no unprefixed Mach name is involved. Dart reads and writes
the inherited socket through FFI in an isolate of its own
(`AudShellFd`), since `dart:io` opens no socket by its descriptor. Plugin
and editor log to the unified log; `AUD_VST3_LOG=<file>` collects both in a
test.

What keeps the editor drawing in a DAW (the Cubase findings of ticket 37):

- The plugin pauses the editor only while its window is invisible,
  minimized or on another Space - not when macOS reports it occluded - and
  sends any change of position, size or scale within 0.1 s, also without
  `onSize`. A covered view still draws when its surface changes, which a
  still surface does not; plugin-003's "a covered window costs nothing"
  gives way.
- The editor's engine does not follow the app's occlusion, hide and
  unhide: Flutter takes an app whose windows are all occluded for hidden
  and draws no frame, and the editor's transparent windows always are.
- The editor takes a surface of its pool only when the plugin handed it
  back and no process keeps it in use; one kept in use 100 ms after the
  release is replaced, and with none handed back for 0.5 s the pool is
  renewed.
- A place that arrives while a window takes a new frame is applied after
  it: FlutterView runs the platform's messages while it waits for a frame
  of the new size, and nested frame changes abort AppKit.
- The plugin follows the notes the editor holds and ends them, in the
  graph and towards the DAW, when the editor ends or crashes.

## Why

- req-mac-002 and plugin-005: the editor ships inside the sandboxed store
  app, and a sandboxed helper started by an unsandboxed DAW runs in a
  sandbox of its own.
- The probe of the gate: such a helper looks up a Mach name with the app
  group's prefix (0) but not one without it (1100, not privileged), and
  reads and writes a socket it inherited; a Unix socket under a path would
  need a file both sides may reach.
- `dart:io` fails on `/dev/fd/3` for a socket (ENOENT), unlike C; the FFI
  reader keeps the editor's transport in Dart.
- Measured with the test host (`scripts/host.js --editor`): the Audanika
  editor's first frame arrives 0.33 s after the view is attached (0.65 s
  on a cold start), in Impeller's 10-bit extended range format (`w40a`),
  and a click into the view comes back as notes on the plugin's event
  output.
- Cubase 15 (2026-10-20): the editor stood still after a while, crashed on
  a live resize and paused in full screen mode until each of the rules
  above was in place; the test host reproduces every case
  (`--hold-surfaces`, `--resize-steps`, `--reframe`, `--occlude`,
  `--kill-editor`). With them, a Cubase session of 24 minutes with full
  screen, resizing and Hold kept one editor process, which sent 2834
  frames without a pause, a replaced surface or a renewal.
