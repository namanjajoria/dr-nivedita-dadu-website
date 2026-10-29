// Lists every page (and stylesheet) that still references /images/ on this server instead of
// Supabase Storage. Run against a site with MEDIA_BASE_URL set.
//   node tools/db/find-local-images.js <siteUrl>
const base = process.argv[2];
(async () => {
  const xml = await fetch(base + '/sitemap.xml').then((r) => r.text());
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const found = {};
  const scan = (where, text) => {
    for (const m of text.matchAll(/.{0,50}(?<!object\/public\/images\/site)(?<![a-z0-9])\/images\/[^"'\s)&]+/gi)) {
      if (/storage\/v1\/object\/public\/images\/site/.test(m[0])) continue;
      (found[where] ||= []).push(m[0].trim());
    }
  };
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < paths.length) {
      const p = paths[i++];
      scan(p, await fetch(base + p).then((r) => r.text()));
    }
  }));
  // stylesheets exactly as pages link them (with their ?v= hash, which is what a CDN caches)
  const sheets = new Set();
  for (const p of ['/', '/blog/', '/about-clinic']) {
    const html = await fetch(base + p).then((r) => r.text());
    for (const m of html.matchAll(/href="(\/css\/[^"]+\.css(?:\?[^"]*)?)"/g)) sheets.add(m[1].replace(/&amp;/g, '&'));
  }
  for (const css of sheets) scan(css, await fetch(base + css).then((r) => r.text()));
  const keys = Object.keys(found);
  console.log(`${paths.length} pages scanned; ${keys.length} with local /images/ references`);
  for (const k of keys.slice(0, 15)) console.log(' ', k, found[k].length, '|', found[k].slice(0, 2).join(' || '));
})();
