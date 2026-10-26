// Put each page's Before & After results (data/results-map.json) into its sd-results section.
// Pages with no mapped results keep the heading-only section. Re-runnable; run it after
// bridal-build.js / clone-template.js. Usage: node apply-results.js [--write]
const fs = require('fs');
const WRITE = process.argv.includes('--write');
const W = 'D:/DMC website rework/dr-nivedita/local/website';
const { renderResults } = require('./sd-render.js');
const pages = require(W + '/config/pages.all.json').filter(p => /^\/treatments\/[^/]+\/[^/]+\/$/.test(p.path));
const map = JSON.parse(fs.readFileSync(__dirname + '/data/results-map.json', 'utf8'));
const esc = s => String(s).replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// category of each image on /results (written by tools/results/build-results.js)
const cats = JSON.parse(fs.readFileSync(__dirname + '/../results/data/results-categories.json', 'utf8'));
const groupOf = file => (cats[file] || [])[0] || null;
const RE = /\n<section class="sd-results">[\s\S]*?<\/section>\n/;
let withResults = 0, cards = 0;
for (const p of pages) {
  const key = p.path.replace(/^\/treatments\/|\/$/g, '');
  const file = `${W}/views/${p.view}.html`;
  const s = fs.readFileSync(file, 'utf8');
  if (!RE.test(s)) throw new Error(p.view + ': no sd-results section');
  const list = (map[key] || []).map(r => {
    const src = '/images/gallery/results/' + r.file;
    if (!fs.existsSync(W + '/public' + src)) throw new Error('missing image ' + src);
    // the page's own category when the image is in it (a Bridal page opens /results/bridal-dermatology/), else its first one
    const own = key.split('/')[0];
    const g = (cats[r.file] || []).includes(own) ? own : groupOf(r.file);
    if (!g) throw new Error('no /results category for ' + r.file);
    // Bridal pages open their category filtered to this page's own cards (pages.js reads ?treatment=)
    const href = '/results/' + g + '/' + (g === own && own === 'bridal-dermatology' ? '?treatment=' + key.split('/')[1] : '');
    return { src, href, title: esc(r.title), label: esc(r.label), alt: r.caseText && r.caseText !== '-' ? r.caseText : r.title };
  });
  if (list.length) { withResults++; cards += list.length; }
  const out = s.replace(RE, renderResults(list));
  if (WRITE && out !== s) fs.writeFileSync(file, out);
}
const unknown = Object.keys(map).filter(k => !pages.some(p => p.path === `/treatments/${k}/`));
if (unknown.length) throw new Error('mapped pages not found: ' + unknown.join(', '));
console.log(`${withResults} pages with results (${cards} cards), ${pages.length - withResults} heading-only`);
