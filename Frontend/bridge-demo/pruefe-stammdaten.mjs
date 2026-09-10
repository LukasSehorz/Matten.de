/**
 * pruefe-stammdaten.mjs
 * ============================================================================
 * Prueft die Stammdaten-Fassung von public/preisformel.js.
 *
 *     node pruefe-stammdaten.mjs
 *
 * Keine npm-Pakete, kein Netz. Node ab Version 20.
 *
 * Diese Datei ergaenzt pruefe-preisformel.mjs, sie ersetzt sie nicht.
 * pruefe-preisformel.mjs sichert ab, dass die Rechnung selbst unveraendert
 * bleibt (61 Faelle gegen die Arbeitsmappe). Hier geht es um die Trennung
 * zwischen Artikelstammdaten und Kundeneingaben:
 *
 *   TEIL 1  Derselbe Artikel, dieselben Eingaben -> dieselben Ergebnisse wie
 *           bisher. Die alte Aufrufform (Colortype als Kundeneingabe) und die
 *           neue (Colortype als Artikelstammdatum) muessen Wert fuer Wert
 *           uebereinstimmen.
 *   TEIL 2  Ein zweiter Artikel mit anderen Stammdaten liefert andere,
 *           nachrechenbare Ergebnisse. Die Sollwerte stammen aus einer
 *           zweiten, unabhaengigen Umsetzung der Excel-Formeln (unten,
 *           Funktion sollwerte()) und sind zusaetzlich als von Hand
 *           gerechnete Eurobetraege hinterlegt.
 *   TEIL 3  Fehlerhafte oder unvollstaendige Stammdaten muessen eine klare
 *           Meldung ergeben statt einer stillen Falschrechnung.
 *   TEIL 4  Die neu aufgenommenen Felder ohne den einmaligen
 *           Sonderfarbenaufschlag.
 *   TEIL 5  Abgleich mit der Artikelstammdaten-Seite von matten.de
 *           (Screenshot JP-Logomatte-Stammdaten.png vom 30.08.2026).
 * ============================================================================
 */

import {
  berechne, runde,
  STAMMDATEN_VORGABE, KONSTANTEN, ARTIKEL,
  stammdatenFuer, pruefeStammdaten, rollenbreiteFuer
} from './public/preisformel.js';

/* ---------------------------------------------------------------- Helfer */

const TOLERANZ = 1e-9;

/** Alle Ergebnisfelder, die zwischen zwei Aufrufen uebereinstimmen muessen. */
const FELDER = [
  'qmProStueck', 'salesfactor', 'tzFaktor', 'staffelfaktor',
  'faktorBreite', 'faktorLaenge', 'faktorFormOhneRand', 'faktorFormMitRand',
  'aufschlagVK', 'aufschlagEK', 'zuschlagsfaktor', 'basisProStueck',
  'vkProStueck', 'vkGesamt', 'ekProQm', 'ekProStueck', 'ekGesamt',
  'marge', 'gesamtQm', 'listenpreisProStueck',
  'vkProStueckOhneEinmaliges', 'vkStueckanteil',
  'listenpreisProStueckOhneEinmaliges'
];

function abweichung(soll, ist) {
  if (typeof soll !== 'number' || typeof ist !== 'number') {
    return soll === ist ? 0 : Infinity;
  }
  if (!Number.isFinite(soll) || !Number.isFinite(ist)) {
    return Object.is(soll, ist) ? 0 : Infinity;
  }
  if (soll === ist) return 0;
  const n = Math.max(Math.abs(soll), Math.abs(ist));
  return n === 0 ? Math.abs(soll - ist) : Math.abs(soll - ist) / n;
}

function z(w, n = 6) {
  if (typeof w !== 'number') return String(w);
  if (!Number.isFinite(w)) return String(w);
  return w.toFixed(n).replace('.', ',');
}
function li(s, n) { s = String(s); return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); }
function re(s, n) { s = String(s); return s.length >= n ? s.slice(0, n) : ' '.repeat(n - s.length) + s; }
function linie(n) { return '─'.repeat(n); }

const ergebnisse = [];
function pruefe(teil, name, bedingung, erlaeuterung) {
  ergebnisse.push({ teil, name, ok: !!bedingung, erlaeuterung: erlaeuterung || '' });
}

/* ==========================================================================
   Zweite, unabhaengige Umsetzung der Excel-Formeln
   --------------------------------------------------------------------------
   Bewusst kurz und wortwoertlich aus A1:W7 abgeschrieben, ohne einen Blick in
   preisformel.js. Sie kennt weder Stammdatenpruefung noch Hinweise, sondern
   nur die Rechnung. Damit ist der Vergleich in TEIL 2 ein echter Gegentest.
   ========================================================================== */

