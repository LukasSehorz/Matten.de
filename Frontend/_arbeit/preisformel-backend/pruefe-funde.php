<?php
/**
 * pruefe-funde.php — die fuenf Funde der unabhaengigen Pruefungen
 * ===========================================================================
 *
 * Jeder Fund bekommt hier einen Testfall, der ihn nachstellt. Laufen alle
 * durch, ist der jeweilige Fehler weg und kann nicht unbemerkt zurueckkommen.
 *
 *   Fund 1  Mengenstaffel ohne Leerzeichen → stiller Aufschlag von 20 %
 *   Fund 2  Staffel ohne passende Stufe    → Preis 0,00 € bei ok=true
 *   Fund 3  Preis-Korrektur                → negative Preise
 *   Fund 4  ArtikelPage.php                → wirkte ohne Schalter
 *   Fund 5  115 cm                         → galt als Sondermass, 25 % zu teuer
 *
 * Aufruf im Container:
 *   docker compose exec -T web php /var/www/html/_lauf.php
 *
 * Rueckgabewert: 0 wenn alles stimmt, sonst 1.
 */

chdir('/var/www/html');
require_once '/var/www/html/master/php/MM.php';
require_once '/var/www/html/php/config.php';
$db = connect_to_db();
$shop = MM::shop();
$shop->setBasisUrl('/');
$shop->init();
$katalog = $shop->getPlugin('Katalog');

$fehler = array();
$geprueft = 0;

function pruefe($was, $ok, $befund = ''){
    global $fehler, $geprueft;
    $geprueft++;
    printf("  %-4s %s\n", $ok ? 'OK' : 'FEHL', $was);
    if(!$ok){
        $fehler[] = $was.($befund !== '' ? ' — '.$befund : '');
        if($befund !== ''){
            echo "       $befund\n";
        }
    }
}

function nah($a, $b){
    return abs($a - $b) < 1e-9;
}

/* ====================================================================== */
echo "\n=== Fund 1: Mengenstaffel ohne Leerzeichen ===\n";
/* "1:1,2:0,95,3:0,92" wurde frueher als Stufe 1 mit Faktor 1,2 gelesen —
   die "2" der naechsten Stufe wurde zur Nachkommastelle. Ergebnis: 20 %
   Aufschlag auf jede Einzelmatte, Stufe 2 fehlte ganz. */
$soll = array(
    array('schwelle' => 3, 'faktor' => 0.92),
    array('schwelle' => 2, 'faktor' => 0.95),
    array('schwelle' => 1, 'faktor' => 1.0)
);
foreach(array(
    '1:1, 2:0,95, 3:0,92',      // mit Leerzeichen
    '1:1,2:0,95,3:0,92',        // OHNE Leerzeichen — der Fund
    '1:1;2:0,95;3:0,92',        // Semikolon
    "1:1\n2:0,95\n3:0,92",      // Zeilenumbruch
    '1:1, 2:0.95, 3:0.92',      // englische Punkte
    '3:0,92, 1:1, 2:0,95'       // unsortiert
) as $text){
    $ist = SpezialoptionSpezial::leseMengenstaffel($text);
    $gleich = (count($ist) === count($soll));
    if($gleich){
        foreach($soll as $i => $st){
            if($ist[$i]['schwelle'] != $st['schwelle'] or !nah($ist[$i]['faktor'], $st['faktor'])){
                $gleich = false;
            }
        }
    }
    pruefe('Staffel "'.str_replace("\n", '\n', $text).'" ergibt 1:1 / 2:0,95 / 3:0,92',
        $gleich, 'gelesen: '.json_encode($ist));
}
/* Der Faktor darf nie ueber 1 liegen — das waere ein Aufschlag statt Nachlass. */
$r = SpezialoptionSpezial::pruefeMengenstaffel('1:100%, 2:95%');
pruefe('"1:100%, 2:95%" wird verworfen (ergaebe den 100-fachen Preis)',
    count($r['stufen']) === 0 and count($r['maengel']) > 0, json_encode($r));
$r = SpezialoptionSpezial::pruefeMengenstaffel('1:1,2, 2:0,95');
pruefe('Faktor 1,2 wird als Aufschlag erkannt und gemeldet',
    count($r['maengel']) > 0, json_encode($r));
$r = SpezialoptionSpezial::pruefeMengenstaffel('1:0, 2:0,95');
pruefe('Faktor 0 wird verworfen und gemeldet',
    count($r['maengel']) > 0, json_encode($r['maengel']));

