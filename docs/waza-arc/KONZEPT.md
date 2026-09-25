# Waza Arc – Konzept

Eine BJJ-Fortschritts-App im Stil eines Anime-RPGs. Der Arbeitstitel war „Tatami Arc“. Er wurde geändert, weil „Tatami“ im BJJ-Markt als Marke von Tatami Fightwear belegt ist. „Waza“ ist das allgemeine japanische Wort für Technik.

**Stand:** Die App läuft unter `/arc/` als eigener Einstiegspunkt im Portfolio (Code in `src/arc/`, Tests in `src/arc/core/model.test.ts`). Die Daten liegen im Browser (localStorage, Export und Import als JSON). Mit einem Konto werden sie im Supabase-Schema `arc` gesichert und zwischen Geräten abgeglichen (8.5). Was im Supabase-Dashboard noch einzuschalten ist, steht in [`KONTO-SETUP.md`](KONTO-SETUP.md).

**Kurz:** Nach dem Training loggst du in gut einer halben Minute, was passiert ist. Im Training zählst du nur eine Sache mit, deine Tagesquest. Daraus rechnet die App deinen Fortschritt pro Technik aus, gewichtet nach Partnerstärke und Datenlage, und zeigt ihn als Sternkarte (Skilltree), Hexagon und Power Level. Dazu kommen ein frei gestaltbarer Charakter, Turniere, Nebensport (Kraftsport, Ringen und andere) und eine Seekarte deiner Reise. Die Oberfläche ist als Manga-Band gestaltet, hell als „Papier“ und dunkel als „Nachtausgabe“ (Abschnitt 7.1).

Erster klickbarer Prototyp (noch unter dem alten Namen): [`prototyp.html`](prototyp.html).

---

## 1. Leitprinzipien

1. **Die Quest ist das Messinstrument.** Im Training zählt man genau eine Sache mit: Versuche und Treffer der Tagesquest. Das kann man sich realistisch merken, es macht das Rollen bewusster (Deliberate Practice) und liefert saubere Daten pro Technik. Weil die Quests über Wochen durch den Baum rotieren, entsteht Abdeckung, ohne dass man alles loggen muss.
2. **Aufwand und Können sind getrennte Währungen.** XP und Level messen Aufwand und sinken nie. Meisterung misst Können, braucht Belege aus Rolls und kann rosten. So belohnt die App das Dranbleiben, ohne das Können schönzurechnen.
3. **Keine Anreize für Ego-Rolls.** Punkte gibt es für Konstanz, Quests und Reflexion, nicht für Siege. Subs gegen schwächere Partner zählen weniger, Taps gegen stärkere kaum.
4. **Pausen werden nicht bestraft.** Wochenserie statt Tagesserie, Heilungsmodus bei Verletzung. Stufen fallen nicht durch Pausen, Sterne rosten nur.
5. **Unsicherheit wird ehrlich gezeigt.** Jede Quote ist eine Schätzung mit Untergrenze. 3 Treffer aus 3 Versuchen sind noch keine Meisterschaft.

---

## 2. Was geloggt wird

| Schritt | Eingabe | Tipps | Zeit | Wofür |
|---|---|---|---|---|
| 1 Check-in | Kurs oder Open Mat, Gi oder No-Gi. Aus dem Kursplan vorausgewählt, Datum und Dauer ebenfalls | 1 | 2 s | XP, Wochenserie, Mattenzeit, Gi/No-Gi-Vergleich |
| 2 Heute im Kurs | Technik aus der Liste, zuletzt genutzte oben. Im Gym-Modus trägt der Coach sie ein, dann 0 Tipps | 0–2 | 2 s | Wissen |
| 3 Roll-Karten | Pro Roll: Gürtel des Partners, Größe (leichter/gleich/schwerer), Subs ich, Subs Partner, Kontrolle (Partner/gleich/ich). Standardwerte: gleich groß, 0, 0, gleich | 2–4 pro Roll | 4 s pro Roll | Power Level, Form, Partnergewicht |
| 4 Quest-Zähler | Versuche und Treffer (bei Überleben: Escapes, bei Drill: erledigt) | 2–6 | 5 s | Meisterung |
| 5 Notiz, optional | „Hat funktioniert“ (Technik) und „Festgehangen in“ (6 Positions-Chips) | 2 | 6 s | Bonus-Evidenz, Wochenboss, +15 XP |

**Summe bei 5 Rolls: etwa 30 bis 40 Sekunden.**

Bewusst **nicht** geloggt: jede einzelne Technik pro Roll, Zeit in Positionen, Verletzungen (Gesundheitsdaten nach Art. 9 DSGVO).

**Mitzählen im Training:** nur die Quest, als laufender Zwischenstand („3 Versuche, 1 Treffer“). Tipp in der App: in der Pause zwischen den Runden beim Wassertrinken kurz aktualisieren. Später optional eine Watch-Komplikation mit zwei Zählern.

**Erinnerung:** Push zum Kursende laut Stundenplan. Eingabe funktioniert offline (Keller-Gyms), Sync später. Ein Log bis 24 Stunden nach dem Training zählt voll.

---

## 3. Datenmodell (Supabase / Postgres)

Die App hält alle Daten als JSON im Browser (`ArcData` in `src/arc/core/types.ts`). Mit Konto liegt eine Kopie im Schema `arc` des Portfolio-Projekts (8.2), als Datensätze in einer einzigen Tabelle:

```text
records   user_id, kind, id, data (jsonb), deleted, rev, updated_at
  root      Profil, Charakter (Aussehen, Ausrüstung, Flagge, Schiffsname), Onboarding, Pausen, UI-Stand
  session   ein Training mit Roll-Karten, Quest und Notiz
  comp      ein Turnier mit seinen Kämpfen
  cross     eine Einheit Nebensport
  promo     eine Gürtel- oder Streifenprüfung (Schlüssel: Datum, Gürtel, Streifen)
```

Warum eine Tabelle statt einer pro Objekt: Die App arbeitet offline und gleicht später ab. Mit einem Datensatz pro Training reicht dafür ein einfaches Protokoll (8.5), jede Änderung bleibt klein, und die Datenform der App ist die einzige Quelle der Wahrheit. Für Auswertungen (Abschnitt 10) lassen sich normalisierte Sichten mit `jsonb_to_recordset` darüberlegen, etwa Trainings, Rolls und Quest-Ergebnisse. Der frühere Entwurf mit einer Tabelle pro Objekt ist damit überholt.

Alle Kennzahlen lassen sich aus Trainings, Roll-Karten, Quests, Notizen, Turnieren, Nebensport und Onboarding neu berechnen. Die Rechenlogik liegt als reine TypeScript-Funktion `compute(history, asOf, filter?)` vor, mit Unit-Tests. Der optionale Filter (z. B. nur Gi) liefert den Gi/No-Gi-Vergleich aus demselben Rechenkern.

---

## 4. Rechenmodell

Alle Zahlen sind Startwerte. Nach dem Pilot werden sie mit echten Daten kalibriert (Abschnitt 10).

### 4.1 Partnerstärke

```text
Gürtel-Rating   Weiß 1000 · Blau 1150 · Lila 1300 · Braun 1420 · Schwarz 1520
Größe           leichter −60 · gleich 0 · schwerer +60
R_Partner       = Gürtel-Rating + Größe

Erwartung       E = 1 / (1 + 10^((R_Partner − R_du) / 400))
Partnergewicht  w = 0,5 / E, begrenzt auf 0,5 … 2
```

Gegen einen gleich starken Partner ist w = 1. Gegen einen deutlich stärkeren steigt w bis 2, gegen einen deutlich schwächeren sinkt w bis 0,5. Da Quest-Zähler pro Training erfasst werden, nicht pro Roll, gilt für Quest-Ergebnisse das mittlere Gewicht des Trainings `w̄`.

Der Gürtel ist bewusst die Hauptgröße: Er ist objektiv und mit einem Tipp erfasst. Eine subjektive Angabe wie „stärker/schwächer“ würde sich verschieben, während man selbst besser wird.

### 4.2 Power Level (Elo)

```text
Roll-Ergebnis  S = 0,5 + 0,2 · (Subs ich − Subs Partner) + 0,3 · (Kontrolle − 0,5), begrenzt auf 0 … 1
Update         R_du ← R_du + 12 · (S − E)          pro Roll
Turnierkampf   R_du ← R_du + 24 · (S − E)          S = 1 Sieg, 0,5 Unentschieden, 0 Niederlage; kampflos zählt nicht
               Gegner = Gürtel-Rating des angegebenen Gürtels (sonst des eigenen am Turniertag)
Start          R_du = Gürtel-Rating des eigenen Gürtels + 20 pro Streifen
Anzeige        Power Level = R_du × 10              (z. B. 12.080)
```

