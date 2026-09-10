/**
 * preisformel.js — Preiskalkulation fuer Matten (Mattenfuchs / KTA-Mats)
 * ============================================================================
 *
 * QUELLE
 * ------
 * Diese Datei bildet Zelle fuer Zelle die Kalkulation aus der Arbeitsmappe
 *
 *     1PREISE-Brian_Sehorz-26-08-30_18-48.xlsx  ·  Blatt "Blatt1"  ·  A1:W7
 *     (Rechenteil identisch mit der aelteren PREISE-Brian-26-10_22-11.xlsx;
 *      neu sind nur die Erlaeuterungen in A11:B24 und J11:K24)
 *
 * nach. Jede Konstante und jeder Rechenschritt traegt unten den Excel-Zellbezug
 * als Kommentar, damit die Herkunft jederzeit nachpruefbar bleibt.
 *
 *
 * ARTIKELSTAMMDATEN GEGEN KUNDENEINGABEN
 * --------------------------------------
 * Die Mappe trennt beides ausdruecklich (Spalten A/B und J/K, Zeilen 11-24):
 *
 *   ARTIKELSTAMMDATEN — je Artikel gepflegt, aendern sich nicht je Anfrage:
 *     · F2      Colortype der Matte          ("Eingabe des Colortypes -
 *                                              Artikelstammdaten der Matte")
 *     · F1/I1/L1 Salesfactoren je Colortype  ("wird bei der Artikelanlage
 *                                              vorgegeben")
 *     · Q5      Einkaufs-Listenpreis pro qm  ("vom Lieferanten")
 *     · Q7:V7   Standardbreiten der Rolle    ("Standardmasse der Matten -
 *                                              Artikelstammdaten der Matte")
 *     · Q6:V6 / R5:W5  Mengenstaffel         ("Rabattfaktor abhaengig von
 *                                              Menge - Artikelstammdaten")
 *     · B6/C6   Mindestbreite, Maximallaenge ("Artikelstammdaten der Matte")
 *     · P5/P6   Aufschlag Sonderfarbe        ("wird bei Artikelanlage
 *                                              vorgegeben", "pro Artikelart")
 *     · R2      Teuerungszuschlag TZ %
 *     · L5/N5/O5 Zuschlagsfaktoren fuer Sondermass und Sonderform
 *
 *   KUNDENEINGABEN — kommen aus der Anfrage:
 *     · B4/C4   Breite und Laenge in cm      ("werden vom Kunden bei der
 *                                              Anfrage eingegeben")
 *     · E4      Menge                        ("wird vom Kunden bei der
 *                                              Anfrage angegeben")
 *     · N3/O3   Sonderform ohne / mit Rand   ("X"-Eingabe vom Kunden)
 *     · P3      Sonderfarbe                  ("X"-Eingabe vom Kunden)
 *
 * Der Colortype war frueher als Kundeneingabe gefuehrt. Er ist ein
 * Artikelstammdatum. Die alte Aufrufform bleibt gueltig: wird `colortype` in
 * den Eingaben mitgegeben, gewinnt dieser Wert; sonst gilt der des Artikels.
 *
 *
 * DIE FORMEL IN PROSA
 * -------------------
 * Aus Breite und Laenge ergibt sich die Flaeche einer Matte in Quadratmetern
 * (D4 = B4 · C4 · 0,01 · 0,01). Diese Flaeche wird mit dem Einkaufs-Listenpreis
 * pro Quadratmeter (Q5) multipliziert — das ist der reine Materialwert.
 *
 * Auf diesen Materialwert legt sich der Salesfactor (C2). Er haengt allein an
 * der Mattenqualitaet, dem Colortype des Artikels: 1 = mehrfarbig (F1 = 1,931),
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
 *               import { berechne, ARTIKEL } from '/preisformel.js';
 *             </script>
 *   Node:     import { berechne, ARTIKEL } from './public/preisformel.js';
 *
 * Neu (Stammdaten je Artikel, Colortype gehoert dazu):
 *   berechne({ breite: 50, laenge: 200, menge: 1 },
 *            ARTIKEL['6300201-Logomatte']);
 *
 * Alt (weiterhin gueltig, Colortype als Eingabe, Konstanten ueberschreibbar):
 *   berechne({ breite: 50, laenge: 200, menge: 1, colortype: 1 },
 *            { ekListenpreisProQm: 61.90 });
 *
 * ============================================================================
 */

