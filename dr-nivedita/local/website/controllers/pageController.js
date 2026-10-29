'use strict';

const { render, renderSource, loadView } = require('../utils/template');
const { buildPageMeta } = require('../utils/seo');
const { buildStructuredData, extractFaqs } = require('../utils/structuredData');
const formTokens = require('../services/formTokenService');
const { rewriteMedia } = require('../utils/media');

// Template values every page gets: meta tags, structured data and a fresh form token
// (which is why HTML is rendered per request).
function pageValues(page, faqs, extra = {}) {
  return {
    ...buildPageMeta(page),
    ...extra,
    // Header/footer links to homepage sections: "#videos" on the homepage, "/#videos" elsewhere.
    homeHref: page.path === '/' ? '' : '/',
    structuredData: buildStructuredData(page, faqs),
    formToken: formTokens.issue(),
  };
}

function send(res, html) {
  res.set('Cache-Control', 'no-cache').type('html').send(rewriteMedia(html));
}

// Renders a page defined in config/pages.js.
//
// A page with `content` (a module in /content) is filled from admin-managed data:
// the module returns the template values plus the FAQs it rendered, so structured
// data always matches what visitors see.
function renderPage(page) {
  const contentModule = page.content ? require(`../content/${page.content}`) : null;

  return async function pageHandler(req, res, next) {
    try {
      const content = contentModule ? await contentModule.build() : { values: {}, faqs: extractFaqs(loadView(page.view)) };
      send(res, render(page.view, pageValues(page, content.faqs, content.values)));
    } catch (error) {
      next(error);
    }
  };
}

// Inner-page frame (site header, footer, scripts) around body markup built from database
// content. The body is inserted as-is, never parsed as a template.
const INNER_FRAME = '{{> inner-page-start}}\n\n{{{pageBody}}}\n\n{{> inner-page-end}}\n';

function sendInnerPage(res, page, body) {
  send(res, renderSource('inner-frame', INNER_FRAME, pageValues(page, extractFaqs(body), { pageBody: body })));
}

module.exports = { renderPage, sendInnerPage };
