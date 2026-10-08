# Topic: sfizz as the sampler core

Research for R19, sources fetched 2026-10-07.

## Facts

- License BSD-2-Clause. The repository `sfztools/sfizz` was archived on
  2026-06-21 (last push 2025-03-17); `sfizz-ui` (AU, LV2, Pd, VST3
  plugins) is archived too. The `audanika` GitHub organization already
  holds forks of both (sfizz-ui work by Thomas Lieb, 2026-09).
- Releases: 1.2.3 (2024-01-14) latest; 1.2.2 split library and UI;
  1.2.0 brought WASM via an `emscripten` branch and multiple stereo
  outputs.
- C API (`sfizz.h`): create/free synth, load SFZ from file or string,
  Scala tuning, sample rate / block size / voices / preload size / sample
  quality, note on/off, CC and high-resolution CC, pitch wheel,
  aftertouch, BPM, time signature and position, `render_block`, region
  and voice queries, label and midnam export, freewheeling, and an
  OSC-like message API (`sfizz_send_message(path, signature, args)` with
  receive and broadcast callbacks) that fits R10.
- Threading contract in the header: RT functions only from the
  real-time thread, CT functions from the control thread (may block,
  e.g. `load_file`, `set_num_voices`), OFF functions never while an RT
  call is running; at most two concurrent tasks.
- Dependencies when built with dr_libs (default): Abseil (Apache-2.0,
  NOTICE handling), atomic_queue (MIT), ghc filesystem (BSD-3), hiir
  (WTFPL), KISS FFT (BSD-3), Surge tuning library (MIT), pugixml (MIT),
  cephes (BSD-3), cpuid (BSD-3), simde (MIT), jsl (BSL-1.0),
  st_audiofile (BSD-2), spline (BSD-3), threadpool (zlib), dr_libs
  (public domain / MIT-0). `SFIZZ_USE_SNDFILE` would pull libsndfile
  (LGPL-2.1) — stays off. Faust-derived effects carry STK-4.3 and
  LGPL-with-exception terms — only the STK-4.3 and MIT ones may stay
  (license-002).
- SIMD through simde (portable SSE/NEON). Official platforms: Linux,
  Windows, macOS; WASM via the emscripten branch; iOS and Android builds
  are unproven (only an Apple flag fix found); a clang-19 build break
  was reported.
- SFZ format: free to use for free and commercial applications;
  headers `<region>`, `<group>` (v1), `<control>`, `<global>`,
  `<curve>`, `<effect>` (v2), `<master>`, `<midi>` (ARIA); sfizz covers
  SFZ v1 fully and v2 partially.

## What holds for aud_dsp_sampler

- Take the engine from the audanika fork, strip the plugin and UI
  layers, keep the library with its permissive dependency set, build it
  with the package's build hook per platform and into the web module.
- Wrap the C API as a graph node: audio outputs (one or more stereo
  pairs), an event inlet for notes, CCs and pitch bend, parameters for
  the control-thread settings, the message API mapped onto node routes.
- Loading (CT) runs on a worker thread the engine owns, never on the
  audio thread; the node reports load progress as events.
- Risk: the first iOS and Android builds and the maintenance of the
  fork (the upstream is archived) are our own work; schedule a spike.

## Sources

- https://github.com/sfztools/sfizz (LICENSE, README, releases, src/sfizz.h, external/)
- https://github.com/sfztools/sfizz-ui
- https://github.com/audanika/sfizz, https://github.com/audanika/sfizz-ui
- https://sfzformat.com/, https://sfzformat.com/headers/, https://sfz.tools/sfizz/
- https://github.com/mackron/dr_libs
