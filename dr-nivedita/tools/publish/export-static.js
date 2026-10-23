// Export the running local site (http://localhost:3000) as static files for GitHub Pages.
// Every page in sitemap.xml is fetched, links are rewritten to the Pages sub-path, and
// public/ is copied alongside. Usage: node export-static.js <outDir>
const fs = require('fs'), path = require('path');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'dist'));
const LOCAL = 'http://localhost:3000';
const PUBLIC_ORIGIN = 'https://namanjajoria.github.io';
const BASE = '/dr-nivedita-dadu-website';             // GitHub Pages project path
const PUBLIC_DIR = path.resolve(__dirname, '../../local/website/public');

// "/x" -> "/dr-nivedita-dadu-website/x" in attributes and CSS url(); leaves "//cdn", "#", "http..." alone
// fetch with a few retries (the dev server sometimes resets a busy connection)
async function get(url) {
  for (let i = 0; ; i++) {
    try { return await fetch(url); } catch (e) { if (i >= 4) throw e; await new Promise(r => setTimeout(r, 300 * (i + 1))); }
  }
}
const rewrite = s => s
  .split(LOCAL).join(PUBLIC_ORIGIN + BASE)
  .replace(/(\s(?:href|src|action|poster|data-src)=")\/(?!\/)/g, `$1${BASE}/`)
  .replace(/(\ssrcset=")([^"]+)"/g, (m, a, v) => a + v.replace(/(^|,\s*)\/(?!\/)/g, `$1${BASE}/`) + '"')
  .replace(/url\((["']?)\/(?!\/)/g, `url($1${BASE}/`);

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else if (/\.css$/i.test(e.name)) fs.writeFileSync(d, rewrite(fs.readFileSync(s, 'utf8')));
    else fs.copyFileSync(s, d);
  }
}

(async () => {
  const sm = await (await get(LOCAL + '/sitemap.xml')).text();
  const paths = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname);
  if (paths.length < 50) throw new Error('sitemap looks wrong: ' + paths.length + ' pages');
  fs.rmSync(OUT, { recursive: true, force: true });
  copyDir(PUBLIC_DIR, OUT);
  let n = 0; const bad = [];
  const queue = [...new Set(paths)];
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const p = queue.shift();
      const r = await get(LOCAL + p);
      if (r.status !== 200) { bad.push(`${r.status} ${p}`); continue; }
      const html = rewrite(await r.text());
      const file = path.join(OUT, decodeURIComponent(p).replace(/\/$/, '') || '', 'index.html');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, html);
      n++;
    }
  }));
  // a page GitHub Pages serves for unknown URLs
  const nf = await get(LOCAL + '/this-page-does-not-exist');
  fs.writeFileSync(path.join(OUT, '404.html'), rewrite(await nf.text()));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');                 // serve files/folders as-is
  console.log(`exported ${n} pages to ${OUT}${bad.length ? '\nFAILED: ' + bad.join(', ') : ''}`);
  if (bad.length) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
