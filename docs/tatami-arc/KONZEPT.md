# Tatami Arc – Konzept

Arbeitstitel. Eine BJJ-Fortschritts-App im Stil eines Anime-RPGs.

**Kurz:** Nach dem Training loggst du in gut einer halben Minute, was passiert ist. Im Training zählst du nur eine Sache mit, deine Tagesquest. Daraus rechnet die App deinen Fortschritt pro Technik aus, gewichtet nach Partnerstärke und Datenlage, und zeigt ihn als Sternkarte (Skilltree), Hexagon und Kampfkraft.

Klickbarer Prototyp mit simulierten Daten: [`prototyp.html`](prototyp.html). Die Datei ist der Quelltext des Artifacts. Lokal im Browser öffnen oder in Claude ansehen.

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
| 1 Check-in | Trainingsart (Gi, No-Gi, Open Mat). Datum und Dauer kommen aus dem Kursplan | 1 | 2 s | XP, Wochenserie, Mattenzeit |
| 2 Heute im Kurs | Technik aus der Liste, zuletzt genutzte oben. Im Gym-Modus trägt der Coach sie ein, dann 0 Tipps | 0–2 | 2 s | Wissen |
| 3 Roll-Karten | Pro Roll: Gürtel des Partners, Größe (leichter/gleich/schwerer), Subs ich, Subs Partner, Kontrolle (Partner/gleich/ich). Standardwerte: gleich groß, 0, 0, gleich | 2–4 pro Roll | 4 s pro Roll | Kampfkraft, Form, Partnergewicht |
| 4 Quest-Zähler | Versuche und Treffer (bei Überleben: Escapes, bei Drill: erledigt) | 2–6 | 5 s | Meisterung |
| 5 Notiz, optional | „Hat funktioniert“ (Technik) und „Festgehangen in“ (6 Positions-Chips) | 2 | 6 s | Bonus-Evidenz, Wochenboss, +15 XP |

**Summe bei 5 Rolls: etwa 30 bis 40 Sekunden.**

Bewusst **nicht** geloggt: jede einzelne Technik pro Roll, Zeit in Positionen, Verletzungen (Gesundheitsdaten nach Art. 9 DSGVO).

**Mitzählen im Training:** nur die Quest, als laufender Zwischenstand („3 Versuche, 1 Treffer“). Tipp in der App: in der Pause zwischen den Runden beim Wassertrinken kurz aktualisieren. Später optional eine Watch-Komplikation mit zwei Zählern.

**Erinnerung:** Push zum Kursende laut Stundenplan. Eingabe funktioniert offline (Keller-Gyms), Sync später. Ein Log bis 24 Stunden nach dem Training zählt voll.

---

## 3. Datenmodell (Supabase / Postgres)

```text
profiles        id, belt, stripes, weight_class, bjj_since, gym_id, weekly_goal (Standard 2)
gyms            id, name, schedule (jsonb)
positions       id, name, side (top | bottom | neutral)          -- für Wochenboss und später die Weltkarte
techniques      id, name_de, name_en, sector, ring (0–4), category, gi, nogi, from_position, to_position
technique_edges parent_id, child_id, kind (prereq | combo), combo_name
sessions        id, user_id, date, type (gi | nogi | open), duration_min, taught_technique_id, logged_at
rolls           id, session_id, idx, partner_belt, partner_size, subs_for, subs_against, control (0 | 0.5 | 1)
quests          id, user_id, date, technique_id, kind (drill | try | survive | rust), xp, reason
quest_results   quest_id, session_id, attempts, successes, done
session_notes   session_id, worked_technique_id, stuck_position_id
onboarding      user_id, technique_id, self_rating (kenne ich)
pauses          user_id, week_start, reason (verletzung | urlaub)
promotions      user_id, date, belt, stripes                     -- Ground Truth für die Validierung
skill_snapshots user_id, date, technique_id, level, mastery      -- wöchentlich materialisiert, für Verläufe
```

Alle Kennzahlen lassen sich aus `sessions`, `rolls`, `quest_results`, `session_notes` und `onboarding` neu berechnen. Die Rechenlogik liegt als reine TypeScript-Funktion `compute(history, asOf)` vor, mit Unit-Tests. So kann sie im Client (offline) und in einer Edge Function (nächtliche Snapshots) identisch laufen.

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

### 4.2 Kampfkraft (Elo)

```text
Roll-Ergebnis  S = 0,5 + 0,2 · (Subs ich − Subs Partner) + 0,3 · (Kontrolle − 0,5), begrenzt auf 0 … 1
Update         R_du ← R_du + 12 · (S − E)          pro Roll
Start          R_du = Gürtel-Rating des eigenen Gürtels
Anzeige        Kampfkraft = R_du × 10               (Anime-Zahl, z. B. 12.080)
```

