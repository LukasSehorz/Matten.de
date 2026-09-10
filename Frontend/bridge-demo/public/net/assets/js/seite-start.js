/* ==========================================================================
   matten.net — Startseite
   --------------------------------------------------------------------------
   Fuellt die Abschnitte von index.html mit Live-Daten der Bruecke:

     Karussell            Titel und Untertitel aus spec/texte/startseite.md,
                          Bilder aus dem Katalog von matten.de
     Warengruppen         Namen und Reihenfolge aus net-nav.js,
                          Artikelzahlen und Bilder aus /api/katalog bzw.
                          /api/kategorie
     Top-Angebote         die fuenf Artikel der matten.net-Startseite,
                          aufgeloest auf ihre matten.de-Gegenstuecke
     Kennwerte            aus /api/katalog

   Es wird kein Betrag gerechnet. Jeder Preis kommt aus dem Altsystem.
   Jedes Bild laeuft ueber /api/img/ (durchgesetzt von NetApi.bild).
   ========================================================================== */

(function () {
  'use strict';

  var A = window.NetApi;
  var NAV = window.NET_NAV || [];
  var esc = A.esc;

  /* ======================================================================
     1  Die elf Folien des Karussells
     --------------------------------------------------------------------
     titel und unter stehen woertlich so auf matten.net (Abschnitt 5 der
     Spezifikation). Drei Eingriffe sind bewusst:
       - Folie 5 heisst dort "Fusßmatten" (Tippfehler) und ist hier
         korrigiert.
       - Die Folien 3 und 4 verlinken dort in die englische Fassung; hier
         zeigen alle Folien auf die deutsche Warengruppe.
       - Folie 9 heisst dort "Fussmatten", zeigt aber in die Logomatten.
         Sie heisst hier nach ihrem Ziel. Ein woertlich uebernommener Titel
         waere hier ein Versprechen, das die Folie nicht einloest.
     Die Folien 4 und 5 zeigen dieselbe Kategorie mit verschiedenen
     Untertiteln. Damit dort nicht zweimal dasselbe Bild steht, bekommt die
     zweite Folie das naechste Bild der Kategorie (siehe bildDerKategorie).
     kat ist der echte matten.de-Pfad. Von dort kommt sowohl das Bild als
     auch das Ziel des Links.
     ====================================================================== */

  var FOLIEN = [
    { titel: 'Eingangsmatten, Schmutzfangmatten', unter: 'einfarbig, meliert oder gestaltet',            kat: '/fussmatten/standard-schmutzfangmatten' },
    { titel: 'Ihre Grußbotschaft im Eingang',     unter: 'Herzlich Willkommen',                          kat: '/logomatten/matten_fuer_haus_und_heim' },
    { titel: 'Alu-Profil',                        unter: 'Aluminium-Profilmatten',                       kat: '/aluminium_profilmatten' },
    { titel: 'Fussmatten',                        unter: '150 verschiedene Farben',                      kat: '/fussmatten/fussmatten' },
    { titel: 'Fussmatten',                        unter: '1-farbig, beliebige Größe',                    kat: '/fussmatten/fussmatten' },
    { titel: 'Logomatten, Designmatten',          unter: 'bis 20-farbig und fotorealistisch',            kat: '/logomatten/wunschdesign-matten' },
    { titel: 'REHAB-Matten',                      unter: 'Physio-Trainingsmatten',                       kat: '/logomatten/os-physio-rehab-matten' },
    { titel: 'Eingangs-Fussmatten',               unter: 'Standards und individuelle Größen, Formen und Farben', kat: '/fussmatten/matten_fuer_aussenbereiche' },
    /* Auf matten.net heisst diese Folie "Fussmatten", zeigt dort aber in
       die Logomatten. Der Titel folgt hier dem Ziel — eine Folie, die
       "Fussmatten" verspricht und in eine andere Warengruppe fuehrt, ist
       ein gebrochenes Versprechen, kein uebernommener Wortlaut. */
    { titel: 'Logomatten',                        unter: 'Schmutzfangmatten, einfarbig und gestaltet',   kat: '/logomatten' },
    { titel: 'Aluminium-Profilmatten',            unter: 'verschiedene Trittflächen und Kombinationen',  kat: '/aluminium_profilmatten/rahmen_und_zubehoer' },
    { titel: 'Marmor, Onyx, Fossil, Terrazzo',    unter: 'Waschbecken, Wannen, Badzubehör',              kat: '/was-ist-neu/terrazzo' }
  ];

  /* ======================================================================
     2  Die fuenf Top-Angebote
     --------------------------------------------------------------------
     Links steht der Artikel, wie ihn matten.net auf der Startseite fuehrt;
     rechts der Pfad des Gegenstuecks bei matten.de. Grundlage ist
     spec/texte/zuordnung-matten-de.md, Abschnitt 4.

     Zwei Zuordnungen sind dort als "unsicher" gefuehrt und hier trotzdem
     uebernommen, weil sie die einzigen Kandidaten sind:
       - "IRON-HORSE 1-farbige und melierte Schmutzfangmatten" -> 64000121
       - "JetPrint Premium 1-farbig": auf matten.de gibt es keinen Artikel
         dieses Namens. Genommen wird 6300000 ("JetPrint-Premium"), der
         einzige Artikel mit uebereinstimmender Nummernbasis.
     ====================================================================== */

  var TOP = [
    { netName: 'IRON-HORSE 1-farbige und melierte Schmutzfangmatten', pfad: '/fussmatten/standard-schmutzfangmatten/64000121' },
    { netName: 'IRON-HORSE-Mietmatte',                                pfad: '/miet-mattenservice/mietmatten' },
    { netName: 'JetPrint Premium 1-farbig',                           pfad: '/fussmatten/standard-schmutzfangmatten/6300000' },
    { netName: 'JetPrint light 1-farbig',                             pfad: '/fussmatten/fussmatten/jetprint_matten-light-einfarbig' },
    { netName: 'Designmatten JetPrint',                               pfad: '/logomatten/6300201-logomatte' }
  ];

  /* ======================================================================
     3  Kategoriebilder
     --------------------------------------------------------------------
     /api/katalog liefert keine Bilder. Das erste Produkt einer Kategorie
     mit Bild dient deshalb als Kachelbild. Jede Kategorie wird hoechstens
     einmal geholt; die Anfragen laufen zu dritt parallel, damit das
     Altsystem nicht mit einem Schwall belastet wird.
     ====================================================================== */

  var kategorieCache = {};           /* pfad -> Promise auf die Antwort */
  var warteschlange = [];
  var laufend = 0;
  var GLEICHZEITIG = 3;

  function kategorieHolen(pfad) {
    if (kategorieCache[pfad]) return kategorieCache[pfad];
    kategorieCache[pfad] = new Promise(function (fertig) {
      warteschlange.push(function () {
        A.kategorie(pfad, { proSeite: 6 }).then(function (antwort) {
          fertig(antwort);
          laufend -= 1;
          weiter();
        });
      });
      weiter();
    });
    return kategorieCache[pfad];
  }

  function weiter() {
    while (laufend < GLEICHZEITIG && warteschlange.length) {
      laufend += 1;
      warteschlange.shift()();
    }
  }

  /* Brauchbares Bild einer Kategorie. Liefert { bild, alt } oder null.
     "versatz" ueberspringt die ersten n brauchbaren Bilder. Zwei Folien
     des Karussells (4 und 5) zeigen laut matten.net dieselbe Kategorie mit
     verschiedenen Untertiteln; ohne Versatz stuenden dort zweimal genau
     dasselbe Bild. Gibt es nicht genug Bilder, faellt es auf das erste
     zurueck — eine Folie ohne Bild waere schlechter als eine doppelte. */
  function bildDerKategorie(antwort, versatz) {
    if (!antwort || !antwort.ok) return null;
    var liste = antwort.produkte || [];
    var gefunden = [];
    for (var i = 0; i < liste.length; i++) {
      var b = A.bild(liste[i].bild || liste[i].bildOriginal);
      if (b) gefunden.push({ bild: b, alt: liste[i].bildAlt || liste[i].name || '' });
    }
    if (!gefunden.length) return null;
    var n = Number(versatz) || 0;
    return gefunden[n] || gefunden[0];
  }

  /* ======================================================================
     4  Karussell
     ====================================================================== */

  function karussellAufbauen() {
    var spur = document.getElementById('karussell');
    var punkte = document.getElementById('karussell-punkte');
    if (!spur) return;

    spur.innerHTML = FOLIEN.map(function (f, i) {
      return '<a class="karussell__folie" id="folie-' + i + '" ' +
        'href="kategorie.html?kat=' + encodeURIComponent(f.kat) + '" ' +
        'aria-label="' + esc(f.titel + ' — ' + f.unter) + '">' +
        '<div class="karussell__bild" data-folienbild="' + i + '"></div>' +
        '<span class="karussell__text">' +
        '<span class="karussell__titel">' + esc(f.titel) + '</span>' +
        '<span class="karussell__unter">' + esc(f.unter) + '</span>' +
        '</span></a>';
    }).join('');

    /* Punktleiste: springt zur Folie und sagt an, welche gerade sichtbar ist. */
    if (punkte) {
      punkte.innerHTML = FOLIEN.map(function (f, i) {
        return '<li><button class="karussell__punkt" type="button" data-zu="' + i + '" ' +
          'aria-current="' + (i === 0 ? 'true' : 'false') + '">' +
          '<span class="nur-sr">Folie ' + (i + 1) + ' von ' + FOLIEN.length + ': ' + esc(f.titel) + '</span>' +
          '</button></li>';
      }).join('');

      punkte.addEventListener('click', function (ev) {
        var knopf = ev.target.closest ? ev.target.closest('[data-zu]') : null;
        if (!knopf) return;
        var ziel = document.getElementById('folie-' + knopf.getAttribute('data-zu'));
        if (ziel) spur.scrollTo({ left: ziel.offsetLeft - spur.offsetLeft, behavior: 'smooth' });
      });
    }

    /* Sichtbare Folie erkennen und die Punktleiste nachziehen. */
    if (window.IntersectionObserver && punkte) {
      var beobachter = new window.IntersectionObserver(function (eintraege) {
        eintraege.forEach(function (e) {
          if (!e.isIntersecting) return;
          var nr = e.target.id.replace('folie-', '');
          punkte.querySelectorAll('[data-zu]').forEach(function (k) {
            k.setAttribute('aria-current', k.getAttribute('data-zu') === nr ? 'true' : 'false');
          });
        });
      }, { root: spur, threshold: 0.6 });
      spur.querySelectorAll('.karussell__folie').forEach(function (f) { beobachter.observe(f); });
    }

    /* Bilder nachladen — je Folie aus ihrer Kategorie. Kommt eine Kategorie
       mehrfach vor, bekommt jede Folie ein anderes Bild daraus. */
    var schonBenutzt = {};
    FOLIEN.forEach(function (f, i) {
      var versatz = schonBenutzt[f.kat] || 0;
      schonBenutzt[f.kat] = versatz + 1;
      kategorieHolen(f.kat).then(function (antwort) {
        var bild = bildDerKategorie(antwort, versatz);
        var flaeche = spur.querySelector('[data-folienbild="' + i + '"]');
        if (!flaeche) return;
        if (!bild) {
          /* Kein Bild im Altsystem: die Flaeche bleibt ruhig statt leer. */
          flaeche.classList.add('bildflaeche');
          flaeche.textContent = '';
          return;
        }
        flaeche.innerHTML = '<img src="' + esc(bild.bild) + '" alt="" loading="lazy" decoding="async">';
      });
    });
  }

  /* ======================================================================
     5  Warengruppen-Kacheln
     ====================================================================== */

  /* Beschriftung im Kartenfuss. Eine Oberkategorie ohne eigene Artikel
     (matten.de fuehrt sie dort nur als Dach) nennt statt "0 Artikel" die
     Zahl ihrer Bereiche. */
  function zahltext(g) {
    var kinder = (g.kinder || []).length;
    if (g.anzahl) return g.anzahl + ' Artikel';
    if (kinder) return kinder === 1 ? '1 Bereich' : kinder + ' Bereiche';
    return '';
  }

  function warengruppenAufbauen() {
    var ziel = document.getElementById('warengruppen');
    if (!ziel) return;

    /* Alle Menuepunkte, die auf eine echte matten.de-Kategorie zeigen. */
    var gruppen = NAV.filter(function (e) { return !!e.kat; });

    ziel.innerHTML = gruppen.map(function (g, i) {
      var untertitel = (g.kinder || []).map(function (k) { return k.titel; }).join(' · ');
      return '<article class="karte" data-gruppe="' + i + '">' +
        '<div class="karte__bild bildflaeche" data-gruppenbild="' + i + '" role="img" ' +
        'aria-label="Beispielbild aus der Warengruppe ' + esc(g.titel) + '"></div>' +
        '<div class="karte__koerper">' +
        '<p class="label label--gedeckt mb-0">Warengruppe</p>' +
        '<h3 class="karte__titel"><a href="' + esc(g.href) + '">' + esc(g.titel) + '</a></h3>' +
        (untertitel ? '<p class="karte__text">' + esc(A.kuerze(untertitel, 90)) + '</p>' : '') +
        '<div class="karte__fuss">' +
        '<span class="karte__zahl" data-gruppenzahl="' + i + '">' + esc(zahltext(g)) + '</span>' +
        '<span class="abzeichen abzeichen--rand">Ansehen</span>' +
        '</div></div></article>';
    }).join('');
    ziel.removeAttribute('aria-busy');

    var status = document.getElementById('warengruppen-status');
    if (status) status.textContent = gruppen.length + ' Warengruppen geladen.';

    /* Bilder und tatsaechliche Artikelzahlen nachziehen.
       Fuehrt die Kategorie selbst keine Artikel (z. B. /fussmatten), nennt
       net-nav.js in "bildkat" eine Ersatzkategorie fuer das Bild. */
    gruppen.forEach(function (g, i) {
      kategorieHolen(g.bildkat || g.kat).then(function (antwort) {
        var flaeche = ziel.querySelector('[data-gruppenbild="' + i + '"]');
        var bild = bildDerKategorie(antwort);
        if (flaeche && bild) {
          flaeche.classList.remove('bildflaeche');
          flaeche.removeAttribute('role');
          flaeche.removeAttribute('aria-label');
          flaeche.innerHTML = '<img src="' + esc(bild.bild) + '" alt="" loading="lazy" decoding="async">';
        }
        /* Die Artikelzahl darf nur aus der Kategorie selbst kommen — bei
           einer Ersatzkategorie fuers Bild waere sie sonst falsch. */
        var zahl = g.bildkat ? null : ziel.querySelector('[data-gruppenzahl="' + i + '"]');
        if (zahl && antwort && antwort.ok && typeof antwort.anzahlGesamt === 'number') {
          zahl.textContent = antwort.anzahlGesamt === 1
            ? '1 Artikel'
            : antwort.anzahlGesamt + ' Artikel';
        }
      });
    });
  }

  /* ======================================================================
     6  Top-Angebote
     ====================================================================== */

  function topAufbauen() {
    var ziel = document.getElementById('top-angebote');
    if (!ziel) return;

    ziel.innerHTML = A.kartenPlatzhalter(TOP.length);

    Promise.all(TOP.map(function (t) { return A.produkt(t.pfad); })).then(function (antworten) {
      var karten = [];
      antworten.forEach(function (antwort, i) {
        if (!antwort || !antwort.ok || !antwort.produkt) return;
        karten.push(produktkarte(antwort.produkt, TOP[i]));
      });

      ziel.removeAttribute('aria-busy');
      if (!karten.length) {
        ziel.innerHTML = '<div style="grid-column:1/-1">' +
          A.fehlerbox(antworten[0], 'Top-Angebote konnten nicht geladen werden',
            '<a class="weiterlink" href="kategorie.html?kat=%2Flogomatten">Zum Sortiment</a>') +
          '</div>';
        return;
      }
      ziel.innerHTML = karten.join('');
    });
  }

  /* Eine Produktkarte im Stil des Designsystems.
     Der Preis kommt unveraendert aus dem Altsystem; fehlt er, steht dort
     "Auf Anfrage" — es wird nichts geschaetzt. */
  function produktkarte(p, herkunft) {
    var bild = A.bild(p.hauptbild || (p.bilder && p.bilder[0] && p.bilder[0].bild));
    var preis = A.preisAnzeige(p.preis);
    var anfrage = p.modus === 'anfrage';
    var ziel = 'produkt.html?pfad=' + encodeURIComponent(p.pfad);

    return '<article class="karte">' +
      '<div class="karte__bild' + (bild ? '' : ' bildflaeche') + '"' +
      (bild ? '' : ' role="img" aria-label="Für diesen Artikel liegt kein Bild vor"') + '>' +
      (anfrage ? '<span class="abzeichen abzeichen--blau">Auf Anfrage</span>' : '') +
      (bild ? '<img src="' + esc(bild) + '" alt="" loading="lazy" decoding="async">' : '') +
      '</div>' +
      '<div class="karte__koerper">' +
      '<p class="label label--gedeckt mb-0">' +
      esc((p.kategorie && p.kategorie.name) || 'Sortiment') + '</p>' +
      '<h3 class="karte__titel karte__titel--kurz"><a href="' + esc(ziel) + '">' +
      esc(A.kuerze(p.name || p.artikelnummer, 70)) + '</a></h3>' +
      (herkunft && herkunft.netName
        ? '<p class="karte__text">Auf matten.net: ' + esc(herkunft.netName) + '</p>'
        : '') +
      '<div class="karte__fuss">' +
      (preis && !anfrage
        ? '<span class="preis">' + esc(preis) + '</span>'
        : '<span class="preis--anfrage">Auf Anfrage</span>') +
      '<span class="abzeichen abzeichen--rand">Art.-Nr. ' + esc(A.kuerze(p.artikelnummer || '—', 18)) + '</span>' +
      '</div></div></article>';
  }

  /* ======================================================================
     7  Kennwerte und Designer-Bild
     ====================================================================== */

  /* Zwei Zahlen, die vorher nicht zu dem passten, was daneben zu sehen war:

       "Warengruppen" nannte die 8 Oberkategorien von /api/katalog, waehrend
       der Abschnitt darunter alle Warengruppen des Menues als Kacheln
       zeigt. Die Zahl kommt jetzt aus derselben Quelle wie die Kacheln und
       kann darum nicht mehr von ihnen abweichen.

       "Artikel im Katalog" nannte anzahlProdukteGelistet. Das sind
       Listenplaetze, nicht Artikel: dieselbe Matte steht in mehreren
       Kategorien und wird mehrfach gezaehlt (612 Plaetze). Eigenstaendige
       Artikel sind es 384. Genau darauf verweist der Hinweis von
       /api/katalog selbst; die Zahl steht in /api/suche?alle=1 als
       anzahlGesamt. Genommen wird die Suche und nicht
       /api/katalog/diagnose: die Diagnose holt beim ersten Aufruf 25
       Artikelseiten beim Altsystem und braucht dafuer rund 15 Sekunden —
       zu viel Last und zu lange fuer eine Zahl im Seitenkopf.
       Gerechnet wird hier nichts, die Zahl kommt fertig vom Server. */
  function kennwerteFuellen() {
    var gruppen = document.querySelector('[data-kennwert="gruppen"]');
    var artikel = document.querySelector('[data-kennwert="artikel"]');

    if (gruppen) {
      gruppen.textContent = String(NAV.filter(function (e) { return !!e.kat; }).length);
    }

    if (!artikel) return;
    A.hole('/api/suche?alle=1&proSeite=1').then(function (antwort) {
      var n = antwort && antwort.ok ? antwort.anzahlGesamt : null;
      /* Antwortet die Suche nicht, bleibt der Strich stehen. Eine Zahl,
         die etwas anderes zaehlt als das Wort daneben, waere schlechter
         als gar keine. */
      if (typeof n === 'number') artikel.textContent = String(n);
    });
  }

  function designerBild() {
    var flaeche = document.getElementById('designer-bild');
    if (!flaeche) return;
    kategorieHolen('/logomatten/wunschdesign-matten').then(function (antwort) {
      var bild = bildDerKategorie(antwort);
      if (!bild) { flaeche.textContent = 'Beispielbild folgt'; return; }
      flaeche.classList.remove('bildflaeche', 'bildflaeche--breit');
      flaeche.removeAttribute('role');
      flaeche.style.borderRadius = 'var(--r-3)';
      flaeche.style.overflow = 'hidden';
      flaeche.style.aspectRatio = '16 / 9';
      flaeche.innerHTML = '<img src="' + esc(bild.bild) +
        '" alt="Beispiel einer individuell gestalteten Logomatte" ' +
        'style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy" decoding="async">';
    });
  }

  /* ======================================================================
     8  Start
     ====================================================================== */

  function start() {
    karussellAufbauen();
    warengruppenAufbauen();
    topAufbauen();
    kennwerteFuellen();
    designerBild();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
