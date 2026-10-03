# Auftrag: Excel-Preisformel ins Altsystem einbauen (Weg B)

Entscheidung von Lukas am 02.10.2026. Ziel: Die Preisformel des Auftraggebers
(Dieter Fuchsius, Mappe `1PREISE-Brian_Sehorz-26-09-30_18-55.xlsx` vom 30.09.2026)
rechnet künftig **im Altsystem selbst**, nicht nur im neuen Frontend.

## Grundsätze — bitte wörtlich nehmen

1. **Nur diese eine Formel.** Kein Umbau des Shops, kein Umbau des Backends.
   Jede Änderung, die nicht unmittelbar der Formel dient, ist zu unterlassen.
2. **Der Auftraggeber pflegt Werte über den Admin, nicht im Code.** Er hat
   ausdrücklich gesagt, dass er alle Änderungen bisher selbst über die Oberfläche
   eingetragen hat. Alle Stammgrößen der Formel müssen deshalb als **Eingabefelder
   in der Admin-Maske** erscheinen — dort, wo heute schon der Quadratmeterpreis steht.
3. **Rückgängig machbar.** Ohne gepflegte Werte muss sich das System **exakt wie
   bisher** verhalten (Fläche × m²-Preis). Ein einzelner Schalter je Artikel
   entscheidet, ob die Excel-Formel greift.
4. **Nichts im System hinterlassen.** Test-Anfragen, Test-Bestellungen oder
   Test-Artikel nach dem Prüfen wieder löschen.

## Wo gebaut wird

Ausschließlich im **lokalen** Altsystem:
`Backup/matten.de-2026-09-07/web` — läuft unter http://localhost:8080
(Container in `Altsystem-lokal/`, eigene Datenbank-Kopie).
Das Livesystem wird **nicht** angefasst.

## Die Formel (Quelle: preisformel.js, gegen beide Mappen geprüft)

Maßgeblich ist `Frontend/bridge-demo/public/preisformel.js` — sie rechnet in
40 von 40 Fällen exakt wie die neue Mappe und in 61 von 61 wie die alte.
**Diese Datei ist die Referenz; die PHP-Fassung muss dieselben Zahlen liefern.**

Kern (Excel G5/F5):

    Fläche je Stück [m²]  = Breite[cm] × Länge[cm] × 0,0001
    Basis je Stück        = Fläche × EK-Listenpreis/m² × Salesfactor
                            × Staffelfaktor(Menge) × TZ-Faktor
    VK je Stück           = Basis × Sondermaß × SonderformOhne × SonderformMit
                            + Sonderfarbenaufschlag
    VK gesamt             = Menge × VK je Stück − (Menge−1) × Sonderfarbenaufschlag

Die Stammgrößen stehen in `STAMMDATEN_VORGABE` in `preisformel.js`, inklusive
Excel-Zellbezug je Feld. Übernimm sie von dort, nicht aus dieser Datei.

Besonderheiten, die leicht übersehen werden:
* Der **Sonderfarbenaufschlag fällt nur EINMAL je Auftrag an**, nicht je Stück
  (deshalb der Abzug in VK gesamt).
* **Sondermaß ×1,25** greift, wenn **weder** Breite **noch** Länge eine
  Standardbreite trifft (`faktorBreiteFuer`).
* Die Mengenstaffel arbeitet **nach Stückzahl**, nicht nach m².
* Liegt die Menge unter der kleinsten Staffelstufe, liefert Excel FALSCH → 0.

## Was zu bauen ist

### 1. Admin-Felder (der wichtigste Teil für den Auftraggeber)

In der Maske der Spezialoption `spezial` — dort, wo heute „Quadratmeterpreis
Netto/Brutto" steht (`php/Plugins/Katalog/SpezialoptionSpezial.php`, Markup ab
Zeile ~160, Feldliste `$fields` in Zeile ~368). Neue Felder, alle mit deutscher
Beschriftung und einem kurzen Hinweis, was sie bewirken:

