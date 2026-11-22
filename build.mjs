// Builds the static site into dist/ from content.mjs. Run: node build.mjs (no dependencies).
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SITE, ROUTES, VARIANTS, CATEGORIES, PROJECTS, AWARDS, MENTIONS, T } from './content.mjs';

const OUT = 'dist';
const BUILT = new Date().toISOString().slice(0, 10);
const MOCKUP = PROJECTS.some((p) => p.placeholder);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (path) => SITE.domain + path;
const rel = (from, to) => {
  const depth = from.split('/').filter(Boolean).length;
  return (depth ? '../'.repeat(depth) : './') + to.replace(/^\//, '');
};
const asset = (from, file) => rel(from, '/assets/' + file);
const img = (from, name, sm) => asset(from, `projects/${name}${sm ? '-sm' : ''}.jpg`);
const projectPath = (p, lang) => ROUTES.portfolio[lang] + p.slug + '/';
const catLabel = (id) => CATEGORIES.find((c) => c.id === id).label;

const MARK = `M375 97H238a139 139 0 0 0 0 278h137zM417 97h141a139 139 0 0 1 0 278H417zM112 417h137a139 139 0 0 1 0 278H112zM417 417h141a139 139 0 0 1 0 278H417z`;
// the mark as four separate blocks, so they can move apart and together
const ICON = `<svg class="icon-mark" viewBox="60 55 680 680" aria-hidden="true" focusable="false">${MARK.split('z').filter(Boolean).map((d, i) => `<path class="b${i}" d="${d}z"/>`).join('')}</svg>`;
const ARROW = `<svg class="arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ---------- structured data ----------
const ID = { studio: SITE.domain + '/#studio', person: SITE.domain + '/#stefan', site: SITE.domain + '/#website' };
function graphBase(t) {
  const awards = AWARDS.map((a) => `${a.title[t.lang]}, ${a.result[t.lang]} (${a.project[t.lang]})`);
  return [
    {
      '@type': ['ProfessionalService', 'Organization'], '@id': ID.studio,
      name: SITE.brand, alternateName: 'Stefan Bugalete Architecture & Design', url: SITE.domain + '/', email: SITE.email,
      logo: abs('/assets/logo-black.png'), image: abs('/assets/stefan-portrait.jpg'), description: t.home.description,
      founder: { '@id': ID.person },
      address: [
        { '@type': 'PostalAddress', addressLocality: 'Iași', addressCountry: 'RO' },
        { '@type': 'PostalAddress', addressLocality: 'București', addressCountry: 'RO' },
      ],
      areaServed: [{ '@type': 'Country', name: 'Romania' }, { '@type': 'Place', name: t.lang === 'ro' ? 'Internațional, la distanță' : 'International, remote' }],
      knowsAbout: t.lang === 'ro'
        ? ['arhitectură', 'design interior', 'design interior rezidențial premium', 'design clinici medicale', 'design clinici dentare', 'supervizare execuție', 'amenajări la cheie']
        : ['architecture', 'interior design', 'premium residential interior design', 'medical clinic design', 'dental clinic design', 'site supervision', 'turnkey interiors'],
      award: awards, sameAs: [SITE.instagram],
      hasOfferCatalog: { '@type': 'OfferCatalog', name: t.lang === 'ro' ? 'Servicii' : 'Services', itemListElement: t.about.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s } })) },
    },
    {
      '@type': 'Person', '@id': ID.person, name: SITE.name, alternateName: 'Stefan Bugalete',
      jobTitle: t.lang === 'ro' ? 'Arhitect și designer de interior' : 'Architect and interior designer',
      image: abs('/assets/stefan-portrait.jpg'), worksFor: { '@id': ID.studio }, award: awards, sameAs: [SITE.instagram], url: abs(ROUTES.about[t.lang]),
    },
    { '@type': 'WebSite', '@id': ID.site, url: SITE.domain + '/', name: SITE.brand, inLanguage: ['en', 'ro'], publisher: { '@id': ID.studio } },
  ];
}
function ld(t, page, extra = []) {
  const url = abs(page.path);
  const g = [...graphBase(t), { '@type': page.type || 'WebPage', '@id': url + '#page', url, name: page.title, description: page.description, inLanguage: t.lang, isPartOf: { '@id': ID.site }, about: { '@id': ID.studio }, dateModified: BUILT }, ...extra];
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c')}</script>`;
}

