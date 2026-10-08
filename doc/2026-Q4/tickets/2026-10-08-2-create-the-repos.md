# 2: Create the repos of the aud_audio family

## Goal

Every package of the aud_audio family gets its repo in the GitHub
organization `audaudio` before any implementation starts, with the
boilerplate the family shares and the dependencies of the package graph
wired by git references with `tag_pattern`, so that every later ticket
adds existing repos with `gg do add` and gg can read their dependencies
(step S00 of ticket 17, decision repos-001, requirement R35). Serves
milestone M1 of the goal
[flutter-audio-kit](../goals/flutter-audio-kit.md).

## Affected repos

- `aud_audio_pm`: this plan, the package manifest and the creation
  script.
- The 30 repos created by this ticket (table below). They join the
  ticket through `gg do add` once they exist and the ocean is refreshed.

## The repos

| Repo | Template | Depends on |
| --- | --- | --- |
| `aud_audio_core` | `package_ffi` | `aud_midi_standard` ^0.1.0 by git reference to `audmidi/aud_midi_standard` (midi-001) |
| `aud_audio_graph` | `package_ffi` | core |
| `aud_audio_io` | `package_ffi` | core |
| `aud_audio_web` | Dart package | graph, io |
| `aud_audio` | Dart package | core, graph, io, web |
| `aud_audio_midi` | Dart package | graph; `aud_midi` from pub.dev when published, else a git reference to `audmidi/aud_midi` |
| `aud_audio_osc` | Dart package | graph |
| `aud_audio_sequencer` | `package_ffi` | graph |
| `aud_audio_link` | `package_ffi` | graph |
| `aud_dsp_sampler` | `package_ffi` | core |
| `aud_dsp_effects` | `package_ffi` | core |
| `aud_dsp_analysis` | `package_ffi` | core |
| `aud_dsp_stk` | `package_ffi` | core |
| `aud_dsp_guitar_amp` | `package_ffi` | core |
| `aud_dsp_synth` | `package_ffi` | core |
| `aud_dsp_spatial` | `package_ffi` | core |
| `aud_dsp_mi` | `package_ffi` | core |
| `aud_dsp_stretch` | `package_ffi` | core |
| `aud_audio_file` | `package_ffi` | graph |
| `aud_audio_backing` | Dart package | file, stretch |
| `aud_audio_ui_graph_edit` | Flutter package | `aud_audio` |
| `aud_audio_ui_piano_roll` | Flutter package | sequencer |
| `aud_audio_ui_controls` | Flutter package | `aud_audio` |
| `aud_audio_ui_keyboard` | Flutter package | `aud_audio` |
| `aud_audio_ui_waveform` | Flutter package | `aud_audio`, file |
| `aud_audio_bench` | Flutter app | `aud_audio` |
| `aud_audio_vst3` | `package_ffi` | graph |
| `aud_audio_clap` | `package_ffi` | graph |
| `aud_audio_auv3` | `package_ffi` | graph |
| `audaudio.github.io` | copy of rljson.github.io | none yet (dev dependencies follow with S21) |

Templates: `dart create -t package` for a Dart package,
`flutter create --template=package_ffi` for packages with C or C++
through build hooks, `flutter create -t package` for the UI packages,
`flutter create` for the benchmark app, a copy (not a fork) of
rljson.github.io for the docs site.

Every repo gets: the `dna_audanika` layer (`gg dna init`, `gg dna add
dna_audanika`), `index.jsonc` filled from the plan's package table,
README from the DNA template, CHANGELOG, the version file, the
quick-check workflow, `pubspec.yaml` with name, description, version
`0.0.1`, homepage and repository URLs, `environment: sdk: ^3.12.2` and
the dependencies above as git references:

```yaml
dependencies:
  aud_audio_core:
    git:
      url: https://github.com/audaudio/aud_audio_core.git
      tag_pattern: "{{version}}"
    version: ^0.0.1
```

## Steps

1. Done: the package manifest `doc/2026-Q4/architecture/packages.jsonc`
   in this repo — name, template, description, platforms and
   dependencies of every package, derived from the table of ticket 17;
   the machine-readable package graph that later feeds the supply-chain
   repo (S22).
2. Done: `scripts/create-family-repos.js` in this repo reads the
   manifest, walks the packages in dependency order and, per package,
   creates the GitHub repo, runs the template command, applies the DNA
   layer, adds the dependencies as git references with `tag_pattern`
   through `pub add`, writes `pubspec.yaml` (`publish_to: none`,
   homepage, repository, `sdk: ^3.12.2`), `index.jsonc`, README,
   CHANGELOG, `check.yaml`, the version file and its test, runs
   `gg one can commit` and commits with git — gg refuses commits on
   `main`, and the first commit of a fresh repo belongs there —, pushes,
   tags `0.0.1` and applies the GitHub settings with
   `scripts/setup-github-repo.js --apply`. Dry run by default,
   `--local-only` for a build without GitHub, `--only` for a subset;
   repos with commits are skipped.
3. Done: probe of the templates and a local run of `aud_audio_core`
   found two template fixes the script applies: `publish_to: none`
   (packages with git dependencies cannot be published) and
   `stdout.writeln` instead of `print` in the `package_ffi` build hook.
4. Done: the real run for all 30 repos in dependency order. Two template
   fixes were applied afterwards and taught to the script: the Dart
   package template's placeholder library (gg demands a test per
   `lib/src` file) and `flutter_test` instead of `test` in the version
   test of Flutter packages and the app, plus a covered `main()` for the
   app template. The first commits were made with git, not gg: gg and
   its quick check only work once a version is on `main`, so the quick
   checks of those commits are red by design.
5. Done: `gg do upgrade ocean` lists all 30 repos, `gg do ls deps` shows
   the package graph, `pub get` resolves the git references (checked on
   `aud_audio`, `aud_audio_backing`, `aud_audio_ui_waveform`). gg's ocean
   names the docs repo `audaudiohub.io` — a gg quirk with `.git` in
   names; the remote is correct.
6. Done: the docs repo content — a copy of rljson.github.io without the
   Rljson pages, tests and assets, renamed to audaudio.github.io, with
   an Audanika landing page and an overview page; its install, tests
   (full coverage of the snippet machinery), `astro check` and build
   pass; favicon and touch icon are placeholders until the brand assets
   exist (docs-001).
7. Done: S00 is marked done in the plan of ticket 17 and the manifest is
   linked from `architecture.md`.

## Decisions at plan review (2026-10-08)

- All 30 repos are created now, the far-off ones included.
- `aud_midi_standard` is referenced by a git reference with
  `tag_pattern` to `audmidi/aud_midi_standard` (tag 0.1.0 exists),
  like the family's own packages.
- Initial version and tag of every repo: `0.0.1`.

## Open questions

None. The organization Projects board of process-001 was the open
question of this ticket; it is not created, because the ticket numbers
and their status live in `doc/issues.md` of this repo since 2026-10-08
(process-003).
