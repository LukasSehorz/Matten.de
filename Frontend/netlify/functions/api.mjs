/**
 * NETLIFY-FUNCTION  --  alle /api/-Endpunkte der Bruecken-Demo
 * ============================================================
 *
 * Dieselbe Fachlogik wie der lokale Server: beide importieren
 * bridge-demo/lib/bruecke.mjs. Was hier steht, ist ausschliesslich das,
 * was sich zwischen "ein Node-Prozess, der laeuft" und "eine Function, die
 * pro Anfrage neu gestartet werden kann" unterscheidet.
 *
 * Und das ist genau EIN Ding: DER SPEICHER IST WEG.
 * -------------------------------------------------
 * Der lokale Server haelt eine Map: bridge_sid -> Upstream-Cookies. Auf
 * Netlify laeuft jede Anfrage moeglicherweise in einer anderen Instanz, oft
 * sogar in einer anderen Weltgegend. Eine Map im Arbeitsspeicher waere
 * schlimmer als nutzlos: sie funktionierte manchmal.
 *
 * Loesung: die Upstream-Sitzung wandert in ein Cookie auf DIESER Domain.
 *
 *   Browser  --(Cookie mf_sid)-->  Function  --(Cookie PHPSESSID)-->  matten.de
 *   Browser  <--(Set-Cookie)-----  Function  <--(Set-Cookie)--------  matten.de
 *
 * Die Function haelt nichts fest. Sie liest die Sitzung aus der Anfrage,
 * reicht sie an matten.de weiter, nimmt den aktualisierten Stand entgegen
 * und gibt ihn dem Browser zurueck. Damit hat jeder Besucher seinen eigenen
 * Warenkorb, ohne dass irgendwo ein Zustand liegt.
 *
 * Das Cookie ist HttpOnly (kein Skript kommt heran), SameSite=Lax (nicht bei
 * fremden Aufrufen mitgeschickt), Path=/ und Secure, sobald die Anfrage ueber
 * https kam.
 *
 * Vorgebaut statt live
 * --------------------
 * /api/katalog, /api/kategorie, /api/produkt und /api/suche lesen die beim
 * Build erzeugten Daten. Live gebaut kostet der Katalog rund 390 Anfragen und
 * drei Minuten; eine Function darf zehn Sekunden. Alles Uebrige --
 * /api/price, /api/cart/*, /api/kasse/*, /api/konto/*, /api/img/* -- spricht
 * unveraendert live mit matten.de.
 *
 * Alle Sicherheitsmerkmale bleiben. Sie stehen im gemeinsamen Kern und
 * gelten deshalb hier zwangslaeufig genauso: Host-Bindung auf matten.de
 * (auch ueber Umleitungen), Allowlist der Zahlungsarten, die strenge
 * Bestaetigungspruefung ohne Typkoerzierung, Content-Type-Pflicht,
 * Bildproxy mit Pfad-Allowlist und Content-Type aus der Antwort.
 */

import * as KERN from '../../bridge-demo/lib/bruecke.mjs';
// Eine Ebene hoeher, NICHT in functions/: aus jeder Datei dort macht Netlify
// einen eigenen Endpunkt. Der Bundler zieht sie ueber diesen Import mit herein.
import { KATALOG_DATEN } from '../katalog-daten.mjs';

const {
  ADDRESS_PATH, ADRESS_FELDER, BESTELL_BESTAETIGUNG, CART_PATH, ORDER_PATH,
  UPSTREAM_ORIGIN, ZAHLUNGSARTEN_ERLAUBT,
  addToCart, addToCartPfad, baueRawHtml, bestellungAbschicken, blaettere,
  cartResponse, clearCart, decodeBody, ensureUpstreamSession, fetchPrice,
  fetchPricePfad, holeBild, kontoLogin, kontoRegister, leseVorschau,
  normalisierePfad, normalizeAttribut, nurText, parseAdressWerte,
  parseCookieHeader, parseKontoMenue, parseSelect, pfadSchluessel,
  pruefeZahlungsart, readCart, readCartMitOptionen, setQuantity,
  setzeKasseOptionen, speichereAdresse, upstream,
} = KERN;

/* ================================================================== */
/* Die Sitzung im Cookie                                               */
/* ================================================================== */

/**
 * Name des Cookies auf DIESER Domain. Bewusst nicht "PHPSESSID": das hier
 * ist nicht unsere PHP-Sitzung, sondern der Ausweis, mit dem wir bei
 * matten.de auftreten. Ein eigener Name macht das beim Nachsehen im Browser
 * sofort klar und kann mit nichts kollidieren.
 */
const SITZUNGS_COOKIE = 'mf_sid';

/**
 * Obergrenze fuer den Cookie-Inhalt. Browser garantieren 4 KB pro Cookie;
 * matten.de setzt in der Praxis genau eines (PHPSESSID, 26 Zeichen). Wird es
 * je mehr, faellt es hier auf und wird nicht still abgeschnitten.
 */
