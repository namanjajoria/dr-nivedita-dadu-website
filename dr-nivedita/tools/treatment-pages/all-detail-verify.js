// Fetch every treatment detail page: status, new layout only, footer, forms, images.
const pages = require('D:/DMC website rework/dr-nivedita/local/website/config/pages.all.json');
const BASE = 'http://localhost:3000';
const OLD = ['pg-intro', 'tp-more', 'class="tp tp--', 'tp-band', 'enquiry-section', 'faq-row', 'svc-item', 'pg-card'];
(async () => {
  const list = pages.filter(p => /^\/treatments\/[^/]+\/[^/]+\/$/.test(p.path));
  const assets = new Map(); const bad = [];
  let ok = 0;
  for (const p of list) {
    const r = await fetch(BASE + p.path); const h = await r.text();
    const main = h.slice(h.indexOf('<main'), h.indexOf('</main>'));
    const probs = [];
    if (r.status !== 200) probs.push('HTTP ' + r.status);
    for (const o of OLD) if (main.includes(o)) probs.push('old layout: ' + o);
    if (!/<footer/.test(h)) probs.push('no footer');
    if (!main.includes('class="sd-hero"') || !main.includes('class="sd-intro"')) probs.push('no hero/intro');
    if ((main.match(/<h1[\s>]/g) || []).length !== 1) probs.push('h1 count ' + (main.match(/<h1[\s>]/g) || []).length);
    if ((main.match(/data-form="appointment"/g) || []).length !== 2) probs.push('forms');
    if (/\*\*/.test(main.replace(/<[^>]+>/g, ''))) probs.push('literal **');
    for (const m of main.matchAll(/src="(\/images\/[^"]+)"/g)) { if (!assets.has(m[1])) assets.set(m[1], p.path); }
    if (probs.length) bad.push(p.path + ': ' + probs.join(', ')); else ok++;
  }
  for (const [u, from] of assets) { const r = await fetch(BASE + u, { method: 'HEAD' }); if (r.status !== 200) bad.push(`BROKEN IMAGE ${r.status} ${u} (on ${from})`); }
  console.log(`${ok}/${list.length} pages OK, ${assets.size} unique images checked`);
  console.log(bad.length ? bad.join('\n') : 'no problems');
})();
