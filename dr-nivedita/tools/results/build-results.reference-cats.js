// /results overview + one page per category, in the dadumedicalcentre.com/results layout.
// The 338 result images are sorted into the reference's 9 categories using the treatment / case
// printed on each image (tools/treatment-pages/data/results-read.txt).
// Writes data/results-categories.json (image -> category), used by the treatment pages and homepage.
// Usage: node build-results.js [--write]
const fs = require('fs'), path = require('path');
const WRITE = process.argv.includes('--write');
const W = 'D:/DMC website rework/dr-nivedita/local/website';
const IMG = '/images/gallery/results/';
const must = (c, m) => { if (!c) throw new Error(m); };
const esc = s => String(s).replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CATS = [
  ['acne-pimple', 'Acne/Pimple'], ['acne-scars', 'Acne Scars'], ['pigmentation', 'Pigmentation'],
  ['hairfall', 'Hairfall/Hair Loss'], ['unwanted-hair', 'Unwanted Hair'], ['anti-aging', 'Anti-Aging'],
  ['non-surgical-facial-enhancement', 'Non-Surgical Facial Enhancement'], ['dark-lips', 'Dark Lips'], ['skin-conditions', 'Skin Conditions'],
];
// first match wins
const RULES = [
  ['skin-conditions', /psoriasis|vitiligo|wart|\bmole\b|skin tag|allergy|dermatitis|impetigo|burn|scald|tattoo|tinea|hypertrophic|stretch|keloid|cautery|sweat/],
  ['dark-lips', /dark lips|lip lightening|alma pixel/],
  ['unwanted-hair', /laser hair|hair reduction|hair removal|beard|hirsutism|facial hair|excessive hair/],
  ['hairfall', /hair|bald|alopecia|fphl|trich|hgp|root restore|mesogrow/],
  ['non-surgical-facial-enhancement', /lip filler|\blips\b|nose|nasolabial|\bchin\b|cheek|jowl|thread|eyebrow/],
  ['anti-aging', /under ?eye|dark circles|eye ?bags|hollowness|wrinkle|crow|anti[- ]?ag|age ?less|ageing|aging|face lift|expressolift|skin tightening|rejuvenation|collagen induction|skin booster|insta ?regen|sagg|filler/],
  ['acne-scars', /scar|fraxogenus|pixigen|tixel|erbium|mnrf|micro ?needling|subcision|tca cross|derma ?roller|open pores/],
  ['acne-pimple', /acne|pimple|comedone|whitehead|blackhead|\bpih\b/],
  ['pigmentation', /./],
];

const files = fs.readdirSync(W + '/public' + IMG).filter(f => f.endsWith('.webp')).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
const rows = fs.readFileSync(path.join(__dirname, '../treatment-pages/data/results-read.txt'), 'utf8').split('\n').filter(l => /^\d+ \|/.test(l))
  .map(l => { const [i, t, c] = l.split(' | ').map(s => s.trim()); return { i: +i, file: files[+i], treatment: t, caseText: c }; });
must(rows.length === files.length && rows.length === 338, `read ${rows.length} rows for ${files.length} images`);

// keep the order the images had on the old /results page
const orig = fs.readFileSync(path.join(__dirname, 'data/gallery-results.orig.html'), 'utf8');
const order = [...orig.matchAll(/href="\/images\/gallery\/results\/([^"]+)" data-lightbox/g)].map(m => m[1]);
must(order.length === 338, 'old /results order: ' + order.length);
rows.sort((a, b) => order.indexOf(a.file) - order.indexOf(b.file));

const title = r => {
  const t = r.treatment !== '-' ? r.treatment : r.caseText;
  return t.replace(/^DMC\s*-\s*/i, 'DMC-').replace(/\s+/g, ' ').trim();
};
const byCat = Object.fromEntries(CATS.map(([s]) => [s, []]));
const fileCat = {};
for (const r of rows) {
  const text = `${r.treatment} ${r.caseText}`.toLowerCase();
  const cat = RULES.find(([, re]) => re.test(text))[0];
  byCat[cat].push({ ...r, title: title(r) });
  fileCat[r.file] = cat;
}

