#!/usr/bin/env node
/* pruefe-stichprobe.mjs — vergleicht Produkte aus daten-alle.js mit dem Altsystem.
   Aufruf: node pruefe-stichprobe.mjs [daten-alle.js] [anzahl=10]
   Liest die Seite jedes Artikels DIREKT vom Altsystem (MATTEN_UPSTREAM, Vorgabe
   http://localhost:8080, nur GET) und prueft Name, Preis, Bild, Attribute und
   Warengruppe gegen das, was in der Datei steht. Die Auswahl ist gleichmaessig
   ueber die Produktliste verteilt, also bei jedem Lauf dieselbe. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const hier = path.dirname(fileURLToPath(import.meta.url));
const datei = process.argv[2] || path.join(hier, '..', '..', 'bridge-demo', 'public', 'net-neu', 'assets', 'js', 'daten-alle.js');
const anzahl = Number(process.argv[3]) || 10;
const UP = process.env.MATTEN_UPSTREAM || 'http://localhost:8080';

const window = {};
new Function('window', fs.readFileSync(datei, 'utf8'))(window);
const NET = window.NET;
const neu = Object.values(NET.produkte).filter((p) => p.quelle === 'altsystem');
const wahl = Array.from({ length: anzahl }, (_, i) => neu[Math.floor((i + 0.5) * neu.length / anzahl)]);

const entit = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü').replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö').replace(/&Uuml;/g, 'Ü').replace(/&szlig;/g, 'ß').replace(/&euro;/g, '€');
const norm = (s) => entit(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

let fehler = 0;
for (const p of wahl) {
  const z = NET.zuordnung[p.slug];
  const r = await fetch(UP + z.dePfad, { redirect: 'manual' });
  const html = await r.text();
  const text = norm(html);
  const roh = entit(html).toLowerCase();   /* mit Tags: Farbwerte stehen in value="…" */
  const urlText = html + ' ' + (() => { try { return decodeURI(html); } catch (e) { return html.replace(/%20/g, ' '); } })();
  const pruefungen = [];
  /* Name: bei Varianten steht er im Altsystem nicht, dann zaehlt der Hauptartikel */
  pruefungen.push(['Name', p.nameQuelle === 'artikel' ? text.includes(norm(p.name)) : null, p.name + ' (' + p.nameQuelle + ')']);
  /* Preis: der Vorauswahl-Preis steht als "29,95" im Text */
  if (p.preisAltsystem) pruefungen.push(['Preis', text.includes(p.preisAltsystem.text.replace(/\s*€/, '').toLowerCase()), p.preisAltsystem.text]);
  else pruefungen.push(['Preis', p.modus === 'anfrage' ? true : false, 'kein Preis, modus ' + p.modus]);
  /* Bild: Dateiname des ersten eigenen Bildes (bei geerbtem Bild nicht pruefbar) */
  const sicher = (x) => { try { return decodeURIComponent(x); } catch (e) { return x; } };
  const bild = p.bilder[0] ? sicher(p.bilder[0].split('/').pop()) : null;
  pruefungen.push(['Bild', p.bildVon === 'hauptartikel' ? null : (bild ? urlText.includes(bild) : p.bilder.length === 0), bild || 'keins']);
  /* Attribute: jeder Optionswert des Formulars steht in der Seite */
  const fehlend = [];
  for (const a of p.deAttribute) for (const o of a.optionen.slice(0, 40)) if (o && !text.includes(norm(o)) && !roh.includes(o.toLowerCase())) fehlend.push(a.name + '=' + o);
  pruefungen.push(['Attribute', fehlend.length === 0, p.deAttribute.length + ' Felder' + (fehlend.length ? ', fehlt: ' + fehlend.slice(0, 3).join('; ') : '')]);
  /* Warengruppe: ihr Name steht in den Brotkrumen der Seite */
  const kat = p.kategorien.map((s) => NET.kategorien[s]).filter(Boolean);
  const katOk = kat.some((k) => text.includes(norm(k.name)));
  pruefungen.push(['Warengruppe', kat.length ? katOk : false, kat.map((k) => k.name).join(' | ')]);
  console.log('\n' + p.slug + '  (' + z.dePfad + ', HTTP ' + r.status + ', ID ' + p.artikelId + ')');
  for (const [was, ok, info] of pruefungen) {
    if (ok === false) fehler++;
    console.log('  ' + (ok === null ? '-- ' : ok ? 'ok ' : 'XX ') + was.padEnd(12) + info);
  }
}
console.log('\n' + (fehler ? fehler + ' Abweichung(en).' : 'Alle ' + anzahl + ' Stichproben stimmen.'));
