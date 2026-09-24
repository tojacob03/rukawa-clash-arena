---
slug: strompreis-kompass
eyebrow: Energy data · in German
title: Wann Strom am günstigsten ist
summary: Ein Jahr Börsenstrompreise, ausgewertet mit SQL. Abends kostet Strom im Schnitt mehr als dreimal so viel wie mittags. Wer täglich 10 kWh verschiebt, spart an der Börse rund 380 € im Jahr.
date: 2026-09-24
metric: 3,2×
metricLabel: so teuer ist Strom um 19 Uhr wie um 13 Uhr (Jahresmittel)
stats: 380 € | pro Jahr, wenn man täglich 10 kWh verschiebt; −0,71 | Korrelation von Preis und Wind- und Solaranteil; 573 | Stunden mit negativem Preis im Jahr 2025
role: Konzept, Umsetzung & Auswertung
stack: PostgreSQL, pg_cron, SQL, React, Recharts
lang: de
ogImage: /og/strompreis.png
ctaLabel: Zum Strompreis-Kompass →
ctaHref: /strompreis
---

## Die Frage

Seit 2025 müssen alle Stromanbieter in Deutschland Haushalten mit Smart Meter einen dynamischen Tarif anbieten. Der Preis folgt dann der Strombörse, und dort wird seit Oktober 2025 in Viertelstunden gehandelt. Für alle mit E-Auto, Wärmepumpe oder Batteriespeicher ergeben sich daraus zwei Fragen: **Wann lohnt es sich, Verbrauch zu verschieben?** Und **warum schwankt der Preis überhaupt so stark?**

## Die Daten

Alle Werte stammen von SMARD.de, der offiziellen Strommarktplattform der Bundesnetzagentur:

- Großhandelspreis am Day-Ahead-Markt (Deutschland/Luxemburg)
- Erzeugung aus Photovoltaik, Wind an Land und Wind auf See
- Stromverbrauch (Netzlast) und Residuallast

Stundenwerte liegen seit Anfang 2023 vor, Viertelstundenwerte seit Oktober 2025, zusammen rund 400.000 Messwerte. Alle drei Stunden kommen automatisch neue hinzu. Ausgewertet habe ich die zwölf vollständigen Monate von September 2025 bis August 2026, für den Jahresvergleich die Jahre 2023 bis 2026.

Wichtig für die Einordnung: Das sind Börsenpreise ohne Steuern, Umlagen und Netzentgelte. Auf der Stromrechnung steht deshalb ein deutlich höherer Preis. Der Teil, der sich mit der Uhrzeit ändert, folgt aber genau diesen Mustern.

## Umsetzung

Die ganze Datenpipeline läuft in der Datenbank (PostgreSQL bei Supabase in Frankfurt), ohne eigenen Server:

1. **Abrufen:** Ein Zeitplan (`pg_cron`) startet alle drei Stunden eine SQL-Funktion, die die Daten direkt bei SMARD abholt.
2. **Speichern:** Neue und geänderte Werte landen in einer Tabelle, jeder Abruf wird mit Status protokolliert.
3. **Rechnen:** Danach berechnet eine zweite Funktion alle Kennzahlen des Dashboards und legt sie als fertiges Ergebnis ab.
4. **Anzeigen:** Die Website darf nur diese eine Funktion aufrufen. Die Rohdaten sind von außen nicht erreichbar.

