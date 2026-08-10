/* Warenkorb */
(function () {
  "use strict";
  var C = window.CATALOG;

  document.querySelectorAll("[data-ico]").forEach(function (el) {
    el.innerHTML = MF.icon(el.dataset.ico);
  });

  function itemHTML(it, i) {
    var opts = Object.keys(it.options || {}).map(function (k) {
      return "<span><b>" + MF.esc(k) + ":</b> " + MF.esc(it.options[k]) + "</span>";
    }).join("");
    var img = it.image ? MF.root + it.image : MF.PLACEHOLDER;
    return '<div class="cart-item">' +
      '<a href="produkt.html?p=' + encodeURIComponent(it.slug) + '"><img src="' + img + '" alt=""></a>' +
      "<div>" +
        '<h3><a href="produkt.html?p=' + encodeURIComponent(it.slug) + '" style="color:var(--c-navy-900)">' +
        MF.esc(it.name) + "</a></h3>" +
        (opts ? '<p class="cart-item__opts">' + opts + "</p>" : "") +
        (it.quote ? '<p style="font-size:13.5px;color:var(--c-signal);margin:0 0 10px">' +
          "Sonderanfertigung — Preis folgt mit unserem Angebot</p>" : "") +
        '<div class="qty"><button type="button" data-dec="' + i + '" aria-label="weniger">–</button>' +
        '<input type="text" inputmode="numeric" value="' + it.qty + '" data-q="' + i + '" aria-label="Anzahl">' +
        '<button type="button" data-inc="' + i + '" aria-label="mehr">+</button></div>' +
      "</div>" +
      '<div class="cart-item__right">' +
        '<div class="price">' + (it.quote ? "auf Anfrage" : MF.eur(it.price * it.qty)) +
        (it.quote ? "" : "<small>" + MF.eur(it.price) + " je Stück</small>") + "</div>" +
        '<button class="linkbtn" type="button" data-del="' + i + '">Entfernen</button>' +
      "</div>" +
    "</div>";
  }

  function render() {
    var t = MF.cart.totals();
    var box = document.querySelector("[data-items]");
    var sum = document.querySelector("[data-summary]");

    if (!t.items.length) {
      box.innerHTML = '<div class="empty" style="border:1px solid var(--c-line);border-radius:4px">' +
        "<h2>Ihr Warenkorb ist leer</h2>" +
        "<p>Stöbern Sie im Sortiment oder fragen Sie direkt eine Sonderanfertigung an.</p>" +
        '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">' +
        '<a class="btn" href="kategorie.html">Zum Sortiment</a>' +
        '<a class="btn btn--ghost" href="kontakt.html">Anfrage stellen</a></div></div>';
      sum.innerHTML = "";
      document.querySelector("[data-crosssell-wrap]").style.display = "";
      crosssell();
      return;
    }

    box.innerHTML = t.items.map(itemHTML).join("");

    var quotes = t.items.filter(function (i) { return i.quote; }).length;
    var freeIn = 1000 - t.sum;
    sum.innerHTML =
      "<h2>Zusammenfassung</h2>" +
      '<div class="summary__row"><span>Zwischensumme</span><b>' + MF.eur(t.sum) + "</b></div>" +
      '<div class="summary__row"><span>Versand ' +
        (t.shipping === 0 ? "(frachtfrei)" : t.qm > 1.8 ? "(über 1,8 m²)" : "(bis 1,8 m²)") +
        "</span><b>" + (t.shipping === 0 ? "0,00 €" : MF.eur(t.shipping)) + "</b></div>" +
      (t.qm ? '<div class="summary__row"><span>Mattenfläche gesamt</span><span>' +
        t.qm.toLocaleString("de-DE", { maximumFractionDigits: 2 }) + " m²</span></div>" : "") +
      '<div class="summary__row summary__row--total"><span>Gesamt</span><span>' + MF.eur(t.total) + "</span></div>" +
      '<div class="summary__row" style="padding-top:0"><span style="font-size:13px;color:var(--c-ink-muted)">' +
        "darin 19 % MwSt.</span><span style=\"font-size:13px;color:var(--c-ink-muted)\">" +
        MF.eur(t.vat) + "</span></div>" +
      (freeIn > 0 && t.shipping > 0
        ? '<p class="summary__note">Noch <b>' + MF.eur(freeIn) + "</b> bis zur frachtfreien Lieferung.</p>"
        : "") +
      (quotes ? '<p class="summary__note">' + quotes + " Position(en) sind Sonderanfertigungen. " +
        "Der verbindliche Preis kommt mit unserem Angebot — meist innerhalb von 24 h.</p>" : "") +
      '<a class="btn btn--lg btn--block" href="kasse.html" style="margin-top:18px">Zur Kasse</a>' +
      '<button class="paypal-btn" type="button" data-paypal style="margin-top:10px">' +
        "<i><b>Pay</b><s>Pal</s></i> Direkt bezahlen</button>" +
      '<p class="summary__note">Zahlarten in dieser Demo nur beispielhaft — es wird nichts abgebucht.</p>';

    sum.querySelector("[data-paypal]").addEventListener("click", function () {
      location.href = "kasse.html?pay=paypal";
    });

    box.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        MF.cart.remove(+b.dataset.del); render(); MF.toast("Position entfernt.");
      });
    });
    box.querySelectorAll("[data-inc]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = +b.dataset.inc;
        MF.cart.setQty(i, MF.cart.read()[i].qty + 1); render();
      });
    });
    box.querySelectorAll("[data-dec]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = +b.dataset.dec;
        MF.cart.setQty(i, MF.cart.read()[i].qty - 1); render();
      });
    });
    box.querySelectorAll("[data-q]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        MF.cart.setQty(+inp.dataset.q, parseInt(inp.value, 10) || 1); render();
      });
    });

    document.querySelector("[data-crosssell-wrap]").style.display = "";
    crosssell();
  }

  function crosssell() {
    var cart = MF.cart.read();
    var cats = {};
    cart.forEach(function (i) {
      var p = MF.bySlug(i.slug);
      if (p) cats[p.cat] = true;
    });
    var have = cart.map(function (i) { return i.slug; });
    var pool = C.products.filter(function (p) {
      return p.image && have.indexOf(p.slug) < 0 &&
        (Object.keys(cats).length ? cats[p.cat] : p.badge === "Topseller");
    });
    if (pool.length < 4) {
      pool = pool.concat(C.products.filter(function (p) {
        return p.image && have.indexOf(p.slug) < 0 && pool.indexOf(p) < 0;
      }));
    }
    document.querySelector("[data-crosssell]").innerHTML = pool.slice(0, 4).map(MF.card).join("");
    MF.initReveal();
  }

  document.querySelector("[data-clear]").addEventListener("click", function () {
    if (!MF.cart.read().length) return;
    MF.cart.clear(); render(); MF.toast("Warenkorb geleert.");
  });

  render();
  MF.boot();
})();
