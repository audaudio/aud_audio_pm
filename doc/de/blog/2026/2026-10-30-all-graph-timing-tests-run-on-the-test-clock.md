<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# Alle Graph-Timing-Tests laufen auf der Test-Uhr

## Motivation

- Das vorige Ticket hat `aud_audio_graph` eine Render-Uhr gegeben, die
  native Tests ersetzen, und den einen flaky Timing-Test darauf umgestellt.
- Drei weitere Tests des Perioden-Histogramms schliefen noch echte Zeit
  und hielten weite Grenzen. Sie waren noch nicht rot, trugen aber
  dasselbe Risiko unter dem Thread-Sanitizer auf einer ausgelasteten
  Maschine, etwa während `gg do publish` viele Repos baut.

## Strategie

- Der Entscheidung des vorigen Tickets folgen: eine deterministische Uhr,
  keine weiteren Grenzen und kein Überspringen unter dem Thread-Sanitizer.
- Jeden Test, der Perioden, das Histogramm oder Renderzeiten prüft, auf
  die Uhr umstellen und exakte Bins prüfen.
- Echte Zeit dort behalten, wo echte Nebenläufigkeit der Sinn des Tests
  ist.

## Umsetzung

- `aud_audio_graph`: `graph_timing_reports_the_last_block`,
  `graph_timing_histogram_drops_the_gap_that_reset_the_filter` und
  `graph_timing_histogram_takes_the_gap_of_split_callbacks` stellen die
  `ManualClock` vor und prüfen exakte Bins. Der schlafende Helfer
  `renderPaced` ist weg.
- Die ersten 20 Läufe unter Last waren 19-mal grün. Der rote Lauf war der
  Stresstest der Event-Quellen: Eine Note hing, obwohl jedes Event ankam.
  Der Nutzer wurde gefragt, ob das ein eigenes Ticket wird oder hier
  untersucht wird, und entschied sich für hier.
- Ursache: Landen späte Pakete einer klingenden Tonhöhe als `off on off`
  auf einem Offset, setzte die Engine beide Note-Offs nach vorn und
  spielte `off off on`. Jetzt kommt nur das erste Note-Off einer
  klingenden Tonhöhe pro Block zuerst. Ein Unit-Test in `aud_audio_graph`
  bildet die Folge nach und schlägt ohne den Fix fehl.

## Ergebnis

- Mit dem Fix lief `node scripts/test-native.js` von `aud_audio_graph`
  20-mal hintereinander grün, während 16 Busy-Loops die Maschine
  auslasteten; `dart test` lief grün.

## Offene Punkte

- Die Tests der Lastanzeige lesen weiter die echte Uhr; sie prüfen nur
  Untergrenzen und Zähler, die Last nicht brechen kann.
