# Auftrag Frontend: matten.net 1:1 nachbauen, angeschlossen an matten.de

**Projekt:** `/Users/lukas.sehorz/Library/CloudStorage/OneDrive-Persönlich/Desktop/Webseiten/Sale/Matten de/Frontend/bridge-demo/`
**Zielverzeichnis:** `public/net-neu/` (Assets liegen schon dort — siehe unten). Lokal erreichbar unter `http://localhost:8787/net-neu/` (Server läuft bereits; falls nicht: `node server.mjs` im Projektverzeichnis).
**Kontrakt (verbindlich):** `KONTRAKT-API.md` neben diesem Briefing — zuerst lesen.

## 1. Worum es geht

Der Kunde (Dieter Fuchsius, FUCHSIUS multi-media GmbH) will, dass der neue Shop **1:1 wie
https://matten.net/de** aussieht und aufgebaut ist — Seitenrahmen, Navigation, Kategorien, Produkte,
Produktseite, Warenkorb-Modal — und dass alles, was der Besucher dort tut, im **Backend des Altsystems
matten.de** landet (Warenkorb, Anfrage, Bestellung). matten.net selbst ist eine unfertige Entwicklungsseite
mit eigener, fehlerhafter Datenbank; sie ist **nur Vorlage** für Aussehen und Aufbau. Daten, Preise,
Warenkorb und Bestellung kommen ausschließlich über die Brücke (`/api/…`) von matten.de.

