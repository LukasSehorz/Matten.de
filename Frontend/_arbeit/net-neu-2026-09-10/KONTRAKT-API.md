# API-Kontrakt der Brücke — Stand 10.09.2026 (verbindlich für Frontend UND Brücke)

Basis: `http://localhost:8787` (lokal, `bridge-demo/server.mjs`). Alle POSTs als JSON mit
`Content-Type: application/json`; der Server verlangt `Sec-Fetch-Site: same-origin`
(Browser setzen das automatisch, curl braucht `-H 'Sec-Fetch-Site: same-origin'`).
Die Sitzung läuft über ein Cookie, das der Server setzt (curl: `-c jar -b jar`).

## Unverändert (existiert, wird vom Frontend so benutzt)

| Aufruf | Zweck |
|---|---|
| `GET /api/produkt?pfad=<matten.de-Pfad>` | Artikeldetail: `name, modus ('kauf'\|'anfrage'\|null), kaufbar, artikelId, preis{text,wert,versandText,versand,ustSatz,brutto}, hauptbild, bilder[], attribute[{feld,typ('auswahl'\|'farbwahl'),optionen[{wert,label,gewaehlt}]}], masse[{feld,typ:'zahl',min,max,vorgabe}], beschreibung, ...` |
| `GET /api/price?pfad=…&anzahl=N&<feldname>=<wert>…` | Live-Preis des Altsystems für eine Variante (nur Kaufartikel) |
| `POST /api/cart/add` `{ pfad, anzahl, werte:{ '<feldname>': '<wert>', … }, kommentar }` | Artikel in den Warenkorb des Altsystems. **Parameter heißt `werte`, nicht `attribute`.** Schlüssel = echte Feldnamen aus `attribute[]`/`masse[]` (z. B. `attribute[Standardgröße]`, `attribute[Grundfarbe]`, `spezialoption[459][spezial][x]`). Antwort: `{ ok, count, items[], gesamt, hinzugefuegt:{pfad,artikelId,anzahl,modus}, gesendet[], abgelehnt:[{feld,grund}] }` |
| `GET /api/cart` | `{ count, items:[{key,name,attribut,kommentar,anzahl,preis,preisNum,summe,summeNum,pfad,bild}], gesamt, gesamtNum, zwischensumme, versand, umsatzsteuer, ustSatz }` — bei Anfrageartikeln `preis: "auf Anfrage"` |
| `POST /api/cart/menge` `{ key, anzahl }` | Menge ändern, `0` entfernt |
| `POST /api/cart/clear` `{}` | Leeren |
| `GET /api/cart/raw` | Rohe Warenkorbseite von matten.de (Beweis) |
| `GET /api/konto` · `POST /api/konto/login {email,passwort}` · `POST /api/konto/register {…}` | Konto |
| `GET /api/kasse/formular` | `{ warenkorb, optionen:{ land:{optionen,gewaehlt}, versandart:{optionen,gewaehlt}, zahlungsart:{optionen,abgelehnt,gewaehlt} }, konto, adressfelder:[{name,label,pflicht}], laender:[{wert,label}], adresse:{…vorbelegte Werte} }` |
| `POST /api/kasse/optionen` `{ land:'de', versandart:'7', zahlungsart:'RechnungPayment' }` | Nur bei Kauf-Warenkörben. Zahlungsart-Allowlist: `VorkassePayment`, `RechnungPayment`; Ogone → 400 |
| `POST /api/kasse/adresse` `{ anrede, vorname, name, firma, strasse, plz, ort, land:'de', email, telefon, mobil, fax, uid, bemerkungen, agb:true }` | 200 `{gespeichert:true}` oder 422 `{gespeichert:false, fehler:[{feld, …Meldung des Altsystems}]}` |
| `GET /api/kasse/vorschau` | siehe unten (erweitert) |
| `POST /api/kasse/bestellen` `{ bestaetigung:'JA-BESTELLEN' }` | siehe unten (erweitert). **Erzeugt einen echten Datensatz im Livesystem.** |
| `GET /api/kasse/raw` | Rohe `/bestellen`-Seite bzw. Antwort nach dem Absenden |
| `GET /api/img/<pfad>` | Bildproxy (Allowlist) |

