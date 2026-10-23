// Put the rating row (Google rating + reviews -> Maps, session time when known) under the intro
// title of every treatment page. Re-runnable; run after bridal-build.js / clone-template.js.
// Usage: node apply-meta.js [--write]
const fs = require('fs');
const WRITE = process.argv.includes('--write');
const W = 'D:/DMC website rework/dr-nivedita/local/website';
const { renderMeta } = require('./sd-render.js');
const pages = require(W + '/config/pages.all.json').filter(p => /^\/treatments\/[^/]+\/[^/]+\/$/.test(p.path));
const durations = JSON.parse(fs.readFileSync(__dirname + '/data/durations.json', 'utf8'));
let timed = 0;
for (const p of pages) {
  const key = p.path.replace(/^\/treatments\/|\/$/g, '');
  const file = `${W}/views/${p.view}.html`;
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(/\n\s*<div class="sd-meta">[\s\S]*?<\/div>(?=\n)/, '');                 // drop an old row
  const m = s.match(/(<h2 class="sd-intro-title">[\s\S]*?<\/h2>)\n/);
  if (!m) throw new Error(p.view + ': no intro title');
  const time = durations[key] || null; if (time) timed++;
  s = s.replace(m[0], `${m[1]}\n      ${renderMeta(time)}\n`);
  if (WRITE) fs.writeFileSync(file, s);
}
console.log(`${pages.length} pages get the rating row, ${timed} with session time`);