const COOKIE_MAX = 3000;

/**
 * Baut aus dem Cookie der Anfrage die Upstream-Sitzung -- dasselbe Objekt
 * { cookies: Map, created }, das der lokale Server aus seiner Map holt. Ab
 * hier merkt keine einzige Funktion des Kerns einen Unterschied.
 *
 * Fail-closed: alles, was nicht wie ein Cookie-Paar aussieht, wird
 * verworfen. Ein manipuliertes Cookie darf hoechstens die eigene Sitzung
 * kaputtmachen -- niemals einen Header an matten.de schmuggeln.
 */
function sitzungAusAnfrage(cookieHeader) {
  const sitzung = KERN.neueSitzung();
  const roh = parseCookieHeader(cookieHeader || '')[SITZUNGS_COOKIE];
  if (!roh || roh.length > COOKIE_MAX) return sitzung;

  let paare;
  try {
    paare = JSON.parse(decodeURIComponent(roh));
  } catch {
    return sitzung;
  }
  if (!paare || typeof paare !== 'object' || Array.isArray(paare)) return sitzung;

  for (const [name, wert] of Object.entries(paare)) {
    // Genau der Zeichenvorrat, den ein Cookie-Name bzw. -Wert haben darf.
    // Ohne diese Pruefung koennte ein "; " im Wert einen zweiten Cookie-
    // Header bei matten.de erfinden (Header-Injection).
    if (typeof wert !== 'string') continue;
    if (!/^[A-Za-z0-9!#$%&'*+\-.^_`|~]{1,64}$/.test(name)) continue;
    if (!/^[A-Za-z0-9!#$%&'()*+\-./:<=>?@[\]^_`{|}~]{0,512}$/.test(wert)) continue;
    sitzung.cookies.set(name, wert);
  }
  return sitzung;
}

/**
 * Schreibt den Stand der Upstream-Sitzung zurueck ins Cookie -- aber nur,
 * wenn er sich geaendert hat. Sonst schickte jede Antwort ein Set-Cookie mit,
 * auch die auf reine Leseanfragen.
 */
function cookieFuerAntwort(sitzung, vorher, sicher) {
  const jetzt = {};
  for (const [k, v] of sitzung.cookies) jetzt[k] = v;

  const neu = encodeURIComponent(JSON.stringify(jetzt));
  if (neu === vorher) return null;
  if (neu.length > COOKIE_MAX) {
    console.error(`  [sitzung] Cookie waere ${neu.length} Zeichen gross -- nicht gesetzt.`);
    return null;
  }

  const teile = [
    `${SITZUNGS_COOKIE}=${neu}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    // Vier Stunden, wie die Sitzungsdauer des lokalen Servers.
    'Max-Age=14400',
  ];
  // Secure nur bei https. Auf einer Netlify-Domain ist das immer der Fall;
  // unter "netlify dev" (http://localhost:8888) waere ein Secure-Cookie
  // sonst nicht rueckuebertragbar und der Warenkorb bei jedem Aufruf leer.
  if (sicher) teile.push('Secure');
  return teile.join('; ');
}

/* ================================================================== */
/* Antworten                                                           */
/* ================================================================== */

/** Ein Zustand, den jeder Handler mitbekommt. Kein Modulzustand, kein Leck. */
function jsonAntwort(status, objekt, ctx) {
  const header = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
  const cookie = cookieFuerAntwort(ctx.sitzung, ctx.cookieVorher, ctx.sicher);
  if (cookie) header['Set-Cookie'] = cookie;
  return new Response(JSON.stringify(objekt), { status, headers: header });
}

function textAntwort(status, text) {
  return new Response(text, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function rohHtmlAntwort(rohHtml, hinweis, ctx) {
  const header = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  const cookie = cookieFuerAntwort(ctx.sitzung, ctx.cookieVorher, ctx.sicher);
  if (cookie) header['Set-Cookie'] = cookie;
  return new Response(baueRawHtml(rohHtml, hinweis), { status: 200, headers: header });
}

/**
 * Content-Type pruefen und JSON-Body lesen. Gibt bei einem Fehler die
 * fertige Antwort zurueck (im Feld `antwort`) statt zu werfen.
 */
async function erwarteJson(req, ctx) {
  const ct = String(req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (ct !== 'application/json') {
    return { antwort: jsonAntwort(415, { ok: false, fehler: 'Bitte application/json senden.' }, ctx) };
  }
  let roh;
  try {
    roh = await req.text();
  } catch {
    return { antwort: jsonAntwort(400, { ok: false, fehler: 'Anfrage nicht lesbar.' }, ctx) };
  }
  if (roh.length > 64 * 1024) {
    return { antwort: jsonAntwort(413, { ok: false, fehler: 'Anfrage zu gross' }, ctx) };
  }
  const text = roh.trim();
  if (!text) return { body: {} };
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { antwort: jsonAntwort(400, { ok: false, fehler: 'Ungueltiges JSON im Request-Body' }, ctx) };
  }
}

/* ================================================================== */
/* Vorgebaute Katalogdaten                                             */
/* ================================================================== */

const D = KATALOG_DATEN;

/** Kopfzeile, die in jeder Katalogantwort auf die Herkunft der Daten hinweist. */
const KATALOG_HERKUNFT = {
  vorgebaut: true,
  stand: D.stand,
  standText: D.standText,
  hinweis:
    'Diese Antwort kommt aus dem beim Build erzeugten Katalog, nicht aus einer ' +
    'Live-Abfrage von matten.de. Der Aufbau kostet rund 390 Anfragen und etwa drei ' +
    'Minuten -- eine Netlify Function darf zehn Sekunden laufen. Preise, Warenkorb, ' +
    'Kasse und Bilder sind davon nicht betroffen: die sind live.',
};

/** /api/produkt liefert die Absaetze als Liste; gespeichert ist nur der Text. */
function produktMitAbsaetzen(eintrag) {
  const p = eintrag.produkt;
  return {
    ...p,
    beschreibungAbsaetze: p.beschreibung ? p.beschreibung.split('\n') : [],
  };
}

/**
 * Suche auf den vorgebauten Daten.
 *
 * ACHTUNG, hier weicht die Netlify-Fassung wirklich ab: der lokale Server
 * reicht die Suche an /suche des Altsystems durch und bekommt dessen
 * Ergebnis. Hier wird auf der beim Build eingesammelten Gesamtliste gesucht.
 *
 * Nachgebaut ist vom Verhalten des Altsystems nur die ODER-Verknuepfung
 * mehrerer Woerter. Zwei Dinge sind ANDERS, und das ist kein Versehen:
 *
 *   1. Durchsucht werden Name, Artikelnummer und KURZbeschreibung -- also
 *      das, was in der Kategorieliste steht. Das Altsystem durchsucht den
 *      vollen Beschreibungstext. Treffer, die nur tief in einer langen
 *      Beschreibung stehen, fehlen hier deshalb.
 *   2. Die Rangfolge ist unsere eigene: Namenstreffer vor Artikelnummer vor
 *      Kurzbeschreibung. Wie das Altsystem sortiert, ist nicht bekannt.
 *
 * Beides steht auch im Feld `hinweis` der Antwort und in DEPLOY.md -- eine
 * Suche, die anders sucht als die gewohnte, muss das von sich aus sagen.
 */
function sucheVorgebaut(q) {
  const worte = q.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);
  if (!worte.length) return D.alleProdukte;

  const bewertet = [];
  for (const p of D.alleProdukte) {
    const name = String(p.name || p.nameGeerbt || '').toLowerCase();
    const nummer = String(p.artikelnummer || '').toLowerCase();
    const text = String(p.kurzbeschreibung || '').toLowerCase();
    let punkte = 0;
    for (const w of worte) {
      if (name.includes(w)) punkte += 3;
      else if (nummer.includes(w)) punkte += 2;
      else if (text.includes(w)) punkte += 1;
    }
    if (punkte > 0) bewertet.push({ p, punkte });
  }
  bewertet.sort((a, b) => b.punkte - a.punkte);
  return bewertet.map((e) => e.p);
}

/* ================================================================== */
/* Der Notausgang fuer den Bestellabschluss                            */
/* ================================================================== */

/**
 * Umgebungsvariable BESTELLUNG_GESPERRT.
 *
 * Diese Seite ist oeffentlich erreichbar und kann echte Bestellungen im
 * Livesystem matten.de ausloesen. Wer das nicht will, setzt in Netlify
 * BESTELLUNG_GESPERRT=1 -- dann lehnt /api/kasse/bestellen ab, bevor auch
 * nur eine Anfrage an matten.de geht. Alles andere bleibt bedienbar.
 *
 * STANDARD IST AUS: ohne gesetzte Variable sind Bestellungen erlaubt.
 *
 * Als gesetzt gelten "1", "true" und "ja" (Gross-/Kleinschreibung egal).
 * Alles andere -- auch "0", "nein" oder ein Tippfehler -- gilt als NICHT
 * gesetzt. Die Sperre laesst sich also nur absichtlich setzen und nur
 * absichtlich aufheben; ein halb geschriebener Wert schaltet nichts um.
 */
function bestellungGesperrt() {
  const wert = String(process.env.BESTELLUNG_GESPERRT ?? '').trim().toLowerCase();
  return wert === '1' || wert === 'true' || wert === 'ja';
}

/* ================================================================== */
/* Der Einstiegspunkt                                                  */
/* ================================================================== */

/**
 * Holt den Pfad der ANFRAGE, egal wie Netlify sie hereingereicht hat.
 *
 * Ueber die Weiterleitung in netlify.toml kommt sie normalerweise mit dem
 * urspruenglichen Pfad (/api/cart) an. Wird die Function direkt aufgerufen,
 * steht davor /.netlify/functions/api. Beide Faelle muessen zum selben
 * Endpunkt fuehren, sonst hinge die Zuordnung an einem Netlify-Detail.
 */
function endpunktPfad(url) {
  let p = url.pathname;
  for (const praefix of ['/.netlify/functions/api', '/api']) {
    if (p === praefix) return '/api';
    if (p.startsWith(praefix + '/')) {
      p = p.slice(praefix.length);
      return '/api' + p;
    }
  }
  return p;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const pfad = endpunktPfad(url);
  const methode = req.method;

  /* --- Herkunft: dieselbe Regel wie lokal, nur mit dem richtigen Host --- */
  const header = Object.fromEntries(req.headers);
  const hosts = [
    header['x-forwarded-host'],
    header.host,
    url.host,
  ].filter(Boolean);

  if (!KERN.isSameOrigin(header, hosts)) {
    return new Response(
      JSON.stringify({ ok: false, fehler: 'Nur von dieser Seite aus erlaubt.' }),
      { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }
    );
  }

  /* --- Die Sitzung, aus dem Cookie gebaut --- */
  const cookieHeader = req.headers.get('cookie') || '';
  const cookieVorher = parseCookieHeader(cookieHeader)[SITZUNGS_COOKIE] ?? null;
  const sitzung = sitzungAusAnfrage(cookieHeader);
  const sicher = (header['x-forwarded-proto'] || url.protocol.replace(':', '')) === 'https';
  const ctx = { sitzung, cookieVorher, sicher };

  console.log(`[api] ${methode} ${pfad}`);

  try {
    return await route(req, url, pfad, methode, ctx);
  } catch (err) {
    // Details nur ins Function-Log. Im Body steht nichts ueber Pfade oder
    // Innenleben -- sonst verraet ein Fehlerfall die Struktur nach aussen.
    console.error('  [fehler]', err && err.stack ? err.stack : err);
    return jsonAntwort(
      502,
      { ok: false, fehler: 'Das Altsystem war nicht erreichbar oder hat unerwartet geantwortet.' },
      ctx
    );
  }
}

async function route(req, url, pfad, methode, ctx) {
  const { sitzung } = ctx;

  /* ================================================================ */
  /* Bilder  --  live, eine einzige Anfrage                            */
  /* ================================================================ */

  if (pfad.startsWith('/api/img/') && (methode === 'GET' || methode === 'HEAD')) {
    const bild = await holeBild(pfad.slice('/api/img/'.length));
    if (!bild.ok) return textAntwort(bild.status, bild.fehler);
    return new Response(methode === 'HEAD' ? null : bild.buffer, {
      status: 200,
      headers: {
        'Content-Type': bild.contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  /* ================================================================ */
  /* Warenkorb  --  live                                               */
  /* ================================================================ */

  if (pfad === '/api/cart' && methode === 'GET') {
    const { cart, logs } = await readCart(sitzung);
    return jsonAntwort(200, cartResponse(cart, logs), ctx);
  }

  if (pfad === '/api/cart/add' && methode === 'POST') {
    const { body, antwort } = await erwarteJson(req, ctx);
    if (antwort) return antwort;

    const anzahl = Math.max(1, Math.min(999, Number(body.anzahl) || 1));
    const kommentar = (nurText(body.kommentar) ?? '').slice(0, 500);

    /* Weg A -- beliebiger Katalogartikel ueber seinen Pfad. Der Feldsatz
       kommt aus dem Kaufformular der LIVE-Seite, nicht aus dem vorgebauten
       Katalog: was in den Warenkorb geht, muss zu dem passen, was matten.de
       in diesem Moment anbietet. */
    if (body.pfad !== undefined) {
      const p = normalisierePfad(body.pfad);
      if (!p) {
        return jsonAntwort(400, {
          ok: false,
          fehler: 'Ungueltiger Produktpfad, z. B. /logomatten/bierbankmatten/6303041',
        }, ctx);
      }
      const r = await addToCartPfad(sitzung, p, { anzahl, kommentar, werte: body.werte });
      if (!r.ok) return jsonAntwort(404, { ok: false, pfad: p, fehler: r.fehler, upstream: r.logs }, ctx);
      return jsonAntwort(200, cartResponse(r.cart, r.logs, {
        hinzugefuegt: { pfad: p, artikelId: r.artikelId, anzahl, modus: r.modus },
        gesendet: r.gesendet,
        abgelehnt: r.abgelehnt,
      }), ctx);
    }

    /* Weg B -- der urspruengliche Demo-Artikel 278, unveraendert. */
    const attribut = normalizeAttribut(body.attribut);
    const artikel = Number(body.artikel) || KERN.DEMO.artikel;
    const { cart, logs } = await addToCart(sitzung, { artikel, anzahl, attribut, kommentar });
    return jsonAntwort(200, cartResponse(cart, logs, {
      hinzugefuegt: { artikel, anzahl, attribut },
    }), ctx);
  }

  if (pfad === '/api/cart/menge' && methode === 'POST') {
    const { body, antwort } = await erwarteJson(req, ctx);
    if (antwort) return antwort;

    const key = nurText(body.key);
    if (!key || !/^[A-Za-z0-9_.:-]{4,80}$/.test(key)) {
      return jsonAntwort(400, {
        ok: false,
        fehler: 'Bitte den "key" der Position aus /api/cart uebergeben.',
      }, ctx);
    }
    const roh = Number(body.anzahl);
    if (!Number.isFinite(roh) || roh < 0 || roh > 999) {
      return jsonAntwort(400, { ok: false, fehler: 'Anzahl muss zwischen 0 und 999 liegen.' }, ctx);
    }

    const logs = await ensureUpstreamSession(sitzung);
    const r = await setQuantity(sitzung, key, Math.trunc(roh));
    return jsonAntwort(200, cartResponse(r.cart, [...logs, ...r.logs], {
      gesetzt: { key, anzahl: Math.trunc(roh) },
    }), ctx);
  }

  if (pfad === '/api/cart/clear' && methode === 'POST') {
    const { cart, logs } = await clearCart(sitzung);
    return jsonAntwort(200, cartResponse(cart, logs), ctx);
  }

  if (pfad === '/api/cart/raw' && methode === 'GET') {
    await ensureUpstreamSession(sitzung);
    const up = await upstream('GET', `${UPSTREAM_ORIGIN}${CART_PATH}`, { session: sitzung });
    return rohHtmlAntwort(
      decodeBody(up.buffer),
      'ROHANTWORT von matten.de' + CART_PATH + ' fuer diese Sitzung &mdash; ' +
      'unveraendert durchgereicht, nichts von uns gerendert.',
      ctx
    );
  }

  /* ================================================================ */
  /* Kundenkonto  --  live                                             */
  /* ================================================================ */

  if (pfad === '/api/konto' && methode === 'GET') {
    let logs = await ensureUpstreamSession(sitzung);
    const probe = await upstream('GET', `${UPSTREAM_ORIGIN}${ADDRESS_PATH}`, {
      session: sitzung, maxRedirects: 0,
    });
    logs = [...logs, ...probe.logs];

    if (probe.status === 200) {
      const html = decodeBody(probe.buffer);
      const konto = parseKontoMenue(html);
      return jsonAntwort(200, {
        ok: true,
        eingeloggt: konto.eingeloggt,
        hinweis: konto.hinweis,
        kontoMenue: konto.menue,
        adresse: parseAdressWerte(html),
        laender: parseSelect(html, 'adress[land]').optionen,
        felder: ADRESS_FELDER,
        upstream: logs,
      }, ctx);
    }

    const wk = await upstream('GET', `${UPSTREAM_ORIGIN}${CART_PATH}`, { session: sitzung });
    logs = [...logs, ...wk.logs];
    const konto = parseKontoMenue(decodeBody(wk.buffer));
    return jsonAntwort(200, {
      ok: true,
      eingeloggt: konto.eingeloggt,
      hinweis: konto.hinweis,
      kontoMenue: konto.menue,
      adresse: null,
      laender: [],
      felder: ADRESS_FELDER,
      upstream: logs,
    }, ctx);
  }

  if (pfad === '/api/konto/login' && methode === 'POST') {
    const { body, antwort } = await erwarteJson(req, ctx);
    if (antwort) return antwort;
    const email = (nurText(body.email) ?? '').trim().slice(0, 200);
    const passwort = (nurText(body.passwort) ?? '').slice(0, 200);
    if (!email || !passwort) {
      return jsonAntwort(400, {
        ok: false, eingeloggt: false,
        fehler: 'Bitte E-Mail-Adresse und Passwort angeben.',
      }, ctx);
    }
    const r = await kontoLogin(sitzung, email, passwort);
    return jsonAntwort(200, {
      ok: r.eingeloggt,
      eingeloggt: r.eingeloggt,
      name: r.eingeloggt ? (r.konto.menue[0]?.text ?? null) : null,
      kontoMenue: r.konto.menue,
      hinweis: r.konto.hinweis,
      fehler: r.fehler,
      upstream: r.logs,
    }, ctx);
  }

  if (pfad === '/api/konto/register' && methode === 'POST') {
    const { body, antwort } = await erwarteJson(req, ctx);
    if (antwort) return antwort;
    const r = await kontoRegister(sitzung, body);
    return jsonAntwort(r.moeglich ? 200 : 501, {
      ok: r.ok,
      moeglich: r.moeglich,
      felder: r.felder,
      fehler: r.fehler,
      seiteninhalt: r.seiteninhalt,
      upstream: r.logs,
    }, ctx);
  }

  /* ================================================================ */
  /* Kasse  --  live                                                   */
  /* ================================================================ */

  if (pfad === '/api/kasse/formular' && methode === 'GET') {
    const stand = await readCartMitOptionen(sitzung);
    let logs = stand.logs;
    let laender = [];
    let werte = null;

    const adr = await upstream('GET', `${UPSTREAM_ORIGIN}${ADDRESS_PATH}`, {
      session: sitzung, maxRedirects: 0,
    });
    logs = [...logs, ...adr.logs];
    if (adr.status === 200) {
      const html = decodeBody(adr.buffer);
      laender = parseSelect(html, 'adress[land]').optionen;
      werte = parseAdressWerte(html);
    }

    return jsonAntwort(200, {
      ok: true,
      warenkorb: cartResponse(stand.cart, []),
      optionen: stand.optionen,
      konto: stand.konto,
      adressfelder: ADRESS_FELDER,
      laender,
      adresse: werte,
      upstream: logs,
    }, ctx);
  }

  if (pfad === '/api/kasse/optionen' && methode === 'POST') {
    const { body, antwort } = await erwarteJson(req, ctx);
    if (antwort) return antwort;

    // Erst der Typ, dann der Inhalt -- nicht koerzieren.
    const zahlungsartRoh = nurText(body.zahlungsart);
    if (zahlungsartRoh === null) {
      return jsonAntwort(400, {
        ok: false,
        fehler: 'Feld "zahlungsart" muss eine Zeichenkette sein.',
        erlaubt: [...ZAHLUNGSARTEN_ERLAUBT],
      }, ctx);
    }
    const zahlungsart = zahlungsartRoh.trim();
    const verboten = pruefeZahlungsart(zahlungsart);
    if (verboten) {
      // Ablehnung VOR jedem Upstream-Aufruf: die Zahlungsart darf gar nicht
      // erst in die Sitzung des Altsystems gelangen.
      return jsonAntwort(400, {
        ok: false, fehler: verboten, erlaubt: [...ZAHLUNGSARTEN_ERLAUBT],
      }, ctx);
    }

    const landRoh = body.land === undefined ? 'de' : nurText(body.land);
    const versandartRoh = nurText(body.versandart);
    if (landRoh === null || versandartRoh === null) {
      return jsonAntwort(400, {
        ok: false,
        fehler: 'Die Felder "land" und "versandart" muessen Zeichenketten sein.',
      }, ctx);
    }
    const land = landRoh.trim().slice(0, 10);
    const versandart = versandartRoh.trim().slice(0, 10);
    if (!/^[A-Za-z]{2,5}$/.test(land)) {
      return jsonAntwort(400, { ok: false, fehler: 'Ungueltiges Land.' }, ctx);
    }
    if (!/^\d{1,4}$/.test(versandart)) {
      return jsonAntwort(400, { ok: false, fehler: 'Ungueltige Versandart.' }, ctx);
    }

    const r = await setzeKasseOptionen(sitzung, { land, versandart, zahlungsart });
    return jsonAntwort(200, cartResponse(r.cart, r.logs, {
      optionen: r.optionen,
      gesendet: r.gesendet,
    }), ctx);
  }

  if (pfad === '/api/kasse/adresse' && methode === 'POST') {
    const { body, antwort } = await erwarteJson(req, ctx);
    if (antwort) return antwort;
    const r = await speichereAdresse(sitzung, body);
    return jsonAntwort(r.gespeichert ? 200 : 422, {
      ok: r.gespeichert,
      gespeichert: r.gespeichert,
      fehler: r.fehler,
      gesendet: r.gesendet,
      upstream: r.logs,
    }, ctx);
  }

  if (pfad === '/api/kasse/vorschau' && methode === 'GET') {
    const v = await leseVorschau(sitzung);
    return jsonAntwort(200, { ok: true, ...v }, ctx);
  }

  if (pfad === '/api/kasse/bestellen' && methode === 'POST') {
    const { body, antwort } = await erwarteJson(req, ctx);
    if (antwort) return antwort;

    // Schutz gegen versehentliches Ausloesen: ohne dieses Wort passiert
    // nichts. Verglichen wird streng gegen den ROHWERT -- ein Array
    // ["JA-BESTELLEN"] wuerde ueber String() sonst durchrutschen.
    if (body.bestaetigung !== BESTELL_BESTAETIGUNG) {
      return jsonAntwort(400, {
        ok: false,
        fehler: 'Fehlende Bestaetigung. Dieser Endpunkt loest eine ECHTE Bestellung im ' +
          `Live-System aus und verlangt darum { "bestaetigung": "${BESTELL_BESTAETIGUNG}" } im Body.`,
        erwartet: { bestaetigung: BESTELL_BESTAETIGUNG },
      }, ctx);
    }

    // Der Notausgang der oeffentlichen Auslieferung. Bewusst NACH der
    // Bestaetigungspruefung und VOR jedem Upstream-Aufruf.
    if (bestellungGesperrt()) {
      return jsonAntwort(503, {
        ok: false,
        gesperrt: true,
        fehler:
          'Der Bestellabschluss ist auf dieser Auslieferung abgeschaltet ' +
          '(Umgebungsvariable BESTELLUNG_GESPERRT). Warenkorb, Preise, Adresse ' +
          'und Vorschau funktionieren weiter; es geht nur keine Bestellung an ' +
          'matten.de. Zum Aufheben die Variable in Netlify entfernen.',
      }, ctx);
    }

    // Zweite Sperre: die im Altsystem tatsaechlich gesetzte Zahlungsart.
    const stand = await readCartMitOptionen(sitzung);
    const verboten = pruefeZahlungsart(stand.optionen.zahlungsart.gewaehlt);
    if (verboten) {
      return jsonAntwort(400, { ok: false, fehler: verboten, upstream: stand.logs }, ctx);
    }

    // Der eben gelesene Stand wird weitergereicht, statt die Warenkorbseite
    // gleich noch einmal zu holen. Das spart eine von rund sechs Anfragen an
    // matten.de -- bei zehn Sekunden Gesamtbudget die entscheidende.
    const r = await bestellungAbschicken(sitzung, { vorabStand: stand });
    if (!r.ok && r.huerden) {
      return jsonAntwort(409, {
        ok: false,
        fehler: 'Der Bestellabschluss ist noch nicht moeglich.',
        huerden: r.huerden,
        upstream: r.logs,
      }, ctx);
    }
    return jsonAntwort(200, {
      ok: r.ok,
      bestellnummer: r.bestellnummer,
      status: r.status,
      finalUrl: r.finalUrl,
      rohantwort: r.rohantwort,
      gesendet: r.vorschau.finalRequest,
      upstream: r.logs,
    }, ctx);
  }

  if (pfad === '/api/kasse/raw' && methode === 'GET') {
    // Der lokale Server hebt die Antwort der letzten Bestellung in der
    // Sitzung auf. Hier gibt es keinen Speicher -- also immer die aktuelle
    // Uebersichtsseite. Das ist ehrlicher als eine erfundene Rohantwort.
    await ensureUpstreamSession(sitzung);
    const up = await upstream('GET', `${UPSTREAM_ORIGIN}${ORDER_PATH}`, { session: sitzung });
    return rohHtmlAntwort(
      decodeBody(up.buffer),
      'ROHANTWORT von matten.de' + ORDER_PATH + ' &mdash; die Uebersichtsseite. ' +
      'Diese Auslieferung hat keinen Serverspeicher und kann darum keine ' +
      'frueehere Bestellantwort aufbewahren.',
      ctx
    );
  }

  /* ================================================================ */
  /* Preis  --  live                                                   */
  /* ================================================================ */

  if (pfad === '/api/price' && methode === 'GET') {
    const anzahl = Math.max(1, Math.min(999, Number(url.searchParams.get('anzahl')) || 1));

    const pfadRoh = url.searchParams.get('pfad');
    if (pfadRoh !== null) {
      const p = normalisierePfad(pfadRoh);
      if (!p) return jsonAntwort(400, { ok: false, fehler: 'Ungueltiger Produktpfad.' }, ctx);

      const paare = [];
      for (const [name, wert] of url.searchParams) {
        if (name.startsWith('attribute[') || name.startsWith('spezialoption[')) {
          paare.push([name, String(wert).slice(0, 200)]);
        }
      }
      const r = await fetchPricePfad(sitzung, p, anzahl, paare);
      if (r.fehler) {
        return jsonAntwort(404, { ok: false, pfad: p, fehler: r.fehler, upstream: r.logs || [] }, ctx);
      }
      const preis = r.json?.prices?.[0] || null;
      return jsonAntwort(200, {
        ok: r.ok,
        pfad: p,
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
      }, ctx);
    }

    const attribut = normalizeAttribut(url.searchParams.get('attribut'));
    const { json, logs } = await fetchPrice(sitzung, anzahl, attribut);
    const p = json?.prices?.[0] || null;
    return jsonAntwort(200, {
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
    }, ctx);
  }

  /* ================================================================ */
  /* Katalog  --  VORGEBAUT (siehe Kopf dieser Datei)                  */
  /* ================================================================ */

  if (pfad === '/api/katalog' && methode === 'GET') {
    return jsonAntwort(200, {
      ok: true,
      sprache: 'de',
      ...D.katalog,
      upstream: [],
      herkunft: KATALOG_HERKUNFT,
    }, ctx);
  }

  if (pfad === '/api/katalog/diagnose' && methode === 'GET') {
    // Die Live-Diagnose zieht eine Stichprobe von Artikelseiten -- das sind
    // Dutzende Anfragen und passt nicht in zehn Sekunden. Statt sie
    // abzuschneiden (und damit ein falsches Bild zu zeichnen), sagt dieser
    // Endpunkt, was Sache ist, und nennt die Zahlen aus dem Build.
    return jsonAntwort(501, {
      ok: false,
      fehler:
        'Die Diagnose prueft eine Stichprobe von Artikelseiten live und braucht dafuer ' +
        'deutlich mehr als die zehn Sekunden, die eine Netlify Function laufen darf. ' +
        'Sie laeuft nur im lokalen Server (node server.mjs, /api/katalog/diagnose).',
      bilanzDesBuilds: D.bilanz,
      herkunft: KATALOG_HERKUNFT,
    }, ctx);
  }

  if (pfad === '/api/kategorie' && methode === 'GET') {
    const p = normalisierePfad(url.searchParams.get('pfad'));
    if (!p) {
      return jsonAntwort(400, {
        ok: false,
        fehler: 'Bitte einen Kategoriepfad angeben, z. B. ?pfad=/logomatten/bierbankmatten',
      }, ctx);
    }
    const eintrag = D.kategorien[pfadSchluessel(p)];
    if (!eintrag) {
      return jsonAntwort(404, {
        ok: false, pfad: p,
        fehler: `Diese Kategorie steht nicht im vorgebauten Katalog (Stand ${D.standText}).`,
        herkunft: KATALOG_HERKUNFT,
      }, ctx);
    }

    const { ausschnitt, blaetterung } = blaettere(
      eintrag.produkte, url.searchParams.get('seite'), url.searchParams.get('proSeite')
    );

    return jsonAntwort(200, {
      ok: true,
      pfad: eintrag.pfad,
      name: eintrag.titel ? eintrag.titel.split(',')[0].trim() : null,
      titel: eintrag.titel,
      einleitung: eintrag.einleitung,
      sprache: 'de',
      gecacht: true,
      // ?details=1 holte je Produkt eine Artikelseite. Das ist hier
      // ueberfluessig: die Detaildaten stecken schon im Katalog.
      details: false,
      ...blaetterung,
      hinweis:
        'Preise, interne Artikel-IDs und Varianten stehen im vorgebauten Katalog ' +
        '(window.CATALOG) -- ?details=1 ist auf dieser Auslieferung ohne Wirkung.',
      produkte: ausschnitt,
      upstream: [],
      herkunft: KATALOG_HERKUNFT,
    }, ctx);
  }

  if (pfad === '/api/produkt' && methode === 'GET') {
    const p = normalisierePfad(url.searchParams.get('pfad'));
    if (!p) {
      return jsonAntwort(400, {
        ok: false,
        fehler: 'Bitte einen Produktpfad angeben, z. B. ?pfad=/logomatten/bierbankmatten/6303041',
      }, ctx);
    }
    const eintrag = D.produkte[pfadSchluessel(p)];
    if (!eintrag) {
      return jsonAntwort(404, {
        ok: false, pfad: p,
        fehler: `Dieses Produkt steht nicht im vorgebauten Katalog (Stand ${D.standText}).`,
        herkunft: KATALOG_HERKUNFT,
      }, ctx);
    }
    return jsonAntwort(200, {
      ok: true,
      sprache: 'de',
      gecacht: true,
      parsen: eintrag.parsen,
      produkt: produktMitAbsaetzen(eintrag),
      kaufformular: eintrag.kaufformular,
      upstream: [],
      herkunft: KATALOG_HERKUNFT,
    }, ctx);
  }

  if (pfad === '/api/suche' && methode === 'GET') {
    const alle = url.searchParams.get('alle') === '1';
    const q = (nurText(url.searchParams.get('q')) ?? '').trim().slice(0, 100);
    if (!alle && q.length < 2) {
      return jsonAntwort(400, {
        ok: false,
        fehler: 'Bitte mindestens zwei Zeichen suchen (?q=...) oder mit ?alle=1 den gesamten Katalog anfordern.',
      }, ctx);
    }

    const treffer = alle && !q ? D.alleProdukte : sucheVorgebaut(q);
    const { ausschnitt, blaetterung } = blaettere(
      treffer, url.searchParams.get('seite'), url.searchParams.get('proSeite')
    );

    return jsonAntwort(200, {
      ok: true,
      q,
      sprache: 'de',
      gecacht: true,
      gemeldeteTreffer: alle && !q ? D.gemeldeteTreffer : null,
      ...blaetterung,
      hinweis:
        'Diese Suche laeuft auf dem vorgebauten Katalog, nicht auf /suche des Altsystems. ' +
        'Mehrere Woerter werden mit ODER verknuepft; durchsucht werden Name, Artikelnummer ' +
        'und Kurzbeschreibung -- NICHT der volle Beschreibungstext, den das Altsystem ' +
        'mitdurchsucht. Die Rangfolge (Name vor Artikelnummer vor Kurzbeschreibung) ist ' +
        'unsere eigene, nicht die des Altsystems.',
      produkte: ausschnitt,
      upstream: [],
      herkunft: KATALOG_HERKUNFT,
    }, ctx);
  }

  /* ================================================================ */

  return jsonAntwort(404, { ok: false, fehler: 'Unbekannter Endpunkt' }, ctx);
}
