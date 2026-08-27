/**
 * BRUECKEN-DEMO  --  Neues Frontend, altes Backend (matten.de)
 * ------------------------------------------------------------
 * Kleiner Node-Proxy ohne jede npm-Abhaengigkeit.
 * Start:  node server.mjs      ->  http://localhost:8787
 *
 * Der Proxy haelt pro Browser-Besucher eine eigene Upstream-Session
 * (PHPSESSID) und uebersetzt zwischen JSON (neues Frontend) und dem
 * Formular-/HTML-Dialekt des alten Shops.
 *
 * Warenkorb UND Bestellstrecke. Der finale Schritt ist bewusst hart
 * abgesichert: /api/kasse/bestellen verlangt { bestaetigung: "JA-BESTELLEN" },
 * und die Zahlungsarten von Worldline/Ogone (PayPal, Kreditkarte) werden
 * serverseitig abgelehnt -- bei Vorkasse und Rechnung fliesst kein Geld.
 *
 * DIE FACHLOGIK STEHT NICHT MEHR HIER, sondern in lib/bruecke.mjs.
 * Diese Datei ist nur noch die lokale Laufzeitumgebung: HTTP-Server,
 * Dateiauslieferung, Sitzungsspeicher im Arbeitsspeicher, Routing.
 * Dieselbe lib/ bedient auch build-katalog.mjs und die Netlify-Function --
 * es gibt bewusst keine zweite Abschrift der Regeln (siehe DEPLOY.md).
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

import * as KERN from './lib/bruecke.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const SHOP_DIR = path.join(PUBLIC_DIR, 'shop');

const PORTS = [8787, 8788, 8789];

/* Alles Fachliche kommt aus dem gemeinsamen Kern. Die Liste ist bewusst
   ausgeschrieben: so steht schwarz auf weiss, was dieser Server benutzt. */
const {
  ADDRESS_PATH, ADRESS_FELDER, BESTELL_BESTAETIGUNG, CART_PATH, DEMO, ORDER_PATH,
  SHOP_KATALOG_TTL_MS, UPSTREAM_ORIGIN, ZAHLUNGSARTEN_ERLAUBT, addToCart, addToCartPfad,
  baueRawHtml, bestellungAbschicken, blaettere, cartResponse, clearCart, decodeBody,
  diagnose, ensureUpstreamSession, fetchPrice, fetchPricePfad, holeArtikel, holeBild,
  holeKategorie, holeSuche, katalogMitCache, kaufformularAntwort, kontoLogin, kontoRegister,
  leseVorschau, normalisierePfad, normalisiereSprache, normalizeAttribut, nurText,
  parseAdressWerte, parseCookieHeader, parseKontoMenue, parseSelect, pruefeZahlungsart,
  readCart, readCartMitOptionen, reichereListeAn, setQuantity, setzeKasseOptionen,
  shopKatalogJs, shopKatalogStufe1, shopKatalogStufe2, speichereAdresse, upstream,
} = KERN;

/* ------------------------------------------------------------------ */
/* Session-Verwaltung                                                  */
/* ------------------------------------------------------------------ */

/** bridge_sid -> { cookies: Map<name, value>, created: number } */
const sessions = new Map();
const SESSION_TTL_MS = 1000 * 60 * 60 * 4; // 4 Stunden

function newSession() {
  const sid = crypto.randomBytes(16).toString('hex');
  sessions.set(sid, { cookies: new Map(), created: Date.now() });
  return sid;
}

function getSession(sid) {
  if (sid && sessions.has(sid)) {
    const s = sessions.get(sid);
    if (Date.now() - s.created < SESSION_TTL_MS) return { sid, session: s };
    sessions.delete(sid);
  }
  const fresh = newSession();
  return { sid: fresh, session: sessions.get(fresh) };
}

// Abgelaufene Sitzungen aktiv wegraeumen. Die TTL-Pruefung in getSession()
// greift nur, wenn jemand mit derselben sid wiederkommt -- verwaiste
// Eintraege blieben sonst bis zum Serverende liegen.
setInterval(() => {
  const now = Date.now();
  let entfernt = 0;
  for (const [key, value] of sessions) {
    if (now - value.created > SESSION_TTL_MS) {
      sessions.delete(key);
      entfernt += 1;
    }
  }
  if (entfernt) console.log(`  [sessions] ${entfernt} abgelaufene Sitzung(en) entfernt.`);
}, 10 * 60 * 1000).unref();

const shopKatalog = { daten: null, js: null, gebautAm: 0, bauLauf: null, stufe2Lauf: null, fehler: null };

async function shopKatalogBauen() {
  const t0 = Date.now();
  console.log('  [shop-katalog] Stufe 1: Kategoriebaum und Produktlisten werden gelesen ...');
  const daten = await shopKatalogStufe1();

  shopKatalog.daten = daten;
  shopKatalog.js = shopKatalogJs(daten);
  shopKatalog.gebautAm = Date.now();
  shopKatalog.fehler = null;
  console.log(
    `  [shop-katalog] Stufe 1 fertig: ${daten.categories.length} Kategorien, ` +
    `${daten.products.length} Produkte, ${Math.round((Date.now() - t0) / 1000)} s.`
  );

  if (!shopKatalog.stufe2Lauf) {
    shopKatalog.stufe2Lauf = shopKatalogStufe2(daten)
      .then(() => { shopKatalog.js = shopKatalogJs(daten); })
      .catch((err) => console.error('  [shop-katalog] Stufe 2 abgebrochen:', err.message))
      .finally(() => { shopKatalog.stufe2Lauf = null; });
  }
  return daten;
}

