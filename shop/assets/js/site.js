/* =============================================================================
   Mattenfuchs-Shop — gemeinsame Logik
   Kopf, Navigation, Suche, Warenkorb, Produktkarten, kleine Interaktionen.
   Reines Frontend, kein Backend. Warenkorb liegt im localStorage.
   ========================================================================== */
(function () {
  "use strict";

  var MF = (window.MF = window.MF || {});
  var C = window.CATALOG || { categories: [], products: [] };

  /* ---------- Firmendaten (1:1 aus dem Impressum von matten.de) ---------- */
  MF.firma = {
    name: "FUCHSIUS multi-media GmbH",
    marke: "Der Mattenfuchs-Shop",
    claim: "über 35 Jahre Erfahrung",
    inhaber: "Dipl.-Ing. FH Dieter Fuchsius",
    strasse: "Fischerstrasse 2",
    ort: "D-85737 Ismaning",
    tel: "+49 89 54 55 82 64",
    telHref: "+498954558264",
    fax: "+49 89 54 88 83 33",
    mobil: "+49 171 77 55 400",
    mobilHref: "+491717755400",
    mail: "info@matten.de",
    hrb: "Amtsgericht München, HRB 161064",
    ustid: "DE 246 769 029"
  };

  /* ---------- Helfer ----------------------------------------------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  MF.esc = esc;

  MF.eur = function (n) {
    return (Number(n) || 0).toLocaleString("de-DE", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }) + " €";
  };

  MF.qs = function (k) {
    return new URLSearchParams(location.search).get(k);
  };

  var PLACEHOLDER =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#eef2f5"/>' +
      '<rect x="60" y="95" width="280" height="110" rx="4" fill="#d8e0e7"/>' +
      '<rect x="72" y="107" width="256" height="86" rx="2" fill="#c3ced8"/>' +
      '<text x="200" y="250" font-family="Barlow,sans-serif" font-size="15" fill="#8d99a5" text-anchor="middle">Produktbild folgt</text>' +
      "</svg>"
    );
  MF.PLACEHOLDER = PLACEHOLDER;

  MF.img = function (p) {
    if (p && p.image) return MF.root + p.image;
    return PLACEHOLDER;
  };

  /* Pfad-Wurzel: Unterseiten liegen alle flach im /shop-Ordner */
  MF.root = "";

  /* ---------- Icons (Inline-SVG, 1,5px Strich) --------------------------- */
  var I = {
    shield: '<path d="M12 3 4.5 6v5.3c0 4.4 3 8.4 7.5 9.7 4.5-1.3 7.5-5.3 7.5-9.7V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
    phone: '<path d="M6.6 3.5h3l1.5 3.7-1.9 1.1a11 11 0 0 0 4.5 4.5l1.1-1.9 3.7 1.5v3a1.6 1.6 0 0 1-1.7 1.6A14.7 14.7 0 0 1 5 5.2 1.6 1.6 0 0 1 6.6 3.5Z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20a7.4 7.4 0 0 1 14.4 0"/>',
    cart: '<path d="M3 4h2.2l2.3 10.5h9.4L19 7H6.2"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    left: '<path d="m14 6-6 6 6 6"/>',
    right: '<path d="m10 6 6 6-6 6"/>',
    check: '<path d="M20 6 9.5 17 4 11.5"/>',
    checkC: '<circle cx="12" cy="12" r="8.6"/><path d="m8.4 12.2 2.5 2.5 4.7-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1"/><path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4"/>',
    logo: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M8.5 12.5h7M8.5 15h4"/><circle cx="10" cy="9.5" r="1.2"/>',
    truck: '<path d="M2.5 6.5h11v9h-11z"/><path d="M13.5 10h4l3 3v2.5h-7z"/><circle cx="6.5" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/>',
    factory: '<path d="M3 20V9.5l5 3v-3l5 3v-3l5 3V20z"/><path d="M8 20v-3.5M13 20v-3.5M18 20v-3.5"/>',
    award: '<circle cx="12" cy="9.5" r="5"/><path d="m8.8 13.6-1.3 6.4L12 18l4.5 2-1.3-6.4"/>',
    eu: '<circle cx="12" cy="12" r="8.6"/><path d="M12 6.6v1.6M12 15.8v1.6M6.6 12h1.6M15.8 12h1.6M8.2 8.2l1.1 1.1M14.7 14.7l1.1 1.1M15.8 8.2l-1.1 1.1M9.3 14.7l-1.1 1.1"/>',
    chat: '<path d="M4 5.5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    pin: '<path d="M12 21s6.5-5.6 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.6" r="2.3"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="1"/><path d="m3.6 6.4 8.4 6.2 8.4-6.2"/>',
    quote: '<path d="M9.5 6C6.5 7.2 5 9.6 5 13v5h6v-6H8c0-2.4.5-4 1.5-5V6Zm9 0c-3 1.2-4.5 3.6-4.5 7v5h6v-6h-3c0-2.4.5-4 1.5-5V6Z"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.2M12 8.1v.1"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.8h5V7M6.8 7l.9 12.2h8.6L17.2 7"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9" rx="1"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    palette: '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 2-.9 2-1.9 0-.5-.2-.9-.5-1.2a1.7 1.7 0 0 1 1.2-2.9H17a3.5 3.5 0 0 0 3.5-3.5c0-4.1-3.8-7.5-8.5-7.5Z"/><circle cx="7.8" cy="11" r=".9"/><circle cx="10.2" cy="7.6" r=".9"/><circle cx="14.4" cy="7.8" r=".9"/>',
    scissors: '<circle cx="6.5" cy="6.5" r="2.3"/><circle cx="6.5" cy="17.5" r="2.3"/><path d="M8.4 7.8 20 17M8.4 16.2 20 7"/>',
    wash: '<rect x="4.5" y="3.5" width="15" height="17" rx="2"/><circle cx="12" cy="13" r="4.2"/><path d="M8 7h.01M11 7h.01"/>'
  };
  MF.icon = function (n, cls) {
    return '<svg class="ico ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || "") + "</svg>";
  };

  /* ---------- Navigationsstruktur ---------------------------------------- */
  MF.nav = [
    {
      label: "Fußmatten", cat: "fussmatten",
      cols: [
        { head: "Nach Material", links: [
          ["Baumwoll- & Nylon-Fußmatten", "kategorie.html?cat=fussmatten&sub=standard-schmutzfangmatten"],
          ["Einfarbige & Logo-Fußmatten", "kategorie.html?cat=fussmatten&sub=fussmatten"],
          ["Kokosvelour", "kategorie.html?cat=kokosmatten"],
          ["Gummi & Kunststoff", "kategorie.html?cat=gummi_und_kunststoffmatten"],
          ["Aluminium-Profil", "kategorie.html?cat=aluminium_profilmatten"]
        ]},
        { head: "Nach Einsatzort", links: [
          ["Innenbereich", "kategorie.html?cat=fussmatten&sub=standard-schmutzfangmatten"],
          ["Außenbereich", "kategorie.html?cat=fussmatten&sub=matten_fuer_aussenbereiche"],
          ["Nasszonen & Sauna", "kategorie.html?cat=fussmatten&q=water"],
          ["Haus & Heim", "kategorie.html?cat=logomatten&sub=matten_fuer_haus_und_heim"],
          ["Arbeitsplatz", "kategorie.html?cat=gummi_und_kunststoffmatten"]
        ]},
        { head: "Bekannte Typen", links: [
          ["JetPrint™ HD", "kategorie.html?q=JetPrint"],
          ["MONOTON™", "kategorie.html?q=Monoton"],
          ["IRON-HORSE™", "kategorie.html?q=Iron-Horse"],
          ["SUPER-MAT", "kategorie.html?q=Super-Mat"],
          ["WaterHorse", "kategorie.html?q=WaterHorse"]
        ]},
        { head: "Service", links: [
          ["Mattendesigner", "mattendesigner.html"],
          ["Miet-Mattenservice", "miet-service.html"],
          ["Versand & Lieferung", "versand.html"],
          ["Beratung anfordern", "kontakt.html"]
        ]}
      ],
      promo: { cat: "fussmatten", title: "Schmutzfangmatten nach Maß",
        text: "Bis 200 cm Breite und 700 cm Länge, mit oder ohne umlaufenden Rand.",
        href: "kategorie.html?cat=fussmatten" }
    },
    {
      label: "Logomatten", cat: "logomatten",
      cols: [
        { head: "Drucktechnik", links: [
          ["JetPrint™ Premium", "kategorie.html?cat=logomatten&q=JetPrint"],
          ["JetPrint™ light", "kategorie.html?q=light"],
          ["JetPrint™ Velour", "kategorie.html?q=Velour"],
          ["Chromojet™", "kategorie.html?q=Chromojet"],
          ["Beflockung / Kokos-Design", "kategorie.html?cat=kokosmatten"]
        ]},
        { head: "Anwendung", links: [
          ["Werbe- & Dekomatten", "kategorie.html?cat=logomatten&sub=werbematten-dekomatten"],
          ["Event- & Messematten", "kategorie.html?q=Event"],
          ["Barmatten / Thekenmatten", "kategorie.html?q=Bar"],
          ["Bierbank-Auflagen", "kategorie.html?cat=logomatten&sub=bierbankmatten"],
          ["Automatten", "kategorie.html?q=Automatte"]
        ]},
        { head: "Spezialbereiche", links: [
          ["REHA- & Trainingsmatten", "kategorie.html?cat=logomatten&sub=os-physio-rehab-matten"],
          ["Hinweis- & Gebotsmatten", "kategorie.html?cat=logomatten&sub=sicherheits_symbol_matten"],
          ["Sicherheits-Symbolmatten", "kategorie.html?cat=logomatten&sub=sicherheits_symbol_matten"],
          ["Matten für Haus & Heim", "kategorie.html?cat=logomatten&sub=matten_fuer_haus_und_heim"],
          ["Wunschdesign-Matten", "kategorie.html?cat=logomatten&sub=wunschdesign-matten"]
        ]},
        { head: "Gestaltung", links: [
          ["Mattendesigner starten", "mattendesigner.html"],
          ["Farbpaletten", "farben.html"],
          ["Technische Daten", "technik.html"],
          ["Druckdaten & Vorlagen", "technik.html#druckdaten"]
        ]}
      ],
      promo: { cat: "logomatten", title: "Ihr Logo, bis 32-farbig",
        text: "Fotorealistisch gedruckt, in jeder Wunschgröße und Sonderform.",
        href: "kategorie.html?cat=logomatten" }
    },
    {
      label: "Kokosmatten", cat: "kokosmatten",
      cols: [
        { head: "Kokosvelour", links: [
          ["Kokosmatte natur", "kategorie.html?cat=kokosmatten&q=natur"],
          ["Kokosmatten farbig", "kategorie.html?cat=kokosmatten&q=farbig"],
          ["Design-Koko, beflockt", "kategorie.html?cat=kokosmatten"]
        ]},
        { head: "Zubehör", links: [
          ["Randprofile für Kokosmatten", "kategorie.html?cat=aluminium_profilmatten&q=profil"],
          ["Aluminium-Anlaufprofile", "kategorie.html?q=Anlaufprofil"],
          ["Höhenausgleich", "kategorie.html?q=Höhenausgleich"],
          ["Gummi-Unterlagen", "kategorie.html?q=Gummi-Unterlage"]
        ]},
        { head: "Wissen", links: [
          ["Höhen 13 – 30 mm", "technik.html#kokos"],
          ["Zuschnitt nach Schablone", "technik.html#zuschnitt"],
          ["Pflegehinweise", "service.html"]
        ]}
      ],
      promo: { cat: "kokosmatten", title: "Kokos, exakt zugeschnitten",
        text: "Auch schiefwinklig, nach Zeichnung oder Schablone — Breiten bis 200 cm.",
        href: "kategorie.html?cat=kokosmatten" }
    },
    {
      label: "Aluminium-Matten", cat: "aluminium_profilmatten",
      cols: [
        { head: "Diplomat", links: [
          ["Diplomat Original", "kategorie.html?cat=aluminium_profilmatten&q=Diplomat"],
          ["Diplomat Premium", "kategorie.html?cat=aluminium_profilmatten&q=Premium"],
          ["Diplomat Normgrößen", "kategorie.html?cat=aluminium_profilmatten&q=Norm"]
        ]},
        { head: "Weitere Systeme", links: [
          ["Marschall Original", "kategorie.html?q=Marschall"],
          ["Marschall Premium", "kategorie.html?q=Marschall-Premium"],
          ["Plaza Aluminium-Profil", "kategorie.html?q=Plaza"],
          ["Top-Clean", "kategorie.html?q=Top-Clean"]
        ]},
        { head: "Rahmen & Zubehör", links: [
          ["Rahmen & Zubehör", "kategorie.html?cat=aluminium_profilmatten&sub=rahmen_und_zubehoer"],
          ["Schmutzfang-Wannen", "kategorie.html?q=Wanne"],
          ["Spezialrahmen mit Unterkonstruktion", "kategorie.html?q=Unterkonstruktion"],
          ["Ripsstreifen & Profileinlagen", "kategorie.html?q=Ripseinlagen"],
          ["Gitterrost verzinkt", "kategorie.html?q=Gitterrost"],
          ["Gummi-Unterlagen", "kategorie.html?q=Gummi-Unterlage"]
        ]},
        { head: "Planung", links: [
          ["Technische Daten", "technik.html#alu"],
          ["Einbau in Bodenvertiefung", "technik.html#einbau"],
          ["Beratung anfordern", "kontakt.html"]
        ]}
      ],
      promo: { cat: "aluminium_profilmatten", title: "Eingangssysteme aus Aluminium",
        text: "Rips, Bürste, Gummi oder Cassette — für den stark frequentierten Eingang.",
        href: "kategorie.html?cat=aluminium_profilmatten" }
    },
    {
      label: "Gummi & Kunststoff", cat: "gummi_und_kunststoffmatten",
      cols: [
        { head: "Arbeitsplatz", links: [
          ["Komfort-Standard", "kategorie.html?q=Komfort"],
          ["Komfort-Design", "kategorie.html?q=Komfort-Design"],
          ["Komfort-Office", "kategorie.html?q=Komfort-Office"],
          ["Komfort-Soft", "kategorie.html?q=Komfort-Soft"],
          ["Cushion-Coil", "kategorie.html?q=Cushion"]
        ]},
        { head: "Industrie & Eingang", links: [
          ["Scraper-Matten", "kategorie.html?q=Scraper"],
          ["Thru-Plus", "kategorie.html?q=Thru"],
          ["Gummi-Wabenmatten", "kategorie.html?q=Waben"],
          ["Kunststoff-Reinstreifer", "kategorie.html?q=Reinstreifer"],
          ["NOMAD Spaghetti", "kategorie.html?q=Nomad"]
        ]},
        { head: "Boden & Büro", links: [
          ["Bodenschutzmatten", "kategorie.html?cat=gummi_und_kunststoffmatten&sub=bodenschutzmatten"],
          ["Sixform Kunststoff", "kategorie.html?q=Sixform"],
          ["Stewell Kunststoff", "kategorie.html?q=Stewell"],
          ["Mitwell Matten", "kategorie.html?q=Mitwell"]
        ]}
      ],
      promo: { cat: "gummi_und_kunststoffmatten", title: "Stehen ohne Ermüdung",
        text: "Elastische Arbeitsplatzmatten für Werkbank, Kasse und Montagelinie.",
        href: "kategorie.html?cat=gummi_und_kunststoffmatten" }
    },
    {
      label: "Miet-Mattenservice", href: "miet-service.html",
      cols: [
        { head: "Service", links: [
          ["So funktioniert der Mietservice", "miet-service.html"],
          ["Einfarbige & melierte Mietmatten", "miet-service.html#sortiment"],
          ["Gestaltete Mietmatten", "miet-service.html#sortiment"],
          ["Teppichboden-Reinigung", "miet-service.html#reinigung"]
        ]},
        { head: "Produkte", links: [
          ["Teppich-Reinigungsprodukte", "kategorie.html?cat=miet-mattenservice"],
          ["Fleckenentferner-Set", "kategorie.html?cat=miet-mattenservice&q=Flecken"]
        ]}
      ],
      promo: { cat: "miet-mattenservice", title: "Mieten statt kaufen",
        text: "Abholung, Wäsche und Austausch im festen Turnus — für München und Umland.",
        href: "miet-service.html" }
    },
    { label: "Kontakt", href: "kontakt.html", plain: true }
  ];

  /* Bild für Menü-Promo: erstes Produkt der Kategorie mit Bild */
  function catImage(catKey) {
    var p = C.products.filter(function (x) { return x.cat === catKey && x.image; })[0];
    return p ? MF.root + p.image : PLACEHOLDER;
  }
  MF.catImage = catImage;

  /* ---------- Kopfzeile --------------------------------------------------- */
  MF.headerHTML = function () {
    var f = MF.firma;
    var navHTML = MF.nav.map(function (n, i) {
      if (n.plain) {
        return '<li class="nav__item nav__item--plain"><a class="nav__link" href="' + n.href + '">' +
          esc(n.label) + "</a></li>";
      }
      var top = '<button class="nav__link" type="button" aria-expanded="false">' +
        esc(n.label) + MF.icon("chev", "caret") + "</button>";
      var cols = n.cols.map(function (c) {
        return '<div class="mega__col"><h4>' + esc(c.head) + "</h4><ul>" +
          c.links.map(function (l) { return "<li><a href=\"" + l[1] + '">' + esc(l[0]) + "</a></li>"; }).join("") +
          "</ul></div>";
      }).join("");
      var promoImg = n.promo.img ? MF.root + n.promo.img : catImage(n.promo.cat);
      var promo =
        '<div class="mega__promo"><a href="' + n.promo.href + '">' +
        '<img src="' + promoImg + '" alt="" loading="lazy"></a>' +
        "<b>" + esc(n.promo.title) + "</b><p>" + esc(n.promo.text) + "</p>" +
        '<a class="btn btn--ghost btn--sm" href="' + n.promo.href + '">Sortiment ansehen</a></div>';
      return '<li class="nav__item" data-i="' + i + '">' + top +
        '<div class="mega"><div class="container mega__inner">' + cols + promo + "</div></div></li>";
    }).join("");

    return '' +
      '<div class="topbar"><div class="container">' +
        '<div class="topbar__item">' + MF.icon("shield") + "<span>Seit über 35 Jahren Matten-Spezialist</span></div>" +
        '<div class="topbar__item">' + MF.icon("phone") + '<span>Persönliche Beratung: <a href="tel:' + f.mobilHref + '">' + f.mobil + "</a></span></div>" +
        '<div class="topbar__item">' + MF.icon("clock") + "<span>Angebot innerhalb 24 h</span></div>" +
      "</div></div>" +
      '<header class="header"><div class="container header__inner">' +
        '<a class="brand" href="index.html">' +
          '<img class="brand__mark" src="' + MF.root + 'assets/img/logo.png" alt="Mattenfuchs">' +
          "<span><span class=\"brand__name\">Mattenfuchs</span><br>" +
          '<span class="brand__claim">Matten nach Maß seit 35 Jahren</span></span>' +
        "</a>" +
        '<div class="search">' +
          '<label class="sr-only" for="q">Produktsuche</label>' +
          '<input id="q" type="search" autocomplete="off" placeholder="Wonach suchen Sie? z. B. Logomatte, Kokos, Alu-Profil">' +
          '<button class="search__btn" type="button" aria-label="Suchen">' + MF.icon("search") + "</button>" +
          '<div class="search__results" id="searchResults" role="listbox"></div>' +
        "</div>" +
        '<div class="header__actions">' +
          '<select class="kundentyp" id="kundentyp" aria-label="Kundenart">' +
            "<option>Geschäftskunde</option><option>Privatkunde</option></select>" +
          '<div class="contact-mini"><a href="tel:' + f.telHref + '">Tel. ' + f.tel + "</a>" +
            '<a class="mail" href="mailto:' + f.mail + '">' + f.mail + "</a></div>" +
          '<a class="hbtn" href="konto.html">' + MF.icon("user") +
            '<span class="hbtn__meta"><small>Mein</small><b>Konto</b></span></a>' +
          '<a class="hbtn hbtn--cart" href="warenkorb.html">' + MF.icon("cart") +
            '<span class="cart-count" data-cart-count>0</span>' +
            '<span class="hbtn__meta"><small>Warenkorb</small><b data-cart-total>0,00 €</b></span></a>' +
          '<button class="nav-toggle" type="button" aria-label="Menü">' + MF.icon("menu") + "Menü</button>" +
        "</div>" +
      "</div></header>" +
      '<nav class="nav" aria-label="Hauptnavigation"><div class="container">' +
        '<ul class="nav__list">' + navHTML + "</ul>" +
      "</div></nav>";
  };

  /* ---------- Fußzeile ---------------------------------------------------- */
  MF.footerHTML = function () {
    var f = MF.firma;
    return '' +
      '<footer class="footer"><div class="container">' +
        '<div class="footer__top">' +
          "<div>" +
            '<div class="footer__brand"><img src="' + MF.root + 'assets/img/logo.png" alt="">' +
              "<span><b>Mattenfuchs</b><span>" + esc(f.claim) + "</span></span></div>" +
            '<p class="footer__about">' + esc(f.marke) + " der " + esc(f.name) +
            ". Individuelle Werbe- und Designmatten, Schmutzfangmatten, Kokos-, Aluminium- und Arbeitsplatzmatten — konfektioniert nach Ihren Maßen.</p>" +
            '<div class="footer__contact">' +
              "<a href=\"tel:" + f.telHref + '">' + MF.icon("phone", "ico--sm") + f.tel + "</a><br>" +
              '<a href="tel:' + f.mobilHref + '">' + MF.icon("phone", "ico--sm") + f.mobil + " (Hotline)</a><br>" +
              '<a href="mailto:' + f.mail + '">' + MF.icon("mail", "ico--sm") + f.mail + "</a><br>" +
              '<span style="display:inline-flex;gap:8px;align-items:flex-start">' + MF.icon("pin", "ico--sm") +
              esc(f.strasse) + ", " + esc(f.ort) + "</span>" +
            "</div>" +
          "</div>" +
          "<div><h4>Sortiment</h4><ul>" +
            '<li><a href="kategorie.html?cat=fussmatten">Fußmatten & Schmutzfangmatten</a></li>' +
            '<li><a href="kategorie.html?cat=logomatten">Logomatten & Designmatten</a></li>' +
            '<li><a href="kategorie.html?cat=kokosmatten">Kokosmatten</a></li>' +
            '<li><a href="kategorie.html?cat=aluminium_profilmatten">Aluminium-Profilmatten</a></li>' +
            '<li><a href="kategorie.html?cat=gummi_und_kunststoffmatten">Gummi- & Kunststoffmatten</a></li>' +
            '<li><a href="miet-service.html">Miet-Mattenservice</a></li>' +
          "</ul></div>" +
          "<div><h4>Service</h4><ul>" +
            '<li><a href="mattendesigner.html">Mattendesigner</a></li>' +
            '<li><a href="technik.html">Technische Daten</a></li>' +
            '<li><a href="farben.html">Farbpaletten</a></li>' +
            '<li><a href="versand.html">Versand & Lieferung</a></li>' +
            '<li><a href="service.html">Pflege & Reinigung</a></li>' +
            '<li><a href="kontakt.html">Kontakt</a></li>' +
          "</ul></div>" +
          "<div><h4>Unternehmen</h4><ul>" +
            '<li><a href="unternehmen.html">Über uns</a></li>' +
            '<li><a href="unternehmen.html#stimmen">Kundenstimmen</a></li>' +
            '<li><a href="agb.html">AGB</a></li>' +
            '<li><a href="widerruf.html">Widerrufsrecht</a></li>' +
            '<li><a href="datenschutz.html">Datenschutz</a></li>' +
            '<li><a href="impressum.html">Impressum</a></li>' +
          "</ul></div>" +
        "</div>" +
        '<div class="footer__pay">' +
          ["PayPal", "Visa", "Mastercard", "AMEX", "Klarna", "Vorkasse", "Rechnung"].map(function (p) {
            return '<span class="paychip">' + p + "</span>";
          }).join("") +
          '<span style="margin-left:auto;font-size:13px;opacity:.75">Zahlarten in dieser Demo nur beispielhaft</span>' +
        "</div>" +
        '<div class="footer__bottom">' +
          "<div>© " + new Date().getFullYear() + " " + esc(f.name) + " · " + esc(f.hrb) + " · USt-IdNr. " + esc(f.ustid) +
            '<div class="footer__ai">Teile der Inhalte dieser Website wurden mit Unterstützung von KI erstellt.</div>' +
          "</div>" +
          '<div class="footer__legal">' +
            '<a href="widerruf.html">Widerruf</a><a href="datenschutz.html">Datenschutz</a>' +
            '<a href="agb.html">AGB</a><a href="impressum.html">Impressum</a><a href="versand.html">Versand</a>' +
          "</div>" +
        "</div>" +
      "</div></footer>";
  };

  /* ---------- Warenkorb --------------------------------------------------- */
  var CART_KEY = "mattenfuchs.cart.v1";

  MF.cart = {
    read: function () {
      try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
      catch (e) { return []; }
    },
    write: function (items) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      MF.cart.paint();
      document.dispatchEvent(new CustomEvent("cart:change"));
    },
    add: function (item) {
      var items = MF.cart.read();
      var key = JSON.stringify([item.slug, item.options]);
      var hit = items.filter(function (i) { return JSON.stringify([i.slug, i.options]) === key; })[0];
      if (hit) hit.qty += item.qty;
      else items.push(item);
      MF.cart.write(items);
    },
    remove: function (idx) {
      var items = MF.cart.read();
      items.splice(idx, 1);
      MF.cart.write(items);
    },
    setQty: function (idx, qty) {
      var items = MF.cart.read();
      if (!items[idx]) return;
      items[idx].qty = Math.max(1, Math.min(999, qty | 0));
      MF.cart.write(items);
    },
    clear: function () { MF.cart.write([]); },
    count: function () {
      return MF.cart.read().reduce(function (s, i) { return s + i.qty; }, 0);
    },
    /* Versandregel 1:1 von matten.de:
       bis 1,8 m²  → 5,00 €   ·  darüber → 10,00 €  ·  ab 1.000 € → frachtfrei */
    totals: function () {
      var items = MF.cart.read();
      var net = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
      var qm = items.reduce(function (s, i) { return s + (i.qm || 0) * i.qty; }, 0);
      var ship = 0;
      if (items.length) {
        if (net >= 1000) ship = 0;
        else if (qm > 1.8) ship = 10;
        else ship = 5;
      }
      var gross = net + ship;
      return { items: items, sum: net, qm: qm, shipping: ship, total: gross, vat: gross - gross / 1.19 };
    },
    paint: function () {
      var c = MF.cart.count();
      var t = MF.cart.totals();
      document.querySelectorAll("[data-cart-count]").forEach(function (el) {
        el.textContent = c;
        el.style.display = c ? "" : "none";
      });
      document.querySelectorAll("[data-cart-total]").forEach(function (el) {
        el.textContent = MF.eur(t.total);
      });
    }
  };

  /* ---------- Toast ------------------------------------------------------- */
  MF.toast = function (msg, linkText, linkHref) {
    var wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.innerHTML = MF.icon("checkC") + "<div>" + esc(msg) +
      (linkText ? ' <a href="' + linkHref + '">' + esc(linkText) + "</a>" : "") + "</div>";
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s, transform .3s";
      t.style.opacity = "0";
      t.style.transform = "translateY(8px)";
      setTimeout(function () { t.remove(); }, 320);
    }, 4200);
  };

  /* ---------- Produktkarte ------------------------------------------------ */
  MF.card = function (p) {
    var href = "produkt.html?p=" + encodeURIComponent(p.slug);
    var badge = p.badge
      ? '<div class="card__badges"><span class="badge ' +
        (p.badge === "Topseller" ? "badge--hot" : "badge--custom") + '">' + esc(p.badge) + "</span></div>"
      : "";
    var sw = "";
    if (p.colors && p.colors.length) {
      sw = '<div class="swatches">' +
        p.colors.slice(0, 7).map(function (c) {
          var file = c.swatch ? c.swatch.split("/").pop() : "";
          var bg = file ? 'style="background-image:url(' + MF.root + "assets/img/swatches/" + file + ')"' : "";
          return '<span class="swatch" ' + bg + ' title="' + esc(c.name) + '"></span>';
        }).join("") +
        (p.colors.length > 7 ? '<span class="swatch--more">+' + (p.colors.length - 7) + "</span>" : "") +
        "</div>";
    }
    var feats = (p.features || []).slice(0, 3).map(function (f) {
      return "<li>" + MF.icon("checkC") + "<span>" + esc(f) + "</span></li>";
    }).join("");
    return '' +
      '<article class="card reveal">' +
        '<a class="card__media" href="' + href + '" aria-label="' + esc(p.name) + '">' +
          '<img src="' + MF.img(p) + '" alt="' + esc(p.name) + '" loading="lazy">' + badge +
        "</a>" +
        '<div class="card__body">' +
          '<div class="card__kicker">' + esc(p.subName || MF.catName(p.cat)) + "</div>" +
          '<h3 class="card__title"><a href="' + href + '">' + esc(p.name) + "</a></h3>" +
          (p.teaser ? '<p class="card__desc">' + esc(MF.trim(p.teaser, 96)) + "</p>" : "") +
          sw +
          (feats ? '<ul class="card__feats">' + feats + "</ul>" : "") +
          '<div class="card__foot">' +
            '<div class="price">' + (p.from ? '<span class="price__from">ab </span>' : "") +
              MF.eur(p.price) + "<small>inkl. MwSt. zzgl. Versand</small></div>" +
            '<a class="btn btn--sm" href="' + href + '">Details</a>' +
          "</div>" +
        "</div>" +
      "</article>";
  };

  MF.trim = function (s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s;
  };

  MF.catName = function (key) {
    var c = C.categories.filter(function (x) { return x.key === key; })[0];
    return c ? c.short : "";
  };
  MF.cat = function (key) {
    return C.categories.filter(function (x) { return x.key === key; })[0];
  };
  MF.bySlug = function (slug) {
    return C.products.filter(function (p) { return p.slug === slug; })[0];
  };

  /* ---------- Suche ------------------------------------------------------- */
  MF.search = function (q, limit) {
    q = (q || "").trim().toLowerCase();
    if (q.length < 2) return [];
    var terms = q.split(/\s+/);
    var res = [];
    C.products.forEach(function (p) {
      var hay = (p.name + " " + (p.teaser || "") + " " + (p.subName || "") + " " + p.cat + " " + (p.desc || []).join(" ")).toLowerCase();
      var score = 0, ok = true;
      terms.forEach(function (t) {
        var i = hay.indexOf(t);
        if (i < 0) { ok = false; return; }
        score += (p.name.toLowerCase().indexOf(t) >= 0 ? 12 : 3) + Math.max(0, 6 - i / 40);
      });
      if (ok) { if (p.image) score += 4; res.push({ p: p, s: score }); }
    });
    res.sort(function (a, b) { return b.s - a.s; });
    return res.slice(0, limit || 30).map(function (r) { return r.p; });
  };

  /* ---------- Interaktionen ---------------------------------------------- */
  function initNav() {
    var items = document.querySelectorAll(".nav__item:not(.nav__item--plain)");
    var closeTimer;
    items.forEach(function (li) {
      var btn = li.querySelector(".nav__link");
      function open() {
        clearTimeout(closeTimer);
        items.forEach(function (o) {
          if (o !== li) { o.classList.remove("is-open"); var b = o.querySelector(".nav__link"); if (b.setAttribute) b.setAttribute("aria-expanded", "false"); }
        });
        li.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
      function close() {
        li.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        li.classList.contains("is-open") ? close() : open();
      });
      li.addEventListener("mouseenter", function () {
        if (window.matchMedia("(min-width:861px)").matches) open();
      });
      li.addEventListener("mouseleave", function () {
        if (window.matchMedia("(min-width:861px)").matches) {
          closeTimer = setTimeout(close, 160);
        }
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") items.forEach(function (li) { li.classList.remove("is-open"); });
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".nav")) items.forEach(function (li) { li.classList.remove("is-open"); });
    });
    var tog = document.querySelector(".nav-toggle");
    if (tog) tog.addEventListener("click", function () {
      document.querySelector(".nav").classList.toggle("is-open");
    });
  }

  function initSearch() {
    var inp = document.getElementById("q");
    var box = document.getElementById("searchResults");
    if (!inp || !box) return;
    var t;
    function render() {
      var v = inp.value;
      if (v.trim().length < 2) { box.classList.remove("is-open"); box.innerHTML = ""; return; }
      var res = MF.search(v, 8);
      if (!res.length) {
        box.innerHTML = '<div class="search__empty">Kein Treffer für „' + esc(v) +
          '". <a href="kontakt.html">Fragen Sie uns direkt</a> — wir fertigen auch Sonderformen.</div>';
      } else {
        box.innerHTML = res.map(function (p) {
          return '<a class="search__row" href="produkt.html?p=' + encodeURIComponent(p.slug) + '">' +
            '<img src="' + MF.img(p) + '" alt="" loading="lazy">' +
            "<span><b>" + esc(MF.trim(p.name, 62)) + "</b><span>" + esc(p.subName || MF.catName(p.cat)) +
            " · " + (p.from ? "ab " : "") + MF.eur(p.price) + "</span></span></a>";
        }).join("") +
        '<a class="search__row" href="kategorie.html?q=' + encodeURIComponent(v) + '" style="justify-content:center">' +
        "<b>Alle Treffer anzeigen</b></a>";
      }
      box.classList.add("is-open");
    }
    inp.addEventListener("input", function () { clearTimeout(t); t = setTimeout(render, 130); });
    inp.addEventListener("focus", render);
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && inp.value.trim().length > 1) {
        location.href = "kategorie.html?q=" + encodeURIComponent(inp.value.trim());
      }
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".search")) box.classList.remove("is-open");
    });
    var sb = document.querySelector(".search__btn");
    if (sb) sb.addEventListener("click", function () {
      if (inp.value.trim().length > 1) location.href = "kategorie.html?q=" + encodeURIComponent(inp.value.trim());
      else inp.focus();
    });
  }

  var NOMOTION = /(^|[?&])nomotion=1/.test(location.search);

  function showAll() {
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  function initReveal() {
    var els = [].slice.call(document.querySelectorAll(".reveal:not(.is-in)"));
    if (!els.length) return;
    if (NOMOTION || !("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
    els.forEach(function (el) { io.observe(el); });
    /* Sicherheitsnetz: nichts darf dauerhaft unsichtbar bleiben. */
    clearTimeout(initReveal._t);
    initReveal._t = setTimeout(showAll, 4000);
  }
  MF.initReveal = initReveal;

  MF.initFaq = function (scope) {
    (scope || document).querySelectorAll(".faq__q").forEach(function (b) {
      b.addEventListener("click", function () {
        b.closest(".faq__item").classList.toggle("is-open");
      });
    });
  };

  MF.initSlider = function (root) {
    var track = root.querySelector(".slider__track");
    var prev = root.querySelector("[data-prev]");
    var next = root.querySelector("[data-next]");
    var bar = root.querySelector(".slider__bar i");
    if (!track) return;
    function step() {
      var first = track.firstElementChild;
      return first ? first.getBoundingClientRect().width + 24 : 300;
    }
    function paint() {
      if (!bar) return;
      var max = track.scrollWidth - track.clientWidth;
      var w = Math.max(12, (track.clientWidth / track.scrollWidth) * 100);
      var left = max > 0 ? (track.scrollLeft / max) * (100 - w) : 0;
      bar.style.width = w + "%";
      bar.style.left = left + "%";
    }
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    track.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
    paint();
  };

  /* ---------- Boot -------------------------------------------------------- */
  MF.mount = function () {
    var h = document.getElementById("site-header");
    if (h) h.innerHTML = MF.headerHTML();
    var f = document.getElementById("site-footer");
    if (f) f.innerHTML = MF.footerHTML();
  };

  MF.boot = function () {
    initNav();
    initSearch();
    MF.cart.paint();
    initReveal();
    var kt = document.getElementById("kundentyp");
    if (kt) {
      kt.value = localStorage.getItem("mattenfuchs.kundentyp") || "Geschäftskunde";
      kt.addEventListener("change", function () {
        localStorage.setItem("mattenfuchs.kundentyp", kt.value);
        MF.toast("Ansicht auf „" + kt.value + "“ umgestellt.");
      });
    }
    document.addEventListener("cart:change", MF.cart.paint);
  };
})();