Kontrolle zählt mit, damit auch Rolls ohne Submission etwas aussagen. Das Power Level ist privat. Es gibt kein Ranking. „Power Level“ ist ein allgemeiner Begriff aus Spielen und Anime-Fankultur; die Anzeige („Scouter“, 6.8) ist eigenständig gestaltet, ohne Figuren, Logos oder Zitate aus einer Serie. Der Scouter ordnet den Wert einem Niveau zu (Weiß- bis Schwarzgurt-Niveau nach den Gürtel-Ratings) und schätzt vor einem Turnierkampf die Siegchance gegen einen Gürtel.

### 4.3 Meisterung einer Technik

**Evidenz.** Jedes Quest-Ergebnis mit Versuchen trägt `w̄ · Versuche` und `w̄ · Treffer` bei. Eine Notiz „hat funktioniert“ zählt als ein Treffer mit halbem Gewicht. Für die Meisterung wird die Evidenz mit einer Halbwertszeit von 120 Tagen abgewertet, für die Stufen nicht.

```text
n = Σ w̄ · Versuche · Frische_i      s = Σ w̄ · Treffer · Frische_i      Frische_i = 2^(−Alter / 120)
```

**Trefferquote als Beta-Schätzung.** Der Prior liegt auf der Basisquote `b` der Kategorie, mit Stärke 4:

```text
α = 4·b + s        β = 4·(1 − b) + (n − s)
μ = α / (α + β)    σ = √(μ(1 − μ) / (α + β + 1))
Untergrenze UG = μ − 0,84 · σ        (80 % sicher, dass die echte Quote darüber liegt)
```

| Sektor | Basisquote b |
|---|---|
| Guard (Sweeps) | 30 % |
| Passing | 25 % |
| Stand (Takedowns) | 25 % |
| Kontrolle | 40 % |
| Submission | 18 % |
| Verteidigung (Escapes) | 30 % |
| Fundament | 50 % |

**Komponenten.**

```text
Anwendung  A = min(1, UG / 1,5b) · n / (n + 5)        -- 0 ohne Live-Versuche
Wissen     K = 1 − e^(−E / 2,5)
           E = Σ Gewicht · 2^(−Alter / 60)
           Gewicht: im Kurs 1 · Drill-Quest 1,5 · Quest mit Versuchen 1 · Onboarding „kenne ich“ 3
Frische    1, solange die Technik in den letzten 45 Tagen trainiert wurde,
           danach 2^(−(Tage − 45) / 60), mindestens 0,5
Meisterung M = 100 · (0,25 · K + 0,75 · A) · Frische    (0 bis 100)
```

Wissen allein bringt höchstens 25 Punkte. Der Rest muss im Roll belegt werden.

### 4.4 Stufen

Stufen sind feste Schwellen, damit jeder Aufstieg erklärbar ist. Sie verwenden die nicht abgewertete Evidenz und fallen daher nicht durch Pausen.

| Stufe | Name | Bedingung |
|---|---|---|
| 0 | Unbekannt | noch nie gesehen |
| 1 | Gesehen | 1× im Kurs, gedrillt oder versucht |
| 2 | Gedrillt | 3× gesehen oder gedrillt, oder 5 Live-Versuche |
| 3 | Erprobt | 5 Live-Versuche |
| 4 | Geschärft | ≥ 8 gewichtete Versuche und UG ≥ b |
| 5 | Tokui-Waza | ≥ 25 gewichtete Versuche, UG ≥ 1,5 · b und ≥ 3 Treffer in Trainings mit w̄ ≥ 1,1 („gegen Stärkere“) |

Dazu kommen zwei Zustände:

- **Vorläufig:** Stufe 2 nur durch das Onboarding erreicht, oder Stufe 3/4 aus der Selbsteinschätzung (4.8), die die Daten noch nicht bestätigt haben. Wird im Baum gestrichelt gezeigt.
- **Rost:** Stufe ≥ 3 und seit 60 Tagen nicht trainiert (kein Kurs, kein Drill, keine Quest, keine Notiz). Der Stern verfärbt sich, die Meisterung sinkt über die Frische, die Stufe bleibt.

### 4.5 Attribute (Hexagon)

Sechs Achsen, identisch mit den sechs Sektoren der Sternkarte.

```text
Achse = 0,65 · Baum + 0,35 · Form            (nur Baum, wenn noch keine Form-Daten da sind)

Baum  = 0,6 · Tiefe + 0,4 · Breite
        Tiefe  = Mittel der fünf höchsten Meisterungen im Sektor
        Breite = Anteil der Sektor-Techniken ab Stufe 3, in Prozent

Form  = letzte 8 Wochen
        Submission    r = Σ w · Subs ich / Rolls                → 100 · (1 − e^(−r / 0,6))
        Verteidigung  t = Σ (Subs Partner / w) / Rolls          → 100 · e^(−t / 0,7)
        Kontrolle     m = Mittel(Kontrolle − E)                 → 50 + 100 · m, begrenzt auf 0 … 100
        Guard, Passing, Stand: Quest-Evidenz des Sektors zusammengefasst
                      → 100 · min(1, UG / 1,5b) · n / (n + 5)
```

„Baum“ zeigt, was du kannst, also Breite und Tiefe. Ein einfacher Durchschnitt über 20 bis 40 Techniken pro Sektor hätte einen Blaugurt bei 1 bis 6 Punkten begraben. „Form“ zeigt, was du gerade auf die Matte bringst. Die Hexagon-Ringe zeigen Richtwerte pro Gürtel (Blau 25, Lila 45, Braun 65, Schwarz 85). Das sind Platzhalter, bis Gym-Daten sie kalibrieren.

### 4.6 XP, Level und Wochenserie

```text
Training                      40
je Roll-Karte                  5
Quest erledigt                Drill 30 · Versuch 30 + 10·Stufe · Überleben 40 + 10·Stufe · Entrosten 60
je Treffer / Escape            5 (höchstens 50)
Notiz                         15
Wochenziel erreicht          100   (Standard: 2 Trainings pro Woche)
Stufe 3 / 4 / 5 erreicht      75 / 100 / 125 pro Technik (nur durch Daten, nicht durch Selbsteinschätzung)
Klassen-Bonus                 +20 % Quest-XP auf Techniken der gewählten Klasse (Wandler +8 % auf alles)
Nebensport                    15 + Minuten/3 (höchstens 45) + 5 je Intensitätsstufe über „locker“ + 10 für geloggte Takedowns
Talisman                      je nach Talisman, beim Speichern festgeschrieben (6.5)
Prolog                        40 · (L₀ − 1)² mit L₀ = Startlevel aus Gürtel und Streifen (4.8)

Level L ab 40 · (L − 1)² XP
```

**Wochenserie:** aufeinanderfolgende Wochen mit erreichtem Wochenziel. Das Wochenziel zählt nur BJJ-Trainings und Turniere, Nebensport nicht (6.10). Die laufende Woche zählt erst, wenn das Ziel erreicht ist, bricht die Serie aber vorher nicht. Wochen im Heilungsmodus werden übersprungen, ohne die Serie zu brechen.

### 4.7 Gi und No-Gi

**Grundsatz: Alles wird zusammen gerechnet.** Power Level, Meisterung, Stufen, Hexagon, Quests und XP beruhen auf allen Trainings. Jede Session trägt aber `attire` (Gi oder No-Gi), deshalb lässt sich jederzeit ein Vergleich berechnen, ohne ein zweites Modell zu pflegen.

- **Vergleichsansicht:** erscheint, sobald beide Seiten genug Daten haben, also mindestens 20 Rolls je Seite in den letzten 8 Wochen. Darunter zeigt die App „Noch zu wenig Daten für einen Vergleich“ statt wackliger Zahlen.
- **Hexagon:** Gi und No-Gi übereinandergelegt, jeweils mit `compute(…, { attire })` berechnet.
- **Power Level:** zwei zusätzliche Verläufe mit demselben Elo, einmal nur über Gi-Rolls, einmal nur über No-Gi-Rolls, beide ab demselben Startwert. Die Hauptzahl bleibt die gemeinsame.
- **Pro Technik:** Quote und Untergrenze je Seite, sobald je Seite mindestens 5 Versuche vorliegen. Im Detailfeld als zwei Balken.

### 4.8 Einstieg mit Vorerfahrung

Wer die App startet, hat meist schon trainiert. Der Einstieg holt diesen Stand ab, ohne die Messung zu verfälschen.