// ---------- shell ----------
function head(t, page) {
  return `<!doctype html>
<html lang="${t.lang}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
${MOCKUP ? '<meta name="robots" content="noindex"><!-- mockup photos: remove placeholder:true in content.mjs when real projects are in -->\n' : ''}<link rel="canonical" href="${abs(page.path)}">
<link rel="alternate" hreflang="ro" href="${abs(page.alt.ro)}">
<link rel="alternate" hreflang="en" href="${abs(page.alt.en)}">
<link rel="alternate" hreflang="x-default" href="${abs(page.alt.en)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.brand)}">
<meta property="og:locale" content="${t.locale}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${abs(page.path)}">
<meta property="og:image" content="${abs(page.ogImage || '/assets/stefan-portrait.jpg')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#eeeae3">
<link rel="icon" href="${asset(page.path, 'favicon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${asset(page.path, 'site.css')}">
<script>document.documentElement.classList.replace('no-js','js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('enter');setTimeout(function(){document.documentElement.classList.add('entered')},1600);setTimeout(function(){document.documentElement.classList.add('settled')},3200)}</script>
${page.ld}
</head>`;
}

function header(t, page) {
  const here = page.path;
  const link = (k) => `<a href="${rel(here, ROUTES[k][t.lang])}"${page.nav === k ? ' aria-current="page"' : ''}>${t.nav[k]}</a>`;
  const langs = `<span class="langs"><a href="${rel(here, page.alt.ro)}" hreflang="ro" lang="ro"${t.lang === 'ro' ? ' aria-current="true"' : ''}>RO</a><a href="${rel(here, page.alt.en)}" hreflang="en" lang="en"${t.lang === 'en' ? ' aria-current="true"' : ''}>EN</a></span>`;
  return `<a class="skip" href="#main">${t.skip}</a>
<header class="bar">
  <a class="brand" href="${rel(here, ROUTES.home[t.lang])}" aria-label="${esc(SITE.name)}, ${esc(t.tagline)}">${ICON}</a>
  <nav class="topnav" aria-label="${t.lang === 'ro' ? 'Principal' : 'Main'}">
    ${['portfolio', 'about', 'contact'].map((k) => `<a href="${rel(here, ROUTES[k][t.lang])}"${page.nav === k ? ' aria-current="page"' : ''}>${t.nav[k].toLowerCase()}</a>`).join('')}
    <span class="topnav__sep" aria-hidden="true"></span>
    <a href="${rel(here, page.alt[t.other])}" hreflang="${t.other}" lang="${t.other}" aria-label="${t.switchName}">${t.switchLabel.toLowerCase()}</a>
  </nav>
  <button class="menu" type="button" aria-expanded="false" aria-controls="nav" data-open="${t.menu.toLowerCase()}" data-close="${t.close.toLowerCase()}">${t.menu.toLowerCase()}</button>
  <div class="overlay" id="nav">
    <nav class="overlay__nav" aria-label="${t.lang === 'ro' ? 'Principal' : 'Main'}">
      <a href="${rel(here, ROUTES.home[t.lang])}"${page.nav === 'home' ? ' aria-current="page"' : ''}>${t.lang === 'ro' ? 'acasă' : 'home'}</a>
      ${['portfolio', 'about', 'contact'].map((k) => `<a href="${rel(here, ROUTES[k][t.lang])}"${page.nav === k ? ' aria-current="page"' : ''}>${t.nav[k].toLowerCase()}</a>`).join('\n      ')}
    </nav>
    <div class="overlay__foot">
      <p><a class="ln" href="mailto:${SITE.email}">${SITE.email}</a></p>
      <p><a class="ln" href="${SITE.instagram}" rel="me noopener" target="_blank">Instagram</a></p>
      ${langs}
    </div>
  </div>
</header>`;
}

function footer(t, page) {
  const here = page.path;
  return `<footer class="foot">
  <div class="foot__top">
    <nav class="foot__nav" aria-label="${t.lang === 'ro' ? 'Subsol' : 'Footer'}">
      ${['portfolio', 'about', 'contact'].map((k) => `<a href="${rel(here, ROUTES[k][t.lang])}"${page.nav === k ? ' aria-current="page"' : ''}>${t.nav[k].toLowerCase()}</a>`).join('\n      ')}
    </nav>
    <p class="foot__links"><a class="ln" href="mailto:${SITE.email}">${SITE.email}</a><a class="ln" href="${SITE.instagram}" rel="me noopener" target="_blank">Instagram</a><span class="langs"><a href="${rel(here, page.alt.ro)}" hreflang="ro" lang="ro"${t.lang === 'ro' ? ' aria-current="true"' : ''}>RO</a><a href="${rel(here, page.alt.en)}" hreflang="en" lang="en"${t.lang === 'en' ? ' aria-current="true"' : ''}>EN</a></span></p>
  </div>
  <div class="foot__legal">
    <a class="foot__mark" href="${rel(here, ROUTES.home[t.lang])}" aria-label="${esc(SITE.name)}">${ICON}<span>© ${new Date().getFullYear()} ${esc(SITE.brand)}</span></a>
    <span class="foot__cats">Architecture · Interior · Health</span>
  </div>
</footer>
<script src="${asset(page.path, 'site.js')}" defer></script>
</body>
</html>`;
}

