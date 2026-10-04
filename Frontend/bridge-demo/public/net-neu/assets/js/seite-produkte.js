/* ==========================================================================
   seite-produkte.js — Produktliste (products.html), Spec 7
   --------------------------------------------------------------------------
   Adresse:  products.html[?page=n][&keyword=…][&category[]=ID…][&filter_sort=…]

   Filter mit den 26 Kategorie-Kaestchen unter 9 Gruppen (IDs des Originals),
   Sortierung, 16 Karten je Seite, Paginierung "« Vorherige | 1 | 2 | Nächste »"
   (bei vielen Seiten gekuerzt: 1 … 8 9 10 11 12 … 25).
   Der Suchbegriff aus dem Kopf (?keyword=) filtert nach dem Produktnamen.
   Die Gruppen sind per <button> auf- und zuklappbar (im Original ein
   Inline-onclick auf einem <span>, nicht tastaturbedienbar).
   ========================================================================== */

(function () {
  'use strict';

  var NET = window.NET || {};
  var S = window.Shell;
  var esc = S.esc;
  var JE_SEITE = 16;

  /* --- Hilfen fuer grosse Mengen (Stand 04.10.2026) -------------------------
     Bei bis zu 385 Produkten duerfen die Bilder nicht alle sofort laden, und
     Artikel ohne Bild brauchen einen Platzhalter mit Namen.
     (Gleicher Helfer in seite-kategorie.js — shell.js bleibt unberuehrt.) */
  function karte(p) {
    var h = S.produktkarte(p);
    /* Kartenbilder erst laden, wenn sie in die Naehe des Bildschirms kommen.
       Breite und Hoehe (256x170) stehen schon im Markup, das Layout springt nicht. */
    h = h.replace(/<img /g, '<img loading="lazy" decoding="async" ');
    /* Platzhalter: grauer Kasten mit dem Produktnamen statt leerer Flaeche */
    return h.replace(/(<span class="card-img-top card-img-leer"[^>]*>)<\/span>/, function (_, auf) {
      return auf + '<span class="card-img-name">' + esc(p.name) + '</span></span>';
    });
  }
  /* Ein Bild, das nicht ladbar ist (404 vom Bildproxy), wird zum Platzhalter. */
  function bildFehler(ev) {
    var b = ev.target;
    if (!b || b.tagName !== 'IMG' || !b.classList.contains('card-img-top')) return;
    var ph = document.createElement('span');
    ph.className = 'card-img-top card-img-leer';
    ph.setAttribute('role', 'img');
    ph.setAttribute('aria-label', 'Kein Bild vorhanden');
    var n = document.createElement('span');
    n.className = 'card-img-name';
    n.textContent = b.getAttribute('alt') || '';
    ph.appendChild(n);
    b.parentNode.replaceChild(ph, b);
  }

  /* Seitenzahlen kuerzen: erste, letzte, aktuelle und je zwei Nachbarn,
     dazwischen "…". Fehlt zwischen zwei Gruppen nur eine Zahl, steht die Zahl
     statt der Auslassung. Rueckgabe: Zahlen, 0 = Auslassung. */
  function seitenFolge(aktuell, gesamt) {
    var zeigen = {};
    [1, gesamt, aktuell - 2, aktuell - 1, aktuell, aktuell + 1, aktuell + 2].forEach(function (n) {
      if (n >= 1 && n <= gesamt) zeigen[n] = true;
    });
    var folge = [];
    var letzte = 0;
    for (var n = 1; n <= gesamt; n++) {
      if (!zeigen[n]) continue;
      if (n - letzte === 2) folge.push(letzte + 1);
      else if (n - letzte > 2) folge.push(0);
      folge.push(n);
      letzte = n;
    }
    return folge;
  }

  var qs;
  try { qs = new URLSearchParams(window.location.search); } catch (e) { qs = new URLSearchParams(''); }
  var keyword = (qs.get('keyword') || '').trim();
  var sort = qs.get('filter_sort') || 'LATEST';
  var seite = Math.max(1, parseInt(qs.get('page') || '1', 10) || 1);
  var gewaehlteIds = qs.getAll('category[]').map(function (x) { return Number(x); }).filter(function (n) { return n > 0; });

  /* --- 1  Filterleiste ---------------------------------------------------- */
  var gruppenZiel = document.getElementById('filter-gruppen');
  if (gruppenZiel) {
    gruppenZiel.innerHTML = (NET.gruppen || []).map(function (g, gi) {
      var id = 'filter-gruppe-' + gi;
      return '<button type="button" class="filter-category-parent" aria-expanded="true" aria-controls="' + id + '">' + esc(g.label) + '</button>\n' +
        '<div id="' + id + '">\n' +
        g.kategorien.map(function (k) {
          var an = !gewaehlteIds.length || gewaehlteIds.indexOf(k.id) >= 0;
          return '<div class="custom-control custom-checkbox">' +
            '<input type="checkbox" name="category[]" class="custom-control-input" id="child_' + k.id + '" value="' + k.id + '"' + (an ? ' checked' : '') + '>' +
            '<label class="custom-control-label" for="child_' + k.id + '">' + esc(k.label) + '</label></div>';
        }).join('\n') +
        '\n</div>\n<hr>\n';
    }).join('');

    gruppenZiel.addEventListener('click', function (ev) {
      var knopf = ev.target.closest ? ev.target.closest('.filter-category-parent') : null;
      if (!knopf) return;
      var block = document.getElementById(knopf.getAttribute('aria-controls'));
      var offen = knopf.getAttribute('aria-expanded') === 'true';
      knopf.setAttribute('aria-expanded', offen ? 'false' : 'true');
      if (block) block.hidden = offen;
    });
  }
  var sortFeld = document.getElementById('filter-sort');
  if (sortFeld) sortFeld.value = ['LATEST', 'NAME_ASC', 'NAME_DESC'].indexOf(sort) >= 0 ? sort : 'LATEST';
  var kwFeld = document.getElementById('filter-keyword');
  if (kwFeld) kwFeld.value = keyword;

  var toggle = document.getElementById('filter-toggle');
  var form = document.getElementById('filter');
  if (toggle && form) toggle.addEventListener('click', function () { form.classList.toggle('d-none'); });

  /* --- 2  Treffer ----------------------------------------------------------- */
  var idZuSlug = {};
  (NET.gruppen || []).forEach(function (g) { g.kategorien.forEach(function (k) { if (k.slug) idZuSlug[k.id] = k.slug; }); });
  var erlaubteSlugs = gewaehlteIds.length ? gewaehlteIds.map(function (id) { return idZuSlug[id]; }).filter(Boolean) : null;

  var alle = (NET.produktReihenfolge || []).map(function (s) { return NET.produkte[s]; }).filter(Boolean);
  var treffer = alle.filter(function (p) {
    if (keyword && p.name.toLowerCase().indexOf(keyword.toLowerCase()) < 0) return false;
    if (erlaubteSlugs && !p.kategorien.some(function (k) { return erlaubteSlugs.indexOf(k) >= 0; })) return false;
    return true;
  });
  if (sort === 'NAME_ASC' || sort === 'NAME_DESC') {
    treffer.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    if (sort === 'NAME_DESC') treffer.reverse();
  }

  var seiten = Math.max(1, Math.ceil(treffer.length / JE_SEITE));
  if (seite > seiten) seite = seiten;
  var ab = (seite - 1) * JE_SEITE;
  var raster = document.getElementById('produkt-raster');
  if (raster) raster.addEventListener('error', bildFehler, true);
  if (raster) raster.innerHTML = treffer.slice(ab, ab + JE_SEITE).map(karte).join('');

  /* --- 3  Paginierung (Markup laut texte/products-uebersicht.md) ------------ */
  function adresse(n) {
    var q = new URLSearchParams(window.location.search);
    q.set('page', String(n));
    return 'products.html?' + q.toString();
  }
  var pag = document.getElementById('seitenzahlen');
  if (pag) {
    if (seiten <= 1) {
      pag.parentNode.hidden = true;
    } else {
      var h = '';
      h += seite === 1
        ? '<li class="page-item disabled"><span class="page-link">&laquo;&nbsp;Vorherige</span></li>'
        : '<li class="page-item"><a class="page-link" rel="prev" href="' + esc(adresse(seite - 1)) + '">&laquo;&nbsp;Vorherige</a></li>';
      seitenFolge(seite, seiten).forEach(function (n) {
        if (n === 0) h += '<li class="page-item disabled"><span class="page-link">&hellip;</span></li>';
        else h += n === seite
          ? '<li class="page-item active"><span class="page-link">' + n + '</span></li>'
          : '<li class="page-item"><a class="page-link" href="' + esc(adresse(n)) + '">' + n + '</a></li>';
      });
      h += seite === seiten
        ? '<li class="page-item disabled"><span class="page-link">Nächste&nbsp;&raquo;</span></li>'
        : '<li class="page-item"><a class="page-link" rel="next" href="' + esc(adresse(seite + 1)) + '">Nächste&nbsp;&raquo;</a></li>';
      pag.innerHTML = h;
    }
  }
})();
