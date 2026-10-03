<?php
/**
 * Preisformel — die Kalkulation des Auftraggebers aus der Excel-Mappe
 * ===========================================================================
 *
 * Diese Klasse bildet dieselbe Rechnung ab wie
 * Frontend/bridge-demo/public/preisformel.js. Jene Datei ist die abgesicherte
 * Referenz: sie rechnet in 40 von 40 Faellen wie die neue Arbeitsmappe
 * (1PREISE-Brian_Sehorz-26-09-30) und in 61 von 61 wie die aeltere.
 * Aenderungen hier muessen dort nachgezogen werden und umgekehrt.
 *
 * Jeder Rechenschritt traegt den Excel-Zellbezug als Kommentar, damit die
 * Herkunft nachpruefbar bleibt.
 *
 * Die Klasse rechnet nur. Sie liest nichts aus der Datenbank, schreibt nichts
 * und kennt den Artikel nicht — die Stammgroessen bekommt sie uebergeben.
 * Zustaendig fuer das Einsammeln der Werte ist SpezialoptionSpezial.
 *
 * PHP 7.0 — keine neuere Syntax.
 */
class Preisformel{

    /** Fehlertexte, genau wie sie in L5 bzw. M5 der Mappe stehen. */
    const GRUND_ZU_SCHMAL = 'zu schmal';
    const GRUND_ZU_BREIT  = 'Matte zu breit';
    const GRUND_ZU_LANG   = 'Matte zu lang';

    /**
     * Vorgabewerte aller Stammgroessen — wortgleich mit STAMMDATEN_VORGABE
     * in preisformel.js. Sie greifen nur, wo der Auftraggeber im Admin
     * nichts gepflegt hat.
     *
     * @return array
     */
    public static function getVorgabe(){
        return array(
            // --- Colortype der Matte (Artikelstammdatum) ------------------
            'colortype'              => 1,        // F2 — 1 | 2 | 3

            // --- Salesfactoren je Colortype ------------------------------
            'salesfactorMehrfarbig'  => 1.931,    // F1 — Colortype 1
            'salesfactorEinfarbig'   => 1.728,    // I1 — Colortype 2
            'salesfactorPedPrint'    => 1.8,      // L1 — Colortype 3
            'salesfactorFallback'    => 0,        // F19 — leere Zelle

            // --- Einkauf --------------------------------------------------
            'ekListenpreisProQm'     => 54.63,    // Q5

            // --- Teuerungszuschlag ---------------------------------------
            'tzProzent'              => 0,        // R2 — Faktor S2 = 1 + R2/100

            // --- Masse ----------------------------------------------------
            'minBreite'              => 30,       // B6 — gilt fuer BEIDE Seiten
            'maxLaenge'              => 700,      // C6

            // --- Standardbreiten der Rolle in cm (Q7:V7) ------------------
            // Der groesste Wert ist zugleich die Rollenbreite (V7).
            'standardbreiten'        => array(60, 75, 85, 115, 150, 200),

            // --- Mengenstaffel (Q6:V6 Schwellen, R5:V5 Faktoren) ----------
            // Von oben nach unten ausgewertet, die erste passende Stufe gewinnt.
            'mengenstaffel'          => array(
                array('schwelle' => 30, 'faktor' => 0.88),   // V6/V5
                array('schwelle' => 20, 'faktor' => 0.89),   // U6/U5
                array('schwelle' => 10, 'faktor' => 0.90),   // T6/T5
                array('schwelle' =>  3, 'faktor' => 0.92),   // S6/S5
                array('schwelle' =>  2, 'faktor' => 0.95),   // R6/R5
                array('schwelle' =>  1, 'faktor' => 1.00)    // Q6 (ohne Faktor)
            ),

            // --- Zuschlagsfaktoren ----------------------------------------
            'faktorSondermass'       => 1.25,     // L5
            'faktorSonderformOhne'   => 1.3,      // N5 — ohne Rand, 30 %
            'faktorSonderformMit'    => 1.5,      // O5 — mit Rand, 50 %

            // --- Sonderfarbe: feste Betraege, EINMAL je Auftrag -----------
            'aufschlagSonderfarbeVK' => 68,       // P5
            'aufschlagSonderfarbeEK' => 50        // P6
        );
    }

