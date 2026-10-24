// Rebuild views/index.html in the dadumedicalcentre.com homepage layout (rh-* classes, home.css/home.js),
// moving our own homepage content across verbatim. Sections the reference has and we lacked use the
// reference's text/images (stored in public/images/home/). Usage: node build-home.js <original index.html> [--write]
const fs = require('fs');
const SRC = process.argv[2];
const WRITE = process.argv.includes('--write');
const W = 'D:/DMC website rework/dr-nivedita/local/website';
const s = fs.readFileSync(SRC, 'utf8');
const videosPartial = fs.readFileSync(W + '/views/partials/videos-section.html', 'utf8');
const must = (c, m) => { if (!c) throw new Error(m); };
const one = (re, src = s, what = String(re)) => { const m = src.match(re); must(m, 'not found: ' + what); return m; };
const sec = id => one(new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`), s, 'section #' + id)[1];

// ---------- our content ----------
const head = s.slice(0, s.indexOf('<main id="main">'));
const tail = s.slice(s.indexOf('</main>'));
const heroSec = one(/<section class="hero-stage">([\s\S]*?)<\/section>/)[1];
const hero = {
  eyebrow: one(/<p class="hero-eyebrow">([\s\S]*?)<\/p>/, heroSec)[1],
  title: one(/<h2 class="hero-title">([\s\S]*?)<\/h2>/, heroSec)[1],
  sub: one(/<p class="hero-sub">([\s\S]*?)<\/p>/, heroSec)[1],
  desc: one(/<p class="hero-desc">([\s\S]*?)<\/p>/, heroSec)[1],
  formTitle: one(/<div class="lead-head">\s*<h2>([\s\S]*?)<\/h2>/, heroSec)[1],
  avatars: [...one(/<span class="avatars">([\s\S]*?)<\/span>/, heroSec)[1].matchAll(/src="([^"]+)"/g)].map(m => m[1]),
  rating: one(/<span class="lead-patients-copy">([^<]*)</, heroSec)[1].trim(),
  consent: one(/<p class="consent">([\s\S]*?)<\/p>/, heroSec)[1],
};
const css = fs.readFileSync(W + '/public/css/main.css', 'utf8');
const heroBgs = [1, 2, 3].map(i => one(new RegExp(`\\.hero-slide-bg--${i}\\{background-image:url\\("([^"]+)"\\)\\}`), css, 'hero bg ' + i)[1]);

const trt = sec('treatments');
const trtTitle = one(/<h2 class="section-title">([\s\S]*?)<\/h2>/, trt)[1];
const trtAll = one(/<a class="svc-view-all" href="([^"]+)">([^<]*)</, trt);
const cards = [...trt.matchAll(/<div class="swiper-slide"><a class="svc-card" href="([^"]+)"><div class="svc-media"><img src="([^"]+)" alt="([^"]*)"[^>]*?width="(\d+)" height="(\d+)"[^>]*><\/div><h3>([^<]*)<\/h3><\/a><\/div>/g)]
  .map(m => ({ href: m[1], img: m[2], alt: m[3], w: m[4], h: m[5], title: m[6] }));
must(cards.length === 5, 'expected 5 treatment cards, got ' + cards.length);
// New card images ("Homepage Treatment Cards Images"), the treatment category each card opens
// (View Details) and its Before & After category on /results (View Results).
const CARD_LINKS = {
  'Anti Ageing Therapies': { img: 'anti-ageing-therapies.webp', href: '/treatments/anti-ageing-therapies/', results: 'anti-ageing' },
  'Acne': { img: 'acne.webp', href: '/treatments/acne-treatment/', results: 'acne' },
  'Hair Fall': { img: 'hair-fall.webp', href: '/treatments/hair-fall/', results: 'haircare' },
  'Acne Scars': { img: 'acne-scars.webp', href: '/treatments/acne-scars/', results: 'acne-scar' },
  'Laser Hair Removal': { img: 'laser-hair-removal.webp', href: '/treatments/laser-hair-removal/', results: 'laser' },
};
for (const c of cards) {
  const l = CARD_LINKS[c.title];
  must(l, 'no link set for card ' + c.title);
  Object.assign(c, { img: '/images/home/treatments/' + l.img, w: '718', h: '583', href: l.href, results: '/results/#' + l.results });
  must(fs.existsSync(W + '/public' + c.img), 'missing card image ' + c.img);
}

