/* ui-kasse.mjs — D20–D23 über checkout.html (CDP). NIE #bestell-knopf klicken. Korb am Ende leeren. */
import { neuesZiel } from './cdp.mjs';
import fs from 'node:fs';

const B = 'http://localhost:8787/net-neu/';
const out = [];
const log = (name, daten) => { out.push({ schritt: name, ...daten }); console.error('·', name); };
const ADRESSE = { anrede: 'Herr', strasse: 'Teststraße 1', plz: '80331', ort: 'München', telefon: '089 123456', email: 'test-anfrage@example.com' };

async function kasseOeffnen(t) {
  await t.navigiere(B + 'checkout.html');
  /* fertig geladen: Adressformular gebaut ODER Hinweis "leer"/Fehler */
  await t.warteBis('!!document.querySelector("#kasse-adresse .form-group") || /leer|nicht geantwortet|Port 8787/i.test(document.querySelector("#kasse-meldung").innerText)', 40000);
  await t.pause(600);
  return t.eval(`(function(){ const q=(s)=>document.querySelector(s); return { titel: q('#kasse-titel').textContent.trim(), meldung: q('#kasse-meldung').innerText.trim(), meldungKlasse: q('#kasse-meldung .alert')?.className, schritteSichtbar: !q('#kasse-schritte-bereich').hidden,
    korbZeilen: [...document.querySelectorAll('#kasse-korb-zeilen tr')].map(tr=>tr.innerText.replace(/\\s+/g,' ').trim()), summen: [...document.querySelectorAll('#kasse-korb-summen tr')].map(tr=>tr.innerText.replace(/\\s+/g,' ').trim()),
    felder: [...document.querySelectorAll('#kasse-adresse [name]')].map(e=>e.name+'='+JSON.stringify(e.value)+(e.closest('.form-group').querySelector('label').classList.contains('required')?'*':'')), agbLabel: q('label[for=f-agb]')?.textContent.trim(), kontoStatus: q('#konto-status')?.textContent.trim(), testHinweis: q('#test-hinweis')?.textContent.replace(/\\s+/g,' ').trim() }; })()`);
}
async function adresseAusfuellen(t, felder) {
  const fehlt = [];
  for (const [k, v] of Object.entries(felder)) { const r = await t.setze('#f-' + k, v); if (r !== 'ok') fehlt.push(r); }
  if (fehlt.length) throw new Error('Adressfelder fehlen: ' + fehlt.join(', '));
}
async function schritt1Absenden(t) {
  await t.klick('#adress-knopf');
  await t.warteBis('!document.querySelector("#schritt-2").hidden || !!document.querySelector("#adress-melder .alert-danger") || !!document.querySelector("#adress-melder .alert-warning")', 40000);
  await t.pause(400);
  return t.eval(`(function(){ const q=(s)=>document.querySelector(s); return { schritt2: !q('#schritt-2').hidden, melder: q('#adress-melder').innerText.trim(), fehlerFelder: [...document.querySelectorAll('#kasse-adresse .is-invalid')].map(e=>e.name+' :: '+document.getElementById('e-'+e.name).textContent), fokus: document.activeElement && document.activeElement.name }; })()`);
}
async function schritt2Lesen(t) {
  return t.eval(`(function(){ const q=(s)=>document.querySelector(s); return { land: q('#f-lieferland').value, landN: q('#f-lieferland').options.length, versand: [...document.querySelectorAll('#versand-auswahl input')].map(i=>i.value+'='+document.querySelector('label[for='+i.id+']').textContent.trim()+(i.checked?'*':'')), versandText: q('#versand-auswahl').innerText.trim().slice(0,120), zahlung: [...document.querySelectorAll('#zahlung-auswahl input')].map(i=>i.value+'='+document.querySelector('label[for='+i.id+']').textContent.trim()+(i.checked?'*':'')), zahlungText: q('#zahlung-auswahl').innerText.trim(), gesperrt: q('#gesperrt-block').hidden? null : q('#gesperrt-liste').textContent.trim(), fortschritt: [...document.querySelectorAll('#fortschritt li')].map(li=>li.textContent.trim()+(li.getAttribute('aria-current')?'*':'')+(li.hasAttribute('data-erledigt')?'✓':'')) }; })()`);
}
async function schritt2Absenden(t) {
  const s2 = await t.eval('!document.querySelector("#schritt-2").hidden');
  if (!s2) throw new Error('Schritt 2 ist nicht sichtbar — Adresse wurde nicht angenommen');
  await t.klick('#optionen-knopf');
  await t.warteBis('!document.querySelector("#schritt-3").hidden', 60000);
  await t.warteBis('!document.querySelector("#pruef-blocks").hasAttribute("aria-busy")', 40000).catch(() => null);
  await t.pause(600);
  return t.eval(`(function(){ const q=(s)=>document.querySelector(s); const k=q('#bestell-knopf'); return { optionenMelder: q('#optionen-melder').innerText.trim(), titel: q('#pruef-titel').textContent.trim(), bloecke: [...document.querySelectorAll('#pruef-blocks .card')].map(c=>c.innerText.replace(/\\s+/g,' ').trim().slice(0,300)), warnung: q('#pruef-blocks .alert')?.innerText.trim(), melder: q('#pruef-melder').innerText.trim(), knopfText: k.textContent.trim(), knopfKlasse: k.className, knopfDisabled: k.disabled, schalterDisabled: q('#scharf-schalter').disabled, scharfText: q('#scharf-text').textContent.trim(), roh: q('#roh-inhalt').textContent.slice(0,700) }; })()`);
}
async function schalterPruefen(t) {
  await t.haken('#scharf-schalter', true); await t.pause(100);
  const an = await t.eval('document.querySelector("#bestell-knopf").disabled');
  await t.haken('#scharf-schalter', false); await t.pause(100);
  const aus = await t.eval('document.querySelector("#bestell-knopf").disabled');
  return { knopfDisabledMitHaken: an, knopfDisabledOhneHaken: aus };
}
async function api(t, url, daten) { return (await t.api(url, daten)); }

