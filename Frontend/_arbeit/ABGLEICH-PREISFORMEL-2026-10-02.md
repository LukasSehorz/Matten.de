# Abgleich Preisformel — neue Mappe des Auftraggebers gegen den Code

Stand 02.10.2026 · geprüft, nichts geändert · `preisformel.js` ist unangetastet

---

## Das Wichtigste in drei Sätzen

**An der Rechnung hat sich nichts geändert.** Der gesamte Rechenbereich der neuen Mappe
(`1PREISE-Brian_Sehorz-26-09-30_18-55.xlsx`, Zellen A1:W7) ist Zelle für Zelle identisch mit
der bisherigen Grundlage — alle Formeln, alle Stammdaten, alle von Excel selbst gespeicherten
Ergebnisse. Die neue Fassung enthält ausschließlich **bessere Erklärtexte** (genauere
Beschreibung je Zelle, neue Sortierung, zusätzlich eine englische Übersetzung) und einen toten
Nebenrechenbereich, in dem sich Zeilenbezüge verschoben haben, der aber in beiden Mappen nichts
rechnet. **Der Preis ist nicht betroffen, der Code rechnet unverändert richtig** — nachgerechnet
mit 40 Fällen, alle 40 stimmen exakt.

---

## 1. Die Stammdaten im Vergleich

Alle Werte sind aus den echten Formelstrings beider Mappen gelesen (openpyxl, `data_only=False`)
und gegen `STAMMDATEN_VORGABE` in `preisformel.js` gestellt.

| Größe | Zelle | Wert alte Mappe | Wert neue Mappe | Wert im Code | stimmt überein |
|---|---|---|---|---|---|
| Salesfactor mehrfarbig (Colortype 1) | F1 | 1,931 | 1,931 | 1,931 | **ja** |
| Salesfactor einfarbig (Colortype 2) | I1 | 1,728 | 1,728 | 1,728 | **ja** |
| Salesfactor Ped-Print (Colortype 3) | L1 | 1,8 | 1,8 | 1,8 | **ja** |
| Auswahl des Colortypes | F2 | 1 | 1 | 1 | **ja** |
| Auswahlformel Salesfactor | C2 | `=IF($F$2=1,$F$1,IF($F$2=2,$I$1,IF($F$2=3,$L$1,F19)))` | identisch | gleiche Kaskade, Rückfall 0 | **ja** |
| Mengenstaffel: Schwellen | Q6:V6 | 1 · 2 · 3 · 10 · 20 · 30 | 1 · 2 · 3 · 10 · 20 · 30 | 1 · 2 · 3 · 10 · 20 · 30 | **ja** |
| Mengenstaffel: Faktoren | R5:V5 | 0,95 · 0,92 · 0,90 · 0,89 · 0,88 | 0,95 · 0,92 · 0,90 · 0,89 · 0,88 | 0,95 · 0,92 · 0,90 · 0,89 · 0,88 | **ja** |
| Sondermaß-Faktor | L5 | 1,25 | 1,25 | 1,25 | **ja** |
| Sonderform ohne Rand | N5 | 1,3 | 1,3 | 1,3 | **ja** |
| Sonderform mit Rand | O5 | 1,5 | 1,5 | 1,5 | **ja** |
| **Sonderfarbe Verkauf** | **P5** | **68 €** | **68 €** | **68 €** | **ja** |
| **Sonderfarbe Einkauf** | **P6** | **50 €** | **50 €** | **50 €** (Mappenwert) | **ja** — siehe Abschnitt 3 |
| Teuerungszuschlag TZ % | R2 | 0 | 0 | 0 | **ja** |
| Teuerungszuschlag als Faktor | S2 | `=1+(R2/100)` → 1 | identisch → 1 | `1 + tzProzent/100` | **ja** |
| EK-Listenpreis je m² | Q5 | 54,63 € | 54,63 € | 54,63 € | **ja** |
| Standardbreiten | Q7:V7 | 60 · 75 · 85 · 115 · 150 · 200 | 60 · 75 · 85 · 115 · 150 · 200 | 60 · 75 · 85 · 115 · 150 · 200 | **ja** |
| Mindestbreite | B6 | 30 cm | 30 cm | 30 cm | **ja** |
| Maximallänge | C6 | 700 cm | 700 cm | 700 cm | **ja** |
| one-color-Faktor (rechnet nicht mit) | W5 | 0,95 | 0,95 | 0,95 (mitgeführt) | **ja** |
| Formel Verkauf je Stück | G5 | IF-Kaskade · L5 · M5 · N5 · O5 + P5 | identisch | identisch | **ja** |
| Formel Verkauf gesamt | F5 | `=(E4*G5)-((E4-1)*P5)` | identisch | identisch | **ja** |
| Formel Einkauf je m² | J5 | IF-Kaskade (alle Zweige Q5) · Faktoren | identisch | identisch | **ja** |
| Formel Einkauf je Stück / gesamt | I5 / H5 | `=(D4*J5)+(P6)` / `=(D4*J5*E4)+(P6)` | identisch | identisch | **ja** |
| Fläche je Stück | D4 | `=B4*C4*0.01*0.01` | identisch | identisch | **ja** |

