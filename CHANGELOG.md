# Changelog

## 0.18.1 - 2026-10-29

### Added

- Add the blog post on examples that show their own package

### Changed

- Plan decouple_aud_audio_midi and the rename follow-up
- Propose placeholder app IDs in every example
- Plan moving the example keyboard to aud_audio_ui_keyboard

## 0.18.0 - 2026-10-28

### Changed

- Require Dart 3.13 and upgrade the dependencies

- Require Dart 3.13

- Upgrade dna_audanika to ^0.1.0

- Add the quick check pipeline name to dna/_vars.json

- Add the blog post of this change, in English and German

- Bring the README to the README template, in English and German

- Upgrade the dependencies published since the first pass

- Lift the lock file to the newest resolvable versions

## 0.17.0 - 2026-10-26

### Changed

- Record the TestFlight release of ticket 65

## 0.16.0 - 2026-10-26

### Changed

- Plan ticket 64, the AUv3 on macOS and iOS, and its gate
- Record the AUv3 shell, the iOS gate and decision plugin-013
- Record steps 7 and 9 of ticket 64 and their findings
- Plan ticket 65 with the open steps of ticket 64
- Renumber the AUv3 tickets to 64 and 65, narrow 55
- Bring plans and decisions up to date with the review

## 0.15.0 - 2026-10-25

### Changed

- Plan ticket 41 and accept the framework requirements
- Sharpen the acceptance of the framework requirements

## 0.14.0 - 2026-10-25

### Added

- Add the architecture review and the plan of ticket 40
- Add the German README lines of the review of ticket 40

## 0.13.3 - 2026-10-24

### Added

- Add the plan of the VST3 plugin on Windows
- Add the editor settings to ticket 38 and app-010

### Changed

- Plan ticket 39: UDP loss of Dart processes on Windows
- Plan the Windows audio device of ticket 38

### Fixed

- Record the app listening check and the sampler stall

## 0.13.2 - 2026-10-22

### Added

- Add the plan of ticket 37 (S18, the Audanika Mac app with its VST3 plugin inside), the requirements of the area mac and the decisions plugin-005 and release-005

- Add the findings of step 2 and of the gate of ticket 37

- Add the findings of the steps 4 and 5 of ticket 37 and the decision io-004

- Add the findings of the steps 6 to 8 of ticket 37 and the decisions plugin-006 and app-009

- Add the decisions recorded so far to the plan of ticket 37

- Add the editor decisions plugin-007 and app-010 (ticket 37)

- plugin-007: socket pair on fd 3, frames under app group Mach names

- app-010: the editor plays through the plugin, notes go to the DAW

- Findings of steps 9 and 10 in the plan of ticket 37

- Add the findings of steps 12 and 13 of ticket 37

- The plugin and its editor in the app, signed inside out

- The step Use in DAWs in the main menu of the Mac app

- The archive of the release lane; export and upload wait for the go

- Add the validation of the Mac app with its plugin

- Export signed for App Store Connect, the package validates

- Open question 1 settled; TestFlight with the nested editor open

- Add the upload of the Mac app build 168

- Build 168 uploaded on the go of the user and processed as valid

- TestFlight state of the nested editor still to be seen

- Add the TestFlight state of the Mac app build 168

- Build 168 ready for internal testers, no warning on the nested editor

- plugin-007 open work moves to App Review

- Add the activation of the TestFlight build of the Mac app

- The step Use in DAWs placed the link to the plugin in the app

- Add the finding of the frozen editor in Cubase

- Surfaces kept in use by another process stopped the frames

- Replacement and renewal of surfaces, diagnostics in the unified log

- Add the finding of the editor crash on a resize

- Nested frame changes aborted the editor; places now wait

- The plugin ends the notes of an editor that ended

- Add the finding of the editor in full screen mode

- Occlusion paused the editor, and Flutter stopped frames of a hidden app

- The plugin no longer pauses on occlusion; the engine ignores app occlusion

- Add the Cubase verification of the editor fixes

- Full screen, resizing and Hold confirmed in Cubase 15

- plugin-007 lists the rules that keep the editor drawing in a DAW

