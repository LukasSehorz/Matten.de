/* dom-struktur.mjs — B7–B12: gerendertes DOM gegen Spec (Navigation, Kopf/Fuß, Modal, Startseite, Kategorien, Produktliste, Produktseiten) */
import { neuesZiel } from './cdp.mjs';
import fs from 'node:fs';

const B = 'http://localhost:8787/net-neu/';
const st = JSON.parse(fs.readFileSync('/Users/lukas.sehorz/Library/CloudStorage/OneDrive-Persönlich/Desktop/Webseiten/Sale/Matten de/Frontend/bridge-demo/spec/struktur.json', 'utf8'));
const kats = Array.isArray(st.kategorien) ? st.kategorien : Object.values(st.kategorien);
const out = {};

async function seite(url, warte) {
  const t = await neuesZiel('about:blank');
  await t.viewport(1280, 2400);
  await t.navigiere(B + url);
  if (warte) await t.warteBis(warte, 15000).catch(() => null);
  await t.pause(400);
  return t;
}

/* --- Startseite: Kopf, Modal, Navigation, Fuss, Inhalt --- */
{
  const t = await seite('index.html', '!!document.querySelector("#carousel-folien .carousel-item")');
  out.kopf = await t.eval(`(function(){
    const q=(s)=>document.querySelector(s); const qa=(s)=>[...document.querySelectorAll(s)];
    return {
      logo: !!q('h1.logo img'), logoSrc: (q('h1.logo img')||{}).getAttribute&&q('h1.logo img').getAttribute('src'), logoHref: (q('a.logo-link')||{}).getAttribute&&q('a.logo-link').getAttribute('href'),
      sprache: (q('.header-links .dropdown-toggle')||{}).textContent?.trim(), sprachOptionen: qa('.header-links .dropdown-item').map(a=>a.textContent.trim()+' -> '+a.getAttribute('href')+(a.title?' ['+a.title+']':'')),
      links: qa('.header-links > a').map(a=>a.textContent.trim()+' -> '+a.getAttribute('href')),
      cartKnopf: (q('button[data-target="#cart-modal"]')||{}).textContent?.replace(/\\s+/g,' ').trim(), cartKlasse: (q('button[data-target="#cart-modal"]')||{}).className,
      auschecken: (q('a.btn-orange')||{}).textContent?.trim(), auscheckenHref: q('a.btn-orange')&&q('a.btn-orange').getAttribute('href'),
      suche: q('form.ml-sm-2') ? { action: q('form.ml-sm-2').getAttribute('action'), method: q('form.ml-sm-2').getAttribute('method'), feld: q('form.ml-sm-2 input').name, platzhalter: q('form.ml-sm-2 input').placeholder, knopf: q('form.ml-sm-2 button').className } : null,
      warnbanner: !!q('.alert.alert-warning.py-1')
    };})()`);
  out.modal = await t.eval(`(function(){
    const m=document.querySelector('#cart-modal'); if(!m) return null;
    return { klassen: m.querySelector('.modal-dialog').className, kopf: m.querySelector('.modal-header').className,
      thead: [...m.querySelectorAll('thead th')].map(th=>th.textContent.trim()+'|'+th.className), leer: m.querySelector('tbody').textContent.trim(),
      tfoot: [...m.querySelectorAll('tfoot tr')].map(tr=>tr.querySelector('th').textContent.trim()+' = '+tr.querySelector('td').textContent.trim()), tfootKlasse: m.querySelector('tfoot').className,
      knopf: (m.querySelector('.btn-secondary')||{}).textContent?.trim(), knopfHref: m.querySelector('.btn-secondary')&&m.querySelector('.btn-secondary').getAttribute('href') };})()`);
  out.navDesktop = await t.eval(`(function(){
    const nav=document.querySelector('nav.main-navbar'); if(!nav) return null;
    return { klasse: nav.className, eintraege: [...nav.querySelectorAll('ul.navbar-nav > li.nav-item')].map(li=>{
      const a=li.querySelector(':scope > a'); const sp=li.querySelector(':scope > span.category-dropdown-trigger');
      if(a) return { typ:'link', label:a.textContent.trim(), href:a.getAttribute('href') };
      return { typ:'gruppe', label: sp.childNodes[0].textContent.trim(), kacheln: [...sp.querySelectorAll('.category-dropdown-link-container')].map(k=>({ label:k.querySelector('p').textContent.trim(), href:k.querySelector('a').getAttribute('href'), col:k.className, bild: k.querySelector('img')? k.querySelector('img').getAttribute('src').split('/').pop() : null, wh: k.querySelector('img')? k.querySelector('img').width+'x'+k.querySelector('img').height : null })) };
    }) };})()`);
  out.navMobil = await t.eval(`(function(){
    const nav=document.querySelector('nav.d-lg-none'); if(!nav) return null;
    return { eintraege: [...nav.querySelectorAll('ul.navbar-nav > li.nav-item')].map(li=>{ const a=li.querySelector(':scope > a'); const dd=li.querySelector('.dropdown-menu');
      return a.textContent.trim()+(dd? ' ['+[...dd.querySelectorAll('a')].map(x=>x.textContent.trim()+'|'+x.className).join(', ')+']' : ' -> '+a.getAttribute('href')); }) };})()`);
  out.fuss = await t.eval(`(function(){
    const f=document.querySelector('footer'); if(!f) return null;
    return { spalten: [...f.querySelectorAll('.col')].map(c=>({ titel:c.querySelector('h3.footer-title').textContent.trim(), inhalt: c.querySelector('ul')? [...c.querySelectorAll('li a')].map(a=>a.textContent.trim()+' -> '+a.getAttribute('href')) : c.querySelector('.contact-info').innerText.trim().split('\\n') })),
      copyright: f.querySelector('.text-center').textContent.trim(), newsletter: { label: document.querySelector('.subscribe-widget-label')?.textContent.trim(), platzhalter: document.querySelector('#subscribe-email')?.placeholder, knopf: document.querySelector('.subscribe-widget-button')?.textContent.trim(), method: document.querySelector('#subscribe-form')?.getAttribute('method') },
      cookie: !!document.querySelector('#cookieconsent') };})()`);
  out.start = await t.eval(`(function(){
    const q=(s)=>document.querySelector(s); const qa=(s)=>[...document.querySelectorAll(s)];
    return { datenschutz: q('.protection-info')?.innerText.replace(/\\s+/g,' ').trim(), datenschutzLink: q('.protection-info a')?.getAttribute('href'),
      karussell: { ride: q('#carousel')?.getAttribute('data-ride'), indikatoren: qa('#carousel-indikatoren li').length, folien: qa('.carousel-item').map(f=>({ titel:f.querySelector('h5.h2')?.textContent.trim(), unter:f.querySelector('p.h4')?.textContent.trim(), bild:f.querySelector('img')?.getAttribute('src').split('/').pop(), alt:f.querySelector('img')?.getAttribute('alt'), href:f.querySelector('a')?.getAttribute('href'), imgW: f.querySelector('img')?.naturalWidth+'x'+f.querySelector('img')?.naturalHeight, h: f.querySelector('img')?.getBoundingClientRect().height })), prev: q('.carousel-control-prev .sr-only')?.textContent, next: q('.carousel-control-next .sr-only')?.textContent },
      featured: { titel: q('#featured-titel')?.textContent.trim(), href: q('#featured a')?.getAttribute('href'), caption: q('#featured .category-thumbnail-caption')?.textContent.trim(), bild: q('#featured .category-thumbnail')?.style.backgroundImage, col: q('#featured > div')?.className },
      top: qa('#top-angebote > div').map(d=>({ col:d.className, href:d.querySelector('a').getAttribute('href'), name:d.querySelector('.card-title').textContent.trim(), img: d.querySelector('img')?.getAttribute('src').split('/').pop(), alt:d.querySelector('img')?.getAttribute('alt'), wh: d.querySelector('img')?.getAttribute('width')+'x'+d.querySelector('img')?.getAttribute('height'), innerA: !!d.querySelector('.card-title a') })),
      mattenfuchs: q('#mattenfuchs-text')?.textContent.trim().slice(0,60)+' … '+q('#mattenfuchs-text')?.textContent.trim().slice(-30), mattenfuchsLaenge: q('#mattenfuchs-text')?.textContent.trim().length,
      vorteile: qa('#vorteile .info-col').map(c=>({ col:c.className, text:c.querySelector('.info-text').textContent.trim(), img: c.querySelector('img')?.getAttribute('src').split('/').pop(), alt:c.querySelector('img')?.getAttribute('alt'), ok: c.querySelector('img')?.naturalWidth>0 })),
      h2s: qa('h2.background span').map(s=>s.textContent.trim()) };})()`);
  await t.schliessen();
}

