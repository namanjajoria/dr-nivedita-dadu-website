'use strict';

const config = require('../config');
const { HttpError } = require('../utils/http');

// Forwards a validated form submission to the external backend.
//
// Dormant until API_BASE_URL is set: `forwarded: false` tells the caller to use
// the site's own delivery instead, so the website works with or without it.
// Nothing here is ever reachable from the browser - the base URL stays on the
// server and visitors only ever post to this site's own /api routes.

const GENERIC_ERROR =
  'We could not send your request right now. Please try again in a moment, or call us.';

function endpointUrl(path) {
  return config.api.baseUrl.replace(/\/+$/, '') + path;
}

async function forwardSubmission(form, values) {
  if (!config.api.enabled || !form.api) return { forwarded: false };

  let response;
  let body = {};

  try {
    response = await fetch(endpointUrl(form.api.endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(form.api.payload(values)),
      signal: AbortSignal.timeout(config.api.timeoutMs),
    });
    body = await response.json().catch(() => ({}));
  } catch (error) {
    // Timeout, DNS failure, connection refused: the operator needs the detail,
    // the visitor gets a message that gives nothing away.
    console.error(`[api] ${form.title}: backend unreachable (${error.message})`);
    throw new HttpError(502, GENERIC_ERROR);
  }

  // The backend signals failure by status and/or a success:false body.
  if (!response.ok || body.success === false) {
    const upstream = typeof body.message === 'string' ? body.message.trim() : '';
    console.error(`[api] ${form.title}: rejected with ${response.status} - ${upstream || 'no message'}`);

    // Its 4xx messages are written for visitors ("Please enter a valid email
    // address"), so they are safe to show. Its 5xx messages are raw database
    // errors, so those are replaced rather than leaked.
    const isServerError = response.status >= 500;
    return Promise.reject(
      new HttpError(isServerError ? 502 : 400, isServerError || !upstream ? GENERIC_ERROR : upstream),
    );
  }

  return { forwarded: true };
}

module.exports = { forwardSubmission };
