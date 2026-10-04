# Erkundung Frontend: Was bricht bei 385 Produkten?

Stand 03.10.2026. Nur gelesen und gemessen, kein Code geändert. Geprüft in `Frontend/bridge-demo/public/net-neu/`,
Messung mit Chrome headless gegen die Brücke (Port 8787, Altsystem localhost:8080), Cache aus.
Es wurde nichts in den Warenkorb gelegt, keine Bestellung ausgelöst.

## Kurzfassung

Das Frontend ist ein reines Browser-Frontend, das **alles aus `window.NET` (daten.js)** liest: Produkte, Kategorien,
Menü, Filter, Startseite. Die Seiten selbst (Liste, Kategorie, Suche) würden 385 Produkte technisch verkraften,
sie rechnen schnell. Kaputt geht etwas anderes: **Die Seiten kennen nur, was in daten.js steht.** Ein Produkt oder
eine Kategorie, die dort fehlt, gibt es für das Frontend nicht (Produktseite: „Dieses Produkt gibt es nicht",
Kategorieseite: „Kategorie nicht gefunden"). Der Wechsel der Quelle ist deshalb keine Frage der Geschwindigkeit,
sondern der Datenform.

## 1  Produktliste (`products.html`, `seite-produkte.js`)

* **16 Karten je Seite** (`JE_SEITE = 16`), Blätterfunktion vorhanden („« Vorherige | 1 | 2 … | Nächste »").
* Heute 19 Produkte = 2 Seiten. Bei 385: 385 / 16 = 24,06 → **25 Seiten**; Seite 25 hätte genau 1 Produkt.
* Die Blätterleiste schreibt **alle** Seitenzahlen aus, ohne Auslassung (25 Zahlen + 2 Pfeile = 27 Einträge).
  Auf dem Handy wird das eine mehrzeilige Zahlenwand. Sie funktioniert, ist aber unschön.
* **Sortierung:** „Latest" = Reihenfolge von `NET.produktReihenfolge`. Diese kommt aus der matten.net-Datei
  (höchste `productId` zuerst, `bau-net-daten.mjs` Z. 449). Das Altsystem hat **kein Datum**. Was „Latest" bei
  385 Produkten heißen soll, ist offen (Listenfolge des Altshops? interne Artikel-ID?).
  „Name a-z / z-a" sortiert im Browser mit `localeCompare('de')`, das ist bei 385 unkritisch (Millisekunden).
* **Filter nach Kategorie:** 26 Kästchen in 9 Gruppen, fest aus `NET.gruppen` (IDs aus dem matten.net-Original,
  handgepflegt). Zwei Folgen bei 385 Produkten:
  1. **Produkte verschwinden nach „Filter" klicken.** Sind alle Kästchen an, wird beim Abschicken jede ID in die
     Adresse geschrieben. Dann ist die Filterung aktiv, und jedes Produkt, dessen Kategorie nicht unter den 26
     Kästchen vorkommt, fällt heraus (Code: `erlaubteSlugs`, Zeile ~66). Heute passiert das nicht, weil alle 19
     Produkte in bekannten Kategorien liegen. Die 385 Altsystem-Produkte hängen an anderen Kategorien
     (z. B. Bierbankmatten, Bodenschutzmatten, Terrazzo, Reinigungsprodukte).
  2. Die 26 Kästchen passen nicht zu den 22 aktiven Altsystem-Kategorien. Die Filterleiste muss neu gebaut werden.
* **Suchwort** (`?keyword=`) sucht nur im **Produktnamen**, als einfache Teilzeichenkette. Gemessen:
  „iron horse" findet **0** Treffer, „iron-horse" findet 3. Schon heute ein Mangel, bei 385 Produkten spürbar.

## 2  Kategorieseite (`kategorie.html`, `seite-kategorie.js`)

* **Zeigt alle Produkte der Kategorie auf einmal, keine Blätterung.** Alle Karten werden in einem Schritt
  geschrieben; Sortierung wie oben.
* Heute größte Kategorie: Designmatten mit 5 Produkten. Das Altsystem hat Kategorien mit **51** (Gummi/Kunststoff),
  47, 44, 40, 40, 33.
* Gemessen an 51 echten Brücken-Daten (Gummi- und Kunststoffmatten): Aufbau der Karten **1 ms**, Seite **8.283 px
  hoch**. Die Technik trägt das. **Das Problem sind die Bilder:**
  * Es gibt **kein `loading="lazy"`** an den Karten-Bildern. Alle Bilder laden sofort.
  * Der Bildproxy der Brücke liefert die **Originale**, keine Kacheln: Mittel **123 KB**, größtes **627 KB**.
    Die 29 vorhandenen Bilder dieser Kategorie = **3,5 MB** auf einen Schlag. Die heutigen 19 Kacheln in
    `assets/img/produkt-kacheln/` sind dagegen zugeschnitten (im Mittel 8 KB).
  * **22 von 51 Artikeln haben gar kein Bild** (Karte zeigt dann den leeren Kasten `card-img-leer`).
  * **18 von 51 sind Varianten** (`variante: true`), also Untertypen eines Hauptartikels. Soll jede Variante eine
    eigene Karte bekommen? Das muss entschieden werden, sonst wirkt die Liste doppelt.
* Die Seite findet eine Kategorie nur, wenn der `slug` in `NET.kategorien` steht (27 Stück, aus matten.net).
  Die Altsystem-Kategorien heißen und gliedern sich anders (Brücke: 8 oberste + 16 Unterkategorien = 24).
* Kategoriekopf: `titelbild` und `beschreibung` kommen aus daten.js. Die Brücke liefert pro Kategorie **kein
  Titelbild und kein Kachelbild**, nur Name, Pfad, Titel, Einleitung (bei der Stichprobe leer).

## 3  Suche

* Die Suche im Kopf schickt nur `?keyword=` an `products.html`. Gesucht wird **im Browser über `window.NET.produkte`**,
  nur im Namen. Die Brücke wird **nicht** befragt.
* Skalierung: 385 Namen durchsuchen kostet nichts (Millisekunden). Sie skaliert also, aber nur so gut wie die
  Suchqualität: kein Leerzeichen-Bindestrich-Abgleich, keine Beschreibungen, keine Artikelnummern, keine Mehrwortsuche.
* Die Brücke hat bereits `GET /api/suche?q=…` (Namen **und** Beschreibungen, mehrere Wörter mit ODER, eigene
  Blätterung, höchstens 200 je Seite). Gemessen: kalt 0,2 bis 0,9 s, danach 1 ms (Cache). `?alle=1` liefert alle
  384 eigenständigen Artikel (ohne Doppel) auf zwei Seiten à 200, kalt 0,9 s.

## 4  Navigation (`shell.js`)

* Das Menü wird **vollständig aus `NET.navigation` (daten.js)** gebaut, nicht dynamisch. Heute **12 Einträge**
  (3 Links: Mattendesigner, Alle Produkte, Blog; 9 Gruppen) mit **27 Kategorie-Kacheln**. Desktop: Bildmenü mit
  Kachel je Kategorie (Bild 150×100), mobil: Textliste.
* Neue Kategorien erscheinen **nur**, wenn jemand sie in `struktur.json` einträgt und `bau-net-daten.mjs` neu läuft.
  Ein automatischer Weg aus dem Altsystem (`/api/katalog`) ist nicht angeschlossen.
* Bei 22 aktiven Kategorien (24 im Baum) wäre die Zahl der Kacheln ähnlich wie heute, die Struktur aber anders.
  Wichtiger: Die Brücke liefert **keine Kachelbilder** für Kategorien. Das Bildmenü bekäme leere Kästen
  (`kachel-leer`), solange Bilder nicht aus dem Altsystem oder von Hand dazukommen.
* Der Warenkorb sucht beim Anzeigen je Position per Schleife über `NET.zuordnung` (`lokalerProduktPfad`), das bleibt
  bei 385 harmlos.

## 5  Startseite (`seite-start.js`)

* **TOP-ANGEBOTE sind fest: 5 Slugs** in `NET.startseite.topAngebote`, erzeugt aus `spec/screens/startseite.html`
  (Abbild der matten.net-Startseite). Karussell (11 Folien) und „Featured Category" sind ebenfalls fest verdrahtet,
  die Links zeigen auf matten.net-Kategorie-Slugs.
* Bei 385 Produkten bricht die Startseite nicht. Sie bleibt aber ein Abbild von matten.net. Fallen Kategorie-Slugs
  weg oder ändern sich, laufen die Karussell-Links ins Leere. Die Frage „welche 5 Produkte sind Top-Angebote?"
  muss der Auftraggeber beantworten (Einstellung statt Code).

## 6  Dateigröße von `daten.js`

Heute **147.727 Byte** (gzip: 31.647 Byte, also etwa 1 : 4,7). Aufteilung nach Messung:

| Teil | Größe |
|---|---|
| `produkte` (19, im Mittel 2,1 KB) | 39,8 KB |
| `zuordnung` (19, im Mittel 0,2 KB) | 4,0 KB |
| `texte` (Rechtstexte u. a.) | 44,9 KB |
| `mattendesigner`, `startseite`, `kategorien`, `navigation`, `farben`, Rest | rund 59 KB |

Nur rund 30 % wachsen mit der Produktzahl. **Schätzung bei 385:** feste ~104 KB + 385 × 2,3 KB ≈ **1,0 MB**.
Ein Probelauf mit 385 vervielfältigten Produkten ergab **1.097 KB**. Das ist die Untergrenze. Echte Altsystem-Artikel
sind größer: eine Artikelseite der Brücke ist 5 KB (`/api/produkt`), lange Beschreibungen und Maßware-Optionen
kommen dazu. Realistisch **1,0 bis 2 MB**. (Zum Vergleich: der Katalog-Stand der Netlify-Fassung ist 3,6 MB.)

Wann wird es zum Problem?
* **Rechenzeit ist es nicht:** Auswerten der 1,1 MB dauerte im Browser **6 ms** (Handy grob 10× langsamer, also 60 ms).
* **Übertragung ist es:** `daten.js` hängt an jeder Seite. Lokal ohne gzip (Brücke) sind 1,1 MB auf einer
  langsamen Handyverbindung (1,6 Mbit/s) rund **5 bis 6 s** vor der ersten Darstellung. Mit gzip (Netlify macht das) etwa
  **220 KB, rund 1 s**.
* Faustregel: **ab etwa 500 KB ungepackt** wird es auf dem Handy spürbar, **ab etwa 2 MB** deutlich. Bei 385
  Produkten liegt man im Bereich dazwischen: noch tragbar, aber unnötig, wenn die Daten nach Kategorie und
  Seite nachgeladen werden können. Lokal sendet die Brücke `Cache-Control: no-cache` (jedes Mal erneut prüfen).

## 7  Gemessene Ladezeiten heute (Cache aus, lokal, je 3 Läufe)

| Seite | Karten | DOMContentLoaded | Load | daten.js |
|---|---|---|---|---|
| `products.html` Seite 1 | 16 | 38 bis 47 ms | 49 bis 86 ms | 6 bis 18 ms |
| `products.html?page=2` | 3 | 29 bis 34 ms | 41 bis 45 ms | 4 bis 5 ms |
| `kategorie.html?slug=designmatten` (größte heutige Kategorie, 5) | 5 | 22 bis 35 ms | 39 bis 47 ms | 5 bis 6 ms |
| `kategorie.html?slug=os-rehab-physio-matten` | 3 | 28 bis 31 ms | 40 bis 44 ms | 5 ms |

Das ist die Bestzeit, weil alles auf demselben Rechner liegt und 19 Produkte nur wenig sind. Aussagekräftiger:

* **Simulation 385 Produkte:** Karten für alle 385 als HTML bauen **1 ms**, in die Seite einsetzen **4 ms** (196 KB HTML).
  Die Liste mit 16 je Seite wäre so schnell wie heute.
* **Echte Kategorie mit 51 Artikeln** (Gummi/Kunststoff, Brückendaten): Daten holen 171 ms, Karten bauen 1 ms,
  **Bilder 3,5 MB** (siehe Punkt 2).
* **Brücke gegen Altsystem (kalt, `frisch=1`):** Katalogbaum 0,2 s · Kategorieliste 0,18 s ·
  Kategorieliste mit `details=1` (Preis, Varianten: eine Anfrage je Produkt) **3,0 bis 3,4 s für 24 Produkte** ·
  Suche 0,2 bis 0,9 s. Gecacht jeweils 1 ms.
  Die Listenkarten brauchen **keinen Preis**, also kein `details=1`.

## Was bei 385 Produkten umgebaut werden muss (nach Dringlichkeit)

**A  Bricht sofort (ohne das geht nichts)**
1. **Datenquelle wechseln.** `produkte`, `kategorien`, `navigation`, `gruppen`, `zuordnung` stammen aus matten.net
   (`struktur.json`) und sind für 385 Altsystem-Artikel nicht vorhanden. Produkt- und Kategorieseite zeigen sonst
   „gibt es nicht". Entweder `bau-net-daten.mjs` aus dem Altsystem speisen (Build-Schritt) oder die Seiten laden
   zur Laufzeit von `/api/katalog`, `/api/kategorie`, `/api/produkt`.
2. **Kennung klären.** Seiten adressieren über `?slug=`, das Altsystem über `pfad` (z. B.
   `/fussmatten/standard-schmutzfangmatten/attache`, 612 Listenplätze für 384 Artikel, ein Artikel steht in
   mehreren Kategorien). Es braucht einen eindeutigen, stabilen Schlüssel und das Entfernen von Dubletten.
3. **Filter-Kästchen und Kategorie-IDs neu** aus den Altsystem-Kategorien erzeugen, sonst verschwinden Produkte
   beim Klick auf „Filter" (Punkt 1, Fehler 1). Das ist ein stiller Fehler, der erst auffällt, wenn jemand filtert.

**B  Wird unbrauchbar, ohne zu brechen**
4. **Bilder:** Kacheln in passender Größe (Proxy liefert 123 KB im Mittel, bis 627 KB) und `loading="lazy"` an den Karten.
   22 von 51 Artikeln einer Kategorie haben kein Bild: Platzhalter prüfen.
5. **Kategorieseite blättern oder nachladen** (heute alle auf einmal). 51 Karten gehen technisch, mit Originalbildern
   nicht. Auch die Brücke blättert schon (24 je Seite, bis 200).
6. **Menü/Kacheln:** Kategorie-Kachelbilder und Titelbilder fehlen in der Brücke. Entweder aus den Artikelbildern
   ableiten oder von Hand pflegen.
7. **Varianten** (18 von 51 in der größten Kategorie): entscheiden, ob sie eigene Karten bekommen.

**C  Unschön, später**
8. **Blätterleiste** mit Auslassung („1 … 4 5 6 … 25") statt 25 Zahlen.
9. **Suche** auf `/api/suche` umstellen (Beschreibung, Mehrwort, Artikelnummer), mindestens Leerzeichen und
   Bindestrich gleichstellen.
10. **„Latest"** neu definieren (Altshop-Reihenfolge oder interne Artikel-ID).
11. **Startseite:** Top-Angebote und Karussell-Links als Einstellung statt fest verdrahtet.
12. **daten.js verschlanken:** `texte` (45 KB), Designer und Farben nicht an jede Seite hängen; die Produktdaten gar
    nicht mehr im Skript, sondern seitenweise. Sonst wächst die Datei auf 1 bis 2 MB.
13. **Auswahlschalter** (alle 385 oder Auswahl): im Rahmen von 1 bis 3 am einfachsten als Liste freigegebener
    Artikelnummern in einer Einstellung, nicht im Code.

## Hinweis zur Zählung
Auftrag: 385 aktivierte Artikel. Die Brücke zählt 384 eigenständige Artikel im Shop (`gemeldeteTreffer`), 612 Listenplätze.
Ein Unterschied von 1 ist ungeklärt (vermutlich ein aktivierter, aber nicht gelisteter Artikel).
