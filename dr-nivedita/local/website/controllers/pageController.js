'use strict';

const { render, loadView } = require('../utils/template');
const { buildPageMeta } = require('../utils/seo');
const { buildStructuredData, extractFaqs } = require('../utils/structuredData');
const formTokens = require('../services/formTokenService');

// Renders a page defined in config/pages.js. HTML is rendered per request because
// each response carries a fresh form token.
//
// A page with `content` (a module in /content) is filled from admin-managed data:
// the module returns the template values plus the FAQs it rendered, so structured
// data always matches what visitors see.
function renderPage(page) {
  const contentModule = page.content ? require(`../content/${page.content}`) : null;

  return async function pageHandler(req, res, next) {
    try {
      const content = contentModule ? await contentModule.build() : { values: {}, faqs: extractFaqs(loadView(page.view)) };
      const html = render(page.view, {
        ...buildPageMeta(page),
        ...content.values,
        // Header/footer links to homepage sections: "#videos" on the homepage, "/#videos" elsewhere.
        homeHref: page.path === '/' ? '' : '/',
        structuredData: buildStructuredData(page, content.faqs),
        formToken: formTokens.issue(),
      });
      res.set('Cache-Control', 'no-cache').type('html').send(html);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { renderPage };
