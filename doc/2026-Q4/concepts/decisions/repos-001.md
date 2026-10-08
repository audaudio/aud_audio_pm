# repos-001: All repos are created up front and wired by git references

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's instruction at the plan review on
  2026-10-08 (R35)
- Open work: the initial version to tag (0.0.1 proposed); the switch to
  pub.dev versions once the packages are published (S22)

## Decision

Before any implementation starts, every package of the family gets its
repo in the `audaudio` organization (step S00): created from the
matching template — `dart create -t package` for pure Dart,
`flutter create --template=package_ffi` for packages with C or C++
through build hooks, the Flutter package template for the UI packages,
rljson.github.io for the docs site —, with the `dna_audanika` layer,
`index.jsonc`, README, CHANGELOG, the quick-check workflow and the
GitHub ruleset from `scripts/setup-github-repo.js`. The pubspecs are
wired to each other according to the package graph of the plan, in the
first phase by git references with `tag_pattern`, so that pub resolves
versions from the repos' tags:

```yaml
dependencies:
  aud_audio_core:
    git:
      url: https://github.com/audaudio/aud_audio_core.git
      tag_pattern: "{{version}}"
    version: ^0.0.1
```

Every repo receives an initial `0.0.1` tag in dependency order so that
the references resolve from the first day; `aud_audio_core` references
`aud_midi_standard` in the `audanika` organization the same way as soon
as that repo exists. The ocean of the gg workspace is refreshed with
`gg do upgrade ocean`, so every later ticket adds existing repos with
`gg do add` and gg sees their dependencies. Public repos use `https`
URLs so that CI and users without SSH keys can resolve them. Once the
packages are on pub.dev the git references give way to hosted versions.

## Why

- gg tickets rely on repos that exist and on dependencies gg can read;
  creating the family up front makes every later ticket a plain
  `gg do add`.
- Git references with `tag_pattern` are the Audanika convention
  (`aud_app`, `aud_sc`) and work before pub.dev publication.
