# plugin-004: Every plugin binary hides its symbols and names its Objective-C classes at run time

- Status: proposed
- Date: 2026-10-10
- Canonical source: tickets/2026-10-09-24-spike-a-flutter-editor-for-the-plugin-shells.md
  (the spike S0-plugin-ui, its hygiene results)
- Refines: [plugin-001](plugin-001.md) — how plugins of the family built
  against different engine versions share one DAW process
- Related: [plugin-003](plugin-003.md) — the plugin editor, decided by the
  same spike
- Open work: apply it in the shells S18 to S20

## Decision

Every plugin binary of the family exports only its entry points, builds
with hidden visibility and creates its Objective-C classes at run time
under names with a random suffix, so that plugins built against different
engine versions coexist in one DAW process.

## Why

- Objective-C has one class namespace per process: the runtime takes the
  class of whichever image loaded first. dyld coalesces exported weak C++
  definitions (inline functions, templates, type info) across images. Two
  engines of different versions would run each other's code.
- The spike ran two builds of its plugin in one REAPER process, one
  against graph 0.4.0 and one against graph 0.3.0. Without the hygiene the
  view of the second build ran the first build's Objective-C class
  (`implFlavor 1`); with it each build ran its own.
- The C++ of graph 0.3.0 and 0.4.0 is identical, so the second build
  carries a deliberate layout skew in an inline type of the shell and a
  check that notices when a build reaches the other build's copy. REAPER
  did not coalesce weak C++ symbols across the bundles, so the skew test
  shows only the Objective-C collision. Hidden visibility keeps each
  build's C++ to itself wherever a loader would coalesce.
- The hygiene covers the plugin's own code, not Flutter's: its frameworks
  have fixed Objective-C names, and two Flutter versions in one process
  need renamed copies of the frameworks (variant B, which plugin-003
  rejects). Out of process the editors of two builds with Flutter 3.47.5
  and 3.44.9 ran side by side.
