/* ==========================================================================
   seite-designer.js — der Mattendesigner (net/mattendesigner.html)
   --------------------------------------------------------------------------
   WAS DIESE SEITE IST
   -------------------
   Der Weg zur Matte nach Mass, wenn der Kunde von keinem bestimmten Artikel
   kommt. Er hat ein Mass im Kopf und eine Farbe vor Augen — sonst nichts.

   WAS SICH GEGENUEBER DEM ERSTEN ENTWURF GEAENDERT HAT
   ----------------------------------------------------
   Der erste Entwurf fragte in vier nummerierten Schritten ab, darunter die
   "Ausfuehrung" mit den drei Salesfactoren 1,931 / 1,728 / 1,8. Das war der
   COLORTYPE — und der ist laut Arbeitsmappe (Zeile 17: "Eingabe des
   Colortypes — Artikelstammdaten der Matte") ein ARTIKELSTAMMDATUM. Der
   Kunde weiss davon nichts und soll danach auch nicht gefragt werden.

   Geblieben sind vier Bloecke:  Farbe · Groesse · Sonderwuensche · Menge.
   Die Standardgroessen stehen als sichtbare Liste mit Preis da; das
   Wunschmass haengt direkt daran. Der grosse Betrag ist der Bruttoendpreis
   inklusive Mehrwertsteuer und Versand.

   WOHER DIE BAUSTEINE KOMMEN
   --------------------------
   Stammdaten, Rechnung, Groessenliste, Farbfelder und die Zuordnung von
   Farbe zu Produktbild stehen in seite-produkt.js und werden von dort
   importiert — es gibt sie genau einmal. Gerechnet wird ausschliesslich
   ueber berechne() aus /preisformel.js.

   WELCHER ARTIKEL DAHINTER STECKT
   -------------------------------
   Das Altsystem kennt keinen Artikel "freie Wunschmatte". Es kennt aber
   Anfrageartikel, und einer davon hat BEIDE Masse als freie Zahlenfelder:

       /logomatten/6300201-logomatte-a   Artikel 569
         spezialoption[569][spezial][x]  Breite  20 .. 200 cm
         spezialoption[569][spezial][y]  Laenge  40 .. 700 cm
         attribute[Grundfarbe] und attribute[Designfarbe]  je 45 Farben
         attribute[Ausfuehrung]  enthaelt die beiden Sonderformen

   Die Feldnamen werden nicht verdrahtet, sondern ueber GET /api/produkt
   gelesen. Ist der Artikel nicht erreichbar, bleibt der Uebernehmen-Knopf
   gesperrt, statt ins Leere zu greifen.
   ========================================================================== */

import { runde, euro, zahl } from '/preisformel.js';
import {
  artikelStammdaten, groessenFuer, farbgruppenFuer, bilderJeFarbe,
  preisFuer
} from './seite-produkt.js';