const intro = sec('intro');
const about = {
  kicker: one(/<p class="intro-kicker">([\s\S]*?)<\/p>/, intro)[1],
  title: one(/<h1 class="intro-title">([\s\S]*?)<\/h1>/, intro)[1],
  copy: one(/<p class="intro-copy">([\s\S]*?)<\/p>/, intro)[1],
  btn: one(/<a class="btn btn-primary" href="([^"]+)">([^<]*)</, intro),
  img: one(/<div class="doctor-media">\s*<img src="([^"]+)" alt="([^"]*)"[^>]*?width="(\d+)" height="(\d+)"/, intro),
};

const team = sec('team');
const doc = {
  heading: one(/<h2 class="section-title">([\s\S]*?)<\/h2>/, team)[1],
  name: one(/<h3 class="doctor-name">([\s\S]*?)<\/h3>/, team)[1],
  cred: one(/<p class="doctor-credentials">([\s\S]*?)<\/p>/, team)[1],
  bio: one(/<p class="doctor-bio">([\s\S]*?)<\/p>/, team)[1],
  btn: one(/<a class="btn btn-ghost" href="([^"]+)">([^<]*)</, team),
  img: one(/<div class="doctor-media">\s*<img src="([^"]+)" alt="([^"]*)"[^>]*?width="(\d+)" height="(\d+)"/, team),
};

const feat = sec('featured');
const pressTitle = one(/<h2 class="section-title featured-title">([\s\S]*?)<\/h2>/, feat)[1];
const logos = [...feat.matchAll(/<img src="([^"]+)" width="(\d+)" height="(\d+)" alt="([^"]*)"/g)].map(m => ({ src: m[1], w: m[2], h: m[3], alt: m[4] }));
must(logos.length >= 10, 'press logos');

const testi = sec('testimonials');
const testiTitle = one(/<h2 class="section-title">([\s\S]*?)<\/h2>/, testi)[1];
const testiSub = one(/<p class="testi-sub">([^<]*)</, testi)[1].trim();
const reviews = [...testi.matchAll(/<div class="testi-col">([\s\S]*?)<\/div>\s*(?=<div class="testi-col">|<\/div>\s*<div class="testi-action">)/g)].map(m => {
  const c = m[1];
  return {
    tag: one(/<p class="review-tag">([\s\S]*?)<\/p>/, c)[1], text: one(/<p class="review-text">([\s\S]*?)<\/p>/, c)[1],
    note: one(/<p class="review-note">([\s\S]*?)<\/p>/, c)[1], name: one(/<span class="review-name">([\s\S]*?)<\/span>/, c)[1],
    date: one(/<span class="review-date">([\s\S]*?)<\/span>/, c)[1], video: one(/data-video="([^"]+)"/, c)[1],
    thumb: one(/<img src="([^"]+)"/, c)[1],
  };
});
must(reviews.length === 5, 'expected 5 reviews, got ' + reviews.length);
const testiAll = one(/<div class="testi-action">\s*<a class="btn btn-outline" href="([^"]+)">([^<]*)</, testi);

const res = sec('results');
const resTitle = one(/<h2 class="section-title">([\s\S]*?)<\/h2>/, res)[1];
const results = [...res.matchAll(/<article class="result-card">\s*<h3>([\s\S]*?)<\/h3>\s*<div class="result-media"><img ([^>]*)><\/div>\s*<p class="result-meta">([\s\S]*?)<\/p>/g)].map(m => ({ title: m[1], img: m[2], meta: m[3] }));
must(results.length, 'results');
const resDisc = one(/<p class="disclaimer">([\s\S]*?)<\/p>/, res)[1];
const resAll = one(/<div class="center-action">\s*<a class="btn btn-outline" href="([^"]+)">([^<]*)</, res);

