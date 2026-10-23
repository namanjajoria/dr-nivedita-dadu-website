'use strict';

const config = require('../config');

// Reads admin-managed content sections from the backend API (public GET endpoints).
//
// Never lets the API break a page:
//   - each section is fetched with a short timeout, all sections in parallel
//   - successful reads are cached for API_CONTENT_CACHE_SECONDS
//   - if a read fails, the last good copy is used; if there is none, null is returned
//     and the page falls back to its bundled default content (content/*.json)
// Returns null for every section while API_BASE_URL is not set.
const cache = new Map(); // endpoint -> { data, fetchedAt }
const inFlight = new Map(); // endpoint -> Promise

function isEmpty(data) {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  return typeof data === 'object' && Object.keys(data).length === 0;
}

async function fetchSection(endpoint) {
  const url = `${config.api.baseUrl.replace(/\/+$/, '')}/api/${endpoint}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(config.api.contentTimeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.json();
  if (body.success === false) throw new Error(body.message || 'success:false');
  // An empty section means "never saved in the admin": treat it as no content.
  return isEmpty(body.data) ? null : body.data;
}

async function getSection(endpoint) {
  if (!config.api.enabled) return null;

  const cached = cache.get(endpoint);
  const maxAgeMs = config.api.contentCacheSeconds * 1000;
  if (cached && Date.now() - cached.fetchedAt < maxAgeMs) return cached.data;

  if (!inFlight.has(endpoint)) {
    inFlight.set(
      endpoint,
      fetchSection(endpoint)
        .then((data) => {
          cache.set(endpoint, { data, fetchedAt: Date.now() });
          return data;
        })
        .catch((error) => {
          console.error(`[content] /api/${endpoint}: ${error.message}${cached ? ' - using last good copy' : ' - using default content'}`);
          return cached ? cached.data : null;
        })
        .finally(() => inFlight.delete(endpoint)),
    );
  }
  return inFlight.get(endpoint);
}

// { endpoint: data | null } for every endpoint requested.
async function getSections(endpoints) {
  const values = await Promise.all(endpoints.map(getSection));
  return Object.fromEntries(endpoints.map((endpoint, i) => [endpoint, values[i]]));
}

module.exports = { getSections };
