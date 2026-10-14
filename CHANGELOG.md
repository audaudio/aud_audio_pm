# Changelog

## Unreleased

### Added

- Add the plans of tickets 31 to 33 (S29c, S29d, S29e)
- Plan the SoundPrism Link Edition combis with a JavaScript modulator in an optional package
- QuickJS-ng in the C++ backend, one tick per audio buffer, measured on the reference devices
- Add the topic soundprism-link-edition
- Plan ticket 32: presets include the regions of their sample set; FLAC samples
- Plan ticket 33: a tempo control in the app
- Add tickets 31 to 33 to doc/issues.md, the ticket list and the plan of ticket 17

## 0.11.0 - 2026-10-14

### Added

- Add the plan of ticket 28 (S10a, reverb, delay and a master limiter)
- Plan the effect nodes, the master chain of an app and the numbers
- Add ticket 28 to doc/issues.md and raise the counter to 29
- process-004: Opus 5.5 at extra high effort, Fable only on request
- process-005: the standing rules of an implementation ticket
- Add the decisions of the effects and the master chain of ticket 28
- dsp-002: the reverbs and delays of aud_dsp_effects as independent nodes, their sources and the license audit
- dsp-003: the master limiter looks ahead 1.5 ms and never exceeds its ceiling
- app-003: an app plays through a master delay, reverb and limiter with effects per preset
- The open work of dsp-001, license-003 and app-001 points to the new decisions
- Add the findings and numbers of ticket 28
- The measurements of the effects and the master chain on the iOS simulator and the Android emulator
- sampler-005: the state all synths of a process share is thread-safe
- aud_dsp_sampler joined the ticket for the race that crashed the measurement
- process-005: commit every repo before gg do add adds another one
- Add the results of the code review of ticket 28
- Three findings fixed, three left with their reasons
- Add the review-light fixes of ticket 28
- Mark ticket 28 as implemented in its plan and in doc/issues.md
- Correct the peak of the sum without the chain to +7.1 to +7.6 dBFS in the plan and app-003
- Point the plan to dsp-002, dsp-003, app-003 and sampler-005; add lifecycle-002 and sampler-002 to Rests on
- Match the index rows of dsp-002, app-003, process-005 and sampler-005 with their files
- Link the refined decisions back: dsp-001, license-003, graph-001, app-001, app-002, lifecycle-002, sampler-002, process-003, family-002, process-004
- Record S10a (ticket 28) and S29a (ticket 27) as built in the plan of ticket 17, with their results
- Wrap a line of app-003 at 80 characters
- Correct the code review in the plan and add the results of review-light
- Add the numbers of the Galaxy Tab S4 to ticket 28
- The render time of every node, the effects example and the app's dense chords on a real tablet
- A profile of the audio thread: the sampler's controller events and per-node compressors dominate, the effects take 5.8 %
- app-003 and io-002 name the cost of the per-node limiters and the audio thread on the small cores
- Add the optimized sampler and its numbers to ticket 28
- The MIDI flush and the compressor of the sfizz fork are 100 to 2500 times faster where they were hot, with the same output
- The Galaxy Tab S4 before and after: xruns and render time per preset
- sampler-006: performance changes to the fork keep its output bit for bit
- Add the removal of the per-node limiters to ticket 28
- app-004: the master limiter alone limits the app; the SFZ files carry no effect, global_volume keeps the level
- app-001 and app-003 are superseded in part
- The Galaxy Tab S4 without the per-node limiters: xruns and render time per preset
- Add the plans of tickets 29 and 30 (S9b, S9c)
- Ticket 29: a voice budget per device that follows the load, so that playing hard never drops out
- Ticket 30: faster sampler voices with SIMD on ARM, a voice loop over the sounding voices only, and the audio thread on the big cores
- Add both to doc/issues.md and raise the counter to 31; S9b and S9c in the plan of ticket 17
- Add sampler-007: the sfizz fork may change its output within the golden tolerance
- Optimizations of the fork may change the samples by up to 1e-5 of full scale; the bit-exact rule of sampler-006 is superseded
- The plan of ticket 30 takes the tolerance; its first open question is answered
- Add the answers to the open questions of ticket 30
- SIMD may change the output within the tolerance of sampler-007
- The audio thread may be pinned to the big cores on Android 10 and 11
- Add the reference devices and the answers for tickets 29 and 30
- release-004: Galaxy Tab S4, iPad Pro (M5) and iPhone 16 Pro Max are the reference devices
- Ticket 29 first, then ticket 30; more battery drain on the big cores is accepted
- Add the release-build fix of the app to ticket 28
- aud_midi_windows joined the ticket: void pointers in the DNS-SD callback, so that AOT release builds compile
- The release builds ran on the Galaxy Tab S4 and on the user's iPad

