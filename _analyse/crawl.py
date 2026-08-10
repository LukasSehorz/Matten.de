# -*- coding: utf-8 -*-
"""Crawler fuer matten.de - laedt alle Seiten (deutsch) herunter."""
import os, re, sys, time, json, hashlib
from urllib.parse import urljoin, urlparse, urlunparse, parse_qs
import requests
from bs4 import BeautifulSoup

BASE = "https://matten.de"
ROOT = os.path.dirname(os.path.abspath(__file__))
HTML_DIR = os.path.join(ROOT, "html")
os.makedirs(HTML_DIR, exist_ok=True)

S = requests.Session()
S.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Accept-Language": "de-DE,de;q=0.9",
})


def norm(u):
    """Normalisiere URL, entferne lang-Parameter, Fragmente."""
    u = urljoin(BASE, u.strip())
    p = urlparse(u)
    if p.netloc not in ("matten.de", "www.matten.de", ""):
        return None
    q = parse_qs(p.query)
    q.pop("lang", None)
    q.pop("PHPSESSID", None)
    newq = "&".join(f"{k}={v[0]}" for k, v in sorted(q.items()))
    path = p.path.rstrip("/") or "/"
    return urlunparse(("https", "matten.de", path, "", newq, ""))


SKIP_RE = re.compile(
    r"(/login|/register|/request-password|/warenkorb|/guestbook|/logout|"
    r"\.(jpg|jpeg|png|gif|pdf|zip|css|js|ico|svg|webp)$)", re.I)


def fname(u):
    p = urlparse(u)
    s = (p.path + ("__" + p.query if p.query else "")).strip("/") or "index"
    s = re.sub(r"[^A-Za-z0-9_.\-]", "_", s)
    if len(s) > 120:
        s = s[:110] + "_" + hashlib.md5(u.encode()).hexdigest()[:8]
    return s + ".html"


def main():
    seeds = []
    sm = os.path.join(ROOT, "sitemap.xml")
    if os.path.exists(sm):
        for m in re.finditer(r"<loc>(.*?)</loc>", open(sm, encoding="utf-8").read()):
            n = norm(m.group(1))
            if n and not SKIP_RE.search(n):
                seeds.append(n)
    seeds.insert(0, BASE + "/")

    seen, queue, done, failed = set(), list(dict.fromkeys(seeds)), [], []
    seen.update(queue)

    while queue:
        u = queue.pop(0)
        f = os.path.join(HTML_DIR, fname(u))
        html = None
        if os.path.exists(f) and os.path.getsize(f) > 500:
            html = open(f, encoding="utf-8", errors="replace").read()
        else:
            for attempt in range(3):
                try:
                    r = S.get(u, timeout=30)
                    if r.status_code == 200:
                        r.encoding = r.apparent_encoding or "utf-8"
                        html = r.text
                        open(f, "w", encoding="utf-8").write(html)
                        break
                    else:
                        time.sleep(1)
                except Exception as e:
                    time.sleep(2)
            if html is None:
                failed.append(u)
                print("FAIL", u, flush=True)
                continue
            time.sleep(0.15)
        done.append(u)
        if len(done) % 25 == 0:
            print(f"  {len(done)} done / {len(queue)} queued", flush=True)

        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a", href=True):
            n = norm(a["href"])
            if n and n not in seen and not SKIP_RE.search(n):
                seen.add(n)
                queue.append(n)

    print(f"DONE: {len(done)} pages, {len(failed)} failed")
    json.dump({"pages": done, "failed": failed}, open(os.path.join(ROOT, "crawl_index.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
