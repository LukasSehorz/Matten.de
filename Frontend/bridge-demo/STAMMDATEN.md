# Artikelstammdaten für die Preisberechnung

**Für:** Herrn Schuback, Melting Mind
**Von:** Herrn Fuchsius
**Stand:** 31. August 2026

---

## 1. Worum es geht

Die Preise für Matten werden heute in einer Excel-Tabelle gerechnet
(`1PREISE-Brian_Sehorz-26-08-30_18-48.xlsx`, Blatt „Blatt1"). Diese Rechnung
soll in matten.de einziehen, damit ein Kunde seinen Preis direkt auf der
Artikelseite sieht — auch für Sondermaße, größere Mengen, Sonderformen und
Sonderfarben.

Die Rechnung selbst ist fertig und geprüft. Sie liegt als Modul
`public/preisformel.js` vor und wurde gegen 61 aus der Tabelle abgeleitete
Testfälle mit insgesamt 884 Einzelwerten abgeglichen; alle stimmen exakt.

Was fehlt, sind die **Angaben je Artikel**, mit denen die Rechnung arbeitet.
Ein Teil davon steht bereits in matten.de, der größere Teil noch nicht. Dieses
Dokument listet beides auf.

Die Tabelle unterscheidet ausdrücklich zwischen zwei Arten von Werten
(nachzulesen in der Excel-Datei selbst, Spalten A/B und J/K, Zeilen 11 bis 24):

* **Artikelstammdaten** — werden einmal je Artikel gepflegt und ändern sich
  nicht von Anfrage zu Anfrage. Sie sind Gegenstand dieses Dokuments.
* **Kundeneingaben** — kommen aus der Anfrage: Breite, Länge, Menge sowie die
  drei Kreuze für Sonderform ohne Rand, Sonderform mit Rand und Sonderfarbe.
  Mehr gibt der Kunde nicht an.

Wichtig für die Feldplanung: Der **Colortype gehört zu den Artikelstammdaten**,
nicht zu den Kundeneingaben. Die Excel-Tabelle sagt das in Zeile 17 wörtlich:
„Eingabe des Colortypes — Artikelstammdaten der Matte". Der Kunde wählt also
nicht die Mattenqualität aus; sie steht am Artikel fest.

---

## 2. Was in matten.de bereits vorhanden ist

Diese Felder sind auf der Artikelstammdaten-Seite von `6300201-Logomatte`
schon angelegt und müssen **nicht noch einmal** erstellt werden:

| Feld in matten.de | Wert bei 6300201-Logomatte | Entspricht |
|---|---|---|
| Quadratmeterpreis Netto (Maßanfertigung) | 105,49 € | dem Verkaufspreis je Quadratmeter |
| Quadratmeterpreis Brutto (Maßanfertigung) | 125,53 € | demselben Wert mit 19 % Umsatzsteuer |
| Quadratmeterpreis Ek Netto | 54,63 € | dem Einkaufspreis je Quadratmeter (Zelle Q5) |
| Mindest X | 40 cm | dem Mindestmaß (Zelle B6 — dort allerdings 30 cm, siehe Frage 1) |
| Maximal X | 700 cm | dem Größtmaß der langen Seite (Zelle C6) |
| Einheit / Eingabeeinheit / Umrechnungsfaktor | m / cm / 100 | der Umrechnung von Zentimeter auf Meter |
| Preis / Einkaufspreis | 25,32 € netto / 13,11 € | dem Preis der Standardgröße 60 × 40 cm |

Zwei Beobachtungen dazu, die für das weitere Vorgehen wichtig sind:

**Der hinterlegte Quadratmeterpreis ist bereits der richtige.** 105,49 € sind
genau der Einkaufspreis 54,63 € multipliziert mit dem Salesfactor 1,931 für
mehrfarbige Matten. Auch der Preis der Standardgröße passt: 60 × 40 cm sind
0,24 Quadratmeter, und 0,24 × 105,49 € ergibt 25,32 € — exakt der in matten.de
hinterlegte Preis. Ebenso der Einkauf: 0,24 × 54,63 € = 13,11 €. Die
Rechenlogik von matten.de und die der Excel-Tabelle stimmen an dieser Stelle
also bereits überein. Es geht im Folgenden nicht darum, etwas zu ersetzen,
sondern darum, das Vorhandene um die fehlenden Fälle zu ergänzen.

**Der Quadratmeterpreis Ek Brutto ist mit 54,63 € eingetragen, also gleich dem
Nettowert.** Das sieht nach einem Erfassungsfehler aus; korrekt wären 65,01 €.
Der Wert wird für die Rechnung nicht gebraucht, sollte aber bereinigt werden.

---

## 3. Welche Felder ergänzt werden müssen

Die Spalte „Excel-Zelle" nennt den Ort in der Preistabelle, damit sich jeder
Wert dort nachschlagen lässt.

| Nr. | Feldname | Excel-Zelle | Datentyp | Beispiel 6300201-Logomatte | Wofür es gebraucht wird |
|---:|---|---|---|---|---|
| 1 | Colortype | F2 | Ganzzahl, nur 1, 2 oder 3 | 1 | Bestimmt, welcher der drei Salesfactoren gilt. 1 = mehrfarbig, 2 = einfarbig, 3 = Ped-Print. |
| 2 | Salesfactor mehrfarbig | F1 | Dezimalzahl, 3 Nachkommastellen | 1,931 | Rechnet den Einkaufspreis in den Verkaufspreis um, wenn der Artikel Colortype 1 hat. |
| 3 | Salesfactor einfarbig | I1 | Dezimalzahl, 3 Nachkommastellen | 1,728 | Dasselbe für Colortype 2. |
| 4 | Salesfactor Ped-Print | L1 | Dezimalzahl, 3 Nachkommastellen | 1,800 | Dasselbe für Colortype 3. |
| 5 | Teuerungszuschlag in Prozent | R2 | Dezimalzahl | 0 | Wird auf den Verkaufspreis aufgeschlagen. Derzeit null. |
| 6 | Teuerungszuschlag gültig ab | T2 | Datum | 01.04.2022 | Ab wann der Zuschlag gilt. Reine Information, rechnet nicht mit. |
| 7 | Standardbreiten der Rolle | Q7 bis V7 | Liste von Ganzzahlen in cm | 60 / 75 / 85 / 115 / 150 / 200 | Trifft weder Breite noch Länge eine dieser Breiten, muss aus der Rolle geschnitten werden und der Preis steigt um 25 %. Der größte Wert dieser Liste ist zugleich die Rollenbreite und damit die größte zulässige Breite. |
| 8 | Mengenschwellen | Q6 bis V6 | Liste von Ganzzahlen | 1 / 2 / 3 / 10 / 20 / 30 | Ab welcher Stückzahl der nächste Nachlass greift. |
| 9 | Staffelfaktoren | R5 bis V5 | Liste von Dezimalzahlen | 0,95 / 0,92 / 0,90 / 0,89 / 0,88 | Die Nachlässe zu den Schwellen 2, 3, 10, 20 und 30 Stück. Bei einem Stück gibt es keinen Nachlass. |
| 10 | Faktor „one-color" | W5 | Dezimalzahl | 0,95 | In der Tabelle als Stammdatum geführt (Zeile 24: „R5 bis W5"), wird von keiner Formel benutzt. Siehe Frage 4. |
| 11 | Zuschlag Sondermaß | L5 | Dezimalzahl | 1,25 | Der genannte Aufschlag von 25 %, wenn keine Seite auf eine Standardbreite passt. |
| 12 | Zuschlag Sonderform ohne Rand | N5 / N2 | Dezimalzahl | 1,30 | Aufschlag von 30 %, wenn der Kunde eine Sonderform ohne Rand ankreuzt. |
| 13 | Zuschlag Sonderform mit Rand | O5 / O2 | Dezimalzahl | 1,50 | Aufschlag von 50 %, wenn der Kunde eine Sonderform mit Rand ankreuzt. |
| 14 | Aufschlag Sonderfarbe Verkauf | P5 / P2 | Betrag netto | 68,00 € | Fester Betrag bei Sonderfarbe. Fällt **einmal je Auftrag** an, nicht je Stück. |
| 15 | Aufschlag Sonderfarbe Einkauf | P6 / P2 | Betrag netto | 50,00 € | Derselbe Betrag im Einkauf, ebenfalls einmal je Auftrag. |
| 16 | Mindestmaß | B6 | Ganzzahl in cm | 30 | Kleinste zulässige Kantenlänge. In matten.de heißt das Feld „Mindest X" und steht derzeit auf 40 — siehe Frage 1. |

