# Unabhängige Prüfung der Preisformel im Altsystem

Geprüft am 02.10.2026, eigener Messaufbau, ohne den Baubericht zu lesen.
Kein Produktivcode geändert. Prüfling: `php/Plugins/Katalog/Preisformel.php`
samt Anbindung in `SpezialoptionSpezial.php`, `Artikel.php`, `ArtikelPage.php`.
Referenz der Wahrheit: `Frontend/bridge-demo/public/preisformel.js`.

## Aufbau der Messung

Eigenes Gespann, unabhängig von `pruefe-*.php`/`pruefe-alles.sh`:

| Datei (Arbeitskopie, nicht im Projekt) | Zweck |
|---|---|
| `baue-faelle.mjs` | erzeugt 159 eigene Fälle |
| `lauf-js.mjs` | fährt sie durch `preisformel.js` |
| `lauf-php.php` | fährt sie durch `Preisformel.php`, **über stdin im Container** |
| `vergleiche.mjs` | vergleicht `vkProStueck`, `vkGesamt`, `ekGesamt` + 7 Zwischenwerte |
| `lauf-parser.php` | 37 Zahl-, 13 Listen-, 32 Korrektur-, 22 Flag-Proben |
| `lauf-staffel.php` / `-staffel2.php` | 22 Mengenstaffel-Texte, Preiswirkung |
| `lauf-e2e.php`, `lauf-490.php` | Durchgriff bis `getPreis()` auf echten Artikeln |
| `lauf-rueckfall2.php` | 388 Rückfall-Proben über alle 97 `spezial`-Artikel |

**Wichtig für die Aussagekraft:** PHP läuft mit `precision=14`, `json_encode`
rundet dadurch Gleitkommazahlen ab (`0.1+0.2` → `0.3`). Alle Zahlen werden
deshalb mit `sprintf('%.17g')` verlustfrei übergeben. Ohne das hätte die
Prüfung echte Abweichungen verschluckt und falsche erfunden.

## Ergebnis in Zahlen

| Messung | Fälle | stimmen |
|---|---|---|
| Eigene Fälle PHP ↔ JS | 159 | **146** (13 abweichend) |
| `SOLLWERTE.json` PHP ↔ JS | 60 | **60** |
| `SOLLWERTE.json` PHP ↔ hinterlegte Zahlen | 60 | **60** |
| Rückfall (Schalter aus) = Fläche × m²-Preis | 388 | **388** |
| Echter Artikel 490 gegen JS | 8 | **8** |

**Die Kernrechnung ist richtig.** Alle 60 Sollfälle und alle 8 Proben am
echten, im Admin gepflegten Artikel 490 stimmen auf die 14. Stelle. Deutsche
Zahlen (`39,06`, `1,931`, `1,25`) werden aus der Admin-Maske korrekt gelesen.
Der Rückfall ist in 388 von 388 Proben centgenau die alte Rechnung.

Die 13 Abweichungen liegen **nicht in der Arithmetik**, sondern in der
Annahme von Eingaben. Dazu kommen fünf Funde, die PHP und JS gleichermaßen
betreffen oder außerhalb des Vergleichs liegen — die sind die gefährlicheren.

---

## A — Abweichungen PHP gegen JS (13 Fälle)

### A1 · `istGesetzt()` macht aus „nein“ ein Ja (10 Fälle)

JS verlangt für die Ankreuzfelder exakt `"X"` (Excel-Semantik):

```js
function istGesetzt(v) {
  if (typeof v === 'string') return v.trim().toUpperCase() === 'X';
  return v === true || v === 1;
}
```

PHP nimmt **jede** Zeichenkette außer leer, `"0"` und `"NEIN"`:

```php
public static function istGesetzt($v){
    if(is_string($v)){
        $v = trim($v);
        return ($v !== '' and $v !== '0' and strtoupper($v) !== 'NEIN');
    }
    ...
}
```

Gemessen, Eingabe 50 × 200 cm, Menge 1:

