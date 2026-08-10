# -*- coding: utf-8 -*-
import json, re, sys
sys.stdout.reconfigure(encoding="utf-8")
pages = json.load(open("pages.json", encoding="utf-8"))

withgal = {u: p for u, p in pages.items() if p["gallery"]}
print("Seiten mit Produkt-Galerie:", len(withgal))

PRICE = re.compile(r"(\d{1,4},\d{2})\s*(?:€|EUR)")
cnt = 0
for u, p in sorted(withgal.items()):
    t = p["content_text"]
    prices = sorted({float(x.replace(",", ".")) for x in PRICE.findall(t)})
    crumbs = " > ".join(p["breadcrumbs"][:-1])
    name = p["breadcrumbs"][-1] if p["breadcrumbs"] else p["title"]
    if prices:
        cnt += 1
    print("%-58s | %-40s | imgs=%-3d | preise=%s" % (
        u.replace("https://matten.de", "")[:58], (name or "")[:40],
        len(p["gallery"]), (("%.2f-%.2f" % (prices[0], prices[-1])) if prices else "-")))
print("davon mit Preis:", cnt)