Die Felder 2 bis 4, 5, 11, 12, 13 und 10 haben bei allen bisher gesehenen
Artikeln denselben Wert. Ob sie je Artikel gepflegt oder zentral hinterlegt
werden, ist eine Entscheidung des Kunden; die Excel-Tabelle führt sie als
Artikelstammdaten. Ein zentraler Vorgabewert je Feld, den ein einzelner Artikel
überschreiben kann, wäre die sparsamste Lösung.

---

## 4. Die Rechnung in Worten

Der Kunde gibt Breite und Länge in Zentimetern an, dazu die Menge und
gegebenenfalls die Kreuze für Sonderform und Sonderfarbe. Daraus wird der Preis
in dieser Reihenfolge gebildet:

1. **Fläche.** Breite mal Länge ergibt die Fläche einer Matte in Quadratmetern.
2. **Materialwert.** Die Fläche mal dem Einkaufspreis je Quadratmeter.
3. **Verkaufswert.** Der Materialwert mal dem Salesfactor, der zum Colortype
   des Artikels gehört.
4. **Mengennachlass.** Ab 2 Stück 5 %, ab 3 Stück 8 %, ab 10 Stück 10 %,
   ab 20 Stück 11 %, ab 30 Stück 12 %. Bei einem Stück kein Nachlass.
