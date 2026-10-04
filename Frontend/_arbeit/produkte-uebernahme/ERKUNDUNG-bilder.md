# Erkundung: Produktbilder des Altsystems matten.de

Stand 03.10.2026. Nur gelesen und gemessen, nichts verändert. Quelle: lokale Datenbank
(`fuchsius_matten`), Backup-Ordner `Backup/matten.de-2026-09-07/web/media/bild/`,
Brücke Port 8787, Altsystem Port 8080.

## 1. Der Ordner `media/bild/`

| | Wert |
|---|---|
| Dateien gesamt (inkl. `cache/`) | 4.454 |
| davon Originale direkt im Ordner | 2.542 (278 MB) |
| davon `cache/` | 1.912 (14,4 MB) |
| Größe des Ordners | 290 MB |
| Formate (Originale) | jpg/JPG 2.365 · png 136 · gif 22 · jpf 7 · pdf 5 · tif, psd, pxd, pcx je 1 · 2 Dateien ohne Endung |
| Dateigröße Originale | kleinste 65 Byte (Layout-GIF) · Median 34 KB · Durchschnitt 110 KB · 90 % unter 215 KB · größte 16,2 MB (`Vision 512x356.jpg`) |
| über 1 MB / über 500 KB / über 200 KB | 26 / 61 / 265 Dateien |
| Datenbank `dateien` | 2.187 Einträge `bild`, 7 `datei` |

Im Ordner liegen auch Layout-Grafiken (Flaggen `de.jpg`, `subnav_bg.gif`, ...) und
Dateien, die zu gelöschten Artikeln gehören. **1.516 der Originale gehören keinem
existierenden Artikel.** Die Dateinamen lügen teils: `WaterHorse_512x340.jpg` ist
tatsächlich 512x340, wiegt aber 2,3 MB (kaum komprimiert).

## 2. Wie hängt ein Bild am Artikel

Drei Wege (alle drei im Einsatz):

**a) Zuordnungstabelle `artikel_dateien`** (`artikel_id`, `dateien_id`, `typ`) mit
`dateien` (`id`, `typ`, `dateiname`). Der Pfad ist immer `/media/bild/<dateiname>`.
Typen: `standard`, `oben`, `oben rechts`, `galerie`, `farbe`.
Code: `master/php/Plugins/Katalog/Artikel.php` (`getBilder($typ)`, `getErstesBild`,
`addBild`), `master/php/Plugins/BilderVerwaltung/Bild.php` (`getURI`,
`getResizedURI`, `getShrinkedURI`). Sortiert wird nach **Dateiname**, nicht nach einer
einstellbaren Reihenfolge.

**b) Spalte `artikel.farbbilder = 1`**: schaltet die Farbwahl-Darstellung ein
(`templates/artikelpage/artikelbox.php`, `artikelform.php`, `ArtikelAjax.php`).

**c) Bilder im Beschreibungstext** (`texte`, Namespace `artikel`, Code `text`, als
`<img src="/media/bild/...">`). 124 aktive Artikel haben so ein Bild, bis zu 24 je
Artikel, im Schnitt 2,9. Diese Bilder stehen **nicht** in `artikel_dateien`.

Darstellung im Altsystem: `oben` und `oben rechts` oben groß (800 px, Klick 1000 px),
`galerie` darunter, `standard` als 300-px-Kacheln. Bei `farbbilder = 1` gibt es stattdessen
Schieber mit Hauptbild und Leiste.

Zeilen in `artikel_dateien` (alle 16.024): `standard` 176 · `oben` 187 · `oben rechts` 37 ·
`galerie` 2 · `farbe` 15.622. **4.404 Zeilen gehören zu Artikeln, die es nicht mehr gibt**
(Altlasten). Keine Zeile zeigt auf eine fehlende Datei, kein Groß-/Kleinschreibungsfehler.

## 3. Abdeckung der 385 aktiven Artikel

| Frage | Artikel |
|---|---|
| Mindestens ein Bild in `artikel_dateien` (beliebiger Typ) | **236** |
| ... davon mit einem Nicht-Farbbild (`standard`/`oben`/`oben rechts`/`galerie`) | 149 |
| ... davon nur Farbbilder | 87 |
| Gar nichts in `artikel_dateien` | **149** |
| Zusätzlich Bild im Beschreibungstext (nur bei den 149) | 69 |
| **Kein Bild an keiner Stelle** | **80** (21 %) |
| Mindestens ein Bild irgendwo | **305** (79 %) |

