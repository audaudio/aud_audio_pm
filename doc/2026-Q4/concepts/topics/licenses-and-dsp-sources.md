# Topic: license policy and the DSP source pool

Research for R26 and R27, sources fetched 2026-10-07. Which licenses the
`aud_audio` packages may copy from, link against, or must avoid, and
what every copy obliges us to.

## License classes

| Class | Licenses (SPDX) | Rule |
| --- | --- | --- |
| Copy | MIT, MIT-0, BSD-2-Clause, BSD-3-Clause, Apache-2.0, ISC, Zlib, Unlicense, CC0-1.0, BSL-1.0, WTFPL, LicenseRef-STK-4.3, LicenseRef-FFTPACK | Copy with the original header and a notice entry; Apache-2.0 additionally propagates NOTICE files |
| Not used | LGPL-2.1, LGPL-3.0 | Neither copied nor linked, on any platform (license-002); a permissive alternative is found or the algorithm re-implemented from the literature |
| Separate package, separate license | GPL-2.0-or-later or proprietary (Ableton Link), GPL-3.0 or proprietary (ASIO SDK) | Isolated in `aud_audio_link` / an ASIO backend package, never in the engine; not redistributed but fetched at build time, with a notice that app publishers need their own license (link-002) |
| Never | GPL-3.0-only, AGPL-3.0, CC-BY-NC, proprietary without agreement | Model only, no code |

- The aud_audio packages themselves are MIT with Audanika as the
  copyright holder (license-002).
- Why LGPL is out entirely: the owner excluded it on 2026-10-07. The
  technical reasons point the same way: the relink clause needs object
  files or a shared-library mechanism, which code-signed iOS bundles and
  single Wasm modules (Emscripten dynamic linking is experimental with
  pthreads) cannot offer, and GPL code is "not compatible with the iOS
  App Store" (Ableton on GPL Link).
- CC licenses are unsuitable for software even when they allow
  commercial use; CC-BY-NC excludes it outright.