5. **Teuerungszuschlag.** Derzeit null Prozent.
6. **Zuschnitt.** Trifft weder Breite noch Länge eine der Standardbreiten,
   kommen 25 % dazu. Es genügt, wenn **eine** der beiden Seiten passt.
7. **Sonderform.** Ohne Rand 30 % mehr, mit Rand 50 % mehr.
8. **Sonderfarbe.** Ein fester Betrag von 68 € — einmal je Auftrag, nicht je
   Stück.

Die Schritte 4 und 5 wirken nur auf den Verkaufspreis. Die Schritte 6 und 7
wirken auf Verkauf und Einkauf gleichermaßen, denn der Zuschnitt und die
Sonderform kosten auch in der Beschaffung mehr.

Drei Größen sind nicht lieferbar und ergeben statt eines Preises eine Meldung:
eine Seite kürzer als das Mindestmaß („zu schmal"), beide Seiten breiter als
die Rollenbreite von 200 cm („Matte zu breit") und die längere Seite über
700 cm („Matte zu lang").

### Ein Rechenbeispiel

Artikel `6300201-Logomatte`, Maß 90 × 250 cm, 5 Stück, Sonderform ohne Rand,
keine Sonderfarbe.

| Schritt | Rechnung | Ergebnis |
|---|---|---:|
| Fläche je Matte | 0,90 m × 2,50 m | 2,25 m² |
| Materialwert | 2,25 × 54,63 € | 122,92 € |
| mal Salesfactor (Colortype 1) | 122,92 × 1,931 | 237,35 € |
| Mengennachlass 5 Stück (8 %) | 237,35 × 0,92 | 218,37 € |
| Teuerungszuschlag 0 % | unverändert | 218,37 € |
| Zuschnitt: weder 90 noch 250 ist Standardbreite | 218,37 × 1,25 | 272,96 € |
| Sonderform ohne Rand | 272,96 × 1,30 | **354,84 €** je Stück |
| Verkaufspreis gesamt | 5 × 354,84 € | **1.774,22 €** |
| Einkauf je Quadratmeter | 54,63 × 1,25 × 1,30 | 88,77 € |
| Einkauf gesamt | 2,25 × 88,77 × 5 | 998,70 € |
| Rohertrag | 1.774,22 € − 998,70 € | 775,51 € |

Alle Beträge netto. Gerundet wird erst am Ende; die Tabelle selbst rundet an
keiner Stelle, sie zeigt nur zwei Nachkommastellen an.

---

## 5. Was matten.de heute anders rechnet

**Was schon stimmt.** Für die Standardgrößen rechnet matten.de bereits mit
demselben Satz. Der hinterlegte Quadratmeterpreis von 105,49 € netto ist genau
das Ergebnis der Formel für diesen Artikel, und der Preis der Standardgröße
60 × 40 cm von 25,32 € ergibt sich daraus korrekt. Das ist nachgerechnet und
belegt.

**Wo die Lücken sind.** Sobald der Kunde die Maßanfertigung wählt, greift der
hinterlegte Quadratmeterpreis nicht mehr, und matten.de fällt auf den
Grundpreis des Artikels zurück. Außerdem kennt das System an dieser Stelle:

* **keine Mengenstaffel.** Das Feld „Preisstaffel" steht bei diesem Artikel auf
  „Keine". Wer 30 Matten bestellt, zahlt denselben Stückpreis wie bei einer.
  Die Tabelle sieht dafür 12 % Nachlass vor.
* **keinen Zuschlag für Sondermaße.** Ob eine Matte aus der Rolle geschnitten
  werden muss oder nicht, macht im Preis keinen Unterschied. Die Tabelle
  verlangt 25 % Aufschlag.
* **keinen Zuschlag für Sonderformen.** Weder die 30 % ohne Rand noch die 50 %
  mit Rand sind abbildbar.
* **keinen Aufschlag für Sonderfarben.** Die 68 € je Auftrag fehlen.
* **keinen Colortype und keine Salesfactoren.** Der Quadratmeterpreis ist als
  fertige Zahl hinterlegt. Ändert sich der Einkaufspreis des Lieferanten, muss
  jemand den Verkaufspreis von Hand nachrechnen, statt dass er sich aus
  Einkaufspreis und Salesfactor ergibt.

Genau diese Lücken schließt die Ergänzung aus Abschnitt 3. Danach kann matten.de
jede Anfrage rechnen, nicht nur die Standardgrößen.

Ein kleiner, aber sichtbarer Nebeneffekt: Der Quadratmeterpreis ist heute mit
105,49 € gerundet hinterlegt, während die Formel mit 105,49053 € weiterrechnet.
Bei 2,25 m² macht das 0,12 Cent Unterschied. Damit die Preise auf der Seite und
im Angebot identisch sind, sollte das System entweder den ungerundeten Wert
speichern oder überall an derselben Stelle runden (siehe Frage 6).

---

## 6. Fragen an den Kunden

Die neue Fassung der Preistabelle hat mehrere Punkte geklärt, die vorher offen
waren. Diese sind hier zuerst aufgeführt, danach folgt, was noch zu klären ist.

### Geklärt durch die neue Tabelle

* **Welche Werte gehören zum Artikel und welche zur Anfrage?** Die Zeilen 11
  bis 24 benennen es jetzt eindeutig. Artikelstammdaten sind: Colortype,
  Salesfactoren, Einkaufs-Listenpreis je Quadratmeter, Standardmaße,
  Mengenstaffel, Mindest- und Maximalmaß sowie die Aufschläge für Sonderfarbe.
  Kundeneingaben sind nur Breite, Länge, Menge und die drei Kreuze.
* **Ist der Colortype eine Kundeneingabe?** Nein. Zeile 17: „Eingabe des
  Colortypes — Artikelstammdaten der Matte". Er wird nicht abgefragt.
* **Woher kommt der Einkaufspreis je Quadratmeter?** Zeile 22: „vom
  Lieferanten". Er ist damit eindeutig ein Beschaffungswert und kein
  Kalkulationswert.
* **Gelten die Sonderfarbenaufschläge für alle Artikel gleich?** Nein. Zeile 22
  der rechten Spalte sagt: „VK und EK-Aufpreise **pro Artikelart** für
  Sonderfarben". Sie gehören also an den Artikel.
* **Der frühere Verdacht auf einen verrutschten Zellbezug.** In der alten
  Tabelle stand als Erläuterung „Salesfactor übernommen aus F1 oder …" mit
  Verweis auf die leere Zelle C1. Das ließ offen, ob der Salesfactor noch
  irgendwo anders herkommen kann. Diese Zeile ist in der neuen Fassung
  gestrichen. Es bleibt: „Salesfactor abhängig vom Colortype 1 oder 2 oder 3"
  und „Salesfactor je nach Mattenart". Damit ist belegt, dass es genau drei
  Salesfactoren gibt und keinen vierten. Siehe aber Frage 3.

### Noch offen

**1. Gilt als Mindestmaß 30 cm oder 40 cm?**
Die Preistabelle nennt in Zelle B6 30 cm. Die Artikelstammdaten in matten.de
führen für denselben Artikel „Mindest X = 40". Beides kann nicht gleichzeitig
stimmen. Wir rechnen vorerst mit 30 cm, weil die Tabelle die geprüfte Quelle
ist. Bitte bestätigen Sie den richtigen Wert. Und: Gilt das Mindestmaß für
beide Seiten oder nur für die Breite? Die Tabelle prüft beide Seiten, obwohl
das Feld „min.width", also Mindestbreite, heißt.

**2. Greift der Aufschlag von 25 % wirklich nicht, wenn nur eine Seite ein
Standardmaß hat?**
Die Tabelle verlangt nur, dass Breite **oder** Länge eine Standardbreite
trifft. Eine Matte 200 × 199 cm kostet damit keinen Aufschlag, eine Matte
199 × 199 cm dagegen 25 % mehr — obwohl in beiden Fällen zugeschnitten werden
muss. Ist das so gewollt?

**3. Was soll passieren, wenn ein Artikel einen anderen Colortype als 1, 2
oder 3 hat?**
Die Tabelle liefert dann einen Salesfactor von null: Verkaufspreis null,
Einkaufspreis in voller Höhe, also ein Verlust. In der Praxis kann das nicht
vorkommen, wenn das Feld nur die drei Werte zulässt. Wir empfehlen, es im neuen
System als Auswahlfeld mit genau drei Einträgen anzulegen, dann erübrigt sich
die Frage.

**4. Wofür ist der Wert 0,95 unter der Überschrift „one-color"?**
Die neue Tabelle zählt ihn in Zeile 24 zu den Rabattfaktoren („R5 bis W5"),
aber keine Formel greift darauf zu. Bekommen einfarbige Matten zusätzlich 5 %
Nachlass, oder ist der Wert ein Überbleibsel?

**5. Schließen sich „Sonderform ohne Rand" und „Sonderform mit Rand" aus?**
Sind in der Tabelle beide angekreuzt, werden beide Aufschläge multipliziert,
also 1,3 × 1,5 = 1,95 und damit 95 % Aufschlag. Wenn sich die beiden Fälle
ausschließen, sollte es auf der Seite eine Auswahl statt zweier Kästchen sein.

**6. Wann wird gerundet?**
Die Tabelle rundet an keiner Stelle. Bei drei Stück zu 97,051288 € kann man
3 × 97,05 € = 291,15 € rechnen oder 291,153863 € auf 291,15 € runden. Für
Angebot und Rechnung muss festliegen, ob je Stück oder erst in der Summe
gerundet wird.

**7. Welcher Einkaufspreis je Stück gilt für die Auswertung?**
Bei Sonderfarbe enthält der Einkaufspreis je Stück den vollen Aufschlag von
50 €, der Gesamteinkauf dagegen nur einmal. Bei 10 Stück ergibt das 104,63 €
je Stück, aber 596,30 € gesamt und nicht 1.046,30 €. Welcher Wert ist der
richtige, wenn ein Auftrag stückweise verbucht wird?

**8. Gibt es eine Mindest- und eine Höchstmenge?**
Die Tabelle kennt keine. Bei null Stück ergibt sie null Euro, bei
10 000 Stück rechnet sie unverändert weiter. Der Rechner verlangt derzeit
mindestens ein ganzes Stück.

**9. Gilt der Teuerungszuschlag für alle Artikel gemeinsam oder je Artikel?**
In der Tabelle ist es eine einzelne Zelle mit dem Vermerk „ab 01.04.2022" und
dem Wert null. Er wirkt außerdem nur auf den Verkauf, nicht auf den Einkauf,
und erhöht damit den Rohertrag, statt gestiegene Einkaufspreise weiterzugeben.
Ist das so gewollt?

**10. Soll die größte zulässige Breite ein eigenes Feld werden?**
Die Tabelle nimmt dafür den größten Wert aus der Liste der Standardbreiten,
also 200 cm. Nimmt jemand später eine breitere Standardbreite auf oder entfernt
die 200, ändert sich damit unbemerkt auch die Größenprüfung.

**11. Fehlen Zuschläge für Aussparungen, Rundungen und Schrägen?**
In der Tabelle stehen abseits der Rechnung die Beschriftungen
„Rundg-Schräge" und „Aussparungen". In den Preis fließt davon nichts ein. Gibt
es solche Aufschläge, und wenn ja, wie berechnen sie sich?

**12. Wo kommen Umsatzsteuer und Versand dazu?**
Die Tabelle rechnet rein netto und kennt weder das eine noch das andere. Für
die Bruttopreise auf der Seite gehen wir von 19 % aus, was auch zu den in
matten.de hinterlegten Bruttowerten passt.

**13. Wie geht es nach dem Rechner weiter?**
Soll der berechnete Preis nur angezeigt werden, oder soll daraus unmittelbar
eine Bestellung entstehen — und wer bestätigt sie vorher?

---

## 7. Anhang: Wo die Werte im Modul liegen

Für die technische Umsetzung: Alle Felder aus Abschnitt 3 sind im Modul
`public/preisformel.js` als benannte Werte hinterlegt.

* `STAMMDATEN_VORGABE` enthält den vollständigen Satz mit den Werten der
  Preistabelle. Jedes Feld trägt die zugehörige Excel-Zelle als Kommentar.
* `STAMMDATEN_FELDER` ist die maschinenlesbare Fassung der Tabelle aus
  Abschnitt 3, einschließlich der Angabe, welches Feld in matten.de schon
  vorhanden ist.
* `ARTIKEL['6300201-Logomatte']` ist der Beispielartikel aus dem Screenshot.
* `KUNDENEINGABEN_FELDER` listet die sechs Werte, die aus der Anfrage kommen.
* `pruefeStammdaten(satz)` meldet fehlende oder unplausible Werte, bevor
  gerechnet wird.

Zwei Prüfskripte sichern das ab:

```
node pruefe-preisformel.mjs    61 Fälle gegen die Preistabelle
node pruefe-stammdaten.mjs     62 Prüfungen der Stammdaten-Fassung
```

Das zweite Skript rechnet unter anderem nach, dass die in matten.de bereits
hinterlegten Werte — 105,49 € je Quadratmeter, 25,32 € netto und 30,13 € brutto
sowie 13,11 € Einkauf für die Standardgröße 60 × 40 cm — genau das ergeben, was
auch die Formel liefert.
