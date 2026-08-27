/**
 * pruefe-preisformel.mjs
 * ============================================================================
 * Prueft public/preisformel.js gegen die Arbeitsmappe
 *
 *     PREISE-Brian-26-10_22-11.xlsx  ·  Blatt "Blatt1"
 *
 * Aufruf:   node pruefe-preisformel.mjs            (Uebersicht)
 *           node pruefe-preisformel.mjs --voll     (alle 17 Werte je Fall)
 *
 * Keine npm-Pakete, kein Netz. Node ab Version 20.
 *
 *
 * WIE DIE SOLLWERTE ENTSTANDEN SIND
 * ---------------------------------
 * Der ideale Weg waere gewesen, die Eingabewerte in die Mappe zu schreiben und
 * sie von LibreOffice neu berechnen zu lassen. Auf diesem Rechner ist
 * LibreOffice aber nicht installiert (`soffice --version` findet nichts).
 *
 * Deshalb der zweitbeste Weg: ein kleiner Excel-Formel-Interpreter in Python
 * liest die ECHTEN Formelstrings aus der .xlsx (openpyxl, data_only=False) und
 * wertet sie aus - Tokenizer, Parser, Auswertung mit Excel-Semantik
 * (IF ohne Else-Zweig liefert FALSCH; leere Zellen sind 0; Text wird in der
 * deutschen Locale zur Zahl, also "1,25" -> 1.25). Das ist eine zweite,
 * voneinander unabhaengige Umsetzung: sie kennt preisformel.js nicht, sondern
 * nur die Formeln der Mappe.
 *
 * Beweis, dass der Interpreter richtig liegt: Mit den in der Mappe
 * gespeicherten Eingaben liefert er fuer alle 17 Ergebniszellen exakt die
 * Werte, die Excel selbst gerechnet und in die Datei geschrieben hat -
 * einschliesslich der Gleitkomma-Reste (K5 = 50.860530000000004).
 *
 * Die so gewonnenen Sollwerte stehen unten als FAELLE fest in dieser Datei,
 * damit die Pruefung ohne Python und ohne die .xlsx laeuft. Das Erzeugerskript
 * ist in PREISFORMEL.md, Abschnitt "Verifikation", beschrieben.
 *
 *
 * ABDECKUNG
 * ---------
 *  - Referenzfall der Mappe (50 x 200 cm, 1 Stueck, Colortype 1)
 *  - Standardbreite gegen Sondermass (Faktor 1,25), alle sechs Standardbreiten
 *  - alle sechs Mengenstaffeln (1, 2, 3, 10, 20, 30) und je eine Menge dazwischen
 *  - alle drei Colortypes und ein ungueltiger (Fallback auf die leere Zelle F19)
 *  - jede Sonderoption einzeln und in allen Kombinationen
 *  - Sonderfarbe bei Menge 1 / 2 / 10 / 30 - der Aufschlag faellt nur EINMAL an
 *  - die drei Fehlerfaelle, auch zwei Fehler gleichzeitig
 *  - Grenzwerte: genau 30 cm, genau 200 cm, genau 700 cm und je 1 cm daneben
 *  - ueberschriebene Artikelkonstanten (TZ %, EK-Listenpreis, Salesfactor,
 *    Sonderfarbenaufschlag)
 * ============================================================================
 */

import { berechne, KONSTANTEN } from './public/preisformel.js';

/* ---------------------------------------------------------------- Testfaelle */
/* Erzeugt aus den Formelstrings der .xlsx - siehe Kopf dieser Datei.        */
/* Alle Zahlen sind die vollen double-Werte, nicht gerundet.                 */

