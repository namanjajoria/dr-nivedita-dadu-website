// Saves what a set of pages shows, so a page can be compared before and after its content
// moves to the database.
//   node tools/db/page-snapshot.js <siteUrl> <outFile.json> [pathPrefix]
// Paths come from the site's sitemap.xml (filtered by pathPrefix). For each page it keeps the
// <title>, meta description, canonical, og:image, JSON-LD, visible text (scripts, styles
// and the form token removed) and every image source (Storage URLs mapped back to /images/).
const fs = require('fs');

const [base, out, prefix = '/'] = process.argv.slice(2);
const MEDIA = /https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/images\/site\//g;

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const meta = (html, re) => decode((html.match(re) || [])[1] || '');

function digest(html) {
  html = html.replace(MEDIA, '/images/');
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1].trim());
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [, html])[1]
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ');
  const images = [...body.matchAll(/<(?:img|source)\b[^>]*?\s(?:src|srcset)="([^"]+)"/g)].map((m) => m[1]);
  const text = decode(body.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  return {
    title: meta(html, /<title>([^<]*)<\/title>/),
    description: meta(html, /<meta name="description" content="([^"]*)"/),
    canonical: meta(html, /<link rel="canonical" href="([^"]*)"/),
    ogImage: meta(html, /<meta property="og:image" content="([^"]*)"/),
    jsonLd,
    images,
    text,
  };
}

(async () => {
  const xml = await fetch(base + '/sitemap.xml').then((r) => r.text());
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((p) => p.startsWith(prefix));
  const pages = {};
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < paths.length) {
      const p = paths[i++];
      const r = await fetch(base + p);
      pages[p] = { status: r.status, ...digest(await r.text()) };
    }
  }));
  const sorted = Object.fromEntries(Object.keys(pages).sort().map((k) => [k, pages[k]]));
  fs.writeFileSync(out, JSON.stringify(sorted, null, 1));
  console.log(`${paths.length} pages -> ${out}`);
})();
