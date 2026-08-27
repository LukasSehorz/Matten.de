# -*- coding: utf-8 -*-
"""Laedt die Google-Fonts woff2 lokal herunter und schreibt fonts.css."""
import os, re, sys, requests
sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
FDIR = os.path.abspath(os.path.join(ROOT, "..", "shop", "assets", "fonts"))
os.makedirs(FDIR, exist_ok=True)

css = open(os.path.join(FDIR, "google.css"), encoding="utf-8").read()

# nur latin + latin-ext behalten
blocks = re.split(r"(?=/\*\s*[a-z-]+\s*\*/)", css)
keep = [b for b in blocks if re.match(r"/\*\s*(latin|latin-ext)\s*\*/", b.strip())]

S = requests.Session()
S.headers.update({"User-Agent": "Mozilla/5.0"})
out = ["/* Selbst gehostete Schriften — Archivo (Display) + Barlow (Text) */"]
seen = {}
for b in keep:
    def repl(m):
        url = m.group(1)
        name = url.rsplit("/", 1)[-1]
        fam = re.search(r"font-family:\s*'([^']+)'", b).group(1)
        wt = re.search(r"font-weight:\s*(\d+)", b).group(1)
        sub = re.match(r"/\*\s*([a-z-]+)\s*\*/", b.strip()).group(1)
        fn = "%s-%s-%s.woff2" % (fam.lower(), wt, sub)
        dest = os.path.join(FDIR, fn)
        if fn not in seen:
            r = S.get(url, timeout=30)
            open(dest, "wb").write(r.content)
            seen[fn] = len(r.content)
        return "url(%s) format('woff2')" % fn
    out.append(re.sub(r"url\((https://fonts\.gstatic\.com/[^)]+)\)\s*format\('woff2'\)", repl, b).strip())

open(os.path.join(FDIR, "fonts.css"), "w", encoding="utf-8").write("\n".join(out) + "\n")
os.remove(os.path.join(FDIR, "google.css"))
print("Dateien:", len(seen), "Gesamt KB:", sum(seen.values()) // 1024)
for k, v in sorted(seen.items()):
    print("  %-30s %6d B" % (k, v))
