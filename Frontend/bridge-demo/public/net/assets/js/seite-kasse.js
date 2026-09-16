/* ==========================================================================
   matten.net — Kasse
   --------------------------------------------------------------------------
   Vier Schritte, jeder einzeln gegen das Altsystem matten.de geprueft:

     1  Adresse            POST /api/kasse/adresse   (422 = Feldfehler)
     2  Versand & Zahlung  POST /api/kasse/optionen
     3  Pruefen            GET  /api/kasse/vorschau
     4  Ergebnis           POST /api/kasse/bestellen (nur mit Bestaetigung)

   Sicherheitsmechanik — nicht abschwaechen:
     * Waehlbar sind ausschliesslich die Zahlungsarten, die der Server als
       "erlaubt" meldet (VorkassePayment, RechnungPayment). Alles unter
       "abgelehnt" wird nur benannt, nie als Bedienelement angeboten.
     * Der Bestellknopf traegt "disabled", solange das Kaestchen nicht
       gesetzt ist — nicht nur optisch.
     * Der aufklappbare Block "Was genau abgeschickt wird" zeigt den
       finalRequest der Vorschau roh, bevor irgendetwas abgeschickt wird.
     * Es wird im Browser KEIN Geldbetrag gerechnet. Jede Zahl auf dieser
       Seite ist eine Zeichenkette aus dem Altsystem.
   ========================================================================== */