const FAELLE = [
  {
    name: "Referenzfall aus der Mappe (50x200, 1 Stk, Colortype 1)",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 105.49053,
      vkGesamt: 105.49053, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 54.63,
      marge: 50.860530000000004, gesamtQm: 1,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Standardbreite 60 trifft (60x120)",
    eingabe: { breite: 60, laenge: 120, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 0.72, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 75.9531816,
      vkGesamt: 75.9531816, ekProQm: 54.63,
      ekProStueck: 39.3336, ekGesamt: 39.3336,
      marge: 36.6195816, gesamtQm: 0.72,
      listenpreisProStueck: 75.9531816
    }
  },
  {
    name: "Standardbreite ueber die Laenge (120x85)",
    eingabe: { breite: 120, laenge: 85, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1.02, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 107.60034060000001,
      vkGesamt: 107.60034060000001, ekProQm: 54.63,
      ekProStueck: 55.72260000000001, ekGesamt: 55.72260000000001,
      marge: 51.8777406, gesamtQm: 1.02,
      listenpreisProStueck: 107.60034060000001
    }
  },
  {
    name: "Sondermass, keine Seite Standard (90x120) -> 1,25",
    eingabe: { breite: 90, laenge: 120, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1.08, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1.25,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 142.41221550000003,
      vkGesamt: 142.41221550000003, ekProQm: 68.28750000000001,
      ekProStueck: 73.75050000000002, ekGesamt: 73.75050000000002,
      marge: 68.66171550000001, gesamtQm: 1.08,
      listenpreisProStueck: 113.92977240000002
    }
  },
  {
    name: "Sondermass 31x31 -> 1,25",
    eingabe: { breite: 31, laenge: 31, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 0.09609999999999999, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1.25,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 12.672049916250002,
      vkGesamt: 12.672049916250002, ekProQm: 68.28750000000001,
      ekProStueck: 6.5624287500000005, ekGesamt: 6.5624287500000005,
      marge: 6.109621166250001, gesamtQm: 0.09609999999999999,
      listenpreisProStueck: 10.137639933
    }
  },
  {
    name: "Menge 1 (Staffel)",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 105.49053,
      vkGesamt: 105.49053, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 54.63,
      marge: 50.860530000000004, gesamtQm: 1,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Menge 2 (Staffel)",
    eingabe: { breite: 50, laenge: 200, menge: 2, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 100.2160035,
      vkGesamt: 200.432007, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 109.26,
      marge: 91.172007, gesamtQm: 2,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Menge 3 (Staffel)",
    eingabe: { breite: 50, laenge: 200, menge: 3, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 97.05128760000001,
      vkGesamt: 291.1538628, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 163.89000000000001,
      marge: 127.2638628, gesamtQm: 3,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Menge 5 (Staffel)",
    eingabe: { breite: 50, laenge: 200, menge: 5, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 97.05128760000001,
      vkGesamt: 485.25643800000006, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 273.15000000000003,
      marge: 212.10643800000003, gesamtQm: 5,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Menge 10 (Staffel)",
    eingabe: { breite: 50, laenge: 200, menge: 10, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 94.941477,
      vkGesamt: 949.4147700000001, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 546.3000000000001,
      marge: 403.11477, gesamtQm: 10,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Menge 15 (Staffel)",
    eingabe: { breite: 50, laenge: 200, menge: 15, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 94.941477,
      vkGesamt: 1424.122155, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 819.45,
      marge: 604.672155, gesamtQm: 15,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Menge 20 (Staffel)",
    eingabe: { breite: 50, laenge: 200, menge: 20, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 93.8865717,
      vkGesamt: 1877.731434, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 1092.6000000000001,
      marge: 785.1314339999999, gesamtQm: 20,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Menge 25 (Staffel)",
    eingabe: { breite: 50, laenge: 200, menge: 25, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 93.8865717,
      vkGesamt: 2347.1642925, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 1365.75,
      marge: 981.4142925000001, gesamtQm: 25,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Menge 30 (Staffel)",
    eingabe: { breite: 50, laenge: 200, menge: 30, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 92.8316664,
      vkGesamt: 2784.9499920000003, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 1638.9,
      marge: 1146.0499920000002, gesamtQm: 30,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Menge 50 (Staffel)",
    eingabe: { breite: 50, laenge: 200, menge: 50, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 92.8316664,
      vkGesamt: 4641.58332, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 2731.5,
      marge: 1910.0833199999997, gesamtQm: 50,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Colortype 1 (Mehrfarbig)",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 105.49053,
      vkGesamt: 105.49053, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 54.63,
      marge: 50.860530000000004, gesamtQm: 1,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Colortype 2 (Einfarbig)",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 2, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.728,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 94.40064000000001,
      vkGesamt: 94.40064000000001, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 54.63,
      marge: 39.77064000000001, gesamtQm: 1,
      listenpreisProStueck: 94.40064000000001
    }
  },
  {
    name: "Colortype 3 (Ped-Print)",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 3, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.8,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 98.334,
      vkGesamt: 98.334, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 54.63,
      marge: 43.704, gesamtQm: 1,
      listenpreisProStueck: 98.334
    }
  },
  {
    name: "Sonderform ohne Rand",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: true, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1.3,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 137.13768900000002,
      vkGesamt: 137.13768900000002, ekProQm: 71.019,
      ekProStueck: 71.019, ekGesamt: 71.019,
      marge: 66.11868900000002, gesamtQm: 1,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Sonderform mit Rand",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: true, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1.5, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 158.235795,
      vkGesamt: 158.235795, ekProQm: 81.94500000000001,
      ekProStueck: 81.94500000000001, ekGesamt: 81.94500000000001,
      marge: 76.29079499999999, gesamtQm: 1,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Sonderfarbe",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: true },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 173.49053,
      vkGesamt: 173.49053, ekProQm: 54.63,
      ekProStueck: 104.63, ekGesamt: 104.63,
      marge: 68.86053000000001, gesamtQm: 1,
      listenpreisProStueck: 173.49053
    }
  },
  {
    name: "Sonderform ohne Rand + Sonderfarbe",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: true, sonderformMitRand: false, sonderfarbe: true },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1.3,
      faktorFormMitRand: 1, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 205.13768900000002,
      vkGesamt: 205.13768900000002, ekProQm: 71.019,
      ekProStueck: 121.019, ekGesamt: 121.019,
      marge: 84.11868900000002, gesamtQm: 1,
      listenpreisProStueck: 173.49053
    }
  },
  {
    name: "Sonderform mit Rand + Sonderfarbe",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: true, sonderfarbe: true },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1.5, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 226.235795,
      vkGesamt: 226.235795, ekProQm: 81.94500000000001,
      ekProStueck: 131.945, ekGesamt: 131.945,
      marge: 94.290795, gesamtQm: 1,
      listenpreisProStueck: 173.49053
    }
  },
  {
    name: "Beide Sonderformen gleichzeitig",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: true, sonderformMitRand: true, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1.3,
      faktorFormMitRand: 1.5, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 205.70653350000003,
      vkGesamt: 205.70653350000003, ekProQm: 106.52850000000001,
      ekProStueck: 106.52850000000001, ekGesamt: 106.52850000000001,
      marge: 99.17803350000003, gesamtQm: 1,
      listenpreisProStueck: 105.49053
    }
  },
  {
    name: "Alles gleichzeitig",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: true, sonderformMitRand: true, sonderfarbe: true },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1.3,
      faktorFormMitRand: 1.5, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 273.70653350000003,
      vkGesamt: 273.70653350000003, ekProQm: 106.52850000000001,
      ekProStueck: 156.5285, ekGesamt: 156.5285,
      marge: 117.17803350000003, gesamtQm: 1,
      listenpreisProStueck: 173.49053
    }
  },
  {
    name: "Alles + Sondermass + Colortype 3, Menge 12",
    eingabe: { breite: 90, laenge: 130, menge: 12, colortype: 3, sonderformOhneRand: true, sonderformMitRand: true, sonderfarbe: true },
    erwartet: {
      qmProStueck: 1.17, salesfactor: 1.8,
      tzFaktor: 1, faktorBreite: 1.25,
      faktorLaenge: 1, faktorFormOhneRand: 1.3,
      faktorFormMitRand: 1.5, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 320.39264862500005,
      vkGesamt: 3096.711783500001, ekProQm: 133.16062500000004,
      ekProStueck: 205.79793125000003, ekGesamt: 1919.5751750000004,
      marge: 1177.1366085000004, gesamtQm: 14.04,
      listenpreisProStueck: 183.05078
    }
  },
  {
    name: "Sonderfarbe bei Menge 1",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: true },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 173.49053,
      vkGesamt: 173.49053, ekProQm: 54.63,
      ekProStueck: 104.63, ekGesamt: 104.63,
      marge: 68.86053000000001, gesamtQm: 1,
      listenpreisProStueck: 173.49053
    }
  },
  {
    name: "Sonderfarbe bei Menge 2",
    eingabe: { breite: 50, laenge: 200, menge: 2, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: true },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 168.2160035,
      vkGesamt: 268.432007, ekProQm: 54.63,
      ekProStueck: 104.63, ekGesamt: 159.26,
      marge: 109.17200700000001, gesamtQm: 2,
      listenpreisProStueck: 173.49053
    }
  },
  {
    name: "Sonderfarbe bei Menge 10",
    eingabe: { breite: 50, laenge: 200, menge: 10, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: true },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 162.94147700000002,
      vkGesamt: 1017.4147700000003, ekProQm: 54.63,
      ekProStueck: 104.63, ekGesamt: 596.3000000000001,
      marge: 421.11477000000025, gesamtQm: 10,
      listenpreisProStueck: 173.49053
    }
  },
  {
    name: "Sonderfarbe bei Menge 30",
    eingabe: { breite: 50, laenge: 200, menge: 30, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: true },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 160.83166640000002,
      vkGesamt: 2852.9499920000007, ekProQm: 54.63,
      ekProStueck: 104.63, ekGesamt: 1688.9,
      marge: 1164.0499920000007, gesamtQm: 30,
      listenpreisProStueck: 173.49053
    }
  },
  {
    name: "Fehler: zu schmal (29 breit)",
    eingabe: { breite: 29, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    fehler: "zu schmal"
  },
  {
    name: "Fehler: zu schmal (Laenge 20)",
    eingabe: { breite: 100, laenge: 20, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    fehler: "zu schmal"
  },
  {
    name: "Fehler: Matte zu breit (250x250)",
    eingabe: { breite: 250, laenge: 250, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    fehler: "Matte zu breit"
  },
  {
    name: "Fehler: Matte zu breit (201x700)",
    eingabe: { breite: 201, laenge: 700, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    fehler: "Matte zu breit"
  },
  {
    name: "Fehler: Matte zu lang (150x750)",
    eingabe: { breite: 150, laenge: 750, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    fehler: "Matte zu lang"
  },
  {
    name: "Fehler: Matte zu lang (750x150)",
    eingabe: { breite: 750, laenge: 150, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    fehler: "Matte zu lang"
  },
  {
    name: "Grenze: genau 30 cm breit",
    eingabe: { breite: 30, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 0.6, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 63.294318,
      vkGesamt: 63.294318, ekProQm: 54.63,
      ekProStueck: 32.778, ekGesamt: 32.778,
      marge: 30.516318, gesamtQm: 0.6,
      listenpreisProStueck: 63.294318
    }
  },
  {
    name: "Grenze: genau 30x30",
    eingabe: { breite: 30, laenge: 30, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 0.09, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1.25,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 11.867684624999999,
      vkGesamt: 11.867684624999999, ekProQm: 68.28750000000001,
      ekProStueck: 6.145875, ekGesamt: 6.145875,
      marge: 5.721809624999999, gesamtQm: 0.09,
      listenpreisProStueck: 9.4941477
    }
  },
  {
    name: "Grenze: genau 700 lang",
    eingabe: { breite: 200, laenge: 700, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 14, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 1476.86742,
      vkGesamt: 1476.86742, ekProQm: 54.63,
      ekProStueck: 764.82, ekGesamt: 764.82,
      marge: 712.04742, gesamtQm: 14,
      listenpreisProStueck: 1476.86742
    }
  },
  {
    name: "Grenze: genau 700 breit x 200 lang",
    eingabe: { breite: 700, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 14, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 1476.86742,
      vkGesamt: 1476.86742, ekProQm: 54.63,
      ekProStueck: 764.82, ekGesamt: 764.82,
      marge: 712.04742, gesamtQm: 14,
      listenpreisProStueck: 1476.86742
    }
  },
  {
    name: "Grenze: genau 200x200",
    eingabe: { breite: 200, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 4, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 421.96212,
      vkGesamt: 421.96212, ekProQm: 54.63,
      ekProStueck: 218.52, ekGesamt: 218.52,
      marge: 203.44212000000002, gesamtQm: 4,
      listenpreisProStueck: 421.96212
    }
  },
  {
    name: "Grenze: 200x201 (noch erlaubt)",
    eingabe: { breite: 200, laenge: 201, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 4.0200000000000005, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 424.0719306000001,
      vkGesamt: 424.0719306000001, ekProQm: 54.63,
      ekProStueck: 219.61260000000004, ekGesamt: 219.61260000000004,
      marge: 204.45933060000004, gesamtQm: 4.0200000000000005,
      listenpreisProStueck: 424.0719306000001
    }
  },
  {
    name: "Grenze: 201x200 (noch erlaubt)",
    eingabe: { breite: 201, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 4.0200000000000005, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 424.0719306000001,
      vkGesamt: 424.0719306000001, ekProQm: 54.63,
      ekProStueck: 219.61260000000004, ekGesamt: 219.61260000000004,
      marge: 204.45933060000004, gesamtQm: 4.0200000000000005,
      listenpreisProStueck: 424.0719306000001
    }
  },
  {
    name: "Grenze: 201x201 -> zu breit",
    eingabe: { breite: 201, laenge: 201, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    fehler: "Matte zu breit"
  },
  {
    name: "Standardbreite 60 cm",
    eingabe: { breite: 60, laenge: 333, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1.9980000000000002, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 210.77007894000002,
      vkGesamt: 210.77007894000002, ekProQm: 54.63,
      ekProStueck: 109.15074000000001, ekGesamt: 109.15074000000001,
      marge: 101.61933894, gesamtQm: 1.9980000000000002,
      listenpreisProStueck: 210.77007894000002
    }
  },
  {
    name: "Standardbreite 75 cm",
    eingabe: { breite: 75, laenge: 333, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 2.4975, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 263.462598675,
      vkGesamt: 263.462598675, ekProQm: 54.63,
      ekProStueck: 136.438425, ekGesamt: 136.438425,
      marge: 127.02417367499999, gesamtQm: 2.4975,
      listenpreisProStueck: 263.462598675
    }
  },
  {
    name: "Standardbreite 85 cm",
    eingabe: { breite: 85, laenge: 333, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 2.8305000000000002, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 298.59094516500005,
      vkGesamt: 298.59094516500005, ekProQm: 54.63,
      ekProStueck: 154.63021500000002, ekGesamt: 154.63021500000002,
      marge: 143.96073016500003, gesamtQm: 2.8305000000000002,
      listenpreisProStueck: 298.59094516500005
    }
  },
  {
    name: "Standardbreite 115 cm",
    eingabe: { breite: 115, laenge: 333, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 3.8295, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 403.97598463500003,
      vkGesamt: 403.97598463500003, ekProQm: 54.63,
      ekProStueck: 209.205585, ekGesamt: 209.205585,
      marge: 194.77039963500002, gesamtQm: 3.8295,
      listenpreisProStueck: 403.97598463500003
    }
  },
  {
    name: "Standardbreite 150 cm",
    eingabe: { breite: 150, laenge: 333, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 4.995, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 526.92519735,
      vkGesamt: 526.92519735, ekProQm: 54.63,
      ekProStueck: 272.87685, ekGesamt: 272.87685,
      marge: 254.04834734999997, gesamtQm: 4.995,
      listenpreisProStueck: 526.92519735
    }
  },
  {
    name: "Standardbreite 200 cm",
    eingabe: { breite: 200, laenge: 333, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 6.66, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 702.5669298,
      vkGesamt: 702.5669298, ekProQm: 54.63,
      ekProStueck: 363.8358, ekGesamt: 363.8358,
      marge: 338.7311298, gesamtQm: 6.66,
      listenpreisProStueck: 702.5669298
    }
  },
  {
    name: "Krumme Masse 62,5 x 137,5",
    eingabe: { breite: 62.5, laenge: 137.5, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 0.859375, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1.25,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 113.3199052734375,
      vkGesamt: 113.3199052734375, ekProQm: 68.28750000000001,
      ekProStueck: 58.68457031250001, ekGesamt: 58.68457031250001,
      marge: 54.63533496093749, gesamtQm: 0.859375,
      listenpreisProStueck: 90.65592421875
    }
  },
  {
    name: "Menge 0 (Excel liefert FALSE = 0)",
    eingabe: { breite: 50, laenge: 200, menge: 0, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 0,
      vkGesamt: 0, ekProQm: 0,
      ekProStueck: 0, ekGesamt: 0,
      marge: 0, gesamtQm: 0,
      listenpreisProStueck: 0
    }
  },
  {
    name: "Menge 0 mit Sonderfarbe",
    eingabe: { breite: 50, laenge: 200, menge: 0, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: true },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 68,
      vkGesamt: 68, ekProQm: 0,
      ekProStueck: 50, ekGesamt: 50,
      marge: 18, gesamtQm: 0,
      listenpreisProStueck: 68
    }
  },
  {
    name: "Fehler doppelt: 20x800 (zu schmal UND zu lang)",
    eingabe: { breite: 20, laenge: 800, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    fehler: "zu schmal"
  },
  {
    name: "Fehler doppelt: 25x250 (zu schmal, Rest ok)",
    eingabe: { breite: 25, laenge: 250, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    fehler: "zu schmal"
  },
  {
    name: "TZ 5 % (R2=5)",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    konstanten: { tzProzent: 5 },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1.05, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 110.76505650000001,
      vkGesamt: 110.76505650000001, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 54.63,
      marge: 56.13505650000001, gesamtQm: 1,
      listenpreisProStueck: 110.76505650000001
    }
  },
  {
    name: "TZ 12,5 % bei Menge 10 und Sonderfarbe",
    eingabe: { breite: 50, laenge: 200, menge: 10, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: true },
    konstanten: { tzProzent: 12.5 },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1.125, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 68,
      aufschlagEK: 50, vkProStueck: 174.809161625,
      vkGesamt: 1136.09161625, ekProQm: 54.63,
      ekProStueck: 104.63, ekGesamt: 596.3000000000001,
      marge: 539.79161625, gesamtQm: 10,
      listenpreisProStueck: 186.67684625
    }
  },
  {
    name: "Anderer EK-Listenpreis 61,90 (Q5)",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    konstanten: { ekListenpreisProQm: 61.9 },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 119.52890000000001,
      vkGesamt: 119.52890000000001, ekProQm: 61.9,
      ekProStueck: 61.9, ekGesamt: 61.9,
      marge: 57.62890000000001, gesamtQm: 1,
      listenpreisProStueck: 119.52890000000001
    }
  },
  {
    name: "Anderer Salesfactor Colortype 2 (I1=2,05)",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 2, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    konstanten: { salesfactorEinfarbig: 2.05 },
    erwartet: {
      qmProStueck: 1, salesfactor: 2.05,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 111.9915,
      vkGesamt: 111.9915, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 54.63,
      marge: 57.3615, gesamtQm: 1,
      listenpreisProStueck: 111.9915
    }
  },
  {
    name: "Anderer Sonderfarbenaufschlag (P5=90, P6=65)",
    eingabe: { breite: 50, laenge: 200, menge: 4, colortype: 1, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: true },
    konstanten: { aufschlagSonderfarbeVK: 90, aufschlagSonderfarbeEK: 65 },
    erwartet: {
      qmProStueck: 1, salesfactor: 1.931,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 90,
      aufschlagEK: 65, vkProStueck: 187.05128760000002,
      vkGesamt: 478.2051504000001, ekProQm: 54.63,
      ekProStueck: 119.63, ekGesamt: 283.52,
      marge: 194.6851504000001, gesamtQm: 4,
      listenpreisProStueck: 195.49053
    }
  },
  {
    name: "Colortype 4 (Fallback F19, leer)",
    eingabe: { breite: 50, laenge: 200, menge: 1, colortype: 4, sonderformOhneRand: false, sonderformMitRand: false, sonderfarbe: false },
    erwartet: {
      qmProStueck: 1, salesfactor: 0,
      tzFaktor: 1, faktorBreite: 1,
      faktorLaenge: 1, faktorFormOhneRand: 1,
      faktorFormMitRand: 1, aufschlagVK: 0,
      aufschlagEK: 0, vkProStueck: 0,
      vkGesamt: 0, ekProQm: 54.63,
      ekProStueck: 54.63, ekGesamt: 54.63,
      marge: -54.63, gesamtQm: 1,
      listenpreisProStueck: 0
    }
  }
];

/* ---------------------------------------------------------------- Ausgabe */

const VOLL = process.argv.includes('--voll');

/** Excel-Zelle je Ergebnisfeld - fuer die Detailtabelle. */
const ZELLE = {
  qmProStueck: 'D4', salesfactor: 'C2', tzFaktor: 'S2',
  faktorBreite: 'L5', faktorLaenge: 'M5',
  faktorFormOhneRand: 'N5', faktorFormMitRand: 'O5',
  aufschlagVK: 'P5', aufschlagEK: 'P6',
  vkProStueck: 'G5', vkGesamt: 'F5', ekProQm: 'J5',
  ekProStueck: 'I5', ekGesamt: 'H5', marge: 'K5',
  gesamtQm: 'D6', listenpreisProStueck: 'E6'
};

const BESCHRIFTUNG = {
  qmProStueck: 'qm je Stueck', salesfactor: 'Salesfactor', tzFaktor: 'TZ-Faktor',
  faktorBreite: 'Faktor Breite', faktorLaenge: 'Faktor Laenge',
  faktorFormOhneRand: 'Sonderform ohne Rand', faktorFormMitRand: 'Sonderform mit Rand',
  aufschlagVK: 'Aufschlag VK', aufschlagEK: 'Aufschlag EK',
  vkProStueck: 'VK je Stueck', vkGesamt: 'VK gesamt', ekProQm: 'EK je qm',
  ekProStueck: 'EK je Stueck', ekGesamt: 'EK gesamt', marge: 'Marge',
  gesamtQm: 'qm gesamt', listenpreisProStueck: 'Listenpreis je Stueck'
};

const FELDER = Object.keys(ZELLE);

/** Relative Toleranz. Beide Seiten rechnen in IEEE-754 double, aber nicht
 *  zwingend in derselben Reihenfolge - ein paar ULP Abstand sind erlaubt. */
const TOLERANZ = 1e-9;

function abweichung(erwartet, erhalten) {
  if (!Number.isFinite(erhalten)) return Infinity;
  const d = Math.abs(erwartet - erhalten);
  if (d === 0) return 0;
  const massstab = Math.max(Math.abs(erwartet), Math.abs(erhalten), 1e-12);
  return d / massstab;
}

function z(n, stellen = 6) {
  if (n === null || n === undefined) return '—';
  if (!Number.isFinite(n)) return String(n);
  return n.toFixed(stellen).replace('.', ',');
}

function abwText(rel) {
  if (rel === 0) return 'exakt';
  if (!Number.isFinite(rel)) return 'FEHLT';
  return rel.toExponential(1).replace('.', ',');
}

const li = (s, n) => String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s).padEnd(n);
const re = (s, n) => String(s).padStart(n);

function trenner(ch = '─', n = 126) { return ch.repeat(n); }

/* ---------------------------------------------------------------- Lauf */

console.log('');
console.log('='.repeat(126));
console.log('  preisformel.js  gegen  PREISE-Brian-26-10_22-11.xlsx / Blatt1');
console.log('  Sollwerte: Excel-Formel-Interpreter ueber die Original-Formelstrings (siehe Kopf dieser Datei)');
console.log('='.repeat(126));

/* ---- Teil 1: der Referenzfall Zelle fuer Zelle ---------------------- */

console.log('');
console.log('  TEIL 1 · Referenzfall der Mappe, Zelle fuer Zelle');
console.log('  Breite 50 cm, Laenge 200 cm, Menge 1, Colortype 1, keine Sonderoptionen');
console.log('');
console.log('  ' + li('Zelle', 7) + li('Groesse', 24) + re('erwartet', 20) + re('erhalten', 20) + re('Abweichung', 14) + '   Status');
console.log('  ' + trenner('─', 94));

const ref = FAELLE[0];
const refErg = berechne(ref.eingabe);
let refFehler = 0;
for (const feld of FELDER) {
  const soll = ref.erwartet[feld];
  const ist = refErg[feld];
  const rel = abweichung(soll, ist);
  const ok = rel <= TOLERANZ;
  if (!ok) refFehler++;
  console.log('  ' + li(ZELLE[feld], 7) + li(BESCHRIFTUNG[feld], 24) +
    re(z(soll), 20) + re(z(ist), 20) + re(abwText(rel), 14) + '   ' + (ok ? 'OK' : 'ABWEICHUNG'));
}
console.log('  ' + trenner('─', 94));
console.log('  ' + (refFehler === 0
  ? 'Alle 17 Zellen des Referenzfalls stimmen exakt.'
  : refFehler + ' Zelle(n) weichen ab.'));

/* ---- Teil 2: alle Faelle -------------------------------------------- */

console.log('');
console.log('  TEIL 2 · ' + FAELLE.length + ' Faelle. Verglichen wird jeder der 17 Werte;');
console.log('           die Tabelle zeigt VK je Stueck und VK gesamt sowie die groesste Abweichung ueber alle 17.');
console.log('');
console.log('  ' + li('Nr', 4) + li('Fall', 44) +
  re('VK/Stk erwartet', 17) + re('VK/Stk erhalten', 17) +
  re('VK ges erwartet', 17) + re('VK ges erhalten', 17) +
  re('max Abw.', 11) + '  Status');
console.log('  ' + trenner('─', 137));

let bestanden = 0;
const probleme = [];

FAELLE.forEach((fall, i) => {
  const nr = String(i + 1);
  const erg = berechne(fall.eingabe, fall.konstanten);

  /* --- Fehlerfall ---------------------------------------------------- */
  if (fall.fehler) {
    const ok = erg.ok === false && erg.grund === fall.fehler;
    if (ok) bestanden++;
    else probleme.push({ nr, name: fall.name, text: 'erwartet: Fehler "' + fall.fehler +
      '", erhalten: ' + (erg.ok === false ? '"' + erg.grund + '"' : 'ein Preis (' + z(erg.vkProStueck, 2) + ')') });
    console.log('  ' + li(nr, 4) + li(fall.name, 44) +
      re('"' + fall.fehler + '"', 17) +
      re(erg.ok === false ? '"' + erg.grund + '"' : 'ein Preis!', 17) +
      re('—', 17) + re('—', 17) +
      re('—', 11) + '  ' + (ok ? 'OK' : 'ABWEICHUNG'));
    if (VOLL) console.log('      └─ code=' + (erg.code || '—') + '  ' + (erg.klartext || ''));
    return;
  }

  /* --- Preisfall ------------------------------------------------------ */
  if (erg.ok !== true) {
    probleme.push({ nr, name: fall.name, text: 'erwartet: ein Preis, erhalten: Fehler "' + erg.grund + '"' });
    console.log('  ' + li(nr, 4) + li(fall.name, 44) +
      re(z(fall.erwartet.vkProStueck), 17) + re('FEHLER', 17) +
      re(z(fall.erwartet.vkGesamt), 17) + re('FEHLER', 17) +
      re('—', 11) + '  ABWEICHUNG');
    return;
  }

  let maxRel = 0, schlecht = 0;
  for (const feld of FELDER) {
    const rel = abweichung(fall.erwartet[feld], erg[feld]);
    if (rel > maxRel) maxRel = rel;
    if (rel > TOLERANZ) {
      schlecht++;
      probleme.push({
        nr, name: fall.name,
        text: ZELLE[feld] + ' ' + BESCHRIFTUNG[feld] + ': erwartet ' + fall.erwartet[feld] +
              ', erhalten ' + erg[feld] + '  (rel. Abw. ' + abwText(rel) + ')'
      });
    }
  }
  if (schlecht === 0) bestanden++;

  console.log('  ' + li(nr, 4) + li(fall.name, 44) +
    re(z(fall.erwartet.vkProStueck), 17) + re(z(erg.vkProStueck), 17) +
    re(z(fall.erwartet.vkGesamt), 17) + re(z(erg.vkGesamt), 17) +
    re(abwText(maxRel), 11) + '  ' + (schlecht === 0 ? 'OK' : 'ABWEICHUNG'));

  if (VOLL) {
    for (const feld of FELDER) {
      const rel = abweichung(fall.erwartet[feld], erg[feld]);
      console.log('      ' + li(ZELLE[feld], 5) + li(BESCHRIFTUNG[feld], 24) +
        re(z(fall.erwartet[feld]), 20) + re(z(erg[feld]), 20) + re(abwText(rel), 12));
    }
    if (erg.hinweise && erg.hinweise.length) {
      erg.hinweise.forEach((h) => console.log('      ⚠ ' + h));
    }
  }
});

console.log('  ' + trenner('─', 137));

/* ---- Teil 3: Abweichungen im Detail ---------------------------------- */

if (probleme.length) {
  console.log('');
  console.log('  TEIL 3 · Abweichungen im Detail');
  console.log('');
  probleme.forEach((p) => {
    console.log('  Fall ' + p.nr + ' – ' + p.name);
    console.log('      ' + p.text);
  });
}

/* ---- Teil 4: Zusatzpruefungen ---------------------------------------- */

console.log('');
console.log('  TEIL 4 · Zusatzpruefungen');
console.log('');

const zusatz = [];
function pruefe(name, bedingung, erlaeuterung) {
  zusatz.push({ name, ok: !!bedingung, erlaeuterung });
}

// 1. Der Sonderfarbenaufschlag darf in der Gesamtsumme genau einmal stecken.
{
  const ohne = berechne({ breite: 50, laenge: 200, menge: 7, colortype: 1 });
  const mit  = berechne({ breite: 50, laenge: 200, menge: 7, colortype: 1, sonderfarbe: true });
  const diff = mit.vkGesamt - ohne.vkGesamt;
  pruefe('Sonderfarbe VK faellt genau einmal an (Menge 7)',
    Math.abs(diff - KONSTANTEN.aufschlagSonderfarbeVK) < 1e-9,
    'Unterschied VK gesamt = ' + z(diff, 5) + ' €, erwartet ' + KONSTANTEN.aufschlagSonderfarbeVK + ',00 €');
  const diffEK = mit.ekGesamt - ohne.ekGesamt;
  pruefe('Sonderfarbe EK faellt genau einmal an (Menge 7)',
    Math.abs(diffEK - KONSTANTEN.aufschlagSonderfarbeEK) < 1e-9,
    'Unterschied EK gesamt = ' + z(diffEK, 5) + ' €, erwartet ' + KONSTANTEN.aufschlagSonderfarbeEK + ',00 €');
}

// 2. Ohne Sonderfarbe muss VK gesamt exakt Menge x VK je Stueck sein.
{
  const r = berechne({ breite: 90, laenge: 130, menge: 13, colortype: 2 });
  pruefe('Ohne Sonderfarbe: VK gesamt = Menge × VK je Stueck',
    Math.abs(r.vkGesamt - r.eingaben.menge * r.vkProStueck) < 1e-9,
    z(r.vkGesamt, 6) + ' gegen ' + z(r.eingaben.menge * r.vkProStueck, 6));
}

// 3. Die Funktion wirft nie - auch bei Unsinn nicht.
{
  const unsinn = [
    undefined, null, {}, { breite: 'abc', laenge: 200, menge: 1, colortype: 1 },
    { breite: -5, laenge: 200, menge: 1, colortype: 1 },
    { breite: 0, laenge: 0, menge: 0, colortype: 0 },
    { breite: Infinity, laenge: 200, menge: 1, colortype: 1 },
    { breite: NaN, laenge: NaN, menge: NaN, colortype: NaN }
  ];
  let geworfen = 0;
  for (const u of unsinn) {
    try { berechne(u); } catch (e) { geworfen++; }
  }
  pruefe('Keine Ausnahmen bei ungueltigen Eingaben',
    geworfen === 0, geworfen + ' von ' + unsinn.length + ' Aufrufen haben geworfen');
}

// 4. Eingaben als deutscher Zahltext ("62,5") ergeben dasselbe wie Zahlen.
{
  const a = berechne({ breite: 62.5, laenge: 137.5, menge: 3, colortype: 1 });
  const b = berechne({ breite: '62,5', laenge: '137,5', menge: '3', colortype: '1' });
  pruefe('Eingabe als Text ("62,5") = Eingabe als Zahl',
    a.ok && b.ok && Math.abs(a.vkGesamt - b.vkGesamt) < 1e-12,
    z(a.vkGesamt, 6) + ' gegen ' + z(b.vkGesamt, 6));
}

// 5. "X" statt true fuer die Ankreuzfelder - wie in der Mappe.
{
  const a = berechne({ breite: 50, laenge: 200, menge: 1, colortype: 1, sonderfarbe: true });
  const b = berechne({ breite: 50, laenge: 200, menge: 1, colortype: 1, sonderfarbe: 'X' });
  const c = berechne({ breite: 50, laenge: 200, menge: 1, colortype: 1, sonderfarbe: ' ' });
  pruefe('Ankreuzfeld akzeptiert true und "X", nicht aber " "',
    Math.abs(a.vkGesamt - b.vkGesamt) < 1e-12 && c.aufschlagVK === 0,
    'X = ' + z(b.vkGesamt, 2) + ', Leerzeichen = ' + z(c.vkGesamt, 2));
}

// 6. Die Standardkonstanten duerfen nicht veraenderbar sein.
{
  let veraendert = false;
  try { KONSTANTEN.ekListenpreisProQm = 999; } catch (e) { /* strict mode wirft */ }
  veraendert = KONSTANTEN.ekListenpreisProQm !== 54.63;
  pruefe('KONSTANTEN sind eingefroren', !veraendert,
    'ekListenpreisProQm = ' + KONSTANTEN.ekListenpreisProQm);
}

// 7. Ueberschriebene Konstanten veraendern das Original nicht.
{
  berechne({ breite: 50, laenge: 200, menge: 1, colortype: 1 }, { ekListenpreisProQm: 100 });
  const danach = berechne({ breite: 50, laenge: 200, menge: 1, colortype: 1 });
  pruefe('Ueberschreiben ist nicht dauerhaft',
    Math.abs(danach.vkProStueck - 105.49053) < 1e-9,
    'nach einem Aufruf mit Sonderkonstanten wieder ' + z(danach.vkProStueck, 5));
}

// 8. Es wird nicht vorzeitig gerundet.
{
  const r = berechne({ breite: 33, laenge: 47, menge: 3, colortype: 3 });
  const roh = String(r.vkGesamt);
  pruefe('Volle Genauigkeit bis zur Ausgabe',
    roh.replace('-', '').replace('.', '').replace(/0+$/, '').length > 6,
    'VK gesamt intern = ' + roh);
}

const zusatzFehler = zusatz.filter((p) => !p.ok).length;
zusatz.forEach((p) => {
  console.log('  ' + (p.ok ? '[ OK ]' : '[FEHL]') + '  ' + li(p.name, 52) + '  ' + p.erlaeuterung);
});

/* ---- Bilanz ---------------------------------------------------------- */

const gesamtFehler = (FAELLE.length - bestanden) + zusatzFehler + (refFehler > 0 ? 1 : 0);

console.log('');
console.log('='.repeat(126));
console.log('  BILANZ');
console.log('  ' + trenner('─', 60));
console.log('  Referenzfall, 17 Zellen einzeln .............. ' + (refFehler === 0 ? 'alle exakt' : refFehler + ' Abweichungen'));
console.log('  Faelle gegen die Mappe ....................... ' + bestanden + ' von ' + FAELLE.length + ' bestanden');
console.log('  davon Fehlerfaelle ........................... ' + FAELLE.filter((f) => f.fehler).length);
console.log('  verglichene Einzelwerte ...................... ' + (FAELLE.filter((f) => !f.fehler).length * FELDER.length));
console.log('  Zusatzpruefungen ............................. ' + (zusatz.length - zusatzFehler) + ' von ' + zusatz.length + ' bestanden');
console.log('  Toleranz ..................................... ' + TOLERANZ + ' relativ');
console.log('  ' + trenner('─', 60));
if (gesamtFehler === 0) {
  console.log('  ERGEBNIS: preisformel.js rechnet in allen ' + FAELLE.length +
    ' Faellen genau wie PREISE-Brian-26-10_22-11.xlsx.');
} else {
  console.log('  ERGEBNIS: ' + gesamtFehler + ' Punkt(e) stimmen nicht. Siehe Teil 3.');
}
console.log('='.repeat(126));
console.log('');

process.exit(gesamtFehler === 0 ? 0 : 1);
