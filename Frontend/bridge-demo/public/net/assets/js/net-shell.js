/* ==========================================================================
   matten.net — Grundgeruest (Kopf, Navigation, Fuss)
   --------------------------------------------------------------------------
   Baut Kopf- und Fussbereich in die Platzhalter <div id="kopf"> und
   <div id="fuss"> und haengt die Navigation an. Die Struktur der Navigation
   kommt aus net-nav.js und wird hier nur dargestellt — diese Datei enthaelt
   keine Inhalte.

   Einbindung in einer Seite
     <div id="kopf"></div>
     <main id="inhalt"> … </main>
     <div id="fuss"></div>
     <script src="assets/js/net-nav.js"></script>
     <script src="assets/js/net-shell.js" defer></script>

   Aktive Seite kennzeichnen (setzt aria-current)
     <body data-aktiv="/product-categories/kokosmatten">

   Oeffentliche Schnittstelle
     NetShell.warenkorbAktualisieren()   Zaehler neu vom Server holen
     NetShell.warenkorbSetzen(n)         Zaehler ohne Anfrage setzen
     NetShell.schubfachSchliessen()

   Tastatur
     Desktop-Menue   Pfeil links/rechts wechselt die Hauptpunkte,
                     Pfeil ab oeffnet das Untermenue und springt hinein,
                     Pfeil auf/ab bewegt sich darin, Pos1/Ende springt an
                     Anfang und Ende, Escape schliesst und gibt den Fokus
                     an den Hauptpunkt zurueck.
     Schubfach       Escape schliesst, Tab bleibt im Schubfach gefangen,
                     der Fokus kehrt zum Menueknopf zurueck.
   ========================================================================== */