- **Prolog:** Gürtel und Streifen beim Start setzen das Startlevel. Weiß 1, Blau 8, Lila 14, Braun 19, Schwarz 24, plus ein Level pro Streifen. Die XP dafür stehen als eigener Posten „Prolog“ im Charakter. Das Power Level startet bei Gürtel-Rating plus 20 pro Streifen (×10 angezeigt).
- **Technik-Stand in drei Stufen:** „Kenne ich“ (gesehen, gedrillt: Stufe 2), „Klappt im Roll“ (Stufe 3) und „Stärke“ (Stufe 4, höchstens fünf). Ein Vorschlag nach Gürtel füllt „Kenne ich“ vor: Weiß nur Fundament (ab 2 Streifen plus Shoden), Blau bis Shoden (ab 2 Streifen bis Chūden), Lila bis Chūden, Braun und Schwarz bis Okuden.
- **Erst Blöcke, dann Feinschliff:** Jeder Ring (Shoden bis Hiden), jeder Bereich (Fundament, Guard, Submission …) und jeder Zweig darin (Closed Guard, Beinhebel …) lässt sich mit einem Tipp auf „Nichts“, „Kenne ich“ oder „Klappt“ setzen. Der zuletzt gesetzte Block gewinnt; Stärken bleiben dabei stehen, nur „Nichts“ räumt sie mit weg. Ist ein Block gemischt, ist keine der drei Optionen markiert. Danach setzt ein Tipp auf eine einzelne Technik sie eine Stufe höher (Kenne ich, Klappt im Roll, Stärke, wieder leer); Stärken gibt es nur einzeln.
- **Konto am Schluss:** Ist die Version mit Konto gebaut und niemand angemeldet, endet der Einstieg mit „Sichere deinen Charakter“. Beide Knöpfe legen den Charakter an; „Konto erstellen“ führt zur Anmeldung und nach erfolgreicher Anmeldung (auch nach einer Weiterleitung über Google und Co.) zurück ins Dōjō, „Ohne Konto weiter“ direkt dorthin.
- **Selbsteinschätzung zählt vorläufig:** Die Karte zeigt die eingeschätzte Stufe gestrichelt, im Baum-Wert zählt sie mit einer vorläufigen Meisterung von 25 (Stufe 3) bzw. 45 (Stufe 4). Das Hexagon markiert Achsen mit Einschätzung. XP, Siegel, Kombos und Titel hängen nur an der Daten-Stufe.
- **Bestätigen:** Die Tagesquest bevorzugt eingeschätzte Techniken („Beweise deine Einschätzung“, P + 0,8). Erreichen die Daten die Stufe, gibt es die Stufen-XP und im Ergebnis „Einschätzung bestätigt“.
- **Steckbrief:** Name, Länder (bis zu vier, als Flaggen-Aufnäher), Geburtsjahr (ergibt die IBJJF-Altersklasse: Adult 18–29, Master 1 30–35, dann Fünfjahresstufen bis Master 7 ab 61), Gewicht (ergibt die Statur des Charakters), „trainiert seit“. Alles optional außer dem Namen.
- **Auffällige Unterschiede als Satz**, z. B. „Dein Triangle trifft im Gi deutlich öfter als im No-Gi“. Nur wenn sich die 80-%-Bereiche beider Seiten nicht überschneiden, sonst kein Satz.
- **Bibliothek:** Jede Technik hat die Flags `gi` und `nogi`. Reine Gi-Techniken (Cross Collar Choke, Bow & Arrow) sind in der No-Gi-Ansicht ausgegraut. Im gemeinsamen Modell zählen sie normal.

---

## 5. Sternkarte (Skilltree)

- **Aufbau:** 193 Techniken auf fünf Ringen, benannt nach den klassischen Stufen der Überlieferung: Kiso (Fundament), Shoden, Chūden, Okuden, Hiden. Jeder Sektor ist in Zweige geteilt (Guard z. B. in Closed Guard, Offene Guard, Half Guard, Haken & Beine, Gi-Guards), die als eigene Arme der Sternkarte nach außen wachsen. Submission hat neben Armhebeln, Dreiecken, Kragenwürgern, Kopf-Arm-Würgern und Beinhebeln einen Zweig „Kurbeln & Kompression“ für Can Opener, Twister und Kosovo Cradle. Dazu kommen Nischen-Techniken wie Waki-gatame, Hiza-gatame, Locoplata, Kata-ha-jime, Brabo, Ninja und Buggy Choke, Suloev Stretch und Electric Chair. Wo ein Ring voll wird, stehen die Sterne abwechselnd innen und außen, auch über die Grenze zweier Zweige hinweg. Dazu sechs Sektoren: Guard, Submission, Kontrolle, Passing, Stand, Verteidigung. Die Sektoren sind so angeordnet, dass verwandte Bereiche nebeneinanderliegen (Guard neben Submission, Kontrolle neben Passing).
- **Namen:** so, wie sie auf deutschen Matten gesagt werden (meist englisch oder portugiesisch). Deutsche Namen nur, wo sie dort wirklich fallen: Shrimp statt Hüftflucht, Breakfall statt Fallschule, Technical Stand-up statt Aufstehen in Base. Die deutschen Namen bleiben als „auch:“ suchbar. Japanische Begriffe stehen in Kodokan-Schreibweise mit Bindestrich, deutsche Judo-Namen nach dem Deutschen Judo-Bund (O-soto-gari = Große Außensichel). Andere Namen stehen als „auch:“ dabei und sind im Codex durchsuchbar. Benannte Techniken (Williams Guard, Tarikoplata, Baratoplata, Estima Lock, Imanari Roll) nennen ihren Namensgeber. Reine Gi-Techniken sind markiert. Beinhebel und riskante Techniken tragen einen Sicherheitshinweis.
- **Kanten:** Voraussetzungs-Kanten innerhalb eines Sektors. Dazu Kombo-Kanten quer über Sektoren, z. B. Scissor Sweep → Mount → Armbar oder Snap Down → Rücken. Eine Kombo leuchtet auf, sobald beide Enden Stufe 3 haben.
- **Zustände:** Die Größe, Füllung und das Leuchten eines Sterns zeigen die Stufe. Ein Fortschrittsring zeigt den Weg zur nächsten Stufe. Gold heißt Tokui-Waza, Rostfarbe heißt Rost, gestrichelt heißt vorläufig.
- **Nebel:** Sterne ohne gesehenen Nachbarn sind nur Punkte ohne Namen. Die Karte deckt sich beim Lernen auf.
- **Hexagon als Schatten:** Hinter der Karte liegt das Attribut-Hexagon, auf dieselben sechs Achsen ausgerichtet. Der Baum und der Charakterbogen sind damit visuell dasselbe Objekt.
- **Onboarding-Kalibrierung:** Beim Start markiert man, was man kennt, was im Roll klappt und bis zu fünf Stärken (4.8). Selbsteinschätzungen sind vorläufig, bis die Daten sie bestätigen.
- **Detailfeld pro Stern:** Stufe, Meisterung, Bedingungen für die nächste Stufe mit aktuellem Stand, Versuche roh und gewichtet, geglättete Quote, Untergrenze gegen die Basisquote, zuletzt live, Voraussetzungen, freigeschaltete Techniken und Kombos.
- **Wachstum:** Die Bibliothek darf wachsen. Das Layout trägt bis zu vier Sterne pro Ring und Sektor im Kern und fünf in den äußeren Ringen. Darüber hinaus rücken die Sterne enger oder es kommt ein sechster Ring dazu.
- **Filter:** Gi/No-Gi-Ansicht (Abschnitt 4.7), später nur Kombos und nur Rost.
- **Später:** eine Weltkarte der Positionen. Positionen sind Orte, Techniken die Wege dazwischen. Daraus entsteht eine Übergangsanalyse: Wo verlierst du Rolls?

---

## 6. Quests und RPG-Systeme

### 6.1 Tagesquest (Draft aus drei Karten)

Vor dem Training zieht die App drei Karten, man nimmt eine. Einmal pro Tag darf man neu ziehen. Die Wahl stärkt die Autonomie, die Karten steuern die Datenerhebung dorthin, wo sie am meisten bringt.

Priorität pro sichtbarem Stern:

```text
P =  1,2 · Fortschritt zur nächsten Stufe        (Stufe 2–4)
   + 0,6 / (1 + n / 4)                           (Unsicherheit, Stufe 2–4)
   + 0,9 · Rost
   + 0,8 · (100 − Achsenwert) / 100              (schwache Achse)
   + 0,9 · diese Woche im Kurs
   + 0,35 · neu                                  (Stufe 0–1)
   + 0,8 · offene Selbsteinschätzung             (4.8)
   − 1,5 · in den letzten 3 Trainings schon Quest
   − 0,8 · schon Tokui-Waza
```

Die drei Karten kommen aus drei verschiedenen Sektoren, mit höchstens einer Schmiede- und höchstens einer Kata-Karte. An einem No-Gi-Tag fallen reine Gi-Techniken weg. Jede Karte nennt ihren Grund, z. B. „Kurz vor Stufe 4“, „Rostet seit 70 Tagen“ oder „Achse Stand ist gerade deine schwächste Seite“.

