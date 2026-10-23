'use strict';

const config = require('./config');
const { createApp } = require('./app');

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Website listening on port ${config.port} (${config.env}) - ${config.siteUrl}`);
  console.log(`Canonical site URL: ${config.siteUrl}`);
  if (!config.seo.allowIndexing) console.log('Search engine indexing is disabled (noindex + robots.txt Disallow).');
  if (!config.mail.enabled) {
    console.log(
      config.isProduction
        ? 'SMTP is not configured: forms will reply "temporarily unavailable" until it is.'
        : 'SMTP is not configured: form submissions are logged to the console, not emailed.',
    );
  }
  if (config.forms.secretIsEphemeral) console.log('FORM_SECRET is not set: using a temporary secret for this process.');
});

function shutdown(signal) {
  console.log(`${signal} received, closing server...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