Kontrolle zählt mit, damit auch Rolls ohne Submission etwas aussagen. Die Kampfkraft ist privat. Es gibt kein Ranking.

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
| 3 | Versucht | 5 Live-Versuche |
| 4 | Funktioniert | ≥ 8 gewichtete Versuche und UG ≥ b |
| 5 | Signature | ≥ 25 gewichtete Versuche, UG ≥ 1,5 · b und ≥ 3 Treffer in Trainings mit w̄ ≥ 1,1 („gegen Stärkere“) |

Dazu kommen zwei Zustände:

- **Vorläufig:** Stufe 2 nur durch das Onboarding erreicht. Wird im Baum gestrichelt gezeigt.
- **Rost:** Stufe ≥ 3 und seit 60 Tagen nicht trainiert (kein Kurs, kein Drill, keine Quest, keine Notiz). Der Stern verfärbt sich, die Meisterung sinkt über die Frische, die Stufe bleibt.

### 4.5 Attribute (Hexagon)

Sechs Achsen, identisch mit den sechs Sektoren der Sternkarte.

```text
Achse = 0,65 · Baum + 0,35 · Form            (nur Baum, wenn noch keine Form-Daten da sind)

Baum  = Σ Ring-Gewicht · M / Σ Ring-Gewicht über alle Techniken des Sektors
        Ring-Gewichte: Basis 1 · Kern 1,5 · Aufbau 2 · Meisterschaft 2,5

Form  = letzte 8 Wochen
        Submission    r = Σ w · Subs ich / Rolls                → 100 · (1 − e^(−r / 0,6))
        Verteidigung  t = Σ (Subs Partner / w) / Rolls          → 100 · e^(−t / 0,7)
        Kontrolle     m = Mittel(Kontrolle − E)                 → 50 + 100 · m, begrenzt auf 0 … 100
        Guard, Passing, Stand: Quest-Evidenz des Sektors zusammengefasst
                      → 100 · min(1, UG / 1,5b) · n / (n + 5)
```

„Baum“ zeigt, was du kannst, also Breite und Tiefe. „Form“ zeigt, was du gerade auf die Matte bringst. Die Hexagon-Ringe zeigen Richtwerte pro Gürtel (Blau 25, Lila 45, Braun 65, Schwarz 85). Das sind Platzhalter, bis Gym-Daten sie kalibrieren.

### 4.6 XP, Level und Wochenserie

```text
Training                      40
je Roll-Karte                  5
Quest erledigt                Drill 30 · Versuch 30 + 10·Stufe · Überleben 40 + 10·Stufe · Entrosten 60
je Treffer / Escape            5 (höchstens 50)
Notiz                         15
Wochenziel erreicht          100   (Standard: 2 Trainings pro Woche)
Stufe 3 / 4 / 5 erreicht      75 / 100 / 125 pro Technik

Level L ab 40 · (L − 1)² XP
```

**Wochenserie:** aufeinanderfolgende Wochen mit erreichtem Wochenziel. Die laufende Woche zählt erst, wenn das Ziel erreicht ist, bricht die Serie aber vorher nicht. Wochen im Heilungsmodus werden übersprungen, ohne die Serie zu brechen.

---

## 5. Sternkarte (Skilltree)

- **Aufbau:** 72 Techniken auf fünf Ringen: Fundament, Basis, Kern, Aufbau, Meisterschaft. Dazu sechs Sektoren: Guard, Submission, Kontrolle, Passing, Stand, Verteidigung. Die Sektoren sind so angeordnet, dass verwandte Bereiche nebeneinanderliegen (Guard neben Submission, Kontrolle neben Passing).
- **Kanten:** Voraussetzungs-Kanten innerhalb eines Sektors. Dazu Kombo-Kanten quer über Sektoren, z. B. Scissor Sweep → Mount → Armbar oder Snap Down → Rücken. Eine Kombo leuchtet auf, sobald beide Enden Stufe 3 haben.
- **Zustände:** Die Größe, Füllung und das Leuchten eines Sterns zeigen die Stufe. Ein Fortschrittsring zeigt den Weg zur nächsten Stufe. Gold heißt Signature, Rostfarbe heißt Rost, gestrichelt heißt vorläufig.
- **Nebel:** Sterne ohne gesehenen Nachbarn sind nur Punkte ohne Namen. Die Karte deckt sich beim Lernen auf.
- **Hexagon als Schatten:** Hinter der Karte liegt das Attribut-Hexagon, auf dieselben sechs Achsen ausgerichtet. Der Baum und der Charakterbogen sind damit visuell dasselbe Objekt.
- **Onboarding-Kalibrierung:** Beim Start markiert man, was man schon kennt. Das hebt Techniken höchstens auf Stufe 2, vorläufig. Ab Stufe 3 zählen nur Daten.
- **Detailfeld pro Stern:** Stufe, Meisterung, Bedingungen für die nächste Stufe mit aktuellem Stand, Versuche roh und gewichtet, geglättete Quote, Untergrenze gegen die Basisquote, zuletzt live, Voraussetzungen, freigeschaltete Techniken und Kombos.
- **Filter (später):** Gi/No-Gi, nur Kombos, nur Rost.
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
   − 1,5 · in den letzten 3 Trainings schon Quest
   − 0,8 · schon Signature