## 0.10.0 - 2026-10-13

### Added

- Add the plan of ticket 27 (S29a, SFZ instruments of an app on the new engine)
- Plan the SFZ conversion, the engine service, MIDI on aud_midi and the removal of the legacy engine
- Add ticket 27 to doc/issues.md and raise the counter to 28
- Add the decisions, findings and numbers of ticket 27
- sampler-004: the sampler reads Android assets in place
- app-001: the sounds of a legacy app are rebuilt once as SFZ
- app-002: an app routes its MIDI to one sampler node per channel
- Findings and measurements of the iOS simulator and the Android emulator in the plan
- Ticket 27 is implemented in doc/issues.md
- Add the results of the code review of ticket 27
- Three findings fixed, four left open with their reasons
- Add the review results to the plan of ticket 27
- aud_audio and aud_midi get patch releases for their examples
- The issue title names no repo

## 0.9.0 - 2026-10-12

### Added

- Add the plan and decisions of ticket 26 (S8, the MIDI bridge)

- Plan of ticket 26: the aud_midi ports as event inlets and outlets of the engine on iOS and Android, with the decisions of the plan review and the findings so far

- interop-003: native producers feed the graph through event sources

- midi-003: external MIDI sounds at a fixed latency of one period plus the output latency plus 1 ms

- The package graph: aud_audio_midi depends on aud_audio and aud_midi

- Add the findings of the implementation of ticket 26

- aud_midi_standard from two sources, the repos gg added, the commits before gg do add, the end packets of a cut SysEx

- Add the measurements of step 5 and midi-002

- midi-002: external MIDI reaches the audio thread through native taps

- midi-003 refined: P from the percentile of the render gaps, m per input

- The open work of midi-001, time-001, interop-002, graph-001, graph-003, lifecycle-001 and repos-001; S8 in the plan of ticket 17; the architecture

- Add the code review and the keyboard session of ticket 26

- The code review findings, the keyboard session on iPhone and tablet, midi-003 refined

- Add the long runs of ticket 26

- iPhone and Galaxy Tab S4 meet the budgets; midi-002 with the corrected late shares

- Add review fixes of ticket 26

- Add family-002: every package has a version of its own


## 0.8.0 - 2026-10-12

### Added

- Add the decisions and results of ticket 25 (S9)

- Decisions sampler-002 (the fork in place), sampler-003 (standby synth and crossfade), license-003 (Faust helpers and STK-4.3), lifecycle-002 (resources of the process), osc-002 (node messages)

- The open work of sampler-001, lifecycle-001, interop-001, osc-001, abi-001, build-001, license-001 and io-002

- Findings, code review and measurements of ticket 25 on the simulators, an iPhone 16 Pro Max and a Galaxy Tab S4; S9 built in the plan of ticket 17

- The sfizz topic: what the fork fixed; the Faust audit topic: what holds

- Add the review-light fixes of ticket 25 (S9)

- Register ticket 25, write its plan and add the Faust audit topic

- Ticket 25 in review: status, open work and open question 8 on the deviations in sampler-003 and lifecycle-002

- license-003 refines license-001 and supersedes the Faust rule of license-002, dsp-001 and sampler-001 in part; the license topic, the sfizz topic, S28 and open question 3 of ticket 17 follow

- Refines and supersedes links between sampler-001 to 003, build-001, lifecycle-001 and 002, osc-001 and 002; the S9 result and the tablet numbers for S24 in ticket 17

- sampler-001 keeps the sampler numbers on the iPad Pro M5 and a Pixel open; index rows of sampler-001, sampler-003, lifecycle-001, lifecycle-002, license-002 and dsp-001

- Plan: decision ids, affected repos, step 9, the Scala keys, readable measurements, the missing warm-up, abbreviations, line wrap

- Shorter sentences in sampler-003, lifecycle-002 and osc-002; a node message holds at most 16 arguments

- sfizz topic: load notifications, SFZ instruments as trusted input; audit topic: what the helpers compile to, the STK-4.3 notice of the fork

- Add the review results and final numbers of ticket 25

- Ticket 25 done: the review of the pull requests with 103 findings, 97 fixed, and the bugs it found

- Measurements after the review: the iPhone and the Galaxy Tab S4 after the twenty-minute warm-up of ticket 17, the simulator and the emulator; the first runs for comparison

- Open question 9: the license of Audanika code in the fork of sfizz

