/* =============================================================================
   Mattendesigner — Preisrechner

   Rechnet mit der geprüften Kalkulation aus /preisformel.js. Diese Datei
   bildet Zelle für Zelle die Arbeitsmappe PREISE-Brian-26-10_22-11.xlsx nach
   und ist gegen 61 Testfälle abgesichert (node pruefe-preisformel.mjs).
   Sie wird hier NUR eingebunden, nicht verändert.

   Wichtig und auf der Seite auch so gesagt: das Ergebnis ist ein
   ANFRAGEPREIS. Das Altsystem matten.de kennt diese Formel nicht — dort
   hängt jeder Preis an einem hinterlegten Artikel. Für frei konfigurierte
   Maße gibt es dort schlicht keinen.

   Der interne EK-/Margenblock aus public/rechner.html fehlt hier absichtlich:
   diese Seite ist kundenseitig.
   ========================================================================== */

import { berechne, KONSTANTEN, COLORTYPES, runde, euro, zahl } from "/preisformel.js";

const $ = (sel) => document.querySelector(sel);
const esc = window.MF ? window.MF.esc : (s) => String(s == null ? "" : s);

const felder = {
  breite: $("#breite"),
  laenge: $("#laenge"),
  menge: $("#menge"),
  colortype: $("#colortype"),
  formOhne: $("#formOhne"),
  formMit: $("#formMit"),
  sonderfarbe: $("#sonderfarbe"),
};

const $ergebnis = $("[data-ergebnis]");
const $meta = $("[data-meta]");
const $schritte = $("[data-schritte]");
const $formel = $("[data-formel]");
const $kurz = $("[data-rechenwegKurz]");
const $massinfo = $("[data-massinfo]");
const $anfrage = $("[data-anfrage]");

function eingaben() {
  return {
    breite: felder.breite.value,
    laenge: felder.laenge.value,
    menge: felder.menge.value,
    colortype: Number(felder.colortype.value),
    sonderformOhneRand: felder.formOhne.checked,
    sonderformMitRand: felder.formMit.checked,
    sonderfarbe: felder.sonderfarbe.checked,
  };
}

/* ---------------------------------------------------------------- Feldhilfe */
function feldFehler(name, text) {
  const el = document.querySelector('[data-err="' + name + '"]');
  if (el) el.textContent = text || "";
  if (felder[name]) felder[name].style.borderColor = text ? "var(--c-signal)" : "";
}

function pruefeFelder(e) {
  const b = Number(String(e.breite).replace(",", "."));
  const l = Number(String(e.laenge).replace(",", "."));
  const m = Number(e.menge);
  const rolle = KONSTANTEN.standardbreiten[KONSTANTEN.standardbreiten.length - 1];

  feldFehler("breite",
    !Number.isFinite(b) ? "Bitte eine Breite eintragen."
      : b < KONSTANTEN.minBreite ? "Mindestens " + KONSTANTEN.minBreite + " cm."
      : (b > rolle && l > rolle) ? "Eine Seite darf höchstens " + rolle + " cm sein."
      : b > KONSTANTEN.maxLaenge ? "Höchstens " + KONSTANTEN.maxLaenge + " cm."
      : "");
  feldFehler("laenge",
    !Number.isFinite(l) ? "Bitte eine Länge eintragen."
      : l < KONSTANTEN.minBreite ? "Mindestens " + KONSTANTEN.minBreite + " cm."
      : l > KONSTANTEN.maxLaenge ? "Höchstens " + KONSTANTEN.maxLaenge + " cm."
      : "");
  feldFehler("menge",
    !Number.isFinite(m) ? "Bitte eine Menge eintragen."
      : m < 1 ? "Mindestens 1 Stück."
      : m !== Math.floor(m) ? "Bitte eine ganze Zahl."
      : "");

  const trifft = KONSTANTEN.standardbreiten.filter((s) => b === s || l === s);
  const liste = KONSTANTEN.standardbreiten.join(", ") + " cm";
  $massinfo.innerHTML = trifft.length
    ? "Standardbreite <b>" + trifft[0] + " cm</b> getroffen — kein Zuschlag für Sonderbreite."
    : "Keine Seite trifft eine Standardbreite (" + liste + ") — die Matte muss aus der Rolle " +
      "geschnitten werden, Zuschlag <b>× " + zahl(KONSTANTEN.faktorSondermass, 2) + "</b>.";
}

