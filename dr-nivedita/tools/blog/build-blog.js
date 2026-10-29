// Blog listing (/blog/) and every blog post (/blog/<slug>/) in the dadumedicalcentre.com blog
// layout (blg-* classes in pages.css), with the exact text of the live drniveditadadu.com posts.
// Input: posts.json + src/<slug>.html from fetch-posts.js. Writes views/blog.html,
// views/blog-<slug>.html and config/pages.blog.json. Usage: node build-blog.js [--write]
const fs = require('fs'), path = require('path');
const WRITE = process.argv.includes('--write');
const W = 'D:/DMC website rework/dr-nivedita/local/website';
const SRC = path.join(__dirname, 'src');
// the card photos were mirrored as WebP by tools/about-page-import/build_blog.py; that listing maps live URL -> photo
const OLD_LISTING = 'D:/DMC website rework/dr-nivedita/backups/blog-all-2026-10-27/views/blog.html';
const RECENT = 4, PER_PAGE = 10;
const must = (c, m) => { if (!c) throw new Error(m); };
const dec = s => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const text = h => dec(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// ---- photos already on the site, keyed by live post URL
const photos = {};
for (const [, art] of fs.readFileSync(OLD_LISTING, 'utf8').matchAll(/<article class="blog-card"[^>]*>([\s\S]*?)<\/article>/g)) {
  const href = art.match(/href="([^"]+)"/)[1], img = art.match(/<img src="([^"]+)" alt="([^"]*)"[^>]*width="(\d+)" height="(\d+)"/);
  photos[href] = { src: img[1], alt: dec(img[2]), width: +img[3], height: +img[4] };
}

// ---- every path this site serves (live links to those pages stay on this site)
const routes = new Set(require(W + '/config/pages.js').map(p => p.path));

