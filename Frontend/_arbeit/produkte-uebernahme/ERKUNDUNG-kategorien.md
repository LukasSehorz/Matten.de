# Erkundung: Kategorien im Altsystem matten.de

Stand 03.10.2026, gemessen gegen das lokale Altsystem (localhost:8080) und die Brücke (localhost:8787). Nichts geändert.

## 1. Wie der Name ermittelt wird

* `kategorien` enthält nur `id`, `urlkey`, `parent_id`, `status`, `sortierung` (plus `artikelanzahl` als Zwischenspeicher, `infoseiten_id` u. a.).
* Der Name steht in `texte` mit `namespace='kategorien'`, `id=<kategorien.id>`, `code='titel'`, `lang='de'`.
  `Kategorie::getName()` -> `KategorieTextComponent::getName()` liefert `strip_tags(getText('titel', $sprache))`
  (`Backup/.../master/php/Plugins/Katalog/KategorieTextComponent.php`).
* Weitere Textcodes je Kategorie (de/en/id): `langtitel`, `meta_title`, `meta_description`, `meta_keywords`, `text`, `menu_html` (nur 22 Kategorien).
  `langtitel` ist ein SEO-Titel mit Schlagwortkette, nicht der Anzeigename.
* Der **URL-Pfad** ist `/<urlkey der Eltern>/<urlkey>`. `urlkey` ist nur zusammen mit `parent_id` eindeutig (Schlüssel `urlkey_2`). Beispiel: `fussmatten` gibt es zweimal (id 3 oberste, id 23 darunter -> `/fussmatten/fussmatten`).
* IDs 13, 20, 28, 32 fehlen (gelöscht). Insgesamt 29 Zeilen.
* Sprachen: de, en, id (alle 29 Kategorien in allen drei).
* Die Artikel-Zuordnung steht in `artikel_kategorien` (artikel_id, kategorien_id), mehrfach möglich. Zusätzlich hat `artikel.kategorien_id` eine "Hauptkategorie" (immer auch in `artikel_kategorien` enthalten, 0 Abweichungen). Bei 1 aktivem Artikel ist sie 0.

## 2. Baum (id, urlkey, Name de, Status, aktive Artikel direkt zugeordnet)

Reihenfolge = `sortierung`. "(aus)" = deaktiviert. Zahlen sind aktive Artikel, die in genau dieser Kategorie stehen (Eltern zählen die Artikel der Kinder NICHT mit).

```
was-ist-neu (14) "Artikelsuche" ............................ 1
  neue-artikel (15) "OS-Physio REHA-Matten" ................ 4
  terrazzo (10) "Terrazzo- Stein-Wannen, Waschbecken" ...... 2
fussmatten (3) "Fussmatten" ................................. 0
  fussmatten (23) "Einfarbige und Logo Fußmatten" ......... 47
  standard-schmutzfangmatten (1) "Baumwollmatten, Nylon-Fussmatten" 44
  matten_fuer_aussenbereiche (21) "Matten für Außenbereiche" 40
  shop-kis-keep_it_simple (24) "kis-Matten für Hund, Katz & Haus" (aus) 0   [31 inaktive Artikel]
  kis_keep_it_simple (25) "Matten für Haus und Tier" (aus) .. 0
logomatten (2) "Logomatten" ................................ 90
  sicherheits_symbol_matten (17) "Sicherheits-und Symbol-Matten" 56
  os-physio-rehab-matten (16) "OS-Physio REHAB Trainings-Matten" 16
  werbematten-dekomatten (4) "Werbematten - Dekomatten" ... 9
  welcome-holzdesign (30) "Art-Designs Welcome-Holzdesigns" 0
  wunschdesign-matten (22) "Wunschdesign-Matten" ......... 16
  matten_fuer_haus_und_heim (12) "Matten für Haus und Heim" 40
  bierbankmatten (29) "Biergartenbank-Matten" ............. 33
kokosmatten (9) "Kokosmatten" ............................... 12
home (18) "Home" ............................................ 22
  logomatten-menue (33) "Logomatten-Menue" ................ 0
aluminium_profilmatten (6) "Aluminium-Matten" ............. 82
  rahmen_und_zubehoer (7) "Aluminiumrahmen, Schmutzfangmatten, Messingrahmen, Edelstahlrahmen, Zubehör" 56
gummi_und_kunststoffmatten (5) "Gummi-/Kunststoffmatten" . 51
  bodenschutzmatten (31) "Bodenschutzmatten" ............. 2
miet-mattenservice (11) "Miet-Mattenservice" ............. 2
  service_miet-mattenservice (19) "Miet-Fußmatten" ......... 5
  reinigungsprodukte (8) "Teppich-Reinigungsprodukte" ... 2
schnaeppchen (26) "Schnaeppchen" ........................... 4
(ohne Namen) (27) urlkey leer, (aus) ........................ 0   [1 inaktiver Artikel]
```

