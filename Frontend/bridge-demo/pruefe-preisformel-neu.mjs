/**
 * pruefe-preisformel-neu.mjs
 * ============================================================================
 * Prueft public/preisformel.js gegen die NEUE Arbeitsmappe des Auftraggebers
 *
 *     1PREISE-Brian_Sehorz-26-09-30_18-55.xlsx  ·  Blatt "Blatt1"
 *     (geliefert am 30.09.2026, liegt im Projektwurzel)
 *
 * Schwesterskript zu pruefe-preisformel.mjs, das gegen die aeltere Mappe
 * PREISE-Brian-26-10_22-11.xlsx prueft. Dieses Skript aendert preisformel.js
 * nicht und liest keine .xlsx — die Sollwerte stehen fest im Quelltext.
 *
 * Aufruf:   node pruefe-preisformel-neu.mjs
 *           node pruefe-preisformel-neu.mjs --voll    (alle Werte je Fall)
 *
 * Keine npm-Pakete, kein Netz. Node ab Version 20.
 *
 *
 * WIE DIE SOLLWERTE ENTSTANDEN SIND
 * ---------------------------------
 * Wie beim Schwesterskript: LibreOffice ist auf diesem Rechner nicht
 * installiert, deshalb wurden die ECHTEN Formelstrings der NEUEN .xlsx mit
 * openpyxl (data_only=False) gelesen und von einem kleinen Excel-Formel-
 * Interpreter in Python ausgewertet — Tokenizer, Parser, Auswertung mit
 * Excel-Semantik (IF ohne Else-Zweig liefert FALSCH; leere Zellen sind 0;
 * Text wird in der deutschen Locale zur Zahl, also "1,25" -> 1.25; Zahl ist
 * im Vergleich immer kleiner als Text). Der Interpreter kennt preisformel.js
 * nicht, sondern nur die Formeln der Mappe — es ist also eine zweite,
 * unabhaengige Umsetzung.
 *
 * Beweis, dass der Interpreter richtig liegt: Mit den in der NEUEN Mappe
 * gespeicherten Eingaben (B4=50, C4=200, E4=1, F2=1) liefert er fuer alle 17
 * Ergebniszellen exakt die Werte, die Excel selbst gerechnet und in die Datei
 * geschrieben hat — einschliesslich der Gleitkomma-Reste
 * (K5 = 50.860530000000004).
 *
 *
 * BEFUND VOM 02.10.2026 — DIE RECHNUNG IST UNVERAENDERT
 * -----------------------------------------------------
 * Ein Zellvergleich beider Mappen ergab: Der gesamte Rechenbereich A1:W7 ist
 * Zelle fuer Zelle identisch — alle Formeln, alle Stammdaten, alle von Excel
 * gespeicherten Ergebnisse. Unterschiede gibt es nur
 *
 *   · in den Erlaeuterungstexten der Zeilen 11-41 (Spalten A/B und J/K):
 *     Die neue Mappe beschreibt die Zellen genauer, sortiert sie neu und
 *     ergaenzt ab Zeile 26 eine englische Uebersetzung derselben Liste.
 *   · in einem toten Nebenrechenbereich (Spalten AK bis BX): Dort haben sich
 *     Zeilenbezuege um 13 Zeilen verschoben (z. B. $AR$119 -> $AR$106), weil
 *     in der neuen Mappe Zeilen geloescht wurden. Alle betroffenen Zellen
 *     liefern in BEIDEN Mappen 0 oder #REF! — sie rechnen nichts.
 *
 * Deshalb liefert dieses Skript dieselben Sollwerte wie das Schwesterskript.
 * Es wird zur Absicherung getrennt gefuehrt: Kommt eine weitere Fassung der
 * Mappe, laesst sich damit ohne Umbau des alten Skripts nachpruefen.
 *
 * Zur Frage des Einkaufsaufschlags fuer Sonderfarben: Die NEUE Mappe fuehrt in
 * P6 weiterhin 50 €, nicht die am 17.09.2026 muendlich genannten 54 €. Der
 * Wert 54 kommt in der ganzen Mappe nicht vor. Fall 31 unten rechnet die
 * Variante mit 54 € durch, damit die Auswirkung belegt ist.
 *
 *
 * ABDECKUNG — 40 Faelle
 * ---------------------
 *  - Referenzfall der Mappe (50 x 200 cm, 1 Stueck, Colortype 1)
 *  - Standardbreiten 60 / 85 / 115 / 150 gegen Sondermass (Faktor 1,25)
 *  - alle sechs Mengenstaffeln (1, 2, 3, 10, 20, 30) und Mengen dazwischen
 *  - alle drei Colortypes und ein ungueltiger (Fallback auf die leere F19)
 *  - jede Sonderoption einzeln und in Kombination
 *  - Sonderfarbe bei Menge 1 / 2 / 10 / 30 — der Aufschlag faellt nur EINMAL an
 *  - Teuerungszuschlag 7,5 % und 12 % (in der Mappe steht R2 = 0)
 *  - ueberschriebene Stammdaten: EK-Listenpreis, Salesfactor, EK-Aufschlag 54 €
 *  - die drei Fehlerfaelle und ihre Grenzen (30 / 29 cm, 700 / 701 cm, >200 cm)
 *  - krumme Masse, eine grosse Matte, Menge 0
 * ============================================================================
 */

