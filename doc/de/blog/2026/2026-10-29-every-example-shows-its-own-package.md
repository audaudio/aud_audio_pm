<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# Jedes Beispiel zeigt sein eigenes Paket

## Motivation

- Ticket `maintain` hat die Repos mit Beispielen auf Pub-Workspaces
  umgestellt. Das Beispiel von `aud_audio` konnte nicht folgen: Es hing an
  `aud_audio_midi`, das an `aud_audio` hängt.
- Die erste Idee war, diese Schleife in der Bibliothek aufzulösen:
  `AudEngineExtension`, das Engine-Interface und `AudNativeNodePackage`
  nach `aud_audio_graph` verschieben, damit `aud_audio_midi` nicht mehr an
  `aud_audio` hängt.
- Die Prüfung dieser Idee fand den eigentlichen Fehler: Das Beispiel von
  `aud_audio` zeigte eine Funktion von `aud_audio_midi`, einem Paket eine
  Schicht darüber. Die Abhängigkeitsrichtung der Bibliotheken stimmte.

## Strategie

- Der Paketgraph bleibt, wie er ist: `aud_audio_midi` hängt an
  `aud_audio` ([req-framework-003](../../../requirements/framework.md)).
- Die MIDI-Demo wandert aus dem Beispiel von `aud_audio` in ein neues
  Beispiel von `aud_audio_midi`.
- Beide Beispiele kommen in den Pub-Workspace ihres Repos.
- Die Umbenennung von `aud_audio_midi` folgt in einem eigenen Ticket.

```mermaid
graph TD
  ex1[aud_audio example] --> aud_audio
  ex2[aud_audio_midi example] --> aud_audio_midi
  aud_audio_midi --> aud_audio
  aud_audio_midi --> aud_midi
  aud_audio --> graph[aud_audio_graph + core]
```

## Realisierung 1: aud_audio

- Das Beispiel behält die Oszillator- und die Sampler-Seite und verliert
  die MIDI-Seite, ihre Integrationstests, Berechtigungen und den
  Loopback-Service.
- `workspace: [example]`, `resolution: workspace`; die eingecheckte
  `example/pubspec_overrides.yaml` und `example/pubspec.lock` sind weg.

## Realisierung 2: aud_audio_midi

- `example/` ist eine neue App: Ein MIDI-Keyboard spielt den SFZ-Sampler
  über `AudMidiBridge`, mit den Integrationstests von midi-002 und
  midi-003.
- `workspace: [example]`.

## Realisierung 3: Pläne

- [Ticket decouple_aud_audio_midi](../../../2026-Q4/tickets/2026-10-29-decouple_aud_audio_midi-move-the-midi-demo-to-aud-audio-midi.md)
  hält die Entscheidung fest.
- [Das Folgeticket](../../../2026-Q4/tickets/2026-10-29-rename-aud-audio-midi-to-aud-audio-with-midi.md)
  schlägt den Namen `aud_audio_with_midi` vor, der die Schicht nennt.

## Ergebnis

- Beide Repos lösen als ein Workspace auf; Analyzer und Unit-Tests sind
  grün, das neue Beispiel baut für den iOS-Simulator.
- Beide Workspace-Repos brauchen `test: ^1.31.1`: Flutter 3.47 pinnt über
  `flutter_test` `test_api` 0.7.12.

## Offene Punkte

- Die MIDI-Integrationstests liefen in diesem Ticket auf keinem Gerät.
- Die Umbenennung wartet auf ihr Ticket.
