# -*- coding: utf-8 -*-
"""Erzeugt shop/assets/js/catalog.js aus der Analyse (Produkte, Preise, Kategorien)."""
import os, re, json, sys, html, unicodedata
from collections import OrderedDict, defaultdict

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
SHOP = os.path.abspath(os.path.join(ROOT, "..", "shop"))
IMGDIR = os.path.join(SHOP, "assets", "img", "produkte")
BASE = "https://matten.de"

products = json.load(open(os.path.join(ROOT, "products_raw.json"), encoding="utf-8"))
matrix = json.load(open(os.path.join(ROOT, "price_matrix.json"), encoding="utf-8"))
imagejobs = {j["url"]: j for j in json.load(open(os.path.join(ROOT, "imagejobs.json"), encoding="utf-8"))}
gen = {}
gp = os.path.join(ROOT, "generated_images.json")
if os.path.exists(gp):
    gen = json.load(open(gp, encoding="utf-8"))


def slugify(s):
    s = unicodedata.normalize("NFKD", s)
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = re.sub(r"[^\w\s-]", "", s, flags=re.U).strip().lower()
    return re.sub(r"[\s_-]+", "-", s)[:70].strip("-")


def txt(s):
    return re.sub(r"\s+", " ", html.unescape(s or "")).strip()


# --------------------------------------------------------------- Kategorien
CATS = OrderedDict([
    ("fussmatten", {
        "name": "Fußmatten & Schmutzfangmatten",
        "short": "Fußmatten",
        "teaser": "Einfarbige, melierte und bedruckte Schmutzfangmatten in Standard- und Wunschgrößen.",
        "subs": OrderedDict([
            ("standard-schmutzfangmatten", "Baumwoll- & Nylon-Fußmatten"),
            ("fussmatten", "Einfarbige & Logo-Fußmatten"),
            ("matten_fuer_aussenbereiche", "Matten für Außenbereiche"),
            ("sonderangebot", "Sonderangebote"),
            ("kis_keep_it_simple", "Keep it simple"),
            ("gummi_und_kunststoffmatten", "Gummi & Kunststoff"),
        ]),
    }),
    ("logomatten", {
        "name": "Logomatten & Designmatten",
        "short": "Logomatten",
        "teaser": "Werbewirksame Matten mit Ihrem Logo — bis 32-farbig, in jeder Wunschgröße.",
        "subs": OrderedDict([
            ("os-physio-rehab-matten", "REHA- & Trainingsmatten"),
            ("matten_fuer_haus_und_heim", "Matten für Haus & Heim"),
            ("sicherheits_symbol_matten", "Hinweis- & Sicherheitsmatten"),
            ("werbematten-dekomatten", "Werbe- & Dekomatten"),
            ("bierbankmatten", "Bierbank-Auflagen"),
            ("wunschdesign-matten", "Wunschdesign-Matten"),
            ("s_und_s-trainings-teppiche", "Trainings-Teppiche"),
        ]),
    }),
    ("kokosmatten", {
        "name": "Kokosmatten",
        "short": "Kokosmatten",
        "teaser": "Kokosvelour natur und farbig, in Höhen von 13 bis 30 mm, auf Maß zugeschnitten.",
        "subs": OrderedDict(),
    }),
    ("aluminium_profilmatten", {
        "name": "Aluminium-Profilmatten",
        "short": "Aluminium-Matten",
        "teaser": "Eingangsmattensysteme aus Aluminium — Diplomat, Marschall, Premium, mit Rahmen und Zubehör.",
        "subs": OrderedDict([
            ("rahmen_und_zubehoer", "Rahmen & Zubehör"),
            ("Diplomat-Original", "Diplomat Original"),
            ("diplomat-premium", "Diplomat Premium"),
        ]),
    }),
    ("gummi_und_kunststoffmatten", {
        "name": "Gummi- & Kunststoffmatten",
        "short": "Gummi/Kunststoff",
        "teaser": "Anti-Ermüdungsmatten, Bodenschutz, Reinstreifer und Wabenmatten für Industrie und Büro.",
        "subs": OrderedDict([
            ("bodenschutzmatten", "Bodenschutzmatten"),
        ]),
    }),
    ("miet-mattenservice", {
        "name": "Miet-Mattenservice",
        "short": "Miet-Matten",
        "teaser": "Matten mieten statt kaufen — inklusive Abholung, Wäsche und Austausch.",
        "subs": OrderedDict([
            ("reinigungsprodukte", "Teppich-Reinigungsprodukte"),
            ("service_miet-mattenservice", "Mietmatten-Service"),
        ]),
    }),
    ("was-ist-neu", {
        "name": "Neu im Sortiment",
        "short": "Was ist neu",
        "teaser": "Neuheiten aus dem Mattenfuchs-Sortiment.",
        "subs": OrderedDict([("terrazzo", "Terrazzo & Naturstein")]),
    }),
])

