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
     Shell.hole(url, grenzeMs?)     GET  -> Promise<{ok, http, d}>   (wirft nie)
     Shell.sende(url, daten)        POST -> Promise<{ok, http, d}>   (wirft nie)
     Shell.bild(pfad)               nur /api/img/… durchlassen, sonst null
     Shell.warenkorbLaden()         GET /api/cart (immer frisch), rendert das
                                    Modal, setzt Zaehler
     Shell.warenkorbZaehler(n)      "Cart (n)" im Kopf, merkt die Zahl
     Shell.warenkorbOeffnen()       Modal oeffnen (laedt frisch)
     Shell.knopfArbeitet(btn, ja)   fa-spinner-Effekt (Spec 10)
     Shell.produktkarte(produkt)    Markup einer Produktkarte (Spec 5)

   Grundsatz: im Browser wird KEIN Geldbetrag gerechnet. Alle Betraege im
   Warenkorb sind Zeichenketten des Altsystems. Kein Aufruf geht an einen
   fremden Host; Bilder des Altsystems laufen nur ueber /api/img/.

   Zweiter Grundsatz (01.10.2026): Der Warenkorb-Abruf beim Seitenstart
   darf die Bedienung nicht aufhalten. Er ist zurueckgestellt, hat eine
   Zeitgrenze und laeuft nur einmal; gemerkt wird allein die Zahl im Kopf.
   Warenkorb-Modal und Kasse lesen ausnahmslos frisch vom Server —
   ein gemerkter Stand ist nie die Wahrheit fuer Geld oder Positionen.
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

  /* Laufende Nummer: sie zaehlt jedes Ereignis weiter, das den Korb
     frischer macht als eine noch unterwegs befindliche Antwort —
     eine Schreibanfrage (sende()) und jedes ausdrueckliche Laden
     (warenkorbLaden(), also Modal und Mengenaenderung).

     Wer eine Antwort anzeigen will, merkt sich den Stand beim Losschicken
     und vergleicht beim Eintreffen. Ist er weitergezaehlt, war jemand
     schneller und die eigene Antwort ist veraltet — sie wird verworfen.

     Der stille Nachzug beim Seitenstart zaehlt NICHT mit: er ist nur ein
     Nachschauen und darf dem Modal nie die Anzeige wegnehmen. Er prueft
     beim Eintreffen lediglich, ob inzwischen etwas Neueres passiert ist. */
  var korbLesestand = 0;

  /* Wie viele Schreibanfragen am Korb gerade unterwegs sind.
     Hintergrund (gemessen 01.10.2026): Die Netlify-Function haelt die
     Sitzung des Altsystems im Cookie und schreibt sie bei JEDER Antwort
     komplett zurueck. Laufen ein Lesen und ein Schreiben gleichzeitig,
     waehrend noch keine PHPSESSID da ist, holt sich jede Anfrage ihre
     eigene Sitzung beim Altsystem — und die spaetere Antwort ueberschreibt
     die frueherere. Dann liegt die gerade hinzugefuegte Position in einer
     Sitzung, die niemand mehr benutzt: der Korb ist aus Nutzersicht leer.
     Darum fasst der stille Nachzug den Korb nicht an, solange geschrieben
     wird — er wartet, bis das Schreiben durch ist. */
  var korbSchreibt = 0;

  /* GET gegen die Bruecke. Zweites Argument (Millisekunden) setzt eine
     Zeitgrenze: laeuft sie ab, bricht der Abruf ab und liefert NETZFEHLER
     statt ewig offen zu bleiben. Ohne Angabe wartet der Abruf wie bisher. */
  function hole(url, grenzeMs) {
    var opt = { credentials: 'same-origin', headers: { Accept: 'application/json' } };
    var uhr = null;
    if (grenzeMs > 0 && typeof window.AbortController === 'function') {
      var abbruch = new window.AbortController();
      opt.signal = abbruch.signal;
      uhr = window.setTimeout(function () { try { abbruch.abort(); } catch (e) { /* egal */ } }, grenzeMs);
    }
    return fetch(url, opt).then(antwort).catch(function () { return NETZFEHLER; })
      .then(function (res) { if (uhr) window.clearTimeout(uhr); return res; });
  }

  function sende(url, daten) {
    /* Jede Schreibanfrage am Korb macht zwei Dinge ungueltig — zentral
       hier, damit keine Seite es vergessen kann:
         1. den gemerkten Zaehler,
         2. alle Korb-Abrufe, die gerade noch unterwegs sind.

       Punkt 2 war der eigentliche Bedienfehler: Der Abruf beim Seitenstart
       war losgeschickt, als der Korb noch leer war. Klickte der Nutzer in
       diesen 2,5 s "In den Warenkorb", kam die alte, leere Antwort NACH
       dem Hinzufuegen zurueck und malte den Korb wieder leer — Position
       weg, Zaehler weg, obwohl das Altsystem sie hatte. */
    var amKorb = /^\/api\/(cart|kasse)\b/.test(String(url));
    if (amKorb) {
      zaehlerSpeicherLeeren();
      ++korbLesestand;
      ++korbSchreibt;
    }
    return fetch(url, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(daten || {})
    }).then(antwort).catch(function () { return NETZFEHLER; })
      .then(function (res) {
        if (amKorb) korbSchreibt = Math.max(0, korbSchreibt - 1);
        return res;
      });
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

  /* ----------------------------------------------------------------------
     Zaehler-Zwischenspeicher (nur fuer die Zahl im Kopf)
     ----------------------------------------------------------------------
     Auf Netlify braucht GET /api/cart 2,0-2,6 s, weil die Function dafuer
     zweimal matten.de abfragt (Sitzung holen + Warenkorbseite lesen). Beim
     Seitenwechsel wuerde das jedes Mal neu passieren.

     Hier liegt daher NUR die Positionszahl im sessionStorage, zusammen mit
     dem Zeitstempel. Damit steht die Zahl im Kopf beim naechsten
     Seitenaufruf sofort, waehrend der echte Abruf nachzieht.

     Harte Grenzen, damit daraus nie eine falsche Wahrheit wird:
     - gespeichert wird ausschliesslich die Zahl, niemals Positionen,
       Preise oder Summen;
     - der Wert dient nur der Anzeige im Kopf. Warenkorb-Modal und Kasse
       lesen weiterhin ausnahmslos frisch vom Server (warenkorbLaden bzw.
       S.hole('/api/cart')), und letzterKorb() bleibt leer, bis eine echte
       Antwort da war;
     - jede Schreibanfrage an /api/cart/* oder /api/kasse/* wirft ihn weg
       (siehe sende());
     - nach ALTER_MAX gilt er als verfallen.
  */
  var ZAEHLER_SCHLUESSEL = 'netneu.korbzaehler';
  var ZAEHLER_ALTER_MAX = 5 * 60 * 1000;   /* 5 Minuten */

  function zaehlerSpeicherLesen() {
    try {
      var roh = window.sessionStorage.getItem(ZAEHLER_SCHLUESSEL);
      if (!roh) return null;
      var d = JSON.parse(roh);
      if (!d || typeof d.n !== 'number' || typeof d.t !== 'number') return null;
      if (Date.now() - d.t > ZAEHLER_ALTER_MAX) return null;
      return d.n;
    } catch (e) { return null; }     /* privates Fenster, gesperrt, Schrott */
  }

  function zaehlerSpeicherSchreiben(n) {
    try {
      window.sessionStorage.setItem(ZAEHLER_SCHLUESSEL,
        JSON.stringify({ n: Number(n) || 0, t: Date.now() }));
    } catch (e) { /* ohne Speicher laeuft alles wie vorher, nur ohne Vorschau */ }
  }

  function zaehlerSpeicherLeeren() {
    try { window.sessionStorage.removeItem(ZAEHLER_SCHLUESSEL); } catch (e) { /* egal */ }
  }

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

  /* Schreibt die Zahl in den Kopf. Jeder Aufruf kommt aus einer echten
     Serverantwort (Modal, Kasse, Designer-Kasse, stiller Nachzug) und
     frischt darum auch den Zwischenspeicher auf. Die Vorschau aus dem
     Speicher geht nicht hier durch, sondern ueber zaehlerMalen(). */
  function warenkorbZaehler(n) {
    zaehlerSpeicherSchreiben(Number(n) || 0);
    zaehlerMalen(n);
  }

  function zaehlerMalen(n) {
    var el = document.getElementById('cart-count');
    if (!el) return;
    var z = Number(n) || 0;
    el.textContent = z > 0 ? ' (' + z + ')' : '';
  }

  /* Der Spinner im Modal bleibt — das Modal liest immer frisch, und bei
     2 s Wartezeit braucht der Nutzer ein Zeichen. Er erscheint aber erst
     nach SPINNER_AB Millisekunden: eine schnelle Antwort zeigt dann gar
     keinen Spinner statt eines Aufblitzens. */
  var SPINNER_AB = 300;
  var spinnerUhr = null;

  function ladeAnzeige(ja) {
    var zeigen = function (an) {
      var l = document.querySelector('#cart-modal .cart-loading');
      if (!l) return;
      l.classList.toggle('d-none', !an);
      l.classList.toggle('d-flex', !!an);
    };
    window.clearTimeout(spinnerUhr);
    spinnerUhr = null;
    if (ja) spinnerUhr = window.setTimeout(function () { zeigen(true); }, SPINNER_AB);
    else zeigen(false);
  }

  function korbFehler(text) {
    var f = document.querySelector('#cart-modal .cart-fehler');
    if (f) f.innerHTML = text ? '<div class="alert alert-danger mt-2" role="alert">' + esc(text) + '</div>' : '';
  }

  /* Holt den Korb frisch vom Server — niemals aus dem Zwischenspeicher.
     Hier haengen Modal und Mengenaenderung dran. */
  function warenkorbLaden() {
    var meine = ++korbLesestand;
    ladeAnzeige(true);
    return hole('/api/cart').then(function (res) {
      /* Der Spinner geht IMMER aus — auch wenn diese Antwort verworfen
         wird. Sonst bliebe er nach einer ueberholten Anfrage stehen. */
      ladeAnzeige(false);
      if (meine !== korbLesestand) return null;   /* ueberholt — verwerfen */
      if (!res.ok) { korbFehler(res.d.fehler || 'Der Warenkorb ließ sich nicht laden.'); return null; }
      warenkorbAnzeigen(res.d);
      return res.d;
    });
  }

  var mengenUhren = {};
  function mengeSetzen(key, anzahl) {
    /* sende() zaehlt korbLesestand selbst weiter */
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

    /* ------------------------------------------------------------------
       Zaehler im Kopf: erst malen, dann nachfragen
       ------------------------------------------------------------------
       Vorher stand hier ein sofortiges hole('/api/cart'). Auf Netlify
       dauert dieser Aufruf 2,0-2,6 s (die Function fragt dafuer zweimal
       matten.de ab). Zwei Folgen hatte das:

       1. Der Nutzer sah erst nach gut zwei Sekunden eine Zahl im Kopf.
       2. Schlimmer: klickte er in dieser Zeit "In den Warenkorb", lief
          sein POST gegen dieselbe, noch sitzungslose Function. Beide
          Antworten setzen das Sitzungs-Cookie neu — die spaete
          Korb-Antwort ueberschrieb die Sitzung, in der die Position
          gerade gelandet war. Nach aussen: Klick ohne Wirkung, Flackern.

       Jetzt: die gemerkte Zahl erscheint sofort, der echte Abruf startet
       erst, wenn die Seite gezeichnet ist, und laeuft nur einmal.
    */

    /* a) Vorschau aus dem Zwischenspeicher — kostet keine Anfrage.
          Bewusst nur gemalt: letzterKorb bleibt leer, damit niemand den
          gespeicherten Stand fuer eine Wahrheit haelt. */
    var gemerkt = zaehlerSpeicherLesen();
    if (gemerkt != null) zaehlerMalen(gemerkt);

    /* b) Der echte Abruf — still (kein Modal, keine Fehlermeldung),
          hoechstens einer gleichzeitig, mit Zeitgrenze. */
    var ZEITGRENZE = 8000;
    var WARTE_SCHREIBEN = 400;     /* Nachsehen, ob noch geschrieben wird */
    var VERZUG_START = 300;        /* Atempause nach dem Zeichnen */
    var WARTE_MAX = 15;            /* hoechstens 15 x 400 ms = 6 s nachsehen */
    var laeuft = null;
    var nachgesehen = 0;
    var still = function () {
      if (laeuft) return laeuft;              /* kein doppelter Abruf */

      /* Schreibt gerade jemand am Korb (Hinzufuegen, Menge, Kasse), halten
          wir uns heraus und sehen kurz darauf wieder nach. Sonst holen sich
          Lesen und Schreiben je eine eigene Sitzung beim Altsystem und die
          spaetere Antwort wirft die frueherere weg — die hinzugefuegte
          Position waere verloren.

          Nach WARTE_MAX Versuchen geben wir auf: der Zaehler ist nur eine
          Nebensache und darf nicht endlos im Hintergrund nachfragen.
          Das Schreiben selbst hat die Zahl ohnehin schon gesetzt. */
      if (korbSchreibt > 0) {
        if (++nachgesehen > WARTE_MAX) return null;
        window.setTimeout(still, WARTE_SCHREIBEN);
        return null;
      }
      nachgesehen = 0;

      /* Nur merken, nicht weiterzaehlen — siehe korbLesestand. */
      var meine = korbLesestand;
      laeuft = hole('/api/cart', ZEITGRENZE).then(function (res) {
        laeuft = null;
        /* Hat das Modal oder ein Hinzufuegen inzwischen frischere Zahlen
           geholt, gilt diese Antwort als veraltet und wird verworfen. */
        if (meine !== korbLesestand) return null;
        if (res.ok) { letzterKorb = res.d; warenkorbZaehler(res.d.count); }
        return res.ok ? res.d : null;
      });
      return laeuft;
    };

    /* c) Zurueckstellen, bis die Seite wirklich steht.
          requestIdleCallback allein genuegt nicht: ist der Rechner flott,
          meldet es schon nach wenigen Millisekunden Leerlauf, und der
          langsame Korb-Abruf liegt wieder genau im Klickfenster des
          Nutzers. Darum zuerst zwei Bilder abwarten (die Seite ist
          gezeichnet), dann der Leerlauf-Haken mit Zeitgrenze. */
    var spaeter = function (fn) {
      var dann = function () {
        if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(fn, { timeout: 1500 });
        else window.setTimeout(fn, 0);
      };
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () { window.setTimeout(dann, VERZUG_START); });
        });
      } else {
        window.setTimeout(dann, VERZUG_START);
      }
    };
    spaeter(still);

    /* Zurueck aus dem Verlaufsspeicher: der Korb kann sich inzwischen
       geaendert haben, also frisch nachfragen (ebenfalls zurueckgestellt). */
    window.addEventListener('pageshow', function (ev) { if (ev.persisted) spaeter(still); });
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