| Eingabe | JS erwartet | PHP tatsächlich | Differenz |
|---|---|---|---|
| `sonderformOhneRand: "ja"` | 105,49053 | 137,13769 | **+31,65 €** |
| `sonderformOhneRand: "1"` | 105,49053 | 137,13769 | **+31,65 €** |
| `sonderformOhneRand: "true"` | 105,49053 | 137,13769 | **+31,65 €** |
| `sonderformOhneRand: "false"` | 105,49053 | 137,13769 | **+31,65 €** |
| `sonderformOhneRand: "n"` | 105,49053 | 137,13769 | **+31,65 €** |
| `sonderfarbe: "ja"` | 105,49053 | 173,49053 | **+68,00 €** |
| `sonderfarbe: "1"` | 105,49053 | 173,49053 | **+68,00 €** |
| `sonderfarbe: "true"` | 105,49053 | 173,49053 | **+68,00 €** |
| `sonderfarbe: "false"` | 105,49053 | 173,49053 | **+68,00 €** |
| `sonderfarbe: "n"` | 105,49053 | 173,49053 | **+68,00 €** |

Auch EK läuft auseinander (54,63 → 71,019 bzw. 104,63).

**Woran es liegt:** Bewusst weiter gefasst, aber in die falsche Richtung.
`"false"`, `"n"`, `"no"`, `"0,0"` und `"00"` ergeben in PHP **wahr**. Nur
das deutsche `"nein"` ist abgefangen. Das ist eine Falle, sobald die Brücke
oder ein künftiges Formularfeld `"false"`/`"no"` liefert — dann berechnet
der Shop stillschweigend 68 € Sonderfarbe oder 30 % Sonderform zu viel.

**Reichweite heute:** Noch nicht erreichbar, weil das Altsystem keine
Eingabefelder für Sonderform/Sonderfarbe hat (`berechnePreisformel()` liest
`sf_ohne`, `sf_mit`, `sonderfarbe` nur, *falls* gesetzt). Es ist eine
scharfe Falle für den Tag, an dem diese Felder kommen — und genau dafür
wurden sie schon angelegt.

### A2 · Colortype ohne gültigen Wert (3 Fälle)

| Eingabe | JS erwartet | PHP tatsächlich |
|---|---|---|
| `colortype: ""` | 0,00 (Salesfactor 0) | **200,43** (Salesfactor 1,931) |
| `colortype: 2.5` | 0,00 | **179,36** (Salesfactor 1,728) |
| `colortype: 1.0000001` | 0,00 | **200,43** (Salesfactor 1,931) |

**Woran es liegt:** JS vergleicht streng (`colortype === 1`), PHP castet
vorher: `(int) $colortype === 1`. Damit wird 1,0000001 → 1 und 2,5 → 2.
Bei `""` greift in PHP der Zweig „Colortype nicht mitgegeben“, es gilt der
Artikel-Colortype.

**Einschätzung:** Hier ist **PHP das vernünftigere Verhalten** (Excel liefert
bei unbekanntem Colortype 0 € Verkauf bei vollem Einkauf — eine negative
Marge). Es ist trotzdem eine Abweichung von der abgesicherten Referenz, und
die Referenz ist laut Auftrag maßgeblich. Entweder wird JS angepasst oder die
Abweichung bewusst dokumentiert.

**Reichweite heute:** Über die Admin-Maske **nicht erreichbar** —
`getPfColortype()` klemmt auf 1–3 und fällt sonst auf 1. Betrifft nur direkte
Aufrufer von `Preisformel::berechne()`, z. B. die Brücke.

---

## B — Funde, die PHP und JS gleichermaßen treffen (gravierender)

Diese erscheinen im Vergleich **nicht** als Abweichung, weil beide Seiten
denselben Fehler machen. Sie wirken aber direkt auf den Shop-Preis.

### B1 · Mengenstaffel ohne Leerzeichen: stiller Aufschlag von 20 %

Das Admin-Feld nimmt `"1:1, 2:0,95, 3:0,92, …"`. Das Komma ist Trenner **und**
Dezimalzeichen. `leseMengenstaffel()` sucht deshalb Paare per Regex. Lässt der
Auftraggeber die Leerzeichen weg — naheliegend, Excel-Nutzer tun das —
verrutscht die Zuordnung:

```
'1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88'   (richtig)
  → Stufe 1 = Faktor 1,00

'1:1,2:0,95,3:0,92,10:0,90,20:0,89,30:0,88'        (ohne Leerzeichen)
  → Stufe 1 = Faktor 1,2     ← die "2" aus "2:0,95" wird Nachkomma von "1"
  → Stufe 2 fehlt ganz
```

Gemessen am echten Artikel (50 × 200 cm, EK 54,63):

