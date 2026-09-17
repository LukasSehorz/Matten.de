# E-Mail-Entwurf: Rückfrage Sonderfarben

Stand 17.09.2026. Hintergrund: Punkt 4 der Mail von Herrn Fuchsius vom 16.09.2026, 20:24 Uhr
(„Auswahl Sonderfarbe ist okay, aber Eingabemöglichkeit ob ein zwei oder drei usw Sonderfarben").

Die Excel-Kalkulation kennt in Zelle P3 nur ein Ankreuzfeld „Sonderfarbe ja/nein" mit
68,- € netto im Verkauf (P5) und 50,- € im Einkauf (P6), ausdrücklich **einmal je Auftrag**
(Formel F5 rechnet den Betrag bei mehreren Stück wieder heraus).

**Vorläufig umgesetzt:** 68,- € netto **je Sonderfarbe**, weiterhin nur einmal je Auftrag —
zwei Sonderfarben also 136,- € netto, unabhängig von der Stückzahl. Leicht umzustellen,
falls die Antwort anders lautet (`preisformel.js`, Feld `sonderfarbenAnzahl`).

---

## Betreff

Rückfrage zu den Sonderfarben — Preis je Farbe oder pauschal?

## Text

Sehr geehrter Herr Fuchsius,

vielen Dank für Ihre Rückmeldungen von gestern Abend. Ihre Punkte sind umgesetzt:

1. Die Aufpreise sind aus dem Bestellformular entfernt.
2. Statt „Sonderform ohne Rand" gibt es jetzt ein Auswahlfeld **Rand: mit Rand / ohne Rand**.
3. Statt „Sonderform mit Rand" gibt es ein Auswahlfeld **Form: Rechteckig / Sonderform**.
4. Bei den Sonderfarben lässt sich nun die **Anzahl** eingeben, ohne Hinweis auf Mehrkosten.
5. Der Hinweis auf die Wunschmaße unterhalb des Endpreises ist entfallen.
6. Bei mehreren Designfarben werden alle gewählten Farben namentlich angezeigt
   (z. B. „600 Weiß, 601 Zitronengelb, 602 Gelb") statt wie bisher nur die erste mit einer Zählung.

Zu Punkt 4 habe ich eine Frage, bei der ich nicht raten möchte, weil sie den Preis betrifft:

**Wie wirken sich mehrere Sonderfarben auf den Preis aus?**

In Ihrer Kalkulationstabelle ist die Sonderfarbe ein einzelnes Ankreuzfeld mit 68,- € netto,
und zwar einmal je Auftrag, unabhängig von der Stückzahl. Mit der Eingabe einer Anzahl
stellt sich die Frage, wie mehrere Farben zu rechnen sind:

* **a)** 68,- € je Sonderfarbe — zwei Farben also 136,- €, drei Farben 204,- €
* **b)** 68,- € pauschal, unabhängig davon, wie viele Sonderfarben gewählt werden
* **c)** eine andere Staffelung, etwa ein geringerer Betrag ab der zweiten Farbe

Vorläufig habe ich Variante a) eingebaut, weil die Abfrage der Anzahl sonst preislich ohne
Wirkung bliebe. Der Betrag fällt dabei weiterhin nur einmal je Auftrag an, nicht je Stück.
Sagen Sie mir einfach kurz Bescheid, wenn es anders sein soll — das ist schnell geändert.

Eine zweite Frage dazu: Gilt für den Einkauf entsprechend 50,- € je Sonderfarbe,
oder bleibt es dort bei dem einmaligen Betrag?

Mit freundlichen Grüßen
Lukas Sehorz
