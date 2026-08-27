/* =============================================================================
   Produktdetailseite — BRÜCKEN-FASSUNG

   Alles auf dieser Seite kommt live aus dem Altsystem:
     Stammdaten, Bilder, Beschreibung, Varianten  ->  GET /api/produkt?pfad=…
     Preis (hängt an Menge und Variante)          ->  GET /api/price?pfad=…
     In den Warenkorb                             ->  POST /api/cart/add

   Es wird hier kein einziger Betrag gerechnet. Ändert der Kunde Menge oder
   Variante, fragt die Seite das Altsystem neu — genau wie es die Originalseite
   von matten.de mit ihrem "price_updates"-Feld auch tut.
   ========================================================================== */
(function () {
  "use strict";
  var C = window.CATALOG || { categories: [], products: [] };

  var pdp = document.querySelector("[data-pdp]");
  var slug = MF.qs("p") || "";
  var pfad = MF.qs("pfad") || "";

  /* Der Katalogeintrag ist nur für Brotkrumen und ähnliche Artikel nötig —
     die Wahrheit über den Artikel steht auf der Live-Seite. */
  var kat = slug ? MF.bySlug(slug) : null;
  if (!kat && pfad) {
    kat = C.products.filter(function (x) { return x.pfad === pfad; })[0] || null;
  }
  if (!pfad && kat) pfad = kat.pfad;

  function abbruch(titel, text) {
    pdp.innerHTML = '<div class="empty" style="grid-column:1/-1"><h1>' + MF.esc(titel) + "</h1>" +
      "<p>" + MF.esc(text) + "</p>" +
      '<a class="btn" href="kategorie.html">Zum Sortiment</a></div>';
    MF.boot();
  }

  if (!pfad) {
    abbruch("Artikel nicht gefunden",
      "Zu dieser Adresse gibt es im Live-Katalog von matten.de keinen Artikel.");
    return;
  }

  pdp.innerHTML = '<div class="bridge-load" style="grid-column:1/-1">' +
    "Der Artikel wird gerade bei matten.de gelesen …</div>";
  MF.boot();

  MF.api("/api/produkt?pfad=" + encodeURIComponent(pfad)).then(function (j) {
    if (!j || !j.ok || !j.produkt) {
      pdp.innerHTML = '<div style="grid-column:1/-1">' +
        MF.apiFehler(j, "Artikel laden") +
        '<p><a class="btn" href="kategorie.html">Zum Sortiment</a></p></div>';
      return;
    }
    aufbauen(j.produkt, j.kaufformular || {});
  });

  /* ======================================================================= */
  function aufbauen(p, kaufformular) {
    document.title = (p.name || p.artikelnummer) + " – Mattenfuchs";
    var anfrage = p.modus === "anfrage";
    var kaufbar = Boolean(p.kaufbar);

    /* ---------- Brotkrumen: die des Altsystems ---------------------------- */
    var crumbs = ['<a href="index.html">Start</a>'];
    if (kat) {
      var c = MF.cat(kat.cat);
      crumbs.push('<span>›</span><a href="kategorie.html?cat=' + encodeURIComponent(kat.cat) + '">' +
        MF.esc(c ? c.short : kat.cat) + "</a>");
      if (kat.sub && kat.subName) {
        crumbs.push('<span>›</span><a href="kategorie.html?cat=' + encodeURIComponent(kat.cat) +
          "&sub=" + encodeURIComponent(kat.sub) + '">' + MF.esc(kat.subName) + "</a>");
      }
    } else {
      (p.brotkrumen || []).slice(0, 2).forEach(function (b) {
        crumbs.push("<span>›</span>" + MF.esc(b.name || b.pfad));
      });
    }
    crumbs.push("<span>›</span>" + MF.esc(MF.trim(p.name || p.artikelnummer, 52)));
    document.querySelector("[data-crumbs]").innerHTML = crumbs.join("");

    /* ---------- Bilder: laufen alle über /api/img/ ------------------------ */
    var IMGS = (p.bilder || []).map(function (b) { return b.bild; }).filter(Boolean);
    if (!IMGS.length) IMGS = [MF.PLACEHOLDER];

    /* ---------- Auswahlfelder des Live-Kaufformulars ---------------------- */
    var attribute = p.attribute || [];
    var masse = p.masse || [];
    var sel = { werte: {}, anzahl: 1, kommentar: "" };
    attribute.forEach(function (a) {
      sel.werte[a.feld] = a.gewaehlt != null
        ? a.gewaehlt
        : ((a.optionen || [])[0] || {}).wert || "";
    });
    masse.forEach(function (m) { if (m.vorgabe) sel.werte[m.feld] = m.vorgabe; });

    function optHTML() {
      var out = "";

      attribute.forEach(function (a, i) {
        if (a.typ === "farbwahl") {
          out += '<div class="opt"><div class="opt__label">' + MF.esc(a.name) +
            ' <em data-colorname="' + i + '">' + MF.esc(bezeichnung(a, sel.werte[a.feld])) + "</em></div>" +
            '<select data-feld="' + MF.esc(a.feld) + '">' +
            (a.optionen || []).map(function (o) {
              return '<option value="' + MF.esc(o.wert) + '"' +
                (o.wert === sel.werte[a.feld] ? " selected" : "") + ">" +
                MF.esc(o.label || o.wert) + "</option>";
            }).join("") + "</select></div>";
          return;
        }
        out += '<div class="opt"><div class="opt__label">' + MF.esc(a.name) + "</div>" +
          '<select data-feld="' + MF.esc(a.feld) + '">' +
          (a.optionen || []).map(function (o) {
            return '<option value="' + MF.esc(o.wert) + '"' +
              (o.wert === sel.werte[a.feld] ? " selected" : "") + ">" +
              MF.esc(o.label || o.wert) + "</option>";
          }).join("") + "</select></div>";
      });

      if (masse.length) {
        out += '<div class="opt"><div class="opt__label">Freies Maß <em>in cm</em></div>' +
          '<div class="opt__row">' +
          masse.map(function (m) {
            var achse = /\[y\]$/.test(m.feld) ? "Länge" : (/\[x\]$/.test(m.feld) ? "Breite" : "Maß");
            return '<input type="number" data-feld="' + MF.esc(m.feld) + '" placeholder="' + achse +
              (m.min != null ? " ab " + m.min : "") + (m.max != null ? " bis " + m.max : "") + '"' +
              (m.min != null ? ' min="' + m.min + '"' : "") +
              (m.max != null ? ' max="' + m.max + '"' : "") +
              (m.vorgabe ? ' value="' + MF.esc(m.vorgabe) + '"' : "") + ">";
          }).join("") +
          '</div><p class="bridge-source">Grenzen und Feldnamen stammen aus dem Kaufformular ' +
          "von matten.de.</p></div>";
      }

      out += '<div class="opt"><div class="opt__label">Anmerkung zur Bestellung <em>optional</em></div>' +
        '<input type="text" data-kommentar maxlength="500" ' +
        'placeholder="z. B. Logo-Datei folgt per E-Mail"></div>';
      return out;
    }

    function bezeichnung(a, wert) {
      var o = (a.optionen || []).filter(function (x) { return x.wert === wert; })[0];
      return o ? (o.label || o.wert) : (wert || "");
    }

    /* ---------- Aufbau ---------------------------------------------------- */
    pdp.innerHTML =
      "<div>" +
        '<div class="gallery__main"><img data-mainimg src="' + IMGS[0] + '" alt="' +
          MF.esc(p.name || "") + '"></div>' +
        (IMGS.length > 1 ? '<div class="gallery__thumbs">' + IMGS.slice(0, 12).map(function (s, i) {
          return '<button type="button" class="' + (i === 0 ? "is-active" : "") + '" data-thumb="' + i +
            '"><img src="' + s + '" alt=""></button>';
        }).join("") + "</div>" : "") +
      "</div>" +
      "<div>" +
        '<p class="pdp__kicker">' +
          MF.esc((p.kategorie && p.kategorie.name) || (kat && kat.subName) || "") +
          (p.artikelnummer ? " · Art.-Nr. " + MF.esc(p.artikelnummer) : "") + "</p>" +
        "<h1>" + MF.esc(p.name || p.artikelnummer) + "</h1>" +
        (p.kurzbeschreibung ? '<p class="lead">' + MF.esc(p.kurzbeschreibung) + "</p>" : "") +
        '<div class="pdp__price"><b data-price>' +
          MF.esc(p.preis && p.preis.text ? p.preis.text : "—") +
        '</b><span data-pricehint style="font-size:14px;color:var(--c-ink-muted)"></span></div>' +
        '<p class="pdp__vat" data-vat></p>' +
        optHTML() +
        '<div class="buybar">' +
          '<div class="qty"><button type="button" data-minus aria-label="weniger">–</button>' +
          '<input type="text" inputmode="numeric" value="1" data-qty aria-label="Anzahl">' +
          '<button type="button" data-plus aria-label="mehr">+</button></div>' +
          '<button class="btn btn--lg" type="button" data-add' + (kaufbar ? "" : " disabled") + ">" +
            MF.esc(kaufbar ? (anfrage ? "In den Anfragenkorb" : "In den Warenkorb")
                           : "Im Altsystem nicht bestellbar") + "</button>" +
          '<a class="btn btn--lg btn--ghost" href="kontakt.html?artikel=' +
            encodeURIComponent(p.name || p.artikelnummer) + '">Angebot anfordern</a>' +
        "</div>" +
        '<div data-addresult></div>' +
        '<div class="pdp__trust">' +
          "<div>" + MF.icon("checkC") + "<span>Artikel-ID im Altsystem: <b>" +
            MF.esc(p.artikelId != null ? p.artikelId : "unbekannt") + "</b> · Pfad <code>" +
            MF.esc(p.pfad) + "</code></span></div>" +
          "<div>" + MF.icon("checkC") + "<span>Persönliche Beratung unter +49 171 77 55 400</span></div>" +
          "<div>" + MF.icon("checkC") + "<span>" +
            (p.verfuegbarkeit ? MF.esc(p.verfuegbarkeit)
                              : "Konfektioniert nach Ihren Maßen — auch Sonderformen") +
          "</span></div>" +
        "</div>" +
        '<p class="bridge-source">Quelle dieser Seite: <code>GET /api/produkt?pfad=' +
          MF.esc(p.pfad) + "</code> · Preis: <code>GET /api/price</code> · " +
          (kaufformular.vorhanden
            ? "Kaufformular des Altsystems mit " +
              (kaufformular.upstream && kaufformular.upstream.felder
                ? kaufformular.upstream.felder.length : "?") + " Feldern"
            : "kein Kaufformular im Altsystem") + "</p>" +
      "</div>";

    /* ---------- Reiter ---------------------------------------------------- */
    var absaetze = p.beschreibungAbsaetze || [];
    var techZeilen = [];
    attribute.forEach(function (a) {
      techZeilen.push([a.name, (a.optionen || []).map(function (o) { return o.label || o.wert; })
        .slice(0, 40).join(" · ")]);
    });
    masse.forEach(function (m) {
      techZeilen.push(["Freies Maß " + m.feld,
        (m.min != null ? "ab " + m.min : "?") + " bis " + (m.max != null ? m.max : "?") + " cm"]);
    });
    if (p.preis && p.preis.versandText) techZeilen.push(["Versand (Deutschland)", p.preis.versandText]);
    if (p.preis && p.preis.ustSatz != null) techZeilen.push(["Umsatzsteuersatz", p.preis.ustSatz + " %"]);
    if (p.artikelnummer) techZeilen.push(["Artikelnummer", p.artikelnummer]);
    if (p.artikelId != null) techZeilen.push(["Interne Artikel-ID", String(p.artikelId)]);
    techZeilen.push(["Pfad im Altsystem", p.pfad]);
    if ((p.technischeDaten || []).length) {
      techZeilen.push(["Datenblätter im Altsystem",
        p.technischeDaten.map(function (t) { return t.name; }).join(" · ")]);
    }

    var TABS = [
      ["Beschreibung", absaetze.length
        ? absaetze.map(function (d) { return "<p>" + MF.esc(d) + "</p>"; }).join("")
        : "<p>Zu diesem Artikel hinterlegt das Altsystem keinen Beschreibungstext.</p>"],
      ["Technische Daten",
        '<table class="spec"><tbody>' + techZeilen.map(function (r) {
          return "<tr><th>" + MF.esc(r[0]) + "</th><td>" + MF.esc(r[1]) + "</td></tr>";
        }).join("") + "</tbody></table>" +
        '<p class="bridge-source">Alle Zeilen sind aus der Live-Artikelseite gelesen. ' +
        "Eine strukturierte Datenblatt-Tabelle führt das Altsystem nicht.</p>"],
      ["Versand &amp; Widerruf",
        "<h3>Versandkosten</h3><p>" +
        (p.preis && p.preis.versandText
          ? "Das Altsystem weist für diesen Artikel <b>" + MF.esc(p.preis.versandText) +
            "</b> als Versand nach Deutschland aus."
          : "Für diesen Artikel weist das Altsystem keine Versandkosten aus. " +
            "Der verbindliche Betrag steht im Warenkorb.") +
        "</p><p>Der im Warenkorb ausgewiesene Versandbetrag ist der maßgebliche — " +
        "er wird vom Altsystem berechnet, nicht von dieser Oberfläche.</p>" +
        "<h3>Widerrufsrecht</h3><p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von " +
        "Gründen diesen Vertrag zu widerrufen.</p>" +
        "<h3>Ausschluss des Widerrufsrechts</h3><p>Bei den von uns angebotenen Produkten handelt " +
        "es sich um Waren, die von uns konfektioniert und von unseren Vertragslieferanten " +
        "individuell nach Ihren Vorgaben angefertigt werden. Gemäß § 312g Abs. 2 Nr. 1 BGB besteht " +
        "für solche Sonderanfertigungen kein Widerrufsrecht.</p>" +
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

    /* ---------- Ähnliche Artikel aus dem Live-Katalog ---------------------- */
    var rel = [];
    if (kat) {
      rel = C.products.filter(function (x) {
        return x.pfad !== p.pfad && x.cat === kat.cat && (!kat.sub || x.sub === kat.sub) && x.image;
      });
      if (rel.length < 4) {
        rel = rel.concat(C.products.filter(function (x) {
          return x.pfad !== p.pfad && x.cat === kat.cat && rel.indexOf(x) < 0 && x.image;
        }));
      }
    }
    if (rel.length < 4) {
      rel = rel.concat(C.products.filter(function (x) {
        return x.pfad !== p.pfad && rel.indexOf(x) < 0 && x.image;
      }));
    }
    document.querySelector("[data-related]").innerHTML = rel.slice(0, 4).map(MF.card).join("");

    /* ---------- Live-Preis ------------------------------------------------- */
    var $price = pdp.querySelector("[data-price]");
    var $hint = pdp.querySelector("[data-pricehint]");
    var $vat = pdp.querySelector("[data-vat]");
    var $add = pdp.querySelector("[data-add]");
    var $qty = pdp.querySelector("[data-qty]");
    var $result = pdp.querySelector("[data-addresult]");
    var preisLauf = 0;

    function preisParameter() {
      var q = "pfad=" + encodeURIComponent(p.pfad) + "&anzahl=" + sel.anzahl;
      Object.keys(sel.werte).forEach(function (feld) {
        if (sel.werte[feld] !== "" && sel.werte[feld] != null) {
          q += "&" + encodeURIComponent(feld) + "=" + encodeURIComponent(sel.werte[feld]);
        }
      });
      return q;
    }

    function preisHolen() {
      if (anfrage || !kaufbar) {
        $price.textContent = "Preis auf Anfrage";
        $price.style.fontSize = "24px";
        $hint.textContent = "Anfrageartikel — das Altsystem führt dafür keinen Listenpreis.";
        $vat.textContent = "";
        return;
      }
      var lauf = ++preisLauf;
      $hint.textContent = "wird bei matten.de abgefragt …";
      MF.api("/api/price?" + preisParameter()).then(function (j) {
        if (lauf !== preisLauf) return;   // eine neuere Abfrage ist schon unterwegs
        if (!j || !j.ok || j.preis == null) {
          $price.textContent = p.preis && p.preis.text ? p.preis.text : "—";
          $hint.textContent = "Live-Preis nicht verfügbar — angezeigt ist der Listenpreis der Artikelseite.";
          return;
        }
        $price.style.fontSize = "";
        $price.textContent = MF.eur(j.preis);
        $hint.textContent = sel.anzahl > 1
          ? "je Stück · " + MF.eur(j.gesamt) + " für " + sel.anzahl + " Stück"
          : "";
        $vat.innerHTML =
          (j.brutto ? "inkl. Umsatzsteuer" : "Betrag laut Altsystem") +
          (j.versand != null ? " · zzgl. Versand " + MF.eur(j.versand) + " (Deutschland)" : "") +
          (j.attributepreis ? " · darin " + MF.eur(j.attributepreis) + " Variantenaufpreis" : "") +
          ' <span style="opacity:.7">— live von matten.de</span>';
      });
    }

    /* ---------- Bedienung -------------------------------------------------- */
    pdp.querySelectorAll("[data-feld]").forEach(function (el) {
      el.addEventListener("change", function () {
        sel.werte[el.dataset.feld] = el.value;
        var i = attribute.findIndex(function (a) { return a.feld === el.dataset.feld; });
        var name = pdp.querySelector('[data-colorname="' + i + '"]');
        if (name && attribute[i]) name.textContent = bezeichnung(attribute[i], el.value);
        preisHolen();
      });
      if (el.type === "number") {
        el.addEventListener("input", function () { sel.werte[el.dataset.feld] = el.value; });
      }
    });
    var $k = pdp.querySelector("[data-kommentar]");
    if ($k) $k.addEventListener("input", function () { sel.kommentar = $k.value; });

    function setQty(n) {
      sel.anzahl = Math.max(1, Math.min(999, n | 0));
      $qty.value = sel.anzahl;
      preisHolen();
    }
    pdp.querySelector("[data-minus]").addEventListener("click", function () { setQty(sel.anzahl - 1); });
    pdp.querySelector("[data-plus]").addEventListener("click", function () { setQty(sel.anzahl + 1); });
    $qty.addEventListener("change", function () { setQty(parseInt($qty.value, 10) || 1); });

    pdp.querySelectorAll("[data-thumb]").forEach(function (b) {
      b.addEventListener("click", function () {
        pdp.querySelectorAll("[data-thumb]").forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        pdp.querySelector("[data-mainimg]").src = IMGS[+b.dataset.thumb];
      });
    });

    if (kaufbar) {
      $add.addEventListener("click", function () {
        $add.disabled = true;
        $add.textContent = "wird an matten.de gesendet …";
        $result.innerHTML = "";
        MF.cart.add({
          pfad: p.pfad,
          anzahl: sel.anzahl,
          kommentar: sel.kommentar,
          werte: sel.werte
        }).then(function (j) {
          $add.disabled = false;
          $add.textContent = anfrage ? "In den Anfragenkorb" : "In den Warenkorb";
          if (!j || !j.ok) {
            $result.innerHTML = MF.apiFehler(j, "In den Warenkorb legen");
            return;
          }
          if (j.abgelehnt && j.abgelehnt.length) {
            $result.innerHTML = '<div class="bridge-error"><b>Teilweise übernommen</b><span>' +
              j.abgelehnt.map(function (a) {
                return MF.esc(a.feld) + ": " + MF.esc(a.grund);
              }).join(" · ") + "</span></div>";
          }
          MF.toast("Im Warenkorb von matten.de. Warenkorb enthält jetzt " + (j.count || 0) +
            " Position(en).", "Zum Warenkorb", "warenkorb.html");
        });
      });
    }

    preisHolen();
    MF.initReveal();
  }
})();
