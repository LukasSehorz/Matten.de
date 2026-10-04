# Erkundung: Zuordnung der 19 Produkte auf das Altsystem

Stand 03.10.2026. Gemessen gegen die Brücke (Port 8787, Ziel: lokales Altsystem). Nichts geändert, nichts bestellt, nichts angelegt.
Quellen: `bridge-demo/bau-net-daten.mjs`, `bridge-demo/spec/struktur.json`, `public/net-neu/assets/js/daten.js`, `public/net-neu/assets/js/seite-produkt.js`, `public/net-neu/LIESMICH.md`, `_arbeit/net-neu-2026-09-10/BRIEF-FRONTEND.md`.

## 0. Wo die Felder wirklich stehen (Abweichung vom Auftragstext)

| Feld | Steht in | Anmerkung |
|---|---|---|
| `dePfad`, `deZwilling` | **nur** in `bau-net-daten.mjs` (feste Tabelle `ZUORDNUNG`, Zeilen 62-140) und daraus in `daten.js` unter `NET.zuordnung[slug]` | **Nicht** in `struktur.json`. Dort gibt es nur `zuordnungMattenDe` (Stand 31.08.2026), die ältere Recherche mit Sicherheitsstufe, aber ohne `dePfad`/`deZwilling` |
| `preisdaten` | `struktur.json` -> `produkte[].preisdaten` -> `daten.js` -> `NET.produkte[slug].preisdaten` | getrennt von der Zuordnung |
| `modus` (kauf/anfrage) | **nirgends gespeichert** | `seite-produkt.js` liest `artikel.modus` zur Laufzeit aus `GET /api/produkt`. Die Spalte unten ist deshalb live gemessen |

## 1. Tabelle der 19 Produkte

Pfade ohne Ober-Kategorie gekürzt (`/fm/ssm/` = `/fussmatten/standard-schmutzfangmatten/`, `/lm/` = `/logomatten/`, `/km/` = `/kokosmatten/`, `/orm/` = `/lm/os-physio-rehab-matten/`).
Modus = Modus des `dePfad` laut Brücke; alle Zwillinge sind `anfrage`. Preis-EK = `einkaufProQm` / Salesfactor aus `preisdaten`. Sicherheit = Stufe der ersten Recherche in `struktur.json` (`zuordnungMattenDe`); bei den mit * markierten wurde sie später von Hand überschrieben.