| Quest-Typ | Wann | Aufgabe |
|---|---|---|
| Kata | Stufe 0–1 | 3 × 10 Wiederholungen, abhaken |
| Jagd | Stufe 2–5 | in jedem Roll versuchen, Versuche und Treffer zählen (bei Positionen: wie oft gehalten) |
| Standhalten | Escapes und Abwehr | sich bewusst in die Lage bringen, Escapes zählen |
| Schmiede | Rost | mindestens einmal live treffen |

### 6.2 Wochenboss

Die Position, in der du in den letzten 14 Tagen am häufigsten festgehangen hast (aus der Notiz), wird zum Boss mit Namen, z. B. „Der Schraubstock“ für „Unter Side Control“. Die Lebenspunkte sind die Anzahl der Fälle. Der Boss ist besiegt, wenn es in den nächsten 14 Tagen höchstens halb so oft passiert. Der Boss liefert passende Techniken für die Quest-Auswahl.

### 6.3 Arcs

Acht-Wochen-Staffeln, gezählt ab dem ersten Tag: Arc I „Erwachen“, II „Erste Prüfung“, III „Die Schmiede“, IV „Sturm“ und so weiter. Später bekommt jeder Arc ein selbst gewähltes Ziel, z. B. die Achse Passing +10 oder Knee Cut auf Stufe 4. Am Ende gibt es eine Rückblick-Karte mit dem Hexagon vorher und nachher, zum Teilen im Wrapped-Stil.

### 6.4 Klasse, Titel, Achievements

- **Klasse** = Spielstil. Man wählt sie beim Start, die Daten zeigen daneben, wofür das eigene Spiel spricht. Neun Klassen: Netzweber (Guard), Druckwalze (Passing), Anker (Pins und Mount), Schattenläufer (Rücken und Rückennahmen), Jäger (Submissions ohne Beinhebel), Fersenjäger (Beinhebel und Beinverknotungen wie Ashi Garami, 50/50, Saddle), Sturmbrecher (Stand), Festung (Escapes und Abwehr), Wandler (Allrounder). Die gewählte Klasse gibt +20 % Quest-XP auf ihre Techniken (Wandler +8 % auf alles). Die erkannte Klasse ist die mit der höchsten Summe der fünf besten Meisterungen ihrer Techniken; liegen die zwei besten weniger als 10 Punkte auseinander, heißt sie Wandler.
- **Rang** nach Level: Mattenneuling, Schüler des Dōjō, Wanderer der Matte, Techniksucher, Rollkrieger, Klingenschmied, Dōjō-Veteran, Legende der Matte.
- **Titel** = beste Tokui-Waza als Beiname, z. B. Triangle → „Die Dreiecksfalle“, Knee Cut → „Die Knieklinge“.
- **Gürtelprüfung** = Klassenwechsel-Event mit eigener Animation. Das Datum wird als Ground Truth gespeichert.
- **Siegel** (17 Stück): erstes Training, zehn Trainings, 100 Rolls, erste Technik auf Stufe 3 und 4, erste Tokui-Waza, erste aktive Kombo, Flamme IV und XII, Boss besiegt, drei Treffer gegen Stärkere, 50 im Training erreichte Sterne (ohne die vom Start), je fünf Trainings in Gi und No-Gi, Arena (erstes Turnier), Podest (erste Medaille), Zweite Disziplin (zehn Einheiten Nebensport), Entdecker (drei Inseln der Seekarte vollständig erkundet).

### 6.5 Charakter und Ausrüstung

- **Charakter-Editor** in sieben Kategorien, beim Anlegen und jederzeit im Charakter:
  - Körper: Hautton (14 Töne plus freie Farbe), Größe, Statur und Muskeln als Regler; das Gewicht aus dem Steckbrief fließt in die Statur ein.
  - Gesicht: 6 Gesichtsformen, 7 Nasen (inklusive Boxernase), 8 Münder (inklusive Kampfschrei und Mundschutz), 4 Ohrformen.
  - Augen: 7 Augenformen, 12 Farben plus freie Farbe, zweifarbige Augen, Größe und Abstand als Regler, Wimpern, 7 Brauenformen.
  - Haare: 22 Frisuren (von Buzzcut über Cornrows und Afro bis Samurai-Knoten), 18 Farben plus freie Farbe, farbige Spitzen.
  - Bart: 8 Varianten.
  - Merkmale (mehrfach): Wangenröte, Sommersprossen, Muttermal, Augenringe, Narben, Pflaster, Mattenbrand, Kriegsbemalung.
  - Tattoo und Schmuck: 6 Arm-Tattoos (links, rechts, beide), Hals-Tattoo, Ohrringe. Tattoos sieht man im No-Gi mit kurzen Ärmeln oder Tanktop.
  Jede Option zeigt eine Vorschau des eigenen Kopfes. Ältere Speicherstände werden beim Laden übernommen.
- **Plätze:** Gi, Oberteil und Unterteil (No-Gi), Kopf, Accessoire, Merkmal, Talisman, Aura und drei Aufnäher (Schulter, Brust, Bein).
- **Items:** 108 feste Items plus Flaggen- und Tokui-Aufnäher, in vier Seltenheiten (gewöhnlich, selten, episch, legendär). No-Gi hat die größte Auswahl: 34 Oberteile (Rashguards lang und kurz, Shirts, Tanktops, 18 Muster von Ringel über Waben und Tarn bis Krake und Seekarte) und 22 Unterteile (Shorts, Spats, Shorts über Spats). Zum Start liegen 6 Oberteile und 4 Unterteile bereit. Quellen: Startausrüstung, Meilensteine (Level, Trainings, Rolls, Siegel, Arcs), Inseln der Seekarte (also Gürtel und Streifen), Turniere, Länder aus dem Steckbrief (Flaggen-Aufnäher), Tokui-Waza und Zufallsbeute nach dem Training.
- **Beute:** Das Inventar wird nicht gespeichert, sondern aus den Daten berechnet. Ob ein Training etwas abwirft, entscheidet ein Hash aus Datum und Position des Trainings am Tag: gleiche Daten, gleiche Beute, und Löschen und neu Speichern würfelt nicht neu. Chance 12 %, mehr bei Quest-Treffern (+13 %), erledigter Kata (+8 %) und Notiz (+4 %). Seltenheit: 3 % legendär, 12 % episch, 30 % selten, 55 % gewöhnlich. Duplikate bringen nichts, dadurch bleiben seltene Stücke selten.
- **Talismane** geben nur XP für Einsatz, nie Meisterung, z. B. +10 XP pro Training, +50 % auf Kata-Quests oder +3 XP pro Roll-Karte. Der Bonus wird beim Speichern festgeschrieben, damit ein späterer Wechsel die Vergangenheit nicht umschreibt.
- **Flaggen:** 125 Länder und Regionen (u. a. Iran, Palästina, Aserbaidschan, Albanien, Kosovo, Kurdistan, Dagestan, England, Schottland, Wales), alphabetisch mit Suche. Flaggen mit Wappen oder feinen Emblemen sind vereinfacht, wo es eine Zivilflagge gibt, wird sie verwendet.

### 6.7 Turniere

- **Eingabe** im Log über den Umschalter „BJJ-Training | Turnier | Nebensport“: Name, Datum, Veranstalter oder Regelwerk (IBJJF, AJP, ADCC, AGF, Grappling Industries, NAGA, Verband, Hausturnier), Gi oder No-Gi, Gewichtsklasse, die Kämpfe (Sieg, Niederlage, Unentschieden; Aufgabe mit Technik, Punkte, Vorteile, Kampfrichter, DQ, kampflos; Gürtel des Gegners) und die Platzierung.
- **Gewichtsklassen:** die IBJJF-Klassen als Auswahl und ein freies Feld für alles andere (z. B. „-77 kg“, „Open“, „Superfeder“). Eigene Klassen merkt sich der Steckbrief, die letzten acht erscheinen beim nächsten Turnier als Auswahl.
- **Rechnung:** Jeder Kampf geht mit doppeltem K-Faktor ins Power Level (4.2). Ein Aufgabe-Sieg mit Technik zählt als Versuch und Treffer mit Gewicht 2 und als Treffer gegen Stärkere. Turniere zählen fürs Wochenziel. XP: 150 fürs Antreten, 50 pro Kampf, 40 pro Aufgabe-Sieg, 300/200/120 für Gold/Silber/Bronze.
- **Belohnungen:** Siegel „Arena“ und „Podest“, Turniermedaillen in Bronze, Silber und Gold (Accessoire), Arena- und Finisher-Aufnäher, Champion-Rashguard.
- **Kampfrekord** im Charakter: Bilanz, Aufgabe-Siege, Siegquote, Medaillen und die Liste aller Turniere.

### 6.8 Scouter

Eine Linse mit Fadenkreuz, die Kämpfer ausliest. Sie hat vier Modi, zwischen denen man oben in der Linse umschaltet:

