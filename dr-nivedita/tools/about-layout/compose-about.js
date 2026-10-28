// Builds the 5 About views with ONLY the dadumedicalcentre.com /about-clinic components (acx-*,
// /css/about.css): banner, overview, choose story, top reasons, difference, expert profile,
// concerns list, technology cards, FAQ, testimonials. Each section gets a small kicker label taken
// from its own heading. All text, photos and videos are lifted unchanged from the earlier views
// (backups/about-pages-2026-10-27/views = the live drniveditadadu.com content), plus the live
// photos/videos added since (clinic gallery photo, banner photos, premium-service videos).
// Usage: node compose-about.js
const fs = require('fs');
const SRC = 'D:/DMC website rework/dr-nivedita/backups/about-pages-2026-10-27/views/';
const OUT = 'D:/DMC website rework/dr-nivedita/local/website/views/';
const must = (c, m) => { if (!c) throw new Error(m); return c; };
const one = (s, re, what) => must(s.match(re), what)[1].trim();
const all = (s, re) => [...s.matchAll(re)].map(m => m[1].trim());
const img = (s, what) => must(s.match(/<img [^>]*>/), what)[0].replace(/ fetchpriority="high"/, ' loading="lazy"');
const ico = (id, fill) => `<svg class="ico${fill ? ' ico-fill' : ''}" aria-hidden="true"><use href="#${id}"/></svg>`;
const sections = v => v.split(/(?=<section )/).slice(1).map(s => s.slice(0, s.indexOf('</section>') + 10));
const pos = (tag, p) => p == null ? tag : tag.replace('<img ', `<img data-pos="${p}" `);
const n2 = i => String(i + 1).padStart(2, '0');

// ---------- the reference components ----------
const K = (t, cls = '') => `<span class="acx-kicker${cls ? ' ' + cls : ''}">${t}</span>`;
const btn = (label, href = '#contact', attrs = '') => `<a class="acx-btn acx-choose-btn" href="${href}"${attrs}><span>${label}</span><span class="acx-choose-arrow-circle"><svg class="ico acx-choose-arrow"><use href="#i-arrow"/></svg></span></a>`;
const bgc = bg => bg ? ` acx-bg-${bg}` : '';

const banner = (title, crumb = title, tag = 'p') => `<section class="acx-page-banner">
  <div class="acx-page-banner-inner">
    <${tag} class="acx-banner-title">${title}</${tag}>
    <nav class="acx-page-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">${crumb}</span></nav>
  </div>
</section>`;

const overview = ({ kicker, h1, sub, copy, after = '', visual, bg }) => `<section class="acx-clinic-overview${bgc(bg)}">
  <div class="acx-shell acx-clinic-overview-grid">
    <div class="acx-clinic-overview-copy">
      ${K(kicker)}
      <h1 class="acx-title">${h1}</h1>${sub ? `
      <h2 class="acx-sub">${sub}</h2>` : ''}
      <div class="acx-copy">${copy}</div>${after}
    </div>
    <div class="acx-clinic-overview-visual">${visual}</div>
  </div>
</section>`;

const story = ({ kicker, h2, copy, main, small, flip, extra = '', bg, mainPos }) => {
  const visual = `
    <div class="acx-choose-story-visual">
      ${pos(main.replace('<img ', '<img class="acx-choose-story-main" '), mainPos)}${small ? `
      ${small.replace('<img ', '<img class="acx-choose-story-small" ')}` : ''}
    </div>`;
  return `<section class="acx-choose-story${flip ? ' acx-choose-story--flip' : ''}${small ? '' : ' acx-choose-story--single'}${bgc(bg)}">
  <div class="acx-shell acx-choose-story-grid">${flip ? '' : visual}
    <div class="acx-choose-story-copy">
      ${K(kicker)}
      <h2>${h2}</h2>
      <div class="acx-copy">${copy}</div>${extra}
    </div>${flip ? visual : ''}
  </div>
</section>`;
};

const difference = ({ kicker, h2, copy = '', list, image, extra = '', bg, imgPos }) => `<section class="acx-difference${bgc(bg)}">
  <div class="acx-shell acx-difference-grid">
    <div class="acx-difference-visual">${pos(image, imgPos)}</div>
    <div class="acx-difference-copy">
      ${K(kicker)}
      <h2>${h2}</h2>${copy ? `
      <div class="acx-copy">${copy}</div>` : ''}${list ? `
      <div class="acx-difference-list">${list.map(it => `
        <div class="acx-difference-item"><span class="acx-check">${ico('i-check')}</span><div>${it}</div></div>`).join('')}
      </div>` : ''}${extra}
    </div>
  </div>
</section>`;

