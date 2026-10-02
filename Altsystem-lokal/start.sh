#!/bin/bash
# Startet den Shop im Container.
#
# Der Shop erwartet seine Datenbank unter dem Namen "localhost" (so steht es im
# Entwicklungs-Zweig von web/php/config.php). Im Verbund laeuft sie aber im
# Nachbarcontainer "db". Statt den Originalcode anzufassen, zeigt "localhost"
# hier auf dessen Adresse — der Quellcode des Altsystems bleibt unveraendert.
set -e

# Der Shop verbindet sich laut seiner Konfiguration zu "localhost". PHP deutet
# diesen Namen bei MySQL als Unix-Socket auf DIESEM Rechner — dort liegt aber
# keine Datenbank, sie laeuft im Nachbarcontainer "db". Statt den Quellcode
# anzufassen, bekommt PHP eine Vorgabe: jede Verbindung ohne ausdruecklichen
# Host geht an "db", und der Socket-Pfad zeigt ebenfalls dorthin.
DB_IP="$(getent hosts db | awk '{print $1; exit}')"
if [ -n "$DB_IP" ]; then
  # PHP behandelt den Namen "localhost" bei MySQL immer als Unix-Socket und
  # ignoriert dabei /etc/hosts. Loesung ohne Eingriff in den Shop-Code:
  # socat legt an der Stelle, an der PHP den Socket sucht, eine Weiche an,
  # die alles zum Datenbank-Container durchreicht.
  SOCKET="/var/run/mysqld/mysqld.sock"
  mkdir -p "$(dirname "$SOCKET")"
  rm -f "$SOCKET"
  socat "UNIX-LISTEN:$SOCKET,fork,mode=0777" "TCP:$DB_IP:3306" &
  echo "mysqli.default_socket = $SOCKET" > /usr/local/etc/php/conf.d/zz-datenbank.ini
  echo "[start] Datenbank-Weiche: $SOCKET -> $DB_IP:3306"
else
  echo "[start] WARNUNG: Dienst 'db' nicht gefunden — der Shop findet keine Datenbank."
fi

# Dieser Schalter laesst config.php den Entwicklungs-Zweig nehmen:
# lokale Datenbank statt der Zugaenge des Livesystems, und kein HTTPS-Zwang
# (sonst leitet der Admin-Bereich endlos um).
touch /var/www/html/testmode

# Die .htaccess des Livesystems erzwingt HTTPS und den Host www.matten.de —
# oertlich landet der Browser damit auf dem ECHTEN Shop. Der Hersteller hat
# dafuer eine Entwickler-Fassung vorgesehen (build/vagrant/app_config/.htaccess,
# eingehaengt in bootstrap.d.always/80-link-config): nur die Umleitung auf
# index.php, kein Zwang. Die wird hier als Apache-Regel uebernommen.
#
# Wichtig: Das Verzeichnis ist vom Mac eingehaengt — wir schreiben NICHT hinein,
# damit das Backup unveraendert bleibt. Stattdessen traegt Apache die Regeln
# selbst, und die .htaccess des Verzeichnisses wird abgeschaltet.
ENTW="/var/www/html/build/vagrant/app_config/.htaccess"
if [ -f "$ENTW" ]; then
  {
    echo '<Directory /var/www/html>'
    echo '    Options Indexes FollowSymLinks'
    echo '    AllowOverride None'      # .htaccess des Livesystems aussen vor
    echo '    Require all granted'
    cat "$ENTW"
    echo '</Directory>'
  } > /etc/apache2/conf-available/shop.conf
  echo "[start] Entwickler-htaccess des Herstellers uebernommen (ohne HTTPS-Zwang)"
else
  echo "[start] WARNUNG: build/vagrant/app_config/.htaccess nicht gefunden."
fi

# Verzeichnisse, in die der Shop schreibt.
for d in media var dokumente export import rechnungen css/.cache; do
  mkdir -p "/var/www/html/$d" 2>/dev/null || true
done
chown -R www-data:www-data /var/www/html/media /var/www/html/var \
                           /var/www/html/dokumente /var/www/html/css 2>/dev/null || true

echo "[start] Shop laeuft auf http://localhost:8080"
exec apache2-foreground
