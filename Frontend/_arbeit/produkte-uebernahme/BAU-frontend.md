# Bau Frontend: Anzeige für bis zu 385 Produkte

Stand 04.10.2026. Geändert: `seite-produkte.js`, `seite-kategorie.js`, `net-neu.css` (alles unter `Frontend/bridge-demo/public/net-neu/assets/`). Nichts sonst angefasst.

## Was gebaut ist
1. **Verzögertes Bildladen:** Kartenbilder bekommen `loading="lazy" decoding="async"`. Weil `Shell.produktkarte` in `shell.js` liegt (nicht meine Datei), wird das Markup in beiden Seiten-Skripten nachbearbeitet (kleiner Helfer `karte()`). Breite/Höhe 256x170 standen schon im Markup; zusätzlich fester Rahmen per CSS (`aspect-ratio: 256/170`, `object-fit: contain`), damit nichts springt und fremde Bildformate nicht verzerrt werden. Im Original-CSS gibt es keine feste Bildgröße außer `width:100%`.
2. **Blätterung Kategorieseite:** 16 je Seite, gleiche Leiste wie `products.html` (`?page=n`). `kategorie.html` hat kein Blätter-Markup (HTML durfte ich nicht ändern), also entsteht die Leiste in JS im selben Aufbau. Eine Seite = keine Leiste.
3. **Leiste gekürzt:** erste, letzte, aktuelle +-2, dazwischen „…". Fehlt nur eine Zahl, steht die Zahl. Gilt für beide Seiten. Leiste darf umbrechen (375 px).
4. **Platzhalter:** vorhandener grauer Kasten (`card-img-leer`) zeigt jetzt den Produktnamen (max. 4 Zeilen). Vorher fix 170 px hoch, bei zweispaltigem Handy-Raster zu hoch gegenüber den Bildern; jetzt gleiches Seitenverhältnis. Zusätzlich: ein Bild, das nicht lädt (404), wird zum Platzhalter.
5. **Leere Kategorien: bewusst NICHT geändert.** `LIESMICH.md` (Abschnitt 1 und 3) sagt: leer wie im Original, und es ist keine kaputte Seite (Kopf, Filter, Fuß stehen). Falls Lukas bei den neuen Warengruppen doch einen Hinweis will: eine Zeile in `seite-kategorie.js`.

## Prüfung
- `ui-fuchsius-17-09.mjs designmatten-jetprint-velour`: **37/37**, keine Konsolenfehler.
- Echte Daten (19 Produkte): Produktliste 16+3 Karten, Leiste „« Vorherige | 1 | 2 | Nächste »", Kategorie Designmatten 5 Karten ohne Leiste, kein Überlauf, optisch unverändert.
- Testweise 366 Produkte per Skript in `window.NET` eingespielt (keine Datei geändert; Skripte im Scratchpad): Leiste bei 25 Seiten, Seite 1 `1 2 3 … 25`, Seite 13 `1 … 11 12 13 14 15 … 25`, Seite 25 `1 … 23 24 25`. Kategorie mit 51 Produkten: 4 Seiten. Bilder lazy 100 %, Platzhalter mit Namen, kaputte Bilder werden Platzhalter, kein waagerechter Überlauf bei 1280 und 375, keine Konsolenfehler. Screenshots angesehen.
- Screenshots: `bau-frontend-bilder/` (produkte-1280-s13, produkte-375-s13, kategorie-1280-s2, kategorie-375-s2, kategorie-375-leer, echt-*).

## Hinweise
- Der Helfer `karte()` ist in beiden Dateien doppelt. Sobald `shell.js` frei ist, gehört `loading="lazy"` und der Namens-Platzhalter in `produktkarte()`; dann kann der Helfer weg (er ist harmlos, wenn beides doppelt wäre: das `replace` greift dann nicht mehr doppelt-kritisch, bitte trotzdem prüfen).
- Offen (nicht Teil des Auftrags): Filterkästchen der Produktliste (Befund 4), Suche über die Brücke.
