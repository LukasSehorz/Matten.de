/* seiten-konsole.mjs — B6/B14: alle Seiten im Headless Chrome (CDP): Konsolenfehler, Netzfehler (nicht 2xx/304),
   waagerechter Ueberlauf bei 1280 (alle) und 375/768 (Auswahl). Ausgabe JSON nach stdout. */
import { neuesZiel } from './cdp.mjs';
import fs from 'node:fs';

const B = 'http://localhost:8787/net-neu/';
const st = JSON.parse(fs.readFileSync('/Users/lukas.sehorz/Library/CloudStorage/OneDrive-Persönlich/Desktop/Webseiten/Sale/Matten de/Frontend/bridge-demo/spec/struktur.json', 'utf8'));
const kats = (Array.isArray(st.kategorien) ? st.kategorien : Object.values(st.kategorien)).map((k) => k.slug);
const prods = (Array.isArray(st.produkte) ? st.produkte : Object.values(st.produkte)).map((p) => p.slug);

const seiten = [
  'index.html', 'products.html', 'products.html?page=2', 'products.html?keyword=Kokos', 'checkout.html', 'login.html', 'register.html',
  'blog.html', 'guest-book.html', 'pages.html?s=agb', 'pages.html?s=impressum', 'pages.html?s=data-protection', 'pages.html?s=datenschutzerklarung-dsgvo',
  ...kats.map((s) => 'kategorie.html?slug=' + s),
  ...prods.map((s) => 'produkt.html?slug=' + s),
];
const responsiv = ['index.html', 'products.html', 'kategorie.html?slug=ironhorse', 'produkt.html?slug=jetprint-premium',
  'produkt.html?slug=aluminium-profilmatte-typ-diplomat-r', 'checkout.html', 'login.html', 'register.html', 'blog.html', 'pages.html?s=agb'];

const nur = process.argv[2];   // optional: nur diese Seite
const ergebnis = [];
for (const s of (nur ? [nur] : seiten)) {
  const t = await neuesZiel('about:blank');
  try {
    await t.viewport(1280, 2400);
    await t.navigiere(B + s);
    if (s.startsWith('produkt.html')) {
      await t.warteBis('!!document.querySelector("#price") && !document.querySelector("#price .spinner-border")', 15000).catch(() => null);
    } else if (s.startsWith('checkout.html')) {
      await t.warteBis('!!document.querySelector("#kasse-meldung .alert")', 15000).catch(() => null);
    } else {
      await t.pause(1500);
    }
    await t.pause(600);
    const mass = await t.eval('({sw: document.documentElement.scrollWidth, iw: window.innerWidth, titel: document.title, h1: (document.querySelector("h1,h2")||{}).textContent})');
    const r = { seite: s, titel: mass.titel, ueberlauf1280: mass.sw > mass.iw ? mass.sw + '>' + mass.iw : null, konsole: t.konsole.slice(), netz: t.netz.filter((n) => !(n.status >= 200 && n.status < 300) && n.status !== 304).map((n) => n.status + ' ' + n.url) };
    if (responsiv.includes(s)) {
      for (const w of [768, 375]) {
        await t.viewport(w, 1400);
        await t.pause(500);
        const m = await t.eval('({sw: document.documentElement.scrollWidth, iw: window.innerWidth})');
        r['ueberlauf' + w] = m.sw > m.iw ? m.sw + '>' + m.iw : null;
      }
    }
    ergebnis.push(r);
  } catch (e) {
    ergebnis.push({ seite: s, fehler: String(e.message || e), konsole: t.konsole.slice() });
  } finally {
    await t.schliessen();
  }
}
console.log(JSON.stringify(ergebnis, null, 1));
