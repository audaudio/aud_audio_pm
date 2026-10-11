# Topic: Faust-generated code in sfizz

The provenance audit of sampler-001's open work for ticket 25 (S9), done on
2026-10-11 by Claude over the audanika fork of sfizz (master `824afdc`) and
the subset vendored in `aud_dsp_sampler` (`src/third_party/sfizz`). The rule
is license-002 and the table of
[licenses-and-dsp-sources.md](licenses-and-dsp-sources.md): Faust-generated
code may stay only where every Faust library function that went into it is
STK-4.3, MIT or BSD, or the author's own permissive code; "LGPL with
exception" counts as LGPL.

## Facts

- Every Faust-generated file of the fork is compiled by the subset,
  byte-identical: 52 filter headers (`src/sfizz/gen/filters`, Faust
  2.37.3), 5 effect headers (`src/sfizz/effects/gen`, Faust 2.30.5),
  `ResonantString{,SSE,AVX}` (Faust 2.20.2, hand-edited and SIMD-ported by
  Jean Pierre Cimalando, "JPC") and `Metronome` (Faust 2.27.x, inferred).
- sfizz's generator (`scripts/faustwrap.d`, only with
  `SFIZZ_RECOMPILE_FAUST=ON`) strips `metadata()`, so the generated code
  names no library version; the versions come from the `libraries`
  submodule each Faust tag pins, confirmed by code fingerprints.
- The `.dsp` sources are JPC's own (BSD-2-Clause by declaration or by the
  repository's license), except `rbj_filters.dsp`.
- `rbj_filters.dsp` is a copy of faustlibraries' `maxmsp.lib` at
  `e82f494` (2020-01-30). Its note says the RBJ filter "has been
  permissively relicensed"; in fact that commit only added Faust's
  compiled-code exception to the LGPL ("LGPL with exception"). The code was
  never STK, MIT or BSD, and is not on master either.
- Faust's library functions and their licenses, at the generating versions
  and at master (master only renames the spellings to SPDX references,
  2026-08-26):

| Function | License | Used by |
| --- | --- | --- |
| `rbj.filtercoeff` (maxmsp.lib) | LGPL with exception | the RBJ filters and EQs |
| `de.sdelay` (delays.lib) | LGPL with exception | fverb |
| `en.ar` (envelopes.lib) | LGPL with exception | Metronome |
| `fi.tf22t`, `fi.iir`, `fi.fir`, `fi.dcblockerat`, `fi.zero`, `fi.pole`, `fi.allpass_comb`, `fi.bandpass` and its chain, `fi.nlf2`, `fi.wgr` (filters.lib) | STK-4.3 (own declares) | filters, disto, fverb, strings |
| `co.compression_gain_mono` (compressors.lib) | STK-4.3 | comp |
| `ef.gate_gain_mono` (misceffects.lib) | STK-4.3 (jos section) | gate |
| `an.amp_follower_ar`, `an.amp_follower_ud`, `an.amp_follower` (analyzers.lib) | STK-4.3 (jos section) | comp, gate, limiter |
| `si.smooth`, `si.lag_ud`, `ba.tau2pole` | STK-4.3 | everything with smoothing |
| `ve.sallenKey2ndOrder` (vaeffects.lib, Eric Tarr) | STK-4.3 | SV filters |
| `no.pink_filter` (noises.lib) | STK-4.3 (jos section) | pink filter |
| `os.oscws`, `os.impulse` (oscillators.lib) | STK-4.3 (jos section) | Metronome |
| trivial helpers: `ma.SR`, `ma.PI`, `ma.EPSILON`, `ma.sub`, `ma.neg`, `ma.sinh`, `ba.if`, `ba.db2linear`, `ba.linear2db`, `ba.time`, `si.smoo`, `si.interpolate`, `de.delay`, `os.sinwaveform` | LGPL with exception | nearly every module |

The helpers compile to a sample-rate field, a constant, `a - b`, `c ? x : y`,
`pow(10, 0.05 * x)` or a sample counter; no expression of the library
survives in the generated C++.

## Verdicts