const btn = (href, label, cls = '') => `<a class="btn ${cls}" href="${href}"><span>${esc(label)}</span>${ARROW}</a>`;
const awardsList = (t) => `<ul class="awards">${AWARDS.map((a) => `
  <li class="award"><span class="award__year">${a.year}</span><span class="award__title">${esc(a.title[t.lang])}</span><span class="award__meta">${esc(a.result[t.lang])}</span><span class="award__project">${esc(a.project[t.lang])}</span></li>`).join('')}
</ul>`;

// The project card used on the home page and in the portfolio.
function card(t, here, p, i, size = '') {
  return `<li class="card ${size}" data-cat="${p.category}">
  <a class="card__link" href="${rel(here, projectPath(p, t.lang))}">
    <span class="card__media"><img src="${img(here, p.images[0], true)}" srcset="${img(here, p.images[0], true)} 900w, ${img(here, p.images[0])} 1800w" sizes="(max-width: 760px) 100vw, 50vw" alt="${esc(p.title[t.lang])}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async"></span>
    <span class="card__meta"><span class="card__title">${esc(p.title[t.lang])}</span><span class="card__cat">${catLabel(p.category)}</span></span>
  </a>
</li>`;
}

// ---------- pages ----------
function home(t) {
  // the home page: every portfolio photograph drifting past the name, without end
  return infinite(t, 'colaj', true);
}

function portfolio(t) {
  const P = t.portfolio, here = ROUTES.portfolio[t.lang];
  const page = { path: here, alt: ROUTES.portfolio, title: P.title, description: P.description, nav: 'portfolio', type: 'CollectionPage' };
  page.ld = ld(t, page, [{ '@type': 'ItemList', itemListElement: PROJECTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(projectPath(p, t.lang)), name: p.title[t.lang] })) }]);
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, PROJECTS.filter((p) => p.category === c.id).length]));
  const meta = (p) => [catLabel(p.category), p.year, p.area].filter(Boolean).join(' · ');
  const cards = PROJECTS.map((p, i) => `<li class="hw-card${i % 4 === 0 || i % 4 === 3 ? ' hw-card--tall' : ''}" data-cat="${p.category}">
        <a href="${rel(here, projectPath(p, t.lang))}">
          <span class="hw-card__media"><img src="${img(here, p.images[0], true)}" srcset="${img(here, p.images[0], true)} 900w, ${img(here, p.images[0])} 1800w" sizes="(max-width: 760px) 100vw, 50vw" alt="${esc(p.title[t.lang])}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async"></span>
          <span class="hw-card__meta"><span class="hw-card__title">${esc(p.title[t.lang])}</span><span class="hw-card__info">${esc(meta(p))}</span></span>
        </a>
      </li>`).join('\n      ');
  return `${head(t, page)}
<body class="page-portfolio">
${header(t, page)}
<main id="main">
  <section class="pf-head" aria-labelledby="pf-h">
    <h1 id="pf-h" class="pf-head__h1" data-enter>${esc(P.h1.toLowerCase())}</h1>
    <div class="pf-head__row" data-enter>
      <p class="pf-head__lead">${esc(P.lead)}</p>
      <div class="filters" role="group" aria-label="${esc(P.filterLabel)}" data-count-one="${esc(P.count(1))}" data-count-many="${esc(P.count(2)).replace('2', '{n}')}">
        <button type="button" class="chip" aria-pressed="true" data-filter="all">${t.all}<sup>${PROJECTS.length}</sup></button>
        ${CATEGORIES.map((c) => `<button type="button" class="chip" aria-pressed="false" data-filter="${c.id}">${c.label}<sup>${counts[c.id]}</sup></button>`).join('\n        ')}
      </div>
    </div>
    <p class="sr-only" role="status" aria-live="polite" data-filter-status></p>
  </section>
  <section class="hw-projects hw-projects--pf" aria-label="${esc(P.h1)}">
    <ul class="hw-grid pf-grid">
      ${cards}
    </ul>
  </section>
</main>
${footer(t, page)}`;
}

