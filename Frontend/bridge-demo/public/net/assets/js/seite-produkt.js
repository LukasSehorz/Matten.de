/* ==========================================================================
   seite-produkt.js — Artikel- und Konfiguratorseite (net/produkt.html)
   --------------------------------------------------------------------------
   Adresse:  produkt.html?pfad=<echter matten.de-Pfad>

   WARUM DIESE SEITE NEU GEBAUT WURDE
   ----------------------------------
   Der Kunde hat den ersten Entwurf abgelehnt. Seine Kritik, sinngemaess:

     · "Der Kunde muss viel zu viele Fragen beantworten und einige indirekt
        mehrfach, von denen er eigentlich gar nichts wissen will."
     · "Der hat nur sein Wunschmass im Kopf. Welche Groesse wir realisieren
        koennen, ob das Sondergroesse oder Standardgroesse ist, weiss der
        Kunde nicht. Deswegen muss er das nicht eingeben, sondern es muss ihm
        gezeigt werden."
     · "Alles was zu viel und zu unuebersichtlich ist, muss vermieden werden."
     · Das System von matten.net ist die Basis; nur die Optik wird moderner.

   Daraus folgen vier Bauentscheidungen:

     A. Die Standardgroessen stehen als SICHTBARE LISTE mit Mass UND Preis
        da (matten.net loest das als <select id="input_fixed_size"> mit
        data-price je <option> — dieselbe Information, nur zugeklappt).
        Direkt daran anschliessend, nicht am Seitenende, steht der Weg zum
        Wunschmass.

     B. Ein Wunschmass wird live gegen die Grenzen des Artikels geprueft.
        Die Meldung sagt, WAS ZU TUN IST — nicht nur, dass etwas falsch ist.

     C. Gefragt wird nur noch: Farbe · Groesse · Menge · optional Sonderform
        und Sonderfarbe. Der COLORTYPE (Excel F2) ist ein ARTIKELSTAMMDATUM
        und wird NICHT abgefragt. Genauso wenig Salesfactor, EK/qm,
        Standardmasse und Rabattstaffel.

     D. Die grosse Zahl ist der BRUTTOENDPREIS inklusive Mehrwertsteuer und
        inklusive Versandkosten. Netto, MwSt und Versand stehen darunter
        nachvollziehbar aufgeschluesselt.

   WO DIE ZAHLEN HERKOMMEN
   -----------------------
     Artikeldaten, Bilder, Farben, Groessen, Grenzen   GET /api/produkt
     Preis                                            berechne() aus
                                                      /preisformel.js
     Warenkorb / Angebot                              POST /api/cart/add

   ES WIRD NIRGENDS SELBST GERECHNET AUSSER UEBER berechne(). Die einzige
   Ausnahme ist die Funktion mitSteuerUndVersand() weiter unten: die
   Kalkulationstabelle des Hauses kennt weder Umsatzsteuer noch Versand,
   beides steht ueberhaupt nicht in der Mappe. Diese eine Stelle ist als
   solche gekennzeichnet und benutzt zum Runden die Helfer des geprueften
   Moduls.

   BILDER
   ------
   Der Farbwechsel aendert das Produktbild — matten.net macht das ueber
   data-attribute-image-url, hier ueber die Bildliste des Altsystems: das
   Bild, dessen Dateiname den Farbwert enthaelt ("JP-613-koenigsblau_0.JPG"
   fuer "613-koenigsblau"). Alle Bilder laufen ueber /api/img/.

   AUFBAU DER DATEI
   ----------------
     1  Artikelstammdaten (und was davon noch fehlt)
     2  Rechnen
     3  Lesen der Artikeldaten
     4  Markup
     5  Bedienung
     6  Preisanzeige
     7  Warenkorb und Angebot
     8  Beiwerk (Brotkrumen, Reiter, weitere Artikel)
     9  Start

   Die Bausteine 1–3 werden auch vom Mattendesigner benutzt und sind
   deshalb exportiert.
   ========================================================================== */

import {
  berechne, runde, euro, zahl,
  STAMMDATEN_VORGABE, ARTIKEL, stammdatenFuer as stammsatzAus,
  pruefeStammdaten, rollenbreiteFuer
} from '/preisformel.js';

/* ==========================================================================
   1  ARTIKELSTAMMDATEN
   --------------------------------------------------------------------------
   preisformel.js fuehrt seit der Stammdaten-Fassung alle Werte, mit denen die
   Kalkulation je Artikel arbeitet: Colortype (F2), Salesfactoren (F1/I1/L1),
   EK-Listenpreis pro qm (Q5), Teuerungszuschlag (R2), Mindest- und
   Groesstmass (B6/C6), Standardbreiten (Q7:V7), Mengenstaffel (Q6:V6 /
   R5:V5) und die Zuschlaege. STAMMDATEN_VORGABE ist der gepruefte
   Vorgabesatz, ARTIKEL enthaelt die bereits erfassten Artikel.

   Diese Datei stellt daraus den Satz FUER DEN GERADE GEZEIGTEN ARTIKEL
   zusammen und nimmt dabei alles mit, was das Altsystem ueber /api/produkt
   schon liefert:

     masse[…].min / .max      -> minBreite, maxLaenge   (Kaufformular)
     spezialoption[…][x]      -> standardbreiten        (Bahnbreiten)
     preis.ustSatz            -> Umsatzsteuersatz
     preis.versand            -> Versandkosten

   WAS NOCH FEHLT — und deshalb hier fest hinterlegt ist:

     · der COLORTYPE (F2). Er hat in matten.de kein Feld (STAMMDATEN.md,
       Abschnitt 3, Zeile 1: "mattenDe: fehlt"). Bekannte Artikel stehen in
       JE_ARTIKEL, sonst greift eine Namensregel, sonst der Vorgabewert.
     · der EK-Listenpreis (Q5) fuer Artikel, die nicht in ARTIKEL stehen.
     · die Farbwerte der Palette (siehe FARBWERTE weiter unten).
     · Umsatzsteuersatz und Versand bei Anfrageartikeln — dort nennt das
       Altsystem beides nicht.

   JEDER so gesetzte Wert traegt seine Herkunft im Feld "quelle" und wird im
   Reiter "Artikeldaten" offen ausgewiesen. Sobald matten.de die Felder aus
   STAMMDATEN.md fuehrt, faellt JE_ARTIKEL ersatzlos weg.
   ========================================================================== */

/**
 * Werte, die weder in der Kalkulationstabelle noch in den Artikeldaten des
 * Altsystems stehen. Beide gelten so auf den Artikelseiten von matten.de.
 * TODO Artikelstammdaten: gehoeren je Artikel gepflegt.
 */
export const VORGABE = Object.freeze({
  ustSatz: 19,             // gesetzlicher Regelsatz, so auch bei matten.de
  versandBrutto: 11.90     // Versand nach Deutschland, brutto, laut matten.de
});

/**
 * Artikelnummer des Altsystems -> Teilsatz von Stammdaten.
 * Der Schluessel wird kleingeschrieben und ohne die Variantenendung "-a"
 * verglichen; matten.de fuehrt dieselbe Matte als "6300201-logomatte" und
 * "6300201-logomatte-a".
 * TODO Artikelstammdaten: ersetzt die fehlende Schnittstelle.
 */
const JE_ARTIKEL = Object.freeze({
  /* Aus preisformel.js — vom Kunden bestaetigte Stammdaten. */
  '6300201-logomatte': ARTIKEL['6300201-Logomatte'],
  /* Nur der Colortype ist gesichert; alles andere bleibt Vorgabe. */
  '6300000':  { colortype: 2 },   // JetPrint HD-Fussmatten, einfarbig
  '6320303':  { colortype: 1 },   // JetPrint-Vision, individuell gestaltet
  '64000121': { colortype: 2 },   // IRON-HORSE, meliert einfarbig
  '64000122': { colortype: 2 }
});

/** Sucht den Stammsatz zu einer Artikelnummer des Altsystems. */
function jeArtikel(nummer) {
  const s = String(nummer || '').trim().toLowerCase();
  if (!s) return null;
  return JE_ARTIKEL[s] || JE_ARTIKEL[s.replace(/-a$/, '')] || null;
}

/** Namensregel — nur fuer den Colortype, und nur als Notbehelf. */
function colortypeAusName(name) {
  const s = String(name || '').toLowerCase();
  if (/ped-?print/.test(s))                        return { wert: 3, quelle: 'Namensregel (vorlaeufig)' };
  if (/einfarbig|1-farbig|einfarb|monoton/.test(s)) return { wert: 2, quelle: 'Namensregel (vorlaeufig)' };
  if (/mehrfarbig|logo|vision|jetprint|design/.test(s)) return { wert: 1, quelle: 'Namensregel (vorlaeufig)' };
  return { wert: STAMMDATEN_VORGABE.colortype, quelle: 'Vorgabewert der Mappe (F2)' };
}

/**
 * Farbwerte der JetPrint-Palette. Der Kunde waehlt "613-koenigsblau"; das
 * Farbfeld braucht dazu einen Farbwert. Das Altsystem liefert keinen — die
 * Palette ist dieselbe wie bei matten.net und hier als Stammdatum abgelegt.
 * TODO Artikelstammdaten: gehoert in die Farbtabelle der Artikelanlage.
 * Barrierefreiheit: der Farbname steht IMMER auch als Text am Feld, die
 * Farbe allein traegt nie die Information.
 */
