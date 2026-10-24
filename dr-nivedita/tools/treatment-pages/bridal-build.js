// Builds the 5 Bridal Dermatology pages in the reference (dadumedicalcentre.com treatment detail)
// layout, with the exact text from the Word files. Usage: node bridal-build.js <scratch> [--write]
const fs = require('fs'), path = require('path');
const S = process.argv[2];
const WRITE = process.argv.includes('--write');
const SITE = 'D:/DMC website rework/dr-nivedita/local/website';
const V = SITE + '/views';
const CAT = '/treatments/bridal-dermatology/';
const PAGES = [
  { slug: 'beard-shaping', doc: 'Beard Shaping' },
  { slug: 'divagenesis', doc: 'DivaGenesis' },
  { slug: 'laser-facials', doc: 'Laser Facials' },
  { slug: 'lip-pigmentation', doc: 'Lip Pigmentation' },
  { slug: 'power-glow', doc: 'Power Glow' },
];
// The 15 pages added on 24 Oct 2026 (Word files in "D:\Bridal Dermatology"). No image folder yet, so they use
// the treatment's own photos from the old site (public/images/treatments/); swap in real ones later.
// Only these are written by default; pass --all to rewrite the first 5 as well.
const NEW_PAGES = [
  ['acne-check-peel', 'Acne Check Peel', 'acne-check-peel-hero.webp acne-check-peel-treatment-in-delhi.webp acne-check-peel-treatment.jpeg'],
  ['alexandrite-laser-hair-removal', 'Alexandrite Laser Hair Removal', 'alexandrite-laser.jpg'],
  ['carbon-laser-peel', 'Carbon Laser Peel', 'carbon-peel-hero.webp carbon-peel-treatment-in-delhi.webp carbon-laser-facial-modern-clinic.webp carbon-laser-peel.jpeg carbon-laser-peel.jpg'],
  ['dark-circles', 'Dark Circles', 'dark-circles.jpeg'],
  ['dermal-fillers', 'Dermal Fillers', 'filler.jpeg filler.jpg'],
  ['dermaroller-for-acne-scars', 'Dermaroller for Acne Scars', 'dermaroller.jpeg dermaroller.jpg'],
  ['diode-laser-hair-removal', 'Diode Laser Hair Removal', 'diode-laser.jpg'],
  ['dmc-hgp-hair-growth-promoters', 'DMC-HGP® Hair Growth Promoters', 'advanced-hgp.jpg advanced-hgp-2-0.jpg'],
  ['laser-hair-removal', 'Laser Hair Removal', 'laser-hair-removal.jpeg laser-hair-removal-cover.jpg'],
  ['laser-toning', 'Laser Toning', 'laser-toning.jpeg laser-toning.jpg'],
  ['mesotherapy-for-hair-fall', 'Mesotherapy for Hair Fall', 'mesotherapy-for-hairfall.jpeg mesotherapy-for-hairfall.jpg'],
  ['mnrf-microneedling-radiofrequency', 'MNRF (Microneedling Radiofrequency)', 'micro-needling-radiofrequency.jpg mnrf.jpg'],
  ['mnrf-for-stretch-marks', 'MNRF for Stretch Marks', 'mnrf.jpg micro-needling-radiofrequency.jpg'],
  ['photofacial', 'Photofacial', 'photofacials.jpeg photofacials.jpg ipl-therapy-or-photofacial.jpg'],
  ['soprano-ice-laser-hair-reduction', 'Soprano ICE Laser Hair Reduction', 'soprano-ice-laser-hair-reduction.jpg'],
].map(([slug, doc, photos]) => ({ slug, doc, photos: photos.split(' '), isNew: true }));
PAGES.push(...NEW_PAGES);
const ALL = process.argv.includes('--all');
const COST_LEFT = ['laser-facials', 'lip-pigmentation', 'power-glow'];   // cost sections shown left-aligned
// band keeps only the first topic; the second topic + Benefits get their own image-left section
const SPLIT_BAND = ['beard-shaping', 'divagenesis', 'laser-facials', 'lip-pigmentation', 'power-glow'];
const must = (c, m) => { if (!c) throw new Error(m); };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const removedNotes = [];

