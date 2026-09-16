/* ==========================================================================
   seite-checkout.js — Kasse (checkout.html), Briefing 7 + Kontrakt
   --------------------------------------------------------------------------
   Vier Schritte gegen das Altsystem matten.de (portiert aus
   public/net/assets/js/seite-kasse.js, Bootstrap-Markup dieser Seite):

     1  Adresse            POST /api/kasse/adresse   (422 = Feldfehler am Feld)
     2  Versand & Zahlung  POST /api/kasse/optionen
                           Anfragenkorb (warenkorb.modus 'anfrage'|'gemischt'):
                           Versandart anbieten, Zahlungsart weglassen
     3  Pruefen            GET  /api/kasse/vorschau  (art, uebersicht,
                           absendeknopfText, finalRequest)
     4  Ergebnis           POST /api/kasse/bestellen { bestaetigung: 'JA-BESTELLEN' }
                           — loest NUR der Auftraggeber aus.

   Sicherheitsmechanik (nicht abschwaechen): Zahlungsarten nur aus
   optionen (Allowlist), "abgelehnt" nur benennen; Bestellknopf disabled bis
   zum Kaestchen; finalRequest sichtbar, bevor irgendetwas geschickt wird.
   Im Browser wird KEIN Geldbetrag gerechnet — jede Zahl ist eine
   Zeichenkette des Altsystems.
   ========================================================================== */

