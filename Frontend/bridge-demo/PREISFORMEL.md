# Die Preisformel

Diese Datei beschreibt die Kalkulation aus

> `PREISE-Brian-26-10_22-11.xlsx` · Blatt **Blatt1** · Bereich `A1:W7`

und ihre Umsetzung als JavaScript-Modul.

| Datei | Zweck |
|---|---|
| `public/preisformel.js` | Das Rechenmodul. Ohne Abhängigkeiten, läuft im Browser und in Node. |
| `pruefe-preisformel.mjs` | Prüft das Modul gegen die Tabelle. `node pruefe-preisformel.mjs` |
| `public/rechner.html` | Konfigurator im Mattenfuchs-Design. `http://localhost:8787/rechner.html` |

---

## 1. Die Formel in Prosa

Der Kunde gibt bei der Anfrage vier Dinge an: **Breite** und **Länge** der Matte
in Zentimetern, die **Menge** und den **Colortype**. Dazu kommen drei
Ankreuzfelder – Sonderform ohne Rand, Sonderform mit Rand und Sonderfarbe. In
der Tabelle trägt man dort ein `X` ein.

Aus Breite und Länge ergibt sich die Fläche einer Matte in Quadratmetern.
Diese Fläche wird mit dem **Einkaufs-Listenpreis pro Quadratmeter** (54,63 €)
multipliziert – das ist der reine Materialwert.

Auf den Materialwert legt sich der **Salesfactor**. Er hängt allein an der
Mattenqualität, dem Colortype: mehrfarbig 1,931 · einfarbig 1,728 ·
Ped-Print 1,8. Der Salesfactor macht aus dem Einkauf den Verkauf.

Danach greift die **Mengenstaffel**: ab 2 Stück 5 % Nachlass, ab 3 Stück 8 %,
ab 10 Stück 10 %, ab 20 Stück 11 %, ab 30 Stück 12 %. Bei einem einzelnen Stück
gibt es keinen Nachlass.

Auf das Ergebnis kommt der **Teuerungszuschlag TZ %**, derzeit 0 %.

Dann folgen vier Zuschlagsfaktoren, die sich schlicht multiplizieren:

* **Sonderbreite** – trifft weder Breite noch Länge exakt eine der sechs
  Standardbreiten 60 / 75 / 85 / 115 / 150 / 200 cm, muss aus der Rolle
  geschnitten werden: **× 1,25**. Trifft mindestens eine der beiden Seiten
  eine Standardbreite, ist der Faktor 1.
* **Sonderlänge** – dient nur der Größenprüfung, der Faktor ist immer 1.
* **Sonderform ohne Rand** – **× 1,3**
* **Sonderform mit Rand** – **× 1,5**

Zum Schluss kommt bei **Sonderfarbe** ein fester Betrag obendrauf: 68 € im
Verkauf, 50 € im Einkauf. **Dieser Betrag fällt pro Auftrag an, nicht pro
Stück.** Er steckt zwar im Stückpreis, wird in der Gesamtsumme aber wieder
herausgerechnet.

---

## 2. Die Formel formal

```
D4  qm je Stück          = Breite × Länge × 0,01 × 0,01
C2  Salesfactor          = Colortype 1 → F1 · 2 → I1 · 3 → L1 · sonst → F19 (leer = 0)
S2  TZ-Faktor            = 1 + R2/100

L5  Faktor Sonderbreite  = "zu schmal"        wenn Breite < B6 ODER Länge < B6
                         = 1                  wenn Breite ODER Länge exakt einer
                                              Standardbreite Q7..V7 entspricht
                         = 1,25               sonst

M5  Faktor Sonderlänge   = "Matte zu breit"   wenn (Breite > V7 UND Länge = C6)
                                              oder (Breite > V7 UND Länge > V7)
                         = "Matte zu lang"    wenn (Breite ≤ V7 UND Länge > C6)
                                              oder (Breite > C6 UND Länge ≤ V7)
                         = 1                  sonst

N5  Sonderform ohne Rand = 1,3  wenn N3 = "X",  sonst 1
O5  Sonderform mit Rand  = 1,5  wenn O3 = "X",  sonst 1
P5  Aufschlag VK         = 68   wenn P3 = "X",  sonst 0
P6  Aufschlag EK         = 50   wenn P3 = "X",  sonst 0

    Staffelfaktor        = Menge ≥ 30 → 0,88 · ≥ 20 → 0,89 · ≥ 10 → 0,90
                           ≥  3 → 0,92 · ≥  2 → 0,95 · ≥  1 → kein Faktor

G5  VK je Stück          = (qm × Q5 × C2 × Staffelfaktor × S2) × L5 × M5 × N5 × O5 + P5
F5  VK gesamt            = Menge × G5 − (Menge − 1) × P5
J5  EK je qm             = Q5 × L5 × M5 × N5 × O5
I5  EK je Stück          = qm × J5 + P6
H5  EK gesamt            = qm × J5 × Menge + P6
K5  Marge                = F5 − H5
D6  qm gesamt            = qm × Menge
E6  Listenpreis je Stück = qm × Q5 × C2 × S2 + P5
```