    /**
     * C2 — Salesfactor aus dem Colortype (F2).
     * Excel: =IF($F$2=1,$F$1,IF($F$2=2,$I$1,IF($F$2=3,$L$1,F19)))
     * F19 ist leer; Excel liest eine leere Zelle als 0.
     */
    public static function salesfactorFuer($colortype, $s){
        if((int) $colortype === 1) return $s['salesfactorMehrfarbig'];
        if((int) $colortype === 2) return $s['salesfactorEinfarbig'];
        if((int) $colortype === 3) return $s['salesfactorPedPrint'];
        return $s['salesfactorFallback'];
    }

    /**
     * L5 — Faktor Sonderbreite. Es genuegt, wenn EINE der beiden Seiten
     * exakt eine Standardbreite trifft; dann ist der Faktor 1.
     * Liefert bei zu kleinem Mass den Fehlertext als String.
     */
    public static function faktorBreiteFuer($breite, $laenge, $s){
        if($breite < $s['minBreite'] or $laenge < $s['minBreite']){
            return self::GRUND_ZU_SCHMAL;
        }
        foreach($s['standardbreiten'] as $b){
            if(self::gleichesMass($breite, $b) or self::gleichesMass($laenge, $b)){
                return 1;
            }
        }
        return $s['faktorSondermass'];
    }

    /**
     * Vergleicht zwei Masse in Zentimetern.
     *
     * Warum nicht einfach "==": Das Altsystem haelt die Masse in METERN und
     * rechnet fuer die Formel auf Zentimeter zurueck. 115 cm sind intern 1,15 m,
     * und 1,15 · 100 ergibt im Gleitkomma 114,99999999999998… — nicht 115.
     * Ein Vergleich auf Gleichheit scheitert dann, die Matte gilt faelschlich
     * als Sondermass und kostet 25 % mehr. (60, 75, 85, 150 und 200 sind
     * zufaellig exakt darstellbar, 114, 115 und 116 nicht — deshalb faellt es
     * ohne gezielte Pruefung nicht auf.)
     *
     * Verglichen wird deshalb mit einer Toleranz von einem hundertstel
     * Millimeter. Feiner misst niemand eine Fussmatte.
     */
    public static function gleichesMass($a, $b){
        return abs((float) $a - (float) $b) < 0.001;
    }

    /**
     * M5 — Faktor Sonderlaenge. Reine Groessenpruefung, der Faktor ist stets 1.
     * Die erste Bedingung ist von der zweiten abgedeckt; sie bleibt stehen,
     * um die Mappe eins zu eins abzubilden.
     */
    public static function faktorLaengeFuer($breite, $laenge, $s){
        $rollenbreite = self::rollenbreiteFuer($s);   // V7
        if($breite > $rollenbreite and $laenge == $s['maxLaenge']) return self::GRUND_ZU_BREIT;
        if($breite > $rollenbreite and $laenge > $rollenbreite)    return self::GRUND_ZU_BREIT;
        if($breite <= $rollenbreite and $laenge > $s['maxLaenge']) return self::GRUND_ZU_LANG;
        if($breite > $s['maxLaenge'] and $laenge <= $rollenbreite) return self::GRUND_ZU_LANG;
        return 1;
    }

    /** V7 — die groesste Standardbreite, zugleich die Rollenbreite. */
    public static function rollenbreiteFuer($s){
        $b = $s['standardbreiten'];
        if(!is_array($b) or !count($b)){
            return 0;
        }
        return $b[count($b) - 1];
    }

