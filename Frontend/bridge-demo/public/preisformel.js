/**
 * preisformel.js — Preiskalkulation fuer Matten (Mattenfuchs / KTA-Mats)
 * ============================================================================
 *
 * QUELLE
 * ------
 * Diese Datei bildet Zelle fuer Zelle die Kalkulation aus der Arbeitsmappe
 *
 *     PREISE-Brian-26-10_22-11.xlsx  ·  Blatt "Blatt1"  ·  Bereich A1:W7
 *
 * nach. Jede Konstante und jeder Rechenschritt traegt unten den Excel-Zellbezug
 * als Kommentar, damit die Herkunft jederzeit nachpruefbar bleibt.
 *
 *
 * DIE FORMEL IN PROSA
 * -------------------
 * Der Kunde gibt bei der Anfrage vier Dinge an: Breite (B4) und Laenge (C4) der
 * Matte in Zentimetern, die Menge (E4) und den Colortype (F2). Dazu kommen drei
 * Ankreuzfelder — Sonderform ohne Rand (N3), Sonderform mit Rand (O3) und
 * Sonderfarbe (P3); in der Tabelle traegt man dort ein "X" ein.
 *
 * Aus Breite und Laenge ergibt sich die Flaeche einer Matte in Quadratmetern
 * (D4 = B4 · C4 · 0,01 · 0,01). Diese Flaeche wird mit dem Einkaufs-Listenpreis
 * pro Quadratmeter (Q5) multipliziert — das ist der reine Materialwert.
 *
 * Auf diesen Materialwert legt sich der Salesfactor (C2). Er haengt allein an
 * der Mattenqualitaet, dem sogenannten Colortype: 1 = mehrfarbig (F1 = 1,931),
 * 2 = einfarbig (I1 = 1,728), 3 = Ped-Print (L1 = 1,8). Der Salesfactor macht
 * aus dem Einkauf den Verkauf.
 *
 * Danach greift die Mengenstaffel. Ab 2 Stueck gibt es 5 % Nachlass, ab 3
 * Stueck 8 %, ab 10 Stueck 10 %, ab 20 Stueck 11 % und ab 30 Stueck 12 %
 * (Q6..V6 sind die Mengenschwellen, R5..V5 die zugehoerigen Faktoren). Bei
 * einem einzelnen Stueck gibt es keinen Nachlass.
 *
 * Auf das Ergebnis kommt der Teuerungszuschlag TZ % (R2), als Faktor
 * S2 = 1 + R2/100. Er wirkt ausschliesslich auf den Verkaufspreis, nie auf den
 * Einkauf.
 *
 * Dann folgen die vier Zuschlagsfaktoren, die sich schlicht multiplizieren:
 *
 *   · Sonderbreite (L5): Passt weder Breite noch Laenge exakt auf eine der
 *     sechs Standardbreiten 60 / 75 / 85 / 115 / 150 / 200 cm (Q7..V7), muss
 *     aus der Rolle geschnitten werden — Faktor 1,25. Trifft mindestens eine
 *     der beiden Seiten eine Standardbreite, ist der Faktor 1.
 *   · Sonderlaenge (M5): dient nur der Groessenpruefung, der Faktor ist immer 1.
 *   · Sonderform ohne Rand (N5): 1,3 — also 30 % Aufschlag.
 *   · Sonderform mit Rand (O5): 1,5 — also 50 % Aufschlag.
 *
 * Zum Schluss kommt bei Sonderfarbe ein fester Betrag obendrauf: 68,- € im
 * Verkauf (P5) und 50,- € im Einkauf (P6). Wichtig und leicht zu uebersehen:
 * dieser Betrag faellt pro AUFTRAG an, nicht pro Stueck. Er steckt zwar im
 * Stueckpreis G5, wird in der Gesamtsumme F5 aber wieder herausgerechnet:
 * F5 = Menge · G5 − (Menge − 1) · P5. Beim Einkauf genauso (H5).
 *
 * Drei Faelle liefern statt eines Preises eine Fehlermeldung:
 *   · "zu schmal"       — Breite ODER Laenge kleiner als 30 cm (B6).
 *   · "Matte zu breit"  — beide Seiten groesser als 200 cm (V7), die Matte
 *                         passt nicht mehr auf die Rollenbreite.
 *   · "Matte zu lang"   — die laengere Seite ueberschreitet 700 cm (C6).
 * In der Tabelle stehen diese Texte in L5 bzw. M5; die Multiplikation in G5
 * liefert dann #WERT!. Dieses Modul gibt stattdessen { ok:false, grund:… }
 * zurueck und wirft nie eine Ausnahme.
 *
 *
 * GENAUIGKEIT
 * -----------
 * Es wird durchgehend in voller Gleitkomma-Genauigkeit gerechnet. Gerundet
 * wird erst bei der Ausgabe — dafuer gibt es die Helfer runde() und euro().
 *
 *
 * VERWENDUNG
 * ----------
 *   Browser:  <script type="module">
 *               import { berechne } from '/preisformel.js';
 *             </script>
 *   Node:     import { berechne, KONSTANTEN } from './public/preisformel.js';
 *
 * Die Konstanten sind pro Artikel ueberschreibbar:
 *   berechne({ breite: 50, laenge: 200, menge: 1, colortype: 1 },
 *            { ekListenpreisProQm: 61.90 });
 *
 * ============================================================================
 */

