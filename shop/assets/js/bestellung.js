/* Bestellbestätigung (Demo) */
(function () {
  "use strict";
  var C = window.CATALOG;
  var box = document.querySelector("[data-confirm]");
  var order = null;
  try { order = JSON.parse(sessionStorage.getItem("mattenfuchs.order")); } catch (e) {}

  if (!order) {
    box.innerHTML = '<div class="empty" style="border:1px solid var(--c-line);border-radius:4px;margin-block:32px 60px">' +
      "<h1>Keine Bestellung vorhanden</h1>" +
      "<p>Diese Seite zeigt die Bestätigung nach einem Demo-Kauf.</p>" +
      '<a class="btn" href="kategorie.html">Zum Sortiment</a></div>';
    MF.boot();
    return;
  }

  var PAY = {
    paypal: "PayPal", rechnung: "Kauf auf Rechnung",
    vorkasse: "Vorkasse per Überweisung", karte: "Kreditkarte"
  };
  var k = order.kunde;
  var quotes = order.items.filter(function (i) { return i.quote; });

  box.innerHTML =
    '<div style="max-width:860px;margin-block:36px 0">' +
      '<div style="width:64px;height:64px;border-radius:50%;background:#e6f6ec;color:#1a7f45;' +
      'display:grid;place-items:center;margin-bottom:20px">' + MF.icon("check", "ico--lg") + "</div>" +
      "<h1>Vielen Dank für Ihre Bestellung!</h1>" +
      '<p class="lead">Ihre Bestellnummer lautet <b>' + MF.esc(order.nr) + "</b>. Eine Bestätigung " +
      "ginge an <b>" + MF.esc(k.mail) + "</b>.</p>" +
      '<div class="demo-note" style="max-width:640px">' + MF.icon("info") +
      "<div><b>Demo-Bestellung</b>Diese Bestellung wurde nicht ausgeführt. Es wurde keine " +
      "Zahlung ausgelöst und keine E-Mail versendet.</div></div>" +
    "</div>" +

    '<div class="cart-layout" style="padding-top:8px">' +
      "<div>" +
        '<h2 style="font-size:20px">Bestellte Artikel</h2>' +
        order.items.map(function (i) {
          var opts = Object.keys(i.options || {}).map(function (key) {
            return "<span><b>" + MF.esc(key) + ":</b> " + MF.esc(i.options[key]) + "</span>";
          }).join("");
          return '<div class="cart-item">' +
            '<img src="' + (i.image ? MF.root + i.image : MF.PLACEHOLDER) + '" alt="">' +
            "<div><h3>" + MF.esc(i.name) + "</h3>" +
            (opts ? '<p class="cart-item__opts">' + opts + "</p>" : "") +
            '<p style="font-size:14px;color:var(--c-ink-muted);margin:0">Menge: ' + i.qty + "</p></div>" +
            '<div class="cart-item__right"><div class="price">' +
            (i.quote ? "auf Anfrage" : MF.eur(i.price * i.qty)) + "</div></div></div>";
        }).join("") +

        (quotes.length
          ? '<div class="demo-note" style="background:var(--c-cyan-50);border-color:var(--c-cyan-300);' +
            'color:var(--c-navy-900);margin-top:24px">' + MF.icon("ruler") +
            "<div><b>" + quotes.length + " Sonderanfertigung(en)</b>Für diese Positionen erhalten Sie " +
            "ein verbindliches Angebot — in der Regel innerhalb von 24 Stunden.</div></div>"
          : "") +

        '<div class="grid g-2" style="margin-top:36px">' +
          '<div><h3 style="font-size:16px">Rechnungsanschrift</h3>' +
            '<p style="font-size:15px;line-height:1.7;color:var(--c-ink-muted)">' +
            (k.firma ? MF.esc(k.firma) + "<br>" : "") + MF.esc(k.name) + "<br>" +
            MF.esc(k.strasse) + "<br>" + (k.zusatz ? MF.esc(k.zusatz) + "<br>" : "") +
            MF.esc(k.plz) + " " + MF.esc(k.ort) + "<br>" + MF.esc(k.land) +
            (k.tel ? "<br>Tel. " + MF.esc(k.tel) : "") + "</p></div>" +
          '<div><h3 style="font-size:16px">Zahlung &amp; Versand</h3>' +
            '<p style="font-size:15px;line-height:1.7;color:var(--c-ink-muted)">' +
            "Zahlart: <b>" + MF.esc(PAY[order.pay] || order.pay) + "</b>" +
            (order.ppid ? '<br>Transaktion: <span style="font-family:monospace">' +
              MF.esc(order.ppid) + "</span>" : "") +
            "<br>Bestelldatum: " + MF.esc(order.datum) +
            "<br>Versand: " + (order.shipping === 0 ? "frachtfrei" : MF.eur(order.shipping)) +
            "</p></div>" +
        "</div>" +

        (order.hinweis
          ? '<div style="margin-top:28px"><h3 style="font-size:16px">Ihre Nachricht</h3>' +
            '<p style="font-size:15px;color:var(--c-ink-muted)">' + MF.esc(order.hinweis) + "</p></div>"
          : "") +

        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:32px">' +
          '<a class="btn" href="kategorie.html">Weiter einkaufen</a>' +
          '<button class="btn btn--ghost" type="button" onclick="window.print()">Bestätigung drucken</button>' +
        "</div>" +
      "</div>" +

      '<aside class="summary">' +
        "<h2>Summe</h2>" +
        '<div class="summary__row"><span>Zwischensumme</span><b>' + MF.eur(order.sum) + "</b></div>" +
        '<div class="summary__row"><span>Versand</span><b>' +
          (order.shipping === 0 ? "frachtfrei" : MF.eur(order.shipping)) + "</b></div>" +
        '<div class="summary__row summary__row--total"><span>Gesamt</span><span>' +
          MF.eur(order.total) + "</span></div>" +
        '<div class="summary__row" style="padding-top:0">' +
          '<span style="font-size:13px;color:var(--c-ink-muted)">darin 19 % MwSt.</span>' +
          '<span style="font-size:13px;color:var(--c-ink-muted)">' + MF.eur(order.vat) + "</span></div>" +
        '<p class="summary__note">Fragen zur Bestellung? ' +
          '<a href="tel:+491717755400">+49 171 77 55 400</a> oder ' +
          '<a href="mailto:info@matten.de">info@matten.de</a></p>' +
      "</aside>" +
    "</div>";

  var have = order.items.map(function (i) { return i.slug; });
  var pool = C.products.filter(function (p) { return p.image && have.indexOf(p.slug) < 0; });
  document.querySelector("[data-more]").innerHTML = pool.slice(0, 4).map(MF.card).join("");

  MF.boot();
  MF.initReveal();
})();
