# Produkte übernehmen: Befund der Erkundung und die Entscheidungen

Stand 03.10.2026. Sechs Erkundungsagenten (Sonnet) haben parallel die Lage geklärt,
die Kernbefunde sind von der Hauptsitzung selbst nachgemessen.

Einzelberichte in diesem Ordner: `ERKUNDUNG-kategorien.md`, `ERKUNDUNG-produktdaten.md`,
`ERKUNDUNG-datenjs.md`, `ERKUNDUNG-frontend.md` (weitere folgen).

## Die Zahlen

| | Altsystem matten.de | net-neu heute |
|---|---|---|
| Artikel gesamt | 580 | 19 |
| **davon aktiviert** | **385** | — |
| davon Maßware (Spezialoption) | 191 | — |
| davon mit Bild | 236 | — |
| Kategorien | 29 (26 aktiv) | 27 |

Aufteilung der Maßware: `spezial` 82 · `flaeche` 79 · `umfang` 17 · `laenge` 13 ·
ohne Spezialoption 194.

## Befund 1: Zwei verschiedene Ordnungssysteme — Entscheidung nötig

Die „27 Kategorien" im neuen Shop und die „29" im Altsystem sind **nicht dasselbe**.

| matten.net (neuer Shop) | matten.de (Altsystem) |
|---|---|
| JetPrint-einfarbig, IronHorse, IronHorse XL, Designmatten, OS-REHAB-Basis-Matte, OS-REHAB-Stern-Matte … | Fussmatten, Logomatten, Kokosmatten, Aluminium-Profilmatten, Gummi & Kunststoffmatten, Miet-Mattenservice … |
| 27 **Produktlinien** | 9 oberste **Warengruppen**, darunter 17 Unterkategorien |

Im neuen Shop ist jede „Kategorie" eine Produktlinie. Im Altsystem sind das keine
Kategorien, sondern einzelne Artikel innerhalb von Warengruppen. Nur 13 der 27
Produktlinien haben dort überhaupt Produkte; umgekehrt gibt es große Warengruppen ohne
jede Entsprechung (Standard-Schmutzfangmatten 44 Artikel, Außenbereiche 40,
Bierbankmatten 33).

**Zwei Wege, beide vertretbar:**

* **A — Warengruppen des Altsystems übernehmen.** Alle 385 Artikel finden automatisch
  ihren Platz, keine Handarbeit, jede künftige Änderung im Admin wirkt sofort.
  Nachteil: Die Gliederung von matten.net, die der Auftraggeber 1:1 wollte, verschwindet.
* **B — Produktlinien beibehalten.** Optik und Logik von matten.net bleiben, aber jeder
  der 385 Artikel braucht eine Zuordnung von Hand — und für viele gibt es keine passende
  Linie.
* **C (Vorschlag) — beides:** Die Produktlinien als Schaufenster im Menü, darunter die
  vollständige Warengruppen-Struktur für alles Übrige.

**ENTSCHIEDEN von Lukas am 03.10.2026: Weg C — beides kombinieren.**
Die Produktlinien von matten.net bleiben als Schaufenster (Menü, Startseite), darunter
kommt die vollständige Warengruppen-Struktur des Altsystems, damit alle 385 Artikel
einen Platz finden.

## Befund 2: Die Preisformel kann nur bei 82 von 191 Maßware-Artikeln rechnen

Selbst nachgemessen:

| Typ | aktive Artikel | davon mit EK je m² |
|---|---|---|
| `spezial` | 82 | **82** |
| `flaeche` | 79 | **0** |
| `umfang` | 17 | **0** |
| `laenge` | 13 | **0** |

Die Excel-Formel braucht den Einkaufspreis je m². Den tragen nur die `spezial`-Artikel.
Die übrigen 109 Maßware-Artikel rechnen im Altsystem anders (Artikelpreis × Fläche) und
haben die Größe schlicht nicht hinterlegt.

