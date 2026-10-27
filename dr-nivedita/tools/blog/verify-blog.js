// Checks every rendered blog page on the local server: hero + post title, cover photo on disk,
// no literal "**", no link back to a live blog post, FAQ count matches, every internal link answers 200.
// Usage (server running): node verify-blog.js
const fs = require('fs');
const W = 'D:/DMC website rework/dr-nivedita/local/website', B = 'http://localhost:3000';
const posts = JSON.parse(fs.readFileSync(__dirname + '/posts.json', 'utf8'));
const problems = [], links = new Set();
(async () => {
  const pages = ['/blog/', ...posts.map(p => `/blog/${p.slug}/`)];
  const queue = [...pages];
  await Promise.all([0, 1, 2, 3].map(async () => {
    while (queue.length) {
      const u = queue.shift();
      const html = await (await fetch(B + u)).text();
      const vis = html.replace(/<script[\s\S]*?<\/script>/g, '');
      const bad = m => problems.push(u + ': ' + m);
      if (!/<h1 class="blg-hero-title">[^<]+<\/h1>/.test(vis)) bad('no hero title');
      if (u !== '/blog/' && !/<h2 class="blg-title">[^<]+<\/h2>/.test(vis)) bad('no post title');
      if (/\*\*/.test(vis.replace(/<[^>]+>/g, ''))) bad('literal **');
      if (/href="https?:\/\/(?:www\.)?drniveditadadu\.com\/blog\//.test(vis)) bad('link to live blog');
      for (const [, src] of vis.matchAll(/<img src="(\/images\/[^"]+)"/g)) if (!fs.existsSync(W + '/public' + src)) bad('missing image ' + src);
      const n = (vis.match(/class="blg-faq-item/g) || []).length, t = vis.match(/Frequently Asked Questions[^<]*\( (\d+) \)|FAQs?[^<]*\( (\d+) \)/);
      if (n && (!t || +(t[1] || t[2]) !== n)) bad('faq count ' + n);
      for (const [, h] of vis.matchAll(/href="(\/[^"#?]*)/g)) links.add(h);
    }
  }));
  const lq = [...links]; let dead = [];
  await Promise.all([0, 1, 2, 3].map(async () => { while (lq.length) { const h = lq.shift(); const r = await fetch(B + h, { redirect: 'manual' }); if (r.status >= 400) dead.push(r.status + ' ' + h); } }));
  console.log(`${pages.length} pages, ${links.size} internal links checked`);
  console.log(problems.length || dead.length ? 'PROBLEMS:\n' + [...problems, ...dead.map(d => 'dead link ' + d)].join('\n') : 'ALL BLOG PAGES OK');
})().catch(e => { console.error(e); process.exit(1); });
