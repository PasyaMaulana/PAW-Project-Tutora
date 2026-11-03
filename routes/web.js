const express = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

// Halaman Frontend Utama
router.get('/', homeController.index);

module.exports = router;