/* --- Kategorien: Titel, Beschreibung, Produktzahl, Filter --- */
{
  out.kategorien = [];
  for (const k of kats) {
    const t = await seite('kategorie.html?slug=' + k.slug, '!!document.querySelector("#kategorie-name") && document.querySelector("#kategorie-name").textContent.length>0');
    const r = await t.eval(`(function(){ const q=(s)=>document.querySelector(s); const qa=(s)=>[...document.querySelectorAll(s)];
      return { h1: q('h1.display-5')?.textContent.trim(), beschr: q('#kategorie-beschreibung')?.textContent.trim(), bild: q('#kategorie-kopf')?.style.backgroundImage.split('/').pop(), karten: qa('#produkt-raster > div').length, kartenKlassen: [...new Set(qa('#produkt-raster > div').map(d=>d.className))],
        slugs: qa('#produkt-raster a[href]').map(a=>a.getAttribute('href').replace('produkt.html?slug=','')),
        sort: { label: q('label[for=filter-sort]')?.textContent.trim(), optionen: qa('#filter-sort option').map(o=>o.value+'='+o.textContent.trim()+(o.selected?'*':'')), klasse: q('#filter-sort')?.className, name: q('#filter-sort')?.name, knopf: q('#filter button.btn-primary')?.textContent.trim(), toggle: q('#filter-toggle')?.className, formKlasse: q('#filter')?.className } }; })()`);
    out.kategorien.push({ slug: k.slug, spec: { name: k.name, n: (k.produkte || []).length, beschr: (k.beschreibung || '').trim() }, ist: r, konsole: t.konsole });
    await t.schliessen();
  }
}