// ---------- Word blocks -> clean runs ----------
const NOTE = /\s*\([^()]*(?:to be confirmed|before publishing|live page|current page)[^()]*\)/gi;
function cleanRuns(raw, where) {
  let runs = (Array.isArray(raw) ? raw : [raw]).filter(Boolean).map(r => ({ t: r.t, b: !!r.b }));
  const merged = [];
  for (const r of runs) {                       // merge neighbours with the same weight
    const last = merged[merged.length - 1];
    if (last && last.b === r.b) last.t += r.t; else merged.push({ ...r });
  }
  for (const r of merged) {
    r.t = r.t.replace(NOTE, m => { removedNotes.push(`${where}: ${m.trim()}`); return ''; });
  }
  return merged.filter(r => r.t !== '');
}
const plain = runs => runs.map(r => r.t).join('').replace(/\s+/g, ' ').trim();
// Bold with the spaces moved OUTSIDE the <strong> (Word often bolds "Label " with its trailing space).
function html(runs) {
  return runs.map(r => {
    const t = r.t.replace(/\s+/g, ' ');
    if (!r.b) return esc(t);
    const m = t.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return m[2] ? `${m[1]}<strong>${esc(m[2])}</strong>${m[3]}` : t;
  }).join('').replace(/\s+/g, ' ').trim();
}
// "**Label:** rest" -> { label, rest }
function leadBold(runs) {
  if (!runs.length || !runs[0].b) return null;
  return { label: runs[0].t.trim(), rest: runs.slice(1) };
}
const tableHtml = rows => `<div class="sd-table-wrap"><table class="sd-table"><thead><tr>${rows[0].map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const blocksHtml = blocks => {          // p / li / table blocks -> <p>, <ul> and tables, keeping the Word order
  let out = '', open = false;
  for (const b of blocks) {
    if (b.k === 'table') { if (open) { out += '</ul>'; open = false; } out += tableHtml(b.rows); continue; }
    if (b.k === 'li') { if (!open) { out += '<ul>'; open = true; } out += `<li>${html(b.runs)}</li>`; }
    else { if (open) { out += '</ul>'; open = false; } out += `<p>${html(b.runs)}</p>`; }
  }
  return out + (open ? '</ul>' : '');
};

function parseDoc(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const name = path.basename(file, '.json');
  let h1 = null; const sections = []; let cur = null;
  for (const b of raw) {
    if (b.k === 'table') { must(cur, 'table before any section'); cur.blocks.push({ k: 'table', rows: b.rows }); continue; }
    const runs = cleanRuns(b.runs, name);
    if (!runs.length) continue;
    if (b.k === 'h1') { h1 = plain(runs); continue; }
    if (b.k === 'h2') { cur = { title: plain(runs).replace(/^\d+\.\s*/, ''), blocks: [] }; sections.push(cur); continue; }
    must(cur, 'text before first section in ' + name);
    cur.blocks.push({ k: b.k, runs });
  }
  return { h1, sections };
}

// ---------- page model ----------
// closing CTA: a leading question becomes the CTA title ("Button: …" lines are editor notes for the button)
function ctaOf(cta) {
  const ctaText = cta.blocks.map(b => plain(b.runs)).filter(t => !/^Button:/i.test(t)).join(' ');
  const qm = ctaText.match(/^([^.?!]*\?)\s+([\s\S]+)$/);
  return qm ? { title: qm[1], desc: qm[2] } : { title: 'Not sure which treatment is right for YOU?', desc: ctaText };
}
const faqOf = (faqs, doc) => faqs.blocks.map(b => {       // "**Q: question** Ans. answer"
  const lb = leadBold(b.runs); must(lb, doc + ': FAQ without bold question');
  const rest = lb.rest.slice(); rest[0] = { ...rest[0], t: rest[0].t.replace(/^\s*Ans\.?\s*/, '') };
  return { q: lb.label.replace(/^Q:\s*/, ''), a: html(rest) };
});

// Dark Circles is written as a condition page. Approved mapping (24 Oct 2026): Hero -> intro,
// What Are -> band, Causes -> image-left section, Prevention Tips -> Ideal Candidates card,
// Treatments + Why Choose -> Process section, FAQs, Consultation CTA. Sections 9-14 (Before & After,
// YouTube, clinic finder, awards, newsletter, footer) are notes for shared site modules, not page text.
function modelCondition(p, h1, sections) {
  const take = re => { const i = sections.findIndex(s => re.test(s.title)); must(i >= 0, p.doc + ': no section ' + re); return sections.splice(i, 1)[0]; };
  const hero = take(/^Hero$/i), what = take(/^What Are/i), causes = take(/^Causes/i), prevention = take(/^Prevention/i),
    treatments = take(/^Treatments/i), why = take(/^Why Choose/i), faqs = take(/^FAQs$/i), cta = take(/CTA$/i);
  const left = sections.map(s => s.title);
  must(left.every(t => /^(Before & After|YouTube|Find a Clinic|Awards|Newsletter|Footer)/i.test(t)), p.doc + ': unexpected sections ' + left);
  const intro = hero.blocks.filter(b => !/^H1:/i.test(plain(b.runs)));
  return {
    ...p, name: h1, subtitle: h1, intro, info: [what, causes], benefits: null,
    ideal: prevention.blocks, idealTitle: prevention.title,
    processBlocks: treatments.blocks, processTitle: treatments.title, processMore: [why],
    cost: null, faq: faqOf(faqs, p.doc), cta: ctaOf(cta), steps: [], care: [], factors: causes, tech: what,
  };
}

function model(p) {
  const { h1, sections } = parseDoc(`${S}/bridal-json/${p.doc}.json`);
  if (p.slug === 'dark-circles') return modelCondition(p, h1, sections);
  const take = re => { const i = sections.findIndex(s => re.test(s.title)); return i < 0 ? null : sections.splice(i, 1)[0]; };
  const intro = take(/^Hero & Intro$/i), benefits = take(/^Benefits/i), ideal = take(/^Ideal Candidates$/i),
    process = take(/^Process & Techniques$/i), results = take(/^Before & After/i), cost = take(/^Cost /i),
    faqs = take(/^FAQs$/i), cta = take(/CTA$/i);
  must(intro && benefits && ideal && process && faqs && cta, p.doc + ': a required section is missing');
  // the new pages may have a third topic: topic 1 -> band, topics 2 + 3 -> image-left section (approved)
  must(sections.length === 2 || (p.isNew && sections.length === 3), p.doc + ': expected 2 info sections, got ' + sections.map(s => s.title));
  const techIdx = p.isNew ? 0 : sections.findIndex(s => /^(How|What Makes|Why We Pair)/i.test(s.title));
  must(techIdx >= 0, p.doc + ': no "how it works" section');
  const tech = sections[techIdx], factors = sections[1 - techIdx];

  // intro: an all-bold first line is the sub-heading
  let subtitle = h1, ib = intro.blocks;
  if (ib[0].runs.length === 1 && ib[0].runs[0].b) { subtitle = plain(ib[0].runs); ib = ib.slice(1); }

  // benefits: lead-in paragraph(s) + list
  const bDesc = benefits.blocks.filter(b => b.k === 'p'), bList = benefits.blocks.filter(b => b.k === 'li');
  must(p.isNew || bList.length, p.doc + ': benefits list empty');
  must(p.isNew || benefits.blocks.findIndex(b => b.k === 'li') >= bDesc.length, p.doc + ': benefits text after the list');

  // process: intro text, steps, then bold-labelled blocks (sessions, aftercare, ...)
  const pb = process.blocks.filter(b => b.k !== 'table');   // steps/care are only for the report; the page uses processBlocks
  const firstBlock = pb.findIndex(b => b.k === 'p' && leadBold(b.runs));
  const head = firstBlock < 0 ? pb : pb.slice(0, firstBlock);
  const tail = firstBlock < 0 ? [] : pb.slice(firstBlock);
  let pIntro, stepBlocks;
  if (head.some(b => b.k === 'li')) { pIntro = head.filter(b => b.k === 'p'); stepBlocks = head.filter(b => b.k === 'li'); }
  else { pIntro = []; stepBlocks = head; }                  // no list: each paragraph is a step
  const steps = stepBlocks.map(b => {
    const lb = leadBold(b.runs);
    if (!lb) return { title: null, desc: html(b.runs) };
    const rest = lb.rest.slice(); if (rest.length) rest[0] = { ...rest[0], t: rest[0].t.replace(/^\s*[:\-–]\s*/, '') };
    return { title: lb.label.replace(/:\s*$/, ''), desc: html(rest) };
  });
  const care = [];
  for (const b of tail) {
    const lb = b.k === 'p' && leadBold(b.runs);
    if (lb) care.push({ label: lb.label, blocks: lb.rest.length && plain(lb.rest) ? [{ k: 'p', runs: lb.rest }] : [] });
    else care[care.length - 1].blocks.push(b);
  }
  must(p.isNew || care.length >= 2, p.doc + ': expected sessions + aftercare blocks');

  // cost
  let costM = null;
  if (cost) {
    const paras = cost.blocks.filter(b => b.k === 'p');
    const note = paras.filter(b => /^\*/.test(plain(b.runs)));
    costM = { title: cost.title, paras: paras.filter(b => !note.includes(b)), note, table: (cost.blocks.find(b => b.k === 'table') || {}).rows,
      // new pages: text and every table in Word order (some have two tables)
      blocks: cost.blocks.filter(b => !note.includes(b)) };
  }
  const faq = faqOf(faqs, p.doc);
  return {
    ...p, name: h1, subtitle, intro: ib, benefits: { desc: bDesc, list: bList, blocks: benefits.blocks }, ideal: ideal.blocks,
    info: sections.slice(), processBlocks: process.blocks,
    factors, tech, pIntro, steps, care, cost: costM, faq,
    cta: ctaOf(cta),
    resultsPlaceholder: results ? plain(results.blocks[0].runs) : null,
  };
}

// ---------- HTML ----------
const arrowIco = '<span class="sd-arrow"><svg class="ico"><use href="#i-arrow"/></svg></span>';
const consent = '<p class="consent">By clicking on "Submit", you agree to our <a href="https://www.drniveditadadu.com/privacy-policy">Privacy Policy</a>, <a href="https://www.drniveditadadu.com/legal-disclaimer">Disclaimer</a> and <a href="https://www.drniveditadadu.com/terms-conditions">Terms &amp; Conditions</a>.</p>';
function form(wide) {
  const f = (cls, inner) => `<div class="sd-field${cls}">${inner}</div>`;
  const fields = [
    f('', '<input class="sd-input" type="text" name="name" placeholder="Your Name" aria-label="Your Name" required>'),
    f('', '<input class="sd-input" type="tel" name="phone" placeholder="Mobile Number *" aria-label="Mobile Number" required>'),
    f(wide ? ' sd-field--wide' : '', '<select class="sd-input" name="location" aria-label="Preferred Location" required><option value="">Preferred Location *</option><option>Vasant Vihar</option><option>Rajouri Garden</option></select><svg class="ico field-chev"><use href="#i-chev-d"/></svg>'),
  ].join('\n          ');
  return `<form class="sd-form" action="/api/appointment" method="post" data-form="appointment">
        <input type="hidden" name="_ft" value="{{formToken}}">
        <div class="hp-field" aria-hidden="true"><label>Leave this field empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        ${wide ? `<div class="sd-form-grid">\n          ${fields}\n        </div>` : fields}
        <button class="sd-submit" type="submit">Submit ${arrowIco}</button>
        ${consent}
        <p class="form-status" role="status" aria-live="polite" hidden></p>
      </form>`;
}
// band (brand colour): paragraphs and white-dot bullets, Word order kept
const bandBlocks = blocks => {
  let out = '', open = false;
  for (const b of blocks) {
    if (b.k === 'table') { if (open) { out += '</ul>'; open = false; } out += tableHtml(b.rows); continue; }
    if (b.k === 'li') { if (!open) { out += '<ul class="sd-band-list">'; open = true; } out += `<li>${html(b.runs)}</li>`; }
    else { if (open) { out += '</ul>'; open = false; } out += `<p class="sd-band-desc">${html(b.runs)}</p>`; }
  }
  return out + (open ? '</ul>' : '');
};
const img = (im, alt, extra = 'loading="lazy"') => `<img src="${im.src}" alt="${esc(alt)}" ${extra} width="${im.w}" height="${im.h}" decoding="async">`;

function page(m, imgs, more) {
  const gal = imgs.gallery;
  const thumbs = gal.length > 1 ? `
      <div class="sd-thumbs">
        ${gal.map((g, i) => `<button class="sd-thumb${i ? '' : ' is-active'}" type="button" aria-label="Show image ${i + 1}" aria-pressed="${!i}">${img(g, m.name)}</button>`).join('\n        ')}
      </div>` : '';
  const garrows = gal.length > 1 ? `
        <button class="sd-gallery-arrow prev" type="button" aria-label="Previous image"><svg class="ico"><use href="#i-chev-l"/></svg></button>
        <button class="sd-gallery-arrow next" type="button" aria-label="Next image"><svg class="ico"><use href="#i-chev-r"/></svg></button>` : '';
  const stepImg = i => gal[i % gal.length];
  const steps = m.steps.map((s, i) => `
        <article class="sd-step">
          <div class="sd-step-img">${img(stepImg(i), '')}</div>
          ${s.title ? `<h3 class="sd-step-title">${esc(s.title)}</h3>` : `<p class="sd-step-num">STEP ${i + 1}</p>`}
          <p class="sd-step-desc">${s.desc}</p>
        </article>`).join('');
  const cards = [m.care.slice(0, 1), m.care.slice(1)].map(group => `
      <div class="sd-after-card">
        ${group.map(c => `<h3>${esc(c.label)}</h3>\n        ${blocksHtml(c.blocks)}`).join('\n        ')}
      </div>`).join('');
  const cost = m.cost ? `
