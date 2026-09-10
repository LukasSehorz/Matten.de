/**
 * BRUECKE ZU matten.de  --  der gemeinsame Kern
 * ---------------------------------------------
 * Hier steht die gesamte Fachlogik der Bruecken-Demo: Zeichensatz, Upstream-
 * Anfragen, Parser, Warenkorb, Bestellstrecke, Katalog. Nur Node-Builtins,
 * keine npm-Abhaengigkeit.
 *
 * Drei Verbraucher teilen sich diese Datei -- und zwar wirklich dieselbe,
 * nicht drei Abschriften davon:
 *
 *   bridge-demo/server.mjs        der lokale Proxy auf Port 8787
 *   bridge-demo/build-katalog.mjs erzeugt den Katalog einmalig beim Build
 *   netlify/functions/api.mjs     dieselben /api/-Endpunkte, zustandslos
 *
 * Was hier NICHT steht, ist alles, was an eine Laufzeitumgebung gebunden ist:
 * HTTP-Server, Dateiauslieferung, Antwortschreiben, Sitzungsspeicher. Das
 * unterscheidet sich zwischen lokalem Server und Netlify-Function und steht
 * darum dort.
 *
 * Die Sitzung ist bewusst ein schlichtes Objekt { cookies: Map, created },
 * kein Klassenkonstrukt: der lokale Server haelt sie in einer Map im
 * Arbeitsspeicher, die Netlify-Function baut sie fuer jede Anfrage neu aus
 * einem Cookie auf. Beide reichen dasselbe Objekt in dieselben Funktionen.
 */

import https from 'node:https';
import path from 'node:path';

/** Eine frische, leere Upstream-Sitzung. */
export function neueSitzung() {
  return { cookies: new Map(), created: Date.now() };
}


const UPSTREAM_HOST = 'matten.de';
const UPSTREAM_ORIGIN = `https://${UPSTREAM_HOST}`;
const CART_PATH = '/warenkorb';
const PRICE_PATH = '/logomatten/bierbankmatten/6303041';

/* --- Pfade der Bestellstrecke (durch Sondieren ermittelt, siehe START.md) -- */
const ADDRESS_PATH = '/adresse';   // Adressformular, POST validiert
const ORDER_PATH = '/bestellen';   // Uebersicht + finaler Absende-Knopf
const LOGIN_PATH = '/login';
const REGISTER_PATH = '/register';

/**
 * HARTE GRENZE: nur diese beiden Zahlungsarten sind zugelassen. Bei beiden
 * fliesst beim Bestellen kein Geld -- es entsteht nur ein Datensatz.
 */
const ZAHLUNGSARTEN_ERLAUBT = new Set(['VorkassePayment', 'RechnungPayment']);

/**
 * Diese beiden leiten zum Zahlungsdienstleister Worldline/Ogone weiter und
 * werden darum ueberall abgelehnt -- in der UI, beim Setzen der Optionen und
 * noch einmal unmittelbar vor dem Absenden.
 */
const ZAHLUNGSARTEN_VERBOTEN = new Map([
  ['OgonePpPayment', 'PayPal (Worldline/Ogone)'],
  ['OgoneCcPayment', 'Kreditkarte (Worldline/Ogone)'],
]);

/** Der einzige Wert, der den finalen Bestellvorgang freigibt. */
const BESTELL_BESTAETIGUNG = 'JA-BESTELLEN';

/**
 * Nimmt einen Wert NUR an, wenn er wirklich eine Zeichenkette ist.
 *
 * Der Grund ist ein scharfer: `String(["JA-BESTELLEN"])` ergibt exakt
 * "JA-BESTELLEN". Ein JSON-Array haette sich damit an einer Gleichheits-
 * pruefung vorbeimogeln und eine echte Bestellung ausloesen koennen.
 * Sicherheitsrelevante Felder werden darum nicht koerziert, sondern
 * abgelehnt -- fail-closed statt hilfsbereit.
 */
function nurText(wert) {
  return typeof wert === 'string' ? wert : null;
}

/** Das einzige Feld des finalen Formulars auf /bestellen. */
const BESTELL_FELD = 'bestellung_abschicken';
const BESTELL_WERT = 'Bestellung abschicken';

/**
 * Die Felder des Adressformulars, in genau der Reihenfolge des Live-Formulars.
 * "pflicht" ist das, was die Validierung des Altsystems beim Sondieren mit
 * leerem Formular bemaengelt hat.
 */
const ADRESS_FELDER = [
  { name: 'anrede', label: 'Anrede', pflicht: true },
  { name: 'vorname', label: 'Vorname', pflicht: true },
  { name: 'name', label: 'Nachname', pflicht: true },
  { name: 'firma', label: 'Firmenname', pflicht: false },
  { name: 'strasse', label: 'Strasse', pflicht: true },
  { name: 'plz', label: 'PLZ', pflicht: true },
  { name: 'ort', label: 'Ort', pflicht: true },
  { name: 'land', label: 'Land', pflicht: true },
  { name: 'email', label: 'E-Mail-Adresse', pflicht: true },
  { name: 'telefon', label: 'Telefon', pflicht: true },
  { name: 'mobil', label: 'Mobil', pflicht: false },
  { name: 'fax', label: 'Fax', pflicht: false },
  { name: 'uid', label: 'Umsatzsteuer-ID', pflicht: false },
  { name: 'bemerkungen', label: 'Bemerkungen', pflicht: false },
];

/** Optionale abweichende Rechnungsadresse -- gleiche Reihenfolge wie oben. */
const RECHNUNG_FELDER = [
  'rechnung_anrede', 'rechnung_vorname', 'rechnung_name', 'rechnung_firma',
  'rechnung_strasse', 'rechnung_plz', 'rechnung_ort', 'rechnung_land',
  'rechnung_email',
];

/** Fest verdrahtet fuer diese Demo (ein Produkt). */
const DEMO = {
  artikel: 278,
  artikelnummer: '6303041',
  name: 'Bierbankmatte: Pils',
  attributName: 'Individuelle Bedruckung',
  priceUpdates: '/logomatten/bierbankmatten/6303041?getpricejson=1',
};

/** Die beiden einzigen gueltigen Attributwerte des Live-Formulars. */
const ATTRIBUT_NEIN = 'nein';
const ATTRIBUT_JA = 'ja, Vorlage-Datei senden an: "info@matten.de"';

/** Nimmt "ja"/"nein" (oder den Volltext) und liefert den Upstream-Wert. */
function normalizeAttribut(value) {
  const v = String(value ?? '').trim().toLowerCase();
  return v === 'ja' || v.startsWith('ja,') ? ATTRIBUT_JA : ATTRIBUT_NEIN;
}


const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function parseCookieHeader(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

function cookieHeaderFor(session) {
  return [...session.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function absorbSetCookie(session, setCookie) {
  if (!setCookie) return;
  for (const raw of [].concat(setCookie)) {
    const first = raw.split(';')[0];
    const idx = first.indexOf('=');
    if (idx > 0) {
      const name = first.slice(0, idx).trim();
      const value = first.slice(idx + 1).trim();
      if (value === '' || /expires=Thu, 01 Jan 1970/i.test(raw)) {
        session.cookies.delete(name);
      } else {
        session.cookies.set(name, value);
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Zeichensatz: Antworten mischen cp1252 und utf-8; Anfragen wollen utf-8 */
/* ------------------------------------------------------------------ */

const CP1252_HIGH = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„',
  0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ',
  0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ',
  0x8e: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“',
  0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
  0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›',
  0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
};

/**
 * matten.de mischt die Zeichensaetze: Vorlagen-Texte kommen als cp1252,
 * Datenbank-Werte als echtes utf-8 -- beides im selben Dokument, das sich
 * "charset=utf-8" nennt. Ein einzelner Decoder kann daher nie beides richtig
 * treffen. Deshalb hier ein toleranter Decoder: gueltige utf-8-Sequenzen
 * werden als utf-8 gelesen, jedes einzelne ungueltige Byte faellt auf cp1252
 * zurueck.
 */
function decodeBody(buf) {
  let out = '';
  let i = 0;
  const n = buf.length;

  const cont = (b) => b >= 0x80 && b <= 0xbf;
  const cp1252 = (b) => CP1252_HIGH[b] || String.fromCharCode(b);

  while (i < n) {
    const b = buf[i];

    if (b < 0x80) { out += String.fromCharCode(b); i += 1; continue; }

    // 2-Byte-Sequenz
    if (b >= 0xc2 && b <= 0xdf && i + 1 < n && cont(buf[i + 1])) {
      out += String.fromCodePoint(((b & 0x1f) << 6) | (buf[i + 1] & 0x3f));
      i += 2; continue;
    }
    // 3-Byte-Sequenz
    if (b >= 0xe0 && b <= 0xef && i + 2 < n && cont(buf[i + 1]) && cont(buf[i + 2])) {
      const cp = ((b & 0x0f) << 12) | ((buf[i + 1] & 0x3f) << 6) | (buf[i + 2] & 0x3f);
      if (cp >= 0x800 && !(cp >= 0xd800 && cp <= 0xdfff)) {
        out += String.fromCodePoint(cp);
        i += 3; continue;
      }
    }
    // 4-Byte-Sequenz
    if (b >= 0xf0 && b <= 0xf4 && i + 3 < n &&
        cont(buf[i + 1]) && cont(buf[i + 2]) && cont(buf[i + 3])) {
      const cp = ((b & 0x07) << 18) | ((buf[i + 1] & 0x3f) << 12) |
                 ((buf[i + 2] & 0x3f) << 6) | (buf[i + 3] & 0x3f);
      if (cp >= 0x10000 && cp <= 0x10ffff) {
        out += String.fromCodePoint(cp);
        i += 4; continue;
      }
    }

    // Kein gueltiges utf-8 -> einzelnes cp1252-Byte
    out += cp1252(b);
    i += 1;
  }
  return out;
}

/**
 * Formulardaten nimmt der Shop als utf-8 entgegen (nachgemessen: ein
 * Kommentar mit Umlauten kommt so unveraendert zurueck, als cp1252
 * verwirft der Shop das Feld stillschweigend). Space wird zu "+",
 * alles Uebrige prozentkodiert.
 */
function encodeFormValue(str) {
  let out = '';
  for (const ch of String(str)) {
    if (/[A-Za-z0-9_.\-~]/.test(ch)) { out += ch; continue; }
    if (ch === ' ') { out += '+'; continue; }
    for (const byte of Buffer.from(ch, 'utf8')) {
      out += '%' + byte.toString(16).toUpperCase().padStart(2, '0');
    }
  }
  return out;
}

/** Baut einen urlencodierten Body (utf-8) aus [name, wert]-Paaren. */
function buildForm(pairs) {
  return pairs.map(([k, v]) => `${encodeFormValue(k)}=${encodeFormValue(v)}`).join('&');
}

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  euro: '€', auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä',
  Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', laquo: '«', raquo: '»',
  // Im Katalog-HTML kommen ausserdem diese vor: Pfeile in den
  // "Anfrage"-Knoepfen, Auslassungspunkte und Zeichen aus den von Hand
  // gepflegten Beschreibungen (Masse, Marken, Grad).
  rarr: '→', larr: '←', hellip: '…', ndash: '–', mdash: '—',
  middot: '·', bull: '•', deg: '°', reg: '®', copy: '©',
  trade: '™', times: '×', sup2: '²', sup3: '³', frac12: '½',
  eacute: 'é', agrave: 'à', ccedil: 'ç', shy: '',
};

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => (n in ENTITIES ? ENTITIES[n] : m));
}

function textOf(html) {
  if (html == null) return null;
  return decodeEntities(
    String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
  ).trim();
}

/**
 * "119,00 €" -> 119.00 ; nicht parsebar -> null
 *
 * Muss BEIDE Schreibweisen koennen: der Shop schreibt Betraege auf
 * deutschen Seiten als "1.234,56", auf ?lang=en aber als "1234.56".
 * Entscheidend ist darum nicht das Zeichen, sondern die Zahl der Ziffern
 * dahinter: ein bis zwei Nachkommastellen -> Dezimaltrenner, drei ->
 * Tausendertrenner. Ohne diese Unterscheidung wurde aus "47.60 €"
 * stillschweigend 47 und aus max="2000" eine 200.
 */
function toNumber(str) {
  if (!str) return null;
  const treffer = String(str).replace(/\s/g, '').match(/-?\d[\d.,]*/);
  if (!treffer) return null;

  const roh = treffer[0].replace(/[.,]+$/, '');
  const letzter = Math.max(roh.lastIndexOf(','), roh.lastIndexOf('.'));

  let normalisiert;
  if (letzter < 0) {
    normalisiert = roh;
  } else {
    const nachkommastellen = roh.length - letzter - 1;
    normalisiert =
      nachkommastellen >= 1 && nachkommastellen <= 2
        ? roh.slice(0, letzter).replace(/[.,]/g, '') + '.' + roh.slice(letzter + 1)
        : roh.replace(/[.,]/g, '');
  }
  const n = Number(normalisiert);
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------ */
/* Upstream-Request mit Logging + Redirect-Verfolgung                  */
/* ------------------------------------------------------------------ */

/**
 * Die Header, die jeder Formular-POST an das Altsystem mitbekommt.
 *
 * Eine einzige Quelle, die zwei Verbraucher hat: rawRequest() setzt sie
 * wirklich, und die Kassen-Vorschau zeigt sie dem Nutzer an. Waeren es zwei
 * getrennte Listen, koennte die Vorschau unbemerkt luegen.
 */
function postHeaders() {
  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    Origin: UPSTREAM_ORIGIN,
    Referer: `${UPSTREAM_ORIGIN}${PRICE_PATH}`,
  };
}

function rawRequest(method, url, { body = null, session, extraHeaders = {} }) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);

    // Harte Grenze: dieser Proxy spricht mit genau einem Host. Ohne diese
    // Pruefung wuerde ein Redirect auf einen Fremdhost die Upstream-Cookies
    // (inkl. PHPSESSID) dorthin mitnehmen.
    if (u.hostname !== UPSTREAM_HOST || u.protocol !== 'https:') {
      reject(new Error(`Fremder Host abgelehnt: ${u.protocol}//${u.hostname}`));
      return;
    }

    const headers = {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9',
      'Accept-Encoding': 'identity',
      ...extraHeaders,
    };
    // Cookies gehen ausschliesslich an UPSTREAM_HOST (oben erzwungen).
    const cookie = cookieHeaderFor(session);
    if (cookie) headers.Cookie = cookie;
    if (body != null) {
      Object.assign(headers, postHeaders());
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const started = Date.now();
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method, headers, timeout: 20000 },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const ms = Date.now() - started;
          absorbSetCookie(session, res.headers['set-cookie']);
          const line = `${method} ${u.pathname}${u.search} -> ${res.statusCode} - ${ms} ms`;
          console.log(`  [upstream] ${line}`);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            buffer: Buffer.concat(chunks),
            ms,
            log: { method, url: u.pathname + u.search, status: res.statusCode, ms },
          });
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('Upstream-Timeout (20 s)')));
    req.on('error', reject);
    if (body != null) req.write(body);
    req.end();
  });
}

/**
 * Folgt Redirects (Standard: bis zu 5) und sammelt die Log-Eintraege.
 * `maxRedirects: 0` schaltet das Folgen ab -- fuer Bilder, wo eine
 * Umleitung auf die Startseite keine sinnvolle Antwort waere.
 */
async function upstream(method, url, opts = {}) {
  const maxRedirects = opts.maxRedirects ?? 5;
  const logs = [];
  let curMethod = method;
  let curUrl = url;
  let curBody = opts.body ?? null;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await rawRequest(curMethod, curUrl, { ...opts, body: curBody });
    logs.push(res.log);
    const loc = res.headers.location;

    if (res.status >= 300 && res.status < 400 && loc && hop < maxRedirects) {
      const next = new URL(loc, curUrl);
      // Zweite Sicherung neben der Pruefung in rawRequest: eine Umleitung
      // darf den Proxy niemals von matten.de wegfuehren.
      if (next.hostname !== UPSTREAM_HOST || next.protocol !== 'https:') {
        throw new Error(`Umleitung auf fremden Host abgelehnt: ${next.hostname}`);
      }
      curUrl = next.toString();
      if (res.status !== 307 && res.status !== 308) {
        curMethod = 'GET';
        curBody = null;
      }
      continue;
    }
    return { ...res, logs, finalUrl: curUrl };
  }
  throw new Error('Zu viele Redirects');
}

/* ------------------------------------------------------------------ */
/* Parser fuer das Warenkorb-HTML des alten Shops                      */
/* ------------------------------------------------------------------ */

function firstMatch(html, re, group = 1) {
  const m = html.match(re);
  return m ? m[group] : null;
}

/**
 * Liest die Warenkorb-Seite. Defensiv: jedes nicht gefundene Feld
 * wird null, nie ein Absturz.
 */