/**
 * Artikelkonstanten. Alle Werte werden laut Tabelle (Zeilen 11–24 der Mappe)
 * "bei der Artikelanlage vorgegeben" und sind daher pro Artikel ueberschreibbar.
 * Der Kommentar hinter jedem Wert nennt die Excel-Zelle.
 */
export const KONSTANTEN = Object.freeze({
  // --- Salesfactoren je Colortype (Mattenqualitaet) ---------------------
  salesfactorMehrfarbig: 1.931,   // F1  — Colortype 1, "more colors"
  salesfactorEinfarbig:  1.728,   // I1  — Colortype 2, "one-color"
  salesfactorPedPrint:   1.8,     // L1  — Colortype 3, "ped-print"
  salesfactorFallback:   0,       // F19 — leere Zelle; Fallback in C2, siehe PREISFORMEL.md

  // --- Einkauf ----------------------------------------------------------
  ekListenpreisProQm:    54.63,   // Q5  — Einkaufs-Listenpreis pro qm

  // --- Teuerungszuschlag ------------------------------------------------
  tzProzent:             0,       // R2  — TZ % ; Faktor S2 = 1 + R2/100

  // --- Masse ------------------------------------------------------------
  minBreite:             30,      // B6  — "min.width"; gilt fuer BEIDE Seiten
  maxLaenge:             700,     // C6  — "max.length"

  // --- Standardbreiten der Rolle (cm) -----------------------------------
  // Q7, R7, S7, T7, U7, V7. Der groesste Wert (V7 = 200) ist zugleich die
  // Rollenbreite und wird in M5 als Breitengrenze verwendet.
  standardbreiten: Object.freeze([60, 75, 85, 115, 150, 200]),

  // --- Mengenstaffel ----------------------------------------------------
  // schwelle = Q6..V6, faktor = (keiner) / R5..V5.
  // Ausgewertet wird von oben nach unten, die erste passende Stufe gewinnt.
  mengenstaffel: Object.freeze([
    Object.freeze({ schwelle: 30, faktor: 0.88, zelle: 'V6/V5' }),
    Object.freeze({ schwelle: 20, faktor: 0.89, zelle: 'U6/U5' }),
    Object.freeze({ schwelle: 10, faktor: 0.90, zelle: 'T6/T5' }),
    Object.freeze({ schwelle:  3, faktor: 0.92, zelle: 'S6/S5' }),
    Object.freeze({ schwelle:  2, faktor: 0.95, zelle: 'R6/R5' }),
    Object.freeze({ schwelle:  1, faktor: 1.00, zelle: 'Q6 (ohne Faktor)' })
  ]),

  // --- Zuschlagsfaktoren fuer Sonderformen ------------------------------
  faktorSondermass:       1.25,   // L5  — "1,25", wenn keine Seite Standardbreite ist
  faktorSonderformOhne:   1.3,    // N5  — "1,3" bei N3 = "X"  (no border 30 %)
  faktorSonderformMit:    1.5,    // O5  — "1,5" bei O3 = "X"  (with border 50 %)

  // --- Sonderfarbe: feste Betraege, EINMAL pro Auftrag ------------------
  aufschlagSonderfarbeVK: 68,     // P5  — "68" bei P3 = "X"
  aufschlagSonderfarbeEK: 50      // P6  — "50" bei P3 = "X"
});