| Menge | richtig | ohne Leerzeichen | Differenz |
|---|---|---|---|
| 1 | 105,49 € | **126,59 €** | **+21,10 € (+20,0 %)** |
| 2 | 200,43 € | **253,18 €** | **+52,75 € (+26,3 %)** |
| 3 | 291,15 € | 291,15 € | 0,00 |
| ab 3 | — | — | 0,00 |

Der Regex `(\d+)\s*:\s*(\d+(?:[.,]\d+)?)` erlaubt beim Faktor Komma **und**
Punkt. Bei `1:1,2:…` ist `1,2` eine formal gültige Zahl — kein Fehler, keine
Meldung, 20 % Aufschlag auf jede Einzelmatte. Genau das Szenario, das der
Kommentar im Code verhindern wollte („Sonst würde aus `2:0,95` die Stufe 2
mit dem Faktor 0“); abgefangen ist nur der Faktor 0, nicht die Verschiebung.

**Vorschlag:** Faktor > 1 verwerfen oder melden (ein Staffelfaktor über 1 ist
kein Nachlass), und zusätzlich am Semikolon/Zeilenumbruch trennen anbieten.

### B2 · Staffel ohne passende Stufe: Preis 0,00 € bei `ok = true`

Liegt die Menge unter der kleinsten Schwelle, liefert Excel FALSCH → 0. Das
ist bewusst nachgebaut (`$staffelfaktor = $stufe ? … : 0`). Folge am echten
Artikel, Staffel `"30:0,88"`:

| Menge | `ok` | `vkGesamt` | `getPreis()` |
|---|---|---|---|
| 1 | **true** | **0,0000** | **0,0000** |
| 2 | **true** | **0,0000** | **0,0000** |
| 29 | **true** | **0,0000** | **0,0000** |
| 30 | true | 2784,95 | 92,83 |

Der Artikel wird für **0,00 €** in den Warenkorb gelegt, ohne Fehler, ohne
Hinweis. Erreichbar, sobald der Auftraggeber eine Staffel einträgt, die nicht
bei 1 beginnt — z. B. `"10:0,90, 20:0,89"`. Die Vorgabe beginnt bei 1, deshalb
tritt es mit leerem Feld nicht auf.

Excel-treu ist das; für einen Shop ist es gefährlich. `getAufpreis()` fängt
nur `ok == false` ab, nicht „Preis 0“. **Vorschlag:** Preis 0 ohne
Sonderfarbenaufschlag wie einen Fehler behandeln und auf die alte Rechnung
zurückfallen, oder beim Speichern verlangen, dass die Staffel eine Stufe ≤ 1
enthält.

### B3 · Preis-Korrektur erzeugt negative Preise

`wendeKorrekturAn()` prüft den Betrag nicht gegen den Preis. Gemessen am
echten Artikel (Grundpreis 105,49 €):

| Eingabe | `getPreis(1)` | Bewertung |
|---|---|---|
| `+5` | 110,49 € | richtig |
| `-5` | 100,49 € | richtig |
| `+5%` | 110,77 € | richtig |
| `-5%` | 100,22 € | richtig |
| `+5,5` | 110,99 € | richtig (Komma gelesen) |
| `0` / leer / `abc` / `+%` | 105,49 € | unverändert, richtig |
| **`-200`** | **−94,51 €** | **negativer Preis** |
| **`-150%`** | **−52,75 €** | **negativer Preis** |
| `-100%` | 0,00 € | Preis null |
| **`1e2`** | **205,49 €** | `is_numeric` akzeptiert Exponenten |

`abc`, `+%`, `%`, `-`, `+`, `+-5`, `5€` lassen den Preis korrekt unberührt —
die Absicht „lieber keine Korrektur als eine falsche“ ist umgesetzt. Aber
`-200` bei einem Preis von 105,49 € ergibt einen negativen Artikelpreis, der
ungeprüft in den Warenkorb wandert. Ein Tippfehler (`-200` statt `-20`)
genügt. **Vorschlag:** Ergebnis auf ≥ 0 klemmen und bei Unterschreitung
melden; `1e2` als Eingabeform ausschließen.

### B4 · `alsZahl()` verschluckt den Tausenderpunkt

