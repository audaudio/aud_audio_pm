# sampler-004: The sampler reads Android assets in place

- Status: accepted
- Date: 2026-10-12
- Canonical source: tickets/2026-10-12-27-play-an-sfz-instrument-from-audanika-app-on-the-new-engine.md
  (scope 2; the user's instruction of 2026-10-12)
- Refines: [sampler-002](sampler-002.md) — the fork gains a file layer of
  its own; [lifecycle-002](lifecycle-002.md) — the store keys samples by
  their lexically normal path
- Open work: compressed assets are inflated whole on every open; the
  directories of a path are matched exactly, only file names without
  regard to case

## Decision

On Android a path `apk:/<path>` in `sfz_file`, `scala_file` or
`sfz_virtual_path` names an asset of the app's APK, and the relative paths
inside the SFZ file (`sample=`, `#include`, `default_path`, with `..`)
resolve inside the APK as well. The fork of sfizz reads such files through
a backend registered by scheme (`VirtualFile.h`): the parser, the sample
store, the audio readers and the Scala tuning ask it before the
filesystem; loads and the streams of notes stay on the engine's workers.
The Android backend maps uncompressed assets from the APK through
`AAssetManager` without a copy (`AAsset_getBuffer`) and inflates
compressed ones while they are read. The package's Android plugin, a
ContentProvider, hands the app's `AssetManager` to the native library when
the process starts, so an app writes no platform code. No listing file
like the legacy `asset_subdirs.txt` is needed: sfizz lists files only for
the case-insensitive file-name fallback, which `AAssetManager_openDir`
serves. On the other platforms a load of an `apk:/` path ends with
`AUD_ERROR_UNSUPPORTED` and a message that says so. The store keys every
sample by its lexically normal path, so presets in different folders that
reach one sample by different relative paths share it.

## Why

- The legacy Audanika engine read its content package in place on both
  platforms; an app must not copy tens of megabytes of samples out of its
  APK at the first start (iOS reads its bundle in place anyway).
- `AAsset_getBuffer` already is a zero-copy mapping of an uncompressed
  asset; a file-descriptor route would need bounded read and seek
  callbacks in six decoders, two of which have none.
- A backend by scheme leaves sfizz's filesystem path untouched and lets
  host tests serve a folder as the assets.
- package:jni 1.1 offers no application context, so a small Java shim is
  the smallest dependency-free way to the `AssetManager`.

## Consequences

- Apps keep samples uncompressed in the APK (`noCompress` for `flac`; AGP
  stores `wav`, `ogg` and `mp3` uncompressed by default).
- Native assets under `android/app/src/main/assets/<path>` are
  `apk:/<path>`; Flutter assets are `apk:/flutter_assets/<path>`.
