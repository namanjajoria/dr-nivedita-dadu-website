'use strict';

const site = require('../config/site');
const { render } = require('../utils/template');
const { assetUrl } = require('../utils/assets');

// Themed page for 404s, server errors and form results when JavaScript is unavailable.
function sendStatusPage(res, { status, label, heading, message, primaryHref = '/', primaryLabel = 'Back to Home' }) {
  const html = render('status', {
    lang: site.language,
    siteName: site.name,
    pageTitle: `${heading} | ${site.name}`,
    statusLabel: label || (status >= 400 ? `Error ${status}` : 'Thank you'),
    heading,
    message,
    primaryHref,
    primaryLabel,
    phoneDisplay: site.phone.display,
    phoneE164: site.phone.e164,
    cssUrl: assetUrl('/css/main.css'),
  });
  res.status(status).set('Cache-Control', 'no-store').type('html').send(html);
}

module.exports = { sendStatusPage };
