/* ==========================================================================
   seite-designer.js — der Mattendesigner (mattendesigner.html), Spec 9
   --------------------------------------------------------------------------
   Nachbau der Vue-2-Komponente "mat-editor" von matten.net (/de/custom-mat/create,
   Quelle: assets/js/vue/matEditor.vue im Bundle app.f1a77904.js, gelesen am
   10.09.2026) in plain JS mit fabric.js (assets/js/vendor/fabric.min.js, lokal).
   Markup, Beschriftungen (Woerterbuch window.translations, Spec 9.2) und
   Verhalten (Spec 9.4) sind 1:1 — die Namen der Funktionen entsprechen denen
   der Vue-Komponente (createCanvas, loadMaterials, addBase, addSample,
   insertObject, getScale, selectObjectHandler …), damit sich beides
   nebeneinander lesen laesst.

   Daten:
     window.NET.mattendesigner   Materialien 1:1 aus /de/ajax/custom-mat-materials
                                 (id, name, description, price, colors[], sizes[]),
                                 dazu preisdaten (EK/m2, Salesfactor, Standardbreiten)
                                 und dePfad (Anfrageartikel des Altsystems);
                                 erzeugt von bau-net-daten.mjs
     window.translations         Woerterbuch der Seite (mattendesigner.html)
     berechne() aus preisformel.js  Preis — statt Flaeche x Materialpreis (Spec 9.5)

   Bewusste Abweichungen vom Original (Briefing Designer 3, LIESMICH.md):
     * Schriften lokal (assets/fonts/designer.css), geladen ueber document.fonts;
       schlaegt das fehl, steht der Originaltext als Hinweis in der Seite statt
       als window.alert — und die Zeichenflaeche wird trotzdem gebaut.
     * Preis ueber berechne() (Excel-Formel des Kunden) mit Stammdaten je Material;
       Anzeige brutto fuer die Menge, "inkl. MWSt. plus Versandkosten"; im Modal
       Preis (je Stueck) und Total in EUR statt GBP (Spec 17.6).
     * Format richtig herum: HORIZONTAL = Querformat, VERTICAL = Hochformat (Spec 17.5).
     * "Diese Matte ordern" im Modal schickt kein POST an /de/custom-mat/checkout,
       sondern legt das Design (JSON + PNG-Data-URL) in sessionStorage und ruft
       designer-checkout.html auf; dort geht es als Anfrageartikel ins Altsystem.
     * Drei Fehler der Vue-Komponente sind nicht nachgebaut: Ruecktaste beim
       Tippen in einer Textbox fragt nicht nach "delete this object"; die
       Buchstabenabstand-Anzeige landet nicht in "Line spacing" (Tippfehler im
       Original); das Woerterbuch-Feld label.please_check_spelling wird im Modal
       gezeigt (das Original rendert dort ein leeres <p>).
   ========================================================================== */

import { berechne, runde, zahl, stammdatenFuer } from '../../../preisformel.js';

