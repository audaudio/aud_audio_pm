# 36: Fix the start of Android release builds with shared_preferences_android 2.5.0

Status: planned and started 2026-10-19 on the user's report ("Starting
audanika on my samsung hangs on the launch screen").

## Goal

A release build of the Audanika app starts on Android again. Since ticket
31 the app resolves `shared_preferences_android` 2.5.0 (published on
2026-10-17), which calls its Kotlin side through JNI ("Updates internal
implementation to use Pigeon JNI"). In a release build the call fails —
`NoSuchMethodError: no non-static method
SharedPreferencesApiRegistrar.getAll(String, List, Continuation)` — and the
app waits on its splash screen for the preferences; debug builds and iOS
are not affected. App 4.4.0 carries the fault.

## Affected repos

- `audanika_app`: an R8 keep rule for the classes of the plugin that JNI
  calls (`android/app/proguard-rules.pro`), applied to the release build; a
  patch (4.4.0 → 4.4.1).
- `aud_audio_pm`: this plan.

## Steps

1. A keep rule for `io.flutter.plugins.sharedpreferences.**` in the app's
   R8 configuration (the user's choice over pinning the plugin below 2.5.0).
2. A release build on the Galaxy Tab S4: the app starts, reads and writes
   its preferences; the rule is checked in the R8 mapping.
3. If the rule does not suffice, pin `shared_preferences_android` below
   2.5.0 instead and report the cause upstream.
4. Code review, review, publish.

## Open questions

None.

## Model and rules

Claude Opus 5.5 at extra high effort (process-004); the standing rules of
process-005.

## Rests on

process-003, process-005; ticket 31.
