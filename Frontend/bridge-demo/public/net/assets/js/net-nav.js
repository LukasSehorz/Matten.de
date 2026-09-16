/* ==========================================================================
   matten.net — Navigationsdaten
   --------------------------------------------------------------------------
   Diese Datei enthaelt AUSSCHLIESSLICH Daten, keine Logik. Sie ist bewusst
   von net-shell.js getrennt, damit sie ersetzt werden kann, ohne dass am
   Grundgeruest etwas geaendert werden muss.

   ==========================================================================
   DIE ENTSCHEIDUNG HINTER DIESER LISTE
   ==========================================================================
   matten.net und matten.de haben verschiedene Kataloge:

     matten.net   27 Kategorien, 19 Produkte, fein zerlegt, 15 Kategorien leer
     matten.de    24 Kategorien, 375 Artikel, grober geschnitten

   Die OBERGRUPPEN decken sich aber fast. Deshalb gilt hier:

     * Benennung und Reihenfolge der Obergruppen stammen von matten.net —
       die vertraute Navigation bleibt erhalten.
     * Darunter haengen die ECHTEN Unterkategorien von matten.de mit ihren
       echten Pfaden — kein Artikel geht verloren.

   Grundlage ist spec/texte/zuordnung-matten-de.md. Wo die Zuordnung dort
   unsicher war, steht die getroffene Entscheidung unten am jeweiligen
   Eintrag als Kommentar.

   Alle 24 Kategorien von matten.de sind erreichbar. Nachgeprueft gegen
   GET /api/katalog (Stand 31.08.2026).

   JEDER KATEGORIEPFAD STEHT GENAU EINMAL IN DIESER LISTE.
   Das ist keine Stilfrage, sondern Bedingung: net-shell.js erkennt die
   aktive Seite an "pfad" bzw. "href". Stuenden zwei Menuepunkte auf
   demselben Kategoriepfad, truege das Menue zwei aria-current="page", die
   Brotkrume nennte die falsche Obergruppe, und einer der beiden Punkte
   koennte nie aktiv werden. Wer einen Punkt ergaenzt, prueft vorher, ob
   der Pfad schon vorkommt.

   ==========================================================================
   AUFBAU EINES EINTRAGS
   ==========================================================================
     titel   Beschriftung im Menue (Sprache von matten.net)
     kat     ECHTER Kategoriepfad von matten.de. Genau dieser Wert geht an
             GET /api/kategorie?pfad=… — er wird nirgends umgeschrieben.
             Fehlt er, ist der Punkt eine reine Seite (Home, Designer).
     pfad    Zieladresse im spaeteren Shop, uebernommen aus matten.net ohne
             das Praefix "/de". net-shell.js vergleicht damit
             <body data-aktiv="…"> und setzt aria-current.
     href    Adresse, die im aktuellen Geruest wirklich existiert.
             Warengruppen zeigen auf kategorie.html?kat=<echter Pfad>.
     anzahl  Artikelzahl laut /api/katalog. Nur Anzeige, keine Logik.
     bildkat Nur noetig, wenn die Kategorie selbst keine Artikel fuehrt und
             die Startseite deshalb kein Kachelbild faende. Dann wird das
             Bild aus dieser Ersatzkategorie genommen.
     kinder  Untereintraege, gleicher Aufbau.
   ========================================================================== */

