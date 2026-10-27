// Rebuilds views/dr-nivedita-dadu.html in the dadumedicalcentre.com "About Dr. Nivedita Dadu"
// layout (dr-nandani-/nbd-/nwc-/njc-/nsp-/sfd-/nso-/nex-/dnp-/nhl-/dnf-/rv- components,
// /css/about.css). Every heading, paragraph, list, card, review and photo is lifted unchanged from
// the previous view (backups/about-pages-2026-10-27/views/dr-nivedita-dadu.html), in the same
// order; the premium-service cards get the live page's video buttons. Usage: node compose-doctor.js
const fs = require('fs');
const SRC = 'D:/DMC website rework/dr-nivedita/backups/about-pages-2026-10-27/views/dr-nivedita-dadu.html';
const OUT = 'D:/DMC website rework/dr-nivedita/local/website/views/dr-nivedita-dadu.html';
const must = (c, m) => { if (!c) throw new Error(m); return c; };
const one = (s, re, what) => must(s.match(re), what)[1].trim();
const all = (s, re) => [...s.matchAll(re)].map(m => m[1].trim());
const img = (s, what) => must(s.match(/<img [^>]*>/), what)[0];
const ico = id => `<svg class="ico"><use href="#${id}"/></svg>`;
const btn = (label, href = '#contact') => `<a class="acx-btn acx-choose-btn" href="${href}"><span>${label}</span><span class="acx-choose-arrow-circle"><svg class="ico acx-choose-arrow"><use href="#i-arrow"/></svg></span></a>`;

const view = fs.readFileSync(SRC, 'utf8');
const S = view.split(/(?=<section )/).slice(1).map(s => s.slice(0, s.indexOf('</section>') + 10));
must(S.length === 22, 'expected 22 sections, found ' + S.length);
const [banner, intro, profile, benefits, band, antiAge, celeb, glass, lip, bridal, steps, edu, spot, press, lady, spec, phil, beauty, faqS, testi, ratings, closing] = S;
must(/pg-intro/.test(intro) && /pg-profile/.test(profile) && /pg-band/.test(band) && /pg-phil/.test(phil) && /id="faqs"/.test(faqS) && /data-gallery/.test(ratings), 'section order changed');

const out = [];

// hero + intro with the consultation form
out.push(`<section class="dr-nandani-page-hero">
  <div class="dr-nandani-page-hero-inner"><div class="dr-nandani-hero-title-block">
    <p class="dr-nandani-hero-title">${one(banner, /<p class="page-banner-title">([\s\S]*?)<\/p>/, 'banner')}</p>
    <nav class="dr-nandani-hero-breadcrumb" aria-label="Breadcrumb"><a href="/"><span>Home</span></a><span aria-hidden="true">/</span><span aria-current="page">${one(banner, /<span aria-current="page">([\s\S]*?)<\/span>/, 'crumb')}</span></nav>
  </div></div>
</section>`);
out.push(`<section class="dr-nandani-intro-form-section">
  <div class="dr-nandani-intro-grid">
    <div class="dr-nandani-image-column"><div class="dr-nandani-gallery-grid single-column"><div class="dr-nandani-gallery-main">${img(intro, 'intro img')}</div></div></div>
    <div class="dr-nandani-info-form-column">
      <div class="dr-nandani-doctor-copy">
        <p class="dr-nandani-kicker">${one(intro, /<p class="pg-kicker">([\s\S]*?)<\/p>/, 'kicker')}</p>
        <h1>${one(intro, /<h1[^>]*>([\s\S]*?)<\/h1>/, 'h1')}</h1>
        <p class="dr-nandani-degree">${one(intro, /<p class="pg-sub">([\s\S]*?)<\/p>/, 'sub')}</p>
        <div class="dr-nandani-description">${one(intro, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'intro copy')}</div>
      </div>
      <div class="dr-nandani-lead-card">
        {{> consult-form}}
      </div>
    </div>
  </div>
</section>`);

