# ANBINDUNG.md — das fertige Shop-Design am Altsystem matten.de

Diese Datei beschreibt, was in `bridge-demo/public/shop/` gegenüber dem Design-Original
umgestellt wurde, welche Seite welchen Endpunkt benutzt, was noch Platzhalter ist und wo die
Grenzen liegen.

**Aufrufen:** `node server.mjs` und dann <http://localhost:8787/shop/>.

> **Nachtrag (Umstellung auf Netlify).** Die Fachlogik steht seither nicht mehr in
> `server.mjs`, sondern in `bridge-demo/lib/bruecke.mjs`. `server.mjs` ist nur noch die
> lokale Laufzeitumgebung (HTTP-Server, Dateiauslieferung, Sitzungsspeicher) und
> verhält sich unverändert. Dieselbe `lib/` bedient auch `build-katalog.mjs` und die
> Netlify-Function — es gibt keine zweite Abschrift der Regeln.
>
> Alles, was in dieser Datei über Endpunkte, Feldabbildung und Parser steht, gilt
> weiter. Wo die öffentlich erreichbare Netlify-Fassung anders ist als der lokale
> Server, steht in **[DEPLOY.md](DEPLOY.md)** — insbesondere: der Katalog ist dort ein
> beim Deployment erzeugtes Standbild, während Preise, Warenkorb und Kasse live bleiben.

---

## 1. Was hier liegt

| Ordner | Rolle |
|---|---|
| `Frontend/shop/` | **Design-Quelle. Unverändert.** Läuft weiter als eigenständige statische Demo mit `assets/js/catalog.js` (statisch, 254 Produkte aus einer früheren Analyse). |
| `bridge-demo/public/shop/` | **Arbeitende Kopie.** Dasselbe Design, aber an das Altsystem angeschlossen. |
| `bridge-demo/public/` | Die bestehenden technischen Demo-Seiten (`index.html`, `kasse.html`, `rechner.html`, `preisformel.js`). Unverändert. |

Kopiert wurden: 19 HTML-Seiten, `assets/css/app.css`, `assets/js/*.js`, `assets/fonts/`,
`assets/img/logo.png`, `assets/img/favicon.ico` und `assets/img/szenen/` (16 Layoutbilder für
Hero, Kacheln, Prozessschritte und CTA — sie sind in `index.html` und `mattendesigner.html`
fest verlinkt und gehören zum Layout, nicht zum Katalog).

**Bewusst NICHT kopiert:** `assets/img/original/`, `assets/img/produkte/` (22 MB) und
`assets/img/swatches/`. Produktbilder kommen live über `/api/img/…`. Geprüft: `app.css`
referenziert außer den Schriften keine Bilddatei, `farben.html` arbeitet mit
Inline-Hintergrundfarben statt mit Farbmuster-Bildern. Ebenfalls nicht kopiert:
`assets/js/catalog.js` — die Adresse liefert jetzt der Server (siehe unten).

Neu hinzugekommen ist `assets/js/mattendesigner.js` (der Preisrechner, Abschnitt 7).

Ergebnis: 61 Dateien, 3,5 MB statt 27 MB.

---

## 2. Der Live-Katalog: `GET /shop/assets/js/catalog.js`

Der Kern der Umstellung. Die 19 HTML-Seiten binden unverändert
`<script src="assets/js/catalog.js">` ein — diese Adresse fängt der Server ab und liefert
`window.CATALOG` in **genau der Form**, die die Seitenskripte erwarten. In den HTML-Dateien
musste dafür keine Zeile geändert werden.

### Aufbau in zwei Stufen

Der Katalog vollständig zu bauen kostet rund 390 Anfragen an das Altsystem. Das darf die erste
Seite nicht blockieren, darum:

* **Stufe 1** (rund 25 Anfragen, gemessen **15 s**): Kategoriebaum von der Startseite plus je
  eine Kategorieseite. Ergibt Namen, Bilder, Kurzbeschreibungen, Pfade und die Unterscheidung
  Kauf-/Anfrageartikel. Auf diese Stufe wartet der erste Aufruf.
* **Stufe 2** (365 Anfragen, gemessen **173 s**, Parallelität 4): je Artikel die Detailseite.
  Ergibt **interne Artikel-ID**, Preis, Versandbetrag, Varianten und freie Maßfelder. Läuft im
  Hintergrund; sobald sie fertig ist, liefert dieselbe Adresse die vollständige Fassung.