/* ========================================================================== */
/* 1 · ARTIKELSTAMMDATEN                                                       */
/* ========================================================================== */

/**
 * Vorgabe-Stammdatensatz. Er entspricht exakt dem, was in der Arbeitsmappe
 * eingetragen ist (Referenzartikel "JetPrint / MJPRNT", Colortype 1).
 *
 * Jeder dieser Werte ist laut Mappe ein ARTIKELSTAMMDATUM und wird bei der
 * Artikelanlage gepflegt — keiner davon kommt aus der Kundenanfrage.
 *
 * Wird beim Aufruf ein eigener Stammdatensatz uebergeben, ueberschreibt er
 * diese Vorgabe feldweise. Der Aufruf veraendert die Vorgabe nie.
 */
export const STAMMDATEN_VORGABE = Object.freeze({
  // --- Identifikation ---------------------------------------------------
  artikelnummer:        'MJPRNT',   // A6 — Lieferanten-Artikelbezeichnung
  bezeichnung:          'JetPrint', // A5 — Artikeltyp

  // --- Colortype der Matte (Artikelstammdatum, NICHT Kundeneingabe) ------
  colortype:             1,         // F2 — 1 | 2 | 3

  // --- Salesfactoren je Colortype (Mattenqualitaet) ---------------------
  salesfactorMehrfarbig: 1.931,     // F1  — Colortype 1, "more colors"
  salesfactorEinfarbig:  1.728,     // I1  — Colortype 2, "one-color"
  salesfactorPedPrint:   1.8,       // L1  — Colortype 3, "ped-print"
  salesfactorFallback:   0,         // F19 — leere Zelle; Fallback in C2,
                                    //       siehe PREISFORMEL.md, offene Frage 2

  // --- Einkauf ----------------------------------------------------------
  ekListenpreisProQm:    54.63,     // Q5  — Einkaufs-Listenpreis pro qm

  // --- Teuerungszuschlag ------------------------------------------------
  tzProzent:             0,         // R2  — TZ % ; Faktor S2 = 1 + R2/100
  tzGueltigAb:          '01.04.2022', // T2 — reine Beschriftung, rechnet nicht mit

  // --- Masse ------------------------------------------------------------
  minBreite:             30,        // B6  — "min.width"; gilt fuer BEIDE Seiten
                                    //       ACHTUNG: matten.de fuehrt fuer
                                    //       6300201-Logomatte "Mindest X = 40".
                                    //       Abweichung ist eine offene Frage.
  maxLaenge:             700,       // C6  — "max.length"

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

  // --- one-color-Faktor -------------------------------------------------
  // W5 = 0,95 unter der Ueberschrift W3 "one-color". Die Mappe fuehrt ihn in
  // Zeile 24 als Teil der Staffelfaktoren ("R5 bis W5"), KEINE Formel greift
  // aber darauf zu. Wird hier mitgefuehrt und dokumentiert, aber nicht
  // gerechnet — siehe PREISFORMEL.md, offene Frage 14.
  faktorOneColor:         0.95,     // W5

  // --- Zuschlagsfaktoren fuer Sonderformen ------------------------------
  faktorSondermass:       1.25,     // L5  — "1,25", wenn keine Seite Standardbreite ist
  faktorSonderformOhne:   1.3,      // N5  — "1,3" bei N3 = "X"  (no border 30 %)
  faktorSonderformMit:    1.5,      // O5  — "1,5" bei O3 = "X"  (with border 50 %)

  // --- Sonderfarbe: feste Betraege, EINMAL pro Auftrag ------------------
  aufschlagSonderfarbeVK: 68,       // P5  — "68" bei P3 = "X"
  aufschlagSonderfarbeEK: 50        // P6  — "50" bei P3 = "X"
});

/**
 * Alter Name derselben Vorgabe. Bleibt erhalten, damit rechner.html,
 * seite-designer.js, mattendesigner.js und pruefe-preisformel.mjs
 * unveraendert weiterlaufen. Neuer Code sollte STAMMDATEN_VORGABE benutzen.
 */