ALIAS = {"Logomatten": "logomatten", "Fussmatten": "fussmatten", "home": "logomatten",
         "produkte": "fussmatten", "schnaeppchen": "fussmatten"}


def categorize(u):
    path = u.replace(BASE + "/", "")
    segs = path.split("/")
    top = ALIAS.get(segs[0], segs[0])
    if top not in CATS:
        top = "fussmatten"
    sub = None
    if len(segs) >= 3:
        cand = segs[1]
        if cand in CATS[top]["subs"]:
            sub = cand
        else:
            sub = cand
    return top, sub


# --------------------------------------------------------------- Merkmale
FEATURE_RULES = [
    (r"11\s*Jahre\s*Farbgarantie", "11 Jahre Farbgarantie"),
    (r"5\s*Jahre\s*Garantie", "5 Jahre Garantie"),
    (r"(\d{2,3})\s*(?:Print|Standard)?farben", lambda m: "Auswahl aus %s Farben" % m.group(1)),
    (r"bis\s*(\d{1,2})-?farbig", lambda m: "Druck bis %s-farbig" % m.group(1)),
    (r"waschbar|waschmaschine|gewaschen", "Waschbar"),
    (r"60\s*Grad|60°", "Bis 60 °C waschbar"),
    (r"rutschhemmend|rutschfest|Antirutsch", "Rutschhemmende Rückseite"),
    (r"Nitril(?:gummi|-Gummi)?", "Nitrilgummi-Rücken"),
    (r"Ma(?:ß|ss)anfertigung|Wunschgr(?:ö|oe)(?:ß|ss)e|beliebige\s*Ma(?:ß|ss)e", "Maßanfertigung möglich"),
    (r"200\s*cm\s*Breite", "Breiten bis 200 cm"),
    (r"7\s*m\s*L(?:ä|ae)nge|700\s*cm", "Längen bis 700 cm"),
    (r"solution\s*dyed|durchgef(?:ä|ae)rbt", "Durchgefärbte Faser"),
    (r"Polyamid|Nylon", "Polyamid-/Nylonfaser"),
    (r"Aussenbereich|Au(?:ß|ss)enbereich|outdoor|witterungsbest", "Für den Außenbereich geeignet"),
    (r"Anti-?Erm(?:ü|ue)dung", "Anti-Ermüdungswirkung"),
    (r"Trockner|T(?:ü|ue)mmler|getrocknet", "Trocknergeeignet"),
]


def features(text, maxn=3):
    out = []
    for rx, val in FEATURE_RULES:
        m = re.search(rx, text, re.I)
        if m:
            v = val(m) if callable(val) else val
            if v not in out:
                out.append(v)
        if len(out) >= maxn:
            break
    return out


NOISE = re.compile(
    r"(Klick f(ü|ue)r|Farbpalette|Technische Daten|Online[- ]Kaufen|Anfrage|"
    r"^\+{2,}|Bitte beachten Sie die Mindest|Mindestma(ß|ss)e|Maximalma(ß|ss)e|"
    r"Kommentar zur Bestellung|Preis:|Versand nach|Inkl\. Umsatzsteuer|Anzahl:|"
    r"In den Warenkorb|Nach oben|zur(ü|ue)ck|^\*+$|^\d+$)", re.I)


SPECDUMP = re.compile(r"(Flor(h(ö|oe)he)?\s*:|Gewicht\s*:|g/m|mm\b.*mm\b.*mm|%\s*\w+.*%\s*\w+)", re.I)


def digit_ratio(s):
    return sum(c.isdigit() for c in s) / max(1, len(s))


