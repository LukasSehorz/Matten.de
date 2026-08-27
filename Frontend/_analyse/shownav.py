# -*- coding: utf-8 -*-
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
nav = json.load(open("nav.json", encoding="utf-8"))
for t in nav:
    print("== %s  ->  %s   (%d)" % (t["label"], t["href"], len(t["children"])))
    for c in t["children"]:
        print("     - %s  ->  %s" % (c["label"], c["href"]))