/* --- Produktliste --- */
{
  const t = await seite('products.html', '!!document.querySelector("#produkt-raster > div")');
  out.produkte1 = await t.eval(`(function(){ const q=(s)=>document.querySelector(s); const qa=(s)=>[...document.querySelectorAll(s)];
    return { h: qa('h1,h2').filter(h=>!h.classList.contains('logo')).map(h=>h.textContent.trim()), gruppen: qa('#filter-gruppen .filter-category-parent').map(b=>b.textContent.trim()+'('+document.getElementById(b.getAttribute('aria-controls')).querySelectorAll('input').length+')'), kaestchen: qa('#filter-gruppen input[name="category[]"]').length, alleAn: qa('#filter-gruppen input[name="category[]"]').every(i=>i.checked),
      sort: qa('#filter-sort option').map(o=>o.value+'='+o.textContent.trim()), karten: qa('#produkt-raster > div').length, namen: qa('#produkt-raster .card-title').map(x=>x.textContent.trim()), pag: qa('#seitenzahlen li').map(li=>li.textContent.trim()+(li.className.includes('active')?'*':'')+(li.className.includes('disabled')?'(x)':'')) }; })()`);
  await t.navigiere(B + 'products.html?page=2'); await t.pause(800);
  out.produkte2 = await t.eval(`(function(){ const qa=(s)=>[...document.querySelectorAll(s)]; return { karten: qa('#produkt-raster > div').length, namen: qa('#produkt-raster .card-title').map(x=>x.textContent.trim()), pag: qa('#seitenzahlen li').map(li=>li.textContent.trim()+(li.className.includes('active')?'*':'')) }; })()`);
  await t.navigiere(B + 'products.html?keyword=Kokos'); await t.pause(800);
  out.produkteSuche = await t.eval(`(function(){ const qa=(s)=>[...document.querySelectorAll(s)]; return { karten: qa('#produkt-raster > div').length, namen: qa('#produkt-raster .card-title').map(x=>x.textContent.trim()), suchfeld: document.querySelector('.search-box input').value }; })()`);
  await t.navigiere(B + 'products.html?filter_sort=NAME_DESC'); await t.pause(800);
  out.produkteSort = await t.eval(`(function(){ const qa=(s)=>[...document.querySelectorAll(s)]; return { namen: qa('#produkt-raster .card-title').map(x=>x.textContent.trim()).slice(0,5), sel: document.querySelector('#filter-sort').value }; })()`);
  await t.navigiere(B + 'products.html?category[]=2'); await t.pause(800);
  out.produkteFilter = await t.eval(`(function(){ const qa=(s)=>[...document.querySelectorAll(s)]; return { karten: qa('#produkt-raster > div').length, namen: qa('#produkt-raster .card-title').map(x=>x.textContent.trim()), an: qa('#filter-gruppen input:checked').map(i=>i.value) }; })()`);
  await t.schliessen();
}

