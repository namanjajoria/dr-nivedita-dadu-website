// Creates the "Blog Page" settings (cms_sections key blog_page, edited in the admin under
// Pages -> Blog Page) with what the blog listing shows today. Without this row the admin
// screen crashes (it expects hero/listing objects) and the site falls back to its defaults.
// Leaves an existing row alone unless --force. Usage: node tools/db/seed-blog-page.js [--force]
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const API = path.join(ROOT, 'local/api');
require(path.join(API, 'node_modules/dotenv')).config({ path: path.join(API, '.env') });
const { createClient } = require(path.join(API, 'node_modules/@supabase/supabase-js'));
const listing = require(path.join(ROOT, 'local/website/config/pages.blog.json')).find((p) => p.path === '/blog/');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const data = {
  hero: { title: 'Blog', breadcrumbText: 'Blog', bannerImage: '', overlayOpacity: 0.5, bannerHeight: '400px' },
  listing: {
    sidebarSearchPlaceholder: 'Enter Key Word',
    sidebarCategoriesTitle: 'Blog Categories',
    sidebarRecentPostsTitle: 'Recent Post',
    promoImage: '',
    promoLink: '',
    promoButtonText: '',
    // the site counts its own posts; this list only keeps the admin from showing sample categories
    categories: [{ name: 'All Categories', count: 0 }],
    recentPosts: [],
  },
  seo: { metaTitle: listing.title, metaDescription: listing.description, keywords: '', canonicalUrl: '', ogImage: '', schema: '' },
};

(async () => {
  const { data: row, error } = await sb.from('cms_sections').select('key').eq('key', 'blog_page').maybeSingle();
  if (error) throw error;
  if (row && !process.argv.includes('--force')) return console.log('blog_page already exists - left as it is (use --force to replace)');
  const { error: e } = await sb.from('cms_sections').upsert({ key: 'blog_page', data, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (e) throw e;
  console.log('blog_page settings saved');
})().catch((e) => { console.error(e.message || e); process.exit(1); });
