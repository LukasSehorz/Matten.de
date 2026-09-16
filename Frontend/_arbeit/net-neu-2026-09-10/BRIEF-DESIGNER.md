# Auftrag Designer: den Mattendesigner von matten.net 1:1 nachbauen

**Projekt:** `/Users/lukas.sehorz/Library/CloudStorage/OneDrive-Persönlich/Desktop/Webseiten/Sale/Matten de/Frontend/bridge-demo/`
**Zielverzeichnis:** `public/net-neu/` — der Shop-Rahmen (Kopf, Navigation, Fuß, Warenkorb-Modal, `assets/js/shell.js`,
`assets/js/daten.js`, `assets/css/matten-net.css`, `net-neu.css`) existiert bereits und wird **wiederverwendet**,
nicht neu gebaut. Lies zuerst `public/net-neu/LIESMICH.md` und `assets/js/shell.js`, damit du die Einbindung kennst.
**Kontrakt:** `KONTRAKT-API.md` neben diesem Briefing. **Allgemeine Regeln:** `BRIEF-FRONTEND.md` Abschnitte 1, 2, 10.

## 1. Vorlage

`spec/MATTEN-NET-SPEC.md` **Abschnitt 9** (9.1–9.7) ist die vollständige Beschreibung; `spec/screens/mattendesigner.html`
und `spec/screens/mattendesigner-bestellformular.html` sind das Original-Markup; `spec/screens/ajax-custom-mat-materials.json`
die vier Materialien mit Farben und Größen (auch in `spec/struktur.json.mattendesigner`). Die CSS-Regeln (`.mat-editor`,
88 Vorkommen) stehen schon in `assets/css/matten-net.css`. Live-Vergleich per Screenshot: `https://matten.net/de/custom-mat/create`.

Auf matten.net ist der Designer eine Vue-2-Komponente mit fabric.js. Du baust ihn in **plain JS** mit
`assets/js/vendor/fabric.min.js` (5.3.0, liegt lokal) — dasselbe Markup, dieselben Beschriftungen (Wörterbuch §9.2 wörtlich),
dasselbe Verhalten (§9.4).

## 2. Seiten

| Datei | matten.net | Inhalt |
|---|---|---|
| `mattendesigner.html` | `/de/custom-mat/create` | Hinweisleiste, Hilfe-Modal, `#mat-editor` mit drei Spalten (§9.3), Bestellmodal `#custom-mat-order-modal` |
| `designer-checkout.html` | `/de/custom-mat/checkout` | Formular §9.7 1:1 (`Auftrag verlassen`, `Specification`, Vorschaubild, Tabelle Menge/Mattenart/Breite/Länge, `Bemerkungen`, `Kundendaten`, AGB, Knopf `Auftrag erteilen`) |

## 3. Verhalten, das vom Original abweicht — bewusst

1. **Schriften** (§9.3, 8 Familien): keine Fremdverbindung erlaubt. Lade die woff2-Dateien einmalig von Google Fonts
   herunter (OFL-lizenziert) nach `assets/fonts/designer/` und schreibe `assets/fonts/designer.css` mit `@font-face`
   (Vorgehen wie bei `assets/fonts/nunito.css`: CSS-API mit Chrome-User-Agent abrufen, `url()` auf lokale Pfade umschreiben).
   Familien: Amatic SC (400/700), Anton, Arimo (400/700 — wird als „Arial" angezeigt), Caveat Brush („Brush"), Dancing Script (400/700),
   Finger Paint, Ubuntu (400/700, Voreinstellung), Vast Shadow. Laden über `document.fonts.load()` statt FontFaceObserver;
   Fehlermeldung wie im Original (`Failed to load fonts, please refresh this page.`), aber als Hinweis in der Seite statt `alert`.
