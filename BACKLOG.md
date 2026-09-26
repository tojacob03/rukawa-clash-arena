# Waza Arc: Backlog

Wird von oben nach unten abgearbeitet. Nach jedem Punkt: Commit, hier abhaken, in [NOTES.md](NOTES.md) kurz protokollieren (was und warum).

## Aus dem Auftrag

- [x] **Stufe 2 des UI-Reworks**
  - [x] Seekarte randlos mit Nebel-Parallax
  - [x] „Eintragen“ als Seite im Trainingsheft
  - [x] Charakter-Bühne (Held)
- [x] **Stufe 3 des UI-Reworks:** Codex, Profil, Konto, Plan, Onboarding
- [x] **Rollen der Fortschritts-Systeme festlegen:** Level/XP, Power Level, Skilltree (früher Sternkarte), Seekarte, Hexagon
- [x] **Mobile UI ausbessern**
- [x] **Traditionelle Kopfbedeckungen je Land**
  - [x] Eine Kopfbedeckung pro Land (wo es keine passende gibt, etwas anderes, etwa ein Stirnband in den Landesfarben)
  - [x] Jeder bekommt die seines Landes bzw. seiner Länder direkt
  - [x] Weitere als Items freischalten, indem man Gyms in den Ländern besucht
  - [x] Neue Funktion: besuchte Gyms eintragen, rückwirkend und ab jetzt laufend
- [x] **Belohnungsmoment nach dem Loggen** prüfen und bauen
- [x] **Progressive Disclosure** für neue Spieler einführen
- [x] **Typische AI-Card-Merkmale und Verläufe entfernen**, durch hochwertige Libraries ersetzen (nur solche, die auch eine Awwwards-Siegerseite verwenden würde)

## Offen aus dem Gespräch

- [x] Texte, die noch von „Sternen“ und „Sternkarte“ sprechen, auf Zweig, Knospen und Blüten umstellen (Codex, Charakterbogen, Siegel, Quests, Kapitelende)
- [x] Konzeptdokument (docs/waza-arc/KONZEPT.md) nachziehen: Zweig statt Sternkarte, neuer Rahmen und Navigation, Heute als Trainingsheft

## Eigene Ergänzungen

- [x] **UI-Konsistenz nach dem Umbau der Kästen:** alle Seiten in beiden Ausgaben bei 390 und 1280 px durchsehen (Crew, Gym, Konto, Plan, Turniere, Steckbrief, Scouter, Dialoge) und Stellen richten, die auf den alten Kasten angewiesen waren
- [x] **Barrierefreiheit prüfen mit axe-core:** automatischer Test über die Hauptseiten in beiden Ausgaben, Befunde beheben (Kontrast, Namen, Landmarken, Überschriften-Reihenfolge)
- [x] **Zweig per Tastatur:** Knospen mit Tab und Pfeiltasten erreichbar, Fokus sichtbar, Detailblatt mit Enter
- [x] **Totes CSS und tote Importe aufräumen:** Klassen ohne Verwendung (Reste der Sternkarte und der alten Karten), ungenutzte Icons
- [ ] **Mobile-Audit der neuen Teile:** Tippflächen und Überlauf bei 320, 360 und 390 px für Mattenpass, Inhaltsverzeichnis, Kapitelende, Steckbrief-Listen, Turnierkämpfe
- [ ] **Sammlung im Mattenpass:** alle Kopfbedeckungen zeigen, die noch offenen als Bleistift-Umriss mit Land, damit man sieht, was es zu holen gibt
- [ ] **Onboarding:** beim Länder-Schritt sagen, dass jedes Land auch seine Kopfbedeckung mitbringt

