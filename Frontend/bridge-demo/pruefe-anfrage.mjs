/**
 * pruefe-anfrage.mjs
 * ============================================================================
 * Prueft den Anfrage-Weg der Bruecke -- ohne Netz, gegen rohe Seiten des
 * Altsystems unter fixtures/ (siehe fixtures/LIESMICH.md).
 *
 *     node pruefe-anfrage.mjs
 *
 * Keine npm-Pakete. Node ab Version 20.
 *
 * Hintergrund: Das Altsystem schliesst einen Korb aus Anfrageartikeln auf
 * /bestellen nicht mit `bestellung_abschicken` ab, sondern mit
 * `anfrage_abschicken` ("Anfrage abschicken") -- ohne Zahlungsart und ohne
 * Summen. Die Bruecke kannte nur den Kauf-Knopf und meldete darum "kein
 * Absende-Knopf" und "Unbekannte Zahlungsart" (fixtures/vorschau-anfrage.json
 * zeigt diese alte, falsche Antwort).
 *
 *   TEIL 1  Parser der Uebersichtsseite /bestellen: Anfragenkorb, Kauf-
 *           Warenkorb, gemischter Korb, Sonderfaelle ohne oder mit zwei Knoepfen.
 *   TEIL 2  Parser der Warenkorbseite: Betriebsart je Position und je Korb,
 *           Zahlungsart als verstecktes Feld, leere Optionslisten.
 *   TEIL 3  Die Huerden-Regeln (ermittleHuerden) und das Absende-Feld
 *           (absendeFeld): Anfrage ohne Zahlungsart ist bereit, Ogone sperrt
 *           immer, Kauf ohne Zahlungsart nie, ohne Knopf nie.
 *   TEIL 4  Die Sperren der Endpunkte: ogoneSperre(), JA-BESTELLEN,
 *           der Body des finalen Formulars.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ABSENDE_FELDER, ANFRAGE_FELD, ANFRAGE_WERT, BESTELL_BESTAETIGUNG, BESTELL_FELD, BESTELL_WERT,
  absendeFeld, buildForm, ermittleHuerden, gefuehrteZahlungsarten, istAufAnfrage, korbModus,
  ogoneSperre, parseCart, parseKasseOptionen, parseKontoMenue, parseUebersicht, pruefeZahlungsart,
} from './lib/bruecke.mjs';

/* ---------------------------------------------------------------- Helfer */

const HIER = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HIER, 'fixtures');

function lies(name) {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

function li(s, n) { s = String(s); return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); }
function re(s, n) { s = String(s); return s.length >= n ? s.slice(0, n) : ' '.repeat(n - s.length) + s; }
function linie(n) { return '─'.repeat(n); }

const ergebnisse = [];
function pruefe(teil, name, bedingung, erlaeuterung) {
  ergebnisse.push({ teil, name, ok: !!bedingung, erlaeuterung: erlaeuterung || '' });
}

/** Baut den "Stand" (Warenkorb + Optionen), wie readCartMitOptionen() ihn liefert. */
function standAus(cartHtml) {
  return {
    cart: parseCart(cartHtml),
    optionen: parseKasseOptionen(cartHtml),
    konto: parseKontoMenue(cartHtml),
    logs: [],
  };
}

/** Derselbe Stand, nur mit anderer Zahlungsart-Lage. */
function mitZahlungsart(stand, { gewaehlt = null, versteckt = null } = {}) {
  return {
    ...stand,
    optionen: {
      ...stand.optionen,
      zahlungsart: { ...stand.optionen.zahlungsart, gewaehlt, versteckt },
    },
  };
}

const ANFRAGE_BEST = lies('bestellen-raw-anfrage.html');
const ANFRAGE_CART = lies('cart-raw-anfrage.html');
const KAUF_BEST = lies('bestellen-raw-kauf.html');
const KAUF_CART = lies('cart-raw-kauf.html');
const GEMISCHT_BEST = lies('bestellen-raw-gemischt.html');
const GEMISCHT_CART = lies('cart-raw-gemischt.html');

