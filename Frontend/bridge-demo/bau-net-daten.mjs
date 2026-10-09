#!/usr/bin/env node
/* ==========================================================================
   bau-net-daten.mjs — erzeugt public/net-neu/assets/js/daten.js
   --------------------------------------------------------------------------
   Aufruf:   node bau-net-daten.mjs            (schreibt daten.js, offline)
             node bau-net-daten.mjs --pruefen  (zusaetzlich: jeden matten.de-Pfad
                                                der Zuordnung einmal ueber die
                                                laufende Bruecke auf 8787 pruefen)

   Quellen (alle im Projekt, nichts wird aus dem Netz geholt):
     spec/struktur.json                          Kopf, Navigation, Fuss,
                                                 27 Kategorien, 19 Produkte
     spec/texte/produktbeschreibungen.md         Reiter "Beschreibung"
     spec/texte/agb.md, impressum.md, data-protection.md,
       datenschutzerklarung-dsgvo.md             Infoseiten
     spec/texte/blog.md                          2 Blogbeitraege
     spec/texte/products-uebersicht.md           26 Kategorie-Kaestchen (IDs)
     spec/screens/startseite.html                Karussell, Datenschutzhinweis,
                                                 Mattenfuchs-Text, TOP-ANGEBOTE
                                                 (Markup 1:1)
     spec/screens/kategorie-beispiel-ironhorse.html  Kartenbilder der Kategorie
     spec/screens/produkt-beispiel-*.html        Farbfelder (Nummer, Name,
                                                 Hexwert) und Beschreibungs-HTML
     spec/screens/ajax-custom-mat-materials.json Farbpalette (code, name, RGB)
     public/net-neu/assets/img/manifest.json     Original-URL -> lokale Datei
     spec/farbbilder.json                        Foto je Farbnummer (Original-URL)

   Regeln:
     * Bildpfade werden ueber das Manifest auf lokale Pfade (assets/img/...)
       umgeschrieben. Fehlt ein Bild lokal, bleibt das Feld null — es wird
       nichts erfunden und nichts von einem fremden Host verlinkt.
     * Adressen von matten.net werden auf die Seiten unter public/net-neu/
       abgebildet (Query-Parameter statt Pfade, siehe lokalerPfad()).
     * Die Ausgabe ist deterministisch: zweimal laufen lassen ergibt dieselbe
       Datei (kein Zeitstempel).
     * Nur Node-Builtins.
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC = path.join(__dirname, 'spec');
const ZIEL_DIR = path.join(__dirname, 'public', 'net-neu');
const ZIEL = path.join(ZIEL_DIR, 'assets', 'js', 'daten.js');

const lesen = (p) => fs.readFileSync(p, 'utf8');
const json = (p) => JSON.parse(lesen(p));

const struktur = json(path.join(SPEC, 'struktur.json'));
const manifest = json(path.join(ZIEL_DIR, 'assets', 'img', 'manifest.json'));
const FARBBILDER = (() => { const f = path.join(SPEC, 'farbbilder.json'); if (!fs.existsSync(f)) return {}; const d = json(f); delete d._quelle; return d; })();

/* ==========================================================================
   1  Zuordnung matten.net-Produkt -> matten.de-Artikel
   --------------------------------------------------------------------------
   Grundlage: spec/struktur.json.zuordnungMattenDe (Stand 31.08.2026) und der
   Katalogabgleich ueber die Bruecke vom 10.09.2026. dePfad ist der Kaufartikel
   ("In den Warenkorb" mit attribute[Standardgroesse]), deZwilling der
   Anfrageartikel "-a" mit freien Massen spezialoption[...][x]/[y].
   Alle 21 Pfade am 10.09.2026 ueber GET /api/produkt geprueft: kaufbar:true.
   ========================================================================== */
const ZUORDNUNG = {
  'iron-horse-1-farbige-und-melierte-schmutzfangmatten': {
    dePfad: '/fussmatten/standard-schmutzfangmatten/64000121', deZwilling: null,
    anmerkung: 'unsicher — Namensabgleich, drei IRON-HORSE-Kandidaten (64000121 gewaehlt: allgemeinste Variante)'
  },
  'iron-horse-matte': {
    dePfad: '/miet-mattenservice/mietmatten', deZwilling: null,
    anmerkung: 'Mietservice — Artikel ohne freie Masse; Preis kommt live vom Altsystem (kein EK/m2 auf matten.net)'
  },
  'jetprint-premium': {
    dePfad: '/fussmatten/standard-schmutzfangmatten/6300000',
    deZwilling: '/fussmatten/standard-schmutzfangmatten/6300000-a',
    anmerkung: 'einzige Nummer, deren Basis uebereinstimmt (6300000N <-> 6300000)'
  },
  'jetprint-premium-1-farbig': {
    dePfad: '/fussmatten/standard-schmutzfangmatten/6300000',
    deZwilling: '/fussmatten/standard-schmutzfangmatten/6300000-a',
    anmerkung: 'entschieden: identische Preisdaten wie pid 6 (52,67 / 1,931), de-Name "einfarbig"'
  },
  'mjplit-jetprint-light-1-farbig': {
    dePfad: '/fussmatten/fussmatten/jetprint_matten-light-einfarbig',
    deZwilling: '/fussmatten/fussmatten/jetprint_matten-light-einfarbig-a',
    anmerkung: 'Name deckungsgleich (JetPrint light, einfarbig)'
  },
  'jetprint-matten-design': {
    dePfad: '/logomatten/6300201-logomatte', deZwilling: '/logomatten/6300201-logomatte-a',
    anmerkung: 'entschieden: EK 54,63 EUR/m2 identisch mit dem Stammdatensatz 6300201-Logomatte (Spec 14.2 H)'
  },
  'designmatten-jetprint': {
    dePfad: '/logomatten/6300201-logomatte', deZwilling: '/logomatten/6300201-logomatte-a',
    anmerkung: 'thematisch: de-Standardartikel fuer individuell gestaltete JetPrint-Logomatten'
  },
  'os-quadrat-rehab-trainingsmatte': {
    dePfad: '/logomatten/os-physio-rehab-matten/6320301-quadrat', deZwilling: null,
    anmerkung: 'Volltextsuche "Quadrat-REHAB" eindeutig; Preis live (kein EK/m2 auf matten.net)'
  },
  'kokosmatten-naturfarbig': {
    dePfad: '/kokosmatten/kokosmatte-natur-kauf', deZwilling: null,
    anmerkung: 'einziger naturfarbiger Kokos-Kaufartikel; freie Masse spezialoption[...][flaeche][x|y]'
  },
  'kokos-farbig': {
    dePfad: '/kokosmatten/kokosmatte-farbig-k', deZwilling: null,
    anmerkung: 'Suche 6920002 -> 302 auf Kokos-Landingpage; Name deckungsgleich'
  },
  'jetprint-light-logo': {
    dePfad: '/logomatten/jetprint_light-matten', deZwilling: '/logomatten/jetprint_light-matten-a',
    anmerkung: 'unsicher — derselbe de-Artikel wie pid 32 (Designmatten JetPrint-light)'
  },
  'iron-horse-matte-2': {
    dePfad: '/fussmatten/standard-schmutzfangmatten/64000122', deZwilling: null,
    anmerkung: 'geraten: "-2" als zweite IRON-HORSE-Bauform (bis 150 cm Breite) gelesen'
  },
  'kokos-gestaltet': {
    dePfad: '/kokosmatten/beflockte_kokosmatte-a', deZwilling: null,
    anmerkung: 'ist selbst Anfrageartikel — nur Anfrage; Suche 6920003 trifft genau diesen Artikel'
  },
  'hinweismatten': {
    dePfad: '/logomatten/6300201-logomatte', deZwilling: '/logomatten/6300201-logomatte-a',
    anmerkung: 'entschieden: jetprint-designs-hinweise hat kein Kaufformular; Hinweismatten sind JetPrint-Matten mit Textdruck — Schrift-Design und Format gehen in den Kommentar'
  },
  'designmatten-jetprint-light': {
    dePfad: '/logomatten/jetprint_light-matten', deZwilling: '/logomatten/jetprint_light-matten-a',
    anmerkung: 'unsicher — derselbe de-Artikel wie pid 22 (JetPrint light Logo)'
  },
  'designmatten-jetprint-velour': {
    dePfad: '/logomatten/6400201-velourmatte', deZwilling: '/logomatten/6400201-velourmatte-a',
    anmerkung: 'Suche "Velourmatten" liefert genau diesen Artikel'
  },
  'aluminium-profilmatte-typ-diplomat-r': {
    dePfad: '/aluminium_profilmatten/52601', deZwilling: '/aluminium_profilmatten/52601-a',
    anmerkung: 'unsicher — 652601 enthaelt 52601 ("Diplomat"); Typ-R-Merkmal passt auch auf 52603 / 522RN-Ma-a'
  },
  'os-stern-rehab-trainingsmatte': {
    dePfad: '/logomatten/os-physio-rehab-matten/6320304', deZwilling: null,
    anmerkung: 'Suche "Stern-REHAB" eindeutig'
  },
  'os-5-punkt-rehab-trainingsmatte-c': {
    dePfad: '/logomatten/os-physio-rehab-matten/6320307-5punkt', deZwilling: null,
    anmerkung: 'Suche "5-Punkt-REHAB" eindeutig; Preis live (kein EK/m2 auf matten.net)'
  }
};

/* ==========================================================================
   2  Helfer
   ========================================================================== */

/** Original-URL (absolut oder Pfad) -> lokaler Pfad unter assets/, sonst null. */
function lokal(url) {
  if (!url) return null;
  let p = String(url).replace(/^https?:\/\/(www\.)?matten\.net/i, '');
  if (!p.startsWith('/')) return null;
  const kandidaten = [p];
  try { kandidaten.push(decodeURIComponent(p)); } catch (e) { /* bleibt */ }
  try { kandidaten.push(encodeURI(decodeURIComponent(p))); } catch (e) { /* bleibt */ }
  for (const k of kandidaten) {
    const rel = manifest[k];
    if (!rel) continue;
    /* Das Manifest nennt vereinzelt Dateien, die nicht auf der Platte liegen
       (z. B. product_thumbnail-Fassungen). Nur was wirklich da ist, zaehlt. */
    const kandidatenDatei = [rel];
    try { kandidatenDatei.push(decodeURIComponent(rel)); } catch (e) { /* bleibt */ }
    for (const d of kandidatenDatei) {
      if (fs.existsSync(path.join(ZIEL_DIR, 'assets', d))) {
        /* URL-kodiert ablegen, damit Leerzeichen/Umlaute in src/url() sicher sind. */
        return 'assets/' + d.split('/').map(encodeURIComponent).join('/');
      }
    }
  }
  return null;   /* nicht lokal vorhanden — nichts erfinden */
}

