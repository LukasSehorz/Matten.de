/* pruef-rennen-01-10.mjs — Prüfagent, Punkt 1: das Rennen Lesen/Schreiben nachstellen.
   GET /api/cart wird per Fetch.requestPaused um VERZUG ms angehalten, dann wird
   im langsamen Fenster "In den Warenkorb" geklickt. Verglichen werden
   Zähler (Kopf), Modal-Zeilen und Server (GET /api/cart, ohne Verzögerung).
   POST /api/kasse/bestellen wird nie ausgelöst. Nach jedem Lauf /api/cart/clear. */
import { neuesZiel } from './cdp2.mjs';

const B = 'http://localhost:8787/net-neu/';
const VERZUG = Number(process.env.VERZUG || 2500);
const LAEUFE = Number(process.env.LAEUFE || 6);
const SLUG = process.env.SLUG || 'designmatten-jetprint-velour';

const pfadVon = (u) => { try { return new URL(u).pathname; } catch (e) { return String(u); } };
/* Nur der reine Korb-Lesezugriff, NICHT /add, /menge, /clear. */
const istKorbLesen = (p) => String(p.request.method || 'GET').toUpperCase() === 'GET'
  && /^\/api\/cart\/?$/.test(pfadVon(p.request.url));

async function einLauf(nr) {
  const t = await neuesZiel('about:blank');
  const t0 = Date.now();
  const spur = [];
  const log = (s) => spur.push(`${String(Date.now() - t0).padStart(5)} ms  ${s}`);
  let angehalten = 0;
  try {
    await t.viewport(1280, 2000);
    /* Vorbereitung ohne Verzögerung: Korb leeren. */
    await t.navigiere(B + 'index.html');
    await t.api('/api/cart/clear', {});
    await t.eval('try{sessionStorage.clear()}catch(e){}');

    /* Verzögerung einschalten. */
    t.an('Fetch.requestPaused', async (p) => {
      if (istKorbLesen(p)) {
        angehalten++;
        log(`-> GET /api/cart  (angehalten ${VERZUG} ms)`);
        setTimeout(() => {
          log('<- GET /api/cart freigegeben');
          t.sende('Fetch.continueRequest', { requestId: p.requestId }).catch(() => null);
        }, VERZUG);
        return;
      }
      if (/^\/api\//.test(pfadVon(p.request.url))) log(`-> ${p.request.method} ${pfadVon(p.request.url)}`);
      t.sende('Fetch.continueRequest', { requestId: p.requestId }).catch(() => null);
    });
    await t.sende('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });

    /* Produktseite laden (ohne auf load zu warten — wir wollen ins Fenster hinein). */
    await t.navigiereOhneWarten(`${B}produkt.html?slug=${SLUG}`);
    /* Warten, bis der Kaufknopf bedienbar ist und ein Preis steht. */
    await t.warteBis('!!document.querySelector("#add-to-cart") && !document.querySelector("#add-to-cart").disabled && !!document.querySelector("#price") && /\\d/.test(document.querySelector("#price").textContent)', 20000, 50);
    const klickbarNach = Date.now() - t0;
    log(`Kaufknopf bedienbar (${klickbarNach} ms seit Start)`);

    /* Standardmaß setzen, damit der Preis sicher steht. */
    await t.setze('#input_width', 60);
    await t.setze('#input_length', 85);
    await t.pause(250);

    /* KLICK im langsamen Fenster. */
    log('KLICK add-to-cart');
    await t.klick('#add-to-cart');
    const meldung = await t.warteBis('(function(){var m=document.querySelector("#produkt-meldung");return m&&m.textContent.trim()?m.textContent.trim():null})()', 20000, 100).catch(() => '(keine Meldung)');
    log('Meldung: ' + String(meldung).replace(/\s+/g, ' ').slice(0, 90));

    /* Abwarten, bis die angehaltene Antwort durch ist und alles ruht. */
    await t.pause(VERZUG + 2500);
    const zaehler = await t.eval('(document.querySelector("#cart-count")||{}).textContent || ""');

    /* Modal öffnen (liest frisch vom Server). */
    await t.eval('window.Shell.warenkorbOeffnen ? window.Shell.warenkorbOeffnen() : window.Shell.warenkorbLaden()').catch(() => null);
    await t.pause(1200);
    await t.warteBis('!document.querySelector("#cart-zeilen .spinner-border")', 15000, 100).catch(() => null);
    const modal = await t.eval(`(function(){
      var z=document.querySelectorAll('#cart-zeilen tr[data-key]');
      var s=document.querySelector('#cart-summen');
      return { zeilen: z.length, summen: s? s.innerText.replace(/\\s+/g,' ').trim().slice(0,120):'' };
    })()`);

    /* Server-Wahrheit: GET /api/cart OHNE Verzögerung (Fetch aus). */
    await t.sende('Fetch.disable');
    const server = await t.api('/api/cart');
    const serverCount = server && server.d && server.d.count;
    const serverItems = server && server.d && Array.isArray(server.d.items) ? server.d.items.length : null;

    /* Aufräumen. */
    await t.api('/api/cart/clear', {});

    const einig = Number(serverCount) === modal.zeilen
      && String(zaehler).replace(/\D/g, '') === String(serverCount || '');
    return {
      nr, klickbarNach, angehalten, meldung: String(meldung).replace(/\s+/g, ' ').slice(0, 70),
      zaehler, modalZeilen: modal.zeilen, modalSummen: modal.summen,
      serverCount, serverItems,
      einig,
      spinnerHaengt: await t.eval('!!document.querySelector("#cart-zeilen .spinner-border")'),
      konsole: t.konsole.slice(),
      fehlerAntworten: t.netz.filter((n) => n.status >= 400).map((n) => n.status + ' ' + pfadVon(n.url)),
      spur
    };
  } catch (e) {
    return { nr, fehler: String(e.stack || e), spur, konsole: t.konsole.slice() };
  } finally {
    await t.schliessen();
  }
}

const alle = [];
for (let i = 1; i <= LAEUFE; i++) {
  const r = await einLauf(i);
  alle.push(r);
  console.error(`· Lauf ${i}: ${r.fehler ? 'FEHLER ' + r.fehler.slice(0, 80) : `Zähler "${r.zaehler}" · Modal ${r.modalZeilen} · Server ${r.serverCount} · ${r.einig ? 'EINIG' : 'UNEINIG'}`}`);
}
console.log(JSON.stringify({ verzug: VERZUG, slug: SLUG, laeufe: alle }, null, 2));

process.exit(0);