(function () {
  'use strict';

  /* Baut die Adresse einer Warengruppe aus dem ECHTEN matten.de-Pfad. */
  function katHref(pfad) { return 'kategorie.html?kat=' + encodeURIComponent(pfad); }

  /* Kurzschreibweise fuer einen Untereintrag. */
  function u(titel, netSlug, dePfad, anzahl) {
    return {
      titel: titel,
      pfad: '/product-categories/' + netSlug,
      kat: dePfad,
      href: katHref(dePfad),
      anzahl: anzahl
    };
  }

  var NAV = [
    {
      titel: 'Home',
      pfad: '/',
      href: 'index.html'
    },

    /* ------------------------------------------------------------------
       Fussmatten — Obergruppe von matten.net, Pfad von matten.de.
       Die Oberkategorie /fussmatten fuehrt selbst keine Artikel; die
       Uebersichtsseite zeigt deshalb ihre Unterkategorien.
       "Matten für Außenbereiche" haengt bewusst NICHT hier, sondern unter
       der net-Obergruppe "Outdoor-Matten" (siehe dort).
       ------------------------------------------------------------------ */
    {
      titel: 'Fussmatten',
      pfad: '/product-categories/fussmatten',
      kat: '/fussmatten',
      href: katHref('/fussmatten'),
      anzahl: 0,
      /* /fussmatten selbst fuehrt keine Artikel — das Kachelbild der
         Startseite kommt deshalb aus der groessten Unterkategorie. */
      bildkat: '/fussmatten/fussmatten',
      kinder: [
        /* zuordnung: jetprint-einfarbig -> fussmatten/fussmatten (wahrscheinlich) */
        u('Einfarbige und Logo-Fußmatten', 'jetprint-einfarbig', '/fussmatten/fussmatten', 47),
        /* zuordnung: ironhorse -> standard-schmutzfangmatten (unsicher, rein inhaltlich).
           Uebernommen, weil dort die drei Iron-Horse-Artikel 64000121/122/161 liegen. */
        u('Baumwoll- und Nylon-Fußmatten', 'ironhorse', '/fussmatten/standard-schmutzfangmatten', 44)
      ]
    },

    {
      titel: 'Mattendesigner',
      pfad: '/custom-mat/create',
      href: 'mattendesigner.html'
    },

    /* ------------------------------------------------------------------
       Logomatten — deckt sich im Namen mit matten.de.
       Die Unterkategorie os-physio-rehab-matten haengt NICHT hier, sondern
       unter der net-Obergruppe "OS-REHA-Physio-Matten", damit sie nicht
       doppelt im Menue steht.
       ------------------------------------------------------------------ */
    {
      titel: 'Logomatten',
      pfad: '/product-categories/logomatten',
      kat: '/logomatten',
      href: katHref('/logomatten'),
      anzahl: 90,
      kinder: [
        /* zuordnung: designmatten / jetprint-design -> wunschdesign-matten */
        u('Wunschdesign-Matten', 'designmatten', '/logomatten/wunschdesign-matten', 16),
        /* Auf matten.net gar nicht vorhanden (56 Artikel). Ohne diesen Punkt
           waere die groesste Unterkategorie von matten.de unerreichbar. */
        u('Sicherheits- und Symbol-Matten', 'sicherheits-symbol-matten', '/logomatten/sicherheits_symbol_matten', 56),
        /* zuordnung: katzen-willk -> matten_fuer_haus_und_heim (unsicher,
           reine Themenvermutung). Uebernommen, aber unter dem de-Namen. */
        u('Matten für Haus und Heim', 'katzen-willk', '/logomatten/matten_fuer_haus_und_heim', 40),
        /* Auf matten.net nicht vorhanden (33 Artikel). */
        u('Biergartenbank-Matten', 'bierbankmatten', '/logomatten/bierbankmatten', 33),
        /* Auf matten.net nicht vorhanden (9 Artikel). */
        u('Werbematten und Dekomatten', 'werbematten-dekomatten', '/logomatten/werbematten-dekomatten', 9),
        /* Auf beiden Systemen leer — bleibt im Menue, damit die Struktur von
           matten.de vollstaendig abgebildet ist. */
        u('Art-Designs Welcome-Holzdesigns', 'welcome-holzdesign', '/logomatten/welcome-holzdesign', 0)
      ]
    },

    /* ------------------------------------------------------------------
       OS-REHA-Physio-Matten — auf matten.net eine eigene Obergruppe mit
       acht Unterpunkten, von denen sieben auf matten.de nur einzelne
       Artikel sind. Auf matten.de bleibt genau eine echte Kategorie uebrig;
       die Obergruppe zeigt deshalb direkt darauf und fuehrt kein Untermenue.

       Frueher hingen hier zwei Unterpunkte:
         - "OS-Physio REHAB Trainings-Matten" zeigte auf denselben Pfad wie
           die Obergruppe selbst. Der Punkt sagte nichts Neues, verdoppelte
           aber aria-current und erzeugte einen Selbstlink im Menue.
         - "OS-Physio REHA-Matten, neu" zeigte auf /was-ist-neu/neue-artikel.
           Dieser Pfad gehoert strukturell unter "Was ist neu" und steht
           dort weiterhin als "Neue Artikel". Der doppelte Eintrag liess die
           Seite sich faelschlich als OS-REHA-Physio-Matten ausgeben.
       Beide Punkte sind entfernt; erreichbar bleibt alles.
       ------------------------------------------------------------------ */
    {
      titel: 'OS-REHA-Physio-Matten',
      pfad: '/product-categories/os-reha-physio-matten',
      kat: '/logomatten/os-physio-rehab-matten',
      href: katHref('/logomatten/os-physio-rehab-matten'),
      anzahl: 16
    },

    /* ------------------------------------------------------------------
       Kokosmatten — matten.de hat genau eine Kokos-Kategorie ohne
       Unterkategorien. Die drei net-Unterpunkte (farbig, naturfarbig,
       Logomatte) sind dort einzelne Artikel und werden deshalb nicht als
       Menuepunkte gefuehrt.
       ------------------------------------------------------------------ */
    {
      titel: 'Kokosmatten',
      pfad: '/product-categories/kokosmatten',
      kat: '/kokosmatten',
      href: katHref('/kokosmatten'),
      anzahl: 12
    },

    /* ------------------------------------------------------------------
       Aluminium-Matten — Gruppenname auf beiden Systemen identisch.
       MARSCHALL und Diplomat sind auf matten.de Produktlinien, keine
       Kategorien; sie entfallen daher als Menuepunkte.
       ------------------------------------------------------------------ */
    {
      titel: 'Aluminium-Matten',
      pfad: '/product-categories/aluminium-matten',
      kat: '/aluminium_profilmatten',
      href: katHref('/aluminium_profilmatten'),
      anzahl: 80,
      kinder: [
        u('Rahmen, Profile und Zubehör', 'rahmen-und-zubehoer', '/aluminium_profilmatten/rahmen_und_zubehoer', 56)
      ]
    },

    /* ------------------------------------------------------------------
       Gummimatten — heisst auf matten.de "Gummi-/Kunststoffmatten".
       Cushion Coil, Scraper und Struktura sind dort Einzelartikel.
       ------------------------------------------------------------------ */
    {
      titel: 'Gummimatten',
      pfad: '/product-categories/gummimatten',
      kat: '/gummi_und_kunststoffmatten',
      href: katHref('/gummi_und_kunststoffmatten'),
      anzahl: 51,
      kinder: [
        u('Bodenschutzmatten', 'bodenschutzmatten', '/gummi_und_kunststoffmatten/bodenschutzmatten', 2)
      ]
    },

    /* ------------------------------------------------------------------
       Outdoor-Matten — auf matten.net eine Obergruppe mit dem einzigen
       Unterpunkt "Turf". Auf matten.de entspricht das der Unterkategorie
       "Matten für Außenbereiche" unter Fussmatten. Sie steht hier statt
       unter Fussmatten, damit die net-Obergruppe nicht leer bleibt und die
       Kategorie nicht zweimal im Menue auftaucht.
       ------------------------------------------------------------------ */
    {
      titel: 'Outdoor-Matten',
      pfad: '/product-categories/outdoor-matten',
      kat: '/fussmatten/matten_fuer_aussenbereiche',
      href: katHref('/fussmatten/matten_fuer_aussenbereiche'),
      anzahl: 40
    },

    /* ------------------------------------------------------------------
       Mietmatten — auf matten.de "Miet-Mattenservice".
       ------------------------------------------------------------------ */
    {
      titel: 'Mietmatten',
      pfad: '/product-categories/mietmatten',
      kat: '/miet-mattenservice',
      href: katHref('/miet-mattenservice'),
      anzahl: 2,
      kinder: [
        u('Miet-Fußmatten', 'iron-horse-mietmatten', '/miet-mattenservice/service_miet-mattenservice', 5),
        /* Auf matten.net nicht vorhanden. */
        u('Teppich-Reinigungsprodukte', 'reinigungsprodukte', '/miet-mattenservice/reinigungsprodukte', 2)
      ]
    },

    /* ------------------------------------------------------------------
       Was ist neu — Schluessel auf beiden Systemen identisch; matten.de
       zeigt die Kategorie unter dem Anzeigenamen "Artikelsuche".
       ------------------------------------------------------------------ */
    {
      titel: 'Was ist neu',
      pfad: '/product-categories/was-ist-neu',
      kat: '/was-ist-neu',
      href: katHref('/was-ist-neu'),
      anzahl: 1,
      kinder: [
        u('Neue Artikel', 'neue-artikel', '/was-ist-neu/neue-artikel', 4),
        /* Auf matten.net ist "Waschbecken" eine eigene Obergruppe. Auf
           matten.de gibt es dafuer keine eigene Kategorie — die Waschbecken
           liegen in /was-ist-neu/terrazzo. Der Name der Obergruppe steht
           deshalb hier im Titel des Unterpunktes, statt ein zweites Mal als
           Obergruppe auf denselben Pfad zu zeigen. Genau diese Dopplung
           machte den Menuepunkt "Waschbecken" frueher unaktivierbar. */
        u('Terrazzo, Stein-Wannen, Waschbecken', 'waschbecken', '/was-ist-neu/terrazzo', 2)
      ]
    },

    /* ------------------------------------------------------------------
       Schnäppchen — auf matten.net gibt es diese Gruppe NICHT. Sie ist
       hier ergaenzt, weil ihre vier Artikel sonst ueber kein Menue
       erreichbar waeren. Das ist die einzige Abweichung von der
       Obergruppenliste von matten.net.
       ------------------------------------------------------------------ */
    {
      titel: 'Schnäppchen',
      pfad: '/product-categories/schnaeppchen',
      kat: '/schnaeppchen',
      href: katHref('/schnaeppchen'),
      anzahl: 4
    }
  ];

  /* ------------------------------------------------------------------------
     Feste Adressen ausserhalb der Warengruppen.
     "pfad" ist das Ziel im spaeteren Shop, "href" die Datei, die im Geruest
     schon existiert.

     "vorbereitung: true" heisst: die Seite gibt es, sie fuehrt aber noch
     keinen Text — die Vorlage matten.net hat dazu keinen Inhalt, und
     erfunden wird hier nichts. Kopf und Fuss schreiben das an den Link,
     damit niemand einem Versprechen folgt, das dahinter nicht eingeloest
     wird. Sobald ein Text in seite-inhalt.js steht, faellt die Marke weg.
     ---------------------------------------------------------------------- */
  var ROUTEN = {
    start:         { titel: 'Startseite',      pfad: '/',                        href: 'index.html' },
    designer:      { titel: 'Mattendesigner',  pfad: '/custom-mat/create',       href: 'mattendesigner.html' },
    warenkorb:     { titel: 'Warenkorb',       pfad: '/order/cart',              href: 'warenkorb.html' },
    kasse:         { titel: 'Kasse',           pfad: '/order/checkout',          href: 'kasse.html' },
    login:         { titel: 'Anmelden',        pfad: '/login',                   href: 'login.html' },
    registrieren:  { titel: 'Konto anlegen',   pfad: '/account/register',        href: 'registrieren.html' },
    konto:         { titel: 'Mein Konto',      pfad: '/account',                 href: 'login.html' },
    blog:          { titel: 'Blog',            pfad: '/blog',                    href: 'blog.html' },
    gaestebuch:    { titel: 'Gästebuch',       pfad: '/guest-book',              href: 'gaestebuch.html' },
    suche:         { titel: 'Suche',           pfad: '/search',                  href: 'kategorie.html' },
    agb:           { titel: 'AGB',             pfad: '/pages/agb',               href: 'seite.html?seite=agb' },
    impressum:     { titel: 'Impressum',       pfad: '/pages/impressum',         href: 'seite.html?seite=impressum' },
    datenschutz:   { titel: 'Datenschutz',     pfad: '/pages/data-protection',   href: 'seite.html?seite=data-protection' },
    widerruf:      { titel: 'Widerrufsrecht',  pfad: '/pages/widerruf',          href: 'seite.html?seite=widerruf' },
    versand:       { titel: 'Versand & Lieferung', pfad: '/pages/versand',       href: 'seite.html?seite=versand',       vorbereitung: true },
    zahlung:       { titel: 'Zahlungsarten',   pfad: '/pages/zahlung',           href: 'seite.html?seite=zahlung',       vorbereitung: true },
    kontakt:       { titel: 'Kontakt',         pfad: '/pages/kontakt',           href: 'seite.html?seite=kontakt',       vorbereitung: true },
    ueberuns:      { titel: 'Über uns',        pfad: '/pages/ueber-uns',         href: 'seite.html?seite=ueber-uns',     vorbereitung: true },
    faq:           { titel: 'Häufige Fragen',  pfad: '/pages/faq',               href: 'seite.html?seite=faq',           vorbereitung: true },
    musterservice: { titel: 'Musterservice',   pfad: '/pages/musterservice',     href: 'seite.html?seite=musterservice', vorbereitung: true },
    styleguide:    { titel: 'Musterseite',     pfad: '/styleguide',              href: 'styleguide.html' }
  };

  /* ------------------------------------------------------------------------
     Betreiberdaten. Stehen hier, damit Kopf und Fuss dieselbe Quelle haben.
     ---------------------------------------------------------------------- */
  var FIRMA = {
    marke: 'Mattenfuchs',
    markeTeil1: 'Matten',
    markeTeil2: 'fuchs',
    zusatz: 'Schmutzfang- und Logomatten nach Maß',
    betreiber: 'FUCHSIUS multi-media GmbH',
    ort: 'Ismaning bei München',
    telefon: '+49 89 54 55 82 64',
    telefonRoh: '+498954558264',
    mobil: '+49 171 77 55 400',
    mobilRoh: '+491717755400',
    email: 'info@matten.de',
    zeiten: 'Mo–Fr 8–17 Uhr'
  };

  /* Sprachen. Der Shop ist einsprachig deutsch; der Umschalter ist nur
     vorbereitet und wird erst eingeblendet, wenn "aktiv" mehr als einen
     Eintrag hat. */
  var SPRACHEN = [
    { code: 'de', titel: 'Deutsch', praefix: '', aktiv: true }
    /* { code: 'en', titel: 'English', praefix: '/en', aktiv: false } */
  ];

  /* ------------------------------------------------------------------------
     Fussbereich. Die erste Spalte wird zur Laufzeit aus NAV erzeugt,
     damit Menue und Fuss nie auseinanderlaufen.
     ---------------------------------------------------------------------- */
  var FUSS = [
    {
      titel: 'Service',
      punkte: ['musterservice', 'versand', 'zahlung', 'faq', 'kontakt', 'gaestebuch']
    },
    {
      titel: 'Unternehmen',
      punkte: ['ueberuns', 'blog', 'impressum', 'agb', 'datenschutz', 'widerruf']
    }
  ];

  /* ------------------------------------------------------------------------
     Nachschlagen: von einem echten matten.de-Kategoriepfad zurueck auf den
     Menuepunkt. Die Kategorieseite baut damit ihre Brotkrumen, ohne die
     Struktur ein zweites Mal zu beschreiben.
     ---------------------------------------------------------------------- */
  function findeKategorie(dePfad) {
    var treffer = trefferZuPfad(dePfad);
    return treffer.length ? treffer[0] : null;
  }

  /* Alle Menuepunkte zu einem Kategoriepfad, der passendste zuerst.
     Die Liste oben ist so gepflegt, dass jeder Pfad nur einmal vorkommt —
     diese Funktion ist die Absicherung fuer den Fall, dass doch einmal
     zwei Punkte auf denselben Pfad zeigen. Dann gewinnt der Eintrag, der
     strukturell passt: der Unterpunkt, dessen Oberpunkt im Kategoriebaum
     ueber dem gesuchten Pfad steht (/was-ist-neu ueber
     /was-ist-neu/terrazzo). Erst danach zaehlt die Reihenfolge. */
  function trefferZuPfad(dePfad) {
    var gesucht = String(dePfad || '');
    if (!gesucht) return [];

    var alle = [];
    for (var i = 0; i < NAV.length; i++) {
      var o = NAV[i];
      if (o.kat === gesucht) alle.push({ ober: o, unter: null });
      var kinder = o.kinder || [];
      for (var k = 0; k < kinder.length; k++) {
        if (kinder[k].kat === gesucht) alle.push({ ober: o, unter: kinder[k] });
      }
    }
    if (alle.length < 2) return alle;

    return alle.slice().sort(function (a, b) {
      return (istUnterPfad(b) ? 1 : 0) - (istUnterPfad(a) ? 1 : 0);
    });
  }

  /* Steht der Oberpunkt des Treffers im Kategoriebaum wirklich ueber ihm? */
  function istUnterPfad(treffer) {
    if (!treffer.unter || !treffer.ober.kat || !treffer.unter.kat) return false;
    return String(treffer.unter.kat).indexOf(treffer.ober.kat + '/') === 0;
  }

  window.NET_NAV = NAV;
  window.NET_ROUTEN = ROUTEN;
  window.NET_FIRMA = FIRMA;
  window.NET_SPRACHEN = SPRACHEN;
  window.NET_FUSS = FUSS;
  window.NET_FINDE_KATEGORIE = findeKategorie;
  window.NET_TREFFER_KATEGORIE = trefferZuPfad;
})();