export const KONSTANTEN = STAMMDATEN_VORGABE;

/**
 * Beschreibung jedes Stammdatenfeldes — Grundlage fuer STAMMDATEN.md und fuer
 * die Anlage der Felder in matten.de.
 *
 *   feld       Name im Modul
 *   zelle      Excel-Zelle der Arbeitsmappe
 *   typ        Datentyp fuer die Feldanlage
 *   beispiel   Wert des Artikels 6300201-Logomatte
 *   zweck      wofuer der Wert in der Rechnung gebraucht wird
 *   mattenDe   'vorhanden' | 'fehlt'  (Stand: Screenshot vom 30.08.2026)
 */
export const STAMMDATEN_FELDER = Object.freeze([
  Object.freeze({ feld: 'colortype', zelle: 'F2', typ: 'Ganzzahl 1|2|3', beispiel: 1,
    zweck: 'Waehlt den Salesfactor aus', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'salesfactorMehrfarbig', zelle: 'F1', typ: 'Dezimalzahl', beispiel: 1.931,
    zweck: 'Aufschlagfaktor Einkauf -> Verkauf, Colortype 1', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'salesfactorEinfarbig', zelle: 'I1', typ: 'Dezimalzahl', beispiel: 1.728,
    zweck: 'Aufschlagfaktor Einkauf -> Verkauf, Colortype 2', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'salesfactorPedPrint', zelle: 'L1', typ: 'Dezimalzahl', beispiel: 1.8,
    zweck: 'Aufschlagfaktor Einkauf -> Verkauf, Colortype 3', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'ekListenpreisProQm', zelle: 'Q5', typ: 'Betrag netto', beispiel: 54.63,
    zweck: 'Materialwert je Quadratmeter, Basis der ganzen Rechnung', mattenDe: 'vorhanden' }),
  Object.freeze({ feld: 'tzProzent', zelle: 'R2', typ: 'Prozentzahl', beispiel: 0,
    zweck: 'Teuerungszuschlag, wirkt nur auf den Verkauf', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'tzGueltigAb', zelle: 'T2', typ: 'Datum', beispiel: '01.04.2022',
    zweck: 'Gueltigkeitsbeginn des Teuerungszuschlags', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'minBreite', zelle: 'B6', typ: 'Ganzzahl cm', beispiel: 30,
    zweck: 'Kleinstmass; darunter Fehlermeldung "zu schmal"', mattenDe: 'vorhanden (Mindest X)' }),
  Object.freeze({ feld: 'maxLaenge', zelle: 'C6', typ: 'Ganzzahl cm', beispiel: 700,
    zweck: 'Groesstmass der langen Seite', mattenDe: 'vorhanden (Maximal X)' }),
  Object.freeze({ feld: 'standardbreiten', zelle: 'Q7:V7', typ: 'Liste Ganzzahl cm', beispiel: [60, 75, 85, 115, 150, 200],
    zweck: 'Rollenbreiten; trifft keine Seite, kostet der Zuschnitt 25 % mehr. Der groesste Wert ist zugleich die Rollenbreite.', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'mengenstaffel.schwelle', zelle: 'Q6:V6', typ: 'Liste Ganzzahl', beispiel: [1, 2, 3, 10, 20, 30],
    zweck: 'Ab welcher Stueckzahl der naechste Nachlass gilt', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'mengenstaffel.faktor', zelle: 'R5:V5', typ: 'Liste Dezimalzahl', beispiel: [0.95, 0.92, 0.90, 0.89, 0.88],
    zweck: 'Nachlassfaktoren zu den Schwellen 2/3/10/20/30', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'faktorOneColor', zelle: 'W5', typ: 'Dezimalzahl', beispiel: 0.95,
    zweck: 'In der Mappe als Stammdatum gefuehrt, von keiner Formel benutzt', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'faktorSondermass', zelle: 'L5', typ: 'Dezimalzahl', beispiel: 1.25,
    zweck: 'Zuschlag, wenn keine Seite eine Standardbreite trifft', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'faktorSonderformOhne', zelle: 'N5 / N2', typ: 'Dezimalzahl', beispiel: 1.3,
    zweck: 'Zuschlag Sonderform ohne Rand (30 %)', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'faktorSonderformMit', zelle: 'O5 / O2', typ: 'Dezimalzahl', beispiel: 1.5,
    zweck: 'Zuschlag Sonderform mit Rand (50 %)', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'aufschlagSonderfarbeVK', zelle: 'P5 / P2', typ: 'Betrag netto', beispiel: 68,
    zweck: 'Sonderfarbe im Verkauf, einmal je Auftrag', mattenDe: 'fehlt' }),
  Object.freeze({ feld: 'aufschlagSonderfarbeEK', zelle: 'P6 / P2', typ: 'Betrag netto', beispiel: 50,
    zweck: 'Sonderfarbe im Einkauf, einmal je Auftrag', mattenDe: 'fehlt' })
]);

