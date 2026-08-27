/* Kategorie-/Listing-Seite */
(function () {
  "use strict";
  var C = window.CATALOG;
  var PAGE = 24;

  var state = {
    cat: MF.qs("cat") || "",
    sub: MF.qs("sub") || "",
    q: MF.qs("q") || "",
    sort: "rel",
    shown: PAGE,
    subs: new Set(),
    price: null,
    only: new Set()
  };

  function base() {
    var list = C.products.slice();
    if (state.q) list = MF.search(state.q, 999);
    if (state.cat) list = list.filter(function (p) { return p.cat === state.cat; });
    if (state.sub) list = list.filter(function (p) { return p.sub === state.sub; });
    return list;
  }

  function filtered() {
    var list = base();
    if (state.subs.size) list = list.filter(function (p) { return state.subs.has(p.sub || "-"); });
    if (state.price) {
      list = list.filter(function (p) {
        return p.price >= state.price[0] && (state.price[1] === null || p.price < state.price[1]);
      });
    }
    if (state.only.has("massanfertigung")) {
      list = list.filter(function (p) {
        return p.custom || (p.features || []).some(function (f) { return /Maßanfertigung/.test(f); });
      });
    }
    if (state.only.has("farbauswahl")) list = list.filter(function (p) { return p.colors.length > 1; });
    if (state.only.has("bild")) list = list.filter(function (p) { return !!p.image; });

    if (state.sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
    else if (state.sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name, "de"); });
    else list.sort(function (a, b) {
      var s = function (p) {
        return (p.badge === "Topseller" ? 100 : 0) + (p.image ? 40 : 0) +
               p.colors.length * 2 + (p.features || []).length;
      };
      return s(b) - s(a);
    });
    return list;
  }

  var PRICE_BANDS = [
    ["bis 30 €", [0, 30]],
    ["30 – 60 €", [30, 60]],
    ["60 – 120 €", [60, 120]],
    ["120 – 300 €", [120, 300]],
    ["ab 300 €", [300, null]]
  ];

  function head() {
    var cat = state.cat ? MF.cat(state.cat) : null;
    var crumbs = ['<a href="index.html">Start</a>'];
    var title = "Alle Matten", teaser = "Das komplette Sortiment des Mattenfuchs-Shops.";
    if (cat) {
      crumbs.push("<span>›</span>");
      title = cat.name; teaser = cat.teaser;
      if (state.sub) {
        crumbs.push('<a href="kategorie.html?cat=' + cat.key + '">' + MF.esc(cat.short) + "</a><span>›</span>");
        var s = (cat.subs || []).filter(function (x) { return x.key === state.sub; })[0];
        title = s ? s.name : title;
        teaser = cat.teaser;
        crumbs.push(MF.esc(title));
      } else {
        crumbs.push(MF.esc(cat.short));
      }
    } else if (state.q) {
      crumbs.push("<span>›</span>Suche");
      title = "Suchergebnisse für „" + state.q + "“";
      teaser = "Kein passender Treffer dabei? Wir fertigen auch Sonderformen — sprechen Sie uns an.";
    } else {
      crumbs.push("<span>›</span>Sortiment");
    }
    document.querySelector("[data-crumbs]").innerHTML = crumbs.join("");
    document.querySelector("[data-cat-title]").textContent = title;
    document.querySelector("[data-cat-teaser]").textContent = teaser;
    document.title = title + " – Mattenfuchs";
  }

  function filters() {
    var el = document.querySelector("[data-filters]");
    var list = base();
    var out = "";

    if (state.cat) {
      var cat = MF.cat(state.cat);
      var counts = {};
      list.forEach(function (p) { var k = p.sub || "-"; counts[k] = (counts[k] || 0) + 1; });
      var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
      if (keys.length > 1 && !state.sub) {
        out += '<div class="filter-group"><h4>Bereich</h4>' +
          keys.map(function (k) {
            var name = k === "-" ? "Ohne Zuordnung"
              : ((cat.subs || []).filter(function (s) { return s.key === k; })[0] || {}).name ||
                k.replace(/[_-]/g, " ");
            return '<label class="filter-opt"><input type="checkbox" data-sub="' + MF.esc(k) + '"' +
              (state.subs.has(k) ? " checked" : "") + '><span>' + MF.esc(name) +
              '</span><span class="count">' + counts[k] + "</span></label>";
          }).join("") + "</div>";
      }
    } else {
      out += '<div class="filter-group"><h4>Kategorie</h4>' +
        C.categories.filter(function (c) { return c.count; }).map(function (c) {
          return '<label class="filter-opt"><a href="kategorie.html?cat=' + c.key + '">' +
            MF.esc(c.short) + '</a><span class="count">' + c.count + "</span></label>";
        }).join("") + "</div>";
    }

    out += '<div class="filter-group"><h4>Preis</h4>' +
      PRICE_BANDS.map(function (b, i) {
        var n = list.filter(function (p) {
          return p.price >= b[1][0] && (b[1][1] === null || p.price < b[1][1]);
        }).length;
        if (!n) return "";
        var on = state.price && state.price[0] === b[1][0] && state.price[1] === b[1][1];
        return '<label class="filter-opt"><input type="radio" name="pb" data-band="' + i + '"' +
          (on ? " checked" : "") + '><span>' + b[0] + '</span><span class="count">' + n + "</span></label>";
      }).join("") + "</div>";

    out += '<div class="filter-group"><h4>Eigenschaften</h4>' +
      [["massanfertigung", "Maßanfertigung möglich"],
       ["farbauswahl", "Mit Farbauswahl"],
       ["bild", "Mit Produktbild"]].map(function (o) {
        return '<label class="filter-opt"><input type="checkbox" data-only="' + o[0] + '"' +
          (state.only.has(o[0]) ? " checked" : "") + '><span>' + o[1] + "</span></label>";
      }).join("") + "</div>";

    out += '<div class="filter-group" style="border-bottom:0">' +
      '<button class="btn btn--ghost btn--sm btn--block" type="button" data-reset>Filter zurücksetzen</button>' +
      '<p style="font-size:13.5px;color:var(--c-ink-muted);margin:18px 0 0">Nichts Passendes gefunden? ' +
      'Wir fertigen jede Matte nach Maß. <a href="kontakt.html">Anfrage stellen</a></p></div>';

    el.innerHTML = out;

    el.querySelectorAll("[data-sub]").forEach(function (i) {
      i.addEventListener("change", function () {
        i.checked ? state.subs.add(i.dataset.sub) : state.subs.delete(i.dataset.sub);
        state.shown = PAGE; render();
      });
    });
    el.querySelectorAll("[data-band]").forEach(function (i) {
      i.addEventListener("change", function () {
        state.price = PRICE_BANDS[+i.dataset.band][1]; state.shown = PAGE; render();
      });
    });
    el.querySelectorAll("[data-only]").forEach(function (i) {
      i.addEventListener("change", function () {
        i.checked ? state.only.add(i.dataset.only) : state.only.delete(i.dataset.only);
        state.shown = PAGE; render();
      });
    });
    el.querySelector("[data-reset]").addEventListener("click", function () {
      state.subs = new Set(); state.price = null; state.only = new Set();
      state.shown = PAGE; render();
    });
  }

  function render() {
    var list = filtered();
    var grid = document.querySelector("[data-grid]");
    document.querySelector("[data-count]").textContent =
      list.length === 1 ? "1 Artikel" : list.length + " Artikel";
    if (!list.length) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1">' +
        "<p><b>Kein Artikel gefunden.</b></p>" +
        "<p>Wir konfektionieren jede Matte nach Maß — auch was nicht im Shop steht.</p>" +
        '<a class="btn" href="kontakt.html">Anfrage stellen</a></div>';
      document.querySelector("[data-more]").innerHTML = "";
      return;
    }
    grid.innerHTML = list.slice(0, state.shown).map(MF.card).join("");
    var more = document.querySelector("[data-more]");
    more.innerHTML = list.length > state.shown
      ? '<button class="btn btn--ghost btn--lg" type="button" data-loadmore>Weitere ' +
        Math.min(PAGE, list.length - state.shown) + " Artikel anzeigen</button>" : "";
    var b = more.querySelector("[data-loadmore]");
    if (b) b.addEventListener("click", function () { state.shown += PAGE; render(); });
    MF.initReveal();
    filters();
  }

  head();
  filters();
  render();
  document.getElementById("sort").addEventListener("change", function (e) {
    state.sort = e.target.value; render();
  });
  var ft = document.querySelector("[data-filter-toggle]");
  if (ft) {
    if (window.matchMedia("(max-width:860px)").matches) ft.style.display = "";
    ft.addEventListener("click", function () {
      document.querySelector(".filters").classList.toggle("is-open");
    });
  }
  MF.boot();
  var q = document.getElementById("q");
  if (q && state.q) q.value = state.q;
})();
