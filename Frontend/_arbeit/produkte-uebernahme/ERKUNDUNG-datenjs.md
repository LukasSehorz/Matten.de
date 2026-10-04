# Erkundung: Wie daten.js heute entsteht und wie das Frontend es nutzt

Stand 03.10.2026 · nur gelesen und gemessen, kein Code geändert.
Gemessen gegen das lokale Altsystem (localhost:8080, Datenbank im Container
`altsystem-lokal-db-1`, nur SELECT) und die Brücke (localhost:8787, nur GET).

Pfade in diesem Bericht sind relativ zu `Frontend/bridge-demo/`.

---

## 0. Kurzfassung

* `public/net-neu/assets/js/daten.js` (3.818 Zeilen, `window.NET = {...}`) wird von
  `bau-net-daten.mjs` **offline** erzeugt. Es spricht nie mit der Brücke oder dem
  Altsystem (nur die Option `--pruefen` ruft die Brücke auf, um die Zuordnungspfade
  zu testen).
* Die **Produkte** (19) kommen aus `spec/struktur.json`, einer Abschrift der
  Webseite matten.net vom 31.08.2026. Preisstammdaten, Fixgrößen und Attribute
  stehen dort fest und stammen nicht aus matten.de.
* Die **Zuordnung** matten.net-Produkt → matten.de-Artikel (`dePfad`, `deZwilling`)
  ist eine **von Hand geschriebene Tabelle im Skript** (`ZUORDNUNG`, 19 Einträge),
  nicht in `struktur.json`. Der Block `zuordnungMattenDe` in `struktur.json`
  (7 Schlüssel, Methodik und Begründungen) wird vom Skript nicht gelesen.
* Das Frontend rechnet den Preis selbst (`berechne()` aus `public/preisformel.js`)
  mit `preisdaten` aus daten.js. Das Altsystem liefert zur Laufzeit nur Farben,
  Maßfelder, Versand, Steuersatz und Bilder (`GET /api/produkt`) sowie bei vier
  Produkten ohne EK-Preis den Live-Preis (`GET /api/price`).

---

## 1. `bau-net-daten.mjs` Schritt für Schritt

Aufruf: `node bau-net-daten.mjs` (schreibt daten.js) · `--pruefen` (zusätzlich: jeden
Zuordnungspfad einmal über die Brücke prüfen, `kaufbar === true`).
Nur Node-Bordmittel. Ausgabe deterministisch (kein Zeitstempel).

### Eingaben (alle im Projekt, nichts aus dem Netz)

| Datei | liefert |
|---|---|
| `spec/struktur.json` | Kopf, Navigation, Fuß, **27 Kategorien**, **19 Produkte**, `mattendesigner.pfad` |
| `public/net-neu/assets/img/manifest.json` | Original-URL (matten.net) → lokale Bilddatei. `lokal()` setzt jedes Bild darüber um, fehlt es auf der Platte, bleibt das Feld `null` |
| `spec/texte/produktbeschreibungen.md` | Reiter „Beschreibung" (Wortlaut, je Slug ein `<p>`) |
| `spec/texte/agb.md`, `impressum.md`, `data-protection.md`, `datenschutzerklarung-dsgvo.md`, `blog.md` | `texte` |
| `spec/texte/products-uebersicht.md` | `gruppen` (26 Kategorie-Kästchen, IDs des Originals) |
| `spec/screens/startseite.html` | Karussell, Datenschutzhinweis, Mattenfuchs-Text, TOP-ANGEBOTE, Vorteile, Kartenbilder |
| `spec/screens/kategorie-beispiel-ironhorse.html` | Kartenbilder |
| `spec/screens/produkt-beispiel-jetprint-premium.html`, `produkt-beispiel-diplomat-r-mit-attributen.html` | Farbfelder (Nummer, Name, Hex) und Beschreibungs-HTML dieser zwei Produkte |
| `spec/screens/ajax-custom-mat-materials.json` | Farbpalette Designer, Materialien des Mattendesigners |
| im Skript fest eingetragen | `ZUORDNUNG`, `KARTEN_LISTE`, `ATTRIBUT_BESCHRIFTUNG`, `DESIGNER_STAMM`, `DESIGNER_STANDARDBREITEN`, `LAENDER_CODES`, Schriften |

### Ablauf

1. `struktur.json` und Manifest laden.
2. **`ZUORDNUNG`** (Abschnitt 1 im Skript): je matten.net-Slug `dePfad`, `deZwilling`,
   `anmerkung`. Stand 10.09.2026, alle Pfade damals über `/api/produkt` als kaufbar
   geprüft. Fünf Einträge sind in `anmerkung` selbst als „unsicher" oder „geraten"
   gekennzeichnet (Iron-Horse ×2, JetPrint light Logo, Designmatten JetPrint light,
   Diplomat).
3. Helfer: `lokal()` (Bild über Manifest), `lokalerPfad()` (matten.net-Adresse →
   Seite im Nachbau), Markdown-/HTML-Hilfen.
4. Kopfzeile, Navigation, Fußzeile aus `struktur.json` übernehmen (Links umgebogen).
5. **Farbpalette `farben`**: Regex über die Farbfelder der zwei Beispielseiten
   (`<label … style="background-color:#…" title="Name">Nummer</label>`) plus die
   Farben der Designer-Materialien. Ergebnis: 53 Einträge Nummer → `{name, hex}`.
