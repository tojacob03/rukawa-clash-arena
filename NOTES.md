# Waza Arc: Arbeitsnotizen

Protokoll der eigenständigen Arbeit am Backlog ([BACKLOG.md](BACKLOG.md)): was gemacht wurde und warum, getroffene Standardentscheidungen und was morgen geklärt werden sollte.

## Für morgen

_(Rückfragen, Ablehnungen und Entscheidungen, die du bestätigen oder ändern solltest)_

- **Kopfbedeckungen, Auswahl je Land:** Die Zuordnung steht in `src/arc/core/headwear.ts`, eine Zeile pro Land. Bitte einmal durchsehen, vor allem Länder mit mehreren Kandidaten (Deutschland: Trachtenhut mit Gamsbart statt Bollenhut, Vereinigtes Königreich: Melone, England: Schiebermütze, Brasilien: Chapéu de couro, Indien: Pagri aus Rajasthan). Religiöse Kopfbedeckungen habe ich bewusst ausgelassen.
- **Progressive Disclosure, Schwellen:** Seekarte öffnet mit dem 1. Eintrag, Power Level und Scouter mit dem 2., Wochenboss mit dem 3., Hexagon mit dem 4. (`src/arc/core/unlocks.ts`, eine Zeile je Schwelle). Wer heute schon 1 bis 3 Einträge hat, sieht einzelne Teile kurz wieder zu, bis die Schwelle erreicht ist. Falls dich das stört: ein Stichtag, vor dem angelegte Profile alles offen haben, ist eine Zeile.
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

### Traditionelle Kopfbedeckungen und Mattenpass (`b15bc17`)

- **Eine Kopfbedeckung pro Land:** 92 der 125 Länder haben eine eigene (Sombrero, Papacha, Nón lá, Tarbusch, Chullo, Gat, Mongkol, Vinok, Lička kapa …), gezeichnet in 36 Formen im Stil des Avatars (`components/Headwear.tsx`). Die übrigen 33 bekommen ein Stirnband in den Farben ihrer Flagge und sagen das auch so („Stirnband Niederlande“). *Standardentscheidungen:* Nur Volks- und Arbeitstracht, keine religiösen Kopfbedeckungen. Wo mehrere Kandidaten gingen, habe ich den bekanntesten genommen, der auf der Figur lesbar bleibt. Alle Kopfbedeckungen sind „Selten“.
- **Eigene Länder sofort:** Jedes Land im Steckbrief gibt neben dem Flaggen-Aufnäher seine Kopfbedeckung.
- **Weitere durch Gym-Besuche:** Wer als Gast in einem Gym eines anderen Landes trainiert, bekommt dessen Kopfbedeckung, ab dem Tag des Besuchs. Sie taucht wie jede Beute im Kapitelende auf.
- **Neue Funktion Mattenpass** (Held, neuer Reiter): ein Passblatt mit einem Einreisestempel pro Gym (Land, Datum des ersten Besuchs, Tinte je Gym verschieden), dazu „Besuch nachtragen“ für frühere Besuche und die Liste aller freigeschalteten Kopfbedeckungen. Beim Eintragen eines Trainings gibt es unter Check-in „Als Gast in einem anderen Gym“ mit Gym und Land; bekannte Gyms werden vorgeschlagen und füllen das Land aus. Dasselbe Gym aus beiden Quellen ist ein Stempel, auch wenn es anders geschrieben wurde.
- *Warum so:* Der Pass passt zum Hanko-Stempel im Trainingsheft und macht Reisen sichtbar, ohne ein weiteres Fortschrittssystem einzuführen: Er schaltet nur Ausrüstung frei, zählt keine XP.
- Die Demo hat zwei Stempel (Lissabon nachgetragen, Amsterdam als Gasttraining).
- Geprüft: Typecheck, Lint, 101 Unit-Tests (neu: Zuordnung für alle Länder, Freischaltung, Stempel, Sync, kaputte Einträge), Konto-E2E 23/23, Social-E2E 44/44, Build, kein waagrechter Überlauf bei 390 px.

### Belohnungsmoment nach dem Loggen (`439e1d7`)

*Befund:* Das Kapitelende zeigte XP, Level und Stempel gut, danach aber eine flache Liste mit Icons in beliebiger Reihenfolge. Die Seereise fehlte ganz, obwohl jedes Training Seemeilen bringt.

