/* ui-fuchsius-17-09.mjs — prueft die sechs Korrekturen aus den Mails
   von Dieter Fuchsius vom 16.09.2026 (20:24 und 20:30).

   Voraussetzung: Bruecke laeuft auf 8787, Chrome mit --headless=new
   --remote-debugging-port=9222.

   Aufruf:  node ui-fuchsius-17-09.mjs [produkt-slug]
*/
import { neuesZiel } from './cdp.mjs';

const SLUG = process.argv[2] || 'jetprint-premium-1-farbig';
const URL = `http://localhost:8787/net-neu/produkt.html?slug=${SLUG}`;

const ergebnisse = [];
function pruefe(nr, was, ok, befund) {
  ergebnisse.push({ nr, was, ok, befund });
  console.log(`${ok ? 'OK  ' : 'FEHL'}  ${nr}. ${was}`);
  if (!ok || process.env.AUSFUEHRLICH) console.log(`        ${befund}`);
}

const t = await neuesZiel(URL);
try {
  await t.warteBis('!!document.querySelector("#price")', 20000);
  await t.warteBis('!!document.querySelector("#input_form")', 20000);

  /* --- 1. Keine Aufpreise mehr im Formular ------------------------------ */
  const aufpreise = await t.eval(`(() => {
    const f = document.querySelector('#order-form') || document.forms[0] || document.body;
    const txt = f.innerText;
    const treffer = txt.match(/\\+\\s*\\d+\\s*(%|€)|\\(\\s*\\+[^)]*\\)/g) || [];
    return treffer.filter(s => !/^\\(\\+\\d+\\)$/.test(s.trim()));
  })()`);
  pruefe(1, 'Keine Aufpreisangaben im Bestellformular',
    aufpreise.length === 0, `gefunden: ${JSON.stringify(aufpreise)}`);

  /* --- 2./3. Zwei Auswahlfelder statt drei Kreuze ----------------------- */
  const felder = await t.eval(`(() => {
    const alt = ['sonderform_ohne_rand','sonderform_mit_rand','sonderfarbe']
      .filter(id => document.getElementById(id));
    const form = document.getElementById('input_form');
    const rand = document.getElementById('input_rand');
    const farb = document.getElementById('input_sonderfarben');
    const opt = el => el ? Array.from(el.options).map(o => o.value) : null;
    return { alteKreuze: alt, form: opt(form), rand: opt(rand),
             farbTyp: farb && farb.type, farbWert: farb && farb.value };
  })()`);
  pruefe(2, 'Alte Kreuze entfernt, Form-Auswahl vorhanden',
    felder.alteKreuze.length === 0 &&
    JSON.stringify(felder.form) === '["rechteckig","sonderform"]',
    `alteKreuze=${JSON.stringify(felder.alteKreuze)} form=${JSON.stringify(felder.form)}`);
  pruefe(3, 'Rand-Auswahl mit/ohne vorhanden',
    JSON.stringify(felder.rand) === '["mit","ohne"]',
    `rand=${JSON.stringify(felder.rand)}`);
  pruefe(4, 'Sonderfarben als Zahlenfeld, Vorgabe 0',
    felder.farbTyp === 'number' && felder.farbWert === '0',
    `typ=${felder.farbTyp} wert=${felder.farbWert}`);

  /* --- Preiswirkung: Sonderform und Sonderfarben ------------------------ */
  const preis = async () => t.eval(`document.getElementById('price').innerText.trim()`);
  const setze = async (id, wert, ereignis = 'change') => t.eval(`(() => {
    const el = document.getElementById(${JSON.stringify(id)});
    el.value = ${JSON.stringify(wert)};
    el.dispatchEvent(new Event(${JSON.stringify(ereignis)}, { bubbles: true }));
    return el.value;
  })()`);
  const zahl = s => Number(String(s).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.'));

  await t.warteBis(`!/Loading|spinner/i.test(document.getElementById('price').innerHTML)`, 15000);
  const p0 = await preis();

  await setze('input_form', 'sonderform');
  await new Promise(r => setTimeout(r, 800));
  const pForm = await preis();
  pruefe(5, 'Sonderform erhoeht den Preis (Rand: mit = +50 %)',
    zahl(pForm) > zahl(p0), `rechteckig=${p0} → sonderform=${pForm}`);

  await setze('input_rand', 'ohne');
  await new Promise(r => setTimeout(r, 800));
  const pOhne = await preis();
  pruefe(6, 'Ohne Rand guenstiger als mit Rand (+30 % statt +50 %)',
    zahl(pOhne) < zahl(pForm), `mit=${pForm} ohne=${pOhne}`);

  await setze('input_form', 'rechteckig');
  await new Promise(r => setTimeout(r, 800));
  const pRechteck = await preis();
  pruefe(7, 'Rechteckig ohne Formzuschlag, Randwahl bleibt wirkungslos',
    Math.abs(zahl(pRechteck) - zahl(p0)) < 0.02, `ausgangs=${p0} zurueck=${pRechteck}`);

  await setze('input_sonderfarben', '1', 'change');
  await new Promise(r => setTimeout(r, 800));
  const p1farbe = await preis();
  await setze('input_sonderfarben', '2', 'change');
  await new Promise(r => setTimeout(r, 800));
  const p2farben = await preis();
  const d1 = zahl(p1farbe) - zahl(pRechteck);
  const d2 = zahl(p2farben) - zahl(p1farbe);
  pruefe(8, '68 EUR netto je Sonderfarbe (brutto ~80,92)',
    d1 > 75 && d1 < 87 && Math.abs(d2 - d1) < 0.5,
    `0→1: +${d1.toFixed(2)}  1→2: +${d2.toFixed(2)} (brutto, inkl. 19 %)`);

  /* --- 5. Kein Weg-Hinweis unter dem Endpreis --------------------------- */
  await setze('input_sonderfarben', '0', 'change');
  await t.eval(`(() => {
    const b = document.getElementById('input_width'), l = document.getElementById('input_length');
    b.value = '63'; b.dispatchEvent(new Event('input', { bubbles: true }));
    l.value = '43'; l.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  const hinweis = await t.eval(`(document.getElementById('weg-hinweis')||{}).innerText || ''`);
  pruefe(9, 'Kein Wunschmass-Hinweis unter dem Endpreis',
    hinweis.trim() === '', `Text: "${hinweis.trim()}"`);

  /* --- 6. Mehrere Designfarben namentlich ------------------------------- */
  const farben = await t.eval(`(() => {
    const schalter = document.getElementById('multiple_colors');
    if (!schalter) return { entfaellt: 'kein Mehrfarben-Schalter bei diesem Artikel' };
    schalter.checked = true;
    schalter.dispatchEvent(new Event('change', { bubbles: true }));
    const gruppe = document.querySelector(schalter.getAttribute('data-target'));
    const boxen = Array.from(gruppe.querySelectorAll('input')).slice(0, 3);
    const gewaehlt = [];
    for (const b of boxen) {
      b.checked = true;
      b.dispatchEvent(new Event('change', { bubbles: true }));
      gewaehlt.push(b.value);
    }
    /* Die Beschriftung gehoert zu DIESER Farbgruppe — der Schalter zeigt auf
       #attribute-input-<n>, die Anzeige heisst #color-attribute-<n>. */
    const n = (schalter.getAttribute('data-target').match(/(\\d+)$/) || [])[1];
    const anzeige = document.getElementById('color-attribute-' + n);
    return { gewaehlt, anzeige: anzeige ? anzeige.textContent.trim() : null };
  })()`);
  if (farben.entfaellt) {
    pruefe(10, 'Mehrere Designfarben namentlich', true, `entfaellt — ${farben.entfaellt}`);
  } else {
    const zaehlerStil = /\(\+\d+\)/.test(farben.anzeige || '');
    const mehrere = (farben.anzeige || '').split(',').length >= 2;
    pruefe(10, 'Mehrere Designfarben namentlich statt "(+n)"',
      !zaehlerStil && mehrere,
      `gewaehlt=${JSON.stringify(farben.gewaehlt)} anzeige="${farben.anzeige}"`);
  }

  /* ====================================================================
     Zweite Mail / WhatsApp vom 17.09.2026 — Layout und Beschriftung
     ==================================================================== */

  /* --- Punkt 1: Rand steht vor Form ------------------------------------ */
  const reihenfolge = await t.eval(`(() => {
    const alle = Array.from(document.querySelectorAll('#input_rand, #input_form'));
    return alle.map(e => e.id);
  })()`);
  pruefe(12, 'Rand steht vor Form',
    JSON.stringify(reihenfolge) === '["input_rand","input_form"]',
    `Reihenfolge im DOM: ${JSON.stringify(reihenfolge)}`);

  /* --- Punkt 2: Sonderfarben einzeilig mit neuem Text ------------------- */
  const farbzeile = await t.eval(`(() => {
    const feld = document.getElementById('input_sonderfarben');
    const label = document.querySelector('label[for="input_sonderfarben"]');
    if (!feld || !label) return null;
    const rf = feld.getBoundingClientRect(), rl = label.getBoundingClientRect();
    return {
      text: label.textContent.trim(),
      gleicheZeile: Math.abs((rf.top + rf.height/2) - (rl.top + rl.height/2)) < 12,
      feldBreite: Math.round(rf.width)
    };
  })()`);
  /* Beschriftung geaendert am 01.10.2026 (Screenshot des Auftraggebers):
     in der Label-Spalte steht nur noch "Anzahl", die Erklaerung
     "Sonderfarben, 0 = keine" steht rechts daneben beim Feld.
     Genauer geprueft wird das weiter unten in Abschnitt C1. */
  pruefe(13, 'Sonderfarben einzeilig, Beschriftung "Anzahl"',
    farbzeile && farbzeile.gleicheZeile && /^Anzahl$/.test(farbzeile.text),
    JSON.stringify(farbzeile));

  /* --- Punkt 3: flachere Felder ---------------------------------------- */
  const hoehen = await t.eval(`(() => {
    const ids = ['input_width','input_length','input_rand','input_form','input_sonderfarben','input_quantity'];
    const h = ids.map(id => { const e = document.getElementById(id);
      return e ? Math.round(e.getBoundingClientRect().height) : null; }).filter(Boolean);
    return { hoehen: h, max: Math.max(...h) };
  })()`);
  pruefe(14, 'Eingabefelder flacher als die Bootstrap-Vorgabe (38 px)',
    hoehen.max <= 32, `Hoehen: ${JSON.stringify(hoehen.hoehen)}`);

  /* --- Punkt 4: MWSt. in derselben Zeile wie der Preis ------------------ */
  const preisZeile = await t.eval(`(() => {
    const p = document.getElementById('price');
    const mwst = Array.from(document.querySelectorAll('.preis-zeile small'))
      .find(e => /MWSt/i.test(e.textContent));
    if (!p || !mwst) return null;
    const rp = p.getBoundingClientRect(), rm = mwst.getBoundingClientRect();
    return { gleicheZeile: Math.abs(rp.bottom - rm.bottom) < 8,
             preis: p.textContent.trim(), mwst: mwst.textContent.trim() };
  })()`);
  pruefe(15, 'MWSt.-Angabe steht hinter dem Preis, nicht darunter',
    preisZeile && preisZeile.gleicheZeile, JSON.stringify(preisZeile));

  /* --- Punkt 5: Endpreis einzeilig ------------------------------------- */
  const endpreis = await t.eval(`(() => {
    const e = document.getElementById('endpreis');
    if (!e) return null;
    const stil = getComputedStyle(e);
    const zeilenhoehe = parseFloat(stil.lineHeight) || 20;
    return { text: e.textContent.trim(),
             zeilen: Math.round(e.getBoundingClientRect().height / zeilenhoehe),
             umbruch: stil.whiteSpace };
  })()`);
  pruefe(16, 'Endpreis steht in einer Zeile',
    endpreis && endpreis.zeilen <= 1, JSON.stringify(endpreis));

  /* --- Punkt 6: Knopf heisst "Angebot anfordern" ----------------------- */
  const knopf = await t.eval(`(() => {
    const k = document.getElementById('add-to-inquiry');
    return k ? k.textContent.trim() : null;
  })()`);
  pruefe(17, 'Knopf heisst "Angebot anfordern" statt "Make an offer"',
    knopf === 'Angebot anfordern', `Beschriftung: "${knopf}"`);

  /* --- Punkt 7: Formular und Farbfelder gleich breit -------------------- */
  const breiten = await t.eval(`(() => {
    const w = el => el ? Math.round(el.getBoundingClientRect().width) : null;
    const form = document.getElementById('order-form');
    /* .color-input-container ist der Block der Farbfelder. Produkte ohne
       Farbauswahl (z. B. Kokos naturfarbig) haben ihn nicht — dann entfaellt
       der Vergleich. */
    const farbBox = document.querySelector('.color-input-container');
    return { formular: w(form), farbfelder: w(farbBox) };
  })()`);
  pruefe(18, 'Bestellformular und Farbfeld-Block gleich breit',
    breiten.farbfelder === null ||
    Math.abs(breiten.formular - breiten.farbfelder) <= 4,
    `Formular=${breiten.formular} Farbfelder=${breiten.farbfelder}`);

  /* ====================================================================
     Mail Fuchsius 18.09.2026 + Screenshot — Abschnitt B und C
     des Auftrags vom 01.10.2026
     ==================================================================== */

  /* --- B: Standard / Spezial folgt der Preisformel ---------------------- */
  /* Vorher wurde gegen die Fixgroessen-Auswahlliste geprueft (!freieMasse),
     jetzt gegen faktorBreiteFuer(): Standard, sobald Breite ODER Laenge eine
     Standardbreite trifft. Der erwartete Faktor wird mit der echten
     Preisformel gegengerechnet, nicht von Hand hingeschrieben. */
  const { faktorBreiteFuer } = await import(
    '../../../bridge-demo/public/preisformel.js');

  const artFuer = async (breite, laenge, form = 'rechteckig', farben = '0') => {
    await t.eval(`(() => {
      const s=(id,v,ev='change')=>{const e=document.getElementById(id);if(!e)return;e.value=v;e.dispatchEvent(new Event(ev,{bubbles:true}));};
      /* Groesse auf "Custom", sonst springt das Mass auf die Fixgroesse zurueck */
      const g=document.getElementById('input_fixed_size');
      if(g){const o=Array.from(g.options).find(o=>/CUSTOM/.test(o.value));if(o)s('input_fixed_size',o.value);}
      s('input_sonderfarben',${JSON.stringify(farben)}); s('input_form',${JSON.stringify(form)});
      s('input_width',${JSON.stringify(breite)},'input'); s('input_length',${JSON.stringify(laenge)},'input');
    })()`);
    await new Promise(r => setTimeout(r, 1400));
    return t.eval(`(() => {
      const a = document.getElementById('groessen-art');
      if (!a) return null;
      return { text: a.textContent.trim(), farbe: getComputedStyle(a).color };
    })()`);
  };

  /* Die Standardbreiten des gepruefeten Produkts aus window.NET lesen —
     dieselbe Quelle, aus der seite-produkt.js die Stammdaten baut. */
  const stammIst = await t.eval(`(() => {
    const p = (window.NET.produkte || {})[${JSON.stringify(SLUG)}] || {};
    return { standardbreiten: (p.preisdaten || {}).standardbreiten || null,
             einkaufProQm: (p.preisdaten || {}).einkaufProQm || null };
  })()`);

  const GRUEN = /40,\s*167,\s*69/;      /* #28a745 */
  const ROT   = /220,\s*53,\s*69/;      /* #dc3545 */

  /* Die fuenf Faelle aus dem Auftrag: 85x120 und 120x85 sind der eigentliche
     Befund — Standardbreite 85 getroffen, also Standard, obwohl das Mass in
     keiner Fixgroessenliste steht. */
  const faelle = [
    [40, 60, 'Standard'], [85, 120, 'Standard'], [120, 85, 'Standard'],
    [63, 43, 'Spezial'],  [90, 120, 'Spezial']
  ];
  let nr = 19;
  for (const [b, l, erwartet] of faelle) {
    const a = await artFuer(String(b), String(l));
    /* Gegenrechnung mit der echten Preisformel */
    const faktor = stammIst.standardbreiten
      ? faktorBreiteFuer(b, l, { minBreite: 40, standardbreiten: stammIst.standardbreiten, faktorSondermass: 1.25 })
      : null;
    const erwartetAusFormel = faktor === 1 ? 'Standard' : 'Spezial';
    const farbeOk = erwartet === 'Standard' ? GRUEN.test(a && a.farbe) : ROT.test(a && a.farbe);
    pruefe(nr++, `${b}x${l} cm zeigt "${erwartet}" (${erwartet === 'Standard' ? 'gruen' : 'rot'})`,
      !!a && a.text === erwartet && erwartetAusFormel === erwartet && farbeOk,
      `angezeigt=${JSON.stringify(a)} Faktor der Preisformel=${faktor} → ${erwartetAusFormel}`);
  }

  /* Sonderform/Sonderfarbe schlagen das Standardmass */
  const stdMitForm = await artFuer('85', '120', 'sonderform');
  pruefe(nr++, 'Standardmass + Sonderform zeigt "Spezial"',
    stdMitForm && stdMitForm.text === 'Spezial' && ROT.test(stdMitForm.farbe),
    JSON.stringify(stdMitForm));
  const stdMitFarbe = await artFuer('85', '120', 'rechteckig', '1');
  pruefe(nr++, 'Standardmass + Sonderfarbe zeigt "Spezial"',
    stdMitFarbe && stdMitFarbe.text === 'Spezial',
    JSON.stringify(stdMitFarbe));

  /* Das Wort "Sonderanfertigung" darf nirgends mehr auf der Seite stehen */
  const altesWort = await t.eval(`document.body.innerText.indexOf('Sonderanfertigung') >= 0`);
  pruefe(nr++, 'Wort "Sonderanfertigung" kommt nicht mehr vor', altesWort === false,
    `gefunden im Seitentext: ${altesWort}`);

  /* --- C1: Sonderfarben-Zeile nach dem Screenshot ---------------------- */
  await artFuer('85', '120');   /* Zustand aufraeumen: Standard, keine Zuschlaege */
  const farbzeileNeu = await t.eval(`(() => {
    const label = document.querySelector('label[for="input_sonderfarben"]');
    const erkl = document.querySelector('.sonderfarben-erklaerung');
    const feld = document.getElementById('input_sonderfarben');
    if (!label || !erkl || !feld) return null;
    const r = el => el.getBoundingClientRect();
    const mitte = el => r(el).top + r(el).height / 2;
    const randLabel = document.querySelector('label[for="input_rand"]');
    return {
      label: label.textContent.trim(),
      erklaerung: erkl.textContent.trim(),
      eineZeile: Math.abs(mitte(label) - mitte(feld)) < 14 && Math.abs(mitte(erkl) - mitte(feld)) < 14,
      textVorFeld: r(erkl).right <= r(feld).left + 1,
      feldBreite: Math.round(r(feld).width),
      /* buendig mit der Beschriftungsspalte darueber ("Rand") */
      buendig: randLabel ? Math.abs(r(label).left - r(randLabel).left) < 2 : null
    };
  })()`);
  pruefe(nr++, 'Beschriftung ist nur "Anzahl", Erklaerung steht rechts davor beim Feld',
    farbzeileNeu && farbzeileNeu.label === 'Anzahl' &&
    /Sonderfarben,\s*0\s*=\s*keine/.test(farbzeileNeu.erklaerung) &&
    farbzeileNeu.eineZeile && farbzeileNeu.textVorFeld &&
    (farbzeileNeu.buendig === null || farbzeileNeu.buendig),
    JSON.stringify(farbzeileNeu));

  /* --- C2: Preisblock -------------------------------------------------- */
  const preisblock = await t.eval(`(() => {
    const p = document.getElementById('price');
    const end = document.getElementById('endpreis');
    const art = document.getElementById('groessen-art');
    const versand = document.getElementById('shipping_cost');
    const mwst = Array.from(document.querySelectorAll('.preis-zeile small')).find(e => /MWSt/i.test(e.textContent));
    if (!p || !end || !art) return null;
    const px = el => parseFloat(getComputedStyle(el).fontSize);
    const r = el => el.getBoundingClientRect();
    const betrag = end.querySelector('.endpreis-betrag');
    return {
      preisText: p.textContent.trim(),
      preisGroesse: px(p), preisGewicht: getComputedStyle(p).fontWeight,
      mwstText: mwst ? mwst.textContent.trim() : null,
      mwstGroesse: mwst ? px(mwst) : null,
      mwstNeben: mwst ? Math.abs(r(p).bottom - r(mwst).bottom) < 8 : null,
      versandText: versand ? versand.textContent.trim() : null,
      versandUnter: versand ? r(versand).top >= r(p).bottom - 4 : null,
      endText: end.textContent.trim(),
      betragGewicht: betrag ? getComputedStyle(betrag).fontWeight : null,
      /* "Standard"/"Spezial" VOR dem Endpreis in derselben Zeile */
      artVorEndpreis: r(art).right <= r(end).left + 1,
      artGleicheZeile: Math.abs((r(art).top + r(art).height/2) - (r(end).top + r(end).height/2)) < 12,
      artText: art.textContent.trim()
    };
  })()`);
  pruefe(nr++, 'Betrag gross und fett, "inkl. MWSt." klein daneben, Versand darunter',
    preisblock && preisblock.preisGroesse >= 20 && Number(preisblock.preisGewicht) >= 700 &&
    preisblock.mwstGroesse < preisblock.preisGroesse && preisblock.mwstNeben === true &&
    /Versand/i.test(preisblock.versandText || '') && preisblock.versandUnter === true,
    JSON.stringify(preisblock));
  pruefe(nr++, 'Standard/Spezial steht VOR dem Endpreis in derselben Zeile',
    preisblock && preisblock.artVorEndpreis === true && preisblock.artGleicheZeile === true &&
    /Endpreis/.test(preisblock.endText) && Number(preisblock.betragGewicht) >= 700,
    JSON.stringify(preisblock));

  /* --- C3/C4: Kunden-Bemerkung und Kunden-Datei ------------------------ */
  const neueFelder = await t.eval(`(() => {
    const ta = document.getElementById('input_bemerkung');
    const label = document.querySelector('label[for="input_bemerkung"]');
    const datei = document.getElementById('input_datei');
    const dLabel = document.querySelector('label[for="input_datei"]');
    const anfrage = document.getElementById('add-to-inquiry');
    const erkl = document.querySelector('.datei-erklaerung');
    const preis = document.getElementById('price');
    const r = el => el.getBoundingClientRect();
    return {
      textarea: ta ? ta.tagName : null,
      maxlength: ta ? ta.getAttribute('maxlength') : null,
      beschriftung: label ? label.textContent.trim() : null,
      unterPreis: (ta && preis) ? r(ta).top >= r(preis).bottom - 4 : null,
      dateiTyp: datei ? datei.type : null,
      dateiKnopf: dLabel ? dLabel.textContent.trim() : null,
      knopfRechts: (dLabel && anfrage) ? r(dLabel).left >= r(anfrage).right - 2 : null,
      hinweisText: erkl ? erkl.textContent.replace(/\\s+/g,' ').trim() : null
    };
  })()`);
  pruefe(nr++, 'Kunden-Bemerkung: <textarea> unter dem Preisblock, 500 Zeichen',
    neueFelder && neueFelder.textarea === 'TEXTAREA' && neueFelder.maxlength === '500' &&
    neueFelder.beschriftung === 'Kunden-Bemerkung' && neueFelder.unterPreis === true,
    JSON.stringify(neueFelder));
  pruefe(nr++, 'Knopf "Kunden-Datei hochladen" rechts neben "Angebot anfordern", mit ehrlichem Hinweis',
    neueFelder && neueFelder.dateiTyp === 'file' &&
    neueFelder.dateiKnopf === 'Kunden-Datei hochladen' && neueFelder.knopfRechts === true &&
    /nicht/i.test(neueFelder.hinweisText || '') && /E-Mail/i.test(neueFelder.hinweisText || ''),
    JSON.stringify(neueFelder));

  /* Dateiname eintragen (ohne echte Datei: File/DataTransfer im Browser) */
  const dateiAnzeige = await t.eval(`(() => {
    const el = document.getElementById('input_datei');
    const dt = new DataTransfer();
    dt.items.add(new File(['x'], 'logo.pdf', { type: 'application/pdf' }));
    el.files = dt.files;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return (document.getElementById('datei-hinweis') || {}).innerText || '';
  })()`);
  pruefe(nr++, 'Gewaehlter Dateiname wird angezeigt',
    /logo\.pdf/.test(dateiAnzeige), `Anzeige: "${dateiAnzeige.trim()}"`);

  /* --- Beides muss im Bestellkommentar landen -------------------------- */
  const BEMERKUNG = 'Bitte Logo mittig, Rand dunkelgrau';
  await t.eval(`(() => {
    const ta = document.getElementById('input_bemerkung');
    ta.value = ${JSON.stringify(BEMERKUNG)};
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await t.api('/api/cart/clear', {});
  await new Promise(r => setTimeout(r, 400));
  await t.klick('#add-to-cart');
  /* Das Altsystem braucht fuer die Position unterschiedlich lange (lokal
     1-6 s). Deshalb warten, bis der Korb etwas enthaelt, statt fest zu
     schlafen — mit festen 6 s fiel die Pruefung gelegentlich durch. */
  let kommentare = '';
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    const k = await t.api('/api/cart');
    kommentare = ((k.d && k.d.items) || []).map(x => x.kommentar || '').join('\n');
    if (kommentare) break;
  }
  pruefe(nr++, 'Kunden-Bemerkung steht als eigener Abschnitt im Bestellkommentar',
    kommentare.indexOf('Kundenbemerkung: ' + BEMERKUNG) >= 0,
    `Kommentar: ${JSON.stringify(kommentare).slice(0, 700)}`);
  pruefe(nr++, 'Dateiname steht im Bestellkommentar',
    /Kunde hat Datei angek.ndigt: logo\.pdf/.test(kommentare),
    `Kommentar: ${JSON.stringify(kommentare).slice(0, 700)}`);
  await t.api('/api/cart/clear', {});

  /* --- Kein waagerechter Ueberlauf ------------------------------------- */
  for (const breite of [1280, 768, 375]) {
    await t.viewport(breite, 900);
    await new Promise(r => setTimeout(r, 700));
    const ueber = await t.eval(`({ scroll: document.documentElement.scrollWidth, fenster: window.innerWidth })`);
    pruefe(nr++, `Kein waagerechter Ueberlauf bei ${breite} px`,
      ueber.scroll <= ueber.fenster + 1, JSON.stringify(ueber));
    if (breite === 1280 || breite === 375) {
      await t.screenshot(`formular-01-10-${breite}.png`);
      console.log(`        Screenshot: formular-01-10-${breite}.png`);
    }
  }
  await t.viewport(1280, 900);

  /* --- Konsole sauber? -------------------------------------------------- */
  const fehler = t.konsole.filter(z => z.typ === 'error');
  pruefe(11, 'Keine Fehler in der Browser-Konsole',
    fehler.length === 0, JSON.stringify(fehler.slice(0, 3)));

} finally {
  await t.schliessen();
}

const fehl = ergebnisse.filter(e => !e.ok);
console.log(`\n${ergebnisse.length - fehl.length}/${ergebnisse.length} bestanden`);
process.exit(fehl.length ? 1 : 0);
