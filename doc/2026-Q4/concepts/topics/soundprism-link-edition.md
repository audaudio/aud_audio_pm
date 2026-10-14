# Topic: the SoundPrism Link Edition combis and their JavaScript LFOs

What the combi patches of SoundPrism Link Edition are, how their
JavaScript scripts modulate the sound, and what the new engine needs to
play them. Source: the SoundPrism code base (a private repo), inspected
2026-10-14 for ticket 31. The legacy Audanika `audio_engine` carries the
same JavaScript interface; there it is switched off.

## The content package

`AUD003269_sp_linkEdition__combiPatches` holds three folders, all XML with
the root `<Audanika>`, the scripts as plain `.js`:

- `presets/`: 24 patches, each as three channel presets (`_Bass`,
  `_Chord`, `_Melody`) and one `__Combi` that selects the three. The Oli09
  presets end in `.preset.hidden` and are not installed, so 23 combis are
  visible. PluckArp and linkEditionDefault share the ID AUD003304.
- `scripts/`: 72 scripts, one per channel preset; the file name is the
  script ID.
- `variants/`: 12 play-mode variants (touch zones and their MIDI
  channels). They reference neither scripts nor samples; only four of them
  are referenced by the default settings.

A channel preset maps one MIDI channel — 0 bass, 1 chord, 2 melody — to a
sound:

```xml
<Channel2 attack="0" linearGain="8" release="40"
          sampleSetId="AUD001909_FuzzyPad.sampleset"
          soundScriptId="AUD003304_PluckArp_Melody.js"/>
```

- `attack`, `release`: milliseconds, a linear envelope per voice.
- `linearGain`: a linear factor per voice (2.5 to 42 in the bundle).
- `transposition`: semitones added to the note (+12 five times, −12 once).
- `<ControllerStates channelNControllerMap="ch:cc:value;…">`: the start
  value of CC 74, the "slider" of the scripts, in seven presets.

A combi loads in three steps: unselect all presets except the reverb
preset, load the combi, load its three channel presets.

## The samples

The presets use 46 sample sets. Every set is in two packages:
`AUD003269_sp_linkEditionSampleSets_full` (101 MB of m4a, every
semitone) and `…_reduced` (24 MB, every sixth semitone). The shipped app
used the reduced package. Most sets also exist in older packages
(AUD000307 to AUD002284).

A set is a folder with `info.xml` (`loopMode`, `loopMicroFadeTime`), one
file per MIDI note in `22kHz/` or `44kHz/`, and for the newer sets a
`sampleInfo.xml` with loop points per file. The engine plays one stereo
sample per note, fills missing notes with the nearest root and loops
forward only. It is the same sampler core as the legacy Audanika engine,
so the rules of app-001 apply.

## The script runtime

The 72 scripts are thin. The runtime is `DefaultSamplerScript.js` (986
lines). It is evaluated once per JavaScript context, then
`DefaultSoundScript.js` per channel (with `$MIDICHANNEL$` replaced), then
the scripts of the three presets. All channels share one global scope.

It defines:

- `sampler.time`: `linkTime` = Link beat × 0.5, i.e. seconds at
  120 BPM; one bar is 2.0 (`linkTimeDurationOfOneBar`), always 4/4.
- `sampler.midiChannels[0..15]` with the shortcuts `bass`, `chord` and
  `melody`; per channel the overridable functions `gainDb()`,
  `panorama()`, `noteOnPanorama(note)`, `lowpassFilter.cutoff()`,
  `lowpassFilter.resonance()` and an optional `update()`.
- `slider`: `val` = CC 74 of channel 0 / 128; `val2(a, b)` maps it
  linearly.
- `Envelope(resolution, points, type)`: the LFO of the scripts, a
  looping breakpoint sequencer locked to the Link beat.
- `envs` and `tmp` for state; both are cleared when a sound loads.

### The Envelope

- `resolution` is in bars; the points are `4 · resolution` beats apart.
  `points` is a digit string, each digit d is the value d/9; spaces and
  `|` are ignored. The loop is `N · 4 · resolution` beats long (0.25 to
  512 beats in the bundle).
- The phase is absolute against the beat timeline. `phaseAdjust()`
  shifts it in units of one point distance; `rate()` turns the envelope
  into a free-running one that integrates beat time × rate.
- Between two points the value follows a raised cosine,
  `(sin(π(x − 0.5)) + 1) / 2`, where x is normalised by the point
  distance, not by the segment. So `linear` is eased and continuous.
- The types insert one point per segment: `pulse` a 0 at half way,
  `rampup` a 0 just after the point, `rampdown` a 0 just before the next
  point, `plateau` the same value just before the next point. Since these
  segments are shorter than the point distance, the easing never ends:
  the curves jump at the breakpoints. `plateau` is almost a step.
