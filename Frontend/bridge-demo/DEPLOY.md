# DEPLOY.md — die Brücke auf Netlify

Diese Datei beschreibt, wie aus dem lokalen Proxy eine öffentlich erreichbare
Seite wird: was beim Build passiert, wie man den Katalog aktualisiert, wo die
Netlify-Fassung anders ist als `node server.mjs` — und wie man den
Bestellschritt abschaltet.

---

## ⚠️ Zuerst das Wichtigste

> ### Diese Seite ist öffentlich erreichbar und kann echte Bestellungen im Livesystem matten.de auslösen.
>
> Der Warenkorb dieser Seite **ist** der Warenkorb einer echten PHP-Sitzung von
> matten.de. Wer auf der öffentlichen Adresse die Kasse bis zum Ende durchläuft,
> löst im Altsystem eine **echte Bestellung** aus: es entsteht ein Datensatz, und
> die Auftragsbestätigung geht per E-Mail an die eingegebene Adresse.
>
> Zwei Dinge bleiben dabei bestehen, in der Netlify-Fassung genau wie lokal:
>
> * Zugelassen sind ausschließlich **Vorkasse** und **Rechnung**. Dabei fließt
>   kein Geld — es entsteht nur ein Auftrag. Die Wege über den
>   Zahlungsdienstleister Worldline/Ogone (PayPal, Kreditkarte) werden an drei
>   Stellen serverseitig abgelehnt.
> * Der letzte Schritt verlangt im Anfragekörper wörtlich
>   `{ "bestaetigung": "JA-BESTELLEN" }` — verglichen wird streng gegen den
>   Rohwert, ohne Typumwandlung.
>
> Beides schützt vor dem *Versehen*, nicht vor der *Absicht*. Wer den Link
> weitergibt, gibt eine funktionierende Bestellstrecke weiter.

### Den Bestellschritt abschalten

In Netlify unter **Site configuration → Environment variables**:

```
BESTELLUNG_GESPERRT = 1
```

