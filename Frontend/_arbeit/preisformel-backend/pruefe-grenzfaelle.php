<?php
/* Grenzfaelle der Stueckzahl: 0, negativ, fehlend, Text.
   Mit eingeschalteter Formel — die Menge darf nie zu einem Preis 0 fuehren. */
chdir('/var/www/html');
require_once '/var/www/html/master/php/MM.php';
require_once '/var/www/html/php/config.php';
$db=connect_to_db(); $shop=MM::shop(); $shop->setBasisUrl('/'); $shop->init();
$k=$shop->getPlugin('Katalog');

$pf = array('pf_aktiv'=>'1','pf_ek_qm'=>'54,63','pf_colortype'=>'1',
  'pf_standardbreiten'=>'60, 75, 85, 115, 150, 200',
  'pf_mengenstaffel'=>'1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88');

function preisMit($k, $pf, $anzahl, $extra=array()){
  $a = $k->getArtikelById(6);
  $s = clone $a->getSpezialoption();
  $s->setArtikel($a);
  foreach(array_merge($pf,$extra) as $f=>$w){ $s->set($f,$w); }
  $s->set('x',2.0); $s->set('y',0.85);
  $a->setSpezialoption($s);
  return $a->getPreis($anzahl);
}

echo "=== Stueckzahl-Grenzfaelle (Formel AN) ===\n";
foreach(array(1,2,0,-5,'3','abc',null) as $n){
  printf("  getPreis(%-6s) = %10.4f\n", var_export($n,true), preisMit($k,$pf,$n));
}
echo "\n  (0, negativ und Unsinn muessen wie 1 Stueck rechnen: 179.3339)\n";

echo "\n=== getAufpreis() ohne Argumente — wie die Basisklasse ===\n";
$a = $k->getArtikelById(6);
$s = clone $a->getSpezialoption(); $s->setArtikel($a);
foreach($pf as $f=>$w){ $s->set($f,$w); }
$s->set('x',2.0); $s->set('y',0.85);
$a->setSpezialoption($s);
printf("  getAufpreis()            = %10.4f\n", $s->getAufpreis());
printf("  getAufpreis(array())     = %10.4f\n", $s->getAufpreis(array()));
printf("  getAufpreis(array(),1)   = %10.4f\n", $s->getAufpreis(array(),1));
printf("  getAufpreis(array(),5)   = %10.4f\n", $s->getAufpreis(array(),5));
printf("  Lieferantenpreis-Zweig   = %10.4f\n", $s->getAufpreis(array('lieferantenpreis'=>1),5));

echo "\n=== Fehlerfaelle der Formel: faellt auf die alte Rechnung zurueck? ===\n";
/* zu schmal: 20 cm */
$a2 = $k->getArtikelById(6);
$s2 = clone $a2->getSpezialoption(); $s2->setArtikel($a2);
foreach($pf as $f=>$w){ $s2->set($f,$w); }
$s2->set('x',0.20); $s2->set('y',0.20);
$a2->setSpezialoption($s2);
$r = Preisformel::berechne(array('breite'=>20,'laenge'=>20,'menge'=>1), $s2->getPreisformelStammdaten());
printf("  20x20 cm: Formel sagt '%s' → Shop-Preis %.4f (alte Rechnung, nicht 0)\n",
  isset($r['grund'])?$r['grund']:'ok', $a2->getPreis(1));
/* zu lang: 800 cm */
$a3 = $k->getArtikelById(6);
$s3 = clone $a3->getSpezialoption(); $s3->setArtikel($a3);
foreach($pf as $f=>$w){ $s3->set($f,$w); }
$s3->set('x',8.0); $s3->set('y',0.85);
$a3->setSpezialoption($s3);
$r3 = Preisformel::berechne(array('breite'=>85,'laenge'=>800,'menge'=>1), $s3->getPreisformelStammdaten());
printf("  85x800 cm: Formel sagt '%s' → Shop-Preis %.4f\n",
  isset($r3['grund'])?$r3['grund']:'ok', $a3->getPreis(1));
/* Unsinnige Mengenstaffel → Vorgabe greift */
$a4 = $k->getArtikelById(6);
$s4 = clone $a4->getSpezialoption(); $s4->setArtikel($a4);
foreach($pf as $f=>$w){ $s4->set($f,$w); }
$s4->set('pf_mengenstaffel','voelliger Unsinn');
$s4->set('x',2.0); $s4->set('y',0.85);
$a4->setSpezialoption($s4);
printf("  kaputte Mengenstaffel → %.4f (Vorgabe greift, nicht 0)\n", $a4->getPreis(5));
/* Leere Standardbreiten */
$a5 = $k->getArtikelById(6);
$s5 = clone $a5->getSpezialoption(); $s5->setArtikel($a5);
foreach($pf as $f=>$w){ $s5->set($f,$w); }
$s5->set('pf_standardbreiten','');
$s5->set('x',2.0); $s5->set('y',0.85);
$a5->setSpezialoption($s5);
printf("  leere Standardbreiten → %.4f (Vorgabe greift)\n", $a5->getPreis(1));
