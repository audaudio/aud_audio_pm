# 23: S0-plugin-ui — Plan the spike for a Flutter UI in plugin shells

Status: planned 2026-10-09. Plan only: the spike itself is a later ticket
with its own number from `doc/issues.md`.

## Goal

Plan the spike S0-plugin-ui of the plan of ticket 17
([2026-10-07-17-audanika-audio-engine.md](2026-10-07-17-audanika-audio-engine.md)).
The spike answers open question 1 of ticket 17 (native view, Flutter in a
separate process, or no UI) and the open UI work of
[plugin-001](../concepts/decisions/plugin-001.md) for macOS and iOS;
Windows follows in S18. It shows whether the plugin shells S18 to S20
can carry an editor built from the family's Flutter UI packages,
embedded in the host's plugin window, with no Dart in the DAW process.
Until the spike decides, the shells ship parameters only, with the
host's generic view. The result is a decision record. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md).

## Scope of the spike

1. **The plugin.** A minimal VST3 (SDK 3.8, MIT) for macOS over the
   headless host of ticket 20 (`aud_host_*`, plugin-002). It loads one
   graph document with the reference nodes of S2 (oscillator → filter →
   gain), exposes their parameters as VST3 parameters under the stable
   ids, and renders through `aud_host_render`. It passes the VST3
   validator. It depends on S2b, not on S4: neither `aud_audio_io` nor
   the umbrella is part of the plugin.
2. **The editor in a separate process.** flutter_vst3 runs its Flutter
   part in a separate process too. On `IPlugView::attached` the plugin
   starts a Flutter macOS app, or wakes one that runs, and hands it the
   path of a Unix domain socket and a token (decision 3). The editor shows
   controls of `aud_audio_ui_controls`, bound through `ParamBinding`; the
   spike builds this first slice of S17a in the package itself (decision
   5). The binding's parameter sink sends `AudCommand`s as JSON over the
   socket. The plugin turns them into `beginEdit`, `performEdit` and
   `endEdit`, so the host records automation. It sends host automation,
   meter levels and the graph document back. A document change from the
   editor reaches the headless host on the plugin's control thread, never
   on the render thread (interop-001).
3. **The first slice of S17a** in `aud_audio_ui_controls`: the `Control`
   primitive, `ArcKnob` and `ParamBinding` over an abstract parameter
   sink (value, gesture begin and end). The widgets and the sink stay
   free of the umbrella, so an editor does not build the graph, the
   audio IO or `jni`; the adapter to `AudEngine` sits apart (open
   question 4). The editor uses the package unchanged; S17a completes
   it.
4. **Embedding** in the host's editor window on macOS. macOS has no
   public API that shows a view of another process inside the host's
   `NSView`. First choice: the editor renders into IOSurfaces, the
   plugin's view shows them as layer contents, and the plugin forwards
   mouse, wheel, keyboard and focus over the socket. For comparison: a
   borderless editor window that follows the editor rectangle. Windows
   and Linux are out of scope; S18 decides them.
5. **Comparisons**, with the same plugin and the same measurements:
   - (A) Flutter in a separate process, as above: the candidate.
   - (B) Flutter in the DAW process with a renamed framework. The plugin
     loads its own copy of `FlutterMacOS.framework` under a
     plugin-specific name and attaches the Flutter view directly. The
     test: two plugins built with different Flutter versions in one
     process. juce_flutter and flutter#104144 report that this fails
     without renaming, because of process-wide globals and fixed
     Objective-C class names.
   - (C) A native AppKit view with the same controls drawn natively. It
     is the baseline for latency, memory and opening time, and it shows
     the cost of writing every editor twice.
   - (D) No editor: the host's generic view, the default until decided.
6. **iOS** (decision 4): Flutter in the AUv3 extension of
   `aud_audio_auv3` — a `FlutterViewController` inside the extension's
   `AUViewController`, the engines of several instances from one
   `FlutterEngineGroup` — inside the 360 MB budget. A ballast of 100 MB
   of touched memory stands in for the sampler, which still builds
   against ABI 0.1; S20 repeats the measurement with the sampler of S9.
   The extension is a process of its own, so the two-plugin problem of
   the desktop does not arise there.
