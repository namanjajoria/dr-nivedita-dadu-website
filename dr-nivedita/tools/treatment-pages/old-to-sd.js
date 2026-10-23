// Convert every old-layout treatment detail page into the shared Bridal layout (sd-render.js),
// moving its existing content into the matching sections. Usage: node old-to-sd.js <scratch> [--write]
const fs = require('fs'), path = require('path');
const S = process.argv[2], WRITE = process.argv.includes('--write');
const W = 'D:/DMC website rework/dr-nivedita/local/website';
const V = W + '/views';
const { renderPage, DEFAULT_CTA } = require('./sd-render.js');
const pages = require(W + '/config/pages.all.json');
const must = (c, m) => { if (!c) throw new Error(m); };
const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const escT = s => s.replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const DROP = /\bvs\.?\b|versus|compar/i;
const COST = /\bcost\b|\bprice|pricing/i;
const IDEAL = /ideal|candidate|\bwho\b|suitab|right for/i;
const BENEFIT = /benefit|advantage/i;
const PROCESS = /process|procedure|\bsteps?\b|step[- ]by[- ]step|session|recovery|after ?care|side[- ]effect|downtime|what to expect/i;
const FAQ_T = /\bfaqs?\b|frequently asked/i;

function imgOf(html, cls) {
  const m = html.match(new RegExp(`<div class="${cls}"><img ([^>]*)>`));
  if (!m) return null;
  const g = k => (m[1].match(new RegExp(`${k}="([^"]*)"`)) || [])[1];
  return { src: g('src'), w: g('width'), h: g('height') };
}
function cardsToHtml(inner) {
  return [...inner.matchAll(/<article class="pg-card">([\s\S]*?)<\/article>/g)].map(m => {
    const t = (m[1].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '';
    const kv = [...m[1].matchAll(/<span class="kv-label">([\s\S]*?)<\/span><span class="kv-value">([\s\S]*?)<\/span>/g)];
    return `<h3>${t}</h3><ul>${kv.map(k => `<li><strong>${k[1]}:</strong> ${k[2]}</li>`).join('')}</ul>`;
  }).join('');
}
function cardsToTable(inner) {
  const cards = [...inner.matchAll(/<article class="pg-card">([\s\S]*?)<\/article>/g)].map(m => ({
    t: (m[1].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '',
    kv: [...m[1].matchAll(/<span class="kv-label">([\s\S]*?)<\/span><span class="kv-value">([\s\S]*?)<\/span>/g)].map(k => [k[1], k[2]]),
  }));
  if (!cards.length) return null;
  const labels = []; cards.forEach(c => c.kv.forEach(([l]) => { if (!labels.includes(l)) labels.push(l); }));
  return [['Treatment', ...labels], ...cards.map(c => [c.t, ...labels.map(l => (c.kv.find(k => k[0] === l) || [, ''])[1])])];
}
// Old section body -> clean HTML (p, ul/li, h3, strong, em, a, br, table). Every text node is kept.
function clean(inner, { skipCards = false } = {}) {
  let h = inner;
  h = h.replace(/<div class="(tp-media-img|tp-band-img)">[\s\S]*?<\/div>/g, '');            // images are placed by the layout
  h = h.replace(/<h2 class="tp-title">[\s\S]*?<\/h2>/, '');                                // section title is rendered separately
  h = h.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '<h3>$1</h3>');
  h = h.replace(/<a class="btn[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');                            // old CTA buttons
  if (skipCards) h = h.replace(/<div class="tp-cards">[\s\S]*?<\/article>\s*<\/div>/g, '');
  h = h.replace(/<article class="pg-card">([\s\S]*?)<\/article>/g, (m, c) => {
    const t = (c.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '';
    return `<h3>${t}</h3><ul>${c.replace(/<h3>[\s\S]*?<\/h3>/, '')}</ul>`;
  });
  h = h.replace(/<div class="pg-row"><span class="pg-row-num">([\s\S]*?)<\/span><h3 class="pg-row-title">([\s\S]*?)<\/h3>/g, '<div><h3>$1. $2</h3><ul>');
  h = h.replace(/(<ul>(?:(?!<\/ul>)[\s\S])*?)(<\/div><\/div>)/g, '$1</ul>$2');                // close the row list
  h = h.replace(/<div class="kv[^"]*"><span class="kv-label">([\s\S]*?)<\/span><span class="kv-value">([\s\S]*?)<\/span><\/div>/g, '<li><strong>$1:</strong> $2</li>');
  h = h.replace(/<p class="tp-cards-note">([\s\S]*?)<\/p>/g, '<p>$1</p>').replace(/<div class="tp-cards-note">([\s\S]*?)<\/div>/g, '<p>$1</p>');
  h = h.replace(/<ul class="tp-bullets">/g, '<ul>');
  h = h.replace(/<table[^>]*>/g, '<table class="sd-data-table">');
  h = h.replace(/<svg[\s\S]*?<\/svg>/g, '');
  h = h.replace(/<\/?(div|span|article|section)[^>]*>/g, '');                               // unwrap layout wrappers
  h = h.replace(/<(p|ul|li|h3|strong|em|tr|th|td|thead|tbody)\s+class="[^"]*">/g, '<$1>');
  h = h.replace(/<ul>\s*<\/ul>/g, '').replace(/<p>\s*<\/p>/g, '');
  return h.replace(/\n\s*/g, '').trim();
}
function sectionContent(inner) {
  const hasCards = false;                       // cards are converted inside clean()
  return { html: clean(inner), hasCards };
}
const toBand = h => h.replace(/<p>/g, '<p class="sd-band-desc">').replace(/<ul>/g, '<ul class="sd-band-list">').replace(/<h3>/g, '<h3 class="sd-band-sub">');

function convert(entry) {
  const file = `${V}/${entry.view}.html`;
  const s = fs.readFileSync(file, 'utf8');
  must(s.includes('{{> inner-page-end}}'), entry.view + ': no footer partial');
  const name = (s.match(/<h1 class="pg-title">([\s\S]*?)<\/h1>/) || [])[1];
  must(name, entry.view + ': no h1');
  const crumbE = entry.breadcrumbs && entry.breadcrumbs[1];
  must(crumbE, entry.view + ': no category breadcrumb');
  let intro = ((s.match(/<div class="pg-copy">([\s\S]*?)<\/div>/) || [])[1] || '').trim();
  if (strip(intro).replace(/\./g, '') === '') intro = '';
  const hero = imgOf(s, 'pg-intro-media');
  must(hero, entry.view + ': no hero image');

  const secs = [];
  for (const m of s.matchAll(/<section class="([^"]+)"([^>]*)>([\s\S]*?)<\/section>/g)) {
    const cls = m[1], inner = m[3];
    if (/page-banner|pg-intro|tp-more/.test(cls)) continue;
    if (inner.includes('class="faq-row"')) {
      secs.push({ kind: 'faq', faq: [...inner.matchAll(/<summary class="faq-q"><h3>([\s\S]*?)<\/h3><\/summary><div class="faq-a">([\s\S]*?)<\/div><\/details>/g)].map(f => ({ q: f[1].replace(/^\d+\.\s*/, ''), a: f[2].trim() })) });
      continue;
    }
    must(/^tp\b|^tp-band/.test(cls), entry.view + ': unknown section ' + cls);
    const title = (inner.match(/<h2 class="tp-title">([\s\S]*?)<\/h2>/) || [])[1] || null;
    const t = title ? strip(title) : '';
    const { html, hasCards } = sectionContent(inner);
    const im = imgOf(inner, 'tp-media-img') || imgOf(inner, 'tp-band-img');
    let kind = 'content';
    if (t && DROP.test(t)) kind = 'drop';
    else if (t && FAQ_T.test(t)) kind = 'faqtext';
    else if (t && COST.test(t)) kind = 'cost';
    else if (t && IDEAL.test(t)) kind = 'ideal';
    else if (t && BENEFIT.test(t)) kind = 'benefit';
    else if (t && PROCESS.test(t)) kind = 'process';
    secs.push({ kind, title, t, html, hasCards, inner, im });
  }
  const faqSec = secs.find(x => x.kind === 'faq');
  // a text "FAQs" section is only dropped when the page already has a real FAQ list
  secs.forEach(x => { if (x.kind === 'faqtext') x.kind = faqSec ? 'drop' : 'content'; });
  const by = k => secs.filter(x => x.kind === k);
  const body = x => x.html + (x.hasCards ? cardsToHtml(x.inner) : '');

  const content = [...by('content'), ...by('benefit')];
  if (!intro && content.length && !content[0].title) intro = body(content.shift());     // untitled lead text = intro
  const bandSec = content.shift() || null;
  const used = new Set();
  const pick = (own) => { if (own && !used.has(own.src)) { used.add(own.src); return own; } return null; };
  const pool = [...secs.map(x => x.im).filter(Boolean), hero].filter((x, i, a) => a.findIndex(y => y.src === x.src) === i);
  const nextFree = () => { const f = pool.find(x => !used.has(x.src)); if (f) used.add(f.src); return f || hero; };
  const procSecs = by('process'), costSecs = by('cost'), idealSecs = by('ideal');
  const imgs = { gallery: [hero, ...pool.filter(x => x.src !== hero.src)] };
  used.add(hero.src);
  imgs.band = bandSec ? (pick(bandSec.im) || nextFree()) : null;
  imgs.split = content.length ? (pick(content[0].im) || nextFree()) : null;
  imgs.tech = procSecs.length ? (pick(procSecs[0].im) || nextFree()) : null;

  const withHeads = list => list.map(x => (list.length > 1 || x.title ? (x.title ? `<h3>${x.title}</h3>` : '') : '') + body(x)).join('');
  let cost = null;
  if (costSecs.length) {
    const tableSec = costSecs.find(x => x.inner.includes('class="pg-card"'));
    const table = tableSec ? cardsToTable(tableSec.inner) : null;
    const html = costSecs.map(x => (x === tableSec ? clean(x.inner, { skipCards: true }) : x.html)).join('');
    cost = { title: costSecs[0].title, html, table, notes: [], left: !table };
  }
  const m = {
    name, crumb: { name: escT(crumbE.name), path: crumbE.path }, subtitle: name, introHtml: intro,
    band: bandSec ? { title: bandSec.title, html: toBand(body(bandSec)) } : null,
    split: content.map(x => ({ title: x.title, html: body(x) })),
    ideal: idealSecs.length ? withHeads(idealSecs) : null,
    cta: DEFAULT_CTA,
    process: procSecs.length ? withHeads(procSecs) : null,
    cost, faq: faqSec ? faqSec.faq : [], imgs,
  };
  const out = renderPage(m);
  // every bit of kept text must be on the new page
  const outText = strip(out);
  const kept = secs.filter(x => x.kind !== 'drop' && x.kind !== 'faq');
  const missing = [];
  for (const x of kept) {                  // every text node of every kept section, buttons and images excepted
    const src = x.inner.replace(/<a class="btn[^"]*"[^>]*>[\s\S]*?<\/a>/g, '').replace(/<div class="(tp-media-img|tp-band-img)">[\s\S]*?<\/div>/g, '').replace(/<span class="pg-row-num">[\s\S]*?<\/span>/g, '');
    for (const p of src.split(/<[^>]+>/)) { const t = strip(p).replace(/:$/, ''); if (t.length > 2 && !outText.includes(t)) missing.push(t.slice(0, 60)); }
  }
  for (const f of m.faq) for (const p of (f.q + '<x>' + f.a).split(/<[^>]+>/)) { const t = strip(p); if (t.length > 2 && !outText.includes(t)) missing.push('FAQ ' + t.slice(0, 50)); }
  if (strip(intro) && !outText.includes(strip(intro).slice(0, 80))) missing.push('INTRO');
  return {
    out, file, missing,
    summary: `${entry.view.replace(/^t-/, '').padEnd(62)} intro:${intro ? 'y' : '-'} band:${bandSec ? 'y' : '-'} split:${content.length} ideal:${idealSecs.length} proc:${procSecs.length} cost:${cost ? (cost.table ? 'table' : 'text') : '-'} faq:${m.faq.length} imgs:${imgs.gallery.length}` +
      (by('drop').length ? ` | dropped: ${by('drop').map(x => x.t.slice(0, 40)).join(' ; ')}` : ''),
  };
}

const list = pages.filter(p => /^\/treatments\/[^/]+\/[^/]+\/$/.test(p.path) && !p.path.startsWith('/treatments/bridal-dermatology/'));
const results = [];
let problems = 0;
for (const e of list) {
  try {
    const r = convert(e); results.push(r);
    if (r.missing.length) { problems++; console.log('MISSING TEXT', e.view, r.missing.slice(0, 3)); }
  } catch (err) { problems++; console.log('ERROR', e.view, err.message); }
}
fs.writeFileSync(S + '/old-to-sd-report.txt', results.map(r => r.summary).join('\n'));
console.log(`${results.length}/${list.length} converted, ${problems} with problems. Report: old-to-sd-report.txt`);
if (WRITE) {
  if (problems) throw new Error('not writing: fix problems first');
  const BK = S + '/backup-old-detail-pages';
  fs.mkdirSync(BK, { recursive: true });
  for (const r of results) { const b = BK + '/' + path.basename(r.file); if (!fs.existsSync(b)) fs.copyFileSync(r.file, b); fs.writeFileSync(r.file, r.out); }
  console.log('WROTE', results.length, 'pages');
}
