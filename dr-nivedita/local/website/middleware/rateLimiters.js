'use strict';

const { rateLimit } = require('express-rate-limit');
const config = require('../config');
const site = require('../config/site');
const { sendStatusPage } = require('../services/statusPage');
const { wantsJson } = require('../utils/http');

const LIMIT_MESSAGE = `Too many submissions from this device. Please wait a few minutes or call us on ${site.phone.display}.`;

// Per-IP limit shared by all form endpoints. Behind a proxy set TRUST_PROXY so the
// real client IP is used.
const formLimiter = rateLimit({
  windowMs: config.forms.rateLimit.windowMs,
  limit: config.forms.rateLimit.max,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(req, res) {
    if (wantsJson(req)) return res.status(429).json({ ok: false, message: LIMIT_MESSAGE });
    return sendStatusPage(res, { status: 429, heading: 'Please wait a moment', message: LIMIT_MESSAGE });
  },
});

module.exports = { formLimiter };