Die Mengenstaffel und der Teuerungszuschlag wirken **nur auf den Verkauf**.
Die vier Zuschlagsfaktoren `L5 · M5 · N5 · O5` wirken auf **Verkauf und
Einkauf** gleichermaßen.

**Referenzfall der Mappe** – 50 × 200 cm, 1 Stück, Colortype 1, keine
Sonderoptionen:

| Zelle | Größe | Wert |
|---|---|---|
| D4 | qm je Stück | 1,000 |
| C2 | Salesfactor | 1,931 |
| G5 | VK je Stück | 105,49053 € |
| F5 | VK gesamt | 105,49053 € |
| J5 | EK je qm | 54,63 € |
| I5 | EK je Stück | 54,63 € |
| H5 | EK gesamt | 54,63 € |
| K5 | Marge | 50,86053 € |
| D6 | qm gesamt | 1,000 |

---

## 3. Konstanten und ihr Excel-Zellbezug

Alle Werte werden laut Mappe (Zeilen 11–24, die Erläuterungen des Kunden)
**bei der Artikelanlage vorgegeben**. Im Modul stehen sie in `KONSTANTEN` und
sind je Aufruf überschreibbar:

```js
berechne({ breite: 50, laenge: 200, menge: 1, colortype: 1 },
         { ekListenpreisProQm: 61.90, tzProzent: 5 });
```

| Zelle | Feld im Modul | Wert | Bedeutung |
|---|---|---:|---|
| `F1` | `salesfactorMehrfarbig` | 1,931 | Salesfactor Colortype 1 – „more colors" |
| `I1` | `salesfactorEinfarbig` | 1,728 | Salesfactor Colortype 2 – „one-color" |
| `L1` | `salesfactorPedPrint` | 1,8 | Salesfactor Colortype 3 – „ped-print" |
| `F19` | `salesfactorFallback` | 0 | Rückfall in `C2`; die Zelle ist leer → siehe offene Frage 2 |
| `Q5` | `ekListenpreisProQm` | 54,63 | Einkaufs-Listenpreis pro m² |
| `R2` | `tzProzent` | 0 | Teuerungszuschlag in Prozent |
| `B6` | `minBreite` | 30 | „min.width" – gilt für **beide** Seiten |
| `C6` | `maxLaenge` | 700 | „max.length" |
| `Q7…V7` | `standardbreiten` | 60, 75, 85, 115, 150, 200 | Standardbreiten der Rolle |
| `Q6…V6` | `mengenstaffel[].schwelle` | 1, 2, 3, 10, 20, 30 | Mengenschwellen |
| `R5…V5` | `mengenstaffel[].faktor` | 0,95 · 0,92 · 0,90 · 0,89 · 0,88 | Staffelfaktoren |
| `L5` | `faktorSondermass` | 1,25 | Zuschlag, wenn keine Seite Standardbreite ist |
| `N5` | `faktorSonderformOhne` | 1,3 | Sonderform ohne Rand |
| `O5` | `faktorSonderformMit` | 1,5 | Sonderform mit Rand |
| `P5` | `aufschlagSonderfarbeVK` | 68 | Sonderfarbe Verkauf, **einmal je Auftrag** |
| `P6` | `aufschlagSonderfarbeEK` | 50 | Sonderfarbe Einkauf, **einmal je Auftrag** |