`window.CATALOG_META.stufe` sagt, welche Fassung gerade ausgeliefert wird; die Kategorieseite
zeigt das in der Filterspalte an. TTL 10 Minuten, danach wird beim nächsten Aufruf **die alte
Fassung sofort ausgeliefert** und im Hintergrund neu gebaut — kein Aufruf wartet je wieder 15 s.

**Obergrenze:** `SHOP_MAX_PRODUKTE = 450` in `server.mjs`. Wird sie überschritten, kürzt der
Server, schreibt `[shop-katalog] GEKUERZT: …` in die Konsole und vermerkt es in
`window.CATALOG_META.gekuerzt` und `.hinweise`. Aktuell: 365 Produkte, nicht gekürzt.

### Feldabbildung

| Feld im Design | Quelle im Altsystem |
|---|---|
| `id` | `artikelId` aus dem versteckten Feld `artikel` des Kaufformulars |
| `slug` | aus dem Namen gebildet (Umlaute transliteriert); bei Namensgleichheit mit dem Pfad eindeutig gemacht |
| `name` | `<h3 class='titel'>` der Kategorieliste; bei den namenlosen Sondermaß-Geschwistern `nameGeerbt` (Name des Hauptartikels); sonst die Artikelnummer |
| `cat` / `sub` / `subName` | Kategoriepfad; die feinere Zuordnung (Unterkategorie) gewinnt |
| `price` / `from` | `produktpreis`-Block der Artikelseite bzw. `price_incomplete_prefix="ab"` |
| `shipping`, `ustSatz` | `betragversand` und „Inkl. Umsatzsteuer x %“ der Artikelseite |
| `teaser` | Kurzbeschreibung aus der Kategorieliste, ersatzweise von der Artikelseite |
| `attrs` | `attribute[…]`- und `spezialoption[…]`-Auswahlfelder mit Anzeigetext **und** Upstream-Wert |
| `colors` | Farbwähler-Radios (`typ: farbwahl`) — Name und Wert, **ohne** Musterbild |
| `custom` | `min`/`max` der freien Maßfelder `spezialoption[…][x|y]` |
| `image` | erstes `/media/…`-Bild, umgeschrieben auf `/api/img/…` |
| **`pfad`** *(neu)* | der Live-Pfad, z. B. `/logomatten/bierbankmatten/6303041` |
| `modus`, `artikelnummer`, `variante`, `details` *(neu)* | Kauf- oder Anfrageartikel, letztes Pfadsegment, namenlose Variante, Stufe-2-Stand |

Felder, die es live nicht gibt, bleiben leer statt erfunden: `sizes: []`, `sizeLabel: null`,
`designs: 0`, kein `features`, kein `badge`, `colors[].swatch: null`. Das steht auch in
`window.CATALOG_META.platzhalter`.

### Messwerte des letzten vollständigen Aufbaus

```
8 Kategorien · 16 Unterkategorien · 365 Produkte
357 mit interner Artikel-ID · 185 mit Listenpreis · 288 mit Bild
187 Kaufartikel · 170 Anfrageartikel · 80 mit freier Maßeingabe · 114 mit Farbwahl
Stufe 2: 365 angereichert, 0 ohne Detailseite
```

---

## 3. Welche Seite benutzt welchen Endpunkt

| Seite | Endpunkte |
|---|---|
| alle 19 Seiten | `GET /shop/assets/js/catalog.js` · `GET /api/cart` (Warenkorbzähler im Kopf) |
| `index.html` | nur Katalog; Bilder über `/api/img/` |
| `kategorie.html` | nur Katalog (Filter, Sortierung, Suche laufen clientseitig auf den Live-Daten) |
| `produkt.html` | `GET /api/produkt?pfad=…` · `GET /api/price?pfad=…&anzahl=…&attribute[…]=…` · `POST /api/cart/add` |
| `warenkorb.html` | `GET /api/cart` · `POST /api/cart/menge` · `POST /api/cart/clear` · Beweislink `GET /api/cart/raw` |
| `kasse.html` | `GET /api/kasse/formular` · `POST /api/kasse/optionen` · `POST /api/kasse/adresse` · `GET /api/kasse/vorschau` |
| `bestellung.html` | `GET /api/kasse/vorschau` (zeigt den echten Stand, **keine** erfundene Bestätigung) |
| `konto.html` | `GET /api/konto` · `POST /api/konto/login` |
| `mattendesigner.html` | `/preisformel.js` (lokal, kein Netz) · `GET /api/produkt` · `POST /api/cart/add` |
| Inhaltsseiten (`farben`, `technik`, `service`, `miet-service`, `unternehmen`, `kontakt`, `versand`, `agb`, `datenschutz`, `impressum`, `widerruf`) | nur Kopf/Fuß und Warenkorbzähler — Inhalt bleibt statisch |

