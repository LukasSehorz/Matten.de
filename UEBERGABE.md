# Übergabe: Webshop matten.de — Stand, Architektur, offene Aufgaben

**Stand:** 1. September 2026
**Zweck:** Vollständige Einarbeitung für eine neue Sitzung ohne Vorwissen.
Dieses Dokument beantwortet: Was ist gebaut? Wie hängt es mit dem Altsystem zusammen?
Wie funktioniert die Preisformel? Was ist als Nächstes zu tun?

---

## 1. Worum es geht

Lukas Sehorz prüft den **Kauf des Webshops matten.de** (Betreiber: FUCHSIUS multi-media GmbH,
Ansprechpartner Dieter Fuchsius, Tel. +49 171 77 55 400, info@matten.de). Parallel entsteht
ein **neues Frontend**, das an das bestehende Backend angeschlossen wird.

Der Shop verkauft Fußmatten, Logomatten, Kokosmatten, Aluminium-Profilmatten, Gummimatten
und einen Miet-Mattenservice. Das Geschäft ist **anfragegetrieben**: Kunden fragen an,
das Team kalkuliert und macht ein Angebot. Zahlungsart ist praktisch immer „Rechnung".

### Die Beteiligten

| Wer | Rolle |
|---|---|
| **Dieter Fuchsius** | Eigentümer, Verkäufer. Gibt die fachlichen Vorgaben. |
| **Jürgen Schuback, MELTING MIND** | Agentur, Tel. 0451 317230. Hat matten.de entwickelt und hostet es. **Der Quellcode liegt bei ihm.** |
| **Lukas Sehorz** | Kaufinteressent, baut das neue Frontend. |

---

## 2. Die drei Systeme — nicht verwechseln

### 2.1 matten.de — das produktive Altsystem

- **Technik:** Eigenentwicklung in PHP, Apache, Session über `PHPSESSID`. Kein Framework
  erkennbar (kein Laravel/Symfony/Shopware-Cookie).
- **Gehostet bei Melting Mind**, nicht bei STRATO: A-Record zeigt auf `195.226.185.65`
  = `web2.melting-mind.de` (1&1 Versatel, Lübeck).
- **Domain** ist bei STRATO registriert (Paket „STRATO Hosting Pro", Auftrag 66772,
  16 Domains). **MX-Einträge zeigen auf `smtpin.rzone.de` = STRATO** — E-Mail läuft dort,
  daran darf nichts geändert werden.
- **Admin:** `matten.de/admin/bestellungen`, Login vom Verkäufer gestellt.
  Status-Kette: Angefragt → Angeboten → Abgelehnt → Bestellt → Storniert → Bezahlt →
  Geordert → Geliefert → Gemahnt.
- **Umfang:** 8 Oberkategorien, 16 Unterkategorien, **365 Produkte** (davon 185 mit Preis,
  180 reine Anfrageartikel), ~300 Bilder unter `/media/bild/`.

**Wichtig:** Auf dem STRATO-Paket liegen nur die Nebenseiten (matten.net, mattenfuchs.de,
kokos-fussmatten.de, eine WordPress-Installation, Ju Stones). Der Shop selbst ist dort nicht.
Über STRATO kommt man **nicht** an den Shop-Code.

### 2.2 matten.net — eine unfertige Modernisierung

- Trägt den Banner „⚠️ Entwicklungswebsite — entspricht möglicherweise nicht den geltenden
  Gesetzen und Vorschriften".
- **Technik:** PHP 8.4, Symfony mit Twig (serverseitig gerendert), Vue 2 nur im Mattendesigner,
  Webpack-Build unter `/build/`. Eigene Datenbank (STRATO DB3528099, angelegt 2018).
- **Läuft auf dem STRATO-Paket**, also auf Infrastruktur, zu der Lukas Zugang hat.
- **Umfang: nur 19 Produkte**, 14 von 27 Kategorien leer. Die Preisanzeige auf den
  Produktseiten ist nachweislich fehlerhaft (zeigt z. B. „−635,67" oder „168.319,93").
- **Aber:** Fuchsius hat diese Seite selbst konzipiert. Sie ist **das Vorbild für Aufbau,
  Handhabung, Farb- und Größenauswahl** — ausdrücklich nicht für die Optik.

### 2.3 Der neue Shop — was wir gebaut haben