/** Die vier Groessen, die aus der Kundenanfrage kommen — sonst nichts. */
export const KUNDENEINGABEN_FELDER = Object.freeze([
  Object.freeze({ feld: 'breite',             zelle: 'B4', typ: 'Zahl cm' }),
  Object.freeze({ feld: 'laenge',             zelle: 'C4', typ: 'Zahl cm' }),
  Object.freeze({ feld: 'menge',              zelle: 'E4', typ: 'Ganzzahl' }),
  Object.freeze({ feld: 'sonderformOhneRand', zelle: 'N3', typ: 'Ankreuzfeld ("X")' }),
  Object.freeze({ feld: 'sonderformMitRand',  zelle: 'O3', typ: 'Ankreuzfeld ("X")' }),
  Object.freeze({ feld: 'sonderfarbe',        zelle: 'P3', typ: 'Ankreuzfeld ("X")' })
]);

/**
 * Benannte Beispiel-Artikel.
 *
 * '6300201-Logomatte' stammt aus der Artikelstammdaten-Seite von matten.de
 * (Screenshot JP-Logomatte-Stammdaten.png vom 30.08.2026). Die dort bereits
 * gepflegten Felder sind uebernommen:
 *
 *   Artikelnummer            6300201-Logomatte
 *   Lieferanten-Art.Nr.      MJPRNT-6300201-Logomatte
 *   Lieferant                Frau Mazur - Firma Kleen-Tex Ind. GmbH - C000726
 *   Quadratmeterpreis EK     54,63 € netto      -> ekListenpreisProQm
 *   Quadratmeterpreis VK     105,49 € netto     -> = 54,63 · 1,931 (Colortype 1)
 *   Maximal X                700 cm             -> maxLaenge
 *   Umrechnungsfaktor        100 (cm -> m)
 *
 * Zwei Punkte weichen ab und sind in STAMMDATEN.md als Rueckfrage vermerkt:
 *   · matten.de fuehrt "Mindest X = 40", die Mappe B6 = 30.
 *     Gerechnet wird mit 30, weil die Mappe die geprueft Quelle ist.
 *   · matten.de fuehrt "Quadratmeterpreis Ek Brutto = 54,63" — das ist
 *     derselbe Wert wie netto, also offenbar ein Erfassungsfehler.
 */
