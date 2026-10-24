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

// Our own treatment categories (same names and order as the /treatments/ sidebar)
// Categories = the treatment categories in the /treatments/ sidebar (same names, same order), read live
// from views/t-index.html so a new treatment category shows up here too; plus 'Other Treatments' last
// for results that fit none of them.
const OTHER = ['other-treatments', 'Other Treatments'];
const CATS = [...fs.readFileSync(W + '/views/t-index.html', 'utf8').replace(/\s+/g, ' ')
  .matchAll(/<a class="filter-item[^"]*" href="\/treatments\/([^"\/]+)\/"> <span>([^<]+)<\/span>/g)].map(m => [m[1], m[2].trim()]);
must(CATS.length >= 10, 'treatment categories not found in t-index.html: ' + CATS.length);
CATS.push(OTHER);
// An image goes into the category of every treatment page it is shown on (treatment-pages/data/results-map.json);
// images on no treatment page are placed by the treatment / case printed on them (first match wins).
const PAGE_MAP = JSON.parse(fs.readFileSync(path.join(__dirname, '../treatment-pages/data/results-map.json'), 'utf8'));
const RULES = [
  ['stretch-marks', /stretch/],
  ['vitiligo-surgeries', /vitiligo/],
  ['laser-hair-removal', /laser hair|hair reduction|hair removal|beard|hirsutism|facial hair|excessive hair/],
  ['hair-fall', /hair|bald|alopecia|fphl|trich|hgp|root restore|mesogrow/],
  ['premium-services', /dark lips|lip lightening|alma pixel/],
  ['non-surgical-facial-enhancements', /lip filler|\blips\b|nose|nasolabial|\bchin\b|cheek|eyebrow/],
  ['anti-ageing-therapies', /thread|jowl|under ?eye|dark circles|eye ?bags|hollowness|wrinkle|crow|anti[- ]?ag|age ?less|ageing|aging|face lift|expressolift|skin tightening|rejuvenation|collagen|skin booster|insta ?regen|sagg|filler/],
  ['acne-scars', /acne scar|scars|fraxogenus|pixigen|tixel|erbium|mnrf|micro ?needling|subcision|tca cross|derma ?roller|open pores/],
  ['acne-treatment', /acne|pimple|comedone|whitehead|blackhead|\bpih\b/],
  ['pigmentation', /pigment|melasma|freckle|\btan|dull|elbow|underarm|acanthosis|sunspot|magic blend|q[- ]?switch|toning|peel|meso ?glow|photofacial|hydrafacial|oxyboost|instaglam|hydra|glow/],
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
const byCat = Object.fromEntries(CATS.map(([c]) => [c, []]));
const fileCat = {}; const unplaced = [];
const pagesOf = {};
for (const [page, list] of Object.entries(PAGE_MAP)) for (const r of list) (pagesOf[r.file] = pagesOf[r.file] || new Set()).add(page.split('/')[0]);
for (const r of rows) {
  let cats = [...(pagesOf[r.file] || [])];
  if (!cats.length) { const rule = RULES.find(([, re]) => re.test((r.treatment + ' ' + r.caseText).toLowerCase())); if (rule) cats = [rule[0]]; }
  if (!cats.length) { unplaced.push(r); cats = [OTHER[0]]; }
  cats = CATS.map(([c]) => c).filter(c => cats.includes(c));
  for (const c of cats) byCat[c].push({ ...r, title: title(r) });
  fileCat[r.file] = cats;
}
const SHOWN = CATS.filter(([c]) => byCat[c].length);

// before (left half) / after (right half) of a combined 750x400 result image, info strip cropped off
const halves = (r, cls) => `<span class="${cls}-half"><img class="is-before" src="${IMG}${r.file}" alt="${esc(r.title)} - before" loading="lazy" width="750" height="400" decoding="async"><span class="${cls}-half-label">Before</span></span><span class="${cls}-half"><img class="is-after" src="${IMG}${r.file}" alt="${esc(r.title)} - after" loading="lazy" width="750" height="400" decoding="async"><span class="${cls}-half-label ${cls}-half-label-after">After</span></span>`;
const banner = (h1, crumbs) => `<section class="page-banner page-banner--brand">
  <div class="container">
    <h1 class="page-banner-title">${h1}</h1>
    <nav aria-label="Breadcrumb"><ol class="breadcrumb">${crumbs}</ol></nav>
  </div>
</section>`;
// photo viewer like the reference: before and after side by side with their labels, title bar below
// (pages.js fills both images from the clicked card)
const dialog = `<dialog class="video-dialog image-dialog rcd-viewer" aria-label="Photo viewer">
  <button class="video-dialog-close" type="button" aria-label="Close photo">✕</button>
  <button class="image-dialog-nav image-dialog-prev" type="button" aria-label="Previous photo"><svg class="ico"><use href="#i-chev-l"/></svg></button>
  <button class="image-dialog-nav image-dialog-next" type="button" aria-label="Next photo"><svg class="ico"><use href="#i-chev-r"/></svg></button>
  <div class="rcd-viewer-pair">${['before', 'after'].map(k => `<span class="rcd-viewer-half"><img class="is-${k}" src="data:," alt=""><span class="rcd-viewer-label rcd-viewer-label-${k}">${k}</span></span>`).join('')}</div>
  <p class="video-dialog-title rcd-viewer-title"></p>
</dialog>`;
const arrow = '<span class="res-card-cta-arrow"><svg class="ico"><use href="#i-arrow"/></svg></span>';

const overview = `{{> inner-page-start}}

${banner('Real Results', '<li><a href="/">Home</a></li><li><span aria-current="page">Real Results</span></li>')}
<section class="res-grid-section">
  <span class="res-glow" aria-hidden="true"></span>
  <div class="res-shell">
    <div class="res-grid">${SHOWN.map(([slug, name]) => {
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
        <a class="rcd-card-media" href="${IMG}${r.file}" data-lightbox data-caption="${esc(r.title)}">${halves(r, 'rcd')}</a>
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
must(Object.keys(fileCat).length === rows.length, 'every image must be in a category');
console.log('images placed', Object.keys(fileCat).length, 'of', rows.length, '| in Other Treatments', unplaced.length + ':', [...new Set(unplaced.map(r => title(r)))].join(' / '));

if (WRITE) {
  fs.writeFileSync(W + '/views/gallery-results.html', overview);
  for (const f of fs.readdirSync(W + '/views').filter(f => /^results-.*.html$/.test(f))) fs.unlinkSync(W + '/views/' + f);
  for (const [slug, name] of SHOWN) fs.writeFileSync(`${W}/views/results-${slug}.html`, catPage(slug, name));
  const cf = W + '/config/pages.gallery.json';
  const list = JSON.parse(fs.readFileSync(cf, 'utf8')).filter(e => !/^\/results\/[^/]+\/$/.test(e.path));
  const at = list.findIndex(e => e.path === '/results/') + 1;
  list.splice(at, 0, ...SHOWN.map(([slug, name]) => ({
    path: `/results/${slug}/`, view: `results-${slug}`,
    title: `${name} Before and After Results | Dr. Nivedita Dadu's Dermatology Clinic`,
    description: `Real before and after results of ${name.toLowerCase()} treatments at Dr. Nivedita Dadu's Dermatology Clinic, Vasant Vihar and Rajouri Garden, Delhi.`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Results', path: '/results/' }, { name, path: `/results/${slug}/` }],
  })));
  fs.writeFileSync(cf, JSON.stringify(list, null, 2) + '\n');
  fs.writeFileSync(path.join(__dirname, 'data/results-categories.json'), JSON.stringify(fileCat, null, 1));
  console.log('WROTE overview + ' + SHOWN.length + ' category pages');
}