// top reasons: the reference 12-column card grid (6+6 / 5+7 ...), first card featured, second coral
const SPANS = { 3: [4, 4, 4], 4: [6, 6, 5, 7], 5: [6, 6, 5, 7, 12], 6: [6, 6, 5, 7, 6, 6], 8: [3, 3, 3, 3, 3, 3, 3, 3] };
const REASON_ICONS = ['i-steth', 'i-award', 'i-zap', 'i-pin', 'i-heart', 'i-shield', 'i-layers', 'i-sparkle'];
const reasons = ({ kicker, h2, lede = [], cards, bg, small }) => `<section class="acx-top-reasons${small ? ' acx-top-reasons--small' : ''}${bgc(bg)}">
  <div class="acx-shell">
    <div class="acx-top-reasons-head">
      ${K(kicker)}
      <h2>${h2}</h2>${lede.map(p => `
      <p class="acx-lede">${p}</p>`).join('')}
    </div>
    <div class="acx-top-reasons-grid">${cards.map((c, i) => `
      <article class="acx-top-reason-card acx-span-${must(SPANS[cards.length], 'spans for ' + cards.length)[i]}${i === 0 ? ' acx-top-reason-featured' : i === 1 ? ' acx-top-reason-accent' : ''}"><span class="acx-top-reason-number">${n2(i)}</span><div class="acx-top-reason-icon">${ico(REASON_ICONS[i % REASON_ICONS.length])}</div>${c}</article>`).join('')}
    </div>
  </div>
</section>`;

const concerns = ({ kicker, h2, lede = '', items, before = '', after = '', bg }) => `<section class="acx-concerns${bgc(bg)}">
  <div class="acx-shell">
    <div class="acx-section-head acx-section-head-dark"><div>${K(kicker)}<h2>${h2}</h2></div>${lede ? `<div class="acx-section-head-copy">${lede}</div>` : ''}</div>${before}
    <div class="acx-concern-grid">${items.map((it, i) => `
      <article><span>${n2(i)}</span><div>${it}</div></article>`).join('')}
    </div>${after}
  </div>
</section>`;

const faq = ({ kicker, h2, rows, numbered, bg }) => `<section class="acx-clinic-faq${bgc(bg)}" id="faqs">
  <div class="acx-shell">
    <div class="acx-clinic-faq-head">
      ${K(kicker)}
      <h2>${h2}</h2>
      <span class="acx-clinic-faq-line"></span>
    </div>
    <div class="acx-clinic-faq-list${numbered ? ' acx-faq-numbered' : ''}">
      ${rows.join('\n      ')}
    </div>
  </div>
</section>`;