| pid | net-Name | dePfad | deZwilling | Modus | Preisstammdaten | Sicherheit |
|---|---|---|---|---|---|---|
| 1 | IRON-HORSE 1-farbige und melierte Schmutzfangmatten | /fm/ssm/64000121 | - | kauf | ja, 27,89 / 1,8 | unsicher (3 Kandidaten) |
| 4 | IRON-HORSE-Mietmatte | /miet-mattenservice/mietmatten | - | kauf | **nein** (EK 0) -> Live-Preis | wahrscheinlich |
| 6 | JetPrint-Premium | /fm/ssm/6300000 | /fm/ssm/6300000-a | kauf | ja, 52,67 / 1,931 | wahrscheinlich |
| 7 | JetPrint Premium 1-farbig | /fm/ssm/6300000 | /fm/ssm/6300000-a | kauf | ja, 52,67 / 1,931 | unsicher*, gleicher Artikel wie pid 6 |
| 8 | JetPrint light 1-farbig | /fussmatten/fussmatten/jetprint_matten-light-einfarbig | ...-einfarbig-a | kauf | ja, 40,85 / 1,87 | wahrscheinlich |
| 9 | JetPrint Matten, Design | /lm/6300201-logomatte | /lm/6300201-logomatte-a | kauf | ja, 54,63 / 1,931 | unsicher* (keine Nummer gefunden) |
| 10 | Designmatten JetPrint | /lm/6300201-logomatte | /lm/6300201-logomatte-a | kauf | ja, 52,67 / 1,931 | unsicher |
| 12 | OS-Quadrat-REHAB-Trainingsmatte | /orm/6320301-quadrat | - | kauf | **nein** (EK 0) -> Live-Preis | wahrscheinlich |
| 18 | Kokos, natur | /km/kokosmatte-natur-kauf | - | kauf | ja, 41,84 / 1,375 | wahrscheinlich |
| 19 | Kokos, farbig | /km/kokosmatte-farbig-k | - | kauf | ja, 53,88 / 1,375 | wahrscheinlich |
| 22 | JetPrint light Logo | /lm/jetprint_light-matten | /lm/jetprint_light-matten-a | kauf | ja, 43,39 / 1,97 | unsicher (gleicher Artikel wie pid 32) |
| 25 | IRON-HORSE-2 | /fm/ssm/64000122 | - | kauf | ja, 50,00 / 1,6 | unsicher ("geraten") |
| 26 | Kokos, Logomatten | /km/beflockte_kokosmatte-a | (ist selbst Anfrageartikel) | **anfrage** | **nein** (EK 0) -> "Preis auf Anfrage" | wahrscheinlich |
| 28 | Hinweismatten | /lm/6300201-logomatte | /lm/6300201-logomatte-a | kauf | ja, 40,85 / 1,931 | unsicher*, von Hand auf Logomatte umgehängt (Recherche hatte `jetprint-designs-hinweise`) |
| 32 | Designmatten JetPrint-light | /lm/jetprint_light-matten | /lm/jetprint_light-matten-a | kauf | ja, 38,54 / 1,931 | unsicher (gleicher Artikel wie pid 22) |
| 33 | Designmatten JetPrint-Velour | /lm/6400201-velourmatte | /lm/6400201-velourmatte-a | kauf | ja, 39,06 / 1,931 | wahrscheinlich |
| 34 | Aluminium-Profilmatte, Typ Diplomat R | /aluminium_profilmatten/52601 | /aluminium_profilmatten/52601-a | kauf | ja, 265,09 / 1,317 | unsicher (Typ-R-Merkmal passt auch auf 52603 / 522RN-Ma-a) |
| 39 | OS-Stern-REHAB-Trainingsmatte | /orm/6320304 | - | kauf | ja, 52,67 / 1,931 | wahrscheinlich |
| 40 | OS-5-Punkt-REHAB-Trainingsmatte-c | /orm/6320307-5punkt | - | kauf | **nein** (EK 0) -> Live-Preis | wahrscheinlich |

Zählung:
* **15 verschiedene Altsystem-Artikel** hinter den 19 Produkten. Vier net-Produkte sind Doppelgänger: pid 7 -> wie 6; pid 9 und 28 -> wie 10; pid 32 -> wie 22.
* **6 verschiedene Zwillinge** (8 Zeilen, wegen der Doppelgänger).
* **Modus:** 18 mal `kauf`, 1 mal `anfrage` (pid 26). Kein Preisstamm: pid 4, 12, 26, 40 (Eintrag `einkaufProQm: 0` mit Hinweis). Alle vier laufen über `GET /api/price`, das heißt über die Preisrechnung des Altsystems.
* Bei **keinem** Produkt steht in der Recherche die Stufe "sicher": matten.net und matten.de benutzen verschiedene Nummernkreise (nur `6300000N` <-> `6300000` stimmt überein).

## 2. Was ist ein "Zwilling"?

**Mit eigenen Worten:** Das Altsystem führt für viele Maßware-Artikel zwei Geschwister. Der **Kaufartikel** (`dePfad`) hat einen Preis und einen Warenkorb-Knopf, aber seine Maße sind eingeschränkt: die Breite ist eine Auswahlliste fester Bahnbreiten (60/75/85/115/150/200 cm), nur die Länge ist frei. Der **Zwilling** (`deZwilling`, Pfad endet auf `-a`) ist dasselbe Produkt als **Anfrageartikel**: Breite und Länge sind beide freie Zahlen, es gibt aber keinen Festpreis, die Position geht als Anfrage ins Team. Der Zwilling hat im Altsystem keinen eigenen Namen (`name: null`), er hängt nur über die Pfadendung am Kaufartikel.

Gemessen (Brücke, lokal):

| | Kaufartikel 6300000 | Zwilling 6300000-a |
|---|---|---|
| Modus | kauf (Artikel 459) | anfrage (Artikel 765) |
| Breite x | Auswahlfeld, nur Bahnbreiten | ebenfalls Auswahlfeld (Bahnbreiten) |
| Länge y | frei 40-700 | frei |

Beim Artikel 6300000 selbst ist auch der Zwilling auf Bahnbreiten begrenzt (Auswahlfeld, siehe LIESMICH 5.1). Bei `6300201-logomatte-a` (569), `jetprint_light-matten-a` (722), `6400201-velourmatte-a` (776) und `jetprint_matten-light-einfarbig-a` (730) sind x und y freie Zahlen.