    /**
     * Mengenstaffel — die Kaskade aus G5.
     * Gibt die passende Stufe zurueck, oder null, wenn die Menge unter der
     * kleinsten Schwelle liegt. In Excel liefert die innerste IF() dann
     * FALSCH, was in der Multiplikation als 0 weitergerechnet wird.
     */
    public static function staffelFuer($menge, $s){
        foreach($s['mengenstaffel'] as $stufe){
            if($menge >= $stufe['schwelle']){
                return $stufe;
            }
        }
        return null;
    }

    /**
     * Die eigentliche Rechnung.
     *
     * @param array $eingaben  breite, laenge (cm), menge (Stueck),
     *                         sonderformOhneRand, sonderformMitRand,
     *                         sonderfarbe, sonderfarbenAnzahl, colortype
     * @param array $stammdaten  Teilmenge der Vorgabe; fehlende Felder
     *                           werden aus getVorgabe() ergaenzt.
     * @return array  Bei Erfolg array('ok'=>true, ...), sonst
     *                array('ok'=>false, 'code'=>..., 'grund'=>...).
     *                Es wird nie eine Ausnahme geworfen.
     */
    public static function berechne($eingaben, $stammdaten = array()){
        $s = array_merge(self::getVorgabe(), is_array($stammdaten) ? $stammdaten : array());
        $e = is_array($eingaben) ? $eingaben : array();

        /* --- Eingaben normalisieren ----------------------------------- */
        $breite = self::alsZahl(isset($e['breite']) ? $e['breite'] : null);
        $laenge = self::alsZahl(isset($e['laenge']) ? $e['laenge'] : null);
        $menge  = self::alsZahl(isset($e['menge'])  ? $e['menge']  : null);

        // F2 — ein mitgegebener Colortype gewinnt, sonst der des Artikels.
        $colortype = (isset($e['colortype']) and $e['colortype'] !== null and $e['colortype'] !== '')
            ? self::alsZahl($e['colortype'])
            : $s['colortype'];

        $sonderformOhneRand = self::istGesetzt(isset($e['sonderformOhneRand']) ? $e['sonderformOhneRand'] : false);
        $sonderformMitRand  = self::istGesetzt(isset($e['sonderformMitRand'])  ? $e['sonderformMitRand']  : false);
        $sonderfarbe        = self::istGesetzt(isset($e['sonderfarbe'])        ? $e['sonderfarbe']        : false);

        /* Anzahl der Sonderfarben. Ohne Angabe bleibt es bei der frueheren
           Ja/Nein-Rechnung, also 1. Werte unter 1 zaehlen ebenfalls als 1,
           damit ein Tippfehler den Aufschlag nicht verschwinden laesst. */
        $sonderfarbenAnzahl = 0;
        if($sonderfarbe){
            $n = self::alsZahl(isset($e['sonderfarbenAnzahl']) ? $e['sonderfarbenAnzahl'] : null);
            $sonderfarbenAnzahl = ($n !== null and $n >= 1) ? (int) floor($n) : 1;
        }

        $fehlend = array();
        if($breite === null) $fehlend[] = 'Breite';
        if($laenge === null) $fehlend[] = 'Länge';
        if($menge  === null) $fehlend[] = 'Menge';
        if(count($fehlend)){
            return array(
                'ok' => false, 'code' => 'EINGABE',
                'grund' => 'Bitte '.implode(', ', $fehlend).' als Zahl angeben.'
            );
        }
        if($breite <= 0 or $laenge <= 0){
            return array(
                'ok' => false, 'code' => 'EINGABE',
                'grund' => 'Breite und Länge müssen größer als 0 sein.'
            );
        }

        /* --- D4: Flaeche einer Matte in qm ---------------------------- */
        //  Excel: =B4*C4*0.01*0.01
        $qmProStueck = $breite * $laenge * 0.01 * 0.01;

        /* --- C2: Salesfactor ------------------------------------------ */
        $salesfactor = self::salesfactorFuer($colortype, $s);

        /* --- S2: Teuerungszuschlag ------------------------------------ */
        //  Excel: =1+(R2/100)
        $tzFaktor = 1 + ($s['tzProzent'] / 100);

        /* --- L5 / M5: Groessenpruefung -------------------------------- */
        $faktorBreite = self::faktorBreiteFuer($breite, $laenge, $s);
        if(is_string($faktorBreite)){
            return array(
                'ok' => false, 'code' => 'ZU_SCHMAL', 'grund' => $faktorBreite, 'zelle' => 'L5',
                'klartext' => 'Die kleinste Seite muss mindestens '.$s['minBreite'].' cm betragen.'
            );
        }
        $faktorLaenge = self::faktorLaengeFuer($breite, $laenge, $s);
        if(is_string($faktorLaenge)){
            $rollenbreite = self::rollenbreiteFuer($s);
            return array(
                'ok' => false,
                'code' => ($faktorLaenge === self::GRUND_ZU_BREIT) ? 'ZU_BREIT' : 'ZU_LANG',
                'grund' => $faktorLaenge, 'zelle' => 'M5',
                'klartext' => ($faktorLaenge === self::GRUND_ZU_BREIT)
                    ? 'Eine Seite darf höchstens '.$rollenbreite.' cm breit sein — die Matte kommt von der Rolle.'
                    : 'Die längere Seite darf höchstens '.$s['maxLaenge'].' cm betragen.'
            );
        }

        /* --- N5 / O5: Zuschlaege fuer Sonderformen -------------------- */
        $faktorFormOhneRand = $sonderformOhneRand ? $s['faktorSonderformOhne'] : 1;
        $faktorFormMitRand  = $sonderformMitRand  ? $s['faktorSonderformMit']  : 1;

        /* --- P5 / P6: Sonderfarbe, feste Betraege --------------------- */
        //  Gilt je Sonderfarbe, faellt aber nur EINMAL je Auftrag an.
        $aufschlagVK = $s['aufschlagSonderfarbeVK'] * $sonderfarbenAnzahl;
        $aufschlagEK = $s['aufschlagSonderfarbeEK'] * $sonderfarbenAnzahl;

        /* --- Mengenstaffel -------------------------------------------- */
        /*  Liegt die Menge unter der kleinsten Schwelle, liefert Excel in der
            innersten IF() FALSCH, was als 0 weitergerechnet wird — der Preis
            bestuende dann nur noch aus dem Sonderfarbenaufschlag.
            Fuer einen Shop ist das untragbar: der Artikel ginge fuer 0,00 €
            in den Warenkorb, und zwar ohne Fehlermeldung. Deshalb wird dieser
            Fall hier als Fehler gemeldet; der Aufrufer faellt dann auf die
            alte Rechnung zurueck, wie bei jedem anderen Formelfehler auch. */
        $stufe = self::staffelFuer($menge, $s);
        if(!$stufe){
            $kleinste = $s['mengenstaffel'][count($s['mengenstaffel']) - 1]['schwelle'];
            return array(
                'ok' => false, 'code' => 'KEINE_STAFFELSTUFE',
                'grund' => 'Fuer die Menge '.$menge.' gibt es keine Stufe in der Mengenstaffel.',
                'klartext' => 'Die Mengenstaffel beginnt erst bei '.$kleinste.' Stueck. '
                    .'Damit haette eine Bestellung von '.$menge.' Stueck den Preis 0,00 € — '
                    .'bitte eine Stufe fuer 1 Stueck eintragen, z. B. "1:1".'
            );
        }
        $staffelfaktor = $stufe['faktor'];

        /* --- Die gemeinsamen Zuschlagsfaktoren ------------------------ */
        $zuschlaege = $faktorBreite * $faktorLaenge * $faktorFormOhneRand * $faktorFormMitRand;

        /* --- G5: Verkaufspreis pro Stueck ----------------------------- */
        //  Excel: =(IF(E4>=V6,D4*Q5*C2*V5*$S$2, … ))*L5*M5*N5*O5)+P5
        //  (Der FALSCH-Zweig von oben ist hier nicht mehr noetig: ohne
        //   passende Stufe bricht die Rechnung bereits ab.)
        $basisProStueck = $qmProStueck * $s['ekListenpreisProQm'] * $salesfactor * $staffelfaktor * $tzFaktor;
        $vkProStueck = $basisProStueck * $zuschlaege + $aufschlagVK;

        /* --- F5: Verkaufspreis gesamt --------------------------------- */
        //  Excel: =(E4*G5)-((E4-1)*P5)
        //  Der Sonderfarbenaufschlag steckt in G5, faellt aber nur EINMAL an.
        $vkGesamt = ($menge * $vkProStueck) - (($menge - 1) * $aufschlagVK);

        /* --- J5: Einkaufspreis pro qm --------------------------------- */
        //  Keine Mengenstaffel im Einkauf — alle Zweige liefern Q5.
        $ekProQm = $s['ekListenpreisProQm'] * $zuschlaege;

        /* --- I5: Einkaufspreis pro Stueck ----------------------------- */
        //  Excel: =(D4*J5)+(P6)
        $ekProStueck = $qmProStueck * $ekProQm + $aufschlagEK;

        /* --- H5: Einkaufspreis gesamt --------------------------------- */
        //  Excel: =(D4*J5*E4)+(P6) — Aufschlag nur EINMAL, nicht je Stueck
        $ekGesamt = $qmProStueck * $ekProQm * $menge + $aufschlagEK;

        /* --- E6: Listenpreis je Stueck (ohne Mengenstaffel) ----------- */
        $listenpreisProStueck =
            $qmProStueck * $s['ekListenpreisProQm'] * $salesfactor * $tzFaktor + $aufschlagVK;

        /* --- Letzte Sicherung vor der Ausgabe ------------------------- */
        /*  Was hier herauskommt, geht als Preis in den Shop. Ein Betrag von
            0 oder darunter ist nie ein gueltiger Verkaufspreis — er entstuende
            nur aus einer verunglueckten Einstellung (Salesfactor 0 durch einen
            unbekannten Colortype, EK-Preis 0, negative Faktoren). Lieber ein
            klarer Fehler und der Rueckfall auf die alte Rechnung als eine
            verschenkte Matte. */
        if(!is_finite($vkGesamt) or !is_finite($vkProStueck) or $vkGesamt <= 0 or $vkProStueck <= 0){
            return array(
                'ok' => false, 'code' => 'PREIS_NULL',
                'grund' => 'Die Formel ergibt keinen gueltigen Verkaufspreis ('
                    .(is_finite($vkGesamt) ? number_format($vkGesamt, 2, ',', '.') : '—').' €).',
                'klartext' => 'Bitte die Werte der Preisformel pruefen — besonders '
                    .'EK-Listenpreis, Salesfactor und Mengenstaffel.'
            );
        }

        return array(
            'ok' => true,

            // --- Zwischenwerte (Excel-Zelle in Klammern) --------------
            'qmProStueck'       => $qmProStueck,        // D4
            'salesfactor'       => $salesfactor,        // C2
            'tzFaktor'          => $tzFaktor,           // S2
            'staffelfaktor'     => $staffelfaktor,      // R5..V5
            'staffelSchwelle'   => $stufe ? $stufe['schwelle'] : null,
            'faktorBreite'      => $faktorBreite,       // L5
            'faktorLaenge'      => $faktorLaenge,       // M5
            'faktorFormOhneRand'=> $faktorFormOhneRand, // N5
            'faktorFormMitRand' => $faktorFormMitRand,  // O5
            'aufschlagVK'       => $aufschlagVK,        // P5
            'aufschlagEK'       => $aufschlagEK,        // P6
            'zuschlagsfaktor'   => $zuschlaege,
            'basisProStueck'    => $basisProStueck,

            // --- Ergebnisse -------------------------------------------
            'vkProStueck'       => $vkProStueck,        // G5
            'vkGesamt'          => $vkGesamt,           // F5
            'ekProQm'           => $ekProQm,            // J5
            'ekProStueck'       => $ekProStueck,        // I5
            'ekGesamt'          => $ekGesamt,           // H5
            'marge'             => $vkGesamt - $ekGesamt, // K5
            'gesamtQm'          => $qmProStueck * $menge, // D6
            'listenpreisProStueck' => $listenpreisProStueck, // E6

            // --- ohne den einmaligen Sonderfarbenaufschlag -------------
            'vkProStueckOhneEinmaliges' => $vkProStueck - $aufschlagVK,
            'vkStueckanteil'            => $vkGesamt - $aufschlagVK,

            'eingaben' => array(
                'breite' => $breite, 'laenge' => $laenge, 'menge' => $menge,
                'colortype' => $colortype,
                'sonderformOhneRand' => $sonderformOhneRand,
                'sonderformMitRand'  => $sonderformMitRand,
                'sonderfarbe'        => $sonderfarbe,
                'sonderfarbenAnzahl' => $sonderfarbenAnzahl
            )
        );
    }