- **Du** (Tipp auf das Power Level im Kopfbereich oder der Knopf im Charakter): Power Level, Stufe (Weißgurt- bis Schwarzgurt-Niveau), Veränderung in 8 Wochen und ein Verlauf der letzten 16 Wochen mit Spitze. Der Verlauf lässt sich mit Zeiger oder Pfeiltasten Woche für Woche lesen. Dazu die sechs Achsen, eine Analyse (stärkste und schwächste Achse, beste Waffe, Treffer gegen Stärkere, rostende Techniken, Form der letzten 8 Wochen), die Bilanz nach Gürtel (Rolls, eigene Subs, getappt) und der Steckbrief (Level, Klasse, Division, Turnierbilanz, Kopfgeld).
- **Partner** (Knopf „Partner scannen“ auf jeder Roll-Karte, oder im Scouter umschalten): Gürtel, Größe und Gi/No-Gi wählen. Der Scouter schätzt das Power Level des Partners (Gürtel-Rating plus Größe, wie in 4.1), zeigt deine Erwartung im Roll (Elo-Erwartungswert), was auf dem Spiel steht (Power-Level-Änderung für drei typische Ausgänge: du tappst und führst, ausgeglichen, du wirst getappt und kontrolliert) und deine bisherige Bilanz gegen diese Kombination. Dazu ein **Plan** aus einfachen Regeln: Gegen klar Stärkere (Erwartung unter 38 %) überleben und lernen, mit den Escapes des Wochenbosses zuerst. Gegen klar Schwächere (über 62 %) das A-Game weglassen und ausprobieren, was noch nicht live bewiesen ist. Dazwischen das A-Game, also die Techniken mit der höchsten Meisterung. Schwerere oder leichtere Partner bekommen einen Satz dazu. Reine Gi-Techniken fallen im No-Gi weg.
- **Gegner** (Knopf „Scannen“ an jedem Turnierkampf): wie Partner, aber mit Turnier-Einsatz (doppelter K-Faktor, Sieg, Unentschieden, Niederlage), deiner Turnierbilanz und deinen Rolls gegen diesen Gürtel, deinen Waffen im gewählten Regelwerk (Gi oder No-Gi) und einem Hinweis, worauf du achten musst (Position des Wochenbosses oder schwächste Achse). Bei Beinhebeln erinnert er ans Regelwerk.
- **Boss** (Knopf am Wochenboss auf Heute): Name, Position, Lebenspunkte, Trend gegenüber den 14 Tagen davor, das Ziel zum Besiegen und die Techniken, die dagegen helfen, mit ihrer Stufe.

Alle Zahlen kommen aus demselben Rechenkern wie der Rest der App (`src/arc/core/scouter.ts`, mit Tests). Die Schätzung eines Partners kennt nur Gürtel und Größe; das sagt der Scouter auch so. Er ist bewusst statisch: Die einzige inszenierte Bewegung der App bleibt das Kapitelende (7.1). Er ist ein echter Dialog mit Tab-Leiste, Escape schließt ihn, der Fokus bleibt in der Linse und springt danach zurück.

### 6.9 Seekarte

Die Reise als Seefahrt, als zweite Karte neben der Sternkarte. Der Aufbau der Welt ist an bekannte Piraten-Anime angelehnt (vier Meere, ein großer Seeweg quer über die Welt, ein Gebirgskamm, windstille Gürtel). Alle Namen, Inseln und Texte sind eigene, damit keine geschützten Namen oder Motive übernommen werden:

- **Welt:** Der Scharlachkamm teilt die Welt von Nord nach Süd, die Große Strömung umrundet sie von West nach Ost. Wo sich beide kreuzen, liegt das Tor der vier Strömungen. Zu beiden Seiten der Strömung liegen die Kalmengürtel (der reale Begriff für die Windstillen am Äquator).
- **Vier Heimatmeere:** Frostmeer, Morgenmeer, Abendmeer, Glutmeer. Man wählt eins im Steckbrief.
- **Jeder Streifen ist eine Insel** (40 Inseln): Weißgurt im Heimatmeer (fünf Inseln vom Hafen zum Tor), Blau- und Lilagurt in der Äußeren Strömung bis zur Wartenden Mauer, Braungurt über den Kammpass in die Tiefe Strömung, Schwarzgurt bis Kap Kuro, dem letzten Ziel gleich neben dem Tor.
- **Auf der Karte:** der gefahrene Kurs (gestrichelt vor der App, durchgezogen seit dem Start), das Schiff in der Farbe der Klasse, der Kurs zur nächsten Insel, Turniere als gekreuzte Klingen an der Insel, an der man damals lag, und der Wochenboss als Seeungeheuer neben dem Schiff.
- **Inselkarte:** Beschreibung, Status (erreicht am, hier liegt dein Schiff, noch n Streifen), Turniere dort und Items, die dort warten.
- **Kopfgeld-Steckbrief:** ein Fahndungsplakat mit Kopfbild und Kopfgeld in Gold. Das Kopfgeld wächst mit Leistung, nicht mit Fleiß allein: Level, Gürtel und Streifen, Tokui-Waza, Siegel, Turniere, Siege und Medaillen.
- **Reise zwischen den Inseln:** Ein Streifen kommt nur alle paar Monate. Damit die Karte dazwischen nicht stillsteht, segelt das Schiff mit jedem Training ein Stück weiter: 10 Seemeilen pro Training, 20 pro Turnier, 3 pro Einheit Nebensport. Der Weg zur nächsten Insel folgt `1 − e^(−Meilen/150)` und endet bei 85 %: Ankommen tut das Schiff erst mit dem Streifen, die Karte sagt also nichts über die nächste Prüfung voraus.
- **Schiff:** Es wächst mit dem Gürtel: Beiboot (Weiß), Schaluppe (Blau), Brigantine (Lila), Fregatte (Braun), Flaggschiff (Schwarz). Das große Segel trägt die Farbe der Klasse, den Namen wählt man selbst.
- **Flagge:** eine eigene Crew-Flagge aus Tuch, Farbe des Zeichens, Zeichen (Totenkopf, Faust, Gürtelknoten, Waza-Stern, Welle, Oni-Maske), was dahinter kreuzt (Knochen, Säbel, Anker, Ruder, Gürtel) und was Totenkopf oder Oni auf dem Kopf tragen (Stirnband, Kopftuch, Dreispitz, Samurai-Knoten, Krone). Totenkopf und gekreuzte Knochen sind das alte, freie Piratenzeichen; alles andere ist eigen. Die Flagge weht am Mast auf der Karte.
- **Wetter** aus dem Trainingsrhythmus der letzten 14 Tage gegen das Wochenziel: Flaute ohne Training (das Schiff treibt in den Kalmen), leichter Wind, frische Brise, starker Rückenwind ab 125 % des Ziels, Trockendock im Heilungsmodus. Auf der Karte als Windstriche oder ruhige Wasserringe am Schiff.
- **Zustand:** Rumpf, Segel und Takelage sind die Körperwerte aus dem Nebensport (Kraft, Ausdauer, Beweglichkeit, 6.10). Rostende Techniken hängen als Muscheln am Rumpf, eine Schmiede-Quest kratzt sie ab. Sehr niedrige Werte zeigen geflickte Segel.
- **Erkundung (Landgang):** Solange das Schiff an einer Insel liegt, decken die Trainings dort drei Orte auf: die Anlegestelle (1. Training), ein Wahrzeichen (8.) und das Geheimnis der Insel (15.). Jede der 40 Inseln hat eigene Namen dafür. Vollständig erkundete Inseln bekommen einen Wimpel auf der Karte, drei davon das Siegel „Entdecker“. Inseln, die vor der App erreicht wurden, bleiben unerkundet.
- **Logbuch:** Die Reise als Einträge, neueste oben und nach Monaten gruppiert: Abfahrt, neue Inseln mit Gürtelprüfungen, Entdeckungen, Turniere mit Platzierung, Meilensteine (10., 25., 50. Training und so weiter), Nebensport-Meilensteine und Wochen im Trockendock. Jeder Eintrag mit Insel springt auf die Karte.
- **Aufbau der Seite:** drei Reiter, Karte (mit Inselkarte und Steckbrief), Schiff (das Schiff als Heldenelement, Reise, Zustand, Flagge) und Logbuch. Die Rechnung liegt in `src/arc/core/voyage.ts`, mit Tests.

### 6.10 Nebensport

Viele trainieren neben BJJ noch etwas anderes. Das soll sichtbar sein, ohne die BJJ-Messung zu verwässern.