**Die Regel "Zielartikel nach Fähigkeit"** (LIESMICH Abschnitt 2, umgesetzt in `weg(absicht)` in `seite-produkt.js`, ab Zeile 1062). Sie wird für jede Position neu aus den **Fähigkeiten des Artikels** entschieden, nicht aus einer Liste:

1. `frei = absicht === 'angebot' || !std || zuschlaege() || artikel.modus === 'anfrage'` (Zeile 1066). Ist die Größe eine Standardgröße ohne Zuschläge und der Artikel ein Kaufartikel, gilt `frei` nicht und die Position geht als **Kauf auf `dePfad`** (Zeile 1068). Der Zwilling spielt dann keine Rolle.
2. Braucht die Konfiguration freie Maße (Wunschmaß, Sonderform, Sonderfarbe, "Angebot anfordern"), prüft `weg()` der Reihe nach:
   * Zeile 1075: `if (zwilling && nimmtMasse(zwilling, b, l).ok)` -> der **Zwilling**, wenn er beide Maße exakt aufnimmt (x als Zahl in min/max oder als Auswahlfeld mit genau dieser Breite, y als Zahl in min/max, Achsentausch erlaubt). Position wird `anfrage`.
   * Zeile 1079: `nimmtMasse(artikel, b, l).ok` -> sonst der **Kaufartikel selbst**, wenn seine `masse[]`-Felder das können (Kokos, Diplomat: `flaeche[x|y]` in Millimetern).
   * Zeile 1086: sonst der **Universalartikel 569** (`UNIVERSAL`, Zeile 1017: `/logomatten/6300201-logomatte-a`, x 20-200, y 40-700), mit dem Produkt als Klartext in der ersten Kommentarzeile.
3. Wo der Zwilling herkommt: `laden()` (Zeile 1344-1345) holt `Z.dePfad` und `Z.deZwilling` aus `NET.zuordnung[slug]` über `GET /api/produkt` und legt sie in `artikel` und `zwilling` ab. Ohne Eintrag in `zuordnung` ist `zwilling` einfach `null`, `weg()` fällt auf Schritt 2 und 3.

**Warum braucht es den Zwilling?** Weil der Kaufartikel eine Wunschbreite (z. B. 90 cm) nicht aufnimmt: Das Altsystem würde still die Vorgabe (60 cm) speichern, das richtige Maß stünde nur im Kommentar. Das Frontend darf aber nach seiner eigenen Regel "Kein Maß wird jemals stillschweigend auf einen anderen Wert gesetzt" nichts verfälschen. Der Zwilling ist der eigene Artikel des Produkts, der das Maß **als Feld** trägt, also die sauberste Stelle für eine Wunschmaß-Anfrage. Ohne Zwilling bleibt als Ausweg nur der Universalartikel 569, wo das Team erst über die Kommentarzeile `ARTIKEL: ...` erfährt, welches Produkt gemeint ist.

Wichtig: Die **Entscheidung** ist generisch und liest nur `masse[]` und `modus` aus dem Altsystem. Die **Zuordnung** liefert nur den Kandidaten (welcher Pfad ist der Zwilling?).

## 3. Wie wurde die Zuordnung ermittelt?

Zweistufig, **teilautomatisch recherchiert, dann von Hand festgeschrieben**:

1. **Recherche vom 31.08.2026** (`struktur.json` -> `zuordnungMattenDe`): Ein Agent ließ über die Brücke den ganzen Altkatalog (`/api/katalog`, `/api/suche?alle=1`, `catalog.js`, Volltextsuche) laufen und verglich Artikelnummer, Name und 302-Weiterleitungen der Altsuche. Ergebnis: keine einzige Zuordnung "sicher". Die Nummernkreise sind verschieden; der Name ist das Hauptsignal; bei mehreren Kandidaten (IRON-HORSE: 64000121 / 64000122 / 64000161) wurde "die allgemeinste Variante" gewählt. Für pid 7 und 9 fand die Recherche nichts.
2. **Festschreibung am 10.09.2026** (`bau-net-daten.mjs`, Konstante `ZUORDNUNG`): Eine feste Tabelle von Hand, mit Kommentar je Zeile ("entschieden", "unsicher", "geraten"). Hier kamen die **Zwillinge** dazu und die Umhängungen (pid 7, 9, 28). In der Tabelle steht kein Code, der Pfade ableitet.
3. **Prüfung:** `node bau-net-daten.mjs --pruefen` fragt jeden Pfad einmal ab und verlangt `kaufbar: true`. Das prüft nur, ob der Pfad existiert, nicht, ob es das **richtige** Produkt ist. (Unten gemessen: `kaufbar` ist auch bei Anfrageartikeln wahr.)

