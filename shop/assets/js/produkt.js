/* Produktdetailseite mit Konfigurator */
(function () {
  "use strict";
  var C = window.CATALOG;
  var p = MF.bySlug(MF.qs("p") || "");

  if (!p) {
    document.querySelector("[data-pdp]").innerHTML =
      '<div class="empty" style="grid-column:1/-1"><h1>Artikel nicht gefunden</h1>' +
      "<p>Der gewünschte Artikel ist nicht (mehr) im Shop hinterlegt.</p>" +
      '<a class="btn" href="kategorie.html">Zum Sortiment</a></div>';
    MF.boot();
    return;
  }

  document.title = p.name + " – Mattenfuchs";
  var cat = MF.cat(p.cat);

  /* ---------- Bilder ------------------------------------------------------ */
  function images() {
    var out = [];
    if (p.image) out.push(MF.root + p.image);
    if (!out.length) out.push(MF.PLACEHOLDER);
    return out;
  }
  var IMGS = images();

  /* ---------- Größen / Preise -------------------------------------------- */
  var sizes = (p.sizes || []).filter(function (r) { return r.size; });
  var complete = sizes.filter(function (r) { return r.complete && r.price > 0; });
  var sel = {
    size: complete.length ? complete[0].size : (sizes[0] ? sizes[0].size : null),
    color: p.colors.length ? p.colors[0].value : null,
    attrs: {},
    qty: 1,
    breite: null,
    laenge: null,
    kommentar: ""
  };
  (p.attrs || []).forEach(function (a) { sel.attrs[a.label] = a.default || a.values[0]; });

  function row() {
    return sizes.filter(function (r) { return r.size === sel.size; })[0] || null;
  }
  function isCustom() {
    var r = row();
    return !r || !r.complete || r.price <= 0 || /Ma(ß|ss)anfertigung|Sonderma/i.test(sel.size || "");
  }
  function unitPrice() {
    var r = row();
    return r && r.complete && r.price > 0 ? r.price : 0;
  }
  function qm() {
    var m = String(sel.size || "").match(/(\d+)\s*cm\s*x\s*(\d+)\s*cm/i);
    if (m) return (+m[1] / 100) * (+m[2] / 100);
    if (sel.breite && sel.laenge) return (sel.breite / 100) * (sel.laenge / 100);
    return 0;
  }

  /* ---------- Aufbau ------------------------------------------------------ */
  var crumbs = ['<a href="index.html">Start</a><span>›</span>'];
  crumbs.push('<a href="kategorie.html?cat=' + p.cat + '">' + MF.esc(cat ? cat.short : "Sortiment") + "</a>");
  if (p.sub && p.subName) {
    crumbs.push('<span>›</span><a href="kategorie.html?cat=' + p.cat + "&sub=" + p.sub + '">' +
      MF.esc(p.subName) + "</a>");
  }
  crumbs.push("<span>›</span>" + MF.esc(MF.trim(p.name, 52)));
  document.querySelector("[data-crumbs]").innerHTML = crumbs.join("");

  function optHTML() {
    var out = "";

    if (p.colors.length) {
      out += '<div class="opt"><div class="opt__label">Grundfarbe <em data-colorname>' +
        MF.esc(p.colors[0].name) + "</em></div><div class=\"opt__swatches\">" +
        p.colors.map(function (c, i) {
          var f = c.swatch ? c.swatch.split("/").pop() : "";
          var bg = f ? 'style="background-image:url(assets/img/swatches/' + f + ')"' : "";
          return '<button class="opt__swatch' + (i === 0 ? " is-active" : "") + '" type="button" ' +
            bg + ' data-color="' + MF.esc(c.value) + '" title="' + MF.esc(c.name) +
            '" aria-label="' + MF.esc(c.name) + '"></button>';
        }).join("") + "</div></div>";
    }

    if (sizes.length) {
      out += '<div class="opt"><div class="opt__label">' +
        MF.esc(p.sizeLabel || "Größe") + "</div><select data-size>" +
        sizes.map(function (r) {
          var lbl = r.size + (r.complete && r.price > 0 ? " — " + MF.eur(r.price) : " — Preis nach Aufmaß");
          return '<option value="' + MF.esc(r.size) + '">' + MF.esc(lbl) + "</option>";
        }).join("") + "</select></div>";
    }

    (p.attrs || []).forEach(function (a) {
      /* Die Breiten-Auswahl gehoert zum Wunschmaß und wird nur dort gezeigt. */
      var onlyCustom = /^Breite/i.test(a.label);
      out += '<div class="opt"' + (onlyCustom ? ' data-onlycustom style="display:none"' : "") +
        '><div class="opt__label">' + MF.esc(a.label) + "</div>" +
        '<select data-attr="' + MF.esc(a.label) + '">' +
        a.values.map(function (v) {
          return '<option' + (v === a.default ? " selected" : "") + ">" + MF.esc(v) + "</option>";
        }).join("") + "</select></div>";
    });

    if (p.custom) {
      out += '<div class="opt" data-customsize style="display:none">' +
        '<div class="opt__label">Wunschmaß <em>Breite × Länge in cm</em></div>' +
        '<div class="opt__row">' +
        '<input type="number" data-breite placeholder="Breite in cm" min="40" max="200">' +
        '<input type="number" data-laenge placeholder="Länge in cm" min="' +
        MF.esc(p.custom.min || 40) + '" max="' + MF.esc(p.custom.max || 700) + '">' +
        "</div><p style=\"font-size:13px;color:var(--c-ink-muted);margin:8px 0 0\">" +
        "Mindestmaß " + MF.esc(p.custom.min || 40) + " cm, Maximalmaß " +
        MF.esc(p.custom.max || 700) + " cm Länge. Der verbindliche Preis kommt mit dem Angebot.</p></div>";
    }

    out += '<div class="opt"><div class="opt__label">Anmerkung zur Bestellung <em>optional</em></div>' +
      '<input type="text" data-kommentar placeholder="z. B. Logo-Datei folgt per E-Mail"></div>';

    return out;
  }

  var pdp = document.querySelector("[data-pdp]");
  pdp.innerHTML =
    "<div>" +
      '<div class="gallery__main"><img data-mainimg src="' + IMGS[0] + '" alt="' + MF.esc(p.name) + '"></div>' +
      (IMGS.length > 1 ? '<div class="gallery__thumbs">' + IMGS.map(function (s, i) {
        return '<button type="button" class="' + (i === 0 ? "is-active" : "") + '" data-thumb="' + i +
          '"><img src="' + s + '" alt=""></button>';
      }).join("") + "</div>" : "") +
    "</div>" +
    "<div>" +
      '<p class="pdp__kicker">' + MF.esc(p.subName || (cat ? cat.short : "")) + "</p>" +
      "<h1>" + MF.esc(p.name) + "</h1>" +
      (p.teaser ? '<p class="lead">' + MF.esc(p.teaser) + "</p>" : "") +
      '<div class="pdp__price"><b data-price></b><span data-pricehint style="font-size:14px;color:var(--c-ink-muted)"></span></div>' +
      '<p class="pdp__vat">inkl. 19 % MwSt. · zzgl. Versand (' +
        (p.shipping ? MF.eur(p.shipping) : "5,00 €") + ' in Deutschland, ab 1.000 € frachtfrei)</p>' +
      optHTML() +
      '<div class="buybar">' +
        '<div class="qty"><button type="button" data-minus aria-label="weniger">–</button>' +
        '<input type="text" inputmode="numeric" value="1" data-qty aria-label="Anzahl">' +
        '<button type="button" data-plus aria-label="mehr">+</button></div>' +
        '<button class="btn btn--lg" type="button" data-add>In den Warenkorb</button>' +
        '<a class="btn btn--lg btn--ghost" href="kontakt.html?artikel=' + encodeURIComponent(p.name) + '">Angebot anfordern</a>' +
      "</div>" +
      '<div class="pdp__trust">' +
        "<div>" + MF.icon("checkC") + "<span>Konfektioniert nach Ihren Maßen — auch Sonderformen</span></div>" +
        "<div>" + MF.icon("checkC") + "<span>Persönliche Beratung unter +49 171 77 55 400</span></div>" +
        "<div>" + MF.icon("checkC") + "<span>Versand in Deutschland ab 5,00 € · ab 1.000 € frachtfrei</span></div>" +
      "</div>" +
    "</div>";

  /* ---------- Tabs -------------------------------------------------------- */
  function specRows() {
    var rows = [];
    if (p.sizeLabel && sizes.length) {
      rows.push([p.sizeLabel, sizes.map(function (r) { return r.size; }).join(" · ")]);
    }
    if (p.colors.length) {
      rows.push(["Farbauswahl", p.colors.length + " Farben: " +
        p.colors.map(function (c) { return c.name; }).join(", ")]);
    }
    if (p.designs) rows.push(["Designfarben", p.designs + " Gestaltungsfarben zur Auswahl"]);
    (p.attrs || []).forEach(function (a) { rows.push([a.label, a.values.join(" · ")]); });
    if (p.custom) {
      rows.push(["Wunschmaße", "Länge von " + (p.custom.min || 40) + " cm bis " +
        (p.custom.max || 700) + " cm"]);
    }
    if (p.features && p.features.length) rows.push(["Merkmale", p.features.join(" · ")]);
    rows.push(["Kategorie", (cat ? cat.name : "") + (p.subName ? " › " + p.subName : "")]);
    return rows;
  }

  var TABS = [
    ["Beschreibung", (p.desc && p.desc.length
      ? p.desc.map(function (d) { return "<p>" + MF.esc(d) + "</p>"; }).join("")
      : "<p>" + MF.esc(p.teaser || "") + "</p>")],
    ["Technische Daten",
      '<table class="spec"><tbody>' + specRows().map(function (r) {
        return "<tr><th>" + MF.esc(r[0]) + "</th><td>" + MF.esc(r[1]) + "</td></tr>";
      }).join("") + "</tbody></table>"],
    ["Versand &amp; Widerruf",
      "<h3>Versandkosten</h3><ul>" +
      "<li>bis 1,8 m²: <b>5,00 €</b> (Deutschland, ohne Inseln)</li>" +
      "<li>ab 1,8 m² bis 999,99 €: <b>10,00 €</b></li>" +
      "<li>ab 1.000,00 € Bestellwert: <b>frachtfrei</b></li></ul>" +
      "<h3>Widerrufsrecht</h3><p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von " +
      "Gründen diesen Vertrag zu widerrufen.</p>" +
      "<h3>Ausschluss des Widerrufsrechts</h3><p>Bei den von uns angebotenen Produkten handelt " +
      "es sich um Waren, die von uns konfektioniert und von unseren Vertragslieferanten " +
      "individuell nach Ihren Vorgaben angefertigt werden. Gemäß § 312g Abs. 2 Nr. 1 BGB besteht " +
      "für solche Sonderanfertigungen kein Widerrufsrecht. Ihr gesetzliches Recht auf " +
      "Gewährleistung bei Mängeln bleibt davon unberührt.</p>" +
      '<p><a href="widerruf.html">Vollständige Widerrufsbelehrung</a> · ' +
      '<a href="versand.html">Versandinformationen</a></p>']
  ];
  document.querySelector("[data-tabs]").innerHTML = TABS.map(function (t, i) {
    return '<button type="button" class="' + (i === 0 ? "is-active" : "") + '" data-tab="' + i + '">' +
      t[0] + "</button>";
  }).join("");
  document.querySelector("[data-tabpanels]").innerHTML = TABS.map(function (t, i) {
    return '<div class="tabpanel prose' + (i === 0 ? " is-active" : "") +
      '" data-panel="' + i + '" style="padding-block:0">' + t[1] + "</div>";
  }).join("");
  document.querySelectorAll("[data-tab]").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("[data-tab]").forEach(function (x) { x.classList.remove("is-active"); });
      document.querySelectorAll("[data-panel]").forEach(function (x) { x.classList.remove("is-active"); });
      b.classList.add("is-active");
      document.querySelector('[data-panel="' + b.dataset.tab + '"]').classList.add("is-active");
    });
  });

  /* ---------- Ähnliche Artikel -------------------------------------------- */
  var rel = C.products.filter(function (x) {
    return x.slug !== p.slug && x.cat === p.cat && (!p.sub || x.sub === p.sub) && x.image;
  });
  if (rel.length < 4) {
    rel = rel.concat(C.products.filter(function (x) {
      return x.slug !== p.slug && x.cat === p.cat && rel.indexOf(x) < 0 && x.image;
    }));
  }
  if (rel.length < 4) {
    rel = rel.concat(C.products.filter(function (x) {
      return x.slug !== p.slug && rel.indexOf(x) < 0 && x.image;
    }));
  }
  document.querySelector("[data-related]").innerHTML = rel.slice(0, 4).map(MF.card).join("");

  /* ---------- Preis / Interaktion ----------------------------------------- */
  var $price = pdp.querySelector("[data-price]");
  var $hint = pdp.querySelector("[data-pricehint]");
  var $custom = pdp.querySelector("[data-customsize]");
  var $add = pdp.querySelector("[data-add]");

  function paint() {
    var custom = isCustom();
    if ($custom) $custom.style.display = custom ? "" : "none";
    pdp.querySelectorAll("[data-onlycustom]").forEach(function (el) {
      el.style.display = custom ? "" : "none";
    });
    if (custom) {
      $price.textContent = "Preis nach Aufmaß";
      $price.style.fontSize = "26px";
      $hint.textContent = "Wir kalkulieren Ihr Wunschmaß und melden uns meist binnen 24 h.";
      $add.textContent = "Anfrage in den Warenkorb";
    } else {
      $price.style.fontSize = "";
      $price.textContent = MF.eur(unitPrice() * sel.qty);
      $hint.textContent = sel.qty > 1 ? "(" + MF.eur(unitPrice()) + " je Stück)" : "";
      $add.textContent = "In den Warenkorb";
    }
  }

  pdp.querySelectorAll("[data-color]").forEach(function (b) {
    b.addEventListener("click", function () {
      pdp.querySelectorAll("[data-color]").forEach(function (x) { x.classList.remove("is-active"); });
      b.classList.add("is-active");
      sel.color = b.dataset.color;
      var c = p.colors.filter(function (x) { return x.value === sel.color; })[0];
      var el = pdp.querySelector("[data-colorname]");
      if (el && c) el.textContent = c.name;
    });
  });
  var $size = pdp.querySelector("[data-size]");
  if ($size) $size.addEventListener("change", function () { sel.size = $size.value; paint(); });
  pdp.querySelectorAll("[data-attr]").forEach(function (s) {
    s.addEventListener("change", function () { sel.attrs[s.dataset.attr] = s.value; });
  });
  var $b = pdp.querySelector("[data-breite]"), $l = pdp.querySelector("[data-laenge]");
  if ($b) $b.addEventListener("input", function () { sel.breite = +$b.value || null; });
  if ($l) $l.addEventListener("input", function () { sel.laenge = +$l.value || null; });
  var $k = pdp.querySelector("[data-kommentar]");
  if ($k) $k.addEventListener("input", function () { sel.kommentar = $k.value; });

  var $qty = pdp.querySelector("[data-qty]");
  function setQty(n) {
    sel.qty = Math.max(1, Math.min(999, n | 0));
    $qty.value = sel.qty;
    paint();
  }
  pdp.querySelector("[data-minus]").addEventListener("click", function () { setQty(sel.qty - 1); });
  pdp.querySelector("[data-plus]").addEventListener("click", function () { setQty(sel.qty + 1); });
  $qty.addEventListener("change", function () { setQty(parseInt($qty.value, 10) || 1); });

  $add.addEventListener("click", function () {
    var custom = isCustom();
    if (custom && p.custom && (!sel.breite || !sel.laenge)) {
      MF.toast("Bitte Breite und Länge für das Wunschmaß angeben.");
      if ($b) $b.focus();
      return;
    }
    var options = {};
    if (sel.color) {
      var c = p.colors.filter(function (x) { return x.value === sel.color; })[0];
      options["Grundfarbe"] = c ? c.name : sel.color;
    }
    if (sel.size) options[p.sizeLabel || "Größe"] = sel.size;
    Object.keys(sel.attrs).forEach(function (k) { options[k] = sel.attrs[k]; });
    if (custom && sel.breite && sel.laenge) options["Wunschmaß"] = sel.breite + " × " + sel.laenge + " cm";
    if (sel.kommentar) options["Anmerkung"] = sel.kommentar;

    MF.cart.add({
      slug: p.slug,
      name: p.name,
      image: p.image || null,
      price: custom ? 0 : unitPrice(),
      quote: custom,
      qm: qm(),
      qty: sel.qty,
      options: options
    });
    MF.toast(custom ? "Anfrage im Warenkorb gespeichert." : "„" + MF.trim(p.name, 40) + "“ im Warenkorb.",
      "Zum Warenkorb", "warenkorb.html");
  });

  pdp.querySelectorAll("[data-thumb]").forEach(function (b) {
    b.addEventListener("click", function () {
      pdp.querySelectorAll("[data-thumb]").forEach(function (x) { x.classList.remove("is-active"); });
      b.classList.add("is-active");
      pdp.querySelector("[data-mainimg]").src = IMGS[+b.dataset.thumb];
    });
  });

  paint();
  MF.boot();
  MF.initReveal();
})();
