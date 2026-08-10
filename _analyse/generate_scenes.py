# -*- coding: utf-8 -*-
"""Erzeugt die Szenenbilder (Hero, Prozess, Kategorien) mit GPT Image 2 / kie.ai."""
import os, re, json, sys, time, threading, queue
import requests

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.abspath(os.path.join(ROOT, "..", "shop", "assets", "img", "szenen"))
STATE = os.path.join(ROOT, "generated_scenes.json")
os.makedirs(OUTDIR, exist_ok=True)

KEY = os.environ.get("KIE_API_KEY", "")
H = {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
API = "https://api.kie.ai/api/v1/jobs"

STYLE = (" Photorealistic architectural / commercial photography, natural daylight, calm "
         "restrained colour, no text, no signage lettering, no watermark, no visible brand "
         "logos, clean composition, shot on a full-frame camera with a 35mm lens.")

SCENES = [
    ("hero-eingang", "16:9",
     "Wide photograph of the glazed main entrance of a modern German office building, seen from "
     "inside the lobby looking out. A large dark anthracite textile dirt-trapping entrance mat "
     "with a black rubber edge lies flush on the polished light grey stone floor in front of the "
     "revolving door. Morning daylight streams in, soft reflections on the floor, no people."),
    ("hero-logomatte", "16:9",
     "Wide photograph of a hotel lobby entrance with a large dark grey printed logo entrance mat "
     "lying on a pale terrazzo floor. The mat surface is plain dark grey with a subtle lighter "
     "grey abstract geometric shape printed on it. Warm indirect lighting, planted foliage at the "
     "edge, elegant and quiet, no people."),
    ("hero-alu", "16:9",
     "Wide photograph of a shop entrance where a large aluminium entrance matting system with "
     "parallel extruded aluminium rails and dark grey ripped textile inserts is recessed flush "
     "into a light stone floor in front of a glass door. Overcast daylight from outside, precise "
     "and technical, no people."),
    ("kachel-innen", "4:3",
     "Interior of a bright modern office foyer, a rectangular dark grey textile entrance mat lying "
     "on a light seamless floor near glass doors, viewed at a slight angle, soft daylight, no people."),
    ("kachel-logo", "4:3",
     "A dark charcoal printed entrance mat with a black rubber border lying on a smooth pale "
     "concrete floor inside a modern reception area, viewed at a three-quarter angle, "
     "soft directional daylight, no people, no lettering on the mat."),
    ("kachel-aussen", "4:3",
     "Exterior entrance of a modern building on an overcast day: a robust ribbed outdoor entrance "
     "mat lying on light stone paving in front of a glass door, wet stone, green hedge at the "
     "edge, no people."),
    ("kachel-kokos", "4:3",
     "A natural coir coconut-fibre door mat with a coarse bristly brown surface lying on warm "
     "light oak floorboards in front of a house door, soft daylight from the side, no people."),
    ("schritt-1-anfrage", "4:3",
     "Close photograph of a tidy German office desk: a laptop showing an abstract grey interface, "
     "a notebook, a pen and a corded desk telephone, warm daylight from a window on the left, "
     "shallow depth of field, no people, no readable text."),
    ("schritt-2-beratung", "4:3",
     "Close photograph of two pairs of hands over a meeting table comparing textile colour sample "
     "fans and small carpet swatches in greys, reds and blues, technical drawings partly visible, "
     "daylight, shallow depth of field, faces not visible."),
    ("schritt-3-aufmass", "4:3",
     "Close photograph of hands with a folding rule and a pencil measuring a floor recess at a "
     "building entrance, a technical floor-plan drawing lying next to it on the stone floor, "
     "daylight, shallow depth of field, faces not visible."),
    ("schritt-4-produktion", "4:3",
     "Photograph inside a clean industrial textile finishing workshop: a large roll of dark grey "
     "entrance matting on a cutting table, a worker's gloved hands guiding a cutting blade along "
     "a straight edge, controlled overhead lighting, shallow depth of field, face not visible."),
    ("schritt-5-versand", "4:3",
     "Photograph of rolled and wrapped floor mats stacked and strapped on a wooden pallet at an "
     "open loading dock, a truck trailer visible behind, cool daylight, no people, no lettering."),
    ("cta-beratung", "3:2",
     "Photograph of a bright German office workspace with a corded telephone handset resting on a "
     "desk beside colour sample fans and a technical drawing, a large window with soft daylight "
     "behind, warm and welcoming, no people, no readable text."),
    ("projekt-hotel", "16:9",
     "Wide interior photograph of an elegant hotel entrance hall with a long dark grey runner "
     "entrance mat on a pale marble floor, brass details, warm evening light, no people."),
    ("projekt-praxis", "16:9",
     "Wide interior photograph of a bright physiotherapy training room with a large printed floor "
     "training mat in muted red and green on a light vinyl floor, exercise equipment blurred in "
     "the background, daylight, no people, no lettering."),
    ("projekt-industrie", "16:9",
     "Wide photograph of a clean industrial workstation: a black anti-fatigue rubber floor mat "
     "with a fine relief structure in front of a metal workbench, cool neutral hall lighting, "
     "no people."),
]

state = {}
if os.path.exists(STATE):
    state = json.load(open(STATE, encoding="utf-8"))
lock = threading.Lock()
S = requests.Session(); S.headers.update(H)


def run(name, ratio, prompt):
    dest = os.path.join(OUTDIR, name + ".png")
    if name in state and os.path.exists(dest):
        return "skip"
    payload = {"model": "gpt-image-2-text-to-image",
               "input": {"prompt": prompt + STYLE, "aspect_ratio": ratio, "resolution": "1K"}}
    try:
        d = S.post(API + "/createTask", json=payload, timeout=60).json()
        if d.get("code") != 200:
            print("ERR", name, str(d)[:160], flush=True); return "err"
        tid = d["data"]["taskId"]
    except Exception as e:
        print("ERR", name, e, flush=True); return "err"
    for _ in range(80):
        time.sleep(6)
        try:
            dd = (S.get(API + "/recordInfo", params={"taskId": tid}, timeout=30).json().get("data") or {})
            st = dd.get("state")
            if st == "success":
                urls = json.loads(dd.get("resultJson") or "{}").get("resultUrls") or []
                if urls:
                    open(dest, "wb").write(requests.get(urls[0], timeout=120).content)
                    with lock:
                        state[name] = {"file": name + ".png", "task": tid}
                        json.dump(state, open(STATE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
                    return "ok"
                return "empty"
            if st in ("fail", "failed"):
                print("FAIL", name, dd.get("failMsg"), flush=True); return "fail"
        except Exception:
            continue
    return "timeout"


q = queue.Queue()
for s in SCENES:
    q.put(s)
res = {}


def worker():
    while True:
        try: s = q.get_nowait()
        except queue.Empty: return
        r = run(*s)
        with lock:
            res[r] = res.get(r, 0) + 1
            print("  %-22s %s  (%s)" % (s[0], r, res), flush=True)

ths = [threading.Thread(target=worker, daemon=True) for _ in range(4)]
[t.start() for t in ths]; [t.join() for t in ths]
print("FERTIG", res)
