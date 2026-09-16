/* ==========================================================================
   seite-produkt.js — Produktseite (produkt.html?slug=<netSlug>), Spec 8
   --------------------------------------------------------------------------
   Aussehen und Aufbau 1:1 wie matten.net (spec/screens/produkt-beispiel-*.html):
   Brotkrumen · #variety-images (Grossbild + Miniaturen) · .single-product-info
   mit .product-loading, <h2>, div.stars, #add_to_cart_form mit Farbfeldern
   (div.color-input-container), Auswahlattributen (select.attribute-select),
   section.order-form (Groesse · Breite/Laenge · Menge/Preis · Knoepfe),
   Reiter Beschreibung/Bewertungen.

   Daten:
     window.NET.produkte[slug]      matten.net-Produkt (Fixgroessen, Attribute,
                                    Preisstammdaten, Bilder, Beschreibung)
     window.NET.zuordnung[slug]     dePfad (Kaufartikel) / deZwilling ("-a")
     GET /api/produkt?pfad=…        Farben, Masse, Versand, Bilder des
                                    matten.de-Artikels (Kauf und Zwilling)
     berechne()  aus preisformel.js Preis — die EINZIGE Rechenstelle, plus
                                    mitSteuerUndVersand() weiter unten
     GET /api/price                 nur fuer Produkte ohne EK/m2 (pid 4, 12,
                                    26, 40): Live-Preis des Altsystems
     POST /api/cart/add             In den Warenkorb / Make an offer

   Kundenwuensche (UEBERGABE 7): Hinweis, in welche Richtung ein unmoegliches
   Mass geaendert werden muss (7.2); Endpreis inkl. MwSt. und Versand (7.3);
   Produktbild wechselt mit der Grundfarbe (7.5); Sonderform/Sonderfarbe als
   drei unaufdringliche Kreuze (7.6).

   Abbildung auf das Altsystem (Briefing 6, portiert aus public/net/…/seite-produkt.js):
     Make an offer          -> immer Anfrage: Zwilling mit spezialoption x/y,
                               sonst dePfad mit Kommentar-Praefix
     In den Warenkorb       -> Standardgroesse ohne Zuschlaege: dePfad mit
                               attribute[Standardgroesse]; Wunschmass/Sonderform/
                               Sonderfarbe: Zwilling (Anfrage), sonst dePfad mit
                               freien Massen, sonst naechste Standardgroesse
     Kommentar              -> immer die vollstaendige Kalkulation
   ========================================================================== */

import { berechne, runde, zahl, stammdatenFuer } from '../../../preisformel.js';

