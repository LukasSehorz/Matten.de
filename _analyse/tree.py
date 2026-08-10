# -*- coding: utf-8 -*-
"""Baut Kategoriebaum aus URLs + Breadcrumbs."""
import json, sys, re
from collections import defaultdict
sys.stdout.reconfigure(encoding="utf-8")

pages = json.load(open("pages.json", encoding="utf-8"))

by_depth = defaultdict(list)
for u, p in pages.items():
    path = u.replace("https://matten.de", "").split("?")[0].strip("/")
    segs = [s for s in path.split("/") if s]
    by_depth[len(segs)].append((path, p))

for d in sorted(by_depth):
    print("### depth %d : %d pages" % (d, len(by_depth[d])))

TOP = ["fussmatten", "logomatten", "kokosmatten", "aluminium_profilmatten",
       "gummi_und_kunststoffmatten", "miet-mattenservice", "schnaeppchen", "was-ist-neu", "home"]

print()
for top in TOP:
    subs = sorted({p.split("/")[1] for p, _ in by_depth[2] if p.split("/")[0] == top})
    print("== %s  (%d Unterkategorien)" % (top, len(subs)))
    for s in subs:
        u = "https://matten.de/%s/%s" % (top, s)
        pg = pages.get(u, {})
        crumb = pg.get("breadcrumbs", [])
        name = crumb[-1] if crumb else pg.get("title", "")
        n_art = len(pg.get("artikel", []))
        n_th = len(pg.get("thumbnails", []))
        print("     %-46s | %-52s | art=%-3d th=%d" % (s, name[:52], n_art, n_th))
