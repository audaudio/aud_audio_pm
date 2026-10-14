# 33: S29e — Add a tempo control to the Audanika app

Status: planned 2026-10-14 during ticket 31, on the user's request
("120BPM, plan a ticket for adding a tempo control"). Not started.

## Goal

Players set the tempo of the Audanika app. The tempo-locked patterns of
the SoundPrism Link Edition combis (ticket 31) and the master delay follow
it, so the patterns can match a song or a band instead of the fixed
120 BPM of ticket 31. The control is ready for Ableton Link (S15): once
Link is on, it shows and sets the tempo of the Link session. Serves the
app integration of S29a and the goal
[flutter-audio-kit](../goals/flutter-audio-kit.md).

## What the code base gives

- The engine's internal transport has a tempo (120 BPM by default) and
  takes start, stop and tempo requests from Dart (`AudTransportRequest`,
  time-001); the transport snapshot carries the tempo to every node per
  block.
- After ticket 31 the app runs the transport at 120 BPM and the modulator
  `aud.script.modulator` computes its patterns from the beat, so a tempo
  change keeps their phase.
- The master delay of the app is `aud.effects.stereo_delay` with a time in
  seconds (app-003). SoundPrism scaled its delay time by 120 / tempo;
  `aud.effects.tempo_delay` follows the transport tempo in note values
  (dsp-002).
- The app has no tempo anywhere in its interface or its settings.
- Link (S15, `aud_audio_link`) is planned as a transport provider; with
  it the session's tempo replaces the internal one (link-001).

## Scope

1. **The tempo** in the app's state: a value in BPM, stored across
   starts, default 120; sent to the transport on a change.
2. **The control** in the app's interface (place and form to decide):
   e.g. a value with plus and minus and a tap tempo.
3. **The delay** follows the tempo: either the master delay switches to
   `aud.effects.tempo_delay` with a note value per preset, or the app
   scales the time of the stereo delay by 120 / tempo as SoundPrism did.
4. **Tests**: a tempo change reaches the transport within one block; the
   patterns of a combi keep their phase across a change (control streams
   against the Node reference of ticket 31 at a second tempo); the delay
   follows; the stored tempo returns after a restart.

## Affected repos (expected)

- `audanika_app`: the state, the control, the delay, the tests.
- `aud_audio_pm`: this plan; a decision on the delay if it changes
  app-003.

## Steps

1. Plan review; settle the open questions.
2. The tempo in the state and the transport; tests.
3. The control in the interface.
4. The delay.
5. Check on iOS and Android with a scripted combi; review, publish.

## Open questions

1. Where does the control live: the play screen, the sound menu or the
   settings?
2. Which range and step: 40 to 240 BPM in steps of 1? Tap tempo?
3. One tempo for the app, or a default tempo per combi that a preset
   load sets?
4. The delay: `aud.effects.tempo_delay` with a note value per preset, or
   the stereo delay scaled by 120 / tempo as in SoundPrism?
5. Does the app show the beat (a blinking dot), so that players can
   follow the patterns?

## Out of scope

Ableton Link (S15); the slider of the app; time signatures other than
4/4.

## Model and rules

Claude Opus 5.5 at extra high effort (process-004); the standing rules of
process-005.

## Rests on

time-001, link-001, dsp-002, app-003, process-003, process-004,
process-005; ticket 31.
