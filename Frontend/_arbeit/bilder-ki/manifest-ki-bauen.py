#!/usr/bin/env python3
"""Baut public/net-neu/assets/img/manifest-ki.json aus den Agenten-Berichten (24.10.2026).

Nimmt jedes Bild, das ein Agent akzeptiert hat (bericht-*.json, "akzeptiert": true),
dessen KI-Datei auf der Platte liegt und das bei der Endabnahme nicht verworfen wurde
(endabnahme.json: {"<original>": "Grund"}). Gleiches Format wie manifest-hd.json, damit
bau-net-daten.mjs es ueber NET.hd ausliefert (KI-Fassung vor HD-Fassung).

Aufruf: python3 manifest-ki-bauen.py
"""
import glob
import json
import os
import sys

from PIL import Image

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.normpath(os.path.join(HIER, '..', '..', 'bridge-demo', 'public', 'net-neu'))
ZIEL = os.path.join(WURZEL, 'assets', 'img', 'manifest-ki.json')


def ohne_assets(p):
    return p[len('assets/'):] if p.startswith('assets/') else p


def main():
    abnahme_datei = os.path.join(HIER, 'endabnahme.json')
    verworfen = json.load(open(abnahme_datei)) if os.path.exists(abnahme_datei) else {}
    bilder, fehlt, raus = {}, [], []
    for b in sorted(glob.glob(os.path.join(HIER, 'bericht-*.json'))):
        for e in json.load(open(b)):
            if not e.get('akzeptiert') or not e.get('ki'):
                continue
            if e['original'] in verworfen:
                raus.append(e['original'])
                continue
            orig = os.path.join(WURZEL, e['original'])
            ki = os.path.join(WURZEL, e['ki'])
            if not (os.path.exists(orig) and os.path.exists(ki)):
                fehlt.append(e['original'])
                continue
            with Image.open(orig) as o, Image.open(ki) as k:
                breite1x, (breite, hoehe) = o.size[0], k.size
            if breite <= breite1x:
                raus.append(e['original'] + ' (nicht groesser als das Original)')
                continue
            bilder[ohne_assets(e['original'])] = {
                'datei': ohne_assets(e['ki']), 'breite': breite, 'hoehe': hoehe,
                'breite1x': breite1x, 'quelle': os.path.basename(b),
            }
    daten = {
        '_quelle': 'erzeugt von _arbeit/bilder-ki/manifest-ki-bauen.py: mit GPT Image 2.5 (kie.ai) '
                   'geschaerfte Fassungen, Farben auf das Original zurueckgerechnet, je Bild per Blick '
                   'abgenommen. Schluessel = 1x-Datei unter assets/.',
        'bilder': dict(sorted(bilder.items())),
    }
    with open(ZIEL, 'w') as f:
        json.dump(daten, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f'{len(bilder)} Bilder in manifest-ki.json, verworfen bei Abnahme: {len(raus)}, Datei fehlt: {len(fehlt)}')
    for r in raus:
        print('  raus:', r)
    for r in fehlt:
        print('  fehlt:', r)


if __name__ == '__main__':
    sys.exit(main())
