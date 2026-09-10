# Alle Produkte (Produktübersicht)
Quelle: https://www.matten.net/de/products  ·  erfasst am 2026-08-31

`<title>` der Seite: `Mattenfuchs` (generischer Standardtitel) · Meta-Description: `Matten.de e-commerce`

## Aufbau

Zweispaltiges Bootstrap-Layout in einem **breiten** Container (`big-container`, nicht `container` wie
auf allen anderen Seiten). Kein Kopfbild/Jumbotron.

1. `<div style="min-height: 500px;">`
2. `<div class="big-container padding-top">`
3. `<div class="row">`
   - **Linke Spalte `col-md-3` — Filterleiste**
     1. `<button id="filter-toggle" class="btn btn-lg btn-outline-primary btn-block mb-3 d-block d-md-none">Filter</button>`
        — nur mobil sichtbar (`d-block d-md-none`), klappt die Filterleiste auf
     2. `<form id="filter" class="filter d-none d-md-block" method="get">`
        — auf Mobilgeräten zunächst versteckt, ab `md` immer sichtbar; **GET**, kein `action`
        (sendet an dieselbe URL), kein CSRF-Token
        - 9 Kategorieblöcke, je bestehend aus
          `<span class="filter-category-parent" onclick="selectChildren(this)">Oberkategorie</span>`
          (klickbar, wählt alle Unterpunkte aus — reines `onclick`, kein Label/kein eigenes Eingabefeld),
          gefolgt von `<div>` mit den Unterkategorie-Checkboxen und abschließendem `<hr>`
        - `<label for="filter-sort">Sort by</label>` + Auswahlfeld
        - `<hr>`
        - `<button class="btn btn-sm btn-primary">` mit Icon `<i class="fas fa-filter">` und Beschriftung **Filter**
   - **Rechte Spalte `col-md-9` — Produktgitter + Paginierung**
     1. `<div class="row">` mit den Produktkarten
        - je Karte `<div class="col-6 col-lg-4 col-xl-3 mb-3">`
          → 2 Karten nebeneinander auf Mobil, 3 ab `lg`, 4 ab `xl`
        - Kartenmarkup ist mit HTML-Kommentaren `<!-- Product card -->` / `<!-- End product card -->` umschlossen
        - Aufbau einer Karte: `<a href="/de/products/<slug>" title="<Produktname>">` →
          `<div class="card product-card">` → `<img class="card-img-top img-fluid" width="256" height="170">`
          (Quelle `https://www.matten.net/media/cache/product_thumbnail/uploads/…`, **ohne `alt`-Attribut**) →
          `<div class="card-body">` → `<h5 class="card-title product-card-title">` mit einem **zweiten,
          verschachtelten** `<a>` auf denselben Link (Produktname als Text)
        - kein Preis, kein Kurztext, kein „In den Warenkorb“-Knopf auf der Karte
     2. `<nav><ul class="pagination">` — Paginierung
4. Danach das Newsletter-Widget (Seitenrahmen)

**Es gibt auf dieser Seite keine Seitenüberschrift.** Weder `<h1>` noch `<h2>` im Inhaltsbereich —
die Bezeichnung „Alle Produkte“ steht nur in der Navigation. Die einzigen Überschriften im
Inhaltsbereich sind die `<h5>` der Produktkarten. Es gibt außerdem **keine Trefferanzahl**
(„x Produkte gefunden“), **keine Brotkrumen-Navigation** und **keine Umschaltung Raster/Liste**.

## Inhalt

### Filter: Kategorien (Checkboxen)

- Feldname aller Checkboxen: `category[]`, Typ `checkbox`, `class="custom-control-input"`,
  `id="child_<ID>"`, `value="<ID>"`
- **Alle 26 Checkboxen sind im Auslieferungszustand `checked="checked"`** (Standard = alles anzeigen)
- Die Oberkategorien selbst sind **keine** Checkboxen, sondern nur klickbare `<span>`-Beschriftungen

| Oberkategorie | Unterkategorie (Label) | `value` / `id` |
|---|---|---|
| Fussmatten | JetPrint-einfarbig | 2 / `child_2` |
| Fussmatten | IronHorse | 14 / `child_14` |
| Fussmatten | IronHorse XL | 15 / `child_15` |
| Logomatten | Designmatten | 19 / `child_19` |
| Logomatten | Jet Print light | 20 / `child_20` |
| Logomatten | Katzen Willk | 21 / `child_21` |
| Logomatten | JetPrint-Design | 22 / `child_22` |
| OS-REHA-Physio-Matten | OS-REHAB-Physio-Matten | 32 / `child_32` |
| OS-REHA-Physio-Matten | OS-Y-Matte, Wide Balance | 36 / `child_36` |
| OS-REHA-Physio-Matten | OS-REHAB Basis-Matte | 37 / `child_37` |
| OS-REHA-Physio-Matten | OS-REHAB-Bahnmatte | 38 / `child_38` |
| OS-REHA-Physio-Matten | OS-REHAB-Stern-Matte | 39 / `child_39` |
| OS-REHA-Physio-Matten | OS-REHAB-Gitter-Matte | 40 / `child_40` |
| OS-REHA-Physio-Matten | OS-REHAB-5-Punkt-Matte | 41 / `child_41` |
| OS-REHA-Physio-Matten | OS-REHAB Quadrat-Matte | 42 / `child_42` |
| Kokosmatten | Kokos Farbig | 16 / `child_16` |
| Kokosmatten | Kokos naturfarbig | 17 / `child_17` |
| Kokosmatten | Kokos-Logomatte | 43 / `child_43` |
| Aluminium-Matten | MARSCHALL | 11 / `child_11` |
| Aluminium-Matten | Diplomat | 12 / `child_12` |
| Gummimatten | Cushion Coil | 24 / `child_24` |
| Gummimatten | Scraper | 25 / `child_25` |
| Gummimatten | Struktura | 26 / `child_26` |
| Outdoor-Matten | Turf | 23 / `child_23` |
| Mietmatten | IRON-HORSE-Mietmatten | 28 / `child_28` |
| Was ist neu | Waschbecken | 35 / `child_35` |