---

## 4. Neu und erweitert im Proxy

Der bestehende `/api/cart/add` war auf den Demo-Artikel 278 mit genau einem Attribut
zugeschnitten. Für 365 Artikel reicht das nicht. Erweitert wurde:

* **`POST /api/cart/add` mit `pfad`** — legt einen beliebigen Katalogartikel in den Warenkorb.
  Der Feldsatz kommt **immer** aus dem Kaufformular der Live-Seite; der Aufrufer darf nur Werte
  für Felder setzen, die es dort gibt, und bei Auswahlfeldern nur Werte, die das Altsystem
  selbst anbietet. Freie Maße werden gegen `min`/`max` des Formulars geprüft. Alles Verworfene
  steht als `abgelehnt: [{feld, grund}]` in der Antwort — nichts rutscht still durch.
  Der alte Aufrufweg (`artikel` + `attribut`) funktioniert unverändert weiter, damit
  `public/index.html` nicht bricht.
* **`POST /api/cart/menge`** *(neu)* — `{key, anzahl}`, `0` entfernt die Position. Die interne
  Funktion `setQuantity()` gab es schon, einen Endpunkt dafür nicht.
* **`GET /api/price` mit `pfad`** — Live-Preis eines beliebigen Artikels. Die Preisadresse wird
  aus dem `price_updates`-Feld der Artikelseite gelesen und gegen Host und Form geprüft.
  Attribute ohne eigenen Wunsch bekommen die Vorauswahl der Live-Seite, damit der angezeigte
  Preis zu der Variante gehört, die die Seite zeigt.
* **`GET /shop/…`** *(neu)* — eigener Static-Handler mit denselben Sicherheitsregeln wie der
  bestehende (`decodeURIComponent`, `\0`-Schutz, `path.normalize`, Präfixprüfung gegen
  Traversal, Content-Type aus der Endung, keine Sitzung für statische Dateien). Zusätzlich:
  `/shop` → 302 auf `/shop/`, Verzeichnis → `index.html`, `max-age=3600` für Schriften und
  Bilder, `X-Content-Type-Options: nosniff`.

---

## 5. Der Warenkorb: was ersetzt wurde

Das Design hielt den Warenkorb in `localStorage` unter `mattenfuchs.cart.v1` und **rechnete die
Beträge selbst** — `MF.cart.totals()` addierte Nettopreise, wandte eine nachgebaute
Versandregel an (bis 1,8 m² 5 €, darüber 10 €, ab 1.000 € frachtfrei) und rechnete 19 % MwSt.
heraus.

Das ist komplett entfallen. In der Kopie ist `MF.cart` eine dünne Schale um den Proxy:

```
laden()   -> GET  /api/cart
add()     -> POST /api/cart/add
setQty()  -> POST /api/cart/menge
clear()   -> POST /api/cart/clear
```

Es gibt keine `totals()` mehr. Zwischensumme, Versandkosten, Umsatzsteuer und Gesamtsumme
werden als **Texte** des Altsystems durchgereicht und unverändert angezeigt („125,85 €“,
„149,76 €“). Auch der Betrag im Kopf ist der Text aus `/api/cart`. Damit kann die Oberfläche
nicht mehr etwas anderes behaupten als die Kasse.

Einzige Ausnahme, wie vorgegeben: der Konfigurator (Abschnitt 7).

---

## 6. Die Kasse — Entscheidung und Begründung

**Entschieden: `kasse.html` im Design ist an die `/api/kasse/*`-Endpunkte angebunden — bis
einschließlich der Vorschau. Der letzte, verbindliche Klick bleibt auf der bestehenden
`public/kasse.html`, dorthin wird sauber verlinkt.**

Was die Design-Kasse jetzt wirklich tut:

1. `GET /api/kasse/formular` — das Adressformular wird **aus dem Live-Formular gebaut**: alle 14
   Felder in der Reihenfolge des Altsystems, Pflichtfelder markiert, die Länderliste (21
   Einträge) und die Versandarten (DHL, pauschal, DPD, Spedition) direkt von dort.
