# -*- coding: utf-8 -*-
"""Extrahiert das Mega-Menue (Hauptnavigation) inkl. Unterkategorien + Bilder."""
import os, re, json, sys
from bs4 import BeautifulSoup
sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))

raw = open(os.path.join(ROOT, "html", "index.html"), encoding="utf-8", errors="replace").read()
soup = BeautifulSoup(raw, "html.parser")
nav = soup.find("nav", id="main_navigation")
out = []
for li in nav.select("ul.nav_main > li"):
    a = li.find("a", class_="dropdown-toggle") or li.find("a")
    label = re.sub(r"\s+", " ", a.get_text()).strip()
    href = a.get("href", "")
    groups = []
    for th in li.select(".dropdown-menu .thumbnail"):
        h2 = th.find(["h2", "h3", "h4"])
        gname = re.sub(r"\s+", " ", h2.get_text()).strip() if h2 else ""
        img = th.find("img")
        links = []
        for x in th.select(".caption a[href]"):
            t = re.sub(r"\s+", " ", x.get_text()).strip()
            if t:
                links.append({"label": t, "href": x["href"], "title": (x.get("title") or "").strip()})
        groups.append({"group": gname, "img": img.get("src") if img else None,
                       "img_title": (img.get("title") or "") if img else "", "links": links})
    out.append({"label": label, "href": href, "groups": groups})

json.dump(out, open(os.path.join(ROOT, "megamenu.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for t in out:
    print("== %s  (%s)" % (t["label"], t["href"]))
    for g in t["groups"]:
        print("   [%s]  img=%s" % (g["group"][:40], (g["img"] or "")[:45]))
        for l in g["links"]:
            print("        - %-46s %s" % (l["label"][:46], l["href"][:60]))
