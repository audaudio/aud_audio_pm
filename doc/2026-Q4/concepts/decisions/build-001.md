# build-001: Third-party C and C++ is vendored and compiled by the hook

- Status: proposed
- Date: 2026-10-08
- Canonical source: ticket 5 (tickets/2026-10-08-5-spike-the-mobile-foundation.md)
- Open work: a build-time fetch instead of vendoring where a license asks
  for it (link-002); the per-file compiler flags the hooks cannot express
  (sfizz's `-mavx` on x86 objects); a shared hook helper package

## Decision

Every package that needs C or C++ from outside the family keeps the sources
it compiles under `src/third_party/<component>` together with the license
files and a `NOTICES.md`, and compiles them in its build hook with
`native_toolchain_c` — no CMake, podspec or Gradle at the consumer. Large
libraries are vendored as the subset the linker needs: a probe program linked
against the library's own build lists the object files, and `clang -MM` lists
the headers they include; the result is a `SOURCES.txt` and an `INCLUDES.txt`
the hook reads. The ABI header of `aud_audio_core` is included, never linked:
a hook resolves the core's `src` directory through the package config
(`Isolate.resolvePackageUri`), so git, path and pub dependencies all work.
Sources that mix C and C++ are compiled without a language flag — clang
chooses by file extension — and the C++ runtime is linked explicitly
(`c++` on Apple, `c++_static` with `c++abi` on Android, `stdc++` on Linux);
such a package avoids C++17-only constructs in its own code because no
`-std` flag can be passed to a mixed set. Symbols of vendored libraries stay
hidden (`-fvisibility=hidden`); only the package's own `AUD_EXPORT` entry
points are visible, so two packages may embed the same library.

## Why

- The spike built sfizz, miniaudio and Oboe this way on macOS, iOS and
  Android without a CMake run at the consumer; the hook result is cached
  until a source changes.
- Linking hook-built libraries against each other is not expressible in
  the hooks API; header-only sharing through the package config is.
- A mixed C and C++ set has no common `-std`; the extension rule is the
  one clang offers.
