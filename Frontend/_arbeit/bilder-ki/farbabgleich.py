#!/usr/bin/env python3
"""Farben eines KI-geschaerften Bildes auf das Original zurueckrechnen.

GPT Image macht Bilder scharf, verschiebt aber Farbton und Helligkeit (Test
24.10.2026: blaugrauer Mattengrund wurde neutralgrau, Rot kraeftiger). Fuer
Matten, die nach Farbe gekauft werden, ist das nicht tragbar.

Verfahren: Das KI-Bild liefert nur die FEINEN Details (hohe Frequenzen), die
groben Farbflaechen (tiefe Frequenzen) kommen aus dem Original:
    ergebnis = ki + hochskaliert(weich(original)) - weich(ki)
"weich" = Gauss-Weichzeichner in Original-Aufloesung, damit beide Seiten
denselben Detailgrad haben.

Aufruf: python3 farbabgleich.py <original> <ki-bild> <ausgabe.jpg> [--max 1600] [--radius 2.0]
"""
import sys
from PIL import Image, ImageFilter, ImageChops, ImageStat

def _abw_grau(a, b):
    return ImageStat.Stat(ImageChops.difference(a, b)).mean[0]

def ausrichten(o, k):
    """GPT verschiebt/vergroessert das Motiv manchmal leicht (Test 5-Punkt-Matte).
    Dann erzeugt der Farbabgleich dunkle Raender. Deshalb zuerst den Ausschnitt
    des KI-Bildes suchen, der am besten auf dem Original liegt: Massstab 0,92-1,08
    und Versatz, grob in Originalaufloesung (Graustufen), dann fein.
    Rueckgabe: KI-Bild, so beschnitten/skaliert, dass es deckungsgleich ist."""
    og = o.convert('L')
    W, H = o.size
    kg = k.convert('L').resize((W, H), Image.LANCZOS)
    best = (_abw_grau(og, kg), 1.0, 0.0, 0.0)
    def probe(s, dx, dy):
        # Ausschnitt des KI-Bildes (in Originalkoordinaten): Breite W/s, um dx,dy verschoben
        w, h = W / s, H / s
        x0 = (W - w) / 2 + dx; y0 = (H - h) / 2 + dy
        if x0 < -W*0.1 or y0 < -H*0.1: return None
        teil = kg.transform((W, H), Image.EXTENT, (x0, y0, x0 + w, y0 + h), Image.BILINEAR)
        return _abw_grau(og, teil)
    for s in [0.92 + i * 0.01 for i in range(17)]:
        for dx in range(-12, 13, 3):
            for dy in range(-12, 13, 3):
                d = probe(s, dx, dy)
                if d is not None and d < best[0]: best = (d, s, dx, dy)
    _, s0, dx0, dy0 = best
    for s in [s0 + i * 0.0025 for i in range(-4, 5)]:
        for dx in [dx0 + i for i in range(-3, 4)]:
            for dy in [dy0 + i for i in range(-3, 4)]:
                d = probe(s, dx, dy)
                if d is not None and d < best[0]: best = (d, s, dx, dy)
    _, s, dx, dy = best
    if abs(s - 1) < 0.003 and abs(dx) < 0.5 and abs(dy) < 0.5:
        return k
    f = k.width / W   # KI-Pixel je Originalpixel
    w, h = W / s, H / s
    x0 = ((W - w) / 2 + dx) * f; y0 = ((H - h) / 2 + dy) * f
    return k.transform((k.width, k.height), Image.EXTENT, (x0, y0, x0 + w * f, y0 + h * f), Image.BICUBIC)

