# Abnahme der nachgebesserten Preisformel

Prüfung am 02.10.2026, unabhängig nachgerechnet gegen
`Frontend/bridge-demo/public/preisformel.js` und `SOLLWERTE.json`.
Geprüft wurde ausschließlich im lokalen Altsystem (localhost:8080).
**Es wurde kein Produktivcode geändert.**

Alle Messungen liefen über eigene Prüfskripte im Webverzeichnis, die nach
jedem Lauf sofort gelöscht wurden (Belege unter „Aufräumen").

---

## Urteil in einem Satz

Die fünf gemeldeten Fehler sind **alle fünf weg**. Dabei sind aber
**drei neue Fehler** entstanden bzw. unentdeckt geblieben, davon
**einer schwerwiegend** (Faktor 1000 beim Salesfactor).

---

## Die fünf Fehler — einzeln nachgeprüft

### Fund 1 — Mengenstaffel-Text `1:1,2:0,95,3:0,92` → **weg**

Der Kernfall stimmt. Ohne Leerzeichen wird korrekt zerlegt:

| Eingabe | gelesene Stufen |
|---|---|
| `1:1,2:0,95,3:0,92` | 3⇒0,92 · 2⇒0,95 · 1⇒1 |
| `1:1, 2:0,95, 3:0,92` | 3⇒0,92 · 2⇒0,95 · 1⇒1 |

Faktor für Stufe 1 ist **1,00** (vorher fälschlich 1,2):

```
Menge 1 -> Faktor 1     (Schwelle 1)
Menge 2 -> Faktor 0.95  (Schwelle 2)
Menge 3 -> Faktor 0.92  (Schwelle 3)
Menge 5 -> Faktor 0.92  (Schwelle 3)
```

Zusätzlich geprüft und in Ordnung: Tabulatoren, Semikolon, Zeilenumbruch,
doppelte Stufen (wird gemeldet), falsche Reihenfolge (wird sortiert),
führende Nullen (`01:1, 02:0,95` → 2⇒0,95 · 1⇒1), `1:1,0`, `1:1,00`,
nur eine Stufe, leere Eingabe, 12 Stufen, Schwelle 0, Schwelle negativ,
Faktor 0, Faktor negativ, Faktor > 1, Punkt als Dezimalzeichen,
Leerzeichen um den Doppelpunkt, Unsinn dazwischen.

→ **Aber:** zwei Schreibweisen führen weiterhin zu stillen Zahlenfehlern,
siehe **Neuer Fund 1** und **Neuer Fund 2**.

### Fund 2 — Preis 0,00 € bei Staffel ohne Stufe 1 → **weg**

Zwei Sicherungen greifen und wurden beide einzeln bestätigt:

1. `pruefeMengenstaffel()` ergänzt die fehlende Stufe 1 mit Faktor 1.
   `3:0,92, 10:0,9` wird gelesen als 10⇒0,9 · 3⇒0,92 · **1⇒1**.
2. Fehlt trotzdem eine Stufe, bricht `Preisformel::berechne()` mit
   `KEINE_STAFFELSTUFE` ab und der Aufrufer fällt auf die alte Rechnung.

Gemessen mit Staffel `3:0,92, 10:0,9` (60 × 100 cm):

| Menge | vkGesamt | vkProStück |
|---|---|---|
| 0 | Fehler `KEINE_STAFFELSTUFE` | — |
| −1 | Fehler `KEINE_STAFFELSTUFE` | — |
| 1 | 63,2943 | 63,2943 |
| 2 | 126,5886 | 63,2943 |
| 3 | 174,6923 | 58,2308 |
| 99 | 5.639,5237 | 56,9649 |
| 1.000.000 | 56.964.886,20 | 56,9649 |

Kein Preis 0,00 € mehr — in keinem Fall. Auch geprüft: Staffel nur aus
einer hohen Schwelle (`100:0,8`), alle Stufen unplausibel
(`0:5, -3:2, 2:0` → Liste leer, Vorgabe greift), Menge 1,5.

### Fund 3 — Negative Preise → **weg**

`rechneKorrektur()` blockiert jede Korrektur, die den Preis auf 0 oder
darunter zieht, und meldet `ok = false`; `getAufpreis()` fällt dann auf die
alte Rechnung zurück.

Grundpreis 100,00 €:

| Korrektur | Ergebnis | ok |
|---|---|---|
| `-200` | 100,00 (unverändert) | false |
| `-150%` | 100,00 (unverändert) | false |
| `-100%` | 100,00 (unverändert) | false |
| `-101%` | 100,00 (unverändert) | false |
| `-1000%` | 100,00 (unverändert) | false |
| `-99,99%` | 0,01 | true |
| `-5` | 95,00 | true |

Winzige Matte, Grundpreis 3,00 € (hier zöge schon `-5` unter null):

| Korrektur | Ergebnis | ok |
|---|---|---|
| `-5` | 3,00 (unverändert) | false |
| `-3` | 3,00 (unverändert) | false |
| `-3,00` | 3,00 (unverändert) | false |
| `-100%` | 3,00 (unverändert) | false |
| `-2,99` | 0,01 | true |
| `-99%` | 0,03 | true |

Zusätzlich greift in `Preisformel::berechne()` eine zweite Sicherung
(`PREIS_NULL`), die auch negative Stammgrößen abfängt — geprüft mit
Sondermaß-Faktor 0 und −1,25, Sonderform 0 und −1,5, Sonderfarbe −68,
Teuerungszuschlag −100 und −150: in allen Fällen Fehler statt Minuspreis.

### Fund 4 — ArtikelPage: ohne Schalter nichts ändern → **weg**

`ArtikelPage.php` reicht die Menge nur durch, wenn für **diesen** Artikel
der Schalter an ist (`$pf_menge`, Zeile 305–313). Scharf geprüft an
Artikel 6 mit künstlich eingehängter Preisstaffel (prozentual, 5:−10 %,
10:−20 %, 25:−30 %; nur im Speicher, kein `save()`):

```
Schalter AUS:
  n=1   ArtikelPage getPreis(pf=1)=59,2000   getPreis(n)=59,2000
  n=2   ArtikelPage getPreis(pf=1)=59,2000   getPreis(n)=59,2000
  n=5   ArtikelPage getPreis(pf=1)=59,2000   getPreis(n)=56,1900
  n=10  ArtikelPage getPreis(pf=1)=59,2000   getPreis(n)=53,1800
  n=25  ArtikelPage getPreis(pf=1)=59,2000   getPreis(n)=50,1700
```

Die Spalte, die die Produktseite tatsächlich anzeigt, bleibt **konstant bei
59,20 €** — obwohl eine Preisstaffel hinterlegt ist. Genau das war die
Zusage. Ebenfalls geprüft: Artikel ohne `artikel_preisstaffeln`
(6, 511, 556, 550, 505) und Artikel mit Einträgen (241–247, 225) —
überall `getPreis(1) == ArtikelPage(n=5)`.

→ **Aber:** mit eingeschaltetem Schalter rechnet dieselbe Kette doppelt
Rabatt, siehe **Neuer Fund 3**.

### Fund 5 — 115 cm → **weg**

`gleichesMass()` vergleicht mit 0,001 cm Toleranz, `berechnePreisformel()`
rundet den Rückweg Meter → Zentimeter auf vier Stellen. Alle sechs
Standardbreiten treffen, alle Nachbarwerte nicht:

| cm | intern (m) | zurück (cm) | L5 | Standardbreite? |
|---|---|---|---|---|
| 59 | 0,58999999999999997 | 59,0 | 1,25 | nein |
| **60** | 0,59999999999999998 | 60,0 | **1** | ja |
| 61 | 0,60999999999999999 | 61,0 | 1,25 | nein |
| **75** | 0,75 | 75,0 | **1** | ja |
| **85** | 0,84999999999999998 | 85,0 | **1** | ja |
| 114 | 1,1399999999999999 | 113,99999999999999 | 1,25 | nein |
| **115** | 1,1499999999999999 | **114,99999999999999** | **1** | ja |
| 116 | 1,1599999999999999 | 115,99999999999999 | 1,25 | nein |
| **150** | 1,5 | 150,0 | **1** | ja |
| **200** | 2 | 200 | **1** | ja |

Die kritische Zeile ist 115: intern kommt `114,99999999999999` zurück und
wird trotzdem als Standardbreite erkannt. Ohne die Toleranz wären das
25 % Sondermaß-Aufschlag.

Krumme Werte 35, 55, 95, 105, 145, 185, 215 sowie 30, 74, 76, 84, 86, 144,
146, 149, 151, 184, 186, 199, 214: alle korrekt 1,25. Kein Wert wird
fälschlich als Standardbreite gelesen.

**Der Vergleich gilt für beide Seiten** — mit Breite 300 (kein Standard)
und der Länge als Treffer:

```
Laenge 60  -> L5=1     soll=1     ok
Laenge 75  -> L5=1     soll=1     ok
Laenge 85  -> L5=1     soll=1     ok
Laenge 115 -> L5=1     soll=1     ok
Laenge 150 -> L5=1     soll=1     ok
Laenge 200 -> L5=1     soll=1     ok
Laenge 114 -> L5=1.25  soll=1.25  ok
Laenge 116 -> L5=1.25  soll=1.25  ok
```

Wo die Toleranz kippt: ab 115,001 bzw. unter 114,999 gilt Sondermaß.
Das ist ein Hundertstel Millimeter und sachlich unbedenklich.

---

## Neue Fehler

### Neuer Fund 1 — Jede Zahl mit genau drei Nachkommastellen wird 1000× zu groß ⚠️ schwerwiegend

**Eingabe:** Im Admin-Feld „Salesfactor mehrfarbig" steht `1,931` —
genau der Wert aus der Excel-Mappe (Zelle F1) und genau die Schreibweise,
die das Bau-Hilfsskript `_schalte_formel.php` selbst verwendet.

**Erwartet:** Salesfactor 1,931 · Shop-Preis für 100 × 100 cm = **131,86 €**

**Tatsächlich:** Salesfactor **1931** · Shop-Preis = **131.863,16 €**

```
Eingetragen: pf_sf_mehrfarbig = '1,931'
Gelesener Salesfactor: 1931            (Soll: 1.931)
pruefePreisformel maengel: 0  -> KEINE MELDUNG
Shop-Preis 100x100cm: 131,863.16 EUR
```

Die JS-Referenz bestätigt beide Zahlen — 131,8632 ist richtig,
131863,1625 ist genau der Faktor 1000:

```
JS 100x100 n=1, Salesfactor 1.931 -> vkGesamt: 131.8632
JS mit Salesfactor 1931            -> vkGesamt: 131863.1625
```

**Ursache:** `Preisformel::loeseTrennzeichen()` liest ein einzelnes Komma
oder einen einzelnen Punkt als **Tausendertrenner**, sobald dahinter genau
drei Ziffern stehen. Der Kommentar nennt das bewusst für „1.234", trifft
aber jeden Dreistellen-Dezimalwert:

```
'1,931'  -> 1931.0      '54,630' -> 54630
'1,728'  -> 1728.0      '1,250'  -> 1250
'0,089'  -> 89.0        '68,000' -> 68000
'1,000'  -> 1000.0      '2,500'  -> 2500
'1,9310' -> 1.931   (vier Stellen => richtig)
'1,93'   -> 1.93    (zwei Stellen => richtig)
```

**Betroffen sind alle Zahlenfelder der Maske**, nicht nur der Salesfactor:
`pf_sf_mehrfarbig` (1,931), `pf_sf_einfarbig` (1,728), `pf_ek_qm`,
`pf_tz_prozent`, `pf_f_sondermass`, `pf_sonderfarbe_vk`/`_ek`,
`pf_min_breite`, `pf_max_laenge`.

**Besonders heikel:** `pruefePreisformel()` meldet **null Mängel** —
1931 ist eine gültige Zahl. Der Auftraggeber bekommt keinen roten Hinweis,
die Probe-Rechnung zeigt den 1000-fachen Preis als scheinbar gültiges
Ergebnis, und der Preis geht so in den Shop. Die Sicherung `PREIS_NULL`
greift nicht, weil der Preis nicht zu klein, sondern zu groß ist.

**Die Maske lockt in den Fehler:** Das Platzhalter-Attribut gibt den
Vorgabewert als PHP-Float aus (`SpezialoptionSpezial.php`, Zeile 280),
also `1.931` in englischer Schreibweise. Tippt der Auftraggeber den
Platzhalter ab, erhält er ebenfalls 1931 — `'1.931' -> 1931`. Beide
naheliegenden Schreibweisen sind falsch; nur `1,93` (ungenau) oder
`1,9310` (unintuitiv) ergeben das Richtige.

**So löst man ihn aus:** Artikel mit Spezialoption `spezial` öffnen,
Preisformel auf „Ja", EK-Listenpreis `54,63`, Salesfactor mehrfarbig
`1,931` eintragen, speichern, Produktseite aufrufen.

**Indiz, dass der Fehler beim Bauen aufgefallen ist, aber nicht behoben
wurde:** Im gespeicherten Datensatz von Artikel 459 steht
`pf_sf_mehrfarbig = '1,93'` — der auf zwei Stellen gekürzte Wert, nicht
der Mappenwert 1,931.

### Neuer Fund 2 — Nachlaufendes Komma in der Mengenstaffel verschluckt eine Stufe still

**Eingabe:** `1:1, 2:0,95,` (Komma am Ende, beim Tippen leicht passiert)

**Erwartet:** Stufen 2⇒0,95 und 1⇒1; Preis für 2 Stück (60 × 100 cm)
**120,2592 €**

**Tatsächlich:** nur Stufe 1⇒1; Preis für 2 Stück **126,5886 €**
(5,26 € zu teuer bzw. 6,33 € Rabatt fallen weg)

```
Eingabe                | Stufen  | M1        M2         M3
'1:1, 2:0,95,'         | 1 Stufe | 63.2943   126.5886   189.8830
'1:1, 2:0,950'         | 1 Stufe | 63.2943   126.5886   189.8830
korrekt ('1:1, 2:0,95')| 2 Stufen| 63.2943   120.2592   180.3888
```

**Ursache:** Dasselbe Dreistellen-Problem wie in Neuer Fund 1. Durch das
nachlaufende Komma liest `alsZahl()` den Faktor als `0,95,` → **95**.
Die Stufe fällt dann in die Prüfung „Faktor größer als 1" und wird
**verworfen** — die Staffel verliert sie, der Rest rechnet weiter.
Gleiches gilt für die ausgeschriebene Form `2:0,950` → Faktor 950.

Ein roter Hinweis erscheint in der Admin-Maske („der Faktor 95 ist größer
als 1 …"), aber die Meldung nennt eine Zahl, die der Auftraggeber nirgends
eingegeben hat, und **der falsche Preis ist trotzdem live**, solange er
den Hinweis nicht liest. Der Mangel-Text ist zudem irreführend: er legt
einen Tippfehler im Faktor nahe, nicht ein überzähliges Komma.

Verwandter Fall, ebenfalls irreführend gemeldet:
`1,5:0,95` → erzeugt eine **Stufe 5⇒0,95**, die niemand eingetragen hat,
und meldet dazu `"1" ist keine Stufe`.

**So löst man ihn aus:** Im Feld „Mengenstaffel" `1:1, 2:0,95,` eintragen
(oder `2:0,950`), speichern, Preis für 2 Stück ansehen.

### Neuer Fund 3 — Schalter EIN + alte Preisstaffel: Rabatt wird doppelt abgezogen

**Eingabe:** Artikel mit Spezialoption `spezial`, Preisformel auf „Ja",
und zusätzlich eine gepflegte `artikel_preisstaffeln`
(prozentual, 5:−10 %, 10:−20 %, 25:−30 %)

**Erwartet:** Es gilt die Preisformel. Der Stückpreis ist der Formelwert —
die alte Preisstaffel ist eine andere Rabattlogik und darf nicht
zusätzlich greifen.

**Tatsächlich:** Beide Rabatte wirken übereinander:

| Menge | Formel (Soll) | Shop (Ist) | Abweichung |
|---|---|---|---|
| 1 | 131,8632 | 131,8632 | 0,0000 |
| 2 | 125,2700 | 125,2700 | −0,0000 |
| 5 | 121,3141 | **118,3041** | **−3,0100** |
| 10 | 118,6768 | **112,6568** | **−6,0200** |
| 25 | 117,3582 | **108,3282** | **−9,0300** |

**Ursache, rechnerisch belegt:**
`Artikel::getPreis($n)` = `getBasisPreis($n)` + `getAufpreis($n)`.
`getAufpreis()` zieht aber `$artikel->getBasisPreis()` **ohne Argument**
ab (`SpezialoptionSpezial.php`, Zeile 1032/1036), also immer die
Menge-1-Variante. Nur wenn `getBasisPreis(1) == getBasisPreis($n)` hebt
sich das auf. Mit Preisstaffel tun sie das nicht, und die Differenz
schlägt unverändert auf den Formelpreis durch:

```
n=5   Abweichung=-3.0100   vorhergesagt=-3.0100   passt zur Erklaerung
n=10  Abweichung=-6.0200   vorhergesagt=-6.0200   passt zur Erklaerung
n=25  Abweichung=-9.0300   vorhergesagt=-9.0300   passt zur Erklaerung
```

(`vorhergesagt` = `getBasisPreis($n) − getBasisPreis(1)`.)

**Gegenprobe ohne Preisstaffel** — dort ist die Formel exakt, was zeigt,
dass die Preisstaffel die einzige Ursache ist:

```
n=1   soll=131.8632  ist=131.8632  Abw=0.0000   ok
n=2   soll=125.2700  ist=125.2700  Abw=-0.0000  ok
n=5   soll=121.3141  ist=121.3141  Abw=-0.0000  ok
n=10  soll=118.6768  ist=118.6768  Abw=0.0000   ok
n=25  soll=117.3582  ist=117.3582  Abw=-0.0000  ok
n=30  soll=116.0396  ist=116.0396  Abw=-0.0000  ok
```

**Einordnung:** Heute tritt der Fehler nicht auf — in der Datenbank hat
**kein** Artikel gleichzeitig `spezialoption='spezial'` und eine echte
Preisstaffel (geprüft: 540 Artikel `keine`, 6 `absolut`, 34 `prozentual`,
Schnittmenge mit `spezial` leer). Er wird in dem Moment scharf, in dem der
Auftraggeber bei einem Formel-Artikel eine Preisstaffel pflegt — und dann
still, ohne Hinweis in der Maske.

`ArtikelPage.php` kommentiert dieses Zusammenspiel ausdrücklich
(Zeile 295–304) und sichert den Fall „Schalter aus" korrekt ab; der Fall
„Schalter an **und** Preisstaffel" ist dort nicht bedacht.

---

## Weitere Prüfpunkte

### 60/60 gegen SOLLWERTE.json — **stimmen**

```
Ergebnis: 60 ok / 0 fehler  (von 60)
```

Verglichen wurden `vkProStueck`, `vkGesamt` und `ekGesamt` mit einer
Toleranz von 1e−7. Enthalten sind Sonderform ohne/mit Rand,
Sonderfarbe mit 1 und 2 Farben, Standardmaß und Sondermaß, Mengen 1 und 2.

### Rückfall centgenau — **stimmt**

Die Messung aus `MESSUNG-VORHER.txt` wurde eins zu eins wiederholt
(12 Artikel × 4 Maß-/Mengen-Fälle = 48 Messwerte, je Preis, Lieferanten-
preis und Optionenpreis) und maschinell verglichen:

```
vorher 48  nachher 48
Abweichungen: 0  => RUECKFALL CENTGENAU
```

Stichprobe über HTTP: `/logomatten/6300201-logomatte` zeigt **125,53 €**,
wie in `PREISE-VORHER.txt`.

### Neue Stammdaten-Prüfung `pruefePreisformel()` — erkennt viel, aber nicht alles

**Erkennt zuverlässig** (roter Hinweis, Formel fällt auf alten Preis zurück):
EK-Listenpreis 0 und negativ, EK als Text (`abc`, `54,63 EUR`),
Salesfactor 0 und negativ, Mindestbreite > Maximallänge, Maximallänge 0,
Standardbreiten unlesbar/negativ/zu klein, Mengenstaffel unlesbar,
Mengenstaffel-Faktor > 1, Korrektur `-200` / `-100%` / `abc`,
Sondermaß-Faktor 0 und negativ, Teuerungszuschlag −100 und −200.

**Meckert nicht fälschlich**, wenn alles stimmt — geprüft mit korrektem
Satz, mit komplett leeren Feldern (Vorgabe greift, Probe 131,86 €),
mit Korrektur `+5` und `-5%` und mit Teuerungszuschlag `7,5`:
jeweils **0 Mängel**.

**Lücken** (kein Hinweis, obwohl der Wert unplausibel ist):

| Eingabe | Mängel | Wirkung |
|---|---|---|
| Salesfactor `1,931` | **0** | Preis 1000× zu hoch (Neuer Fund 1) |
| Sonderform ohne Rand `0` | 0 | Sonderform-Preis fällt still auf alte Rechnung |
| Sonderform mit Rand `-1,5` | 0 | dito |
| Sonderfarbe Verkauf `-68` | 0 | dito |
| Mindestbreite `0` / `-30` | 0 | Mindestmaß wirkungslos |
| Mengenstaffel `3:0,92` (ohne Stufe 1) | 0 | gewollt (Stufe 1 wird ergänzt) |

Die drei Sonderform-/Sonderfarben-Fälle sind heute harmlos, weil das
Altsystem dafür keine Eingabefelder hat; sie werden relevant, sobald die
Felder kommen. Die Mindestbreite 0 ist sofort wirksam.

### PHP-Protokoll — **sauber**

Keine Warnung, kein Notice, kein Fatal Error aus den Prüfläufen —
weder im Skript (alle 15 Läufe ohne Ausgabe auf stderr) noch über HTTP:

```
docker compose logs web --since 3m | grep -iE "warning|notice|fatal|deprecat|error"
   (leer)
```

Im älteren Protokoll (20:24–20:33 Uhr) stehen drei Fatal Errors, die
**nicht** aus dieser Prüfung stammen, sondern aus den Hilfsdateien des
Bauens (`_pruef_unabhaengig.php`, `_schalte_formel.php`, `_schalte_aus.php`
— „Call to undefined method Spezialoption::…"). Die Dateien liegen heute
unter `entfernte-hilfsdateien/` und sind im Webverzeichnis nicht mehr
vorhanden.

---

## Offener Punkt: Testdaten im System

`Frontend/_arbeit/AUFTRAG-PREISFORMEL-BACKEND.md` verlangt unter Grundsatz 4,
nach dem Prüfen nichts im System zu hinterlassen. **Artikel 459 (`6300000`)
trägt noch gespeicherte Testwerte und hat die Preisformel eingeschaltet:**

```
pf_aktiv           = '1'
pf_ek_qm           = '54,63'
pf_colortype       = '1'
pf_sf_mehrfarbig   = '1,93'
pf_standardbreiten = '60, 75, 85, 115, 150, 200'
pf_tz_prozent      = '0'
pf_mengenstaffel   = '1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88'
```

Folge: `/fussmatten/standard-schmutzfangmatten/6300000` zeigt
**156,84 € brutto** statt der **123,37 €** aus `PREISE-VORHER.txt`
(netto 131,7949 € nach Formel gegenüber 128,57 € nach alter Rechnung).

Das ist **kein Rückfall-Fehler** — der Schalter steht absichtlich auf „Ja",
und so soll die Formel dann auch rechnen. Es ist aber ein Rest aus dem Bauen,
der entweder bewusst stehen bleiben oder zurückgesetzt werden muss.
**Ich habe ihn nicht angefasst** (keine Artikeländerung im Prüfauftrag).

---

## Aufräumen — Belege

* **Keine Datei im Webverzeichnis:**
  `ls Backup/matten.de-2026-09-07/web/_*.php` → `no matches found`
  (geprüft nach jedem einzelnen Lauf; jedes Prüfskript wurde unmittelbar
  nach dem Lauf im selben Befehl gelöscht, inkl. der Hilfsdatei `_sw.json`).
* **Keine Artikel geändert:** Alle Schreibzugriffe liefen ausschließlich
  über `set()` am Objekt im Speicher, nie `save()`. Die Preisstaffel aus
  Fund 4 und Neuer Fund 3 wurde über `setStaffel()` nur im Speicher
  eingehängt — die Tabelle `artikel_preisstaffeln` wurde nicht beschrieben.
* **Keine Bestellungen, keine Anfragen angelegt.** `POST /api/kasse/bestellen`
  wurde nicht aufgerufen; alle HTTP-Zugriffe waren `GET` auf Produktseiten.
* **Kein Produktivcode geändert.** Die vier betroffenen Dateien sind
  unverändert; gearbeitet wurde nur lesend.