export const FARBWERTE = Object.freeze({
  '600': '#ffffff', '601': '#fffe28', '602': '#fdd302', '603': '#ff9a02',
  '604': '#f56703', '605': '#c02832', '606': '#980000', '607': '#ab0065',
  '608': '#fdade2', '609': '#9900c1', '610': '#c099d2', '611': '#66019b',
  '612': '#bfacfd', '613': '#0051ba', '614': '#97acff', '615': '#00c1c1',
  '616': '#aef2f1', '617': '#019982', '618': '#7fd3bb', '619': '#087701',
  '620': '#14b004', '621': '#500c1b', '622': '#e2d2d3', '623': '#162053',
  '624': '#81aecf', '625': '#9f2f2e', '626': '#ffd2c0', '627': '#4b2928',
  '628': '#d2c2c2', '629': '#d2cfc8', '630': '#8a908c', '631': '#4a4a56',
  '632': '#010103', '633': '#e5dece', '634': '#d4bf92', '635': '#fa8c71',
  '636': '#00324b', '637': '#0186c9', '638': '#77283d', '639': '#b11e2e',
  '640': '#028752', '641': '#666900', '642': '#f3ffb3', '643': '#8a6a39',
  '644': '#6a6054', '645': '#ad0268', '646': '#cbc61b', '647': '#00b0c7',
  '648': '#f6d3b5'
});

/**
 * Standardgroessen, falls der Artikel selbst keine Liste mitbringt.
 * Es ist dieselbe Reihe, die matten.net im Feld #input_fixed_size fuehrt.
 * TODO Artikelstammdaten: gehoert je Artikel gepflegt.
 * Schreibweise wie im Altsystem: erst die Laenge, dann die Breite.
 */
export const GROESSEN_VORGABE = Object.freeze([
  '40cm x 60cm', '50cm x 75cm', '60cm x 85cm', '75cm x 90cm',
  '85cm x 115cm', '85cm x 150cm', '115cm x 175cm', '150cm x 200cm'
]);

/**
 * Stellt den Stammdatensatz fuer einen Artikel zusammen und sagt zu jedem
 * Wert, woher er kommt. Das Feld `stammdaten` geht unveraendert als zweites
 * Argument an berechne().
 *
 * @param {object} p  das Produkt aus GET /api/produkt
 */
export function artikelStammdaten(p) {
  const produkt = p || {};
  const gesetzt = jeArtikel(produkt.artikelnummer);
  const quelle = {};

  /* --- Colortype (Excel F2) — wird NIE abgefragt --------------------- */
  let colortype;
  if (gesetzt && gesetzt.colortype) {
    colortype = gesetzt.colortype;
    quelle.colortype = gesetzt === ARTIKEL['6300201-Logomatte']
      ? 'Artikelstammdaten von matten.de (bestaetigt)'
      : 'Artikeltabelle dieser Seite (vorlaeufig)';
  } else {
    const g = colortypeAusName(produkt.name);
    colortype = g.wert;
    quelle.colortype = g.quelle;
  }

  /* --- Masse: Grenzen und Standardbreiten aus dem Kaufformular ------- */
  const masse = produkt.masse || [];
  const massX = masse.find((m) => /\[x\]$/.test(m.feld)) || null;
  const massY = masse.find((m) => /\[y\]$/.test(m.feld)) || null;

  const breitenAuswahl = standardbreitenAus(produkt);
  const mins = [massX && massX.min, massY && massY.min].filter((n) => Number.isFinite(n));
  /* Die Mappe (B6 = 30 cm) ist die geprueffte Quelle; enger darf das
     Altsystem werden, weiter nicht. */
  const minBreite = mins.length
    ? Math.max(STAMMDATEN_VORGABE.minBreite, Math.min(...mins))
    : STAMMDATEN_VORGABE.minBreite;
  const maxLaenge = (massY && Number.isFinite(massY.max)) ? massY.max
                  : (massX && Number.isFinite(massX.max)) ? massX.max
                  : STAMMDATEN_VORGABE.maxLaenge;

  quelle.grenzen = (massX || massY)
    ? 'Kaufformular von matten.de (Felder spezialoption[…])'
    : 'Vorgabewerte der Kalkulationstabelle (B6/C6)';
  quelle.standardbreiten = breitenAuswahl.length
    ? 'Breitenauswahl des Kaufformulars'
    : 'Kalkulationstabelle Q7..V7';
  quelle.ekListenpreisProQm = (gesetzt && Number.isFinite(gesetzt.ekListenpreisProQm))
    ? 'Artikelstammdaten (Quadratmeterpreis EK netto)'
    : 'Vorgabewert der Kalkulationstabelle (Q5)';
  quelle.tzProzent = 'Vorgabewert der Kalkulationstabelle (R2)';

  /* --- Der vollstaendige Satz. stammsatzAus() ergaenzt aus der
         gepruefften Vorgabe alles, was hier nicht gesetzt wird. -------- */
  const teil = { ...(gesetzt || {}), colortype, minBreite, maxLaenge };
  if (breitenAuswahl.length) teil.standardbreiten = breitenAuswahl;
  const stammdaten = stammsatzAus(teil);

  /* Meldet das Modul selbst einen Mangel, wird er sichtbar gemacht statt
     still einen falschen Preis zu liefern. */
  const pruefung = pruefeStammdaten(stammdaten);

  /* --- Preisbestandteile, die die Mappe nicht kennt ------------------ */
  const preis = produkt.preis || {};
  const ustSatz = Number.isFinite(preis.ustSatz) ? preis.ustSatz : VORGABE.ustSatz;
  quelle.ustSatz = Number.isFinite(preis.ustSatz)
    ? 'Artikelseite von matten.de' : 'Vorgabewert (Regelsatz)';

  const versandBrutto = Number.isFinite(preis.versand) ? preis.versand : VORGABE.versandBrutto;
  quelle.versand = Number.isFinite(preis.versand)
    ? 'Artikelseite von matten.de' : 'Vorgabewert (Standardversand)';

  return {
    stammdaten, pruefung, ustSatz, versandBrutto, quelle,
    massX, massY,
    breitenAuswahl: stammdaten.standardbreiten.slice(),
    /* Ist die Breite im Altsystem ein Auswahlfeld, darf nur eine der
       angebotenen Bahnbreiten uebergeben werden — dann gibt es fuer die
       Breite keine freie Eingabe, sondern Bahnbreiten zum Antippen.
       Genau so loest matten.net es mit #order_input_fixed_width. */
    breiteIstAuswahl: !massX && breitenAuswahl.length > 0
  };
}

