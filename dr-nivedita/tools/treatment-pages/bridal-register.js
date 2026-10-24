// Registers the Bridal Dermatology pages built by bridal-build.js that are not on the site yet:
// route + sitemap entry (config/pages.all.json), a service card on the category page and on /treatments/,
// and the session time (data/durations.json, copied from the same treatment in its other category).
// Re-runnable: pages/cards already there are left alone. Then run card-meta.js, apply-meta.js, apply-results.js.
// Usage: node bridal-register.js data [--write]
const fs = require('fs');
const S = process.argv[2], WRITE = process.argv.includes('--write');
const W = 'D:/DMC website rework/dr-nivedita/local/website';
const CAT = '/treatments/bridal-dermatology/';
const must = (c, m) => { if (!c) throw new Error(m); };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cut = t => { if (t.length <= 155) return t; const c = t.slice(0, 155); return c.slice(0, c.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '') + '…'; };
const SAME_AS = {
  'acne-check-peel': 'acne-treatment/acne-check-peel-treatment', 'alexandrite-laser-hair-removal': 'laser-hair-removal/alexandrite-laser',
  'carbon-laser-peel': 'acne-treatment/carbon-laser-peel', 'dermal-fillers': 'anti-ageing-therapies/filler',
  'dermaroller-for-acne-scars': 'acne-scars/dermaroller', 'diode-laser-hair-removal': 'laser-hair-removal/diode-laser',
  'dmc-hgp-hair-growth-promoters': 'hair-fall/advanced-hgp', 'laser-toning': 'pigmentation/laser-toning',
  'mesotherapy-for-hair-fall': 'hair-fall/mesotherapy-for-hairfall', 'mnrf-microneedling-radiofrequency': 'acne-scars/micro-needling-radiofrequency',
  'mnrf-for-stretch-marks': 'stretch-marks/mnrf', 'photofacial': 'premium-services/photofacials',
  'soprano-ice-laser-hair-reduction': 'laser-hair-removal/soprano-ice-laser-hair-reduction',
};

const pages = JSON.parse(fs.readFileSync(S + '/bridal-pages.json', 'utf8'));
const cfgFile = W + '/config/pages.all.json';
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const fresh = pages.filter(p => !cfg.some(e => e.path === `${CAT}${p.slug}/`));
for (const p of fresh) must(fs.existsSync(`${W}/views/t-bridal-dermatology-${p.slug}.html`), p.slug + ': page not built');

// 1. routes + sitemap, after the last Bridal Dermatology page
let at = cfg.map(e => e.path.startsWith(CAT)).lastIndexOf(true) + 1;
for (const p of fresh) cfg.splice(at++, 0, {
  path: `${CAT}${p.slug}/`, view: `t-bridal-dermatology-${p.slug}`,
  title: `${p.name} Treatment in Delhi | Bridal Dermatology Clinic`,
  description: `${p.name} by Dr. Nivedita Dadu in Rajouri Garden (West Delhi) and Vasant Vihar (South Delhi) — expert pre-bridal skin care for a flawless wedding glow.`,
  breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Bridal Dermatology', path: CAT }, { name: p.name, path: `${CAT}${p.slug}/` }],
});

// 2. service cards: same markup as the existing bridal cards, after the last one
const card = p => `
        <article class="lst-card">
          <div class="lst-card-body">
            <h3 class="lst-card-title">${esc(p.name)}</h3>
            <p class="lst-card-text">${esc(cut(p.intro))}</p>
            <a class="lst-card-cta" href="${CAT}${p.slug}/">View Details</a>
          </div>
          <div class="lst-card-media"><img src="${p.cover.src}" alt="${esc(p.name)}" loading="lazy" width="${p.cover.w}" height="${p.cover.h}" decoding="async"></div>
        </article>`;
const views = {};
for (const f of ['t-bridal-dermatology.html', 't-index.html']) {
  let s = fs.readFileSync(`${W}/views/${f}`, 'utf8');
  const todo = pages.filter(p => !s.includes(`class="lst-card-cta" href="${CAT}${p.slug}/"`));
  const last = [...s.matchAll(/<article class="lst-card[^"]*">[\s\S]*?<\/article>/g)].filter(m => m[0].includes(`href="${CAT}`)).pop();
  must(last, f + ': no bridal card found');
  const end = last.index + last[0].length;
  s = s.slice(0, end) + todo.map(card).join('') + s.slice(end);
  views[f] = s;
  console.log(`${f}: +${todo.length} cards`);
}

// 3. session times
const durFile = __dirname + '/data/durations.json';
const dur = JSON.parse(fs.readFileSync(durFile, 'utf8'));
const timed = [];
for (const [slug, other] of Object.entries(SAME_AS)) if (dur[other] && !dur['bridal-dermatology/' + slug]) { dur['bridal-dermatology/' + slug] = dur[other]; timed.push(`${slug} ${dur[other]}`); }

console.log(`routes +${fresh.length}: ${fresh.map(p => p.slug).join(', ')}`);
console.log(`session times +${timed.length}: ${timed.join(' | ')}`);
if (WRITE) {
  fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + '\n');
  for (const [f, s] of Object.entries(views)) fs.writeFileSync(`${W}/views/${f}`, s);
  fs.writeFileSync(durFile, JSON.stringify(Object.fromEntries(Object.entries(dur).sort()), null, 1) + '\n');
  console.log('WROTE');
}
