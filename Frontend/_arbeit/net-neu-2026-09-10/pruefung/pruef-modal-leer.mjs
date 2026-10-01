/* pruef-modal-leer.mjs — Prüfagent 01.10.2026, Nachgang zu einem Fund.
   Im Lauf 5 der Rennprüfung zeigte das Modal 0 Zeilen und Summen 0,00 €,
   während der Server 1 Position hatte. Diese Prüfung stellt genau das nach:
   Modal öffnen, WÄHREND der stille Nachzug noch in der Leitung hängt.

   Gemessen wird nach dem Öffnen mehrfach über die Zeit, damit sichtbar wird,
   ob das Modal dauerhaft leer bleibt oder sich noch füllt. */
import { neuesZiel } from './cdp2.mjs';

const B = 'http://localhost:8787/net-neu/';
const VERZUG = Number(process.env.VERZUG || 2500);
const LAEUFE = Number(process.env.LAEUFE || 6);
const SLUG = 'designmatten-jetprint-velour';
/* Wann nach dem Klick das Modal geöffnet wird (ms) — ins Verzögerungsfenster. */
const OEFFNEN_NACH = Number(process.env.OEFFNEN_NACH || 900);

const pfadVon = (u) => { try { return new URL(u).pathname; } catch (e) { return String(u); } };
const istKorbLesen = (p) => String(p.request.method || 'GET').toUpperCase() === 'GET'
  && /^\/api\/cart\/?$/.test(pfadVon(p.request.url));

async function einLauf(nr) {
  const t = await neuesZiel('about:blank');
  const t0 = Date.now();
  const spur = [];
  const log = (s) => spur.push(`${String(Date.now() - t0).padStart(5)} ms  ${s}`);
  try {
    await t.viewport(1280, 2000);
    await t.navigiere(B + 'index.html');
    await t.api('/api/cart/clear', {});
    await t.eval('try{sessionStorage.clear()}catch(e){}');

    t.an('Fetch.requestPaused', (p) => {
      if (istKorbLesen(p)) {
        log(`-> GET /api/cart (angehalten ${VERZUG} ms)`);
        setTimeout(() => {
          log('<- GET /api/cart frei');
          t.sende('Fetch.continueRequest', { requestId: p.requestId }).catch(() => null);
        }, VERZUG);
        return;
      }
      t.sende('Fetch.continueRequest', { requestId: p.requestId }).catch(() => null);
    });
    await t.sende('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });

    await t.navigiereOhneWarten(`${B}produkt.html?slug=${SLUG}`);
    await t.warteBis('!!document.querySelector("#add-to-cart") && !document.querySelector("#add-to-cart").disabled && !!document.querySelector("#price") && /\\d/.test(document.querySelector("#price").textContent)', 20000, 50);
    await t.setze('#input_width', 60);
    await t.setze('#input_length', 85);
    await t.pause(200);

    log('KLICK add-to-cart');
    await t.klick('#add-to-cart');
    await t.pause(OEFFNEN_NACH);
    log('Modal öffnen');
    await t.eval('window.jQuery ? window.jQuery("#cart-modal").modal("show") : window.Shell.warenkorbLaden()').catch(() => null);

    /* Mehrfach nachsehen: bleibt es leer oder füllt es sich noch? */
    const proben = [];
    for (const nachMs of [300, 1000, 2000, 3500, 5000, 7000]) {
      await t.pause(nachMs - (proben.length ? proben[proben.length - 1].nachMs : 0));
      proben.push({
        nachMs,
        ...await t.eval(`(function(){
          var z=document.querySelectorAll('#cart-zeilen tr[data-key]');
          var s=document.querySelector('#cart-summen');
          var sp=document.querySelector('#cart-zeilen .spinner-border');
          var leer=document.querySelector('#cart-zeilen');
          return {
            zeilen: z.length,
            spinner: !!sp,
            summen: s? s.innerText.replace(/\\s+/g,' ').trim().slice(0,90):'',
            text: leer? leer.innerText.replace(/\\s+/g,' ').trim().slice(0,70):''
          };
        })()`)
      });
    }

    await t.sende('Fetch.disable');
    const server = await t.api('/api/cart');
    const serverCount = server && server.d && server.d.count;
    const zaehler = await t.eval('(document.querySelector("#cart-count")||{}).textContent || ""');
    await t.api('/api/cart/clear', {});

    const letzte = proben[proben.length - 1];
    return {
      nr, serverCount, zaehler, proben,
      endstand: { zeilen: letzte.zeilen, summen: letzte.summen },
      dauerhaftLeer: letzte.zeilen === 0 && Number(serverCount) > 0,
      konsole: t.konsole.slice(), spur
    };
  } catch (e) {
    return { nr, fehler: String(e.stack || e), spur };
  } finally {
    await t.schliessen();
  }
}

const alle = [];
for (let i = 1; i <= LAEUFE; i++) {
  const r = await einLauf(i);
  alle.push(r);
  console.error(`· Lauf ${i}: ${r.fehler ? 'FEHLER' : `Server ${r.serverCount} · Zähler "${r.zaehler}" · Modal-Verlauf ${r.proben.map((p) => p.zeilen).join('/')} · ${r.dauerhaftLeer ? 'DAUERHAFT LEER' : 'ok am Ende'}`}`);
}
console.log(JSON.stringify({ verzug: VERZUG, oeffnenNach: OEFFNEN_NACH, laeufe: alle }, null, 2));
process.exit(0);