/* ------------------------------------------------------------- Darstellung */
function zeigeFehler(r) {
  $ergebnis.innerHTML =
    '<div class="calc__fail"><h3>' + esc(r.grund) + "</h3>" +
    '<p style="color:var(--c-ink-muted);font-size:15px;margin:0">' +
    esc(r.klartext || "Diese Maße sind so nicht herstellbar.") + "</p></div>";
  $kurz.textContent = "— kein Ergebnis";
  $formel.textContent =
    "Die Kalkulation liefert in Zelle " + (r.zelle || "—") + ' den Text "' + r.grund + '".\n' +
    "Damit wird nicht weitergerechnet.";
  $schritte.innerHTML =
    '<tr><td class="zelle">D4</td><td>Fläche je Stück</td><td class="wert">' +
    (Number.isFinite(r.qmProStueck) ? zahl(r.qmProStueck, 4) + " m²" : "—") + "</td></tr>" +
    '<tr><td class="zelle">' + esc(r.zelle || "") + "</td><td>Größenprüfung</td>" +
    '<td class="wert" style="color:var(--c-signal)">' + esc(r.grund) + "</td></tr>";
  $meta.textContent = "";
  $anfrage.innerHTML = "";
}

function zeigeErgebnis(r) {
  const menge = r.eingaben.menge;

  $ergebnis.innerHTML =
    '<div class="calc__head">' +
      '<p class="kicker">Anfragepreis</p>' +
      '<div class="calc__prices">' +
        '<div class="calc__price"><span>Je Stück</span><b>' + euro(runde(r.vkProStueck, 2)) + "</b></div>" +
        '<div class="calc__price"><span>Gesamt · ' + zahl(menge, 0) + " Stück</span><b>" +
          euro(runde(r.vkGesamt, 2)) + "</b></div>" +
      "</div>" +
    "</div>";

  $meta.innerHTML =
    "<b>" + zahl(r.qmProStueck, 3) + " m²</b> je Stück · <b>" + zahl(r.gesamtQm, 3) +
    " m²</b> gesamt · Netto, ohne Umsatzsteuer und Versand" +
    (r.staffelSchwelle && r.staffelSchwelle > 1
      ? " · Mengenstaffel ab " + r.staffelSchwelle + " Stück berücksichtigt (" +
        zahl((1 - r.staffelfaktor) * 100, 0) + " % Nachlass)"
      : "");

  /* --- Rechenweg: Formelzeile --- */
  const staffelText = r.staffelSchwelle === 1 ? "1" : zahl(r.staffelfaktor, 2);
  $formel.textContent =
    "Preis je Stück =\n" +
    "  " + zahl(r.qmProStueck, 4) + " m²" +
    "  × " + zahl(KONSTANTEN.ekListenpreisProQm, 2) + " €/m²" +
    "  × " + zahl(r.salesfactor, 3) + " (Ausführung)\n" +
    "  × " + staffelText + " (Mengenstaffel)" +
    "  × " + zahl(r.tzFaktor, 2) + " (Teuerung)" +
    "  × " + zahl(r.faktorBreite, 2) + " (Sonderbreite)\n" +
    "  × " + zahl(r.faktorFormOhneRand, 2) + " (Sonderform ohne Rand)" +
    "  × " + zahl(r.faktorFormMitRand, 2) + " (Sonderform mit Rand)\n" +
    "  + " + zahl(r.aufschlagVK, 2) + " € (Sonderfarbe)\n" +
    "  = " + zahl(r.vkProStueck, 5) + " €\n\n" +
    "Gesamt = " + zahl(menge, 0) + " × " + zahl(r.vkProStueck, 5) +
    " − " + (menge - 1) + " × " + zahl(r.aufschlagVK, 2) + " €" +
    " = " + zahl(r.vkGesamt, 5) + " €";

  /* --- Rechenweg: Schritt für Schritt --- */
  const ctName = (COLORTYPES.find((c) => c.wert === r.eingaben.colortype) || {}).name || "unbekannt";
  const trifft = KONSTANTEN.standardbreiten.filter(
    (s) => r.eingaben.breite === s || r.eingaben.laenge === s
  );

  const zeilen = [
    ["D4", "Fläche je Stück",
      zahl(r.eingaben.breite, 1) + " × " + zahl(r.eingaben.laenge, 1) + " cm",
      zahl(r.qmProStueck, 4) + " m²"],
    ["Q5", "Listenpreis je m²", "Artikelkonstante der Kalkulation",
      zahl(KONSTANTEN.ekListenpreisProQm, 2) + " €"],
    ["C2", "Faktor Ausführung", "Colortype " + r.eingaben.colortype + " – " + ctName,
      "× " + zahl(r.salesfactor, 3)],
    ["R5–V5", "Mengenstaffel",
      r.staffelSchwelle === null ? "Menge unter 1 Stück"
        : (r.staffelSchwelle === 1 ? "ab 1 Stück – kein Nachlass"
          : "ab " + r.staffelSchwelle + " Stück – " + zahl((1 - r.staffelfaktor) * 100, 0) + " % Nachlass"),
      "× " + zahl(r.staffelfaktor, 2)],
    ["S2", "Teuerungszuschlag", "derzeit " + zahl(KONSTANTEN.tzProzent, 1) + " %",
      "× " + zahl(r.tzFaktor, 2)],
    ["L5", "Sonderbreite",
      trifft.length ? trifft[0] + " cm ist Standardbreite"
        : "keine Seite trifft " + KONSTANTEN.standardbreiten.join("/") + " cm",
      "× " + zahl(r.faktorBreite, 2)],
    ["M5", "Größenprüfung", "Maße im zulässigen Rahmen", "× " + zahl(r.faktorLaenge, 2)],
    ["N5", "Sonderform ohne Rand",
      r.eingaben.sonderformOhneRand ? "gewählt – 30 % Aufschlag" : "nicht gewählt",
      "× " + zahl(r.faktorFormOhneRand, 2)],
    ["O5", "Sonderform mit Rand",
      r.eingaben.sonderformMitRand ? "gewählt – 50 % Aufschlag" : "nicht gewählt",
      "× " + zahl(r.faktorFormMitRand, 2)],
    ["P5", "Sonderfarbe",
      r.eingaben.sonderfarbe ? "gewählt – fällt einmal je Auftrag an" : "nicht gewählt",
      "+ " + zahl(r.aufschlagVK, 2) + " €"],
  ];

  $schritte.innerHTML =
    zeilen.map((z) =>
      '<tr><td class="zelle">' + esc(z[0]) + "</td>" +
      "<td>" + esc(z[1]) + '<span class="warum">' + esc(z[2]) + "</span></td>" +
      '<td class="wert">' + esc(z[3]) + "</td></tr>").join("") +
    '<tr class="summe"><td class="zelle">G5</td><td>Preis je Stück</td>' +
      '<td class="wert">' + euro(runde(r.vkProStueck, 2)) + "</td></tr>" +
    '<tr class="summe"><td class="zelle">F5</td><td>Preis gesamt' +
      '<span class="warum">' + zahl(menge, 0) + " × Stückpreis − " + (menge - 1) +
      " × Sonderfarbe – der Aufschlag zählt nur einmal</span></td>" +
      '<td class="wert">' + euro(runde(r.vkGesamt, 2)) + "</td></tr>";

  $kurz.textContent =
    "— " + zahl(r.qmProStueck, 3) + " m² × " + zahl(KONSTANTEN.ekListenpreisProQm, 2) +
    " € × " + zahl(r.salesfactor, 3) +
    (r.zuschlagsfaktor !== 1 ? " × " + zahl(r.zuschlagsfaktor, 4) : "") +
    (r.staffelfaktor !== 1 ? " × " + zahl(r.staffelfaktor, 2) : "") +
    (r.aufschlagVK ? " + " + zahl(r.aufschlagVK, 0) + " €" : "");

  if (r.hinweise && r.hinweise.length) {
    $schritte.insertAdjacentHTML("beforeend",
      '<tr><td colspan="3" style="color:var(--c-signal-d);font-size:13px">' +
      r.hinweise.map(esc).join("<br>") + "</td></tr>");
  }

  anfrageKnopf(r);
}

