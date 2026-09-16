/* ==========================================================================
   shell.js — gemeinsamer Seitenrahmen des matten.net-Nachbaus (net-neu)
   --------------------------------------------------------------------------
   Baut aus window.NET (assets/js/daten.js, erzeugt von bau-net-daten.mjs)
   in die Platzhalter #net-kopf und #net-fuss das Markup von matten.net
   (Vorlage: spec/screens/startseite.html, Spec Abschnitt 2 und 3):

     #net-kopf   Kopfzeile · Warenkorb-Modal #cart-modal · mobile Navbar ·
                 Desktop-Navbar (nav.main-navbar mit Bildmenue)
     #net-fuss   Newsletter-Widget · Fusszeile · Cookie-Hinweis

   Bewusst weggelassen (siehe LIESMICH.md): das Warnbanner "Entwicklungs-
   website" und die zweite, funktionslose Sprachauswahl der mobilen Leiste.

   Ausserdem stellt die Datei die Hilfsfunktionen bereit, mit denen alle
   Seiten mit der Bruecke (/api/…, Port 8787) sprechen — window.Shell:

     Shell.esc(text)                HTML-sicher
     Shell.param(name, vorgabe)     Wert aus der Adresszeile
     Shell.hole(url)                GET  -> Promise<{ok, http, d}>   (wirft nie)
     Shell.sende(url, daten)        POST -> Promise<{ok, http, d}>   (wirft nie)
     Shell.bild(pfad)               nur /api/img/… durchlassen, sonst null
     Shell.warenkorbLaden()         GET /api/cart, rendert das Modal, setzt Zaehler
     Shell.warenkorbZaehler(n)      "Cart (n)" im Kopf
     Shell.warenkorbOeffnen()       Modal oeffnen (laedt frisch)
     Shell.knopfArbeitet(btn, ja)   fa-spinner-Effekt (Spec 10)
     Shell.produktkarte(produkt)    Markup einer Produktkarte (Spec 5)

   Grundsatz: im Browser wird KEIN Geldbetrag gerechnet. Alle Betraege im
   Warenkorb sind Zeichenketten des Altsystems. Kein Aufruf geht an einen
   fremden Host; Bilder des Altsystems laufen nur ueber /api/img/.
   ========================================================================== */