**ENTSCHIEDEN von Lukas am 03.10.2026:** Die Formel wird nur dort vorbereitet, wo der
EK-Preis bekannt ist (82 Artikel). Die übrigen 109 rechnen weiter wie bisher. Die
fehlenden Werte (EK/m², Salesfactor, Standardbreiten) reicht Lukas nach, sobald Herr
Fuchsius sie ihm geschickt hat — die Admin-Felder dafür sind gebaut und warten.

Dazu: Salesfactor und Standardbreiten gibt es im Altsystem **gar nicht** — die neuen
`pf_*`-Felder sind bei 0 Artikeln gefüllt. Sie müssten je Artikel eingetragen werden.

## Befund 3: Die hinterlegten Preise weichen teilweise vom Altsystem ab

In `daten.js` stehen EK-Werte, die bei JetPrint-Premium und Velour mit dem Altsystem
übereinstimmen — bei Stern-REHAB (52,67 gegen 46,88), Iron Horse und den
JetPrint-light-Produkten aber nicht. Bei letzteren sind die Werte teils vertauscht.
Ursache sind unsichere Zuordnungen (fünf Einträge in `bau-net-daten.mjs` sind als
„geraten" markiert).

**Beim Übernehmen aus dem Altsystem verschwindet dieses Problem** — dann gilt nur noch
eine Quelle.

## Befund 4: Was im Frontend umgebaut werden muss

**Bricht bei 385 Produkten:**
1. Alles liest aus `window.NET` (`daten.js`). Was dort fehlt, gibt es für das Frontend
   nicht. **Die Quelle muss gewechselt werden** — das ist der Kern der Aufgabe.
2. Es fehlt ein eindeutiger Schlüssel: Das Altsystem liefert 612 Listenplätze für 384
   Artikel, und Pfade sind nicht eindeutig (375 verschiedene bei 384 Zeilen).
3. Bilder: Der Proxy liefert Originale (im Mittel 123 KB, bis 627 KB), kein verzögertes
   Laden. Die größte Kategorie zöge 3,5 MB auf einmal. Die Kategorieseite zeigt alle
   Produkte ohne Blätterung.

**Nur unschön:**
* 385 Produkte = 25 Seiten, die Blätterleiste zeigt alle 25 Zahlen.
* Die Suche läuft im Browser nur über den Namen („iron horse" findet 0, „iron-horse"
  findet 3). Die Brücke hat bereits `/api/suche`.
* `daten.js` wüchse von 148 KB auf 1–2 MB (auf dem Handy rund 1 s mit Komprimierung).
* Menü, Startseite und TOP-ANGEBOTE sind fest verdrahtet.

## Befund 5: Was der Brücke noch fehlt

* Netto-Grundpreis und Aufpreise je Option (sie liefert nur den fertigen Bruttopreis)
* Die vollständigen Spezialoptions-Daten (Typ, Einheit, Min/Max, m²-Preis)
* Eine Preisabfrage, die eine Auswahl durchrechnet
* Die Zuordnung Farbname → Farbbild (Artikel 459 allein hat 147 Farbbilder, die Brücke
  liefert einen Topf mit 60 Dateien)
* Bildtyp, Meta-Texte, HTML der Beschreibung, Versandklasse, Gewicht

## Befund 6: Der Zwilling ist halb automatisch ableitbar

Heute hat jedes der 19 Produkte einen von Hand eingetragenen `dePfad` und teils einen
`deZwilling` — den Anfrage-Bruder (`-a`) eines Kaufartikels, der freie Maße aufnimmt.
Die Liste steht in `bau-net-daten.mjs`, fünf Einträge sind als „geraten" vermerkt.

**Bei direkter Übernahme fällt das meiste weg:** Der eigene Pfad des Artikels *ist* der
`dePfad`, die Handrecherche entfällt, ebenso die Doppelgänger (vier der 19 Produkte
zeigen auf denselben Altsystem-Artikel).

**Der Zwilling bleibt teilweise Handarbeit.** Über Namensmuster (`-a`, `-ang`,
`-sondermass`) findet sich bei 95 von 184 Kaufartikeln ein Partner — das braucht aber
eine Gegenprüfung (Modus „anfrage", gleiche Attribute, passende Maßfelder). Das
Brückenfeld `gehoertZu` ist dafür unbrauchbar: Es folgt der Listenreihenfolge und war
bei 5 von 6 Zwillingen falsch. Die heutige Handliste hat zudem sechs vorhandene
Zwillinge übersehen.

Ohne Zwilling funktioniert die Artikelwahl weiter, nur gröber — über den
Universalartikel 569.

## Nebenbefunde

* Ein aktiver Artikel („Offenlegung", id 794) hängt in gar keiner Kategorie.
* Die Brücke meldet bei `aluminium_profilmatten` 80 statt 82 Artikel — Ursache ungeklärt.
* 149 aktive Artikel haben keinen Bildeintrag; bei 69 davon steckt ein Bild im
  Beschreibungstext, 80 haben gar keins.
* Rund 5.200 Attributzeilen und alle 46 Preisstaffel-Zeilen gehören zu gelöschten
  Artikeln — Altlasten, die beim Übernehmen herausfallen müssen.
* **Die Preisformel ist bei keinem Artikel eingeschaltet** (0 von 580) — das ist der
  gewollte Auslieferungszustand. Ein Erkundungsagent hat das als Fehler gedeutet
  („`/api/price` liefert nicht den Formelwert"); tatsächlich rechnet das System korrekt
  wie bisher, solange der Schalter aus ist.
* Kein aktiver Artikel hat eine Preisstaffel. Die Staffel der Excel-Formel ist davon
  unberührt (sie rechnet nach Stückzahl, nicht über diese Tabelle).

## Befund 7: Bilder — 290 MB, aber nur ein Teil brauchbar

* `media/bild/` hat **4.454 Dateien, 290 MB**: 2.542 Originale plus 1.912 verkleinerte
  Fassungen im `cache/`. Median 34 KB, Durchschnitt 110 KB, größte Datei **16 MB**.
* **1.516 Originale gehören zu gar keinem Artikel mehr** — Altlast.
* Von den 385 aktiven Artikeln haben **236** ein Bild in `artikel_dateien`, 69 weitere
  nur im Beschreibungstext, und **80 (21 %) nirgends**. Von diesen 80 sind 51
  Anfrage-Varianten (`-a`), deren Bild vom Hauptartikel kommen müsste.
* **Farbbilder:** 115 Artikel haben welche, zugeordnet allein über den Dateinamen
  (`<farbe>_farboption.JPG` = Muster, `<farbe>_0.JPG` = Foto). Dieselbe Regel wie im
  neuen Frontend — gut übertragbar.
* **Die Brücke deckelt bei 60 Bildern.** Artikel 6300000 hat in der Datenbank 147, die
  Brücke liefert 60 — und nur 1 von 44 Farbmustern. Das Feld für die Farbzuordnung fehlt.
* In der Kategorieliste haben **132 von 366 Karten gar kein Bild**.

**Zu tun:** Bilder verkleinern (der Proxy liefert heute Originale), die 60er-Grenze
aufheben, Farbmuster mitliefern, Platzhalter für Artikel ohne Bild, und für
Anfrage-Varianten das Bild des Hauptartikels übernehmen.

## Was ohne Entscheidung schon gebaut werden kann

1. **Die Brücke um die fehlenden Felder erweitern** (Netto-Preis, Spezialoptions-Daten,
   Farbzuordnung) — nötig in jedem Fall.
2. **Den Quellenwechsel vorbereiten:** `daten.js` nicht mehr aus `struktur.json`, sondern
   aus dem Altsystem erzeugen.
3. **Das Frontend auf Masse vorbereiten:** verzögertes Bildladen, Blätterung auf der
   Kategorieseite, Suche über die Brücke statt im Browser.

Die Entscheidung über die Kategoriestruktur (Befund 1) wird erst beim Zusammensetzen
gebraucht — bis dahin kann parallel gearbeitet werden.