- A negative time (a negative `phaseAdjust` near beat 0) makes the
  segment search fail; it logs "Endless cycle occured".

Of the 72 scripts, 50 create 73 envelopes: 46 `linear` (17 of them
two-level alternations such as `'09'`), 12 `plateau`, 7 `rampdown`, 4
`rampup`, 4 `pulse`; resolutions from 1/64 to 4 bars. 22 scripts set a
`phaseAdjust`, 4 a `rate`. The other 22 scripts hold constants or follow
the slider only.

### What the scripts modulate

- Cutoff in absolute cents (`centMin` 100 Hz to `centMax` 22 kHz): 39
  functions follow an envelope, 44 the slider.
- Gain in dB: 15 follow an envelope, 6 the slider.
- Pan: 21 follow an envelope, 11 the slider.
- Resonance: constant everywhere.
- Per note: 8 scripts return a pan that alternates between odd and even
  notes, one a constant pan; the others return the centre. The function
  depends on the note number only.

The functions are code, not data: sums and products of envelopes, cents
times factors, dB times dB, `if` on slider thresholds. Three combis read
an envelope of another channel, two pass values through `tmp` from one
channel to the next.

## The interface to the engine

`AudSamplerJavascriptInterface` (Objective-C++, JavaScriptCore):

- Once per audio buffer of channel 0 (about 5 ms, roughly 94 ticks per
  beat at 120 BPM) a thread of its own — not the audio thread — sets
  `sampler.time` to a beat-grid point inside the next buffer, calls
  `sampler.update()`, then reads cutoff, resonance, gain and pan of
  channels 0 to 2. It schedules them on Apple's LowPass filter and
  mixer at the buffer offset: one step per buffer, no smoothing.
- Range rules, not clamps: cutoff outside 10 Hz to sr/2 becomes sr/2;
  resonance outside −20 to 40 dB becomes 2 dB; a gain above 0 dB (linear
  above 1) becomes 0 dB; a pan outside −1 to 1 becomes the centre;
  NaN and exceptions become these defaults. Several presets rely on it,
  e.g. a product of two dB values that turns positive acts as a gate.
- `noteOnPanorama(note)` runs at every note-on on the calling thread;
  the velocity is not passed. The pan is unchecked.
- Only CC 74 reaches the scripts. It comes from the YPad fader (all
  three channels, relative) or from external MIDI.
- `reverb.dryWet()`, `delay.dryWet()`, `Oscillator`, `minVal`/`maxVal`
  exist but nothing reads or uses them.

## The engine around the scripts

- Per channel: voices → Apple LowPass (2-pole, after the sum of the
  voices) → mixer bus with gain and pan. The scripts act on the channel,
  not on the voice.
- Master: a delay scaled by the tempo, a reverb, a peak limiter; the
  Link Edition default loads `AUD002021_3_HighReverb.preset`.
- 32 voices shared by all channels, no voice stealing; velocity −16 dB
  at 0 to +4.3 dB at 127; linear attack and release.
- There is no native LFO: all modulation is the scripts'.
- Link: LinkKit with quantum 4; the beat time is compensated for the
  output latency.

## What the new engine offers

- `aud_dsp_sampler` (sfizz) plays the samples as SFZ with per-voice
  filters (`fil_type=lpf_2p`) and maps controllers onto cutoff, volume,
  amplitude and pan (`*_onccN`, 512 controllers, float values via
  `AudControlEvent`).
- sfizz's own LFOs (`lfoN_*`) reproduce about 29 of the 73 envelopes
  closely: two-level alternations as sines, `plateau` as held steps. The
  eased multi-point curves, the jumps of `pulse` and the ramps, the
  products and the range rules have no SFZ form. Beat-synced LFOs follow
  the transport only while it plays; otherwise they run free from each
  note-on.
- The graph connects event outputs to event inputs
  (`aud_graph_connect_events`); a node with `AUD_NODE_CAP_EVENT_OUTPUT`
  can send `AUD_EVENT_CONTROL` to the sampler nodes, sample-accurate.
- The transport snapshot per block (time-001) gives the beat position;
  the internal clock is the default provider, Link (link-001) plugs in
  later. The Audanika app does not start the transport today.
- No package of the family runs JavaScript or any other script language.

## What holds

- The scripts run in Node unchanged with a stub `sampler`; Node is a
  reference to check any port against.
- The scripts depend on beat time, the slider and their own state only.
  The note pan depends on the note number only, so it can become a pan
  per key in the SFZ.
