# Zuordnung matten.net ↔ matten.de

**Stand:** 31.08.2026 · Reine Leseauswertung, keine Schreibzugriffe.

Dieses Dokument stellt den unfertigen Katalog der Modernisierung **matten.net**
(27 Kategorien, 19 Produkte) dem produktiven Altsystem **matten.de**
(24 Kategorien, 375 Artikel) gegenüber.

---

## 1. Welche Datenquellen genutzt wurden

### Genutzt und beantwortet

| Quelle | Was sie lieferte |
|---|---|
| `http://localhost:8788/api/katalog` | Kategoriebaum: 8 Ober- + 16 Unterkategorien = 24; 612 Produktnennungen (Mehrfachlistung) |
| `http://localhost:8788/shop/assets/js/catalog.js` | `window.CATALOG` mit 365 Produkten, je mit Feld `artikelnummer` und Kategoriezuordnung |
| `http://localhost:8788/api/suche?alle=1` | 384 gemeldete Treffer; über Blätterung (200 + 184) **375 eindeutige Produktpfade** |
| `http://localhost:8788/api/suche?q=…` | Volltextsuche des Altsystems über Namen **und** Beschreibungen — der Schlüssel zu den Namenszuordnungen |
| `http://localhost:8788/api/produkt?pfad=…` | Detailseiten mit `artikelnummer`, interner `artikelId`, Beschreibung |
| `http://localhost:8788/api/katalog/diagnose` | Ampel grün, 384 Artikel gemeldet, 25 stichprobenartig geprüft |
| lokal: `categories.json`, `products-detail.json`, `nav.json` | matten.net-Seite des Vergleichs |

Alle Endpunkte haben geantwortet. Keiner musste durch einen anderen ersetzt werden.
Der Server lief wie angekündigt auf **Port 8788**.

### Nicht nutzbar

- Das Feld `artNr` in der lokalen `products-detail.json` ist bei allen 19 matten.net-Produkten **leer**.
  Die Artikelnummern stammen deshalb ausschließlich aus der in der Aufgabe mitgelieferten
  Debug-Preistabelle.
- Eine auslesbare **Nummern-Synonymtabelle** von matten.de gibt es nicht (siehe Abschnitt 5).

---

## 2. Der zentrale Befund vorweg: zwei getrennte Nummernkreise

matten.de führt seine Artikelnummer als **letztes Segment der Produkt-URL**
(`/fussmatten/standard-schmutzfangmatten/6300000` → `6300000`). Von 375 Artikeln
haben 161 eine mit einer Ziffer beginnende Nummer; die übrigen 214 tragen sprechende
Schlüssel wie `kokosmatte-natur-kauf` oder `mietmatten`. Daneben existiert eine rein
interne `artikelId` (z. B. 459), die mit matten.net nichts zu tun hat.

Die auf matten.de tatsächlich vergebenen numerischen Basen liegen in den Bereichen
`50xx–55xx`, `61xxxxx`, `63xxxxx`, `64xxxxx`, `670xxx`, `69xxxxx`.

**Die matten.net-Nummernkreise `4711xxx`, `6027xxx`, `6920xxx`, `6390xxx` sowie `652601`
existieren auf matten.de an keiner einzigen Stelle** — weder als Artikelnummer noch im
Volltext. Genau **eine** der 19 Nummern stimmt in der Basis überein: `6300000N` → `6300000`.

Konsequenz: **kein einziges Produkt erreicht die Stufe `sicher`.** Wer eine
Nummernbrücke zwischen den Systemen braucht, muss sie neu aufbauen — sie existiert nicht.

### Ein zweites, unabhängiges Signal

Die Suche des Altsystems löst *bekannte* interne Nummern per **HTTP-302** auf eine
Zielseite auf. Kontrollversuche mit erfundenen Nachbarnummern (`6920000`, `6920009`,
`6027009`, `9999999`) lieferten je 0 Treffer und keinen Redirect — der Resolver ist
also trennscharf und die positiven Treffer sind belastbar:

| Abgefragte net-Nummer | Antwort von matten.de | Bedeutung |
|---|---|---|
| `6920002` | 302 → `/home/info-kokosmatten` | Nummer bekannt, aufgelöst auf die Kokos-Landingpage |
| `6300202` | 302 → `/home/info-designmatten` | Nummer bekannt, aufgelöst auf die Designmatten-Landingpage |
| `6920003` | 2 Treffer: `beflockte_kokosmatte-a`, `info-kokosmatten` | Nummer bekannt, auf **Artikelebene** aufgelöst |
| `6920001`, `6027001/3/4`, `4711000/1/3`, `6320011`, `6301000`, `6300001`, `6390202`, `652601`, `640001211` | 0 Treffer | unbekannt |