## Erweiterung durch die Brücke (NEU — das Frontend baut dagegen)

### Hintergrund (empirisch belegt am 10.09.2026)

Das Altsystem führt zwei Betriebsarten desselben Weges `/warenkorb → /adresse → /bestellen`:

| | Kaufartikel („In den Warenkorb") | Anfrageartikel („in den Anfragenkorb") |
|---|---|---|
| Warenkorbseite | Versandart + Zahlungsart wählbar | **keine** Versand-/Zahlungsauswahl |
| `/bestellen` Überschrift | Warenkorb | **Anfragenkorb** (gleiche Tabelle: Beschreibung · Preis · Menge · Summe, Preis „auf Anfrage") |
| Absende-Knopf | `<input type='submit' name='bestellung_abschicken' value='Bestellung abschicken'>` | **`<input type='submit' name='anfrage_abschicken' value='Anfrage abschicken' class='btn btn-success'>`** |
| Zahlungsart im Formular | vorhanden | **nicht vorhanden** (`gewaehlt: null`, `optionen: []`) |

Was bei gemischten Körben (Kauf + Anfrage) passiert, ist **unbekannt** und von der Brücke
empirisch zu klären (nur bis zur Vorschau, nicht absenden).

### `GET /api/kasse/vorschau` — erweitert

```json
{
  "ok": true,
  "bereit": true,
  "huerden": [],
  "art": "anfrage",                       // NEU: "bestellung" | "anfrage" | null (kein Knopf gefunden)
  "uebersicht": {
    "adresseText": "…",
    "items": [ { "beschreibung": "…", "preis": "auf Anfrage", "anzahl": 2, "summe": "auf Anfrage" } ],   // NEU: auch für Anfragenkorb gefüllt
    "zwischensumme": null, "versand": null, "umsatzsteuer": null, "gesamt": null,
    "zahlungsartText": null,
    "absendeknopf": true,                   // true, wenn EINER der beiden Knöpfe da ist
    "absendeknopfText": "Anfrage abschicken" // NEU: Beschriftung wörtlich vom Altsystem
  },
  "finalRequest": { "methode": "POST", "url": "https://matten.de/bestellen", "felder": [ { "name": "anfrage_abschicken", "wert": "Anfrage abschicken" } ] },
  "warenkorb": { … wie /api/cart … },
  "optionen": { … }, "konto": { … }, "upstream": [ … ]
}
```

Regeln für `huerden`/`bereit`:
* `art === 'anfrage'`: **keine** Hürde „Unbekannte Zahlungsart" — das Altsystem bietet für Anfragen keine Zahlungsart an. Hürden bleiben: fehlende Adresse, fehlender Knopf.
* `art === 'bestellung'`: wie bisher (Zahlungsart muss gesetzt und auf der Allowlist sein).
* `art === null` (kein Knopf): `bereit: false`, Hürde wie bisher.

### `POST /api/kasse/bestellen` — erweitert

* Sperre 1 unverändert: `bestaetigung === 'JA-BESTELLEN'` (strikt).
* Sperre 2 angepasst: Die Zahlungsart-Prüfung greift, **wenn das Altsystem eine Zahlungsart führt** (Kauf). Bei `art === 'anfrage'` gibt es keine — dann darf sie nicht blockieren. **Ogone bleibt in jedem Fall gesperrt.**
* Gesendet wird **das Feld, das die Übersichtsseite anbietet** (`anfrage_abschicken` oder `bestellung_abschicken`), nie ein erfundenes.
* Antwort: `{ ok, art: 'anfrage'|'bestellung', bestellnummer|null, status, finalUrl, rohantwort, gesendet, upstream }`.
* `BESTELLUNG_GESPERRT=1` sperrt weiterhin beides.

### `GET /api/kasse/formular` — Verhalten bei Anfragenkorb (KORRIGIERT nach Umsetzung, 10.09.2026)

* `optionen.zahlungsart.optionen` ist `[]`, `gewaehlt: null`, neu `versteckt: "RechnungPayment"` (das Altsystem führt
  für Anfragen ein verstecktes Feld). **Versandart bleibt wählbar** (`versandart.optionen` hat 4 Einträge, DHL vorgewählt).
* Das Frontend erkennt den Anfragenkorb an **`warenkorb.modus`** (`'kauf' | 'anfrage' | 'gemischt' | null`, neu in
  `/api/cart`, `/api/kasse/formular`, `/api/kasse/vorschau`) — nicht an leeren Listen. Bei `'anfrage'`/`'gemischt'`:
  Zahlungsart-Auswahl weglassen (mit Satz „Für eine Anfrage verlangt das Altsystem keine Zahlungsart."), Versandart
  anbieten, wenn Optionen da sind.

### Gemischter Korb (empirisch, beide Reihenfolgen geprüft)

**Ein einziger Anfrageartikel macht den ganzen Korb zum Anfragenkorb.** `/bestellen` zeigt dann nur `anfrage_abschicken`,
keine Summen, keine Zahlungsart; die Kaufposition steht mit Preis in der Tabelle, wird aber **nicht bestellt**.
Brücke: `art: 'anfrage'`, `warenkorb.modus: 'gemischt'`, `bereit: true`. Folgen für das Frontend:
* Vor `Make an offer` (und vor jedem Wunschmaß-/Zuschlags-Kauf, der zur Anfrage wird) warnen, wenn der Korb schon
  Kaufpositionen enthält: „Ihr Warenkorb wird damit zur Anfrage — die bereits enthaltenen Artikel werden nicht bestellt,
  sondern mit angefragt."
* Im Warenkorb-Modal und in der Kasse bei `modus: 'gemischt'` denselben Hinweis zeigen.
* `/api/cart.gesamt` liefert beim Anfragenkorb einen **internen** Betrag des Altsystems (z. B. `"147,48 EUR"`), obwohl die
  Positionen „auf Anfrage" sind — **nicht anzeigen**; bei `modus !== 'kauf'` steht in der Summenzeile `auf Anfrage`.

### Weitere neue Felder (additiv)

`uebersicht.korb` (`"Warenkorb"`/`"Anfragenkorb"`, wörtlich aus dem Altsystem), `uebersicht.absendeknopfName`
(`bestellung_abschicken`/`anfrage_abschicken`), `uebersicht.items[].modus` und `.beschreibung`, `POST /api/kasse/bestellen`
antwortet mit `art` auch im 409-Fall (`huerden`). Kauf ohne gesetzte Zahlungsart → 409 mit `huerden` (früher 400).

## Regeln, die für beide Seiten gelten

1. Im Browser wird kein Geldbetrag gerechnet — Ausnahmen: `preisformel.js` (`berechne()`) und die eine gekennzeichnete Funktion `mitSteuerUndVersand()`. Beträge des Altsystems werden als Zeichenketten durchgereicht.
2. Keine Ressource wird von einem fremden Host geladen (kein matten.de direkt, kein Google Fonts, kein CDN). Bilder des Altsystems nur über `/api/img/`.
3. Sicherheitsmerkmale der Brücke werden nicht aufgeweicht (Allowlist Zahlungsarten, JA-BESTELLEN, Host-Bindung, Bildproxy-Allowlist, `BESTELLUNG_GESPERRT`).
4. Der finale `POST /api/kasse/bestellen` wird von **keinem Agenten** ausgelöst — den Test macht Lukas Sehorz selbst. Alles bis zur Vorschau darf und soll geprüft werden; Warenkorb-Operationen sind folgenlos (nichts landet im Admin).
5. Nach Tests am Livesystem den Warenkorb leeren (`POST /api/cart/clear`).