2. Die Zahlungsarten sind die echten. Angeboten werden nur `VorkassePayment` und
   `RechnungPayment`; PayPal und Kreditkarte (Worldline/Ogone) werden **sichtbar als gesperrt
   ausgewiesen** statt verschwiegen.
3. `POST /api/kasse/optionen` setzt Land, Versandart und Zahlungsart in der Sitzung.
4. `POST /api/kasse/adresse` speichert die Lieferadresse — das Altsystem validiert selbst, und
   seine Feldfehler werden an den jeweiligen Eingabefeldern angezeigt.
5. `GET /api/kasse/vorschau` zeigt die Bestellübersicht, die matten.de unter `/bestellen`
   führt, samt offener Hürden und dem vollständigen Wortlaut des finalen Requests.

**Warum der finale Klick nicht hier sitzt:**

* `POST /api/kasse/bestellen` legt eine **echte Bestellung** im Livesystem an und verschickt eine
  Auftragsbestätigung per E-Mail. Für so einen Schritt soll es genau **eine** Stelle im Code
  geben, nicht zwei.
* `public/kasse.html` hat für genau diesen Schritt bereits eine gehärtete Strecke: die
  Rohdarstellung dessen, was rausgeht, eine getippte Bestätigung (`JA-BESTELLEN`), die
  Zahlungsart-Allowlist und den Beweis-Endpunkt für die Rohantwort. Dieses Sicherheitsnetz im
  Design nachzubauen hieße, es zu duplizieren — und duplizierter Sicherheitscode driftet.
* Der kundenseitig interessante Teil — echte Adressvalidierung, echte Versandarten, echte
  Beträge — ist im Design angebunden. Übergeben wird nur der eine unumkehrbare Klick.

Der Design-PayPal-Ablauf (Overlay mit „Zahlung wird verarbeitet“, erfundene Transaktionsnummer)
ist **ersatzlos entfernt**. Er wäre neben einer echten Bestellstrecke irreführend, und der
Proxy lehnt PayPal ohnehin ab.

`bestellung.html` zeigt entsprechend keine erfundene Bestätigung mehr, sondern den echten Stand
aus `/api/kasse/vorschau` — mit der klaren Aussage, dass nichts bestellt wurde.

---

## 7. Mattendesigner

`mattendesigner.html` bekommt die geprüfte Kalkulation aus `public/preisformel.js` (unverändert
eingebunden über `import`, 61 Testfälle, `node pruefe-preisformel.mjs`).

* Eingaben: Breite, Länge, Menge, Ausführung (Colortype 1/2/3), Sonderform ohne Rand,
  Sonderform mit Rand, Sonderfarbe. Live-Ergebnis je Stück und gesamt.
* Aufklappbarer Rechenweg: Schritt-für-Schritt-Tabelle mit der Excel-Zelle je Zeile plus die
  ausgeschriebene Formelzeile. Im Design des Shops gestaltet, nicht als Fremdkörper.
* **Der interne EK-/Margenblock aus `rechner.html` fehlt hier absichtlich** — die Seite ist
  kundenseitig. Es steht kein Einkaufspreis und keine Marge darauf.
* Prominenter Hinweis, dass das ein **Anfragepreis** ist: das Altsystem kennt diese Formel
  nicht und führt für frei konfigurierte Maße keinen Artikel.

**„Als Anfrage übernehmen“ funktioniert.** Es gibt im Altsystem keinen Artikel „freie
Wunschmatte“, aber es gibt **Anfrageartikel** („in den Anfragenkorb“) — 170 Stück, davon 6 unter
`wunschdesign-matten`. Die Seite wählt den passendsten mit freien Maßfeldern (derzeit
*JetPrint™-Matten, in Wunschgröße*, `/logomatten/6300201-logomatte-a`, ID 569) und legt ihn über
`POST /api/cart/add` ab:

* Breite und Länge gehen als **echte Maßfelder** mit (`spezialoption[569][spezial][x]` und
  `[y]`). Im Warenkorb des Altsystems steht danach wirklich „Mattengröße: 90cm × 120cm“.