Reihenfolge der Oberkategorien in der Filterleiste:
Fussmatten · Logomatten · OS-REHA-Physio-Matten · Kokosmatten · Aluminium-Matten · Gummimatten ·
Outdoor-Matten · Mietmatten · Was ist neu

### Filter: Sortierung

```html
<label for="filter-sort">Sort by</label>
<select id="filter-sort" name="filter_sort" class="custom-select custom-select-sm">
    <option value="LATEST" selected>Latest</option>
    <option value="NAME_ASC" >Name a-z</option>
    <option value="NAME_DESC" >Name z-a</option>
</select>
```

| Beschriftung (wörtlich) | `value` | Standard |
|---|---|---|
| Latest | `LATEST` | ja (`selected`) |
| Name a-z | `NAME_ASC` | – |
| Name z-a | `NAME_DESC` | – |

Feldname: `filter_sort`. Label und alle drei Optionen sind **englisch** — in der deutschen Fassung
der Seite nicht übersetzt.

Es gibt **keine** weiteren Filter: kein Preisfilter, keine Farb-/Maßfilter, kein Suchfeld
innerhalb der Filterleiste (die Suche liegt im Seitenkopf), keine Auswahl „Produkte pro Seite“,
kein „Filter zurücksetzen“.

### Filter: Knöpfe

| Knopf | Markup | Sichtbarkeit |
|---|---|---|
| Filter (Aufklappen) | `<button id="filter-toggle" class="btn btn-lg btn-outline-primary btn-block mb-3 d-block d-md-none">` | nur < md |
| Filter (Absenden) | `<button class="btn btn-sm btn-primary">` mit `<i class="fas fa-filter"></i>` | immer |

### Paginierung

`<nav><ul class="pagination">` am Ende der rechten Spalte:

| Element | Beschriftung (wörtlich) | Zustand auf Seite 1 |
|---|---|---|
| Zurück | `«&nbsp;Vorherige` | `li.page-item.disabled`, als `<span class="page-link">` (kein Link) |
| Seite 1 | `1` | `li.page-item.active`, als `<span class="page-link">` |
| Seite 2 | `2` | `li.page-item` mit `<a class="page-link" href="/de/products?page=2">` |
| Weiter | `Nächste&nbsp;»` | `<a class="page-link" rel="next" href="/de/products?page=2">` |

- Seitenparameter: `?page=<n>`
- **2 Seiten**: Seite 1 zeigt **16** Produktkarten, Seite 2 zeigt **3** → insgesamt **19 Produkte**
- Seitengröße also 16 Produkte
- Keine „Erste/Letzte“-Knöpfe, keine Auslassungspunkte, keine Anzeige „Seite 1 von 2“

## Auffälligkeiten

- **Keine Seitenüberschrift** im Inhaltsbereich und kein `<h1>` — schlecht für SEO/Zugänglichkeit.
- **`<title>` und Meta-Description sind auf allen Shop-Seiten identisch** (`Mattenfuchs` /
  `Matten.de e-commerce`), also auch hier.
- **Englische Beschriftungen in der deutschen Fassung**: `Sort by`, `Latest`, `Name a-z`, `Name z-a`.
  Die Paginierung ist dagegen deutsch („Vorherige“/„Nächste“).
- **Produktbilder haben kein `alt`-Attribut**; die Bildmaße sind fest mit `width="256" height="170"`
  gesetzt, obwohl `img-fluid` sie responsiv skaliert.
- **Doppelt verschachtelte Links**: die Karte ist als `<a>` ausgezeichnet und enthält im `<h5>`
  nochmals ein `<a>` auf dasselbe Ziel — ungültiges HTML.
- Karten enthalten **weder Preis noch Kurzbeschreibung noch Warenkorb-Knopf**.
- Kategoriename „**Katzen Willk**“ wirkt wie ein abgeschnittener Platzhalter
  (vermutlich „Katzen Willkommen“).
- Die Oberkategorie „**Was ist neu**“ enthält als einzigen Eintrag „Waschbecken“ — passt nicht
  zum Mattensortiment.
- Die Oberkategorie heißt in der Filterleiste „OS-REHA-Physio-Matten“, die gleichnamige
  Unterkategorie dagegen „OS-REHAB-Physio-Matten“ (mit B) — uneinheitlich.
- Das Auswählen einer Oberkategorie läuft über ein Inline-`onclick="selectChildren(this)"` auf einem
  `<span>` — nicht per Tastatur bedienbar, keine `role`/`tabindex`.
- Mit 19 Produkten insgesamt ist der Katalog sehr klein; die Filterleiste bietet 26 Kategorien an,
  von denen die meisten leer sein dürften.
