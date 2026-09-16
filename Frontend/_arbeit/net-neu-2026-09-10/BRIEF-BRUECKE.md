# Auftrag Brücke: Anfrage-Abschluss im Altsystem unterstützen

**Projekt:** `/Users/lukas.sehorz/Library/CloudStorage/OneDrive-Persönlich/Desktop/Webseiten/Sale/Matten de/Frontend/bridge-demo/`
**Kontrakt (verbindlich):** `KONTRAKT-API.md` im selben Verzeichnis wie dieses Briefing — zuerst lesen.
**Einarbeitung:** `../UEBERGABE.md` (Abschnitte 3, 4, 6, 12), `START.md`, Kopfkommentar von `lib/bruecke.mjs`.

## Ausgangslage

`lib/bruecke.mjs` ist die gesamte Fachlogik; `server.mjs` (lokal), `../netlify/functions/api.mjs`
(Netlify) und `build-katalog.mjs` importieren sie. Es gibt bewusst keine zweite Abschrift der Regeln.

Der Bestellabschluss (`leseVorschau`, `bestellungAbschicken`, Konstante `BESTELL_FELD = 'bestellung_abschicken'`)
kennt nur Kauf-Warenkörbe. Für einen **Anfragenkorb** (nur Anfrageartikel, `modus: 'anfrage'`) zeigt das
Altsystem auf `/bestellen` stattdessen:

```html
<input class='btn btn-success btn-lg pull-right' type='submit' name='anfrage_abschicken' value='Anfrage abschicken'>
```

und **keine** Zahlungsart/Versandart. Die Brücke meldet dann fälschlich „kein Absende-Knopf" und
„Unbekannte Zahlungsart" — der Abschluss ist blockiert. Belegdateien (roh, unverändert vom Altsystem,
mit Testadresse „TEST Sehorz (Bitte ignorieren)"):

* `mnet/bestellen-raw-anfrage.html` — `/bestellen` mit Anfragenkorb (2 × Artikel 569, 90×120 cm)
* `mnet/cart-raw-anfrage.html` — `/warenkorb` mit Anfragenkorb
* `mnet/vorschau-anfrage.json` — heutige (falsche) Vorschau-Antwort der Brücke dazu
* `mnet/vorschau-kauf.json` — Vorschau-Antwort für einen Kaufartikel (Referenz, funktioniert)

(alle unter dem Verzeichnis dieses Briefings)

## Aufgabe

1. **Parser der Übersichtsseite** (`/bestellen`): beide Knöpfe erkennen. Ergebnis `art: 'bestellung' | 'anfrage' | null`,
   `absendeknopf`, `absendeknopfText` (wörtlich). Die Positionen der Tabelle unter „Anfragenkorb" genauso
   auslesen wie unter „Warenkorb" (`items`, Preis „auf Anfrage" bleibt Zeichenkette).
2. **`leseVorschau`**: Hürden gemäß Kontrakt (bei `art === 'anfrage'` keine Zahlungsart-Hürde; bei
   `'bestellung'` unverändert; bei `null` wie bisher). `finalRequest.felder` = das tatsächlich vorhandene Feld.
3. **`bestellungAbschicken`**: das vorhandene Feld senden. Zahlungsart-Sperre nur, wenn das Altsystem eine
   Zahlungsart führt; **Ogone bleibt immer gesperrt**, `JA-BESTELLEN` bleibt Pflicht, `BESTELLUNG_GESPERRT`
   sperrt beides. Antwort um `art` ergänzen.
4. **`readCartMitOptionen` / `/api/kasse/formular`**: Anfragenkorb ohne Optionsformular ist kein Fehler —
   leere Listen zurückgeben.
5. **Gemischter Korb** (Kauf + Anfrage): empirisch klären, was `/warenkorb` und `/bestellen` dann zeigen
   (welcher Knopf, ob Zahlungsart verlangt wird). Nur bis zur Vorschau, **nie absenden**. Verhalten so
   umsetzen, dass der vorhandene Knopf gesendet wird; Ergebnis in `UEBERGABE.md` §4 dokumentieren.
6. **`server.mjs` und `../netlify/functions/api.mjs`** prüfen: Enthalten sie eigene Logik zu Zahlungsart
   oder Absendeknopf, die nachgezogen werden muss? Beide müssen dieselbe Semantik liefern.
7. **Tests**: `pruefe-anfrage.mjs` anlegen, der den Parser gegen die Rohdateien prüft (Belegdateien nach
   `bridge-demo/fixtures/` kopieren, kurze `LIESMICH.md` dazu). `node pruefe-preisformel.mjs` (61/61) und
   `node pruefe-stammdaten.mjs` (62/62) müssen weiterhin bestehen.
8. **Live-Gegenprobe** auf einer eigenen Serverinstanz: `node server.mjs` weicht automatisch auf 8788/8789
   aus, wenn 8787 belegt ist (die Adresse steht im Fenster). Anfrageartikel legen:
   `POST /api/cart/add {"pfad":"/logomatten/6300201-logomatte-a","anzahl":1,"werte":{"spezialoption[569][spezial][x]":"90","spezialoption[569][spezial][y]":"120"},"kommentar":"TEST - bitte ignorieren"}`,
   Adresse setzen (Testdaten wie in den Belegdateien, E-Mail `test-anfrage@example.com`), `GET /api/kasse/vorschau`
   → `art: 'anfrage'`, `bereit: true`, `absendeknopfText: 'Anfrage abschicken'`, `items` gefüllt.
   Dasselbe für Kauf (`/logomatten/matten_fuer_haus_und_heim/6302008`, Optionen `de/7/RechnungPayment`) →
   unverändert `art: 'bestellung'`, `bereit: true`. Danach `POST /api/cart/clear`. **Kein `POST /api/kasse/bestellen`.**
9. **Doku**: `UEBERGABE.md` §3.3/§4 und `START.md` §5 um den Anfrage-Weg ergänzen (kurz, sachlich, im Stil der Dateien).

## Nicht anfassen

`public/preisformel.js`, `pruefe-preisformel.mjs`, `pruefe-stammdaten.mjs`, `public/net/` (alter Shop, Referenz),
`public/net-neu/` (baut parallel ein anderer Agent). Keine npm-Abhängigkeiten — nur Node-Builtins.
Nicht committen.

## Stil

Kommentare und Bezeichner deutsch, wie in `lib/bruecke.mjs`. Kommentare erklären das *Warum* (Eigenheiten des
Altsystems), nicht das Offensichtliche. Kein Sicherheitsmerkmal entfernen oder umgehen.

## Abgabe

Kurzer Bericht: was geändert (Datei/Funktion), was die Gegenprobe ergab (mit den Antwort-Feldern), was der
gemischte Korb tut, welche Tests laufen, was offen ist. Zahlen und Feldnamen wörtlich, nichts beschönigen.