2. **Preis** (§9.5 rechnet nur Fläche × Materialpreis): stattdessen **`berechne()` aus `/preisformel.js`** (Excel-Formel, Vorgabe des Kunden)
   mit Stammdaten je Material — JetPrint: EK 52,67 / SF 1,931 · JetPrint_light: 40,85 / 1,87 · JetPrint-Velour: 39,06 / 1,931 ·
   ColorStar: 52,67 / 1,931 (Herleitung: matten.net-Materialpreis 101,71 = 52,67 × 1,931, Spec §14.2 I); Standardbreiten
   `[60, 75, 85, 115, 150, 200]`. Anzeige wie im Original: `€ 1.234,56` gefolgt von `inkl. MWSt. plus Versandkosten` — der Betrag ist
   brutto (×1,19) für die Menge; Versand wird hier nicht addiert (Text sagt „plus Versandkosten"). Steuer über dieselbe
   gekennzeichnete Ausnahmefunktion wie auf der Produktseite (`mitSteuerUndVersand()` in `assets/js/` wiederverwenden, nicht duplizieren).
   Im Bestellmodal `Preis` (je Stück) und `Total` in **€** (Original zeigt fälschlich `£`, Spec §17.6).
3. **Hoch-/Querformat** ist im Original vertauscht (§17.5): `HORIZONTAL` → `Querformat`, `VERTICAL` → `Hochformat` — richtig herum bauen.
4. **Absenden**: Das Altsystem matten.de kennt keinen „Designer-Auftrag" und kann kein Bild entgegennehmen. Deshalb:
   `Auftrag erteilen` auf `designer-checkout.html` tut drei Dinge in dieser Reihenfolge, mit sichtbarem Fortschritt:
   a) `POST /api/cart/add` — Anfrageartikel des Materials mit freien Maßen:
      JetPrint und ColorStar → `/logomatten/6300201-logomatte-a` (Artikel 569: `spezialoption[569][spezial][x]` 20–200, `[y]` 40–700, beide freie Zahlen),
      JetPrint_light → `/logomatten/jetprint_light-matten-a`, JetPrint-Velour → `/logomatten/6400201-velourmatte-a` —
      **nur wenn** deren `masse[]` laut `GET /api/produkt` beide Maße als freie Zahlenfelder führen; sonst ebenfalls 569 und das Material im Kommentar.
      Grundfarbe als `attribute[Grundfarbe]`, wenn der Farbcode (z. B. `601`) dort als Wert (`601-zitronengelb`) existiert.
      Kommentar: `MATTENDESIGNER` · Material · Maß · Format · Menge · Grundfarbe (Code + Name) · Designelemente (je Objekt: Typ, Text, Schriftart, Füll-/Linienfarbe) · Bemerkungen · Kalkulation (netto je Stück · netto gesamt · brutto) · `Vorschaubild liegt beim Kunden (PNG-Download)`.
      Maße außerhalb 20–200 / 40–700 → nur im Kommentar, mit Hinweis in der Seite (wie `public/net/assets/js/seite-designer.js` es löst — dort nachlesen und portieren).
   b) `POST /api/kasse/adresse` mit den Kundendaten (Feldabbildung: title→anrede, firstName→vorname, lastName→name, companyName→firma,
      streetAddress→strasse, postalCode→plz, city→ort, country→land (ISO-Kleinbuchstaben, `de`), phone→telefon, email→email, mobile→mobil, fax→fax, tos→agb).
      `state` (Bundesland) hat im Altsystem kein Feld → in `bemerkungen`. 422-Fehler des Altsystems am jeweiligen Feld anzeigen.
   c) Weiterleitung auf `checkout.html#pruefen` — dort steht die Vorschau des Altsystems und der einzige unumkehrbare Knopf
      (`Anfrage abschicken`). **Du löst ihn nie aus.**
   Das Vorschaubild (`#matDisplay`, PNG aus der Zeichenfläche) bekommt auf dem Bestellformular einen Knopf `Vorschau herunterladen`
   (`<a download>`), damit der Kunde es dem Angebot beilegen kann. Übergabe der Designdaten zwischen den beiden Seiten über
   `sessionStorage` (JSON + Data-URL, try/catch, Fallback: Hinweis „Bitte Design erneut anlegen").
5. **Pflichtfelder** §9.7: Original verlangt Anrede, Nachname, Firmenname, Straße, Stadt, Bundesland, PLZ, AGB — aber **nicht** eMail.
   Das Altsystem verlangt E-Mail und Telefon (Pflichtfelder der Adresse). Kennzeichne eMail und Telefon als Pflicht; Firmenname und
   Bundesland bleiben wie im Original sichtbar, aber nicht Pflicht (das Altsystem kennt sie nicht als Pflicht).

Alles andere **1:1**: Werkzeugliste, Designelemente-Liste mit `active`, `Objekt entfernen` (deaktiviert beim Grundrechteck),
Material/Größe/Format-Selects (Größen als `<height>cm x <width>cm`, Namen roh wie `JetPrint_light`), Menge (1–999, `max-width: 5em`),
Zeichenfläche 800×450 mit Hintergrund `assets/img/mat-editor-background.jpg` und `#F1F1F1`, Grundrechteck `id 99999` mit Schatten,
Maßstab `getScale`, Beispieldesign `Welcome` in Dancing Script + Kreise `#434343`, Beobachter (§9.4, Materialwechsel setzt letzte
Farbe / erste Größe), Design-details-Karte mit allen Bedienelementen und Deaktivierungsregeln, Auswahlrahmen `#2430fa`/`#010dff`,
Entf/Rücktaste löscht das gewählte Objekt, `Diese Matte ordern` deaktiviert bis Material, Größe, Menge, Format, Grundfarbe gesetzt sind.

## 4. Qualität

* `node --check` auf deine JS-Dateien; keine Konsolenfehler in Headless Chrome; Screenshot-Vergleich mit dem Original (Desktop 1280 px).
* Funktionsprobe: Design anlegen (Text + Rechteck), Material JetPrint, Größe 85×120, Menge 2 → Preis = `berechne()`-Referenz
  (schreibe die Referenzrechnung in Node mit `preisformel.js` daneben); `Diese Matte ordern` → Modal → `designer-checkout.html` →
  Kundendaten (Testdaten: `TEST` / `Sehorz (Bitte ignorieren)` / `TESTBESTELLUNG – kein echter Auftrag`, E-Mail `test-anfrage@example.com`)
  → `Auftrag erteilen` → `GET /api/cart` zeigt die Position mit `Mattengröße: 85cm × 120cm` und dem Kommentar, `GET /api/kasse/vorschau`
  zeigt `art: 'anfrage'` (falls die Brücke die Erweiterung schon hat). Danach `POST /api/cart/clear`. **Kein `POST /api/kasse/bestellen`.**
* Keine Fremdressource. Keine Änderung an Dateien, die nicht zum Designer gehören, außer: `assets/js/daten.js` darf um die Materialien
  erweitert werden — dann in `bau-net-daten.mjs`, nicht von Hand. `preisformel.js` unverändert. Nicht committen.

## 5. Abgabe

Abschnitt „Mattendesigner" in `public/net-neu/LIESMICH.md` (Aufbau, Abweichungen mit Grund, offene Punkte) und Bericht an mich:
gebaut, geprüft (Zahlen), nicht gelöst und warum.