(function () {
  'use strict';

  const $dz = document.getElementById('dz');
  if (!$dz) return;

  const A = window.NetApi;
  const esc = A.esc;

  /** Der Anfrageartikel mit zwei freien Massfeldern. Siehe Kopfkommentar. */
  const ANFRAGE_PFAD = '/logomatten/6300201-logomatte-a';

  const wahl = {
    farben: {},
    groesse: 'wunsch',       /* der Designer beginnt beim Wunschmass */
    breite: 90,
    laenge: 250,
    menge: 1,
    sonderformOhneRand: false,
    sonderformMitRand: false,
    sonderfarbe: false,
    kommentar: ''
  };

  let artikel = null;
  let stamm = null;
  let stand = null;
  let farbgruppen = [];
  let farbbilder = {};
  let ausfuehrung = null;

  /* ======================================================================
     Start
     ====================================================================== */

  A.produkt(ANFRAGE_PFAD).then((antwort) => {
    if (!antwort || !antwort.ok || !antwort.produkt) {
      $dz.removeAttribute('aria-busy');
      $dz.innerHTML = A.leerbox(
        'Der Mattendesigner ist gerade nicht erreichbar',
        A.fehlertext(antwort, 'Artikel laden') +
        ' Rufen Sie uns an — wir rechnen Ihr Maß von Hand.',
        '<a class="btn" href="index.html">Zur Startseite</a>' +
        '<a class="btn btn--sekundaer" href="seite.html?seite=kontakt">Kontakt</a>',
        { rang: 2, rolle: 'alert' });
      return;
    }
    artikel = antwort.produkt;
    aufbauen();
  });

  /* ======================================================================
     Aufbau
     ====================================================================== */

  function aufbauen() {
    stamm = artikelStammdaten(artikel);
    stand = groessenFuer(artikel, stamm);
    farbgruppen = farbgruppenFuer(artikel);
    ausfuehrung = (artikel.attribute || []).find(
      (a) => /ausf[üu]hrung/i.test(a.name || '') && (a.optionen || []).length
    ) || null;

    farbgruppen.forEach((g) => {
      const vorhanden = g.optionen.some((o) => o.wert === g.gewaehlt);
      wahl.farben[g.feld] = vorhanden ? g.gewaehlt : g.optionen[0].wert;
    });
    farbbilder = farbgruppen.length ? bilderJeFarbe(artikel, farbgruppen[0].optionen) : {};

    /* Das Startmass ist eine Bahnbreite — so beginnt der Kunde ohne
       Zuschlag und sieht sofort einen ehrlichen Preis. */
    wahl.breite = stamm.breitenAuswahl.indexOf(90) >= 0 ? 90 : stamm.breitenAuswahl[2] || 85;

    $dz.removeAttribute('aria-busy');
    $dz.innerHTML =
      vorschauHTML() +
      '<div class="pdp__wahl"><form id="konfigurator" novalidate>' +
        farbenHTML() +
        groessenHTML() +
        zusatzHTML() +
        mengeHTML() +
        kaufboxHTML() +
      '</form></div>';

    verdrahten();
    bildSetzen();
    neuRechnen();
    document.getElementById('dz-details').hidden = false;
  }

  /* --- Links: Produktbild in der Farbe + massstabsgetreue Skizze ------ */

  function vorschauHTML() {
    const start = A.bild(artikel.hauptbild);
    return '<div class="pdp__bilder">' +
      '<div class="bildbuehne" id="bildbuehne">' +
      (start ? '<img id="pdp-bild" src="' + esc(start) + '" alt="Matte in der gewählten Farbe">' : '') +
      '</div>' +
      '<div class="dz-skizze" id="dz-skizze">' +
      '<div class="dz-skizze__matte" id="dz-skizze-matte" role="img" ' +
      'aria-label="Maßstabsgetreue Skizze der Matte">' +
      '<span class="dz-skizze__mass dz-skizze__mass--breite" id="dz-skizze-b" aria-hidden="true"></span>' +
      '<span class="dz-skizze__mass dz-skizze__mass--laenge" id="dz-skizze-l" aria-hidden="true"></span>' +
      '</div></div>' +
      '<p class="meta mt-3">Die Skizze zeigt das Seitenverhältnis Ihres Maßes. ' +
      'Das Foto läuft über den Bildproxy <code>/api/img/</code>.</p>' +
      '</div>';
  }

  /* --- 1  Farbe ------------------------------------------------------- */

  const FARBEN_OFFEN = 12;

  function farbenHTML() {
    return farbgruppen.map((g, gi) => {
      const aktuell = g.optionen.find((o) => o.wert === wahl.farben[g.feld]) || g.optionen[0];

      const feld = (o, i) => {
        const id = 'farbe-' + gi + '-' + i;
        const stil = o.farbwert ? ' style="--farbe:' + esc(o.farbwert) + '"'
                                : ' data-ohne-farbwert="true"';
        return '<li><span class="farbfeld"' + stil + '>' +
          '<input type="radio" id="' + id + '" name="farbe-' + gi + '" value="' + esc(o.wert) + '" ' +
          'data-farbgruppe="' + gi + '"' + (o.wert === aktuell.wert ? ' checked' : '') + '>' +
          '<label for="' + id + '">' +
          '<span class="farbfeld__nr" aria-hidden="true">' + esc(o.nummer || '–') + '</span>' +
          '<span class="nur-sr">' + esc(o.name) + (o.nummer ? ', Farbnummer ' + esc(o.nummer) : '') +
          '</span></label></span></li>';
      };

      /* Sichtbar sind die ersten zwoelf Felder — und IMMER das gewaehlte;
         siehe die ausfuehrliche Begruendung in seite-produkt.js. */
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
      return h + '</fieldset>';
    }).join('');
  }

  /* --- 2  Groesse ----------------------------------------------------- */

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
    const gB = grenzen('breite');
    const gL = grenzen('laenge');

    /* Auf dieser Seite steht das Wunschmass ZUERST — dafuer ist sie da.
       Die Standardgroessen kommen als Vorschlaege gleich darunter, damit
       der Kunde sieht, was ohne Zuschlag geht. */
    let h = '<fieldset class="block block--gross">' +
      '<legend class="block__titel">Größe</legend>' +
      '<p class="block__text">Tragen Sie Ihr Maß ein. Passt es nicht in unsere Fertigung, ' +
      'sagen wir Ihnen sofort, in welche Richtung Sie es ändern müssen.</p>';

    h += '<div class="wunschmass" id="wunschmass">' +
      '<div class="wunschmass__felder">' +
      '<div class="feld" id="feld-breite">' +
      '<label for="eingabe-breite">Breite in cm</label>' +
      '<input type="number" id="eingabe-breite" inputmode="numeric" step="1" ' +
      'min="' + esc(zahl(gB.min, 0)) + '" max="' + esc(zahl(gB.max, 0)) + '" ' +
      'value="' + esc(zahl(wahl.breite, 0)) + '" autocomplete="off" aria-describedby="breite-hinweis">' +
      '<p class="feld-hinweis" id="breite-hinweis">Möglich sind ' + esc(zahl(gB.min, 0)) +
      ' bis ' + esc(zahl(gB.max, 0)) + ' cm.</p>' +
      '</div>' +
      '<div class="feld" id="feld-laenge">' +
      '<label for="eingabe-laenge">Länge in cm</label>' +
      '<input type="number" id="eingabe-laenge" inputmode="numeric" step="1" ' +
      'min="' + esc(zahl(gL.min, 0)) + '" max="' + esc(zahl(gL.max, 0)) + '" ' +
      'value="' + esc(zahl(wahl.laenge, 0)) + '" autocomplete="off" aria-describedby="laenge-hinweis">' +
      '<p class="feld-hinweis" id="laenge-hinweis">Möglich sind ' + esc(zahl(gL.min, 0)) +
      ' bis ' + esc(zahl(gL.max, 0)) + ' cm.</p>' +
      '</div></div>';

    h += '<p class="feld-beschriftung mt-4" id="bahnen-titel">Ohne Zuschlag: unsere Bahnbreiten</p>' +
      '<div class="bahnen" role="group" aria-labelledby="bahnen-titel" id="bahnen">' +
      stamm.breitenAuswahl.map((b) =>
        '<label class="bahn"><input type="radio" name="bahn" value="' + esc(b) + '"' +
        (b === wahl.breite ? ' checked' : '') + '><span>' + esc(zahl(b, 0)) + '</span></label>'
      ).join('') + '</div>';

    h += '<p class="hinweis hinweis--warnung mt-4" id="mass-meldung" role="alert" hidden>' +
      '<span class="hinweis__symbol" aria-hidden="true">!</span>' +
      '<span><span class="hinweis__titel" id="mass-titel"></span>' +
      '<span id="mass-rat"></span></span></p>';
    h += '<p class="wunschmass__stand meta" id="wunschmass-stand"></p>';
    h += '</div>';

    /* Standardgroessen als Vorschlaege — mit Mass UND Preis. */
    if (stand.karten.length) {
      h += '<p class="block__text mt-5" id="standard-titel">Oder eine unserer ' +
        'Standardgrößen — Preis je Stück, inklusive Mehrwertsteuer:</p>' +
        '<ul class="groessen" id="groessen" aria-labelledby="standard-titel">' +
        stand.karten.map((g, i) =>
          '<li><label class="groesse">' +
          '<input type="radio" name="groesse" value="' + i + '">' +
          '<span class="groesse__mass">' + esc(g.text) + '</span>' +
          '<span class="groesse__preis">' +
          (g.preisBrutto != null ? esc(euro(g.preisBrutto)) : 'auf Anfrage') + '</span>' +
          '</label></li>'
        ).join('') + '</ul>';
    }

    return h + '</fieldset>';
  }

  /* --- 3  Sonderwuensche ---------------------------------------------- */

  function zusatzHTML() {
    return '<fieldset class="block">' +
      '<legend class="block__titel">Sonderwünsche <span class="block__wert">optional</span></legend>' +
      '<ul class="kreuze">' +
      '<li><label class="kreuz"><input type="checkbox" id="k-form-ohne">' +
      '<span class="kreuz__text">Sonderform ohne Rand<span class="kreuz__zusatz">' +
      'Zuschnitt nach Kontur, freie Verlegung</span></span>' +
      '<span class="kreuz__wert">+30 %</span></label></li>' +
      '<li><label class="kreuz"><input type="checkbox" id="k-form-mit">' +
      '<span class="kreuz__text">Sonderform mit Rand<span class="kreuz__zusatz">' +
      'Konturzuschnitt mit umlaufendem Rand</span></span>' +
      '<span class="kreuz__wert">+50 %</span></label></li>' +
      '<li><label class="kreuz"><input type="checkbox" id="k-sonderfarbe">' +
      '<span class="kreuz__text">Sonderfarbe<span class="kreuz__zusatz">' +
      'Farbe außerhalb der Palette, einmalig je Auftrag</span></span>' +
      '<span class="kreuz__wert">+' + esc(euro(stamm.stammdaten.aufschlagSonderfarbeVK)) + '</span></label></li>' +
      '</ul></fieldset>';
  }

  /* --- 4  Menge ------------------------------------------------------- */

  function mengeHTML() {
    return '<fieldset class="block">' +
      '<legend class="block__titel">Menge</legend>' +
      '<div class="mengenzeile"><div class="menge">' +
      '<button class="menge__knopf" type="button" id="menge-ab" aria-label="Menge um eins verringern">−</button>' +
      '<input class="menge__feld" type="number" id="menge" value="1" min="1" max="999" step="1" ' +
      'inputmode="numeric" aria-label="Menge in Stück">' +
      '<button class="menge__knopf" type="button" id="menge-auf" aria-label="Menge um eins erhöhen">+</button>' +
      '</div><p class="meta mb-0" id="staffel-stand"></p></div></fieldset>';
  }

  /* --- 5  Preis und Abschluss ----------------------------------------- */

  function kaufboxHTML() {
    return '<div class="kaufbox" id="kaufbox">' +
      '<div class="kaufbox__preis" role="status" aria-live="polite" aria-atomic="true">' +
      '<span class="kaufbox__label" id="kaufbox-label">Gesamtpreis</span>' +
      '<span class="kaufbox__betrag" id="preis-brutto">wird berechnet …</span>' +
      '<span class="kaufbox__zusatz" id="preis-zusatz"></span></div>' +

      '<details class="aufstellung" id="aufstellung">' +
      '<summary><span>Netto, Mehrwertsteuer und Versand im Einzelnen</span></summary>' +
      '<dl class="summen" id="summen"></dl>' +
      '<p class="meta mt-4 mb-0" id="rechenweg-text"></p></details>' +

      '<div class="btn-gruppe btn-gruppe--voll mt-5">' +
      '<button class="btn btn--gross" type="submit" id="kaufen">In den Warenkorb</button>' +
      '<button class="btn btn--sekundaer btn--gross" type="button" id="angebot">Angebot anfordern</button>' +
      '</div>' +

      '<div class="feld mt-5"><label for="kommentar">Anmerkung ' +
      '<span class="meta">(optional)</span></label>' +
      '<textarea id="kommentar" maxlength="500" rows="2" ' +
      'placeholder="z. B. Logo-Datei folgt per E-Mail"></textarea></div>' +

      '<p class="meta mt-4">Diese Matte fertigen wir eigens für Sie. Das Bestellsystem ' +
      'führt sie deshalb als Anfrage — bestellt oder bezahlt wird hier nichts.</p>' +

      '<div class="meldung" id="meldung" role="status" aria-live="polite"></div>' +
      '</div>';
  }

  /* ======================================================================
     Bedienung
     ====================================================================== */

  function verdrahten() {
    const form = document.getElementById('konfigurator');

    form.addEventListener('change', (ev) => {
      const el = ev.target;

      if (el.matches('[data-farbgruppe]')) {
        const gi = Number(el.getAttribute('data-farbgruppe'));
        wahl.farben[farbgruppen[gi].feld] = el.value;
        const o = farbgruppen[gi].optionen.find((x) => x.wert === el.value);
        const $n = document.getElementById('farbname-' + gi);
        if ($n && o) $n.textContent = o.name;
        if (gi === 0) bildSetzen();
        neuRechnen();
        return;
      }
      if (el.name === 'bahn') {
        document.getElementById('eingabe-breite').value = String(el.value);
        masseLesen();
        neuRechnen();
        return;
      }
      if (el.name === 'groesse') {
        const g = stand.karten[Number(el.value)];
        document.getElementById('eingabe-breite').value = String(Math.round(g.breite));
        document.getElementById('eingabe-laenge').value = String(Math.round(g.laenge));
        bahnMarkieren();
        masseLesen();
        neuRechnen();
        return;
      }
      if (el.id === 'k-form-ohne')   { wahl.sonderformOhneRand = el.checked; neuRechnen(); return; }
      if (el.id === 'k-form-mit')    { wahl.sonderformMitRand = el.checked; neuRechnen(); return; }
      if (el.id === 'k-sonderfarbe') { wahl.sonderfarbe = el.checked; neuRechnen(); return; }
    });

    let uhr = null;
    form.addEventListener('input', (ev) => {
      const el = ev.target;
      if (el.id === 'eingabe-breite' || el.id === 'eingabe-laenge') {
        window.clearTimeout(uhr);
        uhr = window.setTimeout(() => {
          masseLesen();
          bahnMarkieren();
          /* Eine frei getippte Breite ist kein Griff in die Groessenliste
             mehr — die Auswahl dort wird deshalb aufgehoben. */
          const gew = document.querySelector('[name="groesse"]:checked');
          if (gew) gew.checked = false;
          neuRechnen();
        }, 200);
        return;
      }
      if (el.id === 'kommentar') wahl.kommentar = el.value;
    });

    form.addEventListener('click', (ev) => {
      const knopf = ev.target.closest && ev.target.closest('[data-farbrest]');
      if (!knopf) return;
      const gi = knopf.getAttribute('data-farbrest');
      const liste = document.getElementById('farbrest-' + gi);
      const offen = liste.hidden;
      liste.hidden = !offen;
      knopf.setAttribute('aria-expanded', offen ? 'true' : 'false');
      knopf.textContent = offen ? 'Weniger Farben zeigen'
        : 'Alle ' + farbgruppen[gi].optionen.length + ' Farben anzeigen';
    });

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

    form.addEventListener('submit', (ev) => { ev.preventDefault(); uebernehmen('kauf'); });
    document.getElementById('angebot').addEventListener('click', () => uebernehmen('angebot'));
    const $leiste = document.getElementById('leiste-kaufen');
    if ($leiste) $leiste.addEventListener('click', () => uebernehmen('kauf'));
  }

  function zahlOderNull(v) {
    const s = String(v).trim().replace(',', '.');
    if (s === '') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function masseLesen() {
    wahl.breite = zahlOderNull(document.getElementById('eingabe-breite').value);
    wahl.laenge = zahlOderNull(document.getElementById('eingabe-laenge').value);
  }

  /** Die Bahnbreite markieren, die zur getippten Breite passt — oder keine. */
  function bahnMarkieren() {
    document.querySelectorAll('[name="bahn"]').forEach((r) => {
      r.checked = Number(r.value) === wahl.breite;
    });
  }

  function bildSetzen() {
    const $bild = document.getElementById('pdp-bild');
    if (!$bild || !farbgruppen.length) return;
    const g = farbgruppen[0];
    const wert = wahl.farben[g.feld];
    const neu = A.bild(farbbilder[wert]);
    if (!neu) return;
    const o = g.optionen.find((x) => x.wert === wert);
    $bild.src = neu;
    $bild.alt = 'Matte in der Farbe ' + ((o && o.name) || wert);
  }

  /* ======================================================================
     Preis, Skizze, Rechenweg
     ====================================================================== */

  function neuRechnen() {
    const $betrag = document.getElementById('preis-brutto');
    const $zusatz = document.getElementById('preis-zusatz');
    const $summen = document.getElementById('summen');
    const $meldung = document.getElementById('mass-meldung');
    const $kaufen = document.getElementById('kaufen');

    const ergebnis = preisFuer({
      breite: wahl.breite, laenge: wahl.laenge, menge: wahl.menge,
      sonderformOhneRand: wahl.sonderformOhneRand,
      sonderformMitRand: wahl.sonderformMitRand,
      sonderfarbe: wahl.sonderfarbe
    }, stamm);

    const feldRat = feldgrenzenPruefen();
    skizzeSetzen(!feldRat && ergebnis.ok);

    if (feldRat || !ergebnis.ok) {
      const rat = feldRat || ergebnis.rat;
      $meldung.hidden = false;
      document.getElementById('mass-titel').textContent =
        feldRat ? 'Maß außerhalb unserer Fertigung'
        : ergebnis.r.code === 'ZU_LANG' ? 'Das Maß ist zu lang'
        : ergebnis.r.code === 'ZU_BREIT' ? 'Das Maß ist zu breit'
        : ergebnis.r.code === 'ZU_SCHMAL' ? 'Das Maß ist zu klein'
        : 'Bitte Maß prüfen';
      document.getElementById('mass-rat').textContent = rat;
      $betrag.textContent = '—';
      $zusatz.textContent = 'Sobald das Maß passt, steht der Preis hier.';
      $summen.innerHTML = '';
      $kaufen.disabled = true;
      document.getElementById('dz-schritte').innerHTML = '';
      leisteSetzen(null);
      return;
    }

    $meldung.hidden = true;
    $kaufen.disabled = false;

    const g = ergebnis.gesamt;
    const s = ergebnis.stueck;
    const r = ergebnis.r;

    $betrag.textContent = euro(g.gesamtBrutto);
    $zusatz.textContent = 'inkl. ' + zahl(g.ustSatz, 0) + ' % MwSt. und ' +
      euro(g.versandBrutto) + ' Versand' +
      (wahl.menge > 1 ? ' · ' + euro(s.wareBrutto) + ' je Stück' : '');
    document.getElementById('kaufbox-label').textContent =
      wahl.menge > 1 ? 'Gesamtpreis für ' + zahl(wahl.menge, 0) + ' Stück' : 'Gesamtpreis';

    $summen.innerHTML =
      zeile('Matte ' + zahl(wahl.breite, 0) + ' cm breit × ' + zahl(wahl.laenge, 0) +
            ' cm lang, ' + zahl(wahl.menge, 0) + ' Stück, netto', euro(g.netto)) +
      (r.staffelfaktor < 1
        ? zeile('darin Mengennachlass ab ' + zahl(r.staffelSchwelle, 0) + ' Stück',
                '−' + zahl((1 - r.staffelfaktor) * 100, 0) + ' %') : '') +
      (r.faktorBreite > 1 ? zeile('darin Sondermaß-Zuschlag', '+25 %') : '') +
      (r.aufschlagVK ? zeile('darin Sonderfarbe, einmalig', euro(r.aufschlagVK)) : '') +
      zeile('Umsatzsteuer ' + zahl(g.ustSatz, 0) + ' %', euro(g.ust)) +
      zeile('Ware inkl. MwSt.', euro(g.wareBrutto)) +
      zeile('Versand nach Deutschland, inkl. MwSt.', euro(g.versandBrutto)) +
      zeile('Endpreis', euro(g.gesamtBrutto), true);

    document.getElementById('rechenweg-text').textContent =
      'Der ganze Weg mit den Zellbezügen der Kalkulationstabelle steht ' +
      'weiter unten unter „Rechenweg".';

    const $staffel = document.getElementById('staffel-stand');
    $staffel.textContent = r.staffelfaktor < 1
      ? 'Ab ' + zahl(r.staffelSchwelle, 0) + ' Stück rechnen wir ' +
        zahl((1 - r.staffelfaktor) * 100, 0) + ' % günstiger — ist bereits enthalten.'
      : 'Ab 2 Stück wird es günstiger.';

    document.getElementById('wunschmass-stand').textContent = r.faktorBreite > 1
      ? 'Dieses Maß liegt neben den Bahnbreiten — wir schneiden es aus der Rolle, ' +
        'dafür rechnet die Kalkulation 25 % Zuschlag.'
      : 'Dieses Maß liegt auf einer Bahnbreite — ohne Zuschlag.';

    rechenwegSetzen(r, g);
    leisteSetzen(g.gesamtBrutto);
  }

  function zeile(name, wert, gesamt) {
    return '<div class="summen__zeile' + (gesamt ? ' summen__zeile--gesamt' : '') + '">' +
      '<dt>' + esc(name) + '</dt><dd>' + esc(wert) + '</dd></div>';
  }

  function feldgrenzenPruefen() {
    const pruefe = (feld, wert, achse) => {
      if (!feld) return null;
      if (wert == null) return 'Bitte tragen Sie die ' + achse + ' in ganzen Zentimetern ein.';
      if (Number.isFinite(feld.min) && wert < feld.min) {
        return 'Bitte geben Sie eine größere ' + achse + ' ein — mindestens ' + zahl(feld.min, 0) + ' cm.';
      }
      if (Number.isFinite(feld.max) && wert > feld.max) {
        return 'Bitte geben Sie eine kleinere ' + achse + ' ein — höchstens ' + zahl(feld.max, 0) + ' cm.';
      }
      return null;
    };
    return pruefe(stamm.massX, wahl.breite, 'Breite') ||
           pruefe(stamm.massY, wahl.laenge, 'Länge');
  }

  /** Die Skizze zeigt das Seitenverhaeltnis — mehr soll sie nicht. */
  function skizzeSetzen(gueltig) {
    const $m = document.getElementById('dz-skizze-matte');
    const $s = document.getElementById('dz-skizze');
    if (!$m) return;
    $s.setAttribute('data-gueltig', gueltig ? 'ja' : 'nein');
    if (!gueltig || !wahl.breite || !wahl.laenge) return;
    const laengsteSeite = Math.max(wahl.breite, wahl.laenge);
    $m.style.width = (wahl.breite / laengsteSeite * 100) + '%';
    $m.style.height = (wahl.laenge / laengsteSeite * 100) + '%';
    $m.setAttribute('aria-label',
      'Skizze: ' + zahl(wahl.breite, 0) + ' cm breit, ' + zahl(wahl.laenge, 0) + ' cm lang');
    document.getElementById('dz-skizze-b').textContent = zahl(wahl.breite, 0) + ' cm';
    document.getElementById('dz-skizze-l').textContent = zahl(wahl.laenge, 0) + ' cm';
  }

  /**
   * Der Rechenweg mit Zellbezug. Alle Werte stammen aus dem Rueckgabeobjekt
   * von berechne() — hier wird nichts nachgerechnet, nur ausgeschrieben.
   */
  function rechenwegSetzen(r, g) {
    const $b = document.getElementById('dz-schritte');
    if (!$b) return;
    const z = (zelle, was, wert) =>
      '<tr><th scope="row"><code>' + esc(zelle) + '</code></th><td>' + esc(was) +
      '</td><td class="rechts">' + esc(wert) + '</td></tr>';

    $b.innerHTML =
      z('D4', 'Fläche je Stück', zahl(r.qmProStueck, 4) + ' m²') +
      z('Q5', 'Einkaufs-Listenpreis je m² (Artikelstammdatum)', euro(stamm.stammdaten.ekListenpreisProQm)) +
      z('C2', 'Salesfactor aus dem Colortype (Artikelstammdatum)', zahl(r.salesfactor, 3)) +
      z('R5..V5', 'Mengenstaffel', zahl(r.staffelfaktor, 2)) +
      z('S2', 'Teuerungszuschlag', zahl(r.tzFaktor, 2)) +
      z('L5', 'Faktor Sonderbreite', zahl(r.faktorBreite, 2)) +
      z('M5', 'Faktor Sonderlänge', zahl(r.faktorLaenge, 2)) +
      z('N5', 'Sonderform ohne Rand', zahl(r.faktorFormOhneRand, 2)) +
      z('O5', 'Sonderform mit Rand', zahl(r.faktorFormMitRand, 2)) +
      z('P5', 'Aufschlag Sonderfarbe, einmalig je Auftrag', euro(r.aufschlagVK)) +
      z('G5', 'Verkaufspreis je Stück, netto', euro(runde(r.vkProStueck, 2))) +
      z('F5', 'Verkaufspreis gesamt, netto', euro(runde(r.vkGesamt, 2))) +
      z('—', 'Umsatzsteuer ' + zahl(g.ustSatz, 0) + ' % (steht nicht in der Mappe)', euro(g.ust)) +
      z('—', 'Versand, brutto (steht nicht in der Mappe)', euro(g.versandBrutto)) +
      z('—', 'Endpreis brutto', euro(g.gesamtBrutto));
  }

  function leisteSetzen(brutto) {
    const $w = document.getElementById('leiste-betrag');
    const $k = document.getElementById('leiste-kaufen');
    if (!$w) return;
    $w.textContent = brutto == null ? '—' : euro(brutto);
    if ($k) $k.disabled = brutto == null;
  }

  /* ======================================================================
     Uebernahme — Warenkorb oder Angebot. BESTELLT WIRD NICHTS.
     ====================================================================== */

  function uebernehmen(art) {
    const $meldung = document.getElementById('meldung');
    const $knopf = document.getElementById(art === 'angebot' ? 'angebot' : 'kaufen');
    const beschriftung = $knopf.textContent;

    const werte = {};
    Object.keys(wahl.farben).forEach((f) => { werte[f] = wahl.farben[f]; });
    if (stamm.massX) werte[stamm.massX.feld] = String(wahl.breite);
    if (stamm.massY) werte[stamm.massY.feld] = String(wahl.laenge);
    if (stand.feld && stand.massanfertigung) werte[stand.feld] = stand.massanfertigung;

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
    notizen.push('Wunschmaß ' + zahl(wahl.breite, 0) + ' × ' + zahl(wahl.laenge, 0) + ' cm');
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
        $meldung.innerHTML = A.fehlerbox(antwort, 'Nicht übernommen');
        return;
      }

      const n = typeof antwort.count === 'number' ? antwort.count : null;
      let h = '<p class="hinweis hinweis--erfolg" role="alert">' +
        '<span class="hinweis__symbol" aria-hidden="true">✓</span>' +
        '<span><span class="hinweis__titel">' +
        (art === 'angebot' ? 'Angebotsanfrage vorgemerkt' : 'Als Anfrage übernommen') + '</span>' +
        esc(zahl(wahl.menge, 0) + ' × ' + zahl(wahl.breite, 0) + ' × ' + zahl(wahl.laenge, 0) + ' cm') +
        (n != null ? ' — der Warenkorb enthält jetzt ' + n +
          (n === 1 ? ' Position.' : ' Positionen.') : '.') +
        ' Bestellt oder bezahlt ist damit nichts.</span></p>';

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
        '<a class="btn btn--dezent" href="seite.html?seite=kontakt">Angebot besprechen</a>' +
        '</div>';
      $meldung.innerHTML = h;
    });
  }
})();
