# matten.de auf dem eigenen Rechner

> **Stand 02.10.2026: läuft.** Der Shop antwortet unter http://localhost:8080 in
> rund 0,08 s (über die Brücke zum Livesystem waren es 2,0–2,6 s). Alle 66 Tabellen
> sind eingespielt, Produktseiten und Warenkorb liefern echte Daten aus der Kopie.

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

## Einmalig: Docker installieren — ist bereits erledigt (02.10.2026)

Installiert ist **nicht** Docker Desktop, sondern **Colima** mit dem Docker-Befehl.
Grund: Docker Desktop will beim Einrichten ein Hilfsprogramm nach `/usr/local/bin`
legen und verlangt dafür das Mac-Passwort. Colima kommt ohne Administratorrechte aus,
liegt vollständig in Homebrew und tut für unsere Zwecke dasselbe.

    brew install colima docker docker-compose

Die Container-Maschine läuft über Apples eigene Virtualisierung:

    colima start --cpu 4 --memory 6 --disk 60 --vm-type vz --arch aarch64

**Nach einem Neustart des Macs** muss sie einmal wieder gestartet werden:

    colima start

Läuft sie? `colima status`. Anhalten: `colima stop` (die Daten bleiben).

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
* **Apple Silicon:** Beide Abbilder gibt es auch für ARM, deshalb laufen sie **nativ**,
  ohne Emulation — also in voller Geschwindigkeit. (Der erste Anlauf lief auf `linux/amd64`;
  das war unnötig, `php:7.0-apache` und `mariadb:10.11` bieten beide `arm64`.)
  Colima ist mit 4 Kernen, 6 GB Arbeitsspeicher und 60 GB Platte eingerichtet.
* **Der Admin-Bereich** liegt unter `http://localhost:8080/admin`.

## Wenn etwas klemmt

| Symptom | Ursache und Abhilfe |
|---|---|
| „Cannot connect to the Docker daemon" | Die Container-Maschine läuft nicht — `colima start` |
| Browser landet auf www.matten.de | Die `.htaccess` des Livesystems erzwingt HTTPS und den Host. `start.sh` setzt dafür die Entwickler-Fassung des Herstellers ein — wenn das fehlschlägt, steht im Protokoll eine Warnung |
| „mysql_select_db … boolean given" | Der Shop erreicht die Datenbank nicht. `docker compose logs web` zeigt, ob die Datenbank-Weiche stand |
| Seite zeigt nur weiß | Datenbank noch beim Einspielen. `docker compose logs -f db` zeigt den Stand |
| „port is already allocated" | Port 8080 ist belegt. In `docker-compose.yml` bei `ports` die 8080 auf z. B. 8081 ändern |
| Shop meldet Datenbankfehler | `docker compose logs web` ansehen; meist war die Datenbank beim Start noch nicht fertig — `docker compose restart web` |

## Drei Hürden beim Einrichten (02.10.2026, für den Fall der Fälle)

1. **Debian Stretch hat abgelaufene Signaturschlüssel.** Die Paketinstallation im
   `Dockerfile` läuft deshalb mit `--allow-unauthenticated` — vertretbar, weil die
   Quelle das offizielle `archive.debian.org` ist und das Abbild nur örtlich läuft.
2. **MariaDB 10.11 stürzt unter Colima ab**, schon bei der Grundeinrichtung
   („Killed"), auch ohne jede eigene Einstellung. **10.6 läuft einwandfrei** und
   genügt: der Shop spricht über seinen Shim ohnehin nur MySQL 5.x.
3. **PHP deutet „localhost" bei MySQL immer als Unix-Socket** und ignoriert dabei
   `/etc/hosts`. Weil die Datenbank im Nachbarcontainer liegt, legt `start.sh` mit
   `socat` an der erwarteten Socket-Stelle eine Weiche zum Datenbank-Container.
   So bleibt `php/config.php` unverändert.

## Nächster Schritt

Wenn der Shop lokal läuft, wird das neue Frontend (`net-neu`) von der Brücke zum Livesystem
auf diese lokale Kopie umgestellt. Dann fällt das HTML-Auslesen weg und die Preisformel
lässt sich direkt im Original anpassen.

Angelegt am 01.10.2026.