Liegt unter `Frontend/bridge-demo/public/net/`. Aufbau wie matten.net, modernes Design,
Daten live aus matten.de.

---

## 3. Die Brücke — wie neues Frontend und altes Backend zusammenspielen

### 3.1 Das Grundprinzip

Ein HTML-Formular ist ein offener Vertrag. Das Altsystem prüft nur, ob die richtigen Felder
ankommen — wie die Seite aussah, von der sie kommen, weiß es nicht. Deshalb funktioniert:

```
Besucher  →  neues Frontend (HTML/CSS/JS)
                  ↓  JSON
             Brücke (Node-Proxy)
                  ↓  Formular-POST / HTML-Parsing
             matten.de  (unverändert)
```

**Am Altsystem wurde nichts geändert** — kein Code, keine Datenbank, keine Konfiguration.
Alles, was die Brücke tut, könnte auch ein Besucher mit einem Browser tun.

Der Proxy ist nötig, weil Browser aus Sicherheitsgründen keine Hintergrundanfragen an eine
fremde Domain erlauben. Läuft das Frontend später auf matten.de selbst, entfällt er.

### 3.2 Dateien

| Datei | Rolle |
|---|---|
| `Frontend/bridge-demo/lib/bruecke.mjs` | **Die gesamte Fachlogik.** Von allen drei Verbrauchern importiert. |
| `Frontend/bridge-demo/server.mjs` | Lokaler HTTP-Server, Port 8787 (weicht auf 8788/8789 aus). Nur Laufzeit, Dateiauslieferung, Sitzungsspeicher, Routing. |
| `Frontend/netlify/functions/api.mjs` | Zustandslose Fassung für Netlify. Sitzung über Cookie statt Serverspeicher. |
| `Frontend/bridge-demo/build-katalog.mjs` | Erzeugt den Katalog beim Deploy (dauert ~190 s, passt nicht in eine Netlify-Function). |
| `netlify.toml` (Repo-Wurzel) | `base=Frontend`, `publish=dist`, `functions=netlify/functions` |

**Start lokal:**
```bash
cd "Frontend/bridge-demo"
node server.mjs          # → http://localhost:8787
```
Keine npm-Abhängigkeiten, nur Node-Builtins. Node 24 vorausgesetzt.

**Einstiegsadressen:**

| | |
|---|---|
| Neuer Shop | `http://localhost:8787/net/` |
| Artikelseite | `/net/produkt.html?pfad=%2Flogomatten%2F6300201-logomatte` |
| Mattendesigner | `/net/mattendesigner.html` |
| Design-Bausteine | `/net/styleguide.html` |
| Ältere Demo (statisches Design) | `/shop/` |
| Preisrechner (eigenständig) | `/rechner.html` |

### 3.3 Die Endpunkte der Brücke

**Katalog (beim Deploy vorgebaut, lokal mit 10-Minuten-Cache):**
```
GET  /api/katalog                      Kategoriebaum
GET  /api/kategorie?pfad=…&details=1   Produktliste (details=1 dauert ~12 s ungecacht)
GET  /api/produkt?pfad=…               Detail inkl. Bilder, Attribute, masse, kaufformular
GET  /api/suche?q=…                    ?alle=1 liefert den Gesamtkatalog
GET  /api/katalog/diagnose             Parser-Gesundheit
```

**Live vom Altsystem:**
```
GET  /api/price?pfad=…&anzahl=N&<attribute…>   Preis
POST /api/cart/add    { pfad, anzahl, werte:{…}, kommentar }
GET  /api/cart                                  Warenkorb (liefert je Position pfad + bild)
POST /api/cart/menge  { key, anzahl }
POST /api/cart/clear
GET  /api/cart/raw                              Rohantwort von matten.de als Beweis
GET  /api/konto                                 Anmeldestatus
POST /api/konto/login { email, passwort }
GET  /api/kasse/formular                        Länder, Versandarten, Zahlungsarten
POST /api/kasse/adresse                         422 mit Feldfehlern des Altsystems
POST /api/kasse/optionen  { land, versandart, zahlungsart }
GET  /api/kasse/vorschau                        Bestellstand + finalRequest
POST /api/kasse/bestellen { bestaetigung: "JA-BESTELLEN" }   ⚠ ECHTE BESTELLUNG
GET  /api/img/<pfad>                            Bildproxy (Allowlist)
```

