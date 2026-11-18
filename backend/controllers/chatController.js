const Topic = require('../models/topicModel');
const config = require('../config');
const { askTutor, AIServiceError } = require('../services/geminiService');
const metrics = require('../services/metricsService');
const { DEFAULT_LEVELS } = require('../utils/format');

/**
 * POST /api/chat
 * Menerima permintaan AI Tutor (sudah divalidasi middleware) dan mengembalikan respons AI.
 * Mode: ask | simplify | example | quiz | evaluate
 */
exports.chat = async (req, res) => {
  const started = Date.now();
  const { mode, sessionId } = req.chat;

  try {
    const result = await askTutor(req.chat);
    metrics.record({ mode, sessionId, success: true, statusCode: 200, durationMs: Date.now() - started, model: result.model });

    // Nama model internal tidak perlu dikirim ke frontend
    const { model, ...data } = result;
    res.json({ success: true, data: { ...data, level: req.chat.level } });
  } catch (err) {
    const statusCode = err instanceof AIServiceError ? err.statusCode : 500;
    if (!(err instanceof AIServiceError)) console.error('Chat error:', err);
    metrics.record({ mode, sessionId, success: false, statusCode, durationMs: Date.now() - started });

    res.status(statusCode).json({
      success: false,
      message: err instanceof AIServiceError ? err.message : 'Terjadi kesalahan saat memproses permintaan',
    });
  }
};

/**
 * GET /api/chat/metrics
 * Ringkasan Success Metrics PRD (M-01, M-02, M-03) dari log backend
 */
exports.metrics = (req, res) => {
  res.json({ success: true, data: metrics.getSummary() });
};

/**
 * GET /assistant
 * Menampilkan halaman AI Tutor (chat) pada frontend
 */
exports.page = async (req, res) => {
  let topics = [];
  try {
    topics = await Topic.getAll();
  } catch (err) {
    topics = [];
  }

  res.render('assistant', {
    judul: `AI Tutor - ${config.appName}`,
    namaApp: config.appName,
    activePage: 'assistant',
    topics,
    levels: DEFAULT_LEVELS,
    selectedTopicId: Number(req.query.topic) || null,
    selectedLevel: DEFAULT_LEVELS.includes(req.query.level) ? req.query.level : 'Pemula',
  });
};

/**
 * GET /riwayat
 * Menampilkan halaman Riwayat Chat (data diambil dari localStorage browser oleh history.js)
 */
exports.historyPage = (req, res) => {
  res.render('history', {
    judul: `Riwayat Belajar - ${config.appName}`,
    namaApp: config.appName,
    activePage: 'history',
  });
};