function sollwerte(st, ein) {
  const B4 = ein.breite, C4 = ein.laenge, E4 = ein.menge;
  const Q5 = st.ekListenpreisProQm;
  const S2 = 1 + st.tzProzent / 100;

  // C2
  const C2 = ein.colortype === 1 ? st.salesfactorMehrfarbig
           : ein.colortype === 2 ? st.salesfactorEinfarbig
           : ein.colortype === 3 ? st.salesfactorPedPrint
           : st.salesfactorFallback;

  // D4
  const D4 = B4 * C4 * 0.01 * 0.01;

  // L5
  let L5;
  if (B4 < st.minBreite || C4 < st.minBreite) L5 = 'zu schmal';
  else L5 = st.standardbreiten.some((b) => B4 === b || C4 === b) ? 1 : st.faktorSondermass;

  // M5
  const V7 = st.standardbreiten[st.standardbreiten.length - 1];
  let M5;
  if (B4 > V7 && C4 === st.maxLaenge) M5 = 'Matte zu breit';
  else if (B4 > V7 && C4 > V7) M5 = 'Matte zu breit';
  else if (B4 <= V7 && C4 > st.maxLaenge) M5 = 'Matte zu lang';
  else if (B4 > st.maxLaenge && C4 <= V7) M5 = 'Matte zu lang';
  else M5 = 1;

  if (typeof L5 === 'string') return { fehler: L5 };
  if (typeof M5 === 'string') return { fehler: M5 };

  const N5 = ein.sonderformOhneRand ? st.faktorSonderformOhne : 1;
  const O5 = ein.sonderformMitRand  ? st.faktorSonderformMit  : 1;
  const P5 = ein.sonderfarbe ? st.aufschlagSonderfarbeVK : 0;
  const P6 = ein.sonderfarbe ? st.aufschlagSonderfarbeEK : 0;

  // Kaskade aus G5 / J5
  let staffel = null;
  for (const s of st.mengenstaffel) { if (E4 >= s.schwelle) { staffel = s; break; } }

  const kern = staffel ? D4 * Q5 * C2 * staffel.faktor * S2 : 0;
  const G5 = kern * L5 * M5 * N5 * O5 + P5;
  const F5 = E4 * G5 - (E4 - 1) * P5;
  const J5 = (staffel ? Q5 : 0) * L5 * M5 * N5 * O5;
  const I5 = D4 * J5 + P6;
  const H5 = D4 * J5 * E4 + P6;
  const K5 = F5 - H5;
  const D6 = D4 * E4;
  const E6 = (staffel ? D4 * Q5 * C2 * S2 : 0) + P5;

  return {
    qmProStueck: D4, salesfactor: C2, tzFaktor: S2,
    staffelfaktor: staffel ? staffel.faktor : 0,
    faktorBreite: L5, faktorLaenge: M5,
    faktorFormOhneRand: N5, faktorFormMitRand: O5,
    aufschlagVK: P5, aufschlagEK: P6,
    zuschlagsfaktor: L5 * M5 * N5 * O5,
    basisProStueck: kern,
    vkProStueck: G5, vkGesamt: F5, ekProQm: J5, ekProStueck: I5,
    ekGesamt: H5, marge: K5, gesamtQm: D6, listenpreisProStueck: E6,
    vkProStueckOhneEinmaliges: G5 - P5,
    vkStueckanteil: F5 - P5,
    listenpreisProStueckOhneEinmaliges: E6 - P5
  };
}

/* ==========================================================================
   Der zweite Artikel — frei erfundene, aber plausible Stammdaten
   --------------------------------------------------------------------------
   Er unterscheidet sich vom Logomatten-Artikel in jedem Punkt, der die
   Rechnung beeinflusst: anderer Colortype, anderer Einkaufspreis je qm,
   andere Standardbreiten, andere Mindest- und Maximalmasse, ein von null
   verschiedener Teuerungszuschlag und andere Sonderfarbenaufschlaege.
   ========================================================================== */

const ARTIKEL_B = Object.freeze({
  ...STAMMDATEN_VORGABE,
  artikelnummer:        '7100455-Ripsmatte',
  bezeichnung:          'Rips uni',
  colortype:             2,        // einfarbig -> Salesfactor 1,728
  ekListenpreisProQm:    41.20,
  standardbreiten:       Object.freeze([90, 120, 200]),
  minBreite:             40,
  maxLaenge:             600,
  tzProzent:             3,        // Faktor 1,03
  aufschlagSonderfarbeVK: 55,
  aufschlagSonderfarbeEK: 40
});

/* ==========================================================================
   TEIL 1 — Alte und neue Aufrufform muessen identisch rechnen
   ========================================================================== */

const LOGOMATTE = ARTIKEL['6300201-Logomatte'];

