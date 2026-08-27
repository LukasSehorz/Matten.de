/* =============================================================================
   Kasse — BRÜCKEN-FASSUNG

   Diese Seite bedient die ECHTE Bestellstrecke des Altsystems:
     Formular + Länder + Zahlarten  ->  GET  /api/kasse/formular
     Versand / Zahlart setzen       ->  POST /api/kasse/optionen
     Lieferadresse speichern        ->  POST /api/kasse/adresse
     Stand vor dem Absenden         ->  GET  /api/kasse/vorschau

   ABSICHTLICH NICHT HIER: der finale, verbindliche Klick
   (POST /api/kasse/bestellen). Der liegt in der abgesicherten Bestellseite
   der Demo unter /kasse.html — siehe ANBINDUNG.md, Abschnitt "Kasse".

   Kein Betrag wird gerechnet. Alle Zahlen sind Texte des Altsystems.
   ========================================================================== */
(function () {
  "use strict";

  document.querySelectorAll("[data-ico]").forEach(function (el) {
    el.innerHTML = MF.icon(el.dataset.ico);
  });

  var $form = document.querySelector("[data-adressform]");
  var $opt = document.querySelector("[data-optionen]");
  var $sum = document.querySelector("[data-summary]");
  var $save = document.querySelector("[data-save]");
  var $result = document.querySelector("[data-saveresult]");
  var $vor = document.querySelector("[data-vorschau]");

  var stand = null;

  /* Beschriftungen und Platzhalter für die Felder des Altsystems. Die
     Feldnamen selbst kommen aus /api/kasse/formular, hier steht nur, wie
     sie im Design aussehen sollen. */
  var FELD_INFO = {
    anrede:      { platz: "Firma / Frau / Herr", breit: false },
    vorname:     { breit: false },
    name:        { breit: false },
    firma:       { platz: "optional", breit: false },
    strasse:     { platz: "Straße und Hausnummer", breit: true },
    plz:         { breit: false },
    ort:         { breit: false },
    email:       { typ: "email", breit: false },
    telefon:     { typ: "tel", platz: "für Rückfragen zum Aufmaß", breit: false },
    mobil:       { typ: "tel", platz: "optional", breit: false },
    fax:         { platz: "optional", breit: false },
    uid:         { platz: "optional, z. B. DE123456789", breit: false },
    bemerkungen: { mehrzeilig: true, platz: "z. B. Wunschtermin, Logo-Datei folgt", breit: true }
  };

  /* ---------------------------------------------------------------- Aufbau */
  function feldHtml(f, werte, laender) {
    var info = FELD_INFO[f.name] || {};
    var wert = werte && werte[f.name] != null ? werte[f.name] : "";
    var label = MF.esc(f.label) + (f.pflicht ? " *" : "");
    var id = "adr_" + f.name;

    if (f.name === "land") {
      return '<div class="field"><label for="' + id + '">' + label + "</label>" +
        '<select id="' + id + '" data-adr="land">' +
        (laender || []).map(function (o) {
          return '<option value="' + MF.esc(o.wert) + '"' +
            (o.wert === wert || o.gewaehlt ? " selected" : "") + ">" +
            MF.esc(o.label) + "</option>";
        }).join("") + "</select></div>";
    }
    if (info.mehrzeilig) {
      return '<div class="field"><label for="' + id + '">' + label + "</label>" +
        '<textarea id="' + id + '" data-adr="' + MF.esc(f.name) + '" placeholder="' +
        MF.esc(info.platz || "") + '">' + MF.esc(wert) + "</textarea></div>";
    }
    return '<div class="field"><label for="' + id + '">' + label + "</label>" +
      '<input id="' + id + '" type="' + (info.typ || "text") + '" data-adr="' +
      MF.esc(f.name) + '" value="' + MF.esc(wert) + '" placeholder="' +
      MF.esc(info.platz || "") + '"></div>';
  }

  function adressFormular(j) {
    var felder = j.adressfelder || [];
    var werte = j.adresse || {};
    var out = "";
    var puffer = [];

    felder.forEach(function (f) {
      var info = FELD_INFO[f.name] || {};
      var html = feldHtml(f, werte, j.laender);
      if (info.breit) {
        if (puffer.length) { out += '<div class="field--2">' + puffer.join("") + "</div>"; puffer = []; }
        out += html;
      } else {
        puffer.push(html);
        if (puffer.length === 2) { out += '<div class="field--2">' + puffer.join("") + "</div>"; puffer = []; }
      }
    });
    if (puffer.length) out += '<div class="field--2">' + puffer.join("") + "</div>";

    out += '<p class="bridge-source">' + felder.length + " Felder, direkt aus dem Formular unter " +
      "<code>matten.de/adresse</code>. Mit * markierte Felder bemängelt das Altsystem, " +
      "wenn sie leer bleiben." +
      (j.konto && j.konto.eingeloggt
        ? " Die Sitzung gilt als <b>angemeldet</b>, die Werte sind vorbelegt."
        : " Die Sitzung ist <b>nicht angemeldet</b> — eine Bestellung ist ohne Konto möglich.") +
      "</p>";
    return out;
  }

  function optionenHtml(j) {
    var o = j.optionen || {};
    var versand = (o.versandart && o.versandart.optionen) || [];
    var zahl = (o.zahlungsart && o.zahlungsart.optionen) || [];
    var gesperrt = (o.zahlungsart && o.zahlungsart.abgelehnt) || [];

    var out = "";
    if (versand.length) {
      out += '<div class="field"><label for="versandart">Versandart</label>' +
        '<select id="versandart">' + versand.map(function (v) {
          return '<option value="' + MF.esc(v.wert) + '"' + (v.gewaehlt ? " selected" : "") + ">" +
            MF.esc(v.label) + "</option>";
        }).join("") + "</select></div>";
    }

    out += '<div class="paymethods" style="margin-top:18px">' +
      (zahl.length
        ? zahl.map(function (z, i) {
            var an = z.gewaehlt || (i === 0 && !zahl.some(function (x) { return x.gewaehlt; }));
            return '<label class="paymethod' + (an ? " is-active" : "") + '">' +
              '<input type="radio" name="pay" value="' + MF.esc(z.wert) + '"' + (an ? " checked" : "") + ">" +
              '<span style="flex:1"><b>' + MF.esc(z.label) + "</b>" +
              "<small>Bei dieser Zahlungsart fließt beim Bestellen kein Geld — es entsteht nur " +
              "ein Datensatz im Altsystem.</small></span></label>";
          }).join("")
        : '<p style="font-size:14px;color:var(--c-ink-muted)">Das Altsystem bietet für diesen ' +
          "Warenkorb keine zugelassene Zahlungsart an.</p>") +
      "</div>";

    if (gesperrt.length) {
      out += '<div class="bridge-error" style="border-color:var(--c-line);border-left-color:' +
        'var(--c-cyan-500);background:var(--c-cyan-50)">' +
        "<b>Serverseitig gesperrt</b><span>" +
        gesperrt.map(function (g) {
          return MF.esc(g.label || g.wert) + " — " + MF.esc(g.grund || "Zahlungsdienstleister");
        }).join(" · ") +
        " Der Proxy lehnt diese Zahlarten ab, bevor sie überhaupt in die Sitzung von matten.de " +
        "gelangen.</span></div>";
    }
    return out;
  }

  function summary(w) {
    if (!w || !w.items || !w.items.length) {
      return "<h2>Ihre Bestellung</h2>" +
        '<p style="font-size:14.5px;color:var(--c-ink-muted)">Der Warenkorb bei matten.de ist leer.</p>' +
        '<a class="btn btn--block" href="kategorie.html">Zum Sortiment</a>';
    }
    var zeile = function (l, v) {
      return v ? '<div class="summary__row"><span>' + MF.esc(l) + "</span><b>" + MF.esc(v) + "</b></div>" : "";
    };
    return "<h2>Ihre Bestellung</h2>" +
      w.items.map(function (i) {
        return '<div class="summary__row" style="align-items:flex-start">' +
          '<span style="flex:1"><b>' + (i.anzahl || 1) + " × " + MF.esc(MF.trim(i.name || "", 38)) + "</b>" +
          (i.attribut ? '<br><span style="font-size:12.5px;color:var(--c-ink-muted)">' +
            MF.esc(i.attribut) + "</span>" : "") +
          "</span><span>" + MF.esc(i.summe || i.preis || "—") + "</span></div>";
      }).join("") +
      '<div style="border-top:1px solid var(--c-line);margin-top:8px;padding-top:8px"></div>' +
      zeile("Zwischensumme", w.zwischensumme) +
      zeile("Versandkosten", w.versand) +
      zeile("Umsatzsteuer" + (w.ustSatz != null ? " (" + w.ustSatz + " %)" : ""), w.umsatzsteuer) +
      '<div class="summary__row summary__row--total"><span>Gesamtsumme</span><span>' +
        MF.esc(w.gesamt || "—") + "</span></div>" +
      '<p class="summary__note">' + MF.icon("lock", "ico--sm") +
      " Jede Zahl hier stammt aus dem Warenkorb von matten.de. Diese Oberfläche rechnet nichts nach.</p>";
  }

  /* ---------------------------------------------------------------- Laden */
  function laden() {
    return MF.api("/api/kasse/formular").then(function (j) {
      if (!j || !j.ok) {
        $form.innerHTML = MF.apiFehler(j, "Kassendaten laden");
        $sum.innerHTML = "";
        return null;
      }
      stand = j;
      $form.innerHTML = adressFormular(j);
      $opt.innerHTML = optionenHtml(j);
      $sum.innerHTML = summary(j.warenkorb);

      $opt.querySelectorAll('input[name="pay"]').forEach(function (r) {
        r.addEventListener("change", function () {
          $opt.querySelectorAll(".paymethod").forEach(function (l) { l.classList.remove("is-active"); });
          r.closest(".paymethod").classList.add("is-active");
        });
      });
      return j;
    });
  }

  /* ------------------------------------------------------------- Speichern */
  function adressWerte() {
    var w = {};
    document.querySelectorAll("[data-adr]").forEach(function (el) {
      w[el.dataset.adr] = el.value;
    });
    if (document.getElementById("agb").checked) w.agb = true;
    return w;
  }

  function gewaehlteZahlungsart() {
    var el = $opt.querySelector('input[name="pay"]:checked');
    return el ? el.value : null;
  }

  $save.addEventListener("click", function () {
    if (!stand) return;
    if (!document.getElementById("agb").checked) {
      MF.toast("Bitte AGB, Widerrufsbelehrung und Datenschutz bestätigen.");
      document.getElementById("agb").focus();
      return;
    }
    var zahlungsart = gewaehlteZahlungsart();
    if (!zahlungsart) {
      MF.toast("Bitte eine Zahlungsart wählen.");
      return;
    }
    var versandEl = document.getElementById("versandart");
    var landEl = document.querySelector('[data-adr="land"]');

    $save.disabled = true;
    $save.textContent = "wird an matten.de übergeben …";
    $result.innerHTML = "";
    $vor.innerHTML = "";

    /* Schritt 1: Land, Versandart, Zahlungsart in die Sitzung des Altsystems. */
    MF.api("/api/kasse/optionen", {
      method: "POST",
      body: {
        land: landEl ? landEl.value : "de",
        versandart: versandEl ? versandEl.value : "1",
        zahlungsart: zahlungsart
      }
    }).then(function (o) {
      if (!o || !o.ok) {
        $result.innerHTML = MF.apiFehler(o, "Versand- und Zahlungsart setzen");
        throw new Error("optionen");
      }
      $sum.innerHTML = summary(o);
      /* Schritt 2: Lieferadresse speichern — das Altsystem validiert selbst. */
      return MF.api("/api/kasse/adresse", { method: "POST", body: adressWerte() });
    }).then(function (a) {
      if (!a || !a.gespeichert) {
        var f = (a && a.fehler) || [];
        $result.innerHTML = '<div class="bridge-error"><b>matten.de hat die Adresse abgelehnt</b>' +
          "<span>" + (f.length
            ? f.map(function (x) { return MF.esc(x.feld) + ": " + MF.esc(x.meldung); }).join(" · ")
            : MF.esc((a && a.fehler) || "Das Altsystem hat keinen Grund genannt.")) + "</span></div>";
        f.forEach(function (x) {
          var el = document.querySelector('[data-adr="' + x.feld + '"]');
          if (el) el.style.borderColor = "var(--c-signal)";
        });
        throw new Error("adresse");
      }
      document.querySelectorAll("[data-adr]").forEach(function (el) { el.style.borderColor = ""; });
      $result.innerHTML = '<div class="demo-note" style="margin-top:18px">' + MF.icon("checkC") +
        "<div><b>Im Altsystem gespeichert</b>matten.de hat die Adresse angenommen und auf die " +
        "Bestellübersicht weitergeleitet. Der Stand steht unten.</div></div>";
      /* Schritt 3: Stand vor dem Absenden holen. */
      return MF.api("/api/kasse/vorschau");
    }).then(function (v) {
      if (v) zeigeVorschau(v);
      $vor.scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function () {
      /* Fehlermeldungen stehen schon in $result. */
    }).then(function () {
      $save.disabled = false;
      $save.textContent = "Daten an matten.de übergeben";
    });
  });

  /* -------------------------------------------------------------- Vorschau */
  function zeigeVorschau(v) {
    if (!v || !v.ok) { $vor.innerHTML = MF.apiFehler(v, "Bestellübersicht lesen"); return; }
    var u = v.uebersicht;

    var huerden = (v.huerden || []).length
      ? '<div class="bridge-error"><b>Noch offen</b><span>' +
        v.huerden.map(function (h) { return MF.esc(h); }).join(" · ") + "</span></div>"
      : "";

    var positionen = u && u.items && u.items.length
      ? '<table class="spec"><tbody>' + u.items.map(function (i) {
          return "<tr><th>" + MF.esc(i.name) +
            (i.attribut ? '<br><span style="font-weight:400;font-size:12.5px">' +
              MF.esc(i.attribut) + "</span>" : "") + "</th>" +
            "<td>" + (i.anzahl || 1) + " × " + MF.esc(i.preis || "—") +
            " = <b>" + MF.esc(i.summe || "—") + "</b></td></tr>";
        }).join("") +
        "<tr><th>Zwischensumme</th><td>" + MF.esc((u && u.zwischensumme) || "—") + "</td></tr>" +
        "<tr><th>Versandkosten</th><td>" + MF.esc((u && u.versand) || "—") + "</td></tr>" +
        "<tr><th>Umsatzsteuer</th><td>" + MF.esc((u && u.umsatzsteuer) || "—") + "</td></tr>" +
        "<tr><th>Gesamtsumme</th><td><b>" + MF.esc((u && u.gesamt) || "—") + "</b></td></tr>" +
        "</tbody></table>"
      : "";

    $vor.innerHTML =
      '<h2 style="font-size:22px">3. Bestellübersicht des Altsystems</h2>' +
      '<p style="font-size:15px;color:var(--c-ink-muted)">Das ist der Stand, den matten.de gerade ' +
      "unter <code>/bestellen</code> führt — gelesen, nicht nachgebaut.</p>" +
      huerden +
      (u && u.adresseText
        ? '<h3 style="font-size:16px;margin-top:22px">Lieferadresse laut Altsystem</h3>' +
          '<p style="font-size:15px;line-height:1.7;color:var(--c-ink-muted);white-space:pre-line">' +
          MF.esc(u.adresseText) + "</p>"
        : "") +
      (u && u.zahlungsartText
        ? '<p style="font-size:15px">Zahlungsart laut Altsystem: <b>' +
          MF.esc(u.zahlungsartText) + "</b></p>"
        : "") +
      positionen +
      '<div class="demo-note" style="margin-top:26px">' + MF.icon("lock") +
      "<div><b>Der letzte Klick sitzt bewusst woanders</b>" +
      (v.bereit
        ? "Das Altsystem ist bereit: ein einziger POST auf <code>/bestellen</code> würde jetzt eine " +
          "<b>echte Bestellung</b> anlegen und eine Auftragsbestätigung per E-Mail verschicken. "
        : "Sobald alle offenen Punkte erledigt sind, würde ein einziger POST auf " +
          "<code>/bestellen</code> eine <b>echte Bestellung</b> anlegen. ") +
      "Dieser Schritt läuft in der Demo über die abgesicherte Bestellseite — dort steht vorher " +
      "im Klartext, welche Felder rausgehen, und es braucht eine getippte Bestätigung.</div></div>" +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:18px">' +
        '<a class="btn btn--lg" href="/kasse.html" target="_blank" rel="noopener">' +
          "Zur abgesicherten Bestellseite</a>" +
        '<a class="btn btn--ghost" href="/api/kasse/raw" target="_blank" rel="noopener">' +
          "Rohantwort von matten.de ansehen</a>" +
        '<a class="btn btn--ghost" href="bestellung.html">Stand als Übersichtsseite</a>' +
      "</div>" +
      '<p class="bridge-source">Quellen: <code>POST /api/kasse/optionen</code>, ' +
      "<code>POST /api/kasse/adresse</code>, <code>GET /api/kasse/vorschau</code>.</p>";
  }

  MF.boot();
  laden();
})();
