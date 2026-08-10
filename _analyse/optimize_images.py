# -*- coding: utf-8 -*-
"""Wandelt die erzeugten PNG-Bilder in WebP um und passt alle Referenzen an.

Die Rohbilder von GPT Image 2 sind 2-3 MB gross. Fuer den Shop reichen
1400px Breite und WebP q=82 — optisch identisch, aber rund 95% kleiner.
"""
import os, re, sys, json
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
SHOP = os.path.abspath(os.path.join(ROOT, "..", "shop"))
IMGROOT = os.path.join(SHOP, "assets", "img")

DIRS = ["produkte", "szenen", "original"]
MAXW = 1400
QUALITY = 82

renamed = {}
before = after = 0

for d in DIRS:
    p = os.path.join(IMGROOT, d)
    if not os.path.isdir(p):
        continue
    for fn in sorted(os.listdir(p)):
        src = os.path.join(p, fn)
        stem, ext = os.path.splitext(fn)
        if ext.lower() not in (".png", ".jpg", ".jpeg", ".JPG"):
            continue
        dst_name = stem + ".webp"
        dst = os.path.join(p, dst_name)
        try:
            with Image.open(src) as im:
                im = im.convert("RGB")
                if im.width > MAXW:
                    im = im.resize((MAXW, round(im.height * MAXW / im.width)), Image.LANCZOS)
                im.save(dst, "WEBP", quality=QUALITY, method=6)
        except Exception as e:
            print("  FEHLER", fn, e)
            continue
        b, a = os.path.getsize(src), os.path.getsize(dst)
        before += b
        after += a
        os.remove(src)
        renamed["assets/img/%s/%s" % (d, fn)] = "assets/img/%s/%s" % (d, dst_name)

print("Bilder umgewandelt: %d" % len(renamed))
print("vorher %.1f MB  ->  nachher %.1f MB  (%.0f%% kleiner)"
      % (before / 1048576, after / 1048576, 100 - after * 100.0 / max(1, before)))

# --- Referenzen in allen Text-Dateien anpassen ---
patched = 0
for base, _dirs, files in os.walk(SHOP):
    if os.sep + "assets" + os.sep + "img" in base or os.sep + "fonts" in base:
        continue
    for fn in files:
        if not fn.endswith((".html", ".js", ".css", ".md", ".json")):
            continue
        fp = os.path.join(base, fn)
        txt = open(fp, encoding="utf-8").read()
        orig = txt
        # generisch: jede Referenz auf die drei Ordner auf .webp umbiegen
        txt = re.sub(r"(assets/img/(?:produkte|szenen|original)/[^\"'\s)]+?)\.(?:png|jpe?g|JPG)",
                     r"\1.webp", txt)
        if txt != orig:
            open(fp, "w", encoding="utf-8").write(txt)
            patched += 1
            print("  angepasst:", os.path.relpath(fp, SHOP))
print("Dateien mit angepassten Pfaden:", patched)