const GLEICHSTAND_FAELLE = [
  { name: 'Referenzfall 50 x 200, 1 Stk',            e: { breite: 50, laenge: 200, menge: 1 } },
  { name: 'Standardbreite 85 (85 x 130), 2 Stk',     e: { breite: 85, laenge: 130, menge: 2 } },
  { name: 'Sondermass 99 x 133, 12 Stk',             e: { breite: 99, laenge: 133, menge: 12 } },
  { name: 'Sonderform ohne Rand, 30 Stk',            e: { breite: 60, laenge: 90, menge: 30, sonderformOhneRand: true } },
  { name: 'Sonderform mit Rand + Sonderfarbe, 5 Stk',e: { breite: 115, laenge: 240, menge: 5, sonderformMitRand: true, sonderfarbe: true } },
  { name: 'Alle drei Sonderoptionen, 20 Stk',        e: { breite: 77, laenge: 143, menge: 20, sonderformOhneRand: true, sonderformMitRand: true, sonderfarbe: 'X' } },
  { name: 'Grenzfall 30 x 700, 1 Stk',               e: { breite: 30, laenge: 700, menge: 1 } }
];

console.log('');
console.log('='.repeat(120));
console.log('  PRUEFUNG DER STAMMDATEN-FASSUNG  ·  public/preisformel.js');
console.log('='.repeat(120));
console.log('');
console.log('  TEIL 1 · Colortype als Kundeneingabe (alt) gegen Colortype als Artikelstammdatum (neu)');
console.log('           Artikel: ' + LOGOMATTE.artikelnummer + ', Colortype ' + LOGOMATTE.colortype);
console.log('');
console.log('  ' + li('Fall', 46) + re('VK je Stueck', 18) + re('VK gesamt', 18) + re('max Abw.', 12) + '   Status');
console.log('  ' + linie(102));

for (const fall of GLEICHSTAND_FAELLE) {
  // alte Aufrufform: Colortype in den Eingaben, keine Stammdaten
  const alt = berechne({ ...fall.e, colortype: LOGOMATTE.colortype });
  // neue Aufrufform: Colortype steckt im Artikel
  const neu = berechne(fall.e, LOGOMATTE);

  let maxAbw = 0;
  for (const f of FELDER) maxAbw = Math.max(maxAbw, abweichung(alt[f], neu[f]));
  const ok = alt.ok === neu.ok && maxAbw <= TOLERANZ;

  console.log('  ' + li(fall.name, 46) + re(z(neu.vkProStueck, 6), 18) +
    re(z(neu.vkGesamt, 6), 18) + re(maxAbw === 0 ? 'exakt' : maxAbw.toExponential(1), 12) +
    '   ' + (ok ? 'OK' : 'ABWEICHUNG'));

  pruefe(1, 'Gleichstand: ' + fall.name, ok,
    'groesste Abweichung ueber ' + FELDER.length + ' Werte: ' + (maxAbw === 0 ? 'exakt' : maxAbw.toExponential(1)));
}

// Der Vorgabeartikel und der Logomatten-Artikel sind rechnerisch derselbe.
{
  const a = berechne({ breite: 62, laenge: 148, menge: 4, colortype: 1 });
  const b = berechne({ breite: 62, laenge: 148, menge: 4 }, LOGOMATTE);
  pruefe(1, 'Vorgabe und 6300201-Logomatte rechnen gleich',
    Math.abs(a.vkGesamt - b.vkGesamt) < TOLERANZ,
    z(a.vkGesamt, 6) + ' gegen ' + z(b.vkGesamt, 6));
}

// Ein Colortype in den Eingaben gewinnt weiterhin gegen den des Artikels.
{
  const r = berechne({ breite: 60, laenge: 100, menge: 1, colortype: 3 }, LOGOMATTE);
  pruefe(1, 'Colortype aus den Eingaben schlaegt den des Artikels',
    r.ok && r.salesfactor === STAMMDATEN_VORGABE.salesfactorPedPrint,
    'Salesfactor = ' + r.salesfactor + ' (erwartet 1.8, Artikel haette 1.931)');
}

// Ohne Colortype in den Eingaben gilt der des Artikels.
{
  const r = berechne({ breite: 60, laenge: 100, menge: 1 }, ARTIKEL_B);
  pruefe(1, 'Ohne Colortype in den Eingaben gilt der des Artikels',
    r.ok && r.salesfactor === STAMMDATEN_VORGABE.salesfactorEinfarbig,
    'Salesfactor = ' + r.salesfactor + ' (Artikel B hat Colortype 2)');
}

// KONSTANTEN bleibt als alter Name erhalten und unveraendert.
pruefe(1, 'KONSTANTEN zeigt weiterhin auf die Vorgabe',
  KONSTANTEN === STAMMDATEN_VORGABE && KONSTANTEN.ekListenpreisProQm === 54.63,
  'ekListenpreisProQm = ' + KONSTANTEN.ekListenpreisProQm);

/* ==========================================================================
   TEIL 2 — Der zweite Artikel
   ========================================================================== */

