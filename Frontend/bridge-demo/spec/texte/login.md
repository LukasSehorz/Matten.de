# Login
Quelle: https://www.matten.net/de/login  ·  erfasst am 2026-08-31

`<title>` der Seite: `Mattenfuchs` (generischer Standardtitel) · Meta-Description: `Matten.de e-commerce`

## Aufbau

Schmale Formularseite, kein Kopfbild/Jumbotron, keine Seitenleiste.

1. `<div style="min-height: 500px;">`
2. `<div class="container">`
3. **Überschrift**: `<h2 class="padding-top">Login</h2>` — kein `<h1>` im Inhaltsbereich
4. **Hinweis-Absatz** `<p>` mit zwei Links (durch `<br>` getrennt):
   - Text „Haben Sie ein Konto?“ + Link „Klick hier zur Registrierung.“ → `/de/account/register`
   - Text „Passwort vergessen?“ + Link „Klick hier zum Reset.“ → `/de/account/password-reset-request`
5. **Formular** `<form action="/de/login" method="post" style="max-width: 400px;">`
   (kein `name`-Attribut, **kein CSRF-Token im Markup**)
   - `div.form-group`: Label „eMail“ → Eingabefeld
   - `div.form-group`: Label „Passwort“ → Eingabefeld
   - `div.custom-control.custom-checkbox`: Checkbox + Label „mich erinnern“
   - `<br>`
   - Absende-Knopf
6. Danach das Newsletter-Widget (Seitenrahmen)

Keine Tabellen, keine Bilder, keine Paginierung.

## Inhalt

### Texte (wörtlich)

| Element | Text |
|---|---|
| `h2` | Login |
| Absatz | Haben Sie ein Konto? |
| Link 1 | Klick hier zur Registrierung. |
| Absatz | Passwort vergessen? |
| Link 2 | Klick hier zum Reset. |
| Knopf | Login |

Auffällig: Die Zeile „Haben Sie ein Konto?“ steht **vor** dem Registrierungslink — inhaltlich müsste es
„Haben Sie noch kein Konto?“ heißen. Auf `/de/account/register` steht spiegelbildlich korrekt
„Haben Sie schon ein Konto?“.

### Formularfelder

| Reihenfolge | Label | `name` | `id` | Typ | Placeholder | Pflichtfeld |
|---|---|---|---|---|---|---|
| 1 | eMail | `_username` | `form-full-name` | `text` | `eMail-Adresse eingeben` | ja (`required`) |
| 2 | Passwort | `_password` | `form-password` | `password` | `Passwort eingeben` | ja (`required`) |
| 3 | mich erinnern | `_remember_me` | `form-remember-me` | `checkbox` | – | nein |

Anmerkungen:
- Das E-Mail-Feld ist `type="text"` (nicht `type="email"`), hat den Wert `value=""` und die
  irreführende `id="form-full-name"`.
- Die `name`-Attribute `_username` / `_password` / `_remember_me` sind die Symfony-Security-Standardnamen.
- Kein `_csrf_token`-Hidden-Feld im ausgelieferten HTML.
- Kein Auswahlfeld (`<select>`) auf dieser Seite.

### Knöpfe

- Absende-Knopf: `<button type="submit" class="btn btn-primary">` mit Icon `<i class="fa fa-sign-in-alt">` und Beschriftung **Login**

### Verlinkte Folgeseiten

- `/de/account/register` (Registrierung)
- `/de/account/password-reset-request` (Passwort zurücksetzen)
