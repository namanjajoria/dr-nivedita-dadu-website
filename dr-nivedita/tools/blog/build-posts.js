// Blog post pages copied from drniveditadadu.com (exact text, tables and cover image) into this
// site's design: /blog/<slug>/. Registers them in config/pages.blog.json (sitemap + routes).
// Usage: node build-posts.js <dir with downloaded post html> [--write]
const fs = require('fs'), path = require('path');
const SRC = process.argv[2], WRITE = process.argv.includes('--write');
const W = 'D:/DMC website rework/dr-nivedita/local/website';
const SLUGS = ['best-treatment-for-acne-and-pimples', 'winter-skincare-routine-dry-skin', 'vitamin-c-for-beginners']; // newest first
const must = (c, m) => { if (!c) throw new Error(m); };
const dec = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

function clean(body) {
  let h = body;
  h = h.replace(/<div class="carousel[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '');          // cover image (rendered separately)
  h = h.replace(/\s(xss|border|cellpadding|cellspacing|style|width|height|align|dir)=("[^"]*"|[^\s>]+)/g, '');
  h = h.replace(/<\/?div[^>]*>/g, '');                                                   // layout wrappers from the source page
  h = h.replace(/<table>/g, '<div class="bp-table"><table>').replace(/<\/table>/g, '</table></div>');
  h = h.replace(/<p>\s*<p>/g, '<p>').replace(/<\/p>\s*<\/p>/g, '</p>');
  h = h.replace(/<td>\s*<p>([\s\S]*?)<\/p>\s*<\/td>/g, '<td>$1</td>');
  h = h.replace(/<p>(?:\s|&nbsp;)*<\/p>/g, '').replace(/<hr\s*\/?>/g, '');
  h = h.replace(/href="https:\/\/www\.drniveditadadu\.com\/blog\/tag\/[^"]*"/g, 'href="/blog/"');
  return h.replace(/\n\s*/g, '\n').trim();
}

const posts = [];
for (const slug of SLUGS) {
  const s = fs.readFileSync(path.join(SRC, slug + '.html'), 'utf8');
  const h1 = (s.match(/<h1 class="page-title">([\s\S]*?)<\/h1>/) || [])[1];
  const title = (s.match(/<title>([^<]*)/) || [])[1];
  const desc = (s.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const day = (s.match(/<span class="day">([^<]*)/) || [])[1], month = (s.match(/<span class="month">([^<]*)/) || [])[1];
  const cover = s.match(/<div class="carousel[\s\S]*?<img src="([^"]+)" alt="([^"]*)"/);
  const a = s.indexOf('<div class="blogpost-content">'), e = s.indexOf('<!-- Tags -->', a);
  must(h1 && title && desc && day && month && cover && a > 0 && e > a, slug + ': page structure not recognised');
  const body = s.slice(a + '<div class="blogpost-content">'.length, e).replace(/<\/div>\s*$/, '');
  const tags = [...s.slice(e, s.indexOf('</div>', e)).matchAll(/<a [^>]*>([^<]*)<\/a>/g)].map(m => m[1].trim());
  posts.push({ slug, h1: h1.trim(), title: dec(title.trim()), desc: dec(desc.trim()), date: `${day.trim()} ${month.trim()}`, coverUrl: cover[1], coverAlt: cover[2], html: clean(body), tags, raw: body });
}

const consult = fs.readFileSync(W + '/views/partials/consult-form.html', 'utf8');   // check the partial exists
must(consult.includes('data-form'), 'consult form partial');

for (const p of posts) { p.cover = `/images/blog/${p.slug}.jpeg`; p.view = `blog-${p.slug}`; }
for (const p of posts) {
  const others = posts.filter(o => o !== p);
  p.page = `{{> inner-page-start}}

<section class="page-banner">
  <div class="container">
    <p class="page-banner-title">${p.h1}</p>
    <nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a href="/">Home</a></li><li><a href="/blog/">Blog</a></li><li><span aria-current="page">${p.h1}</span></li></ol></nav>
  </div>
</section>

<section class="bp">
  <div class="container bp-grid">
    <article class="bp-main">
      <h1 class="bp-title">${p.h1}</h1>
      <div class="bp-meta"><span class="bp-meta-item"><svg class="ico"><use href="#i-clock"/></svg>${p.date}</span><span class="bp-meta-item"><svg class="ico"><use href="#i-user"/></svg>By Dr. Nivedita Dadu</span></div>
      <div class="bp-cover"><img src="${p.cover}" alt="${p.coverAlt}" fetchpriority="high" decoding="async"></div>
      <div class="bp-content">
${p.html}
      </div>${p.tags.length ? `
      <div class="bp-tags"><span>Tags:</span>${p.tags.map(t => `<a href="/blog/">${t}</a>`).join('')}</div>` : ''}
    </article>
    <aside class="bp-side">
      <div class="bp-side-card">
        {{> consult-form}}
      </div>
      <div class="bp-side-card">
        <h2 class="bp-side-title">Latest Blogs</h2>
        <ul class="bp-side-list">${others.map(o => `
          <li><a href="/blog/${o.slug}/"><img src="${o.cover}" alt="" loading="lazy" decoding="async"><span><strong>${o.h1}</strong><small>${o.date}</small></span></a></li>`).join('')}
        </ul>
        <a class="bp-side-all" href="/blog/">View all blogs</a>
      </div>
    </aside>
  </div>
</section>

{{> inner-page-end}}
`;
  // every sentence of the original must survive the clean-up
  const txt = h => dec(h.replace(/<[^>]+>/g, ' ')).replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const out = txt(p.page);
  const missing = txt(p.raw.replace(/<div class="carousel[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '')).split(/(?<=[.?!])\s+/).filter(x => x.length > 3 && !out.includes(x));
  must(!missing.length, p.slug + ': text lost: ' + missing.slice(0, 3).join(' | '));
  console.log(`${p.slug}: ${p.date}, ${p.html.length} chars, tags: ${p.tags.join(', ') || '-'}`);
}

if (WRITE) {
  (async () => {
    for (const p of posts) {
      const f = W + '/public' + p.cover;
      if (!fs.existsSync(f) || fs.statSync(f).size < 10000) { const r = await fetch(p.coverUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120', Referer: 'https://www.drniveditadadu.com/' } }); must(r.ok, 'cover ' + p.coverUrl); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); }
      fs.writeFileSync(`${W}/views/${p.view}.html`, p.page);
    }
    const cf = W + '/config/pages.blog.json';
    const list = JSON.parse(fs.readFileSync(cf, 'utf8')).filter(e => !SLUGS.some(s => e.path === `/blog/${s}/`));
    for (const p of posts) list.push({ path: `/blog/${p.slug}/`, view: p.view, title: p.title, description: p.desc,
      image: { path: p.cover, width: 1200, height: 630, alt: p.coverAlt },
      breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Blogs', path: '/blog/' }, { name: p.h1, path: `/blog/${p.slug}/` }] });
    fs.writeFileSync(cf, JSON.stringify(list, null, 2) + '\n');
    fs.writeFileSync(path.join(__dirname, 'latest.json'), JSON.stringify(posts.map(p => ({ slug: p.slug, title: p.h1, date: p.date, cover: p.cover, coverAlt: p.coverAlt, desc: p.desc })), null, 1));
    console.log('WROTE', posts.length, 'posts');
  })().catch(e => { console.error(e); process.exit(1); });
}