// best dermatologist: coral band, two columns, membership logos (moved up from the education block, as on the reference)
const profCopy = one(profile, /<div class="pg-profile-copy pg-copy">([\s\S]*?)<\/div>/, 'profile copy');
const profParas = all(profCopy, /(<p>[\s\S]*?<\/p>)/g);
const logos = all(edu, /<li>(<img [^>]*>)<\/li>/g);
must(profParas.length === 2 && logos.length === 7, 'profile paragraphs / logos');
out.push(`<section class="nbd-section">
  <span class="nbd-glow nbd-glow-1" aria-hidden="true"></span><span class="nbd-glow nbd-glow-2" aria-hidden="true"></span><span class="nbd-quote" aria-hidden="true">“</span>
  <div class="nbd-shell">
    <div class="nbd-head">
      <p class="nbd-kicker">${one(profile, /<p class="pg-feature-row-kicker">([\s\S]*?)<\/p>/, 'profile kicker')}</p>
      <h2>${one(profile, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'profile h2')}</h2><span class="nbd-head-rule" aria-hidden="true"></span>
    </div>
    <div class="nbd-profile">
      <div class="nbd-profile-photo">${img(profile, 'portrait')}</div>
      ${one(profile, /(<ul class="pg-profile-facts">[\s\S]*?<\/ul>)/, 'facts')}
    </div>
    <div class="nbd-columns">
      <div class="nbd-col">${profParas[0]}</div>
      <span class="nbd-divider" aria-hidden="true"></span>
      <div class="nbd-col nbd-col-right">${profParas[1]}</div>
    </div>
    ${one(profile, /(<div class="pg-profile-where">[\s\S]*?<\/a>\s*<\/div>)/, 'where')}
    <div class="nbd-membership">
      <div class="nbd-marquee"><div class="nbd-marquee-track">${logos.map(l => `<div class="nbd-mem-logo">${l}</div>`).join('')}${logos.map(l => `<div class="nbd-mem-logo" aria-hidden="true">${l.replace(/ alt="[^"]*"/, ' alt=""')}</div>`).join('')}</div></div>
    </div>
  </div>
</section>`);

// benefits: "why choose" cards
const benIcons = ['i-steth', 'i-target', 'i-user', 'i-zap', 'i-heart', 'i-shield'];
const benCards = all(benefits, /<article class="pg-card">([\s\S]*?)<\/article>/g);
must(benCards.length === 6, 'benefit cards');
out.push(`<section class="nwc-section">
  <span class="nwc-corner nwc-corner-tl" aria-hidden="true"></span><span class="nwc-corner nwc-corner-br" aria-hidden="true"></span>
  <div class="nwc-shell">
    <div class="nwc-head">
      <h2>${one(benefits, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'benefits h2')}</h2>
      ${all(benefits, /<p class="pg-lede">([\s\S]*?)<\/p>/g).map(p => `<p class="nwc-intro">${p}</p>`).join('\n      ')}
    </div>
    <div class="nwc-grid">${benCards.map((c, i) => `
      <article class="nwc-card"><span class="nwc-icon">${ico(benIcons[i])}</span>${c.replace(/<\/h3>/, '</h3><span class="nwc-divider" aria-hidden="true"><i></i></span>')}</article>`).join('')}
    </div>
  </div>
</section>`);

// why choose + conditions: the reference two-panel card (copy left, list right)
const bandCopies = all(band, /<div class="pg-copy">([\s\S]*?)<\/div>/g);
must(bandCopies.length === 2, 'band copies');
out.push(`<section class="nhl-section">
  <div class="nhl-card"><div class="nhl-grid">
    <div class="nhl-left"><span class="nhl-bar" aria-hidden="true"></span><h2>${one(band, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'band h2')}</h2><span class="nhl-bar" aria-hidden="true"></span>
      <div class="nhl-copy">${bandCopies[0]}</div></div>
    <div class="nhl-right"><span class="nhl-bar" aria-hidden="true"></span>
      ${bandCopies[1].replace(/<h3 class="pg-band-sub">/, '<h3>').replace(/<ul class="check-list check-list--2col">([\s\S]*?)<\/ul>/, (m, li) => `<ul class="nhl-benefits">${li.replace(/<li>/g, '<li><span class="nhl-dot" aria-hidden="true"></span><span>').replace(/<\/li>/g, '</span></li>')}</ul>`)}
    </div>
  </div></div>
</section>`);

// five treatment stories: the reference founder block (copy card over a photo), alternating sides
const storyBlock = (h2, copy, photo, flip, pos) => `<section class="dnp-root dnp-story${flip ? ' dnp-story--flip' : ''}">
  <div class="dnp-founder"><div class="dnp-founder-shell">
    <div class="dnp-founder-copy"><h2>${h2}</h2>${copy}</div>
    <div class="dnp-founder-visual">${photo.replace('<img ', `<img data-pos="${pos}" `)}</div>
  </div></div>
</section>`;
out.push(storyBlock(one(antiAge, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'anti h2'), one(antiAge, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'anti copy'), img(antiAge, 'anti img'), false, 55));
out.push(storyBlock(one(celeb, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'celeb h2'), one(celeb, /<div class="pg-copy pg-bleed-copy">([\s\S]*?)<\/div>/, 'celeb copy'), img(celeb, 'celeb img'), true, 50));
out.push(storyBlock(one(glass, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'glass h2'), one(glass, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'glass copy'), img(glass, 'glass img'), false, 15));
out.push(storyBlock(one(lip, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'lip h2'), one(lip, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'lip copy'), img(lip, 'lip img'), true, 35));
out.push(storyBlock(one(bridal, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'bridal h2'), one(bridal, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'bridal copy'), img(bridal, 'bridal img'), false, 45));

// 4 steps: the reference numbered solution cards
const stepCards = [...steps.matchAll(/<article class="pg-card"><span class="pg-card-num">(\d+)<\/span>(<h3>[\s\S]*?<\/h3>)([\s\S]*?)<\/article>/g)];
must(stepCards.length === 4, 'step cards');
out.push(`<section class="nso-section">
  <span class="nso-bg-glow" aria-hidden="true"></span>
  <div class="nso-shell">
    <header class="nso-head"><h2>${one(steps, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'steps h2')}</h2><span class="nso-rule" aria-hidden="true"></span>
      <p class="nso-lede">${one(steps, /<p class="pg-lede">([\s\S]*?)<\/p>/, 'steps lede')}</p></header>
    <div class="nso-grid nso-grid--4">${stepCards.map(([, n, h3, p]) => `
      <article class="nso-card"><span class="nso-wm" aria-hidden="true">${n}</span><div class="nso-card-head"><span class="nso-num">${n}</span>${h3}</div>${p}</article>`).join('')}
    </div>
  </div>
</section>`);

// education / experience: the reference timeline columns
const tl = panel => [...panel.matchAll(/<li><svg[\s\S]*?<\/svg><span class="timeline-title">([\s\S]*?)<\/span><span class="timeline-year">([\s\S]*?)<\/span><span class="timeline-place">([\s\S]*?)<\/span><\/li>/g)]
  .map(([, t, y, p]) => `<li class="njc-tl"><span class="njc-node njc-node-ico">${ico('i-check')}</span><div class="njc-tl-body"><div class="njc-tl-label"><strong>${t}</strong></div><span class="njc-line">${p}</span><span class="njc-line">${y}</span></div></li>`);
const eduPanel = one(edu, /(<div class="tab-panel" id="panel-education"[\s\S]*?<\/ul>)/, 'education'), expPanel = one(edu, /(<div class="tab-panel" id="panel-experience"[\s\S]*?<\/ul>)/, 'experience');
must(tl(eduPanel).length === 3 && tl(expPanel).length === 3, 'timeline rows');
const col = (title, icon, rows) => `<div class="njc-col"><div class="njc-col-inner"><div class="njc-col-head"><span class="njc-col-icon">${ico(icon)}</span><h3>${title}</h3><span class="njc-col-rule" aria-hidden="true"><i></i></span></div><ul class="njc-timeline">${rows.join('')}</ul></div></div>`;
out.push(`<section class="njc-section">
  <div class="njc-band njc-band-creds"><div class="njc-shell"><div class="njc-creds">
    ${col(one(eduPanel, /<h3 class="tab-panel-title">([\s\S]*?)<\/h3>/, 'edu title'), 'i-award', tl(eduPanel))}
    ${col(one(expPanel, /<h3 class="tab-panel-title">([\s\S]*?)<\/h3>/, 'exp title'), 'i-steth', tl(expPanel))}
  </div></div></div>
</section>`);

// spotlight: founder block with the button
out.push(`<section class="dnp-root dnp-story dnp-story--flip">
  <div class="dnp-founder"><div class="dnp-founder-shell">
    <div class="dnp-founder-copy"><h2>${one(spot, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'spot h2')}</h2>${one(spot, /<div class="pg-copy">([\s\S]*?)<\/div>/, 'spot copy')}
      ${btn('Schedule a Consultation')}</div>
    <div class="dnp-founder-visual">${img(spot, 'spot img')}</div>
  </div></div>
</section>`);

// knowledge sharing + press logos (the site's press slider)
out.push(`<section class="nsp-section nsp-press">
  <div class="nsp-shell">
    <header class="nsp-head"><h2>${one(press, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'press h2')}</h2>
      <div class="nsp-orn" aria-hidden="true"><span class="nsp-orn-dot"></span><span class="nsp-orn-line"></span><span class="nsp-orn-dot"></span></div>
      <p>${one(press, /<p class="pg-lede">([\s\S]*?)<\/p>/, 'press lede')}</p></header>
  </div>
  ${one(press, /(<div class="swiper press-swiper">[\s\S]*?<\/div>\s*<\/div>)/, 'press swiper')}
</section>`);

// skin care from the lady who knows the best: the reference icon list
const ladyItems = [...lady.matchAll(/<div class="panel-item">(<h3>[\s\S]*?<\/h3>)([\s\S]*?)<\/div>/g)];
const ladyIcons = ['i-heart', 'i-zap', 'i-award', 'i-sparkle'];
must(ladyItems.length === 4, 'lady items');
out.push(`<section class="sfd-section">
  <span class="sfd-dots" aria-hidden="true"></span>
  <div class="sfd-shell">
    <header class="sfd-head"><h2><span class="sfd-h-orange">${one(lady, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'lady h2')}</span></h2>
      <div class="sfd-orn" aria-hidden="true"><span class="sfd-orn-dot"></span><span class="sfd-orn-line"></span><span class="sfd-orn-dot"></span></div></header>
    <div class="sfd-grid">${ladyItems.map(([, h3, p], i) => `
      <article class="sfd-item"><div class="sfd-icon"><span class="sfd-icon-ring" aria-hidden="true"></span><span class="sfd-icon-circle">${ico(ladyIcons[i])}</span></div><div class="sfd-item-body">${h3}${p}</div></article>`).join('')}
    </div>
  </div>
</section>`);

// specialties + services: the reference expertise card, two lists
const specCards = [...spec.matchAll(/<div class="pg-card"><h2 class="pg-list-title">([\s\S]*?)<\/h2><ul class="check-list">([\s\S]*?)<\/ul><\/div>/g)];
must(specCards.length === 2, 'specialty lists');
out.push(`<section class="nex-wrapper">
  <div class="nex-card"><div class="nex-top nex-top--lists">${specCards.map(([, h2, li]) => `
    <div class="nex-content"><div class="nex-icon" aria-hidden="true">${ico('i-check')}</div><h2>${h2}</h2>
      <div class="nex-list">${all(li, /<li>([\s\S]*?)<\/li>/g).map(t => `<div class="nex-list-item"><span aria-hidden="true">${ico('i-check')}</span><p>${t}</p></div>`).join('')}</div></div>`).join('')}
  </div></div>
</section>`);

// philosophy: the reference mission/vision columns
const philRows = [...phil.matchAll(/<div class="pg-phil-row">[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<div class="pg-copy">([\s\S]*?)<\/div>\s*<\/div>/g)];
const philIcons = ['i-target', 'i-heart', 'i-check'];
must(philRows.length === 3, 'philosophy rows');
out.push(`<section class="dnp-root dnp-phil">
  <div class="dnp-mv">
    <div class="dnp-mv-head"><h2>${one(phil, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'phil h2')}</h2><span class="dnp-rule" aria-hidden="true"></span></div>
    <div class="dnp-mv-shell dnp-mv-shell--3">${philRows.map(([, h3, copy], i) => `
      <div class="dnp-mv-col"><span class="dnp-mv-icon">${ico(philIcons[i])}</span><div class="dnp-mv-body"><h3 class="dnp-mv-title">${h3}</h3>${copy}</div></div>`).join('')}
    </div>
  </div>
</section>`);

// creation of beauty + premium services, each card with the live page's video
const VIDEOS = { 'Magic Blend for Skin®': '52rC1BSOxgI', 'Martini for Skin®': 'PCjHpA5-ThQ', 'DivaGenesis®': 'ZseuBYETscA', 'Crystal Glaze®': 'QpGR__kPKL4', 'RRT®': '4utgpvO_Afc', 'Bloody Mary Peel®': 'KC8w9ijLEQc' };
const heads = [...beauty.matchAll(/<div class="pg-head pg-head--center">([\s\S]*?)<\/div>/g)].map(m => m[1]);
const premium = [...beauty.matchAll(/<article class="pg-card"><h3>([\s\S]*?)<\/h3>([\s\S]*?)<\/article>/g)];
must(heads.length === 2 && premium.length === 6, 'beauty heads / premium cards');
out.push(`<section class="nsp-section nsp-premium">
  <span class="nsp-spark nsp-spark-1" aria-hidden="true"></span><span class="nsp-spark nsp-spark-2" aria-hidden="true"></span>
  <div class="nsp-shell">
    <header class="nsp-head"><h2>${one(heads[0], /<h2[^>]*>([\s\S]*?)<\/h2>/, 'beauty h2')}</h2>
      <div class="nsp-orn" aria-hidden="true"><span class="nsp-orn-dot"></span><span class="nsp-orn-line"></span><span class="nsp-orn-dot"></span></div>
      <p>${one(heads[0], /<p class="pg-lede">([\s\S]*?)<\/p>/, 'beauty lede')}</p></header>
    <div class="nsp-sub"><h3>${one(heads[1], /<h3[^>]*>([\s\S]*?)<\/h3>/, 'premium h3')}</h3><p>${one(heads[1], /<p class="pg-lede">([\s\S]*?)<\/p>/, 'premium lede')}</p></div>
    <div class="nsp-grid nsp-grid--3">${premium.map(([, h3, p]) => {
      const v = must(VIDEOS[h3.replace(/&amp;/g, '&')], 'video for ' + h3);
      return `
      <article class="nsp-card"><span class="nsp-ico">${ico('i-sparkle')}</span><span class="nsp-card-div" aria-hidden="true"></span><div class="nsp-card-body"><h3>${h3}</h3>${p}
        <a class="nsp-play" href="https://www.youtube.com/watch?v=${v}" target="_blank" rel="noopener" data-video-dialog="${v}" data-title="${h3}"><span class="nsp-play-ico" aria-hidden="true">${ico('i-play').replace('class="ico"', 'class="ico ico-fill"')}</span><span>Watch Video</span></a></div></article>`;
    }).join('')}
    </div>
  </div>
</section>`);

// FAQ: the reference FAQ cards (details/summary feed the FAQ schema)
const faqRows = [...faqS.matchAll(/<details class="faq-row"[\s\S]*?<\/details>/g)].map(m => m[0]);
must(faqRows.length === 6, 'faq rows');
out.push(`<section class="dnf-section" id="faqs">
  <div class="dnf-shell">
    <div class="dnf-head"><h2>${one(faqS, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'faq h2')}</h2></div>
    <div class="dnf-list acx-clinic-faq-list">
      ${faqRows.join('\n      ')}
    </div>
  </div>
</section>

{{> videos-section}}`);

// patient testimonials: the reference testimonial cards on the coral band
const tcards = [...testi.matchAll(/<article class="cf-card">\s*<div class="cf-body">\s*(<img [^>]*>)\s*<p class="cf-treatment">([\s\S]*?)<\/p>\s*<div class="cf-text is-open">([\s\S]*?)<\/div>\s*<\/div>\s*<div class="cf-bottom">\s*<div>\s*<h3 class="cf-name">([\s\S]*?)<\/h3>\s*<p class="cf-meta">([\s\S]*?)<\/p>\s*<p class="cf-note">([\s\S]*?)<\/p>\s*<\/div>\s*(<p class="cf-rating">[\s\S]*?<\/p>)/g)];
must(tcards.length === 3, 'testimonials');
out.push(`<section class="rv-section">
  <div class="rv-inner">
    <h2 class="rv-heading">${one(testi, /<h2[^>]*>([\s\S]*?)<\/h2>/, 'testi h2')}</h2>
    <div class="rv-grid">${tcards.map(([, photo, tag, text, name, meta, note, rating]) => `
      <div class="rv-tcard"><div class="rv-timg">${photo.replace(' class="cf-photo"', '')}</div><div class="rv-tbody"><span class="rv-tag">${tag}</span><div class="rv-ttext">${text}</div><h3 class="rv-tname">${name}</h3><p class="rv-tmeta">${meta}</p><p class="rv-tnote">${note}</p>${rating.replace('cf-rating', 'rv-rating')}</div></div>`).join('')}
    </div>
    <div class="rv-actions"><a class="acx-btn acx-choose-btn rv-all" href="/testimonials"><span>View All</span><span class="acx-choose-arrow-circle"><svg class="ico acx-choose-arrow"><use href="#i-arrow"/></svg></span></a></div>
  </div>
</section>`);

// ratings and reviews: the site's review list (load more), under a reference heading
out.push(ratings.replace('<section class="section bg-white" data-gallery data-step="6">', '<section class="dnr-section" data-gallery data-step="6">')
  .replace('<div class="pg-head pg-head--center">', '<div class="dnr-head">'));

// closing profile: the reference two-panel card (copy left, reasons right)
const cCopies = all(closing, /<div class="pg-copy[^"]*">([\s\S]*?)<\/div>/g);
must(cCopies.length === 2, 'closing copies');
out.push(`<section class="nhl-section nhl-section--close">
  <div class="nhl-card"><div class="nhl-grid">
    <div class="nhl-left"><span class="nhl-bar" aria-hidden="true"></span><div class="nhl-copy">${cCopies[0]}</div></div>
    <div class="nhl-right"><span class="nhl-bar" aria-hidden="true"></span><h3>${one(closing, /<h3[^>]*>([\s\S]*?)<\/h3>/, 'closing h3')}</h3>
      <ul class="nhl-benefits nhl-benefits--long">${all(closing, /<li>([\s\S]*?)<\/li>/g).map(t => `<li><span class="nhl-dot" aria-hidden="true"></span><span>${t}</span></li>`).join('')}</ul>
      <div class="nhl-copy">${cCopies[1]}</div></div>
  </div></div>
</section>`);

const page = `{{> inner-page-start}}

<!-- Dr. Nivedita Dadu in the dadumedicalcentre.com "About Dr. Nivedita Dadu" layout (/css/about.css);
     text, photos and videos are the live drniveditadadu.com Dr. Nivedita Dadu page -->
<div class="acx-page dn-page">
${out.join('\n\n')}
</div>

<dialog class="video-dialog" aria-label="Treatment video">
  <button class="video-dialog-close" type="button" aria-label="Close video">✕</button>
  <div class="video-dialog-frame"></div>
  <p class="video-dialog-title"></p>
</dialog>

{{> contact-section}}

{{> inner-page-end}}
`;
fs.writeFileSync(OUT, page);
console.log('wrote dr-nivedita-dadu.html,', out.length, 'blocks');