7. **The result**: the decision record plugin-003. It settles the open UI
   work of plugin-001 for VST3 on macOS and for AUv3 on iOS: technology,
   embedding, IPC, process model, the measured numbers, and what S18 to
   S20 build. A result that departs from plugin-001 (Dart out of process)
   supersedes it.

Out of scope: the shells themselves (S18 to S20), Windows and Linux
(S18), CLAP (S19 follows the record), a production editor design.

## Measurements and budgets

Each measurement runs at 48 kHz and 128 frames on an Apple silicon Mac,
for the variants A, B and C. REAPER runs all of them; Ableton Live runs
the embedding checklist and the open and close cycles (decision 1).
Memory is `phys_footprint`, summed over the DAW process and the editor
processes.

| Measurement | How | Budget |
| --- | --- | --- |
| Memory, editor closed | an instance without editor against the headless host alone | 2 MB more at most: nothing of Flutter is loaded before the editor opens |
| Memory, first editor | open the editor of one instance | 150 MB at most for everything the editor adds |
| Memory, more editors | two and four editors open | 50 MB at most per further editor; more calls for one editor process per DAW process (open question 1) |
| UI to audio | from the Flutter pointer event to the first `process` call that carries the new value, on the host clock, 1000 changes | median 10 ms, p99 20 ms; at most 2 ms above C at the median |
| Audio to UI | from host automation to the redrawn control | median two display frames (33 ms) |
| Editor open | from `attached` to the first frame inside the host's window | 500 ms cold, 150 ms warm |
| Editor close | `removed` returns; 100 open and close cycles | 50 ms; no process, window or port left; the DAW process grows 5 MB at most over the cycles |
| Two instances | two instances in one REAPER project, both editors open | each editor drives its own instance; the budgets hold per editor |
| Two Flutter plugins | two different plugins, one built with another Flutter version, in one REAPER process | both editors work; closing one leaves the other intact |
| Crash and hang | kill the editor process; suspend it for 10 s | the DAW stays responsive (its UI thread blocks 100 ms at most), no xrun, reopening the editor recovers |
| Audio thread | the processor under RealtimeSanitizer and the watchdog of ticket 20 while two editors animate for 10 min | zero violations, zero xruns |
| CPU | an idle editor; dragging a knob | idle 1 % of one core at most; the plugin's view costs the host's UI thread 1 ms per frame at most |
| Embedding | resizing; Retina and non-Retina screens, moving between them; focus and keys (typing does not trigger host shortcuts); wheel; cursor; moving, minimizing and closing the host's window; full screen and Spaces | the checklist passes in REAPER and Live |
| iOS AUv3 | one, two and four instances in one host, ballast loaded, editors open, 10 min | 360 MB at most for the whole extension, Flutter's share reported; first frame 500 ms; never terminated |

The budgets are proposals of this plan; the spike may refine them with
reasons. The decision record weighs them against the effort of each
variant, the reuse of the UI packages and the risk per host.

## Affected later steps

- S18 `aud_audio_vst3`: the macOS editor follows the record, and the
  spike's plugin is its seed. S18 decides Windows and Linux with the same
  measurements: on Windows a child window across processes joins the
  input queues of both threads, so a hung editor can stall the DAW; a
  shared texture with forwarded input is the alternative. Parameters
  only until then.
- S19 `aud_audio_clap`: follows the record. CLAP's GUI extension also
  allows a floating window, which VST3 lacks.
- S20 `aud_audio_auv3`: the iOS result decides between Flutter in the
  extension and a native view; S20 repeats the memory measurement with
  the sampler of S9. On macOS an AUv3 out of process gets the system's
  remote view and needs no embedding of its own. Parameters only until
  decided; M3 does not wait for the spike.
- S17a `aud_audio_ui_controls`: completes the slice the spike builds.
  `ParamBinding` binds to the abstract parameter sink, so the same
  widgets drive the engine in an app and a plugin over IPC.
- `aud_audio_core`: `AudCommand` has no gesture begin and end and no
  graph document. The spike proposes whether they join it or stay in
  the shells' protocol.
- Ticket 17: open question 1 and the open UI work of plugin-001 close
  with the record for macOS and iOS, and with S18 for Windows.

## Constraints

- Plan only: this ticket changes `aud_audio_pm` alone.
- Dart never runs on the host's render thread (interop-001); the editor
  never touches the realtime path.
