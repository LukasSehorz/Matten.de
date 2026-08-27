/**
 * BUILD-KATALOG  --  den Live-Katalog EINMAL erzeugen statt bei jedem Aufruf
 * =========================================================================
 *
 * Warum es dieses Skript gibt
 * ---------------------------
 * Der lokale Server baut window.CATALOG bei Bedarf aus matten.de zusammen.
 * Das kostet rund 390 Anfragen und gemessene ~190 Sekunden. Eine Netlify
 * Function darf 10 Sekunden laufen. Zur Laufzeit ist das also ausgeschlossen.
 *
 * Deshalb passiert es hier: einmal beim Build. Heraus kommen zwei Dateien.
 *
 *   1. <publish>/shop/assets/js/catalog.js
 *      Exakt dieselbe Datei, die der lokale Server unter derselben Adresse
 *      ausliefert -- erzeugt von derselben Funktion (shopKatalogJs) aus
 *      demselben Kern. Die 19 HTML-Seiten merken keinen Unterschied.
 *
 *   2. netlify/functions/katalog-daten.mjs
 *      Was /api/katalog, /api/kategorie, /api/produkt und /api/suche brauchen.
 *      Der Browser sieht diese Datei nie; sie wird in die Function gebuendelt.
 *
 * Aufrufe
 * -------
 *   node bridge-demo/build-katalog.mjs                voller Build
 *   node bridge-demo/build-katalog.mjs --nur-katalog  nur die Daten erneuern,
 *                                                     Dateien nicht neu kopieren
 *   node bridge-demo/build-katalog.mjs --ziel <pfad>  anderes Publish-Verzeichnis
 *
 * Fail-closed
 * -----------
 * Scheitert der Aufbau oder kommt er verdaechtig duenn zurueck, bricht das
 * Skript mit Exit-Code 1 ab und schreibt NICHTS. Ein Deployment mit einem
 * leeren Katalog waere schlimmer als ein fehlgeschlagenes Deployment: die
 * Seite saehe funktionsfaehig aus und haette kein einziges Produkt.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  shopKatalogStufe1, shopKatalogStufe2, shopKatalogJs, standLesbar,
  katalogMitCache, holeKategorie, holeArtikel, holeSuche,
  kaufformularAntwort, pfadSchluessel, parallel,
} from './lib/bruecke.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '..');

/* --- Wohin -------------------------------------------------------------- */

const argumente = process.argv.slice(2);
const nurKatalog = argumente.includes('--nur-katalog');
const zielIdx = argumente.indexOf('--ziel');

/** Das Publish-Verzeichnis. Wird beim vollen Build neu aufgebaut. */
const PUBLISH = zielIdx >= 0 && argumente[zielIdx + 1]
  ? path.resolve(process.cwd(), argumente[zielIdx + 1])
  : path.join(FRONTEND, 'dist');

/** Quelle der statischen Dateien: exakt das, was der lokale Server ausliefert. */
const QUELLE = path.join(__dirname, 'public');

/** Die Katalogdatei, die die 19 Shop-Seiten einbinden. */
const KATALOG_JS = path.join(PUBLISH, 'shop', 'assets', 'js', 'catalog.js');

/**
 * Die Daten fuer die Netlify-Function.
 *
 * Bewusst EINE Ebene UEBER netlify/functions/: Netlify macht aus jeder Datei
 * in diesem Verzeichnis einen eigenen Endpunkt. Laege die Datei dort, gaebe
 * es eine oeffentlich erreichbare Function "katalog-daten" -- 3,6 MB Daten
 * ohne Handler. Nachgemessen mit "netlify dev": genau das passierte
 * ("Loaded function katalog-daten").
 *
 * Von hier importiert api.mjs sie ganz normal relativ; der Bundler zieht sie
 * mit hinein. Kein Pfadraten zur Laufzeit in der Lambda.
 */
const FUNKTIONS_DATEN = path.join(FRONTEND, 'netlify', 'katalog-daten.mjs');

/* --- Ausgabe ------------------------------------------------------------ */

const t0 = Date.now();
const sek = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(6) + ' s';
const sage = (text) => console.log(`[${sek()}] ${text}`);
const warne = (text) => console.warn(`[${sek()}] ! ${text}`);

