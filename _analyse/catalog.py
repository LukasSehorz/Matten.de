# -*- coding: utf-8 -*-
"""Baut den Produktkatalog aus den gecrawlten Artikel-Detailseiten."""
import os, re, json, sys, hashlib
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
HTML_DIR = os.path.join(ROOT, "html")
BASE = "https://matten.de"


def _fname(u):
    p = urlparse(u)
    s = (p.path + ("__" + p.query if p.query else "")).strip("/") or "index"
    s = re.sub(r"[^A-Za-z0-9_.\-]", "_", s)
    if len(s) > 120:
        s = s[:110] + "_" + hashlib.md5(u.encode()).hexdigest()[:8]
    return s + ".html"


def clean(s):
    return re.sub(r"\s+", " ", (s or "")).strip()


def eur(s):
    m = re.search(r"(\d{1,4}(?:\.\d{3})?,\d{2})", s or "")
    if not m:
        return None
    return float(m.group(1).replace(".", "").replace(",", "."))


idx = json.load(open(os.path.join(ROOT, "crawl_index.json"), encoding="utf-8"))
products = []

for u in idx["pages"]:
    f = os.path.join(HTML_DIR, _fname(u))
    if not os.path.exists(f):
        continue
    raw = open(f, encoding="utf-8", errors="replace").read()
    if "artikel_buy_form" not in raw:
        continue
    soup = BeautifulSoup(raw, "html.parser")
    content = soup.find(id="content")
    if not content:
        continue
    form = content.find("form", class_="artikel_buy_form")
    if not form:
        continue

    h3 = content.find("h3", class_="titel")
    name = clean(h3.get_text()) if h3 else ""
    crumbs = [clean(a.get_text()) for a in content.select(".breadcrumbs a")]

    # Preis + Versand
    pel = form.select_one(".produktpreis .betrag")
    price = eur(pel.get_text()) if pel else None
    vel = form.select_one(".betragversand")
    versand = eur(vel.get_text()) if vel else None
    if price is None:
        continue

    # Galerie
    gallery = []
    for a in content.select(".slider-single a[href]"):
        h = a["href"]
        if h not in gallery:
            gallery.append(h)

    # Beschreibungstext: Artikel-Fliesstext ausserhalb des Formulars
    desc_parts = []
    art = content.find("div", class_="artikel") or content
    body = art.__copy__()
    for x in body.select("form, script, style, h3.titel, .slider-single, .slider-nav, .breadcrumbs"):
        x.decompose()
    for br in body.find_all("br"):
        br.replace_with(" ")
    for p in body.find_all(["p", "h4", "li"]):
        t = clean(p.get_text(" "))
        if t and len(t) > 3:
            desc_parts.append(t)
    seen = set()
    desc = []
    for d in desc_parts:
        if d not in seen:
            seen.add(d)
            desc.append(d)

    # Grundfarben
    colors = []
    for inp in form.select("input.color_option"):
        v = inp.get("value")
        if not v or v == "default":
            continue
        lab = form.find("label", attrs={"for": inp.get("id")})
        img = lab.find("img") if lab else None
        colors.append({"value": v, "swatch": img.get("src") if img else None,
                       "selected": inp.has_attr("checked")})

    # Design-Optionen
    designs = []
    for inp in form.select("input.design_option"):
        v = inp.get("value")
        lab = form.find("label", attrs={"for": inp.get("id")})
        img = lab.find("img") if lab else None
        if v and v != "default":
            designs.append({"value": v, "swatch": img.get("src") if img else None})

    # Select-Attribute
    attrs = []
    for sel in form.select("select.artikelselect"):
        nm = sel.get("name", "")
        m = re.search(r"attribute\[(.*?)\]", nm)
        label = m.group(1) if m else nm
        opts = [clean(o.get_text()) for o in sel.find_all("option")]
        vals = [o.get("value") for o in sel.find_all("option")]
        default = next((o.get("value") for o in sel.find_all("option") if o.has_attr("selected")), None)
        if "spezialoption" in nm:
            label = "Breite (cm)"
        attrs.append({"label": label, "options": opts, "values": vals, "default": default})

    # Sondermasse
    spez = form.select_one("input.spezialtextinput")
    custom = None
    if spez:
        custom = {"min": spez.get("min"), "max": spez.get("max")}

    aid = form.find("input", attrs={"name": "artikel"})
    price_url = form.find("input", attrs={"name": "price_updates"})

    products.append({
        "artikel_id": aid.get("value") if aid else None,
        "price_url": urljoin(BASE, price_url.get("value")) if price_url else None,
        "url": u,
        "slug": u.replace(BASE + "/", "").replace("/", "--"),
        "name": name,
        "breadcrumbs": crumbs,
        "price": price,
        "versand": versand,
        "gallery": gallery,
        "main_image": gallery[0] if gallery else None,
        "description": desc,
        "colors": colors,
        "designs": designs,
        "attributes": attrs,
        "custom_size": custom,
        "meta_description": clean((soup.find("meta", attrs={"name": "Description"}) or {}).get("content", "")) if soup.find("meta", attrs={"name": "Description"}) else "",
        "title": clean(soup.title.get_text()) if soup.title else "",
    })

json.dump(products, open(os.path.join(ROOT, "products_raw.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print("Produkte mit Kaufformular + Preis:", len(products))
for p in products:
    print("%-60s | %7.2f | col=%-2d des=%-2d attr=%-2d | %s" % (
        p["url"].replace(BASE, "")[:60], p["price"], len(p["colors"]), len(p["designs"]),
        len(p["attributes"]), p["name"][:45]))