/* ==========================================================================
   TEIL 1  Parser der Uebersichtsseite /bestellen
   ========================================================================== */

{
  const u = parseUebersicht(ANFRAGE_BEST);
  pruefe(1, 'Anfrage: Ueberschrift "Anfragenkorb"', u.korb === 'Anfragenkorb', `korb=${u.korb}`);
  pruefe(1, 'Anfrage: art = anfrage', u.art === 'anfrage', `art=${u.art}`);
  pruefe(1, 'Anfrage: Absende-Knopf erkannt', u.absendeknopf === true);
  pruefe(1, 'Anfrage: Feldname anfrage_abschicken', u.absendeknopfName === ANFRAGE_FELD, u.absendeknopfName);
  pruefe(1, 'Anfrage: Beschriftung woertlich "Anfrage abschicken"', u.absendeknopfText === 'Anfrage abschicken', u.absendeknopfText);
  pruefe(1, 'Anfrage: genau ein Knopf', u.absendeknoepfe.length === 1, `${u.absendeknoepfe.length} Knoepfe`);
  pruefe(1, 'Anfrage: eine Position gelesen (trotz fehlendem Namen)', u.items.length === 1, `${u.items.length} Positionen`);
  const p = u.items[0] || {};
  pruefe(1, 'Anfrage: Position ohne Namen -> name null', p.name === null, String(p.name));
  pruefe(1, 'Anfrage: Menge 2', p.anzahl === 2, `anzahl=${p.anzahl}`);
  pruefe(1, 'Anfrage: Preis bleibt Zeichenkette "auf Anfrage"', p.preis === 'auf Anfrage' && p.preisNum === null, `${p.preis} / ${p.preisNum}`);
  pruefe(1, 'Anfrage: Summe "auf Anfrage"', p.summe === 'auf Anfrage' && p.summeNum === null, `${p.summe} / ${p.summeNum}`);
  pruefe(1, 'Anfrage: Position ist modus anfrage', p.modus === 'anfrage', p.modus);
  pruefe(1, 'Anfrage: Attribute wie im Warenkorb mit " | " verbunden',
    typeof p.attribut === 'string' && p.attribut.includes('Mattengröße: 90cm × 120cm') && p.attribut.includes(' | Designfarbe: 639-kirschrot'),
    p.attribut);
  pruefe(1, 'Anfrage: beschreibung traegt den ganzen Zellentext', typeof p.beschreibung === 'string' && p.beschreibung.startsWith('- Ausführung:'), p.beschreibung);
  pruefe(1, 'Anfrage: keine Zahlungsart im Klartext', u.zahlungsartText === null, String(u.zahlungsartText));
  pruefe(1, 'Anfrage: keine Summen', u.zwischensumme === null && u.versand === null && u.gesamt === null && u.gesamtNum === null);
  pruefe(1, 'Anfrage: Lieferadresse gelesen', /Sehorz \(Bitte ignorieren\)/.test(u.adresseText || '') && /test-anfrage@example\.com/.test(u.adresseText || ''));
}

{
  const u = parseUebersicht(KAUF_BEST);
  pruefe(1, 'Kauf: Ueberschrift "Warenkorb"', u.korb === 'Warenkorb', `korb=${u.korb}`);
  pruefe(1, 'Kauf: art = bestellung', u.art === 'bestellung', `art=${u.art}`);
  pruefe(1, 'Kauf: Feldname bestellung_abschicken', u.absendeknopf === true && u.absendeknopfName === BESTELL_FELD, u.absendeknopfName);
  pruefe(1, 'Kauf: Beschriftung woertlich "Bestellung abschicken"', u.absendeknopfText === 'Bestellung abschicken', u.absendeknopfText);
  const p = u.items[0] || {};
  pruefe(1, 'Kauf: Position mit Namen', u.items.length === 1 && p.name === 'Art-Designs, Welcome-Holzdesign VIII', `${u.items.length} / ${p.name}`);
  pruefe(1, 'Kauf: Attribut unveraendert gelesen', p.attribut === 'Größe: : 50 cm x 75 cm', p.attribut);
  pruefe(1, 'Kauf: Preis 25,17 € als Text und Zahl', p.preis === '25,17 €' && p.preisNum === 25.17 && p.modus === 'kauf', `${p.preis} / ${p.preisNum} / ${p.modus}`);
  pruefe(1, 'Kauf: Summen gelesen', u.zwischensumme === '25,17 €' && u.versand === '0,00 €' && u.umsatzsteuer === '4,78 €' && u.gesamt === '29,95 €' && u.gesamtNum === 29.95,
    `${u.zwischensumme} / ${u.versand} / ${u.umsatzsteuer} / ${u.gesamt}`);
  pruefe(1, 'Kauf: Steuersatz 19', u.ustSatz === 19, String(u.ustSatz));
  pruefe(1, 'Kauf: Zahlungsart im Klartext "Rechnung"', u.zahlungsartText === 'Rechnung', String(u.zahlungsartText));
}

