# -*- coding: utf-8 -*-
"""Extrahiert Struktur + Inhalte aus den gecrawlten matten.de Seiten."""
import os, re, json, html
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.abspath(__file__))
HTML_DIR = os.path.join(ROOT, "html")
BASE = "https://matten.de"


import hashlib


def _fname(u):
    p = urlparse(u)
    s = (p.path + ("__" + p.query if p.query else "")).strip("/") or "index"
    s = re.sub(r"[^A-Za-z0-9_.\-]", "_", s)
    if len(s) > 120:
        s = s[:110] + "_" + hashlib.md5(u.encode()).hexdigest()[:8]
    return s + ".html"


_idx = json.load(open(os.path.join(ROOT, "crawl_index.json"), encoding="utf-8"))
FNAME2URL = {_fname(u): u for u in _idx["pages"]}


def url_from_fname(f):
    return FNAME2URL.get(f, BASE + "/" + f[:-5])


def txt(el):
    if el is None:
        return ""
    s = el.get_text("\n", strip=True)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s


def clean(s):
    return re.sub(r"\s+", " ", (s or "")).strip()


PRICE_RE = re.compile(r"(ab\s*)?(\d{1,4}[.,]\d{2})\s*(?:€|EUR|&euro;)", re.I)


def main():
    files = sorted(os.listdir(HTML_DIR))
    pages = {}
    nav = None
    images = {}

    for f in files:
        if not f.endswith(".html"):
            continue
        path = os.path.join(HTML_DIR, f)
        raw = open(path, encoding="utf-8", errors="replace").read()
        soup = BeautifulSoup(raw, "html.parser")

        # --- Navigation einmalig extrahieren ---
        if nav is None:
            navel = soup.find("nav", id="navigation") or soup.find("nav")
            if navel:
                nav = []
                for li in navel.select("ul.nav > li"):
                    a = li.find("a")
                    if not a:
                        continue
                    top = {"label": clean(a.get_text()), "href": a.get("href", ""), "children": []}
                    for sub in li.select("ul.dropdown-menu > li"):
                        sa = sub.find("a")
                        if sa and clean(sa.get_text()):
                            top["children"].append({"label": clean(sa.get_text()), "href": sa.get("href", "")})
                    nav.append(top)

        content = soup.find(id="content")
        if content is None:
            continue

        u = url_from_fname(f)
        title = clean(soup.title.get_text()) if soup.title else ""
        crumbs = [clean(a.get_text()) for a in content.select(".breadcrumbs a")]

        # Thumbnails (Kategorie-Kacheln)
        thumbs = []
        for th in content.select(".thumbnail"):
            img = th.find("img")
            a = th.find("a", href=True)
            cap = th.find(class_="caption")
            captxt = txt(cap)
            m = PRICE_RE.search(captxt)
            thumbs.append({
                "img": img.get("src") if img else None,
                "img_title": clean(img.get("title") or img.get("alt")) if img else "",
                "href": a.get("href") if a else None,
                "caption": captxt,
                "price": m.group(2) if m else None,
                "price_prefix": clean(m.group(1)) if m and m.group(1) else None,
            })

        # Artikel-Bloecke
        artikel = []
        for art in content.select(".artikel"):
            aid = art.get("id", "")
            h3 = art.find("h3", class_="titel")
            link = h3.find("a") if h3 else None
            body = art.__copy__()
            for x in body.select("h3.titel, .thumbnail, script, .more_info"):
                x.decompose()
            imgs = [i.get("src") for i in art.find_all("img") if i.get("src")]
            more = art.select_one(".more_info a")
            body_txt = txt(body)
            m = PRICE_RE.search(body_txt)
            artikel.append({
                "id": aid,
                "titel": clean(h3.get_text()) if h3 else "",
                "detail_href": link.get("href") if link and link.get("href") else None,
                "text": body_txt,
                "images": imgs,
                "cta": clean(more.get_text()) if more else None,
                "cta_href": more.get("href") if more else None,
                "price": m.group(2) if m else None,
            })

        # Slider-Bilder (Detailseiten)
        gallery = [a.get("href") for a in content.select(".slider-single a[href]")]

        # Freitext der Kategorie
        kat = content.select_one(".kategorie_text")
        kattext = txt(kat) if kat else ""

        # Alle Bilder sammeln
        for i in soup.find_all("img"):
            src = i.get("src")
            if src and "/media/" in src:
                key = urljoin(BASE, src)
                images.setdefault(key, {"title": clean(i.get("title") or i.get("alt") or ""), "pages": []})
                if u not in images[key]["pages"]:
                    images[key]["pages"].append(u)

        pages[u] = {
            "url": u, "file": f, "title": title, "breadcrumbs": crumbs,
            "kategorie_text": kattext, "thumbnails": thumbs,
            "artikel": artikel, "gallery": gallery,
            "content_text": txt(content),
        }

    json.dump(pages, open(os.path.join(ROOT, "pages.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(nav, open(os.path.join(ROOT, "nav.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(images, open(os.path.join(ROOT, "images.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print("pages:", len(pages))
    print("nav top-level:", len(nav or []))
    print("images:", len(images))
    print("thumbnails total:", sum(len(p["thumbnails"]) for p in pages.values()))
    print("artikel total:", sum(len(p["artikel"]) for p in pages.values()))
    prices = [t for p in pages.values() for t in p["thumbnails"] if t["price"]]
    print("thumbs with price:", len(prices))


if __name__ == "__main__":
    main()