- **Sportarten:** Ringen, Judo, Sambo (Ringkampfsportarten), Kraftsport, Ausdauer, Boxen / Muay Thai, MMA, Mobility / Yoga. Im Steckbrief wählt man, was man betreibt, und seit wann. Die gewählten Sportarten stehen im Log oben.
- **Eingabe** im Log unter „Nebensport“: Sportart, Datum, Dauer (Chips oder frei, 5 bis 300 Minuten), Intensität (locker, mittel, hart). Bei den Ringkampfsportarten optional ein Takedown aus dem Stand-Sektor mit Versuchen und Treffern.
- **Wochenziel:** Nebensport zählt nicht. Das Wochenziel bleibt ein BJJ-Ziel, sonst ließe es sich mit Laufen oder Hanteln erfüllen.
- **Takedowns:** Versuche und Treffer aus Ringen, Judo und Sambo zählen als Belege für Stand-Techniken, aber mit Gewicht 0,75 gegenüber einem BJJ-Roll, weil die Regeln anders sind (kein Guard-Pull, andere Wertung, oft ohne Gi). In einen Gi- oder No-Gi-Vergleich (4.7) gehen sie nicht ein. Aufs Power Level wirken sie nicht, weil es keine Partnerstärke gibt.
- **Körperwerte:** Kraft, Ausdauer und Beweglichkeit von 0 bis 100 aus den Minuten der letzten 8 Wochen, gewichtet nach Intensität (0,7 / 1 / 1,3) und Sportart (Kraftsport füttert vor allem Kraft, Boxen und MMA Ausdauer, Mobility Beweglichkeit, Ringen etwas von allem). Der Wert sättigt: `100 · (1 − e^(−Summe/900))`. Die Körperwerte stehen im Charakter neben dem Hexagon und fließen nicht in die Achsen.
- **XP** siehe 4.6, dazu das Siegel „Zweite Disziplin“ nach zehn Einheiten.

### 6.11 Gym-Modus (später)

- Der Coach pflegt den Kursplan, dann entfällt Schritt 2 für alle.
- Der Coach kann Techniken „siegeln“, als externe Bestätigung von Stufe 4 oder 5.
- Gym-Quests für alle, z. B. „Diese Woche: Mount Escapes“.
- Bewusst keine öffentliche Rangliste für das Power Level, höchstens eine Anwesenheits-Serie (opt-in).
- Ein Dashboard für Gym-Betreiber: Anwesenheit, Abwanderungsrisiko in den ersten Monaten. Das ist der Teil, für den ein Gym bezahlen würde.

---

## 7. Screens

1. **Heute:** drei Quest-Karten, Wochenboss, Wochenziel, Knopf „Training loggen“.
2. **Log-Flow:** Check-in, Roll-Karten als Kartenstapel zum Wischen, Quest-Zähler, optionale Notiz. Danach das Kapitelende (7.1) mit XP, Level, Stufenaufstiegen, Power-Level-Änderung und Beute. Ein Umschalter führt zur Turnier-Eingabe (6.7) und zum Nebensport (6.10).
3. **Sternkarte:** zoombar, Sektor-Fokus, Detailfeld.
4. **Charakter:** fünf Reiter. Übersicht (Figur, Scouter, Steckbrief-Daten, gewählte und erkannte Klasse, Hexagon, Power-Level-Verlauf, Siegel), Aussehen (Editor), Ausrüstung (Plätze, Inventar, gesperrte Items mit Freischalt-Bedingung), Turniere (Kampfrekord) und Steckbrief (Name, Länder, Geburtsjahr, Gewicht, Heimatmeer, Klasse).
5. **Seekarte:** umschaltbar mit der Sternkarte, mit den Reitern Karte, Schiff und Logbuch (6.9).
6. **Konto:** Anmelden mit allen eingeschalteten Wegen und Konto verwalten (8.5). Erreichbar über das Profil, den Startbildschirm und das Wolken-Symbol im Kopfbereich, sobald man angemeldet ist.
7. **Arc und Rückblick:** Staffelziel, Monats- und Jahreskarte zum Teilen.

Die App zeigt Heute, Log-Flow mit Live-Vorschau und Beute, Sternkarte, Codex und Charakter. Der Einstieg führt in fünf Schritten durch Steckbrief, Rang, Klasse, Aussehen und Technik-Stand.

### 7.1 Gestaltung: Manga-Band

Die App soll sich wie ein hochwertiges Spiel anfühlen, nicht wie ein Dashboard. Das Leitbild ist ein Manga-Band: Tusche auf Papier, Panels mit harter Kontur, wenige kräftige Druckfarben.

**Palette** (je Farbe ein fester Zweck):

| Name | Hell | Nacht | Rolle |
|---|---|---|---|
| Papier | `#F2F3EE` | `#1B2350` | Fläche. Kühles Weiß, kein Creme. Nachts Tinte auf Indigo, kein Schwarz |
| Tusche | `#16171C` | `#16171C` | Konturen, Text, harte Schatten |
| Ai (Indigo) | `#2A3A8F` | `#AEB9FF` | Navigation, Auswahl, Links |
| Yamabuki (Goldgelb) | `#F3B000` | `#F3B000` | XP, Level, Beute, das eine Heldenelement |
| Kurenai (Karmin) | `#C8203F` | `#FF6B82` | Boss, Rost, Warnungen, Löschen |
| Asagi (Petrol) | `#177384` | `#5FC6D4` | Meer, Nebensport, Körperwerte |

**Schrift:** Dela Gothic One für Titel und große Zahlen (Level, Power Level), M PLUS Rounded 1c für Text und Bedienung. Beide selbst gehostet (SIL OFL), keine Anfrage an Google.

**Themes:** „Papier“ (hell) und „Nachtausgabe“ (dunkel). Standard ist die Systemeinstellung, im Profil lässt sich eins fest wählen. Ein kleines Skript im `<head>` setzt das Theme vor dem ersten Zeichnen, damit nichts aufblitzt.

**Leitprinzipien:**

1. **Ein mutiges Element pro Screen, der Rest ist ruhig.** Heute: die Quest-Karten. Log: das Kapitelende. Charakter: die Figur auf der Heldenbühne. Karte: die Karte selbst. Schiff: das Schiff mit Flagge. Konto: das Anmelde-Panel, angemeldet der Kontoausweis. Scouter: die Power-Level-Zahl. Das Heldenelement bekommt das schräg angeschnittene Panel mit hartem Tuscheschatten, alles andere bleibt flach mit dünner Kontur.
2. **Bewegung nur an einer Stelle.** Nach dem Speichern eines Trainings, Turniers oder Nebensports läuft das Kapitelende: Stempel, XP-Balken, Zeilen der Reihe nach, Beute. Nur bei `prefers-reduced-motion: no-preference`, mit Knopf zum Überspringen. Sonst gibt es keine Übergänge, kein Hover-Gleiten, kein Pulsieren. Einzige Ausnahme ist Bedienung, keine Inszenierung: Die Sternkarte fährt beim Fokussieren eines Sterns die Kamera hin, damit man auf der gezoomten Karte die Orientierung behält. Bei reduzierter Bewegung springt sie.
3. **Text wie in einem Buch, nicht wie in einem Formular.** Keine Großbuchstaben-Überzeilen, keine Mittelpunkt-Reihen („A · B · C“), keine Monospace-Etiketten, keine Pfeile hinter Knöpfen. Überzeilen sind kleine Beschriftungskästen in normaler Schreibweise, Metadaten stehen als Satz.

**Grundqualität:** Kontrast mindestens 4,5 : 1 für Text in beiden Themes (Goldgelb nie als Textfarbe auf Papier, nur als Fläche mit Tusche darauf), sichtbarer Fokusrahmen, echte Knöpfe statt klickbarer Flächen, Umschalter als Radiogruppe, Chips mit `aria-pressed`, Dialoge mit Fokusfalle und Escape, Zielgrößen über dem WCAG-2.2-Minimum von 24 px (Hauptknöpfe 46 px), Layout ab 320 px Breite ohne waagrechtes Scrollen.

---

## 8. Technik und Architektur

Waza Arc bleibt im Portfolio-Repo und nutzt das bestehende Supabase-Projekt. Nach außen ist es trotzdem eine eigene App mit eigenem Frontend. Das Portfolio legt schon heute eigene `index.html` in Unterordnern ab (`/strompreis/`, `/work/…`) und der Hoster liefert sie aus. `/arc/` nutzt denselben Mechanismus.

### 8.1 Frontend: eigener Einstiegspunkt im selben Vite-Projekt

Vite kann mehrere HTML-Einstiegspunkte bauen (Multi-Page-Build, `build.rollupOptions.input`). Waza Arc hat einen eigenen:

```text
index.html               → src/main.tsx        Portfolio, unverändert
arc/index.html           → src/arc/main.tsx    Waza Arc
src/arc/                 eigene App: Seiten, Komponenten, Styles, Supabase-Client
src/arc/core/            Rechenkern compute(), reine Funktionen, mit Tests
src/arc/data/            Technik-Bibliothek als versioniertes JSON
public/arc/              manifest.webmanifest, Icons, Service Worker (Scope /arc/)
```