⚠️ **Der Parameter für Attribute heißt `werte`, nicht `attribute`.** Die Schlüssel sind die
echten Feldnamen des Altsystems, z. B. `attribute[Standardgröße]` oder
`spezialoption[459][spezial][y]`. Falscher Parametername führt dazu, dass die Vorgabewerte
verwendet werden — ohne Fehlermeldung.

### 3.4 Sicherheitsmerkmale — nicht aufweichen

1. **Nur `VorkassePayment` und `RechnungPayment`.** `OgonePpPayment` (PayPal) und
   `OgoneCcPayment` (Kreditkarte) führen zum Zahlungsdienstleister Worldline/Ogone und werden
   serverseitig mit 400 abgelehnt — **vor** jedem Upstream-Aufruf. Allowlist, keine Denylist.
2. **`POST /api/kasse/bestellen` verlangt `bestaetigung === "JA-BESTELLEN"`**, strikter
   Vergleich ohne Typkoerzierung (ein Array `["JA-BESTELLEN"]` würde sonst durchrutschen).
3. **Host-Bindung:** Der Proxy spricht ausschließlich mit matten.de, auch über Weiterleitungen.
4. **Bildproxy** mit Pfad-Allowlist, Content-Type-Prüfung aus der Antwort, keine Redirects.
5. **Umgebungsvariable `BESTELLUNG_GESPERRT=1`** schaltet den Bestellschritt komplett ab
   (Standard: aus).

**Regel für alle Frontend-Arbeiten: Im Browser wird kein Geldbetrag gerechnet.** Alle Beträge
kommen vom Altsystem und werden nur formatiert. Einzige Ausnahmen: die Preisformel
(`preisformel.js`) und eine ausdrücklich gekennzeichnete Funktion `mitSteuerUndVersand()`.

---

## 4. Der Bestellweg im Altsystem

Vollständig aufgeklärt und einmal live durchlaufen (Testbestellung B8260484, danach gelöscht):

| # | Aufruf | Felder | Antwort |
|---|---|---|---|
| 1 | `POST /warenkorb` | `artikel`, `anzahl`, `attribute[…]`, `spezialoption[…]`, `kommentar`, `addtocart` | 302 → `/warenkorb` |
| 2 | `POST /warenkorb` | `adresse[land]`, `versandart`, `zahlungsart` | 200, neu gerechnet |
| 3 | `POST /adresse` | `adress[anrede\|vorname\|name\|firma\|strasse\|plz\|ort\|land\|email\|telefon\|mobil\|fax\|uid\|bemerkungen]`, `adress[agb]`, `save` | **302 → `/bestellen`** = gültig, **200 mit Fehlertexten** = ungültig |
| 4 | `GET /bestellen` | – | Übersicht |
| 5 | `POST /bestellen` | **`bestellung_abschicken`** — ein einziges Feld | 302 → `/danke` |

**Kein Kundenkonto nötig** — Gastbestellung ist der reguläre Weg. `/register` liefert kein
Formular (funktionslos), ein Login existiert aber.

Versandarten: `7`=DHL, `11`=pauschal, `12`=DPD, `13`=Spedition.
Pflichtfelder der Adresse: anrede, vorname, name, strasse, plz, ort, email, telefon, agb.

**Die Dankeseite zeigt keine Bestellnummer.** Der Auftrag ist nur im Admin sichtbar.

---

## 5. Die Preisformel

### 5.1 Herkunft

Aus der Excel-Tabelle des Kunden. Aktuellste Fassung:
`1PREISE-Brian_Sehorz-26-08-30_18-48.xlsx` (in `C:\Users\lukas\Downloads`).
Der Rechenteil `A1:W7` ist gegenüber der Vorversion **Zelle für Zelle identisch** —
neu sind nur die Erläuterungen, die klären, welche Werte Artikelstammdaten sind.

### 5.2 Die Rechnung

```
qm/Stück (D4)   =  Breite × Länge × 0,0001

VK/Stück (G5)   =  ( qm × EK-Listenpreis/qm (Q5) × Salesfactor (C2)
                     × Staffelfaktor(Menge) × TZ-Faktor (S2) )
                   × Sondermaß (L5) × Sonderlänge (M5)
                   × Sonderform ohne Rand (N5) × mit Rand (O5)
                   + Sonderfarbe (P5)

VK gesamt (F5)  =  (Menge × G5) − ((Menge − 1) × P5)
```