- Add the upload of the Mac app build 169

- Build 169 with the Cubase fixes uploaded and processed as valid

- Add the TestFlight state of the Mac app build 169

- Build 169 with the Cubase fixes ready for internal testers, no warning

- Add the VST3 shell to the architecture (ticket 37)

- Plugin shells: the generic VST3 shell, the editor and the distribution of S18

- The documentation step of ticket 37 in its plan

- Add the implementation state of ticket 37 to its decisions

- Ticket 37 implemented, with the checks still open

- plugin-005, plugin-006 and their index rows without the open work ticket 37 settled

- release-001 refined by release-005

- app-010 cites req-mac-003 and req-mac-004

- Add the findings of the review of ticket 37

- The review's blockers and follow-ups, and the three faults found on the way: the order of equal events, the note offs behind nodes that pass events on, a loss that closed a reopened device

- The repos that changed on the way: graph, core and midi

- Add the library of the editor and the extension VST3

- app-010: the editor shows the library with the free and the bought albums, whose product IDs the app shares through its app group; the store stays in the app

- The plan of ticket 37 records the user requests at the publish: the extension VST3 with its button Install VST, and the library in the editor

- Add the finding of the editor in Cubase on macOS 27

- macOS 27 stops the display link of an occluded window; the editor stood still in Cubase while its notes played

- The surface windows lie above the DAW and on every Space; the test host draws again, also with --occlude

## 0.13.1 - 2026-10-19

### Added

- Add the plan of ticket 36: Android release builds start again

- shared_preferences_android 2.5.0 calls its Kotlin side through JNI; in a release build the call fails and the app waits on its splash screen

- Plan an R8 keep rule in the app, checked by a release build on the Galaxy Tab S4

- Add the findings of ticket 36

- R8 renamed the Kotlin classes that shared_preferences_android 2.5.0 and package:jni 1.1.0 reach by name through JNI

- A keep rule in the app fixes it; the gap belongs upstream

- Add the open work of ticket 36

- A release build smoke test belongs to the release checklist

- Add decision app-008 on the release build keep rules

- Name the goal, the requirements, the Kotlin keep rules and the done steps in the plan of ticket 36

- Add app-008 to the decision index

- Add the iOS purpose string and release notes to ticket 36

## 0.13.0 - 2026-10-19

### Added

- Add the plan check of ticket 31 and the package aud_audio_script

- Record the plan check against tickets 29, 30 and 32 in the plan

- Add aud_audio_script to packages.jsonc

- Let create-family-repos.js take dependency ranges per package and let the solver pick the native packages of the template

- Add aud_audio_script to the architecture and fold ticket 32 into ticket 31

- Add the package and its worker to architecture.md, the package graph and the plan of ticket 17

- Record that ticket 32 is done as part of ticket 31 and that the simulators come before the performance tests

- Add decision script-001: JavaScript in an optional node with a worker of its own

- Record that aud.script.modulator runs QuickJS-ng on a worker of the node, woken by a non-blocking semaphore signal, once per audio buffer

- List it in the decision index

- Add decisions app-006, app-007 and sampler-010

- app-006: the app plays the SoundPrism Link Edition combis with their scripts behind audanika-host.js

- app-007: a sample set exists once in the content, as FLAC, and presets include it

- sampler-010: a missing include fails the load; note_offset_open_bounds keeps the outer keys

- Add the findings of ticket 31 so far and QuickJS-ng as the only engine

- Record the exact port, the lookahead of the worker, the engine comparison, the content and the mappings in the plan

- script-001: QuickJS-ng only, JavaScriptCore measured and dropped; the worker computes two blocks ahead

- Add the measurements of ticket 31 and the budget of a tick

- Record QuickJS-ng per device, the late ticks of 10 minutes on the Galaxy Tab S4, loads, memory, app size and ramp against step

- Answer open question 1: p99 at most 10 % of the device buffer, no late tick in 10 minutes; the worker on any core with a lookahead of 3

- Answer 18: the ramp

- script-001 and app-006 take the decisions

- Add the review fixes of ticket 31 to plans and decisions