function abbruch(grund, details) {
  console.error('');
  console.error('  ==========================================================');
  console.error('   KATALOG-BUILD ABGEBROCHEN');
  console.error('  ==========================================================');
  console.error('   ' + grund);
  if (details) console.error('   ' + details);
  console.error('');
  console.error('   Es wurde KEINE Katalogdatei geschrieben. Ein Deployment mit');
  console.error('   leerem Katalog saehe funktionsfaehig aus und haette kein');
  console.error('   einziges Produkt -- das ist schlimmer als ein Abbruch.');
  console.error('');
  console.error('   Meist ist matten.de gerade nicht erreichbar. Einfach noch');
  console.error('   einmal versuchen; die Aufbaulogik ist fehlertolerant, aber');
  console.error('   ohne Startseite gibt es nun einmal keinen Kategoriebaum.');
  console.error('');
  process.exit(1);
}

/* --- 1. Statische Dateien ins Publish-Verzeichnis ------------------------ */

async function kopiereStatisch() {
  sage(`Publish-Verzeichnis wird aufgebaut: ${PUBLISH}`);
  await fs.rm(PUBLISH, { recursive: true, force: true });
  await fs.cp(QUELLE, PUBLISH, { recursive: true });

  // Gegenprobe: die Seiten, ohne die die Auslieferung sinnlos waere.
  const pflicht = [
    'shop/index.html', 'shop/kategorie.html', 'shop/produkt.html',
    'shop/warenkorb.html', 'shop/kasse.html', 'shop/assets/css/app.css',
    'shop/assets/js/site.js', 'index.html', 'kasse.html',
    'rechner.html', 'preisformel.js', 'fonts/fonts.css',
  ];
  const fehlend = [];
  for (const p of pflicht) {
    try {
      await fs.access(path.join(PUBLISH, p));
    } catch {
      fehlend.push(p);
    }
  }
  if (fehlend.length) {
    abbruch('Im Publish-Verzeichnis fehlen Pflichtdateien.', fehlend.join(', '));
  }

  const seiten = (await fs.readdir(path.join(PUBLISH, 'shop')))
    .filter((f) => f.endsWith('.html'));
  sage(`Statische Dateien kopiert: ${seiten.length} Shop-Seiten, dazu Rechner, Kasse und Schriften.`);
}

/* --- 2. Den Katalog aus matten.de aufbauen ------------------------------- */

async function baueDenKatalog() {
  sage('Stufe 1: Kategoriebaum und Produktlisten werden gelesen (rund 25 Anfragen) ...');
  const daten = await shopKatalogStufe1();
  sage(`Stufe 1 fertig: ${daten.categories.length} Kategorien, ${daten.products.length} Produkte.`);

  if (!daten.categories.length) {
    abbruch(
      'Der Kategoriebaum ist leer -- die Startseite von matten.de war nicht lesbar.',
      'Ohne Kategorien gibt es keinen Katalog.'
    );
  }
  if (!daten.products.length) {
    abbruch('Es wurde kein einziges Produkt gefunden.', 'Vermutlich hat sich das Seitenmuster geaendert.');
  }

  sage(`Stufe 2: ${daten.products.length} Artikelseiten werden nachgeladen -- das dauert rund drei Minuten.`);
  await shopKatalogStufe2(daten);

  daten.erzeugung = 'build';
  return daten;
}

/* --- 3. Die Daten fuer die Netlify-Function einsammeln ------------------- */

/**
 * /api/katalog, /api/kategorie, /api/produkt und /api/suche koennen auf
 * Netlify nicht live arbeiten. Sie bekommen darum hier vorgebaute Daten --
 * und zwar GENAU die, die die Live-Endpunkte auch liefern wuerden: es werden
 * dieselben Funktionen aufgerufen (holeKategorie, holeArtikel, holeSuche).
 *
 * Das kostet fast keine zusaetzlichen Anfragen: der Katalogaufbau eben hat
 * alle diese Seiten schon geholt und im Zwischenspeicher des Kerns abgelegt.
 */