/* ====================================================================== */
echo "\n=== Fund 2: Staffel ohne passende Stufe (Preis 0,00 €) ===\n";
/* Frueher: Staffel "30:0,88" → jede Menge unter 30 ergab 0,00 € bei ok=true.
   Der Artikel waere fuer 0 € in den Warenkorb gegangen. */
$r = SpezialoptionSpezial::pruefeMengenstaffel('30:0,88');
$hat1 = false;
foreach($r['stufen'] as $st){
    if($st['schwelle'] == 1 and nah($st['faktor'], 1.0)){ $hat1 = true; }
}
pruefe('Staffel "30:0,88" wird um die Stufe 1:1 ergaenzt', $hat1, json_encode($r['stufen']));

$st = array('mengenstaffel' => $r['stufen']);
foreach(array(1, 2, 29) as $n){
    $x = Preisformel::berechne(array('breite' => 50, 'laenge' => 200, 'menge' => $n), $st);
    pruefe('Menge '.$n.' mit Staffel "30:0,88" ergibt einen Preis groesser 0',
        !empty($x['ok']) and $x['vkGesamt'] > 0,
        'ok='.var_export(!empty($x['ok']), true).' vkGesamt='.(isset($x['vkGesamt']) ? $x['vkGesamt'] : '—'));
}
/* Fehlt die Stufe wirklich (direkt uebergeben, ohne das Ergaenzen), muss die
   Formel einen FEHLER liefern — nicht still 0,00 €. */
$st2 = array('mengenstaffel' => array(array('schwelle' => 30, 'faktor' => 0.88)));
$x = Preisformel::berechne(array('breite' => 50, 'laenge' => 200, 'menge' => 1), $st2);
pruefe('Ohne Stufe fuer Menge 1 liefert die Formel ok=false statt 0,00 €',
    empty($x['ok']) and $x['code'] === 'KEINE_STAFFELSTUFE', json_encode($x));

/* ====================================================================== */
echo "\n=== Fund 3: Preis-Korrektur erzeugt negative Preise ===\n";
$korrektur = array(
    /* Eingabe,      Preis,   erwarteter Preis, erwartetes ok */
    array('+5',      105.0,   110.0,  true),
    array('-5',      105.0,   100.0,  true),
    array('+5%',     100.0,   105.0,  true),
    array('-5%',     100.0,    95.0,  true),
    array('2,5%',    100.0,   102.5,  true),
    array('',        105.0,   105.0,  true),
    array('abc',     105.0,   105.0,  true),   // unlesbar → unveraendert
    array('1e2',     105.0,   105.0,  true),   // Exponent nicht erlaubt
    array('-200',    105.0,   105.0,  false),  // der Fund: ergaebe -95
    array('-150%',   105.0,   105.0,  false),  // der Fund: ergaebe -52,50
    array('-100%',   105.0,   105.0,  false),  // ergaebe genau 0
    array('-105',    105.0,   105.0,  false)   // ergaebe genau 0
);
foreach($korrektur as $kf){
    list($eingabe, $preis, $sollPreis, $sollOk) = $kf;
    $x = Preisformel::rechneKorrektur($preis, $eingabe);
    pruefe('Korrektur "'.$eingabe.'" auf '.$preis.' € → '.$sollPreis.' € (ok='.var_export($sollOk, true).')',
        nah($x['preis'], $sollPreis) and $x['ok'] === $sollOk,
        'ist: '.$x['preis'].' ok='.var_export($x['ok'], true));
}
/* Und durch den Shop hindurch: ein negativer Wert darf nie als Preis ankommen. */
$a = new Artikel(6);
$s = $a->getSpezialoption();
foreach(array('pf_aktiv' => '1', 'pf_ek_qm' => '54,63', 'pf_colortype' => '1',
              'pf_standardbreiten' => '60, 75, 85, 115, 150, 200',
              'pf_mengenstaffel' => '1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88',
              'pf_korrektur' => '-500') as $f => $w){
    $s->set($f, $w);
}
$s->set('x', 2.0); $s->set('y', 0.85);
$a->setSpezialoption($s);
$p = $a->getPreis(1);
pruefe('Korrektur "-500" fuehrt nicht zu einem negativen Artikelpreis', $p > 0, 'Preis: '.$p);

