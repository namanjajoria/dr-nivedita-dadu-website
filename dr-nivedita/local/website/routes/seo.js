'use strict';

const express = require('express');
const { robotsTxt, sitemapXml } = require('../controllers/seoController');

const router = express.Router();

router.get('/robots.txt', robotsTxt);
router.get('/sitemap.xml', sitemapXml);

module.exports = router;
