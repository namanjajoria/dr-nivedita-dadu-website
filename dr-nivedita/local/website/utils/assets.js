'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

// Adds a content hash to CSS/JS URLs so browsers can cache them for a long time
// and still pick up changes immediately after a deploy.
const versions = new Map();

function assetUrl(publicPath) {
  let version = config.isProduction ? versions.get(publicPath) : undefined;
  if (!version) {
    const contents = fs.readFileSync(path.join(config.root, 'public', publicPath));
    version = crypto.createHash('sha1').update(contents).digest('hex').slice(0, 10);
    versions.set(publicPath, version);
  }
  return `${publicPath}?v=${version}`;
}

module.exports = { assetUrl };