/* ====================================================================== */
echo "\n=== Fund 4: ArtikelPage wirkt nur mit Schalter ===\n";
/* getPreis($anzahl) betritt ab Menge 2 auch den Zweig der BESTEHENDEN
   Preisstaffel (artikel_preisstaffeln). Ohne Schalter darf die Menge
   deshalb gar nicht erst durchgereicht werden. */
$quelle = file_get_contents('/var/www/html/php/Plugins/Katalog/ArtikelPage.php');
/* Geprueft wird die AUFRUFZEILE, nicht der Kommentar darueber (der nennt
   den alten Ausdruck absichtlich, um die Entscheidung zu begruenden). */
$aufrufzeilen = array();
foreach(explode("\n", $quelle) as $zeile){
    if(strpos($zeile, "'preis' =>") !== false or strpos($zeile, "'optionenpreis' =>") !== false){
        $aufrufzeilen[] = trim($zeile);
    }
}
$nur_pf_menge = count($aufrufzeilen) === 2;
foreach($aufrufzeilen as $zeile){
    if(strpos($zeile, '$pf_menge') === false){
        $nur_pf_menge = false;
    }
}
pruefe('ArtikelPage reicht die Menge nur bei aktiver Preisformel durch',
    strpos($quelle, 'istPreisformelAktiv()') !== false and $nur_pf_menge,
    'Aufrufzeilen: '.json_encode($aufrufzeilen));

/* Nachgestellt: Artikel ohne Schalter, Menge 1 und 30 muessen gleich sein. */
$a1 = new Artikel(6);
$s1 = $a1->getSpezialoption();
$s1->set('x', 2.0); $s1->set('y', 0.85);
$a1->setSpezialoption($s1);
$ohne1  = $a1->getPreis(1);
$ohne30 = $a1->getPreis(30);
pruefe('Ohne Schalter: getPreis(1) und getPreis(30) sind gleich',
    nah($ohne1, $ohne30), $ohne1.' vs '.$ohne30);

/* ====================================================================== */
echo "\n=== Fund 5: 115 cm ist eine Standardbreite ===\n";
/* 115 cm liegen intern als 1,15 m; 1,15 · 100 = 114,99999999999998…
   Der Vergleich auf Gleichheit scheiterte, die Matte galt als Sondermass
   und kostete 25 % mehr. */
$vorgabe = Preisformel::getVorgabe();
foreach(array(60, 75, 85, 115, 150, 200) as $cm){
    /* genau so, wie das Altsystem rechnet: cm → m → cm */
    $wie_im_shop = round(($cm / 100) * 100, 4);
    pruefe($cm.' cm gilt als Standardbreite (Faktor 1,0)',
        Preisformel::faktorBreiteFuer($wie_im_shop, 300, $vorgabe) === 1,
        'Faktor: '.var_export(Preisformel::faktorBreiteFuer($wie_im_shop, 300, $vorgabe), true));
}
foreach(array(114, 116, 175) as $cm){
    $wie_im_shop = round(($cm / 100) * 100, 4);
    pruefe($cm.' cm gilt als Sondermass (Faktor 1,25)',
        nah(Preisformel::faktorBreiteFuer($wie_im_shop, 300, $vorgabe), 1.25),
        'Faktor: '.var_export(Preisformel::faktorBreiteFuer($wie_im_shop, 300, $vorgabe), true));
}
/* Durch den echten Shop: 175 × 115 cm darf keinen Sondermass-Aufschlag tragen. */
/* Frisches Objekt aus der Datenbank — getArtikelById() gibt sonst den
   Artikel aus dem Zwischenspeicher zurueck, an dem oben schon gearbeitet
   wurde (Preis-Korrektur "-500"). */
$a2 = new Artikel(6);
$s2 = $a2->getSpezialoption();
foreach(array('pf_aktiv' => '1', 'pf_ek_qm' => '54,63', 'pf_colortype' => '1',
              'pf_standardbreiten' => '60, 75, 85, 115, 150, 200',
              'pf_mengenstaffel' => '1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88') as $f => $w){
    $s2->set($f, $w);
}
$s2->set('x', 1.75);   // 175 cm Laenge
$s2->set('y', 1.15);   // 115 cm Breite
$a2->setSpezialoption($s2);
$mit115 = $a2->getPreis(1);
$soll115 = Preisformel::berechne(
    array('breite' => 115, 'laenge' => 175, 'menge' => 1),
    $s2->getPreisformelStammdaten()
);
pruefe('175 × 115 cm im Shop = Formelwert ohne Sondermass-Aufschlag',
    nah($mit115, $soll115['vkGesamt']) and nah($soll115['faktorBreite'], 1.0),
    'Shop '.$mit115.' vs Formel '.$soll115['vkGesamt'].', faktorBreite '.$soll115['faktorBreite']);

