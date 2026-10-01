# Befund Navigations-Hänger (Abschnitt A) — 01.10.2026

Geänderte Datei: **nur** `Frontend/bridge-demo/public/net-neu/assets/js/shell.js`
(+225 / −15 Zeilen). `node --check` sauber.

Gemessen im echten Browser (Chrome headless, CDP, Port 9222) gegen die Brücke
auf Port 8787. Weil `/api/cart` lokal schnell ist (0,4–1,7 s), wurde die
Netlify-Lage nachgebildet: **nur** `GET /api/cart` wird per
`Fetch.requestPaused` um **2.500 ms** angehalten. Alle anderen Anfragen laufen
unverändert. Das entspricht den Netlify-Messungen aus dem Auftrag
(2,589 s · 2,043 s · 2,578 s).

---

## 1. Die Annahme im Auftrag war nur halb richtig

Der Auftrag vermutete, der Startabruf blockiere die Bedienung. **Das tut er
nicht.** Gemessen auf allen drei Seiten, mit 2,5 s Verzögerung am Korb:

| Seite | Knopf klickbar (vorher) | Knopf klickbar (nachher) |
|---|---|---|
| `mattendesigner.html` | 66 · 68 · 69 ms | 66 · 67 · 69 ms |
| `index.html` | 54 · 55 · 56 ms | 51 · 56 · 57 ms |
| `produkt.html?slug=designmatten-jetprint` | 67 · 77 · 78 ms | 69 · 76 · 79 ms |

`fetch()` läuft nebenher und hält den Hauptfaden nicht auf. Die Knöpfe waren
auch vorher nach rund 70 ms bedienbar. „Zeit bis klickbar" war also nicht die
Ursache und ist nicht die Kennzahl, an der man den Fehler sieht.

## 2. Was wirklich kaputt war: der Korb verlor Positionen

Der Fehler zeigt sich erst, wenn man das tut, was der Nutzer tut — **innerhalb
der langsamen 2,5 s auf „In den Warenkorb" klicken.** Drei Läufe mit dem
Originalstand:

| Lauf | Meldung der Seite | Zähler | Modal | **Server (`/api/cart`)** |
|---|---|---|---|---|
| 1 | „1 Position" | ` (1)` | 1 Zeile, 42,03 € | `count: 1` ✔ |
| 2 | „1 Position" | *leer* | 0 Zeilen, € 0.00 | **`count: 0`** ✘ |
| 3 | „2 Positionen" | ` (2)` | 2 Zeilen, 145,48 € | **`count: 0`** ✘ |

In zwei von drei Läufen war die Position **weg** — nicht nur falsch angezeigt,
sondern im Altsystem nicht vorhanden. In Lauf 3 behauptete die Anzeige sogar
zwei Positionen, während der Server null hatte. Genau das ist Lukas' Befund:
„klicken → nichts passiert, Ladeanzeige, Flackern".

### Ursache (zwei Schichten)

**a) Sitzungs-Rennen (die schwerere Hälfte).**
Die Netlify-Function hält die Sitzung des Altsystems im **Cookie** und schreibt
sie bei *jeder* Antwort komplett per `Set-Cookie` zurück
(`Frontend/netlify/functions/api.mjs`, `sitzungAusAnfrage` / `cookieFuerAntwort`).
Ohne `PHPSESSID` holt sich jede Anfrage über `ensureUpstreamSession` zuerst
eine eigene Sitzung bei matten.de (`lib/bruecke.mjs`). Starten Lesen und
Schreiben gleichzeitig aus dem cookie-losen Zustand, legt jedes seine *eigene*
Sitzung an — und **die später eintreffende Antwort überschreibt die frühere.**
Der langsame Korb-Abruf antwortet zuletzt, also gewinnt er: die gerade
hinzugefügte Position liegt in einer Sitzung, die niemand mehr benutzt.

Zeitachse eines kaputten Laufs (Originalstand):

```
  66 ms  -> GET  /api/cart          (angehalten, 2.500 ms)
  70 ms  KLICK add-to-cart
  74 ms  -> POST /api/cart/add
1651 ms  <- 200  /api/cart/add      Seite zeigt richtig "count=1"
3603 ms  <- 200  /api/cart          alte, leere Antwort -> malt alles leer
Ende:    Zähler "", Modal 0 Zeilen, Server count=0
```