const t = await neuesZiel('about:blank');
await t.viewport(1280, 2400);
try {
  await t.navigiere(B + 'index.html');   /* relative /api-Aufrufe brauchen eine Seite der Auslieferung */
  /* ---------- Leerer Korb ---------- */
  await api(t, '/api/cart/clear', {});
  log('K0 leerer Korb', await kasseOeffnen(t));

  /* ---------- D20 reiner Anfragenkorb (569, 90x120) ---------- */
  const add1 = await api(t, '/api/cart/add', { pfad: '/logomatten/6300201-logomatte-a', anzahl: 1, werte: { 'spezialoption[569][spezial][x]': '90', 'spezialoption[569][spezial][y]': '120' }, kommentar: 'TEST Kontrollagent - bitte ignorieren (Prüfung Anfragenkorb)' });
  log('D20 add', { http: add1.http, ok: add1.d.ok, count: add1.d.count, modus: add1.d.modus, abgelehnt: add1.d.abgelehnt, items: (add1.d.items || []).map((i) => i.attribut + ' | ' + i.preis) });
  const k20 = await kasseOeffnen(t);
  log('D20 Kasse offen', k20);
  /* D23 Fehlerpfad: ohne PLZ */
  await adresseAusfuellen(t, { ...ADRESSE, plz: '' });
  await t.haken('#f-agb', true);
  log('D23 Adresse ohne PLZ', await schritt1Absenden(t));
  /* AGB-Kästchen leer -> lokale Meldung */
  await t.haken('#f-agb', false);
  await t.setze('#f-plz', ADRESSE.plz);
  log('D23b ohne AGB', await schritt1Absenden(t));
  await t.haken('#f-agb', true);
  log('D20 Adresse gültig', await schritt1Absenden(t));
  log('D20 Schritt 2', await schritt2Lesen(t));
  log('D20 Schritt 3', await schritt2Absenden(t));
  log('D20 Schalter', await schalterPruefen(t));
  const v20 = await api(t, '/api/kasse/vorschau');
  log('D20 /api/kasse/vorschau', { http: v20.http, art: v20.d.art, bereit: v20.d.bereit, huerden: v20.d.huerden, modus: v20.d.warenkorb && v20.d.warenkorb.modus, korb: v20.d.uebersicht && v20.d.uebersicht.korb, knopf: v20.d.uebersicht && v20.d.uebersicht.absendeknopfText, knopfName: v20.d.uebersicht && v20.d.uebersicht.absendeknopfName, items: v20.d.uebersicht && v20.d.uebersicht.items, felder: v20.d.finalRequest && v20.d.finalRequest.felder, zahlung: v20.d.optionen && v20.d.optionen.zahlungsart, versandGewaehlt: v20.d.optionen && v20.d.optionen.versandart && v20.d.optionen.versandart.gewaehlt });
  /* Zurück-Knöpfe */
  await t.klick('#pruef-zurueck'); await t.pause(200);
  log('D20 zurück', { schritt2: await t.eval('!document.querySelector("#schritt-2").hidden') });
  await api(t, '/api/cart/clear', {});

  /* ---------- D21 Kaufkorb (6302008) ---------- */
  const add2 = await api(t, '/api/cart/add', { pfad: '/logomatten/matten_fuer_haus_und_heim/6302008', anzahl: 1, werte: {}, kommentar: 'TEST Kontrollagent - bitte ignorieren (Prüfung Kaufkorb)' });
  log('D21 add', { http: add2.http, ok: add2.d.ok, count: add2.d.count, modus: add2.d.modus, abgelehnt: add2.d.abgelehnt, items: (add2.d.items || []).map((i) => i.name + ' | ' + i.attribut + ' | ' + i.preis) });
  log('D21 Kasse offen', await kasseOeffnen(t));
  await adresseAusfuellen(t, ADRESSE); await t.haken('#f-agb', true);
  log('D21 Adresse', await schritt1Absenden(t));
  const s2 = await schritt2Lesen(t);
  log('D21 Schritt 2', s2);
  /* Rechnung wählen */
  await t.eval('(function(){ const r=document.querySelector("#zahlung-auswahl input[value=RechnungPayment]"); if(r){ r.checked=true; r.dispatchEvent(new Event("change",{bubbles:true})); } })()');
  log('D21 Schritt 3', await schritt2Absenden(t));
  log('D21 Schalter', await schalterPruefen(t));
  const v21 = await api(t, '/api/kasse/vorschau');
  log('D21 /api/kasse/vorschau', { http: v21.http, art: v21.d.art, bereit: v21.d.bereit, huerden: v21.d.huerden, modus: v21.d.warenkorb && v21.d.warenkorb.modus, korb: v21.d.uebersicht && v21.d.uebersicht.korb, knopf: v21.d.uebersicht && v21.d.uebersicht.absendeknopfText, knopfName: v21.d.uebersicht && v21.d.uebersicht.absendeknopfName, zahlungsartText: v21.d.uebersicht && v21.d.uebersicht.zahlungsartText, gesamt: v21.d.uebersicht && v21.d.uebersicht.gesamt, felder: v21.d.finalRequest && v21.d.finalRequest.felder });
  await api(t, '/api/cart/clear', {});

  /* ---------- D22 gemischter Korb ---------- */
  await api(t, '/api/cart/add', { pfad: '/logomatten/matten_fuer_haus_und_heim/6302008', anzahl: 1, werte: {}, kommentar: 'TEST Kontrollagent - bitte ignorieren (gemischt, Kauf)' });
  const add3 = await api(t, '/api/cart/add', { pfad: '/logomatten/6300201-logomatte-a', anzahl: 1, werte: { 'spezialoption[569][spezial][x]': '90', 'spezialoption[569][spezial][y]': '120' }, kommentar: 'TEST Kontrollagent - bitte ignorieren (gemischt, Anfrage)' });
  log('D22 add', { count: add3.d.count, modus: add3.d.modus, gesamt: add3.d.gesamt });
  log('D22 Kasse offen', await kasseOeffnen(t));
  await adresseAusfuellen(t, ADRESSE); await t.haken('#f-agb', true);
  log('D22 Adresse', await schritt1Absenden(t));
  log('D22 Schritt 2', await schritt2Lesen(t));
  log('D22 Schritt 3', await schritt2Absenden(t));
  const v22 = await api(t, '/api/kasse/vorschau');
  log('D22 /api/kasse/vorschau', { art: v22.d.art, bereit: v22.d.bereit, huerden: v22.d.huerden, modus: v22.d.warenkorb && v22.d.warenkorb.modus, korb: v22.d.uebersicht && v22.d.uebersicht.korb, knopf: v22.d.uebersicht && v22.d.uebersicht.absendeknopfText, items: v22.d.uebersicht && v22.d.uebersicht.items, gesamt: v22.d.uebersicht && v22.d.uebersicht.gesamt, cartGesamt: v22.d.warenkorb && v22.d.warenkorb.gesamt });
  await api(t, '/api/cart/clear', {});
  log('Ende', { korb: (await api(t, '/api/cart')).d.count, konsole: t.konsole.slice(), netz: t.netz.filter((n) => !(n.status >= 200 && n.status < 300) && n.status !== 304).map((n) => n.status + ' ' + n.url) });
} catch (e) {
  log('ABBRUCH', { fehler: String(e.stack || e), konsole: t.konsole.slice() });
} finally {
  try { await api(t, '/api/cart/clear', {}); } catch (e) { /* */ }
  await t.schliessen();
}
fs.writeFileSync('ui-kasse.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