function project(t, p, i) {
  const here = projectPath(p, t.lang);
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const name = p.title[t.lang];
  const title = `${name} | ${catLabel(p.category)} | ${SITE.name}`;
  const description = p.summary[t.lang] || (t.lang === 'ro' ? `${name}: proiect ${catLabel(p.category)} semnat de ${SITE.name}.` : `${name}: ${catLabel(p.category).toLowerCase()} project by ${SITE.name}.`);
  const page = { path: here, alt: { ro: projectPath(p, 'ro'), en: projectPath(p, 'en') }, title, description, nav: 'portfolio', ogImage: `/assets/projects/${p.images[0]}.jpg` };
  page.ld = ld(t, page, [{ '@type': 'CreativeWork', name, genre: catLabel(p.category), creator: { '@id': ID.person }, image: p.images.map((n) => abs(`/assets/projects/${n}.jpg`)), url: abs(here) }]);
  const L = t.lang === 'ro'
    ? { cat: 'Categorie', year: 'An', area: 'Suprafață', place: 'Locație', next: 'Proiectul următor', index: 'Lucrări' }
    : { cat: 'Category', year: 'Year', area: 'Area', place: 'Location', next: 'Next project', index: 'Work' };
  const facts = [[L.cat, catLabel(p.category)], [L.year, p.year], [L.area, p.area], [L.place, p.place && (p.place[t.lang] || p.place)]].filter(([, v]) => v);
  const pad = (n) => String(n).padStart(2, '0');
  const total = p.images.length;
  // the pictures, in a rhythm: one wide, a pair, one wide, a pair…
  const rows = [];
  for (let k = 0; k < total;) {
    if (rows.length % 2 === 0) { rows.push([k]); k += 1; } else { rows.push([k, k + 1].filter((x) => x < total)); k += 2; }
  }
  const pic = (k, sizes) => `<figure class="pj2-pic"><img src="${img(here, p.images[k], true)}" srcset="${img(here, p.images[k], true)} 900w, ${img(here, p.images[k])} 1800w" sizes="${sizes}" alt="${esc(name)}" ${k === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"><figcaption>${pad(k + 1)} / ${pad(total)}</figcaption></figure>`;
  const gallery = rows.map((r) => `<div class="pj2-row${r.length > 1 ? ' pj2-row--pair' : ''}">${r.map((k) => pic(k, r.length > 1 ? '(max-width: 860px) 100vw, 33vw' : '(max-width: 860px) 100vw, 66vw')).join('')}</div>`).join('\n      ');
  return `${head(t, page)}
<body class="page-project">
${header(t, page)}
<main id="main">
  <article class="pj2" aria-labelledby="pj-h">
    <aside class="pj2-info">
      <div class="pj2-info__in">
        <p class="pj2-top" data-enter><a class="pj2-back" href="${rel(here, ROUTES.portfolio[t.lang])}">← ${esc(L.index)}</a><span>${pad(i + 1)} / ${pad(PROJECTS.length)}</span></p>
        <h1 id="pj-h" class="pj2-title" data-enter>${esc(name)}</h1>
        <dl class="pj2-facts" data-enter>
          ${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n          ')}
        </dl>
        <p class="pj2-text" data-enter>${esc(p.summary[t.lang] || t.descriptionSoon)}</p>
      </div>
    </aside>
    <div class="pj2-gallery">
      ${gallery}
    </div>
  </article>

  <a class="pj2-next" href="${rel(here, projectPath(next, t.lang))}">
    <span class="label">${esc(L.next)}</span>
    <span class="pj2-next__row"><span class="pj2-next__title">${esc(next.title[t.lang])}</span><span class="pj2-next__thumb"><img src="${img(here, next.images[0], true)}" alt="" loading="lazy" decoding="async"></span>${ARROW}</span>
    <span class="pj2-next__cat">${catLabel(next.category)}</span>
  </a>
</main>
${footer(t, page)}`;
}

function about(t) {
  const a = t.about, here = ROUTES.about[t.lang];
  const page = { path: here, alt: ROUTES.about, title: a.title, description: a.description, nav: 'about', type: 'AboutPage' };
  page.ld = ld(t, page);
  const [lead, ...rest] = a.bio;
  const [first, ...last] = SITE.name.split(' ');
  const L = t.lang === 'ro' ? { bio: 'Biografie', press: 'Apariții și mențiuni' } : { bio: 'Biography', press: 'Press and mentions' };
  const row = (year, title, meta, url) => `<li class="ab2-row">
          <span class="ab2-row__year">${esc(year)}</span>
          <span class="ab2-row__title">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(title)}</a>` : esc(title)}</span>
          <span class="ab2-row__meta">${esc(meta)}</span>
        </li>`;
  return `${head(t, page)}
