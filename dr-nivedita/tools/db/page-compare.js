// Compares two page-snapshot.js files and lists every page whose title, meta, canonical,
// og:image, JSON-LD, images or visible text changed.
//   node tools/db/page-compare.js <before.json> <after.json> [--show N]
const fs = require('fs');
// an image is the same file whether the page served it from this site or from Storage
// (page-snapshot.js already maps Storage URLs to /images/)
// and the site's own origin (local, temp domain or GitHub Pages) is the same site
const sameOrigin = (s) => s
  .replace(/https?:\/\/(?:localhost:\d+|[a-z0-9-]+\.hostingersite\.com|namanjajoria\.github\.io\/dr-nivedita-dadu-website)\/images\//g, '/images/')
  .replace(/https?:\/\/(?:localhost:\d+|[a-z0-9-]+\.hostingersite\.com|namanjajoria\.github\.io\/dr-nivedita-dadu-website)/g, 'SITE');
const [a, b] = process.argv.slice(2, 4).map((f) => JSON.parse(sameOrigin(fs.readFileSync(f, 'utf8'))));
const show = Number((process.argv.join(' ').match(/--show (\d+)/) || [])[1] || 5);

// first position where two strings differ, with some context
function where(x, y) {
  let i = 0;
  while (i < x.length && x[i] === y[i]) i++;
  return `@${i}\n      before: …${x.slice(Math.max(0, i - 60), i + 80)}…\n      after:  …${y.slice(Math.max(0, i - 60), i + 80)}…`;
}

const missing = Object.keys(a).filter((p) => !(p in b));
const extra = Object.keys(b).filter((p) => !(p in a));
const changed = [];
for (const p of Object.keys(a)) {
  if (!(p in b)) continue;
  const diffs = [];
  for (const k of ['status', 'title', 'description', 'canonical', 'ogImage']) if (a[p][k] !== b[p][k]) diffs.push(`${k}: ${JSON.stringify(a[p][k])} -> ${JSON.stringify(b[p][k])}`);
  if (JSON.stringify(a[p].jsonLd) !== JSON.stringify(b[p].jsonLd)) diffs.push('jsonLd ' + where(a[p].jsonLd.join('\n'), b[p].jsonLd.join('\n')));
  if (JSON.stringify(a[p].images) !== JSON.stringify(b[p].images)) diffs.push('images ' + where(a[p].images.join(' '), b[p].images.join(' ')));
  if (a[p].text !== b[p].text) diffs.push('text ' + where(a[p].text, b[p].text));
  if (diffs.length) changed.push([p, diffs]);
}
console.log(`pages: ${Object.keys(a).length} before, ${Object.keys(b).length} after; changed ${changed.length}; missing ${missing.length}; extra ${extra.length}`);
missing.slice(0, show).forEach((p) => console.log('  MISSING', p));
extra.slice(0, show).forEach((p) => console.log('  EXTRA', p));
for (const [p, d] of changed.slice(0, show)) console.log(`  ${p}\n    ${d.join('\n    ')}`);
process.exitCode = changed.length || missing.length ? 1 : 0;