---

## 3. Kategorie-Zuordnung (27 matten.net-Kategorien)

Für Kategorien ist die Stufe `sicher` grundsätzlich **nicht erreichbar** — die beiden
Systeme teilen keinen gemeinsamen Kategorieschlüssel. `wahrscheinlich` heißt hier:
Name praktisch deckungsgleich **oder** der gesamte Produktinhalt der matten.net-Kategorie
liegt auf matten.de eindeutig in genau dieser Kategorie.

| net-Slug | net-Name | net-Gruppe | matten.de-Kategorie | Sicherheit | Begründung (Kurzform) |
|---|---|---|---|---|---|
| `jetprint-einfarbig` | JetPrint-einfarbig | Fussmatten | `fussmatten/fussmatten` — Einfarbige und Logo Fußmatten | wahrscheinlich | Beide net-Produkte haben dort ihr Gegenstück (6300000, `jetprint_matten-light-einfarbig`); Name deckt „einfarbig" |
| `ironhorse` | IronHorse | Fussmatten | `fussmatten/standard-schmutzfangmatten` — Baumwollmatten, Nylon-Fussmatten | **unsicher** | Name passt gar nicht; nur inhaltlich: 64000121/122/161 liegen dort. Aber die Mietmatte der net-Kategorie steht auf matten.de in einer ganz anderen Oberkategorie |
| `ironhorse-xl` | IronHorse XL | Fussmatten | — | **keine** | Auf matten.de nur der Einzelartikel 64000161 „Iron-Horse XL"; net-Kategorie leer |
| `designmatten` | Designmatten | Logomatten | `logomatten/wunschdesign-matten` — Wunschdesign-Matten | wahrscheinlich | Velour + light + JetPrint-Logomatte liegen dort. Ausnahme: „Hinweismatten" gehört auf matten.de zu `sicherheits_symbol_matten` |
| `jet-print-light` | Jet Print light | Logomatten | — | **keine** | Auf matten.de keine Kategorie, nur zwei Einzelartikel |
| `katzen-willk` | Katzen Willk | Logomatten | `logomatten/matten_fuer_haus_und_heim` | **unsicher** | Reine Themenvermutung; net-Kategorie leer, kein Inhalt zum Abgleich. Passender Einzelartikel: 6303103 „Art-Design, Kätzchengruppe" |
| `jetprint-design` | JetPrint-Design | Logomatten | `logomatten/wunschdesign-matten` | **unsicher** | Geraten. Auf matten.de ~30 verstreute `jetprint-designs-*`-Artikel über drei Unterkategorien, keine eigene Kategorie |
| `os-rehab-physio-matten` | OS-REHAB-Physio-Matten | OS-REHA-Physio | `logomatten/os-physio-rehab-matten` — OS-Physio REHAB Trainings-Matten | wahrscheinlich | Name praktisch identisch; alle drei net-Produkte haben dort ihr Gegenstück |
| `os-y-matte-wide-balance` | OS-Y-Matte, Wide Balance | OS-REHA-Physio | `logomatten/os-physio-rehab-matten` | **unsicher** | Strukturbruch: auf matten.de nur Artikel 6320302 |
| `os-rehab-basis-matte` | OS-REHAB Basis-Matte | OS-REHA-Physio | `logomatten/os-physio-rehab-matten` | **unsicher** | Strukturbruch: auf matten.de nur Artikel 6320308 |
| `os-rehab-bahnmatte` | OS-REHAB-Bahnmatte | OS-REHA-Physio | `was-ist-neu/neue-artikel` | **unsicher** | Strukturbruch: nur Artikel 6320309, und der liegt in der Neuheiten-Kategorie |
| `os-rehab-stern-matte` | OS-REHAB-Stern-Matte | OS-REHA-Physio | `logomatten/os-physio-rehab-matten` | **unsicher** | Strukturbruch: nur Artikel 6320304 |
| `os-rehab-gitter-matte` | OS-REHAB-Gitter-Matte | OS-REHA-Physio | `logomatten/os-physio-rehab-matten` | **unsicher** | Strukturbruch: nur Artikel 6320306 |
| `os-rehab-5-punkt-matte` | OS-REHAB-5-Punkt-Matte | OS-REHA-Physio | `logomatten/os-physio-rehab-matten` | **unsicher** | Strukturbruch: nur Artikel 6320307-5punkt |
| `os-rehab-quadrat-matte` | OS-REHAB Quadrat-Matte | OS-REHA-Physio | `was-ist-neu/neue-artikel` | **unsicher** | Strukturbruch: nur Artikel 6320301-quadrat (dort gelistet, kanonisch unter os-physio-rehab-matten) |
| `kokos-farbig` | Kokos Farbig | Kokosmatten | `kokosmatten` — Kokosmatten | wahrscheinlich | matten.de hat genau **eine** Kokos-Kategorie; Artikel `kokosmatte-farbig-k` |
| `kokos-naturfarbig` | Kokos naturfarbig | Kokosmatten | `kokosmatten` — Kokosmatten | wahrscheinlich | Artikel `kokosmatte-natur-kauf`; keine eigene de-Unterkategorie |
| `kokos-logomatte` | Kokos-Logomatte | Kokosmatten | `kokosmatten` — Kokosmatten | wahrscheinlich | Artikel `beflockte_kokosmatte-a` |
| `marschall` | MARSCHALL | Aluminium-Matten | `aluminium_profilmatten` — Aluminium-Matten | wahrscheinlich | Gruppenname identisch. „Marschall" ist auf matten.de Produktlinie (5420, 5430, 5440), keine Kategorie |
| `diplomat` | Diplomat | Aluminium-Matten | `aluminium_profilmatten` — Aluminium-Matten | wahrscheinlich | Produktlinie statt Kategorie: 52601, 5261, 5270, 522RN-Ma-a |
| `cushion-coil` | Cushion Coil | Gummimatten | `gummi_und_kunststoffmatten` — Gummi-/Kunststoffmatten | wahrscheinlich | Artikel `cushioncoil` „CushionCoil-Matte" |
| `scraper` | Scraper | Gummimatten | `gummi_und_kunststoffmatten` | wahrscheinlich | Artikel 6900012 „Scraper-Matte" |
| `struktura` | Struktura | Gummimatten | `gummi_und_kunststoffmatten` | wahrscheinlich | **Vom Altsystem selbst aufgelöst:** Suche „Struktura" → 302 auf `s_und_s-gummiwabenmatten` |
| `turf` | Turf | Outdoor-Matten | `fussmatten/matten_fuer_aussenbereiche` — Matten für Außenbereiche | wahrscheinlich | Dort liegen sechs „K-Turf"-Outdoor-Artikel |
| `iron-horse-mietmatten` | IRON-HORSE-Mietmatten | Mietmatten | `miet-mattenservice/service_miet-mattenservice` — Miet-Fußmatten | wahrscheinlich | Artikel `mietmatten` = „Iron-Horse-Mietmattenservice" |
| `waschbecken` | Waschbecken | Was ist neu | `was-ist-neu/terrazzo` — Terrazzo- Stein-Wannen, Waschbecken | wahrscheinlich | de-Name enthält „Waschbecken" wörtlich; beide Artikel sind Waschbecken |
| `was-ist-neu` | Was ist neu | (nur Startseite) | `was-ist-neu` — Artikelsuche | wahrscheinlich | Schlüssel wörtlich identisch; Anzeigename weicht ab |

