<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# Ein flaky Timing-Test bekommt eine Test-Uhr

## Motivation

- Die nativen Tests von `aud_audio_graph` schlugen ab und zu unter dem
  Thread-Sanitizer fehl, meist auf einer ausgelasteten Maschine, während
  `gg do publish` viele Repos baute. Der Build mit Address- und
  Undefined-Behaviour-Sanitizer bestand.
- Ein roter Lauf ohne Fehler hält ein Release auf und gewöhnt alle daran,
  neu zu starten statt zu lesen.

## Strategie

- Erst reproduzieren: Der Test
  `graph_timing_histogram_ignores_a_single_gap_at_start_up` scheiterte in
  1 von 15 Läufen unter dem Thread-Sanitizer mit 16 Busy-Loops auf 8
  Kernen.
- Ursache: Er schlief echte Zeit und prüfte p99.9 von 1001 Lücken, also
  die zweitlängste Lücke; ein spätes Aufwachen über 40 ms brach die
  Grenze.
- Optionen für den Nutzer: eine deterministische Uhr statt Sleeps, weitere
  Grenzen nur unter dem Thread-Sanitizer oder den Test dort überspringen.
- Entscheidung: die deterministische Uhr, so behält der Test seine
  Aussage und wird exakt.

## Umsetzung

- `aud_audio_graph`: eine Render-Uhr, die native Tests ersetzen, nur mit
  `AUD_GRAPH_TEST_CLOCK` einkompiliert; der Test stellt sie von Hand vor
  und prüft exakte Bins. Die öffentliche API ändert sich nicht.
- `aud_audio_with_midi` nutzt denselben Test-Runner und war einmal rot.
  Seine nativen Tests haben keine Wallclock-Grenze, die Last brechen
  könnte: Ein Sleep von 20 ms beweist nur, dass ein Close wartet, und der
  Stresstest zählt Aufrufe.

## Ergebnis

- `node scripts/test-native.js` von `aud_audio_graph` bestand 20-mal
  hintereinander, und der Test bestand 15 von 15 Läufen unter Last.

## Offene Punkte

- Der rote Lauf von `aud_audio_with_midi` ist nicht geklärt; sein Log lag
  nicht vor. Ein Timeout des Runners unter hoher Last ist möglich.
- Andere schlafende Timing-Tests von `aud_audio_graph` behalten weite
  Grenzen und können auf die Test-Uhr wechseln, wenn sie flaky werden.