const vidTitle = one(/<h2 class="section-title">([\s\S]*?)<\/h2>/, videosPartial)[1];
const vids = [...videosPartial.matchAll(/<a class="vcard" href="([^"]+)"[^>]*data-video="([^"]+)"[^>]*>[\s\S]*?<span class="vcard-title">([^<]*)<\/span>/g)].map(m => ({ url: m[1], id: m[2], title: m[3] }));
const gallery = fs.readFileSync(W + '/views/gallery-video.html', 'utf8');
for (const id of ['tVKVDObyCu4']) {           // What is Purging? (4 videos in the slider)
  const m = gallery.match(new RegExp('<a class="vcard" href="([^"]+)"[^>]*data-video="' + id + '"[^>]*>[\\s\\S]*?<span class="vcard-title">([^<]*)</span>'));
  must(m, 'video ' + id + ' not on /video/');
  if (!vids.some(v => v.id === id)) vids.push({ url: m[1], id, title: m[2] });
}
must(vids.length === 4, 'expected 4 videos, got ' + vids.length);
const vidAll = one(/<a[^>]*href="(\/video\/)"[^>]*>([\s\S]*?)<\/a>/, videosPartial);

const blogSec = sec('blogs');
const blogTitle = one(/<h2 class="section-title">([\s\S]*?)<\/h2>/, blogSec)[1];
const blogs = [...blogSec.matchAll(/<a class="blog-card" href="([^"]+)">\s*<div class="blog-media">\s*<img src="([^"]+)" alt="([^"]*)"[^>]*?width="(\d+)" height="(\d+)"[^>]*>\s*<span class="date-pill">([^<]*)<\/span>\s*<\/div>\s*<div class="blog-author">[\s\S]*?<\/span>([^<]*)<\/div>\s*<h3>([\s\S]*?)<\/h3>\s*<span class="blog-link">([^<]*)<\/span>/g)]
  .map(m => ({ href: m[1], img: m[2], alt: m[3], w: m[4], h: m[5], date: m[6], author: m[7].trim(), title: m[8], link: m[9] }));
must(blogs.length === 3, 'expected 3 blogs, got ' + blogs.length);
const blogPage = fs.readFileSync(W + '/views/blog.html', 'utf8');
for (const bl of blogs) {
  const slug = bl.href.replace(/\/$/, '').split('/').pop();
  const i = blogPage.indexOf(slug + '/');
  const m = i >= 0 && blogPage.slice(i, i + 3000).match(/<p class="blog-card-text">([^<]*)<\/p>/);
  must(m, 'no description on /blog/ for ' + slug);
  bl.desc = m[1];
}
const blogAll = one(/<div class="center-action">\s*<a class="btn btn-outline" href="([^"]+)">([^<]*)</, blogSec);

// ---------- reference-only content (we had nothing for these) ----------
const REF = {
  etEyebrow: 'Our Specialities', rvEyebrow: 'Real Stories',
  points: ['Golden Technique', 'Minimal Procedure', 'Natural Results', 'Safe Procedure', 'Expert Team', 'Affordable Quality', 'FUE MesoGrow', 'Top Trichologist'],
  founderBadge: ['20+', 'Years of', 'Excellence'],
  stats: [['20+', 'Years of<br>Experience'], ['20,000+', 'Happy<br>Patients'], ['9+', 'Memberships &amp;<br>Affiliations']],
  memberships: 'Memberships &amp; Affiliations',
  vidEyebrow: 'Watch Expert Advice', fpEyebrow: 'Media Coverage',
  blogSub: 'Expert Skin &amp; Hair Care Advice From Dr. Nivedita Dadu And Our Dermatologists',
  fpDesc: 'Here are some news articles that have been published in some reputed magazines and newspapers with expert inputs from Dr. Nivedita Dadu. These articles will help you understand the right skin and hair care regimens as well as advanced dermatological procedures available today.',
};