Wie die Zwillinge gefunden wurden, ist **nirgends dokumentiert**. Die Regel "Pfad + `-a`" passt auf alle sechs eingetragenen, das ist die einzige erkennbare Methode. Dass sie nicht systematisch angewandt wurde, zeigt sich daran, dass für **sechs weitere** Kaufartikel der 19 Zwillinge existieren, die nicht eingetragen sind (Abschnitt 4.2).

Die Auswahl wurde also von Hand getroffen; fünf Zuordnungen tragen in `ZUORDNUNG` den Vermerk "unsicher" oder "geraten" (pid 1, 22, 25, 32, 34), vier weitere "entschieden" (pid 7, 9, 28 und die Logomatte). Mir ist keine Stelle im Projekt bekannt, an der ein Mensch (Herr Fuchsius) die Zuordnung bestätigt hat.

## 4. Die Kernfrage: ließe sich die Zuordnung automatisch bilden?

### 4.1 `dePfad`: bei direkter Übernahme entfällt die Zuordnung

Wenn das Produkt aus dem Altsystem kommt, **ist** sein Pfad der `dePfad`. Es gibt kein "Gegenstück" mehr zu finden.

| Teil der Zuordnung | Bei 385 Artikeln | Begründung |
|---|---|---|
| `dePfad` aller 15 Altsystem-Artikel | **trivial** | Pfad = eigener Pfad. Alle 15 sind in der Brücke auffindbar (Abschnitt 5) |
| die Unsicherheiten pid 1, 25, 34, 22, 32, 7, 9, 10, 28 | **verschwinden** | Sie entstanden nur, weil ein net-Name einem Alt-Namen zugeordnet werden musste |
| die 4 Doppelgänger (pid 7, 9, 28, 32) | **entfallen** | Jeder Altartikel erscheint einmal. Heißt auch: net-Marketingvarianten, die zwei Artikel sind, die im Altsystem einer sind, fallen weg |
| `modus` | **trivial** | wird schon heute live gelesen, nie gespeichert |
| Namen, Bilder, Beschreibung, Kategorie | **ändern sich** | kommen heute aus matten.net-Texten (`struktur.json`, Spec). Bei direkter Übernahme aus `/api/produkt`/`/api/katalog` und sehen anders aus als bei matten.net |
| Preisstammdaten (`preisdaten`) | **nicht trivial, aber verlagert** | siehe 4.3 |
| Zwilling | **nicht trivial** | siehe 4.2 |

### 4.2 Der Zwilling: ja, ableitbar, aber nur halb sicher

Gemessen über `GET /api/suche?alle=1` (384 Treffer, 375 verschiedene Pfade): **184 Kaufartikel, 170 Anfrageartikel, 21 ohne Modus** (Landingpages). 108 Blöcke haben keinen Namen (`variante: true`) = Zwillinge.

* **Namensregel** (Pfad + `-a`, `-ang`, `a`, `-sondermass`): findet für **95 der 184 Kaufartikel** einen Zwilling und deckt **94 der 170 Anfrageartikel** ab. Zwei Endungen reichen nicht: `-a` allein findet nur 75.
* Die 76 übrigen Anfrageartikel sind überwiegend **eigenständige Produkte ohne Kaufpartner** (Rahmen, Zubehör, Bierbankmatten-Anfrage, Kokos-Sonderanfertigung) und ein Rest von ca. 15 Zwillingen mit abweichender Benennung (z. B. `nomad-matten1`, `kokosmatte-natur-a`, `schmutzfangwanne-a`, `522rn-ko-a`), bei denen die Regel keinen Kaufartikel findet.
* **Nicht verwenden:** das Brückenfeld `gehoertZu`. Es folgt der **Reihenfolge der Liste**, nicht dem Pfad (`KATALOG.md` warnt selbst davor). Bei den sechs Zwillingen unserer 19 ist es in fünf Fällen falsch (z. B. `6300201-logomatte-a` -> `/logomatten/barmatten`). Nur `52601-a` stimmt.
* **Lücken der Handliste**, die die Regel schließen würde (Kaufartikel der 19, die einen nicht eingetragenen Zwilling haben):