def pick_teaser(desc):
    """Nimmt den ersten Satz, der wie Fließtext klingt — keine Datenblatt-Zeile."""
    cands = [d for d in desc if 45 <= len(d) <= 400
             and digit_ratio(d) < 0.10 and not SPECDUMP.search(d)]
    if not cands:
        cands = [d for d in desc if len(d) >= 45] or desc
    if not cands:
        return ""
    t = cands[0]
    m = re.match(r"^(.{60,200}?[.!?])(\s|$)", t)
    return (m.group(1) if m else t).strip()


def shorten(s, n):
    s = txt(s)
    if len(s) <= n:
        return s
    cut = s[:n].rsplit(" ", 1)[0].rstrip(" ,.;:-–")
    return cut + " …"


def clean_desc(parts):
    out = []
    for p in parts:
        p = txt(p)
        if len(p) < 25 or NOISE.search(p):
            continue
        p = re.sub(r"\+{2,}", "", p).strip()
        if p and p not in out:
            out.append(p)
    return out


# --------------------------------------------------------------- Preise
QUOTE_RE = re.compile(r"(ma(ß|ss)anfertigung|sonderma(ß|ss)|wunschma(ß|ss)|nach\s*ma(ß|ss))", re.I)


def price_rows(u):
    """Der Live-Shop liefert auch dann einen Preis, wenn is_complete false ist
    (weil Farbe/Design noch fehlen). Als 'kaufbar' gilt daher: Preis > 0 und
    keine Maßanfertigung."""
    m = matrix.get(u) or {}
    rows = []
    for r in m.get("rows", []):
        if r.get("preis") is None:
            continue
        sz = txt(r.get("size"))
        if not sz:
            continue
        pr = round(float(r["preis"]), 2)
        rows.append({"size": sz, "price": pr,
                     "complete": pr > 0 and not QUOTE_RE.search(sz)})
    return m.get("size_label"), rows


import shutil
from urllib.parse import urlparse, unquote

MEDIA = os.path.abspath(os.path.join(ROOT, "..", "_assets_original", "media"))
ORIGDIR = os.path.join(SHOP, "assets", "img", "original")
os.makedirs(ORIGDIR, exist_ok=True)

BADIMG = re.compile(r"(farboption|designoption|default\.jpg|farbpalette|palette|logo\.png|"
                    r"printer|/de\.jpg|/en_|/id_|button|pfeil|icon)", re.I)

# Kachelbilder aller Seiten nach Artikelkennung indizieren (Groß/Klein egal)
_pages = json.load(open(os.path.join(ROOT, "pages.json"), encoding="utf-8"))
_key2img = {}
for _pg in _pages.values():
    for _t in _pg.get("thumbnails", []):
        _h, _i = _t.get("href"), _t.get("img")
        if not _h or not _i or BADIMG.search(_i):
            continue
        for _k in {_h.split("#")[-1].split("/")[-1].lower().strip(),
                   _h.split("#")[0].rstrip("/").split("/")[-1].lower().strip()}:
            if _k:
                _key2img.setdefault(_k, []).append(_i)


def _copy_original(src):
    """Kopiert ein Originalbild in den Shop und liefert den relativen Pfad."""
    name = unquote(os.path.basename(urlparse(src).path))
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    srcp = os.path.join(MEDIA, name)
    if not os.path.exists(srcp) or os.path.getsize(srcp) < 800:
        return None
    dst = os.path.join(ORIGDIR, name)
    if not os.path.exists(dst):
        try:
            shutil.copyfile(srcp, dst)
        except Exception:
            return None
    return "assets/img/original/" + name


def gen_image(u):
    """Bevorzugt das neu erzeugte Bild, sonst das beste Originalbild."""
    j = imagejobs.get(u)
    if j:
        g = gen.get(j["src_url"])
        if g and g.get("file") and os.path.exists(os.path.join(IMGDIR, g["file"])):
            return "assets/img/produkte/" + g["file"]
        f = _copy_original(j["src_url"])
        if f:
            return f
    key = u.rstrip("/").split("/")[-1].lower()
    for cand in _key2img.get(key, []) + _key2img.get("artikel_" + key, []):
        f = _copy_original(cand)
        if f:
            return f
    return None