/* ====================================================================== */
echo "\n=== Zusatz: Zahlen-Einlesen (Tausenderpunkt) ===\n";
$zahlen = array(
    array('54,63',     54.63),
    array('54.63',     54.63),
    /* EIN Trennzeichen ist IMMER das Dezimalzeichen — sonst waere der
       Mappenwert 1,931 nicht darstellbar (siehe NEU 1). Wer Eintausend
       meint, schreibt "1000"; so steht es auch im Hinweis an der Maske. */
    array('1.000',     1.0),
    array('1,000',     1.0),
    array('1000',      1000.0),
    array('1.234,56',  1234.56),
    array('1,234.56',  1234.56),
    array('1 000,50',  1000.5),
    array('0.5',       0.5),
    array('0,5',       0.5),
    array('54,63 EUR', null),
    array('5e3',       null),
    array('abc',       null),
    array('',          null)
);
foreach($zahlen as $zf){
    list($eingabe, $soll) = $zf;
    $ist = Preisformel::alsZahl($eingabe);
    $ok = ($soll === null) ? ($ist === null) : ($ist !== null and nah($ist, $soll));
    pruefe('alsZahl("'.$eingabe.'") = '.($soll === null ? 'NULL' : $soll), $ok, 'ist: '.var_export($ist, true));
}
/* Standardbreiten sind ganze Zentimeter und werden ohne Tausenderpunkt
   geschrieben. "1000, 2000" muss durchgehen. */
$r = Preisformel::leseZahlenliste('1000, 2000');
pruefe('Standardbreiten "1000, 2000" ergeben 1000 und 2000',
    $r['liste'] == array(1000, 2000), json_encode($r['liste']));

/* ====================================================================== */
echo "\n=== Zusatz: Ankreuzfelder streng gelesen ===\n";
foreach(array('X' => true, 'x' => true, 'ja' => true, '1' => true, 'true' => true,
              'false' => false, 'n' => false, 'no' => false, 'nein' => false,
              '0' => false, '' => false, '0,0' => false) as $eingabe => $soll){
    pruefe('istGesetzt("'.$eingabe.'") = '.var_export($soll, true),
        Preisformel::istGesetzt($eingabe) === $soll);
}

/* ====================================================================== */
echo "\n=== Zusatz: Rechenart umf faellt sauber zurueck ===\n";
$a3 = new Artikel(6);
$s3 = $a3->getSpezialoption();
$s3->set('calc', 'umf');
$s3->set('pf_aktiv', '1');
$s3->set('x', 2.0); $s3->set('y', 0.85);
$a3->setSpezialoption($s3);
$x = $s3->berechnePreisformel(1);
pruefe('Rechenart "umf" liefert ok=false (statt falsch zu rechnen)',
    empty($x['ok']) and $x['code'] === 'RECHENART_UMF', json_encode($x));


/* ====================================================================== */
echo "\n=== NEU 1: drei Nachkommastellen (Faktor 1000) ===\n";
/* "1,931" wurde als 1931 gelesen — der Salesfactor AUS DER MAPPE. Der
   Shop-Preis waere tausendfach zu hoch gewesen, und keine Pruefung haette
   angeschlagen, weil 1931 eine gueltige Zahl ist. Die Admin-Maske fuehrte
   mit ihrem Platzhalter direkt hinein. */