// ---------- markup ----------
const excerpt = (h, n) => { if (h.length <= n) return h; const c = h.slice(0, n); return c.slice(0, c.lastIndexOf(' ')).replace(/[,;:.]$/, '') + '...'; };
const TICK = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ico = id => `<svg class="ico"><use href="#${id}"/></svg>`;
const arrow = `<span class="rh-arrow">${ico('i-arrow')}</span>`;
const stars5 = `<span class="stars" aria-hidden="true">${ico('i-star').replace('class="ico"', 'class="ico ico-fill"').repeat(5)}</span>`;
const etCard = (c, dup) => `
          <div class="swiper-slide${dup ? ' rh-dup' : ''}"><article class="rh-et-card"><img class="rh-et-img" src="${c.img}" alt="${dup ? '' : c.alt}" loading="lazy" width="${c.w}" height="${c.h}" decoding="async"><div class="rh-et-shade"></div><div class="rh-et-content"><span class="rh-et-accent"></span><h3 class="rh-et-card-title"><a href="${c.href}"${dup ? ' tabindex="-1" aria-hidden="true"' : ''}>${c.title}</a></h3><div class="rh-et-reveal"><div class="rh-et-btns"><a class="rh-et-btn" href="${c.href}"${dup ? ' tabindex="-1"' : ''}>View Details</a><a class="rh-et-btn" href="${c.results}"${dup ? ' tabindex="-1"' : ''}>View Results</a></div></div></div></article></div>`;
const membership = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<div class="rh-logo"><img src="/images/home/membership0${i}.webp" alt="" width="170" height="171" loading="lazy" decoding="async"></div>`).join('');
const press = logos.map(l => `<span class="rh-fp-logo"><img src="${l.src}" width="${l.w}" height="${l.h}" alt="${l.alt}" loading="lazy" decoding="async"></span>`).join('');

const main = `<main id="main">

<!-- 1. HERO: cross-fading clinic photos, frosted copy box left, form right -->
<section class="rh-hero">
  <div class="rh-slider">
${heroBgs.map((b, i) => `    <div class="rh-slide${i ? '' : ' is-active'}"><div class="rh-slide-bg rh-slide-bg--${i + 1}"></div></div>`).join('\n')}
    <div class="rh-slide-content">
      <p class="rh-hero-eyebrow">${hero.eyebrow}</p>
      <h2 class="rh-hero-title">${hero.title}</h2>
      <p class="rh-hero-desc">${hero.sub}<br>${hero.desc}</p>
    </div>
    <div class="rh-dots">
${heroBgs.map((b, i) => `      <button class="rh-dot${i ? '' : ' is-active'}" type="button" aria-label="Show clinic photo ${i + 1}" aria-pressed="${!i}"></button>`).join('\n')}
    </div>
  </div>
  <div class="rh-hero-right">
    <div class="rh-form-card">
      <div class="rh-form-head">
        <h2 class="rh-form-title">${hero.formTitle}</h2>
        <div class="rh-patients">
          <span class="rh-avatars">${hero.avatars.map(a => `<img src="${a}" alt="" width="30" height="30">`).join('')}</span>
          <span class="rh-patients-copy">${hero.rating}${stars5}</span>
        </div>
      </div>
      <form class="rh-form" action="/api/appointment" method="post" data-form="appointment">
        <input type="hidden" name="_ft" value="{{formToken}}">
        <div class="hp-field" aria-hidden="true"><label>Leave this field empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <div class="rh-form-row">
          <div class="rh-field"><input class="rh-input" type="text" name="name" placeholder="Your Name" aria-label="Your Name" required></div>
          <div class="rh-field"><input class="rh-input" type="tel" name="phone" placeholder="Mobile Number *" aria-label="Mobile Number" required></div>
        </div>
        <div class="rh-field">
          <select class="rh-input" name="location" aria-label="Preferred Location" required>
            <option value="">Preferred Location *</option>
            <option>Vasant Vihar</option>
            <option>Rajouri Garden</option>
          </select>
          ${ico('i-chev-d').replace('class="ico"', 'class="ico field-chev"')}
        </div>
        <button class="rh-submit" type="submit">Submit ${arrow}</button>
        <p class="consent">${hero.consent}</p>
        <p class="form-status" role="status" aria-live="polite" hidden></p>
      </form>
    </div>
  </div>
</section>