6. **Kategorien**: 1:1 aus `struktur.json` (`slug, name, gruppe, beschreibung,
   titelbild, produkte[]` als Liste von Slugs).
7. **Produkte**: je Eintrag in `struktur.json.produkte`
   * Attribut-Beschriftungen für drei Fälle überschreiben (`ATTRIBUT_BESCHRIFTUNG`,
     weil die Abschrift dort Farbnummern statt Beschriftungen hat),
   * `bilder` über Manifest auf lokale Dateien,
   * `kachel` (Kartenbild): 1. `KARTEN_LISTE`/Karten aus den Beispielseiten,
     2. `product_thumbnail`-Fassung des ersten Bildes, 3. erstes Bild,
   * `kategorien` rückwärts aus den Kategorien abgeleitet,
   * `beschreibung`: HTML der Beispielseite (2 Produkte), sonst Text aus
     `produktbeschreibungen.md`,
   * `preisdaten`, `fixgroessen`, `standardbreitenSelect`, `customOption`,
     `attribute`, `artikelnummer`, `productId`, `name` **unverändert** aus
     `struktur.json`.
   * `produktReihenfolge` = Reihenfolge in `struktur.json` (höchste productId zuerst
     = „Latest").
8. `gruppen` aus der Markdown-Tabelle `products-uebersicht.md`.
9. `startseite` aus `startseite.html` (Regex auf das Markup).
10. `texte`, `laenderCodes` (249 ISO-Codes, fest im Skript), `mattendesigner`
    (Materialien aus dem Ajax-JSON, dazu **von Hand im Skript** `preisdaten` und
    `dePfad` je Material, 8 Schriften, Hintergrund, Beispielbild).
11. `NET = {...}` als `window.NET = <JSON>;` mit einem Kopfkommentar „ERZEUGT …,
    nicht von Hand ändern" nach daten.js schreiben. Kurzbericht in der Konsole
    (Zahl der Kategorien/Produkte/Farben, Produkte ohne Kartenbild).

---

## 2. `window.NET` als kommentiertes Beispiel

Oberste Schlüssel (16): `quelle, erfasstAm, kopfzeile, navigation, fusszeile,
kategorien, kategorieReihenfolge, produkte, produktReihenfolge, gruppen, zuordnung,
farben, startseite, texte, laenderCodes, mattendesigner`.

```js
window.NET = {
  quelle: "https://www.matten.net (deutsche Fassung, /de)",   // Herkunft der Abschrift (nur Information)
  erfasstAm: "2026-08-31",                                    // Datum der Abschrift (nur Information)

  kopfzeile: {                       // Rahmen (shell.js)
    logo: { href: "index.html", img: "assets/img/…", breite: 1024, hoehe: 197 },
    sprachwahl: { aktuell: "Deutsch", optionen: [ { label, href, title, flagge } ] },
    links: [ { label, href } ],      // Login, Registrieren, Blog …
    warenkorbKnopf: { label }, checkoutKnopf: { label, href },
    suche: { formAction: "products.html", feld: "keyword", platzhalter: "…" }
  },
  navigation: { eintraege: [         // Hauptmenü
    { typ: "link",   label: "Mattendesigner", href: "mattendesigner.html" },
    { typ: "gruppe", label: "Fussmatten",
      kategorien: [ { label, slug, href: "kategorie.html?slug=…", bild: "assets/img/…"|null } ] }
  ] },
  fusszeile: { spalten: [ { titel, links: [ { label, href, icon } ], inhalt } ],
               cards: "assets/img/cards.png", copyright, newsletterWidget: { label, platzhalter, knopf } },

  // ---------- Kategorien (27) -------------------------------------------
  kategorieReihenfolge: ["jetprint-einfarbig", "ironhorse", "ironhorse-xl", …],  // 27 Slugs
  kategorien: {
    "ironhorse": {
      slug: "ironhorse",
      name: "IronHorse",
      gruppe: "Fussmatten",                      // Oberbegriff aus der Navigation
      href: "kategorie.html?slug=ironhorse",
      beschreibung: "Die schön&sauber-Iron-Horse®-Fussmatte …",   // Text mit Entities, Seite setzt textContent
      titelbild: "assets/img/uploads/5c47fa2b58b3djpeg.jpeg",      // lokale Datei oder null
      produkte: ["iron-horse-matte-2", "iron-horse-matte", "iron-horse-1-farbige-und-melierte-schmutzfangmatten"]
                                                  // Slugs, Reihenfolge = „Latest" auf der Kategorieseite
    }
    // 27 Stück; 13 haben Produkte, 14 sind leer (leere Kategorien bleiben leer)
  },

  // ---------- Produkte (19) ---------------------------------------------
  produktReihenfolge: ["os-5-punkt-rehab-trainingsmatte-c", …],   // 19 Slugs, productId absteigend
  produkte: {
    "jetprint-premium": {
      productId: 6,                    // ID auf matten.net; geht in das Formularfeld #product_id
      slug: "jetprint-premium",        // Schlüssel in NET.produkte UND in NET.zuordnung
      name: "JetPrint-Premium",        // Anzeigename (Titel, Karte, Kommentar im Warenkorb)
      href: "produkt.html?slug=jetprint-premium",    // Link der Karte
      artikelnummer: "6300000N",       // Nummer auf matten.net, NICHT die von matten.de ("6300000")
      preisdaten: {                    // Stammdaten der Preisformel (siehe Abschnitt 4)
        einkaufProQm: 52.67,           // EK je m² netto
        salesFactor: 1.931,            // Verkaufsfaktor
        standardbreiten: [60, 75, 85, 115, 150, 200],   // Rollenbreiten → Sondermaß ×1,25 wenn keine Seite trifft
        sondermassFaktor: 1.25,        // wird vom Frontend NICHT gelesen
        singleColorFaktor: 0.9         // wird vom Frontend NICHT gelesen
      },
      fixgroessen: [                   // Auswahlliste „Größe", Preise von matten.net
        { sizeId: "343", price: 24.2, width: 60, length: 40, label: "40 cm x 60 cm" }
        // price = Festpreis auf matten.net, nur als data-price im <option>; gerechnet wird trotzdem berechne()
      ],
      standardbreitenSelect: [60, 75, 85, 115, 150, 200],   // Auswahl „Breite" bei FIXED+CUSTOM_LENGTH
      customOption: "FIXED+CUSTOM_SIZE",   // null | "FIXED+CUSTOM_SIZE" → Eintrag „Custom" in der Größenliste
      attribute: [                         // Auswahlfelder (hier leer); Beispiel Diplomat:
        // { formularname: "attributes[0]", beschriftung: "Höhe",
        //   optionen: [ { value: "1825", label: "12mm" }, … ] }
      ],
      bilder: ["assets/img/produkte/601-zitronengelb.jpg"],   // lokale Großbilder (kann leer sein)
      kachel: "assets/img/produkt-kacheln/JPrint-005.jpg",    // Kartenbild oder null
      kategorien: ["designmatten"],        // rückwärts aus kategorien[].produkte gebildet
      beschreibung: "<p><strong>schön&amp;sauber JetPrint …</strong>…"   // fertiges HTML
    }
    // 19 Stück
  },

  // ---------- Zuordnung matten.net → matten.de ---------------------------
  zuordnung: {                          // Schlüssel = Produkt-Slug
    "jetprint-premium": {
      dePfad: "/fussmatten/standard-schmutzfangmatten/6300000",     // Kaufartikel im Altsystem
      deZwilling: "/fussmatten/standard-schmutzfangmatten/6300000-a", // Anfrageartikel „-a" mit freien Maßen, oder null
      anmerkung: "einzige Nummer, deren Basis übereinstimmt …"       // nur Dokumentation, kein Code liest sie
    }
  },

  // ---------- Farbpalette (53) ------------------------------------------
  farben: {                             // Schlüssel = Farbnummer (String)
    "200": { name: "Anthrazit", hex: "#5f5f5f" },
    "305": { name: "Rot",       hex: "#b51a00" },
    "601": { name: "Zitronengelb", hex: "#fffe28" }
  },

  gruppen: [                            // products.html: Filterleiste, 9 Gruppen / 26 Kästchen
    { label: "Fussmatten", kategorien: [ { id: 2, label: "JetPrint-einfarbig", slug: "jetprint-einfarbig" } ] }
  ],
  startseite: { datenschutzhinweisHtml, karussell: [ { bild, alt, href, titel, untertitel } ],
                featured: { ueberschrift, slug, href, bild, caption },
                topAngebote: ["iron-horse-1-farbige-…", "iron-horse-matte", …],   // 5 Produkt-Slugs
                mattenfuchsText, vorteile: [ { bild, alt, text } ] },
  texte: { agb: { titel, html }, impressum: {…}, "data-protection": {…},
           "datenschutzerklarung-dsgvo": {…}, blog: [ { titel, slug, datum, absaetze } ] },
  laenderCodes: ["AD", "AE", …],        // 249
  mattendesigner: {                     // Mattendesigner, nicht Teil der Produktübernahme
    pfad, materialien: [ { id, name, description, price, colors: [ { id, code, name, RGBColor, sortPosition } ],
                           sizes: [ … ], preisdaten: { einkaufProQm, salesFactor, standardbreiten },
                           dePfad, anmerkung } ],
    schriften: [ { displayName, fontFamily } ], hintergrund, beispielbild
  }
};
```

### Wertebereiche der Produktfelder (gemessen an den 19 Produkten)

| Feld | Vorkommen |
|---|---|
| `preisdaten` | 15 Produkte mit `{einkaufProQm>0, salesFactor, standardbreiten[], sondermassFaktor 1.25, singleColorFaktor 0/0.9/1}`. 4 Produkte (pid 4, 12, 26, 40) mit `{einkaufProQm: 0, hinweis: "Kein Einkaufspreis hinterlegt …"}` → Preis kommt live vom Altsystem |
| `customOption` | `null` (11) oder `"FIXED+CUSTOM_SIZE"` (8) |
| `fixgroessen` | 0 bis 9 Einträge; Iron-Horse-Mietmatte hat 7 mit `price: null` |
| `standardbreitenSelect` | leer oder 4 bis 6 Zahlen |
| `attribute` | leer bei 15; Diplomat 4, Hinweismatten 2, Kokos farbig 1, Kokos natur 1 (Mattenhöhe) |
| `bilder` | 0 bis 4 lokale Dateien |

### Was aus `struktur.json` NICHT in daten.js landet

`pfad` (matten.net-Adresse), `nameLautPreisdienst`, `gewichtProQm`, `anzahlProdukte`
je Kategorie, der Block `zuordnungMattenDe` (Begründungen), `preismodellProdukte`,
`ajaxEndpunkte`, `seiten`, `nichtVorhanden`.

---

## 3. Wer liest was? Feld → verwendet in

Dateien liegen unter `public/net-neu/assets/js/`.

### Produkt (`NET.produkte[slug]`, im Code `P`)

| Feld | verwendet in |
|---|---|
| `productId` | `seite-produkt.js` (verstecktes Feld `#product_id`) |
| `slug` | als Schlüssel; `S.param('slug')` in `seite-produkt.js`; `href` baut darauf |
| `name` | `shell.js` `produktkarte()` (Titel, alt); `seite-produkt.js` (Titel, Brotkrumen, Bild-alt, Kommentar „ARTIKEL: …", Stammdaten `bezeichnung`); `seite-produkte.js` (Stichwortsuche, Sortierung); `seite-kategorie.js` (Sortierung) |
| `href` | `shell.js` `produktkarte()` |
| `artikelnummer` | `seite-produkt.js` `stammdatenAufbauen()` (Feld `artikelnummer` der Stammdaten; Anzeige nirgends) |
| `preisdaten.einkaufProQm` | `seite-produkt.js` (`einkaufBekannt` > 0 schaltet zwischen eigener Rechnung und Live-Preis, ob Rand/Form/Sonderfarben-Felder erscheinen, Kommentar „Kalkulation") |
| `preisdaten.salesFactor` | `seite-produkt.js` → `salesfactorMehrfarbig` |
| `preisdaten.standardbreiten` | `seite-produkt.js` → `standardbreiten` (steuert Sondermaß ×1,25, größte = maximale Breite) |
| `preisdaten.sondermassFaktor`, `singleColorFaktor`, `hinweis` | **von keinem Skript gelesen** (die Preisformel nimmt Sondermaß 1,25 aus `STAMMDATEN_VORGABE`; der Colortype ist fest 1) |
| `fixgroessen[]` (`sizeId`, `price`, `width`, `length`, `label`) | `seite-produkt.js` `orderFormHTML()` (Größenliste, `data-price/width/length`), `aufbauen()` (Vorbelegung: erste Fixgröße) |
| `standardbreitenSelect` | `seite-produkt.js` `orderFormHTML()` (Auswahl „Breite") |
| `customOption` | `seite-produkt.js` (Eintrag „Custom", CSS-Klasse `custom_size`/`custom_length`, Wunschmaß-Erkennung); zusätzlich Ersatz: bei `null` aber freien Maßen im Altsystem wird „Custom" trotzdem angeboten |
| `attribute[]` (`formularname`, `beschriftung`, `optionen[{value,label}]`) | `seite-produkt.js` `attributeHTML()`, `attributSelectHTML()`, Vorbelegung, `werteFuer()` (Abgleich der Optionstexte mit dem Altsystem), `attributAufschlag()`, Kommentar |
| `bilder[]` | `seite-produkt.js` `bilderHTML()` (Großbild und Miniaturen); leer → `artikel.hauptbild` des Altsystems |
| `kachel` | `shell.js` `produktkarte()` (Startseite, Produktliste, Kategorie) |
| `kategorien[]` | `seite-produkt.js` `krumen()` (erste Kategorie als Brotkrume); `seite-produkte.js` (Filter nach Kästchen) |
| `beschreibung` | `seite-produkt.js` (Reiter Beschreibung, `innerHTML`) |

### Übrige Schlüssel

| Schlüssel | verwendet in |
|---|---|
| `produktReihenfolge` | `seite-produkte.js` (Liste „Latest") |
| `produkte` (als Ganzes) | `seite-start.js` (TOP-ANGEBOTE über `startseite.topAngebote`), `seite-kategorie.js`, `seite-produkte.js`, `seite-produkt.js` |
| `kategorien[slug].name / beschreibung / titelbild / produkte / href` | `seite-kategorie.js` (Kopf, Text, Hintergrundbild, Kartenliste); `seite-produkt.js` (Brotkrume: `name`, `href`) |
| `kategorien[slug].gruppe`, `slug` | nicht direkt gelesen (die Navigation hat ihre eigene Liste) |
| `kategorieReihenfolge` | nur im Build (Reihenfolge von `Produkt.kategorien`), im Browser nicht |
| `gruppen` | `seite-produkte.js` (Filterleiste, Abbildung Kästchen-ID → Kategorie-Slug) |
| `zuordnung[slug].dePfad` | `seite-produkt.js` (`GET /api/produkt?pfad=…` beim Laden, Kommentar „Zuordnung matten.de"); `shell.js` `lokalerProduktPfad()` (Warenkorbzeile → Link zur Produktseite) |
| `zuordnung[slug].deZwilling` | `seite-produkt.js` (zweiter `/api/produkt`-Aufruf); `shell.js` `lokalerProduktPfad()` |
| `zuordnung[slug].anmerkung` | nirgends im Frontend |
| `farben[nummer].name / hex` | `seite-produkt.js` `farbgruppenAus()` (Farbfeld-Hintergrund; Hex nur, wenn Nummer UND Name zur Palette passen) |
| `startseite.*` | `seite-start.js` |
| `texte.*` | `seite-inhalt.js` |
| `laenderCodes` | `seite-konto.js` |
| `kopfzeile`, `navigation`, `fusszeile` | `shell.js` |
| `mattendesigner.*` | `seite-designer.js` (Materialien, Farben, Größen, Schriften, Hintergrund), `seite-designer-checkout.js` (`material.dePfad`) |
| `quelle`, `erfasstAm` | nirgends gelesen |

Folgerung für den Umbau: Ein Produkt, das die Seiten fehlerfrei zeigen soll, braucht
mindestens `slug, name, href, kachel, kategorien, beschreibung` (Karte und Liste)
und für die Detailseite zusätzlich `productId, artikelnummer, preisdaten, fixgroessen,
standardbreitenSelect, customOption, attribute, bilder` sowie einen Eintrag in
`zuordnung`. Außerdem müssen `produktReihenfolge`, `kategorien[].produkte` und (für
die Filterleiste) `gruppen` zu den neuen Produkten passen.

---

## 4. `seite-produkt.js`: vom Eintrag in daten.js zum angezeigten Preis

### 4.1 Laden

1. `?slug=…` → `P = NET.produkte[slug]`, `Z = NET.zuordnung[slug]`. Unbekannt →
   „Produkt nicht gefunden".
2. `laden()` holt über die Brücke **zwei Artikel des Altsystems**:
   `GET /api/produkt?pfad=<Z.dePfad>` → `artikel` (Kaufartikel) und, falls
   `Z.deZwilling` gesetzt, `GET /api/produkt?pfad=<Z.deZwilling>` → `zwilling`
   (Anfrageartikel). Schlägt das fehl, bleibt die Seite benutzbar: Preis wird
   berechnet, Farben und Warenkorb fehlen.
3. `aufbauen()` setzt Titel, Beschreibung, Bilder, Farbfelder, Attributfelder,
   Bestellformular.

### 4.2 Welcher Wert wo herkommt

| Anzeige | Quelle |
|---|---|
| Name, Beschreibung, Brotkrumen | daten.js (`name`, `beschreibung`, `kategorien`) |
| Bilder | daten.js `bilder`; fehlen sie, `artikel.hauptbild` des Altsystems (über `/api/img`) |
| Größenliste, Breite-Auswahl | daten.js (`fixgroessen`, `standardbreitenSelect`, `customOption`) |
| Grenzen Breite/Länge | Formular 40–200 × 40–700, verschärft durch `masse[].min/max` des Zwillings (sonst des Kaufartikels) |
| Auswahlattribute (Höhe, Format …) | daten.js `attribute` |
| **Farbfelder** | **Altsystem**: Attribute mit `typ === 'farbwahl'` (bevorzugt `artikel`, sonst `zwilling`) |
| Steuersatz, Versand | **Altsystem**: `artikel.preis.ustSatz` (Vorgabe 19), `artikel.preis.versand` (null = „Versand laut Angebot") |
| Preis | siehe 4.3 |

### 4.3 Preisweg

**A) Produkt mit `preisdaten.einkaufProQm > 0` (15 von 19)**

1. `stammdatenAufbauen()` baut aus den daten.js-Feldern die Stammdaten:
   `artikelnummer = P.artikelnummer`, `bezeichnung = P.name`, `colortype = 1`,
   `salesfactorMehrfarbig = preisdaten.salesFactor`,
   `ekListenpreisProQm = preisdaten.einkaufProQm`,
   `standardbreiten = preisdaten.standardbreiten`,
   `aufschlagSonderfarbeEK = 54` (**fest im Code**). Alles Übrige (Staffel,
   Sonderform ×1,3/×1,5, Sonderfarbe 68 €, Teuerungszuschlag, Mindest-/Höchstmaß)
   kommt aus `STAMMDATEN_VORGABE` in `public/preisformel.js` (Excel-Vorgabe, für
   alle Produkte gleich).
2. `berechne({breite, laenge, menge, sonderformOhneRand, sonderformMitRand,
   sonderfarbe, sonderfarbenAnzahl}, stammdaten)` liefert netto je Stück und gesamt.
3. `mitSteuerUndVersand()` addiert: Attributaufschlag, Steuersatz (aus dem
   Altsystem, sonst 19), Versand (aus dem Altsystem). **Attributaufschläge sind fest
   im Code** (`ATTRIBUT_AUFSCHLAG = { '1838': 35.87, '166': 10.56 }`, nur für
   Diplomat „mit Kratzkante" und Kokos „30mm").
4. Anzeige: Betrag (Ware brutto), „Plus x € Versandkosten", Endpreis.
   „Standard"/„Spezial" folgt aus `faktorBreiteFuer()` (trifft eine Seite eine
   Standardbreite aus `preisdaten.standardbreiten`?) und den Zuschlägen.

**B) Produkt ohne EK (`einkaufProQm = 0`: pid 4, 12, 26, 40)**

`GET /api/price?pfad=<artikel.pfad>&anzahl=…&<werte>` — der Preis wird vom
Altsystem gerechnet (netto/brutto wie dort, `bruttoBereits`). Ist der Artikel im
Altsystem ein Anfrageartikel (`modus !== 'kauf'`), steht „Preis auf Anfrage".
Der Zwilling spielt hier keine Rolle für den Preis.

**Nicht benutzt für den Preis:** `fixgroessen[].price` (nur als `data-price`
Attribut im `<option>`), `preisdaten.sondermassFaktor/singleColorFaktor`.

### 4.4 Felder für Farben

* Die Farbgruppen kommen aus dem Altsystem (`/api/produkt` → `attribute[]` mit
  `typ: 'farbwahl'`, Optionswerte wie `601-zitronengelb`, `IH-646-black-pearl`,
  `Anthrazit-200`, plus `default`, das ausgeblendet wird).
* `farbTeile()` zerlegt den Wert in Nummer und Name (drei Schreibweisen).
* **Hex** aus `NET.farben[nummer]`, aber nur, wenn Nummer **und** Name zur
  Palette passen. Sonst: Muster-Bild aus den Bildern des Altsystems, deren
  Dateiname den Farbwert und `_farboption` enthält; sonst graues Feld
  („color-unbekannt").
* Das Produktbild wechselt mit der Grundfarbe: Bild des Altsystems, dessen
  Dateiname den Farbwert enthält (`bildZurFarbe()`).

Gemessen am 03.10.2026 gegen das lokale Altsystem für alle 21 Zuordnungspfade:

| Altsystem-Artikel | Farboptionen | davon mit Hex aus `NET.farben` |
|---|---|---|
| 6300000 / -a, 6300201-logomatte / -a, jetprint_light-matten / -a, 6400201-velourmatte / -a, os-physio-rehab (Quadrat, 5-Punkt, Stern) | 43 bis 89 | **alle** |
| jetprint_matten-light-einfarbig / -a | 43 | alle |
| Aluminium 52601 / -a | 5 | alle |
| 64000121 (Iron Horse) | 5 | **0** (`IH-646-black-pearl` …) |
| 64000122 (Iron Horse) | 4 | **0** |
| Kokos (3 Artikel), Mietmatte, beflockte Kokosmatte | 0 | – |

Die Palette (53 Nummern) deckt also genau die JetPrint-/Designer-/Diplomat-Farben
ab. Für Iron Horse zeigt die Seite das Muster-Bild aus dem Altsystem. Für jeden
anderen Artikel mit Farben, die nicht in der Palette stehen, gäbe es graue
Felder.

### 4.5 Felder für die Zuordnung zum Altsystem

* `dePfad` = Pfad des **Kaufartikels** im Altsystem (`urlkey` mit Kategorie, wie
  ihn `GET /api/kategorie` als `pfad` liefert). Wird geladen, liefert Farben,
  Standardgrößen-Auswahl (`attribute[Standardgröße]`), Maßfelder, Versand, Steuersatz.
* `deZwilling` = Pfad des Anfrageartikels `…-a` mit freien Maßen
  (`spezialoption[<id>][spezial][x|y]`). Wird gebraucht, sobald die Wahl
  Wunschmaß/Sonderform/Sonderfarbe enthält oder „Angebot anfordern" gedrückt wird.
  Gibt es keinen Zwilling: erst der Kaufartikel selbst, wenn er freie Maße kennt,
  sonst der **fest im Code stehende Universalartikel**
  `/logomatten/6300201-logomatte-a` (`UNIVERSAL`, Artikel 569, x 20–200,
  y 40–700), mit dem Produkt im Kommentar.
* `weg()` entscheidet das nach „Zielartikel nach Fähigkeit"; `werteFuer()` setzt
  nur Felder, die der Zielartikel wirklich kennt. `POST /api/cart/add` mit
  `{pfad, anzahl, werte, kommentar}`.
* Rückweg Warenkorb → Produktseite: `shell.js lokalerProduktPfad()` sucht in
  `NET.zuordnung` nach `dePfad` oder `deZwilling`.

---

## 5. `spec/struktur.json`: die 19 Produkte

Datei 3.179 Zeilen. Oberste Schlüssel: `meta, kopfzeile, navigation, fusszeile,
seiten, nichtVorhanden, ajaxEndpunkte, kategorien, produkte, mattendesigner,
preismodellProdukte, zuordnungMattenDe`.

Jedes Produkt hat 13 Felder: `productId, slug, name, pfad, artikelnummer,
preisdaten, fixgroessen, standardbreitenSelect, customOption, attribute, bilder,
nameLautPreisdienst, gewichtProQm`. `bilder` sind Original-URLs von
matten.net (`/media/cache/single_product_image/uploads/…`).

Herkunft der Angaben (laut `meta`/`methodik`): Abschrift der Webseite matten.net
vom 31.08.2026 (HTML der Produktseiten) und der dortigen Preisdienst-Antworten.
`preismodellProdukte` beschreibt die Formel von matten.net
(`VKjeStück = qm × EK(Staffel) × SalesFactor × fSondermaß × fSingleColor + Extra`).
`zuordnungMattenDe` enthält für jedes Produkt Name, Nummer, Sicherheitsurteil
(„sicher", „wahrscheinlich", „unsicher") und Begründung des Abgleichs.

Die 27 Kategorien tragen `slug, name, gruppe, pfad, beschreibung, titelbild,
anzahlProdukte, produkte[{slug,name}]`; 13 haben Produkte, 14 sind leer.

---

## 6. Von Hand gepflegt, nicht automatisch ableitbar

Zur Einordnung: Gegen das lokale Altsystem gemessen (SELECT auf `artikel`):

| Altsystem | Anzahl |
|---|---|
| Artikel mit `spezialoption = keine` (Festpreis, kein Maß) | 194 aktiv · 120 inaktiv |
| `flaeche` / `umfang` / `laenge` | 79 / 17 / 13 aktiv |
| **`spezial`** (Maßware mit Wunschmaß) | **82 aktiv** · 15 inaktiv |
| Artikel mit Feld `input_squaremeter_price_ek` (EK je m²) und `input_squaremeter_price` (VK je m²) in `spezialoption_data` | **nur die 82 aktiven + 15 inaktiven `spezial`-Artikel**, bei `flaeche/umfang/laenge/keine`: 0 |
| Artikel mit gepflegten `pf_*`-Feldern der neuen Preisformel (Admin-Block „Preisformel (Excel-Mappe)") | **0** (Felder gebaut, noch nichts eingetragen) |
| Anfrage-Zwillinge (`urlkey` endet auf `-a`) | 96 |

### 6.1 Was in daten.js von Hand entsteht und im Altsystem fehlt oder abweicht

| Angabe in daten.js | Herkunft heute | Im Altsystem vorhanden? |
|---|---|---|
| `preisdaten.einkaufProQm` | Abschrift matten.net | **Teilweise.** Bei `spezial`-Artikeln als `input_squaremeter_price_ek` in `artikel.spezialoption_data` (PHP-serialisiert). Bei Festpreis-, `flaeche`-, `umfang`-, `laenge`-Artikeln **nein** (nur `preis` je Stück bzw. m²-Preis ohne EK). Die Brücke (`/api/produkt`) liest die Seite per HTML und gibt den EK **nicht** aus. |
| `preisdaten.salesFactor` | Abschrift matten.net, je Produkt | **Nein.** Nicht als Feld vorhanden. Aus VK/EK je m² (beide stehen bei `spezial`-Artikeln) nur rückrechenbar, und das trifft den Faktor in daten.js nur teilweise: 6300201 105,49/54,63 = 1,931 (gleich), 64000121 56,93/29,48 = 1,931 (gleich), jetprint_light-matten 80,47/40,85 = 1,970 (gleich wie JetPrint light Logo), jetprint_matten-light-einfarbig 72,07/38,54 = 1,870 (gleich wie MJPLIT), aber 6300000 103,67/52,67 = 1,968 (daten.js 1,931), Velour 64,51/39,06 = 1,651 (daten.js 1,931), 64000122 48,23/22,50 = 2,14 (daten.js 1,6). Die neuen Admin-Felder (Salesfactor, Colortype) sind leer. |
| `preisdaten.standardbreiten` | Abschrift matten.net | **Teilweise.** Die Breite-Auswahl `spezialoption[id][spezial][x]` des Zwillings enthält meist dieselben Werte (60/75/85/115/150/200 bei 6300000-a, 85/115/150/200 bei Iron Horse), aber nicht als Preisformel-Stammdatum. Neues Admin-Feld „Standardbreiten" ist leer. |
| `preisdaten.sondermassFaktor`, `singleColorFaktor` | Abschrift matten.net | Nicht nötig: das Frontend liest sie nicht. |
| `fixgroessen[]` (Größe, Breite, Länge, sizeId, Festpreis) | Abschrift matten.net | **Teilweise.** Die Größenliste steht beim Kaufartikel als Auswahl `attribute[Standardgröße]` (Text „40cm x 60cm"), bei 6300000 mit 10 Einträgen, bei matten.net 8. Die `sizeId` gibt es nur auf matten.net. Der Festpreis je Größe ist beim Altsystem erst über `/api/price` je Option zu holen. Die Listen **weichen ab** (z. B. 6300000: Alt 40×60, 50×75, 60×85 … vs. net 40×60, 50×75, 60×90, 85×115 …). |
| `standardbreitenSelect` | Abschrift matten.net | Entspricht der x-Auswahl des Zwillings, wo sie existiert. |
| `customOption` | Abschrift matten.net | **Ableitbar** aus „Zwilling oder `masse[]` vorhanden" (der Code tut das schon als Rückfall). |
| `attribute[]` (Auswahlfelder) | Abschrift matten.net + 3 Korrekturen im Skript | **Ableitbar** aus `/api/produkt` → `attribute` (Felder `attribute[Name]`, Optionen). Die matten.net-Beschriftungen („Höhe", „Format") sind dann die des Altsystems. |
| **Attributaufschläge** (`ATTRIBUT_AUFSCHLAG` in seite-produkt.js: 35,87 € Kratzkante, 10,56 € Kokos 30 mm) | Fest im Code | Der Altsystem-Preis je Option ist über `/api/price` erreichbar. Eine Pflege-Stelle in daten.js existiert nicht. |
| `aufschlagSonderfarbeEK: 54` (seite-produkt.js) | Fest im Code (Mail 17.09.), Excel sagt 50 | Neues Admin-Feld hat Vorgabe 50. |
| `zuordnung` (`dePfad`, `deZwilling`) | **Von Hand** im Skript (`ZUORDNUNG`), per Namens- und Nummernvergleich | Entfällt, wenn das Altsystem selbst die Quelle ist. Zwilling ist über `urlkey + "-a"` auffindbar (96 Zwillinge, aber nicht jeder Kaufartikel hat einen und nicht jeder `-a` hängt an einem Kaufartikel gleichen Namens). Der Universalartikel 569 ist fest im Code. |
| `productId`, `sizeId`, `artikelnummer` | matten.net-IDs | Im Altsystem: `artikelId` (z. B. 459) und `artikelnummer` (z. B. `6300000`). |
| `name` | matten.net-Name | Altsystem hat eigene, oft lange Namen („JetPrint™HD-Fussmatten, einfarbig> Auswahl aus 66 Farben"). Es gibt zwei Namen je Artikel (Listenname und Titel). |
| `beschreibung` (HTML) | `produktbeschreibungen.md` bzw. Beispielseite | Altsystem liefert `beschreibung` (Text mit Zeilenumbrüchen), `beschreibungAbsaetze[]`, `kurzbeschreibung`. Enthält Altlasten („Klick für: F a r b p a l e t t e", Stückpreise „ab 30,59 Euro"). |
| `bilder`, `kachel` | Abschrift + lokales Manifest (heruntergeladene matten.net-Dateien) | Altsystem: `/api/img/…` über die Brücke (`hauptbild`, `bilder[]`, in Kategorieliste `bildOriginal`). Bei 6300000 allein 63 Bilder, davon viele Farbvarianten. |
| `kategorien` und `kategorien[].produkte`, `gruppen`, `produktReihenfolge`, `startseite.topAngebote` | Abschrift matten.net (27 Kategorien, 9 Gruppen mit IDs) | Altsystem hat einen eigenen Kategorienbaum (29 Kategorien, 22 aktiv, `/api/katalog`) mit anderen Namen und Gliederung. Eine Abbildung der Altsystem-Kategorien auf die 27 Net-Kategorien (und die 26 Filterkästchen mit festen IDs) gibt es nicht. |
| `farben` (Palette Nummer → Hex) | Regex aus zwei Beispielseiten und Designer-Json | **Nein.** Das Altsystem kennt nur Farbwerte als Text (`613-königsblau`). Hex-Werte gibt es dort nicht (es hat Muster-Bilder für Iron-Horse-Farben). Neue Artikel mit unbekannten Farbnummern zeigen graue Felder. |

### 6.2 Die drei größten Stolpersteine

1. **Preisformel-Stammdaten.** `salesFactor` und `standardbreiten` fehlen im Altsystem
   vollständig, `einkaufProQm` nur bei den 97 `spezial`-Artikeln (82 aktiv). Für
   die übrigen aktiven Maßwaren (flaeche/umfang/laenge: 109 aktiv) hat das
   Altsystem keinen EK je m². Solange die neuen `pf_*`-Felder leer sind, liefert
   das Altsystem für diese Artikel nur den alten Preis (Fläche × m²-Preis).
2. **Die gepflegten Werte in daten.js stimmen nicht mit dem Altsystem überein.**
   Gemessener EK je m² im Altsystem gegen `einkaufProQm` in daten.js:

   | Net-Produkt | daten.js EK | Altsystem-Artikel (laut `ZUORDNUNG`) | Altsystem EK |
   |---|---|---|---|
   | JetPrint-Premium (+1-farbig) | 52,67 | 6300000 | 52,67 (gleich) |
   | JetPrint matten design / designmatten-jetprint / hinweismatten | 54,63 / 52,67 / 40,85 | 6300201-logomatte | 54,63 |
   | Designmatten JetPrint-Velour | 39,06 | 6400201-velourmatte | 39,06 (gleich) |
   | JetPrint light Logo | 43,39 | jetprint_light-matten (6300202) | 40,85 |
   | Designmatten JetPrint-light | 38,54 | jetprint_light-matten | 40,85 |
   | MJPLIT JetPrint light 1-farbig | 40,85 | jetprint_matten-light-einfarbig | 38,54 (**vertauscht**) |
   | OS Stern-REHAB | 52,67 | 6320304 | 46,88 |
   | Iron-Horse 1-farbig | 27,89 | 64000121 | 29,48 |
   | Iron-Horse-2 | 50 | 64000122 | 22,50 |

   Die Zuordnungen sind teils nur geraten (siehe `anmerkung`). Das Frontend zeigt
   heute also für einige Produkte Preise, die nicht aus dem Altsystem stammen
   und im Warenkorb vom Altsystem-Preis abweichen können.
3. **Kategorien und Farbpalette.** Die 27 Net-Kategorien, die 26 Filterkästchen mit
   fester ID, die Startseite (TOP-ANGEBOTE, Karussell) und die Farbnummern → Hex
   sind reine Handarbeit. Ohne Ersatz zeigt ein übernommenes Produkt zwar Karte und
   Detail, aber es fehlt in jeder Kategorie, in den Filterkästchen, und seine
   Farben (außer JetPrint/Designer/Diplomat) bleiben grau.

### 6.3 Nebenbefunde

* Die Brücke liefert über `/api/produkt` weder EK, VK je m² noch `spezialoption_data`;
  sie liest die Produktseite. Für `einkaufProQm` bräuchte es eine neue Quelle
  (z. B. Brücke liest die Datenbank-Spalte, oder ein neues Feld im Altsystem, das auf
  der Seite ausgegeben wird).
* Der Katalog-Pfad kennt `/api/kategorie?details=1` (Grundpreis, `artikelId`,
  Varianten, eine Anfrage je Produkt).
* Die Auswahl, welche Produkte im Shop erscheinen (Auftrag: soll Einstellung sein),
  hat heute **keine** Entsprechung: `produktReihenfolge`, `kategorien[].produkte`
  und `topAngebote` sind feste Listen.
* Doku-Stand in `LIESMICH.md` und im Skriptkopf nennt „21 Zuordnungspfade", in
  `ZUORDNUNG` stehen 19 Produkte mit zusammen 21 verschiedenen Pfaden.
* Sondermaß ×1,25 und Colortype werden im Frontend nicht je Produkt gepflegt:
  Colortype ist fest 1, auch für „1-farbig"-Produkte (mit eigenem Salesfactor in
  `preisdaten`).
