/* ==========================================================================
   seite-konto.js — Login und Registrierung (Spec 11)
   --------------------------------------------------------------------------
     login.html     GET  /api/konto          Anmeldestatus der Sitzung
                    POST /api/konto/login    { email, passwort }
     register.html  POST /api/konto/register { …Felder… }
                    Das Altsystem liefert unter /register kein Formular aus —
                    die Antwort der Bruecke wird so gezeigt, wie sie kommt
                    (portiert aus public/net/assets/js/seite-konto.js).
   ========================================================================== */

(function () {
  'use strict';

  var NET = window.NET || {};
  var S = window.Shell;
  var esc = S.esc;

  function melde(id, html, art) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html ? '<div class="alert alert-' + (art || 'info') + '" role="status">' + html + '</div>' : '';
  }

  /* ======================================================================
     Login
     ====================================================================== */
  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    S.hole('/api/konto').then(function (res) {
      if (res.ok && res.d.eingeloggt) {
        melde('login-status', 'Diese Sitzung ist beim Altsystem matten.de angemeldet. <a href="checkout.html">Zur Kasse</a>', 'success');
      }
    });

    var reset = document.getElementById('passwort-reset');
    if (reset) {
      reset.addEventListener('click', function (ev) {
        ev.preventDefault();
        melde('login-melder', 'Das Zurücksetzen des Passworts läuft im Altsystem (matten.de, „Passwort vergessen“) — hier noch nicht angebunden.', 'warning');
      });
    }

    loginForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var knopf = document.getElementById('login-knopf');
      var email = document.getElementById('form-full-name').value.trim();
      var passwort = document.getElementById('form-password').value;
      if (!email || !passwort) {
        melde('login-melder', 'Bitte eMail und Passwort eingeben.', 'warning');
        return;
      }
      S.knopfArbeitet(knopf, true);
      melde('login-melder', '');
      S.sende('/api/konto/login', { email: email, passwort: passwort }).then(function (res) {
        S.knopfArbeitet(knopf, false);
        var d = res.d || {};
        if (res.ok && d.eingeloggt) {
          melde('login-melder', 'Angemeldet' + (d.name ? ' als ' + esc(d.name) : '') + '. <a href="checkout.html">Zur Kasse</a>', 'success');
          document.getElementById('form-password').value = '';
        } else {
          melde('login-melder', esc(d.fehler || 'eMail-Adresse und Passwort passen nicht zusammen (Antwort des Altsystems).'), 'danger');
        }
      });
    });
  }

  /* ======================================================================
     Registrierung
     ====================================================================== */
  var regForm = document.getElementById('register-form');
  if (regForm) {
    /* Land: 249 Laender (ISO 3166-1), deutsche Namen ueber Intl.DisplayNames,
       alphabetisch, Deutschland vorausgewaehlt — wie im Original. */
    var land = document.getElementById('user_registration_customer_country');
    if (land && (NET.laenderCodes || []).length) {
      var namen = null;
      try { namen = new Intl.DisplayNames(['de'], { type: 'region' }); } catch (e) { namen = null; }
      var eintraege = NET.laenderCodes.map(function (c) {
        var n = c;
        try { n = namen ? (namen.of(c) || c) : c; } catch (e) { n = c; }
        return { code: c, name: n };
      });
      eintraege.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
      land.innerHTML = eintraege.map(function (e) {
        return '<option value="' + esc(e.code) + '"' + (e.code === 'DE' ? ' selected' : '') + '>' + esc(e.name) + '</option>';
      }).join('');
    }

    regForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var knopf = document.getElementById('register-knopf');
      var w = function (id) { var el = document.getElementById('user_registration_' + id); return el ? el.value : ''; };
      var daten = {
        email: w('email'), passwort: w('plainPassword'),
        anrede: w('customer_title'), vorname: w('customer_firstName'), name: w('customer_lastName'),
        firma: w('customer_companyName'), uid: w('customer_taxId'),
        strasse: w('customer_streetAddress'), ort: w('customer_city'), bundesland: w('customer_state'),
        plz: w('customer_postalCode'), land: w('customer_country'),
        telefon: w('customer_phone'), mobil: w('customer_mobile'), fax: w('customer_fax')
      };
      S.knopfArbeitet(knopf, true);
      melde('register-melder', '');
      S.sende('/api/konto/register', daten).then(function (res) {
        S.knopfArbeitet(knopf, false);
        var d = res.d || {};
        var meldungen = (Array.isArray(d.fehler) ? d.fehler : []).map(function (f) {
          return '<li>' + (f.feld ? '<strong>' + esc(f.feld) + ':</strong> ' : '') + esc(f.meldung || f) + '</li>';
        }).join('');
        if (res.ok && d.ok) {
          melde('register-melder', 'Das Altsystem hat die Registrierung angenommen.' + (meldungen ? '<ul>' + meldungen + '</ul>' : ''), 'success');
        } else if (d.moeglich) {
          melde('register-melder', 'Das Altsystem bietet ein Registrierungsformular mit den Feldern <code>' +
            esc((d.felder || []).join(', ')) + '</code> an, hat die Eingaben aber nicht angenommen.' +
            (meldungen ? '<ul>' + meldungen + '</ul>' : ''), 'warning');
        } else {
          melde('register-melder', '<strong>Antwort des Altsystems (HTTP ' + esc(res.http) + '):</strong>' +
            (meldungen ? '<ul>' + meldungen + '</ul>' : (typeof d.fehler === 'string' ? '<p>' + esc(d.fehler) + '</p>' : ' (keine Meldung)')) +
            (d.seiteninhalt ? '<p class="mb-0">Seiteninhalt: <em>' + esc(d.seiteninhalt) + '</em></p>' : '') +
            '<p class="mb-0 small">Die Registrierung ist im Altsystem nicht über diesen Weg möglich; es wurde kein Konto angelegt.</p>', 'warning');
        }
      });
    });
  }
})();