**Keine einzige Abweichung.** Der maschinelle Zellvergleich über den ganzen Rechenbereich
A1:W7 (Formeln **und** von Excel gespeicherte Ergebnisse) ergibt **0 Unterschiede**.

### Was sich tatsächlich geändert hat

| Bereich | Änderung | Preiswirkung |
|---|---|---|
| Zeilen 11–24, Spalten A/B und J/K | Erklärtexte je Zelle neu sortiert und ausführlicher: aus „Mattenmaße, werden vom Kunden eingegeben" wird „Mattenmaße **in cm**, werden vom Kunden bei der Anfrage eingegeben"; neu dabei der ausdrückliche Zusatz „**Artikelstammdaten der Matte**" bei C2, F1/I1/L1, F2, G5, Q7:V7 und R5:W5 | **keine** |
| Zeilen 26–41, Spalten A/B und J/K | **neu**: dieselbe Liste komplett auf Englisch | **keine** |
| Korrigierte Zellbezüge in der Legende | alt „G6 bis V6 = Standardmaße" → neu korrekt „**Q7 bis V7**"; alt „R6 bis W6" → neu „**R5 bis W5**"; der Eintrag „U4 bis U6" ist entfallen | **keine** (die Legende war vorher falsch beschriftet, die Formeln waren immer richtig) |
| Spalten AK bis BX | Zeilenbezüge um 13 Zeilen verschoben (z. B. `$AR$119` → `$AR$106`), weil in der neuen Mappe Zeilen gelöscht wurden | **keine** — alle betroffenen Zellen liefern in **beiden** Mappen 0 oder `#REF!`; es ist ein toter Notizbereich (Vergleich Shop-Preise, Rundungs-/Aussparungs-Notizen) |

Die neue Mappe bestätigt damit ausdrücklich, was der Code schon so umsetzt: Salesfactoren,
Colortype, EK-Preis, Standardmaße und Staffelfaktoren sind **Artikelstammdaten**, keine
Kundeneingaben.

---

## 2. Nachrechnung: rechnet der Code wie die neue Mappe?

Neues Prüfskript: `Frontend/bridge-demo/pruefe-preisformel-neu.mjs`
(Aufruf `node pruefe-preisformel-neu.mjs`, läuft ohne Netz und ohne npm-Pakete).
`preisformel.js` wurde **nicht** geändert.

**Wie die Sollwerte entstanden sind:** LibreOffice ist auf dem Rechner nicht installiert, deshalb
derselbe Weg wie beim bestehenden Prüfer: Die echten Formelstrings der **neuen** Mappe werden
gelesen und von einem eigenen kleinen Excel-Interpreter ausgewertet (Excel-Semantik: `IF` ohne
Else-Zweig liefert FALSCH, leere Zellen sind 0, „1,25" wird deutsch zu 1.25, eine Zahl ist im
Vergleich immer kleiner als Text). Der Interpreter kennt `preisformel.js` nicht — er ist eine
zweite, unabhängige Umsetzung. **Beweis, dass er richtig liegt:** Mit den in der Mappe
gespeicherten Eingaben liefert er für alle 17 Ergebniszellen exakt die Werte, die Excel selbst
in die Datei geschrieben hat, einschließlich der Gleitkomma-Reste (K5 = 50,860530000000004).

