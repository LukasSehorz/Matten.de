/* ==========================================================================
   seite-designer-checkout.js — Bestellformular des Mattendesigners
   (designer-checkout.html, Original /de/custom-mat/checkout, Spec 9.7)
   --------------------------------------------------------------------------
   Das Design kommt aus sessionStorage (seite-designer.js, Schluessel
   net-neu-designer-auftrag: Material, Groesse, Format, Menge, Grundfarbe,
   Designelemente, Kalkulation, Vorschaubild als PNG-Data-URL).

   Das Altsystem matten.de kennt keinen "Designer-Auftrag" und nimmt kein Bild
   entgegen. "Auftrag erteilen" tut deshalb drei Dinge, sichtbar nacheinander
   (Briefing Designer 3.4):
     a) POST /api/cart/add   Anfrageartikel des Materials mit freien Massen
                             (Zwilling "-a" mit spezialoption[<id>][spezial][x|y];
                             nur wenn GET /api/produkt dort BEIDE Masse als freie
                             Zahlenfelder fuehrt — sonst Artikel 569 und das
                             Material im Kommentar). Grundfarbe als
                             attribute[Grundfarbe], Format als attribute[Format],
                             Standardgroesse als attribute[Standardgroesse], wenn
                             der Artikel den Wert woertlich kennt. Der Kommentar
                             traegt alles, was kein Feld tragen kann — inklusive
                             der Kalkulation und des Hinweises auf das Vorschaubild.
     b) POST /api/kasse/adresse   Kundendaten (Feldabbildung siehe FELDER);
                             Bundesland hat im Altsystem kein Feld -> bemerkungen.
                             422 -> Meldung des Altsystems am jeweiligen Feld.
     c) Weiterleitung auf checkout.html#pruefen — dort steht die Vorschau des
                             Altsystems und der einzige unumkehrbare Knopf
                             ("Anfrage abschicken"). Diese Seite loest ihn nie aus.
   Logik portiert aus public/net/assets/js/seite-designer.js (Artikel 569) und
   seite-produkt.js (Zielartikel nach Faehigkeit, Achsentausch, Hinweise).
   ========================================================================== */

import { zahl } from '../../../preisformel.js';

