const express = require('express');
const apiController = require('../controllers/apiController');
const chatRoutes = require('./chat');
const { requireAdminApi } = require('../middlewares/adminAuth');

const router = express.Router();

// ============================================================================
// Endpoint Status Server (Poin 2 Tugas)
// ============================================================================
router.get('/status', apiController.status);

// ============================================================================
// Endpoint REST API CRUD Resource Topics (Poin 2 Tugas)
// ============================================================================
// GET bersifat publik; POST/PUT/DELETE khusus admin (header X-Admin-Key) sesuai F-11
router.get('/topics', apiController.getAll);
router.get('/topics/:id', apiController.getById);
router.post('/topics', requireAdminApi, apiController.create);
router.put('/topics/:id', requireAdminApi, apiController.update);
router.delete('/topics/:id', requireAdminApi, apiController.delete);

// ============================================================================
// Endpoint AI Assistant berbasis Google Gemini (Week 9)
// ============================================================================
router.use('/chat', chatRoutes);

module.exports = router;