**Bilanz Kategorien:** 15 × wahrscheinlich · 10 × unsicher · 2 × keine · 0 × sicher.
25 der 27 net-Kategorien haben ein Ziel bekommen, aber nur 15 davon belastbar.

---

## 4. Produkt-Zuordnung (19 matten.net-Produkte)

| pid | net-Name | net-ArtNr | matten.de-ArtNr | matten.de-Name | de-Kategorie | Sicherheit |
|---|---|---|---|---|---|---|
| 1 | IRON-HORSE 1-farbige und melierte Schmutzfangmatten | `63000` | `64000121` | melierte Eingangsmatten, IRON-HORSE™ | `fussmatten/standard-schmutzfangmatten` | **unsicher** |
| 4 | IRON-HORSE-Mietmatte | `640001211` | `mietmatten` | Iron-Horse-Mietmattenservice | `miet-mattenservice/service_miet-mattenservice` | wahrscheinlich |
| 6 | JetPrint-Premium | `6300000N` | `6300000` | JetPrint™HD-Fussmatten, einfarbig | `fussmatten/fussmatten` | wahrscheinlich |
| 7 | JetPrint Premium 1-farbig | `6301000N` | — | — | — | **unsicher** |
| 8 | JetPrint light 1-farbig | `6300001N` | `jetprint_matten-light-einfarbig` | JetPrint™light-Matte, einfarbig | `fussmatten/fussmatten` | wahrscheinlich |
| 9 | JetPrint Matten, Design | `6320011N` | — | — | — | **unsicher** |
| 10 | Designmatten JetPrint | `4711000N` | `6300201-logomatte` | JetPrint™-Matten, in Wunschgröße, individuell gestaltet | `logomatten/wunschdesign-matten` | **unsicher** |
| 12 | OS-Quadrat-REHAB-Trainingsmatte | `6027001` | `6320301-quadrat` | RTA-Quadrat-REHAB-JetPrint-Matte mit Kunden-Design | `logomatten/os-physio-rehab-matten` | wahrscheinlich |
| 18 | Kokos, natur | `6920001N` | `kokosmatte-natur-kauf` | Kokosvelour, Naturfaser, naturfarbig | `kokosmatten` | wahrscheinlich |
| 19 | Kokos, farbig | `6920002` | `kokosmatte-farbig-k` | Kokosvelourmatten, farbig | `kokosmatten` | wahrscheinlich |
| 22 | JetPrint light Logo | `6300202N` | `jetprint_light-matten` | Jet-Print™-Light-Fussmatte, Wunschgrößen | `logomatten/wunschdesign-matten` | **unsicher** |
| 25 | IRON-HORSE-2 | `630001` | `64000122` | Eingangsmatten, meliert, IRON-HORSE™ bis 150cm | `fussmatten/standard-schmutzfangmatten` | **unsicher** |
| 26 | Kokos, Logomatten | `6920003` | `beflockte_kokosmatte-a` | Kokosmatte gestaltet, Logobeflockung | `kokosmatten` | wahrscheinlich |
| 28 | Hinweismatten | `6390202 MJPRNT` | `jetprint-designs-hinweise` | Corona-Hinweismatten und Gebotsmatten | `logomatten` | **unsicher** |
| 32 | Designmatten JetPrint-light | `4711001 MJPLIT` | `jetprint_light-matten` | Jet-Print™-Light-Fussmatte, Wunschgrößen | `logomatten/wunschdesign-matten` | **unsicher** |
| 33 | Designmatten JetPrint-Velour | `4711003N` | `6400201-velourmatte` | JetPrint™-Velourmatten, fotorealistisch | `logomatten` | wahrscheinlich |
| 34 | Aluminium-Profilmatte, Typ Diplomat R | `652601` | `52601` | Diplomat / Diplomat-Color-Edition | `aluminium_profilmatten` | **unsicher** |
| 39 | OS-Stern-REHAB-Trainingsmatte | `6027004` | `6320304` | OS-Stern-REHAB-Matte nach Kundenangaben | `logomatten/os-physio-rehab-matten` | wahrscheinlich |
| 40 | OS-5-Punkt-REHAB-Trainingsmatte-c | `6027003` | `6320307-5punkt` | 5-Punkt-REHAB-JetPrint™-Matten | `logomatten/os-physio-rehab-matten` | wahrscheinlich |

