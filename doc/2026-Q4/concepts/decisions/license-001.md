# license-001: Permissive sources only, notices in every package

- Status: proposed
- Date: 2026-10-07
- Canonical source: topics/licenses-and-dsp-sources.md (R26, R27)
- Open work: add the notices check to the DNA layer; the check exists as
  `aud_audio_core/scripts/check-notices.js` with its guide (ticket 18)

## Decision

Code is copied only from sources under MIT, MIT-0, BSD-2/3-Clause, Apache-2.0,
ISC, Zlib, Unlicense, CC0, BSL-1.0, WTFPL, the STK license or the FFTPACK
license. LGPL code is not used in any form — neither copied nor linked, on any
platform; where a candidate is LGPL, a permissive alternative is used or the
algorithm is re-implemented from the published literature (license-002). GPL,
AGPL and non-commercial licenses are models only. Dual-licensed SDKs (Ableton
Link, ASIO) live in separate packages with their own license terms. Every
package ships `THIRD_PARTY_NOTICES.md` with copyright, SPDX id, license text
and origin of each copied file set, keeps original headers, registers native
notices with `LicenseRegistry.addLicense`, carries required trademark lines,
records for every dual-licensed dependency which license was chosen and keeps
the license of our wrapper apart from the license of the fetched or bundled
implementation, and a CI check fails when a copied directory has no notice
entry.

## Why

- R26 and R27; the owner excluded LGPL entirely on 2026-10-07, and the
  relink clause of the LGPL could not be honoured in code-signed iOS
  bundles or single Wasm modules anyway.
- Apache-2.0 §4(d) requires NOTICE propagation (Abseil in sfizz).
