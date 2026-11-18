const express = require('express');
const webRoutes = require('./web');
const apiRoutes = require('./api');
const adminRoutes = require('./admin');

const router = express.Router();

// Hubungkan rute API dan rute Web
router.use('/api', apiRoutes);
router.use('/admin', adminRoutes);
router.use('/', webRoutes);

module.exports = router;

