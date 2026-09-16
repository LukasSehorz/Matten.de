/* ui-produkt.mjs — C15 (UI-Werte), C16, D17–D19, Sonderfälle (569 / 6300000-a / Kokos mm) über die echte Seite (CDP).
   Warenkorb wird nach jedem Schritt geleert (POST /api/cart/clear aus der Seite). Nie /api/kasse/bestellen. */
import { neuesZiel } from './cdp.mjs';
import fs from 'node:fs';

const B = 'http://localhost:8787/net-neu/';
const out = [];
const log = (name, daten) => { out.push({ schritt: name, ...daten }); console.error('·', name); };

async function produkt(t, slug) {
  await t.navigiere(B + 'produkt.html?slug=' + slug);
  await t.warteBis('!!document.querySelector("#price") && !document.querySelector("#price .spinner-border") && !document.querySelector(".product-loading.d-flex")', 20000);
  await t.pause(400);
}
const LESE = `(function(){ const q=(s)=>document.querySelector(s); return { preis: q('#price')?.textContent.trim(), versand: q('#shipping_cost')?.textContent.trim(), endpreis: q('#endpreis')?.textContent.trim(), weg: q('#weg-hinweis')?.textContent.trim(), hinweisB: q('#hinweis-breite')?.textContent.trim(), hinweisL: q('#hinweis-laenge')?.textContent.trim(), kaufDisabled: q('#add-to-cart')?.disabled, formKlasse: q('#add_to_cart_form').className, breite: q('#input_width')?.value, laenge: q('#input_length')?.value, menge: q('#input_quantity')?.value, sichtB: getComputedStyle(q('#order_input_width')).display, sichtL: getComputedStyle(q('#order_input_length')).display, sichtFW: q('#order_input_fixed_width')? getComputedStyle(q('#order_input_fixed_width')).display : null }; })()`;
async function lese(t) { await t.pause(350); return t.eval(LESE); }
async function custom(t, b, l, menge) {
  const sel = await t.eval('!!document.querySelector("#input_fixed_size")');
  if (sel) await t.setze('#input_fixed_size', 'FIXED+CUSTOM_SIZE');
  await t.setze('#input_width', b); await t.setze('#input_length', l);
  if (menge != null) await t.setze('#input_quantity', menge);
}
async function korb(t) { const r = await t.api('/api/cart'); return r.d; }
async function leeren(t) { await t.api('/api/cart/clear', {}); }
async function modalZu(t) { await t.eval('(function(){ if (window.jQuery) jQuery("#cart-modal").modal("hide"); return true; })()'); await t.pause(500); }
async function klickUndWarte(t, knopf) {
  await t.eval('document.querySelector("#produkt-meldung").innerHTML=""');
  await t.klick(knopf);
  await t.warteBis('!!document.querySelector("#produkt-meldung .alert")', 40000);
  await t.pause(800);
  return t.eval(`(function(){ return { meldung: document.querySelector('#produkt-meldung').innerText.trim(), modalOffen: document.querySelector('#cart-modal').classList.contains('show'), zaehler: document.querySelector('button[data-target="#cart-modal"]').textContent.replace(/\\s+/g,' ').trim(), zeilen: [...document.querySelectorAll('#cart-zeilen tr')].map(tr=>tr.innerText.replace(/\\s+/g,' ').trim()).slice(0,4), summen: [...document.querySelectorAll('#cart-summen tr')].map(tr=>tr.innerText.replace(/\\s+/g,' ').trim()), hinweis: document.querySelector('#cart-modal .cart-fehler')?.innerText.trim() }; })()`);
}
function pos(k) { return (k.items || []).map((i) => ({ pfad: i.pfad, name: i.name, attribut: i.attribut, preis: i.preis, anzahl: i.anzahl, summe: i.summe, modus: i.modus, kommentar: i.kommentar })); }