export const ARTIKEL = Object.freeze({
  '6300201-Logomatte': Object.freeze({
    ...STAMMDATEN_VORGABE,
    artikelnummer:        '6300201-Logomatte',
    bezeichnung:          'JP-Logomatte',
    lieferantenArtikelNr: 'MJPRNT-6300201-Logomatte',
    lieferant:            'Kleen-Tex Ind. GmbH · C000726',
    colortype:             1,       // JetPrint = mehrfarbig
    ekListenpreisProQm:    54.63,   // Quadratmeterpreis Ek Netto
    maxLaenge:             700      // Maximal X
  })
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
/* Stammdaten zusammenstellen und pruefen                                    */
/* ------------------------------------------------------------------------ */

/**
 * Baut aus der Vorgabe und einem Teilsatz einen vollstaendigen Stammdatensatz.
 * Die Vorgabe wird nie veraendert.
 *
 * @param {object} [teil] Beliebige Teilmenge der Stammdatenfelder.
 * @returns {object} vollstaendiger Stammdatensatz.
 */
export function stammdatenFuer(teil) {
  return teil ? { ...STAMMDATEN_VORGABE, ...teil } : STAMMDATEN_VORGABE;
}

/** Zahlenfelder, die zwingend als endliche Zahl vorliegen muessen. */
const PFLICHT_ZAHLEN = Object.freeze([
  'salesfactorMehrfarbig', 'salesfactorEinfarbig', 'salesfactorPedPrint',
  'salesfactorFallback', 'ekListenpreisProQm', 'tzProzent',
  'minBreite', 'maxLaenge', 'faktorSondermass',
  'faktorSonderformOhne', 'faktorSonderformMit',
  'aufschlagSonderfarbeVK', 'aufschlagSonderfarbeEK'
]);

/**
 * Prueft einen Stammdatensatz auf Vollstaendigkeit und Plausibilitaet.
 *
 * Unterschieden wird zwischen
 *   maengel    — die Rechnung waere still falsch; berechne() bricht ab.
 *   warnungen  — die Rechnung laeuft, das Ergebnis ist aber erklaerungs-
 *                beduerftig (z. B. Colortype ausserhalb 1-3). Damit bleibt
 *                das in der Mappe hinterlegte Verhalten erhalten.
 *
 * @param {object} [s] Stammdatensatz, unvollstaendige werden gegen die
 *                     Vorgabe ergaenzt.
 * @returns {{ ok: boolean, maengel: string[], warnungen: string[], stammdaten: object }}
 */
export function pruefeStammdaten(s) {
  const st = s && typeof s === 'object' ? s : {};
  const maengel = [];
  const warnungen = [];

  for (const feld of PFLICHT_ZAHLEN) {
    if (!Number.isFinite(st[feld])) {
      maengel.push('Stammdatum "' + feld + '" fehlt oder ist keine Zahl.');
    }
  }

  if (!Array.isArray(st.standardbreiten) || st.standardbreiten.length === 0) {
    maengel.push('Stammdatum "standardbreiten" fehlt oder ist leer. Ohne '
      + 'Standardbreiten laesst sich weder der Zuschlag fuer Sondermass noch '
      + 'die Rollenbreite bestimmen.');
  } else if (!st.standardbreiten.every((b) => Number.isFinite(b) && b > 0)) {
    maengel.push('Stammdatum "standardbreiten" enthaelt Werte, die keine '
      + 'positiven Zahlen sind.');
  }

  if (!Array.isArray(st.mengenstaffel) || st.mengenstaffel.length === 0) {
    maengel.push('Stammdatum "mengenstaffel" fehlt oder ist leer.');
  } else if (!st.mengenstaffel.every((x) => x && Number.isFinite(x.schwelle) && Number.isFinite(x.faktor))) {
    maengel.push('Stammdatum "mengenstaffel" enthaelt Stufen ohne gueltige '
      + 'schwelle/faktor.');
  }

  if (Number.isFinite(st.minBreite) && Number.isFinite(st.maxLaenge)
      && st.minBreite > st.maxLaenge) {
    maengel.push('Mindestmass (' + st.minBreite + ' cm) ist groesser als das '
      + 'Maximalmass (' + st.maxLaenge + ' cm).');
  }

  if (Number.isFinite(st.ekListenpreisProQm) && st.ekListenpreisProQm <= 0) {
    warnungen.push('Der Einkaufs-Listenpreis pro qm ist ' + st.ekListenpreisProQm
      + ' €. Damit ist auch der Verkaufspreis null oder negativ.');
  }

  const ct = st.colortype;
  if (ct !== 1 && ct !== 2 && ct !== 3) {
    warnungen.push('Colortype ' + JSON.stringify(ct) + ' ist in der Tabelle '
      + 'nicht vorgesehen; erlaubt sind 1, 2 oder 3. C2 faellt dann auf die '
      + 'leere Zelle F19 zurueck, der Salesfactor wird 0 — Verkauf 0 €, '
      + 'Einkauf voll, also eine negative Marge.');
  }

  return { ok: maengel.length === 0, maengel, warnungen, stammdaten: st };
}

/* ------------------------------------------------------------------------ */
/* Einzelne Excel-Zellen als benannte Funktionen                             */
/* ------------------------------------------------------------------------ */

/**
 * C2 — Salesfactor aus dem Colortype (F2).
 * Excel: =IF($F$2=1,$F$1,IF($F$2=2,$I$1,IF($F$2=3,$L$1,F19)))
 * F19 ist in der Mappe leer; Excel liest eine leere Zelle als 0.
 */
export function salesfactorFuer(colortype, k = STAMMDATEN_VORGABE) {
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
export function faktorBreiteFuer(breite, laenge, k = STAMMDATEN_VORGABE) {
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
export function faktorLaengeFuer(breite, laenge, k = STAMMDATEN_VORGABE) {
  const rollenbreite = rollenbreiteFuer(k); // V7
  if (breite > rollenbreite && laenge === k.maxLaenge) return GRUENDE.ZU_BREIT;
  if (breite > rollenbreite && laenge > rollenbreite)  return GRUENDE.ZU_BREIT;
  if (breite <= rollenbreite && laenge > k.maxLaenge)  return GRUENDE.ZU_LANG;
  if (breite > k.maxLaenge && laenge <= rollenbreite)  return GRUENDE.ZU_LANG;
  return 1;
}

/**
 * V7 — die groesste Standardbreite. Die Mappe benutzt sie in M5 zugleich als
 * Rollenbreite; eine eigene Konstante dafuer gibt es nicht (offene Frage 8).
 */
export function rollenbreiteFuer(k = STAMMDATEN_VORGABE) {
  const b = k.standardbreiten;
  return Array.isArray(b) && b.length ? b[b.length - 1] : NaN;
}

/**
 * Mengenstaffel — die Kaskade aus G5.
 * Gibt { faktor, schwelle, zelle } zurueck, oder null wenn die Menge unter der
 * kleinsten Schwelle liegt. In Excel liefert die innerste IF() dann FALSE, was
 * in der Multiplikation als 0 gelesen wird — der Preis waere also 0 + P5.
 */
export function staffelFuer(menge, k = STAMMDATEN_VORGABE) {
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
 * @param {object} eingaben  NUR die Kundeneingaben.
 * @param {number} eingaben.breite            B4 — Breite in cm
 * @param {number} eingaben.laenge            C4 — Laenge in cm
 * @param {number} eingaben.menge             E4 — Stueckzahl
 * @param {boolean} eingaben.sonderformOhneRand  N3 — "X"
 * @param {boolean} eingaben.sonderformMitRand   O3 — "X"
 * @param {boolean} eingaben.sonderfarbe         P3 — "X"
 * @param {number} [eingaben.colortype]       F2 — nur noch aus Rueckwaerts-
 *        kompatibilitaet; gehoert eigentlich in die Stammdaten und gewinnt,
 *        wenn beides gesetzt ist.
 *
 * @param {object} [stammdaten] Beliebige Teilmenge von STAMMDATEN_VORGABE.
 *        Fehlende Felder werden aus der Vorgabe ergaenzt.
 *
 * @param {object} [optionen]
 * @param {boolean} [optionen.streng=false] Macht aus jeder Warnung einen
 *        Abbruch — insbesondere aus einem Colortype ausserhalb 1-3.
 *
 * @returns {object} Bei Erfolg { ok:true, … }, sonst { ok:false, grund, code }.
 */
export function berechne(eingaben, stammdaten, optionen) {
  const k = stammdatenFuer(stammdaten);
  const e = eingaben || {};
  const streng = !!(optionen && optionen.streng);

  /* --- Stammdaten pruefen -------------------------------------------- */
  /*  Ohne diese Pruefung wuerde z. B. eine leere Standardbreitenliste     */
  /*  still einen falschen Preis liefern statt eines Fehlers.              */
  const pruefung = pruefeStammdaten(k);
  if (!pruefung.ok) {
    return {
      ok: false,
      code: 'STAMMDATEN',
      grund: 'Die Artikelstammdaten sind unvollstaendig: ' + pruefung.maengel.join(' '),
      maengel: pruefung.maengel,
      fehlendeFelder: pruefung.maengel
    };
  }

  /* --- Eingaben normalisieren --------------------------------------- */
  const breite    = alsZahl(e.breite);
  const laenge    = alsZahl(e.laenge);
  const menge     = alsZahl(e.menge);

  // F2 — Artikelstammdatum. Ein in den Eingaben mitgegebener Colortype
  // gewinnt, damit die frueher uebliche Aufrufform unveraendert weiterlaeuft.
  const colortypeRoh = (e.colortype === undefined || e.colortype === null)
    ? k.colortype
    : e.colortype;
  const colortype = alsZahl(colortypeRoh);

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
  const warnungen = [];

  /* --- D4: Flaeche einer Matte in qm --------------------------------- */
  //  Excel: =B4*C4*0.01*0.01
  const qmProStueck = breite * laenge * 0.01 * 0.01;

  /* --- C2: Salesfactor ------------------------------------------------ */
  const salesfactor = salesfactorFuer(colortype, k);
  if (colortype !== 1 && colortype !== 2 && colortype !== 3) {
    const text =
      'Colortype ' + colortypeRoh + ' ist in der Tabelle nicht vorgesehen. ' +
      'C2 faellt dann auf die leere Zelle F19 zurueck, der Salesfactor wird 0.';
    hinweise.push(text);
    warnungen.push(text);
    if (streng) {
      return {
        ok: false, code: 'COLORTYPE', grund: text, zelle: 'F2',
        klartext: 'Der Colortype des Artikels muss 1 (mehrfarbig), '
          + '2 (einfarbig) oder 3 (Ped-Print) sein.'
      };
    }
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
    const rollenbreite = rollenbreiteFuer(k);
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

  /* --- Abgeleitete Groessen ohne den einmaligen Sonderfarbenaufschlag --- */
  /*  Diese drei Werte wurden bisher ausserhalb des Moduls durch            */
  /*  Subtraktion gebildet. Sie gehoeren sachlich hierher, weil nur hier    */
  /*  bekannt ist, dass P5 genau einmal je Auftrag anfaellt.                */

  // G5 − P5: der reine Stueckpreis, ohne den einmaligen Aufschlag.
  const vkProStueckOhneEinmaliges = vkProStueck - aufschlagVK;

  // F5 − P5: der Anteil der Gesamtsumme, der sich auf die Stueckzahl verteilt.
  // Es gilt vkStueckanteil = Menge · vkProStueckOhneEinmaliges.
  const vkStueckanteil = vkGesamt - aufschlagVK;

  // E6 − P5: der Listenpreis je Stueck ohne den einmaligen Aufschlag.
  const listenpreisProStueckOhneEinmaliges = listenpreisProStueck - aufschlagVK;

  return {
    ok: true,

    // --- verwendete Artikelstammdaten -----------------------------------
    stammdaten: k,
    artikelnummer: k.artikelnummer,

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

    // --- Ergebnisse ohne den einmaligen Sonderfarbenaufschlag -------------
    vkProStueckOhneEinmaliges,             // G5 − P5
    vkStueckanteil,                        // F5 − P5
    listenpreisProStueckOhneEinmaliges,    // E6 − P5

    hinweise,
    warnungen
  };
}

/**
 * Bequemer Aufruf fuer die Anzeige: liefert dieselben Felder, aber auf zwei
 * Nachkommastellen gerundet. Die Rundung passiert ausschliesslich hier.
 */
export function berechneGerundet(eingaben, stammdaten, optionen) {
  const r = berechne(eingaben, stammdaten, optionen);
  if (!r.ok) return r;
  const gerundet = { ...r };
  for (const feld of [
    'qmProStueck', 'vkProStueck', 'vkGesamt', 'ekProQm', 'ekProStueck',
    'ekGesamt', 'marge', 'gesamtQm', 'listenpreisProStueck', 'basisProStueck',
    'vkProStueckOhneEinmaliges', 'vkStueckanteil',
    'listenpreisProStueckOhneEinmaliges'
  ]) {
    gerundet[feld] = runde(r[feld], 2);
  }
  return gerundet;
}

export default {
  berechne, berechneGerundet,
  STAMMDATEN_VORGABE, STAMMDATEN_FELDER, KUNDENEINGABEN_FELDER, ARTIKEL,
  stammdatenFuer, pruefeStammdaten, rollenbreiteFuer,
  KONSTANTEN, GRUENDE, COLORTYPES, runde, euro, zahl
};