// ---- the live posts
const list = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts.json'), 'utf8'));
const slugs = new Set(list.map(p => p.slug));
function localHref(href) {
  const m = href.match(/^https?:\/\/(?:www\.)?drniveditadadu\.com(\/[^"#?]*)?([?#][^"]*)?$/i);
  if (!m) return href;
  let p = (m[1] || '/').replace(/\/?$/, '/').replace(/\/index\.php\/$/, '/');
  const blog = p.match(/^\/blog\/([^/]+)\/$/);
  if (blog && slugs.has(blog[1])) return p + (m[2] && m[2][0] === '#' ? m[2] : '');
  if (/^\/blog\/tag\//.test(p)) return '/blog/';
  const hash = m[2] && m[2][0] === '#' ? m[2] : '';
  if (routes.has(p)) return p + hash;
  return routes.has(p.slice(0, -1)) ? p.slice(0, -1) + hash : href;                        // pages served without a trailing slash
}

function clean(body) {
  let h = body;
  h = h.replace(/<div class="carousel[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '');           // cover photo (shown separately)
  h = h.replace(/\s(xss|border|cellpadding|cellspacing|style|width|height|align|dir|class|id|data-[a-z-]+)=("[^"]*"|[^\s>]+)/g, '');
  h = h.replace(/<\/?(div|span|font|o:p)[^>]*>/g, '');                                     // layout wrappers of the source page
  h = h.replace(/<(\/?)b>/g, '<$1strong>').replace(/<(\/?)i>/g, '<$1em>');
  h = h.replace(/<table>/g, '<div class="blg-table"><table>').replace(/<\/table>/g, '</table></div>');
  for (let i = 0; i < 3; i++) h = h.replace(/<p>\s*<p>/g, '<p>').replace(/<\/p>\s*<\/p>/g, '</p>');
  h = h.replace(/<td>\s*<p>([\s\S]*?)<\/p>\s*<\/td>/g, '<td>$1</td>').replace(/<th>\s*<p>([\s\S]*?)<\/p>\s*<\/th>/g, '<th>$1</th>');
  h = h.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '').replace(/<hr\s*\/?>/g, '');
  h = h.replace(/<(p|h2|h3|h4|li)>(?:\s|&nbsp;)+/g, '<$1>').replace(/(?:\s|&nbsp;|<br\s*\/?>)+<\/(p|h2|h3|h4|li)>/g, '</$1>');
  h = h.replace(/<strong>(\s*)<\/strong>/g, '$1');
  h = h.replace(/href="([^"]+)"/g, (m, u) => `href="${localHref(dec(u)).replace(/&/g, '&amp;')}"`);
  h = h.replace(/<a ([^>]*href="https?:[^"]*")([^>]*)>/g, (m, a, b) => /target=/.test(a + b) ? m : `<a ${a}${b} target="_blank" rel="noopener">`);
  return h.replace(/\n\s*/g, '\n').trim();
}

// FAQ block at the end of a post: a "Frequently Asked Questions" / "FAQs" line, then question + answer
// pairs. Returns null when anything after the heading is not a clean pair, so nothing is ever dropped.
const FAQ_HEAD = /<(p|h2|h3|h4)>(?:<strong>)?\s*((?:frequently asked questions|faqs?)\b[^<]*?)\s*(?:<\/strong>)?\s*<\/\1>/i;
function splitFaq(html) {
  const m = html.match(FAQ_HEAD);
  if (!m) return null;
  const before = html.slice(0, m.index).trim();
  const rest = html.slice(m.index + m[0].length).trim().replace(/<strong>(Q\s*\d*\s*[.:)])\s*<\/strong>\s*<strong>/gi, '<strong>$1 ');  // "<strong>Q.</strong> <strong>Question?</strong>"
  const blocks = [...rest.matchAll(/<(p|h2|h3|h4|ul|ol|div)>[\s\S]*?<\/\1>/g)].map(b => b[0]);
  if (!blocks.length || blocks.join('').replace(/\s/g, '') !== rest.replace(/\s/g, '')) return null;
  const items = [];
  const QNUM = /^(?:Q\s*\d*\s*[.):]|\d+\s*[.):])\s*/i;
  const ANS = /^(?:\s|<br\s*\/?>|<\/?strong>)*(?:Ans(?:wer)?\s*[.:\-]*|A\s*[.:)])\s*(?:<\/strong>)?\s*/i;
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    // pattern 1: question and answer in one paragraph, the question bold:
    //   <p><strong>1. Q?</strong><br> Ans. A</p> | <p><strong>Q?</strong><br><strong>Ans.</strong> A</p>
    //   <p><strong>1. Q?<br> Ans. </strong> A</p> | <p><strong>1. Q?</strong> A</p>
    const one = b.match(/^<p><strong>([\s\S]*?)<\/strong>([\s\S]+)<\/p>$/);
    if (one) {
      const [qPart, ...inStrong] = one[1].split(/<br\s*\/?>/);
      let a = (inStrong.length ? inStrong.join('<br>') + ' ' : '') + one[2];
      a = a.replace(/^(?:\s|<br\s*\/?>)+/, '');
      const hadAns = ANS.test(a);
      a = a.replace(ANS, '').replace(/^(?:\s|<br\s*\/?>)+/, '').trim();
      const qt = text(qPart);
      if (a && text(a) && (/\?\s*$/.test(qt) || (QNUM.test(qt) && hadAns))) { items.push({ q: qPart.trim().replace(QNUM, ''), a: [a] }); continue; }
    }
    // pattern 2: a question line (heading or wholly bold paragraph) then answer paragraph(s)
    const q = b.match(/^<(?:h2|h3|h4)>(?:<strong>)?([\s\S]*?)(?:<\/strong>)?<\/(?:h2|h3|h4)>$/) || b.match(/^<p><strong>([\s\S]*?)<\/strong><\/p>$/);
    if (q && /\?\s*$/.test(text(q[1])) && blocks[i + 1] && !/^<(h2|h3|h4)>/.test(blocks[i + 1])) {
      const a = [];
      while (blocks[i + 1] && !/^<(h2|h3|h4)>/.test(blocks[i + 1]) && !/^<p><strong>[\s\S]*?\?\s*(<\/strong>)?\s*(<br|<\/p>)/.test(blocks[i + 1])) a.push(blocks[++i]);
      if (!a.length) return null;
      a[0] = a[0].replace(/^<p>\s*(?:<strong>\s*Ans(?:wer)?\s*[.:\-]*\s*<\/strong>|Ans(?:wer)?\s*[.:\-]+)\s*/i, '<p>');
      items.push({ q: q[1].trim().replace(QNUM, ''), a, block: true }); continue;
    }
    return null;
  }
  return items.length ? { before, title: text(m[2]), items } : null;
}