{
  const u = parseUebersicht(GEMISCHT_BEST);
  pruefe(1, 'Gemischt: wird zum Anfragenkorb (Ueberschrift)', u.korb === 'Anfragenkorb', `korb=${u.korb}`);
  pruefe(1, 'Gemischt: art = anfrage, Knopf anfrage_abschicken', u.art === 'anfrage' && u.absendeknopfName === ANFRAGE_FELD, `${u.art} / ${u.absendeknopfName}`);
  pruefe(1, 'Gemischt: kein Kauf-Knopf daneben', u.absendeknoepfe.every((k) => k.name !== BESTELL_FELD), JSON.stringify(u.absendeknoepfe));
  const modi = u.items.map((i) => i.modus).sort();
  pruefe(1, 'Gemischt: beide Positionen in der Tabelle', u.items.length === 2 && modi.join(',') === 'anfrage,kauf', `${u.items.length} / ${modi}`);
  const kauf = u.items.find((i) => i.modus === 'kauf') || {};
  pruefe(1, 'Gemischt: Kaufposition behaelt ihren Preis in der Tabelle', kauf.preis === '25,17 €', String(kauf.preis));
  pruefe(1, 'Gemischt: keine Summen, keine Zahlungsart', u.gesamt === null && u.zwischensumme === null && u.zahlungsartText === null);
}

{
  const leer = parseUebersicht('');
  pruefe(1, 'Leere Seite: art null, kein Knopf', leer.art === null && leer.absendeknopf === false && leer.items.length === 0);

  const ohne = parseUebersicht('<html><body><h4>Warenkorb</h4><table class=\'warenkorb table\'></table><form></form></body></html>');
  pruefe(1, 'Seite ohne Knopf: art null, absendeknopfText null', ohne.art === null && ohne.absendeknopf === false && ohne.absendeknopfText === null);

  const beide = parseUebersicht(
    "<form><input type='submit' name='anfrage_abschicken' value='Anfrage abschicken'>" +
    "<input type='submit' name='bestellung_abschicken' value='Bestellung abschicken'></form>"
  );
  pruefe(1, 'Beide Knoepfe (nie beobachtet): Kauf-Weg gewinnt -- der strengere', beide.art === 'bestellung' && beide.absendeknoepfe.length === 2, `${beide.art} / ${beide.absendeknoepfe.length}`);

  const entity = parseUebersicht("<input name='anfrage_abschicken' value='Anfrage &amp; Angebot' type='submit'>");
  pruefe(1, 'Beschriftung: Entities dekodiert, Attributreihenfolge egal', entity.absendeknopfText === 'Anfrage & Angebot', entity.absendeknopfText);

  const ohneWert = parseUebersicht("<input type='submit' name='bestellung_abschicken'>");
  pruefe(1, 'Knopf ohne value: Beschriftung aus der Tabelle', ohneWert.absendeknopfText === BESTELL_WERT, ohneWert.absendeknopfText);

  const fremd = parseUebersicht("<input type='submit' name='irgendwas_abschicken' value='Los'>");
  pruefe(1, 'Unbekanntes Feld zaehlt nicht als Knopf', fremd.art === null && fremd.absendeknopf === false);
}

