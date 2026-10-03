# Baubericht: Excel-Preisformel im Altsystem matten.de

Stand 02.10.2026 · gebaut ausschliesslich im **lokalen** Altsystem
(`Backup/matten.de-2026-09-07/web`, Container `Altsystem-lokal`, http://localhost:8080).
Das Livesystem wurde nicht angefasst.

---

## 1. Was geaendert wurde

Vier Dateien, davon eine neu. Alle Aenderungen dienen der Formel, nichts sonst.

### 1.1 Neu: `php/Plugins/Katalog/Preisformel.php` (415 Zeilen)

Die Rechnung selbst, als eigene Klasse ohne Datenbankzugriff. Sie bildet
`Frontend/bridge-demo/public/preisformel.js` Schritt fuer Schritt nach; jeder
Rechenschritt traegt den Excel-Zellbezug als Kommentar.

| Baustein | Zeile | Excel |
|---|---|---|
| `getVorgabe()` — alle Stammgroessen der Mappe | 33 | F1/I1/L1, Q5, R2, B6/C6, Q7:V7, Q6:V6/R5:V5, L5, N5, O5, P5, P6 |
| `salesfactorFuer()` | 92 | C2 |
| `faktorBreiteFuer()` — Sondermass, „zu schmal“ | 104 | L5 |
| `faktorLaengeFuer()` — „zu breit“/„zu lang“ | 120 | M5 |
| `staffelFuer()` — Mengenstaffel | 143 | G5-Kaskade |
| `berechne()` — die Hauptrechnung | 166 | D4, G5, F5, J5, I5, H5, E6 |
| `wendeKorrekturAn()` — Preis-Korrektur | 316 | — (Kundenwunsch) |
| `alsZahl()`, `alsZahlenliste()` — deutsche Eingaben lesen | 352, 387 | — |

Die drei Besonderheiten aus dem Auftrag sind umgesetzt:
* **Sonderfarbenaufschlag nur einmal je Auftrag** — `vkGesamt = Menge · vkProStueck − (Menge−1) · P5` (Zeile 253).
* **Sondermass ×1,25 nur, wenn weder Breite noch Laenge eine Standardbreite trifft** (Zeile 110).
* **Menge unter der kleinsten Staffelstufe** → Excel liefert FALSCH → Basis 0 (Zeile 247).

### 1.2 `php/Plugins/Katalog/SpezialoptionSpezial.php` (449 → 805 Zeilen)

| Was | Zeile |
|---|---|
| **Admin-Maske**: neuer Block `<fieldset>` „Preisformel (Excel-Mappe)“ mit 17 Feldern | 210–312 |
| `vorgabe()` — Vorgabewert als grauer Platzhalter, deutsch mit Komma | 427 |
| `istPreisformelAktiv()` — **der eine Schalter** | 445 |
| `getPfColortype()` | 451 |
| `getMengenstaffelVorgabeText()` | 458 |
| `leseMengenstaffel()` — liest „1:1, 2:0,95, …“ | 488 |
| `getPreisformelStammdaten()` — sammelt die gepflegten Werte ein | 527 |
| `berechnePreisformel()` — rechnet fuer diesen Artikel | 577 |
| `$fields` um 17 `pf_*`-Felder erweitert | 677 |
| `getAufpreis($optionen, $anzahl=1)` — Weiche alt/neu | 740, Formelzweig ab 757 |

### 1.3 `php/Plugins/Katalog/Artikel.php` — drei Zeilen

| Zeile | vorher | nachher |
|---|---|---|
| 1065 | `getOptionenPreis()` | `getOptionenPreis($anzahl)` |
| 1289 | `public function getOptionenPreis(){` | `public function getOptionenPreis($anzahl=1){` |
| 1292 | `getAufpreis();` | `getAufpreis(array(), $anzahl);` |

### 1.4 `php/Plugins/Katalog/ArtikelPage.php` — zwei Zeilen

Die Preisanzeige der Produktseite (AJAX) kannte die Menge in `$anzahl`
(Zeile 261), gab sie aber nicht weiter. Ohne das haette die Mengenstaffel
auf der Produktseite nicht gewirkt.

| Zeile | vorher | nachher |
|---|---|---|
| 300 | `getPreis()` | `getPreis($anzahl)` |
| 305 | `getOptionenPreis()` | `getOptionenPreis($anzahl)` |

### Pruefsummen

```
vorher (PRUEFSUMMEN-VORHER.txt)
63972f82adb50f67eb63c1bd9f5ed0c401bbcab8  php/Plugins/Katalog/SpezialoptionSpezial.php
42038c830d113112d46c1930f826345c0781a582  php/Plugins/Katalog/Artikel.php

nachher (Stand nach der zweiten Nachbesserung, Abschnitt 11)
3c2bfce155e507dfc65fac038c7eea08c9c9c807  php/Plugins/Katalog/SpezialoptionSpezial.php
e15dda2c49c197f5fed86d5b00935113f26974fe  php/Plugins/Katalog/Artikel.php
f72d16b518a0b156ffde3634fb161d3f9cec1d35  php/Plugins/Katalog/Preisformel.php      (neu)
f581d8aa2976e6f4dead2fdbb8a1ea2e8b60da64  php/Plugins/Katalog/ArtikelPage.php
```

---

## 2. Die Admin-Felder

Alle 17 Werte stehen als Eingabefelder in der Maske der Spezialoption
`spezial`, direkt unter dem Quadratmeterpreis. Screenshot: `admin-maske.png`.

| Feld | Name in der Datenbank | Vorgabe (grauer Platzhalter) |
|---|---|---|
| Preisformel verwenden (Ja/Nein) | `pf_aktiv` | **Nein** |
| EK-Listenpreis je m² | `pf_ek_qm` | 54,63 |
| Welcher Salesfactor gilt (Colortype) | `pf_colortype` | 1 — mehrfarbig |
| Salesfactor mehrfarbig / einfarbig / Ped-Print | `pf_sf_mehrfarbig`, `pf_sf_einfarbig`, `pf_sf_pedprint` | 1,931 · 1,728 · 1,8 |
| Standardbreiten der Rolle | `pf_standardbreiten` | 60, 75, 85, 115, 150, 200 |
| Sondermass-Faktor | `pf_f_sondermass` | 1,25 |
| Sonderform ohne / mit Rand | `pf_f_form_ohne`, `pf_f_form_mit` | 1,3 · 1,5 |
| Sonderfarbe Verkauf / Einkauf | `pf_sonderfarbe_vk`, `pf_sonderfarbe_ek` | 68 · **50** |
| Teuerungszuschlag in Prozent | `pf_tz_prozent` | 0 |
| Mengenstaffel | `pf_mengenstaffel` | 1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88 |
| Mindestbreite / Maximallaenge | `pf_min_breite`, `pf_max_laenge` | 30 · 700 |
| Preis-Korrektur | `pf_korrektur` | leer |

Die Werte liegen wie alle bestehenden in `artikel.spezialoption_data` als
PHP-`serialize()` (nachgeprueft: der Datensatz beginnt mit
`C:20:"SpezialoptionSpezial"`, kein JSON). Durch den Eintrag in `$fields`
erledigt das der bestehende Mechanismus; es war kein eigener Speicherweg noetig.

**Preis-Korrektur** (Kundenwunsch), Beschriftung in der Maske:
`+5` = 5 € mehr · `-5` = 5 € weniger · `+5%` = 5 Prozent mehr ·
`-5%` = 5 Prozent weniger · leer = keine Korrektur. Komma erlaubt (`2,5%`).
Unverstaendliche Eingaben lassen den Preis unveraendert — lieber keine
Korrektur als eine falsche.

**Sonderfarbe Einkauf** steht wie beauftragt auf dem Mappenwert **50 €** und ist
im Admin pflegbar. Die Entscheidung 50 oder 54 trifft der Auftraggeber.

---

## 3. Wie die Rueckfall-Sicherung funktioniert

Drei Stufen, jede fuer sich ausreichend:

1. **Der Schalter.** `getAufpreis()` prueft als Erstes `istPreisformelAktiv()`
   (Zeile 757). Steht er nicht ausdruecklich auf `1`, wird der gesamte
   Formelblock uebersprungen und die bisherige Rechnung
   `-1 * getBasisPreis() + getFlaeche() * getQuadratmeterPreis()` laeuft
   unveraendert. Vorgabe ist Nein, also verhalten sich **alle 97 Artikel mit
   der Spezialoption „spezial“ ohne jede Pflege exakt wie vorher**.
2. **Fehler der Formel fallen zurueck.** Liefert `Preisformel::berechne()`
   kein `ok` (zu schmal, zu breit, zu lang, unbrauchbare Eingaben), laeuft
   ebenfalls die alte Rechnung. Ein Artikel steht nie ohne Preis da.
   Nachgemessen: 20×20 cm („zu schmal“) → 2,37 € statt 0; 85×800 cm
   („zu lang“) → 402,56 € statt 0.
3. **Leere Felder sind kein Fehler.** Jedes nicht gepflegte Feld faellt auf den
   Mappenwert zurueck. Eine kaputte Mengenstaffel („voelliger Unsinn“) oder
   leere Standardbreiten fuehren zur Vorgabe, nicht zu 0.

Zusaetzlich: ein Staffelfaktor `0` wird beim Einlesen verworfen
(`leseMengenstaffel`, Zeile 500) — er wuerde den Preis auf null setzen und ist
immer ein Tippfehler.

**Gemessen** (`messe-preise.php`, 12 Artikel × 4 Fallgestaltungen = 48 Werte,
Preis, Lieferantenpreis und Optionenpreis je auf vier Nachkommastellen):

```
MESSUNG-VORHER.txt  gegen  Messung nach allen Aenderungen
→ centgenau identisch, kein einziger Unterschied
```

Die drei Seitenpreise aus `PREISE-VORHER.txt`:

| Seite | vorher | nachher |
|---|---|---|
| `/fussmatten/standard-schmutzfangmatten/6300000` | 123,37 € | **123,37 €** |
| `/logomatten/6300201-logomatte` | 125,53 € | **125,53 €** |
| `/kokosmatten/beflockte_kokosmatte` | (kein Wert) | — |

Der dritte Eintrag stand schon in `PREISE-VORHER.txt` ohne Betrag: die Adresse
antwortet im lokalen System mit einer Weiterleitung auf `/`, den Artikel gibt
es in der Datenbankkopie nicht. Das ist kein Ergebnis dieser Arbeit.

---

## 4. Kein bestehender Aufruf bricht

Alle Aufrufer wurden gesucht und einzeln geprueft.

**`getOptionenPreis()`** — vier Aufrufstellen im aktiven Code:

| Datei | Zeile | Form | Wirkung |
|---|---|---|---|
| `php/…/Artikel.php` | 1065 | `getOptionenPreis($anzahl)` | **geaendert**, reicht die Menge durch |
| `php/…/Artikel.php` | 1125 | `getOptionenPreis()` | unveraendert, Vorgabe 1 greift |
| `php/…/SpezialoptionDummy.php` | 26 | `getOptionenPreis()` | unveraendert |
| `php/…/ArtikelPage.php` | 305 | `getOptionenPreis($anzahl)` | **geaendert** |

**`getAufpreis()`** — die Signatur wurde nur in `SpezialoptionSpezial`
erweitert, und zwar mit Vorgabewert. Alle anderen Spezialoptionen bleiben
unberuehrt:

| Klasse | Signatur | bekommt jetzt | Folge |
|---|---|---|---|
| `Spezialoption` (Basis) | `getAufpreis()` | `(array(), $anzahl)` | ignoriert beide, liefert weiter `0` |
| `SpezialoptionFlaeche` | `getAufpreis($optionen=array())` | `(array(), $anzahl)` | `$optionen` = leeres Array wie vorher |
| `SpezialoptionLaenge` | `getAufpreis($optionen=array())` | dito | unveraendert |
| `SpezialoptionUmfang` | `getAufpreis($optionen=array())` | dito | unveraendert |
| `SpezialoptionDummy` | `getAufpreis($optionen=array())` | dito | unveraendert |
| `master/…/SpezialoptionRal`, `…Text`, `…Upload` | `getAufpreis()` | dito | ignorieren beide |
| `SpezialoptionSpezial` | **`getAufpreis($optionen=array(), $anzahl=1)`** | — | neue Weiche |

Der Punkt, auf dem das ruht: **PHP 7.0 ignoriert ueberzaehlige Argumente an
Methoden stillschweigend** — keine Warnung, kein Fehler. Eigens nachgestellt:

```
class B { function f(){ return func_num_args(); } }   $b->f(array(), 5)  →  2, kein Fehler
class C { function f($o=array()){ return count($o); } } $c->f(array(), 5)  →  0, kein Fehler
```

Vorher wurde `getAufpreis()` ohne Argument gerufen, jetzt mit `array()`. Fuer
die Klassen mit `$optionen=array()` ist das derselbe Wert; fuer die
parameterlosen ist es gleichgueltig. Nachgemessen (`pruefe-grenzfaelle.php`):
`getAufpreis()`, `getAufpreis(array())` und `getAufpreis(array(),1)` liefern
denselben Betrag.

**Die Zahlungsarten** (`RechnungPayment`, `OgonePayment`, `PaypalPayment`,
`NachnahmePayment` …) haben ebenfalls ein `getAufpreis()`, gehoeren aber zu
`PaymentPlugin` und werden aus `Warenkorb.php:517` gerufen — eine voellig
andere Kette, die diese Aenderung nicht beruehrt.

**Stueckzahl-Grenzfaelle** (mit eingeschalteter Formel, 200×85 cm):

| Aufruf | Ergebnis |
|---|---|
| `getPreis(1)` | 179,3339 |
| `getPreis(2)` | 170,3672 |
| `getPreis('3')` | 164,9872 (Text wird gelesen) |
| `getPreis(0)` | 179,3339 (wie 1 Stueck) |
| `getPreis(-5)` | 179,3339 |
| `getPreis('abc')` | 179,3339 |
| `getPreis(null)` | 179,3339 |

Die AJAX-Preisabfrage der Produktseite wurde zusaetzlich ohne `anzahl`,
mit `anzahl=0` und `anzahl=1` gegen das laufende System geprueft: immer
123,37 €, also kein Rueckschritt.

---

## 5. Ergebnis des Vergleichs PHP gegen JavaScript

### 5.1 Die 60 Sollwerte

`pruefe-formel.php` stellt `Preisformel::berechne()` gegen `SOLLWERTE.json`
(erzeugt aus `preisformel.js`, das gegen beide Mappen abgesichert ist: 61/61
und 40/40). Verglichen werden drei Werte je Fall — `vkProStueck` (G5),
`vkGesamt` (F5) und `ekGesamt` (H5) — bei einer Toleranz von **1e-6 relativ**.

```
Faelle geprueft: 60 von 60
Ergebnis: 60/60 — PHP rechnet identisch zu preisformel.js.
```

Abgedeckt sind: Mengen 1, 2, 5, 12, 35 (auch unterhalb und oberhalb jeder
Staffelstufe), Standardmass und Sondermass, mit und ohne Sonderform ohne Rand,
mit und ohne Sonderform mit Rand, mit und ohne Sonderfarbe sowie mehrere
Sonderfarben. **Keine einzige Abweichung**, auch nicht in der letzten Stelle.

Dazu zwei eigene Pruefreihen:

```
Preis-Korrektur:        11/11   ('', +5, 5, -5, +5%, 5%, -5%, 2,5%, 1,50, Unsinn, Leerzeichen)
Standardbreiten-Liste:   4/4
Mengenstaffel-Lesen:     7/7    (Komma- und Punktschreibweise, beliebige Reihenfolge, Faktor 0, Unsinn, leer)
```

### 5.2 Durch das echte System hindurch

Nicht nur die Klasse, sondern der ganze Weg bis zum angezeigten Preis.
Artikel 6, 200 × 85 cm, Formel eingeschaltet:

| Menge | Shop (`Artikel::getPreis`) | `preisformel.js` | Abweichung |
|---|---|---|---|
| 1 | 179,3339 | 179,3339 | 0 |
| 2 | 170,3672 | 170,3672 | 0 |
| 5 | 164,9872 | 164,9872 | 0 |
| 12 | 161,4005 | 161,4005 | 0 |
| 35 | 157,8138 | 157,8138 | 0 |

Und ueber die echte Shop-Seite: Formel an Artikel 459 (6300000) voruebergehend
eingeschaltet, 100 × 100 cm, Bruttoanzeige:

| Menge | Shop-Seite / AJAX | Bruecke (8787) | `preisformel.js` netto × 1,19 |
|---|---|---|---|
| 1 | 156,92 € | 156,92 € | 131,8632 × 1,19 = **156,92** |
| 5 | 144,36 € | 144,36 € | 121,3141 × 1,19 = **144,36** |
| 35 | 138,09 € | 138,09 € | 116,0396 × 1,19 = **138,09** |

Altsystem, Bruecke und Referenz stimmen auf den Cent ueberein. Artikel 459
wurde danach aus der vorher gezogenen Sicherung wiederhergestellt
(601 Zeichen, byteweise identisch, Seitenpreis wieder 123,37 €).

### 5.3 Keine Rueckschritte

| Pruefung | Ergebnis |
|---|---|
| `pruefe-preisformel.mjs` | **61/61** |
| `pruefe-preisformel-neu.mjs` | **40/40** |
| `pruefe-stammdaten.mjs` | bestanden |
| `pruefe-anfrage.mjs` | **98/98** |
| `ui-fuchsius-17-09.mjs` | **37/37** |
| `php -l` auf alle vier Dateien | keine Syntaxfehler (PHP 7.0.33) |
| PHP-Fehlerprotokoll des Containers | keine Warnungen, keine Notices |

---

## 6. Admin-Maske

**Ohne Anmeldung geprueft** (siehe Abschnitt 7), und zwar auf drei Wegen:

1. **Markup.** `getAdminForm()` direkt aufgerufen und das erzeugte HTML
   ausgewertet: alle 17 Feldnamen vorhanden, alle Beschriftungen deutsch,
   15 Platzhalter mit den Mappenwerten in deutscher Schreibweise (54,63 statt
   54.63), Tags ausgeglichen (24 `<tr>`/24 `</tr>`, 78 `<td>`/78 `</td>`,
   2 `<table>`, 1 `<fieldset>`). Der Schalter steht ohne Pflege auf „Nein“.
   Bild: `admin-maske.png`.
2. **Speichern.** `parseAdminPost()` mit einem echten `$_POST` aufgerufen —
   genau der Weg, den `AdminArtikelPage::presaveObject()` (Zeile 312) nimmt.
   Deutsche Kommazahlen („54,63“, „3,5“), Colortype-Wechsel und die
   Preis-Korrektur kommen richtig an; das bestehende Feld
   `input_squaremeter_price` bleibt unberuehrt.
3. **Speichern und neu laden ueber die Datenbank.** An einem Testartikel:
   `parseAdminPost()` + `save(true)` — so speichert die Maske einen
   bestehenden Artikel (`AdminNewListEditPage::saveObject`, Zeile 722).
   Danach den Artikel frisch aus der Datenbank geladen:

```
spezialoption_data in der DB: 848 Zeichen, PHP-serialize: ja, kein JSON
pf_aktiv            '1'                                               OK
pf_ek_qm            '54,63'                                           OK
pf_colortype        '1'                                               OK
pf_standardbreiten  '60, 75, 85, 115, 150, 200'                       OK
pf_mengenstaffel    '1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88'  OK
pf_korrektur        '+2,50'                                           OK
verlorene Felder: 0
Shop-Preis danach: n=1 181,8339 · n=5 167,4872 · n=35 160,3138
```

Die Werte stehen nach dem Neuladen noch da, und die Aenderung wirkt sofort auf
den Shop-Preis. Anschliessend den Schalter ueber denselben Weg auf „Nein“
gesetzt: Preis wieder **100,6400** — centgenau der Ausgangswert, die gepflegten
Werte bleiben erhalten.

---

## 7. Was nicht geprueft werden konnte

**Die echte Admin-Oberflaeche im Browser.** Mir liegen keine Zugangsdaten vor,
und ein eigenes Konto anzulegen oder die Anmeldung zu umgehen war
ausdruecklich untersagt. Ich habe deshalb nicht geraten und nichts gesucht.

Ersatzweise geprueft wurde, wie oben beschrieben: das erzeugte Formular-Markup,
der Speicherweg `parseAdminPost()` + `save(true)` ueber die Datenbank und das
Zurueckleksen. Damit ist der ganze Weg abgedeckt, den ein Klick in der Maske
nimmt — **nur der Klick selbst fehlt**.

> **Was Lukas noch tun kann** (fuenf Minuten): im Admin einen Artikel mit
> Spezialoption „spezial“ oeffnen, unten den Block „Preisformel (Excel-Mappe)“
> suchen, Schalter auf „Ja“, speichern, Seite neu laden — stehen die Werte noch
> da? Dann im Shop denselben Artikel aufrufen und die Menge aendern.
> Erwartet: der Preis sinkt ab 2, 3, 10, 20 und 30 Stueck.

**Weitere offene Punkte:**

* **Sonderform und Sonderfarbe haben im Altsystem keine Eingabefelder.**
  Die Formel wertet sie aus und `berechnePreisformel()` liest sie (Zeile 600),
  aber der Kunde kann sie im alten Shop nicht ankreuzen — es gibt dort kein
  solches Feld. Fuer die Rechnung heisst das: beide sind immer „nicht gesetzt“,
  der Preis also ohne diese Zuschlaege. Ob dafuer Felder gebaut werden sollen,
  ist eine Entscheidung des Auftraggebers und lag nicht im Auftrag
  („nur diese eine Formel, kein Umbau des Shops“).
* **Der Einkaufsaufschlag je Sonderfarbe** steht auf dem Mappenwert 50 €.
  Mappe sagt 50, der Auftraggeber nannte am 17.09.2026 muendlich 54.
  Das Feld ist pflegbar, die Entscheidung trifft er.
* **Die Mengenstaffel wirkt dort, wo die Menge bekannt ist**: Warenkorb
  (`WarenkorbArtikel::getNettoPreis`, gibt `getAnzahl()` weiter) und
  Produktseite (AJAX, jetzt mit `$anzahl`). In Listen- und Kategorieansichten
  gibt es keine Menge; dort gilt wie bisher ein Stueck.
* **`Artikel::save()` ohne Argument schlaegt fehl** — `Unknown column 'gewicht'
  in 'INSERT INTO'`. Das ist ein **bestehender Fehler des Altsystems**, keine
  Folge dieser Arbeit (nachgestellt an einem unveraenderten Bestandsartikel).
  Die Admin-Maske benutzt `save(true)` und ist davon nicht betroffen.

---

## 8. Aufgeraeumt

Alles, was beim Pruefen entstanden ist, wurde wieder entfernt.

| Was | Stand |
|---|---|
| Testartikel (`ZZ-PRUEF…`, IDs 804–807) | geloescht, `SELECT COUNT(*) … LIKE 'ZZ-PRUEF%'` → **0** |
| Hoechste Artikel-ID | **803** — wieder wie vor der Arbeit |
| Artikel mit `pf_`-Werten in der Datenbank | **0** |
| Artikel 459 (voruebergehend eingeschaltet) | aus der Sicherung wiederhergestellt, byteweise identisch, Seite wieder 123,37 € |
| Verwaiste Zeilen (`artikel_kategorien`, `artikel_dateien`, `artikel_attribute` mit `artikel_id > 803`) | **0** |
| Bestellungen heute | **0** (Gesamtzahl unveraendert 7.219) |
| Hilfsdateien im Webverzeichnis (`_*.php`) | alle geloescht, Verzeichnis sauber |

`POST /api/kasse/bestellen` wurde **in keiner Form** aufgerufen, weder gegen das
Livesystem noch lokal. Das Livesystem wurde nicht angefasst.

---

## 9. Dateien in diesem Ordner

| Datei | Zweck |
|---|---|
| `BAUBERICHT.md` | dieser Bericht |
| `pruefe-alles.sh` | **ein Aufruf fuer alle Pruefungen** (`sh pruefe-alles.sh`) |
| `pruefe-formel.php` | PHP gegen die 60 Sollwerte, dazu Korrektur und Zahlenlisten |
| `pruefe-funde.php` | **die fuenf Funde der Pruefer**, je ein Testfall (66 Pruefungen) |
| `messe-preise.php` | Rueckfall-Messung, 12 Artikel × 4 Faelle |
| `pruefe-durchgriff.php` | Admin-Wert bis Shop-Preis, ohne Datenbankschreiben |
| `pruefe-grenzfaelle.php` | Stueckzahl 0/negativ/Text, Formelfehler, kaputte Eingaben |
| `pruefe-admin-rundlauf.php` | Speichern und Lesen ueber die Datenbank am Testartikel |
| `MESSUNG-VORHER.txt` | die 48 Ausgangswerte, gemessen vor der ersten Aenderung |
| `admin-maske.png` | wie die neue Maske aussieht |
| `SOLLWERTE.json` | die 60 Faelle aus `preisformel.js` |
| `original/` | `SpezialoptionSpezial.php` und `Artikel.php` vor der Arbeit |

---

## 10. Nachbesserung nach drei unabhaengigen Pruefungen (02.10.2026)

Drei Pruefer haben die Arbeit unabhaengig nachgerechnet. Die Kernrechnung hielt
in allen drei Pruefungen stand (60/60, 388 Rueckfall-Proben, 34.800
Einzelvergleiche ueber alle 580 Artikel). Gefunden wurden **fuenf Fehler
zwischen Admin-Feld und Formel** — alle still, also ohne Fehlermeldung.
Alle fuenf sind behoben; jeder hat einen eigenen Testfall in
`pruefe-funde.php` (**66/66**).

### Fund 1 — Mengenstaffel ohne Leerzeichen: 20 % stiller Aufschlag

Das Komma ist in diesem Feld Trenner **und** deutsches Dezimalzeichen. Der alte
Ausdruck suchte „Zahl:Zahl" und las aus `1:1,2:0,95` die Stufe 1 mit dem
Faktor **1,2** — die „2" der naechsten Stufe wurde zur Nachkommastelle, Stufe 2
verschwand. Folge: Menge 1 kostete 126,59 € statt 105,49 €.

*Behoben* (`SpezialoptionSpezial::pruefeMengenstaffel`, Zeile 488): Die Paare
werden **zuerst eindeutig getrennt** — an jedem Komma, auf das eine Zahl mit
Doppelpunkt folgt — und erst danach als Zahl gelesen. Dazu drei Schranken:
Faktor ≤ 0 verworfen, **Faktor > 1 verworfen** (eine Staffel gibt Rabatt, kein
Aufschlag — faengt auch `1:100%, 2:95%` mit dem 100-fachen Preis ab), doppelte
Stufen gemeldet. Was nicht lesbar ist, wird nicht mehr still verworfen, sondern
erscheint als Mangel in der Maske.

### Fund 2 — Staffel ohne passende Stufe: 0,00 € bei `ok = true`

Begann die Staffel nicht bei 1 (z. B. `10:0,90, 20:0,89`), lieferte die Formel
fuer jede kleinere Menge **0,00 € mit `ok = true`** — der Artikel waere fuer
0 € in den Warenkorb gegangen. Excel-treu (FALSCH → 0), fuer einen Shop
untragbar.

*Behoben* an zwei Stellen:
* `Preisformel::berechne()` (Zeile 247) liefert jetzt `ok = false` mit dem Code
  `KEINE_STAFFELSTUFE` statt 0 — `getAufpreis()` faellt damit auf die alte
  Rechnung zurueck wie bei jedem anderen Formelfehler.
* `pruefeMengenstaffel()` **ergaenzt die fehlende Stufe 1 mit Faktor 1**. Das
  entspricht der Mappe: Q6 ist dort die Stufe ohne eigenen Faktor.
* Zusaetzlich am Ende von `berechne()` (Zeile 300) eine letzte Sicherung: ein
  Verkaufspreis ≤ 0 oder nicht endlich wird nie ausgegeben (`PREIS_NULL`).

### Fund 3 — Preis-Korrektur erzeugt negative Preise

`-200` bei 105,49 € ergab **−94,51 €**, `-150%` ergab −52,75 €. Ein Tippfehler
(`-200` statt `-20`) genuegte.

*Behoben* (`Preisformel::rechneKorrektur`, Zeile 316): Zoege die Korrektur den
Preis auf 0 oder darunter, greift sie **nicht** — es gilt die alte Rechnung,
und der Grund erscheint in der Admin-Maske. Die Exponentialschreibweise
(`1e2` = 100) wird nicht mehr als Zahl angenommen; im Admin ist das ein
Vertipper. `wendeKorrekturAn()` bleibt als einfache Form erhalten.

### Fund 4 — `ArtikelPage.php` wirkte auch ohne Schalter

Meine Aenderung reichte die Menge **immer** an `getPreis()` durch. Das betritt
ab Menge 2 auch den Zweig der **bestehenden** Preisstaffel
(`artikel_preisstaffeln`), die mit unserer Formel nichts zu tun hat. Heute ohne
Wirkung, weil kein Artikel eine Staffel hat — aber es verletzte die Zusage
„ohne Schalter aendert sich nichts". Mein urspruenglicher Kommentar
(„rechnet wie bisher") war schlicht falsch.

*Behoben* (`ArtikelPage.php`, Zeile 305): Die Menge geht nur noch durch, wenn
fuer **diesen** Artikel die Preisformel eingeschaltet ist; sonst wird wie
frueher ohne Argument gerufen.

```php
$pf_menge = 1;
try{
    $spezopt = $artikel->getSpezialoption();
    if($spezopt instanceof SpezialoptionSpezial and $spezopt->istPreisformelAktiv()){
        $pf_menge = $anzahl;
    }
} catch(Exception $e){ /* keine Spezialoption — bleibt bei 1 */ }
```

### Fund 5 — 115 cm galt nicht als Standardbreite (25 % zu teuer)

Der schwerste Fund. Das Altsystem haelt Masse in **Metern**; die Formel rechnet
auf Zentimeter zurueck. 115 cm liegen intern als 1,15 m, und 1,15 · 100 ergibt
im Gleitkomma **114,99999999999998…** — nicht 115. Der Vergleich auf Gleichheit
scheiterte, die Matte galt als Sondermass und kostete **Faktor 1,25 statt 1,0**.

60, 75, 85, 150 und 200 sind zufaellig exakt darstellbar, 114/115/116 nicht —
deshalb faellt es ohne gezielte Pruefung nicht auf. 115 cm steht aber in der
Breiten-Auswahlliste *und* als angebotene Standardgroesse „115 × 175 cm".
Geldwirkung laut Pruefer: 175 × 115 cm **+45,16 €**, 600 × 115 cm bei 2 Stueck
**+294,16 €**.

*Behoben* an beiden Enden:
* `SpezialoptionSpezial::berechnePreisformel()` (Zeile 820) rundet die
  Rueckrechnung auf hundertstel Millimeter: `round($this->getX() * $faktor, 4)`.
* `Preisformel::faktorBreiteFuer()` vergleicht nicht mehr mit `==`, sondern
  ueber `gleichesMass()` mit einer Toleranz von 0,001 cm (Zeile 118). Damit
  sind auch die Grenzen gegen Rollenbreite und Maximallaenge abgesichert.

Nachgemessen, genau wie der Shop rechnet (cm → m → cm):

| Mass | Faktor vorher | Faktor jetzt |
|---|---|---|
| 60 / 75 / 85 / 150 / 200 cm | 1,0 | **1,0** |
| **115 cm** | **1,25 (falsch)** | **1,0** |
| 114 / 116 / 175 cm | 1,25 | **1,25** (richtig, kein Standardmass) |

### Weitere Haertungen aus denselben Pruefungen

* **Tausenderpunkt.** `alsZahl('1.000')` ergab **1** statt 1000 — der
  EK-Listenpreis „1.000" haette mit 1 €/m² gerechnet. `1.234,56` ergab NULL und
  fiel **still auf die Vorgabe 54,63** zurueck; das Feld sah gefuellt aus.
  Jetzt werden deutsche und englische Schreibweise samt Tausendertrennern
  korrekt gelesen (`1.000` → 1000, `1.234,56` → 1234,56, `1,234.56` → 1234,56).
  Einheiten (`54,63 EUR`) und Exponenten (`5e3`) gelten als unlesbar — und
  werden gemeldet statt still ersetzt.
* **Standardbreiten.** `1.000, 2.000` ergab `[1, 2]` → Rollenbreite 2 cm → jede
  Matte „zu breit" → stiller Rueckfall. Jetzt `[1000, 2000]`; die neue
  `leseZahlenliste()` gibt zusaetzlich eine Maengelliste zurueck.
* **Ankreuzfelder.** `istGesetzt()` machte aus `"false"`, `"n"` und `"no"` ein
  **Ja** — scharf gestellt fuer den Tag, an dem es Felder fuer Sonderform und
  Sonderfarbe gibt (es haette still 68 € oder 30 % aufgeschlagen). Jetzt gelten
  nur noch `X`, `x`, `1`, `ja`, `wahr`, `true` und die echten Wahrheitswerte.
* **Rechenart `umf`.** Dort liefert `getFlaeche()` einen **Umfang**, keine
  Flaeche. Die Formel bricht jetzt mit `RECHENART_UMF` ab und ueberlaesst das
  Feld der bisherigen Umfangs-Rechnung, statt etwas Falsches auszurechnen.
  (Heute nutzt kein Artikel `umf`: 55 nutzen `varL`, 42 `custom`.)

### Der stille Rueckfall ist jetzt sichtbar

Der wichtigste Punkt aller drei Pruefungen: Der Rueckfall auf die alte Rechnung
ist richtig — er verdeckte aber **jeden** Konfigurationsfehler lautlos. Der
Auftraggeber saehe einen plausiblen alten Preis und wuesste nicht, dass seine
Formel gar nicht laeuft.

Neu ist deshalb `SpezialoptionSpezial::pruefePreisformel()` (Zeile 651), das
Gegenstueck zu `pruefeStammdaten()` in der JS-Referenz. Es prueft alle Felder
und zeigt das Ergebnis **direkt in der Admin-Maske**:

* **Rot**, wenn etwas nicht stimmt — mit je einem Satz in normalem Deutsch,
  z. B. *„Standardbreiten: der groesste Wert ist 7 cm. Er gilt zugleich als
  Rollenbreite — damit waere fast jede Matte ‚zu breit' und die Formel wuerde
  nicht rechnen."*
* **Gruen** sonst, mit einer **Probe-Rechnung**: *„Eine Matte 100 × 100 cm,
  1 Stueck, kostet mit diesen Werten 131,86 € netto."* So sieht der
  Auftraggeber schwarz auf weiss, ob seine Werte rechnen — und was.

Siehe `admin-maske.png`.

### Ergebnis der Nachbesserung

| Pruefung | Ergebnis |
|---|---|
| `pruefe-funde.php` (die fuenf Funde) | **66/66** |
| `SOLLWERTE.json` | **60/60**, unveraendert |
| Rueckfall (48 Messwerte) | **centgenau identisch** zu `MESSUNG-VORHER.txt` |
| Seitenpreise | **123,37 €** und **125,53 €**, unveraendert |
| `pruefe-preisformel.mjs` | **61/61** |
| `pruefe-preisformel-neu.mjs` | **40/40** |
| `pruefe-anfrage.mjs` | **98/98** |
| `ui-fuchsius-17-09.mjs` | **37/37** |
| `php -l`, PHP-Protokoll ueber HTTP | sauber, keine Warnungen |

### Offene Punkte, die nicht in meiner Hand liegen

* **`pf_korrektur` wirkt je Stueck**, nicht je Auftrag. Bei 3 Matten und „+5"
  kostet der Auftrag 15 € mehr. Das steht jetzt so in der Maske. Falls der
  Auftraggeber es je Auftrag will, ist das eine Entscheidung fuer ihn.
* **`getGrundPreis()` und die Lieferantenpreise** bekommen die Menge bewusst
  **nicht** durchgereicht. `grundpreis` ist der Vergleichspreis fuer ein Stueck;
  die Lieferantenpreise haben eigene Aufrufer (Rechnungen, Angebote,
  Umsatzauswertung), die keine Menge kennen. Haette ich die Menge dort
  durchgereicht, haetten sich Auswertungen geaendert, die mit der Formel nichts
  zu tun haben — das waere Fund 4 an anderer Stelle gewesen.
* **Rundungsunterschiede bis 6 Cent** zwischen Altsystem (rundet brutto je
  Stueck) und neuem Frontend (rundet netto vor der Steuer), z. B. 269,26 gegen
  269,27. Besteht unabhaengig von der Formel.
* **`GET /api/price` der Bruecke liefert falsche Preise** — `parseFrontendPost()`
  liest nur `$_POST`, die Bruecke ruft mit GET, die Masse kommen nie an und das
  Altsystem rechnet still mit 1 m × 1 m (gemessen: GET 112,19 € gegen POST
  774,14 €). **Das bestand schon vorher** und ist eine eigene Aufgabe — durch
  die Formel werden die Fehlbetraege aber groesser.
* **Das neue Frontend rechnet den Preis selbst** aus `daten.js` und fragt das
  Altsystem fuer die Anzeige nicht. Aendert der Auftraggeber im Admin den
  EK/m², aendert sich der Frontend-Preis **nicht**. Auch das ist eine eigene
  Aufgabe — es gehoert hierher, damit niemand von einem Durchgriff ausgeht,
  den es nicht gibt.

---

## 11. Zweite Nachbesserung — drei Fehler aus der Abnahme (02.10.2026)

Die Abnahme bestaetigte, dass die fuenf Funde aus Abschnitt 10 weg sind, fand
aber **drei neue Fehler**, die ich beim Haerten selbst eingebaut hatte.
Alle drei sind behoben, jeder mit Testfall. `pruefe-funde.php` steht jetzt bei
**101/101**.

### NEU 1 (schwer) — drei Nachkommastellen wurden 1000× zu gross

Mein Schutz gegen `1.000` (Tausenderpunkt) traf **genau die Werte der Mappe**:

| Eingabe | vorher | richtig |
|---|---|---|
| `1,931` (Salesfactor mehrfarbig) | **1931** | 1,931 |
| `1,728` (Salesfactor einfarbig) | **1728** | 1,728 |
| `54,630` | **54630** | 54,63 |
| `0,950` | **950** | 0,95 |

Die Regel lautete „Komma mit genau drei Folgeziffern = Tausendertrenner".
Damit wurde der Shop-Preis **tausendfach zu hoch** (131.863,16 € statt
131,86 €) — und **keine Pruefung schlug an**, weil 1931 eine gueltige Zahl
ist und `PREIS_NULL` nur zu kleine Preise faengt. Besonders aergerlich: Der
Platzhalter in der Maske zeigt den Vorgabewert `1,931`; tippt der Auftraggeber
ihn ab, laeuft er direkt hinein. (Dass in der Datenbank bei Artikel 459
`1,93` statt `1,931` stand, war genau dieses Problem — ich hatte es beim Bauen
umgangen, statt es zu sehen.)

*Behoben* (`Preisformel::loeseTrennzeichen`, Zeile 408) mit einer eindeutigen
Regel, die als Kommentar im Code steht:

> Kommt das Trennzeichen **genau einmal** vor, ist es das **Dezimalzeichen** —
> gleichgueltig, wie viele Ziffern folgen. Kommt es **mehrfach** vor, sind es
> Tausendertrenner (`1.234.567`), und jede Gruppe ausser der ersten muss drei
> Ziffern haben.

Punkt und Komma gemeinsam (`1.234,56`, `1,234.56`) bleiben eindeutig und
werden weiter korrekt gelesen. Der Preis dafuer: `1.000` ergibt **1,0** statt
Eintausend. Das ist die harmlosere Richtung — der Wert ist zu *klein*, faellt
im Probe-Preis sofort auf und wird von der neuen Plausibilitaetspruefung
gemeldet. In der Maske steht jetzt ausserdem: *„Zahlen bitte mit Komma
schreiben (1,931 · 54,63) und ohne Tausenderpunkt — also ‚1000', nicht
‚1.000'."*

**Alle 14 Mappenwerte nachgemessen** — 1,931 · 1,728 · 1,8 · 54,63 · 1,25 ·
1,3 · 1,5 · 68 · 50 · 0,88 · 0,89 · 0,9 · 0,92 · 0,95: **alle exakt.**
Probe durch den Shop: 100 × 100 cm ergibt **131,8632 €**, null Maengel.

### NEU 2 — nachlaufendes Komma verschluckte eine Staffelstufe

`1:1, 2:0,95,` ergab Faktor **95** und verlor die Stufe 2; ebenso `2:0,950`.
Verwandt: `1,5:0,95` erfand eine **Stufe 5**, die niemand eingetragen hatte.

*Behoben* (`pruefeMengenstaffel`, Zeile 497): Ein Komma am Ende wird entfernt,
und getrennt wird nur dort, wo links davon eine **vollstaendige** Stufe steht
(also eine mit Doppelpunkt). Zusaetzlich muss die Stueckzahl eine ganze Zahl
sein — `1,5:0,95` liefert jetzt **keine Stufe** und einen klaren Mangel.

| Eingabe | jetzt |
|---|---|
| `1:1, 2:0,95,` | 2⇒0,95 · 1⇒1 |
| `2:0,950` | 2⇒0,95 · 1⇒1 |
| `1,5:0,95` | keine Stufe, Mangel gemeldet |

### NEU 3 — Schalter EIN + alte Preisstaffel = doppelter Rabatt

`getAufpreis()` zog `getBasisPreis()` **ohne** Mengenargument ab, waehrend
`Artikel::getPreis($n)` ab Menge 2 `getBasisPreis($n)` aus der **bestehenden**
Preisstaffel (`artikel_preisstaffeln`) addiert. Die Differenz blieb als
zusaetzlicher, stiller Rabatt stehen (bei 25 Stueck −9,03 €).

*Behoben* (Zeile 1045): `$artikel->getBasisPreis($menge)` — mit derselben
Menge abziehen, mit der der Aufrufer addiert. Nachgestellt an einem
Testartikel mit echter Preisstaffel (`preisstaffel = 'absolut'`, Eintrag
10 Stueck → 20,00 €): der Shop-Preis entspricht jetzt exakt dem Formelwert.
Der Testartikel wird im Pruefskript selbst wieder geloescht.

### Plausibilitaetsbereiche je Feld

Damit ein verrutschtes Komma nicht wieder unbemerkt durchgeht, prueft
`pruefePreisformel()` jetzt zusaetzlich Spannen:

| Feld | sinnvoll |
|---|---|
| EK-Listenpreis je m² | 0,01 bis 10.000 € |
| Salesfactoren | 0,01 bis 100 |
| Sondermass, Sonderform | 0,01 bis 10 |
| Sonderfarbe VK/EK | 0 bis 10.000 € |
| Teuerungszuschlag | −100 bis 1.000 % |
| Mindestbreite / Maximallaenge | 1 bis 10.000 / 100.000 cm |

Meldung im Klartext, z. B.: *„Salesfactor mehrfarbig: 1931 liegt ausserhalb
des sinnvollen Bereichs (0,01 bis 100). Steht das Komma an der richtigen
Stelle?"* — damit faengt die Maske genau den Fehler ab, der NEU 1 war.

### Ergebnis

| Pruefung | Ergebnis |
|---|---|
| `pruefe-funde.php` | **101/101** |
| `SOLLWERTE.json` | **60/60** |
| Rueckfall (48 Messwerte) | **centgenau identisch** |
| Seitenpreise | **123,37 €** / **125,53 €** |
| 61/61 · 40/40 · 98/98 · 37/37 | alle bestanden |
| `php -l`, PHP-Protokoll | sauber |
| Webverzeichnis / Datenbank | keine `_*`-Datei (302 statt 200), 0 Artikel mit `pf_`, 0 Testartikel, hoechste ID 803, Artikel 459 unberuehrt |
