# -*- coding: utf-8 -*-
"""Normalisiert JEDE Swatch-Referenz im Katalog auf den Dateinamen auf der Platte."""
import os, re, sys, unicodedata
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

ondisk = {f: f for f in os.listdir(SW)}
lower = {f.lower(): f for f in ondisk}

fp = os.path.join(SHOP, "assets", "js", "catalog.js")
t = open(fp, encoding="utf-8").read()

hits = {"ok": 0, "fix": 0, "miss": 0}
missing = set()

def repl(m):
    raw = m.group(1)
    base = raw.replace("\\/", "/").split("/")[-1]
    if base in ondisk:
        hits["ok"] += 1
        return '"' + base + '"'
    for cand in (safe(base), safe(base).lower(), base.lower()):
        real = ondisk.get(cand) or lower.get(cand.lower())
        if real:
            hits["fix"] += 1
            return '"' + real + '"'
    hits["miss"] += 1
    missing.add(base)
    return '""'

t2 = re.sub(r'"([^"]*(?:farboption|designoption)[^"]*)"', repl, t)
if t2 != t:
    open(fp, "w", encoding="utf-8").write(t2)
print("unveraendert:", hits["ok"], "| korrigiert:", hits["fix"], "| ohne Datei:", hits["miss"])
for m in sorted(missing)[:8]:
    print("   fehlt:", m)
