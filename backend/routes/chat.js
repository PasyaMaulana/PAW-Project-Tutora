const express = require('express');
const chatController = require('../controllers/chatController');
const validateChatInput = require('../middlewares/validateChatInput');
const rateLimiter = require('../middlewares/rateLimiter');
const gemini = require('../config/gemini');

const router = express.Router();

// ============================================================================
// Endpoint AI Tutor (Gemini)
// ============================================================================
// POST /api/chat  -> rate limiter (F-04) -> validasi input (F-04) -> controller
router.post('/', rateLimiter(gemini.rateLimit), validateChatInput, chatController.chat);

// GET /api/chat/metrics -> ringkasan Success Metrics PRD (M-01, M-02, M-03)
router.get('/metrics', chatController.metrics);

module.exports = router;
