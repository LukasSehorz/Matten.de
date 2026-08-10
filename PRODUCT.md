# PRODUCT.md — Mattenfuchs-Shop (matten.de) Relaunch

> Erfasst aus dem Brief des Auftraggebers + vollständiger Analyse von https://matten.de/
> (Stand 07.08.2026). Angaben mit ⚠️ sind Annahmen, keine bestätigten Fakten.

## Was das Produkt ist

Ein **B2B/B2C-Webshop für Schmutzfangmatten, Logomatten und Eingangsmattensysteme**
der FUCHSIUS multi-media GmbH, die unter der Marke **„Der Mattenfuchs-Shop"** auf
matten.de seit über 35 Jahren gestaltete Schmutzfangmatten vertreibt.

**Einzigartiger Mechanismus:** Jede Matte wird konfektioniert — beliebige Maße
(bis 200 cm Breite, 7 m Länge), beliebige Formen, bis 20-farbiger Druck, Wahl aus
über 100 Farben. Kein Katalogartikel, sondern Maßanfertigung ab Stückzahl 1.

## Anlass dieses Builds

Frontend-Demo für ein **Erstgespräch mit dem Kunden**. Kein Backend. Ziel: zeigen,
wie ein moderner Shop für dieses Unternehmen aussehen kann, inkl. lauffähigem
Warenkorb und beispielhaftem PayPal-Checkout (Demo, keine echte Zahlung).

## Firmendaten (verifiziert aus /impressum)

| Feld | Wert |
|---|---|
| Firma | FUCHSIUS multi-media GmbH |
| Vertreten durch | Dipl.-Ing. FH Dieter Fuchsius |
| Anschrift | Fischerstrasse 2, D-85737 Ismaning |
| Telefon | +49 89 54 55 82 64 |
| Fax | +49 89 54 88 83 33 |
| Mobil / Hotline | +49 171 77 55 400 |
| E-Mail | info@matten.de |
| Registergericht | Amtsgericht München, HRB 161064 |
| USt-IdNr. | DE 246 769 029 |

## Marke

- **Name / Claim:** „Der Mattenfuchs-Shop" · „über 35 Jahre Erfahrung" ·
  „individuell, werbewirksam, sauber" · „Werbe-Design-Matten"
- **Logo:** Blauer Fuchskopf mit Mütze (Mattenfuchs). Muss erhalten bleiben.
- **Farbwelt (aus Bestandsseite gemessen):** Tiefes Marineblau `#050A40`,
  Fuchs-Cyan `#00A8E0` → `#0090D0`, Logo-Kontur `#203080`, Flächenblau `#7DAFD4`,
  Navy-Fließtext `#000080`, Preis-Rot `#FF0000`.

## Zielgruppe & Szene

Primär **gewerbliche Einkäufer**: Facility Manager, Hausverwaltungen, Hotellerie,
Einzelhandel, Handwerk, Arztpraxen/Reha, Gastronomie. Sekundär Privatkunden.
Kaufszene: am Schreibtisch, Desktop, tagsüber, mit einer konkreten Maßanfrage —
nicht zum Stöbern, sondern zum Finden und Anfragen/Bestellen.

## Was der Shop leisten muss

1. Sortiment über 7 Hauptkategorien navigierbar machen (Mega-Menü).
2. Maßanfertigung als Normalfall darstellen (Maße/Farben/Design wählbar).
3. Produkte in den Warenkorb legen, Menge ändern, Warenkorb persistieren.
4. Checkout mit PayPal als sichtbarer Zahlart — **Demo, ohne echte Zahlung**.
5. Sämtliche rechtlichen Inhalte der Altseite tragen (Widerruf, AGB,
   Datenschutz, Impressum, Versandkosten).

## Versandkosten (verifiziert aus /Versandkosten)

- bis 1,8 m²: **5,00 €** (Deutschland, ohne Inseln)
- ab 1,8 m² bis 999,99 €: **10,00 €** (Deutschland, ohne Inseln)
- ab 1.000,00 €: **frachtfrei**

## Harte Constraints

- **Design/Layout:** 1:1 im Stil von https://www.entrada-matten.de/ (vom Kunden gepinnt).
- **Farben + Logo:** von matten.de (vom Kunden gepinnt).
- **Kein Backend.** Reines Frontend, lokal per Doppelklick / statischem Server lauffähig.
- **Alle Inhalte 1:1** von der Altseite übernehmen — nichts erfinden.
- **Preise** ausschließlich aus der Altseite; keine erfundenen Preise.
- Produktbilder: neu generiert (GPT Image 2 via kie.ai) auf Basis der Originalbilder.

## Nicht bestätigt / auf der Ersetzungsliste des Kunden

- ⚠️ Kundenlogos / Referenzen: die Altseite nennt keine; Bereich wird als klar
  markierter Platzhalter geführt oder entfällt.
- ⚠️ Mitarbeiterfotos für das Beratungs-Widget: nicht vorhanden.
- ⚠️ Lieferzeiten: auf der Altseite nicht durchgängig ausgewiesen.