/*
 * Von Hand gerechnet, Artikel 7100455-Ripsmatte
 * (EK 41,20 €/qm · Salesfactor 1,728 · TZ 3 % · Standardbreiten 90/120/200):
 *
 *  B1  90 x 200 cm, 1 Stk
 *      qm = 1,80 · 41,20 = 74,16 €  Material
 *      74,16 · 1,728 = 128,14848 · 1,03 = 131,9929344  -> VK/Stk 131,99 €
 *      90 trifft eine Standardbreite, also kein Sondermassaufschlag.
 *      EK/qm 41,20 · EK/Stk 74,16 · Marge 57,83 €
 *
 *  B2  100 x 150 cm, 3 Stk   (keine Seite trifft 90/120/200 -> Faktor 1,25)
 *      qm = 1,50 · 41,20 = 61,80 · 1,728 = 106,7904 · 0,92 (Staffel ab 3)
 *         = 98,247168 · 1,03 = 101,19458304 · 1,25 = 126,4932288
 *      -> VK/Stk 126,49 €, VK gesamt 379,48 €
 *      EK/qm 51,50 · EK gesamt 231,75 € · Marge 147,73 €
 *
 *  B3  120 x 300 cm, 5 Stk, Sonderform mit Rand + Sonderfarbe
 *      qm = 3,60 · 41,20 = 148,32 · 1,728 = 256,29696 · 0,92 = 235,7932032
 *         · 1,03 = 242,866999296 · 1,5 = 364,300498944 + 55 = 419,300498944
 *      -> VK/Stk 419,30 €
 *      VK gesamt = 5 · 419,300498944 − 4 · 55 = 1 876,50 €
 *      EK/qm = 41,20 · 1,5 = 61,80 · EK gesamt = 3,6 · 61,80 · 5 + 40 = 1 152,40 €
 *      Marge 724,10 €
 */

const FAELLE_B = [
  { name: 'B1  90 x 200, 1 Stk',
    e: { breite: 90, laenge: 200, menge: 1 },
    vkStk: 131.99, vkGes: 131.99, ekQm: 41.20, ekGes: 74.16, marge: 57.83 },
  { name: 'B2  100 x 150, 3 Stk (Sondermass)',
    e: { breite: 100, laenge: 150, menge: 3 },
    vkStk: 126.49, vkGes: 379.48, ekQm: 51.50, ekGes: 231.75, marge: 147.73 },
  { name: 'B3  120 x 300, 5 Stk, Rand + Sonderfarbe',
    e: { breite: 120, laenge: 300, menge: 5, sonderformMitRand: true, sonderfarbe: true },
    vkStk: 419.30, vkGes: 1876.50, ekQm: 61.80, ekGes: 1152.40, marge: 724.10 }
];

console.log('');
console.log('  TEIL 2 · Zweiter Artikel ' + ARTIKEL_B.artikelnummer +
  '  (EK ' + ARTIKEL_B.ekListenpreisProQm + ' €/qm · Colortype ' + ARTIKEL_B.colortype +
  ' · TZ ' + ARTIKEL_B.tzProzent + ' % · Standardbreiten ' + ARTIKEL_B.standardbreiten.join('/') + ')');
console.log('');
console.log('  ' + li('Fall', 44) + re('VK/Stk Hand', 14) + re('VK/Stk Modul', 14) +
  re('VK ges Hand', 14) + re('VK ges Modul', 14) + re('max Abw.', 11) + '   Status');
console.log('  ' + linie(122));

for (const fall of FAELLE_B) {
  const erg  = berechne(fall.e, ARTIKEL_B);
  const soll = sollwerte(ARTIKEL_B, { ...fall.e, colortype: ARTIKEL_B.colortype });

  let maxAbw = 0;
  for (const f of FELDER) maxAbw = Math.max(maxAbw, abweichung(soll[f], erg[f]));

  const handOk =
    runde(erg.vkProStueck, 2) === fall.vkStk &&
    runde(erg.vkGesamt, 2)    === fall.vkGes &&
    runde(erg.ekProQm, 2)     === fall.ekQm  &&
    runde(erg.ekGesamt, 2)    === fall.ekGes &&
    runde(erg.marge, 2)       === fall.marge;

  const ok = erg.ok && maxAbw <= TOLERANZ && handOk;

  console.log('  ' + li(fall.name, 44) +
    re(z(fall.vkStk, 2), 14) + re(z(erg.vkProStueck, 2), 14) +
    re(z(fall.vkGes, 2), 14) + re(z(erg.vkGesamt, 2), 14) +
    re(maxAbw === 0 ? 'exakt' : maxAbw.toExponential(1), 11) + '   ' + (ok ? 'OK' : 'ABWEICHUNG'));

  pruefe(2, fall.name + ' — gegen die unabhaengige Umsetzung', erg.ok && maxAbw <= TOLERANZ,
    'groesste Abweichung ueber ' + FELDER.length + ' Werte: ' + (maxAbw === 0 ? 'exakt' : maxAbw.toExponential(1)));
  pruefe(2, fall.name + ' — gegen die von Hand gerechneten Betraege', handOk,
    'VK/Stk ' + z(runde(erg.vkProStueck, 2), 2) + ' · VK ges ' + z(runde(erg.vkGesamt, 2), 2) +
    ' · EK/qm ' + z(runde(erg.ekProQm, 2), 2) + ' · EK ges ' + z(runde(erg.ekGesamt, 2), 2) +
    ' · Marge ' + z(runde(erg.marge, 2), 2));
}

