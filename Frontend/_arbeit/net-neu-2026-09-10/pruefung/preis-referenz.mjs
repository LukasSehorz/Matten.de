/* preis-referenz.mjs — Referenzwerte nach Prüfplan C15 mit preisformel.js (unverändert aus dem Projekt) */
import { berechne, runde, stammdatenFuer } from '/Users/lukas.sehorz/Library/CloudStorage/OneDrive-Persönlich/Desktop/Webseiten/Sale/Matten de/Frontend/bridge-demo/public/preisformel.js';

const PROD = {
  jetprint: { artikelnummer: '6300000N', bezeichnung: 'JetPrint-Premium', colortype: 1, salesfactorMehrfarbig: 1.931, ekListenpreisProQm: 52.67, standardbreiten: [60, 75, 85, 115, 150, 200] },
  ironhorse: { artikelnummer: '63000', bezeichnung: 'IRON-HORSE 1-farbig', colortype: 1, salesfactorMehrfarbig: 1.8, ekListenpreisProQm: 27.89, standardbreiten: [85, 115, 150, 200] },
  kokos: { artikelnummer: '6920001N', bezeichnung: 'Kokos natur', colortype: 1, salesfactorMehrfarbig: 1.375, ekListenpreisProQm: 41.84, standardbreiten: [200] },
  diplomat: { artikelnummer: '652601', bezeichnung: 'Diplomat R', colortype: 1, salesfactorMehrfarbig: 1.317, ekListenpreisProQm: 265.09, standardbreiten: [100] },
};
const ST = Object.fromEntries(Object.entries(PROD).map(([k, v]) => [k, stammdatenFuer(v)]));

/* Nachbildung der UI-Rechnung mitSteuerUndVersand() (seite-produkt.js) — nur zum Vergleich der Anzeige */
function ui(nettoGesamt, aufschlagJeStueck, menge, versand, ust = 19) {
  const aufschlag = runde((aufschlagJeStueck || 0) * (menge || 1), 2);
  const netto = runde(nettoGesamt + aufschlag, 2);
  const u = runde(netto * (ust / 100), 2);
  const wareBrutto = runde(netto + u, 2);
  return { netto, aufschlag, ust: u, wareBrutto, bruttoPlan: runde(netto * (1 + ust / 100), 2), endpreis: versand == null ? null : runde(wareBrutto + versand, 2) };
}

const faelle = [
  ['a', 'jetprint', { breite: 60, laenge: 40, menge: 1 }],
  ['b', 'jetprint', { breite: 50, laenge: 200, menge: 1 }],
  ['c', 'jetprint', { breite: 90, laenge: 120, menge: 1 }],
  ['d', 'jetprint', { breite: 90, laenge: 60, menge: 5 }],
  ['e', 'jetprint', { breite: 85, laenge: 120, menge: 2, sonderfarbe: true }],
  ['f', 'jetprint', { breite: 85, laenge: 120, menge: 1, sonderformMitRand: true }],
  ['g', 'jetprint', { breite: 250, laenge: 250, menge: 1 }],
  ['h', 'jetprint', { breite: 29, laenge: 100, menge: 1 }],
  ['i1', 'ironhorse', { breite: 60, laenge: 100, menge: 1 }],
  ['i2', 'ironhorse', { breite: 85, laenge: 100, menge: 1 }],
  ['j', 'kokos', { breite: 100, laenge: 100, menge: 1 }, { aufschlag: 10.56, hinweis: '30mm' }],
  ['k', 'diplomat', { breite: 100, laenge: 100, menge: 1 }, { aufschlag: 35.87, hinweis: 'mit Kratzkante' }],
];
const versand = { jetprint: Number(process.env.V_JETPRINT ?? 'NaN'), ironhorse: Number(process.env.V_IRON ?? 'NaN'), kokos: Number(process.env.V_KOKOS ?? 'NaN'), diplomat: Number(process.env.V_DIPLOMAT ?? 'NaN') };

const out = {};
for (const [id, p, e, z] of faelle) {
  const r = berechne({ sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false, ...e }, ST[p]);
  if (!r.ok) { out[id] = { produkt: p, eingabe: e, ok: false, code: r.code, grund: r.grund, klartext: r.klartext }; continue; }
  const v = Number.isFinite(versand[p]) ? versand[p] : null;
  const g = ui(r.vkGesamt, z ? z.aufschlag : 0, e.menge, v);
  const s = ui(r.vkProStueckOhneEinmaliges, z ? z.aufschlag : 0, 1, null);
  out[id] = {
    produkt: p, eingabe: e, zusatz: z || null, ok: true,
    formel: { vkProStueck: r.vkProStueck, vkProStueckOhneEinmaliges: r.vkProStueckOhneEinmaliges, vkGesamt: r.vkGesamt, faktorBreite: r.faktorBreite, faktorLaenge: r.faktorLaenge, staffelfaktor: r.staffelfaktor, faktorFormMitRand: r.faktorFormMitRand, faktorFormOhneRand: r.faktorFormOhneRand, qmProStueck: r.qmProStueck },
    ui: { nettoJeStueck: s.netto, nettoGesamt: g.netto, aufschlag: g.aufschlag, wareBrutto: g.wareBrutto, bruttoNachPlan: g.bruttoPlan, versand: v, endpreis: g.endpreis },
  };
}
console.log(JSON.stringify(out, null, 1));
