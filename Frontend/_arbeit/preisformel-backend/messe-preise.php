<?php
/**
 * messe-preise.php — Rueckfall-Messung
 * ============================================================================
 *
 * Zweck: Beweisen, dass Artikel OHNE gesetzten Schalter "Preisformel
 * verwenden" centgenau denselben Preis liefern wie vor dem Umbau.
 *
 * Aufruf im Container:
 *   docker compose exec -T web php /var/www/html/../_messe-preise.php
 * bzw. ueber den Pfad, unter dem die Datei eingehaengt ist.
 *
 * Es wird NICHTS geschrieben — nur gelesen und gerechnet.
 */

chdir('/var/www/html');
require_once '/var/www/html/master/php/MM.php';
require_once '/var/www/html/php/config.php';
$db = connect_to_db();
$shop = MM::shop();
$shop->setBasisUrl('/');
$shop->init();            // laedt die Plugins — ohne das kennt der Shop kein Katalog

$katalog = $shop->getPlugin('Katalog');

/* Artikel, die die Spezialoption "spezial" benutzen — quer durch die
   Preisklassen, damit ein Rechenfehler auffaellt. */
$ids = array(6, 511, 556, 550, 505, 95, 207, 689, 197, 482, 490, 221);

/* Masse und Mengen, die durchgespielt werden (x = Laenge, y = Breite in m,
   so wie die Spezialoption sie intern haelt). */
$faelle = array(
    array('x' => 1.0,  'y' => 1.0,  'anzahl' => 1),
    array('x' => 2.0,  'y' => 0.85, 'anzahl' => 1),
    array('x' => 2.0,  'y' => 0.85, 'anzahl' => 5),
    array('x' => 0.5,  'y' => 0.5,  'anzahl' => 25),
);

$zeilen = array();
foreach ($ids as $id) {
    $artikel = $katalog->getArtikelById($id);
    if (!$artikel || !$artikel->getId()) {
        $zeilen[] = sprintf("Artikel %-6s FEHLT", $id);
        continue;
    }
    foreach ($faelle as $f) {
        /* Frischer Artikel je Fall, damit sich die Spezialoption nicht
           ueber die Faelle hinweg aufsummiert. */
        $a = $katalog->getArtikelById($id);
        $spez = $a->getSpezialoption();
        $spez->set('x', $f['x']);
        $spez->set('y', $f['y']);

        $preis      = $a->getPreis($f['anzahl']);
        $lieferant  = $a->getLieferantenPreis();
        $optionen   = $a->getOptionenPreis();

        $zeilen[] = sprintf(
            "Art %-6s %-22s x=%-5s y=%-5s n=%-3s | Preis %12s | Lief %12s | Opt %12s",
            $id,
            substr($a->getArtikelnummer(), 0, 22),
            $f['x'], $f['y'], $f['anzahl'],
            number_format($preis, 4, '.', ''),
            number_format($lieferant, 4, '.', ''),
            number_format($optionen, 4, '.', '')
        );
    }
}

echo implode("\n", $zeilen), "\n";
