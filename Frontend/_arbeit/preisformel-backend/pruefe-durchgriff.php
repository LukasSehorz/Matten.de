<?php
/**
 * pruefe-durchgriff.php — vom Admin-Feld bis zum Shop-Preis
 * ===========================================================================
 *
 * Prueft drei Dinge am ECHTEN Artikel, ueber den echten Speicherweg
 * (artikel.spezialoption_data, PHP-serialize):
 *
 *   1. SPEICHERN/LESEN:  Werte wie aus der Admin-Maske setzen, serialisieren,
 *      wieder einlesen — stehen sie noch da?
 *   2. WIRKUNG:          Aendert sich der Shop-Preis, und zwar genau auf den
 *      Wert, den Preisformel::berechne() liefert?
 *   3. RUECKFALL:        Schalter aus → wieder exakt der Ausgangspreis.
 *
 * Es wird NICHTS dauerhaft in die Datenbank geschrieben: der Artikel wird
 * geladen, im Speicher veraendert und nie gespeichert. Am Ende wird der
 * Datenbankstand geprueft und ausgegeben.
 *
 * Aufruf im Container:
 *   docker compose exec -T web php /var/www/html/_pruefe-durchgriff.php
 */

chdir('/var/www/html');
require_once '/var/www/html/master/php/MM.php';
require_once '/var/www/html/php/config.php';
$db = connect_to_db();
$shop = MM::shop();
$shop->setBasisUrl('/');
$shop->init();
$katalog = $shop->getPlugin('Katalog');

$ARTIKEL_ID = 6;          // 64000161, Spezialoption "spezial"
$fehler = array();

/* --- Ausgangslage ----------------------------------------------------- */
$a0 = $katalog->getArtikelById($ARTIKEL_ID);
$s0 = $a0->getSpezialoption();
$s0->set('x', 2.0);      // 200 cm Laenge
$s0->set('y', 0.85);     // 85 cm Breite  (Standardbreite!)
$preis_vorher_n1 = $a0->getPreis(1);
$preis_vorher_n5 = $a0->getPreis(5);

echo "=== 1. Ausgangslage (Schalter nicht gesetzt) ===\n";
printf("Artikel %s (%s), 200 × 85 cm\n", $ARTIKEL_ID, $a0->getArtikelnummer());
printf("  getPreis(1) = %.4f\n", $preis_vorher_n1);
printf("  getPreis(5) = %.4f\n", $preis_vorher_n5);
printf("  Schalter aktiv? %s\n\n", $s0->istPreisformelAktiv() ? 'JA' : 'nein');

if($s0->istPreisformelAktiv()){
    $fehler[] = "Der Schalter ist ohne Pflege schon aktiv — Vorgabe muesste Nein sein.";
}

/* --- 2. Werte setzen, wie es die Admin-Maske tut ----------------------- */
/*  parseAdminPost() liest aus $_POST und ruft set() auf. Genau das wird
    hier nachgestellt, mit denselben Feldnamen.                           */
echo "=== 2. Werte setzen wie die Admin-Maske ===\n";
$a1 = $katalog->getArtikelById($ARTIKEL_ID);
$s1 = $a1->getSpezialoption();
$s1->set('x', 2.0);
$s1->set('y', 0.85);

$eingaben_admin = array(
    'pf_aktiv'           => '1',
    'pf_ek_qm'           => '54,63',
    'pf_colortype'       => '1',
    'pf_sf_mehrfarbig'   => '1,931',
    'pf_standardbreiten' => '60, 75, 85, 115, 150, 200',
    'pf_f_sondermass'    => '1,25',
    'pf_f_form_ohne'     => '1,3',
    'pf_f_form_mit'      => '1,5',
    'pf_sonderfarbe_vk'  => '68',
    'pf_sonderfarbe_ek'  => '50',
    'pf_tz_prozent'      => '0',
    'pf_mengenstaffel'   => '1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88',
    'pf_korrektur'       => ''
);
foreach($eingaben_admin as $feld => $wert){
    $s1->set($feld, $wert);
}
foreach($eingaben_admin as $feld => $wert){
    printf("  %-20s = %s\n", $feld, var_export($wert, true));
}

