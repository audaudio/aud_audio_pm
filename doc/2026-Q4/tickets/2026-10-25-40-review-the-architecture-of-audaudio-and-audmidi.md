# 40: Review the architecture of audaudio and audmidi

Status: created 2026-10-25 on the user's request ("Lege ein Review Ticket
an. Füge aud_audio_pm zum Ticket hinzu. Bitte schaue in .ocean und
erstelle einen umfassenden Review über die Architektur für das audaudio
und das audmidi Framework"), extended the same day by the implementation
ticket plan ("Create an implementation ticket plan based on the review
result"). The review was written on 2026-10-25; the 23 tickets derived
from it are proposed and await the user's confirmation at the review of
this ticket.

## Goal

The owner sees where the two package families stand against their target
architecture and what to do about it: where documentation and READMEs are
missing, what the sites audaudio.github.io and audmidi.github.io still
need, where code is not split sensibly into packages, which packages to
introduce and which to merge, where functions and interfaces are awkward,
and what else a good framework needs. The findings become an ordered plan
of implementation tickets, each with a plan file of its own, so that the
next quarters work from the review instead of from memory. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md): its measures of
success — one Dart API on six platforms, DSP packages that plug in without
engine changes, every copied line with its license — are what the review
checks.

## Requirements

None accepted yet. The review ticket needs none; the derived tickets
fulfil framework qualities no requirement area covers today — see open
question 1.

## Affected repos

- `aud_audio_pm`: the review
  ([review-2026-10-25-architecture.md](../concepts/topics/review-2026-10-25-architecture.md)),
  this plan, the 23 proposed ticket plans, their rows in `doc/issues.md`,
  the ticket list and the topics list; minor version. The rows of tickets
  38 and 39, which `doc/issues.md` lacked, are added as well.
- No code repo: the review reads the 43 repos of `.ocean` only.

## Steps

1. Create the ticket, add `aud_audio_pm`; done 2026-10-25.
2. Measure every repo (own and generated Dart, own and vendored native
   code, tests, dependencies, git state), read the architecture, the
   decisions and the plan of ticket 17; done.
3. Review by area — engine core; integration packages and plugin shells;
   DSP and UI packages; the audmidi family; the documentation and the two
   sites — and spot-check the key claims in the sources; done.
4. Write the review as a topic; done.
5. Derive the implementation plan: 23 tickets in seven phases with sizes,
   dependencies and affected repos, one plan file each, numbered in
   `doc/issues.md`; done.
6. The user reviews the findings and the plan, confirms, changes or drops
   tickets; then the confirmed tickets start in phase order.

## Results

The review: [review-2026-10-25-architecture.md](../concepts/topics/review-2026-10-25-architecture.md).
Its summary in one paragraph: ten of the 31 audaudio packages hold real
code and 18 are untouched templates that promise what does not exist; all
ten audmidi packages are implemented but Windows and Linux have never run;
the biggest gap of both families is CI — one ubuntu job per repo, no
platform, sanitizer or validator run; the node-package pattern is copied
per package instead of generated; DSP sits in the graph, the OSC router in
the core, the load governor in the umbrella and the editor protocol in the
VST3 shell; the site documents three of ten implemented packages, audmidi
has no site; audaudio is wired over SSH git references with exact pins and
empty releases, audmidi is on pub.dev but tagged web-only; the notices are
complete but unchecked in three repos, and the LICENSE files say "All
Rights Reserved". One bug was found (the capability merge of
`MidiCompositeBackend`).

## Implementation plan

Seven phases. A phase does not wait for the previous one to finish — the
dependencies in the table do —, but the order is the one in which the
work pays: first the published state tells the truth and CI proves the
code, then the patterns the next seven DSP packages copy, then the
interfaces apps meet, then the shells, the docs and the bench, and the
audmidi platforms in parallel. Sizes use the scale of ticket 17: S up to
one week, M two to three weeks, L four to six weeks. The sum is roughly 55
to 65 engineer-weeks; the audmidi phase (about 12 weeks) and the docs
phase (about 10 weeks) can run beside the audio phases.

1. **Clean the table** — tickets 41, 42, 43: the stubs say what they are,
   the READMEs, changelogs, indexes and pubspecs tell the truth, the
   notices are checked everywhere.
2. **Prove it in CI** — ticket 44: the platform matrix for both families.
3. **The node pattern** — tickets 45, 46, 47, 48: the node kit, the
   generator, the graph housekeeping, the shared utilities; before S10b to
   S13, S25 and S26 copy the current boilerplate seven more times.