Die 80 ohne Bild, geprüft über `GET /api/produkt` (Seite zeigt auch wirklich nichts):
* **51 sind Anfrage-Varianten** (Artikelnummer endet meist auf `-a`/`-ang`, `variante: true`,
  `gehoertZu` zeigt auf den Hauptartikel). Das Bild müsste vom Hauptartikel kommen.
* **27 normale Artikel**, fast alles Zubehör, Service und Sonderposten.
* 2 sind gar nicht im Katalog erreichbar (`Info-Mattenservice`, `Offenlegung`).

Zehn Artikel ohne Bild (Artikelnummer, Pfad):
1. `Nomad-Rolle` /gummi_und_kunststoffmatten/nomad-eingangsbelaege-rolle
2. `Aluminium-Profilrahmen` /aluminium_profilmatten/rahmen_und_zubehoer/aluminium-profilrahmen
3. `6301000` /logomatten/wunschdesign-matten/mountville-design
4. `Ersatzteile-Alumatten` /aluminium_profilmatten/rahmen_und_zubehoer/ersatzteile-alumatten
5. `5451` Aussparung rund/eckig
6. `5452` Rahmenschräge / Mattenschräge
7. `Stewell-Front-extra-Rolle` STEWELL Front Extra, Rollenware
8. `Aluprofil R` Aluprofil-R
9. `908119` Service-Auftrag
10. `6300900` Sonderfarbe, individuell nach Pantone

(Weitere: `5452R`, `5453R`, `5453T`, `5454`, `100004` Aufmaß, `908120`, `9999999`,
`mattenverbinder`, `cfl-s1`, `C12` Abdeckschiene, `522RN-Ma-a`, ...)

Über die Kategorien erreichbar sind 366 eindeutige Artikelseiten (385 aktiv, der Rest hängt in
keiner sichtbaren Kategorie).

## 4. Mehrere Bilder je Artikel (Galerie)

* **Ohne Farbbilder:** 149 Artikel, im Schnitt 1,14 Bilder, Maximum 6. 135 haben genau 1 Bild,
  nur 14 haben mehr. Der Typ `galerie` ist praktisch unbenutzt (2 Zeilen, 1 Artikel).
* **Mit Farbbildern:** 115 Artikel, im Schnitt 77, Maximum 204 Zeilen je Artikel.
* **Beschreibungstext:** bis zu 24 Bilder (meist Maßzeichnungen, Zertifikate).

Eine echte Produktgalerie gibt es nur bei den Farbartikeln (dort als Schieber).

## 5. Farbabhängige Bilder

Ja, das Altsystem kennt sie. **115 aktive Artikel** haben `farbbilder = 1` (114 davon mit
Einträgen vom Typ `farbe`; 1 hat das Flag ohne Bilder). 8.898 `farbe`-Zeilen, aber nur
**752 verschiedene Dateien** — Farbbilder werden von vielen Artikeln gemeinsam genutzt.

Die Zuordnung läuft **nur über den Dateinamen** (kein Feld in der Datenbank):

| Namensmuster | Bedeutung | Zeilen (aktive) |
|---|---|---|
| `<farbe>_farboption.JPG` | Farbmuster (Kästchen zum Anklicken), **34x20 px**, ca. 1 KB | 2.934 (110 Artikel) |
| `<farbe>_designoption.JPG` | Muster der zweiten Farbe (Designfarbe), 34x20 px | 2.705 (85 Artikel) |
| `<farbe>_0.JPG` o. ä. | Produktfoto in dieser Farbe, meist 800x600 | übrige ca. 2.790 |
| `*default*` | Standardbilder, gelten für „default" | 330 |
| `*variant*` | gelten bei **jeder** Farbe | 139 |

Der Farbwert im Namen ist zugleich der Wert der Grundfarbe (`attribute[Grundfarbe]`,
z. B. `613-königsblau` aus `613-königsblau_farboption.JPG`). Ob ein Bild zur gewählten Farbe
gehört, entscheidet `ArtikelAjax.php` per **Teilstring-Suche im Dateinamen**
(`POST /ArtikelAjax.php`, Felder `articleId`, `color`; nur mit Header
`X-Requested-With`). Beispiel Artikel 6300000 (JetPrint, 66 Farben):

* `color=601-zitronengelb` liefert 3 Bilder: `JP-1f_601-zitronengelb_0.jpg`,
  `JP-601-zitronengelb_0.JPG`, `JP_variant_0.jpg`.
* `color=613-königsblau` liefert 2: `JP-613-königsblau_0.JPG`, `JP_variant_0.jpg`.
* `color=default` liefert alle 58 Bilder.