- **Neu aufgebaut als Seite im Heft, in der Reihenfolge der Wege:** 稽 Einsatz (Wochenziel, Flamme, beim Turnier die Bilanz), 技 Können (Knospen, die aufgegangen sind, öffnen sich auf der Seite noch einmal; Meisterung), 測 Stärke (Power Level mit Veränderung, der Hexagon-Sektor, der sich am meisten bewegt hat, bei Nebensport Kraft und Ausdauer), 海 Reise (Seemeilen zählen hoch, das Schiff segelt sein Stück der Etappe zwischen zwei Inseln, mit „Angekommen auf …“ bei einer neuen Insel), 章 Siegel. Danach die Beute wie bisher.
- Jeder Weg hat eine ruhige Zeile, wenn sich nichts bewegt hat („Ohne Rolls misst der Scouter heute nichts.“), damit die Reihenfolge immer gleich bleibt und man lernt, wo was steht.
- Trainings an Bord eines Crew-Schiffs sagen, dass die Meilen dorthin gingen, statt das eigene Schiff zu bewegen.
- Der Knopf heißt jetzt „Auf dem Zweig ansehen“ statt „Auf der Sternkarte ansehen“.
- *Warum so:* Nach dem Eintragen soll man in drei Sekunden sehen, was es gebracht hat, und zwar in denselben fünf Wegen wie überall in der App. Keine Konfetti, keine Karten: Die Bewegung (Knospe öffnet sich, Schiff segelt) kommt aus der Welt der App.
- Geprüft: 102 Unit-Tests (neu: Seemeilen und Ankunft pro Eintrag), Lint, Build, Konto-E2E 23/23, Social-E2E 44/44, reduzierte Bewegung: 0 Animationen, keine GSAP-Anfrage.

### Progressive Disclosure für neue Spieler (`03bad71`)

*Befund:* Ein neuer Spieler sah am ersten Tag ein Power Level von 1.000 ohne einen einzigen Roll, einen Wochenboss „Ruhe im Dōjō“, im Charakterbogen Hexagon und Achsentabelle voller Nullen, Körperwerte, 17 gesperrte Siegel und „Laut Daten: Wandler“ ohne Daten.

- **Start:** Trainingsheft (Tag, Woche), Tagesquest, Zweig und Codex. Alles andere öffnet sich mit den Einträgen, jeweils in dem Moment, in dem es etwas zu zeigen hat: 海 Seekarte mit dem 1. Eintrag (das Schiff legt ab), 測 Power Level und Scouter mit dem 2. (erste Messung aus Rolls), 狩 Wochenboss mit dem 3., 型 Hexagon mit dem 4. Gezählt werden Trainings, Turniere und Nebensport. Die Demo zeigt alles.
- **Heute:** Solange noch etwas zu ist, steht unter der Quest ein Inhaltsverzeichnis „Was sich als Nächstes öffnet“: Kanji, Name, ein Satz, und als Seitenzahl das Training, mit dem es sich öffnet. Offenes steht in Gold und führt hin, das nächste ist markiert. Sind alle offen, verschwindet es.
- **Kapitelende:** Ein neuer Abschnitt 新 „Neu in deinem Heft“ sagt, was sich mit diesem Eintrag geöffnet hat. Am Tag, an dem der Scouter öffnet, steht die erste Messung unter Stärke; davor sagt die Zeile, wann er misst.
- **Geschlossen, aber sichtbar:** Die Seekarte zeigt vor dem ersten Training den Heimathafen mit „Dein Schiff liegt noch vor Anker“ und dem Knopf zum ersten Training. Im Charakterbogen stehen geschlossene Wege mit ihrer Frage und „Öffnet mit dem 2. Training“, damit man weiß, was kommt.
- **Ausgeblendet bis offen:** Power Level oben rechts, „Scouter aufsetzen“, „Partner scannen“ in den Roll-Karten, Wochenboss, Hexagon, Achsen, Power-Kurve, „Laut Daten“. Körperwerte erst mit Nebensport, eingetragenen Sportarten oder dem Hexagon.
- **Siegel:** Gezeigt werden die errungenen und die nächsten vier; der Rest auf Knopfdruck („Alle Siegel zeigen“). Das gilt für alle, nicht nur für neue Spieler, weil 17 gesperrte Kacheln auch später eher Wand als Ziel sind.
- *Warum so:* Jedes System erklärt sich am besten in dem Moment, in dem es zum ersten Mal einen echten Wert hat. Das Inhaltsverzeichnis macht das Warten zur Vorfreude statt zum Versteckspiel und passt zum Heft.
- Nebenbei: Kopfbedeckungen der eigenen Länder gelten beim Anlegen des Profils als gesehen (wie die Flaggen), damit Ausrüstung nicht sofort „Neu“ ruft.
- Geprüft: 105 Unit-Tests (neu: Reihenfolge, einmaliges Öffnen, Turniere zählen, Demo), Lint, Build, Konto-E2E 23/23, Social-E2E 44/44, reduzierte Bewegung ohne Animation, Bildschirmfotos für 0, 1 und 2 Einträge bei 1280 und 390 px.

