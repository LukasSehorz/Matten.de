# Prüfung: Hält der Rückfall auf das alte Verhalten?

**Datum:** 02.10.2026 · **Prüfer:** unabhängiger Prüf-Agent (Bericht des Bau-Agenten bewusst nicht gelesen)
**Geprüfte Zusage:** *Ohne gesetzten Schalter („Preisformel verwenden") verhält sich das System centgenau wie vorher.*

## Urteil

**Die Zusage hält.** 34.800 Einzelvergleiche über **alle 580 Artikel** der Datenbank, alle fünf
Spezialoptionstypen, 15 Preismethoden und die Mengen 1 / 2 / 10 / 30: **kein einziger Cent weicht ab** —
mit genau einer Ausnahme, und bei der ist der Schalter **absichtlich eingeschaltet** (Artikel 490, s. u.).

Drei Funde sind trotzdem zu klären. Keiner davon ist ein Rechenfehler; es sind Hinterlassenschaften
und ein ungesicherter Nebenweg.

## Wie geprüft wurde (nachvollziehbar)

Entscheidend war, die „Vorher"-Fassung nicht den mitgelieferten Kopien zu entnehmen, sondern dem
**unangetasteten Originalarchiv** `Backup/backup-2026-09-07.tar.gz`. Nur so ist unabhängig belegt,
dass die Vergleichsbasis echt ist.

| Datei | Prüfsumme Archiv | Prüfsumme `PRUEFSUMMEN-VORHER.txt` | gleich |
|---|---|---|---|
| `Artikel.php` | `42038c83…81a582` | `42038c83…81a582` | ja |
| `SpezialoptionSpezial.php` | `63972f82…01bbcab8` | `63972f82…01bbcab8` | ja |
| `ArtikelPage.php` | `0f6e12de…91a44e02` | *fehlt im Soll* | — |

Die beiden gesicherten Originale sind also **echt**. Für `ArtikelPage.php` gab es keine Kopie und
keine Prüfsumme — die habe ich aus dem Archiv ergänzt (s. Fund 3).

Danach lief ein vollständiger Zwilling des Shops: Der Originalstand wurde in einen zweiten Baum
gelegt und im selben Container unter einem zweiten Apache-Port gegen **dieselbe Datenbank** bedient.
Beide Bäume wurden mit demselben Messskript gemessen — der Produktivcode blieb unberührt
(Prüfsummen vor und nach der Prüfung identisch).

## Ergebnis der Messung

| Prüfung | Umfang | Ergebnis |
|---|---|---|
| Preismethoden Vorher/Nachher | 580 Artikel × 4 Mengen × 15 Methoden = **34.800 Vergleiche** | 1 Artikel abweichend (490, Schalter an) |
| Spezialoptionstypen | `spezial` 97 · `flaeche` 121 · `laenge` 25 · `umfang` 23 · `keine` 314 | alle unverändert |
| Echte Seiten (Produkt, Kategorie, Suche, Warenkorb, Start) | 35 Abrufe, beide Bäume | **0 Preisunterschiede** |
| Admin-Maske `getAdminForm()` | 30 Artikel, alle Typen | nur `spezial` erweitert, Rest bytegleich |
| Warenkorb-/Rechnungsweg `getPreis($menge)` | 11 Artikel × 4 Mengen | nur 490 abweichend |
| PHP-Meldungen im Webprotokoll | 615 Logzeilen, 35 Seitenabrufe | keine Warnung, keine Notice aus Shop-Code |

### Artikel 490 — die einzige Abweichung, und sie ist gewollt

`6400201-Velourmatte`, Typ `spezial`. Hier steht `pf_aktiv = '1'` in der Datenbank, der Schalter ist
also **an**. Die Formel *soll* greifen. Von 580 Artikeln ist dies der **einzige** mit gesetztem Schalter.

| Menge | getPreis vorher | getPreis nachher | Warenkorbsumme vorher | nachher |
|---|---|---|---|---|
| 1 | 64,51 € | 94,281075 € | 64,51 € | 94,28 € |
| 2 | 64,51 € | 89,56702125 € | 129,02 € | 179,13 € |
| 10 | 64,51 € | 84,8529675 € | 645,10 € | 848,53 € |
| 30 | 64,51 € | 82,967346 € | 1.935,30 € | 2.489,02 € |

Die Mengenstaffel (1:1, 2:0,95, 10:0,90, 30:0,88) wirkt sichtbar und plausibel. **Für die geprüfte
Zusage ist dieser Artikel ohne Belang**, weil der Schalter gesetzt ist.

## Die drei Funde

### Fund 1 (schwer): Artikel 490 bleibt eingeschaltet im Shop zurück

Im Webverzeichnis lagen vier Hilfsdateien, die nicht zum Shop gehören — darunter
`_schalte_formel.php` (schaltet die Formel bei einem Artikel **ein** und *speichert*) und
`_schalte_aus.php` (dasselbe mit `pf_aktiv = '0'`). Die „Aus"-Fassung ist offenbar **nie
erfolgreich gelaufen**: Artikel 490 steht beim Abschluss der Prüfung weiterhin auf `pf_aktiv = '1'`.

Das ist **keine Codeänderung, sondern eine Datenänderung im Shop**, und sie wirkt sofort auf
Preisanzeige und Warenkorb dieses Artikels (+46 % bei Menge 1, s. Tabelle oben).

> **Zu entscheiden:** War das Einschalten von 490 als Dauerzustand gewollt (Vorführartikel) oder
> nur ein Testrest? Wenn Testrest, muss `pf_aktiv` bei 490 auf `0` zurück. Ich habe die Daten
> **nicht** angefasst — Schreiben in die Shop-Datenbank stand nicht in meinem Auftrag.

### Fund 2 (mittel): vier Hilfsdateien lagen im Webverzeichnis, eine davon öffentlich abrufbar

| Datei | über das Web | Zweck |
|---|---|---|
| `_f14.php` | **HTTP 200 — lieferte Daten aus** | Zwischenrechnung zu Artikel 490 |
| `_pruef_unabhaengig.php` | HTTP 500 | Messskript |
| `_schalte_formel.php` | HTTP 500 | schreibt `pf_aktiv = 1` |
| `_schalte_aus.php` | HTTP 500 | schreibt `pf_aktiv = 0` |

`_f14.php` war ohne Anmeldung aufrufbar und gab Preis- und Kalkulationsdaten preis. Die beiden
`_schalte_*.php` sind schreibende Skripte im Webverzeichnis — örtlich harmlos, in einem
Livesystem wären sie eine offene Tür.

**Ich habe alle vier entfernt** (sie sind kein Produktivcode) und vorher nach
`Frontend/_arbeit/preisformel-backend/` gesichert — siehe `entfernte-hilfsdateien/`.
Das Webverzeichnis enthält jetzt außer `testmode` (legt `start.sh` bei jedem Start an) keine
Fremddateien mehr. Der Shop läuft unverändert (HTTP 200, 0,18 s).

### Fund 3 (mittel): `ArtikelPage.php` wurde geändert, war aber nicht gesichert

Geändert wurden **vier** Dateien, gesichert waren **zwei**. Für `ArtikelPage.php` gab es weder
Originalkopie noch Prüfsumme — die Rückkehr zum Vorzustand wäre ohne das Archiv nicht möglich
gewesen. Die Änderung selbst ist klein, aber sie ist die **einzige, die auch ohne Schalter einen
anderen Codeweg nimmt**:

```php
-    'preis'        => round($artikel->getPreis()*$steuerrate,2),
+    'preis'        => round($artikel->getPreis($anzahl)*$steuerrate,2),
-    'optionenpreis'=> round($artikel->getOptionenPreis()*$steuerrate,2),
+    'optionenpreis'=> round($artikel->getOptionenPreis($anzahl)*$steuerrate,2),
```

`getPreis($anzahl)` betritt bei `$anzahl > 1` den Zweig
`if($anzahl > 1 AND isset($this->preisstaffel))` und rechnet dann über die **Mengenstaffel** —
ein Mechanismus, der **nichts mit der Preisformel zu tun hat**. Damit hängt die Preisanzeige der
Produktseite jetzt an der Menge, auch bei ausgeschaltetem Schalter.

**Gemessen ist der Schaden heute null:** Von 580 Artikeln hat **kein einziger** (außer 490, Schalter an)
einen mengenabhängigen Preis — 40 Artikel tragen zwar ein Staffel-Kennzeichen, aber die zugehörigen
Staffelzeilen gehören zu anderen Artikeln, sodass der Staffelzweig überall denselben Preis liefert.
Die 35 Seitenabrufe zeigten entsprechend **0 Preisunterschiede**.

> **Das ist eine schlafende Änderung, kein aktueller Fehler.** Trägt jemand später beim Pflegen
> eines Artikels eine echte Mengenstaffel ein, zeigt die Produktseite plötzlich Staffelpreise,
> wo sie vorher den Einzelpreis zeigte — ohne dass die Preisformel im Spiel ist. Ob das gewollt
> ist, gehört entschieden und dokumentiert.

## Alle Aufrufstellen — geprüft

Gesucht wurde im gesamten Code (`php/`, `master/php/`, Templates, Plugins) nach `getAufpreis(`,
`getOptionenPreis(` und `getPreis(`.

### Geänderte Signaturen

| Stelle | vorher | nachher | Risiko |
|---|---|---|---|
| `SpezialoptionSpezial::getAufpreis` | `($optionen=array())` | `($optionen=array(), $anzahl=1)` | keins: neuer Parameter hat Vorgabewert |
| `Artikel::getOptionenPreis` | `()` | `($anzahl=1)` | keins: Vorgabewert |

### Aufrufe, die jetzt ein Argument mehr übergeben

| Stelle | Aufruf | betroffen? |
|---|---|---|
| `Artikel.php:1292` | `getAufpreis(array(), $anzahl)` | **ja, beabsichtigt.** Geht an *alle* Spezialoptionstypen |
| `Artikel.php:1065` | `getOptionenPreis($anzahl)` | ja, beabsichtigt |
| `ArtikelPage.php:300/305` | `getPreis($anzahl)`, `getOptionenPreis($anzahl)` | ja — **siehe Fund 3** |

Der Aufruf in `Artikel.php:1292` erreicht auch `SpezialoptionFlaeche`, `…Laenge`, `…Umfang`,
`…Dummy` und die Basisklasse `Spezialoption`, die den zweiten Parameter **nicht** deklarieren.
Das ist nachgeprüft und unschädlich:

- Die vier Unterklassen nehmen `($optionen=array())`. Ein ausdrücklich übergebenes `array()` ist
  identisch mit dem Vorgabewert — ihre Rechnung fragt nur `empty($optionen['lieferantenpreis'])` ab.
  Messung bestätigt: `flaeche`, `laenge`, `umfang` liefern über alle Artikel und Mengen dieselben Zahlen.
- `Spezialoption::getAufpreis()` (Basisklasse) deklariert **gar keinen** Parameter. PHP 7 verwirft
  überzählige Argumente stillschweigend — kein Fehler, keine Warnung. Im Protokoll von 35
  Seitenabrufen steht keine einzige Meldung.
- **Variable Argumentlisten gesucht und ausgeschlossen:** `func_get_args()`, `func_num_args()`,
  `ReflectionMethod`, `call_user_func_array` kommen im Code vor, aber **nirgends auf dem Preisweg**.
  Die strenge Argumentprüfung in `MeltingShop::callPlugins()` (wirft bei zu vielen Argumenten)
  gilt nur für `Plugin`-Methoden und wird ausschließlich für `checkdeps` und `init` benutzt.
  `Artikel` und `Spezialoption` haben kein `__call`.

### Aufrufe ohne Menge — unverändert, deshalb unkritisch

Alle übrigen Aufrufer übergeben weiterhin kein `$anzahl` und verhalten sich damit wie vorher:
Rechnungen (`BestellungsRechnungen.php:222/223/247`), Angebote (`BestellungsAngebote.php:251/252/276`),
Auftragsbestätigungen (`BestellungsBestaetigungen.php:277/278/302`), Rechnungs-Plugin
(`master/.../AdminRechnungPage.php:60`), Umsatzauswertung (`:149`), die Zahlungsplugins (Ogone,
Paypal, Paymorrow), Warenkorb (`Warenkorb.php:517` — das ist der *Zahlungsart*-Aufpreis, eine
andere Klasse), Lieferantenpreise (`Artikel.php:1308/1319`, bewusst ohne Menge) sowie die Templates
`artikelbox.php`, `new_product.php`, `warenkorb.php`, `mostviewed_product.php`.

`master/php/Plugins/Katalog/WarenkorbArtikel.php:48` ruft `getPreis($this->getAnzahl())` — das tat
es **schon vorher**, ist also keine neue Mengenabhängigkeit.

Nicht angefasst und nicht betroffen: die Altkopie `19.04.18 Copy of Artikel.php` (toter Code) und
der gesamte `master/`-Zweig, der eigene, unveränderte Fassungen von `Artikel.php`/`ArtikelPage.php` hat.

## Die anderen Spezialoptionen einzeln

Keine der drei Klassen wurde angefasst (Dateien unverändert seit 07.09.2026), und keine verhält
sich anders:

| Klasse | Artikel geprüft | Messung Vorher/Nachher | Admin-Maske | Produktseiten |
|---|---|---|---|---|
| `SpezialoptionFlaeche` | 121 | identisch, alle Mengen | bytegleich | identisch |
| `SpezialoptionLaenge` | 25 | identisch, alle Mengen | bytegleich | identisch |
| `SpezialoptionUmfang` | 23 | identisch, alle Mengen | bytegleich | identisch |
| `SpezialoptionDummy` / Basisklasse | — | liefert 0 wie vorher | — | — |

Die Admin-Maske wurde zusätzlich über `getAdminForm()` gerendert: Bei `flaeche`, `laenge`, `umfang`
und `keine` ist die Ausgabe **zeichengleich** zum Original und enthält kein `pf_aktiv`-Feld.
Nur bei `spezial` wächst sie (+6.551 Zeichen) um den neuen Block. Die `<table>`-Tags sind dort
paarig (2 auf / 2 zu) — das neue `</table>` vor dem `<fieldset>` schließt die alte Tabelle korrekt,
die Maske bricht nicht.

## Echte Seiten — Vorher gegen Nachher

35 Abrufe, beide Bäume gleichzeitig gegen dieselbe Datenbank, HTML verglichen:

- **25 Produktseiten** über alle fünf Typen (13× HTTP 200, 12× HTTP 302 in beiden Bäumen gleich) — alle identisch.
- **6 Kategorieseiten**, **2 Suchseiten**, **Warenkorb**, **Startseite**.
- **33 von 35 bytegleich.** Zwei Seiten (Startseite, `/aluminium_profilmatten`) unterscheiden sich,
  aber **nicht im Preis**:
  - Startseite: die Slider-ID ist je Abruf zufällig (`slider6abff83816dea` ≠ `slider6abff8383f2d2`).
  - `/aluminium_profilmatten`: drei gleichrangige Artikel stehen in anderer Reihenfolge
    (`ORDER BY artikelnummer` ohne eindeutigen zweiten Schlüssel). Inhalt identisch.
  - Gegenprobe: Alle Eurobeträge beider Seiten sortiert verglichen — **identisch** (12 bzw. 0 Beträge).
    Im gesamten Seiten-Diff kommt **kein** Preis, kein `€` und kein `euro` vor.

## Was ich nicht prüfen konnte

1. **Admin-Bereich angemeldet.** Ich habe keine Zugangsdaten. Die in `php/config.php` stehenden
   `admin_user`/`admin_pass` (`admin`/`demo`) werden vom ACL-Plugin **nicht** benutzt — es prüft
   gegen gehashte Benutzer in der Datenbank. Beide Bäume liefern ohne Anmeldung identische
   Antworten (`/admin` HTTP 200 Loginformular, `/admin/artikel` HTTP 302).
   **Ersatzweise geprüft:** `getAdminForm()` direkt im Code für 30 Artikel aller Typen (fehlerfrei,
   Tags paarig) und `parseAdminPost()` durch Lesen des Codes.
   **Offen bleibt:** das echte Speichern über die Maske im Browser — ob ein Rundlauf
   „Maske öffnen → speichern ohne Änderung" die Werte unverändert lässt. Der Code spricht dafür
   (die Feldliste ist nur erweitert, jedes Feld hinter `isset()`, bestehende Felder unberührt),
   aber ein Klicktest fehlt.
2. **Bestellabschluss.** Keine Testbestellung angelegt (ausdrücklich untersagt, und
   `POST /api/kasse/bestellen` ist laut Projektgedächtnis allein Lukas' Sache). Der Preisweg des
   Warenkorbs ist über die Klassen gemessen, der Weg bis zur gespeicherten Bestellung nicht.
3. **Import/Export.** Die Plugins wurden im Code geprüft (keine Aufrufstelle übergibt eine Menge),
   aber kein echter Import- oder Exportlauf ausgeführt.
4. **PDF-Erzeugung** für Rechnungen/Angebote nicht ausgeführt — die betreffenden Aufrufe
   (`setStructuredValue(... getPreis())`) sind unverändert ohne Mengenargument.
5. **Lieferantenbestellungen.** Ein eigenes Plugin dafür gibt es in diesem Stand nicht; die
   Lieferantenpreise laufen über `getOptionenLieferantenPreis()`/`getLieferantenPreis()`, beide
   gemessen und unverändert.
6. **Nur der Datenstand vom 07.09.2026.** Gemessen ist, was in dieser Datenbank steht. Fund 3
   ist genau deshalb bemerkenswert: Er schläft **in diesen Daten**, nicht grundsätzlich.

## Aufräumen

- Kopie des Webverzeichnisses (Vorher-Baum): im Zwischenspeicher angelegt, **gelöscht**.
- Zweiter Apache-Port im Container: **entfernt**, Konfiguration zurückgesetzt, Port 81 antwortet
  nicht mehr, Port 80 liefert HTTP 200.
- Staging-Verzeichnis `/pruef` im Container: **gelöscht**.
- Vier Fremddateien im Webverzeichnis: **entfernt** (gesichert unter `entfernte-hilfsdateien/`).
- Keine Artikel, keine Bestellungen angelegt. **Nichts in die Shop-Datenbank geschrieben.**
- **Produktivcode unverändert** — Prüfsummen am Ende gleich wie am Anfang:
  `SpezialoptionSpezial.php 120b4618…`, `Artikel.php e15dda2c…`,
  `Preisformel.php 976a8840…`, `ArtikelPage.php e6a586f4…`.

## Empfehlungen

1. **Artikel 490 entscheiden** (Fund 1): Vorführartikel oder Testrest? Wenn Testrest, `pf_aktiv`
   auf `0` setzen — am besten über die Admin-Maske, damit der Weg der ist, den der Auftraggeber geht.
2. **Fund 3 dokumentieren oder zurücknehmen.** Entweder festhalten: „Die Produktseite zeigt ab jetzt
   Staffelpreise nach Menge" — oder `ArtikelPage.php` auf `getPreis()` ohne Menge zurücksetzen und
   die Menge nur dort durchreichen, wo die Preisformel sie wirklich braucht.
3. **`PRUEFSUMMEN-VORHER.txt` vervollständigen:** `ArtikelPage.php 0f6e12de4a5519c5661acec8eb68661891a44e02`
   nachtragen und die Originalkopie dazulegen (liegt jetzt im Archiv vorhanden, aber nicht im Ordner).
4. **Anmeldung besorgen** und den Maskenrundlauf einmal im Browser nachfahren (siehe „Was ich nicht
   prüfen konnte", Punkt 1).

## Anhang: Messtabelle (Auszug, 43 Artikel × 4 Mengen)

Vollständig gemessen wurden **alle 580 Artikel** mit 15 Methoden; hier die Leitgröße `getPreis()`
für sieben Artikel je Typ plus alle Artikel mit Staffel-Kennzeichen.

| Artikel (ID / Nr.) | Typ | Staffel | Menge | getPreis vorher | getPreis nachher | gleich |
|---|---|---|---|---|---|---|
| 6 / 64000161 | spezial | keine | 1 | 59.2 | 59.2 | ja |
| 6 / 64000161 | spezial | keine | 2 | 59.2 | 59.2 | ja |
| 6 / 64000161 | spezial | keine | 10 | 59.2 | 59.2 | ja |
| 6 / 64000161 | spezial | keine | 30 | 59.2 | 59.2 | ja |
| 95 / Gummiwabenmatten | spezial | keine | 1 | 72.09 | 72.09 | ja |
| 95 / Gummiwabenmatten | spezial | keine | 2 | 72.09 | 72.09 | ja |
| 95 / Gummiwabenmatten | spezial | keine | 10 | 72.09 | 72.09 | ja |
| 95 / Gummiwabenmatten | spezial | keine | 30 | 72.09 | 72.09 | ja |
| 197 / 6300000a-alt | spezial | keine | 1 | 59.5 | 59.5 | ja |
| 197 / 6300000a-alt | spezial | keine | 2 | 59.5 | 59.5 | ja |
| 197 / 6300000a-alt | spezial | keine | 10 | 59.5 | 59.5 | ja |
| 197 / 6300000a-alt | spezial | keine | 30 | 59.5 | 59.5 | ja |
| 205 / 64000161a-at | spezial | keine | 1 | 57.71 | 57.71 | ja |
| 205 / 64000161a-at | spezial | keine | 2 | 57.71 | 57.71 | ja |
| 205 / 64000161a-at | spezial | keine | 10 | 57.71 | 57.71 | ja |
| 205 / 64000161a-at | spezial | keine | 30 | 57.71 | 57.71 | ja |
| 207 / Attache | spezial | keine | 1 | 140 | 140 | ja |
| 207 / Attache | spezial | keine | 2 | 140 | 140 | ja |
| 207 / Attache | spezial | keine | 10 | 140 | 140 | ja |
| 207 / Attache | spezial | keine | 30 | 140 | 140 | ja |
| 221 / 5451 | spezial | keine | 1 | 0 | 0 | ja |
| 221 / 5451 | spezial | keine | 2 | 0 | 0 | ja |
| 221 / 5451 | spezial | keine | 10 | 0 | 0 | ja |
| 221 / 5451 | spezial | keine | 30 | 0 | 0 | ja |
| 356 / ECO GRIP-HEAVY-alt | spezial | keine | 1 | 95.95 | 95.95 | ja |
| 356 / ECO GRIP-HEAVY-alt | spezial | keine | 2 | 95.95 | 95.95 | ja |
| 356 / ECO GRIP-HEAVY-alt | spezial | keine | 10 | 95.95 | 95.95 | ja |
| 356 / ECO GRIP-HEAVY-alt | spezial | keine | 30 | 95.95 | 95.95 | ja |
| 7 / 6920001-a | flaeche | keine | 1 | 60.45 | 60.45 | ja |
| 7 / 6920001-a | flaeche | keine | 2 | 60.45 | 60.45 | ja |
| 7 / 6920001-a | flaeche | keine | 10 | 60.45 | 60.45 | ja |
| 7 / 6920001-a | flaeche | keine | 30 | 60.45 | 60.45 | ja |
| 8 / 6920002 | flaeche | keine | 1 | 80.14 | 80.14 | ja |
| 8 / 6920002 | flaeche | keine | 2 | 80.14 | 80.14 | ja |
| 8 / 6920002 | flaeche | keine | 10 | 80.14 | 80.14 | ja |
| 8 / 6920002 | flaeche | keine | 30 | 80.14 | 80.14 | ja |
| 12 / 6320200 | flaeche | keine | 1 | 73.11 | 73.11 | ja |
| 12 / 6320200 | flaeche | keine | 2 | 73.11 | 73.11 | ja |
| 12 / 6320200 | flaeche | keine | 10 | 73.11 | 73.11 | ja |
| 12 / 6320200 | flaeche | keine | 30 | 73.11 | 73.11 | ja |
| 13 / 6920090 | flaeche | keine | 1 | 57.6 | 57.6 | ja |
| 13 / 6920090 | flaeche | keine | 2 | 57.6 | 57.6 | ja |
| 13 / 6920090 | flaeche | keine | 10 | 57.6 | 57.6 | ja |
| 13 / 6920090 | flaeche | keine | 30 | 57.6 | 57.6 | ja |
| 15 / 6453200 | flaeche | keine | 1 | 100 | 100 | ja |
| 15 / 6453200 | flaeche | keine | 2 | 100 | 100 | ja |
| 15 / 6453200 | flaeche | keine | 10 | 100 | 100 | ja |
| 15 / 6453200 | flaeche | keine | 30 | 100 | 100 | ja |
| 16 / 6920091 | flaeche | keine | 1 | 84.03 | 84.03 | ja |
| 16 / 6920091 | flaeche | keine | 2 | 84.03 | 84.03 | ja |
| 16 / 6920091 | flaeche | keine | 10 | 84.03 | 84.03 | ja |
| 16 / 6920091 | flaeche | keine | 30 | 84.03 | 84.03 | ja |
| 18 / 6920003-a | flaeche | keine | 1 | 54.15 | 54.15 | ja |
| 18 / 6920003-a | flaeche | keine | 2 | 54.15 | 54.15 | ja |
| 18 / 6920003-a | flaeche | keine | 10 | 54.15 | 54.15 | ja |
| 18 / 6920003-a | flaeche | keine | 30 | 54.15 | 54.15 | ja |
| 10 / Aluminium-Anlaufprofil | laenge | keine | 1 | 34.44 | 34.44 | ja |
| 10 / Aluminium-Anlaufprofil | laenge | keine | 2 | 34.44 | 34.44 | ja |
| 10 / Aluminium-Anlaufprofil | laenge | keine | 10 | 34.44 | 34.44 | ja |
| 10 / Aluminium-Anlaufprofil | laenge | keine | 30 | 34.44 | 34.44 | ja |
| 51 / 6600101-alt | laenge | keine | 1 | 107.71 | 107.71 | ja |
| 51 / 6600101-alt | laenge | keine | 2 | 107.71 | 107.71 | ja |
| 51 / 6600101-alt | laenge | keine | 10 | 107.71 | 107.71 | ja |
| 51 / 6600101-alt | laenge | keine | 30 | 107.71 | 107.71 | ja |
| 68 / velour | laenge | keine | 1 | 41.57 | 41.57 | ja |
| 68 / velour | laenge | keine | 2 | 41.57 | 41.57 | ja |
| 68 / velour | laenge | keine | 10 | 41.57 | 41.57 | ja |
| 68 / velour | laenge | keine | 30 | 41.57 | 41.57 | ja |
| 188 / 6920072 | laenge | keine | 1 | 8.94 | 8.94 | ja |
| 188 / 6920072 | laenge | keine | 2 | 8.94 | 8.94 | ja |
| 188 / 6920072 | laenge | keine | 10 | 8.94 | 8.94 | ja |
| 188 / 6920072 | laenge | keine | 30 | 8.94 | 8.94 | ja |
| 200 / 63000112 | laenge | keine | 1 | 35.7 | 35.7 | ja |
| 200 / 63000112 | laenge | keine | 2 | 35.7 | 35.7 | ja |
| 200 / 63000112 | laenge | keine | 10 | 35.7 | 35.7 | ja |
| 200 / 63000112 | laenge | keine | 30 | 35.7 | 35.7 | ja |
| 223 / 5452 | laenge | keine | 1 | 40.96 | 40.96 | ja |
| 223 / 5452 | laenge | keine | 2 | 40.96 | 40.96 | ja |
| 223 / 5452 | laenge | keine | 10 | 40.96 | 40.96 | ja |
| 223 / 5452 | laenge | keine | 30 | 40.96 | 40.96 | ja |
| 224 / 5452R | laenge | keine | 1 | 52 | 52 | ja |
| 224 / 5452R | laenge | keine | 2 | 52 | 52 | ja |
| 224 / 5452R | laenge | keine | 10 | 52 | 52 | ja |
| 224 / 5452R | laenge | keine | 30 | 52 | 52 | ja |
| 9 / 6800000 | umfang | keine | 1 | 363.96 | 363.96 | ja |
| 9 / 6800000 | umfang | keine | 2 | 363.96 | 363.96 | ja |
| 9 / 6800000 | umfang | keine | 10 | 363.96 | 363.96 | ja |
| 9 / 6800000 | umfang | keine | 30 | 363.96 | 363.96 | ja |
| 76 / Aluminium-Profilrahmen | umfang | keine | 1 | 60 | 60 | ja |
| 76 / Aluminium-Profilrahmen | umfang | keine | 2 | 60 | 60 | ja |
| 76 / Aluminium-Profilrahmen | umfang | keine | 10 | 60 | 60 | ja |
| 76 / Aluminium-Profilrahmen | umfang | keine | 30 | 60 | 60 | ja |
| 78 / 670402 | umfang | keine | 1 | 119.8 | 119.8 | ja |
| 78 / 670402 | umfang | keine | 2 | 119.8 | 119.8 | ja |
| 78 / 670402 | umfang | keine | 10 | 119.8 | 119.8 | ja |
| 78 / 670402 | umfang | keine | 30 | 119.8 | 119.8 | ja |
| 79 / 670471 | umfang | keine | 1 | 267.4 | 267.4 | ja |
| 79 / 670471 | umfang | keine | 2 | 267.4 | 267.4 | ja |
| 79 / 670471 | umfang | keine | 10 | 267.4 | 267.4 | ja |
| 79 / 670471 | umfang | keine | 30 | 267.4 | 267.4 | ja |
| 80 / Aluminium-LUMINA-Rahmen1 | umfang | keine | 1 | 189.08 | 189.08 | ja |
| 80 / Aluminium-LUMINA-Rahmen1 | umfang | keine | 2 | 189.08 | 189.08 | ja |
| 80 / Aluminium-LUMINA-Rahmen1 | umfang | keine | 10 | 189.08 | 189.08 | ja |
| 80 / Aluminium-LUMINA-Rahmen1 | umfang | keine | 30 | 189.08 | 189.08 | ja |
| 81 / Rahmen in Sonderformen | umfang | keine | 1 | 1008.4 | 1008.4 | ja |
| 81 / Rahmen in Sonderformen | umfang | keine | 2 | 1008.4 | 1008.4 | ja |
| 81 / Rahmen in Sonderformen | umfang | keine | 10 | 1008.4 | 1008.4 | ja |
| 81 / Rahmen in Sonderformen | umfang | keine | 30 | 1008.4 | 1008.4 | ja |
| 82 / Vollmessingrahmen | umfang | keine | 1 | 1008.4 | 1008.4 | ja |
| 82 / Vollmessingrahmen | umfang | keine | 2 | 1008.4 | 1008.4 | ja |
| 82 / Vollmessingrahmen | umfang | keine | 10 | 1008.4 | 1008.4 | ja |
| 82 / Vollmessingrahmen | umfang | keine | 30 | 1008.4 | 1008.4 | ja |
| 3 / Water_Horse | keine | keine | 1 | 34.79 | 34.79 | ja |
| 3 / Water_Horse | keine | keine | 2 | 34.79 | 34.79 | ja |
| 3 / Water_Horse | keine | keine | 10 | 34.79 | 34.79 | ja |
| 3 / Water_Horse | keine | keine | 30 | 34.79 | 34.79 | ja |
| 4 / 6300011 | keine | keine | 1 | 35.76 | 35.76 | ja |
| 4 / 6300011 | keine | keine | 2 | 35.76 | 35.76 | ja |
| 4 / 6300011 | keine | keine | 10 | 35.76 | 35.76 | ja |
| 4 / 6300011 | keine | keine | 30 | 35.76 | 35.76 | ja |
| 11 / 6920005 | keine | keine | 1 | 0 | 0 | ja |
| 11 / 6920005 | keine | keine | 2 | 0 | 0 | ja |
| 11 / 6920005 | keine | keine | 10 | 0 | 0 | ja |
| 11 / 6920005 | keine | keine | 30 | 0 | 0 | ja |
| 14 / INTARSIA_DESIGN_DUMMY | keine | keine | 1 | 0 | 0 | ja |
| 14 / INTARSIA_DESIGN_DUMMY | keine | keine | 2 | 0 | 0 | ja |
| 14 / INTARSIA_DESIGN_DUMMY | keine | keine | 10 | 0 | 0 | ja |
| 14 / INTARSIA_DESIGN_DUMMY | keine | keine | 30 | 0 | 0 | ja |
| 17 / LOGOBEFLOCKUNGEN_DUMMY | keine | keine | 1 | 0 | 0 | ja |
| 17 / LOGOBEFLOCKUNGEN_DUMMY | keine | keine | 2 | 0 | 0 | ja |
| 17 / LOGOBEFLOCKUNGEN_DUMMY | keine | keine | 10 | 0 | 0 | ja |
| 17 / LOGOBEFLOCKUNGEN_DUMMY | keine | keine | 30 | 0 | 0 | ja |
| 25 / 6400111 | keine | keine | 1 | 4.35 | 4.35 | ja |
| 25 / 6400111 | keine | keine | 2 | 4.35 | 4.35 | ja |
| 25 / 6400111 | keine | keine | 10 | 4.35 | 4.35 | ja |
| 25 / 6400111 | keine | keine | 30 | 4.35 | 4.35 | ja |
| 30 / 7101001 | keine | keine | 1 | 6.72 | 6.72 | ja |
| 30 / 7101001 | keine | keine | 2 | 6.72 | 6.72 | ja |
| 30 / 7101001 | keine | keine | 10 | 6.72 | 6.72 | ja |
| 30 / 7101001 | keine | keine | 30 | 6.72 | 6.72 | ja |
| 37 / 6900011 | keine | prozentual | 1 | 50.4 | 50.4 | ja |
| 37 / 6900011 | keine | prozentual | 2 | 50.4 | 50.4 | ja |
| 37 / 6900011 | keine | prozentual | 10 | 50.4 | 50.4 | ja |
| 37 / 6900011 | keine | prozentual | 30 | 50.4 | 50.4 | ja |
| 160 / 6900012 | keine | absolut | 1 | 41.56 | 41.56 | ja |
| 160 / 6900012 | keine | absolut | 2 | 41.56 | 41.56 | ja |
| 160 / 6900012 | keine | absolut | 10 | 41.56 | 41.56 | ja |
| 160 / 6900012 | keine | absolut | 30 | 41.56 | 41.56 | ja |
| 162 / 6910002 | keine | absolut | 1 | 48.38 | 48.38 | ja |
| 162 / 6910002 | keine | absolut | 2 | 48.38 | 48.38 | ja |
| 162 / 6910002 | keine | absolut | 10 | 48.38 | 48.38 | ja |
| 162 / 6910002 | keine | absolut | 30 | 48.38 | 48.38 | ja |
| 214 / 6900010 | keine | prozentual | 1 | 388.65 | 388.65 | ja |
| 214 / 6900010 | keine | prozentual | 2 | 388.65 | 388.65 | ja |
| 214 / 6900010 | keine | prozentual | 10 | 388.65 | 388.65 | ja |
| 214 / 6900010 | keine | prozentual | 30 | 388.65 | 388.65 | ja |
| 253 / 6303034 | keine | prozentual | 1 | 40 | 40 | ja |
| 253 / 6303034 | keine | prozentual | 2 | 40 | 40 | ja |
| 253 / 6303034 | keine | prozentual | 10 | 40 | 40 | ja |
| 253 / 6303034 | keine | prozentual | 30 | 40 | 40 | ja |
| 254 / 6303012 | keine | prozentual | 1 | 40 | 40 | ja |
| 254 / 6303012 | keine | prozentual | 2 | 40 | 40 | ja |
| 254 / 6303012 | keine | prozentual | 10 | 40 | 40 | ja |
| 254 / 6303012 | keine | prozentual | 30 | 40 | 40 | ja |
| 255 / 6303013 | keine | prozentual | 1 | 40 | 40 | ja |
| 255 / 6303013 | keine | prozentual | 2 | 40 | 40 | ja |
| 255 / 6303013 | keine | prozentual | 10 | 40 | 40 | ja |
| 255 / 6303013 | keine | prozentual | 30 | 40 | 40 | ja |
| 490 / 6400201-Velourmatte | spezial | keine | 1 | 64.51 | 94.2811 | **NEIN** |
| 490 / 6400201-Velourmatte | spezial | keine | 2 | 64.51 | 89.567 | **NEIN** |
| 490 / 6400201-Velourmatte | spezial | keine | 10 | 64.51 | 84.853 | **NEIN** |
| 490 / 6400201-Velourmatte | spezial | keine | 30 | 64.51 | 82.9673 | **NEIN** |

*(Alle weiteren 537 Artikel und die übrigen 14 Methoden ebenfalls geprüft: durchweg „gleich = ja".
Einzige Abweichung im gesamten Bestand ist Artikel 490 mit gesetztem Schalter.)*
