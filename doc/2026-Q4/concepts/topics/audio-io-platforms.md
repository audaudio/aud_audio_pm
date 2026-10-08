# Topic: audio IO per platform and the IO libraries

Research for R5 and R14, sources fetched 2026-10-07. What each platform
offers for low-latency, multi-channel, full-duplex audio, and which
permissively licensed libraries cover several platforms.

## Apple (iOS, macOS)

- Buffer size: `AVAudioSession.setPreferredIOBufferDuration`; Apple
  documents 256 frames as the minimum but says hardware may allow less
  (64 to 128 frames are reported in the field, unverified).
- Channels: `setPreferredOutputNumberOfChannels` up to
  `maximumOutputNumberOfChannels` of the current route; the
  `.multiRoute` category drives several outputs at once;
  `setSupportsMultichannelContent` (iOS 15) lets the system spatialize
  multichannel content. Object-based Atmos rendering is not exposed to
  third-party engines (unverified).
- Real-time threads join the device's Audio Workgroup
  (`os_workgroup_join`, `kAudioOutputUnitProperty_OSWorkgroup`,
  iOS 14 / macOS 11); auxiliary render threads must join it too. This
  matters for our worker pool (R8).
- macOS: aggregate devices via `AudioHardwareCreateAggregateDevice`;
  buffer size via `kAudioDevicePropertyBufferFrameSize`; no documented
  minimum (14 to 32 frames on built-in devices, unverified).
- Background audio: `UIBackgroundModes` `audio` plus the `.playback`
  category; not available on macOS.
- iOS 26 adds `AVInputPickerInteraction` and first-order Ambisonics
  capture.

## Android

- AAudio (API 26+): `LOW_LATENCY` performance mode, `EXCLUSIVE` or
  `SHARED` sharing, MMAP data path; channel masks since API 32 (Oboe
  names masks up to 9.1.6, 16 channels); hardware channel count query
  API 34; MMAP policy and device-ids API 36 (Android 16). The framework
  mixer passes 12 PCM channels by default (`FCC_LIMIT`, OEMs may raise
  it to 24 or 26).
- Oboe 1.11.0 (2026-09-15), Apache-2.0: AAudio with OpenSL ES fallback
  below API 27, automatic latency tuning, routing-changed callback,
  full-duplex helper, 16 KB page support. OpenSL ES is deprecated.
- Google Play demands 16 KB page support for apps targeting Android 15+
  (NDK r28+ links aligned by default).

## Windows

- WASAPI shared mode with `IAudioClient3` periods: the inbox HDAudio
  driver allows 128 to 480 frames (2.7 to 10 ms at 48 kHz), engine
  latency about 1.3 ms; Microsoft now rates shared mode as comparable to
  exclusive mode and recommends trying it first. Exclusive mode stays for
  bit-exact output and custom sample rates. Shared-mode streams must
  match the mix format; channel positions come from
  `WAVEFORMATEXTENSIBLE.dwChannelMask`. Render threads use MMCSS
  "Pro Audio" or the Real-Time Work Queue API.
- ASIO SDK 2.3.4 (2025-10-15): since 2025-10-29 offered under GPLv3 in
  addition to Steinberg's proprietary license. It cannot be bundled into
  a permissive package; it fits only as an optional, separately licensed
  backend.

## Linux

- PipeWire is the target: 1.6.0 (2026-02-19) raised the channel limit to
  128, quantum 32 to 8192 frames, default 1024 at 48 kHz; apps reach it
  natively or through its ALSA, PulseAudio and JACK compatibility
  layers. JACK2 is frozen at 1.9.22 (2023). alsa-lib 1.2.16.1 (2026-06).

## Web

- AudioWorklet is available everywhere (Safari since 14.1). The render
  quantum is 128 frames; Web Audio 1.1 adds `renderSizeHint` (64 to
  2048, powers of two), shipped in Chrome 153 (2026-09), not yet in
  Safari or Firefox. `latencyHint: "interactive"` asks for the lowest
  glitch-free latency; `baseLatency` and `outputLatency` report it.
- Channels: `destination.maxChannelCount`; input via `getUserMedia`
  constraints. Output device selection is split: `setSinkId` in Chromium
  only, `selectAudioOutput` in Firefox only, nothing in Safari — a
  capability flag, not a given.
- `SharedArrayBuffer` needs a secure, cross-origin isolated context:
  `Cross-Origin-Opener-Policy: same-origin` plus
  `Cross-Origin-Embedder-Policy: require-corp` (or `credentialless`);
  Safari since 15.2; the WebKit bug that broke sharing with worklets was
  fixed in 2022.
- Emscripten 6.0.11 (2026-10-06); Wasm Audio Worklets since 3.1.32
  (`-sAUDIO_WORKLET -sWASM_WORKERS`, callbacks must not block, one
  processing thread per context). Open issue 25788: two Emscripten
  modules on one AudioContext corrupt each other — one Wasm module per
  AudioContext.

## Cross-platform libraries

