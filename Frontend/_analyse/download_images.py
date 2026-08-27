# -*- coding: utf-8 -*-
"""Laedt alle Bilder von matten.de herunter (Produkt- und Medienbilder)."""
import os, re, json, sys, time
from urllib.parse import urljoin, urlparse, unquote
import requests

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.abspath(os.path.join(ROOT, "..", "_assets_original", "media"))
os.makedirs(OUTDIR, exist_ok=True)
BASE = "https://matten.de"

S = requests.Session()
S.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
                  "Referer": BASE + "/"})

urls = set()
images = json.load(open(os.path.join(ROOT, "images.json"), encoding="utf-8"))
urls.update(images.keys())

# Galerie-Bilder aus Produktseiten (Slider-Links = Vollbilder)
pages = json.load(open(os.path.join(ROOT, "pages.json"), encoding="utf-8"))
for p in pages.values():
    for g in p.get("gallery", []):
        if g and "/media/" in g:
            urls.add(urljoin(BASE, g))

print("Bilder gesamt:", len(urls))
ok = fail = skip = 0
for i, u in enumerate(sorted(urls), 1):
    name = unquote(os.path.basename(urlparse(u).path))
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    if not name:
        continue
    dest = os.path.join(OUTDIR, name)
    if os.path.exists(dest) and os.path.getsize(dest) > 200:
        skip += 1
        continue
    try:
        r = S.get(u, timeout=30)
        if r.status_code == 200 and len(r.content) > 200:
            open(dest, "wb").write(r.content)
            ok += 1
        else:
            fail += 1
    except Exception:
        fail += 1
    if i % 100 == 0:
        print("  %d/%d  ok=%d skip=%d fail=%d" % (i, len(urls), ok, skip, fail), flush=True)
    time.sleep(0.03)

print("FERTIG ok=%d skip=%d fail=%d -> %s" % (ok, skip, fail, OUTDIR))
