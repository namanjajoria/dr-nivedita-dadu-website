'use strict';

const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const pages = require('../config/pages');
const blog = require('../content/blog');
const { absoluteUrl } = require('../utils/seo');
const { escapeHtml } = require('../utils/template');

function robotsTxt(req, res) {
  const lines = config.seo.allowIndexing
    ? ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${absoluteUrl('/sitemap.xml')}`]
    : ['# Search engine indexing is disabled for this environment (see SEO_ALLOW_INDEXING).', 'User-agent: *', 'Disallow: /'];
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(`${lines.join('\n')}\n`);
}

const day = (value) => new Date(value).toISOString().slice(0, 10);

// <lastmod>: a view page's file date; a database page's last update.
function lastModified(page) {
  return day(fs.statSync(path.join(config.root, 'views', `${page.view}.html`)).mtime);
}

const entry = (pathname, lastmod) =>
  `  <url>\n    <loc>${escapeHtml(absoluteUrl(pathname))}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;

async function sitemapXml(req, res, next) {
  try {
    const posts = (await blog.loadPosts()) || [];
    const latest = posts.reduce((max, p) => (p.updated && p.updated > max ? p.updated : max), '');
    const entries = [];
    for (const page of pages) {
      if (page.sitemap === false) continue;
      if (page.dynamic === 'blog') {
        entries.push(entry(page.path, latest ? day(latest) : ''));
        for (const p of posts) entries.push(entry(`/blog/${p.slug}/`, p.updated ? day(p.updated) : ''));
      } else {
        entries.push(entry(page.path, lastModified(page)));
      }
    }
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      '</urlset>',
      '',
    ].join('\n');
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
  } catch (error) {
    next(error);
  }
}

module.exports = { robotsTxt, sitemapXml };
