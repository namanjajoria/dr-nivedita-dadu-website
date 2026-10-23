'use strict';

const express = require('express');
const pages = require('../config/pages');
const { renderPage } = require('../controllers/pageController');

const router = express.Router();

router.get('/index.html', (req, res) => res.redirect(301, '/'));

for (const page of pages) {
  router.get(page.path, renderPage(page));
}

module.exports = router;
