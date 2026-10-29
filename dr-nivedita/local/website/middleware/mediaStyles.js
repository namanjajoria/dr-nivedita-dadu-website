'use strict';

const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const { rewriteMedia } = require('../utils/media');

// Serves public/css/*.css with their /images/... url() values pointing at Storage.
// Only active with MEDIA_BASE_URL; otherwise express.static serves the files untouched.
const CSS_DIR = path.join(config.root, 'public', 'css');
const cache = new Map();

function mediaStyles(req, res, next) {
  if (!config.media.enabled || !/^\/css\/[\w.-]+\.css$/.test(req.path)) return next();
  const file = path.join(CSS_DIR, path.basename(req.path));
  let css = config.isProduction ? cache.get(file) : undefined;
  if (css === undefined) {
    try {
      css = rewriteMedia(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return next();
      return next(error);
    }
    if (config.isProduction) cache.set(file, css);
  }
  // CSS URLs carry a content hash (utils/assets.js), so a long cache is safe in production.
  res.set('Cache-Control', config.isProduction ? 'public, max-age=2592000' : 'no-cache').type('css').send(css);
}

// Hosts like Hostinger (Passenger) serve an app's public/ folder directly, before any request
// reaches Express, so mediaStyles() never sees those stylesheets. In production the files
// themselves are rewritten once at startup instead (idempotent: a rewritten file has no
// /images/ paths left). Never runs in development, so the source files stay untouched.
function writeMediaStyles() {
  if (!config.isProduction || !config.media.enabled) return;
  for (const name of fs.readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'))) {
    const file = path.join(CSS_DIR, name);
    const css = fs.readFileSync(file, 'utf8');
    const rewritten = rewriteMedia(css);
    if (rewritten !== css) fs.writeFileSync(file, rewritten);
  }
}

module.exports = { mediaStyles, writeMediaStyles };