// Andere Stammdaten muessen auch wirklich andere Preise ergeben.
{
  const a = berechne({ breite: 60, laenge: 140, menge: 1 }, LOGOMATTE);
  const b = berechne({ breite: 60, laenge: 140, menge: 1 }, ARTIKEL_B);
  pruefe(2, 'Gleiche Eingabe, anderer Artikel -> anderer Preis',
    a.ok && b.ok && Math.abs(a.vkProStueck - b.vkProStueck) > 1,
    'Logomatte ' + z(a.vkProStueck, 2) + ' € gegen Ripsmatte ' + z(b.vkProStueck, 2) + ' €');

  pruefe(2, '60 cm ist nur bei der Logomatte eine Standardbreite',
    a.faktorBreite === 1 && b.faktorBreite === ARTIKEL_B.faktorSondermass,
    'Faktor Logomatte ' + a.faktorBreite + ', Faktor Ripsmatte ' + b.faktorBreite);
}

// Die Groessengrenzen kommen aus den Stammdaten, nicht aus dem Modul.
{
  const zuLang   = berechne({ breite: 100, laenge: 650, menge: 1 }, ARTIKEL_B);
  const nochOk   = berechne({ breite: 100, laenge: 650, menge: 1 }, LOGOMATTE);
  pruefe(2, 'Maximallaenge 600 cm des Artikels B greift',
    zuLang.ok === false && zuLang.grund === 'Matte zu lang' && nochOk.ok === true,
    'Artikel B: "' + zuLang.grund + '", Logomatte: Preis ' + z(nochOk.vkProStueck, 2) + ' €');

  const zuSchmal = berechne({ breite: 35, laenge: 200, menge: 1 }, ARTIKEL_B);
  const nochOk2  = berechne({ breite: 35, laenge: 200, menge: 1 }, LOGOMATTE);
  pruefe(2, 'Mindestmass 40 cm des Artikels B greift',
    zuSchmal.ok === false && zuSchmal.grund === 'zu schmal' && nochOk2.ok === true,
    'Artikel B: "' + zuSchmal.grund + '", Logomatte: Preis ' + z(nochOk2.vkProStueck, 2) + ' €');

  pruefe(2, 'Rollenbreite ist die groesste Standardbreite des Artikels',
    rollenbreiteFuer(ARTIKEL_B) === 200 && rollenbreiteFuer(LOGOMATTE) === 200,
    'Artikel B: ' + rollenbreiteFuer(ARTIKEL_B) + ' cm');
}

// Der Teuerungszuschlag des Artikels wirkt nur auf den Verkauf.
{
  const r = berechne({ breite: 90, laenge: 200, menge: 1 }, ARTIKEL_B);
  const ohneTz = berechne({ breite: 90, laenge: 200, menge: 1 }, { ...ARTIKEL_B, tzProzent: 0 });
  pruefe(2, 'TZ 3 % erhoeht nur den Verkauf, nicht den Einkauf',
    Math.abs(r.vkProStueck / ohneTz.vkProStueck - 1.03) < TOLERANZ &&
    Math.abs(r.ekGesamt - ohneTz.ekGesamt) < TOLERANZ,
    'VK ' + z(ohneTz.vkProStueck, 4) + ' -> ' + z(r.vkProStueck, 4) + ' €, EK unveraendert ' + z(r.ekGesamt, 2) + ' €');
}

// Der Aufruf darf die Vorgabe nicht veraendern.
{
  berechne({ breite: 90, laenge: 200, menge: 1 }, ARTIKEL_B);
  const danach = berechne({ breite: 50, laenge: 200, menge: 1, colortype: 1 });
  pruefe(2, 'Ein Aufruf mit fremden Stammdaten faerbt nicht ab',
    Math.abs(danach.vkProStueck - 105.49053) < TOLERANZ &&
    STAMMDATEN_VORGABE.ekListenpreisProQm === 54.63,
    'Referenzfall danach wieder ' + z(danach.vkProStueck, 5) + ' €');
}

/* ==========================================================================
   TEIL 3 — Fehlerhafte oder unvollstaendige Stammdaten
   ========================================================================== */

console.log('');
console.log('  TEIL 3 · Unvollstaendige und unplausible Stammdaten');
console.log('');
console.log('  ' + li('Lage', 52) + li('erwartet', 22) + li('erhalten', 22) + '   Status');
console.log('  ' + linie(104));

