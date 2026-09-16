/* ==========================================================================
   matten.net — Gemeinsame Hilfsfunktionen fuer die Bruecke zu matten.de
   --------------------------------------------------------------------------
   Diese Datei ist die EINZIGE Stelle, an der die Seiten des Shops mit der
   Bruecke sprechen. Wer eine neue Seite baut, nimmt die Funktionen von hier
   und schreibt kein eigenes fetch().

   Grundregeln, die hier durchgesetzt werden
     1. Es wird NIE ein Betrag gerechnet. Jeder Preis kommt vom Altsystem.
        NetApi.betrag() formatiert nur, was der Server geliefert hat.
     2. Es wird NIE eine Adresse von matten.de oder matten.net gebaut.
        Bilder laufen ausschliesslich ueber /api/img/ — NetApi.bild() prueft
        das und wirft fremde Adressen weg.
     3. Kein Aufruf wirft. Jede Funktion liefert ein Objekt mit .ok; im
        Fehlerfall steht in .fehler ein Satz, den man anzeigen kann.

   Einbindung (nach net-nav.js, vor der Seitendatei)
     <script src="assets/js/net-api.js"></script>
     <script src="assets/js/seite-kategorie.js" defer></script>

   Uebersicht
     --- Anfragen -------------------------------------------------------
     NetApi.katalog()                        Kategoriebaum
     NetApi.kategorie(pfad, opt)             Produktliste einer Kategorie
     NetApi.produkt(pfad)                    Artikeldetails
     NetApi.preis(pfad, anzahl, werte)       Live-Preis vom Altsystem
     NetApi.suche(q, opt)                    Volltextsuche
     NetApi.warenkorb()                      Stand des Warenkorbs
     NetApi.warenkorbHinzufuegen(daten)      POST /api/cart/add
     --- Werkzeug -------------------------------------------------------
     NetApi.esc(text)                        HTML-sicher einsetzen
     NetApi.betrag(zahl)                     1234.5  ->  "1.234,50 €"
     NetApi.preisAnzeige(preisObjekt)        Text fuer Listen ("ab 71,94 €")
     NetApi.bild(pfad, ersatz)               nur /api/img/… durchlassen
     NetApi.parameter(name, vorgabe)         Wert aus der Adresszeile
     NetApi.kuerze(text, n)
     NetApi.aufraeumen(html)                 HTML-Reste aus Altsystemtexten
     NetApi.feldName(feld, ersatz)           "spezialoption[…][x]" -> "Breite"
     NetApi.fehlertext(antwort, was)         ein Satz fuer die Fehlerbox
     NetApi.fehlerbox(antwort, was)          fertiges Hinweis-Markup
     NetApi.leerbox(titel, text, knoepfe, opt)  Leerzustand; opt = { rang, rolle }
     NetApi.Lauf()                           schuetzt vor ueberholten Antworten
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     1  Grundlagen
     ====================================================================== */

  /* Zeichen, die in HTML eine Bedeutung haben, unschaedlich machen.
     Alles, was aus dem Altsystem kommt, laeuft hier durch. */
  function esc(wert) {
    return String(wert == null ? '' : wert)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Wert aus der Adresszeile lesen. */
  function parameter(name, vorgabe) {
    try {
      var wert = new URLSearchParams(window.location.search).get(name);
      return wert == null || wert === '' ? (vorgabe == null ? '' : vorgabe) : wert;
    } catch (e) {
      return vorgabe == null ? '' : vorgabe;
    }
  }

  /* Langen Text auf n Zeichen kuerzen, ohne mitten im Wort abzuschneiden. */
  function kuerze(text, n) {
    var s = String(text == null ? '' : text).trim();
    if (s.length <= n) return s;
    var teil = s.slice(0, n);
    var luecke = teil.lastIndexOf(' ');
    if (luecke > n * 0.6) teil = teil.slice(0, luecke);
    return teil.replace(/[\s,.;:–-]+$/, '') + '…';
  }

  /* Die Kurzbeschreibungen des Altsystems enthalten HTML-Entities und
     zusammengelaufene Leerzeichen. Hier wird nur aufgeraeumt, nicht
     interpretiert — der Text geht anschliessend durch esc(). */
  function aufraeumen(text) {
    return String(text == null ? '' : text)
      .replace(/&nbsp;/g, ' ')
      .replace(/&sup2;/g, '²')
      .replace(/&sup3;/g, '³')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, '’')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ======================================================================
     2  Betraege
     --------------------------------------------------------------------
     Hier wird ausschliesslich FORMATIERT. Multipliziert, addiert oder
     gerundet wird nichts — Gesamtbetraege liefert das Altsystem als
     eigenes Feld (z. B. "gesamt" bei /api/price).
     ====================================================================== */

  var EURO = (function () {
    try {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency', currency: 'EUR', minimumFractionDigits: 2
      });
    } catch (e) { return null; }
  })();

  function betrag(zahl) {
    var n = Number(zahl);
    if (!isFinite(n)) return '';
    if (EURO) return EURO.format(n);
    return n.toFixed(2).replace('.', ',') + ' €';
  }

  /* Preisangabe fuer Listen und Karten.
     Das Altsystem kennt drei Faelle:
       - vollstaendiger Preis            -> "71,94 €"
       - Preis nur als Untergrenze       -> "ab 71,94 €"  (unvollstaendigPraefix)
       - gar kein Preis (Anfrageartikel) -> null; der Aufrufer zeigt dann
                                            "Auf Anfrage" an. */
  function preisAnzeige(preis, grundpreis, grundpreisText) {
    var text = null;
    var praefix = '';
    if (preis && typeof preis === 'object') {
      if (preis.text) text = String(preis.text);
      else if (preis.wert != null) text = betrag(preis.wert);
      if (preis.unvollstaendigPraefix && preis.wert != null) praefix = preis.unvollstaendigPraefix + ' ';
    }
    if (text == null && grundpreisText) text = String(grundpreisText);
    if (text == null && grundpreis != null) text = betrag(grundpreis);
    if (text == null) return null;
    /* Steht das Praefix schon im Text, nicht doppelt setzen. */
    if (praefix && text.slice(0, praefix.length).toLowerCase() === praefix.toLowerCase()) praefix = '';
    return (praefix + text).trim();
  }

  /* ======================================================================
     3  Bilder
     --------------------------------------------------------------------
     Regel des Projekts: keine Ressource direkt von matten.de oder
     matten.net. Alles laeuft ueber den Bildproxy /api/img/. Diese Funktion
     laesst nur solche Adressen durch; alles andere wird zu null, und die
     Seite zeigt statt dessen eine Platzhalterflaeche.
     ====================================================================== */

  function bild(adresse) {
    var s = String(adresse == null ? '' : adresse).trim();
    if (!s) return null;
    if (s.indexOf('/api/img/') === 0) return s;
    /* Ein reiner Medienpfad des Altsystems ("/media/bild/x.jpg") laesst sich
       gefahrlos auf den Proxy umbiegen. */
    if (s.indexOf('/media/') === 0) return '/api/img' + s.slice('/media'.length);
    return null;   /* fremde Herkunft — bewusst verworfen */
  }

  /* ======================================================================
     4  Feldnamen des Kaufformulars lesbar machen
     --------------------------------------------------------------------
     matten.de benennt seine Felder technisch:
       attribute[Grundfarbe]                 -> "Grundfarbe"
       spezialoption[459][spezial][x]        -> Breite
       spezialoption[459][spezial][y]        -> Länge
     Die Feldnamen selbst werden NIE veraendert — sie gehen unveraendert
     an /api/price und /api/cart/add zurueck.
     ====================================================================== */

  function feldName(feld, ersatz) {
    var s = String(feld || '');
    var m = /^attribute\[(.+)\]$/.exec(s);
    if (m) return m[1].replace(/[,\s]+$/, '').trim();
    if (/\[x\]$/.test(s)) return 'Breite';
    if (/\[y\]$/.test(s)) return 'Länge';
    if (/^spezialoption\[/.test(s)) return 'Sondermaß';
    return ersatz || s;
  }

  /* Achsenbezeichnung eines freien Massfeldes. */
  function massAchse(feld) {
    if (/\[x\]$/.test(String(feld))) return 'Breite';
    if (/\[y\]$/.test(String(feld))) return 'Länge';
    return 'Maß';
  }

  /* Ein Feld gehoert ins Kaufformular, wenn das Altsystem es kennt. */
  function istFormularfeld(feld) {
    var s = String(feld || '');
    return s.indexOf('attribute[') === 0 || s.indexOf('spezialoption[') === 0;
  }

  /* ======================================================================
     5  Anfragen
     ====================================================================== */

  var ZEITGRENZE = 30000;   /* das Altsystem antwortet bei details=1 langsam */

  /* Eine GET-Anfrage. Liefert IMMER ein Objekt, nie eine Ausnahme. */
  function hole(adresse, optionen) {
    var opt = optionen || {};
    var abbruch = null;
    var uhr = null;

    if (typeof window.AbortController === 'function') {
      abbruch = new window.AbortController();
      uhr = window.setTimeout(function () { abbruch.abort(); }, opt.zeitgrenze || ZEITGRENZE);
    }

    return window.fetch(adresse, {
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' },
      signal: abbruch ? abbruch.signal : undefined
    })
      .then(function (antwort) {
        return antwort.json().then(
          function (daten) {
            if (daten && typeof daten === 'object') {
              if (daten.ok === undefined) daten.ok = antwort.ok;
              return daten;
            }
            return { ok: false, fehler: 'Unerwartete Antwort der Brücke.' };
          },
          function () {
            return { ok: false, fehler: 'Die Brücke hat keine lesbare Antwort geliefert (HTTP ' + antwort.status + ').' };
          }
        );
      })
      .catch(function (fehler) {
        if (fehler && fehler.name === 'AbortError') {
          return { ok: false, abgebrochen: true, fehler: 'Das Altsystem hat zu lange nicht geantwortet.' };
        }
        return { ok: false, fehler: 'Die Brücke ist nicht erreichbar. Läuft der Server auf Port 8787?' };
      })
      .finally(function () { if (uhr) window.clearTimeout(uhr); });
  }

  /* Eine POST-Anfrage mit JSON-Rumpf. */
  function senden(adresse, daten) {
    return window.fetch(adresse, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(daten || {})
    })
      .then(function (antwort) {
        return antwort.json().then(
          function (d) {
            if (d && typeof d === 'object') {
              if (d.ok === undefined) d.ok = antwort.ok;
              return d;
            }
            return { ok: false, fehler: 'Unerwartete Antwort der Brücke.' };
          },
          function () { return { ok: false, fehler: 'Die Brücke hat keine lesbare Antwort geliefert.' }; }
        );
      })
      .catch(function () {
        return { ok: false, fehler: 'Die Brücke ist nicht erreichbar. Läuft der Server auf Port 8787?' };
      });
  }

  /* --- die einzelnen Endpunkte ------------------------------------------ */

  /* Kategoriebaum: 8 Ober- und 16 Unterkategorien von matten.de. */
  function katalog() {
    return hole('/api/katalog');
  }

  /* Produktliste einer Kategorie.
       pfad          echter matten.de-Pfad, z. B. "/logomatten/bierbankmatten"
       opt.seite     1-basiert
       opt.proSeite  Standard 24
       opt.details   true holt zusaetzlich Grundpreis und Varianten. Das
                     kostet eine Anfrage JE PRODUKT und dauert beim ersten
                     Aufruf viele Sekunden. Empfohlener Ablauf: erst ohne
                     details anzeigen, dann mit details nachladen. */
  function kategorie(pfad, optionen) {
    var opt = optionen || {};
    var a = '/api/kategorie?pfad=' + encodeURIComponent(pfad);
    if (opt.seite) a += '&seite=' + encodeURIComponent(opt.seite);
    if (opt.proSeite) a += '&proSeite=' + encodeURIComponent(opt.proSeite);
    if (opt.details) a += '&details=1';
    return hole(a, { zeitgrenze: opt.details ? 60000 : ZEITGRENZE });
  }

  /* Artikeldetails samt Bildern, Attributen, freien Massen und Beschreibung. */
  function produkt(pfad) {
    return hole('/api/produkt?pfad=' + encodeURIComponent(pfad));
  }

  /* Live-Preis. "werte" ist die flache Zuordnung Feldname -> Wert, genau mit
     den Feldnamen des Altsystems. Andere Schluessel werden nicht gesendet. */
  function preis(pfad, anzahl, werte) {
    var a = '/api/price?pfad=' + encodeURIComponent(pfad) +
            '&anzahl=' + encodeURIComponent(Math.max(1, Number(anzahl) || 1));
    Object.keys(werte || {}).forEach(function (feld) {
      var w = werte[feld];
      if (w == null || w === '') return;
      if (!istFormularfeld(feld)) return;
      a += '&' + encodeURIComponent(feld) + '=' + encodeURIComponent(w);
    });
    return hole(a);
  }

  /* Volltextsuche des Altsystems. */
  function suche(begriff, optionen) {
    var opt = optionen || {};
    var a = '/api/suche?q=' + encodeURIComponent(begriff || '');
    if (opt.seite) a += '&seite=' + encodeURIComponent(opt.seite);
    if (opt.proSeite) a += '&proSeite=' + encodeURIComponent(opt.proSeite);
    return hole(a);
  }

  /* Stand des Warenkorbs im Altsystem. */
  function warenkorb() {
    return hole('/api/cart');
  }

  /* Artikel in den Warenkorb legen.
       { pfad, anzahl, werte: { "attribute[…]": "…" }, kommentar }
     Der Server nimmt nur Felder an, die es im Kaufformular der Live-Seite
     wirklich gibt; alles andere meldet er in "abgelehnt" zurueck. */
  function warenkorbHinzufuegen(daten) {
    var d = daten || {};
    var werte = {};
    Object.keys(d.werte || {}).forEach(function (feld) {
      var w = d.werte[feld];
      if (w == null || w === '') return;
      if (!istFormularfeld(feld)) return;
      werte[feld] = w;
    });
    return senden('/api/cart/add', {
      pfad: d.pfad,
      anzahl: Math.max(1, Number(d.anzahl) || 1),
      werte: werte,
      kommentar: String(d.kommentar || '').slice(0, 500)
    }).then(function (antwort) {
      /* Der Zaehler im Kopf gehoert zum Grundgeruest — hier nachziehen,
         damit das keine Seite einzeln machen muss. */
      if (antwort && antwort.ok && window.NetShell && typeof antwort.count === 'number') {
        window.NetShell.warenkorbSetzen(antwort.count);
      }
      return antwort;
    });
  }

  /* ======================================================================
     6  Fehler anzeigen
     --------------------------------------------------------------------
     Kein alert(). Jeder Fehler wird als Hinweisbox in die Seite gesetzt.
     ====================================================================== */

  function fehlertext(antwort, was) {
    var a = antwort || {};
    if (a.fehler) return String(a.fehler);
    if (a.grund) return String(a.grund);
    return 'Beim Schritt „' + (was || 'Laden') + '“ hat das Altsystem nicht wie erwartet geantwortet.';
  }

  /* Fertiges Markup im Stil des Designsystems. */
  function fehlerbox(antwort, was, zusatz) {
    return '<p class="hinweis hinweis--fehler" role="alert">' +
      '<span class="hinweis__symbol" aria-hidden="true">!</span>' +
      '<span><span class="hinweis__titel">' + esc(was || 'Es hat nicht geklappt') + '</span>' +
      esc(fehlertext(antwort, was)) +
      (zusatz ? ' ' + zusatz : '') +
      '</span></p>';
  }

  /* Leerzustand im Stil des Designsystems.

       leerbox(titel, text, knoepfe)          wie bisher: <h3>, keine Rolle
       leerbox(titel, text, knoepfe, opt)     opt = { rang: 1|2|3, rolle: … }

     Warum der Rang einstellbar sein muss: die Box ersetzt auf manchen
     Seiten den ganzen Inhaltsbereich. Steht die einzige <h1> der Seite in
     dem Bereich, den die Box ueberschreibt, hat die Seite hinterher keine
     Ueberschrift erster Ordnung mehr — die Gliederung beginnt dann mit
     <h3>. In so einem Fall wird rang: 1 uebergeben.

     Und die Rolle: eine Box, die einen Fehlschlag meldet und den bisherigen
     Inhalt ersetzt, muss angesagt werden (rolle: 'alert'). Eine Box, die
     nur "hier steht nichts" sagt, reicht als 'status'. Ohne Angabe bleibt
     es bei gar keiner Rolle — so verhalten sich alte Aufrufe wie zuvor. */
  function leerbox(titel, text, knoepfe, optionen) {
    var opt = optionen || {};
    var rang = opt.rang === 1 || opt.rang === '1' ? 'h1'
             : opt.rang === 2 || opt.rang === '2' ? 'h2'
             : 'h3';
    var rolle = opt.rolle ? ' role="' + esc(opt.rolle) + '"' : '';

    return '<div class="leer"' + rolle + '>' +
      '<span class="leer__symbol" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="1"/>' +
      '<path d="M3 10h18M8 5v14"/></svg></span>' +
      '<' + rang + '>' + esc(titel) + '</' + rang + '>' +
      '<p>' + esc(text) + '</p>' +
      (knoepfe ? '<div class="btn-gruppe">' + knoepfe + '</div>' : '') +
      '</div>';
  }

  /* Ladeplatzhalter: n Produktkarten. */
  function kartenPlatzhalter(anzahl) {
    var h = '';
    for (var i = 0; i < (anzahl || 8); i++) {
      h += '<article class="karte karte--laedt" aria-hidden="true">' +
        '<div class="skel skel--bild"></div>' +
        '<div class="karte__koerper">' +
        '<span class="skel skel--zeile skel--kurz"></span>' +
        '<span class="skel skel--titel"></span>' +
        '<span class="skel skel--zeile skel--voll"></span>' +
        '<span class="skel skel--zeile skel--mittel"></span>' +
        '</div></article>';
    }
    return h;
  }

  /* ======================================================================
     7  Ueberholte Antworten verwerfen
     --------------------------------------------------------------------
     Wer schnell an der Mengensteuerung dreht, loest mehrere Preisabfragen
     aus. Die Antworten koennen in beliebiger Reihenfolge eintreffen. Ein
     Lauf-Zaehler sorgt dafuer, dass nur die juengste Antwort zaehlt.

       var lauf = NetApi.Lauf();
       var meins = lauf.naechster();
       NetApi.preis(…).then(function (a) { if (!lauf.gilt(meins)) return; … });
     ====================================================================== */

  function Lauf() {
    var stand = 0;
    return {
      naechster: function () { stand += 1; return stand; },
      gilt: function (nummer) { return nummer === stand; }
    };
  }

  /* ======================================================================
     8  Oeffentliche Schnittstelle
     ====================================================================== */

  window.NetApi = {
    /* Anfragen */
    hole: hole,
    senden: senden,
    katalog: katalog,
    kategorie: kategorie,
    produkt: produkt,
    preis: preis,
    suche: suche,
    warenkorb: warenkorb,
    warenkorbHinzufuegen: warenkorbHinzufuegen,
    /* Werkzeug */
    esc: esc,
    parameter: parameter,
    kuerze: kuerze,
    aufraeumen: aufraeumen,
    betrag: betrag,
    preisAnzeige: preisAnzeige,
    bild: bild,
    feldName: feldName,
    massAchse: massAchse,
    istFormularfeld: istFormularfeld,
    /* Darstellung von Zustaenden */
    fehlertext: fehlertext,
    fehlerbox: fehlerbox,
    leerbox: leerbox,
    kartenPlatzhalter: kartenPlatzhalter,
    Lauf: Lauf
  };
})();