| Eingabe | Ergebnis | Bewertung |
|---|---|---|
| `54,63` | 54,63 | richtig |
| `54.63` | 54,63 | richtig |
| `1 000,50` | 1000,5 | richtig |
| **`1.000`** | **1** | **Faktor 1000 zu klein** |
| **`1.234,56`** | **NULL** → Vorgabe greift | still auf Vorgabewert |
| `1.234` | 1,234 | Faktor 1000 zu klein |
| `54,63 EUR` | NULL → Vorgabe | still auf Vorgabewert |
| `5e3` | 5000 | Exponent akzeptiert |

`1.000` wird zu `1`. Trägt der Auftraggeber den EK-Listenpreis als `1.000`
ein (deutsche Schreibweise für tausend), rechnet der Shop mit **1 €/m²**.
Bei Beträgen über 999 € ist das realistisch. Dass `1.234,56` zu NULL wird und
damit **stillschweigend die Vorgabe 54,63** gilt, ist der heimtückischere Fall:
Das Feld sieht gefüllt aus, gerechnet wird mit etwas anderem.

Dieselbe Mechanik trifft `pf_min_breite`, `pf_max_laenge`, die Salesfactoren
und die Sonderfarbenbeträge.

### B5 · Standardbreiten: Komma als Dezimalzeichen zerlegt die Liste

`alsZahlenliste()` trennt an allem außer Ziffern und Punkt:

| Eingabe | Ergebnis | Bewertung |
|---|---|---|
| `60, 75, 85, 115, 150, 200` | `[60,75,85,115,150,200]` | richtig |
| `60;75;85` | `[60,75,85]` | richtig |
| `200, 60, 115` | `[60,115,200]` | richtig sortiert |
| **`60,5, 75`** | **`[5,60,75]`** | „60,5“ wird 60 **und** 5 |
| **`-60, 75`** | **`[60,75]`** | Vorzeichen verloren |
| **`1.000, 2.000`** | **`[1,2]`** | Rollenbreite wird 2 cm |
| `abc` / leer | `[]` → Vorgabe | still auf Vorgabe |

Der größte Wert ist zugleich die Rollenbreite. `1.000, 2.000` macht daraus
**2 cm** — danach ist jede Matte „zu breit“, die Formel scheitert, und
`getAufpreis()` fällt **stillschweigend auf die alte Rechnung** zurück. Der
Auftraggeber sieht einen plausiblen alten Preis und merkt nicht, dass seine
Formel gar nicht läuft.

### B6 · Der stille Rückfall verdeckt jeden Konfigurationsfehler

Gewollt laut Auftrag („ein Artikel soll nie ohne Preis dastehen“), aber er hat
eine Kehrseite: Jeder Fehler in den Stammdaten — zu kleine Rollenbreite,
Maß über `maxLaenge`, `minBreite` zu hoch — endet in `ok == false` und damit
im alten Preis, **ohne jede Spur**. Es gibt kein Log und keinen Hinweis in der
Admin-Maske. Die JS-Referenz hat dafür `pruefeStammdaten()` mit `maengel`/
`warnungen`; **in PHP fehlt diese Prüfung vollständig**.

**Vorschlag:** In der Admin-Maske neben dem Schalter anzeigen, was die Formel
mit den aktuellen Werten für ein Beispielmaß rechnet — oder ob sie scheitert.

---

## C — Was ich geprüft habe und in Ordnung ist

* **Alle Staffelgrenzen** (1, 2, 3, 9, 10, 19, 20, 29, 30, 31, 100): PHP = JS.
* **Maße genau auf Standardbreite**, in Breite *und* Länge, und knapp daneben
  (59/61, 74/76, 84/86, 114/116, 149/151, 199/201): PHP = JS, inklusive der
  Regel, dass **eine** passende Seite genügt.
* **Extremmaße** 20×20 (ZU_SCHMAL), 30×30, 200×700, 200×701 (ZU_LANG),
  201×700, 701×100, 0 und negativ: gleiche Fehlercodes in beiden.
* **Alle 12 Kombinationen** Sonderform ohne/mit Rand × Sonderfarbe 0/1/2:
  identisch, inklusive der Doppelung 1,3 × 1,5 = 1,95.
* **Sonderfarbenaufschlag fällt genau einmal je Auftrag an** — bei Menge 1, 2
  und 30 gegengerechnet, auch mit 2 Farben.
* **Mengen 0, negativ, Nachkomma** (0,5 / 2,999 / 10,0001 / −5): identisch.
* **`sonderfarbenAnzahl`** krumm (0 / 0,5 / 1,9 / 3,7 / −2 / `"2"` / `"2,5"`):
  identisch, Abrunden und Mindestwert 1 greifen gleich.
