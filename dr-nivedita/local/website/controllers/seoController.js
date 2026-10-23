'use strict';

const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const pages = require('../config/pages');
const { absoluteUrl } = require('../utils/seo');
const { escapeHtml } = require('../utils/template');

function robotsTxt(req, res) {
  const lines = config.seo.allowIndexing
    ? ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${absoluteUrl('/sitemap.xml')}`]
    : ['# Search engine indexing is disabled for this environment (see SEO_ALLOW_INDEXING).', 'User-agent: *', 'Disallow: /'];
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(`${lines.join('\n')}\n`);
}

// <lastmod> is the modification date of the page's view file.
function lastModified(page) {
  return fs.statSync(path.join(config.root, 'views', `${page.view}.html`)).mtime.toISOString().slice(0, 10);
}

function sitemapXml(req, res) {
  const entries = pages
    .filter((page) => page.sitemap !== false)
    .map(
      (page) =>
        `  <url>\n    <loc>${escapeHtml(absoluteUrl(page.path))}</loc>\n    <lastmod>${lastModified(page)}</lastmod>\n  </url>`,
    );
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
}

module.exports = { robotsTxt, sitemapXml };
