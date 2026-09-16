/* ==========================================================================
   matten.net — Konto (Anmelden und Registrieren)
   --------------------------------------------------------------------------
   Eine Datei fuer beide Seiten. Was nicht auf der Seite steht, wird
   uebersprungen.

     login.html          GET  /api/konto        Anmeldestatus der Sitzung
                         POST /api/konto/login  Anmeldung am Altsystem
     registrieren.html   POST /api/konto/register
                         nur zur Auskunft: das Altsystem liefert unter
                         /register kein Formular aus. Es wird darum auch
                         keines vorgetaeuscht.
   ========================================================================== */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

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

  function feldFehler(feld, meldung) {
    var box = document.querySelector('.feld[data-feld="' + feld + '"]');
    if (!box) return;
    var p = box.querySelector('.feld-fehler');
    var ein = box.querySelector('input, select, textarea');
    if (meldung) {
      box.classList.add('feld--fehler');
      if (p) { p.textContent = meldung; p.hidden = false; }
      if (ein) { ein.setAttribute('aria-invalid', 'true'); ein.setAttribute('aria-describedby', p.id); }
    } else {
      box.classList.remove('feld--fehler');
      if (p) { p.hidden = true; p.textContent = ''; }
      if (ein) { ein.removeAttribute('aria-invalid'); ein.removeAttribute('aria-describedby'); }
    }
  }

  /* ======================================================================
     Anmelden
     ====================================================================== */

  var loginForm = $('login-form');

  if (loginForm) {
    /* Zustand der Sitzung, so wie ihn das Altsystem sieht. */
    hole('/api/konto')
      .then(function (res) {
        var d = res.d || {};
        if (d.eingeloggt) {
          melde('status-melder',
            'Diese Sitzung ist beim Bestellsystem angemeldet. ' +
            '<a href="warenkorb.html">Zum Warenkorb</a>', 'gut');
        } else {
          melde('status-melder', '');
        }
      })
      .catch(function () {
        melde('status-melder',
          'Der Anmeldestatus ließ sich nicht lesen — läuft die Brücke zum Altsystem?', 'warnung');
      });

    loginForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var knopf = $('login-knopf');
      var email = $('l-email').value.trim();
      var passwort = $('l-pass').value;

      feldFehler('email', '');
      feldFehler('passwort', '');

      /* Erste Prüfung im Browser, damit niemand eine leere Anfrage schickt.
         Die eigentliche Prüfung macht das Altsystem. */
      var fehlt = false;
      if (!email) { feldFehler('email', 'Bitte tragen Sie Ihre E-Mail-Adresse ein.'); fehlt = true; }
      if (!passwort) { feldFehler('passwort', 'Bitte tragen Sie Ihr Passwort ein.'); fehlt = true; }
      if (fehlt) {
        melde('login-melder', 'Bitte beide Felder ausfüllen.', 'warnung');
        (email ? $('l-pass') : $('l-email')).focus();
        return;
      }

      knopf.disabled = true;
      knopf.setAttribute('aria-busy', 'true');
      knopf.textContent = 'Wird geprüft …';
      melde('login-melder', 'Die Anmeldung geht an das Bestellsystem …', 'laedt');

      sende('/api/konto/login', { email: email, passwort: passwort })
        .then(function (res) {
          var d = res.d || {};
          if (d.ok && d.eingeloggt) {
            melde('login-melder',
              'Angemeldet' + (d.name ? ' als ' + esc(d.name) : '') +
              '. <a href="warenkorb.html">Zum Warenkorb</a>', 'gut');
            $('l-pass').value = '';
          } else {
            melde('login-melder',
              esc(d.fehler || 'E-Mail-Adresse und Passwort passen nicht zusammen.'), 'fehler');
            $('l-pass').focus();
          }
        })
        .catch(function (err) {
          melde('login-melder', 'Die Anmeldung ließ sich nicht durchführen: ' +
            esc(err.message), 'fehler');
        })
        .then(function () {
          knopf.disabled = false;
          knopf.removeAttribute('aria-busy');
          knopf.textContent = 'Login';
        });
    });
  }

  /* ======================================================================
     Registrieren — reine Auskunft
     ====================================================================== */

  var pruefKnopf = $('register-pruefen');

  if (pruefKnopf) {
    pruefKnopf.addEventListener('click', function () {
      pruefKnopf.disabled = true;
      pruefKnopf.setAttribute('aria-busy', 'true');
      melde('register-melder', 'Das Altsystem wird gefragt …', 'laedt');

      sende('/api/konto/register', {})
        .then(function (res) {
          var d = res.d || {};
          var meldungen = (d.fehler || []).map(function (f) {
            return '<li>' + (f.feld ? '<strong>' + esc(f.feld) + ':</strong> ' : '') +
                   esc(f.meldung) + '</li>';
          }).join('');

          if (d.moeglich) {
            melde('register-melder',
              'Das Altsystem liefert jetzt ein Formular mit den Feldern ' +
              '<code>' + esc((d.felder || []).join(', ')) + '</code>. ' +
              'Dann kann die Registrierung hier ausgebaut werden.' +
              (meldungen ? '<ul>' + meldungen + '</ul>' : ''), 'warnung');
          } else {
            melde('register-melder',
              'Antwort des Altsystems:' +
              (meldungen ? '<ul>' + meldungen + '</ul>' : ' (keine Meldung)') +
              (d.seiteninhalt
                ? '<p>Der ganze Seiteninhalt lautet: <em>' + esc(d.seiteninhalt) + '</em></p>'
                : ''), 'info');
          }
        })
        .catch(function (err) {
          melde('register-melder', 'Die Abfrage ist fehlgeschlagen: ' + esc(err.message), 'fehler');
        })
        .then(function () {
          pruefKnopf.disabled = false;
          pruefKnopf.removeAttribute('aria-busy');
        });
    });
  }
})();