/**
 * matten.net-Adresse -> Seite unter public/net-neu/ (Dateinamen laut Briefing).
 * Unbekannte oder englische Adressen bleiben "#".
 */
function lokalerPfad(href) {
  const s = String(href || '').replace(/^https?:\/\/(www\.)?matten\.net/i, '');
  if (s === '' || s === '#') return '#';
  if (s === '/de' || s === '/de/') return 'index.html';
  if (s === '/de/products') return 'products.html';
  if (s === '/de/blog') return 'blog.html';
  if (s === '/de/guest-book') return 'guest-book.html';
  if (s === '/de/login') return 'login.html';
  if (s === '/de/account/register') return 'register.html';
  if (s === '/de/account/password-reset-request') return 'login.html#passwort';
  if (s === '/de/order/checkout') return 'checkout.html';
  if (s === '/de/custom-mat/create') return 'mattendesigner.html';
  if (s === '/de/custom-mat/checkout') return 'designer-checkout.html';
  let m;
  if ((m = /^\/de\/product-categories\/([a-z0-9-]+)$/.exec(s))) return 'kategorie.html?slug=' + m[1];
  if ((m = /^\/de\/products\/([a-z0-9-]+)$/.exec(s))) return 'produkt.html?slug=' + m[1];
  if ((m = /^\/de\/pages\/([a-z0-9-]+)$/.exec(s))) return 'pages.html?s=' + m[1];
  if ((m = /^\/de\/blog\/([a-z0-9-]+)$/.exec(s))) return 'blog.html#' + m[1];
  /* Folien 3/4 des Karussells zeigen im Original in die englische Fassung
     (Briefing: auf die deutschen Kategorien diplomat / jetprint-einfarbig). */
  if (s === '/en/product-categories/diplomat') return 'kategorie.html?slug=diplomat';
  if (s === '/en/product-categories/schon-sauber-duo-color') return 'kategorie.html?slug=jetprint-einfarbig';
  if (/^\/en(\/|$)/.test(s)) return '#';
  return '#';
}

/** HTML-Entities aus Markup zurueck in Text (nur die, die in den Quellen vorkommen). */
function entitiesAufloesen(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü')
    .replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö').replace(/&Uuml;/g, 'Ü')
    .replace(/&szlig;/g, 'ß').replace(/&bdquo;/g, '„').replace(/&ldquo;/g, '“')
    .replace(/&deg;/g, '°').replace(/&trade;/g, '™').replace(/&sup2;/g, '²')
    .replace(/&ndash;/g, '–');
}

/** Text HTML-sicher machen; bereits vorhandene Entities (&deg; &trade; …) bleiben. */
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&(?![a-zA-Z]+;|#\d+;)/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Markdown-Inline: **fett**, *kursiv*, [Text](Ziel). Der Rest wird escaped. */
function inline(md) {
  let s = escHtml(md);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*]+)\*(?=[\s).,;:]|$)/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (m, text, ziel) => {
    const z = ziel.replace(/"/g, '&quot;');
    const extern = /^https?:\/\//i.test(ziel) || /^mailto:/i.test(ziel);
    return '<a href="' + z + '"' + (extern ? ' target="_blank" rel="noopener"' : '') + '>' + text.trim() + '</a>';
  });
  return s;
}

/**
 * Der Abschnitt "## Inhalt" einer Textseite (spec/texte/*.md) als HTML.
 * Zwischenueberschriften stehen im Original als <p><strong>…</strong></p>
 * (die "###" der Markdown-Fassung dienten nur der Lesbarkeit) — so werden
 * sie hier wieder ausgegeben. Listen werden zu <ul>.
 */
