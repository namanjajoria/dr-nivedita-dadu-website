'use strict';

const express = require('express');
const forms = require('../config/forms');
const { handleForm } = require('../controllers/formController');
const { formLimiter } = require('../middleware/rateLimiters');

const BODY_LIMIT = '16kb';
const router = express.Router();

router.use(express.json({ limit: BODY_LIMIT }));
router.use(express.urlencoded({ extended: false, limit: BODY_LIMIT, parameterLimit: 30 }));

// POST /api/appointment, /api/contact, /api/review, /api/newsletter
for (const formKey of Object.keys(forms)) {
  router.post(`/${formKey}`, formLimiter, handleForm(formKey));
}

router.use((req, res) => res.status(404).json({ ok: false, message: 'Not found.' }));

module.exports = router;
