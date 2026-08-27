# Brücken-Demo: neues Frontend, alter Shop

Diese Demo zeigt eine einzige Sache – und die soll sie zweifelsfrei zeigen:

> **Ein komplett neues Frontend kann Artikel in den Warenkorb des bestehenden
> Shops matten.de legen, ohne dass der Besucher das alte System jemals zu
> Gesicht bekommt.**

Kein Seitenwechsel, kein altes Layout, kein Bruch im Design. Der Besucher
bleibt die ganze Zeit auf der neuen Seite.

---

## 1. Starten

Sie brauchen nur Node.js (bereits installiert, Version 24). **Keine
Installation, kein `npm install`, keine Zusatzpakete.**

1. Eingabeaufforderung oder PowerShell öffnen.
2. In dieses Verzeichnis wechseln:

   ```
   cd "C:\Users\lukas\OneDrive\Desktop\Webseiten\Sale\Matten de\Frontend\bridge-demo"
   ```

3. Server starten:

   ```
   node server.mjs
   ```

4. Im Fenster erscheint eine Zeile wie:

   ```
   Laeuft auf:  http://localhost:8787
   ```

5. Diese Adresse im Browser öffnen. **Das Fenster bitte offen lassen** –
   dort läuft der Server.

> Falls Port 8787 belegt ist, weicht der Server automatisch auf 8788 oder
> 8789 aus. Maßgeblich ist immer die Adresse, die im Fenster steht.

---

## 2. Was Sie sehen

Eine Produktseite der **Bierbankmatte: Pils** im neuen Mattenfuchs-Design.

- Der **Preis** ist nicht eingetippt, sondern wird beim Laden und bei jeder
  Änderung von Menge **oder Bedruckungs-Option** live bei matten.de erfragt.
- **Menge**, **individuelle Bedruckung** und ein **Kommentarfeld** wie im
  alten Shop – nur eben im neuen Gewand.
- Klick auf **„In den Warenkorb"**: Der Button zeigt kurz
  „Wird hinzugefügt …", dann „✓ Hinzugefügt", und von rechts fährt der
  Warenkorb ein – mit Artikel, Attribut, Menge und Gesamtsumme.
- Im Warenkorb führt der Knopf **„Zur Kasse – Bestellstrecke"** weiter.
  Was dort passiert, steht in Abschnitt 5 – **bitte vorher lesen**, dort
  entsteht eine echte Bestellung.
- Ganz unten der dunkle Bereich **„Status"**. Dort steht jeder einzelne
  Aufruf, den der Server gerade an matten.de geschickt hat, samt Antwortcode
  und Dauer.

---

## 3. Der Beweis

Der entscheidende Punkt ist das, was **nicht** passiert: Die Seite lädt nicht
neu, die Adresszeile bleibt auf `localhost`, das alte Shop-Layout taucht nie
auf.

Trotzdem stehen im Status-Bereich Zeilen wie:

```
POST   /warenkorb                              → 302 · 391 ms
GET    /warenkorb                              → 200 · 608 ms
```

Das sind echte Anfragen an matten.de. Und die Zahlen im Warenkorb-Panel –
Artikelname, Menge, Zwischensumme, Versandkosten, Umsatzsteuer, Gesamtsumme –
stammen nicht aus dem neuen Frontend. Sie sind aus der Antwort des alten
Shops herausgelesen.

**Der beste Vorführ-Moment:** Stellen Sie „Individuelle Bedruckung" von
**Nein** auf **Ja** um – ohne sonst etwas anzufassen.

| Auswahl | angezeigter Preis |
|---------|-------------------|
| Nein    | **47,60 €**       |
| Ja      | **56,17 €**       |

Der Preis springt sofort, und im Status-Bereich erscheint dazu eine neue
Zeile. Die 8,57 € Aufschlag hat niemand ins neue Frontend eingetippt – die
kommen aus der Preisauskunft des alten Shops.

Legen Sie den Artikel danach in den Warenkorb. Dort steht derselbe Betrag –
allerdings führt das Altsystem seine Warenkorb-Tabelle **netto**, die
Produktseite dagegen **brutto**. Das Warenkorb-Panel weist deshalb beides
aus:

```
Einzel: 47,20 € netto · 56,17 € brutto
```

Die 56,17 € von oben finden Sie also wieder. Angezeigter und berechneter
Preis gehen nicht auseinander.

> Bei mehreren Stück kann die Hochrechnung auf der Produktseite um einen
> Cent von der Warenkorb-Summe abweichen: Der alte Shop rechnet netto
> weiter und rundet erst ganz am Schluss. Maßgeblich ist immer der
> Warenkorb – die Seite weist bei Menge über 1 eigens darauf hin.

Zweiter Punkt, der leicht übersehen wird: Selbst das **Produktbild** lädt
Ihr Browser nicht bei matten.de, sondern über den Proxy (`/api/img/…`).
Auch die Schriften liegen lokal beim Proxy – die Seiten laden von sich aus
**gar keine** Fremdressource, weder vom Altsystem noch von Google Fonts.

Eine Ausnahme gibt es, und die ist gewollt: die **Beweis-Ansichten**
(`/api/cart/raw`, `/api/kasse/raw`, siehe Abschnitt 5) und der Knopf
„Warenkorb im alten Shop öffnen". Beide zeigen bewusst das Original –
dort lädt der Browser natürlich von matten.de.

Im schwarzen Server-Fenster läuft dieselbe Liste noch einmal mit:

```
[16:03:41] POST /api/cart/add
  [upstream] POST /warenkorb -> 302 - 391 ms
  [upstream] GET /warenkorb -> 200 - 608 ms
```

---

## 4. Gegenprüfen im alten Shop

Im Warenkorb-Panel finden Sie den Knopf
**„Zur Kontrolle: Warenkorb im alten Shop öffnen"**. Der öffnet
`matten.de/warenkorb` in einem **neuen Tab** – die neue Seite bleibt offen.

**Wichtig, damit es keine Verwirrung gibt:** Ihr Artikel ist dort
möglicherweise *nicht* zu sehen. Das ist kein Fehler, sondern die Bauart der
Demo. Die Sitzung beim alten Shop gehört dem Proxy-Server, nicht Ihrem
Browser. Ihr Browser meldet sich in dem neuen Tab mit einer eigenen,
frischen Sitzung an und sieht deshalb einen leeren Warenkorb.

Der belastbare Nachweis ist das Status-Protokoll und das Server-Fenster:
Dort steht, dass matten.de geantwortet und die Positionen bestätigt hat.

*(Im späteren Echtbetrieb würde der Proxy unter derselben Domain laufen und
die Sitzung an den Browser durchreichen – dann sind beide Ansichten
identisch. Für den Nachweis hier ist das nicht nötig.)*

---

## 5. Die Bestellstrecke

> ### ⚠️ Bitte zuerst lesen
>
> Am Ende dieser Strecke entsteht eine **echte Bestellung im Livesystem
> matten.de**. Sie erscheint im Admin-Backend unter *Bestellungen*, und das
> Altsystem verschickt eine Auftragsbestätigung per E-Mail.
> **Löschen Sie die Testbestellung nach der Prüfung dort wieder.**
>
> Angeboten werden nur **Vorkasse** und **Rechnung**. Bei beiden **fließt
> kein Geld** – es entsteht nur ein Datensatz. PayPal und Kreditkarte sind
> gesperrt: Sie würden zum Zahlungsdienstleister Worldline/Ogone
> weiterleiten. Der Proxy lehnt sie mit HTTP 400 ab, noch bevor er das
> Altsystem überhaupt fragt.

Im Warenkorb-Panel finden Sie den dunklen Knopf **„Zur Kasse –
Bestellstrecke"**. Er führt auf `/kasse.html` – weiterhin `localhost`,
weiterhin das neue Design, weiterhin kein Blick auf das alte Frontend.

### Der Ablauf im alten Shop

Der Weg war nicht dokumentiert und wurde durch Sondieren ermittelt. So
sieht er aus:

| # | Aufruf | Felder | Antwort |
|---|--------|--------|---------|
| 1 | `POST /warenkorb` | `attribute[…]`, `anzahl`, `artikel`, `addtocart` | 302 → `/warenkorb` |
| 2 | `POST /warenkorb` | `adresse[land]`, `versandart`, `zahlungsart` | 200, neu gerechnet |
| 3 | `POST /adresse` | `adress[anrede]`, `adress[vorname]`, `adress[name]`, `adress[firma]`, `adress[strasse]`, `adress[plz]`, `adress[ort]`, `adress[land]`, `adress[email]`, `adress[telefon]`, `adress[mobil]`, `adress[fax]`, `adress[uid]`, `adress[bemerkungen]`, `adress[agb]`, `save` | **302 → `/bestellen`** bei gültigen Daten, **200 mit Fehlertexten** bei ungültigen |
| 4 | `GET /bestellen` | – | Übersicht mit dem Absende-Knopf |
| 5 | `POST /bestellen` | `bestellung_abschicken` (ein einziges Feld) | 302 → `/danke` |

Versandarten: `7` = DHL, `11` = pauschal, `12` = DPD, `13` = Spedition.
Zahlungsarten: `VorkassePayment`, `RechnungPayment` (erlaubt) sowie
`OgonePpPayment`, `OgoneCcPayment` (gesperrt).

**Wo sitzt das Konto-Gate? Nirgends.** Der alte Shop verlangt für eine
Bestellung *kein* Kundenkonto – die Adresse wird direkt im Bestellvorgang
erfasst. `/login` funktioniert für vorhandene Konten, aber `/register`
liefert zwar HTTP 200, enthält jedoch **kein Registrierungsformular** –
nur einen Begrüßungstext. Über die Oberfläche lässt sich dort also gar
kein Konto anlegen. Die Kasse zeigt genau das an, wenn Sie in Schritt 1
auf *„Registrierung im Altsystem prüfen"* klicken; die Antwort wird bei
jedem Klick live geholt, nicht aus dieser Datei zitiert.

### Die fünf Schritte im neuen Frontend

1. **Konto** – Anmelden, wenn Sie ein Konto haben. Das E-Mail-Feld bleibt
   leer: Es gehört *Ihre eigene* Adresse hinein. Ohne Konto geht es
   einfach weiter.