* Ausführung, Sonderform und der errechnete Anfragepreis gehen in das Kommentarfeld.
* Liegen die Maße außerhalb dessen, was der Anfrageartikel zulässt (Breite 20–200, Länge
  40–700 cm), sagt die Seite das und schickt sie nur als Text im Kommentar.
* Der Warenkorb weist die Position als **„auf Anfrage“** aus, nicht mit dem errechneten Preis.
  Auch das steht auf der Seite.

---

## 8. Ehrlichkeit

* **Einheitlicher Hinweisstreifen** (`.bridgebar`) direkt unter der Navigation auf **allen** 19
  Seiten, eingesetzt von `MF.mount()`: dass es sich um die Brücken-Demo handelt, dass die Daten
  live aus matten.de kommen und dass Produktbilder über `/api/img/` laufen. Dezent, dunkel,
  eine Zeile.
* **Keine automatisch geladene Ressource zeigt auf matten.de.** Geprüft mit einer Suche über die
  gesamte Kopie: die einzigen absoluten Adressen sind der SVG-Namensraum
  `http://www.w3.org/2000/svg` in einer `data:`-URI, ein Textzitat einer Google-Adresse im
  Datenschutztext und der gesetzlich vorgeschriebene OS-Plattform-Link im Impressum (vom Nutzer
  angeklickt, nicht geladen). Ein maschineller Test über alle 365 Produktkarten bestätigt: jedes
  `<img src>` beginnt mit `/api/img/` oder ist der eingebettete Platzhalter.
* **Beweislinks** statt Behauptungen: Warenkorb und Kasse verlinken auf `/api/cart/raw` bzw.
  `/api/kasse/raw` — die unveränderte Rohantwort von matten.de.
* Die Fußzeile zeigt nicht mehr „PayPal · Visa · Mastercard · AMEX · Klarna“, sondern die zwei
  tatsächlich zugelassenen Zahlarten und den Grund für die Sperre der übrigen.
* Die Produktkarten zeigen kein erfundenes „Topseller“-Abzeichen mehr, sondern die einzige
  echte Unterscheidung des Altsystems: Kaufartikel gegen **Anfrage**.
* Artikel ohne Listenpreis stehen als „Preis auf Anfrage“ da, nicht als „0,00 €“.
* Auf `agb.html` und `datenschutz.html` steht ausdrücklich, dass diese Rechtstexte **nicht**
  live geladen werden, sondern eine feste Kopie vom Stand der Analyse sind.

---

## 9. Was noch Platzhalter ist

| Was | Warum |
|---|---|
| `assets/img/szenen/*` (Hero, Kacheln, Prozessschritte, CTA) | KI-erzeugte Stimmungsbilder aus dem Design. Layout, nicht Katalog. |
| Farbmuster-Bilder | Die Farbwähler des Altsystems liefern Name und Wert, aber kein eindeutig zugeordnetes Musterbild. Die Karte zeigt darum „N Farben zur Auswahl“ statt leerer Farbkreise. Die Produktseite zeigt die Farben als benannte Auswahlliste. |
| `farben.html` (Farbpaletten) | Inline-Hexwerte aus der Design-Analyse. Das Altsystem hat dafür eigene CMS-Seiten, aber keine strukturierten Farbdaten. |
| `technik.html`, `service.html`, `miet-service.html`, `unternehmen.html`, `kontakt.html`, `versand.html` und die Rechtstexte | Statischer Inhalt aus dem Design. Bewusst nicht umgestellt — siehe unten. |
| Kundenstimmen auf `index.html` und `unternehmen.html` | Echte Gästebuch-Einträge von matten.de, aber fest im Code. Das Gästebuch hat keinen brauchbaren Endpunkt. |
| Megamenü-Einträge mit `?q=…` (JetPrint™ HD, MONOTON™, IRON-HORSE™, WaterHorse …) | Feste Suchbegriffe aus dem Design. Sie laufen jetzt gegen den Live-Katalog; einige liefern null Treffer, weil das Altsystem die Marke anders schreibt. Die Seite zeigt dann ehrlich „Kein Artikel gefunden“ mit Anfrage-CTA. |
| Kontaktformular auf `kontakt.html` | Nicht angebunden. Das Altsystem hat dafür keinen ansprechbaren Endpunkt (nur ein CMS-Formular mit eigenem Spamschutz). |

---

## 10. Bewusst nicht umgestellt