<!-- 2. TREATMENTS: tall photo cards slider -->
<section class="rh-et" id="treatments">
  <div class="rh-et-inner">
    <div class="rh-et-head">
      <div>
        <span class="rh-eyebrow">${REF.etEyebrow}</span>
        <h2 class="rh-h2 rh-et-title">${trtTitle}</h2>
      </div>
      <div class="rh-et-tools">
        <button class="rh-et-prev" type="button" aria-label="Previous treatment">${ico('i-chev-l')}</button>
        <button class="rh-et-next" type="button" aria-label="Next treatment">${ico('i-chev-r')}</button>
      </div>
    </div>
    <div class="swiper rh-et-swiper">
      <div class="swiper-wrapper">${cards.map(c => etCard(c)).join('')}${cards.map(c => etCard(c, true)).join('')}
      </div>
    </div>
  </div>
</section>

<!-- 3. TESTIMONIALS: brand band, photo + quote cards -->
<section class="rh-rv" id="testimonials">
  <div class="rh-rv-inner">
    <span class="rh-eyebrow">${REF.rvEyebrow}</span>
    <h2 class="rh-h2 rh-rv-heading">${testiTitle}</h2>
    <div class="swiper rh-rv-swiper">
      <div class="swiper-wrapper">${reviews.map(r => `
        <div class="swiper-slide">
          <article class="rh-rv-card">
            <a class="rh-rv-img" href="https://www.youtube.com/watch?v=${r.video}" target="_blank" rel="noopener" data-rh-video="${r.video}" aria-label="Play video testimonial"><img src="${r.thumb}" alt="" loading="lazy" width="1280" height="720" decoding="async"><span class="rh-play" aria-hidden="true">${ico('i-play')}</span></a>
            <div class="rh-rv-body">
              <span class="rh-rv-tag">${r.tag}</span>
              <p class="rh-rv-text">${r.text}</p>
              <p class="rh-rv-name">${r.name}<span class="rh-rv-date">${r.date}</span></p>
              <p class="rh-rv-note">${r.note}</p>
            </div>
          </article>
        </div>`).join('')}
      </div>
      <div class="swiper-pagination"></div>
    </div>
    <div class="rh-rv-tabs">
      <a class="rh-rv-tab rh-rv-tab--solid" href="${testiAll[1]}">${testiTitle} ${arrow}</a>
      <a class="rh-rv-tab rh-rv-tab--ghost" href="/video-testimonials/">Video Testimonials ${arrow}</a>
    </div>
  </div>
</section>

<!-- 4. ABOUT: image left, text + image/points box right -->
<section class="rh-care" id="intro">
  <div class="rh-care-layout">
    <div class="rh-care-media"><img src="/images/home/dr-nivedita-dadu-about.webp" alt="Dr. Nivedita Dadu" loading="lazy" width="1160" height="942" decoding="async"></div>
    <div class="rh-care-body">
      <span class="rh-eyebrow">${about.kicker}</span>
      <h1 class="rh-care-title">${about.title}</h1>
      <p class="rh-care-copy">${excerpt(about.copy, 470)} <a class="rh-readmore" href="/about-clinic">read more</a></p>
      <div class="rh-feature">
        <div class="rh-feature-media"><img src="/images/home/hpex01.webp" alt="" loading="lazy" width="467" height="560" decoding="async"></div>
        <div class="rh-points">${REF.points.map(p => `<div class="rh-point"><span class="rh-point-check">${TICK}</span><span>${p}</span></div>`).join('')}</div>
      </div>
    </div>
  </div>
</section>

