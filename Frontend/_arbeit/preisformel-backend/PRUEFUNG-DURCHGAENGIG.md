# Prüfung: Wirkt die Preisformel durchgängig bis ins neue Frontend?

**Datum:** 02.10.2026 · **Art:** unabhängige Gegenprüfung, ohne Kenntnis anderer Berichte
**Geprüft wurde ausschließlich lokal.** Das Livesystem wurde nicht berührt
(`MATTEN_UPSTREAM=http://localhost:8080`, Startbanner „ZIEL: LOKALES ALTSYSTEM" belegt).
Es wurde **kein Produktivcode geändert**.

## Kurzantwort

**Die Formel wirkt grundsätzlich durch alle Schichten — aber nicht fehlerfrei.**
Von 16 geprüften Konfigurationen stimmen 14 in allen erreichbaren Schichten überein.
Zwei scheitern, und zwar beide am **gleichen Rechenfehler bei der Standardbreite 115 cm**.
Dazu kommen zwei Wege, auf denen die Formel gar nicht ankommt (Preisabfrage per GET,
Längen über 200 cm im Frontend).

---

## 1 · Der geprüfte Artikel und sein Ausgangszustand

| | |
|---|---|
| Artikel | **ID 490**, `6400201-Velourmatte`, Urlkey `6400201-velourmatte` |
| Warum dieser | Er ist der Altsystem-Artikel hinter dem Frontend-Slug `designmatten-jetprint-velour` (Zuordnung aus `bau-net-daten.mjs`), also genau der Artikel, den auch der Bestandstest `ui-fuchsius-17-09.mjs` prüft |
| Spezialoption | `spezial`, Rechenart `varL` (Breite als Auswahlliste, Länge als freies Feld) |
| Steuer | Steuerklasse 1 → **19 %** (Tabelle `steuerregel`) |
| EK je m² | 39,06 € netto · VK je m² netto 64,51 € · brutto 76,77 € |

**Ausgangszustand von `spezialoption_data` (byteweise gesichert, vor jedem Eingriff):**

```
SHA1   8df57b9156c4c4767785137910d33824c9292637
MD5    3c1d80eabcdee0e8c99f9881dd36730e
Länge  586 Bytes
```

Gesichert wurde zusätzlich der **gesamte Datensatz** als `mysqldump --hex-blob`.

**Eingeschaltet wurde über `parseAdminPost()`** — also über denselben Weg, den die
Admin-Maske benutzt, mit deutschen Kommazahlen als Eingabe
(`pf_ek_qm = "39,06"`, `pf_mengenstaffel = "1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88"`).
Alle 17 Felder wurden korrekt gelesen; die Stammdaten kamen vollständig und mit
richtigen Zahlentypen zurück. Nach dem Einschalten wuchs der Datensatz von
586 auf **1187 Bytes** — die Werte liegen also wirklich in `artikel.spezialoption_data`.

---

## 2 · Derselbe Preis durch alle Schichten

Alle Beträge in Euro. **Maß ist Länge × Breite in cm.**
Der Shop zeigt **brutto**, die Formel rechnet **netto** — beides ist getrennt ausgewiesen.
Die Warenkorbzeile des Altsystems führt **Nettopreise** (Kleinunternehmer-unabhängig:
die Umsatzsteuer steht separat in der Korbsumme).

| Nr | Maß | Menge | Altsystem brutto ges. | Warenkorb netto ges. | Frontend brutto ges. | preisformel.js brutto / netto ges. | alle gleich? |
|---:|---|---:|---:|---:|---:|---|:--:|
| 1 | 100×75 cm | 1 | 67,32 | 56,57 | 67,32 | 67,32 / 56,57 | ja |
| 2 | 100×75 cm | 2 | 127,90 | 107,48 | 127,90 | 127,90 / 107,48 | ja |
| 3 | 100×75 cm | 3 | 185,79 | 156,13 | 185,79 | 185,79 / 156,13 | ja |
| 4 | 100×75 cm | 10 | 605,90 | 509,12 | 605,85 | 605,85 / 509,12 | ja |
| 5 | 100×75 cm | 20 | 1.198,20 | 1.006,92 | 1.198,23 | 1.198,24 / 1.006,92 | ja |
| 6 | 100×75 cm | 30 | 1.777,20 | 1.493,41 | 1.777,16 | 1.777,16 / 1.493,41 | ja |
| 7 | 120×60 cm | 1 | 64,62 | 54,31 | 64,63 | 64,62 / 54,31 | ja |
| 8 | 120×85 cm | 5 | 421,15 | 353,89 | 421,13 | 421,13 / 353,89 | ja |
| 9 | 200×150 cm | 1 | 269,27 | 226,27 | 269,26 | 269,27 / 226,27 | ja |
| 10 | 60×60 cm | 1 | 32,31 | 27,15 | 32,31 | 32,31 / 27,15 | ja |
| 11 | 300×85 cm | 12 | 2.471,88 | 2.077,20 | *Grenze 200 cm* | 2.471,87 / 2.077,20 | ja |
| 12 | 250×200 cm | 25 | 9.985,25 | 8.391,02 | *Grenze 200 cm* | 9.985,31 / 8.391,02 | ja |
| **13** | **175×115 cm** | **1** | **225,79** | **189,74** | **180,63** | **180,63 / 151,79** | **NEIN** |
| **14** | **600×115 cm** | **2** | **1.470,86** | **1.236,02** | *Grenze 200 cm* | **1.176,70 / 988,82** | **NEIN** |
| 15 | 40×60 cm | 4 | 79,28 | 66,62 | 79,28 | 79,27 / 66,62 | ja |
| 16 | 500×200 cm | 31 | 24.485,35 | 20.575,90 | *Grenze 200 cm* | 24.485,32 / 20.575,90 | ja |

**14 von 16 stimmen überein.** Die Abweichungen in den „ja"-Zeilen liegen bei
**maximal 6 Cent auf bis zu 24.485 €** (0,0002 %) und sind reine Rundungsunterschiede,
siehe Abschnitt 4.3.

Die Spalte „Frontend" fehlt in fünf Zeilen, weil das neue Frontend Längen über
200 cm verweigert (Abschnitt 4.2) — das ist kein Rechenunterschied, sondern eine
Grenze, die das Altsystem nicht kennt (dort gilt 700 cm).

---

## 3 · Die vier Schichten einzeln

### 3.1 Produktseite des Altsystems (localhost:8080)

Die Formel greift. Gemessen über `Artikel::getPreis($anzahl)` im Container,
mit frisch geladenem Artikel je Fall:

| Menge | netto je Stück | Staffelfaktor | brutto je Stück |
|---:|---:|---:|---:|
| 1 | 56,568645 | 1,00 | 67,32 |
| 2 | 53,740213 | 0,95 | 63,95 |
| 3 | 52,043153 | 0,92 | 61,93 |
| 10 | 50,911781 | 0,90 | 60,59 |
| 20 | 50,346094 | 0,89 | 59,91 |
| 30 | 49,780408 | 0,88 | 59,24 |

Das sind **centgenau** die Werte von `preisformel.js`. Die Mengenstaffel wird
also korrekt durch die Kette `getPreis($anzahl)` → `getOptionenPreis($anzahl)`
→ `getAufpreis($optionen, $anzahl)` durchgereicht.

### 3.2 Über die Brücke

**`GET /api/price` taugt nicht zur Preisprüfung — die Maße kommen dort nie an.**
Alle 16 Fälle lieferten denselben Preis je Mengenstufe (112,19 / 106,58 / 103,22 / …),
unabhängig von Breite und Länge.

Ursache (gefunden, nicht vermutet): `SpezialoptionSpezial::parseFrontendPost()`
liest ausschließlich **`$_POST`**:

```php
if(empty($_POST['spezialoption'][$this->getArtikel()->getId()]['spezial']))
    return;
```

Der Preis-Endpunkt wird aber über `$_REQUEST['getpricejson']` angesprochen
(`ArtikelPage.php:39`), und die Brücke ruft ihn mit **GET** auf. Die Maße werden
korrekt bis zum Altsystem transportiert (im Brückenprotokoll nachgelesen), dort
aber verworfen. Ohne Maße fällt das Altsystem auf `getXDefault()/getYDefault() = 1 m`
zurück und rechnet **stillschweigend 100 × 100 cm**.

Beleg per `curl` direkt gegen das Altsystem, gleiche Parameter, nur Methode getauscht:

| Länge | GET | POST |
|---|---|---|
| 75 cm | 112,19 € | 77,41 € |
| 200 cm | 112,19 € | 206,44 € |
| 600 cm | 112,19 € | 774,14 € |

**Dieser Mangel ist nicht neu und nicht von der Formel verursacht.** Mit
abgeschaltetem Schalter verhält sich GET genauso (immer 76,77 €, unabhängig vom Maß).
Er wird durch die Formel aber **teurer sichtbar**: vorher war der Fehlpreis
„Fläche 1 m² × m²-Preis", jetzt ist es „Formel auf 100 × 100 cm" — in beiden Fällen
falsch, aber der Betrag steigt.

**`GET /api/produkt`** liefert kein Preisfeld, sondern Formularbeschreibung und
Varianten. Die sechs Breiten der Auswahlliste stehen korrekt drin:
`60 | 75 | 85 | 115 | 150 | 200 cm`.

### 3.3 Warenkorb über die Brücke — hier wirkt die Formel vollständig

`POST /api/cart/add` mit `pfad` + `werte` reicht die echten Formularfelder per
**POST** durch. Damit kommen die Maße an, und die Warenkorbzeile zeigt den
Formelpreis. Die Maßangabe in der Zeile bestätigt es („Mattengröße: 75cm × 100cm").

**Mengenänderung über `POST /api/cart/menge`** (Position 100 × 75 cm):

| Menge | Korb netto je Stück | Korb Summe | preisformel.js netto je Stück | Summe soll | gleich? |
|---:|---:|---:|---:|---:|:--:|
| 1 | 56,57 | 56,57 | 56,568645 | 56,57 | ja |
| 2 | 53,74 | 107,48 | 53,740213 | 107,48 | ja |
| 3 | 52,04 | 156,13 | 52,043153 | 156,13 | ja |
| 10 | 50,91 | 509,12 | 50,911781 | 509,12 | ja |
| 20 | 50,35 | 1.006,92 | 50,346094 | 1.006,92 | ja |
| 30 | 49,78 | 1.493,41 | 49,780408 | 1.493,41 | ja |

**Alle sechs Staffelstufen greifen, auf den Cent.** Das ist der stärkste Beleg
dafür, dass die Formel bis in den Bestellweg trägt.

Über alle 16 Konfigurationen stimmt der Warenkorb **in allen 16 Fällen** mit dem
Altsystem überein — auch in den beiden Fehlerfällen, dort also gemeinsam falsch.

Danach `POST /api/cart/clear`: `count=0`, `gesamt=0,00 €`.

### 3.4 Neues Frontend `produkt.html` im Browser

Gemessen mit dem CDP-Treiber, Chrome headless auf Port 9222,
Seite `http://localhost:8787/net-neu/produkt.html?slug=designmatten-jetprint-velour`.

**Wichtiger Befund zur Architektur:** Das neue Frontend rechnet den angezeigten
Preis **selbst in JavaScript**, aus den Stammdaten in `window.NET`:

```
{"einkaufProQm":39.06,"salesFactor":1.931,
 "standardbreiten":[60,75,85,115,150,200],
 "sondermassFaktor":1.25,"singleColorFaktor":0.9}
```

Es fragt das Altsystem für die Anzeige **nicht**. Dass Altsystem und Frontend
übereinstimmen, ist deshalb kein Durchgriff, sondern **doppelte Pflege derselben
Zahlen an zwei Orten**. Ändert der Auftraggeber im Admin den EK/m², ändert sich
der Frontend-Preis **nicht** — die Werte in `daten.js` müssten neu gebaut werden.
Das ist der wichtigste strukturelle Fund dieser Prüfung.

**Mengenstaffel im Browser** (Feld `#input_quantity`, 100 × 75 cm,
`#price` zeigt die Gesamtsumme brutto):

| Menge | `#price` | je Stück | erwartet je Stück | sinkt? |
|---:|---:|---:|---:|:--:|
| 1 | 67,32 | 67,32 | 67,32 | — |
| 2 | 127,90 | 63,95 | 63,95 | ja |
| 3 | 185,79 | 61,93 | 61,93 | ja |
| 10 | 605,85 | 60,59 | 60,59 | ja |
| 20 | 1.198,23 | 59,91 | 59,91 | ja |
| 30 | 1.777,16 | 59,24 | 59,24 | ja |

**Der Stückpreis sinkt ab 2, 3, 10, 20 und 30 Stück wie gefordert**, und zwar
genau auf die Werte der Mappe. Keine Fehler in der Browser-Konsole.

### 3.5 `preisformel.js` über `node -e`

Als Referenz mit den Stammdaten des Artikels 490 gerechnet
(`ekListenpreisProQm: 39.06`, `colortype: 1`, Rest Vorgabe), Zuordnung wie in
`berechnePreisformel()`: `laenge = getX()`, `breite = getY()`.
Ergebnisse siehe Tabelle in Abschnitt 2.

---

## 4 · Die Abweichungen, mit Zahlen

### 4.1 Standardbreite 115 cm wird nicht erkannt — 25 % zu teuer (gravierend)

**Der einzige echte Rechenfehler, und er trifft echtes Geschäft.**

Das Altsystem hält `x` und `y` intern **in Metern** (`parseFrontendPost()` teilt
durch den Umrechnungsfaktor 100). `berechnePreisformel()` rechnet für die Formel
auf Zentimeter zurück (`getX() * 100`). Bei 115 cm überlebt dieser Umweg nicht:

```
115 cm → 1,15 m → 114,99999999999998578915 cm
```

`Preisformel::faktorBreiteFuer()` vergleicht mit `==` gegen die Standardbreiten.
114,9999… ist nicht 115, also gilt die Matte als Sondermaß und bekommt den
Faktor **1,25** statt **1,0**.

Von den sechs Standardbreiten ist **genau 115 cm betroffen**, die anderen fünf
überleben die Umrechnung exakt:

| Breite | cm → m → cm | gleich? |
|---:|---|:--:|
| 60 | 60,00000000000000000000 | ja |
| 75 | 75,00000000000000000000 | ja |
| 85 | 85,00000000000000000000 | ja |
| **115** | **114,99999999999998578915** | **NEIN** |
| 150 | 150,00000000000000000000 | ja |
| 200 | 200,00000000000000000000 | ja |

**Nachweis über die echte Preisabfrage** (POST, Länge 600 cm, Menge 2, brutto je Stück) —
bei einer korrekt erkannten Standardbreite müsste der Preis bei 115 cm **fallen**,
er steigt aber gleichmäßig weiter:

| Breite | gemessen | Faktor laut Messung | soll |
|---:|---:|---:|---:|
| 114 cm | 729,04 | 1,25 (richtig, kein Standardmaß) | 729,04 |
| **115 cm** | **735,43** | **1,25 (falsch)** | **588,35** |
| 116 cm | 741,83 | 1,25 (richtig) | 741,83 |
| 150 cm | 767,41 | 1,00 (richtig) | 767,41 |

Bei 150 cm greift der Nachlass sichtbar — bei 115 cm nicht.

**Geldwirkung an den zwei gemessenen Fällen:**

| Fall | Altsystem | richtig | zu viel | zu viel in % |
|---|---:|---:|---:|---:|
| 175×115 cm, 1 Stück (brutto) | 225,79 € | 180,63 € | **+45,16 €** | +25,0 % |
| 600×115 cm, 2 Stück (brutto) | 1.470,86 € | 1.176,70 € | **+294,16 €** | +25,0 % |

**Warum das zählt:** 115 cm ist keine exotische Eingabe. Es steht in der
Breiten-Auswahlliste des Artikels (eine von sechs Möglichkeiten), **und** als
angebotene Standardgröße **„115cm x 175cm"** in der Größenliste. Ein Kunde, der
diese angebotene Größe wählt, zahlt 25 % zu viel. Das neue Frontend rechnet an
derselben Stelle richtig (180,63 €), weil es in Zentimetern bleibt — Altsystem
und Frontend widersprechen sich also im Kundengespräch um 45,16 €.

**Das trifft nicht nur Artikel 490.** Die Ursache sitzt in `berechnePreisformel()`
in `SpezialoptionSpezial.php` und wirkt bei **jedem** Artikel, dessen Standardbreiten
einen Wert enthalten, der sich nicht verlustfrei durch 100 teilen lässt.

### 4.2 Das neue Frontend kennt andere Grenzmaße als das Altsystem

| Grenze | Altsystem / Mappe | neues Frontend |
|---|---|---|
| größte Länge | **700 cm** (`maxL`, `maxLaenge`) | **200 cm** („Länge höchstens 200 cm — bitte kleiner wählen.") |
| kleinste Breite | **30 cm** (`minL`, `minBreite`) | **40 cm** („Breite mindestens 40 cm — bitte größer wählen.") |

Fünf der 16 Konfigurationen (Nr. 11, 12, 14, und bei 45×33 cm auch die
Mindestbreite) konnten im Frontend deshalb **gar nicht** geprüft werden,
obwohl Altsystem und Mappe sie anstandslos rechnen. Ein Kunde, der im Altsystem
eine 300-cm-Matte bestellen kann, bekommt sie im neuen Frontend verweigert.

Die 40 cm sind im Bestandstest `ui-fuchsius-17-09.mjs` fest verdrahtet
(`{ minBreite: 40, … }`), die Mappe sagt 30. Welcher Wert gilt, ist eine
offene Frage an den Auftraggeber — in `preisformel.js` ist sie als solche
bereits vermerkt („matten.de führt Mindest X = 40, die Mappe B6 = 30").

### 4.3 Rundung: bis zu 6 Cent, systematisch und erklärbar

In den 14 übereinstimmenden Fällen bleiben kleine Unterschiede:

| Vergleich | größte Abweichung | wo |
|---|---:|---|
| Altsystem ↔ preisformel.js (brutto Gesamt) | **5,87 Cent** | 250×200 cm, 25 Stück (9.985,25 statt 9.985,31) |
| Frontend ↔ preisformel.js (brutto Gesamt) | **0,70 Cent** | 100×75 cm, 20 Stück |
| Warenkorb ↔ preisformel.js (netto Gesamt) | **0,48 Cent** | 40×60 cm, 4 Stück |

Ursachen, beide harmlos aber unterschiedlich:

* **Altsystem:** es rundet den **Bruttopreis je Stück** auf 2 Stellen und
  multipliziert dann mit der Menge. Bei 25 Stück vervielfacht sich der
  Rundungsrest. Die Formel rundet erst am Ende.
* **Frontend:** es rundet den **Nettobetrag** auf 2 Stellen, bevor es die
  Steuer aufschlägt. Beispiel 200×150 cm: netto exakt 226,27458 →
  Frontend 226,27 → brutto **269,26**; Altsystem rechnet durch → **269,27**.
  Ein Cent Unterschied im Schaufenster.

Das ist kein Rechenfehler, aber es heißt: **Altsystem und neues Frontend zeigen
nicht immer denselben Cent.** Für eine Rechnung muss entschieden werden, welche
Stelle rundet.

### 4.4 Die Menge erreicht zwei Preiswege nicht

`Artikel::getOptionenPreis($anzahl)` bekommt die Menge, aber drei Wege rufen
weiterhin ohne sie auf:

| Stelle | Aufruf | Folge |
|---|---|---|
| `Artikel.php:1125` `getGrundPreis()` | `getOptionenPreis()` | bleibt auf dem Preis für 1 Stück |
| `Artikel.php:1308` `getLieferantenOptionenPreis()` | `getAufpreis(array('lieferantenpreis'=>1))` | Einkaufspreis ohne Mengenstaffel |
| `Artikel.php:1319` `getOptionenLieferantenPreis()` | dito | dito |

Gemessen (100 × 75 cm, Formel an):

| Menge | `getPreis()` | `getGrundPreis()` | `getLieferantenPreis()` |
|---:|---:|---:|---:|
| 1 | 56,5686 | 56,5686 | 29,2950 |
| 10 | 50,9118 | **56,5686** | **29,2950** |
| 30 | 49,7804 | **56,5686** | **29,2950** |

`grundpreis` wird in der Preis-JSON an das Frontend ausgeliefert
(`ArtikelPage.php:306`) und ist dort ab 2 Stück zu hoch. Beim Einkaufspreis
ist der fehlende Durchgriff fachlich sogar richtig (die Mappe kennt im Einkauf
keine Mengenstaffel, alle Zweige liefern Q5) — aber dann sollte es dort stehen,
damit niemand es später „reparierend" verschlimmert.

### 4.5 Kleinere Funde am Rand

* **Breiten außerhalb der Auswahlliste werden stillschweigend ersetzt.** Gibt man
  90 cm, 40 cm oder 33 cm als Breite an, nimmt das Altsystem **60 cm** und
  berechnet eine andere Matte als bestellt (Warenkorbzeile zeigt dann
  „Mattengröße: 60cm × 120cm" bei angefragten 90 cm). Das ist Verhalten der
  Auswahlliste, nicht der Formel — aber es verfälscht jeden Preisvergleich,
  der mit freien Breiten arbeitet.
* **Die Warenkorbzeile beschriftet die Breite falsch.** Im Attributtext steht
  `Breite: 60 cm`, während `Mattengröße: 75cm × 100cm` die tatsächlich
  berechnete Breite nennt. Zwei Angaben, die sich widersprechen.
* **Achsen-Zuordnung ist verwirrend, aber hier folgenlos.** Der Artikel beschriftet
  `desc_x = "Länge"`, `desc_y = "Breite"`, und `berechnePreisformel()` folgt dem
  (`laenge = getX()`). Im `varL`-Formular trägt das Feld `x` jedoch die
  **Breiten**-Auswahlliste. Für Fläche und Standardbreitenprüfung ist das
  symmetrisch und fällt nicht auf; für `minBreite` / `maxLaenge` kann es
  auffallen. Sollte vor dem Livegang einmal bewusst festgelegt werden.
* **`alsZahlenliste()` sortiert aufsteigend.** Dadurch ist der größte Wert immer
  der letzte, und `rollenbreiteFuer()` liefert verlässlich die Rollenbreite —
  auch wenn der Auftraggeber „200, 60, 85" in beliebiger Reihenfolge einträgt.
  Das ist gut gelöst und bewusst erwähnt, weil es leicht hätte schiefgehen können.
* **Die Mengenstaffel-Eingabe ist gegen das Komma-Problem abgesichert.** Der
  Text „2:0,95" wird nicht am Komma zerlegt, sondern paarweise gelesen
  (`preg_match_all`). Ein Faktor 0 wird verworfen statt den Preis auf null zu
  setzen. Beides geprüft und in Ordnung.

---

## 5 · Rückfall: Verhält sich der Artikel ohne Schalter wie vorher?

**Ja, centgenau in allen 14 gemessenen Fällen.** Gemessen vor dem Einschalten
und nach dem Ausschalten, mit demselben Skript:

| Nr | Maß | Menge | vorher netto/Stück | nach Ausschalten | brutto Gesamt vorher | nachher | identisch |
|---:|---|---:|---:|---:|---:|---:|:--:|
| 1 | 100×75 | 1 | 48,3825 | 48,3825 | 57,58 | 57,58 | ja |
| 2 | 100×75 | 2 | 48,3825 | 48,3825 | 115,16 | 115,16 | ja |
| 3 | 100×75 | 3 | 48,3825 | 48,3825 | 172,74 | 172,74 | ja |
| 4 | 100×75 | 10 | 48,3825 | 48,3825 | 575,80 | 575,80 | ja |
| 5 | 100×75 | 20 | 48,3825 | 48,3825 | 1.151,60 | 1.151,60 | ja |
| 6 | 100×75 | 30 | 48,3825 | 48,3825 | 1.727,40 | 1.727,40 | ja |
| 7 | 120×90 | 1 | 69,6708 | 69,6708 | 82,91 | 82,91 | ja |
| 8 | 120×90 | 5 | 69,6708 | 69,6708 | 414,55 | 414,55 | ja |
| 9 | 200×150 | 1 | 193,53 | 193,53 | 230,30 | 230,30 | ja |
| 10 | 60×40 | 1 | 15,4824 | 15,4824 | 18,42 | 18,42 | ja |
| 11 | 300×85 | 12 | 164,5005 | 164,5005 | 2.349,12 | 2.349,12 | ja |
| 12 | 250×200 | 25 | 322,55 | 322,55 | 9.595,75 | 9.595,75 | ja |
| 13 | 45×33 | 1 | 9,579735 | 9,579735 | 11,40 | 11,40 | ja |
| 14 | 600×115 | 2 | 445,119 | 445,119 | 1.059,38 | 1.059,38 | ja |

Auch über die Brücke: 76,77 € — genau der Wert aus `PREISE-VORHER.txt`.
Der Schalter trägt also wirklich, und der Rückweg ist sauber.

---

## 6 · Bestandstests (keine Rückschritte)

| Test | gefordert | Ergebnis |
|---|---|---|
| `pruefe-preisformel.mjs` | 61/61 | **61/61 bestanden** — „rechnet in allen 61 Fällen genau wie PREISE-Brian-26-10_22-11.xlsx" |
| `pruefe-preisformel-neu.mjs` | 40/40 | **40/40 bestanden** — „genau wie 1PREISE-Brian_Sehorz-26-09-30_18-55.xlsx" |
| `pruefe-anfrage.mjs` | bestehen | **98/98 bestanden** — „Der Anfrage-Weg wird erkannt, die Sperren bleiben." |
| `ui-fuchsius-17-09.mjs designmatten-jetprint-velour` | 37/37 | **37/37 bestanden**, keine Fehler in der Browser-Konsole |
| `pruefe-stammdaten.mjs` (zusätzlich) | — | bestanden |

Kein Rückschritt.

---

## 7 · Aufräumen — belegt mit Zahlen

### 7.1 Der geänderte Artikel

| | vorher | nachher | gleich? |
|---|---|---|:--:|
| `spezialoption_data` SHA1 | `8df57b9156c4c4767785137910d33824c9292637` | `8df57b9156c4c4767785137910d33824c9292637` | **ja** |
| `spezialoption_data` MD5 | `3c1d80eabcdee0e8c99f9881dd36730e` | `3c1d80eabcdee0e8c99f9881dd36730e` | **ja** |
| Länge in Bytes | 586 | 586 | **ja** |

Zusätzlich wurde der **ganze Datensatz** vorher und nachher als
`mysqldump --hex-blob` gezogen und verglichen. Der einzige Unterschied ist der
Aufrufzähler `angesehen` (**20406 → 20408**) — zwei Seitenaufrufe durch diese
Prüfung selbst. Kein Preis-, Stammdaten- oder Optionsfeld wurde verändert.

Wiederhergestellt wurde **byteweise** über `UPDATE … SET spezialoption_data = UNHEX(…)`
aus dem vorab gezogenen HEX-Abzug, nicht durch Zurückschreiben über die Oberfläche.

### 7.2 Die Datenbank als Ganzes

| Kennzahl | vorher | nachher |
|---|---:|---:|
| Artikel insgesamt | 580 | **580** |
| höchste Artikel-ID | 803 | **803** |
| Bestellungen | 7.219 | **7.219** |
| höchste Bestell-ID | 8.260.496 | **8.260.496** |
| `temp_orders` | 0 | **0** |
| Artikel mit `pf_`-Feldern | 0 | **0** |

Keine Bestellung, keine Anfrage, kein Testartikel.
`POST /api/kasse/bestellen` wurde in keiner Form aufgerufen.

### 7.3 Warenkorb und Dateien

* Warenkorb: `POST /api/cart/clear`, danach geprüft — `count=0`, `gesamt=0,00 €`.
* Prüfskripte lagen kurzzeitig im Webroot (`_pruef.php`, `_schalte.php`) und sind
  entfernt; `ls /var/www/html | grep "^_"` ist leer, im Projektordner ebenso.
* **Kein Produktivcode geändert.** Prüfsummen am Ende der Prüfung:

```
120b46188f91fe353adb1461202f772ecc774639  php/Plugins/Katalog/SpezialoptionSpezial.php
e15dda2c49c197f5fed86d5b00935113f26974fe  php/Plugins/Katalog/Artikel.php
976a8840c2e2424d1cfdc691fcae3e406e891872  php/Plugins/Katalog/Preisformel.php
e6a586f44700b4be3a01be915d321b5c4513c0d6  php/Plugins/Katalog/ArtikelPage.php
```

* `git status` zeigt außer dieser Datei nur die zwei Screenshots, die der
  Bestandstest `ui-fuchsius-17-09.mjs` bei jedem Lauf neu schreibt.
* **Nicht von mir und bewusst stehen gelassen:** Im Webroot liegt
  `Backup/matten.de-2026-09-07/web/_repro.php` (Zeitstempel 20:36, während dieser
  Prüfung). Die Datei prüft Grenzfälle der Mengenstaffel-Eingabe und der
  Preis-Korrektur, stammt also von einer parallel laufenden Arbeit. Ich habe sie
  **nicht gelöscht**, um keinen fremden Lauf zu stören — sie sollte aber vor dem
  Abschluss weg, weil sie im Webroot erreichbar ist.

---

## 8 · Was ich nicht prüfen konnte

1. **Die Admin-Maske im Browser.** Ich habe über `parseAdminPost()` geschaltet,
   also über denselben Code, den die Maske aufruft — aber nicht durch Anmelden,
   Klicken und Speichern im Admin. Ob das Formular selbst richtig gerendert wird,
   ob der Speichern-Knopf die Felder mitschickt und ob die Werte nach dem Neuladen
   sichtbar bleiben, ist damit **nicht** belegt. (Hinweis am Rand: ein erster
   Versuch mit `$artikel->save()` schrieb nichts — `DbObject::save()` macht ohne
   `save(true)` ein INSERT statt eines UPDATE. Im Admin greift stattdessen
   `presaveObject()`, das ist ein anderer Weg.)
2. **Sonderform und Sonderfarbe im Altsystem.** `berechnePreisformel()` liest
   `sf_ohne`, `sf_mit`, `sonderfarbe`, `sonderfarben_anzahl` aus den
   Spezialoption-Daten — Eingabefelder dafür gibt es im Altsystem nicht. Damit
   sind der 1,3/1,5-Faktor und der einmalige 68-€-Aufschlag **im Altsystem nicht
   erreichbar** und blieben ungeprüft. In `preisformel.js` sind sie durch die
   Bestandstests gedeckt.
3. **Die Preis-Korrektur (`pf_korrektur`).** Nur im Code gelesen, nicht gemessen.
   Sie wirkt in `getAufpreis()` **nach** der Division durch die Menge, also je
   Stück. Bei „+5" bedeutet das 5 € je Stück, nicht 5 € je Auftrag. Ob das die
   Absicht des Auftraggebers ist, sollte geklärt werden.
4. **Der einmalige Sonderfarbenaufschlag im Warenkorb.** `getAufpreis()` teilt
   `vkGesamt` durch die Menge und gibt einen Stückpreis zurück, den der Shop
   später wieder mit der Menge multipliziert. Rechnerisch geht das auf; sobald
   aber ein Aufschlag im Spiel ist, der nur **einmal je Auftrag** anfällt, wird
   er dadurch auf die Stücke verteilt. Das ist bei Mengenänderung im Warenkorb
   richtig, bei einer Teilstornierung oder Mengenkorrektur in der Rechnung
   möglicherweise nicht. Ungeprüft, weil Sonderfarbe im Altsystem nicht
   eingegeben werden kann (siehe 2).
5. **Andere Artikel.** Geprüft wurde ein Artikel (490, Rechenart `varL`).
   Die Rechenarten `custom` (Länge × Breite frei) und `umf` (Umfang) wurden
   **nicht** mit eingeschalteter Formel geprüft. Bei `umf` ist besondere Vorsicht
   geboten: `getFlaeche()` liefert dort einen **Umfang**, keine Fläche, während
   `berechnePreisformel()` immer mit Breite × Länge rechnet.
6. **Mengen unter der kleinsten Staffelstufe.** Die kleinste Schwelle ist 1, und
   der Shop lässt keine Menge unter 1 zu. Der Excel-Fall „FALSCH → 0" ist über
   die Oberfläche nicht erreichbar und wurde nur in `preisformel.js` durch die
   Bestandstests abgedeckt.
7. **Kein Vergleich mit dem Livesystem.** Auftragsgemäß nicht angefasst.

---

## 9 · Empfehlung in der Reihenfolge der Dringlichkeit

1. **115 cm reparieren, vor allem anderen.** In `berechnePreisformel()` die
   Zentimeter ganzzahlig bilden (z. B. `round($this->getX() * $faktor, 6)`) oder
   in `faktorBreiteFuer()` mit Toleranz vergleichen statt mit `==`. Danach
   gegenprüfen, dass alle sechs Standardbreiten den Faktor 1 bekommen — und den
   Fall in die Testliste aufnehmen, damit er nicht zurückkommt.
2. **Entscheiden, wer den Preis rechnet.** Solange das neue Frontend aus
   `daten.js` rechnet und das Altsystem aus `spezialoption_data`, pflegt der
   Auftraggeber seine Werte an einer Stelle und sieht sie an der anderen nicht.
   Das ist der eigentliche Durchgriffs-Bruch, unabhängig von jeder Rundung.
3. **Grenzmaße vereinheitlichen** (200/700 cm, 30/40 cm) und einmal verbindlich
   festlegen, welche gelten.
4. **Preisabfrage auf POST umstellen** oder `parseFrontendPost()` auf `$_REQUEST`
   lesen lassen, damit `GET /api/price` überhaupt brauchbare Preise liefert.
5. **Rundungsregel festlegen** — netto zuerst runden oder erst am Ende. Ein Cent
   Unterschied im Schaufenster ist erklärbar, in einer Rechnung nicht.
