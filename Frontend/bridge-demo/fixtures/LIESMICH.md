# Belegdateien (Fixtures) für den Anfrage-Weg

Rohe Antworten des Altsystems matten.de, aufgenommen am 10.09.2026 über die
Beweis-Endpunkte der Brücke (`GET /api/cart/raw`, `GET /api/kasse/raw`).
Inhaltlich unverändert; nur `<base>`, das Hinweisbanner und die Entschärfung
der Formulare (`onsubmit="return false"`, `disabled` an Absende-Knöpfen)
stammen von `baueRawHtml()` in `lib/bruecke.mjs`. Die Lieferadresse sind
Testdaten („TEST Sehorz (Bitte ignorieren)", `test-anfrage@example.com`).
**Kein Abschluss wurde ausgelöst** — alle Aufnahmen enden vor
`POST /bestellen`, die Warenkörbe wurden danach geleert.

Geprüft werden die Dateien von `node pruefe-anfrage.mjs` (im Verzeichnis darüber).

| Datei | Inhalt |
|---|---|
| `cart-raw-anfrage.html` | `/warenkorb` mit 1 × Artikel 569 (Logomatte 90 × 120 cm), Preis „auf Anfrage", keine Zahlungsart-Radios, aber `<input type="hidden" name='zahlungsart' value="RechnungPayment">` |
| `bestellen-raw-anfrage.html` | `/bestellen` zum Anfragenkorb (2 × Artikel 569): Überschrift „Anfragenkorb", Knopf `anfrage_abschicken` = „Anfrage abschicken", keine Summen, keine Zahlungsart |
| `cart-raw-kauf.html` | `/warenkorb` mit 1 × Artikel 6302008 (Kauf): Zahlungsart-Radios, `RechnungPayment` angehakt |
| `bestellen-raw-kauf.html` | `/bestellen` zum Kauf: Überschrift „Warenkorb", Knopf `bestellung_abschicken`, Summen, „Zahlungsart: Rechnung" |
| `cart-raw-gemischt.html` | `/warenkorb` mit Kauf **und** Anfrage: wie der Anfragenkorb (verstecktes Feld, keine Radios) |
| `bestellen-raw-gemischt.html` | `/bestellen` dazu: **wird zum Anfragenkorb** — beide Positionen in der Tabelle, Knopf `anfrage_abschicken` |
| `vorschau-anfrage.json` | Antwort von `GET /api/kasse/vorschau` **vor** der Änderung: fälschlich `bereit: false` mit zwei Hürden und leerer Positionsliste |
| `vorschau-kauf.json` | Vorschau-Antwort für den Kauf vor der Änderung (Referenz, war schon richtig) |
| `vorschau-anfrage-neu.json` | Vorschau Anfrage **nach** der Änderung (Live-Gegenprobe): `art: "anfrage"`, `bereit: true` |
| `vorschau-gemischt.json` | Vorschau des gemischten Korbs nach der Änderung: `art: "anfrage"`, `warenkorb.modus: "gemischt"` |

Die Aufnahmen `*-anfrage.*` stammen aus dem Briefing vom 10.09.2026 (Verzeichnis
`mnet/`), die übrigen aus der Live-Gegenprobe desselben Tages auf einer eigenen
Serverinstanz (`node server.mjs`, Port 8788).