    /**
     * Wendet die Preis-Korrektur des Auftraggebers an.
     *
     * Erlaubt sind:
     *   "+5"    bzw. "5"    → 5 € mehr
     *   "-5"               → 5 € weniger
     *   "+5%"   bzw. "5%"  → 5 Prozent mehr
     *   "-5%"              → 5 Prozent weniger
     *   leer               → keine Korrektur
     *
     * Das Komma gilt als Dezimaltrennzeichen, damit "2,5%" funktioniert.
     * Unverstaendliche Eingaben lassen den Preis unveraendert — lieber
     * keine Korrektur als eine falsche.
     *
     * @param float  $preis
     * @param string $korrektur
     * @return float
     */
    public static function wendeKorrekturAn($preis, $korrektur){
        $r = self::rechneKorrektur($preis, $korrektur);
        return $r['preis'];
    }

    /**
     * Wie wendeKorrekturAn(), meldet aber zusaetzlich, was passiert ist.
     *
     * @return array array('preis' => float, 'ok' => bool, 'grund' => string)
     *         ok ist false, wenn die Korrektur den Preis auf 0 oder darunter
     *         zoeht. Der Aufrufer faellt dann auf die alte Rechnung zurueck,
     *         statt einen negativen Preis in den Warenkorb zu lassen.
     */
    public static function rechneKorrektur($preis, $korrektur){
        $k = trim((string) $korrektur);
        if($k === ''){
            return array('preis' => $preis, 'ok' => true, 'grund' => '');
        }
        $prozent = (strpos($k, '%') !== false);
        $k = str_replace('%', '', $k);

        /* alsZahl() laesst weder Buchstaben noch die Exponentialschreibweise
           durch — "1e2" ist im Admin ein Vertipper, keine Hundert. */
        $wert = self::alsZahl($k);
        if($wert === null){
            /* Unverstaendliche Eingabe: lieber keine Korrektur als eine
               falsche. Das ist kein Fehler, nur ein Hinweis. */
            return array(
                'preis' => $preis, 'ok' => true,
                'grund' => 'Die Preis-Korrektur "'.$korrektur.'" ist nicht lesbar und wurde nicht angewendet.'
            );
        }

        $neu = $prozent ? $preis * (1 + $wert / 100) : $preis + $wert;

        /* Ein Preis von 0 oder darunter darf nie in den Shop. Ein Vertipper
           ("-200" statt "-20") wuerde sonst eine Matte verschenken. */
        if($neu <= 0){
            return array(
                'preis' => $preis, 'ok' => false,
                'grund' => 'Die Preis-Korrektur "'.$korrektur.'" ergaebe '
                    .number_format($neu, 2, ',', '.').' € und damit keinen gueltigen Preis.'
            );
        }
        return array('preis' => $neu, 'ok' => true, 'grund' => '');
    }

