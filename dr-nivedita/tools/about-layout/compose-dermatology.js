// Rebuilds views/general-dermatology.html and views/cosmetic-dermatology.html in the
// dadumedicalcentre.com About layout (acx-* components, /css/about.css). The reference site has
// no page of its own for these two, so they use the About Clinic components. Every heading,
// paragraph, list item, card, table row and FAQ is lifted unchanged from the previous views
// (backups/about-pages-2026-10-27/views) - nothing is retyped.
// Usage: node compose-dermatology.js
const fs = require('fs');
const SRC = 'D:/DMC website rework/dr-nivedita/backups/about-pages-2026-10-27/views/';
const OUT = 'D:/DMC website rework/dr-nivedita/local/website/views/';
const must = (c, m) => { if (!c) throw new Error(m); return c; };
const one = (s, re, what) => must(s.match(re), what)[1].trim();
const all = (s, re) => [...s.matchAll(re)].map(m => m[1].trim());
const imgOf = (s, what) => must(s.match(/<img [^>]*>/), what)[0].replace(/ fetchpriority="high"/, ' loading="lazy"');
const arrow = '<svg class="ico"><use href="#i-arrow"/></svg>';
const btn = (label, href = '#contact') => `<a class="acx-btn acx-choose-btn" href="${href}"><span>${label}</span><span class="acx-choose-arrow-circle"><svg class="ico acx-choose-arrow"><use href="#i-arrow"/></svg></span></a>`;

