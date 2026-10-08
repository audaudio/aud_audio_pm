# link-002: No Audanika Link license; app publishers obtain their own

- Status: accepted
- Date: 2026-10-08
- Canonical source: Gabriel Gatzsche's answer at the plan review on
  2026-10-08; topics/ableton-link.md
- Open work: wording of the notice; pin the Link tag and the LinkKit
  release the build hook fetches

## Decision

Audanika holds no license for Ableton Link. `aud_audio_link` therefore
does not redistribute Link or LinkKit: its build hook fetches the Link
sources from Ableton's repository at a pinned tag when an app builds
for macOS, Windows, Linux or Android, and LinkKit's xcframework from
Ableton's releases when it builds for iOS — the LinkKit license forbids
redistribution of the SDK anyway. The package's own code is MIT
(license-002). Its README, its pubspec description, a notice file
`LICENSE-ABLETON-LINK.md` and a build-time message state plainly that
the publisher of an app using this package must either comply with the
GPL-2.0-or-later terms of Link or obtain a proprietary license from
Ableton (link-devs@ableton.com), and on iOS must accept Ableton's Link
SDK license with its UI and entitlement duties. Audanika's own apps
obtain that license before they ship with the package.

## Consequences

- Fetching at build time changes who accepts the license, not the
  license: CI of `aud_audio_link` runs tests and publishes no binaries,
  and example and cookbook apps ship without Link unless Audanika holds
  a license.

## Why

- Bundling Link's sources would make the published package a GPL work
  and misrepresent a license Audanika does not have.
- Fetching at build time puts the acceptance of Ableton's terms where
  it belongs: with the app that ships Link.