    /**
     * Ankreuzfeld: gesetzt oder nicht.
     *
     * Die Mappe kennt nur "X". Erlaubt sind deshalb genau die Schreibweisen,
     * die eindeutig Ja bedeuten: "X"/"x", "1", "ja", "wahr", "true" und die
     * echten Wahrheitswerte. ALLES andere gilt als NICHT gesetzt — besonders
     * "false", "nein", "n", "no" und "0".
     *
     * Vorher nahm diese Funktion jede nichtleere Zeichenkette als Ja. Damit
     * waeren "false" und "no" als Ja durchgegangen und haetten still 68 € oder
     * 30 % aufgeschlagen, sobald es dafuer Eingabefelder gibt.
     */
    public static function istGesetzt($v){
        if($v === true or $v === 1 or $v === 1.0){
            return true;
        }
        if(is_string($v)){
            $v = strtolower(trim($v));
            return in_array($v, array('x', '1', 'ja', 'wahr', 'true'), true);
        }
        return false;
    }

    /**
     * Liest eine Zahl aus Zahl oder Text. Gibt null zurueck, wenn sich keine
     * eindeutige Zahl ergibt — bewusst null und nicht 0, damit "fehlt" von
     * "null" unterscheidbar bleibt.
     *
     * Deutsche und englische Schreibweise werden beide verstanden, auch mit
     * Tausenderpunkten:
     *   "54,63"      → 54.63      "54.63"     → 54.63
     *   "1.000"      → 1000       "1,000"     → 1000
     *   "1.234,56"   → 1234.56    "1,234.56"  → 1234.56
     *   "1 000,50"   → 1000.5
     *
     * Nicht angenommen werden Einheiten ("54,63 EUR") und die
     * Exponentialschreibweise ("5e3") — beides ist im Admin ein Vertipper,
     * kein gemeinter Wert.
     *
     * @return float|null
     */
    public static function alsZahl($v){
        if(is_int($v) or is_float($v)){
            return is_finite((float) $v) ? (float) $v : null;
        }
        if(!is_string($v)){
            return null;
        }

        /* Leerzeichen (auch geschuetzte) sind Tausendertrenner, sie fliegen raus. */
        $s = str_replace(array(' ', "\t", "\n", "\r", "\xc2\xa0"), '', $v);
        if($s === ''){
            return null;
        }
        /* Fuehrendes Vorzeichen merken und abtrennen. */
        $vorzeichen = 1;
        if($s[0] === '+' or $s[0] === '-'){
            if($s[0] === '-'){ $vorzeichen = -1; }
            $s = substr($s, 1);
        }
        /* Ab hier sind nur noch Ziffern, Punkte und Kommata erlaubt. Alles
           andere (Buchstaben, "e", "€") macht die Eingabe unlesbar. */
        if($s === '' or !preg_match('/^[0-9.,]+$/', $s)){
            return null;
        }

        $letztesKomma = strrpos($s, ',');
        $letzterPunkt = strrpos($s, '.');

        if($letztesKomma !== false and $letzterPunkt !== false){
            /* Beide Zeichen da: das WEITER HINTEN stehende ist das
               Dezimaltrennzeichen, das andere trennt die Tausender. */
            if($letztesKomma > $letzterPunkt){
                $s = str_replace('.', '', $s);          // 1.234,56
                $s = str_replace(',', '.', $s);
            } else {
                $s = str_replace(',', '', $s);          // 1,234.56
            }
        } else if($letztesKomma !== false){
            $s = self::loeseTrennzeichen($s, ',');
        } else if($letzterPunkt !== false){
            $s = self::loeseTrennzeichen($s, '.');
        }
        /* Fuehrende Nullen wie "007" sind fuer is_numeric() in Ordnung. */

        if($s === '' or !is_numeric($s)){
            return null;
        }
        $zahl = $vorzeichen * (float) $s;
        return is_finite($zahl) ? $zahl : null;
    }