<body class="page-about">
${header(t, page)}
<main id="main">
  <section class="pf-head ab2-head" aria-labelledby="ab-h">
    <h1 id="ab-h" class="pf-head__h1" data-enter>${esc(t.nav.about.toLowerCase())}</h1>
  </section>
  <section class="ab2-intro" aria-label="${esc(SITE.name)}">
    <div class="ab2-intro__words">
      <p class="ab2-name" data-enter><span>${esc(first)}</span><span>${esc(last.join(' '))}</span></p>
      <p class="ab2-role" data-enter>${esc(a.role)}</p>
      <p class="ab-lead ab2-lead" data-enter>${esc(lead)}</p>
    </div>
    <figure class="ab2-portrait" data-enter>
      <img src="${asset(here, 'stefan-portrait.jpg')}" width="1066" height="1600" alt="${esc(a.portraitAlt)}" fetchpriority="high">
    </figure>
  </section>

  <section class="ab2-sec" aria-labelledby="bio-h">
    <h2 id="bio-h" class="label ab2-sec__label">${esc(L.bio)}</h2>
    <div class="ab2-bio">${rest.map((x) => `<p>${esc(x)}</p>`).join('')}</div>
  </section>

  <section class="ab2-sec" aria-labelledby="aw-h">
    <h2 id="aw-h" class="label ab2-sec__label">${esc(a.awardsTitle)}</h2>
    <ul class="ab2-rows">
        ${AWARDS.map((w) => row(w.year, w.title[t.lang], `${w.result[t.lang]} · ${w.project[t.lang]}`)).join('\n        ')}
    </ul>
  </section>

  <section class="ab2-sec" aria-labelledby="pr-h">
    <h2 id="pr-h" class="label ab2-sec__label">${esc(L.press)}</h2>
    <ul class="ab2-rows ab2-rows--small">
        ${MENTIONS.map((m) => row(m.year, m.outlet, m.title[t.lang] || m.title.ro, m.url)).join('\n        ')}
    </ul>
  </section>
</main>
${footer(t, page)}`;
}

function contact(t) {
  const c = t.contact, f = c.form, here = ROUTES.contact[t.lang];
  const page = { path: here, alt: ROUTES.contact, title: c.title, description: c.description, nav: 'contact', type: 'ContactPage' };
  page.ld = ld(t, page);
  const field = (id, label, input, err, wide) => `<div class="field${wide ? ' field--wide' : ''}"><label for="${id}">${label}</label>${input}${err ? `<p class="field__err" id="${id}-err" hidden>${esc(err)}</p>` : ''}</div>`;
  const [user, domain] = SITE.email.split('@');
  return `${head(t, page)}