**b) Anzeige-Rennen.** Zusätzlich übermalte die spät eintreffende, leere
Antwort die bereits korrekte Anzeige aus dem `add`.

## 3. Was geändert wurde (alles in `shell.js`)

1. **Startabruf zurückgestellt.** Erst zwei `requestAnimationFrame` (die Seite
   ist gezeichnet), dann 300 ms Atempause, dann `requestIdleCallback` mit
   Zeitgrenze 1500 ms. `requestIdleCallback` allein genügte nicht — auf einem
   flotten Rechner meldet es schon nach Millisekunden Leerlauf, und der Abruf
   lag wieder genau im Klickfenster. Messung: Korb-Abruf startet jetzt bei
   **~360 ms** statt bei ~40 ms.
2. **Schreib-Sperre `korbSchreibt`** (der eigentliche Fix): Solange eine
   Schreibanfrage an `/api/cart/*` oder `/api/kasse/*` unterwegs ist, fragt der
   stille Nachzug den Korb **nicht** ab, sondern sieht alle 400 ms nach
   (höchstens 15-mal = 6 s, dann gibt er auf). Damit laufen Lesen und Schreiben
   nie gleichzeitig, und keine Sitzung überschreibt die andere.
3. **Laufende Nummer `korbLesestand`:** Jede Schreibanfrage und jedes
   ausdrückliche Laden zählt weiter. Eine Antwort, die beim Eintreffen einen
   veralteten Stand hat, wird verworfen. Der stille Nachzug zählt bewusst
   **nicht** mit — sonst nimmt er dem Modal die Anzeige weg (dieser Fehler trat
   bei der Arbeit tatsächlich auf und ist mit `probe5` nachgewiesen und behoben).
4. **Zähler-Zwischenspeicher** (`sessionStorage`, Schlüssel
   `netneu.korbzaehler`): Gespeichert wird **ausschließlich die Positionszahl**
   plus Zeitstempel, nie Positionen, Preise oder Summen. Verfällt nach 5 Minuten,
   wird von jeder Schreibanfrage zentral in `sende()` gelöscht. Jeder Zugriff in
   `try/catch` — im privaten Fenster läuft alles wie vorher, nur ohne Vorschau.
5. **Zeitgrenze:** `hole(url, grenzeMs)` kann per `AbortController` abbrechen;
   der Startabruf nutzt 8 s. Fehler und Zeitüberschreitung bleiben still — dann
   eben kein Zähler, keine Meldung an den Nutzer.
6. **Kein Doppelabruf:** `still()` lässt höchstens einen Abruf gleichzeitig zu.
7. **Spinner im Modal** erscheint erst nach 300 ms (schnelle Antwort zeigt gar
   keinen Spinner statt eines Aufblitzens) und geht **immer** wieder aus — auch
   wenn die Antwort verworfen wird. Vorher wäre er nach einer überholten
   Anfrage stehen geblieben.

**Unverändert geblieben:** `warenkorbLaden()` liest weiter ausnahmslos frisch
vom Server, ebenso die Kasse (`seite-checkout.js` ruft `S.hole('/api/cart')`
direkt). `letzterKorb()` bleibt `null`, bis eine echte Serverantwort da war —
der gemerkte Stand ist nie die Wahrheit für Geld oder Positionen.

## 4. Nachher: dieselbe Messung, drei Läufe

| Lauf | Zähler | Modal | Server | Spinner hängt |
|---|---|---|---|---|
| 1 | ` (1)` | 1 Zeile, 42,03 € | `count: 1` ✔ | nein |
| 2 | ` (1)` | 1 Zeile, 42,03 € | `count: 1` ✔ | nein |
| 3 | ` (1)` | 1 Zeile, 42,03 € | `count: 1` ✔ | nein |

Anzeige und Server stimmen in **3 von 3** Läufen überein (vorher 1 von 3).
Keine Konsolenfehler, keine 4xx/5xx.

**Zähler beim Seitenwechsel** (Vorschau aus dem Zwischenspeicher):
**30–49 ms** statt **3.178–3.468 ms** — rund 70-mal schneller.

## 5. Zwischenspeicher: Nachweis, dass er nie veraltet anzeigt

