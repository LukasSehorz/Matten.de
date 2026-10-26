# Bilder mit kie.ai (GPT Image 2.5) schärfen — Anleitung für die Agenten (24.10.2026)

Ordner: `Frontend/_arbeit/bilder-ki/` (hier liegen `kie_scharf.py` und `farbabgleich.py`).
Bilder-Wurzel: `Frontend/bridge-demo/public/net-neu/` (Pfade unten relativ dazu).

## Je Bild
1. Guthaben prüfen: `python3 kie_scharf.py --guthaben`. Liegt es unter deiner Untergrenze (steht in deinem Auftrag) → AUFHÖREN, nichts mehr senden, im Bericht vermerken.
2. Seitenverhältnis wählen, das dem Original am nächsten kommt: 512×340, 256×170, 150×100 → `3:2`; 120×120 → `1:1`; Hochformat 326×510 / 310×434 → `2:3`; 326×288 → `1:1`; 800×600 → `4:3`.
3. Schärfen, immer `--res 1K` (kostet ~6 Credits; 2K kostet 16 — nicht verwenden):
   `python3 kie_scharf.py "<wurzel>/<original>" "<arbeit>/<name>-roh.png" --ar <ar> --res 1K`
4. Farben zurückrechnen (Pflicht, GPT verschiebt Farben):
   `python3 farbabgleich.py "<wurzel>/<original>" "<arbeit>/<name>-roh.png" "<wurzel>/assets/img/ki/<ordner>/<name>.jpg"`
   (Standard: Ausrichten + glatter Farbabgleich je Kanal; gibt die Farbabweichung aus.)
5. Vergleich ansehen — PFLICHT, mit dem Read-Tool auf ein Bild nebeneinander (Original links vergrößert, Ergebnis rechts), z. B. mit Pillow erzeugen. Prüfe streng:
   - Gleiches Motiv, gleicher Ausschnitt, nichts hinzugefügt/entfernt/verschoben?
   - Schrift, Zahlen, Logos, Farbnummern identisch und lesbar (keine erfundenen Buchstaben)?
   - Farben wie im Original (Matten werden nach Farbe gekauft!)? Kein Farbstich?
   - Keine Artefakte (Flecken, Ränder, Schatten, Doppelkonturen, Verzerrung)?
   - Wirklich schärfer?
   Nur wenn ALLES passt: akzeptiert. Sonst Datei unter assets/img/ki/ wieder löschen und „verworfen" mit Grund. Höchstens EIN zweiter Versuch je Bild (z. B. anderes Seitenverhältnis), dann verwerfen.
6. Ein Bild, das es in zwei Größen gibt (gleicher Dateiname unter `produkte/` und `produkt-kacheln/` bzw. `kategorie-kacheln/`, gleiches Motiv): nur das größte schärfen; für die kleinere Fassung das geschärfte Bild verwenden (verkleinert/zugeschnitten auf das Seitenverhältnis der kleinen Fassung, gespeichert unter assets/img/ki/<ordner der kleinen>/<name>.jpg) — vorher per Blick bestätigen, dass es dasselbe Motiv ist.

## Regeln
- Arbeitsdateien (roh, Vergleiche) nur unter `/private/tmp/claude-501/-Users-lukas-sehorz-Library-CloudStorage-OneDrive-Pers-nlich-Desktop-Webseiten-Sale-Matten-de/553a10e9-f643-4925-93e3-b42c6463472a/scratchpad/ki-<dein-kürzel>/`.
- Ergebnisse NUR nach `public/net-neu/assets/img/ki/<ordner>/<name>.jpg` (Ordner wie das Original: produkte, produkt-kacheln, kategorie-kacheln, farbbilder, uploads, slides). Originale NIE überschreiben oder löschen.
- Keine anderen Dateien im Projekt ändern (kein daten.js, kein CSS, kein Generator). Nichts committen.
- Den API-Schlüssel nie ausgeben.
- Bericht als JSON-Liste nach `Frontend/_arbeit/bilder-ki/bericht-<dein-kürzel>.json`: je Bild `{"original": "...", "ki": "... oder null", "akzeptiert": true/false, "grund": "...", "farbabweichung": "vorher/nachher", "credits": n}`.