<body class="page-contact">
${header(t, page)}
<main id="main">
  <section class="ct2-head" aria-labelledby="ct-h">
    <h1 id="ct-h" class="sr-only">${esc(t.nav.contact)} · ${esc(SITE.name)}</h1>
    <p class="ct2-statement" data-enter>${esc(c.h1)}</p>
    <a class="ct2-mail" href="mailto:${SITE.email}" data-enter><span class="ct2-mail__user">${esc(user)}</span><span class="ct2-mail__at">@</span><span class="ct2-mail__domain">${esc(domain)}</span>${ARROW}</a>
  </section>

  <section class="ct2-grid" aria-label="${esc(t.nav.contact)}">
    <div class="ct2-side">
      <ul class="ct2-topics">${c.topics.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="ct2-ig"><span class="label">Instagram</span><a class="ln" href="${SITE.instagram}" rel="me noopener" target="_blank">${SITE.instagramHandle}</a></p>
    </div>
    <form class="form ct-form ct2-form" action="mailto:${SITE.email}" method="post" enctype="text/plain" novalidate
      data-email="${SITE.email}" data-subject="${esc(f.subject)}" data-opened="${esc(f.opened)}" data-err-one="${esc(f.errOne)}" data-err-many="${esc(f.errMany)}">
      ${field('f-name', f.name, '<input id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="f-name-err">', f.errName)}
      ${field('f-email', f.email, '<input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="f-email-err">', f.errEmail)}
      ${field('f-type', f.type, `<select id="f-type" name="type"><option value="">${esc(f.choose)}</option>${f.types.map((x) => `<option>${esc(x)}</option>`).join('')}</select>`, null, true)}
      ${field('f-message', f.message, '<textarea id="f-message" name="message" rows="4" required aria-describedby="f-message-err"></textarea>', f.errMessage, true)}
      <div class="form__foot"><p class="form__note">${esc(f.note)}</p><button class="ct-send" type="submit"><span>${esc(f.send)}</span>${ARROW}</button></div>
      <p class="form__status" role="status" aria-live="polite"></p>
    </form>
  </section>
</main>
${footer(t, page)}`;
}

// ---------- second versions of Info and Contact, to compare (noindex, not in the menu) ----------
const noindex = (html) => html.includes('name="robots"') ? html : html.replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="canonical"');

function aboutV2(t) {
  const a = t.about, here = VARIANTS.about[t.lang];
  const page = { path: here, alt: VARIANTS.about, title: a.title, description: a.description, nav: 'about', type: 'AboutPage' };
  page.ld = '';
  const L = t.lang === 'ro'
    ? { services: 'Servicii', awards: 'Premii', faq: 'Întrebări', press: 'Apariții', offices: 'Iași · București · la distanță', cta: 'Pornește un proiect' }
    : { services: 'Services', awards: 'Awards', faq: 'Questions', press: 'Press', offices: 'Iași · Bucharest · remote', cta: 'Start a project' };
  const pad = (n) => String(n).padStart(2, '0');
  const sec = (n, id, title, body) => `<section class="ab3-sec" aria-labelledby="${id}">
      <h2 id="${id}" class="ab3-sec__h"><span class="ab3-sec__n">${pad(n)}</span>${esc(title)}</h2>
      ${body}
    </section>`;
  return noindex(`${head(t, page)}
<body class="page-about page-about-v2">
${header(t, page)}
<main id="main" class="ab3">
  <figure class="ab3-portrait">
    <img src="${asset(here, 'stefan-portrait.jpg')}" width="1066" height="1600" alt="${esc(a.portraitAlt)}" fetchpriority="high">
    <figcaption><span>${esc(SITE.name)}</span><span>${esc(a.role)}</span></figcaption>
  </figure>
  <div class="ab3-body">
    <header class="ab3-head">
      <h1 class="pf-head__h1 ab3-title" data-enter>${esc(t.nav.about.toLowerCase())}</h1>
      <p class="label" data-enter>${esc(SITE.name)} · ${esc(L.offices)}</p>
      <p class="ab3-h1" data-enter>${esc(a.bio[0])}</p>
      <div class="ab3-bio" data-enter>${a.bio.slice(1).map((x) => `<p>${esc(x)}</p>`).join('')}</div>
    </header>
    ${sec(1, 'sv-h', L.services, `<ol class="ab3-list">${a.services.map((s, i) => `<li><span>${pad(i + 1)}</span>${esc(s)}</li>`).join('')}</ol>`)}
    ${sec(2, 'aw-h', L.awards, `<ul class="ab3-awards">${AWARDS.map((w) => `<li><span class="ab3-awards__project">${esc(w.project[t.lang])}</span><span class="ab3-awards__title">${esc(w.title[t.lang])}</span><span class="ab3-awards__meta">${esc(w.result[t.lang])} · ${w.year}</span></li>`).join('')}</ul>`)}
    ${sec(3, 'fq-h', L.faq, `<div class="ab3-faq">${a.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`)}
    ${sec(4, 'pr-h', L.press, `<ul class="ab3-press">${MENTIONS.map((m) => `<li><span>${esc(m.year)}</span><span>${m.url ? `<a class="ln" href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.outlet)}</a>` : esc(m.outlet)}</span><span>${esc(m.title[t.lang] || m.title.ro)}</span></li>`).join('')}</ul>`)}
    <p class="ab3-cta">${btn(rel(here, ROUTES.contact[t.lang]), L.cta)}</p>
  </div>
</main>
${footer(t, page)}`);
}

function contactV2(t) {
  const c = t.contact, f = c.form, here = VARIANTS.contact[t.lang];
  const page = { path: here, alt: VARIANTS.contact, title: c.title, description: c.description, nav: 'contact', type: 'ContactPage' };
  page.ld = '';
  const L = t.lang === 'ro'
    ? { write: 'Scrie direct', or: 'sau completează formularul' }
    : { write: 'Write directly', or: 'or fill in the form' };
  const cover = PROJECTS.find((p) => p.category === 'health') || PROJECTS[0];
  const pad = (n) => String(n).padStart(2, '0');
  let n = 0;
  const field = (id, label, input, err, wide) => `<div class="field ct3-field${wide ? ' field--wide' : ''}"><label for="${id}"><span class="ct3-n">${pad(++n)}</span>${label}</label>${input}${err ? `<p class="field__err" id="${id}-err" hidden>${esc(err)}</p>` : ''}</div>`;
  return noindex(`${head(t, page)}
<body class="page-contact page-contact-v2">
${header(t, page)}
<main id="main" class="ct3">
  <aside class="ct3-visual">
    <img src="${img(here, cover.images[0])}" alt="" decoding="async">
    <div class="ct3-visual__words">
      <h1 class="ct3-h1">${esc(c.h1)}</h1>
      <p class="ct3-topics">${c.topics.map(esc).join(' · ')}</p>
    </div>
  </aside>
  <div class="ct3-body">
    <dl class="ct3-facts">
      <div><dt>${esc(L.write)}</dt><dd><a class="ln" href="mailto:${SITE.email}">${SITE.email}</a></dd></div>
      <div><dt>Instagram</dt><dd><a class="ln" href="${SITE.instagram}" rel="me noopener" target="_blank">${SITE.instagramHandle}</a></dd></div>
      <div class="ct3-facts__wide"><dt>${esc(c.offices)}</dt><dd>${esc(c.officesValue)}</dd></div>
    </dl>
    <p class="label ct3-or">${esc(L.or)}</p>
    <form class="form ct-form ct3-form" action="mailto:${SITE.email}" method="post" enctype="text/plain" novalidate
      data-email="${SITE.email}" data-subject="${esc(f.subject)}" data-opened="${esc(f.opened)}" data-err-one="${esc(f.errOne)}" data-err-many="${esc(f.errMany)}">
      ${field('f-name', f.name, '<input id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="f-name-err">', f.errName, true)}
      ${field('f-email', f.email, '<input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required aria-describedby="f-email-err">', f.errEmail, true)}
      ${field('f-type', f.type, `<select id="f-type" name="type"><option value="">${esc(f.choose)}</option>${f.types.map((x) => `<option>${esc(x)}</option>`).join('')}</select>`, null, true)}
      ${field('f-message', f.message, '<textarea id="f-message" name="message" rows="4" required aria-describedby="f-message-err"></textarea>', f.errMessage, true)}
      <div class="form__foot"><p class="form__note">${esc(f.note)}</p><button class="ct-send" type="submit"><span>${esc(f.send)}</span>${ARROW}</button></div>
      <p class="form__status" role="status" aria-live="polite"></p>
    </form>
  </div>
</main>
${footer(t, page)}`);
}

function infinite(t, mode, asHome = false) {
  const here = asHome ? ROUTES.home[t.lang] : mode === 'colaj' ? '/test/colaj/' : '/test/coloane/';
  const h = t.home;
  const page = asHome
    ? { path: here, alt: ROUTES.home, title: h.title, description: h.description, nav: 'home' }
    : { path: here, alt: { ro: here, en: here }, title: `Test · ${mode} · ${SITE.name}`, description: h.description, nav: 'home' };
  page.ld = asHome ? ld(t, page) : '';
  // every photograph of every project, interleaved so neighbours belong to different projects
  const all = [];
  const longest = Math.max(...PROJECTS.map((p) => p.images.length));
  for (let k = 0; k < longest; k++) PROJECTS.forEach((p) => { if (p.images[k]) all.push({ p, n: p.images[k] }); });
  const item = ({ p, n }, extra = '') => `<a class="inf-item" href="${rel(here, projectPath(p, t.lang))}"${extra}><img src="${img(here, n, true)}" alt="${esc(p.title[t.lang])}" decoding="async"><span class="inf-cap"><span>${esc(p.title[t.lang])}</span><span>${catLabel(p.category)}</span></span></a>`;

  let body;
  if (mode === 'colaj') {
    // a fixed, hand-feeling scatter: x (% of width), width (vw), depth (speed)
    const xs = [6, 62, 30, 78, 12, 48, 70, 22, 56, 4, 38, 80, 16, 64, 44];
    const ws = [20, 24, 17, 15, 26, 19, 22, 15, 21, 18, 24, 14, 22, 17, 20];
    const ss = [0.55, 1.5, 0.7, 1.85, 1.0, 0.6, 1.65, 0.85, 1.35, 0.5, 1.2, 1.95, 0.75, 1.45, 0.65];
    body = `<div class="inf inf--colaj" data-mode="colaj">
    <div class="inf-field">
      ${all.map((it, k) => item(it, ` style="--x:${xs[k % xs.length]};--w:${ws[k % ws.length]};--s:${ss[k % ss.length]};--i:${k}"`)).join('\n      ')}
    </div>`;
  } else {
    const cols = [[], [], [], []];
    all.forEach((it, k) => cols[k % 4].push(it));
    body = `<div class="inf inf--coloane" data-mode="coloane">
    <div class="inf-cols">
      ${cols.map((c, ci) => `<div class="inf-col" data-speed="${[1, -0.8, 1.3, -1.1][ci]}"><div class="inf-track">${c.map((it) => item(it)).join('')}</div></div>`).join('\n      ')}
    </div>`;
  }
  return `${asHome ? head(t, page) : head(t, page).replace('<link rel="canonical"', '<meta name="robots" content="noindex"><link rel="canonical"')}
<body class="page-home page-inf">
${header(t, page)}
<main id="main">
  ${body}
    <div class="inf-stage" aria-hidden="true">
      <p class="inf-name"><span>ștefan</span>bugalete</p>
      <p class="inf-sub">${esc(h.h1)}</p>
    </div>
    <h1 class="sr-only">${esc(SITE.name)}, ${esc(h.h1)}</h1>
    <p class="inf-hint">${t.lang === 'ro' ? 'Derulează' : 'Scroll'} · ${PROJECTS.length} ${t.lang === 'ro' ? 'proiecte' : 'projects'}</p>
    <a class="inf-all ln ln--arrow" href="${rel(here, ROUTES.portfolio[t.lang])}">${esc(t.nav.portfolio)} ${ARROW}</a>
  </div>
</main>
<script src="${asset(here, 'site.js')}" defer></script>
</body>
</html>`;
}

// ---------- write ----------
function write(path, html) {
  const file = join(OUT, path.endsWith('/') ? path + 'index.html' : path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}
for (const lang of ['en', 'ro']) {
  const t = T[lang];
  write(ROUTES.home[lang], home(t));
  write(ROUTES.portfolio[lang], portfolio(t));
  PROJECTS.forEach((p, i) => write(projectPath(p, lang), project(t, p, i)));
  write(ROUTES.about[lang], about(t));
  write(ROUTES.contact[lang], contact(t));
  write(VARIANTS.about[lang], aboutV2(t));
  write(VARIANTS.contact[lang], contactV2(t));
}

write('assets/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="90 85 620 620"><style>path{fill:#1a1815}@media (prefers-color-scheme:dark){path{fill:#eae3d8}}</style><path d="${MARK}"/></svg>`);

