/* pruef-rennen-original.mjs — Gegenprobe (Prüfagent 01.10.2026).
   Dasselbe Messverfahren wie pruef-rennen-01-10.mjs, aber shell.js wird per
   CDP (Fetch.fulfillRequest) durch den Stand aus HEAD ersetzt. Die Datei auf
   der Platte bleibt unangetastet — es wird kein Produktivcode geändert.

   Zweck: zeigen, dass die Messung den Fehler ÜBERHAUPT findet. Eine Prüfung,
   die nie anschlägt, beweist nichts. Erwartung: hier gehen Positionen verloren.

   SHELL_ORIGINAL=<pfad> zeigt auf den Originalstand (git show HEAD:...). */
import fs from 'node:fs';
import { neuesZiel } from './cdp2.mjs';

const B = 'http://localhost:8787/net-neu/';
const VERZUG = Number(process.env.VERZUG || 2500);
const LAEUFE = Number(process.env.LAEUFE || 5);
const SLUG = process.env.SLUG || 'designmatten-jetprint-velour';
const ORIGINAL = fs.readFileSync(process.env.SHELL_ORIGINAL, 'utf8');
const ORIGINAL_B64 = Buffer.from(ORIGINAL, 'utf8').toString('base64');

const pfadVon = (u) => { try { return new URL(u).pathname; } catch (e) { return String(u); } };
const istKorbLesen = (p) => String(p.request.method || 'GET').toUpperCase() === 'GET'
  && /^\/api\/cart\/?$/.test(pfadVon(p.request.url));
const istShell = (p) => /\/assets\/js\/shell\.js$/.test(pfadVon(p.request.url));

async function einLauf(nr) {
  const t = await neuesZiel('about:blank');
  const t0 = Date.now();
  const spur = [];
  const log = (s) => spur.push(`${String(Date.now() - t0).padStart(5)} ms  ${s}`);
  let eingespielt = 0;
  try {
    await t.viewport(1280, 2000);
    await t.navigiere(B + 'index.html');
    await t.api('/api/cart/clear', {});
    await t.eval('try{sessionStorage.clear()}catch(e){}');

    t.an('Fetch.requestPaused', (p) => {
      if (istShell(p)) {
        eingespielt++;
        log('shell.js -> ORIGINAL eingespielt');
        t.sende('Fetch.fulfillRequest', {
          requestId: p.requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'application/javascript; charset=utf-8' }],
          body: ORIGINAL_B64
        }).catch(() => null);
        return;
      }
      if (istKorbLesen(p)) {
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

    await t.navigiereOhneWarten(`${B}produkt.html?slug=${SLUG}`);
    await t.warteBis('!!document.querySelector("#add-to-cart") && !document.querySelector("#add-to-cart").disabled && !!document.querySelector("#price") && /\\d/.test(document.querySelector("#price").textContent)', 20000, 50);
    await t.setze('#input_width', 60);
    await t.setze('#input_length', 85);
    await t.pause(250);

    log('KLICK add-to-cart');
    await t.klick('#add-to-cart');
    const meldung = await t.warteBis('(function(){var m=document.querySelector("#produkt-meldung");return m&&m.textContent.trim()?m.textContent.trim():null})()', 20000, 100).catch(() => '(keine Meldung)');
    log('Meldung: ' + String(meldung).replace(/\s+/g, ' ').slice(0, 90));

    await t.pause(VERZUG + 2500);
    const zaehler = await t.eval('(document.querySelector("#cart-count")||{}).textContent || ""');
    await t.eval('window.jQuery ? window.jQuery("#cart-modal").modal("show") : window.Shell.warenkorbLaden()').catch(() => null);
    await t.pause(1500);
    const modal = await t.eval('document.querySelectorAll("#cart-zeilen tr[data-key]").length');

    await t.sende('Fetch.disable');
    const server = await t.api('/api/cart');
    const serverCount = server && server.d && server.d.count;
    await t.api('/api/cart/clear', {});

    return {
      nr, eingespielt, meldung: String(meldung).replace(/\s+/g, ' ').slice(0, 70),
      zaehler, modalZeilen: modal, serverCount,
      einig: Number(serverCount) === modal && String(zaehler).replace(/\D/g, '') === String(serverCount || ''),
      spur
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
  console.error(`· Lauf ${i}: ${r.fehler ? 'FEHLER ' + r.fehler.slice(0, 80) : `eingespielt ${r.eingespielt} · Zähler "${r.zaehler}" · Modal ${r.modalZeilen} · Server ${r.serverCount} · ${r.einig ? 'EINIG' : 'UNEINIG'}`}`);
}
console.log(JSON.stringify({ gegenprobe: 'ORIGINAL shell.js (HEAD)', verzug: VERZUG, laeufe: alle }, null, 2));
process.exit(0);