(function () {
  'use strict';

  var S = window.Shell;
  var esc = S.esc;
  var BESTAETIGUNG = 'JA-BESTELLEN';

  /* Vorbelegung fuer Tests (Briefing 7): ein Datensatz im Livesystem ist so
     sofort als Probe erkennbar. Die E-Mail bleibt leer. */
  var TEST = {
    vorname: 'TEST',
    name: 'Sehorz (Bitte ignorieren)',
    firma: 'TESTBESTELLUNG – kein echter Auftrag',
    bemerkungen: 'TESTBESTELLUNG aus der Brücken-Demo – kein echter Auftrag, bitte nicht ausliefern.'
  };

  var $ = function (id) { return document.getElementById(id); };

  function melde(id, html, art) {
    var el = $(id);
    if (!el) return;
    el.innerHTML = html ? '<div class="alert alert-' + (art || 'info') + '" role="status">' + html + '</div>' : '';
  }

  var laender = [];
  var adressfelder = [];
  var korb = null;
  var vorschau = null;
  var modus = null;      /* 'kauf' | 'anfrage' | 'gemischt' | null */
  var zahlungVersteckt = null;   /* Anfragenkorb: verstecktes Zahlungsart-Feld des Altsystems (optionen.zahlungsart.versteckt) */

  /* ----------------------------------------------------------------------
     Schritte
     ---------------------------------------------------------------------- */
  function zeigeSchritt(n) {
    for (var i = 1; i <= 4; i++) { var s = $('schritt-' + i); if (s) s.hidden = (i !== n); }
    Array.prototype.forEach.call($('fortschritt').querySelectorAll('[data-schritt]'), function (li) {
      var s = Number(li.getAttribute('data-schritt'));
      li.removeAttribute('aria-current');
      if (s < n) li.setAttribute('data-erledigt', 'ja'); else li.removeAttribute('data-erledigt');
      if (s === n) li.setAttribute('aria-current', 'step');
    });
    var titel = $('schritt-' + n).querySelector('h3');
    if (titel) { titel.setAttribute('tabindex', '-1'); titel.focus(); }
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-zurueck]'), function (b) {
    b.addEventListener('click', function () { zeigeSchritt(Number(b.getAttribute('data-zurueck'))); });
  });

  /* ----------------------------------------------------------------------
     Warenkorbtabelle (wie im Modal) und Modus-Hinweis
     ---------------------------------------------------------------------- */
  function zeigeKorb(k) {
    if (!k) return;
    korb = k;
    modus = k.modus || null;
    var zeilen = $('kasse-korb-zeilen');
    var summen = $('kasse-korb-summen');
    var items = k.items || [];
    var anfrage = modus && modus !== 'kauf';
    zeilen.innerHTML = items.length ? items.map(function (p) {
      var b = S.bild(p.bild);
      return '<tr><td>' + (b ? '<img src="' + esc(b) + '" alt="">' : '') + '</td><td></td>' +
        '<td>' + esc(p.name || p.beschreibung || (p.attribut ? '' : 'Artikel ohne Bezeichnung')) +
        (p.attribut ? '<span class="cart-pos-attribut d-block small text-muted">' + esc(p.attribut) + '</span>' : '') +
        (p.kommentar ? '<span class="cart-pos-kommentar d-block small text-muted">' + esc(p.kommentar) + '</span>' : '') + '</td>' +
        '<td class="text-right">' + esc(p.preis || '') + '</td><td class="text-right">' + esc(p.anzahl) + '</td>' +
        '<td class="text-right">' + esc(p.summe || '') + '</td><td></td></tr>';
    }).join('') : '<tr><td colspan="7"><p class="text-center">Your cart is empty.</p></td></tr>';
    var w = function (v) { return !items.length ? '&euro; 0.00' : anfrage ? 'auf Anfrage' : (v ? esc(v) : '&mdash;'); };
    var zeile = function (b, v) { return '<tr><th colspan="5" class="text-right">' + b + '</th><td class="text-right" style="white-space: nowrap;"><strong>' + v + '</strong></td><td></td></tr>'; };
    summen.innerHTML = zeile('Subtotal', w(k.zwischensumme)) + zeile('Versandkosten', w(k.versand)) +
      zeile('VAT ' + (k.ustSatz != null ? esc(Number(k.ustSatz).toFixed(2)) : '19.00') + '%', w(k.umsatzsteuer)) + zeile('Total', w(k.gesamt));
    S.warenkorbZaehler(k.count || 0);

    var m = '';
    if (modus === 'gemischt') m = '<div class="alert alert-warning">' + S.GEMISCHT_HINWEIS + '</div>';
    else if (modus === 'anfrage') m = '<div class="alert alert-info">Dies ist ein <strong>Anfragenkorb</strong>: das Altsystem erzeugt daraus eine Anfrage, keine Bestellung. Die Preise stehen „auf Anfrage“ und werden im Angebot bestätigt.</div>';
    melde('kasse-meldung', '');
    $('kasse-meldung').innerHTML = m;
    $('kasse-titel').textContent = anfrage ? 'Anfrage abschließen' : 'Auschecken';
  }

  /* ----------------------------------------------------------------------
     Schritt 1 — Adresse (Felder und Reihenfolge vom Altsystem)
     ---------------------------------------------------------------------- */
  var BREITE = { anrede: 'col-md-2', vorname: 'col-md-5', name: 'col-md-5', firma: 'col-12', strasse: 'col-12', plz: 'col-md-3', ort: 'col-md-9', land: 'col-md-6', email: 'col-md-6', telefon: 'col-md-4', mobil: 'col-md-4', fax: 'col-md-4', uid: 'col-md-6', bemerkungen: 'col-12' };
  var TYP = { email: 'email', telefon: 'tel', mobil: 'tel', fax: 'tel' };
  var HINWEIS = { email: 'Bitte die eigene Adresse eintragen — dorthin schickt das Altsystem die Bestätigung.', anrede: 'Freies Feld wie im Altsystem, z. B. Herr, Frau oder Firma.' };

  function feldHtml(f, wert) {
    var id = 'f-' + f.name;
    var h = '<div class="' + (BREITE[f.name] || 'col-md-6') + '"><div class="form-group">' +
      '<label for="' + id + '"' + (f.pflicht ? ' class="required"' : '') + '>' + esc(f.label) + '</label>';
    if (f.name === 'land') {
      h += '<select class="form-control" id="' + id + '" name="land">' +
        (laender.length ? laender.map(function (l) {
          return '<option value="' + esc(l.wert) + '"' + ((wert ? l.wert === wert : l.gewaehlt) ? ' selected' : '') + '>' + esc(l.label) + '</option>';
        }).join('') : '<option value="de">Deutschland</option>') + '</select>';
    } else if (f.name === 'bemerkungen') {
      h += '<textarea class="form-control" id="' + id + '" name="bemerkungen" rows="3">' + esc(wert || '') + '</textarea>';
    } else {
      h += '<input type="' + (TYP[f.name] || 'text') + '" class="form-control" id="' + id + '" name="' + esc(f.name) + '" value="' + esc(wert || '') + '">';
    }
    if (HINWEIS[f.name]) h += '<small class="form-text text-muted">' + esc(HINWEIS[f.name]) + '</small>';
    h += '<div class="invalid-feedback" id="e-' + f.name + '"></div></div></div>';
    return h;
  }

  function baueAdresse(felder, werte) {
    adressfelder = felder && felder.length ? felder : [
      { name: 'anrede', label: 'Anrede', pflicht: true }, { name: 'vorname', label: 'Vorname', pflicht: true }, { name: 'name', label: 'Nachname', pflicht: true },
      { name: 'firma', label: 'Firma', pflicht: false }, { name: 'strasse', label: 'Straße', pflicht: true }, { name: 'plz', label: 'PLZ', pflicht: true },
      { name: 'ort', label: 'Ort', pflicht: true }, { name: 'land', label: 'Land', pflicht: true }, { name: 'email', label: 'E-Mail', pflicht: true },
      { name: 'telefon', label: 'Telefon', pflicht: false }, { name: 'mobil', label: 'Mobil', pflicht: false }, { name: 'fax', label: 'Fax', pflicht: false },
      { name: 'uid', label: 'USt-ID', pflicht: false }, { name: 'bemerkungen', label: 'Bemerkungen', pflicht: false }
    ];
    var w = werte || {};
    $('kasse-adresse').innerHTML = adressfelder.map(function (f) {
      var v = w[f.name];
      if ((v == null || v === '') && f.name !== 'email' && TEST[f.name]) v = TEST[f.name];   /* Vorbelegung fuer Tests */
      return feldHtml(f, v);
    }).join('');
  }

  function fehlerLeeren() {
    Array.prototype.forEach.call(document.querySelectorAll('#kasse-adresse .is-invalid'), function (el) { el.classList.remove('is-invalid'); });
    Array.prototype.forEach.call(document.querySelectorAll('#kasse-adresse .invalid-feedback'), function (el) { el.textContent = ''; });
  }

  function fehlerZeigen(liste) {
    var erstes = null;
    (liste || []).forEach(function (f) {
      var el = $('f-' + f.feld);
      var m = $('e-' + f.feld);
      if (el) { el.classList.add('is-invalid'); if (!erstes) erstes = el; }
      if (m) m.textContent = f.meldung || f.grund || 'Bitte prüfen.';
    });
    if (erstes) erstes.focus();
  }

  $('adress-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var knopf = $('adress-knopf');
    fehlerLeeren();
    var werte = {};
    adressfelder.forEach(function (f) { var el = $('f-' + f.name); werte[f.name] = el ? el.value : ''; });
    werte.agb = $('f-agb').checked;
    if (!werte.agb) { melde('adress-melder', 'Bitte die AGB bestätigen.', 'warning'); return; }
    S.knopfArbeitet(knopf, true);
    melde('adress-melder', 'Die Adresse wird an das Altsystem geschickt und dort geprüft …');
    S.sende('/api/kasse/adresse', werte).then(function (res) {
      S.knopfArbeitet(knopf, false);
      var d = res.d || {};
      if (d.gespeichert) {
        melde('adress-melder', '');
        return ladeFormular().then(function () { zeigeSchritt(2); });
      }
      if (Array.isArray(d.fehler) && d.fehler.length) {
        fehlerZeigen(d.fehler);
        melde('adress-melder', 'Das Altsystem hat ' + d.fehler.length + ' Feld' + (d.fehler.length === 1 ? '' : 'er') + ' beanstandet — die Meldungen stehen wörtlich unter den Feldern.', 'danger');
        return null;
      }
      melde('adress-melder', esc((typeof d.fehler === 'string' && d.fehler) || 'Die Adresse konnte nicht gespeichert werden.'), 'danger');
      return null;
    });
  });

  /* ----------------------------------------------------------------------
     Schritt 2 — Versand und Zahlung
     ---------------------------------------------------------------------- */
  function radio(gruppe, o, zusatz) {
    var id = gruppe + '-' + String(o.wert).replace(/[^a-z0-9]/gi, '');
    return '<div class="custom-control custom-radio"><input type="radio" class="custom-control-input" name="' + gruppe + '" id="' + id + '" value="' + esc(o.wert) + '"' + (o.gewaehlt ? ' checked' : '') + '>' +
      '<label class="custom-control-label" for="' + id + '">' + esc(o.label) + (zusatz ? ' <small class="text-muted">' + esc(zusatz) + '</small>' : '') + '</label></div>';
  }

  function zeigeOptionen(opt) {
    if (!opt) return;
    var sel = $('f-lieferland');
    var vorher = sel.value;
    sel.innerHTML = ((opt.land && opt.land.optionen) || []).map(function (l) {
      var g = vorher ? l.wert === vorher : (l.wert === (opt.land.gewaehlt || 'de'));
      return '<option value="' + esc(l.wert) + '"' + (g ? ' selected' : '') + '>' + esc(l.label) + '</option>';
    }).join('') || '<option value="de">Deutschland</option>';

    var versand = (opt.versandart && opt.versandart.optionen) || [];
    $('versand-auswahl').innerHTML = versand.length
      ? versand.map(function (o) { return radio('versandart', o, ''); }).join('')
      : '<p class="small text-muted mb-0">Das Altsystem bietet gerade keine Versandart an.</p>';

    var anfrage = modus && modus !== 'kauf';
    zahlungVersteckt = (opt.zahlungsart && typeof opt.zahlungsart.versteckt === 'string') ? opt.zahlungsart.versteckt : null;
    if (anfrage) {
      $('zahlung-auswahl').innerHTML = '<p class="mb-0">Für eine Anfrage verlangt das Altsystem keine Zahlungsart.</p>';
      $('gesperrt-block').hidden = true;
      return;
    }
    var erlaubte = ((opt.zahlungsart && opt.zahlungsart.optionen) || []).filter(function (o) { return o.erlaubt !== false; });
    $('zahlung-auswahl').innerHTML = erlaubte.length
      ? erlaubte.map(function (o) { return radio('zahlungsart', o, 'Kein Geldfluss — es entsteht nur ein Datensatz.'); }).join('')
      : '<p class="small text-muted mb-0">Keine zulässige Zahlungsart verfügbar.</p>';
    if (!$('zahlung-auswahl').querySelector('input:checked')) { var e = $('zahlung-auswahl').querySelector('input'); if (e) e.checked = true; }
    var gesperrt = (opt.zahlungsart && opt.zahlungsart.abgelehnt) || [];
    $('gesperrt-block').hidden = !gesperrt.length;
    $('gesperrt-liste').textContent = gesperrt.map(function (g) { return g.label + (g.grund ? ' (' + g.grund + ')' : ''); }).join(', ');
  }

  function ladeFormular() {
    return S.hole('/api/kasse/formular').then(function (res) {
      var d = res.d || {};
      if (d.warenkorb) zeigeKorb(d.warenkorb);
      if (d.optionen) zeigeOptionen(d.optionen);
      return d;
    });
  }

  $('optionen-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var knopf = $('optionen-knopf');
    var v = document.querySelector('input[name="versandart"]:checked');
    var z = document.querySelector('input[name="zahlungsart"]:checked');
    var anfrage = modus && modus !== 'kauf';
    if (!anfrage && (!v || !z)) { melde('optionen-melder', 'Bitte Versandart und Zahlungsart wählen.', 'warning'); return; }
    var nutzlast = { land: $('f-lieferland').value || 'de' };
    if (v) nutzlast.versandart = v.value;
    if (!anfrage && z) nutzlast.zahlungsart = z.value;
    /* Anfragenkorb: das Altsystem fuehrt ein verstecktes Zahlungsart-Feld;
       die Bruecke verlangt das Feld auch hier — es wird der versteckte Wert
       geschickt, nie eine Auswahl des Besuchers. */
    if (anfrage && zahlungVersteckt) nutzlast.zahlungsart = zahlungVersteckt;
    S.knopfArbeitet(knopf, true);
    melde('optionen-melder', 'Die Auswahl geht an das Altsystem …');
    S.sende('/api/kasse/optionen', nutzlast).then(function (res) {
      S.knopfArbeitet(knopf, false);
      var d = res.d || {};
      if (!res.ok) {
        /* Beim Anfragenkorb kann das Altsystem die Auswahl ablehnen — die
           Vorschau zeigt dann den tatsaechlichen Stand. */
        melde('optionen-melder', esc(d.fehler || 'Das Altsystem hat die Auswahl nicht angenommen.') + (anfrage ? ' — die Vorschau zeigt den tatsächlichen Stand.' : ''), anfrage ? 'warning' : 'danger');
        if (!anfrage) return;
      } else {
        melde('optionen-melder', '');
        if (d.items) zeigeKorb(d);
        if (d.optionen) zeigeOptionen(d.optionen);
      }
      return ladeVorschau().then(function () { zeigeSchritt(3); });
    });
  });

  /* ----------------------------------------------------------------------
     Schritt 3 — Pruefen
     ---------------------------------------------------------------------- */
  function block(titel, inhalt, zurueck) {
    return '<div class="card mb-2"><div class="card-body py-2"><h5 class="card-title mb-1">' + esc(titel) +
      (zurueck ? ' <button type="button" class="btn btn-link btn-sm p-0" data-zurueck="' + zurueck + '">ändern</button>' : '') +
      '</h5><div class="small" style="white-space: pre-wrap">' + inhalt + '</div></div></div>';
  }

  function zeigeVorschau(v) {
    var ziel = $('pruef-blocks');
    var u = v.uebersicht;
    var art = v.art || (u && /anfrage/i.test(u.absendeknopfText || '') ? 'anfrage' : (u && u.absendeknopf ? 'bestellung' : null));
    var h = '';
    if (v.warenkorb && v.warenkorb.modus === 'gemischt') h += '<div class="alert alert-warning">' + S.GEMISCHT_HINWEIS + '</div>';
    if (!u) {
      h += '<div class="alert alert-warning">Das Altsystem gibt die Übersichtsseite noch nicht heraus' + (v.umleitung ? ' — es leitet auf <code>' + esc(v.umleitung) + '</code> um.' : '.') + '</div>';
    } else {
      $('pruef-titel').textContent = 'Prüfen — ' + (u.korb || (art === 'anfrage' ? 'Anfragenkorb' : 'Warenkorb'));
      h += block('Lieferadresse', esc(u.adresseText || '(keine Adresse hinterlegt)') + (u.bemerkungen ? '\n\nBemerkungen: ' + esc(u.bemerkungen) : ''), 1);
      h += block('Positionen', (u.items || []).map(function (p) {
        return esc(p.anzahl) + ' × ' + esc(p.beschreibung || p.name || '') + (p.attribut ? ' (' + esc(p.attribut) + ')' : '') + (p.summe ? ' — ' + esc(p.summe) : '');
      }).join('\n') || '(leer)');
      if (art === 'anfrage') {
        h += block('Beträge', 'Anfrage — das Altsystem nennt keine Summen. Der berechnete Preis steht im Kommentar jeder Position und wird im Angebot bestätigt.');
      } else {
        h += block('Beträge laut Altsystem', 'Zwischensumme: ' + esc(u.zwischensumme || '—') + '\nVersandkosten: ' + esc(u.versand || '—') +
          '\nUmsatzsteuer' + (u.ustSatz != null ? ' (' + esc(u.ustSatz) + ' %)' : '') + ': ' + esc(u.umsatzsteuer || '—') + '\nGesamtsumme: ' + esc(u.gesamt || '—'));
      }
      var vers = (((v.optionen || {}).versandart || {}).optionen || []).filter(function (o) { return o.gewaehlt; })[0];
      h += block('Versand und Zahlung', 'Versandart: ' + esc(vers ? vers.label : (((v.optionen || {}).versandart || {}).gewaehlt || '—')) +
        '\nZahlungsart: ' + esc(u.zahlungsartText || (art === 'anfrage' ? 'keine (Anfrage)' : (((v.optionen || {}).zahlungsart || {}).gewaehlt || '—'))) +
        '\nEs fließt kein Geld — es entsteht nur ein Datensatz.', 2);
    }
    ziel.innerHTML = h;
    ziel.removeAttribute('aria-busy');
    Array.prototype.forEach.call(ziel.querySelectorAll('[data-zurueck]'), function (b) {
      b.addEventListener('click', function () { zeigeSchritt(Number(b.getAttribute('data-zurueck'))); });
    });
    $('roh-inhalt').textContent = JSON.stringify(v.finalRequest || null, null, 2);

    /* Knopf: Beschriftung woertlich vom Altsystem, gruen bei Anfrage (wie dort) */
    var knopf = $('bestell-knopf');
    knopf.textContent = (u && u.absendeknopfText) || (art === 'anfrage' ? 'Anfrage abschicken' : 'Bestellung abschicken');
    knopf.classList.toggle('btn-success', art === 'anfrage');
    knopf.classList.toggle('btn-primary', art !== 'anfrage');
    $('scharf-text').textContent = 'Mir ist bewusst, dass dies eine echte ' + (art === 'anfrage' ? 'Anfrage' : 'Bestellung') + ' im Live-System matten.de erzeugt.';

    var bereit = v.bereit === true;
    var schalter = $('scharf-schalter');
    schalter.disabled = !bereit;
    if (!bereit) schalter.checked = false;
    melde('pruef-melder', bereit
      ? 'Das Altsystem zeigt den Knopf „' + esc(knopf.textContent) + '“ an — der Abschluss wäre jetzt möglich.'
      : 'Der Abschluss ist noch nicht möglich:<ul class="mb-0">' + (v.huerden || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>',
      bereit ? 'info' : 'warning');
    pruefeScharf();
  }

  function ladeVorschau() {
    melde('pruef-melder', 'Der Stand wird frisch aus dem Altsystem gelesen …');
    return S.hole('/api/kasse/vorschau').then(function (res) {
      vorschau = res.d || {};
      if (!res.ok && !vorschau.uebersicht) {
        melde('pruef-melder', 'Der Stand ließ sich nicht lesen: ' + esc(vorschau.fehler || ('HTTP ' + res.http)), 'danger');
      }
      zeigeVorschau(vorschau);
      if (vorschau.warenkorb) zeigeKorb(vorschau.warenkorb);
      return vorschau;
    });
  }

  function pruefeScharf() {
    var frei = !!(vorschau && vorschau.bereit === true) && $('scharf-schalter').checked;
    $('bestell-knopf').disabled = !frei;
  }
  $('scharf-schalter').addEventListener('change', pruefeScharf);
  $('pruef-neu').addEventListener('click', function () { ladeVorschau(); });

  /* ----------------------------------------------------------------------
     Schritt 4 — Absenden und Ergebnis (nur durch den Auftraggeber)
     ---------------------------------------------------------------------- */
  $('bestell-knopf').addEventListener('click', function () {
    if (!$('scharf-schalter').checked) return;
    if (!vorschau || vorschau.bereit !== true) return;
    var knopf = this;
    S.knopfArbeitet(knopf, true);
    melde('bestell-melder', 'Wird an matten.de geschickt …');
    S.sende('/api/kasse/bestellen', { bestaetigung: BESTAETIGUNG }).then(function (res) {
      var d = res.d || {};
      if (!res.ok || d.ok !== true) {
        melde('bestell-melder', esc(d.fehler || 'Das Altsystem hat den Abschluss nicht angenommen.') +
          ((d.huerden || []).length ? '<ul class="mb-0">' + d.huerden.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
          (d.art ? '<p class="mb-0 small">Art laut Brücke: ' + esc(d.art) + '</p>' : ''), 'danger');
        S.knopfArbeitet(knopf, false);
        return;
      }
      melde('bestell-melder', '');
      zeigeErgebnis(d);
      zeigeSchritt(4);
      S.hole('/api/cart').then(function (r) { if (r.ok) zeigeKorb(r.d); });
    });
  });

  function zeigeErgebnis(d) {
    var anfrage = d.art === 'anfrage';
    $('ergebnis').innerHTML =
      '<div class="alert alert-success">Das Altsystem hat die ' + (anfrage ? 'Anfrage' : 'Bestellung') + ' angenommen' +
        (d.finalUrl ? ' — Antwortseite <code>' + esc(d.finalUrl) + '</code>' : '') + (d.status ? ' (HTTP ' + esc(d.status) + ')' : '') + '.</div>' +
      (d.bestellnummer
        ? '<p class="mb-1 text-muted small">' + (anfrage ? 'Anfragenummer' : 'Bestellnummer') + ' laut Altsystem</p><p class="kasse-ergebnis-nummer">' + esc(d.bestellnummer) + '</p>'
        : '<div class="alert alert-info">Die Dankeseite des Altsystems nennt keine Nummer.</div>') +
      '<h5>Antwort des Altsystems im Wortlaut</h5><p class="kasse-rohantwort">' + esc(d.rohantwort || '(leer)') + '</p>' +
      '<div class="alert alert-warning">Der Datensatz steht jetzt im Verwaltungsbereich von matten.de und muss nach der Prüfung dort gelöscht werden.</div>' +
      '<details class="kasse-roh mb-3"><summary>Was abgeschickt wurde</summary><pre>' + esc(JSON.stringify(d.gesendet || null, null, 2)) + '</pre></details>' +
      '<a class="btn btn-secondary" href="/api/kasse/raw" target="_blank" rel="noopener">Rohe Antwortseite öffnen</a> ' +
      '<a class="btn btn-outline-secondary" href="index.html">Zur Startseite</a>';
  }

  /* ----------------------------------------------------------------------
     Start
     ---------------------------------------------------------------------- */
  function start() {
    melde('kasse-meldung', 'Warenkorb und Formular werden aus dem Altsystem gelesen …');
    S.hole('/api/kasse/formular').then(function (res) {
      var d = res.d || {};
      if (!res.ok) {
        melde('kasse-meldung', esc(d.fehler || 'Das Bestellsystem hat nicht geantwortet.') + ' Läuft die Brücke auf Port 8787?', 'danger');
        return;
      }
      laender = d.laender && d.laender.length ? d.laender : (d.optionen && d.optionen.land ? d.optionen.land.optionen : []);
      if (d.warenkorb) zeigeKorb(d.warenkorb);
      var leer = !d.warenkorb || !(d.warenkorb.items || []).length;
      if (leer) {
        /* Original: 302 auf /de bei leerem Warenkorb */
        $('kasse-meldung').innerHTML = '<div class="alert alert-info">Ihr Warenkorb ist leer. <a href="index.html">Zur Startseite</a></div>';
        $('kasse-schritte-bereich').hidden = true;
        return;
      }
      $('kasse-schritte-bereich').hidden = false;
      baueAdresse(d.adressfelder, d.adresse);
      if (d.optionen) zeigeOptionen(d.optionen);
      $('konto-status').textContent = d.konto && d.konto.eingeloggt
        ? 'Diese Sitzung ist beim Altsystem angemeldet.'
        : 'Sie sind nicht angemeldet — das Altsystem nimmt Gastbestellungen an.';
    });
  }

  start();
})();
