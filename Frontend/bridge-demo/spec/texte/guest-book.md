# Gästebuch (guest-book)
Quelle: https://www.matten.net/de/guest-book  ·  erfasst am 2026-08-31

`<title>` der Seite: `Mattenfuchs` (generischer Standardtitel) · Meta-Description: `Matten.de e-commerce`

## Aufbau

**Die Seite ist leer.** Sie liefert HTTP 200, aber der komplette Inhaltsbereich zwischen Navigation und Footer besteht nur aus zwei leeren Containern:

```html
<div style="min-height: 500px;">
    <div class="container">
    </div>
</div>
```

Danach folgt direkt das Newsletter-Widget des Seitenrahmens.

Konkret bedeutet das für den Inhaltsbereich:

- **keine Überschrift** (kein `<h1>`, kein `<h2>`) — das einzige `<h1>` der Seite ist das Logo im Seitenkopf, die einzigen weiteren Überschriften (`Find us`, `Information`, `Kontakt`) stehen im Footer
- **kein Eintragsformular** — keine Felder für Name, Ort, E-Mail, Nachricht, kein Absende-Knopf, kein CSRF-Token
- **keine Eintragsliste** — weder Tabelle noch Karten noch `<article>`-Blöcke
- **keine Sortierung, keine Filter, keine Paginierung**
- keine Bilder, keine Texte

## Inhalt

**Anzahl der Gästebuch-Einträge: 0** (es wird überhaupt nichts gerendert).

Es sind folglich auch **keine personenbezogenen Daten** auf der Seite vorhanden.

## Bewertung

Die Route `/de/guest-book` existiert und ist im Seitenrahmen verlinkt, das Template rendert aber nichts.
Entweder ist das Feature nie fertiggestellt worden oder es wurde inhaltlich deaktiviert. Für eine
Nachbildung im neuen Frontend gibt es hier **keine übernehmbare Struktur** — Formularfelder,
Spaltenaufteilung, Sortierung und Paginierung müssten neu definiert werden.
