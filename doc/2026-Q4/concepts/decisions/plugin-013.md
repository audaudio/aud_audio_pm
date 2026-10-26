# plugin-013: The AUv3 editor talks to its unit through dart:ffi

- Status: accepted
- Date: 2026-10-25
- Canonical source: Gabriel Gatzsche's request in ticket 64 on 2026-10-25
  ("Can you do the communication between Editor and Core using dart ffi
  and not a basic message channel?"),
  tickets/2026-10-25-64-ship-audanika-as-auv3.md (steps 5 and 6),
  `aud_audio_auv3/src/aud_auv3_editor_api.h`
- Supersedes: the transport of [plugin-012](plugin-012.md) - a platform
  channel; the rest of plugin-012 holds
- Related: [plugin-007](plugin-007.md) - the VST3 editor's socket;
  [app-010](app-010.md) - what the editor sends
- Open work: none

## Decision

The editor inside the AUv3 extension and its unit share the extension's
process, so the messages of the shell protocol travel by function call.
The extension's binary exports four C functions -
`aud_auv3_editor_connect`, `_send`, `_disconnect` and `_free` - which the
editor's Dart code finds with `DynamicLibrary.process()`. The view
controller starts each editor with the argument `--aud-auv3-instance=<n>`
of its bridge; the editor connects with it and a `NativeCallable.listener`,
which any thread may call. Both directions carry the protocol's JSON
(`AudShellMessage`), so an editor's code is the same for the VST3 over its
socket and the AUv3 in process. `AudAuv3Shell` of `aud_audio_auv3` is the
editor's end, pure Dart with `ffi`.

## Why

- The user's request.
- No platform channel and no Flutter plugin in the extension: the bridge
  works before and beyond the plugins an extension may register, and
  `aud_audio_auv3` keeps no Flutter dependency.
- One protocol for both shells (plugin-012).
- Measured in ticket 64: the example's editor says hello 58 ms after it
  starts on macOS, through the test host that loads the unit out of
  process.