async function sammleFunktionsDaten(daten) {
  sage('Daten fuer die Netlify-Function werden zusammengestellt ...');

  /* a) Der Kategoriebaum, wie /api/katalog ihn ausgibt. */
  const katalog = await katalogMitCache({ zaehlen: true });
  const baum = { ...katalog };
  delete baum.upstream;
  delete baum.gecacht;

  /* b) Je Kategorie die Produktliste, wie /api/kategorie sie ausgibt. */
  const kategoriePfade = [];
  for (const k of katalog.kategorien) {
    kategoriePfade.push(k.pfad);
    for (const u of k.unterkategorien || []) kategoriePfade.push(u.pfad);
  }

  const kategorien = {};
  let katFehler = 0;
  for (const pfad of kategoriePfade) {
    const r = await holeKategorie(pfad);
    if (!r.ok) { katFehler += 1; warne(`Kategorie ${pfad}: ${r.grund}`); continue; }
    kategorien[pfadSchluessel(r.pfad)] = {
      pfad: r.pfad,
      titel: r.titel,
      einleitung: r.einleitung,
      produkte: r.produkte,
    };
    // Der angefragte Pfad soll auch dann treffen, wenn das Altsystem
    // umgeleitet hat -- sonst liefe ein Link aus dem Menue ins Leere.
    kategorien[pfadSchluessel(pfad)] = kategorien[pfadSchluessel(r.pfad)];
  }
  sage(`Kategorien abgelegt: ${Object.keys(kategorien).length} Pfade, ${katFehler} nicht lesbar.`);

  /* c) Je Produkt die Antwort von /api/produkt. */
  const produkte = {};
  let prodFehler = 0;
  let getan = 0;
  const pfade = [...new Set(daten.products.map((p) => p.pfad))];

  await parallel(pfade, 4, async (pfad) => {
    const r = await holeArtikel(pfad);
    getan += 1;
    if (getan % 100 === 0) sage(`  ... ${getan}/${pfade.length} Artikeldaten`);
    if (!r || !r.ok) { prodFehler += 1; return; }
    const a = r.artikel;
    produkte[pfadSchluessel(pfad)] = {
      parsen: r.parsen,
      produkt: {
        pfad: a.pfad,
        angefragterPfad: a.angefragterPfad,
        umgezogen: a.umgezogen,
        artikelnummer: a.artikelnummer,
        artikelnummerNumerisch: a.artikelnummerNumerisch,
        artikelId: a.artikelId,
        name: a.name,
        nameQuelle: a.nameQuelle,
        kaufbar: a.kaufbar,
        modus: a.modus,
        brotkrumen: a.brotkrumen,
        kategorie: a.kategorie,
        hauptbild: a.hauptbild,
        bilder: a.bilder,
        kurzbeschreibung: a.kurzbeschreibung,
        // beschreibungAbsaetze wird in der Function aus beschreibung
        // wiederhergestellt (split auf "\n") -- doppelt abgelegt waere es
        // rund ein Drittel mehr Daten fuer denselben Inhalt.
        beschreibung: a.beschreibung,
        preis: a.preis,
        verfuegbarkeit: a.verfuegbarkeit,
        attribute: a.attribute,
        masse: a.masse,
        technischeDaten: a.technischeDaten,
        sprachen: a.sprachen,
      },
      kaufformular: kaufformularAntwort(a),
    };
  });
  sage(`Artikeldaten abgelegt: ${Object.keys(produkte).length} Produkte, ${prodFehler} ohne Detailseite.`);

  /* d) Die Gesamtliste des Altsystems fuer /api/suche. */
  let alleProdukte = [];
  let gemeldeteTreffer = null;
  const suche = await holeSuche('');
  if (suche.ok) {
    alleProdukte = suche.produkte;
    gemeldeteTreffer = suche.gemeldeteTreffer;
    sage(`Suchliste abgelegt: ${alleProdukte.length} Eintraege (Altsystem meldet ${gemeldeteTreffer}).`);
  } else {
    // Kein Abbruchgrund: die Suche kann notfalls auf der Katalogliste
    // arbeiten. Aber es muss auffallen, statt still zu passieren.
    warne(`Die Gesamtliste ueber /suche war nicht lesbar: ${suche.grund}`);
    warne('Die Suche der Netlify-Fassung arbeitet dann auf den Kategorielisten.');
    const gesehen = new Set();
    for (const k of Object.values(kategorien)) {
      for (const p of k.produkte) {
        const s = pfadSchluessel(p.pfad);
        if (gesehen.has(s)) continue;
        gesehen.add(s);
        alleProdukte.push(p);
      }
    }
  }

  return { baum, kategorien, produkte, alleProdukte, gemeldeteTreffer, katFehler, prodFehler };
}

/* --- 4. Bilanz ---------------------------------------------------------- */