def kanal_abgleich(bild, vorlage):
    """Je Farbkanal Helligkeit und Kontrast angleichen (Mittelwert und Streuung,
    gemessen an beiden Bildern in Originalgroesse und weichgezeichnet, damit die
    neue Fasertextur nicht mitzaehlt). Glatte Abbildung: keine Flecken, keine
    Raender. (Ein Histogramm-Abgleich machte flaechige Grafiken fleckig.)"""
    klein = bild.resize(vorlage.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5))
    ref = vorlage.filter(ImageFilter.GaussianBlur(1.5))
    sb, sv = ImageStat.Stat(klein), ImageStat.Stat(ref)
    kanaele = []
    for i, k in enumerate(bild.split()):
        mb, mv = sb.mean[i], sv.mean[i]
        db, dv = sb.stddev[i] or 1.0, sv.stddev[i]
        g = max(0.5, min(2.0, dv / db))
        kanaele.append(k.point([max(0, min(255, round((x - mb) * g + mv))) for x in range(256)]))
    return Image.merge('RGB', kanaele)

def abgleich(orig_pfad, ki_pfad, aus_pfad, max_kante=1600, radius=0.0):
    o = Image.open(orig_pfad).convert('RGB')
    k = Image.open(ki_pfad).convert('RGB')
    # KI-Bild exakt auf das Seitenverhaeltnis des Originals bringen (Rand beschneiden, nicht verzerren)
    ro, rk = o.width / o.height, k.width / k.height
    if abs(ro - rk) > 0.002:
        if rk > ro:
            w = round(k.height * ro); x = (k.width - w) // 2; k = k.crop((x, 0, x + w, k.height))
        else:
            h = round(k.width / ro); y = (k.height - h) // 2; k = k.crop((0, y, k.width, y + h))
    k = ausrichten(o, k)
    if max(k.size) > max_kante:
        f = max_kante / max(k.size); k = k.resize((round(k.width * f), round(k.height * f)), Image.LANCZOS)
    W, H = k.size
    # Schritt 1: je Kanal Helligkeit/Kontrast an das Original angleichen.
    # Aendert keine Kanten, nur die Farbwerte (Test 5-Punkt-Matte 24.10.2026).
    k = kanal_abgleich(k, o)
    if radius <= 0:
        # Nur globaler Abgleich: sicher bei flaechigen Grafiken, deren Kanten die
        # KI leicht anders zeichnet (oertlicher Abgleich erzeugt dort Schatten).
        k.save(aus_pfad, quality=85, optimize=True, progressive=True)
        d = ImageChops.difference(k.resize(o.size, Image.LANCZOS), o)
        d0 = ImageChops.difference(Image.open(ki_pfad).convert('RGB').resize(o.size, Image.LANCZOS), o)
        return sum(ImageStat.Stat(d).mean) / 3, sum(ImageStat.Stat(d0).mean) / 3, (W, H)
    # Schritt 2: nur noch grossflaechige Reste oertlich nachziehen
    # tiefe Frequenzen beider Bilder in Original-Aufloesung
    o_weich = o.filter(ImageFilter.GaussianBlur(radius))
    k_klein = k.resize(o.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(radius))
    o_hoch = o_weich.resize((W, H), Image.BICUBIC)
    k_hoch = k_klein.resize((W, H), Image.BICUBIC)
    # ki - k_hoch (Details, um 128 verschoben) + o_hoch - 128  — ohne numpy, nur Pillow
    details = ImageChops.subtract(k, k_hoch, scale=1.0, offset=128)
    erg = ImageChops.add(details, o_hoch, scale=1.0, offset=-128)
    erg.save(aus_pfad, quality=85, optimize=True, progressive=True)
    def abw(bild):
        d = ImageChops.difference(bild.resize(o.size, Image.LANCZOS), o)
        return sum(ImageStat.Stat(d).mean) / 3
    return abw(erg), abw(Image.open(ki_pfad).convert('RGB')), (W, H)

if __name__ == '__main__':
    a = sys.argv[1:]
    opt = lambda n, d: type(d)(a[a.index(n) + 1]) if n in a else d
    nach, vor, gr = abgleich(a[0], a[1], a[2], opt('--max', 1600), opt('--radius', 0.0))
    print(f'{a[2]}: {gr[0]}x{gr[1]} | Farbabweichung zum Original vorher {vor:.1f}, nachher {nach:.1f} (von 255)')
