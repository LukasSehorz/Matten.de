# Baut hochaufgeloeste Fassungen (assets/img/hd/...) fuer Bilder, zu denen es dasselbe Motiv
# groesser gibt: Original ohne Cache-Filter bei matten.net (/uploads/...) oder Bild des Altsystems
# matten.de (/media/bild/...). Schreibt assets/img/manifest-hd.json.
# Aufruf (24.10.2026): python3 -I hd-bau.py ../../bridge-demo/public/net-neu/assets <leerer-download-ordner>
# Danach: node bau-net-daten.mjs (macht aus manifest-hd.json NET.hd in daten.js). Braucht Pillow.
import sys, os, json, re, io, urllib.request, urllib.parse, warnings
from PIL import Image, ImageChops, ImageStat, ImageOps
warnings.simplefilter('ignore'); Image.MAX_IMAGE_PIXELS = None
ASSETS, DL = sys.argv[1], sys.argv[2]
NET = 'https://matten.net/uploads/'
ALT = 'https://matten.de/media/bild/'
# (lokale 1x-Datei unter assets/, Quelle, max. Breite, echt) — echt=True: 1x ist nur hochgerechnet
# (Original 150x100), die Quelle hat bei gleicher Pixelzahl echte Bildschaerfe.
LISTE = [
 ('img/produkt-kacheln/005-jet-print-light-5eb35cd44d2e3268777520.jpg', NET + '005-jet-print-light-5eb35cd44d2e3268777520.jpg', 800, False),
 ('img/produkt-kacheln/637-leuchtblau.JPG', NET + '637-leuchtblau.JPG', 800, False),
 ('img/produkt-kacheln/Eing-Logo-512x340.jpg', NET + 'Eing-Logo-512x340.jpg', 800, False),
 ('img/produkt-kacheln/Herzlich Willkommen_512x340.JPG', NET + 'Herzlich Willkommen_512x340.JPG', 800, False),
 ('img/produkt-kacheln/Jet-Print Light_800x600.jpg', NET + 'Jet-Print Light_800x600.jpg', 800, False),
 ('img/produkt-kacheln/JetPrint-Logo-616.jpg', NET + 'JetPrint-Logo-616.jpg', 800, False),
 ('img/produkt-kacheln/JetPrint-Velour-512x340.jpg', NET + 'JetPrint-Velour-512x340.jpg', 800, False),
 ('img/produkt-kacheln/kokos-natur_512x340.jpg', NET + 'kokos-natur_512x340.jpg', 800, False),
 ('img/produkt-kacheln/5c47fa2b58b3djpeg.jpeg', ALT + 'matte_008.jpg', 800, True),
 ('img/produkt-kacheln/5c4c1812b732ejpeg.jpeg', ALT + 'matte_008.jpg', 800, True),
 ('img/produkt-kacheln/5c47fa829d279jpeg.jpeg', ALT + 'kokos_farbig_140.jpg', 800, True),
 ('img/produkt-kacheln/5c47fafe5a2a8jpeg.jpeg', ALT + 'Kokos-gestalt_140.jpg', 800, True),
 ('img/produkt-kacheln/5c47fb75ede37jpeg.jpeg', ALT + 'Jet-Print_Vision-512x340-Nr.jpg', 800, True),
 ('img/produkte/005-jet-print-light-5eb35cd44d2e3268777520.jpg', NET + '005-jet-print-light-5eb35cd44d2e3268777520.jpg', 1400, False),
 ('img/produkte/JPL-601-zitronengelb_0.jpg', NET + 'JPL-601-zitronengelb_0.jpg', 1400, False),
 ('img/produkte/5c47fa2b58b3djpeg.jpeg', ALT + 'matte_008.jpg', 1400, True),
 ('img/produkte/5c47fa829d279jpeg.jpeg', ALT + 'kokos_farbig_140.jpg', 1400, True),
 ('img/produkte/5c47fb75ede37jpeg.jpeg', ALT + 'Jet-Print_Vision-512x340-Nr.jpg', 1400, True),
 ('img/kategorie-kacheln/5c47fa2b5364ejpeg.jpeg', ALT + 'matte_008.jpg', 600, True),
 ('img/kategorie-kacheln/5c4cc0ab6bb26jpeg.jpeg', ALT + 'matte_008.jpg', 600, True),
 ('img/kategorie-kacheln/5c47fa5a8109ejpeg.jpeg', ALT + 'IHXL_01.jpg', 600, True),
 ('img/kategorie-kacheln/5c45865f923d2jpeg.jpeg', ALT + 'katzen_willkommen_512x340.jpg', 600, True),
 ('img/kategorie-kacheln/5c47f8cfcc5b7jpeg.jpeg', ALT + 'MARSCHALL_522S_R.jpg', 600, True),
 ('img/kategorie-kacheln/5c47f937b4f5fjpeg.jpeg', ALT + 'Dip-R.jpg', 600, True),
 ('img/kategorie-kacheln/5c47fa829d279jpeg.jpeg', ALT + 'kokos_farbig_140.jpg', 600, True),
 ('img/kategorie-kacheln/5c47fafe5a2a8jpeg.jpeg', ALT + 'Kokos-gestalt_140.jpg', 600, True),
 ('img/kategorie-kacheln/5c47fbd86c22fjpeg.jpeg', ALT + 'K-Turf-7081-mi.jpg', 600, True),
 ('img/kategorie-kacheln/5c47fd1c6e5f7jpeg.jpeg', ALT + '535-.jpg', 600, True),
 ('img/kategorie-kacheln/5c4cc9df3e243jpeg.jpeg', NET + '5c4cc9df3e243jpeg', 600, False),
 ('img/kategorie-kacheln/JPL-621-aubergine_0.jpg', NET + 'JPL-621-aubergine_0.jpg', 600, False),
 ('img/kategorie-kacheln/JPrint-light.jpg', NET + 'JPrint-light.jpg', 600, False),
 ('img/kategorie-kacheln/JetPrint-Design.jpg', NET + 'JetPrint-Design.jpg', 600, False),
 ('img/kategorie-kacheln/kokos-natur_512x340.jpg', NET + 'kokos-natur_512x340.jpg', 600, False),
 ('img/uploads/5c47fa2b58b3djpeg.jpeg', ALT + 'matte_008.jpg', 1600, True),
 ('img/uploads/5c47fa5a8336bjpeg.jpeg', ALT + 'IHXL_01.jpg', 1600, True),
 ('img/uploads/5c47fbd86f17cjpeg.jpeg', ALT + 'K-Turf-7081-mi.jpg', 1600, True),
 ('img/uploads/5c4cc0ab73be2jpeg.jpeg', ALT + 'matte_008.jpg', 1600, False),
]

