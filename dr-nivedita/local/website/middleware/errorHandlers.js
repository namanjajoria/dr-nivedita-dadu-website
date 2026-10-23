'use strict';

const config = require('../config');
const { sendStatusPage } = require('../services/statusPage');
const { HttpError, wantsJson } = require('../utils/http');

const isApiRequest = (req) => req.path.startsWith('/api/');

function notFound(req, res) {
  if (isApiRequest(req)) return res.status(404).json({ ok: false, message: 'Not found.' });
  return sendStatusPage(res, {
    status: 404,
    label: '404',
    heading: 'Page not found',
    message: 'The page you are looking for does not exist or may have moved.',
  });
}

// Central error handler: logs server faults, never exposes stack traces or file paths.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = Number(err.status || err.statusCode) || 500;
  if (status < 400 || status > 599) status = 500;

  let message = 'Something went wrong on our side. Please try again shortly.';
  if (err instanceof HttpError) message = err.message;
  else if (err.type === 'entity.too.large') message = 'The submitted data is too large.';
  else if (status < 500) message = 'The request could not be processed.';

  if (status >= 500) console.error(config.isProduction ? `[error] ${err.message}` : err);

  if (isApiRequest(req) && wantsJson(req)) return res.status(status).json({ ok: false, message });
  return sendStatusPage(res, { status, heading: status >= 500 ? 'Something went wrong' : 'Request not processed', message });
}

module.exports = { notFound, errorHandler };
