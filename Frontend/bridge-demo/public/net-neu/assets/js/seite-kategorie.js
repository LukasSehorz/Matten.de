/* ==========================================================================
   seite-kategorie.js — Kategorieseite (kategorie.html?slug=<netSlug>), Spec 6
   --------------------------------------------------------------------------
   Titelbereich mit Titelbild, Name und Beschreibung; Filter "Sort by";
   Produktkarten der Kategorie. Leere Kategorien bleiben leer — wie im
   Original ohne Hinweistext (14 der 27 Kategorien).
   ========================================================================== */

(function () {
  'use strict';

  var NET = window.NET || {};
  var S = window.Shell;
  var esc = S.esc;

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
  if (raster) raster.innerHTML = produkte.map(S.produktkarte).join('');

  /* Mobil: der Knopf "Filter" klappt das Formular auf und zu. */
  var toggle = document.getElementById('filter-toggle');
  var form = document.getElementById('filter');
  if (toggle && form) {
    toggle.addEventListener('click', function () { form.classList.toggle('d-none'); });
  }
})();