(function () {
  'use strict';

  var NET = window.NET || {};
  var S = window.Shell;
  var esc = S.esc;

  /* Formulargrenzen von matten.net (Spec 8.1) */
  var FORM = { minB: 40, maxB: 200, minL: 40, maxL: 700 };
  var ENTPRELLUNG = 70;   /* ms, Spec 8.2 */
  var UST_VORGABE = 19;   /* Regelsatz, falls der Artikel keinen nennt */

  /* Attributaufschlaege des Preisdienstes von matten.net, netto je Stueck
     (Spec 13.8): Diplomat "mit Kratzkante" (attributeValueId 1838) und
     Kokos natur "30mm" (166). Werden in mitSteuerUndVersand() addiert. */
  var ATTRIBUT_AUFSCHLAG = { '1838': 35.87, '166': 10.56 };

  var slug = S.param('slug', '');
  var P = (NET.produkte || {})[slug] || null;
  var Z = (NET.zuordnung || {})[slug] || null;

  var $name = document.getElementById('produkt-name');
  var $form = document.getElementById('add_to_cart_form');
  var $attr = document.getElementById('attribute-bereich');
  var $order = document.getElementById('order-form');
  var $bilder = document.getElementById('variety-images');
  var $meldung = document.getElementById('produkt-meldung');
  var $laden = document.querySelector('.product-loading');

  if (!P) {
    if ($name) $name.textContent = 'Produkt nicht gefunden';
    if ($meldung) $meldung.innerHTML = '<div class="alert alert-warning">Dieses Produkt gibt es nicht. <a href="products.html">Alle Produkte</a></div>';
    return;
  }

  /* ======================================================================
     1  Zustand
     ====================================================================== */
  var wahl = {
    groesse: null,          /* value des #input_fixed_size oder 'CUSTOM_ONLY'  */
    breite: 100, laenge: 100, menge: 1,
    farben: {},             /* de-Feldname -> gewaehlter Wert (Grundfarbe …)   */
    weitereDesign: [],      /* zusaetzliche Designfarben (Kontrollkaestchen)  */
    attribute: {},          /* matten.net formularname -> { value, label }    */
    sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false
  };
  var artikel = null;       /* matten.de-Kaufartikel (dePfad)                 */
  var zwilling = null;      /* matten.de-Anfrageartikel "-a" (deZwilling)     */
  var farbgruppen = [];     /* [{feld, name, optionen:[{wert, nummer, name, hex, muster}], gewaehlt}] */
  var stamm = null;         /* Stammdaten fuer berechne() + ustSatz/versand   */
  var livePreis = null;     /* letzter Live-Preis (Produkte ohne EK/m2)       */
  var lauf = 0;

  var einkaufBekannt = !!(P.preisdaten && P.preisdaten.einkaufProQm > 0);

  /* ======================================================================
     2  Rechnen — ausschliesslich berechne() und mitSteuerUndVersand()
     ====================================================================== */

  function stammdatenAufbauen() {
    var pd = P.preisdaten || {};
    var preis = (artikel && artikel.preis) || {};
    var st = null;
    if (einkaufBekannt) {
      st = stammdatenFuer({
        artikelnummer: P.artikelnummer,
        bezeichnung: P.name,
        colortype: 1,                                  /* Salesfactor je Produkt steht in salesfactorMehrfarbig */
        salesfactorMehrfarbig: pd.salesFactor,         /* matten.net-Salesfactor je Produkt (Spec 13.5) */
        ekListenpreisProQm: pd.einkaufProQm,           /* EK/m2 je Produkt (Spec 13.5) */
        standardbreiten: (pd.standardbreiten || []).slice()   /* Standardbreiten je Produkt (Spec 13.4) — steuert x1,25 */
        /* Mengenstaffel, Sonderform x1,3/x1,5, Sonderfarbe +68 EUR, TZ: Excel-Vorgabe (STAMMDATEN_VORGABE) */
      });
    }
    var versand = Number.isFinite(preis.versand) ? preis.versand : null;
    return {
      stammdaten: st,
      ustSatz: Number.isFinite(preis.ustSatz) ? preis.ustSatz : UST_VORGABE,
      versandBrutto: versand,                          /* null = Altsystem nennt keinen (reiner Anfrageartikel) */
      versandQuelle: Number.isFinite(preis.versand) ? 'Artikelseite matten.de' : 'nicht bekannt'
    };
  }

  /**
   * DIE EINZIGE RECHNUNG AUSSERHALB VON berechne().
   * ----------------------------------------------------------------------
   * Die Kalkulationstabelle kennt weder Umsatzsteuer noch Versand noch die
   * Attributaufschlaege von matten.net. Deshalb wird hier — und nur hier —
   *   1. der Attributaufschlag je Stueck (Spec 13.8) mit der Menge addiert,
   *   2. der Steuersatz des Artikels (preis.ustSatz, sonst 19 %) aufgeschlagen,
   *   3. der Versand einmal je Position addiert (preis.versand des
   *      Kaufartikels, brutto, wie das Altsystem ihn ausweist).
   * Gerundet wird mit runde() aus dem geprueften Modul.
   * Mit zusatz.bruttoBereits === true (Live-Preis des Altsystems, bereits
   * brutto) entfaellt Schritt 2.
   */
  function mitSteuerUndVersand(nettoGesamt, st, zusatz) {
    var z = zusatz || {};
    var aufschlag = runde((z.aufschlagJeStueck || 0) * (z.menge || 1), 2);   /* Spec 13.8: absolut je Stueck */
    var netto = runde(nettoGesamt + aufschlag, 2);
    var ust = z.bruttoBereits ? 0 : runde(netto * (st.ustSatz / 100), 2);
    var wareBrutto = runde(netto + ust, 2);
    var versandBrutto = Number.isFinite(st.versandBrutto) ? runde(st.versandBrutto, 2) : null;
    return {
      netto: netto, aufschlag: aufschlag, ustSatz: st.ustSatz, ust: ust, wareBrutto: wareBrutto,
      versandBrutto: versandBrutto,
      gesamtBrutto: versandBrutto == null ? null : runde(wareBrutto + versandBrutto, 2)
    };
  }

  /** Summe der Attributaufschlaege je Stueck fuer die gewaehlten Attributwerte. */
  function attributAufschlag() {
    var summe = 0;
    Object.keys(wahl.attribute).forEach(function (k) {
      var v = wahl.attribute[k] && wahl.attribute[k].value;
      if (v && ATTRIBUT_AUFSCHLAG[v]) summe += ATTRIBUT_AUFSCHLAG[v];
    });
    return summe;
  }

  /** Preis fuer die aktuelle Wahl — { ok, r, stueck, gesamt } oder { ok:false, grund }. */
  function preisFuer() {
    if (!stamm || !stamm.stammdaten) return { ok: false, grund: 'keine Stammdaten' };
    var r = berechne({
      breite: wahl.breite, laenge: wahl.laenge, menge: wahl.menge,
      sonderformOhneRand: wahl.sonderformOhneRand,
      sonderformMitRand: wahl.sonderformMitRand,
      sonderfarbe: wahl.sonderfarbe
    }, stamm.stammdaten);
    if (!r.ok) return { ok: false, r: r, grund: rat(r) };
    var aufschlag = attributAufschlag();
    return {
      ok: true, r: r,
      stueck: mitSteuerUndVersand(r.vkProStueckOhneEinmaliges, { ustSatz: stamm.ustSatz, versandBrutto: null }, { aufschlagJeStueck: aufschlag, menge: 1 }),
      gesamt: mitSteuerUndVersand(r.vkGesamt, stamm, { aufschlagJeStueck: aufschlag, menge: wahl.menge })
    };
  }

  /** Was der Kunde bei einem Fehler von berechne() lesen soll — mit Richtung. */
  function rat(r) {
    var k = stamm.stammdaten;
    if (r.code === 'ZU_SCHMAL') return 'Bitte ein größeres Maß wählen — jede Seite mindestens ' + zahl(k.minBreite, 0) + ' cm.';
    if (r.code === 'ZU_LANG') return 'Bitte ein kleineres Maß wählen — höchstens ' + zahl(k.maxLaenge, 0) + ' cm Länge.';
    if (r.code === 'ZU_BREIT') {
      return 'Bitte ein kleineres Maß wählen — eine Seite darf höchstens ' +
        zahl(k.standardbreiten[k.standardbreiten.length - 1], 0) + ' cm messen (Rollenbreite laut Kalkulation).';
    }
    if (r.code === 'EINGABE') return 'Bitte Breite und Länge als ganze Zentimeter eingeben.';
    return r.klartext || r.grund || 'Bitte das Maß prüfen.';
  }

  /* ======================================================================
     3  Lesen der Artikeldaten des Altsystems
     ====================================================================== */

  /** "40cm x 60cm", "130cm Breite (X) x 115cm Länge (Y…)", "85 cm* x 300 cm" -> {a, b} */
  function massAus(text) {
    var m = /(\d+(?:[.,]\d+)?)\s*cm[^x×\d]*[x×]\s*(\d+(?:[.,]\d+)?)\s*cm/i.exec(String(text || ''));
    if (!m) return null;
    return { a: Number(m[1].replace(',', '.')), b: Number(m[2].replace(',', '.')) };
  }

  /** Das Groessen-Auswahlfeld eines matten.de-Artikels (Optionen mit "N cm x N cm"). */
  function groessenFeld(a) {
    if (!a) return null;
    return (a.attribute || []).filter(function (x) {
      return x.typ !== 'farbwahl' && !/\[(x|y)\]$/.test(x.feld) && (x.optionen || []).some(function (o) { return massAus(o.wert); });
    })[0] || null;
  }

  /** Option des Groessenfelds, deren Zahlen zum Mass passen (in beiden Reihenfolgen). */
  function passendeGroesse(a, breite, laenge) {
    var f = groessenFeld(a);
    if (!f) return null;
    var o = (f.optionen || []).filter(function (x) {
      var m = massAus(x.wert);
      return m && ((m.a === laenge && m.b === breite) || (m.a === breite && m.b === laenge));
    })[0];
    return o ? { feld: f.feld, wert: o.wert } : null;
  }

  /** Freies Mass (x oder y): Zahlenfeld aus masse[] oder Auswahlfeld aus attribute[]. */
  function massfeld(a, achse) {
    if (!a) return null;
    var re = new RegExp('\\[' + achse + '\\]$');
    var z = (a.masse || []).filter(function (m) { return re.test(m.feld); })[0];
    if (z) return { feld: z.feld, typ: 'zahl', min: z.min, max: z.max };
    var w = (a.attribute || []).filter(function (x) { return re.test(x.feld) && (x.optionen || []).length; })[0];
    if (w) {
      return {
        feld: w.feld, typ: 'auswahl',
        optionen: w.optionen.map(function (o) {
          return { wert: o.wert, zahl: Number(String(o.wert).replace(/[^\d.,]/g, '').replace(',', '.')) };
        }).filter(function (o) { return Number.isFinite(o.zahl) && o.zahl > 0; })
      };
    }
    return null;
  }

  /** Option "Maßanfertigung" (o. ae.) des Groessenfelds, falls vorhanden. */
  function massanfertigungOption(a) {
    var f = groessenFeld(a);
    if (!f) return null;
    var o = (f.optionen || []).filter(function (x) { return /ma[ßs]anfertigung|sondergr/i.test(x.wert); })[0];
    return o ? { feld: f.feld, wert: o.wert } : null;
  }

  /** Farbgruppen (typ 'farbwahl') des Artikels mit Hexwert/Farbmuster. */
  function farbgruppenAus(a) {
    if (!a) return [];
    var bilder = (a.bilder || []).map(function (b) { return { pfad: b.bild, name: lesbar(b.original || b.bild) }; });
    return (a.attribute || []).filter(function (x) { return x.typ === 'farbwahl' && (x.optionen || []).length; })
      .map(function (x) {
        var optionen = x.optionen.filter(function (o) { return o.wert !== 'default'; }).map(function (o) {
          var wert = String(o.wert);
          var teile = farbTeile(wert);
          var nr = teile.nummer;
          var name = teile.name;
          var pal = nr ? NET.farben[nr] : null;
          /* Hexwert nur, wenn Nummer UND Name zur Palette passen (646 ist bei
             JetPrint "203-198-27", bei IRON-HORSE "black-pearl"). Doppelte
             Buchstaben zaehlen nicht: die Palette schreibt "Dunkelltürkis". */
          var passt = pal && (glatt(pal.name) === glatt(name) || eng(pal.name) === eng(name));
          var muster = bilder.filter(function (b) { return b.name.indexOf(wert.toLowerCase()) >= 0 && /_farboption/i.test(b.name); })[0];
          return {
            wert: wert, nummer: nr, name: name || wert,
            hex: passt ? pal.hex : null,
            muster: muster ? S.bild(muster.pfad) : null,
            titel: (nr ? nr + ' ' : '') + gross(name || wert)
          };
        });
        var gewaehlt = optionen.some(function (o) { return o.wert === x.gewaehlt; }) ? x.gewaehlt : (optionen[0] && optionen[0].wert);
        return { feld: x.feld, name: (x.name || 'Farbe').replace(/[,\s]+$/, ''), optionen: optionen, gewaehlt: gewaehlt };
      });
  }

  /**
   * Farbwert des Altsystems -> Nummer und Name. Drei Schreibweisen kommen vor:
   *   "601-zitronengelb"      JetPrint-Palette
   *   "IH-646-black-pearl"    IRON-HORSE (Kuerzel voran)
   *   "Anthrazit-200"         Diplomat (Name voran)
   */
  function farbTeile(wert) {
    var m;
    if ((m = /^[A-Za-z]{1,3}-(\d{3})-(.+)$/.exec(wert))) return { nummer: m[1], name: m[2].replace(/-/g, ' ') };
    if ((m = /^(\d{3})[-\s]+(.+)$/.exec(wert))) return { nummer: m[1], name: m[2].replace(/-/g, ' ') };
    if ((m = /^(.+?)[-\s]+(\d{3})$/.exec(wert))) return { nummer: m[2], name: m[1].replace(/-/g, ' ') };
    if ((m = /^(\d{3})$/.exec(wert))) return { nummer: m[1], name: '' };
    return { nummer: null, name: wert };
  }

  function lesbar(p) {
    var t = String(p || '');
    try { t = decodeURIComponent(t); } catch (e) { /* Rohpfad */ }
    return t.toLowerCase();
  }
  function glatt(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, ''); }
  function eng(s) { return glatt(s).replace(/(.)\1+/g, '$1'); }
  function gross(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

  /** Produktbild des Altsystems zur Farbe (Dateiname enthaelt den Farbwert). */
  function bildZurFarbe(a, wert) {
    if (!a || !wert) return null;
    var such = [wert.toLowerCase()];
    var name = farbTeile(wert).name.toLowerCase();
    if (name && name !== wert.toLowerCase()) such.push(name);
    for (var i = 0; i < such.length; i++) {
      var t = (a.bilder || []).filter(function (b) {
        var n = lesbar(b.original || b.bild);
        return n.indexOf(such[i]) >= 0 && !/_farboption/i.test(n);
      })[0];
      if (t) return S.bild(t.bild);
    }
    return null;
  }

  /* ======================================================================
     4  Markup
     ====================================================================== */

  function krumen() {
    var $k = document.getElementById('brotkrumen');
    if (!$k) return;
    var kat = (P.kategorien || []).map(function (s) { return NET.kategorien[s]; }).filter(Boolean)[0];
    $k.innerHTML = '<li class="breadcrumb-item">' +
      (kat ? '<a href="' + esc(kat.href) + '">' + esc(kat.name) + '</a>' : '<a href="products.html">Alle Produkte</a>') +
      '</li><li class="breadcrumb-item active">' + esc(P.name) + '</li>';
  }

  function bilderHTML() {
    var lokal = (P.bilder || []).slice();
    var haupt = artikel && S.bild(artikel.hauptbild);
    if (!lokal.length && haupt) lokal.push(haupt);   /* Produkt ohne eigenes matten.net-Bild: Hauptbild des Altsystems */
    var h = '';
    lokal.forEach(function (b, i) {
      h += '<div id="image-' + (i + 1) + '" class="product-image-container animated fadeIn' + (i === 0 ? ' active' : '') + '">' +
        '<img src="' + esc(b) + '" alt="image" width="512" height="340"></div>\n';
    });
    h += '<div id="image-farbe" class="product-image-container animated fadeIn"><img src="" alt="image" width="512" height="340"></div>\n';
    h += '<div class="row no-gutters pt-1" id="bild-nav">\n';
    lokal.forEach(function (b, i) {
      h += '<div class="col-4 col-lg-3"><a href="#" class="product-image-nav-item' + (i === 0 ? ' active' : '') + '" data-target="#image-' + (i + 1) + '">' +
        '<img src="' + esc(b) + '" alt="image" class="img-fluid" width="512" height="340"></a></div>\n';
    });
    h += '<div class="col-4 col-lg-3" id="bild-nav-farbe" hidden><a href="#" class="product-image-nav-item" data-target="#image-farbe">' +
      '<img src="" alt="image" class="img-fluid" width="512" height="340"></a></div>\n</div>';
    return h;
  }

  function farbContainerHTML(g, gi) {
    var aktuell = g.optionen.filter(function (o) { return o.wert === g.gewaehlt; })[0] || g.optionen[0];
    var id = 'color-collapse-' + (gi + 1);
    var h = '<div id="' + id + '" class="color-input-container ">\n' +
      '<label for="' + esc(g.name) + '">' + esc(g.name) + '</label>\n' +
      '<small id="color-attribute-' + gi + '">' + esc(aktuell ? aktuell.titel : '') + '</small>\n' +
      '<div id="attribute-input-' + gi + '">\n';
    g.optionen.forEach(function (o, i) {
      var iid = 'attribute-input-' + gi + '-' + i;
      var stil = o.hex ? ' style="background-color: ' + esc(o.hex) + '"'
        : o.muster ? ' class="color-muster" style="background-image: url(\'' + esc(o.muster) + '\')"'
        : ' class="color-unbekannt"';
      h += '<span class="color-input"><input id="' + iid + '" type="radio" name="attributes[' + gi + '][]" value="' + esc(o.wert) + '" ' +
        'data-title="' + esc(o.titel) + '" data-attribute-input data-selected-color-label="#color-attribute-' + gi + '" data-farbgruppe="' + gi + '"' +
        (o.wert === g.gewaehlt ? ' checked="checked"' : '') + '>' +
        '<label for="' + iid + '"' + stil + ' title="' + esc(gross(o.name)) + '">' + esc(o.nummer || o.name.slice(0, 3)) + '</label></span>\n';
    });
    h += '</div>\n<div class="row">\n<div class="col-7">\n';
    if (gi === 1) {
      h += '<div class="custom-control custom-checkbox">' +
        '<input type="checkbox" name="multiple_colors" class="custom-control-input" id="multiple_colors" data-target="#attribute-input-' + gi + '">' +
        '<label class="custom-control-label" for="multiple_colors">Weitere Designfarben auswählen</label></div>\n';
    }
    h += '</div>\n<div class="col">\n';
    if (g.optionen.length > 30) {
      h += '<div class="text-right"><button type="button" data-target="#' + id + '" class="btn btn-sm caps-normal btn-link p-0 color-collapse-button collapsed">' +
        '<span class="show-label">Mehr Farben Anzeigen</span><span class="hide-label">Weniger Farben</span></button></div>\n';
    }
    h += '</div>\n</div>\n</div>\n';
    return h;
  }

  function attributSelectHTML(a, i) {
    var id = 'attribute-input-' + i + '-' + i;
    return '<div class="form-row"><div class="col"><div class="form-group row">' +
      '<label for="' + id + '" class="col-sm-4 col-form-label">' + esc(a.beschriftung) + '</label>' +
      '<div class="col-sm-8"><select class="form-control attribute-select" id="' + id + '" name="' + esc(a.formularname) + '" data-attribut="' + esc(a.formularname) + '">' +
      (a.optionen || []).map(function (o) { return '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>'; }).join('') +
      '</select></div></div></div><div class="col"></div></div>\n';
  }

  /* Reihenfolge wie im Original: die Auswahlattribute nach ihrer Nummer,
     die Farbfelder an der ersten Luecke der Nummerierung (Diplomat: 0,1,2,
     Farbe, 4), sonst vor den Attributen (JetPrint: Farbe, Farbe). */
  function attributeHTML() {
    var attrs = (P.attribute || []).map(function (a) {
      return { a: a, nr: Number((/\[(\d+)\]/.exec(a.formularname) || [])[1]) };
    });
    var nummern = attrs.map(function (x) { return x.nr; });
    var luecke = 0;
    while (nummern.indexOf(luecke) >= 0) luecke++;
    var h = '';
    var farbenGesetzt = false;
    var farbenHTML = farbgruppen.map(farbContainerHTML).join('');
    attrs.forEach(function (x) {
      if (!farbenGesetzt && x.nr > luecke) { h += farbenHTML; farbenGesetzt = true; }
      h += attributSelectHTML(x.a, x.nr);
    });
    if (!farbenGesetzt) h += farbenHTML;
    return h;
  }

  /** Grenzen der freien Masse: Formular (Spec 8.1) und Altsystem, die strengere gilt. */
  function grenzen() {
    var ziel = zwilling || artikel;
    var x = massfeld(ziel, 'x');
    var y = massfeld(ziel, 'y');
    var g = { minB: FORM.minB, maxB: FORM.maxB, minL: FORM.minL, maxL: FORM.maxL };
    if (x && x.typ === 'zahl') { if (Number.isFinite(x.min)) g.minB = Math.max(g.minB, x.min); if (Number.isFinite(x.max)) g.maxB = Math.min(g.maxB, x.max); }
    if (y && y.typ === 'zahl') { if (Number.isFinite(y.min)) g.minL = Math.max(g.minL, y.min); if (Number.isFinite(y.max)) g.maxL = Math.min(g.maxL, y.max); }
    return g;
  }

  /** Gibt es fuer dieses Produkt einen Weg zum Wunschmass im Altsystem? */
  function wunschmassMoeglich() {
    return !!(zwilling || massfeld(artikel, 'x') || massfeld(artikel, 'y'));
  }

  function orderFormHTML() {
    var g = grenzen();
    var fix = P.fixgroessen || [];
    /* Bewusste Abweichung (LIESMICH): "Custom" auch, wenn matten.net keine
       customOption fuehrt, der matten.de-Artikel aber freie Masse kennt
       (JetPrint Premium 1-farbig, JetPrint light 1-farbig) — Kundenwunsch 7.1. */
    var custom = P.customOption || (wunschmassMoeglich() ? 'FIXED+CUSTOM_SIZE' : null);
    var h = '';
    if (fix.length) {
      h += '<div class="form-row"><div class="col"><div class="form-group row">' +
        '<label for="input_fixed_size" class="col-sm-4 col-form-label">Größe</label><div class="col-sm-8">' +
        '<select type="number" class="form-control" id="input_fixed_size" name="size_id">' +
        fix.map(function (f) {
          return '<option value="' + esc(f.sizeId) + '" data-price="' + (f.price != null ? esc(Number(f.price).toFixed(2)) : '') + '" data-width="' + esc(f.width) + '" data-length="' + esc(f.length) + '">' + esc(f.label) + '</option>';
        }).join('') +
        (custom ? '<option value="' + esc(custom) + '">Custom</option>' : '') +
        '</select></div></div></div><div class="col"></div></div>\n';
    }
    h += '<div class="form-row">\n' +
      '<div class="col" id="order_input_fixed_width"><div class="form-group row"><label for="input_fixed_width" class="col-sm-4 col-form-label">Breite</label><div class="col-sm-8">' +
      '<select class="form-control" id="input_fixed_width" name="fixed_width">' +
      (P.standardbreitenSelect || []).map(function (b) { return '<option value="' + b + '" data-width="' + b + '">' + b + '</option>'; }).join('') +
      '</select></div></div></div>\n' +
      '<div class="col" id="order_input_width"><div class="form-group row"><label for="input_width" class="col-sm-4 col-form-label">Breite</label><div class="col-sm-8"><div class="input-group">' +
      '<input type="number" class="form-control" id="input_width" placeholder="Width" data-toggle="tooltip" data-trigger="manual" data-product-size-input data-placement="top" ' +
      'title="Geben Sie bitte eine Breite zwischen ' + g.minB + ' cm und ' + g.maxB + ' cm ein." min="' + g.minB + '" max="' + g.maxB + '" value="' + esc(wahl.breite) + '" name="width">' +
      '<div class="input-group-append"><span class="input-group-text">cm</span></div></div>' +
      '<small class="mass-hinweis" id="hinweis-breite"></small></div></div></div>\n' +
      '<div class="col" id="order_input_length"><div class="form-group row"><label for="input_length" class="col-sm-4 col-form-label">Länge</label><div class="col-sm-8"><div class="input-group">' +
      '<input type="number" class="form-control" id="input_length" placeholder="Length" data-toggle="tooltip" data-trigger="manual" data-product-size-input data-placement="top" ' +
      'title="Geben Sie bitte eine Länge zwischen ' + g.minL + ' cm und ' + g.maxL + ' cm ein." min="' + g.minL + '" max="' + g.maxL + '" value="' + esc(wahl.laenge) + '" name="length">' +
      '<div class="input-group-append"><span class="input-group-text">cm</span></div></div>' +
      '<small class="mass-hinweis" id="hinweis-laenge"></small></div></div></div>\n' +
      '</div>\n';
    /* Kundenwunsch 7.6: Sonderform und Sonderfarbe als drei Kreuze (nicht auf matten.net) */
    if (einkaufBekannt) {
      h += '<div class="form-row sonder-kreuze"><div class="col">' +
        '<div class="custom-control custom-checkbox custom-control-inline"><input type="checkbox" class="custom-control-input" id="sonderform_ohne_rand"><label class="custom-control-label" for="sonderform_ohne_rand">Sonderform ohne Rand <small>(+30 %)</small></label></div>' +
        '<div class="custom-control custom-checkbox custom-control-inline"><input type="checkbox" class="custom-control-input" id="sonderform_mit_rand"><label class="custom-control-label" for="sonderform_mit_rand">Sonderform mit Rand <small>(+50 %)</small></label></div>' +
        '<div class="custom-control custom-checkbox custom-control-inline"><input type="checkbox" class="custom-control-input" id="sonderfarbe"><label class="custom-control-label" for="sonderfarbe">Sonderfarbe <small>(+68 € einmalig)</small></label></div>' +
        '</div></div>\n';
    }
    h += '<div class="form-row">\n' +
      '<div class="col"><div class="form-group row"><label for="input_quantity" class="col-sm-4 col-form-label">Menge</label><div class="col-sm-8">' +
      '<input type="number" class="form-control" id="input_quantity" placeholder="Quantity" value="1" name="quantity" min="1"></div></div></div>\n' +
      '<div class="col"><div class="form-group row"><label for="price" class="col-sm-4 col-form-label">Preis</label><div class="col-sm-8">' +
      '<div id="price"><div class="spinner-border" role="status" style="width: 1rem; height: 1rem;"><span class="sr-only">Loading...</span></div></div>' +
      '<small class="form-text text-muted"><span class="no-wrap">inkl. MWSt.</span></small>' +
      '<small class="form-text text-muted"><span class="no-wrap"><span id="shipping_cost"></span></span></small>' +
      '<small class="form-text" id="endpreis"></small>' +
      '<small id="weg-hinweis"></small>' +
      '</div></div></div>\n</div>\n' +
      '<div>' +
      '<button class="btn btn-primary" id="add-to-cart" value="CART" name="submit">In den Warenkorb</button> ' +
      '<button class="btn btn-secondary" id="add-to-inquiry" type="submit" name="submit" value="INQUIRY_CART">Make an offer</button>' +
      '</div>';
    return h;
  }

  /* ======================================================================
     5  Bedienung
     ====================================================================== */

  function formklasse(wert) {
    $form.classList.remove('custom_size', 'custom_length');
    if (wert === 'FIXED+CUSTOM_SIZE' || wert === 'CUSTOM_ONLY') $form.classList.add('custom_size');
    if (wert === 'FIXED+CUSTOM_LENGTH') $form.classList.add('custom_length');
  }

  function istWunschmass() {
    return wahl.groesse === 'FIXED+CUSTOM_SIZE' || wahl.groesse === 'CUSTOM_ONLY' || wahl.groesse === 'FIXED+CUSTOM_LENGTH';
  }

  function masseLesen() {
    var $b = document.getElementById('input_width');
    var $l = document.getElementById('input_length');
    var b = Number(String($b.value).replace(',', '.'));
    var l = Number(String($l.value).replace(',', '.'));
    wahl.breite = Number.isFinite(b) && $b.value !== '' ? b : null;
    wahl.laenge = Number.isFinite(l) && $l.value !== '' ? l : null;
  }

  /** Kundenwunsch 7.2: sagen, in welche Richtung es gehen muss. */
  function masseHinweise() {
    var g = grenzen();
    var hb = document.getElementById('hinweis-breite');
    var hl = document.getElementById('hinweis-laenge');
    var fehler = [];
    var pruefe = function (wert, min, max, was, $h) {
      var t = '';
      if (wert == null) t = was + ' bitte in ganzen Zentimetern eingeben.';
      else if (wert < min) t = was + ' mindestens ' + min + ' cm — bitte größer wählen.';
      else if (wert > max) t = was + ' höchstens ' + max + ' cm — bitte kleiner wählen.';
      if ($h) $h.textContent = t;
      if (t) fehler.push(t);
    };
    if (istWunschmass()) {
      pruefe(wahl.breite, g.minB, g.maxB, 'Breite', hb);
      pruefe(wahl.laenge, g.minL, g.maxL, 'Länge', hl);
    } else {
      if (hb) hb.textContent = '';
      if (hl) hl.textContent = '';
    }
    return fehler;
  }

  function verdrahten() {
    /* data-no-enter-submit: Enter in einem Feld schickt nichts ab. */
    $form.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && ev.target && /^(INPUT|SELECT)$/.test(ev.target.tagName)) ev.preventDefault();
    });
    $form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var knopf = ev.submitter || letzterKnopf;
      uebernehmen(knopf && knopf.id === 'add-to-inquiry' ? 'angebot' : 'kauf', false);
    });
    var letzterKnopf = null;
    $form.addEventListener('click', function (ev) {
      var k = ev.target.closest ? ev.target.closest('#add-to-cart, #add-to-inquiry') : null;
      if (k) letzterKnopf = k;
    });

    var uhr = null;
    var spaeter = function () { window.clearTimeout(uhr); uhr = window.setTimeout(neuRechnen, ENTPRELLUNG); };

    $form.addEventListener('change', function (ev) {
      var el = ev.target;
      if (el.id === 'input_fixed_size') {
        var opt = el.options[el.selectedIndex];
        wahl.groesse = el.value;
        formklasse(el.value);
        document.getElementById('input_quantity').value = '1';
        wahl.menge = 1;
        if (opt && opt.getAttribute('data-width') && opt.getAttribute('data-length')) {
          wahl.breite = Number(opt.getAttribute('data-width'));
          wahl.laenge = Number(opt.getAttribute('data-length'));
          document.getElementById('input_width').value = wahl.breite;
          document.getElementById('input_length').value = wahl.laenge;
        } else if (el.value === 'FIXED+CUSTOM_LENGTH') {
          var fw = document.getElementById('input_fixed_width');
          if (fw && fw.value) { wahl.breite = Number(fw.value); document.getElementById('input_width').value = wahl.breite; }
        }
        masseLesen();
        neuRechnen();
        return;
      }
      if (el.id === 'input_fixed_width') {
        wahl.breite = Number(el.getAttribute('data-width') || el.value);
        document.getElementById('input_width').value = wahl.breite;
        neuRechnen();
        return;
      }
      if (el.matches && el.matches('[data-farbgruppe]')) {
        var gi = Number(el.getAttribute('data-farbgruppe'));
        var g = farbgruppen[gi];
        if (el.type === 'checkbox') {
          wahl.weitereDesign = Array.prototype.map.call(document.querySelectorAll('#attribute-input-' + gi + ' input:checked'), function (x) { return x.value; });
          if (wahl.weitereDesign.length) wahl.farben[g.feld] = wahl.weitereDesign[0];
        } else {
          wahl.farben[g.feld] = el.value;
        }
        var o = g.optionen.filter(function (x) { return x.wert === wahl.farben[g.feld]; })[0];
        var $l = document.getElementById('color-attribute-' + gi);
        if ($l && o) $l.textContent = o.titel + (wahl.weitereDesign.length > 1 ? ' (+' + (wahl.weitereDesign.length - 1) + ')' : '');
        if (gi === 0) bildSetzen();
        if (!einkaufBekannt) spaeter();
        return;
      }
      if (el.id === 'multiple_colors') {
        /* Weitere Designfarben: aus den Radioknoepfen der Gruppe werden Kontrollkaestchen. */
        var ziel = document.querySelector(el.getAttribute('data-target'));
        if (ziel) {
          Array.prototype.forEach.call(ziel.querySelectorAll('input'), function (x) { x.type = el.checked ? 'checkbox' : 'radio'; });
          if (!el.checked) {
            wahl.weitereDesign = [];
            var gi2 = Number(ziel.id.replace('attribute-input-', ''));
            var g2 = farbgruppen[gi2];
            Array.prototype.forEach.call(ziel.querySelectorAll('input'), function (x) { x.checked = x.value === wahl.farben[g2.feld]; });
          }
        }
        return;
      }
      if (el.classList && el.classList.contains('attribute-select')) {
        wahl.attribute[el.getAttribute('data-attribut')] = { value: el.value, label: el.options[el.selectedIndex].text, beschriftung: el.closest('.form-group').querySelector('label').textContent };
        spaeter();
        return;
      }
      if (el.id === 'sonderform_ohne_rand') { wahl.sonderformOhneRand = el.checked; neuRechnen(); return; }
      if (el.id === 'sonderform_mit_rand') { wahl.sonderformMitRand = el.checked; neuRechnen(); return; }
      if (el.id === 'sonderfarbe') { wahl.sonderfarbe = el.checked; neuRechnen(); return; }
    });

    $form.addEventListener('input', function (ev) {
      var el = ev.target;
      if (el.id === 'input_width' || el.id === 'input_length') { masseLesen(); spaeter(); return; }
      if (el.id === 'input_quantity') {
        wahl.menge = Math.max(1, Math.min(999, Math.trunc(Number(el.value) || 1)));
        spaeter();
      }
    });

    /* Mehr Farben / Weniger Farben (CSS: .show-all zeigt alle Felder) */
    $form.addEventListener('click', function (ev) {
      var k = ev.target.closest ? ev.target.closest('.color-collapse-button') : null;
      if (!k) return;
      var box = document.querySelector(k.getAttribute('data-target'));
      if (!box) return;
      box.classList.toggle('show-all');
      k.classList.toggle('collapsed', !box.classList.contains('show-all'));
    });

    /* Miniaturen */
    $bilder.addEventListener('click', function (ev) {
      var a = ev.target.closest ? ev.target.closest('.product-image-nav-item') : null;
      if (!a) return;
      ev.preventDefault();
      bildAktiv(a.getAttribute('data-target'));
    });
  }

  function bildAktiv(ziel) {
    Array.prototype.forEach.call($bilder.querySelectorAll('.product-image-container'), function (c) { c.classList.toggle('active', '#' + c.id === ziel); });
    Array.prototype.forEach.call($bilder.querySelectorAll('.product-image-nav-item'), function (a) { a.classList.toggle('active', a.getAttribute('data-target') === ziel); });
  }

  /** Kundenwunsch 7.5: das Produktbild folgt der Grundfarbe. */
  function bildSetzen() {
    var g = farbgruppen[0];
    if (!g) return;
    var quelle = artikel && artikel.attribute.some(function (a) { return a.feld === g.feld; }) ? artikel : zwilling;
    var b = bildZurFarbe(quelle, wahl.farben[g.feld]) || bildZurFarbe(quelle === artikel ? zwilling : artikel, wahl.farben[g.feld]);
    var $c = document.querySelector('#image-farbe img');
    var $n = document.getElementById('bild-nav-farbe');
    if (!b || !$c || !$n) return;
    $c.src = b;
    $n.querySelector('img').src = b;
    var o = g.optionen.filter(function (x) { return x.wert === wahl.farben[g.feld]; })[0];
    $c.alt = P.name + (o ? ' in ' + o.titel : '');
    $n.hidden = false;
    bildAktiv('#image-farbe');
  }

  /* ======================================================================
     6  Preisanzeige
     ====================================================================== */

  function euroText(betrag) { return betrag == null ? '—' : '€ ' + zahl(betrag, 2); }

  function neuRechnen() {
    var $preis = document.getElementById('price');
    var $versand = document.getElementById('shipping_cost');
    var $end = document.getElementById('endpreis');
    var $weg = document.getElementById('weg-hinweis');
    var $kauf = document.getElementById('add-to-cart');
    if (!$preis) return;

    var fehler = masseHinweise();
    var w = weg('kauf');
    if ($weg) $weg.textContent = w.hinweis || '';
    if ($kauf) $kauf.disabled = false;

    if (fehler.length) {
      $preis.innerHTML = '<span class="preis-fehler">' + esc(fehler[0]) + '</span>';
      $versand.textContent = '';
      $end.textContent = '';
      if ($kauf) $kauf.disabled = true;
      return;
    }

    if (!einkaufBekannt) { livePreisHolen(); return; }

    var e = preisFuer();
    if (!e.ok) {
      $preis.innerHTML = '<span class="preis-fehler">' + esc(e.grund) + '</span>';
      $versand.textContent = '';
      $end.textContent = '';
      if ($kauf) $kauf.disabled = true;   /* "Make an offer" bleibt nutzbar */
      return;
    }
    $preis.textContent = euroText(e.gesamt.wareBrutto);
    $versand.textContent = e.gesamt.versandBrutto != null ? 'Plus ' + zahl(e.gesamt.versandBrutto, 2) + '€ Versandkosten' : 'Versand laut Angebot';
    $end.textContent = e.gesamt.gesamtBrutto != null ? 'Endpreis inkl. MwSt. und Versand: ' + euroText(e.gesamt.gesamtBrutto) : '';
  }

  /** Produkte ohne EK/m2 (pid 4, 12, 26, 40): Preis des Altsystems fuer die gewaehlte Variante. */
  function livePreisHolen() {
    var $preis = document.getElementById('price');
    var $versand = document.getElementById('shipping_cost');
    var $end = document.getElementById('endpreis');
    if (!artikel) { $preis.textContent = 'Preis derzeit nicht verfügbar'; return; }
    if (artikel.modus !== 'kauf') {
      $preis.textContent = 'Preis auf Anfrage'; $versand.textContent = ''; $end.textContent = '';
      livePreis = null;
      return;
    }
    var werte = werteFuer(artikel, false);
    var url = '/api/price?pfad=' + encodeURIComponent(artikel.pfad) + '&anzahl=' + encodeURIComponent(wahl.menge);
    Object.keys(werte).forEach(function (f) { url += '&' + encodeURIComponent(f) + '=' + encodeURIComponent(werte[f]); });
    var meiner = ++lauf;
    $preis.innerHTML = '<div class="spinner-border" role="status" style="width: 1rem; height: 1rem;"><span class="sr-only">Loading...</span></div>';
    S.hole(url).then(function (res) {
      if (meiner !== lauf) return;
      var d = res.d || {};
      if (!res.ok || !Number.isFinite(d.gesamt)) {
        $preis.innerHTML = '<span class="preis-fehler">Preis derzeit nicht verfügbar</span>';
        livePreis = null;
        return;
      }
      livePreis = d;
      var g = mitSteuerUndVersand(d.gesamt, { ustSatz: stamm.ustSatz, versandBrutto: Number.isFinite(d.versand) ? d.versand : stamm.versandBrutto }, { bruttoBereits: true });
      $preis.textContent = euroText(g.wareBrutto);
      $versand.textContent = g.versandBrutto != null ? 'Plus ' + zahl(g.versandBrutto, 2) + '€ Versandkosten' : '';
      $end.textContent = g.gesamtBrutto != null ? 'Endpreis inkl. MwSt. und Versand: ' + euroText(g.gesamtBrutto) : '';
    });
  }

  /* ======================================================================
     7  Warenkorb und Angebot
     ====================================================================== */

  function zuschlaege() { return wahl.sonderformOhneRand || wahl.sonderformMitRand || wahl.sonderfarbe; }

  /**
   * Der universelle Wunschmass-Artikel des Altsystems: JetPrint-Logomatte,
   * Anfragezwilling, Artikel 569 — x 20–200 cm und y 40–700 cm als freie
   * Zahlen (GET /api/produkt, 10.09.2026). Er nimmt jede Konfiguration auf,
   * die der eigene Artikel nicht als Feld tragen kann; das gemeinte Produkt
   * steht dann als erste Kommentarzeile ("ARTIKEL: …"). Der Artikel wird
   * erst geladen, wenn er gebraucht wird.
   */
  var UNIVERSAL = { pfad: '/logomatten/6300201-logomatte-a', artikelId: 569, x: { min: 20, max: 200 }, y: { min: 40, max: 700 } };
  var universalArtikel = null;

  /**
   * Kann der Artikel Breite b und Laenge l EXAKT als Felder aufnehmen?
   * x als freie Zahl innerhalb min/max oder als Auswahlfeld, das genau den
   * Wert enthaelt; y als freie Zahl innerhalb min/max. Achsentausch erlaubt,
   * wenn dadurch beide Werte passen. Liefert { ok, tausch }.
   */
  function nimmtMasse(a, b, l) {
    if (!a || !Number.isFinite(b) || !Number.isFinite(l)) return { ok: false };
    var x = massfeld(a, 'x');
    var y = massfeld(a, 'y');
    if (!x || !y) return { ok: false };
    var passt = function (f, wert) {
      if (f.typ === 'zahl') return (f.min == null || wert >= f.min) && (f.max == null || wert <= f.max);
      return f.optionen.some(function (o) { return o.zahl === wert; });
    };
    if (passt(x, b) && passt(y, l)) return { ok: true, tausch: false };
    if (passt(x, l) && passt(y, b)) return { ok: true, tausch: true };
    return { ok: false };
  }

  function nimmtUniversal(b, l) {
    var p = function (g, w) { return Number.isFinite(w) && w >= g.min && w <= g.max; };
    if (p(UNIVERSAL.x, b) && p(UNIVERSAL.y, l)) return { ok: true, tausch: false };
    if (p(UNIVERSAL.x, l) && p(UNIVERSAL.y, b)) return { ok: true, tausch: true };
    return { ok: false };
  }

  function kurzname(a) { return String((a && a.pfad) || '').split('/').pop(); }

  /**
   * Welcher Artikel des Altsystems bekommt die Position — und als was?
   * Regel "Zielartikel nach Faehigkeit": Standardgroesse ohne Zuschlaege geht
   * als Kauf auf dePfad. Braucht die Konfiguration freie Masse (Wunschmass,
   * Sonderform, Sonderfarbe, "Make an offer"), dann
   *   1. der eigene Zwilling, wenn er BEIDE Werte exakt aufnimmt,
   *   2. sonst der Kaufartikel selbst, wenn seine masse[]-Felder das koennen,
   *   3. sonst der universelle Wunschmass-Artikel 569.
   * Kein Mass wird stillschweigend auf einen anderen Wert gesetzt.
   *   art 'kauf'           Kaufartikel, Kauf
   *   art 'anfrage'        Anfrageartikel/Zwilling: landet im Anfragenkorb
   *   art 'angebotAufKauf' Kaufartikel, aber "Make an offer": Kommentar-Praefix
   */
  function weg(absicht) {
    if (!artikel) return { ziel: null, art: 'kauf', hinweis: '' };
    var b = wahl.breite, l = wahl.laenge;
    var std = passendeGroesse(artikel, b, l);
    var frei = absicht === 'angebot' || !std || zuschlaege() || artikel.modus === 'anfrage';

    if (!frei) return { ziel: artikel, art: 'kauf', standard: std, hinweis: '' };

    var grund = absicht === 'angebot' ? 'Die Anfrage'
      : zuschlaege() ? 'Sonderform/Sonderfarbe'
      : std ? 'Diese Position' : 'Wunschmaße';
    var m;
    if (zwilling && (m = nimmtMasse(zwilling, b, l)).ok) {
      return { ziel: zwilling, art: 'anfrage', freieMasse: true, tausch: m.tausch,
        hinweis: grund + ' übernehmen wir als Anfrage über ' + kurzname(zwilling) + ' — den berechneten Preis bestätigen wir im Angebot.' };
    }
    if ((m = nimmtMasse(artikel, b, l)).ok) {
      var art = artikel.modus === 'anfrage' ? 'anfrage' : (absicht === 'angebot' ? 'angebotAufKauf' : 'kauf');
      return { ziel: artikel, art: art, freieMasse: true, tausch: m.tausch,
        hinweis: art === 'anfrage' ? 'Dieser Artikel wird im Altsystem nur angefragt — den berechneten Preis bestätigen wir im Angebot.'
          : art === 'angebotAufKauf' ? 'Die Anfrage geht über ' + kurzname(artikel) + ' (als Angebot gekennzeichnet).'
          : zuschlaege() ? 'Sonderform/Sonderfarbe übernehmen wir im Kommentar zu ' + kurzname(artikel) + ' — den berechneten Preis bestätigen wir im Angebot.'
          : 'Wunschmaße gehen als Kauf mit freien Maßen über ' + kurzname(artikel) + ' — den Preis dafür rechnet das Altsystem selbst; unsere Kalkulation steht im Kommentar und wird bestätigt.' };
    }
    m = nimmtUniversal(b, l);
    return { ziel: universalArtikel || { pfad: UNIVERSAL.pfad, artikelId: UNIVERSAL.artikelId, attribute: [], masse: [] }, universal: true,
      art: 'anfrage', freieMasse: true, tausch: !!m.tausch,
      hinweis: grund + ' übernehmen wir als Anfrage über den Wunschmaß-Artikel ' + kurzname(UNIVERSAL) + ' (Artikel ' + UNIVERSAL.artikelId + ') — das Produkt steht im Kommentar, den berechneten Preis bestätigen wir im Angebot.' };
  }

  /**
   * Die Felder fuer POST /api/cart/add — nur Felder, die der Zielartikel kennt.
   * Liefert zusaetzlich Hinweise, was NICHT als Feld uebertragbar war.
   */
  function werteFuer(ziel, freieMasse, w) {
    var werte = {};
    var hinweise = [];
    if (!ziel) return werte;
    var bekannt = {};
    (ziel.attribute || []).forEach(function (a) { bekannt[a.feld] = a; });
    (ziel.masse || []).forEach(function (m) { bekannt[m.feld] = m; });

    /* Farben — nur Werte, die der Zielartikel selbst anbietet (der universelle
       Artikel 569 kennt z. B. keine IRON-HORSE-Farben; die stehen im Kommentar). */
    farbgruppen.forEach(function (g) {
      var wert = wahl.farben[g.feld];
      if (!wert || !bekannt[g.feld]) return;
      var kennt = (bekannt[g.feld].optionen || []).some(function (o) { return o.wert === wert; });
      if (kennt) werte[g.feld] = wert;
      else hinweise.push(g.name + ' ' + wert + ' kennt der Artikel ' + kurzname(ziel) + ' nicht — nur im Kommentar');
    });

    /* Auswahlattribute von matten.net: nur, wenn das Altsystem den Wert woertlich kennt */
    Object.keys(wahl.attribute).forEach(function (k) {
      var label = wahl.attribute[k].label;
      var treffer = (ziel.attribute || []).filter(function (a) {
        return a.typ !== 'farbwahl' && !/\[(x|y)\]$/.test(a.feld) && a !== groessenFeld(ziel) &&
          (a.optionen || []).some(function (o) { return o.wert === label; });
      })[0];
      if (treffer) werte[treffer.feld] = label;
    });

    /* Sonderform als Ausfuehrung des Altsystems (6300201-logomatte) */
    var ausf = (ziel.attribute || []).filter(function (a) { return /ausf[üu]hrung/i.test(a.name || '') && (a.optionen || []).length; })[0];
    if (ausf) {
      var re = wahl.sonderformMitRand ? /mit rand.*sonderform|sonderform.*mit rand/i : wahl.sonderformOhneRand ? /ohne rand.*sonderform|sonderform.*ohne rand/i : null;
      if (re) {
        var o = ausf.optionen.filter(function (x) { return re.test(x.wert); })[0];
        if (o) werte[ausf.feld] = o.wert;
      }
    }

    /* Groesse */
    if (w && w.standard && !freieMasse) {
      werte[w.standard.feld] = w.standard.wert;
    } else if (freieMasse) {
      /* Standardgroesse: die passende Option, wenn es sie gibt, sonst "Massanfertigung". */
      var std = passendeGroesse(ziel, wahl.breite, wahl.laenge) || massanfertigungOption(ziel);
      if (std) werte[std.feld] = std.wert;
      var x = massfeld(ziel, 'x');
      var y = massfeld(ziel, 'y');
      var b = wahl.breite, l = wahl.laenge;
      /* Der Zielartikel wurde nach seiner Faehigkeit gewaehlt (weg()); ein
         Achsentausch ist dann bereits entschieden — dieselbe Matte, gedreht. */
      if (w && w.tausch) { var t = b; b = l; l = t; }
      var setze = function (f, wert, was) {
        if (!f) return;
        if (f.typ === 'zahl') {
          /* Die Felder spezialoption[…][flaeche][x|y] (Kokos, Diplomat) fuehrt das
             Altsystem in Millimetern — Eingabe 90 landete als "90mm" (Warenkorb-
             zeile, geprueft 10.09.2026). Deshalb dort cm x 10. Die
             spezial-Felder bleiben in cm ("Mattengröße: 90cm × 120cm"). */
          var inMm = /\[flaeche\]/.test(f.feld);
          if ((f.min == null || wert >= f.min) && (f.max == null || wert <= f.max)) werte[f.feld] = String(inMm ? Math.round(wert * 10) : wert);
          else hinweise.push(was + ' ' + zahl(wert, 0) + ' cm außerhalb der Feldgrenzen von ' + kurzname(ziel) + ' — nur im Kommentar');
        } else {
          var o = f.optionen.filter(function (x) { return x.zahl === wert; })[0];
          if (o) werte[f.feld] = o.wert;
          else hinweise.push(was + ' ' + zahl(wert, 0) + ' cm ist keine Option von ' + kurzname(ziel) + ' (' + f.optionen.map(function (x) { return zahl(x.zahl, 0); }).join('/') + ') — nur im Kommentar');
        }
      };
      setze(x, b, 'Breite');
      setze(y, l, 'Länge');
    }
    werte.__hinweise = hinweise;
    return werte;
  }

  /** Der Kommentar: immer die vollstaendige Konfiguration samt Kalkulation. */
  function kommentarFuer(w, hinweise) {
    var t = [];
    /* Ueber den universellen Artikel 569: als erste Zeile das gemeinte Produkt. */
    if (w.universal) t.push('ARTIKEL: ' + P.name + ' (Zuordnung matten.de: ' + (Z ? Z.dePfad : '–') + ')');
    if (w.art === 'angebotAufKauf') t.push('ANGEBOT ANGEFORDERT (keine Bestellung)');
    if (!w.universal) t.push(P.name);
    /* Achsen ausgeschrieben: matten.net beschriftet "Laenge x Breite", das
       Altsystem "Breite x Laenge" — so ist es eindeutig. */
    t.push('Breite ' + zahl(wahl.breite, 0) + ' cm × Länge ' + zahl(wahl.laenge, 0) + ' cm' + (istWunschmass() ? ' (Wunschmaß)' : ''));
    t.push(zahl(wahl.menge, 0) + ' Stück');
    farbgruppen.forEach(function (g) {
      if (wahl.farben[g.feld]) t.push(g.name + ' ' + wahl.farben[g.feld]);
      if (g === farbgruppen[1] && wahl.weitereDesign.length > 1) t.push('weitere Designfarben ' + wahl.weitereDesign.slice(1).join(', '));
    });
    Object.keys(wahl.attribute).forEach(function (k) {
      var a = wahl.attribute[k];
      if (a.label) t.push(a.beschriftung + ': ' + a.label);
    });
    if (wahl.sonderformOhneRand) t.push('Sonderform ohne Rand (+30 %)');
    if (wahl.sonderformMitRand) t.push('Sonderform mit Rand (+50 %)');
    if (wahl.sonderfarbe) t.push('Sonderfarbe (+68 € einmalig)');
    if (einkaufBekannt) {
      var e = preisFuer();
      if (e.ok) {
        t.push('Kalkulation: netto je Stück ' + zahl(e.stueck.netto, 2) + ' € · netto gesamt ' + zahl(e.gesamt.netto, 2) + ' €' +
          (e.gesamt.gesamtBrutto != null ? ' · brutto inkl. Versand ' + zahl(e.gesamt.gesamtBrutto, 2) + ' €' : ' · brutto ' + zahl(e.gesamt.wareBrutto, 2) + ' €') +
          (e.r.faktorBreite > 1 ? ' · Sondermaß ×1,25' : '') +
          ' · Preisformel Excel (preisformel.js)');
      } else {
        t.push('Kalkulation: nicht möglich (' + e.grund + ') — bitte Angebot');
      }
    } else if (livePreis && Number.isFinite(livePreis.gesamt)) {
      t.push('Preis laut Altsystem: ' + zahl(livePreis.gesamt, 2) + ' € brutto');
    } else {
      t.push('Preis auf Anfrage');
    }
    (hinweise || []).forEach(function (h) { t.push(h); });
    return t.join(' · ').slice(0, 500);
  }

  function uebernehmen(absicht, bestaetigt) {
    var knopf = document.getElementById(absicht === 'angebot' ? 'add-to-inquiry' : 'add-to-cart');
    var w = weg(absicht);
    if (!w.ziel) { melde('<div class="alert alert-danger">Der Artikel des Altsystems ist nicht geladen — bitte die Seite neu laden.</div>'); return; }

    /* Universeller Wunschmass-Artikel: einmal laden (Feldnamen, Optionen), dann weiter. */
    if (w.universal && !universalArtikel) {
      S.knopfArbeitet(knopf, true);
      S.hole('/api/produkt?pfad=' + encodeURIComponent(UNIVERSAL.pfad)).then(function (res) {
        S.knopfArbeitet(knopf, false);
        if (!res.ok || !res.d.produkt) {
          melde('<div class="alert alert-danger">Der Wunschmaß-Artikel ' + esc(UNIVERSAL.pfad) + ' ließ sich nicht laden' + (res.d && res.d.fehler ? ': ' + esc(res.d.fehler) : '') + '.</div>');
          return;
        }
        universalArtikel = res.d.produkt;
        uebernehmen(absicht, bestaetigt);
      });
      return;
    }

    /* Gemischter Korb (Kontrakt): eine Anfrage macht den ganzen Korb zur Anfrage. */
    var korb = S.letzterKorb();
    var wirdAnfrage = w.art === 'anfrage' || w.art === 'angebotAufKauf';
    var kaufImKorb = korb && (korb.items || []).some(function (i) { return i.modus ? i.modus === 'kauf' : i.preisNum != null; });
    if (wirdAnfrage && kaufImKorb && !bestaetigt) {
      melde('<div class="alert alert-warning">Ihr Warenkorb wird damit zur Anfrage — die bereits enthaltenen Artikel werden nicht bestellt, sondern mit angefragt. ' +
        '<button type="button" class="btn btn-sm btn-warning" id="trotzdem">Trotzdem fortfahren</button> ' +
        '<button type="button" class="btn btn-sm btn-link" id="abbrechen">Abbrechen</button></div>');
      document.getElementById('trotzdem').addEventListener('click', function () { uebernehmen(absicht, true); });
      document.getElementById('abbrechen').addEventListener('click', function () { melde(''); });
      return;
    }

    var werte = werteFuer(w.ziel, !!w.freieMasse, w);
    var hinweise = werte.__hinweise || [];
    delete werte.__hinweise;
    var kommentar = kommentarFuer(w, hinweise);

    S.knopfArbeitet(knopf, true);
    melde('');
    S.sende('/api/cart/add', { pfad: w.ziel.pfad, anzahl: wahl.menge, werte: werte, kommentar: kommentar }).then(function (res) {
      S.knopfArbeitet(knopf, false);
      var d = res.d || {};
      if (!res.ok) {
        melde('<div class="alert alert-danger">' + esc(d.fehler || 'Das Altsystem hat die Position nicht angenommen.') + '</div>');
        return;
      }
      S.warenkorbAnzeigen(d);
      var h = '<div class="alert alert-success">' + (wirdAnfrage ? 'Als Anfrage übernommen' : 'In den Warenkorb gelegt') +
        (typeof d.count === 'number' ? ' — der Warenkorb enthält jetzt ' + d.count + (d.count === 1 ? ' Position.' : ' Positionen.') : '.') + '</div>';
      var abgelehnt = (d.abgelehnt || []).map(function (x) { return esc((x.feld || '') + ': ' + (x.grund || '')); });
      if (abgelehnt.length || hinweise.length) {
        h += '<div class="alert alert-warning"><strong>Nicht als Feld übernommen</strong> (steht im Kommentar der Position):<br>' +
          hinweise.map(esc).concat(abgelehnt).join('<br>') + '</div>';
      }
      melde(h);
      S.warenkorbOeffnen();
    });
  }

  function melde(html) { if ($meldung) $meldung.innerHTML = html || ''; }

  /* ======================================================================
     8  Start
     ====================================================================== */

  function aufbauen() {
    document.title = 'Mattenfuchs';
    krumen();
    $name.textContent = P.name;
    document.getElementById('product_id').value = P.productId;
    var $b = document.getElementById('beschreibung');
    if ($b) $b.innerHTML = P.beschreibung || '';

    stamm = stammdatenAufbauen();
    farbgruppen = farbgruppenAus(artikel && artikel.attribute.some(function (a) { return a.typ === 'farbwahl'; }) ? artikel : zwilling);
    farbgruppen.forEach(function (g) { wahl.farben[g.feld] = g.gewaehlt; });

    $bilder.innerHTML = bilderHTML();
    $attr.innerHTML = attributeHTML();
    $order.innerHTML = orderFormHTML();

    /* Vorbelegung wie das Original: erste Fixgroesse, sonst 100 x 100 (CUSTOM_ONLY). */
    var fix = P.fixgroessen || [];
    if (fix.length) {
      wahl.groesse = fix[0].sizeId;
      wahl.breite = fix[0].width;
      wahl.laenge = fix[0].length;
      document.getElementById('input_width').value = wahl.breite;
      document.getElementById('input_length').value = wahl.laenge;
      formklasse(wahl.groesse);
    } else {
      wahl.groesse = 'CUSTOM_ONLY';
      formklasse('CUSTOM_ONLY');
    }
    (P.attribute || []).forEach(function (a) {
      var sel = document.querySelector('select[data-attribut="' + a.formularname + '"]');
      if (sel) wahl.attribute[a.formularname] = { value: sel.value, label: sel.options[sel.selectedIndex].text, beschriftung: a.beschriftung };
    });

    verdrahten();
    bildSetzen();
    neuRechnen();
  }

  function laden() {
    if ($laden) { $laden.classList.remove('d-none'); $laden.classList.add('d-flex'); }
    var anfragen = [Z ? S.hole('/api/produkt?pfad=' + encodeURIComponent(Z.dePfad)) : Promise.resolve(null)];
    anfragen.push(Z && Z.deZwilling ? S.hole('/api/produkt?pfad=' + encodeURIComponent(Z.deZwilling)) : Promise.resolve(null));
    Promise.all(anfragen).then(function (r) {
      if (r[0] && r[0].ok && r[0].d.produkt) artikel = r[0].d.produkt;
      if (r[1] && r[1].ok && r[1].d.produkt) zwilling = r[1].d.produkt;
      if ($laden) { $laden.classList.add('d-none'); $laden.classList.remove('d-flex'); }
      if (Z && !artikel) {
        melde('<div class="alert alert-warning">Der Artikel des Altsystems (<code>' + esc(Z.dePfad) + '</code>) ließ sich nicht laden' +
          (r[0] && r[0].d && r[0].d.fehler ? ': ' + esc(r[0].d.fehler) : '') + '. Farben und Warenkorb sind deshalb nicht verfügbar; der Preis wird trotzdem berechnet.</div>');
      }
      aufbauen();
    });
  }

  laden();
})();