(function () {
  'use strict';

  var BESTAETIGUNG = 'JA-BESTELLEN';

  /* ----------------------------------------------------------------------
     Helfer
     ---------------------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Meldebereich fuellen. Leerer Text blendet ihn aus (CSS: .melder:empty). */
  function melde(id, html, art) {
    var el = $(id);
    if (!el) return;
    if (!html) { el.innerHTML = ''; el.removeAttribute('data-art'); return; }
    el.setAttribute('data-art', art || 'info');
    el.innerHTML =
      (art === 'laedt' ? '<span class="melder__dreher" aria-hidden="true"></span>' : '') +
      '<span>' + html + '</span>';
  }

  function hole(pfad) {
    return fetch(pfad, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json().catch(function () { return {}; })
          .then(function (d) { return { http: r.status, ok: r.ok, d: d }; });
      });
  }

  function sende(pfad, nutzlast) {
    return fetch(pfad, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(nutzlast || {})
    }).then(function (r) {
      return r.json().catch(function () { return {}; })
        .then(function (d) { return { http: r.status, ok: r.ok, d: d }; });
    });
  }

  function knopfArbeitet(knopf, ja, text) {
    if (!knopf) return;
    if (ja) {
      knopf.dataset.text = knopf.dataset.text || knopf.textContent;
      knopf.disabled = true;
      knopf.setAttribute('aria-busy', 'true');
      if (text) knopf.textContent = text;
    } else {
      knopf.disabled = false;
      knopf.removeAttribute('aria-busy');
      if (knopf.dataset.text) knopf.textContent = knopf.dataset.text;
    }
  }

  /* ----------------------------------------------------------------------
     Zustand
     ---------------------------------------------------------------------- */

  var laender = [];          /* Laenderliste des Altsystems               */
  var adressfelder = [];     /* Feldliste des Altsystems, in dessen Reihenfolge */
  var vorschau = null;       /* letzte gelesene Vorschau                  */
  var schritt = 1;

  /* ----------------------------------------------------------------------
     Schrittsteuerung
     ---------------------------------------------------------------------- */

  function zeigeSchritt(n) {
    schritt = n;
    for (var i = 1; i <= 4; i++) {
      var abschnitt = $('schritt-' + i);
      if (abschnitt) abschnitt.hidden = (i !== n);
    }
    Array.prototype.forEach.call($('fortschritt').querySelectorAll('[data-schritt]'), function (li) {
      var s = Number(li.getAttribute('data-schritt'));
      li.removeAttribute('aria-current');
      if (s < n) li.setAttribute('data-erledigt', 'ja');
      else li.removeAttribute('data-erledigt');
      if (s === n) li.setAttribute('aria-current', 'step');
    });

    var titel = $('schritt-' + n).querySelector('h2');
    if (titel) titel.focus();

    var sanft = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    window.scrollTo({ top: 0, behavior: sanft ? 'smooth' : 'auto' });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-zurueck]'), function (b) {
    b.addEventListener('click', function () { zeigeSchritt(Number(b.getAttribute('data-zurueck'))); });
  });

  /* ----------------------------------------------------------------------
     Seitenspalte: Positionen und Summen
     ---------------------------------------------------------------------- */

  function zeigeUebersicht(korb) {
    var liste = $('uebersicht-positionen');
    var summen = $('uebersicht-summen');
    if (!korb) return;

    var posten = korb.items || [];
    if (!posten.length) {
      liste.innerHTML = '<li class="klein gedeckt">Der Warenkorb ist leer. ' +
        '<a href="warenkorb.html">Zurück zum Warenkorb</a></li>';
    } else {
      liste.innerHTML = posten.map(function (p) {
        return '<li class="korb-pos korb-pos--schmal">' +
          '<div>' +
            '<p class="korb-pos__name">' + esc(p.name || 'Artikel') + '</p>' +
            (p.attribut ? '<p class="klein gedeckt">' + esc(p.attribut) + '</p>' : '') +
            (p.kommentar ? '<p class="klein gedeckt">Bemerkung: ' + esc(p.kommentar) + '</p>' : '') +
            '<p class="klein gedeckt">Menge ' + esc(p.anzahl) +
              (p.summe ? ' · <span class="zahl">' + esc(p.summe) + '</span>' : '') + '</p>' +
          '</div></li>';
      }).join('');
    }
    liste.removeAttribute('aria-busy');

    function zeile(bez, wert, gesamt) {
      if (!wert) return '';
      return '<div class="summen__zeile' + (gesamt ? ' summen__zeile--gesamt' : '') + '">' +
        '<dt>' + esc(bez) + '</dt><dd class="zahl">' + esc(wert) + '</dd></div>';
    }
    var ust = 'Umsatzsteuer' + (korb.ustSatz != null ? ' (' + korb.ustSatz + ' %)' : '');
    summen.innerHTML =
      zeile('Zwischensumme', korb.zwischensumme) +
      zeile('Versand', korb.versand) +
      zeile(ust, korb.umsatzsteuer) +
      zeile('Gesamt', korb.gesamt, true) ||
      '<div class="summen__zeile summen__zeile--gesamt"><dt>Gesamt</dt><dd class="zahl">—</dd></div>';
    summen.removeAttribute('aria-busy');

    if (window.NetShell) window.NetShell.warenkorbSetzen(korb.count || 0);
  }

  /* ----------------------------------------------------------------------
     Schritt 1 — Adressformular
     --------------------------------------------------------------------------
     Die Felder und ihre Reihenfolge kommen aus dem Altsystem
     (/api/kasse/formular, Feld "adressfelder"). Hier wird nur entschieden,
     welches Bedienelement zu einem Feld passt und wie breit es steht.
     ---------------------------------------------------------------------- */

  var BREITE = {
    anrede: 'drittel', vorname: 'zwei', name: 'halb', firma: 'halb',
    plz: 'drittel', ort: 'zwei', land: 'halb', email: 'halb',
    telefon: 'halb', mobil: 'halb', fax: 'halb', uid: 'halb'
  };

  var EIGENSCHAFTEN = {
    anrede:  { typ: 'text',     autocomplete: 'honorific-prefix', hinweis: 'Wie im Altsystem ein freies Feld — üblich sind „Herr“, „Frau“ oder „Firma“.' },
    vorname: { typ: 'text',     autocomplete: 'given-name' },
    name:    { typ: 'text',     autocomplete: 'family-name' },
    firma:   { typ: 'text',     autocomplete: 'organization' },
    strasse: { typ: 'text',     autocomplete: 'street-address' },
    plz:     { typ: 'text',     autocomplete: 'postal-code', inputmode: 'numeric' },
    ort:     { typ: 'text',     autocomplete: 'address-level2' },
    land:    { typ: 'select',   autocomplete: 'country' },
    email:   { typ: 'email',    autocomplete: 'email' },
    telefon: { typ: 'tel',      autocomplete: 'tel' },
    mobil:   { typ: 'tel',      autocomplete: 'tel' },
    fax:     { typ: 'tel' },
    uid:     { typ: 'text',     hinweis: 'Nur für Firmen, z. B. DE123456789.' },
    bemerkungen: { typ: 'textarea', hinweis: 'Wünsche zur Anlieferung, Tor, Ansprechpartner …' }
  };

  function feldHtml(feld, praefix, wert) {
    var name = praefix + feld.name;
    var id = 'f-' + name;
    var eig = EIGENSCHAFTEN[feld.name] || { typ: 'text' };
    var breite = BREITE[feld.name] || '';
    var pflicht = !!feld.pflicht && !praefix;   /* im Rechnungsblock prueft nur das Altsystem */
    var hinweisId = eig.hinweis ? id + '-hinweis' : '';
    var fehlerId = 'e-' + name;
    var beschrieben = [hinweisId].filter(Boolean).join(' ');

    var h = '<div class="feld" data-feld="' + esc(name) + '"' +
            (breite ? ' data-breite="' + breite + '"' : '') + '>';
    h += '<label for="' + esc(id) + '">' + esc(feld.label) +
         (pflicht ? ' <span class="feld-pflicht" aria-hidden="true">*</span>' : '') + '</label>';

    if (eig.typ === 'select') {
      h += '<select id="' + esc(id) + '" name="' + esc(name) + '"' +
           (eig.autocomplete ? ' autocomplete="' + eig.autocomplete + '"' : '') +
           (beschrieben ? ' aria-describedby="' + beschrieben + '"' : '') + '>';
      if (!laender.length) {
        h += '<option value="de">Deutschland</option>';
      } else {
        laender.forEach(function (l) {
          var gewaehlt = wert ? l.wert === wert : l.gewaehlt;
          h += '<option value="' + esc(l.wert) + '"' + (gewaehlt ? ' selected' : '') + '>' +
               esc(l.label) + '</option>';
        });
      }
      h += '</select>';
    } else if (eig.typ === 'textarea') {
      h += '<textarea id="' + esc(id) + '" name="' + esc(name) + '" rows="3"' +
           (beschrieben ? ' aria-describedby="' + beschrieben + '"' : '') + '>' +
           esc(wert || '') + '</textarea>';
    } else {
      h += '<input type="' + eig.typ + '" id="' + esc(id) + '" name="' + esc(name) + '"' +
           ' value="' + esc(wert || '') + '"' +
           (eig.autocomplete ? ' autocomplete="' + eig.autocomplete + '"' : '') +
           (eig.inputmode ? ' inputmode="' + eig.inputmode + '"' : '') +
           (beschrieben ? ' aria-describedby="' + beschrieben + '"' : '') + '>';
    }

    if (eig.hinweis) {
      h += '<p class="feld-hinweis" id="' + hinweisId + '">' + esc(eig.hinweis) + '</p>';
    }
    h += '<p class="feld-fehler" id="' + fehlerId + '" hidden></p>';
    h += '</div>';
    return h;
  }

  function baueAdressfelder(felder, werte) {
    adressfelder = felder || [];
    var ziel = $('adress-felder');
    ziel.innerHTML = adressfelder.map(function (f) {
      return feldHtml(f, '', werte ? werte[f.name] : '');
    }).join('');
    ziel.removeAttribute('aria-busy');

    /* Rechnungsanschrift: dieselben Felder, die das Altsystem dafuer kennt. */
    var RECHNUNG = ['anrede', 'vorname', 'name', 'firma', 'strasse', 'plz', 'ort', 'land', 'email'];
    var rZiel = $('rechnung-felder');
    rZiel.innerHTML = RECHNUNG.map(function (n) {
      var basis = adressfelder.filter(function (f) { return f.name === n; })[0] ||
                  { name: n, label: n, pflicht: false };
      return feldHtml({ name: n, label: basis.label, pflicht: false }, 'rechnung_', '');
    }).join('');
  }

  $('abweichende-rechnung').addEventListener('change', function () {
    $('rechnung-felder').hidden = !this.checked;
  });

  /* --- Fehler des Altsystems an die Felder haengen ----------------------- */

  function fehlerLeeren() {
    Array.prototype.forEach.call(document.querySelectorAll('.feld[data-feld]'), function (box) {
      box.classList.remove('feld--fehler');
      var p = box.querySelector('.feld-fehler');
      if (p) { p.hidden = true; p.textContent = ''; }
      var ein = box.querySelector('input, select, textarea');
      if (ein) {
        ein.removeAttribute('aria-invalid');
        /* nur die Fehlerbeschreibung entfernen, Hinweise bleiben */
        var b = (ein.getAttribute('aria-describedby') || '')
          .split(/\s+/).filter(function (x) { return x && x.indexOf('e-') !== 0; }).join(' ');
        if (b) ein.setAttribute('aria-describedby', b); else ein.removeAttribute('aria-describedby');
      }
    });
  }

  function fehlerZeigen(liste) {
    var erstes = null;
    (liste || []).forEach(function (f) {
      var box = document.querySelector('.feld[data-feld="' + (f.feld || '').replace(/"/g, '') + '"]');
      if (!box) return;
      box.classList.add('feld--fehler');
      var p = box.querySelector('.feld-fehler');
      if (p) { p.textContent = f.meldung; p.hidden = false; }
      var ein = box.querySelector('input, select, textarea');
      if (ein) {
        ein.setAttribute('aria-invalid', 'true');
        var b = (ein.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        if (p && b.indexOf(p.id) === -1) b.push(p.id);
        ein.setAttribute('aria-describedby', b.join(' '));
        if (!erstes) erstes = ein;
      }
    });
    if (erstes) erstes.focus();
  }

  function adressNutzlast() {
    var werte = {};
    adressfelder.forEach(function (f) {
      var el = $('f-' + f.name);
      werte[f.name] = el ? el.value : '';
    });
    werte.agb = $('f-agb').checked;

    if ($('abweichende-rechnung').checked) {
      werte.abweichende_rechnung = true;
      ['anrede', 'vorname', 'name', 'firma', 'strasse', 'plz', 'ort', 'land', 'email']
        .forEach(function (n) {
          var el = $('f-rechnung_' + n);
          werte['rechnung_' + n] = el ? el.value : '';
        });
    }
    return werte;
  }

  $('adress-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var knopf = $('adress-knopf');
    fehlerLeeren();
    melde('adress-melder', 'Die Adresse wird an das Altsystem geschickt und dort geprüft …', 'laedt');
    knopfArbeitet(knopf, true, 'Wird geprüft …');

    sende('/api/kasse/adresse', adressNutzlast())
      .then(function (res) {
        var d = res.d || {};
        if (d.gespeichert) {
          melde('adress-melder', 'Das Altsystem hat die Adresse angenommen.', 'gut');
          return ladeOptionen().then(function () { zeigeSchritt(2); });
        }
        if (Array.isArray(d.fehler) && d.fehler.length) {
          fehlerZeigen(d.fehler);
          var offen = d.fehler.filter(function (f) {
            return !document.querySelector('.feld[data-feld="' + (f.feld || '').replace(/"/g, '') + '"]');
          });
          melde('adress-melder',
            'Das Altsystem hat ' + d.fehler.length + ' Feld' +
            (d.fehler.length === 1 ? '' : 'er') + ' beanstandet. Die Meldungen stehen wörtlich ' +
            'unter den betroffenen Feldern.' +
            (offen.length
              ? '<ul>' + offen.map(function (f) {
                  return '<li>' + esc(f.feld || 'Formular') + ': ' + esc(f.meldung) + '</li>';
                }).join('') + '</ul>'
              : ''),
            'fehler');
          return null;
        }
        throw new Error(typeof d.fehler === 'string' && d.fehler
          ? d.fehler : 'Die Adresse konnte nicht gespeichert werden.');
      })
      .catch(function (err) { melde('adress-melder', esc(err.message), 'fehler'); })
      .then(function () { knopfArbeitet(knopf, false); });
  });

  /* ----------------------------------------------------------------------
     Schritt 2 — Versand und Zahlung
     ---------------------------------------------------------------------- */

  function wahlkarte(gruppe, o, zusatz) {
    return '<label class="wahlkarte">' +
      '<input type="radio" name="' + gruppe + '" value="' + esc(o.wert) + '"' +
        (o.gewaehlt ? ' checked' : '') + '>' +
      '<span><span class="wahlkarte__titel">' + esc(o.label) + '</span>' +
        (zusatz ? '<span class="wahlkarte__text">' + zusatz + '</span>' : '') +
        '<span class="wahlkarte__technik">' + esc(o.wert) + '</span></span>' +
      '</label>';
  }

  function zeigeOptionen(opt) {
    if (!opt) return;

    /* Lieferland */
    var sel = $('f-lieferland');
    var vorher = sel.value;
    sel.innerHTML = (opt.land.optionen || []).map(function (l) {
      var gewaehlt = vorher ? l.wert === vorher : (l.wert === opt.land.gewaehlt);
      return '<option value="' + esc(l.wert) + '"' + (gewaehlt ? ' selected' : '') + '>' +
             esc(l.label) + '</option>';
    }).join('') || '<option value="de">Deutschland</option>';

    /* Versandart */
    $('versand-auswahl').innerHTML =
      (opt.versandart.optionen || []).map(function (o) {
        return wahlkarte('versandart', o, 'Die Kosten rechnet das Altsystem.');
      }).join('') ||
      '<p class="klein gedeckt">Das Altsystem bietet gerade keine Versandart an.</p>';

    /* Zahlungsart — NUR was der Server als erlaubt meldet. */
    var erlaubte = (opt.zahlungsart.optionen || []).filter(function (o) { return o.erlaubt !== false; });
    $('zahlung-auswahl').innerHTML =
      erlaubte.map(function (o) {
        return wahlkarte('zahlungsart', o, 'Kein Geldfluss — es entsteht nur ein Datensatz.');
      }).join('') ||
      '<p class="klein gedeckt">Keine zulässige Zahlungsart verfügbar.</p>';
    if (!$('zahlung-auswahl').querySelector('input:checked')) {
      var erstes = $('zahlung-auswahl').querySelector('input');
      if (erstes) erstes.checked = true;
    }

    /* Gesperrtes benennen, aber nicht anbieten. */
    var gesperrt = opt.zahlungsart.abgelehnt || [];
    $('gesperrt-block').hidden = !gesperrt.length;
    $('gesperrt-liste').innerHTML = gesperrt.map(function (g) {
      return '<li><strong>' + esc(g.label) + '</strong><span>' + esc(g.grund || '') +
             '</span><code>' + esc(g.wert) + '</code></li>';
    }).join('');
  }

  function ladeOptionen() {
    return hole('/api/kasse/formular').then(function (res) {
      var d = res.d || {};
      if (d.optionen) zeigeOptionen(d.optionen);
      if (d.warenkorb) zeigeUebersicht(d.warenkorb);
      return d;
    });
  }

  $('optionen-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var knopf = $('optionen-knopf');
    var v = document.querySelector('input[name="versandart"]:checked');
    var z = document.querySelector('input[name="zahlungsart"]:checked');
    if (!v || !z) {
      melde('optionen-melder', 'Bitte Versandart und Zahlungsart wählen.', 'warnung');
      return;
    }
    melde('optionen-melder', 'Die Auswahl geht an das Altsystem, es rechnet neu …', 'laedt');
    knopfArbeitet(knopf, true, 'Wird gespeichert …');

    sende('/api/kasse/optionen', {
      land: $('f-lieferland').value || 'de',
      versandart: v.value,
      zahlungsart: z.value
    })
      .then(function (res) {
        var d = res.d || {};
        if (!res.ok || d.ok !== true) {
          throw new Error(d.fehler || 'Das Altsystem hat die Auswahl abgelehnt.');
        }
        zeigeUebersicht(d);
        if (d.optionen) zeigeOptionen(d.optionen);
        melde('optionen-melder', 'Gespeichert. Das Altsystem hat neu gerechnet.', 'gut');
        return ladeVorschau().then(function () { zeigeSchritt(3); });
      })
      .catch(function (err) { melde('optionen-melder', esc(err.message), 'fehler'); })
      .then(function () { knopfArbeitet(knopf, false); });
  });

  /* ----------------------------------------------------------------------
     Schritt 3 — Pruefen
     ---------------------------------------------------------------------- */

  function block(titel, inhalt, zurueckZu) {
    return '<div class="pruef-block"><h3><span>' + esc(titel) + '</span>' +
      (zurueckZu ? '<button type="button" class="textknopf" data-zurueck="' + zurueckZu + '">ändern</button>' : '') +
      '</h3><p class="pruef-block__text">' + inhalt + '</p></div>';
  }

  function zeigeVorschau(v) {
    var ziel = $('pruef-blocks');
    var u = v.uebersicht;
    var h = '';

    if (!u) {
      h += '<p class="hinweis hinweis--warnung"><span class="hinweis__symbol" aria-hidden="true">!</span>' +
        '<span><span class="hinweis__titel">Noch keine Bestellübersicht</span>' +
        'Das Altsystem gibt die Übersichtsseite noch nicht heraus' +
        (v.umleitung ? ' — es leitet auf <code>' + esc(v.umleitung) + '</code> um.' : '.') +
        '</span></p>';
    } else {
      h += block('Lieferadresse',
        esc(u.adresseText || '(keine Adresse hinterlegt)') +
        (u.bemerkungen ? '\n\nBemerkungen: ' + esc(u.bemerkungen) : ''), 1);

      h += block('Positionen',
        (u.items || []).map(function (p) {
          return esc(p.anzahl) + ' × ' + esc(p.name) +
            (p.attribut ? ' (' + esc(p.attribut) + ')' : '') +
            (p.summe ? ' — ' + esc(p.summe) : '');
        }).join('\n') || '(leer)');

      h += block('Beträge laut Altsystem',
        'Zwischensumme: ' + esc(u.zwischensumme || '—') + '\n' +
        'Versandkosten: ' + esc(u.versand || '—') + '\n' +
        'Umsatzsteuer' + (u.ustSatz != null ? ' (' + esc(u.ustSatz) + ' %)' : '') + ': ' +
          esc(u.umsatzsteuer || '—') + '\n' +
        'Gesamtsumme: ' + esc(u.gesamt || '—'));

      var vers = (v.optionen.versandart.optionen || []).filter(function (o) { return o.gewaehlt; })[0];
      h += block('Versand und Zahlung',
        'Versandart: ' + esc(vers ? vers.label : v.optionen.versandart.gewaehlt) + '\n' +
        'Zahlungsart: ' + esc(u.zahlungsartText || v.optionen.zahlungsart.gewaehlt) + '\n' +
        'Es fließt kein Geld — es entsteht nur ein Datensatz.', 2);
    }

    ziel.innerHTML = h;
    ziel.removeAttribute('aria-busy');
    Array.prototype.forEach.call(ziel.querySelectorAll('[data-zurueck]'), function (b) {
      b.addEventListener('click', function () { zeigeSchritt(Number(b.getAttribute('data-zurueck'))); });
    });

    /* Der Nachweis: die Anfrage im Wortlaut. */
    $('roh-inhalt').textContent = JSON.stringify(v.finalRequest, null, 2);

    var bereit = v.bereit === true;
    var schalter = $('scharf-schalter');
    schalter.disabled = !bereit;
    if (!bereit) schalter.checked = false;

    if (!bereit) {
      melde('pruef-melder',
        'Der Bestellabschluss ist noch nicht möglich:<ul>' +
        (v.huerden || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>',
        'warnung');
    } else {
      melde('pruef-melder',
        'Das Altsystem zeigt den Absende-Knopf an — die Bestellung wäre jetzt möglich.', 'info');
    }
    pruefeScharf();
  }

  function ladeVorschau() {
    melde('pruef-melder', 'Der Bestellstand wird frisch aus dem Altsystem gelesen …', 'laedt');
    return hole('/api/kasse/vorschau')
      .then(function (res) {
        vorschau = res.d || {};
        zeigeVorschau(vorschau);
        if (vorschau.warenkorb) zeigeUebersicht(vorschau.warenkorb);
        return vorschau;
      })
      .catch(function (err) {
        melde('pruef-melder', 'Der Stand ließ sich nicht lesen: ' + esc(err.message), 'fehler');
      });
  }

  /* Der Bestellknopf traegt "disabled", solange das Kaestchen nicht sitzt. */
  function pruefeScharf() {
    var frei = !!(vorschau && vorschau.bereit === true) && $('scharf-schalter').checked;
    $('bestell-knopf').disabled = !frei;
  }

  $('scharf-schalter').addEventListener('change', pruefeScharf);
  $('pruef-neu').addEventListener('click', function () { ladeVorschau(); });

  /* ----------------------------------------------------------------------
     Schritt 4 — Bestellen und Ergebnis
     ---------------------------------------------------------------------- */

  $('bestell-knopf').addEventListener('click', function () {
    /* Doppelt gesichert: der Knopf ist disabled, und hier wird noch einmal
       nachgesehen, bevor irgendetwas an das Livesystem geht. */
    if (!$('scharf-schalter').checked) return;
    if (!vorschau || vorschau.bereit !== true) return;

    var knopf = this;
    knopfArbeitet(knopf, true, 'Bestellung läuft …');
    melde('bestell-melder', 'Die Bestellung wird an matten.de geschickt …', 'laedt');

    sende('/api/kasse/bestellen', { bestaetigung: BESTAETIGUNG })
      .then(function (res) {
        var d = res.d || {};
        if (!res.ok || d.ok !== true) {
          melde('bestell-melder',
            esc(d.fehler || 'Das Altsystem hat die Bestellung nicht angenommen.') +
            ((d.huerden || []).length
              ? '<ul>' + d.huerden.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'
              : ''),
            'fehler');
          knopfArbeitet(knopf, false);
          return;
        }
        melde('bestell-melder', '');
        zeigeErgebnis(d);
        zeigeSchritt(4);
        if (window.NetShell) window.NetShell.warenkorbAktualisieren();
      })
      .catch(function (err) {
        melde('bestell-melder', 'Fehler: ' + esc(err.message), 'fehler');
        knopfArbeitet(knopf, false);
      });
  });

  function zeigeErgebnis(d) {
    $('ergebnis').innerHTML =
      '<p class="hinweis hinweis--erfolg" role="status">' +
        '<span class="hinweis__symbol" aria-hidden="true">✓</span>' +
        '<span><span class="hinweis__titel">Das Altsystem hat die Bestellung angenommen</span>' +
        'Antwortseite <code>' + esc(d.finalUrl || '') + '</code> (HTTP ' + esc(d.status) + ').' +
        '</span></p>' +

      (d.bestellnummer
        ? '<p class="label label--gedeckt mt-6">Bestellnummer laut Altsystem</p>' +
          '<p class="ergebnis-nummer">' + esc(d.bestellnummer) + '</p>'
        : '<p class="hinweis hinweis--warnung mt-6">' +
            '<span class="hinweis__symbol" aria-hidden="true">i</span>' +
            '<span><span class="hinweis__titel">Keine Bestellnummer in der Antwort</span>' +
            'Der alte Shop zeigt nach dem Absenden nur eine Dankseite ohne Nummer.</span></p>') +

      '<h3 class="mt-6">Antwort des Altsystems im Wortlaut</h3>' +
      '<p class="ergebnis-antwort">' + esc(d.rohantwort || '(leer)') + '</p>' +

      '<p class="hinweis hinweis--warnung mt-6">' +
        '<span class="hinweis__symbol" aria-hidden="true">!</span>' +
        '<span><span class="hinweis__titel">Die Bestellung erscheint jetzt im Admin</span>' +
        'Sie steht im Verwaltungsbereich von matten.de unter <strong>Bestellungen</strong> ' +
        'und muss nach der Prüfung dort gelöscht werden.</span></p>' +

      '<details class="roh"><summary>Was abgeschickt wurde</summary>' +
        '<div class="roh__koerper"><pre>' + esc(JSON.stringify(d.gesendet, null, 2)) + '</pre></div>' +
      '</details>' +

      '<div class="btn-gruppe mt-6">' +
        '<a class="btn btn--sekundaer" href="/api/kasse/raw" target="_blank" rel="noopener">' +
          'Rohe Antwortseite öffnen</a>' +
        '<a class="btn btn--dezent" href="index.html">Zurück zum Sortiment</a>' +
      '</div>';
  }

  /* ----------------------------------------------------------------------
     Start
     ---------------------------------------------------------------------- */

  function start() {
    melde('adress-melder', 'Formular und Warenkorb werden aus dem Altsystem gelesen …', 'laedt');

    hole('/api/kasse/formular')
      .then(function (res) {
        var d = res.d || {};
        if (!res.ok || d.ok !== true) {
          throw new Error(d.fehler || 'Das Bestellsystem hat nicht geantwortet.');
        }

        laender = d.laender && d.laender.length ? d.laender
                : (d.optionen && d.optionen.land ? d.optionen.land.optionen : []);
        baueAdressfelder(d.adressfelder, d.adresse);
        if (d.optionen) zeigeOptionen(d.optionen);
        if (d.warenkorb) zeigeUebersicht(d.warenkorb);

        /* Anmeldestatus. Eine Anmeldung ist freiwillig. */
        $('konto-status').textContent = d.konto && d.konto.eingeloggt
          ? 'Diese Sitzung ist beim Altsystem angemeldet.'
          : 'Sie sind nicht angemeldet — das ist in Ordnung, der Shop nimmt Gastbestellungen an.';

        if (d.warenkorb && !(d.warenkorb.items || []).length) {
          melde('adress-melder',
            'Der Warenkorb ist leer. <a href="warenkorb.html">Zurück zum Warenkorb</a> — ' +
            'ohne Positionen nimmt das Altsystem keine Bestellung an.', 'warnung');
          $('adress-knopf').disabled = true;
        } else {
          melde('adress-melder', '');
        }
      })
      .catch(function (err) {
        melde('adress-melder',
          esc(err.message) + ' Läuft die Brücke zum Altsystem?', 'fehler');
        $('adress-felder').removeAttribute('aria-busy');
        $('adress-knopf').disabled = true;
      });
  }

  start();
})();
