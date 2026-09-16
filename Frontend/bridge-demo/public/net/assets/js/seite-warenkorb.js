/* ==========================================================================
   matten.net — Warenkorb
   --------------------------------------------------------------------------
   Haengt die Seite warenkorb.html an die Bruecke zum Altsystem matten.de.

   Verwendete Endpunkte
     GET  /api/cart          Positionen und Summen lesen
     POST /api/cart/menge    Menge einer Position setzen (0 entfernt sie)
     POST /api/cart/clear    Warenkorb leeren

   Pfad und Bild einer Position kommen mit /api/cart mit: die Brücke merkt
   sich beim Hinzufügen, welcher Produktpfad zu welchem Positionsschlüssel
   gehört. Hier wird deshalb nichts mehr über den Artikelnamen gesucht —
   liegt kein Pfad vor, bleibt die Position ohne Verweis und ohne Bild.

   Grundsatz: im Browser wird KEIN Geldbetrag gerechnet. Zwischensumme,
   Versand, Umsatzsteuer und Gesamt werden so angezeigt, wie das Altsystem
   sie liefert — als fertige Zeichenketten.
   ========================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     Kleine Helfer
     ---------------------------------------------------------------------- */

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Schreibt in den Meldebereich. Der Bereich ist aria-live="polite" —
     leert man ihn, verschwindet er (CSS: .melder:empty). */
  function melde(text, art) {
    var el = $('korb-melder');
    if (!el) return;
    if (!text) { el.innerHTML = ''; el.removeAttribute('data-art'); return; }
    el.setAttribute('data-art', art || 'info');
    el.innerHTML =
      (art === 'laedt' ? '<span class="melder__dreher" aria-hidden="true"></span>' : '') +
      '<span>' + esc(text) + '</span>';
  }

  /* --- Netzzugriffe. Fehler werden geworfen, nie verschluckt. ------------ */

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

  /* ----------------------------------------------------------------------
     Bild und Verweis einer Position
     --------------------------------------------------------------------------
     Beides liefert die Bruecke je Position mit: `bild` als /api/img/-Pfad
     aus den Produktdaten, die beim Hinzufuegen ohnehin gelesen wurden, und
     `pfad` als echter matten.de-Pfad des Artikels. Fehlt eines davon, wird
     nichts geraten — dann bleibt die Platzhalterflaeche stehen und der Name
     bleibt ohne Verweis.
     Bilder laufen ausschliesslich ueber /api/img/, nie direkt gegen
     matten.de; alles andere wird hier verworfen.
     ---------------------------------------------------------------------- */

  function bildAdresse(pos) {
    var u = pos && pos.bild;
    return typeof u === 'string' && u.indexOf('/api/img/') === 0 ? u : null;
  }

  /* Der Weg zurueck zur Produktseite. Nur echte, absolute matten.de-Pfade
     werden verlinkt — kein "//fremde.example" und kein Schema. */
  function produktZiel(pos) {
    var p = pos && pos.pfad;
    if (typeof p !== 'string' || p.charAt(0) !== '/' || p.charAt(1) === '/') return null;
    return 'produkt.html?pfad=' + encodeURIComponent(p);
  }

  var PLATZHALTER =
    '<span class="bildflaeche" role="img" aria-label="Kein Bild hinterlegt">Bild</span>';

  /* Laedt ein Bild nicht, kommt die Platzhalterflaeche zurueck. */
  function bilderAbsichern(wurzel) {
    Array.prototype.forEach.call(
      wurzel.querySelectorAll('.korb-pos__bild img'),
      function (img) {
        img.addEventListener('error', function () {
          var huelle = img.parentNode;
          if (huelle) huelle.innerHTML = PLATZHALTER;
        });
      }
    );
  }

  /* ----------------------------------------------------------------------
     Darstellung
     ---------------------------------------------------------------------- */

  var laufendeMenge = {};   /* key -> Zeitgeber, damit Tippen entprellt wird */

  function positionHtml(pos) {
    /* Das Altsystem liefert zu den "…-a"-Anfrageartikeln keinen Namen.
       Genau diese nutzt der Mattendesigner fuer seine Uebernahme -- ein
       nichtssagendes "Artikel" waere dort irrefuehrend. */
    var name = pos.name || (pos.kommentar && /KALKULATION/.test(pos.kommentar)
      ? 'Mattendesigner-Anfrage'
      : 'Artikel ohne Bezeichnung');
    var merkmale = '';
    if (pos.attribut) {
      merkmale += '<div><dt>Ausführung</dt><dd>' + esc(pos.attribut) + '</dd></div>';
    }
    /* Der Kommentar ist mehrzeilig (der Mattendesigner legt seine ganze
       Kalkulation dort ab). Er wird HTML-sicher eingesetzt; die Zeilen-
       umbrueche bleiben erhalten, weil die CSS-Regel zu .korb-pos__merkmal--lang
       white-space: pre-wrap setzt — kein eingefuegtes Markup. */
    if (pos.kommentar) {
      merkmale += '<div class="korb-pos__merkmal--lang"><dt>Bemerkung</dt><dd>' +
        esc(pos.kommentar) + '</dd></div>';
    }

    var bild = bildAdresse(pos);
    var ziel = produktZiel(pos);

    return '' +
      '<li class="korb-pos" data-key="' + esc(pos.key) + '">' +
        '<div class="korb-pos__bild">' +
          (bild
            ? '<img src="' + esc(bild) + '" alt="" loading="lazy" decoding="async">'
            : PLATZHALTER) +
        '</div>' +
        '<div>' +
          '<p class="korb-pos__name">' +
            (ziel ? '<a href="' + esc(ziel) + '">' + esc(name) + '</a>' : esc(name)) +
          '</p>' +
          (merkmale ? '<dl class="korb-pos__merkmale">' + merkmale + '</dl>' : '') +
          '<div class="korb-pos__steuerung">' +
            '<div class="menge">' +
              '<button class="menge__knopf" type="button" data-schritt="-1" ' +
                'aria-label="Menge verringern für ' + esc(name) + '"' +
                (Number(pos.anzahl) <= 1 ? ' disabled' : '') + '>&minus;</button>' +
              '<input class="menge__feld" type="number" inputmode="numeric" ' +
                'value="' + esc(pos.anzahl) + '" min="1" max="999" step="1" ' +
                'aria-label="Menge für ' + esc(name) + '">' +
              '<button class="menge__knopf" type="button" data-schritt="1" ' +
                'aria-label="Menge erhöhen für ' + esc(name) + '">+</button>' +
            '</div>' +
            '<button class="btn btn--signal btn--klein" type="button" data-entfernen="1">' +
              'Entfernen<span class="nur-sr"> — ' + esc(name) + '</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="korb-pos__betraege">' +
          '<span class="korb-pos__einzel">Einzelpreis ' + esc(pos.preis || '—') + '</span>' +
          '<span class="korb-pos__summe">' + esc(pos.summe || '—') + '</span>' +
        '</div>' +
      '</li>';
  }

  function summenHtml(daten) {
    function zeile(bezeichnung, wert, gesamt) {
      if (!wert) return '';
      return '<div class="summen__zeile' + (gesamt ? ' summen__zeile--gesamt' : '') + '">' +
        '<dt>' + esc(bezeichnung) + '</dt><dd class="zahl">' + esc(wert) + '</dd></div>';
    }
    var ust = 'Umsatzsteuer';
    if (daten.ustSatz != null) ust += ' (' + daten.ustSatz + ' %)';

    var h = '';
    h += zeile('Zwischensumme', daten.zwischensumme);
    h += zeile('Versand', daten.versand);
    h += zeile(ust, daten.umsatzsteuer);
    h += zeile('Gesamt', daten.gesamt, true);
    if (!h) h = '<div class="summen__zeile"><dt>Gesamt</dt><dd class="zahl">—</dd></div>';
    h += anfrageHinweis(daten);
    return h;
  }

  /* ----------------------------------------------------------------------
     Der Hinweis zu Anfragepositionen
     --------------------------------------------------------------------------
     Anfrageartikel (darunter jede Matte aus dem Mattendesigner) haben im
     Altsystem keinen Preis: die Zeile sagt „auf Anfrage“. Das Altsystem
     rechnet die Position trotzdem in seine Gesamtsumme — mit seinem eigenen
     Ansatz, nicht mit der Kalkulation des Mattendesigners. Damit stehen zwei
     verschiedene Zahlen nebeneinander. Der Hinweis benennt das, statt es
     stehen zu lassen; gerechnet wird hier nichts, nur gezaehlt.
     ---------------------------------------------------------------------- */

  function anfrageHinweis(daten) {
    var offen = (daten.items || []).filter(function (p) { return p.preisNum == null; }).length;
    if (!offen) return '';

    var wer = offen === 1
      ? 'Eine Position steht ohne Preis im Warenkorb („auf Anfrage“).'
      : offen + ' Positionen stehen ohne Preis im Warenkorb („auf Anfrage“).';

    return '<div class="summen__zeile summen__zeile--anfrage">' +
      '<dt>Auf Anfrage</dt>' +
      '<dd>' + esc(wer) +
        ' Die Summe des Altsystems bildet die Kalkulation des Mattendesigners' +
        ' nicht ab — der dort errechnete Betrag wird im Angebot bestätigt.' +
      '</dd></div>';
  }

  function zeige(daten) {
    var liste = $('korb-liste');
    var leer = !daten.items || !daten.items.length;

    $('korb-laedt').hidden = true;
    $('korb-fehler').hidden = true;
    $('korb-leer').hidden = !leer;
    $('korb-fuss').hidden = leer;
    liste.hidden = leer;

    if (!leer) {
      liste.innerHTML = daten.items.map(positionHtml).join('');
      bilderAbsichern(liste);
    } else {
      liste.innerHTML = '';
    }

    var summen = $('korb-summen');
    summen.innerHTML = summenHtml(daten);
    summen.removeAttribute('aria-busy');

    var kasse = $('zur-kasse');
    if (leer) {
      kasse.setAttribute('aria-disabled', 'true');
      kasse.setAttribute('tabindex', '-1');
      kasse.classList.add('btn--dezent');
    } else {
      kasse.removeAttribute('aria-disabled');
      kasse.removeAttribute('tabindex');
      kasse.classList.remove('btn--dezent');
    }

    /* Der Zaehler im Kopf gehoert net-shell.js — hier nur gefuettert. */
    if (window.NetShell) window.NetShell.warenkorbSetzen(daten.count || 0);
  }

  function zeigeFehler(text) {
    $('korb-laedt').hidden = true;
    $('korb-liste').hidden = true;
    $('korb-fuss').hidden = true;
    $('korb-leer').hidden = true;
    $('korb-fehler').hidden = false;
    $('korb-fehler-text').textContent = text;
    var summen = $('korb-summen');
    summen.innerHTML = '<div class="summen__zeile summen__zeile--gesamt"><dt>Gesamt</dt>' +
      '<dd class="zahl">—</dd></div>';
    summen.removeAttribute('aria-busy');
  }

  /* ----------------------------------------------------------------------
     Aktionen
     ---------------------------------------------------------------------- */

  function laden() {
    return hole('/api/cart')
      .then(function (res) {
        if (!res.ok || !res.d || res.d.ok !== true) {
          throw new Error((res.d && res.d.fehler) || 'Das Bestellsystem hat nicht geantwortet.');
        }
        zeige(res.d);
        return res.d;
      })
      .catch(function (err) {
        zeigeFehler(err.message + ' Läuft die Brücke zum Altsystem?');
      });
  }

  /* Menge setzen. 0 entfernt die Position — so macht es auch das Altsystem. */
  function mengeSetzen(key, anzahl, zeile) {
    anzahl = Math.max(0, Math.min(999, Math.trunc(Number(anzahl) || 0)));
    if (zeile) zeile.setAttribute('data-arbeitet', 'ja');
    zeileSperren(zeile, true);
    melde(anzahl === 0 ? 'Position wird entfernt …' : 'Menge wird im Altsystem gesetzt …', 'laedt');

    return sende('/api/cart/menge', { key: key, anzahl: anzahl })
      .then(function (res) {
        if (!res.ok || !res.d || res.d.ok !== true) {
          throw new Error((res.d && res.d.fehler) || 'Die Menge konnte nicht gesetzt werden.');
        }
        zeige(res.d);
        melde(anzahl === 0
          ? 'Position entfernt. Die Summen kommen frisch aus dem Altsystem.'
          : 'Menge auf ' + anzahl + ' gesetzt. Die Summen kommen frisch aus dem Altsystem.', 'gut');
      })
      .catch(function (err) {
        melde(err.message, 'fehler');
        zeileSperren(zeile, false);
        if (zeile) zeile.removeAttribute('data-arbeitet');
        return laden();
      });
  }

  function zeileSperren(zeile, sperren) {
    if (!zeile) return;
    Array.prototype.forEach.call(zeile.querySelectorAll('button, input'), function (el) {
      el.disabled = !!sperren;
    });
    var menge = zeile.querySelector('.menge');
    if (menge) {
      if (sperren) menge.setAttribute('aria-busy', 'true');
      else menge.removeAttribute('aria-busy');
    }
  }

  /* ----------------------------------------------------------------------
     Verdrahtung
     ---------------------------------------------------------------------- */

  var liste = $('korb-liste');

  liste.addEventListener('click', function (ev) {
    var zeile = ev.target.closest ? ev.target.closest('.korb-pos') : null;
    if (!zeile) return;
    var key = zeile.getAttribute('data-key');

    var weg = ev.target.closest('[data-entfernen]');
    if (weg) { mengeSetzen(key, 0, zeile); return; }

    var schritt = ev.target.closest('[data-schritt]');
    if (schritt) {
      var feld = zeile.querySelector('.menge__feld');
      var neu = Number(feld.value) + Number(schritt.getAttribute('data-schritt'));
      neu = Math.max(1, Math.min(999, neu));
      if (String(neu) === String(feld.value)) return;
      feld.value = neu;
      mengeSetzen(key, neu, zeile);
    }
  });

  /* Tippen im Mengenfeld: erst nach einer kurzen Pause absenden, damit
     nicht jede Ziffer eine Anfrage an das Altsystem ausloest. */
  liste.addEventListener('input', function (ev) {
    var feld = ev.target.closest ? ev.target.closest('.menge__feld') : null;
    if (!feld) return;
    var zeile = feld.closest('.korb-pos');
    var key = zeile.getAttribute('data-key');
    window.clearTimeout(laufendeMenge[key]);
    laufendeMenge[key] = window.setTimeout(function () {
      var n = Math.max(1, Math.min(999, Math.trunc(Number(feld.value) || 1)));
      feld.value = n;
      mengeSetzen(key, n, zeile);
    }, 600);
  });

  /* Enter im Mengenfeld schickt sofort ab. */
  liste.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    var feld = ev.target.closest ? ev.target.closest('.menge__feld') : null;
    if (!feld) return;
    ev.preventDefault();
    var zeile = feld.closest('.korb-pos');
    var key = zeile.getAttribute('data-key');
    window.clearTimeout(laufendeMenge[key]);
    var n = Math.max(1, Math.min(999, Math.trunc(Number(feld.value) || 1)));
    feld.value = n;
    mengeSetzen(key, n, zeile);
  });

  /* Leeren. Zwei Klicks: der erste fragt nach, der zweite fuehrt aus.
     Kein confirm() — die Rueckfrage steht sichtbar im Knopf. */
  var leerenKnopf = $('korb-leeren');
  var leerenScharf = false;
  var leerenZurueck = null;

  leerenKnopf.addEventListener('click', function () {
    if (!leerenScharf) {
      leerenScharf = true;
      leerenKnopf.textContent = 'Wirklich leeren?';
      melde('Noch einmal auf den Knopf: dann werden alle Positionen entfernt.', 'warnung');
      window.clearTimeout(leerenZurueck);
      leerenZurueck = window.setTimeout(zuruecksetzenLeeren, 6000);
      return;
    }
    window.clearTimeout(leerenZurueck);
    leerenKnopf.disabled = true;
    leerenKnopf.setAttribute('aria-busy', 'true');
    melde('Der Warenkorb wird im Altsystem geleert …', 'laedt');

    sende('/api/cart/clear', {})
      .then(function (res) {
        if (!res.ok || !res.d || res.d.ok !== true) {
          throw new Error((res.d && res.d.fehler) || 'Der Warenkorb konnte nicht geleert werden.');
        }
        zeige(res.d);
        melde('Der Warenkorb ist leer.', 'gut');
      })
      .catch(function (err) { melde(err.message, 'fehler'); })
      .then(function () {
        leerenKnopf.disabled = false;
        leerenKnopf.removeAttribute('aria-busy');
        zuruecksetzenLeeren();
      });
  });

  function zuruecksetzenLeeren() {
    leerenScharf = false;
    leerenKnopf.textContent = 'Warenkorb leeren';
  }

  $('korb-neu').addEventListener('click', function () {
    $('korb-fehler').hidden = true;
    $('korb-laedt').hidden = false;
    melde('');
    laden();
  });

  /* Ein leerer Warenkorb fuehrt nicht zur Kasse. */
  $('zur-kasse').addEventListener('click', function (ev) {
    if (this.getAttribute('aria-disabled') === 'true') {
      ev.preventDefault();
      melde('Legen Sie zuerst einen Artikel in den Warenkorb.', 'warnung');
    }
  });

  /* --- Start ------------------------------------------------------------ */
  laden();

  /* Kommt die Seite aus dem Verlauf zurueck, kann sich der Warenkorb
     inzwischen geaendert haben. */
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) laden(); });
})();
