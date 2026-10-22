# plugin-005: The VST3 ships inside the Mac App Store app and is linked into the plug-in folder by the app

- Status: accepted
- Date: 2026-10-20
- Canonical source: Gabriel Gatzsche's choice at the planning of ticket 37
  on 2026-10-20 ("VST3 in App, Fallback"), after the research recorded in
  tickets/2026-10-20-37-ship-audanika-as-a-mac-app-with-its-vst3-plugin.md
- Refines: [plugin-001](plugin-001.md) — how a plugin of the family reaches
  the DAWs on macOS; [plugin-003](plugin-003.md) — its editor app runs in
  the App Sandbox
- Related: [release-005](release-005.md) — the Mac app it ships in
- Open work: the answer of App Review; the fallback package if it refuses;
  Live with the link (ticket 37 settled the rest: App Store Connect
  validated the nested plugin and its editor, TestFlight took builds 168
  and 169, REAPER 7 and Cubase 15 follow the link)

## Decision

The Audanika VST3 lives inside the Mac app (`Audanika.app/Contents/PlugIns`,
unless the gate finds a place App Store Connect prefers) and is shipped,
signed and updated with it through TestFlight and the Mac App Store. DAWs
look for VST3 plugins only in `~/Library/Audio/Plug-Ins/VST3` and
`/Library/Audio/Plug-Ins/VST3`, never inside another app, so the app offers
a step "Activate the plugin": the user chooses the plug-in folder in an open
panel and the app places a symbolic link to its embedded plugin there,
keeps a security-scoped bookmark to repair or remove it, and shows whether
the plugin is active. Nothing is linked without that consent. Internal
TestFlight testers come first, as they need no App Review. If App Review
refuses the step, the same plugin build ships outside the store as a
notarized Developer ID package; the store app keeps everything else.

## Why

- The user's requirements: the Mac app on TestFlight and the Mac App Store
  (req-mac-001), the plugin with the app and no separate installer
  (req-mac-002), the plugin built on `aud_audio_vst3` (req-mac-005).
- An AUv3 extension is Apple's sanctioned way, but Cubase and Bitwig host no
  Audio Units; only a VST3 reaches every major DAW on the Mac.
- A link keeps one copy of the plugin and its 110 MB of content, follows
  every app update, and carries no quarantine flag, which a copy written by
  a sandboxed app would.

## Risks

- App Review Guideline 2.4.5 (ii) says a Mac App Store app "cannot install
  code or resources in shared locations"; the plug-in folder is one. No
  documented precedent was found either way, and a later update may be
  judged differently from the first.
- Some DAWs ignore symbolically linked plugins (reported for VST2 in Live);
  each DAW of the tests records whether it follows the link.