**Die letzte Zeile ist der wichtigste Fallstrick:** Der Sonderfarbenaufschlag wird
**nur einmal** berechnet, nicht je Stück. Wer die Formel nachbaut, macht hier fast
garantiert den Fehler.

**Werte des Beispielartikels `6300201-Logomatte`:**

| Größe | Wert | Zelle |
|---|---|---|
| Salesfactor mehrfarbig / einfarbig / Ped-Print | 1,931 / 1,728 / 1,8 | F1 / I1 / L1 |
| EK-Listenpreis pro qm | 54,63 € | Q5 |
| Teuerungszuschlag TZ | 0 % (ab 01.04.2022) | R2 |
| Mindestmaß / Maximallänge | 30 cm / 700 cm | B6 / C6 |
| Standardbreiten | 60, 75, 85, 115, 150, 200 | Q7:V7 |
| Mengenschwellen | 1, 2, 3, 10, 20, 30 | Q6:V6 |
| Staffelfaktoren | 0,95 / 0,92 / 0,90 / 0,89 / 0,88 | R5:V5 |
| Sondermaß-Zuschlag | × 1,25 | L5 |
| Sonderform ohne / mit Rand | × 1,3 / × 1,5 | N5 / O5 |
| Sonderfarbe VK / EK | +68 € / +50 € | P5 / P6 |

**Sondermaß-Regel (L5):** Zuschlag 1,25 greift, wenn **weder** Breite **noch** Länge exakt
einer Standardbreite entspricht. 200 × 199 cm = kein Zuschlag, 199 × 199 cm = +25 %.
Diese Asymmetrie ist eine offene Frage an den Kunden.

**Fehlerfälle:** unter 30 cm → „zu schmal" · beide Seiten über 200 cm → „Matte zu breit" ·
über 700 cm → „Matte zu lang".

### 5.3 Umsetzung im Code

| Datei | Inhalt |
|---|---|
| `Frontend/bridge-demo/public/preisformel.js` | Das Modul. Abhängigkeitsfrei, läuft im Browser und in Node. Konstanten sind **je Artikel überschreibbar** (Artikelstammdaten). |
| `Frontend/bridge-demo/pruefe-preisformel.mjs` | 61 Testfälle, 884 Einzelwerte, gegen die Excel-Formeln geprüft. **Nicht verändern.** |
| `Frontend/bridge-demo/pruefe-stammdaten.mjs` | 62 weitere Fälle für die Stammdaten-Fassung. |
| `Frontend/bridge-demo/PREISFORMEL.md` | Formel in Prosa, offene Fragen. |
| `Frontend/bridge-demo/STAMMDATEN.md` | **Weitergabefertige Unterlage für Melting Mind** — welche 16 Felder in den Artikelstammdaten ergänzt werden müssen. |

**Prüfen:**
```bash
cd "Frontend/bridge-demo"
node pruefe-preisformel.mjs     # muss 61/61 melden
node pruefe-stammdaten.mjs      # muss 62/62 melden
```

**Referenzwerte zum Gegenrechnen:**

| Eingabe | Ergebnis |
|---|---|
| 50 × 200 cm, 1 Stück, mehrfarbig | **105,49 €** je Stück |
| 90 × 120 cm, 1 Stück | **142,41 €** (Sondermaß × 1,25) |
| 50 × 200 cm, 5 Stück, Sonderfarbe | **553,26 €** gesamt (97,05 × 5 + 68,00) |
| 29 cm Breite | „zu schmal" |
| 250 × 250 cm | „Matte zu breit" |
| 150 × 750 cm | „Matte zu lang" |

### 5.4 Der Beweis, dass die Formel stimmt

Auf dem Stammdaten-Screenshot des Kunden (`JP-Logomatte-Stammdaten.png`) stehen fünf Zahlen.
**Alle fünf folgen exakt aus der Formel:**

```
54,63 €/qm × 1,931            = 105,49 €/qm netto     ✓ im Screenshot
                     × 1,19   = 125,53 €/qm brutto    ✓ im Screenshot
Standardgröße 60 × 40 = 0,24 qm
  × 105,49053  = 25,32 €  netto    ✓ im Screenshot
  × 1,19       = 30,13 €  brutto   ✓ im Screenshot
  × 54,63      = 13,11 €  Einkauf  ✓ im Screenshot
```