<section class="sd-cost${COST_LEFT.includes(m.slug) ? ' sd-cost--left' : ''}">
  <div class="sd-cost-inner">
    <h2 class="sd-heading">${esc(m.cost.title)}</h2>
    <div class="sd-cost-text">${blocksHtml(m.cost.paras)}</div>${m.cost.table ? `
    <div class="sd-table-wrap">
      <table class="sd-table">
        <thead><tr>${m.cost.table[0].map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>
          ${m.cost.table.slice(1).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('\n          ')}
        </tbody>
      </table>
    </div>` : ''}${m.cost.note.map(n => `\n    <p class="sd-cost-note">${html(n.runs)}</p>`).join('')}
  </div>
</section>
` : '';
  return `{{> inner-page-start}}

<section class="sd-hero">
  <h1 class="sd-hero-title">${esc(m.name)}</h1>
  <nav class="sd-crumb" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="${CAT}">Bridal Dermatology</a></li><li><span aria-current="page">${esc(m.name)}</span></li></ol></nav>
</section>

<section class="sd-intro">
  <div class="sd-intro-wrap">
    <div class="sd-gallery" data-sd-gallery>
      <div class="sd-gallery-frame">
        <div class="sd-gallery-main">${img(gal[0], m.name, 'fetchpriority="high"')}</div>${garrows}
      </div>${thumbs}
    </div>
    <div class="sd-intro-body">
      <h2 class="sd-intro-title">${esc(m.subtitle)}</h2>
      <div class="sd-intro-text">${blocksHtml(m.intro)}</div>
      <div class="sd-consult">
        <h2 class="sd-consult-title">Book a Consultation</h2>
      ${form(true)}
      </div>
    </div>
  </div>
