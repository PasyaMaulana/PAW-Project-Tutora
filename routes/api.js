const express = require('express');
const apiController = require('../controllers/apiController');

const router = express.Router();

// Endpoint Poin 2 Tugas: GET /api/status dan GET /api/produk
router.get('/status', apiController.status);
router.get('/produk', apiController.produk);

module.exports = router;

