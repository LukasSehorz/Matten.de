# Registrieren
Quelle: https://www.matten.net/de/account/register  ·  erfasst am 2026-08-31

`<title>` der Seite: `Mattenfuchs` (generischer Standardtitel) · Meta-Description: `Matten.de e-commerce`

## Aufbau

Formularseite über die volle Containerbreite, kein Kopfbild/Jumbotron.

1. `<div style="min-height: 500px;">`
2. `<div class="container">`
3. **Überschrift**: `<h1 class="padding-top">Registrieren</h1>`
   (hier tatsächlich `h1` — im Gegensatz zu Login/AGB/Impressum, die `h2` verwenden;
   damit hat die Seite zwei `h1`: Logo im Seitenkopf + diese Überschrift)
4. **Hinweis-Absatz** `<p>`: „Haben Sie schon ein Konto?“ + Link „Klick hier zum Login.“ → `/de/login`
5. **Formular** `<form name="user_registration" method="post">`
   (kein `action`-Attribut → Absenden an dieselbe URL; Symfony-Formular mit CSRF-Token)
   - `div.row` mit zwei Spalten `div.col-md-6`
     - **linke Spalte**: Zugangsdaten + Person/Firma (7 Felder)
     - **rechte Spalte**: Anschrift + Kontakt (8 Felder)
   - `<hr>`
   - Absende-Knopf
   - Hidden-Feld `user_registration[_token]` (CSRF)
6. Danach das Newsletter-Widget (Seitenrahmen)

Jedes Feld steckt in `<div class="form-group">` mit `<label>` (Pflichtfelder tragen `class="required"`)
und `<input class="form-control">` bzw. `<select class="form-control">`.
Es gibt **keine Platzhalter** (`placeholder`) und **keine Hilfetexte** auf dieser Seite.

Keine Tabellen, keine Bilder, keine Paginierung.

## Inhalt

### Texte (wörtlich)

| Element | Text |
|---|---|
| `h1` | Registrieren |
| Absatz | Haben Sie schon ein Konto? |
| Link | Klick hier zum Login. |
| Knopf | versenden |

### Formularfelder — linke Spalte (`col-md-6`)

| # | Label | `name` | `id` | Typ | Pflicht |
|---|---|---|---|---|---|
| 1 | eMail | `user_registration[email]` | `user_registration_email` | `email` | ja |
| 2 | Passwort | `user_registration[plainPassword]` | `user_registration_plainPassword` | `password` | ja |
| 3 | Anrede | `user_registration[customer][title]` | `user_registration_customer_title` | `text` | ja |
| 4 | Vorname | `user_registration[customer][firstName]` | `user_registration_customer_firstName` | `text` | nein |
| 5 | Nachname | `user_registration[customer][lastName]` | `user_registration_customer_lastName` | `text` | ja |
| 6 | Firmenname | `user_registration[customer][companyName]` | `user_registration_customer_companyName` | `text` | nein |
| 7 | USt-ID | `user_registration[customer][taxId]` | `user_registration_customer_taxId` | `text` | nein |

### Formularfelder — rechte Spalte (`col-md-6`)

| # | Label | `name` | `id` | Typ | Pflicht |
|---|---|---|---|---|---|
| 8 | Straße | `user_registration[customer][streetAddress]` | `user_registration_customer_streetAddress` | `text` | ja |
| 9 | Stadt | `user_registration[customer][city]` | `user_registration_customer_city` | `text` | ja |
| 10 | Bundesland | `user_registration[customer][state]` | `user_registration_customer_state` | `text` | ja |
| 11 | PLZ | `user_registration[customer][postalCode]` | `user_registration_customer_postalCode` | `text` | ja |
| 12 | Land | `user_registration[customer][country]` | `user_registration_customer_country` | `select` | Label `required`, das `<select>` selbst hat **kein** `required` |
| 13 | Telefon | `user_registration[customer][phone]` | `user_registration_customer_phone` | `text` | ja |
| 14 | Mobil | `user_registration[customer][mobile]` | `user_registration_customer_mobile` | `text` | ja |
| 15 | Fax | `user_registration[customer][fax]` | `user_registration_customer_fax` | `text` | nein |

### Verstecktes Feld

| Label | `name` | `id` | Typ |
|---|---|---|---|
| – | `user_registration[_token]` | `user_registration__token` | `hidden` (CSRF-Token, wechselt pro Aufruf) |

### Auswahlfeld „Land“

- `<select id="user_registration_customer_country" name="user_registration[customer][country]" class="form-control">`
- **249 Optionen**, deutsche Länderbezeichnungen, alphabetisch sortiert, `value` = ISO-3166-1-Alpha-2-Code
- **Vorausgewählt**: `<option value="DE" selected="selected">Deutschland</option>`
- Keine leere Erstoption / kein „Bitte wählen“
- Anfang der Liste: Afghanistan (AF), Ägypten (EG), Ålandinseln (AX), Albanien (AL), Algerien (DZ),
  Amerikanisch-Samoa (AS), Amerikanische Jungferninseln (VI), Amerikanische Überseeinseln (UM),
  Andorra (AD), Angola (AO), Anguilla (AI), Antarktis (AQ), Antigua und Barbuda (AG), …
- Ende der Liste: … Vereinigte Arabische Emirate (AE), Vereinigte Staaten (US), Vereinigtes Königreich (GB),
  Vietnam (VN), Wallis und Futuna (WF), Weihnachtsinsel (CX), Westsahara (EH),
  Zentralafrikanische Republik (CF), Zypern (CY)

### Knopf

- `<button type="submit" class="btn btn-primary">` mit der Beschriftung **versenden** (klein geschrieben, kein Icon)

## Auffälligkeiten

- **„Anrede“ ist ein freies Textfeld** (`type="text"`, Pflicht) statt eines Auswahlfelds Herr/Frau/Firma.
- **„Bundesland“ ist Pflichtfeld** und ein freies Textfeld — für deutsche Privatkunden unüblich.
- **„Telefon“ und „Mobil“ sind beide Pflicht**, „Vorname“ dagegen **nicht**.
- Kein Feld „Passwort wiederholen“, keine Passwortregeln, keine Passwortstärke-Anzeige.
- **Keine AGB-/Datenschutz-Checkbox**, kein Newsletter-Opt-in, kein Captcha — DSGVO-/UWG-seitig unfertig.
- Kein `placeholder`, keine Fehlermeldungsbereiche im Ausgangszustand.
- Knopfbeschriftung „versenden“ statt z. B. „Konto anlegen“ / „Registrieren“.
