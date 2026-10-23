'use strict';

const crypto = require('node:crypto');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// Load .env when present (built into Node, no dotenv dependency). Real environment
// variables always win over values in the file.
try {
  process.loadEnvFile(path.join(ROOT, '.env'));
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

const env = process.env;
const isProduction = env.NODE_ENV === 'production';
const port = toInt(env.PORT, 3000);

function toInt(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function toNonNegativeInt(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function toBool(value, fallback) {
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function parseTrustProxy(value) {
  if (value === undefined || value === '' || value === 'false') return false;
  if (value === 'true') return true;
  const hops = Number(value);
  return Number.isInteger(hops) ? hops : value;
}

// One public origin drives canonical URLs, Open Graph, robots.txt and sitemap.xml.
function resolveSiteUrl() {
  const raw = (env.SITE_URL || (isProduction ? '' : `http://localhost:${port}`)).trim();
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('SITE_URL must be an absolute URL, for example https://www.drniveditadadu.com');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`SITE_URL must use http or https (got "${url.protocol}").`);
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be the bare origin without a path, query or hash.');
  }
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(url.hostname);
  if (isProduction && (isLocal || url.protocol !== 'https:')) {
    throw new Error(`SITE_URL "${raw}" is not a public https domain; refusing to use it as the production canonical URL.`);
  }
  return { origin: url.origin, isLocal };
}

function resolveFormSecret() {
  const secret = (env.FORM_SECRET || '').trim();
  if (secret.length >= 32) return { value: secret, ephemeral: false };
  if (isProduction) throw new Error('FORM_SECRET must be set to a random string of at least 32 characters in production.');
  return { value: crypto.randomBytes(32).toString('hex'), ephemeral: true };
}

const site = resolveSiteUrl();
const formSecret = resolveFormSecret();
const smtpPort = toInt(env.SMTP_PORT, 587);
const mail = {
  host: (env.SMTP_HOST || '').trim(),
  port: smtpPort,
  secure: toBool(env.SMTP_SECURE, smtpPort === 465),
  user: (env.SMTP_USER || '').trim(),
  pass: env.SMTP_PASS || '',
  from: (env.MAIL_FROM || '').trim(),
  to: (env.MAIL_TO || '').trim(),
};
mail.enabled = Boolean(mail.host && mail.from && mail.to);

// The backend API (admin-managed content and form storage). Without API_BASE_URL the
// site still works: forms use the site's own delivery and pages show their bundled
// default content (content/*.json).
const api = {
  baseUrl: (env.API_BASE_URL || '').trim(),
  // Form submissions.
  timeoutMs: toInt(env.API_TIMEOUT_MS, 10000),
  // Page content: short, so a slow API never holds a page up for long.
  contentTimeoutMs: toInt(env.API_CONTENT_TIMEOUT_MS, 3000),
  // How long admin edits may take to appear. 0 (the development default) reads on every request.
  contentCacheSeconds: toNonNegativeInt(env.API_CONTENT_CACHE_SECONDS, isProduction ? 60 : 0),
  // Where uploaded admin images are served from, allowed by the Content Security Policy.
  mediaOrigins: (env.API_MEDIA_ORIGINS || 'https://*.supabase.co').split(',').map((s) => s.trim()).filter(Boolean),
};
api.enabled = Boolean(api.baseUrl);

module.exports = Object.freeze({
  root: ROOT,
  env: isProduction ? 'production' : 'development',
  isProduction,
  port,
  siteUrl: site.origin,
  trustProxy: parseTrustProxy(env.TRUST_PROXY),
  seo: {
    // Never index a localhost origin; otherwise default to indexing only in production.
    allowIndexing: site.isLocal ? false : toBool(env.SEO_ALLOW_INDEXING, isProduction),
  },
  forms: {
    secret: formSecret.value,
    secretIsEphemeral: formSecret.ephemeral,
    rateLimit: {
      windowMs: toInt(env.FORM_RATE_LIMIT_WINDOW_MINUTES, 15) * 60 * 1000,
      max: toInt(env.FORM_RATE_LIMIT_MAX, 10),
    },
  },
  mail: Object.freeze(mail),
  api: Object.freeze(api),
});