</section>

${SPLIT_BAND.includes(m.slug) ? `<section class="sd-band">
  <div class="sd-band-inner">
    <div class="sd-band-text">
      <h2 class="sd-band-title">${esc(m.info[0].title)}</h2>
      ${bandBlocks(m.info[0].blocks)}
    </div>
    <div class="sd-band-img">${img(imgs.band, m.info[0].title)}</div>
  </div>
</section>

<section class="sd-tech sd-tech--split">
  <div class="sd-tech-wrap">
    <div class="sd-tech-img">${img(imgs.split || imgs.gallery[1] || imgs.gallery[0], m.name + ' areas and benefits')}</div>
    <div>${m.info.slice(1).map(sec => `
      <h2 class="sd-heading">${esc(sec.title)}</h2>
      <div class="sd-tech-text">${blocksHtml(sec.blocks)}</div>`).join('')}
      <h2 class="sd-heading">Benefits</h2>
      <div class="sd-tech-text">${blocksHtml([...m.benefits.desc, ...m.benefits.list])}</div>
    </div>
  </div>
</section>
` : `<section class="sd-band">
  <div class="sd-band-inner">
    <div class="sd-band-text">${m.info.map(sec => `
      <h2 class="sd-band-title">${esc(sec.title)}</h2>
      ${bandBlocks(sec.blocks)}`).join('')}
      <h2 class="sd-band-title">Benefits</h2>
      ${m.benefits.desc.map(b => `<p class="sd-band-desc">${html(b.runs)}</p>`).join('\n      ')}
      <ul class="sd-band-list">
        ${m.benefits.list.map(b => `<li>${html(b.runs)}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="sd-band-img">${img(imgs.band, m.name + ' benefits')}</div>
  </div>
</section>
`}
<section class="sd-ideal">
  <div class="sd-ideal-wrap">
    <div class="sd-ideal-left">
      <div class="sd-card">
        <h3 class="sd-card-title">Ideal Candidates</h3>
        ${blocksHtml(m.ideal)}
      </div>
    </div>
    <div class="sd-ideal-right">
      <h3 class="sd-cta-title">${esc(m.cta.title)}</h3>
      <img class="sd-cta-img" src="/images/treatments/ideal-freq.png" alt="" loading="lazy" width="384" height="256" decoding="async">
      <p class="sd-cta-desc">${esc(m.cta.desc)}</p>
      <a class="sd-cta-btn" href="#enquiry">Book a Consultation ${arrowIco}</a>
    </div>
  </div>
</section>

<section class="sd-tech">
  <div class="sd-tech-wrap">
    <div class="sd-tech-img">${img(imgs.tech, m.name + ' process and techniques')}</div>
    <div>
      <h2 class="sd-heading">Process &amp; Techniques</h2>
      <div class="sd-tech-text">${blocksHtml(m.processBlocks)}</div>
    </div>
  </div>
</section>
${cost}
<section class="sd-fe" id="contact">
  <div class="sd-fe-wrap">
    <div class="sd-fe-left" id="faqs">
      <h2 class="sd-fe-title">FAQs</h2>
      <div class="sd-faq">
        ${m.faq.map((f, i) => `<details${i ? '' : ' open'}><summary><h3>${esc(f.q)}</h3></summary><div class="sd-faq-a"><p>${f.a}</p></div></details>`).join('\n        ')}
      </div>
    </div>
    <div class="sd-fe-right">
      <div class="sd-enquiry" id="enquiry">
        <h3 class="sd-enquiry-title">Enquire About This Treatment</h3>
        <p class="sd-enquiry-desc">Schedule your visit for this specialized treatment.</p>
      ${form(false)}
      </div>
    </div>
  </div>
</section>

{{> inner-page-end}}
`;
}

