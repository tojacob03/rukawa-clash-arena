# Waza Arc: Arbeitsnotizen

Protokoll der eigenständigen Arbeit am Backlog ([BACKLOG.md](BACKLOG.md)): was gemacht wurde und warum, getroffene Standardentscheidungen und was morgen geklärt werden sollte.

## Für morgen

_(Rückfragen, Ablehnungen und Entscheidungen, die du bestätigen oder ändern solltest)_

- **Kopfbedeckungen, Auswahl je Land:** Die Zuordnung steht in `src/arc/core/headwear.ts`, eine Zeile pro Land. Bitte einmal durchsehen, vor allem Länder mit mehreren Kandidaten (Deutschland: Trachtenhut mit Gamsbart statt Bollenhut, Vereinigtes Königreich: Melone, England: Schiebermütze, Brasilien: Chapéu de couro, Indien: Pagri aus Rajasthan). Religiöse Kopfbedeckungen habe ich bewusst ausgelassen.
- **Gym-Besuche liegen im Hauptdatensatz** (`visits` im Root-Record), nicht als eigene Record-Art. Grund: Der Server erlaubt nur die Arten root, session, comp, cross und promo, eine neue Art bräuchte eine Migration auf der Produktionsdatenbank. Für ein paar Dutzend Einträge reicht der Root-Record. Wenn du eine eigene Art willst: Migration freigeben, dann ziehe ich sie um.

## Protokoll

### Ausgangslage

Stufe 1 des Reworks ist fertig (Commit `fd1b513`): App-Rahmen mit Kanji-Navigation und Hanko-Siegel, Tusche-Übergang mit Goldkante (WebGL), „Heute“ als Trainingsheft, Skilltree als Pflaumenzweig auf einer Washi-Rolle.

### Stufe 2: Seekarte, Eintragen, Charakter-Bühne

- **Seekarte randlos** (`62777a3`): Die Karte ist ein eigener dunkler Raum von Kante zu Kante, die Inselkarte schwebt auf breiten Bildschirmen rechts darüber. Die Kamera hält Schiff und gewählte Insel frei von dieser Karte. Nebel in zwei Ebenen verschiebt sich beim Ziehen gegeneinander (Parallax): dicht über Inseln, die deine Route noch nicht erreicht hat, dünn über fremden Heimatmeeren. *Warum:* Der Nebel ist nicht Deko, sondern zeigt, was noch vor dir liegt; die randlose Karte ist das Heldenelement der Seite.
- **Eintragen als Trainingsheft** (`753e0f6`): Die Formulare für Training, Turnier und Nebensport liegen als Washi-Blatt auf dem Lack, mit zinnoberrotem Heftrand und Kanji-Schrittnummern (一 二 三 四, für Screenreader als Zahlen). Speichern trägt das Siegel der Einheit (記, 試, 鍛). *Entscheidung:* Das Blatt ist in beiden Ausgaben hell (eigene Tinte per CSS-Variablen), weil es ein Gegenstand ist, kein Thema. Der Ablauf, die Felder und die Knopfnamen sind unverändert, damit das Eintragen in 30 Sekunden bleibt und die Tests greifen.
- **Charakter-Bühne**: Die Figur steht groß auf zwei Tatami in einem dunklen Dōjō-Raum, Name und Werte daneben wie ein Aushang. „Sterne“ in der Statistik heißt jetzt „Techniken entdeckt“.
- Geprüft: Typecheck, Lint, 91 Unit-Tests, Konto-E2E 23/23, Social-E2E 44/44, Überlappungs-Audit der Seekarte ohne Befund.

### Stufe 3: Codex, Profil, Konto, Plan, Onboarding

- **Codex** (`baba0e9`): Nachschlagewerk mit Daumenregister, ein Kanji je Kapitel (基 守 極 固 突 投 逃) mit Trefferzahl. Das Register springt zum Kapitel statt zu filtern (wie in einem Wörterbuch), die Stufenfilter sind eine Wortreihe, Einträge lesen sich wie Wörterbucheinträge. *Entscheidung:* Der Sektor-Filter fiel weg, weil Suche plus Register dasselbe schneller leisten.
- **Profil**: Einstellungen als Register (Überschrift links, Eintrag rechts, Haarlinie dazwischen) statt gestapelter Karten; die Gürtelprüfung bleibt das eine Lackelement.
- **Plan**: Stundenplan mit Wochentags-Kanji (月 火 水 木 金 土 日) und Haarlinien zwischen den Tagen, „frei“ wie mit Bleistift.
- **Konto**: Abschnitte im angemeldeten Zustand als Registerzeilen wie im Profil. Anmelde-Panel und Kontoausweis bleiben die Lackelemente.
- **Onboarding**: Jeder Schritt öffnet wie ein Kapitel, die Schrittzahl groß als Kanji (一 bis 六) neben dem Titel.
- Nebenbei gefunden: Der Dev-Server nutzt `lovable-tagger`, der an generischer JSX-Syntax (`<Seg<T> …>`) scheitert; solche Stellen vermeiden (steht jetzt auch hier).