/* --- 3. Speicherweg: serialize und zurueck ----------------------------- */
echo "\n=== 3. Speichern und wieder lesen (PHP-serialize) ===\n";
$roh = serialize($s1);
printf("  serialisierte Laenge: %d Zeichen\n", strlen($roh));
printf("  enthaelt 'pf_aktiv': %s\n", (strpos($roh, 'pf_aktiv') !== false) ? 'ja' : 'NEIN');

/* Neuen Artikel laden und die serialisierten Daten einspielen — genau das
   macht Artikel::getSpezialoption() beim Lesen aus der Datenbank. */
$a2 = $katalog->getArtikelById($ARTIKEL_ID);
$s2 = unserialize($roh);
$s2->setArtikel($a2);
$a2->setSpezialoption($s2);

$verloren = array();
foreach($eingaben_admin as $feld => $wert){
    $gelesen = $s2->get($feld);
    if((string) $gelesen !== (string) $wert){
        $verloren[] = sprintf("%s: geschrieben %s, gelesen %s", $feld, var_export($wert, true), var_export($gelesen, true));
    }
}
if(count($verloren)){
    echo "  ABWEICHUNGEN nach dem Lesen:\n";
    foreach($verloren as $z){ echo "    $z\n"; }
    $fehler = array_merge($fehler, $verloren);
} else {
    printf("  alle %d Felder unveraendert zurueckgelesen\n", count($eingaben_admin));
}
printf("  Schalter nach dem Lesen aktiv? %s\n", $s2->istPreisformelAktiv() ? 'JA' : 'NEIN');
if(!$s2->istPreisformelAktiv()){
    $fehler[] = "Schalter nach dem Lesen nicht aktiv.";
}

/* Stammdaten, die aus den Feldern gebaut werden */
echo "\n  eingesammelte Stammdaten:\n";
$st = $s2->getPreisformelStammdaten();
foreach($st as $k => $v){
    printf("    %-24s %s\n", $k, is_array($v) ? json_encode($v) : $v);
}

/* --- 4. Wirkt die Aenderung auf den Shop-Preis? ------------------------ */
echo "\n=== 4. Wirkung auf den Preis ===\n";
$mengen = array(1, 2, 5, 12, 35);
foreach($mengen as $n){
    /* frischer Artikel je Menge, damit sich nichts aufsummiert */
    $a = $katalog->getArtikelById($ARTIKEL_ID);
    $s = unserialize($roh);
    $s->setArtikel($a);
    $a->setSpezialoption($s);

    $ist = $a->getPreis($n);

    /* Sollwert direkt aus der Formel: Gesamtpreis durch Menge */
    $soll_r = Preisformel::berechne(
        array('breite' => 85, 'laenge' => 200, 'menge' => $n),
        $s->getPreisformelStammdaten()
    );
    $soll = $soll_r['vkGesamt'] / $n;

    $abw = abs($ist - $soll);
    printf("  n=%-3d Preis je Stueck = %10.4f  (Formel %10.4f, Gesamt %10.4f) %s\n",
        $n, $ist, $soll, $soll_r['vkGesamt'], $abw < 1e-9 ? 'OK' : 'ABWEICHUNG '.$abw);
    if($abw >= 1e-9){
        $fehler[] = "Menge $n: Preis $ist, Formel $soll";
    }
}

/* Mengenstaffel muss sichtbar wirken */
$aA = $katalog->getArtikelById($ARTIKEL_ID); $sA = unserialize($roh); $sA->setArtikel($aA); $aA->setSpezialoption($sA);
$aB = $katalog->getArtikelById($ARTIKEL_ID); $sB = unserialize($roh); $sB->setArtikel($aB); $aB->setSpezialoption($sB);
$p1 = $aA->getPreis(1); $p35 = $aB->getPreis(35);
printf("\n  Mengenstaffel greift: n=1 %.4f vs. n=35 %.4f — %s\n",
    $p1, $p35, ($p35 < $p1) ? 'guenstiger, richtig' : 'KEINE WIRKUNG');