* **Der finale Bestellklick** — siehe Abschnitt 6.
* **Registrierung** (`konto.html`). `/register` im Altsystem antwortet mit 200, liefert aber
  kein Formular, nur einen Begrüßungstext. Ein Konto lässt sich dort über die Oberfläche nicht
  anlegen. Die Seite sagt das, statt einen Knopf anzubieten, der nichts tut.
* **Inhalts- und Rechtsseiten.** Sie enthalten redaktionelle Texte, keine Katalogdaten. Sie live
  aus dem CMS des Altsystems zu ziehen hieße, dessen Layout-HTML zu übernehmen — genau das, was
  ein neues Frontend nicht erben soll.
* **`public/preisformel.js`, `public/rechner.html`, `PREISFORMEL.md`, `KATALOG.md`,
  `pruefe-preisformel.mjs`** — nicht angefasst, wie vorgegeben. Der Mattendesigner *importiert*
  `preisformel.js`, verändert sie nicht.
* **`Frontend/shop/`** — die Design-Quelle bleibt unberührt und weiterhin als statische Demo
  lauffähig.

---

## 11. Ehrliche Liste der Grenzen

1. **Der erste Aufruf dauert 15 Sekunden.** Danach ist der Katalog im Cache. Wer in diesen
   Sekunden lädt, sieht Stufe 1: Namen und Bilder ja, Preise und Artikel-IDs nein. Die
   Kategorieseite sagt das in der Filterspalte, die Karten zeigen „Preis wird geladen …“.
   Der Vollausbau braucht weitere ~3 Minuten Hintergrundarbeit.
2. **8 von 365 Artikeln haben keine interne Artikel-ID**, weil ihre Detailseite kein
   Kaufformular hat. Sie sind im Altsystem reine Informationsseiten. Die Produktseite zeigt
   dann „Im Altsystem nicht bestellbar“ statt eines toten Knopfs.
3. **Nur 185 von 365 Artikeln haben einen Listenpreis.** Der Rest sind Anfrageartikel — im
   Altsystem bewusst ohne Preis. Das ist kein Parserfehler, sondern die Aussage des Altsystems.
4. **Der Warenkorb kennt keinen Produktpfad.** Die Warenkorbseite ordnet die Positionen dem
   Katalog über den Namen zu, um Bild und Verlinkung zu zeigen. Bei den namenlosen
   Sondermaß-Varianten (`name: null` in der Warenkorbzeile) klappt das nicht — dann steht ein
   Platzhalterbild und kein Link. Sauber wäre ein Schlüssel in der Warenkorbzeile; den liefert
   das Altsystem nicht.
5. **Preise auf Kategoriekarten kommen aus dem Katalog-Cache**, nicht aus einer eigenen
   `/api/price`-Abfrage. Es sind die Listenpreise, die das Altsystem auf der Artikelseite
   ausweist — sie werden nicht gerechnet, nur zwischengespeichert (bis zu 10 Minuten alt).
   Auf der **Produktseite** wird der Preis dagegen bei jeder Änderung von Menge oder Variante
   live über `/api/price` neu geholt. 365 Live-Preisabfragen beim Rendern einer Kategorieseite
   wären dem Altsystem gegenüber nicht vertretbar.
6. **Netto gegen brutto.** Die Artikelseite des Altsystems weist Bruttopreise aus („29,95 €
   inkl. Umsatzsteuer“), die Warenkorbtabelle Nettopreise („25,17 €“) und weist die
   Umsatzsteuer separat aus. Beide Zahlen kommen von dort und werden unverändert gezeigt — für
   einen Kunden kann das trotzdem verwirrend wirken. Umrechnen wollte ich nicht: dann würde
   diese Oberfläche wieder Geld rechnen.
7. **Kategoriezuordnung ist eine Entscheidung.** Dieselbe Matte steht im Altsystem in mehreren
   Kategorien. Der Katalog ordnet jedes Produkt genau einmal zu (Unterkategorie schlägt
   Oberkategorie). Die Zählungen im Frontend beziehen sich auf diese Zuordnung, nicht auf die
   Mehrfachlistung des Altsystems.
8. **Ein Kategoriename ist unschön.** Die erste Hauptnavigation von matten.de heißt
   „Artikelsuche“ und trägt den Schlüssel `was-ist-neu`. Der Name kommt live von dort. Ihr
   Einleitungstext ist die abgetippte Artikelsuche des Shops und wird darum als Teaser
   unterdrückt (Heuristik: mehr als vier „>“).
