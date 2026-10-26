#!/usr/bin/env python3
"""Bild mit kie.ai (GPT Image 2.5, Bild-zu-Bild) originalgetreu schaerfer machen.

Aufruf:  python3 kie_scharf.py <eingabe> <ausgabe> [--ar 3:2] [--res 2K] [--modell gpt-image-2-5-sunburst-image-to-image]
         python3 kie_scharf.py --guthaben

Der Schluessel kommt aus ~/.config/kie/.env (KIE_API_KEY) und wird nie ausgegeben.
Ablauf: Bild hochladen (kie-Dateiablage, haelt 3 Tage) -> Auftrag -> warten -> laden.
"""
import base64, json, os, sys, time, urllib.request

def env():
    d = {}
    for z in open(os.path.expanduser('~/.config/kie/.env')):
        if '=' in z and not z.strip().startswith('#'):
            k, v = z.strip().split('=', 1); d[k] = v
    return d
E = env(); KEY = E['KIE_API_KEY']; API = E.get('KIE_API', 'https://api.kie.ai/api/v1')
H = {'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'}

def req(url, daten=None):
    r = urllib.request.Request(url, data=json.dumps(daten).encode() if daten is not None else None, headers=H, method='POST' if daten is not None else 'GET')
    with urllib.request.urlopen(r, timeout=120) as a:
        return json.loads(a.read())

def guthaben():
    return req(API + '/chat/credit')['data']

PROMPT = ("Upscale and sharpen this exact photo to high resolution. Keep EVERYTHING identical: same composition, "
          "same framing, same objects, same colors and color tones, same text, letters, logos, numbers and patterns, "
          "same lighting. Do not add, remove, move or restyle anything. Do not invent new details, only restore "
          "clarity, edge sharpness and fine texture (e.g. carpet fibres) that the low resolution blurred. Photorealistic.")

def hochladen(pfad):
    ext = os.path.splitext(pfad)[1].lower().lstrip('.') or 'png'
    mime = 'image/jpeg' if ext in ('jpg', 'jpeg') else 'image/' + ext
    b64 = base64.b64encode(open(pfad, 'rb').read()).decode()
    r = req('https://kieai.redpandaai.co/api/file-base64-upload', {'base64Data': f'data:{mime};base64,{b64}', 'uploadPath': 'images/mattenfuchs', 'fileName': os.path.basename(pfad)})
    url = (r.get('data') or {}).get('downloadUrl') or (r.get('data') or {}).get('fileUrl')
    if not url: raise RuntimeError('Upload fehlgeschlagen: ' + json.dumps(r)[:300])
    return url

def schaerfen(ein, aus, ar='3:2', res='2K', modell='gpt-image-2-5-sunburst-image-to-image', prompt=PROMPT):
    url = hochladen(ein)
    r = req(API + '/jobs/createTask', {'model': modell, 'input': {'prompt': prompt, 'input_urls': [url], 'aspect_ratio': ar, 'resolution': res}})
    if r.get('code') != 200: raise RuntimeError('Auftrag abgelehnt: ' + json.dumps(r)[:400])
    tid = r['data']['taskId']; warte = 5
    for _ in range(80):
        time.sleep(warte); warte = min(warte * 1.2, 15)
        d = req(API + '/jobs/recordInfo?taskId=' + tid)['data']
        if d['state'] == 'success':
            ziel = json.loads(d['resultJson'])['resultUrls'][0]
            urllib.request.urlretrieve(ziel, aus); return aus
        if d['state'] == 'fail': raise RuntimeError(f"fehlgeschlagen: {d.get('failCode')} {d.get('failMsg')}")
    raise RuntimeError('Zeitueberschreitung')

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == '--guthaben': print(guthaben()); sys.exit()
    opt = lambda n, d: a[a.index(n) + 1] if n in a else d
    vor = guthaben()
    schaerfen(a[0], a[1], opt('--ar', '3:2'), opt('--res', '2K'), opt('--modell', 'gpt-image-2-5-sunburst-image-to-image'))
    print(f'fertig: {a[1]} | Guthaben {vor} -> {guthaben()}')