- io-002: the late callbacks of the tablet in the final run

- Add disk streaming as open work of sampler-003

- A ring buffer per voice, so that a voice needs the same memory whatever the length of its sample; today a note that plays holds its whole file in memory, as in sfizz

- Add the answers to questions 8 and 9 of ticket 25

- sampler-003 and lifecycle-002: Gabriel Gatzsche confirmed the deviations of the Findings

- lifecycle-002: a capacity rule over all instruments and the trim of a smaller budget on a worker as open work

- sampler-002: Audanika code in the fork is BSD-2-Clause like sfizz

- The plan: questions 8 and 9 answered, none open


## 0.7.0 - 2026-10-11

### Added

- Add the spike S0-plugin-ui and plugin-003 (ticket 24)

- Register ticket 24 and plan the spike of a Flutter editor for the plugin shells

- Record the implementation, the results in REAPER, the test host and on the iPad, and the code review

- Add plugin-003 (proposed): Flutter out of process on macOS, in the extension on iOS

- Add ui-003 (proposed): the engine adapters of the UI packages in a binding package

- Link plugin-001, ui-001 and ui-002; update the decisions index, ticket 17 and the plugin-formats topic

- Add the reruns of the spike S0-plugin-ui (ticket 24)

- Record the reruns in REAPER after the code review's fixes: B, idle CPU, four editors, pairs, cycles and the soak

- Record B's teardown crash and its workaround; refresh plugin-003's numbers and the plugin-formats topic

- Add plugin-004 and the review of the pull requests

- Split the symbol hygiene of every plugin binary into plugin-004 (proposed)

- Correct the CPU and latency claims, the numbers of the reruns and the status of ticket 24

- Add the open questions, the review of the pull requests and the items deferred to S18 and S17a

- Mark proposed decisions as proposed and add the open work of plugin-002 from ticket 24


### Changed

- Mark ticket 24 as done

- The embedding checklist in REAPER and Live and the cycles in Live stay open


## 0.6.0 - 2026-10-09

### Changed

- Plan the spike for a Flutter UI in plugin shells (ticket 23)
- Record the review of ticket 23 in its plan

## 0.5.0 - 2026-10-09

### Changed

- Plan and record the aud_audio engine (ticket 22, S4)
- Load the test package as a library of its own

## 0.4.0 - 2026-10-09

### Changed

- Plan and record ticket 21 (S3 audio IO)
- Register ticket 21 in doc/issues.md and the tickets index
- Write the plan with the decisions of its review, the implementation, the measurements and the findings
- Mark S3 built in the plan of ticket 17
- Update the open work of io-001, io-002, time-001 and lifecycle-001
- Mark ticket 21 in review and format its changelog entry

## 0.3.0 - 2026-10-09

### Changed

- Plan and record the headless host (ticket 20)

- Write the plan of ticket 20 with its decisions, steps and findings

- Mark S2 done in the plan of ticket 17

- Update the open work of plugin-002, interop-002 and lifecycle-001

- Link the plan from doc/issues.md and the tickets index


## 0.2.0 - 2026-10-08

### Changed

- Plan and record the audio graph (ticket 19)

- Add the S2 plan with the review decisions, the steps and the findings

- Register tickets 19 and 20 (S2b, split off) in doc/issues.md

- Decide scope-002: no backward compatibility with the existing app

- Drop the aud_midi bridge fallback from S8, S29b and release-002

- Update the open work of graph-001, graph-003, interop-002, lifecycle-001, plugin-002

- Plan and record the audio graph (ticket 19)


## 0.1.0 - 2026-10-08

### Changed

- Plan the core contracts of aud_audio_core (ticket 18, step S1)
- Update the open work of abi-001, time-001, osc-001, graph-002 and
license-001
- Mark S1 as done in the plan of ticket 17

## 0.0.4 - 2026-10-08

### Changed

- Plan and record the mobile spike (ticket 5)
- Number the tickets in the project management repo

## 0.0.3 - 2026-10-08

### Changed

- Mark ticket 17 as done and S0-mobile as next

## 0.0.2 - 2026-10-08

### Changed

- Create the repos of the aud_audio family

## 0.0.1 - 2026-10-08

### Added

- Add boilerplate
- Plan the Audanika Audio Engine aud_audio (ticket 17)

### Changed

- First architecture iteration
- Harden the engine contracts after the external review
- Bound the first release and resequence the plan
- Order the plan by Audanika's priorities
- Create all repos up front with git references

## 0.0.0 - 2026-10-07

- Initial boilerplate