const STAMMDATEN_FEHLER = [
  { name: 'Einkaufspreis je qm fehlt',
    st: { ...LOGOMATTE, ekListenpreisProQm: null }, code: 'STAMMDATEN' },
  { name: 'Einkaufspreis je qm ist Text',
    st: { ...LOGOMATTE, ekListenpreisProQm: '54,63' }, code: 'STAMMDATEN' },
  { name: 'Salesfactor Colortype 1 fehlt',
    st: { ...LOGOMATTE, salesfactorMehrfarbig: undefined }, code: 'STAMMDATEN' },
  { name: 'Standardbreiten-Liste ist leer',
    st: { ...LOGOMATTE, standardbreiten: [] }, code: 'STAMMDATEN' },
  { name: 'Standardbreiten-Liste fehlt ganz',
    st: { ...LOGOMATTE, standardbreiten: null }, code: 'STAMMDATEN' },
  { name: 'Standardbreiten enthalten Text',
    st: { ...LOGOMATTE, standardbreiten: [60, '75', 200] }, code: 'STAMMDATEN' },
  { name: 'Mengenstaffel ist leer',
    st: { ...LOGOMATTE, mengenstaffel: [] }, code: 'STAMMDATEN' },
  { name: 'Mindestmass groesser als Maximalmass',
    st: { ...LOGOMATTE, minBreite: 900 }, code: 'STAMMDATEN' },
  { name: 'Teuerungszuschlag fehlt',
    st: { ...LOGOMATTE, tzProzent: undefined }, code: 'STAMMDATEN' },
  { name: 'Sonderfarbenaufschlag VK fehlt',
    st: { ...LOGOMATTE, aufschlagSonderfarbeVK: null }, code: 'STAMMDATEN' }
];

for (const fall of STAMMDATEN_FEHLER) {
  const r = berechne({ breite: 60, laenge: 120, menge: 1 }, fall.st);
  const ok = r.ok === false && r.code === fall.code;
  const erhalten = r.ok ? 'Preis ' + z(r.vkProStueck, 2) + ' €' : r.code;
  console.log('  ' + li(fall.name, 52) + li(fall.code, 22) + li(erhalten, 22) + '   ' + (ok ? 'OK' : 'FEHL'));
  pruefe(3, 'Stammdatenfehler: ' + fall.name, ok, 'erhalten: ' + erhalten);
}

// Colortype ausserhalb 1-3.
{
  // Ohne strenge Pruefung rechnet das Modul weiter wie die Mappe (F19 = leer,
  // Salesfactor 0) und legt eine Warnung ab. Nur so bleiben die 61 geprueften
  // Faelle aus pruefe-preisformel.mjs gueltig.
  const locker = berechne({ breite: 60, laenge: 120, menge: 1 }, { ...LOGOMATTE, colortype: 7 });
  const lockerOk = locker.ok === true && locker.salesfactor === 0 &&
    locker.vkProStueck === 0 && locker.marge < 0 &&
    Array.isArray(locker.warnungen) && locker.warnungen.length === 1;
  console.log('  ' + li('Colortype 7 (ohne strenge Pruefung)', 52) +
    li('Preis + Warnung', 22) +
    li(locker.ok ? z(locker.vkProStueck, 2) + ' € / ' + locker.warnungen.length + ' Warnung' : locker.code, 22) +
    '   ' + (lockerOk ? 'OK' : 'FEHL'));
  pruefe(3, 'Colortype 7: rechnet wie die Mappe, warnt aber', lockerOk,
    'Salesfactor ' + locker.salesfactor + ', VK ' + z(locker.vkProStueck, 2) +
    ' €, Marge ' + z(locker.marge, 2) + ' €');

  // Mit strenger Pruefung wird daraus ein klarer Abbruch.
  const streng = berechne({ breite: 60, laenge: 120, menge: 1 },
    { ...LOGOMATTE, colortype: 7 }, { streng: true });
  const strengOk = streng.ok === false && streng.code === 'COLORTYPE' && streng.zelle === 'F2';
  console.log('  ' + li('Colortype 7 (streng: true)', 52) + li('COLORTYPE', 22) +
    li(streng.ok ? 'Preis!' : streng.code, 22) + '   ' + (strengOk ? 'OK' : 'FEHL'));
  pruefe(3, 'Colortype 7 mit streng:true ergibt einen Abbruch', strengOk,
    streng.ok ? 'es kam ein Preis heraus' : streng.grund);

  // Auch 0, "1" (Text) und fehlend sind kein gueltiger Colortype.
  let alleErkannt = true;
  for (const ct of [0, 4, -1, '1', null, undefined, NaN]) {
    const p = pruefeStammdaten({ ...LOGOMATTE, colortype: ct });
    if (p.warnungen.length !== 1) alleErkannt = false;
  }
  pruefe(3, 'pruefeStammdaten meldet jeden Colortype ausserhalb 1-3', alleErkannt,
    'geprueft: 0, 4, -1, "1", null, undefined, NaN');

  const gut = pruefeStammdaten(LOGOMATTE);
  pruefe(3, 'Vollstaendige Stammdaten ergeben keine Beanstandung',
    gut.ok && gut.maengel.length === 0 && gut.warnungen.length === 0,
    gut.maengel.length + ' Maengel, ' + gut.warnungen.length + ' Warnungen');
}