9. **Nicht im Browser geprüft.** Die Seiten wurden per HTTP abgerufen (alle 19 → 200), die
   Skripte syntaktisch geprüft und die Bausteine von `site.js` gegen den echten Live-Katalog
   durchgerechnet (alle 365 Karten, Kopf, Fuß, Suche, Preisdarstellung). Ein echter Browser-Lauf
   mit Klicks durch alle Zustände hat **nicht** stattgefunden. Ungeprüft sind damit vor allem:
   das Verhalten der Kasse bei abgelehnten Adressen, der Reiterwechsel auf der Produktseite und
   die mobile Darstellung des Rechners.
10. **Der Login ist nicht mit echten Zugangsdaten getestet.** `GET /api/konto` liefert korrekt
    „nicht angemeldet“; ein erfolgreicher `POST /api/konto/login` wurde mangels Konto nicht
    durchgespielt.
11. **Es wurde keine Bestellung ausgelöst.** `POST /api/kasse/bestellen` wurde nie mit gültiger
    Bestätigung aufgerufen. Die Bestellstrecke ist bis zur Vorschau geprüft, der letzte Schritt
    nicht.
12. **Der Katalog hängt am HTML des Altsystems.** Ändert matten.de sein Layout, bricht der
    Aufbau. `GET /api/katalog/diagnose` meldet das mit einer Ampel, bevor es im Frontend als
    fehlende Namen oder Preise auffällt.

---

## 12. Testprotokoll

```
Seiten            19 von 19 HTTP 200 (index … widerruf), Assets 200 mit korrektem Content-Type
/shop             302 -> /shop/          /shop/  200 (index.html)
Katalog           GET /shop/assets/js/catalog.js -> 200, text/javascript, 993 KB
                  gueltiges JS, window.CATALOG mit 8 Kategorien / 16 Unterkategorien / 365 Produkten
                  357 mit Artikel-ID, 185 mit Preis, 288 mit Bild
                  alle Bilder ueber /api/img/, keine matten.de-URL im JS
Warenkorb         vorher leer (count 0)
                  GET  /api/price?pfad=/logomatten/matten_fuer_haus_und_heim/6302008&anzahl=3
                       -> ok, artikelId 329, 29,95 EUR/Stk, 89,85 EUR gesamt, brutto
                  POST /api/cart/add {pfad, anzahl 2, kommentar}
                       -> count 2, 7 Felder gesendet, abgelehnt: []
                  POST /api/cart/menge {key, anzahl 5}
                       -> count 5, Zwischensumme 125,85 EUR, USt 23,91 EUR, Gesamt 149,76 EUR
                  GET  /api/cart  -> gegengelesen, identisch
                  POST /api/cart/clear -> 0 Positionen, gegengelesen leer
Mattendesigner    POST /api/cart/add an Anfrageartikel 569 mit spezialoption[569][spezial][x|y]
                       -> Warenkorb zeigt "Mattengroesse: 90cm x 120cm", Preis "auf Anfrage"
                  Massfeld 900 cm -> abgelehnt "Groesser als das Hoechstmass 200."
                  danach geleert
Kasse             GET /api/kasse/formular -> 14 Adressfelder, 21 Laender,
                       Versandarten DHL/pauschal/DPD/Spedition,
                       erlaubt: VorkassePayment, RechnungPayment
                       gesperrt: OgonePpPayment, OgoneCcPayment
                  KEIN POST /api/kasse/bestellen.
Preisformel       node pruefe-preisformel.mjs -> 61 von 61 Faellen, 884 Einzelwerte, alle exakt
                  Gegenrechnung des Konfigurators gegen vier Sollwerte:
                    50x200 / 1 / CT1 -> 105,49 EUR   (soll 105,49)
                    60x120 / 1 / CT1 ->  75,95 EUR   (soll  75,95)
                    90x120 / 1 / CT1 -> 142,41 EUR   (soll 142,41, Sondermass-Faktor 1,25)
                   120x85  / 1 / CT1 -> 107,60 EUR   (soll 107,60)
Skripte           node --check auf alle 8 Frontend-Dateien -> fehlerfrei
DOM-Rauchtest     site.js gegen den echten Katalog: Kopf, Fuss, Hinweisstreifen, 365 Karten,
                  Suche, Preisdarstellung -> keine Ausnahme, keine matten.de-Adresse
```

Der Server wurde nach dem Test gestoppt.
