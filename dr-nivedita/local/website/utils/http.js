'use strict';

// An error whose message is safe to show to visitors.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// Forms submitted with fetch() get JSON; plain HTML form posts (no JavaScript) get a page.
function wantsJson(req) {
  return Boolean(req.is('application/json')) || req.accepts(['html', 'json']) === 'json';
}

module.exports = { HttpError, wantsJson };