const t = await neuesZiel('about:blank');
await t.viewport(1280, 2400);
try {
  await t.navigiere(B + 'index.html');   /* relative /api-Aufrufe brauchen eine Seite der Auslieferung */
  await leeren(t);
  /* ---------- C15 jetprint-premium ---------- */
  await produkt(t, 'jetprint-premium');
  log('jp-start', { ...(await lese(t)), konsole: t.konsole.slice() });
  await t.setze('#input_fixed_size', '343'); log('C15a 40x60 fix', await lese(t));
  await custom(t, 50, 200, 1); log('C15b 50x200', await lese(t));
  await custom(t, 90, 120, 1); log('C15c 90x120', await lese(t));
  await t.setze('#input_fixed_size', '345'); await t.setze('#input_quantity', 5); log('C15d 60x90 x5', await lese(t));
  await custom(t, 85, 120, 2); await t.haken('#sonderfarbe', true); log('C15e 85x120 x2 sonderfarbe', await lese(t));
  await t.haken('#sonderfarbe', false); await t.setze('#input_quantity', 1); await t.haken('#sonderform_mit_rand', true); log('C15f 85x120 mitRand', await lese(t));
  await t.haken('#sonderform_mit_rand', false); await custom(t, 250, 250, 1); log('C15g 250x250', await lese(t));
  await custom(t, 200, 250, 1); log('C15g2 200x250', await lese(t));
  await custom(t, 29, 100, 1); log('C15h 29x100', await lese(t));
  await custom(t, 100, 29, 1); log('C15h2 100x29', await lese(t));
  await custom(t, 100, 800, 1); log('C15h3 100x800', await lese(t));
  await custom(t, 90, 120, 1); log('C15c2 90x120 wieder', await lese(t));

  /* ---------- D17: Fixgröße 40x60, Menge 1 -> In den Warenkorb ---------- */
  await t.setze('#input_fixed_size', '343'); await t.setze('#input_quantity', 1); await t.pause(300);
  const vorD17 = await lese(t);
  const d17 = await klickUndWarte(t, '#add-to-cart');
  const k17 = await korb(t);
  log('D17 40x60 kauf', { vorher: vorD17, ui: d17, korb: { count: k17.count, modus: k17.modus, gesamt: k17.gesamt, zwischensumme: k17.zwischensumme, versand: k17.versand, umsatzsteuer: k17.umsatzsteuer, ustSatz: k17.ustSatz }, positionen: pos(k17) });
  await modalZu(t);

  /* ---------- D22 (Teil 1): Anfrage in Korb mit Kaufposition -> Warnung ---------- */
  await custom(t, 90, 120, 1); await t.pause(300);
  await t.eval('document.querySelector("#produkt-meldung").innerHTML=""');
  await t.klick('#add-to-inquiry');
  await t.warteBis('!!document.querySelector("#produkt-meldung .alert")', 20000); await t.pause(300);
  const warn = await t.eval('({ text: document.querySelector("#produkt-meldung").innerText.trim(), trotzdem: !!document.querySelector("#trotzdem"), abbrechen: !!document.querySelector("#abbrechen") })');
  const k22a = await korb(t);
  log('D22a Warnung gemischt', { warn, korbCountUnveraendert: k22a.count });
  await t.klick('#abbrechen'); await t.pause(200);
  const nachAbbruch = await t.eval('document.querySelector("#produkt-meldung").innerText.trim()');
  await t.eval('document.querySelector("#produkt-meldung").innerHTML=""');
  await t.klick('#add-to-inquiry'); await t.warteBis('!!document.querySelector("#trotzdem")', 20000);
  await t.klick('#trotzdem');
  await t.warteBis('!!document.querySelector("#produkt-meldung .alert-success, #produkt-meldung .alert-danger")', 40000); await t.pause(800);
  const d22 = await t.eval(`(function(){ return { meldung: document.querySelector('#produkt-meldung').innerText.trim(), modalOffen: document.querySelector('#cart-modal').classList.contains('show'), zaehler: document.querySelector('button[data-target="#cart-modal"]').textContent.replace(/\\s+/g,' ').trim(), hinweis: document.querySelector('#cart-modal .cart-fehler')?.innerText.trim(), summen: [...document.querySelectorAll('#cart-summen tr')].map(tr=>tr.innerText.replace(/\\s+/g,' ').trim()) }; })()`);
  const k22 = await korb(t);
  log('D22b gemischt angelegt', { nachAbbruch, ui: d22, korb: { count: k22.count, modus: k22.modus, gesamt: k22.gesamt }, positionen: pos(k22) });
  await modalZu(t);
  await leeren(t);

  /* ---------- D18: Wunschmaß 90x120 -> Make an offer (reiner Korb) ---------- */
  await produkt(t, 'jetprint-premium');
  await custom(t, 90, 120, 1); await t.pause(300);
  const vorD18 = await lese(t);
  const d18 = await klickUndWarte(t, '#add-to-inquiry');
  const k18 = await korb(t);
  log('D18 90x120 offer', { vorher: vorD18, ui: d18, korb: { count: k18.count, modus: k18.modus, gesamt: k18.gesamt }, positionen: pos(k18) });
  await modalZu(t); await leeren(t);

  /* ---------- 85x120 -> Make an offer -> eigener Zwilling 6300000-a ---------- */
  await custom(t, 85, 120, 1); await t.pause(300);
  const vor85 = await lese(t);
  const d85 = await klickUndWarte(t, '#add-to-inquiry');
  const k85 = await korb(t);
  log('D18b 85x120 offer', { vorher: vor85, ui: d85, positionen: pos(k85) });
  await modalZu(t); await leeren(t);

  /* ---------- D19: Fixgröße + Sonderfarbe -> In den Warenkorb -> Anfrage ---------- */
  await t.setze('#input_fixed_size', '343'); await t.setze('#input_quantity', 1); await t.haken('#sonderfarbe', true); await t.pause(300);
  const vor19 = await lese(t);
  const d19 = await klickUndWarte(t, '#add-to-cart');
  const k19 = await korb(t);
  log('D19 40x60 sonderfarbe kauf', { vorher: vor19, ui: d19, positionen: pos(k19) });
  await modalZu(t); await leeren(t);
  await t.haken('#sonderfarbe', false);

  /* ---------- Fixgröße 85x300 mit Sonderform ohne Rand -> Zwilling? ---------- */
  await t.setze('#input_fixed_size', '348'); await t.haken('#sonderform_ohne_rand', true); await t.pause(300);
  const vor348 = await lese(t);
  const d348 = await klickUndWarte(t, '#add-to-cart');
  log('D19b 85x300 sonderform ohne Rand', { vorher: vor348, ui: d348, positionen: pos(await korb(t)) });
  await modalZu(t); await leeren(t);

  /* ---------- Farbwahl: Bildwechsel + Farbe im Korb ---------- */
  await produkt(t, 'jetprint-premium');
  const farbeVor = await t.eval('({ small: document.querySelector("#color-attribute-0")?.textContent, bild: document.querySelector("#variety-images .product-image-container.active img")?.getAttribute("src"), farbNav: !document.querySelector("#bild-nav-farbe")?.hidden })');
  await t.eval('(function(){ const r=document.querySelector("input[data-farbgruppe=\\"0\\"][value=\\"601-zitronengelb\\"]"); r.checked=true; r.dispatchEvent(new Event("change",{bubbles:true})); })()');
  await t.pause(600);
  const farbeNach = await t.eval('({ small: document.querySelector("#color-attribute-0")?.textContent, bild: document.querySelector("#variety-images .product-image-container.active img")?.getAttribute("src"), farbNav: !document.querySelector("#bild-nav-farbe")?.hidden, alt: document.querySelector("#image-farbe img")?.alt, geladen: document.querySelector("#image-farbe img")?.naturalWidth })');
  await t.setze('#input_fixed_size', '343');
  const dF = await klickUndWarte(t, '#add-to-cart');
  log('Farbe 601 + Bild', { farbeVor, farbeNach, positionen: pos(await korb(t)) });
  await modalZu(t); await leeren(t);

  /* ---------- Kokos natur 90x120 (flaeche in mm) + 30mm Aufschlag ---------- */
  await produkt(t, 'kokosmatten-naturfarbig');
  log('kokos-start', { ...(await lese(t)), konsole: t.konsole.slice() });
  await custom(t, 100, 100, 1); log('C15j0 kokos 100x100 13/14mm', await lese(t));
  await t.setze('select[data-attribut="attributes[0]"]', '166'); log('C15j kokos 100x100 30mm', await lese(t));
  await t.setze('select[data-attribut="attributes[0]"]', '148');
  await custom(t, 90, 120, 1); await t.pause(300);
  const vorK = await lese(t);
  const dK = await klickUndWarte(t, '#add-to-cart');
  log('Kokos 90x120 kauf (mm)', { vorher: vorK, ui: dK, positionen: pos(await korb(t)) });
  await modalZu(t); await leeren(t);
  await custom(t, 90, 120, 1); await t.pause(300);
  const dK2 = await klickUndWarte(t, '#add-to-inquiry');
  log('Kokos 90x120 offer', { ui: dK2, positionen: pos(await korb(t)) });
  await modalZu(t); await leeren(t);

  /* ---------- Diplomat: 4 Selects, Kratzkante, zu breit ---------- */
  await produkt(t, 'aluminium-profilmatte-typ-diplomat-r');
  log('dipl-start', { ...(await lese(t)), konsole: t.konsole.slice() });
  await custom(t, 100, 100, 1); log('C15k0 dipl 100x100 ohne', await lese(t));
  await t.setze('select[data-attribut="attributes[4]"]', '1838'); log('C15k dipl 100x100 Kratzkante', await lese(t));
  await custom(t, 120, 150, 1); log('C15g3 dipl 120x150 (zu breit?)', await lese(t));
  await custom(t, 100, 150, 1); await t.pause(300);
  const dD = await klickUndWarte(t, '#add-to-inquiry');
  log('Diplomat 100x150 Kratzkante offer', { ui: dD, positionen: pos(await korb(t)) });
  await modalZu(t); await leeren(t);

  /* ---------- IRON-HORSE 1-farbig (Standardbreiten 85/115/150/200) ---------- */
  await produkt(t, 'iron-horse-1-farbige-und-melierte-schmutzfangmatten');
  log('ih-start', { ...(await lese(t)), konsole: t.konsole.slice() });
  await custom(t, 60, 100, 1); log('C15i1 IH 60x100', await lese(t));
  await custom(t, 85, 100, 1); log('C15i2 IH 85x100', await lese(t));
  await custom(t, 60, 100, 1); await t.pause(300);
  const dIH = await klickUndWarte(t, '#add-to-cart');
  log('IH 60x100 kauf', { ui: dIH, positionen: pos(await korb(t)) });
  await modalZu(t); await leeren(t);

  /* ---------- IRON-HORSE-Mietmatte (EK 0 -> Live-Preis) ---------- */
  await produkt(t, 'iron-horse-matte');
  await t.pause(1500);
  log('mietmatte-start', { ...(await lese(t)), konsole: t.konsole.slice(), groesse: await t.eval('[...document.querySelectorAll("#input_fixed_size option")].map(o=>o.value+"="+o.textContent)') });
  const dM = await klickUndWarte(t, '#add-to-cart');
  log('Mietmatte 50x85 kauf', { ui: dM, positionen: pos(await korb(t)) });
  await modalZu(t); await leeren(t);
  await t.eval('document.querySelector("#produkt-meldung").innerHTML=""');
  const dM2 = await klickUndWarte(t, '#add-to-inquiry');
  log('Mietmatte 50x85 offer', { ui: dM2, positionen: pos(await korb(t)) });
  await modalZu(t); await leeren(t);

  /* ---------- kokos-gestaltet (nur Anfrage) ---------- */
  await produkt(t, 'kokos-gestaltet'); await t.pause(1000);
  log('kokos-gestaltet', { ...(await lese(t)), konsole: t.konsole.slice() });
} catch (e) {
  log('ABBRUCH', { fehler: String(e.stack || e), konsole: t.konsole.slice() });
} finally {
  try { await leeren(t); } catch (e) { /* */ }
  await t.schliessen();
}
fs.writeFileSync('ui-produkt.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
