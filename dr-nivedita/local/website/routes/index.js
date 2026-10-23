'use strict';

const express = require('express');

const router = express.Router();

router.use(require('./seo'));
router.use('/api', require('./api'));
router.use(require('./pages'));

module.exports = router;