### Ergebnis

| | |
|---|---|
| geprüfte Fälle | **40** |
| davon stimmen | **40** |
| verglichene Einzelwerte | **629** (17 Größen je Preisfall) |
| Abweichungen | **0** |
| Zusatzprüfungen zur Logik | **10 von 10** bestanden |
| Toleranz | 1 · 10⁻⁹ relativ |

**Abdeckung der 40 Fälle:** Referenzfall der Mappe · Standardbreiten 60/85/115/150 gegen
Sondermaß · alle sechs Mengenstaffeln (1, 2, 3, 10, 20, 30) und Mengen dazwischen (5, 13, 25, 100)
· alle drei Colortypes und ein ungültiger · jede Sonderoption einzeln und kombiniert ·
Sonderfarbe bei Menge 1/2/10/30 · Teuerungszuschlag 7,5 % und 12 % · überschriebene Stammdaten
(EK-Listenpreis 61,90 €, Salesfactor 2,1, EK-Aufschlag 54 €) · die drei Fehlerfälle mit ihren
Grenzen (30/29 cm, 700/701 cm, beide > 200 cm) · krumme Maße · große Matte 200 × 650 · Menge 0.

**Gegenprobe:** Dieselben 40 Fälle wurden zusätzlich aus der **alten** Mappe gerechnet —
40 Fälle × 17 Zellen = **680 Werte, 0 Abweichungen zwischen alter und neuer Mappe.** Das ist der
zweite, unabhängige Beleg dafür, dass sich die Rechnung nicht geändert hat.

Der bestehende Prüfer `pruefe-preisformel.mjs` läuft unverändert weiter: **61 von 61 Fällen**
bestanden.

### Ein Hinweis zur Lesbarkeit der Prüfung

Beim Fall „Colortype 9 ungültig" liefert die Mappe in C2 den Wahrheitswert `FALSCH`
(die Rückfallzelle F19 ist leer). Excel liest `FALSCH` in jeder Rechnung als 0 — alle Geldzellen
darunter belegen das (Verkauf 0 €, Marge −39,33 €). `preisformel.js` führt dafür den Wert 0.
Das ist gleichwertig; im Prüfskript steht der Fall mit einer Erläuterung als 0 drin.

---

## 3. Der Einkaufsaufschlag je Sonderfarbe: 50 € oder 54 €?

**Die neue Mappe sagt 50 €.** Zelle P6 lautet unverändert
`=IF(($P$3="X"),"50","0")`, die Überschrift P2 nennt weiterhin „50,-€/68,-€". Die Zahl **54 kommt
in der gesamten neuen Mappe an keiner Stelle vor** (geprüft über alle 406 gefüllten Zellen).

