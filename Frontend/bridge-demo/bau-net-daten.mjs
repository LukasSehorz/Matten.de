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
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPEC = path.join(__dirname, 'spec');
const ZIEL_DIR = path.join(__dirname, 'public', 'net-neu');
const ZIEL = path.join(ZIEL_DIR, 'assets', 'js', 'daten.js');

const lesen = (p) => fs.readFileSync(p, 'utf8');
const json = (p) => JSON.parse(lesen(p));

const struktur = json(path.join(SPEC, 'struktur.json'));
const manifest = json(path.join(ZIEL_DIR, 'assets', 'img', 'manifest.json'));

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

const kopf =
  '/* ERZEUGT von bau-net-daten.mjs, nicht von Hand ändern.\n' +
  '   Quellen: spec/struktur.json, spec/texte/*.md, spec/screens/*.html,\n' +
  '   public/net-neu/assets/img/manifest.json. Neu bauen: node bau-net-daten.mjs */\n';
const ausgabe = kopf + 'window.NET = ' + JSON.stringify(NET, null, 1) + ';\n';
fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
fs.writeFileSync(ZIEL, ausgabe, 'utf8');

/* Kurzbericht */
const ohneKachel = Object.values(produkte).filter((p) => !p.kachel).map((p) => p.slug);
const ohneKategoriebild = navigation.eintraege.flatMap((e) => e.kategorien || []).filter((k) => !k.bild).map((k) => k.slug);
const ohneTitelbild = Object.values(kategorien).filter((k) => !k.titelbild).map((k) => k.slug);
console.log('daten.js geschrieben: ' + path.relative(__dirname, ZIEL) + ' (' + (ausgabe.length / 1024).toFixed(0) + ' KB)');
console.log('  Kategorien ' + kategorieReihenfolge.length + ' · Produkte ' + produktReihenfolge.length +
  ' · Farben ' + Object.keys(farben).length + ' · Karussell ' + startseite.karussell.length +
  ' · Gruppen ' + gruppen.length + ' (' + gruppen.reduce((n, g) => n + g.kategorien.length, 0) + ' Kaestchen)');
if (ohneKachel.length) console.log('  ohne Kartenbild (bleibt leer): ' + ohneKachel.join(', '));
if (ohneKategoriebild.length) console.log('  Menuekacheln ohne Bild (Fremdressource im Original): ' + ohneKategoriebild.join(', '));
if (ohneTitelbild.length) console.log('  Kategorien ohne Titelbild: ' + ohneTitelbild.join(', '));

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
      console.log((ok ? '  ok      ' : '  FEHLER  ') + pfad + '  modus=' + (p.modus || '-') + '  id=' + (p.artikelId || '-'));
    } catch (e) {
      fehler++;
      console.log('  FEHLER  ' + pfad + '  ' + e.message);
    }
  }
  console.log(fehler ? fehler + ' Pfad(e) nicht kaufbar oder nicht erreichbar.' : 'Alle Pfade kaufbar.');
}