* **Rundung:** 12 Fälle mit entscheidender dritter Nachkommastelle, dazu
  200×700 bei Menge 100 und 199,99×699,99 bei Menge 99 — kein Unterschied über
  1·10⁻¹². Beide runden erst bei der Ausgabe, das ist richtig.
* **Colortype 1, 2, 3** und Admin-Werte `""`, `"0"`, `"4"`: `getPfColortype()`
  klemmt korrekt auf 1–3.
* **Mengenstaffel-Texte:** englische Punkte, Semikolon, Zeilenumbrüche,
  unsortierte Eingabe, `1:1,00`, Faktor 0 und negative Faktoren (beide
  korrekt verworfen), Prosa und `1=1` (korrekt leer → Vorgabe greift).
  Einzige Ausnahme: `1:100%, 2:95%` ergibt Faktoren 100/95 und damit den
  **100-fachen Preis** (20 043,20 € statt 200,43 €) — derselbe Mangel wie B1,
  deshalb dort als Vorschlag „Faktor > 1 verwerfen“ erfasst.
* **Durchreichen der Menge:** `getPreis($anzahl)` → `getOptionenPreis($anzahl)`
  → `getAufpreis($optionen, $anzahl)` greift. Alle Aufrufer geprüft, auch in
  `master/php/` und den anderen Spezialoptionen: Keiner arbeitet anders als
  vorher, weil der Parameter einen Vorgabewert hat. Der Warenkorb übergibt die
  Menge (`WarenkorbArtikel::getPreis()` → `getPreis($this->getAnzahl())`), die
  Staffel wirkt also in einer echten Bestellung.
* **`$anzahl = 0`** aus dem Request (`ArtikelPage` Zeile 261) führt nicht zur
  Division durch Null — `$anzahl > 0 ? $anzahl : 1` greift an beiden Stellen.
* **Maßzuordnung:** `breite = getY()`, `laenge = getX()` ist richtig. Geprüft
  bei Umrechnungsfaktor 100 **und** 1000 (Artikel 6 und 95): In beiden Fällen
  sieht die Formel Zentimeter. `x`/`y` liegen in Metern, weil
  `parseFrontendPost()` durch den Faktor teilt; die Rückrechnung passt.
* **Deutsche Zahlen aus dem Admin:** Am echten Artikel 490 gegengerechnet —
  `39,06`, `1,931`, `1,728`, `1,8`, `1,25`, `1,3`, `1,5` werden alle korrekt
  gelesen, acht Proben stimmen exakt mit JS.
* **Rückfall centgenau:** 388 Proben über alle 97 `spezial`-Artikel bei
  ausgeschaltetem Schalter, vier Maß-/Mengenkombinationen je Artikel —
  **alle** gleich „Fläche × m²-Preis“. Der Quelltextvergleich gegen
  `original/` zeigt zudem, dass im alten Zweig **nichts** entfernt wurde; die
  einzigen Änderungen sind erweiterte Signaturen und die `$fields`-Liste.
* **Keine Preisanzeige-Lücke:** `ArtikelPage` übergibt `$anzahl` an `getPreis`
  und `getOptionenPreis`. (`getGrundPreis()` in derselben Zeile kennt die Menge
  nicht — das war schon vorher so und betrifft nur den Vergleichspreis.)

---

## D — Zwei Hinterlassenschaften im System

Der Auftrag verlangt „Nichts im System hinterlassen“. Zwei Punkte offen —
**ich habe nichts davon entfernt**, das ist eine Entscheidung für Lukas:

1. **Artikel 490 (`6400201-Velourmatte`) hat die Preisformel eingeschaltet.**
   `pf_aktiv = 1`, vollständig gepflegt (EK 39,06 €, Staffel, Standardbreiten,
   Colortype 1). Das ist ein echter Artikel der lokalen Datenbank, kein
   Testartikel. Seine Preise ändern sich dadurch: 200 × 50 cm kostet jetzt
   **75,42 €** statt 64,51 € (alte Rechnung, 1 m² × 64,51 €) — **+16,9 %**.
   Gerechnet wird richtig, aber ob dieser Artikel umgestellt sein *soll*, hat
   der Auftraggeber nicht entschieden. Nur die lokale Kopie ist betroffen.