Ein Artikel hat bis zu 147 Zeilen (6300000: 44 Farbmuster, 45 Designmuster, 8 default, 1 variant,
Rest Farbfotos). Die Namenskonvention ist also **dieselbe** `_farboption` wie im neuen Frontend.

## 6. Wie die Brücke Bilder liefert

* Die Brücke liest die **HTML-Seite** des Altsystems und sammelt alle `/media/...`-Links aus
  dem Inhaltsbereich (`parseBilder` in `Frontend/bridge-demo/lib/bruecke.mjs`). Sie fragt weder
  die Datenbank noch `ArtikelAjax.php`.
* `GET /api/produkt?pfad=/fussmatten/standard-schmutzfangmatten/6300000`:
  `hauptbild: /api/img/bild/JP_default_0.jpg`, `bilder`: **60 Einträge** `{bild, original}`.
  60 ist eine harte Obergrenze im Code (`out.length >= 60`); die Seite hat 58 Bilder im
  Schieber, die Datenbank 147. Ohne Zuordnung zur Farbe: die 60 sind eine flache Liste
  (default, dann alle Farbfotos nacheinander). Von den 44 Farbmustern kommt eins mit
  (`601-zitronengelb_farboption.JPG`, am Listenende).
* `attribute[Grundfarbe]` hat `typ: farbwahl` und `optionen: [{wert, label}]` (Werte wie
  `601-zitronengelb`), aber **kein Bildfeld**. Das Muster zu einer Farbe muss man selbst
  aus dem Wert bauen: `/api/img/bild/<wert>_farboption.JPG` (Endung `.JPG` oder `.jpg`,
  Schreibung ist je Datei verschieden).
* Die Kategorieliste (`/api/kategorie`) trägt `bild` und `bildQuelle`. Das Bild kann ein ganz
  anderes sein als auf der Produktseite: bei 6300000 `VierJahr2_512x340-farb.JPG`
  (`bildQuelle: beschreibung`), auf der Produktseite `JP_default_0.jpg`.
  Quellen der 366 Kartenbilder: `artikelbilder_oben` 83 · `beschreibung` 151 · **kein Bild 132**.
* `/api/img/…` funktioniert: alle 60 Bilder von 6300000 liefern 200 und `image/jpeg`,
  zusammen **18,9 MB**. Geprüft außerdem: Umlaut (`JP-613-k%C3%B6nigsblau_0.JPG`, 200, 328 KB),
  Farbmuster (200, 1,4 KB), Leerzeichen im Namen (`Vision%20512x356.jpg`, 200, 16,2 MB),
  Cache-Datei (200), nicht vorhandene Datei: 502, Pfad mit `../`: 404.
* Der Proxy reicht die **Originaldatei unverkleinert** durch (`Cache-Control: max-age=3600`).
  Er erlaubt höchstens drei Pfadteile und nur Bildendungen aus `IMG_MIME`.

## 7. Der Ordner `media/bild/cache`

Von PHP erzeugte, **verkleinerte Fassungen** (`Bild::getResizedURI` / `getShrinkedURI`, GD-Bibliothek).
Name: `<Originalname>_m<Modus>_<Breite>_<Höhe>.<Endung>`, Modus 0 = Rand auffüllen, 1 = zuschneiden,
2 = verzerren. Die Datei wird beim ersten Aufruf erzeugt und ersetzt, wenn das Original neuer ist.
1.912 Dateien, 14,4 MB, größte 284 KB. Häufigste Größen: 50x50 (1.329, Vorschaubilder der Verwaltung),
300 breit (290, Kacheln `standard`), 200 breit (110), 40x40 (104), 800/1000 breit (nur 292 Dateien).
Die Datei ist **keine vollständige Sammlung**: die meisten Produktbilder haben keine
verkleinerte Fassung (`getShrinkedURI` lässt Bilder unverändert, die nicht größer als 800 px sind).
Rund 122 Cache-Gruppen haben kein Original mehr. Das Backup enthält den Stand vom 07.09.2026.
Der Cache wurde bei meinen Abrufen nicht verändert (1.912 Dateien vorher und nachher).

## Zahlen zu den tatsächlich genutzten Bildern (aktive Artikel)

| Gruppe | Dateien | Größe gesamt | Median | größte | Breite (min/median/max) |
|---|---|---|---|---|---|
| Haupt- und Galeriebilder (`standard`/`oben`/`oben rechts`/`galerie`) | 163 | 10,6 MB | 28 KB | 0,9 MB | 105 / 512 / 2.610 |
| Farbfotos (default/variant/`_0`) | 559 | 81,9 MB | 110 KB | 0,6 MB | 150 / 800 / 2.000 |
| Farbmuster `_farboption` | 126 | 0,5 MB | 1 KB | 12 KB | 34 / 34 / 171 |
| Designmuster `_designoption` | 67 | 0,1 MB | 1 KB | 2 KB | 34 / 34 / 35 |
| Bilder im Beschreibungstext | 273 | 33,4 MB | 45 KB | 2,4 MB | 16 / 512 / 2.550 |

