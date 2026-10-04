# Bau: daten.js aus dem Altsystem erzeugen

Stand 04.10.2026. Geändert wurde nur `Frontend/bridge-demo/bau-net-daten.mjs`. Neu in diesem Ordner:
`auswahl-altsystem.json`, `preisstamm-altsystem.json`, `preisstamm-vorlage.json`, `pruefe-stichprobe.mjs`.
Neu erzeugt: `Frontend/bridge-demo/public/net-neu/assets/js/daten-alle.js`.
Die heutige `daten.js` ist unberührt (Änderungsdatum 10.09., Prüfsumme unverändert).

## Aufruf

| Befehl | Wirkung |
|---|---|
| `node bau-net-daten.mjs` | wie bisher: `daten.js` mit den 19 Produkten, **byteweise identisch** |
| `node bau-net-daten.mjs --alle` | holt die Artikel über die Brücke (`BRUECKE`, Vorgabe `http://localhost:8787`) und schreibt `daten-alle.js` |
| `--alle --preisstamm-vorlage` | schreibt zusätzlich `preisstamm-vorlage.json` (186 Artikel, die freie Maße aufnehmen) |
| `--ohne-varianten` / `--nur-kauf` / `--nur-mit-bild` | Auswahl per Schalter (überstimmt die Datei) |
| `--auswahl <datei>` / `--preisstamm <datei>` | andere Auswahl- bzw. Preisstamm-Datei |
| `--cache-dir <ordner>` | Brückenantworten merken (Wiederholungsläufe ohne Netz, schnell) |
| `--ausgabe <datei>` | anderes Ziel (gilt auch ohne `--alle`, zum Vergleichen) |
| `--pruefen` | wie bisher (jeder Zuordnungspfad kaufbar?) und zusätzlich Zählung ohne Bild / ohne Kategorie / ohne Preis |

`--alle` weigert sich, nach `daten.js` zu schreiben (Schutz), außer mit `--daten-js-ueberschreiben`.
`MATTEN_UPSTREAM` braucht das Skript nicht selbst; es spricht nur mit der Brücke, die ihrerseits auf `localhost:8080` zeigt.

## Wie es arbeitet

1. `/api/katalog` liefert den Warengruppen-Baum (8 oberste, 16 Unterkategorien = 24).
2. `/api/kategorie` je Warengruppe, alle Seiten (200 je Seite): 612 Listenzeilen.
3. `/api/suche?alle=1`: Gesamtkatalog (384 Zeilen), fängt Artikel, die in keiner Gruppe stehen.
4. `/api/produkt` für jeden verschiedenen Pfad (357): Artikel-ID, Name, Preis, Bilder, Attribute, Maßfelder.
5. Zusammenführen **nach Artikel-ID** (nicht nach Pfad). Gleiche Pfade mit anderer Schreibweise
   (`/Logomatten/Bierbankmatten/…`) landen so beim selben Artikel.
6. Die 19 kuratierten Produkte bleiben **unverändert** (nachgemessen: kein Feld verändert, `zuordnung`
   gleich, alle 27 Produktlinien gleich). Ihre 21 Altsystem-Artikel (15 Kaufartikel + 6 Zwillinge)
   werden nicht doppelt angelegt. Das kuratierte Produkt bekommt am Ende seiner `kategorien` die
   Warengruppen seines Artikels dazu, damit die Warengruppe nicht leer wirkt.
7. Alle übrigen Artikel kommen als neue Produkte dazu.

## Ergebnis (Lauf vom 04.10.2026)

| | |
|---|---|
| Produkte gesamt | **355** = 19 kuratiert + **336 aus dem Altsystem** (173 Kauf, 163 Anfrage) |
| Kategorien gesamt | **51** = 27 Produktlinien (unverändert) + **24 Warengruppen** (`de-…`) |
| Dateigröße `daten-alle.js` | **1.389.443 Bytes (1.357 KB)**, gzip 139 KB. Zum Vergleich `daten.js`: 147.727 Bytes, gzip 32 KB |
| Laufzeit | rund 40 s live, 1 s mit `--cache-dir` |
| Deterministisch | live, mit Cache und ein zweites Mal: **dieselbe Prüfsumme** |