/* ==========================================================================
   TEIL 2  Parser der Warenkorbseite
   ========================================================================== */

{
  const c = parseCart(ANFRAGE_CART);
  const o = parseKasseOptionen(ANFRAGE_CART);
  pruefe(2, 'Anfrage: eine Position, Schluessel des Altsystems',
    c.items.length === 1 && c.items[0].key === '5d7d30b98ca6bdf98901c45bb1933782e97e32a4', JSON.stringify(c.items.map((i) => i.key)));
  pruefe(2, 'Anfrage: Position modus anfrage, Preis "auf Anfrage"', c.items[0].modus === 'anfrage' && c.items[0].preis === 'auf Anfrage' && c.items[0].preisNum === null);
  pruefe(2, 'Anfrage: Korb modus anfrage', c.modus === 'anfrage', String(c.modus));
  pruefe(2, 'Anfrage: Kommentar utf-8 gelesen', c.items[0].kommentar === 'TEST Anfrage-Weg Sehorz - bitte ignorieren', String(c.items[0].kommentar));
  pruefe(2, 'Anfrage: Zahlungsart-Optionen leer, nichts abgelehnt, nichts gewaehlt',
    Array.isArray(o.zahlungsart.optionen) && o.zahlungsart.optionen.length === 0 && o.zahlungsart.abgelehnt.length === 0 && o.zahlungsart.gewaehlt === null,
    JSON.stringify(o.zahlungsart));
  pruefe(2, 'Anfrage: verstecktes Feld zahlungsart=RechnungPayment erkannt', o.zahlungsart.versteckt === 'RechnungPayment', String(o.zahlungsart.versteckt));
  pruefe(2, 'Anfrage: Versandart bleibt waehlbar (4 Optionen, DHL vorgewaehlt)',
    o.versandart.optionen.length === 4 && o.versandart.gewaehlt === '7', JSON.stringify(o.versandart));
  pruefe(2, 'Anfrage: Land de vorgewaehlt', o.land.gewaehlt === 'de', String(o.land.gewaehlt));
  pruefe(2, 'Anfrage: gefuehrteZahlungsarten = [RechnungPayment]', JSON.stringify(gefuehrteZahlungsarten(o)) === '["RechnungPayment"]', JSON.stringify(gefuehrteZahlungsarten(o)));
}

{
  const c = parseCart(KAUF_CART);
  const o = parseKasseOptionen(KAUF_CART);
  pruefe(2, 'Kauf: Korb modus kauf', c.modus === 'kauf' && c.items.length === 1 && c.items[0].modus === 'kauf', `${c.modus} / ${c.items.length}`);
  pruefe(2, 'Kauf: zwei erlaubte Zahlungsarten (Vorkasse, Rechnung)',
    o.zahlungsart.optionen.map((z) => z.wert).join(',') === 'VorkassePayment,RechnungPayment', JSON.stringify(o.zahlungsart.optionen.map((z) => z.wert)));
  pruefe(2, 'Kauf: Ogone-Wege gelesen, aber abgelehnt',
    o.zahlungsart.abgelehnt.map((z) => z.wert).sort().join(',') === 'OgoneCcPayment,OgonePpPayment', JSON.stringify(o.zahlungsart.abgelehnt));
  pruefe(2, 'Kauf: RechnungPayment angehakt, kein verstecktes Feld', o.zahlungsart.gewaehlt === 'RechnungPayment' && o.zahlungsart.versteckt === null,
    `${o.zahlungsart.gewaehlt} / ${o.zahlungsart.versteckt}`);
}

{
  const c = parseCart(GEMISCHT_CART);
  const o = parseKasseOptionen(GEMISCHT_CART);
  pruefe(2, 'Gemischt: Korb modus gemischt, zwei Positionen', c.modus === 'gemischt' && c.items.length === 2 && c.count === 2, `${c.modus} / ${c.items.length} / ${c.count}`);
  pruefe(2, 'Gemischt: keine Zahlungsart-Radios, verstecktes RechnungPayment',
    o.zahlungsart.optionen.length === 0 && o.zahlungsart.gewaehlt === null && o.zahlungsart.versteckt === 'RechnungPayment', JSON.stringify(o.zahlungsart));
}

