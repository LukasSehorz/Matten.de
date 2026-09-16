/* ui-modal-konto.mjs — D24 (Modal: Menge, Entfernen, Zähler, Leeren) und D25 (Login falsch, Registrierung) */
import { neuesZiel } from './cdp.mjs';
import fs from 'node:fs';

const B = 'http://localhost:8787/net-neu/';
const out = [];
const log = (name, daten) => { out.push({ schritt: name, ...daten }); console.error('·', name); };

const t = await neuesZiel('about:blank');
await t.viewport(1280, 2400);
try {
  await t.navigiere(B + 'index.html');   /* relative /api-Aufrufe brauchen eine Seite der Auslieferung */
  await t.api('/api/cart/clear', {});
  await t.api('/api/cart/add', { pfad: '/logomatten/matten_fuer_haus_und_heim/6302008', anzahl: 1, werte: {}, kommentar: 'TEST Kontrollagent - bitte ignorieren (Modal)' });
  await t.navigiere(B + 'index.html');
  await t.warteBis('document.querySelector("#cart-count") && document.querySelector("#cart-count").textContent.length>0', 15000);
  const zaehler1 = await t.text('button[data-target="#cart-modal"]');
  await t.klick('button[data-target="#cart-modal"]');
  await t.warteBis('document.querySelector("#cart-modal").classList.contains("show") && !!document.querySelector("#cart-zeilen tr[data-key]")', 20000);
  await t.pause(500);
  const modal1 = await t.eval(`(function(){ return { zeilen: [...document.querySelectorAll('#cart-zeilen tr')].map(tr=>({ text: tr.innerText.replace(/\\s+/g,' ').trim(), bild: !!tr.querySelector('img'), menge: tr.querySelector('.cart-menge')?.value, link: tr.querySelector('a')?.getAttribute('href') })), summen: [...document.querySelectorAll('#cart-summen tr')].map(tr=>tr.innerText.replace(/\\s+/g,' ').trim()), laden: document.querySelector('.cart-loading').className }; })()`);
  log('D24 Modal mit 1 Position', { zaehlerVorher: zaehler1, modal: modal1 });
  /* Menge 2 */
  await t.setze('#cart-zeilen tr[data-key] .cart-menge', '2');
  await t.pause(400);
  await t.warteBis('document.querySelector(".cart-loading").classList.contains("d-none") && document.querySelector("#cart-zeilen tr[data-key] .cart-menge").value==="2"', 30000);
  await t.pause(800);
  const nachMenge = await t.eval(`(function(){ return { zeilen: [...document.querySelectorAll('#cart-zeilen tr')].map(tr=>tr.innerText.replace(/\\s+/g,' ').trim()), summen: [...document.querySelectorAll('#cart-summen tr')].map(tr=>tr.innerText.replace(/\\s+/g,' ').trim()), zaehler: document.querySelector('button[data-target="#cart-modal"]').textContent.replace(/\\s+/g,' ').trim() }; })()`);
  const k2 = (await t.api('/api/cart')).d;
  log('D24 Menge 2', { ui: nachMenge, api: { count: k2.count, anzahl: (k2.items || []).map((i) => i.anzahl), gesamt: k2.gesamt } });
  /* Entfernen */
  await t.klick('#cart-zeilen tr[data-key] .cart-entfernen');
  await t.warteBis('!document.querySelector("#cart-zeilen tr[data-key]")', 30000);
  await t.pause(600);
  const nachEntfernen = await t.eval(`(function(){ return { zeilen: [...document.querySelectorAll('#cart-zeilen tr')].map(tr=>tr.innerText.replace(/\\s+/g,' ').trim()), summen: [...document.querySelectorAll('#cart-summen tr')].map(tr=>tr.innerText.replace(/\\s+/g,' ').trim()), zaehler: document.querySelector('button[data-target="#cart-modal"]').textContent.replace(/\\s+/g,' ').trim() }; })()`);
  const k3 = (await t.api('/api/cart')).d;
  log('D24 Entfernen', { ui: nachEntfernen, api: { count: k3.count, items: (k3.items || []).length } });
  /* Leeren über API (die UI hat keinen Leeren-Knopf; Original auch nicht) */
  await t.api('/api/cart/add', { pfad: '/logomatten/matten_fuer_haus_und_heim/6302008', anzahl: 1, werte: {}, kommentar: 'TEST' });
  const leer = (await t.api('/api/cart/clear', {})).d;
  log('D24 Leeren (API)', { count: leer.count, items: (leer.items || []).length });

  /* ---------- D25 Login falsch ---------- */
  await t.navigiere(B + 'login.html'); await t.pause(800);
  await t.setze('#form-full-name', 'kontrollagent-unbekannt@example.com');
  await t.setze('#form-password', 'falsches-passwort-123');
  await t.klick('#login-knopf');
  await t.warteBis('!!document.querySelector("#login-melder .alert")', 30000); await t.pause(300);
  const login = await t.eval(`({ meldung: document.querySelector('#login-melder').innerText.trim(), klasse: document.querySelector('#login-melder .alert').className, knopf: document.querySelector('#login-knopf').textContent.trim(), status: document.querySelector('#login-status').innerText.trim() })`);
  const konto = (await t.api('/api/konto')).d;
  log('D25 Login falsch', { ui: login, api: { eingeloggt: konto.eingeloggt } });
  /* Passwort-Reset-Link */
  await t.klick('#passwort-reset'); await t.pause(200);
  log('D25 Reset-Link', { meldung: await t.text('#login-melder') });

  /* ---------- D25 Registrierung ---------- */
  await t.navigiere(B + 'register.html'); await t.pause(800);
  const regForm = await t.eval(`({ laender: document.querySelector('#user_registration_customer_country').options.length, gewaehlt: document.querySelector('#user_registration_customer_country').value, pflicht: [...document.querySelectorAll('#register-form label.required')].map(l=>l.textContent.trim()), h1: document.querySelectorAll('h1').length, knopf: document.querySelector('#register-knopf').textContent.trim() })`);
  const felder = { email: 'kontrollagent-test@example.com', plainPassword: 'Test12345!', customer_title: 'Herr', customer_firstName: 'TEST', customer_lastName: 'Sehorz (Bitte ignorieren)', customer_streetAddress: 'Teststraße 1', customer_city: 'München', customer_state: 'Bayern', customer_postalCode: '80331', customer_phone: '089 123', customer_mobile: '0171 123' };
  for (const [k, v] of Object.entries(felder)) await t.setze('#user_registration_' + k, v);
  await t.klick('#register-knopf');
  await t.warteBis('!!document.querySelector("#register-melder .alert")', 40000); await t.pause(300);
  const reg = await t.eval(`({ meldung: document.querySelector('#register-melder').innerText.trim().slice(0,600), klasse: document.querySelector('#register-melder .alert').className })`);
  log('D25 Registrierung', { form: regForm, ui: reg });
  log('Ende', { konsole: t.konsole.slice(), netz: t.netz.filter((n) => !(n.status >= 200 && n.status < 300) && n.status !== 304).map((n) => n.status + ' ' + n.url) });
} catch (e) {
  log('ABBRUCH', { fehler: String(e.stack || e), konsole: t.konsole.slice() });
} finally {
  try { await t.api('/api/cart/clear', {}); } catch (e) { /* */ }
  await t.schliessen();
}
fs.writeFileSync('ui-modal-konto.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
