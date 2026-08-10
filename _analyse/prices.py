# -*- coding: utf-8 -*-
"""Holt die echte Preismatrix pro Produkt und Groesse vom Original-Shop."""
import os, re, json, sys, time
import requests

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "price_matrix.json")

S = requests.Session()
S.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
})

products = json.load(open(os.path.join(ROOT, "products_raw.json"), encoding="utf-8"))
done = {}
if os.path.exists(OUT):
    done = json.load(open(OUT, encoding="utf-8"))

SIZE_HINT = re.compile(r"(gr|size|masse|maß)", re.I)


def size_attr(p):
    """Waehlt das Attribut, das die Groesse steuert."""
    for a in p["attributes"]:
        if SIZE_HINT.search(a["label"]) and len(a["values"]) > 1:
            return a
    for a in p["attributes"]:
        if any(re.search(r"\d+\s*cm\s*x\s*\d+", str(v or ""), re.I) for v in a["values"]):
            return a
    return None


total = 0
for n, p in enumerate(products, 1):
    key = p["url"]
    if key in done:
        continue
    if not p["artikel_id"] or not p["price_url"]:
        continue
    sa = size_attr(p)
    base = {"artikel": p["artikel_id"], "anzahl": "1"}
    for a in p["attributes"]:
        if a["default"] is not None and a is not sa:
            base["attribute[%s]" % a["label"]] = a["default"]
    if p["colors"]:
        sel = next((c for c in p["colors"] if c["selected"]), p["colors"][0])
        base["attribute[Grundfarbe]"] = sel["value"]

    rows = []
    variants = sa["values"] if sa else [None]
    for v in variants:
        if v is None:
            body = dict(base)
        else:
            body = dict(base)
            body["attribute[%s]" % sa["label"]] = v
        try:
            r = S.post(p["price_url"], data=body, timeout=25)
            d = r.json()
            pr = (d.get("prices") or [{}])[0]
            rows.append({"size": v, "preis": pr.get("preis"), "versand": pr.get("versand"),
                         "complete": pr.get("is_complete")})
        except Exception as e:
            rows.append({"size": v, "preis": None, "err": str(e)[:60]})
        total += 1
        time.sleep(0.08)

    done[key] = {"size_label": sa["label"] if sa else None, "rows": rows}
    if n % 10 == 0:
        json.dump(done, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("  %d/%d Produkte, %d Abfragen" % (n, len(products), total), flush=True)

json.dump(done, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("FERTIG:", len(done), "Produkte,", total, "Abfragen")