function sections(view) {
  return view.split(/(?=<section )/).slice(1).map(s => ({ cls: one(s, /<section class="([^"]+)"/, 'section class'), html: s.slice(0, s.lastIndexOf('</section>') + 10) }));
}

// ---- reference components
const banner = t => `<section class="acx-page-banner">
  <div class="acx-page-banner-inner">
    <p class="acx-banner-title">${t}</p>
    <nav class="acx-page-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">${t}</span></nav>
  </div>
</section>`;
const overview = (h1, copy, img) => `<section class="acx-clinic-overview">
  <div class="acx-shell acx-clinic-overview-grid">
    <div class="acx-clinic-overview-copy">
      <h1 class="acx-title">${h1}</h1>
      <div class="acx-copy">${copy}</div>
    </div>
    <div class="acx-clinic-overview-visual">${img.replace(' loading="lazy"', ' fetchpriority="high"')}</div>
  </div>
</section>`;
const mast = (h2, sub, img, copies) => `<section class="acx-mast">
  <div class="acx-shell">
    <div class="acx-mast-head"><h2>${h2}</h2>${sub ? `<p class="acx-mast-sub">${sub}</p>` : ''}</div>
    <div class="acx-mast-photo">${img}</div>
    <div class="acx-mast-copy">${copies.map(c => `<div class="acx-copy">${c}</div>`).join('')}</div>
  </div>
</section>`;
const concerns = (h2, lede, items, note) => `<section class="acx-concerns">
  <div class="acx-shell">
    <div class="acx-section-head acx-section-head-dark"><div><h2>${h2}</h2></div>${lede ? `<p>${lede}</p>` : ''}</div>
    <div class="acx-concern-grid">${items.map((it, i) => `
      <article><span>${String(i + 1).padStart(2, '0')}</span><div>${it}</div></article>`).join('')}
    </div>${note ? `
    <p class="acx-note">${note}</p>` : ''}
  </div>
</section>`;
const story = (h2, copy, img, extra = '', flip = false) => `<section class="acx-choose-story${flip ? ' acx-choose-story--flip' : ''}">
  <div class="acx-shell acx-choose-story-grid">${flip ? '' : `
    <div class="acx-choose-story-visual">${img.replace('<img ', '<img class="acx-choose-story-main" ')}</div>`}
    <div class="acx-choose-story-copy">
      <h2>${h2}</h2>
      <div class="acx-copy">${copy}</div>${extra}
    </div>${flip ? `
    <div class="acx-choose-story-visual">${img.replace('<img ', '<img class="acx-choose-story-main" ')}</div>` : ''}
  </div>
</section>`;
const difference = (h2, copy, img, extra = '') => `<section class="acx-difference">
  <div class="acx-shell acx-difference-grid">
    <div class="acx-difference-visual">${img}</div>
    <div class="acx-difference-copy">
      <h2>${h2}</h2>
      <div class="acx-copy">${copy}</div>${extra}
    </div>
  </div>
</section>`;
const cost = block => `<section class="acx-cost">
  <div class="acx-shell">
    ${block.replace(/<h2>/, '<h2 class="acx-cost-title">')}
  </div>
</section>`;
const cards = (h2, list, note) => `<section class="acx-top-reasons acx-top-reasons--cards">
  <div class="acx-shell">
    <div class="acx-top-reasons-head"><h2>${h2}</h2></div>
    <div class="acx-card-grid">${list.map((c, i) => `
      <article class="acx-top-reason-card${i === 1 ? ' acx-top-reason-accent' : ''}"><span class="acx-top-reason-number">${String(i + 1).padStart(2, '0')}</span>${c}</article>`).join('')}
    </div>
    <p class="acx-note">${note}</p>
  </div>
</section>`;
const faq = (h2, rows) => `<section class="acx-clinic-faq" id="faqs">
  <div class="acx-shell">
    <div class="acx-clinic-faq-head">
      <h2>${h2}</h2>
      <span class="acx-clinic-faq-line"></span>
    </div>
    <div class="acx-clinic-faq-list">
      ${rows.join('\n      ')}
    </div>
  </div>
</section>`;

function page(name, body) {
  return `{{> inner-page-start}}

<!-- ${name} in the dadumedicalcentre.com About layout (acx-* components, /css/about.css);
     text and photos are the live drniveditadadu.com ${name} page -->
<div class="acx-page">
${body.join('\n\n')}
</div>

{{> contact-section}}

{{> inner-page-end}}
`;
}

// pieces shared by both pages
const stepItems = s => [...s.matchAll(/<li class="pg-step"><span class="pg-step-num">\d+<\/span>(<h3>[\s\S]*?<\/h3>)([\s\S]*?)<\/li>/g)].map(m => m[1] + m[2]);
const cardItems = s => all(s, /<article class="pg-card[^"]*">([\s\S]*?)<\/article>/g);
const faqRows = s => [...s.matchAll(/<details class="faq-row"[\s\S]*?<\/details>/g)].map(m => m[0]);
const note = s => one(s, /<p class="table-note pg-cards-note">([\s\S]*?)<\/p>/, 'cards note');

// ---- General Dermatology
{
  const v = fs.readFileSync(SRC + 'general-dermatology.html', 'utf8'), S = sections(v), by = c => must(S.find(s => s.cls.startsWith(c)), c).html;
  const intro = by('pg-intro'), mastS = by('pg-mast'), pts = by('pg-points'), tp = by('tp '), media = by('pg-media'), costS = by('section bg-tint pg-cost');
  const condS = S.filter(s => s.cls === 'section bg-white')[0].html, stepsS = S.filter(s => s.cls === 'section bg-tint')[0].html, faqS = must(S.find(s => s.html.includes('id="faqs"')), 'faq').html;
  const body = [
    banner(one(by('page-banner'), /<p class="page-banner-title">([\s\S]*?)<\/p>/, 'banner')),
    overview(one(intro, /<h1[^>]*>([\s\S]*?)<\/h1>/, 'h1'), one(intro, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'intro copy'), imgOf(intro, 'intro img')),
    mast(one(mastS, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'mast h2'), '',
      '<img src="/images/about/general-dermatology.jpg" alt="General Dermatology" loading="lazy" width="1552" height="458" decoding="async">',
      [one(mastS, /<div class="pg-copy pg-mast-copy">([\s\S]*?)<\/div>/, 'mast copy')]),
    concerns(one(pts, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'points h2'), one(pts, /<p class="pg-points-intro">([\s\S]*?)<\/p>/, 'points intro'),
      [...pts.matchAll(/<li><span class="pg-points-ico"[\s\S]*?<\/span>([\s\S]*?)<\/li>/g)].map(m => m[1].trim())),
    story(one(tp, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'tp h2'), one(tp, /<div class="tp-text pg-copy">([\s\S]*?)<\/div>/, 'tp copy'), imgOf(tp, 'tp img'), '\n      ' + btn('Schedule a Consultation')),
    difference(one(media, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'media h2'), one(media, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'media copy'), imgOf(media, 'media img')),
    cost(one(costS, /<div class="table-block">([\s\S]*)<\/div>\s*<\/div>\s*<\/section>/, 'cost block')),
    cards(one(condS, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'cards h2'), cardItems(condS), note(condS)),
    concerns(one(stepsS, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'steps h2'), '', stepItems(stepsS), note(stepsS)),
    faq(one(faqS, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'faq h2'), faqRows(faqS)),
  ];
  must(cardItems(condS).length === 8 && stepItems(stepsS).length === 7 && faqRows(faqS).length === 10, 'general: counts');
  fs.writeFileSync(OUT + 'general-dermatology.html', page('General Dermatology', body));
}

// ---- Cosmetic Dermatology
{
  const v = fs.readFileSync(SRC + 'cosmetic-dermatology.html', 'utf8'), S = sections(v), by = c => must(S.find(s => s.cls.startsWith(c)), c).html;
  const intro = by('pg-intro'), open = by('pg-open'), tl = by('pg-treatlist'), panel = by('pg-feature pg-doctor-panel'), exp = by('pg-exp'), costS = by('section bg-tint pg-cost');
  const popS = S.filter(s => s.cls === 'section bg-white')[0].html, stepsS = S.filter(s => s.cls === 'section bg-tint')[0].html, faqS = must(S.find(s => s.html.includes('id="faqs"')), 'faq').html;
  const body = [
    banner(one(by('page-banner'), /<p class="page-banner-title">([\s\S]*?)<\/p>/, 'banner')),
    overview(one(intro, /<h1[^>]*>([\s\S]*?)<\/h1>/, 'h1'), one(intro, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'intro copy'), imgOf(intro, 'intro img')),
    mast(one(open, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'open h2'), one(open, /<p class="pg-open-sub">([\s\S]*?)<\/p>/, 'open sub'), imgOf(open, 'open img'),
      all(open, /<div class="pg-copy pg-open-copy">([\s\S]*?)<\/div>/g)),
    concerns(one(tl, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'tl h2'), one(tl, /<p class="pg-treatlist-lead">([\s\S]*?)<\/p>/, 'tl lead'),
      all(tl, /<li>([\s\S]*?)<\/li>/g).map(t => `<p>${t}</p>`)),
    story(one(panel, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'panel h2'), one(panel, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'panel copy'), imgOf(panel, 'panel img').replace('<img ', '<img data-focus="left" ')),
    // the live page's wide banner photo: heading + full-width photo + copy rather than a cropped portrait frame
    mast(one(exp, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'exp h2'), '', imgOf(exp, 'exp img'), [one(exp, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'exp copy')]),
    cost(one(costS, /<div class="table-block">([\s\S]*)<\/div>\s*<\/div>\s*<\/section>/, 'cost block')),
    cards(one(popS, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'cards h2'), cardItems(popS), note(popS)),
    concerns(one(stepsS, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'steps h2'), '', stepItems(stepsS), note(stepsS)),
    faq(one(faqS, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'faq h2'), faqRows(faqS)),
  ];
  must(cardItems(popS).length === 8 && stepItems(stepsS).length === 6 && faqRows(faqS).length === 9, 'cosmetic: counts');
  fs.writeFileSync(OUT + 'cosmetic-dermatology.html', page('Cosmetic Dermatology', body));
}
console.log('wrote general-dermatology.html, cosmetic-dermatology.html');