function bilanziere(daten, fd) {
  const p = daten.products;
  const bilanz = {
    kategorien: daten.categories.length,
    unterkategorien: daten.categories.reduce((a, c) => a + c.subs.length, 0),
    produkte: p.length,
    mitArtikelId: p.filter((x) => x.id).length,
    mitPreis: p.filter((x) => (x.price || 0) > 0).length,
    mitBild: p.filter((x) => x.image).length,
    mitName: p.filter((x) => x.name).length,
    kaufartikel: p.filter((x) => x.modus === 'kauf').length,
    anfrageartikel: p.filter((x) => x.modus === 'anfrage').length,
    mitFarbwahl: p.filter((x) => (x.colors || []).length).length,
    mitFreiemMass: p.filter((x) => x.custom).length,
    ohneDetailseite: daten.ohneDetails ?? 0,
    gekuerzt: daten.gekuerzt || 0,
    kategoriePfadeAbgelegt: Object.keys(fd.kategorien).length,
    artikeldatenAbgelegt: Object.keys(fd.produkte).length,
    suchlisteEintraege: fd.alleProdukte.length,
  };

  console.log('');
  console.log('  ==========================================================');
  console.log('   BILANZ DES KATALOGS');
  console.log('  ==========================================================');
  const zeile = (label, wert, von) => {
    const anteil = von ? `  (${Math.round((wert / von) * 100)} %)` : '';
    console.log('   ' + (label + ' ').padEnd(28, '.') + ' ' + String(wert).padStart(5) + anteil);
  };
  zeile('Kategorien', bilanz.kategorien);
  zeile('Unterkategorien', bilanz.unterkategorien);
  zeile('Produkte', bilanz.produkte);
  zeile('davon mit Name', bilanz.mitName, bilanz.produkte);
  zeile('davon mit Artikel-ID', bilanz.mitArtikelId, bilanz.produkte);
  zeile('davon mit Listenpreis', bilanz.mitPreis, bilanz.produkte);
  zeile('davon mit Bild', bilanz.mitBild, bilanz.produkte);
  console.log('   ' + '-'.repeat(48));
  zeile('Kaufartikel', bilanz.kaufartikel);
  zeile('Anfrageartikel', bilanz.anfrageartikel);
  zeile('mit Farbwahl', bilanz.mitFarbwahl);
  zeile('mit freier Masseingabe', bilanz.mitFreiemMass);
  console.log('   ' + '-'.repeat(48));
  zeile('ohne Detailseite', bilanz.ohneDetailseite);
  zeile('wegen Obergrenze gekuerzt', bilanz.gekuerzt);
  console.log('   ' + '-'.repeat(48));
  zeile('Kategoriepfade (Function)', bilanz.kategoriePfadeAbgelegt);
  zeile('Artikeldaten (Function)', bilanz.artikeldatenAbgelegt);
  zeile('Suchliste (Function)', bilanz.suchlisteEintraege);
  console.log('');

  return bilanz;
}

/**
 * Ein Katalog, der zwar nicht leer ist, aber offensichtlich kaputt, darf
 * genauso wenig ausgeliefert werden wie gar keiner. Die Schwellen sind
 * bewusst niedrig angesetzt -- sie sollen groben Bruch fangen, nicht
 * normale Schwankungen des Altsystems.
 */
function pruefePlausibilitaet(bilanz) {
  const einwaende = [];
  if (bilanz.kategorien < 4) einwaende.push(`nur ${bilanz.kategorien} Kategorien (erwartet: 8)`);
  if (bilanz.produkte < 100) einwaende.push(`nur ${bilanz.produkte} Produkte (erwartet: rund 365)`);
  if (bilanz.mitName / bilanz.produkte < 0.5) {
    einwaende.push(`nur ${bilanz.mitName} von ${bilanz.produkte} Produkten haben einen Namen`);
  }
  if (bilanz.mitArtikelId / bilanz.produkte < 0.5) {
    einwaende.push(`nur ${bilanz.mitArtikelId} von ${bilanz.produkte} Produkten haben eine Artikel-ID`);
  }
  if (bilanz.artikeldatenAbgelegt < bilanz.produkte * 0.8) {
    einwaende.push(`nur ${bilanz.artikeldatenAbgelegt} von ${bilanz.produkte} Artikeldaten fuer die Function`);
  }
  if (einwaende.length) {
    abbruch('Der Katalog ist zwar da, sieht aber kaputt aus:', einwaende.join(' · '));
  }
}

