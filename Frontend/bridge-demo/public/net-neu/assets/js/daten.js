/* ERZEUGT von bau-net-daten.mjs, nicht von Hand ändern.
   Quellen: spec/struktur.json, spec/texte/*.md, spec/screens/*.html,
   public/net-neu/assets/img/manifest.json. Neu bauen: node bau-net-daten.mjs */
window.NET = {
 "quelle": "https://www.matten.net (deutsche Fassung, /de)",
 "erfasstAm": "2026-08-31",
 "kopfzeile": {
  "logo": {
   "href": "index.html",
   "img": "assets/img/logo_german.png",
   "breite": 1024,
   "hoehe": 197
  },
  "sprachwahl": {
   "aktuell": "Deutsch",
   "optionen": [
    {
     "label": "English",
     "href": "#",
     "title": "in Vorbereitung",
     "flagge": "assets/img/flags/united-kingdom.png"
    },
    {
     "label": "Deutsch",
     "href": "index.html",
     "title": "",
     "flagge": "assets/img/flags/german.png"
    }
   ]
  },
  "links": [
   {
    "label": "Gästebuch",
    "href": "guest-book.html"
   },
   {
    "label": "Login",
    "href": "login.html"
   },
   {
    "label": "Registrieren",
    "href": "register.html"
   }
  ],
  "warenkorbKnopf": {
   "label": "Cart"
  },
  "checkoutKnopf": {
   "label": "Auschecken",
   "href": "checkout.html"
  },
  "suche": {
   "formAction": "products.html",
   "feld": "keyword",
   "platzhalter": "Produkt suchen"
  }
 },
 "navigation": {
  "eintraege": [
   {
    "typ": "link",
    "label": "Mattendesigner",
    "href": "mattendesigner.html"
   },
   {
    "typ": "gruppe",
    "label": "Fussmatten",
    "kategorien": [
     {
      "label": "JetPrint-einfarbig",
      "slug": "jetprint-einfarbig",
      "href": "kategorie.html?slug=jetprint-einfarbig",
      "bild": "assets/img/kategorie-kacheln/5c785fa38931b.jpeg"
     },
     {
      "label": "IronHorse",
      "slug": "ironhorse",
      "href": "kategorie.html?slug=ironhorse",
      "bild": "assets/img/kategorie-kacheln/5c47fa2b5364ejpeg.jpeg"
     },
     {
      "label": "IronHorse XL",
      "slug": "ironhorse-xl",
      "href": "kategorie.html?slug=ironhorse-xl",
      "bild": "assets/img/kategorie-kacheln/5c47fa5a8109ejpeg.jpeg"
     }
    ]
   },
   {
    "typ": "gruppe",
    "label": "Logomatten",
    "kategorien": [
     {
      "label": "Designmatten",
      "slug": "designmatten",
      "href": "kategorie.html?slug=designmatten",
      "bild": "assets/img/kategorie-kacheln/JPL-621-aubergine_0.jpg"
     },
     {
      "label": "Jet Print light",
      "slug": "jet-print-light",
      "href": "kategorie.html?slug=jet-print-light",
      "bild": "assets/img/kategorie-kacheln/JPrint-light.jpg"
     },
     {
      "label": "Katzen Willk",
      "slug": "katzen-willk",
      "href": "kategorie.html?slug=katzen-willk",
      "bild": "assets/img/kategorie-kacheln/5c45865f923d2jpeg.jpeg"
     },
     {
      "label": "JetPrint-Design",
      "slug": "jetprint-design",
      "href": "kategorie.html?slug=jetprint-design",
      "bild": "assets/img/kategorie-kacheln/JetPrint-Design.jpg"
     }
    ]
   },
   {
    "typ": "gruppe",
    "label": "OS-REHA-Physio-Matten",
    "kategorien": [
     {
      "label": "OS-REHAB-Physio-Matten",
      "slug": "os-rehab-physio-matten",
      "href": "kategorie.html?slug=os-rehab-physio-matten",
      "bild": "assets/img/kategorie-kacheln/5c4cc9df3e243jpeg.jpeg"
     },
     {
      "label": "OS-Y-Matte, Wide Balance",
      "slug": "os-y-matte-wide-balance",
      "href": "kategorie.html?slug=os-y-matte-wide-balance",
      "bild": "assets/img/kategorie-kacheln/5c899bca0f1ab.jpeg"
     },
     {
      "label": "OS-REHAB Basis-Matte",
      "slug": "os-rehab-basis-matte",
      "href": "kategorie.html?slug=os-rehab-basis-matte",
      "bild": "assets/img/kategorie-kacheln/5cca3e65b5598.jpeg"
     },
     {
      "label": "OS-REHAB-Bahnmatte",
      "slug": "os-rehab-bahnmatte",
      "href": "kategorie.html?slug=os-rehab-bahnmatte",
      "bild": "assets/img/kategorie-kacheln/5c899da8bc245.jpeg"
     },
     {
      "label": "OS-REHAB-Stern-Matte",
      "slug": "os-rehab-stern-matte",
      "href": "kategorie.html?slug=os-rehab-stern-matte",
      "bild": "assets/img/kategorie-kacheln/5c899f0b48969.jpeg"
     },
     {
      "label": "OS-REHAB-Gitter-Matte",
      "slug": "os-rehab-gitter-matte",
      "href": "kategorie.html?slug=os-rehab-gitter-matte",
      "bild": "assets/img/kategorie-kacheln/5c899e468cda6.jpeg"
     },
     {
      "label": "OS-REHAB-5-Punkt-Matte",
      "slug": "os-rehab-5-punkt-matte",
      "href": "kategorie.html?slug=os-rehab-5-punkt-matte",
      "bild": "assets/img/kategorie-kacheln/5cca325ee6c13.jpeg"
     },
     {
      "label": "OS-REHAB Quadrat-Matte",
      "slug": "os-rehab-quadrat-matte",
      "href": "kategorie.html?slug=os-rehab-quadrat-matte",
      "bild": "assets/img/kategorie-kacheln/5cce29fead941.jpeg"
     }
    ]
   },
   {
    "typ": "gruppe",
    "label": "Kokosmatten",
    "kategorien": [
     {
      "label": "Kokos Farbig",
      "slug": "kokos-farbig",
      "href": "kategorie.html?slug=kokos-farbig",
      "bild": "assets/img/kategorie-kacheln/5c47fa829d279jpeg.jpeg"
     },
     {
      "label": "Kokos naturfarbig",
      "slug": "kokos-naturfarbig",
      "href": "kategorie.html?slug=kokos-naturfarbig",
      "bild": "assets/img/kategorie-kacheln/kokos-natur_512x340.jpg"
     },
     {
      "label": "Kokos-Logomatte",
      "slug": "kokos-logomatte",
      "href": "kategorie.html?slug=kokos-logomatte",
      "bild": "assets/img/kategorie-kacheln/5c47fafe5a2a8jpeg.jpeg"
     }
    ]
   },
   {
    "typ": "gruppe",
    "label": "Aluminium-Matten",
    "kategorien": [
     {
      "label": "MARSCHALL",
      "slug": "marschall",
      "href": "kategorie.html?slug=marschall",
      "bild": "assets/img/kategorie-kacheln/5c47f8cfcc5b7jpeg.jpeg"
     },
     {
      "label": "Diplomat",
      "slug": "diplomat",
      "href": "kategorie.html?slug=diplomat",
      "bild": "assets/img/kategorie-kacheln/5c47f937b4f5fjpeg.jpeg"
     }
    ]
   },
   {
    "typ": "gruppe",
    "label": "Gummimatten",
    "kategorien": [
     {
      "label": "Cushion Coil",
      "slug": "cushion-coil",
      "href": "kategorie.html?slug=cushion-coil",
      "bild": null
     },
     {
      "label": "Scraper",
      "slug": "scraper",
      "href": "kategorie.html?slug=scraper",
      "bild": null
     },
     {
      "label": "Struktura",
      "slug": "struktura",
      "href": "kategorie.html?slug=struktura",
      "bild": "assets/img/kategorie-kacheln/5c47fd1c6e5f7jpeg.jpeg"
     }
    ]
   },
   {
    "typ": "gruppe",
    "label": "Outdoor-Matten",
    "kategorien": [
     {
      "label": "Turf",
      "slug": "turf",
      "href": "kategorie.html?slug=turf",
      "bild": "assets/img/kategorie-kacheln/5c47fbd86c22fjpeg.jpeg"
     }
    ]
   },
   {
    "typ": "gruppe",
    "label": "Mietmatten",
    "kategorien": [
     {
      "label": "IRON-HORSE-Mietmatten",
      "slug": "iron-horse-mietmatten",
      "href": "kategorie.html?slug=iron-horse-mietmatten",
      "bild": "assets/img/kategorie-kacheln/5c4cc0ab6bb26jpeg.jpeg"
     }
    ]
   },
   {
    "typ": "gruppe",
    "label": "Was ist neu",
    "kategorien": [
     {
      "label": "Waschbecken",
      "slug": "waschbecken",
      "href": "kategorie.html?slug=waschbecken",
      "bild": "assets/img/kategorie-kacheln/5c773ded137fb.jpeg"
     }
    ]
   },
   {
    "typ": "link",
    "label": "Alle Produkte",
    "href": "products.html"
   },
   {
    "typ": "link",
    "label": "Blog",
    "href": "blog.html"
   }
  ]
 },
 "fusszeile": {
  "spalten": [
   {
    "titel": "Find us",
    "links": [
     {
      "label": "Facebook",
      "href": "https://m.facebook.com/Fuchsius-multi-media-GmbH-329921957172415/",
      "icon": "fab fa-facebook"
     },
     {
      "label": "Twitter",
      "href": "https://twitter.com/mattenfuchs",
      "icon": "fab fa-twitter"
     },
     {
      "label": "LinkedIn",
      "href": "https://www.linkedin.com/in/dieter-fuchsius-36902ba4/",
      "icon": "fab fa-linkedin"
     },
     {
      "label": "Instagram",
      "href": "https://www.instagram.com/mattenfuchsi/",
      "icon": "fab fa-instagram"
     }
    ],
    "inhalt": null
   },
   {
    "titel": "Information",
    "links": [
     {
      "label": "Home",
      "href": "index.html",
      "icon": null
     },
     {
      "label": "Produktliste",
      "href": "products.html",
      "icon": null
     },
     {
      "label": "Registrieren",
      "href": "register.html",
      "icon": null
     },
     {
      "label": "datenschutz",
      "href": "pages.html?s=data-protection",
      "icon": null
     },
     {
      "label": "Datenschutzerklärung (DSGVO)",
      "href": "pages.html?s=datenschutzerklarung-dsgvo",
      "icon": null
     },
     {
      "label": "AGB",
      "href": "pages.html?s=agb",
      "icon": null
     },
     {
      "label": "Impressum",
      "href": "pages.html?s=impressum",
      "icon": null
     }
    ],
    "inhalt": null
   },
   {
    "titel": "Kontakt",
    "links": [],
    "inhalt": [
     "Mail: info@matten.net",
     "Tel.: +49 89 5455 8264",
     "Fax: +49 89 5455 8333",
     "Mobil: +49 171 77 55 400"
    ]
   }
  ],
  "cards": "assets/img/cards.png",
  "copyright": "© 2026 Mattenfuchs",
  "newsletterWidget": {
   "label": "Newsletter abonnieren",
   "platzhalter": "eMail-Adresse",
   "knopf": "Abonnieren"
  }
 },
 "kategorien": {
  "jetprint-einfarbig": {
   "slug": "jetprint-einfarbig",
   "name": "JetPrint-einfarbig",
   "gruppe": "Fussmatten",
   "href": "kategorie.html?slug=jetprint-einfarbig",
   "beschreibung": "Fußmatten, einfarbig. Wahl aus 150 Farben Nach Ihren Wünschen gefertigt",
   "titelbild": "assets/img/uploads/5ccf40e26130a.jpeg",
   "produkte": [
    "mjplit-jetprint-light-1-farbig",
    "jetprint-premium-1-farbig"
   ]
  },
  "ironhorse": {
   "slug": "ironhorse",
   "name": "IronHorse",
   "gruppe": "Fussmatten",
   "href": "kategorie.html?slug=ironhorse",
   "beschreibung": "Die schön&sauber-Iron-Horse®-Fussmatte ist eine robuste Matte, zur Aufnahme von Schmutz und Nässe. Die schön&sauber-Fussmatte ist eine waschbare Schmutzfangmatte. Die schön&sauber-Iron-Horse®-Fussmatte ist das \"Arbeitspferd\" unter den textilen Eingangsmatten. Die Matte wurde geschaffen um höchsten Schmutz-Rückhalte-Anforderungen zu entsprechen. Sie überzeugt durch extreme Schmutz-Halte-Kapazität und Strapazierfähigkeit und stellt mit 8 harmonisch abgestimmten melierten Farben für jeden Eingangsbereich und Raum eine optische Aufwertung dar. Die zu 100% voll durchgefärbte Polyamid- Nylonfaser (solution-dyed) nimmt bis zu 4 kg/qm Schmutz und Feuchtigkeit auf. Sie hält den Schmutz zwischen den Fasern fest und senkt damit den Reinigungsaufwand in Gebäuden erheblich. Die Rückenbeschichtung ist ein 100% bis zu 80°C maschinenwaschbarer Nitrilgummi.",
   "titelbild": "assets/img/uploads/5c47fa2b58b3djpeg.jpeg",
   "produkte": [
    "iron-horse-matte-2",
    "iron-horse-matte",
    "iron-horse-1-farbige-und-melierte-schmutzfangmatten"
   ]
  },
  "ironhorse-xl": {
   "slug": "ironhorse-xl",
   "name": "IronHorse XL",
   "gruppe": "Fussmatten",
   "href": "kategorie.html?slug=ironhorse-xl",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/5c47fa5a8336bjpeg.jpeg",
   "produkte": []
  },
  "designmatten": {
   "slug": "designmatten",
   "name": "Designmatten",
   "gruppe": "Logomatten",
   "href": "kategorie.html?slug=designmatten",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/JPL-613-k%C3%B6nigsblau_0.jpg",
   "produkte": [
    "designmatten-jetprint-velour",
    "designmatten-jetprint-light",
    "hinweismatten",
    "designmatten-jetprint",
    "jetprint-premium"
   ]
  },
  "jet-print-light": {
   "slug": "jet-print-light",
   "name": "Jet Print light",
   "gruppe": "Logomatten",
   "href": "kategorie.html?slug=jet-print-light",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/5c7730c15903b.jpeg",
   "produkte": [
    "jetprint-light-logo"
   ]
  },
  "katzen-willk": {
   "slug": "katzen-willk",
   "name": "Katzen Willk",
   "gruppe": "Logomatten",
   "href": "kategorie.html?slug=katzen-willk",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/5bcf6fe4d7960jpeg.jpeg",
   "produkte": []
  },
  "jetprint-design": {
   "slug": "jetprint-design",
   "name": "JetPrint-Design",
   "gruppe": "Logomatten",
   "href": "kategorie.html?slug=jetprint-design",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/SL-1024x170-JetPrint.JPG",
   "produkte": [
    "jetprint-matten-design"
   ]
  },
  "os-rehab-physio-matten": {
   "slug": "os-rehab-physio-matten",
   "name": "OS-REHAB-Physio-Matten",
   "gruppe": "OS-REHA-Physio-Matten",
   "href": "kategorie.html?slug=os-rehab-physio-matten",
   "beschreibung": "OS-Physio-REHA-Matten nach Ihren Angaben designed",
   "titelbild": "assets/img/uploads/5c4cc9df43aabjpeg.jpeg",
   "produkte": [
    "os-5-punkt-rehab-trainingsmatte-c",
    "os-stern-rehab-trainingsmatte",
    "os-quadrat-rehab-trainingsmatte"
   ]
  },
  "os-y-matte-wide-balance": {
   "slug": "os-y-matte-wide-balance",
   "name": "OS-Y-Matte, Wide Balance",
   "gruppe": "OS-REHA-Physio-Matten",
   "href": "kategorie.html?slug=os-y-matte-wide-balance",
   "beschreibung": "OS-Physio-REHAB-Y-Matte, Wide Balance",
   "titelbild": "assets/img/uploads/5c899f57088f7.jpeg",
   "produkte": []
  },
  "os-rehab-basis-matte": {
   "slug": "os-rehab-basis-matte",
   "name": "OS-REHAB Basis-Matte",
   "gruppe": "OS-REHA-Physio-Matten",
   "href": "kategorie.html?slug=os-rehab-basis-matte",
   "beschreibung": "OS-REHAB Basis-Matte",
   "titelbild": "assets/img/uploads/5cca3e65c6da1.jpeg",
   "produkte": []
  },
  "os-rehab-bahnmatte": {
   "slug": "os-rehab-bahnmatte",
   "name": "OS-REHAB-Bahnmatte",
   "gruppe": "OS-REHA-Physio-Matten",
   "href": "kategorie.html?slug=os-rehab-bahnmatte",
   "beschreibung": "OS-Physio-REHAB-Bahnmatte",
   "titelbild": "assets/img/uploads/5c89a4d3827c1.jpeg",
   "produkte": []
  },
  "os-rehab-stern-matte": {
   "slug": "os-rehab-stern-matte",
   "name": "OS-REHAB-Stern-Matte",
   "gruppe": "OS-REHA-Physio-Matten",
   "href": "kategorie.html?slug=os-rehab-stern-matte",
   "beschreibung": "OS-Physio-REHAB-Stern-Matte",
   "titelbild": "assets/img/uploads/5c899fcaea079.jpeg",
   "produkte": [
    "os-stern-rehab-trainingsmatte"
   ]
  },
  "os-rehab-gitter-matte": {
   "slug": "os-rehab-gitter-matte",
   "name": "OS-REHAB-Gitter-Matte",
   "gruppe": "OS-REHA-Physio-Matten",
   "href": "kategorie.html?slug=os-rehab-gitter-matte",
   "beschreibung": "OS-Physio-REHAB-Gitter-Matte",
   "titelbild": "assets/img/uploads/5c899f359ba7d.jpeg",
   "produkte": []
  },
  "os-rehab-5-punkt-matte": {
   "slug": "os-rehab-5-punkt-matte",
   "name": "OS-REHAB-5-Punkt-Matte",
   "gruppe": "OS-REHA-Physio-Matten",
   "href": "kategorie.html?slug=os-rehab-5-punkt-matte",
   "beschreibung": "OS-REHAB-5-Punkt-Matte",
   "titelbild": "assets/img/uploads/5c89a066994bd.jpeg",
   "produkte": [
    "os-5-punkt-rehab-trainingsmatte-c"
   ]
  },
  "os-rehab-quadrat-matte": {
   "slug": "os-rehab-quadrat-matte",
   "name": "OS-REHAB Quadrat-Matte",
   "gruppe": "OS-REHA-Physio-Matten",
   "href": "kategorie.html?slug=os-rehab-quadrat-matte",
   "beschreibung": "OS-REHAB Quadrat-Matte",
   "titelbild": "assets/img/uploads/5cccd534814b3.jpeg",
   "produkte": [
    "os-quadrat-rehab-trainingsmatte"
   ]
  },
  "kokos-farbig": {
   "slug": "kokos-farbig",
   "name": "Kokos Farbig",
   "gruppe": "Kokosmatten",
   "href": "kategorie.html?slug=kokos-farbig",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/SL-1024x170-Kokos-farb.JPG",
   "produkte": [
    "kokos-farbig"
   ]
  },
  "kokos-naturfarbig": {
   "slug": "kokos-naturfarbig",
   "name": "Kokos naturfarbig",
   "gruppe": "Kokosmatten",
   "href": "kategorie.html?slug=kokos-naturfarbig",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/SL-1024x170-Kokos-natur.jpg",
   "produkte": [
    "kokosmatten-naturfarbig"
   ]
  },
  "kokos-logomatte": {
   "slug": "kokos-logomatte",
   "name": "Kokos-Logomatte",
   "gruppe": "Kokosmatten",
   "href": "kategorie.html?slug=kokos-logomatte",
   "beschreibung": "Kokos-Logomatte einfarbig und mehrfarbig gestaltet",
   "titelbild": "assets/img/uploads/SL-1024x170-Kokos-gest.JPG",
   "produkte": [
    "kokos-gestaltet"
   ]
  },
  "marschall": {
   "slug": "marschall",
   "name": "MARSCHALL",
   "gruppe": "Aluminium-Matten",
   "href": "kategorie.html?slug=marschall",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/5c6c8e7112268.jpeg",
   "produkte": []
  },
  "diplomat": {
   "slug": "diplomat",
   "name": "Diplomat",
   "gruppe": "Aluminium-Matten",
   "href": "kategorie.html?slug=diplomat",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/5c6c8e3dcd9bb.jpeg",
   "produkte": [
    "aluminium-profilmatte-typ-diplomat-r"
   ]
  },
  "cushion-coil": {
   "slug": "cushion-coil",
   "name": "Cushion Coil",
   "gruppe": "Gummimatten",
   "href": "kategorie.html?slug=cushion-coil",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/SL-1024x170-Kushion.jpg",
   "produkte": []
  },
  "scraper": {
   "slug": "scraper",
   "name": "Scraper",
   "gruppe": "Gummimatten",
   "href": "kategorie.html?slug=scraper",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/SL-1024x170-Scraper.jpg",
   "produkte": []
  },
  "struktura": {
   "slug": "struktura",
   "name": "Struktura",
   "gruppe": "Gummimatten",
   "href": "kategorie.html?slug=struktura",
   "beschreibung": "Gummi-Wabenmatte mit und ohne Bürsteneinsätze Höhen 13,5 und 22mm",
   "titelbild": "assets/img/uploads/5c6c8e1ae39da.jpeg",
   "produkte": []
  },
  "turf": {
   "slug": "turf",
   "name": "Turf",
   "gruppe": "Outdoor-Matten",
   "href": "kategorie.html?slug=turf",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/5c47fbd86f17cjpeg.jpeg",
   "produkte": []
  },
  "iron-horse-mietmatten": {
   "slug": "iron-horse-mietmatten",
   "name": "IRON-HORSE-Mietmatten",
   "gruppe": "Mietmatten",
   "href": "kategorie.html?slug=iron-horse-mietmatten",
   "beschreibung": null,
   "titelbild": "assets/img/uploads/5c4cc0ab73be2jpeg.jpeg",
   "produkte": []
  },
  "waschbecken": {
   "slug": "waschbecken",
   "name": "Waschbecken",
   "gruppe": "Was ist neu",
   "href": "kategorie.html?slug=waschbecken",
   "beschreibung": "Natursteinwaschbecken aus Flußstein, Marmor, Onyx, Fossil",
   "titelbild": "assets/img/uploads/5c788150c5ece.jpeg",
   "produkte": []
  },
  "was-ist-neu": {
   "slug": "was-ist-neu",
   "name": "Was ist neu",
   "gruppe": "(nur Startseite: Featured Category)",
   "href": "kategorie.html?slug=was-ist-neu",
   "beschreibung": "Natursteinwaschbecken aus Flußstein, Marmor, Onyx, Fossil",
   "titelbild": "assets/img/uploads/5c787ff38c28b.jpeg",
   "produkte": []
  }
 },
 "kategorieReihenfolge": [
  "jetprint-einfarbig",
  "ironhorse",
  "ironhorse-xl",
  "designmatten",
  "jet-print-light",
  "katzen-willk",
  "jetprint-design",
  "os-rehab-physio-matten",
  "os-y-matte-wide-balance",
  "os-rehab-basis-matte",
  "os-rehab-bahnmatte",
  "os-rehab-stern-matte",
  "os-rehab-gitter-matte",
  "os-rehab-5-punkt-matte",
  "os-rehab-quadrat-matte",
  "kokos-farbig",
  "kokos-naturfarbig",
  "kokos-logomatte",
  "marschall",
  "diplomat",
  "cushion-coil",
  "scraper",
  "struktura",
  "turf",
  "iron-horse-mietmatten",
  "waschbecken",
  "was-ist-neu"
 ],
 "produkte": {
  "os-5-punkt-rehab-trainingsmatte-c": {
   "productId": 40,
   "slug": "os-5-punkt-rehab-trainingsmatte-c",
   "name": "OS-5-Punkt-REHAB-Trainingsmatte-c",
   "href": "produkt.html?slug=os-5-punkt-rehab-trainingsmatte-c",
   "artikelnummer": "6027003",
   "preisdaten": {
    "einkaufProQm": 0,
    "hinweis": "Kein Einkaufspreis hinterlegt - der Preis ist immer 0,00 €."
   },
   "fixgroessen": [],
   "standardbreitenSelect": [],
   "customOption": null,
   "attribute": [],
   "bilder": [
    "assets/img/produkte/5cca325ee6c13.jpeg"
   ],
   "kachel": "assets/img/produkt-kacheln/5cca325ee6c13.jpeg",
   "kategorien": [
    "os-rehab-physio-matten",
    "os-rehab-5-punkt-matte"
   ],
   "beschreibung": "<p>OS-5-Punkte-Reha-Matte Größe: 115 cm x 130 cm Stückpreis: 154,75 Euro, inkl. MWSt, plus Versandm hiermit können die 5-Dot-Drills (Sprungübung) durchgeführt werden Design im JetPrint-Verfahren gedruckt Abmessungen, auch individuell: die Größen, sowie das Design können auf Wunsch geändert werden. Grundfarbe: nach Ihrer Auswahl aus unserer Palette mit 42 Standardfarben Der Flor besteht aus 100% Polyamid-Nylonfasern Schmutz und Feuchtigkeit von Schuhsohlen werden zwischen den Fasern festhalten. Die Oberfläche erscheint dadurch langandauernd sauber. Waschbarer Nitrilgummi (bis 80&deg;C) ermöglicht eine gründliche Reinigung auch in der Waschmaschine.</p>"
  },
  "os-stern-rehab-trainingsmatte": {
   "productId": 39,
   "slug": "os-stern-rehab-trainingsmatte",
   "name": "OS-Stern-REHAB-Trainingsmatte",
   "href": "produkt.html?slug=os-stern-rehab-trainingsmatte",
   "artikelnummer": "6027004",
   "preisdaten": {
    "einkaufProQm": 52.67,
    "salesFactor": 1.931,
    "standardbreiten": [
     60,
     75,
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [
    {
     "sizeId": "415",
     "price": null,
     "width": 115,
     "length": 130,
     "label": "130 cm x 115 cm"
    },
    {
     "sizeId": "416",
     "price": null,
     "width": 130,
     "length": 130,
     "label": "130 cm x 130 cm"
    },
    {
     "sizeId": "417",
     "price": null,
     "width": 150,
     "length": 130,
     "label": "130 cm x 150 cm"
    }
   ],
   "standardbreitenSelect": [],
   "customOption": "FIXED+CUSTOM_SIZE",
   "attribute": [],
   "bilder": [
    "assets/img/produkte/Stern-601-605.jpg",
    "assets/img/produkte/601-zitronengelb.jpg",
    "assets/img/produkte/JPrint-005.jpg"
   ],
   "kachel": "assets/img/produkt-kacheln/Stern-630-606.jpg",
   "kategorien": [
    "os-rehab-physio-matten",
    "os-rehab-stern-matte"
   ],
   "beschreibung": "<p>OS-Stern-REHAB-Matte Standard- und Sondergrößen JetPrint&trade; REHAB-Matten , gestaltet bis 32 -farbig, Wahl aus 66 Standardfarben schön&amp;sauber Jet-Print-Matten, Designmatten in Wunschgrößen, individuell gestaltet. Für die perfekten REHAB-Übungen JetPrint-REHAB-Matten, die mit Ihrer überragenden Druckqualität ganz neue Maßstäbe setzen. - Gesamthöhe: ca.9,4 mm - Gewicht: ca.2,48 kg / m&amp;sup2; - Individuelle Ausführung nach Kundenwunsch - Rücken: 100 % waschbarer Nitri-Gummi REHAB-Praxis-Matten sorgen für die optimale Unterstützung bei der Arbeit mit Ihren Patienten. PVC-frei - rutschfest, waschbar First Class-Qualität - 2 Jahre Garantie</p>"
  },
  "aluminium-profilmatte-typ-diplomat-r": {
   "productId": 34,
   "slug": "aluminium-profilmatte-typ-diplomat-r",
   "name": "Aluminium-Profilmatte, Typ Diplomat R",
   "href": "produkt.html?slug=aluminium-profilmatte-typ-diplomat-r",
   "artikelnummer": "652601",
   "preisdaten": {
    "einkaufProQm": 265.09,
    "salesFactor": 1.317,
    "standardbreiten": [
     100
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0
   },
   "fixgroessen": [],
   "standardbreitenSelect": [],
   "customOption": null,
   "attribute": [
    {
     "formularname": "attributes[0]",
     "beschriftung": "Höhe",
     "optionen": [
      {
       "value": "1825",
       "label": "12mm"
      },
      {
       "value": "1826",
       "label": "17mm"
      },
      {
       "value": "1827",
       "label": "22mm"
      }
     ]
    },
    {
     "formularname": "attributes[1]",
     "beschriftung": "Profilbreite",
     "optionen": [
      {
       "value": "1828",
       "label": "27,5mm - Standard"
      },
      {
       "value": "1829",
       "label": "44mm - L = Large"
      }
     ]
    },
    {
     "formularname": "attributes[2]",
     "beschriftung": "Format",
     "optionen": [
      {
       "value": "1830",
       "label": "Querformat"
      },
      {
       "value": "1831",
       "label": "Hochformat"
      }
     ]
    },
    {
     "formularname": "attributes[4]",
     "beschriftung": "Kratzkante",
     "optionen": [
      {
       "value": "1837",
       "label": "ohne Kratzkante"
      },
      {
       "value": "1838",
       "label": "mit Kratzkante"
      }
     ]
    }
   ],
   "bilder": [
    "assets/img/produkte/Dip-R.jpg"
   ],
   "kachel": "assets/img/produkt-kacheln/Dip-R.jpg",
   "kategorien": [
    "diplomat"
   ],
   "beschreibung": "<p>Ausf&uuml;hrung<strong>&nbsp;&quot;R&quot; -Original&nbsp;</strong>(Profilbreite 27,5mm) oder<strong>&nbsp;<br />\r\nAusf&uuml;hrung&nbsp;<strong>Large&nbsp;</strong>&quot;LR&quot;&nbsp;</strong><strong>-Original</strong>&nbsp;(Profilbreite 44mm)<br />\r\nAufrollbare strapazierf&auml;hige&nbsp;<a href=\"produkte/aluminium_profilmatten\" title=\"Informationen zu Aluminium-Profilmatten\"><strong>Aluminium-Profil-Eingangsmatte</strong></a>&nbsp;f&uuml;r voll aufliegende Verlegung, aus verwindungssteifen Aluminiumprofilen&nbsp;mit eingelassenen, widerstandsf&auml;higen, witterungsbest&auml;ndigen und austauschbaren&nbsp;<strong>Ripsstreifen&nbsp;</strong>und unterseitiger Trittschalld&auml;mmung.&nbsp;<strong>Auf Wunsch mit zus&auml;tzlicher Kratzkante.</strong><br />\r\nDie 17mm und 22mm hohen Matten k&ouml;nnen&nbsp;<strong>auf Wunsch</strong>&nbsp;auch&nbsp;<strong>mit zus&auml;tzlicher B&uuml;rstenleiste</strong>&nbsp;geliefert werden.</p>\r\n\r\n<p>Jede Matte -mit oder ohne Rahmen- wird auf Kundenwunsch passend zugeschnitten und konfektioniert angefertigt.&nbsp;</p>\r\n\r\n<p>Der Schmutz f&auml;llt in die offenen Zwischenr&auml;ume<br />\r\nPassgenaue Anfertigung in Breite und Tiefe ohne Ausgleichsprofile.<br />\r\nGrunds&auml;tzlich sind alle geometrischen Formen lieferbar</p>\r\n\r\n<p><strong>Einsatzbereich</strong>: &nbsp; &nbsp; &nbsp; Innen- und &uuml;berdachter Au&szlig;enbereich<br />\r\n<strong>Trittfl&auml;che:</strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<strong>Ripsstreifen - Original,</strong>&nbsp;weitere Ripseinlagen: siehe&nbsp;<strong>Diplomat Premium<br />\r\n<strong>Mattenh&ouml;hen: &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;12mm, 17mm oder 22 mm</strong></strong><br />\r\n<strong>Zusatzprofil: &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</strong>auf Wunsch mit<strong>&nbsp;Kratzkanten&nbsp;</strong>f&uuml;r die Mattenh&ouml;hen<strong>&nbsp;12mm, 17mm und 22 mm</strong><br />\r\n<strong>Zusatzprofil: &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</strong>auf Wunsch mit<strong>&nbsp;B&uuml;rstenleisten&nbsp;</strong>f&uuml;r die Mattenh&ouml;hen<strong>&nbsp;17mm und 22 mm</strong><br />\r\n<strong>Statik:</strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; f&uuml;r aufliegende Verlegung<br />\r\n<strong>Verbindung:</strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; durch kunststoffummanteltes verzinktes Stahlseil<br />\r\n<strong>Stababstand: &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</strong>Abstandhalter aus Gummi<br />\r\n<strong>Profilabstand:</strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;5 mm, auf&nbsp;Wunsch auch geringer oder gr&ouml;&szlig;er<br />\r\n<strong>Ma&szlig;e:</strong>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; individuell, nach Wunsch&nbsp;</p>"
  },
  "designmatten-jetprint-velour": {
   "productId": 33,
   "slug": "designmatten-jetprint-velour",
   "name": "Designmatten JetPrint-Velour",
   "href": "produkt.html?slug=designmatten-jetprint-velour",
   "artikelnummer": "4711003N",
   "preisdaten": {
    "einkaufProQm": 39.06,
    "salesFactor": 1.931,
    "standardbreiten": [
     60,
     75,
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [
    {
     "sizeId": "369",
     "price": null,
     "width": 60,
     "length": 40,
     "label": "40 cm x 60 cm"
    },
    {
     "sizeId": "370",
     "price": null,
     "width": 75,
     "length": 50,
     "label": "50 cm x 75 cm"
    },
    {
     "sizeId": "371",
     "price": null,
     "width": 85,
     "length": 75,
     "label": "75 cm x 85 cm"
    },
    {
     "sizeId": "372",
     "price": null,
     "width": 115,
     "length": 85,
     "label": "85 cm x 115 cm"
    },
    {
     "sizeId": "373",
     "price": null,
     "width": 150,
     "length": 85,
     "label": "85 cm x 150 cm"
    },
    {
     "sizeId": "374",
     "price": null,
     "width": 300,
     "length": 85,
     "label": "85 cm x 300 cm"
    },
    {
     "sizeId": "375",
     "price": null,
     "width": 175,
     "length": 115,
     "label": "115 cm x 175 cm"
    },
    {
     "sizeId": "376",
     "price": null,
     "width": 200,
     "length": 150,
     "label": "150 cm x 200 cm"
    }
   ],
   "standardbreitenSelect": [
    60,
    75,
    85,
    115,
    150,
    200
   ],
   "customOption": "FIXED+CUSTOM_SIZE",
   "attribute": [],
   "bilder": [
    "assets/img/produkte/JPL-601-zitronengelb_0.jpg",
    "assets/img/produkte/601-zitronengelb.jpg",
    "assets/img/produkte/005-jet-print-light-5eb35cd44d2e3268777520.jpg",
    "assets/img/produkte/5c47fb75ede37jpeg.jpeg"
   ],
   "kachel": "assets/img/produkt-kacheln/JetPrint-Velour-512x340.jpg",
   "kategorien": [
    "designmatten"
   ],
   "beschreibung": "<p>JetPrint &trade; Velour-Matten , gestaltet bis 32 -farbig, Wahl aus 66 Standardfarben schön&amp;sauber Jet-Print Velour-Matten, Fussmatten in Wunschgrößen, individuell gestaltet Für den perfekten Werbeauftritt sorgen nicht nur Logomatten, sondern auch unsere Werbematten mit dem Motiv Ihrer Wahl. Die Fußmatten werden mit einem speziellen, neu entwickelten 4c-Druckverfahren fotorealistisch in allen Farben bedruckt. Dank dem speziellen Velours wird eine noch höhere Detailgenauigkeit und Bildauflösung erreicht. JetPrint Velour Promotion &ndash; das sind Werbematten, die mit Ihrer überragenden Druckqualität ganz neue Maßstäbe setzen. In der Promotion- und Werbewelt sorgen sie für einen glänzenden Auftritt, bei dem Ihnen die Kunden zu Füßen liegen. Ein innovativer, fotorealistischer Druck in besonders hoher Präzision und Bildauflösung ist dank der speziellen Veloursoberfläche mit dichtem Flor möglich. Statt der Aufnahme von Schmutz konzentrieren sich diese Werbematten ganz auf ihren eigentlichen Zweck: nämlich Ihre Kunden mit der atemberaubenden fotorealistischen Optik zu beeindrucken! PVC-frei - rutschfest, waschbar schon ab 15,08 Euro, inkl. MWSt. - plus Versand in Deutschland First Class-Qualität - 2 Jahre Garantie</p>"
  },
  "designmatten-jetprint-light": {
   "productId": 32,
   "slug": "designmatten-jetprint-light",
   "name": "Designmatten JetPrint-light",
   "href": "produkt.html?slug=designmatten-jetprint-light",
   "artikelnummer": "4711001 MJPLIT",
   "preisdaten": {
    "einkaufProQm": 38.54,
    "salesFactor": 1.931,
    "standardbreiten": [
     60,
     75,
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [
    {
     "sizeId": "248",
     "price": null,
     "width": 60,
     "length": 40,
     "label": "40 cm x 60 cm"
    },
    {
     "sizeId": "249",
     "price": null,
     "width": 75,
     "length": 50,
     "label": "50 cm x 75 cm"
    },
    {
     "sizeId": "250",
     "price": null,
     "width": 85,
     "length": 60,
     "label": "60 cm x 85 cm"
    },
    {
     "sizeId": "251",
     "price": null,
     "width": 120,
     "length": 85,
     "label": "85 cm x 120 cm"
    },
    {
     "sizeId": "252",
     "price": null,
     "width": 150,
     "length": 85,
     "label": "85 cm x 150 cm"
    }
   ],
   "standardbreitenSelect": [
    60,
    75,
    85,
    115,
    150,
    200
   ],
   "customOption": "FIXED+CUSTOM_SIZE",
   "attribute": [],
   "bilder": [
    "assets/img/produkte/JPL-601-zitronengelb_0.jpg",
    "assets/img/produkte/601-zitronengelb.jpg",
    "assets/img/produkte/JPrint-light.jpg",
    "assets/img/produkte/JetPrint-light-colors.jpg"
   ],
   "kachel": "assets/img/produkt-kacheln/Jet-Print%20Light_800x600.jpg",
   "kategorien": [
    "designmatten"
   ],
   "beschreibung": "<p>schön&amp;sauber Jet-Print-light Matten, Fussmatten in Wunschgrößen, individuell gestaltet Diese schön&amp;sdauber Jet-Print-light Schmutzfangmatte ist ein Muss als Fussmatte für jedes Unternehmen, das viel Wert auf die optimale Präsentation des Unternehmens oder seiner Marke legt. Die kräftigen und leuchtenden Farben machen jede individuell gestaltete Fussmatte zu einer Besonderheit, dabei sind dem Design beinahe keine Grenzen gesetzt. Bei der JetPrint-Technik können bis zu 20 (aus derzeit 66 verfügbaren) Farben gedruckt werden und auch feine Linien und Farbverläufe sind reproduzierbar. Wir fertigen Ihnen einen Designentwurf, wenn Sie uns Ihre Designvorlage senden an: \"info@matten.net\" Die Oberseite von schön&amp;sauber Jet-Print-Fussmatten, welche aus 100% trittfestem (High-Twist-Nylon) Polyamid bestehen, nehmen den Schmutz effektiv auf und sehen auch bei starker Schmutzbelastung bei regelmäßiger Reinigung immer aus wie neu. Die Rückenbeschichtung der JetPrint Fussmatte besteht aus 100% waschbarem Nitrilgummi PVC-frei - rutschfest, waschbar schon ab 28,80 Euro, inkl. MWSt. - plus Fracht First Class-Qualität - 2 Jahre Garantie Für die preiswerten schön&amp;sauber Jet-Print Standard-Fussmatten wählen Sie bei &#39;Größe&#39;: \"Custom\" und geben die gewünschte Länge zur vorgegebenen Standardbreite ein. Für beliebige schön&amp;sauber Jet-Print Fussmatten-Sondermaße wählen Sie bei &#39;Größe&#39;: \"Custom\" und geben Sie dort die gewünschten Abmessungen ein. Sie erhalten dann unser Angebot, welches Ihre individuellen Wünsche berücksichtigt.</p>"
  },
  "hinweismatten": {
   "productId": 28,
   "slug": "hinweismatten",
   "name": "Hinweismatten",
   "href": "produkt.html?slug=hinweismatten",
   "artikelnummer": "6390202 MJPRNT",
   "preisdaten": {
    "einkaufProQm": 40.85,
    "salesFactor": 1.931,
    "standardbreiten": [
     60,
     75,
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [
    {
     "sizeId": "397",
     "price": null,
     "width": 60,
     "length": 40,
     "label": "40 cm x 60 cm"
    },
    {
     "sizeId": "398",
     "price": null,
     "width": 70,
     "length": 50,
     "label": "50 cm x 70 cm"
    },
    {
     "sizeId": "399",
     "price": null,
     "width": 90,
     "length": 75,
     "label": "75 cm x 90 cm"
    },
    {
     "sizeId": "400",
     "price": null,
     "width": 120,
     "length": 85,
     "label": "85 cm x 120 cm"
    },
    {
     "sizeId": "401",
     "price": null,
     "width": 150,
     "length": 85,
     "label": "85 cm x 150 cm"
    },
    {
     "sizeId": "402",
     "price": null,
     "width": 175,
     "length": 115,
     "label": "115 cm x 175 cm"
    },
    {
     "sizeId": "403",
     "price": null,
     "width": 200,
     "length": 150,
     "label": "150 cm x 200 cm"
    },
    {
     "sizeId": "404",
     "price": null,
     "width": 300,
     "length": 200,
     "label": "200 cm x 300 cm"
    }
   ],
   "standardbreitenSelect": [
    60,
    75,
    85,
    115,
    150,
    200
   ],
   "customOption": "FIXED+CUSTOM_SIZE",
   "attribute": [
    {
     "formularname": "attributes[2]",
     "beschriftung": "Schrift-Design",
     "optionen": [
      {
       "value": "1781",
       "label": "Herzlich Willkommen"
      },
      {
       "value": "1782",
       "label": "Bitte Abstand halten"
      },
      {
       "value": "1783",
       "label": ""
      }
     ]
    },
    {
     "formularname": "attributes[3]",
     "beschriftung": "Format",
     "optionen": [
      {
       "value": "1784",
       "label": "Querformat"
      },
      {
       "value": "1785",
       "label": "Hochformat"
      }
     ]
    }
   ],
   "bilder": [
    "assets/img/produkte/Herzlich%20Willkommen_512x340.JPG",
    "assets/img/produkte/JPL-601-zitronengelb_0.jpg"
   ],
   "kachel": "assets/img/produkt-kacheln/Herzlich%20Willkommen_512x340.JPG",
   "kategorien": [
    "designmatten"
   ],
   "beschreibung": "<p>Hinweismatten, Jet-Print-light-Matten, in Wunschgrößen, individuell gestaltete Matten mit Hinweisen und Warnsignalen. Die Matten können bis zu 32 aus 66 verfügbaren Farben gedruckt werden. Diese Jet-Print Light-Fussmatte kommt u.a. da zum Einsatz, wo geringe Mattenhöhen erforderlich sind, weil z.B. unter den Türen wenig Platz ist. Die Floorseite von s&amp;s-JetPrint Light-Fussmatten aus 100% trittfestem (High-Twist-Nylon) Polyamid, nimmt außerdem den Schmutz effektiv auf und sieht auch bei extremer Schmutzbelastung und regelmäßiger Reinigung immer wie neu aus. Die Rückenbeschichtung der Jet-Print Light-Fussmatte besteht aus 100% waschbarem Nitrilgummi.</p>"
  },
  "kokos-gestaltet": {
   "productId": 26,
   "slug": "kokos-gestaltet",
   "name": "Kokos, Logomatten",
   "href": "produkt.html?slug=kokos-gestaltet",
   "artikelnummer": "6920003",
   "preisdaten": {
    "einkaufProQm": 0,
    "hinweis": "Kein Einkaufspreis hinterlegt - der Preis ist immer 0,00 €."
   },
   "fixgroessen": [],
   "standardbreitenSelect": [],
   "customOption": null,
   "attribute": [],
   "bilder": [],
   "kachel": "assets/img/produkt-kacheln/5c47fafe5a2a8jpeg.jpeg",
   "kategorien": [
    "kokos-logomatte"
   ],
   "beschreibung": "<p>Erstklassige Kokos-Velourmattte, die nach Kundenwunsch individuell einfarbig oder mehrfarbig gestaltet wird. Äußert strapazierfähige Qualität mit langer Standzeit Geeignet für Wohnanlagen, Mietshäuser, für Kaufhaus- und Geschäftseingänge und den gewerblichen und privaten Bedarf Die Kokosmatten sind besonders für den Innenbereich und überdachte Eingänge geeignet. Sie sorgen für eine effiziente Vorreinigung in allen Eingangsbereichen. Die Matten sind ein Naturprodukt. Ein Ausfasern, Farbunterschiede und gelegentliche Fehlstellen lassen sich bei Naturprodukten nicht ganz ausschliessen. Maßanfertigungen: Kokosmatten-Zuschnitte können in jeder Größe und Form nach Maß angefertigt werden. Wählen Sie die Mattenhöhe aus und geben dazu die gewünschte Größe als Netto-Mattenmaß ein oder das Rahmen-Innenmaß, wenn die Matte eingepaßt werden soll. In diesem Fall wird die Matte mit geringem Abschlag zugeschnitten. Sonderformen (freesize) sind möglich nach Skizze oder Schablone</p>"
  },
  "iron-horse-matte-2": {
   "productId": 25,
   "slug": "iron-horse-matte-2",
   "name": "IRON-HORSE-2",
   "href": "produkt.html?slug=iron-horse-matte-2",
   "artikelnummer": "630001",
   "preisdaten": {
    "einkaufProQm": 50,
    "salesFactor": 1.6,
    "standardbreiten": [
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [],
   "standardbreitenSelect": [],
   "customOption": null,
   "attribute": [],
   "bilder": [
    "assets/img/produkte/5c47fa2b58b3djpeg.jpeg"
   ],
   "kachel": "assets/img/produkt-kacheln/5c47fa2b58b3djpeg.jpeg",
   "kategorien": [
    "ironhorse"
   ],
   "beschreibung": "<p>Die Iron-Horse-Matte ist das Arbeitspferd unter den Schmutzfangmatten mit größter Schmutzaufnahme und Feuchteaufnahme. Die Iron-Horse-Matte ist liegefest am Boden, stolpersicher und kann auch mit Fahrzeugen überfahren werden. Die umlaufende Trittkante erleichtert das Überfahren mit Kinderwagen, Rollatoren, Rollstühlen, Einkaufwagen und rollbaren Koffern. Die Matte ist waschbar, kann im \"Tümmler\" getrocknet werden und trocknet auch auf dem Boden liegend sehr schnell ab.</p>"
  },
  "jetprint-light-logo": {
   "productId": 22,
   "slug": "jetprint-light-logo",
   "name": "JetPrint light Logo",
   "href": "produkt.html?slug=jetprint-light-logo",
   "artikelnummer": "6300202N",
   "preisdaten": {
    "einkaufProQm": 43.39,
    "salesFactor": 1.97,
    "standardbreiten": [
     60,
     75,
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [
    {
     "sizeId": "360",
     "price": null,
     "width": 60,
     "length": 40,
     "label": "40 cm x 60 cm"
    },
    {
     "sizeId": "361",
     "price": null,
     "width": 75,
     "length": 50,
     "label": "50 cm x 75 cm"
    },
    {
     "sizeId": "362",
     "price": null,
     "width": 85,
     "length": 75,
     "label": "75 cm x 85 cm"
    },
    {
     "sizeId": "363",
     "price": null,
     "width": 115,
     "length": 85,
     "label": "85 cm x 115 cm"
    },
    {
     "sizeId": "364",
     "price": null,
     "width": 300,
     "length": 85,
     "label": "85 cm x 300 cm"
    },
    {
     "sizeId": "365",
     "price": null,
     "width": 175,
     "length": 115,
     "label": "115 cm x 175 cm"
    },
    {
     "sizeId": "366",
     "price": null,
     "width": 200,
     "length": 150,
     "label": "150 cm x 200 cm"
    }
   ],
   "standardbreitenSelect": [
    60,
    75,
    85,
    115,
    150,
    200
   ],
   "customOption": "FIXED+CUSTOM_SIZE",
   "attribute": [],
   "bilder": [
    "assets/img/produkte/JPL-601-zitronengelb_0.jpg"
   ],
   "kachel": "assets/img/produkt-kacheln/5c47fb75ede37jpeg.jpeg",
   "kategorien": [
    "jet-print-light"
   ],
   "beschreibung": "<p>Diese Jet-Print Light-Schmutzfangmatte ist eine hervorragende Alternative im Vergleich zu unseren Jet-Print-Fussmatten für Ihr Unternehmen, wenn es viel Wert auf die optimale Präsentation Ihres Hauses oder Ihrer Marke gehtt. Die gleichen kräftigen und leuchtenden Farben wie bei den JetPrint-Matten machen die nach Ihren Wünschen gestaltete Fussmatte zu einem Unikat, wobei dem Design fast keine Grenzen gesetzt sind. Bei der JetPrint-light-Technik können bis zu 20 (aus derzeit 44 verfügbaren) Farben gedruckt werden und auch feine Linien und Farbverläufe sind reproduzierbar. Diese Jet-Print Light-Fussmatte kommt häufig da zum Einsatz, wo geringe Mattenhöhen erforderlich sind, weil z.B. unter den Türen wenig Platz ist. Die Floorseite von s&amp;s-JetPrint Light-Fussmatten, welche aus 100% trittfestem (High-Twist-Nylon) Polyamid bestehen, nimmt den Schmutz effektiv auf und sieht auch bei extremer Schmutzbelastung und regelmäßiger Reinigung immer wie neu aus. Die Rückenbeschichtung der Jet-Print Light-Fussmatte besteht aus 100% waschbarem Nitrilgummi. Für die preiswerteren Standard-Jet-Print Light-Fussmatten klicken Sie auf \"Online kaufen\" und geben die gewünschte Farbe und Länge zur vorgegebenen Standardbreite ein. Für beliebige Jet-Print Light-Fussmatten-Sondermaße klicken Sie auf \"Anfrage\" und geben Sie dort die gewünschten Abmessungen sowie die Farbe ein. Sie erhalten dann unser Angebot, welches Ihre individuellen Wünsche berücksichtigt.</p>"
  },
  "kokos-farbig": {
   "productId": 19,
   "slug": "kokos-farbig",
   "name": "Kokos, farbig",
   "href": "produkt.html?slug=kokos-farbig",
   "artikelnummer": "6920002",
   "preisdaten": {
    "einkaufProQm": 53.88,
    "salesFactor": 1.375,
    "standardbreiten": [
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 1
   },
   "fixgroessen": [],
   "standardbreitenSelect": [],
   "customOption": null,
   "attribute": [
    {
     "formularname": "attributes[0]",
     "beschriftung": "Höhe",
     "optionen": [
      {
       "value": "179",
       "label": "schwarz - Mattenhöhe: 17mm"
      },
      {
       "value": "195",
       "label": "grau - Mattenhöhe: 17mm"
      },
      {
       "value": "199",
       "label": "rot - Mattenhöhe: 17mm"
      },
      {
       "value": "201",
       "label": "blau - Mattenhöhe: 17mm"
      }
     ]
    }
   ],
   "bilder": [
    "assets/img/produkte/5c47fa829d279jpeg.jpeg"
   ],
   "kachel": "assets/img/produkt-kacheln/5c47fa829d279jpeg.jpeg",
   "kategorien": [
    "kokos-farbig"
   ],
   "beschreibung": "<p>Erstklassige, strapazierfähige Qualität mit langer Standzeit Geeignet für Wohnanlagen, Mietshäuser, für Kaufhaus- und Geschäftseingänge und den gewerblichen und privaten Bedarf Die Kokosmatten sind besonders für den Innenbereich und überdachte Eingänge geeignet. Sie sorgen für eine effiziente Vorreinigung in allen Eingangsbereichen. Die Matten sind ein Naturprodukt. Ein Ausfasern, Farbunterschiede und gelegentliche Fehlstellen lassen sich bei Naturprodukten nicht ganz ausschliessen. Maßanfertigungen: Kokosmatten-Zuschnitte können in jeder Größe und Form nach Maß angefertigt werden. Wählen Sie die Mattenhöhe aus und geben dazu die gewünschte Größe als Netto-Mattenmaß ein oder das Rahmen-Innenmaß, wenn die Matte eingepaßt werden soll. In diesem Fall wird die Matte mit geringem Abschlag zugeschnitten. Sonderformen (freesize) sind möglich nach Skizze oder Schablone</p>"
  },
  "kokosmatten-naturfarbig": {
   "productId": 18,
   "slug": "kokosmatten-naturfarbig",
   "name": "Kokos, natur",
   "href": "produkt.html?slug=kokosmatten-naturfarbig",
   "artikelnummer": "6920001N",
   "preisdaten": {
    "einkaufProQm": 41.84,
    "salesFactor": 1.375,
    "standardbreiten": [
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 1
   },
   "fixgroessen": [],
   "standardbreitenSelect": [],
   "customOption": null,
   "attribute": [
    {
     "formularname": "attributes[0]",
     "beschriftung": "Mattenhöhe",
     "optionen": [
      {
       "value": "148",
       "label": "13/14mm"
      },
      {
       "value": "158",
       "label": "16/17mm"
      },
      {
       "value": "161",
       "label": "20mm"
      },
      {
       "value": "163",
       "label": "22mm"
      },
      {
       "value": "164",
       "label": "24mm"
      },
      {
       "value": "165",
       "label": "27mm"
      },
      {
       "value": "166",
       "label": "30mm"
      }
     ]
    }
   ],
   "bilder": [
    "assets/img/produkte/kokos-natur_512x340.jpg"
   ],
   "kachel": "assets/img/produkt-kacheln/kokos-natur_512x340.jpg",
   "kategorien": [
    "kokos-naturfarbig"
   ],
   "beschreibung": "<p>Material: Erstklassige, strapazierfähig Kokosvelour-Qualität mit langer Standzeit mit flexibler Vinyl-Rückenbeschichtung. Geeignet für Wohnanlagen, Mietshäuser, für Kaufhaus- und Geschäftseingänge und den gewerblichen und privaten Bedarf Farbe: natur Höhen: 14, 17, 20, 22 , 24, 27 oder 30 mm Bahnenbreite: bis 200cm Rollenlänge: bis 12m Maßanfertigungen: Kokosmatten werden in jeder gewünschten Größe geliefert Sonderformen (freesize) sind möglich nach Skizze oder Schablone. (bei Breiten über 200cm , gegebenenfalls mehrteilig oder verschweißt/verklebt) Wählen Sie die Mattenhöhe sowie die Wunschmaße, dann Klick auf \"Warenkorb\". Kokosfasern sind ein Naturprodukte. Ein Ausfasern sowie Farbunterschiede und gelegentliche Fehlstellen lassen sich bei Naturprodukten nicht ganz ausschliessen.</p>"
  },
  "os-quadrat-rehab-trainingsmatte": {
   "productId": 12,
   "slug": "os-quadrat-rehab-trainingsmatte",
   "name": "OS-Quadrat-REHAB-Trainingsmatte",
   "href": "produkt.html?slug=os-quadrat-rehab-trainingsmatte",
   "artikelnummer": "6027001",
   "preisdaten": {
    "einkaufProQm": 0,
    "hinweis": "Kein Einkaufspreis hinterlegt - der Preis ist immer 0,00 €."
   },
   "fixgroessen": [],
   "standardbreitenSelect": [],
   "customOption": null,
   "attribute": [],
   "bilder": [
    "assets/img/produkte/5cce29fead941.jpeg"
   ],
   "kachel": "assets/img/produkt-kacheln/5cce29fead941.jpeg",
   "kategorien": [
    "os-rehab-physio-matten",
    "os-rehab-quadrat-matte"
   ],
   "beschreibung": "<p>OS-Quadrat-Reha-Matte Größe: 115 cm x 130 cm Stückpreis: 154,75 Euro, inkl. MWSt, plus Versand Design im JetPrint-Verfahren gedruckt Abmessungen, auch individuell: die Größen, sowie das Design können auf Wunsch geändert werden. Grundfarbe: nach Ihrer Auswahl aus unserer Palette mit 42 Standardfarben Der Flor besteht aus 100% Polyamid-Nylonfasern Schmutz und Feuchtigkeit von Schuhsohlen werden zwischen den Fasern festhalten. Die Oberfläche erscheint dadurch langandauernd sauber. Waschbarer Nitrilgummi (bis 80&deg;C) ermöglicht eine gründliche Reinigung auch in der Waschmaschine.</p>"
  },
  "designmatten-jetprint": {
   "productId": 10,
   "slug": "designmatten-jetprint",
   "name": "Designmatten JetPrint",
   "href": "produkt.html?slug=designmatten-jetprint",
   "artikelnummer": "4711000N",
   "preisdaten": {
    "einkaufProQm": 52.67,
    "salesFactor": 1.931,
    "standardbreiten": [
     60,
     75,
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [
    {
     "sizeId": "273",
     "price": null,
     "width": 60,
     "length": 40,
     "label": "40 cm x 60 cm"
    },
    {
     "sizeId": "274",
     "price": null,
     "width": 75,
     "length": 50,
     "label": "50 cm x 75 cm"
    },
    {
     "sizeId": "275",
     "price": null,
     "width": 85,
     "length": 60,
     "label": "60 cm x 85 cm"
    },
    {
     "sizeId": "276",
     "price": null,
     "width": 120,
     "length": 85,
     "label": "85 cm x 120 cm"
    },
    {
     "sizeId": "277",
     "price": null,
     "width": 150,
     "length": 85,
     "label": "85 cm x 150 cm"
    }
   ],
   "standardbreitenSelect": [
    60,
    75,
    85,
    115,
    150,
    200
   ],
   "customOption": "FIXED+CUSTOM_SIZE",
   "attribute": [],
   "bilder": [
    "assets/img/produkte/JPL-601-zitronengelb_0.jpg",
    "assets/img/produkte/601-zitronengelb.jpg",
    "assets/img/produkte/005-jet-print-light-5eb35cd44d2e3268777520.jpg",
    "assets/img/produkte/5c47fb75ede37jpeg.jpeg"
   ],
   "kachel": "assets/img/produkt-kacheln/JetPrint-Logo-616.jpg",
   "kategorien": [
    "designmatten"
   ],
   "beschreibung": "<p>schön&amp;sauber Jet-Print Design-Fussmatten in Standardgrößen oder Wunschgrößen, individuell gestaltet Diese schön&amp;sauber Jet-Print Design-Schmutzfangmatte ist ein Muss als Fussmatte für jedes Unternehmen, das viel Wert auf die optimale Präsentation des Unternehmens oder seiner Marke legt. Die kräftigen und leuchtenden Farben machen jede individuell gestaltete Fussmatte zu einer Besonderheit, dabei sind dem Design beinahe keine Grenzen gesetzt. Bei der JetPrint-Technik können bis zu 20 (aus derzeit 66 verfügbaren) Farben gedruckt werden. Auch feine Linien und Farbverläufe sind reproduzierbar. Auf Wunsch fertigen wir Ihnen kostenfrei Designentwürfe, wenn Sie uns Ihre Designvorlagen senden an: \"info@matten.net\" Die Oberseite von schön&amp;sauber Jet-Print-Fussmatten, welche aus 100% trittfestem (High-Twist-Nylon) Polyamid bestehen, nehmen den Schmutz effektiv auf und sehen auch bei starker Schmutzbelastung bei regelmäßiger Reinigung immer aus wie neu. Die Rückenbeschichtung der JetPrint Fussmatte besteht aus 100% waschbarem Nitrilgummi PVC-frei - rutschfest, waschbar schon ab 27,40 Euro, inkl. MWSt. - plus Fracht First Class-Qualität - 5 Jahre Garantie Für die preiswerten schön&amp;sauber Jet-Print-Fussmatten wählen Sie entweder die &#39;Größe&#39; aus oder geben unter \"Custom\" Ihre Wunschmaße ein. Falls Sie zunächst nur ein Angebot wünschen, geben Sie die Menge und Maße ein und wählen statt \"Warenkorb\" &gt; \"Angebot\".</p>"
  },
  "jetprint-matten-design": {
   "productId": 9,
   "slug": "jetprint-matten-design",
   "name": "JetPrint Matten, Design",
   "href": "produkt.html?slug=jetprint-matten-design",
   "artikelnummer": "6320011N",
   "preisdaten": {
    "einkaufProQm": 54.63,
    "salesFactor": 1.931,
    "standardbreiten": [
     60,
     75,
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [
    {
     "sizeId": "377",
     "price": null,
     "width": 60,
     "length": 40,
     "label": "40 cm x 60 cm"
    },
    {
     "sizeId": "378",
     "price": null,
     "width": 75,
     "length": 50,
     "label": "50 cm x 75 cm"
    },
    {
     "sizeId": "379",
     "price": null,
     "width": 85,
     "length": 75,
     "label": "75 cm x 85 cm"
    },
    {
     "sizeId": "380",
     "price": null,
     "width": 115,
     "length": 85,
     "label": "85 cm x 115 cm"
    },
    {
     "sizeId": "381",
     "price": null,
     "width": 150,
     "length": 85,
     "label": "85 cm x 150 cm"
    },
    {
     "sizeId": "382",
     "price": null,
     "width": 300,
     "length": 85,
     "label": "85 cm x 300 cm"
    },
    {
     "sizeId": "383",
     "price": null,
     "width": 175,
     "length": 115,
     "label": "115 cm x 175 cm"
    },
    {
     "sizeId": "418",
     "price": null,
     "width": 200,
     "length": 150,
     "label": "150 cm x 200 cm"
    },
    {
     "sizeId": "419",
     "price": null,
     "width": 240,
     "length": 150,
     "label": "150 cm x 240 cm"
    }
   ],
   "standardbreitenSelect": [
    60,
    75,
    85,
    115,
    150,
    200
   ],
   "customOption": "FIXED+CUSTOM_SIZE",
   "attribute": [],
   "bilder": [
    "assets/img/produkte/601-zitronengelb.jpg",
    "assets/img/produkte/Eing-Logo-512x340.jpg"
   ],
   "kachel": "assets/img/produkt-kacheln/Eing-Logo-512x340.jpg",
   "kategorien": [
    "jetprint-design"
   ],
   "beschreibung": "<p>schön&amp;sauber Jet-Print Matten, Fussmatten in Wunschgrößen, individuell gestaltet Diese schön&amp;sauber Jet-Print Schmutzfangmatte ist ein Muss als Fussmatte für jedes Unternehmen, das viel Wert auf die optimale Präsentation des Unternehmens oder seiner Marke legt. Die kräftigen und leuchtenden Farben machen jede individuell gestaltete Fussmatte zu einer Besonderheit, dabei sind dem Design beinahe keine Grenzen gesetzt. Bei der JetPrint-Technik können bis zu 32 (aus derzeit 66 verfügbaren) Farben gedruckt werden und auch feine Linien und Farbverläufe sind reproduzierbar Die Oberseite von schön&amp;sauber Jet-Print-Fussmatten, welche aus 100% trittfestem (High-Twist-Nylon) Polyamid bestehen, nehmen den Schmutz effektiv auf und sehen auch bei starker Schmutzbelastung bei regelmäßiger Reinigung immer aus wie neu. Die Rückenbeschichtung der JetPrint Fussmatte besteht aus 100% waschbarem Nitrilgummi PVC-frei - rutschfest, waschbar schon ab 30,13 Euro, inkl. MWSt. - plus Fracht First Class-Qualität - 2 Jahre Garantie Unsere Matten können in beliebigen Größen bis zu 200cm Breite und 700cm Länge mit Logos und Ihren individuellen Designs, auf Wunsch auch in Sonderformen gefertigt werden. Standardgrößen sind wegen des geringeren Verschnitts preiswerter herzustellen und günstiger zu liefern. Geben Sie einfach die gewünschten Farben sowie Breite und Länge ein. Es werden automatisch die Preise für Standardgrößen oder Sondergrößen angezeigt. Wenn Sie direkt bestellen wollen klicken Sie auf \"IN DEN WARENKORB\" Falls Sie vorab unser Angebot wünschen, kliclen Sie auf \"Anfrage\" Ihre Logos oder Designvorlagen, auch Handskizzen senden Sie uns bitte über unseren Link -&gt; Formvorlage senden</p>"
  },
  "mjplit-jetprint-light-1-farbig": {
   "productId": 8,
   "slug": "mjplit-jetprint-light-1-farbig",
   "name": "JetPrint light 1-farbig",
   "href": "produkt.html?slug=mjplit-jetprint-light-1-farbig",
   "artikelnummer": "6300001N",
   "preisdaten": {
    "einkaufProQm": 40.85,
    "salesFactor": 1.87,
    "standardbreiten": [
     60,
     75,
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [
    {
     "sizeId": "351",
     "price": 18.1,
     "width": 60,
     "length": 40,
     "label": "40 cm x 60 cm"
    },
    {
     "sizeId": "352",
     "price": 27.85,
     "width": 75,
     "length": 50,
     "label": "50 cm x 75 cm"
    },
    {
     "sizeId": "353",
     "price": 40.6,
     "width": 90,
     "length": 60,
     "label": "60 cm x 90 cm"
    },
    {
     "sizeId": "354",
     "price": 73.6,
     "width": 115,
     "length": 85,
     "label": "85 cm x 115 cm"
    },
    {
     "sizeId": "355",
     "price": 96.5,
     "width": 150,
     "length": 85,
     "label": "85 cm x 150 cm"
    },
    {
     "sizeId": "356",
     "price": 228.1,
     "width": 200,
     "length": 150,
     "label": "150 cm x 200 cm"
    },
    {
     "sizeId": "357",
     "price": 448.3,
     "width": 300,
     "length": 200,
     "label": "200 cm x 300 cm"
    }
   ],
   "standardbreitenSelect": [
    60,
    75,
    85,
    115,
    150,
    200
   ],
   "customOption": null,
   "attribute": [],
   "bilder": [
    "assets/img/produkte/JP-601.jpg"
   ],
   "kachel": "assets/img/produkt-kacheln/JetPrint%20light%201-farbig.jpg",
   "kategorien": [
    "jetprint-einfarbig"
   ],
   "beschreibung": "<p>schön&amp;sauber Jet-Print-light Fussmatten einfarbig Diese schön&amp;sauber Jet-Print-light Schmutzfangmatte ist ein Muss als Fussmatte für jedes Unternehmen, das viel Wert auf die optimale Präsentation des Unternehmens oder seiner Marke legt. Die kräftigen und leuchtenden Farben machen jede individuell gestaltete Fussmatte zu einer Besonderheit, dabei sind dem Design beinahe keine Grenzen gesetzt. Bei der JetPrint-Technik können bis zu 20 (aus derzeit 44 verfügbaren) Farben gedruckt werden. Die Oberseite von schön&amp;sauber Jet-Print-Fussmatten, welche aus 100% trittfestem (High-Twist-Nylon) Polyamid bestehen, nehmen den Schmutz effektiv auf und sehen auch bei starker Schmutzbelastung bei regelmäßiger Reinigung immer aus wie neu. Die Rückenbeschichtung der JetPrint Fussmatte besteht aus 100% waschbarem Nitrilgummi. Für die preiswerteren schön&amp;sauber Jet-Print-light Fussmatten klicken Sie auf \"Online kaufen\" und geben die gewünschte Farbe und Länge zur vorgegebenen Standardbreite ein. Für beliebige schön&amp;sauber Jet-Print-light Fussmatten-Sondermaße klicken Sie auf \"Anfrage\" und geben Sie dort die gewünschten Abmessungen sowie die Farbe ein. Sie erhalten dann unser Angebot, welches Ihre individuellen Wünsche berücksichtigt.</p>"
  },
  "jetprint-premium-1-farbig": {
   "productId": 7,
   "slug": "jetprint-premium-1-farbig",
   "name": "JetPrint Premium 1-farbig",
   "href": "produkt.html?slug=jetprint-premium-1-farbig",
   "artikelnummer": "6301000N",
   "preisdaten": {
    "einkaufProQm": 52.67,
    "salesFactor": 1.931,
    "standardbreiten": [
     60,
     75,
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [
    {
     "sizeId": "3",
     "price": 24.2,
     "width": 60,
     "length": 40,
     "label": "40 cm x 60 cm"
    },
    {
     "sizeId": "4",
     "price": 39,
     "width": 75,
     "length": 50,
     "label": "50 cm x 75 cm"
    },
    {
     "sizeId": "5",
     "price": 41.75,
     "width": 85,
     "length": 60,
     "label": "60 cm x 85 cm"
    },
    {
     "sizeId": "392",
     "price": 67.95,
     "width": 90,
     "length": 75,
     "label": "75 cm x 90 cm"
    },
    {
     "sizeId": "393",
     "price": 98.4,
     "width": 115,
     "length": 85,
     "label": "85 cm x 115 cm"
    },
    {
     "sizeId": "394",
     "price": 128.6,
     "width": 150,
     "length": 85,
     "label": "85 cm x 150 cm"
    },
    {
     "sizeId": "395",
     "price": 203.6,
     "width": 175,
     "length": 115,
     "label": "115 cm x 175 cm"
    },
    {
     "sizeId": "396",
     "price": 304.1,
     "width": 200,
     "length": 150,
     "label": "150 cm x 200 cm"
    }
   ],
   "standardbreitenSelect": [
    60,
    75,
    85,
    115,
    150,
    200
   ],
   "customOption": null,
   "attribute": [],
   "bilder": [
    "assets/img/produkte/601-zitronengelb.jpg"
   ],
   "kachel": "assets/img/produkt-kacheln/637-leuchtblau.JPG",
   "kategorien": [
    "jetprint-einfarbig"
   ],
   "beschreibung": "<p>Hinterlassen Sie bei Ihren Kunden und Besuchern einen bleibenden Eindruck mit unseren Individuell nach Ihren Wünschen angefertigten, qualitativ hochwertigen Fussmatten - schön &amp; sauber Wählen Sie die Fussmatte in Ihrer Wunschgröße und in einer unserer 44 Standardfarben aus. Auch Sonderfarben nach Pantone, HKS und RAL sind gegen Aufpreis möglich. Senden Sie Ihre Wünsche an info@matten.de Produktdetails: Hoher Flor aus getwistetem Garn. Der Floor besteht aus 100% high twist nylon (HTN). Der Matten-Rücken besteht aus 100% waschbarem Nitrilgummi 5 Jahre Garantie bei fachgerechter Pflege Einsatzbereiche, hervorragend geeeignet u.a. für: Eingänge, Durchgänge, Lifte, Verwaltungen, Hotels, Restaurants, Küchen, Werbeflächen,</p>"
  },
  "jetprint-premium": {
   "productId": 6,
   "slug": "jetprint-premium",
   "name": "JetPrint-Premium",
   "href": "produkt.html?slug=jetprint-premium",
   "artikelnummer": "6300000N",
   "preisdaten": {
    "einkaufProQm": 52.67,
    "salesFactor": 1.931,
    "standardbreiten": [
     60,
     75,
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 0.9
   },
   "fixgroessen": [
    {
     "sizeId": "343",
     "price": 24.2,
     "width": 60,
     "length": 40,
     "label": "40 cm x 60 cm"
    },
    {
     "sizeId": "344",
     "price": 37.5,
     "width": 75,
     "length": 50,
     "label": "50 cm x 75 cm"
    },
    {
     "sizeId": "345",
     "price": 54.1,
     "width": 90,
     "length": 60,
     "label": "60 cm x 90 cm"
    },
    {
     "sizeId": "346",
     "price": 98.6,
     "width": 115,
     "length": 85,
     "label": "85 cm x 115 cm"
    },
    {
     "sizeId": "347",
     "price": 128.5,
     "width": 150,
     "length": 85,
     "label": "85 cm x 150 cm"
    },
    {
     "sizeId": "348",
     "price": 258.2,
     "width": 300,
     "length": 85,
     "label": "85 cm x 300 cm"
    },
    {
     "sizeId": "349",
     "price": 203.2,
     "width": 175,
     "length": 115,
     "label": "115 cm x 175 cm"
    },
    {
     "sizeId": "350",
     "price": 304.1,
     "width": 200,
     "length": 150,
     "label": "150 cm x 200 cm"
    }
   ],
   "standardbreitenSelect": [
    60,
    75,
    85,
    115,
    150,
    200
   ],
   "customOption": "FIXED+CUSTOM_SIZE",
   "attribute": [],
   "bilder": [
    "assets/img/produkte/601-zitronengelb.jpg"
   ],
   "kachel": "assets/img/produkt-kacheln/JPrint-005.jpg",
   "kategorien": [
    "designmatten"
   ],
   "beschreibung": "<p><strong>sch&ouml;n&amp;sauber JetPrint Matten, Fussmatten in Wunschgr&ouml;&szlig;en, individuell gestaltet</strong></p>\r\n\r\n<p>Diese sch&ouml;n&amp;sdauber Jet-Print Schmutzfangmatte ist ein Muss als Fussmatte f&uuml;r jedes Unternehmen, das viel Wert auf die optimale Pr&auml;sentation des Unternehmens oder seiner Marke legt. Die kr&auml;ftigen und leuchtenden Farben machen jede individuell gestaltete Fussmatte zu einer Besonderheit, dabei sind dem Design beinahe keine Grenzen gesetzt. Bei der JetPrint-Technik k&ouml;nnen bis zu 20 (aus derzeit 44 verf&uuml;gbaren) Farben gedruckt werden und auch feine Linien und Farbverl&auml;ufe sind reproduzierbaer</p>\r\n\r\n<p>Die Oberseite von sch&ouml;n&amp;sauber Jet-Print-Fussmatten, welche aus 100% trittfestem (High-Twist-Nylon) Polyamid bestehen, nehmen den Schmutz effektiv auf und sehen auch bei starker Schmutzbelastung bei regelm&auml;&szlig;iger Reinigung immer aus wie neu. Die R&uuml;ckenbeschichtung der JetPrint Fussmatte besteht aus 100% waschbarem Nitrilgummi<br />\r\nPVC-frei - rutschfest, waschbar<br />\r\nschon ab 22,60 Euro, inkl. MWSt. -&nbsp;plus Fracht</p>"
  },
  "iron-horse-matte": {
   "productId": 4,
   "slug": "iron-horse-matte",
   "name": "IRON-HORSE-Mietmatte",
   "href": "produkt.html?slug=iron-horse-matte",
   "artikelnummer": "64000121",
   "preisdaten": {
    "einkaufProQm": 0,
    "hinweis": "Kein Einkaufspreis hinterlegt - der Preis ist immer 0,00 €."
   },
   "fixgroessen": [
    {
     "sizeId": "23",
     "price": null,
     "width": 85,
     "length": 50,
     "label": "50 cm x 85 cm"
    },
    {
     "sizeId": "24",
     "price": null,
     "width": 85,
     "length": 60,
     "label": "60 cm x 85 cm"
    },
    {
     "sizeId": "25",
     "price": null,
     "width": 115,
     "length": 85,
     "label": "85 cm x 115 cm"
    },
    {
     "sizeId": "26",
     "price": null,
     "width": 300,
     "length": 85,
     "label": "85 cm x 300 cm"
    },
    {
     "sizeId": "27",
     "price": null,
     "width": 175,
     "length": 115,
     "label": "115 cm x 175 cm"
    },
    {
     "sizeId": "407",
     "price": null,
     "width": 200,
     "length": 150,
     "label": "150 cm x 200 cm"
    },
    {
     "sizeId": "408",
     "price": null,
     "width": 250,
     "length": 150,
     "label": "150 cm x 250 cm"
    }
   ],
   "standardbreitenSelect": [
    85,
    115,
    150,
    200
   ],
   "customOption": null,
   "attribute": [],
   "bilder": [],
   "kachel": "assets/img/produkt-kacheln/5c47fa2b58b3djpeg.jpeg",
   "kategorien": [
    "ironhorse"
   ],
   "beschreibung": "<p>Die Iron-Horse-Matte ist das Arbeitspferd unter den Schmutzfangmatten mit größter Schmutzaufnahme und Feuchteaufnahme. Die Iron-Horse-Matte ist liegefest am Boden, stolpersicher und kann auch mit Fahrzeugen überfahren werden. Die umlaufende Trittkante erleichtert das Überfahren mit Kinderwagen, Rollatoren, Rollstühlen, Einkaufwagen und rollbaren Koffern. Die Matte ist waschbar, kann im \"Tümmler\" getrocknet werden und trocknet auch auf dem Boden liegend sehr schnell ab.</p>"
  },
  "iron-horse-1-farbige-und-melierte-schmutzfangmatten": {
   "productId": 1,
   "slug": "iron-horse-1-farbige-und-melierte-schmutzfangmatten",
   "name": "IRON-HORSE 1-farbige und melierte Schmutzfangmatten",
   "href": "produkt.html?slug=iron-horse-1-farbige-und-melierte-schmutzfangmatten",
   "artikelnummer": "63000",
   "preisdaten": {
    "einkaufProQm": 27.89,
    "salesFactor": 1.8,
    "standardbreiten": [
     85,
     115,
     150,
     200
    ],
    "sondermassFaktor": 1.25,
    "singleColorFaktor": 1
   },
   "fixgroessen": [],
   "standardbreitenSelect": [],
   "customOption": null,
   "attribute": [],
   "bilder": [
    "assets/img/produkte/2-Black%20Pearl%20646.png"
   ],
   "kachel": "assets/img/produkt-kacheln/5c4c1812b732ejpeg.jpeg",
   "kategorien": [
    "ironhorse"
   ],
   "beschreibung": "<p>IRON-HORSE wurde geschaffen, um höchsten Anforderungen zu entsprechen, überzeugt durch extreme Schmutz-Halte-Kapazität und Strapazierfähigkeit und stellt mit 5 harmonisch abgestimmten Melierungen für jeden Raum bzw. Eingangsbereich eine optische Aufwertung dar. Die 100% voll durchgefärbte Polyamid- Nylonfaser (solution-dyed) nimmt bis zu 4 kg/qm Schmutz und Feuchtigkeit auf, hält diesen zwischen den Fasern fest und senkt damit den Reinigungsaufwand erheblich. Die Rückenbeschichtung besteht aus 100% bis zu 80&deg;C maschinenwaschbarem Nitrilgummi. Zum bündigen Verlegen in vorhandene Rahmen können die Matten auch ohne umlaufenden Rand geliefert und dann vor Ort sehr einfach mittels Hakenklinge eingepaßt werden Längen bis max.700cm Matten-Gesamthöhe: ca.9mm Gesamtgewicht: ca.2,6 kg/qm Unsere Farben: 646-black-pearl / 647-granite / 648-midnight-grey / 676-black-cedar / 681-black-steel sind bis zu einer maximalen Breite von 200cm inkl. Rand lieferbar (ohne Rand minus 4cm) . Die Preise werden unter Berücksichtigung der Standardlängen und Sondermaße kalkuliert.</p>"
  }
 },
 "produktReihenfolge": [
  "os-5-punkt-rehab-trainingsmatte-c",
  "os-stern-rehab-trainingsmatte",
  "aluminium-profilmatte-typ-diplomat-r",
  "designmatten-jetprint-velour",
  "designmatten-jetprint-light",
  "hinweismatten",
  "kokos-gestaltet",
  "iron-horse-matte-2",
  "jetprint-light-logo",
  "kokos-farbig",
  "kokosmatten-naturfarbig",
  "os-quadrat-rehab-trainingsmatte",
  "designmatten-jetprint",
  "jetprint-matten-design",
  "mjplit-jetprint-light-1-farbig",
  "jetprint-premium-1-farbig",
  "jetprint-premium",
  "iron-horse-matte",
  "iron-horse-1-farbige-und-melierte-schmutzfangmatten"
 ],
 "gruppen": [
  {
   "label": "Fussmatten",
   "kategorien": [
    {
     "id": 2,
     "label": "JetPrint-einfarbig",
     "slug": "jetprint-einfarbig"
    },
    {
     "id": 14,
     "label": "IronHorse",
     "slug": "ironhorse"
    },
    {
     "id": 15,
     "label": "IronHorse XL",
     "slug": "ironhorse-xl"
    }
   ]
  },
  {
   "label": "Logomatten",
   "kategorien": [
    {
     "id": 19,
     "label": "Designmatten",
     "slug": "designmatten"
    },
    {
     "id": 20,
     "label": "Jet Print light",
     "slug": "jet-print-light"
    },
    {
     "id": 21,
     "label": "Katzen Willk",
     "slug": "katzen-willk"
    },
    {
     "id": 22,
     "label": "JetPrint-Design",
     "slug": "jetprint-design"
    }
   ]
  },
  {
   "label": "OS-REHA-Physio-Matten",
   "kategorien": [
    {
     "id": 32,
     "label": "OS-REHAB-Physio-Matten",
     "slug": "os-rehab-physio-matten"
    },
    {
     "id": 36,
     "label": "OS-Y-Matte, Wide Balance",
     "slug": "os-y-matte-wide-balance"
    },
    {
     "id": 37,
     "label": "OS-REHAB Basis-Matte",
     "slug": "os-rehab-basis-matte"
    },
    {
     "id": 38,
     "label": "OS-REHAB-Bahnmatte",
     "slug": "os-rehab-bahnmatte"
    },
    {
     "id": 39,
     "label": "OS-REHAB-Stern-Matte",
     "slug": "os-rehab-stern-matte"
    },
    {
     "id": 40,
     "label": "OS-REHAB-Gitter-Matte",
     "slug": "os-rehab-gitter-matte"
    },
    {
     "id": 41,
     "label": "OS-REHAB-5-Punkt-Matte",
     "slug": "os-rehab-5-punkt-matte"
    },
    {
     "id": 42,
     "label": "OS-REHAB Quadrat-Matte",
     "slug": "os-rehab-quadrat-matte"
    }
   ]
  },
  {
   "label": "Kokosmatten",
   "kategorien": [
    {
     "id": 16,
     "label": "Kokos Farbig",
     "slug": "kokos-farbig"
    },
    {
     "id": 17,
     "label": "Kokos naturfarbig",
     "slug": "kokos-naturfarbig"
    },
    {
     "id": 43,
     "label": "Kokos-Logomatte",
     "slug": "kokos-logomatte"
    }
   ]
  },
  {
   "label": "Aluminium-Matten",
   "kategorien": [
    {
     "id": 11,
     "label": "MARSCHALL",
     "slug": "marschall"
    },
    {
     "id": 12,
     "label": "Diplomat",
     "slug": "diplomat"
    }
   ]
  },
  {
   "label": "Gummimatten",
   "kategorien": [
    {
     "id": 24,
     "label": "Cushion Coil",
     "slug": "cushion-coil"
    },
    {
     "id": 25,
     "label": "Scraper",
     "slug": "scraper"
    },
    {
     "id": 26,
     "label": "Struktura",
     "slug": "struktura"
    }
   ]
  },
  {
   "label": "Outdoor-Matten",
   "kategorien": [
    {
     "id": 23,
     "label": "Turf",
     "slug": "turf"
    }
   ]
  },
  {
   "label": "Mietmatten",
   "kategorien": [
    {
     "id": 28,
     "label": "IRON-HORSE-Mietmatten",
     "slug": "iron-horse-mietmatten"
    }
   ]
  },
  {
   "label": "Was ist neu",
   "kategorien": [
    {
     "id": 35,
     "label": "Waschbecken",
     "slug": "waschbecken"
    }
   ]
  }
 ],
 "zuordnung": {
  "iron-horse-1-farbige-und-melierte-schmutzfangmatten": {
   "dePfad": "/fussmatten/standard-schmutzfangmatten/64000121",
   "deZwilling": null,
   "anmerkung": "unsicher — Namensabgleich, drei IRON-HORSE-Kandidaten (64000121 gewaehlt: allgemeinste Variante)"
  },
  "iron-horse-matte": {
   "dePfad": "/miet-mattenservice/mietmatten",
   "deZwilling": null,
   "anmerkung": "Mietservice — Artikel ohne freie Masse; Preis kommt live vom Altsystem (kein EK/m2 auf matten.net)"
  },
  "jetprint-premium": {
   "dePfad": "/fussmatten/standard-schmutzfangmatten/6300000",
   "deZwilling": "/fussmatten/standard-schmutzfangmatten/6300000-a",
   "anmerkung": "einzige Nummer, deren Basis uebereinstimmt (6300000N <-> 6300000)"
  },
  "jetprint-premium-1-farbig": {
   "dePfad": "/fussmatten/standard-schmutzfangmatten/6300000",
   "deZwilling": "/fussmatten/standard-schmutzfangmatten/6300000-a",
   "anmerkung": "entschieden: identische Preisdaten wie pid 6 (52,67 / 1,931), de-Name \"einfarbig\""
  },
  "mjplit-jetprint-light-1-farbig": {
   "dePfad": "/fussmatten/fussmatten/jetprint_matten-light-einfarbig",
   "deZwilling": "/fussmatten/fussmatten/jetprint_matten-light-einfarbig-a",
   "anmerkung": "Name deckungsgleich (JetPrint light, einfarbig)"
  },
  "jetprint-matten-design": {
   "dePfad": "/logomatten/6300201-logomatte",
   "deZwilling": "/logomatten/6300201-logomatte-a",
   "anmerkung": "entschieden: EK 54,63 EUR/m2 identisch mit dem Stammdatensatz 6300201-Logomatte (Spec 14.2 H)"
  },
  "designmatten-jetprint": {
   "dePfad": "/logomatten/6300201-logomatte",
   "deZwilling": "/logomatten/6300201-logomatte-a",
   "anmerkung": "thematisch: de-Standardartikel fuer individuell gestaltete JetPrint-Logomatten"
  },
  "os-quadrat-rehab-trainingsmatte": {
   "dePfad": "/logomatten/os-physio-rehab-matten/6320301-quadrat",
   "deZwilling": null,
   "anmerkung": "Volltextsuche \"Quadrat-REHAB\" eindeutig; Preis live (kein EK/m2 auf matten.net)"
  },
  "kokosmatten-naturfarbig": {
   "dePfad": "/kokosmatten/kokosmatte-natur-kauf",
   "deZwilling": null,
   "anmerkung": "einziger naturfarbiger Kokos-Kaufartikel; freie Masse spezialoption[...][flaeche][x|y]"
  },
  "kokos-farbig": {
   "dePfad": "/kokosmatten/kokosmatte-farbig-k",
   "deZwilling": null,
   "anmerkung": "Suche 6920002 -> 302 auf Kokos-Landingpage; Name deckungsgleich"
  },
  "jetprint-light-logo": {
   "dePfad": "/logomatten/jetprint_light-matten",
   "deZwilling": "/logomatten/jetprint_light-matten-a",
   "anmerkung": "unsicher — derselbe de-Artikel wie pid 32 (Designmatten JetPrint-light)"
  },
  "iron-horse-matte-2": {
   "dePfad": "/fussmatten/standard-schmutzfangmatten/64000122",
   "deZwilling": null,
   "anmerkung": "geraten: \"-2\" als zweite IRON-HORSE-Bauform (bis 150 cm Breite) gelesen"
  },
  "kokos-gestaltet": {
   "dePfad": "/kokosmatten/beflockte_kokosmatte-a",
   "deZwilling": null,
   "anmerkung": "ist selbst Anfrageartikel — nur Anfrage; Suche 6920003 trifft genau diesen Artikel"
  },
  "hinweismatten": {
   "dePfad": "/logomatten/6300201-logomatte",
   "deZwilling": "/logomatten/6300201-logomatte-a",
   "anmerkung": "entschieden: jetprint-designs-hinweise hat kein Kaufformular; Hinweismatten sind JetPrint-Matten mit Textdruck — Schrift-Design und Format gehen in den Kommentar"
  },
  "designmatten-jetprint-light": {
   "dePfad": "/logomatten/jetprint_light-matten",
   "deZwilling": "/logomatten/jetprint_light-matten-a",
   "anmerkung": "unsicher — derselbe de-Artikel wie pid 22 (JetPrint light Logo)"
  },
  "designmatten-jetprint-velour": {
   "dePfad": "/logomatten/6400201-velourmatte",
   "deZwilling": "/logomatten/6400201-velourmatte-a",
   "anmerkung": "Suche \"Velourmatten\" liefert genau diesen Artikel"
  },
  "aluminium-profilmatte-typ-diplomat-r": {
   "dePfad": "/aluminium_profilmatten/52601",
   "deZwilling": "/aluminium_profilmatten/52601-a",
   "anmerkung": "unsicher — 652601 enthaelt 52601 (\"Diplomat\"); Typ-R-Merkmal passt auch auf 52603 / 522RN-Ma-a"
  },
  "os-stern-rehab-trainingsmatte": {
   "dePfad": "/logomatten/os-physio-rehab-matten/6320304",
   "deZwilling": null,
   "anmerkung": "Suche \"Stern-REHAB\" eindeutig"
  },
  "os-5-punkt-rehab-trainingsmatte-c": {
   "dePfad": "/logomatten/os-physio-rehab-matten/6320307-5punkt",
   "deZwilling": null,
   "anmerkung": "Suche \"5-Punkt-REHAB\" eindeutig; Preis live (kein EK/m2 auf matten.net)"
  }
 },
 "farben": {
  "200": {
   "name": "Anthrazit",
   "hex": "#5f5f5f"
  },
  "220": {
   "name": "Hellgrau",
   "hex": "#aaaaaa"
  },
  "305": {
   "name": "Rot",
   "hex": "#b51a00"
  },
  "430": {
   "name": "Sand",
   "hex": "#ccc3af"
  },
  "485": {
   "name": "Braun",
   "hex": "#7a4900"
  },
  "600": {
   "name": "Weiß",
   "hex": "#ffffff"
  },
  "601": {
   "name": "Zitronengelb",
   "hex": "#fffe28"
  },
  "602": {
   "name": "Gelb",
   "hex": "#fdd302"
  },
  "603": {
   "name": "Melone",
   "hex": "#ff9a02"
  },
  "604": {
   "name": "Orange",
   "hex": "#f56703"
  },
  "605": {
   "name": "Signalrot",
   "hex": "#c02832"
  },
  "606": {
   "name": "Kupfer",
   "hex": "#980000"
  },
  "607": {
   "name": "Bordeaux",
   "hex": "#ab0065"
  },
  "608": {
   "name": "Rosa",
   "hex": "#fdade2"
  },
  "609": {
   "name": "Dunkellila",
   "hex": "#9900c1"
  },
  "610": {
   "name": "Helllila",
   "hex": "#c099d2"
  },
  "611": {
   "name": "Dunkelviolett",
   "hex": "#66019b"
  },
  "612": {
   "name": "Hellviolett",
   "hex": "#bfacfd"
  },
  "613": {
   "name": "Königsblau",
   "hex": "#0051ba"
  },
  "614": {
   "name": "Hellblau",
   "hex": "#97acff"
  },
  "615": {
   "name": "Dunkelltürkis",
   "hex": "#00c1c1"
  },
  "616": {
   "name": "Helltürkis",
   "hex": "#aef2f1"
  },
  "617": {
   "name": "Dunkelgrün",
   "hex": "#019982"
  },
  "618": {
   "name": "Hellgrün",
   "hex": "#7fd3bb"
  },
  "619": {
   "name": "Naturgrün",
   "hex": "#087701"
  },
  "620": {
   "name": "Leuchtgrün",
   "hex": "#14b004"
  },
  "621": {
   "name": "Aubergine",
   "hex": "#500c1b"
  },
  "622": {
   "name": "Flieder",
   "hex": "#e2d2d3"
  },
  "623": {
   "name": "Marineblau",
   "hex": "#162053"
  },
  "624": {
   "name": "Rauchblau",
   "hex": "#81aecf"
  },
  "625": {
   "name": "Dunkelrotbraun",
   "hex": "#9f2f2e"
  },
  "626": {
   "name": "Hellbraun",
   "hex": "#ffd2c0"
  },
  "627": {
   "name": "Dunkelgraubraun",
   "hex": "#4b2928"
  },
  "628": {
   "name": "Hellgraubraun",
   "hex": "#d2c2c2"
  },
  "629": {
   "name": "Hellgrau",
   "hex": "#d2cfc8"
  },
  "630": {
   "name": "Mittelgrau",
   "hex": "#8a908c"
  },
  "631": {
   "name": "Dunkelgrau",
   "hex": "#4a4a56"
  },
  "632": {
   "name": "Schwarz",
   "hex": "#010103"
  },
  "633": {
   "name": "Champagner",
   "hex": "#e5dece"
  },
  "634": {
   "name": "Beige",
   "hex": "#d4bf92"
  },
  "635": {
   "name": "Lachs",
   "hex": "#fa8c71"
  },
  "636": {
   "name": "Schwarzblau",
   "hex": "#00324b"
  },
  "637": {
   "name": "Leuchtblau",
   "hex": "#0186c9"
  },
  "638": {
   "name": "Weinrot",
   "hex": "#77283d"
  },
  "639": {
   "name": "Kirschrot",
   "hex": "#b11e2e"
  },
  "640": {
   "name": "Sattgrün",
   "hex": "#028752"
  },
  "641": {
   "name": "Olivgrün",
   "hex": "#666900"
  },
  "642": {
   "name": "Mint",
   "hex": "#f3ffb3"
  },
  "643": {
   "name": "Gold",
   "hex": "#8a6a39"
  },
  "644": {
   "name": "Mink",
   "hex": "#6a6054"
  },
  "645": {
   "name": "181-38-112",
   "hex": "#ad0268"
  },
  "646": {
   "name": "203-198-27",
   "hex": "#cbc61b"
  },
  "650": {
   "name": "229-150-44",
   "hex": "#e5962c"
  }
 },
 "startseite": {
  "datenschutzhinweisHtml": "<p style=\"text-align:center\"><span style=\"font-size:12px\"><span style=\"background-color:#ffffff\">Datenschutzerkl&auml;rung der FUCHSIUS multi-media GmbH</span><br />\r\n<span style=\"background-color:#ffffff\">als Betreiber dieser Seite &bdquo;www.matten.de&ldquo; nutzt Cookies. Wir behandeln Ihre Daten sehr sorgsam und vertraulich, entsprechend der neuen gesetzlichen EU-Datenschutzverordnung (DSGVO) und unserer angef&uuml;gten Datenschutzerkl&auml;rung. </span><a href=\"pages.html?s=data-protection\"><span style=\"background-color:#ffffff\">Mehr Information</span></a><span style=\"background-color:#ffffff\">.</span></span></p>",
  "karussell": [
   {
    "bild": "assets/img/slides/SL-1024x170-Eing.jpg",
    "alt": "Eingangsmatten, Schmutzfangmatten",
    "href": "#",
    "titel": "Eingangsmatten, Schmutzfangmatten",
    "untertitel": "einfarbig, meliert oder gestaltet"
   },
   {
    "bild": "assets/img/slides/SL-1024x170-willkommen.jpg",
    "alt": "Ihre Grußbotschaft im Eingang",
    "href": "#",
    "titel": "Ihre Grußbotschaft im Eingang",
    "untertitel": "Herzlich Willkommen"
   },
   {
    "bild": "assets/img/slides/SL-1024x170-Alu-RCB.JPG",
    "alt": "Alu-Profil",
    "href": "kategorie.html?slug=diplomat",
    "titel": "Alu-Profil",
    "untertitel": "Aluminium-Profilmatten"
   },
   {
    "bild": "assets/img/slides/SL-1024x170-Rollen.JPG",
    "alt": "Fussmatten",
    "href": "kategorie.html?slug=jetprint-einfarbig",
    "titel": "Fussmatten",
    "untertitel": "150 verschiedene Farben"
   },
   {
    "bild": "assets/img/slides/SL-1024x170-1farbig.jpg",
    "alt": "Fussmatten",
    "href": "#",
    "titel": "Fussmatten",
    "untertitel": "1-farbig, beliebige Größe"
   },
   {
    "bild": "assets/img/slides/SL-1024x170-Logo.jpg",
    "alt": "Logomatten, Designmatten",
    "href": "#",
    "titel": "Logomatten, Designmatten",
    "untertitel": "bis 20-farbig und fotorealistisch"
   },
   {
    "bild": "assets/img/slides/SL-1024x170-OS-Phys.jpg",
    "alt": "REHAB-Matten",
    "href": "#",
    "titel": "REHAB-Matten",
    "untertitel": "Physio-Trainingsmatten"
   },
   {
    "bild": "assets/img/slides/SL-1024x170-VierJahr.jpg",
    "alt": "Eingangs-Fussmatten",
    "href": "#",
    "titel": "Eingangs-Fussmatten",
    "untertitel": "Standards und individuelle Größen, Formen und Farben"
   },
   {
    "bild": "assets/img/slides/SL-1024x170-Logo.jpg",
    "alt": "Fussmatten",
    "href": "#",
    "titel": "Fussmatten",
    "untertitel": "Schmutzfangmatten, einfarbig und gestaltet"
   },
   {
    "bild": "assets/img/slides/SL-1024x170-Aluminium.jpg",
    "alt": "Aluminium-Profilmatten",
    "href": "#",
    "titel": "Aluminium-Profilmatten",
    "untertitel": "verschiedene Trittflächen/-Kombinationen"
   },
   {
    "bild": "assets/img/slides/SL-1024x170-Washtafel.jpg",
    "alt": "Marmor, Onyx, Fossil, Terrazzo",
    "href": "#",
    "titel": "Marmor, Onyx, Fossil, Terrazzo",
    "untertitel": "Waschbecken, Wannen, Badzubehör"
   }
  ],
  "featured": {
   "ueberschrift": "Featured Category (German)",
   "slug": "was-ist-neu",
   "href": "kategorie.html?slug=was-ist-neu",
   "bild": "assets/img/uploads/5c787ff38c28b.jpeg",
   "caption": "Was ist neu"
  },
  "topAngebote": [
   "iron-horse-1-farbige-und-melierte-schmutzfangmatten",
   "iron-horse-matte",
   "jetprint-premium-1-farbig",
   "mjplit-jetprint-light-1-farbig",
   "designmatten-jetprint"
  ],
  "mattenfuchsText": "Seit mehr als 35 Jahren liefern wir Fussmatten in einer Vielzahl von Standardmaßen und nahezu beliebigen Wunschmaßen in mehr als 100 verschiedenen Farben, einfarbig und individuell nach Kundenwunsch gestaltet. Wir haben in dieser Zeit weltweit in vielen namhaften Firmen, Top-Handelshäusern und Filialunternehmen, Hotels, Verwaltungen, Ladengeschäften und Privathaushalten für saubere Eingangsbereiche und den Schutz der angrenzenden Böden gesorgt. Unsere Angebotspalette ist in den zurückliegenden Jahren stetig gewachsen und wurde den permanent steigenden Anforderungen laufend angepasst. So haben wir für jedes Schmutzproblem -und auch für die passende Werbung für Ihr Haus- immer eine hervorragende Lösung parat. \"NICHTS\"  gibt es nicht bei uns. Wir sind stets für Sie unter \"info@matten.de\" erreichbar und freuen uns über Ihre Anfrage.  Ihr Mattenfuchs-Team",
  "vorteile": [
   {
    "bild": "assets/img/uploads/5c36ad55d8af8jpeg.jpeg",
    "alt": "Best Price",
    "text": "Best Price"
   },
   {
    "bild": "assets/img/uploads/5c36ad9452e74jpeg.jpeg",
    "alt": "International shipping",
    "text": "International shipping"
   }
  ]
 },
 "texte": {
  "agb": {
   "titel": "AGB",
   "html": "<p><strong>Allgemeine Geschäftsbedingungen der FUCHSIUS multi-media GmbH</strong> (<a href=\"media/datei/AGB%20fmm-01-18.pdf\">AGB-Download</a>)</p>\n<p><strong>I. Allgemeines - Bestandteil unserer AGB ist unsere</strong></p>\n<p><strong>Datenschutzerklärung nach EU-Datenschutzverordnung (DSGVO)</strong></p>\n<p>1. Nachstehende Geschäftsbedingungen sind Vertragsbestandteile für alle gegenwärtigen und zukünftigen Lieferverträge, sofern sie nicht im Vertrag ausdrücklich abgeändert oder ausgeschlossen werden; frühere etwa anders lautende Bedingungen verlieren hiermit ihre Gültigkeit.</p>\n<p>2. Abweichende Bedingungen des Bestellers verpflichten den Lieferer nicht, auch wenn er ihnen nicht ausdrücklich widerspricht. Durch Erteilung von Aufträgen erkennt der Besteller diese Lieferungsbedingungen als rechtsverbindlich an.</p>\n<p>3. Der Vertrag bleibt auch bei rechtlichem Unwirksamwerden einzelner Punkte seiner Bedingungen in den restlichen Punkten verbindlich.</p>\n<p>4. Speziell angefertigte und/oder zugeschnittene Produkte sind grundsätzlich vom Umtausch ausgeschlossen.</p>\n<p><strong>II. Umfang der Lieferpflicht</strong></p>\n<p>1. Der Umfang der Bestellung ergibt sich aus dem Angebot und/oder der schriftlichen Auftragsbestätigung des Lieferers. Bei mündlicher, telefonischer oder eMail-Bestellung ist die schriftliche Auftragsbestätigung des Lieferers maßgebend. Bis zur schriftlichen Auftragsbestätigung sind die Angebote freibleibend; Zwischenverkauf bleibt vorbehalten. Nebenabreden bedürfen der schriftlichen Bestätigung. Zuschneiden gehört nicht zum Lieferumfang, sofern nicht besonders bestätigt.</p>\n<p>2. Die zu dem Angebot gehörenden Unterlagen, z. B. Maße, sind nur annähernd maßgebend, soweit sie nicht ausdrücklich als verbindlich bezeichnet sind. Der Lieferer behält sich technische Änderungen während der Lieferzeit vor, soweit der Kaufgegenstand hinsichtlich Funktion und Aussehen nicht grundsätzlich geändert wird und die Änderung für den Vertragspartner zumutbar ist.</p>\n<p>3. Die in den Prospektunterlagen bzw. in den angefügten Dateien oder in unserer Internetpräsenz abgebildeten Mattenfarben können von den Originalfarben abweichen, da wegen der auf Papier und Textil verschiedenen Lichtreflexion, bzw. unkalibrierten Monitoren, die Farben unterschiedlich erscheinen. Verbindlich können nur die Originalfarbmuster sein.</p>\n<p>4. Unsere Standard-Florbreiten für Matten betragen u.a. ca.82cm, 112cm, 147cm und 197cm als Rohware, d.h. vor dem Vulkanisieren. Matten mit umlaufendem Gummirand werden mit Standard-Ausgangsbreiten von ca. 85cm, 115cm, 150cm und 200cm gefertigt (Maße vor dem Vulkanisieren) Beim Beschichten (Vulkanisieren) und im späteren Gebrauch schrumpfen die Matten erfahrungsgemäß ca.3-5 %</p>\n<p>5. Falls Matten in Rahmen, Windfang, Türstock etc. bündig eingepasst oder passend zu einer abzudeckenden Fläche verlegt werden sollen, benötigen wir die genauen Rahmen-Innenmaße, bzw. die Maße der abzudeckenden Fläche. Gem.Pkt.4 notwendige Schrumpfungs-Zuschläge bis zu einer maximalen Breite von 200cm mit Rand, bzw.197cm ohne Rand (Maß vor dem Beschichten und Vulkanisieren), werden von uns kalkuliert und individuell angeboten. Die Matten werden auf Wunsch mit Übermaß produziert, vor Auslieferung mehrfach vorgewaschen und zwischen-getrocknet. Die Matten werden dann mit Übermaß, gegebenenfalls ohne umlaufenden Rand geliefert und müssen bauseits vor Ort eingeschnitten werden.</p>\n<p>6. Unsere Matten werden, falls nichts anderes vereinbart ist, in rechtwinkliger Form mit oder ohne Rand geliefert. Nichtrechtwinklige Matten (Freesize-Ausführung) können ebenfalls mit oder ohne umlaufenden Gummirand gefertigt werden. Dazu benötigen wir genaue Vorlagen mit den entsprechenden Maßangaben. Da der individuelle Zuschnitt nicht maschinell erfolgen kann, muss der höhere zeitliche Aufwand für den manuellen Zuschnitt zusätzlich kalkuliert werden. Dieses ist von der Form und Art des Zuschnittes abhängig. Wir benötigen die Einzelheiten zu dem gewünschten Zuschnitt mit genauen Maßangaben, möglichst mit einer Skizze.</p>\n<p>7. An Kostenanschlägen, Zeichnungen und anderen Unterlagen des Angebotes behält sich der Lieferer Eigentums- und Urheberrecht vor; sie dürfen Dritten nicht zugänglich gemacht werden. Sie sind dem Lieferer, wenn der Auftrag nicht erteilt wird, auf Verlangen unverzüglich zurück zu geben.</p>\n<p>8. Teillieferungen sind zulässig.</p>\n<p>9. Der Abnehmer bestätigt durch diese Auftragserteilung, dass die bestellten Marken- oder Firmenzeichen sowie Schriftzüge verwendet werden dürfen.</p>\n<p><strong>III. Preise und Zahlungsbedingungen</strong></p>\n<p>1. Die Preise gelten ab Betrieb oder Niederlassung des Lieferers ausschließlich Verpackung und Fracht. Diese werden extra berechnet, falls im Angebot oder in der Auftragsbestätigung es nicht ausdrücklich anders vereinbart wurde.</p>\n<p>2. Die Verpackung wird nicht zurückgenommen, es sei denn, es handelt sich um Anlieferung auf Palette, falls die Eigentum des Lieferers sind.</p>\n<p>3. Treten nach Ablauf von drei Monaten nach Vertragsabschluss Materialpreis- oder Lohn- und Gehaltserhöhungen ein oder werden Steuern und Abgaben erhöht, so ist der Lieferer berechtigt, seine Preise entsprechend anzugleichen. Anzahlungen und Vorausleistungen sind ohne Einfluss auf die Preise. Sie werden gutgeschrieben und auf den sich endgültig ergebenden Preis verrechnet.</p>\n<p>4. Erstlieferungen und Aufträge unter 350,00 € Warenwert können ohne Abzug per Nachnahme berechnet werden, sonst gilt Zahlung netto Kasse sofort nach Rechnungsdatum, sofern nicht mit der Auftragsbestätigung andere Zahlungskonditionen vereinbart wurden.</p>\n<p>Der Lieferer behält sich vor, bei Aufträgen von 3.000,00 € und höher ein Drittel der Auftragssumme nach Erhalt der Auftragsbestätigung, ein Drittel nach Anzeige der Versandbereitschaft und den Rest nach erfolgter Lieferung in bar anzufordern. Verzögert sich die Auslieferung aus Gründen, die der Lieferer nicht zu vertreten hat, so kann der Lieferer auch bei Aufträgen bis zu 3.000,00 € zwei Drittel der Vertragssumme als Anzahlung verlangen.</p>\n<p>Die Annahme von Schecks und Wechseln erfolgt nur zahlungshalber und ohne Gewähr für Protest. Die Kosten für Diskontierung und Einziehen gehen zu Lasten des Bestellers. Im Falle des Verzuges ist der Lieferer berechtigt, Zinsen in Höhe der für Kreditanspruchnahme banküblichen Sätze zu berechnen.</p>\n<p>5. Werden nach Vertragsabschluss Umstände bekannt, die geeignet sind, die Kreditwürdigkeit des Bestellers zu mindern, so werden sämtliche Forderungen ohne Rücksicht auf die Laufzeit etwa hereingenommener Wechsel fällig. Derartige Umstände berechtigten den Lieferer ferner, noch ausstehende Leistungen nur gegen Vorauszahlung oder Sicherheitsleistung auszuführen sowie nach Ablauf einer angemessenen Nachfrist vom Vertrag zurückzutreten oder Schadenersatz wegen Nichterfüllung zu verlangen.</p>\n<p><strong>IV. Eigentumsvorbehalt</strong></p>\n<p>l. Alle Lieferungen erfolgen unter Eigentumsvorbehalt. Das Eigentum geht erst dann auf den Besteller über, wenn er seine Verbindlichkeit ten aus den Lieferungen voll getilgt hat. Das gilt auch dann, wenn der Kaufpreis für bestimmte, vom Besteller bezeichnete Warenlieferungen bezahlt ist. Bei laufender Rechnung gilt das vorbehaltende Eigentum als Sicherung für die Saldoforderung des Lieferers.</p>\n<p>2. Der Besteller ist berechtigt, die gelieferte Ware im gewöhnlichen Geschäftsverkehr zu seinen normalen Geschäftsbedingungen zu veräußern. Verpfändungen oder Sicherheitsübereignungen sind ihm untersagt.</p>\n<p>3. Von einer Pfändung oder jeder anderen Beeinträchtigung seiner Rechte durch Dritte hat der Besteller den Lieferer unverzüglich zu benachrichtigen. Veräußert der Besteller die gelieferte Ware, so tritt er schon jetzt bis zur völligen Tilgung alle die ihm aus der Veränderung entstehenden Forderungen gegen seine Abnehmer mit allen Nebenrechten an den Lieferer ab. Auf Verlangen des Lieferers ist der Besteller verpflichtet, die Abtretung seinen Abnehmern bekannt zu geben und dem Lieferer die zur Geltendmachung seiner Rechte erforderlichen Auskünfte zu geben.</p>\n<p>4. Die Geltendmachung des Eigentumsvorbehaltes sowie die Pfändung des Liefergegenstandes gelten nicht als Rücktritt vom Vertrag, sofern nicht gesetzlich etwas anderes bestimmt ist.</p>\n<p><strong>V. Lieferfrist</strong></p>\n<p>1. Die Lieferfrist rechnet nach erfolgter Auftragsbestätigung erst vom Tage der Klarstellung sämtlicher Einzelheiten des Auftrages an, d.h. nach Eingang aller Unterlagen. Sie ist unverbindlich, aber so bemessen, dass sie bei regelmäßigem Ablauf der Fertigung einbehalten werden kann.</p>\n<p>2. Betriebsstörungen im eigenen Betrieb oder bei Unterlieferern, Fälle höherer Gewalt, Krieg, Aufruhr, Aussperrung, Streik, Brand, Beschlagnahme, Ausschusswerden eines wichtigen Arbeitsstückes, Einschränkung der Energieversorgung sowie der verspätete Eingang wesentlicher Rohstoffe befreien den Lieferer von der Einhaltung der Lieferfristen. Sollte sich die Lieferung durch diese Umstände verzögern oder unmöglich werden und den Lieferer kein Verschulden treffen, so sind Schadenersatzansprüche des Bestellers ausgeschossen Im Falle objektiver Unmöglichkeit haben beide Parteien das Recht, vom Vertrag zurückzutreten.</p>\n<p><strong>Vl. Gefahrübergang, Versand und Rücksendung von Waren</strong></p>\n<p>1. Der Lieferer versendet stets auf Rechnung und Gefahr des Bestellers, auch bei Franko-Lieferungen. Die Gefahr geht auf den Besteller über, sobald die Sendung das Lager verlassen hat.</p>\n<p>Vom gleichen Zeitpunkt an haftet der Besteller für Schäden, die Dritten gegenüber entstehen können. Ist die Ware versandbereit und verzögert sich die Versendung oder die Annahme aus Gründen, die der Lieferer nicht zu vertreten hat, so geht die Gefahr mit dem Zugang der Anzeige der Versandbereitschaft auf den Besteller über. Der Lieferer ist berechtigt, diese Ware auf Kosten des Bestellers und für dessen Rechnung und Gefahr anderweitig einzulagern, wenn die Abnahmeverpflichtung um länger als 4 Wochen verzögert wird.</p>\n<p>2. Versandweg, Versandart und Versandmittel sind unter Ausschluss der Haftung und ohne Gewähr für billigsten Transport dem Lieferer überlassen.</p>\n<p>3. Rücksendekosten: Käufer trägt die unmittelbaren Kosten der Rücksendung der Waren Rücknahmebedingungen: siehe nachfolgende Angaben:</p>\n<p>Widerrufsrecht für Verbraucher unter Berücksichtigung von §1 Allgeneines, Punkt 4</p>\n<p>(Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die</p>\n<p>überwiegend weder Ihrer gewerblichen noch ihrer selbstständigen beruflichen Tätigkeit zugerechnet werden können).</p>\n<p>Sie haben das Recht unter Berücksichtigung von §1 Allgeneines, Punkt 4. binnen 1 Monat ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>\n<p>Die Widerrufsfrist beträgt 1 Monat ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat. Um Ihr Widerrufsrecht auszuüben, müssen Sie uns, die</p>\n<p>FUCHSIUS multi-media GmbH</p>\n<p>Dieter Fuchsius</p>\n<p>Fischertrasse 2</p>\n<p>85737 Ismaning / Deutschland</p>\n<p>Telefon : 089 - 54 55 82 64</p>\n<p>E-Mail: info@matten.net</p>\n<p>mit einer eindeutigen Erklärung über Ihren Entschluss informieren (z.B. durch einen mit der Post versandten Brief oder mittels E-Mail), diesen Vertrag zu widerrufen. Sie können den Widerruf formlos nur in schriftlicher Form, z.B. per eMail oder Briefpost vornehmen.</p>\n<p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung Ihres Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>\n<p>Folgen des Widerrufs</p>\n<p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet. Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.</p>\n<p>Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden. Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.</p>\n<p><strong>Vll. Transportschäden und Versicherung</strong></p>\n<p>1. Transportschäden müssen beim Empfang der Ware sofort angezeigt werden. Bei Bahntransporten ist von der Güterabfertigung eine bahnamtliche Bescheinigung zur Geltendmachung von Ersatzansprüchen über den Schaden zu verlangen. Diese ist uns umgehend einzusenden. Wird verabsäumt, diese Bescheinigung zu beschaffen, wird jeder Ersatzanspruch abgelehnt.</p>\n<p>2. Die Versicherung der Waren gegen Transportschäden wird nur auf Wunsch des Bestellers vorgenommen. Der Lieferer berechnet in diesem Fall die ihm entstandenen Kosten, übernimmt aber keine Verantwortung für die Durchführung der Versicherurig.</p>\n<p><strong>Vlll. Gewährleistungsansprüche</strong></p>\n<p>Offensichtliche Mängel müssen binnen 8 Tagen nach Empfang der Waren schriftlich gerügt werden. Maßabweichungen (auch wie unter II.4 beschrieben) und Farbabweichungen, insbesondere mögliche Farbabweichungen zwischen Anzeige auf Monitoren und Printvorlagen zu den Originalfarben sind unvermeidbar und können nicht beanstandet werden. Verbindlich sind nur unsere Originalfarbmuster, wobei bei Nachdrucken zu vorangegangenen Lieferungen Farbunterschiede von Charge zu Charge möglich sind.</p>\n<p>Zu beachten sind auch bei gleichen Farbnummern mögliche Farbunterschiede bei unterschiedlichen Floor- und Mattenqualitäten. Dieses gilt besonders, wenn verschiedene Mattenqualitäten nebeneinander verlegt werden. Beachten Sie von der Floorrichtung und vom Umgebungslicht abhängige unterschiedliche Farbenwiedergaben.</p>\n<p>Ist die Ware infolge von Material- und/oder Verarbeitungsfehlern mangelhaft oder fehlen ihr zugesicherte Eigenschaften, so ist der Lieferer verpflichtet, sie nach seiner Wahl entweder nachzubessern oder kostenlos durch einwandfreie Ware zu ersetzen. Dem Besteller bleibt das Recht vorbehalten, bei Fehlschlagen der Nachbesserung oder Ersatzlieferung Herabsetzung der Vergütung oder nach seiner Wahl Rückgängigmachung des Vertrages zu verlangen. Dies gilt jedoch nur dann, wenn der Besteller die Ware nicht verändert hat und die Waschvorschriften beachtet hat.</p>\n<p>Weitere Gewährleistungsansprüche des Bestellers sind ausgeschlossen. Eine Haftung ist ausgeschlossen, wenn die Ware sich nicht mehr im Zustand der Ablieferung befindet, d. h. insbesondere, sofern der Besteller die Ware bereits velegt oder benutzt hat und/oder Änderungen oder Instandsetzungsarbeiten veranlasst hat.</p>\n<p>Gewährleistungsansprüche verjähren sechs Monate nach Erhalt der Ware. Schadenersatzansprüche bleiben beschränkt auf den Fall groben Verschuldens oder Vorsatzes.</p>\n<p>1. Erfüllungsort ist der Sitz des Lieferers.</p>\n<p>2. Gerichtsstand ist München. Das gilt auch für Wechsel- und Scheckklagen. Ist der Käufer Gewerbetreibender im Sinne des §4 HGB oder Nichtkaufmann, so wird hiermit ausdrücklich vereinbart, dass Ansprüche im Wege des Mahnverfahrens (§§688 ff ZPO) an dem Gerichtsstand München geltend gemacht werden können (§ 38 Abs. 3 Ziff. 2b ZPO).</p>\n<p>Der Lieferer weist gemäß seiner Datenschutzerklärung gemäß EU-Datenschutzverordnung (DSGVO) darauf hin, dass zur Vertragsabwicklung erforderliche Daten in seiner Datenverarbeitungsanlage gespeichert sind.</p>\n<p>FUCHSIUS multi-media GmbH <em> HRB161064 AG München </em> Geschäftsführer:Dipl.-Ing.Dieter Fuchsius <em> Fischerstrasse 2 </em> D-85737 Ismaning <em> Steuer-Nr.143 13880 428 </em> AGB fmm 01/18</p>"
  },
  "impressum": {
   "titel": "Impressum",
   "html": "<p><strong>FUCHSIUS multi-media GmbH</strong></p>\n<p>Fischerstrasse 2</p>\n<p>D-85737 Ismaning</p>\n<p>Telefon: +49 89 54 55 82 64</p>\n<p>Telefax: +49 89 54 55 83 33</p>\n<p>Mobil:  +49 171 77 55 400</p>\n<p>E-Mail:   <a href=\"mailto:info@matten.de\" target=\"_blank\" rel=\"noopener\">info@matten.net</a></p>\n<p>Internet: <a href=\"http://www.matten.de/\" target=\"_blank\" rel=\"noopener\">www.matten.net</a></p>\n<p>Vertretungsberechtigter Geschäftsführer: Dipl.-Ing. Dieter Fuchsius</p>\n<p>Registergericht: Amtsgericht München</p>\n<p>Registernummer: HRB 161064</p>\n<p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: DE 246 769 029</p>\n<p>Haftungshinweis: Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.</p>\n<p><strong>Keine Abmahnung ohne vorherigen Kontakt!</strong></p>\n<p>Für allgemeine Fragen zu Produkten oder Dienstleistungen des Unternehmens oder weitere Angelegenheiten, die das Unternehmen dieser Seite betreffen, wenden Sie sich bitte direkt an den Seitenbetreiber!</p>\n<p>Sollten Sie irgendwelche Fragen, Probleme, oder rechtliche Forderungen, die den Inhalt dieser Seiten betreffen haben, bitte benachrichtigen Sie den Verantwortlichen Seiteninhaber. Sollte der Inhalt oder die Aufmachung von der Seite (verlinkte Seiten, Texte, Banner) Rechte Dritter oder gesetzliche Bestimmungen verletzen, so bitten wir um eine entsprechende Nachricht ohne Kostennote. Der Betreiber garantiert, die zu Recht beanstandeten Seiten, Banner, Texte unverzüglich zu entfernen, ohne dass von Ihrer Seite die Einschaltung eines Rechtsbeistandes erforderlich ist. Eine Abmahnung ist nicht nötig. Ein kurzer Hinweis per E-Mail genügt. Der Verantwortliche reagiert dann angemessen und ohne Verzögerung auf Ihre Anfragen. Dennoch von Ihnen ohne vorherige Kontaktaufnahme ausgelöste Kosten werden wir vollumfänglich zurückweisen und gegebenenfalls Gegenklage wegen Verletzung vorgenannter Bestimmungen einreichen.</p>\n<p>Widerrufsbelehrung</p>\n<p>Die Widerrufsbelehrung finden Sie unter <a href=\"http://www.matten.de/widerrufsbelehrung\" target=\"_blank\" rel=\"noopener\">http://www.matten.de/widerrufsbelehrung</a></p>\n<p>Realisierung und Gestaltung</p>\n<p>BRIANDCO</p>\n<p>brian@briandco.com.de</p>\n<p>Einbindung von facebook-Plugins</p>\n<p><strong>Datenschutzerklärung</strong></p>\n<p><strong>Geltungsbereich</strong></p>\n<p>Diese Datenschutzerklärung klärt Nutzer über die Art, den Umfang und Zwecke der Erhebung und</p>\n<p>Verwendung personenbezogener Daten durch den verantwortlichen Anbieter</p>\n<p>FUCHSIUS multi-media GmbH</p>\n<p>Fischerstrasse 2</p>\n<p>D- 85737 Ismaning / Deutschland</p>\n<p>Tel.+49 89 54 55 82 64</p>\n<p>eMail: info@matten.net</p>\n<p>www.matten.net</p>\n<p><strong>Verwendung von Facebook Social Plugins</strong></p>\n<p>Dieses Angebot verwendet Social Plugins (\"Plugins\") des sozialen Netzwerkes facebook.com, welches von der Facebook Inc., 1601 S. California Ave, Palo Alto, CA 94304, USA betrieben wird (\"Facebook\"). Die Plugins sind an einem der Facebook Logos erkennbar (weiß es \"f\" auf blauer Kachel oder ein \"Daumen hoch\"-Zeichen) oder sind mit dem Zusatz \"Facebook Social Plugin\" gekennzeichnet. Die Liste und das Aussehen der Facebook Social Plugins kann hier eingesehen werden: <a href=\"http://developers.facebook.com/plugins\" target=\"_blank\" rel=\"noopener\">http://developers.facebook.com/plugins</a>.</p>\n<p>Wenn ein Nutzer eine Webseite dieses Angebots aufruft, die ein solches Plugin enthält, baut sein Browser eine direkte Verbindung mit den Servern von Facebook auf. Der Inhalt des Plugins wird von Facebook direkt an Ihren Browser übermittelt und von diesem in die Webseite eingebunden. Der Anbieter hat daher keinen Einfluss auf den Umfang der Daten, die Facebook mit Hilfe dieses Plugins erhebt und informiert die Nutzer daher entsprechend seinem <a href=\"http://www.facebook.com/help/?faq=17512\" target=\"_blank\" rel=\"noopener\">Kenntnisstand</a>:</p>\n<p>Durch die Einbindung der Plugins erhält Facebook die Information, dass ein Nutzer die entsprechende Seite des Angebots aufgerufen hat. Ist der Nutzer bei Facebook eingeloggt, kann Facebook den Besuch seinem Facebook-Konto zuordnen. Wenn Nutzer mit den Plugins interagieren, zum Beispiel den Like Button betätigen oder einen Kommentar abgeben, wird die entsprechende Information von Ihrem Browser direkt an Facebook übermittelt und dort gespeichert. Falls ein Nutzer kein Mitglied von Facebook ist, besteht trotzdem die Möglichkeit, dass Facebook seine IP-Adresse in Erfahrung bringt und speichert. Laut Facebook wird in Deutschland nur eine anonymisierte IP-Adresse gespeichert.</p>\n<p>Zweck und Umfang der Datenerhebung und die weitere Verarbeitung und Nutzung der Daten durch Facebook sowie die diesbezüglichen Rechte und Einstellungsmöglichkeiten zum Schutz der Privatsphäre der Nutzer , können diese den Datenschutzhinweisen von Facebook entnehmen: <a href=\"http://www.facebook.com/policy.php\" target=\"_blank\" rel=\"noopener\">http://www.facebook.com/policy.php</a>.</p>\n<p>Wenn ein Nutzer Facebookmitglied ist und nicht möchte, dass Facebook über dieses Angebot Daten über ihn sammelt und mit seinen bei Facebook gespeicherten Mitgliedsdaten verknüpft, muss er sich vor dem Besuch des Internetauftritts bei Facebook ausloggen.</p>\n<p>Ebenfalls ist es möglich Facebook-Social-Plugins mit Add-ons für Ihren Browser zu blocken, zum Beispiel mit dem \"<a href=\"http://webgraph.com/resources/facebookblocker/\" target=\"_blank\" rel=\"noopener\">Facebook Blocker</a>\".</p>\n<p><strong>Twitter</strong></p>\n<p>Dieses Angebot nutzt die <a href=\"https://twitter.com/about/resources/buttons\" target=\"_blank\" rel=\"noopener\">Schaltflächen des Dienstes Twitter</a>. Diese Schaltflächen werden angeboten durch die Twitter Inc., 795 Folsom St., Suite 600, San Francisco, CA 94107, USA. Sie sind an Begriffen wie \"Twitter\" oder \"Folge\", verbunden mit einem stillisierten blauen Vogel erkennbar. Mit Hilfe der Schaltflächen ist es möglich einen Beitrag oder Seite dieses Angebotes bei Twitter zu teilen oder dem Anbieter bei Twitter zu folgen.</p>\n<p>Wenn ein Nutzer eine Webseite dieses Internetauftritts aufruft, die einen solchen Button enthält, baut sein Browser eine direkte Verbindung mit den Servern von Twitter auf. Der Inhalt des Twitter-Schaltflächen wird von Twitter direkt an den Browser des Nutzers übermittelt. Der Anbieter hat daher keinen Einfluss auf den Umfang der Daten, die Twitter mit Hilfe dieses Plugins erhebt und informiert die Nutzer entsprechend seinem Kenntnisstand. Nach diesem wird lediglich die IP-Adresse des Nutzers die URL der jeweiligen Webseite beim Bezug des Buttons mit übermittelt, aber nicht für andere Zwecke, als die Darstellung des Buttons, genutzt.</p>\n<p>Weitere Informationen hierzu finden sich in der Datenschutzerklärung von Twitter unter http://twitter.com/privacy.</p>\n<p><strong>Widerruf, änderungen, Berichtigungen und Aktualisierungen</strong></p>\n<p>Der Nutzer hat das Recht, auf Antrag unentgeltlich Auskunft zu erhalten über die personenbezogenen Daten, die über ihn gespeichert wurden. Zusätzlich hat der Nutzer das Recht auf Berichtigung unrichtiger Daten, Sperrung und Löschung seiner personenbezogenen Daten, soweit dem keine gesetzliche Aufbewahrungspflicht entgegensteht.</p>"
  },
  "data-protection": {
   "titel": "datenschutz",
   "html": "<p><strong>Allgemeines</strong></p>\n<p>Der Schutz Ihrer personenbezogener Daten bei der Erhebung, Verarbeitung und Nutzung bei Ihrem Besuchs auf unserer Homepage ist uns sehr wichtig. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>\n<p>Die Rechtsgrundlage für die Erhebung und Verarbeitung Ihrer personenbezogenen Daten ist in<a href=\"https://dejure.org/gesetze/DSGVO/6.html\" target=\"_blank\" rel=\"noopener\">der DSGVO</a> geregelt. Die bei der Nutzung dieses Webangebots anfallenden Nutzungsdaten nach Telemediengesetz (§ 15 Absatz 1 TMG) werden nur verwendet, um das Angebot zu erbringen.</p>\n<p>Die Suche auf unserer Seite durchsucht nur unser Web-Angebot. Dabei werden keine personenbezogenen Daten protokolliert.</p>\n<p>Sollten Sie mit uns per <a href=\"http://www.baden-wuerttemberg.datenschutz.de/ihr-weg-zu-uns/#E-Mail-Versandt\" target=\"_blank\" rel=\"noopener\">E-Mail Kontakt</a>aufnehmen, so verwenden wir Ihre E-Mail-Adresse nur, um mit Ihnen in Kontakt zu treten. Andere Verwendungen schließen wir aus.</p>\n<p><strong>Datenschutz</strong></p>\n<p>FUCHSIUS multi-media GmbH als Betreiber dieser Seite „www.matten.de“ behandelt Ihre personenbezogenen Daten sehr sorgsam, vertraulich, entsprechend der gesetzlichen Datenschutzverordnung (DSGVO) und dieser Datenschutzerklärung. Die Nutzung unserer Website ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift, E-Mail-Adressen oder Bilder) erhoben werden, erfolgt dieses nur soweit es für die Bearbeitung Ihrer Anfragen und Aufträge notwendig ist. Wir erhalten Ihre Angaben auf freiwilliger Basis. Diese Daten werden ohne Ihre ausdrückliche Zustimmung nicht an Dritte weitergegeben. Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann, denen wir durch Einsatz von Schutzprogrammen entgegen wirken. Dennoch kann ein absoluter Schutz der Daten vor dem unberechtigten Zugriff durch Dritte ist nicht garantiert werden.</p>\n<p><strong>Besuch der Homepage</strong></p>\n<p>Sie können unsere Homepage besuchen, ohne Angaben zu Ihrer Person zu machen oder sich zu registrieren.</p>\n<p><strong>Logfiles:</strong></p>\n<p>Bei jedem Zugriff eines Nutzers auf unsere Homepage und bei jedem Abruf einer Datei werden automatisch Daten über diesen Vorgang  erfasst und in einer Protokolldatei gespeichert. Dabei werden im Einzelnen über jeden Abruf folgende Daten gespeichert:</p>\n<ul><li>Name der abgerufenen Datei;</li><li>Datum und Uhrzeit des Abrufs;</li><li>übertragene Datenmenge;</li><li>Meldung über Erfolg oder Mißerfolg des Abruf;</li><li>Beschreibung des verwendeten Webbrowsers-Typs;</li><li>anfragende Domain.</li></ul>\n<p>IP-Adressen werden nicht vollständig erfasst, sondern vor der Speicherung gekürzt, und lassen keinen Rückschluss auf einen bestimmten Computer zu. Die Speicherung dient ausschließlich internen systembezogenen und statistischen Zwecken. Wir verwenden diese Informationen, um den Auftritt unserer Webseite ständig zu verbessern, zu aktualisieren und somit ihre Attraktivität zu erhöhen (Wahrung berechtigter Interessen). Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGVO.</p>\n<p>Eine Zusammenführung der protokollierten Daten mit andern Datenquellen, insbesondere Daten, die eine Zuordnung zu einer bestimmten Person zulassen, wird nicht vorgenommen.</p>\n<p><strong>Cookies</strong></p>\n<p>Unsere Website verwendet Cookies. Das sind kleine Textdateien, die es möglich machen, auf dem Endgerät des Nutzers spezifische, auf den Nutzer bezogene Informationen zu speichern, während er die Website nutzt. Cookies ermöglichen es, insbesondere Nutzungshäufigkeit und Nutzeranzahl der Seiten zu ermitteln, Verhaltensweisen der Seitennutzung zu analysieren, aber auch unser Angebot nutzerfreundlicher zu gestalten. Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGVO.</p>\n<p>Die von uns verwendeten Cookies sind so genannte „Session-Cookies“. Sie werden nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.</p>\n<p>Wenn Sie es nicht wünschen, dass wir Informationen über Ihren Computer wiedererkennen, stellen Sie Ihren Internetbrowser bitte so ein, dass er Cookies von Ihrer Computerfestplatte löscht, alle Cookies blockiert oder Sie warnt, bevor ein Cookie gespeichert wird. Möglicherweise stehen Ihnen dann aber nicht sämtliche Funktionen unserer Homepage zur Verfügung.</p>\n<p>Wenn Sie über einen Link unsere Seite verlassen und so auf fremde Seiten gelangen, kann es sein, dass auch von Adressaten der angeklickten Zielseite Cookies gesetzt werden. Für diese Cookies sind wir rechtlich nicht verantwortlich. Zu der Benutzung solcher Cookies und der darauf gespeicherten Informationen durch Dritte vergleichen Sie bitte deren Datenschutzerklärungen.</p>\n<p><strong>Youtube</strong></p>\n<p>Falls wir Videos in unsere Website einbinden, werden diese über einen eingebetteten YouTube-Player wiedergeben. Betreiber der Videoplattform YouTube ist YouTube, LLC, 901 Cherry Ave., San Bruno, CA 94066, USA, vertreten durch Google Inc., 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Wenn Sie auf unserer Website eine Seite mit eingebettetem YouTube-Player aufrufen, wird eine Verbindung zu den Servern von YouTube/Google aufgebaut. Dabei wird dem Server Ihre IP-Adresse zusammen mit URL des aufgerufenen Videos übermittelt. Wenn Sie bei Google eingeloggt sind, kann YouTube/Google diese Information Ihnen zuordnen und in Ihrem persönlichen Profil verarbeiten.</p>\n<p>Wenn Sie nicht möchten, dass Google Daten über Sie sammelt und mit Ihren persönlichen Profil verknüpft, müssen Sie sich vor dem Besuch unserer Website bei Google ausloggen. Weitere Informationen zur Erhebung und Nutzung Ihrer Daten durch YouTube erhalten Sie in den dortigen Hinweisen zum Datenschutz unter https://policies.google.com/privacy?hl=de&amp;gl=de</p>\n<p><strong>Anfragen und Verträge</strong></p>\n<p>Soweit Sie uns personenbezogene Daten zur Verfügung gestellt haben, verwenden wir diese ausschließlich zum Zweck der technischen Administration unserer Webseiten und zur Erfüllung Ihrer Wünsche und Anforderungen, insbesondere zur Abwicklung der uns übermittelten Anfragen oder zur Bearbeitung Ihrer Aufträge.</p>\n<p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, können Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert werden. Rechtgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO (vorvertragliche Maßnahmen und Vertragserfüllung).</p>\n<p>Eine Weitergabe, ein Verkauf oder sonstige Übermittlung Ihrer personenbezogenen Daten an Dritte erfolgt nicht, es sei denn, dass</p>\n<ul><li>dies zum Zwecke der Klärung Ihrer Anfragen erforderlich ist und soweit beispielsweise Auskünfte bei Kommunen oder Behörden einzuholen sind, die hierzu Ihren Namen und Ihre Anschrift benötigen;</li><li>dies zu Abrechnungszwecken erforderlich ist;</li><li>zuvor in die Weitergabe Ihrer Daten ausdrücklich eingewilligt haben.</li></ul>\n<p>Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO (Vertragserfüllung) bzw. Art. 6 Abs. 1 Buchstabe a DSGVO (Einwilligung).</p>\n<p><strong>Sonstige Kundenpflege</strong></p>\n<p>Ohne Ihre Einwilligung nutzen wir personenbezogene Daten lediglich im gesetzlich zulässigen Umfang, d.h. für  den Versand von Informationen per Post. Ihre E-Mail-Adresse, Fax- und Telefonnummer nutzen wir ohne ausdrückliche Einwilligung nicht. Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGV (Wahrnehmung berechtigter Interessen).</p>\n<p><strong>Dauer der Speicherung</strong></p>\n<p>Wir löschen Ihre Daten, wenn sie nach Bearbeitung einer Anfrage bzw. Beendigung des Vertrages nicht mehr erforderlich sind. Davon ausgenommen sind Daten, die wir aufgrund gesetzlicher Verpflichtung noch nicht löschen dürfen (z.B. Unterlagen, die nach Steuerrecht und Handelsrecht aufzubewahren sind) und Daten, die wir zur Wahrnehmung berechtigter Interessen benötigen, insbesondere zur Geltendmachung von Ansprüchen.</p>\n<p><strong>Ihre Rechte</strong></p>\n<p>Sie haben, wenn die jeweiligen gesetzlichen Voraussetzungen vorliegen, die folgenden Rechte:</p>\n<ul><li>Sie haben das Recht, Auskunft über die zu Ihrer Person gespeicherten personenbezogenen Daten zu erhalten (Art. 15 DSGVO).</li><li>Sie haben das Recht, die Berichtigung von unzutreffenden Daten zu verlangen (Art. 16 DSGVO).</li><li>Sie haben das Recht, die Löschung (Art. 17) oder die Einschränkung der Verarbeitung (Art. 18 DSGVO) nicht mehr benötigter Daten zu verlangen. Soweit gesetzliche Aufbewahrungspflichten bestehen, z.B. für geschäftliche Korrespondenz nach Handelsrecht und Steuerrecht oder eine andere gesetzliche Ausnahme besteht, werden Daten nicht gelöscht, sondern nur die Verarbeitung eingeschränkt.</li></ul>\n<p>Für die Geltendmachung Ihrer Rechte wenden Sie sich bitte an:</p>\n<p>FUCHSIUS multi-media GmbH</p>\n<p>Dieter Fuchsius</p>\n<p>Fischerstraße 2</p>\n<p>D-85737 Ismaning</p>\n<p>info@matten.de</p>\n<p>Mobil: +49 171 77 55 400.</p>\n<p>Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt, können Sie sich bei einer Aufsichtsbehörde beschweren (Art. 77 DSGVO).</p>"
  },
  "datenschutzerklarung-dsgvo": {
   "titel": "Datenschutzerklärung (DSGVO)",
   "html": "<p>Datenschutzerklärung nach EU-Datenschutzverordnung (DSGVO) <a href=\"http://www.matten.net/\" target=\"_blank\" rel=\"noopener\">zur Website: www.matten.net</a></p>\n<p><strong>Allgemeines</strong></p>\n<p>Der Schutz Ihrer personenbezogener Daten bei der Erhebung, Verarbeitung und Nutzung bei Ihrem Besuchs auf unserer Homepage ist uns sehr wichtig. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>\n<p>Die Rechtsgrundlage für die Erhebung und Verarbeitung Ihrer personenbezogenen Daten ist in<a href=\"https://dejure.org/gesetze/DSGVO/6.html\" target=\"_blank\" rel=\"noopener\">der DSGVO</a> geregelt. Die bei der Nutzung dieses Webangebots anfallenden Nutzungsdaten nach Telemediengesetz (§ 15 Absatz 1 TMG) werden nur verwendet, um das Angebot zu erbringen.</p>\n<p>Die Suche auf unserer Seite durchsucht nur unser Web-Angebot. Dabei werden keine personenbezogenen Daten protokolliert.</p>\n<p>Sollten Sie mit uns per <a href=\"http://www.baden-wuerttemberg.datenschutz.de/ihr-weg-zu-uns/#E-Mail-Versandt\" target=\"_blank\" rel=\"noopener\">E-Mail Kontakt</a>aufnehmen, so verwenden wir Ihre E-Mail-Adresse nur, um mit Ihnen in Kontakt zu treten. Andere Verwendungen schließen wir aus.</p>\n<p><strong>Datenschutz</strong></p>\n<p>FUCHSIUS multi-media GmbH als Betreiber dieser Seite „www.matten.de“ behandelt Ihre personenbezogenen Daten sehr sorgsam, vertraulich, entsprechend der gesetzlichen Datenschutzverordnung (DSGVO) und dieser Datenschutzerklärung. Die Nutzung unserer Website ist in der Regel ohne Angabe personenbezogener Daten möglich. Soweit auf unseren Seiten personenbezogene Daten (beispielsweise Name, Anschrift, E-Mail-Adressen oder Bilder) erhoben werden, erfolgt dieses nur soweit es für die Bearbeitung Ihrer Anfragen und Aufträge notwendig ist. Wir erhalten Ihre Angaben auf freiwilliger Basis. Diese Daten werden ohne Ihre ausdrückliche Zustimmung nicht an Dritte weitergegeben. Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann, denen wir durch Einsatz von Schutzprogrammen entgegen wirken. Dennoch kann ein absoluter Schutz der Daten vor dem unberechtigten Zugriff durch Dritte ist nicht garantiert werden.</p>\n<p><strong>Besuch der Homepage</strong></p>\n<p>Sie können unsere Homepage besuchen, ohne Angaben zu Ihrer Person zu machen oder sich zu registrieren.</p>\n<p><strong>Logfiles:</strong></p>\n<p>Bei jedem Zugriff eines Nutzers auf unsere Homepage und bei jedem Abruf einer Datei werden automatisch Daten über diesen Vorgang erfasst und in einer Protokolldatei gespeichert. Dabei werden im Einzelnen über jeden Abruf folgende Daten gespeichert:</p>\n<ul><li>Name der abgerufenen Datei;</li><li>Datum und Uhrzeit des Abrufs;</li><li>übertragene Datenmenge;</li><li>Meldung über Erfolg oder Mißerfolg des Abruf;</li><li>Beschreibung des verwendeten Webbrowsers-Typs;</li><li>anfragende Domain.</li></ul>\n<p>IP-Adressen werden nicht vollständig erfasst, sondern vor der Speicherung gekürzt, und lassen keinen Rückschluss auf einen bestimmten Computer zu. Die Speicherung dient ausschließlich internen systembezogenen und statistischen Zwecken. Wir verwenden diese Informationen, um den Auftritt unserer Webseite ständig zu verbessern, zu aktualisieren und somit ihre Attraktivität zu erhöhen (Wahrung berechtigter Interessen). Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGVO.</p>\n<p>Eine Zusammenführung der protokollierten Daten mit andern Datenquellen, insbesondere Daten, die eine Zuordnung zu einer bestimmten Person zulassen, wird nicht vorgenommen.</p>\n<p><strong>Cookies</strong></p>\n<p>Unsere Website verwendet Cookies. Das sind kleine Textdateien, die es möglich machen, auf dem Endgerät des Nutzers spezifische, auf den Nutzer bezogene Informationen zu speichern, während er die Website nutzt. Cookies ermöglichen es, insbesondere Nutzungshäufigkeit und Nutzeranzahl der Seiten zu ermitteln, Verhaltensweisen der Seitennutzung zu analysieren, aber auch unser Angebot nutzerfreundlicher zu gestalten. Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGVO.</p>\n<p>Die von uns verwendeten Cookies sind so genannte „Session-Cookies“. Sie werden nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.</p>\n<p>Wenn Sie es nicht wünschen, dass wir Informationen über Ihren Computer wiedererkennen, stellen Sie Ihren Internetbrowser bitte so ein, dass er Cookies von Ihrer Computerfestplatte löscht, alle Cookies blockiert oder Sie warnt, bevor ein Cookie gespeichert wird. Möglicherweise stehen Ihnen dann aber nicht sämtliche Funktionen unserer Homepage zur Verfügung.</p>\n<p>Wenn Sie über einen Link unsere Seite verlassen und so auf fremde Seiten gelangen, kann es sein, dass auch von Adressaten der angeklickten Zielseite Cookies gesetzt werden. Für diese Cookies sind wir rechtlich nicht verantwortlich. Zu der Benutzung solcher Cookies und der darauf gespeicherten Informationen durch Dritte vergleichen Sie bitte deren Datenschutzerklärungen.</p>\n<p><strong>Youtube</strong></p>\n<p>Falls wir Videos in unsere Website einbinden, werden diese über einen eingebetteten YouTube-Player wiedergeben. Betreiber der Videoplattform YouTube ist YouTube, LLC, 901 Cherry Ave., San Bruno, CA 94066, USA, vertreten durch Google Inc., 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Wenn Sie auf unserer Website eine Seite mit eingebettetem YouTube-Player aufrufen, wird eine Verbindung zu den Servern von YouTube/Google aufgebaut. Dabei wird dem Server Ihre IP-Adresse zusammen mit URL des aufgerufenen Videos übermittelt. Wenn Sie bei Google eingeloggt sind, kann YouTube/Google diese Information Ihnen zuordnen und in Ihrem persönlichen Profil verarbeiten.</p>\n<p>Wenn Sie nicht möchten, dass Google Daten über Sie sammelt und mit Ihren persönlichen Profil verknüpft, müssen Sie sich vor dem Besuch unserer Website bei Google ausloggen. Weitere Informationen zur Erhebung und Nutzung Ihrer Daten durch YouTube erhalten Sie in den dortigen Hinweisen zum Datenschutz unter https://policies.google.com/privacy?hl=de&amp;gl=de</p>\n<p><strong>Anfragen und Verträge</strong></p>\n<p>Soweit Sie uns personenbezogene Daten zur Verfügung gestellt haben, verwenden wir diese ausschließlich zum Zweck der technischen Administration unserer Webseiten und zur Erfüllung Ihrer Wünsche und Anforderungen, insbesondere zur Abwicklung der uns übermittelten Anfragen oder zur Bearbeitung Ihrer Aufträge.</p>\n<p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, können Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert werden. Rechtgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO (vorvertragliche Maßnahmen und Vertragserfüllung).</p>\n<p>Eine Weitergabe, ein Verkauf oder sonstige Übermittlung Ihrer personenbezogenen Daten an Dritte erfolgt nicht, es sei denn, dass</p>\n<ul><li>dies zum Zwecke der Klärung Ihrer Anfragen erforderlich ist und soweit beispielsweise Auskünfte bei Kommunen oder Behörden einzuholen sind, die hierzu Ihren Namen und Ihre Anschrift benötigen;</li><li>dies zu Abrechnungszwecken erforderlich ist;</li><li>zuvor in die Weitergabe Ihrer Daten ausdrücklich eingewilligt haben.</li></ul>\n<p>Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe b DSGVO (Vertragserfüllung) bzw. Art. 6 Abs. 1 Buchstabe a DSGVO (Einwilligung).</p>\n<p><strong>Sonstige Kundenpflege</strong></p>\n<p>Ohne Ihre Einwilligung nutzen wir personenbezogene Daten lediglich im gesetzlich zulässigen Umfang, d.h. für den Versand von Informationen per Post. Ihre E-Mail-Adresse, Fax- und Telefonnummer nutzen wir ohne ausdrückliche Einwilligung nicht. Rechtsgrundlage ist Art. 6 Abs. 1 Buchstabe f DSGV (Wahrnehmung berechtigter Interessen).</p>\n<p><strong>Dauer der Speicherung</strong></p>\n<p>Wir löschen Ihre Daten, wenn sie nach Bearbeitung einer Anfrage bzw. Beendigung des Vertrages nicht mehr erforderlich sind. Davon ausgenommen sind Daten, die wir aufgrund gesetzlicher Verpflichtung noch nicht löschen dürfen (z.B. Unterlagen, die nach Steuerrecht und Handelsrecht aufzubewahren sind) und Daten, die wir zur Wahrnehmung berechtigter Interessen benötigen, insbesondere zur Geltendmachung von Ansprüchen.</p>\n<p><strong>Ihre Rechte</strong></p>\n<p>Sie haben, wenn die jeweiligen gesetzlichen Voraussetzungen vorliegen, die folgenden Rechte:</p>\n<ul><li>Sie haben das Recht, Auskunft über die zu Ihrer Person gespeicherten personenbezogenen Daten zu erhalten (Art. 15 DSGVO).</li><li>Sie haben das Recht, die Berichtigung von unzutreffenden Daten zu verlangen (Art. 16 DSGVO).</li><li>Sie haben das Recht, die Löschung (Art. 17) oder die Einschränkung der Verarbeitung (Art. 18 DSGVO) nicht mehr benötigter Daten zu verlangen. Soweit gesetzliche Aufbewahrungspflichten bestehen, z.B. für geschäftliche Korrespondenz nach Handelsrecht und Steuerrecht oder eine andere gesetzliche Ausnahme besteht, werden Daten nicht gelöscht, sondern nur die Verarbeitung eingeschränkt.</li></ul>\n<p>Für die Geltendmachung Ihrer Rechte wenden Sie sich bitte an:</p>\n<p>FUCHSIUS multi-media GmbH</p>\n<p>Dieter Fuchsius</p>\n<p>Fischerstraße 2</p>\n<p>D-85737 Ismaning</p>\n<p>info@matten.net</p>\n<p>Mobil: +49 171 77 55 400.</p>\n<p>Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt, können Sie sich bei einer Aufsichtsbehörde beschweren (Art. 77 DSGVO).</p>"
  },
  "blog": [
   {
    "titel": "FUCHSIUS multi-media GmbH",
    "slug": "der-mattenfuchs",
    "datum": "February 1, 2019 08:06",
    "absaetze": [
     "Seit mehr als 35 Jahren liefern wir Fussmatten in einer Vielzahl von Standardmaßen und nahezu beliebigen Wunschmaßen in mehr als 100 verschiedenen Farben, einfarbig und individuell nach Kundenwunsch gestaltet.",
     "Wir haben in dieser Zeit weltweit in vielen namhaften Firmen, Top-Handelshäusern und Filialunternehmen, Hotels, Verwaltungen, Ladengeschäften und Privathaushalten für saubere Eingangsbereiche und den Schutz der angrenzenden Böden gesorgt.",
     "Unsere Angebotspalette ist in den zurückliegenden Jahren stetig gewachsen und wurde den permanent steigenden Anforderungen laufend angepasst. So haben wir für jedes Schmutzproblem -und auch für die passende Werbung für Ihr Haus- immer eine hervorragende Lösung parat. \"NICHTS\"  gibt es <strong>nicht</strong> bei uns.",
     "Wir sind stets für Sie unter \"info@matten.de\" erreichbar und freuen uns über Ihre Anfrage.",
     "Ihr Mattenfuchs-Team"
    ]
   },
   {
    "titel": "Eine neue Mattengeneration",
    "slug": "eine-neue-mattengeneration",
    "datum": "August 17, 2019 09:05",
    "absaetze": [
     "Matten mit fotorealistischer Gestaltung.",
     "Als Vorlage genügt eine Foto und Ihre Wunschgrößen-Angabe"
    ]
   }
  ]
 },
 "laenderCodes": [
  "AD",
  "AE",
  "AF",
  "AG",
  "AI",
  "AL",
  "AM",
  "AO",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AW",
  "AX",
  "AZ",
  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BL",
  "BM",
  "BN",
  "BO",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BV",
  "BW",
  "BY",
  "BZ",
  "CA",
  "CC",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",
  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "EH",
  "ER",
  "ES",
  "ET",
  "FI",
  "FJ",
  "FK",
  "FM",
  "FO",
  "FR",
  "GA",
  "GB",
  "GD",
  "GE",
  "GF",
  "GG",
  "GH",
  "GI",
  "GL",
  "GM",
  "GN",
  "GP",
  "GQ",
  "GR",
  "GS",
  "GT",
  "GU",
  "GW",
  "GY",
  "HK",
  "HM",
  "HN",
  "HR",
  "HT",
  "HU",
  "ID",
  "IE",
  "IL",
  "IM",
  "IN",
  "IO",
  "IQ",
  "IR",
  "IS",
  "IT",
  "JE",
  "JM",
  "JO",
  "JP",
  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KY",
  "KZ",
  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",
  "MA",
  "MC",
  "MD",
  "ME",
  "MF",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MO",
  "MP",
  "MQ",
  "MR",
  "MS",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",
  "NA",
  "NC",
  "NE",
  "NF",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NU",
  "NZ",
  "OM",
  "PA",
  "PE",
  "PF",
  "PG",
  "PH",
  "PK",
  "PL",
  "PM",
  "PN",
  "PR",
  "PS",
  "PT",
  "PW",
  "PY",
  "QA",
  "RE",
  "RO",
  "RS",
  "RU",
  "RW",
  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SH",
  "SI",
  "SJ",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SX",
  "SY",
  "SZ",
  "TC",
  "TD",
  "TF",
  "TG",
  "TH",
  "TJ",
  "TK",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",
  "UA",
  "UG",
  "UM",
  "US",
  "UY",
  "UZ",
  "VA",
  "VC",
  "VE",
  "VG",
  "VI",
  "VN",
  "VU",
  "WF",
  "WS",
  "YE",
  "YT",
  "ZA",
  "ZM",
  "ZW"
 ],
 "mattendesigner": {
  "pfad": "/de/custom-mat/create",
  "materialien": [
   {
    "id": 1,
    "name": "JetPrint",
    "description": "Individuell angefertigte Hochleistungsmatten hinterlassen einen bleibenden Eindruck. Entwerfen Sie Ihre persönliche Matte, bis 32-farbig.\r\nDie JetPrint-Matte mit sehr hoher Schmutzaufnahmekapazität.\r\nEinsatz: Eingänge, Corporate Identity, Point of Sale",
    "price": "101.71",
    "colors": [
     {
      "id": 49,
      "code": "600",
      "name": "Weiß",
      "RGBColor": "#FFFFFF",
      "sortPosition": 0
     },
     {
      "id": 41,
      "code": "601",
      "name": "Zitronengelb",
      "RGBColor": "#fffe28",
      "sortPosition": 1
     },
     {
      "id": 40,
      "code": "602",
      "name": "Gelb",
      "RGBColor": "#fdd302",
      "sortPosition": 2
     },
     {
      "id": 39,
      "code": "603",
      "name": "Melone",
      "RGBColor": "#ff9a02",
      "sortPosition": 3
     },
     {
      "id": 2,
      "code": "604",
      "name": "Orange",
      "RGBColor": "#f56703",
      "sortPosition": 4
     },
     {
      "id": 52,
      "code": "605",
      "name": "Signalrot",
      "RGBColor": "#c02832",
      "sortPosition": 5
     },
     {
      "id": 37,
      "code": "606",
      "name": "Kupfer",
      "RGBColor": "#980000",
      "sortPosition": 6
     },
     {
      "id": 36,
      "code": "607",
      "name": "Bordeaux",
      "RGBColor": "#ab0065",
      "sortPosition": 7
     },
     {
      "id": 35,
      "code": "608",
      "name": "Rosa",
      "RGBColor": "#fdade2",
      "sortPosition": 8
     },
     {
      "id": 34,
      "code": "609",
      "name": "Dunkellila",
      "RGBColor": "#9900c1",
      "sortPosition": 9
     },
     {
      "id": 33,
      "code": "610",
      "name": "Helllila",
      "RGBColor": "#c099d2",
      "sortPosition": 10
     },
     {
      "id": 32,
      "code": "611",
      "name": "Dunkelviolett",
      "RGBColor": "#66019b",
      "sortPosition": 11
     },
     {
      "id": 31,
      "code": "612",
      "name": "Hellviolett",
      "RGBColor": "#bfacfd",
      "sortPosition": 12
     },
     {
      "id": 30,
      "code": "613",
      "name": "Königsblau",
      "RGBColor": "#0051ba",
      "sortPosition": 13
     },
     {
      "id": 29,
      "code": "614",
      "name": "Hellblau",
      "RGBColor": "#97acff",
      "sortPosition": 14
     },
     {
      "id": 28,
      "code": "615",
      "name": "Dunkelltürkis",
      "RGBColor": "#00c1c1",
      "sortPosition": 15
     },
     {
      "id": 27,
      "code": "616",
      "name": "Helltürkis",
      "RGBColor": "#aef2f1",
      "sortPosition": 16
     },
     {
      "id": 26,
      "code": "617",
      "name": "Dunkelgrün",
      "RGBColor": "#019982",
      "sortPosition": 17
     },
     {
      "id": 25,
      "code": "618",
      "name": "Hellgrün",
      "RGBColor": "#7fd3bb",
      "sortPosition": 18
     },
     {
      "id": 24,
      "code": "619",
      "name": "Naturgrün",
      "RGBColor": "#087701",
      "sortPosition": 19
     },
     {
      "id": 23,
      "code": "620",
      "name": "Leuchtgrün",
      "RGBColor": "#14b004",
      "sortPosition": 20
     },
     {
      "id": 22,
      "code": "621",
      "name": "Aubergine",
      "RGBColor": "#500c1b",
      "sortPosition": 21
     },
     {
      "id": 21,
      "code": "622",
      "name": "Flieder",
      "RGBColor": "#e2d2d3",
      "sortPosition": 22
     },
     {
      "id": 20,
      "code": "623",
      "name": "Marineblau",
      "RGBColor": "#162053",
      "sortPosition": 23
     },
     {
      "id": 19,
      "code": "624",
      "name": "Rauchblau",
      "RGBColor": "#81aecf",
      "sortPosition": 24
     },
     {
      "id": 18,
      "code": "625",
      "name": "Dunkelrotbraun",
      "RGBColor": "#9f2f2e",
      "sortPosition": 25
     },
     {
      "id": 16,
      "code": "626",
      "name": "Hellbraun",
      "RGBColor": "#ffd2c0",
      "sortPosition": 26
     },
     {
      "id": 15,
      "code": "627",
      "name": "Dunkelgraubraun",
      "RGBColor": "#4b2928",
      "sortPosition": 27
     },
     {
      "id": 14,
      "code": "628",
      "name": "Hellgraubraun",
      "RGBColor": "#d2c2c2",
      "sortPosition": 28
     },
     {
      "id": 13,
      "code": "629",
      "name": "Hellgrau",
      "RGBColor": "#d2cfc8",
      "sortPosition": 29
     },
     {
      "id": 12,
      "code": "630",
      "name": "Mittelgrau",
      "RGBColor": "#8a908c",
      "sortPosition": 30
     },
     {
      "id": 11,
      "code": "631",
      "name": "Dunkelgrau",
      "RGBColor": "#4a4a56",
      "sortPosition": 31
     },
     {
      "id": 10,
      "code": "632",
      "name": "Schwarz",
      "RGBColor": "#010103",
      "sortPosition": 32
     },
     {
      "id": 9,
      "code": "633",
      "name": "Champagner",
      "RGBColor": "#e5dece",
      "sortPosition": 33
     },
     {
      "id": 8,
      "code": "634",
      "name": "Beige",
      "RGBColor": "#d4bf92",
      "sortPosition": 34
     },
     {
      "id": 7,
      "code": "635",
      "name": "Lachs",
      "RGBColor": "#fa8c71",
      "sortPosition": 35
     },
     {
      "id": 6,
      "code": "636",
      "name": "Schwarzblau",
      "RGBColor": "#00324b",
      "sortPosition": 36
     },
     {
      "id": 5,
      "code": "637",
      "name": "Leuchtblau",
      "RGBColor": "#0186c9",
      "sortPosition": 37
     },
     {
      "id": 4,
      "code": "638",
      "name": "Weinrot",
      "RGBColor": "#77283d",
      "sortPosition": 38
     },
     {
      "id": 47,
      "code": "639",
      "name": "Kirschrot",
      "RGBColor": "#b11e2e",
      "sortPosition": 39
     },
     {
      "id": 46,
      "code": "640",
      "name": "Sattgrün",
      "RGBColor": "#028752",
      "sortPosition": 40
     },
     {
      "id": 45,
      "code": "641",
      "name": "Olivgrün",
      "RGBColor": "#666900",
      "sortPosition": 41
     },
     {
      "id": 44,
      "code": "642",
      "name": "Mint",
      "RGBColor": "#f3ffb3",
      "sortPosition": 42
     },
     {
      "id": 43,
      "code": "643",
      "name": "Gold",
      "RGBColor": "#8a6a39",
      "sortPosition": 43
     },
     {
      "id": 42,
      "code": "644",
      "name": "Mink",
      "RGBColor": "#6a6054",
      "sortPosition": 44
     },
     {
      "id": 3,
      "code": "645",
      "name": "181-38-112",
      "RGBColor": "#ad0268",
      "sortPosition": 45
     },
     {
      "id": 17,
      "code": "646",
      "name": "203-198-27",
      "RGBColor": "#cbc61b",
      "sortPosition": 46
     }
    ],
    "sizes": [
     {
      "id": 1,
      "width": 40,
      "height": 60,
      "weight": 600,
      "available": true
     },
     {
      "id": 2,
      "width": 50,
      "height": 75,
      "weight": 940,
      "available": true
     },
     {
      "id": 3,
      "width": 60,
      "height": 90,
      "weight": 1350,
      "available": true
     },
     {
      "id": 4,
      "width": 85,
      "height": 120,
      "weight": 2550,
      "available": true
     },
     {
      "id": 5,
      "width": 85,
      "height": 150,
      "weight": 3190,
      "available": true
     },
     {
      "id": 6,
      "width": 115,
      "height": 175,
      "weight": 5000,
      "available": true
     },
     {
      "id": 7,
      "width": 115,
      "height": 240,
      "weight": 6900,
      "available": true
     },
     {
      "id": 8,
      "width": 150,
      "height": 200,
      "weight": 7500,
      "available": true
     },
     {
      "id": 9,
      "width": 150,
      "height": 300,
      "weight": 11250,
      "available": true
     },
     {
      "id": 10,
      "width": 200,
      "height": 200,
      "weight": 10000,
      "available": true
     },
     {
      "id": 11,
      "width": 200,
      "height": 300,
      "weight": 11500,
      "available": true
     },
     {
      "id": 12,
      "width": 200,
      "height": 400,
      "weight": 20000,
      "available": true
     },
     {
      "id": 13,
      "width": 200,
      "height": 600,
      "weight": 30000,
      "available": true
     }
    ],
    "preisdaten": {
     "einkaufProQm": 52.67,
     "salesFactor": 1.931,
     "standardbreiten": [
      60,
      75,
      85,
      115,
      150,
      200
     ]
    },
    "dePfad": "/logomatten/6300201-logomatte-a",
    "anmerkung": "Artikel 569: x 20-200 cm, y 40-700 cm"
   },
   {
    "id": 2,
    "name": "JetPrint_light",
    "description": "Individuell angefertigte JetPrint-Light-Matten im selben Verfahren bedruckt wie JetPrint-Matten, Herstellung jedoch mit geringerer Flordicke und Gummistärke. Sehr gute Schmutzaufnahme.\r\nEinsatz: Eingänge, Corporate identity, Point of Sale, Give-Away",
    "price": "78.88",
    "colors": [
     {
      "id": 2,
      "code": "604",
      "name": "Orange",
      "RGBColor": "#f56703",
      "sortPosition": 4
     },
     {
      "id": 15,
      "code": "627",
      "name": "Dunkelgraubraun",
      "RGBColor": "#4b2928",
      "sortPosition": 27
     },
     {
      "id": 14,
      "code": "628",
      "name": "Hellgraubraun",
      "RGBColor": "#d2c2c2",
      "sortPosition": 28
     },
     {
      "id": 13,
      "code": "629",
      "name": "Hellgrau",
      "RGBColor": "#d2cfc8",
      "sortPosition": 29
     },
     {
      "id": 12,
      "code": "630",
      "name": "Mittelgrau",
      "RGBColor": "#8a908c",
      "sortPosition": 30
     },
     {
      "id": 11,
      "code": "631",
      "name": "Dunkelgrau",
      "RGBColor": "#4a4a56",
      "sortPosition": 31
     },
     {
      "id": 10,
      "code": "632",
      "name": "Schwarz",
      "RGBColor": "#010103",
      "sortPosition": 32
     },
     {
      "id": 9,
      "code": "633",
      "name": "Champagner",
      "RGBColor": "#e5dece",
      "sortPosition": 33
     },
     {
      "id": 8,
      "code": "634",
      "name": "Beige",
      "RGBColor": "#d4bf92",
      "sortPosition": 34
     },
     {
      "id": 7,
      "code": "635",
      "name": "Lachs",
      "RGBColor": "#fa8c71",
      "sortPosition": 35
     },
     {
      "id": 6,
      "code": "636",
      "name": "Schwarzblau",
      "RGBColor": "#00324b",
      "sortPosition": 36
     },
     {
      "id": 5,
      "code": "637",
      "name": "Leuchtblau",
      "RGBColor": "#0186c9",
      "sortPosition": 37
     },
     {
      "id": 4,
      "code": "638",
      "name": "Weinrot",
      "RGBColor": "#77283d",
      "sortPosition": 38
     },
     {
      "id": 3,
      "code": "645",
      "name": "181-38-112",
      "RGBColor": "#ad0268",
      "sortPosition": 45
     },
     {
      "id": 1,
      "code": "650",
      "name": "229-150-44",
      "RGBColor": "#e5962c",
      "sortPosition": 50
     }
    ],
    "sizes": [
     {
      "id": 14,
      "width": 60,
      "height": 40,
      "weight": 1,
      "available": true
     },
     {
      "id": 15,
      "width": 75,
      "height": 50,
      "weight": 1,
      "available": true
     },
     {
      "id": 16,
      "width": 90,
      "height": 60,
      "weight": 1,
      "available": true
     },
     {
      "id": 17,
      "width": 120,
      "height": 85,
      "weight": 1,
      "available": true
     },
     {
      "id": 18,
      "width": 150,
      "height": 85,
      "weight": 1,
      "available": true
     },
     {
      "id": 19,
      "width": 175,
      "height": 115,
      "weight": 1,
      "available": true
     },
     {
      "id": 20,
      "width": 200,
      "height": 115,
      "weight": 1,
      "available": true
     },
     {
      "id": 21,
      "width": 200,
      "height": 150,
      "weight": 1,
      "available": true
     },
     {
      "id": 22,
      "width": 300,
      "height": 150,
      "weight": 1,
      "available": true
     },
     {
      "id": 23,
      "width": 400,
      "height": 200,
      "weight": 1,
      "available": true
     }
    ],
    "preisdaten": {
     "einkaufProQm": 40.85,
     "salesFactor": 1.87,
     "standardbreiten": [
      60,
      75,
      85,
      115,
      150,
      200
     ]
    },
    "dePfad": "/logomatten/jetprint_light-matten-a",
    "anmerkung": "Artikel 722: x 25-200 cm, y 30-700 cm"
   },
   {
    "id": 4,
    "name": "JetPrint-Velour",
    "description": "Glatte und gleichmäßige Oberfläche für präzisen und detailreichen Druck und erstaunlicher Farbqualität.\r\nEinsatz: Messen, Point of Sale, Werbung",
    "price": "75.42",
    "colors": [
     {
      "id": 76,
      "code": "200",
      "name": "Anthrazit",
      "RGBColor": "#5f5f5f",
      "sortPosition": 67
     }
    ],
    "sizes": [
     {
      "id": 24,
      "width": 60,
      "height": 40,
      "weight": 1,
      "available": true
     },
     {
      "id": 25,
      "width": 75,
      "height": 50,
      "weight": 1,
      "available": true
     },
     {
      "id": 26,
      "width": 90,
      "height": 60,
      "weight": 1,
      "available": true
     },
     {
      "id": 27,
      "width": 115,
      "height": 85,
      "weight": 1,
      "available": true
     },
     {
      "id": 28,
      "width": 175,
      "height": 115,
      "weight": 1,
      "available": true
     },
     {
      "id": 29,
      "width": 200,
      "height": 115,
      "weight": 1,
      "available": true
     },
     {
      "id": 30,
      "width": 200,
      "height": 150,
      "weight": 1,
      "available": true
     },
     {
      "id": 31,
      "width": 250,
      "height": 150,
      "weight": 1,
      "available": true
     },
     {
      "id": 32,
      "width": 300,
      "height": 150,
      "weight": 1,
      "available": true
     },
     {
      "id": 33,
      "width": 300,
      "height": 200,
      "weight": 1,
      "available": true
     },
     {
      "id": 34,
      "width": 400,
      "height": 200,
      "weight": 1,
      "available": true
     }
    ],
    "preisdaten": {
     "einkaufProQm": 39.06,
     "salesFactor": 1.931,
     "standardbreiten": [
      60,
      75,
      85,
      115,
      150,
      200
     ]
    },
    "dePfad": "/logomatten/6400201-velourmatte-a",
    "anmerkung": "Artikel 776: x 30-700 cm, y 30-200 cm (Achsen gegenueber 569 vertauscht)"
   },
   {
    "id": 5,
    "name": "ColorStar",
    "description": "ca. 1 Woche Lieferzeit a.W.\r\nIndividuell angefertigte Hochleistungsmatten. Entwerfen Sie Ihre persönliche Matte.\r\nDie Matte mit sehr hoher Schmutzaufnahmekapazität.\r\nFür Eingänge, Corporate Identity, Point of Sale",
    "price": "101.71",
    "colors": [
     {
      "id": 76,
      "code": "200",
      "name": "Anthrazit",
      "RGBColor": "#5f5f5f",
      "sortPosition": 67
     }
    ],
    "sizes": [
     {
      "id": 35,
      "width": 75,
      "height": 50,
      "weight": 1,
      "available": true
     },
     {
      "id": 36,
      "width": 90,
      "height": 60,
      "weight": 1,
      "available": true
     },
     {
      "id": 37,
      "width": 100,
      "height": 75,
      "weight": 1,
      "available": true
     },
     {
      "id": 38,
      "width": 115,
      "height": 85,
      "weight": 1,
      "available": true
     },
     {
      "id": 39,
      "width": 150,
      "height": 85,
      "weight": 1,
      "available": true
     },
     {
      "id": 40,
      "width": 200,
      "height": 115,
      "weight": 1,
      "available": true
     },
     {
      "id": 41,
      "width": 200,
      "height": 150,
      "weight": 1,
      "available": true
     },
     {
      "id": 42,
      "width": 300,
      "height": 200,
      "weight": 1,
      "available": true
     },
     {
      "id": 43,
      "width": 400,
      "height": 200,
      "weight": 1,
      "available": true
     }
    ],
    "preisdaten": {
     "einkaufProQm": 52.67,
     "salesFactor": 1.931,
     "standardbreiten": [
      60,
      75,
      85,
      115,
      150,
      200
     ]
    },
    "dePfad": "/logomatten/6300201-logomatte-a",
    "anmerkung": "kein eigener Artikel im Altsystem — Material steht im Kommentar"
   }
  ],
  "schriften": [
   {
    "displayName": "Amatic SC",
    "fontFamily": "Amatic SC"
   },
   {
    "displayName": "Anton",
    "fontFamily": "Anton"
   },
   {
    "displayName": "Arial",
    "fontFamily": "Arimo"
   },
   {
    "displayName": "Brush",
    "fontFamily": "Caveat Brush"
   },
   {
    "displayName": "Dancing Script",
    "fontFamily": "Dancing Script"
   },
   {
    "displayName": "Finger Paint",
    "fontFamily": "Finger Paint"
   },
   {
    "displayName": "Ubuntu",
    "fontFamily": "Ubuntu"
   },
   {
    "displayName": "Vast Shadow",
    "fontFamily": "Vast Shadow"
   }
  ],
  "hintergrund": "assets/img/mat-editor-background.jpg",
  "beispielbild": "assets/img/mattenfuchs_square.png"
 }
};