/* --- Produktseiten: Markup --- */
{
  out.produktseiten = {};
  for (const slug of ['jetprint-premium', 'aluminium-profilmatte-typ-diplomat-r', 'kokosmatten-naturfarbig', 'iron-horse-matte']) {
    const t = await seite('produkt.html?slug=' + slug, '!!document.querySelector("#price") && !document.querySelector("#price .spinner-border")');
    await t.pause(500);
    out.produktseiten[slug] = await t.eval(`(function(){ const q=(s)=>document.querySelector(s); const qa=(s)=>[...document.querySelectorAll(s)];
      const sichtbar=(s)=>{ const e=q(s); return e? getComputedStyle(e).display!=='none' : null; };
      return { bodyId: document.body.id, krumen: qa('#brotkrumen li').map(li=>li.textContent.trim()+(li.querySelector('a')?' -> '+li.querySelector('a').getAttribute('href'):'')), h2: q('.single-product-info h2')?.textContent.trim(), stars: q('.stars')?.innerHTML.trim()==='', formId: q('form#add_to_cart_form')?.className,
        bilder: { gross: qa('#variety-images .product-image-container').length, aktiv: q('#variety-images .product-image-container.active')?.id, grossSrc: q('#variety-images .product-image-container.active img')?.getAttribute('src'), grossWH: q('#variety-images .product-image-container.active img')?.getAttribute('width')+'x'+q('#variety-images .product-image-container.active img')?.getAttribute('height'), minis: qa('#bild-nav .product-image-nav-item').filter(a=>!a.parentElement.hidden).map(a=>a.getAttribute('data-target')+(a.classList.contains('active')?'*':'')), miniKlasse: q('#bild-nav > div')?.className, farbBildSichtbar: !q('#bild-nav-farbe')?.hidden, farbBildSrc: q('#image-farbe img')?.getAttribute('src') },
        farben: qa('.color-input-container').map(c=>({ label: c.querySelector('label')?.textContent.trim(), small: c.querySelector('small')?.textContent.trim(), n: c.querySelectorAll('span.color-input').length, sichtbar: [...c.querySelectorAll('span.color-input')].filter(s=>getComputedStyle(s).display!=='none').length, erste: [...c.querySelectorAll('span.color-input')].slice(0,3).map(s=>s.querySelector('label').textContent.trim()+'|'+s.querySelector('label').title+'|'+s.querySelector('label').style.backgroundColor+'|'+s.querySelector('input').name+'='+s.querySelector('input').value), mehr: c.querySelector('.color-collapse-button')? c.querySelector('.show-label').textContent+'/'+c.querySelector('.hide-label').textContent : null, weitere: c.querySelector('#multiple_colors')? c.querySelector('label[for=multiple_colors]').textContent.trim() : null })),
        selects: qa('select.attribute-select').map(s=>({ name:s.name, label: s.closest('.form-group').querySelector('label').textContent.trim(), optionen:[...s.options].map(o=>o.value+'='+o.textContent.trim()) })),
        groesse: q('#input_fixed_size')? { label: q('label[for=input_fixed_size]')?.textContent.trim(), name: q('#input_fixed_size').name, optionen: [...q('#input_fixed_size').options].map(o=>o.value+'='+o.textContent.trim()+' [w'+o.getAttribute('data-width')+' l'+o.getAttribute('data-length')+' p'+o.getAttribute('data-price')+']') } : null,
        breite: { label: q('label[for=input_width]')?.textContent.trim(), min: q('#input_width')?.min, max: q('#input_width')?.max, value: q('#input_width')?.value, ph: q('#input_width')?.placeholder, title: q('#input_width')?.title, sichtbar: sichtbar('#order_input_width'), fixedSichtbar: sichtbar('#order_input_fixed_width'), fixedOptionen: qa('#input_fixed_width option').map(o=>o.value) },
        laenge: { label: q('label[for=input_length]')?.textContent.trim(), min: q('#input_length')?.min, max: q('#input_length')?.max, value: q('#input_length')?.value, ph: q('#input_length')?.placeholder, title: q('#input_length')?.title, sichtbar: sichtbar('#order_input_length') },
        menge: { label: q('label[for=input_quantity]')?.textContent.trim(), value: q('#input_quantity')?.value, min: q('#input_quantity')?.min, ph: q('#input_quantity')?.placeholder },
        preis: { label: q('label[for=price]')?.textContent.trim(), text: q('#price')?.textContent.trim(), mwst: q('#price')?.parentElement.querySelector('small .no-wrap')?.textContent.trim(), versand: q('#shipping_cost')?.textContent.trim(), endpreis: q('#endpreis')?.textContent.trim(), weg: q('#weg-hinweis')?.textContent.trim() },
        sonder: qa('.sonder-kreuze label').map(l=>l.textContent.replace(/\\s+/g,' ').trim()),
        knoepfe: qa('#add-to-cart, #add-to-inquiry').map(b=>b.id+'|'+b.textContent.trim()+'|'+b.value+'|'+b.name+'|'+b.className+'|disabled='+b.disabled),
        reiter: qa('.nav-tabs a').map(a=>a.textContent.trim()+'|'+a.getAttribute('href')+(a.classList.contains('active')?'*':'')), beschrLaenge: q('#description .description-content')?.innerHTML.length, reviewsLeer: q('#reviews')?.textContent.trim()==='',
        meldung: q('#produkt-meldung')?.textContent.trim() }; })()`);
    out.produktseiten[slug].konsole = t.konsole;
    await t.schliessen();
  }
}

fs.writeFileSync('dom-struktur.json', JSON.stringify(out, null, 1));
console.log('geschrieben dom-struktur.json');
