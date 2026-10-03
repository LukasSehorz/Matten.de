# Abnahme: Alltagstauglichkeit der Preisformel im Altsystem

Geprüft am 03.10.2026 von der Hauptsitzung, nachdem zwei beauftragte Prüfagenten an dieser
Aufgabe abgestürzt sind (Zeitüberschreitung ohne Bericht). Alle Zahlen unten sind selbst
gemessen, in kleinen Einzelschritten.

Grundlage: Altsystem lokal (localhost:8080), Artikel 6, Spezialoption `spezial`.
Alle Messungen ohne `save()` — die Datenbank wurde nicht verändert.

## 1. Die Probe-Rechnung in der Maske ist verlässlich — bestanden

Der Auftraggeber sieht in der Maske eine Probe („Eine Matte 100 × 100 cm, 1 Stück, kostet
mit diesen Werten X € netto"). Darauf verlässt er sich beim Eintippen. Geprüft gegen den
Preis, den der Shop dann wirklich verlangt:

| Wertesatz | Probe | Shop | |
|---|---|---|---|
| Mappe (EK 54,63 · SF 1,931) | 131,8632 | 131,8632 | stimmt |
| Velour (EK 39,06) | 94,2811 | 94,2811 | stimmt |
| einfarbig (Colortype 2, SF 1,728) | 118,0008 | 118,0008 | stimmt |
| runde Zahlen (EK 100 · SF 2) | 250,0000 | 250,0000 | stimmt |
| mit Teuerungszuschlag 5 % | 138,4563 | 138,4563 | stimmt |

**5 von 5.** Die Probe lügt nicht.

## 2. Eingaben, wie ein Nicht-Techniker sie tippt — bestanden

EK-Listenpreis, Sollpreis 131,8632 €:

| Eingabe | Ergebnis | Verhalten |
|---|---|---|
| `54,63` | 131,8632 | richtig gelesen |
| ` 54,63 ` (Leerzeichen) | 131,8632 | richtig gelesen |
| `54.63` (Punkt) | 131,8632 | richtig gelesen |
| `54,63 €` | 131,8632 | Vorgabe greift **und** roter Hinweis: „ist keine Zahl" |
| `EUR 54,63` | 131,8632 | ebenso |
| leer | 131,8632 | Vorgabe aus der Mappe |

**Kein Fall rechnet still falsch.** Entweder wird richtig gelesen oder gemeldet.

## 3. Umschalten und Zurückschalten — bestanden

| Schritt | Preis |
|---|---|
| 1. Schalter aus, keine Werte | 59,2000 |
| 2. Schalter ein, Werte gepflegt | 131,8632 |
| 3. Schalter wieder aus | **59,2000** (wie Schritt 1) |
| 4. Schalter wieder ein | **131,8632** (wie Schritt 2) |

Nach Schritt 3 sind die gepflegten Werte **erhalten** (EK = 54,63 · SF = 1,931). Der
Auftraggeber kann also gefahrlos ausprobieren, ohne bei jedem Zurückschalten neu zu tippen.

## 4. Mengenstaffel im echten Shop — bestanden

100 × 100 cm, Preis je Stück netto, gegen die Stufen der Mappe:

| Menge | Faktor (Mappe) | je Stück | erwartet | |
|---|---|---|---|---|
| 1 | 1,00 | 131,8632 | 131,8632 | stimmt |
| 2 | 0,95 | 125,2700 | 125,2700 | stimmt |
| 3 | 0,92 | 121,3141 | 121,3141 | stimmt |
| 10 | 0,90 | 118,6768 | 118,6768 | stimmt |
| 20 | 0,89 | 117,3582 | 117,3582 | stimmt |
| 30 | 0,88 | 116,0396 | 116,0396 | stimmt |

**6 von 6.** Alle Stufen greifen im Shop selbst, nicht nur in der Formel.

## 5. Bestandsschutz und Aufräumzustand — bestanden

| Prüfung | Ergebnis |
|---|---|
| Seite 6300000 | **123,37 €** (wie vor dem Umbau) |
| Seite 6300201-logomatte | **125,53 €** (wie vor dem Umbau) |
| Artikel mit `pf_`-Werten | **0** von 580 |
| Artikel gesamt / höchste ID | 580 / 803 (unverändert) |
| Bestellungen | 7.219 (unverändert) |
| Hilfsdateien im Webverzeichnis | **keine** |
| `pruefe-preisformel.mjs` | alle **61** Fälle |
| `pruefe-preisformel-neu.mjs` | alle **40** Fälle |
| `pruefe-anfrage.mjs` | **98 von 98** |

## Was dem Auftraggeber im Alltag passieren kann

Nach acht behobenen Fehlern ist mir **kein** Weg mehr bekannt, auf dem eine Eingabe zu einem
falschen Preis führt, ohne dass gewarnt wird. Die verbliebenen Stolpersteine sind alle
sichtbar:

* **Tausenderpunkt:** `1.000` ergibt 1,0 statt Eintausend. Bewusst die harmlosere Richtung —
  der zu kleine Wert fällt in der Probe sofort auf und wird von der Plausibilitätsprüfung
  gemeldet. In der Maske steht der Hinweis, ohne Tausenderpunkt zu schreiben.
* **Verrutschtes Komma:** `1931` statt `1,931` wird abgefangen — „liegt außerhalb des
  sinnvollen Bereichs (0,01 bis 100). Steht das Komma an der richtigen Stelle?"
* **Preis-Korrektur wirkt je Stück**, nicht je Auftrag. Steht so in der Maske.

## Nicht geprüft

* **Der Klick durch die echte Admin-Maske** — dafür fehlen Zugangsdaten. Alles andere ist
  über denselben Code geprüft, den die Maske benutzt (`pruefePreisformel()`, `set()`), aber
  ein echter Klicktest durch Lukas ersetzt das nicht vollständig.
* **Sonderform und Sonderfarbe im Altsystem** — dafür gibt es dort keine Eingabefelder. Die
  Formel wertet sie aus, der Kunde kann sie im alten Shop aber nicht wählen.