2. **`Backup/matten.de-2026-09-07/web/_pruef_unabhaengig.php`** liegt noch im
   Webverzeichnis (02.10., 20:24 — vor meinem Lauf, nicht von mir; nicht in
   Git). Über HTTP liefert sie 500, weil sie `$argv` braucht, also kein
   Datenabfluss. Sie lädt aber `php/config.php` mit den Zugangsdaten und
   gehört nicht in ein Webverzeichnis.

**Meine eigenen Dateien:** Für den Durchgriff musste ich kurzzeitig
Prüfskripte ins Webverzeichnis legen, weil `MeltingShop` die Plugins relativ
zum Skript sucht. Jede wurde im selben Befehl wieder gelöscht und das Fehlen
anschließend geprüft. Aktueller Stand: `ls` findet keine `_zz_pruef_opus_*`.
Die Datenbank ist unverändert — Prüfsumme über alle 580 Artikel samt
`spezialoption_data` vor und nach meinem Lauf identisch
(`18728b66f175d235f26c1dc039884433`). Keine Bestellung, keine Anfrage, kein
Artikel angelegt; `set()` schreibt nur in den Speicher (`DbObject::set`, kein
`save()`, kein `__destruct`).

---

## E — Was ich nicht prüfen konnte

* **Die Excel-Mappen selbst.** Ich habe gegen `preisformel.js` und
  `SOLLWERTE.json` gemessen, wie beauftragt. Ob die Referenz die Mappe richtig
  abbildet (61/61 und 40/40), habe ich **nicht** nachgerechnet — ich habe die
  Mappen nicht geöffnet. Stimmt die Referenz nicht, stimmt auch PHP nicht.
* **Die Admin-Maske im Browser.** Speichern, neu laden, Werte wieder da — das
  habe ich nicht geklickt. Ich habe den Weg über die Datenbank geprüft: Die
  `pf_*`-Werte von Artikel 490 liegen korrekt serialisiert in
  `spezialoption_data`, werden mit Komma gelesen und ergeben die richtigen
  Zahlen. Die Felder stehen in `parseAdminPost()`, der Mechanismus trägt.
  `strip_tags()` greift auf alle Felder; `<`/`>` in einem Zahlenfeld wäre
  stillschweigend entfernt — ungeprüft, weil praktisch belanglos.
* **Die Brücke zum neuen Frontend** (Port 8787) und die Anzeige im neuen
  Frontend. Nur das Altsystem gemessen.
* **Bestellstrecke.** Kein `POST /api/kasse/bestellen`, nicht beauftragt. Dass
  der Warenkorb die Menge übergibt, habe ich am Quelltext belegt, nicht durch
  eine echte Bestellung.
* **Nebenwirkungen auf die anderen Spezialoptionen** (`flaeche`, `umfang`,
  `laenge`, 169 Artikel) habe ich nur über die Signaturen und den Rückfalltest
  der 97 `spezial`-Artikel geprüft, nicht durch eigene Preismessung je Typ.
* **Gleitkomma über 10⁻¹² hinaus.** Mein Schwellwert ist relativ 1·10⁻¹².
  Unterschiede in der Multiplikationsreihenfolge unterhalb davon würde ich
  nicht sehen; für Centbeträge ist das ohne Belang.

---

## Urteil

**Die Rechnung stimmt** — in der Arithmetik, und das ist sauber belegt:
60/60 Sollfälle, 60/60 gegen die hinterlegten Zahlen, 8/8 am echten
gepflegten Artikel, 388/388 im Rückfall, und 146/159 eigener Angriffsfälle.
Die Excel-Eigenheiten (Sonderfarbe nur einmal, Sondermaß wenn keine Seite
passt, Staffel nach Stückzahl, FALSCH → 0) sind richtig nachgebaut. Deutsche
Zahlen funktionieren im Normalfall.

**Nicht robust ist die Annahme von Eingaben.** Kein Fund betrifft die Formel;
alle betreffen das, was zwischen Admin-Feld und Formel passiert. Drei davon
können still Geld kosten, ohne dass jemand es merkt — und „still“ ist hier
das Problem, nicht die Größe der Abweichung.

**Empfehlung:** B1, B2 und B3 vor einem Einsatz schließen, B4/B5 mit einer
Plausibilitätsmeldung versehen, und B6 durch eine Vorschau in der Admin-Maske
sichtbar machen. Erst dann ist das Feld für einen Nicht-Techniker gefahrlos.