# --------------------------------------------------------------- Bauen
items = []
seen_slugs = set()
for p in products:
    top, sub = categorize(p["url"])
    label, rows = price_rows(p["url"])
    prices = [r["price"] for r in rows if r["price"] > 0]
    base_price = min(prices) if prices else (p["price"] or 0)
    has_range = len(set(prices)) > 1

    desc = clean_desc(p["description"])
    full = " ".join(desc)
    teaser = pick_teaser(desc) or txt(p["meta_description"])
    teaser = shorten(teaser, 175)

    slug = slugify(p["name"] or p["url"].rsplit("/", 1)[-1])
    if not slug or slug in seen_slugs:
        slug = slugify((p["name"] or "matte") + "-" + p["url"].rsplit("/", 1)[-1])
    n = 2
    while slug in seen_slugs:
        slug = "%s-%d" % (slug, n)
        n += 1
    seen_slugs.add(slug)

    colors = []
    for c in p["colors"]:
        colors.append({"name": txt(c["value"]).replace("-", " "),
                       "value": c["value"],
                       "swatch": (c["swatch"] or "").lstrip("/")})
    attrs = []
    for a in p["attributes"]:
        vals = [txt(v) for v in a["values"] if v]
        if len(vals) < 2:
            continue
        if label and a["label"] == label:
            continue
        attrs.append({"label": txt(a["label"]).rstrip(",").strip(),
                      "values": vals, "default": txt(a["default"] or (vals[0] if vals else ""))})

    name = txt(p["name"])
    name = re.sub(r"\s*>\s*", " – ", name).replace("–  ", "– ").strip(" –")

    items.append({
        "id": p["artikel_id"],
        "slug": slug,
        "name": name,
        "cat": top,
        "sub": sub,
        "subName": CATS[top]["subs"].get(sub) if sub else None,
        "price": round(base_price, 2),
        "from": has_range,
        "shipping": p["versand"],
        "sizeLabel": txt(label) if label else None,
        "sizes": rows,
        "colors": colors,
        "designs": len(p["designs"]),
        "attrs": attrs,
        "custom": p["custom_size"],
        "teaser": teaser,
        "desc": desc[:14],
        "features": features(full or teaser),
        "image": gen_image(p["url"]),
        "srcImage": (imagejobs.get(p["url"]) or {}).get("src_url"),
        "family": (imagejobs.get(p["url"]) or {}).get("family", "default"),
        "origin": p["url"],
    })

# Badges
by_cat = defaultdict(list)
for it in items:
    by_cat[it["cat"]].append(it)
for cat, lst in by_cat.items():
    lst.sort(key=lambda x: -(len(x["colors"]) * 3 + len(x["desc"]) + (5 if x["image"] else 0)))
    for it in lst[:2]:
        it["badge"] = "Topseller"
for it in items:
    if it.get("badge"):
        continue
    if it["custom"] or any("Maßanfertigung" in f for f in it["features"]):
        it["badge"] = "Nach Maß"

cats_out = []
for key, c in CATS.items():
    n = sum(1 for i in items if i["cat"] == key)
    subs = []
    present = defaultdict(int)
    for i in items:
        if i["cat"] == key and i["sub"]:
            present[i["sub"]] += 1
    for sk, sn in c["subs"].items():
        subs.append({"key": sk, "name": sn, "count": present.get(sk, 0)})
    for sk, cnt in present.items():
        if sk not in c["subs"]:
            subs.append({"key": sk, "name": sk.replace("_", " ").replace("-", " ").title(), "count": cnt})
    cats_out.append({"key": key, "name": c["name"], "short": c["short"],
                     "teaser": c["teaser"], "count": n,
                     "subs": [s for s in subs if s["count"] > 0]})

out = {"categories": cats_out, "products": items}
os.makedirs(os.path.join(SHOP, "assets", "js"), exist_ok=True)
js = "/* Automatisch erzeugt aus der Analyse von matten.de — nicht von Hand ändern. */\n"
js += "window.CATALOG = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n"
open(os.path.join(SHOP, "assets", "js", "catalog.js"), "w", encoding="utf-8").write(js)

print("Produkte:", len(items), " mit neuem Bild:", sum(1 for i in items if i["image"]))
print("Mit Preisstaffel:", sum(1 for i in items if len(i["sizes"]) > 1))
for c in cats_out:
    print("  %-28s %3d  (%s)" % (c["short"], c["count"], ", ".join("%s:%d" % (s["name"], s["count"]) for s in c["subs"])[:90]))
