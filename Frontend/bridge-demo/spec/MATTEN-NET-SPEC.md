# matten.net — Spezifikation für den Nachbau

**Quelle:** `https://www.matten.net`, deutsche Fassung (`/de`)
**Erfasst am:** 31.08.2026 · ausschließlich lesende `GET`-Zugriffe
**Zweck:** Aus diesem Dokument lässt sich matten.net nachbauen, ohne die Website erneut aufzurufen.

Alle Beschriftungen sind **wörtlich** übernommen — auch dort, wo die deutsche Fassung
englische Wörter enthält (`Cart`, `Sort by`, `Make an offer`, `Find us`). Das ist kein
Übersetzungsfehler dieser Spezifikation, sondern der Zustand der Website.

---

## Inhalt

1. [Technischer Rahmen](#1-technischer-rahmen)
2. [Gemeinsamer Seitenrahmen](#2-gemeinsamer-seitenrahmen)
3. [Navigation](#3-navigation)
4. [Sitemap](#4-sitemap)
5. [Startseite](#5-startseite)
6. [Kategorieseite](#6-kategorieseite)
7. [Produktliste](#7-produktliste-deproducts)
8. [Produktseite](#8-produktseite)
9. [Der Mattendesigner](#9-der-mattendesigner)
10. [Warenkorb und Checkout](#10-warenkorb-und-checkout)
11. [Login und Registrierung](#11-login-und-registrierung)
12. [Blog, Gästebuch, Infoseiten](#12-blog-gästebuch-infoseiten)
13. [Die Preisformel von matten.net](#13-die-preisformel-von-mattennet)
14. [Abweichungen zur Excel-Formel](#14-abweichungen-zur-excel-formel-preisformelmd)
15. [Kategorien und Produkte](#15-kategorien-und-produkte)
16. [Zuordnung zu matten.de](#16-zuordnung-zu-mattende)
17. [Gefundene Fehler](#17-gefundene-fehler)
18. [Was nicht erfasst werden konnte](#18-was-nicht-erfasst-werden-konnte)

Begleitdateien:

| Datei | Inhalt |
|---|---|
| `struktur.json` | Navigation, 27 Kategorien, 19 Produkte, Preismodell, Designer-Materialien — maschinenlesbar |
| `texte/*.md` | Wortlaut der Infoseiten, Formularfelder von Login/Registrierung, Blog, Gästebuch |
| `texte/zuordnung-matten-de.md` | Zuordnungstabelle matten.net ↔ matten.de |

---

## 1. Technischer Rahmen

**Wichtig für den Nachbau:** matten.net ist **keine Vue-SPA**. Die Seiten werden
serverseitig von Symfony/Twig gerendert; das ausgelieferte HTML enthält den
vollständigen Inhalt. Vue 2 wird nur an genau einer Stelle eingesetzt: für den
Mattendesigner (`#mat-editor`). Alles andere ist Bootstrap 4 + jQuery.

| Bestandteil | Wert |
|---|---|
| Server | PHP/Symfony, Twig-Templates |
| CSS-Rahmenwerk | Bootstrap 4 |
| JS | jQuery, Bootstrap-JS, Vue 2 (nur Designer), fabric.js (Zeichenfläche), vue-swatches (Farbwähler), fontfaceobserver |
| Icons | Font Awesome 5.0.10 über `https://use.fontawesome.com/releases/v5.0.10/css/all.css` |
| Cookie-Banner | `cookieconsent`, Palette `#2579d3` / Text `#ffffff`, Knopf `#cbf1ff` / Text `#000000` |

Eingebundene Dateien (in dieser Reihenfolge, auf **allen** Seiten identisch):

```html
<link rel="stylesheet" href="/build/837.96782462.css">
<link rel="stylesheet" href="/build/css/style.747cc104.css">
<script src="/build/runtime.a6ba3cf9.js"></script>
<script src="/build/576.a55b98e3.js"></script>
<script src="/build/814.30d0226b.js"></script>
<script src="/build/js/app.f1a77904.js"></script>
```

`<head>`-Angaben (auf allen erfassten Seiten gleich):

```html
<title>Mattenfuchs</title>
<meta name="keywords" content="e-commerce, matten" />
<meta name="description" content="Matten.de e-commerce" />
<meta name="robots" content="index, follow" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="matten.de" />
<meta property="og:description" content="Matten.de e-commerce" />
<meta property="og:image" content="https://www.matten.net/images/mattenfuchs.png" />
<link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
<link rel="icon" type="image/png" href="/favicon-16x16.png" sizes="16x16" />
```

`<body>` trägt auf Produktseiten `id="product_view"` — daran hängt die gesamte
Preis-Logik im JavaScript. Auf allen anderen Seiten ist `id=""`.

---

## 2. Gemeinsamer Seitenrahmen

Jede Seite ist gleich aufgebaut. Der **Inhaltsbereich** ist alles zwischen dem Ende
der Navigation und dem Newsletter-Widget.

### Reihenfolge von oben nach unten

**1. Warnbanner** — `div.alert.alert-warning.py-1`, volle Breite, wörtlich:

> ⚠️ Entwicklungswebsite — diese Website entspricht möglicherweise nicht den geltenden Gesetzen und Vorschriften.

**2. Kopfzeile** — weißer Hintergrund, zwei Spalten (`col-lg-6` / `col-lg-6`):

*Linke Spalte:* Logo als `<h1 class="logo">` mit Link auf `/de`, Bild
`/images/logo_german.png` (1024×197).

*Rechte Spalte, obere Zeile (rechtsbündig), getrennt durch `span.divider`:*

| Element | Beschriftung | Ziel |
|---|---|---|
| Sprach-Dropdown | `Deutsch` mit Flaggenbild `/images/flags/german.png` (25×25) | Einträge: `English` → `/en`, `Deutsch` → `/de` |
| Link | `Gästebuch` | `/de/guest-book` |
| Link | `Login` | `/de/login` |
| Link | `Registrieren` | `/de/account/register` |

*Rechte Spalte, untere Zeile (zwei Spalten `col-sm-6`):*

- **Warenkorb-Knopfgruppe:** Knopf `btn-light` mit Einkaufswagen-Icon und Text `Cart`
  (öffnet das Modal `#cart-modal`), daneben Knopf `btn-orange` mit Text
  `Auschecken` → `/de/order/checkout`.
- **Suchformular:** `<form action="/de/products" method="get">`, Textfeld
  `name="keyword"`, Platzhalter `Produkt suchen`, Absendeknopf `btn-primary` mit
  Lupen-Icon.

**3. Warenkorb-Modal** `#cart-modal` — `modal-xl`, scrollbar, zentriert. Kopf
blau (`bg-primary`) mit Schließkreuz. Inhalt: Tabelle mit dunklem Kopf und den
Spalten (leer) · (leer) · `Produkt` · `Preis` (rechtsbündig) · `Menge`
(rechtsbündig) · `Total` (rechtsbündig) · (leer, zentriert). Bei leerem
Warenkorb eine Zeile über alle 7 Spalten mit dem zentrierten Text
`Your cart is empty.`

Tabellenfuß (`tfoot-light`), jede Zeile über 5 Spalten rechtsbündig beschriftet,
Wert fett:

| Beschriftung | Wert bei leerem Warenkorb |
|---|---|
| `Subtotal` | `€ 0.00` |
| `Versandkosten` | `€ 0.00` |
| `Nettosumme` | `€ 0.00` |
| `VAT 19.00%` | `€ 0.00` |
| `Total` | `€ 0.00` |

Darunter rechtsbündig der Knopf `btn-secondary` mit Winkel-Icon und Text
`Weiter einkaufen` → `/de`, schließt das Modal.

**4. Navigation** — siehe Abschnitt 3.

**5. Inhaltsbereich** — `<div style="min-height: 500px;">`, seitentypabhängig.

**6. Newsletter-Widget** — zentriert, mit Beschriftung `Newsletter abonnieren`,
Textfeld `#subscribe-email` mit Platzhalter `eMail-Adresse` und gelbem Knopf
`Abonnieren`. Das Formular hat **weder `action` noch `method`** und ist ohne
Funktion.

**7. Fußzeile** — drei Spalten:

| Spalte | Überschrift `h3.footer-title` | Inhalt |
|---|---|---|
| 1 | `Find us` | `Facebook` → `https://m.facebook.com/Fuchsius-multi-media-GmbH-329921957172415/`, `Twitter` → `https://twitter.com/mattenfuchs`, `LinkedIn`, `Instagram` (jeweils mit Marken-Icon) |
| 2 | `Information` | `Home` → `/de` · `Produktliste` → `/de/products` · `Registrieren` → `/de/account/register` · `datenschutz` → `/de/pages/data-protection` · `Datenschutzerklärung (DSGVO)` → `/de/pages/datenschutzerklarung-dsgvo` · `AGB` → `/de/pages/agb` · `Impressum` → `/de/pages/impressum` |
| 3 | `Kontakt` | `Mail: info@matten.net` · `Tel.: +49 89 5455 8264` · `Fax: +49 89 5455 8333` · `Mobil: +49 171 77 55 400` |

Darunter zentriert: `© 2026 Mattenfuchs`

---

## 3. Navigation

Es gibt **zwei** Navigationsleisten, die sich per Bootstrap-Breakpoint abwechseln.
Beide führen dieselben Kategorien in derselben Reihenfolge.

### 3.1 Desktop-Leiste (`nav.main-navbar`, `d-none d-lg-block`)

Blauer Verlaufshintergrund (`bg-gradient-primary`). Die Gruppen sind **keine
Links**, sondern `<span class="category-dropdown-trigger">`; beim Überfahren
klappt darunter ein Bildmenü auf (`div.category-dropdown-menu`) mit den
Unterkategorien als Kacheln in einem `row no-gutters`, jede Kachel `col-2`
(also 6 pro Zeile), bestehend aus einem Kategoriebild (150×100, `width: 100%`)
und darunter dem Kategorienamen als zentrierter dunkler Absatz.

**Exakte Reihenfolge und Gruppierung:**

| # | Eintrag | Typ | Unterkategorien (in dieser Reihenfolge) |
|---|---|---|---|
| 1 | `Mattendesigner` | Link → `/de/custom-mat/create` | — |
| 2 | `Fussmatten` | Gruppe | `JetPrint-einfarbig` · `IronHorse` · `IronHorse XL` |
| 3 | `Logomatten` | Gruppe | `Designmatten` · `Jet Print light` · `Katzen Willk` · `JetPrint-Design` |
| 4 | `OS-REHA-Physio-Matten` | Gruppe | `OS-REHAB-Physio-Matten` · `OS-Y-Matte, Wide Balance` · `OS-REHAB Basis-Matte` · `OS-REHAB-Bahnmatte` · `OS-REHAB-Stern-Matte` · `OS-REHAB-Gitter-Matte` · `OS-REHAB-5-Punkt-Matte` · `OS-REHAB Quadrat-Matte` |
| 5 | `Kokosmatten` | Gruppe | `Kokos Farbig` · `Kokos naturfarbig` · `Kokos-Logomatte` |
| 6 | `Aluminium-Matten` | Gruppe | `MARSCHALL` · `Diplomat` |
| 7 | `Gummimatten` | Gruppe | `Cushion Coil` · `Scraper` · `Struktura` |
| 8 | `Outdoor-Matten` | Gruppe | `Turf` |
| 9 | `Mietmatten` | Gruppe | `IRON-HORSE-Mietmatten` |
| 10 | `Was ist neu` | Gruppe | `Waschbecken` |
| 11 | `Alle Produkte` | Link → `/de/products` | — |
| 12 | `Blog` | Link → `/de/blog` | — |

> **Hinweis:** Die Gruppe `OS-REHA-Physio-Matten` (Position 4) fehlte in der
> Aufgabenbeschreibung. Sie ist die mit Abstand größte Gruppe (8 Kategorien) und
> ist im Menü tatsächlich vorhanden. Zu beachten ist die Schreibweise: die
> **Gruppe** heißt `OS-REHA-Physio-Matten` (ohne B), die erste **Kategorie**
> darin `OS-REHAB-Physio-Matten` (mit B).

Slugs siehe Abschnitt 15 und `struktur.json`.

### 3.2 Mobile Leiste (`d-lg-none`)

Klassische Bootstrap-Navbar mit Hamburger-Knopf (`#navbarSupportedContent`).
Unterschiede zur Desktop-Leiste:

1. An **erster** Stelle steht zusätzlich `Home` → `/de`.
2. `Mattendesigner` steht **nicht** an erster Stelle, sondern zwischen den
   Gruppen `Fussmatten` und `Logomatten`.
3. Die Unterkategorien erscheinen als reine Text-Dropdowns
   (`a.dropdown-item.bg-blue`), ohne Bilder.
4. `Alle Produkte` und `Blog` fehlen.
5. Am Ende steht eine **zweite, funktionslose Sprachauswahl** mit den Einträgen
   `English`, `German`, `French`, `Spanish` — alle vier mit `href="#"`.

---

## 4. Sitemap

| Pfad | Status | Seitentyp |
|---|---|---|
| `/de` | 200 | Startseite |
| `/de/products` | 200 | Produktliste, 19 Produkte auf 2 Seiten (`?page=n`) |
| `/de/product-categories/<slug>` | 200 | Kategorieseite, **27** Slugs |
| `/de/products/<slug>` | 200 | Produktseite, **19** Slugs |
| `/de/custom-mat/create` | 200 | Mattendesigner |
| `/de/custom-mat/checkout` | 200 | Bestellformular des Designers |
| `/de/order/checkout` | **302 → `/de`** | Checkout, bei leerem Warenkorb Weiterleitung |
| `/de/login` | 200 | Login |
| `/de/account/register` | 200 | Registrierung |
| `/de/blog` | 200 | Blog, 2 Beiträge |
| `/de/guest-book` | 200 | Gästebuch — **rendert nichts** |
| `/de/pages/agb` | 200 | AGB |
| `/de/pages/impressum` | 200 | Impressum |
| `/de/pages/data-protection` | 200 | Datenschutz |
| `/de/pages/datenschutzerklarung-dsgvo` | 200 | Datenschutz (DSGVO) |
| `/en/...` | 200 | Dieselbe Struktur auf Englisch |

**Geprüft und nicht vorhanden (404):** `/sitemap.xml`, `/robots.txt`,
`/de/order/cart`, `/de/order/inquiry-cart`, `/de/account`, `/de/contact`,
`/de/pages/kontakt`.

### AJAX-Endpunkte

| Endpunkt | Parameter | Antwort |
|---|---|---|
| `GET /de/ajax/product-price` | `length`, `width`, `quantity`, `productId`, `singleColor`, `attributeValueIds[]` | JSON, siehe 13.1 |
| `GET /de/ajax/demo-price` | dieselben | HTML-Debug-Tabelle, siehe 13.2 |
| `GET /de/ajax/simulation-price` | dieselben | **404 Not Found** — wird vom JS aufgerufen, die Route fehlt |
| `GET /de/ajax/custom-mat-materials` | — | JSON-Array der Designer-Materialien |
| `GET /de/ajax/attribute-images/<id>` | — | Bilder zu einem Attributwert |

---

## 5. Startseite

Pfad `/de`. Abschnitte in dieser Reihenfolge:

**1. Datenschutzhinweis** (`div.protection-info`, zentriert, 12px) — wörtlich:

> Datenschutzerklärung der FUCHSIUS multi-media GmbH
> als Betreiber dieser Seite „www.matten.de“ nutzt Cookies. Wir behandeln Ihre
> Daten sehr sorgsam und vertraulich, entsprechend der neuen gesetzlichen
> EU-Datenschutzverordnung (DSGVO) und unserer angefügten Datenschutzerklärung.
> [Mehr Information](https://matten.net/de/pages/data-protection).

**2. Karussell** `#carousel` (Bootstrap `carousel slide`, `data-ride="carousel"`,
volle Breite), 11 Folien, Indikatoren als Punktleiste, Pfeile links/rechts mit
`sr-only`-Texten `Previous` / `Next`. Jede Folie: Bild über volle Breite plus
`carousel-caption` mit `h5.h2` (Titel) und `p.h4` (Untertitel), das Ganze in
einem `<a>`.

| # | Titel (`h5.h2`) | Untertitel (`p.h4`) | Bild | Link |
|---|---|---|---|---|
| 1 | Eingangsmatten, Schmutzfangmatten | einfarbig, meliert oder gestaltet | `SL-1024x170-Eing.jpg` | `#` |
| 2 | Ihre Grußbotschaft im Eingang | Herzlich Willkommen | `SL-1024x170-willkommen.jpg` | `#` |
| 3 | Alu-Profil | Aluminium-Profilmatten | `SL-1024x170-Alu-RCB.JPG` | `https://matten.net/en/product-categories/diplomat` |
| 4 | Fussmatten | 150 verschiedene Farben | `SL-1024x170-Rollen.JPG` | `https://matten.net/en/product-categories/schon-sauber-duo-color` |
| 5 | Fusßmatten | 1-farbig, beliebige Größe | `SL-1024x170-1farbig.jpg` | `#` |
| 6 | Logomatten, Designmatten | bis 20-farbig und fotorealistisch | `SL-1024x170-Logo.jpg` | `#` |
| 7 | REHAB-Matten | Physio-Trainingsmatten | `SL-1024x170-OS-Phys.jpg` | `#` |
| 8 | Eingangs-Fussmatten | Standards und individuelle Größen, Formen und Farben | `SL-1024x170-VierJahr.jpg` | `#` |
| 9 | Fussmatten | Schmutzfangmatten, einfarbig und gestaltet | `SL-1024x170-Logo.jpg` | `#` |
| 10 | Aluminium-Profilmatten | verschiedene Trittflächen/-Kombinationen | `SL-1024x170-Aluminium.jpg` | `#` |
| 11 | Marmor, Onyx, Fossil, Terrazzo | Waschbecken, Wannen, Badzubehör | `SL-1024x170-Washtafel.jpg` | `#` |

Bildpfad jeweils `https://www.matten.net/media/cache/slide_image/uploads/<Datei>`.
Der `alt`-Text ist identisch mit dem Titel. Folie 5 enthält den Tippfehler
„Fusßmatten“, Folie 6 und 9 nutzen dasselbe Bild. Die Folien 3 und 4 verlinken
in die **englische** Fassung; Folie 4 zeigt auf die Kategorie
`schon-sauber-duo-color`, die im deutschen Menü nicht vorkommt.

**3. Abschnitt `Featured Category (German)`** — Überschrift `h2.background` mit
`<span>`. Darunter ein `row` mit einer einzigen `col-md-6`: Kategoriekachel
(`a` → `/de/product-categories/was-ist-neu`) mit Hintergrundbild
`/uploads/5c787ff38c28b.jpeg` und der Bildunterschrift `Was ist neu`.

Die Überschrift lautet wörtlich `Featured Category (German)` — englischer
Platzhaltertext samt Sprachvermerk in Klammern.

**4. Abschnitt `TOP-ANGEBOTE`** — Überschrift `h2.background`, darunter
`div.row.product-row` mit 5 Produktkarten, jede in `col-6 col-lg-4 col-xl-3 mb-3`:

| # | Produkt | Slug |
|---|---|---|
| 1 | IRON-HORSE 1-farbige und melierte Schmutzfangmatten | `iron-horse-1-farbige-und-melierte-schmutzfangmatten` |
| 2 | IRON-HORSE-Mietmatte | `iron-horse-matte` |
| 3 | JetPrint Premium 1-farbig | `jetprint-premium-1-farbig` |
| 4 | JetPrint light 1-farbig | `mjplit-jetprint-light-1-farbig` |
| 5 | Designmatten JetPrint | `designmatten-jetprint` |

**Aufbau einer Produktkarte** (überall auf der Website gleich):

```html
<a href="/de/products/<slug>" title="<Name>">
  <div class="card product-card">
    <img src="https://www.matten.net/media/cache/product_thumbnail/uploads/<Bild>"
         class="card-img-top img-fluid" width="256" height="170">
    <div class="card-body">
      <h5 class="card-title product-card-title">
        <a href="/de/products/<slug>" title="<Name>"><Name></a>
      </h5>
    </div>
  </div>
</a>
```

Die Karte enthält **einen Link im Link** (ungültiges HTML) und das Bild hat
**kein `alt`**. Es wird **kein Preis** angezeigt.

**5. Abschnitt `Der Mattenfuchs`** — Überschrift `h2.background`, darunter ein
einfaches `<div>` mit dem Fließtext:

> Seit mehr als 35 Jahren liefern wir Fussmatten in einer Vielzahl von
> Standardmaßen und nahezu beliebigen Wunschmaßen in mehr als 100 verschiedenen
> Farben, einfarbig und individuell nach Kundenwunsch gestaltet. Wir haben in
> dieser Zeit weltweit in vielen namhaften Firmen, Top-Handelshäusern und
> Filialunternehmen, Hotels, Verwaltungen, Ladengeschäften und Privathaushalten
> für saubere Eingangsbereiche und den Schutz der angrenzenden Böden gesorgt.
> Unsere Angebotspalette ist in den zurückliegenden Jahren stetig gewachsen und
> wurde den permanent steigenden Anforderungen laufend angepasst. So haben wir
> für jedes Schmutzproblem -und auch für die passende Werbung für Ihr Haus-
> immer eine hervorragende Lösung parat. "NICHTS" gibt es nicht bei uns. Wir
> sind stets für Sie unter "info@matten.de" erreichbar und freuen uns über Ihre
> Anfrage. Ihr Mattenfuchs-Team

Danach folgt ein leeres `div.row.product-row` (kein Inhalt).

**6. Vorteilsleiste** — `div.container.padding-top` mit weißem Hintergrund,
`row justify-content-md-center`, zwei Spalten `col-2 info-col text-center`:

| Bild (120×120) | `alt` und Text (`p.info-text`) |
|---|---|
| `/uploads/5c36ad55d8af8jpeg` | `Best Price` |
| `/uploads/5c36ad9452e74jpeg` | `International shipping` |

Beide Beschriftungen sind englisch.

---

## 6. Kategorieseite

Pfad `/de/product-categories/<slug>`. 27 Stück.

**1. Titelbereich** — `div.jumbotron.category-page-image-cover` mit
`style="background-image: url('/uploads/<Bild>');"`, darin ein `big-container`:

- `<h1 class="display-5">` — der Kategoriename
- `<p>` — die Kategoriebeschreibung; bei 12 der 27 Kategorien **leer** (`<p></p>`)

**2. Inhalt** — `div.big-container.padding-top` mit `row`:

*Linke Spalte `col-md-3` — Filter:*

- Knopf `#filter-toggle`, `btn-lg btn-outline-primary btn-block`, nur mobil
  sichtbar (`d-block d-md-none`), Beschriftung `Filter`
- `<form id="filter" class="filter d-none d-md-block" method="get">`
  - Beschriftung `Sort by` für `#filter-sort`
  - `<select id="filter-sort" name="filter_sort" class="custom-select custom-select-sm">`
    mit den Optionen — Werte und Beschriftungen wörtlich:
    | `value` | Beschriftung |
    |---|---|
    | `LATEST` | `Latest` *(vorausgewählt)* |
    | `NAME_ASC` | `Name a-z` |
    | `NAME_DESC` | `Name z-a` |
  - `<hr>`
  - Absendeknopf `btn-sm btn-primary` mit Filter-Icon und Text `Filter`

*Rechte Spalte `col-md-9`:* ein `row` mit den Produktkarten, jede in
`col-6 col-lg-4 col-xl-3 mb-3`. Aufbau der Karte wie in Abschnitt 5.
Ist die Kategorie leer, bleibt das `row` leer — **ohne** Hinweistext.

Es gibt **keine Paginierung** auf Kategorieseiten (keine Kategorie hat genug
Produkte). Die gesamte Filterbeschriftung ist englisch.

---

## 7. Produktliste `/de/products`

Aufbau wie die Kategorieseite, aber ohne Titelbereich und **ohne jede
Seitenüberschrift** — der Inhalt beginnt direkt mit der Filterspalte.

Der Filter enthält hier zusätzlich zur Sortierung **26 Kategorie-Kontrollkästchen**
(`name="category[]"`, alle vorausgewählt), gruppiert unter den 9 Oberkategorien.
Das Aufklappen einer Oberkategorie geschieht über ein Inline-`onclick` auf einem
`<span>` und ist damit nicht tastaturbedienbar.

Paginierung über `?page=n`, 2 Seiten (16 + 3 Produkte). Details in
`texte/products-uebersicht.md`.

---

## 8. Produktseite

Pfad `/de/products/<slug>`. `<body id="product_view">` — daran hängt die
Preisberechnung.

### 8.1 Aufbau

**1. Brotkrumenpfad** — `ol.breadcrumb`, erstes Element ein Link auf die
Kategorie, zweites Element (`active`) der Produktname.

**2. Zwei Spalten `col-lg-6` / `col-lg-6`**

*Links — Bildbereich `#variety-images.unselectable`:*
- Großbild in `div.product-image-container.animated.fadeIn.active` (512×340),
  `alt="image"`
- darunter `row no-gutters pt-1` mit den Miniaturbildern, jedes in
  `col-4 col-lg-3` als `a.product-image-nav-item` mit `data-target="#image-N"`;
  das aktive trägt zusätzlich `active`

*Rechts — `div.single-product-info`:*
- Überdeckung `div.product-loading` (halbtransparent weiß, mit Spinner), im
  Normalzustand `d-none`
- `<h2 class="mb-0">` mit dem Produktnamen
- `div.stars` — leer (Bewertungen sind nicht umgesetzt)
- das Bestellformular:

```html
<form id="add_to_cart_form" action="/de/order/add-to-cart" method="post" data-no-enter-submit>
  <input type="hidden" id="product_id" name="product_id" value="<pid>">
```

**3. Farbauswahl** (nur bei Produkten mit Farbattributen)

Je Farbattribut ein Block `div.color-input-container` mit
- `<label>` — die Attributbeschriftung, z. B. `Grundfarbe`
- `<small id="color-attribute-N">` — zeigt die aktuelle Auswahl, z. B.
  `601 Zitronengelb`
- ein Gitter aus Farbfeldern: je Farbe ein `span.color-input` mit
  `<input type="radio" name="attributes[N][]" value="<attributeValueId>"
   data-title="601 Zitronengelb" data-attribute-input
   data-selected-color-label="#color-attribute-N"
   data-attribute-image-url="/de/ajax/attribute-images/<id>">`
  und einem `<label style="background-color: #fffe28" title="Zitronengelb">601</label>`.
  Sichtbar ist also nur die **Farbnummer**, der Farbname steht im `title`.
- Darunter ein `row` mit
  - links: Kontrollkästchen `#multiple_colors` (`name="multiple_colors"`,
    `data-target="#attribute-input-1"`) mit der Beschriftung
    `Weitere Designfarben auswählen`
  - rechts: Knopf `btn-link.color-collapse-button` mit zwei Beschriftungen,
    `span.show-label` = `Mehr Farben Anzeigen`, `span.hide-label` =
    `Weniger Farben`

**4. Bestellbereich `section.order-form`**

*Zeile 1 — Größe:*

| Element | Beschriftung | Details |
|---|---|---|
| `select#input_fixed_size` `name="size_id"` | `Größe` | Optionen: je Fixgröße `<option value="<sizeId>" data-price="<Preis>" data-width="<w>" data-length="<l>">l cm x w cm</option>`, am Ende `<option value="FIXED+CUSTOM_SIZE">Custom</option>` |

Die Beschriftung der Option lautet `<Länge> cm x <Breite> cm` — also
**Länge zuerst**, während `data-width`/`data-length` genau umgekehrt belegt sind.

*Zeile 2 — Breite und Länge, drei Spalten, von denen je nach Modus welche
ein-/ausgeblendet werden:*

| Container | Element | Beschriftung | Details |
|---|---|---|---|
| `#order_input_fixed_width` | `select#input_fixed_width` `name="fixed_width"` | `Breite` | Optionen = die **Standardbreiten des Produkts**, z. B. `60`, `75`, `85`, `115`, `150`, `200`, jeweils mit `data-width` |
| `#order_input_width` | `input#input_width` `name="width"` | `Breite` | `type="number"`, `min="40"`, `max="200"`, `value="100"`, Platzhalter `Width`, Anhang `cm`, Tooltip: `Geben Sie bitte eine Breite zwischen 40 cm und 200 cm ein.` |
| `#order_input_length` | `input#input_length` `name="length"` | `Länge` | `type="number"`, `min="40"`, `max="700"`, `value="100"`, Platzhalter `Length`, Anhang `cm`, Tooltip: `Geben Sie bitte eine Länge zwischen 40 cm und 700 cm ein.` |

Die Tooltips sind `data-toggle="tooltip" data-trigger="manual"`, erscheinen also
nur, wenn das Skript sie auslöst.

*Zeile 3 — Menge und Preis:*

| Element | Beschriftung | Details |
|---|---|---|
| `input#input_quantity` `name="quantity"` | `Menge` | `type="number"`, `value="1"`, `min="1"`, Platzhalter `Quantity` |
| `div#price` | `Preis` | Anfangs ein Spinner; wird per AJAX gefüllt |
| Kleintext unter dem Preis | `inkl. MWSt.` | |
| `span#shipping_cost` | — | wird per AJAX gefüllt, z. B. `Plus 10.00€ Versandkosten` |

*Zeile 4 — Knöpfe:*

| Knopf | `name` | `value` | Beschriftung |
|---|---|---|---|
| `#add-to-cart` `btn-primary` | `submit` | `CART` | `In den Warenkorb` |
| `#add-to-inquiry` `btn-secondary` | `submit` | `INQUIRY_CART` | `Make an offer` |

**5. Reiter** — `ul.nav.nav-tabs.nav-tabs-sm`:

| Reiter | `href` | Inhalt |
|---|---|---|
| `Beschreibung` *(aktiv)* | `#description` | `div.description-content` mit dem HTML-Beschreibungstext |
| `Bewertungen` | `#reviews` | Bewertungsbereich |

### 8.2 Bedienlogik (aus `app.f1a77904.js`)

Alles Folgende läuft nur, wenn `document.body.id === "product_view"`.

**Beim Laden:** Länge und Breite werden aus der vorausgewählten Option von
`#input_fixed_size` (`data-length` / `data-width`) übernommen, dann wird der
Preis geholt.

**Bei Änderung von `#input_fixed_size`** passiert zweierlei:

1. Die Menge wird auf `1` zurückgesetzt. Je nach `value` bekommt
   `#add_to_cart_form` eine Klasse (die per CSS die Felder ein-/ausblendet):

   | `value` der Option | Klasse am Formular |
   |---|---|
   | `FIXED+CUSTOM_SIZE` | `custom_size` |
   | `FIXED+CUSTOM_LENGTH` | `custom_length` |
   | `CUSTOM_ONLY` | `custom_size` |
   | alles andere (feste Größe) | beide Klassen werden entfernt |

2. Länge und Breite werden auf `data-length` / `data-width` der gewählten Option
   gesetzt; bei `FIXED+CUSTOM_LENGTH` stattdessen die Breite aus
   `#input_fixed_width`; bei `FIXED_ONLY` fest auf `100`/`100`. Danach
   Preisabfrage.

**Bei Änderung von `#input_fixed_width`:** die Breite wird auf das `data-width`
der gewählten Option gesetzt.

**Bei Eingabe in `#input_width`, `#input_length`, `#input_quantity` oder einem
`.attribute-select`:** entprellt (**70 ms**) und nur wenn
`this.checkValidity()` wahr ist, wird der Preis neu geholt.

**Die Preisabfrage** sammelt:
- `length` aus `#input_length`, `width` aus `#input_width`, `quantity` aus
  `#input_quantity`, `productId` aus `#product_id`
- `attributeValueIds` = die Werte aller `.attribute-select` mit nichtleerem Wert
- `singleColor` = `true`, wenn ein angehaktes `input[name="mat_colors"]` den Wert
  `single` hat, sonst `false`

und ruft dann:

| Bedingung | Aufruf | Ziel im DOM |
|---|---|---|
| `#price_calculator_demo` existiert | `/de/ajax/demo-price` | dorthin als HTML |
| `#price_simulation` existiert | `/de/ajax/simulation-price` | dorthin als HTML |
| **immer** | `/de/ajax/product-price` | `pricePlusVatHtml` → `#price`, `shippingCostHtml` → `#shipping_cost` |

`#price` wird währenddessen durch einen Spinner ersetzt.

> **Wichtig:** Auf **keiner** der 19 Produktseiten existiert `#price_calculator_demo`
> oder `#price_simulation`. Die Debug-Tabelle und die Simulation sind also im
> ausgelieferten Zustand nie sichtbar; die Endpunkte sind aber direkt aufrufbar.
> `simulation-price` liefert ohnehin 404.
>
> Ebenso existiert auf keiner Produktseite ein `input[name="mat_colors"]`.
> `singleColor` ist deshalb im laufenden Betrieb **immer `false`**, obwohl der
> Server den Parameter auswertet.

Weiter gibt es Umschalter für eine Simulationsansicht: ein Klick auf
`#open_simulation` setzt die Klasse `open` auf `.simulation`, ein Klick auf
`#close_simulation` entfernt sie.

---

## 9. Der Mattendesigner

Pfad `/de/custom-mat/create`.

### 9.1 Serverseitiges Gerüst

Der Inhaltsbereich enthält nur drei Dinge:

**1. Hinweisleiste** `div.alert.alert-primary.m-1.d-touch-block`:

> Für die besten Design-Ergebnisse empfehlen wir die Verwendung eines Computers.

**2. Hilfe-Modal** `#helpModal` — Titel `Help`, Schließkreuz, im Rumpf eine
nummerierte Liste:

1. wählen Sie die Mattengröße aus.
2. wählen Sie die Mattengrundfarbe.
3. entwerfen Sie mithilfe der Rechtecke, Kreise, Schriften und Ihrer Bilder Ihr eigenes Design.

Fußzeile: Knopf `btn-primary` mit `Ok`, schließt das Modal.

**3.** `<div id="mat-editor"></div>` — der Vue-Einhängepunkt.

Zusätzlich setzt die Seite im Skript:

```js
window.submitURL = '/de/custom-mat/checkout';
window.translations = { ... };   // siehe 9.2
Window.locale = 'de';            // Großes W - so steht es dort
```

### 9.2 Beschriftungswörterbuch

Die Vue-Komponente holt alle Texte über `getTranslation('label.xxx')` aus
`window.translations`. Vollständige deutsche Fassung, wörtlich:

| Schlüssel | Deutscher Text |
|---|---|
| `label.preferences` | Auswahl |
| `label.material` | Mattenart |
| `label.size` | Größe |
| `label.jetprint` | JetPrint |
| `label.jetprint_light` | JetPrint light |
| `label.leather` | Velour |
| `label.vision` | Vision |
| `label.toolbox` | Werkzeuge |
| `label.add_text` | Text einfügen |
| `label.add_rectangle` | Rechteck einfügen |
| `label.add_circle` | Kreis einfügen |
| `label.add_image` | Bild einfügen |
| `label.design_elements` | Designelemente |
| `label.base_rect` | Grundfarbe |
| `label.textbox` | A Textbox |
| `label.circle` | Kreis |
| `label.image` | Bild |
| `label.selected` | ausgewählt |
| `label.font_weight` | Schriftgröße |
| `label.normal` | normal |
| `label.bold` | fett |
| `label.font` | Schriftart |
| `label.attributes` | Design-details |
| `label.color` | Farbe |
| `label.stroke_color` | Linienfarbe |
| `label.stroke_width` | Linienbreite |
| `label.position` | Elementreihenfolge |
| `label.additional_info` | zusätzliche Informationen |
| `label.notes` | Bemerkungen |
| `label.order_mat` | Matte bestellen |
| `label.quantity` | Menge |
| `label.rectangle` | Rechteck |
| `label.text` | Text |
| `label.new_design` | Neues Design |
| `label.portrait` | Hochformat |
| `label.horizontal` | Querformat |
| `label.price` | Preis |
| `label.total` | Total |
| `label.order_this_mat` | Diese Matte ordern |
| `label.select_size` | Größe |
| `label.select_material` | Material |
| `label.including_tax_plus_shipping_cost` | inkl. MWSt. plus Versandkosten |
| `label.please_check_spelling` | Bitte prüfen Sie Mattenmaße, Mattenformat, Design, Texte, Farben und Spezifikationen vor dem Absenden des Auftrages. Weitere Wünsche schreiben Sie bitte unter ”Anmerkungen" |
| `label.base_color` | Grundfarbe |
| `label.design_color` | Design-Farbe |
| `title.order_custom_mat` | Kundenmatten-Bestellung |
| `label.delete_object` | Objekt entfernen |
| `label.text_align` | Textausrichtung |
| `label.line_height` | Line spacing |
| `label.letter_spacing` | Letter spacing |

`label.line_height` und `label.letter_spacing` sind **nicht übersetzt** und
erscheinen englisch. `label.font_weight` ist mit `Schriftgröße` **falsch**
übersetzt — die Auswahl steuert `normal`/`fett`, also die Schrift**stärke**.
`label.portrait` ist auf `Hochformat` gemappt, wird aber der Option
`HORIZONTAL` zugewiesen, `label.horizontal` = `Querformat` der Option
`VERTICAL` — die beiden sind **vertauscht** (siehe 17).

### 9.3 Aufbau der Oberfläche

Ein `div.mt-2.mat-editor`, darin eine Ladeüberdeckung (halbtransparent weiß,
`z-index: 999`, Spinner 6rem) solange `loading` wahr ist, und ein `row` mit drei
Spalten.

#### Linke Spalte `section.col-lg-2.col-md-1`

1. Knopf `btn-block btn-secondary` mit Text `Help` und Fragezeichen-Icon, öffnet
   `#helpModal`.
2. `ul.list-group.mt-2` — die Werkzeuge, je ein
   `li.list-group-item.mat-editor-tool-button` mit Icon und Text:

   | Icon | Beschriftung | Wirkung beim Klick |
   |---|---|---|
   | `fa-file` | `Neues Design` | `clearCanvas()` — leert die Zeichenfläche |
   | `fa-font` | `Text einfügen` | `addText()` |
   | `fa-square` | `Rechteck einfügen` | `addRect()` |
   | `fa-circle` | `Kreis einfügen` | `addCircle()` |
   | `fa-image` | `Bild einfügen` | öffnet den verborgenen Dateiwähler |

   Der Dateiwähler ist ein `input[type=file]` mit
   `accept="image/jpeg, image/gif, image/png"`, `class="d-none"`.

3. Überschrift `<strong>Designelemente</strong>`, darunter `ul.list-group` mit
   je einem Eintrag pro Objekt auf der Zeichenfläche. Ein Klick wählt das Objekt
   aus; der Eintrag des ausgewählten Objekts trägt `active`. Beschriftung nach
   Objekttyp:

   | Bedingung | Icon | Text und `title` |
   |---|---|---|
   | `id === 99999` | `fa-file` | `Grundfarbe` |
   | `type === 'rect'` | `fa-square` | `Rechteck` |
   | `type === 'circle'` | `fa-circle` | `Kreis` |
   | `type === 'textbox'` | `fa-font` | `Text` |
   | `type === 'image'` | `fa-image` | `Bild` |

4. Nur wenn ein Objekt ausgewählt ist: Knopf `btn-sm btn-secondary` mit
   Papierkorb-Icon und Text `Objekt entfernen`. **Deaktiviert**, solange das
   Grundrechteck ausgewählt ist.

#### Mittlere Spalte `section.col-lg-7.col-md-8`

Eine `card`, im `card-body`:

*Erste Formularzeile (`form-inline` → `form-row`), drei Felder nebeneinander:*

| `id` | Beschriftung | Typ | Optionen |
|---|---|---|---|
| `material` | `Material` | `select.custom-select` | ein Eintrag je Material, angezeigt wird `material.name` |
| `size` | `Größe` | `select.custom-select` | ein Eintrag je Größe, angezeigt als `<height>cm x <width>cm` |
| `orientation` | `Format` | `select.custom-select` | `HORIZONTAL` → `Hochformat`, `VERTICAL` → `Querformat` |

Die Beschriftung `Format` steht als einziger Text **fest im Template** und läuft
nicht über das Wörterbuch.

*Zweite Formularzeile:*

| `id` | Beschriftung | Typ | Details |
|---|---|---|---|
| `quantity` | `Menge` | `input[type=number]` | `size="2"`, `max="100"`, Breite `max-width: 5em` |

Direkt daneben, sobald Material und Größe gesetzt sind:
`<strong>` mit dem Gesamtpreis, formatiert als `€ 1.234,56` (Währungszeichen
`€ `, 2 Nachkommastellen, Dezimaltrenner `,`, Tausendertrenner `.`), gefolgt von
`<em>inkl. MWSt. plus Versandkosten</em>`.

*Zeichenfläche:* `section#canvas-container` mit `tabindex="-1"`, darin
`<canvas id="canvas" width="800" height="450">` mit 1px-Rahmen `#ced4da`.
Ein Tastendruck **Entf** oder **Rücktaste** löscht das ausgewählte Objekt.

*Darunter:* Textfeld `textarea#notes` mit 4 Zeilen und der Beschriftung
`Bemerkungen`, danach der Knopf `btn-primary mt-2` mit Text
`Diese Matte ordern`, der das Modal `#custom-mat-order-modal` öffnet. Der Knopf
ist **deaktiviert**, solange nicht Material, Größe, Menge, Format und Grundfarbe
gesetzt sind.

#### Rechte Spalte `section.col-lg-3` — Karte `Design-details`

Alle Felder in `form-inline form-inline-label-lg`:

| Beschriftung | Bedienelement | Deaktiviert wenn |
|---|---|---|
| `Grundfarbe` | Dropdown mit Farbmuster und dem Text `Color`, Menü mit allen Materialfarben (Kachel + Farbcode) | — |
| `Design-Farbe` | dasselbe | — |
| `Linienfarbe` | dasselbe | — |
| `Linienbreite` | `input[type=number] #strokeWidth`, `max="999"` | Grundrechteck ausgewählt |
| `Elementreihenfolge` | zwei Knöpfe `btn-sm btn-secondary` mit `fa-chevron-up` / `fa-chevron-down` | Grundrechteck ausgewählt |
| `Schriftgröße` | `select#font-weight` mit `normal` → `normal`, `bold` → `fett` | kein Textobjekt ausgewählt |
| `Schriftart` | Dropdown mit den 8 Schriften | kein Textobjekt ausgewählt |
| `Line spacing` | `input[type=number] #lineHeight`, `max="999"`, `step="0.1"` | kein Textobjekt ausgewählt |
| `Letter spacing` | `input[type=number] #letterSpacing`, `max="9999"`, `step="10"` | kein Textobjekt ausgewählt |
| `Textausrichtung` | `btn-group-toggle` mit drei Radioknöpfen: `left` (`fa-align-left`), `center` (`fa-align-center`), `right` (`fa-align-right`) | kein Textobjekt ausgewählt |

Verfügbare Schriften (`displayName` → tatsächliche `fontFamily`):

| Angezeigt | Schriftfamilie |
|---|---|
| Amatic SC | Amatic SC |
| Anton | Anton |
| Arial | **Arimo** |
| Brush | Caveat Brush |
| Dancing Script | Dancing Script |
| Finger Paint | Finger Paint |
| Ubuntu | Ubuntu *(Voreinstellung)* |
| Vast Shadow | Vast Shadow |

#### Bestellmodal `#custom-mat-order-modal`

`modal-lg`. Titel `Kundenmatten-Bestellung`. Im Rumpf zentriert das aus der
Zeichenfläche erzeugte Vorschaubild (`#matDisplay`, `alt="preview"`), darunter
eine Tabelle:

| Zeile | Wert |
|---|---|
| `Material` | Name des Materials |
| `Größe` | `<height> x <width>` cm |
| `Menge` | Menge |
| `Farbe` | Farbkachel 50×50 mit 1px grauem Rahmen, daneben `<code> <name>` |
| `Preis` | Einzelpreis |
| `Total` | Einzelpreis × Menge |
| `Bemerkungen` | Inhalt des Bemerkungsfelds |

Fußzeile: Knopf `btn-secondary` mit `Close` (schließt das Modal) und ein
`<form method="post" action="/de/custom-mat/checkout">` mit dem Knopf
`btn-primary` `Diese Matte ordern` und den verborgenen Feldern
`mat_image`, `mat_material`, `mat_width`, `mat_height`, `mat_quantity`,
`mat_notes` (**zweimal vorhanden**) sowie `mat_submit` mit dem Wert `true`.

### 9.4 Verhalten

**Beim Einhängen** (`mounted` → `createCanvas`):
1. Alle 8 Schriften werden über FontFaceObserver geladen. `loading = true`.
   Schlägt das fehl, erscheint ein `window.alert`:
   `Failed to load fonts, please refresh this page.`
2. Die fabric.js-Zeichenfläche wird erzeugt, ihre Breite auf die Breite von
   `#canvas-container` gesetzt, die Höhe auf 450.
3. Hintergrundfarbe `#F1F1F1`, Hintergrundbild `/images/mat-editor-background.jpg`.
4. `loadMaterials()` holt `GET /<locale>/ajax/custom-mat-materials`, setzt das
   **erste** Material als Voreinstellung und legt ein Beispieldesign an
   (`addSample()`): eine Textbox `Welcome` in `Dancing Script`, weiß, plus
   mehrere Kreise in `#434343`.

**Beobachter:**

| Änderung an | Wirkung |
|---|---|
| `specification.quantity` | > 999 wird auf 999 begrenzt, < 0 wird auf 1 gesetzt |
| `specification.material` | Farben und Größen neu laden, Zeichenfläche leeren |
| `specification.size` | Grundrechteck neu zeichnen |
| `specification.orientation` | Grundrechteck neu zeichnen |
| `specification.baseColor` | Grundrechteck neu zeichnen |
| `selectedColor` | Füllfarbe des gewählten Objekts setzen |
| `selectedStrokeColor` | Linienfarbe setzen |
| `selectedStrokeWidth` | Linienbreite setzen |
| `selectedLineHeight` / `selectedLetterSpacing` / `selectedTextAlign` / `selectedFontFamily` / `selectedFontWeight` | entsprechende Texteigenschaft setzen |

Beim Materialwechsel wird als Grundfarbe und als Vorauswahl für Design- und
Linienfarbe jeweils die **letzte** Farbe der Liste gesetzt
(`colors[colors.length - 1]`), als Größe die **erste**.

**Das Grundrechteck** (`addBase`) hat die feste `id = 99999`, ist nicht
auswählbar bewegbar skalierbar oder drehbar, hat einen Schatten
`0 0 20px rgba(0, 0, 0, 0.8)`, wird ganz nach hinten gestellt und zentriert. Der
Maßstab ergibt sich aus `getScale`: ist die längere Seite die Breite, gilt
`(canvasBreite - 20) / breite`, sonst `(canvasHöhe - 20) / höhe`. Die
Zeichenflächenhöhe wird danach auf `höhe * maßstab + 40` gesetzt.

Bei `orientation === 'HORIZONTAL'` wird `size.height` als Breite und
`size.width` als Höhe verwendet — bei `VERTICAL` umgekehrt.

Wird ein Objekt ausgewählt, bekommt es Rahmenfarbe `#2430fa`, Griffe `#010dff`,
Griffgröße 8, Rahmenskalierung 2.

### 9.5 Der Preis im Designer

Der Designer fragt **keinen** Preisendpunkt ab. Der Preis wird ausschließlich im
Browser berechnet:

```js
price = specification.size.width * specification.size.height * material.price / 10000
```

also schlicht **Fläche in m² × Materialpreis pro m²**. Angezeigt wird
`price * quantity` mit dem Zusatz `inkl. MWSt. plus Versandkosten`.

Es gibt **keinen** Sondermaßzuschlag, **keinen** Sales-Factor, **keine**
Mengenstaffel und **keine** Mehrwertsteuerrechnung — obwohl der Text „inkl.
MWSt." behauptet. Das weicht fundamental von der Produktseiten-Rechnung ab
(Abschnitt 13) und von der Excel-Formel (Abschnitt 14).

### 9.6 Die Materialien (`/de/ajax/custom-mat-materials`)

4 Materialien. Vollständig in `struktur.json` unter `mattendesigner.materialien`.

| id | `name` | `price` (€/m²) | Farben | Größen |
|---|---|---:|---:|---:|
| 1 | `JetPrint` | 101,71 | 47 | 13 |
| 2 | `JetPrint_light` | 78,88 | 15 | 10 |
| 4 | `JetPrint-Velour` | 75,42 | 1 | 11 |
| 5 | `ColorStar` | 101,71 | 1 | 9 |

Die id 3 fehlt. Die Namen erscheinen **roh so** in der Auswahl — inklusive des
Unterstrichs in `JetPrint_light`; die Wörterbucheinträge `label.jetprint_light`
(`JetPrint light`), `label.leather` (`Velour`) und `label.vision` werden nirgends
verwendet.

Beschreibungen (Feld `description`, im Menü nicht angezeigt):

- **JetPrint:** „Individuell angefertigte Hochleistungsmatten hinterlassen einen bleibenden Eindruck. Entwerfen Sie Ihre persönliche Matte, bis 32-farbig. Die JetPrint-Matte mit sehr hoher Schmutzaufnahmekapazität. Einsatz: Eingänge, Corporate Identity, Point of Sale"
- **JetPrint_light:** „Individuell angefertigte JetPrint-Light-Matten im selben Verfahren bedruckt wie JetPrint-Matten, Herstellung jedoch mit geringerer Flordicke und Gummistärke. Sehr gute Schmutzaufnahme. Einsatz: Eingänge, Corporate identity, Point of Sale, Give-Away"
- **JetPrint-Velour:** „Glatte und gleichmäßige Oberfläche für präzisen und detailreichen Druck und erstaunlicher Farbqualität. Einsatz: Messen, Point of Sale, Werbung"
- **ColorStar:** „ca. 1 Woche Lieferzeit a.W. Individuell angefertigte Hochleistungsmatten. Entwerfen Sie Ihre persönliche Matte. Die Matte mit sehr hoher Schmutzaufnahmekapazität. Für Eingänge, Corporate Identity, Point of Sale"

Ein Farbeintrag hat die Felder `id`, `code` (z. B. `601`), `name` (z. B.
`Zitronengelb`), `RGBColor` (z. B. `#fffe28`), `sortPosition`.
Ein Größeneintrag hat `id`, `width`, `height`, `weight` (Gramm), `available`.

Größen von **JetPrint** (`width × height` in cm, Gewicht in g):
40×60 (600) · 50×75 (940) · 60×90 (1350) · 85×120 (2550) · 85×150 (3190) ·
115×175 (5000) · 115×240 (6900) · 150×200 (7500) · 150×300 (11250) ·
200×200 (10000) · 200×300 (11500) · 200×400 (20000) · 200×600 (30000).

Bei den drei anderen Materialien ist `weight` durchgehend `1` — offensichtlich
nicht gepflegt.

### 9.7 Das Bestellformular `/de/custom-mat/checkout`

Symfony-Formular `custom_mat_order_checkout`, `method="post"`.
Überschrift `<h1>Auftrag verlassen</h1>` (unglückliche Übersetzung von
„checkout"), darunter `<h2>Specification</h2>` — englisch.

Es zeigt das Vorschaubild und eine Tabelle mit den Zeilen `Menge`, `Mattenart`,
`Breite`, `Länge`. Die eigentlichen Spezifikationsfelder liegen in einem
`div.d-none` (verborgen, werden aus dem Designer befüllt):

| Feldname | Beschriftung | Typ | Pflicht |
|---|---|---|---|
| `custom_mat_order_checkout[customMat][quantity]` | `Menge` | text | ja |
| `custom_mat_order_checkout[customMat][material]` | `Material` | select (JetPrint / JetPrint_light / JetPrint-Velour / ColorStar) | — |
| `custom_mat_order_checkout[customMat][baseColor]` | `Grundfarbe` | select mit 80 Einträgen | — |
| `custom_mat_order_checkout[customMat][width]` | `Breite (cm)` | text | ja |
| `custom_mat_order_checkout[customMat][height]` | `Höhe (cm)` | text | ja |

Sichtbar ist danach:

| Feldname | Beschriftung | Typ | Pflicht |
|---|---|---|---|
| `[customMat][notes]` | `Bemerkungen` | textarea | — |

Dann die Überschrift `<h2>Kundendaten</h2>` und:

| Feldname | Beschriftung | Typ | Pflicht |
|---|---|---|---|
| `[title]` | `Anrede` | text | **ja** |
| `[firstName]` | `Vorname` | text | nein |
| `[lastName]` | `Nachname` | text | **ja** |
| `[companyName]` | `Firmenname` | text | **ja** |
| `[streetAddress]` | `Straße` | text | **ja** |
| `[city]` | `Stadt` | text | **ja** |
| `[state]` | `Bundesland` | text | **ja** |
| `[postalCode]` | `PLZ` | text | **ja** |
| `[country]` | `Land` | select | — |
| `[phone]` | `Telefon` | text | nein |
| `[email]` | `eMail` | email | nein |
| `[mobile]` | `Mobil` | text | nein |
| `[fax]` | `Fax` | text | nein |
| `[tos]` | `Wir akzeptieren ihre AGB` | checkbox | **ja** |

Absendeknopf: `Auftrag erteilen`. Verborgen außerdem
`[customMat][image][base64]` und `[_token]` (CSRF).

Auffällig: `Firmenname` und `Anrede` sind Pflicht, `eMail` dagegen **nicht** —
eine Bestellung ohne jede Kontaktmöglichkeit wäre formal gültig. Die
AGB-Beschriftung lautet „Wir akzeptieren ihre AGB" (Rollen vertauscht,
Kleinschreibung von „Ihre").

Bei den 80 Grundfarben sind 21 Einträge **keine Farbnamen, sondern rohe
RGB-Werte** wie `229-150-44`, `181-38-112`, `203-198-27`, `0-176-199`,
`115-36-102`, `11-17-63`, `198-54-84`, `134-76-43`, `102-94-86`, `127-187-0`,
`15-18-46`, `74-39-41`, `81-45-66`, `140-130-153`, `188-125-44`, `5-84-89`,
`168-74-42`, `171-130-102`, `163-217-99`, `196-199-212`, `162-160-160`,
`246-211-181`. Außerdem kommen `Hellgrau` (13 und 78) doppelt vor und es gibt
den Tippfehler `Dunkelltürkis`.

---

## 10. Warenkorb und Checkout

**Warenkorb:** Es gibt keine eigene Warenkorbseite (`/de/order/cart` → 404).
Der Warenkorb ist ausschließlich das Modal `#cart-modal` im Seitenrahmen
(Abschnitt 2). Es wird per AJAX nachgeladen; solange das läuft, liegt
`div.cart-loading` (halbtransparent weiß, Spinner 3rem) darüber.

**Ins-Formular-Absenden:** `POST /de/order/add-to-cart` mit den Feldern
`product_id`, `size_id`, `fixed_width`, `width`, `length`, `quantity`,
`attributes[N][]`, `multiple_colors` und `submit` (`CART` oder `INQUIRY_CART`).

**Checkout:** `GET /de/order/checkout` antwortet bei leerem Warenkorb mit
**302 auf `/de`**. Der Checkout ist damit nur nach einem `POST` erreichbar.

> **Nicht erfasst:** Die Checkout-Seite und der gefüllte Warenkorb konnten
> **nicht** dokumentiert werden, weil dafür ein `POST` (Artikel in den Warenkorb
> legen) nötig gewesen wäre. Der Auftrag beschränkt die Erfassung auf lesende
> Zugriffe. Siehe Abschnitt 18.

Ein allgemeiner Absendeknopf-Effekt gilt seitenweit: beim Absenden **irgendeines**
Formulars wird die Breite des Knopfes festgeschrieben, sein Inhalt durch
`<i class="fas fa-spinner fa-spin"></i>` ersetzt und der Knopf deaktiviert.

---

## 11. Login und Registrierung

Vollständig in `texte/login.md` und `texte/register.md`. Kurzfassung:

**Login** `POST /de/login`:

| Feld | Beschriftung | Platzhalter | Typ | Pflicht |
|---|---|---|---|---|
| `_username` | `eMail` | `eMail-Adresse eingeben` | text | ja |
| `_password` | `Passwort` | `Passwort eingeben` | password | ja |
| `_remember_me` | `mich erinnern` | — | checkbox | nein |

Knopf `Login`. **Kein CSRF-Token im Markup.**

**Registrierung** — Symfony-Formular `user_registration`, 15 sichtbare Felder
plus CSRF-Hidden. Pflicht: eMail, Passwort, Anrede, Nachname, Straße, Stadt,
Bundesland, PLZ, Telefon, Mobil. Optional: Vorname, Firmenname, USt-ID, Fax.
`Land` ist ein Select mit 249 Ländern, `DE` vorausgewählt. Knopf: `versenden`.

Es fehlen: Passwort-Wiederholung, AGB- und Datenschutz-Kontrollkästchen,
Captcha. `Anrede` und `Bundesland` sind freie Pflicht-Textfelder, `Vorname` ist
optional.

---

## 12. Blog, Gästebuch, Infoseiten

**Blog** `/de/blog` — **2 Beiträge**. Die Übersicht zeigt bereits den kompletten
Text und darunter den Link `Continue reading`. Keine Paginierung, nicht nach
Datum sortiert.

| Titel | Slug | Datum |
|---|---|---|
| FUCHSIUS multi-media GmbH | `der-mattenfuchs` | February 1, 2019 08:06 |
| Eine neue Mattengeneration | — | August 17, 2019 09:05 |

Das Datum ist englisch formatiert. Details in `texte/blog.md`.

**Gästebuch** `/de/guest-book` — antwortet mit 200, der Inhaltsbereich enthält
aber nur zwei leere `<div>`. Keine Überschrift, kein Formular, keine Tabelle,
keine Einträge. Für den Nachbau gibt es hier **keine Struktur**; die Seite ist
in der Kopfzeile verlinkt, aber funktionslos. Entsprechend sind auch keine
personenbezogenen Daten vorhanden.

**Infoseiten** — Wortlaut vollständig in `texte/agb.md`, `texte/impressum.md`,
`texte/data-protection.md`, `texte/datenschutzerklarung-dsgvo.md`.

Zu beachten:
- `data-protection` und `datenschutzerklarung-dsgvo` sind **fast identisch**;
  Unterschiede nur im Einleitungssatz, in `info@matten.de` vs. `info@matten.net`
  und in der Markup-Sauberkeit.
- Im **Impressum** steckt zusätzlich eine dritte, vor-DSGVO-Datenschutzerklärung
  (Facebook-Plugins, Twitter-Buttons).
- Die Seiten nennen durchgehend „www.matten.de", nicht matten.net.

---

## 13. Die Preisformel von matten.net

Dieser Abschnitt ist **empirisch belegt**: alle Aussagen stammen aus
systematischen Aufrufen von `/de/ajax/product-price` und `/de/ajax/demo-price`
mit variierten Parametern, nicht aus dem Quelltext.

### 13.1 `/de/ajax/product-price`

`GET`, Parameter `length`, `width`, `quantity`, `productId`, `singleColor`,
`attributeValueIds[]`. Antwort als JSON:

```json
{
  "length": 100, "width": 100, "quantity": "1",
  "price": 127.13221250000001,
  "result": 127.13221250000001,
  "taxRate": "19.00",
  "singleColor": false,
  "total": 151.287332875,
  "shippingCost": "10.00",
  "shippingCostHtml": "    Plus 10.00€ Versandkosten\n",
  "pricePlusVatHtml": "€ 61.29\n"
}
```

- `price` und `result` = **Nettopreis je Stück**, volle Genauigkeit
- `total` = `price × quantity × (1 + taxRate/100)` — Bruttosumme
- `pricePlusVatHtml` ist das, was tatsächlich in `#price` angezeigt wird — und
  **stimmt nicht** (siehe 17.1)

### 13.2 `/de/ajax/demo-price`

Liefert eine HTML-Debug-Tabelle in vier Blöcken. Die Beschriftungen wörtlich:

| Block | Zeilen |
|---|---|
| `Product Info` | `Name`, `Number`, `Database Id`, `Sales factor` |
| `Customer Inputs` | `Length`, `Width`, `Quantity`, `Total SQM`, `Total extra cost (special attribute) multiplier`, `Total Weight`, `Single color` |
| `Computed` | `Purchase/QM`, `Special width surcharge`, `Special length surcharge` |
| `Sale Price` | `Sales/piece`, `Total sales nett`, `Tax rate`, `Total + VAT` |

Alle Zahlen sind auf 2 Nachkommastellen gerundet — der `Sales factor` erscheint
z. B. als `1.93`, obwohl er in Wahrheit `1,931` ist.

### 13.3 Die Formel

```
qm_je_Stück   = Breite × Länge / 10000
qm_gesamt     = qm_je_Stück × Menge

EK_pro_qm     = Staffelpreis(Produkt, qm_gesamt)
f_Sondermaß   = (Breite ∈ Standardbreiten(Produkt)  ODER
                 Länge  ∈ Standardbreiten(Produkt))  ?  1,00  :  1,25
f_Einfarbig   = singleColor  ?  Einfarbig-Faktor(Produkt)  :  1,00
Aufschlag     = Σ extraCost der gewählten attributeValueIds

VK je Stück   = qm_je_Stück × EK_pro_qm × SalesFactor × f_Sondermaß × f_Einfarbig
                + Aufschlag
Netto gesamt  = VK je Stück × Menge
Brutto gesamt = Netto gesamt × 1,19
Versand       = fester Betrag je Produkt
```

**Geprüft:** 84 Fälle über 14 Produkte, 6 Maß-/Mengen-/Farbkombinationen je
Produkt. 76 stimmen exakt; die 8 Abweichungen betreffen ausschließlich
`singleColor` und sind vollständig durch den produktabhängigen
Einfarbig-Faktor erklärt (siehe 13.7).

### 13.4 Der Sondermaßzuschlag

Der Zuschlag beträgt **immer exakt 1,25**. Er entfällt, sobald **eine** der
beiden Seiten eine Standardbreite trifft — es ist ein **ODER**, genau wie in der
Excel-Formel. Belegt durch einen Sweep über die Breiten 40–200 cm in 5er-Schritten
bei fester, nicht standardgerechter Länge:

| Maß (Produkt 6) | Faktor | Grund |
|---|---:|---|
| 100 × 100 | 1,25 | keine Seite trifft |
| 100 × 60 | 1,00 | 60 ist Standardbreite |
| 60 × 100 | 1,00 | 60 ist Standardbreite |
| 90 × 120 | 1,25 | keine Seite trifft |
| 120 × 90 | 1,25 | keine Seite trifft |
| 250 × 250 | 1,25 | keine Seite trifft |
| 50 × 200 | 1,00 | 200 ist Standardbreite |
| 200 × 50 | 1,00 | 200 ist Standardbreite |
| 85 × 700 | 1,00 | 85 ist Standardbreite |

**Die Standardbreiten sind je Produkt verschieden.** Empirisch bestimmt:

| Produkt | Standardbreiten |
|---|---|
| 6, 7, 8, 9, 10, 22, 28, 32, 33, 39 (JetPrint-Familie, Hinweismatten, OS-Stern) | **60, 75, 85, 115, 150, 200** |
| 1, 4, 25 (IRON-HORSE) | **85, 115, 150, 200** |
| 18, 19 (Kokos) | **200** |
| 34 (Aluminium Diplomat R) | **100** |

**Gegenprobe:** Bei den Produkten, deren Seite ein `select#input_fixed_width`
enthält, sind dessen Optionen **exakt** diese Werte. Die Liste stammt also aus
demselben Datenfeld — sie ist beim Nachbau je Produkt zu pflegen.

Die Tabellenzeilen `Special width surcharge` und `Special length surcharge` aus
`demo-price` sind **irreführend**: sie zeigen produktabhängige Prozentwerte
(Produkt 6: 0 % / 0 %, Produkt 34: 10 % / 0 %, Produkt 39: 25 % / 25 %), die mit
dem tatsächlich angewandten Faktor **nichts zu tun haben** — der ist in allen
drei Fällen 1,25. Diese Felder dürfen beim Nachbau nicht in die Rechnung
einfließen.

### 13.5 Der Sales Factor

Je Produkt fest hinterlegt. Exakte, aus den Antworten rückgerechnete Werte
(die Debug-Tabelle rundet auf zwei Stellen):

| pid | Produkt | Artikelnummer | EK/m² | Sales Factor | Standardbreiten |
|---:|---|---|---:|---:|---|
| 1 | IRON-HORSE 1-farbige und melierte Schmutzfangmatten | `63000` | 27,89 | **1,800** | 85, 115, 150, 200 |
| 6 | JetPrint-Premium | `6300000N` | 52,67 | **1,931** | 60, 75, 85, 115, 150, 200 |
| 7 | JetPrint Premium 1-farbig | `6301000N` | 52,67 | **1,931** | 60, 75, 85, 115, 150, 200 |
| 8 | JetPrint light 1-farbig | `6300001N` | 40,85 | **1,870** | 60, 75, 85, 115, 150, 200 |
| 9 | JetPrint Matten, Design | `6320011N` | 54,63 | **1,931** | 60, 75, 85, 115, 150, 200 |
| 10 | Designmatten JetPrint | `4711000N` | 52,67 | **1,931** | 60, 75, 85, 115, 150, 200 |
| 18 | Kokos, natur | `6920001N` | 41,84 | **1,375** | 200 |
| 19 | Kokos, farbig | `6920002` | 53,88 | **1,375** | 200 |
| 22 | JetPrint light Logo | `6300202N` | 43,39 | **1,970** | 60, 75, 85, 115, 150, 200 |
| 25 | IRON-HORSE-2 | `630001` | 50,00 | **1,600** | 85, 115, 150, 200 |
| 28 | Hinweismatten | `6390202 MJPRNT` | 40,85 | **1,931** | 60, 75, 85, 115, 150, 200 |
| 32 | Designmatten JetPrint-light | `4711001 MJPLIT` | 38,54 | **1,931** | 60, 75, 85, 115, 150, 200 |
| 33 | Designmatten JetPrint-Velour | `4711003N` | 39,06 | **1,931** | 60, 75, 85, 115, 150, 200 |
| 34 | Aluminium-Profilmatte, Typ Diplomat R | `652601` | 265,09 | **1,317** | 100 |
| 39 | OS-Stern-REHAB-Trainingsmatte | `6027004` | 52,67 | **1,931** | 60, 75, 85, 115, 150, 200 |

Vier Produkte haben **keinen Einkaufspreis** hinterlegt (`Purchase/QM = 0`) und
liefern deshalb **immer den Preis 0,00 €**:

| pid | Produkt | Artikelnummer | Sales Factor |
|---:|---|---|---:|
| 4 | IRON-HORSE-Mietmatte | `64000121` | 1,60 |
| 12 | OS-Quadrat-REHAB-Trainingsmatte | `6027001` | 1,60 |
| 26 | Kokos, Logomatten | `6920003` | 1,60 |
| 40 | OS-5-Punkt-REHAB-Trainingsmatte-c | `6027003` | 1,60 |

Produkt 4 (`IRON-HORSE-Mietmatte`) ist eines der 5 Produkte, die auf der
Startseite unter `TOP-ANGEBOTE` beworben werden — und kostet 0,00 €.

### 13.6 Die Mengenstaffel

**Der Rabatt hängt nicht an der Stückzahl, sondern an der Gesamtfläche in m².**
Das ist der überraschendste Befund und leicht zu übersehen: Bei einer 1 m²
großen Matte fallen Stückzahl- und Flächenschwelle zufällig zusammen.

Belegt: eine einzelne Matte von 200 × 5000 cm (= 100 m², Menge **1**) bekommt
denselben Einkaufspreis wie 51 Matten à 1 m².

Der Rabatt wirkt **über den Einkaufspreis pro m²**, nicht als Nachlass auf den
Verkaufspreis. Schwellen (jeweils **streng größer**):

| Gesamtfläche | Stufe |
|---|---|
| bis einschließlich 25 m² | 1 |
| über 25 bis 50 m² | 2 |
| über 50 bis 100 m² | 3 |
| über 100 m² | 4 |

Feinmessung bei Produkt 6: 25,0 m² → 52,67 · 25,5 m² → 51,44 · 50,0 m² → 51,44 ·
50,5 m² → 49,59 · 100,0 m² → 49,59 · 100,5 m² → 45,87.

**Nur 3 der 19 Produkte haben überhaupt mehr als eine Stufe hinterlegt:**

| pid | Stufe 1 (≤25 m²) | Stufe 2 (≤50) | Stufe 3 (≤100) | Stufe 4 (>100) |
|---:|---:|---:|---:|---:|
| 6, 7, 39 | 52,67 | 51,44 | 49,59 | 45,87 |
| 8, 28 | 40,85 | 40,85 | 39,06 | 39,06 |
| alle übrigen | konstant | | | |

Bei Produkt 8 und 28 gibt es also nur **eine** Stufe bei 50 m². Bei allen
anderen Produkten (1, 9, 18, 19, 22, 25, 32, 33, 34) ist der Einkaufspreis
über alle Mengen **konstant** — es gibt dort keinerlei Mengenrabatt.

### 13.7 `singleColor`

Wirkt als **Faktor auf den Verkaufspreis**, produktabhängig:

| Faktor | Produkte |
|---|---|
| **0,90** | 6, 7, 8, 9, 10, 22, 25, 28, 32, 33, 39 |
| **1,00** (keine Wirkung) | 1, 18, 19 |
| **0,00** (Preis wird 0,00 €) | **34** — Fehler, siehe 17.2 |

Der Faktor wirkt **multiplikativ und unabhängig** vom Sondermaßzuschlag; bei
Produkt 6 ergibt 100 cm Breite mit `singleColor` genau 1,25 × 0,90 = **1,125**.

Der `Sales factor` in der Debug-Tabelle ändert sich dabei **nicht** — der Rabatt
steckt also nicht im Faktor, sondern kommt separat obendrauf.

**Praktisch ohne Wirkung:** Kein Produkt rendert das Bedienelement
`input[name="mat_colors"]`, das den Parameter setzen würde. Im laufenden Betrieb
ist `singleColor` deshalb immer `false`.

### 13.8 `attributeValueIds`

Die gewählten Attributwerte können einen **absoluten Aufschlag je Stück**
tragen (`extraCost`). Er wird **ganz am Ende addiert**, skaliert **weder** mit
der Fläche **noch** mit der Menge (im Sinne von: er ist Teil des Stückpreises
und wird damit je Stück fällig).

Belegt:

| Produkt | Attributwert | `extraCost` | Wirkung |
|---|---|---:|---|
| 34 | `1838` — `mit Kratzkante` | 35,87 | +35,87 € je Stück, unabhängig von der Fläche (geprüft bei 0,5 / 1 / 2 / 4 m²) |
| 18 | `166` — `30mm` | 10,56 | +10,56 € je Stück |
| 18 | `148` — `13/14mm` | 0,00 | keine |
| 34 | `1825`/`1827` (Höhe), `1829` (Profilbreite), `1830`/`1831` (Format) | 0,00 | keine |
| 6 | alle Farbwerte | 0,00 | keine |
| 28 | `1781`/`1785` (Schrift-Design, Format) | 0,00 | keine |

Die Tabellenzeile heißt `Total extra cost (special attribute) multiplier`, das
Feld verhält sich aber **additiv**, nicht multiplikativ. Werden mehrere
Attributwerte mit Aufschlag gewählt, summieren sie sich; bei Produkt 34 trug in
den Stichproben nur `1838` einen Aufschlag, weshalb `[1827, 1829, 1838]`
denselben Wert ergibt wie `[1838]` allein.

**Wichtig für den Nachbau:** Das JS sammelt `attributeValueIds` nur aus
`select.attribute-select`. Die **Farbauswahl** ist aber als
`input[type=radio]` umgesetzt und wird deshalb **nie mitgeschickt** — Farben
können daher gar keinen Aufschlag auslösen, selbst wenn einer hinterlegt wäre.

### 13.9 Versandkosten und Steuer

- **Steuersatz:** 19,00 %, in `taxRate` mitgeliefert.
- **Versand:** ein **fester Betrag je Produkt**, unabhängig von Gewicht, Fläche
  und Menge. Produkt 6: `10.00` (Text `Plus 10.00€ Versandkosten`), Produkt 34:
  `0.00` (leerer Text). Auch bei 100 Matten mit 3.472 kg Gesamtgewicht bleibt es
  bei 10,00 €.
- Das Feld `Total Weight` wird berechnet (Produkt 6: 2,48 kg/m²), aber **nicht
  für den Versand verwendet**.

### 13.10 Fehlende Validierung

Die Preisendpunkte prüfen **keine** Grenzen. Die `min`/`max`-Angaben existieren
nur im HTML-Formular. Direkt aufgerufen liefert der Server:

| Eingabe | Antwort |
|---|---|
| Breite 0 | `price: 0` |
| Breite 39 (unter dem Formular-Minimum 40) | ganz normal berechnet |
| Breite 201, Länge 701 (über dem Maximum) | ganz normal berechnet |
| 1000 × 1000 cm | ganz normal berechnet (100 m², Staffelstufe 3) |
| Breite **−50** | **negativer Preis** −63,57 € |

Es gibt keine Entsprechung zu den Excel-Fehlerfällen „zu schmal", „Matte zu
breit", „Matte zu lang".

---

## 14. Abweichungen zur Excel-Formel (`PREISFORMEL.md`)

Verglichen wird die aus `PREISE-Brian-26-10_22-11.xlsx` abgeleitete Formel mit
dem empirisch bestimmten Verhalten von matten.net. **Das ist der wichtigste
Abschnitt dieses Dokuments.**

### 14.1 Was übereinstimmt

| Punkt | Excel | matten.net |
|---|---|---|
| Grundrechnung | `qm × EK/qm × SalesFactor` | identisch |
| Sondermaßfaktor | 1,25 | 1,25 |
| Sondermaß-Logik | **ODER** über beide Seiten | **ODER** über beide Seiten |
| Standardbreiten (JetPrint) | 60, 75, 85, 115, 150, 200 | 60, 75, 85, 115, 150, 200 |
| Steuersatz | — (nicht in der Mappe) | 19 % |
| Rundung | rechnet ungerundet, rundet erst bei der Ausgabe | ebenso |

Die Standardbreiten der Mappe (`Q7…V7`) treffen die JetPrint-Familie **exakt**.

### 14.2 Die Abweichungen im Einzelnen

#### A — Standardbreiten sind produktabhängig, nicht global

| | Excel | matten.net |
|---|---|---|
| | eine globale Liste `60, 75, 85, 115, 150, 200` | **je Produkt eine eigene Liste** |

matten.net kennt vier verschiedene Listen (siehe 13.4). Für IRON-HORSE gelten
nur `85, 115, 150, 200`, für Kokos nur `200`, für die Aluminium-Profilmatte nur
`100`. **Folge:** Eine 60 × 100 cm große IRON-HORSE-Matte kostet auf matten.net
25 % mehr, als die Excel-Formel ergäbe. Bei Kokos betrifft das fast jedes Maß.

> Beim Nachbau ist die globale Konstante `standardbreiten` durch ein Feld am
> Produkt zu ersetzen.

#### B — Die Mengenstaffel ist völlig anders aufgebaut

| | Excel | matten.net |
|---|---|---|
| Bezugsgröße | **Stückzahl** | **Gesamtfläche in m²** |
| Schwellen | 2, 3, 10, 20, 30 Stück | 25, 50, 100 m² |
| Rabattstufen | 0,95 · 0,92 · 0,90 · 0,89 · 0,88 | keine Faktoren, sondern **eigene Einkaufspreise je Stufe** |
| Angriffspunkt | Nachlass auf den **Verkauf** | niedrigerer **Einkaufspreis pro m²** |
| Geltung | für alle Artikel gleich | nur bei **3 von 19** Produkten überhaupt hinterlegt |

Das ist die gravierendste Abweichung. Beispiel: 10 Matten à 60 × 90 cm
(= 5,4 m²) bekommen nach Excel 10 % Nachlass, auf matten.net **null** — die
Fläche liegt unter 25 m². Umgekehrt bekommt eine **einzelne** sehr große Matte
(200 × 5000 cm) auf matten.net einen Rabatt, nach Excel nicht.

Die tatsächlichen Rabatte sind zudem viel kleiner: bei Produkt 6 sinkt der Preis
von Stufe 1 auf Stufe 4 um 12,9 % (52,67 → 45,87), während Excel bereits ab
30 Stück 12 % gibt — aber schon ab 2 Stück 5 %.

#### C — Einfarbig ist kein eigener Sales Factor, sondern ein Faktor 0,9

| | Excel | matten.net |
|---|---|---|
| Modell | `Colortype` wählt einen von drei Sales Factors: mehrfarbig 1,931 · einfarbig 1,728 · Ped-Print 1,8 | ein Sales Factor je Produkt, `singleColor` multipliziert zusätzlich mit **0,90** |
| Ergebnis einfarbig | Faktor **1,728** | 1,931 × 0,9 = **1,7379** |
| Abweichung | | **+0,57 %** |

Zusätzlich ist die Wirkung produktabhängig: bei den Produkten 1, 18 und 19 hat
`singleColor` **gar keine** Wirkung.

Interessant: die drei Excel-Sales-Factors tauchen auf matten.net alle als
Produkt-Sales-Factors auf — 1,931 (JetPrint-Familie), 1,8 (Produkt 1) und
Werte wie 1,87 / 1,97 / 1,6 / 1,375 / 1,317, die die Mappe nicht kennt. Der
Sales Factor ist auf matten.net also eine **Artikeleigenschaft**, in der Mappe
eine **Qualitätseigenschaft**.

#### D — Sonderform und Sonderfarbe fehlen vollständig

| Excel | matten.net |
|---|---|
| `Sonderform ohne Rand` × 1,3 | **nicht vorhanden** |
| `Sonderform mit Rand` × 1,5 | **nicht vorhanden** |
| `Sonderfarbe` + 68 € VK (einmal je Auftrag) | **nicht vorhanden** |

Es gibt auf matten.net keinen Parameter, kein Formularfeld und keine Zeile in
der Debug-Tabelle, die diesen drei Optionen entspräche. Die gesamte Logik des
Einmal-Aufschlags aus Abschnitt 4.1 der `PREISFORMEL.md` — der Kern-Sonderfall,
`F5 = Menge × G5 − (Menge − 1) × P5` — hat auf matten.net **keine
Entsprechung**.

#### E — Attributaufschläge gibt es nur auf matten.net

matten.net kennt mit `extraCost` einen absoluten Aufschlag je Stück aus den
gewählten Produktattributen (z. B. „mit Kratzkante" +35,87 €, Kokos „30mm"
+10,56 €). Die Mappe kennt so etwas nicht.

#### F — Teuerungszuschlag fehlt

Die Mappe hat `TZ %` (`R2`, derzeit 0 %). matten.net hat kein solches Feld. Da
der Wert derzeit 0 ist, wirkt sich das nicht auf Zahlen aus, wohl aber auf das
Datenmodell.

#### G — Größenprüfung fehlt

| Excel | matten.net |
|---|---|
| `zu schmal` wenn eine Seite < 30 cm | keine Prüfung |
| `Matte zu breit` wenn beide Seiten > 200 cm | keine Prüfung |
| `Matte zu lang` wenn die längere Seite > 700 cm | keine Prüfung |

Die HTML-Formulare beschränken auf Breite 40–200 cm und Länge 40–700 cm — also
eine **andere Mindestbreite** (40 statt 30). Der Server prüft gar nichts und
liefert bei negativer Breite einen negativen Preis (13.10).

#### H — Einkaufspreis pro m²

Die Mappe nennt `54,63 €` als globalen Wert `Q5`. Auf matten.net ist das ein
Feld je Produkt mit Werten von **27,89 € bis 265,09 €**. Der Excel-Wert 54,63
taucht als Einkaufspreis von **Produkt 9 (JetPrint Matten, Design)** exakt auf —
die Mappe hat also offenbar diesen Artikel als Beispiel verwendet.

Ebenso ist der Referenzfall der Mappe (50 × 200 cm, 1 Stück, Colortype 1)
auf matten.net nachvollziehbar: 1 m² × 54,63 × 1,931 × 1,00 = **105,49 €** —
identisch mit dem Excel-Wert `G5 = 105,49053 €`, weil 200 cm bei Produkt 9 eine
Standardbreite ist. **Für diesen einen Fall stimmen beide Rechnungen exakt
überein.**

#### I — Der Mattendesigner rechnet noch einmal völlig anders

Weder Excel noch die Produktseiten-Logik: der Designer rechnet nur
`Fläche × Materialpreis` (Abschnitt 9.5). Kein Sales Factor, kein Sondermaß,
keine Staffel, keine Steuer — obwohl „inkl. MWSt." dransteht. Die
Designer-Materialpreise (101,71 / 78,88 / 75,42 €) sind offenbar bereits
Verkaufspreise: 52,67 × 1,931 = **101,71** — exakt der JetPrint-Preis im
Designer. Der Designer verwendet also den **Verkaufspreis pro m² ohne
Sondermaßzuschlag**.

### 14.3 Zusammenfassung der Abweichungen

| Nr. | Punkt | Schwere |
|---|---|---|
| B | Mengenstaffel: Fläche statt Stückzahl, andere Schwellen, andere Wirkung | **hoch** |
| D | Sonderform (×1,3 / ×1,5) und Sonderfarbe (+68 €) fehlen ganz | **hoch** |
| A | Standardbreiten je Produkt statt global | **hoch** |
| I | Designer rechnet nach einer dritten, eigenen Formel | **hoch** |
| C | Einfarbig als Faktor 0,9 statt eigenem Sales Factor (+0,57 %) | mittel |
| G | Keine Größenprüfung, negative Preise möglich | mittel |
| E | Attributaufschläge nur auf matten.net | mittel |
| H | EK/m² und Sales Factor je Produkt statt global | niedrig (Datenmodell) |
| F | Teuerungszuschlag fehlt | niedrig (derzeit 0 %) |

**Fazit:** Die beiden Kalkulationen teilen nur den Kern
`qm × EK × SalesFactor × 1,25`. Alles, was darüber hinausgeht — Mengenstaffel,
Sonderformen, Sonderfarbe, Colortype — ist entweder anders umgesetzt oder gar
nicht vorhanden. Wer die Excel-Formel als Sollzustand nimmt, muss auf matten.net
die Punkte B, D und A nachrüsten.

---

## 15. Kategorien und Produkte

### 15.1 Die 27 Kategorien

| Slug | Anzeigename | Gruppe | Produkte | Beschreibung |
|---|---|---|---:|---|
| `jetprint-einfarbig` | JetPrint-einfarbig | Fussmatten | 2 | Fußmatten, einfarbig. Wahl aus 150 Farben Nach Ihren Wünschen gefertigt |
| `ironhorse` | IronHorse | Fussmatten | 3 | (langer Text, siehe unten) |
| `ironhorse-xl` | IronHorse XL | Fussmatten | 0 | — |
| `designmatten` | Designmatten | Logomatten | 5 | — |
| `jet-print-light` | Jet Print light | Logomatten | 1 | — |
| `katzen-willk` | Katzen Willk | Logomatten | 0 | — |
| `jetprint-design` | JetPrint-Design | Logomatten | 1 | — |
| `os-rehab-physio-matten` | OS-REHAB-Physio-Matten | OS-REHA-Physio-Matten | 3 | OS-Physio-REHA-Matten nach Ihren Angaben designed |
| `os-y-matte-wide-balance` | OS-Y-Matte, Wide Balance | OS-REHA-Physio-Matten | 0 | OS-Physio-REHAB-Y-Matte, Wide Balance |
| `os-rehab-basis-matte` | OS-REHAB Basis-Matte | OS-REHA-Physio-Matten | 0 | OS-REHAB Basis-Matte |
| `os-rehab-bahnmatte` | OS-REHAB-Bahnmatte | OS-REHA-Physio-Matten | 0 | OS-Physio-REHAB-Bahnmatte |
| `os-rehab-stern-matte` | OS-REHAB-Stern-Matte | OS-REHA-Physio-Matten | 1 | OS-Physio-REHAB-Stern-Matte |
| `os-rehab-gitter-matte` | OS-REHAB-Gitter-Matte | OS-REHA-Physio-Matten | 0 | OS-Physio-REHAB-Gitter-Matte |
| `os-rehab-5-punkt-matte` | OS-REHAB-5-Punkt-Matte | OS-REHA-Physio-Matten | 1 | OS-REHAB-5-Punkt-Matte |
| `os-rehab-quadrat-matte` | OS-REHAB Quadrat-Matte | OS-REHA-Physio-Matten | 1 | OS-REHAB Quadrat-Matte |
| `kokos-farbig` | Kokos Farbig | Kokosmatten | 1 | — |
| `kokos-naturfarbig` | Kokos naturfarbig | Kokosmatten | 1 | — |
| `kokos-logomatte` | Kokos-Logomatte | Kokosmatten | 1 | Kokos-Logomatte einfarbig und mehrfarbig gestaltet |
| `marschall` | MARSCHALL | Aluminium-Matten | 0 | — |
| `diplomat` | Diplomat | Aluminium-Matten | 1 | — |
| `cushion-coil` | Cushion Coil | Gummimatten | 0 | — |
| `scraper` | Scraper | Gummimatten | 0 | — |
| `struktura` | Struktura | Gummimatten | 0 | Gummi-Wabenmatte mit und ohne Bürsteneinsätze Höhen 13,5 und 22mm |
| `turf` | Turf | Outdoor-Matten | 0 | — |
| `iron-horse-mietmatten` | IRON-HORSE-Mietmatten | Mietmatten | 0 | — |
| `waschbecken` | Waschbecken | Was ist neu | 0 | Natursteinwaschbecken aus Flußstein, Marmor, Onyx, Fossil |
| `was-ist-neu` | Was ist neu | *(nur Startseite)* | 0 | Natursteinwaschbecken aus Flußstein, Marmor, Onyx, Fossil |

**14 der 27 Kategorien sind leer.** Die Kategorie `was-ist-neu` steht **nicht**
im Menü — sie ist ausschließlich über die Kachel „Featured Category (German)"
auf der Startseite erreichbar; im Menü erscheint stattdessen die **Gruppe**
gleichen Namens mit der Kategorie `waschbecken`.

Beschreibung von `ironhorse` (die einzige lange), wörtlich:

> Die schön&sauber-Iron-Horse®-Fussmatte ist eine robuste Matte, zur Aufnahme
> von Schmutz und Nässe. Die schön&sauber-Fussmatte ist eine waschbare
> Schmutzfangmatte. Die schön&sauber-Iron-Horse®-Fussmatte ist das
> "Arbeitspferd" unter den textilen Eingangsmatten. Die Matte wurde geschaffen
> um höchsten Schmutz-Rückhalte-Anforderungen zu entsprechen. Sie überzeugt
> durch extreme Schmutz-Halte-Kapazität und Strapazierfähigkeit und stellt mit 8
> harmonisch abgestimmten melierten Farben für jeden Eingangsbereich und Raum
> eine optische Aufwertung dar. Die zu 100% voll durchgefärbte Polyamid-
> Nylonfaser (solution-dyed) nimmt bis zu 4 kg/qm Schmutz und Feuchtigkeit auf.
> Sie hält den Schmutz zwischen den Fasern fest und senkt damit den
> Reinigungsaufwand in Gebäuden erheblich. Die Rückenbeschichtung ist ein 100%
> bis zu 80°C maschinenwaschbarer Nitrilgummi.

### 15.2 Die 19 Produkte

Vollständige Daten in `struktur.json` unter `produkte`. Übersicht:

| pid | Slug | Name | Artikelnummer | Fixgrößen | Attribute |
|---:|---|---|---|---:|---:|
| 1 | `iron-horse-1-farbige-und-melierte-schmutzfangmatten` | IRON-HORSE 1-farbige und melierte Schmutzfangmatten | `63000` | 0 | 0 |
| 4 | `iron-horse-matte` | IRON-HORSE-Mietmatte | `64000121` | 7 | 0 |
| 6 | `jetprint-premium` | JetPrint-Premium | `6300000N` | 8 | 0 |
| 7 | `jetprint-premium-1-farbig` | JetPrint Premium 1-farbig | `6301000N` | 8 | 0 |
| 8 | `mjplit-jetprint-light-1-farbig` | JetPrint light 1-farbig | `6300001N` | 7 | 0 |
| 9 | `jetprint-matten-design` | JetPrint Matten, Design | `6320011N` | 9 | 0 |
| 10 | `designmatten-jetprint` | Designmatten JetPrint | `4711000N` | 5 | 0 |
| 12 | `os-quadrat-rehab-trainingsmatte` | OS-Quadrat-REHAB-Trainingsmatte | `6027001` | 0 | 0 |
| 18 | `kokosmatten-naturfarbig` | Kokos, natur | `6920001N` | 0 | 1 (`Mattenhöhe`) |
| 19 | `kokos-farbig` | Kokos, farbig | `6920002` | 0 | 1 (`Höhe`) |
| 22 | `jetprint-light-logo` | JetPrint light Logo | `6300202N` | 7 | 0 |
| 25 | `iron-horse-matte-2` | IRON-HORSE-2 | `630001` | 0 | 0 |
| 26 | `kokos-gestaltet` | Kokos, Logomatten | `6920003` | 0 | 0 |
| 28 | `hinweismatten` | Hinweismatten | `6390202 MJPRNT` | 8 | 2 (`Schrift-Design`, `Format`) |
| 32 | `designmatten-jetprint-light` | Designmatten JetPrint-light | `4711001 MJPLIT` | 5 | 0 |
| 33 | `designmatten-jetprint-velour` | Designmatten JetPrint-Velour | `4711003N` | 8 | 0 |
| 34 | `aluminium-profilmatte-typ-diplomat-r` | Aluminium-Profilmatte, Typ Diplomat R | `652601` | 0 | 4 |
| 39 | `os-stern-rehab-trainingsmatte` | OS-Stern-REHAB-Trainingsmatte | `6027004` | 3 | 0 |
| 40 | `os-5-punkt-rehab-trainingsmatte-c` | OS-5-Punkt-REHAB-Trainingsmatte-c | `6027003` | 0 | 0 |

Der Name in der Navigation weicht teils vom Namen im Preisdienst ab (z. B.
Slug `kokos-gestaltet` → Kartentitel „Kokos, Logomatten").

**Nur die Produkte 6, 7 und 8 haben `data-price` an ihren Fixgrößen.** Bei allen
anderen ist das Attribut leer — der Preis der Fixgrößen wird dort erst per AJAX
ermittelt.

Fixgrößen mit Preis, Produkt 6 (`JetPrint-Premium`), `Länge cm x Breite cm` = Preis:

| Beschriftung | `size_id` | `data-length` | `data-width` | `data-price` |
|---|---|---:|---:|---:|
| 40 cm x 60 cm | 343 | 40 | 60 | 24,20 |
| 50 cm x 75 cm | 344 | 50 | 75 | 37,50 |
| 60 cm x 90 cm | 345 | 60 | 90 | 54,10 |
| 85 cm x 115 cm | 346 | 85 | 115 | 98,60 |
| 85 cm x 150 cm | 347 | 85 | 150 | 128,50 |
| 85 cm x 300 cm | 348 | 85 | 300 | 258,20 |
| 115 cm x 175 cm | 349 | 115 | 175 | 203,20 |
| 150 cm x 200 cm | 350 | 150 | 200 | 304,10 |
| Custom | `FIXED+CUSTOM_SIZE` | — | — | — |

Die Attribute von Produkt 34 (`Aluminium-Profilmatte, Typ Diplomat R`) — das
einzige Produkt mit mehreren Auswahlfeldern:

| Formularname | Beschriftung | Optionen (`value` → Text) |
|---|---|---|
| `attributes[0]` | `Höhe` | 1825 → `12mm`, 1826 → `17mm`, 1827 → `22mm` |
| `attributes[1]` | `Profilbreite` | 1828 → `27,5mm - Standard`, 1829 → `44mm - L = Large` |
| `attributes[2]` | `Format` | 1830 → `Querformat`, 1831 → `Hochformat` |
| `attributes[4]` | `Kratzkante` | 1837 → `ohne Kratzkante`, 1838 → `mit Kratzkante` **(+35,87 €)** |

`attributes[3]` fehlt in der Nummerierung; die zugehörigen Beschriftungen
(`200`, `220`, `305`, `430`, `485` — offenbar Längen) sind als Labels vorhanden,
das Auswahlfeld selbst aber nicht.

Weitere Attribute:

| Produkt | Formularname | Beschriftung | Optionen |
|---|---|---|---|
| 18 | `attributes[0]` | `Mattenhöhe` | 148 → `13/14mm`, 158 → `16/17mm`, 161 → `20mm`, 163 → `22mm`, 164 → `24mm`, 165 → `27mm`, 166 → `30mm` **(+10,56 €)** |
| 19 | `attributes[0]` | `Höhe` | 179 → `schwarz - Mattenhöhe: 17mm`, 195 → `grau - …`, 199 → `rot - …`, 201 → `blau - …` |
| 28 | `attributes[2]` | `Schrift-Design` | 1781 → `Herzlich Willkommen`, 1782 → `Bitte Abstand halten`, 1783 → *(leer)* |
| 28 | `attributes[3]` | `Format` | 1784 → `Querformat`, 1785 → `Hochformat` |

Bei Produkt 19 ist die Beschriftung `Höhe`, die Optionen mischen aber Farbe und
Höhe; bei Produkt 28 hat eine Option einen **leeren** Text.

---

## 16. Zuordnung zu matten.de

Die vollständige Zuordnungstabelle steht in `texte/zuordnung-matten-de.md` und
maschinenlesbar in `struktur.json` unter `zuordnungMattenDe`.

Genutzte Quellen (alle über den lokalen Brücken-Proxy, **Port 8788**, nicht 8787):
`/api/katalog`, `/shop/assets/js/catalog.js`, `/api/suche?alle=1`,
`/api/suche?q=…`, `/api/produkt?pfad=…`, `/api/katalog/diagnose`.

### 16.1 Der entscheidende Befund: getrennte Nummernkreise

**Ein Abgleich über die Artikelnummer ist nicht möglich.** Die beiden Systeme
führen zwei verschiedene Nummernkreise. Die matten.net-Kreise `4711xxx`
(Designmatten), `6027xxx` (OS-REHAB), `6920xxx` (Kokos), `6390xxx`
(Hinweismatten) und `652601` kommen auf matten.de **an keiner Stelle** vor —
weder als Artikelnummer noch im Volltext. Genau **eine** Nummer stimmt in der
Basis überein: `6300000N` ↔ `6300000`.

Deshalb steht bei **keinem einzigen** Produkt die Stufe `sicher`.

Ein zweites, abgesichertes Signal: die Suche des Altsystems löst *bekannte*
interne Nummern per HTTP-302 auf. Kontrollversuche mit erfundenen
Nachbarnummern (6920000, 6920009, 6027009, 9999999) ergaben jeweils 0 Treffer —
der Resolver ist also trennscharf. Positiv aufgelöst wurden `6920002` (Kokos-
Landingpage), `6300202` (Designmatten-Landingpage) und `6920003` (direkt auf den
Artikel „Kokosmatte gestaltet, Logobeflockung" — die belastbarste
Produktzuordnung im ganzen Abgleich).

### 16.2 Stand der Zuordnung

| | sicher | wahrscheinlich | unsicher | keine |
|---|---:|---:|---:|---:|
| **Produkte** (19) | 0 | **10** | **9** | 0 |
| **Kategorien** (27) | 0 | **15** | **10** | 2 |

Für Kategorien ist die Stufe `sicher` strukturell unerreichbar — es gibt keinen
gemeinsamen Schlüssel.

Bewusst **kein** Ziel bekommen haben pid 7 (`JetPrint Premium 1-farbig`) und
pid 9 (`JetPrint Matten, Design`) — hier wäre jede Zuordnung geraten.

**Zwei Doppelbelegungen bleiben offen:** pid 6 ↔ pid 7 und pid 22 ↔ pid 32
konkurrieren je um denselben matten.de-Artikel. Eine der beiden muss falsch
sein; entscheidbar wäre das nur mit Preis- oder Attributdaten.

**Zwei ausdrückliche Vorbehalte:**
- **pid 4** (`IRON-HORSE-Mietmatte`, `640001211`): Die Nummer entspricht mit
  `64000121` der *melierten* Matte, der Name sagt eindeutig *Mietmatte*. Der
  Zuordnung wurde der Name zugrunde gelegt — die Nummer widerspricht.
- **pid 34** (`Aluminium-Profilmatte, Typ Diplomat R`, `652601`): Die Nummer
  enthält die matten.de-Nummer `52601` („Diplomat"), die Suche liefert dafür
  aber 0 Treffer, und „Typ R" passt besser auf zwei andere Artikel. Drei
  Kandidaten, keiner belegt.

### 16.3 Die Lücke

matten.de hat **375 eindeutige Produktpfade**; davon sind **16 zugeordnet**.
Es fehlen also **359 matten.de-Artikel** auf matten.net. Davon sind 109
technische `-a`/`-ang`-Zwillinge — es fehlen mithin **rund 250 echte
eigenständige Artikel**.

Die Artikelzahl von matten.de ist dabei selbst uneindeutig: `/api/katalog/diagnose`
meldet 384, es gibt 375 eindeutige Pfade, und `catalog.js` führt 365. Für die
Rechnung wurde durchgehend 375 verwendet.

**Acht matten.de-Kategorien fehlen auf matten.net vollständig**, darunter die
größten:

| matten.de-Kategorie | Produkte |
|---|---:|
| Sicherheits-und Symbol-Matten | 56 |
| Aluminiumrahmen, Schmutzfangmatten, Messingrahmen, Edelstahlrahmen, Zubehör | 56 |
| Biergartenbank-Matten | 33 |
| Werbematten - Dekomatten | 9 |
| Bodenschutzmatten | 2 |
| Teppich-Reinigungsprodukte | 2 |
| Art-Designs Welcome-Holzdesigns | 0 |
| Schnäppchen | — |

**Umgekehrt** ist kein matten.net-Produkt auf matten.de unbekannt. Die
Asymmetrie liegt bei den Kategorien: **18 der 27 matten.net-Kategorien sind auf
matten.de gar keine Kategorie**, sondern ein einzelner Artikel oder eine
Produktlinie (jede OS-REHAB-Matte, `marschall`, `diplomat`, `scraper`, `turf`…).
15 der 27 sind ohnehin leer.

### 16.4 Einordnung

matten.net ist **kein Ersatz** für matten.de, sondern ein Gerüst mit etwa **5 %
des Sortiments**. Die Kategoriestruktur ist zudem **nicht** aus matten.de
übernommen, sondern neu geschnitten: matten.de gruppiert nach Verwendung
(„Sicherheits-und Symbol-Matten", „Matten für Haus und Heim",
„Biergartenbank-Matten"), matten.net nach Material und Produktlinie
(„IronHorse", „JetPrint-Design", „Cushion Coil"). Eine automatische Migration
ist über die Artikelnummer **nicht** möglich.

### 16.5 Für die Zuordnung nicht ermittelbar

- **Eine echte Nummernbrücke.** Dass das Altsystem eine interne
  Nummern-Synonymtabelle führt, ist durch die 302-Weiterleitungen belegt; die
  Tabelle selbst ist über die vorhandenen Endpunkte nicht auslesbar, sondern nur
  einzeln abfragbar.
- **Die Codes `MJPRNT` (pid 28) und `MJPLIT` (pid 32)** — matten.net-intern,
  auf matten.de gibt es dafür weder ein Feld noch einen Treffer.
- **Die interne `artikelId` von matten.de** (z. B. 459 für 6300000) ist zwar
  abrufbar, hat aber nachweislich nichts mit den matten.net-Nummern zu tun.

---

## 17. Gefundene Fehler

Diese Punkte sind beim Nachbau bewusst zu entscheiden: nachbauen oder beheben.

### 17.1 Der angezeigte Preis ist falsch

`pricePlusVatHtml` — der Wert, der auf jeder Produktseite in `#price` landet —
stimmt **nicht** mit `total` überein. Das Verhalten ist deterministisch
(dreimal dieselbe Anfrage ergibt denselben falschen Wert), aber unbrauchbar:

| Produkt 6 | Netto/Stück | `total` (korrekt) | angezeigt |
|---|---:|---:|---:|
| 100 × 100, 1 Stück | 127,13 | 151,29 | **61,29** |
| 40 × 100, 1 Stück | 50,85 | 60,51 | **100,80** |
| 60 × 100, 1 Stück | 61,02 | 72,62 | **70,10** |
| 200 × 700, 1 Stück | 1.423,88 | 1.694,42 | **−635,67** |
| 100 × 100, 26 Stück | 124,16 | 3.841,61 | **168.319,93** |
| 100 × 100, 101 Stück | 110,72 | 13.307,28 | **582.337,43** |

Der angezeigte Wert ist mal zu niedrig, mal zu hoch, wird bei großen Matten
**negativ** und bei größeren Mengen sechsstellig. Er ist nicht monoton in der
Fläche und springt an den Staffelgrenzen um mehr als das Hundertfache. Eine
Formel dahinter ließ sich nicht rekonstruieren.

**Für den Nachbau:** `total` verwenden (`price × quantity × 1,19`).
`pricePlusVatHtml` ist unbrauchbar.

### 17.2 Produkt 34 kostet mit `singleColor` nichts

`Aluminium-Profilmatte, Typ Diplomat R` liefert bei `singleColor=true` den Preis
**0,00 €** statt eines Rabatts. Da kein Produkt das Bedienelement rendert, ist
der Fehler derzeit nicht auslösbar — über einen manipulierten Aufruf aber sehr
wohl.

### 17.3 Vier Produkte kosten 0,00 €

Produkte 4, 12, 26 und 40 haben keinen Einkaufspreis. Produkt 4
(`IRON-HORSE-Mietmatte`) wird auf der Startseite als TOP-ANGEBOT beworben.

### 17.4 `simulation-price` gibt es nicht

Das JavaScript ruft `/de/ajax/simulation-price` auf, sobald `#price_simulation`
im DOM ist. Die Route antwortet mit **404**. Da kein Produkt dieses Element
rendert, fällt es nicht auf.

### 17.5 Hoch- und Querformat sind im Designer vertauscht

Die Option mit dem Wert `HORIZONTAL` zeigt den Text `Hochformat`
(`label.portrait`), die Option `VERTICAL` zeigt `Querformat`
(`label.horizontal`). Beides ist gegeneinander vertauscht.

### 17.6 Währungszeichen im Designer-Modal

Die Zeilen `Preis` und `Total` im Bestellmodal werden mit dem Währungszeichen
**`£`** (Britisches Pfund) formatiert, während die Preisanzeige über der
Zeichenfläche `€ ` verwendet.

### 17.7 Keine Serverprüfung der Maße

Negative Breiten liefern negative Preise, Maße weit über den Formulargrenzen
werden anstandslos berechnet (13.10).

### 17.8 Weitere Auffälligkeiten

- **Gästebuch** ist verlinkt, rendert aber nichts.
- **Produktkarten** enthalten `<a>` in `<a>` (ungültiges HTML) und Bilder ohne `alt`.
- **Überschriftenhierarchie**: Das einzige `<h1>` ist das Logo; Inhaltsseiten
  beginnen bei `<h2>`; die Produktübersicht hat gar keine Seitenüberschrift; die
  Registrierungsseite hat als einzige ein zweites `<h1>`.
- **`<title>` und Meta-Description** sind auf allen Seiten identisch
  (`Mattenfuchs` / `Matten.de e-commerce`).
- **Domainverwechslung**: Der Impressum-Linktext `info@matten.net` zeigt auf
  `mailto:info@matten.de`; `www.matten.net` verlinkt auf `matten.de`; die
  Datenschutzseiten nennen durchgehend „www.matten.de".
- **Englisch in der deutschen Fassung**: `Cart`, `Find us`, `Sort by`, `Latest`,
  `Name a-z`, `Make an offer`, `Continue reading`, `Best Price`,
  `International shipping`, `Featured Category (German)`, `Your cart is empty.`,
  `Specification`, `Close`, `Help`, `Line spacing`, `Letter spacing`,
  Blogdatum `February 1, 2019`.
- **AGB**: Abschnitt IX fehlt, römische Ziffern mit kleinem „l" (`Vl.`, `Vll.`),
  Überschrift I endet mitten im Satz, der AGB-PDF-Link läuft ins Leere,
  Tippfehler („Allgeneines", „velegt", „Versicherurig", „Fischertrasse").
- **Registrierung** ohne AGB-/Datenschutz-Kästchen, ohne
  Passwort-Wiederholung, ohne Captcha; Login ohne CSRF-Token.
- **Kategoriename** `Katzen Willk` wirkt abgeschnitten.
- **Karussell** Folie 5: „Fusßmatten"; Folien 6 und 9 nutzen dasselbe Bild;
  Folien 3 und 4 verlinken in die englische Fassung.

---

## 18. Was nicht erfasst werden konnte

| Punkt | Grund |
|---|---|
| **Checkout-Seite** `/de/order/checkout` | Leitet bei leerem Warenkorb auf `/de` um. Erreichbar nur nach `POST /de/order/add-to-cart`. Der Auftrag erlaubt ausschließlich lesende Zugriffe — es wurde kein Artikel in den Warenkorb gelegt. Bekannt ist nur die Struktur des leeren Warenkorb-Modals. |
| **Gefüllter Warenkorb** | Dito. Die Spaltenüberschriften und die Fußzeile des Modals sind erfasst, das Aussehen einer Artikelzeile nicht. |
| **Angemeldeter Bereich** | Kein Login durchgeführt. Ob es Konto-, Bestell- oder Adressseiten gibt, ist unbekannt; `/de/account` antwortet mit 404. |
| **Bestellbestätigung, Angebotsanfrage** (`INQUIRY_CART`) | Erfordert einen `POST`. |
| **Formel hinter `pricePlusVatHtml`** | Deterministisch, aber trotz systematischer Variation von Breite, Länge und Menge nicht rekonstruierbar (17.1). Für den Nachbau irrelevant, da der Wert ohnehin falsch ist. |
| **Produktbeschreibungen im Volltext** | Erfasst wurde die Beschreibung von Produkt 6 als Beispiel für den Aufbau des Reiters. Die übrigen 18 liegen als Roh-HTML vor, sind aber nicht ins Markdown übertragen. |
| **`/de/ajax/attribute-images/<id>`** | Nur als `data-attribute-image-url` referenziert, nicht abgerufen. |
| **Englische Fassung `/en`** | Struktur ist identisch; die englischen Texte wurden nicht erfasst. |
| **CSS** | `style.747cc104.css` wurde nicht ausgewertet. Klassennamen sind im Dokument benannt, die konkreten Farben, Abstände und Schriftgrößen nicht. Insbesondere steuert CSS über die Klassen `custom_size` / `custom_length` am Formular, welche Größenfelder sichtbar sind — die genauen Regeln sind nicht erfasst. |
| **Bilder** | Nur die URLs sind dokumentiert, die Dateien wurden nicht heruntergeladen. |
| **Staffelschwellen jenseits 100 m²** | Bis 104 m² geprüft. Ob es oberhalb weitere Stufen gibt, ist offen — bei Produkt 6 blieb der Preis bis 999 Stück (999 m²) konstant bei Stufe 4. |