(function () {
  'use strict';

  var NET = window.NET || {};
  var S = window.Shell;
  var esc = S.esc;
  var D = NET.mattendesigner || {};
  var fabric = window.fabric;

  var $editor = document.getElementById('mat-editor');
  if (!$editor) return;

  /* fabric 5.x (auch 5.3.0) setzt in Text._setTextStyles ctx.textBaseline =
     "alphabetical" — ein ungueltiger Wert, den der Browser bei jedem Rendern
     mit einer Konsolenwarnung verwirft (erst fabric 6 schreibt "alphabetic").
     Die Methode ist drei Zeilen lang und wird hier wortgleich, nur mit dem
     gueltigen Wert, ersetzt — statt die Vendor-Datei anzufassen. */
  if (fabric && fabric.Text && fabric.Text.prototype._setTextStyles) {
    fabric.Text.prototype._setTextStyles = function (ctx, charStyle, forMeasuring) {
      ctx.textBaseline = 'alphabetic';
      if (this.path) {
        switch (this.pathAlign) {
          case 'center': ctx.textBaseline = 'middle'; break;
          case 'ascender': ctx.textBaseline = 'top'; break;
          case 'descender': ctx.textBaseline = 'bottom'; break;
        }
      }
      ctx.font = this._getFontDeclaration(charStyle, forMeasuring);
    };
  }

  var BASIS_ID = 99999;                                /* id des Grundrechtecks (Original) */
  var UST_VORGABE = 19;                                /* der Anfrageartikel nennt keinen Satz */
  var SPEICHER_SCHLUESSEL = 'net-neu-designer-auftrag'; /* sessionStorage -> designer-checkout.html */
  var HINTERGRUND = D.hintergrund || 'assets/img/mat-editor-background.jpg';
  var BEISPIELBILD = D.beispielbild || 'assets/img/mattenfuchs_square.png';

  /* Woerterbuch wie getTranslation() im Original. */
  function t(key) {
    var w = window.translations || {};
    if (w[key]) return w[key];
    if (window.console) console.warn('Missing translation: ' + key);
    return key;
  }

  /* ======================================================================
     1  Zustand — die data() der Vue-Komponente
     ====================================================================== */
  var Z = {
    loading: false,
    colors: [], sizes: [], objects: [],
    fonts: (D.schriften && D.schriften.length) ? D.schriften.slice() : [
      { displayName: 'Amatic SC', fontFamily: 'Amatic SC' }, { displayName: 'Anton', fontFamily: 'Anton' },
      { displayName: 'Arial', fontFamily: 'Arimo' }, { displayName: 'Brush', fontFamily: 'Caveat Brush' },
      { displayName: 'Dancing Script', fontFamily: 'Dancing Script' }, { displayName: 'Finger Paint', fontFamily: 'Finger Paint' },
      { displayName: 'Ubuntu', fontFamily: 'Ubuntu' }, { displayName: 'Vast Shadow', fontFamily: 'Vast Shadow' }
    ],
    lastId: 0,
    materials: [],
    selectedObject: null,
    selectedColor: null, selectedStrokeColor: null, selectedStrokeWidth: 1,
    selectedTextAlign: 'left', selectedLineHeight: 0, selectedLetterSpacing: 1,
    selectedFontFamily: { displayName: 'Ubuntu', fontFamily: 'Ubuntu' },
    selectedFontWeight: 'normal',
    dataURL: null,
    specification: { material: null, size: null, orientation: 'HORIZONTAL', notes: null, quantity: 1, baseColor: null },
    canvasSize: { width: 800, height: 450 }
  };
  var canvas = null;   /* die fabric.Canvas (im Original das Modul-globale R) */

  var $ = function (id) { return document.getElementById(id); };

  function istTextbox(o) { return !!(o && o.type === 'textbox'); }
  function isBaseSelected() { return !!(Z.selectedObject && Z.selectedObject.id === BASIS_ID); }
  function allowSubmit() {
    var s = Z.specification;
    return !!(s.material && s.size && s.quantity && s.orientation && s.baseColor);
  }
  function mengeZahl() {
    var n = Number(Z.specification.quantity);
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
  }

  /* ======================================================================
     2  Rechnen — ausschliesslich berechne() und mitSteuerUndVersand()
     ====================================================================== */

  /**
   * KOPIE von mitSteuerUndVersand() aus seite-produkt.js (dort innerhalb der
   * IIFE, nicht exportiert; die Datei wird parallel bearbeitet — offener Punkt
   * "zusammenfuehren" in LIESMICH.md). Wortgleich bis auf diesen Kommentar.
   * ----------------------------------------------------------------------
   * DIE EINZIGE RECHNUNG AUSSERHALB VON berechne(): Attributaufschlag je Stueck,
   * Steuersatz des Artikels (sonst 19 %), Versand einmal je Position. Der
   * Anfrageartikel nennt keinen Versand -> versandBrutto null -> gesamtBrutto
   * null; die Seite sagt deshalb "plus Versandkosten" (wie das Original).
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

  /** Stammdaten fuer berechne() je Material (Briefing 3.2, in daten.js hinterlegt). */
  function stammdatenFuerMaterial(m) {
    var pd = (m && m.preisdaten) || {};
    return stammdatenFuer({
      bezeichnung: m ? m.name : 'Mattendesigner',
      colortype: 1,                                           /* Salesfactor steht in salesfactorMehrfarbig */
      salesfactorMehrfarbig: pd.salesFactor,
      ekListenpreisProQm: pd.einkaufProQm,
      standardbreiten: (pd.standardbreiten || [60, 75, 85, 115, 150, 200]).slice()
      /* Mengenstaffel, Sonderform, Sonderfarbe, TZ: Excel-Vorgabe (STAMMDATEN_VORGABE) */
    });
  }

  /**
   * Preis der aktuellen Wahl: { ok, r, stueck, gesamt } — brutto fuer die Menge
   * (wareBrutto), Versand nicht enthalten. Menge 0/leer -> 0,00 wie im Original
   * (dort price * quantity).
   */
  function preisFuer() {
    var m = Z.specification.material, s = Z.specification.size;
    if (!m || !s) return { ok: false, grund: '' };
    var menge = mengeZahl();
    if (menge < 1) return { ok: true, leer: true, r: null, stueck: { netto: 0, wareBrutto: 0 }, gesamt: { netto: 0, ust: 0, wareBrutto: 0, ustSatz: UST_VORGABE } };
    var r = berechne({ breite: s.width, laenge: s.height, menge: menge }, stammdatenFuerMaterial(m));
    if (!r.ok) return { ok: false, r: r, grund: r.klartext || r.grund || 'Preis nicht berechenbar' };
    var st = { ustSatz: UST_VORGABE, versandBrutto: null };
    return {
      ok: true, r: r,
      stueck: mitSteuerUndVersand(r.vkProStueckOhneEinmaliges, st, { menge: 1 }),
      gesamt: mitSteuerUndVersand(r.vkGesamt, st, { menge: menge })
    };
  }

  function euroText(betrag) { return betrag == null ? '—' : '€ ' + zahl(betrag, 2); }

  /* ======================================================================
     3  Markup (1:1 nach dem gerenderten DOM von matten.net, Spec 9.3)
     ====================================================================== */

  function werkzeug(id, icon, label, zusatz) {
    return '<li class="list-group-item mat-editor-tool-button" id="' + id + '"><i class="fas ' + icon + '"></i>\n' +
      '                ' + esc(label) + '\n              ' + (zusatz || '') + '</li>\n';
  }

  function farbmenue(gruppe) {
    return '<div class="dropdown">\n' +
      '<button type="button" data-toggle="dropdown" class="btn btn-light dropdown-toggle" id="farbknopf-' + gruppe + '"><span>Color</span></button>\n' +
      '<div class="dropdown-menu p-2">\n<div class="colors" id="farben-' + gruppe + '"></div>\n</div>\n</div>\n';
  }

  function baueEditor() {
    return '<div class="mt-2 mat-editor">\n' +
      /* Ladeschicht (loading), Spec 9.3 — Inline-Stile wie im Original */
      '<div class="d-flex justify-content-center p-5" id="editor-laden" style="position: absolute; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.7); z-index: 999;">' +
      '<div class="spinner-border" role="status" style="width: 6rem; height: 6rem;"><span class="sr-only">Loading...</span></div></div>\n' +
      '<div class="alert alert-danger schrift-hinweis" role="alert" id="schrift-hinweis"></div>\n' +
      '<div class="row">\n' +

      /* --- linke Spalte --------------------------------------------------- */
      '<section class="col-lg-2 col-md-1">\n' +
      '<button type="button" data-toggle="modal" data-target="#helpModal" class="btn btn-block btn-secondary">\n                Help <i class="fas fa-question-circle"></i></button>\n' +
      '<aside>\n<ul class="list-group mt-2">\n' +
      werkzeug('werkzeug-neu', 'fa-file', t('label.new_design')) +
      werkzeug('werkzeug-text', 'fa-font', t('label.add_text')) +
      werkzeug('werkzeug-rechteck', 'fa-square', t('label.add_rectangle')) +
      werkzeug('werkzeug-kreis', 'fa-circle', t('label.add_circle')) +
      werkzeug('werkzeug-bild', 'fa-image', t('label.add_image'), '<input accept="image/jpeg, image/gif, image/png" type="file" class="d-none" id="bild-datei">') +
      '</ul>\n</aside>\n' +
      '<aside class="mt-2">\n<strong>\n              ' + esc(t('label.design_elements')) + '\n            </strong>\n' +
      '<ul class="list-group" id="objekte"></ul>\n</aside>\n' +
      '<aside class="mt-2" id="loeschen-bereich"></aside>\n' +
      '</section>\n' +

      /* --- mittlere Spalte ------------------------------------------------ */
      '<section class="col-lg-7 col-md-8">\n<div class="card">\n<div class="card-body pt-1" style="max-width: 100%; width: 100%;">\n' +
      '<div class="form-inline">\n<div class="form-row">\n' +
      '<div class="form-group">\n<label for="material">\n                        ' + esc(t('label.select_material')) + '\n                      </label>\n<select id="material" class="custom-select"></select>\n</div>\n' +
      '<div class="form-group">\n<label for="size">\n                        ' + esc(t('label.select_size')) + '\n                      </label>\n<select id="size" class="custom-select"></select>\n</div>\n' +
      /* "Format" steht fest im Template (Spec 9.3). HORIZONTAL zeichnet die lange
         Seite waagerecht (addBase) — deshalb hier Querformat, VERTICAL Hochformat
         (im Original vertauscht, Spec 17.5). */
      '<div class="form-group">\n<label for="orientation">\n                        Format\n                      </label>\n' +
      '<select id="orientation" class="custom-select">\n' +
      '<option value="HORIZONTAL">' + esc(t('label.horizontal')) + '</option>\n' +
      '<option value="VERTICAL">' + esc(t('label.portrait')) + '</option>\n' +
      '</select>\n</div>\n' +
      '</div>\n</div>\n' +
      '<div class="form-inline">\n<div class="form-row">\n<div class="form-group">\n' +
      '<label for="quantity">\n                        ' + esc(t('label.quantity')) + '\n                      </label>\n' +
      '<input id="quantity" type="number" size="2" max="100" class="form-control" style="max-width: 5em;" value="1">\n' +
      '<span id="preis-bereich"></span>\n' +
      '</div>\n</div>\n</div>\n' +
      '<section id="canvas-container" tabindex="-1">\n' +
      '<canvas height="450" id="canvas" width="800" style="border: 1px solid #ced4da; width: 800px; height: 450px;"></canvas>\n' +
      '</section>\n' +
      '<section>\n<div class="form-group">\n<label for="notes">\n                      ' + esc(t('label.notes')) + '\n                    </label>\n' +
      '<textarea id="notes" rows="4" class="form-control"></textarea>\n</div>\n' +
      '<button data-target="#custom-mat-order-modal" data-toggle="modal" class="btn btn-primary mt-2" id="ordern" disabled>\n                    ' + esc(t('label.order_this_mat')) + '\n                  </button>\n' +
      '</section>\n' +
      '<section id="material-beschreibung"></section>\n' +
      '</div>\n</div>\n</section>\n' +

      /* --- rechte Spalte: Design-details ---------------------------------- */
      '<section class="col-lg-3">\n<div class="card">\n<div class="card-header">\n<strong>' + esc(t('label.attributes')) + '</strong>\n</div>\n' +
      '<div class="card-body form-inline form-inline-label-lg" id="details">\n' +
      '<div class="form-row">\n<label>' + esc(t('label.base_color')) + '</label>\n' + farbmenue('basis') + '</div>\n' +
      '<div class="form-row">\n<label>\n                  ' + esc(t('label.design_color')) + '\n                </label>\n' + farbmenue('design') + '</div>\n' +
      '<div class="form-row">\n<label>\n                  ' + esc(t('label.stroke_color')) + '\n                </label>\n' + farbmenue('linie') + '</div>\n' +
      '<div class="form-row">\n<label for="strokeWidth">\n                  ' + esc(t('label.stroke_width')) + '\n                </label>\n' +
      '<input id="strokeWidth" max="999" type="number" class="form-control" style="max-width: 4em;">\n</div>\n' +
      '<div class="form-row">\n<label>\n                  ' + esc(t('label.position')) + '\n                </label>\n<div>\n' +
      '<button class="btn btn-sm btn-secondary utility-button" id="nach-oben" type="button"><i class="fas fa-chevron-up"></i></button>\n' +
      '<button class="btn btn-sm btn-secondary utility-button" id="nach-unten" type="button"><i class="fas fa-chevron-down"></i></button>\n' +
      '</div>\n</div>\n' +
      '<section>\n' +
      '<div class="form-row">\n<label for="font-weight">' + esc(t('label.font_weight')) + '</label>\n' +
      '<select id="font-weight" disabled class="custom-select">\n<option value="normal">' + esc(t('label.normal')) + '</option>\n<option value="bold">' + esc(t('label.bold')) + '</option>\n</select>\n</div>\n' +
      '<div class="form-row">\n<label>\n                    ' + esc(t('label.font')) + '\n                  </label>\n<div class="dropdown">\n' +
      '<button disabled data-toggle="dropdown" type="button" class="btn btn-light dropdown-toggle" id="schrift-knopf" style="font-family: Ubuntu;">\n                      Ubuntu\n                    </button>\n' +
      '<div class="dropdown-menu dropdown-menu-left" id="schrift-menue">\n' +
      Z.fonts.map(function (f, i) {
        return '<a class="dropdown-item" href="#" data-font="' + i + '" style="font-family: ' + esc(cssFamilie(f.fontFamily)) + ';">' + esc(f.displayName) + '</a>\n';
      }).join('') +
      '</div>\n</div>\n</div>\n' +
      '<div class="form-row">\n<label for="lineHeight">\n                    ' + esc(t('label.line_height')) + '\n                  </label>\n' +
      '<input id="lineHeight" disabled max="999" type="number" step="0.1" class="form-control" style="max-width: 5rem;">\n</div>\n' +
      '<div class="form-row">\n<label for="letterSpacing">\n                    ' + esc(t('label.letter_spacing')) + '\n                  </label>\n' +
      '<input id="letterSpacing" disabled max="9999" type="number" step="10" class="form-control" style="max-width: 5em;">\n</div>\n' +
      '<div class="form-row">\n<label for="strokeWidth">\n                    ' + esc(t('label.text_align')) + '\n                  </label>\n' +
      '<div class="btn-group btn-group-toggle" id="text-align">\n' +
      ['left', 'center', 'right'].map(function (a) {
        return '<label class="btn btn-secondary' + (a === 'left' ? ' active' : '') + '"><input type="radio" name="textAlign" value="' + a + '" disabled' + (a === 'left' ? ' checked' : '') + '><i class="fas fa-align-' + a + '"></i></label>\n';
      }).join('') +
      '</div>\n</div>\n' +
      '</section>\n' +
      '</div>\n</div>\n</section>\n' +
      '</div>\n' +

      /* --- Bestellmodal (Spec 9.3), im Original nur gerendert, wenn allowSubmit — */
      '<div aria-hidden="true" aria-labelledby="custom-mat-order-modalLabel" id="custom-mat-order-modal" role="dialog" tabindex="-1" class="modal fade">\n' +
      '<div role="document" class="modal-dialog modal-lg">\n<div class="modal-content">\n' +
      '<div class="modal-header">\n<h5 id="custom-mat-order-modalLabel" class="modal-title">' + esc(t('title.order_custom_mat')) + '</h5>\n' +
      '<button aria-label="Close" data-dismiss="modal" type="button" class="close"><span aria-hidden="true">×</span></button>\n</div>\n' +
      '<div class="modal-body">\n' +
      /* Das Original rendert hier ein leeres <p>; der Woerterbuchtext war offensichtlich dafuer gedacht. */
      '<p>' + esc(t('label.please_check_spelling')) + '</p>\n' +
      '<div class="text-center">\n<img alt="preview" id="matDisplay" style="max-width: 100%; height: auto;">\n</div>\n' +
      '<table class="table mt-4">\n' +
      '<tr><th>Material</th><td id="modal-material"></td></tr>\n' +
      '<tr><th>' + esc(t('label.size')) + '</th><td id="modal-groesse"></td></tr>\n' +
      '<tr><th>' + esc(t('label.quantity')) + '</th><td id="modal-menge"></td></tr>\n' +
      '<tr><th>' + esc(t('label.color')) + '</th><td id="modal-farbe"></td></tr>\n' +
      '<tr><th>' + esc(t('label.price')) + '</th><td id="modal-preis"></td></tr>\n' +
      '<tr><th>' + esc(t('label.total')) + '</th><td id="modal-total"></td></tr>\n' +
      '<tr><th>' + esc(t('label.notes')) + '</th><td id="modal-notes"></td></tr>\n' +
      '</table>\n<div id="modal-hinweis"></div>\n</div>\n' +
      '<div class="modal-footer">\n' +
      '<button data-dismiss="modal" type="button" class="btn btn-secondary">Close</button>\n' +
      '<form action="' + esc(window.submitURL || 'designer-checkout.html') + '" method="post" id="modal-form">\n' +
      '<button type="submit" class="btn btn-primary" id="modal-ordern">' + esc(t('label.order_this_mat')) + '</button>\n' +
      '<input name="mat_image" type="hidden">\n<input name="mat_material" type="hidden">\n<input name="mat_width" type="hidden">\n' +
      '<input name="mat_height" type="hidden">\n<input name="mat_quantity" type="hidden">\n<input name="mat_notes" type="hidden">\n' +
      '<input name="mat_notes" type="hidden">\n<input value="true" name="mat_submit" type="hidden">\n' +
      '</form>\n</div>\n</div>\n</div>\n</div>\n' +
      '</div>\n';
  }

  /* Schriftnamen mit Leerzeichen in Anfuehrungszeichen (wie Vue sie rendert). */
  function cssFamilie(name) { return /\s/.test(name) ? '"' + name + '"' : name; }

  /* ======================================================================
     4  Dynamische Teile: Auswahl, Objektliste, Details, Preis, Modal
     ====================================================================== */

  function zeichneMaterialauswahl() {
    var $m = $('material');
    $m.innerHTML = Z.materials.map(function (m) {
      return '<option value="' + esc(m.id) + '">' + esc(m.name) + '</option>';
    }).join('');
    if (Z.specification.material) $m.value = String(Z.specification.material.id);
    zeichneGroessenauswahl();
    $('orientation').value = Z.specification.orientation;
  }

  /* Groessen als "<height>cm x <width>cm" — so ist das Original (Spec 9.3). */
  function zeichneGroessenauswahl() {
    var $s = $('size');
    $s.innerHTML = Z.sizes.map(function (s) {
      return '<option value="' + esc(s.id) + '">' + esc(s.height + 'cm x ' + s.width + 'cm') + '</option>';
    }).join('');
    if (Z.specification.size) $s.value = String(Z.specification.size.id);
  }

  function zeichneBeschreibung() {
    var m = Z.specification.material;
    $('material-beschreibung').innerHTML = m ? '<p><em>' + esc(m.description || '') + '</em></p>' : '';
  }

  /* Die drei Farbmenues (Grundfarbe, Design-Farbe, Linienfarbe): Kacheln der
     Materialfarben, Farbcode als Beschriftung. */
  function zeichneFarbmenues() {
    ['basis', 'design', 'linie'].forEach(function (g) {
      $('farben-' + g).innerHTML = Z.colors.map(function (c, i) {
        return '<div class="color" data-gruppe="' + g + '" data-index="' + i + '" style="background-color: ' + esc(c.RGBColor) + ';">' +
          '<span class="color-label"><strong>' + esc(c.code) + '</strong></span></div>';
      }).join('');
    });
  }

  function farbknopf(gruppe, farbe) {
    var k = $('farbknopf-' + gruppe);
    /* Im Original zeigen alle drei Knoepfe "Color", solange keine Grundfarbe gesetzt ist. */
    k.innerHTML = (Z.specification.baseColor && farbe)
      ? '<span><span class="color-sample" style="background-color: ' + esc(farbe.RGBColor) + ';"></span> ' + esc(farbe.code + ' ' + farbe.name) + '</span>'
      : '<span>Color</span>';
    Array.prototype.forEach.call(document.querySelectorAll('#farben-' + gruppe + ' .color'), function (el) {
      el.classList.toggle('active', !!farbe && Z.colors[Number(el.getAttribute('data-index'))] === farbe);
    });
  }

  /* Design-details: Werte und Sperren nach Spec 9.3 (Tabelle "Deaktiviert wenn"). */
  function zeichneDetails() {
    farbknopf('basis', Z.specification.baseColor);
    farbknopf('design', Z.selectedColor);
    farbknopf('linie', Z.selectedStrokeColor);
    var basis = isBaseSelected();
    var text = istTextbox(Z.selectedObject);
    $('strokeWidth').value = Z.selectedStrokeWidth;
    $('strokeWidth').disabled = basis;
    $('nach-oben').disabled = basis;
    $('nach-unten').disabled = basis;
    $('font-weight').value = Z.selectedFontWeight;
    $('font-weight').disabled = !text;
    var sk = $('schrift-knopf');
    sk.textContent = Z.selectedFontFamily.displayName;
    sk.style.fontFamily = cssFamilie(Z.selectedFontFamily.fontFamily);
    sk.disabled = !text;
    $('lineHeight').value = Z.selectedLineHeight;
    $('lineHeight').disabled = !text;
    $('letterSpacing').value = Z.selectedLetterSpacing;
    $('letterSpacing').disabled = !text;
    Array.prototype.forEach.call(document.querySelectorAll('#text-align label'), function (l) {
      var r = l.querySelector('input');
      r.disabled = !text;
      r.checked = r.value === Z.selectedTextAlign;
      l.classList.toggle('active', r.value === Z.selectedTextAlign);
    });
  }

  function objektEintrag(o) {
    var icon, label;
    if (o.id === BASIS_ID) { icon = 'fa-file'; label = t('label.base_rect'); }
    else if (o.type === 'rect') { icon = 'fa-square'; label = t('label.rectangle'); }
    else if (o.type === 'circle') { icon = 'fa-circle'; label = t('label.circle'); }
    else if (o.type === 'textbox') { icon = 'fa-font'; label = t('label.text'); }
    else if (o.type === 'image') { icon = 'fa-image'; label = t('label.image'); }
    else return '';
    return '<span title="' + esc(label) + '"><i class="fas ' + icon + '"></i> ' + esc(label) + '</span>';
  }

  /* Designelemente: ein Eintrag je Objekt in Z.objects (Reihenfolge wie das
     Original: Einfuegen haengt an, updateBase() haengt das Grundrechteck neu an). */
  function zeichneObjektliste() {
    $('objekte').innerHTML = Z.objects.map(function (o) {
      var aktiv = Z.selectedObject && Z.selectedObject.id === o.id;
      return '<li class="list-group-item mat-editor-object-button' + (aktiv ? ' active' : '') + '" data-id="' + esc(o.id) + '">' + objektEintrag(o) + '</li>\n';
    }).join('');
    $('loeschen-bereich').innerHTML = Z.selectedObject
      ? '<button class="btn btn-sm btn-secondary utility-button" id="loeschen" type="button"' + (isBaseSelected() ? ' disabled' : '') + '><i class="fas fa-trash"></i>\n              ' + esc(t('label.delete_object')) + '\n            </button>'
      : '';
  }

  /* Preis neben der Menge: <strong>EUR</strong> <em>inkl. MWSt. plus Versandkosten</em>,
     nur wenn Material und Groesse gesetzt sind (wie im Original). */
  function zeichnePreis() {
    var s = Z.specification;
    var el = $('preis-bereich');
    if (!s.material) { el.innerHTML = ''; return; }
    if (!s.size) { el.innerHTML = '<span></span>'; return; }
    var p = preisFuer();
    el.innerHTML = '<span><span>' +
      (p.ok ? '<strong>' + esc(euroText(p.gesamt.wareBrutto)) + '</strong>'
            : '<strong class="preis-fehler">' + esc(p.grund) + '</strong>') +
      ' <em>' + esc(t('label.including_tax_plus_shipping_cost')) + '</em></span></span>';
  }

  function knopfStand() { $('ordern').disabled = !allowSubmit(); }

  function ladeAnzeige(ja) { Z.loading = !!ja; $('editor-laden').hidden = !ja; }

  function schriftHinweis(text) { $('schrift-hinweis').textContent = text || ''; }

  /* ======================================================================
     5  Zeichenflaeche — Methoden der Vue-Komponente
     ====================================================================== */

  /* Alle 8 Schriften laden (Original: FontFaceObserver). document.fonts.load()
     liefert die passenden FontFace-Objekte; eine leere Liste heisst: die
     Familie ist nicht definiert oder nicht ladbar. Fett (700) wird mitgeladen,
     damit "fett" auf der Zeichenflaeche sofort richtig rendert. */
  function schriftenLaden() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve(['FontFaceSet API']);
    var fehl = [];
    return Promise.all(Z.fonts.map(function (f) {
      var fam = '"' + f.fontFamily + '"';
      return Promise.all([document.fonts.load('1em ' + fam), document.fonts.load('bold 1em ' + fam)])
        .then(function (r) { if (!r[0] || !r[0].length) fehl.push(f.fontFamily); })
        .catch(function () { fehl.push(f.fontFamily); });
    })).then(function () { return fehl; });
  }

  function createCanvas() {
    ladeAnzeige(true);
    return schriftenLaden().then(function (fehl) {
      if (fehl.length) {
        /* Original: window.alert und Abbruch. Hier Hinweis in der Seite; die
           Zeichenflaeche wird trotzdem gebaut (Ersatzschriften des Browsers). */
        schriftHinweis('Failed to load fonts, please refresh this page. (' + fehl.join(', ') + ')');
      }
      canvas = new fabric.Canvas('canvas');
      var container = $('canvas-container');
      Z.canvasSize.width = (container && container.clientWidth) || 800;
      canvas.setWidth(Z.canvasSize.width);
      canvas.setHeight(Z.canvasSize.height);
      canvas.preserveObjectStacking = true;
      canvas.on({
        'selection:created': selectObjectHandler,
        'selection:updated': selectObjectHandler,
        'selection:cleared': clearSelectionHandler,
        'object:removed': removeObjectHandler,
        'canvas:cleared': clearCanvasHandler
      });
      canvas.setBackgroundColor('#F1F1F1', canvas.renderAll.bind(canvas));
      canvas.setBackgroundImage(HINTERGRUND, canvas.renderAll.bind(canvas));
      loadMaterials();
    }).catch(function (e) {
      if (window.console) console.error(e);
      schriftHinweis('Failed to load fonts, please refresh this page.');
    }).then(function () { ladeAnzeige(false); });
  }

  /* Original: fetch("/de/ajax/custom-mat-materials"); hier aus daten.js. Erstes
     Material ist Voreinstellung, danach das Beispieldesign. */
  function loadMaterials() {
    Z.materials = (D.materialien || []).slice();
    if (!Z.materials.length) {
      schriftHinweis('Die Materialien des Mattendesigners fehlen (daten.js) — bitte node bau-net-daten.mjs laufen lassen.');
      return;
    }
    materialSetzen(Z.materials[0]);
    addSample();
  }

  /* Der Beobachter "specification.material": Farben und Groessen neu, Flaeche leeren. */
  function materialSetzen(m) {
    Z.specification.material = m;
    loadColors();
    loadSizes();
    zeichneMaterialauswahl();
    zeichneFarbmenues();
    zeichneBeschreibung();
    clearCanvas();            /* -> clearCanvasHandler: Objekte leeren, Boden, Grundrechteck */
    zeichneDetails();
    zeichnePreis();
    knopfStand();
  }

  /* Beim Materialwechsel ist die LETZTE Farbe Grund-, Design- und Linienfarbe (Spec 9.4). */
  function loadColors() {
    Z.colors = Z.specification.material ? Z.specification.material.colors : [];
    var letzte = Z.colors[Z.colors.length - 1] || null;
    Z.specification.baseColor = letzte;
    Z.selectedColor = letzte;
    Z.selectedStrokeColor = letzte;
  }

  function loadSizes() {
    Z.sizes = Z.specification.material ? Z.specification.material.sizes : [];
    Z.specification.size = Z.sizes[0] || null;
  }

  function clearCanvasHandler() {
    Z.objects = [];
    addFloorBackground();
    addBase();
    canvas.renderAll();
    zeichneObjektliste();
  }

  function updateBase() {
    removeObjectById(BASIS_ID);
    addBase();
    canvas.renderAll();
    zeichneObjektliste();
  }

  function selectObjectHandler(ev) {
    var o = (ev && ev.target) || canvas.getActiveObject();
    if (!o) return;
    Z.selectedObject = o;
    o.set({ borderColor: '#2430fa', cornerColor: '#010dff', cornerSize: 8, borderScaleFactor: 2 });
    /* Anzeige der Details aus dem Objekt (Original: Watcher). Die Design-Farbe
       bleibt unveraendert — im Original steht dort ein Tippfehler (selectedcolor),
       und die gemerkte _colorObject ist ohnehin nicht die tatsaechliche Fuellung. */
    if (o._strokeColorObject) Z.selectedStrokeColor = o._strokeColorObject;
    if (o.get('lineHeight')) Z.selectedLineHeight = o.get('lineHeight');
    if (o.get('charSpacing')) Z.selectedLetterSpacing = o.get('charSpacing');   /* Original: landet in lineHeight */
    if (o.get('strokeWidth')) Z.selectedStrokeWidth = o.get('strokeWidth');
    if (o.get('textAlign')) Z.selectedTextAlign = o.get('textAlign');
    zeichneObjektliste();
    zeichneDetails();
  }

  function removeObjectHandler(ev) {
    var o = ev && ev.target;
    if (o && o.id) {
      var i = Z.objects.findIndex(function (x) { return x.id === o.id; });
      if (i >= 0) Z.objects.splice(i, 1);
    }
    zeichneObjektliste();
  }

  function clearSelectionHandler() {
    Z.selectedObject = null;
    zeichneObjektliste();
    zeichneDetails();
  }

  function clearCanvas() { canvas.clear(); }

  function select(o) { canvas.setActiveObject(o); canvas.renderAll(); }

  function addFloorBackground() { canvas.setBackgroundImage(HINTERGRUND, canvas.renderAll.bind(canvas)); }

  /* Massstab (Spec 9.4): lange Seite waagerecht -> (Breite - 20) / t, sonst (Hoehe - 20) / e. */
  function getScale(tt, ee) {
    return tt > ee ? (Z.canvasSize.width - 20) / tt : (Z.canvasSize.height - 20) / ee;
  }

  /* Das Grundrechteck: id 99999, nicht bewegbar/skalierbar/drehbar, Schatten,
     ganz hinten, zentriert; Zeichenflaechenhoehe = Hoehe * Massstab + 40.
     HORIZONTAL: size.height waagerecht, size.width senkrecht — VERTICAL umgekehrt. */
  function addBase() {
    var s = Z.specification.size, c = Z.specification.baseColor;
    if (!s || !c) return;
    var tt, ee;
    if (Z.specification.orientation === 'HORIZONTAL') { tt = s.height; ee = s.width; }
    else { tt = s.width; ee = s.height; }
    var sc = getScale(tt, ee);
    var a = new fabric.Rect({ top: 10, left: 10, width: tt * sc, height: ee * sc, fill: c.RGBColor, selectable: false });
    a._colorObject = c;
    a.id = BASIS_ID;
    a.lockMovementX = true; a.lockMovementY = true;
    a.lockScalingX = true; a.lockScalingY = true; a.lockUniScaling = true; a.lockRotation = true;
    a.set('shadow', new fabric.Shadow('0 0 20px rgba(0, 0, 0, 0.8)'));   /* Original: setShadow(...) */
    Z.objects.push(a);
    canvas.add(a);
    a.sendToBack();
    canvas.setHeight(ee * sc + 40);
    a.center();
  }

  /* Beispieldesign (Original addSample): "Welcome" in Dancing Script, weiss;
     zwei Kreise #434343 (x4) und #666666 (x3,3); das Fuchs-Bild 220x242 (x0,7).
     Die ersten drei behalten ihre Farben (insertObject(…, false)), das Bild
     bekommt wie jedes neue Objekt Fuell- und Linienfarbe aus der Palette. */
  function addSample() {
    var e = new fabric.Textbox('Welcome', { fontFamily: 'Dancing Script', fill: '#FFFFFF', selectable: true });
    var a = new fabric.Circle({ radius: 20, width: 40, height: 40, fill: '#434343', scaleX: 4, scaleY: 4 });
    var i = new fabric.Circle({ radius: 20, width: 40, height: 40, fill: '#666666', scaleX: 3.3, scaleY: 3.3 });
    var n = new Image();
    n.onload = function () {
      var s = new fabric.Image(n, { width: 220, height: 242, scaleX: 0.7, scaleY: 0.7 });
      insertObject(e, false);
      insertObject(a, false);
      insertObject(i, false);
      insertObject(s);
      a.center(); i.center(); s.center();
      i.top = i.top + 20;
      e.center();
      e.top = e.top + 120;
      e.setCoords();
      canvas.renderAll();
    };
    n.onerror = function () {
      /* Ohne Fuchs-Bild wenigstens Text und Kreise (das Original haengt alles an den onload). */
      insertObject(e, false); insertObject(a, false); insertObject(i, false);
      a.center(); i.center(); i.top = i.top + 20; e.center(); e.top = e.top + 120; e.setCoords();
      canvas.renderAll();
    };
    n.src = BEISPIELBILD;
  }

  function addCircle() { insertObject(new fabric.Circle({ radius: 20, left: 100, top: 100 })); }

  function addText() {
    insertObject(new fabric.Textbox('WELCOME', { left: 100, top: 100, fontFamily: Z.selectedFontFamily.fontFamily }));
  }

  function addRect() { insertObject(new fabric.Rect({ top: 100, left: 0, width: 80, height: 50 })); }

  /* Bild einfuegen: breiter als die Zeichenflaeche -> auf (Breite - 100) verkleinern. */
  function addImage(ev) {
    var datei = ev.target.files && ev.target.files[0];
    if (!datei) return;
    var leser = new FileReader();
    leser.onload = function (r) {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, sc = 1;
        if (w > Z.canvasSize.width) sc = (Z.canvasSize.width - 100) / w;
        insertObject(new fabric.Image(img, { scaleX: sc, scaleY: sc, left: 50, top: 50 }));
        canvas.renderAll();
      };
      img.src = r.target.result;
    };
    leser.readAsDataURL(datei);
    canvas.renderAll();
  }

  /* Neues Objekt: laufende id, gemerkte Farbobjekte; standardmaessig Fuellung =
     erste Materialfarbe, Linie = zweite (falls vorhanden). */
  function insertObject(o, farbenSetzen) {
    var setzen = farbenSetzen === undefined ? true : !!farbenSetzen;
    o.id = Z.lastId + 1;
    o._strokeColorObject = Z.selectedStrokeColor;
    o._colorObject = Z.selectedColor;
    Z.lastId = o.id;
    if (setzen && Z.colors.length) {
      o.set('fill', Z.colors[0].RGBColor);
      if (Z.colors.length > 1) o.set('stroke', Z.colors[1].RGBColor);
    }
    Z.objects.push(o);
    canvas.add(o);
    zeichneObjektliste();
  }

  function upload() { $('bild-datei').click(); }

  /* Original: window.confirm vor dem Loeschen; das Grundrechteck nie. */
  function deleteSelected() {
    var o = canvas.getActiveObject();
    if (o && o.id !== BASIS_ID && window.confirm('Are you sure you want to delete this object?')) canvas.remove(o);
  }

  function moveSelectedUp() { var o = canvas.getActiveObject(); if (o) { o.bringForward(); canvas.renderAll(); } }
  function moveSelectedDown() { var o = canvas.getActiveObject(); if (o) { o.sendBackwards(); canvas.renderAll(); } }

  function findCanvasObjectById(id) {
    return canvas.getObjects().filter(function (o) { return o.id === id; })[0] || null;
  }

  function removeObjectById(id) { var o = findCanvasObjectById(id); if (o) canvas.remove(o); }

  /* Vorschaubild aus der ganzen Zeichenflaeche. Original: JPEG; hier PNG, weil
     der Kunde es herunterlaedt und dem Angebot beilegt (Briefing 3.4). */
  function generateImage() { Z.dataURL = canvas.toDataURL({ format: 'png' }); }

  /* ======================================================================
     6  Bestellmodal und Uebergabe an designer-checkout.html
     ====================================================================== */

  function finishEditing() {
    generateImage();
    var s = Z.specification, m = s.material, g = s.size, c = s.baseColor, p = preisFuer();
    $('matDisplay').src = Z.dataURL;
    $('modal-material').textContent = m ? m.name : '';
    $('modal-groesse').textContent = g ? g.height + 'cm x ' + g.width + 'cm' : '';
    $('modal-menge').textContent = String(s.quantity);
    $('modal-farbe').innerHTML = c
      ? '<div style="width: 50px; height: 50px; display: inline-block; border: 1px solid grey; background-color: ' + esc(c.RGBColor) + ';"></div><p>' + esc(c.code + ' ' + c.name) + '</p>'
      : '';
    /* Preis je Stueck und Total in EUR (Original: GBP-Zeichen, Spec 17.6). */
    $('modal-preis').textContent = p.ok ? euroText(p.stueck.wareBrutto) : '—';
    $('modal-total').textContent = p.ok ? euroText(p.gesamt.wareBrutto) : '—';
    $('modal-notes').textContent = s.notes ? s.notes : '-';
    $('modal-hinweis').innerHTML = p.ok ? '' : '<div class="alert alert-warning">' + esc(p.grund) + '</div>';
    var f = $('modal-form');
    f.elements.mat_image.value = Z.dataURL || '';
    f.elements.mat_material.value = m ? m.id : '';
    f.elements.mat_width.value = g ? g.width : '';
    f.elements.mat_height.value = g ? g.height : '';
    f.elements.mat_quantity.value = s.quantity;
    f.elements.mat_notes[0].value = s.notes || '';
    f.elements.mat_notes[1].value = c ? c.id : '';   /* im Original: baseColor.id, ebenfalls unter mat_notes */
  }

  /* Farbwert eines Objekts -> "646 203-198-27", wenn er in der Materialpalette steht. */
  function farbcode(wert) {
    if (!wert || typeof wert !== 'string') return null;
    var w = wert.toLowerCase();
    var c = Z.colors.filter(function (x) { return String(x.RGBColor || '').toLowerCase() === w; })[0];
    return c ? c.code + ' ' + c.name : wert;
  }

  /* Die Designelemente fuer den Kommentar der Anfrage (je Objekt: Typ, Text,
     Schriftart, Fuell-/Linienfarbe) — das Altsystem kann kein Bild entgegennehmen. */
  function elementeBeschreiben() {
    return Z.objects.filter(function (o) { return o.id !== BASIS_ID; }).map(function (o) {
      var e = { typ: o.type, fill: farbcode(o.fill), stroke: farbcode(o.stroke), strokeWidth: o.strokeWidth };
      if (o.type === 'textbox') {
        e.text = o.text; e.fontFamily = o.fontFamily; e.fontWeight = o.fontWeight; e.textAlign = o.textAlign;
      }
      return e;
    });
  }

  function nutzlast(mitBild) {
    var s = Z.specification, m = s.material, g = s.size, c = s.baseColor, p = preisFuer();
    return {
      version: 1,
      zeit: new Date().toISOString(),
      material: { id: m.id, name: m.name, price: m.price, dePfad: m.dePfad || null, preisdaten: m.preisdaten || null },
      size: { id: g.id, width: g.width, height: g.height },
      orientation: s.orientation,
      quantity: mengeZahl(),
      notes: s.notes || '',
      baseColor: { id: c.id, code: c.code, name: c.name, RGBColor: c.RGBColor },
      elemente: elementeBeschreiben(),
      preis: p.ok && !p.leer
        ? { ok: true, nettoStueck: p.stueck.netto, bruttoStueck: p.stueck.wareBrutto, nettoGesamt: p.gesamt.netto, ust: p.gesamt.ust,
            ustSatz: p.gesamt.ustSatz, brutto: p.gesamt.wareBrutto, staffelfaktor: p.r.staffelfaktor, faktorBreite: p.r.faktorBreite }
        : { ok: false, grund: p.grund || 'keine Menge' },
      bild: mitBild ? Z.dataURL : null,
      bildFormat: 'png'
    };
  }

  /* sessionStorage kann voll sein (das PNG ist einige hundert KB): erst mit
     Bild, dann ohne Bild — dann sagt das Bestellformular, dass die Vorschau fehlt. */
  function designUebergeben() {
    var ziel = window.submitURL || 'designer-checkout.html';
    var versuche = [true, false];
    for (var i = 0; i < versuche.length; i++) {
      try {
        window.sessionStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(nutzlast(versuche[i])));
        window.location.href = ziel;
        return;
      } catch (e) { /* naechster Versuch */ }
    }
    $('modal-hinweis').innerHTML = '<div class="alert alert-danger">Das Design konnte nicht an das Bestellformular übergeben werden (Speicher des Browsers nicht verfügbar). Bitte Design erneut anlegen.</div>';
  }

  /* ======================================================================
     7  Bedienung
     ====================================================================== */

  function verdrahten() {
    /* Werkzeuge */
    $('werkzeug-neu').addEventListener('click', function () { if (canvas) clearCanvas(); });
    $('werkzeug-text').addEventListener('click', function () { if (canvas) addText(); });
    $('werkzeug-rechteck').addEventListener('click', function () { if (canvas) addRect(); });
    $('werkzeug-kreis').addEventListener('click', function () { if (canvas) addCircle(); });
    $('werkzeug-bild').addEventListener('click', function (ev) { if (ev.target.id !== 'bild-datei') upload(); });
    $('bild-datei').addEventListener('change', function (ev) { if (canvas) addImage(ev); });
    $('bild-datei').addEventListener('click', function (ev) { ev.target.value = null; ev.stopPropagation(); });

    /* Designelemente: Klick waehlt das Objekt; Knopf "Objekt entfernen" */
    $('objekte').addEventListener('click', function (ev) {
      var li = ev.target.closest('li[data-id]');
      if (!li || !canvas) return;
      var o = Z.objects.filter(function (x) { return String(x.id) === li.getAttribute('data-id'); })[0];
      if (o) select(o);
    });
    $('loeschen-bereich').addEventListener('click', function (ev) {
      if (ev.target.closest('#loeschen') && canvas) deleteSelected();
    });

    /* Auswahl */
    $('material').addEventListener('change', function (ev) {
      var m = Z.materials.filter(function (x) { return String(x.id) === ev.target.value; })[0];
      if (m && canvas) materialSetzen(m);
    });
    $('size').addEventListener('change', function (ev) {
      var s = Z.sizes.filter(function (x) { return String(x.id) === ev.target.value; })[0];
      if (!s || !canvas) return;
      Z.specification.size = s;
      updateBase();
      zeichnePreis();
      knopfStand();
    });
    $('orientation').addEventListener('change', function (ev) {
      Z.specification.orientation = ev.target.value;
      if (canvas) updateBase();
      knopfStand();
    });
    /* Menge: > 999 -> 999, < 0 -> 1 (Beobachter im Original); leer bleibt leer (Knopf gesperrt). */
    $('quantity').addEventListener('input', function (ev) {
      var v = ev.target.value;
      var n = Number(v);
      if (v !== '' && n > 999) { n = 999; ev.target.value = '999'; }
      if (v !== '' && n < 0) { n = 1; ev.target.value = '1'; }
      Z.specification.quantity = v === '' ? '' : n;
      zeichnePreis();
      knopfStand();
    });
    $('notes').addEventListener('input', function (ev) { Z.specification.notes = ev.target.value; });

    /* Entf / Ruecktaste auf der Zeichenflaeche loescht das gewaehlte Objekt —
       nicht waehrend der Kunde in einer Textbox tippt (Abweichung, s. Kopf). */
    $('canvas-container').addEventListener('keyup', function (ev) {
      var k = ev.key;
      if (!(k === 'Backspace' || k === 'Delete' || k === 'Del' || ev.keyCode === 8 || ev.keyCode === 46)) return;
      var o = canvas && canvas.getActiveObject();
      if (o && o.isEditing) return;
      if (canvas) deleteSelected();
    });

    /* Diese Matte ordern -> Modal fuellen (Bootstrap oeffnet es ueber data-toggle) */
    $('ordern').addEventListener('click', function () { if (canvas && allowSubmit()) finishEditing(); });
    $('modal-form').addEventListener('submit', function (ev) { ev.preventDefault(); designUebergeben(); });

    /* Design-details */
    $('details').addEventListener('click', function (ev) {
      var kachel = ev.target.closest('.color[data-gruppe]');
      if (kachel) {
        var c = Z.colors[Number(kachel.getAttribute('data-index'))];
        var g = kachel.getAttribute('data-gruppe');
        if (!c) return;
        if (g === 'basis') {
          Z.specification.baseColor = c;
          if (canvas) updateBase();
          knopfStand();
        } else if (g === 'design') {
          Z.selectedColor = c;
          if (Z.selectedObject) { Z.selectedObject.set('fill', c.RGBColor); Z.selectedObject._colorObject = c; canvas.renderAll(); }
        } else {
          Z.selectedStrokeColor = c;
          if (Z.selectedObject) { Z.selectedObject.set('stroke', c.RGBColor); Z.selectedObject._strokeColorObject = c; canvas.renderAll(); }
        }
        zeichneDetails();
        return;
      }
      var schrift = ev.target.closest('a[data-font]');
      if (schrift) {
        ev.preventDefault();
        var f = Z.fonts[Number(schrift.getAttribute('data-font'))];
        if (!f) return;
        Z.selectedFontFamily = f;
        if (istTextbox(Z.selectedObject)) { Z.selectedObject.set('fontFamily', f.fontFamily); canvas.renderAll(); }
        zeichneDetails();
        return;
      }
      if (ev.target.closest('#nach-oben')) { moveSelectedUp(); return; }
      if (ev.target.closest('#nach-unten')) { moveSelectedDown(); return; }
    });
    $('strokeWidth').addEventListener('input', function (ev) {
      Z.selectedStrokeWidth = Number(ev.target.value);
      if (Z.selectedObject && Number.isFinite(Z.selectedStrokeWidth)) { Z.selectedObject.set('strokeWidth', Z.selectedStrokeWidth); canvas.renderAll(); }
    });
    $('font-weight').addEventListener('change', function (ev) {
      Z.selectedFontWeight = ev.target.value;
      if (istTextbox(Z.selectedObject)) { Z.selectedObject.set('fontWeight', Z.selectedFontWeight); canvas.renderAll(); }
    });
    $('lineHeight').addEventListener('input', function (ev) {
      Z.selectedLineHeight = Number(ev.target.value);
      if (istTextbox(Z.selectedObject) && Number.isFinite(Z.selectedLineHeight)) { Z.selectedObject.set('lineHeight', Z.selectedLineHeight); canvas.renderAll(); }
    });
    $('letterSpacing').addEventListener('input', function (ev) {
      Z.selectedLetterSpacing = Number(ev.target.value);
      if (istTextbox(Z.selectedObject) && Number.isFinite(Z.selectedLetterSpacing)) { Z.selectedObject.set('charSpacing', Z.selectedLetterSpacing); canvas.renderAll(); }
    });
    $('text-align').addEventListener('change', function (ev) {
      if (!ev.target.matches('input[type=radio]')) return;
      Z.selectedTextAlign = ev.target.value;
      if (istTextbox(Z.selectedObject)) { Z.selectedObject.set('textAlign', Z.selectedTextAlign); canvas.renderAll(); }
      zeichneDetails();
    });
  }

  /* ======================================================================
     8  Start (mounted -> createCanvas)
     ====================================================================== */

  function start() {
    $editor.innerHTML = baueEditor();
    verdrahten();
    zeichneDetails();
    zeichneObjektliste();
    if (!fabric) {
      ladeAnzeige(false);
      schriftHinweis('fabric.js fehlt (assets/js/vendor/fabric.min.js) — der Designer kann nicht starten.');
      return;
    }
    createCanvas();
  }

  start();
})();
