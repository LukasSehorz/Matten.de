#!/bin/bash
# Startet den Shop im Container.
#
# Der Shop erwartet seine Datenbank unter dem Namen "localhost" (so steht es im
# Entwicklungs-Zweig von web/php/config.php). Im Verbund laeuft sie aber im
# Nachbarcontainer "db". Statt den Originalcode anzufassen, zeigt "localhost"
# hier auf dessen Adresse — der Quellcode des Altsystems bleibt unveraendert.
set -e

DB_IP="$(getent hosts db | awk '{print $1; exit}')"
if [ -n "$DB_IP" ]; then
  # Bestehenden localhost-Eintrag ersetzen, damit PHP dorthin verbindet.
  sed -i '/[[:space:]]localhost$/d; /^127\.0\.0\.1/d' /etc/hosts
  echo "$DB_IP   localhost" >> /etc/hosts
  echo "127.0.0.1   localhost.eigen" >> /etc/hosts
  echo "[start] localhost zeigt auf den Datenbank-Dienst ($DB_IP)"
else
  echo "[start] WARNUNG: Dienst 'db' nicht gefunden — der Shop findet keine Datenbank."
fi

# Dieser Schalter laesst config.php den Entwicklungs-Zweig nehmen:
# lokale Datenbank statt der Zugaenge des Livesystems, und kein HTTPS-Zwang
# (sonst leitet der Admin-Bereich endlos um).
touch /var/www/html/testmode

# Verzeichnisse, in die der Shop schreibt.
for d in media var dokumente export import rechnungen css/.cache; do
  mkdir -p "/var/www/html/$d" 2>/dev/null || true
done
chown -R www-data:www-data /var/www/html/media /var/www/html/var \
                           /var/www/html/dokumente /var/www/html/css 2>/dev/null || true

echo "[start] Shop laeuft auf http://localhost:8080"
exec apache2-foreground