### AI-Card-Merkmale und Verläufe entfernt, hochwertige Bibliotheken (`569b398`)

*Bestandsaufnahme:* 43 umrandete Kästen mit Hintergrund (`.panel`), Item-Karten mit farbigem Oberrand und Nahtbild, Siegel als gestrichelte Kacheln mit Stern-Icon, Ausrüstungsplätze als Kachelraster, ein Kasten um die Figur; dazu ein blaues Leuchten hinter jeder Figur, ein Verlauf unter der Power-Kurve, ein Lack-Verlauf und eine Vignette im Seekartenraum.

- **Abschnitte statt Kästen:** `.panel` ist jetzt ein Abschnitt mit Haarlinie oben, Überschrift darauf und Luft darunter, wie ein gedrucktes Register. Wirkt auf einen Schlag an allen 43 Stellen (Charakterbogen, Seekarte, Konto, Crew, Gym, Formulare). Die Heldenfläche (Lack mit Goldnaht) bleibt die eine Fläche pro Seite.
- **Items als Exponate:** jedes Stück auf einer Washi-Scheibe, Name und Seltenheit darunter, ohne Karte. Ausgerüstet: Goldring um die Scheibe und goldener Name; legendär: doppelter Goldring; gesperrt: leere, gestrichelte Scheibe. Die Ausrüstungsplätze sind eine Liste mit Scheibe, Platz und Stück, getrennt durch Haarlinien.
- **Siegel als Stempel:** errungene als zinnoberroter Doppelring mit dem Namen (wie der Hanko im Heft), offene mit Bleistift vorgezeichnet.
- **Verläufe:** Leuchten hinter der Figur nur noch mit ausgerüsteter Aura (die ist ein Item und darf leuchten), Power-Kurve mit flacher Goldlasur statt Verlauf, Lack und Seekartenraum als flache Farbe. Geblieben sind nur Verläufe, die etwas darstellen: Nebel auf der Seekarte, Rollen der Washi-Rolle, gefärbte Haarspitzen, Schatten unter Figuren.
- **Bibliotheken** (beide Standard auf Awwwards-Seiten, beide schon im Projekt): **GSAP SplitText** schreibt Abschnittstitel: das Kanji am Rand wird von oben nach unten gezogen (seine Schreibrichtung), dann steigen die Zeilen des Titels aus ihrer Grundlinie. Einmal pro Titel, wenn er ins Bild kommt, danach wird die Aufteilung zurückgenommen (Text bleibt normal auswählbar und umbrechbar). **Lenis** für weiches Scrollen mit Maus und Trackpad; Touch bleibt nativ, Zweig, Seekarte und Dialoge scrollen selbst. Beide werden erst nachgeladen und bei reduzierter Bewegung gar nicht (geprüft: keine GSAP-Anfrage, kein Lenis).
- Geprüft: Typecheck, Lint, 105 Unit-Tests, Build, Konto-E2E 23/23, Social-E2E 44/44, reduzierte Bewegung, Scrolltest (weich mit Maus, kein Seitenscroll über dem Zweig, Seitenwechsel springt nach oben), Bildschirmfotos in Urushi und Washi bei 1280 und 390 px.

### Sterne-Texte und Konzept nachgezogen

- **App:** Seitentitel „Zweig“ statt „Sternkarte“, „Diese Knospe liegt noch im Nebel“ im Technikblatt, Startbildschirm („Daraus entstehen ein Zweig mit 193 Techniken …“), Beschreibung in `arc/index.html` und im Web-App-Manifest. Siegel „Kartograf: 50 Sterne“ heißt jetzt „Blühender Zweig: 50 Knospen im Training geöffnet“, das Item dazu „Rashguard Blütenzweig“ (goldene Blüten statt Sterne), der Aufnäher fürs erste Training „Erster Schritt“. Sterne, die wirklich Sterne sind (Galaxie-Spats, Kap Abendstern, Waza-Stern auf der Flagge), bleiben.
- **Konzept:** Abschnitt 5 neu als „Zweig (Skilltree)“ (Aufbau aus Stamm, Ästen und Trieben, Zustände einer Knospe, Fäden, Bedienung, Layout), Abschnitt 7 neu (Rahmen mit Kanji-Navigation und Hanko, Heute als Trainingsheft, Eintragen als Heftseite, Karte, Codex, Held mit Mattenpass, Register, Einstieg), Kapitelende in der Reihenfolge der Wege, Flächen ohne Karten-Raster, SplitText und Lenis, neuer Abschnitt 7.2 „Was sich wann öffnet“, Kopfbedeckungen und Mattenpass unter 6.5.