`mess-speicher.mjs`, **10 von 10** bestanden, keine Konsolenfehler:

1. Nach `add`: Zähler = Server (1 = 1)
2. Nächste Seite zeigt die Zahl nach **58 ms**
3. Gespeichert ist nur `{"n":1,"t":…}` — keine Positionen, keine Preise
4. Während einer Schreibanfrage ist der Speicher **sofort** `null`
5. Nach Mengenänderung über die Oberfläche: Zähler = Server (2 = 2)
6. Nach Seitenwechsel steht die **neue** Zahl (2), nicht die alte (1)
7. `letzterKorb()` bleibt leer, bis eine echte Antwort da ist — obwohl die
   Vorschau ` (99)` zeigte
8. Mit **von Hand verfälschtem** Speicher (`n: 99`) zeigt das Modal trotzdem
   die **wahren** Zahlen (1 Zeile, 72,16 €, Zähler 2)
9. Die Kasse zeigt mit verfälschtem Speicher (`n: 77`) den frischen Stand
10. Nach `/api/cart/clear`: Korb leer, Zähler leer

## 6. Keine Rückschritte

* `pruefe-preisformel.mjs`: 61/61 Fälle wie die Excel-Mappe.
* `pruefe-stammdaten.mjs`: läuft durch.
* `ui-kasse.mjs`: läuft durch (Exit 0), endet mit Korb 0. Das 422 auf
  `/api/kasse/adresse` ist der eingebaute Feldfehler-Test, das 502 ein Bild
  des Altsystems — beides unabhängig von dieser Änderung.
* `ui-modal-konto.mjs`: läuft durch (501 auf `/api/konto/register` ist gewollt).
* `ui-produkt.mjs`: bricht bei Schritt `D19 40x60 sonderfarbe kauf` ab
  („An invalid form control with name='width' is not focusable"). **Gegengeprüft
  mit dem Original-`shell.js`: derselbe Abbruch an derselben Stelle** — gehört
  also nicht zu dieser Änderung, sondern zur parallelen Arbeit an
  `seite-produkt.js` (Abschnitte B/C).

## 7. Offen

* **Noch nicht auf Netlify gemessen.** Alle Zahlen hier stammen von der lokalen
  Brücke mit nachgebildeter Verzögerung. Die 2,5 s sind nachgebildet, nicht echt.
* **Die tiefere Ursache sitzt im Server, nicht im Frontend.** `shell.js`
  vermeidet das Sitzungs-Rennen jetzt, indem es Lesen und Schreiben nie
  gleichzeitig laufen lässt. Sauber gelöst wäre es erst, wenn die
  Netlify-Function die Sitzung nicht mehr per Cookie hin- und herträgt oder
  das `Set-Cookie` nur schreibt, wenn sie die Sitzung selbst angelegt hat.
  Solange zwei Browser-Tabs gleichzeitig arbeiten, kann das Rennen erneut
  auftreten — dagegen hilft Frontend-Code grundsätzlich nicht.
  Empfehlung: in `Frontend/netlify/functions/api.mjs` prüfen, ob
  `cookieFuerAntwort` bei reinen Leseanfragen überhaupt schreiben muss.
* Der erste Korb-Abruf einer frischen Sitzung bleibt auf Netlify langsam
  (zwei Aufrufe ans Altsystem). Er fällt jetzt nur nicht mehr auf, weil er
  nichts blockiert und die Zahl beim Seitenwechsel aus dem Speicher kommt.

## 8. Wie nachmessen

Prüfskripte liegen im Scratchpad dieser Sitzung (nicht im Repo):
`mess-navigation.mjs` (Zeit bis klickbar, 3 Seiten × 3 Läufe),
`mess-rennen.mjs` (der Klick im langsamen Fenster),
`mess-speicher.mjs` (10 Prüfungen zum Zwischenspeicher),
`probe3/probe4/probe5.mjs` (Zeitachsen zur Ursachensuche).

Voraussetzung: Brücke auf 8787 (`cd Frontend/bridge-demo && node server.mjs`),
Chrome headless auf 9222.

`POST /api/kasse/bestellen` wurde **nie** ausgelöst. Testartikel sind nach
jedem Lauf mit `POST /api/cart/clear` entfernt; der Korb steht am Ende auf 0.
