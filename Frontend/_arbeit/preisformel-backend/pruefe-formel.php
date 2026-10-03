<?php
/**
 * pruefe-formel.php — PHP gegen JavaScript
 * ===========================================================================
 *
 * Stellt die PHP-Fassung (Preisformel::berechne) gegen SOLLWERTE.json. Diese
 * Datei ist aus Frontend/bridge-demo/public/preisformel.js erzeugt, die
 * gegen beide Excel-Mappen abgesichert ist (61/61 und 40/40).
 *
 * Geprueft werden vkProStueck (G5), vkGesamt (F5) und ekGesamt (H5).
 * Toleranz: 1e-6 relativ.
 *
 * Aufruf im Container:
 *   docker compose exec -T web php /var/www/html/_pruefe-formel.php
 *
 * Rueckgabewert: 0 wenn alles stimmt, sonst 1.
 */

$sollwerteDatei = '/var/www/html/_SOLLWERTE.json';

require_once '/var/www/html/php/Plugins/Katalog/Preisformel.php';

$faelle = json_decode(file_get_contents($sollwerteDatei), true);
if(!is_array($faelle)){
    fwrite(STDERR, "SOLLWERTE.json nicht lesbar\n");
    exit(1);
}

$TOLERANZ = 1e-6;
$fehler = array();
$geprueft = 0;

/** Relativer Abstand zweier Zahlen; bei 0 der absolute. */
function abstand($a, $b){
    $d = abs($a - $b);
    $m = max(abs($a), abs($b));
    return $m > 0 ? $d / $m : $d;
}

foreach($faelle as $f){
    $eingaben = array(
        'breite' => $f['breite'],
        'laenge' => $f['laenge'],
        'menge'  => $f['menge']
    );
    foreach(array('sonderformOhneRand', 'sonderformMitRand', 'sonderfarbe', 'sonderfarbenAnzahl', 'colortype') as $k){
        if(isset($f[$k])){
            $eingaben[$k] = $f[$k];
        }
    }

    $r = Preisformel::berechne($eingaben);

    $erwartetOk = !empty($f['ok']);
    if($erwartetOk !== !empty($r['ok'])){
        $fehler[] = sprintf("Fall %s: ok erwartet %s, erhalten %s (%s)",
            $f['nr'], $erwartetOk ? 'true' : 'false',
            !empty($r['ok']) ? 'true' : 'false',
            isset($r['grund']) ? $r['grund'] : '');
        continue;
    }
    if(!$erwartetOk){
        $geprueft++;
        continue;
    }

    foreach(array('vkProStueck', 'vkGesamt', 'ekGesamt') as $feld){
        if(!isset($f[$feld])){
            continue;
        }
        $soll = (float) $f[$feld];
        $ist  = (float) $r[$feld];
        $a = abstand($soll, $ist);
        if($a > $TOLERANZ){
            $fehler[] = sprintf(
                "Fall %s (%sx%s cm, n=%s%s%s%s): %s soll %.10f, ist %.10f (Abstand %.3e)",
                $f['nr'], $f['breite'], $f['laenge'], $f['menge'],
                !empty($f['sonderformOhneRand']) ? ', Form ohne Rand' : '',
                !empty($f['sonderformMitRand'])  ? ', Form mit Rand'  : '',
                !empty($f['sonderfarbe'])        ? ', Sonderfarbe x'.(isset($f['sonderfarbenAnzahl'])?$f['sonderfarbenAnzahl']:1) : '',
                $feld, $soll, $ist, $a
            );
        }
    }
    $geprueft++;
}

echo "Faelle geprueft: $geprueft von ".count($faelle)."\n";
echo "Verglichene Werte: vkProStueck (G5), vkGesamt (F5), ekGesamt (H5)\n";
echo "Toleranz: 1e-6 relativ\n\n";

if(count($fehler)){
    echo "ABWEICHUNGEN (".count($fehler)."):\n";
    foreach($fehler as $z){
        echo "  $z\n";
    }
    exit(1);
}

echo "Ergebnis: ".$geprueft."/".count($faelle)." — PHP rechnet identisch zu preisformel.js.\n";

/* --- Zusatz: die Preis-Korrektur ------------------------------------- */
$korrekturFaelle = array(
    array('preis' => 100.0, 'k' => '',       'soll' => 100.0),
    array('preis' => 100.0, 'k' => '+5',     'soll' => 105.0),
    array('preis' => 100.0, 'k' => '5',      'soll' => 105.0),
    array('preis' => 100.0, 'k' => '-5',     'soll' => 95.0),
    array('preis' => 100.0, 'k' => '+5%',    'soll' => 105.0),
    array('preis' => 100.0, 'k' => '5%',     'soll' => 105.0),
    array('preis' => 100.0, 'k' => '-5%',    'soll' => 95.0),
    array('preis' => 100.0, 'k' => '2,5%',   'soll' => 102.5),
    array('preis' => 100.0, 'k' => '1,50',   'soll' => 101.5),
    array('preis' => 100.0, 'k' => 'quatsch','soll' => 100.0),
    array('preis' => 100.0, 'k' => '  ',     'soll' => 100.0)
);
$kFehler = array();
foreach($korrekturFaelle as $kf){
    $ist = Preisformel::wendeKorrekturAn($kf['preis'], $kf['k']);
    if(abstand($kf['soll'], $ist) > $TOLERANZ){
        $kFehler[] = sprintf("Korrektur '%s': soll %.4f, ist %.4f", $kf['k'], $kf['soll'], $ist);
    }
}
echo "\nPreis-Korrektur: ".(count($korrekturFaelle) - count($kFehler))."/".count($korrekturFaelle)."\n";
foreach($kFehler as $z){
    echo "  $z\n";
}

/* --- Zusatz: Zahlenliste der Standardbreiten -------------------------- */
$lFehler = array();
$listen = array(
    '60, 75, 85, 115, 150, 200' => array(60, 75, 85, 115, 150, 200),
    '60;75;85'                  => array(60, 75, 85),
    '200 150 60'                => array(60, 150, 200),
    ''                          => array()
);
foreach($listen as $text => $soll){
    $ist = Preisformel::alsZahlenliste($text);
    if($ist != $soll){
        $lFehler[] = "Liste '$text': soll ".json_encode($soll).", ist ".json_encode($ist);
    }
}
echo "Standardbreiten-Liste: ".(count($listen) - count($lFehler))."/".count($listen)."\n";
foreach($lFehler as $z){
    echo "  $z\n";
}

exit(count($kFehler) + count($lFehler) ? 1 : 0);