**Bilanz Produkte:** 0 × sicher · 10 × wahrscheinlich · 9 × unsicher · 0 × keine.

### Die belastbarsten Zuordnungen

- **pid 26 (Kokos, Logomatten → `beflockte_kokosmatte-a`)** — die stärkste im ganzen Abgleich:
  Die Volltextsuche von matten.de nach der net-Nummer `6920003` liefert genau diesen Artikel.
  Kontrollsuchen mit Nachbarnummern ergaben 0 Treffer. Zusätzlich stimmt der Name.
  Nicht `sicher`, weil der de-Artikel selbst keine Nummer `6920003` trägt — die
  Verknüpfung liegt nur in der Suchlogik des Altsystems.
- **pid 6 (JetPrint-Premium → `6300000`)** — einzige Basis-Nummerngleichheit (`6300000N` → `6300000`).
- **pid 12 / 39 / 40 (OS-REHAB)** — Suchen nach „Quadrat-REHAB", „Stern-REHAB", „5-Punkt-REHAB"
  liefern je genau einen Artikel plus dessen Zwilling. Eindeutig, aber rein namensbasiert.
- **pid 33 (JetPrint-Velour → `6400201-velourmatte`)** — „Velourmatten" liefert nur diesen
  einen JetPrint-Velour-Artikel.