- Permissive licenses only: the VST3 SDK 3.8 (MIT), Flutter
  (BSD-3-Clause). flutter_vst3 (BSD-3-Clause) is a reference, not a
  dependency.
- The spike runs on Claude Fable 5.1 at max effort (process-002, class
  S0).
- Scripts are Node.js; CHANGELOG.md belongs to gg; commits per repo with
  `gg one do commit -m`; the user runs `gg do publish`.

## Affected repos

This ticket:

- `aud_audio_pm`: this plan; the row in `doc/issues.md`; S0-plugin-ui,
  S17a, S18, S20 and open question 1 in the plan of ticket 17; the open
  work of plugin-001 and its row in the index; the findings in
  `topics/plugin-formats.md`; the list in `tickets/README.md`.

The spike ticket:

- `aud_audio_pm`: the measurements, the record plugin-003, the updates of
  S17a to S20.
- `aud_audio_vst3`: the minimal plugin, the native view, the embedding
  and the editor app as its example — the seed of S18.
- `aud_audio_ui_controls`: the first slice of S17a (decision 5).
- `aud_audio_auv3`: the iOS extension with the ballast (decision 4).
- `aud_audio_graph` stays as published (the headless host);
  `aud_audio_core` changes only if `AudCommand` grows.

## Steps

This ticket:

1. Done: ticket 23 with `aud_audio_pm`; the saved edits of S0-plugin-ui
   applied to the plan of ticket 17 and to plugin-001 (they applied
   cleanly after ticket 22).
2. Done: the ticket registered in `doc/issues.md`.
3. Done: this plan; the research in `topics/plugin-formats.md`.
4. Done: the plan review (decisions below).
5. Commit, push and review; the user runs `gg do publish`.

The spike, roughly:

1. The minimal VST3 over the headless host with the generic view (D),
   played in REAPER on macOS; the validator passes.
2. The native view (C) with the latency probe and the memory numbers: the
   baseline.
3. The first slice of S17a in `aud_audio_ui_controls`.
4. The editor app with the controls, the socket and the binding;
   automation and meters back.
5. Embedding: the shared surface with forwarded input, then the
   following window for comparison.
6. The measurements in REAPER, the embedding checklist and the open and
   close cycles in Live: two instances, two Flutter plugins, crash and
   hang.
7. Flutter in process (B) with a renamed framework.
8. iOS: Flutter in the AUv3 extension with the ballast.
9. The record plugin-003; the updates of S17a to S20, ticket 17 and
   plugin-001; the blog post.

## Questions of the plan review