## Was beim Übernehmen zu beachten ist

**Dateigrößen**
* Der Proxy verkleinert nichts. Ein Farbartikel schickt bis zu 60 Bilder, 19 MB. Für die
  Kartenliste und die Produktseite braucht der neue Shop verkleinerte Fassungen (z. B. 400 und
  1200 px) oder einen Bildproxy mit Größenparameter.
* Das größte genutzte Bild ist 2,4 MB (`WaterHorse_512x340.jpg`, `IHXL_512x340.jpg`,
  `WashHorse_512x340.jpg`: 512x340, aber 2,3 MB). Die 16-MB- und 11-MB-Dateien
  (`Vision 512x356.jpg`, `dirt-trapper02.jpg`) gehören **nicht** zu aktiven Artikeln.
* Dateinamen enthalten Leerzeichen, Umlaute, `&uuml;`-Schreibweisen im Text und gemischte
  Endungen (`.JPG`/`.jpg`). Auf einem Linux-Server ist die Schreibung relevant.

**Fehlende Bilder**
* 80 von 385 Artikeln (21 %) haben nirgends ein Bild: 51 Anfrage-Varianten, 27 Zubehör/Service.
  Der neue Shop braucht ein Platzhalterbild und für die Varianten die Regel „Bild vom
  Hauptartikel" (Feld `gehoertZu`).
* Nur 149 von 385 haben ein Bild über `artikel_dateien`. Bei 69 weiteren steht es **nur im
  Beschreibungstext**. Wer nur die Tabelle auswertet, verliert diese Bilder. Wer die Brücke
  nutzt, bekommt sie (HTML-Parser), aber mit unsicherer Reihenfolge.
* In der Kategorieliste fehlt bei 132 von 366 Karten das Bild, obwohl die Produktseite teils
  eines zeigt. Das Kartenbild sollte aus `/api/produkt` kommen, nicht aus der Liste.
* Die Brücke deckelt bei 60 Bildern je Produkt.

**Farbvarianten**
* Kein Feld verknüpft Bild und Farbe, nur der Dateiname (`<farbwert>_farboption`, `<farbwert>_0`).
  Muster und Fotos je Farbe müssen über den Farbwert aus `attribute[Grundfarbe]` zugeordnet
  werden. Die Teilstring-Regel des Altsystems trifft bei kurzen Werten falsche Bilder (ein
  Wert wie „1" passt auf fast jeden Dateinamen) und übersieht Treffer an Position 0 (PHP:
  `strpos(...) != false`). Im neuen Shop besser exakt über das Muster
  `<farbwert>_farboption` bzw. `*<farbwert>_0.*` prüfen.
* Dateien mit `variant` gelten bei jeder Farbe, `default` nur bei der Auswahl „default".
* Zweite Farbe (`Designfarbe`) hat eigene Muster `_designoption` (85 Artikel).
* 5 aktive Artikel haben `farbbilder = 1` ohne Farbmuster, 1 Artikel hat Farbbilder ohne
  das Flag (Datenfehler, prüfen).
* Farbmuster sind 34x20 px und scharf genug nur als kleine Kästchen; für größere Darstellung
  braucht es Hex-Werte (die das Altsystem nicht kennt) oder ein Foto der Farbe.
* Farbbilder sind zwischen Artikeln geteilt (752 Dateien für 8.898 Zeilen). Beim Herunterladen
  Dateien nur einmal holen.

**Weiteres**
* Kein `artikel_dateien`-Eintrag zeigt auf eine fehlende Datei. Das Aufräumen (`bereinigeBilder`)
  des Altsystems löscht Zeilen mit fehlendem `dateien`-Eintrag beim Abruf. Nicht auslösen, wenn
  man die Daten unverändert braucht.
* Die Reihenfolge der Bilder im Altsystem ist alphabetisch nach Dateiname. Das erste Bild im
  Schieber ist nur zufällig ein gutes Hauptbild (bei JetPrint `JP_default_0.jpg`).
* Beim Testen entstand nichts: keine Dateien im Webverzeichnis, Cache unverändert. Die
  Abfragen von `ArtikelAjax.php` waren reine Lesezugriffe.