function parseCart(html) {
  const result = {
    count: null,
    items: [],
    gesamt: null,
    gesamtNum: null,
    zwischensumme: null,
    versand: null,
    umsatzsteuer: null,
    ustSatz: null,
    leer: false,
  };
  if (typeof html !== 'string' || html.length === 0) return result;

  try {
    // 1) Anzahl aus der Mini-Warenkorb-Anzeige: "Warenkorb (2)"
    const cnt = firstMatch(html, /Warenkorb\s*\((\d+)\)/);
    if (cnt != null) result.count = Number(cnt);

    // 2) Artikelzeilen
    const rowRe = /<tr[^>]*class=['"][^'"]*collapse-bottom[^'"]*['"][^>]*>([\s\S]*?)<\/tr>/gi;
    let row;
    while ((row = rowRe.exec(html)) !== null) {
      const block = row[1];
      const tds = [...block.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      if (tds.length === 0) continue;

      const descRaw = tds[0] || '';
      // Name = alles vor dem ersten <br>
      const namePart = descRaw.split(/<br\s*\/?>/i)[0];
      const name = textOf(namePart) || null;

      // Attributzeilen: "- Individuelle Bedruckung: nein"
      const attrLines = [];
      for (const seg of descRaw.split(/<br\s*\/?>/i).slice(1)) {
        const t = textOf(seg);
        if (t && t.startsWith('-')) attrLines.push(t.replace(/^-\s*/, ''));
      }
      const attribut = attrLines.length ? attrLines.join(' | ') : null;

      const key =
        firstMatch(block, /settocart\[key\]['"]\s+value=['"]([^'"]+)['"]/i) ||
        firstMatch(html, /setkommentar\[([0-9a-f]{8,})\]/i);

      const anzahlRaw = firstMatch(
        block,
        /name=['"]settocart\[anzahl\]['"][^>]*value=['"](\d+)['"]/i
      ) || firstMatch(block, /value=['"](\d+)['"][^>]*name=['"]settocart\[anzahl\]['"]/i);

      const preisText = tds[1] != null ? textOf(tds[1]) : null;
      const summeText = tds.length >= 4 ? textOf(tds[tds.length - 1]) : null;

      // Kommentar steht in der Folgezeile (setkommentar[key])
      let kommentar = null;
      if (key) {
        const kRe = new RegExp(
          `setkommentar\\[${key}\\]['"][^>]*value=["']([^"']*)["']`,
          'i'
        );
        const km = html.match(kRe);
        if (km) kommentar = decodeEntities(km[1]) || null;
      }

      if (!name && !anzahlRaw) continue; // keine echte Artikelzeile

      result.items.push({
        key: key || null,
        name,
        attribut,
        kommentar,
        anzahl: anzahlRaw != null ? Number(anzahlRaw) : null,
        preis: preisText || null,
        preisNum: toNumber(preisText),
        summe: summeText || null,
        summeNum: toNumber(summeText),
      });
    }

    // 3) Summenblock
    const grab = (label) =>
      firstMatch(
        html,
        new RegExp(`${label}[^<]*:?\\s*<\\/(?:strong|td)>[\\s\\S]{0,200}?<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i')
      );

    const zw = firstMatch(html, /Zwischensumme:\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i);
    if (zw) result.zwischensumme = textOf(zw);

    const vs = firstMatch(html, /Versandkosten:\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i);
    if (vs) result.versand = textOf(vs);

    const ust = firstMatch(html, /Umsatzsteuer[^<]*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i);
    if (ust) result.umsatzsteuer = textOf(ust);

    // Steuersatz aus "zzgl. Umsatzsteuer 19.00%". Damit kann das Frontend
    // aus den Netto-Preisen der Warenkorb-Tabelle den Brutto-Stueckpreis
    // ausweisen -- also genau die Zahl, die auf der Produktseite steht.
    const satz = firstMatch(html, /Umsatzsteuer\s*([\d]+(?:[.,]\d+)?)\s*%/i);
    if (satz != null) {
      const n = Number(satz.replace(',', '.'));
      if (Number.isFinite(n)) result.ustSatz = n;
    }

    // Gesamtsumme: zuerst die Tabellenzeile, sonst der Mini-Warenkorb-Betrag
    let ges =
      firstMatch(
        html,
        /Gesamtsumme<\/strong>\s*:\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i
      ) || grab('Gesamtsumme');
    if (!ges) {
      ges = firstMatch(html, /class=['"]betrag['"][^>]*>([^<]*)</i);
    }
    if (ges) {
      result.gesamt = textOf(ges);
      result.gesamtNum = toNumber(result.gesamt);
    }

    result.leer = result.items.length === 0;
  } catch (err) {
    console.error('  [parser] Fehler beim Parsen:', err.message);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Parser fuer Konto, Adresse und Bestelluebersicht                    */
/* ------------------------------------------------------------------ */

/** Maskiert Zeichen, die in einem regulaeren Ausdruck Bedeutung haetten. */
function reEscape(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Liest ein <select> samt Optionen und der aktuell gewaehlten Option.
 * Damit stehen Laender- und Versandart-Listen nicht doppelt im Frontend,
 * sondern kommen aus derselben Quelle wie im alten Shop.
 */
function parseSelect(html, name) {
  const block = firstMatch(
    html,
    new RegExp(`<select[^>]*name=['"]${reEscape(name)}['"][\\s\\S]*?<\\/select>`, 'i'),
    0
  );
  if (!block) return { optionen: [], gewaehlt: null };

  const optionen = [];
  let gewaehlt = null;
  for (const m of block.matchAll(/<option\s*([^>]*)>([\s\S]*?)<\/option>/gi)) {
    const attrs = m[1] || '';
    const wert = firstMatch(attrs, /value=['"]([^'"]*)['"]/i) ?? '';
    const label = textOf(m[2]) || wert;
    const ist = /\bselected\b/i.test(attrs);
    optionen.push({ wert, label, gewaehlt: ist });
    if (ist) gewaehlt = wert;
  }
  return { optionen, gewaehlt };
}

/**
 * Liest die Zahlungsart-Radios der Warenkorbseite. Die Ogone-Eintraege
 * werden mitgelesen (damit sichtbar bleibt, dass es sie gibt), aber als
 * `erlaubt: false` markiert -- das Frontend zeigt sie gar nicht erst an.
 */
function parseZahlungsarten(html) {
  const out = [];
  let gewaehlt = null;
  for (const m of html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)) {
    const inner = m[1];
    if (!/name=["']zahlungsart["']/i.test(inner)) continue;
    const wert = firstMatch(inner, /name=["']zahlungsart["'][^>]*value=["']([^"']+)["']/i)
      || firstMatch(inner, /value=["']([^"']+)["'][^>]*name=["']zahlungsart["']/i);
    if (!wert) continue;
    const tag = firstMatch(inner, /<input[^>]*name=["']zahlungsart["'][^>]*>/i, 0) || '';
    const ist = /\bchecked\b/i.test(tag);
    // Beschriftung = Text des Labels ohne die Bilder der Zahlungslogos.
    const label = textOf(inner.replace(/<input[^>]*>/gi, ' ').replace(/<img[^>]*>/gi, ' ')) || wert;
    out.push({
      wert,
      label,
      gewaehlt: ist,
      erlaubt: ZAHLUNGSARTEN_ERLAUBT.has(wert),
      grund: ZAHLUNGSARTEN_VERBOTEN.get(wert) ?? null,
    });
    if (ist) gewaehlt = wert;
  }
  return { optionen: out, gewaehlt };
}

/** Land, Versandart und Zahlungsart, wie sie gerade im Warenkorb stehen. */
function parseKasseOptionen(html) {
  const land = parseSelect(html, 'adresse[land]');
  const versand = parseSelect(html, 'versandart');
  const zahlung = parseZahlungsarten(html);
  return {
    land: { optionen: land.optionen, gewaehlt: land.gewaehlt },
    versandart: { optionen: versand.optionen, gewaehlt: versand.gewaehlt },
    zahlungsart: {
      optionen: zahlung.optionen.filter((z) => z.erlaubt),
      abgelehnt: zahlung.optionen.filter((z) => !z.erlaubt).map((z) => ({ wert: z.wert, label: z.label, grund: z.grund })),
      gewaehlt: zahlung.gewaehlt,
    },
  };
}

/**
 * Zustand des Kundenkontos. Das Altsystem hat keinen offenen Statusendpunkt;
 * einziges verlaessliches Merkmal ist das Menue "Mein Konto" im Seitenkopf:
 * ausgeloggt enthaelt es "Einloggen" (/login), eingeloggt nicht mehr.
 * Deshalb wird der Menueinhalt roh mitgeliefert -- der Nutzer sieht die
 * Grundlage der Einschaetzung und muss ihr nicht blind glauben.
 */
function parseKontoMenue(html) {
  const block = firstMatch(html, /Mein Konto[\s\S]{0,1200}?<\/ul>/i, 0) || '';
  const eintraege = [...block.matchAll(/<a[^>]*href=['"]([^'"]*)['"][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ ziel: m[1], text: textOf(m[2]) }))
    .filter((e) => e.text);

  const hatLogin = eintraege.some((e) => /^\/login\b/.test(e.ziel));
  const hatLogout = /href=['"]\/(logout|abmelden|logoff)['"]/i.test(html);
  const eingeloggt = block ? (hatLogout || !hatLogin) : false;

  return {
    eingeloggt,
    menue: eintraege,
    hinweis: eingeloggt
      ? 'Das Konto-Menue bietet kein "Einloggen" mehr an -- die Sitzung gilt als angemeldet.'
      : 'Das Konto-Menue bietet "Einloggen" an -- die Sitzung ist nicht angemeldet.',
  };
}

/**
 * Validierungsmeldungen des Adressformulars, Feld fuer Feld.
 * Echte Fehler stecken immer in <span class='adress_error'>; der
 * Hinweis "* Pflichtfelder" steht im selben Block-Typ, aber ohne diese
 * Klasse -- ohne die Unterscheidung meldete jedes Formular einen Fehler.
 */
function parseAdressFehler(html) {
  const fehler = [];
  const treffer = [...html.matchAll(/name=['"]adress\[([a-z_]+)\]['"]/gi)];
  for (let i = 0; i < treffer.length; i++) {
    const feld = treffer[i][1];
    const von = treffer[i].index;
    const bis = i + 1 < treffer.length ? treffer[i + 1].index : Math.min(html.length, von + 2500);
    const block = html.slice(von, bis);
    const roh = firstMatch(block, /<span class='adress_error'>([\s\S]*?)<\/span>/i);
    if (roh) fehler.push({ feld, meldung: textOf(roh) });
  }
  return fehler;
}

/** Die im Altsystem gespeicherten Adresswerte aus dem vorbelegten Formular. */
function parseAdressWerte(html) {
  const werte = {};
  for (const f of ADRESS_FELDER) {
    if (f.name === 'land') {
      werte.land = parseSelect(html, 'adress[land]').gewaehlt;
      continue;
    }
    if (f.name === 'bemerkungen') {
      const t = firstMatch(html, /<textarea[^>]*name=['"]adress\[bemerkungen\]['"][^>]*>([\s\S]*?)<\/textarea>/i);
      werte.bemerkungen = t != null ? decodeEntities(t).trim() : null;
      continue;
    }
    const v = firstMatch(
      html,
      new RegExp(`name=["']adress\\[${f.name}\\]["'][^>]*value=["']([^"']*)["']`, 'i')
    );
    werte[f.name] = v != null ? decodeEntities(v) : null;
  }
  return werte;
}

/**
 * Die Bestelluebersicht /bestellen: Lieferadresse, Positionen, Summen,
 * Zahlungsart -- und ob der finale Absende-Knopf ueberhaupt da ist.
 */
function parseUebersicht(html) {
  const result = {
    adresseText: null,
    bemerkungen: null,
    items: [],
    zwischensumme: null,
    versand: null,
    umsatzsteuer: null,
    ustSatz: null,
    gesamt: null,
    gesamtNum: null,
    zahlungsartText: null,
    absendeknopf: false,
  };
  if (typeof html !== 'string' || !html) return result;

  try {
    const adr = firstMatch(html, /<address>([\s\S]*?)<\/address>/i);
    if (adr) {
      result.adresseText = adr
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .split('\n')
        .map((z) => decodeEntities(z).replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n');
    }

    const bem = firstMatch(html, /<b>Bemerkungen<\/b>:<br\/>([\s\S]*?)<\/div>/i);
    if (bem) result.bemerkungen = textOf(bem) || null;

    const tabelle = firstMatch(html, /<table class='warenkorb table'>([\s\S]*?)<\/table>/i) || '';
    for (const row of tabelle.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)) {
      const tds = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      if (tds.length !== 4) continue;
      const erste = textOf(tds[0]);
      if (!erste || /^(Zwischensumme|Versandkosten|Gesamtsumme)/i.test(erste)) continue;

      const desc = tds[0];
      const name = textOf(desc.split(/<small>/i)[0]) || null;
      const attr = textOf((desc.match(/<small>([\s\S]*?)<\/small>/i) || [])[1] || '')
        .replace(/^-\s*/, '') || null;
      if (!name) continue;
      result.items.push({
        name,
        attribut: attr,
        preis: textOf(tds[1]),
        preisNum: toNumber(textOf(tds[1])),
        anzahl: Number(textOf(tds[2])) || null,
        summe: textOf(tds[3]),
        summeNum: toNumber(textOf(tds[3])),
      });
    }

    const zeile = (label) =>
      firstMatch(
        tabelle,
        new RegExp(`${label}[^<]*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i')
      );
    result.zwischensumme = textOf(zeile('Zwischensumme:'));
    result.versand = textOf(zeile('Versandkosten:'));
    result.umsatzsteuer = textOf(zeile('Umsatzsteuer[^<]*'));
    result.gesamt = textOf(zeile('Gesamtsumme:'));
    result.gesamtNum = toNumber(result.gesamt);

    const satz = firstMatch(tabelle, /Umsatzsteuer\s*([\d]+(?:[.,]\d+)?)\s*%/i);
    if (satz != null) {
      const n = Number(satz.replace(',', '.'));
      if (Number.isFinite(n)) result.ustSatz = n;
    }

    const za = firstMatch(html, /Zahlungsart:\s*([^<]*)/i);
    if (za) result.zahlungsartText = decodeEntities(za).trim() || null;

    result.absendeknopf = new RegExp(`name=['"]${BESTELL_FELD}['"]`, 'i').test(html);
  } catch (err) {
    console.error('  [parser] Uebersicht:', err.message);
  }
  return result;
}

/**
 * Sucht in der Antwort nach dem Bestellabschluss eine Bestell-/Auftragsnummer.
 * Das Altsystem zeigt auf /danke nur einen Danktext -- gefunden wird also
 * womoeglich nichts. Dann bleibt der Wert null, statt eine Nummer zu erfinden.
 */
function parseBestellnummer(html) {
  const t = typeof html === 'string' ? html : '';
  const muster = [
    /Bestellnummer\s*:?\s*<?[^>]*>?\s*([A-Za-z0-9][A-Za-z0-9\-_/]{2,30})/i,
    /Auftragsnummer\s*:?\s*<?[^>]*>?\s*([A-Za-z0-9][A-Za-z0-9\-_/]{2,30})/i,
    /Bestellung\s*(?:Nr\.?|Nummer|#)\s*:?\s*([A-Za-z0-9][A-Za-z0-9\-_/]{2,30})/i,
  ];
  for (const re of muster) {
    const m = t.match(re);
    if (m) return decodeEntities(m[1]).trim();
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Fachlogik gegen den alten Shop                                      */
/* ------------------------------------------------------------------ */

/** Stellt sicher, dass die Session eine PHPSESSID hat. */
async function ensureUpstreamSession(session) {
  if (session.cookies.has('PHPSESSID')) return [];
  const res = await upstream('GET', `${UPSTREAM_ORIGIN}/`, { session });
  return res.logs;
}

/** Exakt die sieben Felder des Live-Formulars, in derselben Reihenfolge. */
function buildAddBody({ artikel, anzahl, attribut, kommentar }) {
  return buildForm([
    [`attribute[${DEMO.attributName}]`, attribut],
    ['kommentar', kommentar ?? ''],
    ['anzahl', String(anzahl)],
    ['price_updates', DEMO.priceUpdates],
    ['price_incomplete_prefix', 'ab'],
    ['artikel', String(artikel)],
    ['addtocart', 'In den Warenkorb'],
  ]);
}

async function readCart(session) {
  const logs = await ensureUpstreamSession(session);
  const res = await upstream('GET', `${UPSTREAM_ORIGIN}${CART_PATH}`, { session });
  const cart = parseCart(decodeBody(res.buffer));
  return { cart, logs: [...logs, ...res.logs] };
}

async function addToCart(session, payload) {
  const logs = await ensureUpstreamSession(session);
  const body = buildAddBody(payload);
  const res = await upstream('POST', `${UPSTREAM_ORIGIN}${CART_PATH}`, { session, body });
  const cart = parseCart(decodeBody(res.buffer));
  return { cart, logs: [...logs, ...res.logs], status: res.status };
}

/** Setzt die Menge einer Position (0 = entfernen). */
async function setQuantity(session, key, anzahl) {
  const body = buildForm([
    ['settocart[key]', key],
    ['settocart[anzahl]', String(anzahl)],
  ]);
  const res = await upstream('POST', `${UPSTREAM_ORIGIN}${CART_PATH}`, { session, body });
  return { cart: parseCart(decodeBody(res.buffer)), logs: res.logs };
}

async function clearCart(session) {
  const logs = [];
  let read;
  try {
    read = await readCart(session);
    logs.push(...read.logs);
  } catch {
    read = null;
  }

  const keys = (read?.cart.items || []).map((i) => i.key).filter(Boolean);
  let cart = read?.cart ?? null;

  // Weg 1: jede Position ueber settocart[anzahl]=0 entfernen
  for (const key of keys) {
    try {
      const r = await setQuantity(session, key, 0);
      logs.push(...r.logs);
      cart = r.cart;
    } catch (err) {
      console.error('  [clear] Position konnte nicht entfernt werden:', err.message);
    }
  }

  // Weg 2 (Fallback): Session verwerfen -> frische Upstream-Session
  if (!cart || (cart.count != null && cart.count > 0) || cart.items.length > 0) {
    session.cookies.clear();
    session.created = Date.now();
    const fresh = await readCart(session);
    logs.push(...fresh.logs);
    cart = fresh.cart;
    console.log('  [clear] Fallback: neue Upstream-Session gestartet.');
  }

  return { cart, logs };
}

/**
 * Der Preis haengt am gewaehlten Attribut: ohne Bedruckung 47,60 EUR,
 * mit individueller Bedruckung 56,17 EUR (attributepreis 8,57). Deshalb
 * MUSS das Attribut mitgeschickt werden -- sonst zeigt die Seite einen
 * anderen Preis an, als spaeter in den Warenkorb wandert.
 */
async function fetchPrice(session, anzahl, attribut) {
  await ensureUpstreamSession(session);
  const url =
    `${UPSTREAM_ORIGIN}${PRICE_PATH}?getpricejson=1` +
    `&artikel=${DEMO.artikel}&anzahl=${encodeURIComponent(anzahl)}` +
    `&${encodeURIComponent(`attribute[${DEMO.attributName}]`)}=${encodeURIComponent(attribut)}`;
  const res = await upstream('GET', url, { session });
  let json = null;
  try {
    json = JSON.parse(decodeBody(res.buffer));
  } catch {
    json = { error: true, message: 'Antwort war kein gueltiges JSON.' };
  }
  return { json, logs: res.logs };
}

/* ------------------------------------------------------------------ */
/* Bestellstrecke                                                      */
/* ------------------------------------------------------------------ */

/**
 * Der Torwaechter fuer Geld. Wird an drei Stellen aufgerufen: beim Setzen
 * der Optionen, beim Erzeugen der Vorschau und noch einmal unmittelbar vor
 * dem Absenden -- auch dann, wenn die Zahlungsart auf anderem Weg in die
 * Upstream-Sitzung gelangt sein sollte.
 */
function pruefeZahlungsart(wert) {
  // Kein String -> kein Vertrauen. Der Wert faellt dann unten durch die
  // Allowlist und wird abgelehnt (fail-closed), statt koerziert zu werden.
  const z = (nurText(wert) ?? '').trim();
  if (ZAHLUNGSARTEN_VERBOTEN.has(z)) {
    return `Zahlungsart ${z} (${ZAHLUNGSARTEN_VERBOTEN.get(z)}) ist in dieser Demo gesperrt: ` +
      'sie wuerde zum Zahlungsdienstleister Worldline/Ogone weiterleiten. ' +
      'Zugelassen sind nur Vorkasse und Rechnung -- dabei fliesst kein Geld.';
  }
  if (!ZAHLUNGSARTEN_ERLAUBT.has(z)) {
    return `Unbekannte Zahlungsart "${z}". Zugelassen sind nur ` +
      [...ZAHLUNGSARTEN_ERLAUBT].join(' und ') + '.';
  }
  return null;
}

/** Liest die Warenkorbseite und gibt Warenkorb + Kasse-Optionen zurueck. */
async function readCartMitOptionen(session) {
  const logs = await ensureUpstreamSession(session);
  const res = await upstream('GET', `${UPSTREAM_ORIGIN}${CART_PATH}`, { session });
  const html = decodeBody(res.buffer);
  return {
    cart: parseCart(html),
    optionen: parseKasseOptionen(html),
    konto: parseKontoMenue(html),
    logs: [...logs, ...res.logs],
  };
}

/**
 * Setzt Land, Versandart und Zahlungsart. Das Altsystem verschickt diese drei
 * Felder als EIN Formular (jedes onchange schickt das ganze Formular ab),
 * darum werden sie hier auch zusammen gesetzt.
 */
async function setzeKasseOptionen(session, { land, versandart, zahlungsart }) {
  const logs = await ensureUpstreamSession(session);
  const body = buildForm([
    ['adresse[land]', land],
    ['versandart', versandart],
    ['zahlungsart', zahlungsart],
  ]);
  const res = await upstream('POST', `${UPSTREAM_ORIGIN}${CART_PATH}`, { session, body });
  const html = decodeBody(res.buffer);
  return {
    cart: parseCart(html),
    optionen: parseKasseOptionen(html),
    logs: [...logs, ...res.logs],
    gesendet: { 'adresse[land]': land, versandart, zahlungsart },
  };
}

/** Holt das leere bzw. vorbelegte Adressformular (Laenderliste + Werte). */
async function leseAdressFormular(session) {
  const logs = await ensureUpstreamSession(session);
  const res = await upstream('GET', `${UPSTREAM_ORIGIN}${ADDRESS_PATH}`, { session });
  const html = decodeBody(res.buffer);
  return {
    felder: ADRESS_FELDER,
    laender: parseSelect(html, 'adress[land]').optionen,
    werte: parseAdressWerte(html),
    konto: parseKontoMenue(html),
    logs: [...logs, ...res.logs],
  };
}

/**
 * Speichert die Lieferadresse im Altsystem.
 *
 * Der Trick zur Erfolgserkennung: bei gueltigen Daten antwortet /adresse mit
 * 302 auf /bestellen, bei ungueltigen mit 200 und demselben Formular samt
 * Fehlermeldungen. Der erste Statuscode der Kette verraet also das Ergebnis --
 * verlaesslicher, als im HTML nach Fehlertexten zu suchen.
 */
async function speichereAdresse(session, werte) {
  const logs = await ensureUpstreamSession(session);

  // nurText() statt String(): ein Nicht-String wird zu einem leeren Feld,
  // statt koerziert zu werden oder (bei eigener toString()) zu werfen.
  const paare = [];
  for (const f of ADRESS_FELDER) {
    paare.push([`adress[${f.name}]`, (nurText(werte[f.name]) ?? '').slice(0, 500)]);
  }
  if (werte.abweichende_rechnung) {
    paare.push(['adress[abweichende_rechnung]', '1']);
    for (const name of RECHNUNG_FELDER) {
      paare.push([`adress[${name}]`, (nurText(werte[name]) ?? '').slice(0, 500)]);
    }
  }
  if (werte.agb) paare.push(['adress[agb]', 'on']);
  paare.push(['save', 'weiter zur Anfrageübersicht']);

  const res = await upstream('POST', `${UPSTREAM_ORIGIN}${ADDRESS_PATH}`, {
    session,
    body: buildForm(paare),
  });
  const html = decodeBody(res.buffer);

  const erst = res.logs[0] || {};
  const gespeichert = erst.status >= 300 && erst.status < 400;

  return {
    gespeichert,
    fehler: gespeichert ? [] : parseAdressFehler(html),
    gesendet: paare.map(([name, wert]) => ({ name, wert })),
    logs: [...logs, ...res.logs],
  };
}

/**
 * Der komplette Bestellstand vor dem Absenden.
 *
 * `bereit` sagt, ob der finale Schritt ueberhaupt moeglich ist. Nein heisst
 * es u. a., wenn /bestellen auf /adresse umleitet (dann fehlt die Adresse)
 * oder wenn im Altsystem eine Ogone-Zahlungsart gesetzt ist.
 *
 * `vorabStand` ist eine bereits gelesene Warenkorbseite (readCartMitOptionen).
 * Der Bestell-Endpunkt liest sie ohnehin, um die Zahlungsart zu pruefen --
 * ohne diesen Parameter holte leseVorschau() unmittelbar danach dieselbe
 * Seite ein zweites Mal. Bei rund 1,3 s je Anfrage an das Altsystem ist das
 * eine geschenkte Sekunde, und in einer Netlify Function mit zehn Sekunden
 * Gesamtbudget zaehlt die.
 *
 * Sicherheitlich aendert das nichts: geprueft wird derselbe Zustand, nur
 * eben einmal gelesen statt zweimal. Die zweite, UNABHAENGIGE Quelle bleibt
 * bestehen -- der Zahlungsart-Klartext der Uebersichtsseite /bestellen wird
 * weiterhin frisch geholt und gegengelesen.
 */
async function leseVorschau(session, { vorabStand = null } = {}) {
  const stand = vorabStand || await readCartMitOptionen(session);
  const logs = [...stand.logs];

  const zahlungsart = stand.optionen.zahlungsart.gewaehlt;
  const zahlungsartFehler = pruefeZahlungsart(zahlungsart);

  // Kein Redirect verfolgen: die Umleitung SELBST ist die Auskunft.
  const res = await upstream('GET', `${UPSTREAM_ORIGIN}${ORDER_PATH}`, {
    session,
    maxRedirects: 0,
  });
  logs.push(...res.logs);

  const umleitung = res.status >= 300 && res.status < 400 ? String(res.headers.location || '') : null;
  const html = umleitung ? '' : decodeBody(res.buffer);
  const uebersicht = umleitung ? null : parseUebersicht(html);

  const huerden = [];
  if (umleitung) {
    huerden.push(
      `Das Altsystem leitet ${ORDER_PATH} auf ${umleitung} um -- die Lieferadresse fehlt noch ` +
      'oder der Warenkorb ist leer.'
    );
  }
  if (zahlungsartFehler) huerden.push(zahlungsartFehler);

  // Zweite, unabhaengige Quelle: die Uebersichtsseite schreibt die Zahlungsart
  // im Klartext aus ("Zahlungsart: Vorkasse"). Weichen die beiden Quellen ab
  // -- etwa weil das Altsystem intern etwas anderes gesetzt hat als das
  // angehakte Radio im Warenkorb --, gewinnt die Ablehnung.
  if (/paypal|kredit|ogone|worldline/i.test(uebersicht?.zahlungsartText || '')) {
    huerden.push(
      `Die Bestelluebersicht des Altsystems weist "${uebersicht.zahlungsartText}" als Zahlungsart aus. ` +
      'Das ist ein Weg ueber einen Zahlungsdienstleister und in dieser Demo gesperrt. ' +
      'Bitte im Warenkorb auf Vorkasse oder Rechnung umstellen.'
    );
  }

  if (uebersicht && !uebersicht.absendeknopf) {
    huerden.push('Auf der Uebersichtsseite steht kein Absende-Knopf -- der Bestellabschluss ist nicht freigegeben.');
  }
  if (stand.cart.items.length === 0) huerden.push('Der Warenkorb ist leer.');

  const bereit = huerden.length === 0;

  return {
    bereit,
    huerden,
    warenkorb: stand.cart,
    optionen: stand.optionen,
    konto: stand.konto,
    uebersicht,
    umleitung,
    /**
     * Die vollstaendige Beschreibung dessen, was beim finalen Klick rausgeht.
     * Bewusst als Rohdaten: Methode, Adresse, Header, jedes Feld mit Wert und
     * der fertige Body -- damit vorher sichtbar ist, was passiert.
     */
    finalRequest: {
      methode: 'POST',
      url: `${UPSTREAM_ORIGIN}${ORDER_PATH}`,
      // Genau die Header, die rawRequest() gleich wirklich setzt -- dieselbe
      // Funktion, nicht eine abgetippte Zweitfassung. Dazu kommt nur noch
      // Content-Length (aus der Laenge des Bodys) und der Cookie.
      header: {
        ...postHeaders(),
        'Content-Length': String(Buffer.byteLength(buildForm([[BESTELL_FELD, BESTELL_WERT]]))),
        Cookie: 'PHPSESSID der Proxy-Sitzung (hier nicht ausgeschrieben)',
      },
      felder: [{ name: BESTELL_FELD, wert: BESTELL_WERT }],
      body: buildForm([[BESTELL_FELD, BESTELL_WERT]]),
      bodyKodierung: 'utf-8 (Leerzeichen als "+", Rest prozentkodiert)',
      wirkung:
        'Das Altsystem legt eine echte Bestellung an, verschickt die Auftragsbestaetigung ' +
        'per E-Mail an die oben genannte Adresse und leitet auf /danke weiter.',
      gesperrt: [...ZAHLUNGSARTEN_VERBOTEN.keys()],
      bestaetigungsfeld: { bestaetigung: BESTELL_BESTAETIGUNG },
    },
    upstream: logs,
  };
}

/**
 * Der finale Schritt. Prueft noch einmal alles nach und schickt dann genau
 * ein Feld ab. Die Rohantwort bleibt in der Sitzung liegen, damit
 * /api/kasse/raw sie spaeter als Beweis ausliefern kann.
 */
async function bestellungAbschicken(session, { vorabStand = null } = {}) {
  const vorschau = await leseVorschau(session, { vorabStand });
  if (!vorschau.bereit) {
    return { ok: false, huerden: vorschau.huerden, vorschau, logs: vorschau.upstream };
  }

  const body = buildForm([[BESTELL_FELD, BESTELL_WERT]]);
  const res = await upstream('POST', `${UPSTREAM_ORIGIN}${ORDER_PATH}`, { session, body });
  const html = decodeBody(res.buffer);

  session.bestellAntwort = { html, zeit: Date.now(), url: res.finalUrl };

  return {
    ok: res.status >= 200 && res.status < 400,
    status: res.status,
    finalUrl: res.finalUrl,
    bestellnummer: parseBestellnummer(html),
    rohantwort: textOf(
      firstMatch(html, /<div id="content">([\s\S]*?)<div class="derfooter">/i) || html
    ).slice(0, 1200),
    vorschau,
    logs: [...vorschau.upstream, ...res.logs],
  };
}

/**
 * Login beim Altsystem. Bei falschen Daten antwortet /login mit 200 und dem
 * Text "Username oder Password sind falsch!" -- ein Statuscode allein reicht
 * hier also nicht, der Seitentext muss mitgelesen werden.
 */
async function kontoLogin(session, email, passwort) {
  const logs = await ensureUpstreamSession(session);
  const body = buildForm([
    ['login[email]', email],
    ['login[password]', passwort],
    ['login[submit]', 'Login'],
  ]);
  const res = await upstream('POST', `${UPSTREAM_ORIGIN}${LOGIN_PATH}`, { session, body });
  const html = decodeBody(res.buffer);

  const meldung = firstMatch(html, /<div[^>]*class=['"][^'"]*(?:alert|error|fehler)[^'"]*['"][^>]*>([\s\S]*?)<\/div>/i);
  const falsch = /Username oder Password sind falsch/i.test(html);
  const konto = parseKontoMenue(html);

  return {
    eingeloggt: konto.eingeloggt && !falsch,
    konto,
    fehler: falsch
      ? 'Username oder Password sind falsch! (Meldung des Altsystems)'
      : (konto.eingeloggt ? null : (textOf(meldung) || 'Das Altsystem hat die Anmeldung nicht bestaetigt.')),
    logs: [...logs, ...res.logs],
  };
}

/**
 * Registrierung sondieren bzw. durchreichen.
 *
 * Stand der Sondierung: /register liefert 200, enthaelt aber KEIN Formular --
 * nur einen Begruessungstext. POSTs dorthin aendern nichts. Ein Kundenkonto
 * laesst sich ueber die Oberflaeche also nicht anlegen. Statt das fest zu
 * verdrahten, wird hier jedes Mal live nachgesehen: taucht doch ein Formular
 * auf, werden die uebergebenen Felder durchgereicht.
 */
async function kontoRegister(session, felder) {
  const logs = await ensureUpstreamSession(session);
  const res = await upstream('GET', `${UPSTREAM_ORIGIN}${REGISTER_PATH}`, { session });
  const html = decodeBody(res.buffer);
  logs.push(...res.logs);

  const inhalt = firstMatch(html, /<div id="content">([\s\S]*?)<div class="derfooter">/i) || '';
  const formular = firstMatch(inhalt, /<form\b[\s\S]*?<\/form>/i, 0);

  if (!formular) {
    return {
      ok: false,
      moeglich: false,
      felder: [],
      fehler: [
        {
          feld: null,
          meldung:
            `Das Altsystem stellt unter ${REGISTER_PATH} kein Registrierungsformular bereit ` +
            '(Status 200, aber nur ein Begruessungstext). Ein Kundenkonto laesst sich hier ' +
            'nicht anlegen. Die Bestellung funktioniert ohne Konto -- die Adresse wird direkt ' +
            'im Bestellvorgang erfasst.',
        },
      ],
      seiteninhalt: textOf(inhalt).slice(0, 400),
      logs,
    };
  }

  // Falls das Altsystem doch ein Formular liefert: Felder durchreichen.
  const namen = [...formular.matchAll(/name=['"]([^'"]+)['"]/gi)].map((m) => m[1]);
  const paare = namen
    .filter((n, i) => namen.indexOf(n) === i)
    .map((n) => [n, (nurText(felder?.[n]) ?? '').slice(0, 500)]);
  const post = await upstream('POST', `${UPSTREAM_ORIGIN}${REGISTER_PATH}`, {
    session,
    body: buildForm(paare),
  });
  logs.push(...post.logs);
  const antwort = decodeBody(post.buffer);

  return {
    ok: false,
    moeglich: true,
    felder: namen,
    fehler: parseAdressFehler(antwort),
    seiteninhalt: textOf(
      firstMatch(antwort, /<div id="content">([\s\S]*?)<div class="derfooter">/i) || ''
    ).slice(0, 800),
    logs,
  };
}

/* ================================================================== */
/* KATALOG  --  Kategorien, Produktlisten, Produktdetails, Suche       */
/* ================================================================== */
/*
 * Aufgeklaerte Struktur von matten.de (Stand 2026-08, siehe KATALOG.md):
 *
 *   Seitentyp  ->  <body class='page_<slug> class_<typ>'>
 *                  class_kategoriepage | class_artikelpage
 *                  class_suchepage     | class_infocmspage
 *
 *   Kategoriebaum: exakt zwei Ebenen.
 *     Ebene 1  = Hauptnavigation der Startseite (8 Eintraege)
 *     Ebene 2  = maschinell erzeugtes Untermenue im Megamenue (16 Eintraege)
 *
 *   Produktpfade sind /kategorie/slug oder /kategorie/unterkategorie/slug.
 *   Der Slug ist NUR TEILWEISE die Artikelnummer (6303041); oft ist es ein
 *   Namenskuerzel (attache, optibrush). Pfade sind gross-/kleinschreibungs-
 *   unempfindlich; unbekannte Pfade antworten mit 302 auf "/".
 *
 *   Es gibt KEINE Blaetterung: ?seite=1 ist die ganze Kategorie, ?seite=2
 *   liefert eine leere Liste. Die Blaetterung hier ist darum unsere eigene.
 */

/** Wie lange Katalogdaten zwischengespeichert werden. */
const KATALOG_TTL_MS = 10 * 60 * 1000;

/** Suchseite des Altsystems. Der Parameter heisst "search". */
const SUCH_PFAD = '/suche';

/** Voreinstellung und Obergrenze der Blaetterung. */
const SEITE_STANDARD = 24;
const SEITE_MAX = 200;

/** Sprachen der Sprachumschaltung des Altsystems. */
const SPRACHEN = new Set(['de', 'en', 'id']);

/* ------------------------------------------------------------------ */
/* Kleiner Cache mit Verfallszeit                                      */
/* ------------------------------------------------------------------ */

/** schluessel -> { zeit, wert } */
const katalogCache = new Map();
/**
 * Obergrenze des Katalog-Zwischenspeichers.
 *
 * 1200 statt der frueheren 400: build-katalog.mjs baut erst den kompletten
 * Katalog (Baum + 24 Kategorieseiten + 365 Artikelseiten = rund 390 Eintraege)
 * und liest ihn danach fuer die Netlify-Daten noch einmal aus. Mit 400
 * Eintraegen haette die LRU-Verdraengung mitten im Bau begonnen und den
 * zweiten Durchgang alles noch einmal vom Altsystem holen lassen -- fast
 * 400 vermeidbare Anfragen.
 */
const CACHE_MAX_EINTRAEGE = 1200;

function cacheLies(schluessel) {
  const e = katalogCache.get(schluessel);
  if (!e) return null;
  if (Date.now() - e.zeit > KATALOG_TTL_MS) {
    katalogCache.delete(schluessel);
    return null;
  }
  // Neu einsortieren -> die Map ist damit grob nach Nutzung sortiert und
  // das Ausduennen unten wirft wirklich die kaeltesten Eintraege weg.
  katalogCache.delete(schluessel);
  katalogCache.set(schluessel, e);
  return e.wert;
}

function cacheSchreib(schluessel, wert) {
  katalogCache.set(schluessel, { zeit: Date.now(), wert });
  while (katalogCache.size > CACHE_MAX_EINTRAEGE) {
    const aeltester = katalogCache.keys().next().value;
    if (aeltester === undefined) break;
    katalogCache.delete(aeltester);
  }
}

// Abgelaufene Katalogeintraege aktiv wegraeumen -- sonst bliebe eine einmal
// abgefragte, nie wieder angefasste Kategorie bis zum Serverende liegen.
setInterval(() => {
  const jetzt = Date.now();
  for (const [k, v] of katalogCache) {
    if (jetzt - v.zeit > KATALOG_TTL_MS) katalogCache.delete(k);
  }
}, KATALOG_TTL_MS).unref();

/* ------------------------------------------------------------------ */
/* Upstream-Zugriff fuer Katalogseiten                                 */
/* ------------------------------------------------------------------ */

/**
 * Katalogseiten sind fuer alle Besucher gleich. Sie laufen deshalb NICHT
 * ueber die Besucher-Sitzung, sondern ueber eine eigene Sitzung pro Sprache.
 *
 * Zwei Gruende: der Warenkorb-Zustand eines Besuchers hat auf einer
 * Produktseite nichts zu suchen (sonst kaeme er ueber den Cache auch bei
 * anderen Besuchern an), und ohne feste Sitzung legte das Altsystem bei
 * jedem Katalogaufruf eine neue PHPSESSID an.
 */
const katalogSitzungen = new Map();

function katalogSitzung(sprache) {
  const key = sprache || 'de';
  if (!katalogSitzungen.has(key)) {
    katalogSitzungen.set(key, { cookies: new Map(), created: Date.now() });
  }
  return katalogSitzungen.get(key);
}

/**
 * Fuehrt Aufgaben mit begrenzter Parallelitaet aus. Der Altshop ist ein
 * langsames Legacy-System -- 30 gleichzeitige Anfragen waeren unhoeflich
 * und wuerden reihenweise in den Timeout laufen.
 */
async function parallel(elemente, grenze, fn) {
  const ergebnis = new Array(elemente.length);
  let naechster = 0;
  const anzahl = Math.max(1, Math.min(grenze, elemente.length));
  await Promise.all(
    Array.from({ length: anzahl }, async () => {
      for (;;) {
        const i = naechster++;
        if (i >= elemente.length) return;
        try {
          ergebnis[i] = await fn(elemente[i], i);
        } catch (err) {
          ergebnis[i] = { fehler: err && err.message ? err.message : String(err) };
        }
      }
    })
  );
  return ergebnis;
}

/** Eine einzelne Anfrage samt Wiederholung bei gekappter Verbindung. */
async function holeRoh(url, sitzung, versuche) {
  let letzterFehler = null;
  for (let versuch = 1; versuch <= Math.max(1, versuche); versuch++) {
    try {
      return await upstream('GET', url, { session: sitzung, maxRedirects: 0 });
    } catch (err) {
      letzterFehler = err;
      // Das Altsystem kappt unter Last einzelne Verbindungen ("socket hang
      // up", ECONNRESET). Das ist keine Aussage ueber den Pfad, sondern
      // ueber die Tagesform des Servers -- darum ein zweiter, spaeterer
      // Versuch, statt die Kategorie als "nicht ermittelbar" zu melden.
      const wiederholbar = /socket hang up|ECONNRESET|EPIPE|ETIMEDOUT|Timeout/i.test(err.message || '');
      if (!wiederholbar || versuch >= versuche) break;
      console.log(`  [katalog] ${url}: ${err.message} -- Versuch ${versuch + 1} in ${800 * versuch} ms`);
      await new Promise((r) => setTimeout(r, 800 * versuch));
    }
  }
  throw letzterFehler || new Error('Upstream lieferte keine Antwort.');
}

/**
 * Holt eine Seite des Altsystems als Text.
 *
 * Der Shop nutzt Umleitungen fuer zwei voellig verschiedene Dinge, und die
 * Unterscheidung ist der Kern dieser Funktion:
 *
 *   302 auf "/"        -> "gibt es nicht". Das Altsystem hat keine
 *                         404-Seite; jeder unbekannte Pfad landet so auf
 *                         der Startseite. Hier wird daraus `umleitung`.
 *   301 auf einen Pfad -> "ist umgezogen". Alte Adressen wie
 *                         /home/6303011 zeigen dauerhaft auf den
 *                         kanonischen Pfad /logomatten/bierbankmatten/...
 *                         Dem wird gefolgt, und `kanonisch` haelt fest,
 *                         wo die Seite wirklich liegt.
 *
 * Wuerde man beides gleich behandeln, fielen alle ueber die Suche
 * gefundenen /home/...-Adressen als "gibt es nicht" durch.
 */
async function holeSeite(pfad, { sprache = null, versuche = 2, maxHops = 3, sitzung: eigene = null } = {}) {
  const sitzung = eigene || katalogSitzung(sprache);
  const logs = [];
  let aktuell = pfad;
  let kanonisch = null;

  for (let hop = 0; hop <= maxHops; hop++) {
    const url =
      `${UPSTREAM_ORIGIN}${aktuell}` +
      (sprache ? (aktuell.includes('?') ? '&' : '?') + 'lang=' + sprache : '');
    const res = await holeRoh(url, sitzung, versuche);
    logs.push(...res.logs);

    const ziel = res.status >= 300 && res.status < 400 ? String(res.headers.location || '') : null;
    if (!ziel) {
      return { status: res.status, umleitung: null, kanonisch, html: decodeBody(res.buffer), logs };
    }

    // Ziel auf "/" oder auf einen fremden Host -> nicht folgen.
    const naechster = normalisierePfad(ziel);
    if (!naechster || naechster === aktuell || hop >= maxHops) {
      return { status: res.status, umleitung: ziel, kanonisch, html: '', logs };
    }
    kanonisch = naechster;
    aktuell = naechster;
  }
  return { status: 508, umleitung: 'zu viele Umleitungen', kanonisch, html: '', logs };
}

/* ------------------------------------------------------------------ */
/* Pfad-Hygiene                                                        */
/* ------------------------------------------------------------------ */

/**
 * Nimmt einen Pfad aus einer Anfrage und macht daraus etwas, das an
 * matten.de gehen darf. Fail-closed: alles Zweifelhafte wird null.
 *
 * Erlaubt sind ein bis drei Pfadsegmente ohne Query und ohne Traversal.
 * Die Schreibweise bleibt erhalten (der Shop ist zwar unempfindlich, aber
 * wir wollen nicht darauf wetten); fuer den Cache wird separat kleingesetzt.
 */
function normalisierePfad(roh) {
  const s = nurText(roh);
  if (s === null) return null;
  let p = s.trim();
  if (!p) return null;

  if (/^https?:\/\//i.test(p)) {
    let u;
    try {
      u = new URL(p);
    } catch {
      return null;
    }
    if (u.hostname !== UPSTREAM_HOST && u.hostname !== `www.${UPSTREAM_HOST}`) return null;
    p = u.pathname;
  }
  if (p.includes('#') || p.includes('?')) p = p.split('#')[0].split('?')[0];
  try {
    p = decodeURIComponent(p);
  } catch {
    return null;
  }
  if (p.includes('\0') || p.includes('\\') || p.includes('%')) return null;

  const segmente = p.split('/').filter(Boolean);
  if (segmente.length < 1 || segmente.length > 3) return null;
  for (const seg of segmente) {
    if (seg === '.' || seg === '..' || seg.length > 120) return null;
    // Steuerzeichen und Leerzeichen haben in Shop-Pfaden nichts verloren.
    if (/[\u0000-\u0020]/.test(seg)) return null;
  }
  return '/' + segmente.join('/');
}

/** Einheitlicher Cache-Schluessel: kleingeschrieben, ohne Schraegstrich am Ende. */
function pfadSchluessel(pfad) {
  return String(pfad).toLowerCase().replace(/\/+$/, '') || '/';
}

/** Sprache aus der Anfrage, sonst null (= Voreinstellung des Shops: de). */
function normalisiereSprache(roh) {
  const s = (nurText(roh) ?? '').trim().toLowerCase();
  if (!s || s === 'de') return null;
  return SPRACHEN.has(s) ? s : null;
}

/* ------------------------------------------------------------------ */
/* HTML-Hilfen                                                         */
/* ------------------------------------------------------------------ */

/**
 * Schneidet den Inhaltsbereich einer Shop-Seite heraus.
 *
 * Muster: <div id="content"> ... <div class="derfooter">
 *
 * Das ist nicht Kosmetik, sondern noetig: das Megamenue im Seitenkopf
 * enthaelt dieselben CSS-Klassen wie der Produktbereich. Ohne diesen
 * Schnitt zaehlte jeder Parser die Menuekacheln als Produkte mit.
 */
function inhaltsbereich(html) {
  if (typeof html !== 'string') return '';
  const von = html.indexOf('<div id="content">');
  if (von < 0) return html;
  const bis = html.indexOf('<div class="derfooter"', von);
  return html.slice(von, bis > von ? bis : html.length);
}

/**
 * Wert eines Attributs aus einem einzelnen Tag.
 *
 * Wichtig ist die Rueckwaertsreferenz auf das oeffnende Anfuehrungszeichen:
 * der Shop schreibt Werte mit Anfuehrungszeichen darin, etwa
 *   value='ja, Vorlage-Datei senden an: "info@matten.de"'
 * Ein Muster wie ["']([^"']*)["'] haette daraus
 *   'ja, Vorlage-Datei senden an: '
 * gemacht -- und der Warenkorb haette einen Wert bekommen, den das
 * Altsystem nicht kennt.
 */
function attribut(tag, name) {
  // Davor muss ein Leerzeichen (oder der Anfang) stehen, nicht nur eine
  // Wortgrenze: "\bname=" traefe sonst auch das "name" in "data-name=" --
  // der Bindestrich ist fuer \b eine Grenze. Die Farbwaehler-Tags des Shops
  // tragen data-color neben value; solche Nachbarschaften sind hier normal.
  const m = String(tag).match(new RegExp(`(?:^|\\s)${reEscape(name)}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return m ? decodeEntities(m[2]) : null;
}

/** Text eines HTML-Schnipsels, auf eine Hoechstlaenge gekuerzt. */
function kurztext(html, max = 400) {
  const t = textOf(html);
  if (!t) return null;
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

/**
 * Zerlegt einen WYSIWYG-Beschreibungsblock in Absaetze.
 *
 * Die Beschreibungen im Altsystem sind von Hand gepflegtes HTML mit inline
 * gesetzten Farben und Schriftgroessen. Dieses HTML wird bewusst NICHT
 * durchgereicht -- ein neues Frontend soll das Layout des Altsystems nicht
 * erben, und ungefiltertes Fremd-HTML im eigenen Dokument ist zudem eine
 * offene Tuer. Stattdessen: Text, an <br>, </p>, </h*> und </li> getrennt.
 */
function absaetze(html, maxAbsaetze = 60) {
  if (typeof html !== 'string' || !html) return [];
  const roh = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|table)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ');
  return decodeEntities(roh)
    .split('\n')
    .map((z) => z.replace(/[ \t ]+/g, ' ').trim())
    .filter((z) => z.length > 1)
    .slice(0, maxAbsaetze);
}

/* ------------------------------------------------------------------ */
/* Parser: Seitentyp und Brotkrumen                                    */
/* ------------------------------------------------------------------ */

/**
 * Seitentyp aus der body-Klasse.
 * Muster: <body class='page_bierbankmatten class_kategoriepage'>
 *
 * Das ist das einzige verlaessliche Unterscheidungsmerkmal des Shops:
 * Kategorie- und Artikelseiten haben denselben Pfadaufbau und dieselbe
 * Rahmenstruktur. Faellt die Klasse weg, gibt der Parser null zurueck --
 * der Aufrufer meldet dann "unbekannter Seitentyp" statt zu raten.
 */
function parseSeitentyp(html) {
  const cls = firstMatch(html, /<body[^>]*class=['"]([^'"]*)['"]/i);
  if (!cls) return null;
  if (/\bclass_artikelpage\b/.test(cls)) return 'artikel';
  if (/\bclass_kategoriepage\b/.test(cls)) return 'kategorie';
  if (/\bclass_suchepage\b/.test(cls)) return 'suche';
  if (/\bclass_infocmspage\b/.test(cls)) return 'info';
  return null;
}

/**
 * Brotkrumen einer Artikelseite.
 * Muster: <div class='breadcrumbs'><a href='/logomatten'>Logomatten</a> &raquo; ...
 *
 * Der letzte Eintrag ist die Seite selbst. Kategorieseiten haben keine
 * Brotkrumen -- dort ist das Ergebnis eine leere Liste, kein Fehler.
 */
function parseBrotkrumen(html) {
  const block = firstMatch(html, /<div class=['"]breadcrumbs['"]>([\s\S]*?)<\/div>/i);
  if (!block) return [];
  return [...block.matchAll(/<a[^>]*href=['"]([^'"]*)['"][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ pfad: m[1], name: textOf(m[2]) || null }))
    .filter((e) => e.pfad);
}

/* ------------------------------------------------------------------ */
/* Parser: Kategoriebaum aus der Startseite                            */
/* ------------------------------------------------------------------ */

/**
 * Die acht Eintraege der Hauptnavigation.
 *
 * Muster: <ul class="nav nav_main navbar-nav"> ...
 *           <li class='dropdown active-button'>
 *             <a class="dropdown-toggle" ... href='/fussmatten'>Fussmatten<span class="caret">
 *
 * Nur der Bereich <nav id="main_navigation"> ... </nav> wird betrachtet.
 */
function parseHauptnavigation(html) {
  const von = html.indexOf('<nav id="main_navigation"');
  if (von < 0) return [];
  const bis = html.indexOf('</nav>', von);
  const nav = html.slice(von, bis > von ? bis : html.length);

  const liste = firstMatch(nav, /<ul class="nav nav_main navbar-nav">([\s\S]*)$/i);
  if (!liste) return [];

  const out = [];
  const gesehen = new Set();
  for (const m of liste.matchAll(/<li class='dropdown[^']*'>\s*<a\b([^>]*)>([\s\S]*?)<span class="caret">/gi)) {
    const pfad = attribut(m[1], 'href');
    const name = textOf(m[2]);
    if (!pfad || !pfad.startsWith('/') || !name) continue;
    const schluessel = pfadSchluessel(pfad).replace(/^\//, '');
    if (!schluessel || gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    out.push({ schluessel, name, pfad: pfad.replace(/\/+$/, '') || '/' });
  }
  return out;
}

/**
 * Die Unterkategorien aus dem maschinell erzeugten Teil des Megamenues.
 *
 * Muster (exakt diese Klassenkombination, von der Shop-Software erzeugt):
 *   <li class="dropdown-menu-products-item col-sm-4 col-md-3 col-lg-2">
 *     <div class="dropdown-menu-products-item-thumbnail thumbnail">
 *       <div class="caption text-center">
 *         <a href="/logomatten/bierbankmatten">Biergartenbank-Matten</a>
 *
 * Wichtig: die von Hand gepflegten Menuekacheln daneben tragen
 * "col-xs-6 col-sm-4 col-md-2" und enthalten Bilder und title-Attribute.
 * Genau daran unterscheiden sich beide -- die Klassenkombination oben ist
 * die Nadel im Heuhaufen und liefert exakt die 16 echten Unterkategorien
 * samt der Namen, die auch in den Brotkrumen stehen.
 *
 * NUR auf die STARTSEITE anwenden. Auf einer Artikelseite haengt der Shop
 * den gerade betrachteten Artikel als 17. Eintrag in dieselbe Liste --
 * dort waere das Ergebnis um genau diesen Artikel zu gross.
 */
function parseUntermenue(html) {
  const out = [];
  const gesehen = new Set();
  const re =
    /<li class="dropdown-menu-products-item col-sm-4 col-md-3 col-lg-2">[\s\S]{0,400}?<a\s+href="([^"]*)"\s*>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(re)) {
    const pfad = decodeEntities(m[1]).trim();
    const name = textOf(m[2]);
    if (!pfad.startsWith('/')) continue;
    const schluessel = pfadSchluessel(pfad).replace(/^\//, '');
    if (!schluessel.includes('/') || gesehen.has(schluessel)) continue;
    gesehen.add(schluessel);
    out.push({ schluessel, name: name || null, pfad: pfad.replace(/\/+$/, '') });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Parser: Produktliste einer Kategorie- oder Suchergebnisseite        */
/* ------------------------------------------------------------------ */

/**
 * Zerlegt eine Kategorie- oder Suchergebnisseite in Produktbloecke.
 *
 * Muster:
 *   <div class='artikel_grid clearafter'>          (Suche: 'artikel_grid')
 *     <div class="artikel" id="artikel_6303010">   (oder "artikel no_divider")
 *       <h3 class='titel'><a href="/pfad">Name</a></h3>
 *       <div class='artikelbilder_oben'>
 *          <a class="thumbnail" href="/pfad"><img src='/media/bild/x.jpg' alt='...'></a>
 *       </div>
 *       <div class='artikelbilder_galerie'></div>
 *       ... von Hand gepflegte Beschreibung ...
 *       <div class="more_info">
 *          <a class='pull-right btn btn-info' href="/pfad">&rarr; Online kaufen</a>
 *       </div>
 *     </div>
 *
 * Zwei Eigenheiten, an denen naive Parser scheitern:
 *
 *  1. Die <h3> FEHLT bei rund einem Drittel der Bloecke. Das sind die
 *     "Anfrage"-Geschwister (Sondermass zum selben Artikel), die im
 *     Altsystem keinen eigenen Namen haben. Der Produktpfad wird darum
 *     vorrangig aus more_info gelesen -- den Knopf haben alle Bloecke.
 *
 *  2. id="artikel_..." ist KEINE Artikelnummer, sondern ein frei
 *     vergebener Sprungmarken-Name ("artikel_STEWELL Grip 2000").
 *
 * Jedes Feld faellt einzeln auf null zurueck; ein kaputter Block wirft nie.
 */
function parseProduktliste(html) {
  const bereich = inhaltsbereich(html);
  const gridPos = bereich.search(/<div class=['"]artikel_grid[^'"]*['"]>/i);
  const quelle = gridPos >= 0 ? bereich.slice(gridPos) : bereich;

  const anfaenge = [...quelle.matchAll(/<div class="artikel(?: [^"]*)?" id="artikel_([^"]*)">/gi)];
  const produkte = [];

  for (let i = 0; i < anfaenge.length; i++) {
    const von = anfaenge[i].index;
    const bis = i + 1 < anfaenge.length ? anfaenge[i + 1].index : quelle.length;
    const block = quelle.slice(von, bis);
    try {
      const knopfTag = firstMatch(block, /<a\b[^>]*class=['"][^'"]*btn-info[^'"]*['"][^>]*>/i, 0);
      const knopfPfad = knopfTag ? attribut(knopfTag, 'href') : null;
      // Beschriftung ohne den fuehrenden Pfeil ("&rarr; Online kaufen").
      const knopfText = (
        textOf(firstMatch(block, /<div class="more_info">[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/i)) || ''
      ).replace(/^[→←>\s-]+/, '').trim() || null;

      const h3 = firstMatch(block, /<h3 class='titel'>([\s\S]*?)<\/h3>/i);
      const h3Tag = h3 ? firstMatch(h3, /<a\b[^>]*>/i, 0) : null;
      const h3Pfad = h3Tag ? attribut(h3Tag, 'href') : null;
      const name = h3 ? textOf(h3) || null : null;

      const pfad = normalisierePfad(knopfPfad || h3Pfad);
      if (!pfad) continue; // ohne Pfad ist der Block fuer ein Frontend wertlos

      // Bild: bevorzugt das Artikelbild aus artikelbilder_oben. Das ist
      // aber nur bei etwa jedem fuenften Produkt gefuellt -- bei den
      // uebrigen steckt das Bild im von Hand gepflegten Beschreibungstext.
      // Also zweiter Anlauf: das erste /media/-Bild des Blocks. Woher das
      // Bild stammt, steht in `bildQuelle`, damit die Herkunft nachvoll-
      // ziehbar bleibt.
      let bildTag = firstMatch(
        firstMatch(block, /<div class='artikelbilder_oben'>([\s\S]*?)<\/div>/i) || '',
        /<img\b[^>]*>/i,
        0
      );
      let bildQuelle = bildTag ? 'artikelbilder_oben' : null;
      if (!bildTag) {
        bildTag = firstMatch(block, /<img\b[^>]*src=['"]\/media\/[^'"]*['"][^>]*>/i, 0);
        if (bildTag) bildQuelle = 'beschreibung';
      }
      const bildRoh = bildTag ? attribut(bildTag, 'src') : null;

      // Beschreibung: alles zwischen der Bildergalerie und more_info.
      // Auf der Suchergebnisseite fehlt der more_info-Knopf -- dann bis
      // zum Blockende lesen, sonst bliebe dort jede Kurzbeschreibung leer.
      const rumpf =
        firstMatch(block, /<div class='artikelbilder_galerie'>[\s\S]*?<\/div>([\s\S]*?)<div class="more_info">/i) ||
        firstMatch(block, /<\/h3>([\s\S]*?)<div class="more_info">/i) ||
        firstMatch(block, /<div class='artikelbilder_galerie'>[\s\S]*?<\/div>([\s\S]*)$/i) ||
        firstMatch(block, /<\/h3>([\s\S]*)$/i) ||
        '';

      const segmente = pfad.split('/').filter(Boolean);
      const letztes = segmente[segmente.length - 1];

      // Bloecke ohne eigene Ueberschrift sind die Sondermass-/Anfrage-
      // Geschwister des zuletzt benannten Artikels: das Altsystem haengt
      // sie optisch an den Block darueber ("no_divider") und speichert bei
      // ihnen keinen eigenen Namen. Damit ein Frontend keine namenlosen
      // Kacheln zeigt, wird die Zugehoerigkeit hier festgehalten -- der
      // Name selbst wird NICHT erfunden.
      const vorheriger = produkte.length ? produkte[produkte.length - 1] : null;
      const elternteil = name ? null : (vorheriger ? (vorheriger.gehoertZu || vorheriger.pfad) : null);
      const elternName = name ? null : (vorheriger ? (vorheriger.nameGeerbt || vorheriger.name) : null);

      produkte.push({
        anker: anfaenge[i][1] || null,
        pfad,
        artikelnummer: letztes,
        artikelnummerNumerisch: /^\d+$/.test(letztes),
        name,
        variante: !name,
        gehoertZu: elternteil,
        nameGeerbt: elternName,
        bildOriginal: bildRoh,
        bild: mediaZuApiPfad(bildRoh),
        bildQuelle,
        bildAlt: bildTag ? attribut(bildTag, 'alt') : null,
        kurzbeschreibung: kurztext(rumpf, 400),
        knopf: knopfText || null,
        // "Online kaufen" = Artikel mit Preis und Warenkorb-Formular,
        // "Anfrage" = Sondermass/Anfrageartikel ohne Preis.
        modus: knopfText ? (/kauf/i.test(knopfText) ? 'kauf' : 'anfrage') : null,
      });
    } catch (err) {
      console.error('  [parser] Produktblock:', err.message);
    }
  }
  return produkte;
}

/** Zaehler der Suchseite: <h1>Suchergebnisse (384):</h1> */
function parseTrefferzahl(html) {
  const n = firstMatch(html, /Suchergebnisse\s*\((\d+)\)/i);
  return n == null ? null : Number(n);
}

/* ------------------------------------------------------------------ */
/* Parser: Artikelseite                                               */
/* ------------------------------------------------------------------ */

/**
 * Der Preisblock einer Artikelseite.
 *
 * Muster:
 *   <div class='produktpreis'>
 *      Preis: <span class='betrag'>47,60 &euro;</span>
 *      <div class='versand'>
 *         Versand nach Deutschland: <span class='betragversand'>11,90 &euro;</span>
 *         <br/> Inkl. Umsatzsteuer 19.00% <br/>
 *      </div>
 *   </div>
 *
 * Anfrageartikel ("in den Anfragenkorb") haben diesen Block GAR NICHT --
 * dann ist jedes Feld null. Das ist kein Parserfehler, sondern die Aussage
 * des Altsystems, dass es fuer diesen Artikel keinen Listenpreis gibt.
 *
 * Der Preis gilt fuer die vorausgewaehlte Variante und Lieferland
 * Deutschland. Sobald das Frontend Varianten aendert, muss es den Preis
 * ueber `kaufformular.preisAbfrage` neu holen.
 */
function parsePreis(html) {
  const block = firstMatch(html, /<div class='produktpreis'>([\s\S]*?)<div><label/i)
    || firstMatch(html, /<div class='produktpreis'>([\s\S]*?)<\/div>\s*<\/div>/i)
    || '';
  const preisText = textOf(firstMatch(block, /class='betrag'>([\s\S]*?)</i));
  const versandText = textOf(firstMatch(block, /class='betragversand'>([\s\S]*?)</i));
  const ustRoh = firstMatch(block, /Umsatzsteuer\s*([\d]+(?:[.,]\d+)?)\s*%/i);
  const ustSatz = ustRoh == null ? null : Number(String(ustRoh).replace(',', '.'));
  // "price_incomplete_prefix" = das "ab", das der Shop vor unvollstaendig
  // konfigurierte Preise setzt.
  const praefix = firstMatch(html, /name="price_incomplete_prefix" value="([^"]*)"/i);
  return {
    text: preisText || null,
    wert: toNumber(preisText),
    versandText: versandText || null,
    versand: toNumber(versandText),
    ustSatz: Number.isFinite(ustSatz) ? ustSatz : null,
    brutto: /Inkl\.?\s*Umsatzsteuer/i.test(block) ? true : null,
    unvollstaendigPraefix: praefix || null,
  };
}

/** Optionen eines <select>-Blocks. */
function parseOptionen(selectBlock) {
  const out = [];
  for (const m of String(selectBlock).matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)) {
    const wert = attribut(m[1], 'value') ?? '';
    const label = textOf(m[2]) || wert;
    out.push({ wert, label, gewaehlt: /\bselected\b/i.test(m[1]) });
  }
  return out;
}

/**
 * Das Kaufformular einer Artikelseite -- vollstaendig, so wie es das
 * Altsystem erwartet.
 *
 * Muster:
 *   <form id='artikelform278' class='artikel_buy_form' method='post' action='/warenkorb'>
 *     <select name='attribute[Individuelle Bedruckung]'>
 *        <option value='nein' selected='selected'>...</option>
 *     </select>
 *     <input type="radio" class="radio_item color_option"
 *            value="613-koenigsblau" name="attribute[Grundfarbe]">      (Farbwaehler)
 *     <select name='spezialoption[207][spezial][x]'>...</select>
 *     <input name='spezialoption[207][spezial][y]' min="110" max="350">
 *     <input name="kommentar"> <input name='anzahl' value='1'>
 *     <input type="hidden" name="price_updates" value="/pfad?getpricejson=1">
 *     <input type="hidden" name="price_incomplete_prefix" value="ab">
 *     <input type='hidden' name='artikel' value='278'>
 *     <input type='submit' name='addtocart' value='In den Warenkorb'>
 *   </form>
 *
 * Der Wert von `addtocart` unterscheidet die beiden Betriebsarten des Shops:
 *   "In den Warenkorb"   -> Kaufartikel, mit Preis
 *   "in den Anfragenkorb"-> Anfrageartikel, ohne Preis
 */
function parseKaufformular(html) {
  const bereich = inhaltsbereich(html);
  const von = bereich.search(/<form\b[^>]*class=['"][^'"]*artikel_buy_form[^'"]*['"][^>]*>/i);
  if (von < 0) return null;
  const bis = bereich.indexOf('</form>', von);
  const form = bereich.slice(von, bis > von ? bis + 7 : bereich.length);
  const formTag = firstMatch(form, /<form\b[^>]*>/i, 0) || '';

  const artikelId = firstMatch(form, /name=['"]artikel['"][^>]*value=['"](\d+)['"]/i)
    || firstMatch(form, /value=['"](\d+)['"][^>]*name=['"]artikel['"]/i);
  const addtocartTag = firstMatch(form, /<input\b[^>]*name=['"]addtocart['"][^>]*>/i, 0);
  const addtocart = addtocartTag ? attribut(addtocartTag, 'value') : null;

  /* --- Attribute aus <select> --- */
  const attribute = [];
  for (const m of form.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)) {
    const feld = attribut(m[1], 'name');
    if (!feld) continue;
    const inAttr = feld.match(/^attribute\[([\s\S]*)\]$/);
    const inSpez = feld.match(/^spezialoption\[/);
    if (!inAttr && !inSpez) continue;
    const eintrag = {
      feld,
      name: inAttr ? inAttr[1].trim() : feld,
      typ: 'auswahl',
      art: inAttr ? 'attribut' : 'spezialoption',
      optionen: parseOptionen(m[2]),
    };
    eintrag.gewaehlt = (eintrag.optionen.find((o) => o.gewaehlt) || eintrag.optionen[0] || {}).wert ?? null;
    attribute.push(eintrag);
  }

  /* --- Attribute aus Farb-/Design-Radios (zweites Seitenlayout) --- */
  const radiogruppen = new Map();
  for (const m of form.matchAll(/<input\b[^>]*type=["']radio["'][^>]*>/gi)) {
    const tag = m[0];
    const feld = attribut(tag, 'name');
    if (!feld || !/^attribute\[/.test(feld)) continue;
    if (!radiogruppen.has(feld)) radiogruppen.set(feld, []);
    radiogruppen.get(feld).push({
      wert: attribut(tag, 'value') ?? '',
      label: attribut(tag, 'data-color') || attribut(tag, 'value') || '',
      gewaehlt: /\bchecked\b/i.test(tag),
    });
  }
  for (const [feld, optionen] of radiogruppen) {
    const name = (feld.match(/^attribute\[([\s\S]*)\]$/) || [])[1] || feld;
    attribute.push({
      feld,
      name: name.trim(),
      typ: 'farbwahl',
      art: 'attribut',
      optionen,
      gewaehlt: (optionen.find((o) => o.gewaehlt) || {}).wert ?? null,
    });
  }

  /* --- Freie Masseingaben (spezialoption[...][x|y]) ---
     min/max sind schlichte Ganzzahlen ("2000"), KEINE Betraege. toNumber()
     waere hier falsch: der Parser liest "2000" als deutschen Betrag und
     macht 200 daraus (Punkt als Tausendertrenner). Ein zu klein gemeldetes
     Maximalmass haette das Frontend gueltige Bestellungen ablehnen lassen. */
  const ganzzahl = (s) => {
    const t = nurText(s);
    if (t === null || t.trim() === '') return null;
    const n = Number(t.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const masse = [];
  for (const m of form.matchAll(/<input\b[^>]*name=['"](spezialoption\[[^'"]*\])['"][^>]*>/gi)) {
    const tag = m[0];
    masse.push({
      feld: m[1],
      typ: 'zahl',
      min: ganzzahl(attribut(tag, 'min')),
      max: ganzzahl(attribut(tag, 'max')),
      vorgabe: attribut(tag, 'value') || null,
    });
  }

  /* --- Das komplette Feldset, so wie es abgeschickt werden muss ---
     Bei <select> und Radiogruppen steht der abzuschickende Wert nicht im
     Tag, sondern in der vorausgewaehlten Option. Der wird deshalb aus den
     oben geparsten Attributen nachgetragen -- sonst stuende hier null und
     ein Frontend schickte ein leeres Pflichtfeld. */
  const vorauswahl = new Map(attribute.map((a) => [a.feld, a.gewaehlt]));
  const felder = [];
  const gesehen = new Set();
  for (const m of form.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
    const name = attribut(m[2], 'name');
    if (!name || gesehen.has(name)) continue;
    gesehen.add(name);
    const istSelect = m[1].toLowerCase() === 'select';
    const rohTyp = (attribut(m[2], 'type') || (istSelect ? 'select' : 'text')).toLowerCase();
    if (rohTyp === 'submit' && name !== 'addtocart') continue;
    const typ = rohTyp === 'radio' ? 'auswahl' : rohTyp;
    felder.push({
      name,
      typ,
      wert: vorauswahl.has(name) ? vorauswahl.get(name) : attribut(m[2], 'value'),
      pflicht:
        /\brequired\b/i.test(m[2]) ||
        name.startsWith('attribute[') ||
        ['artikel', 'anzahl', 'addtocart'].includes(name),
    });
  }

  return {
    artikelId: artikelId != null ? Number(artikelId) : null,
    upstreamAktion: attribut(formTag, 'action') || CART_PATH,
    upstreamMethode: (attribut(formTag, 'method') || 'post').toUpperCase(),
    addtocart,
    modus: addtocart ? (/anfrage/i.test(addtocart) ? 'anfrage' : 'kauf') : null,
    preisAbfrage: firstMatch(form, /name="price_updates" value="([^"]*)"/i),
    unvollstaendigPraefix: firstMatch(form, /name="price_incomplete_prefix" value="([^"]*)"/i),
    attribute,
    masse,
    felder,
  };
}

/**
 * Alle Bilder einer Artikelseite, in der Reihenfolge des Dokuments.
 *
 * Der Shop kennt drei Bildlayouts, die sich auch mischen:
 *  A) <div class='artikelbilder_oben'>
 *       <a data-fancybox="imgaes" href="/media/bild/X.jpg"><img src='/media/bild/X.jpg'>
 *  B) <a class="thumbnail lightbox" href="/media/bild/GROSS.jpg">
 *       <img class='artikel_bild_standard' src='/media/bild/cache/KLEIN.jpg_m0_300_254.jpg'>
 *  C) Farbwaehler-Karussell:
 *     <div class="slider-single"><div><a href="/media/bild/JP-613.JPG"><img ...></a></div>
 *
 * Statt drei getrennter Parser wird deshalb einfach jede /media/-Quelle im
 * Inhaltsbereich eingesammelt. Grossbilder (a href) gewinnen vor Vorschauen
 * (img src) desselben Namens; Sprach- und Logografiken des Rahmens liegen
 * ausserhalb des Inhaltsbereichs und tauchen gar nicht erst auf.
 */
function parseBilder(html) {
  const bereich = inhaltsbereich(html).replace(/<script[\s\S]*?<\/script>/gi, ' ');
  const roh = [];
  for (const m of bereich.matchAll(/<a\b[^>]*href=['"](\/media\/[^'"]+)['"][^>]*>/gi)) roh.push(m[1]);
  for (const m of bereich.matchAll(/<img\b[^>]*src=['"](\/media\/[^'"]+)['"][^>]*>/gi)) roh.push(m[1]);

  const out = [];
  const gesehen = new Set();
  for (const src of roh) {
    const api = mediaZuApiPfad(src);
    if (!api || gesehen.has(api)) continue;
    gesehen.add(api);
    out.push({ bild: api, original: decodeEntities(src) });
    if (out.length >= 60) break;
  }
  return out;
}

/**
 * Verweise auf die Datenblatt- und Farbpaletten-Seiten des Shops.
 *
 * Diese liegen als eigene CMS-Seiten neben dem Katalog
 * (/technischedaten-jetprint, /farbpalette-kokos, ...) und werden aus den
 * Beschreibungstexten heraus verlinkt. Eine strukturierte Tabelle
 * "technische Daten" hat der Shop nicht -- mehr als diese Verweise ist
 * ohne Datenbankzugriff nicht zu holen.
 */
function parseTechnischeDaten(html) {
  const bereich = inhaltsbereich(html);
  const out = [];
  const gesehen = new Set();
  for (const m of bereich.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attribut(m[1], 'href');
    if (!href) continue;
    if (!/^(?:https?:\/\/(?:www\.)?matten\.de)?\/?(?:techn|farbpalette)/i.test(href.trim())) continue;
    const pfad = normalisierePfad(href);
    if (!pfad || gesehen.has(pfad.toLowerCase())) continue;
    gesehen.add(pfad.toLowerCase());
    out.push({ pfad, name: textOf(m[2]) || attribut(m[1], 'title') || pfad });
    if (out.length >= 12) break;
  }
  return out;
}

/**
 * Eine komplette Artikelseite.
 *
 * Der Name steht in <h3 class='titel'>. Bei den namenlosen Sondermaß-
 * Geschwistern ("...-a") fehlt diese Ueberschrift auf der Detailseite --
 * dort steht der Name nur in der Liste der Kategorie. In dem Fall wird
 * der Name aus der letzten Brotkrume genommen; hilft auch das nicht,
 * bleibt er null (und die Diagnose zaehlt den Artikel als "teilweise").
 */
function parseArtikel(html, pfad) {
  const bereich = inhaltsbereich(html);
  const segmente = pfad.split('/').filter(Boolean);
  const letztes = segmente[segmente.length - 1] || null;

  const brotkrumen = parseBrotkrumen(html);
  const nameH3 = textOf(firstMatch(bereich, /<h3 class='titel'>([\s\S]*?)<\/h3>/i));
  const nameKrume = brotkrumen.length ? brotkrumen[brotkrumen.length - 1].name : null;
  const name = nameH3 || nameKrume || null;

  const formular = parseKaufformular(html);
  const preis = parsePreis(bereich);
  const bilder = parseBilder(html);

  /* Beschreibung: alles im Inhaltsbereich ausser Kopfzeile, Formular und
     Bildergeruest. Praktisch geht das am zuverlaessigsten so: Formular und
     Skripte herausschneiden, Rest als Text lesen. */
  const ohneForm = bereich
    .replace(/<form\b[\s\S]*?<\/form>/gi, ' ')
    .replace(/<div class=['"]breadcrumbs['"]>[\s\S]*?<\/div>/i, ' ')
    .replace(/<h3 class='titel'>[\s\S]*?<\/h3>/i, ' ');
  const teile = absaetze(ohneForm);

  const verfuegbarkeit = textOf(firstMatch(bereich, /<div class='verfuegbarkeit'>([\s\S]*?)<\/div>/i));

  return {
    pfad,
    artikelnummer: letztes,
    artikelnummerNumerisch: letztes ? /^\d+$/.test(letztes) : false,
    artikelId: formular ? formular.artikelId : null,
    name,
    nameQuelle: nameH3 ? 'h3.titel' : (nameKrume ? 'brotkrume' : null),
    kaufbar: Boolean(formular),
    modus: formular ? formular.modus : null,
    brotkrumen,
    kategorie: brotkrumen.length > 1 ? brotkrumen[brotkrumen.length - 2] : (brotkrumen[0] || null),
    hauptbild: bilder.length ? bilder[0].bild : null,
    bilder,
    kurzbeschreibung: teile.length ? kurztext(teile.slice(0, 2).join(' '), 400) : null,
    beschreibung: teile.length ? teile.join('\n') : null,
    beschreibungAbsaetze: teile,
    preis,
    verfuegbarkeit: verfuegbarkeit || null,
    attribute: formular ? formular.attribute : [],
    masse: formular ? formular.masse : [],
    technischeDaten: parseTechnischeDaten(html),
    sprachen: [...SPRACHEN],
    // Rohbeschreibung des Formulars. Wird von kaufformularAntwort() gelesen
    // und landet nicht unveraendert in der API-Antwort.
    formular,
  };
}

/**
 * Bewertet, wie gut ein Artikel geparst werden konnte.
 * Grundlage der Zaehlung in /api/katalog/diagnose.
 */
function bewerteArtikel(a) {
  const fehlend = [];
  if (!a || !a.pfad) return { stufe: 'fehlgeschlagen', fehlend: ['alles'] };
  if (!a.name) fehlend.push('name');
  if (!a.bilder.length) fehlend.push('bild');
  if (!a.kaufbar) fehlend.push('kaufformular');
  else if (a.artikelId == null) fehlend.push('artikelId');
  // Anfrageartikel haben im Altsystem bewusst keinen Preis -- das als
  // Parserfehler zu zaehlen, wuerde die Diagnose unbrauchbar machen.
  if (a.modus === 'kauf' && a.preis.wert == null) fehlend.push('preis');
  if (!a.beschreibung) fehlend.push('beschreibung');

  const kern = a.name && a.kaufbar && a.artikelId != null;
  if (!fehlend.length) return { stufe: 'vollstaendig', fehlend };
  if (kern || a.name || a.artikelId != null) return { stufe: 'teilweise', fehlend };
  return { stufe: 'fehlgeschlagen', fehlend };
}

/* ------------------------------------------------------------------ */
/* Fachlogik: Katalog aufbauen                                         */
/* ------------------------------------------------------------------ */

/**
 * Der Kategoriebaum. Eine einzige Anfrage an die Startseite reicht fuer die
 * Struktur; die Produktzahlen kosten eine Anfrage je Kategorie und lassen
 * sich mit ?zaehlen=0 abschalten.
 */
async function baueKatalog({ zaehlen = true, sprache = null } = {}) {
  const logs = [];
  const start = await holeSeite('/', { sprache });
  logs.push(...start.logs);

  const hinweise = [];
  const oben = parseHauptnavigation(start.html);
  const unten = parseUntermenue(start.html);

  if (!oben.length) {
    hinweise.push(
      'Die Hauptnavigation der Startseite konnte nicht gelesen werden ' +
      '(Muster: <nav id="main_navigation"> ... <li class=\'dropdown\'>). ' +
      'Ohne sie ist der Kategoriebaum leer.'
    );
  }
  if (!unten.length) {
    hinweise.push(
      'Das maschinell erzeugte Untermenue (li.dropdown-menu-products-item.col-lg-2) ' +
      'wurde nicht gefunden -- es gibt dann keine Unterkategorien.'
    );
  }

  const kategorien = oben.map((k) => ({ ...k, ebene: 1, anzahlProdukte: null, unterkategorien: [] }));
  const nachSchluessel = new Map(kategorien.map((k) => [k.schluessel, k]));

  const verwaist = [];
  for (const u of unten) {
    const elternSchluessel = u.schluessel.split('/')[0];
    const eltern = nachSchluessel.get(elternSchluessel);
    const eintrag = { ...u, ebene: 2, anzahlProdukte: null, unterkategorien: [] };
    if (eltern) eltern.unterkategorien.push(eintrag);
    else verwaist.push(eintrag);
  }
  if (verwaist.length) {
    hinweise.push(
      `${verwaist.length} Unterkategorie(n) ohne passende Oberkategorie -- sie stehen auf oberster Ebene.`
    );
    kategorien.push(...verwaist);
  }

  /* Produktzahlen: eine Anfrage je Kategorieseite, hoechstens vier
     gleichzeitig. Die Listen werden gleich mitgecacht, damit ein
     anschliessendes /api/kategorie ohne neue Anfrage auskommt. */
  if (zaehlen) {
    const alle = [];
    for (const k of kategorien) {
      alle.push(k);
      for (const u of k.unterkategorien) alle.push(u);
    }
    const ergebnisse = await parallel(alle, 3, async (k) => holeKategorie(k.pfad, { sprache }));
    for (let i = 0; i < alle.length; i++) {
      const r = ergebnisse[i];
      if (!r || r.fehler || !r.ok) {
        alle[i].anzahlProdukte = null;
        hinweise.push(`Produktzahl fuer ${alle[i].pfad} nicht ermittelbar (${(r && (r.fehler || r.grund)) || 'unbekannt'}).`);
        continue;
      }
      alle[i].anzahlProdukte = r.produkte.length;
      logs.push(...(r.upstream || []));
    }
  }

  const summe = (liste) =>
    liste.reduce((a, k) => a + (k.anzahlProdukte || 0) + summe(k.unterkategorien), 0);

  return {
    quelle: 'Hauptnavigation und maschinell erzeugtes Untermenue der Startseite von matten.de',
    stand: new Date().toISOString(),
    anzahlKategorien: kategorien.length + kategorien.reduce((a, k) => a + k.unterkategorien.length, 0),
    anzahlProdukteGelistet: zaehlen ? summe(kategorien) : null,
    hinweisProduktzahl:
      'Produkte sind mehrfach gelistet: dieselbe Matte erscheint in mehreren Kategorien. ' +
      'Die Summe ist deshalb groesser als die Zahl der eigenstaendigen Artikel ' +
      '(die nennt /api/suche?alle=1 bzw. /api/katalog/diagnose).',
    kategorien,
    hinweise,
    upstream: logs,
  };
}

/** Katalog mit Zwischenspeicher (TTL 10 Minuten). */
async function katalogMitCache({ zaehlen = true, sprache = null, frisch = false } = {}) {
  const key = `katalog:${sprache || 'de'}:${zaehlen ? 'zaehlen' : 'schnell'}`;
  if (!frisch) {
    const treffer = cacheLies(key);
    if (treffer) return { ...treffer, gecacht: true };
  }
  const wert = await baueKatalog({ zaehlen, sprache });
  cacheSchreib(key, wert);
  return { ...wert, gecacht: false };
}

/**
 * Die Produktliste einer Kategorieseite -- mit Zwischenspeicher.
 * Liefert ok:false statt zu werfen, wenn der Pfad keine Kategorie ist.
 */
async function holeKategorie(pfad, { sprache = null, frisch = false } = {}) {
  const key = `kategorie:${sprache || 'de'}:${pfadSchluessel(pfad)}`;
  if (!frisch) {
    const treffer = cacheLies(key);
    if (treffer) return { ...treffer, gecacht: true };
  }

  const seite = await holeSeite(pfad, { sprache });
  if (seite.umleitung) {
    return {
      ok: false,
      grund: `Das Altsystem leitet ${pfad} auf ${seite.umleitung} um -- diesen Pfad gibt es nicht.`,
      status: seite.status,
      produkte: [],
      upstream: seite.logs,
    };
  }
  const typ = parseSeitentyp(seite.html);
  if (typ !== 'kategorie') {
    return {
      ok: false,
      grund:
        typ === 'artikel'
          ? `${pfad} ist eine Artikelseite, keine Kategorie -- bitte /api/produkt verwenden.`
          : `${pfad} ist keine Kategorieseite (erkannter Typ: ${typ ?? 'unbekannt'}).`,
      seitentyp: typ,
      status: seite.status,
      produkte: [],
      upstream: seite.logs,
    };
  }

  const wert = {
    ok: true,
    pfad: seite.kanonisch || pfad,
    angefragterPfad: pfad,
    umgezogen: Boolean(seite.kanonisch),
    seitentyp: typ,
    titel: textOf(firstMatch(seite.html, /<title>([\s\S]*?)<\/title>/i)),
    einleitung: kurztext(firstMatch(seite.html, /<div class='kategorie_text'>([\s\S]*?)<div class='artikel_grid/i), 600),
    produkte: parseProduktliste(seite.html),
    upstream: seite.logs,
  };
  cacheSchreib(key, wert);
  return { ...wert, gecacht: false };
}

/** Eine Artikelseite -- mit Zwischenspeicher. */
async function holeArtikel(pfad, { sprache = null, frisch = false } = {}) {
  const key = `artikel:${sprache || 'de'}:${pfadSchluessel(pfad)}`;
  if (!frisch) {
    const treffer = cacheLies(key);
    if (treffer) return { ...treffer, gecacht: true };
  }

  const seite = await holeSeite(pfad, { sprache });
  if (seite.umleitung) {
    return {
      ok: false,
      grund: `Das Altsystem leitet ${pfad} auf ${seite.umleitung} um -- diesen Artikel gibt es nicht.`,
      status: seite.status,
      upstream: seite.logs,
    };
  }
  const typ = parseSeitentyp(seite.html);
  if (typ !== 'artikel') {
    return {
      ok: false,
      grund:
        typ === 'kategorie'
          ? `${pfad} ist eine Kategorieseite -- bitte /api/kategorie verwenden.`
          : `${pfad} ist keine Artikelseite (erkannter Typ: ${typ ?? 'unbekannt'}).`,
      seitentyp: typ,
      status: seite.status,
      upstream: seite.logs,
    };
  }

  let artikel = null;
  try {
    artikel = parseArtikel(seite.html, seite.kanonisch || pfad);
    artikel.angefragterPfad = pfad;
    artikel.umgezogen = Boolean(seite.kanonisch);
  } catch (err) {
    console.error('  [parser] Artikelseite:', err.message);
    return {
      ok: false,
      grund: 'Die Artikelseite liess sich nicht auswerten.',
      status: seite.status,
      upstream: seite.logs,
    };
  }

  const wert = { ok: true, artikel, parsen: bewerteArtikel(artikel), upstream: seite.logs };
  cacheSchreib(key, wert);
  return { ...wert, gecacht: false };
}

/**
 * Suche des Altsystems.
 *
 * Der Parameter heisst `search` (`term` wirkt genauso); jeder andere Name
 * wird ignoriert und liefert ALLE Artikel. Ohne Suchwort ist das Ergebnis
 * der komplette Katalog -- rund 1,2 MB HTML und etwa drei Sekunden, darum
 * nur auf ausdrueckliches Verlangen.
 *
 * Einzelne Suchworte mit Umlauten beantwortet der Shop mit einer Umleitung
 * auf die Startseite. Das wird als "abgewiesen" gemeldet, nicht als Fehler.
 */
async function holeSuche(q, { sprache = null, frisch = false } = {}) {
  const key = `suche:${sprache || 'de'}:${q.toLowerCase()}`;
  if (!frisch) {
    const treffer = cacheLies(key);
    if (treffer) return { ...treffer, gecacht: true };
  }

  const pfad = `${SUCH_PFAD}?search=${encodeURIComponent(q)}`;
  // WICHTIG: eigene Wegwerf-Sitzung je Suche.
  //
  // Das Altsystem merkt sich den zuletzt gesuchten Begriff in der PHP-
  // Sitzung. Ueber die gemeinsame Katalog-Sitzung lieferte eine Suche mit
  // leerem Begriff darum nicht den ganzen Katalog, sondern still das
  // Ergebnis der VORIGEN Suche -- nachgemessen: nach ?search=bierbank gab
  // ?search= nur noch 40 statt 384 Treffer. Mit einer frischen Sitzung je
  // Suche kann kein Begriff in den naechsten Aufruf durchschlagen.
  const seite = await holeSeite(pfad, {
    sprache,
    sitzung: { cookies: new Map(), created: Date.now() },
  });
  if (seite.umleitung) {
    return {
      ok: false,
      grund:
        `Das Altsystem hat die Suchanfrage abgewiesen und auf ${seite.umleitung} umgeleitet. ` +
        'Das passiert reproduzierbar bei einzelnen Suchworten mit Umlauten.',
      produkte: [],
      upstream: seite.logs,
    };
  }
  if (parseSeitentyp(seite.html) !== 'suche') {
    return {
      ok: false,
      grund: 'Die Antwort von /suche war keine Suchergebnisseite (class_suchepage fehlt).',
      produkte: [],
      upstream: seite.logs,
    };
  }

  const wert = {
    ok: true,
    q,
    gemeldeteTreffer: parseTrefferzahl(seite.html),
    produkte: parseProduktliste(seite.html),
    upstream: seite.logs,
  };
  cacheSchreib(key, wert);
  return { ...wert, gecacht: false };
}

/** Blaettert eine Liste und beschreibt die Blaetterung. */
function blaettere(liste, seite, proSeite) {
  const gesamt = liste.length;
  const groesse = Math.max(1, Math.min(SEITE_MAX, Number(proSeite) || SEITE_STANDARD));
  const seiten = Math.max(1, Math.ceil(gesamt / groesse));
  const nummer = Math.max(1, Math.min(seiten, Number(seite) || 1));
  const von = (nummer - 1) * groesse;
  return {
    ausschnitt: liste.slice(von, von + groesse),
    blaetterung: { seite: nummer, proSeite: groesse, seiten, anzahlGesamt: gesamt, von: gesamt ? von + 1 : 0, bis: Math.min(gesamt, von + groesse) },
  };
}

/**
 * Reichert Listeneintraege mit den Angaben an, die nur die Artikelseite
 * kennt: interne Artikel-ID, Preis, Varianten. Kostet eine Anfrage je
 * Produkt und ist deshalb ausdruecklich anzufordern (?details=1). Es wird
 * immer nur die aktuell angezeigte Seite angereichert.
 */
async function reichereListeAn(produkte, { sprache = null } = {}) {
  const logs = [];
  const ergebnisse = await parallel(produkte, 4, (p) => holeArtikel(p.pfad, { sprache }));
  return {
    produkte: produkte.map((p, i) => {
      const r = ergebnisse[i];
      if (!r || r.fehler || !r.ok) {
        return { ...p, detailsGeladen: false, detailFehler: (r && (r.fehler || r.grund)) || 'unbekannt' };
      }
      logs.push(...(r.upstream || []));
      const a = r.artikel;
      return {
        ...p,
        name: p.name || a.name,
        artikelId: a.artikelId,
        kaufbar: a.kaufbar,
        modus: p.modus || a.modus,
        grundpreis: a.preis.wert,
        grundpreisText: a.preis.text,
        versand: a.preis.versand,
        ustSatz: a.preis.ustSatz,
        bild: p.bild || a.hauptbild,
        // Gleiche Form wie in /api/produkt -- ein Frontend soll denselben
        // Code fuer Listen- und Detailansicht benutzen koennen.
        attribute: a.attribute.map((x) => ({
          feld: x.feld, name: x.name, typ: x.typ,
          optionen: x.optionen, gewaehlt: x.gewaehlt,
        })),
        verfuegbarkeit: a.verfuegbarkeit,
        detailsGeladen: true,
      };
    }),
    upstream: logs,
  };
}

/**
 * Beschreibt das Kaufformular so, wie es abgeschickt werden muss.
 *
 * Bewusst zweigeteilt: `upstream` ist das, was das Altsystem an /warenkorb
 * erwartet (nachgelesen aus dem Formular der Live-Seite), `bruecke` ist der
 * Weg ueber diesen Proxy. Der Unterschied ist wichtig -- /api/cart/add
 * dieser Demo ist noch auf den einen Demo-Artikel zugeschnitten und kennt
 * genau ein Attribut. Fuer beliebige Artikel muesste es die hier
 * gelieferten Felder generisch durchreichen.
 */
function kaufformularAntwort(a) {
  if (!a.kaufbar) {
    return {
      vorhanden: false,
      grund:
        'Diese Seite enthaelt kein Kaufformular (form.artikel_buy_form). ' +
        'Solche Artikel sind im Altsystem reine Informationsseiten.',
    };
  }
  const pflichtHinweis = [];
  for (const attr of a.attribute) {
    if (attr.gewaehlt == null) {
      pflichtHinweis.push(`Fuer "${attr.name}" ist keine Vorauswahl gesetzt -- das Frontend muss einen Wert waehlen.`);
    }
  }
  return {
    vorhanden: true,
    modus: a.modus,
    knopfbeschriftung: a.modus === 'anfrage' ? 'in den Anfragenkorb' : 'In den Warenkorb',
    upstream: {
      methode: 'POST',
      pfad: CART_PATH,
      kodierung: 'application/x-www-form-urlencoded (utf-8)',
      felder: a.formular ? a.formular.felder : [],
      preisAbfrage: a.formular ? a.formular.preisAbfrage : null,
      unvollstaendigPraefix: a.formular ? a.formular.unvollstaendigPraefix : null,
    },
    bruecke: {
      methode: 'POST',
      pfad: '/api/cart/add',
      kodierung: 'application/json',
      koerper: {
        artikel: a.artikelId,
        anzahl: 1,
        attribut: a.attribute.length ? a.attribute[0].gewaehlt : null,
        kommentar: '',
      },
      einschraenkung:
        '/api/cart/add dieser Demo ist auf den Demo-Artikel 278 zugeschnitten und schickt ' +
        'genau ein Attribut mit. Fuer den vollen Katalog muesste es die Felder aus ' +
        '"upstream.felder" unveraendert durchreichen.',
    },
    hinweise: pflichtHinweis,
  };
}

/* ------------------------------------------------------------------ */
/* Diagnose                                                            */
/* ------------------------------------------------------------------ */

/**
 * Meldet, wie gut sich der Katalog gerade auswerten laesst.
 *
 * Zweck: eine Layoutaenderung im Altsystem soll SOFORT sichtbar werden --
 * nicht erst, wenn im Frontend Namen oder Preise fehlen. Geprueft werden
 * der Kategoriebaum und eine gleichmaessig ueber den ganzen Katalog
 * verteilte Stichprobe von Artikelseiten.
 */
async function diagnose({ stichprobe = 25, sprache = null } = {}) {
  const logs = [];
  const hinweise = [];

  /* 1. Kategoriebaum */
  const katalog = await katalogMitCache({ zaehlen: true, sprache });
  if (!katalog.gecacht) logs.push(...(katalog.upstream || []));
  const flach = [];
  for (const k of katalog.kategorien) {
    flach.push(k);
    for (const u of k.unterkategorien) flach.push(u);
  }
  const ohneProdukte = flach.filter((k) => !k.anzahlProdukte).map((k) => k.pfad);
  const ohneZahl = flach.filter((k) => k.anzahlProdukte === null).map((k) => k.pfad);

  /* 2. Gesamtliste der Artikel ueber die Suche des Altsystems */
  const alle = await holeSuche('', { sprache });
  if (!alle.gecacht) logs.push(...(alle.upstream || []));
  const gesamtliste = alle.ok ? alle.produkte : [];
  if (!alle.ok) {
    hinweise.push(`Die Gesamtliste ueber ${SUCH_PFAD} war nicht lesbar: ${alle.grund}`);
  } else if (alle.gemeldeteTreffer != null && alle.gemeldeteTreffer !== gesamtliste.length) {
    hinweise.push(
      `Das Altsystem meldet ${alle.gemeldeteTreffer} Treffer, geparst wurden ${gesamtliste.length} Produktbloecke ` +
      '-- ein Zeichen dafuer, dass sich das Block-Muster geaendert hat.'
    );
  }

  /* 3. Stichprobe, gleichmaessig ueber die Liste verteilt */
  const anzahl = Math.min(stichprobe, gesamtliste.length);
  const schritt = anzahl ? gesamtliste.length / anzahl : 0;
  const auswahl = [];
  for (let i = 0; i < anzahl; i++) auswahl.push(gesamtliste[Math.floor(i * schritt)]);

  const felder = { name: 0, artikelId: 0, bild: 0, preis: 0, kaufformular: 0, attribute: 0, beschreibung: 0 };
  const stufen = { vollstaendig: 0, teilweise: 0, fehlgeschlagen: 0 };
  const probleme = [];

  const ergebnisse = await parallel(auswahl, 4, (p) => holeArtikel(p.pfad, { sprache }));
  for (let i = 0; i < auswahl.length; i++) {
    const r = ergebnisse[i];
    const pfad = auswahl[i].pfad;
    if (!r || r.fehler || !r.ok) {
      stufen.fehlgeschlagen++;
      probleme.push({ pfad, stufe: 'fehlgeschlagen', fehlend: ['seite'], grund: (r && (r.fehler || r.grund)) || 'unbekannt' });
      continue;
    }
    if (!r.gecacht) logs.push(...(r.upstream || []));
    const a = r.artikel;
    if (a.name) felder.name++;
    if (a.artikelId != null) felder.artikelId++;
    if (a.bilder.length) felder.bild++;
    if (a.preis.wert != null) felder.preis++;
    if (a.kaufbar) felder.kaufformular++;
    if (a.attribute.length) felder.attribute++;
    if (a.beschreibung) felder.beschreibung++;
    stufen[r.parsen.stufe]++;
    if (r.parsen.stufe !== 'vollstaendig') {
      probleme.push({ pfad, name: a.name, stufe: r.parsen.stufe, fehlend: r.parsen.fehlend, modus: a.modus });
    }
  }

  /* 4. Ampel */
  const anteilOk = anzahl ? (stufen.vollstaendig + stufen.teilweise) / anzahl : 0;
  let ampel = 'gruen';
  if (!katalog.kategorien.length || !gesamtliste.length || anteilOk < 0.5) ampel = 'rot';
  else if (stufen.fehlgeschlagen > 0 || katalog.hinweise.length || anteilOk < 0.9) ampel = 'gelb';

  return {
    stand: new Date().toISOString(),
    ampel,
    sprache: sprache || 'de',
    katalog: {
      oberkategorien: katalog.kategorien.length,
      unterkategorien: katalog.kategorien.reduce((a, k) => a + k.unterkategorien.length, 0),
      kategorienOhneProdukte: ohneProdukte,
      kategorienOhneZaehlung: ohneZahl,
      hinweise: katalog.hinweise,
    },
    produkte: {
      imKatalogGefunden: gesamtliste.length,
      vomAltsystemGemeldet: alle.gemeldeteTreffer ?? null,
      geprueft: anzahl,
      ...stufen,
      felder,
      feldquoten: Object.fromEntries(
        Object.entries(felder).map(([k, v]) => [k, anzahl ? Math.round((v / anzahl) * 100) + ' %' : null])
      ),
      probleme: probleme.slice(0, 50),
    },
    bewertung: {
      vollstaendig: 'Name, Bild, Kaufformular, interne ID, Beschreibung und (bei Kaufartikeln) Preis gelesen.',
      teilweise: 'Der Artikel ist identifizierbar, aber mindestens ein Feld fehlt.',
      fehlgeschlagen: 'Weder Name noch interne ID lesbar -- oder die Seite war keine Artikelseite.',
      bekannteLuecken: [
        'Anfrageartikel ("in den Anfragenkorb") haben im Altsystem keinen Preis -- das wird nicht als Fehler gezaehlt.',
        'Die namenlosen Sondermass-Geschwister ("...-a") haben auf der Detailseite weder Ueberschrift noch Bild. ' +
        'Ihr Name steht nur in der Liste der Kategorie; sie erscheinen darum regelmaessig als "teilweise".',
      ],
    },
    hinweise,
    upstream: logs,
  };
}

/* ================================================================== */
/* SHOP-BRUECKE  --  das fertige Frontend an das Altsystem anschliessen */
/* ================================================================== */
/*
 * Alles ab hier bedient das Design unter public/shop/. Drei Bausteine:
 *
 *   1. Ein GENERISCHER Warenkorb-Zugang. /api/cart/add war auf den einen
 *      Demo-Artikel 278 mit genau einem Attribut zugeschnitten; fuer einen
 *      Katalog mit ueber 380 Artikeln muss der Feldsatz des jeweiligen
 *      Kaufformulars durchgereicht werden.
 *   2. Eine GENERISCHE Preisabfrage. Dasselbe Problem: die Adresse der
 *      Preis-JSON steht in jedem Artikelformular als price_updates.
 *   3. Der LIVE-KATALOG in der Form, die das Design erwartet
 *      (window.CATALOG mit categories[] und products[]).
 */

/* ------------------------------------------------------------------ */
/* Generischer Zugang zu Kaufformular, Preis und Warenkorb             */
/* ------------------------------------------------------------------ */

/**
 * Baut den Formularkoerper fuer "In den Warenkorb" eines BELIEBIGEN Artikels.
 *
 * Der Feldsatz kommt immer von der Live-Seite des Artikels, nie vom Aufrufer.
 * Der darf nur Werte fuer Felder setzen, die dort auch stehen -- und bei
 * Auswahlfeldern nur Werte, die das Altsystem selbst anbietet. Alles andere
 * wird verworfen und in `abgelehnt` benannt, statt still durchzurutschen.
 * So kann ueber diesen Weg kein Feld und kein Wert an matten.de gehen, den
 * dessen eigenes Formular nicht auch geschickt haette.
 */
function baueAddBodyAusFormular(artikel, { anzahl, kommentar, werte }) {
  const form = artikel.formular;
  const paare = [];
  const abgelehnt = [];
  const optionen = new Map(
    (artikel.attribute || []).map((a) => [a.feld, (a.optionen || []).map((o) => o.wert)])
  );
  const masse = new Map((artikel.masse || []).map((m) => [m.feld, m]));
  const gewuenschte = werte && typeof werte === 'object' ? werte : {};

  for (const feld of form.felder) {
    let wert = feld.wert ?? '';

    if (feld.name === 'anzahl') {
      wert = String(anzahl);
    } else if (feld.name === 'kommentar') {
      wert = kommentar;
    } else if (Object.prototype.hasOwnProperty.call(gewuenschte, feld.name)) {
      const roh = nurText(gewuenschte[feld.name]);
      if (roh === null) {
        abgelehnt.push({ feld: feld.name, grund: 'Der Wert war keine Zeichenkette.' });
      } else if (optionen.has(feld.name)) {
        // Auswahlfeld: nur Werte, die das Altsystem selbst anbietet.
        if (optionen.get(feld.name).includes(roh)) wert = roh;
        else abgelehnt.push({ feld: feld.name, grund: `"${roh}" ist keine Option des Altsystems.` });
      } else if (masse.has(feld.name)) {
        // Freie Masseingabe: Zahl, innerhalb der Grenzen des Formulars.
        const m = masse.get(feld.name);
        const n = Number(roh.trim().replace(',', '.'));
        if (!Number.isFinite(n)) {
          abgelehnt.push({ feld: feld.name, grund: 'Das Mass war keine Zahl.' });
        } else if (m.min != null && n < m.min) {
          abgelehnt.push({ feld: feld.name, grund: `Kleiner als das Mindestmass ${m.min}.` });
        } else if (m.max != null && n > m.max) {
          abgelehnt.push({ feld: feld.name, grund: `Groesser als das Hoechstmass ${m.max}.` });
        } else {
          wert = String(n);
        }
      } else {
        wert = roh.slice(0, 500);
      }
    }

    paare.push([feld.name, String(wert ?? '').slice(0, 500)]);
  }

  // Gewuenschte Felder, die es im Formular des Altsystems gar nicht gibt,
  // werden benannt statt still verworfen -- sonst glaubte das Frontend, ein
  // Wert sei uebernommen worden, der nie irgendwo ankam.
  const bekannt = new Set(form.felder.map((f) => f.name));
  for (const name of Object.keys(gewuenschte)) {
    if (!bekannt.has(name) && name !== 'anzahl' && name !== 'kommentar') {
      abgelehnt.push({ feld: name, grund: 'Dieses Feld kennt das Kaufformular des Artikels nicht.' });
    }
  }

  return { body: buildForm(paare), paare, abgelehnt };
}

/* ------------------------------------------------------------------ */
/* Herkunft der Warenkorbpositionen                                    */
/* ------------------------------------------------------------------ */

/**
 * Das Altsystem nennt zu einer Warenkorbzeile nur den Namen -- keinen Pfad
 * und kein Bild. Beides ist aber genau in dem Augenblick bekannt, in dem
 * wir die Zeile selbst anlegen (POST /api/cart/add mit `pfad`). Also wird
 * es dort gemerkt, und zwar unter dem `key`, den das Altsystem der Position
 * gibt: ein stabiler Hash ueber Artikel und Ausfuehrung. Der aendert sich
 * weder beim Neuladen der Seite noch beim Setzen der Menge, und er ist je
 * Position eindeutig -- damit haelt die Zuordnung ueber die ganze Sitzung
 * und ueber beliebig viele Positionen.
 *
 * Die Ablage haengt an der Besucher-Sitzung (dieselbe, die auch die
 * Upstream-Cookies traegt), nicht an einem globalen Speicher: zwei Besucher
 * sehen sich gegenseitig nie. Positionen, die ohne unser Zutun im Warenkorb
 * des Altsystems liegen, stehen nicht darin -- die bekommen `pfad: null`,
 * statt dass ueber den Namen ein Treffer geraten wird.
 */
const HERKUNFT_MAX = 200;

function herkunftAblage(session) {
  if (!session || typeof session !== 'object') return null;
  if (!(session.herkunft instanceof Map)) session.herkunft = new Map();
  return session.herkunft;
}

/** Merkt Pfad (und, wenn vorhanden, Bild) zu einem Positionsschluessel. */
function merkeHerkunft(session, key, { pfad, bild }) {
  const ablage = herkunftAblage(session);
  if (!ablage || !key || !pfad) return;
  ablage.delete(key);                     // ans Ende, damit Altes zuerst faellt
  ablage.set(key, {
    pfad,
    // Bilder duerfen nur als /api/img/-Pfad herausgehen, nie als Adresse
    // bei matten.de. mediaZuApiPfad() hat das schon geleistet -- hier wird
    // es nur noch einmal nachgeprueft.
    bild: typeof bild === 'string' && bild.startsWith('/api/img/') ? bild : null,
  });
  while (ablage.size > HERKUNFT_MAX) ablage.delete(ablage.keys().next().value);
}

function herkunftVon(session, key) {
  const ablage = herkunftAblage(session);
  if (!ablage || !key) return null;
  return ablage.get(key) || null;
}

/**
 * Was nicht mehr im Warenkorb liegt, muss auch nicht gemerkt bleiben.
 *
 * Aufgeraeumt wird nur, wenn die Warenkorbseite auch wirklich gelesen werden
 * konnte: entweder stehen Positionen darin, oder der Zaehler des Altsystems
 * sagt ausdruecklich 0. Hat der Parser gar nichts gefunden (Zaehler null),
 * bleibt die Ablage stehen -- ein voruebergehender Aussetzer soll nicht die
 * Verweise aller Positionen loeschen.
 */
function putzeHerkunft(session, cart) {
  const ablage = herkunftAblage(session);
  if (!ablage || !ablage.size) return;
  const items = (cart && cart.items) || [];
  if (!items.length && cart.count !== 0) return;
  const da = new Set(items.map((i) => i.key).filter(Boolean));
  for (const key of [...ablage.keys()]) if (!da.has(key)) ablage.delete(key);
}

/**
 * Welche Position ist bei diesem Hinzufuegen entstanden?
 *
 * Verglichen wird der Warenkorb vor und nach dem POST -- ueber die
 * Schluessel des Altsystems, nicht ueber Namen. Normalfall: genau ein
 * Schluessel ist neu. Legt jemand dieselbe Ausfuehrung ein zweites Mal,
 * vergibt das Altsystem keinen neuen Schluessel, sondern erhoeht die Menge
 * der vorhandenen Zeile -- dann ist es die eine Zeile, deren Menge gewachsen
 * ist. Ist beides nicht eindeutig, wird nichts gemerkt: lieber `pfad: null`
 * als eine falsche Zuordnung.
 */
function neuePositionKey(vorher, items) {
  const neu = (items || []).filter((i) => i.key && !vorher.has(i.key));
  if (neu.length === 1) return neu[0].key;
  if (neu.length > 1) return null;
  const gewachsen = (items || []).filter(
    (i) => i.key && Number(i.anzahl || 0) > Number(vorher.get(i.key) || 0)
  );
  return gewachsen.length === 1 ? gewachsen[0].key : null;
}

/** Legt einen beliebigen Katalogartikel in den Warenkorb der Besucher-Sitzung. */
async function addToCartPfad(session, pfad, { anzahl, kommentar, werte }) {
  const r = await holeArtikel(pfad);
  if (!r.ok) return { ok: false, fehler: r.grund, logs: r.upstream || [] };

  const a = r.artikel;
  if (!a.kaufbar || !a.formular) {
    return {
      ok: false,
      fehler: `${pfad} hat im Altsystem kein Kaufformular -- das ist dort eine reine Informationsseite.`,
      logs: r.upstream || [],
    };
  }

  const gebaut = baueAddBodyAusFormular(a, { anzahl, kommentar, werte });
  const ziel = normalisierePfad(a.formular.upstreamAktion) || CART_PATH;
  const logs = await ensureUpstreamSession(session);

  /* Der Warenkorb VOR dem Hinzufuegen. Nur so laesst sich die neue Position
     hinterher eindeutig benennen -- ohne ueber den Artikelnamen zu raten. */
  const vorher = new Map();
  const vorLogs = [];
  try {
    const stand = await readCart(session);
    vorLogs.push(...stand.logs);
    for (const i of stand.cart.items) if (i.key) vorher.set(i.key, Number(i.anzahl || 0));
  } catch (err) {
    // Kein Vorher-Bild: dann wird eben nichts gemerkt (pfad bleibt null).
    console.error('  [herkunft] Warenkorb vor dem Hinzufuegen nicht lesbar:', err.message);
  }

  const res = await upstream('POST', `${UPSTREAM_ORIGIN}${ziel}`, { session, body: gebaut.body });
  const cart = parseCart(decodeBody(res.buffer));

  const key = neuePositionKey(vorher, cart.items);
  if (key) merkeHerkunft(session, key, { pfad: a.pfad || pfad, bild: a.hauptbild });

  return {
    ok: true,
    cart,
    artikelId: a.artikelId,
    modus: a.modus,
    gesendet: gebaut.paare.map(([name, wert]) => ({ name, wert })),
    abgelehnt: gebaut.abgelehnt,
    logs: [...logs, ...vorLogs, ...res.logs],
  };
}

/**
 * Die Adresse der Preis-JSON eines Artikels, gegen Unfug geprueft.
 * Sie steht als price_updates im Kaufformular und sieht so aus:
 *   /logomatten/bierbankmatten/6303041?getpricejson=1
 */
function preisAbfrageZiel(artikel) {
  const roh = artikel.formular ? artikel.formular.preisAbfrage : null;
  const kandidat =
    typeof roh === 'string' && roh.startsWith('/') && !roh.startsWith('//') && !/[\s"'<>\\]/.test(roh)
      ? roh
      : `${artikel.pfad}?getpricejson=1`;
  let u;
  try {
    u = new URL(UPSTREAM_ORIGIN + kandidat);
  } catch {
    return null;
  }
  if (u.hostname !== UPSTREAM_HOST || u.protocol !== 'https:') return null;
  return u;
}

/**
 * Live-Preis eines beliebigen Artikels. Menge und Attribute wirken sich im
 * Altsystem auf den Preis aus (Mengenstaffel, Aufpreis fuer Bedruckung),
 * darum gehen beide mit.
 */
async function fetchPricePfad(session, pfad, anzahl, attributPaare) {
  const r = await holeArtikel(pfad);
  if (!r.ok) return { ok: false, fehler: r.grund, logs: r.upstream || [] };

  const a = r.artikel;
  const url = preisAbfrageZiel(a);
  if (!url) {
    return { ok: false, fehler: `Fuer ${pfad} nennt das Altsystem keine brauchbare Preisadresse.`, logs: r.upstream || [] };
  }

  const optionen = new Map(
    (a.attribute || []).map((x) => [x.feld, (x.optionen || []).map((o) => o.wert)])
  );
  const masse = new Map((a.masse || []).map((m) => [m.feld, m]));

  url.searchParams.set('getpricejson', '1');
  if (a.artikelId != null) url.searchParams.set('artikel', String(a.artikelId));
  url.searchParams.set('anzahl', String(anzahl));

  const uebernommen = [];
  const abgelehnt = [];
  for (const [feld, wert] of attributPaare) {
    if (optionen.has(feld)) {
      if (optionen.get(feld).includes(wert)) { url.searchParams.set(feld, wert); uebernommen.push(feld); }
      else abgelehnt.push({ feld, grund: 'Kein vom Altsystem angebotener Wert.' });
      continue;
    }
    if (masse.has(feld)) {
      const n = Number(String(wert).replace(',', '.'));
      if (Number.isFinite(n)) { url.searchParams.set(feld, String(n)); uebernommen.push(feld); }
      else abgelehnt.push({ feld, grund: 'Das Mass war keine Zahl.' });
      continue;
    }
    abgelehnt.push({ feld, grund: 'Dieses Feld kennt das Kaufformular nicht.' });
  }
  // Attribute ohne eigenen Wunsch bekommen die Vorauswahl der Live-Seite --
  // sonst rechnete das Altsystem mit einer anderen Variante als die Seite zeigt.
  for (const attr of a.attribute || []) {
    if (!url.searchParams.has(attr.feld) && attr.gewaehlt != null) {
      url.searchParams.set(attr.feld, attr.gewaehlt);
    }
  }

  const res = await upstream('GET', url.toString(), { session });
  let json = null;
  try {
    json = JSON.parse(decodeBody(res.buffer));
  } catch {
    json = { error: true, message: 'Antwort war kein gueltiges JSON.' };
  }
  return { ok: !json?.error, json, uebernommen, abgelehnt, artikelId: a.artikelId, logs: [...(r.upstream || []), ...res.logs] };
}

/* ------------------------------------------------------------------ */
/* Live-Katalog in der Form des Designs (window.CATALOG)               */
/* ------------------------------------------------------------------ */


const SHOP_KATALOG_TTL_MS = 10 * 60 * 1000;
/** Obergrenze. Wird sie erreicht, sagt es die Konsole UND window.CATALOG_META. */
const SHOP_MAX_PRODUKTE = 450;
const SHOP_DETAIL_PARALLEL = 4;
/** Farb- und Auswahllisten koennen 60+ Eintraege haben -- das bremst nur. */
const SHOP_MAX_OPTIONEN = 80;

/**
 * Der Einleitungstext einer Kategorieseite -- aber nur, wenn er einer ist.
 *
 * Auf manchen Seiten steht in <div class='kategorie_text'> keine Beschreibung,
 * sondern die abgetippte Artikelsuche des Shops ("Artikelsuche > MATTENDESIGNER
 * > Ad-Mat > ..."). Als Teaser im Frontend waere das Unsinn. Erkennungsmerkmal
 * ist die Haeufung von ">" -- dann lieber gar kein Teaser als ein falscher.
 */
function shopTeaser(text) {
  const t = (text || '').trim();
  if (!t) return null;
  const pfeile = (t.match(/>/g) || []).length;
  if (pfeile >= 5) return null;
  return t;
}

/** Aus einem Namen einen stabilen, URL-tauglichen Bezeichner machen. */
function shopSlug(text, ersatz = 'artikel') {
  let s = String(text ?? '').trim().toLowerCase();
  s = s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
  return s || ersatz;
}

/**
 * Stufe 1: Kategoriebaum und Produktlisten.
 *
 * Kostet rund 25 Anfragen an das Altsystem (Startseite + je eine Seite pro
 * Kategorie) und liefert Namen, Bilder, Kurzbeschreibungen und Pfade.
 * Was NUR auf der Artikelseite steht -- interne Artikel-ID, Preis, Varianten --
 * fehlt hier noch und kommt in Stufe 2.
 */
async function shopKatalogStufe1() {
  const hinweise = [];
  const katalog = await katalogMitCache({ zaehlen: true });
  hinweise.push(...(katalog.hinweise || []));

  const categories = [];
  const products = [];
  const nachPfad = new Map();
  const slugs = new Map();

  function slugFuer(name, pfad) {
    const basis = shopSlug(name || pfad.split('/').filter(Boolean).pop());
    if (!slugs.has(basis)) { slugs.set(basis, pfad); return basis; }
    if (slugs.get(basis) === pfad) return basis;
    // Kollision: mit dem Pfad eindeutig machen. Pfade sind im Shop eindeutig.
    const lang = basis + '-' + shopSlug(pfad.split('/').filter(Boolean).join('-'));
    let kandidat = lang;
    let n = 2;
    while (slugs.has(kandidat) && slugs.get(kandidat) !== pfad) kandidat = `${lang}-${n++}`;
    slugs.set(kandidat, pfad);
    return kandidat;
  }

  function uebernehmen(eintrag, catKey, subKey, subName) {
    if (!eintrag || !eintrag.pfad) return null;
    const schluessel = pfadSchluessel(eintrag.pfad);
    const vorhanden = nachPfad.get(schluessel);
    if (vorhanden) {
      // Dieselbe Matte steht in mehreren Kategorien. Die feinere Zuordnung
      // (Unterkategorie) gewinnt gegenueber der groeberen.
      if (subKey && !vorhanden.sub) { vorhanden.sub = subKey; vorhanden.subName = subName; }
      return vorhanden;
    }
    const name = eintrag.name || eintrag.nameGeerbt || null;
    const p = {
      id: null,
      slug: slugFuer(name, eintrag.pfad),
      name,
      cat: catKey,
      sub: subKey || null,
      subName: subKey ? subName : null,
      price: 0,
      from: false,
      shipping: null,
      sizeLabel: null,
      sizes: [],
      colors: [],
      designs: 0,
      attrs: [],
      custom: null,
      teaser: eintrag.kurzbeschreibung || null,
      image: eintrag.bild || null,
      pfad: eintrag.pfad,
      artikelnummer: eintrag.artikelnummer || null,
      modus: eintrag.modus || null,
      variante: Boolean(eintrag.variante),
      details: false,
    };
    nachPfad.set(schluessel, p);
    products.push(p);
    return p;
  }

  for (const k of katalog.kategorien) {
    const kat = { key: k.schluessel, name: k.name, short: k.name, teaser: null, count: 0, subs: [], pfad: k.pfad };
    categories.push(kat);

    const liste = await holeKategorie(k.pfad);
    if (liste.ok) {
      kat.teaser = shopTeaser(liste.einleitung);
      for (const e of liste.produkte) uebernehmen(e, kat.key, null, null);
    } else {
      hinweise.push(`Kategorie ${k.pfad} nicht lesbar: ${liste.grund}`);
    }

    for (const u of k.unterkategorien || []) {
      const subKey = u.schluessel.split('/').slice(1).join('/') || u.schluessel;
      const subName = u.name || subKey;
      kat.subs.push({ key: subKey, name: subName, count: 0, pfad: u.pfad });
      const ul = await holeKategorie(u.pfad);
      if (ul.ok) for (const e of ul.produkte) uebernehmen(e, kat.key, subKey, subName);
      else hinweise.push(`Unterkategorie ${u.pfad} nicht lesbar: ${ul.grund}`);
    }
  }

  let gekuerzt = 0;
  if (products.length > SHOP_MAX_PRODUKTE) {
    gekuerzt = products.length - SHOP_MAX_PRODUKTE;
    products.length = SHOP_MAX_PRODUKTE;
    console.log(
      `  [shop-katalog] GEKUERZT: ${gekuerzt} Produkt(e) ueber der Obergrenze ` +
      `${SHOP_MAX_PRODUKTE} wurden weggelassen.`
    );
    hinweise.push(
      `Der Katalog wurde auf ${SHOP_MAX_PRODUKTE} Produkte gekuerzt -- ${gekuerzt} Eintrag/Eintraege ` +
      'fehlen im Frontend. Die Obergrenze steht in server.mjs als SHOP_MAX_PRODUKTE.'
    );
  }

  for (const c of categories) {
    c.count = products.filter((p) => p.cat === c.key).length;
    for (const s of c.subs) s.count = products.filter((p) => p.cat === c.key && p.sub === s.key).length;
  }

  return {
    categories,
    products,
    stufe: 1,
    gekuerzt,
    stand: new Date().toISOString(),
    hinweise,
  };
}

/** Traegt in einen Produkteintrag nach, was nur die Artikelseite kennt. */
function shopProduktAnreichern(p, a) {
  p.details = true;
  if (a.artikelId != null) p.id = String(a.artikelId);
  if (!p.name && a.name) p.name = a.name;
  if (!p.modus && a.modus) p.modus = a.modus;
  p.kaufbar = Boolean(a.kaufbar);

  if (a.preis) {
    if (a.preis.wert != null) p.price = a.preis.wert;
    p.from = a.preis.unvollstaendigPraefix === 'ab';
    if (a.preis.versand != null) p.shipping = a.preis.versand;
    if (a.preis.ustSatz != null) p.ustSatz = a.preis.ustSatz;
    if (a.preis.text) p.priceText = a.preis.text;
  }
  if (!p.image && a.hauptbild) p.image = a.hauptbild;
  if (!p.teaser && a.kurzbeschreibung) p.teaser = a.kurzbeschreibung;

  const attrs = [];
  const colors = [];
  for (const attr of a.attribute || []) {
    const optionen = (attr.optionen || []).slice(0, SHOP_MAX_OPTIONEN);
    if (!optionen.length) continue;
    if (attr.typ === 'farbwahl') {
      for (const o of optionen) colors.push({ name: o.label || o.wert, value: o.wert, swatch: null });
      continue;
    }
    attrs.push({
      label: attr.name,
      feld: attr.feld,
      values: optionen.map((o) => o.label || o.wert),
      werte: optionen.map((o) => o.wert),
      default: (optionen.find((o) => o.gewaehlt) || optionen[0] || {}).label ?? null,
    });
  }
  p.attrs = attrs;
  p.colors = colors;

  // Freie Masseingaben des Altsystems -> "Wunschmass" im Design.
  const masse = (a.masse || []).filter((m) => m.min != null || m.max != null);
  if (masse.length) {
    const m = masse[masse.length - 1];
    p.custom = { min: m.min ?? null, max: m.max ?? null };
  }
}

/**
 * Stufe 2: je Produkt einmal die Artikelseite. Das ist der teure Teil
 * (eine Anfrage pro Artikel) und laeuft darum im Hintergrund weiter,
 * waehrend das Frontend schon mit Stufe 1 arbeitet.
 */
async function shopKatalogStufe2(daten) {
  const offen = daten.products.filter((p) => !p.details);
  if (!offen.length) { daten.stufe = 2; return daten; }

  const t0 = Date.now();
  console.log(`  [shop-katalog] Stufe 2 laeuft: ${offen.length} Artikelseiten werden nachgeladen ...`);
  let fertig = 0;
  let fehler = 0;

  await parallel(offen, SHOP_DETAIL_PARALLEL, async (p) => {
    const r = await holeArtikel(p.pfad);
    if (!r || r.fehler || !r.ok) {
      fehler += 1;
      p.detailFehler = (r && (r.fehler || r.grund)) || 'unbekannt';
      return;
    }
    shopProduktAnreichern(p, r.artikel);
    fertig += 1;
    if (fertig % 50 === 0) console.log(`  [shop-katalog] Stufe 2: ${fertig}/${offen.length} ...`);
  });

  daten.stufe = 2;
  daten.ohneDetails = fehler;
  console.log(
    `  [shop-katalog] Stufe 2 fertig: ${fertig} angereichert, ${fehler} ohne Detailseite, ` +
    `${Math.round((Date.now() - t0) / 1000)} s.`
  );
  return daten;
}

/**
 * Ein ISO-Zeitstempel in deutscher Schreibweise, ohne Ortszeit-Ueberraschung.
 * Bewusst UTC: der Netlify-Build laeuft in einer anderen Zeitzone als der
 * Betrachter, und "27.08.2026, 21:14 Uhr (UTC)" ist ehrlicher als eine Zeit,
 * die je nach Leser etwas anderes bedeutet.
 */
function standLesbar(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const zwei = (n) => String(n).padStart(2, '0');
  return `${zwei(d.getUTCDate())}.${zwei(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}, ` +
    `${zwei(d.getUTCHours())}:${zwei(d.getUTCMinutes())} Uhr (UTC)`;
}

/** Macht aus den Katalogdaten die JavaScript-Datei, die das Design einbindet. */
function shopKatalogJs(daten) {
  const categories = daten.categories.map((c) => ({
    key: c.key,
    name: c.name,
    short: c.short,
    teaser: c.teaser,
    count: c.count,
    pfad: c.pfad,
    subs: c.subs.map((s) => ({ key: s.key, name: s.name, count: s.count, pfad: s.pfad })),
  }));

  const products = daten.products.map((p) => ({
    id: p.id,
    slug: p.slug,
    // Die namenlosen Sondermass-Geschwister des Altsystems erben den Namen
    // ihres Hauptartikels; bleibt auch der leer, steht die Artikelnummer da.
    name: p.name || p.artikelnummer || p.pfad,
    cat: p.cat,
    sub: p.sub,
    subName: p.subName,
    price: p.price || 0,
    priceText: p.priceText ?? null,
    from: Boolean(p.from),
    shipping: p.shipping ?? null,
    ustSatz: p.ustSatz ?? null,
    sizeLabel: p.sizeLabel,
    sizes: p.sizes,
    colors: p.colors,
    designs: p.designs,
    attrs: p.attrs,
    custom: p.custom,
    teaser: p.teaser,
    image: p.image,
    pfad: p.pfad,
    artikelnummer: p.artikelnummer,
    modus: p.modus,
    variante: p.variante,
    details: p.details,
  }));

  const meta = {
    quelle: 'matten.de, live gelesen ueber die Bruecken-Demo (bridge-demo/lib/bruecke.mjs)',
    stand: daten.stand,
    // Derselbe Zeitpunkt in lesbarer Form. Die Shop-Seiten zeigen ihn dezent
    // in der Fusszeile an -- auf Netlify ist der Katalog eine BEIM BUILD
    // erzeugte Datei, und dann muss sichtbar sein, wie alt sie ist.
    standText: standLesbar(daten.stand),
    // 'build' = einmalig beim Netlify-Build erzeugt und seitdem unveraendert.
    // 'live'  = vom lokalen Server gerade frisch aus matten.de gebaut.
    erzeugung: daten.erzeugung || 'live',
    stufe: daten.stufe,
    stufeText:
      daten.stufe >= 2
        ? 'vollstaendig -- Kategoriebaum, Produktlisten und alle Artikelseiten sind gelesen'
        : 'Grundstufe -- Kategoriebaum und Produktlisten sind gelesen; Preise, interne ' +
          'Artikel-IDs und Varianten werden gerade im Hintergrund nachgeladen',
    anzahlKategorien: categories.length,
    anzahlUnterkategorien: categories.reduce((a, c) => a + c.subs.length, 0),
    anzahlProdukte: products.length,
    mitArtikelId: products.filter((p) => p.id).length,
    mitPreis: products.filter((p) => p.price > 0).length,
    obergrenze: SHOP_MAX_PRODUKTE,
    gekuerzt: daten.gekuerzt || 0,
    ohneDetailseite: daten.ohneDetails ?? null,
    platzhalter: [
      'sizes/sizeLabel: das Altsystem liefert Groessen als Auswahlfeld ohne Einzelpreise -- ' +
        'sie stehen darum in attrs, nicht in sizes.',
      'colors[].swatch: Farbmuster-Bilder sind im Altsystem nicht eindeutig einer Farbe ' +
        'zugeordnet; es gibt nur Name und Wert.',
      'designs, features, badge: gibt es im Altsystem nicht.',
    ],
    hinweise: daten.hinweise,
  };

  const json = (o) =>
    JSON.stringify(o)
      .replace(/</g, '\\u003c')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');

  return [
    '/* ==========================================================',
    '   window.CATALOG -- aus matten.de gelesen.',
    '   Erzeugt von der Bruecken-Demo, nicht von Hand gepflegt.',
    '   Stand:  ' + meta.standText + '   (' + daten.stand + ')',
    '   Quelle: ' + (meta.erzeugung === 'build'
      ? 'einmalig beim Netlify-Build erzeugt (build-katalog.mjs)'
      : 'vom lokalen Server live gebaut (server.mjs)'),
    '   Stufe: ' + daten.stufe + ' von 2  ·  Produkte: ' + products.length,
    '   ========================================================== */',
    'window.CATALOG = ' + json({ categories, products }) + ';',
    'window.CATALOG_META = ' + json(meta) + ';',
    '',
  ].join('\n');
}


/**
 * Bild-Proxy: holt Medien server-seitig von matten.de und reicht sie durch.
 * Damit baut der Browser des Besuchers wirklich keine einzige Verbindung
 * zum Altsystem auf -- auch nicht fuer Produktbilder.
 *
 * /api/img/bild/Bierbank_Pils.jpg  ->  https://matten.de/media/bild/...
 */
const IMG_MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};

/**
 * Prueft einen Medienpfad (ohne fuehrendes "/media/") gegen die Allowlist.
 * Gibt den bereinigten Pfad zurueck oder null.
 *
 * Die Liste musste gegenueber der ersten Fassung geoeffnet werden: von den
 * rund 300 Bilddateien des Katalogs traegt knapp ein Sechstel Leerzeichen
 * ("Bitte hier warten.png"), Umlaute ("Bierbank_Almhuette.jpg" mit echtem ü)
 * oder liegt im Unterordner "cache/". Mit dem alten Muster [A-Za-z0-9._-/]
 * waeren diese Bilder im neuen Frontend schlicht nicht erschienen.
 *
 * Geoeffnet wurde dabei nur der ZEICHENVORRAT, nicht die Struktur:
 *   - kein "..", kein fuehrender Schraegstrich, keine leeren Segmente
 *   - kein "\", kein NUL, keine Steuerzeichen
 *   - kein "?", "#" oder "%": die wuerden beim Bauen der Upstream-URL zu
 *     Query, Fragment oder halber Prozentkodierung -- also zu einem anderen
 *     Ziel, als der Pfad vorgibt
 *   - hoechstens drei Segmente, hoechstens 200 Zeichen
 *   - Dateiendung muss ein Bildtyp sein
 * Der Host bleibt fest verdrahtet (rawRequest lehnt jeden anderen ab),
 * Umleitungen werden nicht verfolgt, und der Content-Type kommt weiterhin
 * aus der ANTWORT, nicht aus der Endung.
 */
function pruefeMedienpfad(rel) {
  if (typeof rel !== 'string' || !rel || rel.length > 200) return null;
  if (/[\u0000-\u001f\\?#%]/.test(rel)) return null;
  if (rel.startsWith('/')) return null;

  const segmente = rel.split('/');
  if (segmente.length < 1 || segmente.length > 3) return null;
  for (const seg of segmente) {
    if (!seg || seg === '.' || seg === '..' || seg.startsWith('.')) return null;
  }
  if (!IMG_MIME[path.extname(rel).toLowerCase()]) return null;
  return segmente.join('/');
}

/**
 * Macht aus einer Bildquelle des Altsystems einen Pfad auf DIESEN Proxy.
 *   "/media/bild/Bierbank_Pils.jpg"  ->  "/api/img/bild/Bierbank_Pils.jpg"
 *
 * Damit steht in keiner Katalogantwort eine matten.de-Adresse: der Browser
 * des Besuchers baut auch fuer Produktbilder keine Verbindung zum Altsystem
 * auf. Quellen ausserhalb von /media/ (etwa eingebettete Fremdgrafiken)
 * geben null -- lieber kein Bild als eine fremde Adresse im JSON.
 */
function mediaZuApiPfad(src) {
  if (typeof src !== 'string' || !src) return null;
  // Im HTML stehen die Namen mal roh, mal prozentkodiert, mal als Entity
  // ("Si-Feuergef&auml;hrlich.jpg"). Alle drei Schreibweisen zuerst auf
  // Klartext bringen, damit daraus ein einziger, stabiler Pfad wird.
  let s = decodeEntities(src).trim();
  if (!s.startsWith('/media/')) return null;
  s = s.slice('/media/'.length);
  if (s.includes('#') || s.includes('?')) s = s.split('#')[0].split('?')[0];
  if (s.includes('%')) {
    try {
      s = decodeURIComponent(s);
    } catch {
      return null;
    }
  }
  const rein = pruefeMedienpfad(s);
  if (!rein) return null;
  return '/api/img/' + rein.split('/').map(encodeURIComponent).join('/');
}

/**
 * Antwortformat fuer alle Warenkorb-Endpunkte.
 *
 * `session` ist freiwillig und dient nur der Herkunft: liegt sie vor, traegt
 * jede Position zusaetzlich `pfad` und `bild` -- also den Weg zurueck zur
 * Produktseite und das Bild aus den Produktdaten, die beim Hinzufuegen ohnehin
 * gelesen wurden. Beides steht nur fuer Positionen zur Verfuegung, die ueber
 * diese Bruecke angelegt wurden; alle anderen bekommen ehrlich `null`.
 */
function cartResponse(cart, logs, extra = {}, session = null) {
  if (session) putzeHerkunft(session, cart);
  return {
    ok: true,
    count: cart.count ?? (cart.items.length ? cart.items.reduce((a, i) => a + (i.anzahl || 0), 0) : 0),
    items: cart.items.map((i) => {
      const h = session ? herkunftVon(session, i.key) : null;
      return {
        key: i.key,
        name: i.name,
        attribut: i.attribut,
        kommentar: i.kommentar,
        anzahl: i.anzahl,
        preis: i.preis,
        preisNum: i.preisNum,
        summe: i.summe,
        summeNum: i.summeNum,
        pfad: h ? h.pfad : null,
        bild: h ? h.bild : null,
      };
    }),
    gesamt: cart.gesamt,
    gesamtNum: cart.gesamtNum,
    zwischensumme: cart.zwischensumme,
    versand: cart.versand,
    umsatzsteuer: cart.umsatzsteuer,
    ustSatz: cart.ustSatz,
    upstream: logs,
    ...extra,
  };
}

/**
 * Entschaerft alle Formulare einer fremden Seite, bevor sie im Browser des
 * Nutzers landet.
 *
 * Anlass: Die Bestelluebersicht des Altsystems enthaelt den funktionsfaehigen
 * Knopf "Bestellung abschicken". In einem localhost-Tab, den niemand als
 * scharf erwartet, hat der nichts verloren -- auch wenn er dort mangels
 * passender Sitzung nichts ausloesen koennte. Doppelt gesichert:
 * onsubmit stoppt das Abschicken, disabled macht die Knoepfe unbedienbar.
 */
function entschaerfeFormulare(html) {
  return String(html)
    // Jedes Formular gibt sein Abschicken auf.
    .replace(/<form\b/gi, '<form onsubmit="return false" data-entschaerft="1"')
    // Absende-Knoepfe zusaetzlich hart abschalten.
    .replace(/<input\b[^>]*>/gi, (tag) =>
      /type\s*=\s*['"]?(submit|image)\b/i.test(tag)
        ? tag.replace(/\s*\/?>$/, ' disabled>')
        : tag)
    // <button> ohne type ist im Formular ebenfalls ein Absende-Knopf.
    .replace(/<button\b/gi, '<button disabled ');
}

/* ------------------------------------------------------------------ */
/* Bildproxy: die Entscheidung, nicht das Antwortschreiben             */
/* ------------------------------------------------------------------ */

/**
 * Holt ein Bild von matten.de -- mit allen Pruefungen, aber ohne eine Antwort
 * zu schreiben. Das uebernimmt der jeweilige Aufrufer (Node-Server oder
 * Netlify-Function), denn nur die Form der Antwort unterscheidet sich.
 *
 * Unveraendert gegenueber der fruueheren serveImage(): Pfad-Allowlist,
 * Wegwerf-Sitzung, KEINE Redirects (matten.de beantwortet unbekannte
 * /media/-Pfade mit 302 auf die Startseite -- wuerde der Proxy folgen,
 * lieferte er HTML unter einem Bild-Content-Type aus), und der Content-Type
 * kommt aus der ANTWORT, nicht aus der angefragten Endung.
 */
export async function holeBild(rohPfad) {
  let rel;
  try {
    rel = decodeURIComponent(rohPfad);
  } catch {
    return { ok: false, status: 400, fehler: 'Ungueltige Adresse' };
  }

  rel = pruefeMedienpfad(rel);
  if (!rel) return { ok: false, status: 400, fehler: 'Ungueltiger Bildpfad' };

  const up = await upstream('GET', `${UPSTREAM_ORIGIN}/media/${rel}`, {
    session: neueSitzung(),
    maxRedirects: 0,
  });

  const upType = String(up.headers['content-type'] || '').toLowerCase();
  if (up.status !== 200 || !upType.startsWith('image/')) {
    console.error(`  [img] abgelehnt: /media/${rel} -> ${up.status} (${upType || 'ohne Content-Type'})`);
    return { ok: false, status: 502, fehler: 'Bild konnte nicht geladen werden' };
  }

  return { ok: true, status: 200, contentType: upType, buffer: up.buffer };
}

/* ------------------------------------------------------------------ */
/* Beweis-Ansichten                                                    */
/* ------------------------------------------------------------------ */

/**
 * Baut aus einer Rohantwort des Altsystems die Beweis-Ansicht: inhaltlich
 * unveraendert, aber mit <base> (damit CSS und Bilder dort laden), einem
 * Hinweisbanner und entschaerften Formularen.
 *
 * Achtung -- das <base> hat einen Preis: In DIESEM Tab laedt der Browser die
 * relativen Bilder, Stile und Skripte der Seite direkt von matten.de. Das ist
 * der einzige Ort in dieser Demo, an dem das passiert, und es steht im Banner.
 */
export function baueRawHtml(rohHtml, hinweis) {
  let html = entschaerfeFormulare(rohHtml);
  const banner =
    '<div style="position:sticky;top:0;z-index:99999;background:#050a40;color:#fff;' +
    'font:600 14px/1.5 system-ui,sans-serif;padding:10px 16px">' + hinweis +
    '<br><span style="font-weight:400;color:#9fb0e8">Diese Beweis-Ansicht ist die einzige Stelle ' +
    'der Demo, an der Ihr Browser Bilder, Stile und Skripte <em>direkt</em> von matten.de laedt &ndash; ' +
    'anders liesse sich die Originalseite nicht zeigen. Alle Formulare und Knoepfe darin sind ' +
    'abgeschaltet.</span></div>';
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${UPSTREAM_ORIGIN}/">`);
  }
  if (/<body[^>]*>/i.test(html)) {
    html = html.replace(/<body([^>]*)>/i, `<body$1>${banner}`);
  } else {
    html = banner + html;
  }
  return html;
}

/* ------------------------------------------------------------------ */
/* Herkunftspruefung                                                   */
/* ------------------------------------------------------------------ */

/**
 * Nur gleiche Herkunft zulassen. Die Bruecke fuehrt fremde Sitzungen und darf
 * darum nicht von beliebigen Seiten aus angesprochen werden.
 *
 * Gegenueber der fruueheren Fassung ist genau EINE Sache anders: statt gegen
 * den einen Host-Header wird gegen die Liste der Hostnamen geprueft, unter
 * denen diese Auslieferung erreichbar ist. Auf dem lokalen Server ist das
 * weiterhin nur `req.headers.host`; auf Netlify kommen `x-forwarded-host` und
 * der Host der aufgeloesten Anfrage-URL dazu, weil dort ein Proxy davor
 * steht. Die Regel selbst bleibt: ein vorhandener Origin MUSS zu dieser
 * Auslieferung gehoeren, sonst 403.
 *
 * @param {object} header   Anfrage-Header, Schluessel kleingeschrieben.
 * @param {string[]} hosts  Hostnamen dieser Auslieferung (host:port).
 */
export function isSameOrigin(header, hosts) {
  const site = header['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return false;

  const origin = header.origin;
  if (origin) {
    // Ohne bekannten eigenen Host laesst sich nichts vergleichen -- dann
    // lieber ablehnen als durchwinken (fail-closed).
    const erlaubt = (hosts || []).filter(Boolean);
    if (!erlaubt.length) return false;
    try {
      if (!erlaubt.includes(new URL(origin).host)) return false;
    } catch {
      return false;
    }
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Exporte                                                             */
/* ------------------------------------------------------------------ */

export {
  /* Adressen und harte Grenzen */
  UPSTREAM_HOST, UPSTREAM_ORIGIN, CART_PATH, PRICE_PATH,
  ADDRESS_PATH, ORDER_PATH, LOGIN_PATH, REGISTER_PATH, SUCH_PFAD,
  ZAHLUNGSARTEN_ERLAUBT, ZAHLUNGSARTEN_VERBOTEN,
  BESTELL_BESTAETIGUNG, BESTELL_FELD, BESTELL_WERT,
  ADRESS_FELDER, RECHNUNG_FELDER, DEMO, ATTRIBUT_NEIN, ATTRIBUT_JA, UA,
  SEITE_STANDARD, SEITE_MAX, SPRACHEN, KATALOG_TTL_MS,
  SHOP_MAX_PRODUKTE, SHOP_KATALOG_TTL_MS, SHOP_DETAIL_PARALLEL, IMG_MIME,

  /* Werte pruefen statt koerzieren */
  nurText, normalizeAttribut, pruefeZahlungsart,

  /* Cookies und Zeichensatz */
  parseCookieHeader, cookieHeaderFor, absorbSetCookie,
  decodeBody, encodeFormValue, buildForm, decodeEntities, textOf, toNumber,

  /* Upstream */
  postHeaders, rawRequest, upstream, parallel, holeSeite, ensureUpstreamSession,

  /* Parser: Warenkorb, Kasse, Konto */
  firstMatch, reEscape, parseCart, parseSelect, parseZahlungsarten,
  parseKasseOptionen, parseKontoMenue, parseAdressFehler, parseAdressWerte,
  parseUebersicht, parseBestellnummer,

  /* Fachlogik: Warenkorb und Bestellstrecke */
  buildAddBody, readCart, addToCart, setQuantity, clearCart, fetchPrice,
  readCartMitOptionen, setzeKasseOptionen, leseAdressFormular, speichereAdresse,
  leseVorschau, bestellungAbschicken, kontoLogin, kontoRegister,

  /* Pfad-Hygiene */
  normalisierePfad, pfadSchluessel, normalisiereSprache,

  /* Parser: Katalog */
  inhaltsbereich, attribut, kurztext, absaetze, parseSeitentyp, parseBrotkrumen,
  parseHauptnavigation, parseUntermenue, parseProduktliste, parseTrefferzahl,
  parsePreis, parseOptionen, parseKaufformular, parseBilder,
  parseTechnischeDaten, parseArtikel, bewerteArtikel,

  /* Fachlogik: Katalog */
  baueKatalog, katalogMitCache, holeKategorie, holeArtikel, holeSuche,
  blaettere, reichereListeAn, kaufformularAntwort, diagnose,

  /* Generischer Warenkorb- und Preiszugang fuer beliebige Artikel */
  baueAddBodyAusFormular, addToCartPfad, preisAbfrageZiel, fetchPricePfad,

  /* Shop-Katalog in der Form des Designs */
  shopTeaser, shopSlug, shopKatalogStufe1, shopProduktAnreichern,
  shopKatalogStufe2, shopKatalogJs, standLesbar,

  /* Bilder und Antwortformen */
  pruefeMedienpfad, mediaZuApiPfad, cartResponse, entschaerfeFormulare,
};
