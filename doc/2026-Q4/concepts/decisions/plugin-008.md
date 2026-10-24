# plugin-008: On Windows the shell is a DLL next to the app, reached through a junction

- Status: accepted
- Date: 2026-10-24
- Canonical source: tickets/2026-10-22-38-make-all-repos-run-on-windows.md
  (part 2, steps 2 to 5), `aud_audio_vst3/scripts/build-plugin.js`,
  `aud_audio_vst3/src/aud_vst3_bundle_win.cpp`
- Refines: [plugin-006](plugin-006.md) — the shell on Windows;
  [plugin-004](plugin-004.md) — the exports of a DLL
- Related: [plugin-005](plugin-005.md) — the plugin inside the Mac app;
  [plugin-009](plugin-009.md) — the editor on Windows;
  [release-005](release-005.md) — macOS first
- Open work: an installer or the Microsoft Store, and code signing, when
  the Windows app ships; Windows on ARM

## Decision

The shell builds on Windows from the same script and sources as on macOS:
the clang++ and lld-link of Visual Studio make an x86-64 DLL against the
static C++ runtime, so that a DAW's machine needs no runtime of Visual
Studio. The bundle has the VST3 layout of Windows,
`<Name>.vst3\Contents\x86_64-win\<Name>.vst3` and `Contents\Resources`
with `moduleinfo.json`, `aud_plugin\` and the notices. The build checks
that the DLL exports only `GetPluginFactory`, `InitDll` and `ExitDll`;
the engine and its packages are compiled with `AUD_EXPORT` empty.

An app builds the plugin into its own folder, next to its executable and
its content (`Audanika.exe`, `content\sfz`, `Audanika.vst3`), and a
directory junction in a VST3 folder makes it visible to the DAWs. The
plugin resolves the junction (`GetFinalPathNameByHandleW`) and finds its
content through the location `containing-folder:<path>` of `plugin.json`,
the folder that holds the bundle. The user's folder
`%LOCALAPPDATA%\Programs\Common\VST3` needs no administrator rights, and
REAPER 7.82 and Cubase 15 scan it.

The shell keeps one source per platform where the systems differ, behind
small seams: the semaphores of the engine's control thread
(`aud_vst3_sync`), the UI thread (`aud_vst3_ui_thread`: the main queue on
macOS, on Windows a message-only window the first instance creates on the
DAW's UI thread and the last destroys after running the tasks still
waiting), the bundle (`aud_vst3_bundle.cpp` shared,
`aud_vst3_bundle_mac.mm` and `aud_vst3_bundle_win.cpp`: the module's path,
links, the system's log - `OutputDebugStringW` on Windows), the SDK's
`dllmain.cpp` instead of `macmain.cpp`, and the socket on Winsock
`AF_UNIX`. The vendored SDK subset carries the Windows sources;
`build-plugin.js`, `validate.js`, `test-native.js` and `reaper-test.js`
run on both platforms.

## Why

- req-windows-002: the plugin plays the app's presets on Windows, built
  with `aud_audio_vst3` into the folder of the Windows app (the user's
  choice of 2026-10-24: the content once, in the app's folder, linked).
- A junction is the Windows counterpart of the Mac app's link: the plugin
  stays with the app and its content, and a new build of the app updates
  it.
- Without the static runtime the DLL would depend on the
  `vcruntime`/`msvcp` of the DAW's machine; with `AUD_EXPORT` the engine's
  C API would leave the DLL, which plugin-004 forbids although Windows
  binds each DLL's calls itself.
- Measured on the development PC (ticket 38): the example plugin and
  Audanika pass the SDK validator 47 of 47; REAPER lists "VST3i: Audanika
  (Audanika)" from the user's folder and renders all 28 presets offline,
  plays live and reopens a saved project with its preset; Cubase 15 lists
  and plays it.