1. **Desktop hosts: REAPER only, or Bitwig or Ableton Live too?**
   - REAPER is the host of S18's tests and the cheapest to script.
   - Bitwig hosts plugins in sandbox processes of its own and is CLAP's
     home host (S19): a second process model.
   - Live opens plugin editors in windows of its own; it is the most
     demanding host for embedding.
   - This Mac has Cubase 15 (Steinberg's reference host) and GarageBand;
     REAPER, Bitwig and Live are not installed.
   - Recommendation: every measurement in REAPER; the embedding checklist
     and the open and close cycles in Ableton Live as well (a trial
     license is enough).
2. **Windows in the first round, or macOS first?**
   - macOS carries the largest unknown (no public cross-process view),
     and this Mac is the development machine. Windows needs a PC or a VM
     with REAPER and the Flutter Windows toolchain.
   - Recommendation: macOS first, Windows in the same ticket before the
     record is written.
3. **IPC: shared-memory rings like interop-001, or a socket?**
   - Rings: no system call per message, the engine's own lock-free
     design; but they need a liveness channel of their own, wake-ups
     across processes and a versioned memory layout.
   - A Unix domain socket (`dart:io` supports it on macOS and, since Dart
     3.11, on Windows): framing, liveness (end of stream when the editor
     dies) and back pressure come with it. A message costs tens of
     microseconds, far below a display frame or an audio block.
   - Recommendation: the socket, carrying `AudCommand` as JSON (it has
     `toJson` and `fromJson`) and the few messages of the shell. Rings
     only if the IPC's share misses its budget.
4. **The iOS AUv3 measurement: in this spike or in S20?**
   - "With the sampler loaded" needs S9: `aud_dsp_sampler` 0.1.0 is built
     against ABI 0.1, the graph is at ABI 0.3.
   - (a) In this spike, with a ballast in place of the sampler; S20
     repeats it with the sampler of S9. (b) In S20 only. (c) In this
     spike, after S9.
   - Recommendation: (a). The record needs Flutter's own share now.
5. **`aud_audio_ui_controls` is still empty (0.0.2; S17a not built). What
   does the spike reuse?**
   - (a) The spike builds the first slice of S17a in the package, as
     S0-mobile seeded S1 to S4. (b) S17a first; the spike waits. (c) A
     stand-in knob; the reuse is proven in S18.
   - The package depends on the umbrella (index.jsonc), and with it on
     the graph, the audio IO and `jni`, each with its native build. An
     editor process does not need them.
   - Recommendation: (a), with the widgets and the sink free of the
     umbrella.

## Decisions of the plan review (2026-10-09)

Gabriel Gatzsche decided:

- 1 → every measurement in REAPER; the embedding checklist and the open
  and close cycles in Ableton Live as well.
- 2 → macOS only, not the recommended second round on Windows: the
  record covers macOS (and iOS); S18 decides the Windows embedding.
- 3 → a Unix domain socket carrying `AudCommand` as JSON; rings only if
  the IPC misses its budget.
- 4 → (a) in this spike, with a ballast in place of the sampler; S20
  repeats it with the sampler.
- 5 → (a) the spike builds the first slice of S17a in
  `aud_audio_ui_controls`, the widgets and the sink free of the
  umbrella.

## Open questions

The spike answers them; the record carries the answers.

1. Process model: one editor process per open editor, or one per DAW
   process that serves every instance? Flutter's desktop multi-window API
   is still experimental in 3.47.
2. Does the editor process stay warm after closing (opening time against
   memory), and for how long?
3. `AudCommand` lacks gesture begin and end and the graph document: new
   commands in `aud_audio_core`, or messages of the shells' protocol?
4. Where do the editor's Dart parts live for S18 to S20 — the socket
   client, the sink for `ParamBinding`, the editor app: in each shell, or
   in a package of their own (a new repo)? And where does the
   `AudEngine` adapter of the controls go once the widgets are free of
   the umbrella?
5. Text input, IME, accessibility and the cursor through a shared
   surface: what works?
6. Signing: the editor app inside the VST3 bundle (hardened runtime,
   notarization, Gatekeeper on first start).

## Findings

- **flutter_vst3 does not embed.** Its view
  (`flutter_vst3/native/src/plugin_view.cpp`) starts the Flutter UI app as
  an external window on `attached`, with a fixed size and no IPC in the
  view; the Dart audio code runs as a separate AOT process. It is prior
  art for the process split, not for the embedding. The embedding is new
  ground for the spike.
- **Cross-process windows.** macOS offers no public API to show another
  process's view inside a host's view; AUv3 gets the system's remote view
  from Apple. On Windows a parent and child window of two processes join
  the input queues of their threads (Raymond Chen), so a hung editor can
  stall the DAW's UI thread; S18 measures it.
- **Flutter 3.47.5** is installed: Impeller is the default renderer on
  the desktop since 3.47; the desktop multi-window API is still
  experimental (main channel and a flag).
- **`aud_audio_ui_controls`** is the 0.0.2 bootstrap: no widget to reuse
  yet (decision 5).
- **The sampler** (`aud_dsp_sampler` 0.1.0) still depends on core 0.1
  (ABI 0.1) while the graph runs ABI 0.3; with major 0 the minor must
  match exactly, so it cannot register into today's graph (decision 4).
- **Hosts on this Mac**: Cubase 15 and GarageBand; REAPER and Live must
  be installed for the spike (decision 1).
- **Model deviation**: process-002 puts the planning of implementation
  tickets on Claude Fable 5.1 at high effort; this plan was written on
  Claude Opus 5.5.

## Sources

Fetched on 2026-10-09; see also
[plugin-formats.md](../concepts/topics/plugin-formats.md).

- https://github.com/MelbourneDeveloper/flutter_vst3
  (`flutter_vst3/native/src/plugin_view.cpp`, README)
- https://devblogs.microsoft.com/oldnewthing/20130412-00/?p=4683
- https://flutter.dev/blog/whats-new-in-flutter-3-47
- https://flutter.dev/blog/desktop-windowing-apis
- https://dart.dev/changelog (3.11: AF_UNIX sockets on Windows)
- https://github.com/flutter/flutter/issues/104144
