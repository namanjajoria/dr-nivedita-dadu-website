'use strict';

const forms = require('../config/forms');
const formTokens = require('../services/formTokenService');
const { forwardSubmission } = require('../services/apiService');
const { sendSubmission } = require('../services/mailService');
const { sendStatusPage } = require('../services/statusPage');
const { validateFields } = require('../utils/validation');
const { HttpError, wantsJson } = require('../utils/http');

const TOKEN_MESSAGES = {
  invalid: 'Your form session is not valid. Please refresh the page and try again.',
  expired: 'Your form session has expired. Please refresh the page and try again.',
  'too-fast': 'That was a little too quick. Please check your details and submit again.',
};

function respond(req, res, form, status, message, errors) {
  const ok = status < 400;
  if (wantsJson(req)) {
    return res.status(status).json(errors ? { ok, message, errors } : { ok, message });
  }
  return sendStatusPage(res, {
    status,
    heading: ok ? 'Thank you' : 'Please check your details',
    message,
    primaryHref: form.returnTo,
    primaryLabel: 'Back to the website',
  });
}

function handleForm(formKey) {
  const form = forms[formKey];

  return async function formHandler(req, res) {
    const input = req.body && typeof req.body === 'object' ? req.body : {};

    // Honeypot: the "website" field is hidden from people. Bots that fill it get a
    // normal-looking success response and nothing is sent.
    if (typeof input.website === 'string' && input.website.trim() !== '') {
      return respond(req, res, form, 200, form.success);
    }

    const tokenState = formTokens.verify(input._ft);
    if (tokenState !== 'ok') {
      return respond(req, res, form, 400, TOKEN_MESSAGES[tokenState]);
    }

    const { values, errors } = validateFields(form.fields, input);
    if (Object.keys(errors).length) {
      return respond(req, res, form, 422, Object.values(errors).join(' '), errors);
    }

    try {
      // Hand the submission to the external backend when one is configured;
      // otherwise deliver it the way this site always has.
      const { forwarded } = await forwardSubmission(form, values);
      if (!forwarded) await sendSubmission(form, values);
    } catch (error) {
      // Answer in the same shape as every other outcome (JSON or themed page)
      // instead of falling through to the generic error handler.
      if (error instanceof HttpError) {
        return respond(req, res, form, error.status, error.message);
      }
      throw error;
    }

    return respond(req, res, form, 200, form.success);
  };
}

module.exports = { handleForm };