Oberste Ebene: 10 Zeilen (9 aktiv + id 27 aus). Nur zwei Ebenen, keine tieferen.
Status: 26 aktiviert, 3 deaktiviert (24, 25, 27).

## 3. Zahlen je Kategorie

| id | urlkey | Name (de) | Eltern | Status | aktive Artikel | inaktive Artikel | Zwischenspeicher `artikelanzahl` |
|---|---|---|---|---|---|---|---|
| 1 | standard-schmutzfangmatten | Baumwollmatten, Nylon-Fussmatten | 3 | akt | 44 | 59 | 44 |
| 2 | logomatten | Logomatten | 0 | akt | 90 | 18 | 90 |
| 3 | fussmatten | Fussmatten | 0 | akt | 0 | 0 | 0 |
| 4 | werbematten-dekomatten | Werbematten - Dekomatten | 2 | akt | 9 | 3 | 9 |
| 5 | gummi_und_kunststoffmatten | Gummi-/Kunststoffmatten | 0 | akt | 51 | 11 | 51 |
| 6 | aluminium_profilmatten | Aluminium-Matten | 0 | akt | 82 | 14 | 82 |
| 7 | rahmen_und_zubehoer | Aluminiumrahmen, Schmutzfangmatten, Messingrahmen, Edelstahlrahmen, Zubehör | 6 | akt | 56 | 9 | 56 |
| 8 | reinigungsprodukte | Teppich-Reinigungsprodukte | 11 | akt | 2 | 0 | 2 |
| 9 | kokosmatten | Kokosmatten | 0 | akt | 12 | 21 | 12 |
| 10 | terrazzo | Terrazzo- Stein-Wannen, Waschbecken | 14 | akt | 2 | 22 | 2 |
| 11 | miet-mattenservice | Miet-Mattenservice | 0 | akt | 2 | 0 | 2 |
| 12 | matten_fuer_haus_und_heim | Matten für Haus und Heim | 2 | akt | 40 | 8 | 40 |
| 14 | was-ist-neu | Artikelsuche | 0 | akt | 1 | 0 | 1 |
| 15 | neue-artikel | OS-Physio REHA-Matten | 14 | akt | 4 | 0 | 4 |
| 16 | os-physio-rehab-matten | OS-Physio REHAB Trainings-Matten | 2 | akt | 16 | 4 | 16 |
| 17 | sicherheits_symbol_matten | Sicherheits-und Symbol-Matten | 2 | akt | 56 | 5 | 56 |
| 18 | home | Home | 0 | akt | 22 | 11 | 22 |
| 19 | service_miet-mattenservice | Miet-Fußmatten | 11 | akt | 5 | 0 | 5 |
| 21 | matten_fuer_aussenbereiche | Matten für Außenbereiche | 3 | akt | 40 | 9 | 40 |
| 22 | wunschdesign-matten | Wunschdesign-Matten | 2 | akt | 16 | 4 | 16 |
| 23 | fussmatten | Einfarbige und Logo Fußmatten | 3 | akt | 47 | 33 | 47 |
| 24 | shop-kis-keep_it_simple | kis-Matten für Hund, Katz & Haus | 3 | **aus** | 0 | 31 | 0 |
| 25 | kis_keep_it_simple | Matten für Haus und Tier | 3 | **aus** | 0 | 0 | 0 |
| 26 | schnaeppchen | Schnaeppchen | 0 | akt | 4 | 5 | 4 |
| 27 | (leer) | (leer) | 0 | **aus** | 0 | 1 | 0 |
| 29 | bierbankmatten | Biergartenbank-Matten | 2 | akt | 33 | 1 | 33 |
| 30 | welcome-holzdesign | Art-Designs Welcome-Holzdesigns | 2 | akt | 0 | 0 | 0 |
| 31 | bodenschutzmatten | Bodenschutzmatten | 5 | akt | 2 | 15 | 2 |
| 33 | logomatten-menue | Logomatten-Menue | 18 | akt | 0 | 0 | 0 |

Der Zwischenspeicher `artikelanzahl` stimmt in allen 29 Zeilen mit der Zählung der aktiven Artikel überein.

**Mehrfachzuordnung:** Summe der Zeilen "aktive Artikel" = **636 Zuordnungen** für **384 verschiedene aktive Artikel**. 217 Artikel stehen in mehr als einer Kategorie. Die Summe darf also nicht als Artikelzahl gelesen werden.