/** Fehlertexte exakt so, wie sie in L5 bzw. M5 der Tabelle stehen. */
export const GRUENDE = Object.freeze({
  ZU_SCHMAL:  'zu schmal',
  ZU_BREIT:   'Matte zu breit',
  ZU_LANG:    'Matte zu lang'
});

/** Klartextnamen der drei Colortypes (D1/E1, G1/H1, J1/K1). */
export const COLORTYPES = Object.freeze([
  Object.freeze({ wert: 1, name: 'Mehrfarbig', excel: 'more colors', zelle: 'F1' }),
  Object.freeze({ wert: 2, name: 'Einfarbig',  excel: 'one-color',   zelle: 'I1' }),
  Object.freeze({ wert: 3, name: 'Ped-Print',  excel: 'ped-print',   zelle: 'L1' })
]);

/* ------------------------------------------------------------------------ */
/* Helfer                                                                    */
/* ------------------------------------------------------------------------ */

/**
 * Rundet kaufmaennisch auf n Nachkommastellen — ausschliesslich fuer die Ausgabe.
 * Der winzige relative Aufschlag faengt Faelle wie 1.005 · 100 = 100.49999999999999
 * ab, in denen die binaere Gleitkommadarstellung sonst abwaerts runden wuerde.
 */
export function runde(wert, n = 2) {
  if (!Number.isFinite(wert)) return wert;
  const p = Math.pow(10, n);
  const v = wert * p;
  return Math.round(v + Math.sign(v) * Math.abs(v) * Number.EPSILON) / p;
}

/** Formatiert einen Betrag als deutschen Euro-Betrag, z. B. "105,49 €". */
export function euro(wert) {
  if (!Number.isFinite(wert)) return '—';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(wert);
}

/** Formatiert eine Zahl mit fester Nachkommastellenzahl, deutsch. */
export function zahl(wert, n = 2) {
  if (!Number.isFinite(wert)) return '—';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: n, maximumFractionDigits: n
  }).format(wert);
}

/** Wandelt "X", "x", true, 1 … in einen Boolean. Leerzeichen zaehlen nicht. */
function istGesetzt(v) {
  if (typeof v === 'string') return v.trim().toUpperCase() === 'X';
  return v === true || v === 1;
}

