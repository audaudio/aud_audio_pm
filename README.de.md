# aud_audio_pm

[English](README.md) | Deutsch

[![CI](https://github.com/audaudio/aud_audio_pm/actions/workflows/quick_check.yaml/badge.svg)](https://github.com/audaudio/aud_audio_pm/actions/workflows/quick_check.yaml)

Projektmanagement-Repository der Audanika Audio Engine aud_audio: Pläne,
Entscheidungen, Blog-Posts. Kein Code: Die Pakete der Engine liegen in
eigenen Repos.

## Motivation

- Die Audanika Audio Engine ist ein Ökosystem aus Paketen nach dem Vorbild
  von AudioKit — Engine, DSP-Knoten, UI-Widgets, Sequencer, Plugin-Shells —
  statt einer einzigen Bibliothek. Ihre Ziele, Anforderungen,
  Entscheidungen und Pläne betreffen alle Pakete, darum brauchen sie
  einen Ort, der keinem einzelnen Paket gehört
- Jedes `gg`-Ticket gehört zu genau einem Projektmanagement-Repository;
  es wird vor jedem Code-Repo hinzugefügt und trägt den Plan des
  Tickets. Ein Ticket, das nur geplant wird, endet hier
- Entscheidungen und Architektur bleiben über Quartale hinweg
  nachvollziehbar, während sich die Code-Repos mit jedem Ticket ändern

## Installation

Das Repository ist kein Paket; klone es neben die Code-Repos oder füge es
einem `gg`-Ticket vor dessen Code-Repos hinzu:

```bash
git clone git@github.com:audaudio/aud_audio_pm.git
```

```bash
gg do add aud_audio_pm
```

## Verwendung

Das Repository wird mit dem `gg`-Workflow und den Planungs-Skills der
Schicht `dna_plan` geplant: `/gg-plan-requirements` erarbeitet die Ziele
und Anforderungen, `/gg-plan-schedule` schneidet sie in Tickets,
`/gg-plan-report` hält die Berichte an die Beteiligten aktuell. Der
[Guide zum Projektmanagement-Repository](doc/guides/pm-repo-guide.md)
beschreibt die Struktur und wie die Planung abläuft; das aktuelle Quartal
ist [2026-Q4](doc/2026-Q4).

- [Issues](doc/issues.md) — die Ticketnummern
- [Ziele](doc/2026-Q4/goals) — was das Quartal erreichen soll
- [Anforderungen](doc/requirements) — was die Produkte können müssen,
  nach Bereich
- [Tickets](doc/2026-Q4/tickets) — ein Plan je Ticket
- [Entscheidungen](doc/2026-Q4/concepts/decisions/000-index.md)
- [Architektur](doc/2026-Q4/architecture/architecture.md)
- [Review der Architektur](doc/2026-Q4/concepts/topics/review-2026-10-25-architecture.md)
  (Ticket 40, 2026-10-25) und
  [sein Umsetzungsplan](doc/2026-Q4/tickets/2026-10-25-40-review-the-architecture-of-audaudio-and-audmidi.md)
- [Plan 17: Audanika Audio Engine](doc/2026-Q4/tickets/2026-10-07-17-audanika-audio-engine.md)
  (erledigt 2026-10-08)
- [Plan 5: Spike the mobile foundation](doc/2026-Q4/tickets/2026-10-08-5-spike-the-mobile-foundation.md)

## Grenzen

- Kein Code und keine API: Das Repository enthält nur Dokumente sowie die
  Versionskonstante, die `gg` veröffentlicht
- Die Pläne beschreiben die Systeme von Audanika, wie sie sind; sie sind
  keine Beispiele

## Dokumentation

- Die Guides in [`doc/guides`](doc/guides), zuerst den
  [Guide zum Projektmanagement-Repository](doc/guides/pm-repo-guide.md)
- Die Blog-Posts in [`doc/blog`](doc/blog), auf Deutsch in
  [`doc/de/blog`](doc/de/blog)

## Mitwirken

Tickets laufen durch den `gg`-Workflow: siehe den
[Develop Guide](doc/guides/develop-guide.md) und den
[Review Guide](doc/guides/for-ai/ai-review-guide.md).

## Lizenz

MIT — siehe [LICENSE](LICENSE).