/* ------------------------------------------------- Als Anfrage übernehmen */
/*
 * Es gibt im Altsystem keinen Artikel "freie Wunschmatte". Was es gibt, sind
 * ANFRAGEARTIKEL ("in den Anfragenkorb") — für genau diesen Zweck. Die besten
 * davon führen sogar zwei freie Maßfelder (spezialoption[…][x] und […][y]);
 * dort landen Breite und Länge wirklich als Zahl, nicht nur als Text.
 * Alles Übrige — Ausführung, Sonderform, der errechnete Anfragepreis — geht
 * in das Kommentarfeld, das jedes Kaufformular des Altsystems hat.
 *
 * Findet sich kein solcher Artikel, sagt die Seite das offen, statt einen
 * beliebigen Artikel unterzuschieben.
 */
function anfrageArtikel() {
  const C = window.CATALOG || { products: [] };
  const kandidaten = C.products.filter((p) => p.modus === "anfrage" && p.pfad);
  const wunsch = kandidaten.filter((p) => p.sub === "wunschdesign-matten");
  return wunsch.filter((p) => p.custom)[0] ||
    wunsch[0] ||
    kandidaten.filter((p) => p.custom && /wunsch|wunschgr/i.test(p.name || ""))[0] ||
    kandidaten[0] || null;
}

