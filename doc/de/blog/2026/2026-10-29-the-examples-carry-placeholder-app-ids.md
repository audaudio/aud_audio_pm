<!--
@license
Copyright (c) Audanika. All Rights Reserved.

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# Die Examples tragen Platzhalter-App-IDs

## Motivation

- Die Example-Apps der Familien nutzten IDs der Organisation:
  `com.audanika.*`, und `io.audaudio.*` für AUv3 und VST3.
- Wer ein Example kopiert, übernimmt diese ID; der Review-Guide verlangt
  Platzhalter.

## Strategie

- Neues Requirement [req-framework-017](../../../requirements/framework.md):
  die Examples tragen Platzhalter-IDs unter `com.example`.
- Entscheidungen mit dem Nutzer: das bisherige Suffix bleibt, nur das
  Präfix ändert sich; AUv3 und VST3 wechseln ebenfalls zu `com.example`;
  das Example von `aud_midi_android` aus der audmidi-Familie gehört dazu.
- Klassennamen der Bibliotheken behalten `com.audanika`.

## Umsetzung

- 22 Examples: Android-Namespace, Application-ID und Kotlin-Ordner, die
  Apple-Bundle-IDs von App und `RunnerTests`, Linux- und Windows-IDs.
- `aud_audio_auv3`: App, Extension und `plugin.json` werden zu
  `com.example.audAudioAuv3Example`; `aud_audio_vst3` wird zu
  `com.example.audAudioVst3Example`.
- `aud_audio_with_midi`: das Web-Fixture nutzt die Versionskonstante, die
  das letzte Release umbenannt hat.
- Ein Node.js-Skript hat die Umbenennung einmalig erledigt; es liegt in
  keinem Repo.

## Ergebnis

- Alle Examples analysieren sauber; die Android-Examples von
  `aud_midi_android` und `aud_audio_core` und das macOS-AUv3-Example
  bauen.

## Offene Punkte

- Schritt 4 des Plans, ein Check gegen IDs der Organisation in einem
  Example, folgt später.
- Nicht jedes Example wurde auf jeder Plattform gebaut.
- `aud_ab_space_widget` der privaten Familie nutzt weiter `com.audanika`.