/**
 * Liefert den Katalog. Beim ersten Aufruf wird Stufe 1 abgewartet (rund 25
 * Upstream-Anfragen); ist eine Fassung da, geht sie SOFORT raus und ein
 * veralteter Stand wird im Hintergrund erneuert.
 */
async function shopKatalogHolen() {
  const veraltet = Date.now() - shopKatalog.gebautAm > SHOP_KATALOG_TTL_MS;

  if (!shopKatalog.daten) {
    if (!shopKatalog.bauLauf) {
      shopKatalog.bauLauf = shopKatalogBauen()
        .catch((err) => {
          shopKatalog.fehler = err && err.message ? err.message : String(err);
          console.error('  [shop-katalog] Aufbau fehlgeschlagen:', shopKatalog.fehler);
        })
        .finally(() => { shopKatalog.bauLauf = null; });
    }
    await shopKatalog.bauLauf;
  } else if (veraltet && !shopKatalog.bauLauf && !shopKatalog.stufe2Lauf) {
    shopKatalog.bauLauf = shopKatalogBauen()
      .catch((err) => console.error('  [shop-katalog] Neuaufbau fehlgeschlagen:', err.message))
      .finally(() => { shopKatalog.bauLauf = null; });
  }

  return shopKatalog;
}

/* ------------------------------------------------------------------ */
/* HTTP-Server                                                         */
/* ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function sendJson(res, status, obj, sid) {
  const body = JSON.stringify(obj);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  };
  if (sid) headers['Set-Cookie'] = `bridge_sid=${sid}; Path=/; HttpOnly; SameSite=Lax`;
  res.writeHead(status, headers);
  res.end(body);
}

function readJsonBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('Anfrage zu gross'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Ungueltiges JSON im Request-Body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Content-Type pruefen und JSON-Body lesen. Antwortet im Fehlerfall selbst
 * und gibt dann null zurueck -- der Aufrufer muss nur darauf pruefen.
 */
async function erwarteJson(req, res, sid) {
  const ct = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (ct !== 'application/json') {
    sendJson(res, 415, { ok: false, fehler: 'Bitte application/json senden.' }, sid);
    return null;
  }
  try {
    return await readJsonBody(req);
  } catch (err) {
    sendJson(res, 400, { ok: false, fehler: err.message }, sid);
    return null;
  }
}

function serveStatic(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Ungueltige Adresse');
    return;
  }

  // Null-Bytes wuerden fs.readFile werfen lassen -- und die Fehlermeldung
  // enthielte den absoluten Serverpfad. Also vorher abfangen.
  if (rel.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Ungueltige Adresse');
    return;
  }

  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.join(PUBLIC_DIR, path.normalize(rel).replace(/^([/\\])+/, ''));

  // Kein Ausbrechen aus public/. Der Trenner muss mitgeprueft werden,
  // sonst passierte ein Geschwisterordner "public-x" die Pruefung.
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Zugriff verweigert');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - Nicht gefunden');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

/**
 * Statische Dateien des Shop-Frontends unter /shop/.
 *
 * Eigener Handler statt serveStatic(), weil hier zwei Dinge dazukommen:
 * ein Verzeichnisaufruf muss auf index.html zeigen, und Schriften und
 * Layoutbilder duerfen laenger im Browser-Cache bleiben. Die Sicherheits-
 * regeln sind dieselben: kein Traversal, kein Null-Byte, Content-Type aus
 * der Endung, keine Sitzung fuer statische Dateien.
 */
function serveShop(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname.slice('/shop'.length));
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Ungueltige Adresse');
    return;
  }

  if (rel.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Ungueltige Adresse');
    return;
  }

  // /shop -> /shop/ , damit relative Verweise der Seiten stimmen.
  if (rel === '') {
    res.writeHead(302, { Location: '/shop/' });
    res.end();
    return;
  }
  if (rel.endsWith('/')) rel += 'index.html';

  const filePath = path.join(SHOP_DIR, path.normalize(rel).replace(/^([/\\])+/, ''));
  if (filePath !== SHOP_DIR && !filePath.startsWith(SHOP_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Zugriff verweigert');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - Nicht gefunden');
      return;
    }
    const endung = path.extname(filePath).toLowerCase();
    const langlebig = ['.woff2', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.svg'].includes(endung);
    res.writeHead(200, {
      'Content-Type': MIME[endung] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': langlebig ? 'public, max-age=3600' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') return res.end();
    res.end(data);
  });
}


/**
 * Bild-Proxy: holt Medien server-seitig von matten.de und reicht sie durch.
 * Damit baut der Browser des Besuchers wirklich keine einzige Verbindung
 * zum Altsystem auf -- auch nicht fuer Produktbilder.
 *
 * /api/img/bild/Bierbank_Pils.jpg  ->  https://matten.de/media/bild/...
 *
 * Die Pruefungen (Pfad-Allowlist, keine Redirects, Content-Type aus der
 * ANTWORT) stehen in holeBild() im gemeinsamen Kern -- die Netlify-Function
 * benutzt exakt dieselben. Hier bleibt nur das Antwortschreiben.
 */