### Die Zuordnungen mit den größten Vorbehalten

- **pid 4 — Nummernkonflikt, bewusst nicht aufgelöst.** `640001211` sieht aus wie
  `64000121` + `1`. Auf matten.de ist `64000121` aber die **melierte Eingangsmatte**,
  nicht die Mietmatte. Der Name („IRON-HORSE-Mietmatte" ↔ „Iron-Horse-Mietmattenservice")
  ist eindeutig, die Nummer widerspricht ihm. Zugeordnet wurde nach dem Namen.
- **pid 34 — verlockend, aber nicht belastbar.** `652601` enthält die de-Nummer `52601`
  („Diplomat"). Dagegen spricht: die Suche nach `652601` liefert 0 Treffer, ein
  vorangestelltes „6" tritt bei keiner anderen der 19 Nummern auf (könnte Zufall sein),
  und das Merkmal „Typ R" passt besser auf `52603` („Classic Typ R … mit Ripseinlage")
  oder `522RN-Ma-a` („Diplomat Typ 522 R Norm"). Drei Kandidaten, keiner belegt.
- **pid 6 vs. 7** und **pid 22 vs. 32** konkurrieren jeweils um denselben matten.de-Artikel.
  Eine der beiden Zuordnungen muss jeweils falsch sein; welche, ist aus Katalog- und
  Suchdaten allein nicht entscheidbar.
- **pid 25 (IRON-HORSE-2)** ist geraten. Der Name nennt kein unterscheidendes Merkmal;
  die „2" wurde als Verweis auf `64000122` gelesen. `64000161` (Iron-Horse XL) wäre
  gleichwertig.
- **pid 7 und pid 9** haben bewusst **kein** Ziel bekommen — es gab keinen Kandidaten,
  der sich von den übrigen abhob.

---

## 5. Lücken in beide Richtungen

### 5.1 Nur auf matten.de — 359 Artikel ohne Entsprechung

matten.de führt **375 eindeutige Produktpfade**. Zugeordnet wurden davon **16 eindeutige
Artikel** (19 net-Produkte, aber `jetprint_light-matten` ist doppelt vergeben und zwei
net-Produkte blieben ohne Ziel).

> **Lücke: 359 matten.de-Artikel haben auf matten.net keine Entsprechung.**

Darin enthalten sind 109 technische Zwillinge (`…-a` / `…-ang`) — die namenlosen
Sondermaß- bzw. Anfrage-Geschwister, die matten.de zu fast jedem Kaufartikel führt.
Rechnet man diese heraus, bleiben **rund 250 echte, eigenständige matten.de-Artikel**,
die auf matten.net vollständig fehlen.

**Kategorien, die auf matten.net gar nicht vorkommen:**

| matten.de-Kategorie | Name | Artikel |
|---|---|---|
| `logomatten/sicherheits_symbol_matten` | Sicherheits- und Symbol-Matten | 56 |
| `aluminium_profilmatten/rahmen_und_zubehoer` | Aluminiumrahmen, Messing-/Edelstahlrahmen, Zubehör | 56 |
| `logomatten/bierbankmatten` | Biergartenbank-Matten | 33 |
| `logomatten/werbematten-dekomatten` | Werbematten – Dekomatten | 9 |
| `schnaeppchen` | Schnäppchen | 4 |
| `gummi_und_kunststoffmatten/bodenschutzmatten` | Bodenschutzmatten | 2 |
| `miet-mattenservice/reinigungsprodukte` | Teppich-Reinigungsprodukte | 2 |
| `logomatten/welcome-holzdesign` | Art-Designs Welcome-Holzdesigns | 0 (leer auch auf matten.de) |

Hinzu kommen große Bestände in Kategorien, die zwar zugeordnet sind, auf matten.net
aber fast leer bleiben: `logomatten/matten_fuer_haus_und_heim` (40 Artikel, u. a. die
komplette „I Love München"- und „Welcome-Holzdesign"-Serie) und
`fussmatten/standard-schmutzfangmatten` (44 Artikel, u. a. die gesamte
Komfort-/Anti-Ermüdungsserie).

### 5.2 Nur auf matten.net

**Kein einziges der 19 matten.net-Produkte ist auf matten.de völlig unbekannt** — für
jedes ließ sich mindestens ein thematischer Kandidat finden, für 10 ein belastbarer.

Die eigentliche Asymmetrie liegt auf **Kategorieebene**: **18 der 27 matten.net-Kategorien
sind auf matten.de keine Kategorie**, sondern nur ein einzelner Artikel oder eine
Produktlinie:

| net-Kategorie | Was auf matten.de stattdessen existiert |
|---|---|
| `ironhorse-xl` | Artikel 64000161 |
| `jet-print-light` | Artikel `jetprint_light-matten`, `jetprint_matten-light-einfarbig` |
| `os-y-matte-wide-balance` | Artikel 6320302 |
| `os-rehab-basis-matte` | Artikel 6320308 |
| `os-rehab-bahnmatte` | Artikel 6320309 |
| `os-rehab-stern-matte` | Artikel 6320304 |
| `os-rehab-gitter-matte` | Artikel 6320306 |
| `os-rehab-5-punkt-matte` | Artikel 6320307-5punkt |
| `os-rehab-quadrat-matte` | Artikel 6320301-quadrat |
| `marschall` | Produktlinie 5420, 5430, 5440 |
| `diplomat` | Produktlinie 52601, 5261, 5270, 522RN-Ma-a |
| `cushion-coil` | Artikel `cushioncoil` |
| `scraper` | Artikel 6900012 |
| `struktura` | nur noch Suchsynonym → Redirect auf `s_und_s-gummiwabenmatten` |
| `turf` | Produktlinie „K-Turf" in `fussmatten/matten_fuer_aussenbereiche` |
| `katzen-willk` | nur Artikel 6303103 „Art-Design, Kätzchengruppe" |
| `waschbecken` | Teil von `was-ist-neu/terrazzo` |
| `iron-horse-mietmatten` | Kategorie existiert, heißt dort „Miet-Fußmatten" |

matten.net hat den Katalog also **feiner in Kategorien zerlegt und dabei viel weniger
Artikel gefüllt**: 19 Produkte gegen 375. **15 der 27 net-Kategorien sind komplett leer.**

---

## 6. Was sich nicht ermitteln ließ

1. **Ein belastbarer Artikelnummern-Abgleich für 18 der 19 Produkte.** Die
   matten.net-Nummernkreise `4711xxx`, `6027xxx`, `6920xxx`, `6390xxx` und `652601`
   kommen auf matten.de nirgends vor. Nur `6300000N` → `6300000` stimmt in der Basis.
   Deshalb steht bei **keinem** Produkt die Stufe `sicher`.
2. **Die Bedeutung der Suffixe `MJPRNT` (pid 28) und `MJPLIT` (pid 32).** Das sind
   matten.net-interne Codes; auf matten.de gibt es dafür weder ein Feld noch einen Treffer.
3. **Die interne `artikelId` von matten.de** (z. B. 459 für 6300000) ist zwar über
   `/api/produkt` abrufbar, hat aber nachweislich nichts mit den matten.net-Nummern zu tun.
4. **Die Nummern-Synonymtabelle des Altsystems.** Die 302-Redirects belegen, dass matten.de
   intern eine solche Tabelle führt. Über die vorhandenen Endpunkte ist sie **nicht
   auslesbar** — es lässt sich nur einzeln abfragen, ob eine konkrete Nummer aufgelöst wird.
   Eine vollständige Nummernbrücke wäre nur durch systematisches Ausprobieren zu gewinnen.
5. **Die Auflösung der Doppelbelegungen** pid 6 ↔ 7 und pid 22 ↔ 32. Dafür wären die
   Preis- und Attributdaten beider Systeme nötig.
6. **Die Unterkategorie `kokosmatten/rahmen_und_zubehoer`** taucht in den Produktdaten von
   `catalog.js` auf, wird von `/api/katalog` aber nicht gemeldet (dort hat `kokosmatten`
   keine Unterkategorien). Welche Sicht stimmt, blieb offen.
7. **Die genaue Artikelzahl von matten.de.** `/api/katalog/diagnose` und
   `/api/suche?alle=1` melden je 384; die Blätterung liefert 375 eindeutige Pfade;
   `catalog.js` kennt 365 („Stufe 1 von 2"). Für alle Lückenrechnungen wurden die
   **375 eindeutigen Pfade** verwendet.

---

*Maschinenlesbare Fassung: `zuordnung.json` im Scratchpad dieser Sitzung.*
