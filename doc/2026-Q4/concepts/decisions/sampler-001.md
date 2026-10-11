# sampler-001: sfizz, forked, as the SFZ sampler core

- Status: proposed
- Date: 2026-10-07
- Canonical source: topics/sfizz.md (R19)
- Open work: none. The fork builds for iOS and Android (ticket 5); the
  Faust audit, the node, its loaders and the message API are done in
  ticket 25 (sampler-002, sampler-003, license-003)

## Decision

`aud_dsp_sampler` embeds the sfizz library from the `audanika/sfizz` fork
(BSD-2-Clause; upstream archived 2026-06) as a graph node: audio outlets, an
event inlet, control parameters and sfizz's message API mapped onto node routes.
It is built with dr_libs (MIT-0), never with libsndfile (LGPL), keeps the
permissive dependency set with their notices (Abseil's NOTICE included), and
keeps Faust-generated effects only where the source functions are STK-4.3 or
MIT. Loading runs on an engine-owned worker thread; rendering follows
sfizz's RT/CT/OFF contract. Audanika maintains the fork. DunneAudioKit's
CoreSampler is not part of the plan; it may become a lightweight second
node of this package later (decided 2026-10-08).

## Why

- sfizz is the most complete permissive SFZ engine and already has a
  WASM branch; the Audanika team works with the fork.
- The upstream is archived, so maintenance is ours either way.