**Artikel gesamt:** 580 (385 aktiviert, 195 deaktiviert). Von den 385 aktiven hat **genau einer keine Kategorie**: id 794, Artikelnummer "Offenlegung" (vermutlich Rechtstext-Artikel, nicht für den Shop). Der Rest, 384, hat mindestens eine.
Kein aktiver Artikel hängt in einer deaktivierten Kategorie (0). Die 31 Artikel in id 24 sind alle inaktiv.

**Kategorie "home" (18):** 22 aktive Artikel, davon **10 nur dort** (in keiner anderen Kategorie). Sie ist eine Sammel-/Startseiten-Kategorie, hat aber eine Pfadsegment-Rolle: Artikel-Pfade der Brücke lauten teils `/home/<artikel>` (z. B. `/home/diplomat-original`).

## 4. Abweichungen zum neuen Frontend

`window.NET.kategorien` in `daten.js` hat 27 Einträge. Sie sind **keine Abbildung des Altsystembaums**, sondern die Gliederung von matten.net: ein Feld `gruppe` (Fussmatten, Logomatten, OS-REHA-Physio-Matten, Kokosmatten, Aluminium-Matten, Gummimatten, Outdoor-Matten, Mietmatten, Was ist neu) und darunter einzelne Produktlinien. Das Neue ist also flach (Gruppe + Linie, Schlüssel `slug` ohne Eltern-Pfad), das Alte ein zweistufiger Baum mit URL-Pfad. Nur 13 der 27 haben im Frontend überhaupt Produkte, 14 sind leer.

Grobe Zuordnung (inhaltlich, nicht 1:1; Produktlinien des neuen Frontends sind im Altsystem überwiegend **Artikel**, keine Kategorien):

| neu (slug / Name) | gibt es im Altsystem als Kategorie? | nächstliegende Altkategorie |
|---|---|---|
| was-ist-neu "Was ist neu" | ja, aber anders benannt | `was-ist-neu` (14), Altname "Artikelsuche" |
| waschbecken "Waschbecken" (Gruppe Was ist neu) | ja, anders | `terrazzo` (10) "Terrazzo- Stein-Wannen, Waschbecken", Kind von was-ist-neu |
| kokos-farbig, kokos-naturfarbig, kokos-logomatte | nein, nur eine Kategorie | alle in `kokosmatten` (9) |
| os-rehab-physio-matten und die 8 Einzellinien os-y-matte-..., os-rehab-basis/bahn/stern/gitter/5-punkt/quadrat-matte | nein, nur eine Kategorie | `os-physio-rehab-matten` (16 aktiv, Kind von logomatten) und `neue-artikel` (4, Kind von was-ist-neu, Altname ebenfalls "OS-Physio REHA-Matten") |
| diplomat, marschall | nein, sind Artikel/Linien | `aluminium_profilmatten` (82) |
| cushion-coil, scraper, struktura | nein | `gummi_und_kunststoffmatten` (51) |
| turf | nein | vermutlich `matten_fuer_aussenbereiche` (40) |
| iron-horse-mietmatten | nein | `miet-mattenservice` (2) / `service_miet-mattenservice` "Miet-Fußmatten" (5) |
| jetprint-einfarbig, ironhorse, ironhorse-xl | nein | `fussmatten/fussmatten` (47) bzw. `standard-schmutzfangmatten` (44) |
| designmatten, jet-print-light, katzen-willk, jetprint-design | nein | `logomatten` (90) u. Kinder, z. B. `wunschdesign-matten`, `matten_fuer_haus_und_heim` |

**Im Altsystem vorhanden, im neuen Frontend ohne eigene Entsprechung:**
`standard-schmutzfangmatten` (44 aktive Artikel), `matten_fuer_aussenbereiche` (40), `matten_fuer_haus_und_heim` (40), `bierbankmatten` (33), `sicherheits_symbol_matten` (56), `werbematten-dekomatten` (9), `wunschdesign-matten` (16), `bodenschutzmatten` (2), `rahmen_und_zubehoer` (56, Zubehör/Rahmen), `reinigungsprodukte` (2), `schnaeppchen` (4), `welcome-holzdesign` (0), `home` (22, davon 10 nur dort).
Die Altkategorien `logomatten` (90 direkt zugeordnet) und `aluminium_profilmatten` (82) sind im Neuen nur als Gruppenüberschrift vorhanden.

**Im neuen Frontend, aber nicht im Altsystem als Kategorie:** alle Produktlinien mit Eigennamen (JetPrint, IronHorse, IronHorse XL, Katzen Willk, Struktura, Scraper, Cushion Coil, Turf, MARSCHALL, Diplomat, die 8 OS-REHAB-Linien, Kokos farbig/naturfarbig/Logomatte).

