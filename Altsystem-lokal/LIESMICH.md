# matten.de auf dem eigenen Rechner

Hier läuft der **echte Shop von matten.de** lokal: derselbe PHP-Code, dieselbe Datenbank,
nur eben auf deinem Mac statt auf dem Server der Agentur. Grundlage ist das Backup vom
**07.09.2026** unter `../Backup/matten.de-2026-09-07/`.

## Warum das besser ist als der bisherige Weg

Bisher läuft es so: Das neue Frontend fragt über eine Brücke das **Livesystem** matten.de an
und liest dessen HTML-Seiten aus.

| | bisher (Brücke zum Livesystem) | hier (lokale Kopie) |
|---|---|---|
| Antwortzeit | 2,0–2,6 s je Warenkorb-Aufruf | Millisekunden |
| Testbestellungen | landen **echt** im Livesystem | folgenlos |
| Backend ändern | unmöglich | jederzeit |
| Daten lesen | nur über HTML-Auslesen | direkt aus der Datenbank |
| Internet nötig | ja | nein |

## Einmalig: Docker installieren

1. **Docker Desktop** laden: https://www.docker.com/products/docker-desktop/
   (Variante **Apple Silicon** wählen — dein Mac hat einen M-Prozessor.)
2. Installieren und einmal starten. Docker fragt nach dem Mac-Passwort — das ist normal.
3. Warten, bis oben in der Menüleiste das Wal-Symbol ruhig steht (nicht mehr blinkt).

## Starten

Terminal öffnen, in diesen Ordner wechseln und:

    docker compose up -d

**Der erste Start dauert lange** — rund 15 bis 30 Minuten. Zwei Gründe: Das PHP-7.0-Abbild
wird gebaut, und die 148-MB-Datenbank wird eingespielt. Fortschritt ansehen:

    docker compose logs -f

Sobald „ready for connections" erscheint und der Shop antwortet, ist es so weit:

**http://localhost:8080**

Beim zweiten Start geht es in wenigen Sekunden — die Datenbank bleibt erhalten.

## Stoppen

    docker compose down

Die Daten bleiben. Wenn du wirklich bei null anfangen willst (Datenbank neu einspielen):

    docker compose down -v

## Was wo liegt

| Datei | Zweck |
|---|---|
| `docker-compose.yml` | Beschreibt die zwei Dienste: Shop (`web`) und Datenbank (`db`) |
| `Dockerfile` | Baut die PHP-7.0-Umgebung mit allen nötigen Erweiterungen |
| `start.sh` | Läuft beim Start im Container: verbindet den Shop mit der Datenbank, setzt den Entwicklungs-Schalter |
| `.env` | Zugangsdaten der **lokalen** Datenbank. Nicht ins Repository, steht in `.gitignore` |

Der Quellcode wird **nicht kopiert**, sondern aus `../Backup/matten.de-2026-09-07/web`
eingehängt. Änderungen am Code wirken sofort, ohne Neubau.

## Wichtig zu wissen

* **Der Datenstand ist der 07.09.2026.** Bestellungen und Kunden, die seitdem im echten Shop
  entstanden sind, fehlen hier. Zum Entwickeln ist das richtig so. Vor einem echten Umzug
  bräuchte es einen frischen Auszug.
* **Es ist eine Kopie.** Was du hier änderst oder bestellst, berührt das Livesystem nicht.
* **Apple Silicon:** Beide Dienste laufen über Emulation (`linux/amd64`), weil es die alten
  Abbilder nicht für ARM gibt. Dadurch ist es langsamer als nativ — für die Entwicklung
  trotzdem um ein Vielfaches schneller als der Weg über das Internet zum Livesystem.
* **Der Admin-Bereich** liegt unter `http://localhost:8080/admin`.

## Wenn etwas klemmt

| Symptom | Ursache und Abhilfe |
|---|---|
| „Cannot connect to the Docker daemon" | Docker Desktop läuft nicht — starten und warten, bis das Wal-Symbol ruhig steht |
| Seite zeigt nur weiß | Datenbank noch beim Einspielen. `docker compose logs -f db` zeigt den Stand |
| „port is already allocated" | Port 8080 ist belegt. In `docker-compose.yml` bei `ports` die 8080 auf z. B. 8081 ändern |
| Shop meldet Datenbankfehler | `docker compose logs web` ansehen; meist war die Datenbank beim Start noch nicht fertig — `docker compose restart web` |

## Nächster Schritt

Wenn der Shop lokal läuft, wird das neue Frontend (`net-neu`) von der Brücke zum Livesystem
auf diese lokale Kopie umgestellt. Dann fällt das HTML-Auslesen weg und die Preisformel
lässt sich direkt im Original anpassen.

Angelegt am 01.10.2026.