/** Die Bahnbreiten aus dem Auswahlfeld spezialoption[…][x], falls es eines ist. */
function standardbreitenAus(p) {
  const a = (p.attribute || []).find((x) => /\[x\]$/.test(x.feld) && (x.optionen || []).length);
  if (!a) return [];
  const werte = a.optionen
    .map((o) => Number(String(o.wert).replace(/[^\d.,]/g, '').replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n > 0);
  return werte.length ? werte : [];
}

/* ==========================================================================
   2  RECHNEN
   ========================================================================== */

/**
 * DIE EINZIGE RECHNUNG AUSSERHALB VON berechne().
 * --------------------------------------------------------------------------
 * Die Arbeitsmappe PREISE-Brian kennt weder Umsatzsteuer noch Versandkosten;
 * beide Groessen kommen ueberhaupt nicht darin vor. Der Kunde verlangt aber
 * ausdruecklich einen Endpreis "inklusive Mehrwertsteuer und inklusive der
 * Versandkosten ebenfalls inklusive Mehrwertsteuer".
 *
 * Deshalb wird der fertige Nettobetrag aus berechne() hier — und nur hier —
 * um den Steuersatz erhoeht und um den Versand ergaenzt. Gerundet wird mit
 * runde() aus dem geprueften Modul. Es wird kein Faktor der Kalkulation
 * nachgebaut und kein Zwischenschritt wiederholt.
 *
 * Der Versandbetrag ist bereits ein Bruttobetrag: matten.de weist ihn den
 * Endkunden gegenueber so aus.
 */
export function mitSteuerUndVersand(nettoGesamt, stamm) {
  const netto = runde(nettoGesamt, 2);
  const ust = runde(netto * (stamm.ustSatz / 100), 2);
  const wareBrutto = runde(netto + ust, 2);
  const versandBrutto = runde(stamm.versandBrutto, 2);
  return {
    netto,
    ustSatz: stamm.ustSatz,
    ust,
    wareBrutto,
    versandBrutto,
    gesamtBrutto: runde(wareBrutto + versandBrutto, 2)
  };
}

/**
 * Ein vollstaendiger Preis fuer eine Konfiguration.
 * Gibt bei unmoeglichen Massen { ok:false, … } zurueck und wirft nie.
 */
export function preisFuer(eingaben, stamm) {
  /* Erstes Argument: NUR die Kundeneingaben. Der Colortype steht im zweiten
     Argument, weil er ein Artikelstammdatum ist — genau so trennt die
     Arbeitsmappe die beiden Welten. */
  const r = berechne({
    breite: eingaben.breite,
    laenge: eingaben.laenge,
    menge: eingaben.menge,
    sonderformOhneRand: eingaben.sonderformOhneRand,
    sonderformMitRand: eingaben.sonderformMitRand,
    sonderfarbe: eingaben.sonderfarbe
  }, stamm.stammdaten);

  if (!r.ok) return { ok: false, r, rat: handlungsrat(r, stamm) };

  return {
    ok: true,
    r,
    stueck: mitSteuerUndVersand(r.vkProStueck, { ...stamm, versandBrutto: 0 }),
    gesamt: mitSteuerUndVersand(r.vkGesamt, stamm)
  };
}

/**
 * Der Satz, den der Kunde bei einem unmoeglichen Mass lesen soll.
 * Er sagt, WAS ZU TUN IST — nicht nur, dass etwas nicht geht. Genau das hat
 * der Kunde bei der Abnahme verlangt.
 */
export function handlungsrat(r, stamm) {
  const k = stamm.stammdaten;
  const rollenbreite = rollenbreiteFuer(k);

  if (r.code === 'STAMMDATEN') {
    return 'Für diesen Artikel fehlen Angaben in den Stammdaten, ohne die wir ' +
      'nicht rechnen dürfen. Fordern Sie bitte ein Angebot an — wir rechnen ' +
      'Ihr Maß von Hand.';
  }
  if (r.code === 'ZU_SCHMAL') {
    return 'Bitte geben Sie ein größeres Maß ein — jede Seite muss mindestens ' +
      zahl(k.minBreite, 0) + ' cm haben.';
  }
  if (r.code === 'ZU_LANG') {
    return 'Bitte geben Sie ein kleineres Maß ein (höchstens ' + zahl(k.maxLaenge, 0) +
      ' cm Länge). Für längere Bahnen legen wir mehrere Matten aneinander — ' +
      'fordern Sie dafür bitte ein Angebot an.';
  }
  if (r.code === 'ZU_BREIT') {
    return 'Bitte geben Sie ein kleineres Maß ein — eine der beiden Seiten darf höchstens ' +
      zahl(rollenbreite, 0) + ' cm messen. Die Matte wird von der Rolle geschnitten, ' +
      'breiter gibt es das Material nicht.';
  }
  if (r.code === 'EINGABE') {
    return 'Bitte tragen Sie Breite und Länge als ganze Zentimeter ein, zum Beispiel 85 und 150.';
  }
  return r.klartext || r.grund || 'Bitte prüfen Sie das eingegebene Maß.';
}

/* ==========================================================================
   3  LESEN DER ARTIKELDATEN
   ========================================================================== */

/** "85cm x 300cm" -> { laenge:85, breite:300 }. Reihenfolge wie im Altsystem. */
export function massAusLabel(text) {
  const m = /(\d+(?:[.,]\d+)?)\s*cm\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*cm/i.exec(String(text || ''));
  if (!m) return null;
  const laenge = Number(m[1].replace(',', '.'));
  const breite = Number(m[2].replace(',', '.'));
  if (!Number.isFinite(laenge) || !Number.isFinite(breite)) return null;
  return { laenge, breite };
}

/**
 * Die Standardgroessen des Artikels als fertige Auswahlkarten — jede mit
 * Mass UND Preis. Der Preis kommt aus berechne(), fuer ein Stueck.
 *
 * Eintraege ohne Mass ("Massanfertigung") sind keine Karte, sondern der
 * Hinweis auf den Wunschmass-Weg; sie werden hier herausgefiltert und ihr
 * Originalwert getrennt zurueckgegeben, damit er im Warenkorb landen kann.
 */
export function groessenFuer(p, stamm) {
  const attr = (p.attribute || []).find(
    (a) => /gr[oö]ß|gr[oö]ss/i.test(a.name || '') && (a.optionen || []).length
  );

  let roh;
  let feld = attr ? attr.feld : null;
  let vorgabe = false;
  let massanfertigung = null;

  if (attr) {
    roh = attr.optionen.map((o) => ({ wert: o.wert, text: o.label || o.wert }));
  } else {
    roh = GROESSEN_VORGABE.map((t) => ({ wert: t, text: t }));
    vorgabe = true;
  }

  const karten = [];
  roh.forEach((o) => {
    const mass = massAusLabel(o.text) || massAusLabel(o.wert);
    if (!mass) {
      /* "Maßanfertigung" o. Ae. — das ist der Wunschmass-Weg, keine Karte. */
      if (!massanfertigung) massanfertigung = o.wert;
      return;
    }
    const preis = preisFuer(
      { breite: mass.breite, laenge: mass.laenge, menge: 1 }, stamm
    );
    karten.push({
      wert: o.wert,
      breite: mass.breite,
      laenge: mass.laenge,
      /* Die Schreibweise bleibt die des Altsystems ("40 × 60 cm"). Der Kunde
         soll sein Mass wiedererkennen — genau darum geht es bei dieser
         Liste. Nur die Trennzeichen werden vereinheitlicht. */
      text: zahl(mass.laenge, 0) + ' × ' + zahl(mass.breite, 0) + ' cm',
      preisBrutto: preis.ok ? preis.stueck.wareBrutto : null,
      grund: preis.ok ? null : preis.rat
    });
  });

  return { feld, karten, massanfertigung, vorgabe };
}

/** Die Farbgruppen des Artikels (Grundfarbe, ggf. Designfarbe). */
export function farbgruppenFuer(p) {
  return (p.attribute || [])
    .filter((a) => a.typ === 'farbwahl' && (a.optionen || []).length)
    .map((a) => ({
      feld: a.feld,
      name: (a.name || 'Farbe').replace(/[,\s]+$/, ''),
      gewaehlt: a.gewaehlt,
      optionen: a.optionen.map((o) => {
        const wert = String(o.wert);
        const nummer = (/^(\d{3})/.exec(wert) || [])[1] || null;
        const klar = wert.replace(/^\d{3}[-\s]*/, '').trim();
        return {
          wert,
          nummer,
          name: wert === 'default' ? 'Standardfarbe des Artikels' : (klar || wert),
          farbwert: nummer ? FARBWERTE[nummer] || null : null
        };
      })
    }));
}

/**
 * Farbwert -> Produktbild. Das Altsystem legt die Farbbilder unter Namen ab,
 * die den Farbwert enthalten ("JP-613-koenigsblau_0.JPG"). Die Pfade sind
 * URL-kodiert, deshalb wird vor dem Vergleich dekodiert.
 */
export function bilderJeFarbe(p, optionen) {
  const bilder = (p.bilder || []).map((b) => b.bild || b.original).filter(Boolean);
  const lesbar = bilder.map((b) => {
    let t = b;
    try { t = decodeURIComponent(b); } catch (e) { /* kaputte Kodierung: Rohpfad */ }
    return t.toLowerCase();
  });
  const karte = {};
  optionen.forEach((o) => {
    const suche = o.wert.toLowerCase();
    if (suche === 'default') return;
    const i = lesbar.findIndex((t) => t.indexOf(suche) >= 0);
    if (i >= 0) karte[o.wert] = bilder[i];
  });
  return karte;
}

/* ==========================================================================
   Ab hier: die Seite selbst. Der Mattendesigner benutzt nur das Obige.
   ========================================================================== */

(function () {
  'use strict';

  const $pdp = document.getElementById('pdp');
  if (!$pdp) return;   /* diese Datei wird auch als Modul importiert */

  const A = window.NetApi;
  const esc = A.esc;

  const pfad = A.parameter('pfad', '');
  const VORSCHAU_MAX = 8;
  const FARBEN_OFFEN = 12;   /* so viele Farbfelder stehen sofort da */

  /* Alles, was der Kunde gewaehlt hat — und sonst nichts. */
  const wahl = {
    farben: {},            /* Feldname des Altsystems -> Farbwert          */
    groesse: null,         /* Index in stand.karten, oder 'wunsch'         */
    breite: null,
    laenge: null,
    menge: 1,
    sonderformOhneRand: false,
    sonderformMitRand: false,
    sonderfarbe: false,
    kommentar: ''
  };

  let artikel = null;
  let stamm = null;
  let stand = null;        /* Ergebnis von groessenFuer()                  */
  let farbgruppen = [];
  let farbbilder = {};
  let ausfuehrung = null;  /* attribute[Ausfuehrung] des Altsystems        */

  /* ======================================================================
     Start
     ====================================================================== */

  function start() {
    if (!pfad) {
      abbruch('Kein Artikel angegeben',
        'Diese Seite braucht die Adresse eines Artikels, zum Beispiel ' +
        'produkt.html?pfad=/logomatten/6300201-logomatte-a.');
      return;
    }
    A.produkt(pfad).then((antwort) => {
      if (!antwort || !antwort.ok || !antwort.produkt) {
        abbruch('Artikel nicht gefunden', A.fehlertext(antwort, 'Artikel laden'));
        return;
      }
      artikel = antwort.produkt;
      aufbauen();
    });
  }

  function abbruch(titel, text) {
    $pdp.removeAttribute('aria-busy');
    $pdp.classList.add('pdp--leer');
    document.title = titel + ' | Mattenfuchs';
    $pdp.innerHTML = A.leerbox(titel, text,
      '<a class="btn" href="index.html">Zur Startseite</a>' +
      '<a class="btn btn--sekundaer" href="kategorie.html">Alle Warengruppen</a>',
      { rang: 1, rolle: 'alert' });
  }

  /* ======================================================================
     4  MARKUP
     ====================================================================== */

  function aufbauen() {
    const p = artikel;
    document.title = (p.name || p.artikelnummer) + ' | Mattenfuchs';

    stamm = artikelStammdaten(p);
    stand = groessenFuer(p, stamm);
    farbgruppen = farbgruppenFuer(p);
    ausfuehrung = (p.attribute || []).find(
      (a) => /ausf[üu]hrung/i.test(a.name || '') && (a.optionen || []).length
    ) || null;

    /* --- Vorauswahl: was das Altsystem selbst vorschlaegt -------------- */
    farbgruppen.forEach((g) => {
      const vorhanden = g.optionen.some((o) => o.wert === g.gewaehlt);
      wahl.farben[g.feld] = vorhanden ? g.gewaehlt : g.optionen[0].wert;
    });
    farbbilder = farbgruppen.length ? bilderJeFarbe(p, farbgruppen[0].optionen) : {};

    /* Die kleinste Standardgroesse ist die freundlichste Vorauswahl: sie
       zeigt sofort einen Preis, ohne dass der Kunde etwas tun muss. */
    if (stand.karten.length) {
      wahl.groesse = 0;
      wahl.breite = stand.karten[0].breite;
      wahl.laenge = stand.karten[0].laenge;
    } else {
      wahl.groesse = 'wunsch';
      wahl.breite = stamm.breitenAuswahl[0];
      wahl.laenge = Math.max(stamm.stammdaten.minBreite, 100);
    }

    krumenSetzen(p);

    $pdp.removeAttribute('aria-busy');
    $pdp.innerHTML =
      bilderHTML(p) +
      '<div class="pdp__wahl">' +
        kopfHTML(p) +
        '<form id="konfigurator" novalidate>' +
          farbenHTML() +
          groessenHTML() +
          zusatzHTML() +
          mengeHTML() +
          preisHTML() +
        '</form>' +
      '</div>';

    verdrahten();
    bildSetzen();
    neuRechnen();

    reiterAufbauen(p);
    mehrAusKategorie(p);
  }

  /* --- Links: Bild, das sich mit der Farbe aendert -------------------- */

  function bilderHTML(p) {
    const start = A.bild(p.hauptbild) || A.bild((p.bilder || [])[0] && (p.bilder[0].bild));
    const alt = 'Artikelbild: ' + (p.name || p.artikelnummer || '');

    let h = '<div class="pdp__bilder">';
    h += '<div class="bildbuehne" id="bildbuehne">' +
      (start
        ? '<img id="pdp-bild" src="' + esc(start) + '" alt="' + esc(A.kuerze(alt, 120)) + '">'
        : '<span class="bildflaeche" role="img" aria-label="Für diesen Artikel liegt kein Bild vor">' +
          'Kein Bild im Altsystem</span>') +
      '</div>';

    /* Vorschauen: nur Ansichten des Artikels, keine Farbkacheln — die
       Farbe waehlt man unten am Farbfeld, nicht hier. */
    const weitere = (p.bilder || [])
      .map((b) => A.bild(b.bild || b.original))
      .filter(Boolean)
      .filter((b, i, alle) => alle.indexOf(b) === i)
      .slice(0, VORSCHAU_MAX);

    if (weitere.length > 1) {
      h += '<h2 class="nur-sr" id="ansichten-titel">Weitere Ansichten</h2>';
      h += '<ul class="bildstreifen" id="bildstreifen" aria-labelledby="ansichten-titel">';
      weitere.forEach((b, i) => {
        h += '<li><button class="bildstreifen__knopf" type="button" data-bild="' + esc(b) + '"' +
          (i === 0 ? ' aria-current="true"' : '') + '>' +
          '<img src="' + esc(b) + '" alt="" loading="lazy" decoding="async">' +
          '<span class="nur-sr">Ansicht ' + (i + 1) + ' anzeigen</span></button></li>';
      });
      h += '</ul>';
    }

    h += '<p class="meta mt-3">Alle Bilder laufen über den Bildproxy ' +
      '<code>/api/img/</code> — der Browser baut keine Verbindung zu matten.de auf.</p>';
    h += '</div>';
    return h;
  }

  /* --- Kopf ----------------------------------------------------------- */

  function kopfHTML(p) {
    const kurz = A.aufraeumen(p.kurzbeschreibung);
    return '<div class="pdp__kopfzeile">' +
      '<span class="abzeichen abzeichen--rand">Art.-Nr. ' + esc(p.artikelnummer || '—') + '</span>' +
      '<span class="abzeichen abzeichen--erfolg">Nach Maß gefertigt</span>' +
      '</div>' +
      '<p class="label">' + esc((p.kategorie && p.kategorie.name) || 'Sortiment') + '</p>' +
      '<h1>' + esc(p.name || p.artikelnummer) + '</h1>' +
      (kurz ? '<p class="vorspann">' + esc(A.kuerze(kurz, 220)) + '</p>' : '');
  }

  /* --- 1  Farbe ------------------------------------------------------- */

  function farbenHTML() {
    if (!farbgruppen.length) return '';

    return farbgruppen.map((g, gi) => {
      const gewaehlt = wahl.farben[g.feld];
      const aktuell = g.optionen.find((o) => o.wert === gewaehlt) || g.optionen[0];

      const feld = (o, i) => {
        const id = 'farbe-' + gi + '-' + i;
        const stil = o.farbwert
          ? ' style="--farbe:' + esc(o.farbwert) + '"'
          : ' data-ohne-farbwert="true"';
        return '<li><span class="farbfeld"' + stil + '>' +
          '<input type="radio" id="' + id + '" name="farbe-' + gi + '" ' +
          'value="' + esc(o.wert) + '" data-farbgruppe="' + gi + '"' +
          (o.wert === aktuell.wert ? ' checked' : '') + '>' +
          '<label for="' + id + '">' +
          '<span class="farbfeld__nr" aria-hidden="true">' + esc(o.nummer || '–') + '</span>' +
          '<span class="nur-sr">' + esc(o.name) + (o.nummer ? ', Farbnummer ' + esc(o.nummer) : '') + '</span>' +
          '</label></span></li>';
      };

      /* Sichtbar sind die ersten zwoelf Felder — und IMMER das gerade
         gewaehlte. Steckte es hinter dem Klappknopf, saehe der Kunde
         nirgends, welche Farbe gilt, und mit der Tastatur waere es gar nicht
         erreichbar. Die Palette einfach ganz aufzuklappen waere das andere
         Extrem: 45 Felder je Gruppe sind genau das "zu viel und zu
         unuebersichtlich", das vermieden werden soll. */
      const sichtbar = g.optionen.slice(0, FARBEN_OFFEN);
      if (sichtbar.indexOf(aktuell) < 0) sichtbar.push(aktuell);
      const rest = g.optionen.filter((o) => sichtbar.indexOf(o) < 0);

      let h = '<fieldset class="block">' +
        '<legend class="block__titel">' + esc(g.name) +
        ' <span class="block__wert" id="farbname-' + gi + '">' + esc(aktuell.name) + '</span></legend>' +
        '<ul class="farbfelder">' +
        sichtbar.map((o) => feld(o, g.optionen.indexOf(o))).join('') + '</ul>';

      if (rest.length) {
        h += '<ul class="farbfelder farbfelder--rest" id="farbrest-' + gi + '" hidden>' +
          rest.map((o) => feld(o, g.optionen.indexOf(o))).join('') + '</ul>' +
          '<button class="mehrfarben" type="button" data-farbrest="' + gi + '" ' +
          'aria-expanded="false" aria-controls="farbrest-' + gi + '">' +
          'Alle ' + g.optionen.length + ' Farben anzeigen</button>';
      }

      h += '</fieldset>';
      return h;
    }).join('');
  }

  /* --- 2  Groesse: sichtbare Liste mit Mass UND Preis ----------------- */

  /**
   * Die Grenzen einer Achse, so eng wie noetig und so weit wie moeglich:
   * das Kaufformular des Altsystems ist massgebend, wo es etwas sagt,
   * sonst die Kalkulationstabelle.
   */
  function grenzen(achse) {
    const k = stamm.stammdaten;
    const feld = achse === 'breite' ? stamm.massX : stamm.massY;
    const rollenbreite = stamm.breitenAuswahl[stamm.breitenAuswahl.length - 1];
    return {
      min: (feld && Number.isFinite(feld.min)) ? feld.min : k.minBreite,
      max: (feld && Number.isFinite(feld.max)) ? feld.max
         : (achse === 'breite' ? rollenbreite : k.maxLaenge)
    };
  }

  function groessenHTML() {
    const k = stamm.stammdaten;
    const gB = grenzen('breite');
    const gL = grenzen('laenge');

    let h = '<fieldset class="block block--gross">' +
      '<legend class="block__titel">Größe</legend>' +
      '<p class="block__text">Alle Standardgrößen mit Preis je Stück. ' +
      'Ist Ihr Maß nicht dabei, tragen Sie es unten einfach ein.</p>';

    h += '<ul class="groessen" id="groessen">';
    stand.karten.forEach((g, i) => {
      h += '<li><label class="groesse">' +
        '<input type="radio" name="groesse" value="' + i + '"' +
        (wahl.groesse === i ? ' checked' : '') + '>' +
        '<span class="groesse__mass">' + esc(g.text) + '</span>' +
        '<span class="groesse__preis">' +
        (g.preisBrutto != null ? esc(euro(g.preisBrutto)) : 'auf Anfrage') +
        '</span>' +
        '<span class="groesse__zusatz">je Stück, inkl. MwSt.</span>' +
        '</label></li>';
    });

    /* Der Weg zum Wunschmass steht DIREKT an der Liste — nicht am Ende der
       Seite. Er ist eine Karte wie die anderen, nur eine Spur auffaelliger. */
    h += '<li class="groessen__wunsch"><label class="groesse groesse--wunsch">' +
      '<input type="radio" name="groesse" value="wunsch"' +
      (wahl.groesse === 'wunsch' ? ' checked' : '') + '>' +
      '<span class="groesse__mass">Ihr Maß ist nicht dabei?</span>' +
      '<span class="groesse__preis">Wunschmaß eingeben</span>' +
      '<span class="groesse__zusatz">Wir fertigen Breiten von ' + esc(zahl(gB.min, 0)) +
      ' bis ' + esc(zahl(gB.max, 0)) + ' cm und Längen von ' + esc(zahl(gL.min, 0)) +
      ' bis ' + esc(zahl(gL.max, 0)) + ' cm</span>' +
      '</label></li>';
    h += '</ul>';

    /* --- Das Wunschmass, direkt darunter ---------------------------- */
    h += '<div class="wunschmass" id="wunschmass"' +
      (wahl.groesse === 'wunsch' ? '' : ' hidden') + '>';

    h += '<div class="wunschmass__felder">';

    if (stamm.breiteIstAuswahl) {
      /* Die Breite kommt von der Rolle — wie #order_input_fixed_width. */
      h += '<div class="feld">' +
        '<span class="feld-beschriftung" id="breite-titel">Breite in cm</span>' +
        '<div class="bahnen" role="group" aria-labelledby="breite-titel" id="bahnen">' +
        stamm.breitenAuswahl.map((b, i) =>
          '<label class="bahn"><input type="radio" name="bahn" value="' + esc(b) + '"' +
          (i === 0 ? ' checked' : '') + '>' +
          '<span>' + esc(zahl(b, 0)) + '</span></label>'
        ).join('') +
        '</div>' +
        '<p class="feld-hinweis">Die Matte wird aus einer Bahn geschnitten. ' +
        'Diese Breiten führen wir auf Rolle — jede andere kostet 25 % Zuschlag.</p>' +
        '</div>';
    } else {
      h += '<div class="feld" id="feld-breite">' +
        '<label for="eingabe-breite">Breite in cm</label>' +
        '<input type="number" id="eingabe-breite" inputmode="numeric" step="1" ' +
        'min="' + esc(zahl(gB.min, 0)) + '" max="' + esc(zahl(gB.max, 0)) + '" ' +
        'value="' + esc(zahl(wahl.breite, 0)) + '" autocomplete="off" ' +
        'aria-describedby="breite-hinweis">' +
        '<p class="feld-hinweis" id="breite-hinweis">Möglich sind ' +
        esc(zahl(gB.min, 0)) + ' bis ' + esc(zahl(gB.max, 0)) + ' cm. ' +
        'Ohne Zuschlag sind die Bahnbreiten ' +
        esc(stamm.breitenAuswahl.map((b) => zahl(b, 0)).join(' · ')) + ' cm.</p>' +
        '</div>';
    }

    h += '<div class="feld" id="feld-laenge">' +
      '<label for="eingabe-laenge">Länge in cm</label>' +
      '<input type="number" id="eingabe-laenge" inputmode="numeric" step="1" ' +
      'min="' + esc(zahl(gL.min, 0)) + '" max="' + esc(zahl(gL.max, 0)) + '" ' +
      'value="' + esc(zahl(wahl.laenge, 0)) + '" autocomplete="off" ' +
      'aria-describedby="laenge-hinweis">' +
      '<p class="feld-hinweis" id="laenge-hinweis">Möglich sind ' +
      esc(zahl(gL.min, 0)) + ' bis ' + esc(zahl(gL.max, 0)) + ' cm.</p>' +
      '</div>';

    h += '</div>';

    /* Die Meldung bei einem unmoeglichen Mass. Sie sagt, was zu tun ist. */
    h += '<p class="hinweis hinweis--warnung mt-4" id="mass-meldung" role="alert" hidden>' +
      '<span class="hinweis__symbol" aria-hidden="true">!</span>' +
      '<span><span class="hinweis__titel" id="mass-titel"></span>' +
      '<span id="mass-rat"></span></span></p>';

    h += '<p class="wunschmass__stand meta" id="wunschmass-stand"></p>';
    h += '</div>';   /* .wunschmass */

    h += '</fieldset>';
    return h;
  }

  /* --- 3  Sonderoptionen: unaufdringliche Kreuze ---------------------- */

  function zusatzHTML() {
    return '<fieldset class="block">' +
      '<legend class="block__titel">Sonderwünsche <span class="block__wert">optional</span></legend>' +
      '<ul class="kreuze">' +
      '<li><label class="kreuz">' +
      '<input type="checkbox" id="k-form-ohne">' +
      '<span class="kreuz__text">Sonderform ohne Rand<span class="kreuz__zusatz">' +
      'Zuschnitt nach Kontur, freie Verlegung</span></span>' +
      '<span class="kreuz__wert">+30 %</span></label></li>' +
      '<li><label class="kreuz">' +
      '<input type="checkbox" id="k-form-mit">' +
      '<span class="kreuz__text">Sonderform mit Rand<span class="kreuz__zusatz">' +
      'Konturzuschnitt mit umlaufendem Rand</span></span>' +
      '<span class="kreuz__wert">+50 %</span></label></li>' +
      '<li><label class="kreuz">' +
      '<input type="checkbox" id="k-sonderfarbe">' +
      '<span class="kreuz__text">Sonderfarbe<span class="kreuz__zusatz">' +
      'Farbe außerhalb der Palette, einmalig je Auftrag</span></span>' +
      '<span class="kreuz__wert">+' + esc(euro(stamm.stammdaten.aufschlagSonderfarbeVK)) + '</span></label></li>' +
      '</ul></fieldset>';
  }

  /* --- 4  Menge ------------------------------------------------------- */

  function mengeHTML() {
    return '<fieldset class="block">' +
      '<legend class="block__titel">Menge</legend>' +
      '<div class="mengenzeile">' +
      '<div class="menge">' +
      '<button class="menge__knopf" type="button" id="menge-ab" aria-label="Menge um eins verringern">−</button>' +
      '<input class="menge__feld" type="number" id="menge" value="1" min="1" max="999" step="1" ' +
      'inputmode="numeric" aria-label="Menge in Stück">' +
      '<button class="menge__knopf" type="button" id="menge-auf" aria-label="Menge um eins erhöhen">+</button>' +
      '</div>' +
      '<p class="meta mb-0" id="staffel-stand"></p>' +
      '</div></fieldset>';
  }

  /* --- 5  Preis und Abschluss ----------------------------------------- */

  function preisHTML() {
    return '<div class="kaufbox" id="kaufbox">' +
      '<div class="kaufbox__preis" role="status" aria-live="polite" aria-atomic="true">' +
      '<span class="kaufbox__label" id="kaufbox-label">Gesamtpreis</span>' +
      '<span class="kaufbox__betrag" id="preis-brutto">wird berechnet …</span>' +
      '<span class="kaufbox__zusatz" id="preis-zusatz"></span>' +
      '</div>' +

      '<details class="aufstellung" id="aufstellung">' +
      '<summary><span>Netto, Mehrwertsteuer und Versand im Einzelnen</span></summary>' +
      '<dl class="summen" id="summen"></dl>' +
      '<p class="meta mt-4 mb-0" id="rechenweg-text"></p>' +
      '</details>' +

      '<div class="btn-gruppe btn-gruppe--voll mt-5">' +
      '<button class="btn btn--gross" type="submit" id="kaufen">In den Warenkorb</button>' +
      '<button class="btn btn--sekundaer btn--gross" type="button" id="angebot">Angebot anfordern</button>' +
      '</div>' +

      '<div class="feld mt-5">' +
      '<label for="kommentar">Anmerkung <span class="meta">(optional)</span></label>' +
      '<textarea id="kommentar" maxlength="500" rows="2" ' +
      'placeholder="z. B. Logo-Datei folgt per E-Mail"></textarea>' +
      '</div>' +

      '<div class="meldung" id="meldung" role="status" aria-live="polite"></div>' +
      '</div>';
  }

  /* ======================================================================
     5  BEDIENUNG
     ====================================================================== */

  function verdrahten() {
    const form = document.getElementById('konfigurator');

    /* --- Farbe: aendert Auswahl UND Produktbild ---------------------- */
    form.addEventListener('change', (ev) => {
      const el = ev.target;

      if (el.matches('[data-farbgruppe]')) {
        const gi = Number(el.getAttribute('data-farbgruppe'));
        const g = farbgruppen[gi];
        wahl.farben[g.feld] = el.value;
        const o = g.optionen.find((x) => x.wert === el.value);
        const $name = document.getElementById('farbname-' + gi);
        if ($name && o) $name.textContent = o.name;
        if (gi === 0) bildSetzen();
        neuRechnen();
        return;
      }

      if (el.name === 'groesse') {
        groesseWaehlen(el.value);
        return;
      }

      if (el.name === 'bahn') {
        wahl.breite = Number(el.value);
        neuRechnen();
        return;
      }

      if (el.id === 'k-form-ohne')    { wahl.sonderformOhneRand = el.checked; neuRechnen(); return; }
      if (el.id === 'k-form-mit')     { wahl.sonderformMitRand  = el.checked; neuRechnen(); return; }
      if (el.id === 'k-sonderfarbe')  { wahl.sonderfarbe        = el.checked; neuRechnen(); return; }
    });

    /* --- Freie Masse: entprellt, damit nicht jede Taste rechnet -------
       Die Wartezeit gilt fuer BEIDE Felder gemeinsam. Deshalb werden beim
       Ablauf auch beide Felder gelesen: wer erst die Breite und gleich
       darauf die Laenge aendert, darf die Breite nicht verlieren. */
    let uhr = null;
    form.addEventListener('input', (ev) => {
      const el = ev.target;
      if (el.id === 'eingabe-breite' || el.id === 'eingabe-laenge') {
        window.clearTimeout(uhr);
        uhr = window.setTimeout(() => { masseLesen(); neuRechnen(); }, 200);
        return;
      }
      if (el.id === 'kommentar') wahl.kommentar = el.value;
    });

    /* --- Mehr Farben ------------------------------------------------- */
    form.addEventListener('click', (ev) => {
      const knopf = ev.target.closest && ev.target.closest('[data-farbrest]');
      if (!knopf) return;
      const gi = knopf.getAttribute('data-farbrest');
      const liste = document.getElementById('farbrest-' + gi);
      const offen = liste.hidden;
      liste.hidden = !offen;
      knopf.setAttribute('aria-expanded', offen ? 'true' : 'false');
      knopf.textContent = offen
        ? 'Weniger Farben zeigen'
        : 'Alle ' + farbgruppen[gi].optionen.length + ' Farben anzeigen';
    });

    /* --- Menge -------------------------------------------------------- */
    const $menge = document.getElementById('menge');
    const $ab = document.getElementById('menge-ab');
    const $auf = document.getElementById('menge-auf');

    function mengeSetzen(n) {
      wahl.menge = Math.max(1, Math.min(999, Math.round(Number(n) || 1)));
      $menge.value = wahl.menge;
      $ab.disabled = wahl.menge <= 1;
      $auf.disabled = wahl.menge >= 999;
      neuRechnen();
    }
    $ab.addEventListener('click', () => mengeSetzen(wahl.menge - 1));
    $auf.addEventListener('click', () => mengeSetzen(wahl.menge + 1));
    $menge.addEventListener('change', () => mengeSetzen($menge.value));
    $ab.disabled = true;

    /* --- Abschluss ---------------------------------------------------- */
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      uebernehmen('kauf');
    });
    document.getElementById('angebot')
      .addEventListener('click', () => uebernehmen('angebot'));

    /* --- Angeheftete Preisleiste auf dem Handy ------------------------ */
    const $leisteKnopf = document.getElementById('leiste-kaufen');
    if ($leisteKnopf) $leisteKnopf.addEventListener('click', () => uebernehmen('kauf'));
  }

  function zahlOderNull(v) {
    const s = String(v).trim().replace(',', '.');
    if (s === '') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  /** Liest die freien Massfelder in die Auswahl — immer beide. */
  function masseLesen() {
    const $b = document.getElementById('eingabe-breite');
    const $l = document.getElementById('eingabe-laenge');
    if ($b) wahl.breite = zahlOderNull($b.value);
    if ($l) wahl.laenge = zahlOderNull($l.value);
    const $bahn = document.querySelector('[name="bahn"]:checked');
    if ($bahn) wahl.breite = Number($bahn.value);
  }

  function groesseWaehlen(wert) {
    const $wunsch = document.getElementById('wunschmass');
    if (wert === 'wunsch') {
      wahl.groesse = 'wunsch';
      $wunsch.hidden = false;

      /* Der Kunde kommt mit einem Mass im Kopf — und meist aus einer
         Standardgroesse, die fast passt. Die Felder starten deshalb mit
         dem zuletzt gewaehlten Mass; er muss nur noch aendern, was
         anders sein soll. */
      const $b = document.getElementById('eingabe-breite');
      const $l = document.getElementById('eingabe-laenge');
      if ($b && wahl.breite != null) $b.value = String(Math.round(wahl.breite));
      if ($l && wahl.laenge != null) $l.value = String(Math.round(wahl.laenge));
      const $bahn = document.querySelector('[name="bahn"][value="' + wahl.breite + '"]');
      if ($bahn) $bahn.checked = true;

      masseLesen();
      /* Der erste Griff geht ins Laengenfeld — die Breite kommt von der
         Rolle und steht meist schon richtig. */
      if ($l) window.setTimeout(() => $l.focus(), 0);
    } else {
      const i = Number(wert);
      const g = stand.karten[i];
      wahl.groesse = i;
      wahl.breite = g.breite;
      wahl.laenge = g.laenge;
      $wunsch.hidden = true;
    }
    neuRechnen();
  }

  /** Produktbild auf die gewaehlte Grundfarbe umstellen. */
  function bildSetzen() {
    const $bild = document.getElementById('pdp-bild');
    if (!$bild || !farbgruppen.length) return;
    const g = farbgruppen[0];
    const wert = wahl.farben[g.feld];
    const neu = A.bild(farbbilder[wert]);
    if (!neu) return;
    const o = g.optionen.find((x) => x.wert === wert);
    $bild.src = neu;
    $bild.alt = (artikel.name || artikel.artikelnummer || 'Matte') +
      ' in der Farbe ' + ((o && o.name) || wert);
    const $streifen = document.getElementById('bildstreifen');
    if ($streifen) {
      $streifen.querySelectorAll('[data-bild]').forEach((k) => {
        k.setAttribute('aria-current', k.getAttribute('data-bild') === neu ? 'true' : 'false');
      });
    }
  }

  /* Ansichtswechsel ueber den Bildstreifen. */
  document.addEventListener('click', (ev) => {
    const knopf = ev.target.closest && ev.target.closest('.bildstreifen__knopf');
    if (!knopf) return;
    const $bild = document.getElementById('pdp-bild');
    if (!$bild) return;
    $bild.src = knopf.getAttribute('data-bild');
    document.querySelectorAll('.bildstreifen__knopf').forEach((k) => {
      k.setAttribute('aria-current', k === knopf ? 'true' : 'false');
    });
  });

  /* ======================================================================
     6  PREISANZEIGE
     --------------------------------------------------------------------
     Gerechnet wird ausschliesslich mit preisFuer() -> berechne().
     ====================================================================== */

  function neuRechnen() {
    const $betrag = document.getElementById('preis-brutto');
    const $zusatz = document.getElementById('preis-zusatz');
    const $summen = document.getElementById('summen');
    const $meldung = document.getElementById('mass-meldung');
    const $kaufen = document.getElementById('kaufen');
    const $angebot = document.getElementById('angebot');
    if (!$betrag) return;

    const eingaben = {
      breite: wahl.breite, laenge: wahl.laenge, menge: wahl.menge,
      sonderformOhneRand: wahl.sonderformOhneRand,
      sonderformMitRand: wahl.sonderformMitRand,
      sonderfarbe: wahl.sonderfarbe
    };
    const ergebnis = preisFuer(eingaben, stamm);

    /* --- Feldgrenzen des Altsystems zuerst ---------------------------- */
    const feldRat = feldgrenzenPruefen();

    if (feldRat || !ergebnis.ok) {
      const rat = feldRat || ergebnis.rat;
      const titel = feldRat ? 'Maß außerhalb unserer Fertigung'
        : (ergebnis.r.grund === 'zu schmal' ? 'Das Maß ist zu klein'
          : ergebnis.r.code === 'ZU_LANG' ? 'Das Maß ist zu lang'
          : ergebnis.r.code === 'ZU_BREIT' ? 'Das Maß ist zu breit'
          : 'Bitte Maß prüfen');
      if ($meldung) {
        $meldung.hidden = false;
        document.getElementById('mass-titel').textContent = titel;
        document.getElementById('mass-rat').textContent = rat;
      }
      $betrag.textContent = '—';
      $zusatz.textContent = 'Sobald das Maß passt, steht der Preis hier.';
      $summen.innerHTML = '';
      $kaufen.disabled = true;
      $angebot.disabled = false;   /* ein Angebot geht immer */
      leisteSetzen(null);
      return;
    }

    if ($meldung) $meldung.hidden = true;
    $kaufen.disabled = false;
    $angebot.disabled = false;

    const g = ergebnis.gesamt;
    const s = ergebnis.stueck;
    const r = ergebnis.r;

    $betrag.textContent = euro(g.gesamtBrutto);
    $zusatz.textContent =
      'inkl. ' + zahl(g.ustSatz, 0) + ' % MwSt. und ' + euro(g.versandBrutto) + ' Versand' +
      (wahl.menge > 1 ? ' · ' + euro(s.wareBrutto) + ' je Stück' : '');

    document.getElementById('kaufbox-label').textContent =
      wahl.menge > 1 ? 'Gesamtpreis für ' + zahl(wahl.menge, 0) + ' Stück' : 'Gesamtpreis';

    /* --- Aufstellung: netto, MwSt, Versand ---------------------------- */
    $summen.innerHTML =
      zeile('Matte ' + zahl(wahl.breite, 0) + ' cm breit × ' + zahl(wahl.laenge, 0) +
            ' cm lang, ' + zahl(wahl.menge, 0) + ' Stück, netto', euro(g.netto)) +
      (r.staffelfaktor < 1
        ? zeile('darin Mengennachlass ab ' + zahl(r.staffelSchwelle, 0) + ' Stück',
                '−' + zahl((1 - r.staffelfaktor) * 100, 0) + ' %')
        : '') +
      (r.faktorBreite > 1 ? zeile('darin Sondermaß-Zuschlag', '+25 %') : '') +
      (r.aufschlagVK ? zeile('darin Sonderfarbe, einmalig', euro(r.aufschlagVK)) : '') +
      zeile('Umsatzsteuer ' + zahl(g.ustSatz, 0) + ' %', euro(g.ust)) +
      zeile('Ware inkl. MwSt.', euro(g.wareBrutto)) +
      zeile('Versand nach Deutschland, inkl. MwSt.', euro(g.versandBrutto)) +
      zeile('Endpreis', euro(g.gesamtBrutto), true);

    document.getElementById('rechenweg-text').textContent =
      'Fläche ' + zahl(r.gesamtQm, 3) + ' m² · Materialwert ' +
      euro(stamm.stammdaten.ekListenpreisProQm) + ' je m² · Qualitätsfaktor ' +
      zahl(r.salesfactor, 3) + '. Gerechnet nach der Kalkulationstabelle des Hauses; ' +
      'Umsatzsteuer und Versand kommen erst danach dazu.';

    /* --- Mengenstaffel als Hinweis, nicht als Frage ------------------- */
    const $staffel = document.getElementById('staffel-stand');
    if ($staffel) {
      $staffel.textContent = r.staffelfaktor < 1
        ? 'Ab ' + zahl(r.staffelSchwelle, 0) + ' Stück rechnen wir ' +
          zahl((1 - r.staffelfaktor) * 100, 0) + ' % günstiger — ist bereits enthalten.'
        : 'Ab 2 Stück wird es günstiger.';
    }

    /* --- Stand des Wunschmasses --------------------------------------- */
    const $stand = document.getElementById('wunschmass-stand');
    if ($stand) {
      $stand.textContent = r.faktorBreite > 1
        ? 'Dieses Maß liegt neben den Bahnbreiten — wir schneiden es aus der Rolle, ' +
          'dafür rechnet die Kalkulation 25 % Zuschlag.'
        : 'Dieses Maß liegt auf einer Bahnbreite — ohne Zuschlag.';
    }

    if (r.hinweise && r.hinweise.length && wahl.sonderformOhneRand && wahl.sonderformMitRand) {
      $stand.textContent = 'Beide Sonderformen sind angekreuzt. Die Kalkulation ' +
        'multipliziert dann beide Zuschläge — meist ist nur einer gemeint.';
    }

    leisteSetzen(g.gesamtBrutto);
  }

  function zeile(name, wert, gesamt) {
    return '<div class="summen__zeile' + (gesamt ? ' summen__zeile--gesamt' : '') + '">' +
      '<dt>' + esc(name) + '</dt><dd>' + esc(wert) + '</dd></div>';
  }

  /**
   * Grenzen, die das Altsystem am Kaufformular fuehrt — sie koennen enger
   * sein als die der Kalkulationstabelle. Die Meldung sagt auch hier, was
   * zu tun ist.
   */
  function feldgrenzenPruefen() {
    if (wahl.groesse !== 'wunsch') return null;

    const pruefe = (feld, wert, achse) => {
      if (!feld) return null;
      if (wert == null) return 'Bitte tragen Sie die ' + achse + ' in ganzen Zentimetern ein.';
      if (Number.isFinite(feld.min) && wert < feld.min) {
        return 'Bitte geben Sie eine größere ' + achse + ' ein — mindestens ' +
          zahl(feld.min, 0) + ' cm.';
      }
      if (Number.isFinite(feld.max) && wert > feld.max) {
        return 'Bitte geben Sie eine kleinere ' + achse + ' ein — höchstens ' +
          zahl(feld.max, 0) + ' cm.';
      }
      return null;
    };

    return pruefe(stamm.massX, wahl.breite, 'Breite') ||
           pruefe(stamm.massY, wahl.laenge, 'Länge');
  }

  function leisteSetzen(brutto) {
    const $wert = document.getElementById('leiste-betrag');
    const $knopf = document.getElementById('leiste-kaufen');
    if (!$wert) return;
    $wert.textContent = brutto == null ? '—' : euro(brutto);
    if ($knopf) $knopf.disabled = brutto == null;
  }

  /* ======================================================================
     7  WARENKORB UND ANGEBOT
     --------------------------------------------------------------------
     Beides schickt dieselbe Konfiguration an POST /api/cart/add. Der
     Unterschied steht in der Anmerkung — das Altsystem kennt fuer diese
     Artikel keinen getrennten Angebotsweg. BESTELLT WIRD NICHTS.
     ====================================================================== */

  function uebernehmen(art) {
    const $meldung = document.getElementById('meldung');
    const $knopf = document.getElementById(art === 'angebot' ? 'angebot' : 'kaufen');
    const beschriftung = $knopf.textContent;

    const werte = {};

    /* Farben — Feldnamen des Altsystems unveraendert. */
    Object.keys(wahl.farben).forEach((feld) => { werte[feld] = wahl.farben[feld]; });

    /* Groesse. */
    if (stand.feld) {
      werte[stand.feld] = wahl.groesse === 'wunsch'
        ? (stand.massanfertigung || '')
        : stand.karten[wahl.groesse].wert;
      if (!werte[stand.feld]) delete werte[stand.feld];
    }

    /* Freie Masse nur beim Wunschmass. */
    if (wahl.groesse === 'wunsch') {
      if (stamm.massX) werte[stamm.massX.feld] = String(wahl.breite);
      if (stamm.massY) werte[stamm.massY.feld] = String(wahl.laenge);
      if (stamm.breiteIstAuswahl) {
        const feldX = (artikel.attribute || []).find((a) => /\[x\]$/.test(a.feld));
        if (feldX) {
          const treffer = (feldX.optionen || []).find(
            (o) => Number(String(o.wert).replace(/[^\d.,]/g, '').replace(',', '.')) === wahl.breite
          );
          if (treffer) werte[feldX.feld] = treffer.wert;
        }
      }
    }

    /* Sonderform: das Altsystem fuehrt sie als Ausfuehrung, nicht als Kreuz. */
    if (ausfuehrung) {
      const suche = wahl.sonderformMitRand ? /mit rand.*sonderform|sonderform.*mit rand/i
                  : wahl.sonderformOhneRand ? /ohne rand.*sonderform|sonderform.*ohne rand/i
                  : null;
      if (suche) {
        const o = ausfuehrung.optionen.find((x) => suche.test(x.wert));
        if (o) werte[ausfuehrung.feld] = o.wert;
      }
    }

    const notizen = [];
    if (art === 'angebot') notizen.push('ANGEBOT ANGEFORDERT (keine Bestellung)');
    if (wahl.groesse === 'wunsch') {
      notizen.push('Wunschmaß ' + zahl(wahl.breite, 0) + ' × ' + zahl(wahl.laenge, 0) + ' cm');
    }
    if (wahl.sonderformOhneRand) notizen.push('Sonderform ohne Rand');
    if (wahl.sonderformMitRand) notizen.push('Sonderform mit Rand');
    if (wahl.sonderfarbe) notizen.push('Sonderfarbe');
    if (wahl.kommentar) notizen.push(wahl.kommentar);

    $knopf.disabled = true;
    $knopf.setAttribute('aria-busy', 'true');
    $meldung.innerHTML = '';

    A.warenkorbHinzufuegen({
      pfad: artikel.pfad,
      anzahl: wahl.menge,
      werte,
      kommentar: notizen.join(' · ').slice(0, 500)
    }).then((antwort) => {
      $knopf.disabled = false;
      $knopf.removeAttribute('aria-busy');
      $knopf.textContent = beschriftung;

      if (!antwort || !antwort.ok) {
        $meldung.innerHTML = A.fehlerbox(antwort,
          art === 'angebot' ? 'Anfrage nicht übernommen' : 'Nicht in den Warenkorb gelegt');
        return;
      }

      const n = typeof antwort.count === 'number' ? antwort.count : null;
      let h = '<p class="hinweis hinweis--erfolg" role="alert">' +
        '<span class="hinweis__symbol" aria-hidden="true">✓</span>' +
        '<span><span class="hinweis__titel">' +
        (art === 'angebot' ? 'Angebotsanfrage vorgemerkt' : 'Im Warenkorb') + '</span>' +
        esc(zahl(wahl.menge, 0) + ' × ' + zahl(wahl.breite, 0) + ' × ' + zahl(wahl.laenge, 0) +
            ' cm, ' + A.kuerze(artikel.name || artikel.artikelnummer, 50)) +
        (n != null ? ' — der Warenkorb enthält jetzt ' + n +
          (n === 1 ? ' Position.' : ' Positionen.') : '.') +
        '</span></p>';

      if (antwort.abgelehnt && antwort.abgelehnt.length) {
        h += '<p class="hinweis hinweis--warnung">' +
          '<span class="hinweis__symbol" aria-hidden="true">!</span>' +
          '<span><span class="hinweis__titel">Teilweise übernommen</span>' +
          esc(antwort.abgelehnt.map((x) =>
            A.feldName(x.feld || String(x), x.feld || String(x)) + (x.grund ? ': ' + x.grund : '')
          ).join(' · ')) + '</span></p>';
      }

      h += '<div class="btn-gruppe mt-4">' +
        '<a class="btn btn--sekundaer" href="warenkorb.html">Zum Warenkorb</a>' +
        (art === 'angebot'
          ? '<a class="btn btn--dezent" href="seite.html?seite=kontakt">Angebot besprechen</a>'
          : '<a class="btn btn--dezent" href="' + esc(kategorieAdresse()) + '">Weiter einkaufen</a>') +
        '</div>';

      $meldung.innerHTML = h;
    });
  }

  function kategorieAdresse() {
    const k = artikel.kategorie && artikel.kategorie.pfad;
    return k ? 'kategorie.html?kat=' + encodeURIComponent(k) : 'index.html';
  }

  /* ======================================================================
     8  BEIWERK
     ====================================================================== */

  function krumenSetzen(p) {
    const $k = document.getElementById('brotkrumen');
    if (!$k) return;
    let h = '<li><a href="index.html">Startseite</a></li>';
    let kette = (p.brotkrumen || []).slice(0, -1);
    if (!kette.length && p.kategorie) kette = [p.kategorie];
    kette.forEach((b) => {
      h += '<li><a href="kategorie.html?kat=' + encodeURIComponent(b.pfad) + '">' +
        esc(A.kuerze(b.name || b.pfad, 40)) + '</a></li>';
    });
    h += '<li><span aria-current="page">' +
      esc(A.kuerze(p.name || p.artikelnummer, 60)) + '</span></li>';
    $k.innerHTML = h;
  }

  function reiterAufbauen(p) {
    const $bereich = document.getElementById('pdp-details');
    const $reiter = document.getElementById('reiter');
    const $inhalte = document.getElementById('reiter-inhalte');
    if (!$bereich || !$reiter || !$inhalte) return;

    let absaetze = (p.beschreibungAbsaetze || []).map(A.aufraeumen).filter(Boolean);
    if (!absaetze.length && p.beschreibung) {
      const ganz = A.aufraeumen(p.beschreibung);
      if (ganz) absaetze = [ganz];
    }

    /* Die Stammdaten stehen hier — sichtbar, aber als Angabe, nicht als
       Frage. Der Colortype gehoert dazu: er ist ein Artikelstammdatum. */
    const zeilen = [];
    if (p.artikelnummer) zeilen.push(['Artikelnummer', p.artikelnummer]);
    if (p.kategorie && p.kategorie.name) zeilen.push(['Warengruppe', p.kategorie.name]);
    zeilen.push(['Mattenqualität (Colortype)',
      (stamm.stammdaten.colortype === 1 ? 'mehrfarbig' : stamm.stammdaten.colortype === 2 ? 'einfarbig' : 'Ped-Print') +
      ' — Quelle: ' + stamm.quelle.colortype]);
    zeilen.push(['Fertigungsgrenzen',
      'ab ' + zahl(stamm.stammdaten.minBreite, 0) + ' cm je Seite, bis ' +
      zahl(stamm.stammdaten.maxLaenge, 0) + ' cm Länge — Quelle: ' + stamm.quelle.grenzen]);
    zeilen.push(['Bahnbreiten der Rolle',
      stamm.breitenAuswahl.map((b) => zahl(b, 0)).join(' · ') + ' cm — Quelle: ' +
      stamm.quelle.standardbreiten]);
    zeilen.push(['Einkaufspreis je m² (Q5)',
      euro(stamm.stammdaten.ekListenpreisProQm) + ' netto — Quelle: ' + stamm.quelle.ekListenpreisProQm]);
    zeilen.push(['Umsatzsteuer', zahl(stamm.ustSatz, 0) + ' % — Quelle: ' + stamm.quelle.ustSatz]);
    zeilen.push(['Versand nach Deutschland',
      euro(stamm.versandBrutto) + ' inkl. MwSt. — Quelle: ' + stamm.quelle.versand]);
    if (stand.vorgabe) {
      zeilen.push(['Standardgrößen', 'nicht im Altsystem hinterlegt; gezeigt ist die Standardreihe des Hauses']);
    }
    if ((p.technischeDaten || []).length) {
      zeilen.push(['Datenblätter im Altsystem',
        p.technischeDaten.map((t) => t.name || t).join(' · ')]);
    }

    const REITER = [
      ['Beschreibung', absaetze.length
        ? '<div class="fliesstext">' + absaetze.map((t) => '<p>' + esc(t) + '</p>').join('') + '</div>'
        : '<p class="hinweis"><span class="hinweis__symbol" aria-hidden="true">i</span>' +
          '<span><span class="hinweis__titel">Kein Beschreibungstext</span>' +
          'Zu diesem Artikel hinterlegt das Altsystem keinen Fließtext.</span></p>'],

      ['Artikeldaten',
        '<div class="tabelle-rahmen"><table class="tabelle tabelle--daten">' +
        '<caption>Stammdaten des Artikels — sie werden nicht abgefragt, sondern angewendet</caption>' +
        '<tbody>' + zeilen.map((z) =>
          '<tr><th scope="row">' + esc(z[0]) + '</th><td>' + esc(z[1]) + '</td></tr>'
        ).join('') + '</tbody></table></div>' +
        '<p class="meta mt-4">Werte mit dem Zusatz „vorläufig" oder „Vorgabewert" stammen noch ' +
        'nicht aus den Artikelstammdaten des Altsystems. Sobald es dafür eine Schnittstelle ' +
        'gibt, kommen sie von dort.</p>' +
        /* Was preisformel.js selbst an den Stammdaten auszusetzen hat, wird
           hier gezeigt statt verschwiegen. */
        ((stamm.pruefung.maengel.length || stamm.pruefung.warnungen.length)
          ? '<p class="hinweis hinweis--warnung mt-4">' +
            '<span class="hinweis__symbol" aria-hidden="true">!</span>' +
            '<span><span class="hinweis__titel">Anmerkung des Rechenmoduls</span>' +
            esc(stamm.pruefung.maengel.concat(stamm.pruefung.warnungen).join(' ')) +
            '</span></p>'
          : '')],

      ['Versand und Widerruf',
        '<div class="fliesstext">' +
        '<h3>Versandkosten</h3><p>Der Versand nach Deutschland kostet ' +
        esc(euro(stamm.versandBrutto)) + ' inklusive Mehrwertsteuer. Er ist im ' +
        'ausgewiesenen Endpreis bereits enthalten.</p>' +
        '<h3>Widerrufsrecht</h3><p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe ' +
        'von Gründen diesen Vertrag zu widerrufen.</p>' +
        '<h3>Ausschluss bei Sonderanfertigungen</h3><p>Matten nach Maß, mit Wunschfarbe oder ' +
        'mit Ihrem Design fertigen wir eigens für Sie an. Nach § 312g Absatz 2 Nummer 1 BGB ' +
        'besteht dafür kein Widerrufsrecht.</p>' +
        '<p><a href="seite.html?seite=widerruf">Vollständige Widerrufsbelehrung</a> · ' +
        '<a href="seite.html?seite=versand">Versand und Lieferung</a></p></div>']
    ];

    $bereich.hidden = false;
    $reiter.innerHTML = REITER.map((r, i) =>
      '<button class="reiter" type="button" role="tab" id="reiter-' + i + '" ' +
      'aria-selected="' + (i === 0 ? 'true' : 'false') + '" aria-controls="tafel-' + i + '">' +
      esc(r[0]) + '</button>').join('');
    $inhalte.innerHTML = REITER.map((r, i) =>
      '<div role="tabpanel" id="tafel-' + i + '" aria-labelledby="reiter-' + i + '"' +
      (i === 0 ? '' : ' hidden') + '>' + r[1] + '</div>').join('');

    function waehle(i) {
      REITER.forEach((r, n) => {
        const knopf = document.getElementById('reiter-' + n);
        const tafel = document.getElementById('tafel-' + n);
        if (knopf) { knopf.setAttribute('aria-selected', n === i ? 'true' : 'false'); knopf.tabIndex = n === i ? 0 : -1; }
        if (tafel) tafel.hidden = n !== i;
      });
    }
    waehle(0);

    $reiter.addEventListener('click', (ev) => {
      const knopf = ev.target.closest && ev.target.closest('[role="tab"]');
      if (knopf) waehle(Number(knopf.id.replace('reiter-', '')));
    });
    $reiter.addEventListener('keydown', (ev) => {
      const knoepfe = Array.prototype.slice.call($reiter.querySelectorAll('[role="tab"]'));
      const i = knoepfe.indexOf(document.activeElement);
      if (i < 0) return;
      let neu = null;
      if (ev.key === 'ArrowRight') neu = (i + 1) % knoepfe.length;
      if (ev.key === 'ArrowLeft') neu = (i - 1 + knoepfe.length) % knoepfe.length;
      if (ev.key === 'Home') neu = 0;
      if (ev.key === 'End') neu = knoepfe.length - 1;
      if (neu == null) return;
      ev.preventDefault();
      waehle(neu);
      knoepfe[neu].focus();
    });
  }

  function mehrAusKategorie(p) {
    const katPfad = p.kategorie && p.kategorie.pfad;
    if (!katPfad) return;
    const $bereich = document.getElementById('pdp-mehr');
    const $raster = document.getElementById('mehr-raster');
    const $titel = document.getElementById('mehr-titel');
    const $link = document.getElementById('mehr-link');
    if (!$bereich || !$raster) return;

    $bereich.hidden = false;
    $raster.innerHTML = A.kartenPlatzhalter(4);
    if ($titel) $titel.textContent = p.kategorie.name || 'Weitere Artikel';
    if ($link) $link.href = 'kategorie.html?kat=' + encodeURIComponent(katPfad);

    A.kategorie(katPfad, { proSeite: 12 }).then((antwort) => {
      $raster.removeAttribute('aria-busy');
      if (!antwort || !antwort.ok || !(antwort.produkte || []).length) {
        $bereich.hidden = true;
        return;
      }
      const andere = antwort.produkte
        .filter((x) => x.pfad !== p.pfad && !x.variante && x.name)
        .slice(0, 4);
      if (!andere.length) { $bereich.hidden = true; return; }

      $raster.innerHTML = andere.map((x) => {
        const bild = A.bild(x.bild || x.bildOriginal);
        const name = x.name || x.nameGeerbt || x.artikelnummer || 'Artikel';
        return '<article class="karte">' +
          '<div class="karte__bild' + (bild ? '' : ' bildflaeche') + '"' +
          (bild ? '' : ' role="img" aria-label="Kein Bild vorhanden"') + '>' +
          (bild ? '<img src="' + esc(bild) + '" alt="" loading="lazy" decoding="async">' : '') +
          '</div><div class="karte__koerper">' +
          '<p class="label label--gedeckt mb-0">Art.-Nr. ' + esc(A.kuerze(x.artikelnummer || '—', 20)) + '</p>' +
          '<h3 class="karte__titel karte__titel--kurz"><a href="produkt.html?pfad=' +
          encodeURIComponent(x.pfad) + '">' + esc(A.kuerze(name, 70)) + '</a></h3>' +
          '</div></article>';
      }).join('');
    });
  }

  /* ======================================================================
     9  START
     ====================================================================== */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
