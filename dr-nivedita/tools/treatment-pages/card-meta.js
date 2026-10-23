// Service cards on every treatment category page: add the rating + session-time row
// (inline styles are blocked by the CSP, so partial stars use lst-star-fill--NN classes)
// (design copied from dadumedicalcentre.com/treatments). Rating = the clinic's Google Maps rating,
// same on every card. Time = only where a real session time is known (data/durations.json).
// Usage: node card-meta.js [--write]
const fs = require('fs'), path = require('path');
const WRITE = process.argv.includes('--write');
const W = 'D:/DMC website rework/dr-nivedita/local/website';
const V = W + '/views';
const RATING = 4.8;
const durations = JSON.parse(fs.readFileSync(__dirname + '/data/durations.json', 'utf8'));

const STAR = 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z';
const svgStar = (fill, stroke) => `<svg width="11" height="11" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${STAR}"/></svg>`;
const stars = [1, 2, 3, 4, 5].map(i => {
  const pct = Math.round(Math.max(0, Math.min(1, RATING - (i - 1))) * 100);
  return `<span class="lst-star">${svgStar('none', '#D1D5DB')}<span class="lst-star-fill${pct < 100 ? ' lst-star-fill--' + pct : ''}">${svgStar('#F5B301', '#F5B301')}</span></span>`;
}).join('');
const clock = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
const meta = time => `<div class="lst-card-meta"><span class="lst-rating" aria-label="Rated ${RATING} out of 5">${RATING}</span><span class="lst-stars" aria-hidden="true">${stars}</span>${time ? `<span class="lst-sep" aria-hidden="true">•</span><span class="lst-time">${clock}<span>${time}</span></span>` : ''}</div>`;

const files = fs.readdirSync(V).filter(f => f.endsWith('.html') && fs.readFileSync(V + '/' + f, 'utf8').includes('class="lst-card'));
let cards = 0, timed = 0; const report = [];
for (const f of files) {
  let s = fs.readFileSync(V + '/' + f, 'utf8');
  let n = 0, t = 0;
  s = s.replace(/<article class="lst-card[^"]*">[\s\S]*?<\/article>/g, card => {
    card = card.replace(/<div class="lst-card-meta">[\s\S]*?<\/div>(?=\s*<p class="lst-card-text">)/, '');     // re-runnable
    const href = (card.match(/class="lst-card-cta" href="\/treatments\/([^"]+?)\/"/) || [])[1];
    if (!href) throw new Error(f + ': card without link');
    const time = durations[href] || null;
    n++; if (time) t++;
    return card.replace(/(<\/h3>)(\s*)(<p class="lst-card-text">)/, `$1$2${meta(time)}$2$3`);
  });
  cards += n; timed += t; report.push(`${f.padEnd(44)} ${n} cards, ${t} with time`);
  if (WRITE) fs.writeFileSync(V + '/' + f, s);
}
console.log(report.join('\n'));
console.log(`TOTAL ${cards} cards, ${timed} with session time`);

if (WRITE) {
  const cf = W + '/public/css/pages.css';
  let css = fs.readFileSync(cf, 'utf8');
  if (!css.includes('.lst-card-meta{')) {
    css = css.replace('.lst-card-text{', `.lst-card-meta{display:flex;align-items:center;flex-wrap:nowrap;gap:8px;height:18px;margin:0 0 12px;overflow:hidden;font-family:var(--font-body);font-size:13px;line-height:18px;color:#6b7280}
.lst-rating{font-weight:700}
.lst-stars{display:inline-flex;align-items:center;gap:2px}
.lst-star{position:relative;display:inline-flex;flex-shrink:0;width:11px;height:11px}
.lst-star-fill{position:absolute;inset:0 auto 0 0;display:inline-flex;overflow:hidden;white-space:nowrap}
.lst-star svg{flex-shrink:0}
.lst-sep{margin:0 2px;color:#d1d5db}
.lst-time{display:flex;align-items:center;flex-shrink:0;gap:4px;white-space:nowrap;color:#9ca3af}
.lst-card-text{`);
    // reference spacing: two-line title box, 6px to the rating row, 12px to the text
    css = css.replace('-webkit-line-clamp:2;overflow:hidden;margin:0 0 12px;font-family:var(--font-display);font-size:20px', '-webkit-line-clamp:2;overflow:hidden;min-height:52px;margin:0 0 6px;font-family:var(--font-display);font-size:20px');
    if (!css.includes('min-height:52px;margin:0 0 6px')) throw new Error('title rule not found');
    css = css.replace('@media (max-width:480px){\n  .lst-card-media{height:180px}', '@media (max-width:480px){\n  .lst-card-meta{gap:6px;font-size:12px}\n  .lst-card-media{height:180px}');
    fs.writeFileSync(cf, css);
  }
  console.log('css ok');
}
