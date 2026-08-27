# Mattenfuchs-Shop — Frontend-Demo für das Erstgespräch

Neubau des Webshops von **matten.de** (FUCHSIUS multi-media GmbH).
Layout und Struktur nach der Referenz **entrada-matten.de**, Farbwelt und Logo
von matten.de. Reines Frontend, kein Backend.

## Starten

Doppelklick auf `index.html` funktioniert. Sauberer ist ein lokaler Server,
weil dann alles wie im Netz lädt:

```
cd shop
python -m http.server 8931
```
→ http://127.0.0.1:8931/

## Seiten

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite |
| `kategorie.html` | Sortiment / Listing mit Filtern (`?cat=`, `?sub=`, `?q=`) |
| `produkt.html` | Produktseite mit Konfigurator (`?p=<slug>`) |
| `warenkorb.html` | Warenkorb |
| `kasse.html` | Kasse inkl. PayPal-Demo |
| `bestellung.html` | Bestellbestätigung |
| `kontakt.html` | Kontakt + Anfrageformular |
| `konto.html` | Kundenkonto (Platzhalter) |
| `unternehmen.html` | Über uns + alle Gästebuch-Stimmen |
| `service.html` | Pflege Edelstahl/Gitterrost + Mietservice |
| `technik.html` · `farben.html` | Technische Daten, Farbpaletten |
| `miet-service.html` · `mattendesigner.html` | Mietservice, Mattendesigner |
| `versand.html` · `agb.html` · `widerruf.html` · `datenschutz.html` · `impressum.html` | Rechtliches |

## Was funktioniert

- **Live-Suche** im Kopf über alle 254 Artikel
- **Mega-Menü** mit Kategorien, Materialien, Einsatzorten
- **Filter** nach Bereich, Preis, Eigenschaften; Sortierung; Nachladen
- **Konfigurator**: Grundfarbe (echte Farbmuster), Größenstaffel mit echten
  Preisen, Trittrand/Ausführung, Wunschmaß, Menge, Anmerkung
- **Warenkorb** mit Mengenänderung, bleibt über Seitenwechsel erhalten
  (localStorage), Versandregel 1:1 von matten.de:
  bis 1,8 m² → 5,00 € · darüber → 10,00 € · ab 1.000 € → frachtfrei
- **Kasse** mit vier Zahlarten, Pflichtfeldprüfung, AGB-Bestätigung
- **PayPal-Demo**: Zahlungsdialog → Verarbeitung → Bestätigung →
  Bestellnummer. Es wird nichts abgebucht und nichts versendet.
- Responsiv bis 390 px, Tastaturbedienung, sichtbarer Fokus, `prefers-reduced-motion`

## Woher die Inhalte stammen

- **685 Seiten** von matten.de vollständig gecrawlt und ausgewertet
- **254 Artikel** mit Kaufformular übernommen
- **Preise**: pro Artikel und Größe direkt vom Live-Shop abgefragt
  (798 Abfragen) — keine erfundenen Preise
- **Kundenstimmen**: die echten 20 Gästebuch-Einträge von matten.de
- **Rechtstexte**: 1:1 von der Altseite, nur die Auszeichnung wurde bereinigt
- **Firmendaten**: aus dem Impressum

## Bilder

- **212 Produktbilder** neu erzeugt mit **GPT Image 2** (kie.ai), jeweils aus
  dem Originalbild des Artikels — Muster, Farbe und Struktur bleiben erhalten,
  neu ist die Studio-Aufnahme.
- **42 Artikel** (überwiegend Bierbank-Designvarianten mit schmalen
  Banner-Quellbildern) nutzen das aufbereitete Originalbild.
- **16 Szenenbilder** (Hero, Kategorie-Kacheln, 5 Prozessschritte, CTA,
  3 Projekte) neu erzeugt. Diese Szenen sind **generiert, keine Werksfotos** —
  vor dem Live-Gang durch echte Aufnahmen ersetzen.
- 5 Randartikel (Aussparung, Mattenschräge o. ä.) zeigen einen Platzhalter.

## Vor dem Live-Gang zu klären

1. **Szenenbilder** durch echte Fotos ersetzen (Eingänge, Produktion, Versand, Team).
2. **Rechtstexte** anwaltlich prüfen — sie sind unverändert von der Altseite übernommen.
3. **Fax-Nummer** gegenprüfen: Impressum nennt `+49 89 54 88 83 33`,
   der Service-Block der Altseite `+49 89 5455 8333`.
4. **Lieferzeiten** ergänzen — die Altseite nennt keine belastbaren Angaben.
5. **Backend** anbinden: Bestellungen, Zahlung, Preisberechnung für Wunschmaße,
   Kundenkonto, Versand der Bestätigungsmails.
6. **Zahlarten** vertraglich klären — die Auswahl ist bisher nur beispielhaft.

## Bilder neu erzeugen

Die Generierungsskripte lesen den kie.ai-Schlüssel aus der Umgebung —
er steht bewusst nicht im Code:

```
$env:KIE_API_KEY = "<dein Schlüssel>"
python _analyse/generate_images.py
python _analyse/optimize_images.py     # PNG -> WebP, ~94 % kleiner
```

## Aufbau

```
shop/
  assets/css/app.css        Design-System (Tokens, Komponenten, Responsive)
  assets/js/site.js         Kopf, Navigation, Suche, Warenkorb, Produktkarte
  assets/js/catalog.js      254 Produkte + Kategorien (generiert)
  assets/js/home.js         Startseite
  assets/js/kategorie.js    Listing
  assets/js/produkt.js      Konfigurator
  assets/js/warenkorb.js    Warenkorb
  assets/js/kasse.js        Kasse + PayPal-Demo
  assets/js/bestellung.js   Bestätigung
  assets/fonts/             Archivo + Barlow, selbst gehostet (offline lauffähig)
  assets/img/produkte/      neu erzeugte Produktbilder
  assets/img/original/      aufbereitete Originalbilder
  assets/img/szenen/        Szenenbilder
  assets/img/swatches/      Farbmuster aus dem Altshop
```

Analyse, Skripte und Rohdaten liegen eine Ebene höher in `_analyse/`,
die heruntergeladenen Originalbilder in `_assets_original/`,
Screenshots in `_screenshots/`.
Die Designentscheidungen stehen in `../DESIGN.md`, die Produktwahrheit in `../PRODUCT.md`.
