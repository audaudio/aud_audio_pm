# license-003: One-line Faust helpers are exempt; STK-4.3 Faust code stays with its notice

- Status: accepted
- Date: 2026-10-11
- Canonical source: topics/sfizz-faust-audit.md; ticket 25 (question 7)
- Refines: [license-001](license-001.md) — how Faust-generated code is
  judged
- Supersedes in part: the Faust rule of [license-002](license-002.md)
  (Consequences), [dsp-001](dsp-001.md) and [sampler-001](sampler-001.md)
  — the helpers listed here are exempt; their other decisions stand
- Open work: the same audit for `aud_dsp_effects` (S10a) and every later
  package with Faust-generated code

## Decision

Faust-generated C++ is judged by the library functions it was generated
from (license-001, license-002). The one-line helpers of the Faust
libraries - `ma.SR`, `ma.PI`, `ma.EPSILON`, `ma.sub`, `ma.neg`, `ma.sinh`,
`ba.if`, `ba.db2linear`, `ba.linear2db`, `ba.time`, `si.smoo`,
`si.interpolate`, `de.delay` and `os.sinwaveform` - are exempt, although
the libraries license them "LGPL with exception": they compile to a
constant, a difference, a conversion, a conditional, a delay, an
interpolation, a sine table or a sample counter, and no expression of the
library survives in the generated code.
Generated code that uses only these helpers, functions under STK-4.3 and
its author's own permissive code stays and ships the STK-4.3 notice.
Generated code with any other LGPL function goes: it is re-implemented
from the literature or dropped. In `aud_dsp_sampler` (ticket 25) this
re-implemented the RBJ filters and equalizer bands from the Audio EQ
Cookbook in place of `rbj.filtercoeff`, dropped the `fverb` effect
(`de.sdelay`) and the metronome (`en.ar`), and replaced cephes' Bessel
function, whose license is a permission e-mail, by a power series.

## Why

- Read strictly, license-002's Faust consequence would drop nearly every
  Faust module for its helpers; re-implementing about 1000 lines of DSP
  for a constant and a conditional buys no freedom.
- The list is exhaustive: any other function needs a decision of its own,
  so the rule stays checkable.