    /**
     * Hilfe fuer alsZahl(): In der Zeichenkette kommt nur EINE Sorte
     * Trennzeichen vor. Ist es Tausendertrenner oder Dezimalzeichen?
     *
     * DIE REGEL (eindeutig, keine Ratespiele):
     *
     *   Kommt das Zeichen GENAU EINMAL vor, ist es das DEZIMALZEICHEN —
     *   gleichgueltig, wie viele Ziffern folgen.
     *   Kommt es MEHRFACH vor, sind es Tausendertrenner ("1.234.567").
     *
     * Warum so und nicht anders: Die Werte dieser Mappe haben drei
     * Nachkommastellen — der Salesfactor ist 1,931. Eine Regel, die "drei
     * Ziffern dahinter" als Tausendertrenner liest, macht daraus 1931 und
     * den Shop-Preis tausendfach zu gross, ohne dass irgendeine Pruefung
     * anschlaegt (1931 ist ja eine gueltige Zahl). Genau das ist passiert.
     *
     * Der Preis dafuer: "1.000" wird als 1,0 gelesen statt als Eintausend.
     * Das ist die harmlosere Richtung — der Wert ist zu KLEIN, faellt beim
     * Probe-Preis in der Maske sofort auf und wird zusaetzlich von der
     * Plausibilitaetspruefung gemeldet. Wer Eintausend meint, schreibt
     * "1000" (so steht es auch im Hinweis an der Maske).
     *
     * Eindeutig bleiben beide Schreibweisen mit Punkt UND Komma
     * ("1.234,56" / "1,234.56"); die werden in alsZahl() vorher behandelt.
     */
    protected static function loeseTrennzeichen($s, $zeichen){
        $teile = explode($zeichen, $s);
        if(count($teile) > 2){
            /* Mehrfach: nur Tausendertrenner ergeben Sinn ("1.234.567").
               Jede Gruppe ausser der ersten muss drei Ziffern haben, sonst
               ist die Eingabe krumm und wird verworfen. */
            for($i = 1; $i < count($teile); $i++){
                if(strlen($teile[$i]) !== 3){
                    return '';   // unlesbar -> alsZahl() liefert null
                }
            }
            return implode('', $teile);
        }
        /* Genau einmal: immer Dezimalzeichen. */
        return $teile[0].'.'.$teile[1];
    }

