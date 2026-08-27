# -*- coding: utf-8 -*-
"""Sucht Quellbilder fuer die Produkte, die bisher keins haben —
direkt im HTML der Produktseite (Inhaltsbereich, ohne Navigation)."""
import os, re, json, sys, hashlib
from urllib.parse import urlparse, unquote
from bs4 import BeautifulSoup
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
HTML_DIR = os.path.join(ROOT, "html")
MEDIA = os.path.abspath(os.path.join(ROOT, "..", "_assets_original", "media"))
BASE = "https://matten.de"

BAD = re.compile(r"(farboption|designoption|default\.jpg|farbpalette|palette|logo\.png|"
                 r"printer|/de\.jpg|/en_|/id_|button|pfeil|icon|banner|kopf)", re.I)


def _fname(u):
    p = urlparse(u)
    s = (p.path + ("__" + p.query if p.query else "")).strip("/") or "index"
    s = re.sub(r"[^A-Za-z0-9_.\-]", "_", s)
    if len(s) > 120:
        s = s[:110] + "_" + hashlib.md5(u.encode()).hexdigest()[:8]
    return s + ".html"


def local(u):
    n = unquote(os.path.basename(urlparse(u).path))
    return os.path.join(MEDIA, re.sub(r'[<>:"/\\|?*]', "_", n))


def dims(pth):
    try:
        with Image.open(pth) as im:
            return im.size
    except Exception:
        return (0, 0)


jobs = json.load(open(os.path.join(ROOT, "imagejobs.json"), encoding="utf-8"))
have = {j["url"] for j in jobs}
products = json.load(open(os.path.join(ROOT, "products_raw.json"), encoding="utf-8"))

# Prompt-Bausteine aus pick_sources spiegeln
sys.path.insert(0, ROOT)
import pick_sources as PS  # noqa: E402

# Kacheln aus ALLEN Seiten nach Artikel-Kennung indizieren (Groß-/Kleinschreibung egal)
pages = json.load(open(os.path.join(ROOT, "pages.json"), encoding="utf-8"))
key2img = {}
for pg in pages.values():
    for t in pg.get("thumbnails", []):
        h, im = t.get("href"), t.get("img")
        if not h or not im or BAD.search(im):
            continue
        k = h.split("#")[-1].split("/")[-1].lower().strip()
        if k:
            key2img.setdefault(k, []).append(im)
        k2 = h.split("#")[0].rstrip("/").split("/")[-1].lower().strip()
        if k2:
            key2img.setdefault(k2, []).append(im)


def by_key(url):
    k = url.rstrip("/").split("/")[-1].lower()
    out = list(key2img.get(k, []))
    out += key2img.get("artikel_" + k, [])
    return out


added = 0
for p in products:
    if p["url"] in have:
        continue
    ext = []
    for src in by_key(p["url"]):
        lp = local(src)
        w, h2 = dims(lp)
        if w >= 260 and h2 >= 160:
            ext.append((w * h2, src, w, h2))
    if ext:
        ext.sort(reverse=True)
        _, src, w, h2 = ext[0]
        fam = PS.family(p)
        jobs.append({
            "url": p["url"],
            "slug": re.sub(r"[^a-z0-9]+", "-", p["url"].replace(BASE + "/", "").lower()).strip("-"),
            "name": p["name"], "family": fam,
            "src_url": src if src.startswith("http") else BASE + src,
            "src_local": os.path.basename(local(src)), "src_dim": [w, h2],
            "prompt": PS.PROMPT.format(scene=PS.SCENES[fam]),
        })
        added += 1
        continue
    f = os.path.join(HTML_DIR, _fname(p["url"]))
    if not os.path.exists(f):
        continue
    soup = BeautifulSoup(open(f, encoding="utf-8", errors="replace").read(), "html.parser")
    content = soup.find(id="content")
    if not content:
        continue
    for x in content.select("nav, .dropdown-menu, script, style"):
        x.decompose()
    cands = []
    for im in content.find_all("img"):
        src = im.get("src") or ""
        if not src or BAD.search(src):
            continue
        lp = local(src)
        w, h = dims(lp)
        if w >= 260 and h >= 160:
            cands.append((w * h, src, w, h))
    if not cands:
        continue
    cands.sort(reverse=True)
    _, src, w, h = cands[0]
    fam = PS.family(p)
    jobs.append({
        "url": p["url"],
        "slug": re.sub(r"[^a-z0-9]+", "-", p["url"].replace(BASE + "/", "").lower()).strip("-"),
        "name": p["name"],
        "family": fam,
        "src_url": src if src.startswith("http") else BASE + src,
        "src_local": os.path.basename(local(src)),
        "src_dim": [w, h],
        "prompt": PS.PROMPT.format(scene=PS.SCENES[fam]),
    })
    added += 1

json.dump(jobs, open(os.path.join(ROOT, "imagejobs.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
uniq = len({j["src_url"] for j in jobs})
print("neu zugeordnet:", added, "| Jobs gesamt:", len(jobs), "| eindeutige Quellen:", uniq)