def laden(url):
    name = re.sub(r'[^A-Za-z0-9._-]+', '_', urllib.parse.unquote(url.split('/', 2)[2]))
    p = os.path.join(DL, name)
    if not os.path.exists(p):
        u = url.rsplit('/', 1); u = u[0] + '/' + urllib.parse.quote(u[1])
        with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60) as r:
            open(p, 'wb').write(r.read())
    return Image.open(p).convert('RGB')

def zuschnitt(q, aspect):
    w, h = q.size
    if w / h > aspect: nw = round(h * aspect); x = (w - nw) // 2; return q.crop((x, 0, x + nw, h))
    nh = round(w / aspect); y = (h - nh) // 2; return q.crop((0, y, w, y + nh))

def einpassen(q, aspect, farbe):
    w, h = q.size
    if w / h > aspect: bw, bh = w, round(w / aspect)
    else: bw, bh = round(h * aspect), h
    box = Image.new('RGB', (bw, bh), farbe); box.paste(q, ((bw - w) // 2, (bh - h) // 2)); return box

def rms(a, b):
    return sum(ImageStat.Stat(ImageChops.difference(a, b)).rms) / 3

def slug(rel):
    ordner, datei = rel.split('/')[-2:]
    stamm = re.sub(r'\.[A-Za-z]+$', '', datei)
    return 'img/hd/' + ordner + '/' + re.sub(r'[^a-z0-9]+', '-', stamm.lower()).strip('-') + '.jpg'

manifest = {}
for rel, url, maxb, echt in LISTE:
    L = Image.open(os.path.join(ASSETS, rel)).convert('RGB'); w1, h1 = L.size; asp = w1 / h1
    Q = laden(url)
    ecke = L.getpixel((1, 1))
    kand = {'zuschnitt': zuschnitt(Q, asp), 'einpassen': einpassen(Q, asp, ecke), 'gestreckt': Q}
    werte = {k: rms(v.resize((w1, h1), Image.LANCZOS), L) for k, v in kand.items()}
    art = min(werte, key=werte.get)
    basis = kand[art]
    if art == 'gestreckt':
        hdb = min(maxb, Q.size[0]); hdh = round(hdb / asp)
    else:
        hdb = min(maxb, basis.size[0]); hdh = round(hdb / asp)
    if not echt and hdb < 1.3 * w1:
        print(f'UEBERSPRUNGEN {rel}: Quelle nur {hdb}px (1x {w1}px)'); continue
    hd = basis.resize((hdb, hdh), Image.LANCZOS)
    ziel = slug(rel)
    os.makedirs(os.path.dirname(os.path.join(ASSETS, ziel)), exist_ok=True)
    hd.save(os.path.join(ASSETS, ziel), 'JPEG', quality=82, progressive=True, optimize=True)
    manifest[rel] = {'datei': ziel, 'breite': hdb, 'hoehe': hdh, 'breite1x': w1, 'quelle': url, 'passung': art, 'abweichung': round(werte[art], 1)}
    print(f'{rel:62} <- {url.split("/")[2]}/{url.rsplit("/",1)[1]:42} {Q.size[0]}x{Q.size[1]} {art:9} rms {werte[art]:5.1f}  -> {hdb}x{hdh} {os.path.getsize(os.path.join(ASSETS, ziel))//1024} KB')
json.dump({'_quelle': 'erzeugt am 24.10.2026: hochaufgeloeste Fassungen desselben Motivs (matten.net /uploads ohne Cache-Filter bzw. Altsystem matten.de /media/bild), max. Breite je Verwendung, JPEG Qualitaet 82. Schluessel = 1x-Datei unter assets/.', 'bilder': manifest},
          open(os.path.join(ASSETS, 'img', 'manifest-hd.json'), 'w'), ensure_ascii=False, indent=1, sort_keys=True)
print(len(manifest), 'HD-Bilder')
