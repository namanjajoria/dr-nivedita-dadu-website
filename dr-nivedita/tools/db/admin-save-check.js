// "What if every post were saved in the admin?" Takes the editor HTML captured by
// admin-editor-check.js (exactly what the admin would save), runs it through the website's
// bodyHtml(), and compares with the site's rendering of the database copy: visible text,
// list structure (nesting and numbering), links (href + new-tab), tables and images.
//   node tools/db/admin-save-check.js <seed.json> <editorDir>
const fs = require('fs');
const path = require('path');
const { bodyHtml } = require('../../local/website/content/blog.js');

const [SEED, DIR] = process.argv.slice(2);
const NAMED = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', acirc: 'â', Acirc: 'Â', bull: '•', middot: '·', deg: '°', reg: '®', trade: '™', copy: '©', times: '×', rarr: '→', larr: '←', frac12: '½', eacute: 'é', ccedil: 'ç', aacute: 'á', ntilde: 'ñ', uuml: 'ü', ouml: 'ö', auml: 'ä', laquo: '«', raquo: '»', sup2: '²', micro: 'µ', plusmn: '±', le: '≤', ge: '≥' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : NAMED[e] ?? NAMED[e.toLowerCase()] ?? m));
const text = (h) => decode(h.replace(/<[^>]+>/g, ' ')).replace(/[\s ﻿]+/g, ' ').trim();

// list structure: open/close tags of lists and items only, items numbered by their text start
const lists = (h) => [...h.replace(/<p>|<\/p>/g, '').matchAll(/<(\/?)(ol|ul|li)\b[^>]*>|([^<]{1,12})/g)]
  .map((m) => (m[2] ? `<${m[1]}${m[2]}>` : ''))
  .join('')
  // adjacent one-item lists of the same type are the same list on screen
  .replace(/<\/(ul|ol)><\1>/g, '');
const links = (h) => [...h.matchAll(/<a [^>]*href="([^"]+)"[^>]*>/g)].map((m) => `${m[1]}${/target="_blank"/.test(m[0]) ? ' [new tab]' : ''}`)
  .filter((v, i, a) => a.indexOf(v) === i).sort().join(' ');
const n = (h, re) => (h.match(re) || []).length;

const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
const bad = [];
for (const row of seed) {
  const file = path.join(DIR, `${row.slug}.html`);
  if (!fs.existsSync(file)) { bad.push([row.slug, ['no editor capture']]); continue; }
  const site = bodyHtml(row.full_description);
  const saved = bodyHtml(fs.readFileSync(file, 'utf8'));
  const issues = [];
  if (text(site) !== text(saved)) {
    const a = text(site), b = text(saved); let i = 0; while (a[i] === b[i]) i++;
    issues.push(`text @${i}: "…${a.slice(Math.max(0, i - 30), i + 40)}…" vs "…${b.slice(Math.max(0, i - 30), i + 40)}…"`);
  }
  if (lists(site) !== lists(saved)) issues.push(`lists\n        site:  ${lists(site).slice(0, 220)}\n        saved: ${lists(saved).slice(0, 220)}`);
  if (links(site) !== links(saved)) issues.push(`links\n        site:  ${links(site).slice(0, 300)}\n        saved: ${links(saved).slice(0, 300)}`);
  for (const [k, re] of [['tables', /<table/g], ['images', /<img/g], ['headings', /<h[2-6]\b/g]]) if (n(site, re) !== n(saved, re)) issues.push(`${k} ${n(site, re)} -> ${n(saved, re)}`);
  if (issues.length) bad.push([row.slug, issues]);
}
console.log(`${seed.length} posts: ${seed.length - bad.length} would look the same after an admin save, ${bad.length} would not`);
for (const [s, i] of bad.slice(0, 20)) console.log(' ', s, '\n     ' + i.join('\n     '));