{
  pruefe(2, 'istAufAnfrage: "auf Anfrage" ja', istAufAnfrage('auf Anfrage') === true);
  pruefe(2, 'istAufAnfrage: "0,00 €" nein (Kaufartikel zu 0 bleibt Kauf)', istAufAnfrage('0,00 €') === false);
  pruefe(2, 'istAufAnfrage: null/leer nein', istAufAnfrage(null) === false && istAufAnfrage('') === false);
  pruefe(2, 'korbModus: leer -> null', korbModus([]) === null);
  pruefe(2, 'korbModus: nur kauf -> kauf', korbModus([{ modus: 'kauf' }, { modus: 'kauf' }]) === 'kauf');
  pruefe(2, 'korbModus: kauf + anfrage -> gemischt', korbModus([{ modus: 'kauf' }, { modus: 'anfrage' }]) === 'gemischt');
  const leer = parseCart('<html><body>Warenkorb (0)</body></html>');
  pruefe(2, 'Leerer Warenkorb: modus null, leer true', leer.modus === null && leer.leer === true && leer.count === 0);
  const ohneFormular = parseKasseOptionen('<html><body>nichts</body></html>');
  pruefe(2, 'Ohne Optionsformular: leere Listen, kein Fehler',
    ohneFormular.zahlungsart.optionen.length === 0 && ohneFormular.versandart.optionen.length === 0 && ohneFormular.land.optionen.length === 0 &&
    ohneFormular.zahlungsart.gewaehlt === null && ohneFormular.zahlungsart.versteckt === null);
}

/* ==========================================================================
   TEIL 3  Huerden und Absende-Feld
   ========================================================================== */

const OGONE_TEXT = /Worldline\/Ogone/;
const UNBEKANNT_TEXT = /^Unbekannte Zahlungsart/;
const KEIN_KNOPF_TEXT = /kein Absende-Knopf/;