Damit steht die mündliche Aussage des Auftraggebers vom 17.09.2026 („momentan 54 €") weiter
gegen die Mappe. Der Stand im Code ist:

| Ort | Wert | Begründung im Code |
|---|---|---|
| `preisformel.js`, `aufschlagSonderfarbeEK` | **50 €** | Mappenwert P5/P6, die geprüfte Quelle |
| `net-neu/assets/js/seite-produkt.js`, Zeile 136–141 | **54 €** | Kommentar: „in der Excel-Mappe stehen 50 EUR, der Auftraggeber nennt am 17.09.2026 aber 54 EUR (‚momentan')" |

Das ist bewusst so getrennt und bleibt vorerst richtig: Der Mappenwert steht in der Formel, der
abweichende Tageswert als Stammdatum am Artikel. **Nur: Der Shop rechnet damit heute mit 54 €,
die Mappe mit 50 €.**

**Was der Unterschied bewirkt** (nachgerechnet, Fall 31 und eine Zusatzprüfung):
Der Aufschlag betrifft **ausschließlich den Einkauf**, der Verkaufspreis für den Kunden ist in
beiden Fällen gleich. Beispiel 60 × 200 cm, 9 Stück, eine Sonderfarbe:

| | 50 € (Mappe) | 54 € (Shop) |
|---|---|---|
| Verkauf gesamt | 1.116,15 € | 1.116,15 € (**unverändert**) |
| Einkauf gesamt | 640,00 € | 644,00 € |
| Marge | 476,15 € | 472,15 € |

Der Aufschlag fällt wie in der Mappe **einmal je Auftrag** an, nicht je Stück — auch das ist
geprüft (Zusatzprüfung bei Menge 7: Unterschied genau 68,00 € im Verkauf und 50,00 € im Einkauf).

Offen bleibt zusätzlich die bereits gestellte Frage aus `FRAGE-SONDERFARBEN.md`: ob sich der
Betrag bei **mehreren** Sonderfarben vervielfacht. Die Mappe kennt nach wie vor nur das
Ankreuzfeld „ja/nein" in P3 — die neue Fassung ändert daran nichts. Der Code rechnet vorläufig
68 € je Farbe, weiterhin einmal je Auftrag.

---

## 4. Altsystem: rechnet es die Excel-Formel?

**Nein.** Das Altsystem kennt für Maßware genau eine Formel:
**Preis = Fläche in m² × Quadratmeterpreis** (zuzüglich pauschaler Attribut-Beträge in Euro).
Keine Mengenstaffel auf den m²-Preis, kein Sondermaß-Zuschlag, keine Sonderfarbe als Faktor,
kein Salesfactor, kein Teuerungszuschlag.

Basispfad im Folgenden:
`Backup/matten.de-2026-09-07/web` (unter der Projektwurzel).
Hinweis zur Struktur: Es gibt zwei Ebenen — `master/php/…` ist die Framework-Basis,
`php/…` der projektspezifische Override. Preisrelevant ist `php/Plugins/Katalog/`.

### Belegstellen

**Die Fläche** — `php/Plugins/Katalog/SpezialoptionSpezial.php`, Zeilen 408–418:

```php
public function getFlaeche(){
    if($this->getSpezialCalc() == "umf"){ ... }
    else { return $this->getX() * $this->getY(); }   // Fläche in m²
}
```

**Die eigentliche Rechenzeile** — `php/Plugins/Katalog/SpezialoptionSpezial.php`, Zeile **438**:

```php
return -1 * $artikel->getBasisPreis() + $this->getFlaeche() * $this->getQuadratmeterPreis();
```

(Zeile 440 dieselbe Rechnung für den Einkauf mit `getQuadratmeterPreisEk()`.) Das
`-1 * getBasisPreis()` ist ein Trick: `getAufpreis()` liefert nur die *Differenz* zum
Grundartikelpreis, der in `getPreis()` wieder dazukommt — `php/Plugins/Katalog/Artikel.php`,
Zeilen 1055–1066. Netto bleibt: **m² × Quadratmeterpreis + Attribut-Aufpreise.**
Kein Mindest-m², keine Zuschnittpauschale, keine Rundung auf Rollenbreiten.

**Mengenstaffel: vorhanden, wirkt aber nicht auf Maßware.**
`php/Plugins/Preisstaffeln/ArtikelPreisstaffelComponent.php`, Zeilen 30–63 — `getEinzelPreis()`
greift ausschließlich auf `artikel.preis` / `artikel.sonderpreis` zu, **nie** auf
`input_squaremeter_price`. Drei unabhängige Gründe, warum sie bei Maßware wirkungslos ist:

1. **Selbstauslöschung:** `getAufpreis()` ruft `getBasisPreis()` **ohne** Stückzahl auf
   (Zeilen 430/433/438/440), also ungestaffelt. Der Rabatt wirkt nur auf die Differenz zum
   Listenpreis, nicht auf den m²-Preis.
2. **Kein Artikel kombiniert beides:** Auszählung aus `datenbank/datenbank.sql` —
   alle **95** Artikel mit `spezialoption='spezial'` haben `preisstaffel='keine'`.
   Kein einziger Artikel hat `prozentual` + `spezial`.
3. **Die Produktseite zeigt die Staffel nie:** `php/Plugins/Katalog/ArtikelPage.php`, Zeile 297
   ruft `getPreis()` **ohne** Stückzahl; `js/artikel.form.js`, Zeilen 95–96 multipliziert den
   Einzelpreis nur mit der Stückzahl.

**Sondermaß-Zuschlag, Standard-/Rollenbreiten: nicht vorhanden.**
Volltextsuche nach `sonderma|rollenbreite|standardbreite|bahnenbreite` über `php/`, `master/`,
`js/` ergibt nur zwei Treffer ohne Preisbezug (`SpezialoptionSpezial.php:111` blendet
Attributfelder im Formular aus, `js/artikel.form.js:210` ist UI-Vorauswahl). Standardbreiten
existieren nur als **Freitext-Attributwerte** in `artikel_attribute`, z. B.
`(68,'Standard-Mattenbreite','60cm',…)` oder `(737,'Standardgröße','85cm x 150cm',45.30,…)` —
unstrukturierte Strings, nicht maschinenlesbar. Die Felder `minL/maxL/minB/maxB` dienen
**ausschließlich** der Anzeige und der Prüfung im Browser (`SpezialoptionSpezial.php:20,24,27–44`;
`js/artikel.form.js:188–201`), sie kommen in `getFlaeche()`/`getAufpreis()` nicht vor.

**Sonderfarbe, Sonderform, Salesfactor, Colortype: nicht vorhanden.**
Suche nach `sonderfarbe|sonderform|salesfactor|colortype|farbtyp` über `php/`, `master/`, `js/`:
**0 Treffer.** Es gibt nur den allgemeinen Attribut-Mechanismus
(`php/Plugins/Katalog/Artikel.php`, Zeilen 1322–1328, `getAttributePreis()`), der **absolute
Euro-Beträge je Attributwert** addiert — kein Faktor, nicht flächenabhängig. Beispiel
`(22,'Farbe','Grau',9.00,…)` = pauschal +9 €, unabhängig von der Größe.

**Teuerungszuschlag: nicht vorhanden.** Suche nach `teuerung|zuschlag|surcharge` im Preiscode:
**0 Treffer.** Die einzigen prozentualen Aufschläge sind die Umsatzsteuer und der
Nachnahme-Aufpreis (`php/Plugins/Katalog/Warenkorb.php:517`). Preiserhöhungen wurden offenbar
durch direktes Überschreiben von `input_squaremeter_price` je Artikel gemacht.

### Wären die Excel-Größen im Altsystem überhaupt abbildbar?

**Teilweise — und die Preis-Stammdaten liegen an einer unglücklichen Stelle.**

`artikel.spezialoption_data` (Schema: `datenbank/datenbankstruktur.sql`, Zeile 95, Typ `text`)
ist **kein JSON**, sondern ein **PHP-`serialize()`** eines `Spezialoption*`-Objekts
(`php/Plugins/Katalog/Spezialoption.php`, Zeilen 23–33). Darin existieren genau **17 Schlüssel**,
mehr nicht:

| Schlüssel | entspricht Excel | Getter in `SpezialoptionSpezial.php` |
|---|---|---|
| `input_squaremeter_price` | **Q5** (EK-Listenpreis je m², VK-Seite) | Zeile 263 |
| `input_squaremeter_price_ek` | EK-Variante | Zeile 273 |
| `input_squaremeter_price_gross` / `…_ek_gross` | Bruttovarianten | 268 / 278 |
| `input_scope_price` / `…_gross` | Preis je Laufmeter | 283 / 293 |
| `minL` / `maxL` / `minB` / `maxB` | **B6 / C6** (Mindest-/Maximalmaß) | 205 / 210 / 215 / 220 |
| `input_unit_factor` | Umrechnungsfaktor cm→m (100) | 258 |
| `unit`, `input_unit`, `desc`, `desc_x`, `desc_y`, `calc` | Beschriftung und Rechenart | 225–253 |

Es gibt also **Entsprechungen nur für Q5, B6 und C6**. Für Salesfactor/Colortype (F1/I1/L1/F2),
Sondermaß-Faktor (L5), Standardbreiten (Q7:V7), Sonderform (N5/O5), Sonderfarbe (P5/P6) und
Teuerungszuschlag (R2) existiert **kein Feld** — und auch kein Hook, in den man sie heute
einhängen könnte: `getAufpreis()` bekommt die Stückzahl nicht einmal übergeben.

`artikel_preisstaffeln` (`datenbank/datenbankstruktur.sql`, Zeilen 212–219) hat **nur drei
Spalten**: `artikel_id`, `anzahl`, `preis`. Die Bedeutung von `preis` hängt an
`artikel.preisstaffel` (`absolut` = Stückpreis, `prozentual` = Rabatt in %). Belegt sind nur
**46 Zeilen für 25 Artikel**. Keine m²-Staffel, keine Flächenspalte, kein Gültigkeitsdatum.

### Wo müsste man ansetzen, und wie aufwendig wäre das?

| Block | Dateien / Funktionen | Aufwand | Risiko |
|---|---|---|---|
| Neue Stammdatenfelder im Admin erfassen | `SpezialoptionSpezial.php` `getAdminForm()` 134–203 **und** die Feld-Whitelist in `parseAdminPost()` **Zeile 368** | 0,5–1 PT | gering |
| Die Formel ersetzen | `SpezialoptionSpezial.php` `getAufpreis()` 420–443 | 1 PT | gering |
| Sondermaß-/Rollenbreiten-Logik | ebenda, neu | 1–2 PT | mittel |
| **Stückzahl durchreichen** (Voraussetzung für jede m²-Staffel) | `Artikel.php` `getOptionenPreis()` 1283–1292, `getPreis()` 1055–1066, `getLieferantenOptionenPreis` 1299–1319, Basisklasse `Spezialoption.php:36`, Schwesterklassen `SpezialoptionFlaeche.php:216`, `SpezialoptionUmfang.php:204`, `SpezialoptionLaenge.php:151`, `ArtikelPage.php:297`, `js/artikel.form.js:95–96` | 2–3 PT | **hoch** |
| Eigene m²-Staffel (neue Tabelle + Component + Admin-UI) | `php/Plugins/Preisstaffeln/` | 2–3 PT | mittel |
| Stammdaten der Bestandsartikel nachtragen | Rollenbreiten existieren nur als Freitext in `artikel_attribute` | nicht schätzbar, fachliche Datenarbeit | hoch |

**Reine Entwicklung: etwa 7–10 Personentage**, zuzüglich Datenpflege.

**Was dagegen spricht:**
- Durchgängig `mysql_*`-Funktionen (`Artikel.php:1024`, `ArtikelPreisstaffelComponent.php:122`)
  → PHP ≤ 5.6/7.0, jeder Eingriff braucht die alte Laufzeit.
- Die Preis-Stammdaten liegen als **PHP-serialisiertes Objekt** in einem `text`-Feld: nicht per
  SQL auswertbar, Massenänderungen nur per PHP-Skript.
- Der teuerste Teil (Stückzahl durchreichen) ist ein Eingriff in den **zentralen Preispfad**
  einer Anwendung ohne Testabdeckung — er berührt alle 264 Maßware-Artikel sowie Warenkorb,
  Angebote, Rechnungen und Lieferantenpreise.
- Es gibt dort bereits einen Fehler derselben Art: `parseAdminPost()` Zeile 368 verliert zwei
  im Formular angezeigte EK-Felder, weil die Feldliste an drei Stellen doppelt gepflegt wird.

**Nebenbefund:** In `stammdaten` liegt ein verwaister Eintrag
`kalkulator_berechnungsanzeige` („Kalkulator Berechnungsformel anzeigen?"). Der zugehörige Code
existiert im Backup nicht (mehr) — Suche nach `kalkulator` ergibt 0 Treffer. Möglicherweise gab
es früher einen Kalkulator; belegen lässt sich das aus diesem Backup nicht.

---

## 5. Empfehlung — was der Auftraggeber entscheiden sollte

**Zur Formel ist nichts zu entscheiden.** Die neue Mappe ändert die Rechnung nicht. Der Code ist
gegen sie abgesichert (40 von 40 Fällen), der bestehende Prüfer läuft weiter (61 von 61).
Es besteht kein Handlungsbedarf und kein Anlass, `preisformel.js` anzufassen.

Drei Punkte brauchen eine Entscheidung:

1. **Einkaufsaufschlag Sonderfarbe: 50 € oder 54 €?** — *Die wichtigste der drei Fragen, weil
   heute zwei Werte im Umlauf sind.* Die Mappe sagt unverändert 50 €, der Shop rechnet mit 54 €.
   Der Kunde merkt davon nichts (der Verkaufspreis ist identisch), aber die **Marge** wird um
   4 € je Auftrag zu niedrig oder zu hoch ausgewiesen. Vorschlag: beim Auftraggeber bestätigen
   lassen, ob 54 € der gültige Wert ist. Falls ja, ist der saubere Weg, ihn in der **Mappe**
   nachzutragen — dann sind Mappe, Formel und Shop wieder dieselbe Wahrheit. Falls er sich
   ohnehin häufiger ändert, gehört er als Stammdatum je Artikel geführt (so wie heute in
   `seite-produkt.js`), und die Mappe sollte das vermerken.

2. **Mehrere Sonderfarben** (offene Frage aus `FRAGE-SONDERFARBEN.md`, seit 17.09.2026).
   Die neue Mappe kennt weiterhin nur „ja/nein". Solange die Antwort fehlt, rechnet der Code
   68 € je Farbe, einmal je Auftrag — das ist eine **Annahme**, keine belegte Vorgabe.

3. **Altsystem anpassen oder nicht?** Klare Empfehlung: **nicht.** Das Altsystem rechnet eine
   grundlegend andere, einfachere Formel. Sie dort nachzubauen kostet 7–10 Personentage im
   zentralen Preispfad einer PHP-5-Anwendung ohne Tests, mit Wirkung auf alle Maßware-Artikel
   und auf Angebote, Rechnungen und Lieferantenpreise. Im neuen System ist die Formel bereits
   fertig, geprüft und belegt. Wenn die Umstellung ohnehin ansteht, sollte die Excel-Formel
   dort bleiben.

**Hinweis zur Wirkung:** Dass das Altsystem anders rechnet, heißt, dass neue und alte Seite für
dieselbe Matte **verschiedene Preise** nennen — die Excel-Formel ist bei Sondermaßen, Sonderform
und Sonderfarbe teurer, bei größeren Mengen durch die Staffel günstiger. Solange beide Systeme
parallel erreichbar sind, sollte klar sein, welches der Kunde sieht.

---

## Dateien zu diesem Abgleich

| Datei | Rolle |
|---|---|
| `1PREISE-Brian_Sehorz-26-09-30_18-55.xlsx` | neue Mappe, Projektwurzel, geliefert 30.09.2026 |
| `Frontend/PREISE-Brian-26-10_22-11.xlsx` | bisherige Grundlage (Stand August) |
| `Frontend/bridge-demo/public/preisformel.js` | Umsetzung — **unverändert** |
| `Frontend/bridge-demo/pruefe-preisformel.mjs` | bestehender Prüfer gegen die alte Mappe, 61/61 |
| `Frontend/bridge-demo/pruefe-preisformel-neu.mjs` | **neu** — Prüfer gegen die neue Mappe, 40/40 |
| `Frontend/_arbeit/FRAGE-SONDERFARBEN.md` | offene Rückfrage mehrere Sonderfarben |
