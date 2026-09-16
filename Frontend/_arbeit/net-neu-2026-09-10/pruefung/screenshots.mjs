/* screenshots.mjs — Ganzseiten-Screenshots (1280 px) über CDP: node screenshots.mjs datei=url [datei=url …] */
import { neuesZiel } from './cdp.mjs';

for (const arg of process.argv.slice(2)) {
  const i = arg.indexOf('=');
  const datei = arg.slice(0, i), url = arg.slice(i + 1);
  const t = await neuesZiel('about:blank');
  try {
    await t.viewport(1280, 2400);
    await t.navigiere(url, 60000);
    await t.pause(url.includes('localhost') ? 2500 : 4000);
    /* Karussell anhalten, damit die erste Folie steht */
    await t.eval('window.jQuery && jQuery("#carousel").carousel && jQuery("#carousel").carousel(0) && jQuery("#carousel").carousel("pause"); true').catch(() => null);
    await t.pause(800);
    const h = await t.eval('document.documentElement.scrollHeight');
    await t.screenshot(datei, true);
    console.log(datei, 'ok', 'hoehe', h, 'konsole', t.konsole.length);
  } catch (e) {
    console.log(datei, 'FEHLER', e.message);
  } finally { await t.schliessen(); }
}