| Kaufartikel | nicht eingetragener Zwilling | freie Maße |
|---|---|---|
| 64000121 (pid 1) | 64000121a | x 40-200, y 40-700, beide frei |
| 64000122 (pid 25) | 64000122a | x 40-150, y 40-700, beide frei |
| 6320304 (pid 39) | 6320304a | nur y frei (85-700), x Auswahl |
| 6320301-quadrat (pid 12) | 6320301-quadrat-ang | nur y frei, x Auswahl |
| 6320307-5punkt (pid 40) | 6320307-5punkt-ang | x 85-200, y 85-700, beide frei |
| mietmatten (pid 4) | mietmattena | keine Maßfelder |

  Ohne Eintrag fallen diese heute auf Schritt 3 (Artikel 569) zurück. Das ist kein Fehler, aber schlechter: das Team bekommt ein anderes Produkt gebucht und liest es im Kommentar.
* **Nicht herleitbar durch die Endungsregel:** Kokos natur/farbig. Ihre Kaufartikel heißen `kokosmatte-natur-kauf` und `kokosmatte-farbig-k`, die Zwillinge `kokosmatte-natur-a` und `kokosmatte-farbig-a` (anderer Stamm, Endung ersetzt statt angehängt). Sie stehen in der Liste als namenlose Blöcke, die Regel findet sie nicht. Sie werden hier auch nicht gebraucht: der Kaufartikel nimmt beide Maße frei (`flaeche[x|y]`), das löst Schritt 2 von `weg()` ohne jede Zuordnung.

### 4.3 Wofür braucht es noch eine Zuordnung, wenn das Produkt direkt aus dem Altsystem kommt?

**Zwei Dinge, beide klein:**

1. **Zwilling finden (optional, Genauigkeit).** `weg()` funktioniert auch **ohne** Zwilling: Schritt 2 (Kaufartikel nimmt Maße) und Schritt 3 (Artikel 569) tragen jede Konfiguration. Mit Zwilling wird das Wunschmaß sauberer. Eine Ableitung aus Pfad plus Endungsliste, **gegengeprüft** über `GET /api/produkt` (Zwilling muss `anfrage` sein, die Attributnamen müssen zum Kaufartikel passen, x/y müssen als Felder vorhanden sein), ist machbar. Die Gegenprüfung ist nötig, weil die Endung allein bei Ausnahmen irrt und bei 76 Anfrageartikeln keinen Partner hat.
2. **Preis.** Das ist die eigentliche Lücke: Heute rechnet das Frontend selbst mit `preisdaten` (EK, Salesfactor, Standardbreiten) aus `struktur.json`. **Diese Daten liefert die Brücke nicht**: `GET /api/produkt` hat die Schlüssel `preis` (nur Vorauswahl, brutto, "ab"), `masse`, `attribute`, aber keine Stammdaten. Die Preisformel liegt seit dem Commit `65bc09c` im Altsystem (17 Admin-Felder je Artikel, Schalter je Artikel); das Frontend kann sie über `GET /api/price` abfragen. Das ist der Weg für die 385: Preis immer vom Altsystem, `preisdaten` entfällt, wie es heute schon bei pid 4, 12, 26, 40 läuft.
   **Beobachtung dazu, nicht tiefer geprüft:** `GET /api/price` für `6300201-logomatte-a` (Artikel 569) mit 90 x 120 cm lieferte 125,53 EUR brutto. Das ist der alte Quadratmeterpreis brutto (105,49 x 1,19), nicht der Wert der Excel-Formel (nach `preisformel.js` rund 163,40 EUR brutto für 1,08 m²). Daraus folgt vermutlich: der Schalter "Excel-Formel" steht an diesem Artikel auf Nein. Für die Übernahme heißt das: Je Artikel müssen die Stammdaten im Admin gepflegt und der Schalter gesetzt sein, sonst zeigt der neue Shop den Altpreis. Das ist Datenpflege im Admin, keine Zuordnung. (Noch nicht für andere Artikel gemessen.)

## 5. Prüfung der `dePfad`-Werte gegen das lokale Altsystem