**Anders benannt:** "Was ist neu" <-> "Artikelsuche" (14); "OS-REHA-Physio-Matten" (Gruppe) <-> "OS-Physio REHA-Matten" (15, unter Was ist neu) und "OS-Physio REHAB Trainings-Matten" (16, unter Logomatten): im Altsystem zwei verschiedene Kategorien mit ähnlichem Namen an verschiedenen Stellen. "Mietmatten" <-> "Miet-Mattenservice"/"Miet-Fußmatten". "Gummimatten" <-> "Gummi-/Kunststoffmatten". "Outdoor-Matten" <-> "Matten für Außenbereiche". "Aluminium-Matten" gleich.

**Folgerung:** Eine Übernahme aller Altartikel kann die 27 Frontend-Kategorien nicht als Zielstruktur behalten, wenn die Daten aus dem Altsystem kommen sollen. Entweder die Altstruktur wird übernommen, oder es braucht eine Zuordnungstabelle (Artikel -> neue Linie), die von Hand gepflegt werden müsste. Das ist eine Entscheidung für Lukas / Herrn Fuchsius.

## 5. Was `GET /api/katalog` liefert

* `ok:true`, `sprache:de`, `anzahlKategorien: 24`, `anzahlProdukteGelistet: 612`, Quelle: Hauptnavigation und maschinell erzeugtes Untermenü der Startseite des Altsystems (die Brücke liest HTML, nicht die DB). Baum: 8 oberste Ebenen, 16 Unterkategorien, je Eintrag `schluessel`, `name`, `pfad`, `ebene`, `anzahlProdukte`, `unterkategorien`.
* Namen und Pfade stimmen mit `titel` de und `urlkey` überein (Whitespace getrimmt).
* **Deckungsgleich mit der DB:** alle 24 aktiven Kategorien (ohne home und logomatten-menue) mit dem richtigen Elternteil und Zahlen. Auch die Eltern-Kind-Beziehung von `terrazzo`/`neue-artikel` unter `was-ist-neu` stimmt. 612 = 636 - 22 (home) - 2 (siehe unten). Deaktivierte Kategorien (24, 25, 27) fehlen zu Recht.

**Was fehlt oder abweicht:**
1. **`home` (18) und `logomatten-menue` (33) fehlen im Baum.** home enthält 22 aktive Artikel, 10 davon nur dort. Die Suche der Brücke (`/api/suche?alle=1`) meldet 384 Treffer, passend zur DB (384 mit Kategorie), also gehen diese Artikel nicht verloren, sie liegen nur nicht in einer Kategorie des Baums. Teils lauten die Pfade `/home/...`.
2. **`aluminium_profilmatten`: Brücke 80, DB 82.** Per Gegenprüfung der Artikelnummern fehlen in der Kategorieliste der Brücke: `Shop-Alu-Profil` (id 178, steht zusätzlich in home), `cfl-s1` (397) und `9999999`/`sondervereinbarung` (658). Zwei davon (397, 658) sind per Suche auffindbar, bei `Shop-Alu-Profil` habe ich keinen Treffer gefunden. Genaue Ursache nicht geklärt (3 vermisste Einträge gegenüber nur 2 Differenz, vermutlich weil die Brücke zwei Alu-Einträge doppelt zählt oder zusammenfasst). Weiter prüfen, bevor man sich auf die Brückenzahl verlässt.
3. **Doppelte Pfade:** Die Suche liefert 384 Zeilen, aber nur 375 verschiedene `pfad`-Werte, dazu einmal `Logomatten` mit großem L (3 Treffer). Pfade sind also nicht als Schlüssel sicher.
4. **Artikelnamen:** In der Diagnose haben einige Artikel ("-a"-Sondermaß-Geschwister) keinen Namen auf der Detailseite; und manche haben in der Kategorieliste einen Rohnamen (z. B. `menu-diplomat-original`).
5. Die Brücke nennt **keine IDs, keinen Status und keinen Sortierwert** der Kategorien. Die Reihenfolge entspricht dem Menü (nicht gesondert gegen `sortierung` geprüft).
6. `/api/katalog/diagnose` (Ampel grün) nennt "kategorienOhneProdukte": `/fussmatten`, `/logomatten/welcome-holzdesign`.

## Kurzfassung für den Entscheid
* Zweistufiger Baum, 29 Kategorien (26 aktiv), Namen aus `texte.titel` (de).
* Artikel sind mehrfach eingeordnet: 636 Zuordnungen für 384 Artikel.
* Das neue Frontend hat eine andere, flache Gliederung nach Produktlinien. Die Struktur passt nicht 1:1.