// stammdatenFuer() ergaenzt Fehlendes aus der Vorgabe.
{
  const teil = stammdatenFuer({ ekListenpreisProQm: 60 });
  pruefe(3, 'stammdatenFuer ergaenzt fehlende Felder aus der Vorgabe',
    teil.ekListenpreisProQm === 60 && teil.salesfactorMehrfarbig === 1.931 &&
    STAMMDATEN_VORGABE.ekListenpreisProQm === 54.63,
    'ekListenpreisProQm ' + teil.ekListenpreisProQm + ', Salesfactor ' + teil.salesfactorMehrfarbig);
}

/* ==========================================================================
   TEIL 4 — Die neuen Felder ohne den einmaligen Sonderfarbenaufschlag
   ========================================================================== */

console.log('');
console.log('  TEIL 4 · Werte ohne den einmaligen Sonderfarbenaufschlag');
console.log('');

for (const menge of [1, 2, 10, 30]) {
  const r = berechne({ breite: 115, laenge: 240, menge, sonderfarbe: true }, LOGOMATTE);

  const a = Math.abs(r.vkProStueckOhneEinmaliges - (r.vkProStueck - r.aufschlagVK)) < TOLERANZ;
  const b = Math.abs(r.vkStueckanteil - (r.vkGesamt - r.aufschlagVK)) < TOLERANZ;
  const c = Math.abs(r.listenpreisProStueckOhneEinmaliges - (r.listenpreisProStueck - r.aufschlagVK)) < TOLERANZ;
  // Der Stueckanteil muss genau die Menge mal den Stueckpreis ohne Aufschlag sein.
  const d = Math.abs(r.vkStueckanteil - menge * r.vkProStueckOhneEinmaliges) < 1e-9;

  console.log('  ' + li('Menge ' + menge + ', 115 x 240, Sonderfarbe', 40) +
    'VK/Stk ' + re(z(r.vkProStueck, 2), 10) + ' €  davon Aufschlag ' + re(z(r.aufschlagVK, 2), 7) +
    ' €  ->  ' + re(z(r.vkProStueckOhneEinmaliges, 2), 10) + ' €   ' +
    ((a && b && c && d) ? 'OK' : 'FEHL'));

  pruefe(4, 'vkProStueckOhneEinmaliges = G5 − P5 (Menge ' + menge + ')', a);
  pruefe(4, 'vkStueckanteil = F5 − P5 (Menge ' + menge + ')', b);
  pruefe(4, 'listenpreisProStueckOhneEinmaliges = E6 − P5 (Menge ' + menge + ')', c);
  pruefe(4, 'vkStueckanteil = Menge × Stueckpreis ohne Aufschlag (Menge ' + menge + ')', d,
    z(r.vkStueckanteil, 6) + ' gegen ' + z(menge * r.vkProStueckOhneEinmaliges, 6));
}

// Ohne Sonderfarbe sind die neuen Felder mit den alten identisch.
{
  const r = berechne({ breite: 115, laenge: 240, menge: 7 }, LOGOMATTE);
  pruefe(4, 'Ohne Sonderfarbe stimmen alte und neue Felder ueberein',
    r.vkProStueckOhneEinmaliges === r.vkProStueck &&
    r.vkStueckanteil === r.vkGesamt &&
    r.listenpreisProStueckOhneEinmaliges === r.listenpreisProStueck);
}

/* ==========================================================================
   TEIL 5 — Abgleich mit der Artikelstammdaten-Seite von matten.de
   ========================================================================== */

console.log('');
console.log('  TEIL 5 · Abgleich mit den in matten.de bereits gepflegten Werten');
console.log('           (Screenshot JP-Logomatte-Stammdaten.png, Artikel 6300201-Logomatte)');
console.log('');

