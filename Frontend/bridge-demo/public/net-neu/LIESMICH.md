# net-neu — matten.net 1:1 nachgebaut, angeschlossen an matten.de

Stand 10.09.2026. Lokal: `http://localhost:8787/net-neu/` (Brücke `node server.mjs` im Projektverzeichnis).
Vorlage: `spec/MATTEN-NET-SPEC.md`, `spec/struktur.json`, `spec/screens/*.html`, `spec/texte/*.md`.
Daten, Preise, Warenkorb, Anfrage und Bestellung laufen ausschließlich über die Brücke (`/api/…`) zum Altsystem matten.de.

## 1. Seiten

| Datei | entspricht auf matten.net | Skript |
|---|---|---|
| `index.html` | `/de` — Datenschutzhinweis, Karussell (11 Folien), Featured Category, TOP-ANGEBOTE, Der Mattenfuchs, Vorteilsleiste | `seite-start.js` |
| `kategorie.html?slug=<netSlug>` | `/de/product-categories/<slug>` — 27 Kategorien, Titelbild, Beschreibung, `Sort by`, Karten (leere Kategorien bleiben leer) | `seite-kategorie.js` |
| `products.html[?page=n&keyword=…&category[]=…&filter_sort=…]` | `/de/products` — 26 Kategorie-Kästchen in 9 Gruppen, Sortierung, 16 je Seite, Paginierung, Suche aus dem Kopf | `seite-produkte.js` |
| `produkt.html?slug=<netSlug>` | `/de/products/<slug>` — 19 Produkte, Farbfelder, Größe/Breite/Länge/Menge, Preis, `In den Warenkorb`, `Make an offer`, Reiter | `seite-produkt.js` (ES-Modul, importiert `berechne()`) |
| `checkout.html` | `/de/order/checkout` (auf matten.net nicht erfassbar) — Warenkorbtabelle, 4 Schritte gegen `/api/kasse/*` | `seite-checkout.js` |
| `login.html`, `register.html` | `/de/login`, `/de/account/register` — Felder 1:1 aus `texte/login.md`, `texte/register.md` | `seite-konto.js` |
| `blog.html[#slug]` | `/de/blog`, `/de/blog/<slug>` — 2 Beiträge | `seite-inhalt.js` |
| `guest-book.html` | `/de/guest-book` — Original rendert nichts | `seite-inhalt.js` |
| `pages.html?s=agb\|impressum\|data-protection\|datenschutzerklarung-dsgvo` | `/de/pages/<slug>` — Wortlaut aus `texte/*.md` | `seite-inhalt.js` |
| `mattendesigner.html`, `designer-checkout.html` | `/de/custom-mat/create`, `/de/custom-mat/checkout` — **nicht Teil dieser Abgabe**, nur verlinkt (Navigation) | — |

Jede Seite: `<!doctype html><html lang="de">`, `<title>Mattenfuchs</title>`, Favicon, dann `matten-net.css` (Original-Stylesheet, unverändert), `animate.css`, `nunito.css`, Font Awesome 5.0.10, `net-neu.css` (eigene Ergänzungen). Skripte am Ende: jQuery, Bootstrap-Bundle 4.6.2, `daten.js`, `shell.js`, Seitenskript. `<body id="product_view">` nur auf der Produktseite. Alle Einbindungen relativ (`assets/…`), keine einzige Ressource von einem fremden Host; Bilder des Altsystems nur über `/api/img/`.

## 2. Aufbau

```
public/net-neu/
  *.html                      Seiten (Inhaltsbereich; Rahmen kommt aus shell.js)
  LIESMICH.md                 diese Datei
  assets/css/matten-net.css   Original-Stylesheet matten.net (nicht anfassen)
  assets/css/net-neu.css      eigene Ergänzungen (Cookie-Balken, Korbzeilen, Kasse, Kleinigkeiten)
  assets/js/daten.js          ERZEUGT von ../../bau-net-daten.mjs — window.NET (Kopf, Navigation, Fuß,
                              27 Kategorien, 19 Produkte mit Preisstammdaten/Fixgrößen/Attributen/Bildern,
                              9 Filtergruppen, Zuordnung matten.net→matten.de, Farbpalette, Startseite, Texte)
  assets/js/shell.js          gemeinsamer Rahmen: Kopfzeile, Warenkorb-Modal #cart-modal, mobile + Desktop-
                              Navigation, Newsletter-Widget, Fußzeile, Cookie-Hinweis; API-Helfer window.Shell;
                              Warenkorb (GET /api/cart, POST /api/cart/menge), Zähler "Cart (n)"
  assets/js/seite-*.js        je Seite ein Skript (IIFE, 'use strict', deutsch kommentiert)
  assets/js/vendor/           jQuery, Bootstrap-Bundle, fabric (lokal)
  assets/img/…                Bilder laut manifest.json (Original-URL → lokale Datei)
```

