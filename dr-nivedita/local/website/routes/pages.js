'use strict';

const express = require('express');
const pages = require('../config/pages');
const { renderPage } = require('../controllers/pageController');

const router = express.Router();

router.get('/index.html', (req, res) => res.redirect(301, '/'));

// Pages marked `dynamic` are rendered from database content by their own router (routes/blog.js).
for (const page of pages) {
  if (!page.dynamic) router.get(page.path, renderPage(page));
}

module.exports = router;