| Library | License | Version | Backends | Web |
| --- | --- | --- | --- | --- |
| miniaudio | public domain or MIT-0 | 0.11.25, 2026-03 | WASAPI, DirectSound, WinMM, CoreAudio, ALSA, PulseAudio, JACK, sndio, OSS, AAudio 8.0+, OpenSL, Web Audio, custom | ScriptProcessorNode; its AudioWorklet path was non-functional per the 0.11.22 notes |
| cubeb | ISC | rolling, 2026-09 | PulseAudio, AudioUnit, WASAPI, AAudio, OpenSL (tier 1); ALSA, JACK (tier 3) | none |
| SDL3 audio | zlib | 3.4.18, 2026-10 | native pipewire, aaudio, coreaudio, wasapi, alsa, jack, emscripten and more | ScriptProcessorNode |
| RtAudio | MIT-style | 6.0.1, 2023; commits 2026 | ALSA, JACK, PulseAudio, OSS, CoreAudio, DirectSound, ASIO, WASAPI | none; no Android |
| PortAudio | MIT-style | v19.7.0, 2021; master active | alsa, asio, coreaudio, dsound, jack, oss, pulseaudio, wasapi, wdmks | none; no Android |
| libsoundio | MIT | dormant since 2023 | JACK, PulseAudio, ALSA, CoreAudio, WASAPI | none |
| Oboe | Apache-2.0 | 1.11.0, 2026-09 | AAudio, OpenSL ES | Android only |

- miniaudio: device enumeration, duplex (same rate on both sides),
  notifications, resampling, channel mapping, a low-level device API
  below its own node graph and engine.
- cubeb: device collection change callbacks, 1 to 8 channels with
  layouts, reclocked full duplex.
- SDL3: hot-plug events, stream model with mixing, layouts to 7.1.
- Sample-rate conversion: libsamplerate (BSD-2-Clause, 0.2.2 of 2021),
  r8brain-free-src (MIT, 7.6), speexdsp (BSD-3-Clause, 1.2.1).

## What was tried in Dart

- flutter_soloud 5.1.6 (MIT): SoLoud plus miniaudio over `dart:ffi` on
  all six platforms; on the web an Emscripten build that renders in an
  AudioWorklet when the page is cross-origin isolated and falls back to
  a single-threaded ScriptProcessorNode build otherwise.
- coast_audio 1.0.0 (MIT): a Dart node graph on miniaudio, no web,
  dormant for two years.
- flutter_recorder (Apache-2.0, miniaudio capture, six platforms),
  minisound and miniaudio_dart (MIT, high-level playback),
  baremetal_audio (Apache-2.0, lock-free C++17 engine, iOS/Android),
  audio_graph (MIT, AVAudioEngine/AudioTrack plugin, dormant).

## What holds for aud_audio_io

- No library covers all six platforms with a working AudioWorklet path
  under a permissive license; the web needs our own worklet host.
- Strategy (io-001, io-002): miniaudio's low-level device API as the
  common backend on macOS, iOS, Windows and Linux; Oboe directly on
  Android (decided 2026-10-08: timestamps, channel masks, MMAP, latency
  tuner); native escape hatches where they buy latency or channels —
  AUHAL with workgroups and aggregate devices on macOS, `IAudioClient3`
  periods on Windows — plus an Emscripten Wasm Audio Worklet host on the
  web and ASIO as an optional, separately licensed backend.
- Channel ceilings to design for: Android 12 (mixer), iOS per route,
  Windows the mix format in shared mode, web `maxChannelCount`, macOS
  and PipeWire effectively unlimited.

## Sources

- https://developer.apple.com/documentation/avfaudio/avaudiosession/setpreferrediobufferduration(_:)
- https://developer.apple.com/documentation/avfaudio/avaudiosession/setpreferredoutputnumberofchannels(_:)
- https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/multiroute
- https://developer.apple.com/documentation/audiotoolbox/adding-parallel-real-time-threads-to-audio-workgroups
- https://developer.apple.com/documentation/coreaudio/audiohardwarecreateaggregatedevice(_:_:)
- https://developer.apple.com/videos/play/wwdc2025/251/
- https://developer.android.com/ndk/guides/audio/aaudio/aaudio
- https://developer.android.com/ndk/reference/group/audio
- https://source.android.com/docs/core/audio/aaudio
- https://android.googlesource.com/platform/system/media/+/refs/heads/main/audio/include/system/audio.h
- https://github.com/google/oboe (releases, LICENSE, docs/FullGuide.md)
- https://developer.android.com/guide/practices/page-sizes
- https://learn.microsoft.com/en-us/windows-hardware/drivers/audio/low-latency-audio
- https://learn.microsoft.com/en-us/windows/win32/coreaudio/exclusive-mode-streams
- https://learn.microsoft.com/en-us/windows/win32/coreaudio/device-formats
- https://ocl-steinberg-live.steinberg.net/_storage/asset/819253/storage/master/Press%20Release%20-%202025-10-29%20-%20VST%203.8%20-%20EN.pdf
- https://www.steinberg.net/asiosdk
- https://docs.pipewire.org/page_overview.html
- https://raw.githubusercontent.com/PipeWire/pipewire/master/NEWS
- https://www.w3.org/TR/webaudio-1.1/
- https://developer.chrome.com/release-notes/153
- https://caniuse.com/mdn-api_audiocontext_setsinkid
- https://caniuse.com/mdn-api_mediadevices_selectaudiooutput
- https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated
- https://emscripten.org/docs/api_reference/wasm_audio_worklets.html
- https://github.com/emscripten-core/emscripten/issues/25788
- https://github.com/mackron/miniaudio (releases, LICENSE, README)
- https://miniaud.io/docs/manual/index.html
- https://github.com/mozilla/cubeb (LICENSE, README, include/cubeb/cubeb.h)
- https://github.com/libsdl-org/SDL (LICENSE.txt, src/audio)
- https://github.com/thestk/rtaudio (LICENSE, README)
- https://github.com/PortAudio/portaudio (LICENSE.txt, src/hostapi)
- https://github.com/andrewrk/libsoundio
- https://github.com/libsndfile/libsamplerate, https://github.com/avaneev/r8brain-free-src, https://github.com/xiph/speexdsp
- https://pub.dev/packages/flutter_soloud, https://pub.dev/packages/coast_audio