`bridge-demo/bau-net-daten.mjs` (Node, nur Builtins) erzeugt `daten.js` deterministisch aus `spec/` und dem Manifest; `node bau-net-daten.mjs --pruefen` fragt zusätzlich alle 21 Zuordnungspfade über die Brücke ab (Stand 10.09.2026: alle `kaufbar: true`).

**Preis (Produktseite):** ausschließlich `berechne()` aus `/preisformel.js` mit den Stammdaten je Produkt aus `struktur.json` (`einkaufProQm`, `salesFactor`, `standardbreiten`; Staffel/Sonderform/Sonderfarbe/TZ = Excel-Vorgabe). Die einzige weitere Rechenstelle ist `mitSteuerUndVersand()` in `seite-produkt.js` (Attributaufschlag je Stück laut Spec 13.8, Steuersatz des Artikels, Versand einmal je Position). Produkte ohne EK/m² (pid 4, 12, 26, 40): Live-Preis über `/api/price` bzw. „Preis auf Anfrage". Prüfwerte JetPrint-Premium: 50×200 cm → 101,71 € netto; 90×120 cm → ×1,25 = 137,30 € netto; 40×60 cm → 24,41 € netto = € 29,05 brutto, Endpreis inkl. 11,90 € Versand € 40,95.

**Abbildung auf matten.de** (`werte` mit den echten Feldnamen, Kommentar immer mit vollständiger Kalkulation):
* `In den Warenkorb` mit Standardgröße ohne Zuschläge → `dePfad` (Kauf) mit `attribute[Standardgröße]` (Zahlen passend in beiden Reihenfolgen).
* **Regel „Zielartikel nach Fähigkeit"** — sobald eine Konfiguration freie Maße braucht (Wunschmaß, Sonderform, Sonderfarbe oder `Make an offer`), wird der matten.de-Artikel so gewählt:
  1. der eigene Zwilling (`deZwilling`), wenn er **beide** Werte exakt aufnimmt — x als freie Zahl innerhalb min/max **oder** als Auswahlfeld, das genau die gewählte Breite enthält; y als freie Zahl innerhalb min/max (Achsentausch erlaubt, wenn dadurch beide passen);
  2. sonst der Kaufartikel selbst, wenn seine `masse[]`-Felder das können (z. B. Kokos `spezialoption[…][flaeche][x|y]`; bei `Make an offer` mit Präfix `ANGEBOT ANGEFORDERT (keine Bestellung)`);
  3. sonst der universelle Wunschmaß-Artikel **`/logomatten/6300201-logomatte-a` (Artikel 569, x 20–200 / y 40–700 frei)** — erste Kommentarzeile `ARTIKEL: <matten.net-Produktname> (Zuordnung matten.de: <dePfad>)`, damit das Team sieht, welches Produkt gemeint ist. Farben, die 569 nicht kennt, stehen nur im Kommentar.

  Kein Maß wird jemals stillschweigend auf einen anderen Wert gesetzt: entweder zeigt die Warenkorbzeile des Altsystems das echte Maß, oder die Position geht über 569. Die Zeile unter dem Preis nennt vor dem Klick den Weg („… übernehmen wir als Anfrage über 6300000-a / über den Wunschmaß-Artikel 6300201-logomatte-a (Artikel 569)").
  Beispiele (geprüft 10.09.2026 durch die echte Seite): `jetprint-premium` 90×120 → 569, `Mattengröße: 90cm × 120cm`, Kommentar beginnt mit `ARTIKEL: JetPrint-Premium (Zuordnung matten.de: /fussmatten/standard-schmutzfangmatten/6300000)`; `jetprint-premium` 85×120 → eigener Zwilling `6300000-a` mit x = `85 cm` (Auswahl), y = 120; `designmatten-jetprint` 90×120 → eigener Zwilling `6300201-logomatte-a`; `kokosmatten-naturfarbig` 90×120 → Kaufartikel selbst (flaeche x/y) als Kauf mit freien Maßen; `iron-horse-matte` (keine Maße, kein Zwilling) → 569 mit `ARTIKEL: IRON-HORSE-Mietmatte …`. Die Konstante für 569 steht in `seite-produkt.js` (`UNIVERSAL`); der Artikel wird erst beim ersten Bedarf geladen.
  **Einheit der Felder:** `spezialoption[…][spezial][x|y]` führt das Altsystem in cm (`Mattengröße: 90cm × 120cm`), `spezialoption[…][flaeche][x|y]` (Kokos, Diplomat) in **Millimetern** — Eingabe 90 landete als „90mm" (Warenkorbzeile, 10.09.2026). Die Seite sendet flaeche-Felder deshalb ×10 (`Abmessungen: 900mm × 1200mm`, geprüft). Freie Maße auf einem Kaufartikel bepreist das Altsystem selbst und ohne Sondermaßzuschlag (Kokos 90×120: 65,29 € statt unserer 92,43 € brutto) — die Zeile unter dem Preis sagt das, unsere Kalkulation steht im Kommentar.
* Auswahlattribute von matten.net gehen als `werte`, wenn das Altsystem den Wert wörtlich kennt (z. B. Kokos `20mm`, Diplomat `mit Kratzkante`), sonst in den Kommentar.
* Auswahlattribute von matten.net gehen als `werte`, wenn das Altsystem den Wert wörtlich kennt (z. B. Kokos `20mm`, Diplomat `mit Kratzkante`), sonst in den Kommentar.
* Gemischter Korb (Kontrakt): vor einer Anfrage in einen Korb mit Kaufpositionen wird gewarnt („Ihr Warenkorb wird damit zur Anfrage …"); Modal und Kasse zeigen bei `modus: 'gemischt'` denselben Hinweis; bei `modus !== 'kauf'` steht in allen Summenzeilen `auf Anfrage`.

## 3. Bewusste Abweichungen vom 1:1 (mit Grund)

1. **Warnbanner „Entwicklungswebsite"** weggelassen — Symfony-Entwicklungshinweis, kein Design (Briefing).
2. **Zweite, funktionslose Sprachauswahl** am Ende der mobilen Leiste weggelassen (Briefing). „English" steht in der Kopfzeile, zeigt auf `#` mit `title="in Vorbereitung"` — es gibt keine englische Fassung.
3. **Link-im-Link der Produktkarte** (ungültiges HTML): äußeres `<a>` bleibt, das innere `<a>` im `<h5>` ist ein `<span>`; `alt` gesetzt.
4. **Karussell:** Tippfehler „Fusßmatten" (Folie 5) korrigiert; Folien 3 und 4 verlinken auf die deutschen Kategorien `diplomat` und `jetprint-einfarbig` statt in die englische Fassung.
5. **Form / Rand / Sonderfarben** unter der Größe (Kundenwunsch UEBERGABE 7.6) — gibt es auf matten.net nicht. Seit 17.09.2026 (Mail Fuchsius 16.09., 20:24) zwei Auswahlfelder statt drei Kreuzen: `Form` (Rechteckig | Sonderform) und `Rand` (Mit Rand | Ohne Rand), dazu ein Zahlenfeld `Sonderfarben` (0–9). Daraus werden die alten Flags abgeleitet, mit denen Preisformel, Artikelwahl und Kommentar weiterarbeiten: Sonderform + mit Rand = ×1,5, Sonderform + ohne Rand = ×1,3, bei „Rechteckig" kein Formzuschlag (die Randwahl bleibt dann ohne Preiswirkung). **Aufpreise stehen nicht mehr am Feld** — der Preis unten rechnet sie ein. Im Bestellkommentar bleiben sie stehen, er geht an das Team des Auftraggebers.
6. **Endpreis-Zeile** „Endpreis inkl. MwSt. und Versand: € …" unter dem Preis (Kundenwunsch 7.3).
7. **Hinweis über den Rechtstexten** „Dieser Text ist eine Kopie von matten.net und anwaltlich nicht geprüft." (Abmahnrisiko, UEBERGABE 10.3).
8. **Maßhinweise mit Richtung** („Breite höchstens 200 cm — bitte kleiner wählen") als Text unter dem Feld statt nur Tooltip (Kundenwunsch 7.2). Die Tooltip-Attribute des Originals bleiben.
9. **Preisformat** `€ 1.234,56` und `Plus 11,90€ Versandkosten` (deutsch) statt `€ 89.06` / `Plus 10.00€` — und der Betrag ist der richtige (das Original zeigt laut Spec 17.1 einen falschen Wert). Versand = `preis.versand` des matten.de-Kaufartikels (z. B. 11,90 €), nicht der 10,00 € von matten.net.
10. **`Custom` auch bei „JetPrint Premium 1-farbig" und „JetPrint light 1-farbig"** (matten.net führt dort keine `customOption`): der matten.de-Artikel kennt freie Maße, und Sondermaße sind dem Kunden am wichtigsten (UEBERGABE 7.1). Leicht rückbaubar in `seite-produkt.js` (`orderFormHTML`, Variable `custom`).
11. **Diplomat: Maße in cm (40–200 / 40–700)** statt der mm-Felder des Originals (100–3500 / 100–5000 mm) — Preisformel und Altsystem rechnen in cm; die mm-Felder sind eine Inkonsistenz von matten.net. Folge der Excel-Formel: bei Standardbreite `[100]` gilt die Rollenbreite 100 cm, ein Maß mit beiden Seiten > 100 cm meldet „Matte zu breit" — dann bleibt `Make an offer`.
12. **Farbfelder** kommen vom matten.de-Artikel (`attribute[Grundfarbe]`/`[Designfarbe]`), nicht aus der matten.net-Datenbank. Deshalb hat z. B. JetPrint-Premium (→ 6300000 „einfarbig") nur eine Grundfarbe, während matten.net dort auch eine Designfarbe zeigt; Produkte auf 6300201-logomatte haben beide. Der Wert `default` wird nicht als Feld gezeigt. Hexwerte aus der Palette (Original-Markup + Designer-Materialien); ohne Hexwert wird das Farbmuster-Bild des Altsystems (`…_farboption.jpg`) als Feld gezeigt (IRON-HORSE), sonst neutrales Grau mit Namen im `title`.
13. **Miniaturen:** zusätzlich zur lokalen Vorlage die Ansicht des Altsystems zur gewählten Grundfarbe (Kundenwunsch 7.5 — Bild folgt der Farbe; über `/api/img/`).
14. **Warenkorb-Modal, Zeilen des gefüllten Korbs** sind auf matten.net nicht erfasst (Spec 18): Bild · leer · Produkt (Name, Attributzeile, Kommentar) · Preis · Menge (Zahlenfeld, 0 entfernt) · Total · Entfernen. „Nettosumme" liefert die Brücke nicht — Zeile bleibt „—", es wird nichts gerechnet.
15. **Kasse** ist auf matten.net nicht erfassbar (302 bei leerem Korb): Bootstrap-Formular nach dem Kundendatenformular des Designers (Spec 9.7), Felder/Reihenfolge/Pflicht vom Altsystem (`adressfelder`), Vorbelegung für Tests (Vorname `TEST`, Nachname `Sehorz (Bitte ignorieren)`, Firma `TESTBESTELLUNG – kein echter Auftrag`, Bemerkung), E-Mail leer.
16. **Produktkarten-Bilder** nach dem Live-HTML von `/de/products` (Velour = Papagei, JetPrint light Logo = Farbkarte, JetPrint-Premium = JPrint-005); sieben fehlende Bilder (Vorteils-Icons, fünf Kacheln) am 10.09.2026 per GET von matten.net nachgeladen und ins Manifest eingetragen. Die 27 endungslosen Bilddateien (`…jpeg` ohne Punkt) tragen jetzt `.jpeg`, weil der lokale Server Pfade ohne Punkt als Verzeichnis behandelt (404); die Manifest-Schlüssel (Original-URLs) sind unverändert.
17. **Menükacheln Cushion Coil / Scraper** ohne Bild (im Original `via.placeholder.com` — Fremdressource): graue Fläche.
18. **Newsletter-Widget** mit `method="post"`, Absenden wird abgefangen, Hinweis „in Vorbereitung" (Original: ohne Funktion).
19. **Filtergruppen der Produktliste** per `<button>` auf-/zuklappbar statt Inline-`onclick` auf einem `<span>`.
20. **Doppelte `id="navbarDropdown"`** der mobilen Leiste sind eindeutig (`navbarDropdown-0…`).
21. **Attribut-Beschriftungen** aus `struktur.json` korrigiert (dort Farbnummern statt Beschriftungen): Diplomat `attributes[4]` = „Kratzkante", Hinweismatten `attributes[2]/[3]` = „Schrift-Design"/„Format" (Spec 15.2, Original-Markup).
22. **Registrierung:** Länderliste (249) über `Intl.DisplayNames('de')` erzeugt — die Erfassung nennt nur Anfang und Ende der Liste. Das Altsystem liefert unter `/register` kein Formular; die Antwort der Brücke wird unverändert angezeigt, es wird kein Konto vorgetäuscht.
23. **Blog-Einzelbeitrag** über `blog.html#slug` (statt `/de/blog/<slug>`).
24. **Farbfelder vor dem Aufklappen: 30** wie das Original-CSS (`nth-child(n+31)`), nicht 12 wie im Briefing — der Screenshot von matten.net zeigt 30.
25. **Cookie-Hinweis** schlicht nachgebaut (Balken unten, Farben laut Spec 1, `localStorage` in try/catch), kein `cookieconsent`-Skript.
26. **Kein Weg-Hinweis unter dem Endpreis** (seit 17.09.2026, Mail Fuchsius): der Satz „Wunschmaße übernehmen wir als Anfrage über … — den berechneten Preis bestätigen wir im Angebot" entfällt. Begründung des Auftraggebers: Das bestätigt ohnehin die Auftragsbestätigung bzw. das Angebot. `weg()` bildet den Text weiter, weil die Artikelwahl darauf aufbaut und er im Bestellkommentar erhalten bleibt; nur `#weg-hinweis` bleibt leer.
27. **Mehrere Designfarben namentlich** (seit 17.09.2026, Mail Fuchsius 20:30): die Beschriftung der Farbgruppe zeigt alle gewählten Werte („600 Weiß, 601 Zitronengelb, 602 Gelb") statt der ersten mit Zähler („600 Weiß (+2)") — wie matten.net.

## 4. Was geprüft wurde (10.09.2026)

* `node --check` auf alle 9 Skripte; `node bau-net-daten.mjs` läuft ohne Fehler und ist idempotent (gleiche Prüfsumme bei zwei Läufen).
* Alle 12 Seiten (+ `?page=2`, `?s=impressum`) HTTP 200; Headless Chrome ohne Konsolenfehler auf Start, Kategorie, Produkt (6 Produkttypen), Produktliste, Kasse, Registrierung.
* Kein waagerechter Überlauf bei 375/768/1280 px auf 7 Seiten (`scrollWidth === innerWidth`). Bei 375 px werden die Knopfgruppe `Cart | Auschecken` und die Farbfeldreihen rechts abgeschnitten — im Original (Screenshot matten.net, 375 px) genauso; das ist das Original-CSS, nicht korrigiert.
* Screenshot-Vergleich matten.net ↔ net-neu (1280 px): Startseite, `ironhorse`, `jetprint-premium`, Produktliste, Login, Registrierung, Blog — Aufbau, Abstände, Farben stimmen überein.
* Funktionsprobe durch die echte Seite (DevTools-Protokoll): `jetprint-premium` 40×60 → `In den Warenkorb` → `/api/cart` zeigt `Standardgröße: 40cm x 60cm`, 24,90 €; danach Custom 90×120 → `Make an offer` → Warnung gemischter Korb → Position `auf Anfrage`, Kommentar mit Kalkulation (netto 137,30 €, brutto inkl. Versand 175,29 €, Sondermaß ×1,25). Kasse bis Schritt 3 für Anfragenkorb (`Anfrage abschicken`, grün, `anfrage_abschicken`) und Kaufkorb (`Bestellung abschicken`, Vorkasse/Rechnung, Ogone nur benannt). Danach `POST /api/cart/clear`. **`POST /api/kasse/bestellen` wurde nie ausgelöst.**
* `grep -rn http public/net-neu`: nur `href`-Links (Social Media, Rechtstexte), keine geladene Fremdressource.

## 5. Offene Punkte

1. **Wunschmaß beim Zwilling `6300000-a` (JetPrint-Premium, JetPrint Premium 1-farbig):** dort ist `spezialoption[…][x]` ein Auswahlfeld der Bahnbreiten 60/75/85/115/150/200 cm. Eine Breite außerhalb (z. B. 90) lehnt die Brücke ab; das Altsystem speichert dann die Vorgabe (`Mattengröße: 60cm × 120cm`), das richtige Maß steht im Kommentar. Die Seite sagt das vor und nach dem Klick. Trifft die Länge eine Bahnbreite, werden die Achsen getauscht. Bei den Zwillingen `6300201-logomatte-a`, `jetprint_matten-light-einfarbig-a`, `jetprint_light-matten-a`, `6400201-velourmatte-a` ist x frei — dort landet das Wunschmaß vollständig (geprüft: `Mattengröße: 90cm × 120cm`). Entscheidung für den Auftraggeber: JetPrint-Premium auf `6300201-logomatte-a` umhängen?
2. **`POST /api/kasse/optionen` verlangt `zahlungsart` auch beim Anfragenkorb** („Feld zahlungsart muss eine Zeichenkette sein") — laut Kontrakt gibt es dort keine. Die Seite schickt den versteckten Wert `optionen.zahlungsart.versteckt`, wenn die Brücke ihn liefert; sonst geht sie mit Hinweis zur Vorschau weiter.
3. **Excel-Formel vs. matten.net:** Mengenstaffel nach Stück (Excel) statt nach m² (matten.net), Rollenbreite = größte Standardbreite (Diplomat 100 cm → „Matte zu breit" bei zwei Seiten > 100). Beide Punkte sind Vorgabe (Briefing/UEBERGABE 7.8), nicht Frontend.
4. **IRON-HORSE-Mietmatte (pid 4 → `/miet-mattenservice/mietmatten`):** Artikel ohne freie Maße; die matten.net-Fixgrößen (50×85 …) entsprechen nicht den `Mattengröße`-Optionen des Altsystems (85×90 …) — der Kauf geht mit nächstliegender Größe + Kommentar, der Live-Preis (5,18 €) ist der des Altsystems.
5. **Gästebuch, Passwort-Reset, Newsletter, englische Fassung:** ohne Funktion bzw. nicht vorhanden (wie im Original bzw. nicht angebunden).
6. **Kokos, Logomatten (pid 26):** nur Anfrage (`beflockte_kokosmatte-a`), kein Preis.
7. **Mattendesigner** (`mattendesigner.html`, `designer-checkout.html`): am 10.09.2026 nach dem Schreiben dieser Datei noch gebaut (`seite-designer.js`, `seite-designer-checkout.js`), aber **ungeprüft** — keine Befundliste.
8. **Preis mehrerer Sonderfarben — Rückfrage offen (17.09.2026).** Die Excel-Vorlage kennt in P3 nur „Sonderfarbe ja/nein" mit 68,- € netto (VK) bzw. 50,- € (EK), ausdrücklich einmal je Auftrag. Seit dem Kundenwunsch nach einer Anzahl rechnet `preisformel.js` **68,- € je Sonderfarbe**, weiterhin nur einmal je Auftrag (`sonderfarbenAnzahl`; zwei Farben = 136,- € netto, unabhängig von der Stückzahl). Dass sich der Betrag je Farbe vervielfacht, ist eine **Annahme** — der Entwurf der Rückfrage liegt in `Frontend/_arbeit/FRAGE-SONDERFARBEN.md`. Bleibt es bei 68,- € pauschal, genügt es, in `preisformel.js` den Faktor `sonderfarbenAnzahl` bei `aufschlagVK`/`aufschlagEK` wieder auf 1 zu setzen.
