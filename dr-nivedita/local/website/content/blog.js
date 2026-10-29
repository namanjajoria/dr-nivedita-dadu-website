'use strict';

const { getSection } = require('../services/contentService');
const { imageSize } = require('../utils/imageSize');
const { escapeHtml: esc } = require('../utils/template');

// Blog listing (/blog/) and posts (/blog/<slug>/) rendered from the `blogs` table via
// GET /api/blogs. The markup is the dadumedicalcentre.com blog layout (blg-* classes in
// pages.css) that tools/blog/build-blog.js used to write as static views.
const RECENT = 4;
const PER_PAGE = 10;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SOCIAL = [
  ['Facebook', 'https://www.facebook.com/daduskinclinic/', 'i-fb'],
  ['Instagram', 'https://www.instagram.com/dadumedicalcentre/', 'i-ig'],
  ['X (Twitter)', 'https://x.com/daduskinclinic', 'i-x'],
  ['YouTube', 'https://www.youtube.com/channel/UCEQOJDwT1HlQO0Jmo-kLRrg', 'i-yt'],
  ['LinkedIn', 'https://www.linkedin.com/company/dadu-medical-centre/', 'i-in'],
];
const DEFAULT_FAQ_TITLE = 'Frequently Asked Questions';
const BLOCK = /^\s*<(p|ul|ol|h[2-6]|div|table)\b/i;

// "07 Mar 2026", in India time
function formatDate(value) {
  const d = new Date(new Date(value).getTime() + 330 * 60 * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function toPost(b) {
  const size = imageSize(b.blogImage) || {};
  const faqs = (Array.isArray(b.faqs) ? b.faqs : []).filter((f) => f && f.question && f.answer);
  return {
    slug: String(b.slug || '').trim(),
    title: b.title || '',
    excerpt: b.shortDescription || '',
    date: formatDate(b.blogDate || b.createdAt),
    author: b.author || 'Dr Nivedita Dadu',
    photo: { src: b.blogImage || '', alt: b.altTag || '', width: size.width, height: size.height },
    html: b.fullDescription || '',
    faq: faqs.length ? { title: (b.adminDescription || '').trim() || DEFAULT_FAQ_TITLE, items: faqs } : null,
    updated: b.updatedAt || b.createdAt || null,
    seoTitle: b.metaTitle || b.title || '',
    description: b.metaDescription || b.shortDescription || '',
  };
}

// Published posts, newest first (the API's order). null when the API has nothing to give.
async function loadPosts() {
  const data = await getSection('blogs');
  if (!Array.isArray(data)) return null;
  return data.filter((b) => String(b.status || '').toLowerCase() === 'published' && b.slug).map(toPost);
}

// ---- markup
const icon = (id, cls = 'ico') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const dims = (photo) => (photo.width && photo.height ? ` width="${photo.width}" height="${photo.height}"` : '');

const hero = (h1, crumb) => `<section class="blg-hero">
  <div class="container">
    <h1 class="blg-hero-title">${esc(h1)}</h1>
    <nav aria-label="Breadcrumb"><ol class="blg-crumb"><li><a href="/">Home</a></li><li><span aria-current="page">${esc(crumb)}</span></li></ol></nav>
  </div>
</section>`;

const sidebar = (posts) => `<aside class="blg-side">
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
          <ul class="blg-recent">${posts.slice(0, RECENT).map((o) => `
            <li class="blg-recent-item">
              <a class="blg-recent-thumb" href="/blog/${o.slug}/" tabindex="-1" aria-hidden="true"><img src="${esc(o.photo.src)}" alt=""${dims(o.photo)} loading="lazy" decoding="async"></a>
              <div><span class="blg-recent-date">${esc(o.date)}</span><a class="blg-recent-title" href="/blog/${o.slug}/">${esc(o.title)}</a></div>
            </li>`).join('')}
          </ul>
        </div>
      </div>
    </aside>`;

// An answer saved as blocks (<p>, lists...) keeps them, "Ans." opening its first paragraph;
// an inline answer becomes one paragraph.
function answerHtml(answer) {
  if (BLOCK.test(answer)) return answer.trim().replace(/^<p>/, '<p><span class="blg-faq-ans">Ans.</span> ');
  return `<p><span class="blg-faq-ans">Ans.</span> ${answer}</p>`;
}

function faqHtml(faq) {
  return `
      <section class="blg-faq" aria-labelledby="blg-faq-title">
        <h2 class="blg-faq-title" id="blg-faq-title">${esc(faq.title)} ( ${faq.items.length} )</h2>
        <div class="blg-faq-list" data-blg-faq>${faq.items.map((it, i) => `
          <div class="blg-faq-item${i === 0 ? ' is-open' : ''}">
            <h3 class="blg-faq-q"><button type="button" aria-expanded="${i === 0}" aria-controls="blg-faq-a${i + 1}" id="blg-faq-b${i + 1}"><span class="blg-faq-num">Q${i + 1}.</span><span class="blg-faq-text">${it.question}</span><span class="blg-faq-chev">${icon('i-chev-d')}</span></button></h3>
            <div class="blg-faq-a" id="blg-faq-a${i + 1}" role="region" aria-labelledby="blg-faq-b${i + 1}"${i === 0 ? '' : ' hidden'}>
              <div class="blg-faq-a-inner">${answerHtml(it.answer)}</div>
            </div>
          </div>`).join('')}
        </div>
      </section>`;
}

function postBody(p, posts) {
  return `${hero(p.title, p.title)}

<section class="blg-detail">
  <div class="container blg-grid">
    <article class="blg-main">
      <div class="blg-cover"><img src="${esc(p.photo.src)}" alt="${esc(p.photo.alt)}"${dims(p.photo)} fetchpriority="high" decoding="async"></div>
      <div class="blg-meta">
        <span class="blg-meta-item">${icon('i-cal')}${esc(p.date)}</span>
        <span class="blg-meta-item">${icon('i-user')}By ${esc(p.author)}</span>
        <span class="blg-meta-item">${icon('i-comment')}Comments ( 0 )</span>
      </div>
      <h2 class="blg-title">${esc(p.title)}</h2>
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
          <input type="hidden" name="post" value="${esc(p.slug)}">
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
    ${sidebar(posts)}
  </div>
</section>`;
}

function listingBody(posts) {
  return `${hero('Blog', 'Blog')}

<section class="blg-listing" data-blog data-blog-search data-per-page="${PER_PAGE}">
  <div class="container blg-list-grid">
    <div class="blg-list-main">
      <p class="blg-search-note" role="status" hidden></p>
      <div class="blg-cards">${posts.map((p, i) => `
        <article class="blg-card" data-item data-search="${esc((p.title + ' ' + p.excerpt).toLowerCase())}">
          <div class="blg-card-media">
            <a href="/blog/${p.slug}/" tabindex="-1" aria-hidden="true"><img src="${esc(p.photo.src)}" alt="${esc(p.photo.alt)}"${dims(p.photo)}${i >= 2 ? ' loading="lazy"' : ''} decoding="async"></a>
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
    ${sidebar(posts)}
  </div>
</section>`;
}

module.exports = { loadPosts, postBody, listingBody };
