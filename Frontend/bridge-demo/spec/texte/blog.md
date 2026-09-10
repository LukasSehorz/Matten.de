# Blog
Quelle: https://www.matten.net/de/blog  ·  erfasst am 2026-08-31

`<title>` der Seite: `Mattenfuchs` (generischer Standardtitel) · Meta-Description: `Matten.de e-commerce`

## Aufbau

Einfache Beitragsliste, kein Kopfbild/Jumbotron, keine Seitenleiste, keine Kategorien/Tags, **keine Paginierung**.

1. `<div style="min-height: 500px;">`
2. `<div class="container padding-top">`
3. Pro Beitrag ein `<article>`, direkt untereinander (keine Karten, kein Grid, kein Vorschaubild):
   - `<h2>` — Beitragstitel (kein `<h1>` auf der Seite außer dem Logo im Seitenkopf)
   - `<small><em>` — Datum + Uhrzeit, **englisch formatiert**, z. B. `February 1, 2019 08:06`
   - Auszug: der Beitragstext als `<p>`-Absätze (offenbar der komplette Beitrag, nicht gekürzt)
   - `<p><a href="/de/blog/<slug>">Continue reading</a></p>` — Weiterlesen-Link, **englisch beschriftet**
4. Danach das Newsletter-Widget (Seitenrahmen)

Reihenfolge auf der Übersicht: **nicht** nach Datum sortiert (Februar 2019 steht vor August 2019).

### Einzelbeitragsseite `/de/blog/<slug>`

Identischer Aufbau, aber nur **ein** `<article>`, ohne den „Continue reading“-Link:

1. `<div style="min-height: 500px;">` → `<div class="container padding-top">` → `<article>`
2. `<h2>` Titel · `<small><em>` Datum · `<p>`-Absätze
3. Newsletter-Widget

Es gibt keine Navigation „vorheriger/nächster Beitrag“, keinen Autor, keine Kommentare, kein Beitragsbild.

## Inhalt

Es gibt **insgesamt 2 Blogbeiträge**.

### 1. FUCHSIUS multi-media GmbH

- URL: https://www.matten.net/de/blog/der-mattenfuchs
- Datum (wörtlich): *February 1, 2019 08:06*
- Auszug auf der Übersicht = vollständiger Beitragstext:

> Seit mehr als 35 Jahren liefern wir Fussmatten in einer Vielzahl von Standardmaßen und nahezu beliebigen Wunschmaßen in mehr als 100 verschiedenen Farben, einfarbig und individuell nach Kundenwunsch gestaltet.
>
> Wir haben in dieser Zeit weltweit in vielen namhaften Firmen, Top-Handelshäusern und Filialunternehmen, Hotels, Verwaltungen, Ladengeschäften und Privathaushalten für saubere Eingangsbereiche und den Schutz der angrenzenden Böden gesorgt.
>
> Unsere Angebotspalette ist in den zurückliegenden Jahren stetig gewachsen und wurde den permanent steigenden Anforderungen laufend angepasst. So haben wir für jedes Schmutzproblem -und auch für die passende Werbung für Ihr Haus- immer eine hervorragende Lösung parat. "NICHTS"  gibt es **nicht** bei uns.
>
> Wir sind stets für Sie unter "info@matten.de" erreichbar und freuen uns über Ihre Anfrage.
>
> Ihr Mattenfuchs-Team

Auffällig: Der Titel des Beitrags ist der Firmenname, der Slug lautet aber `der-mattenfuchs`. Im Text steht die Adresse `info@matten.de` (alte Domain), während das Impressum `info@matten.net` nennt.

### 2. Eine neue Mattengeneration

- URL: https://www.matten.net/de/blog/eine-neue-mattengeneration
- Datum (wörtlich): *August 17, 2019 09:05*
- Auszug auf der Übersicht = vollständiger Beitragstext:

> Matten mit fotorealistischer Gestaltung.
>
> Als Vorlage genügt eine Foto und Ihre Wunschgrößen-Angabe

Auffällig: Tippfehler „eine Foto“ statt „ein Foto“; der Beitrag besteht aus zwei Zeilen ohne Bild — wirkt wie ein Platzhalter.