2. **Lieferadresse** – **Was Sie selbst eintragen müssen:** Ihre
   E-Mail-Adresse (dorthin geht die Bestätigung), Straße, PLZ, Ort und
   Telefon. Name und Firma sind absichtlich als Testdaten vorbelegt
   („TEST Sehorz (Bitte ignorieren)" / „TESTBESTELLUNG – kein echter
   Auftrag"), damit die Bestellung im Backend sofort als Test erkennbar
   ist. Geprüft wird nicht hier, sondern im alten Shop: Die Meldungen an
   den Feldern („Dies ist ein Pflichtfeld!", „Die angebenene Postleitzahl
   ist ungültig!") stammen wörtlich von dort.
3. **Versand & Zahlung** – Beide Listen kommen aus dem Warenkorb des
   Altsystems. Bei der Zahlungsart stehen nur Vorkasse und Rechnung zur
   Wahl; welche Wege gesperrt sind, steht darunter offen.
4. **Prüfen & Bestellen** – Die vollständige Übersicht, wie das Altsystem
   sie ausgibt. Aufklappbar: **„Was genau abgeschickt wird"** – Methode,
   Adresse, jedes Feld mit Wert und der fertige Body. Erst wenn Sie die
   Kästchen *„Mir ist bewusst, dass dies eine echte Bestellung im
   Live-System erzeugt"* setzen, wird der rote Knopf **„Testbestellung
   verbindlich auslösen"** aktiv.
5. **Ergebnis** – Bestätigung, gegebenenfalls die Bestellnummer, die
   Antwort des Altsystems im Wortlaut und ein Link auf `/api/kasse/raw`:
   die **rohe** Antwortseite von matten.de als Beweis.

### Die Sicherungen gegen versehentliches Auslösen

- Der Server-Endpunkt `/api/kasse/bestellen` verlangt zwingend
  `{ "bestaetigung": "JA-BESTELLEN" }` im Body. Ohne dieses Wort antwortet
  er mit HTTP 400 und tut nichts. Verglichen wird **streng**: Auch
  `["JA-BESTELLEN"]` wird abgelehnt – ein Array würde sich sonst über die
  Typumwandlung von JavaScript an der Prüfung vorbeimogeln.
- Die Zahlungsart wird vierfach geprüft: beim Setzen der Optionen (noch vor
  dem ersten Aufruf ans Altsystem), beim Erzeugen der Vorschau, dort ein
  zweites Mal gegen den Klartext der Übersichtsseite, und noch einmal
  unmittelbar vor dem Absenden. Erlaubt ist dabei immer nur, was auf der
  Positivliste steht – nicht alles, was nicht verboten ist.
- Der Proxy spricht ausschließlich mit `matten.de`. Eine Umleitung auf
  einen fremden Host (etwa zu einem Zahlungsdienstleister) wird abgelehnt,
  statt die Sitzungsdaten dorthin mitzunehmen.

### Die Beweis-Ansichten – eine Einschränkung

`/api/cart/raw` und `/api/kasse/raw` zeigen die **Originalseite** des alten
Shops. Damit sie aussieht wie dort, setzt der Proxy ein `<base>`-Element –
und genau in diesem einen Tab lädt Ihr Browser dann Bilder, Stile und
Skripte **direkt von matten.de**. Überall sonst in der Demo passiert das
nicht (auch die Schriften liegen lokal beim Proxy). Der Banner am oberen
Rand dieser Ansichten sagt es ebenfalls.

Die Originalseite enthält den Knopf *„Bestellung abschicken"*. Der Proxy
schaltet vor der Auslieferung **alle Formulare und Knöpfe ab**
(`onsubmit="return false"` plus `disabled`), damit in einem
`localhost`-Tab kein scharfer Knopf steht, mit dem niemand rechnet.

### Nach der Testbestellung

Im Admin-Backend unter **Bestellungen** nachsehen – die Testbestellung ist
an der Firma „TESTBESTELLUNG" zu erkennen – und dort **löschen**.

---

## 6. Beenden

Im Server-Fenster **Strg + C** drücken. Der Server meldet sich ab und
beendet sich. Die Browser-Seite funktioniert danach nicht mehr – das ist
normal, sie braucht den Proxy.

---

## 7. Grenzen dieser Demo – ehrlich benannt

- Es ist **ein** Produkt fest hinterlegt (Bierbankmatte: Pils, Artikel 278).
  Ein echtes Frontend würde den Katalog auslesen.
- Der finale Bestellvorgang ist gebaut und bis unmittelbar davor geprüft,
  aber **nie ausgelöst worden**. Was das Altsystem nach `POST /bestellen`
  genau antwortet – ob eine Bestellnummer erscheint, wie die Dankseite
  aussieht – ist damit unbestätigt. Die Auswertung ist entsprechend
  vorsichtig gebaut: Findet sie keine Nummer, erfindet sie keine, sondern
  sagt das.
- Eine **Registrierung** ist über das Altsystem nicht möglich (siehe
  Abschnitt 5). Ob eine Bestellung mit angemeldetem Konto anders verläuft
  – etwa mit vorbelegter Adresse –, ist ungetestet: Dafür bräuchte es ein
  echtes Konto.
- Der Proxy liest die Antworten des alten Shops als HTML aus. Ändert
  jemand dort das Layout, muss diese Auswertung nachgezogen werden. Ein
  Dauerbetrieb bräuchte dafür eine saubere Schnittstelle statt HTML-Lesen.
- Die Sitzungen liegen im Arbeitsspeicher. Server neu gestartet heißt:
  Warenkörbe weg. (Abgelaufene Sitzungen räumt der Server selbst weg.)
- Der Server ist bewusst **nur auf diesem Rechner** erreichbar
  (`127.0.0.1`). Er hält fremde Warenkorb-Sitzungen und gehört nicht ins
  Netz – für eine Vorführung am eigenen Laptop ist genau das richtig.