function inhaltAlsHtml(mdText) {
  const start = mdText.indexOf('\n## Inhalt');
  const ende = mdText.indexOf('\n## Auffälligkeiten');
  const teil = mdText.slice(start + '\n## Inhalt'.length, ende > 0 ? ende : undefined);
  const zeilen = teil.split('\n');
  const out = [];
  let liste = [];
  const listeSchliessen = () => {
    if (liste.length) { out.push('<ul>' + liste.map((l) => '<li>' + l + '</li>').join('') + '</ul>'); liste = []; }
  };
  for (const roh of zeilen) {
    const z = roh.trim();
    if (!z) { listeSchliessen(); continue; }
    if (/^>\s*\*\*Hinweis|^>\s*\*\*Doppelung/.test(z)) continue;          /* Anmerkungen der Erfassung */
    if (/^>/.test(z)) continue;                                            /* Kaesten der Erfassung */
    if (/^- /.test(z)) { liste.push(inline(z.slice(2))); continue; }
    listeSchliessen();
    let m;
    if ((m = /^###\s+(.*)$/.exec(z))) { out.push('<p><strong>' + inline(m[1]) + '</strong></p>'); continue; }
    if ((m = /^##\s+(.*)$/.exec(z))) { out.push('<p><strong>' + inline(m[1]) + '</strong></p>'); continue; }
    out.push('<p>' + inline(z) + '</p>');
  }
  listeSchliessen();
  return out.join('\n');
}

/** Titel einer Textseite: die erste Zeile "# Titel". */
function titelAus(mdText) {
  const m = /^#\s+(.+)$/m.exec(mdText);
  return m ? m[1].trim() : '';
}

/* ==========================================================================
   3  Kopf, Navigation, Fuss
   ========================================================================== */

const K = struktur.kopfzeile;
const kopfzeile = {
  logo: { href: lokalerPfad(K.logo.href), img: lokal(K.logo.img), breite: K.logo.breite, hoehe: K.logo.hoehe },
  sprachwahl: {
    aktuell: K.sprachwahl.aktuell,
    optionen: K.sprachwahl.optionen.map((o) => ({
      label: o.label,
      /* Es gibt keine englische Fassung des Nachbaus: "English" bleibt als
         Eintrag stehen, zeigt aber auf "#" mit dem Hinweis "in Vorbereitung". */
      href: o.href === '/de' ? 'index.html' : '#',
      title: o.href === '/de' ? '' : 'in Vorbereitung',
      flagge: lokal(o.flagge)
    }))
  },
  links: K.links.map((l) => ({ label: l.label, href: lokalerPfad(l.href) })),
  warenkorbKnopf: { label: K.warenkorbKnopf.label },
  checkoutKnopf: { label: K.checkoutKnopf.label, href: lokalerPfad(K.checkoutKnopf.href) },
  suche: { formAction: lokalerPfad(K.suche.formAction), feld: K.suche.feld, platzhalter: K.suche.platzhalter }
};

const navigation = {
  eintraege: struktur.navigation.eintraege.map((e) => {
    if (e.typ === 'link') return { typ: 'link', label: e.label, href: lokalerPfad(e.href) };
    return {
      typ: 'gruppe',
      label: e.label,
      kategorien: e.kategorien.map((k) => ({
        label: k.label, slug: k.slug, href: lokalerPfad(k.href),
        /* "https://via.placeholder.com/150x100" (Cushion Coil, Scraper) ist
           eine Fremdressource ohne lokale Datei -> null, die Kachel bleibt
           ohne Bild. */
        bild: lokal(k.bild)
      }))
    };
  })
};

const F = struktur.fusszeile;
const fusszeile = {
  spalten: F.spalten.map((sp) => ({
    titel: sp.titel,
    links: (sp.links || []).map((l) => ({
      label: l.label,
      /* Social-Links bleiben externe Adressen (werden nur geklickt, nie geladen).
         LinkedIn/Instagram stehen in struktur.json ohne href — die Adressen
         stammen aus spec/screens/startseite.html. */
      href: l.href
        ? (/^https?:/.test(l.href) ? l.href : lokalerPfad(l.href))
        : (l.label === 'LinkedIn' ? 'https://www.linkedin.com/in/dieter-fuchsius-36902ba4/'
          : l.label === 'Instagram' ? 'https://www.instagram.com/mattenfuchsi/' : '#'),
      icon: l.label === 'Facebook' ? 'fab fa-facebook' : l.label === 'Twitter' ? 'fab fa-twitter'
          : l.label === 'LinkedIn' ? 'fab fa-linkedin' : l.label === 'Instagram' ? 'fab fa-instagram' : null
    })),
    inhalt: sp.inhalt || null
  })),
  cards: lokal('/images/cards.png'),
  copyright: F.copyright,
  newsletterWidget: { label: F.newsletterWidget.label, platzhalter: F.newsletterWidget.platzhalter, knopf: F.newsletterWidget.knopf }
};

/* ==========================================================================
   4  Farbpalette (Nummer -> Name, Hexwert)
   --------------------------------------------------------------------------
   Quelle 1: die Farbfelder der Original-Produktseiten (label style/title),
   Quelle 2: /de/ajax/custom-mat-materials (Designer-Palette, u. a. 600 Weiss).
   Die matten.de-Artikel nennen ihre Farben als "613-königsblau"; die Seite
   sucht den Hexwert ueber die Nummer und prueft den Namen mit.
   ========================================================================== */
const farben = {};
function farbeMerken(code, name, hex) {
  if (!code || !hex) return;
  if (!farben[code]) farben[code] = { name: name || '', hex: hex.toLowerCase() };
}
for (const datei of ['produkt-beispiel-jetprint-premium.html', 'produkt-beispiel-diplomat-r-mit-attributen.html']) {
  const html = lesen(path.join(SPEC, 'screens', datei));
  const re = /<label for="attribute-input-\d+-\d+"\s+style="background-color:\s*(#[0-9a-fA-F]{3,6})"\s+title="([^"]*)">\s*(\d+)\s*<\/label>/g;
  let m;
  while ((m = re.exec(html))) farbeMerken(m[3], entitiesAufloesen(m[2]), m[1]);
}
for (const material of json(path.join(SPEC, 'screens', 'ajax-custom-mat-materials.json'))) {
  for (const c of material.colors || []) farbeMerken(String(c.code), c.name, c.RGBColor);
}

/* ==========================================================================
   5  Kategorien und Produkte
   ========================================================================== */

/* Beschreibungs-HTML der Produktseiten: 1:1 aus den zwei erfassten
   Original-Seiten, sonst der Wortlaut aus texte/produktbeschreibungen.md. */
function beschreibungAusScreen(datei) {
  const html = lesen(path.join(SPEC, 'screens', datei));
  const m = /<div class="description-content">([\s\S]*?)<\/div>\s*<\/div>\s*<div class="tab-pane fade" id="reviews"/.exec(html);
  return m ? m[1].trim() : null;
}
const BESCHREIBUNG_SCREEN = {
  'jetprint-premium': beschreibungAusScreen('produkt-beispiel-jetprint-premium.html'),
  'aluminium-profilmatte-typ-diplomat-r': beschreibungAusScreen('produkt-beispiel-diplomat-r-mit-attributen.html')
};

const beschreibungenMd = lesen(path.join(SPEC, 'texte', 'produktbeschreibungen.md'));
const BESCHREIBUNG_TEXT = {};
{
  const bloecke = beschreibungenMd.split(/\n## /).slice(1);
  for (const b of bloecke) {
    const slug = (/\*\*Slug:\*\*\s*`([^`]+)`/.exec(b) || [])[1];
    if (!slug) continue;
    const zeilen = b.split('\n').slice(1).filter((z) => z.trim() && !/^- \*\*Slug/.test(z.trim()));
    /* Der Wortlaut ist in der Erfassung zu einem Absatz zusammengelaufen;
       er wird HTML-sicher als <p> uebernommen (Entities wie &deg; bleiben). */
    BESCHREIBUNG_TEXT[slug] = zeilen.map((z) => '<p>' + escHtml(z.trim()) + '</p>').join('\n');
  }
}

/* Kartenbilder (product_thumbnail) aus den Original-Seiten, 1:1. */
function kartenAus(datei) {
  const html = lesen(path.join(SPEC, 'screens', datei));
  const karten = {};
  const re = /<a href="\/de\/products\/([a-z0-9-]+)" title="[^"]*">\s*<div class="card product-card">\s*<img src="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) karten[m[1]] = m[2];
  return karten;
}
/* Kartenbilder der Produktliste /de/products (Seite 1 und 2), gelesen am
   10.09.2026 aus dem Live-HTML (nur GET). Sie weichen bei einigen Produkten
   vom ersten Grossbild ab (Velour = Papagei, JetPrint light Logo = Farbkarte,
   JetPrint-Premium = JPrint-005) und gehen deshalb vor. */
const KARTEN_LISTE = {
  'os-5-punkt-rehab-trainingsmatte-c': '/media/cache/product_thumbnail/uploads/5cca325ee6c13.jpeg',
  'os-stern-rehab-trainingsmatte': '/media/cache/product_thumbnail/uploads/Stern-630-606.jpg',
  'aluminium-profilmatte-typ-diplomat-r': '/media/cache/product_thumbnail/uploads/Dip-R.jpg',
  'designmatten-jetprint-velour': '/media/cache/product_thumbnail/uploads/JetPrint-Velour-512x340.jpg',
  'designmatten-jetprint-light': '/media/cache/product_thumbnail/uploads/Jet-Print%20Light_800x600.jpg',
  'hinweismatten': '/media/cache/product_thumbnail/uploads/Herzlich%20Willkommen_512x340.JPG',
  'kokos-gestaltet': '/media/cache/product_thumbnail/uploads/5c47fafe5a2a8jpeg',
  'iron-horse-matte-2': '/media/cache/product_thumbnail/uploads/5c47fa2b58b3djpeg',
  'jetprint-light-logo': '/media/cache/product_thumbnail/uploads/5c47fb75ede37jpeg',
  'kokos-farbig': '/media/cache/product_thumbnail/uploads/5c47fa829d279jpeg',
  'kokosmatten-naturfarbig': '/media/cache/product_thumbnail/uploads/kokos-natur_512x340.jpg',
  'os-quadrat-rehab-trainingsmatte': '/media/cache/product_thumbnail/uploads/5cce29fead941.jpeg',
  'designmatten-jetprint': '/media/cache/product_thumbnail/uploads/JetPrint-Logo-616.jpg',
  'jetprint-matten-design': '/media/cache/product_thumbnail/uploads/Eing-Logo-512x340.jpg',
  'mjplit-jetprint-light-1-farbig': '/media/cache/product_thumbnail/uploads/JetPrint%20light%201-farbig.jpg',
  'jetprint-premium-1-farbig': '/media/cache/product_thumbnail/uploads/637-leuchtblau.JPG',
  'jetprint-premium': '/media/cache/product_thumbnail/uploads/JPrint-005.jpg',
  'iron-horse-matte': '/media/cache/product_thumbnail/uploads/5c47fa2b58b3djpeg',
  'iron-horse-1-farbige-und-melierte-schmutzfangmatten': '/media/cache/product_thumbnail/uploads/5c4c1812b732ejpeg'
};
const KARTEN_ORIGINAL = Object.assign({}, kartenAus('kategorie-beispiel-ironhorse.html'), kartenAus('startseite.html'), KARTEN_LISTE);

const kategorien = {};
const kategorieReihenfolge = [];
for (const k of struktur.kategorien) {
  kategorieReihenfolge.push(k.slug);
  kategorien[k.slug] = {
    slug: k.slug, name: k.name, gruppe: k.gruppe,
    href: 'kategorie.html?slug=' + k.slug,
    beschreibung: k.beschreibung || null,          /* Text; die Seite escaped */
    titelbild: lokal(k.titelbild),
    produkte: k.produkte.map((p) => p.slug)
  };
}

/* Drei Attribut-Beschriftungen sind in struktur.json falsch erfasst (dort
   stehen Farbnummern statt der Beschriftungen); richtig laut Spec 15.2 und
   dem Original-Markup (produkt-beispiel-diplomat-r-mit-attributen.html). */
const ATTRIBUT_BESCHRIFTUNG = {
  'aluminium-profilmatte-typ-diplomat-r|attributes[4]': 'Kratzkante',
  'hinweismatten|attributes[2]': 'Schrift-Design',
  'hinweismatten|attributes[3]': 'Format'
};

const produkte = {};
const produktReihenfolge = [];   /* struktur.json: hoechste productId zuerst = "Latest" */
for (const p of struktur.produkte) {
  p.attribute = (p.attribute || []).map((a) => ({
    ...a,
    beschriftung: ATTRIBUT_BESCHRIFTUNG[p.slug + '|' + a.formularname] || a.beschriftung
  }));
  produktReihenfolge.push(p.slug);
  const bilder = p.bilder.map((b) => lokal(b)).filter(Boolean);
  const erstesOriginal = p.bilder[0] || null;
  /* Kachel: 1. das Original-Kartenbild der erfassten Seiten, 2. die
     product_thumbnail-Fassung des ersten Grossbilds, 3. das Grossbild selbst. */
  let kachel = null;
  if (KARTEN_ORIGINAL[p.slug]) kachel = lokal(KARTEN_ORIGINAL[p.slug]);
  if (!kachel && erstesOriginal) kachel = lokal(erstesOriginal.replace('/single_product_image/', '/product_thumbnail/'));
  if (!kachel && bilder.length) kachel = bilder[0];
  produkte[p.slug] = {
    productId: p.productId,
    slug: p.slug,
    name: p.name,
    href: 'produkt.html?slug=' + p.slug,
    artikelnummer: String(p.artikelnummer),
    preisdaten: p.preisdaten,
    fixgroessen: p.fixgroessen,
    standardbreitenSelect: p.standardbreitenSelect,
    customOption: p.customOption,
    attribute: p.attribute,
    bilder,
    kachel,
    kategorien: kategorieReihenfolge.filter((s) => kategorien[s].produkte.includes(p.slug)),
    beschreibung: BESCHREIBUNG_SCREEN[p.slug] || BESCHREIBUNG_TEXT[p.slug] || ''
  };
  /* Foto je Farbe (09.10.2026, Lukas: "wenn ich die Farbe wechsle, soll sich
     die Farbe der Matte aendern"). Normalerweise liefert das Altsystem diese
     Bilder; bei JetPrint light 1-farbig hat es aber nur 2 von 43. Das
     Original matten.net hat 42 — erfasst in spec/farbbilder.json
     (Farbnummer -> Original-URL), lokal ueber das Manifest. Nur wenn
     vorhanden, sonst bleibt das Feld weg (daten.js bleibt fuer alle anderen
     Produkte byteweise gleich). */
  const fb = FARBBILDER[p.slug];
  if (fb) {
    const karte = {};
    for (const nr of Object.keys(fb).sort()) { const l = lokal(fb[nr]); if (l) karte[nr] = l; }
    if (Object.keys(karte).length) produkte[p.slug].farbbilder = karte;
  }
}

/* Die 9 Gruppen mit 26 Kategorie-Kaestchen der Produktliste (IDs des
   Originals aus texte/products-uebersicht.md). */
const gruppen = [];
{
  const md = lesen(path.join(SPEC, 'texte', 'products-uebersicht.md'));
  const re = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*\/\s*`child_\d+`\s*\|$/gm;
  let m;
  while ((m = re.exec(md))) {
    const [, gruppe, label, id] = m;
    let g = gruppen.find((x) => x.label === gruppe);
    if (!g) { g = { label: gruppe, kategorien: [] }; gruppen.push(g); }
    const kat = struktur.kategorien.find((k) => k.name === label);
    g.kategorien.push({ id: Number(id), label, slug: kat ? kat.slug : null });
  }
}

/* ==========================================================================
   6  Startseite (Markup-Bestandteile 1:1 aus spec/screens/startseite.html)
   ========================================================================== */
const startHtml = lesen(path.join(SPEC, 'screens', 'startseite.html'));
const startseite = {};
{
  const m = /<div class="protection-info">\s*([\s\S]*?)\s*<\/div>\s*<\/div>/.exec(startHtml);
  startseite.datenschutzhinweisHtml = m
    ? m[1].replace(/https:\/\/matten\.net\/de\/pages\/data-protection/g, 'pages.html?s=data-protection').trim()
    : '';

  startseite.karussell = [];
  const re = /<div class="carousel-item[^"]*">\s*<img class="d-block w-100" src="([^"]+)" alt="([^"]*)">\s*<div class="carousel-caption d-inline">\s*<a href="([^"]*)">\s*<h5 class="h2">([^<]*)<\/h5>\s*<p class="h4">([^<]*)<\/p>/g;
  let f;
  while ((f = re.exec(startHtml))) {
    /* Folie 5 traegt im Original den Tippfehler "Fusßmatten" — korrigiert (Briefing). */
    const titel = entitiesAufloesen(f[4]).replace('Fusßmatten', 'Fussmatten');
    startseite.karussell.push({
      bild: lokal(f[1]), alt: titel, href: lokalerPfad(f[3]), titel, untertitel: entitiesAufloesen(f[5])
    });
  }

  const feat = /<a href="\/de\/product-categories\/([a-z0-9-]+)">\s*<div class="category-thumbnail-container"[^>]*>\s*<div class="category-thumbnail" style="background-image: url\('([^']+)'\)">[\s\S]*?<p class="category-thumbnail-caption">\s*([^<]+?)\s*<\/p>/.exec(startHtml);
  startseite.featured = feat
    ? { ueberschrift: 'Featured Category (German)', slug: feat[1], href: 'kategorie.html?slug=' + feat[1], bild: lokal(feat[2]), caption: feat[3].trim() }
    : null;

  startseite.topAngebote = [];
  const kre = /<a href="\/de\/products\/([a-z0-9-]+)" title="[^"]*">\s*<div class="card product-card">/g;
  while ((f = kre.exec(startHtml))) startseite.topAngebote.push(f[1]);

  const mf = /<span>Der Mattenfuchs<\/span>\s*<\/h2>\s*<div>\s*([\s\S]*?)\s*<\/div>/.exec(startHtml);
  startseite.mattenfuchsText = mf ? entitiesAufloesen(mf[1].trim()) : '';

  startseite.vorteile = [];
  const vre = /<img src="([^"]+)" alt="([^"]*)" width="120" height="120">\s*<\/div>\s*<p class="info-text text-center">([^<]*)<\/p>/g;
  while ((f = vre.exec(startHtml))) startseite.vorteile.push({ bild: lokal(f[1]), alt: f[2], text: f[3].trim() });
}

/* ==========================================================================
   7  Texte: Infoseiten und Blog
   ========================================================================== */
const texte = {};
for (const s of ['agb', 'impressum', 'data-protection', 'datenschutzerklarung-dsgvo']) {
  const md = lesen(path.join(SPEC, 'texte', s + '.md'));
  texte[s] = { titel: titelAus(md), html: inhaltAlsHtml(md) };
}
{
  const md = lesen(path.join(SPEC, 'texte', 'blog.md'));
  const blog = [];
  const teile = md.split(/\n### (?=\d+\. )/).slice(1);
  for (const t of teile) {
    const titel = t.split('\n')[0].replace(/^\d+\.\s*/, '').trim();
    const url = (/^- URL:\s*(\S+)/m.exec(t) || [])[1] || '';
    const datum = (/^- Datum \(wörtlich\):\s*\*([^*]+)\*/m.exec(t) || [])[1] || '';
    const absaetze = t.split('\n').filter((z) => /^> /.test(z)).map((z) => inline(z.slice(2).trim()));
    blog.push({ titel, slug: url.split('/').pop(), datum, absaetze });
  }
  texte.blog = blog;
}

/* ISO-3166-1-Alpha-2-Codes (249) fuer das Land-Auswahlfeld der Registrierung;
   die deutschen Namen bildet der Browser mit Intl.DisplayNames. */
const LAENDER_CODES = ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ ' +
  'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY ' +
  'HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY ' +
  'MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW ' +
  'SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' ');
if (LAENDER_CODES.length !== 249) throw new Error('Laenderliste: ' + LAENDER_CODES.length + ' statt 249 Codes');

/* ==========================================================================
   7b  Mattendesigner (Spec 9.6) — Materialien, Schriften, Stammdaten, Zuordnung
   --------------------------------------------------------------------------
   Quelle: spec/screens/ajax-custom-mat-materials.json — die Antwort von
   GET /de/ajax/custom-mat-materials, 1:1 mit den Feldnamen des Originals
   (id, name, description, price, colors[{id, code, name, RGBColor, sortPosition}],
   sizes[{id, width, height, weight, available}]), weil seite-designer.js die
   Vue-Komponente nachbildet, die genau diese Felder liest.

   Dazu je Material (Briefing Designer 3.2 / 3.4, nicht auf matten.net):
     preisdaten  Stammdaten fuer berechne() aus preisformel.js. Herleitung:
                 matten.net-Materialpreis 101,71 EUR/m2 = 52,67 x 1,931 (Spec 14.2 I);
                 JetPrint_light 40,85 / 1,87; JetPrint-Velour 39,06 / 1,931;
                 ColorStar wie JetPrint. Standardbreiten der Rolle 60/75/85/115/150/200.
     dePfad      Anfrageartikel des Altsystems mit freien Massen (beide Masse als
                 Zahlenfelder spezialoption[<id>][spezial][x|y], GET /api/produkt
                 am 10.09.2026 geprueft). ColorStar hat keinen eigenen Artikel und
                 geht ueber 569 (JetPrint-Logomatte) mit dem Material im Kommentar.
   ========================================================================== */
const DESIGNER_STAMM = {
  'JetPrint':        { einkaufProQm: 52.67, salesFactor: 1.931, dePfad: '/logomatten/6300201-logomatte-a',
                       anmerkung: 'Artikel 569: x 20-200 cm, y 40-700 cm' },
  'JetPrint_light':  { einkaufProQm: 40.85, salesFactor: 1.87,  dePfad: '/logomatten/jetprint_light-matten-a',
                       anmerkung: 'Artikel 722: x 25-200 cm, y 30-700 cm' },
  'JetPrint-Velour': { einkaufProQm: 39.06, salesFactor: 1.931, dePfad: '/logomatten/6400201-velourmatte-a',
                       anmerkung: 'Artikel 776: x 30-700 cm, y 30-200 cm (Achsen gegenueber 569 vertauscht)' },
  'ColorStar':       { einkaufProQm: 52.67, salesFactor: 1.931, dePfad: '/logomatten/6300201-logomatte-a',
                       anmerkung: 'kein eigener Artikel im Altsystem — Material steht im Kommentar' }
};
const DESIGNER_STANDARDBREITEN = [60, 75, 85, 115, 150, 200];
const mattendesigner = {
  pfad: struktur.mattendesigner.pfad,
  materialien: json(path.join(SPEC, 'screens', 'ajax-custom-mat-materials.json')).map((m) => {
    const st = DESIGNER_STAMM[m.name];
    if (!st) throw new Error('Designer-Material ohne Stammdaten: ' + m.name);
    return {
      id: m.id, name: m.name, description: m.description, price: m.price,
      colors: (m.colors || []).map((c) => ({ id: c.id, code: String(c.code), name: c.name, RGBColor: c.RGBColor, sortPosition: c.sortPosition })),
      sizes: (m.sizes || []).map((s) => ({ id: s.id, width: s.width, height: s.height, weight: s.weight, available: s.available })),
      preisdaten: { einkaufProQm: st.einkaufProQm, salesFactor: st.salesFactor, standardbreiten: DESIGNER_STANDARDBREITEN },
      dePfad: st.dePfad, anmerkung: st.anmerkung
    };
  }),
  /* Die 8 Schriften der Vue-Komponente (displayName -> fontFamily), Spec 9.3; Ubuntu ist Voreinstellung. */
  schriften: [
    { displayName: 'Amatic SC', fontFamily: 'Amatic SC' },
    { displayName: 'Anton', fontFamily: 'Anton' },
    { displayName: 'Arial', fontFamily: 'Arimo' },
    { displayName: 'Brush', fontFamily: 'Caveat Brush' },
    { displayName: 'Dancing Script', fontFamily: 'Dancing Script' },
    { displayName: 'Finger Paint', fontFamily: 'Finger Paint' },
    { displayName: 'Ubuntu', fontFamily: 'Ubuntu' },
    { displayName: 'Vast Shadow', fontFamily: 'Vast Shadow' }
  ],
  hintergrund: lokal('/images/mat-editor-background.jpg'),   /* Boden unter der Matte */
  beispielbild: lokal('/images/mattenfuchs_square.png')      /* Fuchs im Beispieldesign (addSample) */
};

/* ==========================================================================
   7c  Erweiterung "--alle": Produkte aus dem Altsystem (ueber die Bruecke)
   --------------------------------------------------------------------------
   Ohne Schalter laeuft dieser Abschnitt nicht: dann entsteht daten.js wie
   bisher aus spec/struktur.json (die 19 Schaufenster-Produkte).

   Mit  --alle  (oder --aus-altsystem)  holt das Skript ueber die Bruecke
   (Vorgabe http://localhost:8787, ueberschreibbar mit BRUECKE=...):
     /api/katalog      Warengruppen-Baum des Altsystems
     /api/kategorie    die Artikel je Warengruppe (alle Seiten)
     /api/suche?alle=1 der ganze Katalog (faengt Artikel ohne Warengruppe)
     /api/produkt      je Artikel: Artikel-ID, Name, Preis, Bilder, Attribute
   und schreibt NICHT daten.js, sondern daten-alle.js (anderer Name, damit
   das Frontend erst umgestellt wird, wenn alles geprueft ist).

   Was dabei entsteht:
     * Die 19 kuratierten Produkte bleiben unveraendert (Beschreibungen,
       Farbpalette, Zuordnung). Ihre Altsystem-Artikel (dePfad/deZwilling)
       werden NICHT noch einmal als eigene Produkte angelegt; das kuratierte
       Produkt traegt stattdessen die Warengruppen seines Artikels mit.
     * Alle uebrigen Artikel kommen neu dazu. Eindeutiger Schluessel ist die
       Artikel-ID des Altsystems (Pfade sind nicht eindeutig). Dubletten
       (Teaser-Bloecke, die auf denselben Artikel zeigen) fallen weg;
       Info-Seiten ohne Artikel-ID (/home/info-...) sind keine Produkte.
     * Warengruppen des Altsystems werden zu Kategorien "de-<schluessel>"
       (NET.kategorien) und als Baum in NET.warengruppen abgelegt. Die 27
       Produktlinien von matten.net bleiben unveraendert Schaufenster
       (NET.kategorieReihenfolge, NET.gruppen, Menue, Startseite).
     * Anfrage-Varianten ("-a") haben meist kein eigenes Bild und keinen
       Namen: beides kommt vom Hauptartikel.
     * Preisstammdaten (preisdaten) gibt es nur, wo EK je m2, Salesfactor und
       Standardbreiten bekannt sind. Sie stehen in der Datei
       _arbeit/produkte-uebernahme/preisstamm-altsystem.json (je Artikel-ID)
       und lassen sich dort jederzeit nachtragen; --preisstamm-vorlage schreibt
       eine Vorlage mit allen Artikeln, die freie Masse aufnehmen.
     * Welche Artikel erscheinen, steuert
       _arbeit/produkte-uebernahme/auswahl-altsystem.json (oder die Schalter
       --ohne-varianten, --nur-kauf, --nur-mit-bild).

   Weitere Schalter: --cache-dir <ordner> merkt sich die Antworten der Bruecke
   (Wiederholungslaeufe ohne Netz), --ausgabe <datei> aendert das Ziel.
   ========================================================================== */
const ARG = process.argv.slice(2);
const MODUS_ALLE = ARG.includes('--alle') || ARG.includes('--aus-altsystem');
const argWert = (name) => {
  const i = ARG.indexOf(name);
  if (i >= 0 && ARG[i + 1] && !ARG[i + 1].startsWith('--')) return ARG[i + 1];
  const m = ARG.find((a) => a.startsWith(name + '='));
  return m ? m.slice(name.length + 1) : null;
};
const ARBEIT_DIR = path.join(__dirname, '..', '_arbeit', 'produkte-uebernahme');
const BRUECKE_BASIS = process.env.BRUECKE || 'http://localhost:8787';
const MAX_BILDER = 12;          /* Galerie je Produkt; die Bruecke liefert bis zu 60 (Farbmuster-Topf) */
const PARALLEL = 6;             /* gleichzeitige Anfragen an die Bruecke */

/* Dateiname-tauglicher Schluessel (ASCII, a-z0-9 und Bindestrich). */
function slugify(s) {
  return String(s || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&[a-z0-9#]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Liste abarbeiten, hoechstens n gleichzeitig; Ergebnisse in Eingabereihenfolge. */
async function parallel(liste, n, fn) {
  const aus = new Array(liste.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, liste.length) }, async () => {
    while (i < liste.length) { const k = i++; aus[k] = await fn(liste[k], k); }
  }));
  return aus;
}

/** GET auf die Bruecke (nur lesen). Mit cacheDir werden Antworten abgelegt/gelesen. */
async function holeBruecke(pfadUndQuery, cacheDir) {
  let datei = null;
  if (cacheDir) {
    const h = crypto.createHash('sha1').update(pfadUndQuery).digest('hex');
    datei = path.join(cacheDir, h + '.json');
    if (fs.existsSync(datei)) return JSON.parse(fs.readFileSync(datei, 'utf8'));
  }
  let letzter = null;
  for (let versuch = 1; versuch <= 4; versuch++) {
    try {
      const r = await fetch(BRUECKE_BASIS + pfadUndQuery, { headers: { 'Sec-Fetch-Site': 'same-origin' } });
      const d = await r.json();
      if (datei && (r.ok || r.status === 404)) {
        fs.mkdirSync(path.dirname(datei), { recursive: true });
        fs.writeFileSync(datei, JSON.stringify(d), 'utf8');
      }
      return d;
    } catch (e) {
      letzter = e;
      await new Promise((ok) => setTimeout(ok, 300 * versuch));
    }
  }
  throw new Error('Bruecke nicht erreichbar (' + BRUECKE_BASIS + pfadUndQuery + '): ' + (letzter && letzter.message));
}

/* Auswahl: welche Altsystem-Artikel erscheinen. Vorgabe = alle. */
const AUSWAHL_VORGABE = {
  modus: 'alle',                   /* 'alle' | 'kauf' | 'anfrage' */
  varianten: true,                 /* Anfrage-Varianten ("-a") aufnehmen */
  ohneBild: true,                  /* Artikel ohne jedes Bild aufnehmen */
  nurArtikelIds: [],               /* nicht leer: NUR diese Artikel-IDs */
  ausschliessenArtikelIds: [],     /* diese Artikel-IDs weglassen */
  ausschliessenPfade: [],          /* diese Pfade weglassen (Gross/Klein egal) */
  ausschliessenWarengruppen: []    /* Schluessel wie "logomatten/bierbankmatten"; Artikel, die NUR dort stehen, entfallen */
};
function auswahlLesen() {
  const datei = argWert('--auswahl') || path.join(ARBEIT_DIR, 'auswahl-altsystem.json');
  let a = {};
  if (fs.existsSync(datei)) a = json(datei);
  const w = { ...AUSWAHL_VORGABE, ...a };
  if (ARG.includes('--ohne-varianten')) w.varianten = false;
  if (ARG.includes('--nur-kauf')) w.modus = 'kauf';
  if (ARG.includes('--nur-mit-bild')) w.ohneBild = false;
  w.quelle = fs.existsSync(datei) ? path.relative(__dirname, datei) : '(Vorgabe, keine Datei)';
  return w;
}

/* Preisstamm: je Artikel-ID die Werte der Excel-Formel. Nur vollstaendige
   Eintraege (EK, Salesfactor, Standardbreiten) werden zu preisdaten. */
function preisstammLesen() {
  const datei = argWert('--preisstamm') || path.join(ARBEIT_DIR, 'preisstamm-altsystem.json');
  const aus = { artikel: {}, quelle: fs.existsSync(datei) ? path.relative(__dirname, datei) : '(keine Datei)' };
  if (fs.existsSync(datei)) aus.artikel = json(datei).artikel || {};
  return aus;
}
function preisdatenAus(e) {
  if (!e) return { preisdaten: null, fehlt: ['einkaufProQm', 'salesFactor', 'standardbreiten'] };
  const fehlt = [];
  if (!(Number(e.einkaufProQm) > 0)) fehlt.push('einkaufProQm');
  if (!(Number(e.salesFactor) > 0)) fehlt.push('salesFactor');
  if (!Array.isArray(e.standardbreiten) || !e.standardbreiten.length) fehlt.push('standardbreiten');
  if (fehlt.length) return { preisdaten: null, fehlt };
  const pd = { einkaufProQm: Number(e.einkaufProQm), salesFactor: Number(e.salesFactor), standardbreiten: e.standardbreiten.map(Number) };
  if (e.sondermassFaktor != null) pd.sondermassFaktor = Number(e.sondermassFaktor);
  if (e.singleColorFaktor != null) pd.singleColorFaktor = Number(e.singleColorFaktor);
  return { preisdaten: pd, fehlt: [] };
}

/** Bild-URL der Bruecke ("/api/img/bild/x.jpg") -> unveraendert; Cache-Fassungen aussortieren. */
const istCacheBild = (b) => /\/cache\//.test(b.original || b.bild || '');
function bilderAus(produkt) {
  const alle = (produkt.bilder || []).filter((b) => b && b.bild);
  const eigentlich = alle.filter((b) => !istCacheBild(b));
  const urls = [];
  for (const b of (eigentlich.length ? eigentlich : alle)) if (!urls.includes(b.bild)) urls.push(b.bild);
  return urls.slice(0, MAX_BILDER);
}

/** Attribute des Altsystems kompakt: Feld, Name, Typ, Art, Optionswerte. */
function attributeKompakt(produkt) {
  return (produkt.attribute || []).map((a) => ({
    feld: a.feld, name: a.name, typ: a.typ, art: a.art,
    optionen: (a.optionen || []).map((o) => o.wert)
  }));
}
function masseKompakt(produkt) {
  return (produkt.masse || []).map((m) => ({ feld: m.feld, typ: m.typ, min: m.min, max: m.max }));
}

/* Endungen, an denen man Anfrage-Varianten erkennt (Erkundung Zuordnung 4.2). */
const VARIANTEN_ENDUNGEN = ['-ang', '-sondermass', '-a', 'a'];
/** Moegliche Pfade des Hauptartikels zu einer Variante (alles klein geschrieben). */
function hauptKandidaten(pfadKlein) {
  const aus = [];
  for (const e of VARIANTEN_ENDUNGEN) {
    if (!pfadKlein.endsWith(e) || pfadKlein.length <= e.length + 1) continue;
    const stamm = pfadKlein.slice(0, -e.length);
    for (const k of [stamm, stamm + '-kauf', stamm + '-k']) if (!aus.includes(k)) aus.push(k);
  }
  return aus;
}

async function erweitereAusAltsystem(NET) {
  const cacheDir = argWert('--cache-dir');
  const auswahl = auswahlLesen();
  const preisstamm = preisstammLesen();
  const bericht = { warnungen: [] };
  const kuratiertSlugs = Object.keys(NET.produkte);   /* die 19 Schaufenster-Produkte, vor dem Ergaenzen */

  /* ---- 1  Warengruppen-Baum --------------------------------------- */
  const katalog = await holeBruecke('/api/katalog?zaehlen=0', cacheDir);
  if (!katalog || !katalog.ok) throw new Error('/api/katalog lieferte keinen Baum: ' + JSON.stringify(katalog).slice(0, 200));
  const knoten = [];
  (function flach(liste, eltern) {
    for (const k of liste) {
      knoten.push({ schluessel: k.schluessel, name: entitiesAufloesen(k.name), pfad: k.pfad, ebene: k.ebene, eltern: eltern ? eltern.schluessel : null });
      flach(k.unterkategorien || [], k);
    }
  })(katalog.kategorien || [], null);
  const kategorieSlug = (k) => 'de-' + slugify(k.schluessel);
  const slugCheck = new Set();
  for (const k of knoten) {
    const s = kategorieSlug(k);
    if (slugCheck.has(s)) throw new Error('Kategorie-Schluessel doppelt: ' + s);
    slugCheck.add(s);
  }

  /* ---- 2  Zeilen jeder Warengruppe (alle Seiten) ------------------ */
  const kategorieZeilen = await parallel(knoten, 4, async (k) => {
    const zeilen = [];
    for (let seite = 1; ; seite++) {
      const d = await holeBruecke('/api/kategorie?pfad=' + encodeURIComponent(k.pfad) + '&proSeite=200&seite=' + seite, cacheDir);
      if (!d || !d.ok) { bericht.warnungen.push('Warengruppe ' + k.pfad + ' nicht lesbar: ' + (d && d.fehler)); break; }
      zeilen.push(...(d.produkte || []));
      if (seite >= (d.seiten || 1)) break;
    }
    return zeilen;
  });

  /* ---- 3  Gesamtkatalog (faengt Artikel ohne Warengruppe) --------- */
  const sucheZeilen = [];
  for (let seite = 1; ; seite++) {
    const d = await holeBruecke('/api/suche?alle=1&proSeite=200&seite=' + seite, cacheDir);
    if (!d || !d.ok) { bericht.warnungen.push('Gesamtkatalog Seite ' + seite + ' nicht lesbar'); break; }
    sucheZeilen.push(...(d.produkte || []));
    if (seite >= (d.seiten || 1)) break;
  }

  /* ---- 4  Alle verschiedenen Pfade -> Artikel (/api/produkt) ------- */
  const zeilenJePfad = new Map();    /* pfad klein -> erste Listenzeile (Name, Bild, Kurztext) */
  const pfadOriginal = new Map();    /* pfad klein -> Schreibweise der ersten Fundstelle */
  /* Zeilen ohne Modus (weder "Online kaufen" noch "Anfrage") sind Teaser-Artikel des Altsystems:
     eigene Artikelnummer, aber der Link zeigt auf eine andere Seite (Info-Seite, Landingpage
     oder einen anderen Artikel, z. B. "Sonderangebot" -> 6301011). Sie sind keine Platzierung
     des Zielartikels und werden hier nur gezaehlt. */
  const teaser = new Map();         /* anker -> { pfad, name } */
  const istTeaser = (z) => z && z.modus == null;
  const merke = (z) => {
    if (!z || !z.pfad) return;
    if (istTeaser(z)) { if (!teaser.has(z.anker)) teaser.set(z.anker, { pfad: z.pfad, name: z.name }); return; }
    const kl = z.pfad.toLowerCase();
    if (!pfadOriginal.has(kl)) { pfadOriginal.set(kl, z.pfad); zeilenJePfad.set(kl, z); }
    else if (!zeilenJePfad.get(kl).bildOriginal && z.bildOriginal) zeilenJePfad.set(kl, { ...zeilenJePfad.get(kl), bildOriginal: z.bildOriginal, bild: z.bild });
  };
  kategorieZeilen.forEach((zs) => zs.forEach(merke));
  sucheZeilen.forEach(merke);
  /* Die Pfade der kuratierten Zuordnung gehoeren dazu, auch wenn sie in keiner Liste stehen. */
  for (const z of Object.values(ZUORDNUNG)) for (const p of [z.dePfad, z.deZwilling]) if (p) merke({ pfad: p });

  const pfadListe = [...pfadOriginal.keys()].sort();
  const details = new Map();         /* pfad klein -> { ok, produkt } */
  await parallel(pfadListe, PARALLEL, async (kl) => {
    const d = await holeBruecke('/api/produkt?pfad=' + encodeURIComponent(pfadOriginal.get(kl)), cacheDir);
    details.set(kl, d && d.ok ? { ok: true, produkt: d.produkt } : { ok: false, fehler: d && d.fehler });
  });

  /* ---- 5  Artikel nach Artikel-ID zusammenfuehren ------------------ */
  const artikel = new Map();         /* artikelId -> Datensatz */
  const idJePfad = new Map();        /* pfad klein -> artikelId */
  const keinArtikel = [];            /* Info-Seiten, nicht lesbare Pfade */
  for (const kl of pfadListe) {
    const d = details.get(kl);
    const p = d.ok ? d.produkt : null;
    if (!p || !Number.isInteger(p.artikelId)) { keinArtikel.push({ pfad: pfadOriginal.get(kl), grund: p ? 'Info-Seite ohne Artikel-ID' : (d.fehler || 'nicht lesbar') }); continue; }
    idJePfad.set(kl, p.artikelId);
    /* Der Pfad, den das Altsystem selbst nennt, ist der massgebliche. */
    const echt = (p.pfad || pfadOriginal.get(kl));
    idJePfad.set(echt.toLowerCase(), p.artikelId);
    if (!artikel.has(p.artikelId)) {
      artikel.set(p.artikelId, { id: p.artikelId, pfad: echt, produkt: p, zeile: zeilenJePfad.get(kl) || {}, pfade: new Set([kl]), warengruppen: [] });
    } else {
      const a = artikel.get(p.artikelId);
      a.pfade.add(kl);
      if (!a.zeile.bildOriginal && (zeilenJePfad.get(kl) || {}).bildOriginal) a.zeile = { ...a.zeile, bildOriginal: zeilenJePfad.get(kl).bildOriginal, bild: zeilenJePfad.get(kl).bild };
    }
  }
  bericht.pfadeGesamt = pfadListe.length;
  bericht.keinArtikel = keinArtikel;
  bericht.teaser = [...teaser.entries()].map(([anker, t]) => ({ anker, ...t }));
  bericht.listenzeilenKategorien = kategorieZeilen.reduce((n, zs) => n + zs.length, 0);
  bericht.listenzeilenKatalog = sucheZeilen.length;

  /* Warengruppen je Artikel, in der Reihenfolge des Katalogs. */
  const reihenfolge = [];            /* artikelId in Reihenfolge des ersten Auftretens */
  const gesehen = new Set();
  const nimmAuf = (id) => { if (!gesehen.has(id)) { gesehen.add(id); reihenfolge.push(id); } };
  knoten.forEach((k, i) => {
    for (const z of kategorieZeilen[i]) {
      if (istTeaser(z)) continue;
      const id = idJePfad.get((z.pfad || '').toLowerCase());
      if (!id) continue;
      nimmAuf(id);
      const a = artikel.get(id);
      if (!a.warengruppen.includes(k.schluessel)) a.warengruppen.push(k.schluessel);
    }
  });
  for (const z of sucheZeilen) { if (istTeaser(z)) continue; const id = idJePfad.get((z.pfad || '').toLowerCase()); if (id) nimmAuf(id); }
  for (const id of [...artikel.keys()].sort((x, y) => x - y)) nimmAuf(id);

  /* ---- 6  Hauptartikel und Zwillinge ableiten ---------------------- */
  const hauptVon = new Map();        /* Variante (id) -> Hauptartikel (id) */
  const zwillingVon = new Map();     /* Hauptartikel (id) -> Variante (id), nur geprueft */
  for (const id of reihenfolge) {
    const a = artikel.get(id);
    if (a.produkt.modus !== 'anfrage') continue;
    const kl = a.pfad.toLowerCase();
    for (const kand of hauptKandidaten(kl)) {
      const hid = idJePfad.get(kand);
      if (!hid || hid === id) continue;
      const h = artikel.get(hid);
      if (h.produkt.modus !== 'kauf') continue;
      hauptVon.set(id, hid);
      /* Zwilling nur, wenn die Variante wirklich freie Masse aufnimmt. */
      const freiesMass = (a.produkt.masse || []).length > 0 || (a.produkt.attribute || []).some((x) => x.art === 'spezialoption');
      if (!freiesMass) bericht.zwillingOhneMasse = (bericht.zwillingOhneMasse || 0) + 1;
      else if (!zwillingVon.has(hid)) zwillingVon.set(hid, id);
      break;
    }
  }

  /* ---- 7  Was die kuratierten Produkte schon abdecken --------------- */
  const abgedeckt = new Map();       /* artikelId -> kuratierter slug (erster) */
  for (const slug of kuratiertSlugs) {
    const z = ZUORDNUNG[slug];
    if (!z) continue;
    for (const p of [z.dePfad, z.deZwilling]) {
      const id = p && idJePfad.get(p.toLowerCase());
      if (id && !abgedeckt.has(id)) abgedeckt.set(id, slug);
    }
  }
  bericht.kuratiertAbgedeckt = abgedeckt.size;

  /* ---- 8  Auswahl anwenden ----------------------------------------- */
  const nurIds = new Set((auswahl.nurArtikelIds || []).map(Number));
  const rausIds = new Set((auswahl.ausschliessenArtikelIds || []).map(Number));
  const rausPfade = new Set((auswahl.ausschliessenPfade || []).map((p) => String(p).toLowerCase()));
  const rausGruppen = new Set(auswahl.ausschliessenWarengruppen || []);
  const entfallen = { variante: 0, modus: 0, ohneBild: 0, liste: 0, warengruppe: 0 };
  const behalten = [];
  for (const id of reihenfolge) {
    if (abgedeckt.has(id)) continue;
    const a = artikel.get(id);
    const p = a.produkt;
    if (nurIds.size && !nurIds.has(id)) { entfallen.liste++; continue; }
    if (rausIds.has(id) || [...a.pfade].some((x) => rausPfade.has(x)) || rausPfade.has(a.pfad.toLowerCase())) { entfallen.liste++; continue; }
    if (a.warengruppen.length && a.warengruppen.every((g) => rausGruppen.has(g))) { entfallen.warengruppe++; continue; }
    if (!auswahl.varianten && hauptVon.has(id)) { entfallen.variante++; continue; }
    if (auswahl.modus !== 'alle' && p.modus !== auswahl.modus) { entfallen.modus++; continue; }
    behalten.push(id);
  }
  /* "ohne Bild" erst nach der Bildvererbung entscheiden (siehe unten). */

  /* ---- 9  Produktdatensaetze --------------------------------------- */
  const slugVon = new Map();         /* artikelId -> slug (neu) bzw. kuratierter slug (abgedeckt) */
  for (const [id, s] of abgedeckt) slugVon.set(id, s);
  const vergeben = new Set(Object.keys(NET.produkte));
  for (const id of behalten) {
    const a = artikel.get(id);
    const name = anzeigeName(a);
    let s = 'a' + id + '-' + slugify(name).slice(0, 40).replace(/-+$/g, '');
    s = s.replace(/-+$/g, '');
    if (vergeben.has(s)) throw new Error('Produkt-Schluessel doppelt: ' + s);
    vergeben.add(s);
    slugVon.set(id, s);
  }
  /* Name und Herkunft des Namens: Artikelseite > Hauptartikel (Pfad geprueft) >
     in der Liste geerbter Name (folgt der Listenreihenfolge, unsicher) > Artikelnummer. */
  function nameUndQuelle(a) {
    const p = a.produkt;
    if (p.name) return [entitiesAufloesen(p.name), 'artikel'];
    const hid = hauptVon.get(a.id);
    if (hid && artikel.get(hid).produkt.name) return [entitiesAufloesen(artikel.get(hid).produkt.name), 'hauptartikel'];
    if (a.zeile && a.zeile.nameGeerbt) return [entitiesAufloesen(a.zeile.nameGeerbt), 'liste-geerbt'];
    return [p.artikelnummer || String(a.id), 'artikelnummer'];
  }
  function anzeigeName(a) { return nameUndQuelle(a)[0]; }

  const neu = {};                    /* slug -> Produkt */
  const neuZuordnung = {};
  const gewaehlt = [];
  for (const id of behalten) {
    const a = artikel.get(id);
    const p = a.produkt;
    const hid = hauptVon.get(id) || null;
    const haupt = hid ? artikel.get(hid) : null;
    /* Bild: eigenes, sonst das des Hauptartikels (Anfrage-Varianten). */
    let bilder = bilderAus(p);
    let kachel = a.zeile.bild || null;
    let bildVon = bilder.length || kachel ? 'eigen' : null;
    if (haupt && !a.zeile.bild) {
      const hb = bilderAus(haupt.produkt);
      const hk = haupt.zeile.bild || hb[0] || null;
      if (hk) { kachel = hk; bildVon = 'hauptartikel'; }
      if (!bilder.length && hb.length) bilder = hb;
      else if (bildVon === 'hauptartikel' && hb.length) bilder = hb;
    }
    if (!kachel && bilder.length) kachel = bilder[0];
    if (!bilder.length && kachel) bilder = [kachel];
    if (!bildVon && kachel) bildVon = 'eigen';
    if (!kachel && !bilder.length && !auswahl.ohneBild) { entfallen.ohneBild++; continue; }

    const stamm = preisdatenAus(preisstamm.artikel[String(id)]);
    const pr = p.preis || {};
    const slug = slugVon.get(id);
    const textVon = (x) => (x.produkt.beschreibungAbsaetze || []).length
      ? x.produkt.beschreibungAbsaetze.map((z) => '<p>' + escHtml(z) + '</p>').join('\n')
      : (x.zeile.kurzbeschreibung ? '<p>' + escHtml(x.zeile.kurzbeschreibung) + '</p>' : '');
    const beschreibung = textVon(a) || (haupt ? textVon(haupt) : '');
    neu[slug] = {
      productId: null,                        /* kein matten.net-Produkt */
      quelle: 'altsystem',
      artikelId: id,
      slug,
      name: anzeigeName(a),
      nameQuelle: nameUndQuelle(a)[1],
      href: 'produkt.html?slug=' + slug,
      artikelnummer: String(p.artikelnummer || ''),
      modus: p.modus || null,                 /* 'kauf' | 'anfrage' (Stand des Bauens, zur Laufzeit gilt /api/produkt) */
      variante: !!haupt || (!p.name && p.modus === 'anfrage'),
      hauptartikelId: hid,
      preisdaten: stamm.preisdaten,
      preisAltsystem: pr.wert != null ? { wert: pr.wert, text: pr.text, ab: pr.unvollstaendigPraefix === 'ab', brutto: pr.brutto !== false, ustSatz: pr.ustSatz == null ? null : pr.ustSatz } : null,
      fixgroessen: [],
      standardbreitenSelect: [],
      customOption: null,
      attribute: [],                          /* Format von matten.net; fuer Altsystem-Artikel leer */
      deAttribute: attributeKompakt(p),
      deMasse: masseKompakt(p),
      bilder,
      kachel,
      bildVon,
      kategorien: [],                         /* unten gefuellt */
      beschreibung
    };
    neuZuordnung[slug] = { dePfad: a.pfad, deZwilling: null, anmerkung: 'direkt aus dem Altsystem (Artikel-ID ' + id + ')' };
    gewaehlt.push(id);
  }
  /* Zwillinge eintragen (nur wenn der Zwilling selbst erscheint ODER wenigstens existiert). */
  for (const id of gewaehlt) {
    const zid = zwillingVon.get(id);
    if (zid) neuZuordnung[slugVon.get(id)].deZwilling = artikel.get(zid).pfad;
  }
  const bleibt = new Set(gewaehlt);

  /* ---- 10  Kategorien und Verknuepfungen ---------------------------- */
  const deKategorien = {};
  for (const k of knoten) {
    deKategorien[kategorieSlug(k)] = {
      slug: kategorieSlug(k), name: k.name,
      gruppe: k.eltern ? knoten.find((x) => x.schluessel === k.eltern).name : null,
      href: 'kategorie.html?slug=' + kategorieSlug(k),
      beschreibung: null,
      titelbild: null,
      produkte: [],
      quelle: 'altsystem', deSchluessel: k.schluessel, dePfad: k.pfad, ebene: k.ebene,
      eltern: k.eltern ? 'de-' + slugify(k.eltern) : null
    };
  }
  knoten.forEach((k, i) => {
    const kat = deKategorien[kategorieSlug(k)];
    for (const z of kategorieZeilen[i]) {
      if (istTeaser(z)) continue;
      const id = idJePfad.get((z.pfad || '').toLowerCase());
      if (!id) continue;
      const slug = slugVon.get(id);
      if (!slug) continue;
      const kuratiert = abgedeckt.has(id);
      if (!kuratiert && !bleibt.has(id)) continue;
      if (!kat.produkte.includes(slug)) kat.produkte.push(slug);
      const p = kuratiert ? NET.produkte[slug] : neu[slug];
      if (!p.kategorien.includes(kategorieSlug(k))) p.kategorien.push(kategorieSlug(k));
    }
  });

  /* ---- 11  In NET einsetzen ----------------------------------------- */
  Object.assign(NET.kategorien, deKategorien);
  Object.assign(NET.produkte, neu);
  Object.assign(NET.zuordnung, neuZuordnung);
  for (const id of gewaehlt) NET.produktReihenfolge.push(slugVon.get(id));
  NET.warengruppenReihenfolge = knoten.map(kategorieSlug);
  NET.warengruppen = knoten.filter((k) => !k.eltern).map((k) => ({
    slug: kategorieSlug(k), name: k.name, anzahl: deKategorien[kategorieSlug(k)].produkte.length,
    kinder: knoten.filter((x) => x.eltern === k.schluessel).map((x) => ({ slug: kategorieSlug(x), name: x.name, anzahl: deKategorien[kategorieSlug(x)].produkte.length }))
  }));
  NET.altsystem = {
    hinweis: 'Produkte mit quelle "altsystem" kommen aus matten.de (ueber die Bruecke), erzeugt von bau-net-daten.mjs --alle. Schluessel ist die Artikel-ID; die Produkt-Schluessel beginnen mit a<ID>-.',
    anzahlNeu: gewaehlt.length,
    anzahlKuratiert: kuratiertSlugs.length,
    auswahl: { modus: auswahl.modus, varianten: auswahl.varianten, ohneBild: auswahl.ohneBild },
    preisstammEintraege: Object.keys(preisstamm.artikel).length
  };

  /* ---- 12  Bericht --------------------------------------------------- */
  const neuListe = gewaehlt.map((id) => neu[slugVon.get(id)]);
  bericht.auswahl = auswahl;
  bericht.preisstamm = preisstamm;
  bericht.artikelGefunden = artikel.size;
  bericht.entfallen = entfallen;
  bericht.neu = neuListe.length;
  bericht.kategorien = knoten.length;
  bericht.ohneBild = neuListe.filter((p) => !p.kachel && !p.bilder.length).map((p) => p.slug);
  bericht.ohneKategorie = neuListe.filter((p) => !p.kategorien.length).map((p) => p.slug);
  bericht.ohnePreis = neuListe.filter((p) => !p.preisAltsystem && !p.preisdaten).map((p) => p.slug);
  bericht.ohnePreisKauf = neuListe.filter((p) => !p.preisAltsystem && !p.preisdaten && p.modus === 'kauf').map((p) => p.slug);
  bericht.ohnePreisAnfrage = bericht.ohnePreis.length - bericht.ohnePreisKauf.length;
  bericht.nameGeerbt = neuListe.filter((p) => p.nameQuelle === 'liste-geerbt' || p.nameQuelle === 'artikelnummer').map((p) => p.slug);
  bericht.ohnePreisstamm = neuListe.filter((p) => !p.preisdaten).length;
  bericht.mitPreisstamm = neuListe.filter((p) => p.preisdaten).length;
  bericht.varianten = neuListe.filter((p) => p.variante).length;
  bericht.variantenOhneHaupt = neuListe.filter((p) => p.variante && !p.hauptartikelId).length;
  bericht.bildVomHauptartikel = neuListe.filter((p) => p.bildVon === 'hauptartikel').length;
  bericht.zwillinge = Object.values(neuZuordnung).filter((z) => z.deZwilling).length;
  /* Kuratierte Produkte ohne Zwilling, fuer die sich einer ableiten laesst: nur als Vorschlag,
     die kuratierte Zuordnung bleibt unangetastet. */
  NET.altsystem.zwillingsVorschlaege = {};
  for (const slug of kuratiertSlugs) {
    const z = ZUORDNUNG[slug];
    if (!z || z.deZwilling) continue;
    const id = idJePfad.get(z.dePfad.toLowerCase());
    const zid = id && zwillingVon.get(id);
    if (zid) NET.altsystem.zwillingsVorschlaege[slug] = artikel.get(zid).pfad;
  }
  bericht.zwillingsVorschlaege = Object.keys(NET.altsystem.zwillingsVorschlaege).length;
  bericht.kandidatenFuerPreisstamm = neuListe.filter((p) => (p.deMasse || []).length || (p.deAttribute || []).some((x) => x.art === 'spezialoption')).length;

  /* Vorlage fuer den Preisstamm: alle Artikel, die freie Masse aufnehmen. */
  if (ARG.includes('--preisstamm-vorlage')) {
    const vorlage = {
      _hinweis: 'Vorlage: je Artikel-ID einen Eintrag ausfuellen und als preisstamm-altsystem.json speichern (unter "artikel"). Nur Eintraege mit einkaufProQm, salesFactor UND standardbreiten werden zu Preisstammdaten. Nicht benoetigte Eintraege einfach loeschen.',
      artikel: {}
    };
    for (const id of reihenfolge) {
      const a = artikel.get(id);
      const p = a.produkt;
      const frei = (p.masse || []).length > 0 || (p.attribute || []).some((x) => x.art === 'spezialoption');
      if (!frei) continue;
      vorlage.artikel[String(id)] = {
        artikelnummer: p.artikelnummer, name: anzeigeName(a), pfad: a.pfad, modus: p.modus,
        einkaufProQm: (preisstamm.artikel[String(id)] || {}).einkaufProQm ?? null,
        salesFactor: (preisstamm.artikel[String(id)] || {}).salesFactor ?? null,
        standardbreiten: (preisstamm.artikel[String(id)] || {}).standardbreiten ?? null
      };
    }
    const vz = path.join(ARBEIT_DIR, 'preisstamm-vorlage.json');
    fs.mkdirSync(ARBEIT_DIR, { recursive: true });
    fs.writeFileSync(vz, JSON.stringify(vorlage, null, 1) + '\n', 'utf8');
    bericht.vorlage = { datei: path.relative(__dirname, vz), eintraege: Object.keys(vorlage.artikel).length };
  }
  return bericht;
}

/* ==========================================================================
   8  Schreiben
   ========================================================================== */
const NET = {
  quelle: struktur.meta.quelle,
  erfasstAm: struktur.meta.erfasstAm,
  kopfzeile, navigation, fusszeile,
  kategorien, kategorieReihenfolge,
  produkte, produktReihenfolge,
  gruppen,
  zuordnung: ZUORDNUNG,
  farben,
  startseite,
  texte,
  laenderCodes: LAENDER_CODES,
  mattendesigner
};

/* Mit --alle kommen die Produkte des Altsystems dazu (Abschnitt 7c); die Datei
   heisst dann anders (daten-alle.js), die heutige daten.js bleibt unberuehrt. */
let alleBericht = null;
let zielDatei = argWert('--ausgabe') ? path.resolve(argWert('--ausgabe')) : ZIEL;   /* --ausgabe gilt auch ohne --alle (zum Vergleichen) */
if (MODUS_ALLE) {
  zielDatei = path.resolve(argWert('--ausgabe') || path.join(ZIEL_DIR, 'assets', 'js', 'daten-alle.js'));
  if (zielDatei === path.resolve(ZIEL) && !ARG.includes('--daten-js-ueberschreiben')) {
    throw new Error('--alle schreibt nicht in daten.js (das Frontend laeuft noch damit). Anderes Ziel mit --ausgabe waehlen, oder bewusst --daten-js-ueberschreiben setzen.');
  }
  alleBericht = await erweitereAusAltsystem(NET);
}

const kopf = MODUS_ALLE
  ? '/* ERZEUGT von bau-net-daten.mjs --alle, nicht von Hand ändern.\n' +
    '   Quellen: spec/struktur.json (19 kuratierte Produkte), spec/texte/*.md, spec/screens/*.html,\n' +
    '   public/net-neu/assets/img/manifest.json und das Altsystem matten.de über die Brücke\n' +
    '   (Artikel, Warengruppen). Auswahl: _arbeit/produkte-uebernahme/auswahl-altsystem.json,\n' +
    '   Preisstamm: _arbeit/produkte-uebernahme/preisstamm-altsystem.json.\n' +
    '   Neu bauen: node bau-net-daten.mjs --alle */\n'
  : '/* ERZEUGT von bau-net-daten.mjs, nicht von Hand ändern.\n' +
    '   Quellen: spec/struktur.json, spec/texte/*.md, spec/screens/*.html,\n' +
    '   public/net-neu/assets/img/manifest.json. Neu bauen: node bau-net-daten.mjs */\n';
const ausgabe = kopf + 'window.NET = ' + JSON.stringify(NET, null, 1) + ';\n';
fs.mkdirSync(path.dirname(zielDatei), { recursive: true });
fs.writeFileSync(zielDatei, ausgabe, 'utf8');

/* Kurzbericht */
const ohneKachel = Object.values(produkte).filter((p) => !p.kachel).map((p) => p.slug);
const ohneKategoriebild = navigation.eintraege.flatMap((e) => e.kategorien || []).filter((k) => !k.bild).map((k) => k.slug);
const ohneTitelbild = Object.values(kategorien).filter((k) => !k.titelbild).map((k) => k.slug);
if (!MODUS_ALLE) {
console.log('daten.js geschrieben: ' + path.relative(__dirname, zielDatei) + ' (' + (ausgabe.length / 1024).toFixed(0) + ' KB)');
console.log('  Kategorien ' + kategorieReihenfolge.length + ' · Produkte ' + produktReihenfolge.length +
  ' · Farben ' + Object.keys(farben).length + ' · Karussell ' + startseite.karussell.length +
  ' · Gruppen ' + gruppen.length + ' (' + gruppen.reduce((n, g) => n + g.kategorien.length, 0) + ' Kaestchen)');
} else {
  const b = alleBericht;
  const kat = Object.values(NET.kategorien);
  console.log('daten-alle.js geschrieben: ' + path.relative(__dirname, zielDatei) + ' (' + (ausgabe.length / 1024).toFixed(0) + ' KB, ' + Buffer.byteLength(ausgabe, 'utf8') + ' Bytes)');
  console.log('  Produkte ' + Object.keys(NET.produkte).length + ' (' + (Object.keys(NET.produkte).length - b.neu) + ' kuratiert + ' + b.neu + ' aus dem Altsystem)' +
    ' · Kategorien ' + kat.length + ' (' + kategorieReihenfolge.length + ' Produktlinien + ' + b.kategorien + ' Warengruppen)');
  console.log('  Gelesen: ' + b.pfadeGesamt + ' verschiedene Pfade -> ' + b.artikelGefunden + ' Artikel (Listenzeilen: ' + b.listenzeilenKategorien + ' in Warengruppen, ' + b.listenzeilenKatalog + ' im Gesamtkatalog)');
  console.log('  Teaser-Zeilen ohne Modus (nicht uebernommen): ' + b.teaser.length + ' · Kein Artikel (Info-Seiten u. a.): ' + b.keinArtikel.length + ' · von kuratierten Produkten abgedeckt: ' + b.kuratiertAbgedeckt +
    ' · durch Auswahl entfallen: ' + JSON.stringify(b.entfallen));
  console.log('  Varianten (-a): ' + b.varianten + ' (ohne Hauptartikel: ' + b.variantenOhneHaupt + ', Bild vom Hauptartikel: ' + b.bildVomHauptartikel + ') · Zwillinge eingetragen: ' + b.zwillinge +
    ' (verworfen mangels freier Masse: ' + (b.zwillingOhneMasse || 0) + ') · Vorschlaege fuer kuratierte Produkte: ' + b.zwillingsVorschlaege);
  console.log('  Preisstamm: ' + b.mitPreisstamm + ' mit Preisdaten, ' + b.ohnePreisstamm + ' ohne (Datei: ' + b.preisstamm.quelle + ', ' + Object.keys(b.preisstamm.artikel).length + ' Eintraege) · Kandidaten mit freien Massen: ' + b.kandidatenFuerPreisstamm);
  console.log('  Auswahl: ' + b.auswahl.quelle + ' · modus=' + b.auswahl.modus + ' varianten=' + b.auswahl.varianten + ' ohneBild=' + b.auswahl.ohneBild);
  if (b.vorlage) console.log('  Vorlage Preisstamm: ' + b.vorlage.datei + ' (' + b.vorlage.eintraege + ' Artikel)');
  for (const w of b.warnungen) console.log('  WARNUNG: ' + w);
}
if (!MODUS_ALLE && ohneKachel.length) console.log('  ohne Kartenbild (bleibt leer): ' + ohneKachel.join(', '));
if (!MODUS_ALLE && ohneKategoriebild.length) console.log('  Menuekacheln ohne Bild (Fremdressource im Original): ' + ohneKategoriebild.join(', '));
if (!MODUS_ALLE && ohneTitelbild.length) console.log('  Kategorien ohne Titelbild: ' + ohneTitelbild.join(', '));

/* ==========================================================================
   9  Optional: Zuordnungspfade ueber die laufende Bruecke pruefen
   ========================================================================== */
if (process.argv.includes('--pruefen')) {
  const basis = process.env.BRUECKE || 'http://localhost:8787';
  const pfade = [...new Set(Object.values(ZUORDNUNG).flatMap((z) => [z.dePfad, z.deZwilling]).filter(Boolean))];
  console.log('\nPruefe ' + pfade.length + ' Pfade ueber ' + basis + ' …');
  let fehler = 0;
  for (const pfad of pfade) {
    try {
      const r = await fetch(basis + '/api/produkt?pfad=' + encodeURIComponent(pfad), { headers: { 'Sec-Fetch-Site': 'same-origin' } });
      const d = await r.json();
      const p = d.produkt || {};
      const ok = d.ok && p.kaufbar === true;
      if (!ok) fehler++;
      if (!ok || !MODUS_ALLE) console.log((ok ? '  ok      ' : '  FEHLER  ') + pfad + '  modus=' + (p.modus || '-') + '  id=' + (p.artikelId || '-'));
    } catch (e) {
      fehler++;
      console.log('  FEHLER  ' + pfad + '  ' + e.message);
    }
  }
  console.log(fehler ? fehler + ' Pfad(e) nicht kaufbar oder nicht erreichbar.' : (MODUS_ALLE ? 'Alle ' + pfade.length + ' Pfade kaufbar.' : 'Alle Pfade kaufbar.'));
}

/* --------------------------------------------------------------------------
   Zusatz zu --pruefen: wie viele Produkte sind ohne Bild, ohne Kategorie,
   ohne Preis geblieben? Mit --alle gilt die Zaehlung den Altsystem-Artikeln,
   sonst den 19 kuratierten Produkten.
   -------------------------------------------------------------------------- */
if (process.argv.includes('--pruefen')) {
  console.log('\nVollstaendigkeit:');
  if (MODUS_ALLE) {
    const b = alleBericht;
    const zeige = (liste) => liste.length ? ' (' + liste.slice(0, 8).join(', ') + (liste.length > 8 ? ', …' : '') + ')' : '';
    console.log('  Altsystem-Artikel gesamt:      ' + b.neu);
    console.log('  ohne Bild:                     ' + b.ohneBild.length + zeige(b.ohneBild));
    console.log('  ohne Kategorie:                ' + b.ohneKategorie.length + zeige(b.ohneKategorie));
    console.log('  ohne Preis (weder Altsystem-Preis noch Preisstamm): ' + b.ohnePreis.length + ' (davon Kaufartikel: ' + b.ohnePreisKauf.length + zeige(b.ohnePreisKauf) + '; Anfrageartikel, Preis nur auf Anfrage: ' + b.ohnePreisAnfrage + ')');
    console.log('  Name unsicher (aus der Liste geerbt oder nur Artikelnummer): ' + b.nameGeerbt.length + zeige(b.nameGeerbt));
    console.log('  ohne Preisstammdaten (Formel nicht vorbereitet):    ' + b.ohnePreisstamm + ' von ' + b.neu);
  } else {
    const liste = Object.values(produkte);
    const ohneBild = liste.filter((p) => !p.kachel && !p.bilder.length).map((p) => p.slug);
    const ohneKat = liste.filter((p) => !p.kategorien.length).map((p) => p.slug);
    const ohnePreis = liste.filter((p) => !(p.preisdaten && p.preisdaten.einkaufProQm > 0)).map((p) => p.slug);
    console.log('  kuratierte Produkte gesamt:    ' + liste.length);
    console.log('  ohne Bild:                     ' + ohneBild.length + (ohneBild.length ? ' (' + ohneBild.join(', ') + ')' : ''));
    console.log('  ohne Kategorie:                ' + ohneKat.length + (ohneKat.length ? ' (' + ohneKat.join(', ') + ')' : ''));
    console.log('  ohne Preisstammdaten (EK 0):   ' + ohnePreis.length + (ohnePreis.length ? ' (' + ohnePreis.join(', ') + ')' : '') + '  -> rechnen ueber /api/price');
  }
}