- Dual-licensed SDKs: Ableton Link (GPL-2.0-or-later, proprietary on
  request from link-devs@ableton.com, price unpublished; LinkKit for
  iOS under the free Link SDK license), ASIO SDK 2.3.4 (GPLv3 since
  2025-10 or Steinberg's proprietary agreement). VST3 is MIT since 3.8
  and no longer a case.

## Notices

- Every package ships `THIRD_PARTY_NOTICES.md` (copyright line, SPDX id,
  license text, origin URL and commit of each copied file set) and
  keeps the original headers in copied files.
- Flutter collects pub dependencies' LICENSE files into a NOTICES asset
  but knows nothing about C++ code; native notices are registered with
  `LicenseRegistry.addLicense` so `showLicensePage` shows them.
- Trademark lines where required ("VST is a registered trademark of
  Steinberg Media Technologies GmbH."; "Mutable Instruments" and
  "Vital" names may not be used).
- A CI check (per repo) lists copied third-party directories and fails
  when a file lacks a notice entry (ticket: tooling).

## DSP source pool

| Source | License | Status | Verdict |
| --- | --- | --- | --- |
| AudioKit, AudioKitEX, DunneAudioKit, STKAudioKit, Flow, PianoRoll | MIT | active | copy |
| DevoloopAudioKit | MIT | active | copy Rhino and DynaRage after the unattributed helper files are clarified or replaced |
| The Amazing Audio Engine 1 and 2 | zlib-style | retired 2016 | copy with notice; never its sample app |
| Pure Data, libpd | BSD-3-Clause (Standard Improved BSD) | active | copy |
| Soundpipe, SoundpipeAudioKit | MIT on paper; Csound-derived and Zita-derived modules carry no license header and no relicensing evidence | archived 2024-01 | audit per module: the Csound- and Zita-derived ones are never copied — re-implement from the literature or use alternatives; copy the rest |
| STK (thestk/stk) | MIT-style, LicenseRef-STK-4.3 | active | copy |
| sfizz | BSD-2-Clause | archived 2026-06 | fork and copy, dr_libs instead of libsndfile |
| Freeverb | public domain | historic | copy |
| Airwindows | MIT | read-only | copy |
| chowdsp_wdf | BSD-3-Clause | active | copy |
| chowdsp_utils | per module: Common BSD, DSP/GUI GPLv3 | active | copy Common only, verify each module header |
| Signalsmith DSP, Signalsmith Stretch | MIT | active | copy; Stretch is the time-stretch core of aud_dsp_stretch |
| Rubber Band, SoundTouch, élastique | GPL or commercial; LGPL; commercial | active | never (license-002) — Signalsmith Stretch instead |
| pffft | FFTPACK BSD-like, LicenseRef-FFTPACK | active | copy (SIMD incl. WASM-SIMD) |
| kissfft | BSD-3-Clause | active | copy |
| muFFT | MIT core; bench/test GPLv2+ | active | copy core only |
| Mutable Instruments eurorack | MIT (STM32 code), GPL-3.0 (AVR), CC-BY-SA (hardware) | read-only | copy STM32 DSP with renamed branding |
| Resonance Audio (Google) | Apache-2.0 | archived | copy for aud_dsp_spatial; propagate NOTICE; verify the HRTF data license |
| dr_libs, stb_vorbis | public domain or MIT-0 / MIT | active | copy for aud_audio_file |
| libvorbis, libogg, libopus, libFLAC, WavPack | BSD-3-Clause (libFLAC's command-line tools are GPL and stay out) | active | copy or link for aud_audio_file |
| Faust-generated code | per library function: STK-4.3, MIT, LGPL-with-exception, some GPL-3.0-only | active | copy only from STK-4.3 / MIT functions (LGPL-with-exception excluded by license-002); read every `declare license` |
| Faust compiler | LGPL-2.1 | active | a build tool of which nothing is shipped; whether to use it at all is part of the Faust suggestion in the plan |
| Csound | LGPL-2.1 | active | never; algorithms re-implemented from the literature where needed |
| libsndfile, liblo | LGPL-2.1 | active | never; dr_libs, and tinyosc or oscpack, instead |
| Surge XT, sst-filters, sst-basic-blocks | GPL-3.0 (three MIT headers in basic-blocks) | active | never (except the MIT headers) |
| Vital | GPL-3.0 | active | never |
| Zita convolver / resampler | GPL-3.0-or-later | active | never |
| KFR | GPL-2.0-or-later or commercial | active | never, or buy |
| FFTW | GPL-2.0-or-later or commercial | active | never, or buy |

## Sources

- https://spdx.org/licenses/
- https://www.apache.org/licenses/LICENSE-2.0
- https://www.gnu.org/licenses/gpl-faq.html, https://www.gnu.org/licenses/lgpl-3.0.txt
- https://www.fsf.org/news/2010-05-app-store-compliance
- https://emscripten.org/docs/compiling/Dynamic-Linking.html
- https://creativecommons.org/licenses/by-nc/4.0/legalcode.en, https://creativecommons.org/faq/
- https://api.flutter.dev/flutter/foundation/LicenseRegistry-class.html
- https://raw.githubusercontent.com/Ableton/link/master/LICENSE.md, https://github.com/Ableton/LinkKit
- https://www.steinberg.net/asiosdk, https://packages.msys2.org/base/mingw-w64-asiosdk, https://heise.de/-10963451
- https://github.com/PaulBatchelor/Soundpipe, https://raw.githubusercontent.com/csound/csound/develop/COPYING
- https://raw.githubusercontent.com/thestk/stk/master/LICENSE
- https://github.com/AudioKit/DunneAudioKit, https://github.com/AudioKit/DevoloopAudioKit
- https://raw.githubusercontent.com/grame-cncm/faust/master-dev/COPYING.txt, https://faustdoc.grame.fr/manual/faq/
- https://raw.githubusercontent.com/grame-cncm/faustlibraries/master/reverbs.lib
- https://raw.githubusercontent.com/sinshu/freeverb/master/readme.txt
- https://github.com/Chowdhury-DSP/chowdsp_utils, https://github.com/Chowdhury-DSP/chowdsp_wdf
- https://github.com/airwindows/airwindows, https://github.com/DISTRHO/DPF
- https://github.com/surge-synthesizer/surge, https://github.com/mtytel/vital, https://github.com/pichenettes/eurorack
- https://github.com/Signalsmith-Audio/dsp, https://github.com/kfrlib/kfr, https://www.fftw.org/
- https://github.com/marton78/pffft, https://github.com/mborgerding/kissfft, https://github.com/Themaister/muFFT
