# DESIGN.md — Mattenfuchs-Shop

Durable visual system für den neuen Webshop unter `/shop`.
Der Kunde hat Layout und Struktur auf https://www.entrada-matten.de/ gepinnt,
Farbwelt und Logo auf https://matten.de/. Beide Pins sind bindend.

---

## Direction Contract

**THESIS** — Der Shop macht die Maßanfertigung sichtbar, statt sie hinter einem
Katalog zu verstecken: jede Matte ist konfigurierbar, und der Konfigurator ist
das Herz der Produktseite. Verweigert wird das, was die Altseite tut — bunte
Inline-Styles, Rainbow-Banner, 138 Kacheln ohne Hierarchie.

**OWN-WORLD** — Signaletik am Gebäudeeingang: ruhige Neutralflächen, harte
Kanten, keine Rundungen über 4px, ein tiefes Marineblau als Marken-Feld und das
Fuchs-Cyan als einziges Aktions-Signal. Grotesk-Typografie aus der
Beschilderungstradition (Archivo/Barlow). Icons als 1,5px-Linienzeichnungen im
selben Duktus. Bildkanten immer bündig zum 12-Spalten-Raster.

**STORY** — Der gewerbliche Einkäufer sieht in einem Viewport: das ist ein
Spezialist für Eingangsmatten, es gibt Maßanfertigung, und hier ist der Weg zum
Produkt oder zur Beratung.

**FIRST VIEWPORT** — Trust-Topbar (3 Signale) · Header mit Fuchslogo links,
Volltextsuche mittig, Kontakt + Konto + Warenkorb rechts · Mega-Navigation ·
darunter die Hero-Kachelwand: links großes Bild 2/3 mit Overlay-Claim und
primärer Aktion, rechts 2×2 Kategorie-Kacheln mit Bildunterschriften.

**FORM** — Vom Auftraggeber gepinnte Referenzstruktur (entrada-matten.de),
umgesetzt in der Mattenfuchs-Farbwelt. Kein Konzept-Wurf, weil die Richtung im
Briefing feststeht.

---

## Farb-System

Alle Werte aus der Bestandsseite gemessen (Screenshot + Logo-Palette).

| Token | Wert | Herkunft / Rolle |
|---|---|---|
| `--c-navy-900` | `#050A40` | Navbar der Altseite. Topbar, Footer, Overlays |
| `--c-navy-800` | `#0B1550` | Flächen, Mega-Menü-Kopf |
| `--c-navy-700` | `#1B2E80` | Logo-Kontur. Headlines, starke Labels |
| `--c-navy-600` | `#000080` | Fließtext-Navy der Altseite. Links |
| `--c-blue-600` | `#0072B8` | Primäraktion (Buttons). 4,9:1 auf Weiß |
| `--c-blue-700` | `#005A93` | Hover / aktiv |
| `--c-cyan-500` | `#00A8E0` | Fuchs-Cyan. Icons, Akzentlinien, Badges |
| `--c-cyan-300` | `#7DC8EC` | Zarte Trenner, Fokusringe |
| `--c-cyan-50` | `#EAF5FC` | Weiche Flächen, Hover-Zeilen |
| `--c-signal` | `#D0021B` | Preise, Sonderangebot-Badges (Rot der Altseite) |
| `--c-ink` | `#15181D` | Fließtext |
| `--c-ink-muted` | `#5C636E` | Sekundärtext |
| `--c-line` | `#DFE3E8` | Hairlines, Kartenrahmen |
| `--c-surface` | `#FFFFFF` | Kartenfläche |
| `--c-surface-2` | `#F4F6F8` | Abschnittsflächen (wie Referenz) |

**Strategie:** Restrained-plus-Field. Neutralgrau trägt die Fläche, Marineblau
besetzt ganze Regionen (Topbar, Footer, Overlays), Cyan/Blau ist die einzige
Aktionsfarbe. Rot ausschließlich für Preis und Rabatt — nie für Aktionen.

## Typografie

- **Archivo** — Headlines, Produktnamen, Buttons. 600/700.
- **Barlow** — Fließtext, Labels, UI. 400/500/600.
- Selbst gehostet unter `shop/assets/fonts/`, damit der Shop offline demonstrierbar ist.
- Scale: 12 · 13 · 14 · 15 · 16 · 18 · 20 · 24 · 30 · 38 · 48 (px), Zeilenhöhe 1,25 Display / 1,6 Fließtext.

## Raster & Abstände

- Container 1360px, Gutter 24px, 12 Spalten.
- Spacing-Skala: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
- Über einer Überschrift immer mehr Raum als darunter.
- Radius: 2px (Buttons/Inputs), 4px (Karten), 0 für Bildkacheln.
- Schatten sparsam: `0 1px 2px rgba(5,10,64,.06)` Ruhe, `0 8px 24px rgba(5,10,64,.10)` Hover.

## Komponenten-Grammatik

- **Produktkarte:** Bild 4:3 randlos oben · optional Badge oben links · Kategorie-Kicker ·
  Name (Archivo 600) · 1-Zeilen-Nutzen · Farb-Swatches · bis 3 Merkmale mit Häkchen ·
  Preiszeile (`ab 00,00 €` rot) · Aktion.
- **Buttons:** rechteckig, 2px Radius, 44px Höhe, Archivo 600, kein Verlauf.
  Primär = `--c-blue-600` auf Weiß. Sekundär = 1px Rahmen `--c-blue-600`.
- **Icons:** Inline-SVG, 1,5px Strich, `currentColor`, 24px Raster.
- **Mega-Menü:** volle Containerbreite, weiße Fläche, Spalten mit Gruppenkopf in
  `--c-navy-700`, Bildkachel rechts.

## Verbote

- Keine Farbverläufe auf Flächen (der Rainbow-Banner der Altseite ist Anti-Referenz).
- Keine Emoji als Icons.
- Keine erfundenen Preise, Kundenlogos, Zertifikate oder Lieferzeiten.
- Keine Rundungen > 4px; die Signaletik-Welt hat harte Kanten.

## Bewusst erlaubt

- Das Fuchslogo bleibt unverändert, inklusive seiner Verlaufsfarben — es ist das
  Markenzeichen, nicht Teil der Flächen-Regel.
- Rot als Preisfarbe, weil die Bestandskundschaft das so kennt.

## Datenlage

- `shop/assets/js/catalog.js` wird aus `_analyse/products_raw.json` +
  `_analyse/price_matrix.json` generiert. Preise stammen 1:1 aus dem Live-Shop.
- Kundenstimmen sind echte Gästebuch-Einträge von matten.de.
- Produktbilder: mit GPT Image 2 (kie.ai) auf Basis der Originalbilder neu erzeugt.
