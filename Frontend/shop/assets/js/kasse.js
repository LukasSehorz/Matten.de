/* Kasse mit beispielhaftem PayPal-Ablauf (Demo, keine echte Zahlung) */
(function () {
  "use strict";

  document.querySelectorAll("[data-ico]").forEach(function (el) {
    el.innerHTML = MF.icon(el.dataset.ico);
  });

  var t = MF.cart.totals();
  if (!t.items.length) {
    document.querySelector(".cart-layout").innerHTML =
      '<div class="empty" style="grid-column:1/-1;border:1px solid var(--c-line);border-radius:4px">' +
      "<h2>Ihr Warenkorb ist leer</h2><p>Legen Sie zuerst einen Artikel in den Warenkorb.</p>" +
      '<a class="btn" href="kategorie.html">Zum Sortiment</a></div>';
    MF.boot();
    return;
  }

  /* ---------- Zusammenfassung -------------------------------------------- */
  function summary() {
    var s = MF.cart.totals();
    var rows = s.items.map(function (i) {
      var opts = Object.keys(i.options || {}).slice(0, 3).map(function (k) {
        return MF.esc(i.options[k]);
      }).join(" · ");
      return '<div class="summary__row" style="align-items:flex-start">' +
        "<span style=\"flex:1\"><b>" + i.qty + " × " + MF.esc(MF.trim(i.name, 38)) + "</b>" +
        (opts ? '<br><span style="font-size:12.5px;color:var(--c-ink-muted)">' + opts + "</span>" : "") +
        "</span><span>" + (i.quote ? "auf Anfrage" : MF.eur(i.price * i.qty)) + "</span></div>";
    }).join("");

    document.querySelector("[data-summary]").innerHTML =
      "<h2>Ihre Bestellung</h2>" + rows +
      '<div class="summary__row" style="border-top:1px solid var(--c-line);margin-top:8px;padding-top:14px">' +
        "<span>Zwischensumme</span><b>" + MF.eur(s.sum) + "</b></div>" +
      '<div class="summary__row"><span>Versand</span><b>' +
        (s.shipping === 0 ? "frachtfrei" : MF.eur(s.shipping)) + "</b></div>" +
      '<div class="summary__row summary__row--total"><span>Gesamt</span><span>' + MF.eur(s.total) + "</span></div>" +
      '<div class="summary__row" style="padding-top:0"><span style="font-size:13px;color:var(--c-ink-muted)">' +
        "darin 19 % MwSt.</span><span style=\"font-size:13px;color:var(--c-ink-muted)\">" + MF.eur(s.vat) + "</span></div>" +
      '<div data-paybox style="margin-top:18px"></div>' +
      '<p class="summary__note">' + MF.icon("lock", "ico--sm") +
        " Demo-Umgebung — es werden keine Daten übertragen und keine Zahlung ausgelöst.</p>";
    paintPayButton();
  }

  function payMethod() {
    var el = document.querySelector('input[name="pay"]:checked');
    return el ? el.value : "paypal";
  }

  function paintPayButton() {
    var box = document.querySelector("[data-paybox]");
    var m = payMethod();
    if (m === "paypal") {
      box.innerHTML = '<button class="paypal-btn" type="button" data-submit>' +
        "<i><b>Pay</b><s>Pal</s></i> Jetzt bezahlen</button>";
    } else {
      var label = { rechnung: "Zahlungspflichtig bestellen", vorkasse: "Zahlungspflichtig bestellen",
                    karte: "Mit Kreditkarte bezahlen" }[m];
      box.innerHTML = '<button class="btn btn--lg btn--block" type="button" data-submit>' +
        label + "</button>";
    }
    box.querySelector("[data-submit]").addEventListener("click", submit);
  }

  document.querySelectorAll('input[name="pay"]').forEach(function (r) {
    r.addEventListener("change", function () {
      document.querySelectorAll(".paymethod").forEach(function (l) { l.classList.remove("is-active"); });
      r.closest(".paymethod").classList.add("is-active");
      paintPayButton();
    });
  });

  if (MF.qs("pay") === "paypal") {
    var pp = document.querySelector('input[value="paypal"]');
    if (pp) { pp.checked = true; pp.dispatchEvent(new Event("change")); }
  }

  /* ---------- Validierung -------------------------------------------------- */
  function validate() {
    var missing = [];
    ["vorname", "nachname", "strasse", "plz", "ort", "mail"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el.value.trim()) { missing.push(el); el.style.borderColor = "var(--c-signal)"; }
      else el.style.borderColor = "";
    });
    var mail = document.getElementById("mail");
    if (mail.value.trim() && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mail.value.trim())) {
      missing.push(mail); mail.style.borderColor = "var(--c-signal)";
    }
    if (!document.getElementById("agb").checked) {
      MF.toast("Bitte bestätigen Sie AGB, Widerrufsbelehrung und Datenschutz.");
      document.getElementById("agb").focus();
      return false;
    }
    if (missing.length) {
      MF.toast("Bitte füllen Sie die markierten Pflichtfelder aus.");
      missing[0].focus();
      missing[0].scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  /* ---------- Abschluss ---------------------------------------------------- */
  function orderData() {
    var s = MF.cart.totals();
    return {
      nr: "MF-" + new Date().getFullYear() + "-" +
          String(Math.floor(Math.random() * 90000) + 10000),
      datum: new Date().toLocaleDateString("de-DE",
        { day: "2-digit", month: "long", year: "numeric" }),
      pay: payMethod(),
      kunde: {
        anrede: document.getElementById("anrede").value,
        firma: document.getElementById("firma").value.trim(),
        name: (document.getElementById("vorname").value.trim() + " " +
               document.getElementById("nachname").value.trim()).trim(),
        strasse: document.getElementById("strasse").value.trim(),
        zusatz: document.getElementById("zusatz").value.trim(),
        plz: document.getElementById("plz").value.trim(),
        ort: document.getElementById("ort").value.trim(),
        land: document.getElementById("land").value,
        tel: document.getElementById("tel").value.trim(),
        mail: document.getElementById("mail").value.trim()
      },
      hinweis: document.getElementById("hinweis").value.trim(),
      items: s.items, sum: s.sum, shipping: s.shipping, total: s.total, vat: s.vat
    };
  }

  function finish(order) {
    sessionStorage.setItem("mattenfuchs.order", JSON.stringify(order));
    MF.cart.clear();
    location.href = "bestellung.html";
  }

  function submit() {
    if (!validate()) return;
    var order = orderData();
    if (order.pay === "paypal") paypalFlow(order);
    else finish(order);
  }

  /* ---------- PayPal-Demo -------------------------------------------------- */
  var ov = document.getElementById("ppOverlay");
  var body = ov.querySelector("[data-ppbody]");

  function openPP(html) {
    body.innerHTML = html;
    ov.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closePP() {
    ov.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  ov.querySelector("[data-ppclose]").addEventListener("click", closePP);
  ov.addEventListener("click", function (e) { if (e.target === ov) closePP(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && ov.classList.contains("is-open")) closePP();
  });

  function paypalFlow(order) {
    openPP(
      "<h3>Mit PayPal bezahlen</h3>" +
      '<p style="color:var(--c-ink-muted);font-size:14px">FUCHSIUS multi-media GmbH bittet um ' +
      "Zahlung.</p>" +
      '<div class="pp-row"><span>Händler</span><b>Mattenfuchs-Shop</b></div>' +
      '<div class="pp-row"><span>Positionen</span><span>' + order.items.length + "</span></div>" +
      '<div class="pp-row"><span>Versand</span><span>' +
        (order.shipping === 0 ? "frachtfrei" : MF.eur(order.shipping)) + "</span></div>" +
      '<div class="pp-row"><span>Gesamtbetrag</span><span class="pp-total">' + MF.eur(order.total) + "</span></div>" +
      '<div class="pp-mock"><b>Demo-Konto</b>' + MF.esc(order.kunde.mail || "kunde@beispiel.de") +
        " · Guthaben ausreichend</div>" +
      '<button class="paypal-btn" type="button" data-ppgo style="width:100%">Jetzt bezahlen</button>' +
      '<button class="btn btn--ghost btn--block" type="button" data-ppcancel style="margin-top:10px">' +
        "Abbrechen und zurück zum Shop</button>" +
      '<p style="font-size:12.5px;color:var(--c-ink-muted);margin:14px 0 0;text-align:center">' +
        "Nachbildung des PayPal-Ablaufs für die Präsentation. Es findet keine Zahlung statt.</p>"
    );
    body.querySelector("[data-ppcancel]").addEventListener("click", closePP);
    body.querySelector("[data-ppgo]").addEventListener("click", function () {
      openPP('<h3 style="text-align:center">Zahlung wird verarbeitet …</h3>' +
        '<div class="pp-spinner"></div>' +
        '<p style="text-align:center;color:var(--c-ink-muted);font-size:14px">' +
        "Bitte schließen Sie dieses Fenster nicht.</p>");
      setTimeout(function () {
        openPP('<div style="text-align:center">' +
          '<div style="width:56px;height:56px;margin:6px auto 14px;border-radius:50%;background:#e6f6ec;' +
          'display:grid;place-items:center;color:#1a7f45">' + MF.icon("check", "ico--lg") + "</div>" +
          "<h3>Zahlung bestätigt</h3>" +
          '<p style="color:var(--c-ink-muted);font-size:14.5px">' + MF.eur(order.total) +
          " an Mattenfuchs-Shop.</p></div>");
        setTimeout(function () {
          order.ppid = "PP-DEMO-" + Math.random().toString(36).slice(2, 10).toUpperCase();
          closePP();
          finish(order);
        }, 1100);
      }, 2100);
    });
  }

  summary();
  MF.boot();
})();