`GET /api/produkt?pfad=...` über die Brücke (8787), alle verschiedenen Pfade aus `NET.zuordnung`: **21 Pfade, 21 Treffer, 0 Fehlschläge.**

* HTTP 200, `ok: true`, `kaufbar: true`, `umgezogen: false`, zurückgegebener `pfad` = angefragter Pfad (keine Umleitung) bei allen 21.
* 15 `dePfad` (14 mit `modus: kauf`, 1 mit `modus: anfrage`: `beflockte_kokosmatte-a`), 6 `deZwilling` (alle `modus: anfrage`).
* Artikel-IDs: 472, 25, 459/765, 450/730, 648/569, 480, 181, 8, 574/722, 474, 18, 490/776, 687/688, 550, 501.
* Beachte: `kaufbar: true` gilt auch für Anfrageartikel. Das Merkmal `--pruefen` ist deshalb schwach; ein "kaufbar" sagt nichts über den Modus. Fürs Auto-Mapping gilt `modus`.
* Nicht geprüft: ob die Zuordnung **inhaltlich** richtig ist (z. B. pid 34 -> Diplomat 52601). Das ist eine Frage an den Auftraggeber, kein Messwert.

## Was bei 385 Produkten davon noch gebraucht wird

| Baustein | Bei direkter Übernahme | Was zu tun ist |
|---|---|---|
| Tabelle `ZUORDNUNG` / `dePfad` | **fällt weg** | Pfad = eigener Pfad aus `/api/katalog` / `/api/kategorie` |
| `modus` | bleibt wie heute | live aus `/api/produkt`, nicht speichern |
| Hand-Recherche "Sicherheit", Doppelgänger | **fällt weg** | gibt es nicht mehr |
| `weg()`: Regel "Zielartikel nach Fähigkeit" | **bleibt unverändert** | arbeitet nur mit `masse[]`, `modus`, `attribute`. Läuft für jeden Artikel |
| Universalartikel 569 | **bleibt** | Auffangnetz, wenn weder Zwilling noch Kaufartikel die Maße tragen. Muss im Altsystem existieren und aktiv bleiben |
| Zwilling (`deZwilling`) | **bleibt, aber abgeleitet** | Endungsregel `-a`, `-ang`, `a`, `-sondermass` plus Gegenprüfung (anfrage, gleiche Attribute, x/y-Felder), nie über `gehoertZu`. Beim Bauen berechnen und als Liste hinterlegen, nicht von Hand. Greift die Regel nicht, bleibt Schritt 2 und 3 |
| `preisdaten` (EK, Salesfactor, Standardbreiten) | **fällt weg im Frontend** | Preis aus `GET /api/price` (Formel im Altsystem). Voraussetzung: Stammdaten und Schalter je Artikel im Admin, sonst Altpreis |
| Name, Bild, Beschreibung, Kategorien | **neue Quelle** | `/api/produkt` und `/api/kategorie`. Nicht mehr die matten.net-Texte (`struktur.json`, `texte/*.md`) |
| Farbpalette (Hexwerte), Attribut-Beschriftungen | **teils von Hand** | Altsystem liefert Farbnamen wie "613-königsblau"; Hexwerte kommen heute aus der matten.net-Palette (`NET.farben`). Für unbekannte Farben bleibt das Farbmuster-Bild oder Grau (LIESMICH 3.12) |

Offene Fragen an Lukas/Herrn Fuchsius: (a) Sollen die sechs fehlenden Zwillinge (64000121a, 64000122a, 6320304a, 6320301-quadrat-ang, 6320307-5punkt-ang, mietmattena) heute schon nachgetragen werden oder erst mit der automatischen Ableitung? (b) Ist die Excel-Formel für die übernommenen Artikel im Altsystem eingeschaltet (Schalter je Artikel)?

Hinweis zur Methode: Eine direkte Abfrage der Altsystem-Datenbank, ob es dort ein ausdrückliches Verknüpfungsfeld Kaufartikel <-> Zwilling gibt, wurde nicht vorgenommen (der Zugriff auf den Datenbank-Container wurde abgelehnt, ich habe ihn nicht umgangen). Im PHP-Quelltext (`Backup/.../web/php`) gibt es keinen Treffer für "zwilling" oder "anfrageartikel". Die Aussage "Zwillinge hängen nur über die Pfadendung zusammen" gilt daher für die **Brücken-Daten**.