// ---------- images + "More in this range" from the current placeholder pages ----------
function currentAssets(file) {
  const s = fs.readFileSync(file, 'utf8');
  const tagOf = cls => [...s.matchAll(new RegExp(`<div class="${cls}"><img ([^>]*)>`, 'g'))].map(m => {
    const a = m[1], g = k => (a.match(new RegExp(`${k}="([^"]*)"`)) || [])[1];
    return { src: g('src'), w: g('width'), h: g('height') };
  });
  let hero = tagOf('pg-intro-media'), sec = tagOf('tp-media-img');
  if (!hero.length) {   // already rebuilt: read the gallery back
    const g = [...s.matchAll(/<button class="sd-thumb[^>]*><img ([^>]*)>/g)].map(m => m[1]);
    const one = [...s.matchAll(/<div class="sd-gallery-main"><img ([^>]*)>/g)].map(m => m[1]);
    const list = (g.length ? g : one).map(a => ({ src: a.match(/src="([^"]*)"/)[1], w: a.match(/width="(\d+)"/)[1], h: a.match(/height="(\d+)"/)[1] }));
    hero = list.slice(0, 1); sec = list.slice(1);
  }
  must(hero.length, file + ': no hero image found');
  const mm = s.match(/<section class="tp tp--[a-z]+ tp-more">/);
  const a = mm ? mm.index : 0, b = mm ? s.indexOf('</section>', a) + 10 : 0;
  const gallery = [hero[0], ...sec].filter((x, i, arr) => arr.findIndex(y => y.src === x.src) === i);
  return { imgs: { gallery, band: sec[0] || hero[0], tech: sec[1] || hero[0] }, more: s.slice(a, b).replace(/^<section class="tp tp--[a-z]+ tp-more">/, '<section class="tp tp--tint tp-more">') };
}

// ---------- Word model -> shared layout (sd-render.js) ----------
const { renderPage } = require('./sd-render.js');
function normalize(m, imgs) {
  return {
    name: esc(m.name), crumb: { name: 'Bridal Dermatology', path: CAT }, subtitle: esc(m.subtitle),
    introHtml: blocksHtml(m.intro),
    band: { title: esc(m.info[0].title), html: bandBlocks(m.info[0].blocks) },
    split: [...m.info.slice(1).map(sec => ({ title: esc(sec.title), html: blocksHtml(sec.blocks) })),
      ...(m.benefits ? [{ title: 'Benefits', html: blocksHtml(m.isNew ? m.benefits.blocks : [...m.benefits.desc, ...m.benefits.list]) }] : [])],
    ideal: blocksHtml(m.ideal), cta: { title: esc(m.cta.title), desc: esc(m.cta.desc) },
    idealTitle: m.idealTitle ? esc(m.idealTitle) : undefined,
    process: blocksHtml(m.processBlocks), processTitle: m.processTitle ? esc(m.processTitle) : undefined,
    processMore: (m.processMore || []).map(sec => ({ title: esc(sec.title), html: blocksHtml(sec.blocks) })),
    cost: m.cost && m.isNew ? { title: esc(m.cost.title), html: blocksHtml(m.cost.blocks), table: null, notes: m.cost.note.map(n => html(n.runs)), left: false }
      : m.cost ? { title: esc(m.cost.title), html: blocksHtml(m.cost.paras), table: m.cost.table ? m.cost.table.map(r => r.map(esc)) : null,
      notes: m.cost.note.map(n => html(n.runs)), left: COST_LEFT.includes(m.slug) } : null,
    faq: m.faq.map(f => ({ q: esc(f.q), a: f.a })),
    imgs,
  };
}

// photos from public/images/treatments -> gallery (all), band / image-left / process images (cycled)
function imgSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) === 'RIFF') {
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (t === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
    if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length;) {
      if (b[i] !== 0xff) { i++; continue; }
      const mk = b[i + 1], len = b.readUInt16BE(i + 2);
      if (mk >= 0xc0 && mk <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(mk)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  throw new Error('unknown image size: ' + file);
}
function photoSet(names) {
  const seen = new Set();
  const gallery = names.map(n => {
    const f = `${SITE}/public/images/treatments/${n}`;
    must(fs.existsSync(f), 'missing photo ' + f);
    const sum = require('crypto').createHash('sha1').update(fs.readFileSync(f)).digest('hex');
    if (seen.has(sum)) return null; seen.add(sum);              // .jpg and .jpeg copies of the same photo
    const { w, h } = imgSize(f);
    return { src: '/images/treatments/' + n, w: String(w), h: String(h) };
  }).filter(Boolean);
  const at = i => gallery[i % gallery.length];
  return { gallery, band: at(1), split: at(2), tech: at(3) };
}

// ---------- run ----------
const toWrite = new Set();
const out = {};
const report = [];
for (const p of PAGES) {
  const file = `${V}/t-bridal-dermatology-${p.slug}.html`;
  const m = model(p);
  let imgs;
  if (p.isNew) imgs = photoSet(p.photos);
  else {
    imgs = currentAssets(file).imgs;
    const manifestFile = `${S}/bridal-images.json`;     // real images from "D:\Nivedita Dadu Website Images\Bridal Dermatology"
    if (fs.existsSync(manifestFile)) { const mf = JSON.parse(fs.readFileSync(manifestFile, 'utf8')); if (mf[p.slug]) imgs = mf[p.slug]; }
  }
  if (p.isNew || ALL) toWrite.add(file);
  const html_ = renderPage(normalize(m, imgs));
  must(!/\*\*/.test(html_), p.slug + ': literal ** left in output');
  out[file] = html_;
  const firstIntro = plain(m.intro[0].runs);
  report.push({ slug: p.slug, name: m.name, subtitle: m.subtitle, steps: m.steps.length, stepTitles: m.steps.map(s => s.title || '(STEP n)').join(' | '),
    care: m.care.map(c => c.label).join(' | '), factors: m.factors.title, tech: m.tech.title, cost: m.cost ? m.cost.title + (m.cost.table ? ' +table' : '') : '-',
    faqs: m.faq.length, cta: m.cta.title, gallery: imgs.gallery.length, intro: firstIntro, cover: imgs.gallery[0] });
}
console.log(JSON.stringify(report, null, 1));
console.log('NOTES REMOVED:\n' + removedNotes.join('\n'));
if (WRITE) {
  const BK = S + '/backup-bridal-layout';
  fs.mkdirSync(BK, { recursive: true });
  for (const [f, s] of Object.entries(out)) {
    if (!toWrite.has(f)) continue;
    if (fs.existsSync(f) && !fs.existsSync(BK + '/' + path.basename(f))) fs.copyFileSync(f, BK + '/' + path.basename(f));
    fs.writeFileSync(f, s);
  }
  fs.writeFileSync(S + '/bridal-intros.json', JSON.stringify(report.map(r => ({ slug: r.slug, intro: r.intro })), null, 1));
  fs.writeFileSync(S + '/bridal-pages.json', JSON.stringify(report.map(r => ({ slug: r.slug, doc: PAGES.find(p => p.slug === r.slug).doc, name: r.name, intro: r.intro, cover: r.cover })), null, 1));
  console.log('WROTE', toWrite.size, 'pages');
}
