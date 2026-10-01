# Prüfbericht 01.10.2026 — Mail Fuchsius 18.09. und Warenkorb-Verlust

Geprüft von der Hauptsitzung, nachdem der beauftragte Prüfagent nach 10 Minuten
ohne Fortschritt abgebrochen wurde (kein Bericht hinterlassen). Alle Zahlen unten
sind selbst gemessen, nicht aus den Berichten der Bau-Agenten übernommen.

Geändert wurden: `assets/js/shell.js` (Agent A), `assets/js/seite-produkt.js` und
`assets/css/net-neu.css` (Agent B+C). Die Preisformel blieb unangetastet.

## 1. Warenkorb-Konsistenz — bestanden

Die Kernfrage: Stimmt die Anzeige mit dem Server überein, wenn die Verbindung
langsam ist? Vorher gingen dabei Positionen verloren (Agent A: 1 von 3 Läufen
korrekt; der Prüfagent bestätigte es unabhängig mit 2 von 3 fehlerhaften Läufen).

| Prüfung | Bedingungen | Ergebnis |
|---|---|---|
| Grundfall | 1,2 s Latenz, 400 kbit/s, sauberer Ausgangsstand | **4/4 korrekt** |
| Härtefall | 2,5 s Latenz, 200 kbit/s, **Seitenwechsel 1,5 s nach dem Klick** | **4/4 korrekt** |

Der Härtefall ist der entscheidende: genau dort — Lesen und Schreiben gleichzeitig —
trat der Verlust früher auf.

**Fehlmessung im Protokoll festgehalten:** Ein erster Lauf ergab 3 von 6 mit
Abweichungen (Zähler 2 bzw. 3 bei Server 0). Das war ein Fehler des *Prüfskripts*,
nicht der Anwendung: Der Korb wurde zwischen den Läufen nicht zuverlässig geleert,
weil jeder neue Browser-Tab beim Altsystem eine eigene Sitzung bekommt. Mit
Leerung im selben Tab und gemessenem Ausgangsstand (`Server=0` vor jedem Klick)
ist der Befund eindeutig. Lehre: Bei sitzungsgebundenen Tests den Ausgangszustand
messen, nicht annehmen.

## 2. Zwischenspeicher darf nie Wahrheit sein — bestanden

Der neue Zähler-Zwischenspeicher (`sessionStorage`, Schlüssel `netneu.korbzaehler`)
hält nur die Positionszahl. Geprüft mit **absichtlich verfälschtem Wert** (`n: 99`):

| Stelle | Erwartung | Ergebnis |
|---|---|---|
| Warenkorb-Modal | zeigt echte Positionen | 1 Zeile, echter Artikel — **korrekt** |
| `GET /api/cart` daneben | 1 | 1 — **korrekt** |
| Kasse | echter Stand | `CART (1)` — **korrekt** |

Modal und Kasse lesen also ausnahmslos frisch. Der Speicher wird in `sende()` von
jeder Schreibanfrage verworfen und verfällt nach 5 Minuten.

## 3. Standard/Spezial — bestanden

`ui-fuchsius-17-09.mjs` (auf 37 Punkte erweitert) gegen das Produkt aus der Mail,
`designmatten-jetprint-velour`: **37/37 bestanden.**

Die Fälle aus der Mail, jeweils gegen `faktorBreiteFuer()` aus der Preisformel
gegengerechnet (Standardbreiten 60/75/85/115/150/200):

| Maß | Faktor | Anzeige |
|---|---|---|
| 40×60, 60×40 | 1,0 | Standard (grün) |
| 85×120, 120×85 | 1,0 | Standard (grün) |
| 75×200 | 1,0 | Standard (grün) |
| 63×43, 90×120, 100×100 | 1,25 | Spezial (rot) |

Damit ist der gemeldete Fehler behoben: Die Anzeige folgt jetzt derselben Funktion,
die auch rechnet. **Es war nie ein Preis falsch — nur die Beschriftung.**

## 4. Keine Rückschritte — bestanden

| Prüflauf | Ergebnis |
|---|---|
| `pruefe-preisformel.mjs` | **61/61** gegen die Excel-Mappe, 9/9 Zusatzprüfungen |
| `pruefe-stammdaten.mjs` | durchgelaufen, keine Mängel |
| `ui-kasse.mjs` | Exit 0 |
| `ui-fuchsius-17-09.mjs` | 37/37 |

Das `422` auf `/api/kasse/adresse` im Kassen-Protokoll ist **erwartetes Verhalten**:
Es stammt aus den Schritten „D23 Adresse ohne PLZ" und „D23b ohne AGB", die
absichtlich ungültige Eingaben senden. Das Altsystem lehnt korrekt ab.

## 5. `ui-produkt.mjs` bricht ab — kein Fehler der Anwendung

Agent A meldete einen Abbruch bei „D19 40x60 sonderfarbe kauf". Nachgegangen:
Das Skript bedient `#sonderfarbe`, `#sonderform_mit_rand`, `#sonderform_ohne_rand`
— die **alten Kontrollkästchen**. Die gibt es seit dem 17.09. nicht mehr (im Code
0 Treffer); an ihrer Stelle stehen `#input_rand`, `#input_form`, `#input_sonderfarben`
(je 1 Treffer). Das Skript ist veraltet, die Produktseite in Ordnung. Ein Hinweis
dazu steht jetzt im Kopf von `ui-produkt.mjs`.

## 6. Layout — bestanden

Screenshots bei 1280 und 375 px angesehen (`ausschnitt-1280.png`, `ausschnitt-375.png`):
Sonderfarben-Zeile einzeilig („Anzahl · Sonderfarben, 0 = keine · [0]"), Preis groß
mit „inkl. MWSt." daneben, „Standard" grün vor dem Endpreis, Kunden-Bemerkung,
drei Knöpfe in einer Zeile. Auf dem Handy bricht alles sauber um, nichts überlappt.
Kein waagerechter Überlauf, keine Konsolenfehler.

## Was nicht geprüft werden konnte

* **Verhalten auf Netlify.** Alle Messungen liefen lokal mit nachgebildeter
  Verzögerung. Auf Netlify kommt die serverlose Function hinzu, die je Aufruf
  zweimal matten.de abfragt (2,0–2,6 s gemessen). Nach dem Deploy dort nachmessen.
* **Zwei gleichzeitig offene Tabs.** Der Fix verhindert das Rennen innerhalb einer
  Seite. Bei zwei Tabs kann es erneut auftreten — dagegen hilft Frontend-Code
  grundsätzlich nicht, die Ursache sitzt im `Set-Cookie` der Function
  (`Frontend/netlify/functions/api.mjs`). Mit dem lokalen Altsystem
  (`Altsystem-lokal/`) entfällt das Problem, weil keine Function mehr dazwischen steht.
* **Echter Datei-Upload.** Bewusst nicht gebaut: Die Brücke kennt kein
  `multipart/form-data`. Der Knopf erfasst nur den Dateinamen und sagt das auch.

## Urteil

**Abnahmefähig.** Der Positionsverlust ist in 8 von 8 Läufen nicht mehr
reproduzierbar, auch nicht im Härtefall. Die Anzeige Standard/Spezial folgt jetzt
der Rechnung. Keine Rückschritte an Preisformel, Kasse oder Stammdaten.