- **Aufruf:** `rukawaanalytics.com/arc/`. Die App hat eine eigene `index.html` mit eigenem Titel, Meta- und OG-Tags, Favicon und PWA-Manifest. Auf dem Handy lässt sie sich als eigene App installieren.
- **Eigenes Bundle:** Vom Portfolio wird nichts geladen, kein GSAP, kein Lenis, keine Seitenübergänge, keine Portfolio-Fonts. Umgekehrt lädt das Portfolio nichts von Arc.
- **Eigenes Design:** eigene CSS-Tokens (Manga-Band, 7.1). Die Portfolio-`index.css` wird nicht importiert. Tailwind geht mit eigener Konfiguration für `src/arc`, schlichtes CSS auch. Fonts werden wie im Portfolio selbst gehostet (@fontsource), nicht von Google geladen.
- **Geteilt wird nur Unsichtbares:** Build, CI (Lint, Typecheck, Build), Deployment über Lovable, Supabase-Typen.
- **Routing per Hash** (`/arc/#/karte`), damit der Hoster keine Deep Links auf `arc/index.html` umleiten muss.
- **Weiterleitung:** `/arc` ohne Schrägstrich leitet die Portfolio-App auf `/arc/` weiter (`src/pages/ArcRedirect.tsx`).
- **Der eine offene Punkt:** Ein Test-Deployment muss zeigen, dass Lovable `/arc/` wirklich mit `arc/index.html` beantwortet und nicht mit der Rückfallseite des Portfolios. Plan B, falls nicht: dieselbe Ordnerstruktur, aber als eigenes Deployment auf `arc.rukawaanalytics.com` (z. B. Cloudflare Pages, kostenlos). Das Backend bleibt dabei gleich.

### 8.2 Backend: dasselbe Supabase-Projekt, eigenes Schema

Das Projekt „Rukawa Portfolio“ hat ein Schema `arc`, so wie es schon `energy`, `racing` und `personal` gibt. Der Free-Plan erlaubt zwei aktive Projekte, und beide sind mit Portfolio und CR-Analyse belegt. Ein drittes würde also Geld kosten. Die Datenmenge ist klein, ein Training ergibt einen Datensatz.

- **Migration:** [`supabase/migrations/20260925100000_arc_cloud_save.sql`](../../supabase/migrations/20260925100000_arc_cloud_save.sql), angewendet am 25. September 2026. Vor dem Anwenden lief sie mit 19 Prüfungen in einer Transaktion, die danach zurückgerollt wurde (fremde Konten, Gäste, Grabsteine, zweiter Faktor, Grenzen, Kontolöschung).
- **Tabelle** `arc.records` (Abschnitt 3) mit `user_id references auth.users on delete cascade`, Row Level Security „nur eigene Zeilen“ für Lesen, Anlegen und Ändern, keine Lösch-Policy (Löschen läuft über Grabsteine, das ganze Konto über den Fremdschlüssel). Revision und Zeitstempel setzt ein Trigger, nie der Client; Schlüsselspalten lassen sich nicht ändern. Grenzen: 32 KB pro Datensatz, 5000 Datensätze pro Konto, 500 pro Anfrage.
- **Nicht als Schema freigegeben:** Die App spricht nur drei Funktionen in `public` an: `arc_pull(since, limit)` und `arc_push(rows)` laufen mit den Rechten des Aufrufers, Row Level Security greift also zusätzlich zu ihren eigenen Prüfungen; `arc_delete_account()` löscht das eigene Konto samt Daten und verweigert das bei Admin-Konten des Portfolios. Keine Funktion ist für `anon` aufrufbar.
- **Zweiter Faktor serverseitig:** Hat ein Konto einen bestätigten zweiten Faktor, lassen alle drei Funktionen und die Policies nur Sitzungen mit `aal2` durch (`arc.mfa_satisfied()`).
- **Anmeldung** über Supabase Auth, siehe 8.5.
- **Eigener Supabase-Client** in `src/arc/cloud/engine.ts` mit eigenem `storageKey` (`waza-arc.auth`). Portfolio und Arc liegen auf derselben Domain und würden sich sonst die Sitzung im Browser teilen: Ein Admin-Login im Portfolio wäre dann auch in Arc aktiv und umgekehrt.
- **Migrationen** wie bisher unter `supabase/migrations`, mit `arc_` im Dateinamen.

### 8.3 Voraussetzung vor der ersten Registrierung (erledigt)

Sobald sich fremde Personen im Projekt anmelden können, haben sie die Rolle `authenticated`. Deshalb wurden am 25. September 2026 alle Regeln des Projekts geprüft (Policies, Tabellenrechte, `SECURITY DEFINER`-Funktionen, Storage) und die gefunden Lücken geschlossen: [`supabase/migrations/20260925090000_portal_lock_down_public_access.sql`](../../supabase/migrations/20260925090000_portal_lock_down_public_access.sql). Übrig gebliebene Policies früherer Stände, die angemeldeten Konten oder dem öffentlichen Schlüssel direkten Zugriff auf Tabellen und Dateien des Client-Portals gaben, sind entfernt; das Portal selbst arbeitet nur über seine Server-Funktionen und die Edge Function und läuft weiter. Nachgeprüft: Besucher und fremde Konten sehen dort nichts mehr, Admins alles wie vorher. Erst danach sollte die Registrierung eingeschaltet werden (siehe [`KONTO-SETUP.md`](KONTO-SETUP.md)).

### 8.4 Weitere Technik

- **Stack:** React, TypeScript, Vite. Die eine Animation (Kapitelende) ist reines CSS.
- **Plattform:** mobile-first PWA, offline-fähig (lokal zuerst, Sync bei Netz, 8.5), später Web Push für die Erinnerung zum Kursende.
- **Rechenkern:** `compute(history, asOf, filter?)` als reine Funktionen mit Unit-Tests für jede Formel und jede Stufenschwelle.
- **Sternkarte:** SVG mit festem radialem Layout (Ring × Sektor), berechnet aus `techniques.ring` und der Reihenfolge im Sektor. Kein Force-Layout, damit die Karte stabil bleibt.

### 8.5 Konto und Sync

**Anmeldewege.** Die Anmeldeseite fragt beim Laden die öffentlichen Auth-Einstellungen des Projekts ab (`/auth/v1/settings`) und zeigt genau die Wege, die im Dashboard eingeschaltet sind:

- **Passkey** (Face ID, Fingerabdruck, Sicherheitsschlüssel). Supabase unterstützt das seit supabase-js 2.105, noch als experimentelle Funktion. Einen Passkey fügt man nach der ersten Anmeldung im Konto hinzu.
- **Google, Apple, Discord, GitHub** und jeder andere eingeschaltete OAuth-Anbieter, mit Logo nach den Vorgaben der Anbieter.
- **E-Mail mit Code**, ohne Passwort: Der Code funktioniert auf jedem Gerät, der Link in derselben Mail nur im Browser, der ihn angefordert hat. Neue Adressen bekommen dabei ein Konto.
- **E-Mail mit Passwort**, mit Stärkeanzeige und „Passwort vergessen“ per Code.
- **Handynummer mit SMS-Code**, sobald ein SMS-Anbieter eingerichtet ist.
- **Gastkonto** (anonyme Anmeldung): sichert sofort ohne Angaben; später verbindet man E-Mail oder einen Dienst, ohne dass Daten verloren gehen.
- **Zweiter Faktor** mit einer Authenticator-App (TOTP) im Konto einrichtbar; nach der Anmeldung fragt die App dann nach dem Code.
- Optional **Cloudflare Turnstile** gegen Bots, wenn `VITE_ARC_TURNSTILE_SITEKEY` gesetzt und im Projekt CAPTCHA aktiv ist.

Weiterleitungen (OAuth, Links in Mails) nutzen PKCE: Der Code kommt als `?code=…` zurück und kollidiert nicht mit dem Hash-Routing. Danach landet man wieder auf dem Screen, von dem man kam.

**Konto verwalten:** Anmeldewege verbinden und trennen, E-Mail hinzufügen oder ändern (mit Code), Passkeys hinzufügen, umbenennen, löschen, zweiten Faktor ein- und ausschalten, Passwort setzen, abmelden (auf Wunsch mit Entfernen der Kopie auf dem Gerät), auf allen Geräten abmelden, Konto löschen.

**Lokal zuerst.** Die App funktioniert ohne Konto und ohne Netz genau wie vorher. Jedes Konto bekommt im Browser einen eigenen Speicherplatz, getrennt vom Gerät-Speicher ohne Konto, damit sich zwei Personen an einem Gerät nie vermischen. Das Konto-Modul (Supabase-Client und Sync) lädt nur, wenn jemand angemeldet ist oder sich anmeldet; alle anderen laden es nie.

