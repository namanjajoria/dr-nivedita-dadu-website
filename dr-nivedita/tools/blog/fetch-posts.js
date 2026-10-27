// Read-only copy of the live drniveditadadu.com blog: the post list (loaded on the live /blog/ page
// from /blog/pagiate.php, 6 posts a page) and every post's HTML, cached in ./src/<slug>.html.
// Writes ./posts.json (live order, newest first). Usage: node fetch-posts.js [--refresh]
const fs = require('fs'), path = require('path');
const BASE = 'https://www.drniveditadadu.com', SRC = path.join(__dirname, 'src'), REFRESH = process.argv.includes('--refresh');
const UA = { 'User-Agent': 'Mozilla/5.0 Chrome/126', 'Content-Type': 'application/x-www-form-urlencoded' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dec = s => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const clean = s => dec(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

async function get(p, body) {
  for (let n = 0; ; n++) {
    try {
      const r = await fetch(BASE + p, body ? { method: 'POST', headers: UA, body: new URLSearchParams(body) } : { headers: { 'User-Agent': UA['User-Agent'] } });
      if (!r.ok) throw new Error(r.status + ' ' + p);
      return await r.text();
    } catch (e) { if (n === 2) throw e; await sleep(2000); }
  }
}

function parseList(page) {
  return [...page.matchAll(/<article class="blogpost[\s\S]*?<\/article>/g)].map(([art]) => {
    const img = art.match(/<img src="([^"]+)"\s+alt="([^"]*)"/), head = art.match(/<div class="bloghed1">\s*<a href="([^"]+)">([\s\S]*?)<\/a>/);
    const day = art.match(/<span class="day">([\s\S]*?)<\/span>/), month = art.match(/<span class="month">([\s\S]*?)<\/span>/);
    const author = art.match(/by <a[^>]*>([\s\S]*?)<\/a>/), excerpt = art.match(/<div class="blogpost-content">\s*<p>([\s\S]*?)<\/p>/);
    if (!img || !head || !day || !month || !excerpt) throw new Error('list card not recognised: ' + art.slice(0, 200));
    return { url: head[1].trim(), slug: head[1].trim().replace(/\/$/, '').split('/').pop(), title: clean(head[2]), image: img[1].trim(), alt: clean(img[2]),
      date: `${clean(day[1])} ${clean(month[1])}`, author: author ? clean(author[1]) : '', excerpt: clean(excerpt[1]) };
  });
}

(async () => {
  fs.mkdirSync(SRC, { recursive: true });
  const first = await get('/blog/pagiate.php', { page: 1 });
  const last = Math.max(...[...first.matchAll(/data-page="(\d+)"/g)].map(m => +m[1]));
  const posts = [], seen = new Set();
  for (let pg = 1; pg <= last; pg++) {
    for (const p of parseList(pg === 1 ? first : await get('/blog/pagiate.php', { page: pg }))) if (!seen.has(p.url)) { seen.add(p.url); posts.push(p); }
    if (pg > 1) await sleep(300);
  }
  console.log(`${last} list pages, ${posts.length} posts`);
  let got = 0;
  for (const p of posts) {
    const f = path.join(SRC, p.slug + '.html');
    if (!REFRESH && fs.existsSync(f) && fs.statSync(f).size > 20000) continue;
    fs.writeFileSync(f, await get(new URL(p.url).pathname)); got++;
    if (got % 25 === 0) console.log('fetched', got);
    await sleep(1000);
  }
  fs.writeFileSync(path.join(__dirname, 'posts.json'), JSON.stringify(posts, null, 1));
  console.log('fetched', got, 'posts; cached', fs.readdirSync(SRC).length);
})().catch(e => { console.error(e); process.exit(1); });
