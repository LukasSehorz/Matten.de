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
  pruefe(13, 'Sonderfarben einzeilig, Text "Anzahl gewünschter Sonderfarben: 0= keine"',
    farbzeile && farbzeile.gleicheZeile && /Anzahl gewünschter Sonderfarben:\s*0=\s*keine/.test(farbzeile.text),
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

  /* --- WhatsApp: Standard gruen / Sonderanfertigung rot ----------------- */
  const artFuer = async (breite, laenge, form) => {
    await t.eval(`(() => {
      const s=(id,v,ev='change')=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event(ev,{bubbles:true}));};
      s('input_sonderfarben','0'); s('input_form',${JSON.stringify(form)});
      s('input_width',${JSON.stringify(breite)},'input'); s('input_length',${JSON.stringify(laenge)},'input');
    })()`);
    await new Promise(r => setTimeout(r, 1400));
    return t.eval(`(() => {
      const a = document.getElementById('groessen-art');
      if (!a) return null;
      return { text: a.textContent.trim(), farbe: getComputedStyle(a).color };
    })()`);
  };

  const fix = await t.eval(`(() => {
    const s = document.getElementById('input_fixed_size');
    if (!s) return null;
    const o = Array.from(s.options).find(o => /\\d+\\s*[x×]\\s*\\d+/.test(o.textContent));
    return o ? o.textContent.trim() : null;
  })()`);
  const sonder = await artFuer('63', '43', 'rechteckig');
  pruefe(19, 'Wunschmass zeigt "Sonderanfertigung" in Rot',
    sonder && sonder.text === 'Sonderanfertigung' && /220,\s*53,\s*69/.test(sonder.farbe),
    `${JSON.stringify(sonder)} (Fixgroesse im Angebot: ${fix})`);

  const mitForm = await artFuer('63', '43', 'sonderform');
  pruefe(20, 'Sonderform zeigt ebenfalls "Sonderanfertigung"',
    mitForm && mitForm.text === 'Sonderanfertigung', JSON.stringify(mitForm));

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