write('robots.txt', `# Search engines and AI assistants are welcome.
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /

Sitemap: ${SITE.domain}/sitemap.xml
`);

const allPages = [
  ...Object.values(ROUTES),
  ...PROJECTS.map((p) => ({ ro: projectPath(p, 'ro'), en: projectPath(p, 'en') })),
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allPages.flatMap((r) => ['en', 'ro'].map((l) => `  <url><loc>${abs(r[l])}</loc><lastmod>${BUILT}</lastmod><xhtml:link rel="alternate" hreflang="ro" href="${abs(r.ro)}"/><xhtml:link rel="alternate" hreflang="en" href="${abs(r.en)}"/></url>`)).join('\n')}
</urlset>
`);

const en = T.en;
write('llms.txt', `# ${SITE.brand}

> ${SITE.name} is an architect and interior designer with offices in Iași and Bucharest, Romania, working remotely for clients abroad. The studio designs premium homes and medical and dental clinics, from concept to turnkey delivery.

## Facts
- Name: ${SITE.name} (also written Stefan Bugalete)
- Profession: architect and interior designer, founder of ${SITE.brand}
- Offices: Iași and Bucharest (București), Romania; remote projects abroad
- Portfolio categories: Architecture, Interior, Health
- Services: ${en.about.services.join(', ').toLowerCase()}
- Experience: more than eight years of residential interior projects
- Awards: ${AWARDS.map((a) => `${a.title.en}, ${a.result.en} (${a.project.en})`).join('; ')}
- Contact: ${SITE.email}
- Instagram: ${SITE.instagram}

## Pages
- [Home](${abs(ROUTES.home.en)}) · [Acasă](${abs(ROUTES.home.ro)})
- [Work](${abs(ROUTES.portfolio.en)}) · [Lucrări](${abs(ROUTES.portfolio.ro)})
- [Info](${abs(ROUTES.about.en)}) · [Info RO](${abs(ROUTES.about.ro)})
- [Contact](${abs(ROUTES.contact.en)}) · [Contact RO](${abs(ROUTES.contact.ro)})

## Questions
${en.about.faq.map((f) => `- ${f.q} ${f.a}`).join('\n')}
`);

write('404.html', `<!doctype html><html lang="en" class="no-js"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | ${esc(SITE.name)}</title><meta name="robots" content="noindex"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300..700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/site.css"></head><body><main id="main" class="notfound"><div class="wrap">${ICON}<h1 class="display">404</h1><p class="lead">This page does not exist. <span lang="ro">Pagina nu există.</span></p><p>${btn('/', 'Home', 'btn--light')}</p></div></main></body></html>`);

console.log(`built ${allPages.length * 2} pages${MOCKUP ? ' (mockup: noindex on)' : ''}`);
