# plugin-009: On Windows the editor is the app itself, a child window of the plugin's view in a process of its own

- Status: accepted
- Date: 2026-10-24
- Canonical source: tickets/2026-10-22-38-make-all-repos-run-on-windows.md
  (part 2, steps 6 to 8), `aud_audio_vst3/src/aud_vst3_editor_win.cpp`,
  `audanika_app/windows/runner/plugin_editor_window.h`
- Refines: [plugin-003](plugin-003.md) — the editor process on Windows;
  [plugin-007](plugin-007.md) — its channel without a sandbox
- Related: [plugin-008](plugin-008.md) — the shell on Windows;
  [app-010](app-010.md) — what the Audanika editor sends
- Open work: one editor process for all views, once the Windows embedder
  of Flutter offers several views in one engine; a warm editor between
  two opens of a view

## Decision

The editor is the executable `plugin.json` names as `editor`, as a
location of plugin-008 (`containing-folder:audanika.exe`): the app itself.
The plugin starts it for every open view with `--plugin-editor --socket
<path> --token <hex> --instance <n> --parent <window>`, in a job object
that ends it with the DAW and without any handle of the DAW. The app's
runner then runs the Dart entry point `pluginEditorMain` instead of
`main` and makes its Flutter view a child of the plugin's view, a child
window of the DAW's window in the DAW's process. Windows lets a window be
the child of a window of another process, so input, focus, cursor and
scaling are those of Windows: no frames are copied and no input is
forwarded, as plugin-003 needs on macOS.

The channel is the shell protocol of plugin-007 over a Unix domain socket
in `%TEMP%` with a random name, which the plugin listens on (Winsock
`AF_UNIX`) and the editor reaches with `AudShellClient.connect`; the token
authenticates it. The editor fills the plugin's window on every place and
quits when the socket ends or the window is gone. The plugin starts a
crashed editor of an open view again, at most every 2 s and five times in
a row without a hello, and ends the notes the editor held. One process
serves one view: the Windows embedder of Flutter gives an engine one view.

## Why

- req-windows-003: the plugin's editor on Windows is Audanika's play
  surface with its sound selection.
- Windows hands a process no socket pair as a file descriptor, and no
  sandbox keeps the editor from a socket file, so the spike's socket of
  ticket 24 serves; `dart:io` reaches a Unix domain socket on Windows.
- The app as editor needs no second Flutter build in the app's folder:
  the same AOT snapshot holds both entry points.
- Measured on the development PC (ticket 38): the editor starts in about
  1 s and says hello (once over 10 s on the first start after a build,
  when Windows scanned the new libraries); the user played it in Cubase 15
  and REAPER.
