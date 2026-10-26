// Rendert logo_german_40.svg als PNG in 1x (520 x 100) und 2x (1040 x 200) mit transparentem Grund.
// Aufruf (im Ordner Frontend/_arbeit/logo-40):  node render-logo.js
// Braucht puppeteer-core und ein Chromium; Pfade unten anpassen. Danach daten.js neu bauen
// (node bau-net-daten.mjs) — der Generator nimmt die Dateien, sobald sie in assets/img liegen.
const fs = require('fs');
const path = require('path');
const puppeteer = require(process.env.PUPPETEER || '/Users/lukas.sehorz/Umzug-Windows/Desktop/KI-Agentur/Flowstate/Flowstate OS/flowstate-dashboard/node_modules/puppeteer-core');
const CHROME = process.env.CHROME || (() => {
  const c = path.join(require('os').homedir(), 'Library/Caches/ms-playwright');
  const d = fs.readdirSync(c).filter((x) => /^chromium-\d+$/.test(x)).sort().pop();
  return path.join(c, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
})();
const ZIEL = path.join(__dirname, '..', '..', 'bridge-demo', 'public', 'net-neu', 'assets', 'img');
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, 'logo_german_40.svg'), 'utf8');
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
  for (const [dpr, name] of [[1, 'logo_german_40.png'], [2, 'logo_german_40_2x.png']]) {
    const p = await b.newPage();
    await p.setViewport({ width: 520, height: 100, deviceScaleFactor: dpr });
    await p.setContent('<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>' + svg + '</body></html>');
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(ZIEL, name), omitBackground: true, clip: { x: 0, y: 0, width: 520, height: 100 } });
    console.log('geschrieben:', name);
    await p.close();
  }
  await b.close();
})();