* **Schalter „Preisformel verwenden"** (ja/nein, Vorgabe nein)
* Salesfactor mehrfarbig / einfarbig / Ped-Print und die Auswahl, welcher gilt
* EK-Listenpreis je m²
* Standardbreiten (als Liste, z. B. „60, 75, 85, 115, 150, 200")
* Sondermaß-Faktor (1,25)
* Sonderform ohne Rand (1,3) und mit Rand (1,5)
* Sonderfarbe Verkauf (68) und Einkauf (50 — siehe offener Punkt unten)
* Teuerungszuschlag in Prozent
* Mengenstaffel: Schwelle und Faktor, mehrere Stufen

**Zusätzlich ein freies Feld „Preis-Korrektur"** (Kundenwunsch): ein Betrag oder
Prozentwert, der am Ende auf den errechneten Preis wirkt. Beschrifte klar, was
gilt (z. B. „+5" = 5 € mehr, „+5%" = 5 Prozent mehr, leer = keine Korrektur).
Entscheide die genaue Form selbst, aber sie muss für einen Nicht-Techniker
verständlich sein.

Die Werte werden wie die bestehenden in `artikel.spezialoption_data` abgelegt
(PHP-`serialize()`, kein JSON) — füge sie der `$fields`-Liste hinzu, dann
erledigt das der bestehende Mechanismus.

### 2. Die Rechnung

In `SpezialoptionSpezial::getAufpreis()` (Zeile ~420). Heute:

    return -1 * $artikel->getBasisPreis() + $this->getFlaeche() * $this->getQuadratmeterPreis();

Künftig: Ist der Schalter aus oder fehlen Werte → **unverändert wie heute**.
Ist er an → Excel-Formel.

**Der Knackpunkt: die Stückzahl.** `getAufpreis()` bekommt sie nicht übergeben.
`Artikel::getPreis($anzahl)` (Zeile ~1055) hat sie, reicht sie aber nicht an
`getOptionenPreis()` (Zeile ~1283) weiter. Diese Kette muss die Menge
durchreichen — **minimal und mit Vorgabewert**, damit kein bestehender Aufruf
bricht. Prüfe alle Aufrufer von `getOptionenPreis()` und `getAufpreis()`
(auch in `master/php/`, auch die anderen Spezialoptionen) und belege im Bericht,
dass keiner davon anders arbeitet als vorher.

### 3. Anzeige im Frontend

Der Preis muss auf der Produktseite des **Altsystems** stimmen (localhost:8080)
und über die Brücke auch im neuen Frontend ankommen
(`MATTEN_UPSTREAM=http://localhost:8080 node server.mjs`, Port 8787).

## Prüfung — so wird abgenommen

* **Gegen `preisformel.js`:** Dieselben Eingaben müssen in PHP und JavaScript
  denselben Preis ergeben. Mindestens 30 Fälle: verschiedene Maße, Mengen,
  Colortypes, mit/ohne Sonderform, mit/ohne Sonderfarbe, Standardmaß und
  Sondermaß, Mengen unter der kleinsten Staffelstufe.
* **Rückfall:** Artikel ohne Schalter müssen **centgenau** denselben Preis
  liefern wie vor dem Umbau. Miss das vorher und nachher.
* **Keine Rückschritte:** `pruefe-preisformel.mjs` (61/61),
  `pruefe-preisformel-neu.mjs` (40/40), `pruefe-stammdaten.mjs`,
  `pruefe-anfrage.mjs`, `ui-fuchsius-17-09.mjs` (37/37).
* **Admin-Maske:** Werte eintragen, speichern, Seite neu laden — stehen sie noch
  da? Wirkt die Änderung sofort auf den Shop-Preis?
* **Aufräumen:** Alles, was beim Testen entsteht (Bestellungen, Anfragen,
  Testartikel), danach wieder entfernen.

**Verboten:** `POST /api/kasse/bestellen` gegen das Livesystem. Gegen das lokale
System nur, wenn ausdrücklich beauftragt — und dann den Datensatz hinterher löschen.

## Offener Punkt, nicht selbst entscheiden

Der Einkaufsaufschlag je Sonderfarbe: Die Mappe sagt **50 €**, der Auftraggeber
nannte am 17.09.2026 mündlich **54 €**. Baue das Feld so, dass der Wert im Admin
pflegbar ist, und setze als Vorgabe den **Mappenwert 50 €**. Die Entscheidung
trifft der Auftraggeber.