Nicht als Konstante geführt, weil in der Mappe fest verdrahtet: die
**Maximalbreite**. `M5` verwendet dafür `V7`, also die größte Standardbreite
(200 cm). Ändert man die Liste der Standardbreiten, ändert sich damit
unbemerkt auch die Größenprüfung – siehe offene Frage 8.

---

## 4. Sonderfälle

### 4.1 Der Sonderfarbenaufschlag fällt nur einmal an

Das ist die Stelle, die man beim Nachbauen am leichtesten übersieht.
`P5 = 68 €` steckt im **Stückpreis** `G5`. In der Gesamtsumme wird er wieder
abgezogen:

```
F5 = Menge × G5 − (Menge − 1) × P5
```

Bei 10 Stück à 94,94 € plus Sonderfarbe:
VK je Stück = 162,94 €, VK gesamt = 1 017,41 € – also **einmal** 68 €, nicht
zehnmal. Im Einkauf genauso: `H5` addiert `P6` einmal, `I5` dagegen in voller
Höhe je Stück. `I5 × Menge` ergibt deshalb **nicht** `H5`.

### 4.2 Die Fehlerfälle

`L5` und `M5` liefern in drei Fällen Text statt einer Zahl. Die Multiplikation
in `G5` ergibt dann `#WERT!`. Das Modul gibt in diesen Fällen
`{ ok: false, grund: "…" }` zurück und wirft nie eine Ausnahme.

| Meldung | Bedingung | Zelle |
|---|---|---|
| `zu schmal` | Breite < 30 cm **oder** Länge < 30 cm | `L5` |
| `Matte zu breit` | beide Seiten > 200 cm | `M5` |
| `Matte zu lang` | die längere Seite > 700 cm | `M5` |

Sind zwei Bedingungen gleichzeitig verletzt, gewinnt `L5` – so wie Excel die
Multiplikation von links nach rechts auswertet. Beispiel 20 × 800 cm →
`zu schmal`.

Zulässig sind also Matten, bei denen **eine Seite höchstens 200 cm** misst
(Rollenbreite) und **die andere höchstens 700 cm** (Schnittlänge). Die Werte
200 und 700 selbst sind erlaubt.

### 4.3 Der Breitenfaktor greift schon bei einer passenden Seite

`L5` prüft `ODER(Breite = Standardbreite; Länge = Standardbreite)`. Es genügt,
dass **eine** der beiden Seiten trifft:

| Maß | Faktor | warum |
|---|---:|---|
| 200 × 199 cm | 1,00 | 200 ist Standardbreite |
| 199 × 199 cm | 1,25 | keine Seite trifft |
| 120 × 85 cm | 1,00 | 85 ist Standardbreite |
| 90 × 120 cm | 1,25 | keine Seite trifft |

### 4.4 Menge kleiner als 1

Die innerste `IF()` in `G5`, `J5` und `E6` hat **keinen Sonst-Zweig**:

```excel
IF(E4>=Q6, D4*Q5*C2*$S$2)
```

Ist die Menge kleiner als 1, liefert sie `FALSCH`. Excel liest das in der
Multiplikation als 0 – der Preis besteht dann nur noch aus `P5`. Bei Menge 0
mit Sonderfarbe ergibt sich `F5 = 0 × 68 − (−1) × 68 = 68 €`. Das Modul bildet
dieses Verhalten ab und legt einen Hinweis in `hinweise` ab. Der Konfigurator
verlangt zusätzlich mindestens 1 Stück.

### 4.5 Beide Sonderformen gleichzeitig

`N5` und `O5` sind unabhängige Zellen. Sind beide gesetzt, multipliziert die
Tabelle 1,3 × 1,5 = **1,95**. Das Modul rechnet das genauso und meldet es als
Hinweis – ob die Kombination fachlich gültig ist, muss der Kunde sagen.

### 4.6 Die Tabelle rundet nie

Kein Ergebnis in `A1:W7` ist in `RUNDEN()` gefasst; `G5` und `F5` sind
lediglich mit zwei Nachkommastellen **formatiert**. Das Modul rechnet deshalb
durchgehend in voller Genauigkeit und rundet erst bei der Ausgabe
(`runde()`, `euro()`, `berechneGerundet()`).

