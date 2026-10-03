#!/bin/sh
# pruefe-alles.sh — alle Pruefungen der Preisformel auf einmal
#
# Die PHP-Skripte muessen im Container laufen, weil sie den Shop-Code und die
# Datenbank brauchen. Sie werden dafuer kurz ins Webverzeichnis kopiert und
# danach wieder entfernt — im Webverzeichnis bleibt nichts liegen.
#
# Aufruf aus diesem Ordner:  sh pruefe-alles.sh

set -e

# Auch bei Abbruch (Strg-C, Fehler) nichts im Webverzeichnis liegen lassen:
# diese Dateien laden php/config.php mit Zugangsdaten und waeren ueber HTTP
# abrufbar.
aufraeumen(){
  rm -f "$WEB/_lauf.php" "$WEB/_lauf2.php" "$WEB/_repro.php" "$WEB/_SOLLWERTE.json"
}
trap aufraeumen EXIT INT TERM

HIER="$(cd "$(dirname "$0")" && pwd)"
WURZEL="$(cd "$HIER/../../.." && pwd)"
WEB="$WURZEL/Backup/matten.de-2026-09-07/web"
LOKAL="$WURZEL/Altsystem-lokal"

lauf(){
  echo
  echo "=============================================================="
  echo "  $1"
  echo "=============================================================="
  cp "$HIER/$2" "$WEB/_lauf.php"
  sync; sleep 1                # OneDrive braucht einen Moment, bis die Datei im Container sichtbar ist
  ( cd "$LOKAL" && docker compose exec -T web php /var/www/html/_lauf.php ) || true
  rm -f "$WEB/_lauf.php"
}

# Sollwerte bereitstellen (liest pruefe-formel.php)
cp "$HIER/SOLLWERTE.json" "$WEB/_SOLLWERTE.json"

echo "### Syntaxpruefung (PHP 7.0) ###"
for f in php/Plugins/Katalog/Preisformel.php \
         php/Plugins/Katalog/SpezialoptionSpezial.php \
         php/Plugins/Katalog/Artikel.php \
         php/Plugins/Katalog/ArtikelPage.php; do
  ( cd "$LOKAL" && docker compose exec -T web php -l "/var/www/html/$f" )
done

lauf "1. PHP gegen preisformel.js — 60 Sollwerte"      pruefe-formel.php
lauf "2. Rueckfall: Preise ohne Schalter"              messe-preise.php
lauf "3. Durchgriff: Admin-Wert bis Shop-Preis"        pruefe-durchgriff.php
lauf "4. Grenzfaelle: Stueckzahl, Fehler, Unsinn"      pruefe-grenzfaelle.php
lauf "5. Datenbank-Rundlauf am Testartikel"            pruefe-admin-rundlauf.php
lauf "6. Die fuenf Funde der Pruefer"                  pruefe-funde.php

rm -f "$WEB/_SOLLWERTE.json"

echo
echo "### Rueckfall gegen die Messung von vorher ###"
cp "$HIER/messe-preise.php" "$WEB/_lauf.php"
sync; sleep 1
( cd "$LOKAL" && docker compose exec -T web php /var/www/html/_lauf.php ) > /tmp/messung-jetzt.txt
rm -f "$WEB/_lauf.php"
if diff "$HIER/MESSUNG-VORHER.txt" /tmp/messung-jetzt.txt > /dev/null; then
  echo "  centgenau identisch zu MESSUNG-VORHER.txt"
else
  echo "  ABWEICHUNG — Unterschiede:"
  diff "$HIER/MESSUNG-VORHER.txt" /tmp/messung-jetzt.txt || true
fi

echo
echo "### Webverzeichnis sauber? ###"
ls "$WEB"/_* 2>/dev/null && echo "  ACHTUNG: Reste gefunden" || echo "  keine _*-Dateien"
