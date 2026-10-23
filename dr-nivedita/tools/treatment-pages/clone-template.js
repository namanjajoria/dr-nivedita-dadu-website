// Make every treatment page an exact copy of the template page (Beard Shaping): same sections,
// same text, same images. Only the page's own name (hero + intro heading + image alt text) and its
// breadcrumb differ, so each page is ready for its own Word file and images later.
// Usage: node clone-template.js <backup-dir> [--write]
const fs = require('fs'), path = require('path');
const BK = process.argv[2], WRITE = process.argv.includes('--write');
const W = 'D:/DMC website rework/dr-nivedita/local/website';
const V = W + '/views';
const pages = require(W + '/config/pages.all.json');
const TEMPLATE = { view: 't-bridal-dermatology-beard-shaping', name: 'Beard Shaping', subtitle: 'Laser Beard Shaping', crumb: '<li><a href="/treatments/bridal-dermatology/">Bridal Dermatology</a></li>' };
const must = (c, m) => { if (!c) throw new Error(m); };
const esc = s => s.replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const tpl = fs.readFileSync(`${V}/${TEMPLATE.view}.html`, 'utf8');
const T = {
  h1: `<h1 class="sd-hero-title">${TEMPLATE.name}</h1>`,
  crumb: `${TEMPLATE.crumb}<li><span aria-current="page">${TEMPLATE.name}</span></li>`,
  sub: `<h2 class="sd-intro-title">${TEMPLATE.subtitle}</h2>`,
};
for (const [k, v] of Object.entries(T)) must(tpl.split(v).length === 2, `template marker ${k} not found exactly once`);
const altRe = new RegExp(`alt="${TEMPLATE.name}( process and techniques)?"`, 'g');
const altCount = (tpl.match(altRe) || []).length;
must(altCount >= 6, 'template alt markers missing');

const list = pages.filter(p => /^\/treatments\/[^/]+\/[^/]+\/$/.test(p.path) && !p.path.startsWith('/treatments/bridal-dermatology/'));
const out = [];
for (const p of list) {
  const file = `${V}/${p.view}.html`;
  const cur = fs.readFileSync(file, 'utf8');
  const name = (cur.match(/<h1 class="sd-hero-title">([\s\S]*?)<\/h1>/) || cur.match(/<h1 class="pg-title">([\s\S]*?)<\/h1>/) || [])[1];
  must(name, p.view + ': page name not found');
  const cat = p.breadcrumbs && p.breadcrumbs[1];
  must(cat, p.view + ': no category breadcrumb');
  let s = tpl
    .replace(T.h1, `<h1 class="sd-hero-title">${name}</h1>`)
    .replace(T.crumb, `<li><a href="${cat.path}">${esc(cat.name)}</a></li><li><span aria-current="page">${name}</span></li>`)
    .replace(T.sub, `<h2 class="sd-intro-title">${name}</h2>`)
    .replace(altRe, (m, extra) => `alt="${name.replace(/"/g, '&quot;')}${extra || ''}"`);
  // proof: putting the template's name back gives the template byte for byte
  const back = s.replace(`<h1 class="sd-hero-title">${name}</h1>`, T.h1)
    .replace(`<li><a href="${cat.path}">${esc(cat.name)}</a></li><li><span aria-current="page">${name}</span></li>`, T.crumb)
    .replace(`<h2 class="sd-intro-title">${name}</h2>`, T.sub)
    .split(`alt="${name.replace(/"/g, '&quot;')}`).join(`alt="${TEMPLATE.name}`);
  must(back === tpl, p.view + ': differs from the template beyond name/breadcrumb');
  out.push([file, s]);
}
console.log(`${out.length} pages match the template (only name + breadcrumb differ)`);
if (WRITE) {
  fs.mkdirSync(BK, { recursive: true });
  for (const [f, s] of out) { const b = path.join(BK, path.basename(f)); if (!fs.existsSync(b)) fs.copyFileSync(f, b); fs.writeFileSync(f, s); }
  console.log('WROTE', out.length);
}
