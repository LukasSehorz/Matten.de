/* ==========================================================================
   matten.net — Kategorieseite
   --------------------------------------------------------------------------
   Adresse
     kategorie.html?kat=<echter matten.de-Pfad>[&seite=N][&sortierung=…]
     kategorie.html?q=<Suchbegriff>[&seite=N]        (Suche aus dem Kopf)

   Ablauf in zwei Stufen — das ist Absicht:

     Stufe 1   GET /api/kategorie?pfad=…             (etwa 0,3 s)
               liefert Namen, Bilder, Artikelnummern und den Modus
               ("kauf" oder "anfrage"). Damit steht die Seite sofort.

     Stufe 2   GET /api/kategorie?pfad=…&details=1   (bis zu 15 s beim
               ersten Mal, danach aus dem Zwischenspeicher)
               liefert zusaetzlich den Grundpreis. Er wird in die schon
               sichtbaren Karten nachgetragen.

   Warum getrennt: das Altsystem kennt in seiner Kategorieliste keine
   Preise. Die Bruecke muss fuer jeden einzelnen Artikel eine eigene Seite
   holen. Wuerde man darauf warten, staende der Kunde eine Viertelminute
   vor einer leeren Seite.

   Es wird kein Betrag gerechnet. Artikel ohne Preis — im Katalog von
   matten.de rund 180 Stueck — werden als "Auf Anfrage" gekennzeichnet.
   ========================================================================== */