{
  const stand = standAus(ANFRAGE_CART);
  const u = parseUebersicht(ANFRAGE_BEST);

  const r = ermittleHuerden({ stand, uebersicht: u, umleitung: null });
  pruefe(3, 'Anfrage (Beleg): keine Huerden, art anfrage', r.huerden.length === 0 && r.art === 'anfrage', JSON.stringify(r));
  pruefe(3, 'Anfrage (Beleg): gefuehrte Zahlungsart ist das versteckte RechnungPayment', r.zahlungsart === 'RechnungPayment', String(r.zahlungsart));

  const ohne = ermittleHuerden({ stand: mitZahlungsart(stand), uebersicht: u, umleitung: null });
  pruefe(3, 'Anfrage ohne jede Zahlungsart: keine Huerde (Altsystem bietet keine an)', ohne.huerden.length === 0, JSON.stringify(ohne.huerden));

  const ogonePp = ermittleHuerden({ stand: mitZahlungsart(stand, { versteckt: 'OgonePpPayment' }), uebersicht: u, umleitung: null });
  pruefe(3, 'Anfrage mit verstecktem OgonePpPayment: gesperrt', ogonePp.huerden.length === 1 && OGONE_TEXT.test(ogonePp.huerden[0]), JSON.stringify(ogonePp.huerden));

  const ogoneCc = ermittleHuerden({ stand: mitZahlungsart(stand, { gewaehlt: 'OgoneCcPayment' }), uebersicht: u, umleitung: null });
  pruefe(3, 'Anfrage mit angehaktem OgoneCcPayment: gesperrt', ogoneCc.huerden.length === 1 && OGONE_TEXT.test(ogoneCc.huerden[0]), JSON.stringify(ogoneCc.huerden));

  const fremd = ermittleHuerden({ stand: mitZahlungsart(stand, { versteckt: 'FooPayment' }), uebersicht: u, umleitung: null });
  pruefe(3, 'Anfrage mit unbekannter versteckter Zahlungsart: Allowlist greift', fremd.huerden.length === 1 && /"FooPayment"/.test(fremd.huerden[0]), JSON.stringify(fremd.huerden));

  const beideOgone = ermittleHuerden({ stand: mitZahlungsart(stand, { gewaehlt: 'OgonePpPayment', versteckt: 'OgoneCcPayment' }), uebersicht: u, umleitung: null });
  pruefe(3, 'Radio UND verstecktes Feld Ogone: beide gemeldet', beideOgone.huerden.length === 2 && beideOgone.huerden.every((h) => OGONE_TEXT.test(h)), JSON.stringify(beideOgone.huerden));

  const array = ermittleHuerden({ stand: mitZahlungsart(stand, { versteckt: ['RechnungPayment'] }), uebersicht: u, umleitung: null });
  pruefe(3, 'Nicht-String als Zahlungsart wird abgelehnt (fail-closed, keine Koerzierung)', array.huerden.length === 1 && UNBEKANNT_TEXT.test(array.huerden[0]), JSON.stringify(array.huerden));

  const feld = absendeFeld(u);
  pruefe(3, 'Anfrage: Absende-Feld = anfrage_abschicken / "Anfrage abschicken"',
    feld && feld.name === ANFRAGE_FELD && feld.wert === 'Anfrage abschicken', JSON.stringify(feld));
  pruefe(3, 'Anfrage: Body des finalen Formulars', buildForm([[feld.name, feld.wert]]) === 'anfrage_abschicken=Anfrage+abschicken', buildForm([[feld.name, feld.wert]]));

  const keinKnopf = ermittleHuerden({ stand, uebersicht: { ...u, art: null, absendeknopf: false, absendeknopfName: null, absendeknopfText: null }, umleitung: null });
  pruefe(3, 'Kein Knopf (art null): Huerde "kein Absende-Knopf", nie bereit', keinKnopf.art === null && keinKnopf.huerden.some((h) => KEIN_KNOPF_TEXT.test(h)), JSON.stringify(keinKnopf.huerden));
  pruefe(3, 'Kein Knopf: absendeFeld liefert null -- nichts wird erfunden', absendeFeld({ ...u, absendeknopf: false, absendeknopfName: null }) === null);

  const umleitung = ermittleHuerden({ stand: mitZahlungsart(stand), uebersicht: null, umleitung: '/adresse' });
  pruefe(3, 'Umleitung auf /adresse: Huerde nennt das Ziel, art null',
    umleitung.art === null && umleitung.huerden.some((h) => h.includes('/adresse')), JSON.stringify(umleitung.huerden));
  pruefe(3, 'Umleitung ohne Zahlungsart: Zahlungsart-Huerde wie bisher (Art unbekannt)', umleitung.huerden.some((h) => UNBEKANNT_TEXT.test(h)), JSON.stringify(umleitung.huerden));

  const leer = ermittleHuerden({ stand: { ...stand, cart: { ...stand.cart, items: [] } }, uebersicht: u, umleitung: null });
  pruefe(3, 'Leerer Warenkorb: Huerde', leer.huerden.some((h) => /Warenkorb ist leer/.test(h)), JSON.stringify(leer.huerden));
}