4. **Engine and interfaces** — tickets 49 to 54: input and multi-channel,
   the error model and logging, the MIDI bridge interface, OSC, the
   sequencer stage, the controls and the binding package.
5. **The shells** — ticket 55: the shell core and the build manifests;
   S19 and S20 follow on it.
6. **Docs and bench** — tickets 56, 57, 58: the bench app, the site
   foundation, the site content.
7. **audmidi** — tickets 59 to 63: the Windows and Linux runs, the
   contract suite and the bug, the API consistency, the publication, the
   site.

| # | Ticket | Size | Step | Depends on | Repos |
| --- | --- | --- | --- | --- | --- |
| 41 | [Retire the template API of the stub packages](2026-10-25-41-retire-the-template-api-of-the-stub-packages.md) | S | – | – | 18 stubs, aud_audio, aud_audio_pm |
| 42 | [Documentation hygiene of the audaudio repos](2026-10-25-42-documentation-hygiene-of-the-audaudio-repos.md) | M | – | 41 | the 10 implemented packages, dna_audanika, aud_audio_pm |
| 43 | [Notices and licenses in every repo](2026-10-25-43-notices-and-licenses-in-every-repo.md) | S | – | – | dna_audanika, io, vst3, sampler, link, aud_midi_linux, all LICENSE files, aud_audio_pm |
| 44 | [CI platform matrix for both families](2026-10-25-44-ci-platform-matrix-for-both-families.md) | L | S22 | 41, 43 | dna_audanika, every repo with native or platform code |
| 45 | [Node kit and FFI helper in the core](2026-10-25-45-node-kit-and-ffi-helper-in-the-core.md) | M | – | – | aud_audio_core, aud_dsp_effects, aud_dsp_sampler |
| 46 | [Generate the nodes from their descriptors, ABI 0.5](2026-10-25-46-generate-the-nodes-from-their-descriptors.md) | M | – | 45 | aud_audio_core, aud_audio_graph, aud_dsp_effects, aud_dsp_sampler, aud_audio_pm |
| 47 | [Graph housekeeping: DSP out, runtime handle, facets](2026-10-25-47-graph-housekeeping-dsp-out-runtime-handle-facets.md) | L | S10b | 45 | aud_audio_graph, aud_audio_core, aud_dsp_effects, aud_audio, aud_audio_pm |
| 48 | [Shared native and test utilities](2026-10-25-48-shared-native-and-test-utilities.md) | M | – | – | aud_audio_core, graph, io, midi, script, vst3, dna_audanika |
| 49 | [Engine input, multi-channel streams and a curated umbrella](2026-10-25-49-engine-input-multi-channel-streams-and-a-curated-umbrella.md) | M | – | 48 | aud_audio, aud_audio_io, aud_audio_graph |
| 50 | [Error model, logging and the small API fixes](2026-10-25-50-error-model-logging-and-the-small-api-fixes.md) | M | – | – | core, graph, io, sampler, effects, script |
| 51 | [MIDI bridge and the aud_midi tap and time interface](2026-10-25-51-midi-bridge-and-the-aud-midi-tap-and-time-interface.md) | M | S8 | – | aud_audio_midi, aud_midi, aud_midi_core, aud_midi_apple, aud_midi_android, aud_midi_pm |
| 52 | [OSC: the split decision, one notification type, the server](2026-10-25-52-osc-the-split-decision-one-notification-type-the-server.md) | M | S7 | 47 | aud_audio_core, aud_audio_graph, aud_audio_osc, aud_audio_pm |
| 53 | [Sequencer render stage in the ABI](2026-10-25-53-sequencer-render-stage-in-the-abi.md) | S | S14 | 46 | aud_audio_core, aud_audio_graph, aud_audio_pm |
| 54 | [Controls on the core model and aud_audio_ui_bindings](2026-10-25-54-controls-on-the-core-model-and-aud-audio-ui-bindings.md) | M | S17a | 41, 46 | aud_audio_ui_controls, aud_audio_core, aud_audio_ui_bindings (new), aud_audio_pm |
| 55 | [Plugin shell core and node build manifests](2026-10-25-55-plugin-shell-core-and-node-build-manifests.md) | L | S18, S19, S20 | 46, 48 | aud_audio_vst3, aud_audio_plugin (new), aud_audio_auv3, sampler, effects, script, aud_audio_pm |
| 56 | [Bench app with JSON export](2026-10-25-56-bench-app-with-json-export.md) | M | S24 | – | aud_audio_bench, aud_audio, audaudio.github.io |
| 57 | [Docs site foundation](2026-10-25-57-docs-site-foundation.md) | M | S21 | 42 | audaudio.github.io, all audaudio pubspecs, aud_audio_pm |
| 58 | [Docs site content from the repos](2026-10-25-58-docs-site-content-from-the-repos.md) | L | S21 | 56, 57 | audaudio.github.io, the 7 documented packages, aud_audio_bench |
| 59 | [aud_midi_windows and aud_midi_linux: the first real runs](2026-10-25-59-aud-midi-windows-and-aud-midi-linux-the-first-real-runs.md) | M | – | 44 | aud_midi_windows, aud_midi_linux, aud_midi_network, aud_midi_pm |
| 60 | [aud_midi_core: contract suite, capability fix, one clock](2026-10-25-60-aud-midi-core-contract-suite-capability-fix-one-clock.md) | M | – | – | aud_midi_core, aud_midi_network, the 5 backends, aud_midi |
| 61 | [aud_midi API consistency](2026-10-25-61-aud-midi-api-consistency.md) | M | – | 60 | aud_midi, aud_midi_core, the 5 backends, aud_midi_network, aud_midi_pm |
| 62 | [audmidi publication and README consistency](2026-10-25-62-audmidi-publication-and-readme-consistency.md) | S | – | – | the 10 audmidi packages, aud_midi_pm |
| 63 | [audmidi.github.io](2026-10-25-63-audmidi-github-io.md) | M | – | 57, 62 | audmidi.github.io (new), aud_midi_pm |

