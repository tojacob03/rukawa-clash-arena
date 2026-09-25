# Waza Arc: Arbeitsnotizen

Protokoll der eigenständigen Arbeit am Backlog ([BACKLOG.md](BACKLOG.md)): was gemacht wurde und warum, getroffene Standardentscheidungen und was morgen geklärt werden sollte.

## Für morgen

_(Rückfragen, Ablehnungen und Entscheidungen, die du bestätigen oder ändern solltest)_

## Protokoll

### Ausgangslage

Stufe 1 des Reworks ist fertig (Commit `fd1b513`): App-Rahmen mit Kanji-Navigation und Hanko-Siegel, Tusche-Übergang mit Goldkante (WebGL), „Heute“ als Trainingsheft, Skilltree als Pflaumenzweig auf einer Washi-Rolle.

### Stufe 2: Seekarte, Eintragen, Charakter-Bühne

- **Seekarte randlos** (`62777a3`): Die Karte ist ein eigener dunkler Raum von Kante zu Kante, die Inselkarte schwebt auf breiten Bildschirmen rechts darüber. Die Kamera hält Schiff und gewählte Insel frei von dieser Karte. Nebel in zwei Ebenen verschiebt sich beim Ziehen gegeneinander (Parallax): dicht über Inseln, die deine Route noch nicht erreicht hat, dünn über fremden Heimatmeeren. *Warum:* Der Nebel ist nicht Deko, sondern zeigt, was noch vor dir liegt; die randlose Karte ist das Heldenelement der Seite.
- **Eintragen als Trainingsheft** (`753e0f6`): Die Formulare für Training, Turnier und Nebensport liegen als Washi-Blatt auf dem Lack, mit zinnoberrotem Heftrand und Kanji-Schrittnummern (一 二 三 四, für Screenreader als Zahlen). Speichern trägt das Siegel der Einheit (記, 試, 鍛). *Entscheidung:* Das Blatt ist in beiden Ausgaben hell (eigene Tinte per CSS-Variablen), weil es ein Gegenstand ist, kein Thema. Der Ablauf, die Felder und die Knopfnamen sind unverändert, damit das Eintragen in 30 Sekunden bleibt und die Tests greifen.
- **Charakter-Bühne**: Die Figur steht groß auf zwei Tatami in einem dunklen Dōjō-Raum, Name und Werte daneben wie ein Aushang. „Sterne“ in der Statistik heißt jetzt „Techniken entdeckt“.
- Geprüft: Typecheck, Lint, 91 Unit-Tests, Konto-E2E 23/23, Social-E2E 44/44, Überlappungs-Audit der Seekarte ohne Befund.

### Stufe 3: Codex, Profil, Konto, Plan, Onboarding

- **Codex** (`c0b2…`, siehe Log): Nachschlagewerk mit Daumenregister, ein Kanji je Kapitel (基 守 極 固 突 投 逃) mit Trefferzahl. Das Register springt zum Kapitel statt zu filtern (wie in einem Wörterbuch), die Stufenfilter sind eine Wortreihe, Einträge lesen sich wie Wörterbucheinträge. *Entscheidung:* Der Sektor-Filter fiel weg, weil Suche plus Register dasselbe schneller leisten.
- **Profil**: Einstellungen als Register (Überschrift links, Eintrag rechts, Haarlinie dazwischen) statt gestapelter Karten; die Gürtelprüfung bleibt das eine Lackelement.
- **Plan**: Stundenplan mit Wochentags-Kanji (月 火 水 木 金 土 日) und Haarlinien zwischen den Tagen, „frei“ wie mit Bleistift.
- **Konto**: Abschnitte im angemeldeten Zustand als Registerzeilen wie im Profil. Anmelde-Panel und Kontoausweis bleiben die Lackelemente.
- **Onboarding**: Jeder Schritt öffnet wie ein Kapitel, die Schrittzahl groß als Kanji (一 bis 六) neben dem Titel.
- Nebenbei gefunden: Der Dev-Server nutzt `lovable-tagger`, der an generischer JSX-Syntax (`<Seg<T> …>`) scheitert; solche Stellen vermeiden (steht jetzt auch hier).