### 5.5 Was die drei Systeme können — der entscheidende Vergleich

| | Fläche × EK × Faktor | Sondermaß ×1,25 | Mengenstaffel | Sonderform | Sonderfarbe |
|---|---|---|---|---|---|
| **Excel des Kunden** | ✅ | ✅ | ✅ nach **Stückzahl** | ✅ | ✅ einmalig |
| matten.net | ✅ | ✅ | ⚠️ nach **Fläche** (25/50/100 m²) | ❌ | ❌ |
| matten.de | ✅ nur Standardgrößen | ❌ | ❌ | ❌ | ❌ |
| **unser Frontend** | ✅ | ✅ | ✅ | ✅ | ✅ |

**Bei „Maßanfertigung" fällt matten.de auf den Grundpreis zurück** — 60 × 200 cm und
200 × 200 cm kosten dasselbe. Genau diese Lücke soll die Integration schließen.

---

## 6. Bekannte Eigenheiten des Altsystems

Alle empirisch belegt. Wer sie nicht kennt, sucht lange.

1. **Preisvorschau und Warenkorb widersprechen sich.** Bei JetPrint-Artikeln rechnet
   `getpricejson` einen `optionenpreis` mit ein (z. B. 95,40 €), der Warenkorb nicht.
   Beispiel `/logomatten/6300201-logomatte`: Vorschau 125,53 €, Warenkorb 30,13 € brutto.
   Betroffen sind nur Artikel mit `optionenpreis > 0`. **Frage an den Kunden**, ob das ein
   Fehler ist oder eine Pauschale, die im Angebot ergänzt wird.
2. **Freie Maße ändern den Preis nicht.** `spezialoption[…][y]` wird angenommen und
   mitbestellt, wirkt sich aber nicht auf den Preis aus.
3. **Das Aluminium-Anlaufprofil kostet unabhängig von der Länge 40,98 €** — 100 cm wie
   2000 cm. Das Feld hat zudem keine Grenzen.
4. **Die Suche existiert, ist aber nirgends verlinkt:** `GET /suche?search=<begriff>`.
   Der Parametername ist entscheidend — `?q=` wird stillschweigend ignoriert und liefert
   alle 384 Artikel.
5. **Der Shop merkt sich den letzten Suchbegriff in der Session.** Jede Suche braucht eine
   eigene Sitzung, sonst kommen falsche Ergebnisse ohne Fehlermeldung.
6. **Zeichensätze sind gemischt** — Template-Texte cp1252, Datenbankwerte UTF-8, beides im
   selben Dokument, das sich „charset=utf-8" nennt. `decodeBody()` in `lib/bruecke.mjs`
   fängt das ab.
7. **Der Kommentar beim Add-to-cart wird nur übernommen, wenn er UTF-8-kodiert gesendet wird.**
8. **`sitemap.xml` ist von Februar 2020**, bei 500 URLs abgeschnitten, mit toten Kategorien.
9. **Attributwerte enthalten Anführungszeichen**, z. B.
   `ja, Vorlage-Datei senden an: "info@matten.de"` — beim Parsen beachten.
10. **Einige Artikel (`…-a`-Geschwister) haben keinen Namen** im Altsystem.

---

## 7. Was der Kunde will (Mails vom 30./31. August 2026)

Fuchsius hat den ersten Entwurf gesehen und deutlich kritisiert. Seine Punkte:

> „Der Kunde muss viel zu viele Fragen beantworten und einige indirekt mehrfach, von denen
> er eigentlich gar nichts wissen will. Da muss er auf die richtige Spur geführt werden."

> „Wir müssen davon ausgehen, was der Kunde im Kopf hat, wenn er einkaufen geht. Der hat nur
> sein Wunschmaß im Kopf. Welche Größe wir realisieren können, ob das Sondergröße oder
> Standardgröße ist, weiß der Kunde nicht. Deswegen muss er das nicht eingeben, sondern es
> muss ihm gezeigt werden — er muss dahin geführt werden."

> „Alles was zu viel und zu unübersichtlich ist, muss vermieden werden."

> „Wir müssen das Rad nicht neu erfinden. Viele Dinge sind bereits fertig."

**Konkret gefordert:**