Danach ein neues Deployment (oder „Clear cache and deploy"). Wirkung:
`POST /api/kasse/bestellen` antwortet mit **503** und rührt matten.de nicht an —
die Ablehnung passiert *vor* der ersten Upstream-Anfrage. Alles andere bleibt
bedienbar: Katalog, Warenkorb, Preise, Adressformular, Bestellvorschau. Nur der
allerletzte Klick geht ins Leere, mit einer Meldung, die das erklärt.

**Standardmäßig ist die Variable nicht gesetzt — Bestellungen sind also erlaubt.**
Als „gesetzt" gelten genau `1`, `true` und `ja`; alles andere gilt als nicht
gesetzt, damit ein Tippfehler die Sperre weder heimlich setzt noch heimlich
aufhebt.

**Es gibt zwei Seiten, die dorthin führen:** `/shop/kasse.html` (die Kasse des
Shop-Designs) und `/kasse.html` (die technische Kassenansicht des Entwicklers,
erreichbar über `/demo`). Beide rufen denselben Endpunkt auf, und die
Umgebungsvariable sperrt beide gleichzeitig — sie sitzt im Server, nicht in der
Seite. Einen Knopf aus einer der beiden HTML-Dateien zu entfernen, sperrt nur
diesen einen Weg; die Umgebungsvariable ist die Sperre, die niemand vergessen
kann.

---

## 1. Der Aufbau in einem Bild

```
Repository-Wurzel
├── netlify.toml                      base = "Frontend"
└── Frontend/
    ├── bridge-demo/
    │   ├── lib/bruecke.mjs           ← DIE FACHLOGIK. Einmal. Für alle drei.
    │   ├── server.mjs                lokaler Proxy, Port 8787
    │   ├── build-katalog.mjs         Build-Schritt
    │   └── public/                   Quelle der statischen Dateien
    │       ├── shop/                 19 Seiten + assets/
    │       ├── index.html            Entwickler-Demoseite
    │       ├── kasse.html            Entwickler-Kassenansicht
    │       ├── rechner.html          Preisrechner
    │       ├── preisformel.js        geprüfte Kalkulation
    │       └── fonts/
    ├── netlify/
    │   ├── katalog-daten.mjs         ← beim Build erzeugt (3,6 MB)
    │   └── functions/api.mjs         alle /api/-Endpunkte
    └── dist/                         ← beim Build erzeugt = Publish-Verzeichnis
```

`dist/` und `netlify/katalog-daten.mjs` stehen in `.gitignore`. Sie entstehen
bei jedem Deployment neu; sie ins Repository zu legen hieße, einen
Katalogstand einzufrieren, den niemand mehr zuordnen kann.

### Warum eine gemeinsame `lib/`

Der lokale Server, das Build-Skript und die Netlify-Function brauchen dieselben
Parser, dieselbe Zeichensatz-Behandlung, dieselben Sicherheitsregeln. Es gibt
davon **eine** Fassung: `bridge-demo/lib/bruecke.mjs`. Alle drei importieren
sie. Was in den drei Dateien darüber hinaus steht, ist ausschließlich das, was
sich zwischen den Laufzeitumgebungen wirklich unterscheidet — HTTP-Server,
Dateiauslieferung, Sitzungsspeicher.

Praktisch heißt das: eine Korrektur an der Zahlungsart-Allowlist oder am
Warenkorb-Parser wirkt an allen drei Stellen gleichzeitig. Es gibt keine
zweite Abschrift, die stillschweigend veralten kann.

---

## 2. Was beim Build passiert

`netlify.toml` sagt:

```toml
[build]
  base    = "Frontend"
  command = "node bridge-demo/build-katalog.mjs"
  publish = "dist"
  functions = "netlify/functions"
```

Das Skript macht vier Dinge:

**1. Publish-Verzeichnis aufbauen.** `dist/` wird gelöscht und `bridge-demo/public/`
komplett hineinkopiert — dieselben Dateien, die der lokale Server ausliefert.
Danach prüft es, ob zwölf Pflichtdateien wirklich angekommen sind
(`shop/index.html`, `preisformel.js`, `fonts/fonts.css` …). Fehlt eine, bricht
es ab.

**2. Den Katalog aus matten.de lesen.** In zwei Stufen, wie im lokalen Server:

| | Anfragen | gemessen |
|---|---|---|
| Stufe 1: Kategoriebaum + 24 Kategorieseiten | ~25 | 19 s |
| Stufe 2: 365 Artikelseiten (Parallelität 4) | 365 | 148 s |
| Daten für die Function einsammeln | 1 | 3 s |
| **gesamt** | **~390** | **~175 s** |

**Das ist der ganze Grund für dieses Skript.** Eine Netlify Function darf zehn
Sekunden laufen. 175 Sekunden gehen dort nicht — nicht mit Tricks, nicht mit
Streaming. Also passiert es einmal beim Build.

**3. Zwei Dateien schreiben.**

* `dist/shop/assets/js/catalog.js` (957 KB) — `window.CATALOG` und
  `window.CATALOG_META`, erzeugt von derselben Funktion (`shopKatalogJs`), die
  auch der lokale Server benutzt. Die 19 HTML-Seiten binden diese Adresse
  unverändert ein und merken keinen Unterschied.
* `Frontend/netlify/katalog-daten.mjs` (3,6 MB) — was `/api/katalog`,
  `/api/kategorie`, `/api/produkt` und `/api/suche` brauchen. Der Browser sieht
  diese Datei nie; sie wird in die Function gebündelt.

  > Sie liegt bewusst **eine Ebene über** `netlify/functions/`. Netlify macht
  > aus jeder Datei in `functions/` einen eigenen Endpunkt — lag sie dort, gab
  > es eine öffentlich erreichbare Function „katalog-daten" ohne Handler.
  > Nachgemessen mit `netlify dev`: genau das passierte.

**4. Bilanz und Plausibilitätsprüfung.** Am Ende steht auf der Konsole:

```
   Kategorien .................     8
   Unterkategorien ............    16
   Produkte ...................   365
   davon mit Name .............   365  (100 %)
   davon mit Artikel-ID .......   357  (98 %)
   davon mit Listenpreis ......   185  (51 %)
   davon mit Bild .............   288  (79 %)
```

Die Quoten entsprechen dem, was in `ANBINDUNG.md` als Messwert des lokalen
Servers steht — der Katalog ist derselbe.

### Fail-closed: kein leerer Katalog

Das Skript schreibt **erst am Ende** und nur, wenn alles plausibel ist. Es
bricht mit **Exit-Code 1** ab (und schreibt dann gar nichts), wenn

* der Kategoriebaum leer ist,
* kein einziges Produkt gefunden wurde,
* weniger als 4 Kategorien oder weniger als 100 Produkte herauskamen,
* weniger als die Hälfte der Produkte einen Namen oder eine Artikel-ID hat,
* für weniger als 80 % der Produkte Artikeldaten zusammenkamen.

Netlify bricht bei Exit-Code ≠ 0 das Deployment ab. **Die alte Fassung bleibt
online.** Das ist Absicht: eine Seite mit leerem Katalog sähe funktionsfähig
aus und hätte kein einziges Produkt — schlimmer als ein sichtbar
fehlgeschlagenes Deployment.

Der häufigste Grund für einen Abbruch ist, dass matten.de gerade nicht
erreichbar ist. Dann hilft schlicht ein erneutes Deployment.

---

## 3. Deployen

### Einmalig einrichten

```bash
cd "…/Matten de"
netlify login
netlify init          # oder: netlify link, wenn die Site schon existiert
```

`netlify.toml` liegt in der **Repository-Wurzel** (dort sucht Netlify sie);
`base = "Frontend"` schickt den Build in den Unterordner. Es gibt bewusst nur
diese eine `netlify.toml` — zwei würden von Netlify gemischt, und das ist eine
Fehlerquelle, die niemand braucht.

### Deployen

```bash
git add -A && git commit -m "…" && git push      # Netlify baut selbst
```

oder von Hand, ohne Umweg über Git:

```bash
netlify deploy --build            # Vorschau-Adresse
netlify deploy --build --prod     # die echte Adresse
```

`--build` ist wichtig: ohne dieses Flag lädt die CLI nur `dist/` hoch, wie es
gerade auf der Platte liegt — mit einem womöglich uralten Katalog.

Ein Deployment dauert wegen des Katalogaufbaus **rund vier Minuten**.

### Lokal wie auf Netlify testen

```bash
cd "…/Matten de"
node Frontend/bridge-demo/build-katalog.mjs     # einmal, füllt dist/
netlify dev --offline --port 8899
```

`netlify dev` liefert `dist/` statisch aus und führt `netlify/functions/api.mjs`
für `/api/*` aus — dieselbe Aufteilung wie in der Produktion.

Zwei gemessene Eigenheiten, damit niemand unnötig sucht:

* **Der Start dauert drei bis vier Minuten**, und die CLI schreibt dabei lange
  gar nichts. Erst kommt „Local dev server ready", die Functions werden danach
  gebündelt — die 3,6 MB `katalog-daten.mjs` brauchen ihre Zeit. Erst die erste
  `/api/`-Anfrage danach antwortet.
* **`netlify build` und `netlify deploy` brauchen eine verknüpfte Site.** Ohne
  vorheriges `netlify link` bleiben sie ohne Ausgabe hängen (sie warten auf eine
  Eingabe, die in einem nicht-interaktiven Terminal nie kommt). `netlify dev`
  läuft dagegen auch unverknüpft mit `--offline`.

---

## 4. Den Katalog aktualisieren

Der Katalog ist ein **Standbild**. Er ändert sich nur beim Deployment.

| Ziel | Weg |
|---|---|
| Katalog auffrischen, sonst nichts | In Netlify: **Deploys → Trigger deploy → Deploy site**. Baut ihn neu. |
| Nur lokal neu bauen, Dateien nicht neu kopieren | `node Frontend/bridge-demo/build-katalog.mjs --nur-katalog` |
| In ein anderes Verzeichnis bauen | `node Frontend/bridge-demo/build-katalog.mjs --ziel ../woanders` |
| Regelmäßig automatisch | Netlify **Build hook** anlegen und per Cron (z. B. GitHub Actions) anstoßen |

**Wie alt der Katalog ist, steht auf der Seite.** In der Fußzeile jeder
Shop-Seite:

> Produktdaten: Stand 27.08.2026, 23:13 Uhr (UTC) (beim Deployment aus matten.de
> gelesen). Preise im Warenkorb und in der Kasse sind live.

Der lokale Server schreibt an dieselbe Stelle „(live aus matten.de gelesen)".
Beides kommt aus `window.CATALOG_META.standText` und `.erzeugung`.

**Was dadurch veralten kann:** neue Artikel fehlen, entfernte Artikel sind noch
da, geänderte Listenpreise stehen falsch in der Übersicht. **Was nicht
veraltet:** jeder Preis, der auf der Produktdetailseite, im Warenkorb oder in
der Kasse steht — der wird bei jedem Aufruf frisch geholt. Legt jemand einen
zwischenzeitlich entfernten Artikel in den Warenkorb, lehnt matten.de das ab
und die Meldung kommt durch.

---

## 5. Welcher Endpunkt ist live, welcher vorgebaut

### Live gegen matten.de — bei jedem Aufruf

| Endpunkt | Upstream-Anfragen | gemessen |
|---|---|---|
| `GET /api/cart` | 1–2 | 1,4 s |
| `POST /api/cart/add` | 2–3 | 3,5 s |
| `POST /api/cart/menge` | 1 | 1,3 s |
| `POST /api/cart/clear` | 1 + eine je Position | 1,4 s + 1,3 s/Position |
| `GET /api/cart/raw` | 1–2 | 1,5 s |
| `GET /api/price` | 2–3 | 2,7 s |
| `GET /api/konto`, `POST /api/konto/login`, `POST /api/konto/register` | 1–3 | 2,5 s |
| `GET /api/kasse/formular` | 2–3 | 2,8 s |
| `POST /api/kasse/optionen` | 1–2 | 1,6 s |
| `POST /api/kasse/adresse` | 1–2 | 1,8 s |
| `GET /api/kasse/vorschau` | 2 | 2,4 s |
| `POST /api/kasse/bestellen` | **4–5** | **~5–6,5 s** |
| `GET /api/kasse/raw` | 1–2 | 1,6 s |
| `GET /api/img/…` | 1 | 0,4 s |

### Vorgebaut — aus `netlify/katalog-daten.mjs`

| Endpunkt | Quelle |
|---|---|
| `GET /shop/assets/js/catalog.js` | statische Datei im Publish-Verzeichnis |
| `GET /api/katalog` | Kategoriebaum aus dem Build |
| `GET /api/kategorie` | Produktliste je Kategoriepfad |
| `GET /api/produkt` | vollständige Artikeldaten inkl. Kaufformular |
| `GET /api/suche` | Gesamtliste des Altsystems (384 Einträge) |
| `GET /api/katalog/diagnose` | **501** — geht nur lokal, siehe unten |

Jede vorgebaute Antwort trägt ein Feld `herkunft` mit `vorgebaut: true`, dem
Stand und der Begründung. Es ist nirgends zu erraten, ob eine Zahl live ist.

### Das 10-Sekunden-Limit

matten.de antwortet mit rund **1,3 Sekunden je Anfrage** (gemessen über die
390 Anfragen des Katalogaufbaus). Daraus folgt das Budget: **höchstens etwa
sieben Anfragen** hintereinander.

Zwei Endpunkte liegen nah an der Grenze:

* **`POST /api/kasse/bestellen`** — vier Anfragen (Warenkorbseite, Übersichts­seite,
  POST, Umleitung auf `/danke`), fünf bei einer noch leeren Sitzung. Rechnerisch
  5 bis 6,5 s. Um dort
  hinzukommen, wurde eine überflüssige Wiederholung entfernt: der Endpunkt las
  die Warenkorbseite, um die Zahlungsart zu prüfen, und `leseVorschau()` las
  unmittelbar danach dieselbe Seite noch einmal. Jetzt wird der bereits
  gelesene Stand weitergereicht (`leseVorschau(session, { vorabStand })`).
  Geprüft wird derselbe Zustand — nur einmal gelesen statt zweimal. Die zweite,
  *unabhängige* Quelle bleibt: der Zahlungsart-Klartext der Übersichtsseite
  `/bestellen` wird weiterhin frisch geholt und gegengelesen. Diese Änderung
  gilt auch lokal, damit die beiden Wege nicht auseinanderlaufen.
* **`POST /api/cart/clear`** — eine Anfrage je Warenkorbposition. Bei mehr als
  sechs verschiedenen Positionen kann es eng werden. Passiert das, greift die
  eingebaute Ausweichlösung ohnehin nicht mehr; der Nutzer sieht einen
  502-Fehler und kann es erneut versuchen. Bei den üblichen ein bis drei
  Positionen ist das kein Thema.

Wird das Limit gerissen, antwortet Netlify mit 502. Die Seite zeigt dann den
Fehlerkasten der Brücke („Das Altsystem war nicht erreichbar …"), bleibt aber
bedienbar. Es geht dabei nichts kaputt: alle Warenkorb-Operationen sind im
Altsystem einzelne, abgeschlossene Formular-POSTs.

---

## 6. Wie die Sitzung ohne Serverspeicher funktioniert

Das ist der eine echte Unterschied zwischen den beiden Fassungen.

**Lokal:** `server.mjs` hält eine `Map`: `bridge_sid` → Upstream-Cookies. Der
Browser bekommt nur eine zufällige ID; die PHPSESSID von matten.de bleibt im
Serverprozess.

**Auf Netlify gibt es diesen Prozess nicht.** Jede Anfrage kann in einer
anderen Instanz laufen. Eine `Map` im Arbeitsspeicher wäre schlimmer als
nutzlos — sie funktionierte manchmal, und der Warenkorb wäre mal da und mal
weg.

**Also wandert die Upstream-Sitzung in ein Cookie auf der Netlify-Domain:**

```
Browser  --(Cookie mf_sid)-->  Function  --(Cookie PHPSESSID)-->  matten.de
Browser  <--(Set-Cookie)-----  Function  <--(Set-Cookie)--------  matten.de
```

Die Function hält nichts fest. Sie liest die Sitzung aus der Anfrage, reicht
sie weiter, nimmt den aktualisierten Stand entgegen und gibt ihn zurück. Damit
hat jeder Besucher seinen eigenen Warenkorb, ohne dass irgendwo Zustand liegt.

* **Cookie-Attribute:** `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`,
  `Max-Age=14400` (vier Stunden, wie die Sitzungsdauer lokal).
  `Secure` wird nur gesetzt, wenn die Anfrage über `https` kam — auf einer
  Netlify-Domain also immer. Unter `netlify dev` (`http://localhost:8888`) wäre
  ein Secure-Cookie nicht rückübertragbar und der Warenkorb bei jedem Aufruf
  leer.
* **Inhalt:** alle Cookies, die matten.de setzt, als JSON. In der Praxis ist
  das genau eines — `PHPSESSID`. Setzt das Altsystem eines Tages ein zweites,
  wird es mitgeführt, statt still verloren zu gehen.
* **Fail-closed:** Cookie-Namen und -Werte werden gegen den erlaubten
  Zeichenvorrat geprüft, bevor sie in einen `Cookie:`-Header an matten.de
  gehen. Ohne diese Prüfung könnte ein `; ` im Wert einen zweiten Header
  erfinden (Header-Injection). Ein manipuliertes Cookie kann höchstens die
  eigene Sitzung kaputtmachen.
* **`Set-Cookie` nur bei Änderung** — eine reine Leseanfrage schickt keines mit.

---

## 7. Die Sicherheitsmerkmale — was davon bleibt

Alle. Sie stehen im gemeinsamen Kern und gelten deshalb zwangsläufig in beiden
Fassungen. Nachgemessen unter `netlify dev` (Abschnitt 9):

| Merkmal | wo |
|---|---|
| Host-Bindung auf `matten.de`, auch über Redirects (zwei Prüfungen: in `rawRequest` und in `upstream`) | `lib/bruecke.mjs` |
| Zahlungsart-Allowlist: nur `VorkassePayment` und `RechnungPayment`; Ogone-Wege an drei Stellen abgelehnt | `lib/bruecke.mjs` |
| `bestaetigung === "JA-BESTELLEN"` streng gegen den Rohwert, ohne Typumwandlung (`["JA-BESTELLEN"]` wird abgelehnt) | Handler |
| `Content-Type: application/json` Pflicht bei jedem POST | Handler |
| Bildproxy: Pfad-Allowlist, keine Redirects, Content-Type aus der **Antwort** | `lib/bruecke.mjs` |
| Keine Info-Lecks: Details nur ins Log, im Body ein neutraler Satz | Handler |
| Produktpfade normalisiert, fail-closed (`normalisierePfad`) | `lib/bruecke.mjs` |
| Warenkorb-Feldsatz kommt immer aus dem **Live-Formular**, nie vom Aufrufer | `lib/bruecke.mjs` |

### Die Herkunftsprüfung

`isSameOrigin` prüfte lokal gegen `req.headers.host`. Auf Netlify steht ein
Proxy davor, deshalb wird jetzt gegen die **Liste** der Hostnamen geprüft,
unter denen die Auslieferung erreichbar ist: `x-forwarded-host`, `host` und der
Host der aufgelösten Anfrage-URL. Alle drei kommen aus der Anfrage selbst —
genau wie vorher der eine.

Die Regel selbst ist unverändert und wurde eher **enger**: ein vorhandener
`Origin` muss zu dieser Auslieferung gehören, sonst 403. Neu ist, dass ein
`Origin` ohne bekannten eigenen Host jetzt **abgelehnt** wird, statt
durchzurutschen. Der lokale Server ruft dieselbe Funktion auf und übergibt wie
gehabt nur `[req.headers.host]`.

---

## 8. Ehrliche Liste der Unterschiede zum lokalen Server

| | `node server.mjs` | Netlify |
|---|---|---|
| **Katalog** | live gebaut, TTL 10 min, erneuert sich im Hintergrund | Standbild vom Deployment |
| **`/api/produkt`, `/api/kategorie`, `/api/katalog`** | live, immer aktuell | vorgebaut, Stand des letzten Deployments |
| **`/api/suche`** | reicht an `/suche` des Altsystems durch, dessen Trefferliste und Rangfolge | sucht auf der vorgebauten Gesamtliste (384 Einträge). Mehrere Wörter mit ODER, durchsucht Name, Artikelnummer und Kurzbeschreibung. **Die Rangfolge des Altsystems ist nicht nachgebildet** — hier gewinnt der Namenstreffer vor dem Treffer im Beschreibungstext. Volltexttreffer tief in einer Beschreibung, die *nicht* in der Kurzbeschreibung steht, fehlen. |
| **`?details=1` bei `/api/kategorie`** | holt je Produkt die Artikelseite | ohne Wirkung — die Details stecken schon im Katalog |
| **`/api/katalog/diagnose`** | vollständig, mit Live-Stichprobe | **501**. Die Diagnose prüft Dutzende Artikelseiten live; das passt nicht in zehn Sekunden. Die Antwort nennt stattdessen die Bilanz des Builds. |
| **`/api/kasse/raw`** | zeigt nach einer Bestellung die aufbewahrte Rohantwort | zeigt immer die aktuelle Übersichtsseite. Ohne Serverspeicher gibt es nichts aufzubewahren — eine erfundene Rohantwort wäre schlimmer. |
| **Sitzung** | `Map` im Server, Browser bekommt `bridge_sid` | Cookie `mf_sid` auf der Netlify-Domain, Function ist zustandslos |
| **Zwischenspeicher** | Katalog-Cache lebt im Prozess, wärmt sich auf | pro Function-Instanz. Ein Kaltstart hat nichts. Betrifft nur die Live-Endpunkte, die ohnehin frisch lesen wollen. |
| **Laufzeit** | unbegrenzt | 10 s hart. Siehe Abschnitt 5. |
| **Erreichbarkeit** | `127.0.0.1` — nur diese Maschine | öffentlich |
| **Neue Artikel in matten.de** | nach spätestens 10 min sichtbar | erst nach dem nächsten Deployment |
| **Upstream-Protokoll** | jede Anfrage steht in der Serverkonsole | im Netlify-Function-Log (**Logs → Functions → api**) |
| **Startseite** | `/` = Entwickler-Demoseite, Shop unter `/shop/` | `/` leitet auf `/shop/` um; die Demoseite liegt unter `/demo` |

### Was sich **nicht** unterscheidet

* Jeder Preis, jede Summe, jede Steuerangabe kommt live aus matten.de.
* Der Warenkorb ist in beiden Fassungen die echte PHP-Sitzung des Altsystems.
* Sämtliche Parser, Sicherheitsprüfungen und Feldabbildungen — dieselbe Datei.
* Der Inhalt von `window.CATALOG` — dieselbe erzeugende Funktion, dieselben
  Felder, dieselben Zahlen.
* Produktbilder laufen über `/api/img/`; der Browser des Besuchers baut
  weiterhin keine Verbindung zu matten.de auf (Ausnahme wie bisher: die
  Beweis-Ansichten `/api/cart/raw` und `/api/kasse/raw`, was dort im Banner
  steht).

---

## 9. Abnahme unter `netlify dev`

Aufbau: `node Frontend/bridge-demo/build-katalog.mjs`, danach
`netlify dev --offline --port 8899`. Alles gegen das echte matten.de.
**42 Prüfungen, 42 bestanden.**

### Startseite und statische Auslieferung

```
GET /                      302  ->  http://localhost:8899/shop/
GET /shop/                 200
GET /shop/kategorie.html   200
GET /rechner.html          200
GET /preisformel.js        200
GET /kasse.html            200
GET /shop/assets/fonts/barlow-400-latin.woff2   200
GET /demo                  302  ->  /index.html
X-Content-Type-Options: nosniff                  (auf HTML)
Referrer-Policy: strict-origin-when-cross-origin (auf HTML)
```

> **Ein Befund zum Cache:** `netlify dev` setzt auf statische Dateien seine
> eigene Kopfzeile `cache-control: public, max-age=0` und übergeht damit die
> `Cache-Control`-Regeln aus `netlify.toml` — absichtlich, damit man beim
> Entwickeln immer die frische Datei sieht. Die übrigen Regeln aus derselben
> Datei (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`) kommen
> durch, die Regelblöcke werden also gelesen. Die Cache-Zeiten lassen sich
> lokal nicht nachmessen; sie greifen erst in der Produktion.

### Katalog vorhanden und vollständig

```
GET /shop/assets/js/catalog.js   992.813 Bytes
   Kategorien:      8
   Unterkategorien: 16
   Produkte:        365
   mit Artikel-ID:  357
   mit Preis:       185
   mit Bild:        288
   Stufe:           2 von 2     Erzeugung: build
   Stand:           27.08.2026, 22:34 Uhr (UTC)
```

Identisch mit den Messwerten des lokalen Servers in `ANBINDUNG.md`.

### Produktseite zeigt Live-Preis

```
GET /api/produkt?pfad=/logomatten/bierbankmatten/6303041
   ok=true  name=Bierbankmatte: Pils  artikelId=278
   Kaufformular-Felder: 7   Absätze rekonstruiert: 9
   herkunft.vorgebaut = true

GET /api/price?pfad=…&anzahl=3
   ok=true  preis=47.6  gesamt=142.8  versand=11.9
   Upstream-Anfragen: 2  (200/801ms, 200/486ms)     ← live
```

### Cookie-Sitzung hält über mehrere Anfragen

```
GET /api/cart
   set-cookie: mf_sid=%7B%22PHPSESSID%22%3A%22nmuf7jcatk983h6et3b5bbch75%22%7D;
               Path=/; HttpOnly; SameSite=Lax; Max-Age=14400

POST /api/cart/add  {"pfad":"…/6303041","anzahl":2}   ->  count=2   119,00 €
GET  /api/cart      (eigene Anfrage, nur mit Cookie)  ->  count=2   119,00 €
                                                          Position: Bierbankmatte: Pils
```

### Zwei getrennte Cookie-Jars sehen getrennte Warenkörbe

```
Jar A:  2 Stück  ->  count=2   119,00 €   PHPSESSID nmuf7jcatk983h6e…
Jar B:  5 Stück  ->  count=5   297,50 €   PHPSESSID 6f6rnihs7jd2m5ts…
```

Zwei verschiedene PHPSESSIDs, zwei verschiedene Warenkörbe, keine
Vermischung — obwohl beide Anfragen dieselbe zustandslose Function trafen.

### Bildproxy

```
GET /api/img/bild/Bierbank_Pils.jpg      200  image/jpeg  14.809 Bytes
GET /api/img/bild/%2e%2e%2f…passwd.jpg   400  (Traversal, kodiert)
GET /api/img/bild%5C..%5Cx.jpg           400  (Backslash)
GET /api/img/bild/x.php                  400  (fremde Endung)
GET /api/img/a/b/c/d.jpg                 400  (zu viele Segmente)
GET /api/img/bild/gibtesnicht-xyz.jpg    502  (Antwort war kein Bild)
GET /api/img/..%2f..%2fetc%2fpasswd      404  ← siehe unten
```

Der letzte Fall erreicht die Function gar nicht: der Netlify-Proxy löst
`..%2f..` schon vor dem Routing auf, der Pfad liegt danach außerhalb von
`/api/` und landet im 404 des statischen Servers. Ebenfalls dicht, nur eine
Schicht früher.

### Ogone-Zahlungsarten werden abgelehnt

```
POST /api/kasse/optionen {"zahlungsart":"OgonePpPayment"}       400
   „Zahlungsart OgonePpPayment (PayPal (Worldline/Ogone)) ist in dieser
    Demo gesperrt: sie würde zum Zahlungsdienstleister Worldline/Ogone
    weiterleiten. Zugelassen sind nur Vorkasse und Rechnung …"
POST … {"zahlungsart":"OgoneCcPayment"}                         400
POST … {"zahlungsart":"SofortPayment"}                          400  (nicht in der Allowlist)
POST … {"zahlungsart":["VorkassePayment"]}                      400  (kein String → abgelehnt)
```

Die Ablehnung passiert **vor** jedem Upstream-Aufruf — die gesperrte
Zahlungsart gelangt gar nicht erst in die Sitzung des Altsystems.

### Bestellabschluss ohne gültige Bestätigung

```
POST /api/kasse/bestellen  {}                                   400
POST …                     {"bestaetigung":"ja"}                400
POST …                     {"bestaetigung":["JA-BESTELLEN"]}    400   ← Typkoerzierung
POST …                     {"bestaetigung":true}                400
POST …  ohne Content-Type: application/json                     415
```

Der Array-Fall ist der wichtigste: `String(["JA-BESTELLEN"])` ergibt exakt
`"JA-BESTELLEN"`. Verglichen wird gegen den Rohwert, deshalb fällt er durch.

### Notausgang `BESTELLUNG_GESPERRT`

```
nicht gesetzt (Standard)   ->  409   gesperrt=false    (Warenkorb war leer)
BESTELLUNG_GESPERRT=1      ->  503   gesperrt=true     0 Upstream-Anfragen
                    =true  ->  503   gesperrt=true     0 Upstream-Anfragen
                    =ja    ->  503   gesperrt=true     0 Upstream-Anfragen
                    =0     ->  409   gesperrt=false    (gilt als nicht gesetzt)
                    =nein  ->  409   gesperrt=false    (gilt als nicht gesetzt)
gesperrt + falsche Bestätigung  ->  400  („Fehlende Bestaetigung …")
```

Bei gesetzter Sperre erscheint **keine einzige** `[upstream]`-Zeile im Log:
matten.de wird nicht angefasst. Die Bestätigungsprüfung läuft davor.

> Diese sechs Fälle wurden gegen das Function-Modul selbst gefahren, nicht durch
> `netlify dev` hindurch: jede Änderung an einer Umgebungsvariablen verlangt dort
> einen Neustart von drei bis vier Minuten. Es ist derselbe Codepfad — die
> Function liest `process.env.BESTELLUNG_GESPERRT` bei jedem Aufruf neu, nicht
> beim Laden des Moduls.

### Adressvalidierung reicht Feldfehler durch

```
POST /api/kasse/adresse  (leeres Formular, email="keine-mail")   HTTP 422
   gespeichert=false   Feldfehler=10
     - anrede:   Dies ist ein Pflichtfeld!
     - vorname:  Dies ist ein Pflichtfeld!
     - name:     Dies ist ein Pflichtfeld!
     - strasse:  Dies ist ein Pflichtfeld!
     - plz:      Dies ist ein Pflichtfeld!
     - ort:      Dies ist ein Pflichtfeld!
```

Die Meldungen stammen wörtlich aus dem Altsystem, nicht aus dieser Brücke.

### Herkunftsprüfung auf der Netlify-Domain

```
GET /api/cart  Origin: https://boese.example    403
GET /api/cart  Sec-Fetch-Site: cross-site       403
GET /api/cart  Origin: http://localhost:8899    200
```

### Übrige Endpunkte

```
/api/katalog                200      /api/kasse/formular   200
/api/kategorie              200      /api/kasse/vorschau   200
/api/suche?q=bierbank       200      /api/konto            200
   41 Treffer, erste: „Bierbankmatten, Serie: Oktoberfest"
/api/katalog/diagnose       501      (nur lokal, siehe Abschnitt 8)
/api/gibtsnicht             404
```

### Laufzeiten gegen die 10-Sekunden-Grenze

```
/api/cart              1,29 s
/api/price             1,54 s
/api/kasse/formular    1,45 s
/api/kasse/vorschau    1,54 s
/api/konto             1,18 s
/api/produkt           0,36 s   (vorgebaut)
/api/katalog           0,46 s   (vorgebaut)
```

Der teuerste Endpunkt (`/api/kasse/bestellen`, vier bis fünf Upstream-Anfragen)
wurde **nicht bis zum Ende ausgeführt** — es wurde bewusst keine Bestellung
ausgelöst. Aus vier bis fünf Anfragen à ~1,3 s ergeben sich rechnerisch
5 bis 6,5 s.

### Aufgeräumt

Beide Warenkörbe wurden nach dem Test geleert (`count=0`, `Positionen=0`).
**Es wurde zu keinem Zeitpunkt eine Bestellung ausgelöst.**

### Was dabei gefunden und behoben wurde

1. **`/` lieferte die Entwickler-Demoseite statt des Shops** (HTTP 200 statt
   302). Bei Netlify gewinnt eine vorhandene Datei gegen eine Weiterleitung;
   im Publish-Verzeichnis liegt eine `index.html`. Behoben mit `force = true`.
2. **`katalog-daten.mjs` wurde als zweite Function geladen** — `netlify dev`
   meldete „Loaded function katalog-daten". Netlify macht aus jeder Datei in
   `netlify/functions/` einen eigenen Endpunkt; 3,6 MB Daten wären öffentlich
   erreichbar gewesen. Behoben: die Datei liegt jetzt eine Ebene höher unter
   `netlify/` und wird nur noch importiert.
3. **`/api/kasse/bestellen` las die Warenkorbseite zweimal.** Behoben durch
   `leseVorschau(session, { vorabStand })` — siehe Abschnitt 5.

---

## 10. Wenn etwas nicht funktioniert

| Symptom | Ursache | Abhilfe |
|---|---|---|
| Build bricht mit Exit-Code 1 ab | matten.de war nicht erreichbar | erneut deployen |
| Seite lädt, aber keine Produkte | `catalog.js` fehlt oder ist leer | Build-Log ansehen; die Bilanz muss dort stehen |
| Warenkorb ist bei jedem Klick leer | Cookie kommt nicht zurück | Browser blockiert Cookies von Drittanbietern? Unter `netlify dev`: läuft es über `http`? Dann darf `Secure` nicht gesetzt sein — das erledigt die Function selbst. |
| `/api/*` antwortet 403 | Herkunftsprüfung | wird die Seite unter einer anderen Domain aufgerufen als der, auf die das Frontend zeigt? |
| `/api/kasse/bestellen` liefert 502 | 10-Sekunden-Limit gerissen | erneut versuchen; matten.de war langsam |
| Alle `/api/*` antworten 502 | matten.de nicht erreichbar | Function-Log ansehen: dort steht die echte Fehlermeldung |
| Ein neues Produkt fehlt | Katalog ist ein Standbild | Deployment auslösen |

Das Function-Log ist der wichtigste Ort bei der Fehlersuche: dort steht jede
einzelne Anfrage an matten.de mit Statuscode und Dauer — genau wie in der
Konsole des lokalen Servers.
