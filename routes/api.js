const express = require('express');
const apiController = require('../controllers/apiController');

const router = express.Router();

// ============================================================================
// Endpoint Status Server (Poin 2 Tugas)
// ============================================================================
router.get('/status', apiController.status);

// ============================================================================
// Endpoint REST API CRUD Resource Topics (Poin 2 Tugas)
// ============================================================================
router.get('/topics', apiController.getAll);
router.get('/topics/:id', apiController.getById);
router.post('/topics', apiController.create);
router.put('/topics/:id', apiController.update);
router.delete('/topics/:id', apiController.delete);

module.exports = router;
