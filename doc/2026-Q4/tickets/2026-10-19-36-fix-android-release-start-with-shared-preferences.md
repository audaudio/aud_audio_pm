# 36: Fix the start of Android release builds with shared_preferences_android 2.5.0

Status: planned and started 2026-10-19 on the user's report ("Starting
audanika on my samsung hangs on the launch screen"); implemented the
same day.

## Goal

A release build of the Audanika app starts on Android again. Since ticket
31 the app resolves `shared_preferences_android` 2.5.0 (published on
2026-10-17), which calls its Kotlin side through JNI ("Updates internal
implementation to use Pigeon JNI"). In a release build the call fails —
`NoSuchMethodError: no non-static method
SharedPreferencesApiRegistrar.getAll(String, List, Continuation)` — and the
app waits on its splash screen for the preferences; debug builds and iOS
are not affected. App 4.4.0 carries the fault. Serves
[flutter-audio-kit](../goals/flutter-audio-kit.md) through its first user,
the app (ticket 27).

## Requirements

None: a bug ticket. The bug was reported and fixed the same day, so it has
no file in `bugs`; the Goal describes it.

## Affected repos

- `audanika_app`: R8 keep rules for the plugin's classes and the Kotlin
  classes that JNI names (`android/app/proguard-rules.pro`), applied to the
  release build; a patch (4.4.0 → 4.4.1).
- `aud_audio_pm`: this plan, decision app-008.

## Steps

1. A keep rule for `io.flutter.plugins.sharedpreferences.**` in the app's
   R8 configuration (the user's choice over pinning the plugin below 2.5.0);
   it did not suffice, the Kotlin classes that JNI names were added (done
   2026-10-19, see Findings).
2. A release build on the Galaxy Tab S4: the app starts, reads and writes
   its preferences; the rule is checked in the R8 mapping (done
   2026-10-19: the app starts and reads them, see Findings).
3. If the rule does not suffice, pin `shared_preferences_android` below
   2.5.0 instead and report the cause upstream (not needed).
4. Code review, review, publish.

## Findings

- The cause is R8, not the plugin's own classes:
  `SharedPreferencesApiRegistrar` carries `@Keep`, but the JVM signature of
  its suspend function `getAll(String, List, Continuation)` names
  `kotlin.coroutines.Continuation`, which R8 renamed (`-> t9` in the
  mapping), so the JNI lookup failed. With Continuation kept, the next
  lookup failed (`ClassNotFoundException`): package:jni 1.1.0 reaches
  `kotlin/Result`, `kotlin/Result$Failure`, `kotlin/Unit`,
  `kotlin/coroutines/intrinsics/CoroutineSingletons` and `IntrinsicsKt`,
  `kotlin/enums/EnumEntries` and `DefaultConstructorMarker` by name, while
  its consumer rules keep only `com.github.dart_lang.jni.**`.
- `android/app/proguard-rules.pro` (Flutter's Gradle plugin applies it to
  release builds by itself) keeps the plugin's classes and these Kotlin
  classes, the coroutine classes as a whole (app-008). The R8 mapping keeps
  their names; a release build starts on the Galaxy Tab S4 and reads its
  preferences.
- Open work: the gap belongs upstream — shared_preferences_android 2.5.0
  and package:jni 1.1.0 should ship consumer rules for the Kotlin classes
  JNI names; the app's rules can go once they do.
- Open work: no test builds the app with R8 — every test runs a debug
  build, which is how the fault reached 4.4.0; a release build smoke test
  on a device (the app starts and reads its preferences) belongs to the
  release checklist.

## Open questions

None.

## Model and rules

Claude Opus 5.5 at extra high effort (process-004); the standing rules of
process-005.

## Rests on

process-003, process-004, process-005, release-004; ticket 31.
