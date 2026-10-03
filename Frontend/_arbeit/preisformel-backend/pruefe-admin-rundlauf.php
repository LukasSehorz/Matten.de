<?php
/* Echter Datenbank-Rundlauf an einem TESTARTIKEL. Gespeichert wird mit
   save(true) — genau so macht es die Admin-Maske bei einem bestehenden
   Artikel (AdminNewListEditPage::saveObject, Zeile 722). */
chdir('/var/www/html');
require_once '/var/www/html/master/php/MM.php';
require_once '/var/www/html/php/config.php';
$db=connect_to_db(); $shop=MM::shop(); $shop->setBasisUrl('/'); $shop->init();

$q = mysql_query("SELECT * FROM artikel WHERE id=6", MeltingShop::$db);
$v = mysql_fetch_assoc($q); unset($v['id']);
$v['artikelnummer']='ZZ-PRUEF-PREISFORMEL';
$sp=array(); $w=array();
foreach($v as $c=>$x){ $sp[]="`$c`"; $w[] = ($x===null)?"NULL":"'".mysql_real_escape_string($x, MeltingShop::$db)."'"; }
mysql_query("INSERT INTO artikel (".implode(',',$sp).") VALUES (".implode(',',$w).")", MeltingShop::$db) or die(mysql_error(MeltingShop::$db));
$id = mysql_insert_id(MeltingShop::$db);
echo "Testartikel id=$id angelegt\n\n";

$a = new Artikel($id);
$s = $a->getSpezialoption();
$_POST = array('spezialoption' => array($id => array('spezial' => array(
  'pf_aktiv'=>'1', 'pf_ek_qm'=>'54,63', 'pf_colortype'=>'1',
  'pf_standardbreiten'=>'60, 75, 85, 115, 150, 200',
  'pf_mengenstaffel'=>'1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88',
  'pf_korrektur'=>'+2,50',
))));
$s->parseAdminPost();
$ok = $a->save(true);                 // UPDATE, wie die Admin-Maske
echo "save(true) ergab: ".var_export($ok,true)."\n";

$roh = mysql_fetch_row(mysql_query("SELECT spezialoption_data FROM artikel WHERE id=$id", MeltingShop::$db))[0];
printf("\nspezialoption_data in der DB: %d Zeichen\n", strlen($roh));
printf("  PHP-serialize (nicht JSON): %s\n", (substr($roh,0,2)==='C:')?'ja':'NEIN');
printf("  enthaelt pf_aktiv / pf_mengenstaffel: %s / %s\n",
  (strpos($roh,'pf_aktiv')!==false)?'ja':'NEIN', (strpos($roh,'pf_mengenstaffel')!==false)?'ja':'NEIN');

/* --- Neu laden, als waere es ein neuer Seitenaufruf ----------------- */
$a2 = new Artikel($id);
$s2 = $a2->getSpezialoption();
echo "\n=== nach dem Neuladen aus der Datenbank ===\n";
$soll = array('pf_aktiv'=>'1','pf_ek_qm'=>'54,63','pf_colortype'=>'1',
  'pf_standardbreiten'=>'60, 75, 85, 115, 150, 200',
  'pf_mengenstaffel'=>'1:1, 2:0,95, 3:0,92, 10:0,90, 20:0,89, 30:0,88',
  'pf_korrektur'=>'+2,50');
$verloren=0;
foreach($soll as $f=>$wert){
  $ist=$s2->get($f); $o=((string)$ist===(string)$wert); if(!$o)$verloren++;
  printf("  %-20s %-48s %s\n", $f, var_export($ist,true), $o?'OK':'ABWEICHUNG');
}
printf("\n  Schalter aktiv: %s · verlorene Felder: %d\n", $s2->istPreisformelAktiv()?'JA':'NEIN', $verloren);
echo "\n  Mengenstaffel gelesen: ".json_encode($s2->getPreisformelStammdaten()['mengenstaffel'])."\n";

$s2->set('x',2.0); $s2->set('y',0.85);
printf("\n  Shop-Preis n=1: %.4f   n=5: %.4f   n=35: %.4f\n", $a2->getPreis(1), $a2->getPreis(5), $a2->getPreis(35));
$r = Preisformel::berechne(array('breite'=>85,'laenge'=>200,'menge'=>5), $s2->getPreisformelStammdaten());
printf("  Gegenrechnung n=5 (Formel %.4f, +2,50 ergibt %.4f)\n", $r['vkGesamt']/5, Preisformel::wendeKorrekturAn($r['vkGesamt']/5,'+2,50'));

/* --- Jetzt Schalter per Maske wieder auf Nein ----------------------- */
echo "\n=== Schalter ueber die Maske auf Nein ===\n";
$a3 = new Artikel($id);
$s3 = $a3->getSpezialoption();
$_POST = array('spezialoption' => array($id => array('spezial' => array('pf_aktiv'=>'0'))));
$s3->parseAdminPost();
$a3->save(true);
$a4 = new Artikel($id);
$s4 = $a4->getSpezialoption();
$s4->set('x',2.0); $s4->set('y',0.85);
printf("  pf_aktiv in der DB jetzt: %s · Schalter aktiv: %s\n", var_export($s4->get('pf_aktiv'),true), $s4->istPreisformelAktiv()?'JA':'nein');
printf("  Preis n=1: %.4f  n=5: %.4f  (muss 100.6400 sein — wie Artikel 6)\n", $a4->getPreis(1), $a4->getPreis(5));
printf("  gepflegte Werte noch da (pf_ek_qm): %s\n", var_export($s4->get('pf_ek_qm'),true));

/* --- Warenkorb ------------------------------------------------------ */
echo "\n=== Warenkorb mit eingeschalteter Formel ===\n";
$a5 = new Artikel($id);
$s5 = $a5->getSpezialoption();
$_POST = array('spezialoption' => array($id => array('spezial' => array('pf_aktiv'=>'1'))));
$s5->parseAdminPost(); $a5->save(true);
foreach(array(1,5,35) as $n){
  $ax = new Artikel($id); $sx=$ax->getSpezialoption(); $sx->set('x',2.0); $sx->set('y',0.85);
  $wa = new WarenkorbArtikel($ax); $wa->setAnzahl($n);
  printf("  Anzahl %-3d → %10.4f je Stueck\n", $n, $wa->getNettoPreis());
}

/* --- Aufraeumen ----------------------------------------------------- */
mysql_query("DELETE FROM artikel WHERE id=$id", MeltingShop::$db);
mysql_query("DELETE FROM artikel_kategorien WHERE artikel_id=$id", MeltingShop::$db);
mysql_query("DELETE FROM artikel_dateien WHERE artikel_id=$id", MeltingShop::$db);
mysql_query("DELETE FROM artikel_texte WHERE artikel_id=$id", MeltingShop::$db);
printf("\nAufgeraeumt. Reste 'ZZ-PRUEF': %s\n", mysql_fetch_row(mysql_query("SELECT COUNT(*) FROM artikel WHERE artikelnummer LIKE 'ZZ-PRUEF%'", MeltingShop::$db))[0]);