Der bisherige Stand `public/net/` (eigenes Design „Mattenfuchs") bleibt **unangetastet** als Referenz —
seine Skripte enthalten geprüfte Logik, die du **portierst** (nicht kopierst, nicht verlinkst):
`seite-produkt.js` (Abbildung Größe/Farbe/Wunschmaß auf die Felder des Altsystems, Preisformel-Anbindung,
Warenkorb/Angebot), `seite-kasse.js` (vierstufige Kasse gegen `/api/kasse/*`), `seite-warenkorb.js`,
`net-api.js` (Hilfsfunktionen), `seite-konto.js`, `seite-inhalt.js`.

**Alle Quellen zur Vorlage** liegen in `spec/`:

| Datei | Inhalt |
|---|---|
| `spec/MATTEN-NET-SPEC.md` | Vollständige Spezifikation von matten.net (1792 Zeilen). **Abschnitte 2, 3, 5, 6, 7, 8, 10, 11, 12, 15, 17 sind deine Bauvorlage.** Abschnitt 9 (Designer) baut ein anderer Agent später. |
| `spec/struktur.json` | Dieselben Daten maschinenlesbar: `kopfzeile`, `navigation`, `fusszeile`, `kategorien` (27), `produkte` (19, mit `fixgroessen`, `attribute`, `preisdaten`, `bilder`), `mattendesigner`, `zuordnungMattenDe` |
| `spec/screens/*.html` | Unveränderte Original-HTML-Seiten von matten.net (Startseite, Kategorie, zwei Produktseiten, Designer). **Markup daraus 1:1 übernehmen** — Klassen, Struktur, Reihenfolge. |
| `spec/texte/*.md` | Wortlaut aller Infoseiten, Login/Registrierung, Blog, Gästebuch, Kategoriebeschreibungen, Produktbeschreibungen, Produktübersicht |
| `../UEBERGABE.md` | Projektstand, Regeln, Kundenwünsche (§7 lesen!) |
| `ANBINDUNG.md`, `KATALOG.md` | Wie die Brücke Katalog und Formulare des Altsystems liest |

Live-Vergleich ist erlaubt (nur GET): `curl -sL https://matten.net/de/...`. Headless Chrome ist installiert:
`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-sandbox --screenshot=<datei.png> --window-size=1280,2000 <url>`
bzw. `--dump-dom`. Nutze das für Selbstkontrolle: Screenshot von matten.net neben Screenshot von deiner Seite.

## 2. Was schon da ist: `public/net-neu/assets/`

| Pfad | Inhalt |
|---|---|
| `css/matten-net.css` | **Das Original-Stylesheet von matten.net** (Bootstrap 4.3.1 + alle eigenen Regeln: `.main-navbar`, `.category-dropdown-menu`, `.product-card`, `.btn-orange`, `.mat-editor`, `.custom_size`/`.custom_length`…). Google-Fonts-Import entfernt. **Nicht umschreiben** — eigene Ergänzungen in `css/net-neu.css`. |
| `css/animate.css` | animate.css 3.7.2 (Original `837.96782462.css`) |
| `fonts/nunito.css` + `fonts/nunito/*.woff2` | Nunito 400/500/700 lokal |
| `fontawesome/css/all.css` + `fontawesome/webfonts/*.woff2` | Font Awesome 5.0.10 lokal (dieselbe Version wie matten.net) |
| `js/vendor/jquery.min.js`, `bootstrap.bundle.min.js` (4.6.2), `fabric.min.js` | lokal, keine CDN |
| `img/logo_german.png`, `img/flags/`, `img/cards.png`, `img/mat-editor-background.jpg`, `img/sonstige/favicon-*.png` | Kopf/Fuß |
| `img/slides/` (10) | Karussell-Folien (Spec §5, Tabelle) |
| `img/kategorie-kacheln/` (24) | Kacheln des Bildmenüs (`navigation.eintraege[].kategorien[].bild` in struktur.json) |
| `img/uploads/` (27) | Titelbilder der Kategorieseiten (`kategorien[].titelbild`), Featured-Kachel, die zwei Vorteils-Icons |
| `img/produkte/` (18) | Großbilder der Produkte (`produkte[].bilder`) |
| `img/produkt-kacheln/` (14) | Kartenbilder (`product_thumbnail`); für Produkte ohne eigene Kachel das Großbild verkleinert per CSS nutzen |
| `img/manifest.json` | Original-URL-Pfad → lokaler Pfad |

Alle Einbindungen relativ (`assets/...`), damit die Seiten später unter `/net/` **und** auf Netlify laufen.
**Keine einzige Ressource von einem fremden Host** (Prüfung: `grep -rn "http" public/net-neu --include=*.html --include=*.css --include=*.js` darf nur `href`-Links zu Social Media/Impressum und den SVG-Namensraum liefern).

## 3. Seiten (Dateinamen verbindlich, Adressen als Query-Parameter)

| Datei | matten.net | Spec |
|---|---|---|
| `index.html` | `/de` | §5 |
| `kategorie.html?slug=<netSlug>` | `/de/product-categories/<slug>` | §6 |
| `products.html[?page=n&keyword=…]` | `/de/products` | §7, `texte/products-uebersicht.md` |
| `produkt.html?slug=<netSlug>` | `/de/products/<slug>` | §8 |
| `checkout.html` | `/de/order/checkout` | §10 + Abschnitt 7 unten |
| `login.html`, `register.html` | `/de/login`, `/de/account/register` | §11, `texte/login.md`, `texte/register.md` |
| `blog.html`, `guest-book.html` | `/de/blog`, `/de/guest-book` | §12 |
| `pages.html?s=agb\|impressum\|data-protection\|datenschutzerklarung-dsgvo` | `/de/pages/<slug>` | §12, `texte/*.md` |
| `mattendesigner.html`, `designer-checkout.html` | `/de/custom-mat/create`, `/de/custom-mat/checkout` | **nicht du** — nur verlinken |

Jede Seite: `<!doctype html><html lang="de">`, `<title>Mattenfuchs</title>` (Spec §1), `meta viewport`,
Favicon, dann in dieser Reihenfolge `matten-net.css`, `animate.css`, `nunito.css`, Font Awesome, `net-neu.css`.
Skripte am Ende: jQuery, Bootstrap-Bundle, `js/daten.js`, `js/shell.js`, seitenspezifisches Skript.
`<body id="product_view">` nur auf der Produktseite (Spec §1).

## 4. Gemeinsamer Seitenrahmen (Spec §2, §3 — `spec/screens/startseite.html` als Markup-Vorlage)

Wird von `js/shell.js` aus `js/daten.js` in Platzhalter gebaut (Kopf, Warenkorb-Modal, Navigation, Fuß),
damit 12 Seiten dieselbe Quelle haben. Reihenfolge und Klassen exakt wie Spec §2:

1. **Warnbanner „Entwicklungswebsite"** — **weglassen** (Symfony-Entwicklungshinweis, kein Design). Einzige bewusste Auslassung im Rahmen.
2. Kopfzeile: Logo `<h1 class="logo">` → `index.html`; rechts oben Sprachwahl (`Deutsch` mit Flagge; `English` als Eintrag vorhanden, aber ohne englische Fassung → zeigt auf `#` mit `title="in Vorbereitung"`), `Gästebuch`, `Login`, `Registrieren`; darunter Knopfgruppe `Cart` (öffnet `#cart-modal`) + `btn-orange` `Auschecken` → `checkout.html`; Suchformular `action="products.html"`, `name="keyword"`, Platzhalter `Produkt suchen`.
3. Warenkorb-Modal `#cart-modal` **1:1** (Spalten, `tfoot-light`, `Your cart is empty.`, `Subtotal/Versandkosten/Nettosumme/VAT 19.00%/Total`, Knopf `Weiter einkaufen`). Inhalt live aus `GET /api/cart` beim Öffnen; `div.cart-loading` während des Ladens. Zeile je Position: Bild (`item.bild`), Beschreibung (`name` oder bei `null` die `attribut`-Zeile), Preis, Menge (Zahlenfeld → `POST /api/cart/menge`), Total, Entfernen (Menge 0). Summen sind **Zeichenketten des Altsystems**; bei Anfragepositionen steht `auf Anfrage`. Der Warenkorb-Knopf im Kopf zeigt `Cart (n)`.
4. Navigation: Desktop `nav.main-navbar` mit `category-dropdown-trigger`/`category-dropdown-menu` (Bildmenü, `col-2`-Kacheln) und mobile Navbar — **exakt die 12 Einträge in der Reihenfolge aus Spec §3.1** (Mattendesigner, Fussmatten, Logomatten, OS-REHA-Physio-Matten, Kokosmatten, Aluminium-Matten, Gummimatten, Outdoor-Matten, Mietmatten, Was ist neu, Alle Produkte, Blog) mit den 26 Unterkategorien aus `struktur.json.navigation`. Mobil: Unterschiede aus §3.2 übernehmen (Home zuerst, Designer zwischen Fussmatten und Logomatten, Text-Dropdowns). Die zweite, funktionslose Sprachauswahl am Ende der mobilen Leiste weglassen.
5. Inhaltsbereich `<div style="min-height: 500px;">`.
6. Newsletter-Widget 1:1 (ohne Funktion, wie im Original — aber mit `method="post"`/`onsubmit` abgefangen und Hinweis „in Vorbereitung").
7. Fußzeile drei Spalten 1:1 (`Find us`, `Information`, `Kontakt`), `© 2026 Mattenfuchs`. Social-Links dürfen als externe `href` bleiben (werden nicht geladen, nur geklickt).

Cookie-Hinweis (`cookieconsent`, Farben Spec §1): schlicht nachbauen (ein Balken unten, Knopf, Merken in `localStorage`, try/catch).

## 5. Daten: `js/daten.js` — erzeugt von `bau-net-daten.mjs`

Schreibe `bridge-demo/bau-net-daten.mjs` (Node, nur Builtins), das aus `spec/struktur.json`, `spec/texte/*.md`
und `public/net-neu/assets/img/manifest.json` die Datei `public/net-neu/assets/js/daten.js` erzeugt
(`window.NET = { kopfzeile, navigation, fusszeile, kategorien, produkte, gruppen, zuordnung }`). Bildpfade werden
über das Manifest auf lokale Pfade umgeschrieben; fehlt ein Bild lokal, bleibt das Feld `null` (nichts erfinden).
Beschreibungen (`texte/kategoriebeschreibungen.md`, `texte/produktbeschreibungen.md`) als HTML-Strings übernehmen.
Die Datei ist Generat — Kopfkommentar „ERZEUGT von bau-net-daten.mjs, nicht von Hand ändern".

**Zuordnung matten.net-Produkt → matten.de-Artikel** (in `bau-net-daten.mjs` als feste Tabelle mit diesen Kommentaren;
Grundlage `spec/struktur.json.zuordnungMattenDe` + Katalogabgleich vom 10.09.2026):

| netSlug | `dePfad` (Kaufartikel) | `deZwilling` (Anfrageartikel „-a", freie Maße) | Anmerkung |
|---|---|---|---|
| iron-horse-1-farbige-und-melierte-schmutzfangmatten | /fussmatten/standard-schmutzfangmatten/64000121 | – | unsicher |
| iron-horse-matte | /miet-mattenservice/mietmatten | – | Mietservice |
| jetprint-premium | /fussmatten/standard-schmutzfangmatten/6300000 | /fussmatten/standard-schmutzfangmatten/6300000-a | |
| jetprint-premium-1-farbig | /fussmatten/standard-schmutzfangmatten/6300000 | /fussmatten/standard-schmutzfangmatten/6300000-a | entschieden: identische Preisdaten (52,67 / 1,931), de-Name „einfarbig" |
| mjplit-jetprint-light-1-farbig | /fussmatten/fussmatten/jetprint_matten-light-einfarbig | /fussmatten/fussmatten/jetprint_matten-light-einfarbig-a | |
| jetprint-matten-design | /logomatten/6300201-logomatte | /logomatten/6300201-logomatte-a | entschieden: EK 54,63 €/m² identisch (Spec §14.2 H) |
| designmatten-jetprint | /logomatten/6300201-logomatte | /logomatten/6300201-logomatte-a | |
| os-quadrat-rehab-trainingsmatte | /logomatten/os-physio-rehab-matten/6320301-quadrat | – | |
| kokosmatten-naturfarbig | /kokosmatten/kokosmatte-natur-kauf | – | |
| kokos-farbig | /kokosmatten/kokosmatte-farbig-k | – | |
| jetprint-light-logo | /logomatten/jetprint_light-matten | /logomatten/jetprint_light-matten-a | |
| iron-horse-matte-2 | /fussmatten/standard-schmutzfangmatten/64000122 | – | |
| kokos-gestaltet | /kokosmatten/beflockte_kokosmatte-a | (ist selbst Anfrageartikel) | nur Anfrage |
| hinweismatten | /logomatten/6300201-logomatte | /logomatten/6300201-logomatte-a | entschieden: `jetprint-designs-hinweise` hat kein Kaufformular; Hinweismatten sind JetPrint-Matten mit Textdruck — Schrift-Design und Format gehen in den Kommentar |
| designmatten-jetprint-light | /logomatten/jetprint_light-matten | /logomatten/jetprint_light-matten-a | |
| designmatten-jetprint-velour | /logomatten/6400201-velourmatte | /logomatten/6400201-velourmatte-a | |
| aluminium-profilmatte-typ-diplomat-r | /aluminium_profilmatten/52601 | /aluminium_profilmatten/52601-a | |
| os-stern-rehab-trainingsmatte | /logomatten/os-physio-rehab-matten/6320304 | – | |
| os-5-punkt-rehab-trainingsmatte-c | /logomatten/os-physio-rehab-matten/6320307-5punkt | – | |

Prüfe beim Bauen jeden Pfad einmal mit `GET /api/produkt?pfad=…` (muss `kaufbar: true` liefern; sonst im Bericht nennen).

## 6. Die Produktseite — der Kern (Spec §8, `spec/screens/produkt-beispiel-*.html`)

Markup 1:1: Brotkrumen, links `#variety-images` (Großbild 512×340 + Miniaturen), rechts `.single-product-info`
mit `.product-loading`, `<h2>` Name, leeres `div.stars`, Formular `#add_to_cart_form`, Farbauswahl, `section.order-form`
(Größe · Breite/Länge · Menge/Preis · Knöpfe), Reiter `Beschreibung`/`Bewertungen`.

**Bedienlogik** (Spec §8.2, Klassen `custom_size`/`custom_length` am Formular steuern die Sichtbarkeit — die Regeln
stehen in `matten-net.css`):
* `select#input_fixed_size` mit den `fixgroessen` des Produkts (`<Länge> cm x <Breite> cm`, `data-width`/`data-length`) und am Ende `Custom` (`FIXED+CUSTOM_SIZE`), wenn `customOption` gesetzt ist. Bei Produkten ohne Fixgrößen (`fixgroessen: []`, z. B. IRON-HORSE, Kokos, Diplomat): `CUSTOM_ONLY` — Breite/Länge direkt eingeben.
* `#input_width` (min 40, max 200) und `#input_length` (min 40, max 700) mit den Tooltips aus der Spec. **Kundenwunsch (UEBERGABE §7.2):** bei unmöglichen Maßen sagen, *in welche Richtung* es gehen muss („Breite höchstens 200 cm — bitte kleiner wählen" / „mindestens 40 cm"), nicht nur „ungültig". Grenzen: Formular 40–200 / 40–700; dazu die Grenzen des Altsystem-Artikels aus `masse[].min/max` (die strengere gilt).
* `#input_quantity` (min 1), Entprellung 70 ms.
* **Preis:** `div#price` = Bruttobetrag für die gewählte Menge im Format `€ 1.234,56`, Kleintext `inkl. MWSt.`, `span#shipping_cost` = `Plus 11,90€ Versandkosten` (Versandbetrag des matten.de-Kaufartikels aus `/api/produkt` → `preis.versand`; Zwilling hat keinen → den des Kaufartikels nehmen). **Kundenwunsch (UEBERGABE §7.3):** direkt darunter eine Zeile `Endpreis inkl. MwSt. und Versand: € …`.
* **Sonderform/Sonderfarbe (Kundenwunsch UEBERGABE §7.6, nicht auf matten.net):** drei unaufdringliche Ankreuzzeilen unterhalb der Größe: `Sonderform ohne Rand`, `Sonderform mit Rand`, `Sonderfarbe` — im Bootstrap-Stil der Seite (`custom-control custom-checkbox`, klein).
* **Farbauswahl 1:1** (Spec §8.1 Punkt 3): `div.color-input-container`, `<small id="color-attribute-N">` mit der Auswahl, Farbfelder `span.color-input` mit Radio + `<label style="background-color:#…" title="Name">601</label>`, Kontrollkästchen `Weitere Designfarben auswählen`, Knopf `Mehr Farben Anzeigen`/`Weniger Farben`. **Farbliste** = `attribute[]` mit `typ: 'farbwahl'` des matten.de-Artikels (z. B. `attribute[Grundfarbe]`, 45 Werte wie `601-zitronengelb`); Hexwerte aus `spec/struktur.json.mattendesigner.materialien[0].colors` (Feld `code` ↔ Nummer vor dem Bindestrich, `RGBColor`); ohne Treffer neutrales Grau + Name im `title`. Zeige zuerst 12 Farben, Rest hinter `Mehr Farben Anzeigen` (das Original klappt genauso).
* **Produktbild wechselt mit der Grundfarbe** (Kundenwunsch §7.5, im alten `seite-produkt.js` bereits gelöst — portieren): passendes Bild aus `bilder[]` des matten.de-Artikels über `/api/img/…`, sonst das lokale Produktbild.
* Weitere Auswahlattribute des matten.net-Produkts (`produkte[].attribute`, z. B. Diplomat: Höhe/Profilbreite/Format/Kratzkante) als `select.attribute-select` 1:1 anzeigen. Sie gehen in den **Kommentar** (das Altsystem hat dafür meist kein Feld) — mit Ausnahme von Feldern, die es beim matten.de-Artikel wörtlich gibt (dann als `werte`).

**Preisberechnung — ausschließlich `berechne()` aus `/preisformel.js`** (ES-Modul, per `<script type="module">`
einbinden wie in `public/net/assets/js/seite-produkt.js`). Stammdaten je Produkt aus `produkte[].preisdaten`:

```js
{ colortype: 1,
  salesfactorMehrfarbig: preisdaten.salesFactor,   // matten.net-Salesfactor je Produkt (1,931 / 1,87 / 1,8 / 1,6 / 1,375 / 1,317)
  ekListenpreisProQm:    preisdaten.einkaufProQm,  // EK/m² je Produkt
  standardbreiten:       preisdaten.standardbreiten // je Produkt (Spec §13.4) — steuert den Sondermaß-Zuschlag ×1,25
  // Mengenstaffel, Sonderform ×1,3/×1,5, Sonderfarbe +68 € einmalig, TZ: Excel-Vorgabe aus STAMMDATEN_VORGABE
}
```
Eingaben: `{ breite, laenge, menge, sonderformOhneRand, sonderformMitRand, sonderfarbe }`. Ergebnis netto →
`mitSteuerUndVersand()` (die **einzige** weitere Rechenstelle, deutlich kommentiert; 19 % bzw. `preis.ustSatz` des Artikels,
Versand einmal je Position wie im Altsystem). Attributaufschläge aus Spec §13.8 (Diplomat `1838` mit Kratzkante +35,87 €/Stück,
Kokos natur `166` 30mm +10,56 €/Stück) in derselben Funktion addieren, mit Quellenangabe.
Produkte mit `einkaufProQm: 0` (pid 4, 12, 26, 40): keine Formel — Live-Preis des matten.de-Artikels über `/api/price`
anzeigen, falls `modus: 'kauf'`, sonst `Preis auf Anfrage`.
Fehlerfälle von `berechne()` (`ok:false`, `grund`) im Preisfeld anzeigen, Knöpfe bleiben nutzbar für „Make an offer".
Prüfwerte (JetPrint-Premium, pid 6, EK 52,67, SF 1,931): 50×200 cm, 1 Stück → 101,71 € netto je Stück; 90×120 cm → ×1,25.

**Knöpfe 1:1:** `#add-to-cart` `In den Warenkorb` (`value="CART"`) und `#add-to-inquiry` `Make an offer` (`value="INQUIRY_CART"`).
Was sie tun (Logik aus `seite-produkt.js` §7 `uebernehmen()` portieren; dort ist die Feldabbildung geprüft):

1. `Make an offer` → **immer Anfrage**: `deZwilling` (falls vorhanden) mit `spezialoption[<id>][spezial][x]`/`[y]` = Breite/Länge, Farbe als `attribute[Grundfarbe]`; kein Zwilling → `dePfad` mit Kommentar-Präfix `ANGEBOT ANGEFORDERT (keine Bestellung)`.
2. `In den Warenkorb` mit **Standardgröße ohne Zuschläge** → `dePfad` mit `attribute[Standardgröße]` = die Option, deren Zahlen zum gewählten Maß passen (`40cm x 60cm` ↔ 40×60); passt keine → wie 3.
3. `In den Warenkorb` mit **Wunschmaß, Sonderform oder Sonderfarbe** → das Altsystem hat dafür keinen Kaufartikel: `deZwilling` mit x/y (Anfrage), sonst `dePfad` mit `spezialoption`-Feldern, falls der Artikel welche hat (`masse[]`; `x` kann ein Auswahlfeld der Standardbreiten sein), sonst `dePfad` + nächste Standardgröße + Kommentar. Der Besucher erfährt es **vor** dem Klick in einer Zeile unter dem Preis: „Wunschmaße übernehmen wir als Anfrage — den berechneten Preis bestätigen wir im Angebot."
4. **Kommentar immer vollständig**: Produktname (matten.net), Maß, Menge, Farbe(n), Attribute, Sonderform/Sonderfarbe, Kalkulation (`netto je Stück · netto gesamt · brutto inkl. Versand`), Quelle `Preisformel Excel (preisformel.js)`. Das ist der Kanal, über den die Kalkulation das Backend erreicht — das Altsystem rechnet freie Maße selbst mit seinem m²-Preis ohne Zuschläge (belegt), deshalb steht unser Betrag im Kommentar.
5. Nach Erfolg: Warenkorb-Modal öffnen (Bootstrap), Zähler aktualisieren; `abgelehnt[]` aus der Antwort sichtbar machen. Während des Sendens den Knopf mit `fa-spinner` sperren (Spec §10, seitenweiter Effekt).

Reiter `Beschreibung` = Produktbeschreibung aus `texte/produktbeschreibungen.md`; `Bewertungen` = leer wie im Original.

## 7. Kasse `checkout.html` (auf matten.net nicht erfassbar — Spec §18)

Gestalte sie im Bootstrap-Stil der Seite, angelehnt an das Kundendaten-Formular des Designers (Spec §9.7:
Anrede, Vorname, Nachname, Firmenname, Straße, Stadt, PLZ, Land, Telefon, eMail, Mobil, Fax, AGB-Kästchen).
Logik aus `public/net/assets/js/seite-kasse.js` portieren (vier Schritte, Fehlermeldungen des Altsystems am Feld,
`disabled` am Absende-Knopf bis zum Kästchen, aufklappbarer Block „Was genau abgeschickt wird" mit `finalRequest`).

* Oben die Warenkorbtabelle (wie im Modal). Leerer Korb → Hinweis + Link zur Startseite (Original: 302 auf `/de`).
* Schritt Adresse: Felder aus `GET /api/kasse/formular` (`adressfelder`, `laender`, Vorbelegung `adresse`). **Vorbelegung für Tests beibehalten** (wie im alten Stand): Vorname `TEST`, Nachname `Sehorz (Bitte ignorieren)`, Firma `TESTBESTELLUNG – kein echter Auftrag`; E-Mail leer (eigene Adresse eintragen), mit einem Hinweis, warum.
* Schritt Versand & Zahlung: nur wenn `optionen.versandart.optionen`/`zahlungsart.optionen` nicht leer (Kauf). Beim Anfragenkorb: Schritt überspringen mit dem Satz „Für eine Anfrage verlangt das Altsystem keine Versand- und Zahlungsart." Zahlungsarten nur aus `optionen` (Allowlist), `abgelehnt` nur benennen.
* Schritt Prüfen: `GET /api/kasse/vorschau` — `uebersicht` anzeigen; Knopftext = `uebersicht.absendeknopfText` (`Anfrage abschicken` bzw. `Bestellung abschicken`). Kästchen: „Mir ist bewusst, dass dies eine echte Anfrage/Bestellung im Live-System matten.de erzeugt." Bei `art === 'anfrage'` in Grün (`btn-success`, wie das Altsystem), sonst `btn-primary`.
* Absenden: `POST /api/kasse/bestellen { bestaetigung: 'JA-BESTELLEN' }`. **Du löst diesen Aufruf beim Testen nie aus** — nur der Auftraggeber. Ergebnis-Schritt: `ok`, `art`, `bestellnummer` (kann `null` sein — dann sagen, dass die Dankeseite keine Nummer nennt), Rohantwort, Link `/api/kasse/raw`.
* Die Brücke wird **parallel** um `art`/`absendeknopfText` erweitert (Kontrakt). Bis dahin liefert `GET /api/kasse/vorschau` für Anfragenkörbe `absendeknopf:false` — baue gegen den Kontrakt und behandle fehlende Felder defensiv.

## 8. Kategorieseite, Produktliste, Startseite

* **Kategorie** (§6, `spec/screens/kategorie-beispiel-ironhorse.html`): `jumbotron.category-page-image-cover` mit `titelbild`, `h1.display-5`, Beschreibung (leer bleibt leer), Filterspalte (`Sort by` `Latest`/`Name a-z`/`Name z-a`, Knopf `Filter`, mobil `#filter-toggle`), Karten `col-6 col-lg-4 col-xl-3 mb-3`. **Leere Kategorien bleiben leer wie im Original** (14 von 27). Karte 1:1 (Spec §5, Block „Aufbau einer Produktkarte") — aber **ohne** den Link-im-Link (ungültiges HTML): äußeres `<a>` behalten, inneres `<a>` durch `<span>` ersetzen; `alt` setzen. Kein Preis auf Karten (Original).
* **Produktliste** (§7, `texte/products-uebersicht.md`): Filter mit den 26 Kategorie-Kästchen unter 9 Gruppen (auf-/zuklappbar, per `<button>` statt Inline-`onclick`), Sortierung, 16 je Seite, `?page=n`, Suchbegriff `?keyword=` filtert nach Name.
* **Startseite** (§5, `spec/screens/startseite.html`, `texte/startseite.md`): Datenschutzhinweis, Karussell mit 11 Folien (`data-ride="carousel"`, Bilder aus `img/slides/`, Folien 6 und 9 teilen sich ein Bild — so ist das Original; Tippfehler „Fusßmatten" korrigieren), `Featured Category (German)`-Kachel → `kategorie.html?slug=was-ist-neu`, `TOP-ANGEBOTE` mit den 5 Karten, `Der Mattenfuchs`-Text, Vorteilsleiste. Folien 3/4 verlinken auf die deutschen Kategorien `diplomat` bzw. `jetprint-einfarbig` (statt der englischen Fassung).

## 9. Login, Registrierung, Blog, Gästebuch, Infoseiten

1:1 aus `texte/`. Login → `POST /api/konto/login`; Registrierung → `POST /api/konto/register` (schau in
`public/net/assets/js/seite-konto.js`, was der Endpunkt tut, und zeige die Antwort des Altsystems ehrlich an).
Gästebuch: Original rendert nichts — Seite mit Kopf/Fuß und einem Satz, dass hier noch kein Inhalt ist.
Rechtstexte: 1:1 übernehmen; oben ein schmaler `alert-warning`: „Dieser Text ist eine Kopie von matten.net und
anwaltlich nicht geprüft." (Abmahnrisiko, UEBERGABE §10.3 — bewusste Abweichung).

## 10. Qualität — bevor du abgibst

* `node --check` auf jede JS-Datei; `node bau-net-daten.mjs` läuft ohne Fehler und ist idempotent.
* Alle Seiten HTTP 200 (curl), keine Konsolenfehler (Headless Chrome `--dump-dom` + `--enable-logging=stderr`), kein waagerechter Überlauf bei 375/768/1280 px.
* Screenshot-Vergleich matten.net ↔ deine Seite für Startseite, eine Kategorie (`ironhorse`), eine Produktseite (`jetprint-premium`): Aufbau, Abstände, Farben müssen übereinstimmen. Abweichungen, die du nicht beheben kannst, im Bericht nennen.
* Funktionsprobe gegen die laufende Brücke: Produktseite `jetprint-premium` → Fixgröße 40×60, Menge 1 → `In den Warenkorb` → `GET /api/cart` zeigt die Position mit `Standardgröße: 40cm x 60cm`; danach Wunschmaß 90×120 → `Make an offer` → Position `auf Anfrage` mit `Mattengröße: 90cm × 120cm`; Kommentar enthält die Kalkulation. Danach `POST /api/cart/clear`. **Kein `POST /api/kasse/bestellen`.**
* `grep -rn "http" public/net-neu` liefert keine geladene Fremdressource.
* Keine Änderung außerhalb `public/net-neu/` und `bau-net-daten.mjs`. `preisformel.js` unverändert. Nicht committen.

## 11. Abgabe

`public/net-neu/LIESMICH.md`: Seitenliste, Aufbau, **jede bewusste Abweichung vom 1:1** mit Grund (Liste oben:
Warnbanner, zweite Sprachauswahl, Link-im-Link, Tippfehler, englische Folienlinks, Sonderform/-farbe-Kästchen,
Endpreiszeile, Rechtstext-Hinweis — plus alles, was dazukommt), offene Punkte. Danach ein kurzer Bericht an mich:
was gebaut, was geprüft (mit Zahlen), was nicht geht und warum. Nichts beschönigen — ich prüfe nach.

Stil im Code: deutsch, Kommentare erklären das Warum, Struktur wie in `public/net/assets/js/*.js` (IIFE, `'use strict'`,
keine Frameworks außer den vorhandenen Vendor-Dateien).