**Warum 355 und nicht 385?** Die Brücke sieht 357 Artikel. Die Differenz zu den 385 aktiven:
* **26 Teaser-Zeilen** (ohne Knopf, ohne Modus): eigene Artikelnummer, aber der Link zeigt auf eine
  Info-Seite, Landingpage oder einen anderen Artikel (`Sonderangebot` → 6301011, `Info-Kokosmatten`,
  `Hinweise` …). Ein Teaser ist keine Platzierung des Zielartikels. Anfangs hatte das Skript sie
  mitgezählt und den Artikel 339 fälschlich in „Rahmen und Zubehör“ und „Schnäppchen“ einsortiert
  (aufgefallen in der Stichprobe). Jetzt werden sie nur gezählt, nicht übernommen.
* Dazu mindestens der Artikel „Offenlegung“ (id 794) ohne Kategorie. Das passt zusammen: 357 + 26 + 1 ≈ 385,
  genau nachprüfen lässt es sich nur in der Datenbank (Zugriff dort wurde in dieser Sitzung abgelehnt und nicht umgangen).
* Die 357 Artikel erscheinen als 355 Produkte: 21 sind von kuratierten Produkten abgedeckt (+19 kuratierte).

### Vollständigkeit (`--pruefen`)

| | Anzahl (von 336 neuen) |
|---|---|
| ohne Bild | **34** (Zubehör, Rahmenteile, Services; 88 Varianten haben das Bild vom Hauptartikel) |
| ohne Kategorie | **0** |
| ohne Preis | **163**, alle Anfrageartikel (Preis nur auf Anfrage); **0 Kaufartikel** ohne Preis |
| ohne Preisstammdaten (Formel nicht vorbereitet) | **336** (siehe unten) |
| Name unsicher | 15 (in der Liste geerbt oder nur Artikelnummer, Feld `nameQuelle`) |

Für die 19 kuratierten (`--pruefen` ohne `--alle`): 0 ohne Bild, 0 ohne Kategorie, 4 ohne Preisstamm (EK 0, laufen über `/api/price`).

## Datenmodell der neuen Produkte (für die Frontend-Agenten)

Gleiche Form wie die kuratierten, dazu Zusatzfelder. Die kuratierten Felder bleiben leer/neutral
(`attribute: []`, `fixgroessen: []`, `customOption: null`), damit bestehender Code nichts Falsches liest.

* `slug`: `a<Artikel-ID>-<Name, höchstens 40 Zeichen>`. **Stabil ist nur der Teil `a<ID>`**, der Namensteil kann sich mit dem Namen ändern.
* `quelle: 'altsystem'`, `productId: null`, `artikelId`, `artikelnummer`, `modus` (`kauf`/`anfrage`, Stand beim Bauen; zur Laufzeit gilt `/api/produkt`), `variante`, `hauptartikelId`, `nameQuelle`.
* `preisAltsystem`: `{wert, text, ab, brutto, ustSatz}` (Vorauswahl-Preis brutto) oder `null` bei Anfrageartikeln.
* `preisdaten`: nur wenn EK, Salesfactor und Standardbreiten bekannt sind, sonst `null`.
* `deAttribute` (Feld, Name, Typ, Art, Optionswerte) und `deMasse` (Maßfelder mit min/max) im **Format des Altsystems**.
* `bilder` (höchstens 12, ohne `cache/`-Fassungen) und `kachel` sind Pfade der Brücke (`/api/img/bild/…`), **nicht** lokale Dateien. `bildVon`: `eigen` oder `hauptartikel`.
* `beschreibung`: HTML aus den Absätzen des Artikels; Varianten erben vom Hauptartikel.
* `NET.zuordnung[slug] = {dePfad, deZwilling, anmerkung}`: `dePfad` ist der eigene Pfad, `deZwilling` nur bei geprüftem Zwilling.

Neue Abschnitte in `NET`:
* `kategorien['de-…']`: `{slug, name, gruppe, href, produkte[], quelle:'altsystem', deSchluessel, dePfad, ebene, eltern}`. Sie stehen **nicht** in `kategorieReihenfolge` und `gruppen`, damit Menü und Startseite unverändert bleiben.
* `warengruppen`: Baum mit Anzahl (`[{slug, name, anzahl, kinder:[…]}]`), `warengruppenReihenfolge`: alle 24 Slugs.
* `produktReihenfolge`: erst die 19 kuratierten, dann die neuen in Katalogreihenfolge.
* `altsystem`: Zählwerte, Auswahl-Einstellungen und `zwillingsVorschlaege` (siehe unten).

