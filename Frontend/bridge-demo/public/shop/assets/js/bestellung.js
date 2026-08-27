/* =============================================================================
   Bestellabschluss — BRÜCKEN-FASSUNG

   Im Design zeigte diese Seite eine erfundene Bestätigung mit erfundener
   Bestellnummer aus dem sessionStorage. Das wäre hier gelogen: es gibt in
   dieser Brücke keine abgeschlossene Bestellung, weil der finale Schritt
   bewusst nicht ausgelöst wird.

   Stattdessen zeigt die Seite den WIRKLICHEN Stand der Bestellstrecke im
   Altsystem:  GET /api/kasse/vorschau
   und verweist für den letzten, verbindlichen Klick auf die abgesicherte
   Bestellseite der Demo (/kasse.html).
   ========================================================================== */
(function () {
  "use strict";
  var C = window.CATALOG || { categories: [], products: [] };
  var box = document.querySelector("[data-confirm]");

  box.innerHTML = '<div class="bridge-load">Der Stand der Bestellung wird bei matten.de gelesen …</div>';
  MF.boot();

  MF.api("/api/kasse/vorschau").then(function (v) {
    if (!v || !v.ok) {
      box.innerHTML = MF.apiFehler(v, "Bestellstand lesen") +
        '<p><a class="btn" href="warenkorb.html">Zum Warenkorb</a></p>';
      return;
    }
    zeichnen(v);
  });

  function zeile(l, w) {
    return w ? '<div class="summary__row"><span>' + MF.esc(l) + "</span><b>" + MF.esc(w) + "</b></div>" : "";
  }

  function zeichnen(v) {
    var u = v.uebersicht;
    var w = v.warenkorb || {};
    var leer = !w.items || !w.items.length;

    box.innerHTML =
      '<div style="max-width:880px;margin-block:36px 0">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:' +
          (v.bereit ? "#e6f6ec;color:#1a7f45" : "var(--c-cyan-50);color:var(--c-navy-900)") +
          ';display:grid;place-items:center;margin-bottom:20px">' +
          MF.icon(v.bereit ? "check" : "info", "ico--lg") + "</div>" +
        "<h1>" + (leer
          ? "Es liegt nichts zum Bestellen bereit"
          : (v.bereit ? "Das Altsystem ist bereit" : "Die Bestellung ist noch nicht abschickbar")) +
        "</h1>" +
        '<p class="lead">Diese Seite zeigt den <b>tatsächlichen Stand</b> der Bestellstrecke in ' +
        "der Sitzung von matten.de. Es wurde <b>nichts bestellt</b> — der finale Schritt wird in " +
        "dieser Demo nicht von hier ausgelöst.</p>" +
        '<div class="demo-note" style="max-width:680px">' + MF.icon("lock") +
        "<div><b>Keine Bestellung ausgelöst</b>Der Bestellabschluss legt im Altsystem einen " +
        "echten Auftrag an und verschickt eine Auftragsbestätigung per E-Mail. Deshalb sitzt er " +
        "in der Demo hinter einer getippten Bestätigung auf der abgesicherten Bestellseite.</div></div>" +
      "</div>" +

      '<div class="cart-layout" style="padding-top:8px">' +
        "<div>" +
          ((v.huerden || []).length
            ? '<div class="bridge-error"><b>Was das Altsystem noch vermisst</b><span>' +
              v.huerden.map(function (h) { return MF.esc(h); }).join(" · ") + "</span></div>"
            : "") +

          '<h2 style="font-size:20px">Positionen im Warenkorb von matten.de</h2>' +
          (leer
            ? '<p style="color:var(--c-ink-muted)">Der Warenkorb ist leer. ' +
              '<a href="kategorie.html">Zum Sortiment</a></p>'
            : w.items.map(function (i) {
                return '<div class="cart-item">' +
                  '<span><img src="' + MF.PLACEHOLDER + '" alt=""></span>' +
                  "<div><h3>" + MF.esc(i.name || "") + "</h3>" +
                  (i.attribut ? '<p class="cart-item__opts"><span>' + MF.esc(i.attribut) + "</span></p>" : "") +
                  (i.kommentar ? '<p class="cart-item__opts"><span><b>Anmerkung:</b> ' +
                    MF.esc(i.kommentar) + "</span></p>" : "") +
                  '<p style="font-size:14px;color:var(--c-ink-muted);margin:0">Menge: ' +
                  (i.anzahl || 1) + "</p></div>" +
                  '<div class="cart-item__right"><div class="price">' +
                  MF.esc(i.summe || i.preis || "—") + "</div></div></div>";
              }).join("")) +

          (u && u.adresseText
            ? '<div class="grid g-2" style="margin-top:36px">' +
              '<div><h3 style="font-size:16px">Lieferadresse laut Altsystem</h3>' +
              '<p style="font-size:15px;line-height:1.7;color:var(--c-ink-muted);white-space:pre-line">' +
              MF.esc(u.adresseText) + "</p></div>" +
              '<div><h3 style="font-size:16px">Zahlung &amp; Versand</h3>' +
              '<p style="font-size:15px;line-height:1.7;color:var(--c-ink-muted)">' +
              "Zahlungsart: <b>" + MF.esc(u.zahlungsartText || "—") + "</b><br>" +
              "Versandkosten: " + MF.esc(u.versand || "—") + "<br>" +
              "Absende-Knopf vorhanden: " + (u.absendeknopf ? "ja" : "nein") +
              "</p></div></div>"
            : '<p style="margin-top:28px;color:var(--c-ink-muted)">Im Altsystem ist noch keine ' +
              'Lieferadresse hinterlegt. <a href="kasse.html">Zur Kasse</a></p>') +

          '<h3 style="font-size:16px;margin-top:34px">Was beim finalen Klick rausginge</h3>' +
          '<p style="font-size:14.5px;color:var(--c-ink-muted)">Genau ein POST, genau ein Feld:</p>' +
          '<pre style="background:var(--c-surface-2);border-radius:4px;padding:14px 16px;' +
            'font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;overflow-x:auto">' +
            MF.esc((v.finalRequest && v.finalRequest.methode) || "POST") + " " +
            MF.esc((v.finalRequest && v.finalRequest.url) || "") + "\n" +
            MF.esc((v.finalRequest && v.finalRequest.body) || "") + "</pre>" +
          '<p style="font-size:14px;color:var(--c-ink-muted)">' +
            MF.esc((v.finalRequest && v.finalRequest.wirkung) || "") + "</p>" +

          '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:32px">' +
            '<a class="btn" href="/kasse.html" target="_blank" rel="noopener">' +
              "Zur abgesicherten Bestellseite</a>" +
            '<a class="btn btn--ghost" href="/api/kasse/raw" target="_blank" rel="noopener">' +
              "Rohantwort von matten.de</a>" +
            '<a class="btn btn--ghost" href="kategorie.html">Weiter einkaufen</a>' +
          "</div>" +
          '<p class="bridge-source">Quelle dieser Seite: <code>GET /api/kasse/vorschau</code>. ' +
            "Es wurde kein <code>POST /api/kasse/bestellen</code> gesendet.</p>" +
        "</div>" +

        '<aside class="summary">' +
          "<h2>Summe laut Altsystem</h2>" +
          zeile("Zwischensumme", w.zwischensumme) +
          zeile("Versandkosten", w.versand) +
          zeile("Umsatzsteuer" + (w.ustSatz != null ? " (" + w.ustSatz + " %)" : ""), w.umsatzsteuer) +
          '<div class="summary__row summary__row--total"><span>Gesamtsumme</span><span>' +
            MF.esc(w.gesamt || "—") + "</span></div>" +
          '<p class="summary__note">Fragen zur Bestellung? ' +
            '<a href="tel:+491717755400">+49 171 77 55 400</a> oder ' +
            '<a href="mailto:info@matten.de">info@matten.de</a></p>' +
        "</aside>" +
      "</div>";

    var pool = C.products.filter(function (p) { return p.image; });
    document.querySelector("[data-more]").innerHTML = pool.slice(0, 4).map(MF.card).join("");
    MF.initReveal();
  }
})();