if($p35 >= $p1){
    $fehler[] = "Die Mengenstaffel wirkt nicht.";
}

/* --- 5. Preis-Korrektur ------------------------------------------------ */
echo "\n=== 5. Preis-Korrektur ===\n";
foreach(array('' => 'keine', '+5' => '5 € mehr', '-5' => '5 € weniger', '+10%' => '10 % mehr', '-10%' => '10 % weniger') as $kw => $text){
    $a = $katalog->getArtikelById($ARTIKEL_ID);
    $s = unserialize($roh);
    $s->setArtikel($a);
    $s->set('pf_korrektur', $kw);
    $a->setSpezialoption($s);
    printf("  '%-5s' (%-13s) → %10.4f\n", $kw, $text, $a->getPreis(1));
}

/* --- 6. Rueckfall: Schalter wieder aus --------------------------------- */
echo "\n=== 6. Rueckfall (Schalter auf Nein) ===\n";
$a3 = $katalog->getArtikelById($ARTIKEL_ID);
$s3 = unserialize($roh);
$s3->setArtikel($a3);
$s3->set('pf_aktiv', '0');
$a3->setSpezialoption($s3);
$zurueck_n1 = $a3->getPreis(1);
$zurueck_n5 = $a3->getPreis(5);
printf("  getPreis(1) = %.4f  (vorher %.4f) %s\n", $zurueck_n1, $preis_vorher_n1,
    abs($zurueck_n1 - $preis_vorher_n1) < 1e-9 ? 'centgenau gleich' : 'ABWEICHUNG');
printf("  getPreis(5) = %.4f  (vorher %.4f) %s\n", $zurueck_n5, $preis_vorher_n5,
    abs($zurueck_n5 - $preis_vorher_n5) < 1e-9 ? 'centgenau gleich' : 'ABWEICHUNG');
if(abs($zurueck_n1 - $preis_vorher_n1) >= 1e-9 or abs($zurueck_n5 - $preis_vorher_n5) >= 1e-9){
    $fehler[] = "Rueckfall liefert nicht den Ausgangspreis.";
}

/* Auch ALLE pf_-Werte gesetzt, aber Schalter aus → wie vorher */
$a4 = $katalog->getArtikelById($ARTIKEL_ID);
$s4 = $a4->getSpezialoption();
$s4->set('x', 2.0); $s4->set('y', 0.85);
foreach($eingaben_admin as $feld => $wert){
    if($feld === 'pf_aktiv'){ continue; }
    $s4->set($feld, $wert);
}
$ohne_schalter = $a4->getPreis(1);
printf("  alle Werte gepflegt, Schalter fehlt → %.4f %s\n", $ohne_schalter,
    abs($ohne_schalter - $preis_vorher_n1) < 1e-9 ? 'centgenau wie vorher' : 'ABWEICHUNG');
if(abs($ohne_schalter - $preis_vorher_n1) >= 1e-9){
    $fehler[] = "Gepflegte Werte wirken ohne Schalter.";
}

/* --- 7. Datenbank unberuehrt? ----------------------------------------- */
echo "\n=== 7. Datenbank ===\n";
$q = mysql_query("SELECT spezialoption_data FROM artikel WHERE id=".(int)$ARTIKEL_ID, MeltingShop::$db);
$row = mysql_fetch_row($q);
$in_db = $row[0];
printf("  spezialoption_data in der Datenbank enthaelt 'pf_': %s\n",
    (strpos((string) $in_db, 'pf_') !== false) ? 'JA — es wurde geschrieben!' : 'nein, unberuehrt');
if(strpos((string) $in_db, 'pf_') !== false){
    $fehler[] = "Es wurden Preisformel-Werte in die Datenbank geschrieben.";
}

/* --- Ergebnis ---------------------------------------------------------- */
echo "\n=== ERGEBNIS ===\n";
if(count($fehler)){
    echo "FEHLER (".count($fehler)."):\n";
    foreach($fehler as $z){ echo "  - $z\n"; }
    exit(1);
}
echo "Alle Pruefungen bestanden.\n";
exit(0);
