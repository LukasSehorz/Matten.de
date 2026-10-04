/* ==========================================================================
   seite-kategorie.js — Kategorieseite (kategorie.html?slug=<netSlug>), Spec 6
   --------------------------------------------------------------------------
   Titelbereich mit Titelbild, Name und Beschreibung; Filter "Sort by";
   Produktkarten der Kategorie (16 je Seite, Blaetterung wie products.html). Leere Kategorien bleiben leer — wie im
   Original ohne Hinweistext (14 der 27 Kategorien).
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

  var slug = S.param('slug', '');
  var kat = (NET.kategorien || {})[slug] || null;
  var sort = S.param('filter_sort', 'LATEST');

  var kopf = document.getElementById('kategorie-kopf');
  var name = document.getElementById('kategorie-name');
  var beschr = document.getElementById('kategorie-beschreibung');
  var raster = document.getElementById('produkt-raster');
  var sortFeld = document.getElementById('filter-sort');
  var slugFeld = document.getElementById('filter-slug');

  if (!kat) {
    /* Das Original antwortet fuer unbekannte Slugs mit 404. */
    if (name) name.textContent = 'Kategorie nicht gefunden';
    if (beschr) beschr.innerHTML = 'Diese Kategorie gibt es nicht. <a href="products.html" class="text-white">Alle Produkte</a>';
    if (raster) raster.innerHTML = '';
    return;
  }

  document.title = 'Mattenfuchs';
  if (kopf && kat.titelbild) kopf.style.backgroundImage = 'url(\'' + kat.titelbild + '\')';
  if (name) name.textContent = kat.name;
  if (beschr) beschr.textContent = kat.beschreibung || '';
  if (slugFeld) slugFeld.value = slug;
  if (sortFeld) sortFeld.value = ['LATEST', 'NAME_ASC', 'NAME_DESC'].indexOf(sort) >= 0 ? sort : 'LATEST';

  /* Reihenfolge: "Latest" = Reihenfolge der Kategorieseite des Originals
     (struktur.json), sonst nach Name. */
  var produkte = (kat.produkte || []).map(function (s) { return (NET.produkte || {})[s]; }).filter(Boolean);
  if (sort === 'NAME_ASC' || sort === 'NAME_DESC') {
    produkte.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
    if (sort === 'NAME_DESC') produkte.reverse();
  }
  /* Blaetterung wie auf der Produktliste: 16 Karten je Seite. */
  var seiten = Math.max(1, Math.ceil(produkte.length / JE_SEITE));
  var seite = Math.min(seiten, Math.max(1, parseInt(S.param('page', '1'), 10) || 1));
  var ab = (seite - 1) * JE_SEITE;
  if (raster) {
    raster.addEventListener('error', bildFehler, true);
    raster.innerHTML = produkte.slice(ab, ab + JE_SEITE).map(karte).join('');
  }

  function adresse(n) {
    var q = new URLSearchParams(window.location.search);
    q.set('page', String(n));
    return 'kategorie.html?' + q.toString();
  }
  /* kategorie.html hat (anders als products.html) kein Blaetter-Markup — es
     entsteht hier, im selben Aufbau. Bei nur einer Seite entsteht nichts. */
  if (raster && seiten > 1) {
    var nav = document.createElement('nav');
    var pag = document.createElement('ul');
    pag.className = 'pagination';
    pag.id = 'seitenzahlen';
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
    nav.appendChild(pag);
    raster.parentNode.insertBefore(nav, raster.nextSibling);
  }

  /* Mobil: der Knopf "Filter" klappt das Formular auf und zu. */
  var toggle = document.getElementById('filter-toggle');
  var form = document.getElementById('filter');
  if (toggle && form) {
    toggle.addEventListener('click', function () { form.classList.toggle('d-none'); });
  }
})();