// a post newer than that listing: its live photo, saved as-is to /images/blog/ by --photos
const { imageSize } = require(W + '/utils/imageSize');
const photoFile = p => '/images/blog/' + p.image.split('/').pop().toLowerCase().replace(/[^a-z0-9.]+/g, '-');
function livePhoto(p) {
  const rel = photoFile(p);
  if (!fs.existsSync(W + '/public' + rel)) return null;
  const s = imageSize(rel);
  return s && { src: rel, alt: p.alt, width: s.width, height: s.height };
}
async function downloadPhotos() {
  for (const p of list) {
    const f = W + '/public' + photoFile(p);
    if (photos[p.url] || fs.existsSync(f)) continue;
    const r = await fetch(p.image, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126', Referer: 'https://www.drniveditadadu.com/' } });
    must(r.ok, 'photo ' + p.image);
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    console.log('downloaded', photoFile(p));
  }
}
if (process.argv.includes('--photos')) return downloadPhotos().catch(e => { console.error(e); process.exit(1); });

const posts = [], noFaq = [];
for (const p of list) {
  const f = path.join(SRC, p.slug + '.html');
  must(fs.existsSync(f), p.slug + ': not downloaded (run fetch-posts.js)');
  const s = fs.readFileSync(f, 'utf8');
  const h1 = (s.match(/<h1 class="page-title">([\s\S]*?)<\/h1>/) || [])[1];
  const title = (s.match(/<title>([^<]*)/) || [])[1];
  const desc = (s.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const a = s.indexOf('<div class="blogpost-content">'), e = s.indexOf('<!-- Tags -->', a);
  must(h1 && title && a > 0 && e > a, p.slug + ': page structure not recognised');
  const raw = s.slice(a + '<div class="blogpost-content">'.length, e).replace(/<\/div>\s*$/, '');
  const photo = photos[p.url] || livePhoto(p);
  must(photo, p.slug + ': no photo for ' + p.url + ' (run with --photos to download it)');
  let html = clean(raw), faq = splitFaq(html);
  if (faq) html = faq.before; else if (FAQ_HEAD.test(html)) noFaq.push(p.slug);
  posts.push({ ...p, h1: text(h1), seoTitle: dec(title.trim()), desc: dec((desc || p.excerpt).trim()), photo, html, faq, raw });
}

// ---- shared pieces
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const SOCIAL = [
  ['Facebook', 'https://www.facebook.com/daduskinclinic/', 'i-fb'], ['Instagram', 'https://www.instagram.com/dadumedicalcentre/', 'i-ig'],
  ['X (Twitter)', 'https://x.com/daduskinclinic', 'i-x'], ['YouTube', 'https://www.youtube.com/channel/UCEQOJDwT1HlQO0Jmo-kLRrg', 'i-yt'],
  ['LinkedIn', 'https://www.linkedin.com/company/dadu-medical-centre/', 'i-in']];
const hero = (h1, crumb) => `<section class="blg-hero">
  <div class="container">
    <h1 class="blg-hero-title">${esc(h1)}</h1>
    <nav aria-label="Breadcrumb"><ol class="blg-crumb"><li><a href="/">Home</a></li><li><span aria-current="page">${esc(crumb)}</span></li></ol></nav>
  </div>
</section>`;
const sidebar = () => `<aside class="blg-side">
      <div class="blg-side-inner">
        <form class="blg-search" action="/blog/" method="get" role="search">
          <input type="search" name="q" placeholder="Enter Key Word" aria-label="Search the blog">
          <button type="submit" aria-label="Search">${icon('i-find')}</button>
        </form>
        <div class="blg-widget">
          <h2 class="blg-side-title">Blog Categories</h2>
          <ul class="blg-cats"><li><a href="/blog/"><span>All Categories</span><span>( ${posts.length} )</span></a></li></ul>
        </div>
        <div class="blg-widget">
          <h2 class="blg-side-title">Recent Post</h2>
          <ul class="blg-recent">${posts.slice(0, RECENT).map(o => `
            <li class="blg-recent-item">
              <a class="blg-recent-thumb" href="/blog/${o.slug}/" tabindex="-1" aria-hidden="true"><img src="${o.photo.src}" alt="" width="${o.photo.width}" height="${o.photo.height}" loading="lazy" decoding="async"></a>
              <div><span class="blg-recent-date">${esc(o.date)}</span><a class="blg-recent-title" href="/blog/${o.slug}/">${esc(o.title)}</a></div>
            </li>`).join('')}
          </ul>
        </div>
      </div>
    </aside>`;

function faqHtml(faq) {
  return `
      <section class="blg-faq" aria-labelledby="blg-faq-title">
        <h2 class="blg-faq-title" id="blg-faq-title">${esc(faq.title)} ( ${faq.items.length} )</h2>
        <div class="blg-faq-list" data-blg-faq>${faq.items.map((it, i) => `
          <div class="blg-faq-item${i === 0 ? ' is-open' : ''}">
            <h3 class="blg-faq-q"><button type="button" aria-expanded="${i === 0}" aria-controls="blg-faq-a${i + 1}" id="blg-faq-b${i + 1}"><span class="blg-faq-num">Q${i + 1}.</span><span class="blg-faq-text">${it.q}</span><span class="blg-faq-chev">${icon('i-chev-d')}</span></button></h3>
            <div class="blg-faq-a" id="blg-faq-a${i + 1}" role="region" aria-labelledby="blg-faq-b${i + 1}"${i === 0 ? '' : ' hidden'}>
              <div class="blg-faq-a-inner">${it.block
                ? it.a.map((x, j) => j === 0 ? x.replace(/^<p>/, '<p><span class="blg-faq-ans">Ans.</span> ') : x).join('\n')
                : `<p><span class="blg-faq-ans">Ans.</span> ${it.a[0]}</p>`}</div>
            </div>
          </div>`).join('')}
        </div>
      </section>`;
}

function postPage(p) {
  return `{{> inner-page-start}}

${hero(p.h1, p.h1)}

<section class="blg-detail">
  <div class="container blg-grid">
    <article class="blg-main">
      <div class="blg-cover"><img src="${p.photo.src}" alt="${esc(p.photo.alt)}" width="${p.photo.width}" height="${p.photo.height}" fetchpriority="high" decoding="async"></div>
      <div class="blg-meta">
        <span class="blg-meta-item">${icon('i-cal')}${esc(p.date)}</span>
        <span class="blg-meta-item">${icon('i-user')}By ${esc(p.author || 'Dr Nivedita Dadu')}</span>
        <span class="blg-meta-item">${icon('i-comment')}Comments ( 0 )</span>
      </div>
      <h2 class="blg-title">${esc(p.h1)}</h2>
      <div class="blg-body">
${p.html}
      </div>${p.faq ? faqHtml(p.faq) : ''}
      <div class="blg-share">
        <span class="blg-share-label">Follow Us On :</span>
        <div class="blg-share-icons">${SOCIAL.map(([n, u, i]) => `<a href="${u}" target="_blank" rel="noopener noreferrer" aria-label="${n}">${icon(i, 'ico ico-fill')}</a>`).join('')}</div>
      </div>
      <div class="blg-comments">
        <h3 class="blg-section-title">Comments ( 0 )</h3>
        <p>No comments yet. Be the first to reply!</p>
      </div>
      <div class="blg-reply">
        <h3 class="blg-section-title">Leave A Reply</h3>
        <p class="blg-reply-sub">Your Email Address Will Not Be Published. Required Fields Are Marked *</p>
        <form class="blg-reply-form" data-comment-form>
          <input type="hidden" name="post" value="${p.slug}">
          <div class="blg-reply-row">
            <input type="text" name="name" placeholder="Name*" aria-label="Name" autocomplete="name" required>
            <input type="email" name="email" placeholder="Your Email*" aria-label="Your Email" autocomplete="email" required>
          </div>
          <textarea name="message" rows="5" placeholder="Your Message*" aria-label="Your Message" required></textarea>
          <button class="blg-reply-submit" type="submit">Post Comment ${icon('i-send')}</button>
          <p class="blg-reply-status" role="status" hidden></p>
        </form>
      </div>
    </article>
    ${sidebar()}
  </div>
</section>

{{> inner-page-end}}
`;
}

function listingPage() {
  return `{{> inner-page-start}}

${hero('Blog', 'Blog')}

<section class="blg-listing" data-blog data-blog-search data-per-page="${PER_PAGE}">
  <div class="container blg-list-grid">
    <div class="blg-list-main">
      <p class="blg-search-note" role="status" hidden></p>
      <div class="blg-cards">${posts.map((p, i) => `
        <article class="blg-card" data-item data-search="${esc((p.title + ' ' + p.excerpt).toLowerCase())}">
          <div class="blg-card-media">
            <a href="/blog/${p.slug}/" tabindex="-1" aria-hidden="true"><img src="${p.photo.src}" alt="${esc(p.photo.alt)}" width="${p.photo.width}" height="${p.photo.height}"${i >= 2 ? ' loading="lazy"' : ''} decoding="async"></a>
            <span class="blg-card-date">${esc(p.date)}</span>
          </div>
          <div class="blg-card-author"><span class="blg-card-author-icon">${icon('i-user')}</span><span>${esc(p.author)}</span></div>
          <h2 class="blg-card-title"><a href="/blog/${p.slug}/">${esc(p.title)}</a></h2>
          <p class="blg-card-text">${esc(p.excerpt)}</p>
          <a class="blg-card-more" href="/blog/${p.slug}/" aria-label="Explore More: ${esc(p.title)}">Explore More</a>
        </article>`).join('')}
      </div>
      <nav class="blog-pagination" aria-label="Blog pages" hidden></nav>
    </div>
    ${sidebar()}
  </div>
</section>

{{> inner-page-end}}
`;
}

// ---- checks: every sentence of every live post survives, nothing points back to the live blog
// page text without this layout's own FAQ labels; a source block without its leading "1." / "Ans."
const normOut = s => text(s.replace(/<span class="blg-faq-(?:num|ans)">[^<]*<\/span>/g, ' '));
const norm = s => text(s).replace(/^(?:Q\s*)?\d{1,2}\s*[.):]\s*/i, '').replace(/^(?:Ans(?:wer)?\s*[.:\-]*|A\s*[.:)])\s*/i, '').trim();
let faqs = 0;
for (const p of posts) {
  p.page = postPage(p);
  const out = normOut(p.page);
  // each block of the source (paragraph, heading, list item, cell, line) checked sentence by sentence
  const src = p.raw.replace(/<div class="carousel[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '')
    .split(/<\/(?:p|h[1-6]|li|td|th|tr|div)>|<br\s*\/?>/).map(norm).filter(Boolean);
  const lost = src.flatMap(b => b.split(/(?<=[.?!])\s+/)).filter(x => x.length > 3 && !out.includes(x));
  must(!lost.length, p.slug + ': text lost: ' + lost.slice(0, 3).join(' | '));
  must(!/drniveditadadu\.com\/blog\/(?!tag\/)[a-z0-9-]+/i.test(p.page.replace(/href="[^"]*"/g, m => slugs.has((m.match(/\/blog\/([^/"]+)/) || [])[1]) ? m : '')), p.slug + ': link to a live blog post left');
  must(!/\{\{(?!> )/.test(p.page.replace(/\{\{> [a-z-]+\}\}/g, '')), p.slug + ': stray template tag');
  if (p.faq) faqs++;
}
const listing = listingPage();
// tools/db/seed-blogs.js reads the parsed posts (and the exact rendered pages, to compare against)
if (require.main !== module) return void (module.exports = { posts, listing });
console.log(`${posts.length} posts, ${faqs} with FAQ accordion` + (noFaq.length ? `, FAQ kept as text in: ${noFaq.join(', ')}` : ''));

if (WRITE) {
  const old = fs.readdirSync(W + '/views').filter(f => /^blog-.+\.html$/.test(f));
  for (const f of old) if (!posts.some(p => `blog-${p.slug}.html` === f)) fs.unlinkSync(W + '/views/' + f);
  for (const p of posts) fs.writeFileSync(`${W}/views/blog-${p.slug}.html`, p.page);
  fs.writeFileSync(W + '/views/blog.html', listing);
  const cf = W + '/config/pages.blog.json';
  const index = JSON.parse(fs.readFileSync(cf, 'utf8')).find(e => e.path === '/blog/');
  index.breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog/' }];
  const entries = [index, ...posts.map(p => ({ path: `/blog/${p.slug}/`, view: `blog-${p.slug}`, title: p.seoTitle, description: p.desc,
    image: { path: p.photo.src, width: p.photo.width, height: p.photo.height, alt: p.photo.alt },
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog/' }, { name: p.h1, path: `/blog/${p.slug}/` }] }))];
  fs.writeFileSync(cf, JSON.stringify(entries, null, 2) + '\n');
  console.log('WROTE', posts.length, 'post views + listing; removed', old.length - old.filter(f => posts.some(p => `blog-${p.slug}.html` === f)).length, 'old views');
}