Zwillinge: Endungsregel (`-ang`, `-sondermass`, `-a`, `a`, auch `…-kauf`/`…-k` → `-a`), nie über `gehoertZu`. Gegenprüfung: Hauptartikel `kauf`,
Variante `anfrage` **und** Variante nimmt freie Maße auf. 48 Zwillinge eingetragen, 34 Treffer verworfen (keine freien Maße).
14 Varianten ohne auffindbaren Hauptartikel bleiben eigenständige Anfrageprodukte.
`altsystem.zwillingsVorschlaege` nennt 7 Zwillinge für kuratierte Produkte, die heute keinen haben
(`64000121a`, `64000122a`, `6320304a`, `6320301-quadrat-ang`, `6320307-5punkt-ang`, `kokosmatte-natur-a`, `kokosmatte-farbig-a`). **Nicht übernommen**, nur als Vorschlag.

## Auswahl steuern: `auswahl-altsystem.json`

Alle Einträge optional, Vorgabe = alle Artikel. `modus` (`alle`/`kauf`/`anfrage`), `varianten`, `ohneBild`, `nurArtikelIds`,
`ausschliessenArtikelIds`, `ausschliessenPfade`, `ausschliessenWarengruppen` (Schlüssel wie `logomatten/bierbankmatten`;
Artikel, die **nur** dort stehen, entfallen). Probiert: ohne Varianten 247 neue, nur Kauf 173, nur mit Bild 302,
Bierbankmatten raus 302, nur bestimmte IDs 0 (deren Artikel sind kuratiert abgedeckt).
Kuratierte Produkte sind davon nie betroffen.

## Preisstamm: `preisstamm-altsystem.json`

Die Brücke liefert **keinen EK je m²** (Befund 5). Deshalb erzeugt der Lauf heute für **0** Artikel `preisdaten`.
So kommen die 82 dazu: Werte je Artikel-ID unter `"artikel"` eintragen (Format steht in der Datei), neu bauen.
Nur Einträge mit `einkaufProQm`, `salesFactor` **und** `standardbreiten` werden zu `preisdaten`; alles andere rechnet weiter über `/api/price`.
`--preisstamm-vorlage` listet die 186 Kandidaten (Artikel mit freien Maßen; vermutlich sind die 82 mit EK darunter). Getestet mit einem Probeeintrag.
Sobald die Brücke den EK mitliefert, ist der Anschluss eine Zeile in `erweitereAusAltsystem` (Wert aus `produkt` statt aus der Datei).

## Prüfung

* **Alter Lauf byteweise identisch:** `node bau-net-daten.mjs --ausgabe <temp>` gegen die heutige `daten.js`: `cmp` ohne Unterschied, SHA-1 beider `e90dbdb3486fa0f3009240ae15d1b46ac984592e`.
* **Stichprobe gegen das Altsystem** (`node pruefe-stichprobe.mjs <datei> <anzahl>`, liest die Seiten direkt von `localhost:8080`;
  prüft Name, Preis, Bild, Attribute, Warengruppe): 10 von 10 stimmen, auch 60 von 60. Bei Varianten ist Name/Bild vom Hauptartikel und wird nicht gegen die Seite geprüft.
* **Strukturprüfung** von `daten-alle.js`: jedes Produkt in einer Kategorie, jede Kategorie-Referenz existiert, Reihenfolge ohne Doppelte.
* **Frontend mit der alten Datei:** `ui-fuchsius-17-09.mjs designmatten-jetprint-velour` = **37/37 bestanden**.
* `node --check` sauber, nur Node-Builtins (neu: `node:crypto` für den Cache-Dateinamen).

## Offene Punkte

1. **EK/m² für die 82** fehlt, bis Herr Fuchsius die Werte liefert oder die Brücke sie ausgibt. Dann nur Datei ergänzen.
2. **Teaser-Artikel (26)** sind nicht übernommen. Ob sie als Hinweiskarten gewünscht sind, ist eine Entscheidung.
3. **15 Namen unsicher** (Varianten ohne eigenen Namen, in der Liste vom Vorgänger geerbt); ein Blick vom Auftraggeber lohnt.
4. **Bilder sind Brückenpfade mit Originalgröße** (Befund 4/7); Verkleinern und verzögertes Laden gehören ins Frontend/die Brücke.
5. Die Blätterung (355 Produkte) und die Menüs auf `warengruppen` umzustellen ist Sache der anderen Agenten.
6. Die Brücke zählt bei Aluminium 80 Artikel, wo die Datenbank 82 hat (Nebenbefund unverändert); hier nicht ursächlich geklärt.