{
  const stand = standAus(KAUF_CART);
  const u = parseUebersicht(KAUF_BEST);

  const r = ermittleHuerden({ stand, uebersicht: u, umleitung: null });
  pruefe(3, 'Kauf (Beleg): keine Huerden, art bestellung, RechnungPayment', r.huerden.length === 0 && r.art === 'bestellung' && r.zahlungsart === 'RechnungPayment', JSON.stringify(r));

  const ohne = ermittleHuerden({ stand: mitZahlungsart(stand), uebersicht: u, umleitung: null });
  pruefe(3, 'Kauf ohne Zahlungsart: "Unbekannte Zahlungsart" -- unveraendert Pflicht', ohne.huerden.length === 1 && UNBEKANNT_TEXT.test(ohne.huerden[0]), JSON.stringify(ohne.huerden));

  const ogone = ermittleHuerden({ stand: mitZahlungsart(stand, { gewaehlt: 'OgonePpPayment' }), uebersicht: u, umleitung: null });
  pruefe(3, 'Kauf mit OgonePpPayment: gesperrt', ogone.huerden.length === 1 && OGONE_TEXT.test(ogone.huerden[0]), JSON.stringify(ogone.huerden));

  const klartext = ermittleHuerden({ stand, uebersicht: { ...u, zahlungsartText: 'Paypal' }, umleitung: null });
  pruefe(3, 'Kauf: Klartext "Paypal" auf /bestellen sperrt trotz erlaubtem Radio (zweite Quelle)',
    klartext.huerden.length === 1 && /Paypal/.test(klartext.huerden[0]), JSON.stringify(klartext.huerden));

  const vorkasse = ermittleHuerden({ stand: mitZahlungsart(stand, { gewaehlt: 'VorkassePayment' }), uebersicht: u, umleitung: null });
  pruefe(3, 'Kauf mit VorkassePayment: bereit', vorkasse.huerden.length === 0, JSON.stringify(vorkasse.huerden));

  const feld = absendeFeld(u);
  pruefe(3, 'Kauf: Absende-Feld = bestellung_abschicken / "Bestellung abschicken"',
    feld && feld.name === BESTELL_FELD && feld.wert === BESTELL_WERT, JSON.stringify(feld));
  pruefe(3, 'Kauf: Body des finalen Formulars unveraendert', buildForm([[feld.name, feld.wert]]) === 'bestellung_abschicken=Bestellung+abschicken');
}

{
  const stand = standAus(GEMISCHT_CART);
  const u = parseUebersicht(GEMISCHT_BEST);
  const r = ermittleHuerden({ stand, uebersicht: u, umleitung: null });
  const feld = absendeFeld(u);
  pruefe(3, 'Gemischt (Beleg): bereit als Anfrage, Knopf anfrage_abschicken',
    r.huerden.length === 0 && r.art === 'anfrage' && feld && feld.name === ANFRAGE_FELD, JSON.stringify({ r, feld }));
  pruefe(3, 'Gemischt: Warenkorb-modus gemischt, Uebersicht-Korb Anfragenkorb', stand.cart.modus === 'gemischt' && u.korb === 'Anfragenkorb');
}

/* ==========================================================================
   TEIL 4  Sperren der Endpunkte
   ========================================================================== */

{
  pruefe(4, 'ogoneSperre: RechnungPayment angehakt -> frei', ogoneSperre({ zahlungsart: { gewaehlt: 'RechnungPayment', versteckt: null } }) === null);
  pruefe(4, 'ogoneSperre: nichts gefuehrt (Anfragenkorb) -> frei; Pflicht entscheidet ermittleHuerden', ogoneSperre({ zahlungsart: { gewaehlt: null, versteckt: null } }) === null);
  pruefe(4, 'ogoneSperre: verstecktes OgoneCcPayment -> gesperrt', OGONE_TEXT.test(ogoneSperre({ zahlungsart: { gewaehlt: null, versteckt: 'OgoneCcPayment' } }) || ''));
  pruefe(4, 'ogoneSperre: angehaktes OgonePpPayment -> gesperrt', OGONE_TEXT.test(ogoneSperre({ zahlungsart: { gewaehlt: 'OgonePpPayment', versteckt: null } }) || ''));
  pruefe(4, 'ogoneSperre: unbekannter Wert ist NICHT Ogone -> hier frei (Allowlist greift spaeter)', ogoneSperre({ zahlungsart: { gewaehlt: 'FooPayment' } }) === null);
  pruefe(4, 'ogoneSperre: ohne Optionen -> frei statt Absturz', ogoneSperre(null) === null && ogoneSperre({}) === null);
  pruefe(4, 'pruefeZahlungsart: Array wird nicht koerziert', UNBEKANNT_TEXT.test(pruefeZahlungsart(['RechnungPayment']) || ''));
  pruefe(4, 'JA-BESTELLEN bleibt der einzige Freigabewert', BESTELL_BESTAETIGUNG === 'JA-BESTELLEN');
  pruefe(4, 'Genau zwei bekannte Absende-Felder', ABSENDE_FELDER.size === 2 && ABSENDE_FELDER.get(ANFRAGE_FELD).wert === ANFRAGE_WERT && ABSENDE_FELDER.get(BESTELL_FELD).wert === BESTELL_WERT);
}

