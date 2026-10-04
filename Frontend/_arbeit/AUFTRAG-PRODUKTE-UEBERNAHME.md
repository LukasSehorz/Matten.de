# Auftrag: Alle Produkte von matten.de nach net-neu übernehmen

Wunsch des Auftraggebers (Dieter Fuchsius, übermittelt von Lukas am 02.10.2026):
Alle Produkte, die im Altsystem matten.de eingetragen sind, sollen auch im neuen
Shop (net-neu, Optik von matten.net) erscheinen — mit Preisformel, Farben und
Attributen, so wie sie im Altsystem funktionieren.

## Ausgangslage (gemessen am 03.10.2026)

| | Altsystem matten.de | net-neu heute |
|---|---|---|
| Artikel gesamt | **580** | 19 |
| davon `status = aktiviert` | **385** | — |
| davon Maßware (`spezialoption <> keine`) | 266 | — |
| Kategorien | 29 (22 aktiv mit Artikeln) | 27 |

Aktive Artikel je Kategorie (Auszug, `urlkey`):
gummi_und_kunststoffmatten 51 · fussmatten 47 · standard-schmutzfangmatten 44 ·
matten_fuer_aussenbereiche 40 · matten_fuer_haus_und_heim 40 · bierbankmatten 33 ·
home 22 · wunschdesign-matten 16 · os-physio-rehab-matten 16 · kokosmatten 12 ·
werbematten-dekomatten 9 · service_miet-mattenservice 5 · schnaeppchen 4 ·
neue-artikel 4 · miet-mattenservice 2 · reinigungsprodukte 2 · bodenschutzmatten 2 ·
terrazzo 2 · was-ist-neu 1

## Der entscheidende Unterschied zu heute

Die 19 Produkte in `net-neu/assets/js/daten.js` sind **von Hand gepflegt** — erzeugt
aus `spec/struktur.json` durch `bau-net-daten.mjs`. Das Frontend rechnet Preise
**selbst** aus diesen Daten und fragt das Altsystem nicht.

Bei 19 Produkten ging das. Bei 385 geht es nicht: Jede Preisänderung im Admin müsste
zweimal gepflegt werden. **Die Daten müssen künftig aus dem Altsystem kommen.**

Das ist der eigentliche Kern dieser Aufgabe — nicht „mehr Produkte eintragen",
sondern „die Quelle wechseln".

## Was schon da ist

Die Brücke liefert bereits:
* `GET /api/katalog` — Kategorienbaum (8 oberste, Unterkategorien darunter)
* `GET /api/kategorie?pfad=…` — Produkte einer Kategorie (geprüft: 24 Produkte für
  `/fussmatten/standard-schmutzfangmatten`), mit `name` und `pfad`
* `GET /api/produkt?pfad=…` — ein Produkt mit Attributen, Farben, Preis, Bildern
* `GET /api/img/…` — Bildproxy

Starten gegen das lokale Altsystem:
`cd Frontend/bridge-demo && MATTEN_UPSTREAM=http://localhost:8080 node server.mjs`
(Port 8787; das Startbanner nennt das Ziel.)

## Offene Entscheidung des Auftraggebers

**Welche Artikel sollen in den Shop?** Alle 385 aktiven, oder eine Auswahl? Bei
matten.net sind bewusst 19 kuratiert. Lukas klärt das mit Herrn Fuchsius.
Bis dahin gilt: **so bauen, dass beides geht** — die Auswahl muss eine Einstellung
sein, kein fest verdrahteter Zustand.

## Feste Regeln

* Gearbeitet wird **ausschließlich gegen das lokale Altsystem** (localhost:8080).
  Das Livesystem wird nicht angefasst.
* `POST /api/kasse/bestellen` ist in jeder Form verboten.
* Was beim Testen entsteht (Warenkörbe, Artikel, Anfragen), wird hinterher entfernt.
* Keine Datei im Webverzeichnis des Altsystems hinterlassen
  (`Backup/matten.de-2026-09-07/web/_*.php` muss leer bleiben).
* Deutsch kommentieren, Stil der jeweiligen Datei übernehmen.
* Die Preisformel im Altsystem ist fertig und abgenommen — **nicht anfassen**.