1. **Größenauswahl:** zuerst alle Standardgrößen anzeigen, dann ein gut sichtbarer Weg zum
   Sondermaß — **nicht am Ende**, sondern „in der Mitte oder am Anfang".
2. **Bei unmöglichen Maßen** einen Hinweis, was zu tun ist (größer/kleiner), nicht nur
   „ungültig".
3. **Danach Menge**, dann Preis **inkl. Mehrwertsteuer und inkl. Versandkosten**
   (Versand ebenfalls inkl. MwSt).
4. **Dann „In den Warenkorb"** — oder Angebot anfordern, oder kaufen.
5. **Das Produktbild links muss sich mit der Farbauswahl ändern.** Das gibt es bei matten.net
   und soll unbedingt bleiben.
6. **Sonderform und Sonderfarbe „einfach nur durch ein Kreuz im entsprechenden Feld"** —
   unaufdringlich, kein eigener Prüfungsblock.
7. **Die Kalkulation nicht neu erfinden** — sie funktioniert bei matten.net.
8. **Die Excel-Formel muss in matten.de eingebaut werden**, auf Basis der je Artikel
   festgelegten Stammdaten. Davon sieht der Kunde nichts.
9. **Über die Startseite und die Übersichtsseiten will er persönlich sprechen**, bevor dort
   Arbeit hineinfließt.

**Er hat zugesagt, Schuback anzurufen und um den Code zu bitten.**

---

## 8. Aktueller Stand des neuen Shops

Alles unter `Frontend/bridge-demo/public/net/`. 12 Seiten, geprüft und abgenommen.

### 8.1 Aufbau

| Datei | Inhalt |
|---|---|
| `assets/css/net.css` | Designsystem, ~2000 Zeilen, 71 Tokens. Gestaltungsidee „Die Kante" — eine 3-px-Cyan-Kante als einziges auffälliges Mittel. |
| `assets/css/seiten-*.css` | Seitenspezifische Ergänzungen |
| `assets/js/net-nav.js` | **Nur Daten** — Navigationsbaum, Routen, Firmendaten |
| `assets/js/net-shell.js` | Kopf, Navigation, mobiles Schubfach, Fuß, Warenkorbzähler |
| `assets/js/net-api.js` | Gemeinsame API-Hilfsfunktionen |
| `assets/js/seite-*.js` | Je Seite ein Skript |
| `index.html` … `styleguide.html` | Die 12 Seiten |

Schriften (Archivo, Barlow) liegen lokal unter `public/fonts/`. **Keine Google Fonts,
keine Fremd-CDN, keine Ressource direkt von matten.de** — Bilder ausschließlich über
`/api/img/`.

### 8.2 Navigation

Obergruppen und Reihenfolge von matten.net, darunter die echten Kategorien von matten.de.
Alle 24 Kategorien erreichbar, Artikelzahlen stimmen mit `/api/katalog` überein.

### 8.3 Die Artikelseite — nach der Kritik neu gebaut

**Links:** Produktbild, das mit der Grundfarbe wechselt, plus Ansichtsstreifen.

