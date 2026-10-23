'use strict';

const redirects = require('../config/redirects');

const normalise = (pathname) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);
const targets = new Map(redirects.map(({ from, to }) => [normalise(from), to]));

// Applies the permanent redirects listed in config/redirects.js.
function permanentRedirects(req, res, next) {
  if (!targets.size || (req.method !== 'GET' && req.method !== 'HEAD')) return next();
  const target = targets.get(normalise(req.path));
  if (!target) return next();
  const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  return res.redirect(301, `${target}${query}`);
}

module.exports = { permanentRedirects };