/* --- 5. Schreiben ------------------------------------------------------- */

/**
 * Die Daten als JS-Modul. JSON.parse auf einem String-Literal statt eines
 * ausgeschriebenen Objektliterals: die JS-Maschine parst das messbar
 * schneller, und beim Kaltstart einer Function zaehlt jede Zehntelsekunde.
 */
function alsModul(objekt, name, kopfzeilen) {
  const json = JSON.stringify(objekt);
  const literal = JSON.stringify(json); // korrekt maskiert, inkl. Anfuehrungszeichen
  return [
    '/* ' + '='.repeat(66),
    ...kopfzeilen.map((z) => '   ' + z),
    '   ' + '='.repeat(66) + ' */',
    '',
    '/* eslint-disable */',
    `export const ${name} = JSON.parse(${literal});`,
    '',
  ].join('\n');
}

async function schreibe(daten, fd, bilanz) {
  /* a) Die Katalogdatei fuer den Browser -- dieselbe Funktion wie im Server. */
  const js = shopKatalogJs(daten);
  await fs.mkdir(path.dirname(KATALOG_JS), { recursive: true });
  await fs.writeFile(KATALOG_JS, js, 'utf8');
  sage(`geschrieben: ${path.relative(FRONTEND, KATALOG_JS)}  (${(js.length / 1024).toFixed(0)} KB)`);

  /* b) Die Daten fuer die Function. */
  const modul = alsModul(
    {
      stand: daten.stand,
      standText: standLesbar(daten.stand),
      erzeugung: 'build',
      bilanz,
      katalog: fd.baum,
      kategorien: fd.kategorien,
      produkte: fd.produkte,
      alleProdukte: fd.alleProdukte,
      gemeldeteTreffer: fd.gemeldeteTreffer,
    },
    'KATALOG_DATEN',
    [
      'VORGEBAUTE KATALOGDATEN  --  NICHT VON HAND AENDERN',
      '',
      'Erzeugt von bridge-demo/build-katalog.mjs aus matten.de.',
      'Stand: ' + standLesbar(daten.stand) + '  (' + daten.stand + ')',
      '',
      'Diese Datei speist /api/katalog, /api/kategorie, /api/produkt und',
      '/api/suche der Netlify-Function. Live aufzubauen waere unmoeglich:',
      'der Aufbau kostet rund 390 Anfragen und etwa drei Minuten, eine',
      'Function darf zehn Sekunden laufen.',
      '',
      'Warenkorb, Preisabfrage, Kasse und Bildproxy sind davon NICHT',
      'betroffen -- die sprechen weiterhin live mit matten.de.',
    ]
  );
  await fs.mkdir(path.dirname(FUNKTIONS_DATEN), { recursive: true });
  await fs.writeFile(FUNKTIONS_DATEN, modul, 'utf8');
  sage(`geschrieben: ${path.relative(FRONTEND, FUNKTIONS_DATEN)}  (${(modul.length / 1024 / 1024).toFixed(1)} MB)`);
}

/* --- Ablauf ------------------------------------------------------------- */

async function main() {
  console.log('');
  console.log('  ==========================================================');
  console.log('   KATALOG-BUILD  --  matten.de einmal komplett lesen');
  console.log('  ==========================================================');
  console.log('');

  if (!nurKatalog) await kopiereStatisch();
  else sage('--nur-katalog: statische Dateien werden nicht neu kopiert.');

  const daten = await baueDenKatalog();
  const fd = await sammleFunktionsDaten(daten);
  const bilanz = bilanziere(daten, fd);
  pruefePlausibilitaet(bilanz);
  await schreibe(daten, fd, bilanz);

  if (daten.hinweise && daten.hinweise.length) {
    console.log('   Hinweise aus dem Aufbau:');
    for (const h of daten.hinweise.slice(0, 12)) console.log('     · ' + h);
    if (daten.hinweise.length > 12) console.log(`     · ... und ${daten.hinweise.length - 12} weitere`);
    console.log('');
  }

  sage(`FERTIG. Publish-Verzeichnis: ${PUBLISH}`);
  console.log('');
}

main().catch((err) => {
  abbruch('Unerwarteter Fehler beim Aufbau.', err && err.stack ? err.stack : String(err));
});
