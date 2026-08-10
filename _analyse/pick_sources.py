# -*- coding: utf-8 -*-
"""Waehlt pro Produkt das beste Quellbild + baet einen passenden Prompt."""
import os, re, json, sys
from urllib.parse import unquote, urlparse
sys.stdout.reconfigure(encoding="utf-8")
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

ROOT = os.path.dirname(os.path.abspath(__file__))
MEDIA = os.path.abspath(os.path.join(ROOT, "..", "_assets_original", "media"))
BASE = "https://matten.de"

products = json.load(open(os.path.join(ROOT, "products_raw.json"), encoding="utf-8"))

BAD = re.compile(r"(farboption|designoption|_farb|default\.jpg|farbpalette|palette|"
                 r"logo\.png|printer|de\.jpg|en_|id_|button|pfeil|icon)", re.I)


def local(u):
    n = unquote(os.path.basename(urlparse(u).path))
    n = re.sub(r'[<>:"/\\|?*]', "_", n)
    return os.path.join(MEDIA, n)


def dims(p):
    if not HAS_PIL or not os.path.exists(p):
        return (0, 0)
    try:
        with Image.open(p) as im:
            return im.size
    except Exception:
        return (0, 0)


# ---- Produktfamilie bestimmen -> passender Szenen-Prompt --------------------
FAMILIES = [
    ("alu", r"(aluminium|alu-|profilmatte|diplomat|marschall|plaza|top-clean|gitterrost|"
            r"anlaufprofil|rahmen|unterkonstruktion|schmutzfangwanne|ripsstreifen|profileinlage)"),
    ("kokos", r"kokos"),
    ("bierbank", r"(bierbank|biergarten)"),
    ("auto", r"(automatte|automatten)"),
    ("gummi", r"(gummi|kunststoff|waben|reinstreifer|scraper|sixform|stewell|nomad|"
              r"bodenschutz|anti-erm|komfort|cushion|kushion|thru|optibrush|assistent|attache)"),
    ("logo", r"(logomatte|jetprint|chromojet|velour|billboard|event|bigsize|patio|"
             r"kleen-way|werbematte|barmatte|counter)"),
    ("design", r"(art-design|design|welcome|willkommen|i love|hund|k(a|ä)tz|jungle|village|"
               r"morgensonne|holzdesign|ford|kinderkunst|b(a|ä)lle|paketbote)"),
    ("sicherheit", r"(sicherheit|symbol|hinweis|gebots|abstand|rutschgefahr|raucher|"
                   r"kabel|desinfektion|h(a|ä)ndewaschen|diskretion|warten|n(a|ä)chste)"),
    ("reha", r"(reha|physio|training|stepping|os-)"),
    ("outdoor", r"(outdoor|k-turf|aussen|au(ss|ß)en|water.?horse|wash.?horse|wetstep|yacht)"),
]

SCENES = {
    "alu": ("a heavy-duty aluminium entrance profile mat system with visible extruded aluminium "
            "rails and insert strips, photographed lying flat"),
    "kokos": ("a natural coir (coconut fibre) door mat with its coarse bristly fibre surface clearly visible"),
    "bierbank": ("a long padded beer-bench seat cushion mat for a beer garden bench, "
                 "photographed lying flat and slightly rolled at one end"),
    "auto": ("a set of fitted car floor mats, arranged neatly overlapping"),
    "gummi": ("a rubber / PVC industrial floor matting tile, its relief structure clearly readable in raking light"),
    "logo": ("a printed logo entrance mat with a black nitrile rubber border, lying flat"),
    "design": ("a printed decorative door mat with a rubber border, lying flat"),
    "sicherheit": ("a printed safety / information floor mat with a rubber border, lying flat"),
    "reha": ("a printed therapy and training floor mat, lying flat"),
    "outdoor": ("an outdoor entrance mat, lying flat"),
    "default": ("a textile dirt-trapping entrance door mat with a black rubber border, lying flat"),
}


def family(p):
    hay = " ".join([p["name"], p["title"], " ".join(p["breadcrumbs"]), p["url"]]).lower()
    for key, rx in FAMILIES:
        if re.search(rx, hay):
            return key
    return "default"


PROMPT = (
    "Professional e-commerce catalogue photograph of THIS EXACT product: {scene}. "
    "Reproduce the pattern, colour, texture, surface structure and proportions of the reference "
    "image EXACTLY — do not redesign, restyle, recolour or add elements. "
    "Re-shoot it as a premium studio product photo: the product on a light neutral warm-grey "
    "seamless studio floor, elevated three-quarter view from about 35 degrees, large soft "
    "diffused key light from the upper left, gentle realistic contact shadow, subtle natural "
    "depth of field, crisp material detail. Calm, precise, high-end German B2B catalogue "
    "aesthetic. Absolutely no text, no watermark, no added logos, no people, no props, "
    "no colour swatch strips, no collage, single product only, centred with generous margin."
)

# ---- Fallback-Bilder: Kacheln, die auf dieses Produkt verlinken -----------
pages = json.load(open(os.path.join(ROOT, "pages.json"), encoding="utf-8"))
link2img = {}
for pg in pages.values():
    for t in pg.get("thumbnails", []):
        h, im = t.get("href"), t.get("img")
        if not h or not im:
            continue
        key = h.split("#")[0].rstrip("/")
        if key.startswith("http"):
            key = key.replace("https://www.matten.de", "").replace("https://matten.de", "")
        link2img.setdefault(key, []).append(im)

own_imgs = {}
for pg in pages.values():
    for a in pg.get("artikel", []):
        for im in a.get("images", []):
            own_imgs.setdefault(pg["url"], []).append(im)


def fallbacks(p):
    path = p["url"].replace(BASE, "").rstrip("/")
    res = list(link2img.get(path, []))
    res += own_imgs.get(p["url"], [])
    for t in pages.get(p["url"], {}).get("thumbnails", []):
        if t.get("img"):
            res.append(t["img"])
    return res


out = []
skipped = []
for p in products:
    cands = []
    for g in list(p["gallery"]) + fallbacks(p):
        if not g or BAD.search(g):
            continue
        lp = local(g)
        w, h = dims(lp)
        if w >= 300 and h >= 200:
            cands.append((w * h, g, lp, w, h))
    if not cands:
        for g in list(p["gallery"]) + fallbacks(p):
            lp = local(g)
            w, h = dims(lp)
            if w >= 200:
                cands.append((w * h, g, lp, w, h))
    if not cands:
        skipped.append(p["url"])
        continue
    cands.sort(reverse=True)
    _, g, lp, w, h = cands[0]
    fam = family(p)
    out.append({
        "url": p["url"],
        "slug": re.sub(r"[^a-z0-9]+", "-", p["url"].replace(BASE + "/", "").lower()).strip("-"),
        "name": p["name"],
        "family": fam,
        "src_url": g if g.startswith("http") else BASE + g,
        "src_local": os.path.basename(lp),
        "src_dim": [w, h],
        "prompt": PROMPT.format(scene=SCENES[fam]),
    })

json.dump(out, open(os.path.join(ROOT, "imagejobs.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print("Jobs:", len(out), " ohne brauchbares Quellbild:", len(skipped))
from collections import Counter
for k, v in Counter(j["family"] for j in out).most_common():
    print("  %-12s %d" % (k, v))
