import os
# -*- coding: utf-8 -*-
"""Testlauf: ein Produktbild mit GPT Image 2 (kie.ai) neu erzeugen."""
import json, time, sys, requests
sys.stdout.reconfigure(encoding="utf-8")

KEY = os.environ.get("KIE_API_KEY", "")
H = {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"}


def credit():
    return requests.get("https://api.kie.ai/api/v1/chat/credit", headers=H, timeout=30).json()["data"]


before = credit()
print("Credits vorher:", before)

payload = {
    "model": "gpt-image-2-image-to-image",
    "input": {
        "prompt": (
            "Professional e-commerce product photograph of this exact entrance dirt-trapping "
            "door mat. Keep the mat's pattern, texture, colour and proportions EXACTLY as in the "
            "reference image - do not redesign it. Re-shoot it as a premium catalogue photo: the "
            "mat lying flat on a light neutral warm-grey seamless studio floor, viewed from a "
            "35-degree elevated three-quarter angle, soft large diffused softbox light from the "
            "upper left, gentle realistic contact shadow, shallow natural depth of field. "
            "Clean, calm, high-end German B2B catalogue aesthetic. Sharp fibre detail, accurate "
            "colour. No text, no watermark, no logo overlay, no props, no people."
        ),
        "input_urls": ["https://matten.de/media/bild/IH-Menue-200_512x340.jpg"],
        "aspect_ratio": "4:3",
        "resolution": "1K",
    },
}
r = requests.post("https://api.kie.ai/api/v1/jobs/createTask", headers=H, json=payload, timeout=60)
print("createTask:", r.status_code, r.text[:300])
tid = r.json()["data"]["taskId"]

for i in range(90):
    time.sleep(5)
    q = requests.get("https://api.kie.ai/api/v1/jobs/recordInfo", headers=H,
                     params={"taskId": tid}, timeout=30)
    d = q.json()
    st = (d.get("data") or {}).get("state")
    print(i, st, flush=True)
    if st in ("success", "fail", "failed"):
        print(json.dumps(d, ensure_ascii=False)[:1200])
        break

after = credit()
print("Credits nachher:", after, "-> verbraucht:", round(before - after, 3))