**Sync.** Jede Änderung auf dem Server bekommt eine laufende Revisionsnummer. Ein Gerät holt alles oberhalb der letzten Revision, die es kennt, und schickt jeden Datensatz, der sich von der „Basis“ unterscheidet, also dem Stand, auf den es sich zuletzt mit dem Server geeinigt hat. Löschungen gehen als Grabsteine raus. Der Abgleich läuft kurz nach jeder Änderung, beim Zurückkehren in den Tab, wenn das Netz wiederkommt, und alle fünf Minuten; bei Fehlern mit wachsenden Pausen.

**Konflikte** (derselbe Datensatz hier und anderswo geändert): Der Root-Datensatz wird Feld für Feld zusammengeführt, auch in verschachtelten Objekten; Listen aus einfachen Werten (gesehene Items, Pausenwochen, bekannte Techniken) wie Mengen, mit Hinzufügungen und Entfernungen beider Seiten. Wo beide dasselbe Feld geändert haben, gewinnt das Gerät, das gerade abgleicht; danach sind alle Geräte gleich. Bei allen anderen Datensätzen gewinnt dieses Gerät, mit einer Ausnahme: Eine Änderung auf einem anderen Gerät schlägt eine Löschung hier, damit nichts Geloggtes aus Versehen verschwindet. Das Demo-Dōjō wird nie abgeglichen.

**Erste Anmeldung auf einem Gerät:** Hat nur das Gerät Daten, wandern sie ins Konto. Hat nur das Konto Daten, kommen sie aufs Gerät. Haben beide welche, fragt die App: zusammenführen (Trainings, Turniere und Nebensport von beiden, Profil aus dem Konto), nur den Stand aus dem Konto, oder nur den Stand von diesem Gerät (ersetzt das Konto).

**Geprüft** mit Unit-Tests für Datensätze und Zusammenführung (zwei simulierte Geräte gegen einen simulierten Server) und mit einem End-to-End-Test im Browser gegen ein nachgebautes Supabase: Registrierung per Code, falscher Code, Konto direkt aus dem Einstieg mit Rückkehr ins Dōjō, Umzug der Gerätedaten ins Konto, zweites Gerät, neues Training kommt auf dem anderen Gerät an, Google-Anmeldung mit Weiterleitung, Auswahl bei zwei Ständen, Abmelden mit Entfernen der Kopie, Kontolöschung.

---

## 9. Datenschutz

- Nur, was die Rechnung braucht. Keine Verletzungsdaten. Der Heilungsmodus speichert nur „Pause“ ohne Grund.
- Geburtsjahr und Gewicht sind freiwillig und dienen nur der Altersklasse und der Figur. Gespeichert wird das Geburtsjahr, kein Datum.
- Trainingspartner werden nicht namentlich erfasst, nur Gürtel und Größe.
- Hosting in der EU (Supabase Frankfurt), Export und Löschung aller Daten per Knopf (Konto löschen entfernt Konto, Server-Daten und die Kopie auf dem Gerät).
- Mit Konto gespeichert: die Anmeldedaten (E-Mail, Telefonnummer oder die Kennung des verbundenen Dienstes, bei Passkeys der öffentliche Schlüssel) und die Waza-Arc-Daten. Bei Google, Apple und Co. bekommt der Anbieter mit, dass man sich anmeldet. Die Datenschutzerklärung des Portfolios braucht dafür einen eigenen Abschnitt (siehe `KONTO-SETUP.md`).
- Für den Gym-Modus: Coaches sehen Anwesenheit und gesiegelte Techniken, nicht die Roll-Karten.

---

## 10. Validierung: Taugen die Zahlen etwas?

Das ist der Teil, der aus der App ein vorzeigbares Datenprojekt macht.

1. **Coach-Abgleich:** Der Coach bewertet die Pilot-Teilnehmenden einmal pro Achse auf einer Skala von 1 bis 10. Verglichen wird die Rangkorrelation (Spearman) mit den berechneten Achsen.
2. **Stabilität:** Wie stark springen Meisterung und Achsen von Woche zu Woche ohne echte Veränderung? Ziel: glatte Verläufe, klare Sprünge nur bei Stufenaufstiegen.
3. **Vorhersage:** Steigen Power Level und Achsen in den Wochen vor einer Streifen- oder Gürtelvergabe? Bei kleinen Zahlen ist das deskriptiv, aber gut erzählbar.
4. **Partner-Ratings kalibrieren:** Die Gürtel-Ratings werden aus den Roll-Ergebnissen aller Teilnehmenden per Maximum Likelihood geschätzt, statt sie gesetzt zu lassen.
5. **Sensitivität:** Wie ändern sich die Rangfolgen, wenn man Gewichte (0,65/0,35, Prior-Stärke 4, Halbwertszeiten) um ±30 % verschiebt? Robuste Rangfolgen sind ein gutes Zeichen.
6. **Log-Treue:** Anteil der Trainings, die geloggt wurden, und Median der Eingabezeit. Das misst, ob das Kernversprechen „realistisch zu merken“ hält.

Daraus wird die Case Study: „Kann man BJJ-Fortschritt messen? Acht Wochen, zehn Leute, ein Gym.“

---

## 11. Roadmap

| Phase | Inhalt | Ergebnis |
|---|---|---|
| 0 Fundament | Erledigt: eigener Einstiegspunkt `/arc/`, App lokal-first, Rechte aufgeräumt (8.3), Schema `arc` angewendet, Anmeldung und Sync (8.5). Offen: Anmeldewege und Registrierung im Dashboard einschalten (`KONTO-SETUP.md`) | Die Architektur steht |
| 1 Eigenversuch | Läuft ab sofort lokal: Log-Flow, alle 193 Techniken, Stufen und Meisterung, Tagesquest (ein Typ), Hexagon, XP. Nur du selbst | Du loggst 4 Wochen lang wirklich, erste echte Daten |
| 2 Spielsysteme | Sternkarte mit Nebel und Kombos, Drei-Karten-Draft, Wochenboss, Klasse und Titel, Rückblick-Karte | Die App macht Spaß, nicht nur Sinn |
| 3 Gym-Pilot | 5 bis 10 Leute, Kursplan vom Coach, Coach-Bewertung als Ground Truth | 8 Wochen Daten mehrerer Personen |
| 4 Auswertung | Validierung (Abschnitt 10), Kalibrierung der Parameter, Case Study im Portfolio | Belegbare Modellgüte und eine Geschichte dazu |

---

## 12. Entscheidungen und offene Fragen

Entschieden:

- **Kontrolle** bleibt „Partner / gleich / ich“, ohne oben/unten.
- **Gi und No-Gi** werden zusammen gerechnet, mit Vergleichsansicht, sobald beide Seiten genug Daten haben (4.7).
- **Mindestens 72 Techniken** schon in der ersten Version. Umgesetzt sind 193.
- **Name:** Waza Arc statt Tatami Arc (Markenkonflikt mit Tatami Fightwear). Vor einem öffentlichen Start noch eine Markenrecherche beim DPMA und EUIPO machen.
- **Im Portfolio** mit eigenem Frontend unter `/arc/` und demselben Supabase-Projekt (Abschnitt 8).
- **Einstieg mit Vorerfahrung:** Prolog-XP aus dem Gürtel, Selbsteinschätzung bis Stufe 4, aber vorläufig und ohne XP, bis die Rolls sie bestätigen (4.8).
- **Klassen** wählt man selbst, die Daten zeigen daneben die erkannte Klasse (6.4).
- **Ausrüstung** beeinflusst nur XP und Aussehen, nie Meisterung, Stufen oder Power Level (6.5).
- **Power Level statt Ki**, mit Scouter-Anzeige (4.2, 6.8).
- **Turniere** werden geloggt und zählen im Rechenmodell mit (6.7).
- **Seekarte** mit eigener Welt, deren Aufbau an bekannte Piraten-Anime angelehnt ist, aber nur eigene Namen verwendet (6.9).
- **Nebensport** zählt nicht fürs Wochenziel. Takedowns aus Ringen, Judo und Sambo zählen mit Gewicht 0,75 für Stand-Techniken (6.10).
- **Gestaltung** als Manga-Band in zwei Themes, Papier und Nachtausgabe, mit Bewegung nur im Kapitelende (7.1).
- **Konto und Sync** über dieselbe Supabase-Instanz, als Datensätze mit Revisionen und Dreiwege-Abgleich statt einer Tabelle pro Objekt (3, 8.5). Die Anmeldeseite zeigt, was im Dashboard eingeschaltet ist.
- **Scouter** mit vier Modi: du, Partner, Gegner, Boss (6.8).
- **Seekarte** mit Reise zwischen den Inseln, Schiff nach Gürtel, eigener Flagge, Wetter, Erkundung und Logbuch (6.9).

Offen:

- Positional Sparring (Start in einer Position) als eigener Roll-Typ, der nicht ins Power Level eingeht?
- Offline-Start über einen Service Worker (Scope `/arc/`), damit die App auch ohne Netz im Gym-Keller öffnet.