Not ticketed here, because the review only confirms that they are due and
their steps are planned in ticket 17 or the PM repo of audmidi: ticket 34
(the voice allocator; the device probing of the umbrella moves to
`aud_audio_io` in the same move), the Linux audio device (S3b Linux, or
at least an explicit unsupported error, part of 49), the web build (S5)
with the contribution manifests of the DSP packages, the sequencer (S14)
after 53, the AUv3 (S20) and CLAP (S19) shells after 55, the native taps
of the Windows, Linux and network backends (native-001), the BLE
peripheral, the UMP 1.1 discovery through MTF messages and standard-001,
the Android hardware pass of aud_midi_android, the parallel scheduler (S6)
with the thread-count dimension of the goldens.

## Open questions

1. **Requirements.** No accepted requirement covers framework quality, and
   the PM guide asks for requirements before tickets. Proposal: a
   requirements area `doc/requirements/framework.md` with statements such
   as "every published package documents its exported API and its platform
   setup and says which platforms it runs on", "every native path of a
   package builds and tests in CI on its platform", "a DSP package is
   generated from its node descriptors", "every package of the family
   resolves without SSH keys"; the derived tickets then name them. To be
   confirmed with the user before the first ticket starts.
   **Answered 2026-10-25:** accepted as req-framework-001 to 016 in
   [framework](../../requirements/framework.md); the plans of the tickets
   41 to 63 name the ones they fulfil.
2. **Numbering of the audmidi tickets.** Tickets 59 to 63 are numbered in
   `doc/issues.md` of `aud_audio_pm` as tickets 26 and 39 were, and record
   their decisions in `aud_midi_pm`. Alternatively `aud_midi_pm` numbers
   them. Still open.
3. **The graph's reference nodes.** Ticket 47 proposes to move oscillator
   and filter into `aud_dsp_effects` (S10b) and to keep `aud.test.*` nodes
   for the contract tests; the alternative is to declare `aud.graph.*`
   stable production nodes and shrink S10b.
   **Answered 2026-10-25:** they move into `aud_dsp_effects`, as ticket 47
   proposes.
4. **The LICENSE wording.** "Copyright (c) Audanika. All Rights Reserved."
   under the MIT heading — intended, or the template's text? Ticket 43
   assumes the latter.
   **Answered 2026-10-25:** the template's text; every `LICENSE` gets the
   plain MIT text (ticket 43, req-framework-016).
5. **Which tickets start first.** The proposal is the phase order with 41,
   43 and 44 first; the user may pull the docs or the audmidi phase
   forward.
   **Answered 2026-10-25:** the user left the order to the plan; it
   follows the phase order, ticket 41 first, then 43 and 44.