    /**
     * Liest eine Liste von Zahlen aus einem Text wie "60, 75, 85, 115, 150, 200".
     * Trennzeichen sind Komma, Semikolon, Schraegstrich, Leerzeichen und
     * Zeilenumbruch.
     *
     * Die Standardbreiten sind ganze Zentimeter. Damit ein Tausenderpunkt
     * ("1.000") nicht zu zwei Werten zerfaellt, wird zuerst an den Trennern
     * zerlegt und erst danach jedes Stueck als Zahl gelesen.
     *
     * @return array  array('liste' => aufsteigende Zahlenliste,
     *                      'maengel' => Texte zu allem, was nicht lesbar war)
     */
    public static function leseZahlenliste($text){
        $maengel = array();
        if(is_array($text)){
            $teile = $text;
        } else {
            $teile = preg_split('/[;,\/\s]+/', (string) $text, -1, PREG_SPLIT_NO_EMPTY);
        }
        $liste = array();
        foreach((array) $teile as $t){
            $t = trim((string) $t);
            if($t === ''){
                continue;
            }
            $z = self::alsZahl($t);
            if($z === null){
                $maengel[] = '"'.$t.'" ist keine Zahl.';
                continue;
            }
            if($z <= 0){
                $maengel[] = '"'.$t.'" ist nicht groesser als 0.';
                continue;
            }
            $liste[] = $z;
        }
        sort($liste, SORT_NUMERIC);
        return array('liste' => $liste, 'maengel' => $maengel);
    }

    /**
     * Wie leseZahlenliste(), gibt aber nur die Liste zurueck.
     * Bleibt erhalten, damit bestehende Aufrufe unveraendert laufen.
     */
    public static function alsZahlenliste($text){
        $r = self::leseZahlenliste($text);
        return $r['liste'];
    }
}