{
  // matten.de fuehrt "Quadratmeterpreis Netto (Massanfertigung) = 105,49".
  // Das ist genau 1 qm zum Einkaufspreis mal Salesfactor Colortype 1.
  const einQm = berechne({ breite: 100, laenge: 100, menge: 1 }, LOGOMATTE);
  const qmPreis = runde(einQm.listenpreisProStueck, 2);
  console.log('  ' + li('Quadratmeterpreis Netto (Massanfertigung)', 46) +
    re('matten.de 105,49 €', 22) + re('Formel ' + z(qmPreis, 2) + ' €', 22) +
    '   ' + (qmPreis === 105.49 ? 'OK' : 'FEHL'));
  pruefe(5, 'Quadratmeterpreis netto 105,49 € stimmt mit der Formel ueberein',
    qmPreis === 105.49,
    '54,63 €/qm × Salesfactor 1,931 = ' + z(einQm.listenpreisProStueck, 5) + ' €');

  // matten.de fuehrt den Standardartikel 60 x 40 cm mit Preis 25,32 € netto
  // und Einkaufspreis 13,11 €. Beides muss die Formel treffen.
  const standard = berechne({ breite: 60, laenge: 40, menge: 1 }, LOGOMATTE);
  const vk = runde(standard.vkProStueck, 2);
  const ek = runde(standard.ekProStueck, 2);
  console.log('  ' + li('Standardgroesse 60 x 40 cm, Preis netto', 46) +
    re('matten.de 25,32 €', 22) + re('Formel ' + z(vk, 2) + ' €', 22) +
    '   ' + (vk === 25.32 ? 'OK' : 'FEHL'));
  console.log('  ' + li('Standardgroesse 60 x 40 cm, Einkaufspreis', 46) +
    re('matten.de 13,11 €', 22) + re('Formel ' + z(ek, 2) + ' €', 22) +
    '   ' + (ek === 13.11 ? 'OK' : 'FEHL'));
  pruefe(5, 'Standardgroesse 60 x 40: Verkaufspreis 25,32 € netto', vk === 25.32,
    '0,24 qm × 105,49053 €/qm = ' + z(standard.vkProStueck, 5) + ' €');
  pruefe(5, 'Standardgroesse 60 x 40: Einkaufspreis 13,11 €', ek === 13.11,
    '0,24 qm × 54,63 €/qm = ' + z(standard.ekProStueck, 5) + ' €');

  // Bruttopreis 30,13 € = 25,32 € zuzueglich 19 % Umsatzsteuer.
  const brutto = runde(standard.vkProStueck * 1.19, 2);
  console.log('  ' + li('Standardgroesse 60 x 40 cm, Preis brutto', 46) +
    re('matten.de 30,13 €', 22) + re('Formel ' + z(brutto, 2) + ' €', 22) +
    '   ' + (brutto === 30.13 ? 'OK' : 'FEHL'));
  pruefe(5, 'Standardgroesse 60 x 40: Bruttopreis 30,13 €', brutto === 30.13,
    'netto ' + z(standard.vkProStueck, 4) + ' € × 1,19');

  // Maximal X = 700 cm ist in matten.de gepflegt und deckt sich mit C6.
  pruefe(5, 'Maximal X (700 cm) deckt sich mit der Mappe (C6)',
    LOGOMATTE.maxLaenge === 700);

  // Der Artikel-Datensatz ist eingefroren.
  let veraendert = false;
  try { LOGOMATTE.ekListenpreisProQm = 1; } catch (e) { /* strict mode wirft */ }
  veraendert = LOGOMATTE.ekListenpreisProQm !== 54.63;
  pruefe(5, 'Der Beispielartikel ist eingefroren', !veraendert,
    'ekListenpreisProQm = ' + LOGOMATTE.ekListenpreisProQm);
}

console.log('');
console.log('  Hinweis: matten.de fuehrt fuer diesen Artikel "Mindest X = 40" cm, die Mappe B6 = 30 cm.');
console.log('           Gerechnet wird mit 30 cm. Die Abweichung ist in STAMMDATEN.md als Rueckfrage vermerkt.');

/* ==========================================================================
   Bilanz
   ========================================================================== */

const proTeil = {};
for (const r of ergebnisse) {
  proTeil[r.teil] = proTeil[r.teil] || { ok: 0, gesamt: 0 };
  proTeil[r.teil].gesamt++;
  if (r.ok) proTeil[r.teil].ok++;
}
const fehlgeschlagen = ergebnisse.filter((r) => !r.ok);

console.log('');
console.log('='.repeat(120));
console.log('  BILANZ');
console.log('  ' + linie(70));
const TITEL = {
  1: 'Alte gegen neue Aufrufform',
  2: 'Zweiter Artikel mit anderen Stammdaten',
  3: 'Unvollstaendige und unplausible Stammdaten',
  4: 'Werte ohne den einmaligen Aufschlag',
  5: 'Abgleich mit matten.de'
};
for (const t of Object.keys(proTeil).sort()) {
  console.log('  Teil ' + t + ' · ' + li(TITEL[t], 46) +
    re(proTeil[t].ok + ' von ' + proTeil[t].gesamt, 12) + ' bestanden');
}
console.log('  ' + linie(70));
console.log('  ' + li('Summe', 55) + re(ergebnisse.length - fehlgeschlagen.length + ' von ' + ergebnisse.length, 12) + ' bestanden');
console.log('  ' + linie(70));

if (fehlgeschlagen.length) {
  console.log('');
  console.log('  NICHT BESTANDEN');
  for (const r of fehlgeschlagen) {
    console.log('   · Teil ' + r.teil + ' · ' + r.name + (r.erlaeuterung ? '  —  ' + r.erlaeuterung : ''));
  }
  console.log('');
  console.log('  ERGEBNIS: ' + fehlgeschlagen.length + ' Pruefung(en) fehlgeschlagen.');
  console.log('='.repeat(120));
  process.exitCode = 1;
} else {
  console.log('  ERGEBNIS: Die Stammdaten-Fassung rechnet fuer denselben Artikel unveraendert und');
  console.log('            fuer einen anderen Artikel nachvollziehbar anders. Unvollstaendige');
  console.log('            Stammdaten fuehren zu einer klaren Meldung, nicht zu einem falschen Preis.');
  console.log('='.repeat(120));
}
console.log('');