(function () {
  'use strict';

  var NAV     = window.NET_NAV || [];
  var ROUTEN  = window.NET_ROUTEN || {};
  var FIRMA   = window.NET_FIRMA || {};
  var FUSS    = window.NET_FUSS || [];
  var SPRACHEN = window.NET_SPRACHEN || [];

  var lfd = 0;                       /* laufende Nummer fuer eindeutige IDs */
  function neueId(p) { lfd += 1; return p + '-' + lfd; }

  /* Text so einsetzen, dass Sonderzeichen nicht als Auszeichnung gelten. */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function route(schluessel) { return ROUTEN[schluessel] || { titel: schluessel, href: '#', pfad: '' }; }

  /* Ein Link auf eine feste Adresse. Traegt die Route "vorbereitung", steht
     das als Teil der Linkbeschriftung dahinter — sichtbar und vorgelesen.
     Sonst versprechen Kopf und Fuss einen Inhalt, den es hinter dem Link
     noch nicht gibt. */
  function routeLink(schluessel) {
    var r = route(schluessel);
    return '<a href="' + esc(r.href) + '">' + esc(r.titel) +
      (r.vorbereitung
        ? '<span class="marke-vorbereitung" style="opacity:.72;font-size:var(--fs-200)"> · in Vorbereitung</span>'
        : '') +
      '</a>';
  }

  /* --- Symbole ---------------------------------------------------------- */
  var ICON = {
    suche:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.2-4.2"/></svg>',
    telefon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3z"/></svg>',
    konto:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>',
    korb:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h2.2l2.3 10.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/></svg>',
    menue:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    zu:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    pfeil:  '<svg class="mainnav__pfeil" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l5 5 5-5"/></svg>',
    pfeilKlein: '<svg viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 1l5 5 5-5"/></svg>'
  };

  /* ======================================================================
     Aktive Seite bestimmen
     ====================================================================== */

  /* Bevorzugt wird der Pfad aus <body data-aktiv="…">. Fehlt er, wird der
     Dateiname der aktuellen Adresse mit "href" verglichen. */
  var aktiverPfad = (document.body && document.body.getAttribute('data-aktiv')) || '';
  var aktiveDatei = (function () {
    var p = window.location.pathname.split('/').pop() || 'index.html';
    var q = window.location.search || '';
    return p + q;
  })();

  function passt(eintrag) {
    if (!eintrag) return false;
    if (aktiverPfad) return eintrag.pfad === aktiverPfad;
    return eintrag.href === aktiveDatei;
  }

  /* GENAU EIN Menuepunkt traegt aria-current="page".
     net-nav.js fuehrt jeden Kategoriepfad nur einmal, dann gibt es hier
     ohnehin nur einen Treffer. Zeigen doch einmal zwei Punkte auf dieselbe
     Adresse, wird hier entschieden statt zweimal ausgezeichnet: es gewinnt
     der strukturell passende Punkt — der Unterpunkt, dessen Oberpunkt im
     Kategoriebaum ueber ihm steht. Sonst der erste Treffer.
     Ohne diese Entscheidung meldete die Seite mehrere aktuelle Seiten, und
     Vorlesesoftware nennt dann zwei verschiedene Orte fuer eine Seite. */
  var aktiverEintrag = (function () {
    var treffer = [];
    for (var i = 0; i < NAV.length; i++) {
      var o = NAV[i];
      if (passt(o)) treffer.push({ eintrag: o, ober: null });
      var kinder = o.kinder || [];
      for (var k = 0; k < kinder.length; k++) {
        if (passt(kinder[k])) treffer.push({ eintrag: kinder[k], ober: o });
      }
    }
    if (!treffer.length) return null;
    for (var t = 0; t < treffer.length; t++) {
      var e = treffer[t];
      if (e.ober && e.ober.kat && e.eintrag.kat &&
          String(e.eintrag.kat).indexOf(e.ober.kat + '/') === 0) return e.eintrag;
    }
    return treffer[0].eintrag;
  })();

  /* Vergleich ueber die Identitaet des Eintrags, nicht ueber seine Adresse
     — nur so bleibt es bei einer einzigen ausgezeichneten Stelle. */
  function istAktiv(eintrag) {
    return !!eintrag && eintrag === aktiverEintrag;
  }

  function hatAktivesKind(eintrag) {
    if (!eintrag.kinder) return false;
    for (var i = 0; i < eintrag.kinder.length; i++) {
      if (istAktiv(eintrag.kinder[i])) return true;
    }
    return false;
  }

  /* ======================================================================
     Kopfbereich
     ====================================================================== */

  function baueKopf() {
    var tel = FIRMA.telefonRoh || '';
    var telAnzeige = FIRMA.telefon || '';

    var html = '';

    html += '<header class="site-header">';

    /* --- Servicezeile (nur Desktop) ---------------------------------- */
    html += '  <div class="kopf-service">';
    html += '    <div class="container">';
    html += '      <p style="margin:0">' + esc(FIRMA.zusatz || '') + ' — direkt vom Hersteller</p>';
    html += '      <ul>';
    html += '        <li>' + routeLink('musterservice') + '</li>';
    html += '        <li>' + routeLink('versand') + '</li>';
    html += '        <li>' + routeLink('kontakt') + '</li>';
    /* Sprachumschalter ist vorbereitet und bleibt aus, solange es nur
       eine aktive Sprache gibt. */
    if (SPRACHEN.length > 1) {
      html += '        <li><span class="nur-sr">Sprache</span>';
      for (var s = 0; s < SPRACHEN.length; s++) {
        html += '<a href="' + esc(SPRACHEN[s].praefix || '/') + '" lang="' + esc(SPRACHEN[s].code) + '">' +
                esc(SPRACHEN[s].titel) + '</a> ';
      }
      html += '</li>';
    }
    html += '      </ul>';
    html += '    </div>';
    html += '  </div>';

    /* --- Hauptzeile ---------------------------------------------------- */
    html += '  <div class="kopf-haupt">';
    html += '    <div class="container">';
    html += '      <a class="marke" href="' + esc(route('start').href) + '">' +
            '<span>' + esc(FIRMA.markeTeil1 || 'Matten') + '</span>' +
            '<span class="marke__akzent">' + esc(FIRMA.markeTeil2 || 'fuchs') + '</span>' +
            '<span class="marke__zusatz">' + esc(FIRMA.zusatz || '') + '</span>' +
            '</a>';

    /* Suche */
    html += '      <div class="kopf-suche">';
    html += '        <form role="search" action="' + esc(route('suche').href) + '" method="get">';
    html += '          <label class="nur-sr" for="kopf-suche-feld">Im Sortiment suchen</label>';
    html += '          <input type="search" id="kopf-suche-feld" name="q" placeholder="Matte, Größe oder Artikelnummer suchen" autocomplete="off">';
    html += '          <button type="submit">' + ICON.suche + '<span class="nur-sr">Suchen</span></button>';
    html += '        </form>';
    html += '      </div>';

    /* Aktionen */
    html += '      <div class="kopf-aktionen">';
    if (tel) {
      html += '        <a class="kopf-knopf kopf-knopf--telefon" href="tel:' + esc(tel) + '">' +
              ICON.telefon +
              '<span class="kopf-knopf__text">' + esc(telAnzeige) + '</span>' +
              '<span class="nur-sr">Beratung anrufen, ' + esc(FIRMA.zeiten || '') + '</span></a>';
    }
    html += '        <a class="kopf-knopf" href="' + esc(route('login').href) + '">' +
            ICON.konto + '<span class="kopf-knopf__text">Konto</span>' +
            '<span class="nur-sr">Anmelden oder Konto anlegen</span></a>';
    html += '        <a class="kopf-knopf" id="korb-link" href="' + esc(route('warenkorb').href) + '">' +
            ICON.korb + '<span class="kopf-knopf__text">Warenkorb</span>' +
            '<span class="korb-zaehler" id="korb-zaehler" hidden>0</span>' +
            /* Der Zaehler aendert sich, ohne dass die Seite wechselt. Ohne
               aria-live bliebe das fuer Vorlesesoftware unbemerkt. */
            '<span class="nur-sr" id="korb-text" role="status" aria-live="polite">Warenkorb</span></a>';
    html += '        <button class="kopf-knopf menue-schalter" type="button" id="menue-schalter" ' +
            'aria-expanded="false" aria-controls="schubfach">' +
            ICON.menue + '<span class="nur-sr">Menü öffnen</span></button>';
    html += '      </div>';

    html += '    </div>';
    html += '  </div>';

    /* --- Hauptnavigation (Desktop) ------------------------------------- */
    html += '  <nav class="mainnav" aria-label="Hauptnavigation"><div class="container">';
    html += '    <ul class="mainnav__liste">';
    for (var i = 0; i < NAV.length; i++) {
      html += baueNavPunkt(NAV[i], i);
    }
    html += '    </ul>';
    html += '  </div></nav>';

    html += '</header>';

    return html;
  }

  /* Ein Hauptpunkt.
     Ohne Untereintraege ist er ein Link.
     Mit Untereintraegen ist er ein Schalter, der das Menue auf- und zuklappt
     — die Warengruppe selbst steht dann als erster Eintrag im Menue
     ("… — Übersicht"). So bleibt der Schalter mit der Tastatur bedienbar,
     und wer nur weiterspringen will, ueberspringt das Menue mit einem Tab. */
  function baueNavPunkt(eintrag, index) {
    var hatKinder = !!(eintrag.kinder && eintrag.kinder.length);
    var aktiv = istAktiv(eintrag) || hatAktivesKind(eintrag);
    var klappId = 'klapp-' + index;
    /* Die letzten drei Punkte klappen nach links auf, damit sie nicht aus
       dem Fenster laufen. */
    var rechts = index >= NAV.length - 3;

    var h = '<li class="mainnav__punkt' + (aktiv ? ' mainnav__punkt--aktiv' : '') +
            (rechts ? ' mainnav__punkt--rechts' : '') + '">';

    if (hatKinder) {
      h += '<button class="mainnav__link" type="button" aria-expanded="false" aria-controls="' + klappId + '">' +
           esc(eintrag.titel) + ICON.pfeil + '</button>';

      h += '<ul class="mainnav__klapp" id="' + klappId + '" hidden>';
      h += '<li><a class="mainnav__uebersicht" href="' + esc(eintrag.href || '#') + '"' +
           (istAktiv(eintrag) ? ' aria-current="page"' : '') + '>' +
           esc(eintrag.titel) + ' — Übersicht</a></li>';
      for (var k = 0; k < eintrag.kinder.length; k++) {
        var kind = eintrag.kinder[k];
        h += '<li><a href="' + esc(kind.href || '#') + '"' +
             (istAktiv(kind) ? ' aria-current="page"' : '') + '>' + esc(kind.titel) + '</a></li>';
      }
      h += '</ul>';
    } else {
      h += '<a class="mainnav__link" href="' + esc(eintrag.href || '#') + '"' +
           (istAktiv(eintrag) ? ' aria-current="page"' : '') + '>' + esc(eintrag.titel) + '</a>';
    }

    h += '</li>';
    return h;
  }

  /* ======================================================================
     Schubfach (mobile Navigation)
     ====================================================================== */

  function baueSchubfach() {
    var h = '';

    h += '<div class="schleier" id="schleier" hidden></div>';
    h += '<div class="schubfach" id="schubfach" hidden role="dialog" aria-modal="true" aria-label="Menü">';

    h += '  <div class="schubfach__kopf">';
    h += '    <span class="marke"><span>' + esc(FIRMA.markeTeil1 || 'Matten') + '</span>' +
         '<span class="marke__akzent">' + esc(FIRMA.markeTeil2 || 'fuchs') + '</span></span>';
    h += '    <button class="schubfach__schliessen" type="button" id="schubfach-zu">' +
         ICON.zu + '<span class="nur-sr">Menü schließen</span></button>';
    h += '  </div>';

    h += '  <div class="schubfach__koerper">';

    h += '    <div class="schubfach__suche">';
    h += '      <form role="search" action="' + esc(route('suche').href) + '" method="get">';
    h += '        <label class="nur-sr" for="schub-suche-feld">Im Sortiment suchen</label>';
    h += '        <input type="search" id="schub-suche-feld" name="q" placeholder="Suchen" autocomplete="off">';
    h += '        <button type="submit">' + ICON.suche + '<span class="nur-sr">Suchen</span></button>';
    h += '      </form>';
    h += '    </div>';

    h += '    <nav aria-label="Hauptnavigation, mobil"><ul class="schubnav">';
    for (var i = 0; i < NAV.length; i++) {
      var e = NAV[i];
      var hatKinder = !!(e.kinder && e.kinder.length);
      var offen = hatAktivesKind(e);
      var id = 'schub-' + i;

      h += '<li>';
      h += '  <div class="schubnav__zeile">';
      h += '    <a class="schubnav__link" href="' + esc(e.href || '#') + '"' +
           (istAktiv(e) ? ' aria-current="page"' : '') + '>' + esc(e.titel) + '</a>';
      if (hatKinder) {
        h += '  <button class="schubnav__auf" type="button" aria-expanded="' + (offen ? 'true' : 'false') +
             '" aria-controls="' + id + '">' + ICON.pfeilKlein +
             '<span class="nur-sr">Untermenü ' + esc(e.titel) + '</span></button>';
      }
      h += '  </div>';
      if (hatKinder) {
        h += '  <ul class="schubnav__unter" id="' + id + '"' + (offen ? '' : ' hidden') + '>';
        for (var k = 0; k < e.kinder.length; k++) {
          var kind = e.kinder[k];
          h += '<li><a href="' + esc(kind.href || '#') + '"' +
               (istAktiv(kind) ? ' aria-current="page"' : '') + '>' + esc(kind.titel) + '</a></li>';
        }
        h += '  </ul>';
      }
      h += '</li>';
    }
    h += '    </ul></nav>';

    h += '  </div>';

    h += '  <div class="schubfach__fuss">';
    h += '    <a class="btn btn--sekundaer" href="' + esc(route('login').href) + '">Anmelden</a>';
    if (FIRMA.telefonRoh) {
      h += '  <a class="btn btn--dezent" href="tel:' + esc(FIRMA.telefonRoh) + '">' +
           esc(FIRMA.telefon) + ' · ' + esc(FIRMA.zeiten || '') + '</a>';
    }
    h += '  </div>';

    h += '</div>';
    return h;
  }

  /* ======================================================================
     Fussbereich
     ====================================================================== */

  function baueFuss() {
    var h = '';
    h += '<footer class="site-footer">';
    h += '  <div class="container"><div class="footer-spalten">';

    /* Spalte 1: Warengruppen — direkt aus der Navigation, damit Menue und
       Fuss nie auseinanderlaufen. Ohne Home. */
    h += '    <div class="footer-spalte"><h2>Sortiment</h2><ul>';
    for (var i = 0; i < NAV.length; i++) {
      if (NAV[i].pfad === '/') continue;
      h += '<li><a href="' + esc(NAV[i].href || '#') + '">' + esc(NAV[i].titel) + '</a></li>';
    }
    h += '    </ul></div>';

    /* Spalten 2 und 3: aus NET_FUSS. */
    for (var s = 0; s < FUSS.length; s++) {
      h += '    <div class="footer-spalte"><h2>' + esc(FUSS[s].titel) + '</h2><ul>';
      for (var p = 0; p < FUSS[s].punkte.length; p++) {
        h += '<li>' + routeLink(FUSS[s].punkte[p]) + '</li>';
      }
      h += '    </ul></div>';
    }

    /* Spalte 4: Kontakt. */
    h += '    <div class="footer-spalte"><h2>Kontakt</h2>';
    h += '      <div class="footer-kontakt">';
    if (FIRMA.telefonRoh) {
      h += '      <p style="margin:0">Beratung ' + esc(FIRMA.zeiten || '') + '<br>' +
           '<a class="telefon" href="tel:' + esc(FIRMA.telefonRoh) + '">' + esc(FIRMA.telefon) + '</a></p>';
    }
    if (FIRMA.email) {
      h += '      <p style="margin:0"><a href="mailto:' + esc(FIRMA.email) + '">' + esc(FIRMA.email) + '</a></p>';
    }
    h += '        <p style="margin:0"><strong>' + esc(FIRMA.betreiber || '') + '</strong><br>' +
         esc(FIRMA.ort || '') + '</p>';
    /* Ein Kontaktformular gibt es in diesem Geruest nicht. Statt darauf zu
       verweisen, steht hier der Weg, der wirklich funktioniert. */
    if (FIRMA.email) {
      h += '      <p style="margin:0"><a class="weiterlink" href="mailto:' + esc(FIRMA.email) +
           '">Anfrage per E-Mail schreiben</a></p>';
    }
    h += '      </div>';
    h += '    </div>';

    h += '  </div></div>';

    h += '  <div class="footer-schluss"><div class="container">';
    h += '    <p style="margin:0">&copy; ' + new Date().getFullYear() + ' ' + esc(FIRMA.betreiber || '') +
         ' · Alle Preise inkl. gesetzlicher MwSt.</p>';
    h += '    <ul>';
    h += '      <li><a href="' + esc(route('impressum').href) + '">Impressum</a></li>';
    h += '      <li><a href="' + esc(route('datenschutz').href) + '">Datenschutz</a></li>';
    h += '      <li><a href="' + esc(route('agb').href) + '">AGB</a></li>';
    h += '      <li><a href="' + esc(route('widerruf').href) + '">Widerruf</a></li>';
    /* Entwicklungshilfe: die Musterseite zeigt alle Bausteine des
       Designsystems. Sie war bisher von keiner Seite aus erreichbar. */
    h += '      <li><a href="' + esc(route('styleguide').href) + '">' +
         esc(route('styleguide').titel) +
         '<span style="opacity:.72;font-size:var(--fs-200)"> · Entwicklung</span></a></li>';
    h += '    </ul>';
    h += '  </div></div>';

    h += '</footer>';
    return h;
  }

  /* ======================================================================
     Verhalten: Desktop-Menue
     ====================================================================== */

  var offenerPunkt = null;   /* <li> dessen Untermenue gerade offen ist */

  function klappOeffnen(li) {
    if (!li || li === offenerPunkt) return;
    klappSchliessen();
    var link = li.querySelector('.mainnav__link');
    var liste = li.querySelector('.mainnav__klapp');
    if (!link || !liste) return;
    liste.hidden = false;
    link.setAttribute('aria-expanded', 'true');
    offenerPunkt = li;
  }

  function klappSchliessen() {
    if (!offenerPunkt) return;
    var link = offenerPunkt.querySelector('.mainnav__link');
    var liste = offenerPunkt.querySelector('.mainnav__klapp');
    if (liste) liste.hidden = true;
    if (link) link.setAttribute('aria-expanded', 'false');
    offenerPunkt = null;
  }

  function verdrahteHauptnav(wurzel) {
    var nav = wurzel.querySelector('.mainnav');
    if (!nav) return;

    var punkte = Array.prototype.slice.call(nav.querySelectorAll('.mainnav__punkt'));
    var hauptlinks = punkte.map(function (li) { return li.querySelector('.mainnav__link'); });

    punkte.forEach(function (li) {
      var link = li.querySelector('.mainnav__link');
      var liste = li.querySelector('.mainnav__klapp');
      if (!link) return;

      if (liste) {
        /* Maus: aufklappen beim Ueberfahren, zuklappen beim Verlassen. */
        li.addEventListener('mouseenter', function () { klappOeffnen(li); });
        li.addEventListener('mouseleave', function () {
          /* Nicht schliessen, solange der Fokus noch drin steht. */
          if (!li.contains(document.activeElement)) klappSchliessen();
        });
        /* Tastatur und Tippen: der Schalter klappt auf und zu. */
        link.addEventListener('click', function () {
          if (offenerPunkt === li) klappSchliessen();
          else klappOeffnen(li);
        });
      } else {
        /* Ein Punkt ohne Untermenue schliesst ein offenes Menue. */
        link.addEventListener('focus', klappSchliessen);
        li.addEventListener('mouseenter', klappSchliessen);
      }

      /* Verlaesst der Fokus den Punkt vollstaendig, klappt er zu. */
      li.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (offenerPunkt === li && !li.contains(document.activeElement)) klappSchliessen();
        }, 0);
      });
    });

    /* Tastatursteuerung fuer das gesamte Menue. */
    nav.addEventListener('keydown', function (ev) {
      var ziel = ev.target;
      var li = ziel.closest ? ziel.closest('.mainnav__punkt') : null;
      if (!li) return;

      var istHaupt = ziel.classList.contains('mainnav__link');
      var liste = li.querySelector('.mainnav__klapp');
      var unterlinks = liste ? Array.prototype.slice.call(liste.querySelectorAll('a')) : [];
      var iHaupt = hauptlinks.indexOf(li.querySelector('.mainnav__link'));

      switch (ev.key) {
        case 'Escape':
          if (offenerPunkt) {
            ev.preventDefault();
            var zurueck = offenerPunkt.querySelector('.mainnav__link');
            klappSchliessen();
            if (zurueck) zurueck.focus();
          }
          break;

        case 'ArrowDown':
          if (!unterlinks.length) break;
          ev.preventDefault();
          if (istHaupt) {
            klappOeffnen(li);
            unterlinks[0].focus();
          } else {
            var n = unterlinks.indexOf(ziel);
            unterlinks[(n + 1) % unterlinks.length].focus();
          }
          break;

        case 'ArrowUp':
          if (!unterlinks.length) break;
          ev.preventDefault();
          if (istHaupt) {
            klappOeffnen(li);
            unterlinks[unterlinks.length - 1].focus();
          } else {
            var v = unterlinks.indexOf(ziel);
            if (v <= 0) {
              klappSchliessen();
              li.querySelector('.mainnav__link').focus();
            } else {
              unterlinks[v - 1].focus();
            }
          }
          break;

        case 'ArrowRight':
          if (iHaupt > -1) {
            ev.preventDefault();
            klappSchliessen();
            hauptlinks[(iHaupt + 1) % hauptlinks.length].focus();
          }
          break;

        case 'ArrowLeft':
          if (iHaupt > -1) {
            ev.preventDefault();
            klappSchliessen();
            hauptlinks[(iHaupt - 1 + hauptlinks.length) % hauptlinks.length].focus();
          }
          break;

        case 'Home':
          ev.preventDefault();
          if (istHaupt) hauptlinks[0].focus();
          else if (unterlinks.length) unterlinks[0].focus();
          break;

        case 'End':
          ev.preventDefault();
          if (istHaupt) hauptlinks[hauptlinks.length - 1].focus();
          else if (unterlinks.length) unterlinks[unterlinks.length - 1].focus();
          break;
      }
    });

    /* Klick ausserhalb schliesst. */
    document.addEventListener('click', function (ev) {
      if (offenerPunkt && !offenerPunkt.contains(ev.target)) klappSchliessen();
    });
  }

  /* ======================================================================
     Verhalten: Schubfach
     ====================================================================== */

  var schubfach, schleier, schalter, letzterFokus = null;
  var FOKUSSIERBAR = 'a[href], button:not([disabled]), input:not([disabled]), ' +
                     'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function schubfachOeffnen() {
    if (!schubfach) return;
    letzterFokus = document.activeElement;
    schleier.hidden = false;
    schubfach.hidden = false;
    /* Naechster Bildaufbau, damit der Uebergang greift. */
    window.requestAnimationFrame(function () {
      schleier.classList.add('ist-offen');
      schubfach.classList.add('ist-offen');
    });
    document.body.classList.add('ist-gesperrt');
    if (schalter) schalter.setAttribute('aria-expanded', 'true');
    var zu = schubfach.querySelector('#schubfach-zu');
    if (zu) zu.focus();
  }

  function schubfachSchliessen() {
    if (!schubfach || schubfach.hidden) return;
    schleier.classList.remove('ist-offen');
    schubfach.classList.remove('ist-offen');
    document.body.classList.remove('ist-gesperrt');
    if (schalter) schalter.setAttribute('aria-expanded', 'false');

    var fertig = function () {
      schubfach.hidden = true;
      schleier.hidden = true;
    };
    /* Erst nach dem Uebergang ausblenden — bei reduzierter Bewegung sofort. */
    var reduziert = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(fertig, reduziert ? 0 : 250);

    if (letzterFokus && letzterFokus.focus) letzterFokus.focus();
    letzterFokus = null;
  }

  function verdrahteSchubfach() {
    schubfach = document.getElementById('schubfach');
    schleier = document.getElementById('schleier');
    schalter = document.getElementById('menue-schalter');
    if (!schubfach || !schleier) return;

    if (schalter) schalter.addEventListener('click', schubfachOeffnen);
    schleier.addEventListener('click', schubfachSchliessen);
    var zu = schubfach.querySelector('#schubfach-zu');
    if (zu) zu.addEventListener('click', schubfachSchliessen);

    /* Untermenues im Schubfach auf- und zuklappen. */
    schubfach.addEventListener('click', function (ev) {
      var knopf = ev.target.closest ? ev.target.closest('.schubnav__auf') : null;
      if (!knopf) return;
      var liste = document.getElementById(knopf.getAttribute('aria-controls'));
      if (!liste) return;
      var offen = knopf.getAttribute('aria-expanded') === 'true';
      knopf.setAttribute('aria-expanded', offen ? 'false' : 'true');
      liste.hidden = offen;
    });

    /* Escape schliesst, Tab bleibt im Schubfach. */
    schubfach.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.preventDefault(); schubfachSchliessen(); return; }
      if (ev.key !== 'Tab') return;

      var elemente = Array.prototype.slice.call(schubfach.querySelectorAll(FOKUSSIERBAR))
        .filter(function (el) { return el.offsetParent !== null; });
      if (!elemente.length) return;
      var erstes = elemente[0], letztes = elemente[elemente.length - 1];

      if (ev.shiftKey && document.activeElement === erstes) {
        ev.preventDefault(); letztes.focus();
      } else if (!ev.shiftKey && document.activeElement === letztes) {
        ev.preventDefault(); erstes.focus();
      }
    });

    /* Wird das Fenster breit genug fuer die Desktop-Navigation, schliesst
       das Schubfach, damit kein unsichtbarer Dialog offen bleibt. */
    if (window.matchMedia) {
      var mq = window.matchMedia('(min-width: 1024px)');
      var reagiere = function (e) { if (e.matches) schubfachSchliessen(); };
      if (mq.addEventListener) mq.addEventListener('change', reagiere);
      else if (mq.addListener) mq.addListener(reagiere);
    }
  }

  /* ======================================================================
     Warenkorbzaehler
     ====================================================================== */

  function warenkorbSetzen(anzahl) {
    var abzeichen = document.getElementById('korb-zaehler');
    var text = document.getElementById('korb-text');
    if (!abzeichen) return;
    var n = Number(anzahl) || 0;
    if (n > 0) {
      abzeichen.textContent = n > 99 ? '99+' : String(n);
      abzeichen.hidden = false;
      /* "Artikel" ist im Deutschen in Ein- und Mehrzahl dasselbe Wort —
         hier stand frueher ein Ternaer mit zwei gleichen Zweigen. */
      if (text) text.textContent = 'Warenkorb, ' + n + ' Artikel';
    } else {
      abzeichen.hidden = true;
      if (text) text.textContent = 'Warenkorb, leer';
    }
  }

  /* Holt den Stand von der bestehenden Bruecke. Faellt die Anfrage aus,
     bleibt der Zaehler einfach leer — es wird nichts gemeldet. */
  function warenkorbAktualisieren() {
    if (typeof window.fetch !== 'function') return Promise.resolve(null);
    return window.fetch('/api/cart', {
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    })
      .then(function (a) { return a.ok ? a.json() : null; })
      .then(function (d) {
        if (d && typeof d.count === 'number') {
          warenkorbSetzen(d.count);
          document.dispatchEvent(new CustomEvent('net:warenkorb', { detail: d }));
          return d;
        }
        return null;
      })
      .catch(function () { return null; });   /* still scheitern */
  }

  /* ======================================================================
     Start
     ====================================================================== */

  function start() {
    var kopf = document.getElementById('kopf');
    var fuss = document.getElementById('fuss');

    if (kopf) {
      kopf.innerHTML = baueKopf() + baueSchubfach();
      verdrahteHauptnav(kopf);
      verdrahteSchubfach();
      warenkorbSetzen(0);
      warenkorbAktualisieren();
    }
    if (fuss) fuss.innerHTML = baueFuss();

    /* Wird die Seite aus dem Verlauf zurueckgeholt, kann der Warenkorb
       inzwischen anders aussehen. */
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) warenkorbAktualisieren();
    });
  }

  window.NetShell = {
    warenkorbAktualisieren: warenkorbAktualisieren,
    warenkorbSetzen: warenkorbSetzen,
    schubfachSchliessen: schubfachSchliessen,
    esc: esc
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