### Rollen der Fortschritts-Systeme

Festgelegt als „Fünf Wege, fünf Fragen“, eine Quelle im Code (`src/arc/core/systems.ts`), im Konzept als Abschnitt 1.1 und im Charakterbogen als Reihe mit aktuellem Stand und Link ins jeweilige Zuhause:

- **Level (稽):** Wie viel steckst du hinein? Sinkt nie.
- **Power Level (測):** Wie stark bist du gerade, verglichen mit anderen? Steigt und fällt.
- **Zweig (技):** Was kannst du, und woran arbeitest du? Welkt ohne Training.
- **Hexagon (型):** Wie kämpfst du? Folgt der Form.
- **Seekarte (海):** Bleibst du dran, und mit wem? Sinkt nie.

*Warum so:* XP und Seemeilen wachsen beide mit Training und wirkten doppelt. Jetzt ist die Grenze klar: XP belohnt, was du einträgst, Seemeilen belohnen, dass du hingehst (jeder Sport, Rhythmus zählt). Die Reihenfolge Einsatz, Können, Stärke, Reise gilt auch für das Kapitelende (nächster Punkt „Belohnungsmoment“). *Entscheidung ohne Rückfrage:* Die Werte-Zeile im Charakterbogen (Power Level, Trainings, Rolls, Sterne) wurde durch diese Reihe ersetzt; Trainings und Rolls stehen jetzt als Unterzeile bei Level und Power Level.

### Mobile UI

Audit-Skript über alle 19 Seiten bei 320, 360 und 390 px (waagrechter Überlauf, Elemente außerhalb des Bildes, Tippflächen unter 24 px) plus Sichtprüfung der 320-px-Bilder. Kein Überlauf gefunden. Behoben:

- „Demo verlassen“ war 21 px hoch → 32 px.
- Gürtelwahl in den Roll-Karten war 20 px hoch → 24 px sichtbar, Tippfläche reicht per Pseudo-Element 10 px darüber und darunter.
- Wochenziel-Knöpfe (1–5) waren bei 320 px nur 23 px breit → Mindestbreite 36 px für alle Auswahlreihen.
- „Woche 5 von 8“ brach bei 320 px um → kürzere Striche, kein Umbruch.
- Icons in Tabs (Seekarte: Karte, Schiff, Logbuch, Crew) wurden auf schmalen Bildschirmen zu Punkten zusammengedrückt → Icons in Bedienelementen schrumpfen nicht mehr.

### Traditionelle Kopfbedeckungen und Mattenpass

- **Eine Kopfbedeckung pro Land:** 92 der 125 Länder haben eine eigene (Sombrero, Papacha, Nón lá, Tarbusch, Chullo, Gat, Mongkol, Vinok, Lička kapa …), gezeichnet in 36 Formen im Stil des Avatars (`components/Headwear.tsx`). Die übrigen 33 bekommen ein Stirnband in den Farben ihrer Flagge und sagen das auch so („Stirnband Niederlande“). *Standardentscheidungen:* Nur Volks- und Arbeitstracht, keine religiösen Kopfbedeckungen. Wo mehrere Kandidaten gingen, habe ich den bekanntesten genommen, der auf der Figur lesbar bleibt. Alle Kopfbedeckungen sind „Selten“.
- **Eigene Länder sofort:** Jedes Land im Steckbrief gibt neben dem Flaggen-Aufnäher seine Kopfbedeckung.
- **Weitere durch Gym-Besuche:** Wer als Gast in einem Gym eines anderen Landes trainiert, bekommt dessen Kopfbedeckung, ab dem Tag des Besuchs. Sie taucht wie jede Beute im Kapitelende auf.
- **Neue Funktion Mattenpass** (Held, neuer Reiter): ein Passblatt mit einem Einreisestempel pro Gym (Land, Datum des ersten Besuchs, Tinte je Gym verschieden), dazu „Besuch nachtragen“ für frühere Besuche und die Liste aller freigeschalteten Kopfbedeckungen. Beim Eintragen eines Trainings gibt es unter Check-in „Als Gast in einem anderen Gym“ mit Gym und Land; bekannte Gyms werden vorgeschlagen und füllen das Land aus. Dasselbe Gym aus beiden Quellen ist ein Stempel, auch wenn es anders geschrieben wurde.
- *Warum so:* Der Pass passt zum Hanko-Stempel im Trainingsheft und macht Reisen sichtbar, ohne ein weiteres Fortschrittssystem einzuführen: Er schaltet nur Ausrüstung frei, zählt keine XP.
- Die Demo hat zwei Stempel (Lissabon nachgetragen, Amsterdam als Gasttraining).
- Geprüft: Typecheck, Lint, 101 Unit-Tests (neu: Zuordnung für alle Länder, Freischaltung, Stempel, Sync, kaputte Einträge), Konto-E2E 23/23, Social-E2E 44/44, Build, kein waagrechter Überlauf bei 390 px.
