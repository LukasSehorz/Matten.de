/* ==========================================================================
   seite-start.js — Startseite (index.html), Spec Abschnitt 5
   --------------------------------------------------------------------------
   Fuellt die statischen Bereiche der Startseite aus window.NET.startseite:
   Datenschutzhinweis, Karussell (11 Folien), "Featured Category (German)",
   TOP-ANGEBOTE (5 Karten), "Der Mattenfuchs", Vorteilsleiste. Alle Inhalte
   stammen 1:1 aus spec/screens/startseite.html (siehe bau-net-daten.mjs).
   ========================================================================== */

(function () {
  'use strict';

  var NET = window.NET || {};
  var S = window.Shell;
  var esc = S.esc;
  var start = NET.startseite || {};

  /* --- 1  Datenschutzhinweis (Markup 1:1, nur der Link zeigt auf pages.html) */
  var pi = document.getElementById('protection-info');
  if (pi) pi.innerHTML = start.datenschutzhinweisHtml || '';

  /* --- 2  Karussell ---------------------------------------------------- */
  var ind = document.getElementById('carousel-indikatoren');
  var folien = document.getElementById('carousel-folien');
  if (ind && folien) {
    var k = start.karussell || [];
    ind.innerHTML = k.map(function (f, i) {
      return '<li data-target="#carousel" data-slide-to="' + i + '" class="' + (i === 0 ? 'active' : '') + '"></li>';
    }).join('\n');
    folien.innerHTML = k.map(function (f, i) {
      return '<div class="carousel-item' + (i === 0 ? ' active' : '') + '">\n' +
        (f.bild ? '<img class="d-block w-100" src="' + esc(f.bild) + '" alt="' + esc(f.alt) + '">\n' : '') +
        '<div class="carousel-caption d-inline">\n<a href="' + esc(f.href) + '">\n' +
        '<h5 class="h2">' + esc(f.titel) + '</h5>\n<p class="h4">' + esc(f.untertitel) + '</p>\n' +
        '</a>\n</div>\n</div>';
    }).join('\n');
  }

  /* --- 3  Featured Category ------------------------------------------- */
  var feat = document.getElementById('featured');
  if (feat && start.featured) {
    var f = start.featured;
    feat.innerHTML = '<div class="col-md-6">\n<!-- Category cover -->\n' +
      '<a href="' + esc(f.href) + '">\n<div class="category-thumbnail-container" style="margin-bottom: 30px;">\n' +
      '<div class="category-thumbnail"' + (f.bild ? ' style="background-image: url(\'' + esc(f.bild) + '\')"' : '') + '></div>\n' +
      '<p class="category-thumbnail-caption">' + esc(f.caption) + '</p>\n</div>\n</a>\n' +
      '<!-- End category cover -->\n</div>';
  }

  /* --- 4  TOP-ANGEBOTE -------------------------------------------------- */
  var top = document.getElementById('top-angebote');
  if (top) {
    top.innerHTML = (start.topAngebote || []).map(function (slug) {
      return S.produktkarte((NET.produkte || {})[slug]);
    }).join('');
  }

  /* --- 5  Der Mattenfuchs ----------------------------------------------- */
  var mf = document.getElementById('mattenfuchs-text');
  if (mf) mf.textContent = start.mattenfuchsText || '';

  /* --- 6  Vorteilsleiste ------------------------------------------------ */
  var vt = document.getElementById('vorteile');
  if (vt) {
    vt.innerHTML = (start.vorteile || []).map(function (v) {
      return '<div class="col-2 info-col text-center">\n<div>' +
        (v.bild
          ? '<img src="' + esc(v.bild) + '" alt="' + esc(v.alt) + '" width="120" height="120">'
          : '<span class="info-bild-leer" role="img" aria-label="' + esc(v.alt) + '"></span>') +
        '</div>\n<p class="info-text text-center">' + esc(v.text) + '</p>\n</div>';
    }).join('\n');
  }
})();
