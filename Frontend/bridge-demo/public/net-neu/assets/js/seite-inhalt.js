/* ==========================================================================
   seite-inhalt.js — Blog, Gaestebuch, Infoseiten (Spec 12)
   --------------------------------------------------------------------------
     blog.html            2 Beitraege aus NET.texte.blog; mit #<slug> in der
                          Adresse nur dieser Beitrag (Einzelbeitragsseite,
                          ohne "Continue reading")
     guest-book.html      rendert im Original nichts — hier ein Satz
     pages.html?s=<slug>  agb | impressum | data-protection |
                          datenschutzerklarung-dsgvo, Wortlaut aus texte/*.md
   ========================================================================== */

(function () {
  'use strict';

  var NET = window.NET || {};
  var S = window.Shell;
  var esc = S.esc;
  var texte = NET.texte || {};

  /* --- Blog ------------------------------------------------------------- */
  var blog = document.getElementById('blog');
  if (blog) {
    var einzel = (window.location.hash || '').replace(/^#/, '');
    var beitraege = texte.blog || [];
    var liste = einzel ? beitraege.filter(function (b) { return b.slug === einzel; }) : beitraege;
    if (!liste.length) liste = beitraege;
    blog.innerHTML = liste.map(function (b) {
      return '<article id="' + esc(b.slug) + '">\n<h2>' + esc(b.titel) + '</h2>\n' +
        '<small><em>' + esc(b.datum) + '</em></small>\n' +
        b.absaetze.map(function (a) { return '<p>' + a + '</p>'; }).join('\n') +
        (einzel ? '' : '\n<p><a href="blog.html#' + esc(b.slug) + '">Continue reading</a></p>') +
        '\n</article>';
    }).join('\n');
    window.addEventListener('hashchange', function () { window.location.reload(); });
  }

  /* --- Infoseiten ------------------------------------------------------- */
  var seite = document.getElementById('seite');
  if (seite) {
    var s = S.param('s', 'agb');
    var t = texte[s];
    var titel = document.getElementById('seite-titel');
    var inhalt = document.getElementById('seite-inhalt');
    if (!t || !t.html) {
      if (titel) titel.textContent = 'Seite nicht gefunden';
      if (inhalt) inhalt.innerHTML = '<p>Diese Seite gibt es nicht. <a href="index.html">Zur Startseite</a></p>';
      var hinweis = document.getElementById('rechtstext-hinweis');
      if (hinweis) hinweis.hidden = true;
    } else {
      document.title = t.titel || 'Mattenfuchs';
      if (titel) titel.textContent = t.titel;
      if (inhalt) inhalt.innerHTML = t.html;
    }
  }
})();
