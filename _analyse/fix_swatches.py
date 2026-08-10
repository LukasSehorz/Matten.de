# -*- coding: utf-8 -*-
"""Bringt die Swatch-Dateinamen im Katalog mit den Dateien auf der Platte in Deckung."""
import os, re, sys, json, unicodedata
sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
SHOP = os.path.abspath(os.path.join(ROOT, "..", "shop"))
SW = os.path.join(SHOP, "assets", "img", "swatches")

def safe(name):
    s = unicodedata.normalize("NFKD", name)
    s = s.replace("ä","ae").replace("ö","oe").replace("ü","ue").replace("ß","ss")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^A-Za-z0-9._-]+", "-", s).strip("-")
    return re.sub(r"-{2,}", "-", s)

ondisk = set(os.listdir(SW))
fp = os.path.join(SHOP, "assets", "js", "catalog.js")
t = open(fp, encoding="utf-8").read()
js = t[t.index("{"):t.rstrip().rstrip(";").rindex("}")+1]
d = json.loads(js)

fixed = missing = 0
for p in d["products"]:
    for c in p.get("colors", []):
        f = c.get("file")
        if not f or f in ondisk:
            continue
        cand = safe(f)
        if cand in ondisk:
            c["file"] = cand; fixed += 1
        else:
            c["file"] = None; missing += 1
open(fp, "w", encoding="utf-8").write(
    "/* Automatisch erzeugt aus der Analyse von matten.de - nicht von Hand aendern. */\n"
    "window.CATALOG = " + json.dumps(d, ensure_ascii=False, separators=(",", ":")) + ";\n")
print("Swatch-Pfade korrigiert:", fixed, "| ohne Datei:", missing)
