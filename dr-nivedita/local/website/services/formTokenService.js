'use strict';

const crypto = require('node:crypto');
const config = require('../config');

// Basic bot protection: every rendered page carries a signed timestamp. Submissions
// with a forged or stale token, or sent faster than a person could fill the form,
// are rejected before validation.
const MIN_FILL_TIME_MS = 3 * 1000;
const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;

function sign(timestamp) {
  return crypto.createHmac('sha256', config.forms.secret).update(String(timestamp)).digest('base64url');
}

function issue(now = Date.now()) {
  return `${now}.${sign(now)}`;
}

// Returns 'ok', 'invalid', 'too-fast' or 'expired'.
function verify(token, now = Date.now()) {
  const [timestampPart, signature] = typeof token === 'string' ? token.split('.') : [];
  const timestamp = Number(timestampPart);
  if (!Number.isSafeInteger(timestamp) || !signature) return 'invalid';

  const expected = Buffer.from(sign(timestamp));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return 'invalid';

  const age = now - timestamp;
  if (age < MIN_FILL_TIME_MS) return 'too-fast';
  if (age > MAX_TOKEN_AGE_MS) return 'expired';
  return 'ok';
}

module.exports = { issue, verify };
