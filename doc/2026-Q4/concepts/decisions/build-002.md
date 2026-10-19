# build-002: Third-party C code several packages need comes from a published source package

- Status: accepted
- Date: 2026-10-19
- Canonical source: tickets/2026-10-19-35-take-quickjs-ng-from-gg-quickjs.md
  (the user's request "Can we integrate quickjs-ng as a Dart dependency?"
  and "make the package generic so that it could be published as
  gg_quickjs")
- Refines: [build-001](build-001.md) — its open work "a shared hook helper
  package"
- Open work: none

## Decision

A third-party C library that is generic enough for more than one package
may live in a published source package of its own instead of each
package's `src/third_party`: the package carries the library's sources
unchanged with its license and notice, a script that updates them from an
upstream tag, and a Dart helper for the build hooks of other packages that
names the sources, include directories, defines and flags per platform and
builds the library as a static library into the caller's hook output.
The caller links it into its own native library with hidden symbols, so
several copies in one app never clash, and keeps the library's notice,
since the code is compiled into its binary. The first such package is
`gg_quickjs` of the ggsuite (QuickJS-ng, on pub.dev), from which
`aud_audio_script` takes QuickJS-ng (script-001).

## Why

- The library is updated in one place and versioned on its own.
- A package of the family holds only its own code; build-001's vendoring
  stays for libraries one package needs, such as the sfizz fork.
