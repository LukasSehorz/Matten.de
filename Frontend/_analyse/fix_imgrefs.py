# -*- coding: utf-8 -*-
"""Benennt Bilddateien mit Leerzeichen/Sonderzeichen um und repariert alle Referenzen."""
import os, re, sys, unicodedata

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
SHOP = os.path.abspath(os.path.join(ROOT, "..", "shop"))
IMGROOT = os.path.join(SHOP, "assets", "img")
DIRS = ["produkte", "szenen", "original", "swatches"]


def safe(name):
    s = unicodedata.normalize("NFKD", name)
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^A-Za-z0-9._-]+", "-", s).strip("-")
    return re.sub(r"-{2,}", "-", s)


rename = {}
for d in DIRS:
    p = os.path.join(IMGROOT, d)
    if not os.path.isdir(p):
        continue
    for fn in sorted(os.listdir(p)):
        new = safe(fn)
        if new == fn:
            continue
        dst = os.path.join(p, new)
        i = 1
        while os.path.exists(dst):
            stem, ext = os.path.splitext(new)
            dst = os.path.join(p, "%s-%d%s" % (stem, i, ext))
            i += 1
        os.rename(os.path.join(p, fn), dst)
        rename["assets/img/%s/%s" % (d, fn)] = "assets/img/%s/%s" % (d, os.path.basename(dst))

print("umbenannt:", len(rename))

# Vorhandene Dateien je Ordner, um Endungen zuverlaessig zu korrigieren
have = {}
for d in DIRS:
    p = os.path.join(IMGROOT, d)
    if os.path.isdir(p):
        for fn in os.listdir(p):
            have.setdefault(d, {})[os.path.splitext(fn)[0]] = fn

REF = re.compile(r"assets/img/(produkte|szenen|original|swatches)/([^\"'()<>]+?)\.(png|jpe?g|JPG|webp)")


def fix(m):
    d, stem, ext = m.group(1), m.group(2), m.group(3)
    old = "assets/img/%s/%s.%s" % (d, stem, ext)
    if old in rename:
        return rename[old]
    stem_s = safe(stem + "." + ext).rsplit(".", 1)[0]
    real = have.get(d, {}).get(stem_s) or have.get(d, {}).get(stem)
    return "assets/img/%s/%s" % (d, real) if real else old


patched = 0
for base, _dirs, files in os.walk(SHOP):
    if os.sep + "img" in base or os.sep + "fonts" in base:
        continue
    for fn in files:
        if not fn.endswith((".html", ".js", ".css", ".md", ".json")):
            continue
        fp = os.path.join(base, fn)
        t = open(fp, encoding="utf-8").read()
        n = REF.sub(fix, t)
        if n != t:
            open(fp, "w", encoding="utf-8").write(n)
            patched += 1
            print("  repariert:", os.path.relpath(fp, SHOP))
print("Dateien angepasst:", patched)