/* Die Maßfelder des gewählten Anfrageartikels, einmal live nachgeschlagen. */
let zielArtikel = anfrageArtikel();
let zielMasse = null;      // { x: {feld,min,max}, y: {feld,min,max} } oder null

if (zielArtikel) {
  window.MF.api("/api/produkt?pfad=" + encodeURIComponent(zielArtikel.pfad)).then(function (j) {
    if (!j || !j.ok || !j.produkt) return;
    const masse = j.produkt.masse || [];
    const x = masse.filter((m) => /\[x\]$/.test(m.feld))[0];
    const y = masse.filter((m) => /\[y\]$/.test(m.feld))[0];
    if (x && y) zielMasse = { x: x, y: y };
    neuRechnen();     // Knopftext und Hinweis mit dem neuen Wissen aufbauen
  });
}

function konfigurationsText(r) {
  const e = r.eingaben;
  const teile = [
    "Mattendesigner-Anfrage",
    e.breite + " x " + e.laenge + " cm",
    e.menge + " Stueck",
    "Ausfuehrung: " + ((COLORTYPES.find((c) => c.wert === e.colortype) || {}).name || e.colortype),
  ];
  if (e.sonderformOhneRand) teile.push("Sonderform ohne Rand");
  if (e.sonderformMitRand) teile.push("Sonderform mit Rand");
  if (e.sonderfarbe) teile.push("Sonderfarbe");
  teile.push("Anfragepreis " + zahl(runde(r.vkProStueck, 2), 2) + " EUR/Stk, " +
    zahl(runde(r.vkGesamt, 2), 2) + " EUR gesamt (netto, unverbindlich)");
  return teile.join(" | ");
}

