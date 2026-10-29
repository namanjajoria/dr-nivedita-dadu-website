'use strict';

const config = require('../config');

// Maps site image paths to Supabase Storage and back.
//   /images/about/x.webp  <->  <MEDIA_BASE_URL>/about/x.webp
// Content saved through the admin already carries full Storage URLs; these helpers cover
// the paths written in templates, stylesheets and content seeded from them.
const PREFIX = '/images/';

function mediaUrl(src) {
  if (!config.media.enabled || typeof src !== 'string' || !src.startsWith(PREFIX)) return src;
  return config.media.baseUrl + '/' + src.slice(PREFIX.length);
}

// The /images/... path a Storage URL was made from, or null for any other URL.
function localPath(src) {
  if (!config.media.enabled || typeof src !== 'string' || !src.startsWith(config.media.baseUrl + '/')) return null;
  return PREFIX + src.slice(config.media.baseUrl.length + 1);
}

// Rewrites /images/... references in HTML attributes, srcset lists and CSS url() values.
// Only paths that start right after a quote, "(", "," or whitespace are touched, so text
// that merely mentions "/images/" inside a longer URL is left alone.
const REFERENCE = /(["'(,\s=])\/images\//g;

function rewriteMedia(source) {
  if (!config.media.enabled) return source;
  return source.replace(REFERENCE, `$1${config.media.baseUrl}/`);
}

module.exports = { mediaUrl, localPath, rewriteMedia };