$mappenwerte = array(
    array('1,931',  1.931),   // Salesfactor mehrfarbig
    array('1,728',  1.728),   // Salesfactor einfarbig
    array('1,8',    1.8),     // Salesfactor Ped-Print
    array('54,63',  54.63),   // EK-Listenpreis
    array('1,25',   1.25),    // Sondermass
    array('1,3',    1.3),     // Sonderform ohne Rand
    array('1,5',    1.5),     // Sonderform mit Rand
    array('68',     68.0),    // Sonderfarbe VK
    array('50',     50.0),    // Sonderfarbe EK
    array('0,88',   0.88),    // Staffel
    array('0,89',   0.89),
    array('0,9',    0.9),
    array('0,92',   0.92),
    array('0,95',   0.95),
    /* dieselben Werte mit drei Nachkommastellen bzw. Punkt */
    array('1.931',  1.931),
    array('54,630', 54.63),
    array('68,000', 68.0),
    array('0,950',  0.95),
    array('0,900',  0.9)
);
foreach($mappenwerte as $mw){
    list($eingabe, $soll) = $mw;
    $ist = Preisformel::alsZahl($eingabe);
    pruefe('alsZahl("'.$eingabe.'") = '.$soll,
        $ist !== null and nah($ist, $soll), 'ist: '.var_export($ist, true));
}
/* Mehrere Trennzeichen bleiben Tausendertrenner. */
foreach(array(array('1.234.567', 1234567.0), array('1,234,567', 1234567.0),
              array('1.234,56', 1234.56), array('1,234.56', 1234.56)) as $mw){
    list($eingabe, $soll) = $mw;
    $ist = Preisformel::alsZahl($eingabe);
    pruefe('alsZahl("'.$eingabe.'") = '.$soll, $ist !== null and nah($ist, $soll), 'ist: '.var_export($ist, true));
}
/* Durch den Shop: Salesfactor 1,931 darf keinen Preis im Zehntausenderbereich geben. */
$a4 = new Artikel(6);
$s4 = $a4->getSpezialoption();
foreach(array('pf_aktiv' => '1', 'pf_ek_qm' => '54,63', 'pf_colortype' => '1',
              'pf_sf_mehrfarbig' => '1,931',
              'pf_standardbreiten' => '60, 75, 85, 115, 150, 200',
              'pf_mengenstaffel' => '1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88') as $f => $w){
    $s4->set($f, $w);
}
$s4->set('x', 1.0); $s4->set('y', 1.0);   // 100 x 100 cm
$preis100 = $a4->getPreis(1);
pruefe('Salesfactor "1,931" ergibt rund 131,86 € (nicht 131.863 €)',
    $preis100 > 100 and $preis100 < 200, 'Preis: '.$preis100);
/* Und die Pruefung muss einen verrutschten Wert melden. */
$a5 = new Artikel(6);
$s5 = $a5->getSpezialoption();
$s5->set('pf_aktiv', '1');
$s5->set('pf_sf_mehrfarbig', '1931');
$p5 = $s5->pruefePreisformel();
pruefe('Salesfactor 1931 wird als unplausibel gemeldet', count($p5['maengel']) > 0,
    json_encode($p5['maengel']));
$a6 = new Artikel(6);
$s6 = $a6->getSpezialoption();
$s6->set('pf_aktiv', '1');
$s6->set('pf_ek_qm', '54630');
$p6 = $s6->pruefePreisformel();
pruefe('EK-Listenpreis 54630 € wird als unplausibel gemeldet', count($p6['maengel']) > 0,
    json_encode($p6['maengel']));

/* ====================================================================== */
echo "\n=== NEU 2: nachlaufendes Komma / krumme Stufe ===\n";
$sollStaffel = array(
    array('1:1, 2:0,95,',  array(2 => 0.95, 1 => 1.0)),   // Komma am Ende
    array('2:0,950',       array(2 => 0.95, 1 => 1.0)),   // drei Nachkommastellen
    array('1:1, 2:0,95',   array(2 => 0.95, 1 => 1.0))    // normal
);
foreach($sollStaffel as $sf){
    list($text, $soll) = $sf;
    $r = SpezialoptionSpezial::pruefeMengenstaffel($text);
    $ist = array();
    foreach($r['stufen'] as $st){ $ist[(int) $st['schwelle']] = $st['faktor']; }
    $gleich = (count($ist) === count($soll));
    if($gleich){
        foreach($soll as $schwelle => $faktor){
            if(!isset($ist[$schwelle]) or !nah($ist[$schwelle], $faktor)){ $gleich = false; }
        }
    }
    pruefe('Staffel "'.$text.'" ergibt '.json_encode($soll), $gleich, 'gelesen: '.json_encode($ist));
}
/* "1,5:0,95" darf keine Stufe 5 erfinden. */
$r = SpezialoptionSpezial::pruefeMengenstaffel('1,5:0,95');
$hat5 = false;
foreach($r['stufen'] as $st){ if($st['schwelle'] == 5){ $hat5 = true; } }
pruefe('"1,5:0,95" erfindet keine Stufe 5', !$hat5 and count($r['maengel']) > 0,
    json_encode($r));

