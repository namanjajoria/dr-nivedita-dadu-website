'use strict';

const path = require('node:path');
const compression = require('compression');
const express = require('express');
const config = require('./config');
const routes = require('./routes');
const { securityHeaders } = require('./middleware/security');
const { permanentRedirects } = require('./middleware/redirects');
const { mediaStyles } = require('./middleware/mediaStyles');
const { notFound, errorHandler } = require('./middleware/errorHandlers');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(securityHeaders());
  app.use(compression());

  if (!config.seo.allowIndexing) {
    app.use((req, res, next) => {
      res.set('X-Robots-Tag', 'noindex, nofollow');
      next();
    });
  }

  app.use(permanentRedirects);

  app.use(mediaStyles);

  // CSS/JS URLs carry a content hash (utils/assets.js), so a long cache is safe in production.
  app.use(
    express.static(path.join(config.root, 'public'), {
      index: false,
      redirect: false,
      maxAge: config.isProduction ? '30d' : 0,
    }),
  );

  app.use(routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