// before (left half) / after (right half) of a combined 750x400 result image, info strip cropped off
const halves = (r, cls) => `<span class="${cls}-half"><img class="is-before" src="${IMG}${r.file}" alt="${esc(r.title)} - before" loading="lazy" width="750" height="400" decoding="async"><span class="${cls}-half-label">Before</span></span><span class="${cls}-half"><img class="is-after" src="${IMG}${r.file}" alt="${esc(r.title)} - after" loading="lazy" width="750" height="400" decoding="async"><span class="${cls}-half-label ${cls}-half-label-after">After</span></span>`;
const banner = (h1, crumbs) => `<section class="page-banner page-banner--brand">
  <div class="container">
    <h1 class="page-banner-title">${h1}</h1>
    <nav aria-label="Breadcrumb"><ol class="breadcrumb">${crumbs}</ol></nav>
  </div>
</section>`;
const dialog = orig.slice(orig.indexOf('<dialog class="video-dialog image-dialog"'), orig.indexOf('</dialog>') + 9);
must(dialog.startsWith('<dialog'), 'photo viewer markup');
const arrow = '<span class="res-card-cta-arrow"><svg class="ico"><use href="#i-arrow"/></svg></span>';

const overview = `{{> inner-page-start}}

${banner('Real Results', '<li><a href="/">Home</a></li><li><span aria-current="page">Real Results</span></li>')}
<section class="res-grid-section">
  <span class="res-glow" aria-hidden="true"></span>
  <div class="res-shell">
    <div class="res-grid">${CATS.map(([slug, name]) => {
      const r = byCat[slug][0];
      return `
      <a class="res-card" href="/results/${slug}/">
        <div class="res-card-info"><h3>${esc(name)}</h3></div>
        <div class="res-card-media res-card-pair">${halves(r, 'res')}</div>
        <span class="res-card-cta"><span>View Results</span>${arrow}</span>
      </a>`;
    }).join('')}
    </div>
  </div>
</section>

{{> contact-section}}

{{> inner-page-end}}
`;

const catPage = (slug, name) => `{{> inner-page-start}}

${banner(esc(name), `<li><a href="/">Home</a></li><li><a href="/results/">Real Results</a></li><li><span aria-current="page">${esc(name)}</span></li>`)}
<section class="rcd-grid-section">
  <div class="rcd-shell">
    <div class="rcd-grid" data-rcd-grid data-lightbox-group>${byCat[slug].map(r => `
      <article class="rcd-card">
        <a class="rcd-card-media" href="${IMG}${r.file}" data-lightbox data-caption="${esc(r.title)} · Results may vary person to person.">${halves(r, 'rcd')}</a>
        <h3 class="rcd-card-title">${esc(r.title)}</h3>
      </article>`).join('')}
    </div>
    <nav class="rcd-pagination" aria-label="Results pages" hidden></nav>
    <p class="rcd-note">* Results may vary from person to person.</p>
    <div class="rcd-back-row"><a class="rcd-back-link" href="/results/">&larr; Back to all results</a></div>
  </div>
</section>
${dialog}

{{> contact-section}}

{{> inner-page-end}}
`;

for (const [slug, name] of CATS) console.log(`${name.padEnd(34)} ${String(byCat[slug].length).padStart(3)}  e.g. ${[...new Set(byCat[slug].map(r => r.title))].slice(0, 4).join(' / ')}`);
console.log('total', Object.values(byCat).reduce((n, l) => n + l.length, 0));

if (WRITE) {
  fs.writeFileSync(W + '/views/gallery-results.html', overview);
  for (const [slug, name] of CATS) fs.writeFileSync(`${W}/views/results-${slug}.html`, catPage(slug, name));
  const cf = W + '/config/pages.gallery.json';
  const list = JSON.parse(fs.readFileSync(cf, 'utf8')).filter(e => !/^\/results\/[^/]+\/$/.test(e.path));
  const at = list.findIndex(e => e.path === '/results/') + 1;
  list.splice(at, 0, ...CATS.map(([slug, name]) => ({
    path: `/results/${slug}/`, view: `results-${slug}`,
    title: `${name} Before and After Results | Dr. Nivedita Dadu's Dermatology Clinic`,
    description: `Real before and after results of ${name.toLowerCase()} treatments at Dr. Nivedita Dadu's Dermatology Clinic, Vasant Vihar and Rajouri Garden, Delhi.`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Results', path: '/results/' }, { name, path: `/results/${slug}/` }],
  })));
  fs.writeFileSync(cf, JSON.stringify(list, null, 2) + '\n');
  fs.writeFileSync(path.join(__dirname, 'data/results-categories.json'), JSON.stringify(fileCat, null, 1));
  console.log('WROTE overview + 9 category pages');
}