(function () {
  'use strict';

  var A = window.NetApi;
  var esc = A.esc;
  var findeKategorie = window.NET_FINDE_KATEGORIE || function () { return null; };

  var PRO_SEITE = 24;

  /* --- Zustand dieser Seite ---------------------------------------------- */
  var katPfad   = A.parameter('kat', '');
  var suchwort  = A.parameter('q', '');
  var seite     = Math.max(1, parseInt(A.parameter('seite', '1'), 10) || 1);
  var sortierung = A.parameter('sortierung', 'katalog');

  var $titel   = document.getElementById('kat-titel');
  var $gruppe  = document.getElementById('kat-gruppe');
  var $text    = document.getElementById('kat-text');
  var $mehr    = document.getElementById('kat-mehr');
  var $zahl    = document.getElementById('kat-zahl');
  var $raster  = document.getElementById('produkte');
  var $blaett  = document.getElementById('blaetterung');
  var $krumen  = document.getElementById('brotkrumen');
  var $unter   = document.getElementById('unterkategorien');
  var $sort    = document.getElementById('sortierung');
  var $leiste  = document.getElementById('kat-leiste');

  var produkte = [];   /* die Artikel der aktuellen Seite */
  var bereiche = [];   /* die Unterbereiche, die als Chips angeboten werden */

  /* ======================================================================
     1  Start
     ====================================================================== */

  function start() {
    if ($sort) {
      $sort.value = sortierung;
      $sort.addEventListener('change', function () {
        adresseSetzen({ sortierung: $sort.value, seite: 1 });
      });
    }

    if (suchwort) { sucheAnzeigen(); return; }

    if (!katPfad) { keineKategorie(); return; }

    kategorieAnzeigen();
  }

  /* Neue Adresse setzen, damit Sortierung und Seite im Verlauf landen und
     ein Lesezeichen funktioniert. */
  function adresseSetzen(aenderungen) {
    var p = new URLSearchParams(window.location.search);
    Object.keys(aenderungen).forEach(function (k) {
      var w = aenderungen[k];
      if (w == null || w === '' || w === 1 && k === 'seite' || w === 'katalog' && k === 'sortierung') {
        p.delete(k);
      } else {
        p.set(k, w);
      }
    });
    window.location.search = p.toString();
  }

  /* ======================================================================
     2  Kein oder unbekannter Kategoriepfad
     ====================================================================== */

  function keineKategorie() {
    setzeTitel('Warengruppe wählen', 'Sortiment');
    if ($text) $text.textContent =
      'Diese Seite zeigt eine einzelne Warengruppe. Wählen Sie eine aus der Navigation ' +
      'oben oder aus der folgenden Liste.';
    if ($zahl) $zahl.textContent = '';
    if ($leiste) $leiste.hidden = true;
    $raster.removeAttribute('aria-busy');

    var NAV = window.NET_NAV || [];
    var gruppen = NAV.filter(function (e) { return !!e.kat; });
    $raster.innerHTML = gruppen.map(function (g) {
      return '<article class="karte karte--flach"><div class="karte__koerper">' +
        '<p class="label label--gedeckt mb-0">Warengruppe</p>' +
        '<h2 class="karte__titel"><a href="' + esc(g.href) + '">' + esc(g.titel) + '</a></h2>' +
        (g.anzahl != null ? '<p class="karte__text">' + esc(g.anzahl) + ' Artikel</p>' : '') +
        '</div></article>';
    }).join('');
  }

  /* ======================================================================
     3  Kategorie anzeigen
     ====================================================================== */

  function kategorieAnzeigen() {
    var eintrag = findeKategorie(katPfad);

    /* Was schon aus der Navigation bekannt ist, steht sofort da — der Kunde
       sieht nicht erst eine leere Ueberschrift. */
    if (eintrag) {
      var name = eintrag.unter ? eintrag.unter.titel : eintrag.ober.titel;
      setzeTitel(name, eintrag.unter ? eintrag.ober.titel : 'Warengruppe');
      krumenSetzen(eintrag, name);
      unterkategorienSetzen(eintrag);
    } else {
      /* Ein Pfad, den die Navigation nicht kennt. Der Name kommt gleich aus
         dem Altsystem — bis dahin bleibt die Ueberschrift neutral statt den
         technischen Pfad zu zeigen. */
      setzeTitel('Warengruppe', 'Sortiment');
      krumenSetzen(null, 'Warengruppe');
    }

    ladeplatzhalter();

    /* --- Stufe 1: schnelle Liste ---------------------------------------- */
    A.kategorie(katPfad, { seite: seite, proSeite: PRO_SEITE }).then(function (antwort) {
      if (!antwort || !antwort.ok) {
        if (!eintrag) setzeTitel('Warengruppe nicht gefunden', 'Sortiment');
        if ($text) $text.hidden = true;
        if ($mehr) $mehr.hidden = true;
        fehler(antwort, 'Warengruppe konnte nicht geladen werden');
        return;
      }

      /* Der Titel des Altsystems ist eine lange Stichwortkette. Der erste
         Teil vor dem Komma ist der brauchbare Name — den liefert die
         Bruecke bereits als "name". */
      var deName = antwort.name || (eintrag && (eintrag.unter ? eintrag.unter.titel : eintrag.ober.titel)) || katPfad;
      if (!eintrag) setzeTitel(deName, 'Warengruppe');
      document.title = deName + ' | Mattenfuchs';

      textSetzen(antwort.einleitung);

      produkte = antwort.produkte || [];
      zahlSetzen(antwort);
      rasterZeichnen();
      blaetterungZeichnen(antwort);

      if (!produkte.length) {
        leer(deName);
        return;
      }

      /* --- Stufe 2: Preise nachtragen ----------------------------------- */
      preiseNachladen();
    });
  }

  /* Die Preisabfrage laeuft im Hintergrund weiter, waehrend die Seite schon
     bedienbar ist. Schlaegt sie fehl, bleibt es bei "Preis auf Anfrage" —
     es wird nichts geschaetzt. */
  function preiseNachladen() {
    A.kategorie(katPfad, { seite: seite, proSeite: PRO_SEITE, details: true })
      .then(function (antwort) {
        if (!antwort || !antwort.ok || !antwort.produkte) {
          $raster.querySelectorAll('[data-preis]').forEach(function (el) {
            el.className = 'preis--anfrage';
            el.textContent = 'Preis auf Anfrage';
          });
          return;
        }
        var nachPfad = {};
        antwort.produkte.forEach(function (p) { nachPfad[p.pfad] = p; });

        produkte.forEach(function (p, i) {
          var voll = nachPfad[p.pfad];
          var el = $raster.querySelector('[data-preis="' + i + '"]');
          if (!el) return;
          var text = voll
            ? A.preisAnzeige(null, voll.grundpreis, voll.grundpreisText)
            : null;
          if (text && p.modus !== 'anfrage') {
            el.className = 'preis';
            el.textContent = text;
          } else {
            el.className = 'preis--anfrage';
            el.textContent = 'Auf Anfrage';
          }
        });
      });
  }

  /* ======================================================================
     4  Suche
     ====================================================================== */

  function sucheAnzeigen() {
    setzeTitel('Suche: ' + suchwort, 'Volltextsuche');
    document.title = 'Suche „' + suchwort + '“ | Mattenfuchs';
    if ($text) {
      $text.removeAttribute('data-gekuerzt');
      $text.textContent = 'Die Suche des Altsystems durchsucht Artikelnamen und ' +
        'Beschreibungstexte. Mehrere Wörter werden mit ODER verknüpft.';
    }
    if ($krumen) {
      $krumen.innerHTML =
        '<li><a href="index.html">Startseite</a></li>' +
        '<li><span aria-current="page">Suche</span></li>';
    }
    ladeplatzhalter();

    A.suche(suchwort, { seite: seite, proSeite: PRO_SEITE }).then(function (antwort) {
      if (!antwort || !antwort.ok) {
        fehler(antwort, 'Die Suche hat nicht geantwortet');
        return;
      }
      produkte = antwort.treffer || antwort.produkte || [];
      zahlSetzen(antwort, 'Treffer');
      rasterZeichnen();
      blaetterungZeichnen(antwort);
      if (!produkte.length) {
        $raster.innerHTML = A.leerbox(
          'Keine Treffer für „' + suchwort + '“',
          'Versuchen Sie einen kürzeren Begriff, eine Artikelnummer oder suchen Sie ' +
          'über die Warengruppen.',
          '<a class="btn" href="kategorie.html">Alle Warengruppen</a>' +
          '<a class="btn btn--sekundaer" href="mattendesigner.html">Matte gestalten</a>',
          { rolle: 'status' }
        );
      }
    });
  }

  /* ======================================================================
     5  Darstellung
     ====================================================================== */

  function setzeTitel(titel, gruppe) {
    if ($titel) $titel.textContent = titel;
    if ($gruppe) $gruppe.textContent = gruppe;
  }

  function textSetzen(einleitung) {
    if (!$text) return;
    var text = A.aufraeumen(einleitung);
    if (!text) {
      /* 12 der 27 Kategorien von matten.net haben keinen Text — bei
         matten.de kommt das ebenfalls vor. Dann bleibt die Zeile leer
         statt mit einer Entschuldigung gefuellt zu werden. */
      $text.hidden = true;
      if ($mehr) $mehr.hidden = true;
      return;
    }
    $text.hidden = false;
    $text.textContent = text;

    /* Aufklappen nur anbieten, wenn der Text wirklich abgeschnitten ist. */
    window.requestAnimationFrame(function () {
      var gekuerzt = $text.scrollHeight - $text.clientHeight > 4;
      if (!$mehr) return;
      $mehr.hidden = !gekuerzt;
      if (!gekuerzt) $text.removeAttribute('data-gekuerzt');
    });

    var knopf = document.getElementById('kat-mehr-knopf');
    if (knopf && !knopf.dataset.verdrahtet) {
      knopf.dataset.verdrahtet = 'ja';
      knopf.addEventListener('click', function () {
        var offen = $text.getAttribute('data-gekuerzt') !== 'true';
        if (offen) {
          $text.setAttribute('data-gekuerzt', 'true');
          knopf.setAttribute('aria-expanded', 'false');
          knopf.textContent = 'Ganzen Text anzeigen';
        } else {
          $text.removeAttribute('data-gekuerzt');
          knopf.setAttribute('aria-expanded', 'true');
          knopf.textContent = 'Text wieder einklappen';
        }
      });
    }
  }

  function krumenSetzen(eintrag, name) {
    if (!$krumen) return;
    var h = '<li><a href="index.html">Startseite</a></li>';
    if (eintrag && eintrag.unter) {
      h += '<li><a href="' + esc(eintrag.ober.href) + '">' + esc(eintrag.ober.titel) + '</a></li>';
    }
    h += '<li><span aria-current="page">' + esc(A.kuerze(name, 60)) + '</span></li>';
    $krumen.innerHTML = h;
  }

  function unterkategorienSetzen(eintrag) {
    if (!$unter || !eintrag) return;
    var kinder = eintrag.ober.kinder || [];
    if (!kinder.length) return;

    /* Gemerkt fuer den Leerzustand. Nur die Uebersicht einer Warengruppe
       ist eine Verteilerseite: steht der Kunde schon in einem Bereich und
       der ist leer, dann ist der Bereich wirklich leer. */
    bereiche = eintrag.unter ? [] : kinder;
    $unter.hidden = false;
    $unter.innerHTML = '<h2 class="label mt-6">Bereiche dieser Warengruppe</h2>' +
      '<ul class="reihe reihe--eng" style="list-style:none;margin:var(--sp-3) 0 0;padding:0">' +
      kinder.map(function (k) {
        var inhalt = esc(k.titel) +
          (k.anzahl != null ? ' <span class="zahl">(' + esc(k.anzahl) + ')</span>' : '');
        /* Der Bereich, in dem der Kunde schon steht, ist kein Link auf sich
           selbst. Welche Seite offen ist, sagt die Brotkrume — und die sagt
           es genau einmal. Vorher behauptete es hier eine vierte Stelle
           gleichzeitig, mit einem Link, der nirgendwohin fuehrte. */
        if (k.kat === katPfad) {
          return '<li><span class="btn btn--klein btn--sekundaer">' + inhalt + '</span></li>';
        }
        return '<li><a class="btn btn--klein btn--dezent" href="' + esc(k.href) + '">' +
          inhalt + '</a></li>';
      }).join('') +
      '</ul>';
  }

  function zahlSetzen(antwort, wort) {
    if (!$zahl) return;
    var n = antwort.anzahlGesamt;
    var begriff = wort || 'Artikel';
    if (n == null) { $zahl.textContent = produkte.length + ' ' + begriff; return; }
    if (antwort.seiten > 1) {
      $zahl.textContent = begriff + ' ' + antwort.von + ' bis ' + antwort.bis + ' von ' + n;
    } else {
      $zahl.textContent = n + ' ' + begriff;
    }
  }

  function ladeplatzhalter() {
    $raster.setAttribute('aria-busy', 'true');
    $raster.innerHTML = A.kartenPlatzhalter(8);
  }

  function fehler(antwort, was) {
    $raster.removeAttribute('aria-busy');
    if ($blaett) $blaett.hidden = true;
    if ($zahl) $zahl.textContent = '';
    $raster.innerHTML = '<div style="grid-column:1/-1">' +
      A.fehlerbox(antwort, was) +
      '<p class="mt-4"><button class="btn btn--sekundaer" type="button" ' +
      'onclick="window.location.reload()">Noch einmal versuchen</button> ' +
      '<a class="btn btn--dezent" href="index.html">Zur Startseite</a></p></div>';
  }

  /* Zwei verschiedene Faelle, die frueher denselben Satz bekamen:

       a) Die Warengruppe ist ein Dach ueber Bereichen und fuehrt selbst
          keine Artikel (so ist /fussmatten bei matten.de angelegt). Dann
          stehen ueber dieser Stelle die Bereiche zur Auswahl — "hier steht
          kein Artikel" widersprach dem, was direkt darueber zu sehen war.
       b) Es gibt keine Bereiche. Dann ist die Gruppe wirklich leer. */
  function leer(name) {
    if (bereiche.length) {
      $raster.innerHTML = A.leerbox(
        'Bitte wählen Sie einen Bereich',
        '„' + name + '“ ist bei matten.de das Dach über ' +
        (bereiche.length === 1 ? 'einem Bereich' : bereiche.length + ' Bereichen') +
        ' und führt selbst keine Artikel. Die Bereiche stehen oben auf dieser Seite.',
        bereiche.map(function (b) {
          return '<a class="btn btn--sekundaer" href="' + esc(b.href) + '">' + esc(b.titel) + '</a>';
        }).join(''),
        { rolle: 'status' }
      );
      return;
    }

    $raster.innerHTML = A.leerbox(
      'In „' + name + '“ steht zurzeit kein Artikel',
      'Das Altsystem führt diese Warengruppe, listet darin aber keine Artikel. ' +
      'Die benachbarten Bereiche oder die Suche helfen weiter.',
      '<a class="btn" href="index.html">Alle Warengruppen</a>' +
      '<a class="btn btn--sekundaer" href="tel:+498954558264">Beratung anrufen</a>',
      { rolle: 'status' }
    );
  }

  /* Sortieren geschieht auf der schon geladenen Seite. Das Altsystem kennt
     keine Sortierparameter — die Reihenfolge des Katalogs ist die einzige,
     die es selbst liefert. */
  function sortiert() {
    var liste = produkte.slice();
    var name = function (p) { return String(p.name || p.artikelnummer || '').toLowerCase(); };
    if (sortierung === 'name-auf') liste.sort(function (a, b) { return name(a).localeCompare(name(b), 'de'); });
    if (sortierung === 'name-ab')  liste.sort(function (a, b) { return name(b).localeCompare(name(a), 'de'); });
    if (sortierung === 'nummer') {
      liste.sort(function (a, b) {
        return String(a.artikelnummer || '').localeCompare(String(b.artikelnummer || ''), 'de', { numeric: true });
      });
    }
    return liste;
  }

  function rasterZeichnen() {
    $raster.removeAttribute('aria-busy');
    if (!produkte.length) { $raster.innerHTML = ''; return; }

    var liste = sortiert();
    $raster.innerHTML = liste.map(function (p) {
      /* Der Index zeigt auf die urspruengliche Position, damit die
         nachgeladenen Preise auch nach dem Sortieren treffen. */
      return karte(p, produkte.indexOf(p));
    }).join('');
  }

  /* Eine Produktkarte. Preis bleibt zunaechst offen und wird in Stufe 2
     nachgetragen. */
  function karte(p, index) {
    var bild = A.bild(p.bild || p.bildOriginal);
    var anfrage = p.modus === 'anfrage';
    var name = p.name || p.nameGeerbt || p.artikelnummer || 'Artikel';
    var ziel = 'produkt.html?pfad=' + encodeURIComponent(p.pfad);

    return '<article class="karte">' +
      '<div class="karte__bild' + (bild ? '' : ' bildflaeche') + '"' +
      (bild ? '' : ' role="img" aria-label="Für diesen Artikel liegt kein Bild vor"') + '>' +
      /* Nur EIN Abzeichen — sie liegen alle an derselben Ecke des Bildes. */
      (anfrage
        ? '<span class="abzeichen abzeichen--blau">Auf Anfrage</span>'
        : (p.variante ? '<span class="abzeichen abzeichen--rand">Variante</span>' : '')) +
      (bild ? '<img src="' + esc(bild) + '" alt="' + esc(A.kuerze(p.bildAlt || name, 100)) +
              '" loading="lazy" decoding="async">' : '') +
      '</div>' +
      '<div class="karte__koerper">' +
      '<p class="label label--gedeckt mb-0">Art.-Nr. ' + esc(A.kuerze(p.artikelnummer || '—', 22)) + '</p>' +
      '<h2 class="karte__titel karte__titel--kurz"><a href="' + esc(ziel) + '">' +
      esc(A.kuerze(name, 80)) + '</a></h2>' +
      (p.kurzbeschreibung
        ? '<p class="karte__text">' + esc(A.kuerze(A.aufraeumen(p.kurzbeschreibung), 110)) + '</p>'
        : '') +
      '<div class="karte__fuss">' +
      (anfrage
        ? '<span class="preis--anfrage" data-preis="' + index + '">Auf Anfrage</span>'
        : '<span class="preis--laedt" data-preis="' + index + '">Preis wird geladen …</span>') +
      '<span class="abzeichen' + (anfrage ? ' abzeichen--blau' : ' abzeichen--erfolg') + '">' +
      (anfrage ? 'Angebot' : 'Bestellbar') + '</span>' +
      '</div></div></article>';
  }

  /* ======================================================================
     6  Blaetterung
     ====================================================================== */

  function blaetterungZeichnen(antwort) {
    if (!$blaett) return;
    var seiten = Number(antwort.seiten) || 1;
    var jetzt = Number(antwort.seite) || 1;

    if (seiten <= 1) { $blaett.hidden = true; $blaett.innerHTML = ''; return; }
    $blaett.hidden = false;

    var h = '';
    h += jetzt > 1
      ? '<a href="' + esc(seitenAdresse(jetzt - 1)) + '" rel="prev">Zurück</a>'
      : '<span class="blatt blatt--aus" aria-hidden="true">Zurück</span>';

    h += '<ol>';
    nummern(jetzt, seiten).forEach(function (n) {
      if (n === null) {
        h += '<li><span class="blatt blatt--luecke" aria-hidden="true">…</span></li>';
      } else if (n === jetzt) {
        h += '<li><span class="blatt" aria-current="page">' + n + '</span></li>';
      } else {
        h += '<li><a href="' + esc(seitenAdresse(n)) + '" aria-label="Seite ' + n + '">' + n + '</a></li>';
      }
    });
    h += '</ol>';

    h += jetzt < seiten
      ? '<a href="' + esc(seitenAdresse(jetzt + 1)) + '" rel="next">Weiter</a>'
      : '<span class="blatt blatt--aus" aria-hidden="true">Weiter</span>';

    $blaett.innerHTML = h;
  }

  /* Erste, letzte und die Nachbarn der aktuellen Seite; dazwischen Luecken. */
  function nummern(jetzt, seiten) {
    var aus = [];
    for (var n = 1; n <= seiten; n++) {
      if (n === 1 || n === seiten || Math.abs(n - jetzt) <= 1) {
        aus.push(n);
      } else if (aus[aus.length - 1] !== null) {
        aus.push(null);
      }
    }
    return aus;
  }

  function seitenAdresse(n) {
    var p = new URLSearchParams(window.location.search);
    if (n <= 1) p.delete('seite'); else p.set('seite', n);
    var s = p.toString();
    return 'kategorie.html' + (s ? '?' + s : '');
  }

  /* ====================================================================== */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
