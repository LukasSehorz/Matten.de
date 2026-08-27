# Katalog-Schnittstelle zum Altshop matten.de

Der Node-Proxy (`server.mjs`, Port 8787) stellt den **kompletten Produktkatalog**
des Legacy-Shops als JSON bereit. Ein neues Frontend kann damit Kategorien,
Produktlisten und Produktdetails live aus dem Altsystem beziehen, ohne dass der
Browser des Besuchers eine einzige Verbindung zu matten.de aufbaut – auch die
Produktbilder laufen über den Proxy.

Der Katalog wird **ausschliesslich lesend** angezapft: alle Aufrufe sind GETs.
Der Proxy schreibt nichts ins Altsystem.

- [1. Die aufgeklärte Shop-Struktur](#1-die-aufgeklärte-shop-struktur)
- [2. Endpunkte](#2-endpunkte)
- [3. Diagnose](#3-diagnose)
- [4. Wie die Parser arbeiten](#4-wie-die-parser-arbeiten)
- [5. Grenzen dieses Ansatzes](#5-grenzen-dieses-ansatzes)

---

## 1. Die aufgeklärte Shop-Struktur

Ermittelt am 27.08.2026 durch systematisches Sondieren (Sitemap, robots.txt,
vollständiger Crawl von 599 Seiten, Strukturscan aller 381 Artikelseiten).

### 1.1 Zahlen

| Grösse | Wert |
|---|---|
| Oberkategorien | **8** (Hauptnavigation) |
| Unterkategorien | **16** (genau zwei Ebenen, keine dritte) |
| Eigenständige Artikel | **384** (Zähler des Shops selbst) |
| davon mit Kaufformular | ~356 |
| davon mit ausgewiesenem Preis | ~186 |
| Interne Artikel-IDs | 3 … 802, eindeutig je Pfad |
| Listenplätze über alle Kategorien | **612** – Produkte sind mehrfach gelistet |
| Produktbilder unter `/media/bild/` | ~300 |

Die 612 gegenüber 384 sind kein Zählfehler: dieselbe Matte erscheint in mehreren
Kategorien. Beispiel: `/fussmatten/standard-schmutzfangmatten/attache` ist auch
auf `/gummi_und_kunststoffmatten` gelistet. Der Shop hat **keine** strenge
Baumzuordnung, sondern kuratierte Listen.

### 1.2 Seitentypen

Das einzige verlässliche Unterscheidungsmerkmal ist die `class` des `<body>`:

```html
<body class='page_bierbankmatten class_kategoriepage'>
<body class='page_6303041      class_artikelpage'>
<body class='page_suche        class_suchepage'>
<body class='page_widerruf     class_infocmspage'>
```

Kategorie- und Artikelseiten haben denselben Pfadaufbau und dasselbe Grundgerüst –
ohne diese Klasse liesse sich beides nicht auseinanderhalten.

### 1.3 Kategoriebaum

| Pfad | Name | Produkte |
|---|---|---|
| `/was-ist-neu` | Artikelsuche | 1 |
| `/was-ist-neu/neue-artikel` | OS-Physio REHA-Matten | 4 |
| `/was-ist-neu/terrazzo` | Terrazzo- Stein-Wannen, Waschbecken | 2 |
| `/fussmatten` | Fussmatten | 0 (reine Landeseite) |
| `/fussmatten/fussmatten` | Einfarbige und Logo Fussmatten | 47 |
| `/fussmatten/standard-schmutzfangmatten` | Baumwollmatten, Nylon-Fussmatten | 44 |
| `/fussmatten/matten_fuer_aussenbereiche` | Matten für Aussenbereiche | 40 |
| `/logomatten` | Logomatten | 90 |
| `/logomatten/sicherheits_symbol_matten` | Sicherheits-und Symbol-Matten | 56 |
| `/logomatten/os-physio-rehab-matten` | OS-Physio REHAB Trainings-Matten | 16 |
| `/logomatten/werbematten-dekomatten` | Werbematten - Dekomatten | 9 |
| `/logomatten/welcome-holzdesign` | Art-Designs Welcome-Holzdesigns | 0 (leer) |
| `/logomatten/wunschdesign-matten` | Wunschdesign-Matten | 16 |
| `/logomatten/matten_fuer_haus_und_heim` | Matten für Haus und Heim | 40 |
| `/logomatten/bierbankmatten` | Biergartenbank-Matten | 33 |
| `/kokosmatten` | Kokosmatten | 12 |
| `/aluminium_profilmatten` | Aluminium-Matten | 80 |
| `/aluminium_profilmatten/rahmen_und_zubehoer` | Aluminiumrahmen, …, Zubehör | 56 |
| `/gummi_und_kunststoffmatten` | Gummi-/Kunststoffmatten | 51 |
| `/gummi_und_kunststoffmatten/bodenschutzmatten` | Bodenschutzmatten | 2 |
| `/miet-mattenservice` | Miet-Mattenservice | 2 |
| `/miet-mattenservice/service_miet-mattenservice` | Miet-Fussmatten | 5 |
| `/miet-mattenservice/reinigungsprodukte` | Teppich-Reinigungsprodukte | 2 |
| `/schnaeppchen` | Schnaeppchen | 4 |

### 1.4 Wo der Baum steht — und wo nicht

Das war der wichtigste Fund der Aufklärung, weil hier drei naheliegende Wege in
die Irre führen:

**Nicht brauchbar: `/sitemap.xml`.** Existiert (200, 79 KB, 500 URLs), stammt
aber vom **19.02.2020**, wurde mit einem kostenlosen Online-Generator erzeugt und
ist bei genau 500 Einträgen abgeschnitten (Limit der Gratisversion). Sie enthält
Kategorien, die es nicht mehr gibt (`/logomatten/s_und_s-trainings-teppiche`
antwortet mit 302 auf `/`), und sie kennt Artikel nicht, die es heute gibt. Als
Wegweiser war sie nützlich, als Datenquelle ist sie unbrauchbar.

**Nicht brauchbar: die Kategorieseiten selbst.** `/logomatten` verlinkt in seinem
Inhaltsbereich **keine** seiner sieben Unterkategorien. Wer den Baum aus den
Kategorieseiten aufbauen will, findet ihn dort nicht.

**Brauchbar: das Megamenü.** Am Ende jedes Navigations-Aufklappmenüs steht ein
von der Shop-Software **maschinell erzeugter** Block – erkennbar an einer
Klassenkombination, die die von Hand gepflegten Menükacheln daneben nicht haben:

```html
<li class="dropdown-menu-products-item col-sm-4 col-md-3 col-lg-2">
  <div class="dropdown-menu-products-item-thumbnail thumbnail">
    <div class="caption text-center">
      <a href="/logomatten/bierbankmatten">Biergartenbank-Matten</a>
    </div>
  </div>
</li>
```

Die handgepflegten Kacheln tragen `col-xs-6 col-sm-4 col-md-2` und enthalten
Bilder und `title`-Attribute. Der Selektor auf `col-sm-4 col-md-3 col-lg-2`
liefert **exakt 16 Treffer, keinen falschen** – und zwar mit genau den Namen,
die auch in den Brotkrumen der Artikelseiten stehen. Eine einzige Anfrage an
die Startseite genügt damit für den ganzen Baum.

Wichtig: **nur auf der Startseite.** Auf einer Artikelseite hängt der Shop den
gerade betrachteten Artikel als 17. Eintrag in dieselbe Liste – wer den Selektor
dort anwendet, bekommt eine Unterkategorie zu viel. `/api/katalog` liest deshalb
ausschliesslich `/`.

Die Oberkategorien kommen aus derselben Anfrage:

```html
<nav id="main_navigation">
  <ul class="nav nav_main navbar-nav">
    <li class='dropdown active-button'>
      <a class="dropdown-toggle" … href='/fussmatten'>Fussmatten<span class="caret">
```

### 1.5 Aufbau einer Kategorieseite

```html
<div id="content">
  <div class='kategorie_text'>  … von Hand gepflegter Einleitungstext …  </div>
  <div class='artikel_grid clearafter'>

    <div class="artikel" id="artikel_6303010">
      <h3 class='titel'><a href="/logomatten/bierbankmatten/6303010">Name</a></h3>
      <div class='artikelbilder_oben'>
        <a class="thumbnail" href="…"><img src='/media/bild/x.jpg' alt='…'></a>
      </div>
      <div class='artikelbilder_galerie'></div>
      …  von Hand gepflegte Beschreibung (WYSIWYG-HTML)  …
      <div class="more_info">
        <a class='pull-right btn btn-info' href="…">&rarr; Online kaufen</a>
      </div>
    </div>

    <div class="artikel no_divider" id="artikel_6303010-a">   ← ohne <h3>!
      …
      <div class="more_info"><a …>&rarr; Anfrage</a></div>
    </div>
```

Vier Eigenheiten, an denen ein naiver Parser scheitert:

1. **`id="artikel_…"` ist keine Artikelnummer**, sondern eine frei vergebene
   Sprungmarke – es gibt `artikel_STEWELL Grip 2000` genauso wie `artikel_6303010`.
2. **Rund ein Drittel der Blöcke hat keine `<h3>`.** Das sind die Sondermass-
   /Anfrage-Geschwister („…-a"), die im Altsystem schlicht keinen eigenen Namen
   gespeichert haben. Der Produktpfad wird deshalb vorrangig aus `more_info`
   gelesen, denn den Knopf haben *alle* Blöcke.
3. **Die Knopfbeschriftung ist die Betriebsart:** „Online kaufen" = Kaufartikel
   mit Preis, „Anfrage" = Anfrageartikel ohne Preis.
4. **Die Klasse ist mal `artikel`, mal `artikel no_divider`.** Ein Muster auf
   `class="artikel"` verliert die Hälfte der Produkte.

**Es gibt keinen Preis und keine interne Artikel-ID in der Kategorieliste.** Beides
steht nur auf der Detailseite. Der Endpunkt `/api/kategorie` sagt das offen und
bietet `?details=1` an (eine Anfrage je Produkt der angezeigten Seite).

**Es gibt keine Blätterung.** `?seite=1` liefert die ganze Kategorie, `?seite=2`
liefert eine leere Liste. Die Blätterung der Brücke ist deshalb ihre eigene.

### 1.6 Aufbau einer Artikelseite

Zwei Layouts, die sich mischen:

**Layout A** (Mehrheit) – `<div class='artikel'>` als Klammer, Bilder in
`artikelbilder_oben` bzw. als `a.thumbnail.lightbox` mit Vorschau aus
`/media/bild/cache/…`.

**Layout B** (113 Seiten, Artikel mit Farbwähler) – **ohne** die `div.artikel`-
Klammer, dafür mit Bilderkarussell (`div.slider-single`) und Farbauswahl über
Radiobuttons:

```html
<input type="radio" class="radio_item color_option"  value="613-königsblau"
       name="attribute[Grundfarbe]"  id="613-königsblau_farboption">
<input type="radio" class="radio_item design_option" value="643-gold"
       name="attribute[Designfarbe]" id="643-gold_designoption" required>
```

Beide Layouts teilen sich das Kaufformular:

```html
<form id='artikelform278' class='artikel_buy_form' method='post' action='/warenkorb'>
  <select name='attribute[Individuelle Bedruckung]'>
    <option value='nein' selected='selected'>…</option>
    <option value='ja, Vorlage-Datei senden an: "info@matten.de"'>…</option>
  </select>
  <select name='spezialoption[207][spezial][x]'>…</select>
  <input  name='spezialoption[207][spezial][y]' min="110" max="350">
  <input  name="kommentar">
  <input  name='anzahl' value='1'>
  <input  type="hidden" name="price_updates" value="/pfad?getpricejson=1">
  <input  type="hidden" name="price_incomplete_prefix" value="ab">
  <input  type='hidden' name='artikel' value='278'>
  <input  type='submit' name='addtocart' value='In den Warenkorb'>
</form>

<div class='produktpreis'>
  Preis: <span class='betrag'>47,60 &euro;</span>
  <div class='versand'>Versand nach Deutschland:
     <span class='betragversand'>11,90 &euro;</span><br/>
     Inkl. Umsatzsteuer 19.00%<br/></div>
</div>
```

Der Wert von `addtocart` unterscheidet die beiden Betriebsarten:
`In den Warenkorb` (Kaufartikel) gegenüber `in den Anfragenkorb` (Anfrageartikel,
**ohne** `div.produktpreis` – solche Artikel haben im Altsystem keinen Preis).

Beachte das Anführungszeichen im Attributwert
`value='ja, Vorlage-Datei senden an: "info@matten.de"'`. Ein Muster wie
`["']([^"']*)["']` schneidet den Wert nach `an: ` ab und schickt dem Warenkorb
etwas, das das Altsystem nicht kennt. Der Parser nutzt darum eine
Rückwärtsreferenz auf das öffnende Anführungszeichen.

### 1.7 Weitere Eigenheiten des Altsystems

**Es gibt keine 404-Seite.** Unbekannte Pfade antworten mit **302 auf `/`**.
Genau daran erkennt die Brücke „gibt es nicht".

**301 bedeutet etwas völlig anderes:** ein dauerhafter Umzug auf den kanonischen
Pfad. `/home/6303011` → `/logomatten/bierbankmatten/6303011`. Diesen Umleitungen
wird gefolgt (`umgezogen: true`, `angefragterPfad` bleibt sichtbar) – hier beides
gleich zu behandeln, hätte alle über die Suche gefundenen `/home/…`-Adressen als
„gibt es nicht" verworfen.

**Pfade sind gross-/kleinschreibungsunempfindlich** und dulden einen
abschliessenden Schrägstrich: `/Logomatten/Bierbankmatten/6303041/` und
`/logomatten/bierbankmatten/6303041` liefern dieselbe Seite.

**Zeichensatz:** Vorlagentexte kommen als cp1252, Datenbankwerte als utf-8 –
beides im selben Dokument, das sich `charset=utf-8` nennt. Der vorhandene
tolerante Decoder `decodeBody()` löst das.

**Sprachumschaltung** `?lang=de|en|id` funktioniert zustandslos und übersetzt
Namen und Betriebsart-Präfixe. Achtung: die englische Fassung schreibt Beträge
als `47.60 €` statt `47,60 €`. Der Zahlenleser erkennt beide Formate.

**robots.txt** sperrt nur `GPTBot` und `PetalBot`, für alle anderen ist alles frei.

### 1.8 Die Suche — der wichtigste Fund

Es gibt eine auswertbare Suche, aber sie ist **nirgends verlinkt**: der Shop hat
kein einziges `<form>` im ganzen Frontend. Gefunden durch Sondieren:

```
GET /suche?search=<begriff>
```

* Der Parameter heisst **`search`** (`term` wirkt genauso). **Jeder andere
  Parametername wird stillschweigend ignoriert** – `?q=bierbank` liefert nicht
  40, sondern alle 384 Artikel.
* Die Ergebnisseite trägt `class_suchepage`, meldet
  `<h1>Suchergebnisse (40):</h1>` und benutzt **dieselbe Blockstruktur** wie eine
  Kategorieseite.
* **Ohne Suchbegriff ist das Ergebnis der komplette Katalog** – 384 Artikel,
  1,2 MB HTML, rund 3 Sekunden. Das ist die einzige vollständige Artikelliste,
  die der Shop von sich aus herausgibt, und die Grundlage der Diagnose.
* Gesucht wird in Namen **und** Beschreibungstexten, Gross-/Kleinschreibung
  egal, mehrere Wörter werden mit ODER verknüpft (`alu matte` → 124 Treffer).

**Und eine Falle, die stillschweigend falsche Zahlen liefert:** das Altsystem
merkt sich den zuletzt gesuchten Begriff in der PHP-Sitzung. Über eine
gemeinsam genutzte Sitzung lieferte `?search=` (leer) darum nicht 384, sondern
das Ergebnis der **vorigen** Suche – nachgemessen: nach `?search=bierbank` gab
`?search=` nur noch 40 Treffer, ohne jede Fehlermeldung. `/api/suche` benutzt
deshalb **je Suche eine eigene Wegwerf-Sitzung**.

Einzelne Suchbegriffe mit Umlauten beantwortet der Shop reproduzierbar mit einer
302-Umleitung (`?search=Almhütte`), während andere funktionieren (`?search=grün`
→ 102 Treffer). Das wird als „abgewiesen" gemeldet, nicht als Fehler.

### 1.9 Preisschnittstelle

```
GET <produktpfad>?getpricejson=1&artikel=<id>&anzahl=<n>&attribute[<name>]=<wert>
→ {"prices":[{"artikel":207,"preis":166.6,"grundpreis":166.6,"versand":14.756,
              "attributepreis":0,"optionenpreis":-360.51,"is_complete":true,
              "zubehoer":false,"brutto":true}],"error":false}
```

Den passenden Aufruf liefert jede Produktantwort in
`kaufformular.upstream.preisAbfrage`. Der Endpunkt `/api/price` existiert bereits
(noch auf den Demo-Artikel zugeschnitten, siehe Abschnitt 5).

---

## 2. Endpunkte

Alle Antworten sind JSON, tragen `ok`, enthalten unter `upstream` das Protokoll
der tatsächlich abgesetzten Anfragen an matten.de und geben bei unerwartetem HTML
`null` für das einzelne Feld zurück statt abzustürzen.

Gemeinsame Parameter: `?sprache=de|en|id`, `?frisch=1` (Zwischenspeicher umgehen),
`?seite=` und `?proSeite=` (Standard 24, Höchstwert 200).

### `GET /api/katalog`

Kategoriebaum mit Schlüssel, Name, Pfad, Produktzahl und Unterkategorien.
Zwischengespeichert für **10 Minuten**.

* Kalt: 1 Anfrage für den Baum + 24 für die Produktzahlen (max. 3 gleichzeitig) ≈ **18 s**
* Warm: **0,4 s**, keine Upstream-Anfrage
* `?zaehlen=0` überspringt die Produktzahlen → **eine** Upstream-Anfrage, ~2 s

```bash
curl -s "http://localhost:8787/api/katalog"
```

```json
{
  "ok": true,
  "quelle": "Hauptnavigation und maschinell erzeugtes Untermenue der Startseite von matten.de",
  "stand": "2026-08-27T15:53:04.890Z",
  "gecacht": false,
  "anzahlKategorien": 24,
  "anzahlProdukteGelistet": 612,
  "hinweisProduktzahl": "Produkte sind mehrfach gelistet: dieselbe Matte erscheint in mehreren Kategorien. …",
  "kategorien": [
    {
      "schluessel": "miet-mattenservice",
      "name": "Miet-Mattenservice",
      "pfad": "/miet-mattenservice",
      "ebene": 1,
      "anzahlProdukte": 2,
      "unterkategorien": [
        {
          "schluessel": "miet-mattenservice/service_miet-mattenservice",
          "name": "Miet-Fußmatten",
          "pfad": "/miet-mattenservice/service_miet-mattenservice",
          "ebene": 2,
          "anzahlProdukte": 5,
          "unterkategorien": []
        }
      ]
    }
  ],
  "hinweise": [],
  "upstream": [{ "method": "GET", "url": "/", "status": 200, "ms": 1531 }]
}
```

### `GET /api/kategorie?pfad=…`

Produktliste einer Kategorie, geblättert.

```bash
curl -s "http://localhost:8787/api/kategorie?pfad=/logomatten/bierbankmatten&seite=1&proSeite=1"
```

```json
{
  "ok": true,
  "pfad": "/logomatten/bierbankmatten",
  "name": "Bierbankmatten",
  "titel": "Bierbankmatten, Bierbank-Auflagen, Sitzauflagen",
  "einleitung": "Biergartenbank-Matten..... praktisch und schön …",
  "sprache": "de",
  "gecacht": false,
  "details": false,
  "seite": 1, "proSeite": 1, "seiten": 33, "anzahlGesamt": 33, "von": 1, "bis": 1,
  "hinweis": "Grundpreis, interne Artikel-ID und Varianten stehen NICHT in der Kategorieliste des Altsystems. Sie kommen nur mit ?details=1 (eine Anfrage je Produkt).",
  "produkte": [
    {
      "anker": "6303010",
      "pfad": "/logomatten/bierbankmatten/6303010",
      "artikelnummer": "6303010",
      "artikelnummerNumerisch": true,
      "name": "Bierbankmatte: einfarbig oder mit Ihrem individuellem Design",
      "variante": false,
      "gehoertZu": null,
      "nameGeerbt": null,
      "bildOriginal": "/media/bild/Bierbank_individuell.jpg",
      "bild": "/api/img/bild/Bierbank_individuell.jpg",
      "bildQuelle": "artikelbilder_oben",
      "bildAlt": "Bierbankmatte, Bierbankauflage, Oktoberfest, Rauten, …",
      "kurzbeschreibung": "Biergartenbankmatte, \"individuelles Design nach Kundenvorlage\" oder \"einfarbig\" …",
      "knopf": "Anfrage",
      "modus": "anfrage"
    }
  ],
  "upstream": [{ "method": "GET", "url": "/logomatten/bierbankmatten", "status": 200, "ms": 746 }]
}
```

Felder, die eine Erklärung brauchen:

| Feld | Bedeutung |
|---|---|
| `artikelnummer` | letztes Pfadsegment. Nur bei etwa der Hälfte des Katalogs eine echte Nummer (`6303041`), sonst ein Namenskürzel (`attache`). `artikelnummerNumerisch` sagt, was von beidem. |
| `variante` | Block ohne eigene Überschrift = Sondermass-/Anfrage-Geschwister des Artikels darüber. |
| `gehoertZu`, `nameGeerbt` | Pfad und Name dieses Artikels darüber. Wird **nicht** erfunden – `name` bleibt `null`. |
| `bildQuelle` | `artikelbilder_oben` (echtes Artikelbild) oder `beschreibung` (erstes Bild aus dem Fliesstext – gilt für rund die Hälfte). |
| `modus` | `kauf` oder `anfrage`, aus der Knopfbeschriftung. |
| `bild` | immer ein `/api/img/…`-Pfad, nie eine matten.de-Adresse. |

**`&details=1`** holt für jedes Produkt der *angezeigten Seite* zusätzlich die
Artikelseite und ergänzt `artikelId`, `grundpreis`, `grundpreisText`, `versand`,
`ustSatz`, `attribute` (in derselben Form wie `/api/produkt`), `verfuegbarkeit`.
Kosten: eine Anfrage je Produkt, höchstens vier gleichzeitig (≈ 5 s für 5 Produkte).

```bash
curl -s "http://localhost:8787/api/kategorie?pfad=/logomatten/bierbankmatten&proSeite=5&seite=2&details=1"
```

```
6303015 | id=265 | 47.6 | kauf | Bierbankmatte: O'zapft is  | Individuelle Bedruckung
6303016 | id=268 | 47.6 | kauf | Bierbankmatte: Wiesn       | Individuelle Bedruckung
6303021 | id=269 | 47.6 | kauf | Bierbankmatte: Edelweiß    | Individuelle Bedruckung
```

### `GET /api/produkt?pfad=…`

Alles aus der Liste plus Langbeschreibung, alle Bilder, alle Attributoptionen,
Datenblattverweise und das vollständige Kaufformular-Feldset.

```bash
curl -s "http://localhost:8787/api/produkt?pfad=/logomatten/bierbankmatten/6303041"
```

```json
{
  "ok": true,
  "sprache": "de",
  "gecacht": false,
  "parsen": { "stufe": "vollstaendig", "fehlend": [] },
  "produkt": {
    "pfad": "/logomatten/bierbankmatten/6303041",
    "angefragterPfad": "/logomatten/bierbankmatten/6303041",
    "umgezogen": false,
    "artikelnummer": "6303041",
    "artikelnummerNumerisch": true,
    "artikelId": 278,
    "name": "Bierbankmatte: Pils",
    "nameQuelle": "h3.titel",
    "kaufbar": true,
    "modus": "kauf",
    "brotkrumen": [
      { "pfad": "/logomatten", "name": "Logomatten" },
      { "pfad": "/logomatten/bierbankmatten", "name": "Biergartenbank-Matten" },
      { "pfad": "/logomatten/bierbankmatten/6303041", "name": "Bierbankmatte: Pils" }
    ],
    "kategorie": { "pfad": "/logomatten/bierbankmatten", "name": "Biergartenbank-Matten" },
    "hauptbild": "/api/img/bild/Bierbank_Pils.jpg",
    "bilder": [
      { "bild": "/api/img/bild/Bierbank_Pils.jpg", "original": "/media/bild/Bierbank_Pils.jpg" }
    ],
    "kurzbeschreibung": "Biergartenbankmatte, \"Pils\" Die rutschfeste Bierbankauflage …",
    "beschreibung": "Biergartenbankmatte, \"Pils\"\nDie rutschfeste Bierbankauflage …",
    "beschreibungAbsaetze": [
      "Biergartenbankmatte, \"Pils\"",
      "Die rutschfeste Bierbankauflage mit dem individuellen Design.",
      "Größe: 197cm x 24cm",
      "Satzpreis (2 Stück): 46,70 EURO inklusiv MWSt."
    ],
    "preis": {
      "text": "47,60 €", "wert": 47.6,
      "versandText": "11,90 €", "versand": 11.9,
      "ustSatz": 19, "brutto": true, "unvollstaendigPraefix": "ab"
    },
    "verfuegbarkeit": null,
    "attribute": [
      {
        "feld": "attribute[Individuelle Bedruckung]",
        "name": "Individuelle Bedruckung",
        "typ": "auswahl",
        "art": "attribut",
        "optionen": [
          { "wert": "nein", "label": "Individuelle Bedruckung nein", "gewaehlt": true },
          { "wert": "ja, Vorlage-Datei senden an: \"info@matten.de\"",
            "label": "Individuelle Bedruckung ja, Vorlage-Datei senden an: \"info@matten.de\"",
            "gewaehlt": false }
        ],
        "gewaehlt": "nein"
      }
    ],
    "masse": [],
    "technischeDaten": [],
    "sprachen": ["de", "en", "id"]
  },
  "kaufformular": {
    "vorhanden": true,
    "modus": "kauf",
    "knopfbeschriftung": "In den Warenkorb",
    "upstream": {
      "methode": "POST",
      "pfad": "/warenkorb",
      "kodierung": "application/x-www-form-urlencoded (utf-8)",
      "felder": [
        { "name": "attribute[Individuelle Bedruckung]", "typ": "select", "wert": "nein", "pflicht": true },
        { "name": "kommentar",  "typ": "text",   "wert": "",  "pflicht": false },
        { "name": "anzahl",     "typ": "text",   "wert": "1", "pflicht": true },
        { "name": "price_updates", "typ": "hidden", "wert": "/logomatten/bierbankmatten/6303041?getpricejson=1", "pflicht": false },
        { "name": "price_incomplete_prefix", "typ": "hidden", "wert": "ab", "pflicht": false },
        { "name": "artikel",    "typ": "hidden", "wert": "278", "pflicht": true },
        { "name": "addtocart",  "typ": "submit", "wert": "In den Warenkorb", "pflicht": true }
      ],
      "preisAbfrage": "/logomatten/bierbankmatten/6303041?getpricejson=1",
      "unvollstaendigPraefix": "ab"
    },
    "bruecke": {
      "methode": "POST", "pfad": "/api/cart/add", "kodierung": "application/json",
      "koerper": { "artikel": 278, "anzahl": 1, "attribut": "nein", "kommentar": "" },
      "einschraenkung": "/api/cart/add dieser Demo ist auf den Demo-Artikel 278 zugeschnitten …"
    },
    "hinweise": []
  },
  "upstream": [{ "method": "GET", "url": "/logomatten/bierbankmatten/6303041", "status": 200, "ms": 716 }]
}
```

Weitere Feldarten in `attribute`:

* `typ: "auswahl"` – aus `<select>`; `art: "attribut"` oder `art: "spezialoption"`
* `typ: "farbwahl"` – aus den Radiobuttons des Farbwählers, bis zu 45 Optionen
* `masse` – freie Masseingaben mit `min`/`max` in cm bzw. mm, z. B.
  `{ "feld": "spezialoption[207][spezial][y]", "typ": "zahl", "min": 110, "max": 350 }`
* `technischeDaten` – Verweise auf die Datenblatt- und Farbpalettenseiten des
  Shops, z. B. `{ "pfad": "/TechnischeDaten-Kleen-Way", "name": "Klick für Technische Daten …" }`

Die **Langbeschreibung wird als Text und als Absatzliste** geliefert, nicht als
HTML. Bewusst: das Original ist von Hand gepflegtes WYSIWYG-Markup mit
inline gesetzten Farben und Schriftgrössen. Ein neues Frontend soll das Layout
des Altsystems nicht erben, und ungefiltertes Fremd-HTML im eigenen Dokument ist
eine offene Tür.

### `GET /api/suche?q=…`

Der Altshop hat eine auswertbare Suche – siehe Abschnitt 1.8. Mindestens zwei
Zeichen, oder `?alle=1` für den kompletten Katalog.

```bash
curl -s "http://localhost:8787/api/suche?q=bierbank&proSeite=1"
curl -s "http://localhost:8787/api/suche?alle=1&proSeite=24"
```

```json
{
  "ok": true, "q": "bierbank", "sprache": "de", "gecacht": false,
  "gemeldeteTreffer": 40,
  "seite": 1, "proSeite": 1, "seiten": 40, "anzahlGesamt": 40, "von": 1, "bis": 1,
  "hinweis": "Die Suche des Altsystems durchsucht Namen UND Beschreibungstexte und verknuepft mehrere Woerter mit ODER. Sie kennt keine Blaetterung – die hier ist unsere eigene.",
  "produkte": [
    {
      "anker": "6303020",
      "pfad": "/home/6303021",
      "artikelnummer": "6303021",
      "name": "Bierbankmatten Rauten",
      "bild": "/api/img/bild/Bierbank_Edelweiss.jpg",
      "bildQuelle": "beschreibung",
      "kurzbeschreibung": "Edelweiss Bierbankmatte, ohne Rand, rutschfest 197cm x 24cm …"
    }
  ],
  "upstream": [{ "method": "GET", "url": "/suche?search=bierbank", "status": 200, "ms": 1158 }]
}
```

`gemeldeteTreffer` ist die Zahl aus `<h1>Suchergebnisse (40):</h1>`, `anzahlGesamt`
die Zahl der tatsächlich geparsten Blöcke. **Weichen die beiden ab, hat sich das
Blockmuster geändert** – die Diagnose meldet das.

Suchergebnisblöcke tragen weder `more_info`-Knopf noch Artikelbild in
`artikelbilder_oben`; `modus` bleibt dort `null`, das Bild kommt aus der
Beschreibung. Wer beides braucht, holt `/api/produkt`.

### `GET /api/img/…` (erweitert)

Der bestehende Bild-Proxy hatte eine Allowlist von `[A-Za-z0-9._\-/]`. Damit
wären **48 von rund 300 Katalogbildern nicht erschienen**: der Shop hat
Dateinamen mit Leerzeichen (`Bitte hier warten.png`), mit Umlauten
(`Bierbank_Almhütte.jpg`, im HTML teils als `&auml;` maskiert) und einen
Vorschauordner `cache/`.

Geöffnet wurde deshalb nur der **Zeichenvorrat**, nicht die Struktur:

* kein `..`, kein führender Schrägstrich, keine leeren Segmente, kein Segment mit `.` am Anfang
* kein `\`, kein NUL, keine Steuerzeichen
* kein `?`, `#` oder `%` – die würden beim Bauen der Upstream-Adresse zu Query,
  Fragment oder halber Prozentkodierung, also zu einem anderen Ziel als der Pfad vorgibt
* höchstens drei Segmente, höchstens 200 Zeichen
* Endung muss ein Bildtyp sein (`.jpg .jpeg .png .gif .webp .svg`)

Unverändert bleiben: Host fest verdrahtet (`rawRequest()` lehnt jeden anderen ab),
**keine** Umleitungen verfolgt, Content-Type aus der **Antwort** statt aus der
Endung, `X-Content-Type-Options: nosniff`.

Getestet mit 91 echten Katalogbildern (alle 200/`image/*`) und mit
`../etc/passwd`, `bild/a?x=1.jpg`, `bild/a#b.jpg`, `bild/a\b.jpg`,
`bild//x.jpg`, `bild/x.php`, `bild/.htaccess`, `https://fremder.host/...`,
`bild/a/b/c/d.jpg`, 300-Zeichen-Namen – alle abgelehnt.

---

## 3. Diagnose

```bash
curl -s "http://localhost:8787/api/katalog/diagnose?stichprobe=50"
```

Prüft den Kategoriebaum und eine gleichmässig über den ganzen Katalog verteilte
Stichprobe von Artikelseiten.

**Ergebnis vom 27.08.2026, Stichprobe 50:**

```json
{
  "ampel": "gruen",
  "katalog": {
    "oberkategorien": 8,
    "unterkategorien": 16,
    "kategorienOhneProdukte": ["/fussmatten", "/logomatten/welcome-holzdesign"],
    "kategorienOhneZaehlung": [],
    "hinweise": []
  },
  "produkte": {
    "imKatalogGefunden": 384,
    "vomAltsystemGemeldet": 384,
    "geprueft": 50,
    "vollstaendig": 31,
    "teilweise": 19,
    "fehlgeschlagen": 0,
    "feldquoten": {
      "name": "72 %", "artikelId": "98 %", "bild": "78 %", "preis": "52 %",
      "kaufformular": "98 %", "attribute": "94 %", "beschreibung": "86 %"
    }
  }
}
```

Einstufung:

| Stufe | Bedeutung |
|---|---|
| `vollstaendig` | Name, Bild, Kaufformular, interne ID, Beschreibung und (bei Kaufartikeln) Preis gelesen |
| `teilweise` | Artikel identifizierbar, aber mindestens ein Feld fehlt |
| `fehlgeschlagen` | weder Name noch interne ID lesbar – oder die Seite war keine Artikelseite |

Die Ampel steht auf **grün**, wenn Baum und Gesamtliste stehen und höchstens 10 %
der Stichprobe komplett scheitern; **gelb** bei einzelnen Ausfällen; **rot**, wenn
der Baum leer ist, die Gesamtliste fehlt oder mehr als die Hälfte scheitert.

**Die 19 „teilweise" sind kein Parserfehler, sondern Lücken im Altsystem.**
Aufschlüsselung der aktuellen Stichprobe:

* **14 × fehlender Name** – ausnahmslos Sondermass-Geschwister (`…-a`). Deren
  Detailseite hat weder Überschrift noch `<title>` noch Brotkrumentext; das
  Altsystem hat dort schlicht nichts gespeichert. Der Name steht nur in der
  Kategorieliste – dort liefert `/api/kategorie` ihn als `nameGeerbt` mit.
* **4 × fehlendes Bild** – Artikel, die im Altsystem kein Bild haben
  (`…/service-ripswechsel`, `…/sondervereinbarung`, `…/abdeckschiene`).
* **1 × fehlendes Kaufformular** – `/home/info-standardschmutzfangmatten` ist
  eine reine Informationsseite, die als Artikel geführt wird.

Die niedrige Preisquote (52 %) ist ebenfalls Absicht: Anfrageartikel („in den
Anfragenkorb") haben im Altsystem gar keinen Preis. Die Diagnose zählt das nicht
als Fehler – täte sie es, wäre sie als Frühwarnung wertlos.

**Was die Diagnose bei einer Layoutänderung zeigt:** fällt eine der
CSS-Klassen weg, auf die sich die Parser stützen, bricht die entsprechende
Feldquote sofort ein. Verschwindet `class_artikelpage`, gehen alle Stichproben
auf `fehlgeschlagen`. Ändert sich das Blockmuster der Listen, laufen
`imKatalogGefunden` und `vomAltsystemGemeldet` auseinander und ein Hinweis
erscheint. Verschwindet der generierte Untermenüblock, meldet
`katalog.hinweise` das und `unterkategorien` fällt auf 0.

---

## 4. Wie die Parser arbeiten

Jede Parserfunktion in `server.mjs` trägt im Kopfkommentar das HTML-Muster, auf
das sie sich stützt. Übersicht:

| Funktion | Muster |
|---|---|
| `parseSeitentyp` | `<body class='… class_kategoriepage'>` |
| `parseHauptnavigation` | `<nav id="main_navigation">` → `<li class='dropdown…'><a href='/x'>` |
| `parseUntermenue` | `<li class="dropdown-menu-products-item col-sm-4 col-md-3 col-lg-2">` |
| `parseProduktliste` | `<div class="artikel[ no_divider]" id="artikel_…">`, Pfad aus `div.more_info` |
| `parseBrotkrumen` | `<div class='breadcrumbs'><a href='…'>…</a> &raquo;` |
| `parseKaufformular` | `<form class='artikel_buy_form' action='/warenkorb'>` |
| `parsePreis` | `<div class='produktpreis'>` / `span.betrag` / `span.betragversand` |
| `parseBilder` | `/media/…` aus `img[src]` und `a[href]` im Inhaltsbereich |
| `parseTechnischeDaten` | Verweise auf `/techn…` und `/farbpalette…` |
| `parseArtikel` | `h3.titel`, sonst letzte Brotkrume, sonst `null` |
| `parseTrefferzahl` | `<h1>Suchergebnisse (384):</h1>` |
| `mediaZuApiPfad` / `pruefeMedienpfad` | Allowlist für `/media/…` |

Gemeinsame Regeln:

* **Nie ein Absturz.** Jedes nicht gefundene Feld wird `null`, jeder Block, der
  sich nicht auswerten lässt, wird übersprungen und protokolliert.
* **Nur der Inhaltsbereich.** Alle Listenparser arbeiten auf dem Ausschnitt
  zwischen `<div id="content">` und `<div class="derfooter">`. Das Megamenü im
  Seitenkopf benutzt dieselben CSS-Klassen wie der Produktbereich – ohne diesen
  Schnitt zählte jeder Parser die Menükacheln als Produkte mit.
* **Nichts erfinden.** Fehlt ein Name, bleibt er `null`; woher ein Wert stammt,
  steht in `nameQuelle` bzw. `bildQuelle`.
* **Eigene Sitzung für den Katalog.** Katalogseiten laufen nicht über die
  Besucher-Sitzung, sondern über eine gemeinsame Sitzung je Sprache – der
  Warenkorbzustand eines Besuchers hat auf einer zwischengespeicherten
  Produktseite nichts zu suchen. Die Suche bekommt je Aufruf eine eigene
  Wegwerf-Sitzung (Abschnitt 1.8).
* **Höflich zum Altsystem.** Höchstens drei bis vier gleichzeitige Anfragen, ein
  Wiederholungsversuch bei gekappter Verbindung (`socket hang up` kommt unter
  Last vor), Zwischenspeicher mit 10 Minuten Verfallszeit.

### Wo das Parsen unsicher ist

Ehrlich benannt, nach absteigendem Risiko:

1. **Der generierte Untermenüblock.** Der ganze Kategoriebaum hängt an *einer*
   Klassenkombination (`col-sm-4 col-md-3 col-lg-2`). Das ist eine Bootstrap-
   Rasterangabe, keine semantische Auszeichnung – ein Redesign des Menüs ändert
   sie, ohne dass jemand am Katalog etwas geändert hätte. Die Diagnose meldet es
   sofort, reparieren muss man es von Hand.
2. **Die Betriebsart aus der Knopfbeschriftung.** „Online kaufen" gegenüber
   „Anfrage" ist Text im Frontend, keine Datenauszeichnung. Eine Umformulierung
   im Shop dreht `modus` still auf `anfrage`.
3. **Die Zuordnung namenloser Varianten.** `gehoertZu` folgt der
   Dokumentreihenfolge: ein Block ohne Überschrift gehört zum letzten Block mit
   Überschrift. Das ist genau das, was die Seite optisch tut – aber es steht
   nirgends als Beziehung in den Daten. Sortiert der Shop die Liste anders,
   stimmt die Zuordnung nicht mehr, ohne dass es auffällt.
4. **Die Kurzbeschreibung.** Sie ist der Fliesstext zwischen Bildergalerie und
   `more_info` – also alles, was der Redakteur dort hineingeschrieben hat,
   inklusive Preisen, die dem echten Preis widersprechen. Bei
   `/logomatten/bierbankmatten/6303041` steht im Text „Satzpreis (2 Stück): 46,70
   EURO", während der Shop 47,60 € berechnet. **Für Preise ist ausschliesslich
   `preis` bzw. `preisAbfrage` massgeblich, nie der Beschreibungstext.**
5. **Das Bild aus der Beschreibung.** Wenn `artikelbilder_oben` leer ist (rund
   die Hälfte der Artikel), wird das erste `/media/`-Bild des Blocks genommen.
   Meist ist das das Produktfoto, manchmal ein Farbtafel- oder Hinweisbild.
   `bildQuelle: "beschreibung"` sagt, wann Vorsicht angebracht ist.
6. **Attributwerte mit `>`.** Die Tag-Parser lesen bis zum ersten `>`. Enthielte
   ein Attributwert ein `>`, bräche das Muster. Im heutigen Katalog kommt das
   nicht vor.
7. **Der Preis gilt für die Vorauswahl.** `preis.wert` ist der Preis der
   vorausgewählten Variante bei Lieferland Deutschland. Sobald das Frontend eine
   Variante ändert, **muss** es `kaufformular.upstream.preisAbfrage` benutzen.
8. **Die Umlaut-Falle der Suche.** Manche Suchbegriffe mit Umlauten werden vom
   Shop mit 302 abgewiesen, andere nicht. Der Grund liegt im Altsystem; die
   Brücke meldet den Fall sauber, umgehen kann sie ihn nicht.

---

## 5. Grenzen dieses Ansatzes

### Was diese Brücke leistet

Sie liest ein 384-Artikel-Sortiment mit Kategorien, Bildern, Preisen, Varianten
und vollständigen Formularbeschreibungen aus einem System heraus, das keine
Schnittstelle hat, keine Dokumentation und keine Exportfunktion. Sie tut das
ohne eine einzige Änderung am Altsystem und ohne Zugriff auf dessen Server. Für
ein neues Frontend, das *jetzt* gebaut werden soll, ist das der schnellste Weg
zu echten Daten – und für ein Erstgespräch ist es der Beweis, dass es geht.

### Was bricht, wenn Melting Mind das Layout ändert

Diese Brücke liest HTML, das für Menschen gemacht ist. Jede der folgenden
Änderungen ist für den Dienstleister eine Kleinigkeit und für die Brücke ein
Ausfall:

| Änderung im Altshop | Folge |
|---|---|
| `class_artikelpage` / `class_kategoriepage` umbenannt oder entfernt | **Totalausfall.** Kein Seitentyp mehr erkennbar, alle Endpunkte melden „unbekannter Seitentyp". |
| Bootstrap-Update, Rasterklassen im Menü ändern sich | **Kategoriebaum leer.** `/api/katalog` liefert 0 Unterkategorien. |
| `div.artikel` / `id="artikel_…"` umgebaut | **Alle Listen leer.** Kategorien und Suche geben 0 Produkte zurück. |
| `form.artikel_buy_form` umbenannt | Keine Preise, keine Varianten, kein Feldset – die Detailansicht wird zur Bildunterschrift. |
| `span.betrag` umbenannt | Alle Preise `null`. |
| Knopftext „Online kaufen" umformuliert | `modus` still falsch – **fällt niemandem auf**, bis jemand einen Anfrageartikel als Kaufartikel anzeigt. |
| Suchparameter `search` umbenannt | `/api/suche` liefert stumm den ganzen Katalog statt der Treffer. |
| Bilder ziehen nach `/bilder/` statt `/media/` | Alle Produktbilder verschwinden (die Allowlist des Bild-Proxys lässt nur `/media/` zu). |

Vier davon fallen sofort auf, weil nichts mehr angezeigt wird. Zwei sind
schlimmer: sie liefern **plausible, aber falsche Daten**. Genau dagegen gibt es
`/api/katalog/diagnose` – aber die Diagnose muss jemand aufrufen.

Dazu kommt: **niemand kündigt solche Änderungen an.** Die Brücke ist von einem
Dienstleister abhängig, der von ihrer Existenz nichts weiss und keinen Grund
hat, Rücksicht zu nehmen.

### Weitere strukturelle Grenzen

* **Geschwindigkeit.** Jede Katalogseite kostet 0,7–2 s upstream. Ein kalter
  `/api/katalog` braucht 18 Sekunden, eine Kategorieliste mit `details=1` etwa
  eine Sekunde pro Produkt. Der Zwischenspeicher federt das ab, aber alle zehn
  Minuten kostet es wieder. Ein Frontend, das schnell sein soll, müsste den
  Katalog nächtlich spiegeln – dann ist es allerdings kein Live-Zugriff mehr.
* **Last auf dem Altsystem.** Jeder Aufruf ist echter Traffic auf einem
  Produktivsystem, das für 300 Bestellungen im Monat ausgelegt ist. Unter
  Parallelität kappt es Verbindungen (daher der Wiederholungsversuch).
* **Keine Bestände, keine Staffelpreise, keine Rohdaten.** Was nicht auf der
  Seite steht, gibt es hier nicht. Staffelpreise kennt nur `getpricejson`, und
  auch nur für eine konkrete Konfiguration.
* **Serverseitiger Zustand.** Der zuletzt gesuchte Begriff hängt in der PHP-
  Sitzung (Abschnitt 1.8). Ähnliche versteckte Zustände können an anderen
  Stellen existieren, die noch niemand gefunden hat – das ist die eigentliche
  Warnung dieses Fundes.
* **`/api/cart/add` ist noch nicht generisch.** Der Endpunkt stammt aus der
  Warenkorb-Demo und ist auf den Artikel 278 mit genau einem Attribut
  zugeschnitten. Für den vollen Katalog müsste er die Felder aus
  `kaufformular.upstream.felder` unverändert durchreichen – die Datengrundlage
  dafür liefert `/api/produkt` bereits vollständig, die Umstellung ist
  überschaubar, sie ist nur noch nicht gemacht.
* **Diese Brücke ist gebaut, um ersetzt zu werden.** Sie ist eine Rampe, keine
  Architektur.

### Was mit dem Quellcode stattdessen möglich wäre

Alles, was hier mühsam aus HTML zurückgewonnen wird, ist im Altsystem eine
Datenbankspalte. Mit Zugriff auf Quellcode und Datenbank ändert sich die
Aufgabe von „HTML deuten" zu „Daten lesen":

* **Ein echter Export in einer Stunde statt einer Brücke in einer Woche.** Die
  Artikeltabelle hat die internen IDs 3–802, die Attribute liegen strukturiert
  vor, die Zuordnung Artikel↔Kategorie ist eine Verknüpfungstabelle. Ein
  `SELECT` liefert in einem Zug, wofür die Brücke 400 HTTP-Anfragen braucht.
* **Die namenlosen Artikel bekommen Namen.** Die 107 Sondermass-Varianten sind
  im Frontend namenlos, weil die Vorlage dort nichts ausgibt – nicht, weil die
  Datenbank leer wäre. Die tatsächliche Beziehung „Variante gehört zu Artikel X"
  steht als Fremdschlüssel da, statt aus der Dokumentreihenfolge erraten zu
  werden.
* **Preise ohne Ratespiel.** Preisformel, Staffeln, Attributzuschläge und
  Flächenberechnung stehen im Code. Statt für jede Konfiguration `getpricejson`
  zu fragen, liesse sich der Preis im neuen Frontend selbst rechnen –
  Millisekunden statt einer halben Sekunde je Variantenwechsel.
* **Keine Abhängigkeit von fremden Layoutentscheidungen.** Eine Migration
  einmal, sauber, mit Abnahme – statt einer Brücke, die bei jedem Deployment des
  Dienstleisters kaputtgehen kann, ohne dass es jemand merkt.
* **Der Weg raus.** Mit den Rohdaten wird aus „neues Frontend auf altem Backend"
  ein „neues System, alte Daten". Die Brücke kann das nicht leisten: sie kann den
  Shop lesen, aber sie kann ihn nicht ablösen.

**Kurz:** Diese Brücke beweist, dass das Sortiment zugänglich ist, und macht ein
neues Frontend sofort möglich. Sie ist der richtige erste Schritt – und der
falsche Dauerzustand.
