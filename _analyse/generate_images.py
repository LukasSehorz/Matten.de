# -*- coding: utf-8 -*-
"""Erzeugt neue Produktbilder mit GPT Image 2 ueber kie.ai.

Dedupliziert nach Quellbild, laeuft parallel, speichert Zwischenstand,
kann jederzeit erneut gestartet werden (setzt fort).
"""
import os, re, json, sys, time, threading, queue
import requests

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.abspath(os.path.join(ROOT, "..", "shop", "assets", "img", "produkte"))
STATE = os.path.join(ROOT, "generated_images.json")
os.makedirs(OUTDIR, exist_ok=True)

KEY = os.environ.get("KIE_API_KEY", "")
H = {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
API = "https://api.kie.ai/api/v1/jobs"
WORKERS = 12

jobs = json.load(open(os.path.join(ROOT, "imagejobs.json"), encoding="utf-8"))

# nach Quellbild deduplizieren
uniq = {}
for j in jobs:
    uniq.setdefault(j["src_url"], j)
tasks = list(uniq.values())

state = {}
if os.path.exists(STATE):
    state = json.load(open(STATE, encoding="utf-8"))

lock = threading.Lock()
S = requests.Session()
S.headers.update(H)


def outname(src_url):
    base = os.path.basename(src_url).rsplit(".", 1)[0]
    base = re.sub(r"[^A-Za-z0-9_\-]+", "-", base).strip("-").lower()
    return (base or "bild")[:60] + ".png"


def credit():
    try:
        return S.get("https://api.kie.ai/api/v1/chat/credit", timeout=20).json()["data"]
    except Exception:
        return None


def save():
    with lock:
        json.dump(state, open(STATE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def run(t):
    src = t["src_url"]
    fn = outname(src)
    dest = os.path.join(OUTDIR, fn)
    if src in state and state[src].get("file") and os.path.exists(os.path.join(OUTDIR, state[src]["file"])):
        return "skip"
    payload = {"model": "gpt-image-2-image-to-image",
               "input": {"prompt": t["prompt"], "input_urls": [src],
                         "aspect_ratio": "4:3", "resolution": "1K"}}
    try:
        r = S.post(API + "/createTask", json=payload, timeout=60)
        d = r.json()
        if d.get("code") != 200:
            with lock:
                state[src] = {"error": str(d)[:200]}
            return "err"
        tid = d["data"]["taskId"]
    except Exception as e:
        with lock:
            state[src] = {"error": str(e)[:200]}
        return "err"

    url = None
    for _ in range(80):
        time.sleep(6)
        try:
            q = S.get(API + "/recordInfo", params={"taskId": tid}, timeout=30).json()
            dd = q.get("data") or {}
            st = dd.get("state")
            if st == "success":
                rj = json.loads(dd.get("resultJson") or "{}")
                urls = rj.get("resultUrls") or []
                if urls:
                    url = urls[0]
                break
            if st in ("fail", "failed"):
                with lock:
                    state[src] = {"error": (dd.get("failMsg") or "failed")[:200], "task": tid}
                return "fail"
        except Exception:
            continue
    if not url:
        with lock:
            state[src] = {"error": "timeout", "task": tid}
        return "timeout"

    try:
        img = requests.get(url, timeout=120).content
        open(dest, "wb").write(img)
    except Exception as e:
        with lock:
            state[src] = {"error": "download: " + str(e)[:120]}
        return "err"

    with lock:
        state[src] = {"file": fn, "task": tid, "bytes": len(img), "family": t["family"]}
    return "ok"


q = queue.Queue()
for t in tasks:
    q.put(t)

counts = {"ok": 0, "skip": 0, "err": 0, "fail": 0, "timeout": 0}
start = time.time()


def worker():
    while True:
        try:
            t = q.get_nowait()
        except queue.Empty:
            return
        res = run(t)
        with lock:
            counts[res] = counts.get(res, 0) + 1
            n = sum(counts.values())
        if n % 5 == 0:
            save()
            print("  %d/%d  %s  %.0fs" % (n, len(tasks), counts, time.time() - start), flush=True)
        q.task_done()


print("Eindeutige Quellbilder:", len(tasks), " bereits erzeugt:",
      sum(1 for t in tasks if t["src_url"] in state and state[t["src_url"]].get("file")))
print("Credits vorher:", credit(), flush=True)

ths = [threading.Thread(target=worker, daemon=True) for _ in range(WORKERS)]
[t.start() for t in ths]
[t.join() for t in ths]
save()
print("FERTIG", counts, "in %.0fs" % (time.time() - start))
print("Credits nachher:", credit())