async function serveImage(req, res, rawPath) {
  const bild = await holeBild(rawPath);

  if (!bild.ok) {
    res.writeHead(bild.status, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(bild.fehler);
  }

  res.writeHead(200, {
    'Content-Type': bild.contentType,
    'Content-Length': bild.buffer.length,
    'Cache-Control': 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') return res.end();
  res.end(bild.buffer);
}


/**
 * Reicht eine Rohantwort des Altsystems als Beweis durch. Der Umbau der
 * Seite (base-Tag, Banner, entschaerfte Formulare) steht als baueRawHtml()
 * im gemeinsamen Kern; hier bleibt nur das Antwortschreiben.
 */
function sendRawHtml(res, rohHtml, sid, hinweis) {
  const buf = Buffer.from(baueRawHtml(rohHtml, hinweis), 'utf8');
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (sid) headers['Set-Cookie'] = `bridge_sid=${sid}; Path=/; HttpOnly; SameSite=Lax`;
  res.writeHead(200, headers);
  res.end(buf);
}

/**
 * Nur gleiche Herkunft zulassen. Die Regel selbst steht im gemeinsamen Kern
 * (isSameOrigin); hier wird nur gesagt, unter welchem Hostnamen dieser Server
 * erreichbar ist -- lokal ist das schlicht der Host-Header.
 */
function istGleicheHerkunft(req) {
  return KERN.isSameOrigin(req.headers, [req.headers.host]);
}


const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;
  const isApi = pathname.startsWith('/api/');
  // Bilder laufen zwar unter /api/, brauchen aber keine Warenkorb-Sitzung
  // (serveImage nutzt eine Wegwerf-Session und gibt nie eine sid zurueck).
  // Ohne diese Ausnahme erzeugte jede cookielose Bildanfrage eine Waise.
  //
  // Dasselbe gilt fuer die Katalog-Endpunkte: sie lesen ausschliesslich
  // besucherunabhaengige Seiten ueber die gemeinsame Katalog-Sitzung. Eine
  // eigene Besucher-Sitzung waere fuer sie nicht nur nutzlos, sie wuerde
  // beim Durchblaettern eines Katalogs im Minutentakt Waisen anlegen.
  const KATALOG_PFADE = ['/api/katalog', '/api/kategorie', '/api/produkt', '/api/suche'];
  const istKatalog = KATALOG_PFADE.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const needsSession = isApi && !pathname.startsWith('/api/img/') && !istKatalog;

  console.log(`[${new Date().toLocaleTimeString('de-DE')}] ${req.method} ${pathname}`);

  // Sessions gibt es nur fuer API-Aufrufe. Statische Dateien duerfen die
  // Session-Map nicht aufblaehen (jede Anfrage ohne Cookie legte sonst
  // einen Eintrag an, den niemand je wieder abholt).
  let sid = null;
  let session = null;
  if (isApi) {
    if (!istGleicheHerkunft(req)) {
      return sendJson(res, 403, { ok: false, fehler: 'Nur von dieser Seite aus erlaubt.' });
    }
    if (needsSession) {
      ({ sid, session } = getSession(parseCookieHeader(req.headers.cookie || '').bridge_sid));
    }
  }

  try {
    /* --- API ------------------------------------------------------ */
    if (pathname === '/api/cart/add' && req.method === 'POST') {
      const ct = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (ct !== 'application/json') {
        return sendJson(res, 415, { ok: false, fehler: 'Bitte application/json senden.' }, sid);
      }
      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        return sendJson(res, 400, { ok: false, fehler: err.message }, sid);
      }

      const anzahl = Math.max(1, Math.min(999, Number(body.anzahl) || 1));
      const kommentar = (nurText(body.kommentar) ?? '').slice(0, 500);

      /* Weg A -- beliebiger Katalogartikel ueber seinen Pfad.
         Der Feldsatz kommt aus dem Kaufformular der Live-Seite; der Aufrufer
         darf nur Werte fuer Felder setzen, die es dort wirklich gibt. */
      if (body.pfad !== undefined) {
        const pfad = normalisierePfad(body.pfad);
        if (!pfad) {
          return sendJson(res, 400, {
            ok: false,
            fehler: 'Ungueltiger Produktpfad, z. B. /logomatten/bierbankmatten/6303041',
          }, sid);
        }
        const r = await addToCartPfad(session, pfad, { anzahl, kommentar, werte: body.werte });
        if (!r.ok) {
          return sendJson(res, 404, { ok: false, pfad, fehler: r.fehler, upstream: r.logs }, sid);
        }
        return sendJson(res, 200, cartResponse(r.cart, r.logs, {
          hinzugefuegt: { pfad, artikelId: r.artikelId, anzahl, modus: r.modus },
          gesendet: r.gesendet,
          abgelehnt: r.abgelehnt,
        }), sid);
      }

      /* Weg B -- der urspruengliche Demo-Artikel 278 mit genau einem Attribut.
         Bleibt unveraendert, damit public/index.html weiterhin funktioniert. */
      const attribut = normalizeAttribut(body.attribut);
      const artikel = Number(body.artikel) || DEMO.artikel;
      const { cart, logs } = await addToCart(session, { artikel, anzahl, attribut, kommentar });
      return sendJson(res, 200, cartResponse(cart, logs, { hinzugefuegt: { artikel, anzahl, attribut } }), sid);
    }

    // Menge einer Warenkorbposition setzen. 0 entfernt die Position -- so
    // macht es auch das Formular des Altsystems.
    if (pathname === '/api/cart/menge' && req.method === 'POST') {
      const body = await erwarteJson(req, res, sid);
      if (body === null) return;

      const key = nurText(body.key);
      if (!key || !/^[A-Za-z0-9_.:-]{4,80}$/.test(key)) {
        return sendJson(res, 400, {
          ok: false,
          fehler: 'Bitte den "key" der Position aus /api/cart uebergeben.',
        }, sid);
      }
      const roh = Number(body.anzahl);
      if (!Number.isFinite(roh) || roh < 0 || roh > 999) {
        return sendJson(res, 400, { ok: false, fehler: 'Anzahl muss zwischen 0 und 999 liegen.' }, sid);
      }
      const anzahl = Math.trunc(roh);

      const logs = await ensureUpstreamSession(session);
      const r = await setQuantity(session, key, anzahl);
      return sendJson(res, 200, cartResponse(r.cart, [...logs, ...r.logs], {
        gesetzt: { key, anzahl },
      }), sid);
    }

    if (pathname === '/api/cart' && req.method === 'GET') {
      const { cart, logs } = await readCart(session);
      return sendJson(res, 200, cartResponse(cart, logs), sid);
    }

    // Beweis-Endpunkt: liefert die ROHE Warenkorb-Seite, die matten.de fuer
    // diese Sitzung zurueckgibt - unveraendert, nur mit <base>, damit CSS und
    // Bilder vom Altsystem laden. Wer das im Browser oeffnet, sieht die
    // Original-Warenkorbseite des alten Shops mit den hier gelegten Artikeln.
    if (pathname === '/api/cart/raw' && req.method === 'GET') {
      await ensureUpstreamSession(session);
      const up = await upstream('GET', `${UPSTREAM_ORIGIN}${CART_PATH}`, { session });
      return sendRawHtml(
        res, decodeBody(up.buffer), sid,
        'ROHANTWORT von matten.de' + CART_PATH + ' fuer die Proxy-Sitzung &mdash; ' +
        'unveraendert durchgereicht, nichts von uns gerendert.'
      );
    }

    if (pathname === '/api/cart/clear' && req.method === 'POST') {
      const { cart, logs } = await clearCart(session);
      return sendJson(res, 200, cartResponse(cart, logs), sid);
    }

    /* --- Kundenkonto ---------------------------------------------- */

    if (pathname === '/api/konto' && req.method === 'GET') {
      // /adresse zeigt Kopfmenue UND die gespeicherte Adresse in einem Rutsch.
      // Leitet die Seite um (leerer Warenkorb), reicht die Warenkorbseite.
      let logs = await ensureUpstreamSession(session);
      const probe = await upstream('GET', `${UPSTREAM_ORIGIN}${ADDRESS_PATH}`, {
        session, maxRedirects: 0,
      });
      logs = [...logs, ...probe.logs];

      if (probe.status === 200) {
        const html = decodeBody(probe.buffer);
        const konto = parseKontoMenue(html);
        return sendJson(res, 200, {
          ok: true,
          eingeloggt: konto.eingeloggt,
          hinweis: konto.hinweis,
          kontoMenue: konto.menue,
          adresse: parseAdressWerte(html),
          laender: parseSelect(html, 'adress[land]').optionen,
          felder: ADRESS_FELDER,
          upstream: logs,
        }, sid);
      }

      const wk = await upstream('GET', `${UPSTREAM_ORIGIN}${CART_PATH}`, { session });
      logs = [...logs, ...wk.logs];
      const konto = parseKontoMenue(decodeBody(wk.buffer));
      return sendJson(res, 200, {
        ok: true,
        eingeloggt: konto.eingeloggt,
        hinweis: konto.hinweis,
        kontoMenue: konto.menue,
        adresse: null,
        laender: [],
        felder: ADRESS_FELDER,
        upstream: logs,
      }, sid);
    }

    if (pathname === '/api/konto/login' && req.method === 'POST') {
      const body = await erwarteJson(req, res, sid);
      if (body === null) return;
      const email = (nurText(body.email) ?? '').trim().slice(0, 200);
      const passwort = (nurText(body.passwort) ?? '').slice(0, 200);
      if (!email || !passwort) {
        return sendJson(res, 400, {
          ok: false, eingeloggt: false,
          fehler: 'Bitte E-Mail-Adresse und Passwort angeben.',
        }, sid);
      }
      const r = await kontoLogin(session, email, passwort);
      return sendJson(res, 200, {
        ok: r.eingeloggt,
        eingeloggt: r.eingeloggt,
        name: r.eingeloggt ? (r.konto.menue[0]?.text ?? null) : null,
        kontoMenue: r.konto.menue,
        hinweis: r.konto.hinweis,
        fehler: r.fehler,
        upstream: r.logs,
      }, sid);
    }

    if (pathname === '/api/konto/register' && req.method === 'POST') {
      const body = await erwarteJson(req, res, sid);
      if (body === null) return;
      const r = await kontoRegister(session, body);
      return sendJson(res, r.moeglich ? 200 : 501, {
        ok: r.ok,
        moeglich: r.moeglich,
        felder: r.felder,
        fehler: r.fehler,
        seiteninhalt: r.seiteninhalt,
        upstream: r.logs,
      }, sid);
    }

    /* --- Kasse ------------------------------------------------------ */

    if (pathname === '/api/kasse/formular' && req.method === 'GET') {
      const stand = await readCartMitOptionen(session);
      let logs = stand.logs;
      let laender = [];
      let werte = null;

      const adr = await upstream('GET', `${UPSTREAM_ORIGIN}${ADDRESS_PATH}`, {
        session, maxRedirects: 0,
      });
      logs = [...logs, ...adr.logs];
      if (adr.status === 200) {
        const html = decodeBody(adr.buffer);
        laender = parseSelect(html, 'adress[land]').optionen;
        werte = parseAdressWerte(html);
      }

      return sendJson(res, 200, {
        ok: true,
        warenkorb: cartResponse(stand.cart, []),
        optionen: stand.optionen,
        konto: stand.konto,
        adressfelder: ADRESS_FELDER,
        laender,
        adresse: werte,
        upstream: logs,
      }, sid);
    }

    if (pathname === '/api/kasse/optionen' && req.method === 'POST') {
      const body = await erwarteJson(req, res, sid);
      if (body === null) return;

      // Erst der Typ, dann der Inhalt. Ohne diese Pruefung liefe ein
      // Objekt mit eigener toString() in eine Ausnahme -- und die generische
      // Fehlerbehandlung meldete faelschlich "Altsystem nicht erreichbar",
      // obwohl matten.de nie kontaktiert wurde.
      const zahlungsartRoh = nurText(body.zahlungsart);
      if (zahlungsartRoh === null) {
        return sendJson(res, 400, {
          ok: false,
          fehler: 'Feld "zahlungsart" muss eine Zeichenkette sein.',
          erlaubt: [...ZAHLUNGSARTEN_ERLAUBT],
        }, sid);
      }
      const zahlungsart = zahlungsartRoh.trim();
      const verboten = pruefeZahlungsart(zahlungsart);
      if (verboten) {
        // Wichtig: Ablehnung VOR jedem Upstream-Aufruf. Die Zahlungsart darf
        // gar nicht erst in die Sitzung des Altsystems gelangen.
        return sendJson(res, 400, {
          ok: false,
          fehler: verboten,
          erlaubt: [...ZAHLUNGSARTEN_ERLAUBT],
        }, sid);
      }

      const landRoh = body.land === undefined ? 'de' : nurText(body.land);
      const versandartRoh = nurText(body.versandart);
      if (landRoh === null || versandartRoh === null) {
        return sendJson(res, 400, {
          ok: false,
          fehler: 'Die Felder "land" und "versandart" muessen Zeichenketten sein.',
        }, sid);
      }
      const land = landRoh.trim().slice(0, 10);
      const versandart = versandartRoh.trim().slice(0, 10);
      if (!/^[A-Za-z]{2,5}$/.test(land)) {
        return sendJson(res, 400, { ok: false, fehler: 'Ungueltiges Land.' }, sid);
      }
      if (!/^\d{1,4}$/.test(versandart)) {
        return sendJson(res, 400, { ok: false, fehler: 'Ungueltige Versandart.' }, sid);
      }

      const r = await setzeKasseOptionen(session, { land, versandart, zahlungsart });
      return sendJson(res, 200, cartResponse(r.cart, r.logs, {
        optionen: r.optionen,
        gesendet: r.gesendet,
      }), sid);
    }

    if (pathname === '/api/kasse/adresse' && req.method === 'POST') {
      const body = await erwarteJson(req, res, sid);
      if (body === null) return;
      const r = await speichereAdresse(session, body);
      return sendJson(res, r.gespeichert ? 200 : 422, {
        ok: r.gespeichert,
        gespeichert: r.gespeichert,
        fehler: r.fehler,
        gesendet: r.gesendet,
        upstream: r.logs,
      }, sid);
    }

    if (pathname === '/api/kasse/vorschau' && req.method === 'GET') {
      const v = await leseVorschau(session);
      return sendJson(res, 200, { ok: true, ...v }, sid);
    }

    if (pathname === '/api/kasse/bestellen' && req.method === 'POST') {
      const body = await erwarteJson(req, res, sid);
      if (body === null) return;

      // Schutz gegen versehentliches Ausloesen: ohne dieses Wort passiert
      // nichts. Verglichen wird streng gegen den Rohwert -- ein Array
      // ["JA-BESTELLEN"] wuerde ueber String() sonst durchrutschen.
      if (body.bestaetigung !== BESTELL_BESTAETIGUNG) {
        return sendJson(res, 400, {
          ok: false,
          fehler: `Fehlende Bestaetigung. Dieser Endpunkt loest eine ECHTE Bestellung im ` +
            `Live-System aus und verlangt darum { "bestaetigung": "${BESTELL_BESTAETIGUNG}" } im Body.`,
          erwartet: { bestaetigung: BESTELL_BESTAETIGUNG },
        }, sid);
      }

      // Zweite Sperre: die im Altsystem tatsaechlich gesetzte Zahlungsart.
      const stand = await readCartMitOptionen(session);
      const verboten = pruefeZahlungsart(stand.optionen.zahlungsart.gewaehlt);
      if (verboten) {
        return sendJson(res, 400, {
          ok: false, fehler: verboten, upstream: stand.logs,
        }, sid);
      }

      // Der eben gelesene Stand wird weitergereicht, statt die Warenkorbseite
      // gleich noch einmal zu holen. Geprueft wird dasselbe, nur einmal statt
      // zweimal gelesen -- siehe leseVorschau().
      const r = await bestellungAbschicken(session, { vorabStand: stand });
      if (!r.ok && r.huerden) {
        return sendJson(res, 409, {
          ok: false,
          fehler: 'Der Bestellabschluss ist noch nicht moeglich.',
          huerden: r.huerden,
          upstream: r.logs,
        }, sid);
      }
      return sendJson(res, 200, {
        ok: r.ok,
        bestellnummer: r.bestellnummer,
        status: r.status,
        finalUrl: r.finalUrl,
        rohantwort: r.rohantwort,
        gesendet: r.vorschau.finalRequest,
        upstream: r.logs,
      }, sid);
    }

    // Beweis-Endpunkt der Bestellstrecke: die rohe Antwortseite des
    // Altsystems nach dem Bestellvorgang. Solange nichts bestellt wurde,
    // wird stattdessen die aktuelle Uebersichtsseite ausgeliefert.
    if (pathname === '/api/kasse/raw' && req.method === 'GET') {
      if (session.bestellAntwort) {
        return sendRawHtml(
          res, session.bestellAntwort.html, sid,
          'ROHANTWORT von matten.de nach dem Bestellvorgang (' +
          new Date(session.bestellAntwort.zeit).toLocaleString('de-DE') +
          ') &mdash; unveraendert durchgereicht, nichts von uns gerendert.'
        );
      }
      const logs = await ensureUpstreamSession(session);
      const up = await upstream('GET', `${UPSTREAM_ORIGIN}${ORDER_PATH}`, { session });
      logs.push(...up.logs);
      return sendRawHtml(
        res, decodeBody(up.buffer), sid,
        'Noch nichts bestellt. Dies ist die ROHANTWORT von matten.de' + ORDER_PATH +
        ' &mdash; die Uebersichtsseite vor dem Absenden.'
      );
    }

    if (pathname === '/api/price' && req.method === 'GET') {
      const anzahl = Math.max(1, Math.min(999, Number(url.searchParams.get('anzahl')) || 1));

      /* Weg A -- Live-Preis eines beliebigen Katalogartikels.
         Attribute werden als eigene Parameter uebergeben, genau so, wie sie
         im Kaufformular heissen:
           /api/price?pfad=/…/6303041&anzahl=2&attribute[Individuelle Bedruckung]=nein */
      const pfadRoh = url.searchParams.get('pfad');
      if (pfadRoh !== null) {
        const pfad = normalisierePfad(pfadRoh);
        if (!pfad) {
          return sendJson(res, 400, { ok: false, fehler: 'Ungueltiger Produktpfad.' }, sid);
        }
        const paare = [];
        for (const [name, wert] of url.searchParams) {
          if (name.startsWith('attribute[') || name.startsWith('spezialoption[')) {
            paare.push([name, String(wert).slice(0, 200)]);
          }
        }
        const r = await fetchPricePfad(session, pfad, anzahl, paare);
        if (r.fehler) {
          return sendJson(res, 404, { ok: false, pfad, fehler: r.fehler, upstream: r.logs || [] }, sid);
        }
        const preis = r.json?.prices?.[0] || null;
        return sendJson(res, 200, {
          ok: r.ok,
          pfad,
          artikelId: r.artikelId,
          anzahl,
          uebernommen: r.uebernommen,
          abgelehnt: r.abgelehnt,
          preis: preis?.preis ?? null,
          preisText: preis?.preis != null ? preis.preis : null,
          grundpreis: preis?.grundpreis ?? null,
          attributepreis: preis?.attributepreis ?? null,
          versand: preis?.versand ?? null,
          brutto: preis?.brutto ?? null,
          gesamt: preis?.preis != null ? Number((preis.preis * anzahl).toFixed(2)) : null,
          raw: r.json,
          upstream: r.logs,
        }, sid);
      }

      /* Weg B -- der urspruengliche Demo-Artikel. Unveraendert. */
      const attribut = normalizeAttribut(url.searchParams.get('attribut'));
      const { json, logs } = await fetchPrice(session, anzahl, attribut);
      const p = json?.prices?.[0] || null;
      return sendJson(
        res,
        200,
        {
          ok: !json?.error,
          anzahl,
          attribut,
          preis: p?.preis ?? null,
          grundpreis: p?.grundpreis ?? null,
          attributepreis: p?.attributepreis ?? null,
          versand: p?.versand ?? null,
          brutto: p?.brutto ?? null,
          gesamt: p?.preis != null ? Number((p.preis * anzahl).toFixed(2)) : null,
          raw: json,
          upstream: logs,
        },
        sid
      );
    }

    /* --- Katalog ---------------------------------------------------- */

    // Kategoriebaum. Eine Anfrage an die Startseite liefert die Struktur,
    // je eine weitere die Produktzahl einer Kategorie. Zwischengespeichert
    // fuer zehn Minuten, ?zaehlen=0 laesst die Zaehlung weg (dann eine
    // einzige Upstream-Anfrage), ?frisch=1 umgeht den Zwischenspeicher.
    if (pathname === '/api/katalog' && req.method === 'GET') {
      const sprache = normalisiereSprache(url.searchParams.get('sprache'));
      const zaehlen = url.searchParams.get('zaehlen') !== '0';
      const frisch = url.searchParams.get('frisch') === '1';
      const katalog = await katalogMitCache({ zaehlen, sprache, frisch });
      return sendJson(res, 200, { ok: true, sprache: sprache || 'de', ...katalog }, sid);
    }

    // Diagnose: wie gut laesst sich der Katalog gerade parsen? Prueft den
    // Baum und eine gleichmaessig ueber den Katalog verteilte Stichprobe
    // von Artikelseiten.
    if (pathname === '/api/katalog/diagnose' && req.method === 'GET') {
      const sprache = normalisiereSprache(url.searchParams.get('sprache'));
      const gewuenscht = Number(url.searchParams.get('stichprobe'));
      const stichprobe = Math.max(1, Math.min(120, Number.isFinite(gewuenscht) && gewuenscht > 0 ? gewuenscht : 25));
      const bericht = await diagnose({ stichprobe, sprache });
      return sendJson(res, 200, { ok: true, ...bericht }, sid);
    }

    // Produktliste einer Kategorie. ?details=1 holt je Produkt der
    // ANGEZEIGTEN Seite zusaetzlich die Artikelseite (Preis, interne ID,
    // Varianten) -- das kostet je Produkt eine Anfrage an das Altsystem.
    if (pathname === '/api/kategorie' && req.method === 'GET') {
      const pfad = normalisierePfad(url.searchParams.get('pfad'));
      if (!pfad) {
        return sendJson(res, 400, {
          ok: false,
          fehler: 'Bitte einen Kategoriepfad angeben, z. B. ?pfad=/logomatten/bierbankmatten',
        }, sid);
      }
      const sprache = normalisiereSprache(url.searchParams.get('sprache'));
      const r = await holeKategorie(pfad, { sprache, frisch: url.searchParams.get('frisch') === '1' });
      if (!r.ok) {
        return sendJson(res, 404, { ok: false, pfad, fehler: r.grund, upstream: r.upstream || [] }, sid);
      }

      const { ausschnitt, blaetterung } = blaettere(
        r.produkte, url.searchParams.get('seite'), url.searchParams.get('proSeite')
      );
      let produkte = ausschnitt;
      let logs = r.upstream || [];
      if (url.searchParams.get('details') === '1') {
        const angereichert = await reichereListeAn(ausschnitt, { sprache });
        produkte = angereichert.produkte;
        logs = [...logs, ...angereichert.upstream];
      }

      return sendJson(res, 200, {
        ok: true,
        pfad,
        name: r.titel ? r.titel.split(',')[0].trim() : null,
        titel: r.titel,
        einleitung: r.einleitung,
        sprache: sprache || 'de',
        gecacht: Boolean(r.gecacht),
        details: url.searchParams.get('details') === '1',
        ...blaetterung,
        hinweis:
          'Grundpreis, interne Artikel-ID und Varianten stehen NICHT in der Kategorieliste ' +
          'des Altsystems. Sie kommen nur mit ?details=1 (eine Anfrage je Produkt).',
        produkte,
        upstream: logs,
      }, sid);
    }

    // Detaildaten eines Produkts inklusive vollstaendigem Kaufformular.
    if (pathname === '/api/produkt' && req.method === 'GET') {
      const pfad = normalisierePfad(url.searchParams.get('pfad'));
      if (!pfad) {
        return sendJson(res, 400, {
          ok: false,
          fehler: 'Bitte einen Produktpfad angeben, z. B. ?pfad=/logomatten/bierbankmatten/6303041',
        }, sid);
      }
      const sprache = normalisiereSprache(url.searchParams.get('sprache'));
      const r = await holeArtikel(pfad, { sprache, frisch: url.searchParams.get('frisch') === '1' });
      if (!r.ok) {
        return sendJson(res, 404, { ok: false, pfad, fehler: r.grund, upstream: r.upstream || [] }, sid);
      }

      const a = r.artikel;
      return sendJson(res, 200, {
        ok: true,
        sprache: sprache || 'de',
        gecacht: Boolean(r.gecacht),
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
          beschreibung: a.beschreibung,
          beschreibungAbsaetze: a.beschreibungAbsaetze,
          preis: a.preis,
          verfuegbarkeit: a.verfuegbarkeit,
          attribute: a.attribute,
          masse: a.masse,
          technischeDaten: a.technischeDaten,
          sprachen: a.sprachen,
        },
        kaufformular: kaufformularAntwort(a),
        upstream: r.upstream || [],
      }, sid);
    }

    // Suche des Altsystems. Ohne Suchwort liefert der Shop den kompletten
    // Katalog (rund 1,2 MB) -- das gibt es hier nur mit ?alle=1.
    if (pathname === '/api/suche' && req.method === 'GET') {
      const alle = url.searchParams.get('alle') === '1';
      const q = (nurText(url.searchParams.get('q')) ?? '').trim().slice(0, 100);
      if (!alle && q.length < 2) {
        return sendJson(res, 400, {
          ok: false,
          fehler: 'Bitte mindestens zwei Zeichen suchen (?q=...) oder mit ?alle=1 den gesamten Katalog anfordern.',
        }, sid);
      }
      const sprache = normalisiereSprache(url.searchParams.get('sprache'));
      const r = await holeSuche(alle && !q ? '' : q, {
        sprache, frisch: url.searchParams.get('frisch') === '1',
      });
      if (!r.ok) {
        return sendJson(res, 502, { ok: false, q, fehler: r.grund, upstream: r.upstream || [] }, sid);
      }

      const { ausschnitt, blaetterung } = blaettere(
        r.produkte, url.searchParams.get('seite'), url.searchParams.get('proSeite')
      );
      return sendJson(res, 200, {
        ok: true,
        q,
        sprache: sprache || 'de',
        gecacht: Boolean(r.gecacht),
        gemeldeteTreffer: r.gemeldeteTreffer,
        ...blaetterung,
        hinweis:
          'Die Suche des Altsystems durchsucht Namen UND Beschreibungstexte und verknuepft ' +
          'mehrere Woerter mit ODER. Sie kennt keine Blaetterung -- die hier ist unsere eigene.',
        produkte: ausschnitt,
        upstream: r.upstream || [],
      }, sid);
    }

    // Bilder laufen ueber den Proxy, damit der Browser wirklich nie eine
    // Verbindung zu matten.de aufbaut -- genau das behauptet die Seite.
    if (pathname.startsWith('/api/img/') && (req.method === 'GET' || req.method === 'HEAD')) {
      return await serveImage(req, res, pathname.slice('/api/img/'.length));
    }

    if (isApi) {
      return sendJson(res, 404, { ok: false, fehler: 'Unbekannter Endpunkt' }, sid);
    }

    /* --- Shop-Frontend --------------------------------------------- */

    /*
     * Der Live-Katalog. Er ersetzt die statische assets/js/catalog.js des
     * Designs, ohne dass in den 19 HTML-Seiten eine Zeile geaendert werden
     * musste -- der <script src="assets/js/catalog.js"> zeigt einfach hierher.
     */
    if (pathname === '/shop/assets/js/catalog.js' && (req.method === 'GET' || req.method === 'HEAD')) {
      const stand = await shopKatalogHolen();
      const text = stand.js || [
        '/* Der Live-Katalog konnte nicht aufgebaut werden. */',
        'window.CATALOG = {"categories":[],"products":[]};',
        'window.CATALOG_META = ' + JSON.stringify({
          fehler: stand.fehler || 'Das Altsystem war beim Aufbau nicht erreichbar.',
          hinweis: 'Die Seiten bleiben bedienbar, zeigen aber keine Produkte. ' +
            'Server neu starten oder /shop/assets/js/catalog.js erneut aufrufen.',
        }) + ';',
        '',
      ].join('\n');
      const buf = Buffer.from(text, 'utf8');
      res.writeHead(stand.js ? 200 : 503, {
        'Content-Type': 'text/javascript; charset=utf-8',
        'Content-Length': buf.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      if (req.method === 'HEAD') return res.end();
      return res.end(buf);
    }

    if ((pathname === '/shop' || pathname.startsWith('/shop/')) &&
        (req.method === 'GET' || req.method === 'HEAD')) {
      return serveShop(req, res, pathname);
    }

    /* --- Statische Dateien ---------------------------------------- */
    if (req.method === 'GET' || req.method === 'HEAD') {
      return serveStatic(req, res, pathname);
    }

    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Methode nicht erlaubt');
  } catch (err) {
    // Details nur in die Serverkonsole. Im Body stehen keine Pfade o. Ae.,
    // sonst verraet ein Fehlerfall die Verzeichnisstruktur nach aussen.
    console.error('  [fehler]', err && err.stack ? err.stack : err);
    if (res.headersSent) return res.end();
    if (isApi) {
      return sendJson(
        res,
        502,
        { ok: false, fehler: 'Das Altsystem war nicht erreichbar oder hat unerwartet geantwortet.' },
        sid
      );
    }
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Interner Fehler');
  }
});

/* --- Port waehlen ---------------------------------------------------- */

function listen(idx = 0) {
  if (idx >= PORTS.length) {
    console.error(`Keiner der Ports ${PORTS.join(', ')} ist frei. Bitte belegende Programme beenden.`);
    process.exit(1);
  }
  const port = PORTS[idx];

  // Wichtig: kein listen(port, cb). Der Callback eines fehlgeschlagenen
  // Versuchs bliebe sonst als 'listening'-Listener haengen und wuerde beim
  // naechsten Versuch mitfeuern -- Banner doppelt, falscher Port. Darum
  // beide Handler benennen und beim Weiterschalten sauber abmelden.
  const onError = (err) => {
    server.removeListener('listening', onListening);
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} ist belegt - versuche ${PORTS[idx + 1] ?? '(keinen weiteren)'} ...`);
      listen(idx + 1);
    } else {
      console.error('Serverfehler:', err.message);
      process.exit(1);
    }
  };

  const onListening = () => {
    server.removeListener('error', onError);
    const actual = server.address().port;
    console.log('');
    console.log('  ===================================================');
    console.log('   BRUECKEN-DEMO  -  neues Frontend, altes Backend');
    console.log('  ===================================================');
    console.log(`   Laeuft auf:  http://localhost:${actual}`);
    console.log(`   Shop-Demo:   http://localhost:${actual}/shop/`);
    console.log(`   Upstream:    ${UPSTREAM_ORIGIN}`);
    console.log('   Beenden mit: Strg + C');
    console.log('');
    console.log('   Jede Anfrage an matten.de wird hier protokolliert:');
    console.log('');
  };

  server.once('error', onError);
  server.once('listening', onListening);
  // Nur lokal erreichbar -- der Proxy haelt fremde Warenkorb-Sitzungen und
  // hat im Netz nichts verloren.
  server.listen(port, '127.0.0.1');
}

listen();

process.on('SIGINT', () => {
  console.log('\n  Server beendet. Auf Wiedersehen.');
  process.exit(0);
});
