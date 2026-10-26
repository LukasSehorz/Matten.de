# Staffeltabelle in den Artikel-Stammdaten (24.10.2026)

Auftrag aus dem Gespräch mit Herrn Fuchsius (Lukas, 24.10.2026): „Preisstaffel bei den
Produkt-Stammdaten einbauen, erstmal nur JetPrint". Vorlage: Mails Fuchsius vom 30.08. und
14.10.2026 und sein Screenshot der Stammdaten von 6300201-Logomatte (Tabelle neben
„Preisstaffel" wie Excel-Bereich Q2:W7, dazu Specialform 30 %/50 % und Specialcolor 50 €/68 €).

## Was gebaut wurde (nur lokale Kopie, `Backup/…/web`)

- `php/Plugins/Preisstaffeln/PreisstaffelFormFieldHandler.php`: In der Zeile „Preisstaffel"
  steht rechts neben der alten Staffel die Tabelle (nur JetPrint-Artikel mit Spezialoption
  „Spezial").
- `php/Plugins/Katalog/SpezialoptionSpezial.php`:
  - `zeigtPreisformel()` — JetPrint = Lieferanten-Nr. beginnt mit `MJPRNT` oder „jetprint" in der
    Artikelnummer. Für alle Artikel freischalten: dort `true` zurückgeben.
  - `getStaffelTabelle()` — die Tabelle: TZ %, Faktor (1 + TZ/100, live), „ab …" (Beschriftung),
    EK €/m², 5 Rabattfaktoren, one-color (Beschriftung, rechnet nicht mit, wie W5), 6 Staffelmengen,
    6 Standardbreiten, Sonderform ohne/mit Rand in %, Sonderfarbe EK/VK.
  - `parseStaffelTabelle()` — schreibt in die bisherigen Felder (`pf_mengenstaffel`,
    `pf_standardbreiten`, `pf_f_form_ohne/mit` als Faktor, …). Die Rechnung (`Preisformel.php`)
    ist unverändert. Leere Zelle = Vorgabe der Mappe an dieser Stelle; alle leer = ganz Vorgabe.
  - Die entsprechenden Textfelder im Block „Preisformel (Excel-Mappe)" sind entfernt (sonst
    doppelte Feldnamen). Der Block erscheint nur noch bei JetPrint-Artikeln.
- Neue gespeicherte Felder: `pf_tz_ab`, `pf_one_color` (nur Beschriftung).

## Geprüft

- Rundlauf an einem Testartikel (Kopie von 648, danach gelöscht): Tabelle ausfüllen → speichern →
  neu laden: alle Werte da, 0 Mängel. Preis je Stück 50×200: 105,49 / 100,22 / 97,05 / 94,94 /
  93,89 € bei 1/2/3/10/20 Stück; geänderter Faktor (0,85 ab 30) wirkt sofort (89,67 €).
  100×100 (Sondermaß): 131,86 € bei 1 Stück. Leere Tabelle → Felder leer (Vorgabe). Eine einzelne
  geänderte Zelle → übrige Stufen bleiben Vorgabe.
- Die Excel-Fassungen 30.08. und 30.09. rechnen identisch (Unterschiede nur in Erläuterungstexten).

## JetPrint eingeschaltet (lokale Datenbank)

32 aktive JetPrint-Artikel mit Spezialoption „Spezial" und EK je m² > 0: Schalter „Ja", EK = eigener
EK je m², **Salesfactor = eigener VK je m² ÷ EK je m²** (so bleibt der heutige Preis je m² gleich,
neu sind Mengenrabatt, Sondermaß ×1,25 bei Nicht-Standardbreite, Sonderform, Sonderfarbe), übrige
Werte wie Mappe. Ausgelassen (kein EK): 493 `63000111`, 594 `6300203`, 595 `6300203-a`.
Sicherung der vorherigen `spezialoption_data`: `sicherung-spezialoption-vor-jetprint-2026-10-24.json`
(Artikel-ID → Rohwert). Rückweg je Artikel: Schalter in der Maske auf „Nein".

## Verbindung zum neuen Shop (net-neu)

- `php/Plugins/Katalog/ArtikelPage.php` (`getFormPrices`): Ist die Formel eingeschaltet, enthält die
  Preis-JSON (`?getpricejson=1`) zusätzlich `preisformel: { aktiv, stammdaten, korrektur }`, also
  dieselben Werte, mit denen das Altsystem rechnet. Ohne Schalter bleibt das Feld `null`.
- Brücke (`bridge-demo/server.mjs`) und Netlify-Funktion (`netlify/functions/api.mjs`) reichen das
  Feld bei `/api/price` durch.
- `net-neu/assets/js/seite-produkt.js`: Nach dem Laden holt die Produktseite einmal `/api/price` für
  den Kaufartikel. Kommt `preisformel.aktiv`, rechnet sie mit diesen Stammwerten statt mit `daten.js`,
  wendet die Preis-Korrektur je Stück an und rundet wie das Altsystem (Stück brutto runden, dann mal
  Menge). Am `<body>` steht dann `data-preis-quelle="altsystem"`. Ohne Antwort bleibt alles wie bisher.
- Geprüft (Brücke mit Ziel lokale Kopie, Port 8789, Produkt `jetprint-matten-design` = Artikel 648):
  50×200 bei 1/2/3/10/20 Stück, 100×100 und 3× 85×150 im Shop **centgenau gleich** mit der POST-Abfrage
  ans Altsystem (125,53 / 238,52 / 346,47 / 1.129,80 / 2.234,60 / 156,92 / 441,75 €).
  Gegentest: Rabatt für 2 Stück in der Datenbank auf 0,80 → Shop und Altsystem zeigen beide sofort
  200,86 €; danach exakt zurückgesetzt (gleiche Prüfsumme wie vorher).
- Hinweis: Mehrere Shop-Produkte zeigen auf denselben Altsystem-Artikel (`jetprint-matten-design`,
  `designmatten-jetprint`, `hinweismatten` → 648; `jetprint-premium`, `premium-1-farbig` → 6300000).
  Sie rechnen jetzt alle mit den Werten dieses Artikels (z. B. `designmatten-jetprint` EK 54,63 statt 52,67).
- Hinweis Brücke: Die Live-Preisabfrage (`fetchPricePfad`) läuft per GET. Das Altsystem liest
  Wunschmaße (`spezialoption[…][x|y]`) aber nur aus POST. Heute ohne Folgen, weil der Shop bei
  Produkten ohne EK nur feste Größen abfragt. Für Wunschmaße über diesen Weg müsste die Abfrage auf POST.

## Nach der ersten Prüfung (24.10.2026, zweite Runde)

- **Jede Zelle wird beim Speichern geprüft** (`parseStaffelTabelle`): Mengen ganze Zahlen, erste = 1,
  aufsteigend; Faktoren > 0 und ≤ 1; Breiten > 0 und aufsteigend; Sonderform-Prozent ≥ 0 („30%“ erlaubt).
  Ein Fehler lässt die betroffene Zeile beim alten Wert, die Zelle wird rot, die Meldung steht über der
  Tabelle (auch nach dem Neuladen, über die Sitzung). Vorher löschte ein Tippfehler Stufen still und
  dauerhaft. Gespeichert wird mit „; “ getrennt, Faktoren werden ungerundet angezeigt (0,955 bleibt 0,955).
  Hinweis bei mehr als 6 gespeicherten Breiten oder weniger/mehr als 6 Stufen (nur Altbestand).
- **Salesfactor mit 6 Stellen** (VK ÷ EK) bei 30 Artikeln, damit der Preis bei Standardmaß auf den Cent
  gleich bleibt (vorher 3 Stellen, bis 5 Cent Abweichung). 648 und 569 behalten 1,931 aus der Mappe.
  Sicherung: `sicherung-spezialoption-vor-sf6-2026-10-24.json`.
- Alte Prüfskripte vom 02.10. (`zz_*.php`, darunter eines, das Artikel 459 ändern konnte) lagen im
  Web-Root und waren per HTTP erreichbar. Verschoben nach `Backup/matten.de-2026-09-07/alte-pruefskripte-2026-10-02/`.
- Zweite unabhängige Prüfung: bestanden. Admin-Rundlauf mit allen Fehlerfällen ohne Datenverlust,
  56 + 56 + 153 Preisfälle Shop gegen Altsystem centgenau.

## Vor dem Einbau auf dem echten Server

- **Die Preisabfrage gibt EK und Salesfactor heraus** (`preisformel.stammdaten`, öffentlich abrufbar) —
  damit lässt sich die Marge ausrechnen. In `net-neu/assets/js/daten.js` stehen EK und Salesfactor schon
  heute (auch auf Netlify). Vor dem Livegang nur die Werte ausliefern, die der Verkaufspreis braucht
  (z. B. VK je m² statt EK × Salesfactor, Sonderfarbe nur VK).
- Drückt die Preis-Korrektur den Preis auf 0 oder darunter (z. B. „-200“), rechnet das Altsystem nach der
  alten Formel, der Shop zeigt die Formel ohne Korrektur. Die Admin-Maske warnt in diesem Fall.

## Offen

- Auf den echten Server von matten.de: braucht Zugang und Freigabe von Herrn Fuchsius.
- Salesfactor je Artikel bestätigen (Mappe nennt 1,931 / 1,728 / 1,8 je Colortype; gesetzt ist der
  heutige Faktor des Artikels, z. B. 2,237 bei REHA-Matten).
- Die Admin-Maske im Browser mit echtem Login hat Lukas zu prüfen (keine Zugangsdaten bei uns).