function anfrageKnopf(r) {
  const artikel = zielArtikel;
  if (!artikel) {
    $anfrage.innerHTML =
      '<div class="bridge-error" style="border-left-color:var(--c-cyan-500);' +
      'border-color:var(--c-line);background:var(--c-cyan-50)">' +
      "<b>Übernahme in den Warenkorb derzeit nicht möglich</b><span>" +
      "Im Live-Katalog steht gerade kein Anfrageartikel bereit, an den sich die Konfiguration " +
      "hängen ließe. Nötig wäre entweder ein Artikel mit Anfragekorb-Formular im Altsystem " +
      "oder ein eigener Endpunkt, der eine freie Position erzeugt — beides gibt es dort " +
      "nicht. Bitte schicken Sie die Angaben über das " +
      '<a href="kontakt.html">Kontaktformular</a>.</span></div>';
    return;
  }

  /* Passen Breite und Länge in die Maßfelder des Anfrageartikels? */
  const b = r.eingaben.breite;
  const l = r.eingaben.laenge;
  let masse = null;
  let massHinweis = "";
  if (zielMasse) {
    const passtX = (zielMasse.x.min == null || b >= zielMasse.x.min) &&
                   (zielMasse.x.max == null || b <= zielMasse.x.max);
    const passtY = (zielMasse.y.min == null || l >= zielMasse.y.min) &&
                   (zielMasse.y.max == null || l <= zielMasse.y.max);
    if (passtX && passtY) {
      masse = {};
      masse[zielMasse.x.feld] = String(b);
      masse[zielMasse.y.feld] = String(l);
      massHinweis = "Breite und Länge gehen als <b>echte Maßfelder</b> mit " +
        "(<code>" + esc(zielMasse.x.feld) + "</code>, <code>" + esc(zielMasse.y.feld) + "</code>).";
    } else {
      massHinweis = "Ihre Maße liegen außerhalb dessen, was dieser Anfrageartikel im " +
        "Altsystem zulässt (Breite " + zielMasse.x.min + "–" + zielMasse.x.max + " cm, Länge " +
        zielMasse.y.min + "–" + zielMasse.y.max + " cm). Die Maße gehen deshalb nur als " +
        "Text im Kommentar mit.";
    }
  } else {
    massHinweis = "Dieser Anfrageartikel hat im Altsystem keine freien Maßfelder — " +
      "die Maße gehen als Text im Kommentar mit.";
  }

  $anfrage.innerHTML =
    '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px">' +
      '<button class="btn btn--lg" type="button" data-uebernehmen>Als Anfrage übernehmen</button>' +
      '<a class="btn btn--ghost" href="kontakt.html">Lieber persönlich besprechen</a>' +
    "</div>" +
    '<p class="bridge-source" style="border:0;padding-top:0">Die Anfrage hängt sich an den ' +
    "Anfrageartikel <b>" + esc(artikel.name) + "</b> (<code>" + esc(artikel.pfad) + "</code>) — " +
    'einen Artikel „freie Wunschmatte“ führt das Altsystem nicht. ' + massHinweis +
    " Ausführung, Sonderform und der oben errechnete Anfragepreis stehen im Kommentarfeld.</p>" +
    '<div data-uebernahmeresult></div>';

  $anfrage.querySelector("[data-uebernehmen]").addEventListener("click", function () {
    const btn = this;
    const out = $anfrage.querySelector("[data-uebernahmeresult]");
    btn.disabled = true;
    btn.textContent = "wird an matten.de gesendet …";
    out.innerHTML = "";
    window.MF.cart.add({
      pfad: artikel.pfad,
      anzahl: Math.max(1, Math.min(999, r.eingaben.menge | 0)),
      kommentar: konfigurationsText(r),
      werte: masse || {},
    }).then(function (j) {
      btn.disabled = false;
      btn.textContent = "Als Anfrage übernehmen";
      if (!j || !j.ok) { out.innerHTML = window.MF.apiFehler(j, "Anfrage übernehmen"); return; }
      const abgelehnt = (j.abgelehnt || []).length
        ? " Nicht übernommen: " + j.abgelehnt.map((a) => esc(a.feld) + " (" + esc(a.grund) + ")").join(", ")
        : "";
      out.innerHTML = '<div class="demo-note">' + window.MF.icon("checkC") +
        "<div><b>Im Anfragenkorb von matten.de</b>Die Konfiguration steht dort an der Position." +
        abgelehnt +
        " Der Warenkorb weist für diese Position <b>„auf Anfrage“</b> aus, nicht den oben " +
        "errechneten Anfragepreis — das Altsystem kennt diese Kalkulation nicht. " +
        '<a href="warenkorb.html">Zum Warenkorb</a></div></div>';
    });
  });
}

/* -------------------------------------------------------------- Neurechnen */
function neuRechnen() {
  const e = eingaben();
  pruefeFelder(e);
  const r = berechne(e);
  if (r.ok) zeigeErgebnis(r);
  else zeigeFehler(r);
}

const form = $("#calcForm");
form.addEventListener("input", neuRechnen);
form.addEventListener("change", neuRechnen);
neuRechnen();
