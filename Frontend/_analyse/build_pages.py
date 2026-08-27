# -*- coding: utf-8 -*-
"""Erzeugt die Inhaltsseiten des Shops aus den Originaltexten von matten.de.

Die Texte werden 1:1 uebernommen, nur die Auszeichnung wird bereinigt
(Inline-Styles, Farben, leere Tags der Altseite entfallen).
"""
import os, re, sys, json, html
from bs4 import BeautifulSoup, NavigableString

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.abspath(__file__))
HTML_DIR = os.path.join(ROOT, "html")
SHOP = os.path.abspath(os.path.join(ROOT, ".."))
OUT = os.path.join(SHOP, "shop")

KEEP = {"p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "b", "em", "i", "br",
        "table", "thead", "tbody", "tr", "th", "td", "a", "blockquote"}
DROP = {"script", "style", "img", "form", "input", "select", "button", "iframe",
        "noscript", "nav", "svg"}


def clean_html(node, base_url="https://matten.de"):
    """Entfernt Inline-Styles und Altlasten, behaelt die Textstruktur."""
    for t in node.find_all(list(DROP)):
        t.decompose()
    for t in node.find_all(True):
        if t.name == "font":
            t.unwrap(); continue
        if t.name == "span":
            t.unwrap(); continue
        if t.name in ("div", "section"):
            t.unwrap(); continue
        if t.name not in KEEP:
            t.unwrap(); continue
        attrs = {}
        if t.name == "a":
            h = (t.get("href") or "").strip()
            if h.startswith("#") or not h:
                t.unwrap(); continue
            if h.startswith("/"):
                h = base_url + h
            attrs["href"] = h
            if h.startswith("http") and "matten.de" not in h:
                attrs["rel"] = "noopener"
                attrs["target"] = "_blank"
        t.attrs = attrs
    out = node.decode_contents()
    out = re.sub(r"<(p|li|h2|h3|h4)>\s*(&nbsp;|\s|<br\s*/?>)*\s*</\1>", "", out)
    out = re.sub(r"(<br\s*/?>\s*){3,}", "<br><br>", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    return out.strip()


def page_content(fname, selector=".kategorie_text"):
    path = os.path.join(HTML_DIR, fname)
    if not os.path.exists(path):
        return ""
    soup = BeautifulSoup(open(path, encoding="utf-8", errors="replace").read(), "html.parser")
    content = soup.find(id="content")
    if not content:
        return ""
    node = content.select_one(selector) or content
    for x in node.select(".breadcrumbs, .artikel_grid, .thumbnail, .more_info"):
        x.decompose()
    return clean_html(node)


TPL = """<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} – Mattenfuchs</title>
<meta name="description" content="{desc}">
<link rel="icon" href="assets/img/favicon.ico">
<link rel="stylesheet" href="assets/css/app.css">
<script src="assets/js/catalog.js"></script>
<script src="assets/js/site.js"></script>
</head>
<body>
<a class="skip-link" href="#main">Zum Inhalt springen</a>
<div id="site-header"></div>
<script>MF.mount();</script>

<main id="main">
  <div class="cat-head">
    <div class="container">
      <nav class="crumbs"><a href="index.html">Start</a><span>›</span>{crumb}</nav>
      <h1>{h1}</h1>
      {intro}
    </div>
  </div>
  <div class="container">
{body}
  </div>
</main>

<div id="site-footer"></div>
<script>MF.boot(); MF.initReveal(); MF.initFaq(document);</script>
{extra}
</body>
</html>
"""


def write(name, title, h1, desc, body, crumb=None, intro="", extra=""):
    out = TPL.format(title=title, h1=h1, desc=html.escape(desc, quote=True),
                     crumb=html.escape(crumb or title), body=body,
                     intro=('<p>%s</p>' % html.escape(intro)) if intro else "",
                     extra=extra)
    open(os.path.join(OUT, name), "w", encoding="utf-8").write(out)
    print("  %-24s %6d B" % (name, len(out)))


def prose(inner):
    return '    <div class="prose">\n' + inner + "\n    </div>"


print("Inhaltsseiten:")

# ---------------------------------------------------------------- Impressum
write("impressum.html", "Impressum", "Impressum",
      "Impressum der FUCHSIUS multi-media GmbH, Betreiberin des Mattenfuchs-Shops.",
      prose("""
      <h2>Angaben gemäß § 5 TMG</h2>
      <p><strong>FUCHSIUS multi-media GmbH</strong><br>
      vertreten durch Dipl.-Ing. FH Dieter Fuchsius<br>
      Fischerstrasse 2<br>
      D-85737 Ismaning</p>

      <h2>Kontakt</h2>
      <table>
        <tbody>
          <tr><th>Telefon</th><td><a href="tel:+498954558264">+49 89 54 55 82 64</a></td></tr>
          <tr><th>Telefax</th><td>+49 89 54 88 83 33</td></tr>
          <tr><th>Mobil</th><td><a href="tel:+491717755400">+49 171 77 55 400</a></td></tr>
          <tr><th>E-Mail</th><td><a href="mailto:info@matten.de">info@matten.de</a></td></tr>
          <tr><th>Internet</th><td>www.matten.de</td></tr>
        </tbody>
      </table>

      <h2>Registereintrag</h2>
      <p>Eingetragen im Handelsregister des Amtsgerichts München<br>
      Registernummer: HRB 161064</p>

      <h2>Umsatzsteuer-Identifikationsnummer</h2>
      <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br>
      DE 246 769 029</p>

      <h2>Haftung für Links</h2>
      <p>Für externe Links übernehmen wir keine Haftung. Für den Inhalt der verlinkten Seiten
      sind ausschließlich deren Betreiber verantwortlich.</p>

      <h2>Abmahnung</h2>
      <p>Abmahnungen akzeptieren wir nur nach vorheriger Kontaktaufnahme. Wir bitten Sie,
      uns bei Beanstandungen zunächst unter <a href="mailto:info@matten.de">info@matten.de</a>
      zu kontaktieren.</p>

      <h2>Streitschlichtung</h2>
      <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:
      <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.
      Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
      Verbraucherschlichtungsstelle teilzunehmen.</p>
      """))

# ---------------------------------------------------------------- Widerruf
write("widerruf.html", "Widerrufsrecht", "Widerrufsrecht",
      "Widerrufsbelehrung und Ausschluss des Widerrufsrechts bei Sonderanfertigungen.",
      prose("""
      <h2>Widerrufsrecht</h2>
      <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
      widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
      <p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Firmenname, Anschrift, E-Mail,
      ggf. Telefon) mittels einer eindeutigen Erklärung informieren. Zur Wahrung der
      Widerrufsfrist reicht es aus, dass Sie uns die Mitteilung über die Ausübung des
      Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>

      <h3>Widerruf richten an</h3>
      <p>FUCHSIUS multi-media GmbH<br>
      Fischerstrasse 2<br>
      D-85737 Ismaning<br>
      Telefon: <a href="tel:+498954558264">+49 89 54 55 82 64</a><br>
      Telefax: +49 89 54 88 83 33<br>
      E-Mail: <a href="mailto:info@matten.de">info@matten.de</a></p>

      <h2>Ausschluss des Widerrufsrechts</h2>
      <p>Bei den von uns angebotenen Produkten handelt es sich um Waren, die von uns
      konfektioniert und von unseren Vertragslieferanten individuell nach Ihren Vorgaben
      angefertigt werden. Gemäß <strong>§ 312g Abs. 2 Nummer 1 BGB</strong> besteht für solche
      Sonderanfertigungen kein Widerrufsrecht.</p>
      <p><strong>Ihr gesetzliches Recht auf Gewährleistung bei Mängeln bleibt davon
      unberührt.</strong></p>

      <h2>Folgen des Widerrufs</h2>
      <p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen
      erhalten haben, einschließlich der Lieferkosten, unverzüglich und spätestens binnen
      vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf
      dieses Vertrags bei uns eingegangen ist.</p>
      """))

# ---------------------------------------------------------------- Versand
write("versand.html", "Versand & Lieferung", "Versand &amp; Lieferung",
      "Versandkosten und Lieferbedingungen des Mattenfuchs-Shops.",
      prose("""
      <h2>Versandkosten innerhalb Deutschlands</h2>
      <table>
        <thead><tr><th>Bestellung</th><th>Versandkosten</th></tr></thead>
        <tbody>
          <tr><td>bis 1,8 m²</td><td><strong>5,00 Euro</strong> in Deutschland, ohne Inseln</td></tr>
          <tr><td>ab 1,8 m² bis 999,99 €</td><td><strong>10,00 Euro</strong> in Deutschland, ohne Inseln</td></tr>
          <tr><td>ab 1.000,00 €</td><td><strong>frachtfrei</strong></td></tr>
        </tbody>
      </table>
      <p>Die angegebenen Versandkosten gelten für Standard-Lieferadressen innerhalb
      Deutschlands. Inseln sind von der Standardregelung ausgenommen.</p>

      <h2>Lieferung außerhalb Deutschlands</h2>
      <p>Lieferungen nach Österreich, in die Schweiz und in weitere Länder sind möglich.
      Die Versandkosten kalkulieren wir für Ihre Sendung individuell — sprechen Sie uns an
      unter <a href="tel:+491717755400">+49 171 77 55 400</a> oder
      <a href="mailto:info@matten.de">info@matten.de</a>.</p>

      <h2>Fertigung und Lieferzeit</h2>
      <p>Nahezu alle Matten werden nach Ihren Angaben konfektioniert. Die Fertigungszeit hängt
      daher von Produkt, Größe und Gestaltung ab. Ihr individuelles Angebot enthält immer eine
      konkrete Terminaussage; Anfragen beantworten wir in der Regel innerhalb von 24 Stunden.</p>

      <h2>Sonderanfertigungen</h2>
      <p>Positionen mit Wunschmaß oder eigenem Motiv werden nicht sofort berechnet. Sie erhalten
      dafür ein verbindliches Angebot, bevor die Fertigung startet.</p>
      """))

# ---------------------------------------------------------------- Kontakt
write("kontakt.html", "Kontakt", "Kontakt &amp; Beratung",
      "Kontakt zum Mattenfuchs-Shop der FUCHSIUS multi-media GmbH in Ismaning bei München.",
      """    <div class="grid g-2" style="padding-block:40px 80px;align-items:start;gap:56px">
      <div class="prose" style="padding:0">
        <h2>Wir beraten Sie persönlich</h2>
        <p class="lead">Komplizierte bauliche Situation, exotisches Maß oder ein Logo, das exakt
        sitzen muss? Rufen Sie an — meist ist die Sache in fünf Minuten geklärt.</p>
        <table>
          <tbody>
            <tr><th>Telefon</th><td><a href="tel:+498954558264">+49 89 54 55 82 64</a></td></tr>
            <tr><th>Hotline / Mobil</th><td><a href="tel:+491717755400">+49 171 77 55 400</a></td></tr>
            <tr><th>Telefax</th><td>+49 89 54 88 83 33</td></tr>
            <tr><th>E-Mail</th><td><a href="mailto:info@matten.de">info@matten.de</a></td></tr>
            <tr><th>Anschrift</th><td>FUCHSIUS multi-media GmbH<br>Fischerstrasse 2<br>D-85737 Ismaning</td></tr>
          </tbody>
        </table>
        <h3>Was wir für ein Angebot brauchen</h3>
        <ul>
          <li>Maße in cm (Breite × Länge) oder eine Skizze</li>
          <li>Einsatzort: innen, außen, Nasszone, Arbeitsplatz</li>
          <li>Gewünschtes Material bzw. Produktlinie</li>
          <li>Bei Logomatten: Ihre Vorlage als Vektordatei oder hochauflösende Grafik</li>
          <li>Ob die Matte lose liegt oder in einen Rahmen eingelassen wird</li>
        </ul>
      </div>
      <form class="summary" style="position:static" id="anfrage" novalidate>
        <h2>Angebot anfordern</h2>
        <div class="field"><label for="k_firma">Firma</label><input id="k_firma"></div>
        <div class="field--2">
          <div class="field"><label for="k_name">Name *</label><input id="k_name" required></div>
          <div class="field"><label for="k_tel">Telefon</label><input id="k_tel" type="tel"></div>
        </div>
        <div class="field"><label for="k_mail">E-Mail *</label><input id="k_mail" type="email" required></div>
        <div class="field--2">
          <div class="field"><label for="k_breite">Breite in cm</label><input id="k_breite" type="number"></div>
          <div class="field"><label for="k_laenge">Länge in cm</label><input id="k_laenge" type="number"></div>
        </div>
        <div class="field"><label for="k_produkt">Produkt / Interesse</label>
          <input id="k_produkt" placeholder="z. B. Logomatte JetPrint"></div>
        <div class="field"><label for="k_text">Ihre Nachricht</label>
          <textarea id="k_text" placeholder="Einsatzort, Motiv, Termin …"></textarea></div>
        <label class="filter-opt" style="align-items:flex-start;gap:10px">
          <input type="checkbox" id="k_dsgvo" style="margin-top:4px">
          <span style="font-size:13.5px">Ich habe die <a href="datenschutz.html">Datenschutzerklärung</a>
          gelesen und bin mit der Verarbeitung meiner Angaben zur Bearbeitung der Anfrage einverstanden.</span>
        </label>
        <button class="btn btn--lg btn--block" type="submit" style="margin-top:16px">Anfrage senden</button>
        <p class="summary__note">Demo-Formular — es wird nichts versendet.</p>
      </form>
    </div>""",
      extra="""<script>
(function(){
  var f = document.getElementById('anfrage');
  var art = MF.qs('artikel');
  if (art) document.getElementById('k_produkt').value = art;
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var miss = ['k_name','k_mail'].filter(function(id){ return !document.getElementById(id).value.trim(); });
    if (miss.length) { MF.toast('Bitte Name und E-Mail angeben.'); document.getElementById(miss[0]).focus(); return; }
    if (!document.getElementById('k_dsgvo').checked) { MF.toast('Bitte der Datenschutzerklärung zustimmen.'); return; }
    f.innerHTML = '<h2>Danke für Ihre Anfrage!</h2>' +
      '<p>In der echten Version ginge Ihre Anfrage jetzt an info@matten.de. ' +
      'Antwort erhalten Sie in der Regel innerhalb von 24 Stunden.</p>' +
      '<p class="summary__note">Demo-Formular — es wurde nichts versendet.</p>' +
      '<a class="btn btn--block" href="kategorie.html">Weiter zum Sortiment</a>';
    window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  });
})();
</script>""")

# ---------------------------------------------------------------- Konto
write("konto.html", "Mein Konto", "Mein Konto",
      "Kundenkonto im Mattenfuchs-Shop.",
      """    <div class="grid g-2" style="padding-block:40px 80px;gap:56px;align-items:start;max-width:920px">
      <form class="summary" style="position:static">
        <h2>Anmelden</h2>
        <div class="field"><label for="l_mail">E-Mail</label><input id="l_mail" type="email"></div>
        <div class="field"><label for="l_pw">Passwort</label><input id="l_pw" type="password"></div>
        <button class="btn btn--block" type="button" onclick="MF.toast('Demo — es gibt kein Backend.')">Einloggen</button>
        <p class="summary__note">Passwort vergessen? In der echten Version folgt hier der
        Zurücksetzen-Link.</p>
      </form>
      <div class="prose" style="padding:0">
        <h2>Noch kein Kundenkonto?</h2>
        <p>Mit einem Kundenkonto sehen Sie frühere Bestellungen, wiederholen Nachbestellungen
        mit denselben Maßen und hinterlegen abweichende Lieferadressen.</p>
        <ul>
          <li>Bestellhistorie mit allen Maßen und Farben</li>
          <li>Nachbestellung identischer Matten mit einem Klick</li>
          <li>Mehrere Lieferadressen für Filialen und Objekte</li>
          <li>Angebote und Auftragsbestätigungen als PDF</li>
        </ul>
        <p><button class="btn btn--ghost" type="button"
           onclick="MF.toast('Demo — Registrierung ohne Backend nicht möglich.')">Konto anlegen</button></p>
        <div class="demo-note" style="margin-top:24px">
          <div><b>Hinweis zur Demo</b>Diese Seite zeigt nur, wo das Kundenkonto sitzt.
          Es gibt in dieser Vorschau kein Backend und keine Datenspeicherung.</div>
        </div>
      </div>
    </div>""")

print("Fertig.")
