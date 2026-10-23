'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');
const site = require('../config/site');
const { HttpError } = require('../utils/http');

// Delivers form submissions to the clinic inbox over SMTP (configured in .env).
// Without SMTP credentials: development logs the submission to the console,
// production refuses it so enquiries are never silently lost.
let transporter;

function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
  });
  return transporter;
}

function formatSubmission(form, values) {
  const lines = form.fields
    .filter((field) => values[field.name])
    .map((field) => `${field.label}: ${values[field.name]}`);
  lines.push('', `Submitted: ${new Date().toISOString()}`);
  return lines.join('\n');
}

async function sendSubmission(form, values) {
  const text = formatSubmission(form, values);

  if (!config.mail.enabled) {
    if (config.isProduction) {
      throw new HttpError(
        503,
        `Our online form is temporarily unavailable. Please call us on ${site.phone.display}.`,
      );
    }
    console.info(`[forms] ${form.title} (SMTP not configured, not emailed):\n${text}\n`);
    return { delivered: false };
  }

  await getTransporter().sendMail({
    from: config.mail.from,
    to: config.mail.to,
    replyTo: values.email || undefined,
    subject: `Website: ${form.title}`,
    text,
  });
  return { delivered: true };
}

module.exports = { sendSubmission };
