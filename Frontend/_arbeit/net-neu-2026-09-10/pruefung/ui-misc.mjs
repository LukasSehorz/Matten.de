/* ui-misc.mjs — Restprüfungen: "Mehr Farben Anzeigen", Blog, Kasse leer, Screenshots des Prüflings (1280) und 375 px */
import { neuesZiel } from './cdp.mjs';
import fs from 'node:fs';

const B = 'http://localhost:8787/net-neu/';
const out = [];
const log = (name, daten) => { out.push({ schritt: name, ...daten }); console.error('·', name); };

const t = await neuesZiel('about:blank');
try {
  await t.viewport(1280, 2400);
  await t.navigiere(B + 'index.html');
  await t.api('/api/cart/clear', {});

  /* Mehr Farben Anzeigen */
  await t.navigiere(B + 'produkt.html?slug=jetprint-premium');
  await t.warteBis('!!document.querySelector("#price") && !document.querySelector("#price .spinner-border")', 20000);
  await t.pause(500);
  const vor = await t.eval('[...document.querySelectorAll("#color-collapse-1 span.color-input")].filter(s=>getComputedStyle(s).display!=="none").length');
  await t.klick('#color-collapse-1 .color-collapse-button'); await t.pause(300);
  const nach = await t.eval('({ sichtbar: [...document.querySelectorAll("#color-collapse-1 span.color-input")].filter(s=>getComputedStyle(s).display!=="none").length, knopfText: [...document.querySelectorAll("#color-collapse-1 .color-collapse-button span")].filter(s=>getComputedStyle(s).display!=="none").map(s=>s.textContent).join("|"), klasse: document.querySelector("#color-collapse-1").className })');
  await t.klick('#color-collapse-1 .color-collapse-button'); await t.pause(300);
  const wieder = await t.eval('[...document.querySelectorAll("#color-collapse-1 span.color-input")].filter(s=>getComputedStyle(s).display!=="none").length');
  log('Mehr Farben', { vor, nach, wieder });
  /* Reiter Bewertungen */
  await t.klick('#reviews-tab'); await t.pause(400);
  log('Reiter', await t.eval('({ aktiv: document.querySelector(".nav-tabs a.active").textContent.trim(), reviewsSichtbar: document.querySelector("#reviews").classList.contains("active"), reviewsLeer: document.querySelector("#reviews").textContent.trim()==="" })'));
  /* Screenshot Produktseite 1280 */
  await t.klick('#description-tab'); await t.pause(300);
  await t.screenshot('neu-jetprint.png', true);
  /* 375 px */
  await t.viewport(375, 1400); await t.pause(600);
  const m375 = await t.eval('({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, mobilNav: getComputedStyle(document.querySelector("nav.d-lg-none")).display, desktopNav: getComputedStyle(document.querySelector("nav.main-navbar")).display })');
  await t.screenshot('neu-jetprint-375.png', true);
  log('375 Produktseite', m375);
  await t.viewport(1280, 2400);

  /* Kategorie ironhorse Screenshot */
  await t.navigiere(B + 'kategorie.html?slug=ironhorse'); await t.pause(1500);
  await t.screenshot('neu-ironhorse.png', true);
  /* Startseite 375 */
  await t.navigiere(B + 'index.html'); await t.pause(1500);
  await t.viewport(375, 1400); await t.pause(600);
  await t.screenshot('neu-start-375.png', true);
  log('375 Start', await t.eval('({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })'));
  await t.viewport(1280, 2400);

  /* Blog */
  await t.navigiere(B + 'blog.html'); await t.pause(800);
  log('Blog', await t.eval('({ artikel: [...document.querySelectorAll("#blog article")].map(a=>a.querySelector("h2").textContent.trim()+" | "+a.querySelector("small").textContent.trim()+" | "+(a.querySelector("a")?a.querySelector("a").textContent.trim()+" -> "+a.querySelector("a").getAttribute("href"):"-")) })'));
  await t.navigiere(B + 'blog.html#der-mattenfuchs'); await t.pause(800);
  log('Blog einzeln', await t.eval('({ n: document.querySelectorAll("#blog article").length, titel: document.querySelector("#blog h2")?.textContent.trim() })'));
  /* Gästebuch, Infoseiten */
  await t.navigiere(B + 'guest-book.html'); await t.pause(600);
  log('Gästebuch', await t.eval('({ text: document.querySelector("#gaestebuch-hinweis")?.textContent.trim() })'));
  for (const s of ['agb', 'impressum', 'data-protection', 'datenschutzerklarung-dsgvo', 'gibtsnicht']) {
    await t.navigiere(B + 'pages.html?s=' + s); await t.pause(600);
    log('Seite ' + s, await t.eval('({ titel: document.querySelector("#seite-titel")?.textContent.trim(), laenge: document.querySelector("#seite-inhalt")?.innerHTML.length, hinweis: document.querySelector("#rechtstext-hinweis")?.hidden===false ? document.querySelector("#rechtstext-hinweis").textContent.trim() : "(versteckt)", docTitle: document.title })'));
  }
  /* Kasse leer */
  await t.navigiere(B + 'checkout.html');
  await t.warteBis('/leer/i.test(document.querySelector("#kasse-meldung").innerText) || !!document.querySelector("#kasse-adresse .form-group")', 40000);
  log('Kasse leer', await t.eval('({ meldung: document.querySelector("#kasse-meldung").innerText.trim(), link: document.querySelector("#kasse-meldung a")?.getAttribute("href"), schritte: !document.querySelector("#kasse-schritte-bereich").hidden, korb: document.querySelector("#kasse-korb-zeilen").innerText.trim() })'));
  /* Kategorie unbekannt / Produkt unbekannt */
  await t.navigiere(B + 'kategorie.html?slug=gibtsnicht'); await t.pause(600);
  log('Kategorie unbekannt', await t.eval('({ h1: document.querySelector("h1.display-5")?.textContent.trim(), p: document.querySelector("#kategorie-beschreibung")?.textContent.trim() })'));
  await t.navigiere(B + 'produkt.html?slug=gibtsnicht'); await t.pause(800);
  log('Produkt unbekannt', await t.eval('({ h2: document.querySelector("#produkt-name")?.textContent.trim(), m: document.querySelector("#produkt-meldung")?.textContent.trim() })'));
  /* Newsletter */
  await t.navigiere(B + 'index.html'); await t.pause(800);
  await t.setze('#subscribe-email', 'x@example.com'); await t.klick('.subscribe-widget-button'); await t.pause(300);
  log('Newsletter', await t.eval('({ hinweis: document.querySelector("#subscribe-hinweis")?.textContent.trim(), url: location.href })'));
  /* Cookie-Hinweis */
  const cookieVor = await t.eval('!!document.querySelector("#cookieconsent") && !document.querySelector("#cookieconsent").hidden');
  await t.klick('#cookieconsent-ok'); await t.pause(200);
  await t.navigiere(B + 'index.html'); await t.pause(800);
  log('Cookie', { vor: cookieVor, nachKlickUndNeuladen: await t.eval('!!document.querySelector("#cookieconsent")') });
  log('Ende', { konsole: t.konsole.slice(), netz: t.netz.filter((n) => !(n.status >= 200 && n.status < 300) && n.status !== 304).map((n) => n.status + ' ' + n.url) });
} catch (e) {
  log('ABBRUCH', { fehler: String(e.stack || e) });
} finally {
  await t.schliessen();
}
fs.writeFileSync('ui-misc.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