/* ====================================================================== */
echo "\n=== NEU 3: Schalter EIN + bestehende Preisstaffel ===\n";
/* getAufpreis() zog getBasisPreis() OHNE Menge ab, getPreis($n) addiert
   getBasisPreis($n) — bei einem Artikel mit Preisstaffel blieb die Differenz
   als zusaetzlicher, stiller Rabatt stehen. */
$quelle = file_get_contents('/var/www/html/php/Plugins/Katalog/SpezialoptionSpezial.php');
pruefe('getAufpreis zieht den Basispreis mit derselben Menge ab',
    strpos($quelle, 'getBasisPreis($menge)') !== false,
    'Quelltext enthaelt getBasisPreis($menge) nicht');

/* Nachgestellt an einem TESTARTIKEL mit echter Preisstaffel in der
   Datenbank (artikel.preisstaffel + Tabelle artikel_preisstaffeln).
   Der Artikel wird am Ende dieses Blocks wieder geloescht. */
$vorlage = mysql_fetch_assoc(mysql_query("SELECT * FROM artikel WHERE id=6", MeltingShop::$db));
unset($vorlage['id']);
$vorlage['artikelnummer'] = 'ZZ-PRUEF-STAFFEL';
$vorlage['preisstaffel']  = 'absolut';
$sp = array(); $wt = array();
foreach($vorlage as $c => $x){
    $sp[] = '`'.$c.'`';
    $wt[] = ($x === null) ? 'NULL' : "'".mysql_real_escape_string($x)."'";
}
mysql_query('INSERT INTO artikel ('.implode(',', $sp).') VALUES ('.implode(',', $wt).')', MeltingShop::$db);
$testid = mysql_insert_id(MeltingShop::$db);
mysql_query('INSERT INTO artikel_preisstaffeln (artikel_id, anzahl, preis) VALUES ('.$testid.', 10, 20.00)', MeltingShop::$db);

$a7 = new Artikel($testid);
$s7 = $a7->getSpezialoption();
foreach(array('pf_aktiv' => '1', 'pf_ek_qm' => '54,63', 'pf_colortype' => '1',
              'pf_sf_mehrfarbig' => '1,931',
              'pf_standardbreiten' => '60, 75, 85, 115, 150, 200',
              'pf_mengenstaffel' => '1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88') as $f => $w){
    $s7->set($f, $w);
}
$s7->set('x', 2.0); $s7->set('y', 0.85);
$staffelpreis = $a7->getBasisPreis(25);
$einzelpreis  = $a7->getBasisPreis(1);
pruefe('Testartikel hat eine wirksame Preisstaffel (Basispreis 25 != Basispreis 1)',
    !nah($staffelpreis, $einzelpreis), 'Basis 25: '.$staffelpreis.' · Basis 1: '.$einzelpreis);

$mitStaffel = $a7->getPreis(25);
$sollR = Preisformel::berechne(
    array('breite' => 85, 'laenge' => 200, 'menge' => 25),
    $s7->getPreisformelStammdaten()
);
pruefe('Mit bestehender Preisstaffel rechnet die Formel unveraendert (kein doppelter Rabatt)',
    nah($mitStaffel, $sollR['vkGesamt'] / 25),
    'Shop '.$mitStaffel.' vs Formel '.($sollR['vkGesamt'] / 25));

/* Testartikel wieder entfernen */
mysql_query('DELETE FROM artikel WHERE id='.$testid, MeltingShop::$db);
mysql_query('DELETE FROM artikel_preisstaffeln WHERE artikel_id='.$testid, MeltingShop::$db);
mysql_query('DELETE FROM artikel_kategorien WHERE artikel_id='.$testid, MeltingShop::$db);
mysql_query('DELETE FROM artikel_dateien WHERE artikel_id='.$testid, MeltingShop::$db);
$reste = mysql_fetch_row(mysql_query("SELECT COUNT(*) FROM artikel WHERE artikelnummer LIKE 'ZZ-PRUEF%'", MeltingShop::$db));
pruefe('Testartikel der Staffel-Pruefung wieder entfernt', $reste[0] == 0, 'Reste: '.$reste[0]);

/* ====================================================================== */
echo "\n=== ERGEBNIS ===\n";
printf("  %d von %d Pruefungen bestanden\n", $geprueft - count($fehler), $geprueft);
if(count($fehler)){
    echo "\n  FEHLGESCHLAGEN:\n";
    foreach($fehler as $z){
        echo "    - $z\n";
    }
    exit(1);
}
echo "  Alle fuenf Funde sind behoben.\n";
exit(0);