(function () {
  'use strict';

  var S = window.Shell;
  var esc = S.esc;
  var SPEICHER_SCHLUESSEL = 'net-neu-designer-auftrag';
  var KOMMENTAR_MAX = 500;   /* die Bruecke kuerzt den Kommentar auf 500 Zeichen */

  /* Der universelle Wunschmass-Artikel: JetPrint-Logomatte, Anfragezwilling 569
     (x 20-200, y 40-700 als freie Zahlen, GET /api/produkt 10.09.2026). */
  var UNIVERSAL = { pfad: '/logomatten/6300201-logomatte-a', artikelId: 569 };

  /* Vorbelegung fuer Tests (wie checkout.html): im Livesystem sofort als Probe erkennbar. */
  var TEST = { firstName: 'TEST', lastName: 'Sehorz (Bitte ignorieren)', companyName: 'TESTBESTELLUNG – kein echter Auftrag' };

  /* Formularfelder des Originals -> Feld des Altsystems (Kontrakt /api/kasse/adresse).
     pflicht: Original verlangt Anrede, Nachname, Firmenname, Strasse, Stadt,
     Bundesland, PLZ, AGB — das Altsystem Anrede, Vorname, Nachname, Strasse, PLZ,
     Ort, Land, E-Mail, Telefon. Pflicht ist hier, was das Altsystem verlangt
     (sonst 422); Firmenname und Bundesland bleiben sichtbar, aber freiwillig. */
  var FELDER = [
    { name: 'title', de: 'anrede', pflicht: true, label: 'Anrede' },
    { name: 'firstName', de: 'vorname', pflicht: true, label: 'Vorname' },
    { name: 'lastName', de: 'name', pflicht: true, label: 'Nachname' },
    { name: 'companyName', de: 'firma', pflicht: false, label: 'Firmenname' },
    { name: 'streetAddress', de: 'strasse', pflicht: true, label: 'Straße' },
    { name: 'city', de: 'ort', pflicht: true, label: 'Stadt' },
    { name: 'state', de: null, pflicht: false, label: 'Bundesland' },
    { name: 'postalCode', de: 'plz', pflicht: true, label: 'PLZ' },
    { name: 'country', de: 'land', pflicht: true, label: 'Land' },
    { name: 'phone', de: 'telefon', pflicht: true, label: 'Telefon' },
    { name: 'email', de: 'email', pflicht: true, label: 'eMail' },
    { name: 'mobile', de: 'mobil', pflicht: false, label: 'Mobil' },
    { name: 'fax', de: 'fax', pflicht: false, label: 'Fax' }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var feld = function (name) { return $('custom_mat_order_checkout_' + name); };

  var design = null;        /* die Nutzlast aus sessionStorage */
  var ziel = null;          /* Artikel des Altsystems (GET /api/produkt) */
  var zielUniversal = false;
  var zielErsatzFuer = null;
  var warenkorbErledigt = false;   /* Schritt a) nicht wiederholen, wenn b) scheitert */
  var laeuft = false;

  /* ======================================================================
     1  Design lesen und anzeigen
     ====================================================================== */

  function designLesen() {
    try {
      var roh = window.sessionStorage.getItem(SPEICHER_SCHLUESSEL);
      if (!roh) return null;
      var d = JSON.parse(roh);
      if (!d || !d.material || !d.size || !d.baseColor) return null;
      return d;
    } catch (e) { return null; }
  }

  function formatText(o) { return o === 'VERTICAL' ? 'Hochformat' : 'Querformat'; }

  function melde(html) { $('auftrag-meldung').innerHTML = html || ''; }

  function designAnzeigen() {
    var s = design.size;
    $('spec-menge').textContent = String(design.quantity);
    $('spec-mattenart').textContent = design.material.name;
    $('spec-breite').textContent = s.width + ' cm';
    $('spec-laenge').textContent = s.height + ' cm';
    var img = $('matDisplay');
    var dl = $('vorschau-download');
    if (design.bild) {
      img.src = design.bild;
      dl.href = design.bild;
      dl.setAttribute('download', 'mattendesign-' + design.material.name + '-' + s.width + 'x' + s.height + '.' + (design.bildFormat || 'png'));
      dl.hidden = false;
      feld('customMat_image_base64').value = design.bild;
    } else {
      dl.hidden = true;
      melde('<div class="alert alert-warning">Das Vorschaubild konnte nicht übergeben werden (Speicher des Browsers voll) — die Anfrage geht ohne Bild, das Design steht im Kommentar.</div>');
    }
    /* verborgene Spezifikationsfelder des Originals */
    feld('customMat_quantity').value = design.quantity;
    feld('customMat_material').value = String(design.material.id);
    feld('customMat_baseColor').innerHTML = '<option value="' + esc(design.baseColor.id) + '" selected>' + esc(design.baseColor.code + ' ' + design.baseColor.name) + '</option>';
    feld('customMat_width').value = s.width;
    feld('customMat_height').value = s.height;
    feld('customMat_notes').value = design.notes || '';
  }

  /* ======================================================================
     2  Zielartikel des Altsystems
     ====================================================================== */

  function produkt(pfad) {
    return S.hole('/api/produkt?pfad=' + encodeURIComponent(pfad)).then(function (r) {
      return r.ok && r.d && r.d.produkt ? r.d.produkt : null;
    });
  }

  /** Freies Mass (x oder y) als Zahlenfeld aus masse[] — sonst null. */
  function massfeld(a, achse) {
    if (!a) return null;
    var re = new RegExp('\\[' + achse + '\\]$');
    var z = (a.masse || []).filter(function (m) { return re.test(m.feld); })[0];
    return z ? { feld: z.feld, typ: z.typ, min: z.min, max: z.max } : null;
  }

  function beideMasseFrei(a) {
    var x = massfeld(a, 'x'), y = massfeld(a, 'y');
    return !!(x && y && x.typ === 'zahl' && y.typ === 'zahl');
  }

  function kurzname(a) { return String((a && a.pfad) || '').split('/').pop(); }

  /* Zwilling des Materials, wenn er beide Masse als freie Zahlen fuehrt; sonst 569. */
  function zielLaden() {
    var pfad = (design.material && design.material.dePfad) || UNIVERSAL.pfad;
    return produkt(pfad).then(function (p) {
      if (p && beideMasseFrei(p)) return { ziel: p, universal: pfad === UNIVERSAL.pfad, ersatz: null };
      if (pfad === UNIVERSAL.pfad) return { ziel: null, fehler: 'Der Wunschmaß-Artikel ' + pfad + ' ließ sich nicht laden.' };
      return produkt(UNIVERSAL.pfad).then(function (u) {
        if (u && beideMasseFrei(u)) return { ziel: u, universal: true, ersatz: pfad };
        return { ziel: null, fehler: 'Weder ' + pfad + ' noch ' + UNIVERSAL.pfad + ' führen beide Maße als freie Zahlenfelder.' };
      });
    });
  }

  /* "40cm x 60cm", "85cm* x 120cm" -> {a, b} */
  function massAus(text) {
    var m = /(\d+(?:[.,]\d+)?)\s*cm[^x×\d]*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/i.exec(String(text || ''));
    return m ? { a: Number(m[1].replace(',', '.')), b: Number(m[2].replace(',', '.')) } : null;
  }

  function attributMitName(a, re) {
    return (a.attribute || []).filter(function (x) { return re.test(String(x.name || x.feld || '').trim()); })[0] || null;
  }

  /**
   * Die Felder fuer POST /api/cart/add — nur Felder, die der Zielartikel kennt.
   * Liefert dazu Hinweise, was NICHT als Feld uebertragbar war (steht im Kommentar).
   */
  function werteFuer() {
    var werte = {}, hinweise = [];
    var b = design.size.width, l = design.size.height;
    var x = massfeld(ziel, 'x'), y = massfeld(ziel, 'y');
    var passt = function (f, w) { return !!f && f.typ === 'zahl' && (f.min == null || w >= f.min) && (f.max == null || w <= f.max); };
    var grenzen = function (f) { return f ? (f.min == null ? '?' : f.min) + '–' + (f.max == null ? '?' : f.max) + ' cm' : '–'; };
    if (passt(x, b) && passt(y, l)) {
      werte[x.feld] = String(b); werte[y.feld] = String(l);
    } else if (passt(x, l) && passt(y, b)) {
      /* dieselbe Matte, gedreht — die Feldgrenzen des Artikels verlangen es */
      werte[x.feld] = String(l); werte[y.feld] = String(b);
      hinweise.push('Maß gedreht übergeben (x ' + l + ' cm, y ' + b + ' cm), weil die Feldgrenzen von ' + kurzname(ziel) + ' es so verlangen (x ' + grenzen(x) + ', y ' + grenzen(y) + ').');
    } else {
      hinweise.push('Maß ' + b + ' × ' + l + ' cm liegt außerhalb der Feldgrenzen von ' + kurzname(ziel) + ' (x ' + grenzen(x) + ', y ' + grenzen(y) + ') — nur im Kommentar.');
    }

    /* Standardgroesse: passende Option, sonst "Massanfertigung" */
    var g = attributMitName(ziel, /^Standardgr/i);
    if (g) {
      var o = (g.optionen || []).filter(function (op) {
        var m = massAus(op.wert);
        return m && ((m.a === b && m.b === l) || (m.a === l && m.b === b));
      })[0] || (g.optionen || []).filter(function (op) { return /ma[ßs]anfertigung|sondergr/i.test(op.wert); })[0];
      if (o) werte[g.feld] = o.wert;
    }

    /* Grundfarbe: "601-zitronengelb" ueber den Farbcode */
    var gf = attributMitName(ziel, /^Grundfarbe$/i);
    var code = String(design.baseColor.code);
    if (gf) {
      var of = (gf.optionen || []).filter(function (op) { return new RegExp('^' + code + '-').test(String(op.wert)); })[0];
      if (of) werte[gf.feld] = of.wert;
      else hinweise.push('Grundfarbe ' + code + ' ' + design.baseColor.name + ' kennt der Artikel ' + kurzname(ziel) + ' nicht — nur im Kommentar.');
    }

    /* Format: "quer - horizontal" / "hoch - vertical - portrait" */
    var fo = attributMitName(ziel, /^Format$/i);
    if (fo) {
      var will = design.orientation === 'VERTICAL' ? /hoch|vertical|portrait/i : /quer|horizontal/i;
      var oo = (fo.optionen || []).filter(function (op) { return will.test(String(op.wert)); })[0];
      if (oo) werte[fo.feld] = oo.wert;
    }
    return { werte: werte, hinweise: hinweise };
  }

  /* ======================================================================
     3  Kommentar (hoechstens 500 Zeichen — Bruecke kuerzt sonst stumm)
     ====================================================================== */

  function elementText(e) {
    var typ = e.typ === 'textbox' ? 'Text' : e.typ === 'rect' ? 'Rechteck' : e.typ === 'circle' ? 'Kreis' : e.typ === 'image' ? 'Bild' : e.typ;
    var teile = [];
    if (e.typ === 'textbox') {
      teile.push('„' + String(e.text || '').replace(/\s+/g, ' ').slice(0, 60) + '“');
      teile.push((e.fontFamily || '') + (e.fontWeight === 'bold' ? ' fett' : ''));
    }
    if (e.fill) teile.push('Füllung ' + e.fill);
    if (e.stroke && e.strokeWidth) teile.push('Linie ' + e.stroke);
    return typ + (teile.length ? ' (' + teile.join(', ') + ')' : '');
  }

  function elementeKurz(liste) {
    var n = {};
    liste.forEach(function (e) { n[e.typ] = (n[e.typ] || 0) + 1; });
    return Object.keys(n).map(function (k) { return n[k] + '× ' + elementText({ typ: k }); }).join(', ');
  }

  function kommentarFuer(hinweise) {
    var s = design.size, m = design.material, c = design.baseColor, p = design.preis || {};
    var notizen = String((feld('customMat_notes').value || design.notes || '')).replace(/\s+/g, ' ').trim();
    var fest = [
      'MATTENDESIGNER',
      'Material ' + m.name + (zielUniversal && zielErsatzFuer ? ' (Zwilling ' + zielErsatzFuer.split('/').pop() + ' ohne freie Maße, daher Artikel 569)' : zielUniversal && m.name !== 'JetPrint' ? ' (über Artikel 569)' : ''),
      'Breite ' + s.width + ' cm × Länge ' + s.height + ' cm',
      formatText(design.orientation),
      design.quantity + ' Stück',
      'Grundfarbe ' + c.code + ' ' + c.name
    ];
    var kalk = p.ok
      ? 'Kalkulation: netto je Stück ' + zahl(p.nettoStueck, 2) + ' € · netto gesamt ' + zahl(p.nettoGesamt, 2) + ' € · brutto ' + zahl(p.brutto, 2) + ' € (' + p.ustSatz + ' % MwSt., ohne Versand)' +
        (p.faktorBreite > 1 ? ' · Sondermaß ×1,25' : '') + ' · Preisformel Excel (preisformel.js)'
      : 'Kalkulation: nicht möglich' + (p.grund ? ' (' + p.grund + ')' : '') + ' — bitte Angebot';
    var fuss = 'Vorschaubild liegt beim Kunden (PNG-Download)';
    var elemente = design.elemente || [];
    var bau = function (designText, notizText) {
      var t = fest.slice();
      if (designText) t.push('Design: ' + designText);
      if (notizText) t.push('Bemerkungen: ' + notizText);
      t.push(kalk, fuss);
      (hinweise || []).forEach(function (h) { t.push(h); });
      return t.join(' · ');
    };
    var lang = elemente.length ? elemente.map(elementText).join(', ') : 'keine Elemente';
    var k = bau(lang, notizen);
    var gekuerzt = null;
    if (k.length > KOMMENTAR_MAX) {
      k = bau(elementeKurz(elemente), notizen);
      gekuerzt = 'Designelemente nur als Anzahl';
    }
    if (k.length > KOMMENTAR_MAX && notizen) {
      var rest = Math.max(0, KOMMENTAR_MAX - bau(elementeKurz(elemente), '').length - 12);
      k = bau(elementeKurz(elemente), notizen.slice(0, rest) + '…');
      gekuerzt = 'Designelemente nur als Anzahl, Bemerkungen gekürzt';
    }
    if (k.length > KOMMENTAR_MAX) { k = k.slice(0, KOMMENTAR_MAX - 1) + '…'; gekuerzt = 'Kommentar abgeschnitten'; }
    return { text: k, gekuerzt: gekuerzt };
  }

  /* ======================================================================
     4  Kundendaten
     ====================================================================== */

  function laenderFuellen(laender) {
    var sel = feld('country');
    if (!laender || !laender.length) return;
    sel.innerHTML = laender.map(function (l) {
      return '<option value="' + esc(l.wert) + '"' + (l.gewaehlt || l.wert === 'de' ? ' selected' : '') + '>' + esc(l.label) + '</option>';
    }).join('');
  }

  /* Vorbelegung: was das Altsystem schon hat (ein frueherer Versuch), sonst
     Testdaten. Die Antwort der Bruecke kommt verzoegert — was der Kunde bis
     dahin schon getippt hat, bleibt stehen (nur leere Felder werden belegt). */
  function adresseVorbelegen(adresse) {
    var a = adresse || {};
    FELDER.forEach(function (f) {
      var el = feld(f.name);
      if (!el || f.name === 'country' || String(el.value || '').trim()) return;
      var v = f.de ? a[f.de] : '';
      if ((v == null || v === '') && f.name !== 'email' && TEST[f.name]) v = TEST[f.name];
      if (v) el.value = v;
    });
    if (a.land) feld('country').value = a.land;
    var bl = /^Bundesland:\s*(.+)$/.exec(a.bemerkungen || '');
    if (bl && !String(feld('state').value || '').trim()) feld('state').value = bl[1];
  }

  function fehlerLeeren() {
    Array.prototype.forEach.call(document.querySelectorAll('#designer-auftrag .is-invalid'), function (el) { el.classList.remove('is-invalid'); });
    Array.prototype.forEach.call(document.querySelectorAll('#designer-auftrag .invalid-feedback'), function (el) { el.textContent = ''; });
  }

  function feldFehler(name, text) {
    var el = feld(name), m = $('fehler-' + name);
    if (el) el.classList.add('is-invalid');
    if (m) m.textContent = text;
  }

  /* Pflichtfelder (siehe FELDER) und AGB — vor dem ersten Aufruf der Bruecke. */
  function pruefen() {
    fehlerLeeren();
    var erstes = null;
    FELDER.forEach(function (f) {
      var el = feld(f.name);
      if (f.pflicht && el && !String(el.value || '').trim()) {
        feldFehler(f.name, 'Bitte ' + f.label + ' angeben' + (f.de && (f.name === 'email' || f.name === 'phone' || f.name === 'firstName') ? ' — Pflichtfeld des Altsystems matten.de.' : '.'));
        if (!erstes) erstes = el;
      }
    });
    var email = feld('email');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { feldFehler('email', 'Bitte eine gültige E-Mail-Adresse angeben.'); if (!erstes) erstes = email; }
    if (!feld('tos').checked) { feldFehler('tos', 'Bitte die AGB bestätigen.'); if (!erstes) erstes = feld('tos'); }
    if (erstes) erstes.focus();
    return !erstes;
  }

  /* Kundendaten -> Felder des Altsystems (Kontrakt). state -> bemerkungen. */
  function adresseFuer() {
    var a = {};
    FELDER.forEach(function (f) {
      if (!f.de) return;
      var el = feld(f.name);
      a[f.de] = el ? String(el.value || '').trim() : '';
    });
    a.land = String(feld('country').value || 'de').toLowerCase();
    a.agb = !!feld('tos').checked;
    var bundesland = String(feld('state').value || '').trim();
    a.bemerkungen = bundesland ? 'Bundesland: ' + bundesland : '';
    return a;
  }

  /* 422 des Altsystems: Meldung am Feld (Rueckabbildung de -> Formularfeld). */
  function altsystemFehler(liste) {
    var erstes = null;
    (liste || []).forEach(function (f) {
      var eintrag = FELDER.filter(function (x) { return x.de === f.feld; })[0];
      var name = eintrag ? eintrag.name : null;
      if (f.feld === 'agb') name = 'tos';
      var text = f.meldung || f.grund || f.fehler || 'Bitte prüfen.';
      if (name) { feldFehler(name, text); if (!erstes) erstes = feld(name); }
      else schrittDetail(2, (f.feld || '?') + ': ' + text, true);
    });
    if (erstes) erstes.focus();
  }

  /* ======================================================================
     5  Ablauf a) -> b) -> c)
     ====================================================================== */

  function schritt(n, stand, text) {
    var li = document.querySelector('#auftrag-fortschritt li[data-schritt="' + n + '"]');
    if (!li) return;
    li.setAttribute('data-stand', stand);
    var i = li.querySelector('i');
    i.className = 'fas fa-fw ' + (stand === 'laeuft' ? 'fa-spinner fa-spin' : stand === 'ok' ? 'fa-check' : stand === 'fehler' ? 'fa-times' : 'fa-circle');
    if (text != null) li.querySelector('.fortschritt-detail').textContent = text;
  }

  function schrittDetail(n, text, anhaengen) {
    var li = document.querySelector('#auftrag-fortschritt li[data-schritt="' + n + '"] .fortschritt-detail');
    if (!li) return;
    li.textContent = anhaengen && li.textContent ? li.textContent + '\n' + text : text;
  }

  function kaufImKorb(korb) {
    return !!(korb && (korb.items || []).some(function (i) { return i.modus ? i.modus === 'kauf' : i.preisNum != null; }));
  }

  function ablauf(bestaetigt) {
    if (laeuft) return;
    if (!pruefen()) return;
    var korb = S.letzterKorb();
    if (kaufImKorb(korb) && !bestaetigt) {
      melde('<div class="alert alert-warning">Ihr Warenkorb wird damit zur Anfrage — die bereits enthaltenen Artikel werden nicht bestellt, sondern mit angefragt. ' +
        '<button type="button" class="btn btn-sm btn-warning" id="trotzdem">Trotzdem fortfahren</button> ' +
        '<button type="button" class="btn btn-sm btn-link" id="abbrechen">Abbrechen</button></div>');
      $('trotzdem').addEventListener('click', function () { melde(''); ablauf(true); });
      $('abbrechen').addEventListener('click', function () { melde(''); });
      return;
    }
    laeuft = true;
    var knopf = $('auftrag-knopf');
    S.knopfArbeitet(knopf, true);
    $('auftrag-fortschritt').hidden = false;
    melde('');

    var wf = werteFuer();
    var kommentar = kommentarFuer(wf.hinweise);

    var schrittA = warenkorbErledigt ? Promise.resolve(null) : (function () {
      schritt(1, 'laeuft', 'Artikel ' + ziel.pfad + ' (' + (ziel.artikelId || '?') + '), ' + design.quantity + ' Stück …');
      return S.sende('/api/cart/add', { pfad: ziel.pfad, anzahl: design.quantity, werte: wf.werte, kommentar: kommentar.text }).then(function (res) {
        var d = res.d || {};
        if (!res.ok) {
          schritt(1, 'fehler', d.fehler || 'Das Altsystem hat die Position nicht angenommen.');
          throw new Error('warenkorb');
        }
        warenkorbErledigt = true;
        S.warenkorbZaehler(d.count);
        var zeilen = ['Übernommen — der Warenkorb enthält jetzt ' + d.count + (d.count === 1 ? ' Position.' : ' Positionen.')];
        (d.abgelehnt || []).forEach(function (x) { zeilen.push('Abgelehnt: ' + (x.feld || '') + (x.grund ? ' — ' + x.grund : '')); });
        wf.hinweise.forEach(function (h) { zeilen.push(h); });
        if (kommentar.gekuerzt) zeilen.push('Kommentar (max. 500 Zeichen): ' + kommentar.gekuerzt + '.');
        schritt(1, 'ok', zeilen.join('\n'));
        return d;
      });
    })();

    schrittA.then(function () {
      schritt(2, 'laeuft', 'Die Adresse wird im Altsystem geprüft …');
      return S.sende('/api/kasse/adresse', adresseFuer()).then(function (res) {
        var d = res.d || {};
        if (d.gespeichert) { schritt(2, 'ok', 'Gespeichert.'); return d; }
        if (Array.isArray(d.fehler) && d.fehler.length) {
          schritt(2, 'fehler', 'Das Altsystem hat ' + d.fehler.length + ' Feld' + (d.fehler.length === 1 ? '' : 'er') + ' beanstandet — die Meldungen stehen unter den Feldern. Nach der Korrektur erneut „Auftrag erteilen“ (die Warenkorbposition bleibt).');
          altsystemFehler(d.fehler);
        } else {
          schritt(2, 'fehler', (typeof d.fehler === 'string' && d.fehler) || 'Die Adresse konnte nicht gespeichert werden.');
        }
        throw new Error('adresse');
      });
    }).then(function () {
      schritt(3, 'laeuft', 'Weiterleitung …');
      window.location.href = 'checkout.html#pruefen';
    }).catch(function () {
      /* Fehler sind am Schritt vermerkt; der Knopf wird wieder frei. */
    }).then(function () {
      laeuft = false;
      S.knopfArbeitet(knopf, false);
    });
  }

  /* ======================================================================
     6  Start
     ====================================================================== */

  function start() {
    design = designLesen();
    var form = $('designer-auftrag');
    if (!design) {
      melde('<div class="alert alert-warning">Es liegt kein Design vor — bitte Design erneut anlegen: <a href="mattendesigner.html">zum Mattendesigner</a>.</div>');
      $('auftrag-knopf').disabled = true;
      Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (el) { el.disabled = true; });
      return;
    }
    designAnzeigen();

    /* Laender und vorhandene Adresse aus dem Altsystem; Testdaten als Vorbelegung. */
    S.hole('/api/kasse/formular').then(function (res) {
      var d = res.ok ? (res.d || {}) : {};
      laenderFuellen(d.laender || (d.optionen && d.optionen.land && d.optionen.land.optionen) || null);
      adresseVorbelegen(d.adresse || null);
      if (d.warenkorb && kaufImKorb(d.warenkorb)) {
        melde('<div class="alert alert-warning">' + esc(S.GEMISCHT_HINWEIS) + '</div>');
      }
    });

    /* Zielartikel: Zwilling des Materials oder 569. */
    var weg = $('auftrag-weg');
    weg.textContent = 'Der Artikel des Altsystems wird gelesen …';
    zielLaden().then(function (z) {
      if (!z.ziel) {
        weg.innerHTML = '<span class="text-danger">' + esc(z.fehler) + ' Bitte die Seite neu laden oder telefonisch anfragen.</span>';
        $('auftrag-knopf').disabled = true;
        return;
      }
      ziel = z.ziel; zielUniversal = !!z.universal; zielErsatzFuer = z.ersatz || null;
      var wf = werteFuer();
      var text = 'Die Anfrage geht als Anfrageartikel ' + kurzname(ziel) + ' (Artikel ' + (ziel.artikelId || '?') + ') in den Warenkorb des Altsystems matten.de' +
        (zielUniversal && design.material.name !== 'JetPrint' ? ' — das Material ' + design.material.name + ' steht im Kommentar' : '') +
        '; den berechneten Preis bestätigen wir im Angebot. Bestellt wird hier nichts — der letzte Schritt („Anfrage abschicken“) folgt auf der Prüfseite.';
      weg.innerHTML = esc(text) + (wf.hinweise.length ? '<br><span class="text-warning">' + wf.hinweise.map(esc).join('<br>') + '</span>' : '');
    });

    form.addEventListener('submit', function (ev) { ev.preventDefault(); ablauf(false); });

    /* Eine Fehlermarkierung verschwindet, sobald der Kunde das Feld aendert. */
    var markierungLoeschen = function (ev) {
      var el = ev.target;
      if (!el.classList || !el.classList.contains('is-invalid')) return;
      el.classList.remove('is-invalid');
      var m = $('fehler-' + String(el.id || '').replace('custom_mat_order_checkout_', ''));
      if (m) m.textContent = '';
    };
    form.addEventListener('input', markierungLoeschen);
    form.addEventListener('change', markierungLoeschen);
  }

  start();
})();