/** Liest eine Zahl aus Number, String ("50", "50,5") oder gibt NaN zurueck. */
function alsZahl(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const s = v.trim().replace(/\s/g, '').replace(',', '.');
    if (s === '') return NaN;
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

/* ------------------------------------------------------------------------ */
/* Einzelne Excel-Zellen als benannte Funktionen                             */
/* ------------------------------------------------------------------------ */

/**
 * C2 — Salesfactor aus dem Colortype (F2).
 * Excel: =IF($F$2=1,$F$1,IF($F$2=2,$I$1,IF($F$2=3,$L$1,F19)))
 * F19 ist in der Mappe leer; Excel liest eine leere Zelle als 0.
 */
export function salesfactorFuer(colortype, k = KONSTANTEN) {
  if (colortype === 1) return k.salesfactorMehrfarbig;
  if (colortype === 2) return k.salesfactorEinfarbig;
  if (colortype === 3) return k.salesfactorPedPrint;
  return k.salesfactorFallback;
}

/**
 * L5 — Faktor Sonderbreite.
 * Excel: =IF(OR(B4<B6,C4<B6),"zu schmal",
 *          IF(OR(B4=V7,C4=V7),"1", … IF(OR(B4=Q7,C4=Q7),"1","1,25")))
 * Es genuegt, wenn EINE der beiden Seiten exakt eine Standardbreite trifft.
 */
export function faktorBreiteFuer(breite, laenge, k = KONSTANTEN) {
  if (breite < k.minBreite || laenge < k.minBreite) return GRUENDE.ZU_SCHMAL;
  const trifft = k.standardbreiten.some((b) => breite === b || laenge === b);
  return trifft ? 1 : k.faktorSondermass;
}

/**
 * M5 — Faktor Sonderlaenge. Reine Groessenpruefung, der Faktor ist stets 1.
 * Excel: =IF(AND(B4>V7,C4=C6),"Matte zu breit",
 *          IF(AND(B4>V7,C4>V7),"Matte zu breit",
 *          IF(AND(B4<=V7,C4>C6),"Matte zu lang",
 *          IF(AND(B4>C6,C4<=V7),"Matte zu lang","1"))))
 * Hinweis: Die erste Bedingung ist von der zweiten vollstaendig abgedeckt
 * (C4 = 700 ist immer > 200). Sie bleibt hier stehen, um die Mappe eins zu
 * eins abzubilden.
 */
export function faktorLaengeFuer(breite, laenge, k = KONSTANTEN) {
  const rollenbreite = k.standardbreiten[k.standardbreiten.length - 1]; // V7
  if (breite > rollenbreite && laenge === k.maxLaenge) return GRUENDE.ZU_BREIT;
  if (breite > rollenbreite && laenge > rollenbreite)  return GRUENDE.ZU_BREIT;
  if (breite <= rollenbreite && laenge > k.maxLaenge)  return GRUENDE.ZU_LANG;
  if (breite > k.maxLaenge && laenge <= rollenbreite)  return GRUENDE.ZU_LANG;
  return 1;
}

/**
 * Mengenstaffel — die Kaskade aus G5.
 * Gibt { faktor, schwelle, zelle } zurueck, oder null wenn die Menge unter der
 * kleinsten Schwelle liegt. In Excel liefert die innerste IF() dann FALSE, was
 * in der Multiplikation als 0 gelesen wird — der Preis waere also 0 + P5.
 */
export function staffelFuer(menge, k = KONSTANTEN) {
  for (const stufe of k.mengenstaffel) {
    if (menge >= stufe.schwelle) return stufe;
  }
  return null;
}

/* ------------------------------------------------------------------------ */
/* Hauptfunktion                                                             */
/* ------------------------------------------------------------------------ */

/**
 * Berechnet Verkauf, Einkauf und Marge fuer eine Mattenanfrage.
 *
 * @param {object} eingaben
 * @param {number} eingaben.breite            B4 — Breite in cm
 * @param {number} eingaben.laenge            C4 — Laenge in cm
 * @param {number} eingaben.menge             E4 — Stueckzahl
 * @param {number} eingaben.colortype         F2 — 1 | 2 | 3
 * @param {boolean} eingaben.sonderformOhneRand  N3 — "X"
 * @param {boolean} eingaben.sonderformMitRand   O3 — "X"
 * @param {boolean} eingaben.sonderfarbe         P3 — "X"
 * @param {object} [konstanten] Teilmenge von KONSTANTEN, ueberschreibt einzelne Werte.
 * @returns {object} Bei Erfolg { ok:true, … }, sonst { ok:false, grund, code }.
 */
export function berechne(eingaben, konstanten) {
  const k = konstanten ? { ...KONSTANTEN, ...konstanten } : KONSTANTEN;
  const e = eingaben || {};

  /* --- Eingaben normalisieren --------------------------------------- */
  const breite    = alsZahl(e.breite);
  const laenge    = alsZahl(e.laenge);
  const menge     = alsZahl(e.menge);
  const colortype = alsZahl(e.colortype);

  const sonderformOhneRand = istGesetzt(e.sonderformOhneRand);
  const sonderformMitRand  = istGesetzt(e.sonderformMitRand);
  const sonderfarbe        = istGesetzt(e.sonderfarbe);

  const fehlend = [];
  if (!Number.isFinite(breite)) fehlend.push('Breite');
  if (!Number.isFinite(laenge)) fehlend.push('Laenge');
  if (!Number.isFinite(menge))  fehlend.push('Menge');
  if (fehlend.length) {
    return {
      ok: false,
      code: 'EINGABE',
      grund: 'Bitte ' + fehlend.join(', ') + ' als Zahl angeben.',
      fehlendeFelder: fehlend
    };
  }
  if (breite <= 0 || laenge <= 0) {
    return { ok: false, code: 'EINGABE', grund: 'Breite und Laenge muessen groesser als 0 sein.' };
  }

  const hinweise = [];

  /* --- D4: Flaeche einer Matte in qm --------------------------------- */
  //  Excel: =B4*C4*0.01*0.01
  const qmProStueck = breite * laenge * 0.01 * 0.01;

  /* --- C2: Salesfactor ------------------------------------------------ */
  const salesfactor = salesfactorFuer(colortype, k);
  if (colortype !== 1 && colortype !== 2 && colortype !== 3) {
    hinweise.push(
      'Colortype ' + e.colortype + ' ist in der Tabelle nicht vorgesehen. ' +
      'C2 faellt dann auf die leere Zelle F19 zurueck, der Salesfactor wird 0.'
    );
  }

  /* --- S2: Teuerungszuschlag ------------------------------------------ */
  //  Excel: =1+(R2/100)
  const tzFaktor = 1 + (k.tzProzent / 100);

  /* --- L5 / M5: Groessenpruefung und Sondermass-Faktoren --------------- */
  const faktorBreite = faktorBreiteFuer(breite, laenge, k);
  if (typeof faktorBreite === 'string') {
    return {
      ok: false, code: 'ZU_SCHMAL', grund: faktorBreite, zelle: 'L5',
      klartext: 'Die kleinste Seite muss mindestens ' + k.minBreite + ' cm betragen.',
      qmProStueck
    };
  }
  const faktorLaenge = faktorLaengeFuer(breite, laenge, k);
  if (typeof faktorLaenge === 'string') {
    const rollenbreite = k.standardbreiten[k.standardbreiten.length - 1];
    return {
      ok: false,
      code: faktorLaenge === GRUENDE.ZU_BREIT ? 'ZU_BREIT' : 'ZU_LANG',
      grund: faktorLaenge, zelle: 'M5',
      klartext: faktorLaenge === GRUENDE.ZU_BREIT
        ? 'Eine Seite darf hoechstens ' + rollenbreite + ' cm breit sein — die Matte kommt von der Rolle.'
        : 'Die laengere Seite darf hoechstens ' + k.maxLaenge + ' cm betragen.',
      qmProStueck
    };
  }

  /* --- N5 / O5: Zuschlaege fuer Sonderformen -------------------------- */
  const faktorFormOhneRand = sonderformOhneRand ? k.faktorSonderformOhne : 1;
  const faktorFormMitRand  = sonderformMitRand  ? k.faktorSonderformMit  : 1;
  if (sonderformOhneRand && sonderformMitRand) {
    hinweise.push(
      'Sonderform ohne Rand und mit Rand sind gleichzeitig gesetzt. Die Tabelle ' +
      'multipliziert dann beide Faktoren (1,3 · 1,5 = 1,95). Ob das gewollt ist, ' +
      'muss der Kunde bestaetigen.'
    );
  }

  /* --- P5 / P6: Sonderfarbe, feste Betraege --------------------------- */
  const aufschlagVK = sonderfarbe ? k.aufschlagSonderfarbeVK : 0;
  const aufschlagEK = sonderfarbe ? k.aufschlagSonderfarbeEK : 0;

  /* --- Mengenstaffel --------------------------------------------------- */
  const stufe = staffelFuer(menge, k);
  const staffelfaktor = stufe ? stufe.faktor : 0;
  if (!stufe) {
    hinweise.push(
      'Die Menge liegt unter der kleinsten Staffelstufe (' +
      k.mengenstaffel[k.mengenstaffel.length - 1].schwelle + '). In Excel liefert die ' +
      'innerste IF() dann FALSE, was als 0 weitergerechnet wird — der Preis besteht ' +
      'nur noch aus dem Sonderfarbenaufschlag.'
    );
  }

  /* --- Die gemeinsamen Zuschlagsfaktoren ------------------------------- */
  const zuschlaege = faktorBreite * faktorLaenge * faktorFormOhneRand * faktorFormMitRand;

  /* --- G5: Verkaufspreis pro Stueck ------------------------------------ */
  //  Excel: =(IF(E4>=V6,D4*Q5*C2*V5*$S$2, … IF(E4>=Q6,D4*Q5*C2*$S$2)))*L5*M5*N5*O5)+P5
  const basisProStueck = stufe
    ? qmProStueck * k.ekListenpreisProQm * salesfactor * staffelfaktor * tzFaktor
    : 0; // FALSE aus der innersten IF()
  const vkProStueck = basisProStueck * zuschlaege + aufschlagVK;

  /* --- F5: Verkaufspreis gesamt ---------------------------------------- */
  //  Excel: =(E4*G5)-((E4-1)*P5)
  //  Der Sonderfarbenaufschlag steckt in G5, faellt aber nur EINMAL an.
  const vkGesamt = (menge * vkProStueck) - ((menge - 1) * aufschlagVK);

  /* --- J5: Einkaufspreis pro qm ---------------------------------------- */
  //  Excel: =(IF(E4>=V6,Q5, … IF(E4>=Q6,Q5,))*L5*M5*N5*O5)
  //  Keine Mengenstaffel im Einkauf — alle Zweige liefern Q5.
  const ekProQm = (stufe ? k.ekListenpreisProQm : 0) * zuschlaege;

  /* --- I5: Einkaufspreis pro Stueck ------------------------------------ */
  //  Excel: =(D4*J5)+(P6)   — enthaelt den vollen EK-Aufschlag
  const ekProStueck = qmProStueck * ekProQm + aufschlagEK;

  /* --- H5: Einkaufspreis gesamt ---------------------------------------- */
  //  Excel: =(D4*J5*E4)+(P6) — Aufschlag nur EINMAL, nicht je Stueck
  const ekGesamt = qmProStueck * ekProQm * menge + aufschlagEK;

  /* --- K5: Marge -------------------------------------------------------- */
  //  Excel: =F5-H5
  const marge = vkGesamt - ekGesamt;

  /* --- D6: Gesamtflaeche ------------------------------------------------ */
  //  Excel: =D4*E4
  const gesamtQm = qmProStueck * menge;

  /* --- E6: Listenpreis pro Stueck (ohne Mengenstaffel, ohne Zuschlaege) - */
  //  Excel: =IF(E4>=Q6,D4*Q5*C2*$S$2)+P5
  const listenpreisProStueck =
    (stufe ? qmProStueck * k.ekListenpreisProQm * salesfactor * tzFaktor : 0) + aufschlagVK;

  return {
    ok: true,

    // --- normalisierte Eingaben -----------------------------------------
    eingaben: {
      breite, laenge, menge, colortype,
      sonderformOhneRand, sonderformMitRand, sonderfarbe
    },

    // --- Zwischenwerte (Excel-Zelle in Klammern) -------------------------
    qmProStueck,           // D4
    salesfactor,           // C2
    tzFaktor,              // S2
    staffelfaktor,         // R5..V5 bzw. 1
    staffelSchwelle:  stufe ? stufe.schwelle : null,
    faktorBreite,          // L5
    faktorLaenge,          // M5
    faktorFormOhneRand,    // N5
    faktorFormMitRand,     // O5
    aufschlagVK,           // P5
    aufschlagEK,           // P6
    zuschlagsfaktor:  zuschlaege,
    basisProStueck,        // Zwischenergebnis der IF-Kaskade in G5

    // --- Ergebnisse -------------------------------------------------------
    vkProStueck,           // G5
    vkGesamt,              // F5
    ekProQm,               // J5
    ekProStueck,           // I5
    ekGesamt,              // H5
    marge,                 // K5
    gesamtQm,              // D6
    listenpreisProStueck,  // E6

    hinweise
  };
}

/**
 * Bequemer Aufruf fuer die Anzeige: liefert dieselben Felder, aber auf zwei
 * Nachkommastellen gerundet. Die Rundung passiert ausschliesslich hier.
 */
export function berechneGerundet(eingaben, konstanten) {
  const r = berechne(eingaben, konstanten);
  if (!r.ok) return r;
  const gerundet = { ...r };
  for (const feld of [
    'qmProStueck', 'vkProStueck', 'vkGesamt', 'ekProQm', 'ekProStueck',
    'ekGesamt', 'marge', 'gesamtQm', 'listenpreisProStueck', 'basisProStueck'
  ]) {
    gerundet[feld] = runde(r[feld], 2);
  }
  return gerundet;
}

export default { berechne, berechneGerundet, KONSTANTEN, GRUENDE, COLORTYPES, runde, euro, zahl };