import { berechne, KONSTANTEN } from './public/preisformel.js';

/* ---------------------------------------------------------------- Testfaelle */
/* Erzeugt aus den Formelstrings der NEUEN .xlsx — siehe Kopf dieser Datei.   */
/* Alle Zahlen sind die vollen double-Werte, nicht gerundet.                  */

const FAELLE = [
  {
    name: "Referenzfall der Mappe (50x200, 1 Stk, Colortype 1)",
    eingabe: {
      breite: 50, laenge: 200, menge: 1, colortype: 1
    },
    erwartet: {
      qmProStueck: 1.0,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 105.49053,
      vkGesamt: 105.49053,
      ekProQm: 54.63,
      ekProStueck: 54.63,
      ekGesamt: 54.63,
      marge: 50.860530000000004,
      gesamtQm: 1.0,
      listenpreisProStueck: 105.49053,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Standardbreite 60 trifft (60x120, 1 Stk)",
    eingabe: {
      breite: 60, laenge: 120, menge: 1, colortype: 1
    },
    erwartet: {
      qmProStueck: 0.72,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 75.9531816,
      vkGesamt: 75.9531816,
      ekProQm: 54.63,
      ekProStueck: 39.3336,
      ekGesamt: 39.3336,
      marge: 36.6195816,
      gesamtQm: 0.72,
      listenpreisProStueck: 75.9531816,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Standardbreite ueber die Laenge (120x85, 1 Stk)",
    eingabe: {
      breite: 120, laenge: 85, menge: 1, colortype: 1
    },
    erwartet: {
      qmProStueck: 1.02,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 107.60034060000001,
      vkGesamt: 107.60034060000001,
      ekProQm: 54.63,
      ekProStueck: 55.72260000000001,
      ekGesamt: 55.72260000000001,
      marge: 51.8777406,
      gesamtQm: 1.02,
      listenpreisProStueck: 107.60034060000001,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Standardbreite 115 (115x300, 4 Stk)",
    eingabe: {
      breite: 115, laenge: 300, menge: 4, colortype: 1
    },
    erwartet: {
      qmProStueck: 3.45,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 334.8269422200001,
      vkGesamt: 1339.3077688800004,
      ekProQm: 54.63,
      ekProStueck: 188.47350000000003,
      ekGesamt: 753.8940000000001,
      marge: 585.4137688800002,
      gesamtQm: 13.8,
      listenpreisProStueck: 363.9423285000001,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Standardbreite 150 (150x150, 25 Stk)",
    eingabe: {
      breite: 150, laenge: 150, menge: 25, colortype: 2
    },
    erwartet: {
      qmProStueck: 2.25,
      salesfactor: 1.728,
      tzFaktor: 1.0,
      vkProStueck: 189.0372816,
      vkGesamt: 4725.93204,
      ekProQm: 54.63,
      ekProStueck: 122.9175,
      ekGesamt: 3072.9375,
      marge: 1652.9945399999997,
      gesamtQm: 56.25,
      listenpreisProStueck: 212.40144,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Sondermass 90x120, 1 Stk -> Faktor 1,25",
    eingabe: {
      breite: 90, laenge: 120, menge: 1, colortype: 1
    },
    erwartet: {
      qmProStueck: 1.08,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 142.41221550000003,
      vkGesamt: 142.41221550000003,
      ekProQm: 68.28750000000001,
      ekProStueck: 73.75050000000002,
      ekGesamt: 73.75050000000002,
      marge: 68.66171550000001,
      gesamtQm: 1.08,
      listenpreisProStueck: 113.92977240000002,
      faktorBreite: 1.25,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Sondermass 31x31, 1 Stk (Grenze Mindestmass)",
    eingabe: {
      breite: 31, laenge: 31, menge: 1, colortype: 1
    },
    erwartet: {
      qmProStueck: 0.09609999999999999,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 12.672049916250002,
      vkGesamt: 12.672049916250002,
      ekProQm: 68.28750000000001,
      ekProStueck: 6.5624287500000005,
      ekGesamt: 6.5624287500000005,
      marge: 6.109621166250001,
      gesamtQm: 0.09609999999999999,
      listenpreisProStueck: 10.137639933,
      faktorBreite: 1.25,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Sondermass 90x130, 13 Stk, Colortype 2",
    eingabe: {
      breite: 90, laenge: 130, menge: 13, colortype: 2
    },
    erwartet: {
      qmProStueck: 1.17,
      salesfactor: 1.728,
      tzFaktor: 1.0,
      vkProStueck: 124.2548424,
      vkGesamt: 1615.3129512,
      ekProQm: 68.28750000000001,
      ekProStueck: 79.896375,
      ekGesamt: 1038.652875,
      marge: 576.6600762,
      gesamtQm: 15.209999999999999,
      listenpreisProStueck: 110.44874879999999,
      faktorBreite: 1.25,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Menge 2 (Staffel 0,95)",
    eingabe: {
      breite: 50, laenge: 200, menge: 2, colortype: 1
    },
    erwartet: {
      qmProStueck: 1.0,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 100.2160035,
      vkGesamt: 200.432007,
      ekProQm: 54.63,
      ekProStueck: 54.63,
      ekGesamt: 109.26,
      marge: 91.172007,
      gesamtQm: 2.0,
      listenpreisProStueck: 105.49053,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Menge 3 (Staffel 0,92)",
    eingabe: {
      breite: 50, laenge: 200, menge: 3, colortype: 1
    },
    erwartet: {
      qmProStueck: 1.0,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 97.05128760000001,
      vkGesamt: 291.1538628,
      ekProQm: 54.63,
      ekProStueck: 54.63,
      ekGesamt: 163.89000000000001,
      marge: 127.2638628,
      gesamtQm: 3.0,
      listenpreisProStueck: 105.49053,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Menge 10 (Staffel 0,90)",
    eingabe: {
      breite: 50, laenge: 200, menge: 10, colortype: 1
    },
    erwartet: {
      qmProStueck: 1.0,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 94.941477,
      vkGesamt: 949.4147700000001,
      ekProQm: 54.63,
      ekProStueck: 54.63,
      ekGesamt: 546.3000000000001,
      marge: 403.11477,
      gesamtQm: 10.0,
      listenpreisProStueck: 105.49053,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Menge 20 (Staffel 0,89)",
    eingabe: {
      breite: 50, laenge: 200, menge: 20, colortype: 1
    },
    erwartet: {
      qmProStueck: 1.0,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 93.8865717,
      vkGesamt: 1877.731434,
      ekProQm: 54.63,
      ekProStueck: 54.63,
      ekGesamt: 1092.6000000000001,
      marge: 785.1314339999999,
      gesamtQm: 20.0,
      listenpreisProStueck: 105.49053,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Menge 30 (Staffel 0,88)",
    eingabe: {
      breite: 50, laenge: 200, menge: 30, colortype: 1
    },
    erwartet: {
      qmProStueck: 1.0,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 92.8316664,
      vkGesamt: 2784.9499920000003,
      ekProQm: 54.63,
      ekProStueck: 54.63,
      ekGesamt: 1638.9,
      marge: 1146.0499920000002,
      gesamtQm: 30.0,
      listenpreisProStueck: 105.49053,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Menge 100 (oberste Staffel)",
    eingabe: {
      breite: 75, laenge: 250, menge: 100, colortype: 1
    },
    erwartet: {
      qmProStueck: 1.875,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 174.05937450000002,
      vkGesamt: 17405.93745,
      ekProQm: 54.63,
      ekProStueck: 102.43125,
      ekGesamt: 10243.125,
      marge: 7162.812450000001,
      gesamtQm: 187.5,
      listenpreisProStueck: 197.79474375,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Colortype 2 einfarbig (60x200, 5 Stk)",
    eingabe: {
      breite: 60, laenge: 200, menge: 5, colortype: 2
    },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.728,
      tzFaktor: 1.0,
      vkProStueck: 104.21830656,
      vkGesamt: 521.0915328,
      ekProQm: 54.63,
      ekProStueck: 65.556,
      ekGesamt: 327.78,
      marge: 193.3115328,
      gesamtQm: 6.0,
      listenpreisProStueck: 113.280768,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Colortype 3 Ped-Print (85x400, 7 Stk)",
    eingabe: {
      breite: 85, laenge: 400, menge: 7, colortype: 3
    },
    erwartet: {
      qmProStueck: 3.4,
      salesfactor: 1.8,
      tzFaktor: 1.0,
      vkProStueck: 307.588752,
      vkGesamt: 2153.121264,
      ekProQm: 54.63,
      ekProStueck: 185.742,
      ekGesamt: 1300.194,
      marge: 852.9272639999999,
      gesamtQm: 23.8,
      listenpreisProStueck: 334.3356,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Colortype 9 ungueltig -> Fallback F19 (leer)",
    eingabe: {
      breite: 60, laenge: 120, menge: 1, colortype: 9
    },
    erwartet: {
      qmProStueck: 0.72,
      // C2 liefert in der Mappe den Wahrheitswert FALSCH, weil die Rueckfall-
      // zelle F19 leer ist. In jeder Rechnung liest Excel FALSCH als 0 — alle
      // Geldzellen darunter (G5, F5, E6 = 0, K5 = -39,3336) belegen das.
      // preisformel.js fuehrt dafuer salesfactorFallback = 0. Gleichwertig.
      salesfactor: 0,
      tzFaktor: 1.0,
      vkProStueck: 0.0,
      vkGesamt: 0.0,
      ekProQm: 54.63,
      ekProStueck: 39.3336,
      ekGesamt: 39.3336,
      marge: -39.3336,
      gesamtQm: 0.72,
      listenpreisProStueck: 0.0,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Sonderform ohne Rand (60x200, 1 Stk)",
    eingabe: {
      breite: 60, laenge: 200, menge: 1, colortype: 1,
      sonderformOhneRand: true
    },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 164.5652268,
      vkGesamt: 164.5652268,
      ekProQm: 71.019,
      ekProStueck: 85.2228,
      ekGesamt: 85.2228,
      marge: 79.3424268,
      gesamtQm: 1.2,
      listenpreisProStueck: 126.588636,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.3,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Sonderform mit Rand (60x200, 1 Stk)",
    eingabe: {
      breite: 60, laenge: 200, menge: 1, colortype: 1,
      sonderformMitRand: true
    },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 189.88295399999998,
      vkGesamt: 189.88295399999998,
      ekProQm: 81.94500000000001,
      ekProStueck: 98.334,
      ekGesamt: 98.334,
      marge: 91.54895399999998,
      gesamtQm: 1.2,
      listenpreisProStueck: 126.588636,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.5,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Sonderform ohne UND mit Rand (60x200, 2 Stk)",
    eingabe: {
      breite: 60, laenge: 200, menge: 2, colortype: 1,
      sonderformOhneRand: true,
      sonderformMitRand: true
    },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 234.50544818999998,
      vkGesamt: 469.01089637999996,
      ekProQm: 106.52850000000001,
      ekProStueck: 127.83420000000001,
      ekGesamt: 255.66840000000002,
      marge: 213.34249637999994,
      gesamtQm: 2.4,
      listenpreisProStueck: 126.588636,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.3,
      faktorFormMitRand: 1.5,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Sonderfarbe, Menge 1 (60x200)",
    eingabe: {
      breite: 60, laenge: 200, menge: 1, colortype: 1,
      sonderfarbe: true
    },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 194.588636,
      vkGesamt: 194.588636,
      ekProQm: 54.63,
      ekProStueck: 115.556,
      ekGesamt: 115.556,
      marge: 79.03263600000001,
      gesamtQm: 1.2,
      listenpreisProStueck: 194.588636,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 68.0,
      aufschlagEK: 50.0
    }
  },
  {
    name: "Sonderfarbe, Menge 2 (60x200)",
    eingabe: {
      breite: 60, laenge: 200, menge: 2, colortype: 1,
      sonderfarbe: true
    },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 188.2592042,
      vkGesamt: 308.5184084,
      ekProQm: 54.63,
      ekProStueck: 115.556,
      ekGesamt: 181.112,
      marge: 127.4064084,
      gesamtQm: 2.4,
      listenpreisProStueck: 194.588636,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 68.0,
      aufschlagEK: 50.0
    }
  },
  {
    name: "Sonderfarbe, Menge 10 (60x200)",
    eingabe: {
      breite: 60, laenge: 200, menge: 10, colortype: 1,
      sonderfarbe: true
    },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 181.9297724,
      vkGesamt: 1207.297724,
      ekProQm: 54.63,
      ekProStueck: 115.556,
      ekGesamt: 705.56,
      marge: 501.73772400000007,
      gesamtQm: 12.0,
      listenpreisProStueck: 194.588636,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 68.0,
      aufschlagEK: 50.0
    }
  },
  {
    name: "Sonderfarbe, Menge 30 (90x95, Sondermass)",
    eingabe: {
      breite: 90, laenge: 95, menge: 30, colortype: 1,
      sonderfarbe: true
    },
    erwartet: {
      qmProStueck: 0.855,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 167.213843465,
      vkGesamt: 3044.4153039499997,
      ekProQm: 68.28750000000001,
      ekProStueck: 108.38581250000001,
      ekGesamt: 1801.5743750000001,
      marge: 1242.8409289499996,
      gesamtQm: 25.65,
      listenpreisProStueck: 158.19440315,
      faktorBreite: 1.25,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 68.0,
      aufschlagEK: 50.0
    }
  },
  {
    name: "Alles zusammen: Sondermass+Form ohne+Farbe, 12 Stk",
    eingabe: {
      breite: 93, laenge: 187, menge: 12, colortype: 3,
      sonderformOhneRand: true,
      sonderfarbe: true
    },
    erwartet: {
      qmProStueck: 1.7391,
      salesfactor: 1.8,
      tzFaktor: 1.0,
      vkProStueck: 318.10601437250006,
      vkGesamt: 3069.2721724700004,
      ekProQm: 88.77375000000002,
      ekProStueck: 204.38642862500004,
      ekGesamt: 1902.6371435000005,
      marge: 1166.63502897,
      gesamtQm: 20.8692,
      listenpreisProStueck: 239.01265940000002,
      faktorBreite: 1.25,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.3,
      faktorFormMitRand: 1.0,
      aufschlagVK: 68.0,
      aufschlagEK: 50.0
    }
  },
  {
    name: "Alles zusammen: Sondermass+Form mit+Farbe, 21 Stk",
    eingabe: {
      breite: 111, laenge: 222, menge: 21, colortype: 2,
      sonderformMitRand: true,
      sonderfarbe: true
    },
    erwartet: {
      qmProStueck: 2.4642000000000004,
      salesfactor: 1.728,
      tzFaktor: 1.0,
      vkProStueck: 456.1880577656001,
      vkGesamt: 8219.949213077602,
      ekProQm: 102.43125,
      ekProStueck: 302.41108625000004,
      ekGesamt: 5350.632811250001,
      marge: 2869.3164018276,
      gesamtQm: 51.74820000000001,
      listenpreisProStueck: 300.622057088,
      faktorBreite: 1.25,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.5,
      aufschlagVK: 68.0,
      aufschlagEK: 50.0
    }
  },
  {
    name: "Teuerungszuschlag TZ 7,5 % (60x200, 3 Stk)",
    eingabe: {
      breite: 60, laenge: 200, menge: 3, colortype: 1
    },
    stammdaten: { tzProzent: 7.5 },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.931,
      tzFaktor: 1.075,
      vkProStueck: 125.19616100399999,
      vkGesamt: 375.588483012,
      ekProQm: 54.63,
      ekProStueck: 65.556,
      ekGesamt: 196.668,
      marge: 178.92048301199998,
      gesamtQm: 3.5999999999999996,
      listenpreisProStueck: 136.0827837,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Teuerungszuschlag TZ 12 % + Sonderfarbe, 4 Stk",
    eingabe: {
      breite: 85, laenge: 170, menge: 4, colortype: 1,
      sonderfarbe: true
    },
    stammdaten: { tzProzent: 12 },
    erwartet: {
      qmProStueck: 1.445,
      salesfactor: 1.931,
      tzFaktor: 1.12,
      vkProStueck: 225.06780385184004,
      vkGesamt: 696.2712154073602,
      ekProQm: 54.63,
      ekProStueck: 128.94035000000002,
      ekGesamt: 365.76140000000004,
      marge: 330.5098154073601,
      gesamtQm: 5.78,
      listenpreisProStueck: 238.72587375200004,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 68.0,
      aufschlagEK: 50.0
    }
  },
  {
    name: "Anderer EK-Listenpreis 61,90 (60x200, 6 Stk)",
    eingabe: {
      breite: 60, laenge: 200, menge: 6, colortype: 1
    },
    stammdaten: { ekListenpreisProQm: 61.9 },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 131.9599056,
      vkGesamt: 791.7594336000001,
      ekProQm: 61.9,
      ekProStueck: 74.28,
      ekGesamt: 445.68,
      marge: 346.0794336000001,
      gesamtQm: 7.199999999999999,
      listenpreisProStueck: 143.43468000000001,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Anderer Salesfactor F1=2,1 (60x200, 1 Stk)",
    eingabe: {
      breite: 60, laenge: 200, menge: 1, colortype: 1
    },
    stammdaten: { salesfactorMehrfarbig: 2.1 },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 2.1,
      tzFaktor: 1.0,
      vkProStueck: 137.6676,
      vkGesamt: 137.6676,
      ekProQm: 54.63,
      ekProStueck: 65.556,
      ekGesamt: 65.556,
      marge: 72.1116,
      gesamtQm: 1.2,
      listenpreisProStueck: 137.6676,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Sonderfarbenaufschlag 54/68 statt 50/68, 9 Stk",
    eingabe: {
      breite: 60, laenge: 200, menge: 9, colortype: 1,
      sonderfarbe: true
    },
    stammdaten: { aufschlagSonderfarbeEK: 54 },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 184.46154511999998,
      vkGesamt: 1116.1539060799998,
      ekProQm: 54.63,
      ekProStueck: 119.556,
      ekGesamt: 644.004,
      marge: 472.1499060799998,
      gesamtQm: 10.799999999999999,
      listenpreisProStueck: 194.588636,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 68.0,
      aufschlagEK: 54.0
    }
  },
  {
    name: "Grenze: genau 30 cm Mindestmass (30x200)",
    eingabe: {
      breite: 30, laenge: 200, menge: 1, colortype: 1
    },
    erwartet: {
      qmProStueck: 0.6,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 63.294318,
      vkGesamt: 63.294318,
      ekProQm: 54.63,
      ekProStueck: 32.778,
      ekGesamt: 32.778,
      marge: 30.516318,
      gesamtQm: 0.6,
      listenpreisProStueck: 63.294318,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Grenze: 29 cm -> zu schmal",
    eingabe: {
      breite: 29, laenge: 200, menge: 1, colortype: 1
    },
    fehler: "zu schmal",
    zelle: "L5",
    erwartet: {
      qmProStueck: 0.58
    }
  },
  {
    name: "Grenze: genau 700 cm max.length (60x700)",
    eingabe: {
      breite: 60, laenge: 700, menge: 2, colortype: 1
    },
    erwartet: {
      qmProStueck: 4.2,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 420.90721470000005,
      vkGesamt: 841.8144294000001,
      ekProQm: 54.63,
      ekProStueck: 229.44600000000003,
      ekGesamt: 458.89200000000005,
      marge: 382.92242940000006,
      gesamtQm: 8.4,
      listenpreisProStueck: 443.06022600000006,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Grenze: 701 cm -> Matte zu lang",
    eingabe: {
      breite: 60, laenge: 701, menge: 1, colortype: 1
    },
    fehler: "Matte zu lang",
    zelle: "M5",
    erwartet: {
      qmProStueck: 4.206
    }
  },
  {
    name: "Grenze: beide >200 -> Matte zu breit",
    eingabe: {
      breite: 210, laenge: 210, menge: 1, colortype: 1
    },
    fehler: "Matte zu breit",
    zelle: "M5",
    erwartet: {
      qmProStueck: 4.41
    }
  },
  {
    name: "Krumme Masse 62,5 x 137,5, 3 Stk",
    eingabe: {
      breite: 62.5, laenge: 137.5, menge: 3, colortype: 1
    },
    erwartet: {
      qmProStueck: 0.859375,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 104.2543128515625,
      vkGesamt: 312.7629385546875,
      ekProQm: 68.28750000000001,
      ekProStueck: 58.68457031250001,
      ekGesamt: 176.05371093750003,
      marge: 136.70922761718745,
      gesamtQm: 2.578125,
      listenpreisProStueck: 90.65592421875,
      faktorBreite: 1.25,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Krumme Masse 33 x 47, 3 Stk, Colortype 3",
    eingabe: {
      breite: 33, laenge: 47, menge: 3, colortype: 3
    },
    erwartet: {
      qmProStueck: 0.1551,
      salesfactor: 1.8,
      tzFaktor: 1.0,
      vkProStueck: 17.53934391,
      vkGesamt: 52.61803173,
      ekProQm: 68.28750000000001,
      ekProStueck: 10.591391250000001,
      ekGesamt: 31.774173750000003,
      marge: 20.843857979999996,
      gesamtQm: 0.46529999999999994,
      listenpreisProStueck: 15.2516034,
      faktorBreite: 1.25,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Grosse Matte 200x650, 1 Stk",
    eingabe: {
      breite: 200, laenge: 650, menge: 1, colortype: 1
    },
    erwartet: {
      qmProStueck: 13.0,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 1371.3768900000002,
      vkGesamt: 1371.3768900000002,
      ekProQm: 54.63,
      ekProStueck: 710.19,
      ekGesamt: 710.19,
      marge: 661.1868900000002,
      gesamtQm: 13.0,
      listenpreisProStueck: 1371.3768900000002,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  },
  {
    name: "Menge 0 -> unter kleinster Staffel",
    eingabe: {
      breite: 60, laenge: 200, menge: 0, colortype: 1
    },
    erwartet: {
      qmProStueck: 1.2,
      salesfactor: 1.931,
      tzFaktor: 1.0,
      vkProStueck: 0.0,
      vkGesamt: 0.0,
      ekProQm: 0.0,
      ekProStueck: 0.0,
      ekGesamt: 0.0,
      marge: 0.0,
      gesamtQm: 0.0,
      listenpreisProStueck: 0.0,
      faktorBreite: 1.0,
      faktorLaenge: 1.0,
      faktorFormOhneRand: 1.0,
      faktorFormMitRand: 1.0,
      aufschlagVK: 0.0,
      aufschlagEK: 0.0
    }
  }];

/* ------------------------------------------------------------------ Vergleich */

const TOLERANZ = 1e-9;   // relativ

const FELDER = [
  'qmProStueck', 'salesfactor', 'tzFaktor',
  'faktorBreite', 'faktorLaenge', 'faktorFormOhneRand', 'faktorFormMitRand',
  'aufschlagVK', 'aufschlagEK',
  'vkProStueck', 'vkGesamt',
  'ekProQm', 'ekProStueck', 'ekGesamt',
  'marge', 'gesamtQm', 'listenpreisProStueck'
];

const VOLL = process.argv.includes('--voll');

function z(v, n = 2) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return String(v);
  return v.toFixed(n);
}
function li(s, n) { return String(s).length >= n ? String(s).slice(0, n) : String(s).padEnd(n); }
function gleich(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') return a === b;
  if (a === b) return true;
  const nenner = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / nenner < TOLERANZ;
}

const abweichungen = [];
let bestanden = 0;

console.log('');
console.log('='.repeat(100));
console.log('  preisformel.js gegen 1PREISE-Brian_Sehorz-26-09-30_18-55.xlsx (NEUE Mappe)');
console.log('='.repeat(100));
console.log('');

for (const fall of FAELLE) {
  const r = berechne(fall.eingabe, fall.stammdaten);
  let okFall = true;
  const zeilen = [];

  if (fall.fehler) {
    // Erwartet wird eine Fehlermeldung, kein Preis.
    if (r.ok) {
      okFall = false;
      zeilen.push(['Fehlermeldung', fall.fehler, 'kein Fehler, Preis ' + z(r.vkGesamt)]);
    } else if (r.grund !== fall.fehler) {
      okFall = false;
      zeilen.push(['Fehlergrund', fall.fehler, String(r.grund)]);
    }
    if (okFall && fall.erwartet && fall.erwartet.qmProStueck !== undefined) {
      if (!gleich(r.qmProStueck, fall.erwartet.qmProStueck)) {
        okFall = false;
        zeilen.push(['qmProStueck', z(fall.erwartet.qmProStueck, 8), z(r.qmProStueck, 8)]);
      }
    }
  } else {
    if (!r.ok) {
      okFall = false;
      zeilen.push(['Ergebnis', 'Preis', 'Fehler: ' + r.grund]);
    } else {
      for (const feld of FELDER) {
        const soll = fall.erwartet[feld];
        if (soll === undefined) continue;
        if (!gleich(r[feld], soll)) {
          okFall = false;
          zeilen.push([feld, z(soll, 8), z(r[feld], 8)]);
        }
      }
    }
  }

  if (okFall) bestanden++;
  else abweichungen.push({ fall, zeilen });

  console.log('  ' + (okFall ? '[ OK ]' : '[FEHL]') + '  ' + fall.name);
  if (VOLL && r.ok && !fall.fehler) {
    for (const feld of FELDER) {
      if (fall.erwartet[feld] === undefined) continue;
      console.log('           ' + li(feld, 24) + ' Mappe ' + li(z(fall.erwartet[feld], 8), 20)
        + ' Code ' + z(r[feld], 8));
    }
  }
}

/* ------------------------------------------------ Zusatzpruefungen zur Logik */

const zusatz = [];
function pruefe(name, ok, erlaeuterung) { zusatz.push({ name, ok, erlaeuterung: erlaeuterung || '' }); }

// Der Sonderfarbenaufschlag faellt genau einmal je Auftrag an, nicht je Stueck.
{
  const ohne = berechne({ breite: 60, laenge: 200, menge: 7, colortype: 1 });
  const mit  = berechne({ breite: 60, laenge: 200, menge: 7, colortype: 1, sonderfarbe: true });
  pruefe('Sonderfarbe VK faellt genau einmal an (Menge 7)',
    Math.abs((mit.vkGesamt - ohne.vkGesamt) - KONSTANTEN.aufschlagSonderfarbeVK) < 1e-9,
    'Unterschied ' + z(mit.vkGesamt - ohne.vkGesamt, 5) + ' €, erwartet '
      + KONSTANTEN.aufschlagSonderfarbeVK + ',00 €');
  pruefe('Sonderfarbe EK faellt genau einmal an (Menge 7)',
    Math.abs((mit.ekGesamt - ohne.ekGesamt) - KONSTANTEN.aufschlagSonderfarbeEK) < 1e-9,
    'Unterschied ' + z(mit.ekGesamt - ohne.ekGesamt, 5) + ' €, erwartet '
      + KONSTANTEN.aufschlagSonderfarbeEK + ',00 €');
}

// Die NEUE Mappe fuehrt P6 = 50 €, nicht 54 €.
pruefe('Mappenwert EK-Aufschlag Sonderfarbe ist 50 € (P6 der neuen Mappe)',
  KONSTANTEN.aufschlagSonderfarbeEK === 50,
  'preisformel.js fuehrt ' + KONSTANTEN.aufschlagSonderfarbeEK + ' €');
pruefe('Mappenwert VK-Aufschlag Sonderfarbe ist 68 € (P5 der neuen Mappe)',
  KONSTANTEN.aufschlagSonderfarbeVK === 68,
  'preisformel.js fuehrt ' + KONSTANTEN.aufschlagSonderfarbeVK + ' €');

// Stammdaten der neuen Mappe, Zelle fuer Zelle.
{
  const soll = [
    ['salesfactorMehrfarbig', 'F1', 1.931],
    ['salesfactorEinfarbig',  'I1', 1.728],
    ['salesfactorPedPrint',   'L1', 1.8],
    ['colortype',             'F2', 1],
    ['ekListenpreisProQm',    'Q5', 54.63],
    ['tzProzent',             'R2', 0],
    ['minBreite',             'B6', 30],
    ['maxLaenge',             'C6', 700],
    ['faktorSondermass',      'L5', 1.25],
    ['faktorSonderformOhne',  'N5', 1.3],
    ['faktorSonderformMit',   'O5', 1.5],
    ['aufschlagSonderfarbeVK','P5', 68],
    ['aufschlagSonderfarbeEK','P6', 50],
    ['faktorOneColor',        'W5', 0.95]
  ];
  let falsch = [];
  for (const [feld, zelle, wert] of soll) {
    if (KONSTANTEN[feld] !== wert) falsch.push(feld + ' (' + zelle + '): Code '
      + KONSTANTEN[feld] + ', Mappe ' + wert);
  }
  pruefe('Alle 14 Einzel-Stammdaten stimmen mit der neuen Mappe',
    falsch.length === 0, falsch.length ? falsch.join(' · ') : 'F1 I1 L1 F2 Q5 R2 B6 C6 L5 N5 O5 P5 P6 W5');

  const breitenOk = JSON.stringify(KONSTANTEN.standardbreiten) === JSON.stringify([60, 75, 85, 115, 150, 200]);
  pruefe('Standardbreiten Q7:V7 = 60/75/85/115/150/200',
    breitenOk, '[' + KONSTANTEN.standardbreiten.join(', ') + ']');

  const staffelSoll = [[30, 0.88], [20, 0.89], [10, 0.9], [3, 0.92], [2, 0.95], [1, 1]];
  const staffelIst = KONSTANTEN.mengenstaffel.map((s) => [s.schwelle, s.faktor]);
  pruefe('Mengenstaffel Q6:V6 / R5:V5 stimmt',
    JSON.stringify(staffelIst) === JSON.stringify(staffelSoll),
    staffelIst.map((s) => 'ab ' + s[0] + ' -> ' + s[1]).join(', '));
}

// Mit 54 € EK statt 50 € aendert sich NUR der Einkauf, nicht der Verkauf.
{
  const a = berechne({ breite: 60, laenge: 200, menge: 9, colortype: 1, sonderfarbe: true });
  const b = berechne({ breite: 60, laenge: 200, menge: 9, colortype: 1, sonderfarbe: true },
                     { aufschlagSonderfarbeEK: 54 });
  pruefe('EK-Aufschlag 54 € statt 50 € laesst den Verkauf unberuehrt',
    Math.abs(a.vkGesamt - b.vkGesamt) < 1e-12
      && Math.abs((b.ekGesamt - a.ekGesamt) - 4) < 1e-9,
    'VK gleich ' + z(a.vkGesamt) + ' €, EK ' + z(a.ekGesamt) + ' -> ' + z(b.ekGesamt)
      + ' €, Marge ' + z(a.marge) + ' -> ' + z(b.marge) + ' €');
}

// Ohne Sonderfarbe muss VK gesamt exakt Menge x VK je Stueck sein.
{
  const r = berechne({ breite: 90, laenge: 130, menge: 13, colortype: 2 });
  pruefe('Ohne Sonderfarbe: VK gesamt = Menge × VK je Stueck',
    Math.abs(r.vkGesamt - r.eingaben.menge * r.vkProStueck) < 1e-9,
    z(r.vkGesamt, 6) + ' gegen ' + z(r.eingaben.menge * r.vkProStueck, 6));
}

// Die Funktion wirft nie — auch bei Unsinn nicht.
{
  const unsinn = [undefined, null, {},
    { breite: 'abc', laenge: 200, menge: 1, colortype: 1 },
    { breite: -5, laenge: 200, menge: 1, colortype: 1 },
    { breite: 0, laenge: 0, menge: 0, colortype: 0 },
    { breite: Infinity, laenge: 200, menge: 1, colortype: 1 },
    { breite: NaN, laenge: NaN, menge: NaN, colortype: NaN }];
  let geworfen = 0;
  for (const u of unsinn) { try { berechne(u); } catch (e) { geworfen++; } }
  pruefe('Keine Ausnahmen bei ungueltigen Eingaben',
    geworfen === 0, geworfen + ' von ' + unsinn.length + ' Aufrufen haben geworfen');
}

const zusatzFehler = zusatz.filter((p) => !p.ok).length;

console.log('');
console.log('  ' + '-'.repeat(96));
console.log('  ZUSATZPRUEFUNGEN');
console.log('  ' + '-'.repeat(96));
zusatz.forEach((p) => {
  console.log('  ' + (p.ok ? '[ OK ]' : '[FEHL]') + '  ' + li(p.name, 56) + '  ' + p.erlaeuterung);
});

/* ------------------------------------------------------------- Abweichungen */

if (abweichungen.length) {
  console.log('');
  console.log('  ' + '-'.repeat(96));
  console.log('  ABWEICHUNGEN IM EINZELNEN');
  console.log('  ' + '-'.repeat(96));
  for (const a of abweichungen) {
    console.log('  ' + a.fall.name);
    for (const [feld, soll, ist] of a.zeilen) {
      console.log('      ' + li(feld, 24) + ' Mappe ' + li(soll, 22) + ' Code ' + ist);
    }
  }
}

/* ------------------------------------------------------------------ Bilanz */

const gesamtFehler = (FAELLE.length - bestanden) + zusatzFehler;

console.log('');
console.log('='.repeat(100));
console.log('  BILANZ');
console.log('  ' + '-'.repeat(60));
console.log('  Faelle gegen die NEUE Mappe .................. ' + bestanden + ' von ' + FAELLE.length + ' bestanden');
console.log('  davon Fehlerfaelle ........................... ' + FAELLE.filter((f) => f.fehler).length);
console.log('  verglichene Einzelwerte ...................... ' + (FAELLE.filter((f) => !f.fehler).length * FELDER.length));
console.log('  Zusatzpruefungen ............................. ' + (zusatz.length - zusatzFehler) + ' von ' + zusatz.length + ' bestanden');
console.log('  Toleranz ..................................... ' + TOLERANZ + ' relativ');
console.log('  ' + '-'.repeat(60));
if (gesamtFehler === 0) {
  console.log('  ERGEBNIS: preisformel.js rechnet in allen ' + FAELLE.length
    + ' Faellen genau wie 1PREISE-Brian_Sehorz-26-09-30_18-55.xlsx.');
} else {
  console.log('  ERGEBNIS: ' + gesamtFehler + ' Punkt(e) stimmen nicht.');
}
console.log('='.repeat(100));
console.log('');

process.exit(gesamtFehler === 0 ? 0 : 1);