Gebaut habe ich das Projekt KI-gestützt: Fragestellung und Datenmodell sind von mir, den Code und die Auswertungsabfragen habe ich mit KI-Werkzeugen geschrieben. Damit das nachprüfbar bleibt, liegen das [komplette SQL](https://github.com/tojacob03/rukawa-clash-arena/blob/main/docs/strompreis-kompass/schema.sql) und [alle Abfragen hinter den Zahlen in diesem Text](https://github.com/tojacob03/rukawa-clash-arena/blob/main/docs/strompreis-kompass/analysis.sql) offen auf GitHub.

## Erkenntnisse

### 1. Abends kostet Strom mehr als dreimal so viel wie mittags

Durchschnittlicher Börsenpreis nach Uhrzeit in €/MWh (10 €/MWh entsprechen 1 ct/kWh), die günstigste Stunde je Spalte fett:

| Uhrzeit | Jahr (Sep 2025 – Aug 2026) | Sommer 2026 | Winter 2025/26 |
|---|---:|---:|---:|
| 3 bis 4 Uhr | 93,4 | 126,1 | **78,5** |
| 13 bis 14 Uhr | **47,0** | **28,4** | 95,7 |
| 17 bis 18 Uhr | 110,3 | 94,3 | 129,7 |
| 19 bis 20 Uhr | 150,7 | 176,3 | 116,5 |
| 20 bis 21 Uhr | 146,6 | 203,4 | 105,4 |

Im Jahresmittel ist Strom zwischen 13 und 14 Uhr am günstigsten und zwischen 19 und 20 Uhr am teuersten, dann kostet er das 3,2-Fache. Im Sommer wird der Abstand extrem: Mittags drückt die Sonne den Preis auf 28 €/MWh. Um 20 Uhr, wenn die Sonne untergeht und der Verbrauch hoch bleibt, sind es 203 €/MWh, das Siebenfache. Im Winter kehrt sich das Bild um: Die Sonne liefert wenig, die günstigsten Stunden liegen nachts und die teuersten schon um 17 Uhr.

### 2. Das günstigste Zeitfenster wandert mit der Jahreszeit

Für jeden Tag habe ich das günstigste zusammenhängende 2-Stunden-Fenster gesucht:

- **April bis September:** An 181 von 183 Tagen lag es mittags (Beginn zwischen 9 und 15 Uhr).
- **November bis Februar:** An 100 von 120 Tagen lag es nachts.

Ein Rechenbeispiel: Wer jeden Tag 10 kWh, etwa den Strom für 60 Kilometer mit dem E-Auto, nicht zwischen 18 und 20 Uhr bezieht, sondern im günstigsten 2-Stunden-Fenster des Tages, zahlt im Schnitt 10,4 ct/kWh weniger. Aufs Jahr gerechnet sind das **rund 380 €**, allein beim Börsenpreis, bevor Steuern und Abgaben dazukommen.

### 3. Wind und Sonne drücken den Preis, das Wochenende auch

Je höher der Anteil von Wind- und Solarstrom am Verbrauch eines Tages, desto niedriger der Tagespreis. Die Korrelation liegt bei −0,71, ein starker Zusammenhang:

| Wind- und Solaranteil am Verbrauch | Tage | Ø Preis in €/MWh |
|---|---:|---:|
| unter 30 % | 58 | 127,8 |
| 30 bis 50 % | 135 | 112,0 |
| 50 bis 70 % | 128 | 90,1 |
| 70 % und mehr | 44 | 47,2 |

An Tagen mit mindestens 70 % Wind- und Solaranteil war Strom 63 % günstiger als an Tagen unter 30 %. Eine Korrelation allein beweist keine Ursache, denn windarme Tage fallen oft in den Winter, wenn auch der Verbrauch höher ist. Die Richtung passt aber zum Mechanismus der Börse: Wind und Sonne erzeugen fast ohne laufende Kosten und verdrängen teurere Kraftwerke aus dem Markt.

Am Wochenende, wenn Industrie und Büros weniger verbrauchen, lag der Preis im Schnitt 26 % unter dem von Werktagen (79,1 statt 106,9 €/MWh).

### 4. Negative Preise: erst fast verdoppelt, 2026 kein weiterer Anstieg

Wird deutlich mehr Strom angeboten als gebraucht und lassen sich Kraftwerke nicht schnell genug drosseln, fällt der Preis unter null. Wer dann Strom abnimmt, bekommt an der Börse Geld dafür.

| Jahr | Stunden mit negativem Preis | davon Januar bis August | Tage mit negativen Preisen (Januar bis August) |
|---|---:|---:|---:|
| 2023 | 301 | 166 | 27 |
| 2024 | 457 | 373 | 68 |
| 2025 | 573 | 465 | 85 |
| 2026 | – | 424 | 80 |

Von 2023 bis 2025 hat sich die Zahl der negativen Stunden fast verdoppelt. 2026 liegt sie von Januar bis August zum ersten Mal unter dem Vorjahr. Warum, geben die Daten allein nicht her. Naheliegende Kandidaten sind mehr Batteriespeicher und das Solarspitzengesetz, nach dem neue Solaranlagen bei negativen Preisen keine Einspeisevergütung mehr erhalten.

Das bisherige Extrem seit dem Start des Viertelstundenhandels: Am **1. Mai 2026**, einem Feiertag, deckten Wind und Sonne mittags 120 % des deutschen Verbrauchs. Zwischen 13:15 und 14:45 Uhr fiel der Preis auf −499,99 €/MWh, im Tagesmittel lag er bei −2,1 €/MWh. Die teuerste Viertelstunde im selben Zeitraum kostete 747,10 €/MWh, am 24. Juni 2026 um 20:45 Uhr.

## Was ich dabei gelernt habe

- **Zeitzonen sind die tückischste Fehlerquelle.** Die Datenbank speichert Zeitpunkte intern in UTC. Wer Uhrzeiten nicht ausdrücklich in deutsche Ortszeit umrechnet, bekommt UTC-Stunden, die im Sommer zwei und im Winter eine Stunde neben der deutschen Uhr liegen. Jede Aussage über „mittags“ und „abends“ wäre dann falsch.
- **Ein Marktwechsel ändert das Datenmodell.** Seit Oktober 2025 wird an der Börse in Viertelstunden gehandelt. Die Tabelle speichert deshalb beide Auflösungen nebeneinander, statt die alten Stundenwerte umzuschreiben.
- **Einmal rechnen statt bei jedem Aufruf.** Die Website liest ein fertig berechnetes Ergebnis statt 400.000 Rohwerte. Egal wie viele Menschen sie öffnen, die Datenbank rechnet nur alle drei Stunden.
- **Fehler sichtbar machen.** Jeder Abruf steht mit Status im Protokoll. Fällt SMARD aus, zeigt die Seite die letzten guten Daten, und im Protokoll steht, warum.

## Was als Nächstes käme

- **Endkundenpreis statt Börsenpreis:** Netzentgelte, Umlagen und Steuern einrechnen, damit sichtbar wird, wie viel von der Ersparnis bei einem konkreten dynamischen Tarif ankommt.
- **Prognose:** den Preis für morgen aus Wind- und Solarprognosen schätzen, bevor die Börse ihn veröffentlicht.
- **Die offene Frage aus Punkt 4:** Warum steigt die Zahl der negativen Stunden 2026 nicht weiter?

---

Die aktuellen Zahlen zeigt das Dashboard [Strompreis-Kompass](/strompreis). Datenquelle: Bundesnetzagentur | SMARD.de, Lizenz [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.de).