(function () {
  'use strict';

  var NET = window.NET || {};

  /* ======================================================================
     1  Helfer
     ====================================================================== */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function param(name, vorgabe) {
    try {
      var w = new URLSearchParams(window.location.search).get(name);
      return w == null || w === '' ? (vorgabe == null ? '' : vorgabe) : w;
    } catch (e) { return vorgabe == null ? '' : vorgabe; }
  }

  function antwort(r) {
    return r.json().catch(function () { return {}; })
      .then(function (d) { return { http: r.status, ok: r.ok && d.ok !== false, d: d || {} }; });
  }
  var NETZFEHLER = { http: 0, ok: false, d: { ok: false, fehler: 'Die Brücke zum Altsystem antwortet nicht (läuft der Server auf Port 8787?).' } };

  function hole(url) {
    return fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(antwort).catch(function () { return NETZFEHLER; });
  }

  function sende(url, daten) {
    return fetch(url, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(daten || {})
    }).then(antwort).catch(function () { return NETZFEHLER; });
  }

  /* Bilder des Altsystems: nur der Bildproxy, nie matten.de direkt. */
  function bild(pfad) {
    var s = String(pfad == null ? '' : pfad).trim();
    if (s.indexOf('/api/img/') === 0) return s;
    if (s.indexOf('/media/') === 0) return '/api/img' + s.slice('/media'.length);
    return null;
  }

  /* Seitenweiter Absendeknopf-Effekt (Spec 10): Breite festhalten, Spinner
     statt Beschriftung, Knopf sperren. */
  function knopfArbeitet(knopf, ja) {
    if (!knopf) return;
    if (ja) {
      if (!knopf.dataset.html) {
        knopf.dataset.html = knopf.innerHTML;
        knopf.style.width = knopf.getBoundingClientRect().width + 'px';
      }
      knopf.disabled = true;
      knopf.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    } else {
      knopf.disabled = false;
      if (knopf.dataset.html) { knopf.innerHTML = knopf.dataset.html; delete knopf.dataset.html; }
      knopf.style.width = '';
    }
  }

  /* ======================================================================
     2  Markup: Kopfzeile (Spec 2.2, Markup 1:1 aus startseite.html)
     ====================================================================== */

  function baueKopf() {
    var K = NET.kopfzeile || {};
    var logo = K.logo || {};
    var sw = K.sprachwahl || { optionen: [] };
    var aktuell = null;
    sw.optionen.forEach(function (o) { if (o.label === sw.aktuell) aktuell = o; });

    var h = '<div class="big-container">\n<div class="row">\n' +
      '<!-- Logo col -->\n<div class="col-lg-6">\n' +
      '<a class="logo-link" href="' + esc(logo.href || 'index.html') + '">\n' +
      '<h1 class="logo" style="margin-bottom: 0;">' +
      (logo.img ? '<img src="' + esc(logo.img) + '" width="' + esc(logo.breite || 1024) + '" height="' + esc(logo.hoehe || 197) + '" class="d-md-inline" alt="Logo">' : 'Mattenfuchs') +
      '</h1>\n</a>\n</div>\n' +
      '<!-- Cart & search col -->\n<div class="col-lg-6">\n' +
      '<div class="text-right header-links">\n' +
      '<div class="dropdown d-inline">\n' +
      '<a href="#" class="dropdown-toggle " data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
      (aktuell && aktuell.flagge ? '<img src="' + esc(aktuell.flagge) + '" alt="' + esc(sw.aktuell) + '" width="25" height="25"> ' : '') +
      esc(sw.aktuell || 'Deutsch') + '</a>\n' +
      '<div class="dropdown-menu" aria-labelledby="language-dropdown">\n';
    sw.optionen.forEach(function (o) {
      h += '<a class="dropdown-item" href="' + esc(o.href) + '"' + (o.title ? ' title="' + esc(o.title) + '"' : '') + '>' +
        (o.flagge ? '<img src="' + esc(o.flagge) + '" alt="' + esc(o.label) + '" width="25" height="25" style="vertical-align: top;"> ' : '') +
        esc(o.label) + '</a>\n';
    });
    h += '</div>\n</div>\n';
    (K.links || []).forEach(function (l) {
      h += '<span class="divider"></span>\n<a href="' + esc(l.href) + '">' + esc(l.label) + '</a>\n';
    });
    h += '</div>\n' +
      '<div class="float-sm-right row no-gutters">\n<div class="col-sm-6">\n' +
      '<div class="btn-group mb-2 mb-sm-0" style="width: 100%;">\n' +
      '<button class="btn btn-light" data-toggle="modal" data-target="#cart-modal" style="white-space: nowrap" type="button">\n' +
      '<i class="fas fa-shopping-cart"></i>\n<span>' + esc((K.warenkorbKnopf || {}).label || 'Cart') +
      '<span id="cart-count"></span></span>\n</button>\n' +
      '<a href="' + esc((K.checkoutKnopf || {}).href || 'checkout.html') + '" class="btn btn-orange">' + esc((K.checkoutKnopf || {}).label || 'Auschecken') + '</a>\n' +
      '</div>\n</div>\n<div class="col-sm-6">\n' +
      '<form action="' + esc((K.suche || {}).formAction || 'products.html') + '" method="get" class="ml-sm-2">\n' +
      '<div class="input-group search-box">\n' +
      '<input type="text" class="form-control" name="' + esc((K.suche || {}).feld || 'keyword') + '" placeholder="' + esc((K.suche || {}).platzhalter || 'Produkt suchen') + '" value="' + esc(param('keyword', '')) + '">\n' +
      '<div class="input-group-append">\n<button class="btn btn-primary" type="submit"><i class="fas fa-search"></i></button>\n</div>\n' +
      '</div>\n</form>\n</div>\n</div>\n</div>\n<!-- End cart col -->\n</div>\n</div>\n';
    return h;
  }

  /* ======================================================================
     3  Markup: Warenkorb-Modal (Spec 2.3, 1:1)
     ====================================================================== */

  function baueModal() {
    return '<div class="modal fade" id="cart-modal" tabindex="-1" role="dialog" aria-hidden="true">\n' +
      '<div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered" role="document">\n' +
      '<div class="modal-content" style="background-color: initial;">\n' +
      '<div class="modal-header bg-primary" style="border: none;">\n' +
      '<button type="button" class="close text-white" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\n' +
      '</div>\n' +
      '<div class="modal-body p-0 bg-white cart-container">\n' +
      '<div style="position: absolute; background-color: rgba(255, 255, 255, 0.5); z-index: 20; width: 100%; height: 100%;" class="d-none justify-content-center align-items-center cart-loading">\n' +
      '<div class="spinner-border" role="status" style="width: 3rem; height: 3rem;"><span class="sr-only">Loading...</span></div>\n' +
      '</div>\n' +
      '<div class="cart-fehler"></div>\n' +
      '<table class="table">\n<thead class="thead-dark">\n<tr>\n' +
      '<th></th>\n<th></th>\n<th>Produkt</th>\n<th class="text-right">Preis</th>\n' +
      '<th class="text-right" style="width: 1%;">Menge</th>\n<th class="text-right">Total</th>\n<th class="text-center"></th>\n' +
      '</tr>\n</thead>\n<tbody id="cart-zeilen">\n' + leereZeile() + '</tbody>\n' +
      '<tfoot class="tfoot-light" id="cart-summen">\n' + summenZeilen(null) + '</tfoot>\n</table>\n' +
      '<div class="text-right p-2">\n' +
      '<a href="index.html" class="btn btn-secondary" data-dismiss="modal"><i class="fas fa-fw fa-angle-left"></i>Weiter einkaufen</a>\n' +
      '</div>\n</div>\n</div>\n</div>\n</div>\n';
  }

  function leereZeile() {
    return '<tr><td colspan="7"><p class="text-center">Your cart is empty.</p></td></tr>\n';
  }

  /* Die Summen kommen als Zeichenketten des Altsystems (GET /api/cart):
     zwischensumme, versand, umsatzsteuer, gesamt. Eine "Nettosumme" liefert
     die Bruecke nicht — sie wird nur angezeigt, wenn ein solches Feld
     mitkommt; gerechnet wird hier nichts.
     Bei einem Anfragenkorb (modus 'anfrage' oder 'gemischt') liefert das
     Altsystem in "gesamt" einen internen Betrag, obwohl die Positionen
     "auf Anfrage" stehen — der wird nicht gezeigt (Kontrakt). */
  function summenZeilen(korb) {
    var k = korb || {};
    var leer = !k || !(k.items || []).length;
    var anfrage = !leer && k.modus && k.modus !== 'kauf';
    var w = function (v) { return leer ? '&euro; 0.00' : anfrage ? 'auf Anfrage' : (v ? esc(v) : '&mdash;'); };
    var ust = 'VAT ' + (k.ustSatz != null ? esc(Number(k.ustSatz).toFixed(2)) : '19.00') + '%';
    function zeile(bez, wert) {
      return '<tr><th colspan="5" class="text-right">' + bez + '</th>' +
        '<td class="text-right" style="white-space: nowrap;"><strong>' + wert + '</strong></td><td></td></tr>\n';
    }
    var netto = k.nettosumme || k.netto || null;
    return zeile('Subtotal', w(k.zwischensumme)) +
      zeile('Versandkosten', w(k.versand)) +
      zeile('Nettosumme', leer ? '&euro; 0.00' : anfrage ? 'auf Anfrage' : (netto ? esc(netto) : '<span class="cart-hinweis" title="liefert das Altsystem nicht">&mdash;</span>')) +
      zeile(ust, w(k.umsatzsteuer)) +
      zeile('Total', w(k.gesamt));
  }

  /* Der zuletzt gelesene Korb — die Produktseite fragt ihn, bevor sie eine
     Anfrage in einen Korb mit Kaufpositionen legt (gemischter Korb). */
  var letzterKorb = null;
  function letzterKorbLesen() { return letzterKorb; }

  var GEMISCHT_HINWEIS = 'Ihr Warenkorb enthält Kauf- und Anfragepositionen. Das Altsystem behandelt ihn damit ' +
    'als Anfrage — die Kaufartikel werden nicht bestellt, sondern mit angefragt.';

  function korbZeile(p) {
    var name = p.name || (p.attribut ? '' : 'Artikel ohne Bezeichnung');
    var b = bild(p.bild);
    return '<tr data-key="' + esc(p.key) + '">' +
      '<td>' + (b ? '<img class="cart-pos-bild" src="' + esc(b) + '" alt="">' : '') + '</td>' +
      '<td></td>' +
      '<td>' + (p.pfad && p.pfadLokal ? '<a href="' + esc(p.pfadLokal) + '">' + esc(name) + '</a>' : esc(name)) +
        (p.attribut ? '<span class="cart-pos-attribut">' + esc(p.attribut) + '</span>' : '') +
        (p.kommentar ? '<span class="cart-pos-kommentar">' + esc(p.kommentar) + '</span>' : '') + '</td>' +
      '<td class="text-right">' + esc(p.preis || '') + '</td>' +
      '<td class="text-right"><input type="number" class="form-control form-control-sm cart-menge" min="0" max="999" step="1" value="' + esc(p.anzahl) + '" aria-label="Menge"></td>' +
      '<td class="text-right">' + esc(p.summe || '') + '</td>' +
      '<td class="text-center"><button type="button" class="btn btn-link cart-entfernen" title="Entfernen" aria-label="Entfernen"><i class="fas fa-times"></i></button></td>' +
      '</tr>\n';
  }

  /* Der matten.de-Pfad einer Position -> Produktseite des Nachbaus, sofern
     ein matten.net-Produkt darauf abgebildet ist. */
  function lokalerProduktPfad(dePfad) {
    var z = NET.zuordnung || {};
    var treffer = null;
    Object.keys(z).forEach(function (slug) {
      if (!treffer && (z[slug].dePfad === dePfad || z[slug].deZwilling === dePfad)) treffer = slug;
    });
    return treffer ? 'produkt.html?slug=' + treffer : null;
  }

  function warenkorbAnzeigen(korb) {
    if (korb && typeof korb === 'object') letzterKorb = korb;
    var zeilen = document.getElementById('cart-zeilen');
    var summen = document.getElementById('cart-summen');
    if (!zeilen || !summen) return;
    var items = (korb && korb.items) || [];
    zeilen.innerHTML = items.length
      ? items.map(function (p) { p.pfadLokal = lokalerProduktPfad(p.pfad); return korbZeile(p); }).join('')
      : leereZeile();
    summen.innerHTML = summenZeilen(korb);
    warenkorbZaehler(korb ? korb.count : 0);
    var offen = items.filter(function (p) { return p.preisNum == null; }).length;
    var f = document.querySelector('#cart-modal .cart-fehler');
    if (f) {
      var h = '';
      if (korb && korb.modus === 'gemischt') {
        h += '<div class="alert alert-warning mt-2 mb-0" role="status">' + GEMISCHT_HINWEIS + '</div>';
      }
      if (offen) {
        h += '<p class="cart-hinweis pt-2 mb-0">' + offen + (offen === 1 ? ' Position steht' : ' Positionen stehen') +
          ' „auf Anfrage“ — den berechneten Preis bestätigt der Anbieter im Angebot.</p>';
      }
      f.innerHTML = h;
    }
  }

  function warenkorbZaehler(n) {
    var el = document.getElementById('cart-count');
    if (!el) return;
    var z = Number(n) || 0;
    el.textContent = z > 0 ? ' (' + z + ')' : '';
  }

  function ladeAnzeige(ja) {
    var l = document.querySelector('#cart-modal .cart-loading');
    if (!l) return;
    l.classList.toggle('d-none', !ja);
    l.classList.toggle('d-flex', !!ja);
  }

  function korbFehler(text) {
    var f = document.querySelector('#cart-modal .cart-fehler');
    if (f) f.innerHTML = text ? '<div class="alert alert-danger mt-2" role="alert">' + esc(text) + '</div>' : '';
  }

  function warenkorbLaden() {
    ladeAnzeige(true);
    return hole('/api/cart').then(function (res) {
      ladeAnzeige(false);
      if (!res.ok) { korbFehler(res.d.fehler || 'Der Warenkorb ließ sich nicht laden.'); return null; }
      warenkorbAnzeigen(res.d);
      return res.d;
    });
  }

  var mengenUhren = {};
  function mengeSetzen(key, anzahl) {
    ladeAnzeige(true);
    return sende('/api/cart/menge', { key: key, anzahl: anzahl }).then(function (res) {
      ladeAnzeige(false);
      if (!res.ok) { korbFehler(res.d.fehler || 'Die Menge ließ sich nicht setzen.'); return warenkorbLaden(); }
      warenkorbAnzeigen(res.d);
      return res.d;
    });
  }

  function verdrahteModal() {
    var modal = document.getElementById('cart-modal');
    if (!modal) return;
    if (window.jQuery) {
      window.jQuery(modal).on('show.bs.modal', function () { warenkorbLaden(); });
    }
    modal.addEventListener('click', function (ev) {
      var knopf = ev.target.closest ? ev.target.closest('.cart-entfernen') : null;
      if (!knopf) return;
      var tr = knopf.closest('tr');
      if (tr) mengeSetzen(tr.getAttribute('data-key'), 0);
    });
    modal.addEventListener('change', function (ev) {
      var feld = ev.target.closest ? ev.target.closest('.cart-menge') : null;
      if (!feld) return;
      var tr = feld.closest('tr');
      var key = tr.getAttribute('data-key');
      var n = Math.max(0, Math.min(999, Math.trunc(Number(feld.value) || 0)));
      window.clearTimeout(mengenUhren[key]);
      mengenUhren[key] = window.setTimeout(function () { mengeSetzen(key, n); }, 250);
    });
  }

  function warenkorbOeffnen() {
    if (window.jQuery) window.jQuery('#cart-modal').modal('show');
  }

  /* ======================================================================
     4  Markup: Navigation (Spec 3; Markup 1:1 aus startseite.html)
     ====================================================================== */

  function kategorieKachel(k) {
    return '<div class="col-2 category-dropdown-link-container">\n' +
      '<a class="category-dropdown-link" href="' + esc(k.href) + '">\n' +
      (k.bild
        ? '<img src="' + esc(k.bild) + '" width="150" height="100" alt="Category" style="width: 100%; height: auto;">\n'
        : '<span class="kachel-leer" aria-hidden="true"></span>\n') +
      '<p class="text-center text-dark">' + esc(k.label) + '</p>\n</a>\n</div>\n';
  }

  function baueNavDesktop() {
    var h = '<nav class="navbar navbar-expand bg-gradient-primary pl-0 pr-0 d-none d-lg-block mt-1 main-navbar">\n' +
      '<div class="big-container" style="position: relative;">\n<div class="collapse navbar-collapse">\n<ul class="navbar-nav">\n';
    ((NET.navigation || {}).eintraege || []).forEach(function (e) {
      if (e.typ === 'link') {
        h += '<li class="nav-item"><a href="' + esc(e.href) + '" class="nav-link">' + esc(e.label) + '</a></li>\n';
        return;
      }
      h += '<li class="nav-item">\n<span class="nav-link pr-1 pl-1 mr-1 ml-1 category-dropdown-trigger">\n' + esc(e.label) + '\n' +
        '<div class="category-dropdown-menu pl-2 pr-2 pt-2">\n<div class="row no-gutters">\n' +
        (e.kategorien || []).map(kategorieKachel).join('') +
        '</div>\n</div>\n</span>\n</li>\n';
    });
    h += '</ul>\n</div>\n</div>\n</nav>\n';
    return h;
  }

  /* Mobile Leiste (Spec 3.2): Home zuerst, Mattendesigner zwischen Fussmatten
     und Logomatten, Text-Dropdowns; "Alle Produkte" und "Blog" fehlen dort
     wie im Original. Die zweite Sprachauswahl am Ende ist weggelassen. */
  function baueNavMobil() {
    var eintraege = ((NET.navigation || {}).eintraege || []);
    var gruppen = eintraege.filter(function (e) { return e.typ === 'gruppe'; });
    var designer = eintraege.filter(function (e) { return e.typ === 'link' && /designer/i.test(e.label); })[0];
    var reihe = [];
    gruppen.forEach(function (g, i) {
      reihe.push(g);
      if (i === 0 && designer) reihe.push(designer);
    });
    var h = '<nav class="navbar navbar-expand-lg navbar-dark bg-gradient-primary mt-1 d-lg-none">\n' +
      '<a class="navbar-brand" href="#"></a>\n' +
      '<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>\n' +
      '<div class="collapse navbar-collapse" id="navbarSupportedContent">\n<ul class="navbar-nav mr-auto">\n' +
      '<li class="nav-item"><a class="nav-link " href="index.html">Home</a></li>\n';
    reihe.forEach(function (e, i) {
      if (e.typ === 'link') {
        h += '<li class="nav-item"><a class="nav-link" href="' + esc(e.href) + '">' + esc(e.label) + '</a></li>\n';
        return;
      }
      var id = 'navbarDropdown-' + i;
      h += '<li class="nav-item dropdown">\n' +
        '<a class="nav-link dropdown-toggle" href="#" id="' + id + '" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + esc(e.label) + '</a>\n' +
        '<div class="dropdown-menu" aria-labelledby="' + id + '">\n' +
        (e.kategorien || []).map(function (k) {
          return '<a class="dropdown-item bg-blue" href="' + esc(k.href) + '">' + esc(k.label) + '</a>\n';
        }).join('') +
        '</div>\n</li>\n';
    });
    h += '</ul>\n</div>\n</nav>\n';
    return h;
  }

  /* ======================================================================
     5  Markup: Newsletter-Widget und Fusszeile (Spec 2.6, 2.7)
     ====================================================================== */

  function baueNewsletter() {
    var N = (NET.fusszeile || {}).newsletterWidget || {};
    /* Das Original hat weder action noch method und keine Funktion. Hier
       wird das Absenden abgefangen und ein Hinweis gezeigt (Briefing). */
    return '<div class="subscribe-widget-container padding-top">\n<div class="subscribe-widget">\n' +
      '<form id="subscribe-form" method="post" action="#">\n' +
      '<label class="subscribe-widget-label" for="subscribe-email">' + esc(N.label || 'Newsletter abonnieren') + '</label>\n' +
      '<div class="input-group mb-3">\n' +
      '<input id="subscribe-email" type="text" class="form-control subscribe-widget-input" placeholder="' + esc(N.platzhalter || 'eMail-Adresse') + '">\n' +
      '<div class="input-group-append"><button class="btn btn-warning subscribe-widget-button" type="submit">' + esc(N.knopf || 'Abonnieren') + '</button></div>\n' +
      '</div>\n<p class="small text-muted mb-0" id="subscribe-hinweis"></p>\n</form>\n</div>\n</div>\n';
  }

  function baueFuss() {
    var F = NET.fusszeile || { spalten: [] };
    var h = '<footer class="footer p-2">\n<div class="container">\n<div class="row">\n';
    (F.spalten || []).forEach(function (sp) {
      h += '<div class="col">\n<h3 class="footer-title">' + esc(sp.titel) + '</h3>\n';
      if (sp.inhalt) {
        h += '<div class="footer-links mt-3">\n<div class="contact-info">' + sp.inhalt.map(esc).join('\n') + '</div>\n' +
          (F.cards ? '<img src="' + esc(F.cards) + '" class="mt-2" width="200" alt="">\n' : '') + '</div>\n';
      } else {
        h += '<ul class="footer-links mt-3">\n' + (sp.links || []).map(function (l) {
          var extern = /^https?:/.test(l.href || '');
          return '<li><a href="' + esc(l.href || '#') + '"' + (extern ? ' target="_blank" rel="noopener"' : '') + '>' +
            (l.icon ? '<i class="' + esc(l.icon) + ' fa-fw"></i> ' : '') + esc(l.label) + '</a></li>\n';
        }).join('') + '</ul>\n';
      }
      h += '</div>\n';
    });
    h += '</div>\n</div>\n<div class="text-center text-muted">' + esc(F.copyright || '© 2026 Mattenfuchs') + '</div>\n</footer>\n';
    return h;
  }

  /* ======================================================================
     6  Cookie-Hinweis (cookieconsent, Spec 1) — schlicht nachgebaut
     ====================================================================== */

  var COOKIE_SCHLUESSEL = 'net-neu-cookieconsent';

  function cookieGemerkt() {
    try { return window.localStorage.getItem(COOKIE_SCHLUESSEL) === 'ja'; } catch (e) { return false; }
  }

  function baueCookie() {
    if (cookieGemerkt()) return '';
    return '<div class="cc-window" id="cookieconsent" role="dialog" aria-label="Cookie-Hinweis">\n' +
      '<span class="cc-message">Diese Website nutzt Cookies, um bestmögliche Funktionalität bieten zu können. ' +
      '<a class="cc-link" href="pages.html?s=data-protection">Mehr Infos</a></span>\n' +
      '<button type="button" class="cc-btn" id="cookieconsent-ok">Einverstanden</button>\n</div>\n';
  }

  function verdrahteCookie() {
    var ok = document.getElementById('cookieconsent-ok');
    if (!ok) return;
    ok.addEventListener('click', function () {
      try { window.localStorage.setItem(COOKIE_SCHLUESSEL, 'ja'); } catch (e) { /* ohne Speicher: nur ausblenden */ }
      var w = document.getElementById('cookieconsent');
      if (w) w.hidden = true;
    });
  }

  /* ======================================================================
     7  Produktkarte (Spec 5) — ohne den Link-im-Link des Originals
     ====================================================================== */

  function produktkarte(p) {
    if (!p) return '';
    return '<div class="col-6 col-lg-4 col-xl-3 mb-3">\n<!-- Product card -->\n' +
      '<a href="' + esc(p.href) + '" title="' + esc(p.name) + '">\n<div class="card product-card">\n' +
      (p.kachel
        ? '<img src="' + esc(p.kachel) + '" class="card-img-top img-fluid" width="256" height="170" alt="' + esc(p.name) + '">\n'
        : '<span class="card-img-top card-img-leer" role="img" aria-label="Kein Bild vorhanden"></span>\n') +
      '<div class="card-body">\n<h5 class="card-title product-card-title">' +
      '<span title="' + esc(p.name) + '">' + esc(p.name) + '</span></h5>\n</div>\n</div>\n</a>\n' +
      '<!-- End product card -->\n</div>\n';
  }

  /* ======================================================================
     8  Start
     ====================================================================== */

  function start() {
    var kopf = document.getElementById('net-kopf');
    var fuss = document.getElementById('net-fuss');
    if (kopf) kopf.innerHTML = baueKopf() + baueModal() + baueNavMobil() + baueNavDesktop();
    if (fuss) fuss.innerHTML = baueNewsletter() + baueFuss() + baueCookie();

    verdrahteModal();
    verdrahteCookie();

    /* Bildmenue: beim Ueberfahren den dunklen Schleier (.overlay) einblenden. */
    var overlay = document.querySelector('.overlay');
    if (overlay) {
      Array.prototype.forEach.call(document.querySelectorAll('.category-dropdown-trigger'), function (t) {
        t.addEventListener('mouseenter', function () { overlay.style.display = 'block'; });
        t.addEventListener('mouseleave', function () { overlay.style.display = 'none'; });
      });
    }

    /* Newsletter: abgefangen, Hinweis statt Fremdversand. */
    var nl = document.getElementById('subscribe-form');
    if (nl) {
      nl.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var h = document.getElementById('subscribe-hinweis');
        if (h) h.textContent = 'Der Newsletter ist in Vorbereitung — es wurde nichts gesendet.';
      });
    }

    /* Zaehler im Kopf still nachziehen (kein Modal, kein Fehler). */
    var still = function () {
      return hole('/api/cart').then(function (res) {
        if (res.ok) { letzterKorb = res.d; warenkorbZaehler(res.d.count); }
        return res.ok ? res.d : null;
      });
    };
    still();
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) still(); });
  }

  window.Shell = {
    esc: esc, param: param, hole: hole, sende: sende, bild: bild,
    knopfArbeitet: knopfArbeitet,
    warenkorbLaden: warenkorbLaden, warenkorbAnzeigen: warenkorbAnzeigen,
    warenkorbZaehler: warenkorbZaehler, warenkorbOeffnen: warenkorbOeffnen,
    letzterKorb: letzterKorbLesen, GEMISCHT_HINWEIS: GEMISCHT_HINWEIS,
    produktkarte: produktkarte
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
