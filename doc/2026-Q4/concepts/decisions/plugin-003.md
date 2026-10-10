# plugin-003: The plugin editor is Flutter out of process on macOS and in the extension on iOS

- Status: proposed
- Date: 2026-10-09
- Canonical source: tickets/2026-10-09-24-spike-a-flutter-editor-for-the-plugin-shells.md
  (the spike S0-plugin-ui, its measurements and findings)
- Refines: [plugin-001](plugin-001.md) — settles its open UI work for
  macOS and iOS; Dart stays out of the DAW process, as plugin-001 says
- Open work: Windows and Linux (S18, with the spike's scripts); the frame
  copy on the GPU instead of the CPU, which an animated editor needs; the
  multi-view switch of Flutter until it is public; the embedding
  checklist by hand in REAPER and Live; notarization of the editor app
  inside the bundle; text input, IME and accessibility through the shared
  surface; the AUv3 memory with the sampler loaded (S20)

## Decision

On macOS the VST3 shell (S18) and the CLAP shell (S19) show an editor
built with Flutter and the family's UI packages that runs in a process of
its own: a release Flutter macOS app inside the plugin's bundle. The
plugin starts it when the host attaches the first view of a plugin build
in the DAW process; the app starts background-only and turns into an
accessory, so it never becomes the active app. One editor process serves
every open editor of that build, each as a view of one Flutter engine
(the spike's variant S). The editor renders each view into a pool of
IOSurfaces it shares with the plugin over Mach; the plugin's view shows
them as layer contents and forwards pointer, wheel, keys and focus. The
process stays warm for 10 s after its last view closes, and a crashed
editor restarts while a view is open. Plugin and editor talk over a Unix
domain socket: edits as `AudCommand`s in JSON, everything else (the
parameter list, gestures, values, meters, input, the view's place) as
messages of the shell's protocol; no shared-memory rings. The editor binds
the widgets of `aud_audio_ui_controls` through `AudParamBinding` to a sink
over that socket (ui-003).

Every plugin binary of the family exports only its entry points, builds
with hidden visibility and creates its Objective-C classes at run time
under names with a random suffix, so that plugins built against different
engine versions coexist in one DAW process.

On iOS the AUv3 extension (S20) shows its editor in process: the engines
of all open editors come from one `FlutterEngineGroup` per extension
process and start when a view first appears; the editor's sink writes the
`AUParameterTree`.

Flutter inside the DAW process on macOS (renamed frameworks) is rejected.
A native view stays the fallback where a host breaks the out-of-process
editor; the host's generic view serves until a shell has its editor.

## Why

The spike measured six variants at 48 kHz and 128 frames on an M5 Mac, in
REAPER and a test host, and the AUv3 on an iPad Pro M5, against the
budgets of ticket 23 (medians; REAPER unless marked):

| Budget | A: process per editor | S: one editor process | B: in the DAW process | C: native view |
| --- | --- | --- | --- | --- |
| First editor ≤ 150 MB | 130 MB | 130 MB | 90 MB | — |
| Each further editor ≤ 50 MB | 130 MB | 26–35 MB | 37–55 MB | — |
| UI to audio ≤ 10 ms and ≤ C + 2 ms | 1.62 ms | 1.84 ms | 1.72 ms | 1.39 ms |
| Audio to UI ≤ 33 ms | 7.0 ms | 7.2 ms | 8.0 ms | 1.3 ms |
| Open cold ≤ 500 ms, warm ≤ 150 ms | 289–370 ms, 11 ms | 272–377 ms, 11 ms | 53–116 ms | 12–22 ms |
| DAW growth over 100 cycles ≤ 5 MB | 2.0 MB | 2.2 MB | 8–25 MB | 3.2 MB |

- Out of process the editor costs the DAW nothing until it opens (16 KB
  for a closed editor), keeps Dart off every thread of the DAW, and a
  crash or a hang of the editor leaves the DAW running: a killed editor
  came back within a second, and a suspended one left the host's UI
  thread at 3 ms or less. The latency of the socket and the forwarded
  input is a quarter of a millisecond.
- One process per editor (A) misses the memory budget for further
  editors; one process per plugin build (S) meets it, but needs Flutter's
  multi-view, which 3.47 keeps private (`enableMultiView`). Should it stay
  private, the editor process falls back to one engine per editor, which
  costs about what B measured per engine (37–55 MB).
- In process (B) the latency is as good, but Dart runs on the DAW's main
  thread (platform and UI threads are merged in 3.47), starting an engine
  stalls the DAW's UI thread (85 ms in the median, up to 214 ms), the DAW
  grows 8–25 MB over 100 open and close cycles, closing an editor crashed
  REAPER three times inside Flutter's compositor until the plugin kept the
  engine for 200 ms after the view, and two builds coexist only through a
  binary patch of Flutter's names.
- The following window (F) needs no frame copy, but as a window of
  another process it fights the host over order, focus, minimizing and
  full screen, and the DAW grew 9 MB over the cycles.
- The shared surface costs CPU: the editor copies each frame on the CPU,
  6–8 % of a core for a meter at 30 Hz, about what the native view costs
  the DAW for its drawing. Flutter's own surfaces handed over, or a GPU
  blit, remove most of it.
- An editor process must never become the active app: REAPER, inactive
  with its transport stopped, closes its audio device. The editor starts
  background-only and turns into an accessory.
- On iOS there is no second process to own: the extension is one already,
  and the system shows its view in the host. One, two and four instances
  with editors stayed at 184, 193 and 214 MB (max 258) with the 100 MB
  ballast for 10 minutes each; Flutter's share was 69, 76 and 93 MB, the
  first frames came after 9 to 59 ms, and the extension was never
  terminated.
