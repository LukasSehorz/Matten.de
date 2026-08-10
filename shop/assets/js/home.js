/* Startseite — dynamische Bereiche */
(function () {
  "use strict";
  var C = window.CATALOG;

  /* ---------- Icons in Platzhalter setzen ------------------------------- */
  function paintIcons() {
    document.querySelectorAll("[data-ico]").forEach(function (el) {
      if (el.querySelector("svg")) return;
      var big = el.classList.contains("why__ico") || el.classList.contains("usp__ico");
      el.innerHTML = MF.icon(el.dataset.ico, big ? "ico--lg" : "");
    });
    var ph = document.querySelector("[data-ico-before]");
    if (ph && !ph.querySelector("svg")) {
      ph.insertAdjacentHTML("afterbegin", MF.icon(ph.dataset.icoBefore));
    }
  }

  /* ---------- Hero-Wechsel ---------------------------------------------- */
  var HERO = [
    { t: "Matten nach Maß.<br>Individuell, werbewirksam, sauber.",
      p: "Beliebige Maße bis 200 cm Breite und 7 m Länge, über 100 Farben, Druck bis 32-farbig — konfektioniert für Ihren Eingang." },
    { t: "Ihr Logo.<br>Bis 32-farbig gedruckt.",
      p: "JetPrint™, Chromojet™ und Beflockung: Werbematten, die den ersten Eindruck übernehmen — fotorealistisch und waschbar." },
    { t: "Eingangssysteme<br>aus Aluminium.",
      p: "Diplomat, Marschall und Premium — mit Rips, Bürste, Gummi oder Cassette, bündig eingelassen im Bodenrahmen." }
  ];
  function initHero() {
    var slides = [].slice.call(document.querySelectorAll(".hero__slide"));
    var dots = [].slice.call(document.querySelectorAll(".hero__dot"));
    var title = document.querySelector("[data-hero-title]");
    var text = document.querySelector("[data-hero-text]");
    if (!slides.length) return;
    var i = 0, timer;
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === i); });
      if (title) title.innerHTML = HERO[i].t;
      if (text) text.textContent = HERO[i].p;
    }
    function play() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      clearInterval(timer);
      timer = setInterval(function () { go(i + 1); }, 7000);
    }
    dots.forEach(function (d, k) {
      d.addEventListener("click", function () { go(k); play(); });
    });
    go(0); play();
  }

  /* ---------- Kategorie-Schnellwahl ------------------------------------- */
  var QUICK = [
    ["Aluprofil&shy;matten", "kategorie.html?cat=aluminium_profilmatten", "hero-alu"],
    ["Rahmen &amp; Zubehör", "kategorie.html?cat=aluminium_profilmatten&sub=rahmen_und_zubehoer", "hero-alu"],
    ["Logomatten", "kategorie.html?cat=logomatten", "kachel-logo"],
    ["Sauberlauf&shy;matten", "kategorie.html?cat=fussmatten&sub=standard-schmutzfangmatten", "kachel-innen"],
    ["Kokosmatten", "kategorie.html?cat=kokosmatten", "kachel-kokos"],
    ["Bierbank&shy;auflagen", "kategorie.html?cat=logomatten&sub=bierbankmatten", "projekt-hotel"],
    ["REHA &amp; Training", "kategorie.html?cat=logomatten&sub=os-physio-rehab-matten", "projekt-praxis"],
    ["Arbeitsplatz&shy;matten", "kategorie.html?cat=gummi_und_kunststoffmatten", "projekt-industrie"],
    ["Außenbereich", "kategorie.html?cat=fussmatten&sub=matten_fuer_aussenbereiche", "kachel-aussen"]
  ];
  function pickImg(q) {
    var url = new URL(q[1], location.href);
    var cat = url.searchParams.get("cat"), sub = url.searchParams.get("sub");
    var pool = C.products.filter(function (p) {
      return p.image && p.cat === cat && (!sub || p.sub === sub);
    });
    if (pool.length) return MF.root + pool[0].image;
    return "assets/img/szenen/" + q[2] + ".png";
  }
  function initQuick() {
    var el = document.querySelector("[data-quicknav]");
    if (!el) return;
    el.innerHTML = QUICK.map(function (q) {
      return '<a href="' + q[1] + '"><img src="' + pickImg(q) + '" alt="" loading="lazy">' +
        "<span>" + q[0] + "</span></a>";
    }).join("");
  }

  /* ---------- Topseller -------------------------------------------------- */
  function initTopseller() {
    var el = document.querySelector("[data-topseller]");
    if (!el) return;
    var pool = C.products.filter(function (p) { return p.image && p.badge === "Topseller"; });
    var extra = C.products.filter(function (p) {
      return p.image && p.badge !== "Topseller" && p.colors.length > 3;
    });
    var list = pool.concat(extra).slice(0, 10);
    if (list.length < 6) {
      list = list.concat(C.products.filter(function (p) { return p.image && list.indexOf(p) < 0; })).slice(0, 10);
    }
    el.innerHTML = list.map(MF.card).join("");
    var sl = el.closest("[data-slider]");
    if (sl) MF.initSlider(sl);
  }

  /* ---------- Kundenstimmen (echte Gästebuch-Einträge von matten.de) ----- */
  var STIMMEN = [
    ["Martin Schwartz", "14.02.2025",
     "Gute Beratung, gerade bei komplizierten baulichen Konstellationen oder Sonderwünschen in puncto Handhabung und Haltbarkeit. Und der guten Qualität entsprechend faire Preise."],
    ["Stephanie Raudies", "21.07.2021",
     "Vielen Dank für den tollen Service! Die Aluminium-Profil-Fußmatte wurde meinen Wünschen (Materialkombination, Farbe und Größe) entsprechend angefertigt und schnell versandt und übertraf meine Erwartungen!"],
    ["EUROVIA Teerbau GmbH", "18.06.2020",
     "Ein Unternehmen, in dem man noch weiß, was Dienstleistung heißt. Das ist der Firma Mattenfuchs-Shop super gut gelungen."],
    ["Gabriele", "21.05.2023",
     "Sehr guter persönlicher Service, hervorragende Qualität, Preis-Leistungs-Verhältnis ist top. Immer wieder zu empfehlen. Danke!"],
    ["Thomas Hendricks, Physiokonzepte München", "08.06.2022",
     "Toller Service, beste Qualität und schnelle Lieferung."],
    ["Manuel D.", "01.07.2021",
     "Suchte eine Fußmatte für einen eingelassenen Einbaurahmen mit exotischen Maßen. Bei Mattenfuchs gar kein Problem: Größe und Dicke passen perfekt!"],
    ["Beate Flake", "29.04.2021",
     "Unsere Matte für die Terrasse sollte ein ausgefallenes Maß haben. Diese Firma hat uns vom ersten Auftritt an eines Besseren belehrt!"],
    ["Hans Peter Schlosser", "12.07.2021",
     "Hab seit Langem eine Matte für meinen Hauseingang gesucht, nie das Richtige gefunden. Doch bei matten.de war ich hoch zufrieden: Sie lieferten die Matte genau nach meinen Angaben und sehr schnell."],
    ["Johannes Meyer", "13.05.2021",
     "Tolle Beratung, absolut fachkundig und freundlich. Unkomplizierte Abwicklung, gute und schnelle Fertigung und Lieferung."],
    ["Physio Schmitt", "28.03.2020",
     "Vielen Dank für die gute Beratung und den kompletten, kompetenten Service — eine super Matte, wertet den Trainingsbereich auf."],
    ["Herbert Meixner", "12.06.2021",
     "Klaglose Abwicklung! Absolute Weiterempfehlung! Besonders positiv aufgefallen: die vielen informativen Erläuterungen."],
    ["S. Meyer", "27.07.2020",
     "Wir haben eine Matte aus Kokosvelour bei dieser Firma bestellt. Wir sind sehr zufrieden mit der Abwicklung und mit der Qualität der Ware."],
    ["Thomas Friedrich", "04.12.2021",
     "Von der Bestellung über die Herstellung bis zur Lieferung alles prima gelaufen. Die Ausführung bzw. Qualität der Fußmatte ist hervorragend."],
    ["Karin B.", "29.12.2020",
     "Wir wollten eine große, farbige Fußmatte nach Maß für unseren Flur als Schmutzfang. Dank guter Beratung erhalten wir ein hochwertiges Produkt zu gutem Preis."],
    ["Jörg Sperling", "30.06.2020",
     "Der Kontakt mit dem Mattenfuchs war nett und problemlos: gute Beratung und einwandfreie Lieferung. Eine klare Empfehlung!"],
    ["R. Möller", "10.07.2020",
     "Ein überaus freundlicher Kontakt bei einer Rückfrage, unkomplizierte und schnelle Abwicklung und eine passgenaue und sehr gute Ware."],
    ["Peter Resch", "09.07.2021",
     "Ich kenne mich mit dem Thema Fußmatten nicht aus, deswegen erwarte ich eine informative Webseite. All das habe ich hier bekommen."],
    ["Templin", "03.04.2021",
     "Sehr fachkundige und freundliche Beratung, schnelle Fertigung und Lieferung. Sehr guter Service, vielen Dank dafür."],
    ["Bernhard Greshake", "02.10.2020", "Hervorragender Service und schnelle Lieferung!"],
    ["Bojic", "26.05.2019",
     "Beide Bestellungen wurden schnell und zuverlässig ausgeführt. Tolle Kommunikation und hochwertige Warenqualität. Vielen Dank!"]
  ];
  window.MF_STIMMEN = STIMMEN;

  function quoteHTML(s) {
    return '<figure class="quote reveal">' +
      '<div class="stars">' + Array(5).join(MF.icon("star")) + MF.icon("star") + "</div>" +
      "<blockquote><p>„" + MF.esc(s[2]) + "“</p></blockquote>" +
      '<figcaption class="quote__by"><b>' + MF.esc(s[0]) + "</b><span>Gästebuch-Eintrag vom " +
      MF.esc(s[1]) + "</span></figcaption></figure>";
  }
  window.MF_quoteHTML = quoteHTML;

  function initQuotes() {
    var el = document.querySelector("[data-quotes]");
    if (!el) return;
    el.innerHTML = STIMMEN.slice(0, 3).map(quoteHTML).join("");
  }

  /* ---------- Projekte --------------------------------------------------- */
  var PROJEKTE = [
    ["projekt-hotel", "Hotellerie & Empfang",
     "Lange Läufer und Logomatten im Eingang — repräsentativ und trotzdem waschbar.",
     "kategorie.html?cat=logomatten"],
    ["projekt-praxis", "Praxis, Reha & Training",
     "OS-Physio-Matten mit Funktionsdesign, auf Wunsch mit Ihrem Praxislogo.",
     "kategorie.html?cat=logomatten&sub=os-physio-rehab-matten"],
    ["projekt-industrie", "Industrie & Arbeitsplatz",
     "Anti-Ermüdungsmatten und Bodenschutz für Werkbank, Kasse und Montagelinie.",
     "kategorie.html?cat=gummi_und_kunststoffmatten"]
  ];
  function initProjects() {
    var el = document.querySelector("[data-projects]");
    if (!el) return;
    el.innerHTML = PROJEKTE.map(function (p) {
      return '<a class="mag reveal" href="' + p[3] + '">' +
        '<img src="assets/img/szenen/' + p[0] + '.png" alt="" loading="lazy">' +
        '<span class="mag__tag">Einsatzbereich</span>' +
        "<h3>" + MF.esc(p[1]) + "</h3><p>" + MF.esc(p[2]) + "</p></a>";
    }).join("");
  }

  /* ---------- Wissen ----------------------------------------------------- */
  var MAGAZIN = [
    ["Technische Daten", "Welche Matte hält was aus?",
     "JetPrint, MONOTON, IRON-HORSE und Kokos im direkten Vergleich — Material, Höhe, Waschbarkeit.",
     "technik.html", "kachel-innen"],
    ["Farben", "Über 100 Farben zur Auswahl",
     "66 JetPrint-Druckfarben, 11 durchgefärbte MONOTON-Farben und 14 Design-Farben für Kokos.",
     "farben.html", "kachel-logo"],
    ["Planung", "Matten in Bodenvertiefungen",
     "Wann sich ein Aluminium-Profilsystem im Rahmen lohnt und worauf beim Aufmaß zu achten ist.",
     "technik.html#einbau", "hero-alu"],
    ["Pflege", "Edelstahlrahmen richtig pflegen",
     "Grundreinigung, Unterhaltsreinigung und welche Reinigungsmittel Sie keinesfalls verwenden dürfen.",
     "service.html", "schritt-4-produktion"]
  ];
  function initMagazin() {
    var el = document.querySelector("[data-magazin]");
    if (!el) return;
    el.innerHTML = MAGAZIN.map(function (m) {
      return '<a class="mag reveal" href="' + m[3] + '">' +
        '<img src="assets/img/szenen/' + m[4] + '.png" alt="" loading="lazy">' +
        '<span class="mag__tag">' + MF.esc(m[0]) + "</span>" +
        "<h3>" + MF.esc(m[1]) + "</h3><p>" + MF.esc(m[2]) + "</p></a>";
    }).join("");
  }

  /* ---------- FAQ (Inhalte 1:1 aus matten.de) ---------------------------- */
  var FAQ = [
    ["Was kostet der Versand?",
     "<p>Innerhalb Deutschlands (ohne Inseln) gilt:</p><ul>" +
     "<li>Bestellungen bis 1,8 m²: <b>5,00 €</b></li>" +
     "<li>Bestellungen ab 1,8 m² bis 999,99 €: <b>10,00 €</b></li>" +
     "<li>Ab einem Bestellwert von 1.000,00 €: <b>frachtfrei</b></li></ul>" +
     '<p><a href="versand.html">Alle Versandinformationen</a></p>'],
    ["Kann ich jede beliebige Größe bestellen?",
     "<p>Ja. Die Matten werden konfektioniert — beliebige Maße, beliebige Formen, auch " +
     "schiefwinklige Maße und Zuschnitte nach Schablonen oder Vorlagen. Möglich sind Breiten " +
     "bis 200 cm und Längen bis 700 cm; bei Kokos sind auch Überbreiten machbar.</p>"],
    ["Wie viele Farben stehen zur Auswahl?",
     "<p>Bei der JetPrint-Technik können Sie aus derzeit <b>66 Farben</b> wählen. MONOTON-Matten " +
     "gibt es in 11 durchgefärbten Farben mit 11 Jahren Farbgarantie, IRON-HORSE in " +
     "melierten Ausführungen. Für Kokos-Beflockung stehen 14 Designfarben bereit.</p>" +
     '<p><a href="farben.html">Zu den Farbpaletten</a></p>'],
    ["Welche Garantie gibt es?",
     "<p>Auf JetPrint-Matten gewähren wir <b>5 Jahre Garantie</b>. Auf durchgefärbte Qualitäten " +
     "wie MONOTON und IRON-HORSE gilt eine <b>Farbgarantie von 11 Jahren</b>.</p>"],
    ["Kann ich die Matten waschen?",
     "<p>Ja. Die Matten können in der Maschine gewaschen und sogar im Trockner getrocknet werden. " +
     "Die Oberseite der JetPrint besteht aus 100 % trittfestem High-Twist-Nylon (Polyamid), " +
     "die Rückenbeschichtung aus 100 % waschbarem Nitrilgummi.</p>"],
    ["Habe ich ein Widerrufsrecht?",
     "<p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen den Vertrag zu " +
     "widerrufen. <b>Ausnahme:</b> Bei Waren, die nach Ihren individuellen Vorgaben " +
     "konfektioniert werden, besteht gemäß § 312g Abs. 2 Nr. 1 BGB kein Widerrufsrecht. Ihr " +
     "gesetzliches Recht auf Gewährleistung bei Mängeln bleibt davon unberührt.</p>" +
     '<p><a href="widerruf.html">Vollständige Widerrufsbelehrung</a></p>'],
    ["Bieten Sie auch Mietmatten an?",
     "<p>Ja. Der Miet-Mattenservice umfasst einfarbige, melierte und gestaltete Mietmatten " +
     "inklusive Abholung, Wäsche und Austausch, dazu Teppichboden-Reinigung — für München und " +
     'Umland. <a href="miet-service.html">Mehr zum Mietservice</a></p>'],
    ["Wie erstelle ich mein eigenes Mattendesign?",
     "<p>Mit dem Mattendesigner entwerfen Sie Ihr Wunschdesign direkt online — Größe, Grundfarbe, " +
     'Motiv und Schriftzug. <a href="mattendesigner.html">Zum Mattendesigner</a></p>']
  ];
  function initFaq() {
    var el = document.querySelector("[data-faq]");
    if (!el) return;
    el.innerHTML = FAQ.map(function (f, i) {
      return '<div class="faq__item' + (i === 0 ? " is-open" : "") + '">' +
        '<button class="faq__q" type="button" aria-expanded="' + (i === 0) + '">' +
        "<span>" + MF.esc(f[0]) + "</span>" + MF.icon("plus") + "</button>" +
        '<div class="faq__a">' + f[1] + "</div></div>";
    }).join("");
    MF.initFaq(el);
  }

  /* ---------- Start ------------------------------------------------------ */
  paintIcons();
  initHero();
  initQuick();
  initTopseller();
  initQuotes();
  initProjects();
  initMagazin();
  initFaq();
  MF.boot();
  MF.initReveal();
})();