<!-- 5. FOUNDER + DOCTOR VIDEOS -->
<section class="rh-drn" id="team">
  <div class="rh-drn-top">
    <span class="rh-drn-shape rh-drn-shape--1"></span><span class="rh-drn-shape rh-drn-shape--2"></span>
    <div class="rh-drn-inner">
      <div class="rh-drn-founder">
        <div class="rh-portrait-wrap">
          <span class="rh-portrait-bg"></span>
          <div class="rh-portrait"><img src="/images/home/dr-nivedita-dadu-founder.webp" alt="Dr. Nivedita Dadu, Founder" loading="lazy" width="680" height="907" decoding="async"></div>
          <div class="rh-badge"><span class="rh-badge-num">${REF.founderBadge[0]}</span><span class="rh-badge-text">${REF.founderBadge[1]}<br>${REF.founderBadge[2]}</span></div>
        </div>
        <div class="rh-drn-content">
          <span class="rh-eyebrow rh-eyebrow--line">${doc.heading}</span>
          <h2 class="rh-drn-name">${doc.name}</h2>
          <span class="rh-drn-role">${doc.cred}</span>
          <div class="rh-stats">${REF.stats.map(([n, l]) => `<div class="rh-stat"><span class="rh-stat-num">${n}</span><span class="rh-stat-label">${l}</span></div>`).join('')}</div>
          <p class="rh-drn-bio">${doc.bio}</p>
          <a class="rh-pill" href="${doc.btn[1]}">${doc.btn[2].trim()} ${arrow}</a>
        </div>
      </div>
      <div class="rh-marquee">
        <span class="rh-marquee-label">${REF.memberships}</span>
        <div class="rh-marquee-strip"><div class="rh-track">${membership}${membership.replace(/alt=""/g, 'alt="" aria-hidden="true"')}</div></div>
      </div>
    </div>
  </div>
  <div class="rh-drn-bottom" id="videos">
    <div class="rh-drn-inner">
      <div class="rh-vid-head">
        <div>
          <span class="rh-eyebrow rh-eyebrow--line">${REF.vidEyebrow}</span>
          <h2 class="rh-vid-title">${vidTitle}</h2>
        </div>
        <a class="rh-pill rh-pill--white" href="${vidAll[1]}">${vidAll[2].replace(/<[^>]+>/g, '').trim()} ${arrow}</a>
      </div>
      <div class="rh-vid-wrap">
        <button class="rh-round rh-vid-prev" type="button" aria-label="Previous video">${ico('i-chev-l')}</button>
        <button class="rh-round rh-vid-next" type="button" aria-label="Next video">${ico('i-chev-r')}</button>
        <div class="swiper rh-vid-swiper">
          <div class="swiper-wrapper">${vids.map(v => `
            <div class="swiper-slide">
              <a class="rh-vid-thumb" href="${v.url}" target="_blank" rel="noopener" data-rh-video="${v.id}" aria-label="Play video: ${v.title}"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360" decoding="async"><span class="rh-play" aria-hidden="true">${ico('i-play')}</span></a>
              <p class="rh-vid-name">${v.title}</p>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 6. PRESS: article covers + logo marquee -->
<section class="rh-fp" id="featured">
  <div class="rh-fp-inner">
    <span class="rh-eyebrow">${REF.fpEyebrow}</span>
    <h2 class="rh-h2 rh-fp-heading">${pressTitle}</h2>
    <p class="rh-fp-desc">${REF.fpDesc}</p>
    <div class="rh-fp-wrap">
      <button class="rh-round rh-fp-prev" type="button" aria-label="Previous article">${ico('i-chev-l')}</button>
      <button class="rh-round rh-fp-next" type="button" aria-label="Next article">${ico('i-chev-r')}</button>
      <div class="swiper rh-fp-swiper">
        <div class="swiper-wrapper">${[1, 2, 3, 4, 5].map(i => `
          <div class="swiper-slide"><div class="rh-fp-cover"><img src="/images/home/media0${i}.webp" alt="News article featuring Dr. Nivedita Dadu" loading="lazy" width="304" height="424" decoding="async"></div></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="rh-fp-marquee"><div class="rh-track">${press}${press.replace(/alt="[^"]*"/g, 'alt="" aria-hidden="true"')}</div></div>
    <a class="rh-pill rh-fp-all" href="/press-media/">View All ${arrow}</a>
  </div>
</section>

<!-- 7. RESULTS -->
<section class="rh-res" id="results">
  <div class="rh-res-inner">
    <div class="rh-res-head"><h2 class="rh-h2">${resTitle}</h2></div>
    <div class="rh-res-wrap">
      <button class="rh-round rh-res-prev" type="button" aria-label="Previous result">${ico('i-chev-l')}</button>
      <button class="rh-round rh-res-next" type="button" aria-label="Next result">${ico('i-chev-r')}</button>
      <div class="swiper rh-res-swiper">
        <div class="swiper-wrapper">${results.map(r => `
          <div class="swiper-slide"><article class="rh-res-card"><h3>${r.title}</h3><div class="rh-res-media"><img ${r.img}></div><p class="rh-res-meta">${r.meta}</p></article></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="rh-res-foot">
      <p class="disclaimer">${resDisc}</p>
      <a class="rh-pill" href="${resAll[1]}">${resAll[2].trim()} ${arrow}</a>
    </div>
  </div>
</section>

<!-- 8. REQUEST A CONSULTATION -->
{{> contact-section}}

<!-- 9. BLOGS: news & wellness advice cards -->
<section class="rh-blog" id="blogs">
  <div class="rh-blog-inner">
    <div class="rh-blog-head">
      <h2 class="rh-h2 rh-blog-title">${blogTitle}</h2>
      <p class="rh-blog-sub">${REF.blogSub}</p>
    </div>
    <div class="rh-blog-grid">${blogs.map(b => `
      <article class="rh-blog-card">
        <div class="rh-blog-media"><img src="${b.img}" alt="${b.alt}" loading="lazy" width="${b.w}" height="${b.h}" decoding="async"><span class="rh-blog-date">${b.date}</span></div>
        <div class="rh-blog-author"><span class="rh-blog-author-icon">${ico('i-user')}</span><span>${b.author}</span></div>
        <h3 class="rh-blog-card-title"><a href="${b.href}">${b.title}</a></h3>
        <p class="rh-blog-desc">${b.desc}</p>
        <a class="rh-blog-link" href="${b.href}">Explore More</a>
      </article>`).join('')}
    </div>
    <div class="rh-blog-foot"><a class="rh-blog-all" href="${blogAll[1]}">${blogAll[2].trim()} ${arrow}</a></div>
  </div>
</section>

`;

let page = head + main + tail;
// hero photos: inline styles are blocked by the CSP (style-src 'self'), so they go in their own stylesheet
const bgCss = heroBgs.map((b, i) => `.rh-slide-bg--${i + 1}{background-image:url("${b}")}`).join('\n') + '\n';
page = page.replace('<link rel="stylesheet" href="{{cssUrl}}">', '<link rel="stylesheet" href="{{cssUrl}}">\n<link rel="stylesheet" href="/css/home.css?v=8">\n<link rel="stylesheet" href="/css/home-hero-bg.css?v=1">')
  .replace('<script src="{{jsUrl}}" defer></script>', '<script src="{{jsUrl}}" defer></script>\n<script src="/js/home.js?v=5" defer></script>');
must(page.includes('/css/home.css') && page.includes('/js/home.js'), 'css/js links');

// every bit of our text that the new page keeps must still be there
const txt = h => h.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const out = txt(page);
const keep = [hero.eyebrow, hero.title, hero.sub, hero.desc, hero.formTitle, trtTitle, ...cards.map(c => c.title), about.kicker, about.title, about.copy.slice(0, 300),
  doc.heading, doc.name, doc.cred, doc.bio, pressTitle, testiTitle, ...reviews.flatMap(r => [r.tag, r.text, r.name, r.date]), resTitle, ...results.flatMap(r => [r.title, r.meta]), resDisc, vidTitle, ...vids.map(v => v.title),
  blogTitle, ...blogs.flatMap(b => [b.date, b.title, b.author.replace(/^By\s+/, '')])];
const missing = keep.filter(k => !out.includes(txt(k)));
must(!missing.length, 'content lost: ' + missing.map(m => txt(m).slice(0, 50)).join(' | '));
console.log(`kept ${keep.length} content items; ${cards.length} treatments, ${reviews.length} reviews, ${vids.length} videos, ${results.length} results, ${logos.length} press logos`);
must(!/ style="/.test(main), 'inline style attribute left (blocked by the CSP)');
if (WRITE) {
  fs.writeFileSync(W + '/public/css/home-hero-bg.css', bgCss);
  fs.writeFileSync(W + '/views/index.html', page);
  console.log('WROTE views/index.html + public/css/home-hero-bg.css');
}