```

Die drei Karten kommen aus drei verschiedenen Sektoren, mit höchstens einer Entrosten- und höchstens einer Drill-Karte. Jede Karte nennt ihren Grund, z. B. „Kurz vor Stufe 4“, „Rostet seit 70 Tagen“ oder „Achse Stand ist gerade deine schwächste Seite“.

| Quest-Typ | Wann | Aufgabe |
|---|---|---|
| Drill | Stufe 0–1 | 3 × 10 Wiederholungen, abhaken |
| Versuch | Stufe 2–5 | in jedem Roll versuchen, Versuche und Treffer zählen |
| Überleben | Verteidigung | sich bewusst in die Position bringen, Escapes zählen |
| Entrosten | Rost | mindestens einmal live treffen |

### 6.2 Wochenboss

Die Position, in der du in den letzten 14 Tagen am häufigsten festgehangen hast (aus der Notiz), wird zum Boss mit Namen, z. B. „Der Schraubstock“ für „Unter Side Control“. Die Lebenspunkte sind die Anzahl der Fälle. Der Boss ist besiegt, wenn es in den nächsten 14 Tagen höchstens halb so oft passiert. Der Boss liefert passende Techniken für die Quest-Auswahl.

### 6.3 Arcs

Acht-Wochen-Staffeln mit Namen („Guard Arc“, „Druck-Arc“). Jeder Arc hat ein selbst gewähltes Ziel, z. B. die Achse Passing +10 oder Knee Cut auf Stufe 4. Am Ende gibt es eine Rückblick-Karte mit dem Hexagon vorher und nachher, zum Teilen im Wrapped-Stil.

### 6.4 Klasse, Titel, Achievements

- **Klasse** = stärkste Achse: Guard-Weber, Jäger, Anker, Druckwalze, Ringer, Festung. Liegen die zwei stärksten Achsen weniger als 2 Punkte auseinander, heißt sie Allrounder.
- **Titel** = beste Signature-Technik als Beiname, z. B. Triangle → „Die Dreiecksfalle“, Knee Cut → „Die Knieklinge“.
- **Gürtelprüfung** = Klassenwechsel-Event mit eigener Animation. Das Datum wird als Ground Truth gespeichert.
- **Achievements** (später): erste Signature, erste aktive Kombo, 100 Rolls, zehn Rolls gegen höhere Gürtel ohne Tap, ein Boss besiegt, ein Arc abgeschlossen.

### 6.5 Gym-Modus (später)

- Der Coach pflegt den Kursplan, dann entfällt Schritt 2 für alle.
- Der Coach kann Techniken „siegeln“, als externe Bestätigung von Stufe 4 oder 5.
- Gym-Quests für alle, z. B. „Diese Woche: Mount Escapes“.
- Bewusst keine öffentliche Rangliste für Kampfkraft, höchstens eine Anwesenheits-Serie (opt-in).
- Ein Dashboard für Gym-Betreiber: Anwesenheit, Abwanderungsrisiko in den ersten Monaten. Das ist der Teil, für den ein Gym bezahlen würde.

---

## 7. Screens

1. **Heute:** drei Quest-Karten, Wochenboss, Wochenziel, Knopf „Training loggen“.
2. **Log-Flow:** Check-in, Roll-Karten als Kartenstapel zum Wischen, Quest-Zähler, optionale Notiz. Danach ein Ergebnis-Screen mit XP-Aufschlüsselung, Stufenaufstiegen, Kampfkraft-Änderung und pulsierenden Sternen.
3. **Sternkarte:** zoombar, Sektor-Fokus, Detailfeld.
4. **Charakter:** Hexagon jetzt und vor 8 Wochen, Klasse, Titel, Kampfkraft-Verlauf, Gürtel-Zeitleiste.
5. **Arc und Rückblick:** Staffelziel, Monats- und Jahreskarte zum Teilen.

Der Prototyp zeigt Heute, Log-Flow mit Live-Vorschau, Sternkarte und Charakter.

---

## 8. Technik

- **Stack:** React, TypeScript, Vite, Tailwind, Framer Motion (wie im Portfolio). Supabase mit Row Level Security pro Nutzer.
- **Plattform:** mobile-first PWA, installierbar, offline-fähig (IndexedDB-Queue, Sync bei Netz). Push über Web Push.
- **Rechenkern:** `compute(history, asOf)` als reine Funktion in einem eigenen Paket, mit Unit-Tests für jede Formel und jede Stufenschwelle. Der Client rechnet sofort, eine nächtliche Edge Function schreibt `skill_snapshots`.
- **Sternkarte:** SVG mit festem radialem Layout (Ring × Sektor), berechnet aus `techniques.ring` und der Reihenfolge im Sektor. Kein Force-Layout, damit die Karte stabil bleibt.
- **Technik-Bibliothek:** als versionierte Seed-Datei (JSON) im Repo, damit Änderungen am Baum nachvollziehbar sind.

---

## 9. Datenschutz

- Nur, was die Rechnung braucht. Keine Verletzungsdaten. Der Heilungsmodus speichert nur „Pause“ ohne Grund.
- Trainingspartner werden nicht namentlich erfasst, nur Gürtel und Größe.
- Hosting in der EU (Supabase Frankfurt), Export und Löschung aller Daten per Knopf.
- Für den Gym-Modus: Coaches sehen Anwesenheit und gesiegelte Techniken, nicht die Roll-Karten.

---

## 10. Validierung: Taugen die Zahlen etwas?

Das ist der Teil, der aus der App ein vorzeigbares Datenprojekt macht.

1. **Coach-Abgleich:** Der Coach bewertet die Pilot-Teilnehmenden einmal pro Achse auf einer Skala von 1 bis 10. Verglichen wird die Rangkorrelation (Spearman) mit den berechneten Achsen.
2. **Stabilität:** Wie stark springen Meisterung und Achsen von Woche zu Woche ohne echte Veränderung? Ziel: glatte Verläufe, klare Sprünge nur bei Stufenaufstiegen.
3. **Vorhersage:** Steigen Kampfkraft und Achsen in den Wochen vor einer Streifen- oder Gürtelvergabe? Bei kleinen Zahlen ist das deskriptiv, aber gut erzählbar.
4. **Partner-Ratings kalibrieren:** Die Gürtel-Ratings werden aus den Roll-Ergebnissen aller Teilnehmenden per Maximum Likelihood geschätzt, statt sie gesetzt zu lassen.
5. **Sensitivität:** Wie ändern sich die Rangfolgen, wenn man Gewichte (0,65/0,35, Prior-Stärke 4, Halbwertszeiten) um ±30 % verschiebt? Robuste Rangfolgen sind ein gutes Zeichen.
6. **Log-Treue:** Anteil der Trainings, die geloggt wurden, und Median der Eingabezeit. Das misst, ob das Kernversprechen „realistisch zu merken“ hält.

Daraus wird die Case Study: „Kann man BJJ-Fortschritt messen? Acht Wochen, zehn Leute, ein Gym.“

---

## 11. Roadmap

| Phase | Inhalt | Ergebnis |
|---|---|---|
| 1 Eigenversuch | Log-Flow, 72 Techniken, Stufen und Meisterung, Tagesquest (ein Typ), Hexagon, XP. Nur du selbst | Du loggst 4 Wochen lang wirklich, erste echte Daten |
| 2 Spielsysteme | Sternkarte mit Nebel und Kombos, Drei-Karten-Draft, Wochenboss, Klasse und Titel, Rückblick-Karte | Die App macht Spaß, nicht nur Sinn |
| 3 Gym-Pilot | 5 bis 10 Leute, Kursplan vom Coach, Coach-Bewertung als Ground Truth | 8 Wochen Daten mehrerer Personen |
| 4 Auswertung | Validierung (Abschnitt 10), Kalibrierung der Parameter, Case Study im Portfolio | Belegbare Modellgüte und eine Geschichte dazu |

---

## 12. Offene Fragen

- Reicht „Kontrolle: Partner / gleich / ich“ als einzige Positionsangabe, oder braucht es „oben / unten“ für Guard-Spieler?
- Positional Sparring (Start in einer Position) als eigener Roll-Typ, der nicht in die Kampfkraft eingeht?
- Getrennte Kampfkraft und Meisterung für Gi und No-Gi?
- Wie viele Techniken braucht die erste Version wirklich? 72 wirken umfangreich, vielleicht reichen 40 für Phase 1.
- Name: Tatami Arc, MatQuest oder etwas ganz anderes.