**Rechts, genau vier Fragen:**
1. Farbfelder (12 offen, „Alle 45 Farben anzeigen")
2. **Größe als sichtbare Kartenliste** mit Maß und Preis je Stück inkl. MwSt.
3. **Als 10. Karte in derselben Liste:** „Ihr Maß ist nicht dabei? · Wunschmaß eingeben"
4. Sonderform ohne/mit Rand und Sonderfarbe als drei ruhige Ankreuzzeilen
5. Menge
6. **Bruttoendpreis inkl. MwSt und Versand** als große Zahl, aufklappbar mit Aufschlüsselung
7. „In den Warenkorb" und „Angebot anfordern"

**Der Colortype wird nicht abgefragt** — er ist Artikelstammdatum.

Auf dem Handy hält eine angeheftete Leiste den Preis sichtbar.

### 8.4 Der Mattendesigner

Dieselben Bausteine, aber Wunschmaß zuerst, Standardgrößen als Vorschläge darunter.
Dazu eine maßstabsgetreue Skizze und der aufklappbare Rechenweg mit Excel-Zellbezügen.

### 8.5 Warenkorb und Kasse

Warenkorb mit Rückweg zur Produktseite (`/api/cart` liefert je Position `pfad` und `bild`).
Kasse vierstufig: Adresse → Versand & Zahlung → Prüfen → Ergebnis. Echte serverseitige
Validierung mit den Fehlermeldungen des Altsystems am jeweiligen Feld.

### 8.6 Was geprüft ist

- Preisformel 61/61 und 62/62
- Kein Geldbetrag wird im Frontend gerechnet (gezielte Suche über alle Skripte)
- Kassensicherung: Bestellknopf ohne Häkchen gesperrt, alle API-Gegenproben 400
- Keine Fremdverbindungen
- 14 Seiten × 375/720/1024 px ohne waagerechten Überlauf, keine Konsolenfehler
- Tastaturbedienung der Navigation
- Vollständiger Durchlauf Start → Kategorie → Produkt → Warenkorb → Kasse

---

## 9. Deployment

**Netlify-Projekt:** `matten` → **https://matten.netlify.app**
Verknüpft mit `https://github.com/LukasSehorz/Matten.de`, Branch `main`. Ein Push löst
den Build aus.

**Beim Build** läuft `node bridge-demo/build-katalog.mjs` und erzeugt den Katalog als
statische Datei (dauert ~190 s, ~390 Anfragen an matten.de). Der Katalog ist damit ein
Standbild vom Deploy — Preise, Warenkorb und Bestellung bleiben live.

**Auf Netlify läuft die Sitzung über ein Cookie** statt über Serverspeicher, weil jede
Anfrage in einer eigenen Instanz landen kann.

⚠️ **Die Seite ist öffentlich erreichbar und kann echte Bestellungen im Livesystem auslösen.**
Zum Abschalten: Umgebungsvariable `BESTELLUNG_GESPERRT=1` in den Netlify-Einstellungen.

---

## 10. Offene Aufgaben

### 10.1 Blockiert — wartet auf den Code von Melting Mind

- **Die Excel-Formel in matten.de einbauen.** Ohne Quellcode nicht möglich.
  `STAMMDATEN.md` ist die weitergabefertige Unterlage: 16 Felder, die in den
  Artikelstammdaten ergänzt werden müssen, mit Excel-Zellbezug und Beispielwerten.
- **Artikelstammdaten pflegen** — solange sie fehlen, arbeitet das Frontend mit
  gekennzeichneten Vorgabewerten (Colortype, EK/qm, TZ, Farbwerte, Steuersatz bei
  Anfrageartikeln). Alle stehen in **einem** Block in `seite-produkt.js` und werden auf der
  Seite im Reiter „Artikeldaten" offen ausgewiesen.

### 10.2 Mit dem Kunden zu klären

| Frage | Warum wichtig |
|---|---|
| **Mindestmaß 30 cm (Excel) gegen Mindest X = 40 (Stammdaten)** | Widerspruch. Gerechnet wird derzeit mit 30. |
| Greift der 25-%-Zuschlag wirklich nicht, wenn nur *eine* Seite Standardmaß hat? | 200 × 199 cm ohne, 199 × 199 cm mit Zuschlag |
| Schließen sich die beiden Sonderformen aus? | Beide gesetzt = × 1,95 |
| Wofür ist `W5` = 0,95 „one-color"? | Keine Formel greift darauf zu |
| Ist der `optionenpreis`-Widerspruch ein Fehler? | Rund 95 € Differenz je JetPrint-Artikel |
| Verhalten bei Colortype außerhalb 1–3 | Ergäbe Preis 0 |
| Mindest-/Höchstmenge | Die Mappe kennt keine |
| TZ global oder je Artikel? | |
| Zuschläge für Aussparungen, Rundungen, Schrägen | In der Mappe beschriftet, fließen nicht ein |
| **Termin für die Startseite** | Er hat ihn ausdrücklich angeboten |

### 10.3 Vor einem echten Livegang

- **Rechtstexte anwaltlich prüfen.** AGB, Datenschutz und Widerruf sind übernommene
  Platzhalter mit toten Links und Tippfehlern des Originals. Jede Seite trägt einen
  Warnblock. Das ist der häufigste Abmahngrund bei Shops.
- **URL-Struktur erhalten.** matten.de hat 35 Jahre Google-Historie. Ohne 301-Weiterleitungen
  bricht die Sichtbarkeit ein — der teuerste denkbare Fehler.
- **Netto/Brutto vereinheitlichen.** Artikelseite zeigt brutto, Warenkorb netto. Beides kommt
  so vom Altsystem.
- **Katalog automatisch aktualisieren** (nächtlicher Build).
- **Auf echten Geräten durchklicken.**
- Die 180 Artikel ohne Preis sinnvoll darstellen.

### 10.4 Wartbarkeit (ohne Auswirkung für Besucher)

- `net-api.js` wird nur von drei Seiten geladen; fünf Seiten haben eigene Hilfsfunktionen
  und je eine eigene `esc()`-Kopie.
- Zwei Parameternamen für Infoseiten nebeneinander: `?seite=` und `?s=`.

---

## 11. Wie ein Go-live technisch aussehen würde

**Wichtig:** Schaltet man matten.de ab, ist der neue Shop tot. Er ist eine Fassade —
Produktdaten, Preise, Warenkörbe, Bestellungen und Bilder liegen alle im Altsystem.

**Der Weg ohne jede Änderung bei Melting Mind:**

```
matten.de (DNS)  →  Netlify (neues Frontend)
                       ↓  Brücke ruft 195.226.185.65 mit Host: matten.de
                    Altsystem — unverändert
```

Getestet: Man erreicht das Altsystem über seine IP, wenn man den Host-Namen mitschickt —
HTTP 200, gültiges Zertifikat, Preis-Schnittstelle funktioniert. Melting Mind müsste dafür
nichts tun.

**Reihenfolge:**
1. Auf `neu.matten.de` proben — der Livebetrieb läuft unberührt weiter
2. URL-Weiterleitungen aufbauen und testen
3. A-Record umstellen. **MX-Einträge nicht anfassen.**
4. Zurückschalten ist jederzeit möglich (A-Record zurück auf 195.226.185.65)

**Restrisiko:** Ändert Melting Mind ein Layout, bricht das HTML-Auslesen. Es gibt einen
Diagnose-Endpunkt (`/api/katalog/diagnose`), der meldet, wie viele Produkte sauber gelesen
werden — den sollte man täglich prüfen lassen.

**Empfehlung:** Erst Code und Datenbank sichern, dann umziehen, dann live gehen. In dieser
Reihenfolge ist jeder Schritt umkehrbar.

---

## 12. Nützliche Befehle

```bash
# Server starten
cd "Frontend/bridge-demo" && node server.mjs

# Preisformel prüfen
node pruefe-preisformel.mjs        # 61/61
node pruefe-stammdaten.mjs         # 62/62

# Warenkorb leeren (nach Tests immer)
curl -X POST http://localhost:8787/api/cart/clear \
     -H "Content-Type: application/json" \
     -H "Sec-Fetch-Site: same-origin" -d '{}'

# Katalog neu bauen (für Netlify)
node build-katalog.mjs
```

**Regeln für Tests am Livesystem:**
- Warenkorb-Operationen sind folgenlos — sie erzeugen nur eine Sitzung, nichts landet im Admin.
- **Eine abgeschlossene Bestellung erzeugt einen echten Auftrag** in der Liste des Verkäufers.
  Bei Vorkasse und Rechnung fließt kein Geld, aber der Datensatz muss danach gelöscht werden.
- PayPal und Kreditkarte niemals auslösen.

---

## 13. Weiterführende Dokumente im Projekt

| Datei | Inhalt |
|---|---|
| `Frontend/bridge-demo/START.md` | Wie man die Brücke startet und was sie tut |
| `Frontend/bridge-demo/ANBINDUNG.md` | Welche Seite welchen Endpunkt nutzt |
| `Frontend/bridge-demo/KATALOG.md` | Struktur von matten.de, Katalog-Endpunkte, Grenzen des HTML-Auslesens |
| `Frontend/bridge-demo/PREISFORMEL.md` | Formel in Prosa, offene Fragen |
| `Frontend/bridge-demo/STAMMDATEN.md` | **Für Melting Mind:** die 16 zu ergänzenden Felder |
| `Frontend/bridge-demo/DEPLOY.md` | Netlify-Aufbau, Build, Grenzen |
| `Frontend/bridge-demo/spec/MATTEN-NET-SPEC.md` | Vollständige Erfassung von matten.net (~1800 Zeilen) |
| `Frontend/bridge-demo/spec/struktur.json` | Dasselbe maschinenlesbar |
