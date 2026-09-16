# Prüfplan: Nachbau matten.net → matten.de (Kontrollagent)

**Projekt:** `/Users/lukas.sehorz/Library/CloudStorage/OneDrive-Persönlich/Desktop/Webseiten/Sale/Matten de/Frontend/bridge-demo/`
**Prüfling:** `public/net-neu/` (Frontend) und die Brücke (`lib/bruecke.mjs`, `server.mjs`, `../netlify/functions/api.mjs`).
**Sollzustand:** `BRIEF-FRONTEND.md`, `BRIEF-DESIGNER.md` (falls der Designer schon gebaut ist), `KONTRAKT-API.md`, `BRIEF-BRUECKE.md`
(alle neben diesem Plan), `spec/MATTEN-NET-SPEC.md`, `spec/struktur.json`, `spec/screens/*.html`, `../UEBERGABE.md` §7 (Kundenwünsche).
Du prüfst gegen diese Vorgaben — nicht gegen deinen Geschmack.

## Grundsätze

* Du **änderst nichts** am Prüfling. Du schreibst Befunde. Hilfsskripte legst du unter dem Verzeichnis dieses Plans ab (`pruefung/`).
* Jeder Befund: **Schwere** (Blocker = verhindert den Kundentest „Angebot anfordern → landet im Backend"; Wichtig = Abweichung von Vorgabe/1:1 oder Funktionsfehler; Kosmetik), **Datei:Zeile**, **Reproduktion** (Befehl oder Klickfolge), **Erwartet** (mit Quelle: Spec-Abschnitt / Briefing-Abschnitt) vs. **Tatsächlich**.
* Keine Vermutungen als Befunde — was du nicht reproduzieren kannst, steht unter „Nicht prüfbar" mit Grund.
* **Nie** `POST /api/kasse/bestellen` mit `bestaetigung: "JA-BESTELLEN"` aufrufen (echter Datensatz im Livesystem). Warenkorb-Operationen sind folgenlos. Nach jedem Test `POST /api/cart/clear` (eigene Cookie-Jar-Sitzung, `-H 'Sec-Fetch-Site: same-origin'`).
* Server: `http://localhost:8787` läuft mit dem aktuellen Code? Prüfe, ob die Brücken-Erweiterung dort aktiv ist (`GET /api/kasse/vorschau` liefert das Feld `art`?). Wenn nicht: eigene Instanz `node server.mjs` (weicht auf 8788/8789 aus) und **dagegen** prüfen; die 8787-Instanz nicht beenden.

## Werkzeuge

* Headless Chrome: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-sandbox --window-size=1280,2400 --screenshot=<png> <url>` und `--dump-dom`, Konsole mit `--enable-logging=stderr --v=0`.
* Für Klickfolgen: Chrome mit `--remote-debugging-port=9222` starten, Ziel über `http://127.0.0.1:9222/json/new?<url>` anlegen, per WebSocket (Node 26 hat `WebSocket` global) `Runtime.evaluate` senden — ein ~60-Zeilen-Treiber genügt (Eingaben setzen + `dispatchEvent(new Event('input',{bubbles:true}))`, Klick per `.click()`, DOM auslesen). Preisformel-Referenz: `import { berechne } from './public/preisformel.js'` in einem Node-Skript.
* Screenshots von matten.net (nur GET) neben Screenshots des Prüflings; beide Bilder mit Read ansehen und vergleichen.

## Prüfblöcke

### A. Statisch
1. `node --check` auf alle JS in `public/net-neu/assets/js/` und `bau-net-daten.mjs`; `node bau-net-daten.mjs` zweimal → identische `daten.js`.
2. Fremdressourcen: `grep -rnoE "(src|href|url)\s*[=(]\s*[\"']?https?://[^\"') ]+" public/net-neu` — erlaubt sind nur angeklickte `href` (Social Media, OS-Plattform, mailto) und der SVG-Namensraum. Alles Geladene muss lokal oder `/api/…` sein.
3. Kein Geldbetrag außerhalb `berechne()` und `mitSteuerUndVersand()`: `grep -nE "\*\s*1\.19|/\s*1\.19|0\.19|\* *anzahl|\* *menge" public/net-neu/assets/js/*.js` und Sichtprüfung der Treffer.
4. Sicherheit der Brücke: `POST /api/kasse/bestellen {}` → 400; `{"bestaetigung":["JA-BESTELLEN"]}` → 400; `POST /api/kasse/optionen {"zahlungsart":"OgonePpPayment",…}` → 400. `BESTELLUNG_GESPERRT=1` (eigene Instanz) sperrt.
5. `node pruefe-preisformel.mjs` → 61/61, `node pruefe-stammdaten.mjs` → 62/62, `node pruefe-anfrage.mjs` (falls vorhanden) grün.

### B. Seiten und Struktur (1:1)
6. Alle Seiten HTTP 200: `index, products, kategorie?slug=<jede der 27>, produkt?slug=<jedes der 19>, checkout, login, register, blog, guest-book, pages?s=<4>, mattendesigner, designer-checkout`. Keine Konsolenfehler (dump-dom mit Logging).
7. Navigation gegen `spec/struktur.json.navigation`: 12 Einträge in der Reihenfolge Spec §3.1, jede Gruppe mit ihren Unterkategorien (Namen wörtlich, Reihenfolge, 26 gesamt), Bildmenü mit Kacheln; mobile Leiste nach §3.2.
8. Kopfzeile/Fuß gegen Spec §2: Logo, Sprachwahl, Gästebuch/Login/Registrieren, `Cart` + `Auschecken` (btn-orange), Suchfeld `Produkt suchen`; Warenkorb-Modal 1:1 (Spalten, Fußzeilen, `Your cart is empty.`, `Weiter einkaufen`); Fußzeile drei Spalten, `© 2026 Mattenfuchs`.
9. Startseite gegen §5: Datenschutzhinweis, Karussell 11 Folien mit Titeln/Untertiteln wörtlich, Featured-Kachel, TOP-ANGEBOTE (5 Karten, richtige Slugs), Mattenfuchs-Text, Vorteilsleiste.
10. Jede Kategorie: Titel, Beschreibung (Spec §15.1), **Produktzahl exakt wie Spec §15.1** (leer bleibt leer), Kartenaufbau, Filter (`Sort by`, drei Optionen, `Filter`).
11. Produktliste §7: 26 Kästchen in 9 Gruppen, Sortierung, 16 + 3 auf zwei Seiten, Suche `?keyword=`.
12. Produktseite §8 für **mindestens** `jetprint-premium` (Fixgrößen + Farben + Custom), `aluminium-profilmatte-typ-diplomat-r` (4 Selects), `kokosmatten-naturfarbig` (Attribut mit Aufschlag), `iron-horse-matte` (EK 0 → Live-Preis/auf Anfrage): Markup-Elemente und Beschriftungen (`Größe`, `Breite`, `Länge`, `Menge`, `Preis`, `inkl. MWSt.`, `In den Warenkorb`, `Make an offer`, Reiter), Fixgrößen-Optionen wörtlich `<Länge> cm x <Breite> cm` mit `data-*`, `Custom`-Option, Sichtbarkeitslogik `custom_size`/`custom_length`, Farbfelder (Nummer sichtbar, Name im `title`, `Mehr Farben Anzeigen`), Bildwechsel bei Farbwahl, die drei Ankreuzzeilen Sonderform/Sonderfarbe, Endpreiszeile, Hinweis bei Wunschmaß.
13. Screenshot-Vergleich (1280 px) matten.net ↔ Prüfling: Startseite, `product-categories/ironhorse`, `products/jetprint-premium`, `custom-mat/create` (falls gebaut). Abweichungen in Layout, Abständen, Farben, Schrift benennen — konkret („Karussell-Höhe 170 statt 240 px").
14. Responsiv: 375 / 768 / 1280 px ohne waagerechten Überlauf (`document.documentElement.scrollWidth <= innerWidth`).

### C. Preisformel (dem Kunden am wichtigsten)
15. Referenz in Node mit `preisformel.js` und den Stammdaten je Produkt (Briefing §6) für: (a) jetprint-premium 40×60, 1 Stk; (b) 50×200, 1 Stk → 101,71 € netto; (c) **90×120, 1 Stk → ×1,25**; (d) 60×90, 5 Stk → Staffel 0,95; (e) 85×120, 2 Stk + Sonderfarbe → +68 € **einmal**; (f) 85×120 + Sonderform mit Rand → ×1,5; (g) 250×250 → Fehler „Matte zu breit"; (h) 29 cm → „zu schmal"/Formulargrenze mit Richtungshinweis; (i) IRON-HORSE (Standardbreiten 85/115/150/200): 60×100 → ×1,25, 85×100 → kein Zuschlag; (j) Kokos natur 30mm → +10,56 €/Stück; (k) Diplomat mit Kratzkante → +35,87 €/Stück. UI-Werte per CDP auslesen und mit der Referenz vergleichen (brutto = netto × 1,19 bzw. `ustSatz`; Endpreiszeile = + Versand des Artikels).
16. Prüfen, dass der **Kommentar** beim Warenkorb-Aufruf die Kalkulation vollständig enthält (`gesendet[]` in der Antwort von `/api/cart/add` bzw. `GET /api/cart` → `kommentar`).

### D. Anbindung ans Altsystem (Kern des Kundentests)
17. Über die UI (CDP): `jetprint-premium`, Fixgröße 40×60, Menge 1, `In den Warenkorb` → `GET /api/cart`: Position auf `/fussmatten/standard-schmutzfangmatten/6300000` mit `Standardgröße: 40cm x 60cm`, Preis des Altsystems (Zeichenkette), Modal offen, Zähler `Cart (1)`.
18. Über die UI: Wunschmaß 90×120, `Make an offer` → Position auf dem `-a`-Zwilling mit `Mattengröße: 90cm × 120cm`, `preis: "auf Anfrage"`, Kommentar mit Kalkulation und `×1,25`.
19. Über die UI: Fixgröße + `Sonderfarbe` angekreuzt + `In den Warenkorb` → Anfrageposition (Zwilling), Hinweis vorher sichtbar.
20. Kasse mit **reinem Anfragenkorb**: `checkout.html` → Adresse (Testdaten, E-Mail `test-anfrage@example.com`) → Schritt Versand/Zahlung wird übersprungen mit Hinweis → Vorschau zeigt `art: 'anfrage'`, Knopf `Anfrage abschicken` (grün), Kästchen sperrt den Knopf, „Was genau abgeschickt wird" zeigt `anfrage_abschicken`. **Nicht klicken.**
21. Kasse mit **Kaufkorb** (`6302008`): Versand/Zahlung erscheint, nur Vorkasse/Rechnung wählbar, Vorschau `art: 'bestellung'`, Knopf `Bestellung abschicken`. **Nicht klicken.**
22. Gemischter Korb: Verhalten gemäß Bericht der Brücke prüfen (Vorschau, Knopf, Hürden) — nicht absenden.
23. Fehlerpfad: Adresse ohne PLZ → 422, Meldung des Altsystems am Feld (wörtlich, z. B. „Dies ist ein Pflichtfeld!").
24. Mengenänderung und Entfernen im Modal → `/api/cart/menge`; Leeren; Zähler.
25. Login mit falschen Daten → ehrliche Meldung des Altsystems; Registrierung → was der Endpunkt liefert, wird angezeigt, nichts erfunden.

### E. Designer (falls gebaut) — gegen `BRIEF-DESIGNER.md`
26. Markup/Beschriftungen §9.2/9.3, Werkzeuge, Objektliste, Design-details, Deaktivierungsregeln, Grundrechteck/Maßstab, Formatbezeichnung richtig herum, Preis = `berechne()`-Referenz (Material JetPrint 85×120 ×2), Modal (€ statt £), Bestellformular §9.7, Ablauf `Auftrag erteilen` → Position im Warenkorb (`Mattengröße`, Kommentar `MATTENDESIGNER …`) → Adresse gesetzt → `checkout.html#pruefen` mit `art: 'anfrage'`. Schriften lokal. Nicht absenden.

## Abgabe

`pruefung/BEFUNDE.md` unter dem Verzeichnis dieses Plans: zuerst die Blocker, dann Wichtig, dann Kosmetik; danach „Geprüft und in Ordnung" (kurz, mit Zahlen: n Seiten 200, n Referenzpreise exakt, …) und „Nicht prüfbar". Screenshots als PNG daneben, im Bericht verlinkt. Zum Schluss eine Einschätzung in zwei Sätzen: Ist der Kundentest (Angebot anfordern → Anfrage im Backend) jetzt möglich — ja/nein, und was fehlt dafür noch?
