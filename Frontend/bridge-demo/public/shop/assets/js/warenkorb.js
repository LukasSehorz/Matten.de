/* =============================================================================
   Warenkorb — BRÜCKEN-FASSUNG

   Der Warenkorb liegt in der PHP-Sitzung von matten.de. Diese Seite zeigt ihn
   nur an und schickt Änderungen dorthin zurück:
     Anzeigen        ->  GET  /api/cart
     Menge / löschen ->  POST /api/cart/menge
     Leeren          ->  POST /api/cart/clear
     Beweis          ->  GET  /api/cart/raw  (Rohantwort des Altsystems)

   Kein Betrag auf dieser Seite wird gerechnet. Zwischensumme, Versand,
   Umsatzsteuer und Gesamtsumme sind die Texte, die das Altsystem liefert.
   ========================================================================== */
(function () {
  "use strict";
  var C = window.CATALOG || { categories: [], products: [] };

  document.querySelectorAll("[data-ico]").forEach(function (el) {
    el.innerHTML = MF.icon(el.dataset.ico);
  });

  var box = document.querySelector("[data-items]");
  var sum = document.querySelector("[data-summary]");
  var busy = false;

  /* Die Position im Altsystem trägt keinen Produktpfad. Über den Namen finden
     wir den Katalogeintrag — für Bild und Verlinkung. Klappt das nicht, gibt
     es einen Platzhalter statt eines falschen Bildes. */
  function katalogTreffer(name) {
    if (!name) return null;
    var n = String(name).trim().toLowerCase();
    return C.products.filter(function (p) {
      return String(p.name || "").trim().toLowerCase() === n;
    })[0] || null;
  }

  function itemHTML(it) {
    var p = katalogTreffer(it.name);
    var img = p && p.image ? p.image : MF.PLACEHOLDER;
    var href = p ? MF.prodHref(p) : null;
    var zeilen = [];
    if (it.attribut) zeilen.push("<span>" + MF.esc(it.attribut) + "</span>");
    if (it.kommentar) zeilen.push("<span><b>Anmerkung:</b> " + MF.esc(it.kommentar) + "</span>");

    return '<div class="cart-item" data-key="' + MF.esc(it.key || "") + '">' +
      (href ? '<a href="' + href + '">' : "<span>") +
        '<img src="' + img + '" alt="">' + (href ? "</a>" : "</span>") +
      "<div>" +
        "<h3>" + (href ? '<a href="' + href + '" style="color:var(--c-navy-900)">' : "") +
          MF.esc(it.name || "Position ohne Namen") + (href ? "</a>" : "") + "</h3>" +
        (zeilen.length ? '<p class="cart-item__opts">' + zeilen.join("") + "</p>" : "") +
        '<div class="qty"><button type="button" data-dec aria-label="weniger">–</button>' +
        '<input type="text" inputmode="numeric" value="' + (it.anzahl || 1) +
          '" data-q aria-label="Anzahl">' +
        '<button type="button" data-inc aria-label="mehr">+</button></div>' +
      "</div>" +
      '<div class="cart-item__right">' +
        '<div class="price">' + MF.esc(it.summe || it.preis || "—") +
          (it.preis ? "<small>" + MF.esc(it.preis) + " je Stück</small>" : "") + "</div>" +
        '<button class="linkbtn" type="button" data-del>Entfernen</button>' +
      "</div>" +
    "</div>";
  }

  function zusammenfassung(s) {
    var zeile = function (label, wert) {
      if (!wert) return "";
      return '<div class="summary__row"><span>' + MF.esc(label) + "</span><b>" +
        MF.esc(wert) + "</b></div>";
    };
    return "<h2>Zusammenfassung</h2>" +
      zeile("Zwischensumme", s.zwischensumme) +
      zeile("Versandkosten", s.versand) +
      zeile("Umsatzsteuer" + (s.ustSatz != null ? " (" + s.ustSatz + " %)" : ""), s.umsatzsteuer) +
      '<div class="summary__row summary__row--total"><span>Gesamtsumme</span><span>' +
        MF.esc(s.gesamt || "—") + "</span></div>" +
      '<p class="summary__note">Alle Beträge stammen unverändert aus dem Warenkorb von ' +
        "matten.de. Diese Oberfläche rechnet nichts nach.</p>" +
      '<a class="btn btn--lg btn--block" href="kasse.html" style="margin-top:18px">Zur Kasse</a>' +
      '<p class="summary__note"><a href="/api/cart/raw" target="_blank" rel="noopener">' +
        "Rohantwort von matten.de ansehen</a> — die Original-Warenkorbseite des alten Shops " +
        "mit genau diesen Positionen.</p>";
  }

  function leer(text) {
    box.innerHTML = '<div class="empty" style="border:1px solid var(--c-line);border-radius:4px">' +
      "<h2>Ihr Warenkorb ist leer</h2>" +
      "<p>" + MF.esc(text || "Im Warenkorb des Altsystems liegt derzeit nichts.") + "</p>" +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
      '<a class="btn" href="kategorie.html">Zum Sortiment</a>' +
      '<a class="btn btn--ghost" href="kontakt.html">Anfrage stellen</a></div></div>';
    sum.innerHTML = "";
    document.querySelector("[data-crosssell-wrap]").style.display = "";
    crosssell([]);
  }

  function render(j) {
    if (!j || !j.ok) {
      box.innerHTML = MF.apiFehler(j, "Warenkorb lesen");
      sum.innerHTML = "";
      return;
    }
    var items = j.items || [];
    if (!items.length) { leer(); return; }

    box.innerHTML = items.map(itemHTML).join("");
    sum.innerHTML = zusammenfassung(j);

    box.querySelectorAll(".cart-item").forEach(function (el) {
      var key = el.dataset.key;
      var inp = el.querySelector("[data-q]");
      /* Neu gezeichnet wird über das cart:change-Ereignis, das MF.cart
         auslöst — hier nur der Zustand während der Wartezeit. */
      function setzen(n) {
        if (busy || !key) return;
        busy = true;
        el.style.opacity = ".5";
        MF.cart.setQty(key, n).then(function (r) {
          busy = false;
          if (!r || !r.ok) MF.toast("Das Altsystem hat die Änderung nicht übernommen.");
        });
      }
      el.querySelector("[data-inc]").addEventListener("click", function () {
        setzen((parseInt(inp.value, 10) || 1) + 1);
      });
      el.querySelector("[data-dec]").addEventListener("click", function () {
        setzen(Math.max(0, (parseInt(inp.value, 10) || 1) - 1));
      });
      inp.addEventListener("change", function () {
        setzen(Math.max(0, parseInt(inp.value, 10) || 0));
      });
      el.querySelector("[data-del]").addEventListener("click", function () { setzen(0); });
    });

    document.querySelector("[data-crosssell-wrap]").style.display = "";
    crosssell(items);
  }

  function crosssell(items) {
    var namen = items.map(function (i) { return String(i.name || "").toLowerCase(); });
    var kats = {};
    items.forEach(function (i) {
      var p = katalogTreffer(i.name);
      if (p) kats[p.cat] = true;
    });
    var pool = C.products.filter(function (p) {
      return p.image && namen.indexOf(String(p.name || "").toLowerCase()) < 0 &&
        (Object.keys(kats).length ? kats[p.cat] : true);
    });
    document.querySelector("[data-crosssell]").innerHTML = pool.slice(0, 4).map(MF.card).join("");
    MF.initReveal();
  }

  document.querySelector("[data-clear]").addEventListener("click", function () {
    if (busy) return;
    busy = true;
    box.innerHTML = '<div class="bridge-load">Der Warenkorb wird bei matten.de geleert …</div>';
    MF.cart.clear().then(function () {
      busy = false;
      MF.toast("Warenkorb im Altsystem geleert.");
    });
  });

  box.innerHTML = '<div class="bridge-load">Der Warenkorb wird bei matten.de gelesen …</div>';
  MF.boot();
  document.addEventListener("cart:change", function (e) {
    if (e.detail) render(e.detail);
  });
})();