const page = (name, body, tail = '') => `{{> inner-page-start}}

<!-- ${name}: the dadumedicalcentre.com /about-clinic layout (acx-* components, /css/about.css);
     text, photos and videos are the live drniveditadadu.com ${name} page -->
<div class="acx-page">
${body.join('\n\n')}
</div>
${tail}
{{> contact-section}}

{{> inner-page-end}}
`;
const videoDialog = `
<dialog class="video-dialog" aria-label="Treatment video">
  <button class="video-dialog-close" type="button" aria-label="Close video">✕</button>
  <div class="video-dialog-frame"></div>
  <p class="video-dialog-title"></p>
</dialog>
`;
const write = (view, html) => { must(!/\{\{(?!> |#if|\/if|else)/.test(html.replace(/\{\{> [a-z-]+\}\}/g, '')), view + ': stray tag'); fs.writeFileSync(OUT + view + '.html', html); };

// shared extractors
const faqRows = s => [...s.matchAll(/<details class="faq-row"[\s\S]*?<\/details>/g)].map(m => m[0]);
const cardItems = s => all(s, /<article class="pg-card[^"]*">([\s\S]*?)<\/article>/g);
const stepItems = s => [...s.matchAll(/<li class="pg-step"><span class="pg-step-num">\d+<\/span>(<h3>[\s\S]*?<\/h3>)([\s\S]*?)<\/li>/g)].map(m => m[1] + m[2]);
const cardsNote = s => one(s, /<p class="table-note pg-cards-note">([\s\S]*?)<\/p>/, 'cards note');
const h = (s, tag = 'h2') => one(s, new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`), tag);
const copyOf = (s, cls = 'pg-copy') => one(s, new RegExp(`<div class="${cls}">([\\s\\S]*?)<\\/div>`), cls);

// =====================================================================================
// About Clinic
{
  const S = sections(fs.readFileSync(SRC + 'about-clinic.html', 'utf8'));
  const [, intro, overlap, media, svc, choose, rows, faqS] = S;
  must(/pg-intro/.test(intro) && /pg-overlap/.test(overlap) && /pg-svc-section/.test(svc) && /pg-rows/.test(rows) && /id="faqs"/.test(faqS), 'about-clinic sections');
  const gallerySlides = one(intro, /(<div class="swiper-wrapper">[\s\S]*?)\s*<\/div>\s*<\/div>\s*<button class="gallery-prev"/, 'gallery')
    + '\n            <div class="swiper-slide"><img src="/images/about/clinic-21.webp" alt="Best Skin Clinic In Delhi" loading="lazy" width="1600" height="1067" decoding="async"></div>\n          </div>';
  const copies = all(intro, /<div class="pg-copy">([\s\S]*?)<\/div>/g)[0];
  const [p1, sub, p2] = must(copies.match(/^([\s\S]*?)<h2>([\s\S]*?)<\/h2>([\s\S]*)$/), 'intro split').slice(1);
  const rowItems = [...rows.matchAll(/<div class="pg-row"><span class="pg-row-num">\d+<\/span><h3 class="pg-row-title">([\s\S]*?)<\/h3><div class="pg-copy">([\s\S]*?)<\/div><\/div>/g)].map(m => `<h3>${m[1]}</h3>${m[2]}`);
  const tiles = [...svc.matchAll(/<a class="pg-svc-tile" href="([^"]+)">\s*<span class="pg-svc-photo">(<img [^>]*>)<\/span>[\s\S]*?<span class="pg-svc-name">([\s\S]*?)<\/span>\s*<span class="pg-svc-more">([^<]*)/g)];
  must(rowItems.length === 5 && tiles.length === 3, 'rows/tiles');
  const body = [
    banner('About Clinic'),
    overview({ kicker: 'About Dadu Medical Centre', h1: h(intro, 'h1'), copy: p1.replace(/<br>/g, ''), after: `\n      <h2 class="acx-sub">${sub}</h2>\n      <div class="acx-copy">${p2}</div>`,  // live order: paragraph, sub-heading, paragraph
      visual: `<div class="gallery">
        <div class="swiper gallery-swiper">
          ${gallerySlides}
        </div>
        <button class="gallery-prev" type="button" aria-label="Previous photo"><svg class="ico"><use href="#i-chev-l"/></svg></button>
        <button class="gallery-next" type="button" aria-label="Next photo"><svg class="ico"><use href="#i-chev-r"/></svg></button>
        <div class="gallery-pagination"></div>
      </div>` }),
    story({ kicker: 'Skin Treatment Clinic', h2: h(overlap), copy: copyOf(overlap, 'pg-copy pg-overlap-copy'), main: img(overlap, 'overlap img'),
      small: '<img src="/images/about/about-clinic-banner.webp" alt="Dr. Nivedita Dadu&#x27;s Dermatology Clinic" loading="lazy" width="960" height="540" decoding="async">' }),
    difference({ kicker: 'Hair Treatment Clinic', h2: h(media), copy: copyOf(media), image: img(media, 'media img'), extra: '\n      ' + btn('Schedule a Consultation'), bg: 'white' }),
    `<section class="acx-tech-showcase acx-bg-mist">
  <div class="acx-shell">
    <div class="acx-tech-showcase-head acx-head-center">${K('Dermatology Services')}</div>
    <div class="acx-tile-grid">${tiles.map(([, href, im, name, more]) => `
      <a class="acx-tech-cover-card" href="${href}">${im}<span class="acx-tech-cover-shade"></span><span class="acx-tech-cover-copy"><h3>${name}</h3><span class="acx-tile-more">${more.trim()} <span class="btn-arrow">${ico('i-arrow')}</span></span></span></a>`).join('')}
    </div>
  </div>
</section>`,
    story({ kicker: 'Choosing a Skin Clinic', h2: h(choose), copy: copyOf(choose), main: img(choose, 'choose img'), flip: true }),
    reasons({ kicker: 'Why Dadu Medical Centre', h2: h(rows), lede: [one(rows, /<p class="pg-lede">([\s\S]*?)<\/p>/, 'rows lede')], cards: rowItems }),
    faq({ kicker: 'Expert Answers', h2: h(faqS), rows: faqRows(faqS) }),
  ];
  must(faqRows(faqS).length === 4, 'about-clinic faq');
  write('about-clinic', page('About Clinic', body));
}

// =====================================================================================
// General + Cosmetic Dermatology (no page of their own on the reference: About Clinic components)
const mast = ({ kicker, h2, sub, image, copies, bg }) => `<section class="acx-mast${image ? '' : ' acx-mast--text'}${bgc(bg)}">
  <div class="acx-shell">
    <div class="acx-mast-head">${K(kicker)}<h2>${h2}</h2>${sub ? `<p class="acx-mast-sub">${sub}</p>` : ''}</div>${image ? `
    <div class="acx-mast-photo">${image}</div>` : ''}
    <div class="acx-mast-copy">${copies.map(c => `<div class="acx-copy">${c}</div>`).join('')}</div>
  </div>
</section>`;
const cost = (kicker, block) => `<section class="acx-cost">
  <div class="acx-shell">
    <div class="acx-head-center">${K(kicker)}</div>
    ${block.replace(/<h2>/, '<h2 class="acx-cost-title">')}
  </div>
</section>`;
const cardGrid = ({ kicker, h2, list, note }) => `<section class="acx-top-reasons acx-top-reasons--cards">
  <div class="acx-shell">
    <div class="acx-top-reasons-head">${K(kicker)}<h2>${h2}</h2></div>
    <div class="acx-card-grid">${list.map((c, i) => `
      <article class="acx-top-reason-card${i === 1 ? ' acx-top-reason-accent' : ''}"><span class="acx-top-reason-number">${n2(i)}</span>${c}</article>`).join('')}
    </div>
    <p class="acx-note">${note}</p>
  </div>
</section>`;
function derm(view, name, kick) {
  const S = sections(fs.readFileSync(SRC + view + '.html', 'utf8'));
  const by = c => must(S.find(s => s.startsWith(`<section class="${c}`)), c);
  const intro = by('pg-intro'), costS = by('section bg-tint pg-cost'), faqS = must(S.find(s => s.includes('id="faqs"')), 'faq');
  const cardsS = S.filter(s => s.startsWith('<section class="section bg-white">'))[0], stepsS = S.filter(s => s.startsWith('<section class="section bg-tint">'))[0];
  const body = [banner(one(S[0], /<p class="page-banner-title">([\s\S]*?)<\/p>/, 'banner')),
    overview({ kicker: kick.overview, h1: h(intro, 'h1'), copy: copyOf(intro), visual: img(intro, 'intro img').replace(' loading="lazy"', ' fetchpriority="high"') })];
  if (view === 'general-dermatology') {
    const mastS = by('pg-mast'), pts = by('pg-points'), tp = by('tp '), media = by('pg-media');
    body.push(
      mast({ kicker: kick.mast, h2: h(mastS), image: '<img src="/images/about/general-dermatology.jpg" alt="General Dermatology" loading="lazy" width="1552" height="458" decoding="async">', copies: [copyOf(mastS, 'pg-copy pg-mast-copy')], bg: 'white' }),
      concerns({ kicker: kick.points, h2: h(pts), lede: `<p>${one(pts, /<p class="pg-points-intro">([\s\S]*?)<\/p>/, 'points intro')}</p>`,
        items: [...pts.matchAll(/<li><span class="pg-points-ico"[\s\S]*?<\/span>([\s\S]*?)<\/li>/g)].map(m => m[1].trim()) }),
      story({ kicker: kick.tp, h2: h(tp), copy: copyOf(tp, 'tp-text pg-copy'), main: img(tp, 'tp img'), extra: '\n      ' + btn('Schedule a Consultation') }),
      difference({ kicker: kick.media, h2: h(media), copy: copyOf(media), image: img(media, 'media img'), bg: 'white' }));
  } else {
    const open = by('pg-open'), tl = by('pg-treatlist'), panel = by('pg-feature pg-doctor-panel'), exp = by('pg-exp');
    body.push(
      // the anti-ageing stock photo is not on the live Cosmetic Dermatology page: text only
      mast({ kicker: kick.mast, h2: h(open), sub: one(open, /<p class="pg-open-sub">([\s\S]*?)<\/p>/, 'open sub'), copies: all(open, /<div class="pg-copy pg-open-copy">([\s\S]*?)<\/div>/g), bg: 'white' }),
      concerns({ kicker: kick.points, h2: h(tl), lede: `<p>${one(tl, /<p class="pg-treatlist-lead">([\s\S]*?)<\/p>/, 'tl lead')}</p>`, items: all(tl, /<li>([\s\S]*?)<\/li>/g).map(t => `<p>${t}</p>`) }),
      story({ kicker: kick.tp, h2: h(panel), copy: copyOf(panel), main: img(panel, 'panel img'), mainPos: 22 }),
      mast({ kicker: kick.media, h2: h(exp), image: img(exp, 'exp img'), copies: [copyOf(exp)], bg: 'white' }));
  }
  body.push(
    cost(kick.cost, one(costS, /<div class="table-block">([\s\S]*)<\/div>\s*<\/div>\s*<\/section>/, 'cost block')),
    cardGrid({ kicker: kick.cards, h2: h(cardsS), list: cardItems(cardsS), note: cardsNote(cardsS) }),
    concerns({ kicker: kick.steps, h2: h(stepsS), items: stepItems(stepsS), after: `\n    <p class="acx-note">${cardsNote(stepsS)}</p>`, bg: 'white' }),
    faq({ kicker: 'Expert Answers', h2: h(faqS), rows: faqRows(faqS) }));
  must(cardItems(cardsS).length === 8 && stepItems(stepsS).length >= 6 && faqRows(faqS).length >= 9, view + ': counts');
  write(view, page(name, body));
}
derm('general-dermatology', 'General Dermatology', { overview: 'General Dermatology', mast: 'Expert Diagnosis and Treatment', points: 'Conditions We Treat', tp: 'Inside a Consultation', media: 'Hair and Nail Concerns', cost: 'Treatment Cost', cards: 'Skin, Hair and Nail Conditions', steps: 'Consultation Process' });
derm('cosmetic-dermatology', 'Cosmetic Dermatology', { overview: 'Cosmetic Dermatology', mast: 'Cosmetic Dermatology in Delhi', points: 'Treatments Available', tp: 'Medically Supervised', media: 'A First Concern or a Routine', cost: 'Treatment Cost', cards: 'Popular Treatments', steps: 'Consultation Process' });

// =====================================================================================
// Technologies: About Clinic technology cards (one per treatment point, each opening its video)
{
  const v = fs.readFileSync(SRC + 'technology.html', 'utf8');
  const stage = one(v, /(<div class="hotspot-stage">[\s\S]*?<\/div>)\s*<ol class="tech-list">/, 'hotspots');
  const items = [...v.matchAll(/<a class="tech-item" href="([^"]+)" target="_blank" rel="noopener" data-video-dialog="([^"]+)" data-title="([^"]*)"><span class="ico-circle">\d+<\/span><span>([\s\S]*?)<\/span>/g)];
  must(items.length === 8, 'tech items');
  const body = [banner(h(v, 'h1'), h(v, 'h1'), 'h1'),
    `<section class="acx-tech-showcase acx-tech-areas">
  <div class="acx-shell">
    <div class="acx-tech-showcase-head acx-head-center">${K('Treatment Areas')}</div>
    <div class="tech-intro">
      ${stage.replace('<div class="hotspot-stage">', '<div class="tech-intro-face hotspot-stage">').replace(' loading="lazy"', '')}
      <div class="tech-intro-banner"><img src="/images/about/technology-banner.jpg" alt="Technologies at Dr. Nivedita Dadu&#x27;s Dermatology Clinic" width="1366" height="400" decoding="async"></div>
    </div>
  </div>
</section>`,
    `<section class="acx-tech-showcase acx-bg-mist">
  <div class="acx-shell">
    <div class="acx-tech-showcase-head acx-head-center">${K('Treatment Videos')}</div>
    <div class="acx-tile-grid acx-tile-grid--4">${items.map(([, href, id, title, label], i) => `
      <a class="acx-tech-cover-card acx-video-card acx-video-card--text" href="${href}" target="_blank" rel="noopener" data-video-dialog="${id}" data-title="${title}"><span class="acx-tech-cover-number">${n2(i)}</span><span class="acx-tech-cover-copy"><h3>${label}</h3><span class="acx-tile-more">Watch Video <span class="btn-arrow">${ico('i-play', true)}</span></span></span></a>`).join('')}
    </div>
  </div>
</section>`];
  write('technology', page('Technologies', body, videoDialog));
}

// =====================================================================================
// Dr. Nivedita Dadu
{
  const S = sections(fs.readFileSync(SRC + 'dr-nivedita-dadu.html', 'utf8'));
  must(S.length === 22, 'doctor sections ' + S.length);
  const [ban, intro, profile, benefits, band, antiAge, celeb, glass, lip, bridal, steps, edu, spot, press, lady, spec, phil, beauty, faqS, testi, ratings, closing] = S;
  const VIDEOS = { 'Magic Blend for Skin®': '52rC1BSOxgI', 'Martini for Skin®': 'PCjHpA5-ThQ', 'DivaGenesis®': 'ZseuBYETscA', 'Crystal Glaze®': 'QpGR__kPKL4', 'RRT®': '4utgpvO_Afc', 'Bloody Mary Peel®': 'KC8w9ijLEQc' };
  const body = [];
  body.push(banner(one(ban, /<p class="page-banner-title">([\s\S]*?)<\/p>/, 'banner'), one(ban, /<span aria-current="page">([\s\S]*?)<\/span>/, 'crumb')));
  body.push(overview({ kicker: one(intro, /<p class="pg-kicker">([\s\S]*?)<\/p>/, 'kicker'), h1: h(intro, 'h1'), sub: one(intro, /<p class="pg-sub">([\s\S]*?)<\/p>/, 'sub'),
    copy: copyOf(intro), visual: img(intro, 'intro img').replace(' loading="lazy"', ' fetchpriority="high"') }));

  // best dermatologist: the reference "Meet the Expert" coral profile card
  const pCopy = one(profile, /<div class="pg-profile-copy pg-copy">([\s\S]*?)<\/div>/, 'profile copy');
  const facts = [...profile.matchAll(/<li><svg[\s\S]*?<\/svg><span><strong>([\s\S]*?)<\/strong>([\s\S]*?)<\/span><\/li>/g)];
  const where = one(profile, /<div class="pg-profile-where">([\s\S]*?<\/a>)\s*<\/div>/, 'where');
  const whereLabel = one(where, /<p class="pg-profile-where-label">([\s\S]*?)<\/p>/, 'where label'), whereText = one(where, /<\/p>\s*(<p>[\s\S]*?<\/p>)/, 'where text');
  const whereLink = one(where, /(<a class="pg-profile-where-link"[\s\S]*?<\/a>)/, 'where link');
  must(facts.length === 3, 'facts');
  body.push(`<section class="acx-expert-profile">
  <div class="acx-shell">
    <div class="acx-expert-profile-head">${K(one(profile, /<p class="pg-feature-row-kicker">([\s\S]*?)<\/p>/, 'profile kicker'))}<h2>${h(profile)}</h2></div>
    <div class="acx-expert-profile-card">
      <div class="acx-expert-profile-visual">${img(profile, 'portrait')}</div>
      <div class="acx-expert-profile-content">
        <div class="acx-copy acx-expert-copy">${pCopy}</div>
        <div class="acx-expert-detail-grid">${facts.map(([, t, d]) => `
          <article><span>${t}</span><p>${d}</p></article>`).join('')}
          <article class="acx-expert-detail-wide"><span>${whereLabel}</span>${whereText}${whereLink}</article>
        </div>
      </div>
    </div>
  </div>
</section>`);

  // memberships (the live page shows them beside education / experience)
  const logos = all(edu, /<li>(<img [^>]*>)<\/li>/g);
  must(logos.length === 7, 'logos');
  const cards6 = cardItems(benefits);
  body.push(reasons({ kicker: 'Benefits', h2: h(benefits), lede: all(benefits, /<p class="pg-lede">([\s\S]*?)<\/p>/g), cards: cards6, bg: 'white' }));

  // why choose + conditions: the reference "when to visit" list
  const bandCopies = all(band, /<div class="pg-copy">([\s\S]*?)<\/div>/g);
  const cond = bandCopies[1];
  body.push(concerns({ kicker: 'Why Choose Dr. Nivedita Dadu', h2: h(band), lede: bandCopies[0],
    before: `\n    <div class="acx-concern-intro"><h3>${one(cond, /<h3 class="pg-band-sub">([\s\S]*?)<\/h3>/, 'cond h3')}</h3>${cond.replace(/<h3[\s\S]*?<\/h3>/, '').replace(/<ul[\s\S]*<\/ul>/, '').trim()}</div>`,
    items: all(cond, /<li>([\s\S]*?)<\/li>/g).map(t => `<h3>${t}</h3>`) }));

  // five treatment stories, alternating the reference photo sections
  // the four topic stock photos are not on the live page: those stories are text only
  body.push(mast({ kicker: 'Anti-Aging Treatment', h2: h(antiAge), copies: [copyOf(antiAge)], bg: 'white' }));
  body.push(difference({ kicker: 'Celebrity Dermatologist', h2: h(celeb), copy: copyOf(celeb, 'pg-copy pg-bleed-copy'), image: img(celeb, 'celeb img'), bg: 'mist' }));
  body.push(mast({ kicker: 'Glass-Like Skin', h2: h(glass), copies: [copyOf(glass)], bg: 'white' }));
  body.push(mast({ kicker: 'Lip Plumping', h2: h(lip), copies: [copyOf(lip)], bg: 'mist' }));
  body.push(mast({ kicker: 'Bridal and Groom Treatments', h2: h(bridal), copies: [copyOf(bridal)], bg: 'white' }));

  // 4 steps: top reasons cards
  const stepCards = [...steps.matchAll(/<article class="pg-card"><span class="pg-card-num">\d+<\/span>(<h3>[\s\S]*?<\/h3>[\s\S]*?)<\/article>/g)].map(m => m[1]);
  must(stepCards.length === 4, 'steps');
  body.push(reasons({ kicker: 'Skin Care Regimen', h2: h(steps), lede: [one(steps, /<p class="pg-lede">([\s\S]*?)<\/p>/, 'steps lede')], cards: stepCards }));

  // education / experience: two reference numbered lists + the membership logos
  const tl = p => [...p.matchAll(/<li><svg[\s\S]*?<\/svg><span class="timeline-title">([\s\S]*?)<\/span><span class="timeline-year">([\s\S]*?)<\/span><span class="timeline-place">([\s\S]*?)<\/span><\/li>/g)];
  const eduP = one(edu, /(<div class="tab-panel" id="panel-education"[\s\S]*?<\/ul>)/, 'edu'), expP = one(edu, /(<div class="tab-panel" id="panel-experience"[\s\S]*?<\/ul>)/, 'exp');
  const credCol = p => `<div class="acx-cred-col"><h3 class="acx-cred-title">${one(p, /<h3 class="tab-panel-title">([\s\S]*?)<\/h3>/, 'tab title')}</h3><div class="acx-concern-grid acx-concern-grid--1">${tl(p).map(([, t, y, pl], i) => `
        <article><span>${n2(i)}</span><div><h3>${t}</h3><p class="acx-cred-year">${y}</p><p>${pl}</p></div></article>`).join('')}</div></div>`;
  must(tl(eduP).length === 3 && tl(expP).length === 3, 'timeline');
  body.push(`<section class="acx-concerns acx-bg-white">
  <div class="acx-shell">
    <div class="acx-head-center">${K('Education and Experience')}</div>
    <div class="acx-cred-grid">
      ${credCol(eduP)}
      ${credCol(expP)}
    </div>
    <ul class="acx-logo-row" aria-label="Associations">${logos.map(l => `<li>${l}</li>`).join('')}</ul>
  </div>
</section>`);

  // the live page shows this section on its doctor photo, with the clinic photo beside its contact box
  body.push(story({ kicker: 'In the Spotlight', h2: h(spot), copy: copyOf(spot), flip: true, extra: '\n      ' + btn('Schedule a Consultation'),
    main: '<img src="/images/about/about-doctor-nd.webp" alt="Dr. Nivedita Dadu" loading="lazy" width="1440" height="1057" decoding="async">', mainPos: 78,
    small: '<img src="/images/about/clinic-img.webp" alt="Dr. Nivedita Dadu&#x27;s Dermatology Clinic" loading="lazy" width="1329" height="866" decoding="async">' }));

  // knowledge sharing + press logos
  body.push(`<section class="acx-press">
  <div class="acx-shell">
    <div class="acx-top-reasons-head">${K('Knowledge Sharing')}<h2>${h(press)}</h2><p class="acx-lede">${one(press, /<p class="pg-lede">([\s\S]*?)<\/p>/, 'press lede')}</p></div>
  </div>
  ${one(press, /(<div class="swiper press-swiper">[\s\S]*?<\/div>\s*<\/div>)/, 'press swiper')}
</section>`);

  // skin care from the lady who knows the best: reference list
  const ladyItems = [...lady.matchAll(/<div class="panel-item">(<h3>[\s\S]*?<\/h3>[\s\S]*?)<\/div>/g)].map(m => m[1]);
  must(ladyItems.length === 4, 'lady');
  body.push(concerns({ kicker: 'Patient Care', h2: h(lady), items: ladyItems }));

  // specialties + services: the coral expert band with a card holding both lists
  const lists = [...spec.matchAll(/<div class="pg-card"><h2 class="pg-list-title">([\s\S]*?)<\/h2><ul class="check-list">([\s\S]*?)<\/ul><\/div>/g)];
  must(lists.length === 2, 'spec lists');
  body.push(`<section class="acx-expert-profile acx-expert-lists">
  <div class="acx-shell">
    <div class="acx-expert-profile-head">${K('Specialties and Services')}</div>
    <div class="acx-expert-profile-card acx-lists-card">${lists.map(([, t, li]) => `
      <div class="acx-lists-col"><h2>${t}</h2><div class="acx-difference-list">${all(li, /<li>([\s\S]*?)<\/li>/g).map(x => `
        <div class="acx-difference-item"><span class="acx-check">${ico('i-check')}</span><div><p>${x}</p></div></div>`).join('')}</div></div>`).join('')}
    </div>
  </div>
</section>`);

  // philosophy: three reference cards
  const philCards = [...phil.matchAll(/<div class="pg-phil-row">[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<div class="pg-copy">([\s\S]*?)<\/div>\s*<\/div>/g)].map(m => `<h3>${m[1]}</h3>${m[2]}`);
  must(philCards.length === 3, 'philosophy');
  body.push(reasons({ kicker: 'Philosophy', h2: h(phil), cards: philCards, bg: 'white', small: true }));

  // creation of beauty + premium services with the live videos
  const heads = [...beauty.matchAll(/<div class="pg-head pg-head--center">([\s\S]*?)<\/div>/g)].map(m => m[1]);
  const premium = [...beauty.matchAll(/<article class="pg-card"><h3>([\s\S]*?)<\/h3>([\s\S]*?)<\/article>/g)];
  must(heads.length === 2 && premium.length === 6, 'beauty');
  body.push(concerns({ kicker: 'Premium Services', h2: h(heads[0]), lede: `<p>${one(heads[0], /<p class="pg-lede">([\s\S]*?)<\/p>/, 'beauty lede')}</p>`,
    before: `\n    <div class="acx-concern-intro"><h3>${h(heads[1], 'h3')}</h3><p>${one(heads[1], /<p class="pg-lede">([\s\S]*?)<\/p>/, 'premium lede')}</p></div>`,
    items: premium.map(([, t, p]) => { const id = must(VIDEOS[t.replace(/&amp;/g, '&')], 'video ' + t);
      return `<h3>${t}</h3>${p}<a class="acx-video-btn" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" data-video-dialog="${id}" data-title="${t}"><span class="acx-video-btn-ico" aria-hidden="true">${ico('i-play', true)}</span><span>Watch Video</span></a>`; }) }));

  body.push(faq({ kicker: 'Expert Answers', h2: h(faqS), rows: faqRows(faqS), numbered: true, bg: 'white' }) + '\n\n{{> videos-section}}');

  // patient testimonials: the reference testimonial band
  const tcards = [...testi.matchAll(/<article class="cf-card">\s*<div class="cf-body">\s*(<img [^>]*>)\s*<p class="cf-treatment">([\s\S]*?)<\/p>\s*<div class="cf-text is-open">([\s\S]*?)<\/div>\s*<\/div>\s*<div class="cf-bottom">\s*<div>\s*<h3 class="cf-name">([\s\S]*?)<\/h3>\s*<p class="cf-meta">([\s\S]*?)<\/p>\s*<p class="cf-note">([\s\S]*?)<\/p>\s*<\/div>\s*(<p class="cf-rating">[\s\S]*?<\/p>)/g)];
  must(tcards.length === 3, 'testimonials');
  body.push(`<section class="rv-section">
  <div class="rv-inner">
    ${K('Patient Stories', 'acx-kicker-onpeach')}
    <h2 class="rv-heading">${h(testi)}</h2>
    <div class="rv-grid">${tcards.map(([, photo, tag, text, name, meta, note, rating]) => `
      <div class="rv-tcard"><div class="rv-timg">${photo.replace(' class="cf-photo"', '')}</div><div class="rv-tbody"><span class="rv-tag">${tag}</span><div class="rv-ttext">${text}</div><h3 class="rv-tname">${name}</h3><p class="rv-tmeta">${meta}</p><p class="rv-tnote">${note}</p>${rating.replace('cf-rating', 'rv-rating')}</div></div>`).join('')}
    </div>
    <div class="rv-actions">${btn('View All', '/testimonials')}</div>
  </div>
</section>`);

  // ratings and reviews: the site's review list (load more) under a reference head
  body.push(ratings.replace('<section class="section bg-white" data-gallery data-step="6">', '<section class="dnr-section" data-gallery data-step="6">')
    .replace('<div class="pg-head pg-head--center">', `<div class="dnr-head">${K('Patient Reviews')}`));

  // closing profile: copy beside the reasons list
  const cCopies = all(closing, /<div class="pg-copy[^"]*">([\s\S]*?)<\/div>/g);
  body.push(`<section class="acx-difference acx-closing acx-bg-mist">
  <div class="acx-shell acx-difference-grid">
    <div class="acx-copy acx-closing-copy">${cCopies[0]}</div>
    <div class="acx-difference-copy">
      ${K('Why Patients Choose Her')}
      <h2>${h(closing, 'h3')}</h2>
      <div class="acx-difference-list">${all(closing, /<li>([\s\S]*?)<\/li>/g).map(t => `
        <div class="acx-difference-item"><span class="acx-check">${ico('i-check')}</span><div><p>${t}</p></div></div>`).join('')}
      </div>
      <div class="acx-copy acx-closing-end">${cCopies[1]}</div>
    </div>
  </div>
</section>`);

  write('dr-nivedita-dadu', page('Dr. Nivedita Dadu', body, videoDialog));
}
console.log('wrote 5 About views');
