// Puts every blog post into the `blogs` table, exactly as tools/blog/build-blog.js parses
// them from the live drniveditadadu.com posts (text, FAQs, photo, date, SEO).
//   - photos point at Supabase Storage (uploaded by tools/db/upload-images.js)
//   - the few images inside post bodies that still load from drniveditadadu.com are copied
//     to Storage first (site/blog/body/<file>)
//   - FAQs go into `faqs` as [{question, answer}] (the admin's shape); the FAQ heading the
//     post uses ("FAQs", "Frequently Asked Questions"...) goes into `admin_description`,
//     the only blog field the website does not show otherwise
//   - created_at keeps the live order (newest first), which is how the API sorts
// Re-running updates rows by slug. Usage: node tools/db/seed-blogs.js [--dry] [--only <slug>...]
// (--only leaves every other row, and any admin edit in it, untouched)
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const API = path.join(ROOT, 'local/api');
require(path.join(API, 'node_modules/dotenv')).config({ path: path.join(API, '.env') });
const { createClient } = require(path.join(API, 'node_modules/@supabase/supabase-js'));
const { posts } = require(path.join(ROOT, 'tools/blog/build-blog.js'));

const DRY = process.argv.includes('--dry');
const ONLY = process.argv.includes('--only') ? process.argv.slice(process.argv.indexOf('--only') + 1) : null;
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const MEDIA = `${process.env.SUPABASE_URL}/storage/v1/object/public/images/site`;
const media = (src) => (src.startsWith('/images/') ? `${MEDIA}/${src.slice('/images/'.length)}` : src);
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// "24 Oct 2026" -> noon in India. Midday keeps the same calendar day in UTC, which is what
// the admin's date field reads and writes back (a midnight-India time would be the day before).
function blogDate(s) {
  const m = s.match(/^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/);
  if (!m || !(m[2] in MONTHS)) throw new Error('unknown date ' + s);
  return new Date(Date.UTC(+m[3], MONTHS[m[2]], +m[1], 6, 30));
}

async function mirrorBodyImages(html) {
  const found = [...html.matchAll(/src="(https:\/\/www\.drniveditadadu\.com\/images\/blog\/([^"]+))"/g)];
  for (const [, url, file] of found) {
    const key = `site/blog/body/${file}`;
    if (!DRY) {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/126', Referer: 'https://www.drniveditadadu.com/' } });
      if (!r.ok) throw new Error(`download ${url}: HTTP ${r.status}`);
      const type = /\.png$/i.test(file) ? 'image/png' : 'image/jpeg';
      const { error } = await sb.storage.from('images').upload(key, Buffer.from(await r.arrayBuffer()), { contentType: type, upsert: true, cacheControl: '31536000' });
      if (error) throw new Error(`upload ${key}: ${error.message}`);
    }
    html = html.split(url).join(`${MEDIA}/blog/body/${file}`);
  }
  return { html, count: found.length };
}

(async () => {
  const rows = [];
  let bodyImages = 0;
  for (const [i, p] of posts.entries()) {
    const { html, count } = await mirrorBodyImages(p.html);
    bodyImages += count;
    const date = blogDate(p.date);
    rows.push({
      title: p.h1.replace(/&quot;/g, '"'),
      slug: p.slug,
      author: p.author,
      show_type: 'Inside',
      layout_type: 'Left',
      short_description: p.excerpt,
      // the admin's editor keeps tables only inside <div class="table-responsive"> (its
      // "blogTable" block); content/blog.js shows that wrapper with the site's blg-table style
      // and a list item whose paragraph is followed by loose text ("<li><p>A</p>b. text</li>")
      // would open as two items there, so the paragraph end becomes a line break
      full_description: html
        .replace(/<div class="blg-table">/g, '<div class="table-responsive">')
        .replace(/<li><p>((?:(?!<\/?(?:li|p)\b)[\s\S])*)<\/p>\s*(?=[^<\s])/g, '<li>$1<br />\n'),
      blog_image: media(p.photo.src),
      banner_image: media(p.photo.src),
      alt_tag: p.photo.alt,
      blog_date: date.toISOString(),
      // newest first; posts sharing a date keep their live order
      created_at: new Date(date.getTime() + (posts.length - i) * 1000).toISOString(),
      meta_title: p.seoTitle,
      meta_description: p.desc,
      faqs: p.faq ? p.faq.items.map((it) => ({ question: it.q, answer: it.a.join('\n') })) : [],
      admin_description: p.faq ? p.faq.title : '',
      status: 'Published',
    });
  }
  console.log(`${rows.length} posts, ${rows.filter((r) => r.faqs.length).length} with FAQs, ${bodyImages} body images copied to Storage`);
  fs.writeFileSync(path.join(ROOT, 'backups/db-migration/blogs-seed.json'), JSON.stringify(rows, null, 1));
  if (DRY) return;

  const { data: existing, error: readError } = await sb.from('blogs').select('id,slug');
  if (readError) throw readError;
  const idBySlug = new Map(existing.map((r) => [r.slug, r.id]));
  const chosen = ONLY ? rows.filter((r) => ONLY.includes(r.slug)) : rows;
  const inserts = chosen.filter((r) => !idBySlug.has(r.slug));
  const updates = chosen.filter((r) => idBySlug.has(r.slug));
  for (let k = 0; k < inserts.length; k += 50) {
    const { error } = await sb.from('blogs').insert(inserts.slice(k, k + 50));
    if (error) throw error;
  }
  for (const { created_at, ...r } of updates) { // an existing row keeps its place in the order
    const { error } = await sb.from('blogs').update({ ...r, updated_at: new Date().toISOString() }).eq('id', idBySlug.get(r.slug));
    if (error) throw error;
  }
  const { count } = await sb.from('blogs').select('*', { count: 'exact', head: true });
  console.log(`inserted ${inserts.length}, updated ${updates.length}; blogs table now has ${count} rows`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