---

## 5. Verifikation

`node pruefe-preisformel.mjs` – Zusatz `--voll` zeigt alle 17 Werte je Fall.

### Wie die Sollwerte entstanden sind

Der beste Weg wäre gewesen, die Eingaben in die Mappe zu schreiben und sie von
LibreOffice neu berechnen zu lassen. LibreOffice ist auf diesem Rechner nicht
installiert (`soffice --version` findet nichts).

Deshalb der zweitbeste Weg: ein **kleiner Excel-Formel-Interpreter in Python**
liest mit `openpyxl` (`data_only=False`) die *echten Formelstrings* aus der
`.xlsx` und wertet sie aus – Tokenizer, rekursiver Parser, Auswertung mit
Excel-Semantik:

* `IF()` ohne dritten Parameter liefert `FALSCH`, mit leerem dritten Parameter `0`
* leere Zellen sind in der Arithmetik `0`
* Text wird in der **deutschen** Locale zur Zahl: `"1,25"` → 1.25

Das ist eine zweite, von `preisformel.js` unabhängige Umsetzung: sie kennt nur
die Formeln der Mappe.

**Beweis, dass der Interpreter richtig liegt:** Mit den in der Mappe
gespeicherten Eingaben liefert er für alle 17 Ergebniszellen exakt die Werte,
die Excel selbst gerechnet und in die Datei geschrieben hat – bis auf den
letzten Gleitkommarest (`K5 = 50.860530000000004`).

Die so gewonnenen Sollwerte stehen fest in `pruefe-preisformel.mjs`, damit die
Prüfung ohne Python und ohne die `.xlsx` läuft.

### Abdeckung

| Bereich | Fälle |
|---|---|
| Referenzfall der Mappe, Zelle für Zelle | 17 Zellen einzeln |
| Standardbreite gegen Sondermaß | 4 + alle sechs Standardbreiten einzeln |
| Mengenstaffel | 1, 2, 3, 10, 20, 30 sowie 5, 15, 25, 50 |
| Colortypes | 1, 2, 3 sowie ein ungültiger (Rückfall auf `F19`) |
| Sonderoptionen | jede einzeln, alle Zweier- und die Dreierkombination |
| Sonderfarbe bei Menge > 1 | Menge 1, 2, 10, 30 – der Einmal-Aufschlag |
| Fehlerfälle | zu schmal (2×), zu breit (2×), zu lang (2×), zwei Fehler gleichzeitig (2×) |
| Grenzwerte | genau 30, genau 200, genau 700 und je 1 cm daneben |
| Überschriebene Konstanten | TZ 5 % und 12,5 %, anderer EK-Listenpreis, anderer Salesfactor, andere Sonderfarbenaufschläge |
| Robustheit | `undefined`, `null`, Text, negative Werte, `NaN`, `Infinity` – keine Ausnahmen |

**Stand:** 61 Fälle, davon 9 Fehlerfälle. Bei den 52 Preisfällen werden je 17
Werte verglichen, insgesamt **884 Einzelwerte**. Toleranz 1 · 10⁻⁹ relativ.
Alle 61 Fälle und alle 9 Zusatzprüfungen bestehen; die größte beobachtete
Abweichung liegt bei 3,9 · 10⁻¹⁶ (ein Gleitkomma-ULP durch andere
Multiplikationsreihenfolge).

---

## 6. Beobachtungen aus der Mappe

Diese Punkte sind kein Fehler in der Umsetzung, sondern Eigenheiten der
Tabelle, die man kennen sollte.

1. **`L5`, `M5`, `N5`, `O5`, `P5` und `P6` liefern Text, keine Zahlen.**
   In den Zellen stehen `"1"`, `"1,25"`, `"1,3"`, `"1,5"`, `"68"`, `"50"` –
   mit deutschem Dezimalkomma. Excel wandelt solchen Text bei der
   Multiplikation über die **Ländereinstellung** in eine Zahl um. Auf einem
   System mit Punkt als Dezimaltrennzeichen liefert die Mappe an dieser Stelle
   `#WERT!`. Das Modul kennt dieses Problem nicht, weil es mit echten Zahlen
   rechnet – die Mappe selbst ist aber nicht ortsunabhängig.