- Ticket 31: implemented; channels 0 to 2 as in app-002; the first lookahead default named as such; aud_dsp_sampler's changes and app-007 and sampler-010 listed; long lines wrapped

- architecture.md: the worker computes three blocks ahead and the node sends the values in that block

- Ticket 17: aud_audio_script runs QuickJS-ng only; S29c and S29d built in ticket 31 with their decisions

- doc/issues.md: ticket 31 implemented, ticket 32 implemented in 31; ticket 32 names its decisions

- sampler-010: the chord section reaches the keys 116 to 125; script-001 and app-006 name the Findings as a source

- Link the refined decisions back: scope-002, interop-001, process-005, app-001, app-002, sampler-002, sampler-003

- packages.jsonc documents depVersions

- Add ticket 35: QuickJS-ng from the pub.dev package gg_quickjs

- Add the plan of ticket 35, done as part of ticket 31; gg_quickjs 0.1.0 came from ggsuite ticket 144

- Add decision build-002: a library several packages need may come from a published source package with a hook helper

- build-001 and script-001 point to it; packages.jsonc lists gg_quickjs as an external pub.dev dependency

- create-family-repos.js takes external pub.dev dependencies as plain version ranges

## 0.12.2 - 2026-10-15

### Added

- Add the plan review of ticket 30 (S9c, faster sampler voices on the big cores)

- Add decision io-003 of ticket 30, the audio thread on the fast cores of Android devices

- Add the plan review of ticket 34

- Add the results and decisions of ticket 30

- The findings and measurements of the plan of ticket 30 on five devices, before and after

- io-003 (the audio thread on the fast cores of Android), sampler-009 (the faster voice loop) and lifecycle-004 (the start budgets)

- The open work of io-002, sampler-007, lifecycle-003 and release-004; ticket 30 implemented in doc/issues.md

- Add the fixes of the review of ticket 30

- sampler-009 numbers its six steps as they were committed

- lifecycle-004 and io-003 take the numbers of the measurements; the mean and the most of the voices are explained

- release-004 and lifecycle-003 say how the 50 % is met; plan 17 and the ticket list show S9c as built

- Add the placement of io-003 as the code sets it

- Below Android 12 the affinity binds; one cluster keeps the system placement only below Android 12

## 0.12.1 - 2026-10-14

### Added

- Add the plan, decisions and results of ticket 29 (S9b, a voice budget by the CPU power of the device)

- The plan review: the governor in aud_audio, released voices first with a fade of 10 ms and a reserve, automatic only, voices only

- Decision 3 revised after the sweeps on the Galaxy Tab S4: the mean share steers, 75 / 72 / 85 %, not the p99

- The findings, the voice sweep, the listening check and the measurements on the Galaxy Tab S4, the iPhone 16 Pro Max, the iOS simulator and the Android emulator

- sampler-008, graph-004, lifecycle-003 and app-005, linked from lifecycle-001, lifecycle-002 and sampler-003

- The iPhone model of release-004 confirmed

- Add the fixes of the review of ticket 29

- The 50 % of release-004 is not met on the Galaxy Tab S4: recorded as open work of lifecycle-003 and in the goal of the plan

- Links from interop-001 and app-002 to lifecycle-003 and app-005; the two refinements of lifecycle-002 in one line

- The plan: the p99 at 0.69 or more, the counts of the voice columns, the unsettled Vibraphone, the dependency repos, the decisions it went into

- lifecycle-003 names the inputs of the start budgets as the code uses them; the index matches the open work of sampler-008

## 0.12.0 - 2026-10-14

### Added

- Add the plans of tickets 31 to 33 (S29c, S29d, S29e)
- Plan the SoundPrism Link Edition combis with a JavaScript modulator in an optional package
- QuickJS-ng in the C++ backend, one tick per audio buffer, measured on the reference devices
- Add the topic soundprism-link-edition
- Plan ticket 32: presets include the regions of their sample set; FLAC samples
- Plan ticket 33: a tempo control in the app
- Add tickets 31 to 33 to doc/issues.md, the ticket list and the plan of ticket 17
- Add the link from answer 5 to answer 18 in plan 31

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
