'use strict';

const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

// Reads admin-managed content from the backend API (public GET endpoints).
//
// Never lets the API break a page:
//   - each endpoint is fetched with a short timeout; concurrent reads share one request
//   - successful reads are kept for API_CONTENT_CACHE_SECONDS; after that the cached copy is
//     still served while a fresh one is fetched in the background
//   - every successful read is also saved to CONTENT_SNAPSHOT_DIR, so after a restart
//     during an API outage the last good copy is still there
//   - with no copy at all, null is returned and the caller decides (fallback or 503)
// Returns null for every endpoint while API_BASE_URL is not set.
const cache = new Map(); // endpoint -> { data, fetchedAt }
const inFlight = new Map(); // endpoint -> Promise

function isEmpty(data) {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  return typeof data === 'object' && Object.keys(data).length === 0;
}

function snapshotFile(endpoint) {
  return path.join(config.contentSnapshotDir, `${endpoint.replace(/[^\w.-]+/g, '_')}.json`);
}

function readSnapshot(endpoint) {
  try {
    return JSON.parse(fs.readFileSync(snapshotFile(endpoint), 'utf8'));
  } catch {
    return null;
  }
}

function writeSnapshot(endpoint, data) {
  const file = snapshotFile(endpoint);
  const temp = `${file}.${process.pid}.tmp`;
  fs.promises
    .mkdir(config.contentSnapshotDir, { recursive: true })
    .then(() => fs.promises.writeFile(temp, JSON.stringify(data)))
    .then(() => fs.promises.rename(temp, file))
    .catch((error) => console.error(`[content] snapshot ${endpoint}: ${error.message}`));
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

function refresh(endpoint, fallback) {
  if (!inFlight.has(endpoint)) {
    inFlight.set(
      endpoint,
      fetchSection(endpoint)
        .then((data) => {
          cache.set(endpoint, { data, fetchedAt: Date.now() });
          if (data !== null) writeSnapshot(endpoint, data);
          return data;
        })
        .catch((error) => {
          const copy = fallback !== undefined ? fallback : readSnapshot(endpoint);
          console.error(`[content] /api/${endpoint}: ${error.message}${copy ? ' - using last good copy' : ' - no copy available'}`);
          if (copy !== null && copy !== undefined) cache.set(endpoint, { data: copy, fetchedAt: Date.now() });
          return copy ?? null;
        })
        .finally(() => inFlight.delete(endpoint)),
    );
  }
  return inFlight.get(endpoint);
}

async function getSection(endpoint) {
  if (!config.api.enabled) return null;

  const cached = cache.get(endpoint);
  if (!cached) return refresh(endpoint);

  const maxAgeMs = config.api.contentCacheSeconds * 1000;
  if (Date.now() - cached.fetchedAt < maxAgeMs) return cached.data;
  // Stale: answer from the cached copy now, update it for the next visitor.
  refresh(endpoint, cached.data);
  return cached.data;
}

// { endpoint: data | null } for every endpoint requested.
async function getSections(endpoints) {
  const values = await Promise.all(endpoints.map(getSection));
  return Object.fromEntries(endpoints.map((endpoint, i) => [endpoint, values[i]]));
}

module.exports = { getSection, getSections };