{
  // Die alte, falsche Antwort als Beleg fuer den Fehler, der hier behoben ist.
  const alt = JSON.parse(lies('vorschau-anfrage.json'));
  pruefe(4, 'Beleg: alte Vorschau-Antwort meldete 2 Huerden und keine Positionen',
    alt.bereit === false && alt.huerden.length === 2 && alt.uebersicht.items.length === 0 && alt.art === undefined, JSON.stringify(alt.huerden));
  const neu = JSON.parse(lies('vorschau-anfrage-neu.json'));
  pruefe(4, 'Beleg: neue Vorschau-Antwort (Live-Gegenprobe) ist bereit, art anfrage, Knopf woertlich',
    neu.bereit === true && neu.art === 'anfrage' && neu.huerden.length === 0 && neu.uebersicht.absendeknopfText === 'Anfrage abschicken' &&
    neu.uebersicht.items.length === 1 && neu.finalRequest.felder[0].name === ANFRAGE_FELD, JSON.stringify({ bereit: neu.bereit, art: neu.art, huerden: neu.huerden }));
  const gem = JSON.parse(lies('vorschau-gemischt.json'));
  pruefe(4, 'Beleg: gemischter Korb in der Live-Gegenprobe = Anfragenkorb',
    gem.art === 'anfrage' && gem.warenkorb.modus === 'gemischt' && gem.uebersicht.korb === 'Anfragenkorb' && gem.uebersicht.items.length === 2, JSON.stringify({ art: gem.art, modus: gem.warenkorb.modus }));
}

/* ==========================================================================
   Ausgabe
   ========================================================================== */

const TEILE = {
  1: 'Parser /bestellen (Anfrage, Kauf, gemischt, Sonderfaelle)',
  2: 'Parser /warenkorb (Betriebsart, verstecktes Feld, leere Listen)',
  3: 'Huerden-Regeln und Absende-Feld',
  4: 'Sperren der Endpunkte und Belege',
};

console.log('');
console.log('  pruefe-anfrage.mjs -- Anfrage-Weg der Bruecke gegen fixtures/');
console.log('  ' + linie(70));

const fehlgeschlagen = ergebnisse.filter((e) => !e.ok);
for (const e of fehlgeschlagen) {
  console.log('  FEHLER  Teil ' + e.teil + '  ' + e.name);
  if (e.erlaeuterung) console.log('          ' + e.erlaeuterung);
}
if (fehlgeschlagen.length) console.log('  ' + linie(70));

const proTeil = {};
for (const e of ergebnisse) {
  proTeil[e.teil] = proTeil[e.teil] || { ok: 0, gesamt: 0 };
  proTeil[e.teil].gesamt += 1;
  if (e.ok) proTeil[e.teil].ok += 1;
}
for (const t of Object.keys(proTeil)) {
  console.log('  ' + li('Teil ' + t + '  ' + TEILE[t], 55) + re(proTeil[t].ok + ' von ' + proTeil[t].gesamt, 12) + ' bestanden');
}
console.log('  ' + linie(70));
console.log('  ' + li('Summe', 55) + re(ergebnisse.length - fehlgeschlagen.length + ' von ' + ergebnisse.length, 12) + ' bestanden');
console.log('');

if (fehlgeschlagen.length) {
  console.log('  Es gibt Abweichungen. Bitte die Zeilen oben pruefen.');
  console.log('');
  process.exitCode = 1;
} else {
  console.log('  Alle Pruefungen bestanden. Der Anfrage-Weg wird erkannt, die Sperren bleiben.');
  console.log('');
}