| Module | Inputs that are not permissive | SFZ features | Re-implementation |
| --- | --- | --- | --- |
| RBJ filters, 32 headers (Lpf/Hpf/Bpf 2p, 4p, 6p, Brf2p, Lsh, Hsh, Peq, EqPeak, EqLshelf, EqHshelf, each mono and 2ch) | `rbj.filtercoeff` (substantive) | `fil_type` `lpf_2p` (also the default with only `cutoff`), `hpf_2p`, `bpf_2p`, `brf_2p`, `lpf_4p`, `hpf_4p`, `lpf_6p`, `hpf_6p`, `lsh`, `hsh`, `peq`; the SFZ v1 EQ bands `eqN_*`; `<effect> type=filter` and `type=eq` | low: RBJ cookbook coefficients into a smoothed biquad, cascades for 4p and 6p, about 200 lines with frequency-response tests |
| fverb | `de.sdelay` (substantive) | `<effect> type=fverb` | moderate: the Dattorro plate (JAES 1997) with an own modulated delay; S10a plans a plate reverb from the literature |
| Metronome | `en.ar` (substantive) | none, a debug tool sfizz keeps disabled | none: drop it |
| compressor, gate, limiter, disto, strings | helpers only | `<effect> type=comp`, `gate`, `limiter`, `disto`, `strings` | low each |
| 1-pole (10), SV (8), pink (2) filters | helpers only | `lpf_1p`, `hpf_1p`, `bpf_1p`, `*_2p_sv`, `pink` | low each |

## Other components the audit noticed

- hiir (oversampling of comp, gate, disto, limiter, lofi, rectify) is
  WTFPL-2, on license-001's list.
- cephes (`i0.c`, `chbevl.c`, the Bessel function of the Kaiser window of
  sfizz's sinc interpolator) carries no license in its sources;
  `LICENSE.txt` is a 2013 e-mail in which Stephen Moshier allowed the
  torch-cephes package "BSD license is fine, modification is OK". The
  function is a few lines from the literature (a power series).
- STK-4.3 code that stays has to ship the STK-4.3 notice (Julius O. Smith
  III; Eric Tarr for the SV filters); the subset ships sfizz's BSD-2
  license only.

## What holds for aud_dsp_sampler

Decided at the plan review of ticket 25 (question 7 of its plan) and
recorded as license-003: the one-line helpers are exempt, the STK-4.3
modules stay with the STK-4.3 notice, the RBJ filters and equalizer bands
are re-implemented from the Audio EQ Cookbook (`RbjFilters.hpp` of the
fork; within 1.2e-6 of the Faust originals), `fverb` and the metronome
are gone - `<effect> type=fverb` passes the signal through and a load
names it -, and cephes' `i0` is a power series.

## Sources

- faustlibraries at the commits the Faust tags pin (`libraries`
  submodule): 2.20.2 →
  `127e5bfcb35dc1d416d5f83ff0cd1fe38d458800`, 2.27.2 →
  `cde57d76dd8c4b124998a5490164e4b58ae9495f`, 2.30.5 →
  `cde5c7b7f61417cd1ef0fa6a92a823310db334d5`, 2.37.3 →
  `0dce1a50236ff68e37e285cfda0f25bfc29f2319`, master `eb6a5e3`
  (2026-10-11); files read as
  `https://raw.githubusercontent.com/grame-cncm/faustlibraries/<sha>/<file>`
  (basics, maths, platform, signals, filters, analyzers, compressors,
  misceffects, delays, oscillators, noises, envelopes, vaeffects, maxmsp);
  spot-checked by hand: `delays.lib` at `cde5c7b` (GRAME header, `sdelay`
  line 108), `maxmsp.lib` at `0dce1a5` (line 39 "LGPL with exception",
  `filtercoeff` line 53), `filters.lib` at `0dce1a5` (`tf22t` lines
  661-663, STK-4.3).
- RBJ history: https://github.com/grame-cncm/faustlibraries/commit/6e334524e663a6faac4de324d66ec796e35d9bdf
  and https://github.com/grame-cncm/faustlibraries/commit/e82f494447fc28d09a62d572a794c3cadaebd769;
  sfizz commit `ac4dfff7` added the copy.
- License spellings on master:
  https://github.com/grame-cncm/faustlibraries/commit/a1e30dc6e7fc9cbcf91ce823d41d9b347c7db3fb
- STK-4.3 text:
  https://github.com/grame-cncm/faustlibraries/blob/0dce1a50236ff68e37e285cfda0f25bfc29f2319/licenses/stk-4.3.0.md
- The fork: `src/sfizz/effects/dsp`, `src/sfizz/dsp/filters`,
  `scripts/faustwrap.d`, `cmake/SfizzFaust.cmake`.
