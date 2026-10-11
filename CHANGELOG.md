# Changelog

## Unreleased

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
