# Erkundung: Welche Daten trägt ein Produkt im Altsystem matten.de?

Stand 03.10.2026. Gemessen am lokalen Altsystem (localhost:8080, Datenbank `fuchsius_matten`) und an der Brücke (Port 8787). Es wurde nichts verändert.

Zahlen gelten für **alle 580 Artikel** oder, wo vermerkt, für die **385 aktivierten**.

---

## 1. Tabelle `artikel` — die Spalten

Ein Artikel ist **eine Zeile** in `artikel`. Die Texte liegen getrennt (siehe 1.2), die Bilder ebenfalls (siehe 4).

### 1.1 Spalten und ihre Bedeutung für den Shop

| Spalte | Bedeutung | Für die Anzeige? | Beispiel (Art. 459 = `6300000`) |
|---|---|---|---|
| `id` | interne Nummer; Schlüssel für alle Nebentabellen | ja (Verknüpfung) | 459 |
| `urlkey` | letztes Stück der Adresse | ja | `6300000` |
| `artikelnummer` | eindeutig; steht auf der Seite. Meist gleich `urlkey`, manchmal verschieden (`63000001` zu `jetprint_matten-light-einfarbig`) | ja | `6300000` |
| `status` | `aktiviert` (385) / `deaktiviert` (195) | **Filter** | aktiviert |
| `bestellbar` | `ja`/`nein`. Bei `nein` fehlt der Kaufknopf (Templates prüfen `!= 'nein'`) | ja | ja |
| `fester_preis` | **Kommentar im Schema ist falsch** („Startseite zeigen"). In den Daten: `ja` = Kaufartikel mit Preis, `nein` = Anfrageartikel (Variante `…-a`) | ja (Kauf/Anfrage) | ja |
| `preis` | Grundpreis **netto** in Euro (decimal 10,2) | ja | 24.90 |
| `sonderpreis` | wenn ≠ 0, ersetzt `preis`. Bei **keinem** Artikel gesetzt | ja (leer) | 0.00 |
| `preisstaffel` | `keine` (540) / `absolut` (6) / `prozentual` (34). Die Zeilen dazu: siehe 5 | ja | keine |
| `spezialoption` | Maßware-Typ: `keine`/`flaeche`/`laenge`/`umfang`/`spezial` (siehe 3) | ja | spezial |
| `spezialoption_data` | PHP-`serialize()` mit den Einstellungen dazu (siehe 3) | ja | – |
| `weight` | Gewicht in kg (decimal 5,2); bei 45 aktiven = 0 | Versand | 3.25 |
| `versandkosten` | Berechnungsart: `klasse`/`gewicht`/`preis`/`laenge` | Versand | preis |
| `versandklassen_id` | → Tabelle `versandklassen` (UPS, DPD, Pauschalen …). 0 = keine | Versand | 9 |
| `versandzusatz_id` | → `versandzusatz` (Zuschlag) | Versand | 7 |
| `steuerklassen_id` | → `steuerklasse` (1 = USt-pflichtig 19 %, 2 = frei, 3 = ermäßigt). Aktive: 382 × Klasse 1, 3 × Klasse 3 | Preis brutto | 1 |
| `verfuegbarkeit` | 0–3, Text je Wert aus dem Textsystem (`verfuegbarkeits_text_0…3`). Aktive: 0 × 8, 1 × 42, 2 × 122, 3 × 213 | ja | 2 |
| `kategorien_id` | **Hauptkategorie** (→ `kategorien`). Weitere Zuordnungen in `artikel_kategorien` (920 Zeilen, 577 Artikel) | ja (Pfad) | 1 = standard-schmutzfangmatten |
| `sortierung` | Reihenfolge in der Kategorie | ja | 28 |
| `startseite` | `ja` = auf der Startseite zeigen | ja | nein |
| `farbbilder` | 1 = Artikel hat Farbwahl über Bilder (siehe 4.3); 115 aktive | ja | 1 |
| `design_def` / `base_def` | vorgewählte Design- / Grundfarbe (Wert aus den Farbbildern) | ja | `613-königsblau` |
| `design_name` / `base_name` | Beschriftung der Farbwahl (meist leer) | selten | – |
| `zubehoer` | Verweis auf Zubehör (bei **keinem** Artikel gefüllt) | nein | – |
| `hersteller_id` | bei **keinem** Artikel gesetzt | nein | 0 |
| `lieferant_id`, `lieferanten_artikelnummer`, `lieferanten_preis` | Einkauf | **nein, intern** | – |
| `angesehen`, `import_marker`, `trennlinie`, `kqsqr` | Zähler / Technik | nein | – |

Kein Feld heißt „Name" oder „Beschreibung" — die Texte stehen in `texte`.

### 1.2 Wo liegen die Texte?

Tabelle `texte`, Schlüssel (`namespace`, `id`, `code`, `lang`). Für Artikel gilt: `namespace = 'artikel'`, `id = artikel.id`, `lang` = `de` / `en` / `id`.

```sql
SELECT code, text FROM texte
 WHERE namespace='artikel' AND id=459 AND lang='de';
```

| `code` | Inhalt | Länge max (de) |
|---|---|---|
| `titel` | **Name** des Artikels (reiner Text) | 141 |
| `kurztext` | Stichpunkte, ein `-` je Zeile, `\n`-getrennt (Flor, Höhe, Gewicht …) | 4.885 |
| `text` | **Beschreibung als HTML** (`<h3>`, `<p>`, Entities wie `&ouml;`, **auch `<img src="/media/bild/…">`**) | 37.966 |
| `alternativtext_bild1` | Alt-Text des Hauptbilds | 743 |
| `meta_title`, `meta_description`, `meta_keywords` | SEO | ~750 / 776 / 978 |

* Jeder der 580 Artikel hat alle Codes in **allen drei Sprachen** (de, en, id). Die englischen und indonesischen Texte sind maschinell, teils mit deutschen Resten (Beispiel 459: englischer Text beginnt deutsch).
* Dazu eine Fremdzeile `id = 0` („kein Titel") — gehört keinem Artikel.
* **Titel leer bei 109 der 385 aktiven.** 80 davon sind Varianten (`urlkey` endet auf `-a`) — die Brücke nennt das `nameGeerbt` und holt den Namen vom Hauptartikel. Die übrigen 29 haben schlicht keinen Titel (z. B. `nomad-matten1`, `sicherheitsmatten3a`).
* Text leer bei 106 aktiven, Kurztext leer bei 6.
* Attributnamen und -werte werden ebenfalls übersetzt: `namespace='attribute'`, `id=0`, `code` = deutscher Wert, z. B. `601-zitronengelb` → en „601-lemon", `Grundfarbe` → „Base Color" (44 Einträge).

### 1.3 Preis im Altsystem — so setzt er sich zusammen (`Artikel::getPreis`)

```
Preis = (sonderpreis, falls ≠ 0, sonst preis)
      + Preis der Spezialoption (bei Maßware, aus Breite/Länge)
      + Summe der Aufpreise der gewählten Attribute
```
Alles **netto**. Mit Steuerklasse 19 % ergibt sich der Bruttopreis.

---

## 2. Attribute (`artikel_attribute`)

### 2.1 Aufbau

| Spalte | Bedeutung |
|---|---|
| `artikel_id` | Artikel |
| `attribute_code` | **Name der Auswahl** („Grundfarbe", „Standardgröße" …) — Freitext, kein Schlüssel auf eine Stammtabelle |
| `wert` | **eine wählbare Option** („85cm x 120cm", „613-königsblau") |
| `preis` | **Aufpreis** in Euro netto, absolut, **addiert** zum Grundpreis (nicht der Preis der Option!) |
| `lieferanten_preis` | Einkauf, intern |
| `sortierung` | globale Zähler-ID; **bestimmt die Reihenfolge** der Optionen |

Primärschlüssel (`artikel_id`, `attribute_code`, `wert`): Ein Attribut ist also eine **Gruppe von Zeilen** — eine Zeile je Option. Auswahl im Shop = eine Option je Attribut.

Beispiel Art. 459, Attribut `Standardgröße` (Grundpreis 24,90):

| wert | preis (Aufpreis) |
|---|---|
| 40cm x 60cm | 0,00 |
| 50cm x 75cm | 14,01 |
| 60cm x 85cm | 28,02 |
| 85cm x 120cm | 80,93 |
| 150cm x 240cm | 348,63 |
| Maßanfertigung | 0,00 |

Die erste Option mit 0,00 ist die Vorauswahl und im Grundpreis enthalten. Gleiche Artikel nutzen `Trittrand,` (3 Optionen, „Verlegung im Rahmen" +1,00) und `Breite` (6 Optionen, Aufpreis 0 — das ist das Breiten-Auswahlfeld der Spezialoption).

### 2.2 Kennzahlen

* 17.928 Zeilen insgesamt, **aber 5.241 davon gehören zu gelöschten Artikeln** (Waisen: 211 Artikel-IDs, die es nicht mehr gibt).
* **Echt: 12.687 Zeilen**, 248 verschiedene `attribute_code`, an 501 Artikeln.
* **Aktive Artikel: 10.470 Zeilen, 201 verschiedene Codes.** 355 aktive haben mindestens ein Attribut, **30 aktive haben keines**. Ein aktiver Artikel hat im Mittel 1–8 Attribute (Verteilung: 1 → 103 Artikel, 2 → 70, 3 → 35, 4 → 48, 5 → 46, 6 → 19, 7 → 25, 8 → 9).
* **302 aktive Artikel** haben mindestens einen Aufpreis ≠ 0.
* **Schmutz in den Namen:** gleiche Auswahl steht als `Grundfarbe`, ` Grundfarbe` (führendes Leerzeichen), `Grundfarbe: `, `Standardgröße` / ` Standardgröße`, `Größe` / ` Größe` / `Größe: `. Mit getrimmtem Namen und ohne Doppelpunkt bleiben ~208 statt 248 Codes. Beim Übernehmen unbedingt **trimmen**, aber den Originalnamen behalten (das Formularfeld heißt `attribute[<Originalname>]`).

### 2.3 Die 15 häufigsten `attribute_code` (nur echte Artikel)

| # | attribute_code | Zeilen | Artikel (aktiv) | Aufpreis ≠ 0 | max. Aufpreis | Beispielwerte |
|---:|---|---:|---:|---:|---:|---|
| 1 | `Grundfarbe` | 4.598 | 137 (108) | 52 | 1,10 | 601-zitronengelb, 613-königsblau, 644-mink; „Prem-CARE-anthrazit" (Art. 518, +0,78) |
| 2 | `Designfarbe` | 3.424 | 86 (73) | 2 | 1,00 | 600-weiß, 601-zitronengelb … (Art. 648/791: +1,00) |
| 3 | `Standardgröße` | 559 | 78 (67) | 408 | 1.127,50 | 40cm x 60cm, 50cm x 75cm, Maßanfertigung |
| 4 | `Breite` | 275 | 73 (62) | 20 | 105,59 | 60 cm, 75 cm, 115 cm, 200 cm; auch „115", „150" |
| 5 | `Schriftfarbe =` | 224 | 5 (4) | 0 | 0,00 | 600-weiß … 613-königsblau |
| 6 | `Größe` | 163 | 41 (30) | 132 | 475,08 | 50 cm x 75 cm, 85 cm x 115 cm |
| 7 | `Abmessungen` | 156 | 47 (25) | 76 | 46,81 | „sind Netto-Mattenmaße", „sind Rahmen-Innenmaße" |
| 8 | `Ausführung` | 153 | 30 (21) | 81 | 2.500,00 | 90cm x 600cm, rot / grau; 120cm x 900cm, grau |
| 9 | `Größe: ` | 149 | 56 (35) | 94 | 179,93 | 50 cm x 75 cm, 60 cm x 85 cm |
| 10 | `Format` | 142 | 84 (71) | 0 | 0,00 | hoch – vertical – portrait; quer – horizontal |
| 11 | `Farbe` | 137 | 18 (7) | 0 | 0,00 | schwarz, anthrazit, silber, bronze |
| 12 | `Ripsfarbe` | 123 | 22 (18) | 0 | 0,00 | anthrazit, hellgrau, beige, blau |
| 13 | ` Standardgröße` | 112 | 17 (15) | 79 | 475,82 | 40cm x 60cm … |
| 14 | `Mattengröße` | 82 | 17 (15) | 54 | 647,35 | 85 cm x 90 cm (0), 85 cm x 120 cm (+1,40) … Sondergröße: |
| 15 | `Nitril-Gummirand` | 71 | 24 (1) | 0 | 0,00 | mit, umlaufend; ohne, freie Verlegung (minus 5cm) |

Weitere häufige: `Individuelle Bedruckung` (nein / ja, +7,20), `Mattenhöhe` (512 RG, Höhe 12 mm …), `Qualität JetPrint`, `Trittrand,`.

### 2.4 Wie wirkt `preis` dort?

* **Aufpreis**, additiv, netto. `Preis = Grundpreis + Σ Aufpreis der je Attribut gewählten Option`.
* Die Größen-Attribute tragen den Preisunterschied je Standardgröße (Art. 459: 0 bis 348,63); Farben haben fast immer 0 (Ausnahmen: Prem-/Sonderqualitäten +0,78 bis +1,10).
* Die erste Option (kleinste Größe) hat 0,00 und ist vorausgewählt.
* **Auswahlart im Formular** ist nicht gespeichert, sondern ergibt sich aus Name und Bildern: Hat der Artikel `farbbilder = 1` und Farbbilder, werden `Grundfarbe` / `Designfarbe` als **Farbfelder** gezeigt (Brücke: `typ: farbwahl`), sonst als Auswahlliste (`select`).

---

## 3. Spezialoptionen (Maßware)

### 3.1 Verteilung

| `spezialoption` | alle 580 | davon aktiv | Bedeutung |
|---|---:|---:|---|
| `keine` | 314 | **194** | Festartikel, nur Grundpreis + Attribute |
| `flaeche` | 121 | **79** | Breite × Länge → Preis je m² |
| `spezial` | 97 | **82** | Maßanfertigung mit Min/Max, m²-Preis, Formel (Rolle/Zuschnitt) |
| `umfang` | 23 | **17** | Rahmenumfang (Profile, Rahmen) |
| `laenge` | 25 | **13** | Meterware / Profil nach Länge |

Maßware gesamt aktiv: **191** (über alle 580 Artikel sind es 266, wie im Auftrag genannt).

### 3.2 Inhalt von `spezialoption_data`

PHP-`serialize()` eines Objekts, Muster: `C:<Länge>:"SpezialoptionXxx":<n>:{a:1:{s:4:"data";a:<k>:{ …Schlüssel… }}}` (Klassen `SpezialoptionFlaeche`, `…Laenge`, `…Umfang`, `…Spezial`). Alle Werte sind **Strings**.

**Wichtig:** Die Klasse in den Daten kann vom Spaltenwert abweichen. Bei **194 aktiven `keine`-Artikeln** steht trotzdem Inhalt drin (161 × Flaeche, 12 × Laenge, 11 × Spezial, 10 × leer/NULL) — er wird dann **ignoriert**. Maßgeblich ist die Spalte `spezialoption`.

| Typ | Schlüssel | Beispiel |
|---|---|---|
| **Flaeche** (Art. 7 `kokosmatte-natur-a`) | `unit`, `desc_x`, `desc_y`, `desc`, `input_unit`, `input_unit_factor` | unit=`m`, desc_x=`Breite (X)`, desc_y=`Länge (Y)`, desc=`Abmessungen`, input_unit=`mm`, input_unit_factor=`1000` |
| **Laenge** (Art. 10 `aluminium-anlaufprofil`) | `unit`, `desc`, `input_unit`, `input_unit_factor` | unit=`m`, desc=`Länge`, input_unit=`mm`, factor=`1000` |
| **Umfang** (Art. 76 `aluminium-profilrahmen`) | `unit`, `desc_x`, `desc_y`, `desc`, `input_unit`, `input_unit_factor` | desc=`Rahmenprofil`, desc_x=`Länge`, desc_y=`Breite`, input_unit=`mm`, factor=`100` (!) |
| **Spezial** (Art. 6 `64000161`, Art. 95 `s_und_s-gummiwabenmatten`) | `calc`, `unit`, `desc_x`, `desc_y`, `desc`, `input_unit`, `input_unit_factor`, `minL`, `maxL`, `minB`, `maxB`, `input_squaremeter_price`, `input_squaremeter_price_gross`, `input_squaremeter_price_ek`, `input_squaremeter_price_ek_gross`, `input_scope_price`, `input_scope_price_gross` | calc=`varL`, desc=`Mattengröße`, input_unit=`cm`, factor=`100`, minL=40, maxL=400, minB=40, maxB=400, m²-Preis netto 59,20 / brutto 70,45, Umfangspreis 0 |

Bedeutung der Spezial-Schlüssel: `calc` = Rechenmodell (aktive Spezial-Artikel: `varL` 47 ×, `custom` 35 ×), `unit` = Preiseinheit (m), `input_unit` / `input_unit_factor` = Eingabeeinheit und Umrechnung (cm/100, mm/1000), `min/max L/B` = Grenzen in Eingabeeinheit, `input_squaremeter_price*` = **m²-Preis** netto/brutto (`_ek` = Einkauf, **intern**), `input_scope_price*` = Preis je laufendem Meter Umfang (meist 0).

Bei Einheit `mm` stehen Grenzen in Millimetern (Art. 95: maxL=1500, maxB=100000), bei `cm` in Zentimetern (Art. 6: 40–400). Die **Einheit muss mitgeliefert** werden.

**Preisformel (Weg B, Commit `65bc09c`):** 17 zusätzliche Eingabefelder (`pf_…`: EK-Listenpreis, Salesfactoren, Colortype, Standardbreiten, Zuschläge, Mengenstaffel …) und ein Schalter je Artikel werden in `spezialoption_data` abgelegt (Klasse `SpezialoptionSpezial`, Code `Preisformel.php`). **Aktuell bei 0 Artikeln gesetzt** (`LIKE '%pf_%'` → 0). Die Brücke sieht davon also noch nichts; sobald Herr Fuchsius Werte einträgt, liegen sie dort.

---

## 4. Bilder

### 4.1 Wege vom Artikel zur Datei

```
artikel.id ─► artikel_dateien (artikel_id, dateien_id, typ) ─► dateien (id, typ, dateiname)
                                                              └► Datei: /media/bild/<dateiname>
```

* `dateien`: 2.187 × `bild`, 7 × `datei`; `dateiname` ist der Dateiname unter **`/media/bild/`** (z. B. `JP_default_0.jpg`). Pfad also immer `/media/bild/` + `dateiname`.
* `artikel_dateien.typ` (enum): `standard` / `oben` / `oben rechts` / `galerie` / `farbe`. Sortierung im Altsystem: nach `dateiname` aufsteigend (`getBilder($typ)`).

| `artikel_dateien.typ` | Zeilen | Artikel | Verwendung |
|---|---:|---:|---|
| `standard` | 135 | 120 | Produktbild auf der Artikelseite (das erste ist Hauptbild, die übrigen als Vorschauleiste) |
| `oben` | 134 | 123 | Bilder oben auf der Artikelbox |
| `oben rechts` | 21 | 17 | Bilder oben rechts |
| `galerie` | 2 | 1 | Galerie |
| `farbe` | 11.328 | 151 | Farbfelder (siehe 4.3) |

### 4.2 Wie viele Artikel haben Bilder?

Aktive Artikel (385):

| Bildlage | Artikel |
|---|---:|
| **kein Eintrag** in `artikel_dateien` | **149** |
| nur `farbe` | 87 |
| nur `oben` | 66 |
| nur `standard` | 51 |
| `standard` + `farbe` | 14 |
| `oben` + `farbe` | 12 |
| `oben` + `oben rechts` | 3 |
| `galerie` | 1 |
| Sonstige Kombinationen | 2 |

**Wichtig:** Von den 149 ohne Eintrag zeigen **69 ein Bild im Beschreibungstext** (`<img src="/media/bild/…">` in `texte.text`). Insgesamt enthalten **124 aktive Texte** ein `<img>`. Die Brücke nennt das `bildQuelle: "beschreibung"` (Beispiel Karte 6300000: `VierJahr2_512x340-farb.JPG` stammt aus dem Text).

→ **80 aktive Artikel haben gar kein Bild** (weder Eintrag noch `<img>`), z. B. Varianten `…-a`, `kokosmatte-natur-a`, `water_horse`. Für diese ist „kein Bild" die richtige Aussage, kein Fehler.

Alle 580: 358 mit Eintrag in `artikel_dateien`, 222 ohne.

### 4.3 Farbbilder

* Gesetzt über `artikel.farbbilder = 1` (115 aktive, 39 deaktivierte). Bilder in `artikel_dateien` mit `typ = 'farbe'`.
* **Der Dateiname trägt die Bedeutung:**
  * `<farbe>_farboption.JPG` → Option für `attribute[Grundfarbe]` (Wert = Dateiname ohne `_farboption`, z. B. `613-königsblau`)
  * `<farbe>_designoption.JPG` → Option für `attribute[Designfarbe]`
  * `…default_farboption…` → Bild des „Standard"-Felds
  * `JP_default_0.jpg` … `JP_default_8.jpg`, `JP_variant_0.jpg`, `default.jpg` → Produktfotos der Artikelseite (Art. 459 hat **keine** `standard`/`oben`-Bilder, sein Hauptbild `JP_default_0.jpg` kommt aus der Farbgruppe!)
* Art. 459 hat 147 Farbbilder. Bis zu 204 je Artikel (Mittel 77).
* Die Farbfeld-Werte (`attribute_code=Grundfarbe`) und die Farbbild-Dateinamen müssen **übereinstimmen**; sonst gibt es ein Feld ohne Bild.

---

## 5. Preisstaffeln (`artikel_preisstaffeln`)

Spalten: `artikel_id`, `anzahl` (ab Stückzahl), `preis`. Die Art steht in `artikel.preisstaffel`: `absolut` (Preis je Stück ab Menge) oder `prozentual` (Rabatt in %).

* Insgesamt 46 Zeilen für 25 Artikel-IDs — **aber alle 25 sind gelöschte Artikel** (Waisen, z. B. 127, 201, 225, 231 … mit „ab 2 Stück 5,00; ab 5 Stück 10,00").
* **Kein einziger bestehender Artikel hat Staffelzeilen.**
* Trotzdem steht die Spalte `artikel.preisstaffel` bei 38 aktiven Artikeln auf `prozentual` (32) oder `absolut` (6). Ohne Zeilen bleibt das **wirkungslos**.
* Die Mengenstaffel der neuen Preisformel (Faktoren 0,88 bis 1,00 für 2/3/10/20/30 Stück) liegt **nicht** in dieser Tabelle, sondern in `spezialoption_data` (siehe 3.2).
* Gegenstück im Frontend: `daten.js` hat eigene Mengenrabatte; sie gehören nicht zum Altsystem-Katalog.

→ Preisstaffeln können für die Übernahme **ignoriert** werden.

---

## 6. Was die Brücke heute liefert und was fehlt

Geprüft mit `GET /api/produkt?pfad=/fussmatten/standard-schmutzfangmatten/6300000` (Antwort `ok`, `parsen.stufe = vollstaendig`, 212 ms). Die Brücke **liest die fertige HTML-Seite** des Altsystems und zerlegt sie; sie greift nicht auf die Datenbank zu.

### 6.1 Geliefert

| Feld in der Antwort | Quelle im Altsystem |
|---|---|
| `artikelId` (459), `artikelnummer`, `artikelnummerNumerisch` | `artikel.id` / `.artikelnummer` (aus verstecktem Feld `artikel`) |
| `name` (aus `h3.titel`), `nameQuelle`; bei Varianten `nameGeerbt`, `gehoertZu` (in der Kategorie) | `texte.titel` |
| `pfad`, `angefragterPfad`, `umgezogen`, `brotkrumen`, `kategorie` | Kategorie + `urlkey` |
| `kaufbar`, `modus` (`kauf`/`anfrage`), `kaufformular.knopfbeschriftung` | `fester_preis` / `bestellbar` |
| `kurzbeschreibung`, `beschreibung`, `beschreibungAbsaetze` | `texte.kurztext` / `texte.text` (als Text, HTML entfernt) |
| `hauptbild`, `bilder[]` (je `bild` über Proxy + `original`) | `artikel_dateien` (hier alle 60 Bilder in einer Liste) |
| `preis.wert/text` (123,37 €), `preis.versand/versandText` (11,90 €), `preis.ustSatz` (19), `preis.brutto`, `preis.unvollstaendigPraefix` („ab") | berechneter Preis der Seite, **brutto**, mit Standardauswahl |
| `attribute[]` (`feld`, `name`, `typ`: `auswahl`/`farbwahl`, `art`: `attribut`/`spezialoption`, `optionen[]` mit `wert`/`label`/`gewaehlt`) | `artikel_attribute` + Spezialoption (Breite als Auswahl) |
| `masse[]` (`feld`, `min` 40, `max` 700) | `spezialoption_data` (minL/maxL) |
| `technischeDaten[]` (Links auf Zusatzseiten) | Beschreibungslinks |
| `sprachen` (de, en, id) | – |
| `kaufformular.upstream` (Felder, `preisAbfrage`) und `kaufformular.bruecke` | Formular der Seite |

Die Kategorieliste (`/api/kategorie`) liefert je Produkt zusätzlich `anker`, `variante`, `bild`, `bildAlt`, `bildQuelle`, `knopf`, `modus`.

### 6.2 Fehlt oder ist nicht verwertbar

| Was fehlt | Warum es zählt | Wo es herkäme |
|---|---|---|
| **Aufpreis je Attributoption** (`artikel_attribute.preis`) | Preise der Optionen sind in der Antwort nicht enthalten (`optionen` haben nur `wert`/`label`/`gewaehlt`). Für Standardgrößen (Art. 459: 0 bis 348,63) ist das der **Hauptpreisträger**. Frontend müsste sonst pro Option eine Preisabfrage stellen | `artikel_attribute.preis` |
| **Netto-Grundpreis** (`artikel.preis`, `sonderpreis`) | Es kommt nur der fertige Bruttopreis für die Vorauswahl („ab 123,37 €") | `artikel.preis` |
| **Preisformel-Stammdaten** (`pf_…`, Mengenstaffel, Schalter) | Nötig für Preise in Maß/Menge/Sonderform; derzeit bei keinem Artikel gesetzt, aber der Auftrag verlangt es | `spezialoption_data` |
| **Spezialoption vollständig**: Typ (`flaeche`/`umfang`/`laenge`/`spezial`), `calc`, Einheit, Umrechnungsfaktor, `minB`/`maxB`, m²-Preis, Umfangspreis | Die Brücke gibt nur eine Breiten-Auswahl und ein Längenfeld mit min/max; Eingabeeinheit (cm/mm), Mindest-/Höchstbreite, m²-Preis fehlen | `artikel.spezialoption(_data)` |
| **Preisänderung je Auswahl** (Kombination aus Größe, Rand und Breite) | `kaufformular.upstream.preisAbfrage` führt zu `?getpricejson=1`, die Brücke hat aber keinen Aufruf, der eine Auswahl durchrechnet (laut Commit: `GET /api/price` überträgt keine Maße) | `getpricejson` |
| **Farbbilder je Wert**: Zuordnung Farbname ↔ Farbbild | Die `bilder`-Liste ist ein **ungeordneter Topf** aus 60 Dateien (Produktfotos, `…_farboption`, `…_designoption`); die Zuordnung zu `Grundfarbe`/`Designfarbe`-Optionen muss über den Dateinamen erraten werden. Zudem erscheinen nur 60 Bilder, obwohl Art. 459 allein 147 Farbbilder hat | `artikel_dateien.typ='farbe'` |
| **Bildtyp** (`standard`/`oben`/`oben rechts`/`galerie`) | Die Brücke unterscheidet nicht; keine Aussage „das ist das Hauptbild" im Sinne des Altsystems | `artikel_dateien.typ` |
| **Alt-Text des Bilds** (`alternativtext_bild1`) | In der Kategorienliste als `bildAlt` da, bei `/api/produkt` nicht | `texte` |
| **SEO-Texte** (`meta_title`, `meta_description`, `meta_keywords`) | fehlen | `texte` |
| **Beschreibung als HTML** | kommt als reiner Text in Absätzen; Überschriften, Listen, Bilder im Text und Links gehen verloren | `texte.text` |
| **Mehrsprachigkeit** | `sprachen` nennt de/en/id, aber Inhalte liegen nur in der angefragten Sprache vor | `texte` (lang) |
| **Steuerklasse, Versandklasse, Gewicht, Versandart** | nur als fertige Zahl (`ustSatz`, `versandText`) für die Vorauswahl, nicht als Stamm | `artikel.*` |
| **`sortierung`, `startseite`, `verfuegbarkeit`** | `verfuegbarkeit` ist `None`; Sortierung nur indirekt über die Reihenfolge der Kategorieseite | `artikel.*` |
| **Weitere Kategorien** (`artikel_kategorien`) | Nur der Pfad, über den man gekommen ist | `artikel_kategorien` |
| **Attributreihenfolge und Zusatztexte** | Reihenfolge ist die der Seite; keine Beschriftungs-Übersetzung (`texte.attribute`) | `texte` |
| **Preisstaffel** | nicht geliefert, aber nichts zu liefern (siehe 5) | – |

### 6.3 Stolpersteine bei der Übernahme von 385 Artikeln

1. **Zwei Wahrheiten für Bilder:** Eintrag in `artikel_dateien` **oder** `<img>` im Beschreibungstext. Für 69 aktive Artikel gilt nur das zweite, für 80 gibt es gar nichts.
2. **Varianten:** 85 aktive Artikel sind `-a`-Varianten (Anfrageform, gleicher Inhalt wie der Hauptartikel); 80 davon ohne eigenen Titel. Name, Bilder und Beschreibung kommen vom Hauptartikel.
3. **Attributnamen sind unsauber** (Leerzeichen, Doppelpunkte, „Schriftfarbe =", „Trittrand,"). Zum Anzeigen säubern, fürs Absenden den Original-Namen behalten.
4. **Waisen:** 5.241 Attributzeilen und 46 Staffelzeilen gehören zu gelöschten Artikeln — nicht mitnehmen, sonst entstehen Phantomattribute.
5. **Spalte `spezialoption` ist maßgeblich**, nicht die Klasse in `spezialoption_data` (194 aktive `keine`-Artikel tragen noch Alt-Daten).
6. **Nettopreise im Altsystem, Brutto auf der Seite.** Für Aufpreise und Formel mit Netto rechnen, Steuer am Schluss.
7. **Preise 0:** 16 aktive Artikel haben `preis = 0` (Anfrageartikel, kein Fehler).

*Abfragen der Erkundung: nur lesend (SELECT). Es wurde nichts in der Datenbank, im Webverzeichnis oder im Livesystem verändert; `/api/kasse/bestellen` wurde nicht aufgerufen.*