2. **`M5`, erste Bedingung ist überflüssig.**
   `UND(B4>200; C4=700)` ist von der zweiten Bedingung `UND(B4>200; C4>200)`
   vollständig abgedeckt, denn 700 ist immer größer als 200. Sie wurde
   trotzdem eins zu eins übernommen.

3. **`W5 = 0,95` wird von keiner Formel benutzt.**
   Der Wert steht neben den Staffelfaktoren `R5…V5`, ist aber von nichts
   referenziert.

4. **Der Bereich `AK1:BX10` ist ein Vergleichsblock**, nicht Teil der
   Kalkulation. Er liest aus `D4`/`D6`/`L5`/`M5` und stellt eigene Preise
   („Plaza", „Rundg-Schräge", „Aussparungen") daneben, fließt aber nirgends in
   `G5` zurück. Einige Zellen darin sind kaputt (`BW1:BW3 = #REF!`).

5. **`E6` (Listenpreis je Stück) wird von keiner Formel weiterverwendet.**
   Es ist eine reine Anzeigegröße: der Preis ohne Mengenstaffel und ohne die
   vier Zuschlagsfaktoren, aber mit Sonderfarbenaufschlag.

---

## 7. Offene Fragen an den Kunden

Diese Punkte gehen aus der Tabelle nicht eindeutig hervor. Bis zur Klärung
rechnet das Modul **genau so wie die Mappe** – auch dort, wo das Ergebnis
fragwürdig wirkt.

**1. Gilt der Breitenfaktor 1,25 wirklich nicht, wenn nur *eine* Seite
Standardmaß ist?**
`L5` verlangt nur, dass Breite **oder** Länge eine Standardbreite trifft. Eine
Matte 200 × 199 cm kostet damit keinen Zuschlag, 199 × 199 cm dagegen 25 % mehr –
obwohl in beiden Fällen ein Zuschnitt nötig ist. Ist das so gewollt, oder
sollte der Zuschlag greifen, sobald irgendeine Seite vom Standard abweicht?

**2. Ist `F19` im Salesfactor-Rückfall Absicht?**
`C2 = WENN(F2=1; F1; WENN(F2=2; I1; WENN(F2=3; L1; F19)))` – `F19` ist leer.
Ein Colortype außerhalb 1–3 ergibt damit Salesfactor 0: Verkauf 0 €, Einkauf
aber voll, also eine **negative Marge**. Der relative Bezug `F19` (ohne `$`)
sieht nach einem beim Kopieren verrutschten `F1` aus; die Erläuterung in Zeile
13 der Mappe spricht von „Salesfactor übernommen aus F1 oder …", und die dort
genannte Zelle `C1` ist ebenfalls leer. Was soll bei einem unbekannten
Colortype passieren – Fehlermeldung oder Rückfall auf Colortype 1?

**3. Wie verhält sich TZ %, wenn es ungleich 0 ist?**
`S2 = 1 + R2/100` wirkt ausschließlich auf `G5` und `E6`, also auf den
Verkauf. Der Einkauf `J5` bleibt unberührt. Ein Teuerungszuschlag erhöht damit
die **Marge**, statt gestiegene Einkaufspreise weiterzugeben. Ist das gewollt?
Und: `R2` ist eine einzelne Zelle – gilt TZ global für alle Artikel oder je
Artikel? Ab wann greift der Wert, gibt es ein Gültigkeitsdatum (`T2` nennt
„ab 01.04.2022")?

**4. Schließen sich „Sonderform ohne Rand" und „Sonderform mit Rand" aus?**
Sind beide gesetzt, multipliziert die Tabelle 1,3 × 1,5 = 1,95. Wenn sich die
beiden ausschließen, sollten sie in der Oberfläche eine Auswahl statt zweier
Schalter sein.

**5. Welcher Einkaufspreis je Stück gilt fürs Reporting?**
Bei Sonderfarbe enthält `I5` (EK je Stück) den **vollen** Aufschlag von 50 €,
`H5` (EK gesamt) dagegen nur einmal. Bei 10 Stück: `I5` = 104,63 €,
`I5 × 10` = 1 046,30 €, `H5` = 596,30 €. Welcher Wert ist der richtige, wenn
ein Auftrag stückweise verbucht wird?

**6. Gibt es eine Mindest- und Höchstmenge?**
Die Mappe kennt keine. Bei Menge 0 liefert sie 0 € (bzw. 68 € mit Sonderfarbe),
bei Menge 10 000 rechnet sie stumpf weiter. Der Konfigurator verlangt derzeit
mindestens 1 ganzes Stück – bitte bestätigen.

**7. Gilt das Mindestmaß von 30 cm für beide Seiten?**
`B6` ist mit „min.width" beschriftet, wird in `L5` aber auf Breite **und**
Länge angewendet. Gibt es eine eigene Mindestlänge? Und ist 30 cm ein Wert je
Artikel oder für alle gleich?

**8. Soll die Maximalbreite eine eigene Konstante werden?**
`M5` verwendet `V7` – also die größte Standardbreite – als Breitengrenze.
Nimmt man eine Standardbreite über 200 cm auf oder entfernt die 200, ändert
sich unbemerkt die Größenprüfung.

**9. Wann wird gerundet?**
Die Tabelle rundet nie, sie formatiert nur. Bei 3 Stück zu 97,051288 € kann
man 3 × 97,05 € = 291,15 € oder 291,153863 € → 291,15 € rechnen. Für das
Angebot muss festliegen, ob je Stück oder erst in der Summe gerundet wird und
ob kaufmännisch oder abgerundet.

**10. Fehlen Zuschläge für Aussparungen, Rundungen und Schrägen?**
In der Mappe stehen die Beschriftungen „Rundg-Schräge" (`BT1`, `BT3`) und
„Aussparungen" (`BT2`) – in `G5` fließt davon nichts ein. Gibt es solche
Aufschläge, und wenn ja, wie berechnen sie sich?

**11. Wo kommen Umsatzsteuer und Versand dazu?**
`A1:W7` rechnet rein netto und kennt weder das eine noch das andere.

**12. Ist `Q5 = 54,63 €/m²` artikel- oder materialbezogen?**
Und wo wird dieser Wert gepflegt, wenn ein Lieferant seine Preise ändert?

**13. Wie geht es nach dem Rechner weiter?**
Das Altsystem matten.de kennt diese Formel nicht. Soll der berechnete Preis
nur angezeigt werden, oder soll daraus eine Anfrage entstehen – und wer
bestätigt sie?

---

## 8. Das Modul benutzen

```js
import { berechne, KONSTANTEN, runde, euro } from './public/preisformel.js';

const r = berechne({
  breite: 90, laenge: 130, menge: 12, colortype: 3,
  sonderformOhneRand: true, sonderformMitRand: false, sonderfarbe: true
});

if (r.ok) {
  console.log(euro(runde(r.vkProStueck, 2)));  // Verkauf je Stück
  console.log(euro(runde(r.vkGesamt, 2)));     // Verkauf gesamt
} else {
  console.log(r.grund);      // "zu schmal" | "Matte zu breit" | "Matte zu lang"
  console.log(r.klartext);   // Erläuterung für die Oberfläche
}
```

Bei Erfolg enthält das Ergebnis neben `ok: true` alle Zwischen- und Endwerte:
`qmProStueck`, `salesfactor`, `tzFaktor`, `staffelfaktor`, `staffelSchwelle`,
`faktorBreite`, `faktorLaenge`, `faktorFormOhneRand`, `faktorFormMitRand`,
`aufschlagVK`, `aufschlagEK`, `zuschlagsfaktor`, `basisProStueck`,
`vkProStueck`, `vkGesamt`, `ekProQm`, `ekProStueck`, `ekGesamt`, `marge`,
`gesamtQm`, `listenpreisProStueck` sowie `hinweise` und die normalisierten
`eingaben`.

Ankreuzfelder nehmen `true` ebenso wie `"X"` entgegen – so, wie sie in der
Mappe stehen. Maße dürfen als Zahl oder als deutscher Zahltext (`"62,5"`)
kommen. `berechne()` wirft nie; ungültige Eingaben ergeben
`{ ok: false, code: "EINGABE", grund: "…" }`.
