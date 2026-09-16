/* cdp.mjs — kleiner CDP-Treiber (Prüfung net-neu). Node 26: WebSocket global.
   Chrome: --headless=new --remote-debugging-port=9222
   import { neuesZiel } from './cdp.mjs'
   const t = await neuesZiel('http://localhost:8787/net-neu/');
   await t.warteBis('!!document.querySelector("#price")');
   await t.eval('document.title');  t.konsole  await t.schliessen(); */
import fs from 'node:fs';

const PORT = process.env.CDP_PORT || 9222;

export async function neuesZiel(url) {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?${url}`, { method: 'PUT' });
  const info = await r.json();
  return verbinde(info);
}

async function verbinde(info) {
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const wartend = new Map();
  const konsole = [];
  const netz = [];
  let geladen = false;
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && wartend.has(m.id)) { wartend.get(m.id)(m); wartend.delete(m.id); return; }
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
      konsole.push(m.params.type + ': ' + m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      const e = m.params.exceptionDetails;
      konsole.push('exception: ' + (e.exception && e.exception.description || e.text));
    }
    if (m.method === 'Log.entryAdded' && (m.params.entry.level === 'error' || m.params.entry.level === 'warning')) {
      konsole.push('log-' + m.params.entry.level + ': ' + m.params.entry.text + (m.params.entry.url ? ' @ ' + m.params.entry.url : ''));
    }
    if (m.method === 'Network.responseReceived') netz.push({ url: m.params.response.url, status: m.params.response.status });
    if (m.method === 'Page.loadEventFired') geladen = true;
  };
  const sende = (method, params = {}) => new Promise((res) => {
    const i = ++id; wartend.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
  });
  await sende('Runtime.enable');
  await sende('Log.enable');
  await sende('Page.enable');
  await sende('Network.enable');

  async function evalRoh(expression, awaitPromise = true) {
    const r = await sende('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
    if (r.error) throw new Error('CDP: ' + JSON.stringify(r.error));
    if (r.result.exceptionDetails) {
      const e = r.result.exceptionDetails;
      throw new Error('Seite: ' + (e.exception && e.exception.description || e.text));
    }
    return r.result.result.value;
  }
  const t = {
    info, konsole, netz, sende,
    eval: evalRoh,
    async warteBis(expr, ms = 15000, schritt = 100) {
      const ende = Date.now() + ms;
      while (Date.now() < ende) {
        let v = null;
        try { v = await evalRoh(expr); } catch (e) { v = null; }
        if (v) return v;
        await new Promise((r) => setTimeout(r, schritt));
      }
      throw new Error('Zeit abgelaufen: ' + expr);
    },
    async pause(ms) { await new Promise((r) => setTimeout(r, ms)); },
    async navigiere(url, ms = 20000) {
      geladen = false;
      await sende('Page.navigate', { url });
      const ende = Date.now() + ms;
      while (!geladen && Date.now() < ende) await new Promise((r) => setTimeout(r, 50));
      if (!geladen) throw new Error('Laden nicht beendet: ' + url);
    },
    async viewport(w, h) {
      await sende('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 800 });
    },
    async screenshot(pfad, ganz = true) {
      const r = await sende('Page.captureScreenshot', { format: 'png', captureBeyondViewport: ganz });
      fs.writeFileSync(pfad, Buffer.from(r.result.data, 'base64'));
      return pfad;
    },
    /* Feld setzen wie eine Eingabe: value + input + change */
    async setze(sel, wert) {
      return evalRoh(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(!e) return 'FEHLT '+${JSON.stringify(sel)};
        e.value=${JSON.stringify(String(wert))}; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return 'ok';})()`);
    },
    async haken(sel, an) {
      return evalRoh(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(!e) return 'FEHLT';
        e.checked=${an ? 'true' : 'false'}; e.dispatchEvent(new Event('change',{bubbles:true})); return 'ok';})()`);
    },
    async klick(sel) {
      return evalRoh(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); if(!e) return 'FEHLT '+${JSON.stringify(sel)}; e.click(); return 'ok';})()`);
    },
    async text(sel) {
      return evalRoh(`(function(){var e=document.querySelector(${JSON.stringify(sel)}); return e? e.textContent.trim() : null;})()`);
    },
    async api(url, daten) {
      /* Aufruf der Brücke aus der Seite heraus (gleiche Sitzung wie die UI) */
      return evalRoh(`fetch(${JSON.stringify(url)}, ${daten === undefined ? '{credentials:"same-origin"}' :
        `{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:${JSON.stringify(JSON.stringify(daten))}}`})
        .then(r=>r.json().then(d=>({http:r.status,d})))`);
    },
    async schliessen() {
      try { ws.close(); } catch (e) { /* egal */ }
      await fetch(`http://127.0.0.1:${PORT}/json/close/${info.id}`).catch(() => null);
    }
  };
  return t;
}
